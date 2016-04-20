var assert = require("assert");
require('../../src/sojs.js');
require('../../src/sojs/event.js');
require('../../src/sojs/promise.js');

var promise = sojs.using('sojs.promise');

describe('sojs.promise', function () {
    describe('basic', function () {
        it('#create - resolve()', function (done) {
            promise.resolve('test').then(function (data) {
                assert.equal(data, 'test');
                done();
            });
        });

        it('#create - reject()', function (done) {
            promise.reject(new Error('error message')).then(function (data) {
                done(new Error('should not run onFullFilled'));
            }, function (error) {
                assert.equal(error.message, 'error message');
                done();
            });
        });

        it('#create - function - resolve', function (done) {
            sojs.create(promise, function (resolve, reject) {
                resolve('test');
            }).then(function (data) {
                assert.equal(data, 'test');
                done();
            });
        });

        it('#create - function - reject', function (done) {
            sojs.create(promise, function (resolve, reject) {
                reject(new Error('error message'));
            }).then(function (data) {
                done(new Error('should not run onFullFilled'));
            }, function (error) {
                assert.equal(error.message, 'error message');
                done();
            });
        });

        it('#then - no return data', function (done) {
            promise.resolve('hello').then(function (data) {

            }).then(function (data) {
                done();
                // ��һ��thenû��return, dataΪnull����undefined
                assert.ok(data == null);
            });
        });

        it('#then - return promise', function (done) {
            promise.resolve('hello').then(function(data){
                var promise2 = sojs.create(promise, function(resolve, reject){
                    setTimeout(function(){
                        resolve('promise-2-return-data');
                    }, 500);
                });
                return promise2;
            }).then(function(data){
                assert.equal(data, 'promise-2-return-data');
                done();
            });
        });

        it('#catch - reject(error)', function (done) {
            promise.reject(new Error('error message')).catch(function (error) {
                assert.equal(error.message, 'error message');
                done();
            });
        });

        it('#catch - throw error', function (done) {
            promise.resolve('hello').then(function (data) {
                throw new Error('error message');
            }).catch(function (error) {
                assert.equal(error.message, 'error message');
                done();
            });
        });

        it('#catch - uncaught error', function (done) {
            promise.resolve('hello').then(function (data) {
                //����ı���δ���壬����������
                aassdd;
            }).catch(function (error) {
                assert.equal(error.message, 'aassdd is not defined');
                done();
            });
        });

    });

    describe('async', function () {
        it('#async test', function (done) {
            var actual = [];
            var expect = [1,2,3];

            var testPromise = sojs.create(promise, function (resolve){
                actual.push(1);
                resolve(1);
            });
            testPromise.then(function(value){
                actual.push(3);
                assert.deepEqual(expect, actual);
                done();
            });
            actual.push(2);
        });
    });

    describe('all', function () {
        it('#all test', function (done) {
            var promise1 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-1');
                }, 100);
            });

            var promise2 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-2');
                }, 200);
            });

            var promise3 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-3');
                }, 300);
            });

            promise.all([promise1, promise2, promise3]).then(function(data){
                assert.deepEqual(data, ['promise-1','promise-2','promise-3']);
                done();
            }).catch(function(error){
                done(error);
            });
        });

        it('#all error test', function (done) {
            var promise1 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    reject(new Error('promise-1 error'));
                }, 100);
            });

            var promise2 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-2');
                }, 200);
            });

            var promise3 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-3');
                }, 300);
            });

            promise.all([promise1, promise2, promise3]).then(function(data){
            }).catch(function(error){
                assert.equal(error.message,'promise-1 error' );
                done();
            });

        });
    });

    describe('race', function () {

        it('#race test', function (done) {
            var promise1 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-1');
                }, 200);
            });
            var promise2 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-2');
                }, 100);
            });
            var promise3 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-3');
                }, 300);
            });
            promise.race([promise1, promise2, promise3]).then(function(data){
                assert.equal(data,'promise-2');
                done();
            }).catch(function(error){
                done(error);
            });
        });

        it('#race error test', function (done) {
            var promise1 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-1');
                }, 200);
            });
            var promise2 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    reject(new Error('promise2-error'));
                }, 100);
            });
            var promise3 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-3');
                }, 300);
            });
            promise.race([promise1, promise2, promise3]).then(function(data){
                done(new Error('should not run'));
            }).catch(function(error){
                assert.equal(error.message,'promise2-error');
                done();
            });
        });

        it('#race throw error test', function (done) {
            var promise1 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-1');
                }, 200);
            });
            var promise2 = sojs.create(promise, function(resolve, reject){
                throw new Error('promise2-error');
            });
            var promise3 = sojs.create(promise, function(resolve, reject){
                setTimeout(function(){
                    resolve('promise-3');
                }, 300);
            });
            promise.race([promise1, promise2, promise3]).then(function(data){
                done(new Error('should not run'));
            }).catch(function(error){
                assert.equal(error.message,'promise2-error');
                done();
            });
        });

    });

    describe('promisify', function () {
        it('#promisify test', function (done) {
            var fs = require("fs");
            var readFilePromise = promise.promisify(fs.readFile);
            readFilePromise("test/unit/data/sojs.promise.promisify-test.txt", "utf8").then(function(data){
                assert.equal(data,'promisify-test-data');
                done();
            }).catch(function(error){
                done(error);
            });
        });

        it('#promisify error test', function (done) {
            var fs = require("fs");
            var readFilePromise = promise.promisify(fs.readFile);
            readFilePromise("can-not-find-this-file.txt", "utf8").then(function(data){
                done(new Error('should not run'));
            }).catch(function(error){
                assert.ok(error instanceof Error);
                done();
            });
        });
    });

    describe('thenable', function () {
        it('#thenable', function (done) {
            var insidePromise = sojs.create(promise, function (resolve, reject) {
                reject(new Error('reject test'));
            });

            promise.resolve(insidePromise).catch(function (error) {
                assert.equal(error.message, 'reject test');
                done();
            });
        });
    });

});