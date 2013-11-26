'use strict';
/*@
Ox.Bar <f> Bar
    options <o> Options object
        orientation <s|'horizontal'> Orientation ('horizontal' or 'vertical')
        size        <n|s|'medium'> can be 'small', 'medium', 'large' or number
    self    <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Bar object
@*/
Ox.Bar = function(options, self) {
    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                orientation: 'horizontal',
                size: 'medium'
            })
            .options(options || {})
            .addClass('OxBar Ox' + Ox.toTitleCase(self.options.orientation)),
        dimensions = Ox.UI.DIMENSIONS[self.options.orientation];
    self.options.size = Ox.isString(self.options.size)
        ? Ox.UI.getBarSize(self.options.size) : self.options.size;
    that.css(dimensions[0], '100%')
        .css(dimensions[1], self.options.size + 'px');
    return that;
};
