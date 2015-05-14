(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["LSEvents"] = factory();
	else
		root["LSEvents"] = factory();
})(this, function() {
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

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
	 * JavaScript Cookie v2.0.0-beta.1
	 * https://github.com/js-cookie/js-cookie
	 *
	 * Copyright 2006, 2015 Klaus Hartl
	 * Released under the MIT license
	 */
	(function (factory) {
		if (true) {
			!(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (typeof exports === 'object') {
			module.exports = factory();
		} else {
			var _OldCookies = window.Cookies;
			var api = window.Cookies = factory(window.jQuery);
			api.noConflict = function () {
				window.Cookies = _OldCookies;
				return api;
			};
		}
	}(function () {
		function extend () {
			var i = 0;
			var result = {};
			for (; i < arguments.length; i++) {
				var attributes = arguments[ i ];
				for (var key in attributes) {
					result[key] = attributes[key];
				}
			}
			return result;
		}
	
		function init (converter) {
			function api (key, value, attributes) {
				var result;
	
				// Write
	
				if (arguments.length > 1) {
					attributes = extend({
						path: '/'
					}, api.defaults, attributes);
	
					if (typeof attributes.expires === 'number') {
						var expires = new Date();
						expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
						attributes.expires = expires;
					}
	
					try {
						result = JSON.stringify(value);
						if (/^[\{\[]/.test(result)) {
							value = result;
						}
					} catch (e) {}
	
					value = encodeURIComponent(String(value));
					value = value.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
	
					key = encodeURIComponent(String(key));
					key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
					key = key.replace(/[\(\)]/g, escape);
	
					return (document.cookie = [
						key, '=', value,
						attributes.expires && '; expires=' + attributes.expires.toUTCString(), // use expires attribute, max-age is not supported by IE
						attributes.path    && '; path=' + attributes.path,
						attributes.domain  && '; domain=' + attributes.domain,
						attributes.secure  && '; secure'
					].join(''));
				}
	
				// Read
	
				if (!key) {
					result = {};
				}
	
				// To prevent the for loop in the first place assign an empty array
				// in case there are no cookies at all. Also prevents odd result when
				// calling "get()"
				var cookies = document.cookie ? document.cookie.split('; ') : [];
				var rdecode = /(%[0-9A-Z]{2})+/g;
				var i = 0;
	
				for (; i < cookies.length; i++) {
					var parts = cookies[i].split('=');
					var name = parts[0].replace(rdecode, decodeURIComponent);
					var cookie = parts.slice(1).join('=');
	
					if (cookie.charAt(0) === '"') {
						cookie = cookie.slice(1, -1);
					}
	
					cookie = converter && converter(cookie, name) || cookie.replace(rdecode, decodeURIComponent);
	
					if (this.json) {
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}
	
					if (key === name) {
						result = cookie;
						break;
					}
	
					if (!key) {
						result[name] = cookie;
					}
				}
	
				return result;
			}
	
			api.get = api.set = api;
			api.getJSON = function () {
				return api.apply({
					json: true
				}, [].slice.call(arguments));
			};
			api.defaults = {};
	
			api.remove = function (key, attributes) {
				api(key, '', extend(attributes, {
					expires: -1
				}));
			};
	
			api.withConverter = init;
	
			return api;
		}
	
		return init();
	}));


/***/ }
/******/ ])
});
;
//# sourceMappingURL=localstorage-events.js.map