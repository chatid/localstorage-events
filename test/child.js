var ift = require('iframe-transport');
var Exec = require('iframe-transport/library/services/exec');

manager = ift.child({
  trustedOrigins: [__HOST__ + ':' + __PORT__]
});
manager.service('exec', Exec);
