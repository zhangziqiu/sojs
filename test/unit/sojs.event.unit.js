var assert = require("assert");
require('../../src/sojs.js');
require('../../src/sojs/event.js');

describe('sojs.event', function () {
    describe('basic', function () {
        it('clone property', function () {
            var eventClass = sojs.using('sojs.event');
            assert.equal(eventClass.__clones.length, 0);
            var ev = sojs.create(eventClass);
            assert.ok(ev.hasOwnProperty('eventList'));
            assert.ok(ev.hasOwnProperty('groupList'));
            assert.ok(ev.hasOwnProperty('eventGroupIndexer'));
        });

        it('createCallback(callback, needTimes)', function () {
            var eventClass = sojs.using('sojs.event');
            var callback = function () { };
            var callbackObj1 = eventClass.createCallback(callback);
            assert.equal(callbackObj1.callback, callback);
            assert.equal(callbackObj1.needTimes, -1);
            assert.equal(callbackObj1.emitTimes, 0);

            var callbackObj2 = eventClass.createCallback(callback, 1);
            assert.equal(callbackObj2.callback, callback);
            assert.equal(callbackObj2.needTimes, 1);
            assert.equal(callbackObj2.emitTimes, 0);

            var callbackObj3 = eventClass.createCallback();
            assert.equal(callbackObj3.needTimes, -1);
            assert.equal(callbackObj3.emitTimes, 0);
        });

        it('先触发事件, 再绑定事件.', function () {
            var eventClass = sojs.using('sojs.event');
            var ev = sojs.create(eventClass);

            ev.emit('event1', 'event1-data');
            ev.bind('event1', function (data) {
                assert.equal(data, 'event1-data');
            }, 1);
        });

        it('一个事件绑定多个函数, 只解除绑定其中的某一个函数', function () {
            var eventClass = sojs.using('sojs.event');
            var ev = sojs.create(eventClass);
            var callback1 = function (data) {
                assert.ok(true);
            };
            var callback2 = function (data) {
                assert.ok(false);
            };

            ev.emit('event1', 'event1-data');
            ev.bind('event1', callback1);
            ev.bind('event1', callback2);
            ev.unbind('event1', callback2);
            ev.emit('event1', 'event1-data');
        });
    });

    describe('group', function () {
        it('group(groupName, eventNames, callback, times)', function (done) {
            var eventClass = sojs.using('sojs.event');
            var ev = sojs.create(eventClass);
            var callbackArray = [];
            var callback1 = function (data) {
            };
            var callback2 = function (data) {
                done();
            };
            callbackArray.push(callback1);
            callbackArray.push(callback2);

            ev.bind('event1', function (data) { return data; });
            ev.bind('event2', function (data) { return data; });
            ev.group('group1', ['event1', 'event2'], callbackArray);
            ev.emit('event1', 'event1-data');
            ev.emit('event2', 'event2-data');
        });

        it('不创建event,在group中直接绑定', function (done) {
            var eventClass = sojs.using('sojs.event');
            var ev = sojs.create(eventClass);
            var callbackArray = [];
            var callback1 = function (data) {
            };
            var callback2 = function (data) {
                done();
            };
            callbackArray.push(callback1);
            callbackArray.push(callback2);

            ev.group('group1', ['event1', 'event2'], callbackArray);
            ev.emit('event1', 'event1-data');
            ev.emit('event2', 'event2-data');
        });
    });

    describe('queue', function () {
        it('groupList链表是否正确建立', function () {
            var eventClass = sojs.using('sojs.event');
            var ev = sojs.create(eventClass);
            ev.queue('group1', 'group2', 'group3');
            var group1 = ev.groupList['group1'];
            var group2 = ev.groupList['group2'];
            var group3 = ev.groupList['group3'];
            assert.equal(group1.afterGroups.group2, 1);
            assert.equal(group2.afterGroups.group3, 1);
            assert.equal(group2.previousGroups.group1, 1);
        });

        it('传递group数组', function () {
            var eventClass = sojs.using('sojs.event');
            var ev = sojs.create(eventClass);
            ev.queue('group1', ['group2', 'group3'], 'group4');
            var group1 = ev.groupList['group1'];
            var group2 = ev.groupList['group2'];
            var group3 = ev.groupList['group3'];
            var group4 = ev.groupList['group4'];
            assert.equal(group1.afterGroups.group2, 1);
            assert.equal(group2.afterGroups.group4, 1);
            assert.equal(group2.previousGroups.group1, 1);
            assert.equal(group3.afterGroups.group4, 1);
            assert.equal(group3.previousGroups.group1, 1);
            assert.equal(group4.previousGroups.group2, 1);
            assert.equal(group4.previousGroups.group3, 1);
        });

        it('测试触发', function () {
            var eventClass = sojs.using('sojs.event');
            var ev = sojs.create(eventClass);
            ev.queue('group1', ['group2', 'group3'], 'group4');
            var group1 = ev.groupList['group1'];
            var group2 = ev.groupList['group2'];
            var group3 = ev.groupList['group3'];
            var group4 = ev.groupList['group4'];

            ev.groupEmit('group1');
            assert.equal(group1.status, false);
            assert.equal(group2.status, false);
            assert.equal(group3.status, false);
            assert.equal(group4.status, false);

            ev.groupEmit('group2');
            assert.equal(group1.status, false);
            assert.equal(group2.status, false);
            assert.equal(group3.status, false);
            assert.equal(group4.status, false);

            ev.groupEmit('group4');
            assert.equal(group1.status, true);
            assert.equal(group2.status, true);
            assert.equal(group3.status, true);
            assert.equal(group4.status, true);
        });

        it('测试触发', function () {
            var eventClass = sojs.using('sojs.event');
            var ev = sojs.create(eventClass);
            ev.queue('group1', ['group2', 'group3'], 'group4');
            var group1 = ev.groupList['group1'];
            var group2 = ev.groupList['group2'];
            var group3 = ev.groupList['group3'];
            var group4 = ev.groupList['group4'];

            ev.groupEmit('group1');
            assert.equal(group1.status, false);
            assert.equal(group2.status, false);
            assert.equal(group3.status, false);
            assert.equal(group4.status, false);

            ev.groupEmit('group2');
            assert.equal(group1.status, false);
            assert.equal(group2.status, false);
            assert.equal(group3.status, false);
            assert.equal(group4.status, false);

            ev.groupEmit('group4');
            assert.equal(group1.status, true);
            assert.equal(group2.status, true);
            assert.equal(group3.status, true);
            assert.equal(group4.status, true);
        });

        it('测试触发2', function (done) {
            var eventClass = sojs.using('sojs.event');
            var ev = sojs.create(eventClass);
            ev.queue('group1', ['group2', 'group3'], 'group4');
            var group1 = ev.groupList['group1'];
            var group2 = ev.groupList['group2'];
            var group3 = ev.groupList['group3'];
            var group4 = ev.groupList['group4'];

            var group4Callback = function () {
                done();
            };
            ev.group('group4', 'group4-event', group4Callback, 2);

            ev.groupEmit('group1');
            assert.equal(group1.status, false);
            assert.equal(group2.status, false);
            assert.equal(group3.status, false);
            assert.equal(group4.status, false);

            ev.groupEmit('group2');
            assert.equal(group1.status, false);
            assert.equal(group2.status, false);
            assert.equal(group3.status, false);
            assert.equal(group4.status, false);

            ev.emit('group4-event', 'group4-event-data');
            assert.equal(group1.status, true);
            assert.equal(group2.status, true);
            assert.equal(group3.status, true);
            assert.equal(group4.status, true);
        });

        it('先触发再创建', function () {
            var eventClass = sojs.using('sojs.event');
            var ev = sojs.create(eventClass);
            ev.groupEmit('group4');
            ev.queue('group1', ['group2', 'group3'], 'group4');
            var group1 = ev.groupList['group1'];
            var group2 = ev.groupList['group2'];
            var group3 = ev.groupList['group3'];
            var group4 = ev.groupList['group4'];
            //assert.equal(group1.status, true);
            //assert.equal(group2.status, true);
            //assert.equal(group3.status, true);
            assert.equal(group4.status, true);
        });

    });
});