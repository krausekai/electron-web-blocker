//	Copyright (c) Kai Krause <kaikrause95@gmail.com>

var _this = module.exports = {};

var fs = require("fs");
var path = require("path");

var helperFunctions = require("./util/helperFunctions");
var file = require("./util/file");

var hostsLocation = path.join(__dirname, "hosts.txt");

// --------------------------
// HELPER FUNCTIONS
// --------------------------

// use regex to find the columns, since the dict file is not correctly delimited
var commentsReg = new RegExp(/#.+/, "g"); // replace comments starting with #
var localAddressReg = new RegExp(/(127\.|0\.){3}\d/, "g"); // replace 0.0.0.0, 127.0.0.1, etc
var whitespaceReg = new RegExp(/\s/, "g"); // remove all whitespace
let httpPrefixReg = new RegExp(/^http(.)+\/\/(www\.|)/, "g"); // remove HTTP www. prefix
var wwwReg = new RegExp(/^www./, "g"); // remove www. prefix
var pipeReg = new RegExp(/^\|\|/, "g"); // remove double pipe prefix
var caratReg = new RegExp(/\^.+/, "g"); // remove everything from ^ suffix
var colonReg = new RegExp(/::/, "g"); // remove double colons
var dnsmasqPreReg = new RegExp(/^address\=\//, "g"); // remove double colon prefix
var endSlashReq = new RegExp(/\//, "g"); // remove slashes

function prepareRow(row) {
	row = row.replace(commentsReg, "");
	row = row.replace(localAddressReg, "");
	row = row.replace(httpPrefixReg, "");
	row = row.replace(wwwReg, "");
	row = row.replace(pipeReg, "");
	row = row.replace(caratReg, "");
	row = row.replace(colonReg, "");
	row = row.replace(dnsmasqPreReg, "");
	// only after
	row = row.replace(whitespaceReg, "");
	row = row.replace(endSlashReq, "");
	return row;
}

_this.prepareArr = function(arr) {
	var newArr = [];

	if (typeof arr === "string") arr = arr.split(/\r?\n/);
	else if (!Array.isArray(arr)) throw "not a string or array";

	// format the file data
	for (var i = 0; i < arr.length; i++) {
		var row = prepareRow(arr[i]);
		if (row !== "") newArr.push(row);
	}

	newArr = helperFunctions.uniqueArray(newArr);
	return newArr;
}

_this.indexArr = function(arr) {
	if (typeof arr === "string") arr = arr.split(/\r?\n/);
	else if (!Array.isArray(arr)) throw "not a string or array";

	var index = {};
	for (var i = 0; i < arr.length; i++) {
		// get the first character
		var firstChar = arr[i][0];

		// create new named array from character if it does not exist
		if (index && !index[firstChar]) {
			index[firstChar] = [];
		}

		// add term row index to character array, if index does not already exist
		if (index && index[firstChar] && index[firstChar].indexOf(i) === -1) {
			index[firstChar].push(i)
		}
	}

	return index;
}

// --------------------------
// UPDATE FILE
// --------------------------

var path = "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts";
var updateNow = false;
var updateAfterSeconds = "259200"; // 3 days

function updateFile() {
	return new Promise(async function (resolve) {
		if (!path) return resolve();

		// rate-limit how often to update the file
		if (file_properties && file_properties.lastModifiedDate) {
			if (updateNow || helperFunctions.elapsedSeconds(file_properties.lastModifiedDate, updateAfterSeconds)) {
				updateNow = false;

				// get updated data
				if (path.startsWith("http")) {
					var data = await helperFunctions.download(path);
				}
				else if (file.fileExistsHelper(path)) {
					var data = fs.readFileSync(path, "utf-8");
				}
				else {
					throw "Invalid update path";
				}

				// save it
				if (data) fs.writeFileSync(hostsLocation, data);
			}
		}

		resolve();
	});
}

// --------------------------
// LOAD FILE
// --------------------------

var fileData = [];
var fileIndex = {};

function loadFile() {
	return new Promise(function (resolve) {
		if (!path) return resolve();

		if (file.fileExists(hostsLocation)) {
			var data = fs.readFileSync(hostsLocation, "utf-8");
			if (!data) throw "Could not load in data from hosts file";

			fileData = _this.prepareArr(data);
			fileIndex = _this.indexArr(fileData);
		}

		resolve();
	});
}

// --------------------------
// MAIN
// --------------------------

var file_properties = {};
_this.initialize = function(opts) {
	return new Promise(function (resolve) {
		if (opts) {
			if (typeof opts.path === "string") path = opts.path; // allow empty strings
			updateNow = opts.updateNow || updateNow;
			updateAfterSeconds = opts.updateAfterSeconds || updateAfterSeconds;
		}

		file_properties.path = hostsLocation;
		file_properties = file.isModified(file_properties);

		updateFile()
			.then(() => {return loadFile()})
			.then(() => {return resolve()});
	});
}

_this.getHosts = function() {
	return {
		hostsData: fileData,
		hostsIndex: fileIndex
	}
}
