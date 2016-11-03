require('../../src/sojs.js');
require('../../src/sojs/event.js');
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite();

var events = require('events');
var sojsEvent = sojs.using('sojs.event');

suite.add('event-native-create', {
    fn: function () {
        var ev = new events.EventEmitter();
    }
}).add('event-sojs-create', {
    fn: function () {
        var ev = sojs.create(sojsEvent);
    }
}).on('cycle', function (event) {
    console.log(String(event.target));
}).run({
    'async': true
});