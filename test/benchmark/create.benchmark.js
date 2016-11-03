require('../../src/sojs.js');
var Benchmark = require('benchmark');
var suite = new Benchmark.Suite();

var funcClass = require('./create-native-class.js');
var sojsClass = require('./create-sojs-class.js');

// add tests
suite.add('new Function', {
    fn: function () {
        var obj = new funcClass();
    }
}).add('sojs.create', {
    fn: function () {
        var obj = sojs.create(sojsClass);
    }
}).on('cycle', function (event) {
    console.log(String(event.target));
}).run({
    'async': true
});