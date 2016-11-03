require('../../src/sojs.js');
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite();

var events = require('events');
var sojsEvent = sojs.using('sojs.event');


// add tests
suite.add('sojs.define', {
    fn: function () {
        sojs.define({
            name: 'test',
            namespace: 'my.project',
            $test: function () {
                this.myName2 = 'name2';
            },
            test: function () {
                this.myName3 = 'name3';
            }
        });
        sojs.classes = {};
    }
}).on('cycle', function (event) {
    console.log(String(event.target));
}).run({
    'async': true
});