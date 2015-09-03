var expect = require('expect.js');
var ift = require('iframe-transport');
var Exec = require('iframe-transport/library/services/exec');
var Cookies = require('js-cookie');
var LSEvents = require('../source/localstorage-events');
var LSWrapper = require('../source/util/ls-wrapper');
var LSInterface = require('./ls-interface');
var support = require('../source/util/support');

// "storage" events are fired async and with inconsistent timing
// IE9 is super prone to race conditions, so just use 100ms for IE
var TICK = navigator.userAgent.indexOf('Trident') >= 0 ? 100 : 17;

describe('LSEvents', function() {

  var exec, store;

  beforeEach(function(done) {
    localStorage.clear();
    // Prevent cleanup "storage" events from interfering with real tests
    setTimeout(done, TICK);
  });

  afterEach(function() {
    store && store.destroy();
  });

  describe('core', function() {

    var manager;

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
        store.destroy();
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
        store.destroy();
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
        store.destroy();
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
          store.destroy();
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

    it('prevents double "storage" events for single keys', function(done) {
      exec.code(function(exec, LSEvents) {
        var store = LSEvents();
        store.set('foo1', 'oldValue');
        store.set('foo2', 'oldValue');
        store.destroy();
      }, function() {
        setTimeout(function() {
          var onStorage = sinon.stub();
          store = LSEvents(onStorage);

          exec.code(function(exec, LSEvents) {
            var store = LSEvents();
            store.set('foo1', 'newValue');
            store.set('foo2', 'newValue');
            store.destroy();
          }, function() {
            setTimeout(function() {
              sinon.assert.calledTwice(onStorage);
              // [fixme] Don't check for matching `key` because IE8 thinks they're both foo2
              expect(onStorage.firstCall.calledWithMatch({
                newValue: 'newValue'
              })).to.be(true);
              sinon.assert.calledTwice(onStorage);
              expect(onStorage.secondCall.calledWithMatch({
                newValue: 'newValue'
              })).to.be(true);
              done();
            }, TICK);
          });
        }, TICK);
      });
    });

  });

  describe('cookies', function() {

    it('supports overriding cookie domain', function() {
      if (!support.myWritesTrigger) {
        return;
      }

      store = LSEvents({
        cookieName: 'test',
        cookieDomain: 'sub1.localstorage-events.dev'
      });
      var setCookie = sinon.stub(Cookies, 'set');
      store.set('foo', 'bar');
      sinon.assert.calledWithMatch(setCookie, 'test', sinon.match.string, {
        domain: 'sub1.localstorage-events.dev'
      });
      setCookie.restore();
    });

    // Add the following to /etc/hosts
    //
    //   127.0.0.1 sub.localstorage-events.dev
    //
    // Run tests with HOST=sub.localstorage-events.dev
    xit('saves cookies without sub-domain', function() {
      if (!support.myWritesTrigger) {
        return;
      }

      store = LSEvents({
        cookieName: 'test'
      });
      var setCookie = sinon.stub(Cookies, 'set');
      store.set('bar', 'baz');
      sinon.assert.calledWithMatch(setCookie, 'test', sinon.match.string, {
        domain: 'localstorage-events.dev'
      });
      setCookie.restore();
    });

  });


});
