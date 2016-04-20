var assert = require("assert");
require('../../src/sojs.js');
require('../../src/sojs/event.js');

describe('sojs.event', function () {
    describe('basic', function () {
        it('clone property', function () {
            var eventClass = sojs.using('sojs.event');
            console.log(sojs.getClassPath('sojs.event'));
            assert.equal(eventClass.__clones.length, 0);
            var ev = sojs.create(eventClass);
            assert.ok( ev.hasOwnProperty('eventList'));
            assert.ok( ev.hasOwnProperty('groupList'));
            assert.ok( ev.hasOwnProperty('eventGroupIndexer'));
        });
    });
});