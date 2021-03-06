//	Copyright (c) Kai Krause <kaikrause95@gmail.com>

var _this = module.exports = {};

var hostsSetup = require("./hostsSetup");
var helperFunctions = require("./util/helperFunctions");

var hosts = {};
var hostsData = [];
var hostsIndex = {};

var userblacklist = [];
var userblacklistIndex = {};
var userwhitelist = [];

function getHostData() {
	hosts = hostsSetup.getHosts();
	hostsData = hosts.hostsData;
	hostsIndex = hosts.hostsIndex;
}

_this.blacklist = {
	add : function(arr) {
		if (arr) {
			arr = hostsSetup.prepareArr(arr);
			userblacklist = helperFunctions.uniqueArray([...userblacklist, ...arr]);
			userblacklistIndex = hostsSetup.indexArr(userblacklist);
		}
	},
	remove : function(arr) {
		if (arr) {
			arr = hostsSetup.prepareArr(arr);
			for (let i = 0; i < arr.length; i++) {
				let index;
				while (index = userblacklistIndex.indexOf(arr[i]), index !== -1) {
					userblacklistIndex.splice(index, 1);
				}
			}
			userblacklistIndex = hostsSetup.indexArr(userblacklist);
		}
	},
	reset : function() {
		userblacklist = [];
		userblacklistIndex = {};
	},
	get : function() {
		return userblacklist;
	}
}

_this.whitelist = {
	add : function(arr) {
		if (arr) {
			arr = hostsSetup.prepareArr(arr);
			userwhitelist = helperFunctions.uniqueArray([...userwhitelist, ...arr]);
		}
	},
	remove : function(arr) {
		if (arr) {
			arr = hostsSetup.prepareArr(arr);
			for (let i = 0; i < arr.length; i++) {
				let index;
				while (index = userwhitelist.indexOf(arr[i]), index !== -1) {
					userwhitelist.splice(index, 1);
				}
			}
		}
	},
	reset : function() {
		userwhitelist = [];
	},
	get : function() {
		return userwhitelist;
	}
}

var updateTimer;
_this.init = async function(opts) {
	return new Promise(async function (resolve,reject) {
		try {
			if (updateTimer) {
				clearInterval(updateTimer);
				updateTimer = null;
			}

			if (opts && opts.updateAfterSeconds) {
				updateTimer = setInterval(() => {
					_this.init(opts);
				}, opts.updateAfterSeconds * 1000);
			}

			await hostsSetup.initialize(opts);

			getHostData();

			if (opts && opts.blacklist) _this.blacklist.add(opts.blacklist);
			if (opts && opts.whitelist) _this.whitelist.add(opts.whitelist);

			return resolve();
		}
		catch(e) {
			return reject(e);
		}
	});
}

var httpPrefixReg = new RegExp(/^http(.)+\/\/(www\.|)/, "g");

_this.isBlacklisted = function(url) {
	if (!url) throw "isBlacklisted requires a URL in string format";

	url = url.replace(httpPrefixReg, "");

	var checkIndex = function(arr, index) {
		if (!index) return;
		for (var i = 0; i < index.length; i++) {
			var row = arr[index[i]];
			if (userwhitelist.indexOf(row) === -1) {
				if (row.startsWith("*.")) {
					var wRow = row.substring(2);
					if (!url.startsWith(wRow) && url.contains(wRow)) return true;
				}
				else if (url.startsWith(row)) return true;
			}
		}
	}

	var res = undefined;
	if (res === undefined) res = checkIndex(hostsData, hostsIndex[url[0]]);
	if (res === undefined) res = checkIndex(userblacklist, userblacklistIndex[url[0]]);

	if (res !== undefined) return res;
	else return false;
}

_this.filter = function(view, opts) {
  const options = Object.assign({}, {
		logger: undefined, // e.g. console.log
		onRequest: undefined
	}, opts);

  view.webContents.session.webRequest.onBeforeRequest({urls: ["*://*/*"]}, (details, callback) => {
    var isBlacklisted = _this.isBlacklisted(details.url);

		if (options.onRequest) {
			options.onRequest(details, callback, isBlacklisted);
		}
		else if (isBlacklisted) {
			if (options.logger) options.logger("Hosts Blocked: " + details.url);
      callback({ cancel: true });
		}
		else {
      callback({ cancel: false });
    }
  });
}
