/*
 * LocalStorage Events
 *
 * Use a cookie to capture which key changed for IE8
 * Use a cookie to ignore "storage" events that I triggered
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define('localstorage-events', ['cookie'], factory);
  else if (typeof exports === 'object') module.exports = factory(require('cookie'));
  else root.LSEvents = factory(root.Cookie);
}(this, function(Cookie) {

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
        Cookie.set('version', myUid + ':' + key);
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
        var ref = (Cookie.get('version') || ':').split(':'),
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

  return LSEvents;

}));
