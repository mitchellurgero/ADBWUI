 function pageLoad(page){
 	document.title = "Loading..."
 	document.getElementById("page-wrapper").innerHTML = "<p>Loading " + page + ", Please wait...</p>";
 	load(true);
 	$.ajax({
		method:'post',
		url:'../options',
		data:{
			tool:"page",
			page:page
		},
		success:function(result) {
			document.getElementById("page-wrapper").innerHTML = result;
			document.title = capitalizeFirstLetter(page);
			load(false);
		}
		}).fail(function(e) {
			document.getElementById("page-wrapper").innerHTML = "Loading the page failed. Please try again.";
			genModal("Error", "Loading the page failed. Please try again.");
			load(false);
		});
}
function load(type){
	if(type === true){
		$("#coverlay").show();
		document.getElementById("loadAnim").style.display = '';
	} else {
		$("#coverlay").hide();
		document.getElementById("loadAnim").style.display = 'none';
	}
}
function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
function getDevices(){
	load(true);
	document.getElementById("devices").innerHTML = "Getting Devices List, please wait...";
 	$.ajax({
		method:'post',
		url:'../options',
		data:{
			tool:"list"
		},
		success:function(result) {
			document.getElementById("devices").innerHTML = result;
			load(false);
		}
		}).fail(function(e) {
			document.getElementById("devices").innerHTML = "Loading the devices failed. Please try again.";
			genModal("Error", "<pre>" + e.toString() + "</pre>");
			load(false);
		});
	
}
function installAPK(){
	load(true);
 	$.ajax({
		method:'post',
		url:'../options',
		data:{
			tool:"install"
		},
		success:function(result) {
			genModal("Installation Result", "<pre>" + result + "</pre>");
			load(false);
		}
		}).fail(function(e) {
			genModal("Error", "<pre>" + e.toString() + "</pre>");
			load(false);
		});
	
}
function setDevice(serialno){
	load(true);
 	$.ajax({
		method:'post',
		url:'../options',
		data:{
			tool:"set",
			serial:serialno
		},
		success:function(result) {
			genModal("Information", "<pre>" + result + "</pre>");
			load(false);
		}
		}).fail(function(e) {
			genModal("Error", "<pre>" + e.toString() + "</pre>");
			load(false);
		});
	
}
function customCommand(){
	load(true);
	$.ajax({
		method:'post',
		url:'../options',
		data:{
			tool:"custom",
			type:document.getElementById("type").value,
			command:document.getElementById("command").value
		},
		success:function(result) {
			genModal("Command Result", "<pre>" + result + "</pre>");
			load(false);
		}
		}).fail(function(e) {
			genModal("Error", "<pre>" + e.Message + "</pre>");
			load(false);
		});
}
function reboot(type){
	load(true);
	$.ajax({
		method:'post',
		url:'../options',
		data:{
			tool:"reboot",
			type:type
		},
		success:function(result) {
			genModal("Command Result", "<pre>" + result + "</pre>");
			load(false);
		}
		}).fail(function(e) {
			genModal("Error", "<pre>" + e.Message + "</pre>");
			load(false);
		});
}
function getProp(){
	if(document.getElementById("page-wrapper").innerHTML == "You must first select a device in the Dashboard!"){
		return; //Do not continue because a device is not selected. lol
	}
	load(true);
	$.ajax({
		method:'post',
		url:'../options',
		data:{
			tool:"prop"
		},
		success:function(result) {
			//genModal("Command Result", "<pre>" + result + "</pre>");
			document.getElementById("prop").innerHTML = result;
			load(false);
		}
		}).fail(function(e) {
			genModal("Error", "<pre>" + e.Message + "</pre>");
			load(false);
		});
}
function genModal(head, body){
	document.getElementById("genModalHeader").innerHTML = head;
	document.getElementById("genModalBody").innerHTML = body;
	$("#genModal").modal('show');
}