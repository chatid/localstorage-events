var ift = require('iframe-transport');
var Exec = require('iframe-transport/library/services/exec');
var LSEvents = require('../localstorage-events');
var LSWrapper = require('../util/ls-wrapper');
var LSInterface = require('./ls-interface');

manager = ift.child({
  trustedOrigins: [__HOST__ + ':' + __PORT__]
});
manager.service('exec', Exec, [LSEvents, LSWrapper, LSInterface]);
