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
  this.onStorage = onStorage;
  this._onStorage = bind(this._onStorage, this);

  var destroy = storage.destroy;
  var decorator = this;
  storage.destroy = function() {
    storage.destroy = destroy;
    support.off(support.storageEventTarget, 'storage', decorator._onStorage);
    if (typeof destroy === 'function') {
      return destroy.apply(storage, arguments);
    }
  }

  support.on(support.storageEventTarget, 'storage', this._onStorage);

  return storage;
}

LocalStorageEventListener.prototype = {

  _onStorage: function(evt) {
    this.onStorage(evt);
  }

};

function LocalStorageEventNormalizer(storage, onStorage, cookieName) {
  this.cookieName = cookieName;

  var set = storage.set;
  var destroy = storage.destroy;
  storage.set = function(key) {
    // Before setting the value, set a version flag indicating that the
    // last write came from this window and targeted the given key.
    Cookies.set(cookieName, instanceId + ':' + key);
    return set.apply(storage, arguments);
  }
  storage.destroy = function() {
    storage.set = set;
    storage.destroy = destroy;
    if (typeof destroy === 'function') {
      return destroy.apply(storage, arguments);
    }
  }

  return LocalStorageEventListener.apply(this, arguments);
}

LocalStorageEventNormalizer.prototype = {

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
    var ref = (Cookies.get(this.cookieName) || ':').split(':'),
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
var LSEvents = function(storage, onStorage, cookieName) {

  // `storage` interface is optional
  if (typeof storage === 'function') {
    cookieName = onStorage;
    onStorage = storage;
    storage = lsWrapper;
  }

  // Sensible defaults for no args passed
  if (typeof storage === 'undefined') {
    storage = lsWrapper;
    onStorage = function(){};
  }

  // Default value for cookieName
  if (typeof cookieName !== 'string') {
    cookieName = 'lsevents-version';
  }

  if (support.myWritesTrigger) {
    return new LocalStorageEventNormalizer(storage, onStorage, cookieName);
  } else {
    return new LocalStorageEventListener(storage, onStorage);
  }

};

LSEvents.support = support;

module.exports = LSEvents;
