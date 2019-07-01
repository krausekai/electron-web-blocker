var _this = module.exports = {};

var fs = require('fs');

_this.fileExistsHelper = function(path) {
	try {
		return fs.statSync(path).isFile();
	}
	catch (e) {
		return false;
	}
}

_this.fileExists = function(path) {
	// Create file if it does not exist
	if (!_this.fileExistsHelper(path)) {
		try{
			fs.writeFileSync(path, "", {flag: 'wx'});
		}
		catch(e) {
			// return existence state of file
			return _this.fileExistsHelper(path);
		}
	}
	// return existence state of file
	return _this.fileExistsHelper(path);
}

_this.getModifiedTime = function(path) {
	return fs.statSync(path).mtimeMs;
}

_this.isModified = function(properties) {
	if (_this.fileExistsHelper(properties.path)) {
		var currentDate = _this.getModifiedTime(properties.path);
		if (!properties.lastPath || !properties.lastModifiedDate || properties.lastPath !== properties.path || currentDate > properties.lastModifiedDate) {
			properties.lastPath = properties.path;
			properties.lastModifiedDate = currentDate;
			properties.modified = true;
			return properties;
		}
	}
	properties.modified = false;
	return properties;
}
