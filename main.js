// ==UserScript==
// @name         TamperDetectJS
// @namespace    http://tampermonkey.net/
// @version      2024-06-17
// @description  try to take over the world!
// @author       You
// @match        https://hrt.github.io/TamperDetectJS/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.io
// @grant        none
// @run-at       document-start
// ==/UserScript==

// IMPORTANT!!!! :
// Make sure in advanced settings that Inject Mode is set to INSTANT
// You can open advanced settings by going to settings and setting your config to advanced

var log = console.log

const nocall = String(Math.random()) + "__nocall"
const undef = String(Math.random()) + "__undef"
var hooks = new WeakMap()
var apply = Reflect.apply

var wm_get = WeakMap.prototype.get
var wm_set = WeakMap.prototype.set

Object.defineProperty(hooks, "get", {
    value: function(key) {
        return wm_get.call(hooks, key)
    },
    writable: false,
    configurable: false
})

Object.defineProperty(hooks, "set", {
    value: function(key, value) {
        return wm_set.call(hooks, key, value)
    },
    writable: false,
    configurable: false
})

function hook(target, property, callback, ignoreErrors = []) {
    var targetString// = target.toString
    var original = hooks.get(target[property]) // = target[property]

    if (original) {
        //targetString = original.toString
        log("already hooked!:", target[property])
        return
    } else {
        //targetString = target.toString
        original = target[property]
    }

    var properties = {
        _name: property,
        _prototype: undefined,
        _length: original.length,
    }

    var proxy = new Proxy(original, {
        apply(func, thisArg, args) {
            if (thisArg == null && args.length == 0) {
                throw new Error("Uncaught TypeError: Cannot convert undefined or null to object")
            }

            var ret = null
            try {
                ret = callback.call(thisArg, original, ...args)
            } catch(error) {
                /*
                error = error.message
                var found = false

                for (var i = 0; i < ignoreErrors.length; i++) {
                    var errorSubstring = ignoreErrors[i]

                    if (error.includes(errorSubstring)) {
                        found = true
                        break
                    }
                }

                if (!found) {
                    log(error)
                }
                */
            }

            if (ret == nocall) {
                return
            }

            if (ret == undef) {
                return undefined
            }

            if (ret != null && ret != undefined) {
                return ret
            }

            return apply(...arguments)
            //return original.call(this, ...args)
        },

        get(func, targetProperty) {
            if (targetProperty == "arguments") {
                var stack = (new Error()).stack

                throw new Error("Uncaught TypeError: 'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them", "at", stack)
            }

            var prop = properties[targetProperty]
            if (prop) {return prop}

            var ret = func[targetProperty]//Reflect.get(...arguments)

            /*
            if (typeof(ret) == "function") {
                ret = ret.bind(func)
            }
            */

            return ret
        }
    })

    target[property] = proxy
    hooks.set(proxy, original)

    //log(original)

    return [target[property], original]
}

function restore(target, property) {
    var original = hooks.get(target[property])
    hooks.delete(target[property])

    target[property] = original
}

/*
hook(Function.prototype, "valueOf", function(original) {
    if (hooks.get(this)) {
        return hooks.get(this)
    }
})

hook(Function.prototype, "hasOwnProperty", function(original, property) {
    if (hooks.get(this) && property == "prototype") {
        return false
    }
})
*/

/*
hook(Object, "getOwnPropertyDescriptor", function(original, target, property) {
    if (hooks.get(target)) {
       return original(hooks.get(target), property)
    }
})

hook(Object, "getOwnPropertyDescriptors", function(original, target) {
    if (hooks.get(target)) {
       return original(hooks.get(target))
    }
})

// if (Object.getOwnPropertyNames(hookedFunction).indexOf("prototype") != -1) {detect()}
hook(Object, "getOwnPropertyNames", function(original, target) {
    if (hooks.get(target)) {
       return original(hooks.get(target))
    }
})

hook(Object, "defineProperty", function(target, property, attributes) {
   console.log(target, property, attributes)
})
*/

/*
hook(Object, "getOwnPropertyDescriptors", function(original, target) {
    if (hooks.get(target)) {
       return original(hooks.get(target))
    }
})
*/

hook(Object.prototype, "toString", function(original) {
    if (hooks.get(this)) {
        return hooks.get(this).toString()//original.call(hooks.get(this))
    }
})

hook(Function.prototype, "toString", function(original) {
    if (hooks.get(this)) {
        return original.call(hooks.get(this))
    }

    var ret = original.call(this)
    if (ret == "function toString() { [native code] }") {
        return ret
    }
})

hook(String.prototype, "split", function(original, splitter) {
    if (splitter != "\n") {return}

    // check stack 2
    if (this.includes("TypeError: Cannot read properties of null (reading 'test')")) {
        return [1, 2, 3, 4, 5]
    }
})

var checkRegExp = new RegExp(/#<\w+>/)
hook(String.prototype, "includes", function(original, include) {
    if (include == "Proxy.toString" && original.call(this, "Proxy.toString (<anonymous>)")) {
        return false
    }

    if (checkRegExp.test(include)) {
        return true
    }
})

hook(Object, "getOwnPropertyDescriptor", function(original, target, property) {
    log("descriptor:", original)
    if (original(target, "toString") !== undefined) {return undef}

    /*
    if (hooks.get(target)) {
        if (property == "toString") {
            return undef
        }

       return original(hooks.get(target), property)
    }
    */
})

hook(Object, "create", function(original, obj) {
     if (hooks.get(obj)) {
         return original.call(this, hooks.get(obj))
     }
})

hook(Array.prototype, "join", function(original) {
    log("hooked:", original)
})

log("loaded")
