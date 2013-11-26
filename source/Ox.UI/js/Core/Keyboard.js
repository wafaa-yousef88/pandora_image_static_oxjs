'use strict';

/*@
Ox.Keyboard <o> Basic keyboard controller
@*/

Ox.Keyboard = (function() {

    var buffer = '', bound = [], resetTimeout, triggerTimeout;

    Ox.UI.ready(function() {
        Ox.$document.keydown(keydown);
    });

    function keydown(event) {

        var focused = Ox.Focus.focused(),
            $focused = focused === null ? null : Ox.UI.elements[focused],
            key,
            keyName = Ox.KEYS[event.keyCode] || '',
            keyNames = keyName ? [keyName] : [],
            keyBasename = keyName.split('.')[0],
            ret = true;

        Ox.forEach(Ox.MODIFIER_KEYS, function(v, k) {
            // avoid pushing modifier twice
            // using event.originalEvent since jquery always sets
            // event.metaKey to event.ctrlKey
            if (event.originalEvent[k] && keyBasename != v) {
                keyNames.splice(-1, 0, v);
            }
        });
        key = keyNames.join('_');
        if (
            focused === null || (
                !$focused.hasClass('OxInput')
                && !$focused.hasClass('OxEditableContent')
                && !$focused.hasClass('OxAutocompleteMenu')
            )
        ) {
            bound.forEach(function(id) {
                Ox.UI.elements[id].triggerEvent('key_' + key);
            });
            // Don't open Chrome Inspect Element, used for copyadd
            if (bound.length && key == 'control_shift_c') {
                event.preventDefault();
            }
            // Firefox opens quick find on slash and quick link find on quote otherwise
            if (keyName == 'slash' || keyName == 'quote') {
                event.preventDefault();
            }
        }
        if (focused !== null && bound.indexOf(focused) == -1) {
            $focused.triggerEvent('key_' + key);
            // prevent Chrome from scrolling, or going back in history
            if (
                [
                    'backspace', 'down', 'left', 'right', 'space', 'up'
                ].indexOf(key) > -1
                && !$focused.hasClass('OxInput')
                && !$focused.hasClass('OxEditableContent')
                && !$focused.hasClass('OxAutocompleteMenu')
            ) {
                ret = false;
            }
            // prevent cursor in input field from moving to start or end
            if (
                ['down', 'up'].indexOf(key) > -1
                && $focused.hasClass('OxAutocompleteMenu')
            ) {
                ret = false;
            }
        }

        if (/^[\w\d](\.numpad)?$|^space$/.test(key)) {
            // don't register leading spaces or trailing double spaces
            if (!(keyName == 'space' && (buffer == '' || / $/.test(buffer)))) {
                buffer += keyName == 'space' ? ' ' : keyBasename;
                // clear the trigger timeout only if the key went into the buffer
                clearTimeout(triggerTimeout);
                triggerTimeout = setTimeout(function() {
                    if (focused !== null) {
                        $focused.triggerEvent('keys', {keys: buffer});
                    }
                }, 250);
            }
        }
        // clear the reset timeout even if the key didn't go into the buffer
        clearTimeout(resetTimeout);
        resetTimeout = setTimeout(function() {
            buffer = '';
        }, 1000);

        // Firefox cancels active XMLHttpRequests when pressing escape
        if (keyName == 'escape') {
            event.preventDefault();
        }

        return ret;

    }

    return {
        /*@
        bind <f> bind
            (id) -> <u> bind id
        @*/
        bind: function(id) {
            var index = bound.indexOf(id);
            index == -1 && bound.push(id);
        },
        /*@
        unbind <f> unbind
            (id) -> <u> unbind id
        @*/
        unbind: function(id) {
            var index = bound.indexOf(id);
            index > -1 && bound.splice(index, 1);
        }
    };

}());
