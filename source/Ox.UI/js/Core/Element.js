'use strict';

/*@
Ox.Element <f> Basic UI element object
    # Arguments ----------------------------------------------------------------
    options <o|s> Options of the element, or just the `element` option
        element <s> Tagname or CSS selector
        tooltip <s|f> Tooltip title, or a function that returns one
            (e) -> <s> Tooltip title
            e <o> Mouse event
    self <o> Shared private variable
    # Usage --------------------------------------------------------------------
    ([options[, self]]) -> <o:Ox.JQueryElement> Element object
        # Events ---------------------------------------------------------------
        anyclick <!> anyclick
            Fires on mouseup, but not on any subsequent mouseup within 250 ms
            (this is useful if one wants to listen for singleclicks, but not
            doubleclicks, since it will fire immediately, and won't fire again
            in case of a doubleclick)
            * <*> Original event properties
        doubleclick <!> doubleclick
            Fires on the second mousedown within 250 ms (this is useful if one
            wants to listen for both singleclicks and doubleclicks, since it
            will not trigger a singleclick event)
            * <*> Original event properties
        drag <!> drag
            Fires on mousemove after dragstart, stops firing on mouseup
            clientDX <n> Horizontal drag delta in px
            clientDY <n> Vertical drag delta in px
            * <*> Original event properties
        dragend <!> dragpause
            Fires on mouseup after dragstart
            clientDX <n> Horizontal drag delta in px
            clientDY <n> Vertical drag delta in px
            * <*> Original event properties
        dragenter <!> dragenter
            Fires when entering an element during drag (this fires on the
            element being dragged -- the target element is the event's target
            property)
            clientDX <n> Horizontal drag delta in px
            clientDY <n> Vertical drag delta in px
            * <*> Original event properties
        dragleave <!> dragleave
            Fires when leaving an element during drag (this fires on the element
            being dragged -- the target element is the event's target property)
            clientDX <n> Horizontal drag delta in px
            clientDY <n> Vertical drag delta in px
            * <*> Original event properties
        dragpause <!> dragpause
            Fires once when the mouse doesn't move for 250 ms during drag (this
            is useful in order to execute operations that are too expensive to
            be attached to the drag event)
            clientDX <n> Horizontal drag delta in px
            clientDY <n> Vertical drag delta in px
            * <*> Original event properties
        mousedown <!> mousedown
            Fires on mousedown (this is useful if one wants to listen for
            singleclicks, but not doubleclicks or drag events, and wants the
            event to fire as early as possible)
            * <*> Original event properties
        dragstart <!> dragstart
            Fires when the mouse is down for 250 ms
            * <*> Original event properties
        mouserepeat <!> mouserepeat
            Fires every 50 ms after the mouse was down for 250 ms, stops firing
            on mouseleave or mouseup (this fires like a key that is being
            pressed and held, and is useful for buttons like scrollbars arrows
            that need to react to both clicking and holding)
        singleclick <!> singleclick
            Fires 250 ms after mouseup, if there was no subsequent mousedown
            (this is useful if one wants to listen for both singleclicks and
            doubleclicks, since it will not fire for doubleclicks)
            * <*> Original event properties
*/

Ox.Element = function(options, self) {

    // create private object
    self = self || {};
    // create defaults and options objects
    self.defaults = {};
    // allow for Ox.TestElement('<tagname>') or Ox.TestElement('cssSelector')
    self.options = Ox.isString(options) ? {element: options} : options || {};
    // stack of callbacks bound to option updates
    self.updateCallbacks = self.updateCallbacks || [];

    // create public object
    var that = new Ox.JQueryElement($(self.options.element || '<div>'))
        .addClass('OxElement')
        .on({mousedown: mousedown});

    if (self.options.element == '<iframe>') {
        that.on('load', function() {
            Ox.Message.post(that, 'init', {id: that.oxid});
        });
    }

    setTooltip();

    function mousedown(e) {
        /*
        better mouse events
        mousedown:
            trigger mousedown
        within 250 msec:
            mouseup: trigger anyclick
            mouseup + mousedown: trigger doubleclick
        after 250 msec:
            mouseup + no mousedown within 250 msec: trigger singleclick
            no mouseup within 250 msec:
                trigger mouserepeat every 50 msec
                trigger dragstart
                    mousemove: trigger drag
                    no mousemove for 250 msec:
                        trigger dragpause
                    mouseup: trigger dragend
        "anyclick" is not called "click" since this would collide with the click
        events of some widgets
        */
        var clientX, clientY,
            dragTimeout = 0,
            mouseInterval = 0;
        if (!self._mouseTimeout) {
            // first mousedown
            that.triggerEvent('mousedown', e);
            self._drag = false;
            self._mouseup = false;
            self._mouseTimeout = setTimeout(function() {
                // 250 ms later, no subsequent click
                self._mouseTimeout = 0;
                if (self._mouseup) {
                    // mouse went up, trigger singleclick
                    that.triggerEvent('singleclick', e);
                } else {
                    // mouse is still down, trigger mouserepeat
                    // every 50 ms until mouseleave or mouseup
                    mouserepeat();
                    mouseInterval = setInterval(mouserepeat, 50);
                    that.one('mouseleave', function() {
                        clearInterval(mouseInterval);
                    });
                    // trigger dragstart, set up drag events
                    that.triggerEvent('dragstart', e);
                    $('.OxElement').live({
                        mouseenter: dragenter,
                        mouseleave: dragleave
                    });
                    clientX = e.clientX;
                    clientY = e.clientY;
                    Ox.UI.$window
                        .off('mouseup', mouseup)
                        .mousemove(mousemove)
                        .one('mouseup', function(e) {
                            // stop checking for mouserepeat
                            clearInterval(mouseInterval);
                            // stop checking for dragpause
                            clearTimeout(dragTimeout);
                            // stop checking for drag
                            Ox.UI.$window.off({mousemove: mousemove});
                            // stop checking for dragenter and dragleave
                            $('.OxElement').off({
                                mouseenter: dragenter,
                                mouseleave: dragleave
                            });
                            // trigger dragend
                            that.triggerEvent('dragend', extend(e));
                        });
                    self._drag = true;
                }
            }, 250);
        } else {
            // second mousedown within 250 ms, trigger doubleclick
            clearTimeout(self._mouseTimeout);
            self._mouseTimeout = 0;
            that.triggerEvent('doubleclick', e);
        }
        Ox.UI.$window.one({mouseup: mouseup});
        function dragenter(e) {
            that.triggerEvent('dragenter', extend(e));
        }
        function dragleave(e) {
            that.triggerEvent('dragleave', extend(e));
        }
        function extend(e) {
            return Ox.extend({
                clientDX: e.clientX - clientX,
                clientDY: e.clientY - clientY
            }, e);
        }
        function mousemove(e) {
            e = extend(e);
            clearTimeout(dragTimeout);
            dragTimeout = setTimeout(function() {
                // mouse did not move for 250 ms, trigger dragpause
                that.triggerEvent('dragpause', e);
            }, 250);
            that.triggerEvent('drag', e);
        }
        function mouserepeat(e) {
            that.triggerEvent('mouserepeat', e);
        }
        function mouseup(e) {
            if (!self._mouseup && !self._drag) {
                // mouse went up for the first time, trigger anyclick
                that.triggerEvent('anyclick', e);
                self._mouseup = true;
            }
        }
    }

    function mouseenter(e) {
        that.$tooltip.show(e);
    }

    function mouseleave(e) {
        that.$tooltip.hide();
    }

    function mousemove(e) {
        that.$tooltip.options({title: self.options.tooltip(e)}).show(e);
    }

    // TODO: in other widgets, use this,
    // rather than some self.$tooltip that
    // will not get garbage collected
    function setTooltip() {
        if (self.options.tooltip) {
            if (Ox.isString(self.options.tooltip)) {
                that.$tooltip = Ox.Tooltip({title: self.options.tooltip});
                that.on({mouseenter: mouseenter}).off({mousemove: mousemove});
            } else {
                that.$tooltip = Ox.Tooltip({animate: false});
                that.on({mousemove: mousemove}).off({mouseenter: mouseenter});
            }
            that.on({mouseleave: mouseleave});
        } else {
            if (that.$tooltip) {
                that.$tooltip.remove();
                that.off({
                    mouseenter: mouseenter,
                    mousemove: mousemove,
                    mouseleave: mouseleave
                });
            }
        }
    }

    function update(key, value) {
        // update is called whenever an option is modified or added
        Ox.loop(self.updateCallbacks.length - 1, -1, -1, function(i) {
            // break if the callback returns false
            return self.updateCallbacks[i](key, value) !== false;
        });
    }

    /*@
    bindEvent <f> Adds event handler(s)
        (callback) -> <o> This element
            Adds a catch-all handler
        (event, callback) -> <o> This element
            Adds a handler for a single event
        ({event: callback, ...}) -> <o> This element
            Adds handlers for multiple events
        callback <f> Callback function
            data <o> event data (key/value pairs)
        event <s> Event name
            Event names can be namespaced, like `'click.foo'`
    @*/
    that.bindEvent = function() {
        Ox.Event.bind.apply(null, [self].concat(Ox.slice(arguments)));
        return that;
    };

    /*@
    bindEventOnce <f> Adds event handler(s) that run(s) only once
        (callback) -> <o> This element
            Adds a catch-all handler
        (event, callback) -> <o> This element
            Adds a handler for a single event
        ({event: callback, ...}) -> <o> This element
            Adds handlers for multiple events
        callback <f> Callback function
            data <o> event data (key/value pairs)
        event <s> Event name
            Event names can be namespaced, like `'click.foo'`
    @*/
    that.bindEventOnce = function() {
        Ox.Event.bindOnce.apply(null, [self].concat(Ox.slice(arguments)));
        return that;
    };

    /*@
    bindKeyboard <f> bind keyboard
        () -> <o> object
    @*/
    that.bindKeyboard = function() {
        Ox.Keyboard.bind(that.oxid);
        return that;
    };

    /*@
    defaults <function> Gets or sets the default options for an element object
        ({key: value, ...}) -> <obj> This element object
        key <str> The name of the default option
        value <*> The value of the default option
    @*/
    that.defaults = function() {
        var ret;
        if (arguments.length == 0) {
            ret = self.defaults;
        } else if (Ox.isString(arguments[0])) {
            ret = self.defaults[arguments[0]];
        } else {
            self.defaults = arguments[0];
            self.options = Ox.clone(self.defaults);
            ret = that;
        }
        return ret;
    };

    /*@
    gainFocus <function> Makes an element object gain focus
    () -> <obj> This element object
    @*/
    that.gainFocus = function() {
        Ox.Focus.focus(that.oxid);
        return that;
    };

    /*@
    hasFocus <function> Returns true if an element object has focus
    () -> <boolean> True if the element has focus
    @*/
    that.hasFocus = function() {
        return Ox.Focus.focused() == that.oxid;
    };

    /*@
    loseFocus <function> Makes an element object lose focus
    () -> <object> This element object
    @*/
    that.loseFocus = function() {
        Ox.Focus.blur(that.oxid);
        return that;
    };

    /*@
    onMessage <f> Adds message handlers (if the element is an iframe)
        (callback) -> <o> This element
            Adds a catch-all handler
        (event, callback) -> <o> This element
            Adds a handler for a single event
        ({event: callback, ...}) -> <o> This element
            Adds handlers for multiple events
        callback <f> Callback function
            data <o> event data (key/value pairs)
        event <s> Event name
    @*/
    that.onMessage = function() {
        // FIXME: Implement catch-all handler
        var callback;
        if (self.options.element == '<iframe>') {
            if (Ox.isObject(arguments[0])) {
                Ox.forEach(arguments[0], function(callback, event) {
                    Ox.Message.bind(arguments[0], function(event_, data, oxid) {
                        if (event_ == event && oxid == that.oxid) {
                            callback(data || {});
                        }
                    });
                });
            } else {
                callback = arguments[0];
                Ox.Message.bind(function(event, data, oxid) {
                    if (that.oxid == oxid) {
                        callback(event, data || {});
                    }
                });
            }
        }
        return that;
    };

    /*@
    options <f> Gets or sets the options of an element object
        () -> <o> All options
        (key) -> <*> The value of option[key]
        (key, value) -> <o> This element
            Sets options[key] to value and calls update(key, value)
            if the key/value pair was added or modified
        ({key: value, ...}) -> <o> This element
            Sets multiple options and calls update(key, value)
            for every key/value pair that was added or modified
        key <s> The name of the option
        value <*> The value of the option
    @*/
    that.options = function() {
        return Ox.getset(self.options, arguments, update, that);
    };

    /*@
    postMessage <f> Sends a message (if the element is an iframe)
        (event, data) -> This element
        event <s> Event name
        data <o> Event data
    @*/
    that.postMessage = function(event, data) {
        if (self.options.element == '<iframe>') {
            Ox.Message.post(that, event, data);
            return that;
        }
    };

    /*@
    removeElement <f> Removes an element object and its event handler
        () -> <o> This element
    @*/
    that.remove = function(remove) {
        remove !== false && that.find('.OxElement').each(function() {
            var element = Ox.UI.elements[$(this).data('oxid')];
            element && element.remove(false);
        });
        Ox.Focus.remove(that.oxid);
        Ox.Keyboard.unbind(that.oxid);
        delete Ox.UI.elements[that.oxid];
        that.$tooltip && that.$tooltip.remove();
        remove !== false && that.$element.remove();
        return that;
    };

    /*@
    setElement <f> set $element
        ($element) -> <o> This element
    @*/
    that.setElement = function($element) {
        $element.addClass('OxElement').data({oxid: that.oxid});
        that.$element.replaceWith($element);
        that.$element = $element;
        that[0] = $element[0];
        return that;
    };

    /*@
    toggleOption <f> Toggle boolean option(s)
        (key[, key[, ...]]) -> <o> This element
    @*/
    that.toggleOption = function() {
        var options = {};
        Ox.toArray(arguments).forEach(function(key) {
            options[key] == !self.options[key];
        });
        that.options(options);
        return that;
    };

    /*@
    triggerEvent <f> Triggers one or more events
        (event) -> <o> This element object
            Triggers an event
        (event, data) -> <o> This element object
            Triggers an event with data
        ({event: data, ...}) -> <o> This element object
            Triggers multiple events with data
        event <string> Event name
        data <object> Event data (key/value pairs)
    @*/
    that.triggerEvent = function() {
        Ox.Event.trigger.apply(that, [self].concat(Ox.slice(arguments)));
        return that;
    };

    /*@
    unbindEvent <f> Removes event handler(s)
        () -> <o> This element
            Removes all handlers.
        (callback) -> <o> This element
            Removes a specific catch-all handler
        (event) -> <o> This element
            Removes all handlers for a single event (to remove all catch-all
            handlers, pass '*' as event)
        (event, callback) -> <o> This element
            Removes a specific handler for a single event
        ({event: callback}, ...) -> <o> This element
            Removes specific handlers for multiple events
        event <string> Event name
    @*/
    that.unbindEvent = function() {
        Ox.Event.unbind.apply(null, [self].concat(Ox.slice(arguments)));
        return that;
    };

    /*@
    unbindKeyboard <f> unbind keyboard
        () -> <o> object
    @*/
    that.unbindKeyboard = function() {
        Ox.Keyboard.unbind(that.oxid);
        return that;
    };

    /*@
    update <f> Adds one or more handlers for options updates
    (callback) -> <o> that
    (key, callback) -> <o> that
    ({key: callback, ...}) -> <o> that
    @*/
    that.update = function() {
        var callbacks;
        if (Ox.isFunction(arguments[0])) {
            self.updateCallbacks.push(arguments[0]);
        } else {
            callbacks = Ox.makeObject(arguments);
            self.updateCallbacks.push(function(key) {
                if (callbacks[key]) {
                    return callbacks[key]();
                }
            });
        }
        return that;
    };

    /*@
    value <f> Shortcut to get or set self.options.value
    @*/
    that.value = function() {
        return that.options(
            arguments.length == 0 ? 'value' : {value: arguments[0]}
        );
    };

    that.update({tooltip: setTooltip});

    return that;

};
