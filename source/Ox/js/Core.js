// OxJS (c) 2012 0x2620, dual-licensed GPL/MIT, see http://oxjs.org for details

'use strict';

/*@
Ox <f> The `Ox` object
    See `Ox.wrap` for details.
    (value) -> <o> wrapped value
    value <*> Any value
@*/
this.Ox = function(value) {
    return Ox.wrap(value);
};

/*@
Ox.load <f> Loads one or more modules
    A module named "Foo" provides `Ox.Foo/Ox.Foo.js`, in which it defines one
    method, `Ox.load.Foo`, that takes two arguments, `options` and `callback`,
    and calls `callback` with one argument, `true` for success or `false` if an
    error occurred. Generally, the module should define `Ox.Foo` and attach its
    own methods there.
    (callback) -> <u> undefined
    (module, callback) -> <u> undefined
    (module, options, callback) -> <u> undefined
    (modules, callback) -> <u> undefined
    module   <s> Module name
    options  <o> Module options
    modules  <a|o> Multiple modules
        Either `['moduleA', {moduleB: options}, ...]`
        or `{moduleA: {}, moduleB: options, ...}`
    callback <f> Callback function
        success <b> If true, all modules have been loaded successfully
@*/
Ox.load = function() {
    var callback = arguments[arguments.length - 1],
        length, loaded = 0, localeFiles = [], modules = {}, succeeded = 0,
        type = Ox.typeOf(arguments[0]);
    if (type == 'string') {
        modules = Ox.extend(
            {}, arguments[0], Ox.isObject(arguments[1]) ? arguments[1] : {}
        );
    } else if (type == 'array') {
        arguments[0].forEach(function(value) {
            if (Ox.isString(value)) {
                modules[value] = {};
            } else {
                Ox.extend(modules, value)
            }
        });
    } else if (type == 'object') {
        modules = arguments[0];
    }
    length = Ox.len(modules);
    Ox.documentReady(function() {
        if (!length) {
            callback(true);
        } else {
            Ox.forEach(modules, function(options, module) {
                Ox.getFile(
                    Ox.PATH + 'Ox.' + module + '/Ox.' + module + '.js',
                    function() {
                        Ox.load[module](options, function(success) {
                            succeeded += success;
                            if (++loaded == length) {
                                Ox.setLocale(Ox.LOCALE, function() {
                                    callback(succeeded == length);
                                });
                            }
                        });
                    }
                );
            });
        }
    });
};

/*@
Ox.localStorage <f> localStorage wrapper
    (namespace) -> storage <f> localStorage function for a given namespace
        () -> <o> returns all key:value pairs
        (key) -> <*> returns one value
        (key, val) -> <f> sets one value, returns localStorage object
        ({key: val, ...}) -> <f> sets values, returns localStorage object
    <script>
        Ox.test.localStorage = Ox.localStorage('test');
    </script>
    > Ox.test.localStorage({foo: 'bar'})('foo')
    'bar'
    > Ox.test.localStorage.delete('foo')()
    {}
@*/
Ox.localStorage = function(namespace) {
    var localStorage;
    try {
        // this will fail if third party cookies/storage is not allowed
        localStorage = window.localStorage || {};
        // FF 3.6 can't assign to or iterate over localStorage
        for (var key in localStorage) {};
    } catch (e) {
        localStorage = {};
    }
    function storage(key, value) {
        var ret;
        if (arguments.length == 0) {
            ret = {};
            Ox.forEach(localStorage, function(value, key) {
                if (Ox.startsWith(key, namespace + '.')) {
                    ret[key.slice(namespace.length + 1)] = JSON.parse(value);
                }
            });
        } else if (arguments.length == 1 && typeof key == 'string') {
            // This gets called by Ox.Log before Type.js has loaded
            value = localStorage[namespace + '.' + key];
            ret = value === void 0 ? void 0 : JSON.parse(value);
        } else {
            Ox.forEach(Ox.makeObject(arguments), function(value, key) {
                localStorage[namespace + '.' + key] = JSON.stringify(value);
            });
            ret = storage;
        }
        return ret;
    };
    // IE 8 doesn't like `storage.delete`
    storage['delete'] = function() {
        var keys = arguments.length == 0 ? Object.keys(storage())
            : Ox.toArray(arguments)
        keys.forEach(function(key) {
            delete localStorage[namespace + '.' + key];
        });
        return storage;
    };
    return storage;
};

/*@
Ox.Log <f> Logging module
@*/
Ox.Log = (function() {
    var storage = Ox.localStorage('Ox'),
        log = storage('log') || {filter: [], filterEnabled: true},
        that = function() {
            var ret;
            if (arguments.length == 0) {
                ret = log;
            } else {
                ret = that.log.apply(null, arguments);
            }
            return ret;
        };
    that.filter = function(value) {
        if (!Ox.isUndefined(value)) {
            that.filter.enable();
            log.filter = Ox.makeArray(value);
            storage('log', log);
        }
        return log.filter;
    };
    that.filter.add = function(value) {
        return that.filter(Ox.unique(log.filter.concat(Ox.makeArray(value))));
    };
    that.filter.disable = function() {
        log.filterEnabled = false;
        storage('log', log);
    };
    that.filter.enable = function() {
        log.filterEnabled = true;
        storage('log', log);
    };
    that.filter.remove = function(value) {
        value = Ox.makeArray(value);
        return that.filter(log.filter.filter(function(v) {
            return value.indexOf(v) == -1;
        }));
    };
    that.log = function() {
        var args = Ox.toArray(arguments), date, ret;
        if (!log.filterEnabled || log.filter.indexOf(args[0]) > -1) {
            date = new Date();
            args.unshift(
                Ox.formatDate(date, '%H:%M:%S.') + (+date).toString().slice(-3)
            );
            window.console && window.console.log.apply(window.console, args);
            ret = args.join(' ');
        }
        return ret;
    };
    return that;
}());

/*@
Ox.loop <f> For-loop, functional-style
    Returning `false` from the iterator function acts like a `break` statement.
    Unlike a `for` loop, `Ox.loop` doesn't leak its counter variable to the
    outer scope, but returns it.
    (stop, fn) -> <n> Next value
        equivalent to `for (var i = 0; i < stop; i++) { fn(i); }`
    (start, stop, fn) -> <n> Next value
        equivalent to `for (var i = start; i < stop; i++) { fn(i); }` or, if
        `start` is larger than `stop`, `for (var i = start; i > stop; i--) {
        fn(i); }`
    (start, stop, step, fn) -> <n> Next value
        equivalent to `for (var i = start; i < stop; i += step) { fn(i); }` or,
        if `step` is negative, `for (var i = start; i > stop; i += step) {
        fn(i); }`
    start <n> Start value
    stop <n> Stop value (exclusive)
    step <n> Step value
    fn <f> Iterator function
        i <n> Counter value
    > Ox.loop(10, function(i) { if (i == 4) { return false; } })
    4
    > Ox.loop(0, 3, 2, function() {})
    4
@*/
Ox.loop = function() {
    var length = arguments.length,
        start = length > 2 ? arguments[0] : 0,
        stop = arguments[length > 2 ? 1 : 0],
        step = length == 4 ? arguments[2] : (start <= stop ? 1 : -1),
        iterator = arguments[length - 1],
        i;
    for (i = start; step > 0 ? i < stop : i > stop; i += step) {
        if (iterator(i) === false) {
            break;
        }
    }
    return i;
};

/*@
Ox.print <f> Prints its arguments to the console
    (arg, ...) -> <s> String
        The string contains the timestamp, the name of the caller function, and
        any arguments, separated by spaces
    arg <*> any value
    > Ox.print('foo').split(' ').pop()
    "foo"
@*/
Ox.print = function() {
    var args = Ox.toArray(arguments), date = new Date();
    args.unshift(
        Ox.formatDate(date, '%H:%M:%S.') + (+date).toString().slice(-3)
    );
    window.console && window.console.log.apply(window.console, args);
    return args.join(' ');
};

/*@
Ox.uid <f> Returns a unique id
    () -> <n> Unique id
    > Ox.uid() != Ox.uid()
    true
@*/
Ox.uid = (function() {
    var uid = 0;
    return function() {
        return uid++;
    };
}());

/*@
Ox.wrap <f> Wraps a value so that one can directly call any Ox function on it
    `Ox(value)` is a shorthand for `Ox.wrap(value)`.
    (value) -> <o> wrapped value
        chain <f> Wrap return values to allow chaining
        value <f> Unwrap the value wrapped by `chain()`
    value <*> Any value
    > Ox('foobar').repeat(2)
    'foobarfoobar'
    > Ox('foobar').chain().reverse().toTitleCase().value()
    'Raboof'
    > Ox.wrap('foobar').value()
    'foobar'
@*/
Ox.wrap = function(value, chained) {
    // somewhat inspired by underscore.js
    var wrapper = {
        chain: function() {
            wrapper.chained = true;
            return wrapper;
        },
        chained: chained || false,
        value: function() {
            return value;
        }
    };
    Ox.methods(Ox).filter(function(method) {
        return method[0] == method[0].toLowerCase();
    }).forEach(function(method) {
        wrapper[method] = function() {
            var args = Array.prototype.slice.call(arguments), ret;
            args.unshift(value);
            ret = Ox[method].apply(Ox, args);
            return wrapper.chained ? Ox.wrap(ret, true) : ret;
        };
    });
    return wrapper;
};
