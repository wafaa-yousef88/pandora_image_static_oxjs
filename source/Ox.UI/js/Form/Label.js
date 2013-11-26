'use strict';

/*@
Ox.Label <f> Label element
    options <o|u> Options object
    self <o|u> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Label element
@*/
Ox.Label = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            disabled: false,
            id: '',
            overlap: 'none',
            textAlign: 'left',
            style: 'rounded',
            title: '',
            width: 'auto'
        })
        .options(options || {})
        .update({
            title: function() {
                that.html(self.options.title);
            },
            width: function() {
                that.css({
                    width: self.options.width - (
                        self.options.style == 'rounded' ? 14 : 8
                    ) + 'px'
                });
            }
        })
        .addClass(
            'OxLabel Ox' + Ox.toTitleCase(self.options.style) 
            + (self.options.disabled ? ' OxDisabled' : '')
            + (
                self.options.overlap != 'none'
                ? ' OxOverlap' + Ox.toTitleCase(self.options.overlap) : ''
            )
        )
        .css(Ox.extend(self.options.width == 'auto' ? {} : {
            width: self.options.width - (
                self.options.style == 'rounded' ? 14 : 8
            ) + 'px'
        }, {
            textAlign: self.options.textAlign
        }))
        .html(self.options.title);

    return that;

};
