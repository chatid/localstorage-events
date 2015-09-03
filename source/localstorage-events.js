/*
 * LocalStorage Events
 *
 * Use a cookie to capture which key changed for IE8
 * Use a cookie to ignore "storage" events that I triggered
*/

var Cookies = require('js-cookie');
var assign = require('./util/assign');
var bind = require('./util/bind');
var LSWrapper = require('./util/ls-wrapper');
var support = require('./util/support');
var getDomain = require('./util/get-domain');

var instanceId = Math.floor(Math.random() * 1000) + '' + +new Date;

function LocalStorageEventListener(storage, onStorage) {
  this.onStorage = onStorage;
  this._onStorage = bind(this._onStorage, this);

  // Expose private reverse reference to the decorator
  storage.__lsEventsDecorator = this;

  var destroy = storage.destroy;
  var decorator = this;
  storage.destroy = function() {
    storage.destroy = destroy;
    delete storage.__lsEventsDecorator;
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

function LocalStorageEventNormalizer(storage, onStorage, cookieName, cookieDomain) {
  this.cookieName = cookieName;

  // IE11
  if (support.storageEventCanTriggerTwice) {
    this._oldValues = {};
    this._newValues = {};
  }

  var set = storage.set;
  var destroy = storage.destroy;
  storage.set = function(key) {
    // Before setting the value, set a version flag indicating that the
    // last write came from this window and targeted the given key.
    Cookies.set(cookieName, instanceId + ':' + key, {
      domain: cookieDomain
    });
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
    var version = Cookies.get(this.cookieName) || ':',
        index = version.indexOf(':'),
        writerId = version.substring(0, index),
        key = version.substring(index + 1);

    // For all IE
    if (writerId == instanceId) return;

    // IE11 events can get sent twice when there's an iframe involved
    // http://stackoverflow.com/questions/20565508/how-to-work-around-ie11-localstorage-events-firing-twice-or-not-at-all-in-iframe
    // https://connect.microsoft.com/IE/feedback/details/811546/ie11-localstorage-events-fire-twice-or-not-at-all-in-iframes
    if (support.storageEventCanTriggerTwice) {
      if (evt.oldValue === this._oldValues[evt.key] && evt.newValue === this._newValues[evt.key]) {
        return;
      }
      this._oldValues[evt.key] = evt.oldValue;
      this._newValues[evt.key] = evt.newValue;
    }

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
var LSEvents = function(onStorage, options) {

  // onStorage is optional
  if (typeof onStorage !== 'function') {
    options = onStorage;
    onStorage = function(){};
  }
  options || (options = {});

  var storage = options.storage || LSWrapper;
  var cookieName = options.cookieName || 'lsevents-version';
  var cookieDomain = options.cookieDomain || getDomain();

  if (support.myWritesTrigger) {
    return new LocalStorageEventNormalizer(storage, onStorage, cookieName, cookieDomain);
  } else {
    return new LocalStorageEventListener(storage, onStorage);
  }

};

LSEvents.support = support;

module.exports = LSEvents;
