var expect = require('expect.js');
var ift = require('iframe-transport');
var Exec = require('iframe-transport/library/services/exec');
var LSEvents = require('../localstorage-events');
var LSWrapper = require('../util/ls-wrapper');
var LSInterface = require('./ls-interface');

describe('LSEvents', function() {

  var manager, exec, store;

  before(function(done) {
    manager = ift.parent({
      childOrigin: __HOST__ + ':' + __PORT__,
      childPath: '/base/test/child.html'
    });
    manager.ready(function() {
      exec = manager.service('exec', Exec);
      done();
    });
  });

  beforeEach(function(done) {
    exec.code(function() {
      localStorage.clear();
    }, function() {
      // Prevent cleanup "storage" events from interfering with real tests (it seems that "storage"
      // events are dispatched async, so calling `done` from this callback is not sufficient)
      setTimeout(done, 0);
    });
  });

  afterEach(function() {
    store.destroy();
  });

  after(function() {
    manager.destroy();
  });

  it('calls onStorage callback on "storage" events', function(done) {
    store = LSEvents(function(evt) {
      expect(evt.key).to.be('foo');
      expect(evt.oldValue).to.be(null);
      expect(evt.newValue).to.be('bar');
      done();
    });

    exec.code(function(exec, LSEvents) {
      var store = LSEvents();
      store.set('foo', 'bar');
    });
  });

  it('can wrap a #get, #set, #unset localStorage interface', function(done) {
    store = LSEvents(LSWrapper, function(evt) {
      expect(evt.key).to.be('baz');
      expect(evt.oldValue).to.be(null);
      expect(evt.newValue).to.be('test');
      done();
    });

    exec.code(function(exec, LSEvents, LSWrapper, LSInterface) {
      var store = LSEvents(LSWrapper);
      store.set('baz', 'test');
    });
  });

  it('can wrap a #get, #set, #unset localStorage interface with #serialize/#deserialize', function(done) {
    store = LSEvents(LSInterface, function(evt) {
      expect(evt.key).to.be('baz');
      expect(store.deserialize(evt.oldValue)).to.be(null);
      expect(store.deserialize(evt.newValue)).to.be('test');
      done();
    });

    exec.code(function(exec, LSEvents, LSInterface) {
      var store = LSEvents(LSInterface);
      store.set('baz', 'test');
    });
  });

});
