require('../../src/sojs.js');
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite();

var events = require('events');
var sojsEvent = sojs.using('sojs.event');

sojs.define({
    name: 'testClass',
    namespace: '',
    say: function () {
        //console.log(this.name);
    }
});
var testClass = sojs.using('testClass');


// add tests
suite.add('sojs.proxy', {
    fn: function () {
        var proxyFunc = sojs.proxy(testClass, testClass.say);
        proxyFunc();
    }
}).on('cycle', function (event) {
    console.log(String(event.target));
}).run({
    'async': true
});