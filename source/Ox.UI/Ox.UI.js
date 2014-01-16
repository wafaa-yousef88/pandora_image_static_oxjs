'use strict';

Ox.load.UI = function(options, callback) {

    options = Ox.extend({
        hideScreen: true,
        showScreen: false,
        theme: 'oxlight'
    }, options);

    var browsers = [
            {
                name: 'Chrome Frame',
                url: 'http://www.google.com/chromeframe/'
            },
            {
                name: 'Chrome',
                regexp: /Chrome\/(\d+)\./,
                url: 'http://www.google.com/chrome/',
                version: 10
            },
            {
                name: 'Firefox',
                regexp: /Firefox\/(\d+)\./,
                url: 'http://www.mozilla.org/firefox/',
                version: 4
            },
            {
                name: 'Safari',
                regexp: /Version\/(\d+).*? Safari/,
                url: 'http://www.apple.com/safari/',
                version: 5
            },
            {
                name: 'WebKit',
                regexp: /AppleWebKit\/(\d+)\./,
                version: 534
            },
            {
                name: 'Googlebot',
                regexp: /Googlebot\/(\d+)\./,
                version: 2
            },
            {
                name: 'Internet Explorer',
                url: 'http://windows.microsoft.com/en-US/internet-explorer/products/ie/home',
                version: 9
            }
        ],
        browserSupported = false,
        colors = {
            marker: {
                '#000000': 'videoMarkerBorder',
                '#FFFFFF': 'videoMarkerBackground'
            },
            symbol: {
                '#FF0000': 'symbolWarningColor'
            }
        },
        images = {},
        isInternetExplorer = /MSIE/.test(navigator.userAgent),
        loadingInterval,
        themes = {};

    browsers.forEach(function(browser) {
        var match = browser.regexp && browser.regexp.exec(navigator.userAgent);
        if (match && match[1] >= browser.version) {
            browserSupported = true;
        }
    });

    Ox.documentReady(function() {
        Ox.$('body').addClass(
            'OxTheme' + Ox.toTitleCase(options.theme || 'oxlight')
        );
        options.showScreen && showScreen();
    });

    loadFiles();

    function showScreen() {

        var body = Ox.$('body'),
            css = {
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                margin: 'auto',
                MozUserSelect: 'none',
                WebkitUserSelect: 'none'
            },
            div = Ox.$('<div>')
                .addClass('OxLoadingScreen')
                .css({
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    padding: '4px',
                    background: 'rgb(' + (
                        options.theme == 'oxlight' ? '240, 240, 240'
                            : options.theme == 'oxmedium' ? '144, 144, 144'
                            : '16, 16, 16'
                    ) + ')',
                    opacity: 1,
                    zIndex: 1000
                })
                .appendTo(body);

        browserSupported ? showIcon() : showWarning();

        function showIcon() {
            /*
            // SVG transform performs worse than CSS transform
            var src = Ox.PATH + 'Ox.UI/themes/' + options.theme + '/svg/symbolLoadingAnimated.svg'
            Ox.getFile(src, function() {
                Ox.$('<img>')
                    .attr({
                        src: src
                    })
                    .css(Ox.extend({
                        width: '32px',
                        height: '32px'
                    }, css))
                    .on({
                        mousedown: function(e) {
                            e.preventDefault();
                        }
                    })
                    .appendTo(div);
            });
            */
            var deg = 0,
                element,
                src = Ox.PATH + 'Ox.UI/themes/' + options.theme + '/svg/symbolLoading.svg'
            Ox.getFile(src, function() {
                element = Ox.$('<img>')
                    .attr({
                        src: src
                    })
                    .css(Ox.extend({
                        width: '32px',
                        height: '32px'
                    }, css))
                    .on({
                        mousedown: function(e) {
                            e.preventDefault()
                        }
                    })
                    .appendTo(div);
                loadingInterval = setInterval(function() {
                    deg = (deg + 30) % 360;
                    element.css({
                        MozTransform: 'rotate(' + deg + 'deg)',
                        OTransform: 'rotate(' + deg + 'deg)',
                        WebkitTransform: 'rotate(' + deg + 'deg)',
                        transform: 'rotate(' + deg + 'deg)'
                    });
                }, 83);
            });
        }

        function showWarning() {
            var counter = 0;
                /*
                message = 'Browser not supported, use ' + browsers.map(function(browser, i) {
                    return browser.name + (
                        i == browsers.length - 1 ? '.' :
                        i == browsers.length - 2 ? ' or' : ','
                    );
                }).join(' ');
                */
            div.addClass('OxError');
            browsers = browsers.filter(function(browser) {
                return browser.url;
            });
            isInternetExplorer ? browsers.pop() : browsers.shift();
            browsers.forEach(function(browser) {
                browser.src = Ox.PATH + 'Ox.UI/png/browser' + browser.name.replace(' ', '') + '128.png';
                Ox.getFile(browser.src, function() {
                    ++counter == browsers.length && showIcons();
                });
            });
            function showIcons() {
                var box = Ox.$('<div>')
                    .css(Ox.extend({
                        width: (browsers.length * 72) + 'px',
                        height: '72px'
                    }, css))
                    .appendTo(div);
                browsers.forEach(function(browser, i) {
                    var link = Ox.$('<a>')
                        .attr({
                            href: browser.url,
                            title: (browser.name == 'Chrome Frame' ? 'Install' : 'Download')
                                + ' ' + browser.name
                        })
                        .css({
                            position: 'absolute',
                            left: (i * 72) + 'px',
                            width: '72px',
                            height: '72px'
                        })
                        .appendTo(box);
                    Ox.$('<img>')
                        .attr({
                            src: browser.src
                        })
                        .css(Ox.extend({
                            width: '64px',
                            height: '64px',
                            border: 0,
                            cursor: 'pointer'
                        }, css))
                        .on({
                            mousedown: function(e) {
                                e.preventDefault();
                            }
                        })
                        .appendTo(link);
                });
            }
            
        }

    }

    function loadFiles() {

        Ox.getFile(Ox.PATH + '/Ox.UI/jquery/jquery.js', function() {
            initUI();
            Ox.getJSON(Ox.UI.PATH + 'json/Ox.UI.json?' + Ox.VERSION, function(data) {
                var counter = 0, length = data.files.length;
                images = data.images;
                data.files.forEach(function(file) {
                    if (/\.jsonc$/.test(file)) {
                        Ox.getJSONC(Ox.PATH + file + '?' + Ox.VERSION, function(data) {
                            var theme = /\/themes\/(\w+)\/json\//.exec(file)[1];
                            themes[theme] = data;
                            ++counter == length && initThemes();
                        });
                    } else {
                        Ox.getFile(Ox.PATH + file, function() {
                            ++counter == length && initThemes();
                        });
                    }
                });
            });
        });

    }

    function initThemes() {

        Ox.Theme.getThemes = function() {
            return Object.keys(themes);
        };
        Ox.Theme.getThemeData = function(theme) {
            return themes[theme || Ox.Theme()];
        };
        Ox.documentReady(function() {
            if (options.showScreen && options.hideScreen) {
                Ox.UI.hideLoadingScreen();
            }
            callback(browserSupported);
        });

    }

    function initUI() {

        //@ UI
        //@ Ox.UI <o> Collection of UI methods and properties
        Ox.UI = {};

        /*@
        Ox.UI.ready <f> queue callback to be called once UI is ready
            (callback) -> <u> call callback later
        @*/
        Ox.UI.ready = (function() {
            var callbacks = [];
            Ox.documentReady(function() {
                // FIXME: use Ox.$foo everywhere!
                Ox.$body = Ox.UI.$body = $('body');
                Ox.$document = Ox.UI.$document = $(document);
                Ox.$head = Ox.UI.$head = $('head');
                Ox.$window = Ox.UI.$window = $(window);
                // fixme: is this the right place to do this?
                $.browser.mozilla && Ox.$document.on('dragstart', function() {
                     return false;
                });
                callbacks.forEach(function(callback) {
                    callback();
                });
                //delete callbacks;
            });
            return function(callback) {
                if (Ox.$window) {
                    callback();
                } else {
                    callbacks.push(callback);
                }
            }
        }());

        //@ Ox.UI.DIMENSIONS <o> horizontal, vertical dimensions
        Ox.UI.DIMENSIONS = {
            horizontal: ['width', 'height'],
            vertical: ['height', 'width']
        };
        //@ Ox.UI.EDGES <o> horizontal, vertical edges
        Ox.UI.EDGES = {
            horizontal: ['left', 'right', 'top', 'bottom'],
            vertical: ['top', 'bottom', 'left', 'right']
        };
        //@ Ox.UI.elements <o> reference to all UI element instnaces
        Ox.UI.elements = {};
        /*@
        Ox.UI.getImageData <f> Returns image properties
            (url) -> <s> Image Name
        @*/
        Ox.UI.getImageData = Ox.cache(function(url) {
            var str = 'data:image/svg+xml;base64,';
            return Ox.startsWith(url, str)
                ? JSON.parse(atob(url.split(',')[1]).match(/<!--(.+?)-->/)[1])
                : null;
        });
        /*@
        Ox.UI.getImageURL <f> Returns an image URL
            (name[, color[, theme]]) -> <s> Image URL
            name <s> Image name
            color <s|[n]> Color name or RGB values
            theme <s> Theme name
        @*/
        Ox.UI.getImageURL = Ox.cache(function(name, color, theme) {
            var colorName,
                image = images[name],
                themeData,
                type = Ox.toDashes(name).split('-')[0];
            color = color || 'default';
            theme = theme || Ox.Theme();
            themeData = Ox.Theme.getThemeData(theme);
            if (type == 'symbol') {
                if (Ox.isString(color)) {
                    colorName = color;
                    color = themeData[
                        'symbol' + color[0].toUpperCase() + color.slice(1) + 'Color'
                    ];
                }
                image = image.replace(/#808080/g, '#' + Ox.toHex(color));
            }
            Ox.forEach(colors[type], function(name, hex) {
                image = image.replace(
                    new RegExp(hex, 'g'),
                    '$' + Ox.toHex(themeData[name])
                );
            });
            image = image.replace(/\$/g, '#');
            return 'data:image/svg+xml;base64,' + btoa(
                image + '<!--' + JSON.stringify(Ox.extend(color ? {
                    color: colorName
                } : {}, {
                    name: name, theme: theme
                })) + '-->'
            );
        }, {
            key: function(args) {
                args[1] = args[1] || 'default';
                args[2] = args[2] || Ox.Theme();
                return JSON.stringify(args);
            }
        });
        // ...
        Ox.UI.getOxElement = function(element) {
            return Ox.$elements[Ox.$(element).data('oxid')];
        };
        /*@
        Ox.UI.hideLoadingScreen <f> hide loading screen
            () -> <u> hide loading screen
        @*/
        Ox.UI.hideLoadingScreen = function() {
            var $div = $('.OxLoadingScreen'),
                error = $div.is('.OxError');
            //$div.find('img').remove();
            $div.animate({
                opacity: error ? 0.9 : 0
            }, 1000, function() {
                if (error) {
                    $div.on({
                        click: function() {
                            $div.remove();
                        }
                    });
                } else {
                    clearInterval(loadingInterval);
                    $div.remove();
                }
            });
        };
        /*@
        Ox.UI.isElement <f> Checks if an object is an Ox.Element
            (obj) -> <b> True if object is an Ox.Element
        @*/
        Ox.UI.isElement = function(object) {
            return Ox.isObject(object) && 'oxid' in object;
        };
        // ...
        Ox.UI.isOxElement = function(element) {
            return !!Ox.$(element).attr('data-oxid');
        };
        //@ Ox.UI.PATH <str> Path of Ox.UI
        Ox.UI.PATH = Ox.PATH + 'Ox.UI/';
        //@ Ox.UI.SCOLLBAR_SIZE <str> size of scrollbar
        Ox.UI.SCROLLBAR_SIZE = $.browser.webkit ? 8 : (function() {
            var inner = Ox.$('<p>').css({
                    height: '200px',
                    width: '100%'
                }),
                outer = Ox.$('<div>').css({
                    height: '150px',
                    left: 0,
                    overflow: 'hidden',
                    position: 'absolute',
                    top: 0,
                    visibility: 'hidden',
                    width: '200px'
                }).append(inner).appendTo($('body')),
                width = inner[0].offsetWidth;
            outer.css({overflow: 'scroll'});
            width = 1 + width - (inner[0].offsetWidth == width
                ? outer[0].clientWidth : inner[0].offsetWidth);
            outer.remove();
            return width;
        })();
        //@ Ox.UI.getBarSize <s> get bar size by name
        // fixme: the follwing should be deprecated
        Ox.UI.getBarSize = function(size) {
            var sizes = {
                small: 20,
                medium: 24,
                large: 28
            };
            return sizes[size];
        };
        //@ Ox.UI.symbols <o> unicode symbols
        // fixme: these should be part of Ox
        Ox.UI.symbols = {
            alt: '\u2325',
            apple: '\uF8FF',
            arrow_down: '\u2193',
            arrow_left: '\u2190',
            arrow_right: '\u2192',
            arrow_up: '\u2191',
            backspace: '\u232B',
            backup: '\u2707',
            ballot: '\u2717',
            black_star: '\u2605',
            burn: '\u2622',
            caps_lock: '\u21EA',
            check: '\u2713',
            //clear: '\u2327',
            clear: '\u00D7',
            click: '\uF803',
            close: '\u2715',
            command: '\u2318',
            control: '\u2303',
            cut: '\u2702',
            'delete': '\u2326',
            diamond: '\u25C6',
            edit: '\uF802',
            eject: '\u23CF',
            escape: '\u238B',
            end: '\u2198',
            enter: '\u2324',
            fly: '\u2708',
            gear: '\u2699',
            home: '\u2196',
            info: '\u24D8',
            navigate: '\u2388',
            option: '\u2387',
            page_up: '\u21DE',
            page_down: '\u21DF',
            redo: '\u21BA',
            'return': '\u21A9',
            //select: '\u21D5',
            select: '\u25BE',
            shift: '\u21E7',
            sound: '\u266B',
            space: '\u2423',
            tab: '\u21E5',
            trash: '\u267A',
            triangle_down: '\u25BC',
            triangle_left: '\u25C0',
            triangle_right: '\u25BA',
            triangle_up: '\u25B2',
            undo: '\u21BB',
            voltage: '\u26A1',
            warning: '\u26A0',
            white_star: '\u2606'
        };
        
    }

};
