var support = module.exports = {
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
  storageEventCanTriggerTwice: (navigator.userAgent.indexOf('Trident/7.0') >= 0),
  storageEventTarget: ('onstorage' in window ? window : document),
  storageEventProvidesKey: !('onstorage' in document)
};
