/*
 * LocalStorage Events
 *
 * Use a cookie to capture which key changed for IE8
 * Use a cookie to ignore "storage" events that I triggered
*/

var Cookies = require('js-cookie');
var assign = require('./util/assign');
var bind = require('./util/bind');
var lsWrapper = require('./util/ls-wrapper');
var support = require('./util/support');

var instanceId = Math.floor(Math.random() * 1000) + '' + +new Date;

function LocalStorageEventListener(storage, onStorage) {
  this.storage = storage;
  this.onStorage = onStorage;
  this._onStorage = bind(this._onStorage, this);
  support.on(support.storageEventTarget, 'storage', this._onStorage);
  return storage;
}

LocalStorageEventListener.prototype = {

  _onStorage: function(evt) {
    this.onStorage(evt);
  }

};

function LocalStorageEventNormalizer(storage, onStorage) {
  LocalStorageEventListener.apply(this, arguments);
}

LocalStorageEventNormalizer.prototype = {

  get: function(key) {
    return this.storage.get.apply(this, arguments);
  },

  // Before setting the value, set a version flag indicating that the last write came
  // from this window and targeted the given key.
  set: function(key) {
    Cookies.set('version', instanceId + ':' + key);
    return this.storage.set.apply(this, arguments);
  },

  unset: function(key) {
    return this.storage.unset.apply(this, arguments);
  },

  destroy: function() {
    support.off(support.storageEventTarget, 'storage', this._onStorage);
  },

  _onStorage: function(evt) {
    // IE8: to accurately determine `evt.newValue`, we must read it during the event
    // callback. Oddly, it returns the old value instead of the new one until the call
    // stack clears. More oddly, I was unable to reproduce this with a minimal test
    // case, yet it always seems to behave this way here.
    if (!support.storageEventProvidesKey) {
      setTimeout(bind(function() {
        this._processStorageEvt(evt);
      }, this), 0);
    } else {
      this._processStorageEvt(evt);
    }
  },

  // Ignore the event if it originated in this window. Tell IE8 which `key` changed
  // and grab it's `newValue`.
  _processStorageEvt: function(evt) {
    var ref = (Cookies.get('version') || ':').split(':'),
        writerId = ref[0], key = ref[1];

    // For all IE
    if (writerId == instanceId) return;

    // For IE8
    if (!support.storageEventProvidesKey) {
      evt = {
        key: key,
        newValue: localStorage.getItem(key)
      };
    }

    this.onStorage(evt);
  }

};

// Decorate a LocalStorage interface to properly trigger "storage" events in IE.
var LSEvents = function(storage, onStorage) {

  if (typeof storage === 'function') {
    onStorage = storage;
    storage = lsWrapper;
  }

  if (support.myWritesTrigger) {
    return new LocalStorageEventNormalizer(storage, onStorage);
  } else {
    return new LocalStorageEventListener(storage, onStorage);
  }

};

LSEvents.support = support;

module.exports = LSEvents;
