!function(){var e={name:"sojs",namespace:"",classes:{},classesCache:{},path:{},pathCache:{},noop:function(){},$sojs:function(){var e={};if("undefined"!=typeof window&&window&&"undefined"!=typeof document&&document?(this.runtime="browser",e.global=window):(this.runtime="node",e.global=global),e.proxyName="proxy",e.path="node"===this.runtime?process.cwd()+"/src/":"/src/","undefined"!=typeof $sojs_config)for(var t in $sojs_config)t&&$sojs_config.hasOwnProperty(t)&&(e[t]=$sojs_config[t]);this.global=e.global,e.proxyName&&(Function.prototype[e.proxyName]=this.proxy),this.setPath(e.path),this.deepClone=this.deepClone.proxy(this),this.global.sojs=this.global.sojs||this},getPath:function(e){var t=e?e.split("."):!1,s=this.path;if(t)for(var a=0,i=t.length;i>a;a++){var n=t[a].toLowerCase();if(!s[n])break;s=s[n]}return s.pathValue},setPath:function(e,t){var s=this.path;if("object"!=typeof e){if(t)for(var a=e.split("."),i=0,n=a.length;n>i;i++){var r=a[i].toLowerCase();s[r]=s[r]||{pathValue:s.pathValue},s=s[r]}else t=e;s.pathValue=t,this.pathCache={}}else for(var o in e)o&&e.hasOwnProperty(o)&&this.setPath(o,e[o])},getClassPath:function(e,t){var s=this.pathCache[e];if(!s){var a=this.getPath(e),i=a.length-1;a.lastIndexOf("\\")!==i&&a.lastIndexOf("/")!==i&&(a+="/"),s=a+e.replace(/\./gi,"/")+".js",this.pathCache[e]=s}return t&&(s=s.replace(".js","")),s},loadDeps:function(e,t){t=t||{};var s=e.__deps,a=(e.__namespace,[]);for(var i in s)if(s.hasOwnProperty(i)&&s[i]){var n;if("string"!=typeof s[i]?(e[i]=s[i],e[i]&&e[i].__name&&(n=e[i].__full)):(n=s[i],e[i]=this.find(n)),!n||t[n])continue;if(t[n]=!0,e[i])e[i].__deps&&(a=a.concat(this.loadDeps(e[i],t)));else{if("node"===this.runtime)try{e[i]=require(this.getClassPath(n))}catch(r){a.push(n)}e[i]||a.push(n)}}return a},fastClone:function(e){var t=function(){};t.prototype=e;var s=new t;return s},deepClone:function(e,t){"number"!=typeof t&&(t=5);var s,a=t-1;if(t>0)if(e instanceof Date)s=new Date,s.setTime(e.getTime());else if(e instanceof Array){s=[];for(var i=0,n=e.length;n>i;i++)s[i]=this.deepClone(e[i],a)}else if("object"==typeof e){s={};for(var r in e)if(e.hasOwnProperty(r)){var o=e[r];s[r]=this.deepClone(o,a)}}else s=e;else s=e;return s},proxy:function(e,t){var s=Array.prototype.slice.apply(arguments),a=s.shift(),i="function"==typeof this?this:s.shift();return function(){var e=Array.prototype.slice.apply(arguments);return i.apply(a,e.concat(s))}},find:function(e){var t=this.classesCache[e];if(!t){var s=e.split(".");t=this.classes[s[0]];for(var a=1,i=s.length;i>a;a++){if(!t||!t[s[a]]){t=null;break}t=t[s[a]]}}return t},reload:function(e){var t=this.find(e);if(t)if(t.__status=2,"node"===this.runtime){var s=this.getClassPath(e);delete require.cache[require.resolve(s)],t=require(s)}else t=this.define(t);else t=this.using(e);return t},create:function(e,t,s,a,i,n){"string"==typeof e&&(e=this.using(e));var r=new e.__constructor(t,s,a,i,n);return r},using:function(e){var t=this.find(e);if("node"===this.runtime){if(t){if(!t.__status||1===t.__status)try{require(this.getClassPath(e))}catch(s){t.__status=2}}else try{require(this.getClassPath(e))}catch(s){throw s}t=this.find(e)}return t},define:function(e){var t,s=e.namespace;if("node"===this.runtime&&("undefined"==typeof e.name||"undefined"==typeof e.namespace)){var a=arguments.callee.caller.arguments[4],i=arguments.callee.caller.arguments[3];!e.name&&a&&i&&(e.name=i.substring(a.length+1,i.length-3)),!e.namespace&&a&&(e.namespace=a.substring(a.indexOf("src")+4).replace(/\//gi,".").replace(/\\/gi,"."))}t=e.name||"__tempName",s=e.namespace||"",e.__name=t,e.__namespace=s,e.__full=s.length>1?s+"."+t:t,e.__deps=e.deps,e.__deepClone=this.deepClone,e.__status=2,e.__constructor=function(e,t,s,a,i){if(this.__clones&&this.__clones.length>0)for(var n=0,r=this.__clones.length;r>n;n++){var o=this.__clones[n];this[o]=this.__deepClone(this[o])}this.__constructorSource(e,t,s,a,i)},e.__constructorSource=e[t]||this.noop,e.__staticSource=e["$"+t]||this.noop,e.__staticUpdate=function(){var t=[];for(var s in this)if(this.hasOwnProperty(s)){var a=this[s];"object"!=typeof a||null===a||"deps"===s||0===s.indexOf("__")||e.__deps&&e.__deps[s]||t.push(s)}this.__clones=t,this.__constructor.prototype=this},e.__static=function(){this.__staticSource(),this.__staticUpdate()};for(var n,r=s.split("."),o=r.length,h=this.classes,l=0;o>l;l++)n=r[l],n&&(h[n]=h[n]||{__status:1},h=h[n]);h[t]=h[t]||{};var c=h;if(h=h[t],!h.__name||3!==h.__status){if(!h.__status||1===h.__status)for(var f in c[t])f&&c[t].hasOwnProperty(f)&&(e[f]=c[t][f]);e.__status=3,c[t]=e,e=c[t];var p=this.loadDeps(e);if(p.length>0){if(this.loader=this.loader||this.using("sojs.loader"),"browser"!==this.runtime||!this.loader)throw new Error('class "'+e.name+'" loadDeps error:'+p.join(","));this.loader.loadDepsBrowser(e,p)}else e.__static()}return"node"===this.runtime&&arguments.callee.caller.arguments[2]&&(arguments.callee.caller.arguments[2].exports=e),this.classesCache[e.___full]=e,e}};e.define(e)}();