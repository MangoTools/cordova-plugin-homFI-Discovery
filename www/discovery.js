var exec = cordova.require('cordova/exec');

var MULTICAST_HOST = "224.0.0.236";
var MULTICAST_PORT = 60555;

module.exports = function() {

	var instanceId = guid();

	var events = {};
	// =====
	// Set up UDP Multicast connection
	// =====


	function emit(eventName){
		if (!events.hasOwnProperty(eventName)) {
			return false;
		}

		for (var i = 0, length = events[eventName].length; i < length; i++) {
			this._handlers[eventName][i].apply(undefined, args);
		}

		return true;
	}

	function initCallbackSuccess() {
		queryAnnouncement();
	}
	function initCallbackFail(err) {
		console.log(err)
	}
	exec(initCallbackSuccess, initCallbackFail, 'Discovery', 'init', [ instanceId, MULTICAST_HOST, MULTICAST_PORT ]);


	function messageCallback(buffer) {
		try {
			var message = JSON.parse(buffer);
			if (message.event === 'announce') {
				if (events["announce"]) {
					for (var callbackId in events["announce"]) {
						var callback = events["announce"][callbackId];
						callback(message);
					}
				}
			}
			if (message.event === 'force') {
				if (events["force"]) {
					for (var callbackId in events["force"]) {
						var callback = events["force"][callbackId];
						callback(message);
					}
				}
			}

		} catch(e) {
			// ignore...
		}
	}
	exec(messageCallback, null, 'Discovery', 'listen', [ instanceId ]);

	// =====
	// Exported functions
	// =====


	exports.queryAnnouncement = function() {
		queryAnnouncement();
	}

	exports.on = function(eventName, callback) {
		if (events.hasOwnProperty(eventName)) {
			events[eventName].push(callback);
		} else{
			events[eventName] = {};
		}
		var callbackId = guid();

		events[eventName][callbackId] = callback;
		return callbackId;
	};

	exports.off = function(eventName, callbackId) {
		if(!events[eventName]) {
			return false;
		}
		delete events[eventName][callbackId];
		return true;
	}



	// =====
	// Helper functions
	// =====

	function generalSuccessCallback(success) {
		console.log(success)
	}

	function generalFailCallback(error) {
		console.log(error)
	}



	function queryAnnouncement() {
		var message = JSON.stringify({ event: "query"});
		exec(generalSuccessCallback, generalFailCallback, 'Discovery', 'send', [ instanceId, message, MULTICAST_HOST, MULTICAST_PORT ]);
	}

	function guid() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}

	// =====
	// Export
	// =====

	return exports;
}
