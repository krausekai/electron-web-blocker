
# Electron Web Blocker

Detects whether a URL should be blocked, such as advertisements, malware, or any other defined file of web addresses (e.g. from a hosts file). The default internal web address list file is obtained from [StevenBlack's hosts file](https://github.com/StevenBlack/hosts).

- Can be used generically by calling ``isBlacklisted("example.com")``,
- Can take an Electron ``BrowserWindow`` or ``BrowserView`` as parameter of ``filter()``

### Getting Started

```sh
$ npm install electron-web-blocker
```

### File format of web addresses

This module expects the following format:

```
example.com
subdomain.example.com
*.example.com
```

Hosts files which start with a local address (e.g. ``0.0.0.0``, ``127.0.0.1``) can also be used. The local addresses will not have a functional purpose, and are removed at initialization, along with the prefixes and suffixes ``||``, ``^``, ``::``, ``#``, ``address=/``, ``www.``, and whitespace and duplicate addresses.

### init() options (promise) (optional)

- ``path`` (``string``): a local or remote HTTP/HTTPS path to the web addresses/hosts file that overrides the internal hosts file; leave as an empty string ("") to disable the internal hosts file
- ``updateAfterSeconds`` (``integer``): update the web addresses file after a period of time in seconds
- ``updateNow`` (``boolean``): whether to update immediately on initialization
- ``blacklist`` (``string``, ``array``): a custom blacklist in addition to the web addresses/hosts file, such as defined by user input
- ``whitelist`` (``string``, ``array``): a custom whitelist that overrides the web addresses/hosts file and custom blacklist

### filter() options (optional)

- ``logger`` (``function``): a way to log blocked requests (e.g. ``console.log``)
- ``onRequest`` (``function``): gets called like the original ``onRequest`` of a ``BrowserWindow`` or ``BrowserView`` instance.

### Example

```js
const webBlocker = require('electron-web-blocker');
const { BrowserWindow } = require('electron');

webBlocker.init({
	path: "hosts-url.ext/hosts",
	updateAfterSeconds: 3600,
	updateNow: true,
	blacklist: ["example.com"],
	whitelist: ["example.com"]
});

const mainWindow = new BrowserWindow({ width: 800, height: 600 });

// generic use
console.log(webBlocker.isBlacklisted("example.com")); // returns `true` or `false`

// electron use
webBlocker.filter(mainWindow, {
	logger: console.log,
	onRequest: (details, callback, shouldBeBlocked) => {
		// Execute your own onRequest function here...
	}
});
```

<h2>Donate</h2>

Research, design, programming, and testing takes time.

Please consider [donating](https://krausekai.com/donate). Thank you.

<a href="https://krausekai.com/donate"><img src="https://i.imgur.com/sVBYHpo.png" width="175px"></a>
