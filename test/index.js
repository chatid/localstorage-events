var expect = require('expect.js');
var ift = require('iframe-transport');
var Exec = require('iframe-transport/library/services/exec');
var LSEvents = require('../localstorage-events');
var LSWrapper = require('../util/ls-wrapper');
var LSInterface = require('./ls-interface');
var support = require('../util/support');
var TICK = 17;

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
      setTimeout(done, TICK);
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
      expect(evt.newValue).to.be('bar');
      done();
    });

    exec.code(function(exec, LSEvents) {
      localStorage.setItem('foo', 'bar');
    });
  });

  it('can wrap a #get, #set, #unset localStorage interface', function(done) {
    store = LSEvents(function(evt) {
      expect(evt.key).to.be('baz');
      expect(evt.newValue).to.be('test');
      done();
    }, {
      storage: LSWrapper
    });

    exec.code(function(exec, LSEvents, LSWrapper, LSInterface) {
      var store = LSEvents({
        storage: LSWrapper
      });
      store.set('baz', 'test');
    });
  });

  it('can wrap a #get, #set, #unset localStorage interface with #serialize/#deserialize', function(done) {
    store = LSEvents(function(evt) {
      expect(evt.key).to.be('baz');
      expect(store.deserialize(evt.newValue)).to.be('test');
      done();
    }, {
      storage: LSInterface
    });

    exec.code(function(exec, LSEvents, LSInterface) {
      var store = LSEvents({
        storage: LSInterface
      });
      store.set('baz', 'test');
    });
  });

  it('juggles arguments: onStorage callback only', function() {
    var onStorage = sinon.stub();
    store = LSEvents(onStorage);
    expect(store.__lsEventsDecorator.onStorage).to.equal(onStorage);
  });

  it('juggles arguments: options only', function() {
    store = LSEvents({
      storage: LSWrapper,
      cookieName: 'my-cookie'
    });
    expect(store).to.equal(LSWrapper);
    if (support.myWritesTrigger) {
      expect(store.__lsEventsDecorator.cookieName).to.be('my-cookie');
    }
  });

  it('juggles arguments: both onStorage callback and options', function() {
    var onStorage = sinon.stub();
    store = LSEvents(onStorage, {
      storage: LSWrapper,
      cookieName: 'test-cookie'
    });
    expect(store).to.equal(LSWrapper);
    if (support.myWritesTrigger) {
      expect(store.__lsEventsDecorator.cookieName).to.be('test-cookie');
    }
  });

  it('ignores "storage" events from this window', function(done) {
    var onStorage = sinon.stub();
    store = LSEvents(onStorage);
    localStorage.setItem('foo', 'bar');
    setTimeout(function() {
      sinon.assert.notCalled(onStorage);
      done();
    }, TICK);
  });

});
