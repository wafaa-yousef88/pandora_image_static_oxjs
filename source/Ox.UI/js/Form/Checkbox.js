'use strict';

/*@
Ox.Checkbox <f> Checkbox Element
    options <o> Options object
        disabled <b> if true, checkbox is disabled
        group <b> if true, checkbox is part of a group
        label <s> Label (on the left side)
        labelWidth <n|64> Label width
        title <s> Title (on the right side)
        value <b> if true, checkbox is checked
        width <n> width in px
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Checkbox Element
        change <!> triggered when value changes
@*/

Ox.Checkbox = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                disabled: false,
                group: false,
                label: '',
                labelWidth: 64,
                overlap: 'none',
                title: '',
                value: false,
                width: options && (options.label || options.title) ? 'auto' : 16
            })
            .options(options || {})
            .update({
                disabled: function() {
                    var disabled = self.options.disabled;
                    that.attr({disabled: disabled});
                    self.$button.options({disabled: disabled});
                    self.$title && self.$title.options({disabled: disabled});
                },
                title: function() {
                    self.$title.options({title: self.options.title});
                },
                value: function() {
                    self.$button.toggle();
                },
                width: function() {
                    that.css({width: self.options.width + 'px'});
                    self.$title && self.$title.options({width: getTitleWidth()});
                }
            })
            .addClass('OxCheckbox' + (
                self.options.overlap == 'none'
                ? '' : ' OxOverlap' + Ox.toTitleCase(self.options.overlap)
            ))
            .attr({
                disabled: self.options.disabled
            })
            .css(self.options.width != 'auto' ? {
                width: self.options.width
            } : {});

    if (self.options.title) {
        self.options.width != 'auto' && that.css({
            width: self.options.width + 'px'
        });
        self.$title = Ox.Label({
                disabled: self.options.disabled,
                id: self.options.id + 'Label',
                overlap: 'left',
                title: self.options.title,
                width: getTitleWidth()
            })
            .css({float: 'right'})
            .click(clickTitle)
            .appendTo(that);
    }

    if (self.options.label) {
        self.$label = Ox.Label({
                overlap: 'right',
                textAlign: 'right',
                title: self.options.label,
                width: self.options.labelWidth
            })
            .css({float: 'left'})
            .appendTo(that);
    }

    self.$button = Ox.Button({
            disabled: self.options.disabled,
            id: self.options.id + 'Button',
            type: 'image',
            value: self.options.value ? 'check' : 'none',
            values: ['none', 'check']
        })
        .addClass('OxCheckbox')
        .bindEvent({
            change: clickButton
        })
        .appendTo(that);

    function clickButton() {
        self.options.value = !self.options.value;
        that.triggerEvent('change', {
            value: self.options.value
        });
    }

    function clickTitle() {
        !self.options.disabled && self.$button.trigger('click');
    }

    function getTitleWidth() {
        return self.options.width - 16
            - !!self.options.label * self.options.labelWidth;
    }

    return that;

};
