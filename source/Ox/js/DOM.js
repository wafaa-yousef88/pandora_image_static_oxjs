'use strict';

/*@
Ox.$ <f> Generic HTML element, mimics jQuery
    value <s|h|w|?> tagname, selector, html element, `window`, or `document`
        Passing a tagname ('<tagname>') creates an element, passing a selector
        ('tagname', '.classname' or '#id') selects an element.
    (value) -> <o> Element object
    > Ox.$('<div>').addClass('red').hasClass('red')
    true
    > Ox.$('<div>').addClass('red').removeClass('red').hasClass('red')
    false
    > Ox.$('<div>').addClass('red').addClass('red')[0].className
    'red'
    > Ox.$('<div>').attr({id: 'red'}).attr('id')
    'red'
    > Ox.$('<div>').attr({id: 'red'}).removeAttr('id').attr('id')
    void 0
    > Ox.$('<div>').css({color: 'red'}).css('color')
    'red'
    > Ox.$('<div>').html('red').html()
    'red'
    > Ox.$('<div>').html('red').empty().html()
    ''
    > Ox.$('<input>').val('red').val()
    'red'
    > !!Ox.$('<div>').on({click: function(e) { Ox.test(e.type, 'click'); }}).trigger('click')
    true
@*/
Ox.$ = Ox.element = function(value) {

    var data = {},
        element = !Ox.isString(value) ? value // window, document or element
            : value[0] == '<' ? document.createElement(value.slice(1, -1))
            : value[0] == '#' ? document.getElementById(value.slice(1))
            : value[0] == '.' ? document.getElementsByClassName(value.slice(1))[0]
            : document.getElementsByTagName(value)[0],
        mousewheelEvents = ['wheel', 'mousewheel'],
        originalMousewheelEvents = 'onwheel' in document ? ['wheel']
            : ['mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'];

    function normalizeEvents(args) {
        var ret = {};
        Ox.forEach(Ox.makeObject(args), function(callback, event) {
            if (Ox.contains(mousewheelEvents, event)) {
                originalMousewheelEvents.forEach(function(event) {
                    ret[event] = callback;
                });
            } else {
                ret[event] = callback;
            }
        });
        return ret;
    }

    return element ? {
        //@ 0 <h> The DOM element itself
        0: element,
        /*@
        addClass <f> Adds a class name
            (className) -> <o> This element
            className <s> Class name
        @*/
        addClass: function(string) {
            this[0].className = Ox.unique(((
                this[0].className ? this[0].className + ' ' : ''
            ) + Ox.clean(string)).split(' ')).join(' ');
            return this;
        },
        /*@
        append <f> Appends one or more elements to this element
            (element[, element[, ...]]) -> <o> This element
            element <o> Another element
        @*/
        append: function() {
            var that = this;
            Ox.slice(arguments).forEach(function($element) {
                that[0].appendChild($element[0]);                
            });
            return this;
        },
        /*@
        appendTo <f> Appends this element object to another element object
            (element) -> <o> This element
            element <o> Another element
        @*/
        appendTo: function($element) {
            $element[0].appendChild(this[0]);
            return this;
        },
        /*@
        attr <f> Gets or sets an attribute
            (key) -> <s> Value
            (key, value) -> <o> This element
            ({key0: value0, key1: value1, ...}) -> <o> This element
            key <s> Attribute name
            value <s> Attribute value
        @*/
        attr: function() {
            var ret, that = this;
            if (arguments.length == 1 && Ox.isString(arguments[0])) {
                ret = this[0].getAttribute
                    ? this[0].getAttribute(arguments[0])
                    : null;
                // fixme: why exactly is this needed?
                if (ret === null) {
                    ret = void 0;
                }
            } else {
                Ox.forEach(Ox.makeObject(arguments), function(value, key) {
                    that[0].setAttribute && that[0].setAttribute(key, value);
                });
                ret = this;
            }
            return ret;
        },
        /*@
        children <f> Returns the children of this element
            () -> <[h]> Children
        @*/
        children: function() {
            return Ox.slice(this[0].childNodes);
        },
        /*@
        css <f> Gets or sets a CSS attribute
            (key) -> <s> Value
            (key, value) -> <o> This element
            ({key0: value0, key1: value1, ...}) -> <o> This element
            key <s> Attribute name
            value <s> Attribute value
        @*/
        css: function() {
            var ret, that = this;
            if (arguments.length == 1 && Ox.isString(arguments[0])) {
                ret = this[0].style[arguments[0]];
            } else {
                Ox.forEach(Ox.makeObject(arguments), function(value, key) {
                    that[0].style[key] = value;
                });
                ret = this;
            }
            return ret;
        },
        /*@
        data <f> Gets or sets data
            () -> <o> All data
            (key) -> <s> Value
            (key, value) -> <o> This element
            ({key0: value0, key1: value1, ...}) -> <o> This element
            key <s> Property
            value <*> Value
        @*/
        data: function() {
            var ret;
            if (arguments.length == 0) {
                ret = data;
            } else if (arguments.length == 1 && Ox.isString(arguments[0])) {
                ret = data[arguments[0]]
            } else {
                Ox.forEach(Ox.makeObject(arguments), function(value, key) {
                    data[key] = value;
                });
                ret = this;
            }
            return ret;
        },
        /*@
        empty <f> Empties the inner HTML
            () -> <o> This element
        @*/
        empty: function() {
            return this.html('');
        },
        /*@
        find <f> Find descendant elements
            ([selector]) -> <[h]> Elements
            selector <s|'*'> CSS selector
        @*/
        find: function(string) {
            return Ox.slice(this[0].querySelectorAll(string || '*'));
        },
        /*@
        hasClass <f> Returns true if this element has a given class
            (className) -> <b> True if this element has the class
            className <s> Class name
        @*/
        hasClass: function(string) {
            return this[0].className.split(' ').indexOf(string) > -1;
        },
        /*@
        height <f> Returns the height of this element
            () -> <n> Height in px
        @*/
        height: function() {
            return this[0].offsetHeight;
        },
        /*@
        hide <f> Hides this element
            () -> <o> This element
        @*/
        hide: function() {
            return this.css({display: 'none'});
        },
        /*@
        html <f> Gets or sets the inner HTML
            () -> <s> The inner HTML
            (html) -> <o> This element
            html <s> The inner HTML
        @*/
        html: function(string) {
            var ret;
            if (arguments.length == 0) {
                ret = this[0].innerHTML;
            } else {
                this[0].innerHTML = string;
                ret = this;
            }
            return ret;
        },
        /*@
        insertAfter <f> Inserts this element after another element
            (element) -> <o> This element
            element <o> Another element
        @*/
        insertAfter: function($element) {
            $element[0].parentNode.insertBefore(this[0], $element[0].nextSibling);
            return this;
        },
        /*@
        insertBefore <f> Inserts this element before another element
            (element) -> <o> This element
            element <o> Another element
        @*/
        insertBefore: function($element) {
            $element[0].parentNode.insertBefore(this[0], $element[0]);
            return this;
        },
        /*@
        next <f> Returns the sibling after this element
            () -> <h> Next element
        @*/
        next: function() {
            return this[0].nextSibling;
        },
        /*@
        nextAll <f> Returns all siblings after this element
            () -> <[h]> Next elements
        @*/
        nextAll: function() {
            var sibling = this[0], siblings = [];
            while (true) {
                var sibling = sibling.nextSibling;
                if (!sibling) {
                    break;
                }
                siblings.push(sibling);
            }
            return siblings;
        },
        /*@
        off <f> Unbinds a callback from an event
            (event) -> <o> This element (unbinds all callbacks)
            (event, callback) -> <o> This element
            ({event0: callback0, event1: callback1, ...}) -> <o> This element
            event <s> Event name
            callback <f> Callback function
        @*/
        off: function(event, callback) {
            var that = this;
            Ox.forEach(normalizeEvents(arguments), function(callback, event) {
                if (callback) {
                    that[0].removeEventListener(event, callback, false);
                } else {
                    that[0]['on' + event] = null;
                }
            });
            return this;
        },
        /*@
        on <f> Binds a callback to an event
            (event, callback) -> <o> This element
            ({event0: callback0, event1: callback1, ...}) -> <o> This element
            event <s> Event name
            callback <f> Callback function
                e <o> Event properties
        @*/
        on: function() {
            var that = this;
            Ox.forEach(normalizeEvents(arguments), function(callback, event) {
                that[0].addEventListener(event, callback, false);
            });
            return this;
        },
        /*@
        one <f> Binds a callback to an event and unbinds it on first invocation
            (event, callback) -> <o> This element
            ({event0: callback0, event1: callback1, ...}) -> <o> This element
            event <s> Event name
            callback <f> Callback function
                e <o> Event properties
        @*/
        one: function(events) {
            var args = Ox.slice(arguments), that = this;
            Ox.forEach(normalizeEvents(arguments), function(callback, event) {
                that.on(event, function fn() {
                    that.off(event, fn);
                    return callback.apply(that, args);
                });
            });
            return this;
        },
        /*@
        parent <f> Returns the parent of this element
            () -> <h> Parent element
        @*/
        parent: function() {
            return this[0].parentNode;
        },
        /*@
        parents <f> Returns all ancestors of this element
            () -> <[h]> Ancestor elements
        @*/
        parents: function() {
            var parent = this[0], parents = [];
            while (true) {
                var parent = parent.parentNode;
                if (!parent) {
                    break;
                }
                parents.unshift(parent);
            }
            return parents;
        },
        /*@
        prepend <f> Prepends one or more elements to this element
            (element[, element[, ...]]) -> <o> This element
            element <o> Another element
        @*/
        prepend: function() {
            var parent = this[0].parentNode;
            Ox.slice(arguments).reverse().forEach(function($element) {
                parent.insertBefore($element[0], parent.firstChild);
            });
            return this;
        },
        /*@
        prependTo <f> Prepends this element object to another element object
            (element) -> <o> This element
            element <o> Another element
        @*/
        prependTo: function($element) {
            var element = $element[0];
            element.insertBefore(this[0], element.firstChild);
            return this;
        },
        /*@
        prev <f> Returns the sibling before this element
            () -> <h> Next element
        @*/
        prev: function() {
            return this[0].previousSibling;
        },
        /*@
        prevAll <f> Returns all siblings before this element
            () -> <[h]> Next elements
        @*/
        prevAll: function() {
            var sibling = this[0], siblings = [];
            while (true) {
                var sibling = sibling.previousSibling;
                if (!sibling) {
                    break;
                }
                siblings.unshift(sibling);
            }
            return siblings;
        },
        /*@
        remove <f> Removes this element from the DOM
            () -> <o> This element
        @*/
        remove: function() {
            this[0].parentNode.removeChild(this[0]);
            return this;
        },
        /*@
        removeAttr <f> Removes an attribute
            (key) -> <o> This element
            ([key0, key1, ...]) -> <o> This element
            key <s> The attribute
        @*/
        removeAttr: function() {
            var that = this;
            Ox.makeArray(arguments[0]).forEach(function(key) {
                that[0].removeAttribute(key);
            });
            return this;
        },
        /*@
        removeClass <f> Removes a class name
            (className) -> <o> This element
            className <s> Class name
        @*/
        removeClass: function(string) {
            var array = Ox.clean(string).split(' ');
            this[0].className = this[0].className.split(' ').filter(
                function(className) {
                    return array.indexOf(className) == -1;
                }
            ).join(' ');
            return this;
        },
        /*@
        replace <f> Replaces another element with this element
            (element) -> <o> This element
            element <o> Another element
        @*/
        replace: function($element) {
            var next = $element[0].nextSibling, parent = $element[0].parentNode;
            $element.remove();
            parent.insertBefore(this[0], next);
            return this;
        },
        /*@
        replaceWith <f> Replaces this element with another element
            (element) -> <o> This element
            element <o> Another element
        @*/
        replaceWith: function($element) {
            var next = this[0].nextSibling, parent = this[0].parentNode;
            this.remove();
            parent.insertBefore($element[0], next);
            return this;
        },
        /*@
        show <f> Shows this element
            () -> This element
        @*/
        show: function() {
            return this.css({display: 'block'});
        },
        /*@
        siblings <f> Returns all siblings of this element
        () -> <[oh]> Sibling elements
        @*/
        siblings: function() {
            var that = this;
            return Ox.filter(this[0].parentNode.childNodes, function(element) {
                return element !== that[0];
            });
        },
        /*@
        text <f> Gets or sets the text contents
            () -> <s> The text contents
            (text) -> <o> This element
            text <s> The text contents
        @*/
        text: function() {
            var ret;
            if (arguments.length == 0) {
                ret = Ox.isString(this.textContent)
                    ? this.textContent : this.innerText;
            } else {
                ret = this.empty().append(this[0].createTextNode(string));
            }
            return ret;
        },
        /*@
        toggleClass <f> Toggles a class name
            (className) -> <o> This element
            className <s> Class name
        @*/
        toggleClass: function(string) {
            return this[
                this.hasClass(string) ? 'removeClass' : 'addClass'
            ](string);
        },
        /*@
        trigger <f> Triggers an event
            (event) -> <o> This element
        @*/
        trigger: function(event) {
            var e = document.createEvent('MouseEvents');
            e.initEvent(event, true, true);
            this[0].dispatchEvent(e);
            return this;
        },
        /*@
        val <f> Gets or sets the value property of this element
            () -> <s> Value
            (value) -> <o> This element
            value <s> Value
        @*/
        val: function(value) {
            var ret;
            if (arguments.length == 0) {
                ret = this[0].value;
            } else {
                this[0].value = value;
                ret = this;
            }
            return ret;
        },
        /*@
        width <f> Returns the width of this element
            () -> <n> Width in px
        @*/
        width: function() {
            return this[0].offsetWidth;            
        }
    } : null;

};

/*@
Ox.canvas <function> Generic canvas object
    Returns an object with the properties: `canvas`, `context`, `data` and
    `imageData`.
    (width, height) -> <o> canvas
    (image) -> <o> canvas
    width <n> Width in px
    height <n> Height in px
    image <e> Image object
@*/
Ox.canvas = function() {
    var c = {}, isImage = arguments.length == 1,
        image = isImage ? arguments[0] : {
            width: arguments[0], height: arguments[1]
        };
    c.context = (c.canvas = Ox.$('<canvas>').attr({
        width: image.width, height: image.height
    })[0]).getContext('2d');
    isImage && c.context.drawImage(image, 0, 0);
    c.data = (c.imageData = c.context.getImageData(
        0, 0, image.width, image.height
    )).data;
    return c;
};

/*@
Ox.documentReady <function> Calls a callback function once the DOM is ready
    (callback) -> <b> If true, the document was ready
    callback <f> Callback function
@*/
Ox.documentReady = (function() {
    var callbacks = [];
    document.onreadystatechange = window.onload = function() {
        if (document.readyState == 'complete') {
            callbacks.forEach(function(callback) {
                callback();
            });
            document.onreadystatechange = window.onload = null;
        }
    };
    return function(callback) {
        if (document.readyState == 'complete') {
            callback();
            return true;
        } else {
            callbacks.push(callback);
            return false;
        }
    };
}());
