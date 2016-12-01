# ADBGUI - Web UI

## Description

An Open Source, Cross-Platform, Android Debug Bridge Web Interface written in NodeJS.

It has many features including, but not limited to:
- Installing APK's
- Rebooting the device into different modes
- TWRP integration
- Fastboot integration
- Run a Android Backup of the device (NOT NANDROID BACKUP, but built in android backup)
- Sideload zip files
- Gather device information
- Custom Commands can be sent

## Warnings

- This software is NOT meant to be internet facing, do not open port 8080 on your computer and router while running this software.
- This software is a web app that runs on your computer. It DOES NOT HAVE AN AUTHENTICATION MECHANISM. 
- Anything done in adb shell can result in a soft brick. (Whether in ADBWUI, using ADB.exe, etc)
- This software is extremely beta - it may or may not have a ton of bugs.

## Installing ADBWUI

Installing ADBWUI is fairly simple:

### Windows Installation:

1. Install NodeJS from [here.](https://nodejs.org/en/download/)
2. After installing NodeJS, download and unzip ADBWUI to a folder of your choice.
3. Open up Command Prompt and CD into the ADBWUI directory and run:
```npm install```
4. After the command is done run the following to start the ADBWUI server:
```node index.js```
5. Open your web browser to: **http://localhost:8080** to get the interface loaded!

### Linux Installation:

Linux installation is pretty much the same as Windows, except also you need to:
```sudo apt-get install android-tools-adb && sudo apt-get install android-tools-fastboot```

## Issues

Issues can be submitted to the github issues for ADBWUI.