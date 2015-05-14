(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("$"));
	else if(typeof define === 'function' && define.amd)
		define(["$"], factory);
	else if(typeof exports === 'object')
		exports["LSEvents"] = factory(require("$"));
	else
		root["LSEvents"] = factory(root["$"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * LocalStorage Events
	 *
	 * Use a cookie to capture which key changed for IE8
	 * Use a cookie to ignore "storage" events that I triggered
	*/
	
	var Cookies = __webpack_require__(1);
	
	var support = {
	  // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
	  has: function(object, property){
	    var t = typeof object[property];
	    return t == 'function' || (!!(t == 'object' && object[property])) || t == 'unknown';
	  },
	  on: function(target, name, callback) {
	    support.has(window, 'addEventListener') ?
	      target.addEventListener(name, callback, false) :
	      target.attachEvent('on' + name, callback);
	  },
	  off: function(target, name, callback) {
	    support.has(window, 'removeEventListener') ?
	      target.removeEventListener(name, callback, false) :
	      target.detachEvent('on' + name, callback);
	  },
	  myWritesTrigger: ('onstoragecommit' in document),
	  storageEventTarget: ('onstorage' in window ? window : document),
	  storageEventProvidesKey: !('onstorage' in document)
	};
	
	var myUid = Math.floor(Math.random() * 1000) + '' + +new Date;
	
	// LSEvents
	// --------
	
	// Decorate a LocalStorage interface to properly trigger "storage" events in IE.
	var LSEvents = function(storageCtor) {
	
	  if (!support.myWritesTrigger) return storageCtor;
	
	  return storageCtor.extend({
	
	    // Before setting the value, set a version flag indicating that the last write came
	    // from this window and targeted the given key.
	    set: function(key) {
	      Cookies.set('version', myUid + ':' + key);
	      return storageCtor.prototype.set.apply(this, arguments);
	    },
	
	    listen: function() {
	      var storage = this, target = support.storageEventTarget;
	      support.on(target, 'storage', function(evt) {
	        // IE8: to accurately determine `evt.newValue`, we must read it during the event
	        // callback. Oddly, it returns the old value instead of the new one until the call
	        // stack clears. More oddly, I was unable to reproduce this with a minimal test
	        // case, yet it always seems to behave this way here.
	        if (!support.storageEventProvidesKey) {
	          setTimeout(function() {
	            storage._onStorage(evt);
	          }, 0);
	        } else {
	          storage._onStorage(evt);
	        }
	      });
	    },
	
	    // Ignore the event if it originated in this window. Tell IE8 which `key` changed
	    // and grab it's `newValue`.
	    _onStorage: function(evt) {
	      var ref = (Cookies.get('version') || ':').split(':'),
	          uid = ref[0], key = ref[1];
	
	      // For all IE
	      if (uid == myUid) return;
	
	      // For IE8
	      if (!support.storageEventProvidesKey) {
	        evt = {
	          key: key,
	          newValue: localStorage.getItem(key)
	        };
	      }
	
	      this.onStorage(evt);
	    }
	
	  });
	
	};
	
	LSEvents.support = support;
	
	module.exports = LSEvents;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
	 * Javascript Cookie v1.5.1
	 * https://github.com/js-cookie/js-cookie
	 *
	 * Copyright 2006, 2014 Klaus Hartl
	 * Released under the MIT license
	 */
	(function (factory) {
		var jQuery;
		if (true) {
			// AMD (Register as an anonymous module)
			!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (typeof exports === 'object') {
			// Node/CommonJS
			try {
				jQuery = require('jquery');
			} catch(e) {}
			module.exports = factory(jQuery);
		} else {
			// Browser globals
			var _OldCookies = window.Cookies;
			var api = window.Cookies = factory(window.jQuery);
			api.noConflict = function() {
				window.Cookies = _OldCookies;
				return api;
			};
		}
	}(function ($) {
	
		var pluses = /\+/g;
	
		function encode(s) {
			return api.raw ? s : encodeURIComponent(s);
		}
	
		function decode(s) {
			return api.raw ? s : decodeURIComponent(s);
		}
	
		function stringifyCookieValue(value) {
			return encode(api.json ? JSON.stringify(value) : String(value));
		}
	
		function parseCookieValue(s) {
			if (s.indexOf('"') === 0) {
				// This is a quoted cookie as according to RFC2068, unescape...
				s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
			}
	
			try {
				// Replace server-side written pluses with spaces.
				// If we can't decode the cookie, ignore it, it's unusable.
				// If we can't parse the cookie, ignore it, it's unusable.
				s = decodeURIComponent(s.replace(pluses, ' '));
				return api.json ? JSON.parse(s) : s;
			} catch(e) {}
		}
	
		function read(s, converter) {
			var value = api.raw ? s : parseCookieValue(s);
			return isFunction(converter) ? converter(value) : value;
		}
	
		function extend() {
			var key, options;
			var i = 0;
			var result = {};
			for (; i < arguments.length; i++) {
				options = arguments[ i ];
				for (key in options) {
					result[key] = options[key];
				}
			}
			return result;
		}
	
		function isFunction(obj) {
			return Object.prototype.toString.call(obj) === '[object Function]';
		}
	
		var api = function (key, value, options) {
	
			// Write
	
			if (arguments.length > 1 && !isFunction(value)) {
				options = extend(api.defaults, options);
	
				if (typeof options.expires === 'number') {
					var days = options.expires, t = options.expires = new Date();
					t.setMilliseconds(t.getMilliseconds() + days * 864e+5);
				}
	
				return (document.cookie = [
					encode(key), '=', stringifyCookieValue(value),
					options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
					options.path    ? '; path=' + options.path : '',
					options.domain  ? '; domain=' + options.domain : '',
					options.secure  ? '; secure' : ''
				].join(''));
			}
	
			// Read
	
			var result = key ? undefined : {},
				// To prevent the for loop in the first place assign an empty array
				// in case there are no cookies at all. Also prevents odd result when
				// calling "get()".
				cookies = document.cookie ? document.cookie.split('; ') : [],
				i = 0,
				l = cookies.length;
	
			for (; i < l; i++) {
				var parts = cookies[i].split('='),
					name = decode(parts.shift()),
					cookie = parts.join('=');
	
				if (key === name) {
					// If second argument (value) is a function it's a converter...
					result = read(cookie, value);
					break;
				}
	
				// Prevent storing a cookie that we couldn't decode.
				if (!key && (cookie = read(cookie)) !== undefined) {
					result[name] = cookie;
				}
			}
	
			return result;
		};
	
		api.get = api.set = api;
		api.defaults = {};
	
		api.remove = function (key, options) {
			// Must not alter options, thus extending a fresh object...
			api(key, '', extend(options, { expires: -1 }));
			return !api(key);
		};
	
		if ( $ ) {
			$.cookie = api;
			$.removeCookie = api.remove;
		}
	
		return api;
	}));


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	(function() { module.exports = this["$"]; }());

/***/ }
/******/ ])
});
;
//# sourceMappingURL=localstorage-events.js.map