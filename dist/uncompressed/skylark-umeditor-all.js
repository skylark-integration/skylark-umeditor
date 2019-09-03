/**
 * skylark-umeditor - A version of umeditor that ported to running on skylarkjs.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-umeditor/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx/skylark");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-langx-ns/_attach',[],function(){
    return  function attach(obj1,path,obj2) {
        if (typeof path == "string") {
            path = path.split(".");//[path]
        };
        var length = path.length,
            ns=obj1,
            i=0,
            name = path[i++];

        while (i < length) {
            ns = ns[name] = ns[name] || {};
            name = path[i++];
        }

        return ns[name] = obj2;
    }
});
define('skylark-langx-ns/ns',[
    "./_attach"
], function(_attach) {
    var skylark = {
    	attach : function(path,obj) {
    		return _attach(skylark,path,obj);
    	}
    };
    return skylark;
});

define('skylark-langx-ns/main',[
	"./ns"
],function(skylark){
	return skylark;
});
define('skylark-langx-ns', ['skylark-langx-ns/main'], function (main) { return main; });

define('skylark-langx/skylark',[
    "skylark-langx-ns"
], function(ns) {
	return ns;
});

define('skylark-langx-types/types',[
    "skylark-langx-ns"
],function(skylark){
    var toString = {}.toString;
    
    var type = (function() {
        var class2type = {};

        // Populate the class2type map
        "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" ").forEach(function(name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
        });

        return function type(obj) {
            return obj == null ? String(obj) :
                class2type[toString.call(obj)] || "object";
        };
    })();

    function isArray(object) {
        return object && object.constructor === Array;
    }


    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function/string/element and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * isArrayLike([1, 2, 3])
     * // => true
     *
     * isArrayLike(document.body.children)
     * // => false
     *
     * isArrayLike('abc')
     * // => true
     *
     * isArrayLike(Function)
     * // => false
     */    
    function isArrayLike(obj) {
        return !isString(obj) && !isHtmlNode(obj) && typeof obj.length == 'number' && !isFunction(obj);
    }

    /**
     * Checks if `value` is classified as a boolean primitive or object.
     *
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a boolean, else `false`.
     * @example
     *
     * isBoolean(false)
     * // => true
     *
     * isBoolean(null)
     * // => false
     */
    function isBoolean(obj) {
        return typeof(obj) === "boolean";
    }

    function isDefined(obj) {
        return typeof obj !== 'undefined';
    }

    function isDocument(obj) {
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
    }

    function isEmptyObject(obj) {
        var name;
        for (name in obj) {
            if (obj[name] !== null) {
                return false;
            }
        }
        return true;
    }


    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * isFunction(parseInt)
     * // => true
     *
     * isFunction(/abc/)
     * // => false
     */
    function isFunction(value) {
        return type(value) == "function";
    }

    function isHtmlNode(obj) {
        return obj && obj.nodeType; // obj instanceof Node; //Consider the elements in IFRAME
    }

    function isInstanceOf( /*Object*/ value, /*Type*/ type) {
        //Tests whether the value is an instance of a type.
        if (value === undefined) {
            return false;
        } else if (value === null || type == Object) {
            return true;
        } else if (typeof value === "number") {
            return type === Number;
        } else if (typeof value === "string") {
            return type === String;
        } else if (typeof value === "boolean") {
            return type === Boolean;
        } else if (typeof value === "string") {
            return type === String;
        } else {
            return (value instanceof type) || (value && value.isInstanceOf ? value.isInstanceOf(type) : false);
        }
    }

    function isNull(value) {
      return type(value) === "null";
    }

    function isNumber(obj) {
        return typeof obj == 'number';
    }

    function isObject(obj) {
        return type(obj) == "object";
    }

    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
    }

    function isString(obj) {
        return typeof obj === 'string';
    }

    function isWindow(obj) {
        return obj && obj == obj.window;
    }

    function isSameOrigin(href) {
        if (href) {
            var origin = location.protocol + '//' + location.hostname;
            if (location.port) {
                origin += ':' + location.port;
            }
            return href.startsWith(origin);
        }
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && objectToString.call(value) == symbolTag);
    }

    function isUndefined(value) {
      return value === undefined
    }

    return skylark.attach("langx.types",{

        isArray: isArray,

        isArrayLike: isArrayLike,

        isBoolean: isBoolean,

        isDefined: isDefined,

        isDocument: isDocument,

        isEmpty : isEmptyObject,

        isEmptyObject: isEmptyObject,

        isFunction: isFunction,

        isHtmlNode: isHtmlNode,

        isNull: isNull,

        isNumber: isNumber,

        isNumeric: isNumber,

        isObject: isObject,

        isPlainObject: isPlainObject,

        isString: isString,

        isSameOrigin: isSameOrigin,

        isSymbol : isSymbol,

        isUndefined: isUndefined,

        isWindow: isWindow,

        type: type
    });

});
define('skylark-langx-types/main',[
	"./types"
],function(types){
	return types;
});
define('skylark-langx-types', ['skylark-langx-types/main'], function (main) { return main; });

define('skylark-langx-numbers/numbers',[
    "skylark-langx-ns",
    "skylark-langx-types"
],function(skylark,types){
	var isObject = types.isObject,
		isSymbol = types.isSymbol;

	var INFINITY = 1 / 0,
	    MAX_SAFE_INTEGER = 9007199254740991,
	    MAX_INTEGER = 1.7976931348623157e+308,
	    NAN = 0 / 0;

	/** Used to match leading and trailing whitespace. */
	var reTrim = /^\s+|\s+$/g;

	/** Used to detect bad signed hexadecimal string values. */
	var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

	/** Used to detect binary string values. */
	var reIsBinary = /^0b[01]+$/i;

	/** Used to detect octal string values. */
	var reIsOctal = /^0o[0-7]+$/i;

	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;

	/** Built-in method references without a dependency on `root`. */
	var freeParseInt = parseInt;

	/**
	 * Converts `value` to a finite number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.12.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted number.
	 * @example
	 *
	 * _.toFinite(3.2);
	 * // => 3.2
	 *
	 * _.toFinite(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toFinite(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toFinite('3.2');
	 * // => 3.2
	 */
	function toFinite(value) {
	  if (!value) {
	    return value === 0 ? value : 0;
	  }
	  value = toNumber(value);
	  if (value === INFINITY || value === -INFINITY) {
	    var sign = (value < 0 ? -1 : 1);
	    return sign * MAX_INTEGER;
	  }
	  return value === value ? value : 0;
	}

	/**
	 * Converts `value` to an integer.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
	 *
	 * @static
	 * @memberOf _
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted integer.
	 * @example
	 *
	 * _.toInteger(3.2);
	 * // => 3
	 *
	 * _.toInteger(Number.MIN_VALUE);
	 * // => 0
	 *
	 * _.toInteger(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toInteger('3.2');
	 * // => 3
	 */
	function toInteger(value) {
	  var result = toFinite(value),
	      remainder = result % 1;

	  return result === result ? (remainder ? result - remainder : result) : 0;
	}	

	/**
	 * Converts `value` to a number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {number} Returns the number.
	 * @example
	 *
	 * _.toNumber(3.2);
	 * // => 3.2
	 *
	 * _.toNumber(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toNumber(Infinity);
	 * // => Infinity
	 *
	 * _.toNumber('3.2');
	 * // => 3.2
	 */
	function toNumber(value) {
	  if (typeof value == 'number') {
	    return value;
	  }
	  if (isSymbol(value)) {
	    return NAN;
	  }
	  if (isObject(value)) {
	    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
	    value = isObject(other) ? (other + '') : other;
	  }
	  if (typeof value != 'string') {
	    return value === 0 ? value : +value;
	  }
	  value = value.replace(reTrim, '');
	  var isBinary = reIsBinary.test(value);
	  return (isBinary || reIsOctal.test(value))
	    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
	    : (reIsBadHex.test(value) ? NAN : +value);
	}

	return  skylark.attach("langx.numbers",{
		toFinite : toFinite,
		toNumber : toNumber,
		toInteger : toInteger
	});
});
define('skylark-langx-numbers/main',[
	"./numbers"
],function(numbers){
	return numbers;
});
define('skylark-langx-numbers', ['skylark-langx-numbers/main'], function (main) { return main; });

define('skylark-langx-objects/objects',[
    "skylark-langx-ns/ns",
    "skylark-langx-ns/_attach",
	"skylark-langx-types",
    "skylark-langx-numbers"
],function(skylark,_attach,types,numbers){
	var hasOwnProperty = Object.prototype.hasOwnProperty,
        slice = Array.prototype.slice,
        isBoolean = types.isBoolean,
        isFunction = types.isFunction,
		isObject = types.isObject,
		isPlainObject = types.isPlainObject,
		isArray = types.isArray,
        isArrayLike = types.isArrayLike,
        isString = types.isString,
        toInteger = numbers.toInteger;

     // An internal function for creating assigner functions.
    function createAssigner(keysFunc, defaults) {
        return function(obj) {
          var length = arguments.length;
          if (defaults) obj = Object(obj);  
          if (length < 2 || obj == null) return obj;
          for (var index = 1; index < length; index++) {
            var source = arguments[index],
                keys = keysFunc(source),
                l = keys.length;
            for (var i = 0; i < l; i++) {
              var key = keys[i];
              if (!defaults || obj[key] === void 0) obj[key] = source[key];
            }
          }
          return obj;
       };
    }

    // Internal recursive comparison function for `isEqual`.
    var eq, deepEq;
    var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

    eq = function(a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        // `null` or `undefined` only equal to itself (strict comparison).
        if (a == null || b == null) return false;
        // `NaN`s are equivalent, but non-reflexive.
        if (a !== a) return b !== b;
        // Exhaust primitive checks
        var type = typeof a;
        if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
        return deepEq(a, b, aStack, bStack);
    };

    // Internal recursive comparison function for `isEqual`.
    deepEq = function(a, b, aStack, bStack) {
        // Unwrap any wrapped objects.
        //if (a instanceof _) a = a._wrapped;
        //if (b instanceof _) b = b._wrapped;
        // Compare `[[Class]]` names.
        var className = toString.call(a);
        if (className !== toString.call(b)) return false;
        switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            case '[object RegExp]':
            // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                return '' + a === '' + b;
            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                // Object(NaN) is equivalent to NaN.
                if (+a !== +a) return +b !== +b;
                // An `egal` comparison is performed for other numeric values.
                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a === +b;
            case '[object Symbol]':
                return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
        }

        var areArrays = className === '[object Array]';
        if (!areArrays) {
            if (typeof a != 'object' || typeof b != 'object') return false;
            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor &&
                               isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

        // Initializing stack of traversed objects.
        // It's done here since we only need them for objects and arrays comparison.
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a) return bStack[length] === b;
        }

        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);

        // Recursively compare objects and arrays.
        if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            length = a.length;
            if (length !== b.length) return false;
            // Deep compare the contents, ignoring non-numeric properties.
            while (length--) {
                if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
        } else {
            // Deep compare objects.
            var keys = Object.keys(a), key;
            length = keys.length;
            // Ensure that both objects contain the same number of properties before comparing deep equality.
            if (Object.keys(b).length !== length) return false;
            while (length--) {
                // Deep compare each member
                key = keys[length];
                if (!(b[key]!==undefined && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }
        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();
        return true;
    };

    // Retrieve all the property names of an object.
    function allKeys(obj) {
        if (!isObject(obj)) return [];
        var keys = [];
        for (var key in obj) keys.push(key);
        return keys;
    }

    function each(obj, callback) {
        var length, key, i, undef, value;

        if (obj) {
            length = obj.length;

            if (length === undef) {
                // Loop object items
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        value = obj[key];
                        if (callback.call(value, key, value) === false) {
                            break;
                        }
                    }
                }
            } else {
                // Loop array items
                for (i = 0; i < length; i++) {
                    value = obj[i];
                    if (callback.call(value, i, value) === false) {
                        break;
                    }
                }
            }
        }

        return this;
    }

    function extend(target) {
        var deep, args = slice.call(arguments, 1);
        if (typeof target == 'boolean') {
            deep = target
            target = args.shift()
        }
        if (args.length == 0) {
            args = [target];
            target = this;
        }
        args.forEach(function(arg) {
            mixin(target, arg, deep);
        });
        return target;
    }

    // Retrieve the names of an object's own properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`.
    function keys(obj) {
        if (isObject(obj)) return [];
        var keys = [];
        for (var key in obj) if (has(obj, key)) keys.push(key);
        return keys;
    }

    function has(obj, path) {
        if (!isArray(path)) {
            return obj != null && hasOwnProperty.call(obj, path);
        }
        var length = path.length;
        for (var i = 0; i < length; i++) {
            var key = path[i];
            if (obj == null || !hasOwnProperty.call(obj, key)) {
                return false;
            }
            obj = obj[key];
        }
        return !!length;
    }

    /**
     * Checks if `value` is in `collection`. If `collection` is a string, it's
     * checked for a substring of `value`, otherwise
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * is used for equality comparisons. If `fromIndex` is negative, it's used as
     * the offset from the end of `collection`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object|string} collection The collection to inspect.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
     * @returns {boolean} Returns `true` if `value` is found, else `false`.
     * @example
     *
     * _.includes([1, 2, 3], 1);
     * // => true
     *
     * _.includes([1, 2, 3], 1, 2);
     * // => false
     *
     * _.includes({ 'a': 1, 'b': 2 }, 1);
     * // => true
     *
     * _.includes('abcd', 'bc');
     * // => true
     */
    function includes(collection, value, fromIndex, guard) {
      collection = isArrayLike(collection) ? collection : values(collection);
      fromIndex = (fromIndex && !guard) ? toInteger(fromIndex) : 0;

      var length = collection.length;
      if (fromIndex < 0) {
        fromIndex = nativeMax(length + fromIndex, 0);
      }
      return isString(collection)
        ? (fromIndex <= length && collection.indexOf(value, fromIndex) > -1)
        : (!!length && baseIndexOf(collection, value, fromIndex) > -1);
    }


   // Perform a deep comparison to check if two objects are equal.
    function isEqual(a, b) {
        return eq(a, b);
    }

    // Returns whether an object has a given set of `key:value` pairs.
    function isMatch(object, attrs) {
        var keys = keys(attrs), length = keys.length;
        if (object == null) return !length;
        var obj = Object(object);
        for (var i = 0; i < length; i++) {
          var key = keys[i];
          if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        return true;
    }    

    function _mixin(target, source, deep, safe) {
        for (var key in source) {
            //if (!source.hasOwnProperty(key)) {
            //    continue;
            //}
            if (safe && target[key] !== undefined) {
                continue;
            }
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
                    target[key] = {};
                }
                if (isArray(source[key]) && !isArray(target[key])) {
                    target[key] = [];
                }
                _mixin(target[key], source[key], deep, safe);
            } else if (source[key] !== undefined) {
                target[key] = source[key]
            }
        }
        return target;
    }

    function _parseMixinArgs(args) {
        var params = slice.call(arguments, 0),
            target = params.shift(),
            deep = false;
        if (isBoolean(params[params.length - 1])) {
            deep = params.pop();
        }

        return {
            target: target,
            sources: params,
            deep: deep
        };
    }

    function mixin() {
        var args = _parseMixinArgs.apply(this, arguments);

        args.sources.forEach(function(source) {
            _mixin(args.target, source, args.deep, false);
        });
        return args.target;
    }

   // Return a copy of the object without the blacklisted properties.
    function omit(obj, prop1,prop2) {
        if (!obj) {
            return null;
        }
        var result = mixin({},obj);
        for(var i=1;i<arguments.length;i++) {
            var pn = arguments[i];
            if (pn in obj) {
                delete result[pn];
            }
        }
        return result;

    }

   // Return a copy of the object only containing the whitelisted properties.
    function pick(obj,prop1,prop2) {
        if (!obj) {
            return null;
        }
        var result = {};
        for(var i=1;i<arguments.length;i++) {
            var pn = arguments[i];
            if (pn in obj) {
                result[pn] = obj[pn];
            }
        }
        return result;
    }

    function removeItem(items, item) {
        if (isArray(items)) {
            var idx = items.indexOf(item);
            if (idx != -1) {
                items.splice(idx, 1);
            }
        } else if (isPlainObject(items)) {
            for (var key in items) {
                if (items[key] == item) {
                    delete items[key];
                    break;
                }
            }
        }

        return this;
    }

    function result(obj, path, fallback) {
        if (!isArray(path)) {
            path = path.split(".");//[path]
        };
        var length = path.length;
        if (!length) {
          return isFunction(fallback) ? fallback.call(obj) : fallback;
        }
        for (var i = 0; i < length; i++) {
          var prop = obj == null ? void 0 : obj[path[i]];
          if (prop === void 0) {
            prop = fallback;
            i = length; // Ensure we don't continue iterating.
          }
          obj = isFunction(prop) ? prop.call(obj) : prop;
        }

        return obj;
    }

    function safeMixin() {
        var args = _parseMixinArgs.apply(this, arguments);

        args.sources.forEach(function(source) {
            _mixin(args.target, source, args.deep, true);
        });
        return args.target;
    }

    // Retrieve the values of an object's properties.
    function values(obj) {
        var keys = allKeys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    }

    function clone( /*anything*/ src,checkCloneMethod) {
        var copy;
        if (src === undefined || src === null) {
            copy = src;
        } else if (checkCloneMethod && src.clone) {
            copy = src.clone();
        } else if (isArray(src)) {
            copy = [];
            for (var i = 0; i < src.length; i++) {
                copy.push(clone(src[i]));
            }
        } else if (isPlainObject(src)) {
            copy = {};
            for (var key in src) {
                copy[key] = clone(src[key]);
            }
        } else {
            copy = src;
        }

        return copy;

    }

    return skylark.attach("langx.objects",{
        allKeys: allKeys,

        attach : _attach,

        clone: clone,

        defaults : createAssigner(allKeys, true),

        each : each,

        extend : extend,

        has: has,

        isEqual: isEqual,   

        includes: includes,

        isMatch: isMatch,

        keys: keys,

        mixin: mixin,

        omit: omit,

        pick: pick,

        removeItem: removeItem,

        result : result,
        
        safeMixin: safeMixin,

        values: values
    });


});
define('skylark-langx-objects/main',[
	"./objects"
],function(objects){
	return objects;
});
define('skylark-langx-objects', ['skylark-langx-objects/main'], function (main) { return main; });

define('skylark-langx-arrays/arrays',[
  "skylark-langx-ns/ns",
  "skylark-langx-types",
  "skylark-langx-objects"
],function(skylark,types,objects){
	var filter = Array.prototype.filter,
		isArrayLike = types.isArrayLike;

    /**
     * The base implementation of `_.findIndex` and `_.findLastIndex` without
     * support for iteratee shorthands.
     *
     * @param {Array} array The array to inspect.
     * @param {Function} predicate The function invoked per iteration.
     * @param {number} fromIndex The index to search from.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length,
          index = fromIndex + (fromRight ? 1 : -1);

      while ((fromRight ? index-- : ++index < length)) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
     *
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseIndexOf(array, value, fromIndex) {
      if (value !== value) {
        return baseFindIndex(array, baseIsNaN, fromIndex);
      }
      var index = fromIndex - 1,
          length = array.length;

      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `isNaN` without support for number objects.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
     */
    function baseIsNaN(value) {
      return value !== value;
    }


    function compact(array) {
        return filter.call(array, function(item) {
            return item != null;
        });
    }

    function filter2(array,func) {
      return filter.call(array,func);
    }

    function flatten(array) {
        if (isArrayLike(array)) {
            var result = [];
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                if (isArrayLike(item)) {
                    for (var j = 0; j < item.length; j++) {
                        result.push(item[j]);
                    }
                } else {
                    result.push(item);
                }
            }
            return result;
        } else {
            return array;
        }
        //return array.length > 0 ? concat.apply([], array) : array;
    }

    function grep(array, callback) {
        var out = [];

        objects.each(array, function(i, item) {
            if (callback(item, i)) {
                out.push(item);
            }
        });

        return out;
    }

    function inArray(item, array) {
        if (!array) {
            return -1;
        }
        var i;

        if (array.indexOf) {
            return array.indexOf(item);
        }

        i = array.length;
        while (i--) {
            if (array[i] === item) {
                return i;
            }
        }

        return -1;
    }

    function makeArray(obj, offset, startWith) {
       if (isArrayLike(obj) ) {
        return (startWith || []).concat(Array.prototype.slice.call(obj, offset || 0));
      }

      // array of single index
      return [ obj ];             
    }


    function forEach (arr, fn) {
      if (arr.forEach) return arr.forEach(fn)
      for (var i = 0; i < arr.length; i++) fn(arr[i], i);
    }

    function map(elements, callback) {
        var value, values = [],
            i, key
        if (isArrayLike(elements))
            for (i = 0; i < elements.length; i++) {
                value = callback.call(elements[i], elements[i], i);
                if (value != null) values.push(value)
            }
        else
            for (key in elements) {
                value = callback.call(elements[key], elements[key], key);
                if (value != null) values.push(value)
            }
        return flatten(values)
    }


    function merge( first, second ) {
      var l = second.length,
          i = first.length,
          j = 0;

      if ( typeof l === "number" ) {
        for ( ; j < l; j++ ) {
          first[ i++ ] = second[ j ];
        }
      } else {
        while ( second[j] !== undefined ) {
          first[ i++ ] = second[ j++ ];
        }
      }

      first.length = i;

      return first;
    }

    function reduce(array,callback,initialValue) {
        return Array.prototype.reduce.call(array,callback,initialValue);
    }

    function uniq(array) {
        return filter.call(array, function(item, idx) {
            return array.indexOf(item) == idx;
        })
    }

    return skylark.attach("langx.arrays",{
        baseFindIndex: baseFindIndex,

        baseIndexOf : baseIndexOf,
        
        compact: compact,

        first : function(items,n) {
            if (n) {
                return items.slice(0,n);
            } else {
                return items[0];
            }
        },

        filter : filter2,
        
        flatten: flatten,

        grep: grep,

        inArray: inArray,

        makeArray: makeArray,

        merge : merge,

        forEach : forEach,

        map : map,
        
        reduce : reduce,

        uniq : uniq

    });
});
define('skylark-langx-arrays/main',[
	"./arrays"
],function(arrays){
	return arrays;
});
define('skylark-langx-arrays', ['skylark-langx-arrays/main'], function (main) { return main; });

define('skylark-langx/arrays',[
	"skylark-langx-arrays"
],function(arrays){
  return arrays;
});
define('skylark-langx-klass/klass',[
  "skylark-langx-ns/ns",
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-arrays",
],function(skylark,types,objects,arrays){
    var uniq = arrays.uniq,
        has = objects.has,
        mixin = objects.mixin,
        isArray = types.isArray,
        isDefined = types.isDefined;

/* for reference 
 function klass(props,parent) {
    var ctor = function(){
        this._construct();
    };
    ctor.prototype = props;
    if (parent) {
        ctor._proto_ = parent;
        props.__proto__ = parent.prototype;
    }
    return ctor;
}

// Type some JavaScript code here.
let animal = klass({
  _construct(){
      this.name = this.name + ",hi";
  },
    
  name: "Animal",
  eat() {         // [[HomeObject]] == animal
    alert(`${this.name} eats.`);
  }
    
    
});


let rabbit = klass({
  name: "Rabbit",
  _construct(){
      super._construct();
  },
  eat() {         // [[HomeObject]] == rabbit
    super.eat();
  }
},animal);

let longEar = klass({
  name: "Long Ear",
  eat() {         // [[HomeObject]] == longEar
    super.eat();
  }
},rabbit);
*/
    
    function inherit(ctor, base) {
        var f = function() {};
        f.prototype = base.prototype;

        ctor.prototype = new f();
    }

    var f1 = function() {
        function extendClass(ctor, props, options) {
            // Copy the properties to the prototype of the class.
            var proto = ctor.prototype,
                _super = ctor.superclass.prototype,
                noOverrided = options && options.noOverrided,
                overrides = options && options.overrides || {};

            for (var name in props) {
                if (name === "constructor") {
                    continue;
                }

                // Check if we're overwriting an existing function
                var prop = props[name];
                if (typeof props[name] == "function") {
                    proto[name] =  !prop._constructor && !noOverrided && typeof _super[name] == "function" ?
                          (function(name, fn, superFn) {
                            return function() {
                                var tmp = this.overrided;

                                // Add a new ._super() method that is the same method
                                // but on the super-class
                                this.overrided = superFn;

                                // The method only need to be bound temporarily, so we
                                // remove it when we're done executing
                                var ret = fn.apply(this, arguments);

                                this.overrided = tmp;

                                return ret;
                            };
                        })(name, prop, _super[name]) :
                        prop;
                } else if (types.isPlainObject(prop) && prop!==null && (prop.get)) {
                    Object.defineProperty(proto,name,prop);
                } else {
                    proto[name] = prop;
                }
            }
            return ctor;
        }

        function serialMixins(ctor,mixins) {
            var result = [];

            mixins.forEach(function(mixin){
                if (has(mixin,"__mixins__")) {
                     throw new Error("nested mixins");
                }
                var clss = [];
                while (mixin) {
                    clss.unshift(mixin);
                    mixin = mixin.superclass;
                }
                result = result.concat(clss);
            });

            result = uniq(result);

            result = result.filter(function(mixin){
                var cls = ctor;
                while (cls) {
                    if (mixin === cls) {
                        return false;
                    }
                    if (has(cls,"__mixins__")) {
                        var clsMixines = cls["__mixins__"];
                        for (var i=0; i<clsMixines.length;i++) {
                            if (clsMixines[i]===mixin) {
                                return false;
                            }
                        }
                    }
                    cls = cls.superclass;
                }
                return true;
            });

            if (result.length>0) {
                return result;
            } else {
                return false;
            }
        }

        function mergeMixins(ctor,mixins) {
            var newCtor =ctor;
            for (var i=0;i<mixins.length;i++) {
                var xtor = new Function();
                xtor.prototype = Object.create(newCtor.prototype);
                xtor.__proto__ = newCtor;
                xtor.superclass = null;
                mixin(xtor.prototype,mixins[i].prototype);
                xtor.prototype.__mixin__ = mixins[i];
                newCtor = xtor;
            }

            return newCtor;
        }

        function _constructor ()  {
            if (this._construct) {
                return this._construct.apply(this, arguments);
            } else  if (this.init) {
                return this.init.apply(this, arguments);
            }
        }

        return function createClass(props, parent, mixins,options) {
            if (isArray(parent)) {
                options = mixins;
                mixins = parent;
                parent = null;
            }
            parent = parent || Object;

            if (isDefined(mixins) && !isArray(mixins)) {
                options = mixins;
                mixins = false;
            }

            var innerParent = parent;

            if (mixins) {
                mixins = serialMixins(innerParent,mixins);
            }

            if (mixins) {
                innerParent = mergeMixins(innerParent,mixins);
            }

            var klassName = props.klassName || "",
                ctor = new Function(
                    "return function " + klassName + "() {" +
                    "var inst = this," +
                    " ctor = arguments.callee;" +
                    "if (!(inst instanceof ctor)) {" +
                    "inst = Object.create(ctor.prototype);" +
                    "}" +
                    "return ctor._constructor.apply(inst, arguments) || inst;" + 
                    "}"
                )();


            // Populate our constructed prototype object
            ctor.prototype = Object.create(innerParent.prototype);

            // Enforce the constructor to be what we expect
            ctor.prototype.constructor = ctor;
            ctor.superclass = parent;

            // And make this class extendable
            ctor.__proto__ = innerParent;


            if (!ctor._constructor) {
                ctor._constructor = _constructor;
            } 

            if (mixins) {
                ctor.__mixins__ = mixins;
            }

            if (!ctor.partial) {
                ctor.partial = function(props, options) {
                    return extendClass(this, props, options);
                };
            }
            if (!ctor.inherit) {
                ctor.inherit = function(props, mixins,options) {
                    return createClass(props, this, mixins,options);
                };
            }

            ctor.partial(props, options);

            return ctor;
        };
    }

    var createClass = f1();

    return skylark.attach("langx.klass",createClass);
});
define('skylark-langx-klass/main',[
	"./klass"
],function(klass){
	return klass;
});
define('skylark-langx-klass', ['skylark-langx-klass/main'], function (main) { return main; });

define('skylark-langx/klass',[
    "skylark-langx-klass"
],function(klass){
    return klass;
});
define('skylark-langx/ArrayStore',[
    "./klass"
],function(klass){
    var SimpleQueryEngine = function(query, options){
        // summary:
        //      Simple query engine that matches using filter functions, named filter
        //      functions or objects by name-value on a query object hash
        //
        // description:
        //      The SimpleQueryEngine provides a way of getting a QueryResults through
        //      the use of a simple object hash as a filter.  The hash will be used to
        //      match properties on data objects with the corresponding value given. In
        //      other words, only exact matches will be returned.
        //
        //      This function can be used as a template for more complex query engines;
        //      for example, an engine can be created that accepts an object hash that
        //      contains filtering functions, or a string that gets evaluated, etc.
        //
        //      When creating a new dojo.store, simply set the store's queryEngine
        //      field as a reference to this function.
        //
        // query: Object
        //      An object hash with fields that may match fields of items in the store.
        //      Values in the hash will be compared by normal == operator, but regular expressions
        //      or any object that provides a test() method are also supported and can be
        //      used to match strings by more complex expressions
        //      (and then the regex's or object's test() method will be used to match values).
        //
        // options: dojo/store/api/Store.QueryOptions?
        //      An object that contains optional information such as sort, start, and count.
        //
        // returns: Function
        //      A function that caches the passed query under the field "matches".  See any
        //      of the "query" methods on dojo.stores.
        //
        // example:
        //      Define a store with a reference to this engine, and set up a query method.
        //
        //  |   var myStore = function(options){
        //  |       //  ...more properties here
        //  |       this.queryEngine = SimpleQueryEngine;
        //  |       //  define our query method
        //  |       this.query = function(query, options){
        //  |           return QueryResults(this.queryEngine(query, options)(this.data));
        //  |       };
        //  |   };

        // create our matching query function
        switch(typeof query){
            default:
                throw new Error("Can not query with a " + typeof query);
            case "object": case "undefined":
                var queryObject = query;
                query = function(object){
                    for(var key in queryObject){
                        var required = queryObject[key];
                        if(required && required.test){
                            // an object can provide a test method, which makes it work with regex
                            if(!required.test(object[key], object)){
                                return false;
                            }
                        }else if(required != object[key]){
                            return false;
                        }
                    }
                    return true;
                };
                break;
            case "string":
                // named query
                if(!this[query]){
                    throw new Error("No filter function " + query + " was found in store");
                }
                query = this[query];
                // fall through
            case "function":
                // fall through
        }
        
        function filter(arr, callback, thisObject){
            // summary:
            //      Returns a new Array with those items from arr that match the
            //      condition implemented by callback.
            // arr: Array
            //      the array to iterate over.
            // callback: Function|String
            //      a function that is invoked with three arguments (item,
            //      index, array). The return of this function is expected to
            //      be a boolean which determines whether the passed-in item
            //      will be included in the returned array.
            // thisObject: Object?
            //      may be used to scope the call to callback
            // returns: Array
            // description:
            //      This function corresponds to the JavaScript 1.6 Array.filter() method, with one difference: when
            //      run over sparse arrays, this implementation passes the "holes" in the sparse array to
            //      the callback function with a value of undefined. JavaScript 1.6's filter skips the holes in the sparse array.
            //      For more details, see:
            //      https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
            // example:
            //  | // returns [2, 3, 4]
            //  | array.filter([1, 2, 3, 4], function(item){ return item>1; });

            // TODO: do we need "Ctr" here like in map()?
            var i = 0, l = arr && arr.length || 0, out = [], value;
            if(l && typeof arr == "string") arr = arr.split("");
            if(typeof callback == "string") callback = cache[callback] || buildFn(callback);
            if(thisObject){
                for(; i < l; ++i){
                    value = arr[i];
                    if(callback.call(thisObject, value, i, arr)){
                        out.push(value);
                    }
                }
            }else{
                for(; i < l; ++i){
                    value = arr[i];
                    if(callback(value, i, arr)){
                        out.push(value);
                    }
                }
            }
            return out; // Array
        }

        function execute(array){
            // execute the whole query, first we filter
            var results = filter(array, query);
            // next we sort
            var sortSet = options && options.sort;
            if(sortSet){
                results.sort(typeof sortSet == "function" ? sortSet : function(a, b){
                    for(var sort, i=0; sort = sortSet[i]; i++){
                        var aValue = a[sort.attribute];
                        var bValue = b[sort.attribute];
                        // valueOf enables proper comparison of dates
                        aValue = aValue != null ? aValue.valueOf() : aValue;
                        bValue = bValue != null ? bValue.valueOf() : bValue;
                        if (aValue != bValue){
                            // modified by lwf 2016/07/09
                            //return !!sort.descending == (aValue == null || aValue > bValue) ? -1 : 1;
                            return !!sort.descending == (aValue == null || aValue > bValue) ? -1 : 1;
                        }
                    }
                    return 0;
                });
            }
            // now we paginate
            if(options && (options.start || options.count)){
                var total = results.length;
                results = results.slice(options.start || 0, (options.start || 0) + (options.count || Infinity));
                results.total = total;
            }
            return results;
        }
        execute.matches = query;
        return execute;
    };

    var QueryResults = function(results){
        // summary:
        //      A function that wraps the results of a store query with additional
        //      methods.
        // description:
        //      QueryResults is a basic wrapper that allows for array-like iteration
        //      over any kind of returned data from a query.  While the simplest store
        //      will return a plain array of data, other stores may return deferreds or
        //      promises; this wrapper makes sure that *all* results can be treated
        //      the same.
        //
        //      Additional methods include `forEach`, `filter` and `map`.
        // results: Array|dojo/promise/Promise
        //      The result set as an array, or a promise for an array.
        // returns:
        //      An array-like object that can be used for iterating over.
        // example:
        //      Query a store and iterate over the results.
        //
        //  |   store.query({ prime: true }).forEach(function(item){
        //  |       //  do something
        //  |   });

        if(!results){
            return results;
        }

        var isPromise = !!results.then;
        // if it is a promise it may be frozen
        if(isPromise){
            results = Object.delegate(results);
        }
        function addIterativeMethod(method){
            // Always add the iterative methods so a QueryResults is
            // returned whether the environment is ES3 or ES5
            results[method] = function(){
                var args = arguments;
                var result = Deferred.when(results, function(results){
                    //Array.prototype.unshift.call(args, results);
                    return QueryResults(Array.prototype[method].apply(results, args));
                });
                // forEach should only return the result of when()
                // when we're wrapping a promise
                if(method !== "forEach" || isPromise){
                    return result;
                }
            };
        }

        addIterativeMethod("forEach");
        addIterativeMethod("filter");
        addIterativeMethod("map");
        if(results.total == null){
            results.total = Deferred.when(results, function(results){
                return results.length;
            });
        }
        return results; // Object
    };

    var ArrayStore = klass({
        "klassName": "ArrayStore",

        "queryEngine": SimpleQueryEngine,
        
        "idProperty": "id",


        get: function(id){
            // summary:
            //      Retrieves an object by its identity
            // id: Number
            //      The identity to use to lookup the object
            // returns: Object
            //      The object in the store that matches the given id.
            return this.data[this.index[id]];
        },

        getIdentity: function(object){
            return object[this.idProperty];
        },

        put: function(object, options){
            var data = this.data,
                index = this.index,
                idProperty = this.idProperty;
            var id = object[idProperty] = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
            if(id in index){
                // object exists
                if(options && options.overwrite === false){
                    throw new Error("Object already exists");
                }
                // replace the entry in data
                data[index[id]] = object;
            }else{
                // add the new object
                index[id] = data.push(object) - 1;
            }
            return id;
        },

        add: function(object, options){
            (options = options || {}).overwrite = false;
            // call put with overwrite being false
            return this.put(object, options);
        },

        remove: function(id){
            // summary:
            //      Deletes an object by its identity
            // id: Number
            //      The identity to use to delete the object
            // returns: Boolean
            //      Returns true if an object was removed, falsy (undefined) if no object matched the id
            var index = this.index;
            var data = this.data;
            if(id in index){
                data.splice(index[id], 1);
                // now we have to reindex
                this.setData(data);
                return true;
            }
        },
        query: function(query, options){
            // summary:
            //      Queries the store for objects.
            // query: Object
            //      The query to use for retrieving objects from the store.
            // options: dojo/store/api/Store.QueryOptions?
            //      The optional arguments to apply to the resultset.
            // returns: dojo/store/api/Store.QueryResults
            //      The results of the query, extended with iterative methods.
            //
            // example:
            //      Given the following store:
            //
            //  |   var store = new Memory({
            //  |       data: [
            //  |           {id: 1, name: "one", prime: false },
            //  |           {id: 2, name: "two", even: true, prime: true},
            //  |           {id: 3, name: "three", prime: true},
            //  |           {id: 4, name: "four", even: true, prime: false},
            //  |           {id: 5, name: "five", prime: true}
            //  |       ]
            //  |   });
            //
            //  ...find all items where "prime" is true:
            //
            //  |   var results = store.query({ prime: true });
            //
            //  ...or find all items where "even" is true:
            //
            //  |   var results = store.query({ even: true });
            return QueryResults(this.queryEngine(query, options)(this.data));
        },

        setData: function(data){
            // summary:
            //      Sets the given data as the source for this store, and indexes it
            // data: Object[]
            //      An array of objects to use as the source of data.
            if(data.items){
                // just for convenience with the data format IFRS expects
                this.idProperty = data.identifier || this.idProperty;
                data = this.data = data.items;
            }else{
                this.data = data;
            }
            this.index = {};
            for(var i = 0, l = data.length; i < l; i++){
                this.index[data[i][this.idProperty]] = i;
            }
        },

        init: function(options) {
            for(var i in options){
                this[i] = options[i];
            }
            this.setData(this.data || []);
        }

    });

	return ArrayStore;
});
define('skylark-langx-aspect/aspect',[
    "skylark-langx-ns"
],function(skylark){

  var undefined, nextId = 0;
    function advise(dispatcher, type, advice, receiveArguments){
        var previous = dispatcher[type];
        var around = type == "around";
        var signal;
        if(around){
            var advised = advice(function(){
                return previous.advice(this, arguments);
            });
            signal = {
                remove: function(){
                    if(advised){
                        advised = dispatcher = advice = null;
                    }
                },
                advice: function(target, args){
                    return advised ?
                        advised.apply(target, args) :  // called the advised function
                        previous.advice(target, args); // cancelled, skip to next one
                }
            };
        }else{
            // create the remove handler
            signal = {
                remove: function(){
                    if(signal.advice){
                        var previous = signal.previous;
                        var next = signal.next;
                        if(!next && !previous){
                            delete dispatcher[type];
                        }else{
                            if(previous){
                                previous.next = next;
                            }else{
                                dispatcher[type] = next;
                            }
                            if(next){
                                next.previous = previous;
                            }
                        }

                        // remove the advice to signal that this signal has been removed
                        dispatcher = advice = signal.advice = null;
                    }
                },
                id: nextId++,
                advice: advice,
                receiveArguments: receiveArguments
            };
        }
        if(previous && !around){
            if(type == "after"){
                // add the listener to the end of the list
                // note that we had to change this loop a little bit to workaround a bizarre IE10 JIT bug
                while(previous.next && (previous = previous.next)){}
                previous.next = signal;
                signal.previous = previous;
            }else if(type == "before"){
                // add to beginning
                dispatcher[type] = signal;
                signal.next = previous;
                previous.previous = signal;
            }
        }else{
            // around or first one just replaces
            dispatcher[type] = signal;
        }
        return signal;
    }
    function aspect(type){
        return function(target, methodName, advice, receiveArguments){
            var existing = target[methodName], dispatcher;
            if(!existing || existing.target != target){
                // no dispatcher in place
                target[methodName] = dispatcher = function(){
                    var executionId = nextId;
                    // before advice
                    var args = arguments;
                    var before = dispatcher.before;
                    while(before){
                        args = before.advice.apply(this, args) || args;
                        before = before.next;
                    }
                    // around advice
                    if(dispatcher.around){
                        var results = dispatcher.around.advice(this, args);
                    }
                    // after advice
                    var after = dispatcher.after;
                    while(after && after.id < executionId){
                        if(after.receiveArguments){
                            var newResults = after.advice.apply(this, args);
                            // change the return value only if a new value was returned
                            results = newResults === undefined ? results : newResults;
                        }else{
                            results = after.advice.call(this, results, args);
                        }
                        after = after.next;
                    }
                    return results;
                };
                if(existing){
                    dispatcher.around = {advice: function(target, args){
                        return existing.apply(target, args);
                    }};
                }
                dispatcher.target = target;
            }
            var results = advise((dispatcher || existing), type, advice, receiveArguments);
            advice = null;
            return results;
        };
    }

    return skylark.attach("langx.aspect",{
        after: aspect("after"),
 
        around: aspect("around"),
        
        before: aspect("before")
    });
});
define('skylark-langx-aspect/main',[
	"./aspect"
],function(aspect){
	return aspect;
});
define('skylark-langx-aspect', ['skylark-langx-aspect/main'], function (main) { return main; });

define('skylark-langx/aspect',[
    "skylark-langx-aspect"
],function(aspect){
  return aspect;
});
define('skylark-langx-funcs/funcs',[
  "skylark-langx-ns/ns",
  "skylark-langx-types",
  "skylark-langx-objects"
],function(skylark,types,objects){
	var mixin = objects.mixin,
        slice = Array.prototype.slice,
        isFunction = types.isFunction,
        isString = types.isString;

    function defer(fn) {
        if (requestAnimationFrame) {
            requestAnimationFrame(fn);
        } else {
            setTimeoutout(fn);
        }
        return this;
    }

    function noop() {
    }

    function proxy(fn, context) {
        var args = (2 in arguments) && slice.call(arguments, 2)
        if (isFunction(fn)) {
            var proxyFn = function() {
                return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
            }
            return proxyFn;
        } else if (isString(context)) {
            if (args) {
                args.unshift(fn[context], fn)
                return proxy.apply(null, args)
            } else {
                return proxy(fn[context], fn);
            }
        } else {
            throw new TypeError("expected function");
        }
    }

    function debounce(fn, wait) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                fn.apply(context, args);
            };
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
   
    var delegate = (function() {
        // boodman/crockford delegation w/ cornford optimization
        function TMP() {}
        return function(obj, props) {
            TMP.prototype = obj;
            var tmp = new TMP();
            TMP.prototype = null;
            if (props) {
                mixin(tmp, props);
            }
            return tmp; // Object
        };
    })();

  var templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };


  function template(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = objects.defaults({}, settings,templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offset.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    var render;
    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

    return skylark.attach("langx.funcs",{
        debounce: debounce,

        delegate: delegate,

        defer: defer,

        noop : noop,

        proxy: proxy,

        returnTrue: function() {
            return true;
        },

        returnFalse: function() {
            return false;
        },

        templateSettings : templateSettings,
        template : template
    });
});
define('skylark-langx-funcs/main',[
	"./funcs"
],function(funcs){
	return funcs;
});
define('skylark-langx-funcs', ['skylark-langx-funcs/main'], function (main) { return main; });

define('skylark-langx-async/Deferred',[
    "skylark-langx-arrays",
	"skylark-langx-funcs",
    "skylark-langx-objects"
],function(arrays,funcs,objects){
    "use strict";
    
    var  PGLISTENERS = Symbol ? Symbol() : '__pglisteners',
         PGNOTIFIES = Symbol ? Symbol() : '__pgnotifies';

    var slice = Array.prototype.slice,
        proxy = funcs.proxy,
        makeArray = arrays.makeArray,
        result = objects.result,
        mixin = objects.mixin;

    mixin(Promise.prototype,{
        always: function(handler) {
            //this.done(handler);
            //this.fail(handler);
            this.then(handler,handler);
            return this;
        },
        done : function() {
            for (var i = 0;i<arguments.length;i++) {
                this.then(arguments[i]);
            }
            return this;
        },
        fail : function(handler) { 
            //return mixin(Promise.prototype.catch.call(this,handler),added);
            //return this.then(null,handler);
            this.catch(handler);
            return this;
         }
    });


    var Deferred = function() {
        var self = this,
            p = this.promise = new Promise(function(resolve, reject) {
                self._resolve = resolve;
                self._reject = reject;
            });

        wrapPromise(p,self);

        this[PGLISTENERS] = [];
        this[PGNOTIFIES] = [];

        //this.resolve = Deferred.prototype.resolve.bind(this);
        //this.reject = Deferred.prototype.reject.bind(this);
        //this.progress = Deferred.prototype.progress.bind(this);

    };

    function wrapPromise(p,d) {
        var   added = {
                state : function() {
                    if (d.isResolved()) {
                        return 'resolved';
                    }
                    if (d.isRejected()) {
                        return 'rejected';
                    }
                    return 'pending';
                },
                then : function(onResolved,onRejected,onProgress) {
                    if (onProgress) {
                        this.progress(onProgress);
                    }
                    return wrapPromise(Promise.prototype.then.call(this,
                            onResolved && function(args) {
                                if (args && args.__ctx__ !== undefined) {
                                    return onResolved.apply(args.__ctx__,args);
                                } else {
                                    return onResolved(args);
                                }
                            },
                            onRejected && function(args){
                                if (args && args.__ctx__ !== undefined) {
                                    return onRejected.apply(args.__ctx__,args);
                                } else {
                                    return onRejected(args);
                                }
                            }));
                },
                progress : function(handler) {
                    d[PGNOTIFIES].forEach(function (value) {
                        handler(value);
                    });
                    d[PGLISTENERS].push(handler);
                    return this;
                }

            };

        added.pipe = added.then;
        return mixin(p,added);

    }

    Deferred.prototype.resolve = function(value) {
        var args = slice.call(arguments);
        return this.resolveWith(null,args);
    };

    Deferred.prototype.resolveWith = function(context,args) {
        args = args ? makeArray(args) : []; 
        args.__ctx__ = context;
        this._resolve(args);
        this._resolved = true;
        return this;
    };

    Deferred.prototype.notify = function(value) {
        try {
            this[PGNOTIFIES].push(value);

            return this[PGLISTENERS].forEach(function (listener) {
                return listener(value);
            });
        } catch (error) {
          this.reject(error);
        }
        return this;
    };

    Deferred.prototype.reject = function(reason) {
        var args = slice.call(arguments);
        return this.rejectWith(null,args);
    };

    Deferred.prototype.rejectWith = function(context,args) {
        args = args ? makeArray(args) : []; 
        args.__ctx__ = context;
        this._reject(args);
        this._rejected = true;
        return this;
    };

    Deferred.prototype.isResolved = function() {
        return !!this._resolved;
    };

    Deferred.prototype.isRejected = function() {
        return !!this._rejected;
    };

    Deferred.prototype.then = function(callback, errback, progback) {
        var p = result(this,"promise");
        return p.then(callback, errback, progback);
    };

    Deferred.prototype.progress = function(progback){
        var p = result(this,"promise");
        return p.progress(progback);
    };
   
    Deferred.prototype.catch = function(errback) {
        var p = result(this,"promise");
        return p.catch(errback);
    };


    Deferred.prototype.done  = function() {
        var p = result(this,"promise");
        return p.done.apply(p,arguments);
    };

    Deferred.prototype.fail = function(errback) {
        var p = result(this,"promise");
        return p.fail(errback);
    };


    Deferred.all = function(array) {
        //return wrapPromise(Promise.all(array));
        var d = new Deferred();
        Promise.all(array).then(d.resolve.bind(d),d.reject.bind(d));
        return result(d,"promise");
    };

    Deferred.first = function(array) {
        return wrapPromise(Promise.race(array));
    };


    Deferred.when = function(valueOrPromise, callback, errback, progback) {
        var receivedPromise = valueOrPromise && typeof valueOrPromise.then === "function";
        var nativePromise = receivedPromise && valueOrPromise instanceof Promise;

        if (!receivedPromise) {
            if (arguments.length > 1) {
                return callback ? callback(valueOrPromise) : valueOrPromise;
            } else {
                return new Deferred().resolve(valueOrPromise);
            }
        } else if (!nativePromise) {
            var deferred = new Deferred(valueOrPromise.cancel);
            valueOrPromise.then(proxy(deferred.resolve,deferred), proxy(deferred.reject,deferred), deferred.notify);
            valueOrPromise = deferred.promise;
        }

        if (callback || errback || progback) {
            return valueOrPromise.then(callback, errback, progback);
        }
        return valueOrPromise;
    };

    Deferred.reject = function(err) {
        var d = new Deferred();
        d.reject(err);
        return d.promise;
    };

    Deferred.resolve = function(data) {
        var d = new Deferred();
        d.resolve.apply(d,arguments);
        return d.promise;
    };

    Deferred.immediate = Deferred.resolve;

    return Deferred;
});
define('skylark-langx-async/async',[
    "skylark-langx-ns",
    "skylark-langx-objects",
    "./Deferred"
],function(skylark,objects,Deferred){
    var each = objects.each;
    
    var async = {
        Deferred : Deferred,

        parallel : function(arr,args,ctx) {
            var rets = [];
            ctx = ctx || null;
            args = args || [];

            each(arr,function(i,func){
                rets.push(func.apply(ctx,args));
            });

            return Deferred.all(rets);
        },

        series : function(arr,args,ctx) {
            var rets = [],
                d = new Deferred(),
                p = d.promise;

            ctx = ctx || null;
            args = args || [];

            d.resolve();
            each(arr,function(i,func){
                p = p.then(function(){
                    return func.apply(ctx,args);
                });
                rets.push(p);
            });

            return Deferred.all(rets);
        },

        waterful : function(arr,args,ctx) {
            var d = new Deferred(),
                p = d.promise;

            ctx = ctx || null;
            args = args || [];

            d.resolveWith(ctx,args);

            each(arr,function(i,func){
                p = p.then(func);
            });
            return p;
        }
    };

	return skylark.attach("langx.async",async);	
});
define('skylark-langx-async/main',[
	"./async"
],function(async){
	return async;
});
define('skylark-langx-async', ['skylark-langx-async/main'], function (main) { return main; });

define('skylark-langx/async',[
    "skylark-langx-async"
],function(async){
    return async;
});
define('skylark-langx-datetimes/datetimes',[
    "skylark-langx-ns"
],function(skylark){
     function parseMilliSeconds(str) {

        var strs = str.split(' ');
        var number = parseInt(strs[0]);

        if (isNaN(number)){
            return 0;
        }

        var min = 60000 * 60;

        switch (strs[1].trim().replace(/\./g, '')) {
            case 'minutes':
            case 'minute':
            case 'min':
            case 'mm':
            case 'm':
                return 60000 * number;
            case 'hours':
            case 'hour':
            case 'HH':
            case 'hh':
            case 'h':
            case 'H':
                return min * number;
            case 'seconds':
            case 'second':
            case 'sec':
            case 'ss':
            case 's':
                return 1000 * number;
            case 'days':
            case 'day':
            case 'DD':
            case 'dd':
            case 'd':
                return (min * 24) * number;
            case 'months':
            case 'month':
            case 'MM':
            case 'M':
                return (min * 24 * 28) * number;
            case 'weeks':
            case 'week':
            case 'W':
            case 'w':
                return (min * 24 * 7) * number;
            case 'years':
            case 'year':
            case 'yyyy':
            case 'yy':
            case 'y':
                return (min * 24 * 365) * number;
            default:
                return 0;
        }
    };
	
	return skylark.attach("langx.datetimes",{
		parseMilliSeconds
	});
});
define('skylark-langx-datetimes/main',[
	"./datetimes"
],function(datetimes){
	return datetimes;
});
define('skylark-langx-datetimes', ['skylark-langx-datetimes/main'], function (main) { return main; });

define('skylark-langx/datetimes',[
    "skylark-langx-datetimes"
],function(datetimes){
    return datetimes;
});
define('skylark-langx/Deferred',[
    "skylark-langx-async/Deferred"
],function(Deferred){
    return Deferred;
});
define('skylark-langx-emitter/Evented',[
  "skylark-langx-ns/ns",
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-arrays",
  "skylark-langx-klass"
],function(skylark,types,objects,arrays,klass){
    var slice = Array.prototype.slice,
        compact = arrays.compact,
        isDefined = types.isDefined,
        isPlainObject = types.isPlainObject,
        isFunction = types.isFunction,
        isString = types.isString,
        isEmptyObject = types.isEmptyObject,
        mixin = objects.mixin;

    function parse(event) {
        var segs = ("" + event).split(".");
        return {
            name: segs[0],
            ns: segs.slice(1).join(" ")
        };
    }

    var Evented = klass({
        on: function(events, selector, data, callback, ctx, /*used internally*/ one) {
            var self = this,
                _hub = this._hub || (this._hub = {});

            if (isPlainObject(events)) {
                ctx = callback;
                each(events, function(type, fn) {
                    self.on(type, selector, data, fn, ctx, one);
                });
                return this;
            }

            if (!isString(selector) && !isFunction(callback)) {
                ctx = callback;
                callback = data;
                data = selector;
                selector = undefined;
            }

            if (isFunction(data)) {
                ctx = callback;
                callback = data;
                data = null;
            }

            if (isString(events)) {
                events = events.split(/\s/)
            }

            events.forEach(function(event) {
                var parsed = parse(event),
                    name = parsed.name,
                    ns = parsed.ns;

                (_hub[name] || (_hub[name] = [])).push({
                    fn: callback,
                    selector: selector,
                    data: data,
                    ctx: ctx,
                    ns : ns,
                    one: one
                });
            });

            return this;
        },

        one: function(events, selector, data, callback, ctx) {
            return this.on(events, selector, data, callback, ctx, 1);
        },

        trigger: function(e /*,argument list*/ ) {
            if (!this._hub) {
                return this;
            }

            var self = this;

            if (isString(e)) {
                e = new CustomEvent(e);
            }

            Object.defineProperty(e,"target",{
                value : this
            });

            var args = slice.call(arguments, 1);
            if (isDefined(args)) {
                args = [e].concat(args);
            } else {
                args = [e];
            }
            [e.type || e.name, "all"].forEach(function(eventName) {
                var parsed = parse(eventName),
                    name = parsed.name,
                    ns = parsed.ns;

                var listeners = self._hub[name];
                if (!listeners) {
                    return;
                }

                var len = listeners.length,
                    reCompact = false;

                for (var i = 0; i < len; i++) {
                    var listener = listeners[i];
                    if (ns && (!listener.ns ||  !listener.ns.startsWith(ns))) {
                        continue;
                    }
                    if (e.data) {
                        if (listener.data) {
                            e.data = mixin({}, listener.data, e.data);
                        }
                    } else {
                        e.data = listener.data || null;
                    }
                    listener.fn.apply(listener.ctx, args);
                    if (listener.one) {
                        listeners[i] = null;
                        reCompact = true;
                    }
                }

                if (reCompact) {
                    self._hub[eventName] = compact(listeners);
                }

            });
            return this;
        },

        listened: function(event) {
            var evtArr = ((this._hub || (this._events = {}))[event] || []);
            return evtArr.length > 0;
        },

        listenTo: function(obj, event, callback, /*used internally*/ one) {
            if (!obj) {
                return this;
            }

            // Bind callbacks on obj,
            if (isString(callback)) {
                callback = this[callback];
            }

            if (one) {
                obj.one(event, callback, this);
            } else {
                obj.on(event, callback, this);
            }

            //keep track of them on listening.
            var listeningTo = this._listeningTo || (this._listeningTo = []),
                listening;

            for (var i = 0; i < listeningTo.length; i++) {
                if (listeningTo[i].obj == obj) {
                    listening = listeningTo[i];
                    break;
                }
            }
            if (!listening) {
                listeningTo.push(
                    listening = {
                        obj: obj,
                        events: {}
                    }
                );
            }
            var listeningEvents = listening.events,
                listeningEvent = listeningEvents[event] = listeningEvents[event] || [];
            if (listeningEvent.indexOf(callback) == -1) {
                listeningEvent.push(callback);
            }

            return this;
        },

        listenToOnce: function(obj, event, callback) {
            return this.listenTo(obj, event, callback, 1);
        },

        off: function(events, callback) {
            var _hub = this._hub || (this._hub = {});
            if (isString(events)) {
                events = events.split(/\s/)
            }

            events.forEach(function(event) {
                var parsed = parse(event),
                    name = parsed.name,
                    ns = parsed.ns;

                var evts = _hub[name];

                if (evts) {
                    var liveEvents = [];

                    if (callback || ns) {
                        for (var i = 0, len = evts.length; i < len; i++) {
                            
                            if (callback && evts[i].fn !== callback && evts[i].fn._ !== callback) {
                                liveEvents.push(evts[i]);
                                continue;
                            } 

                            if (ns && (!evts[i].ns || evts[i].ns.indexOf(ns)!=0)) {
                                liveEvents.push(evts[i]);
                                continue;
                            }
                        }
                    }

                    if (liveEvents.length) {
                        _hub[name] = liveEvents;
                    } else {
                        delete _hub[name];
                    }

                }
            });

            return this;
        },
        unlistenTo: function(obj, event, callback) {
            var listeningTo = this._listeningTo;
            if (!listeningTo) {
                return this;
            }
            for (var i = 0; i < listeningTo.length; i++) {
                var listening = listeningTo[i];

                if (obj && obj != listening.obj) {
                    continue;
                }

                var listeningEvents = listening.events;
                for (var eventName in listeningEvents) {
                    if (event && event != eventName) {
                        continue;
                    }

                    var listeningEvent = listeningEvents[eventName];

                    for (var j = 0; j < listeningEvent.length; j++) {
                        if (!callback || callback == listeningEvent[i]) {
                            listening.obj.off(eventName, listeningEvent[i], this);
                            listeningEvent[i] = null;
                        }
                    }

                    listeningEvent = listeningEvents[eventName] = compact(listeningEvent);

                    if (isEmptyObject(listeningEvent)) {
                        listeningEvents[eventName] = null;
                    }

                }

                if (isEmptyObject(listeningEvents)) {
                    listeningTo[i] = null;
                }
            }

            listeningTo = this._listeningTo = compact(listeningTo);
            if (isEmptyObject(listeningTo)) {
                this._listeningTo = null;
            }

            return this;
        }
    });

    return skylark.attach("langx.Evented",Evented);

});
define('skylark-langx-emitter/main',[
	"./Evented"
],function(Evented){
	return Evented;
});
define('skylark-langx-emitter', ['skylark-langx-emitter/main'], function (main) { return main; });

define('skylark-langx/Evented',[
    "skylark-langx-emitter"
],function(Evented){
    return Evented;
});
define('skylark-langx/funcs',[
    "skylark-langx-funcs"
],function(funcs){
    return funcs;
});
define('skylark-langx-hoster/hoster',[
    "skylark-langx-ns"
],function(skylark){
	// The javascript host environment, brower and nodejs are supported.
	var hoster = {
		"isBrowser" : true, // default
		"isNode" : null,
		"global" : this,
		"browser" : null,
		"node" : null
	};

	if (typeof process == "object" && process.versions && process.versions.node && process.versions.v8) {
		hoster.isNode = true;
		hoster.isBrowser = false;
	}

	hoster.global = (function(){
		if (typeof global !== 'undefined' && typeof global !== 'function') {
			// global spec defines a reference to the global object called 'global'
			// https://github.com/tc39/proposal-global
			// `global` is also defined in NodeJS
			return global;
		} else if (typeof window !== 'undefined') {
			// window is defined in browsers
			return window;
		}
		else if (typeof self !== 'undefined') {
			// self is defined in WebWorkers
			return self;
		}
		return this;
	})();

	var _document = null;

	Object.defineProperty(hoster,"document",function(){
		if (!_document) {
			var w = typeof window === 'undefined' ? require('html-element') : window;
			_document = w.document;
		}

		return _document;
	});

	if (hoster.isBrowser) {
	    function uaMatch( ua ) {
		    ua = ua.toLowerCase();

		    var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
		      /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
		      /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
		      /(msie) ([\w.]+)/.exec( ua ) ||
		      ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
		      [];

		    return {
		      browser: match[ 1 ] || '',
		      version: match[ 2 ] || '0'
		    };
	  	};

	    var matched = uaMatch( navigator.userAgent );

	    var browser = hoster.browser = {};

	    if ( matched.browser ) {
	      browser[ matched.browser ] = true;
	      browser.version = matched.version;
	    }

	    // Chrome is Webkit, but Webkit is also Safari.
	    if ( browser.chrome ) {
	      browser.webkit = true;
	    } else if ( browser.webkit ) {
	      browser.safari = true;
	    }
	}

	return  skylark.attach("langx.hoster",hoster);
});
define('skylark-langx-hoster/main',[
	"./hoster"
],function(hoster){
	return hoster;
});
define('skylark-langx-hoster', ['skylark-langx-hoster/main'], function (main) { return main; });

define('skylark-langx/hoster',[
	"skylark-langx-hoster"
],function(hoster){
	return hoster;
});
define('skylark-langx/numbers',[
	"skylark-langx-numbers"
],function(numbers){
	return numbers;
});
define('skylark-langx/objects',[
    "skylark-langx-objects"
],function(objects){
    return objects;
});
define('skylark-langx-strings/strings',[
    "skylark-langx-ns"
],function(skylark){
    // add default escape function for escaping HTML entities
    var escapeCharMap = Object.freeze({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
        '=': '&#x3D;',
    });
    function replaceChar(c) {
        return escapeCharMap[c];
    }
    var escapeChars = /[&<>"'`=]/g;


     /*
     * Converts camel case into dashes.
     * @param {String} str
     * @return {String}
     * @exapmle marginTop -> margin-top
     */
    function dasherize(str) {
        return str.replace(/::/g, '/')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z\d])([A-Z])/g, '$1_$2')
            .replace(/_/g, '-')
            .toLowerCase();
    }

    function deserializeValue(value) {
        try {
            return value ?
                value == "true" ||
                (value == "false" ? false :
                    value == "null" ? null :
                    +value + "" == value ? +value :
                    /^[\[\{]/.test(value) ? JSON.parse(value) :
                    value) : value;
        } catch (e) {
            return value;
        }
    }

    function escapeHTML(str) {
        if (str == null) {
            return '';
        }
        if (!str) {
            return String(str);
        }

        return str.toString().replace(escapeChars, replaceChar);
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        });
    }

    function trim(str) {
        return str == null ? "" : String.prototype.trim.call(str);
    }

    function substitute( /*String*/ template,
        /*Object|Array*/
        map,
        /*Function?*/
        transform,
        /*Object?*/
        thisObject) {
        // summary:
        //    Performs parameterized substitutions on a string. Throws an
        //    exception if any parameter is unmatched.
        // template:
        //    a string with expressions in the form `${key}` to be replaced or
        //    `${key:format}` which specifies a format function. keys are case-sensitive.
        // map:
        //    hash to search for substitutions
        // transform:
        //    a function to process all parameters before substitution takes


        thisObject = thisObject || window;
        transform = transform ?
            proxy(thisObject, transform) : function(v) {
                return v;
            };

        function getObject(key, map) {
            if (key.match(/\./)) {
                var retVal,
                    getValue = function(keys, obj) {
                        var _k = keys.pop();
                        if (_k) {
                            if (!obj[_k]) return null;
                            return getValue(keys, retVal = obj[_k]);
                        } else {
                            return retVal;
                        }
                    };
                return getValue(key.split(".").reverse(), map);
            } else {
                return map[key];
            }
        }

        return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g,
            function(match, key, format) {
                var value = getObject(key, map);
                if (format) {
                    value = getObject(format, thisObject).call(thisObject, value, key);
                }
                return transform(value, key).toString();
            }); // String
    }

    var idCounter = 0;
    function uniqueId (prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
    }


    /**
     * https://github.com/cho45/micro-template.js
     * (c) cho45 http://cho45.github.com/mit-license
     */
    function template (id, data) {

        function include(name, args) {
            var stash = {};
            for (var key in template.context.stash) if (template.context.stash.hasOwnProperty(key)) {
                stash[key] = template.context.stash[key];
            }
            if (args) for (var key in args) if (args.hasOwnProperty(key)) {
                stash[key] = args[key];
            }
            var context = template.context;
            context.ret += template(name, stash);
            template.context = context;
        }

        function wrapper(name, fun) {
            var current = template.context.ret;
            template.context.ret = '';
            fun.apply(template.context);
            var content = template.context.ret;
            var orig_content = template.context.stash.content;
            template.context.stash.content = content;
            template.context.ret = current + template(name, template.context.stash);
            template.context.stash.content = orig_content;
        }

        var me = arguments.callee;
        if (!me.cache[id]) me.cache[id] = (function () {
            var name = id, string = /^[\w\-]+$/.test(id) ? me.get(id): (name = 'template(string)', id); // no warnings
            var line = 1, body = (
                "try { " +
                    (me.variable ?  "var " + me.variable + " = this.stash;" : "with (this.stash) { ") +
                        "this.ret += '"  +
                        string.
                            replace(/<%/g, '\x11').replace(/%>/g, '\x13'). // if you want other tag, just edit this line
                            replace(/'(?![^\x11\x13]+?\x13)/g, '\\x27').
                            replace(/^\s*|\s*$/g, '').
                            replace(/\n|\r\n/g, function () { return "';\nthis.line = " + (++line) + "; this.ret += '\\n" }).
                            replace(/\x11=raw(.+?)\x13/g, "' + ($1) + '").
                            replace(/\x11=(.+?)\x13/g, "' + this.escapeHTML($1) + '").
                            replace(/\x11(.+?)\x13/g, "'; $1; this.ret += '") +
                    "'; " + (me.variable ? "" : "}") + "return this.ret;" +
                "} catch (e) { throw 'TemplateError: ' + e + ' (on " + name + "' + ' line ' + this.line + ')'; } " +
                "//@ sourceURL=" + name + "\n" // source map
            ).replace(/this\.ret \+= '';/g, '');
            var func = new Function(body);
            var map  = { '&' : '&amp;', '<' : '&lt;', '>' : '&gt;', '\x22' : '&#x22;', '\x27' : '&#x27;' };
            var escapeHTML = function (string) { return (''+string).replace(/[&<>\'\"]/g, function (_) { return map[_] }) };
            return function (stash) { return func.call(me.context = { escapeHTML: escapeHTML, line: 1, ret : '', stash: stash }) };
        })();
        return data ? me.cache[id](data) : me.cache[id];
    }

    template.cache = {};
    

    template.get = function (id) {
        return document.getElementById(id).innerHTML;
    };

    function rtrim(str) {
        return str.replace(/\s+$/g, '');
    }

    // Slugify a string
    function slugify(str) {
        str = str.replace(/^\s+|\s+$/g, '');

        // Make the string lowercase
        str = str.toLowerCase();

        // Remove accents, swap ñ for n, etc
        var from = "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
        var to   = "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        // Remove invalid chars
        //str = str.replace(/[^a-z0-9 -]/g, '') 
        // Collapse whitespace and replace by -
        str = str.replace(/\s+/g, '-') 
        // Collapse dashes
        .replace(/-+/g, '-'); 

        return str;
    }    

    // return boolean if string 'true' or string 'false', or if a parsable string which is a number
    // also supports JSON object and/or arrays parsing
    function toType(str) {
        var type = typeof str;
        if (type !== 'string') {
            return str;
        }
        var nb = parseFloat(str);
        if (!isNaN(nb) && isFinite(str)) {
            return nb;
        }
        if (str === 'false') {
            return false;
        }
        if (str === 'true') {
            return true;
        }

        try {
            str = JSON.parse(str);
        } catch (e) {}

        return str;
    }

	return skylark.attach("langx.strings",{
        camelCase: function(str) {
            return str.replace(/-([\da-z])/g, function(a) {
                return a.toUpperCase().replace('-', '');
            });
        },

        dasherize: dasherize,

        deserializeValue: deserializeValue,

        escapeHTML : escapeHTML,

        generateUUID : generateUUID,

        lowerFirst: function(str) {
            return str.charAt(0).toLowerCase() + str.slice(1);
        },

        rtrim : rtrim,

        serializeValue: function(value) {
            return JSON.stringify(value)
        },


        substitute: substitute,

        slugify : slugify,

        template : template,

        trim: trim,

        uniqueId: uniqueId,

        upperFirst: function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
	}) ; 

});
define('skylark-langx-strings/main',[
	"./strings"
],function(strings){
	return strings;
});
define('skylark-langx-strings', ['skylark-langx-strings/main'], function (main) { return main; });

define('skylark-langx/strings',[
    "skylark-langx-strings"
],function(strings){
    return strings;
});
define('skylark-langx-xhr/Xhr',[
  "skylark-langx-ns/ns",
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-arrays",
  "skylark-langx-funcs",
  "skylark-langx-async/Deferred",
  "skylark-langx-emitter/Evented"
],function(skylark,types,objects,arrays,funcs,Deferred,Evented){

    var each = objects.each,
        mixin = objects.mixin,
        noop = funcs.noop,
        isArray = types.isArray,
        isFunction = types.isFunction,
        isPlainObject = types.isPlainObject,
        type = types.type;
 
     var getAbsoluteUrl = (function() {
        var a;

        return function(url) {
            if (!a) a = document.createElement('a');
            a.href = url;

            return a.href;
        };
    })();
   
    var Xhr = (function(){
        var jsonpID = 0,
            key,
            name,
            rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            scriptTypeRE = /^(?:text|application)\/javascript/i,
            xmlTypeRE = /^(?:text|application)\/xml/i,
            jsonType = 'application/json',
            htmlType = 'text/html',
            blankRE = /^\s*$/;

        var XhrDefaultOptions = {
            async: true,

            // Default type of request
            type: 'GET',
            // Callback that is executed before request
            beforeSend: noop,
            // Callback that is executed if the request succeeds
            success: noop,
            // Callback that is executed the the server drops error
            error: noop,
            // Callback that is executed on request complete (both: error and success)
            complete: noop,
            // The context for the callbacks
            context: null,
            // Whether to trigger "global" Ajax events
            global: true,

            // MIME types mapping
            // IIS returns Javascript as "application/x-javascript"
            accepts: {
                script: 'text/javascript, application/javascript, application/x-javascript',
                json: 'application/json',
                xml: 'application/xml, text/xml',
                html: 'text/html',
                text: 'text/plain'
            },
            // Whether the request is to another domain
            crossDomain: false,
            // Default timeout
            timeout: 0,
            // Whether data should be serialized to string
            processData: true,
            // Whether the browser should be allowed to cache GET responses
            cache: true,

            xhrFields : {
                withCredentials : true
            }
        };

        function mimeToDataType(mime) {
            if (mime) {
                mime = mime.split(';', 2)[0];
            }
            if (mime) {
                if (mime == htmlType) {
                    return "html";
                } else if (mime == jsonType) {
                    return "json";
                } else if (scriptTypeRE.test(mime)) {
                    return "script";
                } else if (xmlTypeRE.test(mime)) {
                    return "xml";
                }
            }
            return "text";
        }

        function appendQuery(url, query) {
            if (query == '') return url
            return (url + '&' + query).replace(/[&?]{1,2}/, '?')
        }

        // serialize payload and append it to the URL for GET requests
        function serializeData(options) {
            options.data = options.data || options.query;
            if (options.processData && options.data && type(options.data) != "string") {
                options.data = param(options.data, options.traditional);
            }
            if (options.data && (!options.type || options.type.toUpperCase() == 'GET')) {
                options.url = appendQuery(options.url, options.data);
                options.data = undefined;
            }
        }

        function serialize(params, obj, traditional, scope) {
            var t, array = isArray(obj),
                hash = isPlainObject(obj)
            each(obj, function(key, value) {
                t =type(value);
                if (scope) key = traditional ? scope :
                    scope + '[' + (hash || t == 'object' || t == 'array' ? key : '') + ']'
                // handle data in serializeArray() format
                if (!scope && array) params.add(value.name, value.value)
                // recurse into nested objects
                else if (t == "array" || (!traditional && t == "object"))
                    serialize(params, value, traditional, key)
                else params.add(key, value)
            })
        }

        var param = function(obj, traditional) {
            var params = []
            params.add = function(key, value) {
                if (isFunction(value)) {
                  value = value();
                }
                if (value == null) {
                  value = "";
                }
                this.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            };
            serialize(params, obj, traditional)
            return params.join('&').replace(/%20/g, '+')
        };

        var Xhr = Evented.inherit({
            klassName : "Xhr",

            _request  : function(args) {
                var _ = this._,
                    self = this,
                    options = mixin({},XhrDefaultOptions,_.options,args),
                    xhr = _.xhr = new XMLHttpRequest();

                serializeData(options)

                if (options.beforeSend) {
                    options.beforeSend.call(this, xhr, options);
                }                

                var dataType = options.dataType || options.handleAs,
                    mime = options.mimeType || options.accepts[dataType],
                    headers = options.headers,
                    xhrFields = options.xhrFields,
                    isFormData = options.data && options.data instanceof FormData,
                    basicAuthorizationToken = options.basicAuthorizationToken,
                    type = options.type,
                    url = options.url,
                    async = options.async,
                    user = options.user , 
                    password = options.password,
                    deferred = new Deferred(),
                    contentType = isFormData ? false : 'application/x-www-form-urlencoded';

                if (xhrFields) {
                    for (name in xhrFields) {
                        xhr[name] = xhrFields[name];
                    }
                }

                if (mime && mime.indexOf(',') > -1) {
                    mime = mime.split(',', 2)[0];
                }
                if (mime && xhr.overrideMimeType) {
                    xhr.overrideMimeType(mime);
                }

                //if (dataType) {
                //    xhr.responseType = dataType;
                //}

                var finish = function() {
                    xhr.onloadend = noop;
                    xhr.onabort = noop;
                    xhr.onprogress = noop;
                    xhr.ontimeout = noop;
                    xhr = null;
                }
                var onloadend = function() {
                    var result, error = false
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && getAbsoluteUrl(url).startsWith('file:'))) {
                        dataType = dataType || mimeToDataType(options.mimeType || xhr.getResponseHeader('content-type'));

                        result = xhr.responseText;
                        try {
                            if (dataType == 'script') {
                                eval(result);
                            } else if (dataType == 'xml') {
                                result = xhr.responseXML;
                            } else if (dataType == 'json') {
                                result = blankRE.test(result) ? null : JSON.parse(result);
                            } else if (dataType == "blob") {
                                result = Blob([xhrObj.response]);
                            } else if (dataType == "arraybuffer") {
                                result = xhr.reponse;
                            }
                        } catch (e) { 
                            error = e;
                        }

                        if (error) {
                            deferred.reject(error,xhr.status,xhr);
                        } else {
                            deferred.resolve(result,xhr.status,xhr);
                        }
                    } else {
                        deferred.reject(new Error(xhr.statusText),xhr.status,xhr);
                    }
                    finish();
                };

                var onabort = function() {
                    if (deferred) {
                        deferred.reject(new Error("abort"),xhr.status,xhr);
                    }
                    finish();                 
                }
 
                var ontimeout = function() {
                    if (deferred) {
                        deferred.reject(new Error("timeout"),xhr.status,xhr);
                    }
                    finish();                 
                }

                var onprogress = function(evt) {
                    if (deferred) {
                        deferred.notify(evt,xhr.status,xhr);
                    }
                }

                xhr.onloadend = onloadend;
                xhr.onabort = onabort;
                xhr.ontimeout = ontimeout;
                xhr.onprogress = onprogress;

                xhr.open(type, url, async, user, password);
               
                if (headers) {
                    for ( var key in headers) {
                        var value = headers[key];
 
                        if(key.toLowerCase() === 'content-type'){
                            contentType = headers[hdr];
                        } else {
                           xhr.setRequestHeader(key, value);
                        }
                    }
                }   

                if  (contentType && contentType !== false){
                    xhr.setRequestHeader('Content-Type', contentType);
                }

                if(!headers || !('X-Requested-With' in headers)){
                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                }


                //If basicAuthorizationToken is defined set its value into "Authorization" header
                if (basicAuthorizationToken) {
                    xhr.setRequestHeader("Authorization", basicAuthorizationToken);
                }

                xhr.send(options.data ? options.data : null);

                return deferred.promise;

            },

            "abort": function() {
                var _ = this._,
                    xhr = _.xhr;

                if (xhr) {
                    xhr.abort();
                }    
            },


            "request": function(args) {
                return this._request(args);
            },

            get : function(args) {
                args = args || {};
                args.type = "GET";
                return this._request(args);
            },

            post : function(args) {
                args = args || {};
                args.type = "POST";
                return this._request(args);
            },

            patch : function(args) {
                args = args || {};
                args.type = "PATCH";
                return this._request(args);
            },

            put : function(args) {
                args = args || {};
                args.type = "PUT";
                return this._request(args);
            },

            del : function(args) {
                args = args || {};
                args.type = "DELETE";
                return this._request(args);
            },

            "init": function(options) {
                this._ = {
                    options : options || {}
                };
            }
        });

        ["request","get","post","put","del","patch"].forEach(function(name){
            Xhr[name] = function(url,args) {
                var xhr = new Xhr({"url" : url});
                return xhr[name](args);
            };
        });

        Xhr.defaultOptions = XhrDefaultOptions;
        Xhr.param = param;

        return Xhr;
    })();

	return skylark.attach("langx.Xhr",Xhr);	
});
define('skylark-langx-xhr/main',[
	"./Xhr"
],function(Xhr){
	return Xhr;
});
define('skylark-langx-xhr', ['skylark-langx-xhr/main'], function (main) { return main; });

define('skylark-langx/Xhr',[
    "skylark-langx-xhr"
],function(xhr){
    return xhr;
});
define('skylark-langx/Restful',[
    "./Evented",
    "./objects",
    "./strings",
    "./Xhr"
],function(Evented,objects,strings,Xhr){
    var mixin = objects.mixin,
        substitute = strings.substitute;

    var Restful = Evented.inherit({
        "klassName" : "Restful",

        "idAttribute": "id",
        
        getBaseUrl : function(args) {
            //$$baseEndpoint : "/files/${fileId}/comments",
            var baseEndpoint = substitute(this.baseEndpoint,args),
                baseUrl = this.server + this.basePath + baseEndpoint;
            if (args[this.idAttribute]!==undefined) {
                baseUrl = baseUrl + "/" + args[this.idAttribute]; 
            }
            return baseUrl;
        },
        _head : function(args) {
            //get resource metadata .
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, required
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}
        },
        _get : function(args) {
            //get resource ,one or list .
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, null if list
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}
            return Xhr.get(this.getBaseUrl(args),args);
        },
        _post  : function(args,verb) {
            //create or move resource .
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, required
            //  "data" : body // the own data,required
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}
            //verb : the verb ,ex: copy,touch,trash,untrash,watch
            var url = this.getBaseUrl(args);
            if (verb) {
                url = url + "/" + verb;
            }
            return Xhr.post(url, args);
        },

        _put  : function(args,verb) {
            //update resource .
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, required
            //  "data" : body // the own data,required
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}
            //verb : the verb ,ex: copy,touch,trash,untrash,watch
            var url = this.getBaseUrl(args);
            if (verb) {
                url = url + "/" + verb;
            }
            return Xhr.put(url, args);
        },

        _delete : function(args) {
            //delete resource . 
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, required
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}         

            // HTTP request : DELETE http://center.utilhub.com/registry/v1/apps/{appid}
            var url = this.getBaseUrl(args);
            return Xhr.del(url);
        },

        _patch : function(args){
            //update resource metadata. 
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, required
            //  "data" : body // the own data,required
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}
            var url = this.getBaseUrl(args);
            return Xhr.patch(url, args);
        },
        query: function(params) {
            
            return this._post(params);
        },

        retrieve: function(params) {
            return this._get(params);
        },

        create: function(params) {
            return this._post(params);
        },

        update: function(params) {
            return this._put(params);
        },

        delete: function(params) {
            // HTTP request : DELETE http://center.utilhub.com/registry/v1/apps/{appid}
            return this._delete(params);
        },

        patch: function(params) {
           // HTTP request : PATCH http://center.utilhub.com/registry/v1/apps/{appid}
            return this._patch(params);
        },
        init: function(params) {
            mixin(this,params);
 //           this._xhr = XHRx();
       }
    });

    return Restful;
});
define('skylark-langx/Stateful',[
	"./Evented",
  "./strings",
  "./objects"
],function(Evented,strings,objects){
    var isEqual = objects.isEqual,
        mixin = objects.mixin,
        result = objects.result,
        isEmptyObject = objects.isEmptyObject,
        clone = objects.clone,
        uniqueId = strings.uniqueId;

    var Stateful = Evented.inherit({
        _construct : function(attributes, options) {
            var attrs = attributes || {};
            options || (options = {});
            this.cid = uniqueId(this.cidPrefix);
            this.attributes = {};
            if (options.collection) this.collection = options.collection;
            if (options.parse) attrs = this.parse(attrs, options) || {};
            var defaults = result(this, 'defaults');
            attrs = mixin({}, defaults, attrs);
            this.set(attrs, options);
            this.changed = {};
        },

        // A hash of attributes whose current and previous value differ.
        changed: null,

        // The value returned during the last failed validation.
        validationError: null,

        // The default name for the JSON `id` attribute is `"id"`. MongoDB and
        // CouchDB users may want to set this to `"_id"`.
        idAttribute: 'id',

        // The prefix is used to create the client id which is used to identify models locally.
        // You may want to override this if you're experiencing name clashes with model ids.
        cidPrefix: 'c',


        // Return a copy of the model's `attributes` object.
        toJSON: function(options) {
          return clone(this.attributes);
        },


        // Get the value of an attribute.
        get: function(attr) {
          return this.attributes[attr];
        },

        // Returns `true` if the attribute contains a value that is not null
        // or undefined.
        has: function(attr) {
          return this.get(attr) != null;
        },

        // Set a hash of model attributes on the object, firing `"change"`. This is
        // the core primitive operation of a model, updating the data and notifying
        // anyone who needs to know about the change in state. The heart of the beast.
        set: function(key, val, options) {
          if (key == null) return this;

          // Handle both `"key", value` and `{key: value}` -style arguments.
          var attrs;
          if (typeof key === 'object') {
            attrs = key;
            options = val;
          } else {
            (attrs = {})[key] = val;
          }

          options || (options = {});

          // Run validation.
          if (!this._validate(attrs, options)) return false;

          // Extract attributes and options.
          var unset      = options.unset;
          var silent     = options.silent;
          var changes    = [];
          var changing   = this._changing;
          this._changing = true;

          if (!changing) {
            this._previousAttributes = clone(this.attributes);
            this.changed = {};
          }

          var current = this.attributes;
          var changed = this.changed;
          var prev    = this._previousAttributes;

          // For each `set` attribute, update or delete the current value.
          for (var attr in attrs) {
            val = attrs[attr];
            if (!isEqual(current[attr], val)) changes.push(attr);
            if (!isEqual(prev[attr], val)) {
              changed[attr] = val;
            } else {
              delete changed[attr];
            }
            unset ? delete current[attr] : current[attr] = val;
          }

          // Update the `id`.
          if (this.idAttribute in attrs) this.id = this.get(this.idAttribute);

          // Trigger all relevant attribute changes.
          if (!silent) {
            if (changes.length) this._pending = options;
            for (var i = 0; i < changes.length; i++) {
              this.trigger('change:' + changes[i], this, current[changes[i]], options);
            }
          }

          // You might be wondering why there's a `while` loop here. Changes can
          // be recursively nested within `"change"` events.
          if (changing) return this;
          if (!silent) {
            while (this._pending) {
              options = this._pending;
              this._pending = false;
              this.trigger('change', this, options);
            }
          }
          this._pending = false;
          this._changing = false;
          return this;
        },

        // Remove an attribute from the model, firing `"change"`. `unset` is a noop
        // if the attribute doesn't exist.
        unset: function(attr, options) {
          return this.set(attr, void 0, mixin({}, options, {unset: true}));
        },

        // Clear all attributes on the model, firing `"change"`.
        clear: function(options) {
          var attrs = {};
          for (var key in this.attributes) attrs[key] = void 0;
          return this.set(attrs, mixin({}, options, {unset: true}));
        },

        // Determine if the model has changed since the last `"change"` event.
        // If you specify an attribute name, determine if that attribute has changed.
        hasChanged: function(attr) {
          if (attr == null) return !isEmptyObject(this.changed);
          return this.changed[attr] !== undefined;
        },

        // Return an object containing all the attributes that have changed, or
        // false if there are no changed attributes. Useful for determining what
        // parts of a view need to be updated and/or what attributes need to be
        // persisted to the server. Unset attributes will be set to undefined.
        // You can also pass an attributes object to diff against the model,
        // determining if there *would be* a change.
        changedAttributes: function(diff) {
          if (!diff) return this.hasChanged() ? clone(this.changed) : false;
          var old = this._changing ? this._previousAttributes : this.attributes;
          var changed = {};
          for (var attr in diff) {
            var val = diff[attr];
            if (isEqual(old[attr], val)) continue;
            changed[attr] = val;
          }
          return !isEmptyObject(changed) ? changed : false;
        },

        // Get the previous value of an attribute, recorded at the time the last
        // `"change"` event was fired.
        previous: function(attr) {
          if (attr == null || !this._previousAttributes) return null;
          return this._previousAttributes[attr];
        },

        // Get all of the attributes of the model at the time of the previous
        // `"change"` event.
        previousAttributes: function() {
          return clone(this._previousAttributes);
        },

        // Create a new model with identical attributes to this one.
        clone: function() {
          return new this.constructor(this.attributes);
        },

        // A model is new if it has never been saved to the server, and lacks an id.
        isNew: function() {
          return !this.has(this.idAttribute);
        },

        // Check if the model is currently in a valid state.
        isValid: function(options) {
          return this._validate({}, mixin({}, options, {validate: true}));
        },

        // Run validation against the next complete set of model attributes,
        // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
        _validate: function(attrs, options) {
          if (!options.validate || !this.validate) return true;
          attrs = mixin({}, this.attributes, attrs);
          var error = this.validationError = this.validate(attrs, options) || null;
          if (!error) return true;
          this.trigger('invalid', this, error, mixin(options, {validationError: error}));
          return false;
        }
    });

	return Stateful;
});
define('skylark-langx-topic/topic',[
	"skylark-langx-ns",
	"skylark-langx-emitter/Evented"
],function(skylark,Evented){
	var hub = new Evented();

	return skylark.attach("langx.topic",{
	    publish: function(name, arg1,argn) {
	        var data = [].slice.call(arguments, 1);

	        return hub.trigger({
	            type : name,
	            data : data
	        });
	    },

        subscribe: function(name, listener,ctx) {
        	var handler = function(e){
                listener.apply(ctx,e.data);
            };
            hub.on(name, handler);
            return {
            	remove : function(){
            		hub.off(name,handler);
            	}
            }

        }

	});
});
define('skylark-langx-topic/main',[
	"./topic"
],function(topic){
	return topic;
});
define('skylark-langx-topic', ['skylark-langx-topic/main'], function (main) { return main; });

define('skylark-langx/topic',[
	"skylark-langx-topic"
],function(topic){
	return topic;
});
define('skylark-langx/types',[
    "skylark-langx-types"
],function(types){
    return types;
});
define('skylark-langx/langx',[
    "./skylark",
    "./arrays",
    "./ArrayStore",
    "./aspect",
    "./async",
    "./datetimes",
    "./Deferred",
    "./Evented",
    "./funcs",
    "./hoster",
    "./klass",
    "./numbers",
    "./objects",
    "./Restful",
    "./Stateful",
    "./strings",
    "./topic",
    "./types",
    "./Xhr"
], function(skylark,arrays,ArrayStore,aspect,async,datetimes,Deferred,Evented,funcs,hoster,klass,numbers,objects,Restful,Stateful,strings,topic,types,Xhr) {
    "use strict";
    var toString = {}.toString,
        concat = Array.prototype.concat,
        indexOf = Array.prototype.indexOf,
        slice = Array.prototype.slice,
        filter = Array.prototype.filter,
        mixin = objects.mixin,
        safeMixin = objects.safeMixin,
        isFunction = types.isFunction;


    function createEvent(type, props) {
        var e = new CustomEvent(type, props);

        return safeMixin(e, props);
    }
    

    function funcArg(context, arg, idx, payload) {
        return isFunction(arg) ? arg.call(context, idx, payload) : arg;
    }

    function getQueryParams(url) {
        var url = url || window.location.href,
            segs = url.split("?"),
            params = {};

        if (segs.length > 1) {
            segs[1].split("&").forEach(function(queryParam) {
                var nv = queryParam.split('=');
                params[nv[0]] = nv[1];
            });
        }
        return params;
    }


    function toPixel(value) {
        // style values can be floats, client code may want
        // to round for integer pixels.
        return parseFloat(value) || 0;
    }


    var _uid = 1;

    function uid(obj) {
        return obj._uid || (obj._uid = _uid++);
    }

    function langx() {
        return langx;
    }

    mixin(langx, {
        createEvent : createEvent,

        funcArg: funcArg,

        getQueryParams: getQueryParams,

        toPixel: toPixel,

        uid: uid,

        URL: typeof window !== "undefined" ? window.URL || window.webkitURL : null

    });


    mixin(langx, arrays,aspect,datetimes,funcs,numbers,objects,strings,types,{
        ArrayStore : ArrayStore,

        async : async,
        
        Deferred: Deferred,

        Evented: Evented,

        hoster : hoster,

        klass : klass,

        Restful: Restful,
        
        Stateful: Stateful,

        topic : topic,

        Xhr: Xhr

    });

    return skylark.langx = langx;
});
define('skylark-utils-dom/skylark',["skylark-langx/skylark"], function(skylark) {
    return skylark;
});

define('skylark-utils-dom/dom',["./skylark"], function(skylark) {
	return skylark.dom = skylark.attach("utils.dom",{});
});

define('skylark-utils-dom/langx',[
    "skylark-langx/langx"
], function(langx) {
    return langx;
});

define('skylark-utils-dom/browser',[
    "./dom",
    "./langx"
], function(dom,langx) {
    "use strict";

    var browser = langx.hoster.browser;
 
    var checkedCssProperties = {
            "transitionproperty": "TransitionProperty",
        },
        transEndEventNames = {
          WebkitTransition : 'webkitTransitionEnd',
          MozTransition    : 'transitionend',
          OTransition      : 'oTransitionEnd otransitionend',
          transition       : 'transitionend'
        },
        transEndEventName = null;


    var css3PropPrefix = "",
        css3StylePrefix = "",
        css3EventPrefix = "",

        cssStyles = {},
        cssProps = {},

        vendorPrefix,
        vendorPrefixRE,
        vendorPrefixesRE = /^(Webkit|webkit|O|Moz|moz|ms)(.*)$/,

        document = window.document,
        testEl = document.createElement("div"),

        matchesSelector = testEl.webkitMatchesSelector ||
                          testEl.mozMatchesSelector ||
                          testEl.oMatchesSelector ||
                          testEl.matchesSelector,

        requestFullScreen = testEl.requestFullscreen || 
                            testEl.webkitRequestFullscreen || 
                            testEl.mozRequestFullScreen || 
                            testEl.msRequestFullscreen,

        exitFullScreen =  document.exitFullscreen ||
                          document.webkitCancelFullScreen ||
                          document.mozCancelFullScreen ||
                          document.msExitFullscreen,

        testStyle = testEl.style;

    for (var name in testStyle) {
        var matched = name.match(vendorPrefixRE || vendorPrefixesRE);
        if (matched) {
            if (!vendorPrefixRE) {
                vendorPrefix = matched[1];
                vendorPrefixRE = new RegExp("^(" + vendorPrefix + ")(.*)$");

                css3StylePrefix = vendorPrefix;
                css3PropPrefix = '-' + vendorPrefix.toLowerCase() + '-';
                css3EventPrefix = vendorPrefix.toLowerCase();
            }

            cssStyles[langx.lowerFirst(matched[2])] = name;
            var cssPropName = langx.dasherize(matched[2]);
            cssProps[cssPropName] = css3PropPrefix + cssPropName;

            if (transEndEventNames[name]) {
              transEndEventName = transEndEventNames[name];
            }
        }
    }

    if (!transEndEventName) {
        if (testStyle["transition"] !== undefined) {
            transEndEventName = transEndEventNames["transition"];
        }
    }

    function normalizeCssEvent(name) {
        return css3EventPrefix ? css3EventPrefix + name : name.toLowerCase();
    }

    function normalizeCssProperty(name) {
        return cssProps[name] || name;
    }

    function normalizeStyleProperty(name) {
        return cssStyles[name] || name;
    }

    langx.mixin(browser, {
        css3PropPrefix: css3PropPrefix,

        isIE : !!/msie/i.exec( window.navigator.userAgent ),

        normalizeStyleProperty: normalizeStyleProperty,

        normalizeCssProperty: normalizeCssProperty,

        normalizeCssEvent: normalizeCssEvent,

        matchesSelector: matchesSelector,

        requestFullScreen : requestFullScreen,

        exitFullscreen : requestFullScreen,

        location: function() {
            return window.location;
        },

        support : {

        }

    });

    if  (transEndEventName) {
        browser.support.transition = {
            end : transEndEventName
        };
    }

    testEl = null;

    return dom.browser = browser;
});

define('skylark-utils-dom/styler',[
    "./dom",
    "./langx"
], function(dom, langx) {
    var every = Array.prototype.every,
        forEach = Array.prototype.forEach,
        camelCase = langx.camelCase,
        dasherize = langx.dasherize;

    function maybeAddPx(name, value) {
        return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }

    var cssNumber = {
            'column-count': 1,
            'columns': 1,
            'font-weight': 1,
            'line-height': 1,
            'opacity': 1,
            'z-index': 1,
            'zoom': 1
        },
        classReCache = {

        };

    function classRE(name) {
        return name in classReCache ?
            classReCache[name] : (classReCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
    }

    // access className property while respecting SVGAnimatedString
    /*
     * Adds the specified class(es) to each element in the set of matched elements.
     * @param {HTMLElement} node
     * @param {String} value
     */
    function className(node, value) {
        var klass = node.className || '',
            svg = klass && klass.baseVal !== undefined

        if (value === undefined) return svg ? klass.baseVal : klass
        svg ? (klass.baseVal = value) : (node.className = value)
    }

    function disabled(elm, value ) {
        if (arguments.length < 2) {
            return !!this.dom.disabled;
        }

        elm.disabled = value;

        return this;
    }

    var elementDisplay = {};

    function defaultDisplay(nodeName) {
        var element, display
        if (!elementDisplay[nodeName]) {
            element = document.createElement(nodeName)
            document.body.appendChild(element)
            display = getStyles(element).getPropertyValue("display")
            element.parentNode.removeChild(element)
            display == "none" && (display = "block")
            elementDisplay[nodeName] = display
        }
        return elementDisplay[nodeName]
    }
    /*
     * Display the matched elements.
     * @param {HTMLElement} elm
     */
    function show(elm) {
        styler.css(elm, "display", "");
        if (styler.css(elm, "display") == "none") {
            styler.css(elm, "display", defaultDisplay(elm.nodeName));
        }
        return this;
    }

    function isInvisible(elm) {
        return styler.css(elm, "display") == "none" || styler.css(elm, "opacity") == 0;
    }

    /*
     * Hide the matched elements.
     * @param {HTMLElement} elm
     */
    function hide(elm) {
        styler.css(elm, "display", "none");
        return this;
    }

    /*
     * Adds the specified class(es) to each element in the set of matched elements.
     * @param {HTMLElement} elm
     * @param {String} name
     */
    function addClass(elm, name) {
        if (!name) return this
        var cls = className(elm),
            names;
        if (langx.isString(name)) {
            names = name.split(/\s+/g);
        } else {
            names = name;
        }
        names.forEach(function(klass) {
            var re = classRE(klass);
            if (!cls.match(re)) {
                cls += (cls ? " " : "") + klass;
            }
        });

        className(elm, cls);

        return this;
    }

    function getStyles( elem ) {

        // Support: IE <=11 only, Firefox <=30 (#15098, #14150)
        // IE throws on elements created in popups
        // FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
        var view = elem.ownerDocument.defaultView;

        if ( !view || !view.opener ) {
            view = window;
        }

        return view.getComputedStyle( elem);
    }


    /*
     * Get the value of a computed style property for the first element in the set of matched elements or set one or more CSS properties for every matched element.
     * @param {HTMLElement} elm
     * @param {String} property
     * @param {Any} value
     */
    function css(elm, property, value) {
        if (arguments.length < 3) {
            var computedStyle,
                computedStyle = getStyles(elm)
            if (langx.isString(property)) {
                return elm.style[camelCase(property)] || computedStyle.getPropertyValue(dasherize(property))
            } else if (langx.isArrayLike(property)) {
                var props = {}
                forEach.call(property, function(prop) {
                    props[prop] = (elm.style[camelCase(prop)] || computedStyle.getPropertyValue(dasherize(prop)))
                })
                return props
            }
        }

        var css = '';
        if (typeof(property) == 'string') {
            if (!value && value !== 0) {
                elm.style.removeProperty(dasherize(property));
            } else {
                css = dasherize(property) + ":" + maybeAddPx(property, value)
            }
        } else {
            for (key in property) {
                if (property[key] === undefined) {
                    continue;
                }
                if (!property[key] && property[key] !== 0) {
                    elm.style.removeProperty(dasherize(key));
                } else {
                    css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
                }
            }
        }

        elm.style.cssText += ';' + css;
        return this;
    }

    /*
     * Determine whether any of the matched elements are assigned the given class.
     * @param {HTMLElement} elm
     * @param {String} name
     */
    function hasClass(elm, name) {
        var re = classRE(name);
        return elm.className && elm.className.match(re);
    }

    /*
     * Remove a single class, multiple classes, or all classes from each element in the set of matched elements.
     * @param {HTMLElement} elm
     * @param {String} name
     */
    function removeClass(elm, name) {
        if (name) {
            var cls = className(elm),
                names;

            if (langx.isString(name)) {
                names = name.split(/\s+/g);
            } else {
                names = name;
            }

            names.forEach(function(klass) {
                var re = classRE(klass);
                if (cls.match(re)) {
                    cls = cls.replace(re, " ");
                }
            });

            className(elm, cls.trim());
        } else {
            className(elm, "");
        }

        return this;
    }

    /*
     * Add or remove one or more classes from the specified element.
     * @param {HTMLElement} elm
     * @param {String} name
     * @param {} when
     */
    function toggleClass(elm, name, when) {
        var self = this;
        name.split(/\s+/g).forEach(function(klass) {
            if (when === undefined) {
                when = !self.hasClass(elm, klass);
            }
            if (when) {
                self.addClass(elm, klass);
            } else {
                self.removeClass(elm, klass)
            }
        });

        return self;
    }

    var styler = function() {
        return styler;
    };

    langx.mixin(styler, {
        autocssfix: false,
        cssHooks: {

        },

        addClass: addClass,
        className: className,
        css: css,
        disabled : disabled,        
        hasClass: hasClass,
        hide: hide,
        isInvisible: isInvisible,
        removeClass: removeClass,
        show: show,
        toggleClass: toggleClass
    });

    return dom.styler = styler;
});
define('skylark-utils-dom/noder',[
    "./dom",
    "./langx",
    "./browser",
    "./styler"
], function(dom, langx, browser, styler) {
    var isIE = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g),
        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
        singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
        div = document.createElement("div"),
        table = document.createElement('table'),
        tableBody = document.createElement('tbody'),
        tableRow = document.createElement('tr'),
        containers = {
            'tr': tableBody,
            'tbody': table,
            'thead': table,
            'tfoot': table,
            'td': tableRow,
            'th': tableRow,
            '*': div
        },
        rootNodeRE = /^(?:body|html)$/i,
        map = Array.prototype.map,
        slice = Array.prototype.slice;

    function ensureNodes(nodes, copyByClone) {
        if (!langx.isArrayLike(nodes)) {
            nodes = [nodes];
        }
        if (copyByClone) {
            nodes = map.call(nodes, function(node) {
                return node.cloneNode(true);
            });
        }
        return langx.flatten(nodes);
    }

    function nodeName(elm, chkName) {
        var name = elm.nodeName && elm.nodeName.toLowerCase();
        if (chkName !== undefined) {
            return name === chkName.toLowerCase();
        }
        return name;
    };


    function activeElement(doc) {
        doc = doc || document;
        var el;

        // Support: IE 9 only
        // IE9 throws an "Unspecified error" accessing document.activeElement from an <iframe>
        try {
            el = doc.activeElement;
        } catch ( error ) {
            el = doc.body;
        }

        // Support: IE 9 - 11 only
        // IE may return null instead of an element
        // Interestingly, this only seems to occur when NOT in an iframe
        if ( !el ) {
            el = doc.body;
        }

        // Support: IE 11 only
        // IE11 returns a seemingly empty object in some cases when accessing
        // document.activeElement from an <iframe>
        if ( !el.nodeName ) {
            el = doc.body;
        }

        return el;
    };

    function enhancePlaceContent(placing,node) {
        if (langx.isFunction(placing)) {
            return placing.apply(node,[]);
        }
        if (langx.isArrayLike(placing)) {
            var neddsFlattern;
            for (var i=0;i<placing.length;i++) {
                if (langx.isFunction(placing[i])) {
                    placing[i] = placing[i].apply(node,[]);
                    if (langx.isArrayLike(placing[i])) {
                        neddsFlattern = true;
                    }
                }
            }
            if (neddsFlattern) {
                placing = langx.flatten(placing);
            }
        }
        return placing;
    }
    function after(node, placing, copyByClone) {
        placing = enhancePlaceContent(placing,node);
        var refNode = node,
            parent = refNode.parentNode;
        if (parent) {
            var nodes = ensureNodes(placing, copyByClone),
                refNode = refNode.nextSibling;

            for (var i = 0; i < nodes.length; i++) {
                if (refNode) {
                    parent.insertBefore(nodes[i], refNode);
                } else {
                    parent.appendChild(nodes[i]);
                }
            }
        }
        return this;
    }

    function append(node, placing, copyByClone) {
        placing = enhancePlaceContent(placing,node);
        var parentNode = node,
            nodes = ensureNodes(placing, copyByClone);
        for (var i = 0; i < nodes.length; i++) {
            parentNode.appendChild(nodes[i]);
        }
        return this;
    }

    function before(node, placing, copyByClone) {
        placing = enhancePlaceContent(placing,node);
        var refNode = node,
            parent = refNode.parentNode;
        if (parent) {
            var nodes = ensureNodes(placing, copyByClone);
            for (var i = 0; i < nodes.length; i++) {
                parent.insertBefore(nodes[i], refNode);
            }
        }
        return this;
    }
    /*   
     * Get the children of the specified node, including text and comment nodes.
     * @param {HTMLElement} elm
     */
    function contents(elm) {
        if (nodeName(elm, "iframe")) {
            return elm.contentDocument;
        }
        return elm.childNodes;
    }

    /*   
     * Create a element and set attributes on it.
     * @param {HTMLElement} tag
     * @param {props} props
     * @param } parent
     */
    function createElement(tag, props, parent) {
        var node = document.createElement(tag);
        if (props) {
            for (var name in props) {
                node.setAttribute(name, props[name]);
            }
        }
        if (parent) {
            append(parent, node);
        }
        return node;
    }

    /*   
     * Create a DocumentFragment from the HTML fragment.
     * @param {String} html
     */
    function createFragment(html) {
        // A special case optimization for a single tag
        html = langx.trim(html);
        if (singleTagRE.test(html)) {
            return [createElement(RegExp.$1)];
        }

        var name = fragmentRE.test(html) && RegExp.$1
        if (!(name in containers)) {
            name = "*"
        }
        var container = containers[name];
        container.innerHTML = "" + html;
        dom = slice.call(container.childNodes);

        dom.forEach(function(node) {
            container.removeChild(node);
        })

        return dom;
    }

    /*   
     * Create a deep copy of the set of matched elements.
     * @param {HTMLElement} node
     * @param {Boolean} deep
     */
    function clone(node, deep) {
        var self = this,
            clone;

        // TODO: Add feature detection here in the future
        if (!isIE || node.nodeType !== 1 || deep) {
            return node.cloneNode(deep);
        }

        // Make a HTML5 safe shallow copy
        if (!deep) {
            clone = document.createElement(node.nodeName);

            // Copy attribs
            each(self.getAttribs(node), function(attr) {
                self.setAttrib(clone, attr.nodeName, self.getAttrib(node, attr.nodeName));
            });

            return clone;
        }
    }

    /*   
     * Check to see if a dom node is a descendant of another dom node .
     * @param {String} node
     * @param {Node} child
     */
    function contains(node, child) {
        return isChildOf(child, node);
    }

    /*   
     * Create a new Text node.
     * @param {String} text
     * @param {Node} child
     */
    function createTextNode(text) {
        return document.createTextNode(text);
    }

    /*   
     * Get the current document object.
     */
    function doc() {
        return document;
    }

    /*   
     * Remove all child nodes of the set of matched elements from the DOM.
     * @param {Object} node
     */
    function empty(node) {
        while (node.hasChildNodes()) {
            var child = node.firstChild;
            node.removeChild(child);
        }
        return this;
    }

    var fulledEl = null;

    function fullScreen(el) {
        if (el === false) {
            browser.exitFullScreen.apply(document);
        } else if (el) {
            browser.requestFullScreen.apply(el);
            fulledEl = el;
        } else {
            return (
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            )
        }
    }


    // Selectors
    function focusable( element, hasTabindex ) {
        var map, mapName, img, focusableIfVisible, fieldset,
            nodeName = element.nodeName.toLowerCase();

        if ( "area" === nodeName ) {
            map = element.parentNode;
            mapName = map.name;
            if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
                return false;
            }
            img = $( "img[usemap='#" + mapName + "']" );
            return img.length > 0 && img.is( ":visible" );
        }

        if ( /^(input|select|textarea|button|object)$/.test( nodeName ) ) {
            focusableIfVisible = !element.disabled;

            if ( focusableIfVisible ) {

                // Form controls within a disabled fieldset are disabled.
                // However, controls within the fieldset's legend do not get disabled.
                // Since controls generally aren't placed inside legends, we skip
                // this portion of the check.
                fieldset = $( element ).closest( "fieldset" )[ 0 ];
                if ( fieldset ) {
                    focusableIfVisible = !fieldset.disabled;
                }
            }
        } else if ( "a" === nodeName ) {
            focusableIfVisible = element.href || hasTabindex;
        } else {
            focusableIfVisible = hasTabindex;
        }

        return focusableIfVisible && $( element ).is( ":visible" ) && visible( $( element ) );
    };


   var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi;
 
    /*   
     * Get the HTML contents of the first element in the set of matched elements.
     * @param {HTMLElement} node
     * @param {String} html
     */
    function html(node, html) {
        if (html === undefined) {
            return node.innerHTML;
        } else {
            this.empty(node);
            html = html || "";
            if (langx.isString(html)) {
                html = html.replace( rxhtmlTag, "<$1></$2>" );
            }
            if (langx.isString(html) || langx.isNumber(html)) {               
                node.innerHTML = html;
            } else if (langx.isArrayLike(html)) {
                for (var i = 0; i < html.length; i++) {
                    node.appendChild(html[i]);
                }
            } else {
                node.appendChild(html);
            }


        }
    }


    /*   
     * Check to see if a dom node is a descendant of another dom node.
     * @param {Node} node
     * @param {Node} parent
     * @param {Node} directly
     */
    function isChildOf(node, parent, directly) {
        if (directly) {
            return node.parentNode === parent;
        }
        if (document.documentElement.contains) {
            return parent.contains(node);
        }
        while (node) {
            if (parent === node) {
                return true;
            }

            node = node.parentNode;
        }

        return false;
    }

    /*   
     * Check to see if a dom node is a document.
     * @param {Node} node
     */
    function isDocument(node) {
        return node != null && node.nodeType == node.DOCUMENT_NODE
    }

    /*   
     * Check to see if a dom node is in the document
     * @param {Node} node
     */
    function isInDocument(node) {
      return (node === document.body) ? true : document.body.contains(node);
    }        

    /*   
     * Get the owner document object for the specified element.
     * @param {Node} elm
     */
    function ownerDoc(elm) {
        if (!elm) {
            return document;
        }

        if (elm.nodeType == 9) {
            return elm;
        }

        return elm.ownerDocument;
    }

    /*   
     *
     * @param {Node} elm
     */
    function ownerWindow(elm) {
        var doc = ownerDoc(elm);
        return doc.defaultView || doc.parentWindow;
    }

    /*   
     * insert one or more nodes as the first children of the specified node.
     * @param {Node} node
     * @param {Node or ArrayLike} placing
     * @param {Boolean Optional} copyByClone
     */
    function prepend(node, placing, copyByClone) {
        var parentNode = node,
            refNode = parentNode.firstChild,
            nodes = ensureNodes(placing, copyByClone);
        for (var i = 0; i < nodes.length; i++) {
            if (refNode) {
                parentNode.insertBefore(nodes[i], refNode);
            } else {
                parentNode.appendChild(nodes[i]);
            }
        }
        return this;
    }

    /*   
     *
     * @param {Node} elm
     */
    function offsetParent(elm) {
        var parent = elm.offsetParent || document.body;
        while (parent && !rootNodeRE.test(parent.nodeName) && styler.css(parent, "position") == "static") {
            parent = parent.offsetParent;
        }
        return parent;
    }

    /*   
     *
     * @param {Node} elm
     * @param {Node} params
     */
    function overlay(elm, params) {
        var overlayDiv = createElement("div", params);
        styler.css(overlayDiv, {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0x7FFFFFFF,
            opacity: 0.7
        });
        elm.appendChild(overlayDiv);
        return overlayDiv;

    }

    /*   
     * Remove the set of matched elements from the DOM.
     * @param {Node} node
     */
    function remove(node) {
        if (node && node.parentNode) {
            try {
                node.parentNode.removeChild(node);
            } catch (e) {
                console.warn("The node is already removed", e);
            }
        }
        return this;
    }

    function removeChild(node,children) {
        if (!langx.isArrayLike(children)) {
            children = [children];
        }
        for (var i=0;i<children.length;i++) {
            node.removeChild(children[i]);
        }

        return this;
    }

    function scrollParent( elm, includeHidden ) {
        var position = styler.css(elm,"position" ),
            excludeStaticParent = position === "absolute",
            overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
            scrollParent = this.parents().filter( function() {
                var parent = $( this );
                if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
                    return false;
                }
                return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) +
                    parent.css( "overflow-x" ) );
            } ).eq( 0 );

        return position === "fixed" || !scrollParent.length ?
            $( this[ 0 ].ownerDocument || document ) :
            scrollParent;
    };

        /*   
     * Replace an old node with the specified node.
     * @param {Node} node
     * @param {Node} oldNode
     */
    function replace(node, oldNode) {
        oldNode.parentNode.replaceChild(node, oldNode);
        return this;
    }

    /*   
     * Replace an old node with the specified node.
     * @param {HTMLElement} elm
     * @param {Node} params
     */
    function throb(elm, params) {
        params = params || {};
        var self = this,
            text = params.text,
            style = params.style,
            time = params.time,
            callback = params.callback,
            timer,

            throbber = this.createElement("div", {
                "class": params.className || "throbber"
            }),
            _overlay = overlay(throbber, {
                "class": 'overlay fade'
            }),
            throb = this.createElement("div", {
                "class": "throb"
            }),
            textNode = this.createTextNode(text || ""),
            remove = function() {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                if (throbber) {
                    self.remove(throbber);
                    throbber = null;
                }
            },
            update = function(params) {
                if (params && params.text && throbber) {
                    textNode.nodeValue = params.text;
                }
            };
        if (params.style) {
            styler.css(throbber,params.style);
        }
        throb.appendChild(textNode);
        throbber.appendChild(throb);
        elm.appendChild(throbber);
        var end = function() {
            remove();
            if (callback) callback();
        };
        if (time) {
            timer = setTimeout(end, time);
        }

        return {
            remove: remove,
            update: update
        };
    }


    /*   
     * traverse the specified node and its descendants, perform the callback function on each
     * @param {Node} node
     * @param {Function} fn
     */
    function traverse(node, fn) {
        fn(node)
        for (var i = 0, len = node.childNodes.length; i < len; i++) {
            traverse(node.childNodes[i], fn);
        }
        return this;
    }

    /*   
     *
     * @param {Node} node
     */
    function reverse(node) {
        var firstChild = node.firstChild;
        for (var i = node.children.length - 1; i > 0; i--) {
            if (i > 0) {
                var child = node.children[i];
                node.insertBefore(child, firstChild);
            }
        }
    }

    /*   
     * Wrap an HTML structure around each element in the set of matched elements.
     * @param {Node} node
     * @param {Node} wrapperNode
     */
    function wrapper(node, wrapperNode) {
        if (langx.isString(wrapperNode)) {
            wrapperNode = this.createFragment(wrapperNode).firstChild;
        }
        node.parentNode.insertBefore(wrapperNode, node);
        wrapperNode.appendChild(node);
    }

    /*   
     * Wrap an HTML structure around the content of each element in the set of matched
     * @param {Node} node
     * @param {Node} wrapperNode
     */
    function wrapperInner(node, wrapperNode) {
        var childNodes = slice.call(node.childNodes);
        node.appendChild(wrapperNode);
        for (var i = 0; i < childNodes.length; i++) {
            wrapperNode.appendChild(childNodes[i]);
        }
        return this;
    }

    /*   
     * Remove the parents of the set of matched elements from the DOM, leaving the matched
     * @param {Node} node
     */
    function unwrap(node) {
        var child, parent = node.parentNode;
        if (parent) {
            if (this.isDoc(parent.parentNode)) return;
            parent.parentNode.insertBefore(node, parent);
        }
    }

    function noder() {
        return noder;
    }

    langx.mixin(noder, {
        active  : activeElement,

        blur : function(el) {
            el.blur();
        },

        body: function() {
            return document.body;
        },

        clone: clone,
        contents: contents,

        createElement: createElement,

        createFragment: createFragment,

        contains: contains,

        createTextNode: createTextNode,

        doc: doc,

        empty: empty,

        fullScreen: fullScreen,

        focusable: focusable,

        html: html,

        isChildOf: isChildOf,

        isDocument: isDocument,

        isInDocument: isInDocument,

        isWindow: langx.isWindow,

        nodeName : nodeName,

        offsetParent: offsetParent,

        ownerDoc: ownerDoc,

        ownerWindow: ownerWindow,

        after: after,

        before: before,

        prepend: prepend,

        append: append,

        remove: remove,

        removeChild : removeChild,

        replace: replace,

        throb: throb,

        traverse: traverse,

        reverse: reverse,

        wrapper: wrapper,

        wrapperInner: wrapperInner,

        unwrap: unwrap
    });

    return dom.noder = noder;
});
define('skylark-utils-dom/finder',[
    "./dom",
    "./langx",
    "./browser",
    "./noder"
], function(dom, langx, browser, noder, velm) {
    var local = {},
        filter = Array.prototype.filter,
        slice = Array.prototype.slice,
        nativeMatchesSelector = browser.matchesSelector;

    /*
    ---
    name: Slick.Parser
    description: Standalone CSS3 Selector parser
    provides: Slick.Parser
    ...
    */
    ;
    (function() {

        var parsed,
            separatorIndex,
            combinatorIndex,
            reversed,
            cache = {},
            reverseCache = {},
            reUnescape = /\\/g;

        var parse = function(expression, isReversed) {
            if (expression == null) return null;
            if (expression.Slick === true) return expression;
            expression = ('' + expression).replace(/^\s+|\s+$/g, '');
            reversed = !!isReversed;
            var currentCache = (reversed) ? reverseCache : cache;
            if (currentCache[expression]) return currentCache[expression];
            parsed = {
                Slick: true,
                expressions: [],
                raw: expression,
                reverse: function() {
                    return parse(this.raw, true);
                }
            };
            separatorIndex = -1;
            while (expression != (expression = expression.replace(regexp, parser)));
            parsed.length = parsed.expressions.length;
            return currentCache[parsed.raw] = (reversed) ? reverse(parsed) : parsed;
        };

        var reverseCombinator = function(combinator) {
            if (combinator === '!') return ' ';
            else if (combinator === ' ') return '!';
            else if ((/^!/).test(combinator)) return combinator.replace(/^!/, '');
            else return '!' + combinator;
        };

        var reverse = function(expression) {
            var expressions = expression.expressions;
            for (var i = 0; i < expressions.length; i++) {
                var exp = expressions[i];
                var last = {
                    parts: [],
                    tag: '*',
                    combinator: reverseCombinator(exp[0].combinator)
                };

                for (var j = 0; j < exp.length; j++) {
                    var cexp = exp[j];
                    if (!cexp.reverseCombinator) cexp.reverseCombinator = ' ';
                    cexp.combinator = cexp.reverseCombinator;
                    delete cexp.reverseCombinator;
                }

                exp.reverse().push(last);
            }
            return expression;
        };

        var escapeRegExp = (function() {
            // Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
            var from = /(?=[\-\[\]{}()*+?.\\\^$|,#\s])/g,
                to = '\\';
            return function(string) {
                return string.replace(from, to)
            }
        }())

        var regexp = new RegExp(
            "^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:([\"']?)(.*?)\\9)))?\\s*\\](?!\\])|(:+)(<unicode>+)(?:\\((?:(?:([\"'])([^\\13]*)\\13)|((?:\\([^)]+\\)|[^()]*)+))\\))?)"
            .replace(/<combinator>/, '[' + escapeRegExp(">+~`!@$%^&={}\\;</") + ']')
            .replace(/<unicode>/g, '(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
            .replace(/<unicode1>/g, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
        );

        function parser(
            rawMatch,

            separator,
            combinator,
            combinatorChildren,

            tagName,
            id,
            className,

            attributeKey,
            attributeOperator,
            attributeQuote,
            attributeValue,

            pseudoMarker,
            pseudoClass,
            pseudoQuote,
            pseudoClassQuotedValue,
            pseudoClassValue
        ) {
            if (separator || separatorIndex === -1) {
                parsed.expressions[++separatorIndex] = [];
                combinatorIndex = -1;
                if (separator) return '';
            }

            if (combinator || combinatorChildren || combinatorIndex === -1) {
                combinator = combinator || ' ';
                var currentSeparator = parsed.expressions[separatorIndex];
                if (reversed && currentSeparator[combinatorIndex])
                    currentSeparator[combinatorIndex].reverseCombinator = reverseCombinator(combinator);
                currentSeparator[++combinatorIndex] = {
                    combinator: combinator,
                    tag: '*'
                };
            }

            var currentParsed = parsed.expressions[separatorIndex][combinatorIndex];

            if (tagName) {
                currentParsed.tag = tagName.replace(reUnescape, '');

            } else if (id) {
                currentParsed.id = id.replace(reUnescape, '');

            } else if (className) {
                className = className.replace(reUnescape, '');

                if (!currentParsed.classList) currentParsed.classList = [];
                if (!currentParsed.classes) currentParsed.classes = [];
                currentParsed.classList.push(className);
                currentParsed.classes.push({
                    value: className,
                    regexp: new RegExp('(^|\\s)' + escapeRegExp(className) + '(\\s|$)')
                });

            } else if (pseudoClass) {
                pseudoClassValue = pseudoClassValue || pseudoClassQuotedValue;
                pseudoClassValue = pseudoClassValue ? pseudoClassValue.replace(reUnescape, '') : null;

                if (!currentParsed.pseudos) currentParsed.pseudos = [];
                currentParsed.pseudos.push({
                    key: pseudoClass.replace(reUnescape, ''),
                    value: pseudoClassValue,
                    type: pseudoMarker.length == 1 ? 'class' : 'element'
                });

            } else if (attributeKey) {
                attributeKey = attributeKey.replace(reUnescape, '');
                attributeValue = (attributeValue || '').replace(reUnescape, '');

                var test, regexp;

                switch (attributeOperator) {
                    case '^=':
                        regexp = new RegExp('^' + escapeRegExp(attributeValue));
                        break;
                    case '$=':
                        regexp = new RegExp(escapeRegExp(attributeValue) + '$');
                        break;
                    case '~=':
                        regexp = new RegExp('(^|\\s)' + escapeRegExp(attributeValue) + '(\\s|$)');
                        break;
                    case '|=':
                        regexp = new RegExp('^' + escapeRegExp(attributeValue) + '(-|$)');
                        break;
                    case '=':
                        test = function(value) {
                            return attributeValue == value;
                        };
                        break;
                    case '*=':
                        test = function(value) {
                            return value && value.indexOf(attributeValue) > -1;
                        };
                        break;
                    case '!=':
                        test = function(value) {
                            return attributeValue != value;
                        };
                        break;
                    default:
                        test = function(value) {
                            return !!value;
                        };
                }

                if (attributeValue == '' && (/^[*$^]=$/).test(attributeOperator)) test = function() {
                    return false;
                };

                if (!test) test = function(value) {
                    return value && regexp.test(value);
                };

                if (!currentParsed.attributes) currentParsed.attributes = [];
                currentParsed.attributes.push({
                    key: attributeKey,
                    operator: attributeOperator,
                    value: attributeValue,
                    test: test
                });

            }

            return '';
        };

        // Slick NS

        var Slick = (this.Slick || {});

        Slick.parse = function(expression) {
            return parse(expression);
        };

        Slick.escapeRegExp = escapeRegExp;

        if (!this.Slick) this.Slick = Slick;

    }).apply(local);


    var simpleClassSelectorRE = /^\.([\w-]*)$/,
        simpleIdSelectorRE = /^#([\w-]*)$/,
        rinputs = /^(?:input|select|textarea|button)$/i,
        rheader = /^h\d$/i,
        slice = Array.prototype.slice;


    local.parseSelector = local.Slick.parse;


    var pseudos = local.pseudos = {
        // custom pseudos
        "button": function(elem) {
            var name = elem.nodeName.toLowerCase();
            return name === "input" && elem.type === "button" || name === "button";
        },

        'checked': function(elm) {
            return !!elm.checked;
        },

        'contains': function(elm, idx, nodes, text) {
            if ($(this).text().indexOf(text) > -1) return this
        },

        'disabled': function(elm) {
            return !!elm.disabled;
        },

        'enabled': function(elm) {
            return !elm.disabled;
        },

        'eq': function(elm, idx, nodes, value) {
            return (idx == value);
        },

        'even': function(elm, idx, nodes, value) {
            return (idx % 2) === 0;
        },

        'focus': function(elm) {
            return document.activeElement === elm && (elm.href || elm.type || elm.tabindex);
        },

        'focusable': function( elm ) {
            return noder.focusable(elm, elm.tabindex != null );
        },

        'first': function(elm, idx) {
            return (idx === 0);
        },

        'gt': function(elm, idx, nodes, value) {
            return (idx > value);
        },

        'has': function(elm, idx, nodes, sel) {
            return find(elm, sel);
        },

        // Element/input types
        "header": function(elem) {
            return rheader.test(elem.nodeName);
        },

        'hidden': function(elm) {
            return !local.pseudos["visible"](elm);
        },

        "input": function(elem) {
            return rinputs.test(elem.nodeName);
        },

        'last': function(elm, idx, nodes) {
            return (idx === nodes.length - 1);
        },

        'lt': function(elm, idx, nodes, value) {
            return (idx < value);
        },

        'not': function(elm, idx, nodes, sel) {
            return !matches(elm, sel);
        },

        'odd': function(elm, idx, nodes, value) {
            return (idx % 2) === 1;
        },

        /*   
         * Get the parent of each element in the current set of matched elements.
         * @param {Object} elm
         */
        'parent': function(elm) {
            return !!elm.parentNode;
        },

        'selected': function(elm) {
            return !!elm.selected;
        },

        'tabbable': function(elm) {
            var tabIndex = elm.tabindex,
                hasTabindex = tabIndex != null;
            return ( !hasTabindex || tabIndex >= 0 ) && noder.focusable( element, hasTabindex );
        },

        'text': function(elm) {
            return elm.type === "text";
        },

        'visible': function(elm) {
            return elm.offsetWidth && elm.offsetWidth
        }
    };

    ["first", "eq", "last"].forEach(function(item) {
        pseudos[item].isArrayFilter = true;
    });



    pseudos["nth"] = pseudos["eq"];

    function createInputPseudo(type) {
        return function(elem) {
            var name = elem.nodeName.toLowerCase();
            return name === "input" && elem.type === type;
        };
    }

    function createButtonPseudo(type) {
        return function(elem) {
            var name = elem.nodeName.toLowerCase();
            return (name === "input" || name === "button") && elem.type === type;
        };
    }

    // Add button/input type pseudos
    for (i in {
        radio: true,
        checkbox: true,
        file: true,
        password: true,
        image: true
    }) {
        pseudos[i] = createInputPseudo(i);
    }
    for (i in {
        submit: true,
        reset: true
    }) {
        pseudos[i] = createButtonPseudo(i);
    }


    local.divide = function(cond) {
        var nativeSelector = "",
            customPseudos = [],
            tag,
            id,
            classes,
            attributes,
            pseudos;


        if (id = cond.id) {
            nativeSelector += ("#" + id);
        }
        if (classes = cond.classes) {
            for (var i = classes.length; i--;) {
                nativeSelector += ("." + classes[i].value);
            }
        }
        if (attributes = cond.attributes) {
            for (var i = 0; i < attributes.length; i++) {
                if (attributes[i].operator) {
                    nativeSelector += ("[" + attributes[i].key + attributes[i].operator + JSON.stringify(attributes[i].value) + "]");
                } else {
                    nativeSelector += ("[" + attributes[i].key + "]");
                }
            }
        }
        if (pseudos = cond.pseudos) {
            for (i = pseudos.length; i--;) {
                part = pseudos[i];
                if (this.pseudos[part.key]) {
                    customPseudos.push(part);
                } else {
                    if (part.value !== undefined) {
                        nativeSelector += (":" + part.key + "(" + JSON.stringify(part))
                    }
                }
            }
        }

        if (tag = cond.tag) {
            if (tag !== "*") {
                nativeSelector = tag.toUpperCase() + nativeSelector;
            }
        }

        if (!nativeSelector) {
            nativeSelector = "*";
        }

        return {
            nativeSelector: nativeSelector,
            customPseudos: customPseudos
        }

    };

    local.check = function(node, cond, idx, nodes, arrayFilte) {
        var tag,
            id,
            classes,
            attributes,
            pseudos,

            i, part, cls, pseudo;

        if (!arrayFilte) {
            if (tag = cond.tag) {
                var nodeName = node.nodeName.toUpperCase();
                if (tag == '*') {
                    if (nodeName < '@') return false; // Fix for comment nodes and closed nodes
                } else {
                    if (nodeName != (tag || "").toUpperCase()) return false;
                }
            }

            if (id = cond.id) {
                if (node.getAttribute('id') != id) {
                    return false;
                }
            }


            if (classes = cond.classes) {
                for (i = classes.length; i--;) {
                    cls = node.getAttribute('class');
                    if (!(cls && classes[i].regexp.test(cls))) return false;
                }
            }

            if (attributes = cond.attributes) {
                for (i = attributes.length; i--;) {
                    part = attributes[i];
                    if (part.operator ? !part.test(node.getAttribute(part.key)) : !node.hasAttribute(part.key)) return false;
                }
            }

        }
        if (pseudos = cond.pseudos) {
            for (i = pseudos.length; i--;) {
                part = pseudos[i];
                if (pseudo = this.pseudos[part.key]) {
                    if ((arrayFilte && pseudo.isArrayFilter) || (!arrayFilte && !pseudo.isArrayFilter)) {
                        if (!pseudo(node, idx, nodes, part.value)) {
                            return false;
                        }
                    }
                } else {
                    if (!arrayFilte && !nativeMatchesSelector.call(node, part.key)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    local.match = function(node, selector) {

        var parsed;

        if (langx.isString(selector)) {
            parsed = local.Slick.parse(selector);
        } else {
            parsed = selector;
        }

        if (!parsed) {
            return true;
        }

        // simple (single) selectors
        var expressions = parsed.expressions,
            simpleExpCounter = 0,
            i,
            currentExpression;
        for (i = 0;
            (currentExpression = expressions[i]); i++) {
            if (currentExpression.length == 1) {
                var exp = currentExpression[0];
                if (this.check(node, exp)) {
                    return true;
                }
                simpleExpCounter++;
            }
        }

        if (simpleExpCounter == parsed.length) {
            return false;
        }

        var nodes = this.query(document, parsed),
            item;
        for (i = 0; item = nodes[i++];) {
            if (item === node) {
                return true;
            }
        }
        return false;
    };


    local.filterSingle = function(nodes, exp) {
        var matchs = filter.call(nodes, function(node, idx) {
            return local.check(node, exp, idx, nodes, false);
        });

        matchs = filter.call(matchs, function(node, idx) {
            return local.check(node, exp, idx, matchs, true);
        });
        return matchs;
    };

    local.filter = function(nodes, selector) {
        var parsed;

        if (langx.isString(selector)) {
            parsed = local.Slick.parse(selector);
        } else {
            return local.filterSingle(nodes, selector);
        }

        // simple (single) selectors
        var expressions = parsed.expressions,
            i,
            currentExpression,
            ret = [];
        for (i = 0;
            (currentExpression = expressions[i]); i++) {
            if (currentExpression.length == 1) {
                var exp = currentExpression[0];

                var matchs = local.filterSingle(nodes, exp);

                ret = langx.uniq(ret.concat(matchs));
            } else {
                throw new Error("not supported selector:" + selector);
            }
        }

        return ret;

    };

    local.combine = function(elm, bit) {
        var op = bit.combinator,
            cond = bit,
            node1,
            nodes = [];

        switch (op) {
            case '>': // direct children
                nodes = children(elm, cond);
                break;
            case '+': // next sibling
                node1 = nextSibling(elm, cond, true);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '^': // first child
                node1 = firstChild(elm, cond, true);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '~': // next siblings
                nodes = nextSiblings(elm, cond);
                break;
            case '++': // next sibling and previous sibling
                var prev = previousSibling(elm, cond, true),
                    next = nextSibling(elm, cond, true);
                if (prev) {
                    nodes.push(prev);
                }
                if (next) {
                    nodes.push(next);
                }
                break;
            case '~~': // next siblings and previous siblings
                nodes = siblings(elm, cond);
                break;
            case '!': // all parent nodes up to document
                nodes = ancestors(elm, cond);
                break;
            case '!>': // direct parent (one level)
                node1 = parent(elm, cond);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '!+': // previous sibling
                nodes = previousSibling(elm, cond, true);
                break;
            case '!^': // last child
                node1 = lastChild(elm, cond, true);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '!~': // previous siblings
                nodes = previousSiblings(elm, cond);
                break;
            default:
                var divided = this.divide(bit);
                nodes = slice.call(elm.querySelectorAll(divided.nativeSelector));
                if (divided.customPseudos) {
                    for (var i = divided.customPseudos.length - 1; i >= 0; i--) {
                        nodes = filter.call(nodes, function(item, idx) {
                            return local.check(item, {
                                pseudos: [divided.customPseudos[i]]
                            }, idx, nodes, false)
                        });

                        nodes = filter.call(nodes, function(item, idx) {
                            return local.check(item, {
                                pseudos: [divided.customPseudos[i]]
                            }, idx, nodes, true)
                        });
                    }
                }
                break;

        }
        return nodes;
    }

    local.query = function(node, selector, single) {


        var parsed = this.Slick.parse(selector);

        var
            founds = [],
            currentExpression, currentBit,
            expressions = parsed.expressions;

        for (var i = 0;
            (currentExpression = expressions[i]); i++) {
            var currentItems = [node],
                found;
            for (var j = 0;
                (currentBit = currentExpression[j]); j++) {
                found = langx.map(currentItems, function(item, i) {
                    return local.combine(item, currentBit)
                });
                if (found) {
                    currentItems = found;
                }
            }
            if (found) {
                founds = founds.concat(found);
            }
        }

        return founds;
    }

    /*
     * Get the nearest ancestor of the specified element,optional matched by a selector.
     * @param {HTMLElement} node
     * @param {String Optional } selector
     * @param {Object} root
     */
    function ancestor(node, selector, root) {
        var rootIsSelector = root && langx.isString(root);
        while (node = node.parentNode) {
            if (matches(node, selector)) {
                return node;
            }
            if (root) {
                if (rootIsSelector) {
                    if (matches(node, root)) {
                        break;
                    }
                } else if (node == root) {
                    break;
                }
            }
        }
        return null;
    }

    /*
     * Get the ancestors of the specitied element , optionally filtered by a selector.
     * @param {HTMLElement} node
     * @param {String Optional } selector
     * @param {Object} root
     */
    function ancestors(node, selector, root) {
        var ret = [],
            rootIsSelector = root && langx.isString(root);
        while ((node = node.parentNode) && (node.nodeType !== 9)) {
            if (root) {
                if (rootIsSelector) {
                    if (matches(node, root)) {
                        break;
                    }
                } else if (langx.isArrayLike(root)) {
                    if (langx.inArray(node,root)>-1) {
                        break;
                    }
                } else if (node == root) {
                    break;
                }
            }
            ret.push(node); // TODO
        }

        if (selector) {
            ret = local.filter(ret, selector);
        }
        return ret;
    }

    /*
     * Returns a element by its ID.
     * @param {string} id
     */
    function byId(id, doc) {
        doc = doc || noder.doc();
        return doc.getElementById(id);
    }

    /*
     * Get the children of the specified element , optionally filtered by a selector.
     * @param {string} node
     * @param {String optionlly} selector
     */
    function children(node, selector) {
        var childNodes = node.childNodes,
            ret = [];
        for (var i = 0; i < childNodes.length; i++) {
            var node = childNodes[i];
            if (node.nodeType == 1) {
                ret.push(node);
            }
        }
        if (selector) {
            ret = local.filter(ret, selector);
        }
        return ret;
    }

    function closest(node, selector) {
        while (node && !(matches(node, selector))) {
            node = node.parentNode;
        }

        return node;
    }

    /*
     * Get the decendant of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function descendants(elm, selector) {
        // Selector
        try {
            return slice.call(elm.querySelectorAll(selector));
        } catch (matchError) {
            //console.log(matchError);
        }
        return local.query(elm, selector);
    }

    /*
     * Get the nearest decendent of the specified element,optional matched by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function descendant(elm, selector) {
        // Selector
        try {
            return elm.querySelector(selector);
        } catch (matchError) {
            //console.log(matchError);
        }
        var nodes = local.query(elm, selector);
        if (nodes.length > 0) {
            return nodes[0];
        } else {
            return null;
        }
    }

    /*
     * Get the descendants of each element in the current set of matched elements, filtered by a selector, jQuery object, or element.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function find(elm, selector) {
        if (!selector) {
            selector = elm;
            elm = document.body;
        }
        if (matches(elm, selector)) {
            return elm;
        } else {
            return descendant(elm, selector);
        }
    }

    /*
     * Get the findAll of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function findAll(elm, selector) {
        if (!selector) {
            selector = elm;
            elm = document.body;
        }
        return descendants(elm, selector);
    }

    /*
     * Get the first child of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {String} first
     */
    function firstChild(elm, selector, first) {
        var childNodes = elm.childNodes,
            node = childNodes[0];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (first) {
                    break;
                }
            }
            node = node.nextSibling;
        }

        return null;
    }

    /*
     * Get the last child of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {String } last
     */
    function lastChild(elm, selector, last) {
        var childNodes = elm.childNodes,
            node = childNodes[childNodes.length - 1];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (last) {
                    break;
                }
            }
            node = node.previousSibling;
        }

        return null;
    }

    /*
     * Check the specified element against a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function matches(elm, selector) {
        if (!selector || !elm || elm.nodeType !== 1) {
            return false
        }

        if (langx.isString(selector)) {
            try {
                return nativeMatchesSelector.call(elm, selector.replace(/\[([^=]+)=\s*([^'"\]]+?)\s*\]/g, '[$1="$2"]'));
            } catch (matchError) {
                //console.log(matchError);
            }
            return local.match(elm, selector);
        } else if (langx.isArrayLike(selector)) {
            return langx.inArray(elm, selector) > -1;
        } else if (langx.isPlainObject(selector)) {
            return local.check(elm, selector);
        } else {
            return elm === selector;
        }

    }

    /*
     * Get the nearest next sibing of the specitied element , optional matched by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {Boolean Optional} adjacent
     */
    function nextSibling(elm, selector, adjacent) {
        var node = elm.nextSibling;
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (adjacent) {
                    break;
                }
            }
            node = node.nextSibling;
        }
        return null;
    }

    /*
     * Get the next siblings of the specified element , optional filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function nextSiblings(elm, selector) {
        var node = elm.nextSibling,
            ret = [];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    ret.push(node);
                }
            }
            node = node.nextSibling;
        }
        return ret;
    }

    /*
     * Get the parent element of the specified element. if a selector is provided, it retrieves the parent element only if it matches that selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function parent(elm, selector) {
        var node = elm.parentNode;
        if (node && (!selector || matches(node, selector))) {
            return node;
        }

        return null;
    }

    /*
     * Get hte nearest previous sibling of the specified element ,optional matched by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {Boolean Optional } adjacent
     */
    function previousSibling(elm, selector, adjacent) {
        var node = elm.previousSibling;
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (adjacent) {
                    break;
                }
            }
            node = node.previousSibling;
        }
        return null;
    }

    /*
     * Get all preceding siblings of each element in the set of matched elements, optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function previousSiblings(elm, selector) {
        var node = elm.previousSibling,
            ret = [];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    ret.push(node);
                }
            }
            node = node.previousSibling;
        }
        return ret;
    }

    /*
     * Selects all sibling elements that follow after the “prev” element, have the same parent, and match the filtering “siblings” selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function siblings(elm, selector) {
        var node = elm.parentNode.firstChild,
            ret = [];
        while (node) {
            if (node.nodeType == 1 && node !== elm) {
                if (!selector || matches(node, selector)) {
                    ret.push(node);
                }
            }
            node = node.nextSibling;
        }
        return ret;
    }

    var finder = function() {
        return finder;
    };

    langx.mixin(finder, {

        ancestor: ancestor,

        ancestors: ancestors,

        byId: byId,

        children: children,

        closest: closest,

        descendant: descendant,

        descendants: descendants,

        find: find,

        findAll: findAll,

        firstChild: firstChild,

        lastChild: lastChild,

        matches: matches,

        nextSibling: nextSibling,

        nextSiblings: nextSiblings,

        parent: parent,

        previousSibling,

        previousSiblings,

        pseudos: local.pseudos,

        siblings: siblings
    });

    return dom.finder = finder;
});
define('skylark-utils-dom/datax',[
    "./dom",
    "./langx",
    "./finder",
    "./noder"
], function(dom, langx, finder,noder) {
    var map = Array.prototype.map,
        filter = Array.prototype.filter,
        camelCase = langx.camelCase,
        deserializeValue = langx.deserializeValue,

        capitalRE = /([A-Z])/g,
        propMap = {
            'tabindex': 'tabIndex',
            'readonly': 'readOnly',
            'for': 'htmlFor',
            'class': 'className',
            'maxlength': 'maxLength',
            'cellspacing': 'cellSpacing',
            'cellpadding': 'cellPadding',
            'rowspan': 'rowSpan',
            'colspan': 'colSpan',
            'usemap': 'useMap',
            'frameborder': 'frameBorder',
            'contenteditable': 'contentEditable'
        };

    // Strip and collapse whitespace according to HTML spec
    function stripAndCollapse( value ) {
      var tokens = value.match( /[^\x20\t\r\n\f]+/g ) || [];
      return tokens.join( " " );
    }


    var valHooks = {
      option: {
        get: function( elem ) {
          var val = elem.getAttribute( "value" );
          return val != null ?  val :  stripAndCollapse(text( elem ) );
        }
      },
      select: {
        get: function( elem ) {
          var value, option, i,
            options = elem.options,
            index = elem.selectedIndex,
            one = elem.type === "select-one",
            values = one ? null : [],
            max = one ? index + 1 : options.length;

          if ( index < 0 ) {
            i = max;

          } else {
            i = one ? index : 0;
          }

          // Loop through all the selected options
          for ( ; i < max; i++ ) {
            option = options[ i ];

            if ( option.selected &&

                // Don't return options that are disabled or in a disabled optgroup
                !option.disabled &&
                ( !option.parentNode.disabled ||
                  !noder.nodeName( option.parentNode, "optgroup" ) ) ) {

              // Get the specific value for the option
              value = val(option);

              // We don't need an array for one selects
              if ( one ) {
                return value;
              }

              // Multi-Selects return an array
              values.push( value );
            }
          }

          return values;
        },

        set: function( elem, value ) {
          var optionSet, option,
            options = elem.options,
            values = langx.makeArray( value ),
            i = options.length;

          while ( i-- ) {
            option = options[ i ];

            /* eslint-disable no-cond-assign */

            if ( option.selected =
              langx.inArray( valHooks.option.get( option ), values ) > -1
            ) {
              optionSet = true;
            }

            /* eslint-enable no-cond-assign */
          }

          // Force browsers to behave consistently when non-matching value is set
          if ( !optionSet ) {
            elem.selectedIndex = -1;
          }
          return values;
        }
      }
    };


    // Radios and checkboxes getter/setter
    langx.each( [ "radio", "checkbox" ], function() {
      valHooks[ this ] = {
        set: function( elem, value ) {
          if ( langx.isArray( value ) ) {
            return ( elem.checked = langx.inArray( val(elem), value ) > -1 );
          }
        }
      };
    });



    /*
     * Set property values
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */

    function setAttribute(elm, name, value) {
        if (value == null) {
            elm.removeAttribute(name);
        } else {
            elm.setAttribute(name, value);
        }
    }

    function aria(elm, name, value) {
        return this.attr(elm, "aria-" + name, value);
    }

    /*
     * Set property values
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */

    function attr(elm, name, value) {
        if (value === undefined) {
            if (typeof name === "object") {
                for (var attrName in name) {
                    attr(elm, attrName, name[attrName]);
                }
                return this;
            } else {
                if (elm.hasAttribute && elm.hasAttribute(name)) {
                    return elm.getAttribute(name);
                }
            }
        } else {
            elm.setAttribute(name, value);
            return this;
        }
    }


    /*
     *  Read all "data-*" attributes from a node
     * @param {Object} elm  
     */

    function _attributeData(elm) {
        var store = {}
        langx.each(elm.attributes || [], function(i, attr) {
            if (attr.name.indexOf('data-') == 0) {
                store[camelCase(attr.name.replace('data-', ''))] = deserializeValue(attr.value);
            }
        })
        return store;
    }

    function _store(elm, confirm) {
        var store = elm["_$_store"];
        if (!store && confirm) {
            store = elm["_$_store"] = _attributeData(elm);
        }
        return store;
    }

    function _getData(elm, name) {
        if (name === undefined) {
            return _store(elm, true);
        } else {
            var store = _store(elm);
            if (store) {
                if (name in store) {
                    return store[name];
                }
                var camelName = camelCase(name);
                if (camelName in store) {
                    return store[camelName];
                }
            }
            var attrName = 'data-' + name.replace(capitalRE, "-$1").toLowerCase()
            return attr(elm, attrName);
        }

    }

    function _setData(elm, name, value) {
        var store = _store(elm, true);
        store[camelCase(name)] = value;
    }


    /*
     * xxx
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */
    function data(elm, name, value) {

        if (value === undefined) {
            if (typeof name === "object") {
                for (var dataAttrName in name) {
                    _setData(elm, dataAttrName, name[dataAttrName]);
                }
                return this;
            } else {
                return _getData(elm, name);
            }
        } else {
            _setData(elm, name, value);
            return this;
        }
    } 
    /*
     * Remove from the element all items that have not yet been run. 
     * @param {Object} elm  
     */

    function cleanData(elm) {
        if (elm["_$_store"]) {
            delete elm["_$_store"];
        }
    }

    /*
     * Remove a previously-stored piece of data. 
     * @param {Object} elm  
     * @param {Array} names
     */
    function removeData(elm, names) {
        if (names) {
            if (langx.isString(names)) {
                names = names.split(/\s+/);
            }
            var store = _store(elm, true);
            names.forEach(function(name) {
                delete store[name];
            });            
        } else {
            cleanData(elm);
        }
        return this;
    }

    /*
     * xxx 
     * @param {Object} elm  
     * @param {Array} names
     */
    function pluck(nodes, property) {
        return map.call(nodes, function(elm) {
            return elm[property];
        });
    }

    /*
     * Get or set the value of an property for the specified element.
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */
    function prop(elm, name, value) {
        name = propMap[name] || name;
        if (value === undefined) {
            return elm[name];
        } else {
            elm[name] = value;
            return this;
        }
    }

    /*
     * remove Attributes  
     * @param {Object} elm  
     * @param {String} name
     */
    function removeAttr(elm, name) {
        name.split(' ').forEach(function(attr) {
            setAttribute(elm, attr);
        });
        return this;
    }


    /*
     * Remove the value of a property for the first element in the set of matched elements or set one or more properties for every matched element.
     * @param {Object} elm  
     * @param {String} name
     */
    function removeProp(elm, name) {
        name.split(' ').forEach(function(prop) {
            delete elm[prop];
        });
        return this;
    }

    /*   
     * Get the combined text contents of each element in the set of matched elements, including their descendants, or set the text contents of the matched elements.  
     * @param {Object} elm  
     * @param {String} txt
     */
    function text(elm, txt) {
        if (txt === undefined) {
            return elm.textContent;
        } else {
            elm.textContent = txt == null ? '' : '' + txt;
            return this;
        }
    }

    /*   
     * Get the current value of the first element in the set of matched elements or set the value of every matched element.
     * @param {Object} elm  
     * @param {String} value
     */
    function val(elm, value) {
        var hooks = valHooks[ elm.type ] || valHooks[ elm.nodeName.toLowerCase() ];
        if (value === undefined) {
/*
            if (elm.multiple) {
                // select multiple values
                var selectedOptions = filter.call(finder.find(elm, "option"), (function(option) {
                    return option.selected;
                }));
                return pluck(selectedOptions, "value");
            } else {
                if (/input|textarea/i.test(elm.tagName)) {
                  return elm.value;
                }
                return text(elm);
            }
*/

          if ( hooks &&  "get" in hooks &&  ( ret = hooks.get( elm, "value" ) ) !== undefined ) {
            return ret;
          }

          ret = elm.value;

          // Handle most common string cases
          if ( typeof ret === "string" ) {
            return ret.replace( /\r/g, "" );
          }

          // Handle cases where value is null/undef or number
          return ret == null ? "" : ret;

        } else {
/*          
            if (/input|textarea/i.test(elm.tagName)) {
              elm.value = value;
            } else {
              text(elm,value);
            }
            return this;
*/
          // Treat null/undefined as ""; convert numbers to string
          if ( value == null ) {
            value = "";

          } else if ( typeof value === "number" ) {
            value += "";

          } else if ( langx.isArray( value ) ) {
            value = langx.map( value, function( value1 ) {
              return value1 == null ? "" : value1 + "";
            } );
          }

          // If set returns undefined, fall back to normal setting
          if ( !hooks || !( "set" in hooks ) || hooks.set( elm, value, "value" ) === undefined ) {
            elm.value = value;
          }
        }      
    }


    finder.pseudos.data = function( elem, i, match,dataName ) {
        return !!data( elem, dataName || match[3]);
    };
   

    function datax() {
        return datax;
    }

    langx.mixin(datax, {
        aria: aria,

        attr: attr,

        cleanData: cleanData,

        data: data,

        pluck: pluck,

        prop: prop,

        removeAttr: removeAttr,

        removeData: removeData,

        removeProp: removeProp,

        text: text,

        val: val,

        valHooks : valHooks
    });

    return dom.datax = datax;
});
define('skylark-utils-dom/eventer',[
    "./dom",
    "./langx",
    "./browser",
    "./finder",
    "./noder",
    "./datax"
], function(dom, langx, browser, finder, noder, datax) {
    var mixin = langx.mixin,
        each = langx.each,
        slice = Array.prototype.slice,
        uid = langx.uid,
        ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
        eventMethods = {
            preventDefault: "isDefaultPrevented",
            stopImmediatePropagation: "isImmediatePropagationStopped",
            stopPropagation: "isPropagationStopped"
        },
        readyRE = /complete|loaded|interactive/;

    function compatible(event, source) {
        if (source || !event.isDefaultPrevented) {
            if (!source) {
                source = event;
            }

            langx.each(eventMethods, function(name, predicate) {
                var sourceMethod = source[name];
                event[name] = function() {
                    this[predicate] = langx.returnTrue;
                    return sourceMethod && sourceMethod.apply(source, arguments);
                }
                event[predicate] = langx.returnFalse;
            });
        }
        return event;
    }

    function parse(event) {
        var segs = ("" + event).split(".");
        return {
            type: segs[0],
            ns: segs.slice(1).sort().join(" ")
        };
    }

    //create a custom dom event
    var createEvent = (function() {
        var EventCtors = [
                window["CustomEvent"], // 0 default
                window["CompositionEvent"], // 1
                window["DragEvent"], // 2
                window["Event"], // 3
                window["FocusEvent"], // 4
                window["KeyboardEvent"], // 5
                window["MessageEvent"], // 6
                window["MouseEvent"], // 7
                window["MouseScrollEvent"], // 8
                window["MouseWheelEvent"], // 9
                window["MutationEvent"], // 10
                window["ProgressEvent"], // 11
                window["TextEvent"], // 12
                window["TouchEvent"], // 13
                window["UIEvent"], // 14
                window["WheelEvent"], // 15
                window["ClipboardEvent"] // 16
            ],
            NativeEvents = {
                "compositionstart": 1, // CompositionEvent
                "compositionend": 1, // CompositionEvent
                "compositionupdate": 1, // CompositionEvent

                "beforecopy": 16, // ClipboardEvent
                "beforecut": 16, // ClipboardEvent
                "beforepaste": 16, // ClipboardEvent
                "copy": 16, // ClipboardEvent
                "cut": 16, // ClipboardEvent
                "paste": 16, // ClipboardEvent

                "drag": 2, // DragEvent
                "dragend": 2, // DragEvent
                "dragenter": 2, // DragEvent
                "dragexit": 2, // DragEvent
                "dragleave": 2, // DragEvent
                "dragover": 2, // DragEvent
                "dragstart": 2, // DragEvent
                "drop": 2, // DragEvent

                "abort": 3, // Event
                "change": 3, // Event
                "error": 3, // Event
                "selectionchange": 3, // Event
                "submit": 3, // Event
                "reset": 3, // Event

                "focus": 4, // FocusEvent
                "blur": 4, // FocusEvent
                "focusin": 4, // FocusEvent
                "focusout": 4, // FocusEvent

                "keydown": 5, // KeyboardEvent
                "keypress": 5, // KeyboardEvent
                "keyup": 5, // KeyboardEvent

                "message": 6, // MessageEvent

                "click": 7, // MouseEvent
                "contextmenu": 7, // MouseEvent
                "dblclick": 7, // MouseEvent
                "mousedown": 7, // MouseEvent
                "mouseup": 7, // MouseEvent
                "mousemove": 7, // MouseEvent
                "mouseover": 7, // MouseEvent
                "mouseout": 7, // MouseEvent
                "mouseenter": 7, // MouseEvent
                "mouseleave": 7, // MouseEvent


                "textInput": 12, // TextEvent

                "touchstart": 13, // TouchEvent
                "touchmove": 13, // TouchEvent
                "touchend": 13, // TouchEvent

                "load": 14, // UIEvent
                "resize": 14, // UIEvent
                "select": 14, // UIEvent
                "scroll": 14, // UIEvent
                "unload": 14, // UIEvent,

                "wheel": 15 // WheelEvent
            };

        function getEventCtor(type) {
            var idx = NativeEvents[type];
            if (!idx) {
                idx = 0;
            }
            return EventCtors[idx];
        }

        return function(type, props) {
            //create a custom dom event

            if (langx.isString(type)) {
                props = props || {};
            } else {
                props = type || {};
                type = props.type || "";
            }
            var parsed = parse(type);
            type = parsed.type;

            props = langx.mixin({
                bubbles: true,
                cancelable: true
            }, props);

            if (parsed.ns) {
                props.namespace = parsed.ns;
            }

            var ctor = getEventCtor(type),
                e = new ctor(type, props);

            langx.safeMixin(e, props);

            return compatible(e);
        };
    })();

    function createProxy(src, props) {
        var key,
            proxy = {
                originalEvent: src
            };
        for (key in src) {
            if (key !== "keyIdentifier" && !ignoreProperties.test(key) && src[key] !== undefined) {
                proxy[key] = src[key];
            }
        }
        if (props) {
            langx.mixin(proxy, props);
        }
        return compatible(proxy, src);
    }

    var
        specialEvents = {},
        focusinSupported = "onfocusin" in window,
        focus = { focus: "focusin", blur: "focusout" },
        hover = { mouseenter: "mouseover", mouseleave: "mouseout" },
        realEvent = function(type) {
            return hover[type] || (focusinSupported && focus[type]) || type;
        },
        handlers = {},
        EventBindings = langx.klass({
            init: function(target, event) {
                this._target = target;
                this._event = event;
                this._bindings = [];
            },

            add: function(fn, options) {
                var bindings = this._bindings,
                    binding = {
                        fn: fn,
                        options: langx.mixin({}, options)
                    };

                bindings.push(binding);

                var self = this;
                if (!self._listener) {
                    self._listener = function(domEvt) {
                        var elm = this,
                            e = createProxy(domEvt),
                            args = domEvt._args,
                            bindings = self._bindings,
                            ns = e.namespace;

                        if (langx.isDefined(args)) {
                            args = [e].concat(args);
                        } else {
                            args = [e];
                        }

                        langx.each(bindings, function(idx, binding) {
                            var match = elm;
                            if (e.isImmediatePropagationStopped && e.isImmediatePropagationStopped()) {
                                return false;
                            }
                            var fn = binding.fn,
                                options = binding.options || {},
                                selector = options.selector,
                                one = options.one,
                                data = options.data;

                            if (ns && ns != options.ns && options.ns.indexOf(ns) === -1) {
                                return;
                            }
                            if (selector) {
                                match = finder.closest(e.target, selector);
                                if (match && match !== elm) {
                                    langx.mixin(e, {
                                        currentTarget: match,
                                        liveFired: elm
                                    });
                                } else {
                                    return;
                                }
                            }

                            var originalEvent = self._event;
                            if (originalEvent in hover) {
                                var related = e.relatedTarget;
                                if (related && (related === match || noder.contains(match, related))) {
                                    return;
                                }
                            }

                            if (langx.isDefined(data)) {
                                e.data = data;
                            }

                            if (one) {
                                self.remove(fn, options);
                            }

                            var result = fn.apply(match, args);

                            if (result === false) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        });;
                    };

                    var event = self._event;
                    /*
                                        if (event in hover) {
                                            var l = self._listener;
                                            self._listener = function(e) {
                                                var related = e.relatedTarget;
                                                if (!related || (related !== this && !noder.contains(this, related))) {
                                                    return l.apply(this, arguments);
                                                }
                                            }
                                        }
                    */

                    if (self._target.addEventListener) {
                        self._target.addEventListener(realEvent(event), self._listener, false);
                    } else {
                        console.warn("invalid eventer object", self._target);
                    }
                }

            },
            remove: function(fn, options) {
                options = langx.mixin({}, options);

                function matcherFor(ns) {
                    return new RegExp("(?:^| )" + ns.replace(" ", " .* ?") + "(?: |$)");
                }
                var matcher;
                if (options.ns) {
                    matcher = matcherFor(options.ns);
                }

                this._bindings = this._bindings.filter(function(binding) {
                    var removing = (!fn || fn === binding.fn) &&
                        (!matcher || matcher.test(binding.options.ns)) &&
                        (!options.selector || options.selector == binding.options.selector);

                    return !removing;
                });
                if (this._bindings.length == 0) {
                    if (this._target.removeEventListener) {
                        this._target.removeEventListener(realEvent(this._event), this._listener, false);
                    }
                    this._listener = null;
                }
            }
        }),
        EventsHandler = langx.klass({
            init: function(elm) {
                this._target = elm;
                this._handler = {};
            },

            // add a event listener
            // selector Optional
            register: function(event, callback, options) {
                // Seperate the event from the namespace
                var parsed = parse(event),
                    event = parsed.type,
                    specialEvent = specialEvents[event],
                    bindingEvent = specialEvent && (specialEvent.bindType || specialEvent.bindEventName);

                var events = this._handler;

                // Check if there is already a handler for this event
                if (events[event] === undefined) {
                    events[event] = new EventBindings(this._target, bindingEvent || event);
                }

                // Register the new callback function
                events[event].add(callback, langx.mixin({
                    ns: parsed.ns
                }, options)); // options:{selector:xxx}
            },

            // remove a event listener
            unregister: function(event, fn, options) {
                // Check for parameter validtiy
                var events = this._handler,
                    parsed = parse(event);
                event = parsed.type;

                if (event) {
                    var listener = events[event];

                    if (listener) {
                        listener.remove(fn, langx.mixin({
                            ns: parsed.ns
                        }, options));
                    }
                } else {
                    //remove all events
                    for (event in events) {
                        var listener = events[event];
                        listener.remove(fn, langx.mixin({
                            ns: parsed.ns
                        }, options));
                    }
                }
            }
        }),

        findHandler = function(elm) {
            var id = uid(elm),
                handler = handlers[id];
            if (!handler) {
                handler = handlers[id] = new EventsHandler(elm);
            }
            return handler;
        };

    /*   
     * Remove an event handler for one or more events from the specified element.
     * @param {HTMLElement} elm  
     * @param {String} events
     * @param {String　Optional } selector
     * @param {Function} callback
     */
    function off(elm, events, selector, callback) {
        var $this = this
        if (langx.isPlainObject(events)) {
            langx.each(events, function(type, fn) {
                off(elm, type, selector, fn);
            })
            return $this;
        }

        if (!langx.isString(selector) && !langx.isFunction(callback) && callback !== false) {
            callback = selector;
            selector = undefined;
        }

        if (callback === false) {
            callback = langx.returnFalse;
        }

        if (typeof events == "string") {
            if (events.indexOf(",") > -1) {
                events = events.split(",");
            } else {
                events = events.split(/\s/);
            }
        }

        var handler = findHandler(elm);

        if (events) events.forEach(function(event) {

            handler.unregister(event, callback, {
                selector: selector,
            });
        });
        return this;
    }

    /*   
     * Attach an event handler function for one or more events to the selected elements.
     * @param {HTMLElement} elm  
     * @param {String} events
     * @param {String　Optional} selector
     * @param {Anything Optional} data
     * @param {Function} callback
     * @param {Boolean　Optional} one
     */
    function on(elm, events, selector, data, callback, one) {

        var autoRemove, delegator;
        if (langx.isPlainObject(events)) {
            langx.each(events, function(type, fn) {
                on(elm, type, selector, data, fn, one);
            });
            return this;
        }

        if (!langx.isString(selector) && !langx.isFunction(callback)) {
            callback = data;
            data = selector;
            selector = undefined;
        }

        if (langx.isFunction(data)) {
            callback = data;
            data = undefined;
        }

        if (callback === false) {
            callback = langx.returnFalse;
        }

        if (typeof events == "string") {
            if (events.indexOf(",") > -1) {
                events = events.split(",");
            } else {
                events = events.split(/\s/);
            }
        }

        var handler = findHandler(elm);

        events.forEach(function(event) {
            if (event == "ready") {
                return ready(callback);
            }
            handler.register(event, callback, {
                data: data,
                selector: selector,
                one: !!one
            });
        });
        return this;
    }

    /*   
     * Attach a handler to an event for the elements. The handler is executed at most once per 
     * @param {HTMLElement} elm  
     * @param {String} event
     * @param {String　Optional} selector
     * @param {Anything Optional} data
     * @param {Function} callback
     */
    function one(elm, events, selector, data, callback) {
        on(elm, events, selector, data, callback, 1);

        return this;
    }

    /*   
     * Prevents propagation and clobbers the default action of the passed event. The same as calling event.preventDefault() and event.stopPropagation(). 
     * @param {String} event
     */
    function stop(event) {
        if (window.document.all) {
            event.keyCode = 0;
        }
        if (event.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
        }
        return this;
    }
    /*   
     * Execute all handlers and behaviors attached to the matched elements for the given event  
     * @param {String} evented
     * @param {String} type
     * @param {Array or PlainObject } args
     */
    function trigger(evented, type, args) {
        var e;
        if (type instanceof Event) {
            e = type;
        } else {
            e = createEvent(type, args);
        }
        e._args = args;

        var fn = (evented.dispatchEvent || evented.trigger);
        if (fn) {
            fn.call(evented, e);
        } else {
            console.warn("The evented parameter is not a eventable object");
        }

        return this;
    }
    /*   
     * Specify a function to execute when the DOM is fully loaded.  
     * @param {Function} callback
     */
    function ready(callback) {
        // need to check if document.body exists for IE as that browser reports
        // document ready when it hasn't yet created the body elm
        if (readyRE.test(document.readyState) && document.body) {
            langx.defer(callback);
        } else {
            document.addEventListener('DOMContentLoaded', callback, false);
        }

        return this;
    }

    var keyCodeLookup = {
        "backspace": 8,
        "comma": 188,
        "delete": 46,
        "down": 40,
        "end": 35,
        "enter": 13,
        "escape": 27,
        "home": 36,
        "left": 37,
        "page_down": 34,
        "page_up": 33,
        "period": 190,
        "right": 39,
        "space": 32,
        "tab": 9,
        "up": 38
    };
    //example:
    //shortcuts(elm).add("CTRL+ALT+SHIFT+X",function(){console.log("test!")});
    function shortcuts(elm) {

        var registry = datax.data(elm, "shortcuts");
        if (!registry) {
            registry = {};
            datax.data(elm, "shortcuts", registry);
            var run = function(shortcut, event) {
                var n = event.metaKey || event.ctrlKey;
                if (shortcut.ctrl == n && shortcut.alt == event.altKey && shortcut.shift == event.shiftKey) {
                    if (event.keyCode == shortcut.keyCode || event.charCode && event.charCode == shortcut.charCode) {
                        event.preventDefault();
                        if ("keydown" == event.type) {
                            shortcut.fn(event);
                        }
                        return true;
                    }
                }
            };
            on(elm, "keyup keypress keydown", function(event) {
                if (!(/INPUT|TEXTAREA/.test(event.target.nodeName))) {
                    for (var key in registry) {
                        run(registry[key], event);
                    }
                }
            });

        }

        return {
            add: function(pattern, fn) {
                var shortcutKeys;
                if (pattern.indexOf(",") > -1) {
                    shortcutKeys = pattern.toLowerCase().split(",");
                } else {
                    shortcutKeys = pattern.toLowerCase().split(" ");
                }
                shortcutKeys.forEach(function(shortcutKey) {
                    var setting = {
                        fn: fn,
                        alt: false,
                        ctrl: false,
                        shift: false
                    };
                    shortcutKey.split("+").forEach(function(key) {
                        switch (key) {
                            case "alt":
                            case "ctrl":
                            case "shift":
                                setting[key] = true;
                                break;
                            default:
                                setting.charCode = key.charCodeAt(0);
                                setting.keyCode = keyCodeLookup[key] || key.toUpperCase().charCodeAt(0);
                        }
                    });
                    var regKey = (setting.ctrl ? "ctrl" : "") + "," + (setting.alt ? "alt" : "") + "," + (setting.shift ? "shift" : "") + "," + setting.keyCode;
                    registry[regKey] = setting;
                })
            }

        };

    }

    if (browser.support.transition) {
        specialEvents.transitionEnd = {
//          handle: function (e) {
//            if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
//          },
          bindType: browser.support.transition.end,
          delegateType: browser.support.transition.end
        }        
    }

    function eventer() {
        return eventer;
    }

    langx.mixin(eventer, {
        create: createEvent,

        keys: keyCodeLookup,

        off: off,

        on: on,

        one: one,

        proxy: createProxy,

        ready: ready,

        shortcuts: shortcuts,

        special: specialEvents,

        stop: stop,

        trigger: trigger

    });

    return dom.eventer = eventer;
});
define('skylark-utils-dom/geom',[
    "./dom",
    "./langx",
    "./noder",
    "./styler"
], function(dom, langx, noder, styler) {
    var rootNodeRE = /^(?:body|html)$/i,
        px = langx.toPixel,
        offsetParent = noder.offsetParent,
        cachedScrollbarWidth;

    function scrollbarWidth() {
        if (cachedScrollbarWidth !== undefined) {
            return cachedScrollbarWidth;
        }
        var w1, w2,
            div = noder.createFragment("<div style=" +
                "'display:block;position:absolute;width:200px;height:200px;overflow:hidden;'>" +
                "<div style='height:300px;width:auto;'></div></div>")[0],
            innerDiv = div.childNodes[0];

        noder.append(document.body, div);

        w1 = innerDiv.offsetWidth;

        styler.css(div, "overflow", "scroll");

        w2 = innerDiv.offsetWidth;

        if (w1 === w2) {
            w2 = div[0].clientWidth;
        }

        noder.remove(div);

        return (cachedScrollbarWidth = w1 - w2);
    }
    /*
     * Get the widths of each border of the specified element.
     * @param {HTMLElement} elm
     */
    function borderExtents(elm) {
        if (noder.isWindow(elm)) {
            return {
                left : 0,
                top : 0,
                right : 0,
                bottom : 0
            }
        }        var s = getComputedStyle(elm);
        return {
            left: px(s.borderLeftWidth, elm),
            top: px(s.borderTopWidth, elm),
            right: px(s.borderRightWidth, elm),
            bottom: px(s.borderBottomWidth, elm)
        }
    }

    //viewport coordinate
    /*
     * Get or set the viewport position of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function boundingPosition(elm, coords) {
        if (coords === undefined) {
            return rootNodeRE.test(elm.nodeName) ? { top: 0, left: 0 } : elm.getBoundingClientRect();
        } else {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                parentOffset = boundingPosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            relativePosition(elm, {
                top: coords.top - parentOffset.top - mex.top - pbex.top,
                left: coords.left - parentOffset.left - mex.left - pbex.left
            });
            return this;
        }
    }

    /*
     * Get or set the viewport rect of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function boundingRect(elm, coords) {
        if (coords === undefined) {
            return elm.getBoundingClientRect()
        } else {
            boundingPosition(elm, coords);
            size(elm, coords);
            return this;
        }
    }

    /*
     * Get or set the height of the specified element client box.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function clientHeight(elm, value) {
        if (value == undefined) {
            return clientSize(elm).height;
        } else {
            return clientSize(elm, {
                height: value
            });
        }
    }

    /*
     * Get or set the size of the specified element client box.
     * @param {HTMLElement} elm
     * @param {PlainObject} dimension
     */
    function clientSize(elm, dimension) {
        if (dimension == undefined) {
            return {
                width: elm.clientWidth,
                height: elm.clientHeight
            }
        } else {
            var isBorderBox = (styler.css(elm, "box-sizing") === "border-box"),
                props = {
                    width: dimension.width,
                    height: dimension.height
                };
            if (!isBorderBox) {
                var pex = paddingExtents(elm);

                if (props.width !== undefined) {
                    props.width = props.width - pex.left - pex.right;
                }

                if (props.height !== undefined) {
                    props.height = props.height - pex.top - pex.bottom;
                }
            } else {
                var bex = borderExtents(elm);

                if (props.width !== undefined) {
                    props.width = props.width + bex.left + bex.right;
                }

                if (props.height !== undefined) {
                    props.height = props.height + bex.top + bex.bottom;
                }

            }
            styler.css(elm, props);
            return this;
        }
        return {
            width: elm.clientWidth,
            height: elm.clientHeight
        };
    }

    /*
     * Get or set the width of the specified element client box.
     * @param {HTMLElement} elm
     * @param {PlainObject} dimension
     */
    function clientWidth(elm, value) {
        if (value == undefined) {
            return clientSize(elm).width;
        } else {
            clientSize(elm, {
                width: value
            });
            return this;
        }
    }

    /*
     * Get the rect of the specified element content box.
     * @param {HTMLElement} elm
     */
    function contentRect(elm) {
        var cs = clientSize(elm),
            pex = paddingExtents(elm);


        //// On Opera, offsetLeft includes the parent's border
        //if(has("opera")){
        //    pe.l += be.l;
        //    pe.t += be.t;
        //}
        return {
            left: pex.left,
            top: pex.top,
            width: cs.width - pex.left - pex.right,
            height: cs.height - pex.top - pex.bottom
        };
    }

    /*
     * Get the document size.
     * @param {HTMLDocument} doc
     */
    function getDocumentSize(doc) {
        var documentElement = doc.documentElement,
            body = doc.body,
            max = Math.max,
            scrollWidth = max(documentElement.scrollWidth, body.scrollWidth),
            clientWidth = max(documentElement.clientWidth, body.clientWidth),
            offsetWidth = max(documentElement.offsetWidth, body.offsetWidth),
            scrollHeight = max(documentElement.scrollHeight, body.scrollHeight),
            clientHeight = max(documentElement.clientHeight, body.clientHeight),
            offsetHeight = max(documentElement.offsetHeight, body.offsetHeight);

        return {
            width: scrollWidth < offsetWidth ? clientWidth : scrollWidth,
            height: scrollHeight < offsetHeight ? clientHeight : scrollHeight
        };
    }

    /*
     * Get the document size.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function height(elm, value) {
        if (value == undefined) {
            return size(elm).height;
        } else {
            size(elm, {
                height: value
            });
            return this;
        }
    }

    /*
     * Get the widths of each margin of the specified element.
     * @param {HTMLElement} elm
     */
    function marginExtents(elm) {
        if (noder.isWindow(elm)) {
            return {
                left : 0,
                top : 0,
                right : 0,
                bottom : 0
            }
        }
        var s = getComputedStyle(elm);
        return {
            left: px(s.marginLeft),
            top: px(s.marginTop),
            right: px(s.marginRight),
            bottom: px(s.marginBottom),
        }
    }


    function marginRect(elm) {
        var obj = relativeRect(elm),
            me = marginExtents(elm);

        return {
            left: obj.left,
            top: obj.top,
            width: obj.width + me.left + me.right,
            height: obj.height + me.top + me.bottom
        };
    }


    function marginSize(elm) {
        var obj = size(elm),
            me = marginExtents(elm);

        return {
            width: obj.width + me.left + me.right,
            height: obj.height + me.top + me.bottom
        };
    }

    /*
     * Get the widths of each padding of the specified element.
     * @param {HTMLElement} elm
     */
    function paddingExtents(elm) {
        if (noder.isWindow(elm)) {
            return {
                left : 0,
                top : 0,
                right : 0,
                bottom : 0
            }
        }
        var s = getComputedStyle(elm);
        return {
            left: px(s.paddingLeft),
            top: px(s.paddingTop),
            right: px(s.paddingRight),
            bottom: px(s.paddingBottom),
        }
    }

    /*
     * Get or set the document position of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    //coordinate to the document
    function pagePosition(elm, coords) {
        if (coords === undefined) {
            var obj = elm.getBoundingClientRect()
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset
            }
        } else {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                parentOffset = pagePosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            relativePosition(elm, {
                top: coords.top - parentOffset.top - mex.top - pbex.top,
                left: coords.left - parentOffset.left - mex.left - pbex.left
            });
            return this;
        }
    }

    /*
     * Get or set the document rect of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function pageRect(elm, coords) {
        if (coords === undefined) {
            var obj = elm.getBoundingClientRect()
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            }
        } else {
            pagePosition(elm, coords);
            size(elm, coords);
            return this;
        }
    }

    /*
     * Get or set the position of the specified element border box , relative to parent element.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    // coordinate relative to it's parent
    function relativePosition(elm, coords) {
        if (coords == undefined) {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                offset = boundingPosition(elm),
                parentOffset = boundingPosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            // Subtract parent offsets and element margins
            return {
                top: offset.top - parentOffset.top - pbex.top, // - mex.top,
                left: offset.left - parentOffset.left - pbex.left, // - mex.left
            }
        } else {
            var props = {
                top: coords.top,
                left: coords.left
            }

            if (styler.css(elm, "position") == "static") {
                props['position'] = "relative";
            }
            styler.css(elm, props);
            return this;
        }
    }

    /*
     * Get or set the rect of the specified element border box , relatived to parent element.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function relativeRect(elm, coords) {
        if (coords === undefined) {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                offset = boundingRect(elm),
                parentOffset = boundingPosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            // Subtract parent offsets and element margins
            return {
                top: offset.top - parentOffset.top - pbex.top, // - mex.top,
                left: offset.left - parentOffset.left - pbex.left, // - mex.left,
                width: offset.width,
                height: offset.height
            }
        } else {
            relativePosition(elm, coords);
            size(elm, coords);
            return this;
        }
    }
    /*
     * Scroll the specified element into view.
     * @param {HTMLElement} elm
     * @param {} align
     */
    function scrollIntoView(elm, align) {
        function getOffset(elm, rootElm) {
            var x, y, parent = elm;

            x = y = 0;
            while (parent && parent != rootElm && parent.nodeType) {
                x += parent.offsetLeft || 0;
                y += parent.offsetTop || 0;
                parent = parent.offsetParent;
            }

            return { x: x, y: y };
        }

        var parentElm = elm.parentNode;
        var x, y, width, height, parentWidth, parentHeight;
        var pos = getOffset(elm, parentElm);

        x = pos.x;
        y = pos.y;
        width = elm.offsetWidth;
        height = elm.offsetHeight;
        parentWidth = parentElm.clientWidth;
        parentHeight = parentElm.clientHeight;

        if (align == "end") {
            x -= parentWidth - width;
            y -= parentHeight - height;
        } else if (align == "center") {
            x -= (parentWidth / 2) - (width / 2);
            y -= (parentHeight / 2) - (height / 2);
        }

        parentElm.scrollLeft = x;
        parentElm.scrollTop = y;

        return this;
    }
    /*
     * Get or set the current horizontal position of the scroll bar for the specified element.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function scrollLeft(elm, value) {
        if (elm.nodeType === 9) {
            elm = elm.defaultView;
        }
        var hasScrollLeft = "scrollLeft" in elm;
        if (value === undefined) {
            return hasScrollLeft ? elm.scrollLeft : elm.pageXOffset
        } else {
            if (hasScrollLeft) {
                elm.scrollLeft = value;
            } else {
                elm.scrollTo(value, elm.scrollY);
            }
            return this;
        }
    }
    /*
     * Get or the current vertical position of the scroll bar for the specified element.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function scrollTop(elm, value) {
        if (elm.nodeType === 9) {
            elm = elm.defaultView;
        }
        var hasScrollTop = "scrollTop" in elm;

        if (value === undefined) {
            return hasScrollTop ? elm.scrollTop : elm.pageYOffset
        } else {
            if (hasScrollTop) {
                elm.scrollTop = value;
            } else {
                elm.scrollTo(elm.scrollX, value);
            }
            return this;
        }
    }
    /*
     * Get or set the size of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject}dimension
     */
    function size(elm, dimension) {
        if (dimension == undefined) {
            if (langx.isWindow(elm)) {
                return {
                    width: elm.innerWidth,
                    height: elm.innerHeight
                }

            } else if (langx.isDocument(elm)) {
                return getDocumentSize(document);
            } else {
                return {
                    width: elm.offsetWidth,
                    height: elm.offsetHeight
                }
            }
        } else {
            var isBorderBox = (styler.css(elm, "box-sizing") === "border-box"),
                props = {
                    width: dimension.width,
                    height: dimension.height
                };
            if (!isBorderBox) {
                var pex = paddingExtents(elm),
                    bex = borderExtents(elm);

                if (props.width !== undefined && props.width !== "" && props.width !== null) {
                    props.width = props.width - pex.left - pex.right - bex.left - bex.right;
                }

                if (props.height !== undefined && props.height !== "" && props.height !== null) {
                    props.height = props.height - pex.top - pex.bottom - bex.top - bex.bottom;
                }
            }
            styler.css(elm, props);
            return this;
        }
    }
    /*
     * Get or set the size of the specified element border box.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function width(elm, value) {
        if (value == undefined) {
            return size(elm).width;
        } else {
            size(elm, {
                width: value
            });
            return this;
        }
    }

    function geom() {
        return geom;
    }

    langx.mixin(geom, {
        borderExtents: borderExtents,
        //viewport coordinate
        boundingPosition: boundingPosition,

        boundingRect: boundingRect,

        clientHeight: clientHeight,

        clientSize: clientSize,

        clientWidth: clientWidth,

        contentRect: contentRect,

        getDocumentSize: getDocumentSize,

        height: height,

        marginExtents: marginExtents,

        marginRect: marginRect,

        marginSize: marginSize,

        offsetParent: offsetParent,

        paddingExtents: paddingExtents,

        //coordinate to the document
        pagePosition: pagePosition,

        pageRect: pageRect,

        // coordinate relative to it's parent
        relativePosition: relativePosition,

        relativeRect: relativeRect,

        scrollbarWidth: scrollbarWidth,

        scrollIntoView: scrollIntoView,

        scrollLeft: scrollLeft,

        scrollTop: scrollTop,

        size: size,

        width: width
    });

    ( function() {
        var max = Math.max,
            abs = Math.abs,
            rhorizontal = /left|center|right/,
            rvertical = /top|center|bottom/,
            roffset = /[\+\-]\d+(\.[\d]+)?%?/,
            rposition = /^\w+/,
            rpercent = /%$/;

        function getOffsets( offsets, width, height ) {
            return [
                parseFloat( offsets[ 0 ] ) * ( rpercent.test( offsets[ 0 ] ) ? width / 100 : 1 ),
                parseFloat( offsets[ 1 ] ) * ( rpercent.test( offsets[ 1 ] ) ? height / 100 : 1 )
            ];
        }

        function parseCss( element, property ) {
            return parseInt( styler.css( element, property ), 10 ) || 0;
        }

        function getDimensions( raw ) {
            if ( raw.nodeType === 9 ) {
                return {
                    size: size(raw),
                    offset: { top: 0, left: 0 }
                };
            }
            if ( noder.isWindow( raw ) ) {
                return {
                    size: size(raw),
                    offset: { 
                        top: scrollTop(raw), 
                        left: scrollLeft(raw) 
                    }
                };
            }
            if ( raw.preventDefault ) {
                return {
                    size : {
                        width: 0,
                        height: 0
                    },
                    offset: { 
                        top: raw.pageY, 
                        left: raw.pageX 
                    }
                };
            }
            return {
                size: size(raw),
                offset: pagePosition(raw)
            };
        }

        function getScrollInfo( within ) {
            var overflowX = within.isWindow || within.isDocument ? "" :
                    styler.css(within.element,"overflow-x" ),
                overflowY = within.isWindow || within.isDocument ? "" :
                    styler.css(within.element,"overflow-y" ),
                hasOverflowX = overflowX === "scroll" ||
                    ( overflowX === "auto" && within.width < scrollWidth(within.element) ),
                hasOverflowY = overflowY === "scroll" ||
                    ( overflowY === "auto" && within.height < scrollHeight(within.element));
            return {
                width: hasOverflowY ? scrollbarWidth() : 0,
                height: hasOverflowX ? scrollbarWidth() : 0
            };
        }

        function getWithinInfo( element ) {
            var withinElement = element || window,
                isWindow = noder.isWindow( withinElement),
                isDocument = !!withinElement && withinElement.nodeType === 9,
                hasOffset = !isWindow && !isDocument,
                msize = marginSize(withinElement);
            return {
                element: withinElement,
                isWindow: isWindow,
                isDocument: isDocument,
                offset: hasOffset ? pagePosition(element) : { left: 0, top: 0 },
                scrollLeft: scrollLeft(withinElement),
                scrollTop: scrollTop(withinElement),
                width: msize.width,
                height: msize.height
            };
        }

        function posit(elm,options ) {
            // Make a copy, we don't want to modify arguments
            options = langx.extend( {}, options );

            var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,
                target = options.of,
                within = getWithinInfo( options.within ),
                scrollInfo = getScrollInfo( within ),
                collision = ( options.collision || "flip" ).split( " " ),
                offsets = {};

            dimensions = getDimensions( target );
            if ( target.preventDefault ) {

                // Force left top to allow flipping
                options.at = "left top";
            }
            targetWidth = dimensions.size.width;
            targetHeight = dimensions.size.height;
            targetOffset = dimensions.offset;

            // Clone to reuse original targetOffset later
            basePosition = langx.extend( {}, targetOffset );

            // Force my and at to have valid horizontal and vertical positions
            // if a value is missing or invalid, it will be converted to center
            langx.each( [ "my", "at" ], function() {
                var pos = ( options[ this ] || "" ).split( " " ),
                    horizontalOffset,
                    verticalOffset;

                if ( pos.length === 1 ) {
                    pos = rhorizontal.test( pos[ 0 ] ) ?
                        pos.concat( [ "center" ] ) :
                        rvertical.test( pos[ 0 ] ) ?
                            [ "center" ].concat( pos ) :
                            [ "center", "center" ];
                }
                pos[ 0 ] = rhorizontal.test( pos[ 0 ] ) ? pos[ 0 ] : "center";
                pos[ 1 ] = rvertical.test( pos[ 1 ] ) ? pos[ 1 ] : "center";

                // Calculate offsets
                horizontalOffset = roffset.exec( pos[ 0 ] );
                verticalOffset = roffset.exec( pos[ 1 ] );
                offsets[ this ] = [
                    horizontalOffset ? horizontalOffset[ 0 ] : 0,
                    verticalOffset ? verticalOffset[ 0 ] : 0
                ];

                // Reduce to just the positions without the offsets
                options[ this ] = [
                    rposition.exec( pos[ 0 ] )[ 0 ],
                    rposition.exec( pos[ 1 ] )[ 0 ]
                ];
            } );

            // Normalize collision option
            if ( collision.length === 1 ) {
                collision[ 1 ] = collision[ 0 ];
            }

            if ( options.at[ 0 ] === "right" ) {
                basePosition.left += targetWidth;
            } else if ( options.at[ 0 ] === "center" ) {
                basePosition.left += targetWidth / 2;
            }

            if ( options.at[ 1 ] === "bottom" ) {
                basePosition.top += targetHeight;
            } else if ( options.at[ 1 ] === "center" ) {
                basePosition.top += targetHeight / 2;
            }

            atOffset = getOffsets( offsets.at, targetWidth, targetHeight );
            basePosition.left += atOffset[ 0 ];
            basePosition.top += atOffset[ 1 ];

            return ( function(elem) {
                var collisionPosition, using,
                    msize = marginSize(elem),
                    elemWidth = msize.width,
                    elemHeight = msize.height,
                    marginLeft = parseCss( elem, "marginLeft" ),
                    marginTop = parseCss( elem, "marginTop" ),
                    collisionWidth = elemWidth + marginLeft + parseCss( elem, "marginRight" ) +
                        scrollInfo.width,
                    collisionHeight = elemHeight + marginTop + parseCss( elem, "marginBottom" ) +
                        scrollInfo.height,
                    position = langx.extend( {}, basePosition ),
                    myOffset = getOffsets( offsets.my, msize.width, msize.height);

                if ( options.my[ 0 ] === "right" ) {
                    position.left -= elemWidth;
                } else if ( options.my[ 0 ] === "center" ) {
                    position.left -= elemWidth / 2;
                }

                if ( options.my[ 1 ] === "bottom" ) {
                    position.top -= elemHeight;
                } else if ( options.my[ 1 ] === "center" ) {
                    position.top -= elemHeight / 2;
                }

                position.left += myOffset[ 0 ];
                position.top += myOffset[ 1 ];

                collisionPosition = {
                    marginLeft: marginLeft,
                    marginTop: marginTop
                };

                langx.each( [ "left", "top" ], function( i, dir ) {
                    if ( positions[ collision[ i ] ] ) {
                        positions[ collision[ i ] ][ dir ]( position, {
                            targetWidth: targetWidth,
                            targetHeight: targetHeight,
                            elemWidth: elemWidth,
                            elemHeight: elemHeight,
                            collisionPosition: collisionPosition,
                            collisionWidth: collisionWidth,
                            collisionHeight: collisionHeight,
                            offset: [ atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ] ],
                            my: options.my,
                            at: options.at,
                            within: within,
                            elem: elem
                        } );
                    }
                } );

                if ( options.using ) {

                    // Adds feedback as second argument to using callback, if present
                    using = function( props ) {
                        var left = targetOffset.left - position.left,
                            right = left + targetWidth - elemWidth,
                            top = targetOffset.top - position.top,
                            bottom = top + targetHeight - elemHeight,
                            feedback = {
                                target: {
                                    element: target,
                                    left: targetOffset.left,
                                    top: targetOffset.top,
                                    width: targetWidth,
                                    height: targetHeight
                                },
                                element: {
                                    element: elem,
                                    left: position.left,
                                    top: position.top,
                                    width: elemWidth,
                                    height: elemHeight
                                },
                                horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
                                vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
                            };
                        if ( targetWidth < elemWidth && abs( left + right ) < targetWidth ) {
                            feedback.horizontal = "center";
                        }
                        if ( targetHeight < elemHeight && abs( top + bottom ) < targetHeight ) {
                            feedback.vertical = "middle";
                        }
                        if ( max( abs( left ), abs( right ) ) > max( abs( top ), abs( bottom ) ) ) {
                            feedback.important = "horizontal";
                        } else {
                            feedback.important = "vertical";
                        }
                        options.using.call( this, props, feedback );
                    };
                }

                pagePosition(elem, langx.extend( position, { using: using } ));
            })(elm);
        }

        var positions = {
            fit: {
                left: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
                        outerWidth = within.width,
                        collisionPosLeft = position.left - data.collisionPosition.marginLeft,
                        overLeft = withinOffset - collisionPosLeft,
                        overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
                        newOverRight;

                    // Element is wider than within
                    if ( data.collisionWidth > outerWidth ) {

                        // Element is initially over the left side of within
                        if ( overLeft > 0 && overRight <= 0 ) {
                            newOverRight = position.left + overLeft + data.collisionWidth - outerWidth -
                                withinOffset;
                            position.left += overLeft - newOverRight;

                        // Element is initially over right side of within
                        } else if ( overRight > 0 && overLeft <= 0 ) {
                            position.left = withinOffset;

                        // Element is initially over both left and right sides of within
                        } else {
                            if ( overLeft > overRight ) {
                                position.left = withinOffset + outerWidth - data.collisionWidth;
                            } else {
                                position.left = withinOffset;
                            }
                        }

                    // Too far left -> align with left edge
                    } else if ( overLeft > 0 ) {
                        position.left += overLeft;

                    // Too far right -> align with right edge
                    } else if ( overRight > 0 ) {
                        position.left -= overRight;

                    // Adjust based on position and margin
                    } else {
                        position.left = max( position.left - collisionPosLeft, position.left );
                    }
                },
                top: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
                        outerHeight = data.within.height,
                        collisionPosTop = position.top - data.collisionPosition.marginTop,
                        overTop = withinOffset - collisionPosTop,
                        overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
                        newOverBottom;

                    // Element is taller than within
                    if ( data.collisionHeight > outerHeight ) {

                        // Element is initially over the top of within
                        if ( overTop > 0 && overBottom <= 0 ) {
                            newOverBottom = position.top + overTop + data.collisionHeight - outerHeight -
                                withinOffset;
                            position.top += overTop - newOverBottom;

                        // Element is initially over bottom of within
                        } else if ( overBottom > 0 && overTop <= 0 ) {
                            position.top = withinOffset;

                        // Element is initially over both top and bottom of within
                        } else {
                            if ( overTop > overBottom ) {
                                position.top = withinOffset + outerHeight - data.collisionHeight;
                            } else {
                                position.top = withinOffset;
                            }
                        }

                    // Too far up -> align with top
                    } else if ( overTop > 0 ) {
                        position.top += overTop;

                    // Too far down -> align with bottom edge
                    } else if ( overBottom > 0 ) {
                        position.top -= overBottom;

                    // Adjust based on position and margin
                    } else {
                        position.top = max( position.top - collisionPosTop, position.top );
                    }
                }
            },
            flip: {
                left: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.offset.left + within.scrollLeft,
                        outerWidth = within.width,
                        offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
                        collisionPosLeft = position.left - data.collisionPosition.marginLeft,
                        overLeft = collisionPosLeft - offsetLeft,
                        overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
                        myOffset = data.my[ 0 ] === "left" ?
                            -data.elemWidth :
                            data.my[ 0 ] === "right" ?
                                data.elemWidth :
                                0,
                        atOffset = data.at[ 0 ] === "left" ?
                            data.targetWidth :
                            data.at[ 0 ] === "right" ?
                                -data.targetWidth :
                                0,
                        offset = -2 * data.offset[ 0 ],
                        newOverRight,
                        newOverLeft;

                    if ( overLeft < 0 ) {
                        newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth -
                            outerWidth - withinOffset;
                        if ( newOverRight < 0 || newOverRight < abs( overLeft ) ) {
                            position.left += myOffset + atOffset + offset;
                        }
                    } else if ( overRight > 0 ) {
                        newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset +
                            atOffset + offset - offsetLeft;
                        if ( newOverLeft > 0 || abs( newOverLeft ) < overRight ) {
                            position.left += myOffset + atOffset + offset;
                        }
                    }
                },
                top: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.offset.top + within.scrollTop,
                        outerHeight = within.height,
                        offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
                        collisionPosTop = position.top - data.collisionPosition.marginTop,
                        overTop = collisionPosTop - offsetTop,
                        overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
                        top = data.my[ 1 ] === "top",
                        myOffset = top ?
                            -data.elemHeight :
                            data.my[ 1 ] === "bottom" ?
                                data.elemHeight :
                                0,
                        atOffset = data.at[ 1 ] === "top" ?
                            data.targetHeight :
                            data.at[ 1 ] === "bottom" ?
                                -data.targetHeight :
                                0,
                        offset = -2 * data.offset[ 1 ],
                        newOverTop,
                        newOverBottom;
                    if ( overTop < 0 ) {
                        newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight -
                            outerHeight - withinOffset;
                        if ( newOverBottom < 0 || newOverBottom < abs( overTop ) ) {
                            position.top += myOffset + atOffset + offset;
                        }
                    } else if ( overBottom > 0 ) {
                        newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset +
                            offset - offsetTop;
                        if ( newOverTop > 0 || abs( newOverTop ) < overBottom ) {
                            position.top += myOffset + atOffset + offset;
                        }
                    }
                }
            },
            flipfit: {
                left: function() {
                    positions.flip.left.apply( this, arguments );
                    positions.fit.left.apply( this, arguments );
                },
                top: function() {
                    positions.flip.top.apply( this, arguments );
                    positions.fit.top.apply( this, arguments );
                }
            }
        };

        geom.posit = posit;
    })();

    return dom.geom = geom;
});
define('skylark-utils-dom/fx',[
    "./dom",
    "./langx",
    "./browser",
    "./geom",
    "./styler",
    "./eventer"
], function(dom, langx, browser, geom, styler, eventer) {
    var animationName,
        animationDuration,
        animationTiming,
        animationDelay,
        transitionProperty,
        transitionDuration,
        transitionTiming,
        transitionDelay,

        animationEnd = browser.normalizeCssEvent('AnimationEnd'),
        transitionEnd = browser.normalizeCssEvent('TransitionEnd'),

        supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
        transform = browser.css3PropPrefix + "transform",
        cssReset = {};


    cssReset[animationName = browser.normalizeCssProperty("animation-name")] =
        cssReset[animationDuration = browser.normalizeCssProperty("animation-duration")] =
        cssReset[animationDelay = browser.normalizeCssProperty("animation-delay")] =
        cssReset[animationTiming = browser.normalizeCssProperty("animation-timing-function")] = "";

    cssReset[transitionProperty = browser.normalizeCssProperty("transition-property")] =
        cssReset[transitionDuration = browser.normalizeCssProperty("transition-duration")] =
        cssReset[transitionDelay = browser.normalizeCssProperty("transition-delay")] =
        cssReset[transitionTiming = browser.normalizeCssProperty("transition-timing-function")] = "";



    /*   
     * Perform a custom animation of a set of CSS properties.
     * @param {Object} elm  
     * @param {Number or String} properties
     * @param {String} ease
     * @param {Number or String} duration
     * @param {Function} callback
     * @param {Number or String} delay
     */
    function animate(elm, properties, duration, ease, callback, delay) {
        var key,
            cssValues = {},
            cssProperties = [],
            transforms = "",
            that = this,
            endEvent,
            wrappedCallback,
            fired = false,
            hasScrollTop = false,
            resetClipAuto = false;

        if (langx.isPlainObject(duration)) {
            ease = duration.easing;
            callback = duration.complete;
            delay = duration.delay;
            duration = duration.duration;
        }

        if (langx.isString(duration)) {
            duration = fx.speeds[duration];
        }
        if (duration === undefined) {
            duration = fx.speeds.normal;
        }
        duration = duration / 1000;
        if (fx.off) {
            duration = 0;
        }

        if (langx.isFunction(ease)) {
            callback = ease;
            eace = "swing";
        } else {
            ease = ease || "swing";
        }

        if (delay) {
            delay = delay / 1000;
        } else {
            delay = 0;
        }

        if (langx.isString(properties)) {
            // keyframe animation
            cssValues[animationName] = properties;
            cssValues[animationDuration] = duration + "s";
            cssValues[animationTiming] = ease;
            endEvent = animationEnd;
        } else {
            // CSS transitions
            for (key in properties) {
                var v = properties[key];
                if (supportedTransforms.test(key)) {
                    transforms += key + "(" + v + ") ";
                } else {
                    if (key === "scrollTop") {
                        hasScrollTop = true;
                    }
                    if (key == "clip" && langx.isPlainObject(v)) {
                        cssValues[key] = "rect(" + v.top+"px,"+ v.right +"px,"+ v.bottom +"px,"+ v.left+"px)";
                        if (styler.css(elm,"clip") == "auto") {
                            var size = geom.size(elm);
                            styler.css(elm,"clip","rect("+"0px,"+ size.width +"px,"+ size.height +"px,"+"0px)");  
                            resetClipAuto = true;
                        }

                    } else {
                        cssValues[key] = v;
                    }
                    cssProperties.push(langx.dasherize(key));
                }
            }
            endEvent = transitionEnd;
        }

        if (transforms) {
            cssValues[transform] = transforms;
            cssProperties.push(transform);
        }

        if (duration > 0 && langx.isPlainObject(properties)) {
            cssValues[transitionProperty] = cssProperties.join(", ");
            cssValues[transitionDuration] = duration + "s";
            cssValues[transitionDelay] = delay + "s";
            cssValues[transitionTiming] = ease;
        }

        wrappedCallback = function(event) {
            fired = true;
            if (event) {
                if (event.target !== event.currentTarget) {
                    return // makes sure the event didn't bubble from "below"
                }
                eventer.off(event.target, endEvent, wrappedCallback)
            } else {
                eventer.off(elm, animationEnd, wrappedCallback) // triggered by setTimeout
            }
            styler.css(elm, cssReset);
            if (resetClipAuto) {
 //               styler.css(elm,"clip","auto");
            }
            callback && callback.call(this);
        };

        if (duration > 0) {
            eventer.on(elm, endEvent, wrappedCallback);
            // transitionEnd is not always firing on older Android phones
            // so make sure it gets fired
            langx.debounce(function() {
                if (fired) {
                    return;
                }
                wrappedCallback.call(that);
            }, ((duration + delay) * 1000) + 25)();
        }

        // trigger page reflow so new elements can animate
        elm.clientLeft;

        styler.css(elm, cssValues);

        if (duration <= 0) {
            langx.debounce(function() {
                if (fired) {
                    return;
                }
                wrappedCallback.call(that);
            }, 0)();
        }

        if (hasScrollTop) {
            scrollToTop(elm, properties["scrollTop"], duration, callback);
        }

        return this;
    }

    /*   
     * Display an element.
     * @param {Object} elm  
     * @param {String} speed
     * @param {Function} callback
     */
    function show(elm, speed, callback) {
        styler.show(elm);
        if (speed) {
            if (!callback && langx.isFunction(speed)) {
                callback = speed;
                speed = "normal";
            }
            styler.css(elm, "opacity", 0)
            animate(elm, { opacity: 1, scale: "1,1" }, speed, callback);
        }
        return this;
    }


    /*   
     * Hide an element.
     * @param {Object} elm  
     * @param {String} speed
     * @param {Function} callback
     */
    function hide(elm, speed, callback) {
        if (speed) {
            if (!callback && langx.isFunction(speed)) {
                callback = speed;
                speed = "normal";
            }
            animate(elm, { opacity: 0, scale: "0,0" }, speed, function() {
                styler.hide(elm);
                if (callback) {
                    callback.call(elm);
                }
            });
        } else {
            styler.hide(elm);
        }
        return this;
    }

    /*   
     * Set the vertical position of the scroll bar for an element.
     * @param {Object} elm  
     * @param {Number or String} pos
     * @param {Number or String} speed
     * @param {Function} callback
     */
    function scrollToTop(elm, pos, speed, callback) {
        var scrollFrom = parseInt(elm.scrollTop),
            i = 0,
            runEvery = 5, // run every 5ms
            freq = speed * 1000 / runEvery,
            scrollTo = parseInt(pos);

        var interval = setInterval(function() {
            i++;

            if (i <= freq) elm.scrollTop = (scrollTo - scrollFrom) / freq * i + scrollFrom;

            if (i >= freq + 1) {
                clearInterval(interval);
                if (callback) langx.debounce(callback, 1000)();
            }
        }, runEvery);
    }

    /*   
     * Display or hide an element.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {Function} callback
     */
    function toggle(elm, speed, callback) {
        if (styler.isInvisible(elm)) {
            show(elm, speed, callback);
        } else {
            hide(elm, speed, callback);
        }
        return this;
    }

    /*   
     * Adjust the opacity of an element.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {Number or String} opacity
     * @param {String} easing
     * @param {Function} callback
     */
    function fadeTo(elm, speed, opacity, easing, callback) {
        animate(elm, { opacity: opacity }, speed, easing, callback);
        return this;
    }


    /*   
     * Display an element by fading them to opaque.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {String} easing
     * @param {Function} callback
     */
    function fadeIn(elm, speed, easing, callback) {
        var target = styler.css(elm, "opacity");
        if (target > 0) {
            styler.css(elm, "opacity", 0);
        } else {
            target = 1;
        }
        styler.show(elm);

        fadeTo(elm, speed, target, easing, callback);

        return this;
    }

    /*   
     * Hide an element by fading them to transparent.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {String} easing
     * @param {Function} callback
     */
    function fadeOut(elm, speed, easing, callback) {
        var _elm = elm,
            complete,
            opacity = styler.css(elm,"opacity"),
            options = {};

        if (langx.isPlainObject(speed)) {
            options.easing = speed.easing;
            options.duration = speed.duration;
            complete = speed.complete;
        } else {
            options.duration = speed;
            if (callback) {
                complete = callback;
                options.easing = easing;
            } else {
                complete = easing;
            }
        }
        options.complete = function() {
            styler.css(elm,"opacity",opacity);
            styler.hide(elm);
            if (complete) {
                complete.call(elm);
            }
        }

        fadeTo(elm, options, 0);

        return this;
    }

    /*   
     * Display or hide an element by animating its opacity.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {String} ceasing
     * @param {Function} callback
     */
    function fadeToggle(elm, speed, ceasing, allback) {
        if (styler.isInvisible(elm)) {
            fadeIn(elm, speed, easing, callback);
        } else {
            fadeOut(elm, speed, easing, callback);
        }
        return this;
    }

    /*   
     * Display an element with a sliding motion.
     * @param {Object} elm  
     * @param {Number or String} duration
     * @param {Function} callback
     */
    function slideDown(elm, duration, callback) {

        // get the element position to restore it then
        var position = styler.css(elm, 'position');

        // show element if it is hidden
        show(elm);

        // place it so it displays as usually but hidden
        styler.css(elm, {
            position: 'absolute',
            visibility: 'hidden'
        });

        // get naturally height, margin, padding
        var marginTop = styler.css(elm, 'margin-top');
        var marginBottom = styler.css(elm, 'margin-bottom');
        var paddingTop = styler.css(elm, 'padding-top');
        var paddingBottom = styler.css(elm, 'padding-bottom');
        var height = styler.css(elm, 'height');

        // set initial css for animation
        styler.css(elm, {
            position: position,
            visibility: 'visible',
            overflow: 'hidden',
            height: 0,
            marginTop: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0
        });

        // animate to gotten height, margin and padding
        animate(elm, {
            height: height,
            marginTop: marginTop,
            marginBottom: marginBottom,
            paddingTop: paddingTop,
            paddingBottom: paddingBottom
        }, {
            duration: duration,
            complete: function() {
                if (callback) {
                    callback.apply(elm);
                }
            }
        });

        return this;
    }

    /*   
     * Hide an element with a sliding motion.
     * @param {Object} elm  
     * @param {Number or String} duration
     * @param {Function} callback
     */
    function slideUp(elm, duration, callback) {
        // active the function only if the element is visible
        if (geom.height(elm) > 0) {

            // get the element position to restore it then
            var position = styler.css(elm, 'position');

            // get the element height, margin and padding to restore them then
            var height = styler.css(elm, 'height');
            var marginTop = styler.css(elm, 'margin-top');
            var marginBottom = styler.css(elm, 'margin-bottom');
            var paddingTop = styler.css(elm, 'padding-top');
            var paddingBottom = styler.css(elm, 'padding-bottom');

            // set initial css for animation
            styler.css(elm, {
                visibility: 'visible',
                overflow: 'hidden',
                height: height,
                marginTop: marginTop,
                marginBottom: marginBottom,
                paddingTop: paddingTop,
                paddingBottom: paddingBottom
            });

            // animate element height, margin and padding to zero
            animate(elm, {
                height: 0,
                marginTop: 0,
                marginBottom: 0,
                paddingTop: 0,
                paddingBottom: 0
            }, {
                // callback : restore the element position, height, margin and padding to original values
                duration: duration,
                queue: false,
                complete: function() {
                    hide(elm);
                    styler.css(elm, {
                        visibility: 'visible',
                        overflow: 'hidden',
                        height: height,
                        marginTop: marginTop,
                        marginBottom: marginBottom,
                        paddingTop: paddingTop,
                        paddingBottom: paddingBottom
                    });
                    if (callback) {
                        callback.apply(elm);
                    }
                }
            });
        }
        return this;
    }


    /*   
     * Display or hide an element with a sliding motion.
     * @param {Object} elm  
     * @param {Number or String} duration
     * @param {Function} callback
     */
    function slideToggle(elm, duration, callback) {

        // if the element is hidden, slideDown !
        if (geom.height(elm) == 0) {
            slideDown(elm, duration, callback);
        }
        // if the element is visible, slideUp !
        else {
            slideUp(elm, duration, callback);
        }
        return this;
    }

    function emulateTransitionEnd(elm,duration) {
        var called = false;
        eventer.one(elm,'transitionEnd', function () { 
            called = true;
        })
        var callback = function () { 
            if (!called) {
                eventer.trigger(elm,browser.support.transition.end) 
            }
        };
        setTimeout(callback, duration);
        
        return this;
    } 

    function fx() {
        return fx;
    }

    langx.mixin(fx, {
        off: false,

        speeds: {
            normal: 400,
            fast: 200,
            slow: 600
        },

        animate,
        emulateTransitionEnd,
        fadeIn,
        fadeOut,
        fadeTo,
        fadeToggle,
        hide,
        scrollToTop,

        slideDown,
        slideToggle,
        slideUp,
        show,
        toggle
    });

    return dom.fx = fx;
});
define('skylark-utils-dom/scripter',[
    "./dom",
    "./langx",
    "./noder",
    "./finder"
], function(dom, langx, noder, finder) {

    var head = document.getElementsByTagName('head')[0],
        scriptsByUrl = {},
        scriptElementsById = {},
        count = 0;

    var rscriptType = ( /^$|^module$|\/(?:java|ecma)script/i );

    function scripter() {
        return scripter;
    }


    var preservedScriptAttributes = {
        type: true,
        src: true,
        nonce: true,
        noModule: true
    };

    function evaluate(code,node, doc ) {
        doc = doc || document;

        var i, val,
            script = doc.createElement("script");

        script.text = code;
        if ( node ) {
            for ( i in preservedScriptAttributes ) {

                // Support: Firefox 64+, Edge 18+
                // Some browsers don't support the "nonce" property on scripts.
                // On the other hand, just using `getAttribute` is not enough as
                // the `nonce` attribute is reset to an empty string whenever it
                // becomes browsing-context connected.
                // See https://github.com/whatwg/html/issues/2369
                // See https://html.spec.whatwg.org/#nonce-attributes
                // The `node.getAttribute` check was added for the sake of
                // `jQuery.globalEval` so that it can fake a nonce-containing node
                // via an object.
                val = node[ i ] || node.getAttribute && node.getAttribute( i );
                if ( val ) {
                    script.setAttribute( i, val );
                }
            }
        }
        doc.head.appendChild( script ).parentNode.removeChild( script );

        return this;
    }

    langx.mixin(scripter, {
        /*
         * Load a script from a url into the document.
         * @param {} url
         * @param {} loadedCallback
         * @param {} errorCallback
         */
        loadJavaScript: function(url, loadedCallback, errorCallback) {
            var script = scriptsByUrl[url];
            if (!script) {
                script = scriptsByUrl[url] = {
                    state: 0, //0:unload,1:loaded,-1:loaderror
                    loadedCallbacks: [],
                    errorCallbacks: []
                }
            }

            script.loadedCallbacks.push(loadedCallback);
            script.errorCallbacks.push(errorCallback);

            if (script.state === 1) {
                script.node.onload();
            } else if (script.state === -1) {
                script.node.onerror();
            } else {
                var node = script.node = document.createElement("script"),
                    id = script.id = (count++);

                node.type = "text/javascript";
                node.async = false;
                node.defer = false;
                startTime = new Date().getTime();
                head.appendChild(node);

                node.onload = function() {
                        script.state = 1;

                        var callbacks = script.loadedCallbacks,
                            i = callbacks.length;

                        while (i--) {
                            callbacks[i]();
                        }
                        script.loadedCallbacks = [];
                        script.errorCallbacks = [];
                    },
                    node.onerror = function() {
                        script.state = -1;
                        var callbacks = script.errorCallbacks,
                            i = callbacks.length;

                        while (i--) {
                            callbacks[i]();
                        }
                        script.loadedCallbacks = [];
                        script.errorCallbacks = [];
                    };
                node.src = url;

                scriptElementsById[id] = node;
            }
            return script.id;
        },
        /*
         * Remove the specified script from the document.
         * @param {Number} id
         */
        deleteJavaScript: function(id) {
            var node = scriptElementsById[id];
            if (node) {
                var url = node.src;
                noder.remove(node);
                delete scriptElementsById[id];
                delete scriptsByUrl[url];
            }
        },

        evaluate : evaluate,

        html : function(node,value) {

            var result = noder.html(node,value);

            if (value !== undefined) {
                var scripts = node.querySelectorAll('script');

                for (var i =0; i<scripts.length; i++) {
                    var node1 = scripts[i];
                    if (rscriptType.test( node1.type || "" ) ) {
                      evaluate(node1.textContent,node1);
                    }
                }       
                return this;         
            } else {
                return result;
            }



        }
    });

    return dom.scripter = scripter;
});
define('skylark-utils-dom/query',[
    "./dom",
    "./langx",
    "./noder",
    "./datax",
    "./eventer",
    "./finder",
    "./geom",
    "./styler",
    "./fx",
    "./scripter"
], function(dom, langx, noder, datax, eventer, finder, geom, styler, fx,scripter) {
    var some = Array.prototype.some,
        push = Array.prototype.push,
        every = Array.prototype.every,
        concat = Array.prototype.concat,
        slice = Array.prototype.slice,
        map = Array.prototype.map,
        filter = Array.prototype.filter,
        forEach = Array.prototype.forEach,
        indexOf = Array.prototype.indexOf,
        sort = Array.prototype.sort,
        isQ;

    var rquickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/;

    var funcArg = langx.funcArg,
        isArrayLike = langx.isArrayLike,
        isString = langx.isString,
        uniq = langx.uniq,
        isFunction = langx.isFunction;

    var type = langx.type,
        isArray = langx.isArray,

        isWindow = langx.isWindow,

        isDocument = langx.isDocument,

        isObject = langx.isObject,

        isPlainObject = langx.isPlainObject,

        compact = langx.compact,

        flatten = langx.flatten,

        camelCase = langx.camelCase,

        dasherize = langx.dasherize,
        children = finder.children;

    function wrapper_map(func, context) {
        return function() {
            var self = this,
                params = slice.call(arguments);
            var result = langx.map(self, function(elem, idx) {
                return func.apply(context, [elem].concat(params));
            });
            return query(uniq(result));
        }
    }

    function wrapper_selector(func, context, last) {
        return function(selector) {
            var self = this,
                params = slice.call(arguments);
            var result = this.map(function(idx, elem) {
                // if (elem.nodeType == 1) {
                //if (elem.querySelector) {
                    return func.apply(context, last ? [elem] : [elem, selector]);
                //}
            });
            if (last && selector) {
                return result.filter(selector);
            } else {
                return result;
            }
        }
    }

    function wrapper_selector_until(func, context, last) {
        return function(util, selector) {
            var self = this,
                params = slice.call(arguments);
            //if (selector === undefined) { //TODO : needs confirm?
            //    selector = util;
            //    util = undefined;
            //}
            var result = this.map(function(idx, elem) {
                // if (elem.nodeType == 1) { // TODO
                //if (elem.querySelector) {
                    return func.apply(context, last ? [elem, util] : [elem, selector, util]);
                //}
            });
            if (last && selector) {
                return result.filter(selector);
            } else {
                return result;
            }
        }
    }


    function wrapper_every_act(func, context) {
        return function() {
            var self = this,
                params = slice.call(arguments);
            this.each(function(idx,node) {
                func.apply(context, [this].concat(params));
            });
            return self;
        }
    }

    function wrapper_every_act_firstArgFunc(func, context, oldValueFunc) {
        return function(arg1) {
            var self = this,
                params = slice.call(arguments);
            forEach.call(self, function(elem, idx) {
                var newArg1 = funcArg(elem, arg1, idx, oldValueFunc(elem));
                func.apply(context, [elem, arg1].concat(params.slice(1)));
            });
            return self;
        }
    }

    function wrapper_some_chk(func, context) {
        return function() {
            var self = this,
                params = slice.call(arguments);
            return some.call(self, function(elem) {
                return func.apply(context, [elem].concat(params));
            });
        }
    }

    function wrapper_name_value(func, context, oldValueFunc) {
        return function(name, value) {
            var self = this,
                params = slice.call(arguments);

            if (langx.isPlainObject(name) || langx.isDefined(value)) {
                forEach.call(self, function(elem, idx) {
                    var newValue;
                    if (oldValueFunc) {
                        newValue = funcArg(elem, value, idx, oldValueFunc(elem, name));
                    } else {
                        newValue = value
                    }
                    func.apply(context, [elem].concat(params));
                });
                return self;
            } else {
                if (self[0]) {
                    return func.apply(context, [self[0], name]);
                }
            }

        }
    }

    function wrapper_value(func, context, oldValueFunc) {
        return function(value) {
            var self = this;

            if (langx.isDefined(value)) {
                forEach.call(self, function(elem, idx) {
                    var newValue;
                    if (oldValueFunc) {
                        newValue = funcArg(elem, value, idx, oldValueFunc(elem));
                    } else {
                        newValue = value
                    }
                    func.apply(context, [elem, newValue]);
                });
                return self;
            } else {
                if (self[0]) {
                    return func.apply(context, [self[0]]);
                }
            }

        }
    }

    var NodeList = langx.klass({
        klassName: "SkNodeList",
        init: function(selector, context) {
            var self = this,
                match, nodes, node, props;

            if (selector) {
                self.context = context = context || noder.doc();

                if (isString(selector)) {
                    // a html string or a css selector is expected
                    self.selector = selector;

                    if (selector.charAt(0) === "<" && selector.charAt(selector.length - 1) === ">" && selector.length >= 3) {
                        match = [null, selector, null];
                    } else {
                        match = rquickExpr.exec(selector);
                    }

                    if (match) {
                        if (match[1]) {
                            // if selector is html
                            nodes = noder.createFragment(selector);

                            if (langx.isPlainObject(context)) {
                                props = context;
                            }

                        } else {
                            node = finder.byId(match[2], noder.ownerDoc(context));

                            if (node) {
                                // if selector is id
                                nodes = [node];
                            }

                        }
                    } else {
                        // if selector is css selector
                        if (langx.isString(context)) {
                            context = finder.find(context);
                        }

                        nodes = finder.descendants(context, selector);
                    }
                } else {
                    if (selector !== window && isArrayLike(selector)) {
                        // a dom node array is expected
                        nodes = selector;
                    } else {
                        // a dom node is expected
                        nodes = [selector];
                    }
                    //self.add(selector, false);
                }
            }


            if (nodes) {

                push.apply(self, nodes);

                if (props) {
                    for ( var name  in props ) {
                        // Properties of context are called as methods if possible
                        if ( langx.isFunction( this[ name ] ) ) {
                            this[ name ]( props[ name ] );
                        } else {
                            this.attr( name, props[ name ] );
                        }
                    }
                }
            }

            return self;
        }
    });

    var query = (function() {
        isQ = function(object) {
            return object instanceof NodeList;
        }
        init = function(selector, context) {
            return new NodeList(selector, context);
        }

        var $ = function(selector, context) {
            if (isFunction(selector)) {
                eventer.ready(function() {
                    selector($);
                });
            } else if (isQ(selector)) {
                return selector;
            } else {
                if (context && isQ(context) && isString(selector)) {
                    return context.find(selector);
                }
                return init(selector, context);
            }
        };

        $.fn = NodeList.prototype;
        langx.mixin($.fn, {
            // `map` and `slice` in the jQuery API work differently
            // from their array counterparts
            length : 0,

            map: function(fn) {
                return $(uniq(langx.map(this, function(el, i) {
                    return fn.call(el, i, el)
                })));
            },

            slice: function() {
                return $(slice.apply(this, arguments))
            },

            forEach: function() {
                return forEach.apply(this,arguments);
            },

            get: function(idx) {
                return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
            },

            indexOf: function() {
                return indexOf.apply(this,arguments);
            },

            sort : function() {
                return sort.apply(this,arguments);
            },

            toArray: function() {
                return slice.call(this);
            },

            size: function() {
                return this.length
            },

            //remove: wrapper_every_act(noder.remove, noder),
            remove : function(selector) {
                if (selector) {
                    return this.find(selector).remove();
                }
                this.each(function(i,node){
                    noder.remove(node);
                });
                return this;
            },

            each: function(callback) {
                langx.each(this, callback);
                return this;
            },

            filter: function(selector) {
                if (isFunction(selector)) return this.not(this.not(selector))
                return $(filter.call(this, function(element) {
                    return finder.matches(element, selector)
                }))
            },

            add: function(selector, context) {
                return $(uniq(this.toArray().concat($(selector, context).toArray())));
            },

            is: function(selector) {
                if (this.length > 0) {
                    var self = this;
                    if (langx.isString(selector)) {
                        return some.call(self,function(elem) {
                            return finder.matches(elem, selector);
                        });
                    } else if (langx.isArrayLike(selector)) {
                       return some.call(self,function(elem) {
                            return langx.inArray(elem, selector) > -1;
                        });
                    } else if (langx.isHtmlNode(selector)) {
                       return some.call(self,function(elem) {
                            return elem ==  selector;
                        });
                    }
                }
                return false;
            },
            
            not: function(selector) {
                var nodes = []
                if (isFunction(selector) && selector.call !== undefined)
                    this.each(function(idx,node) {
                        if (!selector.call(this, idx,node)) nodes.push(this)
                    })
                else {
                    var excludes = typeof selector == 'string' ? this.filter(selector) :
                        (isArrayLike(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
                    this.forEach(function(el) {
                        if (excludes.indexOf(el) < 0) nodes.push(el)
                    })
                }
                return $(nodes)
            },

            has: function(selector) {
                return this.filter(function() {
                    return isObject(selector) ?
                        noder.contains(this, selector) :
                        $(this).find(selector).size()
                })
            },

            eq: function(idx) {
                return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
            },

            first: function() {
                return this.eq(0);
            },

            last: function() {
                return this.eq(-1);
            },

            find: wrapper_selector(finder.descendants, finder),

            closest: wrapper_selector(finder.closest, finder),
            /*
                        closest: function(selector, context) {
                            var node = this[0],
                                collection = false
                            if (typeof selector == 'object') collection = $(selector)
                            while (node && !(collection ? collection.indexOf(node) >= 0 : finder.matches(node, selector)))
                                node = node !== context && !isDocument(node) && node.parentNode
                            return $(node)
                        },
            */


            parents: wrapper_selector(finder.ancestors, finder),

            parentsUntil: wrapper_selector_until(finder.ancestors, finder),


            parent: wrapper_selector(finder.parent, finder),

            children: wrapper_selector(finder.children, finder),

            contents: wrapper_map(noder.contents, noder),

            empty: wrapper_every_act(noder.empty, noder),

            // `pluck` is borrowed from Prototype.js
            pluck: function(property) {
                return langx.map(this, function(el) {
                    return el[property]
                })
            },

            pushStack : function(elms) {
                var ret = $(elms);
                ret.prevObject = this;
                return ret;
            },
            
            replaceWith: function(newContent) {
                return this.before(newContent).remove();
            },

            wrap: function(structure) {
                var func = isFunction(structure)
                if (this[0] && !func)
                    var dom = $(structure).get(0),
                        clone = dom.parentNode || this.length > 1

                return this.each(function(index,node) {
                    $(this).wrapAll(
                        func ? structure.call(this, index,node) :
                        clone ? dom.cloneNode(true) : dom
                    )
                })
            },

            wrapAll: function(wrappingElement) {
                if (this[0]) {
                    $(this[0]).before(wrappingElement = $(wrappingElement));
                    var children;
                    // drill down to the inmost element
                    while ((children = wrappingElement.children()).length) {
                        wrappingElement = children.first();
                    }
                    $(wrappingElement).append(this);
                }
                return this
            },

            wrapInner: function(wrappingElement) {
                var func = isFunction(wrappingElement)
                return this.each(function(index,node) {
                    var self = $(this),
                        contents = self.contents(),
                        dom = func ? wrappingElement.call(this, index,node) : wrappingElement
                    contents.length ? contents.wrapAll(dom) : self.append(dom)
                })
            },

            unwrap: function(selector) {
                if (this.parent().children().length === 0) {
                    // remove dom without text
                    this.parent(selector).not("body").each(function() {
                        $(this).replaceWith(document.createTextNode(this.childNodes[0].textContent));
                    });
                } else {
                    this.parent().each(function() {
                        $(this).replaceWith($(this).children())
                    });
                }
                return this
            },

            clone: function() {
                return this.map(function() {
                    return this.cloneNode(true)
                })
            },

            hide: wrapper_every_act(fx.hide, fx),

            toggle: function(setting) {
                return this.each(function() {
                    var el = $(this);
                    (setting === undefined ? el.css("display") == "none" : setting) ? el.show(): el.hide()
                })
            },

            prev: function(selector) {
                return $(this.pluck('previousElementSibling')).filter(selector || '*')
            },

            prevAll: wrapper_selector(finder.previousSiblings, finder),

            next: function(selector) {
                return $(this.pluck('nextElementSibling')).filter(selector || '*')
            },

            nextAll: wrapper_selector(finder.nextSiblings, finder),

            siblings: wrapper_selector(finder.siblings, finder),

            html: wrapper_value(scripter.html, scripter, scripter.html),

            text: wrapper_value(datax.text, datax, datax.text),

            attr: wrapper_name_value(datax.attr, datax, datax.attr),

            removeAttr: wrapper_every_act(datax.removeAttr, datax),

            prop: wrapper_name_value(datax.prop, datax, datax.prop),

            removeProp: wrapper_every_act(datax.removeProp, datax),

            data: wrapper_name_value(datax.data, datax, datax.data),

            removeData: wrapper_every_act(datax.removeData, datax),

            val: wrapper_value(datax.val, datax, datax.val),

            offset: wrapper_value(geom.pagePosition, geom, geom.pagePosition),

            style: wrapper_name_value(styler.css, styler),

            css: wrapper_name_value(styler.css, styler),

            index: function(elem) {
                if (elem) {
                    return this.indexOf($(elem)[0]);
                } else {
                    return this.parent().children().indexOf(this[0]);
                }
            },

            //hasClass(name)
            hasClass: wrapper_some_chk(styler.hasClass, styler),

            //addClass(name)
            addClass: wrapper_every_act_firstArgFunc(styler.addClass, styler, styler.className),

            //removeClass(name)
            removeClass: wrapper_every_act_firstArgFunc(styler.removeClass, styler, styler.className),

            //toogleClass(name,when)
            toggleClass: wrapper_every_act_firstArgFunc(styler.toggleClass, styler, styler.className),

            scrollTop: wrapper_value(geom.scrollTop, geom),

            scrollLeft: wrapper_value(geom.scrollLeft, geom),

            position: function(options) {
                if (!this.length) return

                if (options) {
                    if (options.of && options.of.length) {
                        options = langx.clone(options);
                        options.of = options.of[0];
                    }
                    return this.each( function() {
                        geom.posit(this,options);
                    });
                } else {
                    var elem = this[0];

                    return geom.relativePosition(elem);

                }             
            },

            offsetParent: wrapper_map(geom.offsetParent, geom)
        });

        // for now
        $.fn.detach = $.fn.remove;

        $.fn.hover = function(fnOver, fnOut) {
            return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
        };

        $.fn.size = wrapper_value(geom.size, geom);

        $.fn.width = wrapper_value(geom.width, geom, geom.width);

        $.fn.height = wrapper_value(geom.height, geom, geom.height);

        $.fn.clientSize = wrapper_value(geom.clientSize, geom.clientSize);

        ['width', 'height'].forEach(function(dimension) {
            var offset, Dimension = dimension.replace(/./, function(m) {
                return m[0].toUpperCase()
            });

            $.fn['outer' + Dimension] = function(margin, value) {
                if (arguments.length) {
                    if (typeof margin !== 'boolean') {
                        value = margin;
                        margin = false;
                    }
                } else {
                    margin = false;
                    value = undefined;
                }

                if (value === undefined) {
                    var el = this[0];
                    if (!el) {
                        return undefined;
                    }
                    var cb = geom.size(el);
                    if (margin) {
                        var me = geom.marginExtents(el);
                        cb.width = cb.width + me.left + me.right;
                        cb.height = cb.height + me.top + me.bottom;
                    }
                    return dimension === "width" ? cb.width : cb.height;
                } else {
                    return this.each(function(idx, el) {
                        var mb = {};
                        var me = geom.marginExtents(el);
                        if (dimension === "width") {
                            mb.width = value;
                            if (margin) {
                                mb.width = mb.width - me.left - me.right
                            }
                        } else {
                            mb.height = value;
                            if (margin) {
                                mb.height = mb.height - me.top - me.bottom;
                            }
                        }
                        geom.size(el, mb);
                    })

                }
            };
        })

        $.fn.innerWidth = wrapper_value(geom.clientWidth, geom, geom.clientWidth);

        $.fn.innerHeight = wrapper_value(geom.clientHeight, geom, geom.clientHeight);

        var traverseNode = noder.traverse;

        function wrapper_node_operation(func, context, oldValueFunc) {
            return function(html) {
                var argType, nodes = langx.map(arguments, function(arg) {
                    argType = type(arg)
                    return argType == "function" || argType == "object" || argType == "array" || arg == null ?
                        arg : noder.createFragment(arg)
                });
                if (nodes.length < 1) {
                    return this
                }
                this.each(function(idx) {
                    func.apply(context, [this, nodes, idx > 0]);
                });
                return this;
            }
        }


        $.fn.after = wrapper_node_operation(noder.after, noder);

        $.fn.prepend = wrapper_node_operation(noder.prepend, noder);

        $.fn.before = wrapper_node_operation(noder.before, noder);

        $.fn.append = wrapper_node_operation(noder.append, noder);


        langx.each( {
            appendTo: "append",
            prependTo: "prepend",
            insertBefore: "before",
            insertAfter: "after",
            replaceAll: "replaceWith"
        }, function( name, original ) {
            $.fn[ name ] = function( selector ) {
                var elems,
                    ret = [],
                    insert = $( selector ),
                    last = insert.length - 1,
                    i = 0;

                for ( ; i <= last; i++ ) {
                    elems = i === last ? this : this.clone( true );
                    $( insert[ i ] )[ original ]( elems );

                    // Support: Android <=4.0 only, PhantomJS 1 only
                    // .get() because push.apply(_, arraylike) throws on ancient WebKit
                    push.apply( ret, elems.get() );
                }

                return this.pushStack( ret );
            };
        } );

/*
        $.fn.insertAfter = function(html) {
            $(html).after(this);
            return this;
        };

        $.fn.insertBefore = function(html) {
            $(html).before(this);
            return this;
        };

        $.fn.appendTo = function(html) {
            $(html).append(this);
            return this;
        };

        $.fn.prependTo = function(html) {
            $(html).prepend(this);
            return this;
        };

        $.fn.replaceAll = function(selector) {
            $(selector).replaceWith(this);
            return this;
        };
*/
        return $;
    })();

    (function($) {
        $.fn.on = wrapper_every_act(eventer.on, eventer);

        $.fn.off = wrapper_every_act(eventer.off, eventer);

        $.fn.trigger = wrapper_every_act(eventer.trigger, eventer);

        ('focusin focusout focus blur load resize scroll unload click dblclick ' +
            'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
            'change select keydown keypress keyup error transitionEnd').split(' ').forEach(function(event) {
            $.fn[event] = function(data, callback) {
                return (0 in arguments) ?
                    this.on(event, data, callback) :
                    this.trigger(event)
            }
        });

        $.fn.one = function(event, selector, data, callback) {
            if (!langx.isString(selector) && !langx.isFunction(callback)) {
                callback = data;
                data = selector;
                selector = null;
            }

            if (langx.isFunction(data)) {
                callback = data;
                data = null;
            }

            return this.on(event, selector, data, callback, 1)
        };

        $.fn.animate = wrapper_every_act(fx.animate, fx);
        $.fn.emulateTransitionEnd = wrapper_every_act(fx.emulateTransitionEnd, fx);

        $.fn.show = wrapper_every_act(fx.show, fx);
        $.fn.hide = wrapper_every_act(fx.hide, fx);
        $.fn.toogle = wrapper_every_act(fx.toogle, fx);
        $.fn.fadeTo = wrapper_every_act(fx.fadeTo, fx);
        $.fn.fadeIn = wrapper_every_act(fx.fadeIn, fx);
        $.fn.fadeOut = wrapper_every_act(fx.fadeOut, fx);
        $.fn.fadeToggle = wrapper_every_act(fx.fadeToggle, fx);

        $.fn.slideDown = wrapper_every_act(fx.slideDown, fx);
        $.fn.slideToggle = wrapper_every_act(fx.slideToggle, fx);
        $.fn.slideUp = wrapper_every_act(fx.slideUp, fx);

        $.fn.scrollParent = function( includeHidden ) {
            var position = this.css( "position" ),
                excludeStaticParent = position === "absolute",
                overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
                scrollParent = this.parents().filter( function() {
                    var parent = $( this );
                    if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
                        return false;
                    }
                    return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) +
                        parent.css( "overflow-x" ) );
                } ).eq( 0 );

            return position === "fixed" || !scrollParent.length ?
                $( this[ 0 ].ownerDocument || document ) :
                scrollParent;
        };
    })(query);


    (function($) {
        $.fn.end = function() {
            return this.prevObject || $()
        }

        $.fn.andSelf = function() {
            return this.add(this.prevObject || $())
        }

        $.fn.addBack = function(selector) {
            if (this.prevObject) {
                if (selector) {
                    return this.add(this.prevObject.filter(selector));
                } else {
                    return this.add(this.prevObject);
                }
            } else {
                return this;
            }
        }

        'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings,prev,prevAll,next,nextAll'.split(',').forEach(function(property) {
            var fn = $.fn[property]
            $.fn[property] = function() {
                var ret = fn.apply(this, arguments)
                ret.prevObject = this
                return ret
            }
        })
    })(query);


    (function($) {
        $.fn.query = $.fn.find;

        $.fn.place = function(refNode, position) {
            // summary:
            //      places elements of this node list relative to the first element matched
            //      by queryOrNode. Returns the original NodeList. See: `dojo/dom-construct.place`
            // queryOrNode:
            //      may be a string representing any valid CSS3 selector or a DOM node.
            //      In the selector case, only the first matching element will be used
            //      for relative positioning.
            // position:
            //      can be one of:
            //
            //      -   "last" (default)
            //      -   "first"
            //      -   "before"
            //      -   "after"
            //      -   "only"
            //      -   "replace"
            //
            //      or an offset in the childNodes
            if (langx.isString(refNode)) {
                refNode = finder.descendant(refNode);
            } else if (isQ(refNode)) {
                refNode = refNode[0];
            }
            return this.each(function(i, node) {
                switch (position) {
                    case "before":
                        noder.before(refNode, node);
                        break;
                    case "after":
                        noder.after(refNode, node);
                        break;
                    case "replace":
                        noder.replace(refNode, node);
                        break;
                    case "only":
                        noder.empty(refNode);
                        noder.append(refNode, node);
                        break;
                    case "first":
                        noder.prepend(refNode, node);
                        break;
                        // else fallthrough...
                    default: // aka: last
                        noder.append(refNode, node);
                }
            });
        };

        $.fn.addContent = function(content, position) {
            if (content.template) {
                content = langx.substitute(content.template, content);
            }
            return this.append(content);
        };

        $.fn.replaceClass = function(newClass, oldClass) {
            this.removeClass(oldClass);
            this.addClass(newClass);
            return this;
        };

        $.fn.replaceClass = function(newClass, oldClass) {
            this.removeClass(oldClass);
            this.addClass(newClass);
            return this;
        };

        $.fn.disableSelection = ( function() {
            var eventType = "onselectstart" in document.createElement( "div" ) ?
                "selectstart" :
                "mousedown";

            return function() {
                return this.on( eventType + ".ui-disableSelection", function( event ) {
                    event.preventDefault();
                } );
            };
        } )();

        $.fn.enableSelection = function() {
            return this.off( ".ui-disableSelection" );
        };
       

    })(query);

    query.fn.plugin = function(name,options) {
        var args = slice.call( arguments, 1 ),
            self = this,
            returnValue = this;

        this.each(function(){
            returnValue = plugins.instantiate.apply(self,[this,name].concat(args));
        });
        return returnValue;
    };

    return dom.query = query;

});
define('skylark-jquery/core',[
	"skylark-langx/skylark",
	"skylark-langx/langx",
	"skylark-utils-dom/browser",
	"skylark-utils-dom/noder",
	"skylark-utils-dom/datax",
	"skylark-utils-dom/eventer",
	"skylark-utils-dom/finder",
	"skylark-utils-dom/fx",
	"skylark-utils-dom/styler",
	"skylark-utils-dom/query"
],function(skylark,langx,browser,noder,datax,eventer,finder,fx,styler,query){
	var filter = Array.prototype.filter,
		slice = Array.prototype.slice;

    (function($){
	    $.fn.jquery = '2.2.0';

	    $.browser = browser;
	    
	    $.camelCase = langx.camelCase;

		$.cleanData = function( elems ) {
			var elem,
				i = 0;

			for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
				datax.cleanData(elem);
			}
		};

		$.removeData = function(elm,name) {
			datax.removeData(elm,name);
		}
	
	    $.each = langx.each;

	    $.extend = langx.extend;

	    $.grep = function(elements, callback) {
	        return filter.call(elements, callback)
	    };

	    $.attr = function(elm,name) {
	    	return datax.attr(elm,name);
	    };

	    $.isArray = langx.isArray;
	    $.isEmptyObject = langx.isEmptyObject;
	    $.isFunction = langx.isFunction;
	    $.isWindow = langx.isWindow;
	    $.isPlainObject = langx.isPlainObject;
        $.isNumeric = langx.isNumber;

	    $.inArray = langx.inArray;

	    $.makeArray = langx.makeArray;
	    $.map = langx.map;  // The behavior is somewhat different from the original jquery.

	    $.noop = function() {
	    };

	    $.parseJSON = window.JSON.parse;

	    $.proxy = langx.proxy;

	    $.trim = langx.trim;
	    $.type = langx.type;

	    $.fn.extend = function(props) {
	        langx.mixin($.fn, props);
	    };

	    $.fn.serializeArray = function() {
	        var name, type, result = [],
	            add = function(value) {
	                if (value.forEach) return value.forEach(add)
	                result.push({ name: name, value: value })
	            }
	        if (this[0]) langx.each(this[0].elements, function(_, field) {
	            type = field.type, name = field.name
	            if (name && field.nodeName.toLowerCase() != 'fieldset' &&
	                !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
	                ((type != 'radio' && type != 'checkbox') || field.checked))
	                add($(field).val())
	        })
	        return result
	    };

	    $.fn.serialize = function() {
	        var result = []
	        this.serializeArray().forEach(function(elm) {
	            result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
	        })
	        return result.join('&')
	    };
    })(query);

    (function($){
        $.Event = function Event(src, props) {
            if (langx.isString(src)) {
            	var type = src;
            	return eventer.create(type, props);
	        }
            return eventer.proxy(src, props);
        };

        $.event = {};

	    $.event.special = eventer.special;

	    $.fn.submit = function(callback) {
	        if (0 in arguments) this.bind('submit', callback)
	        else if (this.length) {
	            var event = $.Event('submit')
	            this.eq(0).trigger(event)
	            if (!event.isDefaultPrevented()) this.get(0).submit()
	        }
	        return this
	    };

	    // event
	    $.fn.triggerHandler = $.fn.trigger;

	    $.fn.delegate = function(selector, event, callback) {
	        return this.on(event, selector, callback)
	    };

	    $.fn.undelegate = function(selector, event, callback) {
	        return this.off(event, selector, callback)
	    };

	    $.fn.live = function(event, callback) {
	        $(document.body).delegate(this.selector, event, callback)
	        return this
	    };

	    $.fn.die = function(event, callback) {
	        $(document.body).undelegate(this.selector, event, callback)
	        return this
	    };

	    $.fn.bind = function(event, selector, data, callback) {
	        return this.on(event, selector, data, callback)
	    };

	    $.fn.unbind = function(event, callback) {
	        return this.off(event, callback)
	    };

	    $.fn.ready = function(callback) {
	        eventer.ready(callback);
	        return this;
	    };

	    $.fn.stop = function() {
	        // todo
	        return this;
	    };

	    $.fn.moveto = function(x, y) {
	        return this.animate({
	            left: x + "px",
	            top: y + "px"
	        }, 0.4);

	    };

	    $.ready = eventer.ready;

	    $.on = eventer.on;

	    $.off = eventer.off;
    })(query);

    (function($){
	    // plugin compatibility
	    $.uuid = 0;
	    $.support = browser.support;
	    $.expr = {};

	    $.expr[":"] = $.expr.pseudos = $.expr.filters = finder.pseudos;

	    $.expr.createPseudo = function(fn) {
	    	return fn;
	    };

	    $.cssHooks = styler.cssHooks;

	    $.contains = noder.contains;

	    $.css = styler.css;

	    $.data = datax.data;

	    $.fx = fx;
	    $.fx.step = {

        };

        $.speed = function( speed, easing, fn ) {
            var opt = speed && typeof speed === "object" ? $.extend( {}, speed ) : {
                complete: fn || !fn && easing ||
                    $.isFunction( speed ) && speed,
                duration: speed,
                easing: fn && easing || easing && !$.isFunction( easing ) && easing
            };

            // Go to the end state if fx are off
            if ( $.fx.off ) {
                opt.duration = 0;

            } else {
                if ( typeof opt.duration !== "number" ) {
                    if ( opt.duration in $.fx.speeds ) {
                        opt.duration = $.fx.speeds[ opt.duration ];

                    } else {
                        opt.duration = $.fx.speeds._default;
                    }
                }
            }

            // Normalize opt.queue - true/undefined/null -> "fx"
            if ( opt.queue == null || opt.queue === true ) {
                opt.queue = "fx";
            }

            // Queueing
            opt.old = opt.complete;

            opt.complete = function() {
                if ( $.isFunction( opt.old ) ) {
                    opt.old.call( this );
                }

                if ( opt.queue ) {
                    $.dequeue( this, opt.queue );
                }
            };

            return opt;
        };

        $.easing = {};

	    $.offset = {};
	    $.offset.setOffset = function(elem, options, i) {
	        var position = $.css(elem, "position");

	        // set position first, in-case top/left are set even on static elem
	        if (position === "static") {
	            elem.style.position = "relative";
	        }

	        var curElem = $(elem),
	            curOffset = curElem.offset(),
	            curCSSTop = $.css(elem, "top"),
	            curCSSLeft = $.css(elem, "left"),
	            calculatePosition = (position === "absolute" || position === "fixed") && $.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
	            props = {},
	            curPosition = {},
	            curTop, curLeft;

	        // need to be able to calculate position if either top or left is auto and position is either absolute or fixed
	        if (calculatePosition) {
	            curPosition = curElem.position();
	            curTop = curPosition.top;
	            curLeft = curPosition.left;
	        } else {
	            curTop = parseFloat(curCSSTop) || 0;
	            curLeft = parseFloat(curCSSLeft) || 0;
	        }

	        if ($.isFunction(options)) {
	            options = options.call(elem, i, curOffset);
	        }

	        if (options.top != null) {
	            props.top = (options.top - curOffset.top) + curTop;
	        }
	        if (options.left != null) {
	            props.left = (options.left - curOffset.left) + curLeft;
	        }

	        if ("using" in options) {
	            options.using.call(elem, props);
	        } else {
	            curElem.css(props);
	        }
	    };

        $._data = function(elm,propName) {
            if (elm.hasAttribute) {
                return datax.data(elm,propName);
            } else {
                return {};
            }
        };

     	var t = $.fn.text;  
	    $.fn.text = function(v) {
	        var r = t.apply(this,arguments);
	        if (r === undefined) {
	            r = "";
	        }  
	        return r;
	    };       
        	    
    })(query);

    query.parseHTML = function(html) {
        return  noder.createFragment(html);
    };

    query.uniqueSort = query.unique = langx.uniq;

    query.skylark = skylark;

    return window.jQuery = window.$ = query;
});

define('skylark-jquery/ajax',[
    "./core",
    "skylark-langx/langx"
], function($,langx) {
    var jsonpID = 0;

     // Attach a bunch of functions for handling common AJAX events
    $.each( [
        "ajaxStart",
        "ajaxStop",
        "ajaxComplete",
        "ajaxError",
        "ajaxSuccess",
        "ajaxSend"
    ], function( i, type ) {
        $.fn[ type ] = function( fn ) {
            return this.on( type, fn );
        };
    } );
   

    function appendQuery(url, query) {
        if (query == '') return url
        return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }
    
    $.ajaxJSONP = function(options) {
        var deferred = new langx.Deferred();
        var _callbackName = options.jsonpCallback,
            callbackName = ($.isFunction(_callbackName) ?
                _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
            script = document.createElement('script'),
            originalCallback = window[callbackName],
            responseData,
            abort = function(errorType) {
                $(script).triggerHandler('error', errorType || 'abort')
            },
            xhr = { abort: abort },
            abortTimeout;

        for (var key in options.data) {
            options.url = appendQuery(options.url, key + "=" + options.data[key]);
        }
         
//        if (deferred) deferred.promise(xhr)

        $(script).on('load error', function(e, errorType) {
            clearTimeout(abortTimeout)
            $(script).off().remove()

            if (e.type == 'error' || !responseData) {
                deferred.reject(e);
            } else {
                deferred.resolve(responseData[0],200,xhr);
            }

            window[callbackName] = originalCallback
            if (responseData && $.isFunction(originalCallback))
                originalCallback(responseData[0])

            originalCallback = responseData = undefined
        })

        window[callbackName] = function() {
            responseData = arguments
        }

        script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
        document.head.appendChild(script)

        if (options.timeout > 0) abortTimeout = setTimeout(function() {
            abort('timeout')
        }, options.timeout)

        return deferred;
    }

    $.ajaxSettings = langx.Xhr.defaultOptions;

    $.ajaxSettings.xhr = function() {
        return new window.XMLHttpRequest()
    };

    $.ajax = function(url,options) {
        if (!url) {
            options = {
                url :  "./"
            };
        } else if (!options) {
            if (langx.isString(url)) {
                options = {
                    url :  url
                };
            } else {
                options = url;
            }
        } else {
            options.url = url;
        }

        if ('jsonp' == options.dataType) {
            var hasPlaceholder = /\?.+=\?/.test(options.url);

            if (!hasPlaceholder)
                options.url = appendQuery(options.url,
                    options.jsonp ? (options.jsonp + '=?') : options.jsonp === false ? '' : 'callback=?')
            return $.ajaxJSONP(options);
        }

        function ajaxSuccess(data,status,xhr) {
            $(document).trigger("ajaxSucess");
            if (options.success) {
                options.success.apply(this,arguments);
            }
            if (options.complete) {
                options.complete.apply(this,arguments);
            }
            return data;
        }

        function ajaxError() {
            $(document).trigger("ajaxError");
            if (options.error) {
                options.error.apply(this,arguments);
            }
        }

        var p = langx.Xhr.request(options.url,options);
        p = p.then(ajaxSuccess,ajaxError);
        p.success = p.done;
        p.error = p.fail;
        p.complete = p.always;
        
        return p;
    };

    // handle optional data/success arguments
    function parseArguments(url, data, success, dataType) {
        if ($.isFunction(url)) {
            dataType = data, success = url, data = undefined,url = undefined;
        } else if ($.isFunction(data)) {
            dataType = success, success = data, data = undefined;
        } 
        if (!$.isFunction(success)) dataType = success, success = undefined
        return {
            url: url,
            data: data,
            success: success,
            dataType: dataType
        }
    }

    $.get = function( /* url, data, success, dataType */ ) {
        return $.ajax(parseArguments.apply(null, arguments))
    }

    $.post = function( /* url, data, success, dataType */ ) {
        var options = parseArguments.apply(null, arguments)
        options.type = 'POST'
        return $.ajax(options)
    }

    $.getJSON = function( /* url, data, success */ ) {
        var options = parseArguments.apply(null, arguments)
        options.dataType = 'json'
        return $.ajax(options)
    }

    var originalLoad = $.fn.load;

    $.fn.load = function(url, data, success) {
        if ("string" != typeof url && originalLoad) {
            return originalLoad.apply(this, arguments);
        }
        if (!this.length) return this
        var self = this,
            options = parseArguments(url, data, success),
            parts = options.url && options.url.split(/\s/),
            selector,
            callback = options.success
        if (parts && parts.length > 1) options.url = parts[0], selector = parts[1]
        options.success = function(response) {
            self.html(selector ?
                $('<div>').html(response.replace(rscript, "")).find(selector) : response)
            callback && callback.apply(self, arguments)
        }
        $.ajax(options)
        return this
    }

    $.param = langx.Xhr.param;


    // Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
    function addToPrefiltersOrTransports(structure) {

        // dataTypeExpression is optional and defaults to "*"
        return function(dataTypeExpression, func) {

            if (typeof dataTypeExpression !== "string") {
                func = dataTypeExpression;
                dataTypeExpression = "*";
            }

            var dataType,
                i = 0,
                dataTypes = dataTypeExpression.toLowerCase().match(rnotwhite) || [];

            if (jQuery.isFunction(func)) {

                // For each dataType in the dataTypeExpression
                while ((dataType = dataTypes[i++])) {

                    // Prepend if requested
                    if (dataType[0] === "+") {
                        dataType = dataType.slice(1) || "*";
                        (structure[dataType] = structure[dataType] || []).unshift(func);

                        // Otherwise append
                    } else {
                        (structure[dataType] = structure[dataType] || []).push(func);
                    }
                }
            }
        };
    }

    var
        prefilters = {},
        transports = {},
        rnotwhite = (/\S+/g);

    $.ajaxPrefilter = addToPrefiltersOrTransports(prefilters);
    $.ajaxTransport = addToPrefiltersOrTransports(transports);
    $.ajaxSetup = function(target, settings) {
        langx.mixin(langx.Xhr.defaultOptions,target,settings);
    };

    $.getScript = function( url, callback ) {
        return $.get( url, undefined, callback, "script" );
    };

    return $;

});

define('skylark-jquery/callbacks',[
    "./core"
], function($) {

    //     This module is borrow from zepto.callback.js
    //     (c) 2010-2014 Thomas Fuchs
    //     Zepto.js may be freely distributed under the MIT license.

    // Create a collection of callbacks to be fired in a sequence, with configurable behaviour
    // Option flags:
    //   - once: Callbacks fired at most one time.
    //   - memory: Remember the most recent context and arguments
    //   - stopOnFalse: Cease iterating over callback list
    //   - unique: Permit adding at most one instance of the same callback
    $.Callbacks = function(options) {
        options = $.extend({}, options)

        var memory, // Last fire value (for non-forgettable lists)
            fired, // Flag to know if list was already fired
            firing, // Flag to know if list is currently firing
            firingStart, // First callback to fire (used internally by add and fireWith)
            firingLength, // End of the loop when firing
            firingIndex, // Index of currently firing callback (modified by remove if needed)
            list = [], // Actual callback list
            stack = !options.once && [], // Stack of fire calls for repeatable lists
            fire = function(data) {
                memory = options.memory && data
                fired = true
                firingIndex = firingStart || 0
                firingStart = 0
                firingLength = list.length
                firing = true
                for (; list && firingIndex < firingLength; ++firingIndex) {
                    if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
                        memory = false
                        break
                    }
                }
                firing = false
                if (list) {
                    if (stack) stack.length && fire(stack.shift())
                    else if (memory) list.length = 0
                    else Callbacks.disable()
                }
            },

            Callbacks = {
                add: function() {
                    if (list) {
                        var start = list.length,
                            add = function(args) {
                                $.each(args, function(_, arg) {
                                    if (typeof arg === "function") {
                                        if (!options.unique || !Callbacks.has(arg)) list.push(arg)
                                    } else if (arg && arg.length && typeof arg !== 'string') add(arg)
                                })
                            }
                        add(arguments)
                        if (firing) firingLength = list.length
                        else if (memory) {
                            firingStart = start
                            fire(memory)
                        }
                    }
                    return this
                },
                remove: function() {
                    if (list) {
                        $.each(arguments, function(_, arg) {
                            var index
                            while ((index = $.inArray(arg, list, index)) > -1) {
                                list.splice(index, 1)
                                // Handle firing indexes
                                if (firing) {
                                    if (index <= firingLength) --firingLength
                                    if (index <= firingIndex) --firingIndex
                                }
                            }
                        })
                    }
                    return this
                },
                has: function(fn) {
                    return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length))
                },
                empty: function() {
                    firingLength = list.length = 0
                    return this
                },
                disable: function() {
                    list = stack = memory = undefined
                    return this
                },
                disabled: function() {
                    return !list
                },
                lock: function() {
                    stack = undefined;
                    if (!memory) Callbacks.disable()
                    return this
                },
                locked: function() {
                    return !stack
                },
                fireWith: function(context, args) {
                    if (list && (!fired || stack)) {
                        args = args || []
                        args = [context, args.slice ? args.slice() : args]
                        if (firing) stack.push(args)
                        else fire(args)
                    }
                    return this
                },
                fire: function() {
                    return Callbacks.fireWith(this, arguments)
                },
                fired: function() {
                    return !!fired
                }
            }

        return Callbacks
    };

    return $;

});

define('skylark-jquery/deferred',[
    "./core",
    "skylark-langx/langx"
], function($,langx) {

    $.Deferred = function() {
        var d = new langx.Deferred(),
            ret = {
                promise : function() {
                    return d.promise;
                }
            };

        ["resolve","resolveWith","reject","rejectWith","notify","then","done","fail","progress"].forEach(function(name){
            ret[name] = function() {
              var ret2 =   d[name].apply(d,arguments);
              if (ret2 == d) {
                ret2 = ret;
              }
              return ret2;
            }
        });

        return ret;
    };
    
    $.when = function(){
        var p = langx.Deferred.all(langx.makeArray(arguments)),
            originThen = p.then;
        p.then = function(onResolved,onRejected) {
            var handler = function(results) {
                //results = results.map(function(result){
                //    return [result];
                //});
                return onResolved && onResolved.apply(null,results);
            };
            return originThen.call(p,handler,onRejected);
        };
        return p;
    };

    return $;

});

define('skylark-jquery/queue',[
    "skylark-langx/langx",
    "./core",
    "./callbacks"
], function(langx, $) {

 // jQuery Data object
  var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
      rmultiDash = /([A-Z])/g,
      expando = "Sky" + ( '1.0' + Math.random() ).replace( /\D/g, ""),
      optionsCache = {},
      core_rnotwhite = /\S+/g,
      core_deletedIds = [],
      core_push = core_deletedIds.push;

// Convert String-formatted options into Object-formatted ones and store in cache
  function createOptions( options ) {
    var object = optionsCache[ options ] = {};
    $.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
      object[ flag ] = true;
    });
    return object;
  }

  function isArraylike( obj ) {
    var length = obj.length,
        type = $.type( obj );

    if ( $.isWindow( obj ) ) {
      return false;
    }

    if ( obj.nodeType === 1 && length ) {
      return true;
    }

    return type === "array" || type !== "function" &&
        ( length === 0 ||
            typeof length === "number" && length > 0 && ( length - 1 ) in obj );
  }

  

  function Data() {
    // Support: Android < 4,
    // Old WebKit does not have Object.preventExtensions/freeze method,
    // return new empty object instead with no [[set]] accessor
    Object.defineProperty( this.cache = {}, 0, {
      get: function() {
        return {};
      }
    });

    this.expando = expando + Math.random();
  }

  Data.uid = 1;

  Data.accepts = function( owner ) {
    // Accepts only:
    //  - Node
    //    - Node.ELEMENT_NODE
    //    - Node.DOCUMENT_NODE
    //  - Object
    //    - Any
    return owner.nodeType ?
        owner.nodeType === 1 || owner.nodeType === 9 : true;
  };

  Data.prototype = {
    key: function( owner ) {
      // We can accept data for non-element nodes in modern browsers,
      // but we should not, see #8335.
      // Always return the key for a frozen object.
      if ( !Data.accepts( owner ) ) {
        return 0;
      }

      var descriptor = {},
      // Check if the owner object already has a cache key
          unlock = owner[ this.expando ];

      // If not, create one
      if ( !unlock ) {
        unlock = Data.uid++;

        // Secure it in a non-enumerable, non-writable property
        try {
          descriptor[ this.expando ] = { value: unlock };
          Object.defineProperties( owner, descriptor );

          // Support: Android < 4
          // Fallback to a less secure definition
        } catch ( e ) {
          descriptor[ this.expando ] = unlock;
          $.extend( owner, descriptor );
        }
      }

      // Ensure the cache object
      if ( !this.cache[ unlock ] ) {
        this.cache[ unlock ] = {};
      }

      return unlock;
    },
    set: function( owner, data, value ) {
      var prop,
      // There may be an unlock assigned to this node,
      // if there is no entry for this "owner", create one inline
      // and set the unlock as though an owner entry had always existed
          unlock = this.key( owner ),
          cache = this.cache[ unlock ];

      // Handle: [ owner, key, value ] args
      if ( typeof data === "string" ) {
        cache[ data ] = value;

        // Handle: [ owner, { properties } ] args
      } else {
        // Fresh assignments by object are shallow copied
        if ( $.isEmptyObject( cache ) ) {
          $.extend( this.cache[ unlock ], data );
          // Otherwise, copy the properties one-by-one to the cache object
        } else {
          for ( prop in data ) {
            cache[ prop ] = data[ prop ];
          }
        }
      }
      return cache;
    },
    get: function( owner, key ) {
      // Either a valid cache is found, or will be created.
      // New caches will be created and the unlock returned,
      // allowing direct access to the newly created
      // empty data object. A valid owner object must be provided.
      var cache = this.cache[ this.key( owner ) ];

      return key === undefined ?
          cache : cache[ key ];
    },
    access: function( owner, key, value ) {
      var stored;
      // In cases where either:
      //
      //   1. No key was specified
      //   2. A string key was specified, but no value provided
      //
      // Take the "read" path and allow the get method to determine
      // which value to return, respectively either:
      //
      //   1. The entire cache object
      //   2. The data stored at the key
      //
      if ( key === undefined ||
          ((key && typeof key === "string") && value === undefined) ) {

        stored = this.get( owner, key );

        return stored !== undefined ?
            stored : this.get( owner, $.camelCase(key) );
      }

      // [*]When the key is not a string, or both a key and value
      // are specified, set or extend (existing objects) with either:
      //
      //   1. An object of properties
      //   2. A key and value
      //
      this.set( owner, key, value );

      // Since the "set" path can have two possible entry points
      // return the expected data based on which path was taken[*]
      return value !== undefined ? value : key;
    },
    remove: function( owner, key ) {
      var i, name, camel,
          unlock = this.key( owner ),
          cache = this.cache[ unlock ];

      if ( key === undefined ) {
        this.cache[ unlock ] = {};

      } else {
        // Support array or space separated string of keys
        if ( $.isArray( key ) ) {
          // If "name" is an array of keys...
          // When data is initially created, via ("key", "val") signature,
          // keys will be converted to camelCase.
          // Since there is no way to tell _how_ a key was added, remove
          // both plain key and camelCase key. #12786
          // This will only penalize the array argument path.
          name = key.concat( key.map( $.camelCase ) );
        } else {
          camel = $.camelCase( key );
          // Try the string as a key before any manipulation
          if ( key in cache ) {
            name = [ key, camel ];
          } else {
            // If a key with the spaces exists, use it.
            // Otherwise, create an array by matching non-whitespace
            name = camel;
            name = name in cache ?
                [ name ] : ( name.match( core_rnotwhite ) || [] );
          }
        }

        i = name.length;
        while ( i-- ) {
          delete cache[ name[ i ] ];
        }
      }
    },
    hasData: function( owner ) {
      return !$.isEmptyObject(
          this.cache[ owner[ this.expando ] ] || {}
      );
    },
    discard: function( owner ) {
      if ( owner[ this.expando ] ) {
        delete this.cache[ owner[ this.expando ] ];
      }
    }
  };

  var data_priv = new Data();

  $.extend($, {
    queue: function( elem, type, data ) {
      var queue;

      if ( elem ) {
        type = ( type || "fx" ) + "queue";
        queue = data_priv.get( elem, type );

        // Speed up dequeue by getting out quickly if this is just a lookup
        if ( data ) {
          if ( !queue || $.isArray( data ) ) {
            queue = data_priv.access( elem, type, $.makeArray(data) );
          } else {
            queue.push( data );
          }
        }
        return queue || [];
      }
    },

    dequeue: function( elem, type ) {
      type = type || "fx";

      var queue = $.queue( elem, type ),
          startLength = queue.length,
          fn = queue.shift(),
          hooks = $._queueHooks( elem, type ),
          next = function() {
            $.dequeue( elem, type );
          };

      // If the fx queue is dequeued, always remove the progress sentinel
      if ( fn === "inprogress" ) {
        fn = queue.shift();
        startLength--;
      }

      if ( fn ) {

        // Add a progress sentinel to prevent the fx queue from being
        // automatically dequeued
        if ( type === "fx" ) {
          queue.unshift( "inprogress" );
        }

        // clear up the last queue stop function
        delete hooks.stop;
        fn.call( elem, next, hooks );
      }

      if ( !startLength && hooks ) {
        hooks.empty.fire();
      }
    },

    // not intended for public consumption - generates a queueHooks object, or returns the current one
    _queueHooks: function( elem, type ) {
      var key = type + "queueHooks";
      return data_priv.get( elem, key ) || data_priv.access( elem, key, {
        empty: $.Callbacks("once memory").add(function() {
          data_priv.remove( elem, [ type + "queue", key ] );
        })
      });
    },

    // array operations
    makeArray: function( arr, results ) {
      var ret = results || [];

      if ( arr != null ) {
        if ( isArraylike( Object(arr) ) ) {
          $.merge( ret,
              typeof arr === "string" ?
                  [ arr ] : arr
          );
        } else {
          core_push.call( ret, arr );
        }
      }

      return ret;
    },
    merge: function( first, second ) {
      var l = second.length,
          i = first.length,
          j = 0;

      if ( typeof l === "number" ) {
        for ( ; j < l; j++ ) {
          first[ i++ ] = second[ j ];
        }
      } else {
        while ( second[j] !== undefined ) {
          first[ i++ ] = second[ j++ ];
        }
      }

      first.length = i;

      return first;
    }
  });

  $.extend($.fn, {
    queue: function( type, data ) {
      var setter = 2;

      if ( typeof type !== "string" ) {
        data = type;
        type = "fx";
        setter--;
      }

      if ( arguments.length < setter ) {
        return $.queue( this[0], type );
      }

      return data === undefined ?
          this :
          this.each(function() {
            var queue = $.queue( this, type, data );

            // ensure a hooks for this queue
            $._queueHooks( this, type );

            if ( type === "fx" && queue[0] !== "inprogress" ) {
              $.dequeue( this, type );
            }
          });
    },
    dequeue: function( type ) {
      return this.each(function() {
        $.dequeue( this, type );
      });
    },
    // Based off of the plugin by Clint Helfers, with permission.
    // http://blindsignals.com/index.php/2009/07/jquery-delay/
    delay: function( time, type ) {
      time = $.fx ? $.fx.speeds[ time ] || time : time;
      type = type || "fx";

      return this.queue( type, function( next, hooks ) {
        var timeout = setTimeout( next, time );
        hooks.stop = function() {
          clearTimeout( timeout );
        };
      });
    },
    clearQueue: function( type ) {
      return this.queue( type || "fx", [] );
    },
    // Get a promise resolved when queues of a certain type
    // are emptied (fx is the type by default)
    promise: function( type, obj ) {
      var tmp,
          count = 1,
          defer = $.Deferred(),
          elements = this,
          i = this.length,
          resolve = function() {
            if ( !( --count ) ) {
              defer.resolveWith( elements, [ elements ] );
            }
          };

      if ( typeof type !== "string" ) {
        obj = type;
        type = undefined;
      }
      type = type || "fx";

      while( i-- ) {
        tmp = data_priv.get( elements[ i ], type + "queueHooks" );
        if ( tmp && tmp.empty ) {
          count++;
          tmp.empty.add( resolve );
        }
      }
      resolve();
      return defer.promise( obj );
    }
  });

  return $;

});

define('skylark-utils-dom/elmx',[
    "./dom",
    "./langx",
    "./datax",
    "./eventer",
    "./finder",
    "./fx",
    "./geom",
    "./noder",
    "./styler",
    "./query"
], function(dom, langx, datax, eventer, finder, fx, geom, noder, styler,$) {
    var map = Array.prototype.map,
        slice = Array.prototype.slice;
    /*
     * VisualElement is a skylark class type wrapping a visule dom node,
     * provides a number of prototype methods and supports chain calls.
     */
    var VisualElement = langx.klass({
        klassName: "VisualElement",

        "_construct": function(node) {
            if (langx.isString(node)) {
                if (node.charAt(0) === "<") {
                    //html
                    node = noder.createFragment(node)[0];
                } else {
                    // id
                    node = document.getElementById(node);
                }
            }
            this._elm = node;
        }
    });

    VisualElement.prototype.$ = VisualElement.prototype.query = function(selector) {
        return $(selector,this._elm);
    };

    VisualElement.prototype.elm = function() {
        return this._elm;
    };

    /*
     * the VisualElement object wrapping document.body
     */
    var root = new VisualElement(document.body),
        elmx = function(node) {
            if (node) {
                return new VisualElement(node);
            } else {
                return root;
            }
        };
    /*
     * Extend VisualElement prototype with wrapping the specified methods.
     * @param {ArrayLike} fn
     * @param {Object} context
     */
    function _delegator(fn, context) {
        return function() {
            var self = this,
                elem = self._elm,
                ret = fn.apply(context, [elem].concat(slice.call(arguments)));

            if (ret) {
                if (ret === context) {
                    return self;
                } else {
                    if (ret instanceof HTMLElement) {
                        ret = new VisualElement(ret);
                    } else if (langx.isArrayLike(ret)) {
                        ret = map.call(ret, function(el) {
                            if (el instanceof HTMLElement) {
                                return new VisualElement(el);
                            } else {
                                return el;
                            }
                        })
                    }
                }
            }
            return ret;
        };
    }

    langx.mixin(elmx, {
        batch: function(nodes, action, args) {
            nodes.forEach(function(node) {
                var elm = (node instanceof VisualElement) ? node : elmx(node);
                elm[action].apply(elm, args);
            });

            return this;
        },

        root: new VisualElement(document.body),

        VisualElement: VisualElement,

        partial: function(name, fn) {
            var props = {};

            props[name] = fn;

            VisualElement.partial(props);
        },

        delegate: function(names, context) {
            var props = {};

            names.forEach(function(name) {
                props[name] = _delegator(context[name], context);
            });

            VisualElement.partial(props);
        }
    });

    // from ./datax
    elmx.delegate([
        "attr",
        "data",
        "prop",
        "removeAttr",
        "removeData",
        "text",
        "val"
    ], datax);

    // from ./eventer
    elmx.delegate([
        "off",
        "on",
        "one",
        "shortcuts",
        "trigger"
    ], eventer);

    // from ./finder
    elmx.delegate([
        "ancestor",
        "ancestors",
        "children",
        "descendant",
        "find",
        "findAll",
        "firstChild",
        "lastChild",
        "matches",
        "nextSibling",
        "nextSiblings",
        "parent",
        "previousSibling",
        "previousSiblings",
        "siblings"
    ], finder);

    /*
     * find a dom element matched by the specified selector.
     * @param {String} selector
     */
    elmx.find = function(selector) {
        if (selector === "body") {
            return this.root;
        } else {
            return this.root.descendant(selector);
        }
    };

    // from ./fx
    elmx.delegate([
        "animate",
        "fadeIn",
        "fadeOut",
        "fadeTo",
        "fadeToggle",
        "hide",
        "scrollToTop",
        "show",
        "toggle"
    ], fx);


    // from ./geom
    elmx.delegate([
        "borderExtents",
        "boundingPosition",
        "boundingRect",
        "clientHeight",
        "clientSize",
        "clientWidth",
        "contentRect",
        "height",
        "marginExtents",
        "offsetParent",
        "paddingExtents",
        "pagePosition",
        "pageRect",
        "relativePosition",
        "relativeRect",
        "scrollIntoView",
        "scrollLeft",
        "scrollTop",
        "size",
        "width"
    ], geom);

    // from ./noder
    elmx.delegate([
        "after",
        "append",
        "before",
        "clone",
        "contains",
        "contents",
        "empty",
        "html",
        "isChildOf",
        "isDocument",
        "isInDocument",
        "isWindow",
        "ownerDoc",
        "prepend",
        "remove",
        "removeChild",
        "replace",
        "reverse",
        "throb",
        "traverse",
        "wrapper",
        "wrapperInner",
        "unwrap"
    ], noder);

    // from ./styler
    elmx.delegate([
        "addClass",
        "className",
        "css",
        "hasClass",
        "hide",
        "isInvisible",
        "removeClass",
        "show",
        "toggleClass"
    ], styler);

    // properties

    var properties = [ 'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'border', 'borderLeft',
    'borderTop', 'borderRight', 'borderBottom', 'borderColor', 'display', 'overflow', 'margin', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding', 'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'color',
    'background', 'backgroundColor', 'opacity', 'fontSize', 'fontWeight', 'textAlign', 'textDecoration', 'textTransform', 'cursor', 'zIndex' ];

    properties.forEach( function ( property ) {

        var method = property;

        VisualElement.prototype[method ] = function (value) {

            this.css( property, value );

            return this;

        };

    });

    // events
    var events = [ 'keyUp', 'keyDown', 'mouseOver', 'mouseOut', 'click', 'dblClick', 'change' ];

    events.forEach( function ( event ) {

        var method = event;

        VisualElement.prototype[method ] = function ( callback ) {

            this.on( event.toLowerCase(), callback);

            return this;
        };

    });


    return dom.elmx = elmx;
});
define('skylark-utils-dom/plugins',[
    "./dom",
    "./langx",
    "./noder",
    "./datax",
    "./eventer",
    "./finder",
    "./geom",
    "./styler",
    "./fx",
    "./query",
    "./elmx"
], function(dom, langx, noder, datax, eventer, finder, geom, styler, fx, $, elmx) {
    "use strict";

    var slice = Array.prototype.slice,
        concat = Array.prototype.concat,
        pluginKlasses = {},
        shortcuts = {};

    /*
     * Create or get or destory a plugin instance assocated with the element.
     */
    function instantiate(elm,pluginName,options) {
        var pair = pluginName.split(":"),
            instanceDataName = pair[1];
        pluginName = pair[0];

        if (!instanceDataName) {
            instanceDataName = pluginName;
        }

        var pluginInstance = datax.data( elm, instanceDataName );

        if (options === "instance") {
            return pluginInstance;
        } else if (options === "destroy") {
            if (!pluginInstance) {
                throw new Error ("The plugin instance is not existed");
            }
            pluginInstance.destroy();
            datax.removeData( elm, pluginName);
            pluginInstance = undefined;
        } else {
            if (!pluginInstance) {
                if (options !== undefined && typeof options !== "object") {
                    throw new Error ("The options must be a plain object");
                }
                var pluginKlass = pluginKlasses[pluginName]; 
                pluginInstance = new pluginKlass(elm,options);
                datax.data( elm, instanceDataName,pluginInstance );
            } else if (options) {
                pluginInstance.reset(options);
            }
        }

        return pluginInstance;
    }

    function shortcutter(pluginName,extfn) {
       /*
        * Create or get or destory a plugin instance assocated with the element,
        * and also you can execute the plugin method directory;
        */
        return function (elm,options) {
            var  plugin = instantiate(elm, pluginName,"instance");
            if ( options === "instance" ) {
              return plugin || null;
            }
            if (!plugin) {
                plugin = instantiate(elm, pluginName,typeof options == 'object' && options || {});
            }

            if (options) {
                var args = slice.call(arguments,1); //2
                if (extfn) {
                    return extfn.apply(plugin,args);
                } else {
                    if (typeof options == 'string') {
                        var methodName = options;

                        if ( !plugin ) {
                            throw new Error( "cannot call methods on " + pluginName +
                                " prior to initialization; " +
                                "attempted to call method '" + methodName + "'" );
                        }

                        if ( !langx.isFunction( plugin[ methodName ] ) || methodName.charAt( 0 ) === "_" ) {
                            throw new Error( "no such method '" + methodName + "' for " + pluginName +
                                " plugin instance" );
                        }

                        return plugin[methodName].apply(plugin,args);
                    }                
                }                
            }

        }

    }

    /*
     * Register a plugin type
     */
    function register( pluginKlass,shortcutName,instanceDataName,extfn) {
        var pluginName = pluginKlass.prototype.pluginName;
        
        pluginKlasses[pluginName] = pluginKlass;

        if (shortcutName) {
            if (instanceDataName && langx.isFunction(instanceDataName)) {
                extfn = instanceDataName;
                instanceDataName = null;
            } 
            if (instanceDataName) {
                pluginName = pluginName + ":" + instanceDataName;
            }

            var shortcut = shortcuts[shortcutName] = shortcutter(pluginName,extfn);
                
            $.fn[shortcutName] = function(options) {
                var returnValue = this;

                if ( !this.length && options === "instance" ) {
                  returnValue = undefined;
                } else {
                  var args = slice.call(arguments);
                  this.each(function () {
                    var args2 = slice.call(args);
                    args2.unshift(this);
                    var  ret  = shortcut.apply(null,args2);
                    if (ret !== undefined) {
                        returnValue = ret;
                        return false;
                    }
                  });
                }

                return returnValue;
            };

            elmx.partial(shortcutName,function(options) {
                var  ret  = shortcut(this._elm,options);
                if (ret === undefined) {
                    ret = this;
                }
                return ret;
            });

        }
    }

 
    var Plugin =   langx.Evented.inherit({
        klassName: "Plugin",

        _construct : function(elm,options) {
           this._elm = elm;
           this._initOptions(options);
        },

        _initOptions : function(options) {
          var ctor = this.constructor,
              cache = ctor.cache = ctor.cache || {},
              defaults = cache.defaults;
          if (!defaults) {
            var  ctors = [];
            do {
              ctors.unshift(ctor);
              if (ctor === Plugin) {
                break;
              }
              ctor = ctor.superclass;
            } while (ctor);

            defaults = cache.defaults = {};
            for (var i=0;i<ctors.length;i++) {
              ctor = ctors[i];
              if (ctor.prototype.hasOwnProperty("options")) {
                langx.mixin(defaults,ctor.prototype.options);
              }
              if (ctor.hasOwnProperty("options")) {
                langx.mixin(defaults,ctor.options);
              }
            }
          }
          Object.defineProperty(this,"options",{
            value :langx.mixin({},defaults,options)
          });

          //return this.options = langx.mixin({},defaults,options);
          return this.options;
        },


        destroy: function() {
            var that = this;

            this._destroy();
            // We can probably remove the unbind calls in 2.0
            // all event bindings should go through this._on()
            datax.removeData(this._elm,this.pluginName );
        },

        _destroy: langx.noop,

        _delay: function( handler, delay ) {
            function handlerProxy() {
                return ( typeof handler === "string" ? instance[ handler ] : handler )
                    .apply( instance, arguments );
            }
            var instance = this;
            return setTimeout( handlerProxy, delay || 0 );
        },

        option: function( key, value ) {
            var options = key;
            var parts;
            var curOption;
            var i;

            if ( arguments.length === 0 ) {

                // Don't return a reference to the internal hash
                return langx.mixin( {}, this.options );
            }

            if ( typeof key === "string" ) {

                // Handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
                options = {};
                parts = key.split( "." );
                key = parts.shift();
                if ( parts.length ) {
                    curOption = options[ key ] = langx.mixin( {}, this.options[ key ] );
                    for ( i = 0; i < parts.length - 1; i++ ) {
                        curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
                        curOption = curOption[ parts[ i ] ];
                    }
                    key = parts.pop();
                    if ( arguments.length === 1 ) {
                        return curOption[ key ] === undefined ? null : curOption[ key ];
                    }
                    curOption[ key ] = value;
                } else {
                    if ( arguments.length === 1 ) {
                        return this.options[ key ] === undefined ? null : this.options[ key ];
                    }
                    options[ key ] = value;
                }
            }

            this._setOptions( options );

            return this;
        },

        _setOptions: function( options ) {
            var key;

            for ( key in options ) {
                this._setOption( key, options[ key ] );
            }

            return this;
        },

        _setOption: function( key, value ) {

            this.options[ key ] = value;

            return this;
        },

        elm : function() {
            return this._elm;
        }

    });

    $.fn.plugin = function(name,options) {
        var args = slice.call( arguments, 1 ),
            self = this,
            returnValue = this;

        this.each(function(){
            returnValue = instantiate.apply(self,[this,name].concat(args));
        });
        return returnValue;
    };

    elmx.partial("plugin",function(name,options) {
        var args = slice.call( arguments, 1 );
        return instantiate.apply(this,[this.domNode,name].concat(args));
    }); 


    function plugins() {
        return plugins;
    }
     
    langx.mixin(plugins, {
        instantiate,
        Plugin,
        register,
        shortcuts
    });

    return plugins;
});
define('skylark-jquery/JqueryPlugin',[
	"skylark-langx/types",
	"skylark-langx/objects",
	"skylark-langx/arrays",
	"skylark-langx/langx",
	"skylark-utils-dom/datax",
	"skylark-utils-dom/eventer",
	"skylark-utils-dom/plugins",
	"skylark-utils-dom/query",
],function(types, objects, arrays, langx, datax, eventer, plugins, $){

    var pluginUuid = 0;

	var JqPlugin = plugins.Plugin.inherit({
		klassName : "JqPlugin",

        pluginEventPrefix: "",

        options: {
            // Callbacks
            create: null
        },

        destroy: function() {
            this.overrided();

            // We can probably remove the unbind calls in 2.0
            // all event bindings should go through this._on()
            this.element
                .off( this.eventNamespace );

            // Clean up events and states
            this.bindings.off( this.eventNamespace );
        },

        _construct : function(element,options) {
            //this.options = langx.mixin( {}, this.options );

            element = $( element || this.defaultElement || this )[ 0 ];

            this.overrided(element,options);
            
            this.element = $( element );
            this.uuid = pluginUuid++;
            this.eventNamespace = "." + this.pluginName + this.uuid;

            this.bindings = $();
            this.classesElementLookup = {};

			this.hoverable = $();
			this.focusable = $();

            if ( element !== this ) {
                datax.data( element, this.pluginName, this );
                this._on( true, this.element, {
                    remove: function( event ) {
                        if ( event.target === element ) {
                            this.destroy();
                        }
                    }
                } );
                this.document = $( element.style ?

                    // Element within the document
                    element.ownerDocument :

                    // Element is window or document
                    element.document || element );
                this.window = $( this.document[ 0 ].defaultView || this.document[ 0 ].parentWindow );
            }

//            this.options = langx.mixin( {},
//                this.options,
//                this._getCreateOptions(),
//                options );

            this._create();

            this._trigger( "create", null, this._getCreateEventData() );

            this._init();
        },

//        _getCreateOptions: function() {
//            return {};
//        },

        _getCreateEventData: langx.noop,

        _create: langx.noop,

        _init: langx.noop,

		_classes: function( options ) {
			var full = [];
			var that = this;

			options = objects.mixin( {
				element: this.element,
				classes: this.options.classes || {}
			}, options );


			function bindRemoveEvent() {
				options.element.each( function( _, element ) {
					var isTracked = langx.map( that.classesElementLookup, function( elements ) {
						return elements;
					} )
						.some( function(elements ) {
							return $(elements).is( element );
						} );

					if ( !isTracked ) {
						that._on( $( element ), {
							remove: "_untrackClassesElement"
						} );
					}
				} );
			}

			function processClassString( classes, checkOption ) {
				var current, i;
				for ( i = 0; i < classes.length; i++ ) {
					current = that.classesElementLookup[ classes[ i ] ] || $();
					if ( options.add ) {
						bindRemoveEvent();
						current = $( langx.uniq( current.get().concat( options.element.get() ) ) );
					} else {
						current = $( current.not( options.element ).get() );
					}
					that.classesElementLookup[ classes[ i ] ] = current;
					full.push( classes[ i ] );
					if ( checkOption && options.classes[ classes[ i ] ] ) {
						full.push( options.classes[ classes[ i ] ] );
					}
				}
			}

			if ( options.keys ) {
				processClassString( options.keys.match( /\S+/g ) || [], true );
			}
			if ( options.extra ) {
				processClassString( options.extra.match( /\S+/g ) || [] );
			}

			return full.join( " " );
		},

		_untrackClassesElement: function( event ) {
			var that = this;
			langx.each( that.classesElementLookup, function( key, value ) {
				if ( arrays.inArray( event.target, value ) !== -1 ) {
					that.classesElementLookup[ key ] = $( value.not( event.target ).get() );
				}
			} );

			this._off( $( event.target ) );
		},

		_removeClass: function( element, keys, extra ) {
			return this._toggleClass( element, keys, extra, false );
		},

		_addClass: function( element, keys, extra ) {
			return this._toggleClass( element, keys, extra, true );
		},

		_toggleClass: function( element, keys, extra, add ) {
			add = ( typeof add === "boolean" ) ? add : extra;
			var shift = ( typeof element === "string" || element === null ),
				options = {
					extra: shift ? keys : extra,
					keys: shift ? element : keys,
					element: shift ? this.element : element,
					add: add
				};
			options.element.toggleClass( this._classes( options ), add );
			return this;
		},

		_on: function( suppressDisabledCheck, element, handlers ) {
			var delegateElement;
			var instance = this;

			// No suppressDisabledCheck flag, shuffle arguments
			if ( typeof suppressDisabledCheck !== "boolean" ) {
				handlers = element;
				element = suppressDisabledCheck;
				suppressDisabledCheck = false;
			}

			// No element argument, shuffle and use this.element
			if ( !handlers ) {
				handlers = element;
				element = this.element;
				delegateElement = this.widget();
			} else {
				element = delegateElement = $( element );
				this.bindings = this.bindings.add( element );
			}

			objects.each( handlers, function( event, handler ) {
				function handlerProxy() {

					// Allow widgets to customize the disabled handling
					// - disabled as an array instead of boolean
					// - disabled class as method for disabling individual parts
					if ( !suppressDisabledCheck &&
							( instance.options.disabled === true ||
							$( this ).hasClass( "ui-state-disabled" ) ) ) {
						return;
					}
					return ( typeof handler === "string" ? instance[ handler ] : handler )
						.apply( instance, arguments );
				}

				// Copy the guid so direct unbinding works
				if ( typeof handler !== "string" ) {
					handlerProxy.guid = handler.guid =
						handler.guid || handlerProxy.guid || $.guid++;
				}

				var match = event.match( /^([\w:-]*)\s*(.*)$/ );
				var eventName = match[ 1 ] + instance.eventNamespace;
				var selector = match[ 2 ];

				if ( selector ) {
					delegateElement.on( eventName, selector, handlerProxy );
				} else {
					element.on( eventName, handlerProxy );
				}
			} );
		},

		_off: function( element, eventName ) {
			eventName = ( eventName || "" ).split( " " ).join( this.eventNamespace + " " ) +
				this.eventNamespace;
			element.off( eventName );

			// Clear the stack to avoid memory leaks (#10056)
			this.bindings = $( this.bindings.not( element ).get() );
			this.focusable = $( this.focusable.not( element ).get() );
			this.hoverable = $( this.hoverable.not( element ).get() );
		},

		_trigger: function( type, event, data ) {
			var prop, orig;
			var callback = this.options[ type ];

			data = data || {};
			event = eventer.proxy( event );
			event.type = ( type === this.widgetEventPrefix ?
				type :
				this.widgetEventPrefix + type ).toLowerCase();

			// The original event may come from any element
			// so we need to reset the target on the new event
			event.target = this.element[ 0 ];

			// Copy original event properties over to the new event
			orig = event.originalEvent;
			if ( orig ) {
				for ( prop in orig ) {
					if ( !( prop in event ) ) {
						event[ prop ] = orig[ prop ];
					}
				}
			}

			this.element.trigger( event, data );
			return !( types.isFunction( callback ) &&
				callback.apply( this.element[ 0 ], [ event ].concat( data ) ) === false ||
				event.isDefaultPrevented() );
		}

	});

	return JqPlugin;
});
/*!
 * jQuery UI Widget @VERSION
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Widget
//>>group: Core
//>>description: Provides a factory for creating stateful widgets with a common API.
//>>docs: http://api.jqueryui.com/jQuery.widget/
//>>demos: http://jqueryui.com/widget/

define( 'skylark-jquery/widget',[ 
	"skylark-langx/langx",
	"skylark-utils-dom/plugins",
	"./core",
	"./JqueryPlugin"
],  function(langx,splugins, $,JqPlugin ) {

	var widgetUuid = 0;
	var widgetHasOwnProperty = Array.prototype.hasOwnProperty;
	var widgetSlice = Array.prototype.slice;

	$.cleanData = ( function( orig ) {
		return function( elems ) {
			var events, elem, i;
			for ( i = 0; ( elem = elems[ i ] ) != null; i++ ) {

				// Only trigger remove when necessary to save time
				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}
			}
			orig( elems );
		};
	} )( $.cleanData );
	
	$.widget = function( name, base, prototype ) {
		var existingConstructor, constructor, basePrototype;

		// ProxiedPrototype allows the provided prototype to remain unmodified
		// so that it can be used as a mixin for multiple widgets (#8876)
		var proxiedPrototype = {};

		var namespace = name.split( "." )[ 0 ];
		name = name.split( "." )[ 1 ];
		var fullName = namespace + "-" + name;

		if ( !prototype ) {
			prototype = base;
			base = $.Widget;
		}

		if ( $.isArray( prototype ) ) {
			prototype = $.extend.apply( null, [ {} ].concat( prototype ) );
		}

		// Create selector for plugin
		$.expr.pseudos[ fullName.toLowerCase() ] = function( elem ) {
			return !!$.data( elem, fullName );
		};

		$[ namespace ] = $[ namespace ] || {};

		existingConstructor = $[ namespace ][ name ];

		var basePrototype = base.prototype,
			newPrototype = {};

		for (var key in prototype) {
			var value = prototype[key];

			if ( $.isPlainObject( value ) ) {
				newPrototype[ key ] = $.isPlainObject( basePrototype[ key ] ) ?
					$.widget.extend( {}, basePrototype[ key ], value ) :

					// Don't extend strings, arrays, etc. with objects
					$.widget.extend( {}, value );
			} else {
				newPrototype[key] = value;
			}
		}

		var _proto = $.widget.extend({

			// TODO: remove support for widgetEventPrefix
			// always use the name + a colon as the prefix, e.g., draggable:start
			// don't prefix for widgets that aren't DOM-based
			widgetEventPrefix: existingConstructor ? ( base.prototype.widgetEventPrefix || name ) : name
		}, {
			options : base.prototype.options
		},newPrototype, {
			name : fullName,
			namespace: namespace,
			widgetName: name,
			pluginName : "jqueryui." + (namespace ? namespace + "." : "") + name,
			widgetFullName: fullName
		} );

		constructor = $[ namespace ][ name ] = base.inherit(_proto);
		/*

		constructor = $[ namespace ][ name ] = function( options, element ) {

			// Allow instantiation without "new" keyword
			if ( !this._createWidget ) {
				return new constructor( options, element );
			}

			// Allow instantiation without initializing for simple inheritance
			// must use "new" keyword (the code above always passes args)
			if ( arguments.length ) {
				this._createWidget( options, element );
			}
		};
		*/
		// Extend with the existing constructor to carry over any static properties
		$.extend( constructor, existingConstructor, {
			version: prototype.version,

			// Copy the object used to create the prototype in case we need to
			// redefine the widget later
			_proto: _proto,

			// Track widgets that inherit from this widget in case this widget is
			// redefined after a widget inherits from it
			_childConstructors: []
		} );

		/*
		basePrototype = new base();

		// We need to make the options hash a property directly on the new instance
		// otherwise we'll modify the options hash on the prototype that we're
		// inheriting from
		basePrototype.options = $.widget.extend( {}, basePrototype.options );
		$.each( prototype, function( prop, value ) {
			if ( !$.isFunction( value ) ) {
				proxiedPrototype[ prop ] = value;
				return;
			}
			proxiedPrototype[ prop ] = ( function() {
				function _super() {
					return base.prototype[ prop ].apply( this, arguments );
				}

				function _superApply( args ) {
					return base.prototype[ prop ].apply( this, args );
				}

				return function() {
					var __super = this._super;
					var __superApply = this._superApply;
					var returnValue;

					this._super = _super;
					this._superApply = _superApply;

					returnValue = value.apply( this, arguments );

					this._super = __super;
					this._superApply = __superApply;

					return returnValue;
				};
			} )();
		} );
		constructor.prototype = $.widget.extend( basePrototype, {

			// TODO: remove support for widgetEventPrefix
			// always use the name + a colon as the prefix, e.g., draggable:start
			// don't prefix for widgets that aren't DOM-based
			widgetEventPrefix: existingConstructor ? ( basePrototype.widgetEventPrefix || name ) : name
		}, proxiedPrototype, {
			constructor: constructor,
			namespace: namespace,
			widgetName: name,
			widgetFullName: fullName
		} );
		*/
		// If this widget is being redefined then we need to find all widgets that
		// are inheriting from it and redefine all of them so that they inherit from
		// the new version of this widget. We're essentially trying to replace one
		// level in the prototype chain.
		if ( existingConstructor ) {
			$.each( existingConstructor._childConstructors, function( i, child ) {
				var childPrototype = child.prototype;

				// Redefine the child widget using the same prototype that was
				// originally used, but inherit from the new version of the base
				$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor,
					child._proto );
			} );

			// Remove the list of existing child constructors from the old constructor
			// so the old child constructors can be garbage collected
			delete existingConstructor._childConstructors;
		} else {
			if (base._childConstructors) {
				base._childConstructors.push( constructor );
			}
		}

		//$.widget.bridge( name, constructor );

		splugins.register(constructor,name,fullName);

		return constructor;
	};

	$.widget.extend = function( target ) {
		var input = widgetSlice.call( arguments, 1 );
		var inputIndex = 0;
		var inputLength = input.length;
		var key;
		var value;

		for ( ; inputIndex < inputLength; inputIndex++ ) {
			for ( key in input[ inputIndex ] ) {
				value = input[ inputIndex ][ key ];
				if ( widgetHasOwnProperty.call( input[ inputIndex ], key ) && value !== undefined ) {

					// Clone objects
					if ( $.isPlainObject( value ) ) {
						target[ key ] = $.isPlainObject( target[ key ] ) ?
							$.widget.extend( {}, target[ key ], value ) :

							// Don't extend strings, arrays, etc. with objects
							$.widget.extend( {}, value );

					// Copy everything else by reference
					} else {
						target[ key ] = value;
					}
				}
			}
		}
		return target;
	};


	$.Widget = 	 JqPlugin.inherit({
		widgetName: "widget",
		widgetEventPrefix: "",
		defaultElement: "<div>",

		options: {
			classes: {},
			disabled: false,

			// Callbacks
			create: null
		},

	     _initOptions : function(options) {
	     	options = langx.mixin(this._createOptions(),options);

			this.overrided(options);
		},

		_createOptions : function() {
			return {};
		},

		_super : function() {
			if (this.overrided) {
				return this.overrided.apply(this,arguments);
			}
		},

		_superApply : function ( args ) {
			if (this.overrided) {
				return this.overrided.apply(this,args);
			}
		},


		widget: function() {
			return this.element;
		},


		_setOption: function( key, value ) {
			if ( key === "classes" ) {
				this._setOptionClasses( value );
			}

			this.options[ key ] = value;

			if ( key === "disabled" ) {
				this._setOptionDisabled( value );
			}

			return this;
		},

		_setOptionClasses: function( value ) {
			var classKey, elements, currentElements;

			for ( classKey in value ) {
				currentElements = this.classesElementLookup[ classKey ];
				if ( value[ classKey ] === this.options.classes[ classKey ] ||
						!currentElements ||
						!currentElements.length ) {
					continue;
				}

				// We are doing this to create a new jQuery object because the _removeClass() call
				// on the next line is going to destroy the reference to the current elements being
				// tracked. We need to save a copy of this collection so that we can add the new classes
				// below.
				elements = $( currentElements.get() );
				this._removeClass( currentElements, classKey );

				// We don't use _addClass() here, because that uses this.options.classes
				// for generating the string of classes. We want to use the value passed in from
				// _setOption(), this is the new value of the classes option which was passed to
				// _setOption(). We pass this value directly to _classes().
				elements.addClass( this._classes( {
					element: elements,
					keys: classKey,
					classes: value,
					add: true
				} ));
			}
		},

		_setOptionDisabled: function( value ) {
			this._toggleClass( this.widget(), this.widgetFullName + "-disabled", null, !!value );

			// If the widget is becoming disabled, then nothing is interactive
			if ( value ) {
				this._removeClass( this.hoverable, null, "ui-state-hover" );
				this._removeClass( this.focusable, null, "ui-state-focus" );
			}
		},

		enable: function() {
			return this._setOptions( { disabled: false } );
		},

		disable: function() {
			return this._setOptions( { disabled: true } );
		},


		_delay: function( handler, delay ) {
			function handlerProxy() {
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}
			var instance = this;
			return setTimeout( handlerProxy, delay || 0 );
		},

		_hoverable: function( element ) {
			this.hoverable = this.hoverable.add( element );
			this._on( element, {
				mouseenter: function( event ) {
					this._addClass( $( event.currentTarget ), null, "ui-state-hover" );
				},
				mouseleave: function( event ) {
					this._removeClass( $( event.currentTarget ), null, "ui-state-hover" );
				}
			} );
		},

		_focusable: function( element ) {
			this.focusable = this.focusable.add( element );
			this._on( element, {
				focusin: function( event ) {
					this._addClass( $( event.currentTarget ), null, "ui-state-focus" );
				},
				focusout: function( event ) {
					this._removeClass( $( event.currentTarget ), null, "ui-state-focus" );
				}
			} );
		}

	});

	$.Widget._childConstructors = [];

	$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
		$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
			if ( typeof options === "string" ) {
				options = { effect: options };
			}

			var hasOptions;
			var effectName = !options ?
				method :
				options === true || typeof options === "number" ?
					defaultEffect :
					options.effect || defaultEffect;

			options = options || {};
			if ( typeof options === "number" ) {
				options = { duration: options };
			}

			hasOptions = !$.isEmptyObject( options );
			options.complete = callback;

			if ( options.delay ) {
				element.delay( options.delay );
			}

			if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
				element[ method ]( options );
			} else if ( effectName !== method && element[ effectName ] ) {
				element[ effectName ]( options.duration, options.easing, callback );
			} else {
				element.queue( function( next ) {
					$( this )[ method ]();
					if ( callback ) {
						callback.call( element[ 0 ] );
					}
					next();
				} );
			}
		};
	} );

	return $.widget;

});

define('skylark-jquery/main',[
    "./core",
    "./ajax",
    "./callbacks",
    "./deferred",
    "./queue",
    "./JqueryPlugin",
    "./widget"
], function($) {
    return $;
});

define('skylark-jquery', ['skylark-jquery/main'], function (main) { return main; });

/*!
 * UEditor Mini版本
 * version: 1.2.2
 * build: Tue Sep 03 2019 22:25:36 GMT+0900 (GMT+09:00)
 */

define('skylark-umeditor/umeditor',[
    "skylark-langx/skylark",
    "skylark-jquery"
],function(skylark,$){

    UMEDITOR_CONFIG = window.UMEDITOR_CONFIG || {};

    var UM = {
        plugins : {},

        commands : {},

        I18N : {},

        version : "1.2.2"
    };

    var dom = UM.dom = {};
    /**
     * 浏览器判断模块
     * @file
     * @module UE.browser
     * @since 1.2.6.1
     */

    /**
     * 提供浏览器检测的模块
     * @unfile
     * @module UE.browser
     */
    var browser = UM.browser = function(){
        var agent = navigator.userAgent.toLowerCase(),
            opera = window.opera,
            browser = {
                /**
                 * @property {boolean} ie 检测当前浏览器是否为IE
                 * @example
                 * ```javascript
                 * if ( UE.browser.ie ) {
             *     console.log( '当前浏览器是IE' );
             * }
                 * ```
                 */
                ie		:  /(msie\s|trident.*rv:)([\w.]+)/.test(agent),

                /**
                 * @property {boolean} opera 检测当前浏览器是否为Opera
                 * @example
                 * ```javascript
                 * if ( UE.browser.opera ) {
             *     console.log( '当前浏览器是Opera' );
             * }
                 * ```
                 */
                opera	: ( !!opera && opera.version ),

                /**
                 * @property {boolean} webkit 检测当前浏览器是否是webkit内核的浏览器
                 * @example
                 * ```javascript
                 * if ( UE.browser.webkit ) {
             *     console.log( '当前浏览器是webkit内核浏览器' );
             * }
                 * ```
                 */
                webkit	: ( agent.indexOf( ' applewebkit/' ) > -1 ),

                /**
                 * @property {boolean} mac 检测当前浏览器是否是运行在mac平台下
                 * @example
                 * ```javascript
                 * if ( UE.browser.mac ) {
             *     console.log( '当前浏览器运行在mac平台下' );
             * }
                 * ```
                 */
                mac	: ( agent.indexOf( 'macintosh' ) > -1 ),

                /**
                 * @property {boolean} quirks 检测当前浏览器是否处于“怪异模式”下
                 * @example
                 * ```javascript
                 * if ( UE.browser.quirks ) {
             *     console.log( '当前浏览器运行处于“怪异模式”' );
             * }
                 * ```
                 */
                quirks : ( document.compatMode == 'BackCompat' )
            };

        /**
         * @property {boolean} gecko 检测当前浏览器内核是否是gecko内核
         * @example
         * ```javascript
         * if ( UE.browser.gecko ) {
        *     console.log( '当前浏览器内核是gecko内核' );
        * }
         * ```
         */
        browser.gecko =( navigator.product == 'Gecko' && !browser.webkit && !browser.opera && !browser.ie);

        var version = 0;

        // Internet Explorer 6.0+
        if ( browser.ie ){


            var v1 =  agent.match(/(?:msie\s([\w.]+))/);
            var v2 = agent.match(/(?:trident.*rv:([\w.]+))/);
            if(v1 && v2 && v1[1] && v2[1]){
                version = Math.max(v1[1]*1,v2[1]*1);
            }else if(v1 && v1[1]){
                version = v1[1]*1;
            }else if(v2 && v2[1]){
                version = v2[1]*1;
            }else{
                version = 0;
            }

            browser.ie11Compat = document.documentMode == 11;
            /**
             * @property { boolean } ie9Compat 检测浏览器模式是否为 IE9 兼容模式
             * @warning 如果浏览器不是IE， 则该值为undefined
             * @example
             * ```javascript
             * if ( UE.browser.ie9Compat ) {
             *     console.log( '当前浏览器运行在IE9兼容模式下' );
             * }
             * ```
             */
            browser.ie9Compat = document.documentMode == 9;

            /**
             * @property { boolean } ie8 检测浏览器是否是IE8浏览器
             * @warning 如果浏览器不是IE， 则该值为undefined
             * @example
             * ```javascript
             * if ( UE.browser.ie8 ) {
             *     console.log( '当前浏览器是IE8浏览器' );
             * }
             * ```
             */
            browser.ie8 = !!document.documentMode;

            /**
             * @property { boolean } ie8Compat 检测浏览器模式是否为 IE8 兼容模式
             * @warning 如果浏览器不是IE， 则该值为undefined
             * @example
             * ```javascript
             * if ( UE.browser.ie8Compat ) {
             *     console.log( '当前浏览器运行在IE8兼容模式下' );
             * }
             * ```
             */
            browser.ie8Compat = document.documentMode == 8;

            /**
             * @property { boolean } ie7Compat 检测浏览器模式是否为 IE7 兼容模式
             * @warning 如果浏览器不是IE， 则该值为undefined
             * @example
             * ```javascript
             * if ( UE.browser.ie7Compat ) {
             *     console.log( '当前浏览器运行在IE7兼容模式下' );
             * }
             * ```
             */
            browser.ie7Compat = ( ( version == 7 && !document.documentMode )
                || document.documentMode == 7 );

            /**
             * @property { boolean } ie6Compat 检测浏览器模式是否为 IE6 模式 或者怪异模式
             * @warning 如果浏览器不是IE， 则该值为undefined
             * @example
             * ```javascript
             * if ( UE.browser.ie6Compat ) {
             *     console.log( '当前浏览器运行在IE6模式或者怪异模式下' );
             * }
             * ```
             */
            browser.ie6Compat = ( version < 7 || browser.quirks );

            browser.ie9above = version > 8;

            browser.ie9below = version < 9;

        }

        // Gecko.
        if ( browser.gecko ){
            var geckoRelease = agent.match( /rv:([\d\.]+)/ );
            if ( geckoRelease )
            {
                geckoRelease = geckoRelease[1].split( '.' );
                version = geckoRelease[0] * 10000 + ( geckoRelease[1] || 0 ) * 100 + ( geckoRelease[2] || 0 ) * 1;
            }
        }

        /**
         * @property { Number } chrome 检测当前浏览器是否为Chrome, 如果是，则返回Chrome的大版本号
         * @warning 如果浏览器不是chrome， 则该值为undefined
         * @example
         * ```javascript
         * if ( UE.browser.chrome ) {
         *     console.log( '当前浏览器是Chrome' );
         * }
         * ```
         */
        if (/chrome\/(\d+\.\d)/i.test(agent)) {
            browser.chrome = + RegExp['\x241'];
        }

        /**
         * @property { Number } safari 检测当前浏览器是否为Safari, 如果是，则返回Safari的大版本号
         * @warning 如果浏览器不是safari， 则该值为undefined
         * @example
         * ```javascript
         * if ( UE.browser.safari ) {
         *     console.log( '当前浏览器是Safari' );
         * }
         * ```
         */
        if(/(\d+\.\d)?(?:\.\d)?\s+safari\/?(\d+\.\d+)?/i.test(agent) && !/chrome/i.test(agent)){
            browser.safari = + (RegExp['\x241'] || RegExp['\x242']);
        }


        // Opera 9.50+
        if ( browser.opera )
            version = parseFloat( opera.version() );

        // WebKit 522+ (Safari 3+)
        if ( browser.webkit )
            version = parseFloat( agent.match( / applewebkit\/(\d+)/ )[1] );

        /**
         * @property { Number } version 检测当前浏览器版本号
         * @remind
         * <ul>
         *     <li>IE系列返回值为5,6,7,8,9,10等</li>
         *     <li>gecko系列会返回10900，158900等</li>
         *     <li>webkit系列会返回其build号 (如 522等)</li>
         * </ul>
         * @example
         * ```javascript
         * console.log( '当前浏览器版本号是： ' + UE.browser.version );
         * ```
         */
        browser.version = version;

        /**
         * @property { boolean } isCompatible 检测当前浏览器是否能够与UEditor良好兼容
         * @example
         * ```javascript
         * if ( UE.browser.isCompatible ) {
         *     console.log( '浏览器与UEditor能够良好兼容' );
         * }
         * ```
         */
        browser.isCompatible =
            !browser.mobile && (
                ( browser.ie && version >= 6 ) ||
                    ( browser.gecko && version >= 10801 ) ||
                    ( browser.opera && version >= 9.5 ) ||
                    ( browser.air && version >= 1 ) ||
                    ( browser.webkit && version >= 522 ) ||
                    false );
        return browser;
    }();
    //快捷方式
    var ie = browser.ie,
        webkit = browser.webkit,
        gecko = browser.gecko,
        opera = browser.opera;
    /**
     * @file
     * @name UM.Utils
     * @short Utils
     * @desc UEditor封装使用的静态工具函数
     * @import editor.js
     */
    var utils = UM.utils = {
        /**
         * 遍历数组，对象，nodeList
         * @name each
         * @grammar UM.utils.each(obj,iterator,[context])
         * @since 1.2.4+
         * @desc
         * * obj 要遍历的对象
         * * iterator 遍历的方法,方法的第一个是遍历的值，第二个是索引，第三个是obj
         * * context  iterator的上下文
         * @example
         * UM.utils.each([1,2],function(v,i){
         *     console.log(v)//值
         *     console.log(i)//索引
         * })
         * UM.utils.each(document.getElementsByTagName('*'),function(n){
         *     console.log(n.tagName)
         * })
         */
        each : function(obj, iterator, context) {
            if (obj == null) return;
            if (obj.length === +obj.length) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if(iterator.call(context, obj[i], i, obj) === false)
                        return false;
                }
            } else {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if(iterator.call(context, obj[key], key, obj) === false)
                            return false;
                    }
                }
            }
        },

        makeInstance:function (obj) {
            var noop = new Function();
            noop.prototype = obj;
            obj = new noop;
            noop.prototype = null;
            return obj;
        },
        /**
         * 将source对象中的属性扩展到target对象上
         * @name extend
         * @grammar UM.utils.extend(target,source)  => Object  //覆盖扩展
         * @grammar UM.utils.extend(target,source,true)  ==> Object  //保留扩展
         */
        extend:function (t, s, b) {
            if (s) {
                for (var k in s) {
                    if (!b || !t.hasOwnProperty(k)) {
                        t[k] = s[k];
                    }
                }
            }
            return t;
        },
        extend2:function (t) {
            var a = arguments;
            for (var i = 1; i < a.length; i++) {
                var x = a[i];
                for (var k in x) {
                    if (!t.hasOwnProperty(k)) {
                        t[k] = x[k];
                    }
                }
            }
            return t;
        },
        /**
         * 模拟继承机制，subClass继承superClass
         * @name inherits
         * @grammar UM.utils.inherits(subClass,superClass) => subClass
         * @example
         * function SuperClass(){
         *     this.name = "小李";
         * }
         * SuperClass.prototype = {
         *     hello:function(str){
         *         console.log(this.name + str);
         *     }
         * }
         * function SubClass(){
         *     this.name = "小张";
         * }
         * UM.utils.inherits(SubClass,SuperClass);
         * var sub = new SubClass();
         * sub.hello("早上好!"); ==> "小张早上好！"
         */
        inherits:function (subClass, superClass) {
            var oldP = subClass.prototype,
                newP = utils.makeInstance(superClass.prototype);
            utils.extend(newP, oldP, true);
            subClass.prototype = newP;
            return (newP.constructor = subClass);
        },

        /**
         * 用指定的context作为fn上下文，也就是this
         * @name bind
         * @grammar UM.utils.bind(fn,context)  =>  fn
         */
        bind:function (fn, context) {
            return function () {
                return fn.apply(context, arguments);
            };
        },

        /**
         * 创建延迟delay执行的函数fn
         * @name defer
         * @grammar UM.utils.defer(fn,delay)  =>fn   //延迟delay毫秒执行fn，返回fn
         * @grammar UM.utils.defer(fn,delay,exclusion)  =>fn   //延迟delay毫秒执行fn，若exclusion为真，则互斥执行fn
         * @example
         * function test(){
         *     console.log("延迟输出！");
         * }
         * //非互斥延迟执行
         * var testDefer = UM.utils.defer(test,1000);
         * testDefer();   =>  "延迟输出！";
         * testDefer();   =>  "延迟输出！";
         * //互斥延迟执行
         * var testDefer1 = UM.utils.defer(test,1000,true);
         * testDefer1();   =>  //本次不执行
         * testDefer1();   =>  "延迟输出！";
         */
        defer:function (fn, delay, exclusion) {
            var timerID;
            return function () {
                if (exclusion) {
                    clearTimeout(timerID);
                }
                timerID = setTimeout(fn, delay);
            };
        },

        /**
         * 查找元素item在数组array中的索引, 若找不到返回-1
         * @name indexOf
         * @grammar UM.utils.indexOf(array,item)  => index|-1  //默认从数组开头部开始搜索
         * @grammar UM.utils.indexOf(array,item,start)  => index|-1  //start指定开始查找的位置
         */
        indexOf:function (array, item, start) {
            var index = -1;
            start = this.isNumber(start) ? start : 0;
            this.each(array, function (v, i) {
                if (i >= start && v === item) {
                    index = i;
                    return false;
                }
            });
            return index;
        },

        /**
         * 移除数组array中的元素item
         * @name removeItem
         * @grammar UM.utils.removeItem(array,item)
         */
        removeItem:function (array, item) {
            for (var i = 0, l = array.length; i < l; i++) {
                if (array[i] === item) {
                    array.splice(i, 1);
                    i--;
                }
            }
        },

        /**
         * 删除字符串str的首尾空格
         * @name trim
         * @grammar UM.utils.trim(str) => String
         */
        trim:function (str) {
            return str.replace(/(^[ \t\n\r]+)|([ \t\n\r]+$)/g, '');
        },

        /**
         * 将字符串list(以','分隔)或者数组list转成哈希对象
         * @name listToMap
         * @grammar UM.utils.listToMap(list)  => Object  //Object形如{test:1,br:1,textarea:1}
         */
        listToMap:function (list) {
            if (!list)return {};
            list = utils.isArray(list) ? list : list.split(',');
            for (var i = 0, ci, obj = {}; ci = list[i++];) {
                obj[ci.toUpperCase()] = obj[ci] = 1;
            }
            return obj;
        },

        /**
         * 将str中的html符号转义,默认将转义''&<">''四个字符，可自定义reg来确定需要转义的字符
         * @name unhtml
         * @grammar UM.utils.unhtml(str);  => String
         * @grammar UM.utils.unhtml(str,reg)  => String
         * @example
         * var html = '<body>You say:"你好！Baidu & UEditor!"</body>';
         * UM.utils.unhtml(html);   ==>  &lt;body&gt;You say:&quot;你好！Baidu &amp; UEditor!&quot;&lt;/body&gt;
         * UM.utils.unhtml(html,/[<>]/g)  ==>  &lt;body&gt;You say:"你好！Baidu & UEditor!"&lt;/body&gt;
         */
        unhtml:function (str, reg) {
            return str ? str.replace(reg || /[&<">'](?:(amp|lt|quot|gt|#39|nbsp);)?/g, function (a, b) {
                if (b) {
                    return a;
                } else {
                    return {
                        '<':'&lt;',
                        '&':'&amp;',
                        '"':'&quot;',
                        '>':'&gt;',
                        "'":'&#39;'
                    }[a]
                }

            }) : '';
        },
        /**
         * 将str中的转义字符还原成html字符
         * @name html
         * @grammar UM.utils.html(str)  => String   //详细参见<code><a href = '#unhtml'>unhtml</a></code>
         */
        html:function (str) {
            return str ? str.replace(/&((g|l|quo)t|amp|#39);/g, function (m) {
                return {
                    '&lt;':'<',
                    '&amp;':'&',
                    '&quot;':'"',
                    '&gt;':'>',
                    '&#39;':"'"
                }[m]
            }) : '';
        },
        /**
         * 将css样式转换为驼峰的形式。如font-size => fontSize
         * @name cssStyleToDomStyle
         * @grammar UM.utils.cssStyleToDomStyle(cssName)  => String
         */
        cssStyleToDomStyle:function () {
            var test = document.createElement('div').style,
                cache = {
                    'float':test.cssFloat != undefined ? 'cssFloat' : test.styleFloat != undefined ? 'styleFloat' : 'float'
                };

            return function (cssName) {
                return cache[cssName] || (cache[cssName] = cssName.toLowerCase().replace(/-./g, function (match) {
                    return match.charAt(1).toUpperCase();
                }));
            };
        }(),
        /**
         * 动态加载文件到doc中，并依据obj来设置属性，加载成功后执行回调函数fn
         * @name loadFile
         * @grammar UM.utils.loadFile(doc,obj)
         * @grammar UM.utils.loadFile(doc,obj,fn)
         * @example
         * //指定加载到当前document中一个script文件，加载成功后执行function
         * utils.loadFile( document, {
         *     src:"test.js",
         *     tag:"script",
         *     type:"text/javascript",
         *     defer:"defer"
         * }, function () {
         *     console.log('加载成功！')
         * });
         */
        loadFile:function () {
            var tmpList = [];

            function getItem(doc, obj) {
                try {
                    for (var i = 0, ci; ci = tmpList[i++];) {
                        if (ci.doc === doc && ci.url == (obj.src || obj.href)) {
                            return ci;
                        }
                    }
                } catch (e) {
                    return null;
                }

            }

            return function (doc, obj, fn) {
                var item = getItem(doc, obj);
                if (item) {
                    if (item.ready) {
                        fn && fn();
                    } else {
                        item.funs.push(fn)
                    }
                    return;
                }
                tmpList.push({
                    doc:doc,
                    url:obj.src || obj.href,
                    funs:[fn]
                });
                if (!doc.body) {
                    var html = [];
                    for (var p in obj) {
                        if (p == 'tag')continue;
                        html.push(p + '="' + obj[p] + '"')
                    }
                    doc.write('<' + obj.tag + ' ' + html.join(' ') + ' ></' + obj.tag + '>');
                    return;
                }
                if (obj.id && doc.getElementById(obj.id)) {
                    return;
                }
                var element = doc.createElement(obj.tag);
                delete obj.tag;
                for (var p in obj) {
                    element.setAttribute(p, obj[p]);
                }
                element.onload = element.onreadystatechange = function () {
                    if (!this.readyState || /loaded|complete/.test(this.readyState)) {
                        item = getItem(doc, obj);
                        if (item.funs.length > 0) {
                            item.ready = 1;
                            for (var fi; fi = item.funs.pop();) {
                                fi();
                            }
                        }
                        element.onload = element.onreadystatechange = null;
                    }
                };
                element.onerror = function () {
                    throw Error('The load ' + (obj.href || obj.src) + ' fails,check the url settings of file umeditor.config.js ')
                };
                doc.getElementsByTagName("head")[0].appendChild(element);
            }
        }(),
        /**
         * 判断obj对象是否为空
         * @name isEmptyObject
         * @grammar UM.utils.isEmptyObject(obj)  => true|false
         * @example
         * UM.utils.isEmptyObject({}) ==>true
         * UM.utils.isEmptyObject([]) ==>true
         * UM.utils.isEmptyObject("") ==>true
         */
        isEmptyObject:function (obj) {
            if (obj == null) return true;
            if (this.isArray(obj) || this.isString(obj)) return obj.length === 0;
            for (var key in obj) if (obj.hasOwnProperty(key)) return false;
            return true;
        },

        /**
         * 统一将颜色值使用16进制形式表示
         * @name fixColor
         * @grammar UM.utils.fixColor(name,value) => value
         * @example
         * rgb(255,255,255)  => "#ffffff"
         */
        fixColor:function (name, value) {
            if (/color/i.test(name) && /rgba?/.test(value)) {
                var array = value.split(",");
                if (array.length > 3)
                    return "";
                value = "#";
                for (var i = 0, color; color = array[i++];) {
                    color = parseInt(color.replace(/[^\d]/gi, ''), 10).toString(16);
                    value += color.length == 1 ? "0" + color : color;
                }
                value = value.toUpperCase();
            }
            return  value;
        },

        /**
         * 深度克隆对象，从source到target
         * @name clone
         * @grammar UM.utils.clone(source) => anthorObj 新的对象是完整的source的副本
         * @grammar UM.utils.clone(source,target) => target包含了source的所有内容，重名会覆盖
         */
        clone:function (source, target) {
            var tmp;
            target = target || {};
            for (var i in source) {
                if (source.hasOwnProperty(i)) {
                    tmp = source[i];
                    if (typeof tmp == 'object') {
                        target[i] = utils.isArray(tmp) ? [] : {};
                        utils.clone(source[i], target[i])
                    } else {
                        target[i] = tmp;
                    }
                }
            }
            return target;
        },
        /**
         * 转换cm/pt到px
         * @name transUnitToPx
         * @grammar UM.utils.transUnitToPx('20pt') => '27px'
         * @grammar UM.utils.transUnitToPx('0pt') => '0'
         */
        transUnitToPx:function (val) {
            if (!/(pt|cm)/.test(val)) {
                return val
            }
            var unit;
            val.replace(/([\d.]+)(\w+)/, function (str, v, u) {
                val = v;
                unit = u;
            });
            switch (unit) {
                case 'cm':
                    val = parseFloat(val) * 25;
                    break;
                case 'pt':
                    val = Math.round(parseFloat(val) * 96 / 72);
            }
            return val + (val ? 'px' : '');
        },
        /**
         * 动态添加css样式
         * @name cssRule
         * @grammar UM.utils.cssRule('添加的样式的节点名称',['样式'，'放到哪个document上'])
         * @grammar UM.utils.cssRule('body','body{background:#ccc}') => null  //给body添加背景颜色
         * @grammar UM.utils.cssRule('body') =>样式的字符串  //取得key值为body的样式的内容,如果没有找到key值先关的样式将返回空，例如刚才那个背景颜色，将返回 body{background:#ccc}
         * @grammar UM.utils.cssRule('body','') =>null //清空给定的key值的背景颜色
         */
        cssRule:browser.ie && browser.version != 11 ? function (key, style, doc) {
            var indexList, index;
            doc = doc || document;
            if (doc.indexList) {
                indexList = doc.indexList;
            } else {
                indexList = doc.indexList = {};
            }
            var sheetStyle;
            if (!indexList[key]) {
                if (style === undefined) {
                    return ''
                }
                sheetStyle = doc.createStyleSheet('', index = doc.styleSheets.length);
                indexList[key] = index;
            } else {
                sheetStyle = doc.styleSheets[indexList[key]];
            }
            if (style === undefined) {
                return sheetStyle.cssText
            }
            sheetStyle.cssText = style || ''
        } : function (key, style, doc) {
            doc = doc || document;
            var head = doc.getElementsByTagName('head')[0], node;
            if (!(node = doc.getElementById(key))) {
                if (style === undefined) {
                    return ''
                }
                node = doc.createElement('style');
                node.id = key;
                head.appendChild(node)
            }
            if (style === undefined) {
                return node.innerHTML
            }
            if (style !== '') {
                node.innerHTML = style;
            } else {
                head.removeChild(node)
            }
        }

    };
    /**
     * 判断str是否为字符串
     * @name isString
     * @grammar UM.utils.isString(str) => true|false
     */
    /**
     * 判断array是否为数组
     * @name isArray
     * @grammar UM.utils.isArray(obj) => true|false
     */
    /**
     * 判断obj对象是否为方法
     * @name isFunction
     * @grammar UM.utils.isFunction(obj)  => true|false
     */
    /**
     * 判断obj对象是否为数字
     * @name isNumber
     * @grammar UM.utils.isNumber(obj)  => true|false
     */
    utils.each(['String', 'Function', 'Array', 'Number', 'RegExp', 'Object'], function (v) {
        UM.utils['is' + v] = function (obj) {
            return Object.prototype.toString.apply(obj) == '[object ' + v + ']';
        }
    });
    /**
     * @file
     * @name UM.EventBase
     * @short EventBase
     * @import editor.js,core/utils.js
     * @desc UE采用的事件基类，继承此类的对应类将获取addListener,removeListener,fireEvent方法。
     * 在UE中，Editor以及所有ui实例都继承了该类，故可以在对应的ui对象以及editor对象上使用上述方法。
     */
    var EventBase = UM.EventBase = function () {};

    EventBase.prototype = {
        /**
         * 注册事件监听器
         * @name addListener
         * @grammar editor.addListener(types,fn)  //types为事件名称，多个可用空格分隔
         * @example
         * editor.addListener('selectionchange',function(){
         *      console.log("选区已经变化！");
         * })
         * editor.addListener('beforegetcontent aftergetcontent',function(type){
         *         if(type == 'beforegetcontent'){
         *             //do something
         *         }else{
         *             //do something
         *         }
         *         console.log(this.getContent) // this是注册的事件的编辑器实例
         * })
         */
        addListener:function (types, listener) {
            types = utils.trim(types).split(' ');
            for (var i = 0, ti; ti = types[i++];) {
                getListener(this, ti, true).push(listener);
            }
        },
        /**
         * 移除事件监听器
         * @name removeListener
         * @grammar editor.removeListener(types,fn)  //types为事件名称，多个可用空格分隔
         * @example
         * //changeCallback为方法体
         * editor.removeListener("selectionchange",changeCallback);
         */
        removeListener:function (types, listener) {
            types = utils.trim(types).split(' ');
            for (var i = 0, ti; ti = types[i++];) {
                utils.removeItem(getListener(this, ti) || [], listener);
            }
        },
        /**
         * 触发事件
         * @name fireEvent
         * @grammar editor.fireEvent(types)  //types为事件名称，多个可用空格分隔
         * @example
         * editor.fireEvent("selectionchange");
         */
        fireEvent:function () {
            var types = arguments[0];
            types = utils.trim(types).split(' ');
            for (var i = 0, ti; ti = types[i++];) {
                var listeners = getListener(this, ti),
                    r, t, k;
                if (listeners) {
                    k = listeners.length;
                    while (k--) {
                        if(!listeners[k])continue;
                        t = listeners[k].apply(this, arguments);
                        if(t === true){
                            return t;
                        }
                        if (t !== undefined) {
                            r = t;
                        }
                    }
                }
                if (t = this['on' + ti.toLowerCase()]) {
                    r = t.apply(this, arguments);
                }
            }
            return r;
        }
    };
    /**
     * 获得对象所拥有监听类型的所有监听器
     * @public
     * @function
     * @param {Object} obj  查询监听器的对象
     * @param {String} type 事件类型
     * @param {Boolean} force  为true且当前所有type类型的侦听器不存在时，创建一个空监听器数组
     * @returns {Array} 监听器数组
     */
    function getListener(obj, type, force) {
        var allListeners;
        type = type.toLowerCase();
        return ( ( allListeners = ( obj.__allListeners || force && ( obj.__allListeners = {} ) ) )
            && ( allListeners[type] || force && ( allListeners[type] = [] ) ) );
    }


    ///import editor.js
    ///import core/dom/dom.js
    ///import core/utils.js
    /**
     * dtd html语义化的体现类
     * @constructor
     * @namespace dtd
     */
    var dtd = dom.dtd = (function() {
        function _( s ) {
            for (var k in s) {
                s[k.toUpperCase()] = s[k];
            }
            return s;
        }
        var X = utils.extend2;
        var A = _({isindex:1,fieldset:1}),
            B = _({input:1,button:1,select:1,textarea:1,label:1}),
            C = X( _({a:1}), B ),
            D = X( {iframe:1}, C ),
            E = _({hr:1,ul:1,menu:1,div:1,blockquote:1,noscript:1,table:1,center:1,address:1,dir:1,pre:1,h5:1,dl:1,h4:1,noframes:1,h6:1,ol:1,h1:1,h3:1,h2:1}),
            F = _({ins:1,del:1,script:1,style:1}),
            G = X( _({b:1,acronym:1,bdo:1,'var':1,'#':1,abbr:1,code:1,br:1,i:1,cite:1,kbd:1,u:1,strike:1,s:1,tt:1,strong:1,q:1,samp:1,em:1,dfn:1,span:1}), F ),
            H = X( _({sub:1,img:1,embed:1,object:1,sup:1,basefont:1,map:1,applet:1,font:1,big:1,small:1}), G ),
            I = X( _({p:1}), H ),
            J = X( _({iframe:1}), H, B ),
            K = _({img:1,embed:1,noscript:1,br:1,kbd:1,center:1,button:1,basefont:1,h5:1,h4:1,samp:1,h6:1,ol:1,h1:1,h3:1,h2:1,form:1,font:1,'#':1,select:1,menu:1,ins:1,abbr:1,label:1,code:1,table:1,script:1,cite:1,input:1,iframe:1,strong:1,textarea:1,noframes:1,big:1,small:1,span:1,hr:1,sub:1,bdo:1,'var':1,div:1,object:1,sup:1,strike:1,dir:1,map:1,dl:1,applet:1,del:1,isindex:1,fieldset:1,ul:1,b:1,acronym:1,a:1,blockquote:1,i:1,u:1,s:1,tt:1,address:1,q:1,pre:1,p:1,em:1,dfn:1}),

            L = X( _({a:0}), J ),//a不能被切开，所以把他
            M = _({tr:1}),
            N = _({'#':1}),
            O = X( _({param:1}), K ),
            P = X( _({form:1}), A, D, E, I ),
            Q = _({li:1,ol:1,ul:1}),
            R = _({style:1,script:1}),
            S = _({base:1,link:1,meta:1,title:1}),
            T = X( S, R ),
            U = _({head:1,body:1}),
            V = _({html:1});

        var block = _({address:1,blockquote:1,center:1,dir:1,div:1,dl:1,fieldset:1,form:1,h1:1,h2:1,h3:1,h4:1,h5:1,h6:1,hr:1,isindex:1,menu:1,noframes:1,ol:1,p:1,pre:1,table:1,ul:1}),

            empty =  _({area:1,base:1,basefont:1,br:1,col:1,command:1,dialog:1,embed:1,hr:1,img:1,input:1,isindex:1,keygen:1,link:1,meta:1,param:1,source:1,track:1,wbr:1});

        return  _({

            // $ 表示自定的属性

            // body外的元素列表.
            $nonBodyContent: X( V, U, S ),

            //块结构元素列表
            $block : block,

            //内联元素列表
            $inline : L,

            $inlineWithA : X(_({a:1}),L),

            $body : X( _({script:1,style:1}), block ),

            $cdata : _({script:1,style:1}),

            //自闭和元素
            $empty : empty,

            //不是自闭合，但不能让range选中里边
            $nonChild : _({iframe:1,textarea:1}),
            //列表元素列表
            $listItem : _({dd:1,dt:1,li:1}),

            //列表根元素列表
            $list: _({ul:1,ol:1,dl:1}),

            //不能认为是空的元素
            $isNotEmpty : _({table:1,ul:1,ol:1,dl:1,iframe:1,area:1,base:1,col:1,hr:1,img:1,embed:1,input:1,link:1,meta:1,param:1,h1:1,h2:1,h3:1,h4:1,h5:1,h6:1}),

            //如果没有子节点就可以删除的元素列表，像span,a
            $removeEmpty : _({a:1,abbr:1,acronym:1,address:1,b:1,bdo:1,big:1,cite:1,code:1,del:1,dfn:1,em:1,font:1,i:1,ins:1,label:1,kbd:1,q:1,s:1,samp:1,small:1,span:1,strike:1,strong:1,sub:1,sup:1,tt:1,u:1,'var':1}),

            $removeEmptyBlock : _({'p':1,'div':1}),

            //在table元素里的元素列表
            $tableContent : _({caption:1,col:1,colgroup:1,tbody:1,td:1,tfoot:1,th:1,thead:1,tr:1,table:1}),
            //不转换的标签
            $notTransContent : _({pre:1,script:1,style:1,textarea:1}),
            html: U,
            head: T,
            style: N,
            script: N,
            body: P,
            base: {},
            link: {},
            meta: {},
            title: N,
            col : {},
            tr : _({td:1,th:1}),
            img : {},
            embed: {},
            colgroup : _({thead:1,col:1,tbody:1,tr:1,tfoot:1}),
            noscript : P,
            td : P,
            br : {},
            th : P,
            center : P,
            kbd : L,
            button : X( I, E ),
            basefont : {},
            h5 : L,
            h4 : L,
            samp : L,
            h6 : L,
            ol : Q,
            h1 : L,
            h3 : L,
            option : N,
            h2 : L,
            form : X( A, D, E, I ),
            select : _({optgroup:1,option:1}),
            font : L,
            ins : L,
            menu : Q,
            abbr : L,
            label : L,
            table : _({thead:1,col:1,tbody:1,tr:1,colgroup:1,caption:1,tfoot:1}),
            code : L,
            tfoot : M,
            cite : L,
            li : P,
            input : {},
            iframe : P,
            strong : L,
            textarea : N,
            noframes : P,
            big : L,
            small : L,
            //trace:
            span :_({'#':1,br:1,b:1,strong:1,u:1,i:1,em:1,sub:1,sup:1,strike:1,span:1}),
            hr : L,
            dt : L,
            sub : L,
            optgroup : _({option:1}),
            param : {},
            bdo : L,
            'var' : L,
            div : P,
            object : O,
            sup : L,
            dd : P,
            strike : L,
            area : {},
            dir : Q,
            map : X( _({area:1,form:1,p:1}), A, F, E ),
            applet : O,
            dl : _({dt:1,dd:1}),
            del : L,
            isindex : {},
            fieldset : X( _({legend:1}), K ),
            thead : M,
            ul : Q,
            acronym : L,
            b : L,
            a : X( _({a:1}), J ),
            blockquote :X(_({td:1,tr:1,tbody:1,li:1}),P),
            caption : L,
            i : L,
            u : L,
            tbody : M,
            s : L,
            address : X( D, I ),
            tt : L,
            legend : L,
            q : L,
            pre : X( G, C ),
            p : X(_({'a':1}),L),
            em :L,
            dfn : L
        });
    })();

    /**
     * @file
     * @name UM.dom.domUtils
     * @short DomUtils
     * @import editor.js, core/utils.js,core/browser.js,core/dom/dtd.js
     * @desc UEditor封装的底层dom操作库
     */

    function getDomNode(node, start, ltr, startFromChild, fn, guard) {
        var tmpNode = startFromChild && node[start],
            parent;
        !tmpNode && (tmpNode = node[ltr]);
        while (!tmpNode && (parent = (parent || node).parentNode)) {
            if (parent.tagName == 'BODY' || guard && !guard(parent)) {
                return null;
            }
            tmpNode = parent[ltr];
        }
        if (tmpNode && fn && !fn(tmpNode)) {
            return  getDomNode(tmpNode, start, ltr, false, fn);
        }
        return tmpNode;
    }
    var attrFix = ie && browser.version < 9 ? {
            tabindex: "tabIndex",
            readonly: "readOnly",
            "for": "htmlFor",
            "class": "className",
            maxlength: "maxLength",
            cellspacing: "cellSpacing",
            cellpadding: "cellPadding",
            rowspan: "rowSpan",
            colspan: "colSpan",
            usemap: "useMap",
            frameborder: "frameBorder"
        } : {
            tabindex: "tabIndex",
            readonly: "readOnly"
        },
        styleBlock = utils.listToMap([
            '-webkit-box', '-moz-box', 'block' ,
            'list-item' , 'table' , 'table-row-group' ,
            'table-header-group', 'table-footer-group' ,
            'table-row' , 'table-column-group' , 'table-column' ,
            'table-cell' , 'table-caption'
        ]);
    var domUtils = dom.domUtils = {
        //节点常量
        NODE_ELEMENT: 1,
        NODE_DOCUMENT: 9,
        NODE_TEXT: 3,
        NODE_COMMENT: 8,
        NODE_DOCUMENT_FRAGMENT: 11,

        //位置关系
        POSITION_IDENTICAL: 0,
        POSITION_DISCONNECTED: 1,
        POSITION_FOLLOWING: 2,
        POSITION_PRECEDING: 4,
        POSITION_IS_CONTAINED: 8,
        POSITION_CONTAINS: 16,
        //ie6使用其他的会有一段空白出现
        fillChar: ie && browser.version == '6' ? '\ufeff' : '\u200B',
        //-------------------------Node部分--------------------------------
        keys: {
            /*Backspace*/ 8: 1, /*Delete*/ 46: 1,
            /*Shift*/ 16: 1, /*Ctrl*/ 17: 1, /*Alt*/ 18: 1,
            37: 1, 38: 1, 39: 1, 40: 1,
            13: 1 /*enter*/
        },
        breakParent:function (node, parent) {
            var tmpNode,
                parentClone = node,
                clone = node,
                leftNodes,
                rightNodes;
            do {
                parentClone = parentClone.parentNode;
                if (leftNodes) {
                    tmpNode = parentClone.cloneNode(false);
                    tmpNode.appendChild(leftNodes);
                    leftNodes = tmpNode;
                    tmpNode = parentClone.cloneNode(false);
                    tmpNode.appendChild(rightNodes);
                    rightNodes = tmpNode;
                } else {
                    leftNodes = parentClone.cloneNode(false);
                    rightNodes = leftNodes.cloneNode(false);
                }
                while (tmpNode = clone.previousSibling) {
                    leftNodes.insertBefore(tmpNode, leftNodes.firstChild);
                }
                while (tmpNode = clone.nextSibling) {
                    rightNodes.appendChild(tmpNode);
                }
                clone = parentClone;
            } while (parent !== parentClone);
            tmpNode = parent.parentNode;
            tmpNode.insertBefore(leftNodes, parent);
            tmpNode.insertBefore(rightNodes, parent);
            tmpNode.insertBefore(node, rightNodes);
            domUtils.remove(parent);
            return node;
        },
        trimWhiteTextNode:function (node) {
            function remove(dir) {
                var child;
                while ((child = node[dir]) && child.nodeType == 3 && domUtils.isWhitespace(child)) {
                    node.removeChild(child);
                }
            }
            remove('firstChild');
            remove('lastChild');
        },
        /**
         * 获取节点A相对于节点B的位置关系
         * @name getPosition
         * @grammar UM.dom.domUtils.getPosition(nodeA,nodeB)  =>  Number
         * @example
         *  switch (returnValue) {
         *      case 0: //相等，同一节点
         *      case 1: //无关，节点不相连
         *      case 2: //跟随，即节点A头部位于节点B头部的后面
         *      case 4: //前置，即节点A头部位于节点B头部的前面
         *      case 8: //被包含，即节点A被节点B包含
         *      case 10://组合类型，即节点A满足跟随节点B且被节点B包含。实际上，如果被包含，必定跟随，所以returnValue事实上不会存在8的情况。
         *      case 16://包含，即节点A包含节点B
         *      case 20://组合类型，即节点A满足前置节点A且包含节点B。同样，如果包含，必定前置，所以returnValue事实上也不会存在16的情况
         *  }
         */
        getPosition: function (nodeA, nodeB) {
            // 如果两个节点是同一个节点
            if (nodeA === nodeB) {
                // domUtils.POSITION_IDENTICAL
                return 0;
            }
            var node,
                parentsA = [nodeA],
                parentsB = [nodeB];
            node = nodeA;
            while (node = node.parentNode) {
                // 如果nodeB是nodeA的祖先节点
                if (node === nodeB) {
                    // domUtils.POSITION_IS_CONTAINED + domUtils.POSITION_FOLLOWING
                    return 10;
                }
                parentsA.push(node);
            }
            node = nodeB;
            while (node = node.parentNode) {
                // 如果nodeA是nodeB的祖先节点
                if (node === nodeA) {
                    // domUtils.POSITION_CONTAINS + domUtils.POSITION_PRECEDING
                    return 20;
                }
                parentsB.push(node);
            }
            parentsA.reverse();
            parentsB.reverse();
            if (parentsA[0] !== parentsB[0]) {
                // domUtils.POSITION_DISCONNECTED
                return 1;
            }
            var i = -1;
            while (i++, parentsA[i] === parentsB[i]) {
            }
            nodeA = parentsA[i];
            nodeB = parentsB[i];
            while (nodeA = nodeA.nextSibling) {
                if (nodeA === nodeB) {
                    // domUtils.POSITION_PRECEDING
                    return 4
                }
            }
            // domUtils.POSITION_FOLLOWING
            return  2;
        },

        /**
         * 返回节点node在父节点中的索引位置
         * @name getNodeIndex
         * @grammar UM.dom.domUtils.getNodeIndex(node)  => Number  //索引值从0开始
         */
        getNodeIndex: function (node, ignoreTextNode) {
            var preNode = node,
                i = 0;
            while (preNode = preNode.previousSibling) {
                if (ignoreTextNode && preNode.nodeType == 3) {
                    if (preNode.nodeType != preNode.nextSibling.nodeType) {
                        i++;
                    }
                    continue;
                }
                i++;
            }
            return i;
        },

        /**
         * 检测节点node是否在节点doc的树上，实质上是检测是否被doc包含
         * @name inDoc
         * @grammar UM.dom.domUtils.inDoc(node,doc)   =>  true|false
         */
        inDoc: function (node, doc) {
            return domUtils.getPosition(node, doc) == 10;
        },
        /**
         * 查找node节点的祖先节点
         * @name findParent
         * @grammar UM.dom.domUtils.findParent(node)  => Element  // 直接返回node节点的父节点
         * @grammar UM.dom.domUtils.findParent(node,filterFn)  => Element  //filterFn为过滤函数，node作为参数，返回true时才会将node作为符合要求的节点返回
         * @grammar UM.dom.domUtils.findParent(node,filterFn,includeSelf)  => Element  //includeSelf指定是否包含自身
         */
        findParent: function (node, filterFn, includeSelf) {
            if (node && !domUtils.isBody(node)) {
                node = includeSelf ? node : node.parentNode;
                while (node) {
                    if (!filterFn || filterFn(node) || domUtils.isBody(node)) {
                        return filterFn && !filterFn(node) && domUtils.isBody(node) ? null : node;
                    }
                    node = node.parentNode;
                }
            }
            return null;
        },
        /**
         * 通过tagName查找node节点的祖先节点
         * @name findParentByTagName
         * @grammar UM.dom.domUtils.findParentByTagName(node,tagNames)   =>  Element  //tagNames支持数组，区分大小写
         * @grammar UM.dom.domUtils.findParentByTagName(node,tagNames,includeSelf)   =>  Element  //includeSelf指定是否包含自身
         * @grammar UM.dom.domUtils.findParentByTagName(node,tagNames,includeSelf,excludeFn)   =>  Element  //excludeFn指定例外过滤条件，返回true时忽略该节点
         */
        findParentByTagName: function (node, tagNames, includeSelf, excludeFn) {
            tagNames = utils.listToMap(utils.isArray(tagNames) ? tagNames : [tagNames]);
            return domUtils.findParent(node, function (node) {
                return tagNames[node.tagName] && !(excludeFn && excludeFn(node));
            }, includeSelf);
        },
        /**
         * 查找节点node的祖先节点集合
         * @name findParents
         * @grammar UM.dom.domUtils.findParents(node)  => Array  //返回一个祖先节点数组集合，不包含自身
         * @grammar UM.dom.domUtils.findParents(node,includeSelf)  => Array  //返回一个祖先节点数组集合，includeSelf指定是否包含自身
         * @grammar UM.dom.domUtils.findParents(node,includeSelf,filterFn)  => Array  //返回一个祖先节点数组集合，filterFn指定过滤条件，返回true的node将被选取
         * @grammar UM.dom.domUtils.findParents(node,includeSelf,filterFn,closerFirst)  => Array  //返回一个祖先节点数组集合，closerFirst为true的话，node的直接父亲节点是数组的第0个
         */
        findParents: function (node, includeSelf, filterFn, closerFirst) {
            var parents = includeSelf && ( filterFn && filterFn(node) || !filterFn ) ? [node] : [];
            while (node = domUtils.findParent(node, filterFn)) {
                parents.push(node);
            }
            return closerFirst ? parents : parents.reverse();
        },

        /**
         * 在节点node后面插入新节点newNode
         * @name insertAfter
         * @grammar UM.dom.domUtils.insertAfter(node,newNode)  => newNode
         */
        insertAfter: function (node, newNode) {
            return node.parentNode.insertBefore(newNode, node.nextSibling);
        },

        /**
         * 删除节点node，并根据keepChildren指定是否保留子节点
         * @name remove
         * @grammar UM.dom.domUtils.remove(node)  =>  node
         * @grammar UM.dom.domUtils.remove(node,keepChildren)  =>  node
         */
        remove: function (node, keepChildren) {

            var parent = node.parentNode,
                child;
            if (parent) {
                if (keepChildren && node.hasChildNodes()) {
                    while (child = node.firstChild) {
                        parent.insertBefore(child, node);
                    }
                }
                parent.removeChild(node);
            }
            return node;
        },


        /**
         * 取得node节点的下一个兄弟节点， 如果该节点其后没有兄弟节点， 则递归查找其父节点之后的第一个兄弟节点，
         * 直到找到满足条件的节点或者递归到BODY节点之后才会结束。
         * @method getNextDomNode
         * @param { Node } node 需要获取其后的兄弟节点的节点对象
         * @return { Node | NULL } 如果找满足条件的节点， 则返回该节点， 否则返回NULL
         * @example
         * ```html
         *     <body>
         *      <div id="test">
         *          <span></span>
         *      </div>
         *      <i>xxx</i>
         * </body>
         * <script>
         *
         *     //output: i节点
         *     console.log( UE.dom.domUtils.getNextDomNode( document.getElementById( "test" ) ) );
         *
         * </script>
         * ```
         * @example
         * ```html
         * <body>
         *      <div>
         *          <span></span>
         *          <i id="test">xxx</i>
         *      </div>
         *      <b>xxx</b>
         * </body>
         * <script>
         *
         *     //由于id为test的i节点之后没有兄弟节点， 则查找其父节点（div）后面的兄弟节点
         *     //output: b节点
         *     console.log( UE.dom.domUtils.getNextDomNode( document.getElementById( "test" ) ) );
         *
         * </script>
         * ```
         */

        /**
         * 取得node节点的下一个兄弟节点， 如果startFromChild的值为ture，则先获取其子节点，
         * 如果有子节点则直接返回第一个子节点；如果没有子节点或者startFromChild的值为false，
         * 则执行<a href="#UE.dom.domUtils.getNextDomNode(Node)">getNextDomNode(Node node)</a>的查找过程。
         * @method getNextDomNode
         * @param { Node } node 需要获取其后的兄弟节点的节点对象
         * @param { Boolean } startFromChild 查找过程是否从其子节点开始
         * @return { Node | NULL } 如果找满足条件的节点， 则返回该节点， 否则返回NULL
         * @see UE.dom.domUtils.getNextDomNode(Node)
         */
        getNextDomNode:function (node, startFromChild, filterFn, guard) {
            return getDomNode(node, 'firstChild', 'nextSibling', startFromChild, filterFn, guard);
        },
        getPreDomNode:function (node, startFromChild, filterFn, guard) {
            return getDomNode(node, 'lastChild', 'previousSibling', startFromChild, filterFn, guard);
        },

        /**
         * 检测节点node是否属于bookmark节点
         * @name isBookmarkNode
         * @grammar UM.dom.domUtils.isBookmarkNode(node)  => true|false
         */
        isBookmarkNode: function (node) {
            return node.nodeType == 1 && node.id && /^_baidu_bookmark_/i.test(node.id);
        },
        /**
         * 获取节点node所在的window对象
         * @name  getWindow
         * @grammar UM.dom.domUtils.getWindow(node)  => window对象
         */
        getWindow: function (node) {
            var doc = node.ownerDocument || node;
            return doc.defaultView || doc.parentWindow;
        },

        /**
         * 获取离nodeA与nodeB最近的公共的祖先节点
         * @method  getCommonAncestor
         * @param { Node } nodeA 第一个节点
         * @param { Node } nodeB 第二个节点
         * @remind 如果给定的两个节点是同一个节点， 将直接返回该节点。
         * @return { Node | NULL } 如果未找到公共节点， 返回NULL， 否则返回最近的公共祖先节点。
         * @example
         * ```javascript
         * var commonAncestor = UE.dom.domUtils.getCommonAncestor( document.body, document.body.firstChild );
         * //output: true
         * console.log( commonAncestor.tagName.toLowerCase() === 'body' );
         * ```
         */
        getCommonAncestor:function (nodeA, nodeB) {
            if (nodeA === nodeB)
                return nodeA;
            var parentsA = [nodeA] , parentsB = [nodeB], parent = nodeA, i = -1;
            while (parent = parent.parentNode) {
                if (parent === nodeB) {
                    return parent;
                }
                parentsA.push(parent);
            }
            parent = nodeB;
            while (parent = parent.parentNode) {
                if (parent === nodeA)
                    return parent;
                parentsB.push(parent);
            }
            parentsA.reverse();
            parentsB.reverse();
            while (i++, parentsA[i] === parentsB[i]) {
            }
            return i == 0 ? null : parentsA[i - 1];

        },
        /**
         * 清除node节点左右连续为空的兄弟inline节点
         * @method clearEmptySibling
         * @param { Node } node 执行的节点对象， 如果该节点的左右连续的兄弟节点是空的inline节点，
         * 则这些兄弟节点将被删除
         * @grammar UE.dom.domUtils.clearEmptySibling(node,ignoreNext)  //ignoreNext指定是否忽略右边空节点
         * @grammar UE.dom.domUtils.clearEmptySibling(node,ignoreNext,ignorePre)  //ignorePre指定是否忽略左边空节点
         * @example
         * ```html
         * <body>
         *     <div></div>
         *     <span id="test"></span>
         *     <i></i>
         *     <b></b>
         *     <em>xxx</em>
         *     <span></span>
         * </body>
         * <script>
         *
         *      UE.dom.domUtils.clearEmptySibling( document.getElementById( "test" ) );
         *
         *      //output: <div></div><span id="test"></span><em>xxx</em><span></span>
         *      console.log( document.body.innerHTML );
         *
         * </script>
         * ```
         */

        /**
         * 清除node节点左右连续为空的兄弟inline节点， 如果ignoreNext的值为true，
         * 则忽略对右边兄弟节点的操作。
         * @method clearEmptySibling
         * @param { Node } node 执行的节点对象， 如果该节点的左右连续的兄弟节点是空的inline节点，
         * @param { Boolean } ignoreNext 是否忽略忽略对右边的兄弟节点的操作
         * 则这些兄弟节点将被删除
         * @see UE.dom.domUtils.clearEmptySibling(Node)
         */

        /**
         * 清除node节点左右连续为空的兄弟inline节点， 如果ignoreNext的值为true，
         * 则忽略对右边兄弟节点的操作， 如果ignorePre的值为true，则忽略对左边兄弟节点的操作。
         * @method clearEmptySibling
         * @param { Node } node 执行的节点对象， 如果该节点的左右连续的兄弟节点是空的inline节点，
         * @param { Boolean } ignoreNext 是否忽略忽略对右边的兄弟节点的操作
         * @param { Boolean } ignorePre 是否忽略忽略对左边的兄弟节点的操作
         * 则这些兄弟节点将被删除
         * @see UE.dom.domUtils.clearEmptySibling(Node)
         */
        clearEmptySibling:function (node, ignoreNext, ignorePre) {
            function clear(next, dir) {
                var tmpNode;
                while (next && !domUtils.isBookmarkNode(next) && (domUtils.isEmptyInlineElement(next)
                    //这里不能把空格算进来会吧空格干掉，出现文字间的空格丢掉了
                    || !new RegExp('[^\t\n\r' + domUtils.fillChar + ']').test(next.nodeValue) )) {
                    tmpNode = next[dir];
                    domUtils.remove(next);
                    next = tmpNode;
                }
            }
            !ignoreNext && clear(node.nextSibling, 'nextSibling');
            !ignorePre && clear(node.previousSibling, 'previousSibling');
        },

        /**
         * 将一个文本节点node拆分成两个文本节点，offset指定拆分位置
         * @name split
         * @grammar UM.dom.domUtils.split(node,offset)  =>  TextNode  //返回从切分位置开始的后一个文本节点
         */
        split: function (node, offset) {
            var doc = node.ownerDocument;
            if (browser.ie && offset == node.nodeValue.length) {
                var next = doc.createTextNode('');
                return domUtils.insertAfter(node, next);
            }
            var retval = node.splitText(offset);
            //ie8下splitText不会跟新childNodes,我们手动触发他的更新
            if (browser.ie8) {
                var tmpNode = doc.createTextNode('');
                domUtils.insertAfter(retval, tmpNode);
                domUtils.remove(tmpNode);
            }
            return retval;
        },

        /**
         * 检测节点node是否为空节点（包括空格、换行、占位符等字符）
         * @name  isWhitespace
         * @grammar  UM.dom.domUtils.isWhitespace(node)  => true|false
         */
        isWhitespace: function (node) {
            return !new RegExp('[^ \t\n\r' + domUtils.fillChar + ']').test(node.nodeValue);
        },
        /**
         * 获取元素element相对于viewport的位置坐标
         * @name getXY
         * @grammar UM.dom.domUtils.getXY(element)  => Object //返回坐标对象{x:left,y:top}
         */
        getXY: function (element) {
            var x = 0, y = 0;
            while (element.offsetParent) {
                y += element.offsetTop;
                x += element.offsetLeft;
                element = element.offsetParent;
            }
            return { 'x': x, 'y': y};
        },
        /**
         * 检查节点node是否是空inline节点
         * @name  isEmptyInlineElement
         * @grammar   UM.dom.domUtils.isEmptyInlineElement(node)  => 1|0
         * @example
         * <b><i></i></b> => 1
         * <b><i></i><u></u></b> => 1
         * <b></b> => 1
         * <b>xx<i></i></b> => 0
         */
        isEmptyInlineElement: function (node) {
            if (node.nodeType != 1 || !dtd.$removeEmpty[ node.tagName ]) {
                return 0;
            }
            node = node.firstChild;
            while (node) {
                //如果是创建的bookmark就跳过
                if (domUtils.isBookmarkNode(node)) {
                    return 0;
                }
                if (node.nodeType == 1 && !domUtils.isEmptyInlineElement(node) ||
                    node.nodeType == 3 && !domUtils.isWhitespace(node)
                    ) {
                    return 0;
                }
                node = node.nextSibling;
            }
            return 1;

        },


        /**
         * 检查节点node是否为块元素
         * @name isBlockElm
         * @grammar UM.dom.domUtils.isBlockElm(node)  => true|false
         */
        isBlockElm: function (node) {
            return node.nodeType == 1 && (dtd.$block[node.tagName] || styleBlock[domUtils.getComputedStyle(node, 'display')]) && !dtd.$nonChild[node.tagName];
        },


        /**
         * 原生方法getElementsByTagName的封装
         * @name getElementsByTagName
         * @grammar UM.dom.domUtils.getElementsByTagName(node,tagName)  => Array  //节点集合数组
         */
        getElementsByTagName: function (node, name, filter) {
            if (filter && utils.isString(filter)) {
                var className = filter;
                filter = function (node) {
                    var result = false;
                    $.each(utils.trim(className).replace(/[ ]{2,}/g, ' ').split(' '), function (i, v) {
                        if ($(node).hasClass(v)) {
                            result = true;
                            return false;
                        }
                    })
                    return result;
                }
            }
            name = utils.trim(name).replace(/[ ]{2,}/g, ' ').split(' ');
            var arr = [];
            for (var n = 0, ni; ni = name[n++];) {
                var list = node.getElementsByTagName(ni);
                for (var i = 0, ci; ci = list[i++];) {
                    if (!filter || filter(ci))
                        arr.push(ci);
                }
            }
            return arr;
        },


        /**
         * 设置节点node及其子节点不会被选中
         * @name unSelectable
         * @grammar UM.dom.domUtils.unSelectable(node)
         */
        unSelectable: ie && browser.ie9below || browser.opera ? function (node) {
            //for ie9
            node.onselectstart = function () {
                return false;
            };
            node.onclick = node.onkeyup = node.onkeydown = function () {
                return false;
            };
            node.unselectable = 'on';
            node.setAttribute("unselectable", "on");
            for (var i = 0, ci; ci = node.all[i++];) {
                switch (ci.tagName.toLowerCase()) {
                    case 'iframe' :
                    case 'textarea' :
                    case 'input' :
                    case 'select' :
                        break;
                    default :
                        ci.unselectable = 'on';
                        node.setAttribute("unselectable", "on");
                }
            }
        } : function (node) {
            node.style.MozUserSelect =
                node.style.webkitUserSelect =
                        node.style.msUserSelect =
                            node.style.KhtmlUserSelect = 'none';
        },
        /**
         * 删除节点node上的属性attrNames，attrNames为属性名称数组
         * @name  removeAttributes
         * @grammar UM.dom.domUtils.removeAttributes(node,attrNames)
         * @example
         * //Before remove
         * <span style="font-size:14px;" id="test" name="followMe">xxxxx</span>
         * //Remove
         * UM.dom.domUtils.removeAttributes(node,["id","name"]);
         * //After remove
         * <span style="font-size:14px;">xxxxx</span>
         */
        removeAttributes: function (node, attrNames) {
            attrNames = utils.isArray(attrNames) ? attrNames : utils.trim(attrNames).replace(/[ ]{2,}/g, ' ').split(' ');
            for (var i = 0, ci; ci = attrNames[i++];) {
                ci = attrFix[ci] || ci;
                switch (ci) {
                    case 'className':
                        node[ci] = '';
                        break;
                    case 'style':
                        node.style.cssText = '';
                        !browser.ie && node.removeAttributeNode(node.getAttributeNode('style'))
                }
                node.removeAttribute(ci);
            }
        },
        /**
         * 在doc下创建一个标签名为tag，属性为attrs的元素
         * @name createElement
         * @grammar UM.dom.domUtils.createElement(doc,tag,attrs)  =>  Node  //返回创建的节点
         */
        createElement: function (doc, tag, attrs) {
            return domUtils.setAttributes(doc.createElement(tag), attrs)
        },
        /**
         * 为节点node添加属性attrs，attrs为属性键值对
         * @name setAttributes
         * @grammar UM.dom.domUtils.setAttributes(node,attrs)  => node
         */
        setAttributes: function (node, attrs) {
            for (var attr in attrs) {
                if (attrs.hasOwnProperty(attr)) {
                    var value = attrs[attr];
                    switch (attr) {
                        case 'class':
                            //ie下要这样赋值，setAttribute不起作用
                            node.className = value;
                            break;
                        case 'style' :
                            node.style.cssText = node.style.cssText + ";" + value;
                            break;
                        case 'innerHTML':
                            node[attr] = value;
                            break;
                        case 'value':
                            node.value = value;
                            break;
                        default:
                            node.setAttribute(attrFix[attr] || attr, value);
                    }
                }
            }
            return node;
        },

        /**
         * 获取元素element的计算样式
         * @name getComputedStyle
         * @grammar UM.dom.domUtils.getComputedStyle(element,styleName)  => String //返回对应样式名称的样式值
         * @example
         * getComputedStyle(document.body,"font-size")  =>  "15px"
         * getComputedStyle(form,"color")  =>  "#ffccdd"
         */
        getComputedStyle: function (element, styleName) {
            return utils.transUnitToPx(utils.fixColor(styleName, $(element).css(styleName)));
        },

        /**
         * 阻止事件默认行为
         * @param {Event} evt    需要组织的事件对象
         */
        preventDefault: function (evt) {
            evt.preventDefault ? evt.preventDefault() : (evt.returnValue = false);
        },

        /**
         * 删除元素element指定的样式
         * @method removeStyle
         * @param { Element } element 需要删除样式的元素
         * @param { String } styleName 需要删除的样式名
         * @example
         * ```html
         * <span id="test" style="color: red; background: blue;"></span>
         *
         * <script>
         *
         *     var testNode = document.getElementById("test");
         *
         *     UE.dom.domUtils.removeStyle( testNode, 'color' );
         *
         *     //output: background: blue;
         *     console.log( testNode.style.cssText );
         *
         * </script>
         * ```
         */
        removeStyle:function (element, name) {
            if(browser.ie ){
                //针对color先单独处理一下
                if(name == 'color'){
                    name = '(^|;)' + name;
                }
                element.style.cssText = element.style.cssText.replace(new RegExp(name + '[^:]*:[^;]+;?','ig'),'')
            }else{
                if (element.style.removeProperty) {
                    element.style.removeProperty (name);
                }else {
                    element.style.removeAttribute (utils.cssStyleToDomStyle(name));
                }
            }


            if (!element.style.cssText) {
                domUtils.removeAttributes(element, ['style']);
            }
        },

        /**
         * 获取元素element的某个样式值
         * @name getStyle
         * @grammar UM.dom.domUtils.getStyle(element,name)  => String
         */
        getStyle: function (element, name) {
            var value = element.style[ utils.cssStyleToDomStyle(name) ];
            return utils.fixColor(name, value);
        },
        /**
         * 为元素element设置样式属性值
         * @name setStyle
         * @grammar UM.dom.domUtils.setStyle(element,name,value)
         */
        setStyle: function (element, name, value) {
            element.style[utils.cssStyleToDomStyle(name)] = value;
            if (!utils.trim(element.style.cssText)) {
                this.removeAttributes(element, 'style')
            }
        },

        /**
         * 删除_moz_dirty属性
         * @function
         */
        removeDirtyAttr: function (node) {
            for (var i = 0, ci, nodes = node.getElementsByTagName('*'); ci = nodes[i++];) {
                ci.removeAttribute('_moz_dirty');
            }
            node.removeAttribute('_moz_dirty');
        },
        /**
         * 返回子节点的数量
         * @function
         * @param {Node}    node    父节点
         * @param  {Function}    fn    过滤子节点的规则，若为空，则得到所有子节点的数量
         * @return {Number}    符合条件子节点的数量
         */
        getChildCount: function (node, fn) {
            var count = 0, first = node.firstChild;
            fn = fn || function () {
                return 1;
            };
            while (first) {
                if (fn(first)) {
                    count++;
                }
                first = first.nextSibling;
            }
            return count;
        },

        /**
         * 判断是否为空节点
         * @function
         * @param {Node}    node    节点
         * @return {Boolean}    是否为空节点
         */
        isEmptyNode: function (node) {
            return !node.firstChild || domUtils.getChildCount(node, function (node) {
                return  !domUtils.isBr(node) && !domUtils.isBookmarkNode(node) && !domUtils.isWhitespace(node)
            }) == 0
        },

        /**
         * 判断节点是否为br
         * @function
         * @param {Node}    node   节点
         */
        isBr: function (node) {
            return node.nodeType == 1 && node.tagName == 'BR';
        },
        isFillChar: function (node, isInStart) {
            return node.nodeType == 3 && !node.nodeValue.replace(new RegExp((isInStart ? '^' : '' ) + domUtils.fillChar), '').length
        },

        isEmptyBlock: function (node, reg) {
            if (node.nodeType != 1)
                return 0;
            reg = reg || new RegExp('[ \t\r\n' + domUtils.fillChar + ']', 'g');
            if (node[browser.ie ? 'innerText' : 'textContent'].replace(reg, '').length > 0) {
                return 0;
            }
            for (var n in dtd.$isNotEmpty) {
                if (node.getElementsByTagName(n).length) {
                    return 0;
                }
            }
            return 1;
        },

        //判断是否是编辑器自定义的参数
        isCustomeNode: function (node) {
            return node.nodeType == 1 && node.getAttribute('_ue_custom_node_');
        },
        fillNode: function (doc, node) {
            var tmpNode = browser.ie ? doc.createTextNode(domUtils.fillChar) : doc.createElement('br');
            node.innerHTML = '';
            node.appendChild(tmpNode);
        },
        isBoundaryNode: function (node, dir) {
            var tmp;
            while (!domUtils.isBody(node)) {
                tmp = node;
                node = node.parentNode;
                if (tmp !== node[dir]) {
                    return false;
                }
            }
            return true;
        },
        isFillChar: function (node, isInStart) {
            return node.nodeType == 3 && !node.nodeValue.replace(new RegExp((isInStart ? '^' : '' ) + domUtils.fillChar), '').length
        },
        isBody: function(node){
            return $(node).hasClass('edui-body-container');
        }
    };
    var fillCharReg = new RegExp(domUtils.fillChar, 'g');
    ///import editor.js
    ///import core/utils.js
    ///import core/browser.js
    ///import core/dom/dom.js
    ///import core/dom/dtd.js
    ///import core/dom/domUtils.js
    /**
     * @file
     * @name UM.dom.Range
     * @anthor zhanyi
     * @short Range
     * @import editor.js,core/utils.js,core/browser.js,core/dom/domUtils.js,core/dom/dtd.js
     * @desc Range范围实现类，本类是UEditor底层核心类，统一w3cRange和ieRange之间的差异，包括接口和属性
     */
    (function () {
        var guid = 0,
            fillChar = domUtils.fillChar,
            fillData;

        /**
         * 更新range的collapse状态
         * @param  {Range}   range    range对象
         */
        function updateCollapse(range) {
            range.collapsed =
                range.startContainer && range.endContainer &&
                    range.startContainer === range.endContainer &&
                    range.startOffset == range.endOffset;
        }

        function selectOneNode(rng){
            return !rng.collapsed && rng.startContainer.nodeType == 1 && rng.startContainer === rng.endContainer && rng.endOffset - rng.startOffset == 1
        }
        function setEndPoint(toStart, node, offset, range) {
            //如果node是自闭合标签要处理
            if (node.nodeType == 1 && (dtd.$empty[node.tagName] || dtd.$nonChild[node.tagName])) {
                offset = domUtils.getNodeIndex(node) + (toStart ? 0 : 1);
                node = node.parentNode;
            }
            if (toStart) {
                range.startContainer = node;
                range.startOffset = offset;
                if (!range.endContainer) {
                    range.collapse(true);
                }
            } else {
                range.endContainer = node;
                range.endOffset = offset;
                if (!range.startContainer) {
                    range.collapse(false);
                }
            }
            updateCollapse(range);
            return range;
        }


        /**
         * @name Range
         * @grammar new UM.dom.Range(document)  => Range 实例
         * @desc 创建一个跟document绑定的空的Range实例
         * - ***startContainer*** 开始边界的容器节点,可以是elementNode或者是textNode
         * - ***startOffset*** 容器节点中的偏移量，如果是elementNode就是childNodes中的第几个，如果是textNode就是nodeValue的第几个字符
         * - ***endContainer*** 结束边界的容器节点,可以是elementNode或者是textNode
         * - ***endOffset*** 容器节点中的偏移量，如果是elementNode就是childNodes中的第几个，如果是textNode就是nodeValue的第几个字符
         * - ***document*** 跟range关联的document对象
         * - ***collapsed*** 是否是闭合状态
         */
        var Range = dom.Range = function (document,body) {
            var me = this;
            me.startContainer =
                me.startOffset =
                    me.endContainer =
                        me.endOffset = null;
            me.document = document;
            me.collapsed = true;
            me.body = body;
        };

        /**
         * 删除fillData
         * @param doc
         * @param excludeNode
         */
        function removeFillData(doc, excludeNode) {
            try {
                if (fillData && domUtils.inDoc(fillData, doc)) {
                    if (!fillData.nodeValue.replace(fillCharReg, '').length) {
                        var tmpNode = fillData.parentNode;
                        domUtils.remove(fillData);
                        while (tmpNode && domUtils.isEmptyInlineElement(tmpNode) &&
                            //safari的contains有bug
                            (browser.safari ? !(domUtils.getPosition(tmpNode,excludeNode) & domUtils.POSITION_CONTAINS) : !tmpNode.contains(excludeNode))
                            ) {
                            fillData = tmpNode.parentNode;
                            domUtils.remove(tmpNode);
                            tmpNode = fillData;
                        }
                    } else {
                        fillData.nodeValue = fillData.nodeValue.replace(fillCharReg, '');
                    }
                }
            } catch (e) {
            }
        }

        /**
         *
         * @param node
         * @param dir
         */
        function mergeSibling(node, dir) {
            var tmpNode;
            node = node[dir];
            while (node && domUtils.isFillChar(node)) {
                tmpNode = node[dir];
                domUtils.remove(node);
                node = tmpNode;
            }
        }

        function execContentsAction(range, action) {
            //调整边界
            //range.includeBookmark();
            var start = range.startContainer,
                end = range.endContainer,
                startOffset = range.startOffset,
                endOffset = range.endOffset,
                doc = range.document,
                frag = doc.createDocumentFragment(),
                tmpStart, tmpEnd;
            if (start.nodeType == 1) {
                start = start.childNodes[startOffset] || (tmpStart = start.appendChild(doc.createTextNode('')));
            }
            if (end.nodeType == 1) {
                end = end.childNodes[endOffset] || (tmpEnd = end.appendChild(doc.createTextNode('')));
            }
            if (start === end && start.nodeType == 3) {
                frag.appendChild(doc.createTextNode(start.substringData(startOffset, endOffset - startOffset)));
                //is not clone
                if (action) {
                    start.deleteData(startOffset, endOffset - startOffset);
                    range.collapse(true);
                }
                return frag;
            }
            var current, currentLevel, clone = frag,
                startParents = domUtils.findParents(start, true), endParents = domUtils.findParents(end, true);
            for (var i = 0; startParents[i] == endParents[i];) {
                i++;
            }
            for (var j = i, si; si = startParents[j]; j++) {
                current = si.nextSibling;
                if (si == start) {
                    if (!tmpStart) {
                        if (range.startContainer.nodeType == 3) {
                            clone.appendChild(doc.createTextNode(start.nodeValue.slice(startOffset)));
                            //is not clone
                            if (action) {
                                start.deleteData(startOffset, start.nodeValue.length - startOffset);
                            }
                        } else {
                            clone.appendChild(!action ? start.cloneNode(true) : start);
                        }
                    }
                } else {
                    currentLevel = si.cloneNode(false);
                    clone.appendChild(currentLevel);
                }
                while (current) {
                    if (current === end || current === endParents[j]) {
                        break;
                    }
                    si = current.nextSibling;
                    clone.appendChild(!action ? current.cloneNode(true) : current);
                    current = si;
                }
                clone = currentLevel;
            }
            clone = frag;
            if (!startParents[i]) {
                clone.appendChild(startParents[i - 1].cloneNode(false));
                clone = clone.firstChild;
            }
            for (var j = i, ei; ei = endParents[j]; j++) {
                current = ei.previousSibling;
                if (ei == end) {
                    if (!tmpEnd && range.endContainer.nodeType == 3) {
                        clone.appendChild(doc.createTextNode(end.substringData(0, endOffset)));
                        //is not clone
                        if (action) {
                            end.deleteData(0, endOffset);
                        }
                    }
                } else {
                    currentLevel = ei.cloneNode(false);
                    clone.appendChild(currentLevel);
                }
                //如果两端同级，右边第一次已经被开始做了
                if (j != i || !startParents[i]) {
                    while (current) {
                        if (current === start) {
                            break;
                        }
                        ei = current.previousSibling;
                        clone.insertBefore(!action ? current.cloneNode(true) : current, clone.firstChild);
                        current = ei;
                    }
                }
                clone = currentLevel;
            }
            if (action) {
                range.setStartBefore(!endParents[i] ? endParents[i - 1] : !startParents[i] ? startParents[i - 1] : endParents[i]).collapse(true);
            }
            tmpStart && domUtils.remove(tmpStart);
            tmpEnd && domUtils.remove(tmpEnd);
            return frag;
        }
        Range.prototype = {
            /**
             * @name deleteContents
             * @grammar range.deleteContents()  => Range
             * @desc 删除当前选区范围中的所有内容并返回range实例，这时的range已经变成了闭合状态
             * @example
             * DOM Element :
             * <b>x<i>x[x<i>xx]x</b>
             * //执行方法后
             * <b>x<i>x<i>|x</b>
             * 注意range改变了
             * range.startContainer => b
             * range.startOffset  => 2
             * range.endContainer => b
             * range.endOffset => 2
             * range.collapsed => true
             */
            deleteContents:function () {
                var txt;
                if (!this.collapsed) {
                    execContentsAction(this, 1);
                }
                if (browser.webkit) {
                    txt = this.startContainer;
                    if (txt.nodeType == 3 && !txt.nodeValue.length) {
                        this.setStartBefore(txt).collapse(true);
                        domUtils.remove(txt);
                    }
                }
                return this;
            },
            inFillChar : function(){
                var start = this.startContainer;
                if(this.collapsed && start.nodeType == 3
                    && start.nodeValue.replace(new RegExp('^' + domUtils.fillChar),'').length + 1 == start.nodeValue.length
                    ){
                    return true;
                }
                return false;
            },
            /**
             * @name  setStart
             * @grammar range.setStart(node,offset)  => Range
             * @desc    设置range的开始位置位于node节点内，偏移量为offset
             * 如果node是elementNode那offset指的是childNodes中的第几个，如果是textNode那offset指的是nodeValue的第几个字符
             */
            setStart:function (node, offset) {
                return setEndPoint(true, node, offset, this);
            },
            /**
             * 设置range的结束位置位于node节点，偏移量为offset
             * 如果node是elementNode那offset指的是childNodes中的第几个，如果是textNode那offset指的是nodeValue的第几个字符
             * @name  setEnd
             * @grammar range.setEnd(node,offset)  => Range
             */
            setEnd:function (node, offset) {
                return setEndPoint(false, node, offset, this);
            },
            /**
             * 将Range开始位置设置到node节点之后
             * @name  setStartAfter
             * @grammar range.setStartAfter(node)  => Range
             * @example
             * <b>xx<i>x|x</i>x</b>
             * 执行setStartAfter(i)后
             * range.startContainer =>b
             * range.startOffset =>2
             */
            setStartAfter:function (node) {
                return this.setStart(node.parentNode, domUtils.getNodeIndex(node) + 1);
            },
            /**
             * 将Range开始位置设置到node节点之前
             * @name  setStartBefore
             * @grammar range.setStartBefore(node)  => Range
             * @example
             * <b>xx<i>x|x</i>x</b>
             * 执行setStartBefore(i)后
             * range.startContainer =>b
             * range.startOffset =>1
             */
            setStartBefore:function (node) {
                return this.setStart(node.parentNode, domUtils.getNodeIndex(node));
            },
            /**
             * 将Range结束位置设置到node节点之后
             * @name  setEndAfter
             * @grammar range.setEndAfter(node)  => Range
             * @example
             * <b>xx<i>x|x</i>x</b>
             * setEndAfter(i)后
             * range.endContainer =>b
             * range.endtOffset =>2
             */
            setEndAfter:function (node) {
                return this.setEnd(node.parentNode, domUtils.getNodeIndex(node) + 1);
            },
            /**
             * 将Range结束位置设置到node节点之前
             * @name  setEndBefore
             * @grammar range.setEndBefore(node)  => Range
             * @example
             * <b>xx<i>x|x</i>x</b>
             * 执行setEndBefore(i)后
             * range.endContainer =>b
             * range.endtOffset =>1
             */
            setEndBefore:function (node) {
                return this.setEnd(node.parentNode, domUtils.getNodeIndex(node));
            },
            /**
             * 将Range开始位置设置到node节点内的开始位置
             * @name  setStartAtFirst
             * @grammar range.setStartAtFirst(node)  => Range
             */
            setStartAtFirst:function (node) {
                return this.setStart(node, 0);
            },
            /**
             * 将Range开始位置设置到node节点内的结束位置
             * @name  setStartAtLast
             * @grammar range.setStartAtLast(node)  => Range
             */
            setStartAtLast:function (node) {
                return this.setStart(node, node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length);
            },
            /**
             * 将Range结束位置设置到node节点内的开始位置
             * @name  setEndAtFirst
             * @grammar range.setEndAtFirst(node)  => Range
             */
            setEndAtFirst:function (node) {
                return this.setEnd(node, 0);
            },
            /**
             * 将Range结束位置设置到node节点内的结束位置
             * @name  setEndAtLast
             * @grammar range.setEndAtLast(node)  => Range
             */
            setEndAtLast:function (node) {
                return this.setEnd(node, node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length);
            },

            /**
             * 选中完整的指定节点,并返回包含该节点的range
             * @name  selectNode
             * @grammar range.selectNode(node)  => Range
             */
            selectNode:function (node) {
                return this.setStartBefore(node).setEndAfter(node);
            },
            /**
             * 选中node内部的所有节点，并返回对应的range
             * @name selectNodeContents
             * @grammar range.selectNodeContents(node)  => Range
             * @example
             * <b>xx[x<i>xxx</i>]xxx</b>
             * 执行后
             * <b>[xxx<i>xxx</i>xxx]</b>
             * range.startContainer =>b
             * range.startOffset =>0
             * range.endContainer =>b
             * range.endOffset =>3
             */
            selectNodeContents:function (node) {
                return this.setStart(node, 0).setEndAtLast(node);
            },

            /**
             * 克隆一个新的range对象
             * @name  cloneRange
             * @grammar range.cloneRange() => Range
             */
            cloneRange:function () {
                var me = this;
                return new Range(me.document).setStart(me.startContainer, me.startOffset).setEnd(me.endContainer, me.endOffset);

            },

            /**
             * 让选区闭合到尾部，若toStart为真，则闭合到头部
             * @name  collapse
             * @grammar range.collapse() => Range
             * @grammar range.collapse(true) => Range   //闭合选区到头部
             */
            collapse:function (toStart) {
                var me = this;
                if (toStart) {
                    me.endContainer = me.startContainer;
                    me.endOffset = me.startOffset;
                } else {
                    me.startContainer = me.endContainer;
                    me.startOffset = me.endOffset;
                }
                me.collapsed = true;
                return me;
            },

            /**
             * 调整range的边界，使其"收缩"到最小的位置
             * @name  shrinkBoundary
             * @grammar range.shrinkBoundary()  => Range  //range开始位置和结束位置都调整，参见<code><a href="#adjustmentboundary">adjustmentBoundary</a></code>
             * @grammar range.shrinkBoundary(true)  => Range  //仅调整开始位置，忽略结束位置
             * @example
             * <b>xx[</b>xxxxx] ==> <b>xx</b>[xxxxx]
             * <b>x[xx</b><i>]xxx</i> ==> <b>x[xx]</b><i>xxx</i>
             * [<b><i>xxxx</i>xxxxxxx</b>] ==> <b><i>[xxxx</i>xxxxxxx]</b>
             */
            shrinkBoundary:function (ignoreEnd) {
                var me = this, child,
                    collapsed = me.collapsed;
                function check(node){
                    return node.nodeType == 1 && !domUtils.isBookmarkNode(node) && !dtd.$empty[node.tagName] && !dtd.$nonChild[node.tagName]
                }
                while (me.startContainer.nodeType == 1 //是element
                    && (child = me.startContainer.childNodes[me.startOffset]) //子节点也是element
                    && check(child)) {
                    me.setStart(child, 0);
                }
                if (collapsed) {
                    return me.collapse(true);
                }
                if (!ignoreEnd) {
                    while (me.endContainer.nodeType == 1//是element
                        && me.endOffset > 0 //如果是空元素就退出 endOffset=0那么endOffst-1为负值，childNodes[endOffset]报错
                        && (child = me.endContainer.childNodes[me.endOffset - 1]) //子节点也是element
                        && check(child)) {
                        me.setEnd(child, child.childNodes.length);
                    }
                }
                return me;
            },

            /**
             * 调整边界容器，如果是textNode,就调整到elementNode上
             * @name trimBoundary
             * @grammar range.trimBoundary([ignoreEnd])  => Range //true忽略结束边界
             * @example
             * DOM Element :
             * <b>|xxx</b>
             * startContainer = xxx; startOffset = 0
             * //执行后本方法后
             * startContainer = <b>;  startOffset = 0
             * @example
             * Dom Element :
             * <b>xx|x</b>
             * startContainer = xxx;  startOffset = 2
             * //执行本方法后，xxx被实实在在地切分成两个TextNode
             * startContainer = <b>; startOffset = 1
             */
            trimBoundary:function (ignoreEnd) {
                this.txtToElmBoundary();
                var start = this.startContainer,
                    offset = this.startOffset,
                    collapsed = this.collapsed,
                    end = this.endContainer;
                if (start.nodeType == 3) {
                    if (offset == 0) {
                        this.setStartBefore(start);
                    } else {
                        if (offset >= start.nodeValue.length) {
                            this.setStartAfter(start);
                        } else {
                            var textNode = domUtils.split(start, offset);
                            //跟新结束边界
                            if (start === end) {
                                this.setEnd(textNode, this.endOffset - offset);
                            } else if (start.parentNode === end) {
                                this.endOffset += 1;
                            }
                            this.setStartBefore(textNode);
                        }
                    }
                    if (collapsed) {
                        return this.collapse(true);
                    }
                }
                if (!ignoreEnd) {
                    offset = this.endOffset;
                    end = this.endContainer;
                    if (end.nodeType == 3) {
                        if (offset == 0) {
                            this.setEndBefore(end);
                        } else {
                            offset < end.nodeValue.length && domUtils.split(end, offset);
                            this.setEndAfter(end);
                        }
                    }
                }
                return this;
            },
            /**
             * 如果选区在文本的边界上，就扩展选区到文本的父节点上
             * @name  txtToElmBoundary
             * @example
             * Dom Element :
             * <b> |xxx</b>
             * startContainer = xxx;  startOffset = 0
             * //本方法执行后
             * startContainer = <b>; startOffset = 0
             * @example
             * Dom Element :
             * <b> xxx| </b>
             * startContainer = xxx; startOffset = 3
             * //本方法执行后
             * startContainer = <b>; startOffset = 1
             */
            txtToElmBoundary:function (ignoreCollapsed) {
                function adjust(r, c) {
                    var container = r[c + 'Container'],
                        offset = r[c + 'Offset'];
                    if (container.nodeType == 3) {
                        if (!offset) {
                            r['set' + c.replace(/(\w)/, function (a) {
                                return a.toUpperCase();
                            }) + 'Before'](container);
                        } else if (offset >= container.nodeValue.length) {
                            r['set' + c.replace(/(\w)/, function (a) {
                                return a.toUpperCase();
                            }) + 'After' ](container);
                        }
                    }
                }

                if (ignoreCollapsed || !this.collapsed) {
                    adjust(this, 'start');
                    adjust(this, 'end');
                }
                return this;
            },

            /**
             * 在当前选区的开始位置前插入一个节点或者fragment，range的开始位置会在插入节点的前边
             * @name  insertNode
             * @grammar range.insertNode(node)  => Range //node可以是textNode,elementNode,fragment
             * @example
             * Range :
             * xxx[x<p>xxxx</p>xxxx]x<p>sdfsdf</p>
             * 待插入Node :
             * <p>ssss</p>
             * 执行本方法后的Range :
             * xxx[<p>ssss</p>x<p>xxxx</p>xxxx]x<p>sdfsdf</p>
             */
            insertNode:function (node) {
                var first = node, length = 1;
                if (node.nodeType == 11) {
                    first = node.firstChild;
                    length = node.childNodes.length;
                }
                this.trimBoundary(true);
                var start = this.startContainer,
                    offset = this.startOffset;
                var nextNode = start.childNodes[ offset ];
                if (nextNode) {
                    start.insertBefore(node, nextNode);
                } else {
                    start.appendChild(node);
                }
                if (first.parentNode === this.endContainer) {
                    this.endOffset = this.endOffset + length;
                }
                return this.setStartBefore(first);
            },
            /**
             * 设置光标闭合位置,toEnd设置为true时光标将闭合到选区的结尾
             * @name  setCursor
             * @grammar range.setCursor([toEnd])  =>  Range   //toEnd为true时，光标闭合到选区的末尾
             */
            setCursor:function (toEnd, noFillData) {
                return this.collapse(!toEnd).select(noFillData);
            },
            /**
             * 创建当前range的一个书签，记录下当前range的位置，方便当dom树改变时，还能找回原来的选区位置
             * @name createBookmark
             * @grammar range.createBookmark([serialize])  => Object  //{start:开始标记,end:结束标记,id:serialize} serialize为真时，开始结束标记是插入节点的id，否则是插入节点的引用
             */
            createBookmark:function (serialize, same) {
                var endNode,
                    startNode = this.document.createElement('span');
                startNode.style.cssText = 'display:none;line-height:0px;';
                startNode.appendChild(this.document.createTextNode('\u200D'));
                startNode.id = '_baidu_bookmark_start_' + (same ? '' : guid++);

                if (!this.collapsed) {
                    endNode = startNode.cloneNode(true);
                    endNode.id = '_baidu_bookmark_end_' + (same ? '' : guid++);
                }
                this.insertNode(startNode);
                if (endNode) {
                    this.collapse().insertNode(endNode).setEndBefore(endNode);
                }
                this.setStartAfter(startNode);
                return {
                    start:serialize ? startNode.id : startNode,
                    end:endNode ? serialize ? endNode.id : endNode : null,
                    id:serialize
                }
            },
            /**
             *  移动边界到书签位置，并删除插入的书签节点
             *  @name  moveToBookmark
             *  @grammar range.moveToBookmark(bookmark)  => Range //让当前的range选到给定bookmark的位置,bookmark对象是由range.createBookmark创建的
             */
            moveToBookmark:function (bookmark) {
                var start = bookmark.id ? this.document.getElementById(bookmark.start) : bookmark.start,
                    end = bookmark.end && bookmark.id ? this.document.getElementById(bookmark.end) : bookmark.end;
                this.setStartBefore(start);
                domUtils.remove(start);
                if (end) {
                    this.setEndBefore(end);
                    domUtils.remove(end);
                } else {
                    this.collapse(true);
                }
                return this;
            },

            /**
             * 调整Range的边界，使其"缩小"到最合适的位置
             * @name adjustmentBoundary
             * @grammar range.adjustmentBoundary() => Range   //参见<code><a href="#shrinkboundary">shrinkBoundary</a></code>
             * @example
             * <b>xx[</b>xxxxx] ==> <b>xx</b>[xxxxx]
             * <b>x[xx</b><i>]xxx</i> ==> <b>x[xx</b>]<i>xxx</i>
             */
            adjustmentBoundary:function () {
                if (!this.collapsed) {
                    while (!domUtils.isBody(this.startContainer) &&
                        this.startOffset == this.startContainer[this.startContainer.nodeType == 3 ? 'nodeValue' : 'childNodes'].length &&
                        this.startContainer[this.startContainer.nodeType == 3 ? 'nodeValue' : 'childNodes'].length
                        ) {

                        this.setStartAfter(this.startContainer);
                    }
                    while (!domUtils.isBody(this.endContainer) && !this.endOffset &&
                        this.endContainer[this.endContainer.nodeType == 3 ? 'nodeValue' : 'childNodes'].length
                        ) {
                        this.setEndBefore(this.endContainer);
                    }
                }
                return this;
            },

            /**
             * 得到一个自闭合的节点,常用于获取自闭和的节点，例如图片节点
             * @name  getClosedNode
             * @grammar range.getClosedNode()  => node|null
             * @example
             * <b>xxxx[<img />]xxx</b>
             */
            getClosedNode:function () {
                var node;
                if (!this.collapsed) {
                    var range = this.cloneRange().adjustmentBoundary().shrinkBoundary();
                    if (selectOneNode(range)) {
                        var child = range.startContainer.childNodes[range.startOffset];
                        if (child && child.nodeType == 1 && (dtd.$empty[child.tagName] || dtd.$nonChild[child.tagName])) {
                            node = child;
                        }
                    }
                }
                return node;
            },
            /**
             * 根据当前range选中内容节点（在页面上表现为反白显示）
             * @name select
             * @grammar range.select();  => Range
             */
            select:browser.ie ? function (noFillData, textRange) {
                var nativeRange;
                if (!this.collapsed)
                    this.shrinkBoundary();
                var node = this.getClosedNode();
                if (node && !textRange) {
                    try {
                        nativeRange = this.document.body.createControlRange();
                        nativeRange.addElement(node);
                        nativeRange.select();
                    } catch (e) {}
                    return this;
                }
                var bookmark = this.createBookmark(),
                    start = bookmark.start,
                    end;
                nativeRange = this.document.body.createTextRange();
                nativeRange.moveToElementText(start);
                nativeRange.moveStart('character', 1);
                if (!this.collapsed) {
                    var nativeRangeEnd = this.document.body.createTextRange();
                    end = bookmark.end;
                    nativeRangeEnd.moveToElementText(end);
                    nativeRange.setEndPoint('EndToEnd', nativeRangeEnd);
                } else {
                    if (!noFillData && this.startContainer.nodeType != 3) {
                        //使用<span>|x<span>固定住光标
                        var tmpText = this.document.createTextNode(fillChar),
                            tmp = this.document.createElement('span');
                        tmp.appendChild(this.document.createTextNode(fillChar));
                        start.parentNode.insertBefore(tmp, start);
                        start.parentNode.insertBefore(tmpText, start);
                        //当点b,i,u时，不能清除i上边的b
                        removeFillData(this.document, tmpText);
                        fillData = tmpText;
                        mergeSibling(tmp, 'previousSibling');
                        mergeSibling(start, 'nextSibling');
                        nativeRange.moveStart('character', -1);
                        nativeRange.collapse(true);
                    }
                }
                this.moveToBookmark(bookmark);
                tmp && domUtils.remove(tmp);
                //IE在隐藏状态下不支持range操作，catch一下
                try {
                    nativeRange.select();
                } catch (e) {
                }
                return this;
            } : function (notInsertFillData) {
                function checkOffset(rng){

                    function check(node,offset,dir){
                        if(node.nodeType == 3 && node.nodeValue.length < offset){
                            rng[dir + 'Offset'] = node.nodeValue.length
                        }
                    }
                    check(rng.startContainer,rng.startOffset,'start');
                    check(rng.endContainer,rng.endOffset,'end');
                }
                var win = domUtils.getWindow(this.document),
                    sel = win.getSelection(),
                    txtNode;
                //FF下关闭自动长高时滚动条在关闭dialog时会跳
                //ff下如果不body.focus将不能定位闭合光标到编辑器内
                browser.gecko ? this.body.focus() : win.focus();
                if (sel) {
                    sel.removeAllRanges();
                    // trace:870 chrome/safari后边是br对于闭合得range不能定位 所以去掉了判断
                    // this.startContainer.nodeType != 3 &&! ((child = this.startContainer.childNodes[this.startOffset]) && child.nodeType == 1 && child.tagName == 'BR'
                    if (this.collapsed && !notInsertFillData) {
    //                    //opear如果没有节点接着，原生的不能够定位,不能在body的第一级插入空白节点
    //                    if (notInsertFillData && browser.opera && !domUtils.isBody(this.startContainer) && this.startContainer.nodeType == 1) {
    //                        var tmp = this.document.createTextNode('');
    //                        this.insertNode(tmp).setStart(tmp, 0).collapse(true);
    //                    }
    //
                        //处理光标落在文本节点的情况
                        //处理以下的情况
                        //<b>|xxxx</b>
                        //<b>xxxx</b>|xxxx
                        //xxxx<b>|</b>
                        var start = this.startContainer,child = start;
                        if(start.nodeType == 1){
                            child = start.childNodes[this.startOffset];

                        }
                        if( !(start.nodeType == 3 && this.startOffset)  &&
                            (child ?
                                (!child.previousSibling || child.previousSibling.nodeType != 3)
                                :
                                (!start.lastChild || start.lastChild.nodeType != 3)
                                )
                            ){
                            txtNode = this.document.createTextNode(fillChar);
                            //跟着前边走
                            this.insertNode(txtNode);
                            removeFillData(this.document, txtNode);
                            mergeSibling(txtNode, 'previousSibling');
                            mergeSibling(txtNode, 'nextSibling');
                            fillData = txtNode;
                            this.setStart(txtNode, browser.webkit ? 1 : 0).collapse(true);
                        }
                    }
                    var nativeRange = this.document.createRange();
                    if(this.collapsed && browser.opera && this.startContainer.nodeType == 1){
                        var child = this.startContainer.childNodes[this.startOffset];
                        if(!child){
                            //往前靠拢
                            child = this.startContainer.lastChild;
                            if( child && domUtils.isBr(child)){
                                this.setStartBefore(child).collapse(true);
                            }
                        }else{
                            //向后靠拢
                            while(child && domUtils.isBlockElm(child)){
                                if(child.nodeType == 1 && child.childNodes[0]){
                                    child = child.childNodes[0]
                                }else{
                                    break;
                                }
                            }
                            child && this.setStartBefore(child).collapse(true)
                        }

                    }
                    //是createAddress最后一位算的不准，现在这里进行微调
                    checkOffset(this);
                    nativeRange.setStart(this.startContainer, this.startOffset);
                    nativeRange.setEnd(this.endContainer, this.endOffset);
                    sel.addRange(nativeRange);
                }
                return this;
            },
          

            createAddress : function(ignoreEnd,ignoreTxt){
                var addr = {},me = this;

                function getAddress(isStart){
                    var node = isStart ? me.startContainer : me.endContainer;
                    var parents = domUtils.findParents(node,true,function(node){return !domUtils.isBody(node)}),
                        addrs = [];
                    for(var i = 0,ci;ci = parents[i++];){
                        addrs.push(domUtils.getNodeIndex(ci,ignoreTxt));
                    }
                    var firstIndex = 0;

                    if(ignoreTxt){
                        if(node.nodeType == 3){
                            var tmpNode = node.previousSibling;
                            while(tmpNode && tmpNode.nodeType == 3){
                                firstIndex += tmpNode.nodeValue.replace(fillCharReg,'').length;
                                tmpNode = tmpNode.previousSibling;
                            }
                            firstIndex +=  (isStart ? me.startOffset : me.endOffset)// - (fillCharReg.test(node.nodeValue) ? 1 : 0 )
                        }else{
                            node =  node.childNodes[ isStart ? me.startOffset : me.endOffset];
                            if(node){
                                firstIndex = domUtils.getNodeIndex(node,ignoreTxt);
                            }else{
                                node = isStart ? me.startContainer : me.endContainer;
                                var first = node.firstChild;
                                while(first){
                                    if(domUtils.isFillChar(first)){
                                        first = first.nextSibling;
                                        continue;
                                    }
                                    firstIndex++;
                                    if(first.nodeType == 3){
                                        while( first && first.nodeType == 3){
                                            first = first.nextSibling;
                                        }
                                    }else{
                                        first = first.nextSibling;
                                    }
                                }
                            }
                        }

                    }else{
                        firstIndex = isStart ? domUtils.isFillChar(node) ? 0 : me.startOffset  : me.endOffset
                    }
                    if(firstIndex < 0){
                        firstIndex = 0;
                    }
                    addrs.push(firstIndex);
                    return addrs;
                }
                addr.startAddress = getAddress(true);
                if(!ignoreEnd){
                    addr.endAddress = me.collapsed ? [].concat(addr.startAddress) : getAddress();
                }
                return addr;
            },
            moveToAddress : function(addr,ignoreEnd){
                var me = this;
                function getNode(address,isStart){
                    var tmpNode = me.body,
                        parentNode,offset;
                    for(var i= 0,ci,l=address.length;i<l;i++){
                        ci = address[i];
                        parentNode = tmpNode;
                        tmpNode = tmpNode.childNodes[ci];
                        if(!tmpNode){
                            offset = ci;
                            break;
                        }
                    }
                    if(isStart){
                        if(tmpNode){
                            me.setStartBefore(tmpNode)
                        }else{
                            me.setStart(parentNode,offset)
                        }
                    }else{
                        if(tmpNode){
                            me.setEndBefore(tmpNode)
                        }else{
                            me.setEnd(parentNode,offset)
                        }
                    }
                }
                getNode(addr.startAddress,true);
                !ignoreEnd && addr.endAddress &&  getNode(addr.endAddress);
                return me;
            },
            equals : function(rng){
                for(var p in this){
                    if(this.hasOwnProperty(p)){
                        if(this[p] !== rng[p])
                            return false
                    }
                }
                return true;

            },
            scrollIntoView : function(){
                var $span = $('<span style="padding:0;margin:0;display:block;border:0">&nbsp;</span>');
                this.cloneRange().insertNode($span.get(0));
                var winScrollTop = $(window).scrollTop(),
                    winHeight = $(window).height(),
                    spanTop = $span.offset().top;
                if(spanTop < winScrollTop-winHeight || spanTop > winScrollTop + winHeight ){
                    if(spanTop > winScrollTop + winHeight){
                        window.scrollTo(0,spanTop - winHeight + $span.height())
                    }else{
                        window.scrollTo(0,winScrollTop - spanTop)
                    }

                }
                $span.remove();
            },
            getOffset : function(){
                var bk = this.createBookmark();
                var offset = $(bk.start).css('display','inline-block').offset();
                this.moveToBookmark(bk);
                return offset
            }
        };
    })();
    ///import editor.js
    ///import core/browser.js
    ///import core/dom/dom.js
    ///import core/dom/dtd.js
    ///import core/dom/domUtils.js
    ///import core/dom/Range.js
    /**
     * @class UM.dom.Selection    Selection类
     */
    (function () {

        function getBoundaryInformation( range, start ) {
            var getIndex = domUtils.getNodeIndex;
            range = range.duplicate();
            range.collapse( start );
            var parent = range.parentElement();
            //如果节点里没有子节点，直接退出
            if ( !parent.hasChildNodes() ) {
                return  {container:parent, offset:0};
            }
            var siblings = parent.children,
                child,
                testRange = range.duplicate(),
                startIndex = 0, endIndex = siblings.length - 1, index = -1,
                distance;
            while ( startIndex <= endIndex ) {
                index = Math.floor( (startIndex + endIndex) / 2 );
                child = siblings[index];
                testRange.moveToElementText( child );
                var position = testRange.compareEndPoints( 'StartToStart', range );
                if ( position > 0 ) {
                    endIndex = index - 1;
                } else if ( position < 0 ) {
                    startIndex = index + 1;
                } else {
                    //trace:1043
                    return  {container:parent, offset:getIndex( child )};
                }
            }
            if ( index == -1 ) {
                testRange.moveToElementText( parent );
                testRange.setEndPoint( 'StartToStart', range );
                distance = testRange.text.replace( /(\r\n|\r)/g, '\n' ).length;
                siblings = parent.childNodes;
                if ( !distance ) {
                    child = siblings[siblings.length - 1];
                    return  {container:child, offset:child.nodeValue.length};
                }

                var i = siblings.length;
                while ( distance > 0 ){
                    distance -= siblings[ --i ].nodeValue.length;
                }
                return {container:siblings[i], offset:-distance};
            }
            testRange.collapse( position > 0 );
            testRange.setEndPoint( position > 0 ? 'StartToStart' : 'EndToStart', range );
            distance = testRange.text.replace( /(\r\n|\r)/g, '\n' ).length;
            if ( !distance ) {
                return  dtd.$empty[child.tagName] || dtd.$nonChild[child.tagName] ?
                {container:parent, offset:getIndex( child ) + (position > 0 ? 0 : 1)} :
                {container:child, offset:position > 0 ? 0 : child.childNodes.length}
            }
            while ( distance > 0 ) {
                try {
                    var pre = child;
                    child = child[position > 0 ? 'previousSibling' : 'nextSibling'];
                    distance -= child.nodeValue.length;
                } catch ( e ) {
                    return {container:parent, offset:getIndex( pre )};
                }
            }
            return  {container:child, offset:position > 0 ? -distance : child.nodeValue.length + distance}
        }

        /**
         * 将ieRange转换为Range对象
         * @param {Range}   ieRange    ieRange对象
         * @param {Range}   range      Range对象
         * @return  {Range}  range       返回转换后的Range对象
         */
        function transformIERangeToRange( ieRange, range ) {
            if ( ieRange.item ) {
                range.selectNode( ieRange.item( 0 ) );
            } else {
                var bi = getBoundaryInformation( ieRange, true );
                range.setStart( bi.container, bi.offset );
                if ( ieRange.compareEndPoints( 'StartToEnd', ieRange ) != 0 ) {
                    bi = getBoundaryInformation( ieRange, false );
                    range.setEnd( bi.container, bi.offset );
                }
            }
            return range;
        }

        /**
         * 获得ieRange
         * @param {Selection} sel    Selection对象
         * @return {ieRange}    得到ieRange
         */
        function _getIERange( sel,txtRange ) {
            var ieRange;
            //ie下有可能报错
            try {
                ieRange = sel.getNative(txtRange).createRange();
            } catch ( e ) {
                return null;
            }
            var el = ieRange.item ? ieRange.item( 0 ) : ieRange.parentElement();
            if ( ( el.ownerDocument || el ) === sel.document ) {
                return ieRange;
            }
            return null;
        }

        var Selection = dom.Selection = function ( doc,body ) {
            var me = this;
            me.document = doc;
            me.body = body;
            if ( browser.ie9below ) {
                $( body).on('beforedeactivate', function () {
                    me._bakIERange = me.getIERange();
                } ).on('activate', function () {
                    try {
                        var ieNativRng =  _getIERange( me );
                        if ( (!ieNativRng || !me.rangeInBody(ieNativRng)) && me._bakIERange ) {
                            me._bakIERange.select();
                        }
                    } catch ( ex ) {
                    }
                    me._bakIERange = null;
                } );
            }
        };

        Selection.prototype = {
            hasNativeRange : function(){
                var rng;
                if(!browser.ie || browser.ie9above){
                    var nativeSel = this.getNative();
                    if(!nativeSel.rangeCount){
                        return false;
                    }
                    rng = nativeSel.getRangeAt(0);
                }else{
                    rng = _getIERange(this);
                }
                return this.rangeInBody(rng);
            },
            /**
             * 获取原生seleciton对象
             * @public
             * @function
             * @name    UM.dom.Selection.getNative
             * @return {Selection}    获得selection对象
             */
            getNative:function (txtRange) {
                var doc = this.document;
                try {
                    return !doc ? null : browser.ie9below || txtRange? doc.selection : domUtils.getWindow( doc ).getSelection();
                } catch ( e ) {
                    return null;
                }
            },
            /**
             * 获得ieRange
             * @public
             * @function
             * @name    UM.dom.Selection.getIERange
             * @return {ieRange}    返回ie原生的Range
             */
            getIERange:function (txtRange) {
                var ieRange = _getIERange( this,txtRange );
                if ( !ieRange  || !this.rangeInBody(ieRange,txtRange)) {
                    if ( this._bakIERange ) {
                        return this._bakIERange;
                    }
                }
                return ieRange;
            },
            rangeInBody : function(rng,txtRange){
                var node = browser.ie9below || txtRange ? rng.item ? rng.item() : rng.parentElement() : rng.startContainer;

                return node === this.body || domUtils.inDoc(node,this.body);
            },
            /**
             * 缓存当前选区的range和选区的开始节点
             * @public
             * @function
             * @name    UM.dom.Selection.cache
             */
            cache:function () {
                this.clear();
                this._cachedRange = this.getRange();
                this._cachedStartElement = this.getStart();
                this._cachedStartElementPath = this.getStartElementPath();
            },

            getStartElementPath:function () {
                if ( this._cachedStartElementPath ) {
                    return this._cachedStartElementPath;
                }
                var start = this.getStart();
                if ( start ) {
                    return domUtils.findParents( start, true, null, true )
                }
                return [];
            },
            /**
             * 清空缓存
             * @public
             * @function
             * @name    UM.dom.Selection.clear
             */
            clear:function () {
                this._cachedStartElementPath = this._cachedRange = this._cachedStartElement = null;
            },
            /**
             * 编辑器是否得到了选区
             */
            isFocus:function () {
                return this.hasNativeRange()

            },
            /**
             * 获取选区对应的Range
             * @public
             * @function
             * @name    UM.dom.Selection.getRange
             * @returns {UM.dom.Range}    得到Range对象
             */
            getRange:function () {
                var me = this;
                function optimze( range ) {
                    var child = me.body.firstChild,
                        collapsed = range.collapsed;
                    while ( child && child.firstChild ) {
                        range.setStart( child, 0 );
                        child = child.firstChild;
                    }
                    if ( !range.startContainer ) {
                        range.setStart( me.body, 0 )
                    }
                    if ( collapsed ) {
                        range.collapse( true );
                    }
                }

                if ( me._cachedRange != null ) {
                    return this._cachedRange;
                }
                var range = new dom.Range( me.document,me.body );
                if ( browser.ie9below ) {
                    var nativeRange = me.getIERange();
                    if ( nativeRange  && this.rangeInBody(nativeRange)) {

                        try{
                            transformIERangeToRange( nativeRange, range );
                        }catch(e){
                            optimze( range );
                        }

                    } else {
                        optimze( range );
                    }
                } else {
                    var sel = me.getNative();
                    if ( sel && sel.rangeCount && me.rangeInBody(sel.getRangeAt( 0 ))) {
                        var firstRange = sel.getRangeAt( 0 );
                        var lastRange = sel.getRangeAt( sel.rangeCount - 1 );
                        range.setStart( firstRange.startContainer, firstRange.startOffset ).setEnd( lastRange.endContainer, lastRange.endOffset );
                        if ( range.collapsed && domUtils.isBody( range.startContainer ) && !range.startOffset ) {
                            optimze( range );
                        }
                    } else {
                        //trace:1734 有可能已经不在dom树上了，标识的节点
                        if ( this._bakRange && (this._bakRange.startContainer === this.body || domUtils.inDoc( this._bakRange.startContainer, this.body )) ){
                            return this._bakRange;
                        }
                        optimze( range );
                    }
                }

                return this._bakRange = range;
            },

            /**
             * 获取开始元素，用于状态反射
             * @public
             * @function
             * @name    UM.dom.Selection.getStart
             * @return {Element}     获得开始元素
             */
            getStart:function () {
                if ( this._cachedStartElement ) {
                    return this._cachedStartElement;
                }
                var range = browser.ie9below ? this.getIERange() : this.getRange(),
                    tmpRange,
                    start, tmp, parent;
                if ( browser.ie9below ) {
                    if ( !range ) {
                        //todo 给第一个值可能会有问题
                        return this.document.body.firstChild;
                    }
                    //control元素
                    if ( range.item ){
                        return range.item( 0 );
                    }
                    tmpRange = range.duplicate();
                    //修正ie下<b>x</b>[xx] 闭合后 <b>x|</b>xx
                    tmpRange.text.length > 0 && tmpRange.moveStart( 'character', 1 );
                    tmpRange.collapse( 1 );
                    start = tmpRange.parentElement();
                    parent = tmp = range.parentElement();
                    while ( tmp = tmp.parentNode ) {
                        if ( tmp == start ) {
                            start = parent;
                            break;
                        }
                    }
                } else {
                    start = range.startContainer;
                    if ( start.nodeType == 1 && start.hasChildNodes() ){
                        start = start.childNodes[Math.min( start.childNodes.length - 1, range.startOffset )];
                    }
                    if ( start.nodeType == 3 ){
                        return start.parentNode;
                    }
                }
                return start;
            },
            /**
             * 得到选区中的文本
             * @public
             * @function
             * @name    UM.dom.Selection.getText
             * @return  {String}    选区中包含的文本
             */
            getText:function () {
                var nativeSel, nativeRange;
                if ( this.isFocus() && (nativeSel = this.getNative()) ) {
                    nativeRange = browser.ie9below ? nativeSel.createRange() : nativeSel.getRangeAt( 0 );
                    return browser.ie9below ? nativeRange.text : nativeRange.toString();
                }
                return '';
            }
        };
    })();
    /**
     * @file
     * @name UM.Editor
     * @short Editor
     * @import editor.js,core/utils.js,core/EventBase.js,core/browser.js,core/dom/dtd.js,core/dom/domUtils.js,core/dom/Range.js,core/dom/Selection.js,plugins/serialize.js
     * @desc 编辑器主类，包含编辑器提供的大部分公用接口
     */
    (function () {
        var uid = 0, _selectionChangeTimer;

        /**
         * @private
         * @ignore
         * @param form  编辑器所在的form元素
         * @param editor  编辑器实例对象
         */
        function setValue(form, editor) {
            var textarea;
            if (editor.textarea) {
                if (utils.isString(editor.textarea)) {
                    for (var i = 0, ti, tis = domUtils.getElementsByTagName(form, 'textarea'); ti = tis[i++];) {
                        if (ti.id == 'umeditor_textarea_' + editor.options.textarea) {
                            textarea = ti;
                            break;
                        }
                    }
                } else {
                    textarea = editor.textarea;
                }
            }
            if (!textarea) {
                form.appendChild(textarea = domUtils.createElement(document, 'textarea', {
                    'name': editor.options.textarea,
                    'id': 'umeditor_textarea_' + editor.options.textarea,
                    'style': "display:none"
                }));
                //不要产生多个textarea
                editor.textarea = textarea;
            }
            textarea.value = editor.hasContents() ?
                (editor.options.allHtmlEnabled ? editor.getAllHtml() : editor.getContent(null, null, true)) :
                ''
        }
        function loadPlugins(me){
            //初始化插件
            for (var pi in UM.plugins) {
                if(me.options.excludePlugins.indexOf(pi) == -1){
                    UM.plugins[pi].call(me);
                    me.plugins[pi] = 1;
                }
            }
            me.langIsReady = true;

            me.fireEvent("langReady");
        }
        function checkCurLang(I18N){
            for(var lang in I18N){
                return lang
            }
        }
        /**
         * UEditor编辑器类
         * @name Editor
         * @desc 创建一个跟编辑器实例
         * - ***container*** 编辑器容器对象
         * - ***iframe*** 编辑区域所在的iframe对象
         * - ***window*** 编辑区域所在的window
         * - ***document*** 编辑区域所在的document对象
         * - ***body*** 编辑区域所在的body对象
         * - ***selection*** 编辑区域的选区对象
         */
        var Editor = UM.Editor = function (options) {
            var me = this;
            me.uid = uid++;
            EventBase.call(me);
            me.commands = {};
            me.options = utils.extend(utils.clone(options || {}), UMEDITOR_CONFIG, true);
            me.shortcutkeys = {};
            me.inputRules = [];
            me.outputRules = [];
            //设置默认的常用属性
            me.setOpt({
                isShow: true,
                initialContent: '',
                initialStyle:'',
                autoClearinitialContent: false,
                textarea: 'editorValue',
                focus: false,
                focusInEnd: true,
                autoClearEmptyNode: true,
                fullscreen: false,
                readonly: false,
                zIndex: 999,
                enterTag: 'p',
                lang: 'zh-cn',
                langPath: me.options.UMEDITOR_HOME_URL + 'lang/',
                theme: 'default',
                themePath: me.options.UMEDITOR_HOME_URL + 'themes/',
                allHtmlEnabled: false,
                autoSyncData : true,
                autoHeightEnabled : true,
                excludePlugins:''
            });
            me.plugins = {};
            if(!utils.isEmptyObject(UM.I18N)){
                //修改默认的语言类型
                me.options.lang = checkCurLang(UM.I18N);
                loadPlugins(me)
            }else{
                utils.loadFile(document, {
                    src: me.options.langPath + me.options.lang + "/" + me.options.lang + ".js",
                    tag: "script",
                    type: "text/javascript",
                    defer: "defer"
                }, function () {
                    loadPlugins(me)
                });
            }

        };
        Editor.prototype = {
            /**
             * 当编辑器ready后执行传入的fn,如果编辑器已经完成ready，就马上执行fn，fn的中的this是编辑器实例。
             * 大部分的实例接口都需要放在该方法内部执行，否则在IE下可能会报错。
             * @name ready
             * @grammar editor.ready(fn) fn是当编辑器渲染好后执行的function
             * @example
             * var editor = new UM.ui.Editor();
             * editor.render("myEditor");
             * editor.ready(function(){
             *     editor.setContent("欢迎使用UEditor！");
             * })
             */
            ready: function (fn) {
                var me = this;
                if (fn) {
                    me.isReady ? fn.apply(me) : me.addListener('ready', fn);
                }
            },
            /**
             * 为编辑器设置默认参数值。若用户配置为空，则以默认配置为准
             * @grammar editor.setOpt(key,value);      //传入一个键、值对
             * @grammar editor.setOpt({ key:value});   //传入一个json对象
             */
            setOpt: function (key, val) {
                var obj = {};
                if (utils.isString(key)) {
                    obj[key] = val
                } else {
                    obj = key;
                }
                utils.extend(this.options, obj, true);
            },
            getOpt:function(key){
                return this.options[key] || ''
            },
            /**
             * 销毁编辑器实例对象
             * @name destroy
             * @grammar editor.destroy();
             */
            destroy: function () {

                var me = this;
                me.fireEvent('destroy');
                var container = me.container.parentNode;
                if(container === document.body){
                    container = me.container;
                }
                var textarea = me.textarea;
                if (!textarea) {
                    textarea = document.createElement('textarea');
                    container.parentNode.insertBefore(textarea, container);
                } else {
                    textarea.style.display = ''
                }

                textarea.style.width = me.body.offsetWidth + 'px';
                textarea.style.height = me.body.offsetHeight + 'px';
                textarea.value = me.getContent();
                textarea.id = me.key;
                if(container.contains(textarea)){
                    $(textarea).insertBefore(container);
                }
                container.innerHTML = '';

                domUtils.remove(container);
                UM.clearCache(me.id);
                //trace:2004
                for (var p in me) {
                    if (me.hasOwnProperty(p)) {
                        delete this[p];
                    }
                }

            },
            initialCont : function(holder){

                if(holder){
                    holder.getAttribute('name') && ( this.options.textarea = holder.getAttribute('name'));
                    if (holder && /script|textarea/ig.test(holder.tagName)) {
                        var newDiv = document.createElement('div');
                        holder.parentNode.insertBefore(newDiv, holder);
                        this.options.initialContent = UM.htmlparser(holder.value || holder.innerHTML|| this.options.initialContent).toHtml();
                        holder.className && (newDiv.className = holder.className);
                        holder.style.cssText && (newDiv.style.cssText = holder.style.cssText);

                        if (/textarea/i.test(holder.tagName)) {
                            this.textarea = holder;
                            this.textarea.style.display = 'none';

                        } else {
                            holder.parentNode.removeChild(holder);
                            holder.id && (newDiv.id = holder.id);
                        }
                        holder = newDiv;
                        holder.innerHTML = '';
                    }
                    return holder;
                }else{
                    return null;
                }

            },
            /**
             * 渲染编辑器的DOM到指定容器，必须且只能调用一次
             * @name render
             * @grammar editor.render(containerId);    //可以指定一个容器ID
             * @grammar editor.render(containerDom);   //也可以直接指定容器对象
             */
            render: function (container) {
                var me = this,
                    options = me.options,
                    getStyleValue=function(attr){
                        return parseInt($(container).css(attr));
                    };

                if (utils.isString(container)) {
                    container = document.getElementById(container);
                }
                if (container) {
                    this.id = container.getAttribute('id');
                    UM.setEditor(this);
                    utils.cssRule('edui-style-body',me.options.initialStyle,document);

                    container = this.initialCont(container);

                    container.className += ' edui-body-container';

                    if(options.initialFrameWidth){
                        options.minFrameWidth = options.initialFrameWidth
                    }else{
                        //都没给值，先写死了
                        options.minFrameWidth = options.initialFrameWidth = $(container).width() || UM.defaultWidth;
                    }
                    if(options.initialFrameHeight){
                        options.minFrameHeight = options.initialFrameHeight
                    }else{

                        options.initialFrameHeight = options.minFrameHeight = $(container).height() || UM.defaultHeight;
                    }

                    container.style.width = /%$/.test(options.initialFrameWidth) ?  '100%' : options.initialFrameWidth -
                        getStyleValue("padding-left")-
                        getStyleValue("padding-right")  +'px';

                    var height = /%$/.test(options.initialFrameHeight) ?  '100%' : (options.initialFrameHeight - getStyleValue("padding-top")- getStyleValue("padding-bottom") );
                    if(this.options.autoHeightEnabled){
                        container.style.minHeight = height +'px';
                        container.style.height = '';
                        if(browser.ie && browser.version <= 6){
                            container.style.height = height ;
                            container.style.setExpression('height', 'this.scrollHeight <= ' + height + ' ? "' + height + 'px" : "auto"');
                        }
                    }else{
                        $(container).height(height)
                    }
                    container.style.zIndex = options.zIndex;
                    this._setup(container);

                }
            },
            /**
             * 编辑器初始化
             * @private
             * @ignore
             * @param {Element} doc 编辑器Iframe中的文档对象
             */
            _setup: function (cont) {
                var me = this,
                    options = me.options;

                cont.contentEditable = true;
                document.body.spellcheck = false;

                me.document = document;
                me.window = document.defaultView || document.parentWindow;
                me.body = cont;
                me.$body = $(cont);
                me.selection = new dom.Selection(document,me.body);
                me._isEnabled = false;
                //gecko初始化就能得到range,无法判断isFocus了
                var geckoSel;
                if (browser.gecko && (geckoSel = this.selection.getNative())) {
                    geckoSel.removeAllRanges();
                }
                this._initEvents();
                //为form提交提供一个隐藏的textarea
                for (var form = cont.parentNode; form && !domUtils.isBody(form); form = form.parentNode) {
                    if (form.tagName == 'FORM') {
                        me.form = form;
                        if(me.options.autoSyncData){
                            $(cont).on('blur',function(){
                                setValue(form,me);
                            })
                        }else{
                            $(form).on('submit', function () {
                                setValue(this, me);
                            })
                        }
                        break;
                    }
                }
                if (options.initialContent) {
                    if (options.autoClearinitialContent) {
                        var oldExecCommand = me.execCommand;
                        me.execCommand = function () {
                            me.fireEvent('firstBeforeExecCommand');
                            return oldExecCommand.apply(me, arguments);
                        };
                        this._setDefaultContent(options.initialContent);
                    } else
                        this.setContent(options.initialContent, false, true);
                }

                //编辑器不能为空内容

                if (domUtils.isEmptyNode(me.body)) {
                    me.body.innerHTML = '<p>' + (browser.ie ? '' : '<br/>') + '</p>';
                }
                //如果要求focus, 就把光标定位到内容开始
                if (options.focus) {
                    setTimeout(function () {
                        me.focus(me.options.focusInEnd);
                        //如果自动清除开着，就不需要做selectionchange;
                        !me.options.autoClearinitialContent && me._selectionChange();
                    }, 0);
                }
                if (!me.container) {
                    me.container = cont.parentNode;
                }

                me._bindshortcutKeys();
                me.isReady = 1;
                me.fireEvent('ready');
                options.onready && options.onready.call(me);
                if(!browser.ie || browser.ie9above){

                    $(me.body).on( 'blur focus', function (e) {
                        var nSel = me.selection.getNative();
                        //chrome下会出现alt+tab切换时，导致选区位置不对
                        if (e.type == 'blur') {
                            if(nSel.rangeCount > 0 ){
                                me._bakRange = nSel.getRangeAt(0);
                            }
                        } else {
                            try {
                                me._bakRange && nSel.addRange(me._bakRange)
                            } catch (e) {
                            }
                            me._bakRange = null;
                        }
                    });
                }

                !options.isShow && me.setHide();
                options.readonly && me.setDisabled();
            },
            /**
             * 同步编辑器的数据，为提交数据做准备，主要用于你是手动提交的情况
             * @name sync
             * @grammar editor.sync(); //从编辑器的容器向上查找，如果找到就同步数据
             * @grammar editor.sync(formID); //formID制定一个要同步数据的form的id,编辑器的数据会同步到你指定form下
             * @desc
             * 后台取得数据得键值使用你容器上得''name''属性，如果没有就使用参数传入的''textarea''
             * @example
             * editor.sync();
             * form.sumbit(); //form变量已经指向了form元素
             *
             */
            sync: function (formId) {
                var me = this,
                    form = formId ? document.getElementById(formId) :
                        domUtils.findParent(me.body.parentNode, function (node) {
                            return node.tagName == 'FORM'
                        }, true);
                form && setValue(form, me);
            },
            /**
             * 设置编辑器高度
             * @name setHeight
             * @grammar editor.setHeight(number);  //纯数值，不带单位
             */
            setHeight: function (height,notSetHeight) {
                !notSetHeight && (this.options.initialFrameHeight = height);
                if(this.options.autoHeightEnabled){
                    $(this.body).css({
                        'min-height':height + 'px'
                    });
                    if(browser.ie && browser.version <= 6 && this.container){
                        this.container.style.height = height ;
                        this.container.style.setExpression('height', 'this.scrollHeight <= ' + height + ' ? "' + height + 'px" : "auto"');
                    }
                }else{
                    $(this.body).height(height)
                }
                this.fireEvent('resize');
            },
            /**
             * 设置编辑器宽度
             * @name setWidth
             * @grammar editor.setWidth(number);  //纯数值，不带单位
             */
            setWidth:function(width){
                this.$container && this.$container.width(width);
                $(this.body).width(width - $(this.body).css('padding-left').replace('px','') * 1 - $(this.body).css('padding-right').replace('px','') * 1);
                this.fireEvent('resize');
            },
            addshortcutkey: function (cmd, keys) {
                var obj = {};
                if (keys) {
                    obj[cmd] = keys
                } else {
                    obj = cmd;
                }
                utils.extend(this.shortcutkeys, obj)
            },
            _bindshortcutKeys: function () {
                var me = this, shortcutkeys = this.shortcutkeys;
                me.addListener('keydown', function (type, e) {
                    var keyCode = e.keyCode || e.which;
                    for (var i in shortcutkeys) {
                        var tmp = shortcutkeys[i].split(',');
                        for (var t = 0, ti; ti = tmp[t++];) {
                            ti = ti.split(':');
                            var key = ti[0], param = ti[1];
                            if (/^(ctrl)(\+shift)?\+(\d+)$/.test(key.toLowerCase()) || /^(\d+)$/.test(key)) {
                                if (( (RegExp.$1 == 'ctrl' ? (e.ctrlKey || e.metaKey) : 0)
                                    && (RegExp.$2 != "" ? e[RegExp.$2.slice(1) + "Key"] : 1)
                                    && keyCode == RegExp.$3
                                    ) ||
                                    keyCode == RegExp.$1
                                    ) {
                                    if (me.queryCommandState(i,param) != -1)
                                        me.execCommand(i, param);
                                    domUtils.preventDefault(e);
                                }
                            }
                        }

                    }
                });
            },
            /**
             * 获取编辑器内容
             * @name getContent
             * @grammar editor.getContent()  => String //若编辑器中只包含字符"&lt;p&gt;&lt;br /&gt;&lt;/p/&gt;"会返回空。
             * @grammar editor.getContent(fn)  => String
             * @example
             * getContent默认是会现调用hasContents来判断编辑器是否为空，如果是，就直接返回空字符串
             * 你也可以传入一个fn来接替hasContents的工作，定制判断的规则
             * editor.getContent(function(){
             *     return false //编辑器没有内容 ，getContent直接返回空
             * })
             */
            getContent: function (cmd, fn,notSetCursor,ignoreBlank,formatter) {
                var me = this;
                if (cmd && utils.isFunction(cmd)) {
                    fn = cmd;
                    cmd = '';
                }
                if (fn ? !fn() : !this.hasContents()) {
                    return '';
                }
                me.fireEvent('beforegetcontent');
                var root = UM.htmlparser(me.body.innerHTML,ignoreBlank);
                me.filterOutputRule(root);
                me.fireEvent('aftergetcontent',root);
                return  root.toHtml(formatter);
            },
            /**
             * 取得完整的html代码，可以直接显示成完整的html文档
             * @name getAllHtml
             * @grammar editor.getAllHtml()  => String
             */
            getAllHtml: function () {
                var me = this,
                    headHtml = [],
                    html = '';
                me.fireEvent('getAllHtml', headHtml);
                if (browser.ie && browser.version > 8) {
                    var headHtmlForIE9 = '';
                    utils.each(me.document.styleSheets, function (si) {
                        headHtmlForIE9 += ( si.href ? '<link rel="stylesheet" type="text/css" href="' + si.href + '" />' : '<style>' + si.cssText + '</style>');
                    });
                    utils.each(me.document.getElementsByTagName('script'), function (si) {
                        headHtmlForIE9 += si.outerHTML;
                    });
                }
                return '<html><head>' + (me.options.charset ? '<meta http-equiv="Content-Type" content="text/html; charset=' + me.options.charset + '"/>' : '')
                    + (headHtmlForIE9 || me.document.getElementsByTagName('head')[0].innerHTML) + headHtml.join('\n') + '</head>'
                    + '<body ' + (ie && browser.version < 9 ? 'class="view"' : '') + '>' + me.getContent(null, null, true) + '</body></html>';
            },
            /**
             * 得到编辑器的纯文本内容，但会保留段落格式
             * @name getPlainTxt
             * @grammar editor.getPlainTxt()  => String
             */
            getPlainTxt: function () {
                var reg = new RegExp(domUtils.fillChar, 'g'),
                    html = this.body.innerHTML.replace(/[\n\r]/g, '');//ie要先去了\n在处理
                html = html.replace(/<(p|div)[^>]*>(<br\/?>|&nbsp;)<\/\1>/gi, '\n')
                    .replace(/<br\/?>/gi, '\n')
                    .replace(/<[^>/]+>/g, '')
                    .replace(/(\n)?<\/([^>]+)>/g, function (a, b, c) {
                        return dtd.$block[c] ? '\n' : b ? b : '';
                    });
                //取出来的空格会有c2a0会变成乱码，处理这种情况\u00a0
                return html.replace(reg, '').replace(/\u00a0/g, ' ').replace(/&nbsp;/g, ' ');
            },

            /**
             * 获取编辑器中的纯文本内容,没有段落格式
             * @name getContentTxt
             * @grammar editor.getContentTxt()  => String
             */
            getContentTxt: function () {
                var reg = new RegExp(domUtils.fillChar, 'g');
                //取出来的空格会有c2a0会变成乱码，处理这种情况\u00a0
                return this.body[browser.ie ? 'innerText' : 'textContent'].replace(reg, '').replace(/\u00a0/g, ' ');
            },

            /**
             * 将html设置到编辑器中, 如果是用于初始化时给编辑器赋初值，则必须放在ready方法内部执行
             * @name setContent
             * @grammar editor.setContent(html)
             * @example
             * var editor = new UM.ui.Editor()
             * editor.ready(function(){
             *     //需要ready后执行，否则可能报错
             *     editor.setContent("欢迎使用UEditor！");
             * })
             */
            setContent: function (html, isAppendTo, notFireSelectionchange) {
                var me = this;

                me.fireEvent('beforesetcontent', html);
                var root = UM.htmlparser(html);
                me.filterInputRule(root);
                html = root.toHtml();


                me.body.innerHTML = (isAppendTo ? me.body.innerHTML : '') + html;


                function isCdataDiv(node){
                    return  node.tagName == 'DIV' && node.getAttribute('cdata_tag');
                }
                //给文本或者inline节点套p标签
                if (me.options.enterTag == 'p') {

                    var child = this.body.firstChild, tmpNode;
                    if (!child || child.nodeType == 1 &&
                        (dtd.$cdata[child.tagName] || isCdataDiv(child) ||
                            domUtils.isCustomeNode(child)
                            )
                        && child === this.body.lastChild) {
                        this.body.innerHTML = '<p>' + (browser.ie ? '&nbsp;' : '<br/>') + '</p>' + this.body.innerHTML;

                    } else {
                        var p = me.document.createElement('p');
                        while (child) {
                            while (child && (child.nodeType == 3 || child.nodeType == 1 && dtd.p[child.tagName] && !dtd.$cdata[child.tagName])) {
                                tmpNode = child.nextSibling;
                                p.appendChild(child);
                                child = tmpNode;
                            }
                            if (p.firstChild) {
                                if (!child) {
                                    me.body.appendChild(p);
                                    break;
                                } else {
                                    child.parentNode.insertBefore(p, child);
                                    p = me.document.createElement('p');
                                }
                            }
                            child = child.nextSibling;
                        }
                    }
                }
                me.fireEvent('aftersetcontent');
                me.fireEvent('contentchange');

                !notFireSelectionchange && me._selectionChange();
                //清除保存的选区
                me._bakRange = me._bakIERange = me._bakNativeRange = null;
                //trace:1742 setContent后gecko能得到焦点问题
                var geckoSel;
                if (browser.gecko && (geckoSel = this.selection.getNative())) {
                    geckoSel.removeAllRanges();
                }
                if(me.options.autoSyncData){
                    me.form && setValue(me.form,me);
                }
            },

            /**
             * 让编辑器获得焦点，toEnd确定focus位置
             * @name focus
             * @grammar editor.focus([toEnd])   //默认focus到编辑器头部，toEnd为true时focus到内容尾部
             */
            focus: function (toEnd) {
                try {
                    var me = this,
                        rng = me.selection.getRange();
                    if (toEnd) {
                        rng.setStartAtLast(me.body.lastChild).setCursor(false, true);
                    } else {
                        rng.select(true);
                    }
                    this.fireEvent('focus');
                } catch (e) {
                }
            },
            /**
             * 使编辑区域失去焦点
             */
            blur:function(){
                var sel = this.selection.getNative();
                sel.empty ? sel.empty() : sel.removeAllRanges();
                this.fireEvent('blur')
            },
            /**
             * 判断编辑器当前是否获得了焦点
             */
            isFocus : function(){
                if(this.fireEvent('isfocus')===true){
                    return true;
                }
                return this.selection.isFocus();
            },

            /**
             * 初始化UE事件及部分事件代理
             * @private
             * @ignore
             */
            _initEvents: function () {
                var me = this,
                    cont = me.body,
                    _proxyDomEvent = function(){
                        me._proxyDomEvent.apply(me, arguments);
                    };

                $(cont)
                    .on( 'click contextmenu mousedown keydown keyup keypress mouseup mouseover mouseout selectstart', _proxyDomEvent)
                    .on( 'focus blur', _proxyDomEvent)
                    .on('mouseup keydown', function (evt) {
                        //特殊键不触发selectionchange
                        if (evt.type == 'keydown' && (evt.ctrlKey || evt.metaKey || evt.shiftKey || evt.altKey)) {
                            return;
                        }
                        if (evt.button == 2)return;
                        me._selectionChange(250, evt);
                    });
            },
            /**
             * 触发事件代理
             * @private
             * @ignore
             */
            _proxyDomEvent: function (evt) {
                return this.fireEvent(evt.type.replace(/^on/, ''), evt);
            },
            /**
             * 变化选区
             * @private
             * @ignore
             */
            _selectionChange: function (delay, evt) {
                var me = this;
                //有光标才做selectionchange 为了解决未focus时点击source不能触发更改工具栏状态的问题（source命令notNeedUndo=1）
    //            if ( !me.selection.isFocus() ){
    //                return;
    //            }


                var hackForMouseUp = false;
                var mouseX, mouseY;
                if (browser.ie && browser.version < 9 && evt && evt.type == 'mouseup') {
                    var range = this.selection.getRange();
                    if (!range.collapsed) {
                        hackForMouseUp = true;
                        mouseX = evt.clientX;
                        mouseY = evt.clientY;
                    }
                }
                clearTimeout(_selectionChangeTimer);
                _selectionChangeTimer = setTimeout(function () {
                    if (!me.selection.getNative()) {
                        return;
                    }
                    //修复一个IE下的bug: 鼠标点击一段已选择的文本中间时，可能在mouseup后的一段时间内取到的range是在selection的type为None下的错误值.
                    //IE下如果用户是拖拽一段已选择文本，则不会触发mouseup事件，所以这里的特殊处理不会对其有影响
                    var ieRange;
                    if (hackForMouseUp && me.selection.getNative().type == 'None') {
                        ieRange = me.document.body.createTextRange();
                        try {
                            ieRange.moveToPoint(mouseX, mouseY);
                        } catch (ex) {
                            ieRange = null;
                        }
                    }
                    var bakGetIERange;
                    if (ieRange) {
                        bakGetIERange = me.selection.getIERange;
                        me.selection.getIERange = function () {
                            return ieRange;
                        };
                    }
                    me.selection.cache();
                    if (bakGetIERange) {
                        me.selection.getIERange = bakGetIERange;
                    }
                    if (me.selection._cachedRange && me.selection._cachedStartElement) {
                        me.fireEvent('beforeselectionchange');
                        // 第二个参数causeByUi为true代表由用户交互造成的selectionchange.
                        me.fireEvent('selectionchange', !!evt);
                        me.fireEvent('afterselectionchange');
                        me.selection.clear();
                    }
                }, delay || 50);
            },
            _callCmdFn: function (fnName, args) {
                args = Array.prototype.slice.call(args,0);
                var cmdName = args.shift().toLowerCase(),
                    cmd, cmdFn;
                cmd = this.commands[cmdName] || UM.commands[cmdName];
                cmdFn = cmd && cmd[fnName];
                //没有querycommandstate或者没有command的都默认返回0
                if ((!cmd || !cmdFn) && fnName == 'queryCommandState') {
                    return 0;
                } else if (cmdFn) {
                    return cmdFn.apply(this, [cmdName].concat(args));
                }
            },

            /**
             * 执行编辑命令cmdName，完成富文本编辑效果
             * @name execCommand
             * @grammar editor.execCommand(cmdName)   => {*}
             */
            execCommand: function (cmdName) {
                if(!this.isFocus()){
                    var bakRange = this.selection._bakRange;
                    if(bakRange){
                        bakRange.select()
                    }else{
                        this.focus(true)
                    }

                }
                cmdName = cmdName.toLowerCase();
                var me = this,
                    result,
                    cmd = me.commands[cmdName] || UM.commands[cmdName];
                if (!cmd || !cmd.execCommand) {
                    return null;
                }
                if (!cmd.notNeedUndo && !me.__hasEnterExecCommand) {
                    me.__hasEnterExecCommand = true;
                    if (me.queryCommandState.apply(me,arguments) != -1) {
                        me.fireEvent('saveScene');
                        me.fireEvent('beforeexeccommand', cmdName);
                        result = this._callCmdFn('execCommand', arguments);
                        (!cmd.ignoreContentChange && !me._ignoreContentChange) && me.fireEvent('contentchange');
                        me.fireEvent('afterexeccommand', cmdName);
                        me.fireEvent('saveScene');
                    }
                    me.__hasEnterExecCommand = false;
                } else {
                    result = this._callCmdFn('execCommand', arguments);
                    (!me.__hasEnterExecCommand && !cmd.ignoreContentChange && !me._ignoreContentChange) && me.fireEvent('contentchange')
                }
                (!me.__hasEnterExecCommand && !cmd.ignoreContentChange && !me._ignoreContentChange) && me._selectionChange();
                return result;
            },
            /**
             * 根据传入的command命令，查选编辑器当前的选区，返回命令的状态
             * @name  queryCommandState
             * @grammar editor.queryCommandState(cmdName)  => (-1|0|1)
             * @desc
             * * ''-1'' 当前命令不可用
             * * ''0'' 当前命令可用
             * * ''1'' 当前命令已经执行过了
             */
            queryCommandState: function (cmdName) {
                try{
                    return this._callCmdFn('queryCommandState', arguments);
                }catch(e){
                    return 0
                }

            },

            /**
             * 根据传入的command命令，查选编辑器当前的选区，根据命令返回相关的值
             * @name  queryCommandValue
             * @grammar editor.queryCommandValue(cmdName)  =>  {*}
             */
            queryCommandValue: function (cmdName) {
                try{
                    return this._callCmdFn('queryCommandValue', arguments);
                }catch(e){
                    return null
                }
            },
            /**
             * 检查编辑区域中是否有内容，若包含tags中的节点类型，直接返回true
             * @name  hasContents
             * @desc
             * 默认有文本内容，或者有以下节点都不认为是空
             * <code>{table:1,ul:1,ol:1,dl:1,iframe:1,area:1,base:1,col:1,hr:1,img:1,embed:1,input:1,link:1,meta:1,param:1}</code>
             * @grammar editor.hasContents()  => (true|false)
             * @grammar editor.hasContents(tags)  =>  (true|false)  //若文档中包含tags数组里对应的tag，直接返回true
             * @example
             * editor.hasContents(['span']) //如果编辑器里有这些，不认为是空
             */
            hasContents: function (tags) {
                if (tags) {
                    for (var i = 0, ci; ci = tags[i++];) {
                        if (this.body.getElementsByTagName(ci).length > 0) {
                            return true;
                        }
                    }
                }
                if (!domUtils.isEmptyBlock(this.body)) {
                    return true
                }
                //随时添加,定义的特殊标签如果存在，不能认为是空
                tags = ['div'];
                for (i = 0; ci = tags[i++];) {
                    var nodes = domUtils.getElementsByTagName(this.body, ci);
                    for (var n = 0, cn; cn = nodes[n++];) {
                        if (domUtils.isCustomeNode(cn)) {
                            return true;
                        }
                    }
                }
                return false;
            },
            /**
             * 重置编辑器，可用来做多个tab使用同一个编辑器实例
             * @name  reset
             * @desc
             * * 清空编辑器内容
             * * 清空回退列表
             * @grammar editor.reset()
             */
            reset: function () {
                this.fireEvent('reset');
            },
            isEnabled: function(){
                return this._isEnabled != true;
            },

            setEnabled: function () {
                var me = this, range;

                me.body.contentEditable = true;

                /* 恢复选区 */
                if (me.lastBk) {
                    range = me.selection.getRange();
                    try {
                        range.moveToBookmark(me.lastBk);
                        delete me.lastBk
                    } catch (e) {
                        range.setStartAtFirst(me.body).collapse(true)
                    }
                    range.select(true);
                }

                /* 恢复query函数 */
                if (me.bkqueryCommandState) {
                    me.queryCommandState = me.bkqueryCommandState;
                    delete me.bkqueryCommandState;
                }

                /* 恢复原生事件 */
                if (me._bkproxyDomEvent) {
                    me._proxyDomEvent = me._bkproxyDomEvent;
                    delete me._bkproxyDomEvent;
                }

                /* 触发事件 */
                me.fireEvent('setEnabled');
            },
            /**
             * 设置当前编辑区域可以编辑
             * @name enable
             * @grammar editor.enable()
             */
            enable: function () {
                return this.setEnabled();
            },
            setDisabled: function (except, keepDomEvent) {
                var me = this;

                me.body.contentEditable = false;
                me._except = except ? utils.isArray(except) ? except : [except] : [];

                /* 备份最后的选区 */
                if (!me.lastBk) {
                    me.lastBk = me.selection.getRange().createBookmark(true);
                }

                /* 备份并重置query函数 */
                if(!me.bkqueryCommandState) {
                    me.bkqueryCommandState = me.queryCommandState;
                    me.queryCommandState = function (type) {
                        if (utils.indexOf(me._except, type) != -1) {
                            return me.bkqueryCommandState.apply(me, arguments);
                        }
                        return -1;
                    };
                }

                /* 备份并墙原生事件 */
                if(!keepDomEvent && !me._bkproxyDomEvent) {
                    me._bkproxyDomEvent = me._proxyDomEvent;
                    me._proxyDomEvent = function () {
                        return false;
                    };
                }

                /* 触发事件 */
                me.fireEvent('selectionchange');
                me.fireEvent('setDisabled', me._except);
            },
            /** 设置当前编辑区域不可编辑,except中的命令除外
             * @name disable
             * @grammar editor.disable()
             * @grammar editor.disable(except)  //例外的命令，也即即使设置了disable，此处配置的命令仍然可以执行
             * @example
             * //禁用工具栏中除加粗和插入图片之外的所有功能
             * editor.disable(['bold','insertimage']);//可以是单一的String,也可以是Array
             */
            disable: function (except) {
                return this.setDisabled(except);
            },
            /**
             * 设置默认内容
             * @ignore
             * @private
             * @param  {String} cont 要存入的内容
             */
            _setDefaultContent: function () {
                function clear() {
                    var me = this;
                    if (me.document.getElementById('initContent')) {
                        me.body.innerHTML = '<p>' + (ie ? '' : '<br/>') + '</p>';
                        me.removeListener('firstBeforeExecCommand focus', clear);
                        setTimeout(function () {
                            me.focus();
                            me._selectionChange();
                        }, 0)
                    }
                }

                return function (cont) {
                    var me = this;
                    me.body.innerHTML = '<p id="initContent">' + cont + '</p>';

                    me.addListener('firstBeforeExecCommand focus', clear);
                }
            }(),
            /**
             * show方法的兼容版本
             * @private
             * @ignore
             */
            setShow: function () {
                var me = this, range = me.selection.getRange();
                if (me.container.style.display == 'none') {
                    //有可能内容丢失了
                    try {
                        range.moveToBookmark(me.lastBk);
                        delete me.lastBk
                    } catch (e) {
                        range.setStartAtFirst(me.body).collapse(true)
                    }
                    //ie下focus实效，所以做了个延迟
                    setTimeout(function () {
                        range.select(true);
                    }, 100);
                    me.container.style.display = '';
                }

            },
            /**
             * 显示编辑器
             * @name show
             * @grammar editor.show()
             */
            show: function () {
                return this.setShow();
            },
            /**
             * hide方法的兼容版本
             * @private
             * @ignore
             */
            setHide: function () {
                var me = this;
                if (!me.lastBk) {
                    me.lastBk = me.selection.getRange().createBookmark(true);
                }
                me.container.style.display = 'none'
            },
            /**
             * 隐藏编辑器
             * @name hide
             * @grammar editor.hide()
             */
            hide: function () {
                return this.setHide();
            },
            /**
             * 根据制定的路径，获取对应的语言资源
             * @name  getLang
             * @grammar editor.getLang(path)  =>  （JSON|String) 路径根据的是lang目录下的语言文件的路径结构
             * @example
             * editor.getLang('contextMenu.delete') //如果当前是中文，那返回是的是删除
             */
            getLang: function (path) {
                var lang = UM.I18N[this.options.lang];
                if (!lang) {
                    throw Error("not import language file");
                }
                path = (path || "").split(".");
                for (var i = 0, ci; ci = path[i++];) {
                    lang = lang[ci];
                    if (!lang)break;
                }
                return lang;
            },
            /**
             * 计算编辑器当前内容的长度
             * @name  getContentLength
             * @grammar editor.getContentLength(ingoneHtml,tagNames)  =>
             * @example
             * editor.getLang(true)
             */
            getContentLength: function (ingoneHtml, tagNames) {
                var count = this.getContent(false,false,true).length;
                if (ingoneHtml) {
                    tagNames = (tagNames || []).concat([ 'hr', 'img', 'iframe']);
                    count = this.getContentTxt().replace(/[\t\r\n]+/g, '').length;
                    for (var i = 0, ci; ci = tagNames[i++];) {
                        count += this.body.getElementsByTagName(ci).length;
                    }
                }
                return count;
            },
            addInputRule: function (rule,ignoreUndo) {
                rule.ignoreUndo = ignoreUndo;
                this.inputRules.push(rule);
            },
            filterInputRule: function (root,isUndoLoad) {
                for (var i = 0, ci; ci = this.inputRules[i++];) {
                    if(isUndoLoad && ci.ignoreUndo){
                        continue;
                    }
                    ci.call(this, root)
                }
            },
            addOutputRule: function (rule,ignoreUndo) {
                rule.ignoreUndo = ignoreUndo;
                this.outputRules.push(rule)
            },
            filterOutputRule: function (root,isUndoLoad) {
                for (var i = 0, ci; ci = this.outputRules[i++];) {
                    if(isUndoLoad && ci.ignoreUndo){
                        continue;
                    }
                    ci.call(this, root)
                }
            }
        };
        utils.inherits(Editor, EventBase);
    })();

    /**
     * @file
     * @name UM.filterWord
     * @short filterWord
     * @desc 用来过滤word粘贴过来的字符串
     * @import editor.js,core/utils.js
     * @anthor zhanyi
     */
    var filterWord = UM.filterWord = function () {

        //是否是word过来的内容
        function isWordDocument( str ) {
            return /(class="?Mso|style="[^"]*\bmso\-|w:WordDocument|<(v|o):|lang=)/ig.test( str );
        }
        //去掉小数
        function transUnit( v ) {
            v = v.replace( /[\d.]+\w+/g, function ( m ) {
                return utils.transUnitToPx(m);
            } );
            return v;
        }

        function filterPasteWord( str ) {
            return str.replace(/[\t\r\n]+/g,' ')
                .replace( /<!--[\s\S]*?-->/ig, "" )
                //转换图片
                .replace(/<v:shape [^>]*>[\s\S]*?.<\/v:shape>/gi,function(str){
                    //opera能自己解析出image所这里直接返回空
                    if(browser.opera){
                        return '';
                    }
                    try{
                        //有可能是bitmap占为图，无用，直接过滤掉，主要体现在粘贴excel表格中
                        if(/Bitmap/i.test(str)){
                            return '';
                        }
                        var width = str.match(/width:([ \d.]*p[tx])/i)[1],
                            height = str.match(/height:([ \d.]*p[tx])/i)[1],
                            src =  str.match(/src=\s*"([^"]*)"/i)[1];
                        return '<img width="'+ transUnit(width) +'" height="'+transUnit(height) +'" src="' + src + '" />';
                    } catch(e){
                        return '';
                    }
                })
                //针对wps添加的多余标签处理
                .replace(/<\/?div[^>]*>/g,'')
                //去掉多余的属性
                .replace( /v:\w+=(["']?)[^'"]+\1/g, '' )
                .replace( /<(!|script[^>]*>.*?<\/script(?=[>\s])|\/?(\?xml(:\w+)?|xml|meta|link|style|\w+:\w+)(?=[\s\/>]))[^>]*>/gi, "" )
                .replace( /<p [^>]*class="?MsoHeading"?[^>]*>(.*?)<\/p>/gi, "<p><strong>$1</strong></p>" )
                //去掉多余的属性
                .replace( /\s+(class|lang|align)\s*=\s*(['"]?)([\w-]+)\2/ig, function(str,name,marks,val){
                    //保留list的标示
                    return name == 'class' && val == 'MsoListParagraph' ? str : ''
                })
                //清除多余的font/span不能匹配&nbsp;有可能是空格
                .replace( /<(font|span)[^>]*>(\s*)<\/\1>/gi, function(a,b,c){
                    return c.replace(/[\t\r\n ]+/g,' ')
                })
                //处理style的问题
                .replace( /(<[a-z][^>]*)\sstyle=(["'])([^\2]*?)\2/gi, function( str, tag, tmp, style ) {
                    var n = [],
                        s = style.replace( /^\s+|\s+$/, '' )
                            .replace(/&#39;/g,'\'')
                            .replace( /&quot;/gi, "'" )
                            .split( /;\s*/g );

                    for ( var i = 0,v; v = s[i];i++ ) {

                        var name, value,
                            parts = v.split( ":" );

                        if ( parts.length == 2 ) {
                            name = parts[0].toLowerCase();
                            value = parts[1].toLowerCase();
                            if(/^(background)\w*/.test(name) && value.replace(/(initial|\s)/g,'').length == 0
                                ||
                                /^(margin)\w*/.test(name) && /^0\w+$/.test(value)
                                ){
                                continue;
                            }

                            switch ( name ) {
                                case "mso-padding-alt":
                                case "mso-padding-top-alt":
                                case "mso-padding-right-alt":
                                case "mso-padding-bottom-alt":
                                case "mso-padding-left-alt":
                                case "mso-margin-alt":
                                case "mso-margin-top-alt":
                                case "mso-margin-right-alt":
                                case "mso-margin-bottom-alt":
                                case "mso-margin-left-alt":
                                //ie下会出现挤到一起的情况
                                //case "mso-table-layout-alt":
                                case "mso-height":
                                case "mso-width":
                                case "mso-vertical-align-alt":
                                    //trace:1819 ff下会解析出padding在table上
                                    if(!/<table/.test(tag))
                                        n[i] = name.replace( /^mso-|-alt$/g, "" ) + ":" + transUnit( value );
                                    continue;
                                case "horiz-align":
                                    n[i] = "text-align:" + value;
                                    continue;

                                case "vert-align":
                                    n[i] = "vertical-align:" + value;
                                    continue;

                                case "font-color":
                                case "mso-foreground":
                                    n[i] = "color:" + value;
                                    continue;

                                case "mso-background":
                                case "mso-highlight":
                                    n[i] = "background:" + value;
                                    continue;

                                case "mso-default-height":
                                    n[i] = "min-height:" + transUnit( value );
                                    continue;

                                case "mso-default-width":
                                    n[i] = "min-width:" + transUnit( value );
                                    continue;

                                case "mso-padding-between-alt":
                                    n[i] = "border-collapse:separate;border-spacing:" + transUnit( value );
                                    continue;

                                case "text-line-through":
                                    if ( (value == "single") || (value == "double") ) {
                                        n[i] = "text-decoration:line-through";
                                    }
                                    continue;
                                case "mso-zero-height":
                                    if ( value == "yes" ) {
                                        n[i] = "display:none";
                                    }
                                    continue;
    //                                case 'background':
    //                                    break;
                                case 'margin':
                                    if ( !/[1-9]/.test( value ) ) {
                                        continue;
                                    }

                            }

                            if ( /^(mso|column|font-emph|lang|layout|line-break|list-image|nav|panose|punct|row|ruby|sep|size|src|tab-|table-border|text-(?:decor|trans)|top-bar|version|vnd|word-break)/.test( name )
                                ||
                                /text\-indent|padding|margin/.test(name) && /\-[\d.]+/.test(value)
                                ) {
                                continue;
                            }

                            n[i] = name + ":" + parts[1];
                        }
                    }
                    return tag + (n.length ? ' style="' + n.join( ';').replace(/;{2,}/g,';') + '"' : '');
                })
                .replace(/[\d.]+(cm|pt)/g,function(str){
                    return utils.transUnitToPx(str)
                })

        }

        return function ( html ) {
            return (isWordDocument( html ) ? filterPasteWord( html ) : html);
        };
    }();
    ///import editor.js
    ///import core/utils.js
    ///import core/dom/dom.js
    ///import core/dom/dtd.js
    ///import core/htmlparser.js
    //模拟的节点类
    //by zhanyi
    (function () {
        var uNode = UM.uNode = function (obj) {
            this.type = obj.type;
            this.data = obj.data;
            this.tagName = obj.tagName;
            this.parentNode = obj.parentNode;
            this.attrs = obj.attrs || {};
            this.children = obj.children;
        };
        var notTransAttrs = {
            'href':1,
            'src':1,
            '_src':1,
            '_href':1,
            'cdata_data':1
        };

        var notTransTagName = {
            style:1,
            script:1
        };

        var indentChar = '    ',
            breakChar = '\n';

        function insertLine(arr, current, begin) {
            arr.push(breakChar);
            return current + (begin ? 1 : -1);
        }

        function insertIndent(arr, current) {
            //插入缩进
            for (var i = 0; i < current; i++) {
                arr.push(indentChar);
            }
        }

        //创建uNode的静态方法
        //支持标签和html
        uNode.createElement = function (html) {
            if (/[<>]/.test(html)) {
                return UM.htmlparser(html).children[0]
            } else {
                return new uNode({
                    type:'element',
                    children:[],
                    tagName:html
                })
            }
        };
        uNode.createText = function (data,noTrans) {
            return new UM.uNode({
                type:'text',
                'data':noTrans ? data : utils.unhtml(data || '')
            })
        };
        function nodeToHtml(node, arr, formatter, current) {
            switch (node.type) {
                case 'root':
                    for (var i = 0, ci; ci = node.children[i++];) {
                        //插入新行
                        if (formatter && ci.type == 'element' && !dtd.$inlineWithA[ci.tagName] && i > 1) {
                            insertLine(arr, current, true);
                            insertIndent(arr, current)
                        }
                        nodeToHtml(ci, arr, formatter, current)
                    }
                    break;
                case 'text':
                    isText(node, arr);
                    break;
                case 'element':
                    isElement(node, arr, formatter, current);
                    break;
                case 'comment':
                    isComment(node, arr, formatter);
            }
            return arr;
        }

        function isText(node, arr) {
            if(node.parentNode.tagName == 'pre'){
                //源码模式下输入html标签，不能做转换处理，直接输出
                arr.push(node.data)
            }else{
                arr.push(notTransTagName[node.parentNode.tagName] ? utils.html(node.data) : node.data.replace(/[ ]{2}/g,' &nbsp;'))
            }

        }

        function isElement(node, arr, formatter, current) {
            var attrhtml = '';
            if (node.attrs) {
                attrhtml = [];
                var attrs = node.attrs;
                for (var a in attrs) {
                    //这里就针对
                    //<p>'<img src='http://nsclick.baidu.com/u.gif?&asdf=\"sdf&asdfasdfs;asdf'></p>
                    //这里边的\"做转换，要不用innerHTML直接被截断了，属性src
                    //有可能做的不够
                    attrhtml.push(a + (attrs[a] !== undefined ? '="' + (notTransAttrs[a] ? utils.html(attrs[a]).replace(/["]/g, function (a) {
                        return '&quot;'
                    }) : utils.unhtml(attrs[a])) + '"' : ''))
                }
                attrhtml = attrhtml.join(' ');
            }
            arr.push('<' + node.tagName +
                (attrhtml ? ' ' + attrhtml  : '') +
                (dtd.$empty[node.tagName] ? '\/' : '' ) + '>'
            );
            //插入新行
            if (formatter  &&  !dtd.$inlineWithA[node.tagName] && node.tagName != 'pre') {
                if(node.children && node.children.length){
                    current = insertLine(arr, current, true);
                    insertIndent(arr, current)
                }

            }
            if (node.children && node.children.length) {
                for (var i = 0, ci; ci = node.children[i++];) {
                    if (formatter && ci.type == 'element' &&  !dtd.$inlineWithA[ci.tagName] && i > 1) {
                        insertLine(arr, current);
                        insertIndent(arr, current)
                    }
                    nodeToHtml(ci, arr, formatter, current)
                }
            }
            if (!dtd.$empty[node.tagName]) {
                if (formatter && !dtd.$inlineWithA[node.tagName]  && node.tagName != 'pre') {

                    if(node.children && node.children.length){
                        current = insertLine(arr, current);
                        insertIndent(arr, current)
                    }
                }
                arr.push('<\/' + node.tagName + '>');
            }

        }

        function isComment(node, arr) {
            arr.push('<!--' + node.data + '-->');
        }

        function getNodeById(root, id) {
            var node;
            if (root.type == 'element' && root.getAttr('id') == id) {
                return root;
            }
            if (root.children && root.children.length) {
                for (var i = 0, ci; ci = root.children[i++];) {
                    if (node = getNodeById(ci, id)) {
                        return node;
                    }
                }
            }
        }

        function getNodesByTagName(node, tagName, arr) {
            if (node.type == 'element' && node.tagName == tagName) {
                arr.push(node);
            }
            if (node.children && node.children.length) {
                for (var i = 0, ci; ci = node.children[i++];) {
                    getNodesByTagName(ci, tagName, arr)
                }
            }
        }
        function nodeTraversal(root,fn){
            if(root.children && root.children.length){
                for(var i= 0,ci;ci=root.children[i];){
                    nodeTraversal(ci,fn);
                    //ci被替换的情况，这里就不再走 fn了
                    if(ci.parentNode ){
                        if(ci.children && ci.children.length){
                            fn(ci)
                        }
                        if(ci.parentNode) i++
                    }
                }
            }else{
                fn(root)
            }

        }
        uNode.prototype = {

            /**
             * 当前节点对象，转换成html文本
             * @method toHtml
             * @return { String } 返回转换后的html字符串
             * @example
             * ```javascript
             * node.toHtml();
             * ```
             */

            /**
             * 当前节点对象，转换成html文本
             * @method toHtml
             * @param { Boolean } formatter 是否格式化返回值
             * @return { String } 返回转换后的html字符串
             * @example
             * ```javascript
             * node.toHtml( true );
             * ```
             */
            toHtml:function (formatter) {
                var arr = [];
                nodeToHtml(this, arr, formatter, 0);
                return arr.join('')
            },

            /**
             * 获取节点的html内容
             * @method innerHTML
             * @warning 假如节点的type不是'element'，或节点的标签名称不在dtd列表里，直接返回当前节点
             * @return { String } 返回节点的html内容
             * @example
             * ```javascript
             * var htmlstr = node.innerHTML();
             * ```
             */

            /**
             * 设置节点的html内容
             * @method innerHTML
             * @warning 假如节点的type不是'element'，或节点的标签名称不在dtd列表里，直接返回当前节点
             * @param { String } htmlstr 传入要设置的html内容
             * @return { UM.uNode } 返回节点本身
             * @example
             * ```javascript
             * node.innerHTML('<span>text</span>');
             * ```
             */
            innerHTML:function (htmlstr) {
                if (this.type != 'element' || dtd.$empty[this.tagName]) {
                    return this;
                }
                if (utils.isString(htmlstr)) {
                    if(this.children){
                        for (var i = 0, ci; ci = this.children[i++];) {
                            ci.parentNode = null;
                        }
                    }
                    this.children = [];
                    var tmpRoot = UM.htmlparser(htmlstr);
                    for (var i = 0, ci; ci = tmpRoot.children[i++];) {
                        this.children.push(ci);
                        ci.parentNode = this;
                    }
                    return this;
                } else {
                    var tmpRoot = new UM.uNode({
                        type:'root',
                        children:this.children
                    });
                    return tmpRoot.toHtml();
                }
            },

            /**
             * 获取节点的纯文本内容
             * @method innerText
             * @warning 假如节点的type不是'element'，或节点的标签名称不在dtd列表里，直接返回当前节点
             * @return { String } 返回节点的存文本内容
             * @example
             * ```javascript
             * var textStr = node.innerText();
             * ```
             */

            /**
             * 设置节点的纯文本内容
             * @method innerText
             * @warning 假如节点的type不是'element'，或节点的标签名称不在dtd列表里，直接返回当前节点
             * @param { String } textStr 传入要设置的文本内容
             * @return { UM.uNode } 返回节点本身
             * @example
             * ```javascript
             * node.innerText('<span>text</span>');
             * ```
             */
            innerText:function (textStr,noTrans) {
                if (this.type != 'element' || dtd.$empty[this.tagName]) {
                    return this;
                }
                if (textStr) {
                    if(this.children){
                        for (var i = 0, ci; ci = this.children[i++];) {
                            ci.parentNode = null;
                        }
                    }
                    this.children = [];
                    this.appendChild(uNode.createText(textStr,noTrans));
                    return this;
                } else {
                    return this.toHtml().replace(/<[^>]+>/g, '');
                }
            },

            /**
             * 获取当前对象的data属性
             * @method getData
             * @return { Object } 若节点的type值是elemenet，返回空字符串，否则返回节点的data属性
             * @example
             * ```javascript
             * node.getData();
             * ```
             */
            getData:function () {
                if (this.type == 'element')
                    return '';
                return this.data
            },

            /**
             * 获取当前节点下的第一个子节点
             * @method firstChild
             * @return { UM.uNode } 返回第一个子节点
             * @example
             * ```javascript
             * node.firstChild(); //返回第一个子节点
             * ```
             */
            firstChild:function () {
    //            if (this.type != 'element' || dtd.$empty[this.tagName]) {
    //                return this;
    //            }
                return this.children ? this.children[0] : null;
            },

            /**
             * 获取当前节点下的最后一个子节点
             * @method lastChild
             * @return { UM.uNode } 返回最后一个子节点
             * @example
             * ```javascript
             * node.lastChild(); //返回最后一个子节点
             * ```
             */
            lastChild:function () {
    //            if (this.type != 'element' || dtd.$empty[this.tagName] ) {
    //                return this;
    //            }
                return this.children ? this.children[this.children.length - 1] : null;
            },

            /**
             * 获取和当前节点有相同父亲节点的前一个节点
             * @method previousSibling
             * @return { UM.uNode } 返回前一个节点
             * @example
             * ```javascript
             * node.children[2].previousSibling(); //返回子节点node.children[1]
             * ```
             */
            previousSibling : function(){
                var parent = this.parentNode;
                for (var i = 0, ci; ci = parent.children[i]; i++) {
                    if (ci === this) {
                        return i == 0 ? null : parent.children[i-1];
                    }
                }

            },

            /**
             * 获取和当前节点有相同父亲节点的后一个节点
             * @method nextSibling
             * @return { UM.uNode } 返回后一个节点,找不到返回null
             * @example
             * ```javascript
             * node.children[2].nextSibling(); //如果有，返回子节点node.children[3]
             * ```
             */
            nextSibling : function(){
                var parent = this.parentNode;
                for (var i = 0, ci; ci = parent.children[i++];) {
                    if (ci === this) {
                        return parent.children[i];
                    }
                }
            },

            /**
             * 用新的节点替换当前节点
             * @method replaceChild
             * @param { UM.uNode } target 要替换成该节点参数
             * @param { UM.uNode } source 要被替换掉的节点
             * @return { UM.uNode } 返回替换之后的节点对象
             * @example
             * ```javascript
             * node.replaceChild(newNode, childNode); //用newNode替换childNode,childNode是node的子节点
             * ```
             */
            replaceChild:function (target, source) {
                if (this.children) {
                    if(target.parentNode){
                        target.parentNode.removeChild(target);
                    }
                    for (var i = 0, ci; ci = this.children[i]; i++) {
                        if (ci === source) {
                            this.children.splice(i, 1, target);
                            source.parentNode = null;
                            target.parentNode = this;
                            return target;
                        }
                    }
                }
            },

            /**
             * 在节点的子节点列表最后位置插入一个节点
             * @method appendChild
             * @param { UM.uNode } node 要插入的节点
             * @return { UM.uNode } 返回刚插入的子节点
             * @example
             * ```javascript
             * node.appendChild( newNode ); //在node内插入子节点newNode
             * ```
             */
            appendChild:function (node) {
                if (this.type == 'root' || (this.type == 'element' && !dtd.$empty[this.tagName])) {
                    if (!this.children) {
                        this.children = []
                    }
                    if(node.parentNode){
                        node.parentNode.removeChild(node);
                    }
                    for (var i = 0, ci; ci = this.children[i]; i++) {
                        if (ci === node) {
                            this.children.splice(i, 1);
                            break;
                        }
                    }
                    this.children.push(node);
                    node.parentNode = this;
                    return node;
                }


            },

            /**
             * 在传入节点的前面插入一个节点
             * @method insertBefore
             * @param { UM.uNode } target 要插入的节点
             * @param { UM.uNode } source 在该参数节点前面插入
             * @return { UM.uNode } 返回刚插入的子节点
             * @example
             * ```javascript
             * node.parentNode.insertBefore(newNode, node); //在node节点后面插入newNode
             * ```
             */
            insertBefore:function (target, source) {
                if (this.children) {
                    if(target.parentNode){
                        target.parentNode.removeChild(target);
                    }
                    for (var i = 0, ci; ci = this.children[i]; i++) {
                        if (ci === source) {
                            this.children.splice(i, 0, target);
                            target.parentNode = this;
                            return target;
                        }
                    }

                }
            },

            /**
             * 在传入节点的后面插入一个节点
             * @method insertAfter
             * @param { UM.uNode } target 要插入的节点
             * @param { UM.uNode } source 在该参数节点后面插入
             * @return { UM.uNode } 返回刚插入的子节点
             * @example
             * ```javascript
             * node.parentNode.insertAfter(newNode, node); //在node节点后面插入newNode
             * ```
             */
            insertAfter:function (target, source) {
                if (this.children) {
                    if(target.parentNode){
                        target.parentNode.removeChild(target);
                    }
                    for (var i = 0, ci; ci = this.children[i]; i++) {
                        if (ci === source) {
                            this.children.splice(i + 1, 0, target);
                            target.parentNode = this;
                            return target;
                        }

                    }
                }
            },

            /**
             * 从当前节点的子节点列表中，移除节点
             * @method removeChild
             * @param { UM.uNode } node 要移除的节点引用
             * @param { Boolean } keepChildren 是否保留移除节点的子节点，若传入true，自动把移除节点的子节点插入到移除的位置
             * @return { * } 返回刚移除的子节点
             * @example
             * ```javascript
             * node.removeChild(childNode,true); //在node的子节点列表中移除child节点，并且吧child的子节点插入到移除的位置
             * ```
             */
            removeChild:function (node,keepChildren) {
                if (this.children) {
                    for (var i = 0, ci; ci = this.children[i]; i++) {
                        if (ci === node) {
                            this.children.splice(i, 1);
                            ci.parentNode = null;
                            if(keepChildren && ci.children && ci.children.length){
                                for(var j= 0,cj;cj=ci.children[j];j++){
                                    this.children.splice(i+j,0,cj);
                                    cj.parentNode = this;

                                }
                            }
                            return ci;
                        }
                    }
                }
            },

            /**
             * 获取当前节点所代表的元素属性，即获取attrs对象下的属性值
             * @method getAttr
             * @param { String } attrName 要获取的属性名称
             * @return { * } 返回attrs对象下的属性值
             * @example
             * ```javascript
             * node.getAttr('title');
             * ```
             */
            getAttr:function (attrName) {
                return this.attrs && this.attrs[attrName.toLowerCase()]
            },

            /**
             * 设置当前节点所代表的元素属性，即设置attrs对象下的属性值
             * @method setAttr
             * @param { String } attrName 要设置的属性名称
             * @param { * } attrVal 要设置的属性值，类型视设置的属性而定
             * @return { * } 返回attrs对象下的属性值
             * @example
             * ```javascript
             * node.setAttr('title','标题');
             * ```
             */
            setAttr:function (attrName, attrVal) {
                if (!attrName) {
                    delete this.attrs;
                    return;
                }
                if(!this.attrs){
                    this.attrs = {};
                }
                if (utils.isObject(attrName)) {
                    for (var a in attrName) {
                        if (!attrName[a]) {
                            delete this.attrs[a]
                        } else {
                            this.attrs[a.toLowerCase()] = attrName[a];
                        }
                    }
                } else {
                    if (!attrVal) {
                        delete this.attrs[attrName]
                    } else {
                        this.attrs[attrName.toLowerCase()] = attrVal;
                    }

                }
            },
            hasAttr: function( attrName ){
                var attrVal = this.getAttr( attrName );
                return ( attrVal !== null ) && ( attrVal !== undefined );
            },
            /**
             * 获取当前节点在父节点下的位置索引
             * @method getIndex
             * @return { Number } 返回索引数值，如果没有父节点，返回-1
             * @example
             * ```javascript
             * node.getIndex();
             * ```
             */
            getIndex:function(){
                var parent = this.parentNode;
                for(var i= 0,ci;ci=parent.children[i];i++){
                    if(ci === this){
                        return i;
                    }
                }
                return -1;
            },

            /**
             * 在当前节点下，根据id查找节点
             * @method getNodeById
             * @param { String } id 要查找的id
             * @return { UM.uNode } 返回找到的节点
             * @example
             * ```javascript
             * node.getNodeById('textId');
             * ```
             */
            getNodeById:function (id) {
                var node;
                if (this.children && this.children.length) {
                    for (var i = 0, ci; ci = this.children[i++];) {
                        if (node = getNodeById(ci, id)) {
                            return node;
                        }
                    }
                }
            },

            /**
             * 在当前节点下，根据元素名称查找节点列表
             * @method getNodesByTagName
             * @param { String } tagNames 要查找的元素名称
             * @return { Array } 返回找到的节点列表
             * @example
             * ```javascript
             * node.getNodesByTagName('span');
             * ```
             */
            getNodesByTagName:function (tagNames) {
                tagNames = utils.trim(tagNames).replace(/[ ]{2,}/g, ' ').split(' ');
                var arr = [], me = this;
                utils.each(tagNames, function (tagName) {
                    if (me.children && me.children.length) {
                        for (var i = 0, ci; ci = me.children[i++];) {
                            getNodesByTagName(ci, tagName, arr)
                        }
                    }
                });
                return arr;
            },

            /**
             * 根据样式名称，获取节点的样式值
             * @method getStyle
             * @param { String } name 要获取的样式名称
             * @return { String } 返回样式值
             * @example
             * ```javascript
             * node.getStyle('font-size');
             * ```
             */
            getStyle:function (name) {
                var cssStyle = this.getAttr('style');
                if (!cssStyle) {
                    return ''
                }
                var reg = new RegExp('(^|;)\\s*' + name + ':([^;]+)','i');
                var match = cssStyle.match(reg);
                if (match && match[0]) {
                    return match[2]
                }
                return '';
            },

            /**
             * 给节点设置样式
             * @method setStyle
             * @param { String } name 要设置的的样式名称
             * @param { String } val 要设置的的样值
             * @example
             * ```javascript
             * node.setStyle('font-size', '12px');
             * ```
             */
            setStyle:function (name, val) {
                function exec(name, val) {
                    var reg = new RegExp('(^|;)\\s*' + name + ':([^;]+;?)', 'gi');
                    cssStyle = cssStyle.replace(reg, '$1');
                    if (val) {
                        cssStyle = name + ':' + utils.unhtml(val) + ';' + cssStyle
                    }

                }

                var cssStyle = this.getAttr('style');
                if (!cssStyle) {
                    cssStyle = '';
                }
                if (utils.isObject(name)) {
                    for (var a in name) {
                        exec(a, name[a])
                    }
                } else {
                    exec(name, val)
                }
                this.setAttr('style', utils.trim(cssStyle))
            },
            hasClass: function( className ){
                if( this.hasAttr('class') ) {
                    var classNames = this.getAttr('class').split(/\s+/),
                        hasClass = false;
                    $.each(classNames, function(key, item){
                        if( item === className ) {
                            hasClass = true;
                        }
                    });
                    return hasClass;
                } else {
                    return false;
                }
            },
            addClass: function( className ){

                var classes = null,
                    hasClass = false;

                if( this.hasAttr('class') ) {

                    classes = this.getAttr('class');
                    classes = classes.split(/\s+/);

                    classes.forEach( function( item ){

                        if( item===className ) {
                            hasClass = true;
                            return;
                        }

                    } );

                    !hasClass && classes.push( className );

                    this.setAttr('class', classes.join(" "));

                } else {
                    this.setAttr('class', className);
                }

            },
            removeClass: function( className ){
                if( this.hasAttr('class') ) {
                    var cl = this.getAttr('class');
                    cl = cl.replace(new RegExp('\\b' + className + '\\b', 'g'),'');
                    this.setAttr('class', utils.trim(cl).replace(/[ ]{2,}/g,' '));
                }
            },
            /**
             * 传入一个函数，递归遍历当前节点下的所有节点
             * @method traversal
             * @param { Function } fn 遍历到节点的时，传入节点作为参数，运行此函数
             * @example
             * ```javascript
             * traversal(node, function(){
             *     console.log(node.type);
             * });
             * ```
             */
            traversal:function(fn){
                if(this.children && this.children.length){
                    nodeTraversal(this,fn);
                }
                return this;
            }
        }
    })();

    //html字符串转换成uNode节点
    //by zhanyi
    var htmlparser = UM.htmlparser = function (htmlstr,ignoreBlank) {
        //todo 原来的方式  [^"'<>\/] 有\/就不能配对上 <TD vAlign=top background=../AAA.JPG> 这样的标签了
        //先去掉了，加上的原因忘了，这里先记录
        var re_tag = /<(?:(?:\/([^>]+)>)|(?:!--([\S|\s]*?)-->)|(?:([^\s\/>]+)\s*((?:(?:"[^"]*")|(?:'[^']*')|[^"'<>])*)\/?>))/g,
            re_attr = /([\w\-:.]+)(?:(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^\s>]+)))|(?=\s|$))/g;

        //ie下取得的html可能会有\n存在，要去掉，在处理replace(/[\t\r\n]*/g,'');代码高量的\n不能去除
        var allowEmptyTags = {
            b:1,code:1,i:1,u:1,strike:1,s:1,tt:1,strong:1,q:1,samp:1,em:1,span:1,
            sub:1,img:1,sup:1,font:1,big:1,small:1,iframe:1,a:1,br:1,pre:1
        };
        htmlstr = htmlstr.replace(new RegExp(domUtils.fillChar, 'g'), '');
        if(!ignoreBlank){
            htmlstr = htmlstr.replace(new RegExp('[\\r\\t\\n'+(ignoreBlank?'':' ')+']*<\/?(\\w+)\\s*(?:[^>]*)>[\\r\\t\\n'+(ignoreBlank?'':' ')+']*','g'), function(a,b){
                //br暂时单独处理
                if(b && allowEmptyTags[b.toLowerCase()]){
                    return a.replace(/(^[\n\r]+)|([\n\r]+$)/g,'');
                }
                return a.replace(new RegExp('^[\\r\\n'+(ignoreBlank?'':' ')+']+'),'').replace(new RegExp('[\\r\\n'+(ignoreBlank?'':' ')+']+$'),'');
            });
        }

        var notTransAttrs = {
            'href':1,
            'src':1
        };

        var uNode = UM.uNode,
            needParentNode = {
                'td':'tr',
                'tr':['tbody','thead','tfoot'],
                'tbody':'table',
                'th':'tr',
                'thead':'table',
                'tfoot':'table',
                'caption':'table',
                'li':['ul', 'ol'],
                'dt':'dl',
                'dd':'dl',
                'option':'select'
            },
            needChild = {
                'ol':'li',
                'ul':'li'
            };

        function text(parent, data) {

            if(needChild[parent.tagName]){
                var tmpNode = uNode.createElement(needChild[parent.tagName]);
                parent.appendChild(tmpNode);
                tmpNode.appendChild(uNode.createText(data));
                parent = tmpNode;
            }else{

                parent.appendChild(uNode.createText(data));
            }
        }

        function element(parent, tagName, htmlattr) {
            var needParentTag;
            if (needParentTag = needParentNode[tagName]) {
                var tmpParent = parent,hasParent;
                while(tmpParent.type != 'root'){
                    if(utils.isArray(needParentTag) ? utils.indexOf(needParentTag, tmpParent.tagName) != -1 : needParentTag == tmpParent.tagName){
                        parent = tmpParent;
                        hasParent = true;
                        break;
                    }
                    tmpParent = tmpParent.parentNode;
                }
                if(!hasParent){
                    parent = element(parent, utils.isArray(needParentTag) ? needParentTag[0] : needParentTag)
                }
            }
            //按dtd处理嵌套
    //        if(parent.type != 'root' && !dtd[parent.tagName][tagName])
    //            parent = parent.parentNode;
            var elm = new uNode({
                parentNode:parent,
                type:'element',
                tagName:tagName.toLowerCase(),
                //是自闭合的处理一下
                children:dtd.$empty[tagName] ? null : []
            });
            //如果属性存在，处理属性
            if (htmlattr) {
                var attrs = {}, match;
                while (match = re_attr.exec(htmlattr)) {
                    attrs[match[1].toLowerCase()] = notTransAttrs[match[1].toLowerCase()] ? (match[2] || match[3] || match[4]) : utils.unhtml(match[2] || match[3] || match[4])
                }
                elm.attrs = attrs;
            }

            parent.children.push(elm);
            //如果是自闭合节点返回父亲节点
            return  dtd.$empty[tagName] ? parent : elm
        }

        function comment(parent, data) {
            parent.children.push(new uNode({
                type:'comment',
                data:data,
                parentNode:parent
            }));
        }

        var match, currentIndex = 0, nextIndex = 0;
        //设置根节点
        var root = new uNode({
            type:'root',
            children:[]
        });
        var currentParent = root;

        while (match = re_tag.exec(htmlstr)) {
            currentIndex = match.index;
            try{
                if (currentIndex > nextIndex) {
                    //text node
                    text(currentParent, htmlstr.slice(nextIndex, currentIndex));
                }
                if (match[3]) {

                    if(dtd.$cdata[currentParent.tagName]){
                        text(currentParent, match[0]);
                    }else{
                        //start tag
                        currentParent = element(currentParent, match[3].toLowerCase(), match[4]);
                    }


                } else if (match[1]) {
                    if(currentParent.type != 'root'){
                        if(dtd.$cdata[currentParent.tagName] && !dtd.$cdata[match[1]]){
                            text(currentParent, match[0]);
                        }else{
                            var tmpParent = currentParent;
                            while(currentParent.type == 'element' && currentParent.tagName != match[1].toLowerCase()){
                                currentParent = currentParent.parentNode;
                                if(currentParent.type == 'root'){
                                    currentParent = tmpParent;
                                    throw 'break'
                                }
                            }
                            //end tag
                            currentParent = currentParent.parentNode;
                        }

                    }

                } else if (match[2]) {
                    //comment
                    comment(currentParent, match[2])
                }
            }catch(e){}

            nextIndex = re_tag.lastIndex;

        }
        //如果结束是文本，就有可能丢掉，所以这里手动判断一下
        //例如 <li>sdfsdfsdf<li>sdfsdfsdfsdf
        if (nextIndex < htmlstr.length) {
            text(currentParent, htmlstr.slice(nextIndex));
        }
        return root;
    };
    /**
     * @file
     * @name UM.filterNode
     * @short filterNode
     * @desc 根据给定的规则过滤节点
     * @import editor.js,core/utils.js
     * @anthor zhanyi
     */
    var filterNode = UM.filterNode = function () {
        function filterNode(node,rules){
            switch (node.type) {
                case 'text':
                    break;
                case 'element':
                    var val;
                    if(val = rules[node.tagName]){
                        if(val === '-'){
                            node.parentNode.removeChild(node)
                        }else if(utils.isFunction(val)){
                            var parentNode = node.parentNode,
                                index = node.getIndex();
                            val(node);
                            if(node.parentNode){
                                if(node.children){
                                    for(var i = 0,ci;ci=node.children[i];){
                                        filterNode(ci,rules);
                                        if(ci.parentNode){
                                            i++;
                                        }
                                    }
                                }
                            }else{
                                for(var i = index,ci;ci=parentNode.children[i];){
                                    filterNode(ci,rules);
                                    if(ci.parentNode){
                                        i++;
                                    }
                                }
                            }


                        }else{
                            var attrs = val['$'];
                            if(attrs && node.attrs){
                                var tmpAttrs = {},tmpVal;
                                for(var a in attrs){
                                    tmpVal = node.getAttr(a);
                                    //todo 只先对style单独处理
                                    if(a == 'style' && utils.isArray(attrs[a])){
                                        var tmpCssStyle = [];
                                        utils.each(attrs[a],function(v){
                                            var tmp;
                                            if(tmp = node.getStyle(v)){
                                                tmpCssStyle.push(v + ':' + tmp);
                                            }
                                        });
                                        tmpVal = tmpCssStyle.join(';')
                                    }
                                    if(tmpVal){
                                        tmpAttrs[a] = tmpVal;
                                    }

                                }
                                node.attrs = tmpAttrs;
                            }
                            if(node.children){
                                for(var i = 0,ci;ci=node.children[i];){
                                    filterNode(ci,rules);
                                    if(ci.parentNode){
                                        i++;
                                    }
                                }
                            }
                        }
                    }else{
                        //如果不在名单里扣出子节点并删除该节点,cdata除外
                        if(dtd.$cdata[node.tagName]){
                            node.parentNode.removeChild(node)
                        }else{
                            var parentNode = node.parentNode,
                                index = node.getIndex();
                            node.parentNode.removeChild(node,true);
                            for(var i = index,ci;ci=parentNode.children[i];){
                                filterNode(ci,rules);
                                if(ci.parentNode){
                                    i++;
                                }
                            }
                        }
                    }
                    break;
                case 'comment':
                    node.parentNode.removeChild(node)
            }

        }
        return function(root,rules){
            if(utils.isEmptyObject(rules)){
                return root;
            }
            var val;
            if(val = rules['-']){
                utils.each(val.split(' '),function(k){
                    rules[k] = '-'
                })
            }
            for(var i= 0,ci;ci=root.children[i];){
                filterNode(ci,rules);
                if(ci.parentNode){
                    i++;
                }
            }
            return root;
        }
    }();
    ///import core
    /**
     * @description 插入内容
     * @name baidu.editor.execCommand
     * @param   {String}   cmdName     inserthtml插入内容的命令
     * @param   {String}   html                要插入的内容
     * @author zhanyi
     */
    UM.commands['inserthtml'] = {
        execCommand: function (command,html,notNeedFilter){
            var me = this,
                range,
                div;
            if(!html){
                return;
            }
            if(me.fireEvent('beforeinserthtml',html) === true){
                return;
            }
            range = me.selection.getRange();
            div = range.document.createElement( 'div' );
            div.style.display = 'inline';

            if (!notNeedFilter) {
                var root = UM.htmlparser(html);
                //如果给了过滤规则就先进行过滤
                if(me.options.filterRules){
                    UM.filterNode(root,me.options.filterRules);
                }
                //执行默认的处理
                me.filterInputRule(root);
                html = root.toHtml()
            }
            div.innerHTML = utils.trim( html );

            if ( !range.collapsed ) {
                var tmpNode = range.startContainer;
                if(domUtils.isFillChar(tmpNode)){
                    range.setStartBefore(tmpNode)
                }
                tmpNode = range.endContainer;
                if(domUtils.isFillChar(tmpNode)){
                    range.setEndAfter(tmpNode)
                }
                range.txtToElmBoundary();
                //结束边界可能放到了br的前边，要把br包含进来
                // x[xxx]<br/>
                if(range.endContainer && range.endContainer.nodeType == 1){
                    tmpNode = range.endContainer.childNodes[range.endOffset];
                    if(tmpNode && domUtils.isBr(tmpNode)){
                        range.setEndAfter(tmpNode);
                    }
                }
                if(range.startOffset == 0){
                    tmpNode = range.startContainer;
                    if(domUtils.isBoundaryNode(tmpNode,'firstChild') ){
                        tmpNode = range.endContainer;
                        if(range.endOffset == (tmpNode.nodeType == 3 ? tmpNode.nodeValue.length : tmpNode.childNodes.length) && domUtils.isBoundaryNode(tmpNode,'lastChild')){
                            me.body.innerHTML = '<p>'+(browser.ie ? '' : '<br/>')+'</p>';
                            range.setStart(me.body.firstChild,0).collapse(true)

                        }
                    }
                }
                !range.collapsed && range.deleteContents();
                if(range.startContainer.nodeType == 1){
                    var child = range.startContainer.childNodes[range.startOffset],pre;
                    if(child && domUtils.isBlockElm(child) && (pre = child.previousSibling) && domUtils.isBlockElm(pre)){
                        range.setEnd(pre,pre.childNodes.length).collapse();
                        while(child.firstChild){
                            pre.appendChild(child.firstChild);
                        }
                        domUtils.remove(child);
                    }
                }

            }


            var child,parent,pre,tmp,hadBreak = 0, nextNode;
            //如果当前位置选中了fillchar要干掉，要不会产生空行
            if(range.inFillChar()){
                child = range.startContainer;
                if(domUtils.isFillChar(child)){
                    range.setStartBefore(child).collapse(true);
                    domUtils.remove(child);
                }else if(domUtils.isFillChar(child,true)){
                    child.nodeValue = child.nodeValue.replace(fillCharReg,'');
                    range.startOffset--;
                    range.collapsed && range.collapse(true)
                }
            }
            while ( child = div.firstChild ) {
                if(hadBreak){
                    var p = me.document.createElement('p');
                    while(child && (child.nodeType == 3 || !dtd.$block[child.tagName])){
                        nextNode = child.nextSibling;
                        p.appendChild(child);
                        child = nextNode;
                    }
                    if(p.firstChild){

                        child = p
                    }
                }
                range.insertNode( child );
                nextNode = child.nextSibling;
                if ( !hadBreak && child.nodeType == domUtils.NODE_ELEMENT && domUtils.isBlockElm( child ) ){

                    parent = domUtils.findParent( child,function ( node ){ return domUtils.isBlockElm( node ); } );
                    if ( parent && parent.tagName.toLowerCase() != 'body' && !(dtd[parent.tagName][child.nodeName] && child.parentNode === parent)){
                        if(!dtd[parent.tagName][child.nodeName]){
                            pre = parent;
                        }else{
                            tmp = child.parentNode;
                            while (tmp !== parent){
                                pre = tmp;
                                tmp = tmp.parentNode;

                            }
                        }


                        domUtils.breakParent( child, pre || tmp );
                        //去掉break后前一个多余的节点  <p>|<[p> ==> <p></p><div></div><p>|</p>
                        var pre = child.previousSibling;
                        domUtils.trimWhiteTextNode(pre);
                        if(!pre.childNodes.length){
                            domUtils.remove(pre);
                        }
                        //trace:2012,在非ie的情况，切开后剩下的节点有可能不能点入光标添加br占位

                        if(!browser.ie &&
                            (next = child.nextSibling) &&
                            domUtils.isBlockElm(next) &&
                            next.lastChild &&
                            !domUtils.isBr(next.lastChild)){
                            next.appendChild(me.document.createElement('br'));
                        }
                        hadBreak = 1;
                    }
                }
                var next = child.nextSibling;
                if(!div.firstChild && next && domUtils.isBlockElm(next)){

                    range.setStart(next,0).collapse(true);
                    break;
                }
                range.setEndAfter( child ).collapse();

            }

            child = range.startContainer;

            if(nextNode && domUtils.isBr(nextNode)){
                domUtils.remove(nextNode)
            }
            //用chrome可能有空白展位符
            if(domUtils.isBlockElm(child) && domUtils.isEmptyNode(child)){
                if(nextNode = child.nextSibling){
                    domUtils.remove(child);
                    if(nextNode.nodeType == 1 && dtd.$block[nextNode.tagName]){

                        range.setStart(nextNode,0).collapse(true).shrinkBoundary()
                    }
                }else{

                    try{
                        child.innerHTML = browser.ie ? domUtils.fillChar : '<br/>';
                    }catch(e){
                        range.setStartBefore(child);
                        domUtils.remove(child)
                    }

                }

            }
            //加上true因为在删除表情等时会删两次，第一次是删的fillData
            try{
                if(browser.ie9below && range.startContainer.nodeType == 1 && !range.startContainer.childNodes[range.startOffset]){
                    var start = range.startContainer,pre = start.childNodes[range.startOffset-1];
                    if(pre && pre.nodeType == 1 && dtd.$empty[pre.tagName]){
                        var txt = this.document.createTextNode(domUtils.fillChar);
                        range.insertNode(txt).setStart(txt,0).collapse(true);
                    }
                }
                setTimeout(function(){
                    range.select(true);
                })

            }catch(e){}


            setTimeout(function(){
                range = me.selection.getRange();
                range.scrollIntoView();
                me.fireEvent('afterinserthtml');
            },200);
        }
    };

    ///import core
    ///import plugins\inserthtml.js
    ///commands 插入图片，操作图片的对齐方式
    ///commandsName  InsertImage,ImageNone,ImageLeft,ImageRight,ImageCenter
    ///commandsTitle  图片,默认,居左,居右,居中
    ///commandsDialog  dialogs\image
    /**
     * Created by .
     * User: zhanyi
     * for image
     */
    UM.commands['insertimage'] = {
        execCommand:function (cmd, opt) {
            opt = utils.isArray(opt) ? opt : [opt];
            if (!opt.length) {
                return;
            }
            var me = this;
            var html = [], str = '', ci;
            ci = opt[0];
            if (opt.length == 1) {
                str = '<img src="' + ci.src + '" ' + (ci._src ? ' _src="' + ci._src + '" ' : '') +
                    (ci.width ? 'width="' + ci.width + '" ' : '') +
                    (ci.height ? ' height="' + ci.height + '" ' : '') +
                    (ci['floatStyle'] == 'left' || ci['floatStyle'] == 'right' ? ' style="float:' + ci['floatStyle'] + ';"' : '') +
                    (ci.title && ci.title != "" ? ' title="' + ci.title + '"' : '') +
                    (ci.border && ci.border != "0" ? ' border="' + ci.border + '"' : '') +
                    (ci.alt && ci.alt != "" ? ' alt="' + ci.alt + '"' : '') +
                    (ci.hspace && ci.hspace != "0" ? ' hspace = "' + ci.hspace + '"' : '') +
                    (ci.vspace && ci.vspace != "0" ? ' vspace = "' + ci.vspace + '"' : '') + '/>';
                if (ci['floatStyle'] == 'center') {
                    str = '<p style="text-align: center">' + str + '</p>';
                }
                html.push(str);

            } else {
                for (var i = 0; ci = opt[i++];) {
                    str = '<p ' + (ci['floatStyle'] == 'center' ? 'style="text-align: center" ' : '') + '><img src="' + ci.src + '" ' +
                        (ci.width ? 'width="' + ci.width + '" ' : '') + (ci._src ? ' _src="' + ci._src + '" ' : '') +
                        (ci.height ? ' height="' + ci.height + '" ' : '') +
                        ' style="' + (ci['floatStyle'] && ci['floatStyle'] != 'center' ? 'float:' + ci['floatStyle'] + ';' : '') +
                        (ci.border || '') + '" ' +
                        (ci.title ? ' title="' + ci.title + '"' : '') + ' /></p>';
                    html.push(str);
                }
            }

            me.execCommand('insertHtml', html.join(''), true);
        }
    };
    ///import core
    ///commands 段落格式,居左,居右,居中,两端对齐
    ///commandsName  JustifyLeft,JustifyCenter,JustifyRight,JustifyJustify
    ///commandsTitle  居左对齐,居中对齐,居右对齐,两端对齐
    /**
     * @description 居左右中
     * @name UM.execCommand
     * @param   {String}   cmdName     justify执行对齐方式的命令
     * @param   {String}   align               对齐方式：left居左，right居右，center居中，justify两端对齐
     * @author zhanyi
     */
    UM.plugins['justify']=function(){
        var me = this;
        $.each('justifyleft justifyright justifycenter justifyfull'.split(' '),function(i,cmdName){
            me.commands[cmdName] = {
                execCommand:function (cmdName) {
                    return this.document.execCommand(cmdName);
                },
                queryCommandValue: function (cmdName) {
                    var val = this.document.queryCommandValue(cmdName);
                    return   val === true || val === 'true' ? cmdName.replace(/justify/,'') : '';
                },
                queryCommandState: function (cmdName) {
                    return this.document.queryCommandState(cmdName) ? 1 : 0
                }
            };
        })
    };

    ///import core
    ///import plugins\removeformat.js
    ///commands 字体颜色,背景色,字号,字体,下划线,删除线
    ///commandsName  ForeColor,BackColor,FontSize,FontFamily,Underline,StrikeThrough
    ///commandsTitle  字体颜色,背景色,字号,字体,下划线,删除线
    /**
     * @description 字体
     * @name UM.execCommand
     * @param {String}     cmdName    执行的功能名称
     * @param {String}    value             传入的值
     */
    UM.plugins['font'] = function () {
        var me = this,
            fonts = {
                'forecolor': 'forecolor',
                'backcolor': 'backcolor',
                'fontsize': 'fontsize',
                'fontfamily': 'fontname'
            },
            cmdNameToStyle = {
                'forecolor': 'color',
                'backcolor': 'background-color',
                'fontsize': 'font-size',
                'fontfamily': 'font-family'
            },
            cmdNameToAttr = {
                'forecolor': 'color',
                'fontsize': 'size',
                'fontfamily': 'face'
            };
        me.setOpt({
            'fontfamily': [
                { name: 'songti', val: '宋体,SimSun'},
                { name: 'yahei', val: '微软雅黑,Microsoft YaHei'},
                { name: 'kaiti', val: '楷体,楷体_GB2312, SimKai'},
                { name: 'heiti', val: '黑体, SimHei'},
                { name: 'lishu', val: '隶书, SimLi'},
                { name: 'andaleMono', val: 'andale mono'},
                { name: 'arial', val: 'arial, helvetica,sans-serif'},
                { name: 'arialBlack', val: 'arial black,avant garde'},
                { name: 'comicSansMs', val: 'comic sans ms'},
                { name: 'impact', val: 'impact,chicago'},
                { name: 'timesNewRoman', val: 'times new roman'},
                { name: 'sans-serif',val:'sans-serif'}
            ],
            'fontsize': [10, 12,  16, 18,24, 32,48]
        });

        me.addOutputRule(function (root) {
            utils.each(root.getNodesByTagName('font'), function (node) {
                if (node.tagName == 'font') {
                    var cssStyle = [];
                    for (var p in node.attrs) {
                        switch (p) {
                            case 'size':
                                var val =  node.attrs[p];
                                $.each({
                                    '10':'1',
                                    '12':'2',
                                    '16':'3',
                                    '18':'4',
                                    '24':'5',
                                    '32':'6',
                                    '48':'7'
                                },function(k,v){
                                    if(v == val){
                                        val = k;
                                        return false;
                                    }
                                });
                                cssStyle.push('font-size:' + val + 'px');
                                break;
                            case 'color':
                                cssStyle.push('color:' + node.attrs[p]);
                                break;
                            case 'face':
                                cssStyle.push('font-family:' + node.attrs[p]);
                                break;
                            case 'style':
                                cssStyle.push(node.attrs[p]);
                        }
                    }
                    node.attrs = {
                        'style': cssStyle.join(';')
                    };
                }
                node.tagName = 'span';
                if(node.parentNode.tagName == 'span' && node.parentNode.children.length == 1){
                    $.each(node.attrs,function(k,v){

                        node.parentNode.attrs[k] = k == 'style' ? node.parentNode.attrs[k] + v : v;
                    })
                    node.parentNode.removeChild(node,true);
                }
            });
        });
        for(var p in fonts){
            (function (cmd) {
                me.commands[cmd] = {
                    execCommand: function (cmdName,value) {
                        if(value == 'transparent'){
                            return;
                        }
                        var rng = this.selection.getRange();
                        if(rng.collapsed){
                            var span = $('<span></span>').css(cmdNameToStyle[cmdName],value)[0];
                            rng.insertNode(span).setStart(span,0).setCursor();
                        }else{
                            if(cmdName == 'fontsize'){
                                value  = {
                                    '10':'1',
                                    '12':'2',
                                    '16':'3',
                                    '18':'4',
                                    '24':'5',
                                    '32':'6',
                                    '48':'7'
                                }[(value+"").replace(/px/,'')]
                            }
                            this.document.execCommand(fonts[cmdName],false, value);
                            if(browser.gecko){
                                $.each(this.$body.find('a'),function(i,a){
                                    var parent = a.parentNode;
                                    if(parent.lastChild === parent.firstChild && /FONT|SPAN/.test(parent.tagName)){
                                        var cloneNode = parent.cloneNode(false);
                                        cloneNode.innerHTML = a.innerHTML;
                                        $(a).html('').append(cloneNode).insertBefore(parent);

                                        $(parent).remove();
                                    }
                                });
                            }
                            if(!browser.ie){
                                var nativeRange = this.selection.getNative().getRangeAt(0);
                                var common = nativeRange.commonAncestorContainer;
                                var rng = this.selection.getRange(),
                                    bk = rng.createBookmark(true);

                                $(common).find('a').each(function(i,n){
                                    var parent = n.parentNode;
                                    if(parent.nodeName == 'FONT'){
                                        var font = parent.cloneNode(false);
                                        font.innerHTML = n.innerHTML;
                                        $(n).html('').append(font);
                                    }
                                });
                                rng.moveToBookmark(bk).select()
                            }
                            return true
                        }

                    },
                    queryCommandValue: function (cmdName) {
                        var start = me.selection.getStart();
                        var val = $(start).css(cmdNameToStyle[cmdName]);
                        if(val === undefined){
                            val = $(start).attr(cmdNameToAttr[cmdName])
                        }
                        return val ? utils.fixColor(cmdName,val).replace(/px/,'') : '';
                    },
                    queryCommandState: function (cmdName) {
                        return this.queryCommandValue(cmdName)
                    }
                };
            })(p);
        }
    };
    ///import core
    ///commands 超链接,取消链接
    ///commandsName  Link,Unlink
    ///commandsTitle  超链接,取消链接
    ///commandsDialog  dialogs\link
    /**
     * 超链接
     * @function
     * @name UM.execCommand
     * @param   {String}   cmdName     link插入超链接
     * @param   {Object}  options         url地址，title标题，target是否打开新页
     * @author zhanyi
     */
    /**
     * 取消链接
     * @function
     * @name UM.execCommand
     * @param   {String}   cmdName     unlink取消链接
     * @author zhanyi
     */

    UM.plugins['link'] = function(){
        var me = this;

        me.setOpt('autourldetectinie',false);
        //在ie下禁用autolink
        if(browser.ie && this.options.autourldetectinie === false){
            this.addListener('keyup',function(cmd,evt){
                var me = this,keyCode = evt.keyCode;
                if(keyCode == 13 || keyCode == 32){
                    var rng = me.selection.getRange();
                    var start = rng.startContainer;
                    if(keyCode == 13){
                        if(start.nodeName == 'P'){
                            var pre = start.previousSibling;
                            if(pre && pre.nodeType == 1){
                                var pre = pre.lastChild;
                                if(pre && pre.nodeName == 'A' && !pre.getAttribute('_href')){
                                    domUtils.remove(pre,true);
                                }
                            }
                        }
                    }else if(keyCode == 32){
                       if(start.nodeType == 3 && /^\s$/.test(start.nodeValue)){
                           start = start.previousSibling;
                           if(start && start.nodeName == 'A' && !start.getAttribute('_href')){
                               domUtils.remove(start,true);
                           }
                       }
                    }

                }


            });
        }

        this.addOutputRule(function(root){
            $.each(root.getNodesByTagName('a'),function(i,a){
                var _href = a.getAttr('_href');
                if(!/^(ftp|https?|\/|file)/.test(_href)){
                    _href = 'http://' + _href;
                }
                a.setAttr('href', _href);
                a.setAttr('_href')
                if(a.getAttr('title')==''){
                    a.setAttr('title')
                }
            })
        });
        this.addInputRule(function(root){
            $.each(root.getNodesByTagName('a'),function(i,a){
                a.setAttr('_href', a.getAttr('href'));
            })
        });
        me.commands['link'] = {
            execCommand : function( cmdName, opt ) {

                var me = this;
                var rng = me.selection.getRange();
                opt._href && (opt._href = utils.unhtml(opt._href, /[<">'](?:(amp|lt|quot|gt|#39|nbsp);)?/g));
                opt.href && (opt.href = utils.unhtml(opt.href, /[<">'](?:(amp|lt|quot|gt|#39|nbsp);)?/g));
                if(rng.collapsed){
                    var start = rng.startContainer;
                    if(start = domUtils.findParentByTagName(start,'a',true)){
                        $(start).attr(opt);
                        rng.selectNode(start).select()
                    }else{
                        rng.insertNode($('<a>' + opt.href +'</a>').attr(opt)[0]).select()

                    }

                }else{
                    me.document.execCommand('createlink',false,'_umeditor_link');
                    utils.each(domUtils.getElementsByTagName(me.body,'a',function(n){

                        return n.getAttribute('href') == '_umeditor_link'
                    }),function(l){
                        if($(l).text() == '_umeditor_link'){
                            $(l).text(opt.href);
                        }
                        domUtils.setAttributes(l,opt);
                        rng.selectNode(l).select()
                    })
                }

            },
            queryCommandState:function(){
                return this.queryCommandValue('link') ? 1 : 0;
            },
            queryCommandValue:function(){
                var path = this.selection.getStartElementPath();
                var result;
                $.each(path,function(i,n){
                    if(n.nodeName == "A"){
                        result = n;
                        return false;
                    }
                })
                return result;
            }
        };
        me.commands['unlink'] = {
            execCommand : function() {
                this.document.execCommand('unlink');
            }
        };
    };
    ///import core
    ///commands 打印
    ///commandsName  Print
    ///commandsTitle  打印
    /**
     * @description 打印
     * @name baidu.editor.execCommand
     * @param   {String}   cmdName     print打印编辑器内容
     * @author zhanyi
     */
    UM.commands['print'] = {
        execCommand : function(){
            var me = this,
                id = 'editor_print_' + +new Date();

            $('<iframe src="" id="' + id + '" name="' + id + '" frameborder="0"></iframe>').attr('id', id)
                .css({
                    width:'0px',
                    height:'0px',
                    'overflow':'hidden',
                    'float':'left',
                    'position':'absolute',
                    top:'-10000px',
                    left:'-10000px'
                })
                .appendTo(me.$container.find('.edui-dialog-container'));

            var w = window.open('', id, ''),
                d = w.document;
            d.open();
            d.write('<html><head></head><body><div>'+this.getContent(null,null,true)+'</div><script>' +
                "setTimeout(function(){" +
                "window.print();" +
                "setTimeout(function(){" +
                "window.parent.$('#" + id + "').remove();" +
                "},100);" +
                "},200);" +
                '</script></body></html>');
            d.close();
        },
        notNeedUndo : 1
    };
    ///import core
    ///commands 格式
    ///commandsName  Paragraph
    ///commandsTitle  段落格式
    /**
     * 段落样式
     * @function
     * @name UM.execCommand
     * @param   {String}   cmdName     paragraph插入段落执行命令
     * @param   {String}   style               标签值为：'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
     * @param   {String}   attrs               标签的属性
     * @author zhanyi
     */
    UM.plugins['paragraph'] = function() {
        var me = this;
        me.setOpt('paragraph',{'p':'', 'h1':'', 'h2':'', 'h3':'', 'h4':'', 'h5':'', 'h6':''});
        me.commands['paragraph'] = {
            execCommand : function( cmdName, style ) {
                return this.document.execCommand('formatBlock',false,'<' + style + '>');
            },
            queryCommandValue : function() {
                try{
                    var  val = this.document.queryCommandValue('formatBlock')
                }catch(e){
                }
                return val ;
            }
        };
    };

    ///import core
    ///import plugins\inserthtml.js
    ///commands 分割线
    ///commandsName  Horizontal
    ///commandsTitle  分隔线
    /**
     * 分割线
     * @function
     * @name UM.execCommand
     * @param {String}     cmdName    horizontal插入分割线
     */
    UM.plugins['horizontal'] = function(){
        var me = this;
        me.commands['horizontal'] = {
            execCommand : function(  ) {
                this.document.execCommand('insertHorizontalRule');
                var rng = me.selection.getRange().txtToElmBoundary(true),
                    start = rng.startContainer;
                if(domUtils.isBody(rng.startContainer)){
                    var next = rng.startContainer.childNodes[rng.startOffset];
                    if(!next){
                        next = $('<p></p>').appendTo(rng.startContainer).html(browser.ie ? '&nbsp;' : '<br/>')[0]
                    }
                    rng.setStart(next,0).setCursor()
                }else{

                    while(dtd.$inline[start.tagName] && start.lastChild === start.firstChild){

                        var parent = start.parentNode;
                        parent.appendChild(start.firstChild);
                        parent.removeChild(start);
                        start = parent;
                    }
                    while(dtd.$inline[start.tagName]){
                        start = start.parentNode;
                    }
                    if(start.childNodes.length == 1 && start.lastChild.nodeName == 'HR'){
                        var hr = start.lastChild;
                        $(hr).insertBefore(start);
                        rng.setStart(start,0).setCursor();
                    }else{
                        hr = $('hr',start)[0];
                        domUtils.breakParent(hr,start);
                        var pre = hr.previousSibling;
                        if(pre && domUtils.isEmptyBlock(pre)){
                            $(pre).remove()
                        }
                        rng.setStart(hr.nextSibling,0).setCursor();
                    }

                }
            }
        };

    };


    ///import core
    ///commands 清空文档
    ///commandsName  ClearDoc
    ///commandsTitle  清空文档
    /**
     *
     * 清空文档
     * @function
     * @name UM.execCommand
     * @param   {String}   cmdName     cleardoc清空文档
     */

    UM.commands['cleardoc'] = {
        execCommand : function() {
            var me = this,
                range = me.selection.getRange();
            me.body.innerHTML = "<p>"+(ie ? "" : "<br/>")+"</p>";
            range.setStart(me.body.firstChild,0).setCursor(false,true);
            setTimeout(function(){
                me.fireEvent("clearDoc");
            },0);

        }
    };


    ///import core
    ///commands 撤销和重做
    ///commandsName  Undo,Redo
    ///commandsTitle  撤销,重做
    /**
     * @description 回退
     * @author zhanyi
     */

    UM.plugins['undo'] = function () {
        var saveSceneTimer;
        var me = this,
            maxUndoCount = me.options.maxUndoCount || 20,
            maxInputCount = me.options.maxInputCount || 20,
            fillchar = new RegExp(domUtils.fillChar + '|<\/hr>', 'gi');// ie会产生多余的</hr>
        var noNeedFillCharTags = {
            ol:1,ul:1,table:1,tbody:1,tr:1,body:1
        };
        var orgState = me.options.autoClearEmptyNode;
        function compareAddr(indexA, indexB) {
            if (indexA.length != indexB.length)
                return 0;
            for (var i = 0, l = indexA.length; i < l; i++) {
                if (indexA[i] != indexB[i])
                    return 0
            }
            return 1;
        }

        function compareRangeAddress(rngAddrA, rngAddrB) {
            if (rngAddrA.collapsed != rngAddrB.collapsed) {
                return 0;
            }
            if (!compareAddr(rngAddrA.startAddress, rngAddrB.startAddress) || !compareAddr(rngAddrA.endAddress, rngAddrB.endAddress)) {
                return 0;
            }
            return 1;
        }

        function UndoManager() {
            this.list = [];
            this.index = 0;
            this.hasUndo = false;
            this.hasRedo = false;
            this.undo = function () {
                if (this.hasUndo) {
                    if (!this.list[this.index - 1] && this.list.length == 1) {
                        this.reset();
                        return;
                    }
                    while (this.list[this.index].content == this.list[this.index - 1].content) {
                        this.index--;
                        if (this.index == 0) {
                            return this.restore(0);
                        }
                    }
                    this.restore(--this.index);
                }
            };
            this.redo = function () {
                if (this.hasRedo) {
                    while (this.list[this.index].content == this.list[this.index + 1].content) {
                        this.index++;
                        if (this.index == this.list.length - 1) {
                            return this.restore(this.index);
                        }
                    }
                    this.restore(++this.index);
                }
            };

            this.restore = function () {
                var me = this.editor;
                var scene = this.list[this.index];
                var root = UM.htmlparser(scene.content.replace(fillchar, ''));
                me.options.autoClearEmptyNode = false;
                me.filterInputRule(root,true);
                me.options.autoClearEmptyNode = orgState;
                //trace:873
                //去掉展位符
                me.body.innerHTML = root.toHtml();
                me.fireEvent('afterscencerestore');
                //处理undo后空格不展位的问题
                if (browser.ie) {
                    utils.each(domUtils.getElementsByTagName(me.document,'td th caption p'),function(node){
                        if(domUtils.isEmptyNode(node)){
                            domUtils.fillNode(me.document, node);
                        }
                    })
                }

                try{
                    var rng = new dom.Range(me.document,me.body).moveToAddress(scene.address);
                    if(browser.ie && rng.collapsed && rng.startContainer.nodeType == 1){
                        var tmpNode = rng.startContainer.childNodes[rng.startOffset];
                        if( !tmpNode || tmpNode.nodeType == 1 && dtd.$empty[tmpNode]){
                            rng.insertNode(me.document.createTextNode(' ')).collapse(true);
                        }
                    }
                    rng.select(noNeedFillCharTags[rng.startContainer.nodeName.toLowerCase()]);
                }catch(e){}

                this.update();
                this.clearKey();
                //不能把自己reset了
                me.fireEvent('reset', true);
            };

            this.getScene = function () {
                var me = this.editor;
                var rng = me.selection.getRange(),
                    rngAddress = rng.createAddress(false,true);
                me.fireEvent('beforegetscene');
                var root = UM.htmlparser(me.body.innerHTML,true);
                me.options.autoClearEmptyNode = false;
                me.filterOutputRule(root,true);
                me.options.autoClearEmptyNode = orgState;
                var cont = root.toHtml();
                browser.ie && (cont = cont.replace(/>&nbsp;</g, '><').replace(/\s*</g, '<').replace(/>\s*/g, '>'));
                me.fireEvent('aftergetscene');
                return {
                    address:rngAddress,
                    content:cont
                }
            };
            this.save = function (notCompareRange,notSetCursor) {
                clearTimeout(saveSceneTimer);
                var currentScene = this.getScene(notSetCursor),
                    lastScene = this.list[this.index];
                //内容相同位置相同不存
                if (lastScene && lastScene.content == currentScene.content &&
                    ( notCompareRange ? 1 : compareRangeAddress(lastScene.address, currentScene.address) )
                    ) {
                    return;
                }
                this.list = this.list.slice(0, this.index + 1);
                this.list.push(currentScene);
                //如果大于最大数量了，就把最前的剔除
                if (this.list.length > maxUndoCount) {
                    this.list.shift();
                }
                this.index = this.list.length - 1;
                this.clearKey();
                //跟新undo/redo状态
                this.update();

            };
            this.update = function () {
                this.hasRedo = !!this.list[this.index + 1];
                this.hasUndo = !!this.list[this.index - 1];
            };
            this.reset = function () {
                this.list = [];
                this.index = 0;
                this.hasUndo = false;
                this.hasRedo = false;
                this.clearKey();
            };
            this.clearKey = function () {
                keycont = 0;
                lastKeyCode = null;
            };
        }

        me.undoManger = new UndoManager();
        me.undoManger.editor = me;
        function saveScene() {
            this.undoManger.save();
        }

        me.addListener('saveScene', function () {
            var args = Array.prototype.splice.call(arguments,1);
            this.undoManger.save.apply(this.undoManger,args);
        });

        me.addListener('beforeexeccommand', saveScene);
        me.addListener('afterexeccommand', saveScene);

        me.addListener('reset', function (type, exclude) {
            if (!exclude) {
                this.undoManger.reset();
            }
        });
        me.commands['redo'] = me.commands['undo'] = {
            execCommand:function (cmdName) {
                this.undoManger[cmdName]();
            },
            queryCommandState:function (cmdName) {
                return this.undoManger['has' + (cmdName.toLowerCase() == 'undo' ? 'Undo' : 'Redo')] ? 0 : -1;
            },
            notNeedUndo:1
        };

        var keys = {
                //  /*Backspace*/ 8:1, /*Delete*/ 46:1,
                /*Shift*/ 16:1, /*Ctrl*/ 17:1, /*Alt*/ 18:1,
                37:1, 38:1, 39:1, 40:1

            },
            keycont = 0,
            lastKeyCode;
        //输入法状态下不计算字符数
        var inputType = false;
        me.addListener('ready', function () {
            $(this.body).on('compositionstart', function () {
                inputType = true;
            }).on('compositionend', function () {
                inputType = false;
            })
        });
        //快捷键
        me.addshortcutkey({
            "Undo":"ctrl+90", //undo
            "Redo":"ctrl+89,shift+ctrl+z" //redo

        });
        var isCollapsed = true;
        me.addListener('keydown', function (type, evt) {

            var me = this;
            var keyCode = evt.keyCode || evt.which;
            if (!keys[keyCode] && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && !evt.altKey) {
                if (inputType)
                    return;

                if(!me.selection.getRange().collapsed){
                    me.undoManger.save(false,true);
                    isCollapsed = false;
                    return;
                }
                if (me.undoManger.list.length == 0) {
                    me.undoManger.save(true);
                }
                clearTimeout(saveSceneTimer);
                function save(cont){

                    if (cont.selection.getRange().collapsed)
                        cont.fireEvent('contentchange');
                    cont.undoManger.save(false,true);
                    cont.fireEvent('selectionchange');
                }
                saveSceneTimer = setTimeout(function(){
                    if(inputType){
                        var interalTimer = setInterval(function(){
                            if(!inputType){
                                save(me);
                                clearInterval(interalTimer)
                            }
                        },300)
                        return;
                    }
                    save(me);
                },200);

                lastKeyCode = keyCode;
                keycont++;
                if (keycont >= maxInputCount ) {
                    save(me)
                }
            }
        });
        me.addListener('keyup', function (type, evt) {
            var keyCode = evt.keyCode || evt.which;
            if (!keys[keyCode] && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && !evt.altKey) {
                if (inputType)
                    return;
                if(!isCollapsed){
                    this.undoManger.save(false,true);
                    isCollapsed = true;
                }
            }
        });

    };

    ///import core
    ///import plugins/inserthtml.js
    ///import plugins/undo.js
    ///import plugins/serialize.js
    ///commands 粘贴
    ///commandsName  PastePlain
    ///commandsTitle  纯文本粘贴模式
    /**
     * @description 粘贴
     * @author zhanyi
     */
    UM.plugins['paste'] = function () {
        function getClipboardData(callback) {
            var doc = this.document;
            if (doc.getElementById('baidu_pastebin')) {
                return;
            }
            var range = this.selection.getRange(),
                bk = range.createBookmark(),
            //创建剪贴的容器div
                pastebin = doc.createElement('div');
            pastebin.id = 'baidu_pastebin';
            // Safari 要求div必须有内容，才能粘贴内容进来
            browser.webkit && pastebin.appendChild(doc.createTextNode(domUtils.fillChar + domUtils.fillChar));
            this.body.appendChild(pastebin);
            //trace:717 隐藏的span不能得到top
            //bk.start.innerHTML = '&nbsp;';
            bk.start.style.display = '';

            pastebin.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;left:-1000px;white-space:nowrap;top:" +
            //要在现在光标平行的位置加入，否则会出现跳动的问题
            $(bk.start).position().top  + 'px';

            range.selectNodeContents(pastebin).select(true);

            setTimeout(function () {
                if (browser.webkit) {
                    for (var i = 0, pastebins = doc.querySelectorAll('#baidu_pastebin'), pi; pi = pastebins[i++];) {
                        if (domUtils.isEmptyNode(pi)) {
                            domUtils.remove(pi);
                        } else {
                            pastebin = pi;
                            break;
                        }
                    }
                }
                try {
                    pastebin.parentNode.removeChild(pastebin);
                } catch (e) {
                }
                range.moveToBookmark(bk).select(true);
                callback(pastebin);
            }, 0);
        }

        var me = this;


        function filter(div) {
            var html;
            if (div.firstChild) {
                //去掉cut中添加的边界值
                var nodes = domUtils.getElementsByTagName(div, 'span');
                for (var i = 0, ni; ni = nodes[i++];) {
                    if (ni.id == '_baidu_cut_start' || ni.id == '_baidu_cut_end') {
                        domUtils.remove(ni);
                    }
                }

                if (browser.webkit) {

                    var brs = div.querySelectorAll('div br');
                    for (var i = 0, bi; bi = brs[i++];) {
                        var pN = bi.parentNode;
                        if (pN.tagName == 'DIV' && pN.childNodes.length == 1) {
                            pN.innerHTML = '<p><br/></p>';
                            domUtils.remove(pN);
                        }
                    }
                    var divs = div.querySelectorAll('#baidu_pastebin');
                    for (var i = 0, di; di = divs[i++];) {
                        var tmpP = me.document.createElement('p');
                        di.parentNode.insertBefore(tmpP, di);
                        while (di.firstChild) {
                            tmpP.appendChild(di.firstChild);
                        }
                        domUtils.remove(di);
                    }

                    var metas = div.querySelectorAll('meta');
                    for (var i = 0, ci; ci = metas[i++];) {
                        domUtils.remove(ci);
                    }

                    var brs = div.querySelectorAll('br');
                    for (i = 0; ci = brs[i++];) {
                        if (/^apple-/i.test(ci.className)) {
                            domUtils.remove(ci);
                        }
                    }
                }
                if (browser.gecko) {
                    var dirtyNodes = div.querySelectorAll('[_moz_dirty]');
                    for (i = 0; ci = dirtyNodes[i++];) {
                        ci.removeAttribute('_moz_dirty');
                    }
                }
                if (!browser.ie) {
                    var spans = div.querySelectorAll('span.Apple-style-span');
                    for (var i = 0, ci; ci = spans[i++];) {
                        domUtils.remove(ci, true);
                    }
                }

                //ie下使用innerHTML会产生多余的\r\n字符，也会产生&nbsp;这里过滤掉
                html = div.innerHTML;//.replace(/>(?:(\s|&nbsp;)*?)</g,'><');

                //过滤word粘贴过来的冗余属性
                html = UM.filterWord(html);
                //取消了忽略空白的第二个参数，粘贴过来的有些是有空白的，会被套上相关的标签
                var root = UM.htmlparser(html);
                //如果给了过滤规则就先进行过滤
                if (me.options.filterRules) {
                    UM.filterNode(root, me.options.filterRules);
                }
                //执行默认的处理
                me.filterInputRule(root);
                //针对chrome的处理
                if (browser.webkit) {
                    var br = root.lastChild();
                    if (br && br.type == 'element' && br.tagName == 'br') {
                        root.removeChild(br)
                    }
                    utils.each(me.body.querySelectorAll('div'), function (node) {
                        if (domUtils.isEmptyBlock(node)) {
                            domUtils.remove(node)
                        }
                    })
                }
                html = {'html': root.toHtml()};
                me.fireEvent('beforepaste', html, root);
                //抢了默认的粘贴，那后边的内容就不执行了，比如表格粘贴
                if(!html.html){
                    return;
                }

                me.execCommand('insertHtml', html.html, true);
                me.fireEvent("afterpaste", html);
            }
        }


        me.addListener('ready', function () {
            $(me.body).on( 'cut', function () {
                var range = me.selection.getRange();
                if (!range.collapsed && me.undoManger) {
                    me.undoManger.save();
                }
            }).on(browser.ie || browser.opera ? 'keydown' : 'paste', function (e) {
                //ie下beforepaste在点击右键时也会触发，所以用监控键盘才处理
                if ((browser.ie || browser.opera) && ((!e.ctrlKey && !e.metaKey) || e.keyCode != '86')) {
                    return;
                }
                getClipboardData.call(me, function (div) {
                    filter(div);
                });
            });

        });
    };


    ///import core
    ///commands 有序列表,无序列表
    ///commandsName  InsertOrderedList,InsertUnorderedList
    ///commandsTitle  有序列表,无序列表
    /**
     * 有序列表
     * @function
     * @name UM.execCommand
     * @param   {String}   cmdName     insertorderlist插入有序列表
     * @param   {String}   style               值为：decimal,lower-alpha,lower-roman,upper-alpha,upper-roman
     * @author zhanyi
     */
    /**
     * 无序链接
     * @function
     * @name UM.execCommand
     * @param   {String}   cmdName     insertunorderlist插入无序列表
     * * @param   {String}   style            值为：circle,disc,square
     * @author zhanyi
     */

    UM.plugins['list'] = function () {
        var me = this;

        me.setOpt( {
            'insertorderedlist':{
                'decimal':'',
                'lower-alpha':'',
                'lower-roman':'',
                'upper-alpha':'',
                'upper-roman':''
            },
            'insertunorderedlist':{
                'circle':'',
                'disc':'',
                'square':''
            }
        } );

        this.addInputRule(function(root){
            utils.each(root.getNodesByTagName('li'), function (node) {
                if(node.children.length == 0){
                    node.parentNode.removeChild(node);
                }
            })
        });
        me.commands['insertorderedlist'] =
        me.commands['insertunorderedlist'] = {
                execCommand:function (cmdName) {
                    this.document.execCommand(cmdName);
                    var rng = this.selection.getRange(),
                        bk = rng.createBookmark(true);

                    this.$body.find('ol,ul').each(function(i,n){
                        var parent = n.parentNode;
                        if(parent.tagName == 'P' && parent.lastChild === parent.firstChild){
                            $(n).children().each(function(j,li){
                                var p = parent.cloneNode(false);
                                $(p).append(li.innerHTML);
                                $(li).html('').append(p);
                            });
                            $(n).insertBefore(parent);
                            $(parent).remove();
                        }

                        if(dtd.$inline[parent.tagName]){
                            if(parent.tagName == 'SPAN'){

                                $(n).children().each(function(k,li){
                                    var span = parent.cloneNode(false);
                                    if(li.firstChild.nodeName != 'P'){

                                        while(li.firstChild){
                                            span.appendChild(li.firstChild)
                                        };
                                        $('<p></p>').appendTo(li).append(span);
                                    }else{
                                        while(li.firstChild){
                                            span.appendChild(li.firstChild)
                                        };
                                        $(li.firstChild).append(span);
                                    }
                                })

                            }
                            domUtils.remove(parent,true)
                        }
                    });




                    rng.moveToBookmark(bk).select();
                    return true;
                },
                queryCommandState:function (cmdName) {
                    return this.document.queryCommandState(cmdName);
                }
            };
    };


    ///import core
    ///import plugins/serialize.js
    ///import plugins/undo.js
    ///commands 查看源码
    ///commandsName  Source
    ///commandsTitle  查看源码
    (function (){
        var sourceEditors = {
            textarea: function (editor, holder){
                var textarea = holder.ownerDocument.createElement('textarea');
                textarea.style.cssText = 'resize:none;border:0;padding:0;margin:0;overflow-y:auto;outline:0';
                // todo: IE下只有onresize属性可用... 很纠结
                if (browser.ie && browser.version < 8) {

                    textarea.style.width = holder.offsetWidth + 'px';
                    textarea.style.height = holder.offsetHeight + 'px';
                    holder.onresize = function (){
                        textarea.style.width = holder.offsetWidth + 'px';
                        textarea.style.height = holder.offsetHeight + 'px';
                    };
                }
                holder.appendChild(textarea);
                return {
                    container : textarea,
                    setContent: function (content){
                        textarea.value = content;
                    },
                    getContent: function (){
                        return textarea.value;
                    },
                    select: function (){
                        var range;
                        if (browser.ie) {
                            range = textarea.createTextRange();
                            range.collapse(true);
                            range.select();
                        } else {
                            //todo: chrome下无法设置焦点
                            textarea.setSelectionRange(0, 0);
                            textarea.focus();
                        }
                    },
                    dispose: function (){
                        holder.removeChild(textarea);
                        // todo
                        holder.onresize = null;
                        textarea = null;
                        holder = null;
                    }
                };
            }
        };

        UM.plugins['source'] = function (){
            var me = this;
            var opt = this.options;
            var sourceMode = false;
            var sourceEditor;

            opt.sourceEditor = 'textarea';

            me.setOpt({
                sourceEditorFirst:false
            });
            function createSourceEditor(holder){
                return sourceEditors.textarea(me, holder);
            }

            var bakCssText;
            //解决在源码模式下getContent不能得到最新的内容问题
            var oldGetContent = me.getContent,
                bakAddress;

            me.commands['source'] = {
                execCommand: function (){

                    sourceMode = !sourceMode;
                    if (sourceMode) {
                        bakAddress = me.selection.getRange().createAddress(false,true);
                        me.undoManger && me.undoManger.save(true);
                        if(browser.gecko){
                            me.body.contentEditable = false;
                        }

    //                    bakCssText = me.body.style.cssText;
                        me.body.style.cssText += ';position:absolute;left:-32768px;top:-32768px;';


                        me.fireEvent('beforegetcontent');
                        var root = UM.htmlparser(me.body.innerHTML);
                        me.filterOutputRule(root);
                        root.traversal(function (node) {
                            if (node.type == 'element') {
                                switch (node.tagName) {
                                    case 'td':
                                    case 'th':
                                    case 'caption':
                                        if(node.children && node.children.length == 1){
                                            if(node.firstChild().tagName == 'br' ){
                                                node.removeChild(node.firstChild())
                                            }
                                        };
                                        break;
                                    case 'pre':
                                        node.innerText(node.innerText().replace(/&nbsp;/g,' '))

                                }
                            }
                        });

                        me.fireEvent('aftergetcontent');

                        var content = root.toHtml(true);

                        sourceEditor = createSourceEditor(me.body.parentNode);

                        sourceEditor.setContent(content);

                        var getStyleValue=function(attr){
                            return parseInt($(me.body).css(attr));
                        };
                        $(sourceEditor.container).width($(me.body).width()+getStyleValue("padding-left")+getStyleValue("padding-right"))
                            .height($(me.body).height());
                        setTimeout(function (){
                            sourceEditor.select();
                        });
                        //重置getContent，源码模式下取值也能是最新的数据
                        me.getContent = function (){
                            return sourceEditor.getContent() || '<p>' + (browser.ie ? '' : '<br/>')+'</p>';
                        };
                    } else {
                        me.$body.css({
                            'position':'',
                            'left':'',
                            'top':''
                        });
    //                    me.body.style.cssText = bakCssText;
                        var cont = sourceEditor.getContent() || '<p>' + (browser.ie ? '' : '<br/>')+'</p>';
                        //处理掉block节点前后的空格,有可能会误命中，暂时不考虑
                        cont = cont.replace(new RegExp('[\\r\\t\\n ]*<\/?(\\w+)\\s*(?:[^>]*)>','g'), function(a,b){
                            if(b && !dtd.$inlineWithA[b.toLowerCase()]){
                                return a.replace(/(^[\n\r\t ]*)|([\n\r\t ]*$)/g,'');
                            }
                            return a.replace(/(^[\n\r\t]*)|([\n\r\t]*$)/g,'')
                        });
                        me.setContent(cont);
                        sourceEditor.dispose();
                        sourceEditor = null;
                        //还原getContent方法
                        me.getContent = oldGetContent;
                        var first = me.body.firstChild;
                        //trace:1106 都删除空了，下边会报错，所以补充一个p占位
                        if(!first){
                            me.body.innerHTML = '<p>'+(browser.ie?'':'<br/>')+'</p>';
                        }
                        //要在ifm为显示时ff才能取到selection,否则报错
                        //这里不能比较位置了
                        me.undoManger && me.undoManger.save(true);
                        if(browser.gecko){
                            me.body.contentEditable = true;
                        }
                        try{
                            me.selection.getRange().moveToAddress(bakAddress).select();
                        }catch(e){}

                    }
                    this.fireEvent('sourcemodechanged', sourceMode);
                },
                queryCommandState: function (){
                    return sourceMode|0;
                },
                notNeedUndo : 1
            };
            var oldQueryCommandState = me.queryCommandState;


            me.queryCommandState = function (cmdName){
                cmdName = cmdName.toLowerCase();
                if (sourceMode) {
                    //源码模式下可以开启的命令
                    return cmdName in {
                        'source' : 1,
                        'fullscreen' : 1
                    } ? oldQueryCommandState.apply(this, arguments)  : -1
                }
                return oldQueryCommandState.apply(this, arguments);
            };

        };

    })();
    ///import core
    ///import plugins/undo.js
    ///commands 设置回车标签p或br
    ///commandsName  EnterKey
    ///commandsTitle  设置回车标签p或br
    /**
     * @description 处理回车
     * @author zhanyi
     */
    UM.plugins['enterkey'] = function() {
        var hTag,
            me = this,
            tag = me.options.enterTag;
        me.addListener('keyup', function(type, evt) {

            var keyCode = evt.keyCode || evt.which;
            if (keyCode == 13) {
                var range = me.selection.getRange(),
                    start = range.startContainer,
                    doSave;

                //修正在h1-h6里边回车后不能嵌套p的问题
                if (!browser.ie) {

                    if (/h\d/i.test(hTag)) {
                        if (browser.gecko) {
                            var h = domUtils.findParentByTagName(start, [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6','blockquote','caption','table'], true);
                            if (!h) {
                                me.document.execCommand('formatBlock', false, '<p>');
                                doSave = 1;
                            }
                        } else {
                            //chrome remove div
                            if (start.nodeType == 1) {
                                var tmp = me.document.createTextNode(''),div;
                                range.insertNode(tmp);
                                div = domUtils.findParentByTagName(tmp, 'div', true);
                                if (div) {
                                    var p = me.document.createElement('p');
                                    while (div.firstChild) {
                                        p.appendChild(div.firstChild);
                                    }
                                    div.parentNode.insertBefore(p, div);
                                    domUtils.remove(div);
                                    range.setStartBefore(tmp).setCursor();
                                    doSave = 1;
                                }
                                domUtils.remove(tmp);

                            }
                        }

                        if (me.undoManger && doSave) {
                            me.undoManger.save();
                        }
                    }
                    //没有站位符，会出现多行的问题
                    browser.opera &&  range.select();
                }else{
                    me.fireEvent('saveScene',true,true)
                }
            }
        });

        me.addListener('keydown', function(type, evt) {
            var keyCode = evt.keyCode || evt.which;
            if (keyCode == 13) {//回车
                if(me.fireEvent('beforeenterkeydown')){
                    domUtils.preventDefault(evt);
                    return;
                }
                me.fireEvent('saveScene',true,true);
                hTag = '';


                var range = me.selection.getRange();

                if (!range.collapsed) {
                    //跨td不能删
                    var start = range.startContainer,
                        end = range.endContainer,
                        startTd = domUtils.findParentByTagName(start, 'td', true),
                        endTd = domUtils.findParentByTagName(end, 'td', true);
                    if (startTd && endTd && startTd !== endTd || !startTd && endTd || startTd && !endTd) {
                        evt.preventDefault ? evt.preventDefault() : ( evt.returnValue = false);
                        return;
                    }
                }
                if (tag == 'p') {


                    if (!browser.ie) {

                        start = domUtils.findParentByTagName(range.startContainer, ['ol','ul','p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6','blockquote','caption'], true);

                        //opera下执行formatblock会在table的场景下有问题，回车在opera原生支持很好，所以暂时在opera去掉调用这个原生的command
                        //trace:2431
                        if (!start && !browser.opera) {

                            me.document.execCommand('formatBlock', false, '<p>');

                            if (browser.gecko) {
                                range = me.selection.getRange();
                                start = domUtils.findParentByTagName(range.startContainer, 'p', true);
                                start && domUtils.removeDirtyAttr(start);
                            }


                        } else {
                            hTag = start.tagName;
                            start.tagName.toLowerCase() == 'p' && browser.gecko && domUtils.removeDirtyAttr(start);
                        }

                    }

                }

            }
        });

        browser.ie && me.addListener('setDisabled',function(){
            $(me.body).find('p').each(function(i,p){
                if(domUtils.isEmptyBlock(p)){
                    p.innerHTML = '&nbsp;'
                }
            })
        })
    };

    ///import core
    ///commands 预览
    ///commandsName  Preview
    ///commandsTitle  预览
    /**
     * 预览
     * @function
     * @name UM.execCommand
     * @param   {String}   cmdName     preview预览编辑器内容
     */
    UM.commands['preview'] = {
        execCommand : function(){
            var w = window.open('', '_blank', ''),
                d = w.document,
                c = this.getContent(null,null,true),
                path = this.getOpt('UMEDITOR_HOME_URL'),
                formula = c.indexOf('mathquill-embedded-latex')!=-1 ?
                    '<link rel="stylesheet" href="' + path + 'third-party/mathquill/mathquill.css"/>' +
                    '<script src="' + path + 'third-party/jquery.min.js"></script>' +
                    '<script src="' + path + 'third-party/mathquill/mathquill.min.js"></script>':'';
            d.open();
            d.write('<html><head>' + formula + '</head><body><div>'+c+'</div></body></html>');
            d.close();
        },
        notNeedUndo : 1
    };

    ///import core
    ///commands 加粗,斜体,上标,下标
    ///commandsName  Bold,Italic,Subscript,Superscript
    ///commandsTitle  加粗,加斜,下标,上标
    /**
     * b u i等基础功能实现
     * @function
     * @name UM.execCommands
     * @param    {String}    cmdName    bold加粗。italic斜体。subscript上标。superscript下标。
    */
    UM.plugins['basestyle'] = function(){
        var basestyles = ['bold','underline','superscript','subscript','italic','strikethrough'],
            me = this;
        //添加快捷键
        me.addshortcutkey({
            "Bold" : "ctrl+66",//^B
            "Italic" : "ctrl+73", //^I
            "Underline" : "ctrl+shift+85",//^U
            "strikeThrough" : 'ctrl+shift+83' //^s
        });
        //过滤最后的产出数据
        me.addOutputRule(function(root){
            $.each(root.getNodesByTagName('b i u strike s'),function(i,node){
                switch (node.tagName){
                    case 'b':
                        node.tagName = 'strong';
                        break;
                    case 'i':
                        node.tagName = 'em';
                        break;
                    case 'u':
                        node.tagName = 'span';
                        node.setStyle('text-decoration','underline');
                        break;
                    case 's':
                    case 'strike':
                        node.tagName = 'span';
                        node.setStyle('text-decoration','line-through')
                }
            });
        });
        $.each(basestyles,function(i,cmd){
            me.commands[cmd] = {
                execCommand : function( cmdName ) {
                    var rng = this.selection.getRange();
                    if(rng.collapsed && this.queryCommandState(cmdName) != 1){
                        var node = this.document.createElement({
                            'bold':'strong',
                            'underline':'u',
                            'superscript':'sup',
                            'subscript':'sub',
                            'italic':'em',
                            'strikethrough':'strike'
                        }[cmdName]);
                        rng.insertNode(node).setStart(node,0).setCursor(false);
                        return true;
                    }else{
                        return this.document.execCommand(cmdName)
                    }

                },
                queryCommandState : function(cmdName) {
                    if(browser.gecko){
                        return this.document.queryCommandState(cmdName)
                    }
                    var path = this.selection.getStartElementPath(),result = false;
                    $.each(path,function(i,n){
                        switch (cmdName){
                            case 'bold':
                                if(n.nodeName == 'STRONG' || n.nodeName == 'B'){
                                    result = 1;
                                    return false;
                                }
                                break;
                            case 'underline':
                                if(n.nodeName == 'U' || n.nodeName == 'SPAN' && $(n).css('text-decoration') == 'underline'){
                                    result = 1;
                                    return false;
                                }
                                break;
                            case 'superscript':
                                if(n.nodeName == 'SUP'){
                                    result = 1;
                                    return false;
                                }
                                break;
                            case 'subscript':
                                if(n.nodeName == 'SUB'){
                                    result = 1;
                                    return false;
                                }
                                break;
                            case 'italic':
                                if(n.nodeName == 'EM' || n.nodeName == 'I'){
                                    result = 1;
                                    return false;
                                }
                                break;
                            case 'strikethrough':
                                if(n.nodeName == 'S' || n.nodeName == 'STRIKE' || n.nodeName == 'SPAN' && $(n).css('text-decoration') == 'line-through'){
                                    result = 1;
                                    return false;
                                }
                                break;
                        }
                    })
                    return result
                }
            };
        })
    };


    ///import core
    ///import plugins/inserthtml.js
    ///commands 视频
    ///commandsName InsertVideo
    ///commandsTitle  插入视频
    ///commandsDialog  dialogs\video
    UM.plugins['video'] = function (){
        var me =this,
            div;

        /**
         * 创建插入视频字符窜
         * @param url 视频地址
         * @param width 视频宽度
         * @param height 视频高度
         * @param align 视频对齐
         * @param toEmbed 是否以flash代替显示
         * @param addParagraph  是否需要添加P 标签
         */
        function creatInsertStr(url,width,height,id,align,toEmbed){
            return  !toEmbed ?

                    '<img ' + (id ? 'id="' + id+'"' : '') + ' width="'+ width +'" height="' + height + '" _url="'+url+'" class="edui-faked-video"'  +
                    ' src="' + me.options.UMEDITOR_HOME_URL+'themes/default/images/spacer.gif" style="background:url('+me.options.UMEDITOR_HOME_URL+'themes/default/images/videologo.gif) no-repeat center center; border:1px solid gray;'+(align ? 'float:' + align + ';': '')+'" />'

                    :
                    '<embed type="application/x-shockwave-flash" class="edui-faked-video" pluginspage="http://www.macromedia.com/go/getflashplayer"' +
                    ' src="' + url + '" width="' + width  + '" height="' + height  + '"'  + (align ? ' style="float:' + align + '"': '') +
                    ' wmode="transparent" play="true" loop="false" menu="false" allowscriptaccess="never" allowfullscreen="true" >';
        }

        function switchImgAndEmbed(root,img2embed){
            utils.each(root.getNodesByTagName(img2embed ? 'img' : 'embed'),function(node){
                if(node.getAttr('class') == 'edui-faked-video'){

                    var html = creatInsertStr( img2embed ? node.getAttr('_url') : node.getAttr('src'),node.getAttr('width'),node.getAttr('height'),null,node.getStyle('float') || '',img2embed);
                    node.parentNode.replaceChild(UM.uNode.createElement(html),node)
                }
            })
        }

        me.addOutputRule(function(root){
            switchImgAndEmbed(root,true)
        });
        me.addInputRule(function(root){
            switchImgAndEmbed(root)
        });

        me.commands["insertvideo"] = {
            execCommand: function (cmd, videoObjs){
                videoObjs = utils.isArray(videoObjs)?videoObjs:[videoObjs];
                var html = [],id = 'tmpVedio';
                for(var i=0,vi,len = videoObjs.length;i<len;i++){
                     vi = videoObjs[i];
                     vi.url = utils.unhtml(vi.url, /[<">'](?:(amp|lt|quot|gt|#39|nbsp);)?/g);
                     html.push(creatInsertStr( vi.url, vi.width || 420,  vi.height || 280, id + i,vi.align,false));
                }
                me.execCommand("inserthtml",html.join(""),true);

            },
            queryCommandState : function(){
                var img = me.selection.getRange().getClosedNode(),
                    flag = img && (img.className == "edui-faked-video");
                return flag ? 1 : 0;
            }
        };
    };
    ///import core
    ///commands 全选
    ///commandsName  SelectAll
    ///commandsTitle  全选
    /**
     * 选中所有
     * @function
     * @name UM.execCommand
     * @param   {String}   cmdName    selectall选中编辑器里的所有内容
     * @author zhanyi
    */
    UM.plugins['selectall'] = function(){
        var me = this;
        me.commands['selectall'] = {
            execCommand : function(){
                //去掉了原生的selectAll,因为会出现报错和当内容为空时，不能出现闭合状态的光标
                var me = this,body = me.body,
                    range = me.selection.getRange();
                range.selectNodeContents(body);
                if(domUtils.isEmptyBlock(body)){
                    //opera不能自动合并到元素的里边，要手动处理一下
                    if(browser.opera && body.firstChild && body.firstChild.nodeType == 1){
                        range.setStartAtFirst(body.firstChild);
                    }
                    range.collapse(true);
                }
                range.select(true);
            },
            notNeedUndo : 1
        };


        //快捷键
        me.addshortcutkey({
             "selectAll" : "ctrl+65"
        });
    };

    //UM.plugins['removeformat'] = function () {
    //    var me = this;
    //    me.commands['removeformat'] = {
    //        execCommand: function () {
    //            me.document.execCommand('removeformat');
    //
    //            /* 处理ie8和firefox选区有链接时,清除格式的bug */
    //            if (browser.gecko || browser.ie8 || browser.webkit) {
    //                var nativeRange = this.selection.getNative().getRangeAt(0),
    //                    common = nativeRange.commonAncestorContainer,
    //                    rng = me.selection.getRange(),
    //                    bk = rng.createBookmark();
    //
    //                function isEleInBookmark(node, bk){
    //                    if ( (domUtils.getPosition(node, bk.start) & domUtils.POSITION_FOLLOWING) &&
    //                        (domUtils.getPosition(bk.end, node) & domUtils.POSITION_FOLLOWING) ) {
    //                        return true;
    //                    } else if ( (domUtils.getPosition(node, bk.start) & domUtils.POSITION_CONTAINS) ||
    //                        (domUtils.getPosition(node, bk.end) & domUtils.POSITION_CONTAINS) ) {
    //                        return true;
    //                    }
    //                    return false;
    //                }
    //
    //                $(common).find('a').each(function (k, a) {
    //                    if ( isEleInBookmark(a, bk) ) {
    //                        a.removeAttribute('style');
    //                    }
    //                });
    //
    //            }
    //        }
    //    };
    //
    //};
    //


    UM.plugins['removeformat'] = function(){
        var me = this;
        me.setOpt({
            'removeFormatTags': 'b,big,code,del,dfn,em,font,i,ins,kbd,q,samp,small,span,strike,strong,sub,sup,tt,u,var',
            'removeFormatAttributes':'class,style,lang,width,height,align,hspace,valign'
        });
        me.commands['removeformat'] = {
            execCommand : function( cmdName, tags, style, attrs,notIncludeA ) {

                var tagReg = new RegExp( '^(?:' + (tags || this.options.removeFormatTags).replace( /,/g, '|' ) + ')$', 'i' ) ,
                    removeFormatAttributes = style ? [] : (attrs || this.options.removeFormatAttributes).split( ',' ),
                    range = new dom.Range( this.document ),
                    bookmark,node,parent,
                    filter = function( node ) {
                        return node.nodeType == 1;
                    };

                function isRedundantSpan (node) {
                    if (node.nodeType == 3 || node.tagName.toLowerCase() != 'span'){
                        return 0;
                    }
                    if (browser.ie) {
                        //ie 下判断实效，所以只能简单用style来判断
                        //return node.style.cssText == '' ? 1 : 0;
                        var attrs = node.attributes;
                        if ( attrs.length ) {
                            for ( var i = 0,l = attrs.length; i<l; i++ ) {
                                if ( attrs[i].specified ) {
                                    return 0;
                                }
                            }
                            return 1;
                        }
                    }
                    return !node.attributes.length;
                }
                function doRemove( range ) {

                    var bookmark1 = range.createBookmark();
                    if ( range.collapsed ) {
                        range.enlarge( true );
                    }

                    //不能把a标签切了
                    if(!notIncludeA){
                        var aNode = domUtils.findParentByTagName(range.startContainer,'a',true);
                        if(aNode){
                            range.setStartBefore(aNode);
                        }

                        aNode = domUtils.findParentByTagName(range.endContainer,'a',true);
                        if(aNode){
                            range.setEndAfter(aNode);
                        }

                    }


                    bookmark = range.createBookmark();

                    node = bookmark.start;

                    //切开始
                    while ( (parent = node.parentNode) && !domUtils.isBlockElm( parent ) ) {
                        domUtils.breakParent( node, parent );
                        domUtils.clearEmptySibling( node );
                    }
                    if ( bookmark.end ) {
                        //切结束
                        node = bookmark.end;
                        while ( (parent = node.parentNode) && !domUtils.isBlockElm( parent ) ) {
                            domUtils.breakParent( node, parent );
                            domUtils.clearEmptySibling( node );
                        }

                        //开始去除样式
                        var current = domUtils.getNextDomNode( bookmark.start, false, filter ),
                            next;
                        while ( current ) {
                            if ( current == bookmark.end ) {
                                break;
                            }

                            next = domUtils.getNextDomNode( current, true, filter );

                            if ( !dtd.$empty[current.tagName.toLowerCase()] && !domUtils.isBookmarkNode( current ) ) {
                                if ( tagReg.test( current.tagName ) ) {
                                    if ( style ) {
                                        domUtils.removeStyle( current, style );
                                        if ( isRedundantSpan( current ) && style != 'text-decoration'){
                                            domUtils.remove( current, true );
                                        }
                                    } else {
                                        domUtils.remove( current, true );
                                    }
                                } else {
                                    //trace:939  不能把list上的样式去掉
                                    if(!dtd.$tableContent[current.tagName] && !dtd.$list[current.tagName]){
                                        domUtils.removeAttributes( current, removeFormatAttributes );
                                        if ( isRedundantSpan( current ) ){
                                            domUtils.remove( current, true );
                                        }
                                    }

                                }
                            }
                            current = next;
                        }
                    }
                    //trace:1035
                    //trace:1096 不能把td上的样式去掉，比如边框
                    var pN = bookmark.start.parentNode;
                    if(domUtils.isBlockElm(pN) && !dtd.$tableContent[pN.tagName] && !dtd.$list[pN.tagName]){
                        domUtils.removeAttributes(  pN,removeFormatAttributes );
                    }
                    pN = bookmark.end.parentNode;
                    if(bookmark.end && domUtils.isBlockElm(pN) && !dtd.$tableContent[pN.tagName]&& !dtd.$list[pN.tagName]){
                        domUtils.removeAttributes(  pN,removeFormatAttributes );
                    }
                    range.moveToBookmark( bookmark ).moveToBookmark(bookmark1);
                    //清除冗余的代码 <b><bookmark></b>
                    var node = range.startContainer,
                        tmp,
                        collapsed = range.collapsed;
                    while(node.nodeType == 1 && domUtils.isEmptyNode(node) && dtd.$removeEmpty[node.tagName]){
                        tmp = node.parentNode;
                        range.setStartBefore(node);
                        //trace:937
                        //更新结束边界
                        if(range.startContainer === range.endContainer){
                            range.endOffset--;
                        }
                        domUtils.remove(node);
                        node = tmp;
                    }

                    if(!collapsed){
                        node = range.endContainer;
                        while(node.nodeType == 1 && domUtils.isEmptyNode(node) && dtd.$removeEmpty[node.tagName]){
                            tmp = node.parentNode;
                            range.setEndBefore(node);
                            domUtils.remove(node);

                            node = tmp;
                        }


                    }
                }



                range = this.selection.getRange();
                if(!range.collapsed) {
                    doRemove( range );
                    range.select();
                }

            }

        };

    };
    /*
     *   处理特殊键的兼容性问题
     */
    UM.plugins['keystrokes'] = function() {
        var me = this;
        var collapsed = true;
        me.addListener('keydown', function(type, evt) {
            var keyCode = evt.keyCode || evt.which,
                rng = me.selection.getRange();

            //处理全选的情况
            if(!rng.collapsed && !(evt.ctrlKey || evt.shiftKey || evt.altKey || evt.metaKey) && (keyCode >= 65 && keyCode <=90
                || keyCode >= 48 && keyCode <= 57 ||
                keyCode >= 96 && keyCode <= 111 || {
                13:1,
                8:1,
                46:1
            }[keyCode])
                ){

                var tmpNode = rng.startContainer;
                if(domUtils.isFillChar(tmpNode)){
                    rng.setStartBefore(tmpNode)
                }
                tmpNode = rng.endContainer;
                if(domUtils.isFillChar(tmpNode)){
                    rng.setEndAfter(tmpNode)
                }
                rng.txtToElmBoundary();
                //结束边界可能放到了br的前边，要把br包含进来
                // x[xxx]<br/>
                if(rng.endContainer && rng.endContainer.nodeType == 1){
                    tmpNode = rng.endContainer.childNodes[rng.endOffset];
                    if(tmpNode && domUtils.isBr(tmpNode)){
                        rng.setEndAfter(tmpNode);
                    }
                }
                if(rng.startOffset == 0){
                    tmpNode = rng.startContainer;
                    if(domUtils.isBoundaryNode(tmpNode,'firstChild') ){
                        tmpNode = rng.endContainer;
                        if(rng.endOffset == (tmpNode.nodeType == 3 ? tmpNode.nodeValue.length : tmpNode.childNodes.length) && domUtils.isBoundaryNode(tmpNode,'lastChild')){
                            me.fireEvent('saveScene');
                            me.body.innerHTML = '<p>'+(browser.ie ? '' : '<br/>')+'</p>';
                            rng.setStart(me.body.firstChild,0).setCursor(false,true);
                            me._selectionChange();
                            return;
                        }
                    }
                }
            }

            //处理backspace
            if (keyCode == 8) {
                rng = me.selection.getRange();
                collapsed = rng.collapsed;
                if(me.fireEvent('delkeydown',evt)){
                    return;
                }
                var start,end;
                //避免按两次删除才能生效的问题
                if(rng.collapsed && rng.inFillChar()){
                    start = rng.startContainer;

                    if(domUtils.isFillChar(start)){
                        rng.setStartBefore(start).shrinkBoundary(true).collapse(true);
                        domUtils.remove(start)
                    }else{
                        start.nodeValue = start.nodeValue.replace(new RegExp('^' + domUtils.fillChar ),'');
                        rng.startOffset--;
                        rng.collapse(true).select(true)
                    }
                }
                //解决选中control元素不能删除的问题
                if (start = rng.getClosedNode()) {
                    me.fireEvent('saveScene');
                    rng.setStartBefore(start);
                    domUtils.remove(start);
                    rng.setCursor();
                    me.fireEvent('saveScene');
                    domUtils.preventDefault(evt);
                    return;
                }
                //阻止在table上的删除
                if (!browser.ie) {
                    start = domUtils.findParentByTagName(rng.startContainer, 'table', true);
                    end = domUtils.findParentByTagName(rng.endContainer, 'table', true);
                    if (start && !end || !start && end || start !== end) {
                        evt.preventDefault();
                        return;
                    }
                }
                start = rng.startContainer;
                if(rng.collapsed && start.nodeType == 1){
                    var currentNode = start.childNodes[rng.startOffset-1];
                    if(currentNode && currentNode.nodeType == 1 && currentNode.tagName == 'BR'){
                        me.fireEvent('saveScene');
                        rng.setStartBefore(currentNode).collapse(true);
                        domUtils.remove(currentNode);
                        rng.select();
                        me.fireEvent('saveScene');
                    }
                }

                //trace:3613
                if(browser.chrome){
                    if(rng.collapsed){

                        while(rng.startOffset == 0 && !domUtils.isEmptyBlock(rng.startContainer)){
                            rng.setStartBefore(rng.startContainer)
                        }
                        var pre = rng.startContainer.childNodes[rng.startOffset-1];
                        if(pre && pre.nodeName == 'BR'){
                            rng.setStartBefore(pre);
                            me.fireEvent('saveScene');
                            $(pre).remove();
                            rng.setCursor();
                            me.fireEvent('saveScene');
                        }

                    }
                }
            }
            //trace:1634
            //ff的del键在容器空的时候，也会删除
            if(browser.gecko && keyCode == 46){
                var range = me.selection.getRange();
                if(range.collapsed){
                    start = range.startContainer;
                    if(domUtils.isEmptyBlock(start)){
                        var parent = start.parentNode;
                        while(domUtils.getChildCount(parent) == 1 && !domUtils.isBody(parent)){
                            start = parent;
                            parent = parent.parentNode;
                        }
                        if(start === parent.lastChild)
                            evt.preventDefault();
                        return;
                    }
                }
            }
        });
        me.addListener('keyup', function(type, evt) {
            var keyCode = evt.keyCode || evt.which,
                rng,me = this;
            if(keyCode == 8){
                if(me.fireEvent('delkeyup')){
                    return;
                }
                rng = me.selection.getRange();
                if(rng.collapsed){
                    var tmpNode,
                        autoClearTagName = ['h1','h2','h3','h4','h5','h6'];
                    if(tmpNode = domUtils.findParentByTagName(rng.startContainer,autoClearTagName,true)){
                        if(domUtils.isEmptyBlock(tmpNode)){
                            var pre = tmpNode.previousSibling;
                            if(pre && pre.nodeName != 'TABLE'){
                                domUtils.remove(tmpNode);
                                rng.setStartAtLast(pre).setCursor(false,true);
                                return;
                            }else{
                                var next = tmpNode.nextSibling;
                                if(next && next.nodeName != 'TABLE'){
                                    domUtils.remove(tmpNode);
                                    rng.setStartAtFirst(next).setCursor(false,true);
                                    return;
                                }
                            }
                        }
                    }
                    //处理当删除到body时，要重新给p标签展位
                    if(domUtils.isBody(rng.startContainer)){
                        var tmpNode = domUtils.createElement(me.document,'p',{
                            'innerHTML' : browser.ie ? domUtils.fillChar : '<br/>'
                        });
                        rng.insertNode(tmpNode).setStart(tmpNode,0).setCursor(false,true);
                    }
                }


                //chrome下如果删除了inline标签，浏览器会有记忆，在输入文字还是会套上刚才删除的标签，所以这里再选一次就不会了
                if( !collapsed && (rng.startContainer.nodeType == 3 || rng.startContainer.nodeType == 1 && domUtils.isEmptyBlock(rng.startContainer))){
                    if(browser.ie){
                        var span = rng.document.createElement('span');
                        rng.insertNode(span).setStartBefore(span).collapse(true);
                        rng.select();
                        domUtils.remove(span)
                    }else{
                        rng.select()
                    }

                }
            }

        })
    };
    /**
     * 自动保存草稿
     */
    UM.plugins['autosave'] = function() {


        var me = this,
            //无限循环保护
            lastSaveTime = new Date(),
            //最小保存间隔时间
            MIN_TIME = 20,
            //auto save key
            saveKey = null;


        //默认间隔时间
        me.setOpt('saveInterval', 500);

        //存储媒介封装
        var LocalStorage = UM.LocalStorage = ( function () {

            var storage = window.localStorage || getUserData() || null,
                LOCAL_FILE = "localStorage";

            return {

                saveLocalData: function ( key, data ) {

                    if ( storage && data) {
                        storage.setItem( key, data  );
                        return true;
                    }

                    return false;

                },

                getLocalData: function ( key ) {

                    if ( storage ) {
                        return storage.getItem( key );
                    }

                    return null;

                },

                removeItem: function ( key ) {

                    storage && storage.removeItem( key );

                }

            };

            function getUserData () {

                var container = document.createElement( "div" );
                container.style.display = "none";

                if( !container.addBehavior ) {
                    return null;
                }

                container.addBehavior("#default#userdata");

                return {

                    getItem: function ( key ) {

                        var result = null;

                        try {
                            document.body.appendChild( container );
                            container.load( LOCAL_FILE );
                            result = container.getAttribute( key );
                            document.body.removeChild( container );
                        } catch ( e ) {
                        }

                        return result;

                    },

                    setItem: function ( key, value ) {

                        document.body.appendChild( container );
                        container.setAttribute( key, value );
                        container.save( LOCAL_FILE );
                        document.body.removeChild( container );

                    },
    //               暂时没有用到
    //                clear: function () {
    //
    //                    var expiresTime = new Date();
    //                    expiresTime.setFullYear( expiresTime.getFullYear() - 1 );
    //                    document.body.appendChild( container );
    //                    container.expires = expiresTime.toUTCString();
    //                    container.save( LOCAL_FILE );
    //                    document.body.removeChild( container );
    //
    //                },

                    removeItem: function ( key ) {

                        document.body.appendChild( container );
                        container.removeAttribute( key );
                        container.save( LOCAL_FILE );
                        document.body.removeChild( container );

                    }

                };

            }

        } )();

        function save ( editor ) {

            var saveData = null;

            if ( new Date() - lastSaveTime < MIN_TIME ) {
                return;
            }

            if ( !editor.hasContents() ) {
                //这里不能调用命令来删除， 会造成事件死循环
                saveKey && LocalStorage.removeItem( saveKey );
                return;
            }

            lastSaveTime = new Date();

            editor._saveFlag = null;

            saveData = me.body.innerHTML;

            if ( editor.fireEvent( "beforeautosave", {
                content: saveData
            } ) === false ) {
                return;
            }

            LocalStorage.saveLocalData( saveKey, saveData );

            editor.fireEvent( "afterautosave", {
                content: saveData
            } );

        }

        me.addListener('ready', function(){
            var _suffix = "-drafts-data",
                key = null;

            if ( me.key ) {
                key = me.key + _suffix;
            } else {
                key = ( me.container.parentNode.id || 'ue-common' ) + _suffix;
            }

            //页面地址+编辑器ID 保持唯一
            saveKey = ( location.protocol + location.host + location.pathname ).replace( /[.:\/]/g, '_' ) + key;
        });

        me.addListener('contentchange', function(){

            if ( !saveKey ) {
                return;
            }

            if ( me._saveFlag ) {
                window.clearTimeout( me._saveFlag );
            }

            if ( me.options.saveInterval > 0 ) {

                me._saveFlag = window.setTimeout( function () {

                    save( me );

                }, me.options.saveInterval );

            } else {

                save(me);

            }

        })


        me.commands['clearlocaldata'] = {
            execCommand:function (cmd, name) {
                if ( saveKey && LocalStorage.getLocalData( saveKey ) ) {
                    LocalStorage.removeItem( saveKey )
                }
            },
            notNeedUndo: true,
            ignoreContentChange:true
        };

        me.commands['getlocaldata'] = {
            execCommand:function (cmd, name) {
                return saveKey ? LocalStorage.getLocalData( saveKey ) || '' : '';
            },
            notNeedUndo: true,
            ignoreContentChange:true
        };

        me.commands['drafts'] = {
            execCommand:function (cmd, name) {
                if ( saveKey ) {
                    me.body.innerHTML = LocalStorage.getLocalData( saveKey ) || '<p>'+(browser.ie ? '&nbsp;' : '<br/>')+'</p>';
                    me.focus(true);
                }
            },
            queryCommandState: function () {
                return saveKey ? ( LocalStorage.getLocalData( saveKey ) === null ? -1 : 0 ) : -1;
            },
            notNeedUndo: true,
            ignoreContentChange:true
        }

    };

    /**
     * @description
     * 1.拖放文件到编辑区域，自动上传并插入到选区
     * 2.插入粘贴板的图片，自动上传并插入到选区
     * @author Jinqn
     * @date 2013-10-14
     */
    UM.plugins['autoupload'] = function () {

        var me = this;

        me.setOpt('pasteImageEnabled', true);
        me.setOpt('dropFileEnabled', true);
        var sendAndInsertImage = function (file, editor) {
            //模拟数据
            var fd = new FormData();
            fd.append(editor.options.imageFieldName || 'upfile', file, file.name || ('blob.' + file.type.substr('image/'.length)));
            fd.append('type', 'ajax');
            var xhr = new XMLHttpRequest();
            xhr.open("post", me.options.imageUrl, true);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.addEventListener('load', function (e) {
                try {
                    var json = eval('('+e.target.response+')'),
                        link = json.url,
                        picLink = me.options.imagePath + link;
                    editor.execCommand('insertimage', {
                        src: picLink,
                        _src: picLink
                    });
                } catch (er) {
                }
            });
            xhr.send(fd);
        };

        function getPasteImage(e) {
            return e.clipboardData && e.clipboardData.items && e.clipboardData.items.length == 1 && /^image\//.test(e.clipboardData.items[0].type) ? e.clipboardData.items : null;
        }

        function getDropImage(e) {
            return  e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files : null;
        }

        me.addListener('ready', function () {
            if (window.FormData && window.FileReader) {
                var autoUploadHandler = function (e) {
                    var hasImg = false,
                        items;
                    //获取粘贴板文件列表或者拖放文件列表
                    items = e.type == 'paste' ? getPasteImage(e.originalEvent) : getDropImage(e.originalEvent);
                    if (items) {
                        var len = items.length,
                            file;
                        while (len--) {
                            file = items[len];
                            if (file.getAsFile) file = file.getAsFile();
                            if (file && file.size > 0 && /image\/\w+/i.test(file.type)) {
                                sendAndInsertImage(file, me);
                                hasImg = true;
                            }
                        }
                        if (hasImg) return false;
                    }

                };
                me.getOpt('pasteImageEnabled') && me.$body.on('paste', autoUploadHandler);
                me.getOpt('dropFileEnabled') && me.$body.on('drop', autoUploadHandler);

                //取消拖放图片时出现的文字光标位置提示
                me.$body.on('dragover', function (e) {
                    if (e.originalEvent.dataTransfer.types[0] == 'Files') {
                        return false;
                    }
                });
            }
        });

    };
    /**
     * 公式插件
     */
    UM.plugins['formula'] = function () {
        var me = this;

        function getActiveIframe() {
            return me.$body.find('iframe.edui-formula-active')[0] || null;
        }

        function blurActiveIframe(){
            var iframe = getActiveIframe();
            iframe && iframe.contentWindow.formula.blur();
        }

        me.addInputRule(function (root) {
            $.each(root.getNodesByTagName('span'), function (i, node) {
                if (node.hasClass('mathquill-embedded-latex')) {
                    var firstChild, latex = '';
                    while(firstChild = node.firstChild()){
                        latex += firstChild.data;
                        node.removeChild(firstChild);
                    }
                    node.tagName = 'iframe';
                    node.setAttr({
                        'frameborder': '0',
                        'src': me.getOpt('UMEDITOR_HOME_URL') + 'dialogs/formula/formula.html',
                        'data-latex': utils.unhtml(latex)
                    });
                }
            });
        });
        me.addOutputRule(function (root) {
            $.each(root.getNodesByTagName('iframe'), function (i, node) {
                if (node.hasClass('mathquill-embedded-latex')) {
                    node.tagName = 'span';
                    node.appendChild(UM.uNode.createText(node.getAttr('data-latex')));
                    node.setAttr({
                        'frameborder': '',
                        'src': '',
                        'data-latex': ''
                    });
                }
            });
        });
        me.addListener('click', function(){
            blurActiveIframe();
        });
        me.addListener('afterexeccommand', function(type, cmd){
            if(cmd != 'formula') {
                blurActiveIframe();
            }
        });

        me.commands['formula'] = {
            execCommand: function (cmd, latex) {
                var iframe = getActiveIframe();
                if (iframe) {
                    iframe.contentWindow.formula.insertLatex(latex);
                } else {
                    me.execCommand('inserthtml', '<span class="mathquill-embedded-latex">' + latex + '</span>');
                    browser.ie && browser.ie9below && setTimeout(function(){
                        var rng = me.selection.getRange(),
                            startContainer = rng.startContainer;
                        if(startContainer.nodeType == 1 && !startContainer.childNodes[rng.startOffset]){
                            rng.insertNode(me.document.createTextNode(' '));
                            rng.setCursor()
                        }
                    },100)
                }
            },
            queryCommandState: function (cmd) {
                return 0;
            },
            queryCommandValue: function (cmd) {
                var iframe = getActiveIframe();
                return iframe && iframe.contentWindow.formula.getLatex();
            }
        }

    };

    /**
     * @file xssFilter.js
     * @desc xss过滤器
     * @author robbenmu
     */

    UM.plugins.xssFilter = function() {

    	var config = UMEDITOR_CONFIG;
    	var whiteList = config.whiteList;

    	function filter(node) {

    		var tagName = node.tagName;
    		var attrs = node.attrs;

    		if (!whiteList.hasOwnProperty(tagName)) {
    			node.parentNode.removeChild(node);
    			return false;
    		}

    		UM.utils.each(attrs, function (val, key) {

    			if (whiteList[tagName].indexOf(key) === -1) {
    				node.setAttr(key);
    			}
    		});
    	}

    	// 添加inserthtml\paste等操作用的过滤规则
    	if (whiteList && config.xssFilterRules) {
    		this.options.filterRules = function () {

    			var result = {};

    			UM.utils.each(whiteList, function(val, key) {
    				result[key] = function (node) {
    					return filter(node);
    				};
    			});

    			return result;
    		}();
    	}

    	var tagList = [];

    	UM.utils.each(whiteList, function (val, key) {
    		tagList.push(key);
    	});

    	// 添加input过滤规则
    	//
    	if (whiteList && config.inputXssFilter) {
    		this.addInputRule(function (root) {

    			root.traversal(function(node) {
    				if (node.type !== 'element') {
    					return false;
    				}
    				filter(node);
    			});
    		});
    	}
    	// 添加output过滤规则
    	//
    	if (whiteList && config.outputXssFilter) {
    		this.addOutputRule(function (root) {

    			root.traversal(function(node) {
    				if (node.type !== 'element') {
    					return false;
    				}
    				filter(node);
    			});
    		});
    	}

    };
    (function ($) {
        //对jquery的扩展
        $.parseTmpl = function parse(str, data) {
            var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' + 'with(obj||{}){__p.push(\'' + str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/<%=([\s\S]+?)%>/g,function (match, code) {
                return "',obj." + code.replace(/\\'/g, "'") + ",'";
            }).replace(/<%([\s\S]+?)%>/g,function (match, code) {
                    return "');" + code.replace(/\\'/g, "'").replace(/[\r\n\t]/g, ' ') + "__p.push('";
                }).replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + "');}return __p.join('');";
            var func = new Function('obj', tmpl);
            return data ? func(data) : func;
        };
        $.extend2 = function (t, s) {
            var a = arguments,
                notCover = $.type(a[a.length - 1]) == 'boolean' ? a[a.length - 1] : false,
                len = $.type(a[a.length - 1]) == 'boolean' ? a.length - 1 : a.length;
            for (var i = 1; i < len; i++) {
                var x = a[i];
                for (var k in x) {
                    if (!notCover || !t.hasOwnProperty(k)) {
                        t[k] = x[k];
                    }
                }
            }
            return t;
        };

        $.IE6 = !!window.ActiveXObject && parseFloat(navigator.userAgent.match(/msie (\d+)/i)[1]) == 6;

        //所有ui的基类
        var _eventHandler = [];
        var _widget = function () {
        };
        var _prefix = 'edui';
        _widget.prototype = {
            on: function (ev, cb) {
                this.root().on(ev, $.proxy(cb, this));
                return this;
            },
            off: function (ev, cb) {
                this.root().off(ev, $.proxy(cb, this));
                return this;
            },
            trigger: function (ev, data) {
                return  this.root().trigger(ev, data) === false ? false : this;
            },
            root: function ($el) {
                return this._$el || (this._$el = $el);
            },
            destroy: function () {

            },
            data: function (key, val) {
                if (val !== undefined) {
                    this.root().data(_prefix + key, val);
                    return this;
                } else {
                    return this.root().data(_prefix + key)
                }
            },
            register: function (eventName, $el, fn) {
                _eventHandler.push({
                    'evtname': eventName,
                    '$els': $.isArray($el) ? $el : [$el],
                    handler: $.proxy(fn, $el)
                })
            }
        };

        //从jq实例上拿到绑定的widget实例
        $.fn.edui = function (obj) {
            return obj ? this.data('eduiwidget', obj) : this.data('eduiwidget');
        };

        function _createClass(ClassObj, properties, supperClass) {
            ClassObj.prototype = $.extend2(
                $.extend({}, properties),
                (UM.ui[supperClass] || _widget).prototype,
                true
            );
            ClassObj.prototype.supper = (UM.ui[supperClass] || _widget).prototype;
            //父class的defaultOpt 合并
            if( UM.ui[supperClass] && UM.ui[supperClass].prototype.defaultOpt ) {

                var parentDefaultOptions = UM.ui[supperClass].prototype.defaultOpt,
                    subDefaultOptions = ClassObj.prototype.defaultOpt;

                ClassObj.prototype.defaultOpt = $.extend( {}, parentDefaultOptions, subDefaultOptions || {} );

            }
            return ClassObj
        }

        var _guid = 1;

        function mergeToJQ(ClassObj, className) {
            $[_prefix + className] = ClassObj;
            $.fn[_prefix + className] = function (opt) {
                var result, args = Array.prototype.slice.call(arguments, 1);

                this.each(function (i, el) {
                    var $this = $(el);
                    var obj = $this.edui();
                    if (!obj) {
                        ClassObj(!opt || !$.isPlainObject(opt) ? {} : opt, $this);
                        $this.edui(obj)
                    }
                    if ($.type(opt) == 'string') {
                        if (opt == 'this') {
                            result = obj;
                        } else {
                            result = obj[opt].apply(obj, args);
                            if (result !== obj && result !== undefined) {
                                return false;
                            }
                            result = null;
                        }

                    }
                });

                return result !== null ? result : this;
            }
        }

        UM.ui = {
            define: function (className, properties, supperClass) {
                var ClassObj = UM.ui[className] = _createClass(function (options, $el) {
                        var _obj = function () {
                        };
                        $.extend(_obj.prototype, ClassObj.prototype, {
                                guid: className + _guid++,
                                widgetName: className
                            }
                        );
                        var obj = new _obj;
                        if ($.type(options) == 'string') {
                            obj.init && obj.init({});
                            obj.root().edui(obj);
                            obj.root().find('a').click(function (evt) {
                                evt.preventDefault()
                            });
                            return obj.root()[_prefix + className].apply(obj.root(), arguments)
                        } else {
                            $el && obj.root($el);
                            obj.init && obj.init(!options || $.isPlainObject(options) ? $.extend2(options || {}, obj.defaultOpt || {}, true) : options);
                            try{
                                obj.root().find('a').click(function (evt) {
                                    evt.preventDefault()
                                });
                            }catch(e){
                            }

                            return obj.root().edui(obj);
                        }

                    },properties, supperClass);

                mergeToJQ(ClassObj, className);
            }
        };

        $(function () {
            $(document).on('click mouseup mousedown dblclick mouseover', function (evt) {
                $.each(_eventHandler, function (i, obj) {
                    if (obj.evtname == evt.type) {
                        $.each(obj.$els, function (i, $el) {
                            if ($el[0] !== evt.target && !$.contains($el[0], evt.target)) {
                                obj.handler(evt);
                            }
                        })
                    }
                })
            })
        })
    })(jQuery);
    //button 类
    UM.ui.define('button', {
        tpl: '<<%if(!texttype){%>div class="edui-btn edui-btn-<%=icon%> <%if(name){%>edui-btn-name-<%=name%><%}%>" unselectable="on" onmousedown="return false" <%}else{%>a class="edui-text-btn"<%}%><% if(title) {%> data-original-title="<%=title%>" <%};%>> ' +
            '<% if(icon) {%><div unselectable="on" class="edui-icon-<%=icon%> edui-icon"></div><% }; %><%if(text) {%><span unselectable="on" onmousedown="return false" class="edui-button-label"><%=text%></span><%}%>' +
            '<%if(caret && text){%><span class="edui-button-spacing"></span><%}%>' +
            '<% if(caret) {%><span unselectable="on" onmousedown="return false" class="edui-caret"></span><% };%></<%if(!texttype){%>div<%}else{%>a<%}%>>',
        defaultOpt: {
            text: '',
            title: '',
            icon: '',
            width: '',
            caret: false,
            texttype: false,
            click: function () {
            }
        },
        init: function (options) {
            var me = this;

            me.root($($.parseTmpl(me.tpl, options)))
                .click(function (evt) {
                    me.wrapclick(options.click, evt)
                });

            me.root().hover(function () {
                if(!me.root().hasClass("edui-disabled")){
                    me.root().toggleClass('edui-hover')
                }
            })

            return me;
        },
        wrapclick: function (fn, evt) {
            if (!this.disabled()) {
                this.root().trigger('wrapclick');
                $.proxy(fn, this, evt)()
            }
            return this;
        },
        label: function (text) {
            if (text === undefined) {
                return this.root().find('.edui-button-label').text();
            } else {
                this.root().find('.edui-button-label').text(text);
                return this;
            }
        },
        disabled: function (state) {
            if (state === undefined) {
                return this.root().hasClass('edui-disabled')
            }
            this.root().toggleClass('edui-disabled', state);
            if(this.root().hasClass('edui-disabled')){
                this.root().removeClass('edui-hover')
            }
            return this;
        },
        active: function (state) {
            if (state === undefined) {
                return this.root().hasClass('edui-active')
            }
            this.root().toggleClass('edui-active', state)

            return this;
        },
        mergeWith: function ($obj) {
            var me = this;
            me.data('$mergeObj', $obj);
            $obj.edui().data('$mergeObj', me.root());
            if (!$.contains(document.body, $obj[0])) {
                $obj.appendTo(me.root());
            }
            me.on('click',function () {
                me.wrapclick(function () {
                    $obj.edui().show();
                })
            }).register('click', me.root(), function (evt) {
                    $obj.hide()
                });
        }
    });
    //toolbar 类
    (function () {
        UM.ui.define('toolbar', {
            tpl: '<div class="edui-toolbar"  ><div class="edui-btn-toolbar" unselectable="on" onmousedown="return false"  ></div></div>'
              ,
            init: function () {
                var $root = this.root($(this.tpl));
                this.data('$btnToolbar', $root.find('.edui-btn-toolbar'))
            },
            appendToBtnmenu : function(data){
                var $cont = this.data('$btnToolbar');
                data = $.isArray(data) ? data : [data];
                $.each(data,function(i,$item){
                    $cont.append($item)
                })
            }
        });
    })();

    //menu 类
    UM.ui.define('menu',{
        show : function($obj,dir,fnname,topOffset,leftOffset){

            fnname = fnname || 'position';
            if(this.trigger('beforeshow') === false){
                return;
            }else{
                this.root().css($.extend({display:'block'},$obj ? {
                    top : $obj[fnname]().top + ( dir == 'right' ? 0 : $obj.outerHeight()) - (topOffset || 0),
                    left : $obj[fnname]().left + (dir == 'right' ?  $obj.outerWidth() : 0) -  (leftOffset || 0)
                }:{}))
                this.trigger('aftershow');
            }
        },
        hide : function(all){
            var $parentmenu;
            if(this.trigger('beforehide') === false){
                return;
            } else {

                if($parentmenu = this.root().data('parentmenu')){
                    if($parentmenu.data('parentmenu')|| all)
                        $parentmenu.edui().hide();
                }
                this.root().css('display','none');
                this.trigger('afterhide');
            }
        },
        attachTo : function($obj){
            var me = this;
            if(!$obj.data('$mergeObj')){
                $obj.data('$mergeObj',me.root());
                $obj.on('wrapclick',function(evt){
                    me.show()
                });
                me.register('click',$obj,function(evt){
                   me.hide()
                });
                me.data('$mergeObj',$obj)
            }
        }
    });
    //dropmenu 类
    UM.ui.define('dropmenu', {
        tmpl: '<ul class="edui-dropdown-menu" aria-labelledby="dropdownMenu" >' +
            '<%for(var i=0,ci;ci=data[i++];){%>' +
            '<%if(ci.divider){%><li class="edui-divider"></li><%}else{%>' +
            '<li <%if(ci.active||ci.disabled){%>class="<%= ci.active|| \'\' %> <%=ci.disabled||\'\' %>" <%}%> data-value="<%= ci.value%>">' +
            '<a href="#" tabindex="-1"><em class="edui-dropmenu-checkbox"><i class="edui-icon-ok"></i></em><%= ci.label%></a>' +
            '</li><%}%>' +
            '<%}%>' +
            '</ul>',
        defaultOpt: {
            data: [],
            click: function () {

            }
        },
        init: function (options) {
            var me = this;
            var eventName = {
                click: 1,
                mouseover: 1,
                mouseout: 1
            };

            this.root($($.parseTmpl(this.tmpl, options))).on('click', 'li[class!="edui-disabled edui-divider edui-dropdown-submenu"]',function (evt) {
                $.proxy(options.click, me, evt, $(this).data('value'), $(this))()
            }).find('li').each(function (i, el) {
                    var $this = $(this);
                    if (!$this.hasClass("edui-disabled edui-divider edui-dropdown-submenu")) {
                        var data = options.data[i];
                        $.each(eventName, function (k) {
                            data[k] && $this[k](function (evt) {
                                $.proxy(data[k], el)(evt, data, me.root)
                            })
                        })
                    }
                })

        },
        disabled: function (cb) {
            $('li[class!=edui-divider]', this.root()).each(function () {
                var $el = $(this);
                if (cb === true) {
                    $el.addClass('edui-disabled')
                } else if ($.isFunction(cb)) {
                    $el.toggleClass('edui-disabled', cb(li))
                } else {
                    $el.removeClass('edui-disabled')
                }

            });
        },
        val: function (val) {
            var currentVal;
            $('li[class!="edui-divider edui-disabled edui-dropdown-submenu"]', this.root()).each(function () {
                var $el = $(this);
                if (val === undefined) {
                    if ($el.find('em.edui-dropmenu-checked').length) {
                        currentVal = $el.data('value');
                        return false
                    }
                } else {
                    $el.find('em').toggleClass('edui-dropmenu-checked', $el.data('value') == val)
                }
            });
            if (val === undefined) {
                return currentVal
            }
        },
        addSubmenu: function (label, menu, index) {
            index = index || 0;

            var $list = $('li[class!=edui-divider]', this.root());
            var $node = $('<li class="edui-dropdown-submenu"><a tabindex="-1" href="#">' + label + '</a></li>').append(menu);

            if (index >= 0 && index < $list.length) {
                $node.insertBefore($list[index]);
            } else if (index < 0) {
                $node.insertBefore($list[0]);
            } else if (index >= $list.length) {
                $node.appendTo($list);
            }
        }
    }, 'menu');
    //splitbutton 类
    ///import button
    UM.ui.define('splitbutton',{
        tpl :'<div class="edui-splitbutton <%if (name){%>edui-splitbutton-<%= name %><%}%>"  unselectable="on" <%if(title){%>data-original-title="<%=title%>"<%}%>><div class="edui-btn"  unselectable="on" ><%if(icon){%><div  unselectable="on" class="edui-icon-<%=icon%> edui-icon"></div><%}%><%if(text){%><%=text%><%}%></div>'+
                '<div  unselectable="on" class="edui-btn edui-dropdown-toggle" >'+
                    '<div  unselectable="on" class="edui-caret"><\/div>'+
                '</div>'+
            '</div>',
        defaultOpt:{
            text:'',
            title:'',
            click:function(){}
        },
        init : function(options){
            var me = this;
            me.root( $($.parseTmpl(me.tpl,options)));
            me.root().find('.edui-btn:first').click(function(evt){
                if(!me.disabled()){
                    $.proxy(options.click,me)();
                }
            });
            me.root().find('.edui-dropdown-toggle').click(function(){
                if(!me.disabled()){
                    me.trigger('arrowclick')
                }
            });
            me.root().hover(function () {
                if(!me.root().hasClass("edui-disabled")){
                    me.root().toggleClass('edui-hover')
                }
            });

            return me;
        },
        wrapclick:function(fn,evt){
            if(!this.disabled()){
                $.proxy(fn,this,evt)()
            }
            return this;
        },
        disabled : function(state){
            if(state === undefined){
                return this.root().hasClass('edui-disabled')
            }
            this.root().toggleClass('edui-disabled',state).find('.edui-btn').toggleClass('edui-disabled',state);
            return this;
        },
        active:function(state){
            if(state === undefined){
                return this.root().hasClass('edui-active')
            }
            this.root().toggleClass('edui-active',state).find('.edui-btn:first').toggleClass('edui-active',state);
            return this;
        },
        mergeWith:function($obj){
            var me = this;
            me.data('$mergeObj',$obj);
            $obj.edui().data('$mergeObj',me.root());
            if(!$.contains(document.body,$obj[0])){
                $obj.appendTo(me.root());
            }
            me.root().delegate('.edui-dropdown-toggle','click',function(){
                me.wrapclick(function(){
                    $obj.edui().show();
                })
            });
            me.register('click',me.root().find('.edui-dropdown-toggle'),function(evt){
                $obj.hide()
            });
        }
    });
    /**
     * Created with JetBrains PhpStorm.
     * User: hn
     * Date: 13-7-10
     * Time: 下午3:07
     * To change this template use File | Settings | File Templates.
     */
    UM.ui.define('colorsplitbutton',{

        tpl : '<div class="edui-splitbutton <%if (name){%>edui-splitbutton-<%= name %><%}%>"  unselectable="on" <%if(title){%>data-original-title="<%=title%>"<%}%>><div class="edui-btn"  unselectable="on" ><%if(icon){%><div  unselectable="on" class="edui-icon-<%=icon%> edui-icon"></div><%}%><div class="edui-splitbutton-color-label" <%if (color) {%>style="background: <%=color%>"<%}%>></div><%if(text){%><%=text%><%}%></div>'+
                '<div  unselectable="on" class="edui-btn edui-dropdown-toggle" >'+
                '<div  unselectable="on" class="edui-caret"><\/div>'+
                '</div>'+
                '</div>',
        defaultOpt: {
            color: ''
        },
        init: function( options ){

            var me = this;

            me.supper.init.call( me, options );

        },
        colorLabel: function(){
            return this.root().find('.edui-splitbutton-color-label');
        }

    }, 'splitbutton');
    //popup 类
    UM.ui.define('popup', {
        tpl: '<div class="edui-dropdown-menu edui-popup"'+
            '<%if(!<%=stopprop%>){%>onmousedown="return false"<%}%>'+
            '><div class="edui-popup-body" unselectable="on" onmousedown="return false"><%=subtpl%></div>' +
            '<div class="edui-popup-caret"></div>' +
            '</div>',
        defaultOpt: {
            stopprop:false,
            subtpl: '',
            width: '',
            height: ''
        },
        init: function (options) {
            this.root($($.parseTmpl(this.tpl, options)));
            return this;
        },
        mergeTpl: function (data) {
            return $.parseTmpl(this.tpl, {subtpl: data});
        },
        show: function ($obj, posObj) {
            if (!posObj) posObj = {};

            var fnname = posObj.fnname || 'position';
            if (this.trigger('beforeshow') === false) {
                return;
            } else {
                this.root().css($.extend({display: 'block'}, $obj ? {
                    top: $obj[fnname]().top + ( posObj.dir == 'right' ? 0 : $obj.outerHeight()) - (posObj.offsetTop || 0),
                    left: $obj[fnname]().left + (posObj.dir == 'right' ? $obj.outerWidth() : 0) - (posObj.offsetLeft || 0),
                    position: 'absolute'
                } : {}));

                this.root().find('.edui-popup-caret').css({
                    top: posObj.caretTop || 0,
                    left: posObj.caretLeft || 0,
                    position: 'absolute'
                }).addClass(posObj.caretDir || "up")

            }
            this.trigger("aftershow");
        },
        hide: function () {
            this.root().css('display', 'none');
            this.trigger('afterhide')
        },
        attachTo: function ($obj, posObj) {
            var me = this
            if (!$obj.data('$mergeObj')) {
                $obj.data('$mergeObj', me.root());
                $obj.on('wrapclick', function (evt) {
                    me.show($obj, posObj)
                });
                me.register('click', $obj, function (evt) {
                    me.hide()
                });
                me.data('$mergeObj', $obj)
            }
        },
        getBodyContainer: function () {
            return this.root().find(".edui-popup-body");
        }
    });
    //scale 类
    UM.ui.define('scale', {
        tpl: '<div class="edui-scale" unselectable="on">' +
            '<span class="edui-scale-hand0"></span>' +
            '<span class="edui-scale-hand1"></span>' +
            '<span class="edui-scale-hand2"></span>' +
            '<span class="edui-scale-hand3"></span>' +
            '<span class="edui-scale-hand4"></span>' +
            '<span class="edui-scale-hand5"></span>' +
            '<span class="edui-scale-hand6"></span>' +
            '<span class="edui-scale-hand7"></span>' +
            '</div>',
        defaultOpt: {
            $doc: $(document),
            $wrap: $(document)
        },
        init: function (options) {
            if(options.$doc) this.defaultOpt.$doc = options.$doc;
            if(options.$wrap) this.defaultOpt.$wrap = options.$wrap;
            this.root($($.parseTmpl(this.tpl, options)));
            this.initStyle();
            this.startPos = this.prePos = {x: 0, y: 0};
            this.dragId = -1;
            return this;
        },
        initStyle: function () {
            utils.cssRule('edui-style-scale', '.edui-scale{display:none;position:absolute;border:1px solid #38B2CE;cursor:hand;}' +
                '.edui-scale span{position:absolute;left:0;top:0;width:7px;height:7px;overflow:hidden;font-size:0px;display:block;background-color:#3C9DD0;}'
                + '.edui-scale .edui-scale-hand0{cursor:nw-resize;top:0;margin-top:-4px;left:0;margin-left:-4px;}'
                + '.edui-scale .edui-scale-hand1{cursor:n-resize;top:0;margin-top:-4px;left:50%;margin-left:-4px;}'
                + '.edui-scale .edui-scale-hand2{cursor:ne-resize;top:0;margin-top:-4px;left:100%;margin-left:-3px;}'
                + '.edui-scale .edui-scale-hand3{cursor:w-resize;top:50%;margin-top:-4px;left:0;margin-left:-4px;}'
                + '.edui-scale .edui-scale-hand4{cursor:e-resize;top:50%;margin-top:-4px;left:100%;margin-left:-3px;}'
                + '.edui-scale .edui-scale-hand5{cursor:sw-resize;top:100%;margin-top:-3px;left:0;margin-left:-4px;}'
                + '.edui-scale .edui-scale-hand6{cursor:s-resize;top:100%;margin-top:-3px;left:50%;margin-left:-4px;}'
                + '.edui-scale .edui-scale-hand7{cursor:se-resize;top:100%;margin-top:-3px;left:100%;margin-left:-3px;}');
        },
        _eventHandler: function (e) {
            var me = this,
                $doc = me.defaultOpt.$doc;
            switch (e.type) {
                case 'mousedown':
                    var hand = e.target || e.srcElement, hand;
                    if (hand.className.indexOf('edui-scale-hand') != -1) {
                        me.dragId = hand.className.slice(-1);
                        me.startPos.x = me.prePos.x = e.clientX;
                        me.startPos.y = me.prePos.y = e.clientY;
                        $doc.bind('mousemove', $.proxy(me._eventHandler, me));
                    }
                    break;
                case 'mousemove':
                    if (me.dragId != -1) {
                        me.updateContainerStyle(me.dragId, {x: e.clientX - me.prePos.x, y: e.clientY - me.prePos.y});
                        me.prePos.x = e.clientX;
                        me.prePos.y = e.clientY;
                        me.updateTargetElement();
                    }
                    break;
                case 'mouseup':
                    if (me.dragId != -1) {
                        me.dragId = -1;
                        me.updateTargetElement();
                        var $target = me.data('$scaleTarget');
                        if ($target.parent()) me.attachTo(me.data('$scaleTarget'));
                    }
                    $doc.unbind('mousemove', $.proxy(me._eventHandler, me));
                    break;
                default:
                    break;
            }
        },
        updateTargetElement: function () {
            var me = this,
                $root = me.root(),
                $target = me.data('$scaleTarget');
            $target.css({width: $root.width(), height: $root.height()});
            me.attachTo($target);
        },
        updateContainerStyle: function (dir, offset) {
            var me = this,
                $dom = me.root(),
                tmp,
                rect = [
                    //[left, top, width, height]
                    [0, 0, -1, -1],
                    [0, 0, 0, -1],
                    [0, 0, 1, -1],
                    [0, 0, -1, 0],
                    [0, 0, 1, 0],
                    [0, 0, -1, 1],
                    [0, 0, 0, 1],
                    [0, 0, 1, 1]
                ];

            if (rect[dir][0] != 0) {
                tmp = parseInt($dom.offset().left) + offset.x;
                $dom.css('left', me._validScaledProp('left', tmp));
            }
            if (rect[dir][1] != 0) {
                tmp = parseInt($dom.offset().top) + offset.y;
                $dom.css('top', me._validScaledProp('top', tmp));
            }
            if (rect[dir][2] != 0) {
                tmp = $dom.width() + rect[dir][2] * offset.x;
                $dom.css('width', me._validScaledProp('width', tmp));
            }
            if (rect[dir][3] != 0) {
                tmp = $dom.height() + rect[dir][3] * offset.y;
                $dom.css('height', me._validScaledProp('height', tmp));
            }
        },
        _validScaledProp: function (prop, value) {
            var $ele = this.root(),
                $wrap = this.defaultOpt.$doc,
                calc = function(val, a, b){
                    return (val + a) > b ? b - a : value;
                };

            value = isNaN(value) ? 0 : value;
            switch (prop) {
                case 'left':
                    return value < 0 ? 0 : calc(value, $ele.width(), $wrap.width());
                case 'top':
                    return value < 0 ? 0 : calc(value, $ele.height(),$wrap.height());
                case 'width':
                    return value <= 0 ? 1 : calc(value, $ele.offset().left, $wrap.width());
                case 'height':
                    return value <= 0 ? 1 : calc(value, $ele.offset().top, $wrap.height());
            }
        },
        show: function ($obj) {
            var me = this;
            if ($obj) me.attachTo($obj);
            me.root().bind('mousedown', $.proxy(me._eventHandler, me));
            me.defaultOpt.$doc.bind('mouseup', $.proxy(me._eventHandler, me));
            me.root().show();
            me.trigger("aftershow");
        },
        hide: function () {
            var me = this;
            me.root().unbind('mousedown', $.proxy(me._eventHandler, me));
            me.defaultOpt.$doc.unbind('mouseup', $.proxy(me._eventHandler, me));
            me.root().hide();
            me.trigger('afterhide')
        },
        attachTo: function ($obj) {
            var me = this,
                imgPos = $obj.offset(),
                $root = me.root(),
                $wrap = me.defaultOpt.$wrap,
                posObj = $wrap.offset();

            me.data('$scaleTarget', $obj);
            me.root().css({
                position: 'absolute',
                width: $obj.width(),
                height: $obj.height(),
                left: imgPos.left - posObj.left - parseInt($wrap.css('border-left-width')) - parseInt($root.css('border-left-width')),
                top: imgPos.top - posObj.top - parseInt($wrap.css('border-top-width')) - parseInt($root.css('border-top-width'))
            });
        },
        getScaleTarget: function () {
            return this.data('$scaleTarget')[0];
        }
    });
    //colorpicker 类
    UM.ui.define('colorpicker', {
        tpl: function (opt) {
            var COLORS = (
                'ffffff,000000,eeece1,1f497d,4f81bd,c0504d,9bbb59,8064a2,4bacc6,f79646,' +
                    'f2f2f2,7f7f7f,ddd9c3,c6d9f0,dbe5f1,f2dcdb,ebf1dd,e5e0ec,dbeef3,fdeada,' +
                    'd8d8d8,595959,c4bd97,8db3e2,b8cce4,e5b9b7,d7e3bc,ccc1d9,b7dde8,fbd5b5,' +
                    'bfbfbf,3f3f3f,938953,548dd4,95b3d7,d99694,c3d69b,b2a2c7,92cddc,fac08f,' +
                    'a5a5a5,262626,494429,17365d,366092,953734,76923c,5f497a,31859b,e36c09,' +
                    '7f7f7f,0c0c0c,1d1b10,0f243e,244061,632423,4f6128,3f3151,205867,974806,' +
                    'c00000,ff0000,ffc000,ffff00,92d050,00b050,00b0f0,0070c0,002060,7030a0,').split(',');

            var html = '<div unselectable="on" onmousedown="return false" class="edui-colorpicker<%if (name){%> edui-colorpicker-<%=name%><%}%>" >' +
                '<table unselectable="on" onmousedown="return false">' +
                '<tr><td colspan="10">'+opt.lang_themeColor+'</td> </tr>' +
                '<tr class="edui-colorpicker-firstrow" >';

            for (var i = 0; i < COLORS.length; i++) {
                if (i && i % 10 === 0) {
                    html += '</tr>' + (i == 60 ? '<tr><td colspan="10">'+opt.lang_standardColor+'</td></tr>' : '') + '<tr' + (i == 60 ? ' class="edui-colorpicker-firstrow"' : '') + '>';
                }
                html += i < 70 ? '<td><a unselectable="on" onmousedown="return false" title="' + COLORS[i] + '" class="edui-colorpicker-colorcell"' +
                    ' data-color="#' + COLORS[i] + '"' +
                    ' style="background-color:#' + COLORS[i] + ';border:solid #ccc;' +
                    (i < 10 || i >= 60 ? 'border-width:1px;' :
                        i >= 10 && i < 20 ? 'border-width:1px 1px 0 1px;' :
                            'border-width:0 1px 0 1px;') +
                    '"' +
                    '></a></td>' : '';
            }
            html += '</tr></table></div>';
            return html;
        },
        init: function (options) {
            var me = this;
            me.root($($.parseTmpl(me.supper.mergeTpl(me.tpl(options)),options)));

            me.root().on("click",function (e) {
                me.trigger('pickcolor',  $(e.target).data('color'));
            });
        }
    }, 'popup');
    /**
     * Created with JetBrains PhpStorm.
     * User: hn
     * Date: 13-5-29
     * Time: 下午8:01
     * To change this template use File | Settings | File Templates.
     */

    (function(){

        var widgetName = 'combobox',
            itemClassName = 'edui-combobox-item',
            HOVER_CLASS = 'edui-combobox-item-hover',
            ICON_CLASS = 'edui-combobox-checked-icon',
            labelClassName = 'edui-combobox-item-label';

        UM.ui.define( widgetName, ( function(){

            return {
                tpl: "<ul class=\"dropdown-menu edui-combobox-menu<%if (comboboxName!=='') {%> edui-combobox-<%=comboboxName%><%}%>\" unselectable=\"on\" onmousedown=\"return false\" role=\"menu\" aria-labelledby=\"dropdownMenu\">" +
                    "<%if(autoRecord) {%>" +
                    "<%for( var i=0, len = recordStack.length; i<len; i++ ) {%>" +
                    "<%var index = recordStack[i];%>" +
                    "<li class=\"<%=itemClassName%><%if( selected == index ) {%> edui-combobox-checked<%}%>\" data-item-index=\"<%=index%>\" unselectable=\"on\" onmousedown=\"return false\">" +
                    "<span class=\"edui-combobox-icon\" unselectable=\"on\" onmousedown=\"return false\"></span>" +
                    "<label class=\"<%=labelClassName%>\" style=\"<%=itemStyles[ index ]%>\" unselectable=\"on\" onmousedown=\"return false\"><%=items[index]%></label>" +
                    "</li>" +
                    "<%}%>" +
                    "<%if( i ) {%>" +
                    "<li class=\"edui-combobox-item-separator\"></li>" +
                    "<%}%>" +
                    "<%}%>" +
                    "<%for( var i=0, label; label = items[i]; i++ ) {%>" +
                    "<li class=\"<%=itemClassName%><%if( selected == i ) {%> edui-combobox-checked<%}%> edui-combobox-item-<%=i%>\" data-item-index=\"<%=i%>\" unselectable=\"on\" onmousedown=\"return false\">" +
                    "<span class=\"edui-combobox-icon\" unselectable=\"on\" onmousedown=\"return false\"></span>" +
                    "<label class=\"<%=labelClassName%>\" style=\"<%=itemStyles[ i ]%>\" unselectable=\"on\" onmousedown=\"return false\"><%=label%></label>" +
                    "</li>" +
                    "<%}%>" +
                    "</ul>",
                defaultOpt: {
                    //记录栈初始列表
                    recordStack: [],
                    //可用项列表
                    items: [],
    		        //item对应的值列表
                    value: [],
                    comboboxName: '',
                    selected: '',
                    //自动记录
                    autoRecord: true,
                    //最多记录条数
                    recordCount: 5
                },
                init: function( options ){

                    var me = this;

                    $.extend( me._optionAdaptation( options ), me._createItemMapping( options.recordStack, options.items ), {
                        itemClassName: itemClassName,
                        iconClass: ICON_CLASS,
                        labelClassName: labelClassName
                    } );

                    this._transStack( options );

                    me.root( $( $.parseTmpl( me.tpl, options ) ) );

                    this.data( 'options', options ).initEvent();

                },
                initEvent: function(){

                    var me = this;

                    me.initSelectItem();

                    this.initItemActive();

                },
                /**
                 * 初始化选择项
                 */
                initSelectItem: function(){

                    var me = this,
                        labelClass = "."+labelClassName;

                    me.root().delegate('.' + itemClassName, 'click', function(){

                        var $li = $(this),
                            index = $li.attr('data-item-index');

                        me.trigger('comboboxselect', {
                            index: index,
                            label: $li.find(labelClass).text(),
                            value: me.data('options').value[ index ]
                        }).select( index );

                        me.hide();

                        return false;

                    });

                },
                initItemActive: function(){
                    var fn = {
                        mouseenter: 'addClass',
                        mouseleave: 'removeClass'
                    };
                    if ($.IE6) {
                        this.root().delegate( '.'+itemClassName,  'mouseenter mouseleave', function( evt ){
                            $(this)[ fn[ evt.type ] ]( HOVER_CLASS );
                        }).one('afterhide', function(){
                        });
                    }
                },
                /**
                 * 选择给定索引的项
                 * @param index 项索引
                 * @returns {*} 如果存在对应索引的项，则返回该项；否则返回null
                 */
                select: function( index ){

                    var itemCount = this.data('options').itemCount,
                        items = this.data('options').autowidthitem;

                    if ( items && !items.length ) {
                        items = this.data('options').items;
                    }

                    if( itemCount == 0 ) {
                        return null;
                    }

                    if( index < 0 ) {

                        index = itemCount + index % itemCount;

                    } else if ( index >= itemCount ) {

                        index = itemCount-1;

                    }

                    this.trigger( 'changebefore', items[ index ] );

                    this._update( index );

                    this.trigger( 'changeafter', items[ index ] );

                    return null;

                },
                selectItemByLabel: function( label ){

                    var itemMapping = this.data('options').itemMapping,
                        me = this,
                        index = null;

                    !$.isArray( label ) && ( label = [ label ] );

                    $.each( label, function( i, item ){

                        index = itemMapping[ item ];

                        if( index !== undefined ) {

                            me.select( index );
                            return false;

                        }

                    } );

                },
                /**
                 * 转换记录栈
                 */
                _transStack: function( options ) {

                    var temp = [],
                        itemIndex = -1,
                        selected = -1;

                    $.each( options.recordStack, function( index, item ){

                        itemIndex = options.itemMapping[ item ];

                        if( $.isNumeric( itemIndex ) ) {

                            temp.push( itemIndex );

                            //selected的合法性检测
                            if( item == options.selected ) {
                                selected = itemIndex;
                            }

                        }

                    } );

                    options.recordStack = temp;
                    options.selected = selected;
                    temp = null;

                },
                _optionAdaptation: function( options ) {

                    if( !( 'itemStyles' in options ) ) {

                        options.itemStyles = [];

                        for( var i = 0, len = options.items.length; i < len; i++ ) {
                            options.itemStyles.push('');
                        }

                    }

                    options.autowidthitem = options.autowidthitem || options.items;
                    options.itemCount = options.items.length;

                    return options;

                },
                _createItemMapping: function( stackItem, items ){

                    var temp = {},
                        result = {
                            recordStack: [],
                            mapping: {}
                        };

                    $.each( items, function( index, item ){
                        temp[ item ] = index;
                    } );

                    result.itemMapping = temp;

                    $.each( stackItem, function( index, item ){

                        if( temp[ item ] !== undefined ) {
                            result.recordStack.push( temp[ item ] );
                            result.mapping[ item ] = temp[ item ];
                        }

                    } );

                    return result;

                },
                _update: function ( index ) {

                    var options = this.data("options"),
                        newStack = [],
                        newChilds = null;

                    $.each( options.recordStack, function( i, item ){

                        if( item != index ) {
                            newStack.push( item );
                        }

                    } );

                    //压入最新的记录
                    newStack.unshift( index );

                    if( newStack.length > options.recordCount ) {
                        newStack.length = options.recordCount;
                    }

                    options.recordStack = newStack;
                    options.selected = index;

                    newChilds = $( $.parseTmpl( this.tpl, options ) );

                    //重新渲染
                    this.root().html( newChilds.html() );

                    newChilds = null;
                    newStack = null;

                }
            };

        } )(), 'menu' );

    })();

    /**
     * Combox 抽象基类
     * User: hn
     * Date: 13-5-29
     * Time: 下午8:01
     * To change this template use File | Settings | File Templates.
     */

    (function(){

        var widgetName = 'buttoncombobox';

        UM.ui.define( widgetName, ( function(){

            return {
                defaultOpt: {
                    //按钮初始文字
                    label: '',
                    title: ''
                },
                init: function( options ) {

                    var me = this;

                    var btnWidget = $.eduibutton({
                        caret: true,
                        name: options.comboboxName,
                        title: options.title,
                        text: options.label,
                        click: function(){
                            me.show( this.root() );
                        }
                    });

                    me.supper.init.call( me, options );

                    //监听change， 改变button显示内容
                    me.on('changebefore', function( e, label ){
                        btnWidget.eduibutton('label', label );
                    });

                    me.data( 'button', btnWidget );

                    me.attachTo(btnWidget)

                },
                button: function(){
                    return this.data( 'button' );
                }
            }

        } )(), 'combobox' );

    })();

    /*modal 类*/
    UM.ui.define('modal', {
        tpl: '<div class="edui-modal" tabindex="-1" >' +
            '<div class="edui-modal-header">' +
            '<div class="edui-close" data-hide="modal"></div>' +
            '<h3 class="edui-title"><%=title%></h3>' +
            '</div>' +
            '<div class="edui-modal-body"  style="<%if(width){%>width:<%=width%>px;<%}%>' +
            '<%if(height){%>height:<%=height%>px;<%}%>">' +
            ' </div>' +
            '<% if(cancellabel || oklabel) {%>' +
            '<div class="edui-modal-footer">' +
            '<div class="edui-modal-tip"></div>' +
            '<%if(oklabel){%><div class="edui-btn edui-btn-primary" data-ok="modal"><%=oklabel%></div><%}%>' +
            '<%if(cancellabel){%><div class="edui-btn" data-hide="modal"><%=cancellabel%></div><%}%>' +
            '</div>' +
            '<%}%></div>',
        defaultOpt: {
            title: "",
            cancellabel: "",
            oklabel: "",
            width: '',
            height: '',
            backdrop: true,
            keyboard: true
        },
        init: function (options) {
            var me = this;

            me.root($($.parseTmpl(me.tpl, options || {})));

            me.data("options", options);
            if (options.okFn) {
                me.on('ok', $.proxy(options.okFn, me))
            }
            if (options.cancelFn) {
                me.on('beforehide', $.proxy(options.cancelFn, me))
            }

            me.root().delegate('[data-hide="modal"]', 'click', $.proxy(me.hide, me))
                .delegate('[data-ok="modal"]', 'click', $.proxy(me.ok, me));

            $('[data-hide="modal"],[data-ok="modal"]',me.root()).hover(function(){
                $(this).toggleClass('edui-hover')
            });
        },
        toggle: function () {
            var me = this;
            return me[!me.data("isShown") ? 'show' : 'hide']();
        },
        show: function () {

            var me = this;

            me.trigger("beforeshow");

            if (me.data("isShown")) return;

            me.data("isShown", true);

            me.escape();

            me.backdrop(function () {
                me.autoCenter();
                me.root()
                    .show()
                    .focus()
                    .trigger('aftershow');
            })
        },
        showTip: function ( text ) {
            $( '.edui-modal-tip', this.root() ).html( text ).fadeIn();
        },
        hideTip: function ( text ) {
            $( '.edui-modal-tip', this.root() ).fadeOut( function (){
                $(this).html('');
            } );
        },
        autoCenter: function () {
            //ie6下不用处理了
            !$.IE6 && this.root().css("margin-left", -(this.root().width() / 2));
        },
        hide: function () {
            var me = this;

            me.trigger("beforehide");

            if (!me.data("isShown")) return;

            me.data("isShown", false);

            me.escape();

            me.hideModal();
        },
        escape: function () {
            var me = this;
            if (me.data("isShown") && me.data("options").keyboard) {
                me.root().on('keyup', function (e) {
                    e.which == 27 && me.hide();
                })
            }
            else if (!me.data("isShown")) {
                me.root().off('keyup');
            }
        },
        hideModal: function () {
            var me = this;
            me.root().hide();
            me.backdrop(function () {
                me.removeBackdrop();
                me.trigger('afterhide');
            })
        },
        removeBackdrop: function () {
            this.$backdrop && this.$backdrop.remove();
            this.$backdrop = null;
        },
        backdrop: function (callback) {
            var me = this;
            if (me.data("isShown") && me.data("options").backdrop) {
                me.$backdrop = $('<div class="edui-modal-backdrop" />').click(
                    me.data("options").backdrop == 'static' ?
                        $.proxy(me.root()[0].focus, me.root()[0])
                        : $.proxy(me.hide, me)
                )
            }
            me.trigger('afterbackdrop');
            callback && callback();

        },
        attachTo: function ($obj) {
            var me = this
            if (!$obj.data('$mergeObj')) {

                $obj.data('$mergeObj', me.root());
                $obj.on('click', function () {
                    me.toggle($obj)
                });
                me.data('$mergeObj', $obj)
            }
        },
        ok: function () {
            var me = this;
            me.trigger('beforeok');
            if (me.trigger("ok", me) === false) {
                return;
            }
            me.hide();
        },
        getBodyContainer: function () {
            return this.root().find('.edui-modal-body')
        }
    });


    /*tooltip 类*/
    UM.ui.define('tooltip', {
        tpl: '<div class="edui-tooltip" unselectable="on" onmousedown="return false">' +
            '<div class="edui-tooltip-arrow" unselectable="on" onmousedown="return false"></div>' +
            '<div class="edui-tooltip-inner" unselectable="on" onmousedown="return false"></div>' +
            '</div>',
        init: function (options) {
            var me = this;
            me.root($($.parseTmpl(me.tpl, options || {})));
        },
        content: function (e) {
            var me = this,
                title = $(e.currentTarget).attr("data-original-title");

            me.root().find('.edui-tooltip-inner')['text'](title);
        },
        position: function (e) {
            var me = this,
                $obj = $(e.currentTarget);

            me.root().css($.extend({display: 'block'}, $obj ? {
                top: $obj.outerHeight(),
                left: (($obj.outerWidth() - me.root().outerWidth()) / 2)
            } : {}))
        },
        show: function (e) {
            if ($(e.currentTarget).hasClass('edui-disabled')) return;

            var me = this;
            me.content(e);
            me.root().appendTo($(e.currentTarget));
            me.position(e);
            me.root().css('display', 'block');
        },
        hide: function () {
            var me = this;
            me.root().css('display', 'none')
        },
        attachTo: function ($obj) {
            var me = this;

            function tmp($obj) {
                var me = this;

                if (!$.contains(document.body, me.root()[0])) {
                    me.root().appendTo($obj);
                }

                me.data('tooltip', me.root());

                $obj.each(function () {
                    if ($(this).attr("data-original-title")) {
                        $(this).on('mouseenter', $.proxy(me.show, me))
                            .on('mouseleave click', $.proxy(me.hide, me))

                    }
                });

            }

            if ($.type($obj) === "undefined") {
                $("[data-original-title]").each(function (i, el) {
                    tmp.call(me, $(el));
                })

            } else {
                if (!$obj.data('tooltip')) {
                    tmp.call(me, $obj);
                }
            }
        }
    });

    /*tab 类*/
    UM.ui.define('tab', {
        init: function (options) {
            var me = this,
                slr = options.selector;

            if ($.type(slr)) {
                me.root($(slr, options.context));
                me.data("context", options.context);

                $(slr, me.data("context")).on('click', function (e) {
                    me.show(e);
                });
            }
        },
        show: function (e) {

            var me = this,
                $cur = $(e.target),
                $ul = $cur.closest('ul'),
                selector,
                previous,
                $target,
                e;

            selector = $cur.attr('data-context');
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '');

            var $tmp = $cur.parent('li');

            if (!$tmp.length || $tmp.hasClass('edui-active')) return;

            previous = $ul.find('.edui-active:last a')[0];

            e = $.Event('beforeshow', {
                target: $cur[0],
                relatedTarget: previous
            });

            me.trigger(e);

            if (e.isDefaultPrevented()) return;

            $target = $(selector, me.data("context"));

            me.activate($cur.parent('li'), $ul);
            me.activate($target, $target.parent(), function () {
                me.trigger({
                    type: 'aftershow', relatedTarget: previous
                })
            });
        },
        activate: function (element, container, callback) {
            if (element === undefined) {
                return $(".edui-tab-item.edui-active",this.root()).index();
            }

            var $active = container.find('> .edui-active');

            $active.removeClass('edui-active');

            element.addClass('edui-active');

            callback && callback();
        }
    });


    //button 类
    UM.ui.define('separator', {
        tpl: '<div class="edui-separator" unselectable="on" onmousedown="return false" ></div>',
        init: function (options) {
            var me = this;
            me.root($($.parseTmpl(me.tpl, options)));
            return me;
        }
    });
    /**
     * @file adapter.js
     * @desc adapt ui to editor
     * @import core/Editor.js, core/utils.js
     */

    (function () {
        var _editorUI = {},
            _editors = {},
            _readyFn = [],
            _activeWidget = null,
            _widgetData = {},
            _widgetCallBack = {},
            _cacheUI = {},
            _maxZIndex = null;

        utils.extend(UM, {
            defaultWidth : 500,
            defaultHeight : 500,
            registerUI: function (name, fn) {
                utils.each(name.split(/\s+/), function (uiname) {
                    _editorUI[uiname] = fn;
                })
            },

            setEditor : function(editor){
                !_editors[editor.id] && (_editors[editor.id] = editor);
            },
            registerWidget : function(name,pro,cb){
                _widgetData[name] = $.extend2(pro,{
                    $root : '',
                    _preventDefault:false,
                    root:function($el){
                        return this.$root || (this.$root = $el);
                    },
                    preventDefault:function(){
                        this._preventDefault = true;
                    },
                    clear:false
                });
                if(cb){
                    _widgetCallBack[name] = cb;
                }
            },
            getWidgetData : function(name){
                return _widgetData[name]
            },
            setWidgetBody : function(name,$widget,editor){
                if(!editor._widgetData){

                    utils.extend(editor,{
                        _widgetData : {},
                        getWidgetData : function(name){
                            return this._widgetData[name];
                        },
                        getWidgetCallback : function(widgetName){
                            var me = this;
                            return function(){
                                return  _widgetCallBack[widgetName].apply(me,[me,$widget].concat(Array.prototype.slice.call(arguments,0)))
                            }
                        }
                    })

                }
                var pro = _widgetData[name];
                if(!pro){
                    return null;
                }
                pro = editor._widgetData[name];
                if(!pro){
                    pro = _widgetData[name];
                    pro = editor._widgetData[name] = $.type(pro) == 'function' ? pro : utils.clone(pro);
                }

                pro.root($widget.edui().getBodyContainer());

                pro.initContent(editor,$widget);
                if(!pro._preventDefault){
                    pro.initEvent(editor,$widget);
                }

                pro.width &&  $widget.width(pro.width);


            },
            setActiveWidget : function($widget){
                _activeWidget = $widget;
            },
            getEditor: function (id, options) {
                var editor = _editors[id] || (_editors[id] = this.createEditor(id, options));
                _maxZIndex = _maxZIndex ? Math.max(editor.getOpt('zIndex'), _maxZIndex):editor.getOpt('zIndex');
                return editor;
            },
            setTopEditor: function(editor){
                $.each(_editors, function(i, o){
                    if(editor == o) {
                        editor.$container && editor.$container.css('zIndex', _maxZIndex + 1);
                    } else {
                        o.$container && o.$container.css('zIndex', o.getOpt('zIndex'));
                    }
                });
            },
            clearCache : function(id){
                if ( _editors[id]) {
                    delete  _editors[id]
                }
            },
            delEditor: function (id) {
                var editor;
                if (editor = _editors[id]) {
                    editor.destroy();
                }
            },
            ready: function( fn ){
                _readyFn.push( fn );
            },
            createEditor: function (id, opt) {
                var editor = new UM.Editor(opt);
                var T = this;

                editor.langIsReady ? $.proxy(renderUI,T)() : editor.addListener("langReady", $.proxy(renderUI,T));
                function renderUI(){


                    var $container = this.createUI('#' + id, editor);
                    editor.key=id;
                    editor.ready(function(){
                        $.each( _readyFn, function( index, fn ){
                            $.proxy( fn, editor )();
                        } );
                    });
                    var options = editor.options;
                    if(options.initialFrameWidth){
                        options.minFrameWidth = options.initialFrameWidth
                    }else{
                        options.minFrameWidth = options.initialFrameWidth = editor.$body.width() || UM.defaultWidth;
                    }

                    $container.css({
                        width: options.initialFrameWidth,
                        zIndex:editor.getOpt('zIndex')
                    });

                    //ie6下缓存图片
                    UM.browser.ie && UM.browser.version === 6 && document.execCommand("BackgroundImageCache", false, true);

                    editor.render(id);


                    //添加tooltip;
                    $.eduitooltip && $.eduitooltip('attachTo', $("[data-original-title]",$container)).css('z-index',editor.getOpt('zIndex')+1);

                    $container.find('a').click(function(evt){
                        evt.preventDefault()
                    });

                    editor.fireEvent("afteruiready");
                }

                return editor;

            },
            createUI: function (id, editor) {
                var $editorCont = $(id),
                    $container = $('<div class="edui-container"><div class="edui-editor-body"></div></div>').insertBefore($editorCont);
                editor.$container = $container;
                editor.container = $container[0];

                editor.$body = $editorCont;

                //修正在ie9+以上的版本中，自动长高收起时的，残影问题
                if(browser.ie && browser.ie9above){
                    var $span = $('<span style="padding:0;margin:0;height:0;width:0"></span>');
                    $span.insertAfter($container);
                }
                //初始化注册的ui组件
                $.each(_editorUI,function(n,v){
                    var widget = v.call(editor,n);
                    if(widget){
                        _cacheUI[n] = widget;
                    }

                });

                $container.find('.edui-editor-body').append($editorCont).before(this.createToolbar(editor.options, editor));

                $container.find('.edui-toolbar').append($('<div class="edui-dialog-container"></div>'));


                return $container;
            },
            createToolbar: function (options, editor) {
                var $toolbar = $.eduitoolbar(), toolbar = $toolbar.edui();
                //创建下来菜单列表

                if (options.toolbar && options.toolbar.length) {
                    var btns = [];
                    $.each(options.toolbar,function(i,uiNames){
                        $.each(uiNames.split(/\s+/),function(index,name){
                            if(name == '|'){
                                    $.eduiseparator && btns.push($.eduiseparator());
                            }else{
                                var ui = _cacheUI[name];
                                if(name=="fullscreen"){
                                    ui&&btns.unshift(ui);
                                }else{
                                    ui && btns.push(ui);
                                }
                            }

                        });
                        btns.length && toolbar.appendToBtnmenu(btns);
                    });
                } else {
                    $toolbar.find('.edui-btn-toolbar').remove()
                }
                return $toolbar;
            }

        })


    })();



    UM.registerUI('bold italic redo undo underline strikethrough superscript subscript insertorderedlist insertunorderedlist ' +
        'cleardoc selectall link unlink print preview justifyleft justifycenter justifyright justifyfull removeformat horizontal drafts',
        function(name) {
            var me = this;
            var $btn = $.eduibutton({
                icon : name,
                click : function(){
                    me.execCommand(name);
                },
                title: this.getLang('labelMap')[name] || ''
            });

            this.addListener('selectionchange',function(){
                var state = this.queryCommandState(name);
                $btn.edui().disabled(state == -1).active(state == 1)
            });
            return $btn;
        }
    );


    /**
     * 全屏组件
     */

    (function(){

        //状态缓存
        var STATUS_CACHE = {},
        //状态值列表
            STATUS_LIST = [ 'width', 'height', 'position', 'top', 'left', 'margin', 'padding', 'overflowX', 'overflowY' ],
            CONTENT_AREA_STATUS = {},
        //页面状态
            DOCUMENT_STATUS = {},
            DOCUMENT_ELEMENT_STATUS = {},

            FULLSCREENS = {};


        UM.registerUI('fullscreen', function( name ){

            var me = this,
                $button = $.eduibutton({
                    'icon': 'fullscreen',
                    'title': (me.options.labelMap && me.options.labelMap[name]) || me.getLang("labelMap." + name),
                    'click': function(){
                        //切换
                        me.execCommand( name );
                        UM.setTopEditor(me);
                    }
                });

            me.addListener( "selectionchange", function () {

                var state = this.queryCommandState( name );
                $button.edui().disabled( state == -1 ).active( state == 1 );

            } );

            //切换至全屏
            me.addListener('ready', function(){

                me.options.fullscreen && Fullscreen.getInstance( me ).toggle();

            });

            return $button;

        });

        UM.commands[ 'fullscreen' ] = {

            execCommand: function (cmdName) {

                Fullscreen.getInstance( this ).toggle();

            },
            queryCommandState: function (cmdName) {

                return this._edui_fullscreen_status;
            },
            notNeedUndo: 1

        };

        function Fullscreen( editor ) {

            var me = this;

            if( !editor ) {
                throw new Error('invalid params, notfound editor');
            }

            me.editor = editor;

            //记录初始化的全屏组件
            FULLSCREENS[ editor.uid ] = this;

            editor.addListener('destroy', function(){
                delete FULLSCREENS[ editor.uid ];
                me.editor = null;
            });

        }

        Fullscreen.prototype = {

            /**
             * 全屏状态切换
             */
            toggle: function(){

                var editor = this.editor,
                //当前编辑器的缩放状态
                    _edui_fullscreen_status = this.isFullState();
                editor.fireEvent('beforefullscreenchange', !_edui_fullscreen_status );

                //更新状态
                this.update( !_edui_fullscreen_status );

                !_edui_fullscreen_status ? this.enlarge() : this.revert();

                editor.fireEvent('afterfullscreenchange', !_edui_fullscreen_status );
                if(editor.body.contentEditable === 'true'){
                    editor.fireEvent( 'fullscreenchanged', !_edui_fullscreen_status );
                }

                editor.fireEvent( 'selectionchange' );

            },
            /**
             * 执行放大
             */
            enlarge: function(){

                this.saveSataus();

                this.setDocumentStatus();

                this.resize();

            },
            /**
             * 全屏还原
             */
            revert: function(){

                //还原CSS表达式
                var options = this.editor.options,
                    height = /%$/.test(options.initialFrameHeight) ?  '100%' : (options.initialFrameHeight - this.getStyleValue("padding-top")- this.getStyleValue("padding-bottom") - this.getStyleValue('border-width'));

                $.IE6 && this.getEditorHolder().style.setExpression('height', 'this.scrollHeight <= ' + height + ' ? "' + height + 'px" : "auto"');

                //还原容器状态
                this.revertContainerStatus();

                this.revertContentAreaStatus();

                this.revertDocumentStatus();

            },
            /**
             * 更新状态
             * @param isFull 当前状态是否是全屏状态
             */
            update: function( isFull ) {
                this.editor._edui_fullscreen_status = isFull;
            },
            /**
             * 调整当前编辑器的大小, 如果当前编辑器不处于全屏状态， 则不做调整
             */
            resize: function(){

                var $win = null,
                    height = 0,
                    width = 0,
                    borderWidth = 0,
                    paddingWidth = 0,
                    editor = this.editor,
                    me = this,
                    bound = null,
                    editorBody = null;

                if( !this.isFullState() ) {
                    return;
                }

                $win = $( window );
                width = $win.width();
                height = $win.height();
                editorBody = this.getEditorHolder();
                //文本编辑区border宽度
                borderWidth = parseInt( domUtils.getComputedStyle( editorBody, 'border-width' ), 10 ) || 0;
                //容器border宽度
                borderWidth += parseInt( domUtils.getComputedStyle( editor.container, 'border-width' ), 10 ) || 0;
                //容器padding
                paddingWidth += parseInt( domUtils.getComputedStyle( editorBody, 'padding-left' ), 10 ) + parseInt( domUtils.getComputedStyle( editorBody, 'padding-right' ), 10 ) || 0;

                //干掉css表达式
                $.IE6 && editorBody.style.setExpression( 'height', null );

                bound = this.getBound();

                $( editor.container ).css( {
                    width: width + 'px',
                    height: height + 'px',
                    position: !$.IE6 ? 'fixed' : 'absolute',
                    top: bound.top,
                    left: bound.left,
                    margin: 0,
                    padding: 0,
                    overflowX: 'hidden',
                    overflowY: 'hidden'
                } );

                $( editorBody ).css({
                    width: width - 2*borderWidth - paddingWidth + 'px',
                    height: height - 2*borderWidth - ( editor.options.withoutToolbar ? 0 : $( '.edui-toolbar', editor.container ).outerHeight() ) - $( '.edui-bottombar', editor.container).outerHeight() + 'px',
                    overflowX: 'hidden',
                    overflowY: 'auto'
                });

            },
            /**
             * 保存状态
             */
            saveSataus: function(){

                var styles = this.editor.container.style,
                    tmp = null,
                    cache = {};

                for( var i= 0, len = STATUS_LIST.length; i<len; i++ ) {

                    tmp = STATUS_LIST[ i ];
                    cache[ tmp ] = styles[ tmp ];

                }

                STATUS_CACHE[ this.editor.uid ] = cache;

                this.saveContentAreaStatus();
                this.saveDocumentStatus();

            },
            saveContentAreaStatus: function(){

                var $holder = $(this.getEditorHolder());

                CONTENT_AREA_STATUS[ this.editor.uid ] = {
                    width: $holder.css("width"),
                    overflowX: $holder.css("overflowX"),
                    overflowY: $holder.css("overflowY"),
                    height: $holder.css("height")
                };

            },
            /**
             * 保存与指定editor相关的页面的状态
             */
            saveDocumentStatus: function(){

                var $doc = $( this.getEditorDocumentBody() );

                DOCUMENT_STATUS[ this.editor.uid ] = {
                    overflowX: $doc.css( 'overflowX' ),
                    overflowY: $doc.css( 'overflowY' )
                };
                DOCUMENT_ELEMENT_STATUS[ this.editor.uid ] = {
                    overflowX: $( this.getEditorDocumentElement() ).css( 'overflowX'),
                    overflowY: $( this.getEditorDocumentElement() ).css( 'overflowY' )
                };

            },
            /**
             * 恢复容器状态
             */
            revertContainerStatus: function(){
                $( this.editor.container ).css( this.getEditorStatus() );
            },
            /**
             * 恢复编辑区状态
             */
            revertContentAreaStatus: function(){
                var holder = this.getEditorHolder(),
                    state = this.getContentAreaStatus();

                if ( this.supportMin() ) {
                    delete state.height;
                    holder.style.height = null;
                }

                $( holder ).css( state );
            },
            /**
             * 恢复页面状态
             */
            revertDocumentStatus: function() {

                var status = this.getDocumentStatus();
                $( this.getEditorDocumentBody() ).css( 'overflowX', status.body.overflowX );
                $( this.getEditorDocumentElement() ).css( 'overflowY', status.html.overflowY );

            },
            setDocumentStatus: function(){
                $(this.getEditorDocumentBody()).css( {
                    overflowX: 'hidden',
                    overflowY: 'hidden'
                } );
                $(this.getEditorDocumentElement()).css( {
                    overflowX: 'hidden',
                    overflowY: 'hidden'
                } );
            },
            /**
             * 检测当前编辑器是否处于全屏状态全屏状态
             * @returns {boolean} 是否处于全屏状态
             */
            isFullState: function(){
                return !!this.editor._edui_fullscreen_status;
            },
            /**
             * 获取编辑器状态
             */
            getEditorStatus: function(){
                return STATUS_CACHE[ this.editor.uid ];
            },
            getContentAreaStatus: function(){
                return CONTENT_AREA_STATUS[ this.editor.uid ];
            },
            getEditorDocumentElement: function(){
                return this.editor.container.ownerDocument.documentElement;
            },
            getEditorDocumentBody: function(){
                return this.editor.container.ownerDocument.body;
            },
            /**
             * 获取编辑区包裹对象
             */
            getEditorHolder: function(){
                return this.editor.body;
            },
            /**
             * 获取编辑器状态
             * @returns {*}
             */
            getDocumentStatus: function(){
                return {
                    'body': DOCUMENT_STATUS[ this.editor.uid ],
                    'html': DOCUMENT_ELEMENT_STATUS[ this.editor.uid ]
                };
            },
            supportMin: function () {

                var node = null;

                if ( !this._support ) {

                    node = document.createElement("div");

                    this._support = "minWidth" in node.style;

                    node = null;

                }

                return this._support;

            },
            getBound: function () {

                var tags = {
                        html: true,
                        body: true
                    },
                    result = {
                        top: 0,
                        left: 0
                    },
                    offsetParent = null;

                if ( !$.IE6 ) {
                    return result;
                }

                offsetParent = this.editor.container.offsetParent;

                if( offsetParent && !tags[ offsetParent.nodeName.toLowerCase() ] ) {
                    tags = offsetParent.getBoundingClientRect();
                    result.top = -tags.top;
                    result.left = -tags.left;
                }

                return result;

            },
            getStyleValue: function (attr) {
                return parseInt(domUtils.getComputedStyle( this.getEditorHolder() ,attr));
            }
        };


        $.extend( Fullscreen, {
            /**
             * 监听resize
             */
            listen: function(){

                var timer = null;

                if( Fullscreen._hasFullscreenListener ) {
                    return;
                }

                Fullscreen._hasFullscreenListener = true;

                $( window ).on( 'resize', function(){

                    if( timer !== null ) {
                        window.clearTimeout( timer );
                        timer = null;
                    }

                    timer = window.setTimeout(function(){

                        for( var key in FULLSCREENS ) {
                            FULLSCREENS[ key ].resize();
                        }

                        timer = null;

                    }, 50);

                } );

            },

            getInstance: function ( editor ) {

                if ( !FULLSCREENS[editor.uid  ] ) {
                    new Fullscreen( editor );
                }

                return FULLSCREENS[editor.uid  ];

            }

        });

        //开始监听
        Fullscreen.listen();

    })();
    UM.registerUI('link image video map formula',function(name){

        var me = this, currentRange, $dialog,
            opt = {
                title: (me.options.labelMap && me.options.labelMap[name]) || me.getLang("labelMap." + name),
                url: me.options.UMEDITOR_HOME_URL + 'dialogs/' + name + '/' + name + '.js'
            };

        var $btn = $.eduibutton({
            icon: name,
            title: this.getLang('labelMap')[name] || ''
        });
        //加载模版数据
        utils.loadFile(document,{
            src: opt.url,
            tag: "script",
            type: "text/javascript",
            defer: "defer"
        },function(){
            //调整数据
            var data = UM.getWidgetData(name);
            if(!data) return;
            if(data.buttons){
                var ok = data.buttons.ok;
                if(ok){
                    opt.oklabel = ok.label || me.getLang('ok');
                    if(ok.exec){
                        opt.okFn = function(){
                            return $.proxy(ok.exec,null,me,$dialog)()
                        }
                    }
                }
                var cancel = data.buttons.cancel;
                if(cancel){
                    opt.cancellabel = cancel.label || me.getLang('cancel');
                    if(cancel.exec){
                        opt.cancelFn = function(){
                            return $.proxy(cancel.exec,null,me,$dialog)()
                        }
                    }
                }
            }
            data.width && (opt.width = data.width);
            data.height && (opt.height = data.height);

            $dialog = $.eduimodal(opt);

            $dialog.attr('id', 'edui-dialog-' + name).addClass('edui-dialog-' + name)
                .find('.edui-modal-body').addClass('edui-dialog-' + name + '-body');

            $dialog.edui().on('beforehide',function () {
                var rng = me.selection.getRange();
                if (rng.equals(currentRange)) {
                    rng.select()
                }
            }).on('beforeshow', function () {
                    var $root = this.root(),
                        win = null,
                        offset = null;
                    currentRange = me.selection.getRange();
                    if (!$root.parent()[0]) {
                        me.$container.find('.edui-dialog-container').append($root);
                    }

                    //IE6下 特殊处理, 通过计算进行定位
                    if( $.IE6 ) {

                        win = {
                            width: $( window ).width(),
                            height: $( window ).height()
                        };
                        offset = $root.parents(".edui-toolbar")[0].getBoundingClientRect();
                        $root.css({
                            position: 'absolute',
                            margin: 0,
                            left: ( win.width - $root.width() ) / 2 - offset.left,
                            top: 100 - offset.top
                        });

                    }
                    UM.setWidgetBody(name,$dialog,me);
                    UM.setTopEditor(me);
            }).on('afterbackdrop',function(){
                this.$backdrop.css('zIndex',me.getOpt('zIndex')+1).appendTo(me.$container.find('.edui-dialog-container'))
                $dialog.css('zIndex',me.getOpt('zIndex')+2)
            }).on('beforeok',function(){
                try{
                    currentRange.select()
                }catch(e){}
            }).attachTo($btn)
        });




        me.addListener('selectionchange', function () {
            var state = this.queryCommandState(name);
            $btn.edui().disabled(state == -1).active(state == 1)
        });
        return $btn;
    });
    UM.registerUI( 'emotion formula', function( name ){
        var me = this,
            url  = me.options.UMEDITOR_HOME_URL + 'dialogs/' +name+ '/'+name+'.js';

        var $btn = $.eduibutton({
            icon: name,
            title: this.getLang('labelMap')[name] || ''
        });

        //加载模版数据
        utils.loadFile(document,{
            src: url,
            tag: "script",
            type: "text/javascript",
            defer: "defer"
        },function(){
            var opt = {
                url : url
            };
            //调整数据
            var data = UM.getWidgetData(name);

            data.width && (opt.width = data.width);
            data.height && (opt.height = data.height);

            $.eduipopup(opt).css('zIndex',me.options.zIndex + 1)
                .addClass('edui-popup-' + name)
                .edui()
                .on('beforeshow',function(){
                    var $root = this.root();
                    if(!$root.parent().length){
                        me.$container.find('.edui-dialog-container').append($root);
                    }
                    UM.setWidgetBody(name,$root,me);
                    UM.setTopEditor(me);
                }).attachTo($btn,{
                    offsetTop:-5,
                    offsetLeft:10,
                    caretLeft:11,
                    caretTop:-8
                });
            me.addListener('selectionchange', function () {
                var state = this.queryCommandState(name);
                $btn.edui().disabled(state == -1).active(state == 1);
            });
        });
        return $btn;

    } );
    UM.registerUI('imagescale',function () {
        var me = this,
            $imagescale;

        me.setOpt('imageScaleEnabled', true);

        if (browser.webkit && me.getOpt('imageScaleEnabled')) {

            me.addListener('click', function (type, e) {
                var range = me.selection.getRange(),
                    img = range.getClosedNode(),
                    target = e.target;

                /* 点击第一个图片的后面,八个角不消失 fix:3652 */
                if (img && img.tagName == 'IMG' && target == img) {

                    if (!$imagescale) {
                        $imagescale = $.eduiscale({'$wrap':me.$container}).css('zIndex', me.options.zIndex);
                        me.$container.append($imagescale);

                        var _keyDownHandler = function () {
                            $imagescale.edui().hide();
                        }, _mouseDownHandler = function (e) {
                            var ele = e.target || e.srcElement;
                            if (ele && ele.className.indexOf('edui-scale') == -1) {
                                _keyDownHandler(e);
                            }
                        }, timer;

                        $imagescale.edui()
                            .on('aftershow', function () {
                                $(document).bind('keydown', _keyDownHandler);
                                $(document).bind('mousedown', _mouseDownHandler);
                                me.selection.getNative().removeAllRanges();
                            })
                            .on('afterhide', function () {
                                $(document).unbind('keydown', _keyDownHandler);
                                $(document).unbind('mousedown', _mouseDownHandler);
                                var target = $imagescale.edui().getScaleTarget();
                                if (target.parentNode) {
                                    me.selection.getRange().selectNode(target).select();
                                }
                            })
                            .on('mousedown', function (e) {
                                me.selection.getNative().removeAllRanges();
                                var ele = e.target || e.srcElement;
                                if (ele && ele.className.indexOf('edui-scale-hand') == -1) {
                                    timer = setTimeout(function() {
                                        $imagescale.edui().hide();
                                    }, 200);
                                }
                            })
                            .on('mouseup', function (e) {
                                var ele = e.target || e.srcElement;
                                if (ele && ele.className.indexOf('edui-scale-hand') == -1) {
                                    clearTimeout(timer);
                                }
                            });
                    }
                    $imagescale.edui().show($(img));

                } else {
                    if ($imagescale && $imagescale.css('display') != 'none') $imagescale.edui().hide();

                }
            });

            me.addListener('click', function (type, e) {
                if (e.target.tagName == 'IMG') {
                    var range = new dom.Range(me.document, me.body);
                    range.selectNode(e.target).select();
                }
            });

        }
    });
    UM.registerUI('autofloat',function(){
        var me = this,
            lang = me.getLang();
        me.setOpt({
            autoFloatEnabled: true,
            topOffset: 0
        });
        var optsAutoFloatEnabled = me.options.autoFloatEnabled !== false,
            topOffset = me.options.topOffset;


        //如果不固定toolbar的位置，则直接退出
        if(!optsAutoFloatEnabled){
            return;
        }
        me.ready(function(){
            var LteIE6 = browser.ie && browser.version <= 6,
                quirks = browser.quirks;

            function checkHasUI(){
                if(!UM.ui){
                    alert(lang.autofloatMsg);
                    return 0;
                }
                return 1;
            }
            function fixIE6FixedPos(){
                var docStyle = document.body.style;
                docStyle.backgroundImage = 'url("about:blank")';
                docStyle.backgroundAttachment = 'fixed';
            }
            var	bakCssText,
                placeHolder = document.createElement('div'),
                toolbarBox,orgTop,
                getPosition=function(element){
                    var bcr;
                    //trace  IE6下在控制编辑器显隐时可能会报错，catch一下
                    try{
                        bcr = element.getBoundingClientRect();
                    }catch(e){
                        bcr={left:0,top:0,height:0,width:0}
                    }
                    var rect = {
                        left: Math.round(bcr.left),
                        top: Math.round(bcr.top),
                        height: Math.round(bcr.bottom - bcr.top),
                        width: Math.round(bcr.right - bcr.left)
                    };
                    var doc;
                    while ((doc = element.ownerDocument) !== document &&
                        (element = domUtils.getWindow(doc).frameElement)) {
                        bcr = element.getBoundingClientRect();
                        rect.left += bcr.left;
                        rect.top += bcr.top;
                    }
                    rect.bottom = rect.top + rect.height;
                    rect.right = rect.left + rect.width;
                    return rect;
                };
            var isFullScreening = false;
            function setFloating(){
                if(isFullScreening){
                    return;
                }
                var toobarBoxPos = domUtils.getXY(toolbarBox),
                    origalFloat = domUtils.getComputedStyle(toolbarBox,'position'),
                    origalLeft = domUtils.getComputedStyle(toolbarBox,'left');
                toolbarBox.style.width = toolbarBox.offsetWidth + 'px';
                toolbarBox.style.zIndex = me.options.zIndex * 1 + 1;
                toolbarBox.parentNode.insertBefore(placeHolder, toolbarBox);
                if (LteIE6 || (quirks && browser.ie)) {
                    if(toolbarBox.style.position != 'absolute'){
                        toolbarBox.style.position = 'absolute';
                    }
                    toolbarBox.style.top = (document.body.scrollTop||document.documentElement.scrollTop) - orgTop + topOffset  + 'px';
                } else {
                    if(toolbarBox.style.position != 'fixed'){
                        toolbarBox.style.position = 'fixed';
                        toolbarBox.style.top = topOffset +"px";
                        ((origalFloat == 'absolute' || origalFloat == 'relative') && parseFloat(origalLeft)) && (toolbarBox.style.left = toobarBoxPos.x + 'px');
                    }
                }
            }
            function unsetFloating(){

                if(placeHolder.parentNode){
                    placeHolder.parentNode.removeChild(placeHolder);
                }
                toolbarBox.style.cssText = bakCssText;
            }

            function updateFloating(){
                var rect3 = getPosition(me.container);
                var offset=me.options.toolbarTopOffset||0;
                if (rect3.top < 0 && rect3.bottom - toolbarBox.offsetHeight > offset) {
                    setFloating();
                }else{
                    unsetFloating();
                }
            }
            var defer_updateFloating = utils.defer(function(){
                updateFloating();
            },browser.ie ? 200 : 100,true);

            me.addListener('destroy',function(){
                $(window).off('scroll resize',updateFloating);
                me.removeListener('keydown', defer_updateFloating);
            });

            if(checkHasUI(me)){
                toolbarBox = $('.edui-toolbar',me.container)[0];
                me.addListener("afteruiready",function(){
                    setTimeout(function(){
                        orgTop = $(toolbarBox).offset().top;
                    },100);
                });
                bakCssText = toolbarBox.style.cssText;
                placeHolder.style.height = toolbarBox.offsetHeight + 'px';
                if(LteIE6){
                    fixIE6FixedPos();
                }

                $(window).on('scroll resize',updateFloating);
                me.addListener('keydown', defer_updateFloating);
                me.addListener('resize', function(){
                    unsetFloating();
                    placeHolder.style.height = toolbarBox.offsetHeight + 'px';
                    updateFloating();
                });

                me.addListener('beforefullscreenchange', function (t, enabled){
                    if (enabled) {
                        unsetFloating();
                        isFullScreening = enabled;
                    }
                });
                me.addListener('fullscreenchanged', function (t, enabled){
                    if (!enabled) {
                        updateFloating();
                    }
                    isFullScreening = enabled;
                });
                me.addListener('sourcemodechanged', function (t, enabled){
                    setTimeout(function (){
                        updateFloating();
                    },0);
                });
                me.addListener("clearDoc",function(){
                    setTimeout(function(){
                        updateFloating();
                    },0);

                })
            }
        })


    });
    UM.registerUI('source',function(name){
        var me = this;
        me.addListener('fullscreenchanged',function(){
            me.$container.find('textarea').width(me.$body.width() - 10).height(me.$body.height())

        });
        var $btn = $.eduibutton({
            icon : name,
            click : function(){
                me.execCommand(name);
                UM.setTopEditor(me);
            },
            title: this.getLang('labelMap')[name] || ''
        });

        this.addListener('selectionchange',function(){
            var state = this.queryCommandState(name);
            $btn.edui().disabled(state == -1).active(state == 1)
        });
        return $btn;
    });

    UM.registerUI('paragraph fontfamily fontsize', function( name ) {

        var me = this,
            label = (me.options.labelMap && me.options.labelMap[name]) || me.getLang("labelMap." + name),
            options = {
                label: label,
                title: label,
                comboboxName: name,
                items: me.options[ name ] || [],
                itemStyles: [],
                value: [],
                autowidthitem: []
            },
            $combox = null,
            comboboxWidget = null;
        if(options.items.length == 0){
            return null;
        }
        switch ( name ) {

            case 'paragraph':
                options = transForParagraph( options );
                break;

            case 'fontfamily':
                options = transForFontfamily( options );
                break;

            case 'fontsize':
                options = transForFontsize( options );
                break;

        }

        //实例化
        $combox =  $.eduibuttoncombobox(options).css('zIndex',me.getOpt('zIndex') + 1);
        comboboxWidget =  $combox.edui();

        comboboxWidget.on('comboboxselect', function( evt, res ){
                            me.execCommand( name, res.value );
                        }).on("beforeshow", function(){
                            if( $combox.parent().length === 0 ) {
                                $combox.appendTo(  me.$container.find('.edui-dialog-container') );
                            }
                            UM.setTopEditor(me);
                        });


        //状态反射
        this.addListener('selectionchange',function( evt ){

            var state  = this.queryCommandState( name ),
                value = this.queryCommandValue( name );

            //设置按钮状态
            comboboxWidget.button().edui().disabled( state == -1 ).active( state == 1 );
            if(value){
                //设置label
                value = value.replace(/['"]/g, '').toLowerCase().split(/['|"]?\s*,\s*[\1]?/);

                comboboxWidget.selectItemByLabel( value );
            }


        });

        return comboboxWidget.button().addClass('edui-combobox');

        /**
         * 宽度自适应工具函数
         * @param word 单词内容
         * @param hasSuffix 是否含有后缀
         */
        function wordCountAdaptive ( word, hasSuffix ) {

            var $tmpNode = $('<span>' ).html( word ).css( {
                    display: 'inline',
                    position: 'absolute',
                    top: -10000000,
                    left: -100000
                } ).appendTo( document.body),
                width = $tmpNode.width();

            $tmpNode.remove();
            $tmpNode = null;

            if( width < 50 ) {

                return word;

            } else {

                word = word.slice( 0, hasSuffix ? -4 : -1 );

                if( !word.length ) {
                    return '...';
                }

                return wordCountAdaptive( word + '...', true );

            }

        }


        //段落参数转换
        function transForParagraph ( options ) {

            var tempItems = [];

            for( var key in options.items ) {

                options.value.push( key );
                tempItems.push( key );
                options.autowidthitem.push( wordCountAdaptive( key ) );

            }

            options.items = tempItems;
            options.autoRecord = false;

            return options;

        }

        //字体参数转换
        function transForFontfamily ( options ) {

            var temp = null,
                tempItems = [];

            for( var i = 0, len = options.items.length; i < len; i++ ) {

                temp = options.items[ i ].val;
                tempItems.push( temp.split(/\s*,\s*/)[0] );
                options.itemStyles.push('font-family: ' + temp);
                options.value.push( temp );
                options.autowidthitem.push( wordCountAdaptive( tempItems[ i ] ) );

            }

            options.items = tempItems;

            return options;

        }

        //字体大小参数转换
        function transForFontsize ( options ) {

            var temp = null,
                tempItems = [];

            options.itemStyles = [];
            options.value = [];

            for( var i = 0, len = options.items.length; i < len; i++ ) {

                temp = options.items[ i ];
                tempItems.push( temp );
                options.itemStyles.push('font-size: ' + temp +'px');

            }

            options.value = options.items;
            options.items = tempItems;
            options.autoRecord = false;

            return options;

        }

    });


    UM.registerUI('forecolor backcolor', function( name ) {
        function getCurrentColor() {
            return domUtils.getComputedStyle( $colorLabel[0], 'background-color' );
        }

        var me = this,
            $colorPickerWidget = null,
            $colorLabel = null,
            $btn = null;

        //querycommand
        this.addListener('selectionchange', function(){

            var state = this.queryCommandState( name );
            $btn.edui().disabled( state == -1 ).active( state == 1 );

        });

        $btn = $.eduicolorsplitbutton({
            icon: name,
            caret: true,
            name: name,
            title: me.getLang("labelMap")[name],
            click: function() {
                me.execCommand( name, getCurrentColor() );
            }
        });

        $colorLabel = $btn.edui().colorLabel();

        $colorPickerWidget = $.eduicolorpicker({
            name: name,
            lang_clearColor: me.getLang('clearColor') || '',
            lang_themeColor: me.getLang('themeColor') || '',
            lang_standardColor: me.getLang('standardColor') || ''
        })
            .on('pickcolor', function( evt, color ){
                window.setTimeout( function(){
                    $colorLabel.css("backgroundColor", color);
                    me.execCommand( name, color );
                }, 0 );
            })
            .on('show',function(){
                UM.setActiveWidget( colorPickerWidget.root() );
            }).css('zIndex',me.getOpt('zIndex') + 1);

        $btn.edui().on('arrowclick',function(){
            if(!$colorPickerWidget.parent().length){
                me.$container.find('.edui-dialog-container').append($colorPickerWidget);
            }
            $colorPickerWidget.edui().show($btn,{
                caretDir:"down",
                offsetTop:-5,
                offsetLeft:8,
                caretLeft:11,
                caretTop:-8
            });
            UM.setTopEditor(me);
        }).register('click', $btn, function () {
                $colorPickerWidget.edui().hide()
            });

        return $btn;

    });

    return skylark.attach("intg.umeditor",UM);
});
define('skylark-umeditor/main',[
	"./umeditor"
],function(umeditor){
	return umeditor;
});
define('skylark-umeditor', ['skylark-umeditor/main'], function (main) { return main; });


},this);