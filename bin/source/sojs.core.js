/**
 * sojs核心, 提供面向对象编程方式.
 * @author zhangziqiu<zhangziqiu@qq.com>
 */
(function() {
    // 类定义
    var sojs = {
        // 类名
        name: "sojs",
        // 命名空间
        namespace: "",
        // 类对象都注册到sojs.classes属性上
        classes: {},
        // 类索引.
        classesCache: {},
        // 存储命名空间的目录树
        path: {},
        // 缓存命名空间的路径
        pathCache: {},
        // 存储加载依赖错误信息
        loadErrorInfo: {},
        /**
         * 空函数
         */
        noop: function() {},
        /**
         * 静态构造函数
         */
        $sojs: function() {
            // 根据不同的运行环境, 设置默认值
            var config = {};
            // 判断是window还是node环境
            // 设置全局作用域, 默认浏览器模式为window, node模式为系统global变量. 会在全局作用域中添加sojs变量.
            if (typeof window !== "undefined" && window && typeof document !== "undefined" && document) {
                this.runtime = "browser";
                config.global = window;
            } else {
                this.runtime = "node";
                config.global = global;
            }
            // 为Function原型添加的proxy函数的函数名. false表示不添加. 默认为'proxy'. 可以使用sojs.proxy替代
            config.proxyName = "proxy";
            // 设置代码库根目录. node模式使用文件路径(可以是相对路径), 浏览器模式下需要提供完整的url地址.
            config.path = this.runtime === "node" ? process.cwd() + "/src/" : "/src/";
            // 从可访问的 $sojs_config 变量中获取用户定义的配置项
            if (typeof $sojs_config !== "undefined") {
                for (var key in $sojs_config) {
                    if (key && $sojs_config.hasOwnProperty(key)) {
                        config[key] = $sojs_config[key];
                    }
                }
            }
            // 根据config配置项进行初始化
            this.global = config.global;
            if (config.proxyName) {
                Function.prototype[config.proxyName] = this.proxy;
            }
            this.setPath(config.path);
            // deepClone会被赋值到class的__deepClone属性.因为是递归调用,所以需要修改指针.
            this.deepClone = this.deepClone.proxy(this);
            // 设置全局对象引用
            this.global.sojs = this.global.sojs || this;
        },
        /**
         * 从目录树中, 返回指定命名空间的磁盘根目录, 注意是根目录. 
         * 如果想要获取到类或命名空间的完成路径,请使用 getClassPath
         * @public
         * @param {string} namespace 命名空间, 比如"A.B.C"
         * @return {string} 路径, 比如设置了'A.B'的路径为'c:\src\', 则返回'c:\src\'. 而不是 'c:\src\A\B'
         */
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
        /**
         * 设置命名空间的目录:
         *      只设置一个根路径:       sojs.setPath('/root/');
         *      为特定命名空间设置路径: sojs.setPath('a.b.c','/root/myproject/');
         *      为多个命名空间设置路径: sojs.setPath({'a':'/root/projectA', 'b':'/root/projectB'});
         * @public
         * @param {string} namespace 命名空间, 比如"A.B.C"
         * @param {string} path 路径
         */
        setPath: function(namespace, path) {
            var node = this.path;
            if (typeof namespace === "object") {
                // 多个命名空间设置路径: sojs.setPath({'a':'/root/projectA', 'b':'/root/projectB'});
                for (var key in namespace) {
                    if (key && namespace.hasOwnProperty(key)) {
                        this.setPath(key, namespace[key]);
                    }
                }
                return;
            }
            if (!path) {
                // 只设置一个根路径: sojs.setPath('/root/');
                path = namespace;
            } else {
                // 为特定命名空间设置路径: sojs.setPath('a.b.c','/root/myproject/');
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
        /**
         * 获取类的资源文件相对路径
         * @public
         * @param {string} name 类的全限定性名(命名空间+类名, 比如 a.b.c)
         * @param {boolean} noExtension true表示返回的路径中不包含'.js'后缀
         * @return {string} 资源文件的相对路径(比如 /a/b/c.js)
         */
        getClassPath: function(name, noExtension) {
            var result = this.pathCache[name];
            if (!result) {
                var basePath = this.getPath(name);
                // 为路径添加末尾的斜杠
                var basePathIndex = basePath.length - 1;
                if (basePath.lastIndexOf("\\") !== basePathIndex && basePath.lastIndexOf("/") !== basePathIndex) {
                    basePath = basePath + "/";
                }
                result = basePath + name.replace(/\./gi, "/") + ".js";
                this.pathCache[name] = result;
            }
            // 不需要'.js'后缀. 需要获取目录是可以使用
            if (noExtension) {
                result = result.replace(".js", "");
            }
            return result;
        },
        /**
         * 加载依赖
         * @public
         * @param {Object} classObj 类对象
         * @param {Object} recording 递归加载时, 用于记录一个类的加载状态
         * @return {Object} 递归调用时, 用作recording参数的对象
         */
        loadDeps: function(classObj, recording) {
            recording = recording || {};
            var deps = classObj.__deps;
            var namespace = classObj.__namespace;
            var unloadClass = [];
            for (var key in deps) {
                if (deps.hasOwnProperty(key) && deps[key]) {
                    var classFullName;
                    // 如果key对应的是一个非string, 比如一个object, 则表示已经加载完依赖
                    if (typeof deps[key] !== "string") {
                        classObj[key] = deps[key];
                        // 是sojs类，则可以获取到全限定性名
                        if (classObj[key] && classObj[key].__name) {
                            classFullName = classObj[key].__full;
                        }
                    } else {
                        // 如果key是string, 表示传递的是sojs的命名空间
                        classFullName = deps[key];
                        classObj[key] = this.find(classFullName);
                    }
                    // 两种情况下跳过依赖加载.
                    // 1.已经被加载过, 即已经在recording中存在
                    // 2.没有找到classFullName. 即模块是node模块而非sojs模块
                    if (!classFullName || recording[classFullName]) {
                        continue;
                    }
                    recording[classFullName] = true;
                    if (!classObj[key]) {
                        // node模式下, 发现未加载的依赖类, 尝试使用require加载
                        if (this.runtime === "node") {
                            // node模式下, 如果依赖类无法加载则require会抛出异常
                            try {
                                classObj[key] = require(this.getClassPath(classFullName));
                            } catch (ex) {
                                this.loadErrorInfo[classFullName] = ex.stack.toString();
                            }
                        }
                        if (!classObj[key]) {
                            unloadClass.push(classFullName);
                        }
                    } else {
                        if (classObj[key].__deps) {
                            // 递归加载依赖类
                            unloadClass = unloadClass.concat(this.loadDeps(classObj[key], recording));
                        }
                    }
                }
            }
            return unloadClass;
        },
        /**
         * 快速克隆方法
         * @public
         * @param {Object} source 带克隆的对象. 使用此方法克隆出来的对象, 如果source对象被修改, 则所有克隆对象也会被修改
         * @return {Object} 克隆出来的对象.
         */
        fastClone: function(source) {
            var Temp = function() {};
            Temp.prototype = source;
            var result = new Temp();
            return result;
        },
        /**
         * 深度递归克隆
         * @public
         * @param {Object} source 带克隆的对象.
         * @param {number} depth 递归的深度.超过此深度将不会继续递归。
         * @return {*} 克隆出来的对象.
         */
        deepClone: function(source, depth) {
            if (typeof depth !== "number") {
                depth = 5;
            }
            var to;
            var nextDepth = depth - 1;
            if (depth > 0) {
                if (source instanceof Date) {
                    // 处理Date类型ate类型
                    to = new Date();
                    to.setTime(source.getTime());
                } else if (source instanceof Array) {
                    // 处理Array类型
                    to = [];
                    for (var i = 0, count = source.length; i < count; i++) {
                        to[i] = this.deepClone(source[i], nextDepth);
                    }
                } else if (typeof source === "object") {
                    // 处理其他引用类型
                    to = {};
                    for (var key in source) {
                        if (source.hasOwnProperty(key)) {
                            var item = source[key];
                            to[key] = this.deepClone(item, nextDepth);
                        }
                    }
                } else {
                    // 处理值类型
                    to = source;
                }
            } else {
                // 超过最大深度，不进行copy直接返回。
                to = source;
            }
            return to;
        },
        /**
         * 代理类函数, 用于修改函数中的this. 使用proxy函数后返回一个函数, 里面的this指针会被修改为context参数传递过来的对象.
         * @public
         * @param {Object} context 使用此对象替换函数的this指针.
         * @param {Function} method 需要替换this指针的函数.如果是通过函数原型的方式调用的, 则不需要此参数.
         * @return {Function} this指针被修改的函数
         */
        proxy: function(context, method) {
            var thisArgs = Array.prototype.slice.apply(arguments);
            var thisObj = thisArgs.shift();
            var thisMethod = typeof this === "function" ? this : thisArgs.shift();
            return function() {
                var tempArgs = Array.prototype.slice.apply(arguments);
                return thisMethod.apply(thisObj, tempArgs.concat(thisArgs));
            };
        },
        /**
         * 从全局对象上, 根据命名空间查找类对象
         * @public
         * @param {string} name 类的全限定性名(命名空间+类名, 比如 a.b.c)
         * @return {Object} 类引用
         */
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
        /**
         * 重新加载类. 当一个类发生变化的时候, 可以调用此函数强制更新node和sojs框架缓存的类定义.
         * @public
         * @param {string} name 类的全限定性名(命名空间+类名, 比如 a.b.c)
         * @return {Object} 类引用
         */
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
        /**
         * 创建一个类实例.  var a = sojs.create(classA, 'a');
         * @public
         * @param {Object|string} classObj 类对象或者类的全限定性名, 比如'a.b.c'
         * @param {*} p1 动态构造函数的参数.可以不传递
         * @param {*} p2 动态构造函数的参数.可以不传递
         * @param {*} p3 动态构造函数的参数.可以不传递
         * @param {*} p4 动态构造函数的参数.可以不传递
         * @param {*} p5 动态构造函数的参数.可以不传递
         * @return {Object} 类实例
         */
        create: function(classObj, p1, p2, p3, p4, p5) {
            // classObj如果是字符串, 则尝试使用using加载类.
            if (typeof classObj === "string") {
                classObj = this.using(classObj);
            }
            // 创建新的类实例, 创建的时候会执行构造函数。
            var result = new classObj.__constructor(p1, p2, p3, p4, p5);
            return result;
        },
        /**
         * 获取类引用. 在node模式下会加载类. 在browser模式下只是执行find查找.
         * @public
         * @param {string} name 类的全限定性名(命名空间+类名, 比如 a.b.c)
         * @return {Object} 类引用
         */
        using: function(name) {
            var result = this.find(name);
            // node模式下, 尝试使用require加载目标类.
            if (this.runtime === "node") {
                if (!result) {
                    // 类引用为空, 如果require失败则直接抛出异常
                    try {
                        require(this.getClassPath(name));
                    } catch (ex) {
                        throw ex;
                    }
                } else {
                    // 类引用不为空, 但是可能是在初始化前置命名空间时创建的空对象.
                    // 所以尝试进行一次命名空间类加载, 如果命名空间类不存在, 则设置__isBlankNamespace为ture
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
        /**
         * 定义一个类.
         * @public
         * @param {Object} classObj 类对象
         * @return {Object} sojs引用
         */
        define: function(classObj) {
            // 类名和命名空间的处理
            var name;
            var namespace = classObj.namespace;
            // node 模式下, 支持 name 和 namespace 自动补全
            if (this.runtime === "node") {
                // name 自动补全为文件名
                // namespace 自动补全规则为: 查找最近一个 src 文件夹, 以之后的文件夹名作为命名空间                
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
            // sojs框架属性内部都是用"__"开头存储，避免在运行时与用户设置的属性名冲突
            classObj.__name = name;
            classObj.__namespace = namespace;
            classObj.__full = namespace.length > 1 ? namespace + "." + name : name;
            classObj.__deps = classObj.deps;
            classObj.__deepClone = this.deepClone;
            // 1:preinit, 2:init, 3:registed
            classObj.__status = 2;
            // 动态构造函数
            classObj.__constructor = function(p1, p2, p3, p4, p5) {
                // 对需要深度克隆的属性进行克隆
                if (this.__clones && this.__clones.length > 0) {
                    for (var i = 0, count = this.__clones.length; i < count; i++) {
                        var key = this.__clones[i];
                        this[key] = this.__deepClone(this[key]);
                    }
                }
                this.__constructorSource(p1, p2, p3, p4, p5);
            };
            // 原始定义的动态构造函数
            classObj.__constructorSource = classObj[name] || this.noop;
            // 原始定义的静态构造函数
            classObj.__staticSource = classObj["$" + name] || this.noop;
            // __staticUpdate 用于当类定义变化时,比如静态构造函数中修改了类定义时,进行动态构造函数更新
            classObj.__staticUpdate = function() {
                // 对类定义进行一次扫描，判断哪些属性需要在创建实例时进行克隆；
                var needCloneKeyArray = [];
                for (var key in this) {
                    if (this.hasOwnProperty(key)) {
                        var item = this[key];
                        if (typeof item === "object" && item !== null && key !== "deps" && key.indexOf("__") !== 0 && (!classObj.__deps || !classObj.__deps[key])) {
                            needCloneKeyArray.push(key);
                        }
                    }
                }
                // __clones 存放所有需要克隆的属性名
                this.__clones = needCloneKeyArray;
                this.__constructor.prototype = this;
            };
            // 静态构造函数
            classObj.__static = function() {
                this.__staticSource();
                this.__staticUpdate();
            };
            // 初始化前置命名空间
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
            // currentNamespace 存储当前类所在的命名空间， currentClassObj存储类对象自身的引用。
            // 当修改类的属性是，可以直接通过 currentClassObj 操作。 当时如果整体替换类定义时，
            // 需要通过 currentNamespace[name] 修改。
            currentClassObj[name] = currentClassObj[name] || {};
            var currentNamespace = currentClassObj;
            currentClassObj = currentClassObj[name];
            // 新注册类
            if (!currentClassObj.__name || currentClassObj.__status !== 3) {
                // preinit表示当前命名空间在子类define时被初始化的. 此时需要对已经挂载的子类进行复制.
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
                // 加载依赖
                var unloadClass = this.loadDeps(classObj);
                // 发现未加载的依赖类
                if (unloadClass.length > 0) {
                    this.loader = this.loader || this.using("sojs.loader");
                    if (this.runtime === "browser" && this.loader) {
                        // 浏览器模式下, 如果发现存在未加载的依赖项, 并且安装了 sojs.loader,
                        // 则不立刻调用静态函数, 需要先加载依赖类.
                        this.loader.loadDepsBrowser(classObj, unloadClass);
                    } else {
                        // 发现未加载的依赖类, 抛出异常
                        var errorInfo = 'class "' + classObj.name + '" load deps error\n';
                        for (var i = 0; i < unloadClass.length; i++) {
                            errorInfo += "[" + unloadClass[i] + "]:" + this.loadErrorInfo[unloadClass[i]] + "\n";
                        }
                        throw new Error(errorInfo);
                    }
                } else {
                    // 依赖类全部加载完毕, 运行静态构造函数
                    classObj.__static();
                }
            }
            // 兼容node的require命令, 因为闭包问题导致sojs.define中的module始终指向sojs.js文件的module.使用eval和Function无法解决.
            // 故通过callee.caller先上寻找sojs.define的调用者, 从调用者环境中获取module.
            if (this.runtime === "node" && arguments.callee.caller.arguments[2]) {
                arguments.callee.caller.arguments[2].exports = classObj;
            }
            // 添加类索引
            this.classesCache[classObj.___full] = classObj;
            return classObj;
        }
    };
    // 自解析
    sojs.define(sojs);
})();