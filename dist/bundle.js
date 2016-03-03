(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (process,global){
/*!
 * Vue.js v1.0.17
 * (c) 2016 Evan You
 * Released under the MIT License.
 */
'use strict';

function set(obj, key, val) {
  if (hasOwn(obj, key)) {
    obj[key] = val;
    return;
  }
  if (obj._isVue) {
    set(obj._data, key, val);
    return;
  }
  var ob = obj.__ob__;
  if (!ob) {
    obj[key] = val;
    return;
  }
  ob.convert(key, val);
  ob.dep.notify();
  if (ob.vms) {
    var i = ob.vms.length;
    while (i--) {
      var vm = ob.vms[i];
      vm._proxy(key);
      vm._digest();
    }
  }
  return val;
}

/**
 * Delete a property and trigger change if necessary.
 *
 * @param {Object} obj
 * @param {String} key
 */

function del(obj, key) {
  if (!hasOwn(obj, key)) {
    return;
  }
  delete obj[key];
  var ob = obj.__ob__;
  if (!ob) {
    return;
  }
  ob.dep.notify();
  if (ob.vms) {
    var i = ob.vms.length;
    while (i--) {
      var vm = ob.vms[i];
      vm._unproxy(key);
      vm._digest();
    }
  }
}

var hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * Check whether the object has the property.
 *
 * @param {Object} obj
 * @param {String} key
 * @return {Boolean}
 */

function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key);
}

/**
 * Check if an expression is a literal value.
 *
 * @param {String} exp
 * @return {Boolean}
 */

var literalValueRE = /^\s?(true|false|-?[\d\.]+|'[^']*'|"[^"]*")\s?$/;

function isLiteral(exp) {
  return literalValueRE.test(exp);
}

/**
 * Check if a string starts with $ or _
 *
 * @param {String} str
 * @return {Boolean}
 */

function isReserved(str) {
  var c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F;
}

/**
 * Guard text output, make sure undefined outputs
 * empty string
 *
 * @param {*} value
 * @return {String}
 */

function _toString(value) {
  return value == null ? '' : value.toString();
}

/**
 * Check and convert possible numeric strings to numbers
 * before setting back to data
 *
 * @param {*} value
 * @return {*|Number}
 */

function toNumber(value) {
  if (typeof value !== 'string') {
    return value;
  } else {
    var parsed = Number(value);
    return isNaN(parsed) ? value : parsed;
  }
}

/**
 * Convert string boolean literals into real booleans.
 *
 * @param {*} value
 * @return {*|Boolean}
 */

function toBoolean(value) {
  return value === 'true' ? true : value === 'false' ? false : value;
}

/**
 * Strip quotes from a string
 *
 * @param {String} str
 * @return {String | false}
 */

function stripQuotes(str) {
  var a = str.charCodeAt(0);
  var b = str.charCodeAt(str.length - 1);
  return a === b && (a === 0x22 || a === 0x27) ? str.slice(1, -1) : str;
}

/**
 * Camelize a hyphen-delmited string.
 *
 * @param {String} str
 * @return {String}
 */

var camelizeRE = /-(\w)/g;

function camelize(str) {
  return str.replace(camelizeRE, toUpper);
}

function toUpper(_, c) {
  return c ? c.toUpperCase() : '';
}

/**
 * Hyphenate a camelCase string.
 *
 * @param {String} str
 * @return {String}
 */

var hyphenateRE = /([a-z\d])([A-Z])/g;

function hyphenate(str) {
  return str.replace(hyphenateRE, '$1-$2').toLowerCase();
}

/**
 * Converts hyphen/underscore/slash delimitered names into
 * camelized classNames.
 *
 * e.g. my-component => MyComponent
 *      some_else    => SomeElse
 *      some/comp    => SomeComp
 *
 * @param {String} str
 * @return {String}
 */

var classifyRE = /(?:^|[-_\/])(\w)/g;

function classify(str) {
  return str.replace(classifyRE, toUpper);
}

/**
 * Simple bind, faster than native
 *
 * @param {Function} fn
 * @param {Object} ctx
 * @return {Function}
 */

function bind(fn, ctx) {
  return function (a) {
    var l = arguments.length;
    return l ? l > 1 ? fn.apply(ctx, arguments) : fn.call(ctx, a) : fn.call(ctx);
  };
}

/**
 * Convert an Array-like object to a real Array.
 *
 * @param {Array-like} list
 * @param {Number} [start] - start index
 * @return {Array}
 */

function toArray(list, start) {
  start = start || 0;
  var i = list.length - start;
  var ret = new Array(i);
  while (i--) {
    ret[i] = list[i + start];
  }
  return ret;
}

/**
 * Mix properties into target object.
 *
 * @param {Object} to
 * @param {Object} from
 */

function extend(to, from) {
  var keys = Object.keys(from);
  var i = keys.length;
  while (i--) {
    to[keys[i]] = from[keys[i]];
  }
  return to;
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 *
 * @param {*} obj
 * @return {Boolean}
 */

function isObject(obj) {
  return obj !== null && typeof obj === 'object';
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 *
 * @param {*} obj
 * @return {Boolean}
 */

var toString = Object.prototype.toString;
var OBJECT_STRING = '[object Object]';

function isPlainObject(obj) {
  return toString.call(obj) === OBJECT_STRING;
}

/**
 * Array type check.
 *
 * @param {*} obj
 * @return {Boolean}
 */

var isArray = Array.isArray;

/**
 * Define a non-enumerable property
 *
 * @param {Object} obj
 * @param {String} key
 * @param {*} val
 * @param {Boolean} [enumerable]
 */

function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

/**
 * Debounce a function so it only gets called after the
 * input stops arriving after the given wait period.
 *
 * @param {Function} func
 * @param {Number} wait
 * @return {Function} - the debounced function
 */

function _debounce(func, wait) {
  var timeout, args, context, timestamp, result;
  var later = function later() {
    var last = Date.now() - timestamp;
    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    }
  };
  return function () {
    context = this;
    args = arguments;
    timestamp = Date.now();
    if (!timeout) {
      timeout = setTimeout(later, wait);
    }
    return result;
  };
}

/**
 * Manual indexOf because it's slightly faster than
 * native.
 *
 * @param {Array} arr
 * @param {*} obj
 */

function indexOf(arr, obj) {
  var i = arr.length;
  while (i--) {
    if (arr[i] === obj) return i;
  }
  return -1;
}

/**
 * Make a cancellable version of an async callback.
 *
 * @param {Function} fn
 * @return {Function}
 */

function cancellable(fn) {
  var cb = function cb() {
    if (!cb.cancelled) {
      return fn.apply(this, arguments);
    }
  };
  cb.cancel = function () {
    cb.cancelled = true;
  };
  return cb;
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 *
 * @param {*} a
 * @param {*} b
 * @return {Boolean}
 */

function looseEqual(a, b) {
  /* eslint-disable eqeqeq */
  return a == b || (isObject(a) && isObject(b) ? JSON.stringify(a) === JSON.stringify(b) : false);
  /* eslint-enable eqeqeq */
}

var hasProto = ('__proto__' in {});

// Browser environment sniffing
var inBrowser = typeof window !== 'undefined' && Object.prototype.toString.call(window) !== '[object Object]';

// detect devtools
var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

// UA sniffing for working around browser-specific quirks
var UA = inBrowser && window.navigator.userAgent.toLowerCase();
var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
var isAndroid = UA && UA.indexOf('android') > 0;

var transitionProp = undefined;
var transitionEndEvent = undefined;
var animationProp = undefined;
var animationEndEvent = undefined;

// Transition property/event sniffing
if (inBrowser && !isIE9) {
  var isWebkitTrans = window.ontransitionend === undefined && window.onwebkittransitionend !== undefined;
  var isWebkitAnim = window.onanimationend === undefined && window.onwebkitanimationend !== undefined;
  transitionProp = isWebkitTrans ? 'WebkitTransition' : 'transition';
  transitionEndEvent = isWebkitTrans ? 'webkitTransitionEnd' : 'transitionend';
  animationProp = isWebkitAnim ? 'WebkitAnimation' : 'animation';
  animationEndEvent = isWebkitAnim ? 'webkitAnimationEnd' : 'animationend';
}

/**
 * Defer a task to execute it asynchronously. Ideally this
 * should be executed as a microtask, so we leverage
 * MutationObserver if it's available, and fallback to
 * setTimeout(0).
 *
 * @param {Function} cb
 * @param {Object} ctx
 */

var nextTick = (function () {
  var callbacks = [];
  var pending = false;
  var timerFunc;
  function nextTickHandler() {
    pending = false;
    var copies = callbacks.slice(0);
    callbacks = [];
    for (var i = 0; i < copies.length; i++) {
      copies[i]();
    }
  }

  /* istanbul ignore if */
  if (typeof MutationObserver !== 'undefined') {
    var counter = 1;
    var observer = new MutationObserver(nextTickHandler);
    var textNode = document.createTextNode(counter);
    observer.observe(textNode, {
      characterData: true
    });
    timerFunc = function () {
      counter = (counter + 1) % 2;
      textNode.data = counter;
    };
  } else {
    // webpack attempts to inject a shim for setImmediate
    // if it is used as a global, so we have to work around that to
    // avoid bundling unnecessary code.
    var context = inBrowser ? window : typeof global !== 'undefined' ? global : {};
    timerFunc = context.setImmediate || setTimeout;
  }
  return function (cb, ctx) {
    var func = ctx ? function () {
      cb.call(ctx);
    } : cb;
    callbacks.push(func);
    if (pending) return;
    pending = true;
    timerFunc(nextTickHandler, 0);
  };
})();

function Cache(limit) {
  this.size = 0;
  this.limit = limit;
  this.head = this.tail = undefined;
  this._keymap = Object.create(null);
}

var p = Cache.prototype;

/**
 * Put <value> into the cache associated with <key>.
 * Returns the entry which was removed to make room for
 * the new entry. Otherwise undefined is returned.
 * (i.e. if there was enough room already).
 *
 * @param {String} key
 * @param {*} value
 * @return {Entry|undefined}
 */

p.put = function (key, value) {
  var removed;
  if (this.size === this.limit) {
    removed = this.shift();
  }

  var entry = this.get(key, true);
  if (!entry) {
    entry = {
      key: key
    };
    this._keymap[key] = entry;
    if (this.tail) {
      this.tail.newer = entry;
      entry.older = this.tail;
    } else {
      this.head = entry;
    }
    this.tail = entry;
    this.size++;
  }
  entry.value = value;

  return removed;
};

/**
 * Purge the least recently used (oldest) entry from the
 * cache. Returns the removed entry or undefined if the
 * cache was empty.
 */

p.shift = function () {
  var entry = this.head;
  if (entry) {
    this.head = this.head.newer;
    this.head.older = undefined;
    entry.newer = entry.older = undefined;
    this._keymap[entry.key] = undefined;
    this.size--;
  }
  return entry;
};

/**
 * Get and register recent use of <key>. Returns the value
 * associated with <key> or undefined if not in cache.
 *
 * @param {String} key
 * @param {Boolean} returnEntry
 * @return {Entry|*}
 */

p.get = function (key, returnEntry) {
  var entry = this._keymap[key];
  if (entry === undefined) return;
  if (entry === this.tail) {
    return returnEntry ? entry : entry.value;
  }
  // HEAD--------------TAIL
  //   <.older   .newer>
  //  <--- add direction --
  //   A  B  C  <D>  E
  if (entry.newer) {
    if (entry === this.head) {
      this.head = entry.newer;
    }
    entry.newer.older = entry.older; // C <-- E.
  }
  if (entry.older) {
    entry.older.newer = entry.newer; // C. --> E
  }
  entry.newer = undefined; // D --x
  entry.older = this.tail; // D. --> E
  if (this.tail) {
    this.tail.newer = entry; // E. <-- D
  }
  this.tail = entry;
  return returnEntry ? entry : entry.value;
};

var cache$1 = new Cache(1000);
var filterTokenRE = /[^\s'"]+|'[^']*'|"[^"]*"/g;
var reservedArgRE = /^in$|^-?\d+/;

/**
 * Parser state
 */

var str;
var dir;
var c;
var prev;
var i;
var l;
var lastFilterIndex;
var inSingle;
var inDouble;
var curly;
var square;
var paren;
/**
 * Push a filter to the current directive object
 */

function pushFilter() {
  var exp = str.slice(lastFilterIndex, i).trim();
  var filter;
  if (exp) {
    filter = {};
    var tokens = exp.match(filterTokenRE);
    filter.name = tokens[0];
    if (tokens.length > 1) {
      filter.args = tokens.slice(1).map(processFilterArg);
    }
  }
  if (filter) {
    (dir.filters = dir.filters || []).push(filter);
  }
  lastFilterIndex = i + 1;
}

/**
 * Check if an argument is dynamic and strip quotes.
 *
 * @param {String} arg
 * @return {Object}
 */

function processFilterArg(arg) {
  if (reservedArgRE.test(arg)) {
    return {
      value: toNumber(arg),
      dynamic: false
    };
  } else {
    var stripped = stripQuotes(arg);
    var dynamic = stripped === arg;
    return {
      value: dynamic ? arg : stripped,
      dynamic: dynamic
    };
  }
}

/**
 * Parse a directive value and extract the expression
 * and its filters into a descriptor.
 *
 * Example:
 *
 * "a + 1 | uppercase" will yield:
 * {
 *   expression: 'a + 1',
 *   filters: [
 *     { name: 'uppercase', args: null }
 *   ]
 * }
 *
 * @param {String} str
 * @return {Object}
 */

function parseDirective(s) {
  var hit = cache$1.get(s);
  if (hit) {
    return hit;
  }

  // reset parser state
  str = s;
  inSingle = inDouble = false;
  curly = square = paren = 0;
  lastFilterIndex = 0;
  dir = {};

  for (i = 0, l = str.length; i < l; i++) {
    prev = c;
    c = str.charCodeAt(i);
    if (inSingle) {
      // check single quote
      if (c === 0x27 && prev !== 0x5C) inSingle = !inSingle;
    } else if (inDouble) {
      // check double quote
      if (c === 0x22 && prev !== 0x5C) inDouble = !inDouble;
    } else if (c === 0x7C && // pipe
    str.charCodeAt(i + 1) !== 0x7C && str.charCodeAt(i - 1) !== 0x7C) {
      if (dir.expression == null) {
        // first filter, end of expression
        lastFilterIndex = i + 1;
        dir.expression = str.slice(0, i).trim();
      } else {
        // already has filter
        pushFilter();
      }
    } else {
      switch (c) {
        case 0x22:
          inDouble = true;break; // "
        case 0x27:
          inSingle = true;break; // '
        case 0x28:
          paren++;break; // (
        case 0x29:
          paren--;break; // )
        case 0x5B:
          square++;break; // [
        case 0x5D:
          square--;break; // ]
        case 0x7B:
          curly++;break; // {
        case 0x7D:
          curly--;break; // }
      }
    }
  }

  if (dir.expression == null) {
    dir.expression = str.slice(0, i).trim();
  } else if (lastFilterIndex !== 0) {
    pushFilter();
  }

  cache$1.put(s, dir);
  return dir;
}

var directive = Object.freeze({
  parseDirective: parseDirective
});

var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;
var cache = undefined;
var tagRE = undefined;
var htmlRE = undefined;
/**
 * Escape a string so it can be used in a RegExp
 * constructor.
 *
 * @param {String} str
 */

function escapeRegex(str) {
  return str.replace(regexEscapeRE, '\\$&');
}

function compileRegex() {
  var open = escapeRegex(config.delimiters[0]);
  var close = escapeRegex(config.delimiters[1]);
  var unsafeOpen = escapeRegex(config.unsafeDelimiters[0]);
  var unsafeClose = escapeRegex(config.unsafeDelimiters[1]);
  tagRE = new RegExp(unsafeOpen + '(.+?)' + unsafeClose + '|' + open + '(.+?)' + close, 'g');
  htmlRE = new RegExp('^' + unsafeOpen + '.*' + unsafeClose + '$');
  // reset cache
  cache = new Cache(1000);
}

/**
 * Parse a template text string into an array of tokens.
 *
 * @param {String} text
 * @return {Array<Object> | null}
 *               - {String} type
 *               - {String} value
 *               - {Boolean} [html]
 *               - {Boolean} [oneTime]
 */

function parseText(text) {
  if (!cache) {
    compileRegex();
  }
  var hit = cache.get(text);
  if (hit) {
    return hit;
  }
  text = text.replace(/\n/g, '');
  if (!tagRE.test(text)) {
    return null;
  }
  var tokens = [];
  var lastIndex = tagRE.lastIndex = 0;
  var match, index, html, value, first, oneTime;
  /* eslint-disable no-cond-assign */
  while (match = tagRE.exec(text)) {
    /* eslint-enable no-cond-assign */
    index = match.index;
    // push text token
    if (index > lastIndex) {
      tokens.push({
        value: text.slice(lastIndex, index)
      });
    }
    // tag token
    html = htmlRE.test(match[0]);
    value = html ? match[1] : match[2];
    first = value.charCodeAt(0);
    oneTime = first === 42; // *
    value = oneTime ? value.slice(1) : value;
    tokens.push({
      tag: true,
      value: value.trim(),
      html: html,
      oneTime: oneTime
    });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({
      value: text.slice(lastIndex)
    });
  }
  cache.put(text, tokens);
  return tokens;
}

/**
 * Format a list of tokens into an expression.
 * e.g. tokens parsed from 'a {{b}} c' can be serialized
 * into one single expression as '"a " + b + " c"'.
 *
 * @param {Array} tokens
 * @param {Vue} [vm]
 * @return {String}
 */

function tokensToExp(tokens, vm) {
  if (tokens.length > 1) {
    return tokens.map(function (token) {
      return formatToken(token, vm);
    }).join('+');
  } else {
    return formatToken(tokens[0], vm, true);
  }
}

/**
 * Format a single token.
 *
 * @param {Object} token
 * @param {Vue} [vm]
 * @param {Boolean} [single]
 * @return {String}
 */

function formatToken(token, vm, single) {
  return token.tag ? token.oneTime && vm ? '"' + vm.$eval(token.value) + '"' : inlineFilters(token.value, single) : '"' + token.value + '"';
}

/**
 * For an attribute with multiple interpolation tags,
 * e.g. attr="some-{{thing | filter}}", in order to combine
 * the whole thing into a single watchable expression, we
 * have to inline those filters. This function does exactly
 * that. This is a bit hacky but it avoids heavy changes
 * to directive parser and watcher mechanism.
 *
 * @param {String} exp
 * @param {Boolean} single
 * @return {String}
 */

var filterRE = /[^|]\|[^|]/;
function inlineFilters(exp, single) {
  if (!filterRE.test(exp)) {
    return single ? exp : '(' + exp + ')';
  } else {
    var dir = parseDirective(exp);
    if (!dir.filters) {
      return '(' + exp + ')';
    } else {
      return 'this._applyFilters(' + dir.expression + // value
      ',null,' + // oldValue (null for read)
      JSON.stringify(dir.filters) + // filter descriptors
      ',false)'; // write?
    }
  }
}

var text = Object.freeze({
  compileRegex: compileRegex,
  parseText: parseText,
  tokensToExp: tokensToExp
});

var delimiters = ['{{', '}}'];
var unsafeDelimiters = ['{{{', '}}}'];

var config = Object.defineProperties({

  /**
   * Whether to print debug messages.
   * Also enables stack trace for warnings.
   *
   * @type {Boolean}
   */

  debug: false,

  /**
   * Whether to suppress warnings.
   *
   * @type {Boolean}
   */

  silent: false,

  /**
   * Whether to use async rendering.
   */

  async: true,

  /**
   * Whether to warn against errors caught when evaluating
   * expressions.
   */

  warnExpressionErrors: true,

  /**
   * Internal flag to indicate the delimiters have been
   * changed.
   *
   * @type {Boolean}
   */

  _delimitersChanged: true,

  /**
   * List of asset types that a component can own.
   *
   * @type {Array}
   */

  _assetTypes: ['component', 'directive', 'elementDirective', 'filter', 'transition', 'partial'],

  /**
   * prop binding modes
   */

  _propBindingModes: {
    ONE_WAY: 0,
    TWO_WAY: 1,
    ONE_TIME: 2
  },

  /**
   * Max circular updates allowed in a batcher flush cycle.
   */

  _maxUpdateCount: 100

}, {
  delimiters: { /**
                 * Interpolation delimiters. Changing these would trigger
                 * the text parser to re-compile the regular expressions.
                 *
                 * @type {Array<String>}
                 */

    get: function get() {
      return delimiters;
    },
    set: function set(val) {
      delimiters = val;
      compileRegex();
    },
    configurable: true,
    enumerable: true
  },
  unsafeDelimiters: {
    get: function get() {
      return unsafeDelimiters;
    },
    set: function set(val) {
      unsafeDelimiters = val;
      compileRegex();
    },
    configurable: true,
    enumerable: true
  }
});

var warn = undefined;

if (process.env.NODE_ENV !== 'production') {
  (function () {
    var hasConsole = typeof console !== 'undefined';
    warn = function (msg, e) {
      if (hasConsole && (!config.silent || config.debug)) {
        console.warn('[Vue warn]: ' + msg);
        /* istanbul ignore if */
        if (config.debug) {
          if (e) {
            throw e;
          } else {
            console.warn(new Error('Warning Stack Trace').stack);
          }
        }
      }
    };
  })();
}

/**
 * Append with transition.
 *
 * @param {Element} el
 * @param {Element} target
 * @param {Vue} vm
 * @param {Function} [cb]
 */

function appendWithTransition(el, target, vm, cb) {
  applyTransition(el, 1, function () {
    target.appendChild(el);
  }, vm, cb);
}

/**
 * InsertBefore with transition.
 *
 * @param {Element} el
 * @param {Element} target
 * @param {Vue} vm
 * @param {Function} [cb]
 */

function beforeWithTransition(el, target, vm, cb) {
  applyTransition(el, 1, function () {
    before(el, target);
  }, vm, cb);
}

/**
 * Remove with transition.
 *
 * @param {Element} el
 * @param {Vue} vm
 * @param {Function} [cb]
 */

function removeWithTransition(el, vm, cb) {
  applyTransition(el, -1, function () {
    remove(el);
  }, vm, cb);
}

/**
 * Apply transitions with an operation callback.
 *
 * @param {Element} el
 * @param {Number} direction
 *                  1: enter
 *                 -1: leave
 * @param {Function} op - the actual DOM operation
 * @param {Vue} vm
 * @param {Function} [cb]
 */

function applyTransition(el, direction, op, vm, cb) {
  var transition = el.__v_trans;
  if (!transition ||
  // skip if there are no js hooks and CSS transition is
  // not supported
  !transition.hooks && !transitionEndEvent ||
  // skip transitions for initial compile
  !vm._isCompiled ||
  // if the vm is being manipulated by a parent directive
  // during the parent's compilation phase, skip the
  // animation.
  vm.$parent && !vm.$parent._isCompiled) {
    op();
    if (cb) cb();
    return;
  }
  var action = direction > 0 ? 'enter' : 'leave';
  transition[action](op, cb);
}

var transition = Object.freeze({
  appendWithTransition: appendWithTransition,
  beforeWithTransition: beforeWithTransition,
  removeWithTransition: removeWithTransition,
  applyTransition: applyTransition
});

/**
 * Query an element selector if it's not an element already.
 *
 * @param {String|Element} el
 * @return {Element}
 */

function query(el) {
  if (typeof el === 'string') {
    var selector = el;
    el = document.querySelector(el);
    if (!el) {
      process.env.NODE_ENV !== 'production' && warn('Cannot find element: ' + selector);
    }
  }
  return el;
}

/**
 * Check if a node is in the document.
 * Note: document.documentElement.contains should work here
 * but always returns false for comment nodes in phantomjs,
 * making unit tests difficult. This is fixed by doing the
 * contains() check on the node's parentNode instead of
 * the node itself.
 *
 * @param {Node} node
 * @return {Boolean}
 */

function inDoc(node) {
  var doc = document.documentElement;
  var parent = node && node.parentNode;
  return doc === node || doc === parent || !!(parent && parent.nodeType === 1 && doc.contains(parent));
}

/**
 * Get and remove an attribute from a node.
 *
 * @param {Node} node
 * @param {String} _attr
 */

function getAttr(node, _attr) {
  var val = node.getAttribute(_attr);
  if (val !== null) {
    node.removeAttribute(_attr);
  }
  return val;
}

/**
 * Get an attribute with colon or v-bind: prefix.
 *
 * @param {Node} node
 * @param {String} name
 * @return {String|null}
 */

function getBindAttr(node, name) {
  var val = getAttr(node, ':' + name);
  if (val === null) {
    val = getAttr(node, 'v-bind:' + name);
  }
  return val;
}

/**
 * Check the presence of a bind attribute.
 *
 * @param {Node} node
 * @param {String} name
 * @return {Boolean}
 */

function hasBindAttr(node, name) {
  return node.hasAttribute(name) || node.hasAttribute(':' + name) || node.hasAttribute('v-bind:' + name);
}

/**
 * Insert el before target
 *
 * @param {Element} el
 * @param {Element} target
 */

function before(el, target) {
  target.parentNode.insertBefore(el, target);
}

/**
 * Insert el after target
 *
 * @param {Element} el
 * @param {Element} target
 */

function after(el, target) {
  if (target.nextSibling) {
    before(el, target.nextSibling);
  } else {
    target.parentNode.appendChild(el);
  }
}

/**
 * Remove el from DOM
 *
 * @param {Element} el
 */

function remove(el) {
  el.parentNode.removeChild(el);
}

/**
 * Prepend el to target
 *
 * @param {Element} el
 * @param {Element} target
 */

function prepend(el, target) {
  if (target.firstChild) {
    before(el, target.firstChild);
  } else {
    target.appendChild(el);
  }
}

/**
 * Replace target with el
 *
 * @param {Element} target
 * @param {Element} el
 */

function replace(target, el) {
  var parent = target.parentNode;
  if (parent) {
    parent.replaceChild(el, target);
  }
}

/**
 * Add event listener shorthand.
 *
 * @param {Element} el
 * @param {String} event
 * @param {Function} cb
 * @param {Boolean} [useCapture]
 */

function on(el, event, cb, useCapture) {
  el.addEventListener(event, cb, useCapture);
}

/**
 * Remove event listener shorthand.
 *
 * @param {Element} el
 * @param {String} event
 * @param {Function} cb
 */

function off(el, event, cb) {
  el.removeEventListener(event, cb);
}

/**
 * In IE9, setAttribute('class') will result in empty class
 * if the element also has the :class attribute; However in
 * PhantomJS, setting `className` does not work on SVG elements...
 * So we have to do a conditional check here.
 *
 * @param {Element} el
 * @param {String} cls
 */

function setClass(el, cls) {
  /* istanbul ignore if */
  if (isIE9 && !/svg$/.test(el.namespaceURI)) {
    el.className = cls;
  } else {
    el.setAttribute('class', cls);
  }
}

/**
 * Add class with compatibility for IE & SVG
 *
 * @param {Element} el
 * @param {String} cls
 */

function addClass(el, cls) {
  if (el.classList) {
    el.classList.add(cls);
  } else {
    var cur = ' ' + (el.getAttribute('class') || '') + ' ';
    if (cur.indexOf(' ' + cls + ' ') < 0) {
      setClass(el, (cur + cls).trim());
    }
  }
}

/**
 * Remove class with compatibility for IE & SVG
 *
 * @param {Element} el
 * @param {String} cls
 */

function removeClass(el, cls) {
  if (el.classList) {
    el.classList.remove(cls);
  } else {
    var cur = ' ' + (el.getAttribute('class') || '') + ' ';
    var tar = ' ' + cls + ' ';
    while (cur.indexOf(tar) >= 0) {
      cur = cur.replace(tar, ' ');
    }
    setClass(el, cur.trim());
  }
  if (!el.className) {
    el.removeAttribute('class');
  }
}

/**
 * Extract raw content inside an element into a temporary
 * container div
 *
 * @param {Element} el
 * @param {Boolean} asFragment
 * @return {Element|DocumentFragment}
 */

function extractContent(el, asFragment) {
  var child;
  var rawContent;
  /* istanbul ignore if */
  if (isTemplate(el) && isFragment(el.content)) {
    el = el.content;
  }
  if (el.hasChildNodes()) {
    trimNode(el);
    rawContent = asFragment ? document.createDocumentFragment() : document.createElement('div');
    /* eslint-disable no-cond-assign */
    while (child = el.firstChild) {
      /* eslint-enable no-cond-assign */
      rawContent.appendChild(child);
    }
  }
  return rawContent;
}

/**
 * Trim possible empty head/tail text and comment
 * nodes inside a parent.
 *
 * @param {Node} node
 */

function trimNode(node) {
  var child;
  /* eslint-disable no-sequences */
  while ((child = node.firstChild, isTrimmable(child))) {
    node.removeChild(child);
  }
  while ((child = node.lastChild, isTrimmable(child))) {
    node.removeChild(child);
  }
  /* eslint-enable no-sequences */
}

function isTrimmable(node) {
  return node && (node.nodeType === 3 && !node.data.trim() || node.nodeType === 8);
}

/**
 * Check if an element is a template tag.
 * Note if the template appears inside an SVG its tagName
 * will be in lowercase.
 *
 * @param {Element} el
 */

function isTemplate(el) {
  return el.tagName && el.tagName.toLowerCase() === 'template';
}

/**
 * Create an "anchor" for performing dom insertion/removals.
 * This is used in a number of scenarios:
 * - fragment instance
 * - v-html
 * - v-if
 * - v-for
 * - component
 *
 * @param {String} content
 * @param {Boolean} persist - IE trashes empty textNodes on
 *                            cloneNode(true), so in certain
 *                            cases the anchor needs to be
 *                            non-empty to be persisted in
 *                            templates.
 * @return {Comment|Text}
 */

function createAnchor(content, persist) {
  var anchor = config.debug ? document.createComment(content) : document.createTextNode(persist ? ' ' : '');
  anchor.__v_anchor = true;
  return anchor;
}

/**
 * Find a component ref attribute that starts with $.
 *
 * @param {Element} node
 * @return {String|undefined}
 */

var refRE = /^v-ref:/;

function findRef(node) {
  if (node.hasAttributes()) {
    var attrs = node.attributes;
    for (var i = 0, l = attrs.length; i < l; i++) {
      var name = attrs[i].name;
      if (refRE.test(name)) {
        return camelize(name.replace(refRE, ''));
      }
    }
  }
}

/**
 * Map a function to a range of nodes .
 *
 * @param {Node} node
 * @param {Node} end
 * @param {Function} op
 */

function mapNodeRange(node, end, op) {
  var next;
  while (node !== end) {
    next = node.nextSibling;
    op(node);
    node = next;
  }
  op(end);
}

/**
 * Remove a range of nodes with transition, store
 * the nodes in a fragment with correct ordering,
 * and call callback when done.
 *
 * @param {Node} start
 * @param {Node} end
 * @param {Vue} vm
 * @param {DocumentFragment} frag
 * @param {Function} cb
 */

function removeNodeRange(start, end, vm, frag, cb) {
  var done = false;
  var removed = 0;
  var nodes = [];
  mapNodeRange(start, end, function (node) {
    if (node === end) done = true;
    nodes.push(node);
    removeWithTransition(node, vm, onRemoved);
  });
  function onRemoved() {
    removed++;
    if (done && removed >= nodes.length) {
      for (var i = 0; i < nodes.length; i++) {
        frag.appendChild(nodes[i]);
      }
      cb && cb();
    }
  }
}

/**
 * Check if a node is a DocumentFragment.
 *
 * @param {Node} node
 * @return {Boolean}
 */

function isFragment(node) {
  return node && node.nodeType === 11;
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 *
 * @param {Element} el
 * @return {String}
 */

function getOuterHTML(el) {
  if (el.outerHTML) {
    return el.outerHTML;
  } else {
    var container = document.createElement('div');
    container.appendChild(el.cloneNode(true));
    return container.innerHTML;
  }
}

var commonTagRE = /^(div|p|span|img|a|b|i|br|ul|ol|li|h1|h2|h3|h4|h5|h6|code|pre|table|th|td|tr|form|label|input|select|option|nav|article|section|header|footer)$/;
var reservedTagRE = /^(slot|partial|component)$/;

var isUnknownElement = undefined;
if (process.env.NODE_ENV !== 'production') {
  isUnknownElement = function (el, tag) {
    if (tag.indexOf('-') > -1) {
      // http://stackoverflow.com/a/28210364/1070244
      return el.constructor === window.HTMLUnknownElement || el.constructor === window.HTMLElement;
    } else {
      return (/HTMLUnknownElement/.test(el.toString()) &&
        // Chrome returns unknown for several HTML5 elements.
        // https://code.google.com/p/chromium/issues/detail?id=540526
        !/^(data|time|rtc|rb)$/.test(tag)
      );
    }
  };
}

/**
 * Check if an element is a component, if yes return its
 * component id.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Object|undefined}
 */

function checkComponentAttr(el, options) {
  var tag = el.tagName.toLowerCase();
  var hasAttrs = el.hasAttributes();
  if (!commonTagRE.test(tag) && !reservedTagRE.test(tag)) {
    if (resolveAsset(options, 'components', tag)) {
      return { id: tag };
    } else {
      var is = hasAttrs && getIsBinding(el);
      if (is) {
        return is;
      } else if (process.env.NODE_ENV !== 'production') {
        var expectedTag = options._componentNameMap && options._componentNameMap[tag];
        if (expectedTag) {
          warn('Unknown custom element: <' + tag + '> - ' + 'did you mean <' + expectedTag + '>? ' + 'HTML is case-insensitive, remember to use kebab-case in templates.');
        } else if (isUnknownElement(el, tag)) {
          warn('Unknown custom element: <' + tag + '> - did you ' + 'register the component correctly? For recursive components, ' + 'make sure to provide the "name" option.');
        }
      }
    }
  } else if (hasAttrs) {
    return getIsBinding(el);
  }
}

/**
 * Get "is" binding from an element.
 *
 * @param {Element} el
 * @return {Object|undefined}
 */

function getIsBinding(el) {
  // dynamic syntax
  var exp = getAttr(el, 'is');
  if (exp != null) {
    return { id: exp };
  } else {
    exp = getBindAttr(el, 'is');
    if (exp != null) {
      return { id: exp, dynamic: true };
    }
  }
}

/**
 * Set a prop's initial value on a vm and its data object.
 *
 * @param {Vue} vm
 * @param {Object} prop
 * @param {*} value
 */

function initProp(vm, prop, value) {
  var key = prop.path;
  value = coerceProp(prop, value);
  vm[key] = vm._data[key] = assertProp(prop, value) ? value : undefined;
}

/**
 * Assert whether a prop is valid.
 *
 * @param {Object} prop
 * @param {*} value
 */

function assertProp(prop, value) {
  if (!prop.options.required && ( // non-required
  prop.raw === null || // abscent
  value == null) // null or undefined
  ) {
      return true;
    }
  var options = prop.options;
  var type = options.type;
  var valid = true;
  var expectedType;
  if (type) {
    if (type === String) {
      expectedType = 'string';
      valid = typeof value === expectedType;
    } else if (type === Number) {
      expectedType = 'number';
      valid = typeof value === 'number';
    } else if (type === Boolean) {
      expectedType = 'boolean';
      valid = typeof value === 'boolean';
    } else if (type === Function) {
      expectedType = 'function';
      valid = typeof value === 'function';
    } else if (type === Object) {
      expectedType = 'object';
      valid = isPlainObject(value);
    } else if (type === Array) {
      expectedType = 'array';
      valid = isArray(value);
    } else {
      valid = value instanceof type;
    }
  }
  if (!valid) {
    process.env.NODE_ENV !== 'production' && warn('Invalid prop: type check failed for ' + prop.path + '="' + prop.raw + '".' + ' Expected ' + formatType(expectedType) + ', got ' + formatValue(value) + '.');
    return false;
  }
  var validator = options.validator;
  if (validator) {
    if (!validator(value)) {
      process.env.NODE_ENV !== 'production' && warn('Invalid prop: custom validator check failed for ' + prop.path + '="' + prop.raw + '"');
      return false;
    }
  }
  return true;
}

/**
 * Force parsing value with coerce option.
 *
 * @param {*} value
 * @param {Object} options
 * @return {*}
 */

function coerceProp(prop, value) {
  var coerce = prop.options.coerce;
  if (!coerce) {
    return value;
  }
  // coerce is a function
  return coerce(value);
}

function formatType(val) {
  return val ? val.charAt(0).toUpperCase() + val.slice(1) : 'custom type';
}

function formatValue(val) {
  return Object.prototype.toString.call(val).slice(8, -1);
}

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 *
 * All strategy functions follow the same signature:
 *
 * @param {*} parentVal
 * @param {*} childVal
 * @param {Vue} [vm]
 */

var strats = config.optionMergeStrategies = Object.create(null);

/**
 * Helper that recursively merges two data objects together.
 */

function mergeData(to, from) {
  var key, toVal, fromVal;
  for (key in from) {
    toVal = to[key];
    fromVal = from[key];
    if (!hasOwn(to, key)) {
      set(to, key, fromVal);
    } else if (isObject(toVal) && isObject(fromVal)) {
      mergeData(toVal, fromVal);
    }
  }
  return to;
}

/**
 * Data
 */

strats.data = function (parentVal, childVal, vm) {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal;
    }
    if (typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn('The "data" option should be a function ' + 'that returns a per-instance value in component ' + 'definitions.');
      return parentVal;
    }
    if (!parentVal) {
      return childVal;
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn() {
      return mergeData(childVal.call(this), parentVal.call(this));
    };
  } else if (parentVal || childVal) {
    return function mergedInstanceDataFn() {
      // instance merge
      var instanceData = typeof childVal === 'function' ? childVal.call(vm) : childVal;
      var defaultData = typeof parentVal === 'function' ? parentVal.call(vm) : undefined;
      if (instanceData) {
        return mergeData(instanceData, defaultData);
      } else {
        return defaultData;
      }
    };
  }
};

/**
 * El
 */

strats.el = function (parentVal, childVal, vm) {
  if (!vm && childVal && typeof childVal !== 'function') {
    process.env.NODE_ENV !== 'production' && warn('The "el" option should be a function ' + 'that returns a per-instance value in component ' + 'definitions.');
    return;
  }
  var ret = childVal || parentVal;
  // invoke the element factory if this is instance merge
  return vm && typeof ret === 'function' ? ret.call(vm) : ret;
};

/**
 * Hooks and param attributes are merged as arrays.
 */

strats.init = strats.created = strats.ready = strats.attached = strats.detached = strats.beforeCompile = strats.compiled = strats.beforeDestroy = strats.destroyed = strats.activate = function (parentVal, childVal) {
  return childVal ? parentVal ? parentVal.concat(childVal) : isArray(childVal) ? childVal : [childVal] : parentVal;
};

/**
 * 0.11 deprecation warning
 */

strats.paramAttributes = function () {
  /* istanbul ignore next */
  process.env.NODE_ENV !== 'production' && warn('"paramAttributes" option has been deprecated in 0.12. ' + 'Use "props" instead.');
};

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */

function mergeAssets(parentVal, childVal) {
  var res = Object.create(parentVal);
  return childVal ? extend(res, guardArrayAssets(childVal)) : res;
}

config._assetTypes.forEach(function (type) {
  strats[type + 's'] = mergeAssets;
});

/**
 * Events & Watchers.
 *
 * Events & watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */

strats.watch = strats.events = function (parentVal, childVal) {
  if (!childVal) return parentVal;
  if (!parentVal) return childVal;
  var ret = {};
  extend(ret, parentVal);
  for (var key in childVal) {
    var parent = ret[key];
    var child = childVal[key];
    if (parent && !isArray(parent)) {
      parent = [parent];
    }
    ret[key] = parent ? parent.concat(child) : [child];
  }
  return ret;
};

/**
 * Other object hashes.
 */

strats.props = strats.methods = strats.computed = function (parentVal, childVal) {
  if (!childVal) return parentVal;
  if (!parentVal) return childVal;
  var ret = Object.create(null);
  extend(ret, parentVal);
  extend(ret, childVal);
  return ret;
};

/**
 * Default strategy.
 */

var defaultStrat = function defaultStrat(parentVal, childVal) {
  return childVal === undefined ? parentVal : childVal;
};

/**
 * Make sure component options get converted to actual
 * constructors.
 *
 * @param {Object} options
 */

function guardComponents(options) {
  if (options.components) {
    var components = options.components = guardArrayAssets(options.components);
    var ids = Object.keys(components);
    var def;
    if (process.env.NODE_ENV !== 'production') {
      var map = options._componentNameMap = {};
    }
    for (var i = 0, l = ids.length; i < l; i++) {
      var key = ids[i];
      if (commonTagRE.test(key) || reservedTagRE.test(key)) {
        process.env.NODE_ENV !== 'production' && warn('Do not use built-in or reserved HTML elements as component ' + 'id: ' + key);
        continue;
      }
      // record a all lowercase <-> kebab-case mapping for
      // possible custom element case error warning
      if (process.env.NODE_ENV !== 'production') {
        map[key.replace(/-/g, '').toLowerCase()] = hyphenate(key);
      }
      def = components[key];
      if (isPlainObject(def)) {
        components[key] = Vue.extend(def);
      }
    }
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 *
 * @param {Object} options
 */

function guardProps(options) {
  var props = options.props;
  var i, val;
  if (isArray(props)) {
    options.props = {};
    i = props.length;
    while (i--) {
      val = props[i];
      if (typeof val === 'string') {
        options.props[val] = null;
      } else if (val.name) {
        options.props[val.name] = val;
      }
    }
  } else if (isPlainObject(props)) {
    var keys = Object.keys(props);
    i = keys.length;
    while (i--) {
      val = props[keys[i]];
      if (typeof val === 'function') {
        props[keys[i]] = { type: val };
      }
    }
  }
}

/**
 * Guard an Array-format assets option and converted it
 * into the key-value Object format.
 *
 * @param {Object|Array} assets
 * @return {Object}
 */

function guardArrayAssets(assets) {
  if (isArray(assets)) {
    var res = {};
    var i = assets.length;
    var asset;
    while (i--) {
      asset = assets[i];
      var id = typeof asset === 'function' ? asset.options && asset.options.name || asset.id : asset.name || asset.id;
      if (!id) {
        process.env.NODE_ENV !== 'production' && warn('Array-syntax assets must provide a "name" or "id" field.');
      } else {
        res[id] = asset;
      }
    }
    return res;
  }
  return assets;
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 *
 * @param {Object} parent
 * @param {Object} child
 * @param {Vue} [vm] - if vm is present, indicates this is
 *                     an instantiation merge.
 */

function mergeOptions(parent, child, vm) {
  guardComponents(child);
  guardProps(child);
  var options = {};
  var key;
  if (child.mixins) {
    for (var i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm);
    }
  }
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  function mergeField(key) {
    var strat = strats[key] || defaultStrat;
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options;
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 *
 * @param {Object} options
 * @param {String} type
 * @param {String} id
 * @return {Object|Function}
 */

function resolveAsset(options, type, id) {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return;
  }
  var assets = options[type];
  var camelizedId;
  return assets[id] ||
  // camelCase ID
  assets[camelizedId = camelize(id)] ||
  // Pascal Case ID
  assets[camelizedId.charAt(0).toUpperCase() + camelizedId.slice(1)];
}

/**
 * Assert asset exists
 */

function assertAsset(val, type, id) {
  if (!val) {
    process.env.NODE_ENV !== 'production' && warn('Failed to resolve ' + type + ': ' + id);
  }
}

var uid$1 = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 *
 * @constructor
 */
function Dep() {
  this.id = uid$1++;
  this.subs = [];
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null;

/**
 * Add a directive subscriber.
 *
 * @param {Directive} sub
 */

Dep.prototype.addSub = function (sub) {
  this.subs.push(sub);
};

/**
 * Remove a directive subscriber.
 *
 * @param {Directive} sub
 */

Dep.prototype.removeSub = function (sub) {
  this.subs.$remove(sub);
};

/**
 * Add self as a dependency to the target watcher.
 */

Dep.prototype.depend = function () {
  Dep.target.addDep(this);
};

/**
 * Notify all subscribers of a new value.
 */

Dep.prototype.notify = function () {
  // stablize the subscriber list first
  var subs = toArray(this.subs);
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto)

/**
 * Intercept mutating methods and emit events
 */

;['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].forEach(function (method) {
  // cache original method
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator() {
    // avoid leaking arguments:
    // http://jsperf.com/closure-with-arguments
    var i = arguments.length;
    var args = new Array(i);
    while (i--) {
      args[i] = arguments[i];
    }
    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
        inserted = args;
        break;
      case 'unshift':
        inserted = args;
        break;
      case 'splice':
        inserted = args.slice(2);
        break;
    }
    if (inserted) ob.observeArray(inserted);
    // notify change
    ob.dep.notify();
    return result;
  });
});

/**
 * Swap the element at the given index with a new value
 * and emits corresponding event.
 *
 * @param {Number} index
 * @param {*} val
 * @return {*} - replaced element
 */

def(arrayProto, '$set', function $set(index, val) {
  if (index >= this.length) {
    this.length = Number(index) + 1;
  }
  return this.splice(index, 1, val)[0];
});

/**
 * Convenience method to remove the element at given index.
 *
 * @param {Number} index
 * @param {*} val
 */

def(arrayProto, '$remove', function $remove(item) {
  /* istanbul ignore if */
  if (!this.length) return;
  var index = indexOf(this, item);
  if (index > -1) {
    return this.splice(index, 1);
  }
});

var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 *
 * @param {Array|Object} value
 * @constructor
 */

function Observer(value) {
  this.value = value;
  this.dep = new Dep();
  def(value, '__ob__', this);
  if (isArray(value)) {
    var augment = hasProto ? protoAugment : copyAugment;
    augment(value, arrayMethods, arrayKeys);
    this.observeArray(value);
  } else {
    this.walk(value);
  }
}

// Instance methods

/**
 * Walk through each property and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 *
 * @param {Object} obj
 */

Observer.prototype.walk = function (obj) {
  var keys = Object.keys(obj);
  for (var i = 0, l = keys.length; i < l; i++) {
    this.convert(keys[i], obj[keys[i]]);
  }
};

/**
 * Observe a list of Array items.
 *
 * @param {Array} items
 */

Observer.prototype.observeArray = function (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};

/**
 * Convert a property into getter/setter so we can emit
 * the events when the property is accessed/changed.
 *
 * @param {String} key
 * @param {*} val
 */

Observer.prototype.convert = function (key, val) {
  defineReactive(this.value, key, val);
};

/**
 * Add an owner vm, so that when $set/$delete mutations
 * happen we can notify owner vms to proxy the keys and
 * digest the watchers. This is only called when the object
 * is observed as an instance's root $data.
 *
 * @param {Vue} vm
 */

Observer.prototype.addVm = function (vm) {
  (this.vms || (this.vms = [])).push(vm);
};

/**
 * Remove an owner vm. This is called when the object is
 * swapped out as an instance's $data object.
 *
 * @param {Vue} vm
 */

Observer.prototype.removeVm = function (vm) {
  this.vms.$remove(vm);
};

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 *
 * @param {Object|Array} target
 * @param {Object} proto
 */

function protoAugment(target, src) {
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 *
 * @param {Object|Array} target
 * @param {Object} proto
 */

function copyAugment(target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 *
 * @param {*} value
 * @param {Vue} [vm]
 * @return {Observer|undefined}
 * @static
 */

function observe(value, vm) {
  if (!value || typeof value !== 'object') {
    return;
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if ((isArray(value) || isPlainObject(value)) && Object.isExtensible(value) && !value._isVue) {
    ob = new Observer(value);
  }
  if (ob && vm) {
    ob.addVm(vm);
  }
  return ob;
}

/**
 * Define a reactive property on an Object.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {*} val
 */

function defineReactive(obj, key, val) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return;
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  var setter = property && property.set;

  var childOb = observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
        if (isArray(value)) {
          for (var e, i = 0, l = value.length; i < l; i++) {
            e = value[i];
            e && e.__ob__ && e.__ob__.dep.depend();
          }
        }
      }
      return value;
    },
    set: function reactiveSetter(newVal) {
      var value = getter ? getter.call(obj) : val;
      if (newVal === value) {
        return;
      }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = observe(newVal);
      dep.notify();
    }
  });
}



var util = Object.freeze({
	defineReactive: defineReactive,
	set: set,
	del: del,
	hasOwn: hasOwn,
	isLiteral: isLiteral,
	isReserved: isReserved,
	_toString: _toString,
	toNumber: toNumber,
	toBoolean: toBoolean,
	stripQuotes: stripQuotes,
	camelize: camelize,
	hyphenate: hyphenate,
	classify: classify,
	bind: bind,
	toArray: toArray,
	extend: extend,
	isObject: isObject,
	isPlainObject: isPlainObject,
	def: def,
	debounce: _debounce,
	indexOf: indexOf,
	cancellable: cancellable,
	looseEqual: looseEqual,
	isArray: isArray,
	hasProto: hasProto,
	inBrowser: inBrowser,
	devtools: devtools,
	isIE9: isIE9,
	isAndroid: isAndroid,
	get transitionProp () { return transitionProp; },
	get transitionEndEvent () { return transitionEndEvent; },
	get animationProp () { return animationProp; },
	get animationEndEvent () { return animationEndEvent; },
	nextTick: nextTick,
	query: query,
	inDoc: inDoc,
	getAttr: getAttr,
	getBindAttr: getBindAttr,
	hasBindAttr: hasBindAttr,
	before: before,
	after: after,
	remove: remove,
	prepend: prepend,
	replace: replace,
	on: on,
	off: off,
	setClass: setClass,
	addClass: addClass,
	removeClass: removeClass,
	extractContent: extractContent,
	trimNode: trimNode,
	isTemplate: isTemplate,
	createAnchor: createAnchor,
	findRef: findRef,
	mapNodeRange: mapNodeRange,
	removeNodeRange: removeNodeRange,
	isFragment: isFragment,
	getOuterHTML: getOuterHTML,
	mergeOptions: mergeOptions,
	resolveAsset: resolveAsset,
	assertAsset: assertAsset,
	checkComponentAttr: checkComponentAttr,
	initProp: initProp,
	assertProp: assertProp,
	coerceProp: coerceProp,
	commonTagRE: commonTagRE,
	reservedTagRE: reservedTagRE,
	get warn () { return warn; }
});

var uid = 0;

function initMixin (Vue) {
  /**
   * The main init sequence. This is called for every
   * instance, including ones that are created from extended
   * constructors.
   *
   * @param {Object} options - this options object should be
   *                           the result of merging class
   *                           options and the options passed
   *                           in to the constructor.
   */

  Vue.prototype._init = function (options) {
    options = options || {};

    this.$el = null;
    this.$parent = options.parent;
    this.$root = this.$parent ? this.$parent.$root : this;
    this.$children = [];
    this.$refs = {}; // child vm references
    this.$els = {}; // element references
    this._watchers = []; // all watchers as an array
    this._directives = []; // all directives

    // a uid
    this._uid = uid++;

    // a flag to avoid this being observed
    this._isVue = true;

    // events bookkeeping
    this._events = {}; // registered callbacks
    this._eventsCount = {}; // for $broadcast optimization

    // fragment instance properties
    this._isFragment = false;
    this._fragment = // @type {DocumentFragment}
    this._fragmentStart = // @type {Text|Comment}
    this._fragmentEnd = null; // @type {Text|Comment}

    // lifecycle state
    this._isCompiled = this._isDestroyed = this._isReady = this._isAttached = this._isBeingDestroyed = this._vForRemoving = false;
    this._unlinkFn = null;

    // context:
    // if this is a transcluded component, context
    // will be the common parent vm of this instance
    // and its host.
    this._context = options._context || this.$parent;

    // scope:
    // if this is inside an inline v-for, the scope
    // will be the intermediate scope created for this
    // repeat fragment. this is used for linking props
    // and container directives.
    this._scope = options._scope;

    // fragment:
    // if this instance is compiled inside a Fragment, it
    // needs to reigster itself as a child of that fragment
    // for attach/detach to work properly.
    this._frag = options._frag;
    if (this._frag) {
      this._frag.children.push(this);
    }

    // push self into parent / transclusion host
    if (this.$parent) {
      this.$parent.$children.push(this);
    }

    // save raw constructor data before merge
    // so that we know which properties are provided at
    // instantiation.
    if (process.env.NODE_ENV !== 'production') {
      this._runtimeData = options.data;
    }

    // merge options.
    options = this.$options = mergeOptions(this.constructor.options, options, this);

    // set ref
    this._updateRef();

    // initialize data as empty object.
    // it will be filled up in _initScope().
    this._data = {};

    // call init hook
    this._callHook('init');

    // initialize data observation and scope inheritance.
    this._initState();

    // setup event system and option events.
    this._initEvents();

    // call created hook
    this._callHook('created');

    // if `el` option is passed, start compilation.
    if (options.el) {
      this.$mount(options.el);
    }
  };
}

var pathCache = new Cache(1000);

// actions
var APPEND = 0;
var PUSH = 1;
var INC_SUB_PATH_DEPTH = 2;
var PUSH_SUB_PATH = 3;

// states
var BEFORE_PATH = 0;
var IN_PATH = 1;
var BEFORE_IDENT = 2;
var IN_IDENT = 3;
var IN_SUB_PATH = 4;
var IN_SINGLE_QUOTE = 5;
var IN_DOUBLE_QUOTE = 6;
var AFTER_PATH = 7;
var ERROR = 8;

var pathStateMachine = [];

pathStateMachine[BEFORE_PATH] = {
  'ws': [BEFORE_PATH],
  'ident': [IN_IDENT, APPEND],
  '[': [IN_SUB_PATH],
  'eof': [AFTER_PATH]
};

pathStateMachine[IN_PATH] = {
  'ws': [IN_PATH],
  '.': [BEFORE_IDENT],
  '[': [IN_SUB_PATH],
  'eof': [AFTER_PATH]
};

pathStateMachine[BEFORE_IDENT] = {
  'ws': [BEFORE_IDENT],
  'ident': [IN_IDENT, APPEND]
};

pathStateMachine[IN_IDENT] = {
  'ident': [IN_IDENT, APPEND],
  '0': [IN_IDENT, APPEND],
  'number': [IN_IDENT, APPEND],
  'ws': [IN_PATH, PUSH],
  '.': [BEFORE_IDENT, PUSH],
  '[': [IN_SUB_PATH, PUSH],
  'eof': [AFTER_PATH, PUSH]
};

pathStateMachine[IN_SUB_PATH] = {
  "'": [IN_SINGLE_QUOTE, APPEND],
  '"': [IN_DOUBLE_QUOTE, APPEND],
  '[': [IN_SUB_PATH, INC_SUB_PATH_DEPTH],
  ']': [IN_PATH, PUSH_SUB_PATH],
  'eof': ERROR,
  'else': [IN_SUB_PATH, APPEND]
};

pathStateMachine[IN_SINGLE_QUOTE] = {
  "'": [IN_SUB_PATH, APPEND],
  'eof': ERROR,
  'else': [IN_SINGLE_QUOTE, APPEND]
};

pathStateMachine[IN_DOUBLE_QUOTE] = {
  '"': [IN_SUB_PATH, APPEND],
  'eof': ERROR,
  'else': [IN_DOUBLE_QUOTE, APPEND]
};

/**
 * Determine the type of a character in a keypath.
 *
 * @param {Char} ch
 * @return {String} type
 */

function getPathCharType(ch) {
  if (ch === undefined) {
    return 'eof';
  }

  var code = ch.charCodeAt(0);

  switch (code) {
    case 0x5B: // [
    case 0x5D: // ]
    case 0x2E: // .
    case 0x22: // "
    case 0x27: // '
    case 0x30:
      // 0
      return ch;

    case 0x5F: // _
    case 0x24:
      // $
      return 'ident';

    case 0x20: // Space
    case 0x09: // Tab
    case 0x0A: // Newline
    case 0x0D: // Return
    case 0xA0: // No-break space
    case 0xFEFF: // Byte Order Mark
    case 0x2028: // Line Separator
    case 0x2029:
      // Paragraph Separator
      return 'ws';
  }

  // a-z, A-Z
  if (code >= 0x61 && code <= 0x7A || code >= 0x41 && code <= 0x5A) {
    return 'ident';
  }

  // 1-9
  if (code >= 0x31 && code <= 0x39) {
    return 'number';
  }

  return 'else';
}

/**
 * Format a subPath, return its plain form if it is
 * a literal string or number. Otherwise prepend the
 * dynamic indicator (*).
 *
 * @param {String} path
 * @return {String}
 */

function formatSubPath(path) {
  var trimmed = path.trim();
  // invalid leading 0
  if (path.charAt(0) === '0' && isNaN(path)) {
    return false;
  }
  return isLiteral(trimmed) ? stripQuotes(trimmed) : '*' + trimmed;
}

/**
 * Parse a string path into an array of segments
 *
 * @param {String} path
 * @return {Array|undefined}
 */

function parse(path) {
  var keys = [];
  var index = -1;
  var mode = BEFORE_PATH;
  var subPathDepth = 0;
  var c, newChar, key, type, transition, action, typeMap;

  var actions = [];

  actions[PUSH] = function () {
    if (key !== undefined) {
      keys.push(key);
      key = undefined;
    }
  };

  actions[APPEND] = function () {
    if (key === undefined) {
      key = newChar;
    } else {
      key += newChar;
    }
  };

  actions[INC_SUB_PATH_DEPTH] = function () {
    actions[APPEND]();
    subPathDepth++;
  };

  actions[PUSH_SUB_PATH] = function () {
    if (subPathDepth > 0) {
      subPathDepth--;
      mode = IN_SUB_PATH;
      actions[APPEND]();
    } else {
      subPathDepth = 0;
      key = formatSubPath(key);
      if (key === false) {
        return false;
      } else {
        actions[PUSH]();
      }
    }
  };

  function maybeUnescapeQuote() {
    var nextChar = path[index + 1];
    if (mode === IN_SINGLE_QUOTE && nextChar === "'" || mode === IN_DOUBLE_QUOTE && nextChar === '"') {
      index++;
      newChar = '\\' + nextChar;
      actions[APPEND]();
      return true;
    }
  }

  while (mode != null) {
    index++;
    c = path[index];

    if (c === '\\' && maybeUnescapeQuote()) {
      continue;
    }

    type = getPathCharType(c);
    typeMap = pathStateMachine[mode];
    transition = typeMap[type] || typeMap['else'] || ERROR;

    if (transition === ERROR) {
      return; // parse error
    }

    mode = transition[0];
    action = actions[transition[1]];
    if (action) {
      newChar = transition[2];
      newChar = newChar === undefined ? c : newChar;
      if (action() === false) {
        return;
      }
    }

    if (mode === AFTER_PATH) {
      keys.raw = path;
      return keys;
    }
  }
}

/**
 * External parse that check for a cache hit first
 *
 * @param {String} path
 * @return {Array|undefined}
 */

function parsePath(path) {
  var hit = pathCache.get(path);
  if (!hit) {
    hit = parse(path);
    if (hit) {
      pathCache.put(path, hit);
    }
  }
  return hit;
}

/**
 * Get from an object from a path string
 *
 * @param {Object} obj
 * @param {String} path
 */

function getPath(obj, path) {
  return parseExpression(path).get(obj);
}

/**
 * Warn against setting non-existent root path on a vm.
 */

var warnNonExistent;
if (process.env.NODE_ENV !== 'production') {
  warnNonExistent = function (path) {
    warn('You are setting a non-existent path "' + path.raw + '" ' + 'on a vm instance. Consider pre-initializing the property ' + 'with the "data" option for more reliable reactivity ' + 'and better performance.');
  };
}

/**
 * Set on an object from a path
 *
 * @param {Object} obj
 * @param {String | Array} path
 * @param {*} val
 */

function setPath(obj, path, val) {
  var original = obj;
  if (typeof path === 'string') {
    path = parse(path);
  }
  if (!path || !isObject(obj)) {
    return false;
  }
  var last, key;
  for (var i = 0, l = path.length; i < l; i++) {
    last = obj;
    key = path[i];
    if (key.charAt(0) === '*') {
      key = parseExpression(key.slice(1)).get.call(original, original);
    }
    if (i < l - 1) {
      obj = obj[key];
      if (!isObject(obj)) {
        obj = {};
        if (process.env.NODE_ENV !== 'production' && last._isVue) {
          warnNonExistent(path);
        }
        set(last, key, obj);
      }
    } else {
      if (isArray(obj)) {
        obj.$set(key, val);
      } else if (key in obj) {
        obj[key] = val;
      } else {
        if (process.env.NODE_ENV !== 'production' && obj._isVue) {
          warnNonExistent(path);
        }
        set(obj, key, val);
      }
    }
  }
  return true;
}

var path = Object.freeze({
  parsePath: parsePath,
  getPath: getPath,
  setPath: setPath
});

var expressionCache = new Cache(1000);

var allowedKeywords = 'Math,Date,this,true,false,null,undefined,Infinity,NaN,' + 'isNaN,isFinite,decodeURI,decodeURIComponent,encodeURI,' + 'encodeURIComponent,parseInt,parseFloat';
var allowedKeywordsRE = new RegExp('^(' + allowedKeywords.replace(/,/g, '\\b|') + '\\b)');

// keywords that don't make sense inside expressions
var improperKeywords = 'break,case,class,catch,const,continue,debugger,default,' + 'delete,do,else,export,extends,finally,for,function,if,' + 'import,in,instanceof,let,return,super,switch,throw,try,' + 'var,while,with,yield,enum,await,implements,package,' + 'proctected,static,interface,private,public';
var improperKeywordsRE = new RegExp('^(' + improperKeywords.replace(/,/g, '\\b|') + '\\b)');

var wsRE = /\s/g;
var newlineRE = /\n/g;
var saveRE = /[\{,]\s*[\w\$_]+\s*:|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`)|new |typeof |void /g;
var restoreRE = /"(\d+)"/g;
var pathTestRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['.*?'\]|\[".*?"\]|\[\d+\]|\[[A-Za-z_$][\w$]*\])*$/;
var identRE = /[^\w$\.](?:[A-Za-z_$][\w$]*)/g;
var booleanLiteralRE = /^(?:true|false)$/;

/**
 * Save / Rewrite / Restore
 *
 * When rewriting paths found in an expression, it is
 * possible for the same letter sequences to be found in
 * strings and Object literal property keys. Therefore we
 * remove and store these parts in a temporary array, and
 * restore them after the path rewrite.
 */

var saved = [];

/**
 * Save replacer
 *
 * The save regex can match two possible cases:
 * 1. An opening object literal
 * 2. A string
 * If matched as a plain string, we need to escape its
 * newlines, since the string needs to be preserved when
 * generating the function body.
 *
 * @param {String} str
 * @param {String} isString - str if matched as a string
 * @return {String} - placeholder with index
 */

function save(str, isString) {
  var i = saved.length;
  saved[i] = isString ? str.replace(newlineRE, '\\n') : str;
  return '"' + i + '"';
}

/**
 * Path rewrite replacer
 *
 * @param {String} raw
 * @return {String}
 */

function rewrite(raw) {
  var c = raw.charAt(0);
  var path = raw.slice(1);
  if (allowedKeywordsRE.test(path)) {
    return raw;
  } else {
    path = path.indexOf('"') > -1 ? path.replace(restoreRE, restore) : path;
    return c + 'scope.' + path;
  }
}

/**
 * Restore replacer
 *
 * @param {String} str
 * @param {String} i - matched save index
 * @return {String}
 */

function restore(str, i) {
  return saved[i];
}

/**
 * Rewrite an expression, prefixing all path accessors with
 * `scope.` and generate getter/setter functions.
 *
 * @param {String} exp
 * @return {Function}
 */

function compileGetter(exp) {
  if (improperKeywordsRE.test(exp)) {
    process.env.NODE_ENV !== 'production' && warn('Avoid using reserved keywords in expression: ' + exp);
  }
  // reset state
  saved.length = 0;
  // save strings and object literal keys
  var body = exp.replace(saveRE, save).replace(wsRE, '');
  // rewrite all paths
  // pad 1 space here becaue the regex matches 1 extra char
  body = (' ' + body).replace(identRE, rewrite).replace(restoreRE, restore);
  return makeGetterFn(body);
}

/**
 * Build a getter function. Requires eval.
 *
 * We isolate the try/catch so it doesn't affect the
 * optimization of the parse function when it is not called.
 *
 * @param {String} body
 * @return {Function|undefined}
 */

function makeGetterFn(body) {
  try {
    /* eslint-disable no-new-func */
    return new Function('scope', 'return ' + body + ';');
    /* eslint-enable no-new-func */
  } catch (e) {
    process.env.NODE_ENV !== 'production' && warn('Invalid expression. ' + 'Generated function body: ' + body);
  }
}

/**
 * Compile a setter function for the expression.
 *
 * @param {String} exp
 * @return {Function|undefined}
 */

function compileSetter(exp) {
  var path = parsePath(exp);
  if (path) {
    return function (scope, val) {
      setPath(scope, path, val);
    };
  } else {
    process.env.NODE_ENV !== 'production' && warn('Invalid setter expression: ' + exp);
  }
}

/**
 * Parse an expression into re-written getter/setters.
 *
 * @param {String} exp
 * @param {Boolean} needSet
 * @return {Function}
 */

function parseExpression(exp, needSet) {
  exp = exp.trim();
  // try cache
  var hit = expressionCache.get(exp);
  if (hit) {
    if (needSet && !hit.set) {
      hit.set = compileSetter(hit.exp);
    }
    return hit;
  }
  var res = { exp: exp };
  res.get = isSimplePath(exp) && exp.indexOf('[') < 0
  // optimized super simple getter
  ? makeGetterFn('scope.' + exp)
  // dynamic getter
  : compileGetter(exp);
  if (needSet) {
    res.set = compileSetter(exp);
  }
  expressionCache.put(exp, res);
  return res;
}

/**
 * Check if an expression is a simple path.
 *
 * @param {String} exp
 * @return {Boolean}
 */

function isSimplePath(exp) {
  return pathTestRE.test(exp) &&
  // don't treat true/false as paths
  !booleanLiteralRE.test(exp) &&
  // Math constants e.g. Math.PI, Math.E etc.
  exp.slice(0, 5) !== 'Math.';
}

var expression = Object.freeze({
  parseExpression: parseExpression,
  isSimplePath: isSimplePath
});

// we have two separate queues: one for directive updates
// and one for user watcher registered via $watch().
// we want to guarantee directive updates to be called
// before user watchers so that when user watchers are
// triggered, the DOM would have already been in updated
// state.
var queue = [];
var userQueue = [];
var has = {};
var circular = {};
var waiting = false;
var internalQueueDepleted = false;

/**
 * Reset the batcher's state.
 */

function resetBatcherState() {
  queue = [];
  userQueue = [];
  has = {};
  circular = {};
  waiting = internalQueueDepleted = false;
}

/**
 * Flush both queues and run the watchers.
 */

function flushBatcherQueue() {
  runBatcherQueue(queue);
  internalQueueDepleted = true;
  runBatcherQueue(userQueue);
  // dev tool hook
  /* istanbul ignore if */
  if (devtools) {
    devtools.emit('flush');
  }
  resetBatcherState();
}

/**
 * Run the watchers in a single queue.
 *
 * @param {Array} queue
 */

function runBatcherQueue(queue) {
  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (var i = 0; i < queue.length; i++) {
    var watcher = queue[i];
    var id = watcher.id;
    has[id] = null;
    watcher.run();
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1;
      if (circular[id] > config._maxUpdateCount) {
        queue.splice(has[id], 1);
        warn('You may have an infinite update loop for watcher ' + 'with expression: ' + watcher.expression);
      }
    }
  }
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 *
 * @param {Watcher} watcher
 *   properties:
 *   - {Number} id
 *   - {Function} run
 */

function pushWatcher(watcher) {
  var id = watcher.id;
  if (has[id] == null) {
    // if an internal watcher is pushed, but the internal
    // queue is already depleted, we run it immediately.
    if (internalQueueDepleted && !watcher.user) {
      watcher.run();
      return;
    }
    // push watcher into appropriate queue
    var q = watcher.user ? userQueue : queue;
    has[id] = q.length;
    q.push(watcher);
    // queue the flush
    if (!waiting) {
      waiting = true;
      nextTick(flushBatcherQueue);
    }
  }
}

var uid$2 = 0;

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 *
 * @param {Vue} vm
 * @param {String} expression
 * @param {Function} cb
 * @param {Object} options
 *                 - {Array} filters
 *                 - {Boolean} twoWay
 *                 - {Boolean} deep
 *                 - {Boolean} user
 *                 - {Boolean} sync
 *                 - {Boolean} lazy
 *                 - {Function} [preProcess]
 *                 - {Function} [postProcess]
 * @constructor
 */
function Watcher(vm, expOrFn, cb, options) {
  // mix in options
  if (options) {
    extend(this, options);
  }
  var isFn = typeof expOrFn === 'function';
  this.vm = vm;
  vm._watchers.push(this);
  this.expression = isFn ? expOrFn.toString() : expOrFn;
  this.cb = cb;
  this.id = ++uid$2; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers
  this.deps = Object.create(null);
  this.newDeps = null;
  this.prevError = null; // for async error stacks
  // parse expression for getter/setter
  if (isFn) {
    this.getter = expOrFn;
    this.setter = undefined;
  } else {
    var res = parseExpression(expOrFn, this.twoWay);
    this.getter = res.get;
    this.setter = res.set;
  }
  this.value = this.lazy ? undefined : this.get();
  // state for avoiding false triggers for deep and Array
  // watchers during vm._digest()
  this.queued = this.shallow = false;
}

/**
 * Add a dependency to this directive.
 *
 * @param {Dep} dep
 */

Watcher.prototype.addDep = function (dep) {
  var id = dep.id;
  if (!this.newDeps[id]) {
    this.newDeps[id] = dep;
    if (!this.deps[id]) {
      this.deps[id] = dep;
      dep.addSub(this);
    }
  }
};

/**
 * Evaluate the getter, and re-collect dependencies.
 */

Watcher.prototype.get = function () {
  this.beforeGet();
  var scope = this.scope || this.vm;
  var value;
  try {
    value = this.getter.call(scope, scope);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && config.warnExpressionErrors) {
      warn('Error when evaluating expression "' + this.expression + '". ' + (config.debug ? '' : 'Turn on debug mode to see stack trace.'), e);
    }
  }
  // "touch" every property so they are all tracked as
  // dependencies for deep watching
  if (this.deep) {
    traverse(value);
  }
  if (this.preProcess) {
    value = this.preProcess(value);
  }
  if (this.filters) {
    value = scope._applyFilters(value, null, this.filters, false);
  }
  if (this.postProcess) {
    value = this.postProcess(value);
  }
  this.afterGet();
  return value;
};

/**
 * Set the corresponding value with the setter.
 *
 * @param {*} value
 */

Watcher.prototype.set = function (value) {
  var scope = this.scope || this.vm;
  if (this.filters) {
    value = scope._applyFilters(value, this.value, this.filters, true);
  }
  try {
    this.setter.call(scope, scope, value);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && config.warnExpressionErrors) {
      warn('Error when evaluating setter "' + this.expression + '"', e);
    }
  }
  // two-way sync for v-for alias
  var forContext = scope.$forContext;
  if (forContext && forContext.alias === this.expression) {
    if (forContext.filters) {
      process.env.NODE_ENV !== 'production' && warn('It seems you are using two-way binding on ' + 'a v-for alias (' + this.expression + '), and the ' + 'v-for has filters. This will not work properly. ' + 'Either remove the filters or use an array of ' + 'objects and bind to object properties instead.');
      return;
    }
    forContext._withLock(function () {
      if (scope.$key) {
        // original is an object
        forContext.rawValue[scope.$key] = value;
      } else {
        forContext.rawValue.$set(scope.$index, value);
      }
    });
  }
};

/**
 * Prepare for dependency collection.
 */

Watcher.prototype.beforeGet = function () {
  Dep.target = this;
  this.newDeps = Object.create(null);
};

/**
 * Clean up for dependency collection.
 */

Watcher.prototype.afterGet = function () {
  Dep.target = null;
  var ids = Object.keys(this.deps);
  var i = ids.length;
  while (i--) {
    var id = ids[i];
    if (!this.newDeps[id]) {
      this.deps[id].removeSub(this);
    }
  }
  this.deps = this.newDeps;
};

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 *
 * @param {Boolean} shallow
 */

Watcher.prototype.update = function (shallow) {
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync || !config.async) {
    this.run();
  } else {
    // if queued, only overwrite shallow with non-shallow,
    // but not the other way around.
    this.shallow = this.queued ? shallow ? this.shallow : false : !!shallow;
    this.queued = true;
    // record before-push error stack in debug mode
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.debug) {
      this.prevError = new Error('[vue] async stack trace');
    }
    pushWatcher(this);
  }
};

/**
 * Batcher job interface.
 * Will be called by the batcher.
 */

Watcher.prototype.run = function () {
  if (this.active) {
    var value = this.get();
    if (value !== this.value ||
    // Deep watchers and watchers on Object/Arrays should fire even
    // when the value is the same, because the value may
    // have mutated; but only do so if this is a
    // non-shallow update (caused by a vm digest).
    (isObject(value) || this.deep) && !this.shallow) {
      // set new value
      var oldValue = this.value;
      this.value = value;
      // in debug + async mode, when a watcher callbacks
      // throws, we also throw the saved before-push error
      // so the full cross-tick stack trace is available.
      var prevError = this.prevError;
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.debug && prevError) {
        this.prevError = null;
        try {
          this.cb.call(this.vm, value, oldValue);
        } catch (e) {
          nextTick(function () {
            throw prevError;
          }, 0);
          throw e;
        }
      } else {
        this.cb.call(this.vm, value, oldValue);
      }
    }
    this.queued = this.shallow = false;
  }
};

/**
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 */

Watcher.prototype.evaluate = function () {
  // avoid overwriting another watcher that is being
  // collected.
  var current = Dep.target;
  this.value = this.get();
  this.dirty = false;
  Dep.target = current;
};

/**
 * Depend on all deps collected by this watcher.
 */

Watcher.prototype.depend = function () {
  var depIds = Object.keys(this.deps);
  var i = depIds.length;
  while (i--) {
    this.deps[depIds[i]].depend();
  }
};

/**
 * Remove self from all dependencies' subcriber list.
 */

Watcher.prototype.teardown = function () {
  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed or is performing a v-for
    // re-render (the watcher list is then filtered by v-for).
    if (!this.vm._isBeingDestroyed && !this.vm._vForRemoving) {
      this.vm._watchers.$remove(this);
    }
    var depIds = Object.keys(this.deps);
    var i = depIds.length;
    while (i--) {
      this.deps[depIds[i]].removeSub(this);
    }
    this.active = false;
    this.vm = this.cb = this.value = null;
  }
};

/**
 * Recrusively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 *
 * @param {*} val
 */

function traverse(val) {
  var i, keys;
  if (isArray(val)) {
    i = val.length;
    while (i--) traverse(val[i]);
  } else if (isObject(val)) {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) traverse(val[keys[i]]);
  }
}

var text$1 = {

  bind: function bind() {
    this.attr = this.el.nodeType === 3 ? 'data' : 'textContent';
  },

  update: function update(value) {
    this.el[this.attr] = _toString(value);
  }
};

var templateCache = new Cache(1000);
var idSelectorCache = new Cache(1000);

var map = {
  efault: [0, '', ''],
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>']
};

map.td = map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option = map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead = map.tbody = map.colgroup = map.caption = map.tfoot = [1, '<table>', '</table>'];

map.g = map.defs = map.symbol = map.use = map.image = map.text = map.circle = map.ellipse = map.line = map.path = map.polygon = map.polyline = map.rect = [1, '<svg ' + 'xmlns="http://www.w3.org/2000/svg" ' + 'xmlns:xlink="http://www.w3.org/1999/xlink" ' + 'xmlns:ev="http://www.w3.org/2001/xml-events"' + 'version="1.1">', '</svg>'];

/**
 * Check if a node is a supported template node with a
 * DocumentFragment content.
 *
 * @param {Node} node
 * @return {Boolean}
 */

function isRealTemplate(node) {
  return isTemplate(node) && isFragment(node.content);
}

var tagRE$1 = /<([\w:]+)/;
var entityRE = /&#?\w+?;/;

/**
 * Convert a string template to a DocumentFragment.
 * Determines correct wrapping by tag types. Wrapping
 * strategy found in jQuery & component/domify.
 *
 * @param {String} templateString
 * @param {Boolean} raw
 * @return {DocumentFragment}
 */

function stringToFragment(templateString, raw) {
  // try a cache hit first
  var cacheKey = raw ? templateString : templateString.trim();
  var hit = templateCache.get(cacheKey);
  if (hit) {
    return hit;
  }

  var frag = document.createDocumentFragment();
  var tagMatch = templateString.match(tagRE$1);
  var entityMatch = entityRE.test(templateString);

  if (!tagMatch && !entityMatch) {
    // text only, return a single text node.
    frag.appendChild(document.createTextNode(templateString));
  } else {
    var tag = tagMatch && tagMatch[1];
    var wrap = map[tag] || map.efault;
    var depth = wrap[0];
    var prefix = wrap[1];
    var suffix = wrap[2];
    var node = document.createElement('div');

    node.innerHTML = prefix + templateString + suffix;
    while (depth--) {
      node = node.lastChild;
    }

    var child;
    /* eslint-disable no-cond-assign */
    while (child = node.firstChild) {
      /* eslint-enable no-cond-assign */
      frag.appendChild(child);
    }
  }
  if (!raw) {
    trimNode(frag);
  }
  templateCache.put(cacheKey, frag);
  return frag;
}

/**
 * Convert a template node to a DocumentFragment.
 *
 * @param {Node} node
 * @return {DocumentFragment}
 */

function nodeToFragment(node) {
  // if its a template tag and the browser supports it,
  // its content is already a document fragment.
  if (isRealTemplate(node)) {
    trimNode(node.content);
    return node.content;
  }
  // script template
  if (node.tagName === 'SCRIPT') {
    return stringToFragment(node.textContent);
  }
  // normal node, clone it to avoid mutating the original
  var clonedNode = cloneNode(node);
  var frag = document.createDocumentFragment();
  var child;
  /* eslint-disable no-cond-assign */
  while (child = clonedNode.firstChild) {
    /* eslint-enable no-cond-assign */
    frag.appendChild(child);
  }
  trimNode(frag);
  return frag;
}

// Test for the presence of the Safari template cloning bug
// https://bugs.webkit.org/showug.cgi?id=137755
var hasBrokenTemplate = (function () {
  /* istanbul ignore else */
  if (inBrowser) {
    var a = document.createElement('div');
    a.innerHTML = '<template>1</template>';
    return !a.cloneNode(true).firstChild.innerHTML;
  } else {
    return false;
  }
})();

// Test for IE10/11 textarea placeholder clone bug
var hasTextareaCloneBug = (function () {
  /* istanbul ignore else */
  if (inBrowser) {
    var t = document.createElement('textarea');
    t.placeholder = 't';
    return t.cloneNode(true).value === 't';
  } else {
    return false;
  }
})();

/**
 * 1. Deal with Safari cloning nested <template> bug by
 *    manually cloning all template instances.
 * 2. Deal with IE10/11 textarea placeholder bug by setting
 *    the correct value after cloning.
 *
 * @param {Element|DocumentFragment} node
 * @return {Element|DocumentFragment}
 */

function cloneNode(node) {
  if (!node.querySelectorAll) {
    return node.cloneNode();
  }
  var res = node.cloneNode(true);
  var i, original, cloned;
  /* istanbul ignore if */
  if (hasBrokenTemplate) {
    var tempClone = res;
    if (isRealTemplate(node)) {
      node = node.content;
      tempClone = res.content;
    }
    original = node.querySelectorAll('template');
    if (original.length) {
      cloned = tempClone.querySelectorAll('template');
      i = cloned.length;
      while (i--) {
        cloned[i].parentNode.replaceChild(cloneNode(original[i]), cloned[i]);
      }
    }
  }
  /* istanbul ignore if */
  if (hasTextareaCloneBug) {
    if (node.tagName === 'TEXTAREA') {
      res.value = node.value;
    } else {
      original = node.querySelectorAll('textarea');
      if (original.length) {
        cloned = res.querySelectorAll('textarea');
        i = cloned.length;
        while (i--) {
          cloned[i].value = original[i].value;
        }
      }
    }
  }
  return res;
}

/**
 * Process the template option and normalizes it into a
 * a DocumentFragment that can be used as a partial or a
 * instance template.
 *
 * @param {*} template
 *        Possible values include:
 *        - DocumentFragment object
 *        - Node object of type Template
 *        - id selector: '#some-template-id'
 *        - template string: '<div><span>{{msg}}</span></div>'
 * @param {Boolean} shouldClone
 * @param {Boolean} raw
 *        inline HTML interpolation. Do not check for id
 *        selector and keep whitespace in the string.
 * @return {DocumentFragment|undefined}
 */

function parseTemplate(template, shouldClone, raw) {
  var node, frag;

  // if the template is already a document fragment,
  // do nothing
  if (isFragment(template)) {
    trimNode(template);
    return shouldClone ? cloneNode(template) : template;
  }

  if (typeof template === 'string') {
    // id selector
    if (!raw && template.charAt(0) === '#') {
      // id selector can be cached too
      frag = idSelectorCache.get(template);
      if (!frag) {
        node = document.getElementById(template.slice(1));
        if (node) {
          frag = nodeToFragment(node);
          // save selector to cache
          idSelectorCache.put(template, frag);
        }
      }
    } else {
      // normal string template
      frag = stringToFragment(template, raw);
    }
  } else if (template.nodeType) {
    // a direct node
    frag = nodeToFragment(template);
  }

  return frag && shouldClone ? cloneNode(frag) : frag;
}

var template = Object.freeze({
  cloneNode: cloneNode,
  parseTemplate: parseTemplate
});

var html = {

  bind: function bind() {
    // a comment node means this is a binding for
    // {{{ inline unescaped html }}}
    if (this.el.nodeType === 8) {
      // hold nodes
      this.nodes = [];
      // replace the placeholder with proper anchor
      this.anchor = createAnchor('v-html');
      replace(this.el, this.anchor);
    }
  },

  update: function update(value) {
    value = _toString(value);
    if (this.nodes) {
      this.swap(value);
    } else {
      this.el.innerHTML = value;
    }
  },

  swap: function swap(value) {
    // remove old nodes
    var i = this.nodes.length;
    while (i--) {
      remove(this.nodes[i]);
    }
    // convert new value to a fragment
    // do not attempt to retrieve from id selector
    var frag = parseTemplate(value, true, true);
    // save a reference to these nodes so we can remove later
    this.nodes = toArray(frag.childNodes);
    before(frag, this.anchor);
  }
};

/**
 * Abstraction for a partially-compiled fragment.
 * Can optionally compile content with a child scope.
 *
 * @param {Function} linker
 * @param {Vue} vm
 * @param {DocumentFragment} frag
 * @param {Vue} [host]
 * @param {Object} [scope]
 */
function Fragment(linker, vm, frag, host, scope, parentFrag) {
  this.children = [];
  this.childFrags = [];
  this.vm = vm;
  this.scope = scope;
  this.inserted = false;
  this.parentFrag = parentFrag;
  if (parentFrag) {
    parentFrag.childFrags.push(this);
  }
  this.unlink = linker(vm, frag, host, scope, this);
  var single = this.single = frag.childNodes.length === 1 &&
  // do not go single mode if the only node is an anchor
  !frag.childNodes[0].__v_anchor;
  if (single) {
    this.node = frag.childNodes[0];
    this.before = singleBefore;
    this.remove = singleRemove;
  } else {
    this.node = createAnchor('fragment-start');
    this.end = createAnchor('fragment-end');
    this.frag = frag;
    prepend(this.node, frag);
    frag.appendChild(this.end);
    this.before = multiBefore;
    this.remove = multiRemove;
  }
  this.node.__v_frag = this;
}

/**
 * Call attach/detach for all components contained within
 * this fragment. Also do so recursively for all child
 * fragments.
 *
 * @param {Function} hook
 */

Fragment.prototype.callHook = function (hook) {
  var i, l;
  for (i = 0, l = this.childFrags.length; i < l; i++) {
    this.childFrags[i].callHook(hook);
  }
  for (i = 0, l = this.children.length; i < l; i++) {
    hook(this.children[i]);
  }
};

/**
 * Insert fragment before target, single node version
 *
 * @param {Node} target
 * @param {Boolean} withTransition
 */

function singleBefore(target, withTransition) {
  this.inserted = true;
  var method = withTransition !== false ? beforeWithTransition : before;
  method(this.node, target, this.vm);
  if (inDoc(this.node)) {
    this.callHook(attach);
  }
}

/**
 * Remove fragment, single node version
 */

function singleRemove() {
  this.inserted = false;
  var shouldCallRemove = inDoc(this.node);
  var self = this;
  this.beforeRemove();
  removeWithTransition(this.node, this.vm, function () {
    if (shouldCallRemove) {
      self.callHook(detach);
    }
    self.destroy();
  });
}

/**
 * Insert fragment before target, multi-nodes version
 *
 * @param {Node} target
 * @param {Boolean} withTransition
 */

function multiBefore(target, withTransition) {
  this.inserted = true;
  var vm = this.vm;
  var method = withTransition !== false ? beforeWithTransition : before;
  mapNodeRange(this.node, this.end, function (node) {
    method(node, target, vm);
  });
  if (inDoc(this.node)) {
    this.callHook(attach);
  }
}

/**
 * Remove fragment, multi-nodes version
 */

function multiRemove() {
  this.inserted = false;
  var self = this;
  var shouldCallRemove = inDoc(this.node);
  this.beforeRemove();
  removeNodeRange(this.node, this.end, this.vm, this.frag, function () {
    if (shouldCallRemove) {
      self.callHook(detach);
    }
    self.destroy();
  });
}

/**
 * Prepare the fragment for removal.
 */

Fragment.prototype.beforeRemove = function () {
  var i, l;
  for (i = 0, l = this.childFrags.length; i < l; i++) {
    // call the same method recursively on child
    // fragments, depth-first
    this.childFrags[i].beforeRemove(false);
  }
  for (i = 0, l = this.children.length; i < l; i++) {
    // Call destroy for all contained instances,
    // with remove:false and defer:true.
    // Defer is necessary because we need to
    // keep the children to call detach hooks
    // on them.
    this.children[i].$destroy(false, true);
  }
  var dirs = this.unlink.dirs;
  for (i = 0, l = dirs.length; i < l; i++) {
    // disable the watchers on all the directives
    // so that the rendered content stays the same
    // during removal.
    dirs[i]._watcher && dirs[i]._watcher.teardown();
  }
};

/**
 * Destroy the fragment.
 */

Fragment.prototype.destroy = function () {
  if (this.parentFrag) {
    this.parentFrag.childFrags.$remove(this);
  }
  this.node.__v_frag = null;
  this.unlink();
};

/**
 * Call attach hook for a Vue instance.
 *
 * @param {Vue} child
 */

function attach(child) {
  if (!child._isAttached) {
    child._callHook('attached');
  }
}

/**
 * Call detach hook for a Vue instance.
 *
 * @param {Vue} child
 */

function detach(child) {
  if (child._isAttached) {
    child._callHook('detached');
  }
}

var linkerCache = new Cache(5000);

/**
 * A factory that can be used to create instances of a
 * fragment. Caches the compiled linker if possible.
 *
 * @param {Vue} vm
 * @param {Element|String} el
 */
function FragmentFactory(vm, el) {
  this.vm = vm;
  var template;
  var isString = typeof el === 'string';
  if (isString || isTemplate(el)) {
    template = parseTemplate(el, true);
  } else {
    template = document.createDocumentFragment();
    template.appendChild(el);
  }
  this.template = template;
  // linker can be cached, but only for components
  var linker;
  var cid = vm.constructor.cid;
  if (cid > 0) {
    var cacheId = cid + (isString ? el : getOuterHTML(el));
    linker = linkerCache.get(cacheId);
    if (!linker) {
      linker = compile(template, vm.$options, true);
      linkerCache.put(cacheId, linker);
    }
  } else {
    linker = compile(template, vm.$options, true);
  }
  this.linker = linker;
}

/**
 * Create a fragment instance with given host and scope.
 *
 * @param {Vue} host
 * @param {Object} scope
 * @param {Fragment} parentFrag
 */

FragmentFactory.prototype.create = function (host, scope, parentFrag) {
  var frag = cloneNode(this.template);
  return new Fragment(this.linker, this.vm, frag, host, scope, parentFrag);
};

var ON = 700;
var MODEL = 800;
var BIND = 850;
var TRANSITION = 1100;
var EL = 1500;
var COMPONENT = 1500;
var PARTIAL = 1750;
var FOR = 2000;
var IF = 2000;
var SLOT = 2100;

var uid$3 = 0;

var vFor = {

  priority: FOR,

  params: ['track-by', 'stagger', 'enter-stagger', 'leave-stagger'],

  bind: function bind() {
    // support "item in/of items" syntax
    var inMatch = this.expression.match(/(.*) (?:in|of) (.*)/);
    if (inMatch) {
      var itMatch = inMatch[1].match(/\((.*),(.*)\)/);
      if (itMatch) {
        this.iterator = itMatch[1].trim();
        this.alias = itMatch[2].trim();
      } else {
        this.alias = inMatch[1].trim();
      }
      this.expression = inMatch[2];
    }

    if (!this.alias) {
      process.env.NODE_ENV !== 'production' && warn('Alias is required in v-for.');
      return;
    }

    // uid as a cache identifier
    this.id = '__v-for__' + ++uid$3;

    // check if this is an option list,
    // so that we know if we need to update the <select>'s
    // v-model when the option list has changed.
    // because v-model has a lower priority than v-for,
    // the v-model is not bound here yet, so we have to
    // retrive it in the actual updateModel() function.
    var tag = this.el.tagName;
    this.isOption = (tag === 'OPTION' || tag === 'OPTGROUP') && this.el.parentNode.tagName === 'SELECT';

    // setup anchor nodes
    this.start = createAnchor('v-for-start');
    this.end = createAnchor('v-for-end');
    replace(this.el, this.end);
    before(this.start, this.end);

    // cache
    this.cache = Object.create(null);

    // fragment factory
    this.factory = new FragmentFactory(this.vm, this.el);
  },

  update: function update(data) {
    this.diff(data);
    this.updateRef();
    this.updateModel();
  },

  /**
   * Diff, based on new data and old data, determine the
   * minimum amount of DOM manipulations needed to make the
   * DOM reflect the new data Array.
   *
   * The algorithm diffs the new data Array by storing a
   * hidden reference to an owner vm instance on previously
   * seen data. This allows us to achieve O(n) which is
   * better than a levenshtein distance based algorithm,
   * which is O(m * n).
   *
   * @param {Array} data
   */

  diff: function diff(data) {
    // check if the Array was converted from an Object
    var item = data[0];
    var convertedFromObject = this.fromObject = isObject(item) && hasOwn(item, '$key') && hasOwn(item, '$value');

    var trackByKey = this.params.trackBy;
    var oldFrags = this.frags;
    var frags = this.frags = new Array(data.length);
    var alias = this.alias;
    var iterator = this.iterator;
    var start = this.start;
    var end = this.end;
    var inDocument = inDoc(start);
    var init = !oldFrags;
    var i, l, frag, key, value, primitive;

    // First pass, go through the new Array and fill up
    // the new frags array. If a piece of data has a cached
    // instance for it, we reuse it. Otherwise build a new
    // instance.
    for (i = 0, l = data.length; i < l; i++) {
      item = data[i];
      key = convertedFromObject ? item.$key : null;
      value = convertedFromObject ? item.$value : item;
      primitive = !isObject(value);
      frag = !init && this.getCachedFrag(value, i, key);
      if (frag) {
        // reusable fragment
        frag.reused = true;
        // update $index
        frag.scope.$index = i;
        // update $key
        if (key) {
          frag.scope.$key = key;
        }
        // update iterator
        if (iterator) {
          frag.scope[iterator] = key !== null ? key : i;
        }
        // update data for track-by, object repeat &
        // primitive values.
        if (trackByKey || convertedFromObject || primitive) {
          frag.scope[alias] = value;
        }
      } else {
        // new isntance
        frag = this.create(value, alias, i, key);
        frag.fresh = !init;
      }
      frags[i] = frag;
      if (init) {
        frag.before(end);
      }
    }

    // we're done for the initial render.
    if (init) {
      return;
    }

    // Second pass, go through the old fragments and
    // destroy those who are not reused (and remove them
    // from cache)
    var removalIndex = 0;
    var totalRemoved = oldFrags.length - frags.length;
    // when removing a large number of fragments, watcher removal
    // turns out to be a perf bottleneck, so we batch the watcher
    // removals into a single filter call!
    this.vm._vForRemoving = true;
    for (i = 0, l = oldFrags.length; i < l; i++) {
      frag = oldFrags[i];
      if (!frag.reused) {
        this.deleteCachedFrag(frag);
        this.remove(frag, removalIndex++, totalRemoved, inDocument);
      }
    }
    this.vm._vForRemoving = false;
    if (removalIndex) {
      this.vm._watchers = this.vm._watchers.filter(function (w) {
        return w.active;
      });
    }

    // Final pass, move/insert new fragments into the
    // right place.
    var targetPrev, prevEl, currentPrev;
    var insertionIndex = 0;
    for (i = 0, l = frags.length; i < l; i++) {
      frag = frags[i];
      // this is the frag that we should be after
      targetPrev = frags[i - 1];
      prevEl = targetPrev ? targetPrev.staggerCb ? targetPrev.staggerAnchor : targetPrev.end || targetPrev.node : start;
      if (frag.reused && !frag.staggerCb) {
        currentPrev = findPrevFrag(frag, start, this.id);
        if (currentPrev !== targetPrev && (!currentPrev ||
        // optimization for moving a single item.
        // thanks to suggestions by @livoras in #1807
        findPrevFrag(currentPrev, start, this.id) !== targetPrev)) {
          this.move(frag, prevEl);
        }
      } else {
        // new instance, or still in stagger.
        // insert with updated stagger index.
        this.insert(frag, insertionIndex++, prevEl, inDocument);
      }
      frag.reused = frag.fresh = false;
    }
  },

  /**
   * Create a new fragment instance.
   *
   * @param {*} value
   * @param {String} alias
   * @param {Number} index
   * @param {String} [key]
   * @return {Fragment}
   */

  create: function create(value, alias, index, key) {
    var host = this._host;
    // create iteration scope
    var parentScope = this._scope || this.vm;
    var scope = Object.create(parentScope);
    // ref holder for the scope
    scope.$refs = Object.create(parentScope.$refs);
    scope.$els = Object.create(parentScope.$els);
    // make sure point $parent to parent scope
    scope.$parent = parentScope;
    // for two-way binding on alias
    scope.$forContext = this;
    // define scope properties
    defineReactive(scope, alias, value);
    defineReactive(scope, '$index', index);
    if (key) {
      defineReactive(scope, '$key', key);
    } else if (scope.$key) {
      // avoid accidental fallback
      def(scope, '$key', null);
    }
    if (this.iterator) {
      defineReactive(scope, this.iterator, key !== null ? key : index);
    }
    var frag = this.factory.create(host, scope, this._frag);
    frag.forId = this.id;
    this.cacheFrag(value, frag, index, key);
    return frag;
  },

  /**
   * Update the v-ref on owner vm.
   */

  updateRef: function updateRef() {
    var ref = this.descriptor.ref;
    if (!ref) return;
    var hash = (this._scope || this.vm).$refs;
    var refs;
    if (!this.fromObject) {
      refs = this.frags.map(findVmFromFrag);
    } else {
      refs = {};
      this.frags.forEach(function (frag) {
        refs[frag.scope.$key] = findVmFromFrag(frag);
      });
    }
    hash[ref] = refs;
  },

  /**
   * For option lists, update the containing v-model on
   * parent <select>.
   */

  updateModel: function updateModel() {
    if (this.isOption) {
      var parent = this.start.parentNode;
      var model = parent && parent.__v_model;
      if (model) {
        model.forceUpdate();
      }
    }
  },

  /**
   * Insert a fragment. Handles staggering.
   *
   * @param {Fragment} frag
   * @param {Number} index
   * @param {Node} prevEl
   * @param {Boolean} inDocument
   */

  insert: function insert(frag, index, prevEl, inDocument) {
    if (frag.staggerCb) {
      frag.staggerCb.cancel();
      frag.staggerCb = null;
    }
    var staggerAmount = this.getStagger(frag, index, null, 'enter');
    if (inDocument && staggerAmount) {
      // create an anchor and insert it synchronously,
      // so that we can resolve the correct order without
      // worrying about some elements not inserted yet
      var anchor = frag.staggerAnchor;
      if (!anchor) {
        anchor = frag.staggerAnchor = createAnchor('stagger-anchor');
        anchor.__v_frag = frag;
      }
      after(anchor, prevEl);
      var op = frag.staggerCb = cancellable(function () {
        frag.staggerCb = null;
        frag.before(anchor);
        remove(anchor);
      });
      setTimeout(op, staggerAmount);
    } else {
      frag.before(prevEl.nextSibling);
    }
  },

  /**
   * Remove a fragment. Handles staggering.
   *
   * @param {Fragment} frag
   * @param {Number} index
   * @param {Number} total
   * @param {Boolean} inDocument
   */

  remove: function remove(frag, index, total, inDocument) {
    if (frag.staggerCb) {
      frag.staggerCb.cancel();
      frag.staggerCb = null;
      // it's not possible for the same frag to be removed
      // twice, so if we have a pending stagger callback,
      // it means this frag is queued for enter but removed
      // before its transition started. Since it is already
      // destroyed, we can just leave it in detached state.
      return;
    }
    var staggerAmount = this.getStagger(frag, index, total, 'leave');
    if (inDocument && staggerAmount) {
      var op = frag.staggerCb = cancellable(function () {
        frag.staggerCb = null;
        frag.remove();
      });
      setTimeout(op, staggerAmount);
    } else {
      frag.remove();
    }
  },

  /**
   * Move a fragment to a new position.
   * Force no transition.
   *
   * @param {Fragment} frag
   * @param {Node} prevEl
   */

  move: function move(frag, prevEl) {
    // fix a common issue with Sortable:
    // if prevEl doesn't have nextSibling, this means it's
    // been dragged after the end anchor. Just re-position
    // the end anchor to the end of the container.
    /* istanbul ignore if */
    if (!prevEl.nextSibling) {
      this.end.parentNode.appendChild(this.end);
    }
    frag.before(prevEl.nextSibling, false);
  },

  /**
   * Cache a fragment using track-by or the object key.
   *
   * @param {*} value
   * @param {Fragment} frag
   * @param {Number} index
   * @param {String} [key]
   */

  cacheFrag: function cacheFrag(value, frag, index, key) {
    var trackByKey = this.params.trackBy;
    var cache = this.cache;
    var primitive = !isObject(value);
    var id;
    if (key || trackByKey || primitive) {
      id = trackByKey ? trackByKey === '$index' ? index : value[trackByKey] : key || value;
      if (!cache[id]) {
        cache[id] = frag;
      } else if (trackByKey !== '$index') {
        process.env.NODE_ENV !== 'production' && this.warnDuplicate(value);
      }
    } else {
      id = this.id;
      if (hasOwn(value, id)) {
        if (value[id] === null) {
          value[id] = frag;
        } else {
          process.env.NODE_ENV !== 'production' && this.warnDuplicate(value);
        }
      } else {
        def(value, id, frag);
      }
    }
    frag.raw = value;
  },

  /**
   * Get a cached fragment from the value/index/key
   *
   * @param {*} value
   * @param {Number} index
   * @param {String} key
   * @return {Fragment}
   */

  getCachedFrag: function getCachedFrag(value, index, key) {
    var trackByKey = this.params.trackBy;
    var primitive = !isObject(value);
    var frag;
    if (key || trackByKey || primitive) {
      var id = trackByKey ? trackByKey === '$index' ? index : value[trackByKey] : key || value;
      frag = this.cache[id];
    } else {
      frag = value[this.id];
    }
    if (frag && (frag.reused || frag.fresh)) {
      process.env.NODE_ENV !== 'production' && this.warnDuplicate(value);
    }
    return frag;
  },

  /**
   * Delete a fragment from cache.
   *
   * @param {Fragment} frag
   */

  deleteCachedFrag: function deleteCachedFrag(frag) {
    var value = frag.raw;
    var trackByKey = this.params.trackBy;
    var scope = frag.scope;
    var index = scope.$index;
    // fix #948: avoid accidentally fall through to
    // a parent repeater which happens to have $key.
    var key = hasOwn(scope, '$key') && scope.$key;
    var primitive = !isObject(value);
    if (trackByKey || key || primitive) {
      var id = trackByKey ? trackByKey === '$index' ? index : value[trackByKey] : key || value;
      this.cache[id] = null;
    } else {
      value[this.id] = null;
      frag.raw = null;
    }
  },

  /**
   * Get the stagger amount for an insertion/removal.
   *
   * @param {Fragment} frag
   * @param {Number} index
   * @param {Number} total
   * @param {String} type
   */

  getStagger: function getStagger(frag, index, total, type) {
    type = type + 'Stagger';
    var trans = frag.node.__v_trans;
    var hooks = trans && trans.hooks;
    var hook = hooks && (hooks[type] || hooks.stagger);
    return hook ? hook.call(frag, index, total) : index * parseInt(this.params[type] || this.params.stagger, 10);
  },

  /**
   * Pre-process the value before piping it through the
   * filters. This is passed to and called by the watcher.
   */

  _preProcess: function _preProcess(value) {
    // regardless of type, store the un-filtered raw value.
    this.rawValue = value;
    return value;
  },

  /**
   * Post-process the value after it has been piped through
   * the filters. This is passed to and called by the watcher.
   *
   * It is necessary for this to be called during the
   * wathcer's dependency collection phase because we want
   * the v-for to update when the source Object is mutated.
   */

  _postProcess: function _postProcess(value) {
    if (isArray(value)) {
      return value;
    } else if (isPlainObject(value)) {
      // convert plain object to array.
      var keys = Object.keys(value);
      var i = keys.length;
      var res = new Array(i);
      var key;
      while (i--) {
        key = keys[i];
        res[i] = {
          $key: key,
          $value: value[key]
        };
      }
      return res;
    } else {
      if (typeof value === 'number' && !isNaN(value)) {
        value = range(value);
      }
      return value || [];
    }
  },

  unbind: function unbind() {
    if (this.descriptor.ref) {
      (this._scope || this.vm).$refs[this.descriptor.ref] = null;
    }
    if (this.frags) {
      var i = this.frags.length;
      var frag;
      while (i--) {
        frag = this.frags[i];
        this.deleteCachedFrag(frag);
        frag.destroy();
      }
    }
  }
};

/**
 * Helper to find the previous element that is a fragment
 * anchor. This is necessary because a destroyed frag's
 * element could still be lingering in the DOM before its
 * leaving transition finishes, but its inserted flag
 * should have been set to false so we can skip them.
 *
 * If this is a block repeat, we want to make sure we only
 * return frag that is bound to this v-for. (see #929)
 *
 * @param {Fragment} frag
 * @param {Comment|Text} anchor
 * @param {String} id
 * @return {Fragment}
 */

function findPrevFrag(frag, anchor, id) {
  var el = frag.node.previousSibling;
  /* istanbul ignore if */
  if (!el) return;
  frag = el.__v_frag;
  while ((!frag || frag.forId !== id || !frag.inserted) && el !== anchor) {
    el = el.previousSibling;
    /* istanbul ignore if */
    if (!el) return;
    frag = el.__v_frag;
  }
  return frag;
}

/**
 * Find a vm from a fragment.
 *
 * @param {Fragment} frag
 * @return {Vue|undefined}
 */

function findVmFromFrag(frag) {
  var node = frag.node;
  // handle multi-node frag
  if (frag.end) {
    while (!node.__vue__ && node !== frag.end && node.nextSibling) {
      node = node.nextSibling;
    }
  }
  return node.__vue__;
}

/**
 * Create a range array from given number.
 *
 * @param {Number} n
 * @return {Array}
 */

function range(n) {
  var i = -1;
  var ret = new Array(Math.floor(n));
  while (++i < n) {
    ret[i] = i;
  }
  return ret;
}

if (process.env.NODE_ENV !== 'production') {
  vFor.warnDuplicate = function (value) {
    warn('Duplicate value found in v-for="' + this.descriptor.raw + '": ' + JSON.stringify(value) + '. Use track-by="$index" if ' + 'you are expecting duplicate values.');
  };
}

var vIf = {

  priority: IF,

  bind: function bind() {
    var el = this.el;
    if (!el.__vue__) {
      // check else block
      var next = el.nextElementSibling;
      if (next && getAttr(next, 'v-else') !== null) {
        remove(next);
        this.elseFactory = new FragmentFactory(next._context || this.vm, next);
      }
      // check main block
      this.anchor = createAnchor('v-if');
      replace(el, this.anchor);
      this.factory = new FragmentFactory(this.vm, el);
    } else {
      process.env.NODE_ENV !== 'production' && warn('v-if="' + this.expression + '" cannot be ' + 'used on an instance root element.');
      this.invalid = true;
    }
  },

  update: function update(value) {
    if (this.invalid) return;
    if (value) {
      if (!this.frag) {
        this.insert();
      }
    } else {
      this.remove();
    }
  },

  insert: function insert() {
    if (this.elseFrag) {
      this.elseFrag.remove();
      this.elseFrag = null;
    }
    this.frag = this.factory.create(this._host, this._scope, this._frag);
    this.frag.before(this.anchor);
  },

  remove: function remove() {
    if (this.frag) {
      this.frag.remove();
      this.frag = null;
    }
    if (this.elseFactory && !this.elseFrag) {
      this.elseFrag = this.elseFactory.create(this._host, this._scope, this._frag);
      this.elseFrag.before(this.anchor);
    }
  },

  unbind: function unbind() {
    if (this.frag) {
      this.frag.destroy();
    }
    if (this.elseFrag) {
      this.elseFrag.destroy();
    }
  }
};

var show = {

  bind: function bind() {
    // check else block
    var next = this.el.nextElementSibling;
    if (next && getAttr(next, 'v-else') !== null) {
      this.elseEl = next;
    }
  },

  update: function update(value) {
    this.apply(this.el, value);
    if (this.elseEl) {
      this.apply(this.elseEl, !value);
    }
  },

  apply: function apply(el, value) {
    if (inDoc(el)) {
      applyTransition(el, value ? 1 : -1, toggle, this.vm);
    } else {
      toggle();
    }
    function toggle() {
      el.style.display = value ? '' : 'none';
    }
  }
};

var text$2 = {

  bind: function bind() {
    var self = this;
    var el = this.el;
    var isRange = el.type === 'range';
    var lazy = this.params.lazy;
    var number = this.params.number;
    var debounce = this.params.debounce;

    // handle composition events.
    //   http://blog.evanyou.me/2014/01/03/composition-event/
    // skip this for Android because it handles composition
    // events quite differently. Android doesn't trigger
    // composition events for language input methods e.g.
    // Chinese, but instead triggers them for spelling
    // suggestions... (see Discussion/#162)
    var composing = false;
    if (!isAndroid && !isRange) {
      this.on('compositionstart', function () {
        composing = true;
      });
      this.on('compositionend', function () {
        composing = false;
        // in IE11 the "compositionend" event fires AFTER
        // the "input" event, so the input handler is blocked
        // at the end... have to call it here.
        //
        // #1327: in lazy mode this is unecessary.
        if (!lazy) {
          self.listener();
        }
      });
    }

    // prevent messing with the input when user is typing,
    // and force update on blur.
    this.focused = false;
    if (!isRange && !lazy) {
      this.on('focus', function () {
        self.focused = true;
      });
      this.on('blur', function () {
        self.focused = false;
      });
    }

    // Now attach the main listener
    this.listener = this.rawListener = function () {
      if (composing || !self._bound) {
        return;
      }
      var val = number || isRange ? toNumber(el.value) : el.value;
      self.set(val);
      // force update on next tick to avoid lock & same value
      // also only update when user is not typing
      nextTick(function () {
        if (self._bound && !self.focused) {
          self.update(self._watcher.value);
        }
      });
    };

    // apply debounce
    if (debounce) {
      this.listener = _debounce(this.listener, debounce);
    }

    // Support jQuery events, since jQuery.trigger() doesn't
    // trigger native events in some cases and some plugins
    // rely on $.trigger()
    //
    // We want to make sure if a listener is attached using
    // jQuery, it is also removed with jQuery, that's why
    // we do the check for each directive instance and
    // store that check result on itself. This also allows
    // easier test coverage control by unsetting the global
    // jQuery variable in tests.
    this.hasjQuery = typeof jQuery === 'function';
    if (this.hasjQuery) {
      var method = jQuery.fn.on ? 'on' : 'bind';
      jQuery(el)[method]('change', this.rawListener);
      if (!lazy) {
        jQuery(el)[method]('input', this.listener);
      }
    } else {
      this.on('change', this.rawListener);
      if (!lazy) {
        this.on('input', this.listener);
      }
    }

    // IE9 doesn't fire input event on backspace/del/cut
    if (!lazy && isIE9) {
      this.on('cut', function () {
        nextTick(self.listener);
      });
      this.on('keyup', function (e) {
        if (e.keyCode === 46 || e.keyCode === 8) {
          self.listener();
        }
      });
    }

    // set initial value if present
    if (el.hasAttribute('value') || el.tagName === 'TEXTAREA' && el.value.trim()) {
      this.afterBind = this.listener;
    }
  },

  update: function update(value) {
    this.el.value = _toString(value);
  },

  unbind: function unbind() {
    var el = this.el;
    if (this.hasjQuery) {
      var method = jQuery.fn.off ? 'off' : 'unbind';
      jQuery(el)[method]('change', this.listener);
      jQuery(el)[method]('input', this.listener);
    }
  }
};

var radio = {

  bind: function bind() {
    var self = this;
    var el = this.el;

    this.getValue = function () {
      // value overwrite via v-bind:value
      if (el.hasOwnProperty('_value')) {
        return el._value;
      }
      var val = el.value;
      if (self.params.number) {
        val = toNumber(val);
      }
      return val;
    };

    this.listener = function () {
      self.set(self.getValue());
    };
    this.on('change', this.listener);

    if (el.hasAttribute('checked')) {
      this.afterBind = this.listener;
    }
  },

  update: function update(value) {
    this.el.checked = looseEqual(value, this.getValue());
  }
};

var select = {

  bind: function bind() {
    var self = this;
    var el = this.el;

    // method to force update DOM using latest value.
    this.forceUpdate = function () {
      if (self._watcher) {
        self.update(self._watcher.get());
      }
    };

    // check if this is a multiple select
    var multiple = this.multiple = el.hasAttribute('multiple');

    // attach listener
    this.listener = function () {
      var value = getValue(el, multiple);
      value = self.params.number ? isArray(value) ? value.map(toNumber) : toNumber(value) : value;
      self.set(value);
    };
    this.on('change', this.listener);

    // if has initial value, set afterBind
    var initValue = getValue(el, multiple, true);
    if (multiple && initValue.length || !multiple && initValue !== null) {
      this.afterBind = this.listener;
    }

    // All major browsers except Firefox resets
    // selectedIndex with value -1 to 0 when the element
    // is appended to a new parent, therefore we have to
    // force a DOM update whenever that happens...
    this.vm.$on('hook:attached', this.forceUpdate);
  },

  update: function update(value) {
    var el = this.el;
    el.selectedIndex = -1;
    var multi = this.multiple && isArray(value);
    var options = el.options;
    var i = options.length;
    var op, val;
    while (i--) {
      op = options[i];
      val = op.hasOwnProperty('_value') ? op._value : op.value;
      /* eslint-disable eqeqeq */
      op.selected = multi ? indexOf$1(value, val) > -1 : looseEqual(value, val);
      /* eslint-enable eqeqeq */
    }
  },

  unbind: function unbind() {
    /* istanbul ignore next */
    this.vm.$off('hook:attached', this.forceUpdate);
  }
};

/**
 * Get select value
 *
 * @param {SelectElement} el
 * @param {Boolean} multi
 * @param {Boolean} init
 * @return {Array|*}
 */

function getValue(el, multi, init) {
  var res = multi ? [] : null;
  var op, val, selected;
  for (var i = 0, l = el.options.length; i < l; i++) {
    op = el.options[i];
    selected = init ? op.hasAttribute('selected') : op.selected;
    if (selected) {
      val = op.hasOwnProperty('_value') ? op._value : op.value;
      if (multi) {
        res.push(val);
      } else {
        return val;
      }
    }
  }
  return res;
}

/**
 * Native Array.indexOf uses strict equal, but in this
 * case we need to match string/numbers with custom equal.
 *
 * @param {Array} arr
 * @param {*} val
 */

function indexOf$1(arr, val) {
  var i = arr.length;
  while (i--) {
    if (looseEqual(arr[i], val)) {
      return i;
    }
  }
  return -1;
}

var checkbox = {

  bind: function bind() {
    var self = this;
    var el = this.el;

    this.getValue = function () {
      return el.hasOwnProperty('_value') ? el._value : self.params.number ? toNumber(el.value) : el.value;
    };

    function getBooleanValue() {
      var val = el.checked;
      if (val && el.hasOwnProperty('_trueValue')) {
        return el._trueValue;
      }
      if (!val && el.hasOwnProperty('_falseValue')) {
        return el._falseValue;
      }
      return val;
    }

    this.listener = function () {
      var model = self._watcher.value;
      if (isArray(model)) {
        var val = self.getValue();
        if (el.checked) {
          if (indexOf(model, val) < 0) {
            model.push(val);
          }
        } else {
          model.$remove(val);
        }
      } else {
        self.set(getBooleanValue());
      }
    };

    this.on('change', this.listener);
    if (el.hasAttribute('checked')) {
      this.afterBind = this.listener;
    }
  },

  update: function update(value) {
    var el = this.el;
    if (isArray(value)) {
      el.checked = indexOf(value, this.getValue()) > -1;
    } else {
      if (el.hasOwnProperty('_trueValue')) {
        el.checked = looseEqual(value, el._trueValue);
      } else {
        el.checked = !!value;
      }
    }
  }
};

var handlers = {
  text: text$2,
  radio: radio,
  select: select,
  checkbox: checkbox
};

var model = {

  priority: MODEL,
  twoWay: true,
  handlers: handlers,
  params: ['lazy', 'number', 'debounce'],

  /**
   * Possible elements:
   *   <select>
   *   <textarea>
   *   <input type="*">
   *     - text
   *     - checkbox
   *     - radio
   *     - number
   */

  bind: function bind() {
    // friendly warning...
    this.checkFilters();
    if (this.hasRead && !this.hasWrite) {
      process.env.NODE_ENV !== 'production' && warn('It seems you are using a read-only filter with ' + 'v-model. You might want to use a two-way filter ' + 'to ensure correct behavior.');
    }
    var el = this.el;
    var tag = el.tagName;
    var handler;
    if (tag === 'INPUT') {
      handler = handlers[el.type] || handlers.text;
    } else if (tag === 'SELECT') {
      handler = handlers.select;
    } else if (tag === 'TEXTAREA') {
      handler = handlers.text;
    } else {
      process.env.NODE_ENV !== 'production' && warn('v-model does not support element type: ' + tag);
      return;
    }
    el.__v_model = this;
    handler.bind.call(this);
    this.update = handler.update;
    this._unbind = handler.unbind;
  },

  /**
   * Check read/write filter stats.
   */

  checkFilters: function checkFilters() {
    var filters = this.filters;
    if (!filters) return;
    var i = filters.length;
    while (i--) {
      var filter = resolveAsset(this.vm.$options, 'filters', filters[i].name);
      if (typeof filter === 'function' || filter.read) {
        this.hasRead = true;
      }
      if (filter.write) {
        this.hasWrite = true;
      }
    }
  },

  unbind: function unbind() {
    this.el.__v_model = null;
    this._unbind && this._unbind();
  }
};

// keyCode aliases
var keyCodes = {
  esc: 27,
  tab: 9,
  enter: 13,
  space: 32,
  'delete': [8, 46],
  up: 38,
  left: 37,
  right: 39,
  down: 40
};

function keyFilter(handler, keys) {
  var codes = keys.map(function (key) {
    var charCode = key.charCodeAt(0);
    if (charCode > 47 && charCode < 58) {
      return parseInt(key, 10);
    }
    if (key.length === 1) {
      charCode = key.toUpperCase().charCodeAt(0);
      if (charCode > 64 && charCode < 91) {
        return charCode;
      }
    }
    return keyCodes[key];
  });
  codes = [].concat.apply([], codes);
  return function keyHandler(e) {
    if (codes.indexOf(e.keyCode) > -1) {
      return handler.call(this, e);
    }
  };
}

function stopFilter(handler) {
  return function stopHandler(e) {
    e.stopPropagation();
    return handler.call(this, e);
  };
}

function preventFilter(handler) {
  return function preventHandler(e) {
    e.preventDefault();
    return handler.call(this, e);
  };
}

function selfFilter(handler) {
  return function selfHandler(e) {
    if (e.target === e.currentTarget) {
      return handler.call(this, e);
    }
  };
}

var on$1 = {

  priority: ON,
  acceptStatement: true,
  keyCodes: keyCodes,

  bind: function bind() {
    // deal with iframes
    if (this.el.tagName === 'IFRAME' && this.arg !== 'load') {
      var self = this;
      this.iframeBind = function () {
        on(self.el.contentWindow, self.arg, self.handler, self.modifiers.capture);
      };
      this.on('load', this.iframeBind);
    }
  },

  update: function update(handler) {
    // stub a noop for v-on with no value,
    // e.g. @mousedown.prevent
    if (!this.descriptor.raw) {
      handler = function () {};
    }

    if (typeof handler !== 'function') {
      process.env.NODE_ENV !== 'production' && warn('v-on:' + this.arg + '="' + this.expression + '" expects a function value, ' + 'got ' + handler);
      return;
    }

    // apply modifiers
    if (this.modifiers.stop) {
      handler = stopFilter(handler);
    }
    if (this.modifiers.prevent) {
      handler = preventFilter(handler);
    }
    if (this.modifiers.self) {
      handler = selfFilter(handler);
    }
    // key filter
    var keys = Object.keys(this.modifiers).filter(function (key) {
      return key !== 'stop' && key !== 'prevent';
    });
    if (keys.length) {
      handler = keyFilter(handler, keys);
    }

    this.reset();
    this.handler = handler;

    if (this.iframeBind) {
      this.iframeBind();
    } else {
      on(this.el, this.arg, this.handler, this.modifiers.capture);
    }
  },

  reset: function reset() {
    var el = this.iframeBind ? this.el.contentWindow : this.el;
    if (this.handler) {
      off(el, this.arg, this.handler);
    }
  },

  unbind: function unbind() {
    this.reset();
  }
};

var prefixes = ['-webkit-', '-moz-', '-ms-'];
var camelPrefixes = ['Webkit', 'Moz', 'ms'];
var importantRE = /!important;?$/;
var propCache = Object.create(null);

var testEl = null;

var style = {

  deep: true,

  update: function update(value) {
    if (typeof value === 'string') {
      this.el.style.cssText = value;
    } else if (isArray(value)) {
      this.handleObject(value.reduce(extend, {}));
    } else {
      this.handleObject(value || {});
    }
  },

  handleObject: function handleObject(value) {
    // cache object styles so that only changed props
    // are actually updated.
    var cache = this.cache || (this.cache = {});
    var name, val;
    for (name in cache) {
      if (!(name in value)) {
        this.handleSingle(name, null);
        delete cache[name];
      }
    }
    for (name in value) {
      val = value[name];
      if (val !== cache[name]) {
        cache[name] = val;
        this.handleSingle(name, val);
      }
    }
  },

  handleSingle: function handleSingle(prop, value) {
    prop = normalize(prop);
    if (!prop) return; // unsupported prop
    // cast possible numbers/booleans into strings
    if (value != null) value += '';
    if (value) {
      var isImportant = importantRE.test(value) ? 'important' : '';
      if (isImportant) {
        value = value.replace(importantRE, '').trim();
      }
      this.el.style.setProperty(prop, value, isImportant);
    } else {
      this.el.style.removeProperty(prop);
    }
  }

};

/**
 * Normalize a CSS property name.
 * - cache result
 * - auto prefix
 * - camelCase -> dash-case
 *
 * @param {String} prop
 * @return {String}
 */

function normalize(prop) {
  if (propCache[prop]) {
    return propCache[prop];
  }
  var res = prefix(prop);
  propCache[prop] = propCache[res] = res;
  return res;
}

/**
 * Auto detect the appropriate prefix for a CSS property.
 * https://gist.github.com/paulirish/523692
 *
 * @param {String} prop
 * @return {String}
 */

function prefix(prop) {
  prop = hyphenate(prop);
  var camel = camelize(prop);
  var upper = camel.charAt(0).toUpperCase() + camel.slice(1);
  if (!testEl) {
    testEl = document.createElement('div');
  }
  var i = prefixes.length;
  var prefixed;
  while (i--) {
    prefixed = camelPrefixes[i] + upper;
    if (prefixed in testEl.style) {
      return prefixes[i] + prop;
    }
  }
  if (camel in testEl.style) {
    return prop;
  }
}

// xlink
var xlinkNS = 'http://www.w3.org/1999/xlink';
var xlinkRE = /^xlink:/;

// check for attributes that prohibit interpolations
var disallowedInterpAttrRE = /^v-|^:|^@|^(?:is|transition|transition-mode|debounce|track-by|stagger|enter-stagger|leave-stagger)$/;
// these attributes should also set their corresponding properties
// because they only affect the initial state of the element
var attrWithPropsRE = /^(?:value|checked|selected|muted)$/;
// these attributes expect enumrated values of "true" or "false"
// but are not boolean attributes
var enumeratedAttrRE = /^(?:draggable|contenteditable|spellcheck)$/;

// these attributes should set a hidden property for
// binding v-model to object values
var modelProps = {
  value: '_value',
  'true-value': '_trueValue',
  'false-value': '_falseValue'
};

var bind$1 = {

  priority: BIND,

  bind: function bind() {
    var attr = this.arg;
    var tag = this.el.tagName;
    // should be deep watch on object mode
    if (!attr) {
      this.deep = true;
    }
    // handle interpolation bindings
    var descriptor = this.descriptor;
    var tokens = descriptor.interp;
    if (tokens) {
      // handle interpolations with one-time tokens
      if (descriptor.hasOneTime) {
        this.expression = tokensToExp(tokens, this._scope || this.vm);
      }

      // only allow binding on native attributes
      if (disallowedInterpAttrRE.test(attr) || attr === 'name' && (tag === 'PARTIAL' || tag === 'SLOT')) {
        process.env.NODE_ENV !== 'production' && warn(attr + '="' + descriptor.raw + '": ' + 'attribute interpolation is not allowed in Vue.js ' + 'directives and special attributes.');
        this.el.removeAttribute(attr);
        this.invalid = true;
      }

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production') {
        var raw = attr + '="' + descriptor.raw + '": ';
        // warn src
        if (attr === 'src') {
          warn(raw + 'interpolation in "src" attribute will cause ' + 'a 404 request. Use v-bind:src instead.');
        }

        // warn style
        if (attr === 'style') {
          warn(raw + 'interpolation in "style" attribute will cause ' + 'the attribute to be discarded in Internet Explorer. ' + 'Use v-bind:style instead.');
        }
      }
    }
  },

  update: function update(value) {
    if (this.invalid) {
      return;
    }
    var attr = this.arg;
    if (this.arg) {
      this.handleSingle(attr, value);
    } else {
      this.handleObject(value || {});
    }
  },

  // share object handler with v-bind:class
  handleObject: style.handleObject,

  handleSingle: function handleSingle(attr, value) {
    var el = this.el;
    var interp = this.descriptor.interp;
    if (this.modifiers.camel) {
      attr = camelize(attr);
    }
    if (!interp && attrWithPropsRE.test(attr) && attr in el) {
      el[attr] = attr === 'value' ? value == null // IE9 will set input.value to "null" for null...
      ? '' : value : value;
    }
    // set model props
    var modelProp = modelProps[attr];
    if (!interp && modelProp) {
      el[modelProp] = value;
      // update v-model if present
      var model = el.__v_model;
      if (model) {
        model.listener();
      }
    }
    // do not set value attribute for textarea
    if (attr === 'value' && el.tagName === 'TEXTAREA') {
      el.removeAttribute(attr);
      return;
    }
    // update attribute
    if (enumeratedAttrRE.test(attr)) {
      el.setAttribute(attr, value ? 'true' : 'false');
    } else if (value != null && value !== false) {
      if (attr === 'class') {
        // handle edge case #1960:
        // class interpolation should not overwrite Vue transition class
        if (el.__v_trans) {
          value += ' ' + el.__v_trans.id + '-transition';
        }
        setClass(el, value);
      } else if (xlinkRE.test(attr)) {
        el.setAttributeNS(xlinkNS, attr, value === true ? '' : value);
      } else {
        el.setAttribute(attr, value === true ? '' : value);
      }
    } else {
      el.removeAttribute(attr);
    }
  }
};

var el = {

  priority: EL,

  bind: function bind() {
    /* istanbul ignore if */
    if (!this.arg) {
      return;
    }
    var id = this.id = camelize(this.arg);
    var refs = (this._scope || this.vm).$els;
    if (hasOwn(refs, id)) {
      refs[id] = this.el;
    } else {
      defineReactive(refs, id, this.el);
    }
  },

  unbind: function unbind() {
    var refs = (this._scope || this.vm).$els;
    if (refs[this.id] === this.el) {
      refs[this.id] = null;
    }
  }
};

var ref = {
  bind: function bind() {
    process.env.NODE_ENV !== 'production' && warn('v-ref:' + this.arg + ' must be used on a child ' + 'component. Found on <' + this.el.tagName.toLowerCase() + '>.');
  }
};

var cloak = {
  bind: function bind() {
    var el = this.el;
    this.vm.$once('pre-hook:compiled', function () {
      el.removeAttribute('v-cloak');
    });
  }
};

// must export plain object
var directives = {
  text: text$1,
  html: html,
  'for': vFor,
  'if': vIf,
  show: show,
  model: model,
  on: on$1,
  bind: bind$1,
  el: el,
  ref: ref,
  cloak: cloak
};

var vClass = {

  deep: true,

  update: function update(value) {
    if (value && typeof value === 'string') {
      this.handleObject(stringToObject(value));
    } else if (isPlainObject(value)) {
      this.handleObject(value);
    } else if (isArray(value)) {
      this.handleArray(value);
    } else {
      this.cleanup();
    }
  },

  handleObject: function handleObject(value) {
    this.cleanup(value);
    var keys = this.prevKeys = Object.keys(value);
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      if (value[key]) {
        addClass(this.el, key);
      } else {
        removeClass(this.el, key);
      }
    }
  },

  handleArray: function handleArray(value) {
    this.cleanup(value);
    for (var i = 0, l = value.length; i < l; i++) {
      if (value[i]) {
        addClass(this.el, value[i]);
      }
    }
    this.prevKeys = value.slice();
  },

  cleanup: function cleanup(value) {
    if (this.prevKeys) {
      var i = this.prevKeys.length;
      while (i--) {
        var key = this.prevKeys[i];
        if (key && (!value || !contains(value, key))) {
          removeClass(this.el, key);
        }
      }
    }
  }
};

function stringToObject(value) {
  var res = {};
  var keys = value.trim().split(/\s+/);
  var i = keys.length;
  while (i--) {
    res[keys[i]] = true;
  }
  return res;
}

function contains(value, key) {
  return isArray(value) ? value.indexOf(key) > -1 : hasOwn(value, key);
}

var component = {

  priority: COMPONENT,

  params: ['keep-alive', 'transition-mode', 'inline-template'],

  /**
   * Setup. Two possible usages:
   *
   * - static:
   *   <comp> or <div v-component="comp">
   *
   * - dynamic:
   *   <component :is="view">
   */

  bind: function bind() {
    if (!this.el.__vue__) {
      // keep-alive cache
      this.keepAlive = this.params.keepAlive;
      if (this.keepAlive) {
        this.cache = {};
      }
      // check inline-template
      if (this.params.inlineTemplate) {
        // extract inline template as a DocumentFragment
        this.inlineTemplate = extractContent(this.el, true);
      }
      // component resolution related state
      this.pendingComponentCb = this.Component = null;
      // transition related state
      this.pendingRemovals = 0;
      this.pendingRemovalCb = null;
      // create a ref anchor
      this.anchor = createAnchor('v-component');
      replace(this.el, this.anchor);
      // remove is attribute.
      // this is removed during compilation, but because compilation is
      // cached, when the component is used elsewhere this attribute
      // will remain at link time.
      this.el.removeAttribute('is');
      // remove ref, same as above
      if (this.descriptor.ref) {
        this.el.removeAttribute('v-ref:' + hyphenate(this.descriptor.ref));
      }
      // if static, build right now.
      if (this.literal) {
        this.setComponent(this.expression);
      }
    } else {
      process.env.NODE_ENV !== 'production' && warn('cannot mount component "' + this.expression + '" ' + 'on already mounted element: ' + this.el);
    }
  },

  /**
   * Public update, called by the watcher in the dynamic
   * literal scenario, e.g. <component :is="view">
   */

  update: function update(value) {
    if (!this.literal) {
      this.setComponent(value);
    }
  },

  /**
   * Switch dynamic components. May resolve the component
   * asynchronously, and perform transition based on
   * specified transition mode. Accepts a few additional
   * arguments specifically for vue-router.
   *
   * The callback is called when the full transition is
   * finished.
   *
   * @param {String} value
   * @param {Function} [cb]
   */

  setComponent: function setComponent(value, cb) {
    this.invalidatePending();
    if (!value) {
      // just remove current
      this.unbuild(true);
      this.remove(this.childVM, cb);
      this.childVM = null;
    } else {
      var self = this;
      this.resolveComponent(value, function () {
        self.mountComponent(cb);
      });
    }
  },

  /**
   * Resolve the component constructor to use when creating
   * the child vm.
   */

  resolveComponent: function resolveComponent(id, cb) {
    var self = this;
    this.pendingComponentCb = cancellable(function (Component) {
      self.ComponentName = Component.options.name || id;
      self.Component = Component;
      cb();
    });
    this.vm._resolveComponent(id, this.pendingComponentCb);
  },

  /**
   * Create a new instance using the current constructor and
   * replace the existing instance. This method doesn't care
   * whether the new component and the old one are actually
   * the same.
   *
   * @param {Function} [cb]
   */

  mountComponent: function mountComponent(cb) {
    // actual mount
    this.unbuild(true);
    var self = this;
    var activateHooks = this.Component.options.activate;
    var cached = this.getCached();
    var newComponent = this.build();
    if (activateHooks && !cached) {
      this.waitingFor = newComponent;
      callActivateHooks(activateHooks, newComponent, function () {
        if (self.waitingFor !== newComponent) {
          return;
        }
        self.waitingFor = null;
        self.transition(newComponent, cb);
      });
    } else {
      // update ref for kept-alive component
      if (cached) {
        newComponent._updateRef();
      }
      this.transition(newComponent, cb);
    }
  },

  /**
   * When the component changes or unbinds before an async
   * constructor is resolved, we need to invalidate its
   * pending callback.
   */

  invalidatePending: function invalidatePending() {
    if (this.pendingComponentCb) {
      this.pendingComponentCb.cancel();
      this.pendingComponentCb = null;
    }
  },

  /**
   * Instantiate/insert a new child vm.
   * If keep alive and has cached instance, insert that
   * instance; otherwise build a new one and cache it.
   *
   * @param {Object} [extraOptions]
   * @return {Vue} - the created instance
   */

  build: function build(extraOptions) {
    var cached = this.getCached();
    if (cached) {
      return cached;
    }
    if (this.Component) {
      // default options
      var options = {
        name: this.ComponentName,
        el: cloneNode(this.el),
        template: this.inlineTemplate,
        // make sure to add the child with correct parent
        // if this is a transcluded component, its parent
        // should be the transclusion host.
        parent: this._host || this.vm,
        // if no inline-template, then the compiled
        // linker can be cached for better performance.
        _linkerCachable: !this.inlineTemplate,
        _ref: this.descriptor.ref,
        _asComponent: true,
        _isRouterView: this._isRouterView,
        // if this is a transcluded component, context
        // will be the common parent vm of this instance
        // and its host.
        _context: this.vm,
        // if this is inside an inline v-for, the scope
        // will be the intermediate scope created for this
        // repeat fragment. this is used for linking props
        // and container directives.
        _scope: this._scope,
        // pass in the owner fragment of this component.
        // this is necessary so that the fragment can keep
        // track of its contained components in order to
        // call attach/detach hooks for them.
        _frag: this._frag
      };
      // extra options
      // in 1.0.0 this is used by vue-router only
      /* istanbul ignore if */
      if (extraOptions) {
        extend(options, extraOptions);
      }
      var child = new this.Component(options);
      if (this.keepAlive) {
        this.cache[this.Component.cid] = child;
      }
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && this.el.hasAttribute('transition') && child._isFragment) {
        warn('Transitions will not work on a fragment instance. ' + 'Template: ' + child.$options.template);
      }
      return child;
    }
  },

  /**
   * Try to get a cached instance of the current component.
   *
   * @return {Vue|undefined}
   */

  getCached: function getCached() {
    return this.keepAlive && this.cache[this.Component.cid];
  },

  /**
   * Teardown the current child, but defers cleanup so
   * that we can separate the destroy and removal steps.
   *
   * @param {Boolean} defer
   */

  unbuild: function unbuild(defer) {
    if (this.waitingFor) {
      this.waitingFor.$destroy();
      this.waitingFor = null;
    }
    var child = this.childVM;
    if (!child || this.keepAlive) {
      if (child) {
        // remove ref
        child._updateRef(true);
      }
      return;
    }
    // the sole purpose of `deferCleanup` is so that we can
    // "deactivate" the vm right now and perform DOM removal
    // later.
    child.$destroy(false, defer);
  },

  /**
   * Remove current destroyed child and manually do
   * the cleanup after removal.
   *
   * @param {Function} cb
   */

  remove: function remove(child, cb) {
    var keepAlive = this.keepAlive;
    if (child) {
      // we may have a component switch when a previous
      // component is still being transitioned out.
      // we want to trigger only one lastest insertion cb
      // when the existing transition finishes. (#1119)
      this.pendingRemovals++;
      this.pendingRemovalCb = cb;
      var self = this;
      child.$remove(function () {
        self.pendingRemovals--;
        if (!keepAlive) child._cleanup();
        if (!self.pendingRemovals && self.pendingRemovalCb) {
          self.pendingRemovalCb();
          self.pendingRemovalCb = null;
        }
      });
    } else if (cb) {
      cb();
    }
  },

  /**
   * Actually swap the components, depending on the
   * transition mode. Defaults to simultaneous.
   *
   * @param {Vue} target
   * @param {Function} [cb]
   */

  transition: function transition(target, cb) {
    var self = this;
    var current = this.childVM;
    // for devtool inspection
    if (process.env.NODE_ENV !== 'production') {
      if (current) current._inactive = true;
      target._inactive = false;
    }
    this.childVM = target;
    switch (self.params.transitionMode) {
      case 'in-out':
        target.$before(self.anchor, function () {
          self.remove(current, cb);
        });
        break;
      case 'out-in':
        self.remove(current, function () {
          target.$before(self.anchor, cb);
        });
        break;
      default:
        self.remove(current);
        target.$before(self.anchor, cb);
    }
  },

  /**
   * Unbind.
   */

  unbind: function unbind() {
    this.invalidatePending();
    // Do not defer cleanup when unbinding
    this.unbuild();
    // destroy all keep-alive cached instances
    if (this.cache) {
      for (var key in this.cache) {
        this.cache[key].$destroy();
      }
      this.cache = null;
    }
  }
};

/**
 * Call activate hooks in order (asynchronous)
 *
 * @param {Array} hooks
 * @param {Vue} vm
 * @param {Function} cb
 */

function callActivateHooks(hooks, vm, cb) {
  var total = hooks.length;
  var called = 0;
  hooks[0].call(vm, next);
  function next() {
    if (++called >= total) {
      cb();
    } else {
      hooks[called].call(vm, next);
    }
  }
}

var bindingModes = config._propBindingModes;

var propDef = {

  bind: function bind() {
    var child = this.vm;
    var parent = child._context;
    // passed in from compiler directly
    var prop = this.descriptor.prop;
    var childKey = prop.path;
    var parentKey = prop.parentPath;
    var twoWay = prop.mode === bindingModes.TWO_WAY;

    var parentWatcher = this.parentWatcher = new Watcher(parent, parentKey, function (val) {
      val = coerceProp(prop, val);
      if (assertProp(prop, val)) {
        child[childKey] = val;
      }
    }, {
      twoWay: twoWay,
      filters: prop.filters,
      // important: props need to be observed on the
      // v-for scope if present
      scope: this._scope
    });

    // set the child initial value.
    initProp(child, prop, parentWatcher.value);

    // setup two-way binding
    if (twoWay) {
      // important: defer the child watcher creation until
      // the created hook (after data observation)
      var self = this;
      child.$once('pre-hook:created', function () {
        self.childWatcher = new Watcher(child, childKey, function (val) {
          parentWatcher.set(val);
        }, {
          // ensure sync upward before parent sync down.
          // this is necessary in cases e.g. the child
          // mutates a prop array, then replaces it. (#1683)
          sync: true
        });
      });
    }
  },

  unbind: function unbind() {
    this.parentWatcher.teardown();
    if (this.childWatcher) {
      this.childWatcher.teardown();
    }
  }
};

var queue$1 = [];
var queued = false;

/**
 * Push a job into the queue.
 *
 * @param {Function} job
 */

function pushJob(job) {
  queue$1.push(job);
  if (!queued) {
    queued = true;
    nextTick(flush);
  }
}

/**
 * Flush the queue, and do one forced reflow before
 * triggering transitions.
 */

function flush() {
  // Force layout
  var f = document.documentElement.offsetHeight;
  for (var i = 0; i < queue$1.length; i++) {
    queue$1[i]();
  }
  queue$1 = [];
  queued = false;
  // dummy return, so js linters don't complain about
  // unused variable f
  return f;
}

var TYPE_TRANSITION = 'transition';
var TYPE_ANIMATION = 'animation';
var transDurationProp = transitionProp + 'Duration';
var animDurationProp = animationProp + 'Duration';

/**
 * A Transition object that encapsulates the state and logic
 * of the transition.
 *
 * @param {Element} el
 * @param {String} id
 * @param {Object} hooks
 * @param {Vue} vm
 */
function Transition(el, id, hooks, vm) {
  this.id = id;
  this.el = el;
  this.enterClass = hooks && hooks.enterClass || id + '-enter';
  this.leaveClass = hooks && hooks.leaveClass || id + '-leave';
  this.hooks = hooks;
  this.vm = vm;
  // async state
  this.pendingCssEvent = this.pendingCssCb = this.cancel = this.pendingJsCb = this.op = this.cb = null;
  this.justEntered = false;
  this.entered = this.left = false;
  this.typeCache = {};
  // check css transition type
  this.type = hooks && hooks.type;
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production') {
    if (this.type && this.type !== TYPE_TRANSITION && this.type !== TYPE_ANIMATION) {
      warn('invalid CSS transition type for transition="' + this.id + '": ' + this.type);
    }
  }
  // bind
  var self = this;['enterNextTick', 'enterDone', 'leaveNextTick', 'leaveDone'].forEach(function (m) {
    self[m] = bind(self[m], self);
  });
}

var p$1 = Transition.prototype;

/**
 * Start an entering transition.
 *
 * 1. enter transition triggered
 * 2. call beforeEnter hook
 * 3. add enter class
 * 4. insert/show element
 * 5. call enter hook (with possible explicit js callback)
 * 6. reflow
 * 7. based on transition type:
 *    - transition:
 *        remove class now, wait for transitionend,
 *        then done if there's no explicit js callback.
 *    - animation:
 *        wait for animationend, remove class,
 *        then done if there's no explicit js callback.
 *    - no css transition:
 *        done now if there's no explicit js callback.
 * 8. wait for either done or js callback, then call
 *    afterEnter hook.
 *
 * @param {Function} op - insert/show the element
 * @param {Function} [cb]
 */

p$1.enter = function (op, cb) {
  this.cancelPending();
  this.callHook('beforeEnter');
  this.cb = cb;
  addClass(this.el, this.enterClass);
  op();
  this.entered = false;
  this.callHookWithCb('enter');
  if (this.entered) {
    return; // user called done synchronously.
  }
  this.cancel = this.hooks && this.hooks.enterCancelled;
  pushJob(this.enterNextTick);
};

/**
 * The "nextTick" phase of an entering transition, which is
 * to be pushed into a queue and executed after a reflow so
 * that removing the class can trigger a CSS transition.
 */

p$1.enterNextTick = function () {
  // Important hack:
  // in Chrome, if a just-entered element is applied the
  // leave class while its interpolated property still has
  // a very small value (within one frame), Chrome will
  // skip the leave transition entirely and not firing the
  // transtionend event. Therefore we need to protected
  // against such cases using a one-frame timeout.
  this.justEntered = true;
  var self = this;
  setTimeout(function () {
    self.justEntered = false;
  }, 17);

  var enterDone = this.enterDone;
  var type = this.getCssTransitionType(this.enterClass);
  if (!this.pendingJsCb) {
    if (type === TYPE_TRANSITION) {
      // trigger transition by removing enter class now
      removeClass(this.el, this.enterClass);
      this.setupCssCb(transitionEndEvent, enterDone);
    } else if (type === TYPE_ANIMATION) {
      this.setupCssCb(animationEndEvent, enterDone);
    } else {
      enterDone();
    }
  } else if (type === TYPE_TRANSITION) {
    removeClass(this.el, this.enterClass);
  }
};

/**
 * The "cleanup" phase of an entering transition.
 */

p$1.enterDone = function () {
  this.entered = true;
  this.cancel = this.pendingJsCb = null;
  removeClass(this.el, this.enterClass);
  this.callHook('afterEnter');
  if (this.cb) this.cb();
};

/**
 * Start a leaving transition.
 *
 * 1. leave transition triggered.
 * 2. call beforeLeave hook
 * 3. add leave class (trigger css transition)
 * 4. call leave hook (with possible explicit js callback)
 * 5. reflow if no explicit js callback is provided
 * 6. based on transition type:
 *    - transition or animation:
 *        wait for end event, remove class, then done if
 *        there's no explicit js callback.
 *    - no css transition:
 *        done if there's no explicit js callback.
 * 7. wait for either done or js callback, then call
 *    afterLeave hook.
 *
 * @param {Function} op - remove/hide the element
 * @param {Function} [cb]
 */

p$1.leave = function (op, cb) {
  this.cancelPending();
  this.callHook('beforeLeave');
  this.op = op;
  this.cb = cb;
  addClass(this.el, this.leaveClass);
  this.left = false;
  this.callHookWithCb('leave');
  if (this.left) {
    return; // user called done synchronously.
  }
  this.cancel = this.hooks && this.hooks.leaveCancelled;
  // only need to handle leaveDone if
  // 1. the transition is already done (synchronously called
  //    by the user, which causes this.op set to null)
  // 2. there's no explicit js callback
  if (this.op && !this.pendingJsCb) {
    // if a CSS transition leaves immediately after enter,
    // the transitionend event never fires. therefore we
    // detect such cases and end the leave immediately.
    if (this.justEntered) {
      this.leaveDone();
    } else {
      pushJob(this.leaveNextTick);
    }
  }
};

/**
 * The "nextTick" phase of a leaving transition.
 */

p$1.leaveNextTick = function () {
  var type = this.getCssTransitionType(this.leaveClass);
  if (type) {
    var event = type === TYPE_TRANSITION ? transitionEndEvent : animationEndEvent;
    this.setupCssCb(event, this.leaveDone);
  } else {
    this.leaveDone();
  }
};

/**
 * The "cleanup" phase of a leaving transition.
 */

p$1.leaveDone = function () {
  this.left = true;
  this.cancel = this.pendingJsCb = null;
  this.op();
  removeClass(this.el, this.leaveClass);
  this.callHook('afterLeave');
  if (this.cb) this.cb();
  this.op = null;
};

/**
 * Cancel any pending callbacks from a previously running
 * but not finished transition.
 */

p$1.cancelPending = function () {
  this.op = this.cb = null;
  var hasPending = false;
  if (this.pendingCssCb) {
    hasPending = true;
    off(this.el, this.pendingCssEvent, this.pendingCssCb);
    this.pendingCssEvent = this.pendingCssCb = null;
  }
  if (this.pendingJsCb) {
    hasPending = true;
    this.pendingJsCb.cancel();
    this.pendingJsCb = null;
  }
  if (hasPending) {
    removeClass(this.el, this.enterClass);
    removeClass(this.el, this.leaveClass);
  }
  if (this.cancel) {
    this.cancel.call(this.vm, this.el);
    this.cancel = null;
  }
};

/**
 * Call a user-provided synchronous hook function.
 *
 * @param {String} type
 */

p$1.callHook = function (type) {
  if (this.hooks && this.hooks[type]) {
    this.hooks[type].call(this.vm, this.el);
  }
};

/**
 * Call a user-provided, potentially-async hook function.
 * We check for the length of arguments to see if the hook
 * expects a `done` callback. If true, the transition's end
 * will be determined by when the user calls that callback;
 * otherwise, the end is determined by the CSS transition or
 * animation.
 *
 * @param {String} type
 */

p$1.callHookWithCb = function (type) {
  var hook = this.hooks && this.hooks[type];
  if (hook) {
    if (hook.length > 1) {
      this.pendingJsCb = cancellable(this[type + 'Done']);
    }
    hook.call(this.vm, this.el, this.pendingJsCb);
  }
};

/**
 * Get an element's transition type based on the
 * calculated styles.
 *
 * @param {String} className
 * @return {Number}
 */

p$1.getCssTransitionType = function (className) {
  /* istanbul ignore if */
  if (!transitionEndEvent ||
  // skip CSS transitions if page is not visible -
  // this solves the issue of transitionend events not
  // firing until the page is visible again.
  // pageVisibility API is supported in IE10+, same as
  // CSS transitions.
  document.hidden ||
  // explicit js-only transition
  this.hooks && this.hooks.css === false ||
  // element is hidden
  isHidden(this.el)) {
    return;
  }
  var type = this.type || this.typeCache[className];
  if (type) return type;
  var inlineStyles = this.el.style;
  var computedStyles = window.getComputedStyle(this.el);
  var transDuration = inlineStyles[transDurationProp] || computedStyles[transDurationProp];
  if (transDuration && transDuration !== '0s') {
    type = TYPE_TRANSITION;
  } else {
    var animDuration = inlineStyles[animDurationProp] || computedStyles[animDurationProp];
    if (animDuration && animDuration !== '0s') {
      type = TYPE_ANIMATION;
    }
  }
  if (type) {
    this.typeCache[className] = type;
  }
  return type;
};

/**
 * Setup a CSS transitionend/animationend callback.
 *
 * @param {String} event
 * @param {Function} cb
 */

p$1.setupCssCb = function (event, cb) {
  this.pendingCssEvent = event;
  var self = this;
  var el = this.el;
  var onEnd = this.pendingCssCb = function (e) {
    if (e.target === el) {
      off(el, event, onEnd);
      self.pendingCssEvent = self.pendingCssCb = null;
      if (!self.pendingJsCb && cb) {
        cb();
      }
    }
  };
  on(el, event, onEnd);
};

/**
 * Check if an element is hidden - in that case we can just
 * skip the transition alltogether.
 *
 * @param {Element} el
 * @return {Boolean}
 */

function isHidden(el) {
  if (/svg$/.test(el.namespaceURI)) {
    // SVG elements do not have offset(Width|Height)
    // so we need to check the client rect
    var rect = el.getBoundingClientRect();
    return !(rect.width || rect.height);
  } else {
    return !(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }
}

var transition$1 = {

  priority: TRANSITION,

  update: function update(id, oldId) {
    var el = this.el;
    // resolve on owner vm
    var hooks = resolveAsset(this.vm.$options, 'transitions', id);
    id = id || 'v';
    el.__v_trans = new Transition(el, id, hooks, this.vm);
    if (oldId) {
      removeClass(el, oldId + '-transition');
    }
    addClass(el, id + '-transition');
  }
};

var internalDirectives = {
  style: style,
  'class': vClass,
  component: component,
  prop: propDef,
  transition: transition$1
};

var propBindingModes = config._propBindingModes;
var empty = {};

// regexes
var identRE$1 = /^[$_a-zA-Z]+[\w$]*$/;
var settablePathRE = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*|\[[^\[\]]+\])*$/;

/**
 * Compile props on a root element and return
 * a props link function.
 *
 * @param {Element|DocumentFragment} el
 * @param {Array} propOptions
 * @return {Function} propsLinkFn
 */

function compileProps(el, propOptions) {
  var props = [];
  var names = Object.keys(propOptions);
  var i = names.length;
  var options, name, attr, value, path, parsed, prop;
  while (i--) {
    name = names[i];
    options = propOptions[name] || empty;

    if (process.env.NODE_ENV !== 'production' && name === '$data') {
      warn('Do not use $data as prop.');
      continue;
    }

    // props could contain dashes, which will be
    // interpreted as minus calculations by the parser
    // so we need to camelize the path here
    path = camelize(name);
    if (!identRE$1.test(path)) {
      process.env.NODE_ENV !== 'production' && warn('Invalid prop key: "' + name + '". Prop keys ' + 'must be valid identifiers.');
      continue;
    }

    prop = {
      name: name,
      path: path,
      options: options,
      mode: propBindingModes.ONE_WAY,
      raw: null
    };

    attr = hyphenate(name);
    // first check dynamic version
    if ((value = getBindAttr(el, attr)) === null) {
      if ((value = getBindAttr(el, attr + '.sync')) !== null) {
        prop.mode = propBindingModes.TWO_WAY;
      } else if ((value = getBindAttr(el, attr + '.once')) !== null) {
        prop.mode = propBindingModes.ONE_TIME;
      }
    }
    if (value !== null) {
      // has dynamic binding!
      prop.raw = value;
      parsed = parseDirective(value);
      value = parsed.expression;
      prop.filters = parsed.filters;
      // check binding type
      if (isLiteral(value) && !parsed.filters) {
        // for expressions containing literal numbers and
        // booleans, there's no need to setup a prop binding,
        // so we can optimize them as a one-time set.
        prop.optimizedLiteral = true;
      } else {
        prop.dynamic = true;
        // check non-settable path for two-way bindings
        if (process.env.NODE_ENV !== 'production' && prop.mode === propBindingModes.TWO_WAY && !settablePathRE.test(value)) {
          prop.mode = propBindingModes.ONE_WAY;
          warn('Cannot bind two-way prop with non-settable ' + 'parent path: ' + value);
        }
      }
      prop.parentPath = value;

      // warn required two-way
      if (process.env.NODE_ENV !== 'production' && options.twoWay && prop.mode !== propBindingModes.TWO_WAY) {
        warn('Prop "' + name + '" expects a two-way binding type.');
      }
    } else if ((value = getAttr(el, attr)) !== null) {
      // has literal binding!
      prop.raw = value;
    } else if (process.env.NODE_ENV !== 'production') {
      // check possible camelCase prop usage
      var lowerCaseName = path.toLowerCase();
      value = /[A-Z\-]/.test(name) && (el.getAttribute(lowerCaseName) || el.getAttribute(':' + lowerCaseName) || el.getAttribute('v-bind:' + lowerCaseName) || el.getAttribute(':' + lowerCaseName + '.once') || el.getAttribute('v-bind:' + lowerCaseName + '.once') || el.getAttribute(':' + lowerCaseName + '.sync') || el.getAttribute('v-bind:' + lowerCaseName + '.sync'));
      if (value) {
        warn('Possible usage error for prop `' + lowerCaseName + '` - ' + 'did you mean `' + attr + '`? HTML is case-insensitive, remember to use ' + 'kebab-case for props in templates.');
      } else if (options.required) {
        // warn missing required
        warn('Missing required prop: ' + name);
      }
    }
    // push prop
    props.push(prop);
  }
  return makePropsLinkFn(props);
}

/**
 * Build a function that applies props to a vm.
 *
 * @param {Array} props
 * @return {Function} propsLinkFn
 */

function makePropsLinkFn(props) {
  return function propsLinkFn(vm, scope) {
    // store resolved props info
    vm._props = {};
    var i = props.length;
    var prop, path, options, value, raw;
    while (i--) {
      prop = props[i];
      raw = prop.raw;
      path = prop.path;
      options = prop.options;
      vm._props[path] = prop;
      if (raw === null) {
        // initialize absent prop
        initProp(vm, prop, getDefault(vm, options));
      } else if (prop.dynamic) {
        // dynamic prop
        if (prop.mode === propBindingModes.ONE_TIME) {
          // one time binding
          value = (scope || vm._context || vm).$get(prop.parentPath);
          initProp(vm, prop, value);
        } else {
          if (vm._context) {
            // dynamic binding
            vm._bindDir({
              name: 'prop',
              def: propDef,
              prop: prop
            }, null, null, scope); // el, host, scope
          } else {
              // root instance
              initProp(vm, prop, vm.$get(prop.parentPath));
            }
        }
      } else if (prop.optimizedLiteral) {
        // optimized literal, cast it and just set once
        var stripped = stripQuotes(raw);
        value = stripped === raw ? toBoolean(toNumber(raw)) : stripped;
        initProp(vm, prop, value);
      } else {
        // string literal, but we need to cater for
        // Boolean props with no value
        value = options.type === Boolean && raw === '' ? true : raw;
        initProp(vm, prop, value);
      }
    }
  };
}

/**
 * Get the default value of a prop.
 *
 * @param {Vue} vm
 * @param {Object} options
 * @return {*}
 */

function getDefault(vm, options) {
  // no default, return undefined
  if (!hasOwn(options, 'default')) {
    // absent boolean value defaults to false
    return options.type === Boolean ? false : undefined;
  }
  var def = options['default'];
  // warn against non-factory defaults for Object & Array
  if (isObject(def)) {
    process.env.NODE_ENV !== 'production' && warn('Object/Array as default prop values will be shared ' + 'across multiple instances. Use a factory function ' + 'to return the default value instead.');
  }
  // call factory function for non-Function types
  return typeof def === 'function' && options.type !== Function ? def.call(vm) : def;
}

// special binding prefixes
var bindRE = /^v-bind:|^:/;
var onRE = /^v-on:|^@/;
var dirAttrRE = /^v-([^:]+)(?:$|:(.*)$)/;
var modifierRE = /\.[^\.]+/g;
var transitionRE = /^(v-bind:|:)?transition$/;

// terminal directives
var terminalDirectives = ['for', 'if'];

// default directive priority
var DEFAULT_PRIORITY = 1000;

/**
 * Compile a template and return a reusable composite link
 * function, which recursively contains more link functions
 * inside. This top level compile function would normally
 * be called on instance root nodes, but can also be used
 * for partial compilation if the partial argument is true.
 *
 * The returned composite link function, when called, will
 * return an unlink function that tearsdown all directives
 * created during the linking phase.
 *
 * @param {Element|DocumentFragment} el
 * @param {Object} options
 * @param {Boolean} partial
 * @return {Function}
 */

function compile(el, options, partial) {
  // link function for the node itself.
  var nodeLinkFn = partial || !options._asComponent ? compileNode(el, options) : null;
  // link function for the childNodes
  var childLinkFn = !(nodeLinkFn && nodeLinkFn.terminal) && el.tagName !== 'SCRIPT' && el.hasChildNodes() ? compileNodeList(el.childNodes, options) : null;

  /**
   * A composite linker function to be called on a already
   * compiled piece of DOM, which instantiates all directive
   * instances.
   *
   * @param {Vue} vm
   * @param {Element|DocumentFragment} el
   * @param {Vue} [host] - host vm of transcluded content
   * @param {Object} [scope] - v-for scope
   * @param {Fragment} [frag] - link context fragment
   * @return {Function|undefined}
   */

  return function compositeLinkFn(vm, el, host, scope, frag) {
    // cache childNodes before linking parent, fix #657
    var childNodes = toArray(el.childNodes);
    // link
    var dirs = linkAndCapture(function compositeLinkCapturer() {
      if (nodeLinkFn) nodeLinkFn(vm, el, host, scope, frag);
      if (childLinkFn) childLinkFn(vm, childNodes, host, scope, frag);
    }, vm);
    return makeUnlinkFn(vm, dirs);
  };
}

/**
 * Apply a linker to a vm/element pair and capture the
 * directives created during the process.
 *
 * @param {Function} linker
 * @param {Vue} vm
 */

function linkAndCapture(linker, vm) {
  /* istanbul ignore if */
  if (process.env.NODE_ENV === 'production') {
    // reset directives before every capture in production
    // mode, so that when unlinking we don't need to splice
    // them out (which turns out to be a perf hit).
    // they are kept in development mode because they are
    // useful for Vue's own tests.
    vm._directives = [];
  }
  var originalDirCount = vm._directives.length;
  linker();
  var dirs = vm._directives.slice(originalDirCount);
  dirs.sort(directiveComparator);
  for (var i = 0, l = dirs.length; i < l; i++) {
    dirs[i]._bind();
  }
  return dirs;
}

/**
 * Directive priority sort comparator
 *
 * @param {Object} a
 * @param {Object} b
 */

function directiveComparator(a, b) {
  a = a.descriptor.def.priority || DEFAULT_PRIORITY;
  b = b.descriptor.def.priority || DEFAULT_PRIORITY;
  return a > b ? -1 : a === b ? 0 : 1;
}

/**
 * Linker functions return an unlink function that
 * tearsdown all directives instances generated during
 * the process.
 *
 * We create unlink functions with only the necessary
 * information to avoid retaining additional closures.
 *
 * @param {Vue} vm
 * @param {Array} dirs
 * @param {Vue} [context]
 * @param {Array} [contextDirs]
 * @return {Function}
 */

function makeUnlinkFn(vm, dirs, context, contextDirs) {
  function unlink(destroying) {
    teardownDirs(vm, dirs, destroying);
    if (context && contextDirs) {
      teardownDirs(context, contextDirs);
    }
  }
  // expose linked directives
  unlink.dirs = dirs;
  return unlink;
}

/**
 * Teardown partial linked directives.
 *
 * @param {Vue} vm
 * @param {Array} dirs
 * @param {Boolean} destroying
 */

function teardownDirs(vm, dirs, destroying) {
  var i = dirs.length;
  while (i--) {
    dirs[i]._teardown();
    if (process.env.NODE_ENV !== 'production' && !destroying) {
      vm._directives.$remove(dirs[i]);
    }
  }
}

/**
 * Compile link props on an instance.
 *
 * @param {Vue} vm
 * @param {Element} el
 * @param {Object} props
 * @param {Object} [scope]
 * @return {Function}
 */

function compileAndLinkProps(vm, el, props, scope) {
  var propsLinkFn = compileProps(el, props);
  var propDirs = linkAndCapture(function () {
    propsLinkFn(vm, scope);
  }, vm);
  return makeUnlinkFn(vm, propDirs);
}

/**
 * Compile the root element of an instance.
 *
 * 1. attrs on context container (context scope)
 * 2. attrs on the component template root node, if
 *    replace:true (child scope)
 *
 * If this is a fragment instance, we only need to compile 1.
 *
 * @param {Element} el
 * @param {Object} options
 * @param {Object} contextOptions
 * @return {Function}
 */

function compileRoot(el, options, contextOptions) {
  var containerAttrs = options._containerAttrs;
  var replacerAttrs = options._replacerAttrs;
  var contextLinkFn, replacerLinkFn;

  // only need to compile other attributes for
  // non-fragment instances
  if (el.nodeType !== 11) {
    // for components, container and replacer need to be
    // compiled separately and linked in different scopes.
    if (options._asComponent) {
      // 2. container attributes
      if (containerAttrs && contextOptions) {
        contextLinkFn = compileDirectives(containerAttrs, contextOptions);
      }
      if (replacerAttrs) {
        // 3. replacer attributes
        replacerLinkFn = compileDirectives(replacerAttrs, options);
      }
    } else {
      // non-component, just compile as a normal element.
      replacerLinkFn = compileDirectives(el.attributes, options);
    }
  } else if (process.env.NODE_ENV !== 'production' && containerAttrs) {
    // warn container directives for fragment instances
    var names = containerAttrs.filter(function (attr) {
      // allow vue-loader/vueify scoped css attributes
      return attr.name.indexOf('_v-') < 0 &&
      // allow event listeners
      !onRE.test(attr.name) &&
      // allow slots
      attr.name !== 'slot';
    }).map(function (attr) {
      return '"' + attr.name + '"';
    });
    if (names.length) {
      var plural = names.length > 1;
      warn('Attribute' + (plural ? 's ' : ' ') + names.join(', ') + (plural ? ' are' : ' is') + ' ignored on component ' + '<' + options.el.tagName.toLowerCase() + '> because ' + 'the component is a fragment instance: ' + 'http://vuejs.org/guide/components.html#Fragment_Instance');
    }
  }

  options._containerAttrs = options._replacerAttrs = null;
  return function rootLinkFn(vm, el, scope) {
    // link context scope dirs
    var context = vm._context;
    var contextDirs;
    if (context && contextLinkFn) {
      contextDirs = linkAndCapture(function () {
        contextLinkFn(context, el, null, scope);
      }, context);
    }

    // link self
    var selfDirs = linkAndCapture(function () {
      if (replacerLinkFn) replacerLinkFn(vm, el);
    }, vm);

    // return the unlink function that tearsdown context
    // container directives.
    return makeUnlinkFn(vm, selfDirs, context, contextDirs);
  };
}

/**
 * Compile a node and return a nodeLinkFn based on the
 * node type.
 *
 * @param {Node} node
 * @param {Object} options
 * @return {Function|null}
 */

function compileNode(node, options) {
  var type = node.nodeType;
  if (type === 1 && node.tagName !== 'SCRIPT') {
    return compileElement(node, options);
  } else if (type === 3 && node.data.trim()) {
    return compileTextNode(node, options);
  } else {
    return null;
  }
}

/**
 * Compile an element and return a nodeLinkFn.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Function|null}
 */

function compileElement(el, options) {
  // preprocess textareas.
  // textarea treats its text content as the initial value.
  // just bind it as an attr directive for value.
  if (el.tagName === 'TEXTAREA') {
    var tokens = parseText(el.value);
    if (tokens) {
      el.setAttribute(':value', tokensToExp(tokens));
      el.value = '';
    }
  }
  var linkFn;
  var hasAttrs = el.hasAttributes();
  // check terminal directives (for & if)
  if (hasAttrs) {
    linkFn = checkTerminalDirectives(el, options);
  }
  // check element directives
  if (!linkFn) {
    linkFn = checkElementDirectives(el, options);
  }
  // check component
  if (!linkFn) {
    linkFn = checkComponent(el, options);
  }
  // normal directives
  if (!linkFn && hasAttrs) {
    linkFn = compileDirectives(el.attributes, options);
  }
  return linkFn;
}

/**
 * Compile a textNode and return a nodeLinkFn.
 *
 * @param {TextNode} node
 * @param {Object} options
 * @return {Function|null} textNodeLinkFn
 */

function compileTextNode(node, options) {
  // skip marked text nodes
  if (node._skip) {
    return removeText;
  }

  var tokens = parseText(node.wholeText);
  if (!tokens) {
    return null;
  }

  // mark adjacent text nodes as skipped,
  // because we are using node.wholeText to compile
  // all adjacent text nodes together. This fixes
  // issues in IE where sometimes it splits up a single
  // text node into multiple ones.
  var next = node.nextSibling;
  while (next && next.nodeType === 3) {
    next._skip = true;
    next = next.nextSibling;
  }

  var frag = document.createDocumentFragment();
  var el, token;
  for (var i = 0, l = tokens.length; i < l; i++) {
    token = tokens[i];
    el = token.tag ? processTextToken(token, options) : document.createTextNode(token.value);
    frag.appendChild(el);
  }
  return makeTextNodeLinkFn(tokens, frag, options);
}

/**
 * Linker for an skipped text node.
 *
 * @param {Vue} vm
 * @param {Text} node
 */

function removeText(vm, node) {
  remove(node);
}

/**
 * Process a single text token.
 *
 * @param {Object} token
 * @param {Object} options
 * @return {Node}
 */

function processTextToken(token, options) {
  var el;
  if (token.oneTime) {
    el = document.createTextNode(token.value);
  } else {
    if (token.html) {
      el = document.createComment('v-html');
      setTokenType('html');
    } else {
      // IE will clean up empty textNodes during
      // frag.cloneNode(true), so we have to give it
      // something here...
      el = document.createTextNode(' ');
      setTokenType('text');
    }
  }
  function setTokenType(type) {
    if (token.descriptor) return;
    var parsed = parseDirective(token.value);
    token.descriptor = {
      name: type,
      def: directives[type],
      expression: parsed.expression,
      filters: parsed.filters
    };
  }
  return el;
}

/**
 * Build a function that processes a textNode.
 *
 * @param {Array<Object>} tokens
 * @param {DocumentFragment} frag
 */

function makeTextNodeLinkFn(tokens, frag) {
  return function textNodeLinkFn(vm, el, host, scope) {
    var fragClone = frag.cloneNode(true);
    var childNodes = toArray(fragClone.childNodes);
    var token, value, node;
    for (var i = 0, l = tokens.length; i < l; i++) {
      token = tokens[i];
      value = token.value;
      if (token.tag) {
        node = childNodes[i];
        if (token.oneTime) {
          value = (scope || vm).$eval(value);
          if (token.html) {
            replace(node, parseTemplate(value, true));
          } else {
            node.data = value;
          }
        } else {
          vm._bindDir(token.descriptor, node, host, scope);
        }
      }
    }
    replace(el, fragClone);
  };
}

/**
 * Compile a node list and return a childLinkFn.
 *
 * @param {NodeList} nodeList
 * @param {Object} options
 * @return {Function|undefined}
 */

function compileNodeList(nodeList, options) {
  var linkFns = [];
  var nodeLinkFn, childLinkFn, node;
  for (var i = 0, l = nodeList.length; i < l; i++) {
    node = nodeList[i];
    nodeLinkFn = compileNode(node, options);
    childLinkFn = !(nodeLinkFn && nodeLinkFn.terminal) && node.tagName !== 'SCRIPT' && node.hasChildNodes() ? compileNodeList(node.childNodes, options) : null;
    linkFns.push(nodeLinkFn, childLinkFn);
  }
  return linkFns.length ? makeChildLinkFn(linkFns) : null;
}

/**
 * Make a child link function for a node's childNodes.
 *
 * @param {Array<Function>} linkFns
 * @return {Function} childLinkFn
 */

function makeChildLinkFn(linkFns) {
  return function childLinkFn(vm, nodes, host, scope, frag) {
    var node, nodeLinkFn, childrenLinkFn;
    for (var i = 0, n = 0, l = linkFns.length; i < l; n++) {
      node = nodes[n];
      nodeLinkFn = linkFns[i++];
      childrenLinkFn = linkFns[i++];
      // cache childNodes before linking parent, fix #657
      var childNodes = toArray(node.childNodes);
      if (nodeLinkFn) {
        nodeLinkFn(vm, node, host, scope, frag);
      }
      if (childrenLinkFn) {
        childrenLinkFn(vm, childNodes, host, scope, frag);
      }
    }
  };
}

/**
 * Check for element directives (custom elements that should
 * be resovled as terminal directives).
 *
 * @param {Element} el
 * @param {Object} options
 */

function checkElementDirectives(el, options) {
  var tag = el.tagName.toLowerCase();
  if (commonTagRE.test(tag)) {
    return;
  }
  var def = resolveAsset(options, 'elementDirectives', tag);
  if (def) {
    return makeTerminalNodeLinkFn(el, tag, '', options, def);
  }
}

/**
 * Check if an element is a component. If yes, return
 * a component link function.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Function|undefined}
 */

function checkComponent(el, options) {
  var component = checkComponentAttr(el, options);
  if (component) {
    var ref = findRef(el);
    var descriptor = {
      name: 'component',
      ref: ref,
      expression: component.id,
      def: internalDirectives.component,
      modifiers: {
        literal: !component.dynamic
      }
    };
    var componentLinkFn = function componentLinkFn(vm, el, host, scope, frag) {
      if (ref) {
        defineReactive((scope || vm).$refs, ref, null);
      }
      vm._bindDir(descriptor, el, host, scope, frag);
    };
    componentLinkFn.terminal = true;
    return componentLinkFn;
  }
}

/**
 * Check an element for terminal directives in fixed order.
 * If it finds one, return a terminal link function.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Function} terminalLinkFn
 */

function checkTerminalDirectives(el, options) {
  // skip v-pre
  if (getAttr(el, 'v-pre') !== null) {
    return skip;
  }
  // skip v-else block, but only if following v-if
  if (el.hasAttribute('v-else')) {
    var prev = el.previousElementSibling;
    if (prev && prev.hasAttribute('v-if')) {
      return skip;
    }
  }
  var value, dirName;
  for (var i = 0, l = terminalDirectives.length; i < l; i++) {
    dirName = terminalDirectives[i];
    value = el.getAttribute('v-' + dirName);
    if (value != null) {
      return makeTerminalNodeLinkFn(el, dirName, value, options);
    }
  }
}

function skip() {}
skip.terminal = true;

/**
 * Build a node link function for a terminal directive.
 * A terminal link function terminates the current
 * compilation recursion and handles compilation of the
 * subtree in the directive.
 *
 * @param {Element} el
 * @param {String} dirName
 * @param {String} value
 * @param {Object} options
 * @param {Object} [def]
 * @return {Function} terminalLinkFn
 */

function makeTerminalNodeLinkFn(el, dirName, value, options, def) {
  var parsed = parseDirective(value);
  var descriptor = {
    name: dirName,
    expression: parsed.expression,
    filters: parsed.filters,
    raw: value,
    // either an element directive, or if/for
    // #2366 or custom terminal directive
    def: def || resolveAsset(options, 'directives', dirName)
  };
  // check ref for v-for and router-view
  if (dirName === 'for' || dirName === 'router-view') {
    descriptor.ref = findRef(el);
  }
  var fn = function terminalNodeLinkFn(vm, el, host, scope, frag) {
    if (descriptor.ref) {
      defineReactive((scope || vm).$refs, descriptor.ref, null);
    }
    vm._bindDir(descriptor, el, host, scope, frag);
  };
  fn.terminal = true;
  return fn;
}

/**
 * Compile the directives on an element and return a linker.
 *
 * @param {Array|NamedNodeMap} attrs
 * @param {Object} options
 * @return {Function}
 */

function compileDirectives(attrs, options) {
  var i = attrs.length;
  var dirs = [];
  var attr, name, value, rawName, rawValue, dirName, arg, modifiers, dirDef, tokens, matched;
  while (i--) {
    attr = attrs[i];
    name = rawName = attr.name;
    value = rawValue = attr.value;
    tokens = parseText(value);
    // reset arg
    arg = null;
    // check modifiers
    modifiers = parseModifiers(name);
    name = name.replace(modifierRE, '');

    // attribute interpolations
    if (tokens) {
      value = tokensToExp(tokens);
      arg = name;
      pushDir('bind', directives.bind, tokens);
      // warn against mixing mustaches with v-bind
      if (process.env.NODE_ENV !== 'production') {
        if (name === 'class' && Array.prototype.some.call(attrs, function (attr) {
          return attr.name === ':class' || attr.name === 'v-bind:class';
        })) {
          warn('class="' + rawValue + '": Do not mix mustache interpolation ' + 'and v-bind for "class" on the same element. Use one or the other.');
        }
      }
    } else

      // special attribute: transition
      if (transitionRE.test(name)) {
        modifiers.literal = !bindRE.test(name);
        pushDir('transition', internalDirectives.transition);
      } else

        // event handlers
        if (onRE.test(name)) {
          arg = name.replace(onRE, '');
          pushDir('on', directives.on);
        } else

          // attribute bindings
          if (bindRE.test(name)) {
            dirName = name.replace(bindRE, '');
            if (dirName === 'style' || dirName === 'class') {
              pushDir(dirName, internalDirectives[dirName]);
            } else {
              arg = dirName;
              pushDir('bind', directives.bind);
            }
          } else

            // normal directives
            if (matched = name.match(dirAttrRE)) {
              dirName = matched[1];
              arg = matched[2];

              // skip v-else (when used with v-show)
              if (dirName === 'else') {
                continue;
              }

              dirDef = resolveAsset(options, 'directives', dirName);

              if (process.env.NODE_ENV !== 'production') {
                assertAsset(dirDef, 'directive', dirName);
              }

              if (dirDef) {
                pushDir(dirName, dirDef);
              }
            }
  }

  /**
   * Push a directive.
   *
   * @param {String} dirName
   * @param {Object|Function} def
   * @param {Array} [interpTokens]
   */

  function pushDir(dirName, def, interpTokens) {
    var hasOneTimeToken = interpTokens && hasOneTime(interpTokens);
    var parsed = !hasOneTimeToken && parseDirective(value);
    dirs.push({
      name: dirName,
      attr: rawName,
      raw: rawValue,
      def: def,
      arg: arg,
      modifiers: modifiers,
      // conversion from interpolation strings with one-time token
      // to expression is differed until directive bind time so that we
      // have access to the actual vm context for one-time bindings.
      expression: parsed && parsed.expression,
      filters: parsed && parsed.filters,
      interp: interpTokens,
      hasOneTime: hasOneTimeToken
    });
  }

  if (dirs.length) {
    return makeNodeLinkFn(dirs);
  }
}

/**
 * Parse modifiers from directive attribute name.
 *
 * @param {String} name
 * @return {Object}
 */

function parseModifiers(name) {
  var res = Object.create(null);
  var match = name.match(modifierRE);
  if (match) {
    var i = match.length;
    while (i--) {
      res[match[i].slice(1)] = true;
    }
  }
  return res;
}

/**
 * Build a link function for all directives on a single node.
 *
 * @param {Array} directives
 * @return {Function} directivesLinkFn
 */

function makeNodeLinkFn(directives) {
  return function nodeLinkFn(vm, el, host, scope, frag) {
    // reverse apply because it's sorted low to high
    var i = directives.length;
    while (i--) {
      vm._bindDir(directives[i], el, host, scope, frag);
    }
  };
}

/**
 * Check if an interpolation string contains one-time tokens.
 *
 * @param {Array} tokens
 * @return {Boolean}
 */

function hasOneTime(tokens) {
  var i = tokens.length;
  while (i--) {
    if (tokens[i].oneTime) return true;
  }
}

var specialCharRE = /[^\w\-:\.]/;

/**
 * Process an element or a DocumentFragment based on a
 * instance option object. This allows us to transclude
 * a template node/fragment before the instance is created,
 * so the processed fragment can then be cloned and reused
 * in v-for.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Element|DocumentFragment}
 */

function transclude(el, options) {
  // extract container attributes to pass them down
  // to compiler, because they need to be compiled in
  // parent scope. we are mutating the options object here
  // assuming the same object will be used for compile
  // right after this.
  if (options) {
    options._containerAttrs = extractAttrs(el);
  }
  // for template tags, what we want is its content as
  // a documentFragment (for fragment instances)
  if (isTemplate(el)) {
    el = parseTemplate(el);
  }
  if (options) {
    if (options._asComponent && !options.template) {
      options.template = '<slot></slot>';
    }
    if (options.template) {
      options._content = extractContent(el);
      el = transcludeTemplate(el, options);
    }
  }
  if (isFragment(el)) {
    // anchors for fragment instance
    // passing in `persist: true` to avoid them being
    // discarded by IE during template cloning
    prepend(createAnchor('v-start', true), el);
    el.appendChild(createAnchor('v-end', true));
  }
  return el;
}

/**
 * Process the template option.
 * If the replace option is true this will swap the $el.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Element|DocumentFragment}
 */

function transcludeTemplate(el, options) {
  var template = options.template;
  var frag = parseTemplate(template, true);
  if (frag) {
    var replacer = frag.firstChild;
    var tag = replacer.tagName && replacer.tagName.toLowerCase();
    if (options.replace) {
      /* istanbul ignore if */
      if (el === document.body) {
        process.env.NODE_ENV !== 'production' && warn('You are mounting an instance with a template to ' + '<body>. This will replace <body> entirely. You ' + 'should probably use `replace: false` here.');
      }
      // there are many cases where the instance must
      // become a fragment instance: basically anything that
      // can create more than 1 root nodes.
      if (
      // multi-children template
      frag.childNodes.length > 1 ||
      // non-element template
      replacer.nodeType !== 1 ||
      // single nested component
      tag === 'component' || resolveAsset(options, 'components', tag) || hasBindAttr(replacer, 'is') ||
      // element directive
      resolveAsset(options, 'elementDirectives', tag) ||
      // for block
      replacer.hasAttribute('v-for') ||
      // if block
      replacer.hasAttribute('v-if')) {
        return frag;
      } else {
        options._replacerAttrs = extractAttrs(replacer);
        mergeAttrs(el, replacer);
        return replacer;
      }
    } else {
      el.appendChild(frag);
      return el;
    }
  } else {
    process.env.NODE_ENV !== 'production' && warn('Invalid template option: ' + template);
  }
}

/**
 * Helper to extract a component container's attributes
 * into a plain object array.
 *
 * @param {Element} el
 * @return {Array}
 */

function extractAttrs(el) {
  if (el.nodeType === 1 && el.hasAttributes()) {
    return toArray(el.attributes);
  }
}

/**
 * Merge the attributes of two elements, and make sure
 * the class names are merged properly.
 *
 * @param {Element} from
 * @param {Element} to
 */

function mergeAttrs(from, to) {
  var attrs = from.attributes;
  var i = attrs.length;
  var name, value;
  while (i--) {
    name = attrs[i].name;
    value = attrs[i].value;
    if (!to.hasAttribute(name) && !specialCharRE.test(name)) {
      to.setAttribute(name, value);
    } else if (name === 'class' && !parseText(value)) {
      value.split(/\s+/).forEach(function (cls) {
        addClass(to, cls);
      });
    }
  }
}

/**
 * Scan and determine slot content distribution.
 * We do this during transclusion instead at compile time so that
 * the distribution is decoupled from the compilation order of
 * the slots.
 *
 * @param {Element|DocumentFragment} template
 * @param {Element} content
 * @param {Vue} vm
 */

function scanSlots(template, content, vm) {
  if (!content) {
    return;
  }
  var contents = vm._slotContents = {};
  var slots = template.querySelectorAll('slot');
  if (slots.length) {
    var hasDefault, slot, name;
    for (var i = 0, l = slots.length; i < l; i++) {
      slot = slots[i];
      /* eslint-disable no-cond-assign */
      if (name = slot.getAttribute('name')) {
        select(slot, name);
      } else if (process.env.NODE_ENV !== 'production' && (name = getBindAttr(slot, 'name'))) {
        warn('<slot :name="' + name + '">: slot names cannot be dynamic.');
      } else {
        // default slot
        hasDefault = true;
      }
      /* eslint-enable no-cond-assign */
    }
    if (hasDefault) {
      contents['default'] = extractFragment(content.childNodes, content);
    }
  }

  function select(slot, name) {
    // named slot
    var selector = '[slot="' + name + '"]';
    var nodes = content.querySelectorAll(selector);
    if (nodes.length) {
      contents[name] = extractFragment(nodes, content);
    }
  }
}

/**
 * Extract qualified content nodes from a node list.
 *
 * @param {NodeList} nodes
 * @param {Element} parent
 * @return {DocumentFragment}
 */

function extractFragment(nodes, parent) {
  var frag = document.createDocumentFragment();
  nodes = toArray(nodes);
  for (var i = 0, l = nodes.length; i < l; i++) {
    var node = nodes[i];
    if (node.parentNode === parent) {
      if (isTemplate(node) && !node.hasAttribute('v-if') && !node.hasAttribute('v-for')) {
        parent.removeChild(node);
        node = parseTemplate(node);
      }
      frag.appendChild(node);
    }
  }
  return frag;
}



var compiler = Object.freeze({
	compile: compile,
	compileAndLinkProps: compileAndLinkProps,
	compileRoot: compileRoot,
	terminalDirectives: terminalDirectives,
	transclude: transclude,
	scanSlots: scanSlots
});

function stateMixin (Vue) {
  /**
   * Accessor for `$data` property, since setting $data
   * requires observing the new object and updating
   * proxied properties.
   */

  Object.defineProperty(Vue.prototype, '$data', {
    get: function get() {
      return this._data;
    },
    set: function set(newData) {
      if (newData !== this._data) {
        this._setData(newData);
      }
    }
  });

  /**
   * Setup the scope of an instance, which contains:
   * - observed data
   * - computed properties
   * - user methods
   * - meta properties
   */

  Vue.prototype._initState = function () {
    this._initProps();
    this._initMeta();
    this._initMethods();
    this._initData();
    this._initComputed();
  };

  /**
   * Initialize props.
   */

  Vue.prototype._initProps = function () {
    var options = this.$options;
    var el = options.el;
    var props = options.props;
    if (props && !el) {
      process.env.NODE_ENV !== 'production' && warn('Props will not be compiled if no `el` option is ' + 'provided at instantiation.');
    }
    // make sure to convert string selectors into element now
    el = options.el = query(el);
    this._propsUnlinkFn = el && el.nodeType === 1 && props
    // props must be linked in proper scope if inside v-for
    ? compileAndLinkProps(this, el, props, this._scope) : null;
  };

  /**
   * Initialize the data.
   */

  Vue.prototype._initData = function () {
    var propsData = this._data;
    var optionsDataFn = this.$options.data;
    var optionsData = optionsDataFn && optionsDataFn();
    var runtimeData;
    if (process.env.NODE_ENV !== 'production') {
      runtimeData = (typeof this._runtimeData === 'function' ? this._runtimeData() : this._runtimeData) || {};
      this._runtimeData = null;
    }
    if (optionsData) {
      this._data = optionsData;
      for (var prop in propsData) {
        if (process.env.NODE_ENV !== 'production' && hasOwn(optionsData, prop) && !hasOwn(runtimeData, prop)) {
          warn('Data field "' + prop + '" is already defined ' + 'as a prop. Use prop default value instead.');
        }
        if (this._props[prop].raw !== null || !hasOwn(optionsData, prop)) {
          set(optionsData, prop, propsData[prop]);
        }
      }
    }
    var data = this._data;
    // proxy data on instance
    var keys = Object.keys(data);
    var i, key;
    i = keys.length;
    while (i--) {
      key = keys[i];
      this._proxy(key);
    }
    // observe data
    observe(data, this);
  };

  /**
   * Swap the instance's $data. Called in $data's setter.
   *
   * @param {Object} newData
   */

  Vue.prototype._setData = function (newData) {
    newData = newData || {};
    var oldData = this._data;
    this._data = newData;
    var keys, key, i;
    // unproxy keys not present in new data
    keys = Object.keys(oldData);
    i = keys.length;
    while (i--) {
      key = keys[i];
      if (!(key in newData)) {
        this._unproxy(key);
      }
    }
    // proxy keys not already proxied,
    // and trigger change for changed values
    keys = Object.keys(newData);
    i = keys.length;
    while (i--) {
      key = keys[i];
      if (!hasOwn(this, key)) {
        // new property
        this._proxy(key);
      }
    }
    oldData.__ob__.removeVm(this);
    observe(newData, this);
    this._digest();
  };

  /**
   * Proxy a property, so that
   * vm.prop === vm._data.prop
   *
   * @param {String} key
   */

  Vue.prototype._proxy = function (key) {
    if (!isReserved(key)) {
      // need to store ref to self here
      // because these getter/setters might
      // be called by child scopes via
      // prototype inheritance.
      var self = this;
      Object.defineProperty(self, key, {
        configurable: true,
        enumerable: true,
        get: function proxyGetter() {
          return self._data[key];
        },
        set: function proxySetter(val) {
          self._data[key] = val;
        }
      });
    }
  };

  /**
   * Unproxy a property.
   *
   * @param {String} key
   */

  Vue.prototype._unproxy = function (key) {
    if (!isReserved(key)) {
      delete this[key];
    }
  };

  /**
   * Force update on every watcher in scope.
   */

  Vue.prototype._digest = function () {
    for (var i = 0, l = this._watchers.length; i < l; i++) {
      this._watchers[i].update(true); // shallow updates
    }
  };

  /**
   * Setup computed properties. They are essentially
   * special getter/setters
   */

  function noop() {}
  Vue.prototype._initComputed = function () {
    var computed = this.$options.computed;
    if (computed) {
      for (var key in computed) {
        var userDef = computed[key];
        var def = {
          enumerable: true,
          configurable: true
        };
        if (typeof userDef === 'function') {
          def.get = makeComputedGetter(userDef, this);
          def.set = noop;
        } else {
          def.get = userDef.get ? userDef.cache !== false ? makeComputedGetter(userDef.get, this) : bind(userDef.get, this) : noop;
          def.set = userDef.set ? bind(userDef.set, this) : noop;
        }
        Object.defineProperty(this, key, def);
      }
    }
  };

  function makeComputedGetter(getter, owner) {
    var watcher = new Watcher(owner, getter, null, {
      lazy: true
    });
    return function computedGetter() {
      if (watcher.dirty) {
        watcher.evaluate();
      }
      if (Dep.target) {
        watcher.depend();
      }
      return watcher.value;
    };
  }

  /**
   * Setup instance methods. Methods must be bound to the
   * instance since they might be passed down as a prop to
   * child components.
   */

  Vue.prototype._initMethods = function () {
    var methods = this.$options.methods;
    if (methods) {
      for (var key in methods) {
        this[key] = bind(methods[key], this);
      }
    }
  };

  /**
   * Initialize meta information like $index, $key & $value.
   */

  Vue.prototype._initMeta = function () {
    var metas = this.$options._meta;
    if (metas) {
      for (var key in metas) {
        defineReactive(this, key, metas[key]);
      }
    }
  };
}

var eventRE = /^v-on:|^@/;

function eventsMixin (Vue) {
  /**
   * Setup the instance's option events & watchers.
   * If the value is a string, we pull it from the
   * instance's methods by name.
   */

  Vue.prototype._initEvents = function () {
    var options = this.$options;
    if (options._asComponent) {
      registerComponentEvents(this, options.el);
    }
    registerCallbacks(this, '$on', options.events);
    registerCallbacks(this, '$watch', options.watch);
  };

  /**
   * Register v-on events on a child component
   *
   * @param {Vue} vm
   * @param {Element} el
   */

  function registerComponentEvents(vm, el) {
    var attrs = el.attributes;
    var name, handler;
    for (var i = 0, l = attrs.length; i < l; i++) {
      name = attrs[i].name;
      if (eventRE.test(name)) {
        name = name.replace(eventRE, '');
        handler = (vm._scope || vm._context).$eval(attrs[i].value, true);
        if (typeof handler === 'function') {
          handler._fromParent = true;
          vm.$on(name.replace(eventRE), handler);
        } else if (process.env.NODE_ENV !== 'production') {
          warn('v-on:' + name + '="' + attrs[i].value + '"' + (vm.$options.name ? ' on component <' + vm.$options.name + '>' : '') + ' expects a function value, got ' + handler);
        }
      }
    }
  }

  /**
   * Register callbacks for option events and watchers.
   *
   * @param {Vue} vm
   * @param {String} action
   * @param {Object} hash
   */

  function registerCallbacks(vm, action, hash) {
    if (!hash) return;
    var handlers, key, i, j;
    for (key in hash) {
      handlers = hash[key];
      if (isArray(handlers)) {
        for (i = 0, j = handlers.length; i < j; i++) {
          register(vm, action, key, handlers[i]);
        }
      } else {
        register(vm, action, key, handlers);
      }
    }
  }

  /**
   * Helper to register an event/watch callback.
   *
   * @param {Vue} vm
   * @param {String} action
   * @param {String} key
   * @param {Function|String|Object} handler
   * @param {Object} [options]
   */

  function register(vm, action, key, handler, options) {
    var type = typeof handler;
    if (type === 'function') {
      vm[action](key, handler, options);
    } else if (type === 'string') {
      var methods = vm.$options.methods;
      var method = methods && methods[handler];
      if (method) {
        vm[action](key, method, options);
      } else {
        process.env.NODE_ENV !== 'production' && warn('Unknown method: "' + handler + '" when ' + 'registering callback for ' + action + ': "' + key + '".');
      }
    } else if (handler && type === 'object') {
      register(vm, action, key, handler.handler, handler);
    }
  }

  /**
   * Setup recursive attached/detached calls
   */

  Vue.prototype._initDOMHooks = function () {
    this.$on('hook:attached', onAttached);
    this.$on('hook:detached', onDetached);
  };

  /**
   * Callback to recursively call attached hook on children
   */

  function onAttached() {
    if (!this._isAttached) {
      this._isAttached = true;
      this.$children.forEach(callAttach);
    }
  }

  /**
   * Iterator to call attached hook
   *
   * @param {Vue} child
   */

  function callAttach(child) {
    if (!child._isAttached && inDoc(child.$el)) {
      child._callHook('attached');
    }
  }

  /**
   * Callback to recursively call detached hook on children
   */

  function onDetached() {
    if (this._isAttached) {
      this._isAttached = false;
      this.$children.forEach(callDetach);
    }
  }

  /**
   * Iterator to call detached hook
   *
   * @param {Vue} child
   */

  function callDetach(child) {
    if (child._isAttached && !inDoc(child.$el)) {
      child._callHook('detached');
    }
  }

  /**
   * Trigger all handlers for a hook
   *
   * @param {String} hook
   */

  Vue.prototype._callHook = function (hook) {
    this.$emit('pre-hook:' + hook);
    var handlers = this.$options[hook];
    if (handlers) {
      for (var i = 0, j = handlers.length; i < j; i++) {
        handlers[i].call(this);
      }
    }
    this.$emit('hook:' + hook);
  };
}

function noop() {}

/**
 * A directive links a DOM element with a piece of data,
 * which is the result of evaluating an expression.
 * It registers a watcher with the expression and calls
 * the DOM update function when a change is triggered.
 *
 * @param {String} name
 * @param {Node} el
 * @param {Vue} vm
 * @param {Object} descriptor
 *                 - {String} name
 *                 - {Object} def
 *                 - {String} expression
 *                 - {Array<Object>} [filters]
 *                 - {Boolean} literal
 *                 - {String} attr
 *                 - {String} raw
 * @param {Object} def - directive definition object
 * @param {Vue} [host] - transclusion host component
 * @param {Object} [scope] - v-for scope
 * @param {Fragment} [frag] - owner fragment
 * @constructor
 */
function Directive(descriptor, vm, el, host, scope, frag) {
  this.vm = vm;
  this.el = el;
  // copy descriptor properties
  this.descriptor = descriptor;
  this.name = descriptor.name;
  this.expression = descriptor.expression;
  this.arg = descriptor.arg;
  this.modifiers = descriptor.modifiers;
  this.filters = descriptor.filters;
  this.literal = this.modifiers && this.modifiers.literal;
  // private
  this._locked = false;
  this._bound = false;
  this._listeners = null;
  // link context
  this._host = host;
  this._scope = scope;
  this._frag = frag;
  // store directives on node in dev mode
  if (process.env.NODE_ENV !== 'production' && this.el) {
    this.el._vue_directives = this.el._vue_directives || [];
    this.el._vue_directives.push(this);
  }
}

/**
 * Initialize the directive, mixin definition properties,
 * setup the watcher, call definition bind() and update()
 * if present.
 *
 * @param {Object} def
 */

Directive.prototype._bind = function () {
  var name = this.name;
  var descriptor = this.descriptor;

  // remove attribute
  if ((name !== 'cloak' || this.vm._isCompiled) && this.el && this.el.removeAttribute) {
    var attr = descriptor.attr || 'v-' + name;
    this.el.removeAttribute(attr);
  }

  // copy def properties
  var def = descriptor.def;
  if (typeof def === 'function') {
    this.update = def;
  } else {
    extend(this, def);
  }

  // setup directive params
  this._setupParams();

  // initial bind
  if (this.bind) {
    this.bind();
  }
  this._bound = true;

  if (this.literal) {
    this.update && this.update(descriptor.raw);
  } else if ((this.expression || this.modifiers) && (this.update || this.twoWay) && !this._checkStatement()) {
    // wrapped updater for context
    var dir = this;
    if (this.update) {
      this._update = function (val, oldVal) {
        if (!dir._locked) {
          dir.update(val, oldVal);
        }
      };
    } else {
      this._update = noop;
    }
    var preProcess = this._preProcess ? bind(this._preProcess, this) : null;
    var postProcess = this._postProcess ? bind(this._postProcess, this) : null;
    var watcher = this._watcher = new Watcher(this.vm, this.expression, this._update, // callback
    {
      filters: this.filters,
      twoWay: this.twoWay,
      deep: this.deep,
      preProcess: preProcess,
      postProcess: postProcess,
      scope: this._scope
    });
    // v-model with inital inline value need to sync back to
    // model instead of update to DOM on init. They would
    // set the afterBind hook to indicate that.
    if (this.afterBind) {
      this.afterBind();
    } else if (this.update) {
      this.update(watcher.value);
    }
  }
};

/**
 * Setup all param attributes, e.g. track-by,
 * transition-mode, etc...
 */

Directive.prototype._setupParams = function () {
  if (!this.params) {
    return;
  }
  var params = this.params;
  // swap the params array with a fresh object.
  this.params = Object.create(null);
  var i = params.length;
  var key, val, mappedKey;
  while (i--) {
    key = params[i];
    mappedKey = camelize(key);
    val = getBindAttr(this.el, key);
    if (val != null) {
      // dynamic
      this._setupParamWatcher(mappedKey, val);
    } else {
      // static
      val = getAttr(this.el, key);
      if (val != null) {
        this.params[mappedKey] = val === '' ? true : val;
      }
    }
  }
};

/**
 * Setup a watcher for a dynamic param.
 *
 * @param {String} key
 * @param {String} expression
 */

Directive.prototype._setupParamWatcher = function (key, expression) {
  var self = this;
  var called = false;
  var unwatch = (this._scope || this.vm).$watch(expression, function (val, oldVal) {
    self.params[key] = val;
    // since we are in immediate mode,
    // only call the param change callbacks if this is not the first update.
    if (called) {
      var cb = self.paramWatchers && self.paramWatchers[key];
      if (cb) {
        cb.call(self, val, oldVal);
      }
    } else {
      called = true;
    }
  }, {
    immediate: true,
    user: false
  });(this._paramUnwatchFns || (this._paramUnwatchFns = [])).push(unwatch);
};

/**
 * Check if the directive is a function caller
 * and if the expression is a callable one. If both true,
 * we wrap up the expression and use it as the event
 * handler.
 *
 * e.g. on-click="a++"
 *
 * @return {Boolean}
 */

Directive.prototype._checkStatement = function () {
  var expression = this.expression;
  if (expression && this.acceptStatement && !isSimplePath(expression)) {
    var fn = parseExpression(expression).get;
    var scope = this._scope || this.vm;
    var handler = function handler(e) {
      scope.$event = e;
      fn.call(scope, scope);
      scope.$event = null;
    };
    if (this.filters) {
      handler = scope._applyFilters(handler, null, this.filters);
    }
    this.update(handler);
    return true;
  }
};

/**
 * Set the corresponding value with the setter.
 * This should only be used in two-way directives
 * e.g. v-model.
 *
 * @param {*} value
 * @public
 */

Directive.prototype.set = function (value) {
  /* istanbul ignore else */
  if (this.twoWay) {
    this._withLock(function () {
      this._watcher.set(value);
    });
  } else if (process.env.NODE_ENV !== 'production') {
    warn('Directive.set() can only be used inside twoWay' + 'directives.');
  }
};

/**
 * Execute a function while preventing that function from
 * triggering updates on this directive instance.
 *
 * @param {Function} fn
 */

Directive.prototype._withLock = function (fn) {
  var self = this;
  self._locked = true;
  fn.call(self);
  nextTick(function () {
    self._locked = false;
  });
};

/**
 * Convenience method that attaches a DOM event listener
 * to the directive element and autometically tears it down
 * during unbind.
 *
 * @param {String} event
 * @param {Function} handler
 * @param {Boolean} [useCapture]
 */

Directive.prototype.on = function (event, handler, useCapture) {
  on(this.el, event, handler, useCapture);(this._listeners || (this._listeners = [])).push([event, handler]);
};

/**
 * Teardown the watcher and call unbind.
 */

Directive.prototype._teardown = function () {
  if (this._bound) {
    this._bound = false;
    if (this.unbind) {
      this.unbind();
    }
    if (this._watcher) {
      this._watcher.teardown();
    }
    var listeners = this._listeners;
    var i;
    if (listeners) {
      i = listeners.length;
      while (i--) {
        off(this.el, listeners[i][0], listeners[i][1]);
      }
    }
    var unwatchFns = this._paramUnwatchFns;
    if (unwatchFns) {
      i = unwatchFns.length;
      while (i--) {
        unwatchFns[i]();
      }
    }
    if (process.env.NODE_ENV !== 'production' && this.el) {
      this.el._vue_directives.$remove(this);
    }
    this.vm = this.el = this._watcher = this._listeners = null;
  }
};

function lifecycleMixin (Vue) {
  /**
   * Update v-ref for component.
   *
   * @param {Boolean} remove
   */

  Vue.prototype._updateRef = function (remove) {
    var ref = this.$options._ref;
    if (ref) {
      var refs = (this._scope || this._context).$refs;
      if (remove) {
        if (refs[ref] === this) {
          refs[ref] = null;
        }
      } else {
        refs[ref] = this;
      }
    }
  };

  /**
   * Transclude, compile and link element.
   *
   * If a pre-compiled linker is available, that means the
   * passed in element will be pre-transcluded and compiled
   * as well - all we need to do is to call the linker.
   *
   * Otherwise we need to call transclude/compile/link here.
   *
   * @param {Element} el
   */

  Vue.prototype._compile = function (el) {
    var options = this.$options;

    // transclude and init element
    // transclude can potentially replace original
    // so we need to keep reference; this step also injects
    // the template and caches the original attributes
    // on the container node and replacer node.
    var original = el;
    el = transclude(el, options);
    this._initElement(el);

    // handle v-pre on root node (#2026)
    if (el.nodeType === 1 && getAttr(el, 'v-pre') !== null) {
      return;
    }

    // root is always compiled per-instance, because
    // container attrs and props can be different every time.
    var contextOptions = this._context && this._context.$options;
    var rootLinker = compileRoot(el, options, contextOptions);

    // scan for slot distribution before compiling the content
    // so that it's decoupeld from slot/directive compilation order
    scanSlots(el, options._content, this);

    // compile and link the rest
    var contentLinkFn;
    var ctor = this.constructor;
    // component compilation can be cached
    // as long as it's not using inline-template
    if (options._linkerCachable) {
      contentLinkFn = ctor.linker;
      if (!contentLinkFn) {
        contentLinkFn = ctor.linker = compile(el, options);
      }
    }

    // link phase
    // make sure to link root with prop scope!
    var rootUnlinkFn = rootLinker(this, el, this._scope);
    var contentUnlinkFn = contentLinkFn ? contentLinkFn(this, el) : compile(el, options)(this, el);

    // register composite unlink function
    // to be called during instance destruction
    this._unlinkFn = function () {
      rootUnlinkFn();
      // passing destroying: true to avoid searching and
      // splicing the directives
      contentUnlinkFn(true);
    };

    // finally replace original
    if (options.replace) {
      replace(original, el);
    }

    this._isCompiled = true;
    this._callHook('compiled');
  };

  /**
   * Initialize instance element. Called in the public
   * $mount() method.
   *
   * @param {Element} el
   */

  Vue.prototype._initElement = function (el) {
    if (isFragment(el)) {
      this._isFragment = true;
      this.$el = this._fragmentStart = el.firstChild;
      this._fragmentEnd = el.lastChild;
      // set persisted text anchors to empty
      if (this._fragmentStart.nodeType === 3) {
        this._fragmentStart.data = this._fragmentEnd.data = '';
      }
      this._fragment = el;
    } else {
      this.$el = el;
    }
    this.$el.__vue__ = this;
    this._callHook('beforeCompile');
  };

  /**
   * Create and bind a directive to an element.
   *
   * @param {String} name - directive name
   * @param {Node} node   - target node
   * @param {Object} desc - parsed directive descriptor
   * @param {Object} def  - directive definition object
   * @param {Vue} [host] - transclusion host component
   * @param {Object} [scope] - v-for scope
   * @param {Fragment} [frag] - owner fragment
   */

  Vue.prototype._bindDir = function (descriptor, node, host, scope, frag) {
    this._directives.push(new Directive(descriptor, this, node, host, scope, frag));
  };

  /**
   * Teardown an instance, unobserves the data, unbind all the
   * directives, turn off all the event listeners, etc.
   *
   * @param {Boolean} remove - whether to remove the DOM node.
   * @param {Boolean} deferCleanup - if true, defer cleanup to
   *                                 be called later
   */

  Vue.prototype._destroy = function (remove, deferCleanup) {
    if (this._isBeingDestroyed) {
      if (!deferCleanup) {
        this._cleanup();
      }
      return;
    }

    var destroyReady;
    var pendingRemoval;

    var self = this;
    // Cleanup should be called either synchronously or asynchronoysly as
    // callback of this.$remove(), or if remove and deferCleanup are false.
    // In any case it should be called after all other removing, unbinding and
    // turning of is done
    var cleanupIfPossible = function cleanupIfPossible() {
      if (destroyReady && !pendingRemoval && !deferCleanup) {
        self._cleanup();
      }
    };

    // remove DOM element
    if (remove && this.$el) {
      pendingRemoval = true;
      this.$remove(function () {
        pendingRemoval = false;
        cleanupIfPossible();
      });
    }

    this._callHook('beforeDestroy');
    this._isBeingDestroyed = true;
    var i;
    // remove self from parent. only necessary
    // if parent is not being destroyed as well.
    var parent = this.$parent;
    if (parent && !parent._isBeingDestroyed) {
      parent.$children.$remove(this);
      // unregister ref (remove: true)
      this._updateRef(true);
    }
    // destroy all children.
    i = this.$children.length;
    while (i--) {
      this.$children[i].$destroy();
    }
    // teardown props
    if (this._propsUnlinkFn) {
      this._propsUnlinkFn();
    }
    // teardown all directives. this also tearsdown all
    // directive-owned watchers.
    if (this._unlinkFn) {
      this._unlinkFn();
    }
    i = this._watchers.length;
    while (i--) {
      this._watchers[i].teardown();
    }
    // remove reference to self on $el
    if (this.$el) {
      this.$el.__vue__ = null;
    }

    destroyReady = true;
    cleanupIfPossible();
  };

  /**
   * Clean up to ensure garbage collection.
   * This is called after the leave transition if there
   * is any.
   */

  Vue.prototype._cleanup = function () {
    if (this._isDestroyed) {
      return;
    }
    // remove self from owner fragment
    // do it in cleanup so that we can call $destroy with
    // defer right when a fragment is about to be removed.
    if (this._frag) {
      this._frag.children.$remove(this);
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (this._data.__ob__) {
      this._data.__ob__.removeVm(this);
    }
    // Clean up references to private properties and other
    // instances. preserve reference to _data so that proxy
    // accessors still work. The only potential side effect
    // here is that mutating the instance after it's destroyed
    // may affect the state of other components that are still
    // observing the same object, but that seems to be a
    // reasonable responsibility for the user rather than
    // always throwing an error on them.
    this.$el = this.$parent = this.$root = this.$children = this._watchers = this._context = this._scope = this._directives = null;
    // call the last hook...
    this._isDestroyed = true;
    this._callHook('destroyed');
    // turn off all instance listeners.
    this.$off();
  };
}

function miscMixin (Vue) {
  /**
   * Apply a list of filter (descriptors) to a value.
   * Using plain for loops here because this will be called in
   * the getter of any watcher with filters so it is very
   * performance sensitive.
   *
   * @param {*} value
   * @param {*} [oldValue]
   * @param {Array} filters
   * @param {Boolean} write
   * @return {*}
   */

  Vue.prototype._applyFilters = function (value, oldValue, filters, write) {
    var filter, fn, args, arg, offset, i, l, j, k;
    for (i = 0, l = filters.length; i < l; i++) {
      filter = filters[i];
      fn = resolveAsset(this.$options, 'filters', filter.name);
      if (process.env.NODE_ENV !== 'production') {
        assertAsset(fn, 'filter', filter.name);
      }
      if (!fn) continue;
      fn = write ? fn.write : fn.read || fn;
      if (typeof fn !== 'function') continue;
      args = write ? [value, oldValue] : [value];
      offset = write ? 2 : 1;
      if (filter.args) {
        for (j = 0, k = filter.args.length; j < k; j++) {
          arg = filter.args[j];
          args[j + offset] = arg.dynamic ? this.$get(arg.value) : arg.value;
        }
      }
      value = fn.apply(this, args);
    }
    return value;
  };

  /**
   * Resolve a component, depending on whether the component
   * is defined normally or using an async factory function.
   * Resolves synchronously if already resolved, otherwise
   * resolves asynchronously and caches the resolved
   * constructor on the factory.
   *
   * @param {String} id
   * @param {Function} cb
   */

  Vue.prototype._resolveComponent = function (id, cb) {
    var factory = resolveAsset(this.$options, 'components', id);
    if (process.env.NODE_ENV !== 'production') {
      assertAsset(factory, 'component', id);
    }
    if (!factory) {
      return;
    }
    // async component factory
    if (!factory.options) {
      if (factory.resolved) {
        // cached
        cb(factory.resolved);
      } else if (factory.requested) {
        // pool callbacks
        factory.pendingCallbacks.push(cb);
      } else {
        factory.requested = true;
        var cbs = factory.pendingCallbacks = [cb];
        factory.call(this, function resolve(res) {
          if (isPlainObject(res)) {
            res = Vue.extend(res);
          }
          // cache resolved
          factory.resolved = res;
          // invoke callbacks
          for (var i = 0, l = cbs.length; i < l; i++) {
            cbs[i](res);
          }
        }, function reject(reason) {
          process.env.NODE_ENV !== 'production' && warn('Failed to resolve async component: ' + id + '. ' + (reason ? '\nReason: ' + reason : ''));
        });
      }
    } else {
      // normal component
      cb(factory);
    }
  };
}

var filterRE$1 = /[^|]\|[^|]/;

function dataAPI (Vue) {
  /**
   * Get the value from an expression on this vm.
   *
   * @param {String} exp
   * @param {Boolean} [asStatement]
   * @return {*}
   */

  Vue.prototype.$get = function (exp, asStatement) {
    var res = parseExpression(exp);
    if (res) {
      if (asStatement && !isSimplePath(exp)) {
        var self = this;
        return function statementHandler() {
          self.$arguments = toArray(arguments);
          var result = res.get.call(self, self);
          self.$arguments = null;
          return result;
        };
      } else {
        try {
          return res.get.call(this, this);
        } catch (e) {}
      }
    }
  };

  /**
   * Set the value from an expression on this vm.
   * The expression must be a valid left-hand
   * expression in an assignment.
   *
   * @param {String} exp
   * @param {*} val
   */

  Vue.prototype.$set = function (exp, val) {
    var res = parseExpression(exp, true);
    if (res && res.set) {
      res.set.call(this, this, val);
    }
  };

  /**
   * Delete a property on the VM
   *
   * @param {String} key
   */

  Vue.prototype.$delete = function (key) {
    del(this._data, key);
  };

  /**
   * Watch an expression, trigger callback when its
   * value changes.
   *
   * @param {String|Function} expOrFn
   * @param {Function} cb
   * @param {Object} [options]
   *                 - {Boolean} deep
   *                 - {Boolean} immediate
   * @return {Function} - unwatchFn
   */

  Vue.prototype.$watch = function (expOrFn, cb, options) {
    var vm = this;
    var parsed;
    if (typeof expOrFn === 'string') {
      parsed = parseDirective(expOrFn);
      expOrFn = parsed.expression;
    }
    var watcher = new Watcher(vm, expOrFn, cb, {
      deep: options && options.deep,
      sync: options && options.sync,
      filters: parsed && parsed.filters,
      user: !options || options.user !== false
    });
    if (options && options.immediate) {
      cb.call(vm, watcher.value);
    }
    return function unwatchFn() {
      watcher.teardown();
    };
  };

  /**
   * Evaluate a text directive, including filters.
   *
   * @param {String} text
   * @param {Boolean} [asStatement]
   * @return {String}
   */

  Vue.prototype.$eval = function (text, asStatement) {
    // check for filters.
    if (filterRE$1.test(text)) {
      var dir = parseDirective(text);
      // the filter regex check might give false positive
      // for pipes inside strings, so it's possible that
      // we don't get any filters here
      var val = this.$get(dir.expression, asStatement);
      return dir.filters ? this._applyFilters(val, null, dir.filters) : val;
    } else {
      // no filter
      return this.$get(text, asStatement);
    }
  };

  /**
   * Interpolate a piece of template text.
   *
   * @param {String} text
   * @return {String}
   */

  Vue.prototype.$interpolate = function (text) {
    var tokens = parseText(text);
    var vm = this;
    if (tokens) {
      if (tokens.length === 1) {
        return vm.$eval(tokens[0].value) + '';
      } else {
        return tokens.map(function (token) {
          return token.tag ? vm.$eval(token.value) : token.value;
        }).join('');
      }
    } else {
      return text;
    }
  };

  /**
   * Log instance data as a plain JS object
   * so that it is easier to inspect in console.
   * This method assumes console is available.
   *
   * @param {String} [path]
   */

  Vue.prototype.$log = function (path) {
    var data = path ? getPath(this._data, path) : this._data;
    if (data) {
      data = clean(data);
    }
    // include computed fields
    if (!path) {
      for (var key in this.$options.computed) {
        data[key] = clean(this[key]);
      }
    }
    console.log(data);
  };

  /**
   * "clean" a getter/setter converted object into a plain
   * object copy.
   *
   * @param {Object} - obj
   * @return {Object}
   */

  function clean(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
}

function domAPI (Vue) {
  /**
   * Convenience on-instance nextTick. The callback is
   * auto-bound to the instance, and this avoids component
   * modules having to rely on the global Vue.
   *
   * @param {Function} fn
   */

  Vue.prototype.$nextTick = function (fn) {
    nextTick(fn, this);
  };

  /**
   * Append instance to target
   *
   * @param {Node} target
   * @param {Function} [cb]
   * @param {Boolean} [withTransition] - defaults to true
   */

  Vue.prototype.$appendTo = function (target, cb, withTransition) {
    return insert(this, target, cb, withTransition, append, appendWithTransition);
  };

  /**
   * Prepend instance to target
   *
   * @param {Node} target
   * @param {Function} [cb]
   * @param {Boolean} [withTransition] - defaults to true
   */

  Vue.prototype.$prependTo = function (target, cb, withTransition) {
    target = query(target);
    if (target.hasChildNodes()) {
      this.$before(target.firstChild, cb, withTransition);
    } else {
      this.$appendTo(target, cb, withTransition);
    }
    return this;
  };

  /**
   * Insert instance before target
   *
   * @param {Node} target
   * @param {Function} [cb]
   * @param {Boolean} [withTransition] - defaults to true
   */

  Vue.prototype.$before = function (target, cb, withTransition) {
    return insert(this, target, cb, withTransition, beforeWithCb, beforeWithTransition);
  };

  /**
   * Insert instance after target
   *
   * @param {Node} target
   * @param {Function} [cb]
   * @param {Boolean} [withTransition] - defaults to true
   */

  Vue.prototype.$after = function (target, cb, withTransition) {
    target = query(target);
    if (target.nextSibling) {
      this.$before(target.nextSibling, cb, withTransition);
    } else {
      this.$appendTo(target.parentNode, cb, withTransition);
    }
    return this;
  };

  /**
   * Remove instance from DOM
   *
   * @param {Function} [cb]
   * @param {Boolean} [withTransition] - defaults to true
   */

  Vue.prototype.$remove = function (cb, withTransition) {
    if (!this.$el.parentNode) {
      return cb && cb();
    }
    var inDocument = this._isAttached && inDoc(this.$el);
    // if we are not in document, no need to check
    // for transitions
    if (!inDocument) withTransition = false;
    var self = this;
    var realCb = function realCb() {
      if (inDocument) self._callHook('detached');
      if (cb) cb();
    };
    if (this._isFragment) {
      removeNodeRange(this._fragmentStart, this._fragmentEnd, this, this._fragment, realCb);
    } else {
      var op = withTransition === false ? removeWithCb : removeWithTransition;
      op(this.$el, this, realCb);
    }
    return this;
  };

  /**
   * Shared DOM insertion function.
   *
   * @param {Vue} vm
   * @param {Element} target
   * @param {Function} [cb]
   * @param {Boolean} [withTransition]
   * @param {Function} op1 - op for non-transition insert
   * @param {Function} op2 - op for transition insert
   * @return vm
   */

  function insert(vm, target, cb, withTransition, op1, op2) {
    target = query(target);
    var targetIsDetached = !inDoc(target);
    var op = withTransition === false || targetIsDetached ? op1 : op2;
    var shouldCallHook = !targetIsDetached && !vm._isAttached && !inDoc(vm.$el);
    if (vm._isFragment) {
      mapNodeRange(vm._fragmentStart, vm._fragmentEnd, function (node) {
        op(node, target, vm);
      });
      cb && cb();
    } else {
      op(vm.$el, target, vm, cb);
    }
    if (shouldCallHook) {
      vm._callHook('attached');
    }
    return vm;
  }

  /**
   * Check for selectors
   *
   * @param {String|Element} el
   */

  function query(el) {
    return typeof el === 'string' ? document.querySelector(el) : el;
  }

  /**
   * Append operation that takes a callback.
   *
   * @param {Node} el
   * @param {Node} target
   * @param {Vue} vm - unused
   * @param {Function} [cb]
   */

  function append(el, target, vm, cb) {
    target.appendChild(el);
    if (cb) cb();
  }

  /**
   * InsertBefore operation that takes a callback.
   *
   * @param {Node} el
   * @param {Node} target
   * @param {Vue} vm - unused
   * @param {Function} [cb]
   */

  function beforeWithCb(el, target, vm, cb) {
    before(el, target);
    if (cb) cb();
  }

  /**
   * Remove operation that takes a callback.
   *
   * @param {Node} el
   * @param {Vue} vm - unused
   * @param {Function} [cb]
   */

  function removeWithCb(el, vm, cb) {
    remove(el);
    if (cb) cb();
  }
}

function eventsAPI (Vue) {
  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   */

  Vue.prototype.$on = function (event, fn) {
    (this._events[event] || (this._events[event] = [])).push(fn);
    modifyListenerCount(this, event, 1);
    return this;
  };

  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   */

  Vue.prototype.$once = function (event, fn) {
    var self = this;
    function on() {
      self.$off(event, on);
      fn.apply(this, arguments);
    }
    on.fn = fn;
    this.$on(event, on);
    return this;
  };

  /**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   */

  Vue.prototype.$off = function (event, fn) {
    var cbs;
    // all
    if (!arguments.length) {
      if (this.$parent) {
        for (event in this._events) {
          cbs = this._events[event];
          if (cbs) {
            modifyListenerCount(this, event, -cbs.length);
          }
        }
      }
      this._events = {};
      return this;
    }
    // specific event
    cbs = this._events[event];
    if (!cbs) {
      return this;
    }
    if (arguments.length === 1) {
      modifyListenerCount(this, event, -cbs.length);
      this._events[event] = null;
      return this;
    }
    // specific handler
    var cb;
    var i = cbs.length;
    while (i--) {
      cb = cbs[i];
      if (cb === fn || cb.fn === fn) {
        modifyListenerCount(this, event, -1);
        cbs.splice(i, 1);
        break;
      }
    }
    return this;
  };

  /**
   * Trigger an event on self.
   *
   * @param {String|Object} event
   * @return {Boolean} shouldPropagate
   */

  Vue.prototype.$emit = function (event) {
    var isSource = typeof event === 'string';
    event = isSource ? event : event.name;
    var cbs = this._events[event];
    var shouldPropagate = isSource || !cbs;
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      // this is a somewhat hacky solution to the question raised
      // in #2102: for an inline component listener like <comp @test="doThis">,
      // the propagation handling is somewhat broken. Therefore we
      // need to treat these inline callbacks differently.
      var hasParentCbs = isSource && cbs.some(function (cb) {
        return cb._fromParent;
      });
      if (hasParentCbs) {
        shouldPropagate = false;
      }
      var args = toArray(arguments, 1);
      for (var i = 0, l = cbs.length; i < l; i++) {
        var cb = cbs[i];
        var res = cb.apply(this, args);
        if (res === true && (!hasParentCbs || cb._fromParent)) {
          shouldPropagate = true;
        }
      }
    }
    return shouldPropagate;
  };

  /**
   * Recursively broadcast an event to all children instances.
   *
   * @param {String|Object} event
   * @param {...*} additional arguments
   */

  Vue.prototype.$broadcast = function (event) {
    var isSource = typeof event === 'string';
    event = isSource ? event : event.name;
    // if no child has registered for this event,
    // then there's no need to broadcast.
    if (!this._eventsCount[event]) return;
    var children = this.$children;
    var args = toArray(arguments);
    if (isSource) {
      // use object event to indicate non-source emit
      // on children
      args[0] = { name: event, source: this };
    }
    for (var i = 0, l = children.length; i < l; i++) {
      var child = children[i];
      var shouldPropagate = child.$emit.apply(child, args);
      if (shouldPropagate) {
        child.$broadcast.apply(child, args);
      }
    }
    return this;
  };

  /**
   * Recursively propagate an event up the parent chain.
   *
   * @param {String} event
   * @param {...*} additional arguments
   */

  Vue.prototype.$dispatch = function (event) {
    var shouldPropagate = this.$emit.apply(this, arguments);
    if (!shouldPropagate) return;
    var parent = this.$parent;
    var args = toArray(arguments);
    // use object event to indicate non-source emit
    // on parents
    args[0] = { name: event, source: this };
    while (parent) {
      shouldPropagate = parent.$emit.apply(parent, args);
      parent = shouldPropagate ? parent.$parent : null;
    }
    return this;
  };

  /**
   * Modify the listener counts on all parents.
   * This bookkeeping allows $broadcast to return early when
   * no child has listened to a certain event.
   *
   * @param {Vue} vm
   * @param {String} event
   * @param {Number} count
   */

  var hookRE = /^hook:/;
  function modifyListenerCount(vm, event, count) {
    var parent = vm.$parent;
    // hooks do not get broadcasted so no need
    // to do bookkeeping for them
    if (!parent || !count || hookRE.test(event)) return;
    while (parent) {
      parent._eventsCount[event] = (parent._eventsCount[event] || 0) + count;
      parent = parent.$parent;
    }
  }
}

function lifecycleAPI (Vue) {
  /**
   * Set instance target element and kick off the compilation
   * process. The passed in `el` can be a selector string, an
   * existing Element, or a DocumentFragment (for block
   * instances).
   *
   * @param {Element|DocumentFragment|string} el
   * @public
   */

  Vue.prototype.$mount = function (el) {
    if (this._isCompiled) {
      process.env.NODE_ENV !== 'production' && warn('$mount() should be called only once.');
      return;
    }
    el = query(el);
    if (!el) {
      el = document.createElement('div');
    }
    this._compile(el);
    this._initDOMHooks();
    if (inDoc(this.$el)) {
      this._callHook('attached');
      ready.call(this);
    } else {
      this.$once('hook:attached', ready);
    }
    return this;
  };

  /**
   * Mark an instance as ready.
   */

  function ready() {
    this._isAttached = true;
    this._isReady = true;
    this._callHook('ready');
  }

  /**
   * Teardown the instance, simply delegate to the internal
   * _destroy.
   */

  Vue.prototype.$destroy = function (remove, deferCleanup) {
    this._destroy(remove, deferCleanup);
  };

  /**
   * Partially compile a piece of DOM and return a
   * decompile function.
   *
   * @param {Element|DocumentFragment} el
   * @param {Vue} [host]
   * @return {Function}
   */

  Vue.prototype.$compile = function (el, host, scope, frag) {
    return compile(el, this.$options, true)(this, el, host, scope, frag);
  };
}

/**
 * The exposed Vue constructor.
 *
 * API conventions:
 * - public API methods/properties are prefixed with `$`
 * - internal methods/properties are prefixed with `_`
 * - non-prefixed properties are assumed to be proxied user
 *   data.
 *
 * @constructor
 * @param {Object} [options]
 * @public
 */

function Vue(options) {
  this._init(options);
}

// install internals
initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
miscMixin(Vue);

// install instance APIs
dataAPI(Vue);
domAPI(Vue);
eventsAPI(Vue);
lifecycleAPI(Vue);

var slot = {

  priority: SLOT,
  params: ['name'],

  bind: function bind() {
    // this was resolved during component transclusion
    var name = this.params.name || 'default';
    var content = this.vm._slotContents && this.vm._slotContents[name];
    if (!content || !content.hasChildNodes()) {
      this.fallback();
    } else {
      this.compile(content.cloneNode(true), this.vm._context, this.vm);
    }
  },

  compile: function compile(content, context, host) {
    if (content && context) {
      if (this.el.hasChildNodes() && content.childNodes.length === 1 && content.childNodes[0].nodeType === 1 && content.childNodes[0].hasAttribute('v-if')) {
        // if the inserted slot has v-if
        // inject fallback content as the v-else
        var elseBlock = document.createElement('template');
        elseBlock.setAttribute('v-else', '');
        elseBlock.innerHTML = this.el.innerHTML;
        // the else block should be compiled in child scope
        elseBlock._context = this.vm;
        content.appendChild(elseBlock);
      }
      var scope = host ? host._scope : this._scope;
      this.unlink = context.$compile(content, host, scope, this._frag);
    }
    if (content) {
      replace(this.el, content);
    } else {
      remove(this.el);
    }
  },

  fallback: function fallback() {
    this.compile(extractContent(this.el, true), this.vm);
  },

  unbind: function unbind() {
    if (this.unlink) {
      this.unlink();
    }
  }
};

var partial = {

  priority: PARTIAL,

  params: ['name'],

  // watch changes to name for dynamic partials
  paramWatchers: {
    name: function name(value) {
      vIf.remove.call(this);
      if (value) {
        this.insert(value);
      }
    }
  },

  bind: function bind() {
    this.anchor = createAnchor('v-partial');
    replace(this.el, this.anchor);
    this.insert(this.params.name);
  },

  insert: function insert(id) {
    var partial = resolveAsset(this.vm.$options, 'partials', id);
    if (process.env.NODE_ENV !== 'production') {
      assertAsset(partial, 'partial', id);
    }
    if (partial) {
      this.factory = new FragmentFactory(this.vm, partial);
      vIf.insert.call(this);
    }
  },

  unbind: function unbind() {
    if (this.frag) {
      this.frag.destroy();
    }
  }
};

var elementDirectives = {
  slot: slot,
  partial: partial
};

var convertArray = vFor._postProcess;

/**
 * Limit filter for arrays
 *
 * @param {Number} n
 * @param {Number} offset (Decimal expected)
 */

function limitBy(arr, n, offset) {
  offset = offset ? parseInt(offset, 10) : 0;
  n = toNumber(n);
  return typeof n === 'number' ? arr.slice(offset, offset + n) : arr;
}

/**
 * Filter filter for arrays
 *
 * @param {String} search
 * @param {String} [delimiter]
 * @param {String} ...dataKeys
 */

function filterBy(arr, search, delimiter) {
  arr = convertArray(arr);
  if (search == null) {
    return arr;
  }
  if (typeof search === 'function') {
    return arr.filter(search);
  }
  // cast to lowercase string
  search = ('' + search).toLowerCase();
  // allow optional `in` delimiter
  // because why not
  var n = delimiter === 'in' ? 3 : 2;
  // extract and flatten keys
  var keys = toArray(arguments, n).reduce(function (prev, cur) {
    return prev.concat(cur);
  }, []);
  var res = [];
  var item, key, val, j;
  for (var i = 0, l = arr.length; i < l; i++) {
    item = arr[i];
    val = item && item.$value || item;
    j = keys.length;
    if (j) {
      while (j--) {
        key = keys[j];
        if (key === '$key' && contains$1(item.$key, search) || contains$1(getPath(val, key), search)) {
          res.push(item);
          break;
        }
      }
    } else if (contains$1(item, search)) {
      res.push(item);
    }
  }
  return res;
}

/**
 * Filter filter for arrays
 *
 * @param {String} sortKey
 * @param {String} reverse
 */

function orderBy(arr, sortKey, reverse) {
  arr = convertArray(arr);
  if (!sortKey) {
    return arr;
  }
  var order = reverse && reverse < 0 ? -1 : 1;
  // sort on a copy to avoid mutating original array
  return arr.slice().sort(function (a, b) {
    if (sortKey !== '$key') {
      if (isObject(a) && '$value' in a) a = a.$value;
      if (isObject(b) && '$value' in b) b = b.$value;
    }
    a = isObject(a) ? getPath(a, sortKey) : a;
    b = isObject(b) ? getPath(b, sortKey) : b;
    return a === b ? 0 : a > b ? order : -order;
  });
}

/**
 * String contain helper
 *
 * @param {*} val
 * @param {String} search
 */

function contains$1(val, search) {
  var i;
  if (isPlainObject(val)) {
    var keys = Object.keys(val);
    i = keys.length;
    while (i--) {
      if (contains$1(val[keys[i]], search)) {
        return true;
      }
    }
  } else if (isArray(val)) {
    i = val.length;
    while (i--) {
      if (contains$1(val[i], search)) {
        return true;
      }
    }
  } else if (val != null) {
    return val.toString().toLowerCase().indexOf(search) > -1;
  }
}

var digitsRE = /(\d{3})(?=\d)/g;

// asset collections must be a plain object.
var filters = {

  orderBy: orderBy,
  filterBy: filterBy,
  limitBy: limitBy,

  /**
   * Stringify value.
   *
   * @param {Number} indent
   */

  json: {
    read: function read(value, indent) {
      return typeof value === 'string' ? value : JSON.stringify(value, null, Number(indent) || 2);
    },
    write: function write(value) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
  },

  /**
   * 'abc' => 'Abc'
   */

  capitalize: function capitalize(value) {
    if (!value && value !== 0) return '';
    value = value.toString();
    return value.charAt(0).toUpperCase() + value.slice(1);
  },

  /**
   * 'abc' => 'ABC'
   */

  uppercase: function uppercase(value) {
    return value || value === 0 ? value.toString().toUpperCase() : '';
  },

  /**
   * 'AbC' => 'abc'
   */

  lowercase: function lowercase(value) {
    return value || value === 0 ? value.toString().toLowerCase() : '';
  },

  /**
   * 12345 => $12,345.00
   *
   * @param {String} sign
   */

  currency: function currency(value, _currency) {
    value = parseFloat(value);
    if (!isFinite(value) || !value && value !== 0) return '';
    _currency = _currency != null ? _currency : '$';
    var stringified = Math.abs(value).toFixed(2);
    var _int = stringified.slice(0, -3);
    var i = _int.length % 3;
    var head = i > 0 ? _int.slice(0, i) + (_int.length > 3 ? ',' : '') : '';
    var _float = stringified.slice(-3);
    var sign = value < 0 ? '-' : '';
    return sign + _currency + head + _int.slice(i).replace(digitsRE, '$1,') + _float;
  },

  /**
   * 'item' => 'items'
   *
   * @params
   *  an array of strings corresponding to
   *  the single, double, triple ... forms of the word to
   *  be pluralized. When the number to be pluralized
   *  exceeds the length of the args, it will use the last
   *  entry in the array.
   *
   *  e.g. ['single', 'double', 'triple', 'multiple']
   */

  pluralize: function pluralize(value) {
    var args = toArray(arguments, 1);
    return args.length > 1 ? args[value % 10 - 1] || args[args.length - 1] : args[0] + (value === 1 ? '' : 's');
  },

  /**
   * Debounce a handler function.
   *
   * @param {Function} handler
   * @param {Number} delay = 300
   * @return {Function}
   */

  debounce: function debounce(handler, delay) {
    if (!handler) return;
    if (!delay) {
      delay = 300;
    }
    return _debounce(handler, delay);
  }
};

function installGlobalAPI (Vue) {
  /**
   * Vue and every constructor that extends Vue has an
   * associated options object, which can be accessed during
   * compilation steps as `this.constructor.options`.
   *
   * These can be seen as the default options of every
   * Vue instance.
   */

  Vue.options = {
    directives: directives,
    elementDirectives: elementDirectives,
    filters: filters,
    transitions: {},
    components: {},
    partials: {},
    replace: true
  };

  /**
   * Expose useful internals
   */

  Vue.util = util;
  Vue.config = config;
  Vue.set = set;
  Vue['delete'] = del;
  Vue.nextTick = nextTick;

  /**
   * The following are exposed for advanced usage / plugins
   */

  Vue.compiler = compiler;
  Vue.FragmentFactory = FragmentFactory;
  Vue.internalDirectives = internalDirectives;
  Vue.parsers = {
    path: path,
    text: text,
    template: template,
    directive: directive,
    expression: expression
  };

  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */

  Vue.cid = 0;
  var cid = 1;

  /**
   * Class inheritance
   *
   * @param {Object} extendOptions
   */

  Vue.extend = function (extendOptions) {
    extendOptions = extendOptions || {};
    var Super = this;
    var isFirstExtend = Super.cid === 0;
    if (isFirstExtend && extendOptions._Ctor) {
      return extendOptions._Ctor;
    }
    var name = extendOptions.name || Super.options.name;
    if (process.env.NODE_ENV !== 'production') {
      if (!/^[a-zA-Z][\w-]*$/.test(name)) {
        warn('Invalid component name: "' + name + '". Component names ' + 'can only contain alphanumeric characaters and the hyphen.');
        name = null;
      }
    }
    var Sub = createClass(name || 'VueComponent');
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.cid = cid++;
    Sub.options = mergeOptions(Super.options, extendOptions);
    Sub['super'] = Super;
    // allow further extension
    Sub.extend = Super.extend;
    // create asset registers, so extended classes
    // can have their private assets too.
    config._assetTypes.forEach(function (type) {
      Sub[type] = Super[type];
    });
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub;
    }
    // cache constructor
    if (isFirstExtend) {
      extendOptions._Ctor = Sub;
    }
    return Sub;
  };

  /**
   * A function that returns a sub-class constructor with the
   * given name. This gives us much nicer output when
   * logging instances in the console.
   *
   * @param {String} name
   * @return {Function}
   */

  function createClass(name) {
    /* eslint-disable no-new-func */
    return new Function('return function ' + classify(name) + ' (options) { this._init(options) }')();
    /* eslint-enable no-new-func */
  }

  /**
   * Plugin system
   *
   * @param {Object} plugin
   */

  Vue.use = function (plugin) {
    /* istanbul ignore if */
    if (plugin.installed) {
      return;
    }
    // additional parameters
    var args = toArray(arguments, 1);
    args.unshift(this);
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args);
    } else {
      plugin.apply(null, args);
    }
    plugin.installed = true;
    return this;
  };

  /**
   * Apply a global mixin by merging it into the default
   * options.
   */

  Vue.mixin = function (mixin) {
    Vue.options = mergeOptions(Vue.options, mixin);
  };

  /**
   * Create asset registration methods with the following
   * signature:
   *
   * @param {String} id
   * @param {*} definition
   */

  config._assetTypes.forEach(function (type) {
    Vue[type] = function (id, definition) {
      if (!definition) {
        return this.options[type + 's'][id];
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production') {
          if (type === 'component' && (commonTagRE.test(id) || reservedTagRE.test(id))) {
            warn('Do not use built-in or reserved HTML elements as component ' + 'id: ' + id);
          }
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = id;
          definition = Vue.extend(definition);
        }
        this.options[type + 's'][id] = definition;
        return definition;
      }
    };
  });

  // expose internal transition API
  extend(Vue.transition, transition);
}

installGlobalAPI(Vue);

Vue.version = '1.0.17';

// devtools global hook
/* istanbul ignore next */
if (devtools) {
  devtools.emit('init', Vue);
} else if (process.env.NODE_ENV !== 'production' && inBrowser && /Chrome\/\d+/.test(window.navigator.userAgent)) {
  console.log('Download the Vue Devtools for a better development experience:\n' + 'https://github.com/vuejs/vue-devtools');
}

module.exports = Vue;
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":1}],3:[function(require,module,exports){
var Vue = require('vue');

var cluser = new Vue({
  el: '#user-maker',
  data: {
    username: '',
    password: '',
    confirmpass: '',
    email: ''
  },
  computed: {
    passwords_match: function() {
      return this.password === this.confirmpass;
    }
  }
});

},{"vue":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3Z1ZS9kaXN0L3Z1ZS5jb21tb24uanMiLCJzcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvKiFcbiAqIFZ1ZS5qcyB2MS4wLjE3XG4gKiAoYykgMjAxNiBFdmFuIFlvdVxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIHNldChvYmosIGtleSwgdmFsKSB7XG4gIGlmIChoYXNPd24ob2JqLCBrZXkpKSB7XG4gICAgb2JqW2tleV0gPSB2YWw7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChvYmouX2lzVnVlKSB7XG4gICAgc2V0KG9iai5fZGF0YSwga2V5LCB2YWwpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgb2IgPSBvYmouX19vYl9fO1xuICBpZiAoIW9iKSB7XG4gICAgb2JqW2tleV0gPSB2YWw7XG4gICAgcmV0dXJuO1xuICB9XG4gIG9iLmNvbnZlcnQoa2V5LCB2YWwpO1xuICBvYi5kZXAubm90aWZ5KCk7XG4gIGlmIChvYi52bXMpIHtcbiAgICB2YXIgaSA9IG9iLnZtcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgdmFyIHZtID0gb2Iudm1zW2ldO1xuICAgICAgdm0uX3Byb3h5KGtleSk7XG4gICAgICB2bS5fZGlnZXN0KCk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWw7XG59XG5cbi8qKlxuICogRGVsZXRlIGEgcHJvcGVydHkgYW5kIHRyaWdnZXIgY2hhbmdlIGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKi9cblxuZnVuY3Rpb24gZGVsKG9iaiwga2V5KSB7XG4gIGlmICghaGFzT3duKG9iaiwga2V5KSkge1xuICAgIHJldHVybjtcbiAgfVxuICBkZWxldGUgb2JqW2tleV07XG4gIHZhciBvYiA9IG9iai5fX29iX187XG4gIGlmICghb2IpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgb2IuZGVwLm5vdGlmeSgpO1xuICBpZiAob2Iudm1zKSB7XG4gICAgdmFyIGkgPSBvYi52bXMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHZhciB2bSA9IG9iLnZtc1tpXTtcbiAgICAgIHZtLl91bnByb3h5KGtleSk7XG4gICAgICB2bS5fZGlnZXN0KCk7XG4gICAgfVxuICB9XG59XG5cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIG9iamVjdCBoYXMgdGhlIHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gaGFzT3duKG9iaiwga2V5KSB7XG4gIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhbiBleHByZXNzaW9uIGlzIGEgbGl0ZXJhbCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXhwXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbnZhciBsaXRlcmFsVmFsdWVSRSA9IC9eXFxzPyh0cnVlfGZhbHNlfC0/W1xcZFxcLl0rfCdbXiddKid8XCJbXlwiXSpcIilcXHM/JC87XG5cbmZ1bmN0aW9uIGlzTGl0ZXJhbChleHApIHtcbiAgcmV0dXJuIGxpdGVyYWxWYWx1ZVJFLnRlc3QoZXhwKTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIHN0cmluZyBzdGFydHMgd2l0aCAkIG9yIF9cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZ1bmN0aW9uIGlzUmVzZXJ2ZWQoc3RyKSB7XG4gIHZhciBjID0gKHN0ciArICcnKS5jaGFyQ29kZUF0KDApO1xuICByZXR1cm4gYyA9PT0gMHgyNCB8fCBjID09PSAweDVGO1xufVxuXG4vKipcbiAqIEd1YXJkIHRleHQgb3V0cHV0LCBtYWtlIHN1cmUgdW5kZWZpbmVkIG91dHB1dHNcbiAqIGVtcHR5IHN0cmluZ1xuICpcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiBfdG9TdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlLnRvU3RyaW5nKCk7XG59XG5cbi8qKlxuICogQ2hlY2sgYW5kIGNvbnZlcnQgcG9zc2libGUgbnVtZXJpYyBzdHJpbmdzIHRvIG51bWJlcnNcbiAqIGJlZm9yZSBzZXR0aW5nIGJhY2sgdG8gZGF0YVxuICpcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqIEByZXR1cm4geyp8TnVtYmVyfVxuICovXG5cbmZ1bmN0aW9uIHRvTnVtYmVyKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHZhciBwYXJzZWQgPSBOdW1iZXIodmFsdWUpO1xuICAgIHJldHVybiBpc05hTihwYXJzZWQpID8gdmFsdWUgOiBwYXJzZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0IHN0cmluZyBib29sZWFuIGxpdGVyYWxzIGludG8gcmVhbCBib29sZWFucy5cbiAqXG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKiBAcmV0dXJuIHsqfEJvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gdG9Cb29sZWFuKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gJ3RydWUnID8gdHJ1ZSA6IHZhbHVlID09PSAnZmFsc2UnID8gZmFsc2UgOiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBTdHJpcCBxdW90ZXMgZnJvbSBhIHN0cmluZ1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1N0cmluZyB8IGZhbHNlfVxuICovXG5cbmZ1bmN0aW9uIHN0cmlwUXVvdGVzKHN0cikge1xuICB2YXIgYSA9IHN0ci5jaGFyQ29kZUF0KDApO1xuICB2YXIgYiA9IHN0ci5jaGFyQ29kZUF0KHN0ci5sZW5ndGggLSAxKTtcbiAgcmV0dXJuIGEgPT09IGIgJiYgKGEgPT09IDB4MjIgfHwgYSA9PT0gMHgyNykgPyBzdHIuc2xpY2UoMSwgLTEpIDogc3RyO1xufVxuXG4vKipcbiAqIENhbWVsaXplIGEgaHlwaGVuLWRlbG1pdGVkIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxudmFyIGNhbWVsaXplUkUgPSAvLShcXHcpL2c7XG5cbmZ1bmN0aW9uIGNhbWVsaXplKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoY2FtZWxpemVSRSwgdG9VcHBlcik7XG59XG5cbmZ1bmN0aW9uIHRvVXBwZXIoXywgYykge1xuICByZXR1cm4gYyA/IGMudG9VcHBlckNhc2UoKSA6ICcnO1xufVxuXG4vKipcbiAqIEh5cGhlbmF0ZSBhIGNhbWVsQ2FzZSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbnZhciBoeXBoZW5hdGVSRSA9IC8oW2EtelxcZF0pKFtBLVpdKS9nO1xuXG5mdW5jdGlvbiBoeXBoZW5hdGUoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZShoeXBoZW5hdGVSRSwgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBoeXBoZW4vdW5kZXJzY29yZS9zbGFzaCBkZWxpbWl0ZXJlZCBuYW1lcyBpbnRvXG4gKiBjYW1lbGl6ZWQgY2xhc3NOYW1lcy5cbiAqXG4gKiBlLmcuIG15LWNvbXBvbmVudCA9PiBNeUNvbXBvbmVudFxuICogICAgICBzb21lX2Vsc2UgICAgPT4gU29tZUVsc2VcbiAqICAgICAgc29tZS9jb21wICAgID0+IFNvbWVDb21wXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbnZhciBjbGFzc2lmeVJFID0gLyg/Ol58Wy1fXFwvXSkoXFx3KS9nO1xuXG5mdW5jdGlvbiBjbGFzc2lmeShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKGNsYXNzaWZ5UkUsIHRvVXBwZXIpO1xufVxuXG4vKipcbiAqIFNpbXBsZSBiaW5kLCBmYXN0ZXIgdGhhbiBuYXRpdmVcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtPYmplY3R9IGN0eFxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gYmluZChmbiwgY3R4KSB7XG4gIHJldHVybiBmdW5jdGlvbiAoYSkge1xuICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICByZXR1cm4gbCA/IGwgPiAxID8gZm4uYXBwbHkoY3R4LCBhcmd1bWVudHMpIDogZm4uY2FsbChjdHgsIGEpIDogZm4uY2FsbChjdHgpO1xuICB9O1xufVxuXG4vKipcbiAqIENvbnZlcnQgYW4gQXJyYXktbGlrZSBvYmplY3QgdG8gYSByZWFsIEFycmF5LlxuICpcbiAqIEBwYXJhbSB7QXJyYXktbGlrZX0gbGlzdFxuICogQHBhcmFtIHtOdW1iZXJ9IFtzdGFydF0gLSBzdGFydCBpbmRleFxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cblxuZnVuY3Rpb24gdG9BcnJheShsaXN0LCBzdGFydCkge1xuICBzdGFydCA9IHN0YXJ0IHx8IDA7XG4gIHZhciBpID0gbGlzdC5sZW5ndGggLSBzdGFydDtcbiAgdmFyIHJldCA9IG5ldyBBcnJheShpKTtcbiAgd2hpbGUgKGktLSkge1xuICAgIHJldFtpXSA9IGxpc3RbaSArIHN0YXJ0XTtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIE1peCBwcm9wZXJ0aWVzIGludG8gdGFyZ2V0IG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdG9cbiAqIEBwYXJhbSB7T2JqZWN0fSBmcm9tXG4gKi9cblxuZnVuY3Rpb24gZXh0ZW5kKHRvLCBmcm9tKSB7XG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoZnJvbSk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICB0b1trZXlzW2ldXSA9IGZyb21ba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIHRvO1xufVxuXG4vKipcbiAqIFF1aWNrIG9iamVjdCBjaGVjayAtIHRoaXMgaXMgcHJpbWFyaWx5IHVzZWQgdG8gdGVsbFxuICogT2JqZWN0cyBmcm9tIHByaW1pdGl2ZSB2YWx1ZXMgd2hlbiB3ZSBrbm93IHRoZSB2YWx1ZVxuICogaXMgYSBKU09OLWNvbXBsaWFudCB0eXBlLlxuICpcbiAqIEBwYXJhbSB7Kn0gb2JqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZ1bmN0aW9uIGlzT2JqZWN0KG9iaikge1xuICByZXR1cm4gb2JqICE9PSBudWxsICYmIHR5cGVvZiBvYmogPT09ICdvYmplY3QnO1xufVxuXG4vKipcbiAqIFN0cmljdCBvYmplY3QgdHlwZSBjaGVjay4gT25seSByZXR1cm5zIHRydWVcbiAqIGZvciBwbGFpbiBKYXZhU2NyaXB0IG9iamVjdHMuXG4gKlxuICogQHBhcmFtIHsqfSBvYmpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnZhciBPQkpFQ1RfU1RSSU5HID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qob2JqKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09IE9CSkVDVF9TVFJJTkc7XG59XG5cbi8qKlxuICogQXJyYXkgdHlwZSBjaGVjay5cbiAqXG4gKiBAcGFyYW0geyp9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbi8qKlxuICogRGVmaW5lIGEgbm9uLWVudW1lcmFibGUgcHJvcGVydHlcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0geyp9IHZhbFxuICogQHBhcmFtIHtCb29sZWFufSBbZW51bWVyYWJsZV1cbiAqL1xuXG5mdW5jdGlvbiBkZWYob2JqLCBrZXksIHZhbCwgZW51bWVyYWJsZSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHtcbiAgICB2YWx1ZTogdmFsLFxuICAgIGVudW1lcmFibGU6ICEhZW51bWVyYWJsZSxcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSk7XG59XG5cbi8qKlxuICogRGVib3VuY2UgYSBmdW5jdGlvbiBzbyBpdCBvbmx5IGdldHMgY2FsbGVkIGFmdGVyIHRoZVxuICogaW5wdXQgc3RvcHMgYXJyaXZpbmcgYWZ0ZXIgdGhlIGdpdmVuIHdhaXQgcGVyaW9kLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmNcbiAqIEBwYXJhbSB7TnVtYmVyfSB3YWl0XG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gLSB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uXG4gKi9cblxuZnVuY3Rpb24gX2RlYm91bmNlKGZ1bmMsIHdhaXQpIHtcbiAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0O1xuICB2YXIgbGF0ZXIgPSBmdW5jdGlvbiBsYXRlcigpIHtcbiAgICB2YXIgbGFzdCA9IERhdGUubm93KCkgLSB0aW1lc3RhbXA7XG4gICAgaWYgKGxhc3QgPCB3YWl0ICYmIGxhc3QgPj0gMCkge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQgLSBsYXN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgfVxuICB9O1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQgPSB0aGlzO1xuICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgdGltZXN0YW1wID0gRGF0ZS5ub3coKTtcbiAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cblxuLyoqXG4gKiBNYW51YWwgaW5kZXhPZiBiZWNhdXNlIGl0J3Mgc2xpZ2h0bHkgZmFzdGVyIHRoYW5cbiAqIG5hdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJcbiAqIEBwYXJhbSB7Kn0gb2JqXG4gKi9cblxuZnVuY3Rpb24gaW5kZXhPZihhcnIsIG9iaikge1xuICB2YXIgaSA9IGFyci5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBpZiAoYXJyW2ldID09PSBvYmopIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBNYWtlIGEgY2FuY2VsbGFibGUgdmVyc2lvbiBvZiBhbiBhc3luYyBjYWxsYmFjay5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gY2FuY2VsbGFibGUoZm4pIHtcbiAgdmFyIGNiID0gZnVuY3Rpb24gY2IoKSB7XG4gICAgaWYgKCFjYi5jYW5jZWxsZWQpIHtcbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfTtcbiAgY2IuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgIGNiLmNhbmNlbGxlZCA9IHRydWU7XG4gIH07XG4gIHJldHVybiBjYjtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0d28gdmFsdWVzIGFyZSBsb29zZWx5IGVxdWFsIC0gdGhhdCBpcyxcbiAqIGlmIHRoZXkgYXJlIHBsYWluIG9iamVjdHMsIGRvIHRoZXkgaGF2ZSB0aGUgc2FtZSBzaGFwZT9cbiAqXG4gKiBAcGFyYW0geyp9IGFcbiAqIEBwYXJhbSB7Kn0gYlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5mdW5jdGlvbiBsb29zZUVxdWFsKGEsIGIpIHtcbiAgLyogZXNsaW50LWRpc2FibGUgZXFlcWVxICovXG4gIHJldHVybiBhID09IGIgfHwgKGlzT2JqZWN0KGEpICYmIGlzT2JqZWN0KGIpID8gSlNPTi5zdHJpbmdpZnkoYSkgPT09IEpTT04uc3RyaW5naWZ5KGIpIDogZmFsc2UpO1xuICAvKiBlc2xpbnQtZW5hYmxlIGVxZXFlcSAqL1xufVxuXG52YXIgaGFzUHJvdG8gPSAoJ19fcHJvdG9fXycgaW4ge30pO1xuXG4vLyBCcm93c2VyIGVudmlyb25tZW50IHNuaWZmaW5nXG52YXIgaW5Ccm93c2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHdpbmRvdykgIT09ICdbb2JqZWN0IE9iamVjdF0nO1xuXG4vLyBkZXRlY3QgZGV2dG9vbHNcbnZhciBkZXZ0b29scyA9IGluQnJvd3NlciAmJiB3aW5kb3cuX19WVUVfREVWVE9PTFNfR0xPQkFMX0hPT0tfXztcblxuLy8gVUEgc25pZmZpbmcgZm9yIHdvcmtpbmcgYXJvdW5kIGJyb3dzZXItc3BlY2lmaWMgcXVpcmtzXG52YXIgVUEgPSBpbkJyb3dzZXIgJiYgd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKTtcbnZhciBpc0lFOSA9IFVBICYmIFVBLmluZGV4T2YoJ21zaWUgOS4wJykgPiAwO1xudmFyIGlzQW5kcm9pZCA9IFVBICYmIFVBLmluZGV4T2YoJ2FuZHJvaWQnKSA+IDA7XG5cbnZhciB0cmFuc2l0aW9uUHJvcCA9IHVuZGVmaW5lZDtcbnZhciB0cmFuc2l0aW9uRW5kRXZlbnQgPSB1bmRlZmluZWQ7XG52YXIgYW5pbWF0aW9uUHJvcCA9IHVuZGVmaW5lZDtcbnZhciBhbmltYXRpb25FbmRFdmVudCA9IHVuZGVmaW5lZDtcblxuLy8gVHJhbnNpdGlvbiBwcm9wZXJ0eS9ldmVudCBzbmlmZmluZ1xuaWYgKGluQnJvd3NlciAmJiAhaXNJRTkpIHtcbiAgdmFyIGlzV2Via2l0VHJhbnMgPSB3aW5kb3cub250cmFuc2l0aW9uZW5kID09PSB1bmRlZmluZWQgJiYgd2luZG93Lm9ud2Via2l0dHJhbnNpdGlvbmVuZCAhPT0gdW5kZWZpbmVkO1xuICB2YXIgaXNXZWJraXRBbmltID0gd2luZG93Lm9uYW5pbWF0aW9uZW5kID09PSB1bmRlZmluZWQgJiYgd2luZG93Lm9ud2Via2l0YW5pbWF0aW9uZW5kICE9PSB1bmRlZmluZWQ7XG4gIHRyYW5zaXRpb25Qcm9wID0gaXNXZWJraXRUcmFucyA/ICdXZWJraXRUcmFuc2l0aW9uJyA6ICd0cmFuc2l0aW9uJztcbiAgdHJhbnNpdGlvbkVuZEV2ZW50ID0gaXNXZWJraXRUcmFucyA/ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyA6ICd0cmFuc2l0aW9uZW5kJztcbiAgYW5pbWF0aW9uUHJvcCA9IGlzV2Via2l0QW5pbSA/ICdXZWJraXRBbmltYXRpb24nIDogJ2FuaW1hdGlvbic7XG4gIGFuaW1hdGlvbkVuZEV2ZW50ID0gaXNXZWJraXRBbmltID8gJ3dlYmtpdEFuaW1hdGlvbkVuZCcgOiAnYW5pbWF0aW9uZW5kJztcbn1cblxuLyoqXG4gKiBEZWZlciBhIHRhc2sgdG8gZXhlY3V0ZSBpdCBhc3luY2hyb25vdXNseS4gSWRlYWxseSB0aGlzXG4gKiBzaG91bGQgYmUgZXhlY3V0ZWQgYXMgYSBtaWNyb3Rhc2ssIHNvIHdlIGxldmVyYWdlXG4gKiBNdXRhdGlvbk9ic2VydmVyIGlmIGl0J3MgYXZhaWxhYmxlLCBhbmQgZmFsbGJhY2sgdG9cbiAqIHNldFRpbWVvdXQoMCkuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2JcbiAqIEBwYXJhbSB7T2JqZWN0fSBjdHhcbiAqL1xuXG52YXIgbmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgY2FsbGJhY2tzID0gW107XG4gIHZhciBwZW5kaW5nID0gZmFsc2U7XG4gIHZhciB0aW1lckZ1bmM7XG4gIGZ1bmN0aW9uIG5leHRUaWNrSGFuZGxlcigpIHtcbiAgICBwZW5kaW5nID0gZmFsc2U7XG4gICAgdmFyIGNvcGllcyA9IGNhbGxiYWNrcy5zbGljZSgwKTtcbiAgICBjYWxsYmFja3MgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvcGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29waWVzW2ldKCk7XG4gICAgfVxuICB9XG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmICh0eXBlb2YgTXV0YXRpb25PYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgY291bnRlciA9IDE7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIobmV4dFRpY2tIYW5kbGVyKTtcbiAgICB2YXIgdGV4dE5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjb3VudGVyKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKHRleHROb2RlLCB7XG4gICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlXG4gICAgfSk7XG4gICAgdGltZXJGdW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgY291bnRlciA9IChjb3VudGVyICsgMSkgJSAyO1xuICAgICAgdGV4dE5vZGUuZGF0YSA9IGNvdW50ZXI7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICAvLyB3ZWJwYWNrIGF0dGVtcHRzIHRvIGluamVjdCBhIHNoaW0gZm9yIHNldEltbWVkaWF0ZVxuICAgIC8vIGlmIGl0IGlzIHVzZWQgYXMgYSBnbG9iYWwsIHNvIHdlIGhhdmUgdG8gd29yayBhcm91bmQgdGhhdCB0b1xuICAgIC8vIGF2b2lkIGJ1bmRsaW5nIHVubmVjZXNzYXJ5IGNvZGUuXG4gICAgdmFyIGNvbnRleHQgPSBpbkJyb3dzZXIgPyB3aW5kb3cgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHt9O1xuICAgIHRpbWVyRnVuYyA9IGNvbnRleHQuc2V0SW1tZWRpYXRlIHx8IHNldFRpbWVvdXQ7XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uIChjYiwgY3R4KSB7XG4gICAgdmFyIGZ1bmMgPSBjdHggPyBmdW5jdGlvbiAoKSB7XG4gICAgICBjYi5jYWxsKGN0eCk7XG4gICAgfSA6IGNiO1xuICAgIGNhbGxiYWNrcy5wdXNoKGZ1bmMpO1xuICAgIGlmIChwZW5kaW5nKSByZXR1cm47XG4gICAgcGVuZGluZyA9IHRydWU7XG4gICAgdGltZXJGdW5jKG5leHRUaWNrSGFuZGxlciwgMCk7XG4gIH07XG59KSgpO1xuXG5mdW5jdGlvbiBDYWNoZShsaW1pdCkge1xuICB0aGlzLnNpemUgPSAwO1xuICB0aGlzLmxpbWl0ID0gbGltaXQ7XG4gIHRoaXMuaGVhZCA9IHRoaXMudGFpbCA9IHVuZGVmaW5lZDtcbiAgdGhpcy5fa2V5bWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cblxudmFyIHAgPSBDYWNoZS5wcm90b3R5cGU7XG5cbi8qKlxuICogUHV0IDx2YWx1ZT4gaW50byB0aGUgY2FjaGUgYXNzb2NpYXRlZCB3aXRoIDxrZXk+LlxuICogUmV0dXJucyB0aGUgZW50cnkgd2hpY2ggd2FzIHJlbW92ZWQgdG8gbWFrZSByb29tIGZvclxuICogdGhlIG5ldyBlbnRyeS4gT3RoZXJ3aXNlIHVuZGVmaW5lZCBpcyByZXR1cm5lZC5cbiAqIChpLmUuIGlmIHRoZXJlIHdhcyBlbm91Z2ggcm9vbSBhbHJlYWR5KS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKiBAcmV0dXJuIHtFbnRyeXx1bmRlZmluZWR9XG4gKi9cblxucC5wdXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICB2YXIgcmVtb3ZlZDtcbiAgaWYgKHRoaXMuc2l6ZSA9PT0gdGhpcy5saW1pdCkge1xuICAgIHJlbW92ZWQgPSB0aGlzLnNoaWZ0KCk7XG4gIH1cblxuICB2YXIgZW50cnkgPSB0aGlzLmdldChrZXksIHRydWUpO1xuICBpZiAoIWVudHJ5KSB7XG4gICAgZW50cnkgPSB7XG4gICAgICBrZXk6IGtleVxuICAgIH07XG4gICAgdGhpcy5fa2V5bWFwW2tleV0gPSBlbnRyeTtcbiAgICBpZiAodGhpcy50YWlsKSB7XG4gICAgICB0aGlzLnRhaWwubmV3ZXIgPSBlbnRyeTtcbiAgICAgIGVudHJ5Lm9sZGVyID0gdGhpcy50YWlsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhlYWQgPSBlbnRyeTtcbiAgICB9XG4gICAgdGhpcy50YWlsID0gZW50cnk7XG4gICAgdGhpcy5zaXplKys7XG4gIH1cbiAgZW50cnkudmFsdWUgPSB2YWx1ZTtcblxuICByZXR1cm4gcmVtb3ZlZDtcbn07XG5cbi8qKlxuICogUHVyZ2UgdGhlIGxlYXN0IHJlY2VudGx5IHVzZWQgKG9sZGVzdCkgZW50cnkgZnJvbSB0aGVcbiAqIGNhY2hlLiBSZXR1cm5zIHRoZSByZW1vdmVkIGVudHJ5IG9yIHVuZGVmaW5lZCBpZiB0aGVcbiAqIGNhY2hlIHdhcyBlbXB0eS5cbiAqL1xuXG5wLnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZW50cnkgPSB0aGlzLmhlYWQ7XG4gIGlmIChlbnRyeSkge1xuICAgIHRoaXMuaGVhZCA9IHRoaXMuaGVhZC5uZXdlcjtcbiAgICB0aGlzLmhlYWQub2xkZXIgPSB1bmRlZmluZWQ7XG4gICAgZW50cnkubmV3ZXIgPSBlbnRyeS5vbGRlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9rZXltYXBbZW50cnkua2V5XSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnNpemUtLTtcbiAgfVxuICByZXR1cm4gZW50cnk7XG59O1xuXG4vKipcbiAqIEdldCBhbmQgcmVnaXN0ZXIgcmVjZW50IHVzZSBvZiA8a2V5Pi4gUmV0dXJucyB0aGUgdmFsdWVcbiAqIGFzc29jaWF0ZWQgd2l0aCA8a2V5PiBvciB1bmRlZmluZWQgaWYgbm90IGluIGNhY2hlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcmV0dXJuRW50cnlcbiAqIEByZXR1cm4ge0VudHJ5fCp9XG4gKi9cblxucC5nZXQgPSBmdW5jdGlvbiAoa2V5LCByZXR1cm5FbnRyeSkge1xuICB2YXIgZW50cnkgPSB0aGlzLl9rZXltYXBba2V5XTtcbiAgaWYgKGVudHJ5ID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgaWYgKGVudHJ5ID09PSB0aGlzLnRhaWwpIHtcbiAgICByZXR1cm4gcmV0dXJuRW50cnkgPyBlbnRyeSA6IGVudHJ5LnZhbHVlO1xuICB9XG4gIC8vIEhFQUQtLS0tLS0tLS0tLS0tLVRBSUxcbiAgLy8gICA8Lm9sZGVyICAgLm5ld2VyPlxuICAvLyAgPC0tLSBhZGQgZGlyZWN0aW9uIC0tXG4gIC8vICAgQSAgQiAgQyAgPEQ+ICBFXG4gIGlmIChlbnRyeS5uZXdlcikge1xuICAgIGlmIChlbnRyeSA9PT0gdGhpcy5oZWFkKSB7XG4gICAgICB0aGlzLmhlYWQgPSBlbnRyeS5uZXdlcjtcbiAgICB9XG4gICAgZW50cnkubmV3ZXIub2xkZXIgPSBlbnRyeS5vbGRlcjsgLy8gQyA8LS0gRS5cbiAgfVxuICBpZiAoZW50cnkub2xkZXIpIHtcbiAgICBlbnRyeS5vbGRlci5uZXdlciA9IGVudHJ5Lm5ld2VyOyAvLyBDLiAtLT4gRVxuICB9XG4gIGVudHJ5Lm5ld2VyID0gdW5kZWZpbmVkOyAvLyBEIC0teFxuICBlbnRyeS5vbGRlciA9IHRoaXMudGFpbDsgLy8gRC4gLS0+IEVcbiAgaWYgKHRoaXMudGFpbCkge1xuICAgIHRoaXMudGFpbC5uZXdlciA9IGVudHJ5OyAvLyBFLiA8LS0gRFxuICB9XG4gIHRoaXMudGFpbCA9IGVudHJ5O1xuICByZXR1cm4gcmV0dXJuRW50cnkgPyBlbnRyeSA6IGVudHJ5LnZhbHVlO1xufTtcblxudmFyIGNhY2hlJDEgPSBuZXcgQ2FjaGUoMTAwMCk7XG52YXIgZmlsdGVyVG9rZW5SRSA9IC9bXlxccydcIl0rfCdbXiddKid8XCJbXlwiXSpcIi9nO1xudmFyIHJlc2VydmVkQXJnUkUgPSAvXmluJHxeLT9cXGQrLztcblxuLyoqXG4gKiBQYXJzZXIgc3RhdGVcbiAqL1xuXG52YXIgc3RyO1xudmFyIGRpcjtcbnZhciBjO1xudmFyIHByZXY7XG52YXIgaTtcbnZhciBsO1xudmFyIGxhc3RGaWx0ZXJJbmRleDtcbnZhciBpblNpbmdsZTtcbnZhciBpbkRvdWJsZTtcbnZhciBjdXJseTtcbnZhciBzcXVhcmU7XG52YXIgcGFyZW47XG4vKipcbiAqIFB1c2ggYSBmaWx0ZXIgdG8gdGhlIGN1cnJlbnQgZGlyZWN0aXZlIG9iamVjdFxuICovXG5cbmZ1bmN0aW9uIHB1c2hGaWx0ZXIoKSB7XG4gIHZhciBleHAgPSBzdHIuc2xpY2UobGFzdEZpbHRlckluZGV4LCBpKS50cmltKCk7XG4gIHZhciBmaWx0ZXI7XG4gIGlmIChleHApIHtcbiAgICBmaWx0ZXIgPSB7fTtcbiAgICB2YXIgdG9rZW5zID0gZXhwLm1hdGNoKGZpbHRlclRva2VuUkUpO1xuICAgIGZpbHRlci5uYW1lID0gdG9rZW5zWzBdO1xuICAgIGlmICh0b2tlbnMubGVuZ3RoID4gMSkge1xuICAgICAgZmlsdGVyLmFyZ3MgPSB0b2tlbnMuc2xpY2UoMSkubWFwKHByb2Nlc3NGaWx0ZXJBcmcpO1xuICAgIH1cbiAgfVxuICBpZiAoZmlsdGVyKSB7XG4gICAgKGRpci5maWx0ZXJzID0gZGlyLmZpbHRlcnMgfHwgW10pLnB1c2goZmlsdGVyKTtcbiAgfVxuICBsYXN0RmlsdGVySW5kZXggPSBpICsgMTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhbiBhcmd1bWVudCBpcyBkeW5hbWljIGFuZCBzdHJpcCBxdW90ZXMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFyZ1xuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIHByb2Nlc3NGaWx0ZXJBcmcoYXJnKSB7XG4gIGlmIChyZXNlcnZlZEFyZ1JFLnRlc3QoYXJnKSkge1xuICAgIHJldHVybiB7XG4gICAgICB2YWx1ZTogdG9OdW1iZXIoYXJnKSxcbiAgICAgIGR5bmFtaWM6IGZhbHNlXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgc3RyaXBwZWQgPSBzdHJpcFF1b3RlcyhhcmcpO1xuICAgIHZhciBkeW5hbWljID0gc3RyaXBwZWQgPT09IGFyZztcbiAgICByZXR1cm4ge1xuICAgICAgdmFsdWU6IGR5bmFtaWMgPyBhcmcgOiBzdHJpcHBlZCxcbiAgICAgIGR5bmFtaWM6IGR5bmFtaWNcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogUGFyc2UgYSBkaXJlY3RpdmUgdmFsdWUgYW5kIGV4dHJhY3QgdGhlIGV4cHJlc3Npb25cbiAqIGFuZCBpdHMgZmlsdGVycyBpbnRvIGEgZGVzY3JpcHRvci5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIFwiYSArIDEgfCB1cHBlcmNhc2VcIiB3aWxsIHlpZWxkOlxuICoge1xuICogICBleHByZXNzaW9uOiAnYSArIDEnLFxuICogICBmaWx0ZXJzOiBbXG4gKiAgICAgeyBuYW1lOiAndXBwZXJjYXNlJywgYXJnczogbnVsbCB9XG4gKiAgIF1cbiAqIH1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxuZnVuY3Rpb24gcGFyc2VEaXJlY3RpdmUocykge1xuICB2YXIgaGl0ID0gY2FjaGUkMS5nZXQocyk7XG4gIGlmIChoaXQpIHtcbiAgICByZXR1cm4gaGl0O1xuICB9XG5cbiAgLy8gcmVzZXQgcGFyc2VyIHN0YXRlXG4gIHN0ciA9IHM7XG4gIGluU2luZ2xlID0gaW5Eb3VibGUgPSBmYWxzZTtcbiAgY3VybHkgPSBzcXVhcmUgPSBwYXJlbiA9IDA7XG4gIGxhc3RGaWx0ZXJJbmRleCA9IDA7XG4gIGRpciA9IHt9O1xuXG4gIGZvciAoaSA9IDAsIGwgPSBzdHIubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcHJldiA9IGM7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChpblNpbmdsZSkge1xuICAgICAgLy8gY2hlY2sgc2luZ2xlIHF1b3RlXG4gICAgICBpZiAoYyA9PT0gMHgyNyAmJiBwcmV2ICE9PSAweDVDKSBpblNpbmdsZSA9ICFpblNpbmdsZTtcbiAgICB9IGVsc2UgaWYgKGluRG91YmxlKSB7XG4gICAgICAvLyBjaGVjayBkb3VibGUgcXVvdGVcbiAgICAgIGlmIChjID09PSAweDIyICYmIHByZXYgIT09IDB4NUMpIGluRG91YmxlID0gIWluRG91YmxlO1xuICAgIH0gZWxzZSBpZiAoYyA9PT0gMHg3QyAmJiAvLyBwaXBlXG4gICAgc3RyLmNoYXJDb2RlQXQoaSArIDEpICE9PSAweDdDICYmIHN0ci5jaGFyQ29kZUF0KGkgLSAxKSAhPT0gMHg3Qykge1xuICAgICAgaWYgKGRpci5leHByZXNzaW9uID09IG51bGwpIHtcbiAgICAgICAgLy8gZmlyc3QgZmlsdGVyLCBlbmQgb2YgZXhwcmVzc2lvblxuICAgICAgICBsYXN0RmlsdGVySW5kZXggPSBpICsgMTtcbiAgICAgICAgZGlyLmV4cHJlc3Npb24gPSBzdHIuc2xpY2UoMCwgaSkudHJpbSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYWxyZWFkeSBoYXMgZmlsdGVyXG4gICAgICAgIHB1c2hGaWx0ZXIoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgIGNhc2UgMHgyMjpcbiAgICAgICAgICBpbkRvdWJsZSA9IHRydWU7YnJlYWs7IC8vIFwiXG4gICAgICAgIGNhc2UgMHgyNzpcbiAgICAgICAgICBpblNpbmdsZSA9IHRydWU7YnJlYWs7IC8vICdcbiAgICAgICAgY2FzZSAweDI4OlxuICAgICAgICAgIHBhcmVuKys7YnJlYWs7IC8vIChcbiAgICAgICAgY2FzZSAweDI5OlxuICAgICAgICAgIHBhcmVuLS07YnJlYWs7IC8vIClcbiAgICAgICAgY2FzZSAweDVCOlxuICAgICAgICAgIHNxdWFyZSsrO2JyZWFrOyAvLyBbXG4gICAgICAgIGNhc2UgMHg1RDpcbiAgICAgICAgICBzcXVhcmUtLTticmVhazsgLy8gXVxuICAgICAgICBjYXNlIDB4N0I6XG4gICAgICAgICAgY3VybHkrKzticmVhazsgLy8ge1xuICAgICAgICBjYXNlIDB4N0Q6XG4gICAgICAgICAgY3VybHktLTticmVhazsgLy8gfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChkaXIuZXhwcmVzc2lvbiA9PSBudWxsKSB7XG4gICAgZGlyLmV4cHJlc3Npb24gPSBzdHIuc2xpY2UoMCwgaSkudHJpbSgpO1xuICB9IGVsc2UgaWYgKGxhc3RGaWx0ZXJJbmRleCAhPT0gMCkge1xuICAgIHB1c2hGaWx0ZXIoKTtcbiAgfVxuXG4gIGNhY2hlJDEucHV0KHMsIGRpcik7XG4gIHJldHVybiBkaXI7XG59XG5cbnZhciBkaXJlY3RpdmUgPSBPYmplY3QuZnJlZXplKHtcbiAgcGFyc2VEaXJlY3RpdmU6IHBhcnNlRGlyZWN0aXZlXG59KTtcblxudmFyIHJlZ2V4RXNjYXBlUkUgPSAvWy0uKis/XiR7fSgpfFtcXF1cXC9cXFxcXS9nO1xudmFyIGNhY2hlID0gdW5kZWZpbmVkO1xudmFyIHRhZ1JFID0gdW5kZWZpbmVkO1xudmFyIGh0bWxSRSA9IHVuZGVmaW5lZDtcbi8qKlxuICogRXNjYXBlIGEgc3RyaW5nIHNvIGl0IGNhbiBiZSB1c2VkIGluIGEgUmVnRXhwXG4gKiBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKi9cblxuZnVuY3Rpb24gZXNjYXBlUmVnZXgoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZShyZWdleEVzY2FwZVJFLCAnXFxcXCQmJyk7XG59XG5cbmZ1bmN0aW9uIGNvbXBpbGVSZWdleCgpIHtcbiAgdmFyIG9wZW4gPSBlc2NhcGVSZWdleChjb25maWcuZGVsaW1pdGVyc1swXSk7XG4gIHZhciBjbG9zZSA9IGVzY2FwZVJlZ2V4KGNvbmZpZy5kZWxpbWl0ZXJzWzFdKTtcbiAgdmFyIHVuc2FmZU9wZW4gPSBlc2NhcGVSZWdleChjb25maWcudW5zYWZlRGVsaW1pdGVyc1swXSk7XG4gIHZhciB1bnNhZmVDbG9zZSA9IGVzY2FwZVJlZ2V4KGNvbmZpZy51bnNhZmVEZWxpbWl0ZXJzWzFdKTtcbiAgdGFnUkUgPSBuZXcgUmVnRXhwKHVuc2FmZU9wZW4gKyAnKC4rPyknICsgdW5zYWZlQ2xvc2UgKyAnfCcgKyBvcGVuICsgJyguKz8pJyArIGNsb3NlLCAnZycpO1xuICBodG1sUkUgPSBuZXcgUmVnRXhwKCdeJyArIHVuc2FmZU9wZW4gKyAnLionICsgdW5zYWZlQ2xvc2UgKyAnJCcpO1xuICAvLyByZXNldCBjYWNoZVxuICBjYWNoZSA9IG5ldyBDYWNoZSgxMDAwKTtcbn1cblxuLyoqXG4gKiBQYXJzZSBhIHRlbXBsYXRlIHRleHQgc3RyaW5nIGludG8gYW4gYXJyYXkgb2YgdG9rZW5zLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJuIHtBcnJheTxPYmplY3Q+IHwgbnVsbH1cbiAqICAgICAgICAgICAgICAgLSB7U3RyaW5nfSB0eXBlXG4gKiAgICAgICAgICAgICAgIC0ge1N0cmluZ30gdmFsdWVcbiAqICAgICAgICAgICAgICAgLSB7Qm9vbGVhbn0gW2h0bWxdXG4gKiAgICAgICAgICAgICAgIC0ge0Jvb2xlYW59IFtvbmVUaW1lXVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlVGV4dCh0ZXh0KSB7XG4gIGlmICghY2FjaGUpIHtcbiAgICBjb21waWxlUmVnZXgoKTtcbiAgfVxuICB2YXIgaGl0ID0gY2FjaGUuZ2V0KHRleHQpO1xuICBpZiAoaGl0KSB7XG4gICAgcmV0dXJuIGhpdDtcbiAgfVxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXG4vZywgJycpO1xuICBpZiAoIXRhZ1JFLnRlc3QodGV4dCkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICB2YXIgdG9rZW5zID0gW107XG4gIHZhciBsYXN0SW5kZXggPSB0YWdSRS5sYXN0SW5kZXggPSAwO1xuICB2YXIgbWF0Y2gsIGluZGV4LCBodG1sLCB2YWx1ZSwgZmlyc3QsIG9uZVRpbWU7XG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbmQtYXNzaWduICovXG4gIHdoaWxlIChtYXRjaCA9IHRhZ1JFLmV4ZWModGV4dCkpIHtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbmQtYXNzaWduICovXG4gICAgaW5kZXggPSBtYXRjaC5pbmRleDtcbiAgICAvLyBwdXNoIHRleHQgdG9rZW5cbiAgICBpZiAoaW5kZXggPiBsYXN0SW5kZXgpIHtcbiAgICAgIHRva2Vucy5wdXNoKHtcbiAgICAgICAgdmFsdWU6IHRleHQuc2xpY2UobGFzdEluZGV4LCBpbmRleClcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyB0YWcgdG9rZW5cbiAgICBodG1sID0gaHRtbFJFLnRlc3QobWF0Y2hbMF0pO1xuICAgIHZhbHVlID0gaHRtbCA/IG1hdGNoWzFdIDogbWF0Y2hbMl07XG4gICAgZmlyc3QgPSB2YWx1ZS5jaGFyQ29kZUF0KDApO1xuICAgIG9uZVRpbWUgPSBmaXJzdCA9PT0gNDI7IC8vICpcbiAgICB2YWx1ZSA9IG9uZVRpbWUgPyB2YWx1ZS5zbGljZSgxKSA6IHZhbHVlO1xuICAgIHRva2Vucy5wdXNoKHtcbiAgICAgIHRhZzogdHJ1ZSxcbiAgICAgIHZhbHVlOiB2YWx1ZS50cmltKCksXG4gICAgICBodG1sOiBodG1sLFxuICAgICAgb25lVGltZTogb25lVGltZVxuICAgIH0pO1xuICAgIGxhc3RJbmRleCA9IGluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICB9XG4gIGlmIChsYXN0SW5kZXggPCB0ZXh0Lmxlbmd0aCkge1xuICAgIHRva2Vucy5wdXNoKHtcbiAgICAgIHZhbHVlOiB0ZXh0LnNsaWNlKGxhc3RJbmRleClcbiAgICB9KTtcbiAgfVxuICBjYWNoZS5wdXQodGV4dCwgdG9rZW5zKTtcbiAgcmV0dXJuIHRva2Vucztcbn1cblxuLyoqXG4gKiBGb3JtYXQgYSBsaXN0IG9mIHRva2VucyBpbnRvIGFuIGV4cHJlc3Npb24uXG4gKiBlLmcuIHRva2VucyBwYXJzZWQgZnJvbSAnYSB7e2J9fSBjJyBjYW4gYmUgc2VyaWFsaXplZFxuICogaW50byBvbmUgc2luZ2xlIGV4cHJlc3Npb24gYXMgJ1wiYSBcIiArIGIgKyBcIiBjXCInLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHRva2Vuc1xuICogQHBhcmFtIHtWdWV9IFt2bV1cbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiB0b2tlbnNUb0V4cCh0b2tlbnMsIHZtKSB7XG4gIGlmICh0b2tlbnMubGVuZ3RoID4gMSkge1xuICAgIHJldHVybiB0b2tlbnMubWFwKGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgcmV0dXJuIGZvcm1hdFRva2VuKHRva2VuLCB2bSk7XG4gICAgfSkuam9pbignKycpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmb3JtYXRUb2tlbih0b2tlbnNbMF0sIHZtLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIEZvcm1hdCBhIHNpbmdsZSB0b2tlbi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdG9rZW5cbiAqIEBwYXJhbSB7VnVlfSBbdm1dXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtzaW5nbGVdXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0VG9rZW4odG9rZW4sIHZtLCBzaW5nbGUpIHtcbiAgcmV0dXJuIHRva2VuLnRhZyA/IHRva2VuLm9uZVRpbWUgJiYgdm0gPyAnXCInICsgdm0uJGV2YWwodG9rZW4udmFsdWUpICsgJ1wiJyA6IGlubGluZUZpbHRlcnModG9rZW4udmFsdWUsIHNpbmdsZSkgOiAnXCInICsgdG9rZW4udmFsdWUgKyAnXCInO1xufVxuXG4vKipcbiAqIEZvciBhbiBhdHRyaWJ1dGUgd2l0aCBtdWx0aXBsZSBpbnRlcnBvbGF0aW9uIHRhZ3MsXG4gKiBlLmcuIGF0dHI9XCJzb21lLXt7dGhpbmcgfCBmaWx0ZXJ9fVwiLCBpbiBvcmRlciB0byBjb21iaW5lXG4gKiB0aGUgd2hvbGUgdGhpbmcgaW50byBhIHNpbmdsZSB3YXRjaGFibGUgZXhwcmVzc2lvbiwgd2VcbiAqIGhhdmUgdG8gaW5saW5lIHRob3NlIGZpbHRlcnMuIFRoaXMgZnVuY3Rpb24gZG9lcyBleGFjdGx5XG4gKiB0aGF0LiBUaGlzIGlzIGEgYml0IGhhY2t5IGJ1dCBpdCBhdm9pZHMgaGVhdnkgY2hhbmdlc1xuICogdG8gZGlyZWN0aXZlIHBhcnNlciBhbmQgd2F0Y2hlciBtZWNoYW5pc20uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV4cFxuICogQHBhcmFtIHtCb29sZWFufSBzaW5nbGVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG52YXIgZmlsdGVyUkUgPSAvW158XVxcfFtefF0vO1xuZnVuY3Rpb24gaW5saW5lRmlsdGVycyhleHAsIHNpbmdsZSkge1xuICBpZiAoIWZpbHRlclJFLnRlc3QoZXhwKSkge1xuICAgIHJldHVybiBzaW5nbGUgPyBleHAgOiAnKCcgKyBleHAgKyAnKSc7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGRpciA9IHBhcnNlRGlyZWN0aXZlKGV4cCk7XG4gICAgaWYgKCFkaXIuZmlsdGVycykge1xuICAgICAgcmV0dXJuICcoJyArIGV4cCArICcpJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICd0aGlzLl9hcHBseUZpbHRlcnMoJyArIGRpci5leHByZXNzaW9uICsgLy8gdmFsdWVcbiAgICAgICcsbnVsbCwnICsgLy8gb2xkVmFsdWUgKG51bGwgZm9yIHJlYWQpXG4gICAgICBKU09OLnN0cmluZ2lmeShkaXIuZmlsdGVycykgKyAvLyBmaWx0ZXIgZGVzY3JpcHRvcnNcbiAgICAgICcsZmFsc2UpJzsgLy8gd3JpdGU/XG4gICAgfVxuICB9XG59XG5cbnZhciB0ZXh0ID0gT2JqZWN0LmZyZWV6ZSh7XG4gIGNvbXBpbGVSZWdleDogY29tcGlsZVJlZ2V4LFxuICBwYXJzZVRleHQ6IHBhcnNlVGV4dCxcbiAgdG9rZW5zVG9FeHA6IHRva2Vuc1RvRXhwXG59KTtcblxudmFyIGRlbGltaXRlcnMgPSBbJ3t7JywgJ319J107XG52YXIgdW5zYWZlRGVsaW1pdGVycyA9IFsne3t7JywgJ319fSddO1xuXG52YXIgY29uZmlnID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoe1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIHByaW50IGRlYnVnIG1lc3NhZ2VzLlxuICAgKiBBbHNvIGVuYWJsZXMgc3RhY2sgdHJhY2UgZm9yIHdhcm5pbmdzLlxuICAgKlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG5cbiAgZGVidWc6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIHN1cHByZXNzIHdhcm5pbmdzLlxuICAgKlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG5cbiAgc2lsZW50OiBmYWxzZSxcblxuICAvKipcbiAgICogV2hldGhlciB0byB1c2UgYXN5bmMgcmVuZGVyaW5nLlxuICAgKi9cblxuICBhc3luYzogdHJ1ZSxcblxuICAvKipcbiAgICogV2hldGhlciB0byB3YXJuIGFnYWluc3QgZXJyb3JzIGNhdWdodCB3aGVuIGV2YWx1YXRpbmdcbiAgICogZXhwcmVzc2lvbnMuXG4gICAqL1xuXG4gIHdhcm5FeHByZXNzaW9uRXJyb3JzOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBmbGFnIHRvIGluZGljYXRlIHRoZSBkZWxpbWl0ZXJzIGhhdmUgYmVlblxuICAgKiBjaGFuZ2VkLlxuICAgKlxuICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICovXG5cbiAgX2RlbGltaXRlcnNDaGFuZ2VkOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGFzc2V0IHR5cGVzIHRoYXQgYSBjb21wb25lbnQgY2FuIG93bi5cbiAgICpcbiAgICogQHR5cGUge0FycmF5fVxuICAgKi9cblxuICBfYXNzZXRUeXBlczogWydjb21wb25lbnQnLCAnZGlyZWN0aXZlJywgJ2VsZW1lbnREaXJlY3RpdmUnLCAnZmlsdGVyJywgJ3RyYW5zaXRpb24nLCAncGFydGlhbCddLFxuXG4gIC8qKlxuICAgKiBwcm9wIGJpbmRpbmcgbW9kZXNcbiAgICovXG5cbiAgX3Byb3BCaW5kaW5nTW9kZXM6IHtcbiAgICBPTkVfV0FZOiAwLFxuICAgIFRXT19XQVk6IDEsXG4gICAgT05FX1RJTUU6IDJcbiAgfSxcblxuICAvKipcbiAgICogTWF4IGNpcmN1bGFyIHVwZGF0ZXMgYWxsb3dlZCBpbiBhIGJhdGNoZXIgZmx1c2ggY3ljbGUuXG4gICAqL1xuXG4gIF9tYXhVcGRhdGVDb3VudDogMTAwXG5cbn0sIHtcbiAgZGVsaW1pdGVyczogeyAvKipcbiAgICAgICAgICAgICAgICAgKiBJbnRlcnBvbGF0aW9uIGRlbGltaXRlcnMuIENoYW5naW5nIHRoZXNlIHdvdWxkIHRyaWdnZXJcbiAgICAgICAgICAgICAgICAgKiB0aGUgdGV4dCBwYXJzZXIgdG8gcmUtY29tcGlsZSB0aGUgcmVndWxhciBleHByZXNzaW9ucy5cbiAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtBcnJheTxTdHJpbmc+fVxuICAgICAgICAgICAgICAgICAqL1xuXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gZGVsaW1pdGVycztcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbCkge1xuICAgICAgZGVsaW1pdGVycyA9IHZhbDtcbiAgICAgIGNvbXBpbGVSZWdleCgpO1xuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfSxcbiAgdW5zYWZlRGVsaW1pdGVyczoge1xuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHVuc2FmZURlbGltaXRlcnM7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWwpIHtcbiAgICAgIHVuc2FmZURlbGltaXRlcnMgPSB2YWw7XG4gICAgICBjb21waWxlUmVnZXgoKTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH1cbn0pO1xuXG52YXIgd2FybiA9IHVuZGVmaW5lZDtcblxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaGFzQ29uc29sZSA9IHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJztcbiAgICB3YXJuID0gZnVuY3Rpb24gKG1zZywgZSkge1xuICAgICAgaWYgKGhhc0NvbnNvbGUgJiYgKCFjb25maWcuc2lsZW50IHx8IGNvbmZpZy5kZWJ1ZykpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbVnVlIHdhcm5dOiAnICsgbXNnKTtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICAgIGlmIChjb25maWcuZGVidWcpIHtcbiAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG5ldyBFcnJvcignV2FybmluZyBTdGFjayBUcmFjZScpLnN0YWNrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9KSgpO1xufVxuXG4vKipcbiAqIEFwcGVuZCB3aXRoIHRyYW5zaXRpb24uXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICovXG5cbmZ1bmN0aW9uIGFwcGVuZFdpdGhUcmFuc2l0aW9uKGVsLCB0YXJnZXQsIHZtLCBjYikge1xuICBhcHBseVRyYW5zaXRpb24oZWwsIDEsIGZ1bmN0aW9uICgpIHtcbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoZWwpO1xuICB9LCB2bSwgY2IpO1xufVxuXG4vKipcbiAqIEluc2VydEJlZm9yZSB3aXRoIHRyYW5zaXRpb24uXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICovXG5cbmZ1bmN0aW9uIGJlZm9yZVdpdGhUcmFuc2l0aW9uKGVsLCB0YXJnZXQsIHZtLCBjYikge1xuICBhcHBseVRyYW5zaXRpb24oZWwsIDEsIGZ1bmN0aW9uICgpIHtcbiAgICBiZWZvcmUoZWwsIHRhcmdldCk7XG4gIH0sIHZtLCBjYik7XG59XG5cbi8qKlxuICogUmVtb3ZlIHdpdGggdHJhbnNpdGlvbi5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge1Z1ZX0gdm1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAqL1xuXG5mdW5jdGlvbiByZW1vdmVXaXRoVHJhbnNpdGlvbihlbCwgdm0sIGNiKSB7XG4gIGFwcGx5VHJhbnNpdGlvbihlbCwgLTEsIGZ1bmN0aW9uICgpIHtcbiAgICByZW1vdmUoZWwpO1xuICB9LCB2bSwgY2IpO1xufVxuXG4vKipcbiAqIEFwcGx5IHRyYW5zaXRpb25zIHdpdGggYW4gb3BlcmF0aW9uIGNhbGxiYWNrLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7TnVtYmVyfSBkaXJlY3Rpb25cbiAqICAgICAgICAgICAgICAgICAgMTogZW50ZXJcbiAqICAgICAgICAgICAgICAgICAtMTogbGVhdmVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wIC0gdGhlIGFjdHVhbCBET00gb3BlcmF0aW9uXG4gKiBAcGFyYW0ge1Z1ZX0gdm1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAqL1xuXG5mdW5jdGlvbiBhcHBseVRyYW5zaXRpb24oZWwsIGRpcmVjdGlvbiwgb3AsIHZtLCBjYikge1xuICB2YXIgdHJhbnNpdGlvbiA9IGVsLl9fdl90cmFucztcbiAgaWYgKCF0cmFuc2l0aW9uIHx8XG4gIC8vIHNraXAgaWYgdGhlcmUgYXJlIG5vIGpzIGhvb2tzIGFuZCBDU1MgdHJhbnNpdGlvbiBpc1xuICAvLyBub3Qgc3VwcG9ydGVkXG4gICF0cmFuc2l0aW9uLmhvb2tzICYmICF0cmFuc2l0aW9uRW5kRXZlbnQgfHxcbiAgLy8gc2tpcCB0cmFuc2l0aW9ucyBmb3IgaW5pdGlhbCBjb21waWxlXG4gICF2bS5faXNDb21waWxlZCB8fFxuICAvLyBpZiB0aGUgdm0gaXMgYmVpbmcgbWFuaXB1bGF0ZWQgYnkgYSBwYXJlbnQgZGlyZWN0aXZlXG4gIC8vIGR1cmluZyB0aGUgcGFyZW50J3MgY29tcGlsYXRpb24gcGhhc2UsIHNraXAgdGhlXG4gIC8vIGFuaW1hdGlvbi5cbiAgdm0uJHBhcmVudCAmJiAhdm0uJHBhcmVudC5faXNDb21waWxlZCkge1xuICAgIG9wKCk7XG4gICAgaWYgKGNiKSBjYigpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgYWN0aW9uID0gZGlyZWN0aW9uID4gMCA/ICdlbnRlcicgOiAnbGVhdmUnO1xuICB0cmFuc2l0aW9uW2FjdGlvbl0ob3AsIGNiKTtcbn1cblxudmFyIHRyYW5zaXRpb24gPSBPYmplY3QuZnJlZXplKHtcbiAgYXBwZW5kV2l0aFRyYW5zaXRpb246IGFwcGVuZFdpdGhUcmFuc2l0aW9uLFxuICBiZWZvcmVXaXRoVHJhbnNpdGlvbjogYmVmb3JlV2l0aFRyYW5zaXRpb24sXG4gIHJlbW92ZVdpdGhUcmFuc2l0aW9uOiByZW1vdmVXaXRoVHJhbnNpdGlvbixcbiAgYXBwbHlUcmFuc2l0aW9uOiBhcHBseVRyYW5zaXRpb25cbn0pO1xuXG4vKipcbiAqIFF1ZXJ5IGFuIGVsZW1lbnQgc2VsZWN0b3IgaWYgaXQncyBub3QgYW4gZWxlbWVudCBhbHJlYWR5LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEVsZW1lbnR9IGVsXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICovXG5cbmZ1bmN0aW9uIHF1ZXJ5KGVsKSB7XG4gIGlmICh0eXBlb2YgZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFyIHNlbGVjdG9yID0gZWw7XG4gICAgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVsKTtcbiAgICBpZiAoIWVsKSB7XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ0Nhbm5vdCBmaW5kIGVsZW1lbnQ6ICcgKyBzZWxlY3Rvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiBlbDtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIG5vZGUgaXMgaW4gdGhlIGRvY3VtZW50LlxuICogTm90ZTogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNvbnRhaW5zIHNob3VsZCB3b3JrIGhlcmVcbiAqIGJ1dCBhbHdheXMgcmV0dXJucyBmYWxzZSBmb3IgY29tbWVudCBub2RlcyBpbiBwaGFudG9tanMsXG4gKiBtYWtpbmcgdW5pdCB0ZXN0cyBkaWZmaWN1bHQuIFRoaXMgaXMgZml4ZWQgYnkgZG9pbmcgdGhlXG4gKiBjb250YWlucygpIGNoZWNrIG9uIHRoZSBub2RlJ3MgcGFyZW50Tm9kZSBpbnN0ZWFkIG9mXG4gKiB0aGUgbm9kZSBpdHNlbGYuXG4gKlxuICogQHBhcmFtIHtOb2RlfSBub2RlXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZ1bmN0aW9uIGluRG9jKG5vZGUpIHtcbiAgdmFyIGRvYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgdmFyIHBhcmVudCA9IG5vZGUgJiYgbm9kZS5wYXJlbnROb2RlO1xuICByZXR1cm4gZG9jID09PSBub2RlIHx8IGRvYyA9PT0gcGFyZW50IHx8ICEhKHBhcmVudCAmJiBwYXJlbnQubm9kZVR5cGUgPT09IDEgJiYgZG9jLmNvbnRhaW5zKHBhcmVudCkpO1xufVxuXG4vKipcbiAqIEdldCBhbmQgcmVtb3ZlIGFuIGF0dHJpYnV0ZSBmcm9tIGEgbm9kZS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBfYXR0clxuICovXG5cbmZ1bmN0aW9uIGdldEF0dHIobm9kZSwgX2F0dHIpIHtcbiAgdmFyIHZhbCA9IG5vZGUuZ2V0QXR0cmlidXRlKF9hdHRyKTtcbiAgaWYgKHZhbCAhPT0gbnVsbCkge1xuICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKF9hdHRyKTtcbiAgfVxuICByZXR1cm4gdmFsO1xufVxuXG4vKipcbiAqIEdldCBhbiBhdHRyaWJ1dGUgd2l0aCBjb2xvbiBvciB2LWJpbmQ6IHByZWZpeC5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtTdHJpbmd8bnVsbH1cbiAqL1xuXG5mdW5jdGlvbiBnZXRCaW5kQXR0cihub2RlLCBuYW1lKSB7XG4gIHZhciB2YWwgPSBnZXRBdHRyKG5vZGUsICc6JyArIG5hbWUpO1xuICBpZiAodmFsID09PSBudWxsKSB7XG4gICAgdmFsID0gZ2V0QXR0cihub2RlLCAndi1iaW5kOicgKyBuYW1lKTtcbiAgfVxuICByZXR1cm4gdmFsO1xufVxuXG4vKipcbiAqIENoZWNrIHRoZSBwcmVzZW5jZSBvZiBhIGJpbmQgYXR0cmlidXRlLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gaGFzQmluZEF0dHIobm9kZSwgbmFtZSkge1xuICByZXR1cm4gbm9kZS5oYXNBdHRyaWJ1dGUobmFtZSkgfHwgbm9kZS5oYXNBdHRyaWJ1dGUoJzonICsgbmFtZSkgfHwgbm9kZS5oYXNBdHRyaWJ1dGUoJ3YtYmluZDonICsgbmFtZSk7XG59XG5cbi8qKlxuICogSW5zZXJ0IGVsIGJlZm9yZSB0YXJnZXRcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldFxuICovXG5cbmZ1bmN0aW9uIGJlZm9yZShlbCwgdGFyZ2V0KSB7XG4gIHRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbCwgdGFyZ2V0KTtcbn1cblxuLyoqXG4gKiBJbnNlcnQgZWwgYWZ0ZXIgdGFyZ2V0XG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRcbiAqL1xuXG5mdW5jdGlvbiBhZnRlcihlbCwgdGFyZ2V0KSB7XG4gIGlmICh0YXJnZXQubmV4dFNpYmxpbmcpIHtcbiAgICBiZWZvcmUoZWwsIHRhcmdldC5uZXh0U2libGluZyk7XG4gIH0gZWxzZSB7XG4gICAgdGFyZ2V0LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoZWwpO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIGVsIGZyb20gRE9NXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICovXG5cbmZ1bmN0aW9uIHJlbW92ZShlbCkge1xuICBlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKTtcbn1cblxuLyoqXG4gKiBQcmVwZW5kIGVsIHRvIHRhcmdldFxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0XG4gKi9cblxuZnVuY3Rpb24gcHJlcGVuZChlbCwgdGFyZ2V0KSB7XG4gIGlmICh0YXJnZXQuZmlyc3RDaGlsZCkge1xuICAgIGJlZm9yZShlbCwgdGFyZ2V0LmZpcnN0Q2hpbGQpO1xuICB9IGVsc2Uge1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChlbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXBsYWNlIHRhcmdldCB3aXRoIGVsXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqL1xuXG5mdW5jdGlvbiByZXBsYWNlKHRhcmdldCwgZWwpIHtcbiAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICBpZiAocGFyZW50KSB7XG4gICAgcGFyZW50LnJlcGxhY2VDaGlsZChlbCwgdGFyZ2V0KTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZCBldmVudCBsaXN0ZW5lciBzaG9ydGhhbmQuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYlxuICogQHBhcmFtIHtCb29sZWFufSBbdXNlQ2FwdHVyZV1cbiAqL1xuXG5mdW5jdGlvbiBvbihlbCwgZXZlbnQsIGNiLCB1c2VDYXB0dXJlKSB7XG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGNiLCB1c2VDYXB0dXJlKTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgZXZlbnQgbGlzdGVuZXIgc2hvcnRoYW5kLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2JcbiAqL1xuXG5mdW5jdGlvbiBvZmYoZWwsIGV2ZW50LCBjYikge1xuICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBjYik7XG59XG5cbi8qKlxuICogSW4gSUU5LCBzZXRBdHRyaWJ1dGUoJ2NsYXNzJykgd2lsbCByZXN1bHQgaW4gZW1wdHkgY2xhc3NcbiAqIGlmIHRoZSBlbGVtZW50IGFsc28gaGFzIHRoZSA6Y2xhc3MgYXR0cmlidXRlOyBIb3dldmVyIGluXG4gKiBQaGFudG9tSlMsIHNldHRpbmcgYGNsYXNzTmFtZWAgZG9lcyBub3Qgd29yayBvbiBTVkcgZWxlbWVudHMuLi5cbiAqIFNvIHdlIGhhdmUgdG8gZG8gYSBjb25kaXRpb25hbCBjaGVjayBoZXJlLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBjbHNcbiAqL1xuXG5mdW5jdGlvbiBzZXRDbGFzcyhlbCwgY2xzKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoaXNJRTkgJiYgIS9zdmckLy50ZXN0KGVsLm5hbWVzcGFjZVVSSSkpIHtcbiAgICBlbC5jbGFzc05hbWUgPSBjbHM7XG4gIH0gZWxzZSB7XG4gICAgZWwuc2V0QXR0cmlidXRlKCdjbGFzcycsIGNscyk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGQgY2xhc3Mgd2l0aCBjb21wYXRpYmlsaXR5IGZvciBJRSAmIFNWR1xuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBjbHNcbiAqL1xuXG5mdW5jdGlvbiBhZGRDbGFzcyhlbCwgY2xzKSB7XG4gIGlmIChlbC5jbGFzc0xpc3QpIHtcbiAgICBlbC5jbGFzc0xpc3QuYWRkKGNscyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGN1ciA9ICcgJyArIChlbC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykgfHwgJycpICsgJyAnO1xuICAgIGlmIChjdXIuaW5kZXhPZignICcgKyBjbHMgKyAnICcpIDwgMCkge1xuICAgICAgc2V0Q2xhc3MoZWwsIChjdXIgKyBjbHMpLnRyaW0oKSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIGNsYXNzIHdpdGggY29tcGF0aWJpbGl0eSBmb3IgSUUgJiBTVkdcbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge1N0cmluZ30gY2xzXG4gKi9cblxuZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWwsIGNscykge1xuICBpZiAoZWwuY2xhc3NMaXN0KSB7XG4gICAgZWwuY2xhc3NMaXN0LnJlbW92ZShjbHMpO1xuICB9IGVsc2Uge1xuICAgIHZhciBjdXIgPSAnICcgKyAoZWwuZ2V0QXR0cmlidXRlKCdjbGFzcycpIHx8ICcnKSArICcgJztcbiAgICB2YXIgdGFyID0gJyAnICsgY2xzICsgJyAnO1xuICAgIHdoaWxlIChjdXIuaW5kZXhPZih0YXIpID49IDApIHtcbiAgICAgIGN1ciA9IGN1ci5yZXBsYWNlKHRhciwgJyAnKTtcbiAgICB9XG4gICAgc2V0Q2xhc3MoZWwsIGN1ci50cmltKCkpO1xuICB9XG4gIGlmICghZWwuY2xhc3NOYW1lKSB7XG4gICAgZWwucmVtb3ZlQXR0cmlidXRlKCdjbGFzcycpO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdCByYXcgY29udGVudCBpbnNpZGUgYW4gZWxlbWVudCBpbnRvIGEgdGVtcG9yYXJ5XG4gKiBjb250YWluZXIgZGl2XG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtCb29sZWFufSBhc0ZyYWdtZW50XG4gKiBAcmV0dXJuIHtFbGVtZW50fERvY3VtZW50RnJhZ21lbnR9XG4gKi9cblxuZnVuY3Rpb24gZXh0cmFjdENvbnRlbnQoZWwsIGFzRnJhZ21lbnQpIHtcbiAgdmFyIGNoaWxkO1xuICB2YXIgcmF3Q29udGVudDtcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmIChpc1RlbXBsYXRlKGVsKSAmJiBpc0ZyYWdtZW50KGVsLmNvbnRlbnQpKSB7XG4gICAgZWwgPSBlbC5jb250ZW50O1xuICB9XG4gIGlmIChlbC5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICB0cmltTm9kZShlbCk7XG4gICAgcmF3Q29udGVudCA9IGFzRnJhZ21lbnQgPyBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCkgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25kLWFzc2lnbiAqL1xuICAgIHdoaWxlIChjaGlsZCA9IGVsLmZpcnN0Q2hpbGQpIHtcbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tY29uZC1hc3NpZ24gKi9cbiAgICAgIHJhd0NvbnRlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmF3Q29udGVudDtcbn1cblxuLyoqXG4gKiBUcmltIHBvc3NpYmxlIGVtcHR5IGhlYWQvdGFpbCB0ZXh0IGFuZCBjb21tZW50XG4gKiBub2RlcyBpbnNpZGUgYSBwYXJlbnQuXG4gKlxuICogQHBhcmFtIHtOb2RlfSBub2RlXG4gKi9cblxuZnVuY3Rpb24gdHJpbU5vZGUobm9kZSkge1xuICB2YXIgY2hpbGQ7XG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXNlcXVlbmNlcyAqL1xuICB3aGlsZSAoKGNoaWxkID0gbm9kZS5maXJzdENoaWxkLCBpc1RyaW1tYWJsZShjaGlsZCkpKSB7XG4gICAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gIH1cbiAgd2hpbGUgKChjaGlsZCA9IG5vZGUubGFzdENoaWxkLCBpc1RyaW1tYWJsZShjaGlsZCkpKSB7XG4gICAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBuby1zZXF1ZW5jZXMgKi9cbn1cblxuZnVuY3Rpb24gaXNUcmltbWFibGUobm9kZSkge1xuICByZXR1cm4gbm9kZSAmJiAobm9kZS5ub2RlVHlwZSA9PT0gMyAmJiAhbm9kZS5kYXRhLnRyaW0oKSB8fCBub2RlLm5vZGVUeXBlID09PSA4KTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhbiBlbGVtZW50IGlzIGEgdGVtcGxhdGUgdGFnLlxuICogTm90ZSBpZiB0aGUgdGVtcGxhdGUgYXBwZWFycyBpbnNpZGUgYW4gU1ZHIGl0cyB0YWdOYW1lXG4gKiB3aWxsIGJlIGluIGxvd2VyY2FzZS5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKi9cblxuZnVuY3Rpb24gaXNUZW1wbGF0ZShlbCkge1xuICByZXR1cm4gZWwudGFnTmFtZSAmJiBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICd0ZW1wbGF0ZSc7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIFwiYW5jaG9yXCIgZm9yIHBlcmZvcm1pbmcgZG9tIGluc2VydGlvbi9yZW1vdmFscy5cbiAqIFRoaXMgaXMgdXNlZCBpbiBhIG51bWJlciBvZiBzY2VuYXJpb3M6XG4gKiAtIGZyYWdtZW50IGluc3RhbmNlXG4gKiAtIHYtaHRtbFxuICogLSB2LWlmXG4gKiAtIHYtZm9yXG4gKiAtIGNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBjb250ZW50XG4gKiBAcGFyYW0ge0Jvb2xlYW59IHBlcnNpc3QgLSBJRSB0cmFzaGVzIGVtcHR5IHRleHROb2RlcyBvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVOb2RlKHRydWUpLCBzbyBpbiBjZXJ0YWluXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlcyB0aGUgYW5jaG9yIG5lZWRzIHRvIGJlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub24tZW1wdHkgdG8gYmUgcGVyc2lzdGVkIGluXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZXMuXG4gKiBAcmV0dXJuIHtDb21tZW50fFRleHR9XG4gKi9cblxuZnVuY3Rpb24gY3JlYXRlQW5jaG9yKGNvbnRlbnQsIHBlcnNpc3QpIHtcbiAgdmFyIGFuY2hvciA9IGNvbmZpZy5kZWJ1ZyA/IGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoY29udGVudCkgOiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShwZXJzaXN0ID8gJyAnIDogJycpO1xuICBhbmNob3IuX192X2FuY2hvciA9IHRydWU7XG4gIHJldHVybiBhbmNob3I7XG59XG5cbi8qKlxuICogRmluZCBhIGNvbXBvbmVudCByZWYgYXR0cmlidXRlIHRoYXQgc3RhcnRzIHdpdGggJC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IG5vZGVcbiAqIEByZXR1cm4ge1N0cmluZ3x1bmRlZmluZWR9XG4gKi9cblxudmFyIHJlZlJFID0gL152LXJlZjovO1xuXG5mdW5jdGlvbiBmaW5kUmVmKG5vZGUpIHtcbiAgaWYgKG5vZGUuaGFzQXR0cmlidXRlcygpKSB7XG4gICAgdmFyIGF0dHJzID0gbm9kZS5hdHRyaWJ1dGVzO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gYXR0cnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgbmFtZSA9IGF0dHJzW2ldLm5hbWU7XG4gICAgICBpZiAocmVmUkUudGVzdChuYW1lKSkge1xuICAgICAgICByZXR1cm4gY2FtZWxpemUobmFtZS5yZXBsYWNlKHJlZlJFLCAnJykpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1hcCBhIGZ1bmN0aW9uIHRvIGEgcmFuZ2Ugb2Ygbm9kZXMgLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICogQHBhcmFtIHtOb2RlfSBlbmRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wXG4gKi9cblxuZnVuY3Rpb24gbWFwTm9kZVJhbmdlKG5vZGUsIGVuZCwgb3ApIHtcbiAgdmFyIG5leHQ7XG4gIHdoaWxlIChub2RlICE9PSBlbmQpIHtcbiAgICBuZXh0ID0gbm9kZS5uZXh0U2libGluZztcbiAgICBvcChub2RlKTtcbiAgICBub2RlID0gbmV4dDtcbiAgfVxuICBvcChlbmQpO1xufVxuXG4vKipcbiAqIFJlbW92ZSBhIHJhbmdlIG9mIG5vZGVzIHdpdGggdHJhbnNpdGlvbiwgc3RvcmVcbiAqIHRoZSBub2RlcyBpbiBhIGZyYWdtZW50IHdpdGggY29ycmVjdCBvcmRlcmluZyxcbiAqIGFuZCBjYWxsIGNhbGxiYWNrIHdoZW4gZG9uZS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IHN0YXJ0XG4gKiBAcGFyYW0ge05vZGV9IGVuZFxuICogQHBhcmFtIHtWdWV9IHZtXG4gKiBAcGFyYW0ge0RvY3VtZW50RnJhZ21lbnR9IGZyYWdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gKi9cblxuZnVuY3Rpb24gcmVtb3ZlTm9kZVJhbmdlKHN0YXJ0LCBlbmQsIHZtLCBmcmFnLCBjYikge1xuICB2YXIgZG9uZSA9IGZhbHNlO1xuICB2YXIgcmVtb3ZlZCA9IDA7XG4gIHZhciBub2RlcyA9IFtdO1xuICBtYXBOb2RlUmFuZ2Uoc3RhcnQsIGVuZCwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBpZiAobm9kZSA9PT0gZW5kKSBkb25lID0gdHJ1ZTtcbiAgICBub2Rlcy5wdXNoKG5vZGUpO1xuICAgIHJlbW92ZVdpdGhUcmFuc2l0aW9uKG5vZGUsIHZtLCBvblJlbW92ZWQpO1xuICB9KTtcbiAgZnVuY3Rpb24gb25SZW1vdmVkKCkge1xuICAgIHJlbW92ZWQrKztcbiAgICBpZiAoZG9uZSAmJiByZW1vdmVkID49IG5vZGVzLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmcmFnLmFwcGVuZENoaWxkKG5vZGVzW2ldKTtcbiAgICAgIH1cbiAgICAgIGNiICYmIGNiKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBub2RlIGlzIGEgRG9jdW1lbnRGcmFnbWVudC5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gaXNGcmFnbWVudChub2RlKSB7XG4gIHJldHVybiBub2RlICYmIG5vZGUubm9kZVR5cGUgPT09IDExO1xufVxuXG4vKipcbiAqIEdldCBvdXRlckhUTUwgb2YgZWxlbWVudHMsIHRha2luZyBjYXJlXG4gKiBvZiBTVkcgZWxlbWVudHMgaW4gSUUgYXMgd2VsbC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gZ2V0T3V0ZXJIVE1MKGVsKSB7XG4gIGlmIChlbC5vdXRlckhUTUwpIHtcbiAgICByZXR1cm4gZWwub3V0ZXJIVE1MO1xuICB9IGVsc2Uge1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWwuY2xvbmVOb2RlKHRydWUpKTtcbiAgICByZXR1cm4gY29udGFpbmVyLmlubmVySFRNTDtcbiAgfVxufVxuXG52YXIgY29tbW9uVGFnUkUgPSAvXihkaXZ8cHxzcGFufGltZ3xhfGJ8aXxicnx1bHxvbHxsaXxoMXxoMnxoM3xoNHxoNXxoNnxjb2RlfHByZXx0YWJsZXx0aHx0ZHx0cnxmb3JtfGxhYmVsfGlucHV0fHNlbGVjdHxvcHRpb258bmF2fGFydGljbGV8c2VjdGlvbnxoZWFkZXJ8Zm9vdGVyKSQvO1xudmFyIHJlc2VydmVkVGFnUkUgPSAvXihzbG90fHBhcnRpYWx8Y29tcG9uZW50KSQvO1xuXG52YXIgaXNVbmtub3duRWxlbWVudCA9IHVuZGVmaW5lZDtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIGlzVW5rbm93bkVsZW1lbnQgPSBmdW5jdGlvbiAoZWwsIHRhZykge1xuICAgIGlmICh0YWcuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzI4MjEwMzY0LzEwNzAyNDRcbiAgICAgIHJldHVybiBlbC5jb25zdHJ1Y3RvciA9PT0gd2luZG93LkhUTUxVbmtub3duRWxlbWVudCB8fCBlbC5jb25zdHJ1Y3RvciA9PT0gd2luZG93LkhUTUxFbGVtZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gKC9IVE1MVW5rbm93bkVsZW1lbnQvLnRlc3QoZWwudG9TdHJpbmcoKSkgJiZcbiAgICAgICAgLy8gQ2hyb21lIHJldHVybnMgdW5rbm93biBmb3Igc2V2ZXJhbCBIVE1MNSBlbGVtZW50cy5cbiAgICAgICAgLy8gaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTU0MDUyNlxuICAgICAgICAhL14oZGF0YXx0aW1lfHJ0Y3xyYikkLy50ZXN0KHRhZylcbiAgICAgICk7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGFuIGVsZW1lbnQgaXMgYSBjb21wb25lbnQsIGlmIHllcyByZXR1cm4gaXRzXG4gKiBjb21wb25lbnQgaWQuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge09iamVjdHx1bmRlZmluZWR9XG4gKi9cblxuZnVuY3Rpb24gY2hlY2tDb21wb25lbnRBdHRyKGVsLCBvcHRpb25zKSB7XG4gIHZhciB0YWcgPSBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gIHZhciBoYXNBdHRycyA9IGVsLmhhc0F0dHJpYnV0ZXMoKTtcbiAgaWYgKCFjb21tb25UYWdSRS50ZXN0KHRhZykgJiYgIXJlc2VydmVkVGFnUkUudGVzdCh0YWcpKSB7XG4gICAgaWYgKHJlc29sdmVBc3NldChvcHRpb25zLCAnY29tcG9uZW50cycsIHRhZykpIHtcbiAgICAgIHJldHVybiB7IGlkOiB0YWcgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGlzID0gaGFzQXR0cnMgJiYgZ2V0SXNCaW5kaW5nKGVsKTtcbiAgICAgIGlmIChpcykge1xuICAgICAgICByZXR1cm4gaXM7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgdmFyIGV4cGVjdGVkVGFnID0gb3B0aW9ucy5fY29tcG9uZW50TmFtZU1hcCAmJiBvcHRpb25zLl9jb21wb25lbnROYW1lTWFwW3RhZ107XG4gICAgICAgIGlmIChleHBlY3RlZFRhZykge1xuICAgICAgICAgIHdhcm4oJ1Vua25vd24gY3VzdG9tIGVsZW1lbnQ6IDwnICsgdGFnICsgJz4gLSAnICsgJ2RpZCB5b3UgbWVhbiA8JyArIGV4cGVjdGVkVGFnICsgJz4/ICcgKyAnSFRNTCBpcyBjYXNlLWluc2Vuc2l0aXZlLCByZW1lbWJlciB0byB1c2Uga2ViYWItY2FzZSBpbiB0ZW1wbGF0ZXMuJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVbmtub3duRWxlbWVudChlbCwgdGFnKSkge1xuICAgICAgICAgIHdhcm4oJ1Vua25vd24gY3VzdG9tIGVsZW1lbnQ6IDwnICsgdGFnICsgJz4gLSBkaWQgeW91ICcgKyAncmVnaXN0ZXIgdGhlIGNvbXBvbmVudCBjb3JyZWN0bHk/IEZvciByZWN1cnNpdmUgY29tcG9uZW50cywgJyArICdtYWtlIHN1cmUgdG8gcHJvdmlkZSB0aGUgXCJuYW1lXCIgb3B0aW9uLicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGhhc0F0dHJzKSB7XG4gICAgcmV0dXJuIGdldElzQmluZGluZyhlbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXQgXCJpc1wiIGJpbmRpbmcgZnJvbSBhbiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEByZXR1cm4ge09iamVjdHx1bmRlZmluZWR9XG4gKi9cblxuZnVuY3Rpb24gZ2V0SXNCaW5kaW5nKGVsKSB7XG4gIC8vIGR5bmFtaWMgc3ludGF4XG4gIHZhciBleHAgPSBnZXRBdHRyKGVsLCAnaXMnKTtcbiAgaWYgKGV4cCAhPSBudWxsKSB7XG4gICAgcmV0dXJuIHsgaWQ6IGV4cCB9O1xuICB9IGVsc2Uge1xuICAgIGV4cCA9IGdldEJpbmRBdHRyKGVsLCAnaXMnKTtcbiAgICBpZiAoZXhwICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB7IGlkOiBleHAsIGR5bmFtaWM6IHRydWUgfTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgYSBwcm9wJ3MgaW5pdGlhbCB2YWx1ZSBvbiBhIHZtIGFuZCBpdHMgZGF0YSBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtWdWV9IHZtXG4gKiBAcGFyYW0ge09iamVjdH0gcHJvcFxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICovXG5cbmZ1bmN0aW9uIGluaXRQcm9wKHZtLCBwcm9wLCB2YWx1ZSkge1xuICB2YXIga2V5ID0gcHJvcC5wYXRoO1xuICB2YWx1ZSA9IGNvZXJjZVByb3AocHJvcCwgdmFsdWUpO1xuICB2bVtrZXldID0gdm0uX2RhdGFba2V5XSA9IGFzc2VydFByb3AocHJvcCwgdmFsdWUpID8gdmFsdWUgOiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQXNzZXJ0IHdoZXRoZXIgYSBwcm9wIGlzIHZhbGlkLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wXG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKi9cblxuZnVuY3Rpb24gYXNzZXJ0UHJvcChwcm9wLCB2YWx1ZSkge1xuICBpZiAoIXByb3Aub3B0aW9ucy5yZXF1aXJlZCAmJiAoIC8vIG5vbi1yZXF1aXJlZFxuICBwcm9wLnJhdyA9PT0gbnVsbCB8fCAvLyBhYnNjZW50XG4gIHZhbHVlID09IG51bGwpIC8vIG51bGwgb3IgdW5kZWZpbmVkXG4gICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB2YXIgb3B0aW9ucyA9IHByb3Aub3B0aW9ucztcbiAgdmFyIHR5cGUgPSBvcHRpb25zLnR5cGU7XG4gIHZhciB2YWxpZCA9IHRydWU7XG4gIHZhciBleHBlY3RlZFR5cGU7XG4gIGlmICh0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT09IFN0cmluZykge1xuICAgICAgZXhwZWN0ZWRUeXBlID0gJ3N0cmluZyc7XG4gICAgICB2YWxpZCA9IHR5cGVvZiB2YWx1ZSA9PT0gZXhwZWN0ZWRUeXBlO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gTnVtYmVyKSB7XG4gICAgICBleHBlY3RlZFR5cGUgPSAnbnVtYmVyJztcbiAgICAgIHZhbGlkID0gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJztcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IEJvb2xlYW4pIHtcbiAgICAgIGV4cGVjdGVkVHlwZSA9ICdib29sZWFuJztcbiAgICAgIHZhbGlkID0gdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbic7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBGdW5jdGlvbikge1xuICAgICAgZXhwZWN0ZWRUeXBlID0gJ2Z1bmN0aW9uJztcbiAgICAgIHZhbGlkID0gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gT2JqZWN0KSB7XG4gICAgICBleHBlY3RlZFR5cGUgPSAnb2JqZWN0JztcbiAgICAgIHZhbGlkID0gaXNQbGFpbk9iamVjdCh2YWx1ZSk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBBcnJheSkge1xuICAgICAgZXhwZWN0ZWRUeXBlID0gJ2FycmF5JztcbiAgICAgIHZhbGlkID0gaXNBcnJheSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbGlkID0gdmFsdWUgaW5zdGFuY2VvZiB0eXBlO1xuICAgIH1cbiAgfVxuICBpZiAoIXZhbGlkKSB7XG4gICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKCdJbnZhbGlkIHByb3A6IHR5cGUgY2hlY2sgZmFpbGVkIGZvciAnICsgcHJvcC5wYXRoICsgJz1cIicgKyBwcm9wLnJhdyArICdcIi4nICsgJyBFeHBlY3RlZCAnICsgZm9ybWF0VHlwZShleHBlY3RlZFR5cGUpICsgJywgZ290ICcgKyBmb3JtYXRWYWx1ZSh2YWx1ZSkgKyAnLicpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgdmFsaWRhdG9yID0gb3B0aW9ucy52YWxpZGF0b3I7XG4gIGlmICh2YWxpZGF0b3IpIHtcbiAgICBpZiAoIXZhbGlkYXRvcih2YWx1ZSkpIHtcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybignSW52YWxpZCBwcm9wOiBjdXN0b20gdmFsaWRhdG9yIGNoZWNrIGZhaWxlZCBmb3IgJyArIHByb3AucGF0aCArICc9XCInICsgcHJvcC5yYXcgKyAnXCInKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogRm9yY2UgcGFyc2luZyB2YWx1ZSB3aXRoIGNvZXJjZSBvcHRpb24uXG4gKlxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4geyp9XG4gKi9cblxuZnVuY3Rpb24gY29lcmNlUHJvcChwcm9wLCB2YWx1ZSkge1xuICB2YXIgY29lcmNlID0gcHJvcC5vcHRpb25zLmNvZXJjZTtcbiAgaWYgKCFjb2VyY2UpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgLy8gY29lcmNlIGlzIGEgZnVuY3Rpb25cbiAgcmV0dXJuIGNvZXJjZSh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFR5cGUodmFsKSB7XG4gIHJldHVybiB2YWwgPyB2YWwuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB2YWwuc2xpY2UoMSkgOiAnY3VzdG9tIHR5cGUnO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZSh2YWwpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWwpLnNsaWNlKDgsIC0xKTtcbn1cblxuLyoqXG4gKiBPcHRpb24gb3ZlcndyaXRpbmcgc3RyYXRlZ2llcyBhcmUgZnVuY3Rpb25zIHRoYXQgaGFuZGxlXG4gKiBob3cgdG8gbWVyZ2UgYSBwYXJlbnQgb3B0aW9uIHZhbHVlIGFuZCBhIGNoaWxkIG9wdGlvblxuICogdmFsdWUgaW50byB0aGUgZmluYWwgdmFsdWUuXG4gKlxuICogQWxsIHN0cmF0ZWd5IGZ1bmN0aW9ucyBmb2xsb3cgdGhlIHNhbWUgc2lnbmF0dXJlOlxuICpcbiAqIEBwYXJhbSB7Kn0gcGFyZW50VmFsXG4gKiBAcGFyYW0geyp9IGNoaWxkVmFsXG4gKiBAcGFyYW0ge1Z1ZX0gW3ZtXVxuICovXG5cbnZhciBzdHJhdHMgPSBjb25maWcub3B0aW9uTWVyZ2VTdHJhdGVnaWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuLyoqXG4gKiBIZWxwZXIgdGhhdCByZWN1cnNpdmVseSBtZXJnZXMgdHdvIGRhdGEgb2JqZWN0cyB0b2dldGhlci5cbiAqL1xuXG5mdW5jdGlvbiBtZXJnZURhdGEodG8sIGZyb20pIHtcbiAgdmFyIGtleSwgdG9WYWwsIGZyb21WYWw7XG4gIGZvciAoa2V5IGluIGZyb20pIHtcbiAgICB0b1ZhbCA9IHRvW2tleV07XG4gICAgZnJvbVZhbCA9IGZyb21ba2V5XTtcbiAgICBpZiAoIWhhc093bih0bywga2V5KSkge1xuICAgICAgc2V0KHRvLCBrZXksIGZyb21WYWwpO1xuICAgIH0gZWxzZSBpZiAoaXNPYmplY3QodG9WYWwpICYmIGlzT2JqZWN0KGZyb21WYWwpKSB7XG4gICAgICBtZXJnZURhdGEodG9WYWwsIGZyb21WYWwpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdG87XG59XG5cbi8qKlxuICogRGF0YVxuICovXG5cbnN0cmF0cy5kYXRhID0gZnVuY3Rpb24gKHBhcmVudFZhbCwgY2hpbGRWYWwsIHZtKSB7XG4gIGlmICghdm0pIHtcbiAgICAvLyBpbiBhIFZ1ZS5leHRlbmQgbWVyZ2UsIGJvdGggc2hvdWxkIGJlIGZ1bmN0aW9uc1xuICAgIGlmICghY2hpbGRWYWwpIHtcbiAgICAgIHJldHVybiBwYXJlbnRWYWw7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY2hpbGRWYWwgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybignVGhlIFwiZGF0YVwiIG9wdGlvbiBzaG91bGQgYmUgYSBmdW5jdGlvbiAnICsgJ3RoYXQgcmV0dXJucyBhIHBlci1pbnN0YW5jZSB2YWx1ZSBpbiBjb21wb25lbnQgJyArICdkZWZpbml0aW9ucy4nKTtcbiAgICAgIHJldHVybiBwYXJlbnRWYWw7XG4gICAgfVxuICAgIGlmICghcGFyZW50VmFsKSB7XG4gICAgICByZXR1cm4gY2hpbGRWYWw7XG4gICAgfVxuICAgIC8vIHdoZW4gcGFyZW50VmFsICYgY2hpbGRWYWwgYXJlIGJvdGggcHJlc2VudCxcbiAgICAvLyB3ZSBuZWVkIHRvIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGVcbiAgICAvLyBtZXJnZWQgcmVzdWx0IG9mIGJvdGggZnVuY3Rpb25zLi4uIG5vIG5lZWQgdG9cbiAgICAvLyBjaGVjayBpZiBwYXJlbnRWYWwgaXMgYSBmdW5jdGlvbiBoZXJlIGJlY2F1c2VcbiAgICAvLyBpdCBoYXMgdG8gYmUgYSBmdW5jdGlvbiB0byBwYXNzIHByZXZpb3VzIG1lcmdlcy5cbiAgICByZXR1cm4gZnVuY3Rpb24gbWVyZ2VkRGF0YUZuKCkge1xuICAgICAgcmV0dXJuIG1lcmdlRGF0YShjaGlsZFZhbC5jYWxsKHRoaXMpLCBwYXJlbnRWYWwuY2FsbCh0aGlzKSk7XG4gICAgfTtcbiAgfSBlbHNlIGlmIChwYXJlbnRWYWwgfHwgY2hpbGRWYWwpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gbWVyZ2VkSW5zdGFuY2VEYXRhRm4oKSB7XG4gICAgICAvLyBpbnN0YW5jZSBtZXJnZVxuICAgICAgdmFyIGluc3RhbmNlRGF0YSA9IHR5cGVvZiBjaGlsZFZhbCA9PT0gJ2Z1bmN0aW9uJyA/IGNoaWxkVmFsLmNhbGwodm0pIDogY2hpbGRWYWw7XG4gICAgICB2YXIgZGVmYXVsdERhdGEgPSB0eXBlb2YgcGFyZW50VmFsID09PSAnZnVuY3Rpb24nID8gcGFyZW50VmFsLmNhbGwodm0pIDogdW5kZWZpbmVkO1xuICAgICAgaWYgKGluc3RhbmNlRGF0YSkge1xuICAgICAgICByZXR1cm4gbWVyZ2VEYXRhKGluc3RhbmNlRGF0YSwgZGVmYXVsdERhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHREYXRhO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG5cbi8qKlxuICogRWxcbiAqL1xuXG5zdHJhdHMuZWwgPSBmdW5jdGlvbiAocGFyZW50VmFsLCBjaGlsZFZhbCwgdm0pIHtcbiAgaWYgKCF2bSAmJiBjaGlsZFZhbCAmJiB0eXBlb2YgY2hpbGRWYWwgIT09ICdmdW5jdGlvbicpIHtcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ1RoZSBcImVsXCIgb3B0aW9uIHNob3VsZCBiZSBhIGZ1bmN0aW9uICcgKyAndGhhdCByZXR1cm5zIGEgcGVyLWluc3RhbmNlIHZhbHVlIGluIGNvbXBvbmVudCAnICsgJ2RlZmluaXRpb25zLicpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgcmV0ID0gY2hpbGRWYWwgfHwgcGFyZW50VmFsO1xuICAvLyBpbnZva2UgdGhlIGVsZW1lbnQgZmFjdG9yeSBpZiB0aGlzIGlzIGluc3RhbmNlIG1lcmdlXG4gIHJldHVybiB2bSAmJiB0eXBlb2YgcmV0ID09PSAnZnVuY3Rpb24nID8gcmV0LmNhbGwodm0pIDogcmV0O1xufTtcblxuLyoqXG4gKiBIb29rcyBhbmQgcGFyYW0gYXR0cmlidXRlcyBhcmUgbWVyZ2VkIGFzIGFycmF5cy5cbiAqL1xuXG5zdHJhdHMuaW5pdCA9IHN0cmF0cy5jcmVhdGVkID0gc3RyYXRzLnJlYWR5ID0gc3RyYXRzLmF0dGFjaGVkID0gc3RyYXRzLmRldGFjaGVkID0gc3RyYXRzLmJlZm9yZUNvbXBpbGUgPSBzdHJhdHMuY29tcGlsZWQgPSBzdHJhdHMuYmVmb3JlRGVzdHJveSA9IHN0cmF0cy5kZXN0cm95ZWQgPSBzdHJhdHMuYWN0aXZhdGUgPSBmdW5jdGlvbiAocGFyZW50VmFsLCBjaGlsZFZhbCkge1xuICByZXR1cm4gY2hpbGRWYWwgPyBwYXJlbnRWYWwgPyBwYXJlbnRWYWwuY29uY2F0KGNoaWxkVmFsKSA6IGlzQXJyYXkoY2hpbGRWYWwpID8gY2hpbGRWYWwgOiBbY2hpbGRWYWxdIDogcGFyZW50VmFsO1xufTtcblxuLyoqXG4gKiAwLjExIGRlcHJlY2F0aW9uIHdhcm5pbmdcbiAqL1xuXG5zdHJhdHMucGFyYW1BdHRyaWJ1dGVzID0gZnVuY3Rpb24gKCkge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ1wicGFyYW1BdHRyaWJ1dGVzXCIgb3B0aW9uIGhhcyBiZWVuIGRlcHJlY2F0ZWQgaW4gMC4xMi4gJyArICdVc2UgXCJwcm9wc1wiIGluc3RlYWQuJyk7XG59O1xuXG4vKipcbiAqIEFzc2V0c1xuICpcbiAqIFdoZW4gYSB2bSBpcyBwcmVzZW50IChpbnN0YW5jZSBjcmVhdGlvbiksIHdlIG5lZWQgdG8gZG9cbiAqIGEgdGhyZWUtd2F5IG1lcmdlIGJldHdlZW4gY29uc3RydWN0b3Igb3B0aW9ucywgaW5zdGFuY2VcbiAqIG9wdGlvbnMgYW5kIHBhcmVudCBvcHRpb25zLlxuICovXG5cbmZ1bmN0aW9uIG1lcmdlQXNzZXRzKHBhcmVudFZhbCwgY2hpbGRWYWwpIHtcbiAgdmFyIHJlcyA9IE9iamVjdC5jcmVhdGUocGFyZW50VmFsKTtcbiAgcmV0dXJuIGNoaWxkVmFsID8gZXh0ZW5kKHJlcywgZ3VhcmRBcnJheUFzc2V0cyhjaGlsZFZhbCkpIDogcmVzO1xufVxuXG5jb25maWcuX2Fzc2V0VHlwZXMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICBzdHJhdHNbdHlwZSArICdzJ10gPSBtZXJnZUFzc2V0cztcbn0pO1xuXG4vKipcbiAqIEV2ZW50cyAmIFdhdGNoZXJzLlxuICpcbiAqIEV2ZW50cyAmIHdhdGNoZXJzIGhhc2hlcyBzaG91bGQgbm90IG92ZXJ3cml0ZSBvbmVcbiAqIGFub3RoZXIsIHNvIHdlIG1lcmdlIHRoZW0gYXMgYXJyYXlzLlxuICovXG5cbnN0cmF0cy53YXRjaCA9IHN0cmF0cy5ldmVudHMgPSBmdW5jdGlvbiAocGFyZW50VmFsLCBjaGlsZFZhbCkge1xuICBpZiAoIWNoaWxkVmFsKSByZXR1cm4gcGFyZW50VmFsO1xuICBpZiAoIXBhcmVudFZhbCkgcmV0dXJuIGNoaWxkVmFsO1xuICB2YXIgcmV0ID0ge307XG4gIGV4dGVuZChyZXQsIHBhcmVudFZhbCk7XG4gIGZvciAodmFyIGtleSBpbiBjaGlsZFZhbCkge1xuICAgIHZhciBwYXJlbnQgPSByZXRba2V5XTtcbiAgICB2YXIgY2hpbGQgPSBjaGlsZFZhbFtrZXldO1xuICAgIGlmIChwYXJlbnQgJiYgIWlzQXJyYXkocGFyZW50KSkge1xuICAgICAgcGFyZW50ID0gW3BhcmVudF07XG4gICAgfVxuICAgIHJldFtrZXldID0gcGFyZW50ID8gcGFyZW50LmNvbmNhdChjaGlsZCkgOiBbY2hpbGRdO1xuICB9XG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIE90aGVyIG9iamVjdCBoYXNoZXMuXG4gKi9cblxuc3RyYXRzLnByb3BzID0gc3RyYXRzLm1ldGhvZHMgPSBzdHJhdHMuY29tcHV0ZWQgPSBmdW5jdGlvbiAocGFyZW50VmFsLCBjaGlsZFZhbCkge1xuICBpZiAoIWNoaWxkVmFsKSByZXR1cm4gcGFyZW50VmFsO1xuICBpZiAoIXBhcmVudFZhbCkgcmV0dXJuIGNoaWxkVmFsO1xuICB2YXIgcmV0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgZXh0ZW5kKHJldCwgcGFyZW50VmFsKTtcbiAgZXh0ZW5kKHJldCwgY2hpbGRWYWwpO1xuICByZXR1cm4gcmV0O1xufTtcblxuLyoqXG4gKiBEZWZhdWx0IHN0cmF0ZWd5LlxuICovXG5cbnZhciBkZWZhdWx0U3RyYXQgPSBmdW5jdGlvbiBkZWZhdWx0U3RyYXQocGFyZW50VmFsLCBjaGlsZFZhbCkge1xuICByZXR1cm4gY2hpbGRWYWwgPT09IHVuZGVmaW5lZCA/IHBhcmVudFZhbCA6IGNoaWxkVmFsO1xufTtcblxuLyoqXG4gKiBNYWtlIHN1cmUgY29tcG9uZW50IG9wdGlvbnMgZ2V0IGNvbnZlcnRlZCB0byBhY3R1YWxcbiAqIGNvbnN0cnVjdG9ycy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICovXG5cbmZ1bmN0aW9uIGd1YXJkQ29tcG9uZW50cyhvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLmNvbXBvbmVudHMpIHtcbiAgICB2YXIgY29tcG9uZW50cyA9IG9wdGlvbnMuY29tcG9uZW50cyA9IGd1YXJkQXJyYXlBc3NldHMob3B0aW9ucy5jb21wb25lbnRzKTtcbiAgICB2YXIgaWRzID0gT2JqZWN0LmtleXMoY29tcG9uZW50cyk7XG4gICAgdmFyIGRlZjtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgdmFyIG1hcCA9IG9wdGlvbnMuX2NvbXBvbmVudE5hbWVNYXAgPSB7fTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBpZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIga2V5ID0gaWRzW2ldO1xuICAgICAgaWYgKGNvbW1vblRhZ1JFLnRlc3Qoa2V5KSB8fCByZXNlcnZlZFRhZ1JFLnRlc3Qoa2V5KSkge1xuICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ0RvIG5vdCB1c2UgYnVpbHQtaW4gb3IgcmVzZXJ2ZWQgSFRNTCBlbGVtZW50cyBhcyBjb21wb25lbnQgJyArICdpZDogJyArIGtleSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLy8gcmVjb3JkIGEgYWxsIGxvd2VyY2FzZSA8LT4ga2ViYWItY2FzZSBtYXBwaW5nIGZvclxuICAgICAgLy8gcG9zc2libGUgY3VzdG9tIGVsZW1lbnQgY2FzZSBlcnJvciB3YXJuaW5nXG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICBtYXBba2V5LnJlcGxhY2UoLy0vZywgJycpLnRvTG93ZXJDYXNlKCldID0gaHlwaGVuYXRlKGtleSk7XG4gICAgICB9XG4gICAgICBkZWYgPSBjb21wb25lbnRzW2tleV07XG4gICAgICBpZiAoaXNQbGFpbk9iamVjdChkZWYpKSB7XG4gICAgICAgIGNvbXBvbmVudHNba2V5XSA9IFZ1ZS5leHRlbmQoZGVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBFbnN1cmUgYWxsIHByb3BzIG9wdGlvbiBzeW50YXggYXJlIG5vcm1hbGl6ZWQgaW50byB0aGVcbiAqIE9iamVjdC1iYXNlZCBmb3JtYXQuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuXG5mdW5jdGlvbiBndWFyZFByb3BzKG9wdGlvbnMpIHtcbiAgdmFyIHByb3BzID0gb3B0aW9ucy5wcm9wcztcbiAgdmFyIGksIHZhbDtcbiAgaWYgKGlzQXJyYXkocHJvcHMpKSB7XG4gICAgb3B0aW9ucy5wcm9wcyA9IHt9O1xuICAgIGkgPSBwcm9wcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgdmFsID0gcHJvcHNbaV07XG4gICAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgb3B0aW9ucy5wcm9wc1t2YWxdID0gbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAodmFsLm5hbWUpIHtcbiAgICAgICAgb3B0aW9ucy5wcm9wc1t2YWwubmFtZV0gPSB2YWw7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzUGxhaW5PYmplY3QocHJvcHMpKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhwcm9wcyk7XG4gICAgaSA9IGtleXMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHZhbCA9IHByb3BzW2tleXNbaV1dO1xuICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcHJvcHNba2V5c1tpXV0gPSB7IHR5cGU6IHZhbCB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEd1YXJkIGFuIEFycmF5LWZvcm1hdCBhc3NldHMgb3B0aW9uIGFuZCBjb252ZXJ0ZWQgaXRcbiAqIGludG8gdGhlIGtleS12YWx1ZSBPYmplY3QgZm9ybWF0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSBhc3NldHNcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5mdW5jdGlvbiBndWFyZEFycmF5QXNzZXRzKGFzc2V0cykge1xuICBpZiAoaXNBcnJheShhc3NldHMpKSB7XG4gICAgdmFyIHJlcyA9IHt9O1xuICAgIHZhciBpID0gYXNzZXRzLmxlbmd0aDtcbiAgICB2YXIgYXNzZXQ7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgYXNzZXQgPSBhc3NldHNbaV07XG4gICAgICB2YXIgaWQgPSB0eXBlb2YgYXNzZXQgPT09ICdmdW5jdGlvbicgPyBhc3NldC5vcHRpb25zICYmIGFzc2V0Lm9wdGlvbnMubmFtZSB8fCBhc3NldC5pZCA6IGFzc2V0Lm5hbWUgfHwgYXNzZXQuaWQ7XG4gICAgICBpZiAoIWlkKSB7XG4gICAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybignQXJyYXktc3ludGF4IGFzc2V0cyBtdXN0IHByb3ZpZGUgYSBcIm5hbWVcIiBvciBcImlkXCIgZmllbGQuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNbaWRdID0gYXNzZXQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cbiAgcmV0dXJuIGFzc2V0cztcbn1cblxuLyoqXG4gKiBNZXJnZSB0d28gb3B0aW9uIG9iamVjdHMgaW50byBhIG5ldyBvbmUuXG4gKiBDb3JlIHV0aWxpdHkgdXNlZCBpbiBib3RoIGluc3RhbnRpYXRpb24gYW5kIGluaGVyaXRhbmNlLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJlbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBjaGlsZFxuICogQHBhcmFtIHtWdWV9IFt2bV0gLSBpZiB2bSBpcyBwcmVzZW50LCBpbmRpY2F0ZXMgdGhpcyBpc1xuICogICAgICAgICAgICAgICAgICAgICBhbiBpbnN0YW50aWF0aW9uIG1lcmdlLlxuICovXG5cbmZ1bmN0aW9uIG1lcmdlT3B0aW9ucyhwYXJlbnQsIGNoaWxkLCB2bSkge1xuICBndWFyZENvbXBvbmVudHMoY2hpbGQpO1xuICBndWFyZFByb3BzKGNoaWxkKTtcbiAgdmFyIG9wdGlvbnMgPSB7fTtcbiAgdmFyIGtleTtcbiAgaWYgKGNoaWxkLm1peGlucykge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2hpbGQubWl4aW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgcGFyZW50ID0gbWVyZ2VPcHRpb25zKHBhcmVudCwgY2hpbGQubWl4aW5zW2ldLCB2bSk7XG4gICAgfVxuICB9XG4gIGZvciAoa2V5IGluIHBhcmVudCkge1xuICAgIG1lcmdlRmllbGQoa2V5KTtcbiAgfVxuICBmb3IgKGtleSBpbiBjaGlsZCkge1xuICAgIGlmICghaGFzT3duKHBhcmVudCwga2V5KSkge1xuICAgICAgbWVyZ2VGaWVsZChrZXkpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBtZXJnZUZpZWxkKGtleSkge1xuICAgIHZhciBzdHJhdCA9IHN0cmF0c1trZXldIHx8IGRlZmF1bHRTdHJhdDtcbiAgICBvcHRpb25zW2tleV0gPSBzdHJhdChwYXJlbnRba2V5XSwgY2hpbGRba2V5XSwgdm0sIGtleSk7XG4gIH1cbiAgcmV0dXJuIG9wdGlvbnM7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhbiBhc3NldC5cbiAqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCBiZWNhdXNlIGNoaWxkIGluc3RhbmNlcyBuZWVkIGFjY2Vzc1xuICogdG8gYXNzZXRzIGRlZmluZWQgaW4gaXRzIGFuY2VzdG9yIGNoYWluLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gKiBAcmV0dXJuIHtPYmplY3R8RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gcmVzb2x2ZUFzc2V0KG9wdGlvbnMsIHR5cGUsIGlkKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgYXNzZXRzID0gb3B0aW9uc1t0eXBlXTtcbiAgdmFyIGNhbWVsaXplZElkO1xuICByZXR1cm4gYXNzZXRzW2lkXSB8fFxuICAvLyBjYW1lbENhc2UgSURcbiAgYXNzZXRzW2NhbWVsaXplZElkID0gY2FtZWxpemUoaWQpXSB8fFxuICAvLyBQYXNjYWwgQ2FzZSBJRFxuICBhc3NldHNbY2FtZWxpemVkSWQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBjYW1lbGl6ZWRJZC5zbGljZSgxKV07XG59XG5cbi8qKlxuICogQXNzZXJ0IGFzc2V0IGV4aXN0c1xuICovXG5cbmZ1bmN0aW9uIGFzc2VydEFzc2V0KHZhbCwgdHlwZSwgaWQpIHtcbiAgaWYgKCF2YWwpIHtcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ0ZhaWxlZCB0byByZXNvbHZlICcgKyB0eXBlICsgJzogJyArIGlkKTtcbiAgfVxufVxuXG52YXIgdWlkJDEgPSAwO1xuXG4vKipcbiAqIEEgZGVwIGlzIGFuIG9ic2VydmFibGUgdGhhdCBjYW4gaGF2ZSBtdWx0aXBsZVxuICogZGlyZWN0aXZlcyBzdWJzY3JpYmluZyB0byBpdC5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRGVwKCkge1xuICB0aGlzLmlkID0gdWlkJDErKztcbiAgdGhpcy5zdWJzID0gW107XG59XG5cbi8vIHRoZSBjdXJyZW50IHRhcmdldCB3YXRjaGVyIGJlaW5nIGV2YWx1YXRlZC5cbi8vIHRoaXMgaXMgZ2xvYmFsbHkgdW5pcXVlIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb25seSBvbmVcbi8vIHdhdGNoZXIgYmVpbmcgZXZhbHVhdGVkIGF0IGFueSB0aW1lLlxuRGVwLnRhcmdldCA9IG51bGw7XG5cbi8qKlxuICogQWRkIGEgZGlyZWN0aXZlIHN1YnNjcmliZXIuXG4gKlxuICogQHBhcmFtIHtEaXJlY3RpdmV9IHN1YlxuICovXG5cbkRlcC5wcm90b3R5cGUuYWRkU3ViID0gZnVuY3Rpb24gKHN1Yikge1xuICB0aGlzLnN1YnMucHVzaChzdWIpO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYSBkaXJlY3RpdmUgc3Vic2NyaWJlci5cbiAqXG4gKiBAcGFyYW0ge0RpcmVjdGl2ZX0gc3ViXG4gKi9cblxuRGVwLnByb3RvdHlwZS5yZW1vdmVTdWIgPSBmdW5jdGlvbiAoc3ViKSB7XG4gIHRoaXMuc3Vicy4kcmVtb3ZlKHN1Yik7XG59O1xuXG4vKipcbiAqIEFkZCBzZWxmIGFzIGEgZGVwZW5kZW5jeSB0byB0aGUgdGFyZ2V0IHdhdGNoZXIuXG4gKi9cblxuRGVwLnByb3RvdHlwZS5kZXBlbmQgPSBmdW5jdGlvbiAoKSB7XG4gIERlcC50YXJnZXQuYWRkRGVwKHRoaXMpO1xufTtcblxuLyoqXG4gKiBOb3RpZnkgYWxsIHN1YnNjcmliZXJzIG9mIGEgbmV3IHZhbHVlLlxuICovXG5cbkRlcC5wcm90b3R5cGUubm90aWZ5ID0gZnVuY3Rpb24gKCkge1xuICAvLyBzdGFibGl6ZSB0aGUgc3Vic2NyaWJlciBsaXN0IGZpcnN0XG4gIHZhciBzdWJzID0gdG9BcnJheSh0aGlzLnN1YnMpO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHN1YnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgc3Vic1tpXS51cGRhdGUoKTtcbiAgfVxufTtcblxudmFyIGFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGU7XG52YXIgYXJyYXlNZXRob2RzID0gT2JqZWN0LmNyZWF0ZShhcnJheVByb3RvKVxuXG4vKipcbiAqIEludGVyY2VwdCBtdXRhdGluZyBtZXRob2RzIGFuZCBlbWl0IGV2ZW50c1xuICovXG5cbjtbJ3B1c2gnLCAncG9wJywgJ3NoaWZ0JywgJ3Vuc2hpZnQnLCAnc3BsaWNlJywgJ3NvcnQnLCAncmV2ZXJzZSddLmZvckVhY2goZnVuY3Rpb24gKG1ldGhvZCkge1xuICAvLyBjYWNoZSBvcmlnaW5hbCBtZXRob2RcbiAgdmFyIG9yaWdpbmFsID0gYXJyYXlQcm90b1ttZXRob2RdO1xuICBkZWYoYXJyYXlNZXRob2RzLCBtZXRob2QsIGZ1bmN0aW9uIG11dGF0b3IoKSB7XG4gICAgLy8gYXZvaWQgbGVha2luZyBhcmd1bWVudHM6XG4gICAgLy8gaHR0cDovL2pzcGVyZi5jb20vY2xvc3VyZS13aXRoLWFyZ3VtZW50c1xuICAgIHZhciBpID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShpKTtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2ldO1xuICAgIH1cbiAgICB2YXIgcmVzdWx0ID0gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJncyk7XG4gICAgdmFyIG9iID0gdGhpcy5fX29iX187XG4gICAgdmFyIGluc2VydGVkO1xuICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICBjYXNlICdwdXNoJzpcbiAgICAgICAgaW5zZXJ0ZWQgPSBhcmdzO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3Vuc2hpZnQnOlxuICAgICAgICBpbnNlcnRlZCA9IGFyZ3M7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3BsaWNlJzpcbiAgICAgICAgaW5zZXJ0ZWQgPSBhcmdzLnNsaWNlKDIpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKGluc2VydGVkKSBvYi5vYnNlcnZlQXJyYXkoaW5zZXJ0ZWQpO1xuICAgIC8vIG5vdGlmeSBjaGFuZ2VcbiAgICBvYi5kZXAubm90aWZ5KCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG59KTtcblxuLyoqXG4gKiBTd2FwIHRoZSBlbGVtZW50IGF0IHRoZSBnaXZlbiBpbmRleCB3aXRoIGEgbmV3IHZhbHVlXG4gKiBhbmQgZW1pdHMgY29ycmVzcG9uZGluZyBldmVudC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gaW5kZXhcbiAqIEBwYXJhbSB7Kn0gdmFsXG4gKiBAcmV0dXJuIHsqfSAtIHJlcGxhY2VkIGVsZW1lbnRcbiAqL1xuXG5kZWYoYXJyYXlQcm90bywgJyRzZXQnLCBmdW5jdGlvbiAkc2V0KGluZGV4LCB2YWwpIHtcbiAgaWYgKGluZGV4ID49IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhpcy5sZW5ndGggPSBOdW1iZXIoaW5kZXgpICsgMTtcbiAgfVxuICByZXR1cm4gdGhpcy5zcGxpY2UoaW5kZXgsIDEsIHZhbClbMF07XG59KTtcblxuLyoqXG4gKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gcmVtb3ZlIHRoZSBlbGVtZW50IGF0IGdpdmVuIGluZGV4LlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleFxuICogQHBhcmFtIHsqfSB2YWxcbiAqL1xuXG5kZWYoYXJyYXlQcm90bywgJyRyZW1vdmUnLCBmdW5jdGlvbiAkcmVtb3ZlKGl0ZW0pIHtcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmICghdGhpcy5sZW5ndGgpIHJldHVybjtcbiAgdmFyIGluZGV4ID0gaW5kZXhPZih0aGlzLCBpdGVtKTtcbiAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICByZXR1cm4gdGhpcy5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG59KTtcblxudmFyIGFycmF5S2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGFycmF5TWV0aG9kcyk7XG5cbi8qKlxuICogT2JzZXJ2ZXIgY2xhc3MgdGhhdCBhcmUgYXR0YWNoZWQgdG8gZWFjaCBvYnNlcnZlZFxuICogb2JqZWN0LiBPbmNlIGF0dGFjaGVkLCB0aGUgb2JzZXJ2ZXIgY29udmVydHMgdGFyZ2V0XG4gKiBvYmplY3QncyBwcm9wZXJ0eSBrZXlzIGludG8gZ2V0dGVyL3NldHRlcnMgdGhhdFxuICogY29sbGVjdCBkZXBlbmRlbmNpZXMgYW5kIGRpc3BhdGNoZXMgdXBkYXRlcy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gdmFsdWVcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5cbmZ1bmN0aW9uIE9ic2VydmVyKHZhbHVlKSB7XG4gIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgdGhpcy5kZXAgPSBuZXcgRGVwKCk7XG4gIGRlZih2YWx1ZSwgJ19fb2JfXycsIHRoaXMpO1xuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICB2YXIgYXVnbWVudCA9IGhhc1Byb3RvID8gcHJvdG9BdWdtZW50IDogY29weUF1Z21lbnQ7XG4gICAgYXVnbWVudCh2YWx1ZSwgYXJyYXlNZXRob2RzLCBhcnJheUtleXMpO1xuICAgIHRoaXMub2JzZXJ2ZUFycmF5KHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLndhbGsodmFsdWUpO1xuICB9XG59XG5cbi8vIEluc3RhbmNlIG1ldGhvZHNcblxuLyoqXG4gKiBXYWxrIHRocm91Z2ggZWFjaCBwcm9wZXJ0eSBhbmQgY29udmVydCB0aGVtIGludG9cbiAqIGdldHRlci9zZXR0ZXJzLiBUaGlzIG1ldGhvZCBzaG91bGQgb25seSBiZSBjYWxsZWQgd2hlblxuICogdmFsdWUgdHlwZSBpcyBPYmplY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICovXG5cbk9ic2VydmVyLnByb3RvdHlwZS53YWxrID0gZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gIGZvciAodmFyIGkgPSAwLCBsID0ga2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB0aGlzLmNvbnZlcnQoa2V5c1tpXSwgb2JqW2tleXNbaV1dKTtcbiAgfVxufTtcblxuLyoqXG4gKiBPYnNlcnZlIGEgbGlzdCBvZiBBcnJheSBpdGVtcy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBpdGVtc1xuICovXG5cbk9ic2VydmVyLnByb3RvdHlwZS5vYnNlcnZlQXJyYXkgPSBmdW5jdGlvbiAoaXRlbXMpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBpdGVtcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBvYnNlcnZlKGl0ZW1zW2ldKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDb252ZXJ0IGEgcHJvcGVydHkgaW50byBnZXR0ZXIvc2V0dGVyIHNvIHdlIGNhbiBlbWl0XG4gKiB0aGUgZXZlbnRzIHdoZW4gdGhlIHByb3BlcnR5IGlzIGFjY2Vzc2VkL2NoYW5nZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHsqfSB2YWxcbiAqL1xuXG5PYnNlcnZlci5wcm90b3R5cGUuY29udmVydCA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICBkZWZpbmVSZWFjdGl2ZSh0aGlzLnZhbHVlLCBrZXksIHZhbCk7XG59O1xuXG4vKipcbiAqIEFkZCBhbiBvd25lciB2bSwgc28gdGhhdCB3aGVuICRzZXQvJGRlbGV0ZSBtdXRhdGlvbnNcbiAqIGhhcHBlbiB3ZSBjYW4gbm90aWZ5IG93bmVyIHZtcyB0byBwcm94eSB0aGUga2V5cyBhbmRcbiAqIGRpZ2VzdCB0aGUgd2F0Y2hlcnMuIFRoaXMgaXMgb25seSBjYWxsZWQgd2hlbiB0aGUgb2JqZWN0XG4gKiBpcyBvYnNlcnZlZCBhcyBhbiBpbnN0YW5jZSdzIHJvb3QgJGRhdGEuXG4gKlxuICogQHBhcmFtIHtWdWV9IHZtXG4gKi9cblxuT2JzZXJ2ZXIucHJvdG90eXBlLmFkZFZtID0gZnVuY3Rpb24gKHZtKSB7XG4gICh0aGlzLnZtcyB8fCAodGhpcy52bXMgPSBbXSkpLnB1c2godm0pO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYW4gb3duZXIgdm0uIFRoaXMgaXMgY2FsbGVkIHdoZW4gdGhlIG9iamVjdCBpc1xuICogc3dhcHBlZCBvdXQgYXMgYW4gaW5zdGFuY2UncyAkZGF0YSBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtWdWV9IHZtXG4gKi9cblxuT2JzZXJ2ZXIucHJvdG90eXBlLnJlbW92ZVZtID0gZnVuY3Rpb24gKHZtKSB7XG4gIHRoaXMudm1zLiRyZW1vdmUodm0pO1xufTtcblxuLy8gaGVscGVyc1xuXG4vKipcbiAqIEF1Z21lbnQgYW4gdGFyZ2V0IE9iamVjdCBvciBBcnJheSBieSBpbnRlcmNlcHRpbmdcbiAqIHRoZSBwcm90b3R5cGUgY2hhaW4gdXNpbmcgX19wcm90b19fXG4gKlxuICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IHRhcmdldFxuICogQHBhcmFtIHtPYmplY3R9IHByb3RvXG4gKi9cblxuZnVuY3Rpb24gcHJvdG9BdWdtZW50KHRhcmdldCwgc3JjKSB7XG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG4gIHRhcmdldC5fX3Byb3RvX18gPSBzcmM7XG4gIC8qIGVzbGludC1lbmFibGUgbm8tcHJvdG8gKi9cbn1cblxuLyoqXG4gKiBBdWdtZW50IGFuIHRhcmdldCBPYmplY3Qgb3IgQXJyYXkgYnkgZGVmaW5pbmdcbiAqIGhpZGRlbiBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSB0YXJnZXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm90b1xuICovXG5cbmZ1bmN0aW9uIGNvcHlBdWdtZW50KHRhcmdldCwgc3JjLCBrZXlzKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsID0ga2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICBkZWYodGFyZ2V0LCBrZXksIHNyY1trZXldKTtcbiAgfVxufVxuXG4vKipcbiAqIEF0dGVtcHQgdG8gY3JlYXRlIGFuIG9ic2VydmVyIGluc3RhbmNlIGZvciBhIHZhbHVlLFxuICogcmV0dXJucyB0aGUgbmV3IG9ic2VydmVyIGlmIHN1Y2Nlc3NmdWxseSBvYnNlcnZlZCxcbiAqIG9yIHRoZSBleGlzdGluZyBvYnNlcnZlciBpZiB0aGUgdmFsdWUgYWxyZWFkeSBoYXMgb25lLlxuICpcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqIEBwYXJhbSB7VnVlfSBbdm1dXG4gKiBAcmV0dXJuIHtPYnNlcnZlcnx1bmRlZmluZWR9XG4gKiBAc3RhdGljXG4gKi9cblxuZnVuY3Rpb24gb2JzZXJ2ZSh2YWx1ZSwgdm0pIHtcbiAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBvYjtcbiAgaWYgKGhhc093bih2YWx1ZSwgJ19fb2JfXycpICYmIHZhbHVlLl9fb2JfXyBpbnN0YW5jZW9mIE9ic2VydmVyKSB7XG4gICAgb2IgPSB2YWx1ZS5fX29iX187XG4gIH0gZWxzZSBpZiAoKGlzQXJyYXkodmFsdWUpIHx8IGlzUGxhaW5PYmplY3QodmFsdWUpKSAmJiBPYmplY3QuaXNFeHRlbnNpYmxlKHZhbHVlKSAmJiAhdmFsdWUuX2lzVnVlKSB7XG4gICAgb2IgPSBuZXcgT2JzZXJ2ZXIodmFsdWUpO1xuICB9XG4gIGlmIChvYiAmJiB2bSkge1xuICAgIG9iLmFkZFZtKHZtKTtcbiAgfVxuICByZXR1cm4gb2I7XG59XG5cbi8qKlxuICogRGVmaW5lIGEgcmVhY3RpdmUgcHJvcGVydHkgb24gYW4gT2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7Kn0gdmFsXG4gKi9cblxuZnVuY3Rpb24gZGVmaW5lUmVhY3RpdmUob2JqLCBrZXksIHZhbCkge1xuICB2YXIgZGVwID0gbmV3IERlcCgpO1xuXG4gIHZhciBwcm9wZXJ0eSA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpO1xuICBpZiAocHJvcGVydHkgJiYgcHJvcGVydHkuY29uZmlndXJhYmxlID09PSBmYWxzZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGNhdGVyIGZvciBwcmUtZGVmaW5lZCBnZXR0ZXIvc2V0dGVyc1xuICB2YXIgZ2V0dGVyID0gcHJvcGVydHkgJiYgcHJvcGVydHkuZ2V0O1xuICB2YXIgc2V0dGVyID0gcHJvcGVydHkgJiYgcHJvcGVydHkuc2V0O1xuXG4gIHZhciBjaGlsZE9iID0gb2JzZXJ2ZSh2YWwpO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIHJlYWN0aXZlR2V0dGVyKCkge1xuICAgICAgdmFyIHZhbHVlID0gZ2V0dGVyID8gZ2V0dGVyLmNhbGwob2JqKSA6IHZhbDtcbiAgICAgIGlmIChEZXAudGFyZ2V0KSB7XG4gICAgICAgIGRlcC5kZXBlbmQoKTtcbiAgICAgICAgaWYgKGNoaWxkT2IpIHtcbiAgICAgICAgICBjaGlsZE9iLmRlcC5kZXBlbmQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICBmb3IgKHZhciBlLCBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgZSA9IHZhbHVlW2ldO1xuICAgICAgICAgICAgZSAmJiBlLl9fb2JfXyAmJiBlLl9fb2JfXy5kZXAuZGVwZW5kKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHJlYWN0aXZlU2V0dGVyKG5ld1ZhbCkge1xuICAgICAgdmFyIHZhbHVlID0gZ2V0dGVyID8gZ2V0dGVyLmNhbGwob2JqKSA6IHZhbDtcbiAgICAgIGlmIChuZXdWYWwgPT09IHZhbHVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChzZXR0ZXIpIHtcbiAgICAgICAgc2V0dGVyLmNhbGwob2JqLCBuZXdWYWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsID0gbmV3VmFsO1xuICAgICAgfVxuICAgICAgY2hpbGRPYiA9IG9ic2VydmUobmV3VmFsKTtcbiAgICAgIGRlcC5ub3RpZnkoKTtcbiAgICB9XG4gIH0pO1xufVxuXG5cblxudmFyIHV0aWwgPSBPYmplY3QuZnJlZXplKHtcblx0ZGVmaW5lUmVhY3RpdmU6IGRlZmluZVJlYWN0aXZlLFxuXHRzZXQ6IHNldCxcblx0ZGVsOiBkZWwsXG5cdGhhc093bjogaGFzT3duLFxuXHRpc0xpdGVyYWw6IGlzTGl0ZXJhbCxcblx0aXNSZXNlcnZlZDogaXNSZXNlcnZlZCxcblx0X3RvU3RyaW5nOiBfdG9TdHJpbmcsXG5cdHRvTnVtYmVyOiB0b051bWJlcixcblx0dG9Cb29sZWFuOiB0b0Jvb2xlYW4sXG5cdHN0cmlwUXVvdGVzOiBzdHJpcFF1b3Rlcyxcblx0Y2FtZWxpemU6IGNhbWVsaXplLFxuXHRoeXBoZW5hdGU6IGh5cGhlbmF0ZSxcblx0Y2xhc3NpZnk6IGNsYXNzaWZ5LFxuXHRiaW5kOiBiaW5kLFxuXHR0b0FycmF5OiB0b0FycmF5LFxuXHRleHRlbmQ6IGV4dGVuZCxcblx0aXNPYmplY3Q6IGlzT2JqZWN0LFxuXHRpc1BsYWluT2JqZWN0OiBpc1BsYWluT2JqZWN0LFxuXHRkZWY6IGRlZixcblx0ZGVib3VuY2U6IF9kZWJvdW5jZSxcblx0aW5kZXhPZjogaW5kZXhPZixcblx0Y2FuY2VsbGFibGU6IGNhbmNlbGxhYmxlLFxuXHRsb29zZUVxdWFsOiBsb29zZUVxdWFsLFxuXHRpc0FycmF5OiBpc0FycmF5LFxuXHRoYXNQcm90bzogaGFzUHJvdG8sXG5cdGluQnJvd3NlcjogaW5Ccm93c2VyLFxuXHRkZXZ0b29sczogZGV2dG9vbHMsXG5cdGlzSUU5OiBpc0lFOSxcblx0aXNBbmRyb2lkOiBpc0FuZHJvaWQsXG5cdGdldCB0cmFuc2l0aW9uUHJvcCAoKSB7IHJldHVybiB0cmFuc2l0aW9uUHJvcDsgfSxcblx0Z2V0IHRyYW5zaXRpb25FbmRFdmVudCAoKSB7IHJldHVybiB0cmFuc2l0aW9uRW5kRXZlbnQ7IH0sXG5cdGdldCBhbmltYXRpb25Qcm9wICgpIHsgcmV0dXJuIGFuaW1hdGlvblByb3A7IH0sXG5cdGdldCBhbmltYXRpb25FbmRFdmVudCAoKSB7IHJldHVybiBhbmltYXRpb25FbmRFdmVudDsgfSxcblx0bmV4dFRpY2s6IG5leHRUaWNrLFxuXHRxdWVyeTogcXVlcnksXG5cdGluRG9jOiBpbkRvYyxcblx0Z2V0QXR0cjogZ2V0QXR0cixcblx0Z2V0QmluZEF0dHI6IGdldEJpbmRBdHRyLFxuXHRoYXNCaW5kQXR0cjogaGFzQmluZEF0dHIsXG5cdGJlZm9yZTogYmVmb3JlLFxuXHRhZnRlcjogYWZ0ZXIsXG5cdHJlbW92ZTogcmVtb3ZlLFxuXHRwcmVwZW5kOiBwcmVwZW5kLFxuXHRyZXBsYWNlOiByZXBsYWNlLFxuXHRvbjogb24sXG5cdG9mZjogb2ZmLFxuXHRzZXRDbGFzczogc2V0Q2xhc3MsXG5cdGFkZENsYXNzOiBhZGRDbGFzcyxcblx0cmVtb3ZlQ2xhc3M6IHJlbW92ZUNsYXNzLFxuXHRleHRyYWN0Q29udGVudDogZXh0cmFjdENvbnRlbnQsXG5cdHRyaW1Ob2RlOiB0cmltTm9kZSxcblx0aXNUZW1wbGF0ZTogaXNUZW1wbGF0ZSxcblx0Y3JlYXRlQW5jaG9yOiBjcmVhdGVBbmNob3IsXG5cdGZpbmRSZWY6IGZpbmRSZWYsXG5cdG1hcE5vZGVSYW5nZTogbWFwTm9kZVJhbmdlLFxuXHRyZW1vdmVOb2RlUmFuZ2U6IHJlbW92ZU5vZGVSYW5nZSxcblx0aXNGcmFnbWVudDogaXNGcmFnbWVudCxcblx0Z2V0T3V0ZXJIVE1MOiBnZXRPdXRlckhUTUwsXG5cdG1lcmdlT3B0aW9uczogbWVyZ2VPcHRpb25zLFxuXHRyZXNvbHZlQXNzZXQ6IHJlc29sdmVBc3NldCxcblx0YXNzZXJ0QXNzZXQ6IGFzc2VydEFzc2V0LFxuXHRjaGVja0NvbXBvbmVudEF0dHI6IGNoZWNrQ29tcG9uZW50QXR0cixcblx0aW5pdFByb3A6IGluaXRQcm9wLFxuXHRhc3NlcnRQcm9wOiBhc3NlcnRQcm9wLFxuXHRjb2VyY2VQcm9wOiBjb2VyY2VQcm9wLFxuXHRjb21tb25UYWdSRTogY29tbW9uVGFnUkUsXG5cdHJlc2VydmVkVGFnUkU6IHJlc2VydmVkVGFnUkUsXG5cdGdldCB3YXJuICgpIHsgcmV0dXJuIHdhcm47IH1cbn0pO1xuXG52YXIgdWlkID0gMDtcblxuZnVuY3Rpb24gaW5pdE1peGluIChWdWUpIHtcbiAgLyoqXG4gICAqIFRoZSBtYWluIGluaXQgc2VxdWVuY2UuIFRoaXMgaXMgY2FsbGVkIGZvciBldmVyeVxuICAgKiBpbnN0YW5jZSwgaW5jbHVkaW5nIG9uZXMgdGhhdCBhcmUgY3JlYXRlZCBmcm9tIGV4dGVuZGVkXG4gICAqIGNvbnN0cnVjdG9ycy5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSB0aGlzIG9wdGlvbnMgb2JqZWN0IHNob3VsZCBiZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSByZXN1bHQgb2YgbWVyZ2luZyBjbGFzc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgYW5kIHRoZSBvcHRpb25zIHBhc3NlZFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGluIHRvIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICB0aGlzLiRlbCA9IG51bGw7XG4gICAgdGhpcy4kcGFyZW50ID0gb3B0aW9ucy5wYXJlbnQ7XG4gICAgdGhpcy4kcm9vdCA9IHRoaXMuJHBhcmVudCA/IHRoaXMuJHBhcmVudC4kcm9vdCA6IHRoaXM7XG4gICAgdGhpcy4kY2hpbGRyZW4gPSBbXTtcbiAgICB0aGlzLiRyZWZzID0ge307IC8vIGNoaWxkIHZtIHJlZmVyZW5jZXNcbiAgICB0aGlzLiRlbHMgPSB7fTsgLy8gZWxlbWVudCByZWZlcmVuY2VzXG4gICAgdGhpcy5fd2F0Y2hlcnMgPSBbXTsgLy8gYWxsIHdhdGNoZXJzIGFzIGFuIGFycmF5XG4gICAgdGhpcy5fZGlyZWN0aXZlcyA9IFtdOyAvLyBhbGwgZGlyZWN0aXZlc1xuXG4gICAgLy8gYSB1aWRcbiAgICB0aGlzLl91aWQgPSB1aWQrKztcblxuICAgIC8vIGEgZmxhZyB0byBhdm9pZCB0aGlzIGJlaW5nIG9ic2VydmVkXG4gICAgdGhpcy5faXNWdWUgPSB0cnVlO1xuXG4gICAgLy8gZXZlbnRzIGJvb2trZWVwaW5nXG4gICAgdGhpcy5fZXZlbnRzID0ge307IC8vIHJlZ2lzdGVyZWQgY2FsbGJhY2tzXG4gICAgdGhpcy5fZXZlbnRzQ291bnQgPSB7fTsgLy8gZm9yICRicm9hZGNhc3Qgb3B0aW1pemF0aW9uXG5cbiAgICAvLyBmcmFnbWVudCBpbnN0YW5jZSBwcm9wZXJ0aWVzXG4gICAgdGhpcy5faXNGcmFnbWVudCA9IGZhbHNlO1xuICAgIHRoaXMuX2ZyYWdtZW50ID0gLy8gQHR5cGUge0RvY3VtZW50RnJhZ21lbnR9XG4gICAgdGhpcy5fZnJhZ21lbnRTdGFydCA9IC8vIEB0eXBlIHtUZXh0fENvbW1lbnR9XG4gICAgdGhpcy5fZnJhZ21lbnRFbmQgPSBudWxsOyAvLyBAdHlwZSB7VGV4dHxDb21tZW50fVxuXG4gICAgLy8gbGlmZWN5Y2xlIHN0YXRlXG4gICAgdGhpcy5faXNDb21waWxlZCA9IHRoaXMuX2lzRGVzdHJveWVkID0gdGhpcy5faXNSZWFkeSA9IHRoaXMuX2lzQXR0YWNoZWQgPSB0aGlzLl9pc0JlaW5nRGVzdHJveWVkID0gdGhpcy5fdkZvclJlbW92aW5nID0gZmFsc2U7XG4gICAgdGhpcy5fdW5saW5rRm4gPSBudWxsO1xuXG4gICAgLy8gY29udGV4dDpcbiAgICAvLyBpZiB0aGlzIGlzIGEgdHJhbnNjbHVkZWQgY29tcG9uZW50LCBjb250ZXh0XG4gICAgLy8gd2lsbCBiZSB0aGUgY29tbW9uIHBhcmVudCB2bSBvZiB0aGlzIGluc3RhbmNlXG4gICAgLy8gYW5kIGl0cyBob3N0LlxuICAgIHRoaXMuX2NvbnRleHQgPSBvcHRpb25zLl9jb250ZXh0IHx8IHRoaXMuJHBhcmVudDtcblxuICAgIC8vIHNjb3BlOlxuICAgIC8vIGlmIHRoaXMgaXMgaW5zaWRlIGFuIGlubGluZSB2LWZvciwgdGhlIHNjb3BlXG4gICAgLy8gd2lsbCBiZSB0aGUgaW50ZXJtZWRpYXRlIHNjb3BlIGNyZWF0ZWQgZm9yIHRoaXNcbiAgICAvLyByZXBlYXQgZnJhZ21lbnQuIHRoaXMgaXMgdXNlZCBmb3IgbGlua2luZyBwcm9wc1xuICAgIC8vIGFuZCBjb250YWluZXIgZGlyZWN0aXZlcy5cbiAgICB0aGlzLl9zY29wZSA9IG9wdGlvbnMuX3Njb3BlO1xuXG4gICAgLy8gZnJhZ21lbnQ6XG4gICAgLy8gaWYgdGhpcyBpbnN0YW5jZSBpcyBjb21waWxlZCBpbnNpZGUgYSBGcmFnbWVudCwgaXRcbiAgICAvLyBuZWVkcyB0byByZWlnc3RlciBpdHNlbGYgYXMgYSBjaGlsZCBvZiB0aGF0IGZyYWdtZW50XG4gICAgLy8gZm9yIGF0dGFjaC9kZXRhY2ggdG8gd29yayBwcm9wZXJseS5cbiAgICB0aGlzLl9mcmFnID0gb3B0aW9ucy5fZnJhZztcbiAgICBpZiAodGhpcy5fZnJhZykge1xuICAgICAgdGhpcy5fZnJhZy5jaGlsZHJlbi5wdXNoKHRoaXMpO1xuICAgIH1cblxuICAgIC8vIHB1c2ggc2VsZiBpbnRvIHBhcmVudCAvIHRyYW5zY2x1c2lvbiBob3N0XG4gICAgaWYgKHRoaXMuJHBhcmVudCkge1xuICAgICAgdGhpcy4kcGFyZW50LiRjaGlsZHJlbi5wdXNoKHRoaXMpO1xuICAgIH1cblxuICAgIC8vIHNhdmUgcmF3IGNvbnN0cnVjdG9yIGRhdGEgYmVmb3JlIG1lcmdlXG4gICAgLy8gc28gdGhhdCB3ZSBrbm93IHdoaWNoIHByb3BlcnRpZXMgYXJlIHByb3ZpZGVkIGF0XG4gICAgLy8gaW5zdGFudGlhdGlvbi5cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgdGhpcy5fcnVudGltZURhdGEgPSBvcHRpb25zLmRhdGE7XG4gICAgfVxuXG4gICAgLy8gbWVyZ2Ugb3B0aW9ucy5cbiAgICBvcHRpb25zID0gdGhpcy4kb3B0aW9ucyA9IG1lcmdlT3B0aW9ucyh0aGlzLmNvbnN0cnVjdG9yLm9wdGlvbnMsIG9wdGlvbnMsIHRoaXMpO1xuXG4gICAgLy8gc2V0IHJlZlxuICAgIHRoaXMuX3VwZGF0ZVJlZigpO1xuXG4gICAgLy8gaW5pdGlhbGl6ZSBkYXRhIGFzIGVtcHR5IG9iamVjdC5cbiAgICAvLyBpdCB3aWxsIGJlIGZpbGxlZCB1cCBpbiBfaW5pdFNjb3BlKCkuXG4gICAgdGhpcy5fZGF0YSA9IHt9O1xuXG4gICAgLy8gY2FsbCBpbml0IGhvb2tcbiAgICB0aGlzLl9jYWxsSG9vaygnaW5pdCcpO1xuXG4gICAgLy8gaW5pdGlhbGl6ZSBkYXRhIG9ic2VydmF0aW9uIGFuZCBzY29wZSBpbmhlcml0YW5jZS5cbiAgICB0aGlzLl9pbml0U3RhdGUoKTtcblxuICAgIC8vIHNldHVwIGV2ZW50IHN5c3RlbSBhbmQgb3B0aW9uIGV2ZW50cy5cbiAgICB0aGlzLl9pbml0RXZlbnRzKCk7XG5cbiAgICAvLyBjYWxsIGNyZWF0ZWQgaG9va1xuICAgIHRoaXMuX2NhbGxIb29rKCdjcmVhdGVkJyk7XG5cbiAgICAvLyBpZiBgZWxgIG9wdGlvbiBpcyBwYXNzZWQsIHN0YXJ0IGNvbXBpbGF0aW9uLlxuICAgIGlmIChvcHRpb25zLmVsKSB7XG4gICAgICB0aGlzLiRtb3VudChvcHRpb25zLmVsKTtcbiAgICB9XG4gIH07XG59XG5cbnZhciBwYXRoQ2FjaGUgPSBuZXcgQ2FjaGUoMTAwMCk7XG5cbi8vIGFjdGlvbnNcbnZhciBBUFBFTkQgPSAwO1xudmFyIFBVU0ggPSAxO1xudmFyIElOQ19TVUJfUEFUSF9ERVBUSCA9IDI7XG52YXIgUFVTSF9TVUJfUEFUSCA9IDM7XG5cbi8vIHN0YXRlc1xudmFyIEJFRk9SRV9QQVRIID0gMDtcbnZhciBJTl9QQVRIID0gMTtcbnZhciBCRUZPUkVfSURFTlQgPSAyO1xudmFyIElOX0lERU5UID0gMztcbnZhciBJTl9TVUJfUEFUSCA9IDQ7XG52YXIgSU5fU0lOR0xFX1FVT1RFID0gNTtcbnZhciBJTl9ET1VCTEVfUVVPVEUgPSA2O1xudmFyIEFGVEVSX1BBVEggPSA3O1xudmFyIEVSUk9SID0gODtcblxudmFyIHBhdGhTdGF0ZU1hY2hpbmUgPSBbXTtcblxucGF0aFN0YXRlTWFjaGluZVtCRUZPUkVfUEFUSF0gPSB7XG4gICd3cyc6IFtCRUZPUkVfUEFUSF0sXG4gICdpZGVudCc6IFtJTl9JREVOVCwgQVBQRU5EXSxcbiAgJ1snOiBbSU5fU1VCX1BBVEhdLFxuICAnZW9mJzogW0FGVEVSX1BBVEhdXG59O1xuXG5wYXRoU3RhdGVNYWNoaW5lW0lOX1BBVEhdID0ge1xuICAnd3MnOiBbSU5fUEFUSF0sXG4gICcuJzogW0JFRk9SRV9JREVOVF0sXG4gICdbJzogW0lOX1NVQl9QQVRIXSxcbiAgJ2VvZic6IFtBRlRFUl9QQVRIXVxufTtcblxucGF0aFN0YXRlTWFjaGluZVtCRUZPUkVfSURFTlRdID0ge1xuICAnd3MnOiBbQkVGT1JFX0lERU5UXSxcbiAgJ2lkZW50JzogW0lOX0lERU5ULCBBUFBFTkRdXG59O1xuXG5wYXRoU3RhdGVNYWNoaW5lW0lOX0lERU5UXSA9IHtcbiAgJ2lkZW50JzogW0lOX0lERU5ULCBBUFBFTkRdLFxuICAnMCc6IFtJTl9JREVOVCwgQVBQRU5EXSxcbiAgJ251bWJlcic6IFtJTl9JREVOVCwgQVBQRU5EXSxcbiAgJ3dzJzogW0lOX1BBVEgsIFBVU0hdLFxuICAnLic6IFtCRUZPUkVfSURFTlQsIFBVU0hdLFxuICAnWyc6IFtJTl9TVUJfUEFUSCwgUFVTSF0sXG4gICdlb2YnOiBbQUZURVJfUEFUSCwgUFVTSF1cbn07XG5cbnBhdGhTdGF0ZU1hY2hpbmVbSU5fU1VCX1BBVEhdID0ge1xuICBcIidcIjogW0lOX1NJTkdMRV9RVU9URSwgQVBQRU5EXSxcbiAgJ1wiJzogW0lOX0RPVUJMRV9RVU9URSwgQVBQRU5EXSxcbiAgJ1snOiBbSU5fU1VCX1BBVEgsIElOQ19TVUJfUEFUSF9ERVBUSF0sXG4gICddJzogW0lOX1BBVEgsIFBVU0hfU1VCX1BBVEhdLFxuICAnZW9mJzogRVJST1IsXG4gICdlbHNlJzogW0lOX1NVQl9QQVRILCBBUFBFTkRdXG59O1xuXG5wYXRoU3RhdGVNYWNoaW5lW0lOX1NJTkdMRV9RVU9URV0gPSB7XG4gIFwiJ1wiOiBbSU5fU1VCX1BBVEgsIEFQUEVORF0sXG4gICdlb2YnOiBFUlJPUixcbiAgJ2Vsc2UnOiBbSU5fU0lOR0xFX1FVT1RFLCBBUFBFTkRdXG59O1xuXG5wYXRoU3RhdGVNYWNoaW5lW0lOX0RPVUJMRV9RVU9URV0gPSB7XG4gICdcIic6IFtJTl9TVUJfUEFUSCwgQVBQRU5EXSxcbiAgJ2VvZic6IEVSUk9SLFxuICAnZWxzZSc6IFtJTl9ET1VCTEVfUVVPVEUsIEFQUEVORF1cbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lIHRoZSB0eXBlIG9mIGEgY2hhcmFjdGVyIGluIGEga2V5cGF0aC5cbiAqXG4gKiBAcGFyYW0ge0NoYXJ9IGNoXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHR5cGVcbiAqL1xuXG5mdW5jdGlvbiBnZXRQYXRoQ2hhclR5cGUoY2gpIHtcbiAgaWYgKGNoID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ2VvZic7XG4gIH1cblxuICB2YXIgY29kZSA9IGNoLmNoYXJDb2RlQXQoMCk7XG5cbiAgc3dpdGNoIChjb2RlKSB7XG4gICAgY2FzZSAweDVCOiAvLyBbXG4gICAgY2FzZSAweDVEOiAvLyBdXG4gICAgY2FzZSAweDJFOiAvLyAuXG4gICAgY2FzZSAweDIyOiAvLyBcIlxuICAgIGNhc2UgMHgyNzogLy8gJ1xuICAgIGNhc2UgMHgzMDpcbiAgICAgIC8vIDBcbiAgICAgIHJldHVybiBjaDtcblxuICAgIGNhc2UgMHg1RjogLy8gX1xuICAgIGNhc2UgMHgyNDpcbiAgICAgIC8vICRcbiAgICAgIHJldHVybiAnaWRlbnQnO1xuXG4gICAgY2FzZSAweDIwOiAvLyBTcGFjZVxuICAgIGNhc2UgMHgwOTogLy8gVGFiXG4gICAgY2FzZSAweDBBOiAvLyBOZXdsaW5lXG4gICAgY2FzZSAweDBEOiAvLyBSZXR1cm5cbiAgICBjYXNlIDB4QTA6IC8vIE5vLWJyZWFrIHNwYWNlXG4gICAgY2FzZSAweEZFRkY6IC8vIEJ5dGUgT3JkZXIgTWFya1xuICAgIGNhc2UgMHgyMDI4OiAvLyBMaW5lIFNlcGFyYXRvclxuICAgIGNhc2UgMHgyMDI5OlxuICAgICAgLy8gUGFyYWdyYXBoIFNlcGFyYXRvclxuICAgICAgcmV0dXJuICd3cyc7XG4gIH1cblxuICAvLyBhLXosIEEtWlxuICBpZiAoY29kZSA+PSAweDYxICYmIGNvZGUgPD0gMHg3QSB8fCBjb2RlID49IDB4NDEgJiYgY29kZSA8PSAweDVBKSB7XG4gICAgcmV0dXJuICdpZGVudCc7XG4gIH1cblxuICAvLyAxLTlcbiAgaWYgKGNvZGUgPj0gMHgzMSAmJiBjb2RlIDw9IDB4MzkpIHtcbiAgICByZXR1cm4gJ251bWJlcic7XG4gIH1cblxuICByZXR1cm4gJ2Vsc2UnO1xufVxuXG4vKipcbiAqIEZvcm1hdCBhIHN1YlBhdGgsIHJldHVybiBpdHMgcGxhaW4gZm9ybSBpZiBpdCBpc1xuICogYSBsaXRlcmFsIHN0cmluZyBvciBudW1iZXIuIE90aGVyd2lzZSBwcmVwZW5kIHRoZVxuICogZHluYW1pYyBpbmRpY2F0b3IgKCopLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0U3ViUGF0aChwYXRoKSB7XG4gIHZhciB0cmltbWVkID0gcGF0aC50cmltKCk7XG4gIC8vIGludmFsaWQgbGVhZGluZyAwXG4gIGlmIChwYXRoLmNoYXJBdCgwKSA9PT0gJzAnICYmIGlzTmFOKHBhdGgpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBpc0xpdGVyYWwodHJpbW1lZCkgPyBzdHJpcFF1b3Rlcyh0cmltbWVkKSA6ICcqJyArIHRyaW1tZWQ7XG59XG5cbi8qKlxuICogUGFyc2UgYSBzdHJpbmcgcGF0aCBpbnRvIGFuIGFycmF5IG9mIHNlZ21lbnRzXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAqIEByZXR1cm4ge0FycmF5fHVuZGVmaW5lZH1cbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShwYXRoKSB7XG4gIHZhciBrZXlzID0gW107XG4gIHZhciBpbmRleCA9IC0xO1xuICB2YXIgbW9kZSA9IEJFRk9SRV9QQVRIO1xuICB2YXIgc3ViUGF0aERlcHRoID0gMDtcbiAgdmFyIGMsIG5ld0NoYXIsIGtleSwgdHlwZSwgdHJhbnNpdGlvbiwgYWN0aW9uLCB0eXBlTWFwO1xuXG4gIHZhciBhY3Rpb25zID0gW107XG5cbiAgYWN0aW9uc1tQVVNIXSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAga2V5ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfTtcblxuICBhY3Rpb25zW0FQUEVORF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBrZXkgPSBuZXdDaGFyO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXkgKz0gbmV3Q2hhcjtcbiAgICB9XG4gIH07XG5cbiAgYWN0aW9uc1tJTkNfU1VCX1BBVEhfREVQVEhdID0gZnVuY3Rpb24gKCkge1xuICAgIGFjdGlvbnNbQVBQRU5EXSgpO1xuICAgIHN1YlBhdGhEZXB0aCsrO1xuICB9O1xuXG4gIGFjdGlvbnNbUFVTSF9TVUJfUEFUSF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHN1YlBhdGhEZXB0aCA+IDApIHtcbiAgICAgIHN1YlBhdGhEZXB0aC0tO1xuICAgICAgbW9kZSA9IElOX1NVQl9QQVRIO1xuICAgICAgYWN0aW9uc1tBUFBFTkRdKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1YlBhdGhEZXB0aCA9IDA7XG4gICAgICBrZXkgPSBmb3JtYXRTdWJQYXRoKGtleSk7XG4gICAgICBpZiAoa2V5ID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhY3Rpb25zW1BVU0hdKCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIG1heWJlVW5lc2NhcGVRdW90ZSgpIHtcbiAgICB2YXIgbmV4dENoYXIgPSBwYXRoW2luZGV4ICsgMV07XG4gICAgaWYgKG1vZGUgPT09IElOX1NJTkdMRV9RVU9URSAmJiBuZXh0Q2hhciA9PT0gXCInXCIgfHwgbW9kZSA9PT0gSU5fRE9VQkxFX1FVT1RFICYmIG5leHRDaGFyID09PSAnXCInKSB7XG4gICAgICBpbmRleCsrO1xuICAgICAgbmV3Q2hhciA9ICdcXFxcJyArIG5leHRDaGFyO1xuICAgICAgYWN0aW9uc1tBUFBFTkRdKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICB3aGlsZSAobW9kZSAhPSBudWxsKSB7XG4gICAgaW5kZXgrKztcbiAgICBjID0gcGF0aFtpbmRleF07XG5cbiAgICBpZiAoYyA9PT0gJ1xcXFwnICYmIG1heWJlVW5lc2NhcGVRdW90ZSgpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICB0eXBlID0gZ2V0UGF0aENoYXJUeXBlKGMpO1xuICAgIHR5cGVNYXAgPSBwYXRoU3RhdGVNYWNoaW5lW21vZGVdO1xuICAgIHRyYW5zaXRpb24gPSB0eXBlTWFwW3R5cGVdIHx8IHR5cGVNYXBbJ2Vsc2UnXSB8fCBFUlJPUjtcblxuICAgIGlmICh0cmFuc2l0aW9uID09PSBFUlJPUikge1xuICAgICAgcmV0dXJuOyAvLyBwYXJzZSBlcnJvclxuICAgIH1cblxuICAgIG1vZGUgPSB0cmFuc2l0aW9uWzBdO1xuICAgIGFjdGlvbiA9IGFjdGlvbnNbdHJhbnNpdGlvblsxXV07XG4gICAgaWYgKGFjdGlvbikge1xuICAgICAgbmV3Q2hhciA9IHRyYW5zaXRpb25bMl07XG4gICAgICBuZXdDaGFyID0gbmV3Q2hhciA9PT0gdW5kZWZpbmVkID8gYyA6IG5ld0NoYXI7XG4gICAgICBpZiAoYWN0aW9uKCkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobW9kZSA9PT0gQUZURVJfUEFUSCkge1xuICAgICAga2V5cy5yYXcgPSBwYXRoO1xuICAgICAgcmV0dXJuIGtleXM7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRXh0ZXJuYWwgcGFyc2UgdGhhdCBjaGVjayBmb3IgYSBjYWNoZSBoaXQgZmlyc3RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHJldHVybiB7QXJyYXl8dW5kZWZpbmVkfVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlUGF0aChwYXRoKSB7XG4gIHZhciBoaXQgPSBwYXRoQ2FjaGUuZ2V0KHBhdGgpO1xuICBpZiAoIWhpdCkge1xuICAgIGhpdCA9IHBhcnNlKHBhdGgpO1xuICAgIGlmIChoaXQpIHtcbiAgICAgIHBhdGhDYWNoZS5wdXQocGF0aCwgaGl0KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGhpdDtcbn1cblxuLyoqXG4gKiBHZXQgZnJvbSBhbiBvYmplY3QgZnJvbSBhIHBhdGggc3RyaW5nXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAqL1xuXG5mdW5jdGlvbiBnZXRQYXRoKG9iaiwgcGF0aCkge1xuICByZXR1cm4gcGFyc2VFeHByZXNzaW9uKHBhdGgpLmdldChvYmopO1xufVxuXG4vKipcbiAqIFdhcm4gYWdhaW5zdCBzZXR0aW5nIG5vbi1leGlzdGVudCByb290IHBhdGggb24gYSB2bS5cbiAqL1xuXG52YXIgd2Fybk5vbkV4aXN0ZW50O1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgd2Fybk5vbkV4aXN0ZW50ID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgICB3YXJuKCdZb3UgYXJlIHNldHRpbmcgYSBub24tZXhpc3RlbnQgcGF0aCBcIicgKyBwYXRoLnJhdyArICdcIiAnICsgJ29uIGEgdm0gaW5zdGFuY2UuIENvbnNpZGVyIHByZS1pbml0aWFsaXppbmcgdGhlIHByb3BlcnR5ICcgKyAnd2l0aCB0aGUgXCJkYXRhXCIgb3B0aW9uIGZvciBtb3JlIHJlbGlhYmxlIHJlYWN0aXZpdHkgJyArICdhbmQgYmV0dGVyIHBlcmZvcm1hbmNlLicpO1xuICB9O1xufVxuXG4vKipcbiAqIFNldCBvbiBhbiBvYmplY3QgZnJvbSBhIHBhdGhcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZyB8IEFycmF5fSBwYXRoXG4gKiBAcGFyYW0geyp9IHZhbFxuICovXG5cbmZ1bmN0aW9uIHNldFBhdGgob2JqLCBwYXRoLCB2YWwpIHtcbiAgdmFyIG9yaWdpbmFsID0gb2JqO1xuICBpZiAodHlwZW9mIHBhdGggPT09ICdzdHJpbmcnKSB7XG4gICAgcGF0aCA9IHBhcnNlKHBhdGgpO1xuICB9XG4gIGlmICghcGF0aCB8fCAhaXNPYmplY3Qob2JqKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgbGFzdCwga2V5O1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHBhdGgubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgbGFzdCA9IG9iajtcbiAgICBrZXkgPSBwYXRoW2ldO1xuICAgIGlmIChrZXkuY2hhckF0KDApID09PSAnKicpIHtcbiAgICAgIGtleSA9IHBhcnNlRXhwcmVzc2lvbihrZXkuc2xpY2UoMSkpLmdldC5jYWxsKG9yaWdpbmFsLCBvcmlnaW5hbCk7XG4gICAgfVxuICAgIGlmIChpIDwgbCAtIDEpIHtcbiAgICAgIG9iaiA9IG9ialtrZXldO1xuICAgICAgaWYgKCFpc09iamVjdChvYmopKSB7XG4gICAgICAgIG9iaiA9IHt9O1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBsYXN0Ll9pc1Z1ZSkge1xuICAgICAgICAgIHdhcm5Ob25FeGlzdGVudChwYXRoKTtcbiAgICAgICAgfVxuICAgICAgICBzZXQobGFzdCwga2V5LCBvYmopO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaXNBcnJheShvYmopKSB7XG4gICAgICAgIG9iai4kc2V0KGtleSwgdmFsKTtcbiAgICAgIH0gZWxzZSBpZiAoa2V5IGluIG9iaikge1xuICAgICAgICBvYmpba2V5XSA9IHZhbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIG9iai5faXNWdWUpIHtcbiAgICAgICAgICB3YXJuTm9uRXhpc3RlbnQocGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0KG9iaiwga2V5LCB2YWwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxudmFyIHBhdGggPSBPYmplY3QuZnJlZXplKHtcbiAgcGFyc2VQYXRoOiBwYXJzZVBhdGgsXG4gIGdldFBhdGg6IGdldFBhdGgsXG4gIHNldFBhdGg6IHNldFBhdGhcbn0pO1xuXG52YXIgZXhwcmVzc2lvbkNhY2hlID0gbmV3IENhY2hlKDEwMDApO1xuXG52YXIgYWxsb3dlZEtleXdvcmRzID0gJ01hdGgsRGF0ZSx0aGlzLHRydWUsZmFsc2UsbnVsbCx1bmRlZmluZWQsSW5maW5pdHksTmFOLCcgKyAnaXNOYU4saXNGaW5pdGUsZGVjb2RlVVJJLGRlY29kZVVSSUNvbXBvbmVudCxlbmNvZGVVUkksJyArICdlbmNvZGVVUklDb21wb25lbnQscGFyc2VJbnQscGFyc2VGbG9hdCc7XG52YXIgYWxsb3dlZEtleXdvcmRzUkUgPSBuZXcgUmVnRXhwKCdeKCcgKyBhbGxvd2VkS2V5d29yZHMucmVwbGFjZSgvLC9nLCAnXFxcXGJ8JykgKyAnXFxcXGIpJyk7XG5cbi8vIGtleXdvcmRzIHRoYXQgZG9uJ3QgbWFrZSBzZW5zZSBpbnNpZGUgZXhwcmVzc2lvbnNcbnZhciBpbXByb3BlcktleXdvcmRzID0gJ2JyZWFrLGNhc2UsY2xhc3MsY2F0Y2gsY29uc3QsY29udGludWUsZGVidWdnZXIsZGVmYXVsdCwnICsgJ2RlbGV0ZSxkbyxlbHNlLGV4cG9ydCxleHRlbmRzLGZpbmFsbHksZm9yLGZ1bmN0aW9uLGlmLCcgKyAnaW1wb3J0LGluLGluc3RhbmNlb2YsbGV0LHJldHVybixzdXBlcixzd2l0Y2gsdGhyb3csdHJ5LCcgKyAndmFyLHdoaWxlLHdpdGgseWllbGQsZW51bSxhd2FpdCxpbXBsZW1lbnRzLHBhY2thZ2UsJyArICdwcm9jdGVjdGVkLHN0YXRpYyxpbnRlcmZhY2UscHJpdmF0ZSxwdWJsaWMnO1xudmFyIGltcHJvcGVyS2V5d29yZHNSRSA9IG5ldyBSZWdFeHAoJ14oJyArIGltcHJvcGVyS2V5d29yZHMucmVwbGFjZSgvLC9nLCAnXFxcXGJ8JykgKyAnXFxcXGIpJyk7XG5cbnZhciB3c1JFID0gL1xccy9nO1xudmFyIG5ld2xpbmVSRSA9IC9cXG4vZztcbnZhciBzYXZlUkUgPSAvW1xceyxdXFxzKltcXHdcXCRfXStcXHMqOnwoJyg/OlteJ1xcXFxdfFxcXFwuKSonfFwiKD86W15cIlxcXFxdfFxcXFwuKSpcInxgKD86W15gXFxcXF18XFxcXC4pKlxcJFxce3xcXH0oPzpbXmBcXFxcXXxcXFxcLikqYHxgKD86W15gXFxcXF18XFxcXC4pKmApfG5ldyB8dHlwZW9mIHx2b2lkIC9nO1xudmFyIHJlc3RvcmVSRSA9IC9cIihcXGQrKVwiL2c7XG52YXIgcGF0aFRlc3RSRSA9IC9eW0EtWmEtel8kXVtcXHckXSooPzpcXC5bQS1aYS16XyRdW1xcdyRdKnxcXFsnLio/J1xcXXxcXFtcIi4qP1wiXFxdfFxcW1xcZCtcXF18XFxbW0EtWmEtel8kXVtcXHckXSpcXF0pKiQvO1xudmFyIGlkZW50UkUgPSAvW15cXHckXFwuXSg/OltBLVphLXpfJF1bXFx3JF0qKS9nO1xudmFyIGJvb2xlYW5MaXRlcmFsUkUgPSAvXig/OnRydWV8ZmFsc2UpJC87XG5cbi8qKlxuICogU2F2ZSAvIFJld3JpdGUgLyBSZXN0b3JlXG4gKlxuICogV2hlbiByZXdyaXRpbmcgcGF0aHMgZm91bmQgaW4gYW4gZXhwcmVzc2lvbiwgaXQgaXNcbiAqIHBvc3NpYmxlIGZvciB0aGUgc2FtZSBsZXR0ZXIgc2VxdWVuY2VzIHRvIGJlIGZvdW5kIGluXG4gKiBzdHJpbmdzIGFuZCBPYmplY3QgbGl0ZXJhbCBwcm9wZXJ0eSBrZXlzLiBUaGVyZWZvcmUgd2VcbiAqIHJlbW92ZSBhbmQgc3RvcmUgdGhlc2UgcGFydHMgaW4gYSB0ZW1wb3JhcnkgYXJyYXksIGFuZFxuICogcmVzdG9yZSB0aGVtIGFmdGVyIHRoZSBwYXRoIHJld3JpdGUuXG4gKi9cblxudmFyIHNhdmVkID0gW107XG5cbi8qKlxuICogU2F2ZSByZXBsYWNlclxuICpcbiAqIFRoZSBzYXZlIHJlZ2V4IGNhbiBtYXRjaCB0d28gcG9zc2libGUgY2FzZXM6XG4gKiAxLiBBbiBvcGVuaW5nIG9iamVjdCBsaXRlcmFsXG4gKiAyLiBBIHN0cmluZ1xuICogSWYgbWF0Y2hlZCBhcyBhIHBsYWluIHN0cmluZywgd2UgbmVlZCB0byBlc2NhcGUgaXRzXG4gKiBuZXdsaW5lcywgc2luY2UgdGhlIHN0cmluZyBuZWVkcyB0byBiZSBwcmVzZXJ2ZWQgd2hlblxuICogZ2VuZXJhdGluZyB0aGUgZnVuY3Rpb24gYm9keS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcGFyYW0ge1N0cmluZ30gaXNTdHJpbmcgLSBzdHIgaWYgbWF0Y2hlZCBhcyBhIHN0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfSAtIHBsYWNlaG9sZGVyIHdpdGggaW5kZXhcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKHN0ciwgaXNTdHJpbmcpIHtcbiAgdmFyIGkgPSBzYXZlZC5sZW5ndGg7XG4gIHNhdmVkW2ldID0gaXNTdHJpbmcgPyBzdHIucmVwbGFjZShuZXdsaW5lUkUsICdcXFxcbicpIDogc3RyO1xuICByZXR1cm4gJ1wiJyArIGkgKyAnXCInO1xufVxuXG4vKipcbiAqIFBhdGggcmV3cml0ZSByZXBsYWNlclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSByYXdcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiByZXdyaXRlKHJhdykge1xuICB2YXIgYyA9IHJhdy5jaGFyQXQoMCk7XG4gIHZhciBwYXRoID0gcmF3LnNsaWNlKDEpO1xuICBpZiAoYWxsb3dlZEtleXdvcmRzUkUudGVzdChwYXRoKSkge1xuICAgIHJldHVybiByYXc7XG4gIH0gZWxzZSB7XG4gICAgcGF0aCA9IHBhdGguaW5kZXhPZignXCInKSA+IC0xID8gcGF0aC5yZXBsYWNlKHJlc3RvcmVSRSwgcmVzdG9yZSkgOiBwYXRoO1xuICAgIHJldHVybiBjICsgJ3Njb3BlLicgKyBwYXRoO1xuICB9XG59XG5cbi8qKlxuICogUmVzdG9yZSByZXBsYWNlclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBpIC0gbWF0Y2hlZCBzYXZlIGluZGV4XG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gcmVzdG9yZShzdHIsIGkpIHtcbiAgcmV0dXJuIHNhdmVkW2ldO1xufVxuXG4vKipcbiAqIFJld3JpdGUgYW4gZXhwcmVzc2lvbiwgcHJlZml4aW5nIGFsbCBwYXRoIGFjY2Vzc29ycyB3aXRoXG4gKiBgc2NvcGUuYCBhbmQgZ2VuZXJhdGUgZ2V0dGVyL3NldHRlciBmdW5jdGlvbnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV4cFxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gY29tcGlsZUdldHRlcihleHApIHtcbiAgaWYgKGltcHJvcGVyS2V5d29yZHNSRS50ZXN0KGV4cCkpIHtcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ0F2b2lkIHVzaW5nIHJlc2VydmVkIGtleXdvcmRzIGluIGV4cHJlc3Npb246ICcgKyBleHApO1xuICB9XG4gIC8vIHJlc2V0IHN0YXRlXG4gIHNhdmVkLmxlbmd0aCA9IDA7XG4gIC8vIHNhdmUgc3RyaW5ncyBhbmQgb2JqZWN0IGxpdGVyYWwga2V5c1xuICB2YXIgYm9keSA9IGV4cC5yZXBsYWNlKHNhdmVSRSwgc2F2ZSkucmVwbGFjZSh3c1JFLCAnJyk7XG4gIC8vIHJld3JpdGUgYWxsIHBhdGhzXG4gIC8vIHBhZCAxIHNwYWNlIGhlcmUgYmVjYXVlIHRoZSByZWdleCBtYXRjaGVzIDEgZXh0cmEgY2hhclxuICBib2R5ID0gKCcgJyArIGJvZHkpLnJlcGxhY2UoaWRlbnRSRSwgcmV3cml0ZSkucmVwbGFjZShyZXN0b3JlUkUsIHJlc3RvcmUpO1xuICByZXR1cm4gbWFrZUdldHRlckZuKGJvZHkpO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgZ2V0dGVyIGZ1bmN0aW9uLiBSZXF1aXJlcyBldmFsLlxuICpcbiAqIFdlIGlzb2xhdGUgdGhlIHRyeS9jYXRjaCBzbyBpdCBkb2Vzbid0IGFmZmVjdCB0aGVcbiAqIG9wdGltaXphdGlvbiBvZiB0aGUgcGFyc2UgZnVuY3Rpb24gd2hlbiBpdCBpcyBub3QgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBib2R5XG4gKiBAcmV0dXJuIHtGdW5jdGlvbnx1bmRlZmluZWR9XG4gKi9cblxuZnVuY3Rpb24gbWFrZUdldHRlckZuKGJvZHkpIHtcbiAgdHJ5IHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1uZXctZnVuYyAqL1xuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oJ3Njb3BlJywgJ3JldHVybiAnICsgYm9keSArICc7Jyk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby1uZXctZnVuYyAqL1xuICB9IGNhdGNoIChlKSB7XG4gICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKCdJbnZhbGlkIGV4cHJlc3Npb24uICcgKyAnR2VuZXJhdGVkIGZ1bmN0aW9uIGJvZHk6ICcgKyBib2R5KTtcbiAgfVxufVxuXG4vKipcbiAqIENvbXBpbGUgYSBzZXR0ZXIgZnVuY3Rpb24gZm9yIHRoZSBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBleHBcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufHVuZGVmaW5lZH1cbiAqL1xuXG5mdW5jdGlvbiBjb21waWxlU2V0dGVyKGV4cCkge1xuICB2YXIgcGF0aCA9IHBhcnNlUGF0aChleHApO1xuICBpZiAocGF0aCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoc2NvcGUsIHZhbCkge1xuICAgICAgc2V0UGF0aChzY29wZSwgcGF0aCwgdmFsKTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybignSW52YWxpZCBzZXR0ZXIgZXhwcmVzc2lvbjogJyArIGV4cCk7XG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZSBhbiBleHByZXNzaW9uIGludG8gcmUtd3JpdHRlbiBnZXR0ZXIvc2V0dGVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXhwXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG5lZWRTZXRcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlRXhwcmVzc2lvbihleHAsIG5lZWRTZXQpIHtcbiAgZXhwID0gZXhwLnRyaW0oKTtcbiAgLy8gdHJ5IGNhY2hlXG4gIHZhciBoaXQgPSBleHByZXNzaW9uQ2FjaGUuZ2V0KGV4cCk7XG4gIGlmIChoaXQpIHtcbiAgICBpZiAobmVlZFNldCAmJiAhaGl0LnNldCkge1xuICAgICAgaGl0LnNldCA9IGNvbXBpbGVTZXR0ZXIoaGl0LmV4cCk7XG4gICAgfVxuICAgIHJldHVybiBoaXQ7XG4gIH1cbiAgdmFyIHJlcyA9IHsgZXhwOiBleHAgfTtcbiAgcmVzLmdldCA9IGlzU2ltcGxlUGF0aChleHApICYmIGV4cC5pbmRleE9mKCdbJykgPCAwXG4gIC8vIG9wdGltaXplZCBzdXBlciBzaW1wbGUgZ2V0dGVyXG4gID8gbWFrZUdldHRlckZuKCdzY29wZS4nICsgZXhwKVxuICAvLyBkeW5hbWljIGdldHRlclxuICA6IGNvbXBpbGVHZXR0ZXIoZXhwKTtcbiAgaWYgKG5lZWRTZXQpIHtcbiAgICByZXMuc2V0ID0gY29tcGlsZVNldHRlcihleHApO1xuICB9XG4gIGV4cHJlc3Npb25DYWNoZS5wdXQoZXhwLCByZXMpO1xuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGFuIGV4cHJlc3Npb24gaXMgYSBzaW1wbGUgcGF0aC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXhwXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmZ1bmN0aW9uIGlzU2ltcGxlUGF0aChleHApIHtcbiAgcmV0dXJuIHBhdGhUZXN0UkUudGVzdChleHApICYmXG4gIC8vIGRvbid0IHRyZWF0IHRydWUvZmFsc2UgYXMgcGF0aHNcbiAgIWJvb2xlYW5MaXRlcmFsUkUudGVzdChleHApICYmXG4gIC8vIE1hdGggY29uc3RhbnRzIGUuZy4gTWF0aC5QSSwgTWF0aC5FIGV0Yy5cbiAgZXhwLnNsaWNlKDAsIDUpICE9PSAnTWF0aC4nO1xufVxuXG52YXIgZXhwcmVzc2lvbiA9IE9iamVjdC5mcmVlemUoe1xuICBwYXJzZUV4cHJlc3Npb246IHBhcnNlRXhwcmVzc2lvbixcbiAgaXNTaW1wbGVQYXRoOiBpc1NpbXBsZVBhdGhcbn0pO1xuXG4vLyB3ZSBoYXZlIHR3byBzZXBhcmF0ZSBxdWV1ZXM6IG9uZSBmb3IgZGlyZWN0aXZlIHVwZGF0ZXNcbi8vIGFuZCBvbmUgZm9yIHVzZXIgd2F0Y2hlciByZWdpc3RlcmVkIHZpYSAkd2F0Y2goKS5cbi8vIHdlIHdhbnQgdG8gZ3VhcmFudGVlIGRpcmVjdGl2ZSB1cGRhdGVzIHRvIGJlIGNhbGxlZFxuLy8gYmVmb3JlIHVzZXIgd2F0Y2hlcnMgc28gdGhhdCB3aGVuIHVzZXIgd2F0Y2hlcnMgYXJlXG4vLyB0cmlnZ2VyZWQsIHRoZSBET00gd291bGQgaGF2ZSBhbHJlYWR5IGJlZW4gaW4gdXBkYXRlZFxuLy8gc3RhdGUuXG52YXIgcXVldWUgPSBbXTtcbnZhciB1c2VyUXVldWUgPSBbXTtcbnZhciBoYXMgPSB7fTtcbnZhciBjaXJjdWxhciA9IHt9O1xudmFyIHdhaXRpbmcgPSBmYWxzZTtcbnZhciBpbnRlcm5hbFF1ZXVlRGVwbGV0ZWQgPSBmYWxzZTtcblxuLyoqXG4gKiBSZXNldCB0aGUgYmF0Y2hlcidzIHN0YXRlLlxuICovXG5cbmZ1bmN0aW9uIHJlc2V0QmF0Y2hlclN0YXRlKCkge1xuICBxdWV1ZSA9IFtdO1xuICB1c2VyUXVldWUgPSBbXTtcbiAgaGFzID0ge307XG4gIGNpcmN1bGFyID0ge307XG4gIHdhaXRpbmcgPSBpbnRlcm5hbFF1ZXVlRGVwbGV0ZWQgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBGbHVzaCBib3RoIHF1ZXVlcyBhbmQgcnVuIHRoZSB3YXRjaGVycy5cbiAqL1xuXG5mdW5jdGlvbiBmbHVzaEJhdGNoZXJRdWV1ZSgpIHtcbiAgcnVuQmF0Y2hlclF1ZXVlKHF1ZXVlKTtcbiAgaW50ZXJuYWxRdWV1ZURlcGxldGVkID0gdHJ1ZTtcbiAgcnVuQmF0Y2hlclF1ZXVlKHVzZXJRdWV1ZSk7XG4gIC8vIGRldiB0b29sIGhvb2tcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmIChkZXZ0b29scykge1xuICAgIGRldnRvb2xzLmVtaXQoJ2ZsdXNoJyk7XG4gIH1cbiAgcmVzZXRCYXRjaGVyU3RhdGUoKTtcbn1cblxuLyoqXG4gKiBSdW4gdGhlIHdhdGNoZXJzIGluIGEgc2luZ2xlIHF1ZXVlLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHF1ZXVlXG4gKi9cblxuZnVuY3Rpb24gcnVuQmF0Y2hlclF1ZXVlKHF1ZXVlKSB7XG4gIC8vIGRvIG5vdCBjYWNoZSBsZW5ndGggYmVjYXVzZSBtb3JlIHdhdGNoZXJzIG1pZ2h0IGJlIHB1c2hlZFxuICAvLyBhcyB3ZSBydW4gZXhpc3Rpbmcgd2F0Y2hlcnNcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgIHZhciB3YXRjaGVyID0gcXVldWVbaV07XG4gICAgdmFyIGlkID0gd2F0Y2hlci5pZDtcbiAgICBoYXNbaWRdID0gbnVsbDtcbiAgICB3YXRjaGVyLnJ1bigpO1xuICAgIC8vIGluIGRldiBidWlsZCwgY2hlY2sgYW5kIHN0b3AgY2lyY3VsYXIgdXBkYXRlcy5cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBoYXNbaWRdICE9IG51bGwpIHtcbiAgICAgIGNpcmN1bGFyW2lkXSA9IChjaXJjdWxhcltpZF0gfHwgMCkgKyAxO1xuICAgICAgaWYgKGNpcmN1bGFyW2lkXSA+IGNvbmZpZy5fbWF4VXBkYXRlQ291bnQpIHtcbiAgICAgICAgcXVldWUuc3BsaWNlKGhhc1tpZF0sIDEpO1xuICAgICAgICB3YXJuKCdZb3UgbWF5IGhhdmUgYW4gaW5maW5pdGUgdXBkYXRlIGxvb3AgZm9yIHdhdGNoZXIgJyArICd3aXRoIGV4cHJlc3Npb246ICcgKyB3YXRjaGVyLmV4cHJlc3Npb24pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFB1c2ggYSB3YXRjaGVyIGludG8gdGhlIHdhdGNoZXIgcXVldWUuXG4gKiBKb2JzIHdpdGggZHVwbGljYXRlIElEcyB3aWxsIGJlIHNraXBwZWQgdW5sZXNzIGl0J3NcbiAqIHB1c2hlZCB3aGVuIHRoZSBxdWV1ZSBpcyBiZWluZyBmbHVzaGVkLlxuICpcbiAqIEBwYXJhbSB7V2F0Y2hlcn0gd2F0Y2hlclxuICogICBwcm9wZXJ0aWVzOlxuICogICAtIHtOdW1iZXJ9IGlkXG4gKiAgIC0ge0Z1bmN0aW9ufSBydW5cbiAqL1xuXG5mdW5jdGlvbiBwdXNoV2F0Y2hlcih3YXRjaGVyKSB7XG4gIHZhciBpZCA9IHdhdGNoZXIuaWQ7XG4gIGlmIChoYXNbaWRdID09IG51bGwpIHtcbiAgICAvLyBpZiBhbiBpbnRlcm5hbCB3YXRjaGVyIGlzIHB1c2hlZCwgYnV0IHRoZSBpbnRlcm5hbFxuICAgIC8vIHF1ZXVlIGlzIGFscmVhZHkgZGVwbGV0ZWQsIHdlIHJ1biBpdCBpbW1lZGlhdGVseS5cbiAgICBpZiAoaW50ZXJuYWxRdWV1ZURlcGxldGVkICYmICF3YXRjaGVyLnVzZXIpIHtcbiAgICAgIHdhdGNoZXIucnVuKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHB1c2ggd2F0Y2hlciBpbnRvIGFwcHJvcHJpYXRlIHF1ZXVlXG4gICAgdmFyIHEgPSB3YXRjaGVyLnVzZXIgPyB1c2VyUXVldWUgOiBxdWV1ZTtcbiAgICBoYXNbaWRdID0gcS5sZW5ndGg7XG4gICAgcS5wdXNoKHdhdGNoZXIpO1xuICAgIC8vIHF1ZXVlIHRoZSBmbHVzaFxuICAgIGlmICghd2FpdGluZykge1xuICAgICAgd2FpdGluZyA9IHRydWU7XG4gICAgICBuZXh0VGljayhmbHVzaEJhdGNoZXJRdWV1ZSk7XG4gICAgfVxuICB9XG59XG5cbnZhciB1aWQkMiA9IDA7XG5cbi8qKlxuICogQSB3YXRjaGVyIHBhcnNlcyBhbiBleHByZXNzaW9uLCBjb2xsZWN0cyBkZXBlbmRlbmNpZXMsXG4gKiBhbmQgZmlyZXMgY2FsbGJhY2sgd2hlbiB0aGUgZXhwcmVzc2lvbiB2YWx1ZSBjaGFuZ2VzLlxuICogVGhpcyBpcyB1c2VkIGZvciBib3RoIHRoZSAkd2F0Y2goKSBhcGkgYW5kIGRpcmVjdGl2ZXMuXG4gKlxuICogQHBhcmFtIHtWdWV9IHZtXG4gKiBAcGFyYW0ge1N0cmluZ30gZXhwcmVzc2lvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2JcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiAgICAgICAgICAgICAgICAgLSB7QXJyYXl9IGZpbHRlcnNcbiAqICAgICAgICAgICAgICAgICAtIHtCb29sZWFufSB0d29XYXlcbiAqICAgICAgICAgICAgICAgICAtIHtCb29sZWFufSBkZWVwXG4gKiAgICAgICAgICAgICAgICAgLSB7Qm9vbGVhbn0gdXNlclxuICogICAgICAgICAgICAgICAgIC0ge0Jvb2xlYW59IHN5bmNcbiAqICAgICAgICAgICAgICAgICAtIHtCb29sZWFufSBsYXp5XG4gKiAgICAgICAgICAgICAgICAgLSB7RnVuY3Rpb259IFtwcmVQcm9jZXNzXVxuICogICAgICAgICAgICAgICAgIC0ge0Z1bmN0aW9ufSBbcG9zdFByb2Nlc3NdXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gV2F0Y2hlcih2bSwgZXhwT3JGbiwgY2IsIG9wdGlvbnMpIHtcbiAgLy8gbWl4IGluIG9wdGlvbnNcbiAgaWYgKG9wdGlvbnMpIHtcbiAgICBleHRlbmQodGhpcywgb3B0aW9ucyk7XG4gIH1cbiAgdmFyIGlzRm4gPSB0eXBlb2YgZXhwT3JGbiA9PT0gJ2Z1bmN0aW9uJztcbiAgdGhpcy52bSA9IHZtO1xuICB2bS5fd2F0Y2hlcnMucHVzaCh0aGlzKTtcbiAgdGhpcy5leHByZXNzaW9uID0gaXNGbiA/IGV4cE9yRm4udG9TdHJpbmcoKSA6IGV4cE9yRm47XG4gIHRoaXMuY2IgPSBjYjtcbiAgdGhpcy5pZCA9ICsrdWlkJDI7IC8vIHVpZCBmb3IgYmF0Y2hpbmdcbiAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICB0aGlzLmRpcnR5ID0gdGhpcy5sYXp5OyAvLyBmb3IgbGF6eSB3YXRjaGVyc1xuICB0aGlzLmRlcHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB0aGlzLm5ld0RlcHMgPSBudWxsO1xuICB0aGlzLnByZXZFcnJvciA9IG51bGw7IC8vIGZvciBhc3luYyBlcnJvciBzdGFja3NcbiAgLy8gcGFyc2UgZXhwcmVzc2lvbiBmb3IgZ2V0dGVyL3NldHRlclxuICBpZiAoaXNGbikge1xuICAgIHRoaXMuZ2V0dGVyID0gZXhwT3JGbjtcbiAgICB0aGlzLnNldHRlciA9IHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICB2YXIgcmVzID0gcGFyc2VFeHByZXNzaW9uKGV4cE9yRm4sIHRoaXMudHdvV2F5KTtcbiAgICB0aGlzLmdldHRlciA9IHJlcy5nZXQ7XG4gICAgdGhpcy5zZXR0ZXIgPSByZXMuc2V0O1xuICB9XG4gIHRoaXMudmFsdWUgPSB0aGlzLmxhenkgPyB1bmRlZmluZWQgOiB0aGlzLmdldCgpO1xuICAvLyBzdGF0ZSBmb3IgYXZvaWRpbmcgZmFsc2UgdHJpZ2dlcnMgZm9yIGRlZXAgYW5kIEFycmF5XG4gIC8vIHdhdGNoZXJzIGR1cmluZyB2bS5fZGlnZXN0KClcbiAgdGhpcy5xdWV1ZWQgPSB0aGlzLnNoYWxsb3cgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBBZGQgYSBkZXBlbmRlbmN5IHRvIHRoaXMgZGlyZWN0aXZlLlxuICpcbiAqIEBwYXJhbSB7RGVwfSBkZXBcbiAqL1xuXG5XYXRjaGVyLnByb3RvdHlwZS5hZGREZXAgPSBmdW5jdGlvbiAoZGVwKSB7XG4gIHZhciBpZCA9IGRlcC5pZDtcbiAgaWYgKCF0aGlzLm5ld0RlcHNbaWRdKSB7XG4gICAgdGhpcy5uZXdEZXBzW2lkXSA9IGRlcDtcbiAgICBpZiAoIXRoaXMuZGVwc1tpZF0pIHtcbiAgICAgIHRoaXMuZGVwc1tpZF0gPSBkZXA7XG4gICAgICBkZXAuYWRkU3ViKHRoaXMpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBFdmFsdWF0ZSB0aGUgZ2V0dGVyLCBhbmQgcmUtY29sbGVjdCBkZXBlbmRlbmNpZXMuXG4gKi9cblxuV2F0Y2hlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmJlZm9yZUdldCgpO1xuICB2YXIgc2NvcGUgPSB0aGlzLnNjb3BlIHx8IHRoaXMudm07XG4gIHZhciB2YWx1ZTtcbiAgdHJ5IHtcbiAgICB2YWx1ZSA9IHRoaXMuZ2V0dGVyLmNhbGwoc2NvcGUsIHNjb3BlKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGNvbmZpZy53YXJuRXhwcmVzc2lvbkVycm9ycykge1xuICAgICAgd2FybignRXJyb3Igd2hlbiBldmFsdWF0aW5nIGV4cHJlc3Npb24gXCInICsgdGhpcy5leHByZXNzaW9uICsgJ1wiLiAnICsgKGNvbmZpZy5kZWJ1ZyA/ICcnIDogJ1R1cm4gb24gZGVidWcgbW9kZSB0byBzZWUgc3RhY2sgdHJhY2UuJyksIGUpO1xuICAgIH1cbiAgfVxuICAvLyBcInRvdWNoXCIgZXZlcnkgcHJvcGVydHkgc28gdGhleSBhcmUgYWxsIHRyYWNrZWQgYXNcbiAgLy8gZGVwZW5kZW5jaWVzIGZvciBkZWVwIHdhdGNoaW5nXG4gIGlmICh0aGlzLmRlZXApIHtcbiAgICB0cmF2ZXJzZSh2YWx1ZSk7XG4gIH1cbiAgaWYgKHRoaXMucHJlUHJvY2Vzcykge1xuICAgIHZhbHVlID0gdGhpcy5wcmVQcm9jZXNzKHZhbHVlKTtcbiAgfVxuICBpZiAodGhpcy5maWx0ZXJzKSB7XG4gICAgdmFsdWUgPSBzY29wZS5fYXBwbHlGaWx0ZXJzKHZhbHVlLCBudWxsLCB0aGlzLmZpbHRlcnMsIGZhbHNlKTtcbiAgfVxuICBpZiAodGhpcy5wb3N0UHJvY2Vzcykge1xuICAgIHZhbHVlID0gdGhpcy5wb3N0UHJvY2Vzcyh2YWx1ZSk7XG4gIH1cbiAgdGhpcy5hZnRlckdldCgpO1xuICByZXR1cm4gdmFsdWU7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZSB3aXRoIHRoZSBzZXR0ZXIuXG4gKlxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICovXG5cbldhdGNoZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgc2NvcGUgPSB0aGlzLnNjb3BlIHx8IHRoaXMudm07XG4gIGlmICh0aGlzLmZpbHRlcnMpIHtcbiAgICB2YWx1ZSA9IHNjb3BlLl9hcHBseUZpbHRlcnModmFsdWUsIHRoaXMudmFsdWUsIHRoaXMuZmlsdGVycywgdHJ1ZSk7XG4gIH1cbiAgdHJ5IHtcbiAgICB0aGlzLnNldHRlci5jYWxsKHNjb3BlLCBzY29wZSwgdmFsdWUpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgY29uZmlnLndhcm5FeHByZXNzaW9uRXJyb3JzKSB7XG4gICAgICB3YXJuKCdFcnJvciB3aGVuIGV2YWx1YXRpbmcgc2V0dGVyIFwiJyArIHRoaXMuZXhwcmVzc2lvbiArICdcIicsIGUpO1xuICAgIH1cbiAgfVxuICAvLyB0d28td2F5IHN5bmMgZm9yIHYtZm9yIGFsaWFzXG4gIHZhciBmb3JDb250ZXh0ID0gc2NvcGUuJGZvckNvbnRleHQ7XG4gIGlmIChmb3JDb250ZXh0ICYmIGZvckNvbnRleHQuYWxpYXMgPT09IHRoaXMuZXhwcmVzc2lvbikge1xuICAgIGlmIChmb3JDb250ZXh0LmZpbHRlcnMpIHtcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybignSXQgc2VlbXMgeW91IGFyZSB1c2luZyB0d28td2F5IGJpbmRpbmcgb24gJyArICdhIHYtZm9yIGFsaWFzICgnICsgdGhpcy5leHByZXNzaW9uICsgJyksIGFuZCB0aGUgJyArICd2LWZvciBoYXMgZmlsdGVycy4gVGhpcyB3aWxsIG5vdCB3b3JrIHByb3Blcmx5LiAnICsgJ0VpdGhlciByZW1vdmUgdGhlIGZpbHRlcnMgb3IgdXNlIGFuIGFycmF5IG9mICcgKyAnb2JqZWN0cyBhbmQgYmluZCB0byBvYmplY3QgcHJvcGVydGllcyBpbnN0ZWFkLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3JDb250ZXh0Ll93aXRoTG9jayhmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoc2NvcGUuJGtleSkge1xuICAgICAgICAvLyBvcmlnaW5hbCBpcyBhbiBvYmplY3RcbiAgICAgICAgZm9yQ29udGV4dC5yYXdWYWx1ZVtzY29wZS4ka2V5XSA9IHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yQ29udGV4dC5yYXdWYWx1ZS4kc2V0KHNjb3BlLiRpbmRleCwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIFByZXBhcmUgZm9yIGRlcGVuZGVuY3kgY29sbGVjdGlvbi5cbiAqL1xuXG5XYXRjaGVyLnByb3RvdHlwZS5iZWZvcmVHZXQgPSBmdW5jdGlvbiAoKSB7XG4gIERlcC50YXJnZXQgPSB0aGlzO1xuICB0aGlzLm5ld0RlcHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xufTtcblxuLyoqXG4gKiBDbGVhbiB1cCBmb3IgZGVwZW5kZW5jeSBjb2xsZWN0aW9uLlxuICovXG5cbldhdGNoZXIucHJvdG90eXBlLmFmdGVyR2V0ID0gZnVuY3Rpb24gKCkge1xuICBEZXAudGFyZ2V0ID0gbnVsbDtcbiAgdmFyIGlkcyA9IE9iamVjdC5rZXlzKHRoaXMuZGVwcyk7XG4gIHZhciBpID0gaWRzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIHZhciBpZCA9IGlkc1tpXTtcbiAgICBpZiAoIXRoaXMubmV3RGVwc1tpZF0pIHtcbiAgICAgIHRoaXMuZGVwc1tpZF0ucmVtb3ZlU3ViKHRoaXMpO1xuICAgIH1cbiAgfVxuICB0aGlzLmRlcHMgPSB0aGlzLm5ld0RlcHM7XG59O1xuXG4vKipcbiAqIFN1YnNjcmliZXIgaW50ZXJmYWNlLlxuICogV2lsbCBiZSBjYWxsZWQgd2hlbiBhIGRlcGVuZGVuY3kgY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHNoYWxsb3dcbiAqL1xuXG5XYXRjaGVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoc2hhbGxvdykge1xuICBpZiAodGhpcy5sYXp5KSB7XG4gICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gIH0gZWxzZSBpZiAodGhpcy5zeW5jIHx8ICFjb25maWcuYXN5bmMpIHtcbiAgICB0aGlzLnJ1bigpO1xuICB9IGVsc2Uge1xuICAgIC8vIGlmIHF1ZXVlZCwgb25seSBvdmVyd3JpdGUgc2hhbGxvdyB3aXRoIG5vbi1zaGFsbG93LFxuICAgIC8vIGJ1dCBub3QgdGhlIG90aGVyIHdheSBhcm91bmQuXG4gICAgdGhpcy5zaGFsbG93ID0gdGhpcy5xdWV1ZWQgPyBzaGFsbG93ID8gdGhpcy5zaGFsbG93IDogZmFsc2UgOiAhIXNoYWxsb3c7XG4gICAgdGhpcy5xdWV1ZWQgPSB0cnVlO1xuICAgIC8vIHJlY29yZCBiZWZvcmUtcHVzaCBlcnJvciBzdGFjayBpbiBkZWJ1ZyBtb2RlXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgY29uZmlnLmRlYnVnKSB7XG4gICAgICB0aGlzLnByZXZFcnJvciA9IG5ldyBFcnJvcignW3Z1ZV0gYXN5bmMgc3RhY2sgdHJhY2UnKTtcbiAgICB9XG4gICAgcHVzaFdhdGNoZXIodGhpcyk7XG4gIH1cbn07XG5cbi8qKlxuICogQmF0Y2hlciBqb2IgaW50ZXJmYWNlLlxuICogV2lsbCBiZSBjYWxsZWQgYnkgdGhlIGJhdGNoZXIuXG4gKi9cblxuV2F0Y2hlci5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLmdldCgpO1xuICAgIGlmICh2YWx1ZSAhPT0gdGhpcy52YWx1ZSB8fFxuICAgIC8vIERlZXAgd2F0Y2hlcnMgYW5kIHdhdGNoZXJzIG9uIE9iamVjdC9BcnJheXMgc2hvdWxkIGZpcmUgZXZlblxuICAgIC8vIHdoZW4gdGhlIHZhbHVlIGlzIHRoZSBzYW1lLCBiZWNhdXNlIHRoZSB2YWx1ZSBtYXlcbiAgICAvLyBoYXZlIG11dGF0ZWQ7IGJ1dCBvbmx5IGRvIHNvIGlmIHRoaXMgaXMgYVxuICAgIC8vIG5vbi1zaGFsbG93IHVwZGF0ZSAoY2F1c2VkIGJ5IGEgdm0gZGlnZXN0KS5cbiAgICAoaXNPYmplY3QodmFsdWUpIHx8IHRoaXMuZGVlcCkgJiYgIXRoaXMuc2hhbGxvdykge1xuICAgICAgLy8gc2V0IG5ldyB2YWx1ZVxuICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgIC8vIGluIGRlYnVnICsgYXN5bmMgbW9kZSwgd2hlbiBhIHdhdGNoZXIgY2FsbGJhY2tzXG4gICAgICAvLyB0aHJvd3MsIHdlIGFsc28gdGhyb3cgdGhlIHNhdmVkIGJlZm9yZS1wdXNoIGVycm9yXG4gICAgICAvLyBzbyB0aGUgZnVsbCBjcm9zcy10aWNrIHN0YWNrIHRyYWNlIGlzIGF2YWlsYWJsZS5cbiAgICAgIHZhciBwcmV2RXJyb3IgPSB0aGlzLnByZXZFcnJvcjtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgY29uZmlnLmRlYnVnICYmIHByZXZFcnJvcikge1xuICAgICAgICB0aGlzLnByZXZFcnJvciA9IG51bGw7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdGhpcy5jYi5jYWxsKHRoaXMudm0sIHZhbHVlLCBvbGRWYWx1ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyBwcmV2RXJyb3I7XG4gICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jYi5jYWxsKHRoaXMudm0sIHZhbHVlLCBvbGRWYWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucXVldWVkID0gdGhpcy5zaGFsbG93ID0gZmFsc2U7XG4gIH1cbn07XG5cbi8qKlxuICogRXZhbHVhdGUgdGhlIHZhbHVlIG9mIHRoZSB3YXRjaGVyLlxuICogVGhpcyBvbmx5IGdldHMgY2FsbGVkIGZvciBsYXp5IHdhdGNoZXJzLlxuICovXG5cbldhdGNoZXIucHJvdG90eXBlLmV2YWx1YXRlID0gZnVuY3Rpb24gKCkge1xuICAvLyBhdm9pZCBvdmVyd3JpdGluZyBhbm90aGVyIHdhdGNoZXIgdGhhdCBpcyBiZWluZ1xuICAvLyBjb2xsZWN0ZWQuXG4gIHZhciBjdXJyZW50ID0gRGVwLnRhcmdldDtcbiAgdGhpcy52YWx1ZSA9IHRoaXMuZ2V0KCk7XG4gIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgRGVwLnRhcmdldCA9IGN1cnJlbnQ7XG59O1xuXG4vKipcbiAqIERlcGVuZCBvbiBhbGwgZGVwcyBjb2xsZWN0ZWQgYnkgdGhpcyB3YXRjaGVyLlxuICovXG5cbldhdGNoZXIucHJvdG90eXBlLmRlcGVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGRlcElkcyA9IE9iamVjdC5rZXlzKHRoaXMuZGVwcyk7XG4gIHZhciBpID0gZGVwSWRzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIHRoaXMuZGVwc1tkZXBJZHNbaV1dLmRlcGVuZCgpO1xuICB9XG59O1xuXG4vKipcbiAqIFJlbW92ZSBzZWxmIGZyb20gYWxsIGRlcGVuZGVuY2llcycgc3ViY3JpYmVyIGxpc3QuXG4gKi9cblxuV2F0Y2hlci5wcm90b3R5cGUudGVhcmRvd24gPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmFjdGl2ZSkge1xuICAgIC8vIHJlbW92ZSBzZWxmIGZyb20gdm0ncyB3YXRjaGVyIGxpc3RcbiAgICAvLyB0aGlzIGlzIGEgc29tZXdoYXQgZXhwZW5zaXZlIG9wZXJhdGlvbiBzbyB3ZSBza2lwIGl0XG4gICAgLy8gaWYgdGhlIHZtIGlzIGJlaW5nIGRlc3Ryb3llZCBvciBpcyBwZXJmb3JtaW5nIGEgdi1mb3JcbiAgICAvLyByZS1yZW5kZXIgKHRoZSB3YXRjaGVyIGxpc3QgaXMgdGhlbiBmaWx0ZXJlZCBieSB2LWZvcikuXG4gICAgaWYgKCF0aGlzLnZtLl9pc0JlaW5nRGVzdHJveWVkICYmICF0aGlzLnZtLl92Rm9yUmVtb3ZpbmcpIHtcbiAgICAgIHRoaXMudm0uX3dhdGNoZXJzLiRyZW1vdmUodGhpcyk7XG4gICAgfVxuICAgIHZhciBkZXBJZHMgPSBPYmplY3Qua2V5cyh0aGlzLmRlcHMpO1xuICAgIHZhciBpID0gZGVwSWRzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICB0aGlzLmRlcHNbZGVwSWRzW2ldXS5yZW1vdmVTdWIodGhpcyk7XG4gICAgfVxuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgdGhpcy52bSA9IHRoaXMuY2IgPSB0aGlzLnZhbHVlID0gbnVsbDtcbiAgfVxufTtcblxuLyoqXG4gKiBSZWNydXNpdmVseSB0cmF2ZXJzZSBhbiBvYmplY3QgdG8gZXZva2UgYWxsIGNvbnZlcnRlZFxuICogZ2V0dGVycywgc28gdGhhdCBldmVyeSBuZXN0ZWQgcHJvcGVydHkgaW5zaWRlIHRoZSBvYmplY3RcbiAqIGlzIGNvbGxlY3RlZCBhcyBhIFwiZGVlcFwiIGRlcGVuZGVuY3kuXG4gKlxuICogQHBhcmFtIHsqfSB2YWxcbiAqL1xuXG5mdW5jdGlvbiB0cmF2ZXJzZSh2YWwpIHtcbiAgdmFyIGksIGtleXM7XG4gIGlmIChpc0FycmF5KHZhbCkpIHtcbiAgICBpID0gdmFsLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB0cmF2ZXJzZSh2YWxbaV0pO1xuICB9IGVsc2UgaWYgKGlzT2JqZWN0KHZhbCkpIHtcbiAgICBrZXlzID0gT2JqZWN0LmtleXModmFsKTtcbiAgICBpID0ga2V5cy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkgdHJhdmVyc2UodmFsW2tleXNbaV1dKTtcbiAgfVxufVxuXG52YXIgdGV4dCQxID0ge1xuXG4gIGJpbmQ6IGZ1bmN0aW9uIGJpbmQoKSB7XG4gICAgdGhpcy5hdHRyID0gdGhpcy5lbC5ub2RlVHlwZSA9PT0gMyA/ICdkYXRhJyA6ICd0ZXh0Q29udGVudCc7XG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUodmFsdWUpIHtcbiAgICB0aGlzLmVsW3RoaXMuYXR0cl0gPSBfdG9TdHJpbmcodmFsdWUpO1xuICB9XG59O1xuXG52YXIgdGVtcGxhdGVDYWNoZSA9IG5ldyBDYWNoZSgxMDAwKTtcbnZhciBpZFNlbGVjdG9yQ2FjaGUgPSBuZXcgQ2FjaGUoMTAwMCk7XG5cbnZhciBtYXAgPSB7XG4gIGVmYXVsdDogWzAsICcnLCAnJ10sXG4gIGxlZ2VuZDogWzEsICc8ZmllbGRzZXQ+JywgJzwvZmllbGRzZXQ+J10sXG4gIHRyOiBbMiwgJzx0YWJsZT48dGJvZHk+JywgJzwvdGJvZHk+PC90YWJsZT4nXSxcbiAgY29sOiBbMiwgJzx0YWJsZT48dGJvZHk+PC90Ym9keT48Y29sZ3JvdXA+JywgJzwvY29sZ3JvdXA+PC90YWJsZT4nXVxufTtcblxubWFwLnRkID0gbWFwLnRoID0gWzMsICc8dGFibGU+PHRib2R5Pjx0cj4nLCAnPC90cj48L3Rib2R5PjwvdGFibGU+J107XG5cbm1hcC5vcHRpb24gPSBtYXAub3B0Z3JvdXAgPSBbMSwgJzxzZWxlY3QgbXVsdGlwbGU9XCJtdWx0aXBsZVwiPicsICc8L3NlbGVjdD4nXTtcblxubWFwLnRoZWFkID0gbWFwLnRib2R5ID0gbWFwLmNvbGdyb3VwID0gbWFwLmNhcHRpb24gPSBtYXAudGZvb3QgPSBbMSwgJzx0YWJsZT4nLCAnPC90YWJsZT4nXTtcblxubWFwLmcgPSBtYXAuZGVmcyA9IG1hcC5zeW1ib2wgPSBtYXAudXNlID0gbWFwLmltYWdlID0gbWFwLnRleHQgPSBtYXAuY2lyY2xlID0gbWFwLmVsbGlwc2UgPSBtYXAubGluZSA9IG1hcC5wYXRoID0gbWFwLnBvbHlnb24gPSBtYXAucG9seWxpbmUgPSBtYXAucmVjdCA9IFsxLCAnPHN2ZyAnICsgJ3htbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiAnICsgJ3htbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiICcgKyAneG1sbnM6ZXY9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAxL3htbC1ldmVudHNcIicgKyAndmVyc2lvbj1cIjEuMVwiPicsICc8L3N2Zz4nXTtcblxuLyoqXG4gKiBDaGVjayBpZiBhIG5vZGUgaXMgYSBzdXBwb3J0ZWQgdGVtcGxhdGUgbm9kZSB3aXRoIGFcbiAqIERvY3VtZW50RnJhZ21lbnQgY29udGVudC5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gaXNSZWFsVGVtcGxhdGUobm9kZSkge1xuICByZXR1cm4gaXNUZW1wbGF0ZShub2RlKSAmJiBpc0ZyYWdtZW50KG5vZGUuY29udGVudCk7XG59XG5cbnZhciB0YWdSRSQxID0gLzwoW1xcdzpdKykvO1xudmFyIGVudGl0eVJFID0gLyYjP1xcdys/Oy87XG5cbi8qKlxuICogQ29udmVydCBhIHN0cmluZyB0ZW1wbGF0ZSB0byBhIERvY3VtZW50RnJhZ21lbnQuXG4gKiBEZXRlcm1pbmVzIGNvcnJlY3Qgd3JhcHBpbmcgYnkgdGFnIHR5cGVzLiBXcmFwcGluZ1xuICogc3RyYXRlZ3kgZm91bmQgaW4galF1ZXJ5ICYgY29tcG9uZW50L2RvbWlmeS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdGVtcGxhdGVTdHJpbmdcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcmF3XG4gKiBAcmV0dXJuIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5cbmZ1bmN0aW9uIHN0cmluZ1RvRnJhZ21lbnQodGVtcGxhdGVTdHJpbmcsIHJhdykge1xuICAvLyB0cnkgYSBjYWNoZSBoaXQgZmlyc3RcbiAgdmFyIGNhY2hlS2V5ID0gcmF3ID8gdGVtcGxhdGVTdHJpbmcgOiB0ZW1wbGF0ZVN0cmluZy50cmltKCk7XG4gIHZhciBoaXQgPSB0ZW1wbGF0ZUNhY2hlLmdldChjYWNoZUtleSk7XG4gIGlmIChoaXQpIHtcbiAgICByZXR1cm4gaGl0O1xuICB9XG5cbiAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gIHZhciB0YWdNYXRjaCA9IHRlbXBsYXRlU3RyaW5nLm1hdGNoKHRhZ1JFJDEpO1xuICB2YXIgZW50aXR5TWF0Y2ggPSBlbnRpdHlSRS50ZXN0KHRlbXBsYXRlU3RyaW5nKTtcblxuICBpZiAoIXRhZ01hdGNoICYmICFlbnRpdHlNYXRjaCkge1xuICAgIC8vIHRleHQgb25seSwgcmV0dXJuIGEgc2luZ2xlIHRleHQgbm9kZS5cbiAgICBmcmFnLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRlbXBsYXRlU3RyaW5nKSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHRhZyA9IHRhZ01hdGNoICYmIHRhZ01hdGNoWzFdO1xuICAgIHZhciB3cmFwID0gbWFwW3RhZ10gfHwgbWFwLmVmYXVsdDtcbiAgICB2YXIgZGVwdGggPSB3cmFwWzBdO1xuICAgIHZhciBwcmVmaXggPSB3cmFwWzFdO1xuICAgIHZhciBzdWZmaXggPSB3cmFwWzJdO1xuICAgIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICBub2RlLmlubmVySFRNTCA9IHByZWZpeCArIHRlbXBsYXRlU3RyaW5nICsgc3VmZml4O1xuICAgIHdoaWxlIChkZXB0aC0tKSB7XG4gICAgICBub2RlID0gbm9kZS5sYXN0Q2hpbGQ7XG4gICAgfVxuXG4gICAgdmFyIGNoaWxkO1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbmQtYXNzaWduICovXG4gICAgd2hpbGUgKGNoaWxkID0gbm9kZS5maXJzdENoaWxkKSB7XG4gICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbmQtYXNzaWduICovXG4gICAgICBmcmFnLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFyYXcpIHtcbiAgICB0cmltTm9kZShmcmFnKTtcbiAgfVxuICB0ZW1wbGF0ZUNhY2hlLnB1dChjYWNoZUtleSwgZnJhZyk7XG4gIHJldHVybiBmcmFnO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSB0ZW1wbGF0ZSBub2RlIHRvIGEgRG9jdW1lbnRGcmFnbWVudC5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEByZXR1cm4ge0RvY3VtZW50RnJhZ21lbnR9XG4gKi9cblxuZnVuY3Rpb24gbm9kZVRvRnJhZ21lbnQobm9kZSkge1xuICAvLyBpZiBpdHMgYSB0ZW1wbGF0ZSB0YWcgYW5kIHRoZSBicm93c2VyIHN1cHBvcnRzIGl0LFxuICAvLyBpdHMgY29udGVudCBpcyBhbHJlYWR5IGEgZG9jdW1lbnQgZnJhZ21lbnQuXG4gIGlmIChpc1JlYWxUZW1wbGF0ZShub2RlKSkge1xuICAgIHRyaW1Ob2RlKG5vZGUuY29udGVudCk7XG4gICAgcmV0dXJuIG5vZGUuY29udGVudDtcbiAgfVxuICAvLyBzY3JpcHQgdGVtcGxhdGVcbiAgaWYgKG5vZGUudGFnTmFtZSA9PT0gJ1NDUklQVCcpIHtcbiAgICByZXR1cm4gc3RyaW5nVG9GcmFnbWVudChub2RlLnRleHRDb250ZW50KTtcbiAgfVxuICAvLyBub3JtYWwgbm9kZSwgY2xvbmUgaXQgdG8gYXZvaWQgbXV0YXRpbmcgdGhlIG9yaWdpbmFsXG4gIHZhciBjbG9uZWROb2RlID0gY2xvbmVOb2RlKG5vZGUpO1xuICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgdmFyIGNoaWxkO1xuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25kLWFzc2lnbiAqL1xuICB3aGlsZSAoY2hpbGQgPSBjbG9uZWROb2RlLmZpcnN0Q2hpbGQpIHtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbmQtYXNzaWduICovXG4gICAgZnJhZy5hcHBlbmRDaGlsZChjaGlsZCk7XG4gIH1cbiAgdHJpbU5vZGUoZnJhZyk7XG4gIHJldHVybiBmcmFnO1xufVxuXG4vLyBUZXN0IGZvciB0aGUgcHJlc2VuY2Ugb2YgdGhlIFNhZmFyaSB0ZW1wbGF0ZSBjbG9uaW5nIGJ1Z1xuLy8gaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd3VnLmNnaT9pZD0xMzc3NTVcbnZhciBoYXNCcm9rZW5UZW1wbGF0ZSA9IChmdW5jdGlvbiAoKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmIChpbkJyb3dzZXIpIHtcbiAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGEuaW5uZXJIVE1MID0gJzx0ZW1wbGF0ZT4xPC90ZW1wbGF0ZT4nO1xuICAgIHJldHVybiAhYS5jbG9uZU5vZGUodHJ1ZSkuZmlyc3RDaGlsZC5pbm5lckhUTUw7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59KSgpO1xuXG4vLyBUZXN0IGZvciBJRTEwLzExIHRleHRhcmVhIHBsYWNlaG9sZGVyIGNsb25lIGJ1Z1xudmFyIGhhc1RleHRhcmVhQ2xvbmVCdWcgPSAoZnVuY3Rpb24gKCkge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICBpZiAoaW5Ccm93c2VyKSB7XG4gICAgdmFyIHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgIHQucGxhY2Vob2xkZXIgPSAndCc7XG4gICAgcmV0dXJuIHQuY2xvbmVOb2RlKHRydWUpLnZhbHVlID09PSAndCc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59KSgpO1xuXG4vKipcbiAqIDEuIERlYWwgd2l0aCBTYWZhcmkgY2xvbmluZyBuZXN0ZWQgPHRlbXBsYXRlPiBidWcgYnlcbiAqICAgIG1hbnVhbGx5IGNsb25pbmcgYWxsIHRlbXBsYXRlIGluc3RhbmNlcy5cbiAqIDIuIERlYWwgd2l0aCBJRTEwLzExIHRleHRhcmVhIHBsYWNlaG9sZGVyIGJ1ZyBieSBzZXR0aW5nXG4gKiAgICB0aGUgY29ycmVjdCB2YWx1ZSBhZnRlciBjbG9uaW5nLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudHxEb2N1bWVudEZyYWdtZW50fSBub2RlXG4gKiBAcmV0dXJuIHtFbGVtZW50fERvY3VtZW50RnJhZ21lbnR9XG4gKi9cblxuZnVuY3Rpb24gY2xvbmVOb2RlKG5vZGUpIHtcbiAgaWYgKCFub2RlLnF1ZXJ5U2VsZWN0b3JBbGwpIHtcbiAgICByZXR1cm4gbm9kZS5jbG9uZU5vZGUoKTtcbiAgfVxuICB2YXIgcmVzID0gbm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gIHZhciBpLCBvcmlnaW5hbCwgY2xvbmVkO1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKGhhc0Jyb2tlblRlbXBsYXRlKSB7XG4gICAgdmFyIHRlbXBDbG9uZSA9IHJlcztcbiAgICBpZiAoaXNSZWFsVGVtcGxhdGUobm9kZSkpIHtcbiAgICAgIG5vZGUgPSBub2RlLmNvbnRlbnQ7XG4gICAgICB0ZW1wQ2xvbmUgPSByZXMuY29udGVudDtcbiAgICB9XG4gICAgb3JpZ2luYWwgPSBub2RlLnF1ZXJ5U2VsZWN0b3JBbGwoJ3RlbXBsYXRlJyk7XG4gICAgaWYgKG9yaWdpbmFsLmxlbmd0aCkge1xuICAgICAgY2xvbmVkID0gdGVtcENsb25lLnF1ZXJ5U2VsZWN0b3JBbGwoJ3RlbXBsYXRlJyk7XG4gICAgICBpID0gY2xvbmVkLmxlbmd0aDtcbiAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgY2xvbmVkW2ldLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGNsb25lTm9kZShvcmlnaW5hbFtpXSksIGNsb25lZFtpXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoaGFzVGV4dGFyZWFDbG9uZUJ1Zykge1xuICAgIGlmIChub2RlLnRhZ05hbWUgPT09ICdURVhUQVJFQScpIHtcbiAgICAgIHJlcy52YWx1ZSA9IG5vZGUudmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9yaWdpbmFsID0gbm9kZS5xdWVyeVNlbGVjdG9yQWxsKCd0ZXh0YXJlYScpO1xuICAgICAgaWYgKG9yaWdpbmFsLmxlbmd0aCkge1xuICAgICAgICBjbG9uZWQgPSByZXMucXVlcnlTZWxlY3RvckFsbCgndGV4dGFyZWEnKTtcbiAgICAgICAgaSA9IGNsb25lZC5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICBjbG9uZWRbaV0udmFsdWUgPSBvcmlnaW5hbFtpXS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIFByb2Nlc3MgdGhlIHRlbXBsYXRlIG9wdGlvbiBhbmQgbm9ybWFsaXplcyBpdCBpbnRvIGFcbiAqIGEgRG9jdW1lbnRGcmFnbWVudCB0aGF0IGNhbiBiZSB1c2VkIGFzIGEgcGFydGlhbCBvciBhXG4gKiBpbnN0YW5jZSB0ZW1wbGF0ZS5cbiAqXG4gKiBAcGFyYW0geyp9IHRlbXBsYXRlXG4gKiAgICAgICAgUG9zc2libGUgdmFsdWVzIGluY2x1ZGU6XG4gKiAgICAgICAgLSBEb2N1bWVudEZyYWdtZW50IG9iamVjdFxuICogICAgICAgIC0gTm9kZSBvYmplY3Qgb2YgdHlwZSBUZW1wbGF0ZVxuICogICAgICAgIC0gaWQgc2VsZWN0b3I6ICcjc29tZS10ZW1wbGF0ZS1pZCdcbiAqICAgICAgICAtIHRlbXBsYXRlIHN0cmluZzogJzxkaXY+PHNwYW4+e3ttc2d9fTwvc3Bhbj48L2Rpdj4nXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHNob3VsZENsb25lXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHJhd1xuICogICAgICAgIGlubGluZSBIVE1MIGludGVycG9sYXRpb24uIERvIG5vdCBjaGVjayBmb3IgaWRcbiAqICAgICAgICBzZWxlY3RvciBhbmQga2VlcCB3aGl0ZXNwYWNlIGluIHRoZSBzdHJpbmcuXG4gKiBAcmV0dXJuIHtEb2N1bWVudEZyYWdtZW50fHVuZGVmaW5lZH1cbiAqL1xuXG5mdW5jdGlvbiBwYXJzZVRlbXBsYXRlKHRlbXBsYXRlLCBzaG91bGRDbG9uZSwgcmF3KSB7XG4gIHZhciBub2RlLCBmcmFnO1xuXG4gIC8vIGlmIHRoZSB0ZW1wbGF0ZSBpcyBhbHJlYWR5IGEgZG9jdW1lbnQgZnJhZ21lbnQsXG4gIC8vIGRvIG5vdGhpbmdcbiAgaWYgKGlzRnJhZ21lbnQodGVtcGxhdGUpKSB7XG4gICAgdHJpbU5vZGUodGVtcGxhdGUpO1xuICAgIHJldHVybiBzaG91bGRDbG9uZSA/IGNsb25lTm9kZSh0ZW1wbGF0ZSkgOiB0ZW1wbGF0ZTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdGVtcGxhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgLy8gaWQgc2VsZWN0b3JcbiAgICBpZiAoIXJhdyAmJiB0ZW1wbGF0ZS5jaGFyQXQoMCkgPT09ICcjJykge1xuICAgICAgLy8gaWQgc2VsZWN0b3IgY2FuIGJlIGNhY2hlZCB0b29cbiAgICAgIGZyYWcgPSBpZFNlbGVjdG9yQ2FjaGUuZ2V0KHRlbXBsYXRlKTtcbiAgICAgIGlmICghZnJhZykge1xuICAgICAgICBub2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGVtcGxhdGUuc2xpY2UoMSkpO1xuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgIGZyYWcgPSBub2RlVG9GcmFnbWVudChub2RlKTtcbiAgICAgICAgICAvLyBzYXZlIHNlbGVjdG9yIHRvIGNhY2hlXG4gICAgICAgICAgaWRTZWxlY3RvckNhY2hlLnB1dCh0ZW1wbGF0ZSwgZnJhZyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gbm9ybWFsIHN0cmluZyB0ZW1wbGF0ZVxuICAgICAgZnJhZyA9IHN0cmluZ1RvRnJhZ21lbnQodGVtcGxhdGUsIHJhdyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHRlbXBsYXRlLm5vZGVUeXBlKSB7XG4gICAgLy8gYSBkaXJlY3Qgbm9kZVxuICAgIGZyYWcgPSBub2RlVG9GcmFnbWVudCh0ZW1wbGF0ZSk7XG4gIH1cblxuICByZXR1cm4gZnJhZyAmJiBzaG91bGRDbG9uZSA/IGNsb25lTm9kZShmcmFnKSA6IGZyYWc7XG59XG5cbnZhciB0ZW1wbGF0ZSA9IE9iamVjdC5mcmVlemUoe1xuICBjbG9uZU5vZGU6IGNsb25lTm9kZSxcbiAgcGFyc2VUZW1wbGF0ZTogcGFyc2VUZW1wbGF0ZVxufSk7XG5cbnZhciBodG1sID0ge1xuXG4gIGJpbmQ6IGZ1bmN0aW9uIGJpbmQoKSB7XG4gICAgLy8gYSBjb21tZW50IG5vZGUgbWVhbnMgdGhpcyBpcyBhIGJpbmRpbmcgZm9yXG4gICAgLy8ge3t7IGlubGluZSB1bmVzY2FwZWQgaHRtbCB9fX1cbiAgICBpZiAodGhpcy5lbC5ub2RlVHlwZSA9PT0gOCkge1xuICAgICAgLy8gaG9sZCBub2Rlc1xuICAgICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgICAgLy8gcmVwbGFjZSB0aGUgcGxhY2Vob2xkZXIgd2l0aCBwcm9wZXIgYW5jaG9yXG4gICAgICB0aGlzLmFuY2hvciA9IGNyZWF0ZUFuY2hvcigndi1odG1sJyk7XG4gICAgICByZXBsYWNlKHRoaXMuZWwsIHRoaXMuYW5jaG9yKTtcbiAgICB9XG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUodmFsdWUpIHtcbiAgICB2YWx1ZSA9IF90b1N0cmluZyh2YWx1ZSk7XG4gICAgaWYgKHRoaXMubm9kZXMpIHtcbiAgICAgIHRoaXMuc3dhcCh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWwuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgfVxuICB9LFxuXG4gIHN3YXA6IGZ1bmN0aW9uIHN3YXAodmFsdWUpIHtcbiAgICAvLyByZW1vdmUgb2xkIG5vZGVzXG4gICAgdmFyIGkgPSB0aGlzLm5vZGVzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICByZW1vdmUodGhpcy5ub2Rlc1tpXSk7XG4gICAgfVxuICAgIC8vIGNvbnZlcnQgbmV3IHZhbHVlIHRvIGEgZnJhZ21lbnRcbiAgICAvLyBkbyBub3QgYXR0ZW1wdCB0byByZXRyaWV2ZSBmcm9tIGlkIHNlbGVjdG9yXG4gICAgdmFyIGZyYWcgPSBwYXJzZVRlbXBsYXRlKHZhbHVlLCB0cnVlLCB0cnVlKTtcbiAgICAvLyBzYXZlIGEgcmVmZXJlbmNlIHRvIHRoZXNlIG5vZGVzIHNvIHdlIGNhbiByZW1vdmUgbGF0ZXJcbiAgICB0aGlzLm5vZGVzID0gdG9BcnJheShmcmFnLmNoaWxkTm9kZXMpO1xuICAgIGJlZm9yZShmcmFnLCB0aGlzLmFuY2hvcik7XG4gIH1cbn07XG5cbi8qKlxuICogQWJzdHJhY3Rpb24gZm9yIGEgcGFydGlhbGx5LWNvbXBpbGVkIGZyYWdtZW50LlxuICogQ2FuIG9wdGlvbmFsbHkgY29tcGlsZSBjb250ZW50IHdpdGggYSBjaGlsZCBzY29wZS5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaW5rZXJcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtEb2N1bWVudEZyYWdtZW50fSBmcmFnXG4gKiBAcGFyYW0ge1Z1ZX0gW2hvc3RdXG4gKiBAcGFyYW0ge09iamVjdH0gW3Njb3BlXVxuICovXG5mdW5jdGlvbiBGcmFnbWVudChsaW5rZXIsIHZtLCBmcmFnLCBob3N0LCBzY29wZSwgcGFyZW50RnJhZykge1xuICB0aGlzLmNoaWxkcmVuID0gW107XG4gIHRoaXMuY2hpbGRGcmFncyA9IFtdO1xuICB0aGlzLnZtID0gdm07XG4gIHRoaXMuc2NvcGUgPSBzY29wZTtcbiAgdGhpcy5pbnNlcnRlZCA9IGZhbHNlO1xuICB0aGlzLnBhcmVudEZyYWcgPSBwYXJlbnRGcmFnO1xuICBpZiAocGFyZW50RnJhZykge1xuICAgIHBhcmVudEZyYWcuY2hpbGRGcmFncy5wdXNoKHRoaXMpO1xuICB9XG4gIHRoaXMudW5saW5rID0gbGlua2VyKHZtLCBmcmFnLCBob3N0LCBzY29wZSwgdGhpcyk7XG4gIHZhciBzaW5nbGUgPSB0aGlzLnNpbmdsZSA9IGZyYWcuY2hpbGROb2Rlcy5sZW5ndGggPT09IDEgJiZcbiAgLy8gZG8gbm90IGdvIHNpbmdsZSBtb2RlIGlmIHRoZSBvbmx5IG5vZGUgaXMgYW4gYW5jaG9yXG4gICFmcmFnLmNoaWxkTm9kZXNbMF0uX192X2FuY2hvcjtcbiAgaWYgKHNpbmdsZSkge1xuICAgIHRoaXMubm9kZSA9IGZyYWcuY2hpbGROb2Rlc1swXTtcbiAgICB0aGlzLmJlZm9yZSA9IHNpbmdsZUJlZm9yZTtcbiAgICB0aGlzLnJlbW92ZSA9IHNpbmdsZVJlbW92ZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm5vZGUgPSBjcmVhdGVBbmNob3IoJ2ZyYWdtZW50LXN0YXJ0Jyk7XG4gICAgdGhpcy5lbmQgPSBjcmVhdGVBbmNob3IoJ2ZyYWdtZW50LWVuZCcpO1xuICAgIHRoaXMuZnJhZyA9IGZyYWc7XG4gICAgcHJlcGVuZCh0aGlzLm5vZGUsIGZyYWcpO1xuICAgIGZyYWcuYXBwZW5kQ2hpbGQodGhpcy5lbmQpO1xuICAgIHRoaXMuYmVmb3JlID0gbXVsdGlCZWZvcmU7XG4gICAgdGhpcy5yZW1vdmUgPSBtdWx0aVJlbW92ZTtcbiAgfVxuICB0aGlzLm5vZGUuX192X2ZyYWcgPSB0aGlzO1xufVxuXG4vKipcbiAqIENhbGwgYXR0YWNoL2RldGFjaCBmb3IgYWxsIGNvbXBvbmVudHMgY29udGFpbmVkIHdpdGhpblxuICogdGhpcyBmcmFnbWVudC4gQWxzbyBkbyBzbyByZWN1cnNpdmVseSBmb3IgYWxsIGNoaWxkXG4gKiBmcmFnbWVudHMuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaG9va1xuICovXG5cbkZyYWdtZW50LnByb3RvdHlwZS5jYWxsSG9vayA9IGZ1bmN0aW9uIChob29rKSB7XG4gIHZhciBpLCBsO1xuICBmb3IgKGkgPSAwLCBsID0gdGhpcy5jaGlsZEZyYWdzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHRoaXMuY2hpbGRGcmFnc1tpXS5jYWxsSG9vayhob29rKTtcbiAgfVxuICBmb3IgKGkgPSAwLCBsID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBob29rKHRoaXMuY2hpbGRyZW5baV0pO1xuICB9XG59O1xuXG4vKipcbiAqIEluc2VydCBmcmFnbWVudCBiZWZvcmUgdGFyZ2V0LCBzaW5nbGUgbm9kZSB2ZXJzaW9uXG4gKlxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gd2l0aFRyYW5zaXRpb25cbiAqL1xuXG5mdW5jdGlvbiBzaW5nbGVCZWZvcmUodGFyZ2V0LCB3aXRoVHJhbnNpdGlvbikge1xuICB0aGlzLmluc2VydGVkID0gdHJ1ZTtcbiAgdmFyIG1ldGhvZCA9IHdpdGhUcmFuc2l0aW9uICE9PSBmYWxzZSA/IGJlZm9yZVdpdGhUcmFuc2l0aW9uIDogYmVmb3JlO1xuICBtZXRob2QodGhpcy5ub2RlLCB0YXJnZXQsIHRoaXMudm0pO1xuICBpZiAoaW5Eb2ModGhpcy5ub2RlKSkge1xuICAgIHRoaXMuY2FsbEhvb2soYXR0YWNoKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZSBmcmFnbWVudCwgc2luZ2xlIG5vZGUgdmVyc2lvblxuICovXG5cbmZ1bmN0aW9uIHNpbmdsZVJlbW92ZSgpIHtcbiAgdGhpcy5pbnNlcnRlZCA9IGZhbHNlO1xuICB2YXIgc2hvdWxkQ2FsbFJlbW92ZSA9IGluRG9jKHRoaXMubm9kZSk7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5iZWZvcmVSZW1vdmUoKTtcbiAgcmVtb3ZlV2l0aFRyYW5zaXRpb24odGhpcy5ub2RlLCB0aGlzLnZtLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHNob3VsZENhbGxSZW1vdmUpIHtcbiAgICAgIHNlbGYuY2FsbEhvb2soZGV0YWNoKTtcbiAgICB9XG4gICAgc2VsZi5kZXN0cm95KCk7XG4gIH0pO1xufVxuXG4vKipcbiAqIEluc2VydCBmcmFnbWVudCBiZWZvcmUgdGFyZ2V0LCBtdWx0aS1ub2RlcyB2ZXJzaW9uXG4gKlxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gd2l0aFRyYW5zaXRpb25cbiAqL1xuXG5mdW5jdGlvbiBtdWx0aUJlZm9yZSh0YXJnZXQsIHdpdGhUcmFuc2l0aW9uKSB7XG4gIHRoaXMuaW5zZXJ0ZWQgPSB0cnVlO1xuICB2YXIgdm0gPSB0aGlzLnZtO1xuICB2YXIgbWV0aG9kID0gd2l0aFRyYW5zaXRpb24gIT09IGZhbHNlID8gYmVmb3JlV2l0aFRyYW5zaXRpb24gOiBiZWZvcmU7XG4gIG1hcE5vZGVSYW5nZSh0aGlzLm5vZGUsIHRoaXMuZW5kLCBmdW5jdGlvbiAobm9kZSkge1xuICAgIG1ldGhvZChub2RlLCB0YXJnZXQsIHZtKTtcbiAgfSk7XG4gIGlmIChpbkRvYyh0aGlzLm5vZGUpKSB7XG4gICAgdGhpcy5jYWxsSG9vayhhdHRhY2gpO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIGZyYWdtZW50LCBtdWx0aS1ub2RlcyB2ZXJzaW9uXG4gKi9cblxuZnVuY3Rpb24gbXVsdGlSZW1vdmUoKSB7XG4gIHRoaXMuaW5zZXJ0ZWQgPSBmYWxzZTtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgc2hvdWxkQ2FsbFJlbW92ZSA9IGluRG9jKHRoaXMubm9kZSk7XG4gIHRoaXMuYmVmb3JlUmVtb3ZlKCk7XG4gIHJlbW92ZU5vZGVSYW5nZSh0aGlzLm5vZGUsIHRoaXMuZW5kLCB0aGlzLnZtLCB0aGlzLmZyYWcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoc2hvdWxkQ2FsbFJlbW92ZSkge1xuICAgICAgc2VsZi5jYWxsSG9vayhkZXRhY2gpO1xuICAgIH1cbiAgICBzZWxmLmRlc3Ryb3koKTtcbiAgfSk7XG59XG5cbi8qKlxuICogUHJlcGFyZSB0aGUgZnJhZ21lbnQgZm9yIHJlbW92YWwuXG4gKi9cblxuRnJhZ21lbnQucHJvdG90eXBlLmJlZm9yZVJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGksIGw7XG4gIGZvciAoaSA9IDAsIGwgPSB0aGlzLmNoaWxkRnJhZ3MubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgLy8gY2FsbCB0aGUgc2FtZSBtZXRob2QgcmVjdXJzaXZlbHkgb24gY2hpbGRcbiAgICAvLyBmcmFnbWVudHMsIGRlcHRoLWZpcnN0XG4gICAgdGhpcy5jaGlsZEZyYWdzW2ldLmJlZm9yZVJlbW92ZShmYWxzZSk7XG4gIH1cbiAgZm9yIChpID0gMCwgbCA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgLy8gQ2FsbCBkZXN0cm95IGZvciBhbGwgY29udGFpbmVkIGluc3RhbmNlcyxcbiAgICAvLyB3aXRoIHJlbW92ZTpmYWxzZSBhbmQgZGVmZXI6dHJ1ZS5cbiAgICAvLyBEZWZlciBpcyBuZWNlc3NhcnkgYmVjYXVzZSB3ZSBuZWVkIHRvXG4gICAgLy8ga2VlcCB0aGUgY2hpbGRyZW4gdG8gY2FsbCBkZXRhY2ggaG9va3NcbiAgICAvLyBvbiB0aGVtLlxuICAgIHRoaXMuY2hpbGRyZW5baV0uJGRlc3Ryb3koZmFsc2UsIHRydWUpO1xuICB9XG4gIHZhciBkaXJzID0gdGhpcy51bmxpbmsuZGlycztcbiAgZm9yIChpID0gMCwgbCA9IGRpcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgLy8gZGlzYWJsZSB0aGUgd2F0Y2hlcnMgb24gYWxsIHRoZSBkaXJlY3RpdmVzXG4gICAgLy8gc28gdGhhdCB0aGUgcmVuZGVyZWQgY29udGVudCBzdGF5cyB0aGUgc2FtZVxuICAgIC8vIGR1cmluZyByZW1vdmFsLlxuICAgIGRpcnNbaV0uX3dhdGNoZXIgJiYgZGlyc1tpXS5fd2F0Y2hlci50ZWFyZG93bigpO1xuICB9XG59O1xuXG4vKipcbiAqIERlc3Ryb3kgdGhlIGZyYWdtZW50LlxuICovXG5cbkZyYWdtZW50LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5wYXJlbnRGcmFnKSB7XG4gICAgdGhpcy5wYXJlbnRGcmFnLmNoaWxkRnJhZ3MuJHJlbW92ZSh0aGlzKTtcbiAgfVxuICB0aGlzLm5vZGUuX192X2ZyYWcgPSBudWxsO1xuICB0aGlzLnVubGluaygpO1xufTtcblxuLyoqXG4gKiBDYWxsIGF0dGFjaCBob29rIGZvciBhIFZ1ZSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1Z1ZX0gY2hpbGRcbiAqL1xuXG5mdW5jdGlvbiBhdHRhY2goY2hpbGQpIHtcbiAgaWYgKCFjaGlsZC5faXNBdHRhY2hlZCkge1xuICAgIGNoaWxkLl9jYWxsSG9vaygnYXR0YWNoZWQnKTtcbiAgfVxufVxuXG4vKipcbiAqIENhbGwgZGV0YWNoIGhvb2sgZm9yIGEgVnVlIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7VnVlfSBjaGlsZFxuICovXG5cbmZ1bmN0aW9uIGRldGFjaChjaGlsZCkge1xuICBpZiAoY2hpbGQuX2lzQXR0YWNoZWQpIHtcbiAgICBjaGlsZC5fY2FsbEhvb2soJ2RldGFjaGVkJyk7XG4gIH1cbn1cblxudmFyIGxpbmtlckNhY2hlID0gbmV3IENhY2hlKDUwMDApO1xuXG4vKipcbiAqIEEgZmFjdG9yeSB0aGF0IGNhbiBiZSB1c2VkIHRvIGNyZWF0ZSBpbnN0YW5jZXMgb2YgYVxuICogZnJhZ21lbnQuIENhY2hlcyB0aGUgY29tcGlsZWQgbGlua2VyIGlmIHBvc3NpYmxlLlxuICpcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtFbGVtZW50fFN0cmluZ30gZWxcbiAqL1xuZnVuY3Rpb24gRnJhZ21lbnRGYWN0b3J5KHZtLCBlbCkge1xuICB0aGlzLnZtID0gdm07XG4gIHZhciB0ZW1wbGF0ZTtcbiAgdmFyIGlzU3RyaW5nID0gdHlwZW9mIGVsID09PSAnc3RyaW5nJztcbiAgaWYgKGlzU3RyaW5nIHx8IGlzVGVtcGxhdGUoZWwpKSB7XG4gICAgdGVtcGxhdGUgPSBwYXJzZVRlbXBsYXRlKGVsLCB0cnVlKTtcbiAgfSBlbHNlIHtcbiAgICB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB0ZW1wbGF0ZS5hcHBlbmRDaGlsZChlbCk7XG4gIH1cbiAgdGhpcy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAvLyBsaW5rZXIgY2FuIGJlIGNhY2hlZCwgYnV0IG9ubHkgZm9yIGNvbXBvbmVudHNcbiAgdmFyIGxpbmtlcjtcbiAgdmFyIGNpZCA9IHZtLmNvbnN0cnVjdG9yLmNpZDtcbiAgaWYgKGNpZCA+IDApIHtcbiAgICB2YXIgY2FjaGVJZCA9IGNpZCArIChpc1N0cmluZyA/IGVsIDogZ2V0T3V0ZXJIVE1MKGVsKSk7XG4gICAgbGlua2VyID0gbGlua2VyQ2FjaGUuZ2V0KGNhY2hlSWQpO1xuICAgIGlmICghbGlua2VyKSB7XG4gICAgICBsaW5rZXIgPSBjb21waWxlKHRlbXBsYXRlLCB2bS4kb3B0aW9ucywgdHJ1ZSk7XG4gICAgICBsaW5rZXJDYWNoZS5wdXQoY2FjaGVJZCwgbGlua2VyKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbGlua2VyID0gY29tcGlsZSh0ZW1wbGF0ZSwgdm0uJG9wdGlvbnMsIHRydWUpO1xuICB9XG4gIHRoaXMubGlua2VyID0gbGlua2VyO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGZyYWdtZW50IGluc3RhbmNlIHdpdGggZ2l2ZW4gaG9zdCBhbmQgc2NvcGUuXG4gKlxuICogQHBhcmFtIHtWdWV9IGhvc3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBzY29wZVxuICogQHBhcmFtIHtGcmFnbWVudH0gcGFyZW50RnJhZ1xuICovXG5cbkZyYWdtZW50RmFjdG9yeS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKGhvc3QsIHNjb3BlLCBwYXJlbnRGcmFnKSB7XG4gIHZhciBmcmFnID0gY2xvbmVOb2RlKHRoaXMudGVtcGxhdGUpO1xuICByZXR1cm4gbmV3IEZyYWdtZW50KHRoaXMubGlua2VyLCB0aGlzLnZtLCBmcmFnLCBob3N0LCBzY29wZSwgcGFyZW50RnJhZyk7XG59O1xuXG52YXIgT04gPSA3MDA7XG52YXIgTU9ERUwgPSA4MDA7XG52YXIgQklORCA9IDg1MDtcbnZhciBUUkFOU0lUSU9OID0gMTEwMDtcbnZhciBFTCA9IDE1MDA7XG52YXIgQ09NUE9ORU5UID0gMTUwMDtcbnZhciBQQVJUSUFMID0gMTc1MDtcbnZhciBGT1IgPSAyMDAwO1xudmFyIElGID0gMjAwMDtcbnZhciBTTE9UID0gMjEwMDtcblxudmFyIHVpZCQzID0gMDtcblxudmFyIHZGb3IgPSB7XG5cbiAgcHJpb3JpdHk6IEZPUixcblxuICBwYXJhbXM6IFsndHJhY2stYnknLCAnc3RhZ2dlcicsICdlbnRlci1zdGFnZ2VyJywgJ2xlYXZlLXN0YWdnZXInXSxcblxuICBiaW5kOiBmdW5jdGlvbiBiaW5kKCkge1xuICAgIC8vIHN1cHBvcnQgXCJpdGVtIGluL29mIGl0ZW1zXCIgc3ludGF4XG4gICAgdmFyIGluTWF0Y2ggPSB0aGlzLmV4cHJlc3Npb24ubWF0Y2goLyguKikgKD86aW58b2YpICguKikvKTtcbiAgICBpZiAoaW5NYXRjaCkge1xuICAgICAgdmFyIGl0TWF0Y2ggPSBpbk1hdGNoWzFdLm1hdGNoKC9cXCgoLiopLCguKilcXCkvKTtcbiAgICAgIGlmIChpdE1hdGNoKSB7XG4gICAgICAgIHRoaXMuaXRlcmF0b3IgPSBpdE1hdGNoWzFdLnRyaW0oKTtcbiAgICAgICAgdGhpcy5hbGlhcyA9IGl0TWF0Y2hbMl0udHJpbSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hbGlhcyA9IGluTWF0Y2hbMV0udHJpbSgpO1xuICAgICAgfVxuICAgICAgdGhpcy5leHByZXNzaW9uID0gaW5NYXRjaFsyXTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuYWxpYXMpIHtcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybignQWxpYXMgaXMgcmVxdWlyZWQgaW4gdi1mb3IuJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gdWlkIGFzIGEgY2FjaGUgaWRlbnRpZmllclxuICAgIHRoaXMuaWQgPSAnX192LWZvcl9fJyArICsrdWlkJDM7XG5cbiAgICAvLyBjaGVjayBpZiB0aGlzIGlzIGFuIG9wdGlvbiBsaXN0LFxuICAgIC8vIHNvIHRoYXQgd2Uga25vdyBpZiB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgPHNlbGVjdD4nc1xuICAgIC8vIHYtbW9kZWwgd2hlbiB0aGUgb3B0aW9uIGxpc3QgaGFzIGNoYW5nZWQuXG4gICAgLy8gYmVjYXVzZSB2LW1vZGVsIGhhcyBhIGxvd2VyIHByaW9yaXR5IHRoYW4gdi1mb3IsXG4gICAgLy8gdGhlIHYtbW9kZWwgaXMgbm90IGJvdW5kIGhlcmUgeWV0LCBzbyB3ZSBoYXZlIHRvXG4gICAgLy8gcmV0cml2ZSBpdCBpbiB0aGUgYWN0dWFsIHVwZGF0ZU1vZGVsKCkgZnVuY3Rpb24uXG4gICAgdmFyIHRhZyA9IHRoaXMuZWwudGFnTmFtZTtcbiAgICB0aGlzLmlzT3B0aW9uID0gKHRhZyA9PT0gJ09QVElPTicgfHwgdGFnID09PSAnT1BUR1JPVVAnKSAmJiB0aGlzLmVsLnBhcmVudE5vZGUudGFnTmFtZSA9PT0gJ1NFTEVDVCc7XG5cbiAgICAvLyBzZXR1cCBhbmNob3Igbm9kZXNcbiAgICB0aGlzLnN0YXJ0ID0gY3JlYXRlQW5jaG9yKCd2LWZvci1zdGFydCcpO1xuICAgIHRoaXMuZW5kID0gY3JlYXRlQW5jaG9yKCd2LWZvci1lbmQnKTtcbiAgICByZXBsYWNlKHRoaXMuZWwsIHRoaXMuZW5kKTtcbiAgICBiZWZvcmUodGhpcy5zdGFydCwgdGhpcy5lbmQpO1xuXG4gICAgLy8gY2FjaGVcbiAgICB0aGlzLmNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgIC8vIGZyYWdtZW50IGZhY3RvcnlcbiAgICB0aGlzLmZhY3RvcnkgPSBuZXcgRnJhZ21lbnRGYWN0b3J5KHRoaXMudm0sIHRoaXMuZWwpO1xuICB9LFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKGRhdGEpIHtcbiAgICB0aGlzLmRpZmYoZGF0YSk7XG4gICAgdGhpcy51cGRhdGVSZWYoKTtcbiAgICB0aGlzLnVwZGF0ZU1vZGVsKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERpZmYsIGJhc2VkIG9uIG5ldyBkYXRhIGFuZCBvbGQgZGF0YSwgZGV0ZXJtaW5lIHRoZVxuICAgKiBtaW5pbXVtIGFtb3VudCBvZiBET00gbWFuaXB1bGF0aW9ucyBuZWVkZWQgdG8gbWFrZSB0aGVcbiAgICogRE9NIHJlZmxlY3QgdGhlIG5ldyBkYXRhIEFycmF5LlxuICAgKlxuICAgKiBUaGUgYWxnb3JpdGhtIGRpZmZzIHRoZSBuZXcgZGF0YSBBcnJheSBieSBzdG9yaW5nIGFcbiAgICogaGlkZGVuIHJlZmVyZW5jZSB0byBhbiBvd25lciB2bSBpbnN0YW5jZSBvbiBwcmV2aW91c2x5XG4gICAqIHNlZW4gZGF0YS4gVGhpcyBhbGxvd3MgdXMgdG8gYWNoaWV2ZSBPKG4pIHdoaWNoIGlzXG4gICAqIGJldHRlciB0aGFuIGEgbGV2ZW5zaHRlaW4gZGlzdGFuY2UgYmFzZWQgYWxnb3JpdGhtLFxuICAgKiB3aGljaCBpcyBPKG0gKiBuKS5cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheX0gZGF0YVxuICAgKi9cblxuICBkaWZmOiBmdW5jdGlvbiBkaWZmKGRhdGEpIHtcbiAgICAvLyBjaGVjayBpZiB0aGUgQXJyYXkgd2FzIGNvbnZlcnRlZCBmcm9tIGFuIE9iamVjdFxuICAgIHZhciBpdGVtID0gZGF0YVswXTtcbiAgICB2YXIgY29udmVydGVkRnJvbU9iamVjdCA9IHRoaXMuZnJvbU9iamVjdCA9IGlzT2JqZWN0KGl0ZW0pICYmIGhhc093bihpdGVtLCAnJGtleScpICYmIGhhc093bihpdGVtLCAnJHZhbHVlJyk7XG5cbiAgICB2YXIgdHJhY2tCeUtleSA9IHRoaXMucGFyYW1zLnRyYWNrQnk7XG4gICAgdmFyIG9sZEZyYWdzID0gdGhpcy5mcmFncztcbiAgICB2YXIgZnJhZ3MgPSB0aGlzLmZyYWdzID0gbmV3IEFycmF5KGRhdGEubGVuZ3RoKTtcbiAgICB2YXIgYWxpYXMgPSB0aGlzLmFsaWFzO1xuICAgIHZhciBpdGVyYXRvciA9IHRoaXMuaXRlcmF0b3I7XG4gICAgdmFyIHN0YXJ0ID0gdGhpcy5zdGFydDtcbiAgICB2YXIgZW5kID0gdGhpcy5lbmQ7XG4gICAgdmFyIGluRG9jdW1lbnQgPSBpbkRvYyhzdGFydCk7XG4gICAgdmFyIGluaXQgPSAhb2xkRnJhZ3M7XG4gICAgdmFyIGksIGwsIGZyYWcsIGtleSwgdmFsdWUsIHByaW1pdGl2ZTtcblxuICAgIC8vIEZpcnN0IHBhc3MsIGdvIHRocm91Z2ggdGhlIG5ldyBBcnJheSBhbmQgZmlsbCB1cFxuICAgIC8vIHRoZSBuZXcgZnJhZ3MgYXJyYXkuIElmIGEgcGllY2Ugb2YgZGF0YSBoYXMgYSBjYWNoZWRcbiAgICAvLyBpbnN0YW5jZSBmb3IgaXQsIHdlIHJldXNlIGl0LiBPdGhlcndpc2UgYnVpbGQgYSBuZXdcbiAgICAvLyBpbnN0YW5jZS5cbiAgICBmb3IgKGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGl0ZW0gPSBkYXRhW2ldO1xuICAgICAga2V5ID0gY29udmVydGVkRnJvbU9iamVjdCA/IGl0ZW0uJGtleSA6IG51bGw7XG4gICAgICB2YWx1ZSA9IGNvbnZlcnRlZEZyb21PYmplY3QgPyBpdGVtLiR2YWx1ZSA6IGl0ZW07XG4gICAgICBwcmltaXRpdmUgPSAhaXNPYmplY3QodmFsdWUpO1xuICAgICAgZnJhZyA9ICFpbml0ICYmIHRoaXMuZ2V0Q2FjaGVkRnJhZyh2YWx1ZSwgaSwga2V5KTtcbiAgICAgIGlmIChmcmFnKSB7XG4gICAgICAgIC8vIHJldXNhYmxlIGZyYWdtZW50XG4gICAgICAgIGZyYWcucmV1c2VkID0gdHJ1ZTtcbiAgICAgICAgLy8gdXBkYXRlICRpbmRleFxuICAgICAgICBmcmFnLnNjb3BlLiRpbmRleCA9IGk7XG4gICAgICAgIC8vIHVwZGF0ZSAka2V5XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICBmcmFnLnNjb3BlLiRrZXkgPSBrZXk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXBkYXRlIGl0ZXJhdG9yXG4gICAgICAgIGlmIChpdGVyYXRvcikge1xuICAgICAgICAgIGZyYWcuc2NvcGVbaXRlcmF0b3JdID0ga2V5ICE9PSBudWxsID8ga2V5IDogaTtcbiAgICAgICAgfVxuICAgICAgICAvLyB1cGRhdGUgZGF0YSBmb3IgdHJhY2stYnksIG9iamVjdCByZXBlYXQgJlxuICAgICAgICAvLyBwcmltaXRpdmUgdmFsdWVzLlxuICAgICAgICBpZiAodHJhY2tCeUtleSB8fCBjb252ZXJ0ZWRGcm9tT2JqZWN0IHx8IHByaW1pdGl2ZSkge1xuICAgICAgICAgIGZyYWcuc2NvcGVbYWxpYXNdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG5ldyBpc250YW5jZVxuICAgICAgICBmcmFnID0gdGhpcy5jcmVhdGUodmFsdWUsIGFsaWFzLCBpLCBrZXkpO1xuICAgICAgICBmcmFnLmZyZXNoID0gIWluaXQ7XG4gICAgICB9XG4gICAgICBmcmFnc1tpXSA9IGZyYWc7XG4gICAgICBpZiAoaW5pdCkge1xuICAgICAgICBmcmFnLmJlZm9yZShlbmQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHdlJ3JlIGRvbmUgZm9yIHRoZSBpbml0aWFsIHJlbmRlci5cbiAgICBpZiAoaW5pdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNlY29uZCBwYXNzLCBnbyB0aHJvdWdoIHRoZSBvbGQgZnJhZ21lbnRzIGFuZFxuICAgIC8vIGRlc3Ryb3kgdGhvc2Ugd2hvIGFyZSBub3QgcmV1c2VkIChhbmQgcmVtb3ZlIHRoZW1cbiAgICAvLyBmcm9tIGNhY2hlKVxuICAgIHZhciByZW1vdmFsSW5kZXggPSAwO1xuICAgIHZhciB0b3RhbFJlbW92ZWQgPSBvbGRGcmFncy5sZW5ndGggLSBmcmFncy5sZW5ndGg7XG4gICAgLy8gd2hlbiByZW1vdmluZyBhIGxhcmdlIG51bWJlciBvZiBmcmFnbWVudHMsIHdhdGNoZXIgcmVtb3ZhbFxuICAgIC8vIHR1cm5zIG91dCB0byBiZSBhIHBlcmYgYm90dGxlbmVjaywgc28gd2UgYmF0Y2ggdGhlIHdhdGNoZXJcbiAgICAvLyByZW1vdmFscyBpbnRvIGEgc2luZ2xlIGZpbHRlciBjYWxsIVxuICAgIHRoaXMudm0uX3ZGb3JSZW1vdmluZyA9IHRydWU7XG4gICAgZm9yIChpID0gMCwgbCA9IG9sZEZyYWdzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgZnJhZyA9IG9sZEZyYWdzW2ldO1xuICAgICAgaWYgKCFmcmFnLnJldXNlZCkge1xuICAgICAgICB0aGlzLmRlbGV0ZUNhY2hlZEZyYWcoZnJhZyk7XG4gICAgICAgIHRoaXMucmVtb3ZlKGZyYWcsIHJlbW92YWxJbmRleCsrLCB0b3RhbFJlbW92ZWQsIGluRG9jdW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnZtLl92Rm9yUmVtb3ZpbmcgPSBmYWxzZTtcbiAgICBpZiAocmVtb3ZhbEluZGV4KSB7XG4gICAgICB0aGlzLnZtLl93YXRjaGVycyA9IHRoaXMudm0uX3dhdGNoZXJzLmZpbHRlcihmdW5jdGlvbiAodykge1xuICAgICAgICByZXR1cm4gdy5hY3RpdmU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBGaW5hbCBwYXNzLCBtb3ZlL2luc2VydCBuZXcgZnJhZ21lbnRzIGludG8gdGhlXG4gICAgLy8gcmlnaHQgcGxhY2UuXG4gICAgdmFyIHRhcmdldFByZXYsIHByZXZFbCwgY3VycmVudFByZXY7XG4gICAgdmFyIGluc2VydGlvbkluZGV4ID0gMDtcbiAgICBmb3IgKGkgPSAwLCBsID0gZnJhZ3MubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBmcmFnID0gZnJhZ3NbaV07XG4gICAgICAvLyB0aGlzIGlzIHRoZSBmcmFnIHRoYXQgd2Ugc2hvdWxkIGJlIGFmdGVyXG4gICAgICB0YXJnZXRQcmV2ID0gZnJhZ3NbaSAtIDFdO1xuICAgICAgcHJldkVsID0gdGFyZ2V0UHJldiA/IHRhcmdldFByZXYuc3RhZ2dlckNiID8gdGFyZ2V0UHJldi5zdGFnZ2VyQW5jaG9yIDogdGFyZ2V0UHJldi5lbmQgfHwgdGFyZ2V0UHJldi5ub2RlIDogc3RhcnQ7XG4gICAgICBpZiAoZnJhZy5yZXVzZWQgJiYgIWZyYWcuc3RhZ2dlckNiKSB7XG4gICAgICAgIGN1cnJlbnRQcmV2ID0gZmluZFByZXZGcmFnKGZyYWcsIHN0YXJ0LCB0aGlzLmlkKTtcbiAgICAgICAgaWYgKGN1cnJlbnRQcmV2ICE9PSB0YXJnZXRQcmV2ICYmICghY3VycmVudFByZXYgfHxcbiAgICAgICAgLy8gb3B0aW1pemF0aW9uIGZvciBtb3ZpbmcgYSBzaW5nbGUgaXRlbS5cbiAgICAgICAgLy8gdGhhbmtzIHRvIHN1Z2dlc3Rpb25zIGJ5IEBsaXZvcmFzIGluICMxODA3XG4gICAgICAgIGZpbmRQcmV2RnJhZyhjdXJyZW50UHJldiwgc3RhcnQsIHRoaXMuaWQpICE9PSB0YXJnZXRQcmV2KSkge1xuICAgICAgICAgIHRoaXMubW92ZShmcmFnLCBwcmV2RWwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBuZXcgaW5zdGFuY2UsIG9yIHN0aWxsIGluIHN0YWdnZXIuXG4gICAgICAgIC8vIGluc2VydCB3aXRoIHVwZGF0ZWQgc3RhZ2dlciBpbmRleC5cbiAgICAgICAgdGhpcy5pbnNlcnQoZnJhZywgaW5zZXJ0aW9uSW5kZXgrKywgcHJldkVsLCBpbkRvY3VtZW50KTtcbiAgICAgIH1cbiAgICAgIGZyYWcucmV1c2VkID0gZnJhZy5mcmVzaCA9IGZhbHNlO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGZyYWdtZW50IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0geyp9IHZhbHVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBhbGlhc1xuICAgKiBAcGFyYW0ge051bWJlcn0gaW5kZXhcbiAgICogQHBhcmFtIHtTdHJpbmd9IFtrZXldXG4gICAqIEByZXR1cm4ge0ZyYWdtZW50fVxuICAgKi9cblxuICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZSh2YWx1ZSwgYWxpYXMsIGluZGV4LCBrZXkpIHtcbiAgICB2YXIgaG9zdCA9IHRoaXMuX2hvc3Q7XG4gICAgLy8gY3JlYXRlIGl0ZXJhdGlvbiBzY29wZVxuICAgIHZhciBwYXJlbnRTY29wZSA9IHRoaXMuX3Njb3BlIHx8IHRoaXMudm07XG4gICAgdmFyIHNjb3BlID0gT2JqZWN0LmNyZWF0ZShwYXJlbnRTY29wZSk7XG4gICAgLy8gcmVmIGhvbGRlciBmb3IgdGhlIHNjb3BlXG4gICAgc2NvcGUuJHJlZnMgPSBPYmplY3QuY3JlYXRlKHBhcmVudFNjb3BlLiRyZWZzKTtcbiAgICBzY29wZS4kZWxzID0gT2JqZWN0LmNyZWF0ZShwYXJlbnRTY29wZS4kZWxzKTtcbiAgICAvLyBtYWtlIHN1cmUgcG9pbnQgJHBhcmVudCB0byBwYXJlbnQgc2NvcGVcbiAgICBzY29wZS4kcGFyZW50ID0gcGFyZW50U2NvcGU7XG4gICAgLy8gZm9yIHR3by13YXkgYmluZGluZyBvbiBhbGlhc1xuICAgIHNjb3BlLiRmb3JDb250ZXh0ID0gdGhpcztcbiAgICAvLyBkZWZpbmUgc2NvcGUgcHJvcGVydGllc1xuICAgIGRlZmluZVJlYWN0aXZlKHNjb3BlLCBhbGlhcywgdmFsdWUpO1xuICAgIGRlZmluZVJlYWN0aXZlKHNjb3BlLCAnJGluZGV4JywgaW5kZXgpO1xuICAgIGlmIChrZXkpIHtcbiAgICAgIGRlZmluZVJlYWN0aXZlKHNjb3BlLCAnJGtleScsIGtleSk7XG4gICAgfSBlbHNlIGlmIChzY29wZS4ka2V5KSB7XG4gICAgICAvLyBhdm9pZCBhY2NpZGVudGFsIGZhbGxiYWNrXG4gICAgICBkZWYoc2NvcGUsICcka2V5JywgbnVsbCk7XG4gICAgfVxuICAgIGlmICh0aGlzLml0ZXJhdG9yKSB7XG4gICAgICBkZWZpbmVSZWFjdGl2ZShzY29wZSwgdGhpcy5pdGVyYXRvciwga2V5ICE9PSBudWxsID8ga2V5IDogaW5kZXgpO1xuICAgIH1cbiAgICB2YXIgZnJhZyA9IHRoaXMuZmFjdG9yeS5jcmVhdGUoaG9zdCwgc2NvcGUsIHRoaXMuX2ZyYWcpO1xuICAgIGZyYWcuZm9ySWQgPSB0aGlzLmlkO1xuICAgIHRoaXMuY2FjaGVGcmFnKHZhbHVlLCBmcmFnLCBpbmRleCwga2V5KTtcbiAgICByZXR1cm4gZnJhZztcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSB2LXJlZiBvbiBvd25lciB2bS5cbiAgICovXG5cbiAgdXBkYXRlUmVmOiBmdW5jdGlvbiB1cGRhdGVSZWYoKSB7XG4gICAgdmFyIHJlZiA9IHRoaXMuZGVzY3JpcHRvci5yZWY7XG4gICAgaWYgKCFyZWYpIHJldHVybjtcbiAgICB2YXIgaGFzaCA9ICh0aGlzLl9zY29wZSB8fCB0aGlzLnZtKS4kcmVmcztcbiAgICB2YXIgcmVmcztcbiAgICBpZiAoIXRoaXMuZnJvbU9iamVjdCkge1xuICAgICAgcmVmcyA9IHRoaXMuZnJhZ3MubWFwKGZpbmRWbUZyb21GcmFnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVmcyA9IHt9O1xuICAgICAgdGhpcy5mcmFncy5mb3JFYWNoKGZ1bmN0aW9uIChmcmFnKSB7XG4gICAgICAgIHJlZnNbZnJhZy5zY29wZS4ka2V5XSA9IGZpbmRWbUZyb21GcmFnKGZyYWcpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGhhc2hbcmVmXSA9IHJlZnM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEZvciBvcHRpb24gbGlzdHMsIHVwZGF0ZSB0aGUgY29udGFpbmluZyB2LW1vZGVsIG9uXG4gICAqIHBhcmVudCA8c2VsZWN0Pi5cbiAgICovXG5cbiAgdXBkYXRlTW9kZWw6IGZ1bmN0aW9uIHVwZGF0ZU1vZGVsKCkge1xuICAgIGlmICh0aGlzLmlzT3B0aW9uKSB7XG4gICAgICB2YXIgcGFyZW50ID0gdGhpcy5zdGFydC5wYXJlbnROb2RlO1xuICAgICAgdmFyIG1vZGVsID0gcGFyZW50ICYmIHBhcmVudC5fX3ZfbW9kZWw7XG4gICAgICBpZiAobW9kZWwpIHtcbiAgICAgICAgbW9kZWwuZm9yY2VVcGRhdGUoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEluc2VydCBhIGZyYWdtZW50LiBIYW5kbGVzIHN0YWdnZXJpbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7RnJhZ21lbnR9IGZyYWdcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4XG4gICAqIEBwYXJhbSB7Tm9kZX0gcHJldkVsXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaW5Eb2N1bWVudFxuICAgKi9cblxuICBpbnNlcnQ6IGZ1bmN0aW9uIGluc2VydChmcmFnLCBpbmRleCwgcHJldkVsLCBpbkRvY3VtZW50KSB7XG4gICAgaWYgKGZyYWcuc3RhZ2dlckNiKSB7XG4gICAgICBmcmFnLnN0YWdnZXJDYi5jYW5jZWwoKTtcbiAgICAgIGZyYWcuc3RhZ2dlckNiID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIHN0YWdnZXJBbW91bnQgPSB0aGlzLmdldFN0YWdnZXIoZnJhZywgaW5kZXgsIG51bGwsICdlbnRlcicpO1xuICAgIGlmIChpbkRvY3VtZW50ICYmIHN0YWdnZXJBbW91bnQpIHtcbiAgICAgIC8vIGNyZWF0ZSBhbiBhbmNob3IgYW5kIGluc2VydCBpdCBzeW5jaHJvbm91c2x5LFxuICAgICAgLy8gc28gdGhhdCB3ZSBjYW4gcmVzb2x2ZSB0aGUgY29ycmVjdCBvcmRlciB3aXRob3V0XG4gICAgICAvLyB3b3JyeWluZyBhYm91dCBzb21lIGVsZW1lbnRzIG5vdCBpbnNlcnRlZCB5ZXRcbiAgICAgIHZhciBhbmNob3IgPSBmcmFnLnN0YWdnZXJBbmNob3I7XG4gICAgICBpZiAoIWFuY2hvcikge1xuICAgICAgICBhbmNob3IgPSBmcmFnLnN0YWdnZXJBbmNob3IgPSBjcmVhdGVBbmNob3IoJ3N0YWdnZXItYW5jaG9yJyk7XG4gICAgICAgIGFuY2hvci5fX3ZfZnJhZyA9IGZyYWc7XG4gICAgICB9XG4gICAgICBhZnRlcihhbmNob3IsIHByZXZFbCk7XG4gICAgICB2YXIgb3AgPSBmcmFnLnN0YWdnZXJDYiA9IGNhbmNlbGxhYmxlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnJhZy5zdGFnZ2VyQ2IgPSBudWxsO1xuICAgICAgICBmcmFnLmJlZm9yZShhbmNob3IpO1xuICAgICAgICByZW1vdmUoYW5jaG9yKTtcbiAgICAgIH0pO1xuICAgICAgc2V0VGltZW91dChvcCwgc3RhZ2dlckFtb3VudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZyYWcuYmVmb3JlKHByZXZFbC5uZXh0U2libGluZyk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBmcmFnbWVudC4gSGFuZGxlcyBzdGFnZ2VyaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge0ZyYWdtZW50fSBmcmFnXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleFxuICAgKiBAcGFyYW0ge051bWJlcn0gdG90YWxcbiAgICogQHBhcmFtIHtCb29sZWFufSBpbkRvY3VtZW50XG4gICAqL1xuXG4gIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlKGZyYWcsIGluZGV4LCB0b3RhbCwgaW5Eb2N1bWVudCkge1xuICAgIGlmIChmcmFnLnN0YWdnZXJDYikge1xuICAgICAgZnJhZy5zdGFnZ2VyQ2IuY2FuY2VsKCk7XG4gICAgICBmcmFnLnN0YWdnZXJDYiA9IG51bGw7XG4gICAgICAvLyBpdCdzIG5vdCBwb3NzaWJsZSBmb3IgdGhlIHNhbWUgZnJhZyB0byBiZSByZW1vdmVkXG4gICAgICAvLyB0d2ljZSwgc28gaWYgd2UgaGF2ZSBhIHBlbmRpbmcgc3RhZ2dlciBjYWxsYmFjayxcbiAgICAgIC8vIGl0IG1lYW5zIHRoaXMgZnJhZyBpcyBxdWV1ZWQgZm9yIGVudGVyIGJ1dCByZW1vdmVkXG4gICAgICAvLyBiZWZvcmUgaXRzIHRyYW5zaXRpb24gc3RhcnRlZC4gU2luY2UgaXQgaXMgYWxyZWFkeVxuICAgICAgLy8gZGVzdHJveWVkLCB3ZSBjYW4ganVzdCBsZWF2ZSBpdCBpbiBkZXRhY2hlZCBzdGF0ZS5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHN0YWdnZXJBbW91bnQgPSB0aGlzLmdldFN0YWdnZXIoZnJhZywgaW5kZXgsIHRvdGFsLCAnbGVhdmUnKTtcbiAgICBpZiAoaW5Eb2N1bWVudCAmJiBzdGFnZ2VyQW1vdW50KSB7XG4gICAgICB2YXIgb3AgPSBmcmFnLnN0YWdnZXJDYiA9IGNhbmNlbGxhYmxlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnJhZy5zdGFnZ2VyQ2IgPSBudWxsO1xuICAgICAgICBmcmFnLnJlbW92ZSgpO1xuICAgICAgfSk7XG4gICAgICBzZXRUaW1lb3V0KG9wLCBzdGFnZ2VyQW1vdW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZnJhZy5yZW1vdmUoKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIE1vdmUgYSBmcmFnbWVudCB0byBhIG5ldyBwb3NpdGlvbi5cbiAgICogRm9yY2Ugbm8gdHJhbnNpdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtGcmFnbWVudH0gZnJhZ1xuICAgKiBAcGFyYW0ge05vZGV9IHByZXZFbFxuICAgKi9cblxuICBtb3ZlOiBmdW5jdGlvbiBtb3ZlKGZyYWcsIHByZXZFbCkge1xuICAgIC8vIGZpeCBhIGNvbW1vbiBpc3N1ZSB3aXRoIFNvcnRhYmxlOlxuICAgIC8vIGlmIHByZXZFbCBkb2Vzbid0IGhhdmUgbmV4dFNpYmxpbmcsIHRoaXMgbWVhbnMgaXQnc1xuICAgIC8vIGJlZW4gZHJhZ2dlZCBhZnRlciB0aGUgZW5kIGFuY2hvci4gSnVzdCByZS1wb3NpdGlvblxuICAgIC8vIHRoZSBlbmQgYW5jaG9yIHRvIHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lci5cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICBpZiAoIXByZXZFbC5uZXh0U2libGluZykge1xuICAgICAgdGhpcy5lbmQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVuZCk7XG4gICAgfVxuICAgIGZyYWcuYmVmb3JlKHByZXZFbC5uZXh0U2libGluZywgZmFsc2UpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDYWNoZSBhIGZyYWdtZW50IHVzaW5nIHRyYWNrLWJ5IG9yIHRoZSBvYmplY3Qga2V5LlxuICAgKlxuICAgKiBAcGFyYW0geyp9IHZhbHVlXG4gICAqIEBwYXJhbSB7RnJhZ21lbnR9IGZyYWdcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBba2V5XVxuICAgKi9cblxuICBjYWNoZUZyYWc6IGZ1bmN0aW9uIGNhY2hlRnJhZyh2YWx1ZSwgZnJhZywgaW5kZXgsIGtleSkge1xuICAgIHZhciB0cmFja0J5S2V5ID0gdGhpcy5wYXJhbXMudHJhY2tCeTtcbiAgICB2YXIgY2FjaGUgPSB0aGlzLmNhY2hlO1xuICAgIHZhciBwcmltaXRpdmUgPSAhaXNPYmplY3QodmFsdWUpO1xuICAgIHZhciBpZDtcbiAgICBpZiAoa2V5IHx8IHRyYWNrQnlLZXkgfHwgcHJpbWl0aXZlKSB7XG4gICAgICBpZCA9IHRyYWNrQnlLZXkgPyB0cmFja0J5S2V5ID09PSAnJGluZGV4JyA/IGluZGV4IDogdmFsdWVbdHJhY2tCeUtleV0gOiBrZXkgfHwgdmFsdWU7XG4gICAgICBpZiAoIWNhY2hlW2lkXSkge1xuICAgICAgICBjYWNoZVtpZF0gPSBmcmFnO1xuICAgICAgfSBlbHNlIGlmICh0cmFja0J5S2V5ICE9PSAnJGluZGV4Jykge1xuICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHRoaXMud2FybkR1cGxpY2F0ZSh2YWx1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlkID0gdGhpcy5pZDtcbiAgICAgIGlmIChoYXNPd24odmFsdWUsIGlkKSkge1xuICAgICAgICBpZiAodmFsdWVbaWRdID09PSBudWxsKSB7XG4gICAgICAgICAgdmFsdWVbaWRdID0gZnJhZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHRoaXMud2FybkR1cGxpY2F0ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlZih2YWx1ZSwgaWQsIGZyYWcpO1xuICAgICAgfVxuICAgIH1cbiAgICBmcmFnLnJhdyA9IHZhbHVlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYSBjYWNoZWQgZnJhZ21lbnQgZnJvbSB0aGUgdmFsdWUvaW5kZXgva2V5XG4gICAqXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAgICogQHJldHVybiB7RnJhZ21lbnR9XG4gICAqL1xuXG4gIGdldENhY2hlZEZyYWc6IGZ1bmN0aW9uIGdldENhY2hlZEZyYWcodmFsdWUsIGluZGV4LCBrZXkpIHtcbiAgICB2YXIgdHJhY2tCeUtleSA9IHRoaXMucGFyYW1zLnRyYWNrQnk7XG4gICAgdmFyIHByaW1pdGl2ZSA9ICFpc09iamVjdCh2YWx1ZSk7XG4gICAgdmFyIGZyYWc7XG4gICAgaWYgKGtleSB8fCB0cmFja0J5S2V5IHx8IHByaW1pdGl2ZSkge1xuICAgICAgdmFyIGlkID0gdHJhY2tCeUtleSA/IHRyYWNrQnlLZXkgPT09ICckaW5kZXgnID8gaW5kZXggOiB2YWx1ZVt0cmFja0J5S2V5XSA6IGtleSB8fCB2YWx1ZTtcbiAgICAgIGZyYWcgPSB0aGlzLmNhY2hlW2lkXTtcbiAgICB9IGVsc2Uge1xuICAgICAgZnJhZyA9IHZhbHVlW3RoaXMuaWRdO1xuICAgIH1cbiAgICBpZiAoZnJhZyAmJiAoZnJhZy5yZXVzZWQgfHwgZnJhZy5mcmVzaCkpIHtcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgdGhpcy53YXJuRHVwbGljYXRlKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZyYWc7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIGZyYWdtZW50IGZyb20gY2FjaGUuXG4gICAqXG4gICAqIEBwYXJhbSB7RnJhZ21lbnR9IGZyYWdcbiAgICovXG5cbiAgZGVsZXRlQ2FjaGVkRnJhZzogZnVuY3Rpb24gZGVsZXRlQ2FjaGVkRnJhZyhmcmFnKSB7XG4gICAgdmFyIHZhbHVlID0gZnJhZy5yYXc7XG4gICAgdmFyIHRyYWNrQnlLZXkgPSB0aGlzLnBhcmFtcy50cmFja0J5O1xuICAgIHZhciBzY29wZSA9IGZyYWcuc2NvcGU7XG4gICAgdmFyIGluZGV4ID0gc2NvcGUuJGluZGV4O1xuICAgIC8vIGZpeCAjOTQ4OiBhdm9pZCBhY2NpZGVudGFsbHkgZmFsbCB0aHJvdWdoIHRvXG4gICAgLy8gYSBwYXJlbnQgcmVwZWF0ZXIgd2hpY2ggaGFwcGVucyB0byBoYXZlICRrZXkuXG4gICAgdmFyIGtleSA9IGhhc093bihzY29wZSwgJyRrZXknKSAmJiBzY29wZS4ka2V5O1xuICAgIHZhciBwcmltaXRpdmUgPSAhaXNPYmplY3QodmFsdWUpO1xuICAgIGlmICh0cmFja0J5S2V5IHx8IGtleSB8fCBwcmltaXRpdmUpIHtcbiAgICAgIHZhciBpZCA9IHRyYWNrQnlLZXkgPyB0cmFja0J5S2V5ID09PSAnJGluZGV4JyA/IGluZGV4IDogdmFsdWVbdHJhY2tCeUtleV0gOiBrZXkgfHwgdmFsdWU7XG4gICAgICB0aGlzLmNhY2hlW2lkXSA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlW3RoaXMuaWRdID0gbnVsbDtcbiAgICAgIGZyYWcucmF3ID0gbnVsbDtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgc3RhZ2dlciBhbW91bnQgZm9yIGFuIGluc2VydGlvbi9yZW1vdmFsLlxuICAgKlxuICAgKiBAcGFyYW0ge0ZyYWdtZW50fSBmcmFnXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleFxuICAgKiBAcGFyYW0ge051bWJlcn0gdG90YWxcbiAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAgICovXG5cbiAgZ2V0U3RhZ2dlcjogZnVuY3Rpb24gZ2V0U3RhZ2dlcihmcmFnLCBpbmRleCwgdG90YWwsIHR5cGUpIHtcbiAgICB0eXBlID0gdHlwZSArICdTdGFnZ2VyJztcbiAgICB2YXIgdHJhbnMgPSBmcmFnLm5vZGUuX192X3RyYW5zO1xuICAgIHZhciBob29rcyA9IHRyYW5zICYmIHRyYW5zLmhvb2tzO1xuICAgIHZhciBob29rID0gaG9va3MgJiYgKGhvb2tzW3R5cGVdIHx8IGhvb2tzLnN0YWdnZXIpO1xuICAgIHJldHVybiBob29rID8gaG9vay5jYWxsKGZyYWcsIGluZGV4LCB0b3RhbCkgOiBpbmRleCAqIHBhcnNlSW50KHRoaXMucGFyYW1zW3R5cGVdIHx8IHRoaXMucGFyYW1zLnN0YWdnZXIsIDEwKTtcbiAgfSxcblxuICAvKipcbiAgICogUHJlLXByb2Nlc3MgdGhlIHZhbHVlIGJlZm9yZSBwaXBpbmcgaXQgdGhyb3VnaCB0aGVcbiAgICogZmlsdGVycy4gVGhpcyBpcyBwYXNzZWQgdG8gYW5kIGNhbGxlZCBieSB0aGUgd2F0Y2hlci5cbiAgICovXG5cbiAgX3ByZVByb2Nlc3M6IGZ1bmN0aW9uIF9wcmVQcm9jZXNzKHZhbHVlKSB7XG4gICAgLy8gcmVnYXJkbGVzcyBvZiB0eXBlLCBzdG9yZSB0aGUgdW4tZmlsdGVyZWQgcmF3IHZhbHVlLlxuICAgIHRoaXMucmF3VmFsdWUgPSB2YWx1ZTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFBvc3QtcHJvY2VzcyB0aGUgdmFsdWUgYWZ0ZXIgaXQgaGFzIGJlZW4gcGlwZWQgdGhyb3VnaFxuICAgKiB0aGUgZmlsdGVycy4gVGhpcyBpcyBwYXNzZWQgdG8gYW5kIGNhbGxlZCBieSB0aGUgd2F0Y2hlci5cbiAgICpcbiAgICogSXQgaXMgbmVjZXNzYXJ5IGZvciB0aGlzIHRvIGJlIGNhbGxlZCBkdXJpbmcgdGhlXG4gICAqIHdhdGhjZXIncyBkZXBlbmRlbmN5IGNvbGxlY3Rpb24gcGhhc2UgYmVjYXVzZSB3ZSB3YW50XG4gICAqIHRoZSB2LWZvciB0byB1cGRhdGUgd2hlbiB0aGUgc291cmNlIE9iamVjdCBpcyBtdXRhdGVkLlxuICAgKi9cblxuICBfcG9zdFByb2Nlc3M6IGZ1bmN0aW9uIF9wb3N0UHJvY2Vzcyh2YWx1ZSkge1xuICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0gZWxzZSBpZiAoaXNQbGFpbk9iamVjdCh2YWx1ZSkpIHtcbiAgICAgIC8vIGNvbnZlcnQgcGxhaW4gb2JqZWN0IHRvIGFycmF5LlxuICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gICAgICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICAgICAgdmFyIHJlcyA9IG5ldyBBcnJheShpKTtcbiAgICAgIHZhciBrZXk7XG4gICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICAgIHJlc1tpXSA9IHtcbiAgICAgICAgICAka2V5OiBrZXksXG4gICAgICAgICAgJHZhbHVlOiB2YWx1ZVtrZXldXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiAhaXNOYU4odmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gcmFuZ2UodmFsdWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlIHx8IFtdO1xuICAgIH1cbiAgfSxcblxuICB1bmJpbmQ6IGZ1bmN0aW9uIHVuYmluZCgpIHtcbiAgICBpZiAodGhpcy5kZXNjcmlwdG9yLnJlZikge1xuICAgICAgKHRoaXMuX3Njb3BlIHx8IHRoaXMudm0pLiRyZWZzW3RoaXMuZGVzY3JpcHRvci5yZWZdID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMuZnJhZ3MpIHtcbiAgICAgIHZhciBpID0gdGhpcy5mcmFncy5sZW5ndGg7XG4gICAgICB2YXIgZnJhZztcbiAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgZnJhZyA9IHRoaXMuZnJhZ3NbaV07XG4gICAgICAgIHRoaXMuZGVsZXRlQ2FjaGVkRnJhZyhmcmFnKTtcbiAgICAgICAgZnJhZy5kZXN0cm95KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEhlbHBlciB0byBmaW5kIHRoZSBwcmV2aW91cyBlbGVtZW50IHRoYXQgaXMgYSBmcmFnbWVudFxuICogYW5jaG9yLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGEgZGVzdHJveWVkIGZyYWcnc1xuICogZWxlbWVudCBjb3VsZCBzdGlsbCBiZSBsaW5nZXJpbmcgaW4gdGhlIERPTSBiZWZvcmUgaXRzXG4gKiBsZWF2aW5nIHRyYW5zaXRpb24gZmluaXNoZXMsIGJ1dCBpdHMgaW5zZXJ0ZWQgZmxhZ1xuICogc2hvdWxkIGhhdmUgYmVlbiBzZXQgdG8gZmFsc2Ugc28gd2UgY2FuIHNraXAgdGhlbS5cbiAqXG4gKiBJZiB0aGlzIGlzIGEgYmxvY2sgcmVwZWF0LCB3ZSB3YW50IHRvIG1ha2Ugc3VyZSB3ZSBvbmx5XG4gKiByZXR1cm4gZnJhZyB0aGF0IGlzIGJvdW5kIHRvIHRoaXMgdi1mb3IuIChzZWUgIzkyOSlcbiAqXG4gKiBAcGFyYW0ge0ZyYWdtZW50fSBmcmFnXG4gKiBAcGFyYW0ge0NvbW1lbnR8VGV4dH0gYW5jaG9yXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRcbiAqIEByZXR1cm4ge0ZyYWdtZW50fVxuICovXG5cbmZ1bmN0aW9uIGZpbmRQcmV2RnJhZyhmcmFnLCBhbmNob3IsIGlkKSB7XG4gIHZhciBlbCA9IGZyYWcubm9kZS5wcmV2aW91c1NpYmxpbmc7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoIWVsKSByZXR1cm47XG4gIGZyYWcgPSBlbC5fX3ZfZnJhZztcbiAgd2hpbGUgKCghZnJhZyB8fCBmcmFnLmZvcklkICE9PSBpZCB8fCAhZnJhZy5pbnNlcnRlZCkgJiYgZWwgIT09IGFuY2hvcikge1xuICAgIGVsID0gZWwucHJldmlvdXNTaWJsaW5nO1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmICghZWwpIHJldHVybjtcbiAgICBmcmFnID0gZWwuX192X2ZyYWc7XG4gIH1cbiAgcmV0dXJuIGZyYWc7XG59XG5cbi8qKlxuICogRmluZCBhIHZtIGZyb20gYSBmcmFnbWVudC5cbiAqXG4gKiBAcGFyYW0ge0ZyYWdtZW50fSBmcmFnXG4gKiBAcmV0dXJuIHtWdWV8dW5kZWZpbmVkfVxuICovXG5cbmZ1bmN0aW9uIGZpbmRWbUZyb21GcmFnKGZyYWcpIHtcbiAgdmFyIG5vZGUgPSBmcmFnLm5vZGU7XG4gIC8vIGhhbmRsZSBtdWx0aS1ub2RlIGZyYWdcbiAgaWYgKGZyYWcuZW5kKSB7XG4gICAgd2hpbGUgKCFub2RlLl9fdnVlX18gJiYgbm9kZSAhPT0gZnJhZy5lbmQgJiYgbm9kZS5uZXh0U2libGluZykge1xuICAgICAgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgfVxuICB9XG4gIHJldHVybiBub2RlLl9fdnVlX187XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgcmFuZ2UgYXJyYXkgZnJvbSBnaXZlbiBudW1iZXIuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG5cbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5cbmZ1bmN0aW9uIHJhbmdlKG4pIHtcbiAgdmFyIGkgPSAtMTtcbiAgdmFyIHJldCA9IG5ldyBBcnJheShNYXRoLmZsb29yKG4pKTtcbiAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICByZXRbaV0gPSBpO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIHZGb3Iud2FybkR1cGxpY2F0ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHdhcm4oJ0R1cGxpY2F0ZSB2YWx1ZSBmb3VuZCBpbiB2LWZvcj1cIicgKyB0aGlzLmRlc2NyaXB0b3IucmF3ICsgJ1wiOiAnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpICsgJy4gVXNlIHRyYWNrLWJ5PVwiJGluZGV4XCIgaWYgJyArICd5b3UgYXJlIGV4cGVjdGluZyBkdXBsaWNhdGUgdmFsdWVzLicpO1xuICB9O1xufVxuXG52YXIgdklmID0ge1xuXG4gIHByaW9yaXR5OiBJRixcblxuICBiaW5kOiBmdW5jdGlvbiBiaW5kKCkge1xuICAgIHZhciBlbCA9IHRoaXMuZWw7XG4gICAgaWYgKCFlbC5fX3Z1ZV9fKSB7XG4gICAgICAvLyBjaGVjayBlbHNlIGJsb2NrXG4gICAgICB2YXIgbmV4dCA9IGVsLm5leHRFbGVtZW50U2libGluZztcbiAgICAgIGlmIChuZXh0ICYmIGdldEF0dHIobmV4dCwgJ3YtZWxzZScpICE9PSBudWxsKSB7XG4gICAgICAgIHJlbW92ZShuZXh0KTtcbiAgICAgICAgdGhpcy5lbHNlRmFjdG9yeSA9IG5ldyBGcmFnbWVudEZhY3RvcnkobmV4dC5fY29udGV4dCB8fCB0aGlzLnZtLCBuZXh0KTtcbiAgICAgIH1cbiAgICAgIC8vIGNoZWNrIG1haW4gYmxvY2tcbiAgICAgIHRoaXMuYW5jaG9yID0gY3JlYXRlQW5jaG9yKCd2LWlmJyk7XG4gICAgICByZXBsYWNlKGVsLCB0aGlzLmFuY2hvcik7XG4gICAgICB0aGlzLmZhY3RvcnkgPSBuZXcgRnJhZ21lbnRGYWN0b3J5KHRoaXMudm0sIGVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKCd2LWlmPVwiJyArIHRoaXMuZXhwcmVzc2lvbiArICdcIiBjYW5ub3QgYmUgJyArICd1c2VkIG9uIGFuIGluc3RhbmNlIHJvb3QgZWxlbWVudC4nKTtcbiAgICAgIHRoaXMuaW52YWxpZCA9IHRydWU7XG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuaW52YWxpZCkgcmV0dXJuO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKCF0aGlzLmZyYWcpIHtcbiAgICAgICAgdGhpcy5pbnNlcnQoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICB9XG4gIH0sXG5cbiAgaW5zZXJ0OiBmdW5jdGlvbiBpbnNlcnQoKSB7XG4gICAgaWYgKHRoaXMuZWxzZUZyYWcpIHtcbiAgICAgIHRoaXMuZWxzZUZyYWcucmVtb3ZlKCk7XG4gICAgICB0aGlzLmVsc2VGcmFnID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5mcmFnID0gdGhpcy5mYWN0b3J5LmNyZWF0ZSh0aGlzLl9ob3N0LCB0aGlzLl9zY29wZSwgdGhpcy5fZnJhZyk7XG4gICAgdGhpcy5mcmFnLmJlZm9yZSh0aGlzLmFuY2hvcik7XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgaWYgKHRoaXMuZnJhZykge1xuICAgICAgdGhpcy5mcmFnLnJlbW92ZSgpO1xuICAgICAgdGhpcy5mcmFnID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMuZWxzZUZhY3RvcnkgJiYgIXRoaXMuZWxzZUZyYWcpIHtcbiAgICAgIHRoaXMuZWxzZUZyYWcgPSB0aGlzLmVsc2VGYWN0b3J5LmNyZWF0ZSh0aGlzLl9ob3N0LCB0aGlzLl9zY29wZSwgdGhpcy5fZnJhZyk7XG4gICAgICB0aGlzLmVsc2VGcmFnLmJlZm9yZSh0aGlzLmFuY2hvcik7XG4gICAgfVxuICB9LFxuXG4gIHVuYmluZDogZnVuY3Rpb24gdW5iaW5kKCkge1xuICAgIGlmICh0aGlzLmZyYWcpIHtcbiAgICAgIHRoaXMuZnJhZy5kZXN0cm95KCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmVsc2VGcmFnKSB7XG4gICAgICB0aGlzLmVsc2VGcmFnLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cbn07XG5cbnZhciBzaG93ID0ge1xuXG4gIGJpbmQ6IGZ1bmN0aW9uIGJpbmQoKSB7XG4gICAgLy8gY2hlY2sgZWxzZSBibG9ja1xuICAgIHZhciBuZXh0ID0gdGhpcy5lbC5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgaWYgKG5leHQgJiYgZ2V0QXR0cihuZXh0LCAndi1lbHNlJykgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuZWxzZUVsID0gbmV4dDtcbiAgICB9XG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUodmFsdWUpIHtcbiAgICB0aGlzLmFwcGx5KHRoaXMuZWwsIHZhbHVlKTtcbiAgICBpZiAodGhpcy5lbHNlRWwpIHtcbiAgICAgIHRoaXMuYXBwbHkodGhpcy5lbHNlRWwsICF2YWx1ZSk7XG4gICAgfVxuICB9LFxuXG4gIGFwcGx5OiBmdW5jdGlvbiBhcHBseShlbCwgdmFsdWUpIHtcbiAgICBpZiAoaW5Eb2MoZWwpKSB7XG4gICAgICBhcHBseVRyYW5zaXRpb24oZWwsIHZhbHVlID8gMSA6IC0xLCB0b2dnbGUsIHRoaXMudm0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0b2dnbGUoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG9nZ2xlKCkge1xuICAgICAgZWwuc3R5bGUuZGlzcGxheSA9IHZhbHVlID8gJycgOiAnbm9uZSc7XG4gICAgfVxuICB9XG59O1xuXG52YXIgdGV4dCQyID0ge1xuXG4gIGJpbmQ6IGZ1bmN0aW9uIGJpbmQoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBlbCA9IHRoaXMuZWw7XG4gICAgdmFyIGlzUmFuZ2UgPSBlbC50eXBlID09PSAncmFuZ2UnO1xuICAgIHZhciBsYXp5ID0gdGhpcy5wYXJhbXMubGF6eTtcbiAgICB2YXIgbnVtYmVyID0gdGhpcy5wYXJhbXMubnVtYmVyO1xuICAgIHZhciBkZWJvdW5jZSA9IHRoaXMucGFyYW1zLmRlYm91bmNlO1xuXG4gICAgLy8gaGFuZGxlIGNvbXBvc2l0aW9uIGV2ZW50cy5cbiAgICAvLyAgIGh0dHA6Ly9ibG9nLmV2YW55b3UubWUvMjAxNC8wMS8wMy9jb21wb3NpdGlvbi1ldmVudC9cbiAgICAvLyBza2lwIHRoaXMgZm9yIEFuZHJvaWQgYmVjYXVzZSBpdCBoYW5kbGVzIGNvbXBvc2l0aW9uXG4gICAgLy8gZXZlbnRzIHF1aXRlIGRpZmZlcmVudGx5LiBBbmRyb2lkIGRvZXNuJ3QgdHJpZ2dlclxuICAgIC8vIGNvbXBvc2l0aW9uIGV2ZW50cyBmb3IgbGFuZ3VhZ2UgaW5wdXQgbWV0aG9kcyBlLmcuXG4gICAgLy8gQ2hpbmVzZSwgYnV0IGluc3RlYWQgdHJpZ2dlcnMgdGhlbSBmb3Igc3BlbGxpbmdcbiAgICAvLyBzdWdnZXN0aW9ucy4uLiAoc2VlIERpc2N1c3Npb24vIzE2MilcbiAgICB2YXIgY29tcG9zaW5nID0gZmFsc2U7XG4gICAgaWYgKCFpc0FuZHJvaWQgJiYgIWlzUmFuZ2UpIHtcbiAgICAgIHRoaXMub24oJ2NvbXBvc2l0aW9uc3RhcnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbXBvc2luZyA9IHRydWU7XG4gICAgICB9KTtcbiAgICAgIHRoaXMub24oJ2NvbXBvc2l0aW9uZW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb21wb3NpbmcgPSBmYWxzZTtcbiAgICAgICAgLy8gaW4gSUUxMSB0aGUgXCJjb21wb3NpdGlvbmVuZFwiIGV2ZW50IGZpcmVzIEFGVEVSXG4gICAgICAgIC8vIHRoZSBcImlucHV0XCIgZXZlbnQsIHNvIHRoZSBpbnB1dCBoYW5kbGVyIGlzIGJsb2NrZWRcbiAgICAgICAgLy8gYXQgdGhlIGVuZC4uLiBoYXZlIHRvIGNhbGwgaXQgaGVyZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gIzEzMjc6IGluIGxhenkgbW9kZSB0aGlzIGlzIHVuZWNlc3NhcnkuXG4gICAgICAgIGlmICghbGF6eSkge1xuICAgICAgICAgIHNlbGYubGlzdGVuZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gcHJldmVudCBtZXNzaW5nIHdpdGggdGhlIGlucHV0IHdoZW4gdXNlciBpcyB0eXBpbmcsXG4gICAgLy8gYW5kIGZvcmNlIHVwZGF0ZSBvbiBibHVyLlxuICAgIHRoaXMuZm9jdXNlZCA9IGZhbHNlO1xuICAgIGlmICghaXNSYW5nZSAmJiAhbGF6eSkge1xuICAgICAgdGhpcy5vbignZm9jdXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuZm9jdXNlZCA9IHRydWU7XG4gICAgICB9KTtcbiAgICAgIHRoaXMub24oJ2JsdXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuZm9jdXNlZCA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTm93IGF0dGFjaCB0aGUgbWFpbiBsaXN0ZW5lclxuICAgIHRoaXMubGlzdGVuZXIgPSB0aGlzLnJhd0xpc3RlbmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGNvbXBvc2luZyB8fCAhc2VsZi5fYm91bmQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIHZhbCA9IG51bWJlciB8fCBpc1JhbmdlID8gdG9OdW1iZXIoZWwudmFsdWUpIDogZWwudmFsdWU7XG4gICAgICBzZWxmLnNldCh2YWwpO1xuICAgICAgLy8gZm9yY2UgdXBkYXRlIG9uIG5leHQgdGljayB0byBhdm9pZCBsb2NrICYgc2FtZSB2YWx1ZVxuICAgICAgLy8gYWxzbyBvbmx5IHVwZGF0ZSB3aGVuIHVzZXIgaXMgbm90IHR5cGluZ1xuICAgICAgbmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2VsZi5fYm91bmQgJiYgIXNlbGYuZm9jdXNlZCkge1xuICAgICAgICAgIHNlbGYudXBkYXRlKHNlbGYuX3dhdGNoZXIudmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gYXBwbHkgZGVib3VuY2VcbiAgICBpZiAoZGVib3VuY2UpIHtcbiAgICAgIHRoaXMubGlzdGVuZXIgPSBfZGVib3VuY2UodGhpcy5saXN0ZW5lciwgZGVib3VuY2UpO1xuICAgIH1cblxuICAgIC8vIFN1cHBvcnQgalF1ZXJ5IGV2ZW50cywgc2luY2UgalF1ZXJ5LnRyaWdnZXIoKSBkb2Vzbid0XG4gICAgLy8gdHJpZ2dlciBuYXRpdmUgZXZlbnRzIGluIHNvbWUgY2FzZXMgYW5kIHNvbWUgcGx1Z2luc1xuICAgIC8vIHJlbHkgb24gJC50cmlnZ2VyKClcbiAgICAvL1xuICAgIC8vIFdlIHdhbnQgdG8gbWFrZSBzdXJlIGlmIGEgbGlzdGVuZXIgaXMgYXR0YWNoZWQgdXNpbmdcbiAgICAvLyBqUXVlcnksIGl0IGlzIGFsc28gcmVtb3ZlZCB3aXRoIGpRdWVyeSwgdGhhdCdzIHdoeVxuICAgIC8vIHdlIGRvIHRoZSBjaGVjayBmb3IgZWFjaCBkaXJlY3RpdmUgaW5zdGFuY2UgYW5kXG4gICAgLy8gc3RvcmUgdGhhdCBjaGVjayByZXN1bHQgb24gaXRzZWxmLiBUaGlzIGFsc28gYWxsb3dzXG4gICAgLy8gZWFzaWVyIHRlc3QgY292ZXJhZ2UgY29udHJvbCBieSB1bnNldHRpbmcgdGhlIGdsb2JhbFxuICAgIC8vIGpRdWVyeSB2YXJpYWJsZSBpbiB0ZXN0cy5cbiAgICB0aGlzLmhhc2pRdWVyeSA9IHR5cGVvZiBqUXVlcnkgPT09ICdmdW5jdGlvbic7XG4gICAgaWYgKHRoaXMuaGFzalF1ZXJ5KSB7XG4gICAgICB2YXIgbWV0aG9kID0galF1ZXJ5LmZuLm9uID8gJ29uJyA6ICdiaW5kJztcbiAgICAgIGpRdWVyeShlbClbbWV0aG9kXSgnY2hhbmdlJywgdGhpcy5yYXdMaXN0ZW5lcik7XG4gICAgICBpZiAoIWxhenkpIHtcbiAgICAgICAgalF1ZXJ5KGVsKVttZXRob2RdKCdpbnB1dCcsIHRoaXMubGlzdGVuZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9uKCdjaGFuZ2UnLCB0aGlzLnJhd0xpc3RlbmVyKTtcbiAgICAgIGlmICghbGF6eSkge1xuICAgICAgICB0aGlzLm9uKCdpbnB1dCcsIHRoaXMubGlzdGVuZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElFOSBkb2Vzbid0IGZpcmUgaW5wdXQgZXZlbnQgb24gYmFja3NwYWNlL2RlbC9jdXRcbiAgICBpZiAoIWxhenkgJiYgaXNJRTkpIHtcbiAgICAgIHRoaXMub24oJ2N1dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbmV4dFRpY2soc2VsZi5saXN0ZW5lcik7XG4gICAgICB9KTtcbiAgICAgIHRoaXMub24oJ2tleXVwJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gNDYgfHwgZS5rZXlDb2RlID09PSA4KSB7XG4gICAgICAgICAgc2VsZi5saXN0ZW5lcigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBzZXQgaW5pdGlhbCB2YWx1ZSBpZiBwcmVzZW50XG4gICAgaWYgKGVsLmhhc0F0dHJpYnV0ZSgndmFsdWUnKSB8fCBlbC50YWdOYW1lID09PSAnVEVYVEFSRUEnICYmIGVsLnZhbHVlLnRyaW0oKSkge1xuICAgICAgdGhpcy5hZnRlckJpbmQgPSB0aGlzLmxpc3RlbmVyO1xuICAgIH1cbiAgfSxcblxuICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZSh2YWx1ZSkge1xuICAgIHRoaXMuZWwudmFsdWUgPSBfdG9TdHJpbmcodmFsdWUpO1xuICB9LFxuXG4gIHVuYmluZDogZnVuY3Rpb24gdW5iaW5kKCkge1xuICAgIHZhciBlbCA9IHRoaXMuZWw7XG4gICAgaWYgKHRoaXMuaGFzalF1ZXJ5KSB7XG4gICAgICB2YXIgbWV0aG9kID0galF1ZXJ5LmZuLm9mZiA/ICdvZmYnIDogJ3VuYmluZCc7XG4gICAgICBqUXVlcnkoZWwpW21ldGhvZF0oJ2NoYW5nZScsIHRoaXMubGlzdGVuZXIpO1xuICAgICAgalF1ZXJ5KGVsKVttZXRob2RdKCdpbnB1dCcsIHRoaXMubGlzdGVuZXIpO1xuICAgIH1cbiAgfVxufTtcblxudmFyIHJhZGlvID0ge1xuXG4gIGJpbmQ6IGZ1bmN0aW9uIGJpbmQoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBlbCA9IHRoaXMuZWw7XG5cbiAgICB0aGlzLmdldFZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgLy8gdmFsdWUgb3ZlcndyaXRlIHZpYSB2LWJpbmQ6dmFsdWVcbiAgICAgIGlmIChlbC5oYXNPd25Qcm9wZXJ0eSgnX3ZhbHVlJykpIHtcbiAgICAgICAgcmV0dXJuIGVsLl92YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciB2YWwgPSBlbC52YWx1ZTtcbiAgICAgIGlmIChzZWxmLnBhcmFtcy5udW1iZXIpIHtcbiAgICAgICAgdmFsID0gdG9OdW1iZXIodmFsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWw7XG4gICAgfTtcblxuICAgIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLnNldChzZWxmLmdldFZhbHVlKCkpO1xuICAgIH07XG4gICAgdGhpcy5vbignY2hhbmdlJywgdGhpcy5saXN0ZW5lcik7XG5cbiAgICBpZiAoZWwuaGFzQXR0cmlidXRlKCdjaGVja2VkJykpIHtcbiAgICAgIHRoaXMuYWZ0ZXJCaW5kID0gdGhpcy5saXN0ZW5lcjtcbiAgICB9XG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUodmFsdWUpIHtcbiAgICB0aGlzLmVsLmNoZWNrZWQgPSBsb29zZUVxdWFsKHZhbHVlLCB0aGlzLmdldFZhbHVlKCkpO1xuICB9XG59O1xuXG52YXIgc2VsZWN0ID0ge1xuXG4gIGJpbmQ6IGZ1bmN0aW9uIGJpbmQoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBlbCA9IHRoaXMuZWw7XG5cbiAgICAvLyBtZXRob2QgdG8gZm9yY2UgdXBkYXRlIERPTSB1c2luZyBsYXRlc3QgdmFsdWUuXG4gICAgdGhpcy5mb3JjZVVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChzZWxmLl93YXRjaGVyKSB7XG4gICAgICAgIHNlbGYudXBkYXRlKHNlbGYuX3dhdGNoZXIuZ2V0KCkpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBjaGVjayBpZiB0aGlzIGlzIGEgbXVsdGlwbGUgc2VsZWN0XG4gICAgdmFyIG11bHRpcGxlID0gdGhpcy5tdWx0aXBsZSA9IGVsLmhhc0F0dHJpYnV0ZSgnbXVsdGlwbGUnKTtcblxuICAgIC8vIGF0dGFjaCBsaXN0ZW5lclxuICAgIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgdmFsdWUgPSBnZXRWYWx1ZShlbCwgbXVsdGlwbGUpO1xuICAgICAgdmFsdWUgPSBzZWxmLnBhcmFtcy5udW1iZXIgPyBpc0FycmF5KHZhbHVlKSA/IHZhbHVlLm1hcCh0b051bWJlcikgOiB0b051bWJlcih2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgIHNlbGYuc2V0KHZhbHVlKTtcbiAgICB9O1xuICAgIHRoaXMub24oJ2NoYW5nZScsIHRoaXMubGlzdGVuZXIpO1xuXG4gICAgLy8gaWYgaGFzIGluaXRpYWwgdmFsdWUsIHNldCBhZnRlckJpbmRcbiAgICB2YXIgaW5pdFZhbHVlID0gZ2V0VmFsdWUoZWwsIG11bHRpcGxlLCB0cnVlKTtcbiAgICBpZiAobXVsdGlwbGUgJiYgaW5pdFZhbHVlLmxlbmd0aCB8fCAhbXVsdGlwbGUgJiYgaW5pdFZhbHVlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmFmdGVyQmluZCA9IHRoaXMubGlzdGVuZXI7XG4gICAgfVxuXG4gICAgLy8gQWxsIG1ham9yIGJyb3dzZXJzIGV4Y2VwdCBGaXJlZm94IHJlc2V0c1xuICAgIC8vIHNlbGVjdGVkSW5kZXggd2l0aCB2YWx1ZSAtMSB0byAwIHdoZW4gdGhlIGVsZW1lbnRcbiAgICAvLyBpcyBhcHBlbmRlZCB0byBhIG5ldyBwYXJlbnQsIHRoZXJlZm9yZSB3ZSBoYXZlIHRvXG4gICAgLy8gZm9yY2UgYSBET00gdXBkYXRlIHdoZW5ldmVyIHRoYXQgaGFwcGVucy4uLlxuICAgIHRoaXMudm0uJG9uKCdob29rOmF0dGFjaGVkJywgdGhpcy5mb3JjZVVwZGF0ZSk7XG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUodmFsdWUpIHtcbiAgICB2YXIgZWwgPSB0aGlzLmVsO1xuICAgIGVsLnNlbGVjdGVkSW5kZXggPSAtMTtcbiAgICB2YXIgbXVsdGkgPSB0aGlzLm11bHRpcGxlICYmIGlzQXJyYXkodmFsdWUpO1xuICAgIHZhciBvcHRpb25zID0gZWwub3B0aW9ucztcbiAgICB2YXIgaSA9IG9wdGlvbnMubGVuZ3RoO1xuICAgIHZhciBvcCwgdmFsO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIG9wID0gb3B0aW9uc1tpXTtcbiAgICAgIHZhbCA9IG9wLmhhc093blByb3BlcnR5KCdfdmFsdWUnKSA/IG9wLl92YWx1ZSA6IG9wLnZhbHVlO1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgZXFlcWVxICovXG4gICAgICBvcC5zZWxlY3RlZCA9IG11bHRpID8gaW5kZXhPZiQxKHZhbHVlLCB2YWwpID4gLTEgOiBsb29zZUVxdWFsKHZhbHVlLCB2YWwpO1xuICAgICAgLyogZXNsaW50LWVuYWJsZSBlcWVxZXEgKi9cbiAgICB9XG4gIH0sXG5cbiAgdW5iaW5kOiBmdW5jdGlvbiB1bmJpbmQoKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICB0aGlzLnZtLiRvZmYoJ2hvb2s6YXR0YWNoZWQnLCB0aGlzLmZvcmNlVXBkYXRlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgc2VsZWN0IHZhbHVlXG4gKlxuICogQHBhcmFtIHtTZWxlY3RFbGVtZW50fSBlbFxuICogQHBhcmFtIHtCb29sZWFufSBtdWx0aVxuICogQHBhcmFtIHtCb29sZWFufSBpbml0XG4gKiBAcmV0dXJuIHtBcnJheXwqfVxuICovXG5cbmZ1bmN0aW9uIGdldFZhbHVlKGVsLCBtdWx0aSwgaW5pdCkge1xuICB2YXIgcmVzID0gbXVsdGkgPyBbXSA6IG51bGw7XG4gIHZhciBvcCwgdmFsLCBzZWxlY3RlZDtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBlbC5vcHRpb25zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIG9wID0gZWwub3B0aW9uc1tpXTtcbiAgICBzZWxlY3RlZCA9IGluaXQgPyBvcC5oYXNBdHRyaWJ1dGUoJ3NlbGVjdGVkJykgOiBvcC5zZWxlY3RlZDtcbiAgICBpZiAoc2VsZWN0ZWQpIHtcbiAgICAgIHZhbCA9IG9wLmhhc093blByb3BlcnR5KCdfdmFsdWUnKSA/IG9wLl92YWx1ZSA6IG9wLnZhbHVlO1xuICAgICAgaWYgKG11bHRpKSB7XG4gICAgICAgIHJlcy5wdXNoKHZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIE5hdGl2ZSBBcnJheS5pbmRleE9mIHVzZXMgc3RyaWN0IGVxdWFsLCBidXQgaW4gdGhpc1xuICogY2FzZSB3ZSBuZWVkIHRvIG1hdGNoIHN0cmluZy9udW1iZXJzIHdpdGggY3VzdG9tIGVxdWFsLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyclxuICogQHBhcmFtIHsqfSB2YWxcbiAqL1xuXG5mdW5jdGlvbiBpbmRleE9mJDEoYXJyLCB2YWwpIHtcbiAgdmFyIGkgPSBhcnIubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgaWYgKGxvb3NlRXF1YWwoYXJyW2ldLCB2YWwpKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG52YXIgY2hlY2tib3ggPSB7XG5cbiAgYmluZDogZnVuY3Rpb24gYmluZCgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGVsID0gdGhpcy5lbDtcblxuICAgIHRoaXMuZ2V0VmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZWwuaGFzT3duUHJvcGVydHkoJ192YWx1ZScpID8gZWwuX3ZhbHVlIDogc2VsZi5wYXJhbXMubnVtYmVyID8gdG9OdW1iZXIoZWwudmFsdWUpIDogZWwudmFsdWU7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGdldEJvb2xlYW5WYWx1ZSgpIHtcbiAgICAgIHZhciB2YWwgPSBlbC5jaGVja2VkO1xuICAgICAgaWYgKHZhbCAmJiBlbC5oYXNPd25Qcm9wZXJ0eSgnX3RydWVWYWx1ZScpKSB7XG4gICAgICAgIHJldHVybiBlbC5fdHJ1ZVZhbHVlO1xuICAgICAgfVxuICAgICAgaWYgKCF2YWwgJiYgZWwuaGFzT3duUHJvcGVydHkoJ19mYWxzZVZhbHVlJykpIHtcbiAgICAgICAgcmV0dXJuIGVsLl9mYWxzZVZhbHVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG1vZGVsID0gc2VsZi5fd2F0Y2hlci52YWx1ZTtcbiAgICAgIGlmIChpc0FycmF5KG1vZGVsKSkge1xuICAgICAgICB2YXIgdmFsID0gc2VsZi5nZXRWYWx1ZSgpO1xuICAgICAgICBpZiAoZWwuY2hlY2tlZCkge1xuICAgICAgICAgIGlmIChpbmRleE9mKG1vZGVsLCB2YWwpIDwgMCkge1xuICAgICAgICAgICAgbW9kZWwucHVzaCh2YWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtb2RlbC4kcmVtb3ZlKHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYuc2V0KGdldEJvb2xlYW5WYWx1ZSgpKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5vbignY2hhbmdlJywgdGhpcy5saXN0ZW5lcik7XG4gICAgaWYgKGVsLmhhc0F0dHJpYnV0ZSgnY2hlY2tlZCcpKSB7XG4gICAgICB0aGlzLmFmdGVyQmluZCA9IHRoaXMubGlzdGVuZXI7XG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKHZhbHVlKSB7XG4gICAgdmFyIGVsID0gdGhpcy5lbDtcbiAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGVsLmNoZWNrZWQgPSBpbmRleE9mKHZhbHVlLCB0aGlzLmdldFZhbHVlKCkpID4gLTE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChlbC5oYXNPd25Qcm9wZXJ0eSgnX3RydWVWYWx1ZScpKSB7XG4gICAgICAgIGVsLmNoZWNrZWQgPSBsb29zZUVxdWFsKHZhbHVlLCBlbC5fdHJ1ZVZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLmNoZWNrZWQgPSAhIXZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxudmFyIGhhbmRsZXJzID0ge1xuICB0ZXh0OiB0ZXh0JDIsXG4gIHJhZGlvOiByYWRpbyxcbiAgc2VsZWN0OiBzZWxlY3QsXG4gIGNoZWNrYm94OiBjaGVja2JveFxufTtcblxudmFyIG1vZGVsID0ge1xuXG4gIHByaW9yaXR5OiBNT0RFTCxcbiAgdHdvV2F5OiB0cnVlLFxuICBoYW5kbGVyczogaGFuZGxlcnMsXG4gIHBhcmFtczogWydsYXp5JywgJ251bWJlcicsICdkZWJvdW5jZSddLFxuXG4gIC8qKlxuICAgKiBQb3NzaWJsZSBlbGVtZW50czpcbiAgICogICA8c2VsZWN0PlxuICAgKiAgIDx0ZXh0YXJlYT5cbiAgICogICA8aW5wdXQgdHlwZT1cIipcIj5cbiAgICogICAgIC0gdGV4dFxuICAgKiAgICAgLSBjaGVja2JveFxuICAgKiAgICAgLSByYWRpb1xuICAgKiAgICAgLSBudW1iZXJcbiAgICovXG5cbiAgYmluZDogZnVuY3Rpb24gYmluZCgpIHtcbiAgICAvLyBmcmllbmRseSB3YXJuaW5nLi4uXG4gICAgdGhpcy5jaGVja0ZpbHRlcnMoKTtcbiAgICBpZiAodGhpcy5oYXNSZWFkICYmICF0aGlzLmhhc1dyaXRlKSB7XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ0l0IHNlZW1zIHlvdSBhcmUgdXNpbmcgYSByZWFkLW9ubHkgZmlsdGVyIHdpdGggJyArICd2LW1vZGVsLiBZb3UgbWlnaHQgd2FudCB0byB1c2UgYSB0d28td2F5IGZpbHRlciAnICsgJ3RvIGVuc3VyZSBjb3JyZWN0IGJlaGF2aW9yLicpO1xuICAgIH1cbiAgICB2YXIgZWwgPSB0aGlzLmVsO1xuICAgIHZhciB0YWcgPSBlbC50YWdOYW1lO1xuICAgIHZhciBoYW5kbGVyO1xuICAgIGlmICh0YWcgPT09ICdJTlBVVCcpIHtcbiAgICAgIGhhbmRsZXIgPSBoYW5kbGVyc1tlbC50eXBlXSB8fCBoYW5kbGVycy50ZXh0O1xuICAgIH0gZWxzZSBpZiAodGFnID09PSAnU0VMRUNUJykge1xuICAgICAgaGFuZGxlciA9IGhhbmRsZXJzLnNlbGVjdDtcbiAgICB9IGVsc2UgaWYgKHRhZyA9PT0gJ1RFWFRBUkVBJykge1xuICAgICAgaGFuZGxlciA9IGhhbmRsZXJzLnRleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2Fybigndi1tb2RlbCBkb2VzIG5vdCBzdXBwb3J0IGVsZW1lbnQgdHlwZTogJyArIHRhZyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGVsLl9fdl9tb2RlbCA9IHRoaXM7XG4gICAgaGFuZGxlci5iaW5kLmNhbGwodGhpcyk7XG4gICAgdGhpcy51cGRhdGUgPSBoYW5kbGVyLnVwZGF0ZTtcbiAgICB0aGlzLl91bmJpbmQgPSBoYW5kbGVyLnVuYmluZDtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2sgcmVhZC93cml0ZSBmaWx0ZXIgc3RhdHMuXG4gICAqL1xuXG4gIGNoZWNrRmlsdGVyczogZnVuY3Rpb24gY2hlY2tGaWx0ZXJzKCkge1xuICAgIHZhciBmaWx0ZXJzID0gdGhpcy5maWx0ZXJzO1xuICAgIGlmICghZmlsdGVycykgcmV0dXJuO1xuICAgIHZhciBpID0gZmlsdGVycy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgdmFyIGZpbHRlciA9IHJlc29sdmVBc3NldCh0aGlzLnZtLiRvcHRpb25zLCAnZmlsdGVycycsIGZpbHRlcnNbaV0ubmFtZSk7XG4gICAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ2Z1bmN0aW9uJyB8fCBmaWx0ZXIucmVhZCkge1xuICAgICAgICB0aGlzLmhhc1JlYWQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKGZpbHRlci53cml0ZSkge1xuICAgICAgICB0aGlzLmhhc1dyaXRlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgdW5iaW5kOiBmdW5jdGlvbiB1bmJpbmQoKSB7XG4gICAgdGhpcy5lbC5fX3ZfbW9kZWwgPSBudWxsO1xuICAgIHRoaXMuX3VuYmluZCAmJiB0aGlzLl91bmJpbmQoKTtcbiAgfVxufTtcblxuLy8ga2V5Q29kZSBhbGlhc2VzXG52YXIga2V5Q29kZXMgPSB7XG4gIGVzYzogMjcsXG4gIHRhYjogOSxcbiAgZW50ZXI6IDEzLFxuICBzcGFjZTogMzIsXG4gICdkZWxldGUnOiBbOCwgNDZdLFxuICB1cDogMzgsXG4gIGxlZnQ6IDM3LFxuICByaWdodDogMzksXG4gIGRvd246IDQwXG59O1xuXG5mdW5jdGlvbiBrZXlGaWx0ZXIoaGFuZGxlciwga2V5cykge1xuICB2YXIgY29kZXMgPSBrZXlzLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgdmFyIGNoYXJDb2RlID0ga2V5LmNoYXJDb2RlQXQoMCk7XG4gICAgaWYgKGNoYXJDb2RlID4gNDcgJiYgY2hhckNvZGUgPCA1OCkge1xuICAgICAgcmV0dXJuIHBhcnNlSW50KGtleSwgMTApO1xuICAgIH1cbiAgICBpZiAoa2V5Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgY2hhckNvZGUgPSBrZXkudG9VcHBlckNhc2UoKS5jaGFyQ29kZUF0KDApO1xuICAgICAgaWYgKGNoYXJDb2RlID4gNjQgJiYgY2hhckNvZGUgPCA5MSkge1xuICAgICAgICByZXR1cm4gY2hhckNvZGU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBrZXlDb2Rlc1trZXldO1xuICB9KTtcbiAgY29kZXMgPSBbXS5jb25jYXQuYXBwbHkoW10sIGNvZGVzKTtcbiAgcmV0dXJuIGZ1bmN0aW9uIGtleUhhbmRsZXIoZSkge1xuICAgIGlmIChjb2Rlcy5pbmRleE9mKGUua2V5Q29kZSkgPiAtMSkge1xuICAgICAgcmV0dXJuIGhhbmRsZXIuY2FsbCh0aGlzLCBlKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHN0b3BGaWx0ZXIoaGFuZGxlcikge1xuICByZXR1cm4gZnVuY3Rpb24gc3RvcEhhbmRsZXIoZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgcmV0dXJuIGhhbmRsZXIuY2FsbCh0aGlzLCBlKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcHJldmVudEZpbHRlcihoYW5kbGVyKSB7XG4gIHJldHVybiBmdW5jdGlvbiBwcmV2ZW50SGFuZGxlcihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHJldHVybiBoYW5kbGVyLmNhbGwodGhpcywgZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHNlbGZGaWx0ZXIoaGFuZGxlcikge1xuICByZXR1cm4gZnVuY3Rpb24gc2VsZkhhbmRsZXIoZSkge1xuICAgIGlmIChlLnRhcmdldCA9PT0gZS5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICByZXR1cm4gaGFuZGxlci5jYWxsKHRoaXMsIGUpO1xuICAgIH1cbiAgfTtcbn1cblxudmFyIG9uJDEgPSB7XG5cbiAgcHJpb3JpdHk6IE9OLFxuICBhY2NlcHRTdGF0ZW1lbnQ6IHRydWUsXG4gIGtleUNvZGVzOiBrZXlDb2RlcyxcblxuICBiaW5kOiBmdW5jdGlvbiBiaW5kKCkge1xuICAgIC8vIGRlYWwgd2l0aCBpZnJhbWVzXG4gICAgaWYgKHRoaXMuZWwudGFnTmFtZSA9PT0gJ0lGUkFNRScgJiYgdGhpcy5hcmcgIT09ICdsb2FkJykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdGhpcy5pZnJhbWVCaW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBvbihzZWxmLmVsLmNvbnRlbnRXaW5kb3csIHNlbGYuYXJnLCBzZWxmLmhhbmRsZXIsIHNlbGYubW9kaWZpZXJzLmNhcHR1cmUpO1xuICAgICAgfTtcbiAgICAgIHRoaXMub24oJ2xvYWQnLCB0aGlzLmlmcmFtZUJpbmQpO1xuICAgIH1cbiAgfSxcblxuICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZShoYW5kbGVyKSB7XG4gICAgLy8gc3R1YiBhIG5vb3AgZm9yIHYtb24gd2l0aCBubyB2YWx1ZSxcbiAgICAvLyBlLmcuIEBtb3VzZWRvd24ucHJldmVudFxuICAgIGlmICghdGhpcy5kZXNjcmlwdG9yLnJhdykge1xuICAgICAgaGFuZGxlciA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgaGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKCd2LW9uOicgKyB0aGlzLmFyZyArICc9XCInICsgdGhpcy5leHByZXNzaW9uICsgJ1wiIGV4cGVjdHMgYSBmdW5jdGlvbiB2YWx1ZSwgJyArICdnb3QgJyArIGhhbmRsZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IG1vZGlmaWVyc1xuICAgIGlmICh0aGlzLm1vZGlmaWVycy5zdG9wKSB7XG4gICAgICBoYW5kbGVyID0gc3RvcEZpbHRlcihoYW5kbGVyKTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW9kaWZpZXJzLnByZXZlbnQpIHtcbiAgICAgIGhhbmRsZXIgPSBwcmV2ZW50RmlsdGVyKGhhbmRsZXIpO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb2RpZmllcnMuc2VsZikge1xuICAgICAgaGFuZGxlciA9IHNlbGZGaWx0ZXIoaGFuZGxlcik7XG4gICAgfVxuICAgIC8vIGtleSBmaWx0ZXJcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMubW9kaWZpZXJzKS5maWx0ZXIoZnVuY3Rpb24gKGtleSkge1xuICAgICAgcmV0dXJuIGtleSAhPT0gJ3N0b3AnICYmIGtleSAhPT0gJ3ByZXZlbnQnO1xuICAgIH0pO1xuICAgIGlmIChrZXlzLmxlbmd0aCkge1xuICAgICAgaGFuZGxlciA9IGtleUZpbHRlcihoYW5kbGVyLCBrZXlzKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlc2V0KCk7XG4gICAgdGhpcy5oYW5kbGVyID0gaGFuZGxlcjtcblxuICAgIGlmICh0aGlzLmlmcmFtZUJpbmQpIHtcbiAgICAgIHRoaXMuaWZyYW1lQmluZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvbih0aGlzLmVsLCB0aGlzLmFyZywgdGhpcy5oYW5kbGVyLCB0aGlzLm1vZGlmaWVycy5jYXB0dXJlKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIHZhciBlbCA9IHRoaXMuaWZyYW1lQmluZCA/IHRoaXMuZWwuY29udGVudFdpbmRvdyA6IHRoaXMuZWw7XG4gICAgaWYgKHRoaXMuaGFuZGxlcikge1xuICAgICAgb2ZmKGVsLCB0aGlzLmFyZywgdGhpcy5oYW5kbGVyKTtcbiAgICB9XG4gIH0sXG5cbiAgdW5iaW5kOiBmdW5jdGlvbiB1bmJpbmQoKSB7XG4gICAgdGhpcy5yZXNldCgpO1xuICB9XG59O1xuXG52YXIgcHJlZml4ZXMgPSBbJy13ZWJraXQtJywgJy1tb3otJywgJy1tcy0nXTtcbnZhciBjYW1lbFByZWZpeGVzID0gWydXZWJraXQnLCAnTW96JywgJ21zJ107XG52YXIgaW1wb3J0YW50UkUgPSAvIWltcG9ydGFudDs/JC87XG52YXIgcHJvcENhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxudmFyIHRlc3RFbCA9IG51bGw7XG5cbnZhciBzdHlsZSA9IHtcblxuICBkZWVwOiB0cnVlLFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMuZWwuc3R5bGUuY3NzVGV4dCA9IHZhbHVlO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuaGFuZGxlT2JqZWN0KHZhbHVlLnJlZHVjZShleHRlbmQsIHt9KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaGFuZGxlT2JqZWN0KHZhbHVlIHx8IHt9KTtcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlT2JqZWN0OiBmdW5jdGlvbiBoYW5kbGVPYmplY3QodmFsdWUpIHtcbiAgICAvLyBjYWNoZSBvYmplY3Qgc3R5bGVzIHNvIHRoYXQgb25seSBjaGFuZ2VkIHByb3BzXG4gICAgLy8gYXJlIGFjdHVhbGx5IHVwZGF0ZWQuXG4gICAgdmFyIGNhY2hlID0gdGhpcy5jYWNoZSB8fCAodGhpcy5jYWNoZSA9IHt9KTtcbiAgICB2YXIgbmFtZSwgdmFsO1xuICAgIGZvciAobmFtZSBpbiBjYWNoZSkge1xuICAgICAgaWYgKCEobmFtZSBpbiB2YWx1ZSkpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVTaW5nbGUobmFtZSwgbnVsbCk7XG4gICAgICAgIGRlbGV0ZSBjYWNoZVtuYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChuYW1lIGluIHZhbHVlKSB7XG4gICAgICB2YWwgPSB2YWx1ZVtuYW1lXTtcbiAgICAgIGlmICh2YWwgIT09IGNhY2hlW25hbWVdKSB7XG4gICAgICAgIGNhY2hlW25hbWVdID0gdmFsO1xuICAgICAgICB0aGlzLmhhbmRsZVNpbmdsZShuYW1lLCB2YWwpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBoYW5kbGVTaW5nbGU6IGZ1bmN0aW9uIGhhbmRsZVNpbmdsZShwcm9wLCB2YWx1ZSkge1xuICAgIHByb3AgPSBub3JtYWxpemUocHJvcCk7XG4gICAgaWYgKCFwcm9wKSByZXR1cm47IC8vIHVuc3VwcG9ydGVkIHByb3BcbiAgICAvLyBjYXN0IHBvc3NpYmxlIG51bWJlcnMvYm9vbGVhbnMgaW50byBzdHJpbmdzXG4gICAgaWYgKHZhbHVlICE9IG51bGwpIHZhbHVlICs9ICcnO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgdmFyIGlzSW1wb3J0YW50ID0gaW1wb3J0YW50UkUudGVzdCh2YWx1ZSkgPyAnaW1wb3J0YW50JyA6ICcnO1xuICAgICAgaWYgKGlzSW1wb3J0YW50KSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZShpbXBvcnRhbnRSRSwgJycpLnRyaW0oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWwuc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgdmFsdWUsIGlzSW1wb3J0YW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbC5zdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKTtcbiAgICB9XG4gIH1cblxufTtcblxuLyoqXG4gKiBOb3JtYWxpemUgYSBDU1MgcHJvcGVydHkgbmFtZS5cbiAqIC0gY2FjaGUgcmVzdWx0XG4gKiAtIGF1dG8gcHJlZml4XG4gKiAtIGNhbWVsQ2FzZSAtPiBkYXNoLWNhc2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZShwcm9wKSB7XG4gIGlmIChwcm9wQ2FjaGVbcHJvcF0pIHtcbiAgICByZXR1cm4gcHJvcENhY2hlW3Byb3BdO1xuICB9XG4gIHZhciByZXMgPSBwcmVmaXgocHJvcCk7XG4gIHByb3BDYWNoZVtwcm9wXSA9IHByb3BDYWNoZVtyZXNdID0gcmVzO1xuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIEF1dG8gZGV0ZWN0IHRoZSBhcHByb3ByaWF0ZSBwcmVmaXggZm9yIGEgQ1NTIHByb3BlcnR5LlxuICogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vcGF1bGlyaXNoLzUyMzY5MlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gcHJlZml4KHByb3ApIHtcbiAgcHJvcCA9IGh5cGhlbmF0ZShwcm9wKTtcbiAgdmFyIGNhbWVsID0gY2FtZWxpemUocHJvcCk7XG4gIHZhciB1cHBlciA9IGNhbWVsLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY2FtZWwuc2xpY2UoMSk7XG4gIGlmICghdGVzdEVsKSB7XG4gICAgdGVzdEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIH1cbiAgdmFyIGkgPSBwcmVmaXhlcy5sZW5ndGg7XG4gIHZhciBwcmVmaXhlZDtcbiAgd2hpbGUgKGktLSkge1xuICAgIHByZWZpeGVkID0gY2FtZWxQcmVmaXhlc1tpXSArIHVwcGVyO1xuICAgIGlmIChwcmVmaXhlZCBpbiB0ZXN0RWwuc3R5bGUpIHtcbiAgICAgIHJldHVybiBwcmVmaXhlc1tpXSArIHByb3A7XG4gICAgfVxuICB9XG4gIGlmIChjYW1lbCBpbiB0ZXN0RWwuc3R5bGUpIHtcbiAgICByZXR1cm4gcHJvcDtcbiAgfVxufVxuXG4vLyB4bGlua1xudmFyIHhsaW5rTlMgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayc7XG52YXIgeGxpbmtSRSA9IC9eeGxpbms6LztcblxuLy8gY2hlY2sgZm9yIGF0dHJpYnV0ZXMgdGhhdCBwcm9oaWJpdCBpbnRlcnBvbGF0aW9uc1xudmFyIGRpc2FsbG93ZWRJbnRlcnBBdHRyUkUgPSAvXnYtfF46fF5AfF4oPzppc3x0cmFuc2l0aW9ufHRyYW5zaXRpb24tbW9kZXxkZWJvdW5jZXx0cmFjay1ieXxzdGFnZ2VyfGVudGVyLXN0YWdnZXJ8bGVhdmUtc3RhZ2dlcikkLztcbi8vIHRoZXNlIGF0dHJpYnV0ZXMgc2hvdWxkIGFsc28gc2V0IHRoZWlyIGNvcnJlc3BvbmRpbmcgcHJvcGVydGllc1xuLy8gYmVjYXVzZSB0aGV5IG9ubHkgYWZmZWN0IHRoZSBpbml0aWFsIHN0YXRlIG9mIHRoZSBlbGVtZW50XG52YXIgYXR0cldpdGhQcm9wc1JFID0gL14oPzp2YWx1ZXxjaGVja2VkfHNlbGVjdGVkfG11dGVkKSQvO1xuLy8gdGhlc2UgYXR0cmlidXRlcyBleHBlY3QgZW51bXJhdGVkIHZhbHVlcyBvZiBcInRydWVcIiBvciBcImZhbHNlXCJcbi8vIGJ1dCBhcmUgbm90IGJvb2xlYW4gYXR0cmlidXRlc1xudmFyIGVudW1lcmF0ZWRBdHRyUkUgPSAvXig/OmRyYWdnYWJsZXxjb250ZW50ZWRpdGFibGV8c3BlbGxjaGVjaykkLztcblxuLy8gdGhlc2UgYXR0cmlidXRlcyBzaG91bGQgc2V0IGEgaGlkZGVuIHByb3BlcnR5IGZvclxuLy8gYmluZGluZyB2LW1vZGVsIHRvIG9iamVjdCB2YWx1ZXNcbnZhciBtb2RlbFByb3BzID0ge1xuICB2YWx1ZTogJ192YWx1ZScsXG4gICd0cnVlLXZhbHVlJzogJ190cnVlVmFsdWUnLFxuICAnZmFsc2UtdmFsdWUnOiAnX2ZhbHNlVmFsdWUnXG59O1xuXG52YXIgYmluZCQxID0ge1xuXG4gIHByaW9yaXR5OiBCSU5ELFxuXG4gIGJpbmQ6IGZ1bmN0aW9uIGJpbmQoKSB7XG4gICAgdmFyIGF0dHIgPSB0aGlzLmFyZztcbiAgICB2YXIgdGFnID0gdGhpcy5lbC50YWdOYW1lO1xuICAgIC8vIHNob3VsZCBiZSBkZWVwIHdhdGNoIG9uIG9iamVjdCBtb2RlXG4gICAgaWYgKCFhdHRyKSB7XG4gICAgICB0aGlzLmRlZXAgPSB0cnVlO1xuICAgIH1cbiAgICAvLyBoYW5kbGUgaW50ZXJwb2xhdGlvbiBiaW5kaW5nc1xuICAgIHZhciBkZXNjcmlwdG9yID0gdGhpcy5kZXNjcmlwdG9yO1xuICAgIHZhciB0b2tlbnMgPSBkZXNjcmlwdG9yLmludGVycDtcbiAgICBpZiAodG9rZW5zKSB7XG4gICAgICAvLyBoYW5kbGUgaW50ZXJwb2xhdGlvbnMgd2l0aCBvbmUtdGltZSB0b2tlbnNcbiAgICAgIGlmIChkZXNjcmlwdG9yLmhhc09uZVRpbWUpIHtcbiAgICAgICAgdGhpcy5leHByZXNzaW9uID0gdG9rZW5zVG9FeHAodG9rZW5zLCB0aGlzLl9zY29wZSB8fCB0aGlzLnZtKTtcbiAgICAgIH1cblxuICAgICAgLy8gb25seSBhbGxvdyBiaW5kaW5nIG9uIG5hdGl2ZSBhdHRyaWJ1dGVzXG4gICAgICBpZiAoZGlzYWxsb3dlZEludGVycEF0dHJSRS50ZXN0KGF0dHIpIHx8IGF0dHIgPT09ICduYW1lJyAmJiAodGFnID09PSAnUEFSVElBTCcgfHwgdGFnID09PSAnU0xPVCcpKSB7XG4gICAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybihhdHRyICsgJz1cIicgKyBkZXNjcmlwdG9yLnJhdyArICdcIjogJyArICdhdHRyaWJ1dGUgaW50ZXJwb2xhdGlvbiBpcyBub3QgYWxsb3dlZCBpbiBWdWUuanMgJyArICdkaXJlY3RpdmVzIGFuZCBzcGVjaWFsIGF0dHJpYnV0ZXMuJyk7XG4gICAgICAgIHRoaXMuZWwucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xuICAgICAgICB0aGlzLmludmFsaWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgIHZhciByYXcgPSBhdHRyICsgJz1cIicgKyBkZXNjcmlwdG9yLnJhdyArICdcIjogJztcbiAgICAgICAgLy8gd2FybiBzcmNcbiAgICAgICAgaWYgKGF0dHIgPT09ICdzcmMnKSB7XG4gICAgICAgICAgd2FybihyYXcgKyAnaW50ZXJwb2xhdGlvbiBpbiBcInNyY1wiIGF0dHJpYnV0ZSB3aWxsIGNhdXNlICcgKyAnYSA0MDQgcmVxdWVzdC4gVXNlIHYtYmluZDpzcmMgaW5zdGVhZC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdhcm4gc3R5bGVcbiAgICAgICAgaWYgKGF0dHIgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICB3YXJuKHJhdyArICdpbnRlcnBvbGF0aW9uIGluIFwic3R5bGVcIiBhdHRyaWJ1dGUgd2lsbCBjYXVzZSAnICsgJ3RoZSBhdHRyaWJ1dGUgdG8gYmUgZGlzY2FyZGVkIGluIEludGVybmV0IEV4cGxvcmVyLiAnICsgJ1VzZSB2LWJpbmQ6c3R5bGUgaW5zdGVhZC4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZSh2YWx1ZSkge1xuICAgIGlmICh0aGlzLmludmFsaWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGF0dHIgPSB0aGlzLmFyZztcbiAgICBpZiAodGhpcy5hcmcpIHtcbiAgICAgIHRoaXMuaGFuZGxlU2luZ2xlKGF0dHIsIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oYW5kbGVPYmplY3QodmFsdWUgfHwge30pO1xuICAgIH1cbiAgfSxcblxuICAvLyBzaGFyZSBvYmplY3QgaGFuZGxlciB3aXRoIHYtYmluZDpjbGFzc1xuICBoYW5kbGVPYmplY3Q6IHN0eWxlLmhhbmRsZU9iamVjdCxcblxuICBoYW5kbGVTaW5nbGU6IGZ1bmN0aW9uIGhhbmRsZVNpbmdsZShhdHRyLCB2YWx1ZSkge1xuICAgIHZhciBlbCA9IHRoaXMuZWw7XG4gICAgdmFyIGludGVycCA9IHRoaXMuZGVzY3JpcHRvci5pbnRlcnA7XG4gICAgaWYgKHRoaXMubW9kaWZpZXJzLmNhbWVsKSB7XG4gICAgICBhdHRyID0gY2FtZWxpemUoYXR0cik7XG4gICAgfVxuICAgIGlmICghaW50ZXJwICYmIGF0dHJXaXRoUHJvcHNSRS50ZXN0KGF0dHIpICYmIGF0dHIgaW4gZWwpIHtcbiAgICAgIGVsW2F0dHJdID0gYXR0ciA9PT0gJ3ZhbHVlJyA/IHZhbHVlID09IG51bGwgLy8gSUU5IHdpbGwgc2V0IGlucHV0LnZhbHVlIHRvIFwibnVsbFwiIGZvciBudWxsLi4uXG4gICAgICA/ICcnIDogdmFsdWUgOiB2YWx1ZTtcbiAgICB9XG4gICAgLy8gc2V0IG1vZGVsIHByb3BzXG4gICAgdmFyIG1vZGVsUHJvcCA9IG1vZGVsUHJvcHNbYXR0cl07XG4gICAgaWYgKCFpbnRlcnAgJiYgbW9kZWxQcm9wKSB7XG4gICAgICBlbFttb2RlbFByb3BdID0gdmFsdWU7XG4gICAgICAvLyB1cGRhdGUgdi1tb2RlbCBpZiBwcmVzZW50XG4gICAgICB2YXIgbW9kZWwgPSBlbC5fX3ZfbW9kZWw7XG4gICAgICBpZiAobW9kZWwpIHtcbiAgICAgICAgbW9kZWwubGlzdGVuZXIoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gZG8gbm90IHNldCB2YWx1ZSBhdHRyaWJ1dGUgZm9yIHRleHRhcmVhXG4gICAgaWYgKGF0dHIgPT09ICd2YWx1ZScgJiYgZWwudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJykge1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyB1cGRhdGUgYXR0cmlidXRlXG4gICAgaWYgKGVudW1lcmF0ZWRBdHRyUkUudGVzdChhdHRyKSkge1xuICAgICAgZWwuc2V0QXR0cmlidXRlKGF0dHIsIHZhbHVlID8gJ3RydWUnIDogJ2ZhbHNlJyk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSAhPSBudWxsICYmIHZhbHVlICE9PSBmYWxzZSkge1xuICAgICAgaWYgKGF0dHIgPT09ICdjbGFzcycpIHtcbiAgICAgICAgLy8gaGFuZGxlIGVkZ2UgY2FzZSAjMTk2MDpcbiAgICAgICAgLy8gY2xhc3MgaW50ZXJwb2xhdGlvbiBzaG91bGQgbm90IG92ZXJ3cml0ZSBWdWUgdHJhbnNpdGlvbiBjbGFzc1xuICAgICAgICBpZiAoZWwuX192X3RyYW5zKSB7XG4gICAgICAgICAgdmFsdWUgKz0gJyAnICsgZWwuX192X3RyYW5zLmlkICsgJy10cmFuc2l0aW9uJztcbiAgICAgICAgfVxuICAgICAgICBzZXRDbGFzcyhlbCwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmICh4bGlua1JFLnRlc3QoYXR0cikpIHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlTlMoeGxpbmtOUywgYXR0ciwgdmFsdWUgPT09IHRydWUgPyAnJyA6IHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSA9PT0gdHJ1ZSA/ICcnIDogdmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoYXR0cik7XG4gICAgfVxuICB9XG59O1xuXG52YXIgZWwgPSB7XG5cbiAgcHJpb3JpdHk6IEVMLFxuXG4gIGJpbmQ6IGZ1bmN0aW9uIGJpbmQoKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKCF0aGlzLmFyZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgaWQgPSB0aGlzLmlkID0gY2FtZWxpemUodGhpcy5hcmcpO1xuICAgIHZhciByZWZzID0gKHRoaXMuX3Njb3BlIHx8IHRoaXMudm0pLiRlbHM7XG4gICAgaWYgKGhhc093bihyZWZzLCBpZCkpIHtcbiAgICAgIHJlZnNbaWRdID0gdGhpcy5lbDtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmaW5lUmVhY3RpdmUocmVmcywgaWQsIHRoaXMuZWwpO1xuICAgIH1cbiAgfSxcblxuICB1bmJpbmQ6IGZ1bmN0aW9uIHVuYmluZCgpIHtcbiAgICB2YXIgcmVmcyA9ICh0aGlzLl9zY29wZSB8fCB0aGlzLnZtKS4kZWxzO1xuICAgIGlmIChyZWZzW3RoaXMuaWRdID09PSB0aGlzLmVsKSB7XG4gICAgICByZWZzW3RoaXMuaWRdID0gbnVsbDtcbiAgICB9XG4gIH1cbn07XG5cbnZhciByZWYgPSB7XG4gIGJpbmQ6IGZ1bmN0aW9uIGJpbmQoKSB7XG4gICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKCd2LXJlZjonICsgdGhpcy5hcmcgKyAnIG11c3QgYmUgdXNlZCBvbiBhIGNoaWxkICcgKyAnY29tcG9uZW50LiBGb3VuZCBvbiA8JyArIHRoaXMuZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpICsgJz4uJyk7XG4gIH1cbn07XG5cbnZhciBjbG9hayA9IHtcbiAgYmluZDogZnVuY3Rpb24gYmluZCgpIHtcbiAgICB2YXIgZWwgPSB0aGlzLmVsO1xuICAgIHRoaXMudm0uJG9uY2UoJ3ByZS1ob29rOmNvbXBpbGVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKCd2LWNsb2FrJyk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8vIG11c3QgZXhwb3J0IHBsYWluIG9iamVjdFxudmFyIGRpcmVjdGl2ZXMgPSB7XG4gIHRleHQ6IHRleHQkMSxcbiAgaHRtbDogaHRtbCxcbiAgJ2Zvcic6IHZGb3IsXG4gICdpZic6IHZJZixcbiAgc2hvdzogc2hvdyxcbiAgbW9kZWw6IG1vZGVsLFxuICBvbjogb24kMSxcbiAgYmluZDogYmluZCQxLFxuICBlbDogZWwsXG4gIHJlZjogcmVmLFxuICBjbG9hazogY2xvYWtcbn07XG5cbnZhciB2Q2xhc3MgPSB7XG5cbiAgZGVlcDogdHJ1ZSxcblxuICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZSh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmhhbmRsZU9iamVjdChzdHJpbmdUb09iamVjdCh2YWx1ZSkpO1xuICAgIH0gZWxzZSBpZiAoaXNQbGFpbk9iamVjdCh2YWx1ZSkpIHtcbiAgICAgIHRoaXMuaGFuZGxlT2JqZWN0KHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICB0aGlzLmhhbmRsZUFycmF5KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgfVxuICB9LFxuXG4gIGhhbmRsZU9iamVjdDogZnVuY3Rpb24gaGFuZGxlT2JqZWN0KHZhbHVlKSB7XG4gICAgdGhpcy5jbGVhbnVwKHZhbHVlKTtcbiAgICB2YXIga2V5cyA9IHRoaXMucHJldktleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBrZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICBpZiAodmFsdWVba2V5XSkge1xuICAgICAgICBhZGRDbGFzcyh0aGlzLmVsLCBrZXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVtb3ZlQ2xhc3ModGhpcy5lbCwga2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlQXJyYXk6IGZ1bmN0aW9uIGhhbmRsZUFycmF5KHZhbHVlKSB7XG4gICAgdGhpcy5jbGVhbnVwKHZhbHVlKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHZhbHVlW2ldKSB7XG4gICAgICAgIGFkZENsYXNzKHRoaXMuZWwsIHZhbHVlW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5wcmV2S2V5cyA9IHZhbHVlLnNsaWNlKCk7XG4gIH0sXG5cbiAgY2xlYW51cDogZnVuY3Rpb24gY2xlYW51cCh2YWx1ZSkge1xuICAgIGlmICh0aGlzLnByZXZLZXlzKSB7XG4gICAgICB2YXIgaSA9IHRoaXMucHJldktleXMubGVuZ3RoO1xuICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICB2YXIga2V5ID0gdGhpcy5wcmV2S2V5c1tpXTtcbiAgICAgICAgaWYgKGtleSAmJiAoIXZhbHVlIHx8ICFjb250YWlucyh2YWx1ZSwga2V5KSkpIHtcbiAgICAgICAgICByZW1vdmVDbGFzcyh0aGlzLmVsLCBrZXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5mdW5jdGlvbiBzdHJpbmdUb09iamVjdCh2YWx1ZSkge1xuICB2YXIgcmVzID0ge307XG4gIHZhciBrZXlzID0gdmFsdWUudHJpbSgpLnNwbGl0KC9cXHMrLyk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICByZXNba2V5c1tpXV0gPSB0cnVlO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5zKHZhbHVlLCBrZXkpIHtcbiAgcmV0dXJuIGlzQXJyYXkodmFsdWUpID8gdmFsdWUuaW5kZXhPZihrZXkpID4gLTEgOiBoYXNPd24odmFsdWUsIGtleSk7XG59XG5cbnZhciBjb21wb25lbnQgPSB7XG5cbiAgcHJpb3JpdHk6IENPTVBPTkVOVCxcblxuICBwYXJhbXM6IFsna2VlcC1hbGl2ZScsICd0cmFuc2l0aW9uLW1vZGUnLCAnaW5saW5lLXRlbXBsYXRlJ10sXG5cbiAgLyoqXG4gICAqIFNldHVwLiBUd28gcG9zc2libGUgdXNhZ2VzOlxuICAgKlxuICAgKiAtIHN0YXRpYzpcbiAgICogICA8Y29tcD4gb3IgPGRpdiB2LWNvbXBvbmVudD1cImNvbXBcIj5cbiAgICpcbiAgICogLSBkeW5hbWljOlxuICAgKiAgIDxjb21wb25lbnQgOmlzPVwidmlld1wiPlxuICAgKi9cblxuICBiaW5kOiBmdW5jdGlvbiBiaW5kKCkge1xuICAgIGlmICghdGhpcy5lbC5fX3Z1ZV9fKSB7XG4gICAgICAvLyBrZWVwLWFsaXZlIGNhY2hlXG4gICAgICB0aGlzLmtlZXBBbGl2ZSA9IHRoaXMucGFyYW1zLmtlZXBBbGl2ZTtcbiAgICAgIGlmICh0aGlzLmtlZXBBbGl2ZSkge1xuICAgICAgICB0aGlzLmNhY2hlID0ge307XG4gICAgICB9XG4gICAgICAvLyBjaGVjayBpbmxpbmUtdGVtcGxhdGVcbiAgICAgIGlmICh0aGlzLnBhcmFtcy5pbmxpbmVUZW1wbGF0ZSkge1xuICAgICAgICAvLyBleHRyYWN0IGlubGluZSB0ZW1wbGF0ZSBhcyBhIERvY3VtZW50RnJhZ21lbnRcbiAgICAgICAgdGhpcy5pbmxpbmVUZW1wbGF0ZSA9IGV4dHJhY3RDb250ZW50KHRoaXMuZWwsIHRydWUpO1xuICAgICAgfVxuICAgICAgLy8gY29tcG9uZW50IHJlc29sdXRpb24gcmVsYXRlZCBzdGF0ZVxuICAgICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50Q2IgPSB0aGlzLkNvbXBvbmVudCA9IG51bGw7XG4gICAgICAvLyB0cmFuc2l0aW9uIHJlbGF0ZWQgc3RhdGVcbiAgICAgIHRoaXMucGVuZGluZ1JlbW92YWxzID0gMDtcbiAgICAgIHRoaXMucGVuZGluZ1JlbW92YWxDYiA9IG51bGw7XG4gICAgICAvLyBjcmVhdGUgYSByZWYgYW5jaG9yXG4gICAgICB0aGlzLmFuY2hvciA9IGNyZWF0ZUFuY2hvcigndi1jb21wb25lbnQnKTtcbiAgICAgIHJlcGxhY2UodGhpcy5lbCwgdGhpcy5hbmNob3IpO1xuICAgICAgLy8gcmVtb3ZlIGlzIGF0dHJpYnV0ZS5cbiAgICAgIC8vIHRoaXMgaXMgcmVtb3ZlZCBkdXJpbmcgY29tcGlsYXRpb24sIGJ1dCBiZWNhdXNlIGNvbXBpbGF0aW9uIGlzXG4gICAgICAvLyBjYWNoZWQsIHdoZW4gdGhlIGNvbXBvbmVudCBpcyB1c2VkIGVsc2V3aGVyZSB0aGlzIGF0dHJpYnV0ZVxuICAgICAgLy8gd2lsbCByZW1haW4gYXQgbGluayB0aW1lLlxuICAgICAgdGhpcy5lbC5yZW1vdmVBdHRyaWJ1dGUoJ2lzJyk7XG4gICAgICAvLyByZW1vdmUgcmVmLCBzYW1lIGFzIGFib3ZlXG4gICAgICBpZiAodGhpcy5kZXNjcmlwdG9yLnJlZikge1xuICAgICAgICB0aGlzLmVsLnJlbW92ZUF0dHJpYnV0ZSgndi1yZWY6JyArIGh5cGhlbmF0ZSh0aGlzLmRlc2NyaXB0b3IucmVmKSk7XG4gICAgICB9XG4gICAgICAvLyBpZiBzdGF0aWMsIGJ1aWxkIHJpZ2h0IG5vdy5cbiAgICAgIGlmICh0aGlzLmxpdGVyYWwpIHtcbiAgICAgICAgdGhpcy5zZXRDb21wb25lbnQodGhpcy5leHByZXNzaW9uKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKCdjYW5ub3QgbW91bnQgY29tcG9uZW50IFwiJyArIHRoaXMuZXhwcmVzc2lvbiArICdcIiAnICsgJ29uIGFscmVhZHkgbW91bnRlZCBlbGVtZW50OiAnICsgdGhpcy5lbCk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBQdWJsaWMgdXBkYXRlLCBjYWxsZWQgYnkgdGhlIHdhdGNoZXIgaW4gdGhlIGR5bmFtaWNcbiAgICogbGl0ZXJhbCBzY2VuYXJpbywgZS5nLiA8Y29tcG9uZW50IDppcz1cInZpZXdcIj5cbiAgICovXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUodmFsdWUpIHtcbiAgICBpZiAoIXRoaXMubGl0ZXJhbCkge1xuICAgICAgdGhpcy5zZXRDb21wb25lbnQodmFsdWUpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogU3dpdGNoIGR5bmFtaWMgY29tcG9uZW50cy4gTWF5IHJlc29sdmUgdGhlIGNvbXBvbmVudFxuICAgKiBhc3luY2hyb25vdXNseSwgYW5kIHBlcmZvcm0gdHJhbnNpdGlvbiBiYXNlZCBvblxuICAgKiBzcGVjaWZpZWQgdHJhbnNpdGlvbiBtb2RlLiBBY2NlcHRzIGEgZmV3IGFkZGl0aW9uYWxcbiAgICogYXJndW1lbnRzIHNwZWNpZmljYWxseSBmb3IgdnVlLXJvdXRlci5cbiAgICpcbiAgICogVGhlIGNhbGxiYWNrIGlzIGNhbGxlZCB3aGVuIHRoZSBmdWxsIHRyYW5zaXRpb24gaXNcbiAgICogZmluaXNoZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdXG4gICAqL1xuXG4gIHNldENvbXBvbmVudDogZnVuY3Rpb24gc2V0Q29tcG9uZW50KHZhbHVlLCBjYikge1xuICAgIHRoaXMuaW52YWxpZGF0ZVBlbmRpbmcoKTtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAvLyBqdXN0IHJlbW92ZSBjdXJyZW50XG4gICAgICB0aGlzLnVuYnVpbGQodHJ1ZSk7XG4gICAgICB0aGlzLnJlbW92ZSh0aGlzLmNoaWxkVk0sIGNiKTtcbiAgICAgIHRoaXMuY2hpbGRWTSA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHRoaXMucmVzb2x2ZUNvbXBvbmVudCh2YWx1ZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLm1vdW50Q29tcG9uZW50KGNiKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogUmVzb2x2ZSB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yIHRvIHVzZSB3aGVuIGNyZWF0aW5nXG4gICAqIHRoZSBjaGlsZCB2bS5cbiAgICovXG5cbiAgcmVzb2x2ZUNvbXBvbmVudDogZnVuY3Rpb24gcmVzb2x2ZUNvbXBvbmVudChpZCwgY2IpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50Q2IgPSBjYW5jZWxsYWJsZShmdW5jdGlvbiAoQ29tcG9uZW50KSB7XG4gICAgICBzZWxmLkNvbXBvbmVudE5hbWUgPSBDb21wb25lbnQub3B0aW9ucy5uYW1lIHx8IGlkO1xuICAgICAgc2VsZi5Db21wb25lbnQgPSBDb21wb25lbnQ7XG4gICAgICBjYigpO1xuICAgIH0pO1xuICAgIHRoaXMudm0uX3Jlc29sdmVDb21wb25lbnQoaWQsIHRoaXMucGVuZGluZ0NvbXBvbmVudENiKTtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGluc3RhbmNlIHVzaW5nIHRoZSBjdXJyZW50IGNvbnN0cnVjdG9yIGFuZFxuICAgKiByZXBsYWNlIHRoZSBleGlzdGluZyBpbnN0YW5jZS4gVGhpcyBtZXRob2QgZG9lc24ndCBjYXJlXG4gICAqIHdoZXRoZXIgdGhlIG5ldyBjb21wb25lbnQgYW5kIHRoZSBvbGQgb25lIGFyZSBhY3R1YWxseVxuICAgKiB0aGUgc2FtZS5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICAgKi9cblxuICBtb3VudENvbXBvbmVudDogZnVuY3Rpb24gbW91bnRDb21wb25lbnQoY2IpIHtcbiAgICAvLyBhY3R1YWwgbW91bnRcbiAgICB0aGlzLnVuYnVpbGQodHJ1ZSk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBhY3RpdmF0ZUhvb2tzID0gdGhpcy5Db21wb25lbnQub3B0aW9ucy5hY3RpdmF0ZTtcbiAgICB2YXIgY2FjaGVkID0gdGhpcy5nZXRDYWNoZWQoKTtcbiAgICB2YXIgbmV3Q29tcG9uZW50ID0gdGhpcy5idWlsZCgpO1xuICAgIGlmIChhY3RpdmF0ZUhvb2tzICYmICFjYWNoZWQpIHtcbiAgICAgIHRoaXMud2FpdGluZ0ZvciA9IG5ld0NvbXBvbmVudDtcbiAgICAgIGNhbGxBY3RpdmF0ZUhvb2tzKGFjdGl2YXRlSG9va3MsIG5ld0NvbXBvbmVudCwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2VsZi53YWl0aW5nRm9yICE9PSBuZXdDb21wb25lbnQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi53YWl0aW5nRm9yID0gbnVsbDtcbiAgICAgICAgc2VsZi50cmFuc2l0aW9uKG5ld0NvbXBvbmVudCwgY2IpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHVwZGF0ZSByZWYgZm9yIGtlcHQtYWxpdmUgY29tcG9uZW50XG4gICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgIG5ld0NvbXBvbmVudC5fdXBkYXRlUmVmKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnRyYW5zaXRpb24obmV3Q29tcG9uZW50LCBjYik7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBXaGVuIHRoZSBjb21wb25lbnQgY2hhbmdlcyBvciB1bmJpbmRzIGJlZm9yZSBhbiBhc3luY1xuICAgKiBjb25zdHJ1Y3RvciBpcyByZXNvbHZlZCwgd2UgbmVlZCB0byBpbnZhbGlkYXRlIGl0c1xuICAgKiBwZW5kaW5nIGNhbGxiYWNrLlxuICAgKi9cblxuICBpbnZhbGlkYXRlUGVuZGluZzogZnVuY3Rpb24gaW52YWxpZGF0ZVBlbmRpbmcoKSB7XG4gICAgaWYgKHRoaXMucGVuZGluZ0NvbXBvbmVudENiKSB7XG4gICAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRDYi5jYW5jZWwoKTtcbiAgICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudENiID0gbnVsbDtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlL2luc2VydCBhIG5ldyBjaGlsZCB2bS5cbiAgICogSWYga2VlcCBhbGl2ZSBhbmQgaGFzIGNhY2hlZCBpbnN0YW5jZSwgaW5zZXJ0IHRoYXRcbiAgICogaW5zdGFuY2U7IG90aGVyd2lzZSBidWlsZCBhIG5ldyBvbmUgYW5kIGNhY2hlIGl0LlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gW2V4dHJhT3B0aW9uc11cbiAgICogQHJldHVybiB7VnVlfSAtIHRoZSBjcmVhdGVkIGluc3RhbmNlXG4gICAqL1xuXG4gIGJ1aWxkOiBmdW5jdGlvbiBidWlsZChleHRyYU9wdGlvbnMpIHtcbiAgICB2YXIgY2FjaGVkID0gdGhpcy5nZXRDYWNoZWQoKTtcbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICByZXR1cm4gY2FjaGVkO1xuICAgIH1cbiAgICBpZiAodGhpcy5Db21wb25lbnQpIHtcbiAgICAgIC8vIGRlZmF1bHQgb3B0aW9uc1xuICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgIG5hbWU6IHRoaXMuQ29tcG9uZW50TmFtZSxcbiAgICAgICAgZWw6IGNsb25lTm9kZSh0aGlzLmVsKSxcbiAgICAgICAgdGVtcGxhdGU6IHRoaXMuaW5saW5lVGVtcGxhdGUsXG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0byBhZGQgdGhlIGNoaWxkIHdpdGggY29ycmVjdCBwYXJlbnRcbiAgICAgICAgLy8gaWYgdGhpcyBpcyBhIHRyYW5zY2x1ZGVkIGNvbXBvbmVudCwgaXRzIHBhcmVudFxuICAgICAgICAvLyBzaG91bGQgYmUgdGhlIHRyYW5zY2x1c2lvbiBob3N0LlxuICAgICAgICBwYXJlbnQ6IHRoaXMuX2hvc3QgfHwgdGhpcy52bSxcbiAgICAgICAgLy8gaWYgbm8gaW5saW5lLXRlbXBsYXRlLCB0aGVuIHRoZSBjb21waWxlZFxuICAgICAgICAvLyBsaW5rZXIgY2FuIGJlIGNhY2hlZCBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICAgICAgICBfbGlua2VyQ2FjaGFibGU6ICF0aGlzLmlubGluZVRlbXBsYXRlLFxuICAgICAgICBfcmVmOiB0aGlzLmRlc2NyaXB0b3IucmVmLFxuICAgICAgICBfYXNDb21wb25lbnQ6IHRydWUsXG4gICAgICAgIF9pc1JvdXRlclZpZXc6IHRoaXMuX2lzUm91dGVyVmlldyxcbiAgICAgICAgLy8gaWYgdGhpcyBpcyBhIHRyYW5zY2x1ZGVkIGNvbXBvbmVudCwgY29udGV4dFxuICAgICAgICAvLyB3aWxsIGJlIHRoZSBjb21tb24gcGFyZW50IHZtIG9mIHRoaXMgaW5zdGFuY2VcbiAgICAgICAgLy8gYW5kIGl0cyBob3N0LlxuICAgICAgICBfY29udGV4dDogdGhpcy52bSxcbiAgICAgICAgLy8gaWYgdGhpcyBpcyBpbnNpZGUgYW4gaW5saW5lIHYtZm9yLCB0aGUgc2NvcGVcbiAgICAgICAgLy8gd2lsbCBiZSB0aGUgaW50ZXJtZWRpYXRlIHNjb3BlIGNyZWF0ZWQgZm9yIHRoaXNcbiAgICAgICAgLy8gcmVwZWF0IGZyYWdtZW50LiB0aGlzIGlzIHVzZWQgZm9yIGxpbmtpbmcgcHJvcHNcbiAgICAgICAgLy8gYW5kIGNvbnRhaW5lciBkaXJlY3RpdmVzLlxuICAgICAgICBfc2NvcGU6IHRoaXMuX3Njb3BlLFxuICAgICAgICAvLyBwYXNzIGluIHRoZSBvd25lciBmcmFnbWVudCBvZiB0aGlzIGNvbXBvbmVudC5cbiAgICAgICAgLy8gdGhpcyBpcyBuZWNlc3Nhcnkgc28gdGhhdCB0aGUgZnJhZ21lbnQgY2FuIGtlZXBcbiAgICAgICAgLy8gdHJhY2sgb2YgaXRzIGNvbnRhaW5lZCBjb21wb25lbnRzIGluIG9yZGVyIHRvXG4gICAgICAgIC8vIGNhbGwgYXR0YWNoL2RldGFjaCBob29rcyBmb3IgdGhlbS5cbiAgICAgICAgX2ZyYWc6IHRoaXMuX2ZyYWdcbiAgICAgIH07XG4gICAgICAvLyBleHRyYSBvcHRpb25zXG4gICAgICAvLyBpbiAxLjAuMCB0aGlzIGlzIHVzZWQgYnkgdnVlLXJvdXRlciBvbmx5XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmIChleHRyYU9wdGlvbnMpIHtcbiAgICAgICAgZXh0ZW5kKG9wdGlvbnMsIGV4dHJhT3B0aW9ucyk7XG4gICAgICB9XG4gICAgICB2YXIgY2hpbGQgPSBuZXcgdGhpcy5Db21wb25lbnQob3B0aW9ucyk7XG4gICAgICBpZiAodGhpcy5rZWVwQWxpdmUpIHtcbiAgICAgICAgdGhpcy5jYWNoZVt0aGlzLkNvbXBvbmVudC5jaWRdID0gY2hpbGQ7XG4gICAgICB9XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHRoaXMuZWwuaGFzQXR0cmlidXRlKCd0cmFuc2l0aW9uJykgJiYgY2hpbGQuX2lzRnJhZ21lbnQpIHtcbiAgICAgICAgd2FybignVHJhbnNpdGlvbnMgd2lsbCBub3Qgd29yayBvbiBhIGZyYWdtZW50IGluc3RhbmNlLiAnICsgJ1RlbXBsYXRlOiAnICsgY2hpbGQuJG9wdGlvbnMudGVtcGxhdGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogVHJ5IHRvIGdldCBhIGNhY2hlZCBpbnN0YW5jZSBvZiB0aGUgY3VycmVudCBjb21wb25lbnQuXG4gICAqXG4gICAqIEByZXR1cm4ge1Z1ZXx1bmRlZmluZWR9XG4gICAqL1xuXG4gIGdldENhY2hlZDogZnVuY3Rpb24gZ2V0Q2FjaGVkKCkge1xuICAgIHJldHVybiB0aGlzLmtlZXBBbGl2ZSAmJiB0aGlzLmNhY2hlW3RoaXMuQ29tcG9uZW50LmNpZF07XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRlYXJkb3duIHRoZSBjdXJyZW50IGNoaWxkLCBidXQgZGVmZXJzIGNsZWFudXAgc29cbiAgICogdGhhdCB3ZSBjYW4gc2VwYXJhdGUgdGhlIGRlc3Ryb3kgYW5kIHJlbW92YWwgc3RlcHMuXG4gICAqXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZGVmZXJcbiAgICovXG5cbiAgdW5idWlsZDogZnVuY3Rpb24gdW5idWlsZChkZWZlcikge1xuICAgIGlmICh0aGlzLndhaXRpbmdGb3IpIHtcbiAgICAgIHRoaXMud2FpdGluZ0Zvci4kZGVzdHJveSgpO1xuICAgICAgdGhpcy53YWl0aW5nRm9yID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZFZNO1xuICAgIGlmICghY2hpbGQgfHwgdGhpcy5rZWVwQWxpdmUpIHtcbiAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAvLyByZW1vdmUgcmVmXG4gICAgICAgIGNoaWxkLl91cGRhdGVSZWYodHJ1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHRoZSBzb2xlIHB1cnBvc2Ugb2YgYGRlZmVyQ2xlYW51cGAgaXMgc28gdGhhdCB3ZSBjYW5cbiAgICAvLyBcImRlYWN0aXZhdGVcIiB0aGUgdm0gcmlnaHQgbm93IGFuZCBwZXJmb3JtIERPTSByZW1vdmFsXG4gICAgLy8gbGF0ZXIuXG4gICAgY2hpbGQuJGRlc3Ryb3koZmFsc2UsIGRlZmVyKTtcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIGN1cnJlbnQgZGVzdHJveWVkIGNoaWxkIGFuZCBtYW51YWxseSBkb1xuICAgKiB0aGUgY2xlYW51cCBhZnRlciByZW1vdmFsLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYlxuICAgKi9cblxuICByZW1vdmU6IGZ1bmN0aW9uIHJlbW92ZShjaGlsZCwgY2IpIHtcbiAgICB2YXIga2VlcEFsaXZlID0gdGhpcy5rZWVwQWxpdmU7XG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICAvLyB3ZSBtYXkgaGF2ZSBhIGNvbXBvbmVudCBzd2l0Y2ggd2hlbiBhIHByZXZpb3VzXG4gICAgICAvLyBjb21wb25lbnQgaXMgc3RpbGwgYmVpbmcgdHJhbnNpdGlvbmVkIG91dC5cbiAgICAgIC8vIHdlIHdhbnQgdG8gdHJpZ2dlciBvbmx5IG9uZSBsYXN0ZXN0IGluc2VydGlvbiBjYlxuICAgICAgLy8gd2hlbiB0aGUgZXhpc3RpbmcgdHJhbnNpdGlvbiBmaW5pc2hlcy4gKCMxMTE5KVxuICAgICAgdGhpcy5wZW5kaW5nUmVtb3ZhbHMrKztcbiAgICAgIHRoaXMucGVuZGluZ1JlbW92YWxDYiA9IGNiO1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgY2hpbGQuJHJlbW92ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucGVuZGluZ1JlbW92YWxzLS07XG4gICAgICAgIGlmICgha2VlcEFsaXZlKSBjaGlsZC5fY2xlYW51cCgpO1xuICAgICAgICBpZiAoIXNlbGYucGVuZGluZ1JlbW92YWxzICYmIHNlbGYucGVuZGluZ1JlbW92YWxDYikge1xuICAgICAgICAgIHNlbGYucGVuZGluZ1JlbW92YWxDYigpO1xuICAgICAgICAgIHNlbGYucGVuZGluZ1JlbW92YWxDYiA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoY2IpIHtcbiAgICAgIGNiKCk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBBY3R1YWxseSBzd2FwIHRoZSBjb21wb25lbnRzLCBkZXBlbmRpbmcgb24gdGhlXG4gICAqIHRyYW5zaXRpb24gbW9kZS4gRGVmYXVsdHMgdG8gc2ltdWx0YW5lb3VzLlxuICAgKlxuICAgKiBAcGFyYW0ge1Z1ZX0gdGFyZ2V0XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAgICovXG5cbiAgdHJhbnNpdGlvbjogZnVuY3Rpb24gdHJhbnNpdGlvbih0YXJnZXQsIGNiKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBjdXJyZW50ID0gdGhpcy5jaGlsZFZNO1xuICAgIC8vIGZvciBkZXZ0b29sIGluc3BlY3Rpb25cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgaWYgKGN1cnJlbnQpIGN1cnJlbnQuX2luYWN0aXZlID0gdHJ1ZTtcbiAgICAgIHRhcmdldC5faW5hY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5jaGlsZFZNID0gdGFyZ2V0O1xuICAgIHN3aXRjaCAoc2VsZi5wYXJhbXMudHJhbnNpdGlvbk1vZGUpIHtcbiAgICAgIGNhc2UgJ2luLW91dCc6XG4gICAgICAgIHRhcmdldC4kYmVmb3JlKHNlbGYuYW5jaG9yLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc2VsZi5yZW1vdmUoY3VycmVudCwgY2IpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdXQtaW4nOlxuICAgICAgICBzZWxmLnJlbW92ZShjdXJyZW50LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdGFyZ2V0LiRiZWZvcmUoc2VsZi5hbmNob3IsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgc2VsZi5yZW1vdmUoY3VycmVudCk7XG4gICAgICAgIHRhcmdldC4kYmVmb3JlKHNlbGYuYW5jaG9yLCBjYik7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBVbmJpbmQuXG4gICAqL1xuXG4gIHVuYmluZDogZnVuY3Rpb24gdW5iaW5kKCkge1xuICAgIHRoaXMuaW52YWxpZGF0ZVBlbmRpbmcoKTtcbiAgICAvLyBEbyBub3QgZGVmZXIgY2xlYW51cCB3aGVuIHVuYmluZGluZ1xuICAgIHRoaXMudW5idWlsZCgpO1xuICAgIC8vIGRlc3Ryb3kgYWxsIGtlZXAtYWxpdmUgY2FjaGVkIGluc3RhbmNlc1xuICAgIGlmICh0aGlzLmNhY2hlKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5jYWNoZSkge1xuICAgICAgICB0aGlzLmNhY2hlW2tleV0uJGRlc3Ryb3koKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY2FjaGUgPSBudWxsO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDYWxsIGFjdGl2YXRlIGhvb2tzIGluIG9yZGVyIChhc3luY2hyb25vdXMpXG4gKlxuICogQHBhcmFtIHtBcnJheX0gaG9va3NcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2JcbiAqL1xuXG5mdW5jdGlvbiBjYWxsQWN0aXZhdGVIb29rcyhob29rcywgdm0sIGNiKSB7XG4gIHZhciB0b3RhbCA9IGhvb2tzLmxlbmd0aDtcbiAgdmFyIGNhbGxlZCA9IDA7XG4gIGhvb2tzWzBdLmNhbGwodm0sIG5leHQpO1xuICBmdW5jdGlvbiBuZXh0KCkge1xuICAgIGlmICgrK2NhbGxlZCA+PSB0b3RhbCkge1xuICAgICAgY2IoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaG9va3NbY2FsbGVkXS5jYWxsKHZtLCBuZXh0KTtcbiAgICB9XG4gIH1cbn1cblxudmFyIGJpbmRpbmdNb2RlcyA9IGNvbmZpZy5fcHJvcEJpbmRpbmdNb2RlcztcblxudmFyIHByb3BEZWYgPSB7XG5cbiAgYmluZDogZnVuY3Rpb24gYmluZCgpIHtcbiAgICB2YXIgY2hpbGQgPSB0aGlzLnZtO1xuICAgIHZhciBwYXJlbnQgPSBjaGlsZC5fY29udGV4dDtcbiAgICAvLyBwYXNzZWQgaW4gZnJvbSBjb21waWxlciBkaXJlY3RseVxuICAgIHZhciBwcm9wID0gdGhpcy5kZXNjcmlwdG9yLnByb3A7XG4gICAgdmFyIGNoaWxkS2V5ID0gcHJvcC5wYXRoO1xuICAgIHZhciBwYXJlbnRLZXkgPSBwcm9wLnBhcmVudFBhdGg7XG4gICAgdmFyIHR3b1dheSA9IHByb3AubW9kZSA9PT0gYmluZGluZ01vZGVzLlRXT19XQVk7XG5cbiAgICB2YXIgcGFyZW50V2F0Y2hlciA9IHRoaXMucGFyZW50V2F0Y2hlciA9IG5ldyBXYXRjaGVyKHBhcmVudCwgcGFyZW50S2V5LCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICB2YWwgPSBjb2VyY2VQcm9wKHByb3AsIHZhbCk7XG4gICAgICBpZiAoYXNzZXJ0UHJvcChwcm9wLCB2YWwpKSB7XG4gICAgICAgIGNoaWxkW2NoaWxkS2V5XSA9IHZhbDtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICB0d29XYXk6IHR3b1dheSxcbiAgICAgIGZpbHRlcnM6IHByb3AuZmlsdGVycyxcbiAgICAgIC8vIGltcG9ydGFudDogcHJvcHMgbmVlZCB0byBiZSBvYnNlcnZlZCBvbiB0aGVcbiAgICAgIC8vIHYtZm9yIHNjb3BlIGlmIHByZXNlbnRcbiAgICAgIHNjb3BlOiB0aGlzLl9zY29wZVxuICAgIH0pO1xuXG4gICAgLy8gc2V0IHRoZSBjaGlsZCBpbml0aWFsIHZhbHVlLlxuICAgIGluaXRQcm9wKGNoaWxkLCBwcm9wLCBwYXJlbnRXYXRjaGVyLnZhbHVlKTtcblxuICAgIC8vIHNldHVwIHR3by13YXkgYmluZGluZ1xuICAgIGlmICh0d29XYXkpIHtcbiAgICAgIC8vIGltcG9ydGFudDogZGVmZXIgdGhlIGNoaWxkIHdhdGNoZXIgY3JlYXRpb24gdW50aWxcbiAgICAgIC8vIHRoZSBjcmVhdGVkIGhvb2sgKGFmdGVyIGRhdGEgb2JzZXJ2YXRpb24pXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBjaGlsZC4kb25jZSgncHJlLWhvb2s6Y3JlYXRlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5jaGlsZFdhdGNoZXIgPSBuZXcgV2F0Y2hlcihjaGlsZCwgY2hpbGRLZXksIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICBwYXJlbnRXYXRjaGVyLnNldCh2YWwpO1xuICAgICAgICB9LCB7XG4gICAgICAgICAgLy8gZW5zdXJlIHN5bmMgdXB3YXJkIGJlZm9yZSBwYXJlbnQgc3luYyBkb3duLlxuICAgICAgICAgIC8vIHRoaXMgaXMgbmVjZXNzYXJ5IGluIGNhc2VzIGUuZy4gdGhlIGNoaWxkXG4gICAgICAgICAgLy8gbXV0YXRlcyBhIHByb3AgYXJyYXksIHRoZW4gcmVwbGFjZXMgaXQuICgjMTY4MylcbiAgICAgICAgICBzeW5jOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIHVuYmluZDogZnVuY3Rpb24gdW5iaW5kKCkge1xuICAgIHRoaXMucGFyZW50V2F0Y2hlci50ZWFyZG93bigpO1xuICAgIGlmICh0aGlzLmNoaWxkV2F0Y2hlcikge1xuICAgICAgdGhpcy5jaGlsZFdhdGNoZXIudGVhcmRvd24oKTtcbiAgICB9XG4gIH1cbn07XG5cbnZhciBxdWV1ZSQxID0gW107XG52YXIgcXVldWVkID0gZmFsc2U7XG5cbi8qKlxuICogUHVzaCBhIGpvYiBpbnRvIHRoZSBxdWV1ZS5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBqb2JcbiAqL1xuXG5mdW5jdGlvbiBwdXNoSm9iKGpvYikge1xuICBxdWV1ZSQxLnB1c2goam9iKTtcbiAgaWYgKCFxdWV1ZWQpIHtcbiAgICBxdWV1ZWQgPSB0cnVlO1xuICAgIG5leHRUaWNrKGZsdXNoKTtcbiAgfVxufVxuXG4vKipcbiAqIEZsdXNoIHRoZSBxdWV1ZSwgYW5kIGRvIG9uZSBmb3JjZWQgcmVmbG93IGJlZm9yZVxuICogdHJpZ2dlcmluZyB0cmFuc2l0aW9ucy5cbiAqL1xuXG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgLy8gRm9yY2UgbGF5b3V0XG4gIHZhciBmID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZSQxLmxlbmd0aDsgaSsrKSB7XG4gICAgcXVldWUkMVtpXSgpO1xuICB9XG4gIHF1ZXVlJDEgPSBbXTtcbiAgcXVldWVkID0gZmFsc2U7XG4gIC8vIGR1bW15IHJldHVybiwgc28ganMgbGludGVycyBkb24ndCBjb21wbGFpbiBhYm91dFxuICAvLyB1bnVzZWQgdmFyaWFibGUgZlxuICByZXR1cm4gZjtcbn1cblxudmFyIFRZUEVfVFJBTlNJVElPTiA9ICd0cmFuc2l0aW9uJztcbnZhciBUWVBFX0FOSU1BVElPTiA9ICdhbmltYXRpb24nO1xudmFyIHRyYW5zRHVyYXRpb25Qcm9wID0gdHJhbnNpdGlvblByb3AgKyAnRHVyYXRpb24nO1xudmFyIGFuaW1EdXJhdGlvblByb3AgPSBhbmltYXRpb25Qcm9wICsgJ0R1cmF0aW9uJztcblxuLyoqXG4gKiBBIFRyYW5zaXRpb24gb2JqZWN0IHRoYXQgZW5jYXBzdWxhdGVzIHRoZSBzdGF0ZSBhbmQgbG9naWNcbiAqIG9mIHRoZSB0cmFuc2l0aW9uLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBpZFxuICogQHBhcmFtIHtPYmplY3R9IGhvb2tzXG4gKiBAcGFyYW0ge1Z1ZX0gdm1cbiAqL1xuZnVuY3Rpb24gVHJhbnNpdGlvbihlbCwgaWQsIGhvb2tzLCB2bSkge1xuICB0aGlzLmlkID0gaWQ7XG4gIHRoaXMuZWwgPSBlbDtcbiAgdGhpcy5lbnRlckNsYXNzID0gaG9va3MgJiYgaG9va3MuZW50ZXJDbGFzcyB8fCBpZCArICctZW50ZXInO1xuICB0aGlzLmxlYXZlQ2xhc3MgPSBob29rcyAmJiBob29rcy5sZWF2ZUNsYXNzIHx8IGlkICsgJy1sZWF2ZSc7XG4gIHRoaXMuaG9va3MgPSBob29rcztcbiAgdGhpcy52bSA9IHZtO1xuICAvLyBhc3luYyBzdGF0ZVxuICB0aGlzLnBlbmRpbmdDc3NFdmVudCA9IHRoaXMucGVuZGluZ0Nzc0NiID0gdGhpcy5jYW5jZWwgPSB0aGlzLnBlbmRpbmdKc0NiID0gdGhpcy5vcCA9IHRoaXMuY2IgPSBudWxsO1xuICB0aGlzLmp1c3RFbnRlcmVkID0gZmFsc2U7XG4gIHRoaXMuZW50ZXJlZCA9IHRoaXMubGVmdCA9IGZhbHNlO1xuICB0aGlzLnR5cGVDYWNoZSA9IHt9O1xuICAvLyBjaGVjayBjc3MgdHJhbnNpdGlvbiB0eXBlXG4gIHRoaXMudHlwZSA9IGhvb2tzICYmIGhvb2tzLnR5cGU7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGlmICh0aGlzLnR5cGUgJiYgdGhpcy50eXBlICE9PSBUWVBFX1RSQU5TSVRJT04gJiYgdGhpcy50eXBlICE9PSBUWVBFX0FOSU1BVElPTikge1xuICAgICAgd2FybignaW52YWxpZCBDU1MgdHJhbnNpdGlvbiB0eXBlIGZvciB0cmFuc2l0aW9uPVwiJyArIHRoaXMuaWQgKyAnXCI6ICcgKyB0aGlzLnR5cGUpO1xuICAgIH1cbiAgfVxuICAvLyBiaW5kXG4gIHZhciBzZWxmID0gdGhpcztbJ2VudGVyTmV4dFRpY2snLCAnZW50ZXJEb25lJywgJ2xlYXZlTmV4dFRpY2snLCAnbGVhdmVEb25lJ10uZm9yRWFjaChmdW5jdGlvbiAobSkge1xuICAgIHNlbGZbbV0gPSBiaW5kKHNlbGZbbV0sIHNlbGYpO1xuICB9KTtcbn1cblxudmFyIHAkMSA9IFRyYW5zaXRpb24ucHJvdG90eXBlO1xuXG4vKipcbiAqIFN0YXJ0IGFuIGVudGVyaW5nIHRyYW5zaXRpb24uXG4gKlxuICogMS4gZW50ZXIgdHJhbnNpdGlvbiB0cmlnZ2VyZWRcbiAqIDIuIGNhbGwgYmVmb3JlRW50ZXIgaG9va1xuICogMy4gYWRkIGVudGVyIGNsYXNzXG4gKiA0LiBpbnNlcnQvc2hvdyBlbGVtZW50XG4gKiA1LiBjYWxsIGVudGVyIGhvb2sgKHdpdGggcG9zc2libGUgZXhwbGljaXQganMgY2FsbGJhY2spXG4gKiA2LiByZWZsb3dcbiAqIDcuIGJhc2VkIG9uIHRyYW5zaXRpb24gdHlwZTpcbiAqICAgIC0gdHJhbnNpdGlvbjpcbiAqICAgICAgICByZW1vdmUgY2xhc3Mgbm93LCB3YWl0IGZvciB0cmFuc2l0aW9uZW5kLFxuICogICAgICAgIHRoZW4gZG9uZSBpZiB0aGVyZSdzIG5vIGV4cGxpY2l0IGpzIGNhbGxiYWNrLlxuICogICAgLSBhbmltYXRpb246XG4gKiAgICAgICAgd2FpdCBmb3IgYW5pbWF0aW9uZW5kLCByZW1vdmUgY2xhc3MsXG4gKiAgICAgICAgdGhlbiBkb25lIGlmIHRoZXJlJ3Mgbm8gZXhwbGljaXQganMgY2FsbGJhY2suXG4gKiAgICAtIG5vIGNzcyB0cmFuc2l0aW9uOlxuICogICAgICAgIGRvbmUgbm93IGlmIHRoZXJlJ3Mgbm8gZXhwbGljaXQganMgY2FsbGJhY2suXG4gKiA4LiB3YWl0IGZvciBlaXRoZXIgZG9uZSBvciBqcyBjYWxsYmFjaywgdGhlbiBjYWxsXG4gKiAgICBhZnRlckVudGVyIGhvb2suXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gb3AgLSBpbnNlcnQvc2hvdyB0aGUgZWxlbWVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICovXG5cbnAkMS5lbnRlciA9IGZ1bmN0aW9uIChvcCwgY2IpIHtcbiAgdGhpcy5jYW5jZWxQZW5kaW5nKCk7XG4gIHRoaXMuY2FsbEhvb2soJ2JlZm9yZUVudGVyJyk7XG4gIHRoaXMuY2IgPSBjYjtcbiAgYWRkQ2xhc3ModGhpcy5lbCwgdGhpcy5lbnRlckNsYXNzKTtcbiAgb3AoKTtcbiAgdGhpcy5lbnRlcmVkID0gZmFsc2U7XG4gIHRoaXMuY2FsbEhvb2tXaXRoQ2IoJ2VudGVyJyk7XG4gIGlmICh0aGlzLmVudGVyZWQpIHtcbiAgICByZXR1cm47IC8vIHVzZXIgY2FsbGVkIGRvbmUgc3luY2hyb25vdXNseS5cbiAgfVxuICB0aGlzLmNhbmNlbCA9IHRoaXMuaG9va3MgJiYgdGhpcy5ob29rcy5lbnRlckNhbmNlbGxlZDtcbiAgcHVzaEpvYih0aGlzLmVudGVyTmV4dFRpY2spO1xufTtcblxuLyoqXG4gKiBUaGUgXCJuZXh0VGlja1wiIHBoYXNlIG9mIGFuIGVudGVyaW5nIHRyYW5zaXRpb24sIHdoaWNoIGlzXG4gKiB0byBiZSBwdXNoZWQgaW50byBhIHF1ZXVlIGFuZCBleGVjdXRlZCBhZnRlciBhIHJlZmxvdyBzb1xuICogdGhhdCByZW1vdmluZyB0aGUgY2xhc3MgY2FuIHRyaWdnZXIgYSBDU1MgdHJhbnNpdGlvbi5cbiAqL1xuXG5wJDEuZW50ZXJOZXh0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgLy8gSW1wb3J0YW50IGhhY2s6XG4gIC8vIGluIENocm9tZSwgaWYgYSBqdXN0LWVudGVyZWQgZWxlbWVudCBpcyBhcHBsaWVkIHRoZVxuICAvLyBsZWF2ZSBjbGFzcyB3aGlsZSBpdHMgaW50ZXJwb2xhdGVkIHByb3BlcnR5IHN0aWxsIGhhc1xuICAvLyBhIHZlcnkgc21hbGwgdmFsdWUgKHdpdGhpbiBvbmUgZnJhbWUpLCBDaHJvbWUgd2lsbFxuICAvLyBza2lwIHRoZSBsZWF2ZSB0cmFuc2l0aW9uIGVudGlyZWx5IGFuZCBub3QgZmlyaW5nIHRoZVxuICAvLyB0cmFuc3Rpb25lbmQgZXZlbnQuIFRoZXJlZm9yZSB3ZSBuZWVkIHRvIHByb3RlY3RlZFxuICAvLyBhZ2FpbnN0IHN1Y2ggY2FzZXMgdXNpbmcgYSBvbmUtZnJhbWUgdGltZW91dC5cbiAgdGhpcy5qdXN0RW50ZXJlZCA9IHRydWU7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgc2VsZi5qdXN0RW50ZXJlZCA9IGZhbHNlO1xuICB9LCAxNyk7XG5cbiAgdmFyIGVudGVyRG9uZSA9IHRoaXMuZW50ZXJEb25lO1xuICB2YXIgdHlwZSA9IHRoaXMuZ2V0Q3NzVHJhbnNpdGlvblR5cGUodGhpcy5lbnRlckNsYXNzKTtcbiAgaWYgKCF0aGlzLnBlbmRpbmdKc0NiKSB7XG4gICAgaWYgKHR5cGUgPT09IFRZUEVfVFJBTlNJVElPTikge1xuICAgICAgLy8gdHJpZ2dlciB0cmFuc2l0aW9uIGJ5IHJlbW92aW5nIGVudGVyIGNsYXNzIG5vd1xuICAgICAgcmVtb3ZlQ2xhc3ModGhpcy5lbCwgdGhpcy5lbnRlckNsYXNzKTtcbiAgICAgIHRoaXMuc2V0dXBDc3NDYih0cmFuc2l0aW9uRW5kRXZlbnQsIGVudGVyRG9uZSk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBUWVBFX0FOSU1BVElPTikge1xuICAgICAgdGhpcy5zZXR1cENzc0NiKGFuaW1hdGlvbkVuZEV2ZW50LCBlbnRlckRvbmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbnRlckRvbmUoKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gVFlQRV9UUkFOU0lUSU9OKSB7XG4gICAgcmVtb3ZlQ2xhc3ModGhpcy5lbCwgdGhpcy5lbnRlckNsYXNzKTtcbiAgfVxufTtcblxuLyoqXG4gKiBUaGUgXCJjbGVhbnVwXCIgcGhhc2Ugb2YgYW4gZW50ZXJpbmcgdHJhbnNpdGlvbi5cbiAqL1xuXG5wJDEuZW50ZXJEb25lID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmVudGVyZWQgPSB0cnVlO1xuICB0aGlzLmNhbmNlbCA9IHRoaXMucGVuZGluZ0pzQ2IgPSBudWxsO1xuICByZW1vdmVDbGFzcyh0aGlzLmVsLCB0aGlzLmVudGVyQ2xhc3MpO1xuICB0aGlzLmNhbGxIb29rKCdhZnRlckVudGVyJyk7XG4gIGlmICh0aGlzLmNiKSB0aGlzLmNiKCk7XG59O1xuXG4vKipcbiAqIFN0YXJ0IGEgbGVhdmluZyB0cmFuc2l0aW9uLlxuICpcbiAqIDEuIGxlYXZlIHRyYW5zaXRpb24gdHJpZ2dlcmVkLlxuICogMi4gY2FsbCBiZWZvcmVMZWF2ZSBob29rXG4gKiAzLiBhZGQgbGVhdmUgY2xhc3MgKHRyaWdnZXIgY3NzIHRyYW5zaXRpb24pXG4gKiA0LiBjYWxsIGxlYXZlIGhvb2sgKHdpdGggcG9zc2libGUgZXhwbGljaXQganMgY2FsbGJhY2spXG4gKiA1LiByZWZsb3cgaWYgbm8gZXhwbGljaXQganMgY2FsbGJhY2sgaXMgcHJvdmlkZWRcbiAqIDYuIGJhc2VkIG9uIHRyYW5zaXRpb24gdHlwZTpcbiAqICAgIC0gdHJhbnNpdGlvbiBvciBhbmltYXRpb246XG4gKiAgICAgICAgd2FpdCBmb3IgZW5kIGV2ZW50LCByZW1vdmUgY2xhc3MsIHRoZW4gZG9uZSBpZlxuICogICAgICAgIHRoZXJlJ3Mgbm8gZXhwbGljaXQganMgY2FsbGJhY2suXG4gKiAgICAtIG5vIGNzcyB0cmFuc2l0aW9uOlxuICogICAgICAgIGRvbmUgaWYgdGhlcmUncyBubyBleHBsaWNpdCBqcyBjYWxsYmFjay5cbiAqIDcuIHdhaXQgZm9yIGVpdGhlciBkb25lIG9yIGpzIGNhbGxiYWNrLCB0aGVuIGNhbGxcbiAqICAgIGFmdGVyTGVhdmUgaG9vay5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcCAtIHJlbW92ZS9oaWRlIHRoZSBlbGVtZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdXG4gKi9cblxucCQxLmxlYXZlID0gZnVuY3Rpb24gKG9wLCBjYikge1xuICB0aGlzLmNhbmNlbFBlbmRpbmcoKTtcbiAgdGhpcy5jYWxsSG9vaygnYmVmb3JlTGVhdmUnKTtcbiAgdGhpcy5vcCA9IG9wO1xuICB0aGlzLmNiID0gY2I7XG4gIGFkZENsYXNzKHRoaXMuZWwsIHRoaXMubGVhdmVDbGFzcyk7XG4gIHRoaXMubGVmdCA9IGZhbHNlO1xuICB0aGlzLmNhbGxIb29rV2l0aENiKCdsZWF2ZScpO1xuICBpZiAodGhpcy5sZWZ0KSB7XG4gICAgcmV0dXJuOyAvLyB1c2VyIGNhbGxlZCBkb25lIHN5bmNocm9ub3VzbHkuXG4gIH1cbiAgdGhpcy5jYW5jZWwgPSB0aGlzLmhvb2tzICYmIHRoaXMuaG9va3MubGVhdmVDYW5jZWxsZWQ7XG4gIC8vIG9ubHkgbmVlZCB0byBoYW5kbGUgbGVhdmVEb25lIGlmXG4gIC8vIDEuIHRoZSB0cmFuc2l0aW9uIGlzIGFscmVhZHkgZG9uZSAoc3luY2hyb25vdXNseSBjYWxsZWRcbiAgLy8gICAgYnkgdGhlIHVzZXIsIHdoaWNoIGNhdXNlcyB0aGlzLm9wIHNldCB0byBudWxsKVxuICAvLyAyLiB0aGVyZSdzIG5vIGV4cGxpY2l0IGpzIGNhbGxiYWNrXG4gIGlmICh0aGlzLm9wICYmICF0aGlzLnBlbmRpbmdKc0NiKSB7XG4gICAgLy8gaWYgYSBDU1MgdHJhbnNpdGlvbiBsZWF2ZXMgaW1tZWRpYXRlbHkgYWZ0ZXIgZW50ZXIsXG4gICAgLy8gdGhlIHRyYW5zaXRpb25lbmQgZXZlbnQgbmV2ZXIgZmlyZXMuIHRoZXJlZm9yZSB3ZVxuICAgIC8vIGRldGVjdCBzdWNoIGNhc2VzIGFuZCBlbmQgdGhlIGxlYXZlIGltbWVkaWF0ZWx5LlxuICAgIGlmICh0aGlzLmp1c3RFbnRlcmVkKSB7XG4gICAgICB0aGlzLmxlYXZlRG9uZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwdXNoSm9iKHRoaXMubGVhdmVOZXh0VGljayk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFRoZSBcIm5leHRUaWNrXCIgcGhhc2Ugb2YgYSBsZWF2aW5nIHRyYW5zaXRpb24uXG4gKi9cblxucCQxLmxlYXZlTmV4dFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB0eXBlID0gdGhpcy5nZXRDc3NUcmFuc2l0aW9uVHlwZSh0aGlzLmxlYXZlQ2xhc3MpO1xuICBpZiAodHlwZSkge1xuICAgIHZhciBldmVudCA9IHR5cGUgPT09IFRZUEVfVFJBTlNJVElPTiA/IHRyYW5zaXRpb25FbmRFdmVudCA6IGFuaW1hdGlvbkVuZEV2ZW50O1xuICAgIHRoaXMuc2V0dXBDc3NDYihldmVudCwgdGhpcy5sZWF2ZURvbmUpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubGVhdmVEb25lKCk7XG4gIH1cbn07XG5cbi8qKlxuICogVGhlIFwiY2xlYW51cFwiIHBoYXNlIG9mIGEgbGVhdmluZyB0cmFuc2l0aW9uLlxuICovXG5cbnAkMS5sZWF2ZURvbmUgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMubGVmdCA9IHRydWU7XG4gIHRoaXMuY2FuY2VsID0gdGhpcy5wZW5kaW5nSnNDYiA9IG51bGw7XG4gIHRoaXMub3AoKTtcbiAgcmVtb3ZlQ2xhc3ModGhpcy5lbCwgdGhpcy5sZWF2ZUNsYXNzKTtcbiAgdGhpcy5jYWxsSG9vaygnYWZ0ZXJMZWF2ZScpO1xuICBpZiAodGhpcy5jYikgdGhpcy5jYigpO1xuICB0aGlzLm9wID0gbnVsbDtcbn07XG5cbi8qKlxuICogQ2FuY2VsIGFueSBwZW5kaW5nIGNhbGxiYWNrcyBmcm9tIGEgcHJldmlvdXNseSBydW5uaW5nXG4gKiBidXQgbm90IGZpbmlzaGVkIHRyYW5zaXRpb24uXG4gKi9cblxucCQxLmNhbmNlbFBlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMub3AgPSB0aGlzLmNiID0gbnVsbDtcbiAgdmFyIGhhc1BlbmRpbmcgPSBmYWxzZTtcbiAgaWYgKHRoaXMucGVuZGluZ0Nzc0NiKSB7XG4gICAgaGFzUGVuZGluZyA9IHRydWU7XG4gICAgb2ZmKHRoaXMuZWwsIHRoaXMucGVuZGluZ0Nzc0V2ZW50LCB0aGlzLnBlbmRpbmdDc3NDYik7XG4gICAgdGhpcy5wZW5kaW5nQ3NzRXZlbnQgPSB0aGlzLnBlbmRpbmdDc3NDYiA9IG51bGw7XG4gIH1cbiAgaWYgKHRoaXMucGVuZGluZ0pzQ2IpIHtcbiAgICBoYXNQZW5kaW5nID0gdHJ1ZTtcbiAgICB0aGlzLnBlbmRpbmdKc0NiLmNhbmNlbCgpO1xuICAgIHRoaXMucGVuZGluZ0pzQ2IgPSBudWxsO1xuICB9XG4gIGlmIChoYXNQZW5kaW5nKSB7XG4gICAgcmVtb3ZlQ2xhc3ModGhpcy5lbCwgdGhpcy5lbnRlckNsYXNzKTtcbiAgICByZW1vdmVDbGFzcyh0aGlzLmVsLCB0aGlzLmxlYXZlQ2xhc3MpO1xuICB9XG4gIGlmICh0aGlzLmNhbmNlbCkge1xuICAgIHRoaXMuY2FuY2VsLmNhbGwodGhpcy52bSwgdGhpcy5lbCk7XG4gICAgdGhpcy5jYW5jZWwgPSBudWxsO1xuICB9XG59O1xuXG4vKipcbiAqIENhbGwgYSB1c2VyLXByb3ZpZGVkIHN5bmNocm9ub3VzIGhvb2sgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqL1xuXG5wJDEuY2FsbEhvb2sgPSBmdW5jdGlvbiAodHlwZSkge1xuICBpZiAodGhpcy5ob29rcyAmJiB0aGlzLmhvb2tzW3R5cGVdKSB7XG4gICAgdGhpcy5ob29rc1t0eXBlXS5jYWxsKHRoaXMudm0sIHRoaXMuZWwpO1xuICB9XG59O1xuXG4vKipcbiAqIENhbGwgYSB1c2VyLXByb3ZpZGVkLCBwb3RlbnRpYWxseS1hc3luYyBob29rIGZ1bmN0aW9uLlxuICogV2UgY2hlY2sgZm9yIHRoZSBsZW5ndGggb2YgYXJndW1lbnRzIHRvIHNlZSBpZiB0aGUgaG9va1xuICogZXhwZWN0cyBhIGBkb25lYCBjYWxsYmFjay4gSWYgdHJ1ZSwgdGhlIHRyYW5zaXRpb24ncyBlbmRcbiAqIHdpbGwgYmUgZGV0ZXJtaW5lZCBieSB3aGVuIHRoZSB1c2VyIGNhbGxzIHRoYXQgY2FsbGJhY2s7XG4gKiBvdGhlcndpc2UsIHRoZSBlbmQgaXMgZGV0ZXJtaW5lZCBieSB0aGUgQ1NTIHRyYW5zaXRpb24gb3JcbiAqIGFuaW1hdGlvbi5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICovXG5cbnAkMS5jYWxsSG9va1dpdGhDYiA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gIHZhciBob29rID0gdGhpcy5ob29rcyAmJiB0aGlzLmhvb2tzW3R5cGVdO1xuICBpZiAoaG9vaykge1xuICAgIGlmIChob29rLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRoaXMucGVuZGluZ0pzQ2IgPSBjYW5jZWxsYWJsZSh0aGlzW3R5cGUgKyAnRG9uZSddKTtcbiAgICB9XG4gICAgaG9vay5jYWxsKHRoaXMudm0sIHRoaXMuZWwsIHRoaXMucGVuZGluZ0pzQ2IpO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCBhbiBlbGVtZW50J3MgdHJhbnNpdGlvbiB0eXBlIGJhc2VkIG9uIHRoZVxuICogY2FsY3VsYXRlZCBzdHlsZXMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGNsYXNzTmFtZVxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG5cbnAkMS5nZXRDc3NUcmFuc2l0aW9uVHlwZSA9IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmICghdHJhbnNpdGlvbkVuZEV2ZW50IHx8XG4gIC8vIHNraXAgQ1NTIHRyYW5zaXRpb25zIGlmIHBhZ2UgaXMgbm90IHZpc2libGUgLVxuICAvLyB0aGlzIHNvbHZlcyB0aGUgaXNzdWUgb2YgdHJhbnNpdGlvbmVuZCBldmVudHMgbm90XG4gIC8vIGZpcmluZyB1bnRpbCB0aGUgcGFnZSBpcyB2aXNpYmxlIGFnYWluLlxuICAvLyBwYWdlVmlzaWJpbGl0eSBBUEkgaXMgc3VwcG9ydGVkIGluIElFMTArLCBzYW1lIGFzXG4gIC8vIENTUyB0cmFuc2l0aW9ucy5cbiAgZG9jdW1lbnQuaGlkZGVuIHx8XG4gIC8vIGV4cGxpY2l0IGpzLW9ubHkgdHJhbnNpdGlvblxuICB0aGlzLmhvb2tzICYmIHRoaXMuaG9va3MuY3NzID09PSBmYWxzZSB8fFxuICAvLyBlbGVtZW50IGlzIGhpZGRlblxuICBpc0hpZGRlbih0aGlzLmVsKSkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgdHlwZSA9IHRoaXMudHlwZSB8fCB0aGlzLnR5cGVDYWNoZVtjbGFzc05hbWVdO1xuICBpZiAodHlwZSkgcmV0dXJuIHR5cGU7XG4gIHZhciBpbmxpbmVTdHlsZXMgPSB0aGlzLmVsLnN0eWxlO1xuICB2YXIgY29tcHV0ZWRTdHlsZXMgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmVsKTtcbiAgdmFyIHRyYW5zRHVyYXRpb24gPSBpbmxpbmVTdHlsZXNbdHJhbnNEdXJhdGlvblByb3BdIHx8IGNvbXB1dGVkU3R5bGVzW3RyYW5zRHVyYXRpb25Qcm9wXTtcbiAgaWYgKHRyYW5zRHVyYXRpb24gJiYgdHJhbnNEdXJhdGlvbiAhPT0gJzBzJykge1xuICAgIHR5cGUgPSBUWVBFX1RSQU5TSVRJT047XG4gIH0gZWxzZSB7XG4gICAgdmFyIGFuaW1EdXJhdGlvbiA9IGlubGluZVN0eWxlc1thbmltRHVyYXRpb25Qcm9wXSB8fCBjb21wdXRlZFN0eWxlc1thbmltRHVyYXRpb25Qcm9wXTtcbiAgICBpZiAoYW5pbUR1cmF0aW9uICYmIGFuaW1EdXJhdGlvbiAhPT0gJzBzJykge1xuICAgICAgdHlwZSA9IFRZUEVfQU5JTUFUSU9OO1xuICAgIH1cbiAgfVxuICBpZiAodHlwZSkge1xuICAgIHRoaXMudHlwZUNhY2hlW2NsYXNzTmFtZV0gPSB0eXBlO1xuICB9XG4gIHJldHVybiB0eXBlO1xufTtcblxuLyoqXG4gKiBTZXR1cCBhIENTUyB0cmFuc2l0aW9uZW5kL2FuaW1hdGlvbmVuZCBjYWxsYmFjay5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gKi9cblxucCQxLnNldHVwQ3NzQ2IgPSBmdW5jdGlvbiAoZXZlbnQsIGNiKSB7XG4gIHRoaXMucGVuZGluZ0Nzc0V2ZW50ID0gZXZlbnQ7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGVsID0gdGhpcy5lbDtcbiAgdmFyIG9uRW5kID0gdGhpcy5wZW5kaW5nQ3NzQ2IgPSBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLnRhcmdldCA9PT0gZWwpIHtcbiAgICAgIG9mZihlbCwgZXZlbnQsIG9uRW5kKTtcbiAgICAgIHNlbGYucGVuZGluZ0Nzc0V2ZW50ID0gc2VsZi5wZW5kaW5nQ3NzQ2IgPSBudWxsO1xuICAgICAgaWYgKCFzZWxmLnBlbmRpbmdKc0NiICYmIGNiKSB7XG4gICAgICAgIGNiKCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBvbihlbCwgZXZlbnQsIG9uRW5kKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgYW4gZWxlbWVudCBpcyBoaWRkZW4gLSBpbiB0aGF0IGNhc2Ugd2UgY2FuIGp1c3RcbiAqIHNraXAgdGhlIHRyYW5zaXRpb24gYWxsdG9nZXRoZXIuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5mdW5jdGlvbiBpc0hpZGRlbihlbCkge1xuICBpZiAoL3N2ZyQvLnRlc3QoZWwubmFtZXNwYWNlVVJJKSkge1xuICAgIC8vIFNWRyBlbGVtZW50cyBkbyBub3QgaGF2ZSBvZmZzZXQoV2lkdGh8SGVpZ2h0KVxuICAgIC8vIHNvIHdlIG5lZWQgdG8gY2hlY2sgdGhlIGNsaWVudCByZWN0XG4gICAgdmFyIHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4gIShyZWN0LndpZHRoIHx8IHJlY3QuaGVpZ2h0KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gIShlbC5vZmZzZXRXaWR0aCB8fCBlbC5vZmZzZXRIZWlnaHQgfHwgZWwuZ2V0Q2xpZW50UmVjdHMoKS5sZW5ndGgpO1xuICB9XG59XG5cbnZhciB0cmFuc2l0aW9uJDEgPSB7XG5cbiAgcHJpb3JpdHk6IFRSQU5TSVRJT04sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoaWQsIG9sZElkKSB7XG4gICAgdmFyIGVsID0gdGhpcy5lbDtcbiAgICAvLyByZXNvbHZlIG9uIG93bmVyIHZtXG4gICAgdmFyIGhvb2tzID0gcmVzb2x2ZUFzc2V0KHRoaXMudm0uJG9wdGlvbnMsICd0cmFuc2l0aW9ucycsIGlkKTtcbiAgICBpZCA9IGlkIHx8ICd2JztcbiAgICBlbC5fX3ZfdHJhbnMgPSBuZXcgVHJhbnNpdGlvbihlbCwgaWQsIGhvb2tzLCB0aGlzLnZtKTtcbiAgICBpZiAob2xkSWQpIHtcbiAgICAgIHJlbW92ZUNsYXNzKGVsLCBvbGRJZCArICctdHJhbnNpdGlvbicpO1xuICAgIH1cbiAgICBhZGRDbGFzcyhlbCwgaWQgKyAnLXRyYW5zaXRpb24nKTtcbiAgfVxufTtcblxudmFyIGludGVybmFsRGlyZWN0aXZlcyA9IHtcbiAgc3R5bGU6IHN0eWxlLFxuICAnY2xhc3MnOiB2Q2xhc3MsXG4gIGNvbXBvbmVudDogY29tcG9uZW50LFxuICBwcm9wOiBwcm9wRGVmLFxuICB0cmFuc2l0aW9uOiB0cmFuc2l0aW9uJDFcbn07XG5cbnZhciBwcm9wQmluZGluZ01vZGVzID0gY29uZmlnLl9wcm9wQmluZGluZ01vZGVzO1xudmFyIGVtcHR5ID0ge307XG5cbi8vIHJlZ2V4ZXNcbnZhciBpZGVudFJFJDEgPSAvXlskX2EtekEtWl0rW1xcdyRdKiQvO1xudmFyIHNldHRhYmxlUGF0aFJFID0gL15bQS1aYS16XyRdW1xcdyRdKihcXC5bQS1aYS16XyRdW1xcdyRdKnxcXFtbXlxcW1xcXV0rXFxdKSokLztcblxuLyoqXG4gKiBDb21waWxlIHByb3BzIG9uIGEgcm9vdCBlbGVtZW50IGFuZCByZXR1cm5cbiAqIGEgcHJvcHMgbGluayBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR8RG9jdW1lbnRGcmFnbWVudH0gZWxcbiAqIEBwYXJhbSB7QXJyYXl9IHByb3BPcHRpb25zXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gcHJvcHNMaW5rRm5cbiAqL1xuXG5mdW5jdGlvbiBjb21waWxlUHJvcHMoZWwsIHByb3BPcHRpb25zKSB7XG4gIHZhciBwcm9wcyA9IFtdO1xuICB2YXIgbmFtZXMgPSBPYmplY3Qua2V5cyhwcm9wT3B0aW9ucyk7XG4gIHZhciBpID0gbmFtZXMubGVuZ3RoO1xuICB2YXIgb3B0aW9ucywgbmFtZSwgYXR0ciwgdmFsdWUsIHBhdGgsIHBhcnNlZCwgcHJvcDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG5hbWUgPSBuYW1lc1tpXTtcbiAgICBvcHRpb25zID0gcHJvcE9wdGlvbnNbbmFtZV0gfHwgZW1wdHk7XG5cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBuYW1lID09PSAnJGRhdGEnKSB7XG4gICAgICB3YXJuKCdEbyBub3QgdXNlICRkYXRhIGFzIHByb3AuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBwcm9wcyBjb3VsZCBjb250YWluIGRhc2hlcywgd2hpY2ggd2lsbCBiZVxuICAgIC8vIGludGVycHJldGVkIGFzIG1pbnVzIGNhbGN1bGF0aW9ucyBieSB0aGUgcGFyc2VyXG4gICAgLy8gc28gd2UgbmVlZCB0byBjYW1lbGl6ZSB0aGUgcGF0aCBoZXJlXG4gICAgcGF0aCA9IGNhbWVsaXplKG5hbWUpO1xuICAgIGlmICghaWRlbnRSRSQxLnRlc3QocGF0aCkpIHtcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybignSW52YWxpZCBwcm9wIGtleTogXCInICsgbmFtZSArICdcIi4gUHJvcCBrZXlzICcgKyAnbXVzdCBiZSB2YWxpZCBpZGVudGlmaWVycy4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHByb3AgPSB7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgcGF0aDogcGF0aCxcbiAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXG4gICAgICBtb2RlOiBwcm9wQmluZGluZ01vZGVzLk9ORV9XQVksXG4gICAgICByYXc6IG51bGxcbiAgICB9O1xuXG4gICAgYXR0ciA9IGh5cGhlbmF0ZShuYW1lKTtcbiAgICAvLyBmaXJzdCBjaGVjayBkeW5hbWljIHZlcnNpb25cbiAgICBpZiAoKHZhbHVlID0gZ2V0QmluZEF0dHIoZWwsIGF0dHIpKSA9PT0gbnVsbCkge1xuICAgICAgaWYgKCh2YWx1ZSA9IGdldEJpbmRBdHRyKGVsLCBhdHRyICsgJy5zeW5jJykpICE9PSBudWxsKSB7XG4gICAgICAgIHByb3AubW9kZSA9IHByb3BCaW5kaW5nTW9kZXMuVFdPX1dBWTtcbiAgICAgIH0gZWxzZSBpZiAoKHZhbHVlID0gZ2V0QmluZEF0dHIoZWwsIGF0dHIgKyAnLm9uY2UnKSkgIT09IG51bGwpIHtcbiAgICAgICAgcHJvcC5tb2RlID0gcHJvcEJpbmRpbmdNb2Rlcy5PTkVfVElNRTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAvLyBoYXMgZHluYW1pYyBiaW5kaW5nIVxuICAgICAgcHJvcC5yYXcgPSB2YWx1ZTtcbiAgICAgIHBhcnNlZCA9IHBhcnNlRGlyZWN0aXZlKHZhbHVlKTtcbiAgICAgIHZhbHVlID0gcGFyc2VkLmV4cHJlc3Npb247XG4gICAgICBwcm9wLmZpbHRlcnMgPSBwYXJzZWQuZmlsdGVycztcbiAgICAgIC8vIGNoZWNrIGJpbmRpbmcgdHlwZVxuICAgICAgaWYgKGlzTGl0ZXJhbCh2YWx1ZSkgJiYgIXBhcnNlZC5maWx0ZXJzKSB7XG4gICAgICAgIC8vIGZvciBleHByZXNzaW9ucyBjb250YWluaW5nIGxpdGVyYWwgbnVtYmVycyBhbmRcbiAgICAgICAgLy8gYm9vbGVhbnMsIHRoZXJlJ3Mgbm8gbmVlZCB0byBzZXR1cCBhIHByb3AgYmluZGluZyxcbiAgICAgICAgLy8gc28gd2UgY2FuIG9wdGltaXplIHRoZW0gYXMgYSBvbmUtdGltZSBzZXQuXG4gICAgICAgIHByb3Aub3B0aW1pemVkTGl0ZXJhbCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9wLmR5bmFtaWMgPSB0cnVlO1xuICAgICAgICAvLyBjaGVjayBub24tc2V0dGFibGUgcGF0aCBmb3IgdHdvLXdheSBiaW5kaW5nc1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBwcm9wLm1vZGUgPT09IHByb3BCaW5kaW5nTW9kZXMuVFdPX1dBWSAmJiAhc2V0dGFibGVQYXRoUkUudGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICBwcm9wLm1vZGUgPSBwcm9wQmluZGluZ01vZGVzLk9ORV9XQVk7XG4gICAgICAgICAgd2FybignQ2Fubm90IGJpbmQgdHdvLXdheSBwcm9wIHdpdGggbm9uLXNldHRhYmxlICcgKyAncGFyZW50IHBhdGg6ICcgKyB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHByb3AucGFyZW50UGF0aCA9IHZhbHVlO1xuXG4gICAgICAvLyB3YXJuIHJlcXVpcmVkIHR3by13YXlcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIG9wdGlvbnMudHdvV2F5ICYmIHByb3AubW9kZSAhPT0gcHJvcEJpbmRpbmdNb2Rlcy5UV09fV0FZKSB7XG4gICAgICAgIHdhcm4oJ1Byb3AgXCInICsgbmFtZSArICdcIiBleHBlY3RzIGEgdHdvLXdheSBiaW5kaW5nIHR5cGUuJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICgodmFsdWUgPSBnZXRBdHRyKGVsLCBhdHRyKSkgIT09IG51bGwpIHtcbiAgICAgIC8vIGhhcyBsaXRlcmFsIGJpbmRpbmchXG4gICAgICBwcm9wLnJhdyA9IHZhbHVlO1xuICAgIH0gZWxzZSBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgLy8gY2hlY2sgcG9zc2libGUgY2FtZWxDYXNlIHByb3AgdXNhZ2VcbiAgICAgIHZhciBsb3dlckNhc2VOYW1lID0gcGF0aC50b0xvd2VyQ2FzZSgpO1xuICAgICAgdmFsdWUgPSAvW0EtWlxcLV0vLnRlc3QobmFtZSkgJiYgKGVsLmdldEF0dHJpYnV0ZShsb3dlckNhc2VOYW1lKSB8fCBlbC5nZXRBdHRyaWJ1dGUoJzonICsgbG93ZXJDYXNlTmFtZSkgfHwgZWwuZ2V0QXR0cmlidXRlKCd2LWJpbmQ6JyArIGxvd2VyQ2FzZU5hbWUpIHx8IGVsLmdldEF0dHJpYnV0ZSgnOicgKyBsb3dlckNhc2VOYW1lICsgJy5vbmNlJykgfHwgZWwuZ2V0QXR0cmlidXRlKCd2LWJpbmQ6JyArIGxvd2VyQ2FzZU5hbWUgKyAnLm9uY2UnKSB8fCBlbC5nZXRBdHRyaWJ1dGUoJzonICsgbG93ZXJDYXNlTmFtZSArICcuc3luYycpIHx8IGVsLmdldEF0dHJpYnV0ZSgndi1iaW5kOicgKyBsb3dlckNhc2VOYW1lICsgJy5zeW5jJykpO1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHdhcm4oJ1Bvc3NpYmxlIHVzYWdlIGVycm9yIGZvciBwcm9wIGAnICsgbG93ZXJDYXNlTmFtZSArICdgIC0gJyArICdkaWQgeW91IG1lYW4gYCcgKyBhdHRyICsgJ2A/IEhUTUwgaXMgY2FzZS1pbnNlbnNpdGl2ZSwgcmVtZW1iZXIgdG8gdXNlICcgKyAna2ViYWItY2FzZSBmb3IgcHJvcHMgaW4gdGVtcGxhdGVzLicpO1xuICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnJlcXVpcmVkKSB7XG4gICAgICAgIC8vIHdhcm4gbWlzc2luZyByZXF1aXJlZFxuICAgICAgICB3YXJuKCdNaXNzaW5nIHJlcXVpcmVkIHByb3A6ICcgKyBuYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gcHVzaCBwcm9wXG4gICAgcHJvcHMucHVzaChwcm9wKTtcbiAgfVxuICByZXR1cm4gbWFrZVByb3BzTGlua0ZuKHByb3BzKTtcbn1cblxuLyoqXG4gKiBCdWlsZCBhIGZ1bmN0aW9uIHRoYXQgYXBwbGllcyBwcm9wcyB0byBhIHZtLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHByb3BzXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gcHJvcHNMaW5rRm5cbiAqL1xuXG5mdW5jdGlvbiBtYWtlUHJvcHNMaW5rRm4ocHJvcHMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHByb3BzTGlua0ZuKHZtLCBzY29wZSkge1xuICAgIC8vIHN0b3JlIHJlc29sdmVkIHByb3BzIGluZm9cbiAgICB2bS5fcHJvcHMgPSB7fTtcbiAgICB2YXIgaSA9IHByb3BzLmxlbmd0aDtcbiAgICB2YXIgcHJvcCwgcGF0aCwgb3B0aW9ucywgdmFsdWUsIHJhdztcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBwcm9wID0gcHJvcHNbaV07XG4gICAgICByYXcgPSBwcm9wLnJhdztcbiAgICAgIHBhdGggPSBwcm9wLnBhdGg7XG4gICAgICBvcHRpb25zID0gcHJvcC5vcHRpb25zO1xuICAgICAgdm0uX3Byb3BzW3BhdGhdID0gcHJvcDtcbiAgICAgIGlmIChyYXcgPT09IG51bGwpIHtcbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBhYnNlbnQgcHJvcFxuICAgICAgICBpbml0UHJvcCh2bSwgcHJvcCwgZ2V0RGVmYXVsdCh2bSwgb3B0aW9ucykpO1xuICAgICAgfSBlbHNlIGlmIChwcm9wLmR5bmFtaWMpIHtcbiAgICAgICAgLy8gZHluYW1pYyBwcm9wXG4gICAgICAgIGlmIChwcm9wLm1vZGUgPT09IHByb3BCaW5kaW5nTW9kZXMuT05FX1RJTUUpIHtcbiAgICAgICAgICAvLyBvbmUgdGltZSBiaW5kaW5nXG4gICAgICAgICAgdmFsdWUgPSAoc2NvcGUgfHwgdm0uX2NvbnRleHQgfHwgdm0pLiRnZXQocHJvcC5wYXJlbnRQYXRoKTtcbiAgICAgICAgICBpbml0UHJvcCh2bSwgcHJvcCwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh2bS5fY29udGV4dCkge1xuICAgICAgICAgICAgLy8gZHluYW1pYyBiaW5kaW5nXG4gICAgICAgICAgICB2bS5fYmluZERpcih7XG4gICAgICAgICAgICAgIG5hbWU6ICdwcm9wJyxcbiAgICAgICAgICAgICAgZGVmOiBwcm9wRGVmLFxuICAgICAgICAgICAgICBwcm9wOiBwcm9wXG4gICAgICAgICAgICB9LCBudWxsLCBudWxsLCBzY29wZSk7IC8vIGVsLCBob3N0LCBzY29wZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIHJvb3QgaW5zdGFuY2VcbiAgICAgICAgICAgICAgaW5pdFByb3Aodm0sIHByb3AsIHZtLiRnZXQocHJvcC5wYXJlbnRQYXRoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocHJvcC5vcHRpbWl6ZWRMaXRlcmFsKSB7XG4gICAgICAgIC8vIG9wdGltaXplZCBsaXRlcmFsLCBjYXN0IGl0IGFuZCBqdXN0IHNldCBvbmNlXG4gICAgICAgIHZhciBzdHJpcHBlZCA9IHN0cmlwUXVvdGVzKHJhdyk7XG4gICAgICAgIHZhbHVlID0gc3RyaXBwZWQgPT09IHJhdyA/IHRvQm9vbGVhbih0b051bWJlcihyYXcpKSA6IHN0cmlwcGVkO1xuICAgICAgICBpbml0UHJvcCh2bSwgcHJvcCwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gc3RyaW5nIGxpdGVyYWwsIGJ1dCB3ZSBuZWVkIHRvIGNhdGVyIGZvclxuICAgICAgICAvLyBCb29sZWFuIHByb3BzIHdpdGggbm8gdmFsdWVcbiAgICAgICAgdmFsdWUgPSBvcHRpb25zLnR5cGUgPT09IEJvb2xlYW4gJiYgcmF3ID09PSAnJyA/IHRydWUgOiByYXc7XG4gICAgICAgIGluaXRQcm9wKHZtLCBwcm9wLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIEdldCB0aGUgZGVmYXVsdCB2YWx1ZSBvZiBhIHByb3AuXG4gKlxuICogQHBhcmFtIHtWdWV9IHZtXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7Kn1cbiAqL1xuXG5mdW5jdGlvbiBnZXREZWZhdWx0KHZtLCBvcHRpb25zKSB7XG4gIC8vIG5vIGRlZmF1bHQsIHJldHVybiB1bmRlZmluZWRcbiAgaWYgKCFoYXNPd24ob3B0aW9ucywgJ2RlZmF1bHQnKSkge1xuICAgIC8vIGFic2VudCBib29sZWFuIHZhbHVlIGRlZmF1bHRzIHRvIGZhbHNlXG4gICAgcmV0dXJuIG9wdGlvbnMudHlwZSA9PT0gQm9vbGVhbiA/IGZhbHNlIDogdW5kZWZpbmVkO1xuICB9XG4gIHZhciBkZWYgPSBvcHRpb25zWydkZWZhdWx0J107XG4gIC8vIHdhcm4gYWdhaW5zdCBub24tZmFjdG9yeSBkZWZhdWx0cyBmb3IgT2JqZWN0ICYgQXJyYXlcbiAgaWYgKGlzT2JqZWN0KGRlZikpIHtcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ09iamVjdC9BcnJheSBhcyBkZWZhdWx0IHByb3AgdmFsdWVzIHdpbGwgYmUgc2hhcmVkICcgKyAnYWNyb3NzIG11bHRpcGxlIGluc3RhbmNlcy4gVXNlIGEgZmFjdG9yeSBmdW5jdGlvbiAnICsgJ3RvIHJldHVybiB0aGUgZGVmYXVsdCB2YWx1ZSBpbnN0ZWFkLicpO1xuICB9XG4gIC8vIGNhbGwgZmFjdG9yeSBmdW5jdGlvbiBmb3Igbm9uLUZ1bmN0aW9uIHR5cGVzXG4gIHJldHVybiB0eXBlb2YgZGVmID09PSAnZnVuY3Rpb24nICYmIG9wdGlvbnMudHlwZSAhPT0gRnVuY3Rpb24gPyBkZWYuY2FsbCh2bSkgOiBkZWY7XG59XG5cbi8vIHNwZWNpYWwgYmluZGluZyBwcmVmaXhlc1xudmFyIGJpbmRSRSA9IC9edi1iaW5kOnxeOi87XG52YXIgb25SRSA9IC9edi1vbjp8XkAvO1xudmFyIGRpckF0dHJSRSA9IC9edi0oW146XSspKD86JHw6KC4qKSQpLztcbnZhciBtb2RpZmllclJFID0gL1xcLlteXFwuXSsvZztcbnZhciB0cmFuc2l0aW9uUkUgPSAvXih2LWJpbmQ6fDopP3RyYW5zaXRpb24kLztcblxuLy8gdGVybWluYWwgZGlyZWN0aXZlc1xudmFyIHRlcm1pbmFsRGlyZWN0aXZlcyA9IFsnZm9yJywgJ2lmJ107XG5cbi8vIGRlZmF1bHQgZGlyZWN0aXZlIHByaW9yaXR5XG52YXIgREVGQVVMVF9QUklPUklUWSA9IDEwMDA7XG5cbi8qKlxuICogQ29tcGlsZSBhIHRlbXBsYXRlIGFuZCByZXR1cm4gYSByZXVzYWJsZSBjb21wb3NpdGUgbGlua1xuICogZnVuY3Rpb24sIHdoaWNoIHJlY3Vyc2l2ZWx5IGNvbnRhaW5zIG1vcmUgbGluayBmdW5jdGlvbnNcbiAqIGluc2lkZS4gVGhpcyB0b3AgbGV2ZWwgY29tcGlsZSBmdW5jdGlvbiB3b3VsZCBub3JtYWxseVxuICogYmUgY2FsbGVkIG9uIGluc3RhbmNlIHJvb3Qgbm9kZXMsIGJ1dCBjYW4gYWxzbyBiZSB1c2VkXG4gKiBmb3IgcGFydGlhbCBjb21waWxhdGlvbiBpZiB0aGUgcGFydGlhbCBhcmd1bWVudCBpcyB0cnVlLlxuICpcbiAqIFRoZSByZXR1cm5lZCBjb21wb3NpdGUgbGluayBmdW5jdGlvbiwgd2hlbiBjYWxsZWQsIHdpbGxcbiAqIHJldHVybiBhbiB1bmxpbmsgZnVuY3Rpb24gdGhhdCB0ZWFyc2Rvd24gYWxsIGRpcmVjdGl2ZXNcbiAqIGNyZWF0ZWQgZHVyaW5nIHRoZSBsaW5raW5nIHBoYXNlLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudHxEb2N1bWVudEZyYWdtZW50fSBlbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcGFydGlhbFxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gY29tcGlsZShlbCwgb3B0aW9ucywgcGFydGlhbCkge1xuICAvLyBsaW5rIGZ1bmN0aW9uIGZvciB0aGUgbm9kZSBpdHNlbGYuXG4gIHZhciBub2RlTGlua0ZuID0gcGFydGlhbCB8fCAhb3B0aW9ucy5fYXNDb21wb25lbnQgPyBjb21waWxlTm9kZShlbCwgb3B0aW9ucykgOiBudWxsO1xuICAvLyBsaW5rIGZ1bmN0aW9uIGZvciB0aGUgY2hpbGROb2Rlc1xuICB2YXIgY2hpbGRMaW5rRm4gPSAhKG5vZGVMaW5rRm4gJiYgbm9kZUxpbmtGbi50ZXJtaW5hbCkgJiYgZWwudGFnTmFtZSAhPT0gJ1NDUklQVCcgJiYgZWwuaGFzQ2hpbGROb2RlcygpID8gY29tcGlsZU5vZGVMaXN0KGVsLmNoaWxkTm9kZXMsIG9wdGlvbnMpIDogbnVsbDtcblxuICAvKipcbiAgICogQSBjb21wb3NpdGUgbGlua2VyIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBhIGFscmVhZHlcbiAgICogY29tcGlsZWQgcGllY2Ugb2YgRE9NLCB3aGljaCBpbnN0YW50aWF0ZXMgYWxsIGRpcmVjdGl2ZVxuICAgKiBpbnN0YW5jZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7VnVlfSB2bVxuICAgKiBAcGFyYW0ge0VsZW1lbnR8RG9jdW1lbnRGcmFnbWVudH0gZWxcbiAgICogQHBhcmFtIHtWdWV9IFtob3N0XSAtIGhvc3Qgdm0gb2YgdHJhbnNjbHVkZWQgY29udGVudFxuICAgKiBAcGFyYW0ge09iamVjdH0gW3Njb3BlXSAtIHYtZm9yIHNjb3BlXG4gICAqIEBwYXJhbSB7RnJhZ21lbnR9IFtmcmFnXSAtIGxpbmsgY29udGV4dCBmcmFnbWVudFxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbnx1bmRlZmluZWR9XG4gICAqL1xuXG4gIHJldHVybiBmdW5jdGlvbiBjb21wb3NpdGVMaW5rRm4odm0sIGVsLCBob3N0LCBzY29wZSwgZnJhZykge1xuICAgIC8vIGNhY2hlIGNoaWxkTm9kZXMgYmVmb3JlIGxpbmtpbmcgcGFyZW50LCBmaXggIzY1N1xuICAgIHZhciBjaGlsZE5vZGVzID0gdG9BcnJheShlbC5jaGlsZE5vZGVzKTtcbiAgICAvLyBsaW5rXG4gICAgdmFyIGRpcnMgPSBsaW5rQW5kQ2FwdHVyZShmdW5jdGlvbiBjb21wb3NpdGVMaW5rQ2FwdHVyZXIoKSB7XG4gICAgICBpZiAobm9kZUxpbmtGbikgbm9kZUxpbmtGbih2bSwgZWwsIGhvc3QsIHNjb3BlLCBmcmFnKTtcbiAgICAgIGlmIChjaGlsZExpbmtGbikgY2hpbGRMaW5rRm4odm0sIGNoaWxkTm9kZXMsIGhvc3QsIHNjb3BlLCBmcmFnKTtcbiAgICB9LCB2bSk7XG4gICAgcmV0dXJuIG1ha2VVbmxpbmtGbih2bSwgZGlycyk7XG4gIH07XG59XG5cbi8qKlxuICogQXBwbHkgYSBsaW5rZXIgdG8gYSB2bS9lbGVtZW50IHBhaXIgYW5kIGNhcHR1cmUgdGhlXG4gKiBkaXJlY3RpdmVzIGNyZWF0ZWQgZHVyaW5nIHRoZSBwcm9jZXNzLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGxpbmtlclxuICogQHBhcmFtIHtWdWV9IHZtXG4gKi9cblxuZnVuY3Rpb24gbGlua0FuZENhcHR1cmUobGlua2VyLCB2bSkge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpIHtcbiAgICAvLyByZXNldCBkaXJlY3RpdmVzIGJlZm9yZSBldmVyeSBjYXB0dXJlIGluIHByb2R1Y3Rpb25cbiAgICAvLyBtb2RlLCBzbyB0aGF0IHdoZW4gdW5saW5raW5nIHdlIGRvbid0IG5lZWQgdG8gc3BsaWNlXG4gICAgLy8gdGhlbSBvdXQgKHdoaWNoIHR1cm5zIG91dCB0byBiZSBhIHBlcmYgaGl0KS5cbiAgICAvLyB0aGV5IGFyZSBrZXB0IGluIGRldmVsb3BtZW50IG1vZGUgYmVjYXVzZSB0aGV5IGFyZVxuICAgIC8vIHVzZWZ1bCBmb3IgVnVlJ3Mgb3duIHRlc3RzLlxuICAgIHZtLl9kaXJlY3RpdmVzID0gW107XG4gIH1cbiAgdmFyIG9yaWdpbmFsRGlyQ291bnQgPSB2bS5fZGlyZWN0aXZlcy5sZW5ndGg7XG4gIGxpbmtlcigpO1xuICB2YXIgZGlycyA9IHZtLl9kaXJlY3RpdmVzLnNsaWNlKG9yaWdpbmFsRGlyQ291bnQpO1xuICBkaXJzLnNvcnQoZGlyZWN0aXZlQ29tcGFyYXRvcik7XG4gIGZvciAodmFyIGkgPSAwLCBsID0gZGlycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBkaXJzW2ldLl9iaW5kKCk7XG4gIH1cbiAgcmV0dXJuIGRpcnM7XG59XG5cbi8qKlxuICogRGlyZWN0aXZlIHByaW9yaXR5IHNvcnQgY29tcGFyYXRvclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhXG4gKiBAcGFyYW0ge09iamVjdH0gYlxuICovXG5cbmZ1bmN0aW9uIGRpcmVjdGl2ZUNvbXBhcmF0b3IoYSwgYikge1xuICBhID0gYS5kZXNjcmlwdG9yLmRlZi5wcmlvcml0eSB8fCBERUZBVUxUX1BSSU9SSVRZO1xuICBiID0gYi5kZXNjcmlwdG9yLmRlZi5wcmlvcml0eSB8fCBERUZBVUxUX1BSSU9SSVRZO1xuICByZXR1cm4gYSA+IGIgPyAtMSA6IGEgPT09IGIgPyAwIDogMTtcbn1cblxuLyoqXG4gKiBMaW5rZXIgZnVuY3Rpb25zIHJldHVybiBhbiB1bmxpbmsgZnVuY3Rpb24gdGhhdFxuICogdGVhcnNkb3duIGFsbCBkaXJlY3RpdmVzIGluc3RhbmNlcyBnZW5lcmF0ZWQgZHVyaW5nXG4gKiB0aGUgcHJvY2Vzcy5cbiAqXG4gKiBXZSBjcmVhdGUgdW5saW5rIGZ1bmN0aW9ucyB3aXRoIG9ubHkgdGhlIG5lY2Vzc2FyeVxuICogaW5mb3JtYXRpb24gdG8gYXZvaWQgcmV0YWluaW5nIGFkZGl0aW9uYWwgY2xvc3VyZXMuXG4gKlxuICogQHBhcmFtIHtWdWV9IHZtXG4gKiBAcGFyYW0ge0FycmF5fSBkaXJzXG4gKiBAcGFyYW0ge1Z1ZX0gW2NvbnRleHRdXG4gKiBAcGFyYW0ge0FycmF5fSBbY29udGV4dERpcnNdXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5mdW5jdGlvbiBtYWtlVW5saW5rRm4odm0sIGRpcnMsIGNvbnRleHQsIGNvbnRleHREaXJzKSB7XG4gIGZ1bmN0aW9uIHVubGluayhkZXN0cm95aW5nKSB7XG4gICAgdGVhcmRvd25EaXJzKHZtLCBkaXJzLCBkZXN0cm95aW5nKTtcbiAgICBpZiAoY29udGV4dCAmJiBjb250ZXh0RGlycykge1xuICAgICAgdGVhcmRvd25EaXJzKGNvbnRleHQsIGNvbnRleHREaXJzKTtcbiAgICB9XG4gIH1cbiAgLy8gZXhwb3NlIGxpbmtlZCBkaXJlY3RpdmVzXG4gIHVubGluay5kaXJzID0gZGlycztcbiAgcmV0dXJuIHVubGluaztcbn1cblxuLyoqXG4gKiBUZWFyZG93biBwYXJ0aWFsIGxpbmtlZCBkaXJlY3RpdmVzLlxuICpcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtBcnJheX0gZGlyc1xuICogQHBhcmFtIHtCb29sZWFufSBkZXN0cm95aW5nXG4gKi9cblxuZnVuY3Rpb24gdGVhcmRvd25EaXJzKHZtLCBkaXJzLCBkZXN0cm95aW5nKSB7XG4gIHZhciBpID0gZGlycy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBkaXJzW2ldLl90ZWFyZG93bigpO1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmICFkZXN0cm95aW5nKSB7XG4gICAgICB2bS5fZGlyZWN0aXZlcy4kcmVtb3ZlKGRpcnNbaV0pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENvbXBpbGUgbGluayBwcm9wcyBvbiBhbiBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1Z1ZX0gdm1cbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wc1xuICogQHBhcmFtIHtPYmplY3R9IFtzY29wZV1cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmZ1bmN0aW9uIGNvbXBpbGVBbmRMaW5rUHJvcHModm0sIGVsLCBwcm9wcywgc2NvcGUpIHtcbiAgdmFyIHByb3BzTGlua0ZuID0gY29tcGlsZVByb3BzKGVsLCBwcm9wcyk7XG4gIHZhciBwcm9wRGlycyA9IGxpbmtBbmRDYXB0dXJlKGZ1bmN0aW9uICgpIHtcbiAgICBwcm9wc0xpbmtGbih2bSwgc2NvcGUpO1xuICB9LCB2bSk7XG4gIHJldHVybiBtYWtlVW5saW5rRm4odm0sIHByb3BEaXJzKTtcbn1cblxuLyoqXG4gKiBDb21waWxlIHRoZSByb290IGVsZW1lbnQgb2YgYW4gaW5zdGFuY2UuXG4gKlxuICogMS4gYXR0cnMgb24gY29udGV4dCBjb250YWluZXIgKGNvbnRleHQgc2NvcGUpXG4gKiAyLiBhdHRycyBvbiB0aGUgY29tcG9uZW50IHRlbXBsYXRlIHJvb3Qgbm9kZSwgaWZcbiAqICAgIHJlcGxhY2U6dHJ1ZSAoY2hpbGQgc2NvcGUpXG4gKlxuICogSWYgdGhpcyBpcyBhIGZyYWdtZW50IGluc3RhbmNlLCB3ZSBvbmx5IG5lZWQgdG8gY29tcGlsZSAxLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dE9wdGlvbnNcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmZ1bmN0aW9uIGNvbXBpbGVSb290KGVsLCBvcHRpb25zLCBjb250ZXh0T3B0aW9ucykge1xuICB2YXIgY29udGFpbmVyQXR0cnMgPSBvcHRpb25zLl9jb250YWluZXJBdHRycztcbiAgdmFyIHJlcGxhY2VyQXR0cnMgPSBvcHRpb25zLl9yZXBsYWNlckF0dHJzO1xuICB2YXIgY29udGV4dExpbmtGbiwgcmVwbGFjZXJMaW5rRm47XG5cbiAgLy8gb25seSBuZWVkIHRvIGNvbXBpbGUgb3RoZXIgYXR0cmlidXRlcyBmb3JcbiAgLy8gbm9uLWZyYWdtZW50IGluc3RhbmNlc1xuICBpZiAoZWwubm9kZVR5cGUgIT09IDExKSB7XG4gICAgLy8gZm9yIGNvbXBvbmVudHMsIGNvbnRhaW5lciBhbmQgcmVwbGFjZXIgbmVlZCB0byBiZVxuICAgIC8vIGNvbXBpbGVkIHNlcGFyYXRlbHkgYW5kIGxpbmtlZCBpbiBkaWZmZXJlbnQgc2NvcGVzLlxuICAgIGlmIChvcHRpb25zLl9hc0NvbXBvbmVudCkge1xuICAgICAgLy8gMi4gY29udGFpbmVyIGF0dHJpYnV0ZXNcbiAgICAgIGlmIChjb250YWluZXJBdHRycyAmJiBjb250ZXh0T3B0aW9ucykge1xuICAgICAgICBjb250ZXh0TGlua0ZuID0gY29tcGlsZURpcmVjdGl2ZXMoY29udGFpbmVyQXR0cnMsIGNvbnRleHRPcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXBsYWNlckF0dHJzKSB7XG4gICAgICAgIC8vIDMuIHJlcGxhY2VyIGF0dHJpYnV0ZXNcbiAgICAgICAgcmVwbGFjZXJMaW5rRm4gPSBjb21waWxlRGlyZWN0aXZlcyhyZXBsYWNlckF0dHJzLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gbm9uLWNvbXBvbmVudCwganVzdCBjb21waWxlIGFzIGEgbm9ybWFsIGVsZW1lbnQuXG4gICAgICByZXBsYWNlckxpbmtGbiA9IGNvbXBpbGVEaXJlY3RpdmVzKGVsLmF0dHJpYnV0ZXMsIG9wdGlvbnMpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGNvbnRhaW5lckF0dHJzKSB7XG4gICAgLy8gd2FybiBjb250YWluZXIgZGlyZWN0aXZlcyBmb3IgZnJhZ21lbnQgaW5zdGFuY2VzXG4gICAgdmFyIG5hbWVzID0gY29udGFpbmVyQXR0cnMuZmlsdGVyKGZ1bmN0aW9uIChhdHRyKSB7XG4gICAgICAvLyBhbGxvdyB2dWUtbG9hZGVyL3Z1ZWlmeSBzY29wZWQgY3NzIGF0dHJpYnV0ZXNcbiAgICAgIHJldHVybiBhdHRyLm5hbWUuaW5kZXhPZignX3YtJykgPCAwICYmXG4gICAgICAvLyBhbGxvdyBldmVudCBsaXN0ZW5lcnNcbiAgICAgICFvblJFLnRlc3QoYXR0ci5uYW1lKSAmJlxuICAgICAgLy8gYWxsb3cgc2xvdHNcbiAgICAgIGF0dHIubmFtZSAhPT0gJ3Nsb3QnO1xuICAgIH0pLm1hcChmdW5jdGlvbiAoYXR0cikge1xuICAgICAgcmV0dXJuICdcIicgKyBhdHRyLm5hbWUgKyAnXCInO1xuICAgIH0pO1xuICAgIGlmIChuYW1lcy5sZW5ndGgpIHtcbiAgICAgIHZhciBwbHVyYWwgPSBuYW1lcy5sZW5ndGggPiAxO1xuICAgICAgd2FybignQXR0cmlidXRlJyArIChwbHVyYWwgPyAncyAnIDogJyAnKSArIG5hbWVzLmpvaW4oJywgJykgKyAocGx1cmFsID8gJyBhcmUnIDogJyBpcycpICsgJyBpZ25vcmVkIG9uIGNvbXBvbmVudCAnICsgJzwnICsgb3B0aW9ucy5lbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgKyAnPiBiZWNhdXNlICcgKyAndGhlIGNvbXBvbmVudCBpcyBhIGZyYWdtZW50IGluc3RhbmNlOiAnICsgJ2h0dHA6Ly92dWVqcy5vcmcvZ3VpZGUvY29tcG9uZW50cy5odG1sI0ZyYWdtZW50X0luc3RhbmNlJyk7XG4gICAgfVxuICB9XG5cbiAgb3B0aW9ucy5fY29udGFpbmVyQXR0cnMgPSBvcHRpb25zLl9yZXBsYWNlckF0dHJzID0gbnVsbDtcbiAgcmV0dXJuIGZ1bmN0aW9uIHJvb3RMaW5rRm4odm0sIGVsLCBzY29wZSkge1xuICAgIC8vIGxpbmsgY29udGV4dCBzY29wZSBkaXJzXG4gICAgdmFyIGNvbnRleHQgPSB2bS5fY29udGV4dDtcbiAgICB2YXIgY29udGV4dERpcnM7XG4gICAgaWYgKGNvbnRleHQgJiYgY29udGV4dExpbmtGbikge1xuICAgICAgY29udGV4dERpcnMgPSBsaW5rQW5kQ2FwdHVyZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnRleHRMaW5rRm4oY29udGV4dCwgZWwsIG51bGwsIHNjb3BlKTtcbiAgICAgIH0sIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIGxpbmsgc2VsZlxuICAgIHZhciBzZWxmRGlycyA9IGxpbmtBbmRDYXB0dXJlKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChyZXBsYWNlckxpbmtGbikgcmVwbGFjZXJMaW5rRm4odm0sIGVsKTtcbiAgICB9LCB2bSk7XG5cbiAgICAvLyByZXR1cm4gdGhlIHVubGluayBmdW5jdGlvbiB0aGF0IHRlYXJzZG93biBjb250ZXh0XG4gICAgLy8gY29udGFpbmVyIGRpcmVjdGl2ZXMuXG4gICAgcmV0dXJuIG1ha2VVbmxpbmtGbih2bSwgc2VsZkRpcnMsIGNvbnRleHQsIGNvbnRleHREaXJzKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBDb21waWxlIGEgbm9kZSBhbmQgcmV0dXJuIGEgbm9kZUxpbmtGbiBiYXNlZCBvbiB0aGVcbiAqIG5vZGUgdHlwZS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtGdW5jdGlvbnxudWxsfVxuICovXG5cbmZ1bmN0aW9uIGNvbXBpbGVOb2RlKG5vZGUsIG9wdGlvbnMpIHtcbiAgdmFyIHR5cGUgPSBub2RlLm5vZGVUeXBlO1xuICBpZiAodHlwZSA9PT0gMSAmJiBub2RlLnRhZ05hbWUgIT09ICdTQ1JJUFQnKSB7XG4gICAgcmV0dXJuIGNvbXBpbGVFbGVtZW50KG5vZGUsIG9wdGlvbnMpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09IDMgJiYgbm9kZS5kYXRhLnRyaW0oKSkge1xuICAgIHJldHVybiBjb21waWxlVGV4dE5vZGUobm9kZSwgb3B0aW9ucyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21waWxlIGFuIGVsZW1lbnQgYW5kIHJldHVybiBhIG5vZGVMaW5rRm4uXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufG51bGx9XG4gKi9cblxuZnVuY3Rpb24gY29tcGlsZUVsZW1lbnQoZWwsIG9wdGlvbnMpIHtcbiAgLy8gcHJlcHJvY2VzcyB0ZXh0YXJlYXMuXG4gIC8vIHRleHRhcmVhIHRyZWF0cyBpdHMgdGV4dCBjb250ZW50IGFzIHRoZSBpbml0aWFsIHZhbHVlLlxuICAvLyBqdXN0IGJpbmQgaXQgYXMgYW4gYXR0ciBkaXJlY3RpdmUgZm9yIHZhbHVlLlxuICBpZiAoZWwudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJykge1xuICAgIHZhciB0b2tlbnMgPSBwYXJzZVRleHQoZWwudmFsdWUpO1xuICAgIGlmICh0b2tlbnMpIHtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZSgnOnZhbHVlJywgdG9rZW5zVG9FeHAodG9rZW5zKSk7XG4gICAgICBlbC52YWx1ZSA9ICcnO1xuICAgIH1cbiAgfVxuICB2YXIgbGlua0ZuO1xuICB2YXIgaGFzQXR0cnMgPSBlbC5oYXNBdHRyaWJ1dGVzKCk7XG4gIC8vIGNoZWNrIHRlcm1pbmFsIGRpcmVjdGl2ZXMgKGZvciAmIGlmKVxuICBpZiAoaGFzQXR0cnMpIHtcbiAgICBsaW5rRm4gPSBjaGVja1Rlcm1pbmFsRGlyZWN0aXZlcyhlbCwgb3B0aW9ucyk7XG4gIH1cbiAgLy8gY2hlY2sgZWxlbWVudCBkaXJlY3RpdmVzXG4gIGlmICghbGlua0ZuKSB7XG4gICAgbGlua0ZuID0gY2hlY2tFbGVtZW50RGlyZWN0aXZlcyhlbCwgb3B0aW9ucyk7XG4gIH1cbiAgLy8gY2hlY2sgY29tcG9uZW50XG4gIGlmICghbGlua0ZuKSB7XG4gICAgbGlua0ZuID0gY2hlY2tDb21wb25lbnQoZWwsIG9wdGlvbnMpO1xuICB9XG4gIC8vIG5vcm1hbCBkaXJlY3RpdmVzXG4gIGlmICghbGlua0ZuICYmIGhhc0F0dHJzKSB7XG4gICAgbGlua0ZuID0gY29tcGlsZURpcmVjdGl2ZXMoZWwuYXR0cmlidXRlcywgb3B0aW9ucyk7XG4gIH1cbiAgcmV0dXJuIGxpbmtGbjtcbn1cblxuLyoqXG4gKiBDb21waWxlIGEgdGV4dE5vZGUgYW5kIHJldHVybiBhIG5vZGVMaW5rRm4uXG4gKlxuICogQHBhcmFtIHtUZXh0Tm9kZX0gbm9kZVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufG51bGx9IHRleHROb2RlTGlua0ZuXG4gKi9cblxuZnVuY3Rpb24gY29tcGlsZVRleHROb2RlKG5vZGUsIG9wdGlvbnMpIHtcbiAgLy8gc2tpcCBtYXJrZWQgdGV4dCBub2Rlc1xuICBpZiAobm9kZS5fc2tpcCkge1xuICAgIHJldHVybiByZW1vdmVUZXh0O1xuICB9XG5cbiAgdmFyIHRva2VucyA9IHBhcnNlVGV4dChub2RlLndob2xlVGV4dCk7XG4gIGlmICghdG9rZW5zKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBtYXJrIGFkamFjZW50IHRleHQgbm9kZXMgYXMgc2tpcHBlZCxcbiAgLy8gYmVjYXVzZSB3ZSBhcmUgdXNpbmcgbm9kZS53aG9sZVRleHQgdG8gY29tcGlsZVxuICAvLyBhbGwgYWRqYWNlbnQgdGV4dCBub2RlcyB0b2dldGhlci4gVGhpcyBmaXhlc1xuICAvLyBpc3N1ZXMgaW4gSUUgd2hlcmUgc29tZXRpbWVzIGl0IHNwbGl0cyB1cCBhIHNpbmdsZVxuICAvLyB0ZXh0IG5vZGUgaW50byBtdWx0aXBsZSBvbmVzLlxuICB2YXIgbmV4dCA9IG5vZGUubmV4dFNpYmxpbmc7XG4gIHdoaWxlIChuZXh0ICYmIG5leHQubm9kZVR5cGUgPT09IDMpIHtcbiAgICBuZXh0Ll9za2lwID0gdHJ1ZTtcbiAgICBuZXh0ID0gbmV4dC5uZXh0U2libGluZztcbiAgfVxuXG4gIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICB2YXIgZWwsIHRva2VuO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHRva2Vucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB0b2tlbiA9IHRva2Vuc1tpXTtcbiAgICBlbCA9IHRva2VuLnRhZyA/IHByb2Nlc3NUZXh0VG9rZW4odG9rZW4sIG9wdGlvbnMpIDogZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodG9rZW4udmFsdWUpO1xuICAgIGZyYWcuYXBwZW5kQ2hpbGQoZWwpO1xuICB9XG4gIHJldHVybiBtYWtlVGV4dE5vZGVMaW5rRm4odG9rZW5zLCBmcmFnLCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBMaW5rZXIgZm9yIGFuIHNraXBwZWQgdGV4dCBub2RlLlxuICpcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtUZXh0fSBub2RlXG4gKi9cblxuZnVuY3Rpb24gcmVtb3ZlVGV4dCh2bSwgbm9kZSkge1xuICByZW1vdmUobm9kZSk7XG59XG5cbi8qKlxuICogUHJvY2VzcyBhIHNpbmdsZSB0ZXh0IHRva2VuLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB0b2tlblxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge05vZGV9XG4gKi9cblxuZnVuY3Rpb24gcHJvY2Vzc1RleHRUb2tlbih0b2tlbiwgb3B0aW9ucykge1xuICB2YXIgZWw7XG4gIGlmICh0b2tlbi5vbmVUaW1lKSB7XG4gICAgZWwgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0b2tlbi52YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHRva2VuLmh0bWwpIHtcbiAgICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgndi1odG1sJyk7XG4gICAgICBzZXRUb2tlblR5cGUoJ2h0bWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSUUgd2lsbCBjbGVhbiB1cCBlbXB0eSB0ZXh0Tm9kZXMgZHVyaW5nXG4gICAgICAvLyBmcmFnLmNsb25lTm9kZSh0cnVlKSwgc28gd2UgaGF2ZSB0byBnaXZlIGl0XG4gICAgICAvLyBzb21ldGhpbmcgaGVyZS4uLlxuICAgICAgZWwgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnICcpO1xuICAgICAgc2V0VG9rZW5UeXBlKCd0ZXh0Jyk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHNldFRva2VuVHlwZSh0eXBlKSB7XG4gICAgaWYgKHRva2VuLmRlc2NyaXB0b3IpIHJldHVybjtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VEaXJlY3RpdmUodG9rZW4udmFsdWUpO1xuICAgIHRva2VuLmRlc2NyaXB0b3IgPSB7XG4gICAgICBuYW1lOiB0eXBlLFxuICAgICAgZGVmOiBkaXJlY3RpdmVzW3R5cGVdLFxuICAgICAgZXhwcmVzc2lvbjogcGFyc2VkLmV4cHJlc3Npb24sXG4gICAgICBmaWx0ZXJzOiBwYXJzZWQuZmlsdGVyc1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGVsO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgZnVuY3Rpb24gdGhhdCBwcm9jZXNzZXMgYSB0ZXh0Tm9kZS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IHRva2Vuc1xuICogQHBhcmFtIHtEb2N1bWVudEZyYWdtZW50fSBmcmFnXG4gKi9cblxuZnVuY3Rpb24gbWFrZVRleHROb2RlTGlua0ZuKHRva2VucywgZnJhZykge1xuICByZXR1cm4gZnVuY3Rpb24gdGV4dE5vZGVMaW5rRm4odm0sIGVsLCBob3N0LCBzY29wZSkge1xuICAgIHZhciBmcmFnQ2xvbmUgPSBmcmFnLmNsb25lTm9kZSh0cnVlKTtcbiAgICB2YXIgY2hpbGROb2RlcyA9IHRvQXJyYXkoZnJhZ0Nsb25lLmNoaWxkTm9kZXMpO1xuICAgIHZhciB0b2tlbiwgdmFsdWUsIG5vZGU7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0b2tlbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcbiAgICAgIHZhbHVlID0gdG9rZW4udmFsdWU7XG4gICAgICBpZiAodG9rZW4udGFnKSB7XG4gICAgICAgIG5vZGUgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgICBpZiAodG9rZW4ub25lVGltZSkge1xuICAgICAgICAgIHZhbHVlID0gKHNjb3BlIHx8IHZtKS4kZXZhbCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKHRva2VuLmh0bWwpIHtcbiAgICAgICAgICAgIHJlcGxhY2Uobm9kZSwgcGFyc2VUZW1wbGF0ZSh2YWx1ZSwgdHJ1ZSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlLmRhdGEgPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdm0uX2JpbmREaXIodG9rZW4uZGVzY3JpcHRvciwgbm9kZSwgaG9zdCwgc2NvcGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJlcGxhY2UoZWwsIGZyYWdDbG9uZSk7XG4gIH07XG59XG5cbi8qKlxuICogQ29tcGlsZSBhIG5vZGUgbGlzdCBhbmQgcmV0dXJuIGEgY2hpbGRMaW5rRm4uXG4gKlxuICogQHBhcmFtIHtOb2RlTGlzdH0gbm9kZUxpc3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtGdW5jdGlvbnx1bmRlZmluZWR9XG4gKi9cblxuZnVuY3Rpb24gY29tcGlsZU5vZGVMaXN0KG5vZGVMaXN0LCBvcHRpb25zKSB7XG4gIHZhciBsaW5rRm5zID0gW107XG4gIHZhciBub2RlTGlua0ZuLCBjaGlsZExpbmtGbiwgbm9kZTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBub2RlTGlzdC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBub2RlID0gbm9kZUxpc3RbaV07XG4gICAgbm9kZUxpbmtGbiA9IGNvbXBpbGVOb2RlKG5vZGUsIG9wdGlvbnMpO1xuICAgIGNoaWxkTGlua0ZuID0gIShub2RlTGlua0ZuICYmIG5vZGVMaW5rRm4udGVybWluYWwpICYmIG5vZGUudGFnTmFtZSAhPT0gJ1NDUklQVCcgJiYgbm9kZS5oYXNDaGlsZE5vZGVzKCkgPyBjb21waWxlTm9kZUxpc3Qobm9kZS5jaGlsZE5vZGVzLCBvcHRpb25zKSA6IG51bGw7XG4gICAgbGlua0Zucy5wdXNoKG5vZGVMaW5rRm4sIGNoaWxkTGlua0ZuKTtcbiAgfVxuICByZXR1cm4gbGlua0Zucy5sZW5ndGggPyBtYWtlQ2hpbGRMaW5rRm4obGlua0ZucykgOiBudWxsO1xufVxuXG4vKipcbiAqIE1ha2UgYSBjaGlsZCBsaW5rIGZ1bmN0aW9uIGZvciBhIG5vZGUncyBjaGlsZE5vZGVzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXk8RnVuY3Rpb24+fSBsaW5rRm5zXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gY2hpbGRMaW5rRm5cbiAqL1xuXG5mdW5jdGlvbiBtYWtlQ2hpbGRMaW5rRm4obGlua0Zucykge1xuICByZXR1cm4gZnVuY3Rpb24gY2hpbGRMaW5rRm4odm0sIG5vZGVzLCBob3N0LCBzY29wZSwgZnJhZykge1xuICAgIHZhciBub2RlLCBub2RlTGlua0ZuLCBjaGlsZHJlbkxpbmtGbjtcbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IDAsIGwgPSBsaW5rRm5zLmxlbmd0aDsgaSA8IGw7IG4rKykge1xuICAgICAgbm9kZSA9IG5vZGVzW25dO1xuICAgICAgbm9kZUxpbmtGbiA9IGxpbmtGbnNbaSsrXTtcbiAgICAgIGNoaWxkcmVuTGlua0ZuID0gbGlua0Zuc1tpKytdO1xuICAgICAgLy8gY2FjaGUgY2hpbGROb2RlcyBiZWZvcmUgbGlua2luZyBwYXJlbnQsIGZpeCAjNjU3XG4gICAgICB2YXIgY2hpbGROb2RlcyA9IHRvQXJyYXkobm9kZS5jaGlsZE5vZGVzKTtcbiAgICAgIGlmIChub2RlTGlua0ZuKSB7XG4gICAgICAgIG5vZGVMaW5rRm4odm0sIG5vZGUsIGhvc3QsIHNjb3BlLCBmcmFnKTtcbiAgICAgIH1cbiAgICAgIGlmIChjaGlsZHJlbkxpbmtGbikge1xuICAgICAgICBjaGlsZHJlbkxpbmtGbih2bSwgY2hpbGROb2RlcywgaG9zdCwgc2NvcGUsIGZyYWcpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBDaGVjayBmb3IgZWxlbWVudCBkaXJlY3RpdmVzIChjdXN0b20gZWxlbWVudHMgdGhhdCBzaG91bGRcbiAqIGJlIHJlc292bGVkIGFzIHRlcm1pbmFsIGRpcmVjdGl2ZXMpLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cblxuZnVuY3Rpb24gY2hlY2tFbGVtZW50RGlyZWN0aXZlcyhlbCwgb3B0aW9ucykge1xuICB2YXIgdGFnID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICBpZiAoY29tbW9uVGFnUkUudGVzdCh0YWcpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBkZWYgPSByZXNvbHZlQXNzZXQob3B0aW9ucywgJ2VsZW1lbnREaXJlY3RpdmVzJywgdGFnKTtcbiAgaWYgKGRlZikge1xuICAgIHJldHVybiBtYWtlVGVybWluYWxOb2RlTGlua0ZuKGVsLCB0YWcsICcnLCBvcHRpb25zLCBkZWYpO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYW4gZWxlbWVudCBpcyBhIGNvbXBvbmVudC4gSWYgeWVzLCByZXR1cm5cbiAqIGEgY29tcG9uZW50IGxpbmsgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufHVuZGVmaW5lZH1cbiAqL1xuXG5mdW5jdGlvbiBjaGVja0NvbXBvbmVudChlbCwgb3B0aW9ucykge1xuICB2YXIgY29tcG9uZW50ID0gY2hlY2tDb21wb25lbnRBdHRyKGVsLCBvcHRpb25zKTtcbiAgaWYgKGNvbXBvbmVudCkge1xuICAgIHZhciByZWYgPSBmaW5kUmVmKGVsKTtcbiAgICB2YXIgZGVzY3JpcHRvciA9IHtcbiAgICAgIG5hbWU6ICdjb21wb25lbnQnLFxuICAgICAgcmVmOiByZWYsXG4gICAgICBleHByZXNzaW9uOiBjb21wb25lbnQuaWQsXG4gICAgICBkZWY6IGludGVybmFsRGlyZWN0aXZlcy5jb21wb25lbnQsXG4gICAgICBtb2RpZmllcnM6IHtcbiAgICAgICAgbGl0ZXJhbDogIWNvbXBvbmVudC5keW5hbWljXG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgY29tcG9uZW50TGlua0ZuID0gZnVuY3Rpb24gY29tcG9uZW50TGlua0ZuKHZtLCBlbCwgaG9zdCwgc2NvcGUsIGZyYWcpIHtcbiAgICAgIGlmIChyZWYpIHtcbiAgICAgICAgZGVmaW5lUmVhY3RpdmUoKHNjb3BlIHx8IHZtKS4kcmVmcywgcmVmLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIHZtLl9iaW5kRGlyKGRlc2NyaXB0b3IsIGVsLCBob3N0LCBzY29wZSwgZnJhZyk7XG4gICAgfTtcbiAgICBjb21wb25lbnRMaW5rRm4udGVybWluYWwgPSB0cnVlO1xuICAgIHJldHVybiBjb21wb25lbnRMaW5rRm47XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBhbiBlbGVtZW50IGZvciB0ZXJtaW5hbCBkaXJlY3RpdmVzIGluIGZpeGVkIG9yZGVyLlxuICogSWYgaXQgZmluZHMgb25lLCByZXR1cm4gYSB0ZXJtaW5hbCBsaW5rIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGVybWluYWxMaW5rRm5cbiAqL1xuXG5mdW5jdGlvbiBjaGVja1Rlcm1pbmFsRGlyZWN0aXZlcyhlbCwgb3B0aW9ucykge1xuICAvLyBza2lwIHYtcHJlXG4gIGlmIChnZXRBdHRyKGVsLCAndi1wcmUnKSAhPT0gbnVsbCkge1xuICAgIHJldHVybiBza2lwO1xuICB9XG4gIC8vIHNraXAgdi1lbHNlIGJsb2NrLCBidXQgb25seSBpZiBmb2xsb3dpbmcgdi1pZlxuICBpZiAoZWwuaGFzQXR0cmlidXRlKCd2LWVsc2UnKSkge1xuICAgIHZhciBwcmV2ID0gZWwucHJldmlvdXNFbGVtZW50U2libGluZztcbiAgICBpZiAocHJldiAmJiBwcmV2Lmhhc0F0dHJpYnV0ZSgndi1pZicpKSB7XG4gICAgICByZXR1cm4gc2tpcDtcbiAgICB9XG4gIH1cbiAgdmFyIHZhbHVlLCBkaXJOYW1lO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHRlcm1pbmFsRGlyZWN0aXZlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBkaXJOYW1lID0gdGVybWluYWxEaXJlY3RpdmVzW2ldO1xuICAgIHZhbHVlID0gZWwuZ2V0QXR0cmlidXRlKCd2LScgKyBkaXJOYW1lKTtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG1ha2VUZXJtaW5hbE5vZGVMaW5rRm4oZWwsIGRpck5hbWUsIHZhbHVlLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc2tpcCgpIHt9XG5za2lwLnRlcm1pbmFsID0gdHJ1ZTtcblxuLyoqXG4gKiBCdWlsZCBhIG5vZGUgbGluayBmdW5jdGlvbiBmb3IgYSB0ZXJtaW5hbCBkaXJlY3RpdmUuXG4gKiBBIHRlcm1pbmFsIGxpbmsgZnVuY3Rpb24gdGVybWluYXRlcyB0aGUgY3VycmVudFxuICogY29tcGlsYXRpb24gcmVjdXJzaW9uIGFuZCBoYW5kbGVzIGNvbXBpbGF0aW9uIG9mIHRoZVxuICogc3VidHJlZSBpbiB0aGUgZGlyZWN0aXZlLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBkaXJOYW1lXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge09iamVjdH0gW2RlZl1cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0ZXJtaW5hbExpbmtGblxuICovXG5cbmZ1bmN0aW9uIG1ha2VUZXJtaW5hbE5vZGVMaW5rRm4oZWwsIGRpck5hbWUsIHZhbHVlLCBvcHRpb25zLCBkZWYpIHtcbiAgdmFyIHBhcnNlZCA9IHBhcnNlRGlyZWN0aXZlKHZhbHVlKTtcbiAgdmFyIGRlc2NyaXB0b3IgPSB7XG4gICAgbmFtZTogZGlyTmFtZSxcbiAgICBleHByZXNzaW9uOiBwYXJzZWQuZXhwcmVzc2lvbixcbiAgICBmaWx0ZXJzOiBwYXJzZWQuZmlsdGVycyxcbiAgICByYXc6IHZhbHVlLFxuICAgIC8vIGVpdGhlciBhbiBlbGVtZW50IGRpcmVjdGl2ZSwgb3IgaWYvZm9yXG4gICAgLy8gIzIzNjYgb3IgY3VzdG9tIHRlcm1pbmFsIGRpcmVjdGl2ZVxuICAgIGRlZjogZGVmIHx8IHJlc29sdmVBc3NldChvcHRpb25zLCAnZGlyZWN0aXZlcycsIGRpck5hbWUpXG4gIH07XG4gIC8vIGNoZWNrIHJlZiBmb3Igdi1mb3IgYW5kIHJvdXRlci12aWV3XG4gIGlmIChkaXJOYW1lID09PSAnZm9yJyB8fCBkaXJOYW1lID09PSAncm91dGVyLXZpZXcnKSB7XG4gICAgZGVzY3JpcHRvci5yZWYgPSBmaW5kUmVmKGVsKTtcbiAgfVxuICB2YXIgZm4gPSBmdW5jdGlvbiB0ZXJtaW5hbE5vZGVMaW5rRm4odm0sIGVsLCBob3N0LCBzY29wZSwgZnJhZykge1xuICAgIGlmIChkZXNjcmlwdG9yLnJlZikge1xuICAgICAgZGVmaW5lUmVhY3RpdmUoKHNjb3BlIHx8IHZtKS4kcmVmcywgZGVzY3JpcHRvci5yZWYsIG51bGwpO1xuICAgIH1cbiAgICB2bS5fYmluZERpcihkZXNjcmlwdG9yLCBlbCwgaG9zdCwgc2NvcGUsIGZyYWcpO1xuICB9O1xuICBmbi50ZXJtaW5hbCA9IHRydWU7XG4gIHJldHVybiBmbjtcbn1cblxuLyoqXG4gKiBDb21waWxlIHRoZSBkaXJlY3RpdmVzIG9uIGFuIGVsZW1lbnQgYW5kIHJldHVybiBhIGxpbmtlci5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fE5hbWVkTm9kZU1hcH0gYXR0cnNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5mdW5jdGlvbiBjb21waWxlRGlyZWN0aXZlcyhhdHRycywgb3B0aW9ucykge1xuICB2YXIgaSA9IGF0dHJzLmxlbmd0aDtcbiAgdmFyIGRpcnMgPSBbXTtcbiAgdmFyIGF0dHIsIG5hbWUsIHZhbHVlLCByYXdOYW1lLCByYXdWYWx1ZSwgZGlyTmFtZSwgYXJnLCBtb2RpZmllcnMsIGRpckRlZiwgdG9rZW5zLCBtYXRjaGVkO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgYXR0ciA9IGF0dHJzW2ldO1xuICAgIG5hbWUgPSByYXdOYW1lID0gYXR0ci5uYW1lO1xuICAgIHZhbHVlID0gcmF3VmFsdWUgPSBhdHRyLnZhbHVlO1xuICAgIHRva2VucyA9IHBhcnNlVGV4dCh2YWx1ZSk7XG4gICAgLy8gcmVzZXQgYXJnXG4gICAgYXJnID0gbnVsbDtcbiAgICAvLyBjaGVjayBtb2RpZmllcnNcbiAgICBtb2RpZmllcnMgPSBwYXJzZU1vZGlmaWVycyhuYW1lKTtcbiAgICBuYW1lID0gbmFtZS5yZXBsYWNlKG1vZGlmaWVyUkUsICcnKTtcblxuICAgIC8vIGF0dHJpYnV0ZSBpbnRlcnBvbGF0aW9uc1xuICAgIGlmICh0b2tlbnMpIHtcbiAgICAgIHZhbHVlID0gdG9rZW5zVG9FeHAodG9rZW5zKTtcbiAgICAgIGFyZyA9IG5hbWU7XG4gICAgICBwdXNoRGlyKCdiaW5kJywgZGlyZWN0aXZlcy5iaW5kLCB0b2tlbnMpO1xuICAgICAgLy8gd2FybiBhZ2FpbnN0IG1peGluZyBtdXN0YWNoZXMgd2l0aCB2LWJpbmRcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgIGlmIChuYW1lID09PSAnY2xhc3MnICYmIEFycmF5LnByb3RvdHlwZS5zb21lLmNhbGwoYXR0cnMsIGZ1bmN0aW9uIChhdHRyKSB7XG4gICAgICAgICAgcmV0dXJuIGF0dHIubmFtZSA9PT0gJzpjbGFzcycgfHwgYXR0ci5uYW1lID09PSAndi1iaW5kOmNsYXNzJztcbiAgICAgICAgfSkpIHtcbiAgICAgICAgICB3YXJuKCdjbGFzcz1cIicgKyByYXdWYWx1ZSArICdcIjogRG8gbm90IG1peCBtdXN0YWNoZSBpbnRlcnBvbGF0aW9uICcgKyAnYW5kIHYtYmluZCBmb3IgXCJjbGFzc1wiIG9uIHRoZSBzYW1lIGVsZW1lbnQuIFVzZSBvbmUgb3IgdGhlIG90aGVyLicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlXG5cbiAgICAgIC8vIHNwZWNpYWwgYXR0cmlidXRlOiB0cmFuc2l0aW9uXG4gICAgICBpZiAodHJhbnNpdGlvblJFLnRlc3QobmFtZSkpIHtcbiAgICAgICAgbW9kaWZpZXJzLmxpdGVyYWwgPSAhYmluZFJFLnRlc3QobmFtZSk7XG4gICAgICAgIHB1c2hEaXIoJ3RyYW5zaXRpb24nLCBpbnRlcm5hbERpcmVjdGl2ZXMudHJhbnNpdGlvbik7XG4gICAgICB9IGVsc2VcblxuICAgICAgICAvLyBldmVudCBoYW5kbGVyc1xuICAgICAgICBpZiAob25SRS50ZXN0KG5hbWUpKSB7XG4gICAgICAgICAgYXJnID0gbmFtZS5yZXBsYWNlKG9uUkUsICcnKTtcbiAgICAgICAgICBwdXNoRGlyKCdvbicsIGRpcmVjdGl2ZXMub24pO1xuICAgICAgICB9IGVsc2VcblxuICAgICAgICAgIC8vIGF0dHJpYnV0ZSBiaW5kaW5nc1xuICAgICAgICAgIGlmIChiaW5kUkUudGVzdChuYW1lKSkge1xuICAgICAgICAgICAgZGlyTmFtZSA9IG5hbWUucmVwbGFjZShiaW5kUkUsICcnKTtcbiAgICAgICAgICAgIGlmIChkaXJOYW1lID09PSAnc3R5bGUnIHx8IGRpck5hbWUgPT09ICdjbGFzcycpIHtcbiAgICAgICAgICAgICAgcHVzaERpcihkaXJOYW1lLCBpbnRlcm5hbERpcmVjdGl2ZXNbZGlyTmFtZV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYXJnID0gZGlyTmFtZTtcbiAgICAgICAgICAgICAgcHVzaERpcignYmluZCcsIGRpcmVjdGl2ZXMuYmluZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlXG5cbiAgICAgICAgICAgIC8vIG5vcm1hbCBkaXJlY3RpdmVzXG4gICAgICAgICAgICBpZiAobWF0Y2hlZCA9IG5hbWUubWF0Y2goZGlyQXR0clJFKSkge1xuICAgICAgICAgICAgICBkaXJOYW1lID0gbWF0Y2hlZFsxXTtcbiAgICAgICAgICAgICAgYXJnID0gbWF0Y2hlZFsyXTtcblxuICAgICAgICAgICAgICAvLyBza2lwIHYtZWxzZSAod2hlbiB1c2VkIHdpdGggdi1zaG93KVxuICAgICAgICAgICAgICBpZiAoZGlyTmFtZSA9PT0gJ2Vsc2UnKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBkaXJEZWYgPSByZXNvbHZlQXNzZXQob3B0aW9ucywgJ2RpcmVjdGl2ZXMnLCBkaXJOYW1lKTtcblxuICAgICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgICAgICAgIGFzc2VydEFzc2V0KGRpckRlZiwgJ2RpcmVjdGl2ZScsIGRpck5hbWUpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGRpckRlZikge1xuICAgICAgICAgICAgICAgIHB1c2hEaXIoZGlyTmFtZSwgZGlyRGVmKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFB1c2ggYSBkaXJlY3RpdmUuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBkaXJOYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBkZWZcbiAgICogQHBhcmFtIHtBcnJheX0gW2ludGVycFRva2Vuc11cbiAgICovXG5cbiAgZnVuY3Rpb24gcHVzaERpcihkaXJOYW1lLCBkZWYsIGludGVycFRva2Vucykge1xuICAgIHZhciBoYXNPbmVUaW1lVG9rZW4gPSBpbnRlcnBUb2tlbnMgJiYgaGFzT25lVGltZShpbnRlcnBUb2tlbnMpO1xuICAgIHZhciBwYXJzZWQgPSAhaGFzT25lVGltZVRva2VuICYmIHBhcnNlRGlyZWN0aXZlKHZhbHVlKTtcbiAgICBkaXJzLnB1c2goe1xuICAgICAgbmFtZTogZGlyTmFtZSxcbiAgICAgIGF0dHI6IHJhd05hbWUsXG4gICAgICByYXc6IHJhd1ZhbHVlLFxuICAgICAgZGVmOiBkZWYsXG4gICAgICBhcmc6IGFyZyxcbiAgICAgIG1vZGlmaWVyczogbW9kaWZpZXJzLFxuICAgICAgLy8gY29udmVyc2lvbiBmcm9tIGludGVycG9sYXRpb24gc3RyaW5ncyB3aXRoIG9uZS10aW1lIHRva2VuXG4gICAgICAvLyB0byBleHByZXNzaW9uIGlzIGRpZmZlcmVkIHVudGlsIGRpcmVjdGl2ZSBiaW5kIHRpbWUgc28gdGhhdCB3ZVxuICAgICAgLy8gaGF2ZSBhY2Nlc3MgdG8gdGhlIGFjdHVhbCB2bSBjb250ZXh0IGZvciBvbmUtdGltZSBiaW5kaW5ncy5cbiAgICAgIGV4cHJlc3Npb246IHBhcnNlZCAmJiBwYXJzZWQuZXhwcmVzc2lvbixcbiAgICAgIGZpbHRlcnM6IHBhcnNlZCAmJiBwYXJzZWQuZmlsdGVycyxcbiAgICAgIGludGVycDogaW50ZXJwVG9rZW5zLFxuICAgICAgaGFzT25lVGltZTogaGFzT25lVGltZVRva2VuXG4gICAgfSk7XG4gIH1cblxuICBpZiAoZGlycy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbWFrZU5vZGVMaW5rRm4oZGlycyk7XG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZSBtb2RpZmllcnMgZnJvbSBkaXJlY3RpdmUgYXR0cmlidXRlIG5hbWUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG5mdW5jdGlvbiBwYXJzZU1vZGlmaWVycyhuYW1lKSB7XG4gIHZhciByZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB2YXIgbWF0Y2ggPSBuYW1lLm1hdGNoKG1vZGlmaWVyUkUpO1xuICBpZiAobWF0Y2gpIHtcbiAgICB2YXIgaSA9IG1hdGNoLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICByZXNbbWF0Y2hbaV0uc2xpY2UoMSldID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBCdWlsZCBhIGxpbmsgZnVuY3Rpb24gZm9yIGFsbCBkaXJlY3RpdmVzIG9uIGEgc2luZ2xlIG5vZGUuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gZGlyZWN0aXZlc1xuICogQHJldHVybiB7RnVuY3Rpb259IGRpcmVjdGl2ZXNMaW5rRm5cbiAqL1xuXG5mdW5jdGlvbiBtYWtlTm9kZUxpbmtGbihkaXJlY3RpdmVzKSB7XG4gIHJldHVybiBmdW5jdGlvbiBub2RlTGlua0ZuKHZtLCBlbCwgaG9zdCwgc2NvcGUsIGZyYWcpIHtcbiAgICAvLyByZXZlcnNlIGFwcGx5IGJlY2F1c2UgaXQncyBzb3J0ZWQgbG93IHRvIGhpZ2hcbiAgICB2YXIgaSA9IGRpcmVjdGl2ZXMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHZtLl9iaW5kRGlyKGRpcmVjdGl2ZXNbaV0sIGVsLCBob3N0LCBzY29wZSwgZnJhZyk7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGFuIGludGVycG9sYXRpb24gc3RyaW5nIGNvbnRhaW5zIG9uZS10aW1lIHRva2Vucy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB0b2tlbnNcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gaGFzT25lVGltZSh0b2tlbnMpIHtcbiAgdmFyIGkgPSB0b2tlbnMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgaWYgKHRva2Vuc1tpXS5vbmVUaW1lKSByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG52YXIgc3BlY2lhbENoYXJSRSA9IC9bXlxcd1xcLTpcXC5dLztcblxuLyoqXG4gKiBQcm9jZXNzIGFuIGVsZW1lbnQgb3IgYSBEb2N1bWVudEZyYWdtZW50IGJhc2VkIG9uIGFcbiAqIGluc3RhbmNlIG9wdGlvbiBvYmplY3QuIFRoaXMgYWxsb3dzIHVzIHRvIHRyYW5zY2x1ZGVcbiAqIGEgdGVtcGxhdGUgbm9kZS9mcmFnbWVudCBiZWZvcmUgdGhlIGluc3RhbmNlIGlzIGNyZWF0ZWQsXG4gKiBzbyB0aGUgcHJvY2Vzc2VkIGZyYWdtZW50IGNhbiB0aGVuIGJlIGNsb25lZCBhbmQgcmV1c2VkXG4gKiBpbiB2LWZvci5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7RWxlbWVudHxEb2N1bWVudEZyYWdtZW50fVxuICovXG5cbmZ1bmN0aW9uIHRyYW5zY2x1ZGUoZWwsIG9wdGlvbnMpIHtcbiAgLy8gZXh0cmFjdCBjb250YWluZXIgYXR0cmlidXRlcyB0byBwYXNzIHRoZW0gZG93blxuICAvLyB0byBjb21waWxlciwgYmVjYXVzZSB0aGV5IG5lZWQgdG8gYmUgY29tcGlsZWQgaW5cbiAgLy8gcGFyZW50IHNjb3BlLiB3ZSBhcmUgbXV0YXRpbmcgdGhlIG9wdGlvbnMgb2JqZWN0IGhlcmVcbiAgLy8gYXNzdW1pbmcgdGhlIHNhbWUgb2JqZWN0IHdpbGwgYmUgdXNlZCBmb3IgY29tcGlsZVxuICAvLyByaWdodCBhZnRlciB0aGlzLlxuICBpZiAob3B0aW9ucykge1xuICAgIG9wdGlvbnMuX2NvbnRhaW5lckF0dHJzID0gZXh0cmFjdEF0dHJzKGVsKTtcbiAgfVxuICAvLyBmb3IgdGVtcGxhdGUgdGFncywgd2hhdCB3ZSB3YW50IGlzIGl0cyBjb250ZW50IGFzXG4gIC8vIGEgZG9jdW1lbnRGcmFnbWVudCAoZm9yIGZyYWdtZW50IGluc3RhbmNlcylcbiAgaWYgKGlzVGVtcGxhdGUoZWwpKSB7XG4gICAgZWwgPSBwYXJzZVRlbXBsYXRlKGVsKTtcbiAgfVxuICBpZiAob3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLl9hc0NvbXBvbmVudCAmJiAhb3B0aW9ucy50ZW1wbGF0ZSkge1xuICAgICAgb3B0aW9ucy50ZW1wbGF0ZSA9ICc8c2xvdD48L3Nsb3Q+JztcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMudGVtcGxhdGUpIHtcbiAgICAgIG9wdGlvbnMuX2NvbnRlbnQgPSBleHRyYWN0Q29udGVudChlbCk7XG4gICAgICBlbCA9IHRyYW5zY2x1ZGVUZW1wbGF0ZShlbCwgb3B0aW9ucyk7XG4gICAgfVxuICB9XG4gIGlmIChpc0ZyYWdtZW50KGVsKSkge1xuICAgIC8vIGFuY2hvcnMgZm9yIGZyYWdtZW50IGluc3RhbmNlXG4gICAgLy8gcGFzc2luZyBpbiBgcGVyc2lzdDogdHJ1ZWAgdG8gYXZvaWQgdGhlbSBiZWluZ1xuICAgIC8vIGRpc2NhcmRlZCBieSBJRSBkdXJpbmcgdGVtcGxhdGUgY2xvbmluZ1xuICAgIHByZXBlbmQoY3JlYXRlQW5jaG9yKCd2LXN0YXJ0JywgdHJ1ZSksIGVsKTtcbiAgICBlbC5hcHBlbmRDaGlsZChjcmVhdGVBbmNob3IoJ3YtZW5kJywgdHJ1ZSkpO1xuICB9XG4gIHJldHVybiBlbDtcbn1cblxuLyoqXG4gKiBQcm9jZXNzIHRoZSB0ZW1wbGF0ZSBvcHRpb24uXG4gKiBJZiB0aGUgcmVwbGFjZSBvcHRpb24gaXMgdHJ1ZSB0aGlzIHdpbGwgc3dhcCB0aGUgJGVsLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtFbGVtZW50fERvY3VtZW50RnJhZ21lbnR9XG4gKi9cblxuZnVuY3Rpb24gdHJhbnNjbHVkZVRlbXBsYXRlKGVsLCBvcHRpb25zKSB7XG4gIHZhciB0ZW1wbGF0ZSA9IG9wdGlvbnMudGVtcGxhdGU7XG4gIHZhciBmcmFnID0gcGFyc2VUZW1wbGF0ZSh0ZW1wbGF0ZSwgdHJ1ZSk7XG4gIGlmIChmcmFnKSB7XG4gICAgdmFyIHJlcGxhY2VyID0gZnJhZy5maXJzdENoaWxkO1xuICAgIHZhciB0YWcgPSByZXBsYWNlci50YWdOYW1lICYmIHJlcGxhY2VyLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAob3B0aW9ucy5yZXBsYWNlKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmIChlbCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ1lvdSBhcmUgbW91bnRpbmcgYW4gaW5zdGFuY2Ugd2l0aCBhIHRlbXBsYXRlIHRvICcgKyAnPGJvZHk+LiBUaGlzIHdpbGwgcmVwbGFjZSA8Ym9keT4gZW50aXJlbHkuIFlvdSAnICsgJ3Nob3VsZCBwcm9iYWJseSB1c2UgYHJlcGxhY2U6IGZhbHNlYCBoZXJlLicpO1xuICAgICAgfVxuICAgICAgLy8gdGhlcmUgYXJlIG1hbnkgY2FzZXMgd2hlcmUgdGhlIGluc3RhbmNlIG11c3RcbiAgICAgIC8vIGJlY29tZSBhIGZyYWdtZW50IGluc3RhbmNlOiBiYXNpY2FsbHkgYW55dGhpbmcgdGhhdFxuICAgICAgLy8gY2FuIGNyZWF0ZSBtb3JlIHRoYW4gMSByb290IG5vZGVzLlxuICAgICAgaWYgKFxuICAgICAgLy8gbXVsdGktY2hpbGRyZW4gdGVtcGxhdGVcbiAgICAgIGZyYWcuY2hpbGROb2Rlcy5sZW5ndGggPiAxIHx8XG4gICAgICAvLyBub24tZWxlbWVudCB0ZW1wbGF0ZVxuICAgICAgcmVwbGFjZXIubm9kZVR5cGUgIT09IDEgfHxcbiAgICAgIC8vIHNpbmdsZSBuZXN0ZWQgY29tcG9uZW50XG4gICAgICB0YWcgPT09ICdjb21wb25lbnQnIHx8IHJlc29sdmVBc3NldChvcHRpb25zLCAnY29tcG9uZW50cycsIHRhZykgfHwgaGFzQmluZEF0dHIocmVwbGFjZXIsICdpcycpIHx8XG4gICAgICAvLyBlbGVtZW50IGRpcmVjdGl2ZVxuICAgICAgcmVzb2x2ZUFzc2V0KG9wdGlvbnMsICdlbGVtZW50RGlyZWN0aXZlcycsIHRhZykgfHxcbiAgICAgIC8vIGZvciBibG9ja1xuICAgICAgcmVwbGFjZXIuaGFzQXR0cmlidXRlKCd2LWZvcicpIHx8XG4gICAgICAvLyBpZiBibG9ja1xuICAgICAgcmVwbGFjZXIuaGFzQXR0cmlidXRlKCd2LWlmJykpIHtcbiAgICAgICAgcmV0dXJuIGZyYWc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zLl9yZXBsYWNlckF0dHJzID0gZXh0cmFjdEF0dHJzKHJlcGxhY2VyKTtcbiAgICAgICAgbWVyZ2VBdHRycyhlbCwgcmVwbGFjZXIpO1xuICAgICAgICByZXR1cm4gcmVwbGFjZXI7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLmFwcGVuZENoaWxkKGZyYWcpO1xuICAgICAgcmV0dXJuIGVsO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ0ludmFsaWQgdGVtcGxhdGUgb3B0aW9uOiAnICsgdGVtcGxhdGUpO1xuICB9XG59XG5cbi8qKlxuICogSGVscGVyIHRvIGV4dHJhY3QgYSBjb21wb25lbnQgY29udGFpbmVyJ3MgYXR0cmlidXRlc1xuICogaW50byBhIHBsYWluIG9iamVjdCBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuXG5mdW5jdGlvbiBleHRyYWN0QXR0cnMoZWwpIHtcbiAgaWYgKGVsLm5vZGVUeXBlID09PSAxICYmIGVsLmhhc0F0dHJpYnV0ZXMoKSkge1xuICAgIHJldHVybiB0b0FycmF5KGVsLmF0dHJpYnV0ZXMpO1xuICB9XG59XG5cbi8qKlxuICogTWVyZ2UgdGhlIGF0dHJpYnV0ZXMgb2YgdHdvIGVsZW1lbnRzLCBhbmQgbWFrZSBzdXJlXG4gKiB0aGUgY2xhc3MgbmFtZXMgYXJlIG1lcmdlZCBwcm9wZXJseS5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGZyb21cbiAqIEBwYXJhbSB7RWxlbWVudH0gdG9cbiAqL1xuXG5mdW5jdGlvbiBtZXJnZUF0dHJzKGZyb20sIHRvKSB7XG4gIHZhciBhdHRycyA9IGZyb20uYXR0cmlidXRlcztcbiAgdmFyIGkgPSBhdHRycy5sZW5ndGg7XG4gIHZhciBuYW1lLCB2YWx1ZTtcbiAgd2hpbGUgKGktLSkge1xuICAgIG5hbWUgPSBhdHRyc1tpXS5uYW1lO1xuICAgIHZhbHVlID0gYXR0cnNbaV0udmFsdWU7XG4gICAgaWYgKCF0by5oYXNBdHRyaWJ1dGUobmFtZSkgJiYgIXNwZWNpYWxDaGFyUkUudGVzdChuYW1lKSkge1xuICAgICAgdG8uc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKG5hbWUgPT09ICdjbGFzcycgJiYgIXBhcnNlVGV4dCh2YWx1ZSkpIHtcbiAgICAgIHZhbHVlLnNwbGl0KC9cXHMrLykuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgICAgIGFkZENsYXNzKHRvLCBjbHMpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2NhbiBhbmQgZGV0ZXJtaW5lIHNsb3QgY29udGVudCBkaXN0cmlidXRpb24uXG4gKiBXZSBkbyB0aGlzIGR1cmluZyB0cmFuc2NsdXNpb24gaW5zdGVhZCBhdCBjb21waWxlIHRpbWUgc28gdGhhdFxuICogdGhlIGRpc3RyaWJ1dGlvbiBpcyBkZWNvdXBsZWQgZnJvbSB0aGUgY29tcGlsYXRpb24gb3JkZXIgb2ZcbiAqIHRoZSBzbG90cy5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR8RG9jdW1lbnRGcmFnbWVudH0gdGVtcGxhdGVcbiAqIEBwYXJhbSB7RWxlbWVudH0gY29udGVudFxuICogQHBhcmFtIHtWdWV9IHZtXG4gKi9cblxuZnVuY3Rpb24gc2NhblNsb3RzKHRlbXBsYXRlLCBjb250ZW50LCB2bSkge1xuICBpZiAoIWNvbnRlbnQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGNvbnRlbnRzID0gdm0uX3Nsb3RDb250ZW50cyA9IHt9O1xuICB2YXIgc2xvdHMgPSB0ZW1wbGF0ZS5xdWVyeVNlbGVjdG9yQWxsKCdzbG90Jyk7XG4gIGlmIChzbG90cy5sZW5ndGgpIHtcbiAgICB2YXIgaGFzRGVmYXVsdCwgc2xvdCwgbmFtZTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHNsb3RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgc2xvdCA9IHNsb3RzW2ldO1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uZC1hc3NpZ24gKi9cbiAgICAgIGlmIChuYW1lID0gc2xvdC5nZXRBdHRyaWJ1dGUoJ25hbWUnKSkge1xuICAgICAgICBzZWxlY3Qoc2xvdCwgbmFtZSk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgKG5hbWUgPSBnZXRCaW5kQXR0cihzbG90LCAnbmFtZScpKSkge1xuICAgICAgICB3YXJuKCc8c2xvdCA6bmFtZT1cIicgKyBuYW1lICsgJ1wiPjogc2xvdCBuYW1lcyBjYW5ub3QgYmUgZHluYW1pYy4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGRlZmF1bHQgc2xvdFxuICAgICAgICBoYXNEZWZhdWx0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tY29uZC1hc3NpZ24gKi9cbiAgICB9XG4gICAgaWYgKGhhc0RlZmF1bHQpIHtcbiAgICAgIGNvbnRlbnRzWydkZWZhdWx0J10gPSBleHRyYWN0RnJhZ21lbnQoY29udGVudC5jaGlsZE5vZGVzLCBjb250ZW50KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZWxlY3Qoc2xvdCwgbmFtZSkge1xuICAgIC8vIG5hbWVkIHNsb3RcbiAgICB2YXIgc2VsZWN0b3IgPSAnW3Nsb3Q9XCInICsgbmFtZSArICdcIl0nO1xuICAgIHZhciBub2RlcyA9IGNvbnRlbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgaWYgKG5vZGVzLmxlbmd0aCkge1xuICAgICAgY29udGVudHNbbmFtZV0gPSBleHRyYWN0RnJhZ21lbnQobm9kZXMsIGNvbnRlbnQpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3QgcXVhbGlmaWVkIGNvbnRlbnQgbm9kZXMgZnJvbSBhIG5vZGUgbGlzdC5cbiAqXG4gKiBAcGFyYW0ge05vZGVMaXN0fSBub2Rlc1xuICogQHBhcmFtIHtFbGVtZW50fSBwYXJlbnRcbiAqIEByZXR1cm4ge0RvY3VtZW50RnJhZ21lbnR9XG4gKi9cblxuZnVuY3Rpb24gZXh0cmFjdEZyYWdtZW50KG5vZGVzLCBwYXJlbnQpIHtcbiAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gIG5vZGVzID0gdG9BcnJheShub2Rlcyk7XG4gIGZvciAodmFyIGkgPSAwLCBsID0gbm9kZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIG5vZGUgPSBub2Rlc1tpXTtcbiAgICBpZiAobm9kZS5wYXJlbnROb2RlID09PSBwYXJlbnQpIHtcbiAgICAgIGlmIChpc1RlbXBsYXRlKG5vZGUpICYmICFub2RlLmhhc0F0dHJpYnV0ZSgndi1pZicpICYmICFub2RlLmhhc0F0dHJpYnV0ZSgndi1mb3InKSkge1xuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICAgIG5vZGUgPSBwYXJzZVRlbXBsYXRlKG5vZGUpO1xuICAgICAgfVxuICAgICAgZnJhZy5hcHBlbmRDaGlsZChub2RlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZyYWc7XG59XG5cblxuXG52YXIgY29tcGlsZXIgPSBPYmplY3QuZnJlZXplKHtcblx0Y29tcGlsZTogY29tcGlsZSxcblx0Y29tcGlsZUFuZExpbmtQcm9wczogY29tcGlsZUFuZExpbmtQcm9wcyxcblx0Y29tcGlsZVJvb3Q6IGNvbXBpbGVSb290LFxuXHR0ZXJtaW5hbERpcmVjdGl2ZXM6IHRlcm1pbmFsRGlyZWN0aXZlcyxcblx0dHJhbnNjbHVkZTogdHJhbnNjbHVkZSxcblx0c2NhblNsb3RzOiBzY2FuU2xvdHNcbn0pO1xuXG5mdW5jdGlvbiBzdGF0ZU1peGluIChWdWUpIHtcbiAgLyoqXG4gICAqIEFjY2Vzc29yIGZvciBgJGRhdGFgIHByb3BlcnR5LCBzaW5jZSBzZXR0aW5nICRkYXRhXG4gICAqIHJlcXVpcmVzIG9ic2VydmluZyB0aGUgbmV3IG9iamVjdCBhbmQgdXBkYXRpbmdcbiAgICogcHJveGllZCBwcm9wZXJ0aWVzLlxuICAgKi9cblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVnVlLnByb3RvdHlwZSwgJyRkYXRhJywge1xuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldChuZXdEYXRhKSB7XG4gICAgICBpZiAobmV3RGF0YSAhPT0gdGhpcy5fZGF0YSkge1xuICAgICAgICB0aGlzLl9zZXREYXRhKG5ld0RhdGEpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLyoqXG4gICAqIFNldHVwIHRoZSBzY29wZSBvZiBhbiBpbnN0YW5jZSwgd2hpY2ggY29udGFpbnM6XG4gICAqIC0gb2JzZXJ2ZWQgZGF0YVxuICAgKiAtIGNvbXB1dGVkIHByb3BlcnRpZXNcbiAgICogLSB1c2VyIG1ldGhvZHNcbiAgICogLSBtZXRhIHByb3BlcnRpZXNcbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS5faW5pdFN0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2luaXRQcm9wcygpO1xuICAgIHRoaXMuX2luaXRNZXRhKCk7XG4gICAgdGhpcy5faW5pdE1ldGhvZHMoKTtcbiAgICB0aGlzLl9pbml0RGF0YSgpO1xuICAgIHRoaXMuX2luaXRDb21wdXRlZCgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHByb3BzLlxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLl9pbml0UHJvcHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB0aGlzLiRvcHRpb25zO1xuICAgIHZhciBlbCA9IG9wdGlvbnMuZWw7XG4gICAgdmFyIHByb3BzID0gb3B0aW9ucy5wcm9wcztcbiAgICBpZiAocHJvcHMgJiYgIWVsKSB7XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ1Byb3BzIHdpbGwgbm90IGJlIGNvbXBpbGVkIGlmIG5vIGBlbGAgb3B0aW9uIGlzICcgKyAncHJvdmlkZWQgYXQgaW5zdGFudGlhdGlvbi4nKTtcbiAgICB9XG4gICAgLy8gbWFrZSBzdXJlIHRvIGNvbnZlcnQgc3RyaW5nIHNlbGVjdG9ycyBpbnRvIGVsZW1lbnQgbm93XG4gICAgZWwgPSBvcHRpb25zLmVsID0gcXVlcnkoZWwpO1xuICAgIHRoaXMuX3Byb3BzVW5saW5rRm4gPSBlbCAmJiBlbC5ub2RlVHlwZSA9PT0gMSAmJiBwcm9wc1xuICAgIC8vIHByb3BzIG11c3QgYmUgbGlua2VkIGluIHByb3BlciBzY29wZSBpZiBpbnNpZGUgdi1mb3JcbiAgICA/IGNvbXBpbGVBbmRMaW5rUHJvcHModGhpcywgZWwsIHByb3BzLCB0aGlzLl9zY29wZSkgOiBudWxsO1xuICB9O1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBkYXRhLlxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLl9pbml0RGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcHJvcHNEYXRhID0gdGhpcy5fZGF0YTtcbiAgICB2YXIgb3B0aW9uc0RhdGFGbiA9IHRoaXMuJG9wdGlvbnMuZGF0YTtcbiAgICB2YXIgb3B0aW9uc0RhdGEgPSBvcHRpb25zRGF0YUZuICYmIG9wdGlvbnNEYXRhRm4oKTtcbiAgICB2YXIgcnVudGltZURhdGE7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIHJ1bnRpbWVEYXRhID0gKHR5cGVvZiB0aGlzLl9ydW50aW1lRGF0YSA9PT0gJ2Z1bmN0aW9uJyA/IHRoaXMuX3J1bnRpbWVEYXRhKCkgOiB0aGlzLl9ydW50aW1lRGF0YSkgfHwge307XG4gICAgICB0aGlzLl9ydW50aW1lRGF0YSA9IG51bGw7XG4gICAgfVxuICAgIGlmIChvcHRpb25zRGF0YSkge1xuICAgICAgdGhpcy5fZGF0YSA9IG9wdGlvbnNEYXRhO1xuICAgICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wc0RhdGEpIHtcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgaGFzT3duKG9wdGlvbnNEYXRhLCBwcm9wKSAmJiAhaGFzT3duKHJ1bnRpbWVEYXRhLCBwcm9wKSkge1xuICAgICAgICAgIHdhcm4oJ0RhdGEgZmllbGQgXCInICsgcHJvcCArICdcIiBpcyBhbHJlYWR5IGRlZmluZWQgJyArICdhcyBhIHByb3AuIFVzZSBwcm9wIGRlZmF1bHQgdmFsdWUgaW5zdGVhZC4nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcHJvcHNbcHJvcF0ucmF3ICE9PSBudWxsIHx8ICFoYXNPd24ob3B0aW9uc0RhdGEsIHByb3ApKSB7XG4gICAgICAgICAgc2V0KG9wdGlvbnNEYXRhLCBwcm9wLCBwcm9wc0RhdGFbcHJvcF0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBkYXRhID0gdGhpcy5fZGF0YTtcbiAgICAvLyBwcm94eSBkYXRhIG9uIGluc3RhbmNlXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhkYXRhKTtcbiAgICB2YXIgaSwga2V5O1xuICAgIGkgPSBrZXlzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBrZXkgPSBrZXlzW2ldO1xuICAgICAgdGhpcy5fcHJveHkoa2V5KTtcbiAgICB9XG4gICAgLy8gb2JzZXJ2ZSBkYXRhXG4gICAgb2JzZXJ2ZShkYXRhLCB0aGlzKTtcbiAgfTtcblxuICAvKipcbiAgICogU3dhcCB0aGUgaW5zdGFuY2UncyAkZGF0YS4gQ2FsbGVkIGluICRkYXRhJ3Mgc2V0dGVyLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gbmV3RGF0YVxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLl9zZXREYXRhID0gZnVuY3Rpb24gKG5ld0RhdGEpIHtcbiAgICBuZXdEYXRhID0gbmV3RGF0YSB8fCB7fTtcbiAgICB2YXIgb2xkRGF0YSA9IHRoaXMuX2RhdGE7XG4gICAgdGhpcy5fZGF0YSA9IG5ld0RhdGE7XG4gICAgdmFyIGtleXMsIGtleSwgaTtcbiAgICAvLyB1bnByb3h5IGtleXMgbm90IHByZXNlbnQgaW4gbmV3IGRhdGFcbiAgICBrZXlzID0gT2JqZWN0LmtleXMob2xkRGF0YSk7XG4gICAgaSA9IGtleXMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICBpZiAoIShrZXkgaW4gbmV3RGF0YSkpIHtcbiAgICAgICAgdGhpcy5fdW5wcm94eShrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBwcm94eSBrZXlzIG5vdCBhbHJlYWR5IHByb3hpZWQsXG4gICAgLy8gYW5kIHRyaWdnZXIgY2hhbmdlIGZvciBjaGFuZ2VkIHZhbHVlc1xuICAgIGtleXMgPSBPYmplY3Qua2V5cyhuZXdEYXRhKTtcbiAgICBpID0ga2V5cy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAga2V5ID0ga2V5c1tpXTtcbiAgICAgIGlmICghaGFzT3duKHRoaXMsIGtleSkpIHtcbiAgICAgICAgLy8gbmV3IHByb3BlcnR5XG4gICAgICAgIHRoaXMuX3Byb3h5KGtleSk7XG4gICAgICB9XG4gICAgfVxuICAgIG9sZERhdGEuX19vYl9fLnJlbW92ZVZtKHRoaXMpO1xuICAgIG9ic2VydmUobmV3RGF0YSwgdGhpcyk7XG4gICAgdGhpcy5fZGlnZXN0KCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFByb3h5IGEgcHJvcGVydHksIHNvIHRoYXRcbiAgICogdm0ucHJvcCA9PT0gdm0uX2RhdGEucHJvcFxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuX3Byb3h5ID0gZnVuY3Rpb24gKGtleSkge1xuICAgIGlmICghaXNSZXNlcnZlZChrZXkpKSB7XG4gICAgICAvLyBuZWVkIHRvIHN0b3JlIHJlZiB0byBzZWxmIGhlcmVcbiAgICAgIC8vIGJlY2F1c2UgdGhlc2UgZ2V0dGVyL3NldHRlcnMgbWlnaHRcbiAgICAgIC8vIGJlIGNhbGxlZCBieSBjaGlsZCBzY29wZXMgdmlhXG4gICAgICAvLyBwcm90b3R5cGUgaW5oZXJpdGFuY2UuXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VsZiwga2V5LCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBwcm94eUdldHRlcigpIHtcbiAgICAgICAgICByZXR1cm4gc2VsZi5fZGF0YVtrZXldO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHByb3h5U2V0dGVyKHZhbCkge1xuICAgICAgICAgIHNlbGYuX2RhdGFba2V5XSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBVbnByb3h5IGEgcHJvcGVydHkuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS5fdW5wcm94eSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAoIWlzUmVzZXJ2ZWQoa2V5KSkge1xuICAgICAgZGVsZXRlIHRoaXNba2V5XTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEZvcmNlIHVwZGF0ZSBvbiBldmVyeSB3YXRjaGVyIGluIHNjb3BlLlxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLl9kaWdlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLl93YXRjaGVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHRoaXMuX3dhdGNoZXJzW2ldLnVwZGF0ZSh0cnVlKTsgLy8gc2hhbGxvdyB1cGRhdGVzXG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBTZXR1cCBjb21wdXRlZCBwcm9wZXJ0aWVzLiBUaGV5IGFyZSBlc3NlbnRpYWxseVxuICAgKiBzcGVjaWFsIGdldHRlci9zZXR0ZXJzXG4gICAqL1xuXG4gIGZ1bmN0aW9uIG5vb3AoKSB7fVxuICBWdWUucHJvdG90eXBlLl9pbml0Q29tcHV0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbXB1dGVkID0gdGhpcy4kb3B0aW9ucy5jb21wdXRlZDtcbiAgICBpZiAoY29tcHV0ZWQpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBjb21wdXRlZCkge1xuICAgICAgICB2YXIgdXNlckRlZiA9IGNvbXB1dGVkW2tleV07XG4gICAgICAgIHZhciBkZWYgPSB7XG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHR5cGVvZiB1c2VyRGVmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgZGVmLmdldCA9IG1ha2VDb21wdXRlZEdldHRlcih1c2VyRGVmLCB0aGlzKTtcbiAgICAgICAgICBkZWYuc2V0ID0gbm9vcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWYuZ2V0ID0gdXNlckRlZi5nZXQgPyB1c2VyRGVmLmNhY2hlICE9PSBmYWxzZSA/IG1ha2VDb21wdXRlZEdldHRlcih1c2VyRGVmLmdldCwgdGhpcykgOiBiaW5kKHVzZXJEZWYuZ2V0LCB0aGlzKSA6IG5vb3A7XG4gICAgICAgICAgZGVmLnNldCA9IHVzZXJEZWYuc2V0ID8gYmluZCh1c2VyRGVmLnNldCwgdGhpcykgOiBub29wO1xuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBrZXksIGRlZik7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIG1ha2VDb21wdXRlZEdldHRlcihnZXR0ZXIsIG93bmVyKSB7XG4gICAgdmFyIHdhdGNoZXIgPSBuZXcgV2F0Y2hlcihvd25lciwgZ2V0dGVyLCBudWxsLCB7XG4gICAgICBsYXp5OiB0cnVlXG4gICAgfSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNvbXB1dGVkR2V0dGVyKCkge1xuICAgICAgaWYgKHdhdGNoZXIuZGlydHkpIHtcbiAgICAgICAgd2F0Y2hlci5ldmFsdWF0ZSgpO1xuICAgICAgfVxuICAgICAgaWYgKERlcC50YXJnZXQpIHtcbiAgICAgICAgd2F0Y2hlci5kZXBlbmQoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB3YXRjaGVyLnZhbHVlO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2V0dXAgaW5zdGFuY2UgbWV0aG9kcy4gTWV0aG9kcyBtdXN0IGJlIGJvdW5kIHRvIHRoZVxuICAgKiBpbnN0YW5jZSBzaW5jZSB0aGV5IG1pZ2h0IGJlIHBhc3NlZCBkb3duIGFzIGEgcHJvcCB0b1xuICAgKiBjaGlsZCBjb21wb25lbnRzLlxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLl9pbml0TWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWV0aG9kcyA9IHRoaXMuJG9wdGlvbnMubWV0aG9kcztcbiAgICBpZiAobWV0aG9kcykge1xuICAgICAgZm9yICh2YXIga2V5IGluIG1ldGhvZHMpIHtcbiAgICAgICAgdGhpc1trZXldID0gYmluZChtZXRob2RzW2tleV0sIHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBtZXRhIGluZm9ybWF0aW9uIGxpa2UgJGluZGV4LCAka2V5ICYgJHZhbHVlLlxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLl9pbml0TWV0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWV0YXMgPSB0aGlzLiRvcHRpb25zLl9tZXRhO1xuICAgIGlmIChtZXRhcykge1xuICAgICAgZm9yICh2YXIga2V5IGluIG1ldGFzKSB7XG4gICAgICAgIGRlZmluZVJlYWN0aXZlKHRoaXMsIGtleSwgbWV0YXNba2V5XSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG52YXIgZXZlbnRSRSA9IC9edi1vbjp8XkAvO1xuXG5mdW5jdGlvbiBldmVudHNNaXhpbiAoVnVlKSB7XG4gIC8qKlxuICAgKiBTZXR1cCB0aGUgaW5zdGFuY2UncyBvcHRpb24gZXZlbnRzICYgd2F0Y2hlcnMuXG4gICAqIElmIHRoZSB2YWx1ZSBpcyBhIHN0cmluZywgd2UgcHVsbCBpdCBmcm9tIHRoZVxuICAgKiBpbnN0YW5jZSdzIG1ldGhvZHMgYnkgbmFtZS5cbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS5faW5pdEV2ZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHRoaXMuJG9wdGlvbnM7XG4gICAgaWYgKG9wdGlvbnMuX2FzQ29tcG9uZW50KSB7XG4gICAgICByZWdpc3RlckNvbXBvbmVudEV2ZW50cyh0aGlzLCBvcHRpb25zLmVsKTtcbiAgICB9XG4gICAgcmVnaXN0ZXJDYWxsYmFja3ModGhpcywgJyRvbicsIG9wdGlvbnMuZXZlbnRzKTtcbiAgICByZWdpc3RlckNhbGxiYWNrcyh0aGlzLCAnJHdhdGNoJywgb3B0aW9ucy53YXRjaCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIHYtb24gZXZlbnRzIG9uIGEgY2hpbGQgY29tcG9uZW50XG4gICAqXG4gICAqIEBwYXJhbSB7VnVlfSB2bVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50RXZlbnRzKHZtLCBlbCkge1xuICAgIHZhciBhdHRycyA9IGVsLmF0dHJpYnV0ZXM7XG4gICAgdmFyIG5hbWUsIGhhbmRsZXI7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdHRycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIG5hbWUgPSBhdHRyc1tpXS5uYW1lO1xuICAgICAgaWYgKGV2ZW50UkUudGVzdChuYW1lKSkge1xuICAgICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKGV2ZW50UkUsICcnKTtcbiAgICAgICAgaGFuZGxlciA9ICh2bS5fc2NvcGUgfHwgdm0uX2NvbnRleHQpLiRldmFsKGF0dHJzW2ldLnZhbHVlLCB0cnVlKTtcbiAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgaGFuZGxlci5fZnJvbVBhcmVudCA9IHRydWU7XG4gICAgICAgICAgdm0uJG9uKG5hbWUucmVwbGFjZShldmVudFJFKSwgaGFuZGxlcik7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgIHdhcm4oJ3Ytb246JyArIG5hbWUgKyAnPVwiJyArIGF0dHJzW2ldLnZhbHVlICsgJ1wiJyArICh2bS4kb3B0aW9ucy5uYW1lID8gJyBvbiBjb21wb25lbnQgPCcgKyB2bS4kb3B0aW9ucy5uYW1lICsgJz4nIDogJycpICsgJyBleHBlY3RzIGEgZnVuY3Rpb24gdmFsdWUsIGdvdCAnICsgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgY2FsbGJhY2tzIGZvciBvcHRpb24gZXZlbnRzIGFuZCB3YXRjaGVycy5cbiAgICpcbiAgICogQHBhcmFtIHtWdWV9IHZtXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBhY3Rpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGhhc2hcbiAgICovXG5cbiAgZnVuY3Rpb24gcmVnaXN0ZXJDYWxsYmFja3Modm0sIGFjdGlvbiwgaGFzaCkge1xuICAgIGlmICghaGFzaCkgcmV0dXJuO1xuICAgIHZhciBoYW5kbGVycywga2V5LCBpLCBqO1xuICAgIGZvciAoa2V5IGluIGhhc2gpIHtcbiAgICAgIGhhbmRsZXJzID0gaGFzaFtrZXldO1xuICAgICAgaWYgKGlzQXJyYXkoaGFuZGxlcnMpKSB7XG4gICAgICAgIGZvciAoaSA9IDAsIGogPSBoYW5kbGVycy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICByZWdpc3Rlcih2bSwgYWN0aW9uLCBrZXksIGhhbmRsZXJzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVnaXN0ZXIodm0sIGFjdGlvbiwga2V5LCBoYW5kbGVycyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciB0byByZWdpc3RlciBhbiBldmVudC93YXRjaCBjYWxsYmFjay5cbiAgICpcbiAgICogQHBhcmFtIHtWdWV9IHZtXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBhY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufFN0cmluZ3xPYmplY3R9IGhhbmRsZXJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICAgKi9cblxuICBmdW5jdGlvbiByZWdpc3Rlcih2bSwgYWN0aW9uLCBrZXksIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBoYW5kbGVyO1xuICAgIGlmICh0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2bVthY3Rpb25dKGtleSwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgdmFyIG1ldGhvZHMgPSB2bS4kb3B0aW9ucy5tZXRob2RzO1xuICAgICAgdmFyIG1ldGhvZCA9IG1ldGhvZHMgJiYgbWV0aG9kc1toYW5kbGVyXTtcbiAgICAgIGlmIChtZXRob2QpIHtcbiAgICAgICAgdm1bYWN0aW9uXShrZXksIG1ldGhvZCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oJ1Vua25vd24gbWV0aG9kOiBcIicgKyBoYW5kbGVyICsgJ1wiIHdoZW4gJyArICdyZWdpc3RlcmluZyBjYWxsYmFjayBmb3IgJyArIGFjdGlvbiArICc6IFwiJyArIGtleSArICdcIi4nKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGhhbmRsZXIgJiYgdHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHJlZ2lzdGVyKHZtLCBhY3Rpb24sIGtleSwgaGFuZGxlci5oYW5kbGVyLCBoYW5kbGVyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0dXAgcmVjdXJzaXZlIGF0dGFjaGVkL2RldGFjaGVkIGNhbGxzXG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuX2luaXRET01Ib29rcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLiRvbignaG9vazphdHRhY2hlZCcsIG9uQXR0YWNoZWQpO1xuICAgIHRoaXMuJG9uKCdob29rOmRldGFjaGVkJywgb25EZXRhY2hlZCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIHRvIHJlY3Vyc2l2ZWx5IGNhbGwgYXR0YWNoZWQgaG9vayBvbiBjaGlsZHJlblxuICAgKi9cblxuICBmdW5jdGlvbiBvbkF0dGFjaGVkKCkge1xuICAgIGlmICghdGhpcy5faXNBdHRhY2hlZCkge1xuICAgICAgdGhpcy5faXNBdHRhY2hlZCA9IHRydWU7XG4gICAgICB0aGlzLiRjaGlsZHJlbi5mb3JFYWNoKGNhbGxBdHRhY2gpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJdGVyYXRvciB0byBjYWxsIGF0dGFjaGVkIGhvb2tcbiAgICpcbiAgICogQHBhcmFtIHtWdWV9IGNoaWxkXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGNhbGxBdHRhY2goY2hpbGQpIHtcbiAgICBpZiAoIWNoaWxkLl9pc0F0dGFjaGVkICYmIGluRG9jKGNoaWxkLiRlbCkpIHtcbiAgICAgIGNoaWxkLl9jYWxsSG9vaygnYXR0YWNoZWQnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVjdXJzaXZlbHkgY2FsbCBkZXRhY2hlZCBob29rIG9uIGNoaWxkcmVuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIG9uRGV0YWNoZWQoKSB7XG4gICAgaWYgKHRoaXMuX2lzQXR0YWNoZWQpIHtcbiAgICAgIHRoaXMuX2lzQXR0YWNoZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuJGNoaWxkcmVuLmZvckVhY2goY2FsbERldGFjaCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEl0ZXJhdG9yIHRvIGNhbGwgZGV0YWNoZWQgaG9va1xuICAgKlxuICAgKiBAcGFyYW0ge1Z1ZX0gY2hpbGRcbiAgICovXG5cbiAgZnVuY3Rpb24gY2FsbERldGFjaChjaGlsZCkge1xuICAgIGlmIChjaGlsZC5faXNBdHRhY2hlZCAmJiAhaW5Eb2MoY2hpbGQuJGVsKSkge1xuICAgICAgY2hpbGQuX2NhbGxIb29rKCdkZXRhY2hlZCcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VyIGFsbCBoYW5kbGVycyBmb3IgYSBob29rXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBob29rXG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuX2NhbGxIb29rID0gZnVuY3Rpb24gKGhvb2spIHtcbiAgICB0aGlzLiRlbWl0KCdwcmUtaG9vazonICsgaG9vayk7XG4gICAgdmFyIGhhbmRsZXJzID0gdGhpcy4kb3B0aW9uc1tob29rXTtcbiAgICBpZiAoaGFuZGxlcnMpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gaGFuZGxlcnMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgIGhhbmRsZXJzW2ldLmNhbGwodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuJGVtaXQoJ2hvb2s6JyArIGhvb2spO1xuICB9O1xufVxuXG5mdW5jdGlvbiBub29wKCkge31cblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSBsaW5rcyBhIERPTSBlbGVtZW50IHdpdGggYSBwaWVjZSBvZiBkYXRhLFxuICogd2hpY2ggaXMgdGhlIHJlc3VsdCBvZiBldmFsdWF0aW5nIGFuIGV4cHJlc3Npb24uXG4gKiBJdCByZWdpc3RlcnMgYSB3YXRjaGVyIHdpdGggdGhlIGV4cHJlc3Npb24gYW5kIGNhbGxzXG4gKiB0aGUgRE9NIHVwZGF0ZSBmdW5jdGlvbiB3aGVuIGEgY2hhbmdlIGlzIHRyaWdnZXJlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtOb2RlfSBlbFxuICogQHBhcmFtIHtWdWV9IHZtXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzY3JpcHRvclxuICogICAgICAgICAgICAgICAgIC0ge1N0cmluZ30gbmFtZVxuICogICAgICAgICAgICAgICAgIC0ge09iamVjdH0gZGVmXG4gKiAgICAgICAgICAgICAgICAgLSB7U3RyaW5nfSBleHByZXNzaW9uXG4gKiAgICAgICAgICAgICAgICAgLSB7QXJyYXk8T2JqZWN0Pn0gW2ZpbHRlcnNdXG4gKiAgICAgICAgICAgICAgICAgLSB7Qm9vbGVhbn0gbGl0ZXJhbFxuICogICAgICAgICAgICAgICAgIC0ge1N0cmluZ30gYXR0clxuICogICAgICAgICAgICAgICAgIC0ge1N0cmluZ30gcmF3XG4gKiBAcGFyYW0ge09iamVjdH0gZGVmIC0gZGlyZWN0aXZlIGRlZmluaXRpb24gb2JqZWN0XG4gKiBAcGFyYW0ge1Z1ZX0gW2hvc3RdIC0gdHJhbnNjbHVzaW9uIGhvc3QgY29tcG9uZW50XG4gKiBAcGFyYW0ge09iamVjdH0gW3Njb3BlXSAtIHYtZm9yIHNjb3BlXG4gKiBAcGFyYW0ge0ZyYWdtZW50fSBbZnJhZ10gLSBvd25lciBmcmFnbWVudFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIERpcmVjdGl2ZShkZXNjcmlwdG9yLCB2bSwgZWwsIGhvc3QsIHNjb3BlLCBmcmFnKSB7XG4gIHRoaXMudm0gPSB2bTtcbiAgdGhpcy5lbCA9IGVsO1xuICAvLyBjb3B5IGRlc2NyaXB0b3IgcHJvcGVydGllc1xuICB0aGlzLmRlc2NyaXB0b3IgPSBkZXNjcmlwdG9yO1xuICB0aGlzLm5hbWUgPSBkZXNjcmlwdG9yLm5hbWU7XG4gIHRoaXMuZXhwcmVzc2lvbiA9IGRlc2NyaXB0b3IuZXhwcmVzc2lvbjtcbiAgdGhpcy5hcmcgPSBkZXNjcmlwdG9yLmFyZztcbiAgdGhpcy5tb2RpZmllcnMgPSBkZXNjcmlwdG9yLm1vZGlmaWVycztcbiAgdGhpcy5maWx0ZXJzID0gZGVzY3JpcHRvci5maWx0ZXJzO1xuICB0aGlzLmxpdGVyYWwgPSB0aGlzLm1vZGlmaWVycyAmJiB0aGlzLm1vZGlmaWVycy5saXRlcmFsO1xuICAvLyBwcml2YXRlXG4gIHRoaXMuX2xvY2tlZCA9IGZhbHNlO1xuICB0aGlzLl9ib3VuZCA9IGZhbHNlO1xuICB0aGlzLl9saXN0ZW5lcnMgPSBudWxsO1xuICAvLyBsaW5rIGNvbnRleHRcbiAgdGhpcy5faG9zdCA9IGhvc3Q7XG4gIHRoaXMuX3Njb3BlID0gc2NvcGU7XG4gIHRoaXMuX2ZyYWcgPSBmcmFnO1xuICAvLyBzdG9yZSBkaXJlY3RpdmVzIG9uIG5vZGUgaW4gZGV2IG1vZGVcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgdGhpcy5lbCkge1xuICAgIHRoaXMuZWwuX3Z1ZV9kaXJlY3RpdmVzID0gdGhpcy5lbC5fdnVlX2RpcmVjdGl2ZXMgfHwgW107XG4gICAgdGhpcy5lbC5fdnVlX2RpcmVjdGl2ZXMucHVzaCh0aGlzKTtcbiAgfVxufVxuXG4vKipcbiAqIEluaXRpYWxpemUgdGhlIGRpcmVjdGl2ZSwgbWl4aW4gZGVmaW5pdGlvbiBwcm9wZXJ0aWVzLFxuICogc2V0dXAgdGhlIHdhdGNoZXIsIGNhbGwgZGVmaW5pdGlvbiBiaW5kKCkgYW5kIHVwZGF0ZSgpXG4gKiBpZiBwcmVzZW50LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZcbiAqL1xuXG5EaXJlY3RpdmUucHJvdG90eXBlLl9iaW5kID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbmFtZSA9IHRoaXMubmFtZTtcbiAgdmFyIGRlc2NyaXB0b3IgPSB0aGlzLmRlc2NyaXB0b3I7XG5cbiAgLy8gcmVtb3ZlIGF0dHJpYnV0ZVxuICBpZiAoKG5hbWUgIT09ICdjbG9haycgfHwgdGhpcy52bS5faXNDb21waWxlZCkgJiYgdGhpcy5lbCAmJiB0aGlzLmVsLnJlbW92ZUF0dHJpYnV0ZSkge1xuICAgIHZhciBhdHRyID0gZGVzY3JpcHRvci5hdHRyIHx8ICd2LScgKyBuYW1lO1xuICAgIHRoaXMuZWwucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xuICB9XG5cbiAgLy8gY29weSBkZWYgcHJvcGVydGllc1xuICB2YXIgZGVmID0gZGVzY3JpcHRvci5kZWY7XG4gIGlmICh0eXBlb2YgZGVmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy51cGRhdGUgPSBkZWY7XG4gIH0gZWxzZSB7XG4gICAgZXh0ZW5kKHRoaXMsIGRlZik7XG4gIH1cblxuICAvLyBzZXR1cCBkaXJlY3RpdmUgcGFyYW1zXG4gIHRoaXMuX3NldHVwUGFyYW1zKCk7XG5cbiAgLy8gaW5pdGlhbCBiaW5kXG4gIGlmICh0aGlzLmJpbmQpIHtcbiAgICB0aGlzLmJpbmQoKTtcbiAgfVxuICB0aGlzLl9ib3VuZCA9IHRydWU7XG5cbiAgaWYgKHRoaXMubGl0ZXJhbCkge1xuICAgIHRoaXMudXBkYXRlICYmIHRoaXMudXBkYXRlKGRlc2NyaXB0b3IucmF3KTtcbiAgfSBlbHNlIGlmICgodGhpcy5leHByZXNzaW9uIHx8IHRoaXMubW9kaWZpZXJzKSAmJiAodGhpcy51cGRhdGUgfHwgdGhpcy50d29XYXkpICYmICF0aGlzLl9jaGVja1N0YXRlbWVudCgpKSB7XG4gICAgLy8gd3JhcHBlZCB1cGRhdGVyIGZvciBjb250ZXh0XG4gICAgdmFyIGRpciA9IHRoaXM7XG4gICAgaWYgKHRoaXMudXBkYXRlKSB7XG4gICAgICB0aGlzLl91cGRhdGUgPSBmdW5jdGlvbiAodmFsLCBvbGRWYWwpIHtcbiAgICAgICAgaWYgKCFkaXIuX2xvY2tlZCkge1xuICAgICAgICAgIGRpci51cGRhdGUodmFsLCBvbGRWYWwpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl91cGRhdGUgPSBub29wO1xuICAgIH1cbiAgICB2YXIgcHJlUHJvY2VzcyA9IHRoaXMuX3ByZVByb2Nlc3MgPyBiaW5kKHRoaXMuX3ByZVByb2Nlc3MsIHRoaXMpIDogbnVsbDtcbiAgICB2YXIgcG9zdFByb2Nlc3MgPSB0aGlzLl9wb3N0UHJvY2VzcyA/IGJpbmQodGhpcy5fcG9zdFByb2Nlc3MsIHRoaXMpIDogbnVsbDtcbiAgICB2YXIgd2F0Y2hlciA9IHRoaXMuX3dhdGNoZXIgPSBuZXcgV2F0Y2hlcih0aGlzLnZtLCB0aGlzLmV4cHJlc3Npb24sIHRoaXMuX3VwZGF0ZSwgLy8gY2FsbGJhY2tcbiAgICB7XG4gICAgICBmaWx0ZXJzOiB0aGlzLmZpbHRlcnMsXG4gICAgICB0d29XYXk6IHRoaXMudHdvV2F5LFxuICAgICAgZGVlcDogdGhpcy5kZWVwLFxuICAgICAgcHJlUHJvY2VzczogcHJlUHJvY2VzcyxcbiAgICAgIHBvc3RQcm9jZXNzOiBwb3N0UHJvY2VzcyxcbiAgICAgIHNjb3BlOiB0aGlzLl9zY29wZVxuICAgIH0pO1xuICAgIC8vIHYtbW9kZWwgd2l0aCBpbml0YWwgaW5saW5lIHZhbHVlIG5lZWQgdG8gc3luYyBiYWNrIHRvXG4gICAgLy8gbW9kZWwgaW5zdGVhZCBvZiB1cGRhdGUgdG8gRE9NIG9uIGluaXQuIFRoZXkgd291bGRcbiAgICAvLyBzZXQgdGhlIGFmdGVyQmluZCBob29rIHRvIGluZGljYXRlIHRoYXQuXG4gICAgaWYgKHRoaXMuYWZ0ZXJCaW5kKSB7XG4gICAgICB0aGlzLmFmdGVyQmluZCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy51cGRhdGUpIHtcbiAgICAgIHRoaXMudXBkYXRlKHdhdGNoZXIudmFsdWUpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBTZXR1cCBhbGwgcGFyYW0gYXR0cmlidXRlcywgZS5nLiB0cmFjay1ieSxcbiAqIHRyYW5zaXRpb24tbW9kZSwgZXRjLi4uXG4gKi9cblxuRGlyZWN0aXZlLnByb3RvdHlwZS5fc2V0dXBQYXJhbXMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghdGhpcy5wYXJhbXMpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIHBhcmFtcyA9IHRoaXMucGFyYW1zO1xuICAvLyBzd2FwIHRoZSBwYXJhbXMgYXJyYXkgd2l0aCBhIGZyZXNoIG9iamVjdC5cbiAgdGhpcy5wYXJhbXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB2YXIgaSA9IHBhcmFtcy5sZW5ndGg7XG4gIHZhciBrZXksIHZhbCwgbWFwcGVkS2V5O1xuICB3aGlsZSAoaS0tKSB7XG4gICAga2V5ID0gcGFyYW1zW2ldO1xuICAgIG1hcHBlZEtleSA9IGNhbWVsaXplKGtleSk7XG4gICAgdmFsID0gZ2V0QmluZEF0dHIodGhpcy5lbCwga2V5KTtcbiAgICBpZiAodmFsICE9IG51bGwpIHtcbiAgICAgIC8vIGR5bmFtaWNcbiAgICAgIHRoaXMuX3NldHVwUGFyYW1XYXRjaGVyKG1hcHBlZEtleSwgdmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc3RhdGljXG4gICAgICB2YWwgPSBnZXRBdHRyKHRoaXMuZWwsIGtleSk7XG4gICAgICBpZiAodmFsICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5wYXJhbXNbbWFwcGVkS2V5XSA9IHZhbCA9PT0gJycgPyB0cnVlIDogdmFsO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBTZXR1cCBhIHdhdGNoZXIgZm9yIGEgZHluYW1pYyBwYXJhbS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0ge1N0cmluZ30gZXhwcmVzc2lvblxuICovXG5cbkRpcmVjdGl2ZS5wcm90b3R5cGUuX3NldHVwUGFyYW1XYXRjaGVyID0gZnVuY3Rpb24gKGtleSwgZXhwcmVzc2lvbikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBjYWxsZWQgPSBmYWxzZTtcbiAgdmFyIHVud2F0Y2ggPSAodGhpcy5fc2NvcGUgfHwgdGhpcy52bSkuJHdhdGNoKGV4cHJlc3Npb24sIGZ1bmN0aW9uICh2YWwsIG9sZFZhbCkge1xuICAgIHNlbGYucGFyYW1zW2tleV0gPSB2YWw7XG4gICAgLy8gc2luY2Ugd2UgYXJlIGluIGltbWVkaWF0ZSBtb2RlLFxuICAgIC8vIG9ubHkgY2FsbCB0aGUgcGFyYW0gY2hhbmdlIGNhbGxiYWNrcyBpZiB0aGlzIGlzIG5vdCB0aGUgZmlyc3QgdXBkYXRlLlxuICAgIGlmIChjYWxsZWQpIHtcbiAgICAgIHZhciBjYiA9IHNlbGYucGFyYW1XYXRjaGVycyAmJiBzZWxmLnBhcmFtV2F0Y2hlcnNba2V5XTtcbiAgICAgIGlmIChjYikge1xuICAgICAgICBjYi5jYWxsKHNlbGYsIHZhbCwgb2xkVmFsKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICB9XG4gIH0sIHtcbiAgICBpbW1lZGlhdGU6IHRydWUsXG4gICAgdXNlcjogZmFsc2VcbiAgfSk7KHRoaXMuX3BhcmFtVW53YXRjaEZucyB8fCAodGhpcy5fcGFyYW1VbndhdGNoRm5zID0gW10pKS5wdXNoKHVud2F0Y2gpO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZGlyZWN0aXZlIGlzIGEgZnVuY3Rpb24gY2FsbGVyXG4gKiBhbmQgaWYgdGhlIGV4cHJlc3Npb24gaXMgYSBjYWxsYWJsZSBvbmUuIElmIGJvdGggdHJ1ZSxcbiAqIHdlIHdyYXAgdXAgdGhlIGV4cHJlc3Npb24gYW5kIHVzZSBpdCBhcyB0aGUgZXZlbnRcbiAqIGhhbmRsZXIuXG4gKlxuICogZS5nLiBvbi1jbGljaz1cImErK1wiXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5EaXJlY3RpdmUucHJvdG90eXBlLl9jaGVja1N0YXRlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGV4cHJlc3Npb24gPSB0aGlzLmV4cHJlc3Npb247XG4gIGlmIChleHByZXNzaW9uICYmIHRoaXMuYWNjZXB0U3RhdGVtZW50ICYmICFpc1NpbXBsZVBhdGgoZXhwcmVzc2lvbikpIHtcbiAgICB2YXIgZm4gPSBwYXJzZUV4cHJlc3Npb24oZXhwcmVzc2lvbikuZ2V0O1xuICAgIHZhciBzY29wZSA9IHRoaXMuX3Njb3BlIHx8IHRoaXMudm07XG4gICAgdmFyIGhhbmRsZXIgPSBmdW5jdGlvbiBoYW5kbGVyKGUpIHtcbiAgICAgIHNjb3BlLiRldmVudCA9IGU7XG4gICAgICBmbi5jYWxsKHNjb3BlLCBzY29wZSk7XG4gICAgICBzY29wZS4kZXZlbnQgPSBudWxsO1xuICAgIH07XG4gICAgaWYgKHRoaXMuZmlsdGVycykge1xuICAgICAgaGFuZGxlciA9IHNjb3BlLl9hcHBseUZpbHRlcnMoaGFuZGxlciwgbnVsbCwgdGhpcy5maWx0ZXJzKTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGUoaGFuZGxlcik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlIHdpdGggdGhlIHNldHRlci5cbiAqIFRoaXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBpbiB0d28td2F5IGRpcmVjdGl2ZXNcbiAqIGUuZy4gdi1tb2RlbC5cbiAqXG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKiBAcHVibGljXG4gKi9cblxuRGlyZWN0aXZlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgaWYgKHRoaXMudHdvV2F5KSB7XG4gICAgdGhpcy5fd2l0aExvY2soZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5fd2F0Y2hlci5zZXQodmFsdWUpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICB3YXJuKCdEaXJlY3RpdmUuc2V0KCkgY2FuIG9ubHkgYmUgdXNlZCBpbnNpZGUgdHdvV2F5JyArICdkaXJlY3RpdmVzLicpO1xuICB9XG59O1xuXG4vKipcbiAqIEV4ZWN1dGUgYSBmdW5jdGlvbiB3aGlsZSBwcmV2ZW50aW5nIHRoYXQgZnVuY3Rpb24gZnJvbVxuICogdHJpZ2dlcmluZyB1cGRhdGVzIG9uIHRoaXMgZGlyZWN0aXZlIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKi9cblxuRGlyZWN0aXZlLnByb3RvdHlwZS5fd2l0aExvY2sgPSBmdW5jdGlvbiAoZm4pIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLl9sb2NrZWQgPSB0cnVlO1xuICBmbi5jYWxsKHNlbGYpO1xuICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgc2VsZi5fbG9ja2VkID0gZmFsc2U7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBDb252ZW5pZW5jZSBtZXRob2QgdGhhdCBhdHRhY2hlcyBhIERPTSBldmVudCBsaXN0ZW5lclxuICogdG8gdGhlIGRpcmVjdGl2ZSBlbGVtZW50IGFuZCBhdXRvbWV0aWNhbGx5IHRlYXJzIGl0IGRvd25cbiAqIGR1cmluZyB1bmJpbmQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFt1c2VDYXB0dXJlXVxuICovXG5cbkRpcmVjdGl2ZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoZXZlbnQsIGhhbmRsZXIsIHVzZUNhcHR1cmUpIHtcbiAgb24odGhpcy5lbCwgZXZlbnQsIGhhbmRsZXIsIHVzZUNhcHR1cmUpOyh0aGlzLl9saXN0ZW5lcnMgfHwgKHRoaXMuX2xpc3RlbmVycyA9IFtdKSkucHVzaChbZXZlbnQsIGhhbmRsZXJdKTtcbn07XG5cbi8qKlxuICogVGVhcmRvd24gdGhlIHdhdGNoZXIgYW5kIGNhbGwgdW5iaW5kLlxuICovXG5cbkRpcmVjdGl2ZS5wcm90b3R5cGUuX3RlYXJkb3duID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fYm91bmQpIHtcbiAgICB0aGlzLl9ib3VuZCA9IGZhbHNlO1xuICAgIGlmICh0aGlzLnVuYmluZCkge1xuICAgICAgdGhpcy51bmJpbmQoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3dhdGNoZXIpIHtcbiAgICAgIHRoaXMuX3dhdGNoZXIudGVhcmRvd24oKTtcbiAgICB9XG4gICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycztcbiAgICB2YXIgaTtcbiAgICBpZiAobGlzdGVuZXJzKSB7XG4gICAgICBpID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgb2ZmKHRoaXMuZWwsIGxpc3RlbmVyc1tpXVswXSwgbGlzdGVuZXJzW2ldWzFdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHVud2F0Y2hGbnMgPSB0aGlzLl9wYXJhbVVud2F0Y2hGbnM7XG4gICAgaWYgKHVud2F0Y2hGbnMpIHtcbiAgICAgIGkgPSB1bndhdGNoRm5zLmxlbmd0aDtcbiAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgdW53YXRjaEZuc1tpXSgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB0aGlzLmVsKSB7XG4gICAgICB0aGlzLmVsLl92dWVfZGlyZWN0aXZlcy4kcmVtb3ZlKHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLnZtID0gdGhpcy5lbCA9IHRoaXMuX3dhdGNoZXIgPSB0aGlzLl9saXN0ZW5lcnMgPSBudWxsO1xuICB9XG59O1xuXG5mdW5jdGlvbiBsaWZlY3ljbGVNaXhpbiAoVnVlKSB7XG4gIC8qKlxuICAgKiBVcGRhdGUgdi1yZWYgZm9yIGNvbXBvbmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtCb29sZWFufSByZW1vdmVcbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS5fdXBkYXRlUmVmID0gZnVuY3Rpb24gKHJlbW92ZSkge1xuICAgIHZhciByZWYgPSB0aGlzLiRvcHRpb25zLl9yZWY7XG4gICAgaWYgKHJlZikge1xuICAgICAgdmFyIHJlZnMgPSAodGhpcy5fc2NvcGUgfHwgdGhpcy5fY29udGV4dCkuJHJlZnM7XG4gICAgICBpZiAocmVtb3ZlKSB7XG4gICAgICAgIGlmIChyZWZzW3JlZl0gPT09IHRoaXMpIHtcbiAgICAgICAgICByZWZzW3JlZl0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWZzW3JlZl0gPSB0aGlzO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogVHJhbnNjbHVkZSwgY29tcGlsZSBhbmQgbGluayBlbGVtZW50LlxuICAgKlxuICAgKiBJZiBhIHByZS1jb21waWxlZCBsaW5rZXIgaXMgYXZhaWxhYmxlLCB0aGF0IG1lYW5zIHRoZVxuICAgKiBwYXNzZWQgaW4gZWxlbWVudCB3aWxsIGJlIHByZS10cmFuc2NsdWRlZCBhbmQgY29tcGlsZWRcbiAgICogYXMgd2VsbCAtIGFsbCB3ZSBuZWVkIHRvIGRvIGlzIHRvIGNhbGwgdGhlIGxpbmtlci5cbiAgICpcbiAgICogT3RoZXJ3aXNlIHdlIG5lZWQgdG8gY2FsbCB0cmFuc2NsdWRlL2NvbXBpbGUvbGluayBoZXJlLlxuICAgKlxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuX2NvbXBpbGUgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHRoaXMuJG9wdGlvbnM7XG5cbiAgICAvLyB0cmFuc2NsdWRlIGFuZCBpbml0IGVsZW1lbnRcbiAgICAvLyB0cmFuc2NsdWRlIGNhbiBwb3RlbnRpYWxseSByZXBsYWNlIG9yaWdpbmFsXG4gICAgLy8gc28gd2UgbmVlZCB0byBrZWVwIHJlZmVyZW5jZTsgdGhpcyBzdGVwIGFsc28gaW5qZWN0c1xuICAgIC8vIHRoZSB0ZW1wbGF0ZSBhbmQgY2FjaGVzIHRoZSBvcmlnaW5hbCBhdHRyaWJ1dGVzXG4gICAgLy8gb24gdGhlIGNvbnRhaW5lciBub2RlIGFuZCByZXBsYWNlciBub2RlLlxuICAgIHZhciBvcmlnaW5hbCA9IGVsO1xuICAgIGVsID0gdHJhbnNjbHVkZShlbCwgb3B0aW9ucyk7XG4gICAgdGhpcy5faW5pdEVsZW1lbnQoZWwpO1xuXG4gICAgLy8gaGFuZGxlIHYtcHJlIG9uIHJvb3Qgbm9kZSAoIzIwMjYpXG4gICAgaWYgKGVsLm5vZGVUeXBlID09PSAxICYmIGdldEF0dHIoZWwsICd2LXByZScpICE9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcm9vdCBpcyBhbHdheXMgY29tcGlsZWQgcGVyLWluc3RhbmNlLCBiZWNhdXNlXG4gICAgLy8gY29udGFpbmVyIGF0dHJzIGFuZCBwcm9wcyBjYW4gYmUgZGlmZmVyZW50IGV2ZXJ5IHRpbWUuXG4gICAgdmFyIGNvbnRleHRPcHRpb25zID0gdGhpcy5fY29udGV4dCAmJiB0aGlzLl9jb250ZXh0LiRvcHRpb25zO1xuICAgIHZhciByb290TGlua2VyID0gY29tcGlsZVJvb3QoZWwsIG9wdGlvbnMsIGNvbnRleHRPcHRpb25zKTtcblxuICAgIC8vIHNjYW4gZm9yIHNsb3QgZGlzdHJpYnV0aW9uIGJlZm9yZSBjb21waWxpbmcgdGhlIGNvbnRlbnRcbiAgICAvLyBzbyB0aGF0IGl0J3MgZGVjb3VwZWxkIGZyb20gc2xvdC9kaXJlY3RpdmUgY29tcGlsYXRpb24gb3JkZXJcbiAgICBzY2FuU2xvdHMoZWwsIG9wdGlvbnMuX2NvbnRlbnQsIHRoaXMpO1xuXG4gICAgLy8gY29tcGlsZSBhbmQgbGluayB0aGUgcmVzdFxuICAgIHZhciBjb250ZW50TGlua0ZuO1xuICAgIHZhciBjdG9yID0gdGhpcy5jb25zdHJ1Y3RvcjtcbiAgICAvLyBjb21wb25lbnQgY29tcGlsYXRpb24gY2FuIGJlIGNhY2hlZFxuICAgIC8vIGFzIGxvbmcgYXMgaXQncyBub3QgdXNpbmcgaW5saW5lLXRlbXBsYXRlXG4gICAgaWYgKG9wdGlvbnMuX2xpbmtlckNhY2hhYmxlKSB7XG4gICAgICBjb250ZW50TGlua0ZuID0gY3Rvci5saW5rZXI7XG4gICAgICBpZiAoIWNvbnRlbnRMaW5rRm4pIHtcbiAgICAgICAgY29udGVudExpbmtGbiA9IGN0b3IubGlua2VyID0gY29tcGlsZShlbCwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gbGluayBwaGFzZVxuICAgIC8vIG1ha2Ugc3VyZSB0byBsaW5rIHJvb3Qgd2l0aCBwcm9wIHNjb3BlIVxuICAgIHZhciByb290VW5saW5rRm4gPSByb290TGlua2VyKHRoaXMsIGVsLCB0aGlzLl9zY29wZSk7XG4gICAgdmFyIGNvbnRlbnRVbmxpbmtGbiA9IGNvbnRlbnRMaW5rRm4gPyBjb250ZW50TGlua0ZuKHRoaXMsIGVsKSA6IGNvbXBpbGUoZWwsIG9wdGlvbnMpKHRoaXMsIGVsKTtcblxuICAgIC8vIHJlZ2lzdGVyIGNvbXBvc2l0ZSB1bmxpbmsgZnVuY3Rpb25cbiAgICAvLyB0byBiZSBjYWxsZWQgZHVyaW5nIGluc3RhbmNlIGRlc3RydWN0aW9uXG4gICAgdGhpcy5fdW5saW5rRm4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICByb290VW5saW5rRm4oKTtcbiAgICAgIC8vIHBhc3NpbmcgZGVzdHJveWluZzogdHJ1ZSB0byBhdm9pZCBzZWFyY2hpbmcgYW5kXG4gICAgICAvLyBzcGxpY2luZyB0aGUgZGlyZWN0aXZlc1xuICAgICAgY29udGVudFVubGlua0ZuKHRydWUpO1xuICAgIH07XG5cbiAgICAvLyBmaW5hbGx5IHJlcGxhY2Ugb3JpZ2luYWxcbiAgICBpZiAob3B0aW9ucy5yZXBsYWNlKSB7XG4gICAgICByZXBsYWNlKG9yaWdpbmFsLCBlbCk7XG4gICAgfVxuXG4gICAgdGhpcy5faXNDb21waWxlZCA9IHRydWU7XG4gICAgdGhpcy5fY2FsbEhvb2soJ2NvbXBpbGVkJyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgaW5zdGFuY2UgZWxlbWVudC4gQ2FsbGVkIGluIHRoZSBwdWJsaWNcbiAgICogJG1vdW50KCkgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuX2luaXRFbGVtZW50ID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgaWYgKGlzRnJhZ21lbnQoZWwpKSB7XG4gICAgICB0aGlzLl9pc0ZyYWdtZW50ID0gdHJ1ZTtcbiAgICAgIHRoaXMuJGVsID0gdGhpcy5fZnJhZ21lbnRTdGFydCA9IGVsLmZpcnN0Q2hpbGQ7XG4gICAgICB0aGlzLl9mcmFnbWVudEVuZCA9IGVsLmxhc3RDaGlsZDtcbiAgICAgIC8vIHNldCBwZXJzaXN0ZWQgdGV4dCBhbmNob3JzIHRvIGVtcHR5XG4gICAgICBpZiAodGhpcy5fZnJhZ21lbnRTdGFydC5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICB0aGlzLl9mcmFnbWVudFN0YXJ0LmRhdGEgPSB0aGlzLl9mcmFnbWVudEVuZC5kYXRhID0gJyc7XG4gICAgICB9XG4gICAgICB0aGlzLl9mcmFnbWVudCA9IGVsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRlbCA9IGVsO1xuICAgIH1cbiAgICB0aGlzLiRlbC5fX3Z1ZV9fID0gdGhpcztcbiAgICB0aGlzLl9jYWxsSG9vaygnYmVmb3JlQ29tcGlsZScpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW5kIGJpbmQgYSBkaXJlY3RpdmUgdG8gYW4gZWxlbWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBkaXJlY3RpdmUgbmFtZVxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGUgICAtIHRhcmdldCBub2RlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjIC0gcGFyc2VkIGRpcmVjdGl2ZSBkZXNjcmlwdG9yXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkZWYgIC0gZGlyZWN0aXZlIGRlZmluaXRpb24gb2JqZWN0XG4gICAqIEBwYXJhbSB7VnVlfSBbaG9zdF0gLSB0cmFuc2NsdXNpb24gaG9zdCBjb21wb25lbnRcbiAgICogQHBhcmFtIHtPYmplY3R9IFtzY29wZV0gLSB2LWZvciBzY29wZVxuICAgKiBAcGFyYW0ge0ZyYWdtZW50fSBbZnJhZ10gLSBvd25lciBmcmFnbWVudFxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLl9iaW5kRGlyID0gZnVuY3Rpb24gKGRlc2NyaXB0b3IsIG5vZGUsIGhvc3QsIHNjb3BlLCBmcmFnKSB7XG4gICAgdGhpcy5fZGlyZWN0aXZlcy5wdXNoKG5ldyBEaXJlY3RpdmUoZGVzY3JpcHRvciwgdGhpcywgbm9kZSwgaG9zdCwgc2NvcGUsIGZyYWcpKTtcbiAgfTtcblxuICAvKipcbiAgICogVGVhcmRvd24gYW4gaW5zdGFuY2UsIHVub2JzZXJ2ZXMgdGhlIGRhdGEsIHVuYmluZCBhbGwgdGhlXG4gICAqIGRpcmVjdGl2ZXMsIHR1cm4gb2ZmIGFsbCB0aGUgZXZlbnQgbGlzdGVuZXJzLCBldGMuXG4gICAqXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVtb3ZlIC0gd2hldGhlciB0byByZW1vdmUgdGhlIERPTSBub2RlLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGRlZmVyQ2xlYW51cCAtIGlmIHRydWUsIGRlZmVyIGNsZWFudXAgdG9cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZSBjYWxsZWQgbGF0ZXJcbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS5fZGVzdHJveSA9IGZ1bmN0aW9uIChyZW1vdmUsIGRlZmVyQ2xlYW51cCkge1xuICAgIGlmICh0aGlzLl9pc0JlaW5nRGVzdHJveWVkKSB7XG4gICAgICBpZiAoIWRlZmVyQ2xlYW51cCkge1xuICAgICAgICB0aGlzLl9jbGVhbnVwKCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGRlc3Ryb3lSZWFkeTtcbiAgICB2YXIgcGVuZGluZ1JlbW92YWw7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gQ2xlYW51cCBzaG91bGQgYmUgY2FsbGVkIGVpdGhlciBzeW5jaHJvbm91c2x5IG9yIGFzeW5jaHJvbm95c2x5IGFzXG4gICAgLy8gY2FsbGJhY2sgb2YgdGhpcy4kcmVtb3ZlKCksIG9yIGlmIHJlbW92ZSBhbmQgZGVmZXJDbGVhbnVwIGFyZSBmYWxzZS5cbiAgICAvLyBJbiBhbnkgY2FzZSBpdCBzaG91bGQgYmUgY2FsbGVkIGFmdGVyIGFsbCBvdGhlciByZW1vdmluZywgdW5iaW5kaW5nIGFuZFxuICAgIC8vIHR1cm5pbmcgb2YgaXMgZG9uZVxuICAgIHZhciBjbGVhbnVwSWZQb3NzaWJsZSA9IGZ1bmN0aW9uIGNsZWFudXBJZlBvc3NpYmxlKCkge1xuICAgICAgaWYgKGRlc3Ryb3lSZWFkeSAmJiAhcGVuZGluZ1JlbW92YWwgJiYgIWRlZmVyQ2xlYW51cCkge1xuICAgICAgICBzZWxmLl9jbGVhbnVwKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIHJlbW92ZSBET00gZWxlbWVudFxuICAgIGlmIChyZW1vdmUgJiYgdGhpcy4kZWwpIHtcbiAgICAgIHBlbmRpbmdSZW1vdmFsID0gdHJ1ZTtcbiAgICAgIHRoaXMuJHJlbW92ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBlbmRpbmdSZW1vdmFsID0gZmFsc2U7XG4gICAgICAgIGNsZWFudXBJZlBvc3NpYmxlKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9jYWxsSG9vaygnYmVmb3JlRGVzdHJveScpO1xuICAgIHRoaXMuX2lzQmVpbmdEZXN0cm95ZWQgPSB0cnVlO1xuICAgIHZhciBpO1xuICAgIC8vIHJlbW92ZSBzZWxmIGZyb20gcGFyZW50LiBvbmx5IG5lY2Vzc2FyeVxuICAgIC8vIGlmIHBhcmVudCBpcyBub3QgYmVpbmcgZGVzdHJveWVkIGFzIHdlbGwuXG4gICAgdmFyIHBhcmVudCA9IHRoaXMuJHBhcmVudDtcbiAgICBpZiAocGFyZW50ICYmICFwYXJlbnQuX2lzQmVpbmdEZXN0cm95ZWQpIHtcbiAgICAgIHBhcmVudC4kY2hpbGRyZW4uJHJlbW92ZSh0aGlzKTtcbiAgICAgIC8vIHVucmVnaXN0ZXIgcmVmIChyZW1vdmU6IHRydWUpXG4gICAgICB0aGlzLl91cGRhdGVSZWYodHJ1ZSk7XG4gICAgfVxuICAgIC8vIGRlc3Ryb3kgYWxsIGNoaWxkcmVuLlxuICAgIGkgPSB0aGlzLiRjaGlsZHJlbi5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgdGhpcy4kY2hpbGRyZW5baV0uJGRlc3Ryb3koKTtcbiAgICB9XG4gICAgLy8gdGVhcmRvd24gcHJvcHNcbiAgICBpZiAodGhpcy5fcHJvcHNVbmxpbmtGbikge1xuICAgICAgdGhpcy5fcHJvcHNVbmxpbmtGbigpO1xuICAgIH1cbiAgICAvLyB0ZWFyZG93biBhbGwgZGlyZWN0aXZlcy4gdGhpcyBhbHNvIHRlYXJzZG93biBhbGxcbiAgICAvLyBkaXJlY3RpdmUtb3duZWQgd2F0Y2hlcnMuXG4gICAgaWYgKHRoaXMuX3VubGlua0ZuKSB7XG4gICAgICB0aGlzLl91bmxpbmtGbigpO1xuICAgIH1cbiAgICBpID0gdGhpcy5fd2F0Y2hlcnMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHRoaXMuX3dhdGNoZXJzW2ldLnRlYXJkb3duKCk7XG4gICAgfVxuICAgIC8vIHJlbW92ZSByZWZlcmVuY2UgdG8gc2VsZiBvbiAkZWxcbiAgICBpZiAodGhpcy4kZWwpIHtcbiAgICAgIHRoaXMuJGVsLl9fdnVlX18gPSBudWxsO1xuICAgIH1cblxuICAgIGRlc3Ryb3lSZWFkeSA9IHRydWU7XG4gICAgY2xlYW51cElmUG9zc2libGUoKTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xlYW4gdXAgdG8gZW5zdXJlIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICogVGhpcyBpcyBjYWxsZWQgYWZ0ZXIgdGhlIGxlYXZlIHRyYW5zaXRpb24gaWYgdGhlcmVcbiAgICogaXMgYW55LlxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLl9jbGVhbnVwID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9pc0Rlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyByZW1vdmUgc2VsZiBmcm9tIG93bmVyIGZyYWdtZW50XG4gICAgLy8gZG8gaXQgaW4gY2xlYW51cCBzbyB0aGF0IHdlIGNhbiBjYWxsICRkZXN0cm95IHdpdGhcbiAgICAvLyBkZWZlciByaWdodCB3aGVuIGEgZnJhZ21lbnQgaXMgYWJvdXQgdG8gYmUgcmVtb3ZlZC5cbiAgICBpZiAodGhpcy5fZnJhZykge1xuICAgICAgdGhpcy5fZnJhZy5jaGlsZHJlbi4kcmVtb3ZlKHRoaXMpO1xuICAgIH1cbiAgICAvLyByZW1vdmUgcmVmZXJlbmNlIGZyb20gZGF0YSBvYlxuICAgIC8vIGZyb3plbiBvYmplY3QgbWF5IG5vdCBoYXZlIG9ic2VydmVyLlxuICAgIGlmICh0aGlzLl9kYXRhLl9fb2JfXykge1xuICAgICAgdGhpcy5fZGF0YS5fX29iX18ucmVtb3ZlVm0odGhpcyk7XG4gICAgfVxuICAgIC8vIENsZWFuIHVwIHJlZmVyZW5jZXMgdG8gcHJpdmF0ZSBwcm9wZXJ0aWVzIGFuZCBvdGhlclxuICAgIC8vIGluc3RhbmNlcy4gcHJlc2VydmUgcmVmZXJlbmNlIHRvIF9kYXRhIHNvIHRoYXQgcHJveHlcbiAgICAvLyBhY2Nlc3NvcnMgc3RpbGwgd29yay4gVGhlIG9ubHkgcG90ZW50aWFsIHNpZGUgZWZmZWN0XG4gICAgLy8gaGVyZSBpcyB0aGF0IG11dGF0aW5nIHRoZSBpbnN0YW5jZSBhZnRlciBpdCdzIGRlc3Ryb3llZFxuICAgIC8vIG1heSBhZmZlY3QgdGhlIHN0YXRlIG9mIG90aGVyIGNvbXBvbmVudHMgdGhhdCBhcmUgc3RpbGxcbiAgICAvLyBvYnNlcnZpbmcgdGhlIHNhbWUgb2JqZWN0LCBidXQgdGhhdCBzZWVtcyB0byBiZSBhXG4gICAgLy8gcmVhc29uYWJsZSByZXNwb25zaWJpbGl0eSBmb3IgdGhlIHVzZXIgcmF0aGVyIHRoYW5cbiAgICAvLyBhbHdheXMgdGhyb3dpbmcgYW4gZXJyb3Igb24gdGhlbS5cbiAgICB0aGlzLiRlbCA9IHRoaXMuJHBhcmVudCA9IHRoaXMuJHJvb3QgPSB0aGlzLiRjaGlsZHJlbiA9IHRoaXMuX3dhdGNoZXJzID0gdGhpcy5fY29udGV4dCA9IHRoaXMuX3Njb3BlID0gdGhpcy5fZGlyZWN0aXZlcyA9IG51bGw7XG4gICAgLy8gY2FsbCB0aGUgbGFzdCBob29rLi4uXG4gICAgdGhpcy5faXNEZXN0cm95ZWQgPSB0cnVlO1xuICAgIHRoaXMuX2NhbGxIb29rKCdkZXN0cm95ZWQnKTtcbiAgICAvLyB0dXJuIG9mZiBhbGwgaW5zdGFuY2UgbGlzdGVuZXJzLlxuICAgIHRoaXMuJG9mZigpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBtaXNjTWl4aW4gKFZ1ZSkge1xuICAvKipcbiAgICogQXBwbHkgYSBsaXN0IG9mIGZpbHRlciAoZGVzY3JpcHRvcnMpIHRvIGEgdmFsdWUuXG4gICAqIFVzaW5nIHBsYWluIGZvciBsb29wcyBoZXJlIGJlY2F1c2UgdGhpcyB3aWxsIGJlIGNhbGxlZCBpblxuICAgKiB0aGUgZ2V0dGVyIG9mIGFueSB3YXRjaGVyIHdpdGggZmlsdGVycyBzbyBpdCBpcyB2ZXJ5XG4gICAqIHBlcmZvcm1hbmNlIHNlbnNpdGl2ZS5cbiAgICpcbiAgICogQHBhcmFtIHsqfSB2YWx1ZVxuICAgKiBAcGFyYW0geyp9IFtvbGRWYWx1ZV1cbiAgICogQHBhcmFtIHtBcnJheX0gZmlsdGVyc1xuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHdyaXRlXG4gICAqIEByZXR1cm4geyp9XG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuX2FwcGx5RmlsdGVycyA9IGZ1bmN0aW9uICh2YWx1ZSwgb2xkVmFsdWUsIGZpbHRlcnMsIHdyaXRlKSB7XG4gICAgdmFyIGZpbHRlciwgZm4sIGFyZ3MsIGFyZywgb2Zmc2V0LCBpLCBsLCBqLCBrO1xuICAgIGZvciAoaSA9IDAsIGwgPSBmaWx0ZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgZmlsdGVyID0gZmlsdGVyc1tpXTtcbiAgICAgIGZuID0gcmVzb2x2ZUFzc2V0KHRoaXMuJG9wdGlvbnMsICdmaWx0ZXJzJywgZmlsdGVyLm5hbWUpO1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgYXNzZXJ0QXNzZXQoZm4sICdmaWx0ZXInLCBmaWx0ZXIubmFtZSk7XG4gICAgICB9XG4gICAgICBpZiAoIWZuKSBjb250aW51ZTtcbiAgICAgIGZuID0gd3JpdGUgPyBmbi53cml0ZSA6IGZuLnJlYWQgfHwgZm47XG4gICAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSBjb250aW51ZTtcbiAgICAgIGFyZ3MgPSB3cml0ZSA/IFt2YWx1ZSwgb2xkVmFsdWVdIDogW3ZhbHVlXTtcbiAgICAgIG9mZnNldCA9IHdyaXRlID8gMiA6IDE7XG4gICAgICBpZiAoZmlsdGVyLmFyZ3MpIHtcbiAgICAgICAgZm9yIChqID0gMCwgayA9IGZpbHRlci5hcmdzLmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgIGFyZyA9IGZpbHRlci5hcmdzW2pdO1xuICAgICAgICAgIGFyZ3NbaiArIG9mZnNldF0gPSBhcmcuZHluYW1pYyA/IHRoaXMuJGdldChhcmcudmFsdWUpIDogYXJnLnZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YWx1ZSA9IGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlc29sdmUgYSBjb21wb25lbnQsIGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZSBjb21wb25lbnRcbiAgICogaXMgZGVmaW5lZCBub3JtYWxseSBvciB1c2luZyBhbiBhc3luYyBmYWN0b3J5IGZ1bmN0aW9uLlxuICAgKiBSZXNvbHZlcyBzeW5jaHJvbm91c2x5IGlmIGFscmVhZHkgcmVzb2x2ZWQsIG90aGVyd2lzZVxuICAgKiByZXNvbHZlcyBhc3luY2hyb25vdXNseSBhbmQgY2FjaGVzIHRoZSByZXNvbHZlZFxuICAgKiBjb25zdHJ1Y3RvciBvbiB0aGUgZmFjdG9yeS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuX3Jlc29sdmVDb21wb25lbnQgPSBmdW5jdGlvbiAoaWQsIGNiKSB7XG4gICAgdmFyIGZhY3RvcnkgPSByZXNvbHZlQXNzZXQodGhpcy4kb3B0aW9ucywgJ2NvbXBvbmVudHMnLCBpZCk7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydEFzc2V0KGZhY3RvcnksICdjb21wb25lbnQnLCBpZCk7XG4gICAgfVxuICAgIGlmICghZmFjdG9yeSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBhc3luYyBjb21wb25lbnQgZmFjdG9yeVxuICAgIGlmICghZmFjdG9yeS5vcHRpb25zKSB7XG4gICAgICBpZiAoZmFjdG9yeS5yZXNvbHZlZCkge1xuICAgICAgICAvLyBjYWNoZWRcbiAgICAgICAgY2IoZmFjdG9yeS5yZXNvbHZlZCk7XG4gICAgICB9IGVsc2UgaWYgKGZhY3RvcnkucmVxdWVzdGVkKSB7XG4gICAgICAgIC8vIHBvb2wgY2FsbGJhY2tzXG4gICAgICAgIGZhY3RvcnkucGVuZGluZ0NhbGxiYWNrcy5wdXNoKGNiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkucmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIGNicyA9IGZhY3RvcnkucGVuZGluZ0NhbGxiYWNrcyA9IFtjYl07XG4gICAgICAgIGZhY3RvcnkuY2FsbCh0aGlzLCBmdW5jdGlvbiByZXNvbHZlKHJlcykge1xuICAgICAgICAgIGlmIChpc1BsYWluT2JqZWN0KHJlcykpIHtcbiAgICAgICAgICAgIHJlcyA9IFZ1ZS5leHRlbmQocmVzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gY2FjaGUgcmVzb2x2ZWRcbiAgICAgICAgICBmYWN0b3J5LnJlc29sdmVkID0gcmVzO1xuICAgICAgICAgIC8vIGludm9rZSBjYWxsYmFja3NcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNicy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGNic1tpXShyZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAgICAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybignRmFpbGVkIHRvIHJlc29sdmUgYXN5bmMgY29tcG9uZW50OiAnICsgaWQgKyAnLiAnICsgKHJlYXNvbiA/ICdcXG5SZWFzb246ICcgKyByZWFzb24gOiAnJykpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gbm9ybWFsIGNvbXBvbmVudFxuICAgICAgY2IoZmFjdG9yeSk7XG4gICAgfVxuICB9O1xufVxuXG52YXIgZmlsdGVyUkUkMSA9IC9bXnxdXFx8W158XS87XG5cbmZ1bmN0aW9uIGRhdGFBUEkgKFZ1ZSkge1xuICAvKipcbiAgICogR2V0IHRoZSB2YWx1ZSBmcm9tIGFuIGV4cHJlc3Npb24gb24gdGhpcyB2bS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGV4cFxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IFthc1N0YXRlbWVudF1cbiAgICogQHJldHVybiB7Kn1cbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kZ2V0ID0gZnVuY3Rpb24gKGV4cCwgYXNTdGF0ZW1lbnQpIHtcbiAgICB2YXIgcmVzID0gcGFyc2VFeHByZXNzaW9uKGV4cCk7XG4gICAgaWYgKHJlcykge1xuICAgICAgaWYgKGFzU3RhdGVtZW50ICYmICFpc1NpbXBsZVBhdGgoZXhwKSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBzdGF0ZW1lbnRIYW5kbGVyKCkge1xuICAgICAgICAgIHNlbGYuJGFyZ3VtZW50cyA9IHRvQXJyYXkoYXJndW1lbnRzKTtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gcmVzLmdldC5jYWxsKHNlbGYsIHNlbGYpO1xuICAgICAgICAgIHNlbGYuJGFyZ3VtZW50cyA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5nZXQuY2FsbCh0aGlzLCB0aGlzKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgdmFsdWUgZnJvbSBhbiBleHByZXNzaW9uIG9uIHRoaXMgdm0uXG4gICAqIFRoZSBleHByZXNzaW9uIG11c3QgYmUgYSB2YWxpZCBsZWZ0LWhhbmRcbiAgICogZXhwcmVzc2lvbiBpbiBhbiBhc3NpZ25tZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gZXhwXG4gICAqIEBwYXJhbSB7Kn0gdmFsXG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuJHNldCA9IGZ1bmN0aW9uIChleHAsIHZhbCkge1xuICAgIHZhciByZXMgPSBwYXJzZUV4cHJlc3Npb24oZXhwLCB0cnVlKTtcbiAgICBpZiAocmVzICYmIHJlcy5zZXQpIHtcbiAgICAgIHJlcy5zZXQuY2FsbCh0aGlzLCB0aGlzLCB2YWwpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRGVsZXRlIGEgcHJvcGVydHkgb24gdGhlIFZNXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kZGVsZXRlID0gZnVuY3Rpb24gKGtleSkge1xuICAgIGRlbCh0aGlzLl9kYXRhLCBrZXkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBXYXRjaCBhbiBleHByZXNzaW9uLCB0cmlnZ2VyIGNhbGxiYWNrIHdoZW4gaXRzXG4gICAqIHZhbHVlIGNoYW5nZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBleHBPckZuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAgICogICAgICAgICAgICAgICAgIC0ge0Jvb2xlYW59IGRlZXBcbiAgICogICAgICAgICAgICAgICAgIC0ge0Jvb2xlYW59IGltbWVkaWF0ZVxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gLSB1bndhdGNoRm5cbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kd2F0Y2ggPSBmdW5jdGlvbiAoZXhwT3JGbiwgY2IsIG9wdGlvbnMpIHtcbiAgICB2YXIgdm0gPSB0aGlzO1xuICAgIHZhciBwYXJzZWQ7XG4gICAgaWYgKHR5cGVvZiBleHBPckZuID09PSAnc3RyaW5nJykge1xuICAgICAgcGFyc2VkID0gcGFyc2VEaXJlY3RpdmUoZXhwT3JGbik7XG4gICAgICBleHBPckZuID0gcGFyc2VkLmV4cHJlc3Npb247XG4gICAgfVxuICAgIHZhciB3YXRjaGVyID0gbmV3IFdhdGNoZXIodm0sIGV4cE9yRm4sIGNiLCB7XG4gICAgICBkZWVwOiBvcHRpb25zICYmIG9wdGlvbnMuZGVlcCxcbiAgICAgIHN5bmM6IG9wdGlvbnMgJiYgb3B0aW9ucy5zeW5jLFxuICAgICAgZmlsdGVyczogcGFyc2VkICYmIHBhcnNlZC5maWx0ZXJzLFxuICAgICAgdXNlcjogIW9wdGlvbnMgfHwgb3B0aW9ucy51c2VyICE9PSBmYWxzZVxuICAgIH0pO1xuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuaW1tZWRpYXRlKSB7XG4gICAgICBjYi5jYWxsKHZtLCB3YXRjaGVyLnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHVud2F0Y2hGbigpIHtcbiAgICAgIHdhdGNoZXIudGVhcmRvd24oKTtcbiAgICB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBFdmFsdWF0ZSBhIHRleHQgZGlyZWN0aXZlLCBpbmNsdWRpbmcgZmlsdGVycy5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRleHRcbiAgICogQHBhcmFtIHtCb29sZWFufSBbYXNTdGF0ZW1lbnRdXG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kZXZhbCA9IGZ1bmN0aW9uICh0ZXh0LCBhc1N0YXRlbWVudCkge1xuICAgIC8vIGNoZWNrIGZvciBmaWx0ZXJzLlxuICAgIGlmIChmaWx0ZXJSRSQxLnRlc3QodGV4dCkpIHtcbiAgICAgIHZhciBkaXIgPSBwYXJzZURpcmVjdGl2ZSh0ZXh0KTtcbiAgICAgIC8vIHRoZSBmaWx0ZXIgcmVnZXggY2hlY2sgbWlnaHQgZ2l2ZSBmYWxzZSBwb3NpdGl2ZVxuICAgICAgLy8gZm9yIHBpcGVzIGluc2lkZSBzdHJpbmdzLCBzbyBpdCdzIHBvc3NpYmxlIHRoYXRcbiAgICAgIC8vIHdlIGRvbid0IGdldCBhbnkgZmlsdGVycyBoZXJlXG4gICAgICB2YXIgdmFsID0gdGhpcy4kZ2V0KGRpci5leHByZXNzaW9uLCBhc1N0YXRlbWVudCk7XG4gICAgICByZXR1cm4gZGlyLmZpbHRlcnMgPyB0aGlzLl9hcHBseUZpbHRlcnModmFsLCBudWxsLCBkaXIuZmlsdGVycykgOiB2YWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG5vIGZpbHRlclxuICAgICAgcmV0dXJuIHRoaXMuJGdldCh0ZXh0LCBhc1N0YXRlbWVudCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBJbnRlcnBvbGF0ZSBhIHBpZWNlIG9mIHRlbXBsYXRlIHRleHQuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0XG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kaW50ZXJwb2xhdGUgPSBmdW5jdGlvbiAodGV4dCkge1xuICAgIHZhciB0b2tlbnMgPSBwYXJzZVRleHQodGV4dCk7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICBpZiAodG9rZW5zKSB7XG4gICAgICBpZiAodG9rZW5zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gdm0uJGV2YWwodG9rZW5zWzBdLnZhbHVlKSArICcnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRva2Vucy5tYXAoZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgICAgcmV0dXJuIHRva2VuLnRhZyA/IHZtLiRldmFsKHRva2VuLnZhbHVlKSA6IHRva2VuLnZhbHVlO1xuICAgICAgICB9KS5qb2luKCcnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBMb2cgaW5zdGFuY2UgZGF0YSBhcyBhIHBsYWluIEpTIG9iamVjdFxuICAgKiBzbyB0aGF0IGl0IGlzIGVhc2llciB0byBpbnNwZWN0IGluIGNvbnNvbGUuXG4gICAqIFRoaXMgbWV0aG9kIGFzc3VtZXMgY29uc29sZSBpcyBhdmFpbGFibGUuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbcGF0aF1cbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kbG9nID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgICB2YXIgZGF0YSA9IHBhdGggPyBnZXRQYXRoKHRoaXMuX2RhdGEsIHBhdGgpIDogdGhpcy5fZGF0YTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgZGF0YSA9IGNsZWFuKGRhdGEpO1xuICAgIH1cbiAgICAvLyBpbmNsdWRlIGNvbXB1dGVkIGZpZWxkc1xuICAgIGlmICghcGF0aCkge1xuICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuJG9wdGlvbnMuY29tcHV0ZWQpIHtcbiAgICAgICAgZGF0YVtrZXldID0gY2xlYW4odGhpc1trZXldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS5sb2coZGF0YSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFwiY2xlYW5cIiBhIGdldHRlci9zZXR0ZXIgY29udmVydGVkIG9iamVjdCBpbnRvIGEgcGxhaW5cbiAgICogb2JqZWN0IGNvcHkuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAtIG9ialxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGNsZWFuKG9iaikge1xuICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRvbUFQSSAoVnVlKSB7XG4gIC8qKlxuICAgKiBDb252ZW5pZW5jZSBvbi1pbnN0YW5jZSBuZXh0VGljay4gVGhlIGNhbGxiYWNrIGlzXG4gICAqIGF1dG8tYm91bmQgdG8gdGhlIGluc3RhbmNlLCBhbmQgdGhpcyBhdm9pZHMgY29tcG9uZW50XG4gICAqIG1vZHVsZXMgaGF2aW5nIHRvIHJlbHkgb24gdGhlIGdsb2JhbCBWdWUuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuJG5leHRUaWNrID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgbmV4dFRpY2soZm4sIHRoaXMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBcHBlbmQgaW5zdGFuY2UgdG8gdGFyZ2V0XG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAgICogQHBhcmFtIHtCb29sZWFufSBbd2l0aFRyYW5zaXRpb25dIC0gZGVmYXVsdHMgdG8gdHJ1ZVxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLiRhcHBlbmRUbyA9IGZ1bmN0aW9uICh0YXJnZXQsIGNiLCB3aXRoVHJhbnNpdGlvbikge1xuICAgIHJldHVybiBpbnNlcnQodGhpcywgdGFyZ2V0LCBjYiwgd2l0aFRyYW5zaXRpb24sIGFwcGVuZCwgYXBwZW5kV2l0aFRyYW5zaXRpb24pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBQcmVwZW5kIGluc3RhbmNlIHRvIHRhcmdldFxuICAgKlxuICAgKiBAcGFyYW0ge05vZGV9IHRhcmdldFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW3dpdGhUcmFuc2l0aW9uXSAtIGRlZmF1bHRzIHRvIHRydWVcbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kcHJlcGVuZFRvID0gZnVuY3Rpb24gKHRhcmdldCwgY2IsIHdpdGhUcmFuc2l0aW9uKSB7XG4gICAgdGFyZ2V0ID0gcXVlcnkodGFyZ2V0KTtcbiAgICBpZiAodGFyZ2V0Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgdGhpcy4kYmVmb3JlKHRhcmdldC5maXJzdENoaWxkLCBjYiwgd2l0aFRyYW5zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRhcHBlbmRUbyh0YXJnZXQsIGNiLCB3aXRoVHJhbnNpdGlvbik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBJbnNlcnQgaW5zdGFuY2UgYmVmb3JlIHRhcmdldFxuICAgKlxuICAgKiBAcGFyYW0ge05vZGV9IHRhcmdldFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW3dpdGhUcmFuc2l0aW9uXSAtIGRlZmF1bHRzIHRvIHRydWVcbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kYmVmb3JlID0gZnVuY3Rpb24gKHRhcmdldCwgY2IsIHdpdGhUcmFuc2l0aW9uKSB7XG4gICAgcmV0dXJuIGluc2VydCh0aGlzLCB0YXJnZXQsIGNiLCB3aXRoVHJhbnNpdGlvbiwgYmVmb3JlV2l0aENiLCBiZWZvcmVXaXRoVHJhbnNpdGlvbik7XG4gIH07XG5cbiAgLyoqXG4gICAqIEluc2VydCBpbnN0YW5jZSBhZnRlciB0YXJnZXRcbiAgICpcbiAgICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IFt3aXRoVHJhbnNpdGlvbl0gLSBkZWZhdWx0cyB0byB0cnVlXG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuJGFmdGVyID0gZnVuY3Rpb24gKHRhcmdldCwgY2IsIHdpdGhUcmFuc2l0aW9uKSB7XG4gICAgdGFyZ2V0ID0gcXVlcnkodGFyZ2V0KTtcbiAgICBpZiAodGFyZ2V0Lm5leHRTaWJsaW5nKSB7XG4gICAgICB0aGlzLiRiZWZvcmUodGFyZ2V0Lm5leHRTaWJsaW5nLCBjYiwgd2l0aFRyYW5zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRhcHBlbmRUbyh0YXJnZXQucGFyZW50Tm9kZSwgY2IsIHdpdGhUcmFuc2l0aW9uKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBpbnN0YW5jZSBmcm9tIERPTVxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW3dpdGhUcmFuc2l0aW9uXSAtIGRlZmF1bHRzIHRvIHRydWVcbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kcmVtb3ZlID0gZnVuY3Rpb24gKGNiLCB3aXRoVHJhbnNpdGlvbikge1xuICAgIGlmICghdGhpcy4kZWwucGFyZW50Tm9kZSkge1xuICAgICAgcmV0dXJuIGNiICYmIGNiKCk7XG4gICAgfVxuICAgIHZhciBpbkRvY3VtZW50ID0gdGhpcy5faXNBdHRhY2hlZCAmJiBpbkRvYyh0aGlzLiRlbCk7XG4gICAgLy8gaWYgd2UgYXJlIG5vdCBpbiBkb2N1bWVudCwgbm8gbmVlZCB0byBjaGVja1xuICAgIC8vIGZvciB0cmFuc2l0aW9uc1xuICAgIGlmICghaW5Eb2N1bWVudCkgd2l0aFRyYW5zaXRpb24gPSBmYWxzZTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHJlYWxDYiA9IGZ1bmN0aW9uIHJlYWxDYigpIHtcbiAgICAgIGlmIChpbkRvY3VtZW50KSBzZWxmLl9jYWxsSG9vaygnZGV0YWNoZWQnKTtcbiAgICAgIGlmIChjYikgY2IoKTtcbiAgICB9O1xuICAgIGlmICh0aGlzLl9pc0ZyYWdtZW50KSB7XG4gICAgICByZW1vdmVOb2RlUmFuZ2UodGhpcy5fZnJhZ21lbnRTdGFydCwgdGhpcy5fZnJhZ21lbnRFbmQsIHRoaXMsIHRoaXMuX2ZyYWdtZW50LCByZWFsQ2IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgb3AgPSB3aXRoVHJhbnNpdGlvbiA9PT0gZmFsc2UgPyByZW1vdmVXaXRoQ2IgOiByZW1vdmVXaXRoVHJhbnNpdGlvbjtcbiAgICAgIG9wKHRoaXMuJGVsLCB0aGlzLCByZWFsQ2IpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogU2hhcmVkIERPTSBpbnNlcnRpb24gZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VnVlfSB2bVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW3dpdGhUcmFuc2l0aW9uXVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcDEgLSBvcCBmb3Igbm9uLXRyYW5zaXRpb24gaW5zZXJ0XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG9wMiAtIG9wIGZvciB0cmFuc2l0aW9uIGluc2VydFxuICAgKiBAcmV0dXJuIHZtXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGluc2VydCh2bSwgdGFyZ2V0LCBjYiwgd2l0aFRyYW5zaXRpb24sIG9wMSwgb3AyKSB7XG4gICAgdGFyZ2V0ID0gcXVlcnkodGFyZ2V0KTtcbiAgICB2YXIgdGFyZ2V0SXNEZXRhY2hlZCA9ICFpbkRvYyh0YXJnZXQpO1xuICAgIHZhciBvcCA9IHdpdGhUcmFuc2l0aW9uID09PSBmYWxzZSB8fCB0YXJnZXRJc0RldGFjaGVkID8gb3AxIDogb3AyO1xuICAgIHZhciBzaG91bGRDYWxsSG9vayA9ICF0YXJnZXRJc0RldGFjaGVkICYmICF2bS5faXNBdHRhY2hlZCAmJiAhaW5Eb2Modm0uJGVsKTtcbiAgICBpZiAodm0uX2lzRnJhZ21lbnQpIHtcbiAgICAgIG1hcE5vZGVSYW5nZSh2bS5fZnJhZ21lbnRTdGFydCwgdm0uX2ZyYWdtZW50RW5kLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBvcChub2RlLCB0YXJnZXQsIHZtKTtcbiAgICAgIH0pO1xuICAgICAgY2IgJiYgY2IoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3Aodm0uJGVsLCB0YXJnZXQsIHZtLCBjYik7XG4gICAgfVxuICAgIGlmIChzaG91bGRDYWxsSG9vaykge1xuICAgICAgdm0uX2NhbGxIb29rKCdhdHRhY2hlZCcpO1xuICAgIH1cbiAgICByZXR1cm4gdm07XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgZm9yIHNlbGVjdG9yc1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ3xFbGVtZW50fSBlbFxuICAgKi9cblxuICBmdW5jdGlvbiBxdWVyeShlbCkge1xuICAgIHJldHVybiB0eXBlb2YgZWwgPT09ICdzdHJpbmcnID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbCkgOiBlbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgb3BlcmF0aW9uIHRoYXQgdGFrZXMgYSBjYWxsYmFjay5cbiAgICpcbiAgICogQHBhcmFtIHtOb2RlfSBlbFxuICAgKiBAcGFyYW0ge05vZGV9IHRhcmdldFxuICAgKiBAcGFyYW0ge1Z1ZX0gdm0gLSB1bnVzZWRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXVxuICAgKi9cblxuICBmdW5jdGlvbiBhcHBlbmQoZWwsIHRhcmdldCwgdm0sIGNiKSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKGVsKTtcbiAgICBpZiAoY2IpIGNiKCk7XG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0QmVmb3JlIG9wZXJhdGlvbiB0aGF0IHRha2VzIGEgY2FsbGJhY2suXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gZWxcbiAgICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAgICogQHBhcmFtIHtWdWV9IHZtIC0gdW51c2VkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAgICovXG5cbiAgZnVuY3Rpb24gYmVmb3JlV2l0aENiKGVsLCB0YXJnZXQsIHZtLCBjYikge1xuICAgIGJlZm9yZShlbCwgdGFyZ2V0KTtcbiAgICBpZiAoY2IpIGNiKCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIG9wZXJhdGlvbiB0aGF0IHRha2VzIGEgY2FsbGJhY2suXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gZWxcbiAgICogQHBhcmFtIHtWdWV9IHZtIC0gdW51c2VkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl1cbiAgICovXG5cbiAgZnVuY3Rpb24gcmVtb3ZlV2l0aENiKGVsLCB2bSwgY2IpIHtcbiAgICByZW1vdmUoZWwpO1xuICAgIGlmIChjYikgY2IoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBldmVudHNBUEkgKFZ1ZSkge1xuICAvKipcbiAgICogTGlzdGVuIG9uIHRoZSBnaXZlbiBgZXZlbnRgIHdpdGggYGZuYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuJG9uID0gZnVuY3Rpb24gKGV2ZW50LCBmbikge1xuICAgICh0aGlzLl9ldmVudHNbZXZlbnRdIHx8ICh0aGlzLl9ldmVudHNbZXZlbnRdID0gW10pKS5wdXNoKGZuKTtcbiAgICBtb2RpZnlMaXN0ZW5lckNvdW50KHRoaXMsIGV2ZW50LCAxKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXG4gICAqIHRpbWUgdGhlbiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLiRvbmNlID0gZnVuY3Rpb24gKGV2ZW50LCBmbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiBvbigpIHtcbiAgICAgIHNlbGYuJG9mZihldmVudCwgb24pO1xuICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgb24uZm4gPSBmbjtcbiAgICB0aGlzLiRvbihldmVudCwgb24pO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxuICAgKiByZWdpc3RlcmVkIGNhbGxiYWNrcy5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuJG9mZiA9IGZ1bmN0aW9uIChldmVudCwgZm4pIHtcbiAgICB2YXIgY2JzO1xuICAgIC8vIGFsbFxuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgaWYgKHRoaXMuJHBhcmVudCkge1xuICAgICAgICBmb3IgKGV2ZW50IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgICAgIGNicyA9IHRoaXMuX2V2ZW50c1tldmVudF07XG4gICAgICAgICAgaWYgKGNicykge1xuICAgICAgICAgICAgbW9kaWZ5TGlzdGVuZXJDb3VudCh0aGlzLCBldmVudCwgLWNicy5sZW5ndGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLy8gc3BlY2lmaWMgZXZlbnRcbiAgICBjYnMgPSB0aGlzLl9ldmVudHNbZXZlbnRdO1xuICAgIGlmICghY2JzKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIG1vZGlmeUxpc3RlbmVyQ291bnQodGhpcywgZXZlbnQsIC1jYnMubGVuZ3RoKTtcbiAgICAgIHRoaXMuX2V2ZW50c1tldmVudF0gPSBudWxsO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8vIHNwZWNpZmljIGhhbmRsZXJcbiAgICB2YXIgY2I7XG4gICAgdmFyIGkgPSBjYnMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNiID0gY2JzW2ldO1xuICAgICAgaWYgKGNiID09PSBmbiB8fCBjYi5mbiA9PT0gZm4pIHtcbiAgICAgICAgbW9kaWZ5TGlzdGVuZXJDb3VudCh0aGlzLCBldmVudCwgLTEpO1xuICAgICAgICBjYnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgYW4gZXZlbnQgb24gc2VsZi5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBldmVudFxuICAgKiBAcmV0dXJuIHtCb29sZWFufSBzaG91bGRQcm9wYWdhdGVcbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kZW1pdCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBpc1NvdXJjZSA9IHR5cGVvZiBldmVudCA9PT0gJ3N0cmluZyc7XG4gICAgZXZlbnQgPSBpc1NvdXJjZSA/IGV2ZW50IDogZXZlbnQubmFtZTtcbiAgICB2YXIgY2JzID0gdGhpcy5fZXZlbnRzW2V2ZW50XTtcbiAgICB2YXIgc2hvdWxkUHJvcGFnYXRlID0gaXNTb3VyY2UgfHwgIWNicztcbiAgICBpZiAoY2JzKSB7XG4gICAgICBjYnMgPSBjYnMubGVuZ3RoID4gMSA/IHRvQXJyYXkoY2JzKSA6IGNicztcbiAgICAgIC8vIHRoaXMgaXMgYSBzb21ld2hhdCBoYWNreSBzb2x1dGlvbiB0byB0aGUgcXVlc3Rpb24gcmFpc2VkXG4gICAgICAvLyBpbiAjMjEwMjogZm9yIGFuIGlubGluZSBjb21wb25lbnQgbGlzdGVuZXIgbGlrZSA8Y29tcCBAdGVzdD1cImRvVGhpc1wiPixcbiAgICAgIC8vIHRoZSBwcm9wYWdhdGlvbiBoYW5kbGluZyBpcyBzb21ld2hhdCBicm9rZW4uIFRoZXJlZm9yZSB3ZVxuICAgICAgLy8gbmVlZCB0byB0cmVhdCB0aGVzZSBpbmxpbmUgY2FsbGJhY2tzIGRpZmZlcmVudGx5LlxuICAgICAgdmFyIGhhc1BhcmVudENicyA9IGlzU291cmNlICYmIGNicy5zb21lKGZ1bmN0aW9uIChjYikge1xuICAgICAgICByZXR1cm4gY2IuX2Zyb21QYXJlbnQ7XG4gICAgICB9KTtcbiAgICAgIGlmIChoYXNQYXJlbnRDYnMpIHtcbiAgICAgICAgc2hvdWxkUHJvcGFnYXRlID0gZmFsc2U7XG4gICAgICB9XG4gICAgICB2YXIgYXJncyA9IHRvQXJyYXkoYXJndW1lbnRzLCAxKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2JzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIgY2IgPSBjYnNbaV07XG4gICAgICAgIHZhciByZXMgPSBjYi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgaWYgKHJlcyA9PT0gdHJ1ZSAmJiAoIWhhc1BhcmVudENicyB8fCBjYi5fZnJvbVBhcmVudCkpIHtcbiAgICAgICAgICBzaG91bGRQcm9wYWdhdGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzaG91bGRQcm9wYWdhdGU7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlY3Vyc2l2ZWx5IGJyb2FkY2FzdCBhbiBldmVudCB0byBhbGwgY2hpbGRyZW4gaW5zdGFuY2VzLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IGV2ZW50XG4gICAqIEBwYXJhbSB7Li4uKn0gYWRkaXRpb25hbCBhcmd1bWVudHNcbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kYnJvYWRjYXN0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIGlzU291cmNlID0gdHlwZW9mIGV2ZW50ID09PSAnc3RyaW5nJztcbiAgICBldmVudCA9IGlzU291cmNlID8gZXZlbnQgOiBldmVudC5uYW1lO1xuICAgIC8vIGlmIG5vIGNoaWxkIGhhcyByZWdpc3RlcmVkIGZvciB0aGlzIGV2ZW50LFxuICAgIC8vIHRoZW4gdGhlcmUncyBubyBuZWVkIHRvIGJyb2FkY2FzdC5cbiAgICBpZiAoIXRoaXMuX2V2ZW50c0NvdW50W2V2ZW50XSkgcmV0dXJuO1xuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuJGNoaWxkcmVuO1xuICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xuICAgIGlmIChpc1NvdXJjZSkge1xuICAgICAgLy8gdXNlIG9iamVjdCBldmVudCB0byBpbmRpY2F0ZSBub24tc291cmNlIGVtaXRcbiAgICAgIC8vIG9uIGNoaWxkcmVuXG4gICAgICBhcmdzWzBdID0geyBuYW1lOiBldmVudCwgc291cmNlOiB0aGlzIH07XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgIHZhciBzaG91bGRQcm9wYWdhdGUgPSBjaGlsZC4kZW1pdC5hcHBseShjaGlsZCwgYXJncyk7XG4gICAgICBpZiAoc2hvdWxkUHJvcGFnYXRlKSB7XG4gICAgICAgIGNoaWxkLiRicm9hZGNhc3QuYXBwbHkoY2hpbGQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogUmVjdXJzaXZlbHkgcHJvcGFnYXRlIGFuIGV2ZW50IHVwIHRoZSBwYXJlbnQgY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICAgKiBAcGFyYW0gey4uLip9IGFkZGl0aW9uYWwgYXJndW1lbnRzXG4gICAqL1xuXG4gIFZ1ZS5wcm90b3R5cGUuJGRpc3BhdGNoID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIHNob3VsZFByb3BhZ2F0ZSA9IHRoaXMuJGVtaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAoIXNob3VsZFByb3BhZ2F0ZSkgcmV0dXJuO1xuICAgIHZhciBwYXJlbnQgPSB0aGlzLiRwYXJlbnQ7XG4gICAgdmFyIGFyZ3MgPSB0b0FycmF5KGFyZ3VtZW50cyk7XG4gICAgLy8gdXNlIG9iamVjdCBldmVudCB0byBpbmRpY2F0ZSBub24tc291cmNlIGVtaXRcbiAgICAvLyBvbiBwYXJlbnRzXG4gICAgYXJnc1swXSA9IHsgbmFtZTogZXZlbnQsIHNvdXJjZTogdGhpcyB9O1xuICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgIHNob3VsZFByb3BhZ2F0ZSA9IHBhcmVudC4kZW1pdC5hcHBseShwYXJlbnQsIGFyZ3MpO1xuICAgICAgcGFyZW50ID0gc2hvdWxkUHJvcGFnYXRlID8gcGFyZW50LiRwYXJlbnQgOiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogTW9kaWZ5IHRoZSBsaXN0ZW5lciBjb3VudHMgb24gYWxsIHBhcmVudHMuXG4gICAqIFRoaXMgYm9va2tlZXBpbmcgYWxsb3dzICRicm9hZGNhc3QgdG8gcmV0dXJuIGVhcmx5IHdoZW5cbiAgICogbm8gY2hpbGQgaGFzIGxpc3RlbmVkIHRvIGEgY2VydGFpbiBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtWdWV9IHZtXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICAgKiBAcGFyYW0ge051bWJlcn0gY291bnRcbiAgICovXG5cbiAgdmFyIGhvb2tSRSA9IC9eaG9vazovO1xuICBmdW5jdGlvbiBtb2RpZnlMaXN0ZW5lckNvdW50KHZtLCBldmVudCwgY291bnQpIHtcbiAgICB2YXIgcGFyZW50ID0gdm0uJHBhcmVudDtcbiAgICAvLyBob29rcyBkbyBub3QgZ2V0IGJyb2FkY2FzdGVkIHNvIG5vIG5lZWRcbiAgICAvLyB0byBkbyBib29ra2VlcGluZyBmb3IgdGhlbVxuICAgIGlmICghcGFyZW50IHx8ICFjb3VudCB8fCBob29rUkUudGVzdChldmVudCkpIHJldHVybjtcbiAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICBwYXJlbnQuX2V2ZW50c0NvdW50W2V2ZW50XSA9IChwYXJlbnQuX2V2ZW50c0NvdW50W2V2ZW50XSB8fCAwKSArIGNvdW50O1xuICAgICAgcGFyZW50ID0gcGFyZW50LiRwYXJlbnQ7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGxpZmVjeWNsZUFQSSAoVnVlKSB7XG4gIC8qKlxuICAgKiBTZXQgaW5zdGFuY2UgdGFyZ2V0IGVsZW1lbnQgYW5kIGtpY2sgb2ZmIHRoZSBjb21waWxhdGlvblxuICAgKiBwcm9jZXNzLiBUaGUgcGFzc2VkIGluIGBlbGAgY2FuIGJlIGEgc2VsZWN0b3Igc3RyaW5nLCBhblxuICAgKiBleGlzdGluZyBFbGVtZW50LCBvciBhIERvY3VtZW50RnJhZ21lbnQgKGZvciBibG9ja1xuICAgKiBpbnN0YW5jZXMpLlxuICAgKlxuICAgKiBAcGFyYW0ge0VsZW1lbnR8RG9jdW1lbnRGcmFnbWVudHxzdHJpbmd9IGVsXG4gICAqIEBwdWJsaWNcbiAgICovXG5cbiAgVnVlLnByb3RvdHlwZS4kbW91bnQgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICBpZiAodGhpcy5faXNDb21waWxlZCkge1xuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKCckbW91bnQoKSBzaG91bGQgYmUgY2FsbGVkIG9ubHkgb25jZS4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZWwgPSBxdWVyeShlbCk7XG4gICAgaWYgKCFlbCkge1xuICAgICAgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB9XG4gICAgdGhpcy5fY29tcGlsZShlbCk7XG4gICAgdGhpcy5faW5pdERPTUhvb2tzKCk7XG4gICAgaWYgKGluRG9jKHRoaXMuJGVsKSkge1xuICAgICAgdGhpcy5fY2FsbEhvb2soJ2F0dGFjaGVkJyk7XG4gICAgICByZWFkeS5jYWxsKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRvbmNlKCdob29rOmF0dGFjaGVkJywgcmVhZHkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogTWFyayBhbiBpbnN0YW5jZSBhcyByZWFkeS5cbiAgICovXG5cbiAgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgdGhpcy5faXNBdHRhY2hlZCA9IHRydWU7XG4gICAgdGhpcy5faXNSZWFkeSA9IHRydWU7XG4gICAgdGhpcy5fY2FsbEhvb2soJ3JlYWR5Jyk7XG4gIH1cblxuICAvKipcbiAgICogVGVhcmRvd24gdGhlIGluc3RhbmNlLCBzaW1wbHkgZGVsZWdhdGUgdG8gdGhlIGludGVybmFsXG4gICAqIF9kZXN0cm95LlxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLiRkZXN0cm95ID0gZnVuY3Rpb24gKHJlbW92ZSwgZGVmZXJDbGVhbnVwKSB7XG4gICAgdGhpcy5fZGVzdHJveShyZW1vdmUsIGRlZmVyQ2xlYW51cCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFBhcnRpYWxseSBjb21waWxlIGEgcGllY2Ugb2YgRE9NIGFuZCByZXR1cm4gYVxuICAgKiBkZWNvbXBpbGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RWxlbWVudHxEb2N1bWVudEZyYWdtZW50fSBlbFxuICAgKiBAcGFyYW0ge1Z1ZX0gW2hvc3RdXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKi9cblxuICBWdWUucHJvdG90eXBlLiRjb21waWxlID0gZnVuY3Rpb24gKGVsLCBob3N0LCBzY29wZSwgZnJhZykge1xuICAgIHJldHVybiBjb21waWxlKGVsLCB0aGlzLiRvcHRpb25zLCB0cnVlKSh0aGlzLCBlbCwgaG9zdCwgc2NvcGUsIGZyYWcpO1xuICB9O1xufVxuXG4vKipcbiAqIFRoZSBleHBvc2VkIFZ1ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBBUEkgY29udmVudGlvbnM6XG4gKiAtIHB1YmxpYyBBUEkgbWV0aG9kcy9wcm9wZXJ0aWVzIGFyZSBwcmVmaXhlZCB3aXRoIGAkYFxuICogLSBpbnRlcm5hbCBtZXRob2RzL3Byb3BlcnRpZXMgYXJlIHByZWZpeGVkIHdpdGggYF9gXG4gKiAtIG5vbi1wcmVmaXhlZCBwcm9wZXJ0aWVzIGFyZSBhc3N1bWVkIHRvIGJlIHByb3hpZWQgdXNlclxuICogICBkYXRhLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIFZ1ZShvcHRpb25zKSB7XG4gIHRoaXMuX2luaXQob3B0aW9ucyk7XG59XG5cbi8vIGluc3RhbGwgaW50ZXJuYWxzXG5pbml0TWl4aW4oVnVlKTtcbnN0YXRlTWl4aW4oVnVlKTtcbmV2ZW50c01peGluKFZ1ZSk7XG5saWZlY3ljbGVNaXhpbihWdWUpO1xubWlzY01peGluKFZ1ZSk7XG5cbi8vIGluc3RhbGwgaW5zdGFuY2UgQVBJc1xuZGF0YUFQSShWdWUpO1xuZG9tQVBJKFZ1ZSk7XG5ldmVudHNBUEkoVnVlKTtcbmxpZmVjeWNsZUFQSShWdWUpO1xuXG52YXIgc2xvdCA9IHtcblxuICBwcmlvcml0eTogU0xPVCxcbiAgcGFyYW1zOiBbJ25hbWUnXSxcblxuICBiaW5kOiBmdW5jdGlvbiBiaW5kKCkge1xuICAgIC8vIHRoaXMgd2FzIHJlc29sdmVkIGR1cmluZyBjb21wb25lbnQgdHJhbnNjbHVzaW9uXG4gICAgdmFyIG5hbWUgPSB0aGlzLnBhcmFtcy5uYW1lIHx8ICdkZWZhdWx0JztcbiAgICB2YXIgY29udGVudCA9IHRoaXMudm0uX3Nsb3RDb250ZW50cyAmJiB0aGlzLnZtLl9zbG90Q29udGVudHNbbmFtZV07XG4gICAgaWYgKCFjb250ZW50IHx8ICFjb250ZW50Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgdGhpcy5mYWxsYmFjaygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbXBpbGUoY29udGVudC5jbG9uZU5vZGUodHJ1ZSksIHRoaXMudm0uX2NvbnRleHQsIHRoaXMudm0pO1xuICAgIH1cbiAgfSxcblxuICBjb21waWxlOiBmdW5jdGlvbiBjb21waWxlKGNvbnRlbnQsIGNvbnRleHQsIGhvc3QpIHtcbiAgICBpZiAoY29udGVudCAmJiBjb250ZXh0KSB7XG4gICAgICBpZiAodGhpcy5lbC5oYXNDaGlsZE5vZGVzKCkgJiYgY29udGVudC5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMSAmJiBjb250ZW50LmNoaWxkTm9kZXNbMF0ubm9kZVR5cGUgPT09IDEgJiYgY29udGVudC5jaGlsZE5vZGVzWzBdLmhhc0F0dHJpYnV0ZSgndi1pZicpKSB7XG4gICAgICAgIC8vIGlmIHRoZSBpbnNlcnRlZCBzbG90IGhhcyB2LWlmXG4gICAgICAgIC8vIGluamVjdCBmYWxsYmFjayBjb250ZW50IGFzIHRoZSB2LWVsc2VcbiAgICAgICAgdmFyIGVsc2VCbG9jayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGVsc2VCbG9jay5zZXRBdHRyaWJ1dGUoJ3YtZWxzZScsICcnKTtcbiAgICAgICAgZWxzZUJsb2NrLmlubmVySFRNTCA9IHRoaXMuZWwuaW5uZXJIVE1MO1xuICAgICAgICAvLyB0aGUgZWxzZSBibG9jayBzaG91bGQgYmUgY29tcGlsZWQgaW4gY2hpbGQgc2NvcGVcbiAgICAgICAgZWxzZUJsb2NrLl9jb250ZXh0ID0gdGhpcy52bTtcbiAgICAgICAgY29udGVudC5hcHBlbmRDaGlsZChlbHNlQmxvY2spO1xuICAgICAgfVxuICAgICAgdmFyIHNjb3BlID0gaG9zdCA/IGhvc3QuX3Njb3BlIDogdGhpcy5fc2NvcGU7XG4gICAgICB0aGlzLnVubGluayA9IGNvbnRleHQuJGNvbXBpbGUoY29udGVudCwgaG9zdCwgc2NvcGUsIHRoaXMuX2ZyYWcpO1xuICAgIH1cbiAgICBpZiAoY29udGVudCkge1xuICAgICAgcmVwbGFjZSh0aGlzLmVsLCBjb250ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlKHRoaXMuZWwpO1xuICAgIH1cbiAgfSxcblxuICBmYWxsYmFjazogZnVuY3Rpb24gZmFsbGJhY2soKSB7XG4gICAgdGhpcy5jb21waWxlKGV4dHJhY3RDb250ZW50KHRoaXMuZWwsIHRydWUpLCB0aGlzLnZtKTtcbiAgfSxcblxuICB1bmJpbmQ6IGZ1bmN0aW9uIHVuYmluZCgpIHtcbiAgICBpZiAodGhpcy51bmxpbmspIHtcbiAgICAgIHRoaXMudW5saW5rKCk7XG4gICAgfVxuICB9XG59O1xuXG52YXIgcGFydGlhbCA9IHtcblxuICBwcmlvcml0eTogUEFSVElBTCxcblxuICBwYXJhbXM6IFsnbmFtZSddLFxuXG4gIC8vIHdhdGNoIGNoYW5nZXMgdG8gbmFtZSBmb3IgZHluYW1pYyBwYXJ0aWFsc1xuICBwYXJhbVdhdGNoZXJzOiB7XG4gICAgbmFtZTogZnVuY3Rpb24gbmFtZSh2YWx1ZSkge1xuICAgICAgdklmLnJlbW92ZS5jYWxsKHRoaXMpO1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuaW5zZXJ0KHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgYmluZDogZnVuY3Rpb24gYmluZCgpIHtcbiAgICB0aGlzLmFuY2hvciA9IGNyZWF0ZUFuY2hvcigndi1wYXJ0aWFsJyk7XG4gICAgcmVwbGFjZSh0aGlzLmVsLCB0aGlzLmFuY2hvcik7XG4gICAgdGhpcy5pbnNlcnQodGhpcy5wYXJhbXMubmFtZSk7XG4gIH0sXG5cbiAgaW5zZXJ0OiBmdW5jdGlvbiBpbnNlcnQoaWQpIHtcbiAgICB2YXIgcGFydGlhbCA9IHJlc29sdmVBc3NldCh0aGlzLnZtLiRvcHRpb25zLCAncGFydGlhbHMnLCBpZCk7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGFzc2VydEFzc2V0KHBhcnRpYWwsICdwYXJ0aWFsJywgaWQpO1xuICAgIH1cbiAgICBpZiAocGFydGlhbCkge1xuICAgICAgdGhpcy5mYWN0b3J5ID0gbmV3IEZyYWdtZW50RmFjdG9yeSh0aGlzLnZtLCBwYXJ0aWFsKTtcbiAgICAgIHZJZi5pbnNlcnQuY2FsbCh0aGlzKTtcbiAgICB9XG4gIH0sXG5cbiAgdW5iaW5kOiBmdW5jdGlvbiB1bmJpbmQoKSB7XG4gICAgaWYgKHRoaXMuZnJhZykge1xuICAgICAgdGhpcy5mcmFnLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cbn07XG5cbnZhciBlbGVtZW50RGlyZWN0aXZlcyA9IHtcbiAgc2xvdDogc2xvdCxcbiAgcGFydGlhbDogcGFydGlhbFxufTtcblxudmFyIGNvbnZlcnRBcnJheSA9IHZGb3IuX3Bvc3RQcm9jZXNzO1xuXG4vKipcbiAqIExpbWl0IGZpbHRlciBmb3IgYXJyYXlzXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG5cbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXQgKERlY2ltYWwgZXhwZWN0ZWQpXG4gKi9cblxuZnVuY3Rpb24gbGltaXRCeShhcnIsIG4sIG9mZnNldCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPyBwYXJzZUludChvZmZzZXQsIDEwKSA6IDA7XG4gIG4gPSB0b051bWJlcihuKTtcbiAgcmV0dXJuIHR5cGVvZiBuID09PSAnbnVtYmVyJyA/IGFyci5zbGljZShvZmZzZXQsIG9mZnNldCArIG4pIDogYXJyO1xufVxuXG4vKipcbiAqIEZpbHRlciBmaWx0ZXIgZm9yIGFycmF5c1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWFyY2hcbiAqIEBwYXJhbSB7U3RyaW5nfSBbZGVsaW1pdGVyXVxuICogQHBhcmFtIHtTdHJpbmd9IC4uLmRhdGFLZXlzXG4gKi9cblxuZnVuY3Rpb24gZmlsdGVyQnkoYXJyLCBzZWFyY2gsIGRlbGltaXRlcikge1xuICBhcnIgPSBjb252ZXJ0QXJyYXkoYXJyKTtcbiAgaWYgKHNlYXJjaCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGFycjtcbiAgfVxuICBpZiAodHlwZW9mIHNlYXJjaCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBhcnIuZmlsdGVyKHNlYXJjaCk7XG4gIH1cbiAgLy8gY2FzdCB0byBsb3dlcmNhc2Ugc3RyaW5nXG4gIHNlYXJjaCA9ICgnJyArIHNlYXJjaCkudG9Mb3dlckNhc2UoKTtcbiAgLy8gYWxsb3cgb3B0aW9uYWwgYGluYCBkZWxpbWl0ZXJcbiAgLy8gYmVjYXVzZSB3aHkgbm90XG4gIHZhciBuID0gZGVsaW1pdGVyID09PSAnaW4nID8gMyA6IDI7XG4gIC8vIGV4dHJhY3QgYW5kIGZsYXR0ZW4ga2V5c1xuICB2YXIga2V5cyA9IHRvQXJyYXkoYXJndW1lbnRzLCBuKS5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1cikge1xuICAgIHJldHVybiBwcmV2LmNvbmNhdChjdXIpO1xuICB9LCBbXSk7XG4gIHZhciByZXMgPSBbXTtcbiAgdmFyIGl0ZW0sIGtleSwgdmFsLCBqO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IGFyci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpdGVtID0gYXJyW2ldO1xuICAgIHZhbCA9IGl0ZW0gJiYgaXRlbS4kdmFsdWUgfHwgaXRlbTtcbiAgICBqID0ga2V5cy5sZW5ndGg7XG4gICAgaWYgKGopIHtcbiAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAga2V5ID0ga2V5c1tqXTtcbiAgICAgICAgaWYgKGtleSA9PT0gJyRrZXknICYmIGNvbnRhaW5zJDEoaXRlbS4ka2V5LCBzZWFyY2gpIHx8IGNvbnRhaW5zJDEoZ2V0UGF0aCh2YWwsIGtleSksIHNlYXJjaCkpIHtcbiAgICAgICAgICByZXMucHVzaChpdGVtKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY29udGFpbnMkMShpdGVtLCBzZWFyY2gpKSB7XG4gICAgICByZXMucHVzaChpdGVtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBGaWx0ZXIgZmlsdGVyIGZvciBhcnJheXNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc29ydEtleVxuICogQHBhcmFtIHtTdHJpbmd9IHJldmVyc2VcbiAqL1xuXG5mdW5jdGlvbiBvcmRlckJ5KGFyciwgc29ydEtleSwgcmV2ZXJzZSkge1xuICBhcnIgPSBjb252ZXJ0QXJyYXkoYXJyKTtcbiAgaWYgKCFzb3J0S2V5KSB7XG4gICAgcmV0dXJuIGFycjtcbiAgfVxuICB2YXIgb3JkZXIgPSByZXZlcnNlICYmIHJldmVyc2UgPCAwID8gLTEgOiAxO1xuICAvLyBzb3J0IG9uIGEgY29weSB0byBhdm9pZCBtdXRhdGluZyBvcmlnaW5hbCBhcnJheVxuICByZXR1cm4gYXJyLnNsaWNlKCkuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgIGlmIChzb3J0S2V5ICE9PSAnJGtleScpIHtcbiAgICAgIGlmIChpc09iamVjdChhKSAmJiAnJHZhbHVlJyBpbiBhKSBhID0gYS4kdmFsdWU7XG4gICAgICBpZiAoaXNPYmplY3QoYikgJiYgJyR2YWx1ZScgaW4gYikgYiA9IGIuJHZhbHVlO1xuICAgIH1cbiAgICBhID0gaXNPYmplY3QoYSkgPyBnZXRQYXRoKGEsIHNvcnRLZXkpIDogYTtcbiAgICBiID0gaXNPYmplY3QoYikgPyBnZXRQYXRoKGIsIHNvcnRLZXkpIDogYjtcbiAgICByZXR1cm4gYSA9PT0gYiA/IDAgOiBhID4gYiA/IG9yZGVyIDogLW9yZGVyO1xuICB9KTtcbn1cblxuLyoqXG4gKiBTdHJpbmcgY29udGFpbiBoZWxwZXJcbiAqXG4gKiBAcGFyYW0geyp9IHZhbFxuICogQHBhcmFtIHtTdHJpbmd9IHNlYXJjaFxuICovXG5cbmZ1bmN0aW9uIGNvbnRhaW5zJDEodmFsLCBzZWFyY2gpIHtcbiAgdmFyIGk7XG4gIGlmIChpc1BsYWluT2JqZWN0KHZhbCkpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbCk7XG4gICAgaSA9IGtleXMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGlmIChjb250YWlucyQxKHZhbFtrZXlzW2ldXSwgc2VhcmNoKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh2YWwpKSB7XG4gICAgaSA9IHZhbC5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgaWYgKGNvbnRhaW5zJDEodmFsW2ldLCBzZWFyY2gpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh2YWwgIT0gbnVsbCkge1xuICAgIHJldHVybiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpLmluZGV4T2Yoc2VhcmNoKSA+IC0xO1xuICB9XG59XG5cbnZhciBkaWdpdHNSRSA9IC8oXFxkezN9KSg/PVxcZCkvZztcblxuLy8gYXNzZXQgY29sbGVjdGlvbnMgbXVzdCBiZSBhIHBsYWluIG9iamVjdC5cbnZhciBmaWx0ZXJzID0ge1xuXG4gIG9yZGVyQnk6IG9yZGVyQnksXG4gIGZpbHRlckJ5OiBmaWx0ZXJCeSxcbiAgbGltaXRCeTogbGltaXRCeSxcblxuICAvKipcbiAgICogU3RyaW5naWZ5IHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gaW5kZW50XG4gICAqL1xuXG4gIGpzb246IHtcbiAgICByZWFkOiBmdW5jdGlvbiByZWFkKHZhbHVlLCBpbmRlbnQpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gdmFsdWUgOiBKU09OLnN0cmluZ2lmeSh2YWx1ZSwgbnVsbCwgTnVtYmVyKGluZGVudCkgfHwgMik7XG4gICAgfSxcbiAgICB3cml0ZTogZnVuY3Rpb24gd3JpdGUodmFsdWUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKHZhbHVlKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogJ2FiYycgPT4gJ0FiYydcbiAgICovXG5cbiAgY2FwaXRhbGl6ZTogZnVuY3Rpb24gY2FwaXRhbGl6ZSh2YWx1ZSkge1xuICAgIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApIHJldHVybiAnJztcbiAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgcmV0dXJuIHZhbHVlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdmFsdWUuc2xpY2UoMSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqICdhYmMnID0+ICdBQkMnXG4gICAqL1xuXG4gIHVwcGVyY2FzZTogZnVuY3Rpb24gdXBwZXJjYXNlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlIHx8IHZhbHVlID09PSAwID8gdmFsdWUudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpIDogJyc7XG4gIH0sXG5cbiAgLyoqXG4gICAqICdBYkMnID0+ICdhYmMnXG4gICAqL1xuXG4gIGxvd2VyY2FzZTogZnVuY3Rpb24gbG93ZXJjYXNlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlIHx8IHZhbHVlID09PSAwID8gdmFsdWUudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIDogJyc7XG4gIH0sXG5cbiAgLyoqXG4gICAqIDEyMzQ1ID0+ICQxMiwzNDUuMDBcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpZ25cbiAgICovXG5cbiAgY3VycmVuY3k6IGZ1bmN0aW9uIGN1cnJlbmN5KHZhbHVlLCBfY3VycmVuY3kpIHtcbiAgICB2YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpO1xuICAgIGlmICghaXNGaW5pdGUodmFsdWUpIHx8ICF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkgcmV0dXJuICcnO1xuICAgIF9jdXJyZW5jeSA9IF9jdXJyZW5jeSAhPSBudWxsID8gX2N1cnJlbmN5IDogJyQnO1xuICAgIHZhciBzdHJpbmdpZmllZCA9IE1hdGguYWJzKHZhbHVlKS50b0ZpeGVkKDIpO1xuICAgIHZhciBfaW50ID0gc3RyaW5naWZpZWQuc2xpY2UoMCwgLTMpO1xuICAgIHZhciBpID0gX2ludC5sZW5ndGggJSAzO1xuICAgIHZhciBoZWFkID0gaSA+IDAgPyBfaW50LnNsaWNlKDAsIGkpICsgKF9pbnQubGVuZ3RoID4gMyA/ICcsJyA6ICcnKSA6ICcnO1xuICAgIHZhciBfZmxvYXQgPSBzdHJpbmdpZmllZC5zbGljZSgtMyk7XG4gICAgdmFyIHNpZ24gPSB2YWx1ZSA8IDAgPyAnLScgOiAnJztcbiAgICByZXR1cm4gc2lnbiArIF9jdXJyZW5jeSArIGhlYWQgKyBfaW50LnNsaWNlKGkpLnJlcGxhY2UoZGlnaXRzUkUsICckMSwnKSArIF9mbG9hdDtcbiAgfSxcblxuICAvKipcbiAgICogJ2l0ZW0nID0+ICdpdGVtcydcbiAgICpcbiAgICogQHBhcmFtc1xuICAgKiAgYW4gYXJyYXkgb2Ygc3RyaW5ncyBjb3JyZXNwb25kaW5nIHRvXG4gICAqICB0aGUgc2luZ2xlLCBkb3VibGUsIHRyaXBsZSAuLi4gZm9ybXMgb2YgdGhlIHdvcmQgdG9cbiAgICogIGJlIHBsdXJhbGl6ZWQuIFdoZW4gdGhlIG51bWJlciB0byBiZSBwbHVyYWxpemVkXG4gICAqICBleGNlZWRzIHRoZSBsZW5ndGggb2YgdGhlIGFyZ3MsIGl0IHdpbGwgdXNlIHRoZSBsYXN0XG4gICAqICBlbnRyeSBpbiB0aGUgYXJyYXkuXG4gICAqXG4gICAqICBlLmcuIFsnc2luZ2xlJywgJ2RvdWJsZScsICd0cmlwbGUnLCAnbXVsdGlwbGUnXVxuICAgKi9cblxuICBwbHVyYWxpemU6IGZ1bmN0aW9uIHBsdXJhbGl6ZSh2YWx1ZSkge1xuICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBhcmdzLmxlbmd0aCA+IDEgPyBhcmdzW3ZhbHVlICUgMTAgLSAxXSB8fCBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gOiBhcmdzWzBdICsgKHZhbHVlID09PSAxID8gJycgOiAncycpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBEZWJvdW5jZSBhIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbGF5ID0gMzAwXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKi9cblxuICBkZWJvdW5jZTogZnVuY3Rpb24gZGVib3VuY2UoaGFuZGxlciwgZGVsYXkpIHtcbiAgICBpZiAoIWhhbmRsZXIpIHJldHVybjtcbiAgICBpZiAoIWRlbGF5KSB7XG4gICAgICBkZWxheSA9IDMwMDtcbiAgICB9XG4gICAgcmV0dXJuIF9kZWJvdW5jZShoYW5kbGVyLCBkZWxheSk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGluc3RhbGxHbG9iYWxBUEkgKFZ1ZSkge1xuICAvKipcbiAgICogVnVlIGFuZCBldmVyeSBjb25zdHJ1Y3RvciB0aGF0IGV4dGVuZHMgVnVlIGhhcyBhblxuICAgKiBhc3NvY2lhdGVkIG9wdGlvbnMgb2JqZWN0LCB3aGljaCBjYW4gYmUgYWNjZXNzZWQgZHVyaW5nXG4gICAqIGNvbXBpbGF0aW9uIHN0ZXBzIGFzIGB0aGlzLmNvbnN0cnVjdG9yLm9wdGlvbnNgLlxuICAgKlxuICAgKiBUaGVzZSBjYW4gYmUgc2VlbiBhcyB0aGUgZGVmYXVsdCBvcHRpb25zIG9mIGV2ZXJ5XG4gICAqIFZ1ZSBpbnN0YW5jZS5cbiAgICovXG5cbiAgVnVlLm9wdGlvbnMgPSB7XG4gICAgZGlyZWN0aXZlczogZGlyZWN0aXZlcyxcbiAgICBlbGVtZW50RGlyZWN0aXZlczogZWxlbWVudERpcmVjdGl2ZXMsXG4gICAgZmlsdGVyczogZmlsdGVycyxcbiAgICB0cmFuc2l0aW9uczoge30sXG4gICAgY29tcG9uZW50czoge30sXG4gICAgcGFydGlhbHM6IHt9LFxuICAgIHJlcGxhY2U6IHRydWVcbiAgfTtcblxuICAvKipcbiAgICogRXhwb3NlIHVzZWZ1bCBpbnRlcm5hbHNcbiAgICovXG5cbiAgVnVlLnV0aWwgPSB1dGlsO1xuICBWdWUuY29uZmlnID0gY29uZmlnO1xuICBWdWUuc2V0ID0gc2V0O1xuICBWdWVbJ2RlbGV0ZSddID0gZGVsO1xuICBWdWUubmV4dFRpY2sgPSBuZXh0VGljaztcblxuICAvKipcbiAgICogVGhlIGZvbGxvd2luZyBhcmUgZXhwb3NlZCBmb3IgYWR2YW5jZWQgdXNhZ2UgLyBwbHVnaW5zXG4gICAqL1xuXG4gIFZ1ZS5jb21waWxlciA9IGNvbXBpbGVyO1xuICBWdWUuRnJhZ21lbnRGYWN0b3J5ID0gRnJhZ21lbnRGYWN0b3J5O1xuICBWdWUuaW50ZXJuYWxEaXJlY3RpdmVzID0gaW50ZXJuYWxEaXJlY3RpdmVzO1xuICBWdWUucGFyc2VycyA9IHtcbiAgICBwYXRoOiBwYXRoLFxuICAgIHRleHQ6IHRleHQsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgIGRpcmVjdGl2ZTogZGlyZWN0aXZlLFxuICAgIGV4cHJlc3Npb246IGV4cHJlc3Npb25cbiAgfTtcblxuICAvKipcbiAgICogRWFjaCBpbnN0YW5jZSBjb25zdHJ1Y3RvciwgaW5jbHVkaW5nIFZ1ZSwgaGFzIGEgdW5pcXVlXG4gICAqIGNpZC4gVGhpcyBlbmFibGVzIHVzIHRvIGNyZWF0ZSB3cmFwcGVkIFwiY2hpbGRcbiAgICogY29uc3RydWN0b3JzXCIgZm9yIHByb3RvdHlwYWwgaW5oZXJpdGFuY2UgYW5kIGNhY2hlIHRoZW0uXG4gICAqL1xuXG4gIFZ1ZS5jaWQgPSAwO1xuICB2YXIgY2lkID0gMTtcblxuICAvKipcbiAgICogQ2xhc3MgaW5oZXJpdGFuY2VcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGV4dGVuZE9wdGlvbnNcbiAgICovXG5cbiAgVnVlLmV4dGVuZCA9IGZ1bmN0aW9uIChleHRlbmRPcHRpb25zKSB7XG4gICAgZXh0ZW5kT3B0aW9ucyA9IGV4dGVuZE9wdGlvbnMgfHwge307XG4gICAgdmFyIFN1cGVyID0gdGhpcztcbiAgICB2YXIgaXNGaXJzdEV4dGVuZCA9IFN1cGVyLmNpZCA9PT0gMDtcbiAgICBpZiAoaXNGaXJzdEV4dGVuZCAmJiBleHRlbmRPcHRpb25zLl9DdG9yKSB7XG4gICAgICByZXR1cm4gZXh0ZW5kT3B0aW9ucy5fQ3RvcjtcbiAgICB9XG4gICAgdmFyIG5hbWUgPSBleHRlbmRPcHRpb25zLm5hbWUgfHwgU3VwZXIub3B0aW9ucy5uYW1lO1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBpZiAoIS9eW2EtekEtWl1bXFx3LV0qJC8udGVzdChuYW1lKSkge1xuICAgICAgICB3YXJuKCdJbnZhbGlkIGNvbXBvbmVudCBuYW1lOiBcIicgKyBuYW1lICsgJ1wiLiBDb21wb25lbnQgbmFtZXMgJyArICdjYW4gb25seSBjb250YWluIGFscGhhbnVtZXJpYyBjaGFyYWNhdGVycyBhbmQgdGhlIGh5cGhlbi4nKTtcbiAgICAgICAgbmFtZSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBTdWIgPSBjcmVhdGVDbGFzcyhuYW1lIHx8ICdWdWVDb21wb25lbnQnKTtcbiAgICBTdWIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdXBlci5wcm90b3R5cGUpO1xuICAgIFN1Yi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdWI7XG4gICAgU3ViLmNpZCA9IGNpZCsrO1xuICAgIFN1Yi5vcHRpb25zID0gbWVyZ2VPcHRpb25zKFN1cGVyLm9wdGlvbnMsIGV4dGVuZE9wdGlvbnMpO1xuICAgIFN1Ylsnc3VwZXInXSA9IFN1cGVyO1xuICAgIC8vIGFsbG93IGZ1cnRoZXIgZXh0ZW5zaW9uXG4gICAgU3ViLmV4dGVuZCA9IFN1cGVyLmV4dGVuZDtcbiAgICAvLyBjcmVhdGUgYXNzZXQgcmVnaXN0ZXJzLCBzbyBleHRlbmRlZCBjbGFzc2VzXG4gICAgLy8gY2FuIGhhdmUgdGhlaXIgcHJpdmF0ZSBhc3NldHMgdG9vLlxuICAgIGNvbmZpZy5fYXNzZXRUeXBlcy5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICBTdWJbdHlwZV0gPSBTdXBlclt0eXBlXTtcbiAgICB9KTtcbiAgICAvLyBlbmFibGUgcmVjdXJzaXZlIHNlbGYtbG9va3VwXG4gICAgaWYgKG5hbWUpIHtcbiAgICAgIFN1Yi5vcHRpb25zLmNvbXBvbmVudHNbbmFtZV0gPSBTdWI7XG4gICAgfVxuICAgIC8vIGNhY2hlIGNvbnN0cnVjdG9yXG4gICAgaWYgKGlzRmlyc3RFeHRlbmQpIHtcbiAgICAgIGV4dGVuZE9wdGlvbnMuX0N0b3IgPSBTdWI7XG4gICAgfVxuICAgIHJldHVybiBTdWI7XG4gIH07XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgc3ViLWNsYXNzIGNvbnN0cnVjdG9yIHdpdGggdGhlXG4gICAqIGdpdmVuIG5hbWUuIFRoaXMgZ2l2ZXMgdXMgbXVjaCBuaWNlciBvdXRwdXQgd2hlblxuICAgKiBsb2dnaW5nIGluc3RhbmNlcyBpbiB0aGUgY29uc29sZS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZUNsYXNzKG5hbWUpIHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1uZXctZnVuYyAqL1xuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oJ3JldHVybiBmdW5jdGlvbiAnICsgY2xhc3NpZnkobmFtZSkgKyAnIChvcHRpb25zKSB7IHRoaXMuX2luaXQob3B0aW9ucykgfScpKCk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby1uZXctZnVuYyAqL1xuICB9XG5cbiAgLyoqXG4gICAqIFBsdWdpbiBzeXN0ZW1cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpblxuICAgKi9cblxuICBWdWUudXNlID0gZnVuY3Rpb24gKHBsdWdpbikge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmIChwbHVnaW4uaW5zdGFsbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGFkZGl0aW9uYWwgcGFyYW1ldGVyc1xuICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMsIDEpO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICBpZiAodHlwZW9mIHBsdWdpbi5pbnN0YWxsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBwbHVnaW4uaW5zdGFsbC5hcHBseShwbHVnaW4sIGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwbHVnaW4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfVxuICAgIHBsdWdpbi5pbnN0YWxsZWQgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBcHBseSBhIGdsb2JhbCBtaXhpbiBieSBtZXJnaW5nIGl0IGludG8gdGhlIGRlZmF1bHRcbiAgICogb3B0aW9ucy5cbiAgICovXG5cbiAgVnVlLm1peGluID0gZnVuY3Rpb24gKG1peGluKSB7XG4gICAgVnVlLm9wdGlvbnMgPSBtZXJnZU9wdGlvbnMoVnVlLm9wdGlvbnMsIG1peGluKTtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlIGFzc2V0IHJlZ2lzdHJhdGlvbiBtZXRob2RzIHdpdGggdGhlIGZvbGxvd2luZ1xuICAgKiBzaWduYXR1cmU6XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpZFxuICAgKiBAcGFyYW0geyp9IGRlZmluaXRpb25cbiAgICovXG5cbiAgY29uZmlnLl9hc3NldFR5cGVzLmZvckVhY2goZnVuY3Rpb24gKHR5cGUpIHtcbiAgICBWdWVbdHlwZV0gPSBmdW5jdGlvbiAoaWQsIGRlZmluaXRpb24pIHtcbiAgICAgIGlmICghZGVmaW5pdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zW3R5cGUgKyAncyddW2lkXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgIGlmICh0eXBlID09PSAnY29tcG9uZW50JyAmJiAoY29tbW9uVGFnUkUudGVzdChpZCkgfHwgcmVzZXJ2ZWRUYWdSRS50ZXN0KGlkKSkpIHtcbiAgICAgICAgICAgIHdhcm4oJ0RvIG5vdCB1c2UgYnVpbHQtaW4gb3IgcmVzZXJ2ZWQgSFRNTCBlbGVtZW50cyBhcyBjb21wb25lbnQgJyArICdpZDogJyArIGlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdjb21wb25lbnQnICYmIGlzUGxhaW5PYmplY3QoZGVmaW5pdGlvbikpIHtcbiAgICAgICAgICBkZWZpbml0aW9uLm5hbWUgPSBpZDtcbiAgICAgICAgICBkZWZpbml0aW9uID0gVnVlLmV4dGVuZChkZWZpbml0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdGlvbnNbdHlwZSArICdzJ11baWRdID0gZGVmaW5pdGlvbjtcbiAgICAgICAgcmV0dXJuIGRlZmluaXRpb247XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gZXhwb3NlIGludGVybmFsIHRyYW5zaXRpb24gQVBJXG4gIGV4dGVuZChWdWUudHJhbnNpdGlvbiwgdHJhbnNpdGlvbik7XG59XG5cbmluc3RhbGxHbG9iYWxBUEkoVnVlKTtcblxuVnVlLnZlcnNpb24gPSAnMS4wLjE3JztcblxuLy8gZGV2dG9vbHMgZ2xvYmFsIGhvb2tcbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5pZiAoZGV2dG9vbHMpIHtcbiAgZGV2dG9vbHMuZW1pdCgnaW5pdCcsIFZ1ZSk7XG59IGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgaW5Ccm93c2VyICYmIC9DaHJvbWVcXC9cXGQrLy50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICBjb25zb2xlLmxvZygnRG93bmxvYWQgdGhlIFZ1ZSBEZXZ0b29scyBmb3IgYSBiZXR0ZXIgZGV2ZWxvcG1lbnQgZXhwZXJpZW5jZTpcXG4nICsgJ2h0dHBzOi8vZ2l0aHViLmNvbS92dWVqcy92dWUtZGV2dG9vbHMnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWdWU7IiwidmFyIFZ1ZSA9IHJlcXVpcmUoJ3Z1ZScpO1xyXG5cclxudmFyIGNsdXNlciA9IG5ldyBWdWUoe1xyXG4gIGVsOiAnI3VzZXItbWFrZXInLFxyXG4gIGRhdGE6IHtcclxuICAgIHVzZXJuYW1lOiAnJyxcclxuICAgIHBhc3N3b3JkOiAnJyxcclxuICAgIGNvbmZpcm1wYXNzOiAnJyxcclxuICAgIGVtYWlsOiAnJ1xyXG4gIH0sXHJcbiAgY29tcHV0ZWQ6IHtcclxuICAgIHBhc3N3b3Jkc19tYXRjaDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnBhc3N3b3JkID09PSB0aGlzLmNvbmZpcm1wYXNzO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiJdfQ==
