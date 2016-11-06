var assert = require("assert");
//sojs初始化时的配置变量。必须在sojs加载前载入
global.$sojs_config = { proxyName: 'proxy' };
require('../../src/sojs.js');

describe('bugfix', function () {

    describe('#using()', function () {
        it('using', function () {

            // 优先define子类, 前置命名空间会被初始化成空object
            sojs.define({
                name: 'd',
                namespace: 'a.b.c'
            });
            var subClass1 = sojs.using('a.b.c.d');
            // 前置命名空间的status应该为1
            assert.equal(sojs.classes.a.b.c.__status, 1);
            // 引用命名空间时, 第一次会尝试require, 如果失败则设置status为2避免再次require
            var subClass1Namespace = sojs.using('a.b.c');
            assert.equal(subClass1Namespace.__status, 2);

            // 此时如果前置命名空间被define, 应该保证之前的子类不出问题.
            sojs.define({
                name: 'd1',
                namespace: 'a1.b1.c1'
            });

            var subClass2_1 = sojs.using('a1.b1.c1.d1');
            sojs.define({
                name: 'c1',
                namespace: 'a1.b1'
            });
            var subClass2_2 = sojs.using('a1.b1.c1.d1');
            assert.equal(subClass2_1, subClass2_2);
        });
    });

});