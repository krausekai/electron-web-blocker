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

_this.download = async function(path, encoding, timeout) {
	return new Promise((resolve, reject) => {
		let timer = null;
		function createTimeout() {
			if (timeout === 0) return;
			if (!timer) timeout = timeout || 3000;
			if (timer) clearTimeout(timer);

			timer = setTimeout(() => {
				console.error("Timed out:", path);
				resolve("");
			}, timeout);
		}
		createTimeout();

		adapterFor(path).get(path, (resp) => {
			resp.setEncoding(encoding || "utf8");

			let data = "";

			if (okStatusCodes.indexOf(resp.statusCode.toString()) === -1) {
				console.error(resp.statusCode.toString() + ":", path);
				resolve(data);
			}

			resp.on("data", (chunk) => {
				createTimeout();
				data += chunk;
			});

			resp.on("end", () => {
				clearTimeout(timer);
				resolve(data);
			});
		}).on("error", (e) => {
			clearTimeout(timer);
			console.error(e, path);
			resolve("");
		});
	});
}
