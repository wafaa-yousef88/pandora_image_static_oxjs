'use strict';

(function(global) {

    global.Ox = {

        load: function() {

            var args = arguments,
                callback = args[args.length - 1],
                path = getPath(),
                time = +new Date();

            if (args[0] === true) {
                path = path.replace(/dev\/$/, 'build/');
                loadScript('Ox.js', function() {
                    Ox.PATH = path;
                    Ox.load.apply(null, Ox.slice(args, 1));
                });
            } else {
                loadJSON(function(data) {
                    var previousOx = global.Ox;
                    loadScriptsSerial(data.files, function() {
                        Ox.LOCALES = data.locales;
                        Ox.VERSION = data.version;
                        Ox.DEBUG = true;
                        Ox.forEach(previousOx, function(value, key) {
                            if (Ox.isUndefined(Ox[key])) {
                                Ox[key] = value;
                            }
                        });
                        Ox.load.apply(null, args);
                    });
                });
            }

            function getPath() {
                var i, path, scripts = document.getElementsByTagName('script');
                for (i = 0; i < scripts.length; i++) {
                    if (/Ox\.js(\?\d+|)$/.test(scripts[i].src)) {
                        path = scripts[i].src.replace(/Ox\.js(\?\d+|)$/, '');
                    }
                }
                return path;
            }

            function loadJSON(callback) {
                var request = new XMLHttpRequest();
                request.open('GET', path + 'Ox/json/Ox.json?' + time, true);
                request.onreadystatechange = function() {
                    if (request.readyState == 4) {
                        if (request.status == 200) {
                            callback(JSON.parse(request.responseText));
                        }
                    }
                };
                request.send();
            }

            function loadScriptsSerial(scripts, callback) {
                loadScriptsParallel(scripts.shift(), function() {
                    if (scripts.length) {
                        loadScriptsSerial(scripts, callback);
                    } else {
                        callback();
                    }
                });
            }

            function loadScriptsParallel(scripts, callback) {
                var counter = 0, length = scripts.length;
                while (scripts.length) {
                    loadScript(scripts.shift(), function() {
                        ++counter == length && callback();
                    });
                }
            }

            function loadScript(script, callback) {
                var element = document.createElement('script'),
                    head = document.head
                        || document.getElementsByTagName('head')[0]
                        || document.documentElement;
                if (/MSIE/.test(navigator.userAgent)) {
                    // FIXME: find a way to check if css/js have loaded in MSIE
                    setTimeout(callback, 2500);
                } else {
                    element.onload = callback;
                }
                element.src = path + script + '?' + time;
                element.type = 'text/javascript';
                head.appendChild(element);
            }

        }

    };

}(this));
