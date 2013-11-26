'use strict';

/*@
Ox.LoadingScreen <f> Simple loading screen
@*/

Ox.LoadingScreen = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            height: 0,
            size: 32,
            text: '',
            width: 0
        })
        .options(options || {})
        .update({
            height: function() {
                !self.isAuto && setSizes();
            },
            text: function() {
                self.$text && self.$text.html(self.options.text);
            },
            width: function() {
                !self.isAuto && setSizes();
            }
        })
        .addClass('OxLoadingScreen');

    self.isAuto = !self.options.width && !self.options.height;
    self.isAuto && that.addClass('OxAuto')

    self.$box = $('<div>').appendTo(that);

    setSizes();

    $('<img>')
        .attr({src: Ox.UI.getImageURL('symbolLoadingAnimated')})
        .css({
            width: self.options.size + 'px',
            height: self.options.size + 'px'
        })
        .appendTo(self.$box);

    if (self.options.text) {
        self.$text = $('<div>')
            .html(self.options.text)
            .appendTo(self.$box);
    }

    function setSizes() {
        var css = {
            width: (self.options.text ? 256 : self.options.size),
            height: self.options.size + (self.options.text ? 24 : 0)
        };
        if (!self.isAuto) {
            css.left = Math.floor((self.options.width - css.width) / 2);
            css.top = Math.floor((self.options.height - css.height) / 2);
            that.css({
                width: self.options.width + 'px',
                height: self.options.height + 'px'
            });
        }
        css = Ox.map(css, function(value) {
            return value + 'px';
        });
        self.$box.css(css);
    }

    return that;

};