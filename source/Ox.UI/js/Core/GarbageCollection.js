'use strict';

/*@
Ox.GarbageCollection <f> GarbageCollection
    () -> <o> run garbage collection
    debug() -> {} output debug information
@*/

Ox.GarbageCollection = (function() {

    var that = function() {
            collect();
        },
        timeout;

    collect();

    function collect() {
        var len = Ox.len(Ox.UI.elements);
        Object.keys(Ox.UI.elements).forEach(function(id) {
            var $element = Ox.UI.elements[id];
            if ($element && Ox.isUndefined($element.$element.data('oxid'))) {
                //Chrome does not properly release resources, reset manually
                //http://code.google.com/p/chromium/issues/detail?id=31014
                $element.find('video').attr({src: ''});
                $element.remove();
                delete Ox.UI.elements[id];
            }
        });
        timeout && clearTimeout(timeout);
        timeout = setTimeout(collect, 60000);
        Ox.Log('GC', len, '-->', Ox.len(Ox.UI.elements));
    }

    /*@
    debug <f> debug info
        () -> <s>
    @*/
    that.debug = function() {
        var classNames = {}, sorted = [];
        Ox.forEach(Ox.UI.elements, function($element, id) {
            var className = $element[0].className;
            classNames[className] = (classNames[className] || 0) + 1;
        });
        Ox.forEach(classNames, function(count, className) {
            sorted.push({className: className, count: count});
        })
        return sorted.sort(function(a, b) {
            return a.count - b.count;
        }).map(function(v) {
            return v.count + ' ' + v.className
        }).join('\n');
    };

    return that;

}());
