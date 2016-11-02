var assert = require("assert");
//sojs初始化时的配置变量。必须在sojs加载前载入
global.$sojs_config = { proxyName: 'proxy' };
require('../../src/sojs.js');

describe('sojs.core', function () {

    describe('#using()', function () {
        it('using', function () {

            // 优先define子类, 前置命名空间会被初始化成空object
            sojs.define({
                name: 'd',
                namespace: 'a.b.c'
            });
            var subClass1 = sojs.using('a.b.c.d');

            // 此时如果前置命名空间被define, 应该保证之前的子类不出问题.
            sojs.define({
                name: 'c',
                namespace: 'a.b',
                testProperty: 'class-c-test'
            });            
            var subClass2 = sojs.using('a.b.c.d');
            assert.equal(subClass1, subClass2);
        });
    });

});