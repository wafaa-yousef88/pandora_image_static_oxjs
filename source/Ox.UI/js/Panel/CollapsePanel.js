'use strict';

/*@
Ox.CollapsePanel <f> CollapsePanel Object
    options <o> Options object
        collapsed <b|false> collapsed state
        extras <a|[]> panel extras
        size <n|16> size
        title <s> title
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> CollapsePanel Object
        toggle <!> toggle
@*/

Ox.CollapsePanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                animate: true,
                collapsed: false,
                extras: [],
                size: 16,
                title: ''
            })
            .options(options)
            .update({
                collapsed: function() {
                    // will be toggled again in toggleCollapsed
                    self.options.collapsed = !self.options.collapsed;
                    toggleCollapsed();
                },
                title: function() {
                    self.$title.html(self.options.title);
                }
            })
            .addClass('OxPanel OxCollapsePanel')
            .bindEvent({
                key_left: function() {
                    !self.options.collapsed && toggleCollapsed();
                },
                key_right: function() {
                    self.options.collapsed && toggleCollapsed();
                }
            });

    self.$titlebar = Ox.Bar({
            orientation: 'horizontal',
            size: self.options.size
        })
        .bindEvent({
            anyclick: clickTitlebar,
            doubleclick: doubleclickTitlebar
        })
        .appendTo(that);

    self.$button = Ox.Button({
            style: 'symbol',
            type: 'image',
            value: self.options.collapsed ? 'expand' : 'collapse',
            values: [
                {id: 'expand', title: 'right'},
                {id: 'collapse', title: 'down'}
            ]
        })
        .bindEvent({
            click: function() {
                that.gainFocus();
                toggleCollapsed(true);
            }
        })
        .appendTo(self.$titlebar);

    self.$title = Ox.Element()
        .addClass('OxTitle')
        .html(self.options.title)
        .appendTo(self.$titlebar);

    if (self.options.extras.length) {
        self.$extras = Ox.Element()
            .addClass('OxExtras')
            .css({width: self.options.extras.length * 16 + 'px'})
            .appendTo(self.$titlebar);
        self.options.extras.forEach(function($extra) {
            $extra.appendTo(self.$extras);
        });
    }

    that.$content = Ox.Element()
        .addClass('OxContent')
        .appendTo(that);
    // fixme: doesn't work, content still empty
    // need to hide it if collapsed
    if (self.options.collapsed) {
        that.$content.css({
            marginTop: -that.$content.height() + 'px'
        }).hide();
    }

    function clickTitlebar(e) {
        if (!$(e.target).hasClass('OxButton')) {
            that.gainFocus();
        }
    }

    function doubleclickTitlebar(e) {
        if (!$(e.target).hasClass('OxButton')) {
            self.$button.trigger('click');
        }
    }

    function toggleCollapsed(fromButton) {
        // show/hide is needed in case the collapsed content
        // grows vertically when shrinking the panel horizontally
        var marginTop;
        self.options.collapsed = !self.options.collapsed;
        marginTop = self.options.collapsed ? -that.$content.height() : 0;
        !fromButton && self.$button.toggle();
        !self.options.collapsed && that.$content.css({
            marginTop: -that.$content.height() + 'px'
        }).show();
        if (self.options.animate) {
            that.$content.animate({
                marginTop: marginTop + 'px'
            }, 250, function() {
                self.options.collapsed && that.$content.hide();
            });
        } else {
            that.$content.css({
                marginTop: marginTop + 'px'
            });
            self.options.collapsed && that.$content.hide();
        }
        that.triggerEvent('toggle', {
            collapsed: self.options.collapsed
        });
    }

    /*@
    update <f> Update panel when in collapsed state
    @*/
    that.updatePanel = function() {
        self.options.collapsed && that.$content.css({
            marginTop: -that.$content.height()
        });
    };

    return that;

};
