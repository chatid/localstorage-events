var expect = require('expect.js');
var ift = require('iframe-transport');
var Exec = require('iframe-transport/library/services/exec');
var LSEvents = require('../localstorage-events');
var LSWrapper = require('../util/ls-wrapper');
var LSInterface = require('./ls-interface');
var support = require('../util/support');

// "storage" events are fired async and with inconsistent timing
// IE9 is super prone to race conditions, so just use 100ms for IE
var TICK = navigator.userAgent.indexOf('MSIE') >= 0 ? 100 : 17;

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
      // Prevent cleanup "storage" events from interfering with real tests
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
      var store = LSEvents();
      store.set('foo', 'bar');
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
    store.set('foo', 'bar');
    setTimeout(function() {
      sinon.assert.notCalled(onStorage);
      done();
    }, TICK);
  });

  it('supports keys containing ":"', function(done) {
    var onStorage = sinon.stub();
    store = LSEvents(onStorage);

    store.set('beep:boop', 'test1');
    setTimeout(function() {

      sinon.assert.notCalled(onStorage);

      exec.code(function(exec, LSEvents) {
        var store = LSEvents();
        store.set('boop:beep', 'test2');
      }, function() {
        setTimeout(function() {
          sinon.assert.calledOnce(onStorage);
          sinon.assert.calledWithMatch(onStorage, {
            key: 'boop:beep',
            newValue: 'test2'
          });
          done();
        }, TICK);
      });

    }, TICK);
  });

});
