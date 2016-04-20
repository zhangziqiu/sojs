var assert = require("assert");
require('../../src/sojs.js');
var old = sojs;

describe('sojs.core.browser', function () {
    describe('#define()', function () {
        it('simulate browser load', function () {
            global.sojs = null;
            delete require.cache[require.resolve('../../src/sojs.js')];
            global.window = global;
            global.document = {};
            global.$sojs_config = { proxyName : false };
            require('../../src/sojs.js');
            assert.equal(sojs.runtime, 'browser');
        });

        it('reload', function () {
            var reloadClass = sojs.define({
                name: 'reloadTestClass',
                namespace: 'test.unit.data',
                myValue: 1
            });
            sojs.reload('test.unit.data.reloadTestClass');
            assert.equal(reloadClass.myValue, 1);
        });

        it('loader', function () {
            // mock loader
            sojs.loader = {
                loadDepsBrowser: function(classObj, unloadClass){
                    // ?????????
                    sojs.define({
                        name: 'loaderTestDepClass',
                        namespace: 'test.unit.data'
                    });

                    sojs.reload(classObj.__full);
                }
            };

            var loaderTestClass = sojs.define({
                name: 'loaderTestClass',
                namespace: 'test.unit.data',
                deps:{
                    depClass: 'test.unit.data.loaderTestDepClass'
                }
            });

            assert.equal(loaderTestClass.depClass.name, 'loaderTestDepClass');
        });

        it('recovery sojs', function () {
            global.sojs = old;
            assert.equal(sojs.runtime, old.runtime);
        });
    });

});