'use strict';

/*@
Ox.cache <f> Memoize a function
    fn <f> function
    options <o>
        async <b|false> function is async, last argument must be callback
        key   <f|JSON.stringify> return key for arguments
    <script>
        Ox.test.fn = Ox.cache(function(n) { return n * Math.random(); });
    </script>
    > Ox.test.fn(10) == Ox.test.fn(10);
    true
    > Ox.test.fn(10) == Ox.test.fn.clear()(10);
    false
@*/
// TODO: add async test
Ox.cache = function(fn, options) {
    var cache = {},
        ret = function() {
            options = Ox.extend({
                async: false,
                key: JSON.stringify
            }, options || {});
            var args = Ox.toArray(arguments), key = options.key(args);
            function callback() {
                // cache all arguments passed to callback
                cache[key] = Ox.toArray(arguments);
                // call the original callback
                Ox.last(args).apply(this, arguments);
            }
            if (options.async) {
                if (!(key in cache)) {
                    // call function with patched callback
                    fn.apply(this, args.slice(0, -1).concat(callback));
                } else {
                    // call callback with cached arguments
                    setTimeout(function() {
                        callback.apply(this, cache[key]);
                    });
                }
            } else {
                if (!(key in cache)) {
                    cache[key] = fn.apply(this, args);
                }
                return cache[key];
            }
        };
    ret.clear = function() {
        if (arguments.length == 0) {
            cache = {};
        } else {
            Ox.makeArray(arguments).forEach(function(key) {
                delete cache[key];
            });
        }
        return ret;
    };
    return ret;
};

/*@
Ox.identity <f> Returns its first argument
    This can be used as a default iterator
    > Ox.identity(Infinity)
    Infinity
@*/
Ox.identity = function(value) {
    return value;
};

/*@
Ox.noop <f> Returns undefined and calls optional callback without arguments
    This can be used as a default iterator in an asynchronous loop, or to
    combine a synchronous and an asynchronous code path.
    > Ox.noop(1, 2, 3)
    undefined
    > Ox.noop(1, 2, 3, function() { Ox.test(arguments.length, 0); })
    undefined
@*/
Ox.noop = function() {
    var callback = Ox.last(arguments);
    Ox.isFunction(callback) && callback();
};

/*@
Ox.queue <f> Queue of asynchronous function calls with cached results
    The results are cached based on all arguments to `fn`, except the last one,
    which is the callback.
    (fn, maxThreads) -> <f> Queue function
        .clear <f> Clear method
    fn <f> Queued function
    maxThreads <n|10> Number of parallel function calls
@*/
Ox.queue = function(fn, maxThreads) {
    var maxThreads = maxThreads || 10,
        queue = [],
        ret = Ox.cache(function() {
            queue.push(Ox.toArray(arguments));
            process();
        }, {
            async: true,
            key: function(args) {
                return JSON.stringify(args.slice(0, -1));
            }
        }),
        threads = 0;
    ret.clear = function() {
        queue = [];
    };
    function process() {
        var n = Math.min(queue.length, maxThreads - threads);
        if (n) {
            threads += n;
            Ox.parallelForEach(queue.splice(0, n), function(args, index, array, callback) {
                fn.apply(this, args.slice(0, -1).concat(function(result) {
                    threads--;
                    args.slice(-1)[0](result);
                    callback();
                }));
            }, process);
        }
    }
    return ret;
};
