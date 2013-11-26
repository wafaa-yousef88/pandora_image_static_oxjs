'use strict';

/*@
Ox.JQueryElement <f> Wrapper for jQuery
    $element <o> jQuery DOM Element
    ($element) -> <o> Wrapped jQuery DOM element
@*/
Ox.JQueryElement = function($element) {
    //@ id <n> Unique id
    this.oxid = Ox.uid();
    //@ $element <o> The jQuery-wrapped DOM element
    this.$element = $element.data({oxid: this.oxid});
    //@ 0 <h> The DOM element (for compatibility with jQuery)
    this[0] = this.$element[0];
    //@ length <n> 1 (for compatibility with jQuery)
    this.length = 1;
    Ox.UI.elements[this.oxid] = this;
    return this;
};

// add all jQuery methods to the prototype of Ox.JQueryElement
Ox.methods($('<div>'), true).forEach(function(method) {
    Ox.JQueryElement.prototype[method] = function() {
        var $element = this.$element[method].apply(this.$element, arguments),
            oxid;
        // if exactly one $element of an Ox object was returned, then return the
        // Ox object instead, so that we can do oxObj.jqFn().oxFn()
        return $element && $element.jquery && $element.length == 1
            && Ox.UI.elements[oxid = $element.data('oxid')]
            ? Ox.UI.elements[oxid] : $element;
    };
});
