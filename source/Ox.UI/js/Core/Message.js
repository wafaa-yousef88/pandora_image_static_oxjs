/*@
Ox.Message <o> Message controller
@*/

Ox.Message = (function() {

    var that = {},
        callbacks = [];

    window.addEventListener('message', function(e) {
        var data = {};
        try {
            data = JSON.parse(e.data);
        } catch(e) {}
        Ox.Log('MESSAGE', data)
        if (data.event == 'init') {
            window.oxid = data.data.id;
        } else if (data.event) {
            callbacks.forEach(function(callback) {
                callback(data.event, data.data, data.oxid);
            });
        } else {
            Ox.Log('Core', 'unknown message', e.data);
        }
    });

    // Defined here so one can just load Message.js in addtion to Ox.js
    Ox.$parent = {
        onMessage: function() {
            var callback;
            if (Ox.isObject(arguments[0])) {
                Ox.forEach(arguments[0], function(callback, event) {
                    Ox.Message.bind(function(event_, data, oxid) {
                        if (event_ == event && Ox.isUndefined(oxid)) {
                            callback(data || {});
                        }
                    });
                });
            } else {
                callback = arguments[0];
                Ox.Message.bind(function(event, data, oxid) {
                    if (Ox.isUndefined(oxid)) {
                        callback(event, data || {});
                    }
                });
            }
            return this;
        },
        postMessage: function(event, message) {
            Ox.Message.post(Ox.$parent, event, message);
            return this;
        }
    };

    /*@
    .bind <f> Adds message handler
        (callback) -> <o> Ox.Message
        callback <f> Callback function
    
    @*/
    that.bind = function(callback) {
        callbacks.push(callback);
        return that;
    };

    /*@
    .post <f> Sends a message
        (target, event, data) -> <o> Ox.Message
        target <o|s> Ox.$parent or iframe Ox.Element or element id
        event <s> Event name
        data <o> Event data
    @*/
    that.post = function(target, event, data) {
        target = target == Ox.$parent ? window.parent
            : Ox.isElement(target[0]) ? target[0].contentWindow
            : Ox.$('#' + target)[0].contentWindow;
        target.postMessage(JSON.stringify({
            data: data,
            event: event,
            oxid: window.oxid
        }), '*');
        return that;
    };

    return that;

})();
