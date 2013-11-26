'use strict';

/*@
Ox.get <f> Get a remote resource
    (url, callback) -> <u> undefined
    url <s> Remote URL
    callback <f> Callback function
        data <s|null> The contents of the remote resource, or `null` on error
        error <o|null> Error, or `null` on success
            code <n> Status code
            text <s> Status text
@*/
Ox.get = function(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            if (request.status == 200) {
                callback(request.responseText, null);
            } else {
                callback(null, {
                    code: request.status,
                    text: request.statusText
                });
            }
        }
    };
    request.send();                
};

/*@
Ox.getAsync <f> Runs an asynchonous loader for an array of URLs
    (urls, get, callback) -> <u> undefined
    urls <s|a> URL or array of either URLs or arrays of URLs 
        Multiple URLs in the same array will be processed simultaneously, but
        multiple arrays of URLs will be processed in that order.
    get <f> Asynchronous function that loads a URL (for example Ox.get)
        url <s> URL
        callback <f> Callback function
            result <s|null> Result, or `null` on error
            error <o|null> Error, or `null` on success
                code <n> Status code
                text <s> Status text
    callback <f> Callback function
        results <o|null> Results
            Keys are file names, values are results
        errors <o|null> Errors, or null
            Keys are file names, values are error objects
@*/
Ox.getAsync = function(urls, get, callback) {
    urls = Ox.clone(Ox.makeArray(urls));
    var errors = {}, i = 0, n = urls.length, results = {};
    function done() {
        callback(
            n == 1 ? results[urls[0]] : results,
            n == 1 ? errors[urls[0]] : Ox.some(errors, function(error) {
                return error !== null;
            }) ? errors : null
        );
    }
    function iterate() {
        var url = urls.shift();
        Ox.getAsync(url, get, function(result, error) {
            results[url] = result;
            errors[url] = error;
            urls.length ? iterate() : done();
        });
    }
    if (urls.some(Ox.isArray)) {
        iterate();
    } else {
        urls.forEach(function(url) {
            get(url, function(result, error) {
                results[url] = result;
                errors[url] = error;
                ++i == n && done();
            });
        });
    }
};

/*@
Ox.getFile <f> Loads a file (image, script or stylesheet)
    (file, callback) -> <u> undefined
    file <s|a> Local path or remote URL, or array of those, or array of arrays
        Multiple files in the same array will be processed simultaneously, but
        multiple arrays of files will be processed in that order.
    callback <f> Callback function
        image <h> DOM element (if the file is an image)
@*/
// FIXME: this doesn't handle errors yet
Ox.getFile = (function() {

    var cache = {};
    
    function getFile(file, callback) {
        var element,
            head = document.head
                || document.getElementsByTagName('head')[0]
                || document.documentElement,
            request,
            type = file.split('.').pop(),
            isImage = type != 'css' && type != 'js';
        if (!cache[file]) {
            if (isImage) {
                element = new Image();
                element.onload = addFileToCache;
                element.src = file;
            } else {
                if (!findFileInHead()) {
                    element = document.createElement(
                        type == 'css' ? 'link' : 'script'
                    );
                    element[
                        type == 'css' ? 'href' : 'src'
                    ] = file + '?' + (Ox.DEBUG ? Ox.random(1000000) : Ox.VERSION);
                    element.type = type == 'css' ? 'text/css' : 'text/javascript';
                    if (type == 'css') {
                        element.rel = 'stylesheet';
                    }
                    if (/MSIE/.test(navigator.userAgent)) {
                        // fixme: find a way to check
                        // if css/js have loaded in msie
                        setTimeout(addFileToCache, 2500);
                    } else {
                        if (type == 'css') {
                            waitForCSS();
                        } else {
                            element.onload = addFileToCache;
                        }                        
                    }
                    head.appendChild(element);
                } else {
                    addFileToCache();
                }
            }
        } else {
            callback();
        }
        function addFileToCache() {
            if (isImage) {
                // for an image, save the element itself,
                // so that it remains in the browser cache
                cache[file] = element;
                callback(element);
            } else {
                cache[file] = true;
                callback();
            }
        }
        function findFileInHead() {
            return Ox.toArray(
                document.getElementsByTagName(type == 'css' ? 'link' : 'script')
            ).map(function(element) {
                return element[type == 'css' ? 'href' : 'src'] == file;
            }).reduce(function(prev, curr) {
                return prev || curr; 
            }, false);
        }
        function waitForCSS() {
            var error = false;
            try {
                element.sheet.cssRule;
            } catch (e) {
                error = true;
                setTimeout(function() {
                    waitForCSS();
                }, 25);
            }
            !error && addFileToCache();
        }
    };

    return function(files, callback) {
        Ox.getAsync(files, function(file, callback) {
            getFile(file, function(images) {
                callback(images ? {file: images} : {});
            });
        }, callback);
    };

}());

/*@
Ox.getJSON <f> Get and parse one or more remote JSON files
    (url, callback) -> <u> undefined
    url <s|a> One or more remote URLs
    callback <f> Callback function
        data <*|o|null> The parsed content of the remote resource(s)
            For multiple URLs, keys are file names, values are parsed contents
        error <o|null> Error(s)
            For multiple URLs, keys are file names, values are error objects
@*/
Ox.getJSON = function(url, callback, isJSONC) {
    var urls = Ox.makeArray(url);
    Ox.getAsync(urls, function(url, callback) {
        Ox.get(url, function(data, error) {
            callback(JSON.parse(
                isJSONC ? Ox.minify(data || '') : data
            ), error);
        });
    }, callback);
};

/*@
Ox.getJSONC <f> Get and parse a remote JSONC file
    JSONC is JSON with JavaScript line or block comments
    (url, callback) -> <u> undefined
    url <s|a> One or more remote URLs
    callback <f> Callback function
        data <*|o|null> The parsed content of the remote resource(s)
            For multiple URLs, keys are file names, values are parsed contents
        error <o|null> Error(s)
            For multiple URLs, keys are file names, values are error objects
@*/
Ox.getJSONC = function(url, callback) {
    Ox.getJSON(url, function(results, errors) {
        callback(results, errors);
    }, true);
};

/*@
Ox.getJSONP <f> Get and parse one or more remote JSONP files
    (url, callback) -> <u> undefined
    url <s|a> One or more remote URLs
        {callback} gets replaced with jsonp callback function name
    callback <f> Callback function
        data <*|o|null> The parsed content of the remote resource(s)
            For multiple URLs, keys are file names, values are parsed contents
        error <o|null> Error(s)
            For multiple URLs, keys are file names, values are error objects
@*/
Ox.getJSONP = function(url, callback) {
    var urls = Ox.makeArray(url);
    Ox.getAsync(urls, function(url, callback) {
        var id = 'callback' + Ox.uid();
        Ox.getJSONP[id] = function(data) {
            delete Ox.getJSONP[id];
            callback(data, null);
        };
        Ox.$('body').append(Ox.$('<script>').attr({
            'src': url.replace('{callback}', 'Ox.getJSONP.' + id),
            'type': 'text/javascript'
        }));
    }, callback);
};
