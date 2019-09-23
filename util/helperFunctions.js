var _this = module.exports = {};

_this.elapsedSeconds = function(time, expectedTime) {
	var currentTime = Date.now();
	var difference = (currentTime - parseInt(time)) / 1000;
	if (difference > expectedTime) {
		return true;
	}
	else {
		return false;
	}
}

/* Return a unique array - Source: https://stackoverflow.com/a/9229821 */
_this.uniqueArray = function(a) {
	var seen = {};
	var out = [];
	var len = a.length;
	var j = 0;
	for(var i = 0; i < len; i++) {
		var item = a[i];
		if(seen[item] !== 1) {
		seen[item] = 1;
		out[j++] = item;
		}
	}
	return out;
}

// https://stackoverflow.com/questions/15317902/node-js-automatic-selection-of-http-get-vs-https-get
var url = require("url");
var http = require("http");
var https = require("https");

var adapterFor = (function() {
	var adapters = {
		"http:": http,
		"https:": https
	};

  return function(path) {
    return adapters[url.parse(path).protocol];
  }
}());

var okStatusCodes = ["200", "201", "202", "203", "206", "207", "208", "266"];

_this.download = async function(path) {
	return new Promise((resolve, reject) => {
		adapterFor(path).get(path, (resp) => {
			let data = "";

			if (okStatusCodes.indexOf(resp.statusCode) === -1) {
				console.error(resp.statusCode);
				resolve(data);
			}

			resp.on("data", (chunk) => {
				data += chunk;
			});

			resp.on("end", () => {
				resolve(data);
			});
		}).on("error", (e) => {
			console.error(e);
		});
	});
}
