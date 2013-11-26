'use strict';
/*@
Ox.Resizebar <f> Resizebar
    options <o> Options object
        collapsed   <b|false> Inital collapse state
        collapsible <b|true> If true, can be collapsed/expanded
        edge        <s|left> Edge
        elements    <a|[]> Elements of the bar
        orientation <s|horizontal> Orientation ('horizontal' or 'vertical')
        panel       <o|null> Panel object
        resizeable  <b|true> If true, can be resized
        resize      <a|[]> Array of sizes
        size        <n|0> Default size
        tooltip     <b|s|false> If true, display tooltip, if string, append it
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Resizebar object
@*/
Ox.Resizebar = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                collapsed: false,
                collapsible: true,
                edge: 'left',
                elements: [],
                orientation: 'horizontal',
                parent: null,
                resizable: true,
                resize: [],
                size: 0,
                tooltip: false
            })
            .options(options || {})
            .update({
                collapsed: function() {
                    that.css({cursor: getCursor()});
                    self.$tooltip && self.$tooltip.options({title: getTitle()});
                }
            })
            .addClass('OxResizebar Ox' + Ox.toTitleCase(self.options.orientation))
            .bindEvent({
                // singleclick: toggle,
                // doubleclick: reset,
                anyclick: toggle,
                dragstart: dragstart,
                drag: drag,
                dragend: dragend,
                mousedown: function() {
                    triggerEvents('resizestart');
                },
                mouseup: function() {
                    triggerEvents('resizeend');
                }
            })
            .append($('<div>').addClass('OxSpace'))
            .append($('<div>').addClass('OxLine'))
            .append($('<div>').addClass('OxSpace'));

    if (self.options.tooltip) {
        // FIXME: Use Ox.Element's tooltip
        self.$tooltip = Ox.Tooltip({title: getTitle()});
        that.on({
            mouseenter: self.$tooltip.show,
            mouseleave: self.$tooltip.hide
        });
    }

    Ox.extend(self, {
        clientXY: self.options.orientation == 'horizontal' ? 'clientY' : 'clientX',
        dimensions: Ox.UI.DIMENSIONS[self.options.orientation], // fixme: should orientation be the opposite orientation here?
        edges: Ox.UI.EDGES[self.options.orientation],
        isLeftOrTop: self.options.edge == 'left' || self.options.edge == 'top'
    });

    that.css({cursor: getCursor()});

    function dragstart(data) {
        if (self.options.resizable && !self.options.collapsed) {
            Ox.$body.addClass('OxDragging');
            self.drag = {
                startPos: data[self.clientXY],
                startSize: self.options.size
            }
        }
    }

    function drag(data) {
        if (self.options.resizable && !self.options.collapsed) {
            var d = data[self.clientXY] - self.drag.startPos,
                size = self.options.size;
            self.options.size = Ox.limit(
                self.drag.startSize + d * (self.isLeftOrTop ? 1 : -1),
                self.options.resize[0],
                self.options.resize[self.options.resize.length - 1]
            );
            Ox.forEach(self.options.resize, function(v) {
                if (self.options.size >= v - 8 && self.options.size <= v + 8) {
                    self.options.size = v;
                    return false; // break
                }
            });
            if (self.options.size != size) {
                that.css(self.edges[self.isLeftOrTop ? 2 : 3], self.options.size + 'px');
                // fixme: send {size: x}, not x
                if (self.isLeftOrTop) {
                    self.options.elements[0]
                        .css(self.dimensions[1], self.options.size + 'px');
                    self.options.elements[1]
                        .css(self.edges[2], (self.options.size + 1) + 'px');
                } else {
                    self.options.elements[0]
                        .css(self.edges[3], (self.options.size + 1) + 'px');
                    self.options.elements[1]
                        .css(self.dimensions[1], self.options.size + 'px');
                }
                triggerEvents('resize');
                self.options.parent.updateSize(self.isLeftOrTop ? 0 : 1, self.options.size); // fixme: listen to event instead?
            }
        }
    }

    function dragend() {
        if (self.options.resizable && !self.options.collapsed) {
            Ox.$body.removeClass('OxDragging');
            self.options.size != self.drag.startSize && triggerEvents('resizeend');
        }
    }

    function getCursor() {
        var cursor = '';
        if (self.options.collapsed) {
            cursor = self.options.orientation == 'horizontal'
                ? (self.isLeftOrTop ? 's' : 'n')
                : (self.isLeftOrTop ? 'e' : 'w');
        } else {
            if (self.options.resizable) {
                cursor = self.options.orientation == 'horizontal'
                    ? 'ns' : 'ew';
            } else if (self.options.collapsible) {
                cursor = self.options.orientation == 'horizontal'
                    ? (self.isLeftOrTop ? 'n' : 's')
                    : (self.isLeftOrTop ? 'w' : 'e');
            }
        }
        return cursor + '-resize';
    }

    function getTitle() {
        var title = '';
        if (self.options.collapsed) {
            title = Ox._('Click to show');
        } else {
            if (self.options.resizable) {
                title = Ox._('Drag to resize');
            }
            if (self.options.collapsible) {
                title = Ox._((title ? title + ' or c' : 'C') + 'lick to hide');
            }
        }
        if (title && Ox.isString(self.options.tooltip)) {
            title += ' ' + self.options.tooltip;
        }
        return title;
    }

    function reset() {
        if (self.options.resizable && !self.options.collapsed) {
            // fixme: silly, pass an option
            self.options.parent.reset(
                self.isLeftOrTop ? 0
                : self.options.parent.options('elements').length - 1
            );
        }
    }

    function toggle() {
        if (self.options.collapsible) {
            // fixme: silly, pass an option
            self.options.parent.toggle(
                self.isLeftOrTop ? 0
                : self.options.parent.options('elements').length - 1
            );
            self.options.collapsed = !self.options.collapsed;
            that.css({cursor: getCursor()});
            self.$tooltip && self.$tooltip.hide(function() {
                self.$tooltip.options({title: getTitle()});
            });
        }
    }

    function triggerEvents(event) {
        self.options.elements[0].triggerEvent(event, {
            size: self.isLeftOrTop
                ? self.options.size
                : self.options.elements[0][self.dimensions[1]]()
        });
        self.options.elements[1].triggerEvent(event, {
            size: self.isLeftOrTop
                ? self.options.elements[1][self.dimensions[1]]()
                : self.options.size
        });
    }

    return that;

};
