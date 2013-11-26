'use strict';

/*@
Ox.Focus <o> Basic focus controller
@*/

Ox.Focus = (function() {
    var stack = [];
    return {
        _print: function() {
            Ox.Log('Core', stack);
        },
        _reset: function() {
            $('.OxFocus').removeClass('OxFocus');
            stack = [];
        },
        /*@
        blur <f> blur element
            (id) -> <u> blur element by id
        @*/
        blur: function(id) {
            Ox.GarbageCollection();
            var index = stack.indexOf(id);
            if (index > -1 && index == stack.length - 1) {
                stack.length == 1
                    // empty stack
                    ? stack.pop()
                    // swap the two last stack items
                    : stack.splice(stack.length - 2, 0, stack.pop());
                Ox.UI.elements[id]
                    .removeClass('OxFocus')
                    .triggerEvent('losefocus');
                if (stack.length) {
                    Ox.UI.elements[stack[stack.length - 1]]
                        .addClass('OxFocus')
                        .triggerEvent('gainfocus')
                }
                Ox.Log('Core', 'blur', id, stack);
            }
        },
        /*@
        focus <f> focus element
            (id) -> <u> focus element by id
        @*/
        focus: function(id) {
            Ox.GarbageCollection();
            var index = stack.indexOf(id);
            if (index == -1 || index < stack.length - 1) {
                // move the item to the end of the stack
                index > -1 && stack.splice(index, 1);
                stack.push(id);
                if (stack.length > 1) {
                    Ox.UI.elements[stack[stack.length - 2]]
                        .removeClass('OxFocus')
                        .triggerEvent('losefocus');
                }
                Ox.UI.elements[id]
                    .addClass('OxFocus')
                    .triggerEvent('gainfocus');
                Ox.Log('Core', 'focus', id, stack);
            }
        },
        /*@
        focused <f> return id of focused element, or null
            () -> <s> get id of currently focused element
        @*/
        focused: function() {
            return stack.length ? stack[stack.length - 1] : null;
        },
        /*@
        remove <f> remove
            (id) -> <u>
        @*/
        remove: function(id) {
            var index = stack.indexOf(id);
            index > -1 && stack.splice(index, 1);
        }
    };
}());
