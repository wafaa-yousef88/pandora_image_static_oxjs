'use strict';

/*@
Ox.Event <o> Event controller
@*/

Ox.Event = (function() {

    var eventHandlers = [],
        that = {};

    function log(data, event, self) {
        var element = this,
            handlers = self.eventHandlers ? self.eventHandlers[event] : [];
        if (!Ox.contains([
            'mousedown', 'mouserepeat', 'anyclick', 'singleclick', 'doubleclick',
            'dragstart', 'drag', 'dragenter', 'dragleave', 'dragpause', 'dragend',
            'draganddropstart', 'draganddrop', 'draganddropenter', 'draganddropleave', 'draganddropend',
            'playing', 'position', 'progress'
        ], event)) {
            try {
                data = JSON.stringify(data)
            } catch(e) {}
            Ox.print(
                'EVENT',
                element.oxid,
                '"' + element[0].className.split(' ').filter(function(className) {
                    return /^Ox/.test(className);
                }).map(function(className) {
                    return className.replace(/^Ox/, '');
                }).join(' ') + '"',
                event,
                data,
                handlers.length,
                handlers.map(function(handler) {
                    return handler.toString().split('\n').shift();
                })
            );
        }
    }

    /*@
    .bind <f> Adds event handler(s)
        (callback) -> <o> Ox.Event
            Adds a global event handler
        (self, callback) -> <o> Ox.Event
            Adds a catch-all handler
        (self, event, callback) -> <o> Ox.Event
            Adds a handler for a single event
        (self, {event: callback, ...}) -> <o> Ox.Event
            Adds handlers for multiple events
        self <o> The element's shared private object
        callback <f> Callback function
            data <o> Event data
            event <s> Event name
            element <o> Element
        event <s> Event name
            Event names can be namespaced, like `'click.foo'`
    */
    that.bind = function() {
        var args = Ox.toArray(arguments), once, self;
        if (args.length == 1) {
            eventHandlers.push(args[0])
        } else {
            self = args.shift();
            once = Ox.isBoolean(Ox.last(args)) ? args.pop() : false;
            args = Ox.isFunction(args[0]) ? {'*': args[0]} : Ox.makeObject(args);
            if (Ox.len(args) && !self.eventHandlers) {
                self.eventHandlers = {};
            }
            Ox.forEach(args, function(callback, event) {
                self.eventHandlers[event] = (
                    self.eventHandlers[event] || []
                ).concat({callback: callback, once: once});
            });
        }
        return that;
    };

    /*@
    .bindOnce <f> Adds event handler(s) that run(s) only once
        (self, callback) -> <o> Ox.Event
            Adds a catch-all handler
        (self, event, callback) -> <o> Ox.Event
            Adds an event handler for a single event
        (self, {event: callback, ...}) -> <o> Ox.Event
            Adds event handlers for multiple events
        self <o> The element's shared private object
        callback <f> Callback function
            data <o> Event data
            event <s> Event name
            element <o> Element
        event <s> Event name
            Event names can be namespaced, like `'click.foo'`    
    */
    that.bindOnce = function() {
        return that.bind.apply(null, Ox.slice(arguments).concat(true));
    };

    /*@
    .log <f> Turns event logging on or off
        (enabled) -> <o> Ox.Event
        enabled <b> Enables (`true`) or disables (`false`) event logging
    */
    that.log = function(enabled) {
        that[enabled ? 'bind' : 'unbind'](log);
        return that;
    };

    /*@
    .trigger <f> Triggers an event
        (self, event) -> <o> Ox.Event
            Triggers an event
        (self, event, data) -> <o> Ox.Event
            Triggers an event with data
        (self, {event: data, ...}) -> Ox.Event
            Triggers multiple events with data
        self <o> The element's shared private object
        event <s> Event name
        data <o> Event data
    */
    that.trigger = function(self) {
        var args = arguments, element = this;
        if (self.eventHandlers) {
            Ox.forEach(Ox.makeObject(Ox.slice(args, 1)), function(data, event) {
                var triggered = event.split('.');
                eventHandlers.forEach(function(callback) {
                    callback.call(element, data || {}, event, element);
                });
                triggered.map(function(v, i) {
                    return triggered.slice(0, i + 1).join('.');
                }).concat('*').forEach(function(triggered) {
                    var handlers = self.eventHandlers[triggered];
                    handlers && handlers.forEach(function(handler, i) {
                        handler.once && handlers.splice(i, 1);
                        handler.callback.call(element, data || {}, event);
                    });
                });
            });
        }
        return that;
    };

    /*@
    .unbind <f> Removes an event handler
        () -> Ox.Event
            Removes all global handlers
        (callback) -> <o> Ox.Event
            Removes a global handler
        (self) -> <o> Ox.Event
            Removes all handlers
        (self, callback) -> <o> Ox.Event
            Removes a specific catch-all handler
        (self, event) -> <o> Ox.Event
            Remove all handlers for a single event
        (self, event, callback) -> <o> Ox.Event
            Removes a specific handler for a single event
        (self, {event: callback, ...}) -> <o> Ox.Event
            Removes specific event handlers for multiple events
        self <o> The element's shared private object
        callback <f> Callback function
        event <s> Event name
    */
    that.unbind = function() {
        var args = Ox.slice(arguments), self;
        if (args.length == 0) {
            eventHandlers = [];
        } else if (Ox.isFunction(args[0])) {
            eventHandlers.forEach(function(handler, i) {
                handler === args[0] && eventHandlers.splice(i, 1);
            });
        } else if ((self = args.shift()).eventHandlers) {
            if (args.length == 0) {
                delete self.eventHandlers;
            } else {
                if (Ox.isFunction(args[0])) {
                    args = {'*': args[0]};
                }
                Ox.forEach(Ox.makeObject(args), function(callback, event) {
                    if (Ox.isUndefined(callback)) {
                        delete self.eventHandlers[event];
                    } else {
                        self.eventHandlers[event].forEach(function(handler, i) {
                            if (handler.callback === callback) {
                                self.eventHandlers[event].splice(i, 1);
                            }
                        });
                    }
                });
            }
        }
        return that;
    };

    return that;

}());
