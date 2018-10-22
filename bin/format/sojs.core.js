(function() {
    var sojs = {
        name: "sojs",
        namespace: "",
        classes: {},
        classesCache: {},
        path: {},
        pathCache: {},
        noop: function() {},
        $sojs: function() {
            var config = {};
            if (typeof window !== "undefined" && window && typeof document !== "undefined" && document) {
                this.runtime = "browser";
                config.global = window;
            } else {
                this.runtime = "node";
                config.global = global;
            }
            config.proxyName = "proxy";
            config.path = this.runtime === "node" ? process.cwd() + "/src/" : "/src/";
            if (typeof $sojs_config !== "undefined") {
                for (var key in $sojs_config) {
                    if (key && $sojs_config.hasOwnProperty(key)) {
                        config[key] = $sojs_config[key];
                    }
                }
            }
            this.global = config.global;
            if (config.proxyName) {
                Function.prototype[config.proxyName] = this.proxy;
            }
            this.setPath(config.path);
            this.deepClone = this.deepClone.proxy(this);
            this.global.sojs = this.global.sojs || this;
        },
        getPath: function(namespace) {
            var namespaceArray = namespace ? namespace.split(".") : false;
            var node = this.path;
            if (namespaceArray) {
                for (var i = 0, count = namespaceArray.length; i < count; i++) {
                    var currentName = namespaceArray[i].toLowerCase();
                    if (node[currentName]) {
                        node = node[currentName];
                    } else {
                        break;
                    }
                }
            }
            return node.pathValue;
        },
        setPath: function(namespace, path) {
            var node = this.path;
            if (typeof namespace === "object") {
                for (var key in namespace) {
                    if (key && namespace.hasOwnProperty(key)) {
                        this.setPath(key, namespace[key]);
                    }
                }
                return;
            }
            if (!path) {
                path = namespace;
            } else {
                var namespaceArray = namespace.split(".");
                for (var i = 0, count = namespaceArray.length; i < count; i++) {
                    var currentName = namespaceArray[i].toLowerCase();
                    node[currentName] = node[currentName] || {
                        pathValue: node.pathValue
                    };
                    node = node[currentName];
                }
            }
            node.pathValue = path;
            this.pathCache = {};
        },
        getClassPath: function(name, noExtension) {
            var result = this.pathCache[name];
            if (!result) {
                var basePath = this.getPath(name);
                var basePathIndex = basePath.length - 1;
                if (basePath.lastIndexOf("\\") !== basePathIndex && basePath.lastIndexOf("/") !== basePathIndex) {
                    basePath = basePath + "/";
                }
                result = basePath + name.replace(/\./gi, "/") + ".js";
                this.pathCache[name] = result;
            }
            if (noExtension) {
                result = result.replace(".js", "");
            }
            return result;
        },
        loadDeps: function(classObj, recording) {
            recording = recording || {};
            var deps = classObj.__deps;
            var namespace = classObj.__namespace;
            var unloadClass = [];
            for (var key in deps) {
                if (deps.hasOwnProperty(key) && deps[key]) {
                    var classFullName;
                    if (typeof deps[key] !== "string") {
                        classObj[key] = deps[key];
                        if (classObj[key] && classObj[key].__name) {
                            classFullName = classObj[key].__full;
                        }
                    } else {
                        classFullName = deps[key];
                        classObj[key] = this.find(classFullName);
                    }
                    if (!classFullName || recording[classFullName]) {
                        continue;
                    }
                    recording[classFullName] = true;
                    if (!classObj[key]) {
                        if (this.runtime === "node") {
                            try {
                                classObj[key] = require(this.getClassPath(classFullName));
                            } catch (ex) {
                                unloadClass.push(classFullName);
                            }
                        }
                        if (!classObj[key]) {
                            unloadClass.push(classFullName);
                        }
                    } else {
                        if (classObj[key].__deps) {
                            unloadClass = unloadClass.concat(this.loadDeps(classObj[key], recording));
                        }
                    }
                }
            }
            return unloadClass;
        },
        fastClone: function(source) {
            var Temp = function() {};
            Temp.prototype = source;
            var result = new Temp();
            return result;
        },
        deepClone: function(source, depth) {
            if (typeof depth !== "number") {
                depth = 5;
            }
            var to;
            var nextDepth = depth - 1;
            if (depth > 0) {
                if (source instanceof Date) {
                    to = new Date();
                    to.setTime(source.getTime());
                } else if (source instanceof Array) {
                    to = [];
                    for (var i = 0, count = source.length; i < count; i++) {
                        to[i] = this.deepClone(source[i], nextDepth);
                    }
                } else if (typeof source === "object") {
                    to = {};
                    for (var key in source) {
                        if (source.hasOwnProperty(key)) {
                            var item = source[key];
                            to[key] = this.deepClone(item, nextDepth);
                        }
                    }
                } else {
                    to = source;
                }
            } else {
                to = source;
            }
            return to;
        },
        proxy: function(context, method) {
            var thisArgs = Array.prototype.slice.apply(arguments);
            var thisObj = thisArgs.shift();
            var thisMethod = typeof this === "function" ? this : thisArgs.shift();
            return function() {
                var tempArgs = Array.prototype.slice.apply(arguments);
                return thisMethod.apply(thisObj, tempArgs.concat(thisArgs));
            };
        },
        find: function(name) {
            var result = this.classesCache[name];
            if (!result) {
                var nameArray = name.split(".");
                result = this.classes[nameArray[0]];
                for (var i = 1, count = nameArray.length; i < count; i++) {
                    if (result && result[nameArray[i]]) {
                        result = result[nameArray[i]];
                    } else {
                        result = null;
                        break;
                    }
                }
            }
            return result;
        },
        reload: function(name) {
            var result = this.find(name);
            if (result) {
                result.__status = 2;
                if (this.runtime === "node") {
                    var classPath = this.getClassPath(name);
                    delete require.cache[require.resolve(classPath)];
                    result = require(classPath);
                } else {
                    result = this.define(result);
                }
            } else {
                result = this.using(name);
            }
            return result;
        },
        create: function(classObj, p1, p2, p3, p4, p5) {
            if (typeof classObj === "string") {
                classObj = this.using(classObj);
            }
            var result = new classObj.__constructor(p1, p2, p3, p4, p5);
            return result;
        },
        using: function(name) {
            var result = this.find(name);
            if (this.runtime === "node") {
                if (!result) {
                    try {
                        require(this.getClassPath(name));
                    } catch (ex) {
                        throw ex;
                    }
                } else {
                    if (!result.__status || result.__status === 1) {
                        try {
                            require(this.getClassPath(name));
                        } catch (ex) {
                            result.__status = 2;
                        }
                    }
                }
                result = this.find(name);
            }
            return result;
        },
        define: function(classObj) {
            var name;
            var namespace = classObj.namespace;
            if (this.runtime === "node") {
                if (typeof classObj.name === "undefined" || typeof classObj.namespace === "undefined") {
                    var classDirPath = arguments.callee.caller.arguments[4];
                    var classFullPath = arguments.callee.caller.arguments[3];
                    if (!classObj.name && classDirPath && classFullPath) {
                        classObj.name = classFullPath.substring(classDirPath.length + 1, classFullPath.length - 3);
                    }
                    if (!classObj.namespace && classDirPath) {
                        classObj.namespace = classDirPath.substring(classDirPath.indexOf("src") + 4).replace(/\//gi, ".").replace(/\\/gi, ".");
                    }
                }
            }
            name = classObj.name || "__tempName";
            namespace = classObj.namespace || "";
            classObj.__name = name;
            classObj.__namespace = namespace;
            classObj.__full = namespace.length > 1 ? namespace + "." + name : name;
            classObj.__deps = classObj.deps;
            classObj.__deepClone = this.deepClone;
            classObj.__status = 2;
            classObj.__constructor = function(p1, p2, p3, p4, p5) {
                if (this.__clones && this.__clones.length > 0) {
                    for (var i = 0, count = this.__clones.length; i < count; i++) {
                        var key = this.__clones[i];
                        this[key] = this.__deepClone(this[key]);
                    }
                }
                this.__constructorSource(p1, p2, p3, p4, p5);
            };
            classObj.__constructorSource = classObj[name] || this.noop;
            classObj.__staticSource = classObj["$" + name] || this.noop;
            classObj.__staticUpdate = function() {
                var needCloneKeyArray = [];
                for (var key in this) {
                    if (this.hasOwnProperty(key)) {
                        var item = this[key];
                        if (typeof item === "object" && item !== null && key !== "deps" && key.indexOf("__") !== 0 && (!classObj.__deps || !classObj.__deps[key])) {
                            needCloneKeyArray.push(key);
                        }
                    }
                }
                this.__clones = needCloneKeyArray;
                this.__constructor.prototype = this;
            };
            classObj.__static = function() {
                this.__staticSource();
                this.__staticUpdate();
            };
            var preNamespaces = namespace.split(".");
            var count = preNamespaces.length;
            var currentClassObj = this.classes;
            var tempName;
            for (var i = 0; i < count; i++) {
                tempName = preNamespaces[i];
                if (tempName) {
                    currentClassObj[tempName] = currentClassObj[tempName] || {
                        __status: 1
                    };
                    currentClassObj = currentClassObj[tempName];
                }
            }
            currentClassObj[name] = currentClassObj[name] || {};
            var currentNamespace = currentClassObj;
            currentClassObj = currentClassObj[name];
            if (!currentClassObj.__name || currentClassObj.__status !== 3) {
                if (!currentClassObj.__status || currentClassObj.__status === 1) {
                    for (var key in currentNamespace[name]) {
                        if (key && currentNamespace[name].hasOwnProperty(key)) {
                            classObj[key] = currentNamespace[name][key];
                        }
                    }
                }
                classObj.__status = 3;
                currentNamespace[name] = classObj;
                classObj = currentNamespace[name];
                var unloadClass = this.loadDeps(classObj);
                if (unloadClass.length > 0) {
                    this.loader = this.loader || this.using("sojs.loader");
                    if (this.runtime === "browser" && this.loader) {
                        this.loader.loadDepsBrowser(classObj, unloadClass);
                    } else {
                        throw new Error('class "' + classObj.name + '"' + " loadDeps error:" + unloadClass.join(","));
                    }
                } else {
                    classObj.__static();
                }
            }
            if (this.runtime === "node" && arguments.callee.caller.arguments[2]) {
                arguments.callee.caller.arguments[2].exports = classObj;
            }
            this.classesCache[classObj.___full] = classObj;
            return classObj;
        }
    };
    sojs.define(sojs);
})();