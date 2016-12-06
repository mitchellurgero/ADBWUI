var express = require('express');
var exec = require('child_process').execSync;
var fs = require('fs');
var app = express();
var multer  = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'files/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
var upload = multer({storage: storage});
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
//Configuration options:

var choosenDevice = ""; //This is the serial number of the device choosen in the web interface and remains choosen across sessions :)

app.use('/', express.static('public'));

//For file uploads.
var cpUpload = upload.fields([{ name: 'file', maxCount: 1 }])
app.post('/upload', cpUpload, function (req, res, next) {
	console.log(req.files['file']);
	res.send('<html><head><meta http-equiv="refresh" content="3; url=index.html" /></head><body><br><br><center><h3>Upload complete!</h3><br><a href="index.html">Click here if your browser does not automatically redirect you.</a></center></body></html>');
})

//for commands / tools
app.post('/options', function (req, res) {
	console.info(req.body);
	//Check if a device is connected before we continue. (Except with a couple exceptions)
	if(choosenDevice == "" && req.body.tool !== "list" && req.body.tool !== "set" && choosenDevice !== "bypassme" && req.body.page !== "about"){
		res.send("You must first select a device in the Dashboard!");
		return;
	} else {
		console.log("Choosen Device = " + choosenDevice);
	}
	//Check if the choosen device is still connected.
	if(!isConnected() && choosenDevice !== "" && req.body.tool !== "list"){
		console.log("Device " + choosenDevice + " is no longer connected!");
		res.send("The device '" + choosenDevice + "' is no longer connected. Please go to the dashboard and select a new device.");
		choosenDevice = "";
		return;
	}
	//Switch to check what type of command, page, etc we need to load or run. Pretty basic stuff. Might add authentication (Maybe not since this web app should ONLY RUN ON LOCALHOST!!!
	switch(req.body.tool){
		case "page":
		//Load the selected page file.
			var page = req.body.page + ''.replace("..","");
			fs.readFile('./public/pages/' + page + '.html', 'utf8', function (err,data) {
			if (err) {
				res.send("There was an error loading that page, please check console for details");
				return console.log(err);
			}
			res.send(data);
			});
			break;
		case "set":
		//Set the choosen device for this server session (Not client session)
			choosenDevice = req.body.serial;
			//This bypassme will be removed at release time as it is only needed during debugging.
			if(req.body.serial == "bypassme"){
				res.send("You are now bypassing serial number checks. All commands from this point forward are now set to launch on the first connected device no matter what!\r\nIn order to reverse this action please restart ADBWUI, or choose an actual device!");
				break;
			}
			res.send("You set your device to '" + req.body.serial + "'!");
			break;
		case "install":
			//Installing APK.
			var string = run("adb -s " + choosenDevice + " install files/" + req.body.apkname);
			res.send(string);
			break;
		case "fastboot":
		//Obvious.
			var command = req.body.com;
			//run command
			var string = run("fastboot -s " + choosenDevice + " " + command);
			res.send(string);
			break;
		case "recovery":
		//Also obvious.
			var command = req.body.com;
			//run command
			if(command == "wipe system"){
				if(state == "recovery"){
					var string = run("adb shell -s " + choosenDevice + " twrp wipe system");
					string += "\r\n" + run("adb shell -s " + choosenDevice + " twrp wipe data");
					res.send(string);
				} else if(state !== "recovery"){
					res.send("Device is not in recovery mode, please reboot into recovery and try again.");
				} else {
					res.send("There was an issue running the command. Is the device plugged in?");
				}
			} else {
				var state = getDeviceState(choosenDevice);
				if(state == "recovery"){
					var string = run("adb shell -s " + choosenDevice + " twrp " + command);
					res.send(string);
				} else if(state !== "recovery"){
					res.send("Device is not in recovery mode, please reboot into recovery and try again.");
				} else {
					res.send("There was an issue running the command. Is the device plugged in?");
				}
			}
			break;
		case "prop":
		//Get build.prop from device 
			var pr = getBuildProp();
			var string = "";
			if (pr.length === 0 || !pr){
				string = "For some reason, I am unable to view the build.prop file. Please see console for more details (if any).";
			} else {
				for(var i = 0; i < pr.length; ++i){
					string += "<tr><td>" + pr[i] + "</td></tr>";
				}
			}
			res.send(string);
			break;
		case "getapks":
		//Get build.prop from device 
			var pr = getFiles("apk");
			var string = "";
			if (pr.length === 0 || !pr){
				string = "For some reason, I cannot get a list of files. Please see console for more details (if any).";
			} else {
				for(var i = 0; i < pr.length; ++i){
					string += '<tr><td><a href="#" onclick="installAPK(\'' + pr[i] + '\')">' + pr[i] + "</a></td></tr>";
				}
			}
			res.send(string);
			break;
		case "custom":
		//Ohhhh nice, custom commands :D
			var string = "";
			var command = req.body.command;
			var type = req.body.type;
			string = run(type + " -s " + choosenDevice + " " + command);
			res.send(string);
			break;
		case "reboot":
		//Reboot the device with given args.
			var string = run("adb -s " + choosenDevice + " reboot " + req.body.type);
			if(string.startsWith("error")){
				res.send(string);
			} else {
				res.send("Device should now be rebooting to '" + req.body.type + "'\r\n Please check device for reboot");
			}
			break;
		case "getState":
		//Get choosen devices state
			var state = getDeviceState(choosenDevice);
			if(state){
				res.send(state);
			} else {
				res.send("That device is either not responding to ADB commands, or is not connected to the computer.");
			}
		case "list":
		//Get a list.
			var devs = parseDevices();
			//console.info(devs);
			var string = "";
			if(devs === false){
				res.send("ADB was not found on this computer, please install it!");
				break;
			}
			if (devs.length === 0 || !devs){
				string = "No devices currently connected!";
			} else {
				for(var i = 0;i < devs.length; i++){
					string += '<tr><td><a href="#" onclick="setDevice(\''+ devs[i] +'\')">' + devs[i] + "</a></td><td>" + getDeviceState(devs[i]) + "</td></tr>";
				}
			}
			res.send(string);
			break;
		default:
		//Nothing could be done with the selected command / tool so return bs string.
			res.send("The command '" + req.body.tool + "' was not found as an option. Please try again.");
			break;
	}
});
//Start the web server.
app.listen(8080, function () {
  console.log('ADBGUI Web UI is listening on port 8080!')
});

//Functions

//Runs a given command via console.
function run(command){
	console.log("RUNNING: " + command);
	var result = exec(command, (error, stdout, stderr) => {
		var string = "";
	if (error) {
		//console.error(`exec error: ${error}`);
		string += "ERROR, CHECK CONSOLE\r\n" + error;
		return false;
	}
	if(stderr !== ""){
		return stderr + "\r\n" + stdout;
	}
	//console.log(`stdout: ${stdout}`);
	return stdout + '';
	//console.log(`stderr: ${stderr}`);
	});
	return result + '';
}
//Gets a list of devices and returns it as an array.
function parseDevices(){
	var string = run("adb devices");
	var newString = string.replace(/\r/g, "");
	var connectedDevices = newString.split("\n");
	connectedDevices.clean();
	var conDevices = [];
	//Do parsing of command output here.
	connectedDevices.shift();
	if(connectedDevices.length == 0){
		conDevices.push("No devices connected");
	} else {
		for(var i = 0; i < connectedDevices.length; ++i){
			var temp = connectedDevices[i].split("\t");
			if(temp[0] == "" || temp[0].startsWith("*")){
				continue;
			} else {
				conDevices.push(temp[0]);
			}
			
		}
	}
	
	return conDevices;
}
//Gets given devices state as string
function getDeviceState(serialno){
	if(isConnected()){
		var a = run("adb devices");
		var newString = a.replace(/\r/g, "");
		var connectedDevices = newString.split("\n");
		connectedDevices.clean();
		//Do parsing of command output here.
		connectedDevices.shift();
		if(connectedDevices.length == 0){
			return false;
		} else {
			for(var i = 0; i < connectedDevices.length; ++i){
				var temp = connectedDevices[i].split("\t");
				if(temp[0] == "" || temp[0].startsWith("*")){
					continue;
				} else {
					if(temp[0] == serialno){
						return temp[1];
					}
				}
			}
			return false;
		}
	}
}
//Checks to see if the choosen device is connected still. Returns boolean.
function isConnected(){
	console.log("Checking if '" + choosenDevice + "' is connected...");
	var devices = parseDevices();
	var found = (devices.indexOf(choosenDevice) > -1);
	if(choosenDevice == "bypassme" || found > -1 && devices.length > 0){
		return true;
	} else {
		return false;
	}
}
//Get Choosen Devices build.prop and returns it as an array.
function getBuildProp(){
	var string = run("adb -s " + choosenDevice + " shell getprop");
	var newString = string.replace(/\r/g, "");
	var props = newString.split("\n");
	return props;
}
function getFiles(filetype){
	console.log("Getting list of apks from folder");
	var files = fs.readdirSync("files/");
	var f = [];
	for(var i = 0; i < files.length; i++){
			var temp = files[i].split(".");
			if(temp[temp.length - 1] == filetype){
				f.push(files[i]);
			} else if (filetype === null) {
				f.push(files[i]);
			}
	}
	return f;
}
//Prototypes:
Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
