'use strict';

/*@
Ox.SplitPanel <f> SpliPanel Object
    options <o> Options object
        elements <[o]|[]> Array of two or three element objects
            collapsible <b|false> If true, can be collapsed (if outer element)
            collapsed <b|false> If true, is collapsed (if collapsible)
            element <o> Any Ox.Element
                If any element is collapsible or resizable, all elements must
                have an id.
            resizable <b|false> If true, can be resized (if outer element)
            resize <[n]|[]> Min size, optional snappy points, and max size
            size <n|s|"auto"> Size in px (one element must be "auto")
            tooltip <b|s|false> If true, show tooltip, if string, append it
        orientation <s|"horizontal"> orientation ("horizontal" or "vertical")
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> SpliPanel Object
        resize <!> resize
            Fires on resize, on both elements being resized
        toggle <!> toggle
            Fires on collapse or expand, on the element being toggled
@*/

Ox.SplitPanel = function(options, self) {

    // fixme: doubleclick on resizebar should reset to initial size

    self = self || {};
    var that = Ox.Element({}, self) // fixme: Container?
            .defaults({
                elements: [],
                orientation: 'horizontal'
            })
            .options(options || {})
            .addClass('OxSplitPanel');

    Ox.extend(self, {
        dimensions: Ox.UI.DIMENSIONS[self.options.orientation],
        edges: Ox.UI.EDGES[self.options.orientation],
        defaultSize: self.options.elements.map(function(element) {
            return !Ox.isUndefined(element.defaultSize)
                ? element.defaultSize : element.size;
        }),
        length: self.options.elements.length,
        resizebarElements: [],
        $resizebars: []
    });

    // create elements
    that.$elements = [];
    self.options.elements.forEach(function(element, i) {
        self.options.elements[i] = Ox.extend({
            collapsible: false,
            collapsed: false,
            resizable: false,
            resize: [],
            size: 'auto'
        }, element);
        that.$elements[i] = element.element
            .css(self.edges[2], (parseInt(element.element.css(self.edges[2]), 10) || 0) + 'px')
            .css(self.edges[3], (parseInt(element.element.css(self.edges[3]), 10) || 0) + 'px');
    });

    // create resizebars
    self.options.elements.forEach(function(element, i) {
        var index = i == 0 ? 0 : 1;
        that.$elements[i].appendTo(that.$element); // fixme: that.$content
        if (element.collapsible || element.resizable) {
            self.resizebarElements[index] = i < 2 ? [0, 1] : [1, 2];
            self.$resizebars[index] = Ox.Resizebar({
                collapsed: element.collapsed,
                collapsible: element.collapsible,
                edge: self.edges[index],
                elements: [
                    that.$elements[self.resizebarElements[index][0]],
                    that.$elements[self.resizebarElements[index][1]]
                ],
                id: element.element.options('id'),
                orientation: self.options.orientation == 'horizontal' ? 'vertical' : 'horizontal',
                parent: that, // fixme: that.$content
                resizable: element.resizable,
                resize: element.resize,
                size: element.size,
                tooltip: element.tooltip
            });
            self.$resizebars[index][i == 0 ? 'insertAfter' : 'insertBefore'](that.$elements[i]);
        }
    });

    self.options.elements.forEach(function(element, i) {
        element.collapsed && that.css(
            self.edges[i == 0 ? 0 : 1], -self.options.elements[i].size + 'px'
        );
    });

    setSizes(true);

    function getPositionById(id) {
        var position = -1;
        Ox.forEach(self.options.elements, function(element, i) {
            if (element.element.options('id') == id) {
                position = i;
                return false; // break
            }
        });
        return position;
    }

    function getSize(element) {
        return element.size + (element.collapsible || element.resizable);
        //return (element.size + (element.collapsible || element.resizable)) * !element.collapsed;
    }

    function getVisibleSize(element) {
        return getSize(element) * !element.collapsed;
    }

    function setSizes(init, animate) {
        // will animate if animate is truthy and call animate if it's a function
        self.options.elements.forEach(function(element, i) {
            // fixme: maybe we can add a conditional here, since init
            // is about elements that are collapsed splitpanels
            var css = {},
                edges = [
                    (init && parseInt(that.$elements[i].css(self.edges[0]), 10)) || 0,
                    (init && parseInt(that.$elements[i].css(self.edges[1]), 10)) || 0
                ];
            if (element.size != 'auto') {
                css[self.dimensions[0]] = element.size + 'px';
            }
            if (i == 0) {
                css[self.edges[0]] = edges[0] + 'px';
                if (element.size == 'auto') {
                    css[self.edges[1]] = getSize(self.options.elements[1])
                    + (
                        self.length == 3 ? getVisibleSize(self.options.elements[2]) : 0
                    ) + 'px';
                }
            } else if (i == 1) {
                if (self.options.elements[0].size != 'auto') {
                    css[self.edges[0]] = edges[0] + getSize(self.options.elements[0]) + 'px'
                } else {
                    css[self.edges[0]] = 'auto'; // fixme: why is this needed?
                }
                css[self.edges[1]] = (
                    self.length == 3 ? getSize(self.options.elements[2]) : 0
                ) + 'px';
            } else {
                if (element.size == 'auto') {
                    css[self.edges[0]] = getVisibleSize(self.options.elements[0])
                        + getSize(self.options.elements[1]) + 'px';
                } else {
                    css[self.edges[0]] = 'auto'; // fixme: why is this needed?
                }
                css[self.edges[1]] = edges[1] + 'px';
            }
            if (animate) {
                that.$elements[i].animate(css, 250, function() {
                    i == 0 && Ox.isFunction(animate) && animate();
                });
            } else {
                that.$elements[i].css(css);
            }
            if (element.collapsible || element.resizable) {
                css = {};
                css[self.edges[i == 0 ? 0 : 1]] = element.size + 'px'
                if (animate) {
                    self.$resizebars[i == 0 ? 0 : 1].animate(css, 250);
                } else {
                    self.$resizebars[i == 0 ? 0 : 1].css(css);
                }
                self.$resizebars[i == 0 ? 0 : 1].options({size: element.size});
            }
        });
    }

    /*@
    getSize <f> get size of panel
        (id) -> <i> id or position of panel, returns size
        id <s|i> The element's id or position
    @*/
    // fixme: what is this? there is that.size()
    that.getSize = function(id) {
        var pos = Ox.isNumber(id) ? id : getPositionById(id),
            element = self.options.elements[pos];
        return element.element[self.dimensions[0]]() * !that.isCollapsed(pos);
    };

    /*@
    isCollapsed <f> panel collapsed state
        (id) -> <b> id or position of panel, returns collapsed state
        id <i> The element's id or position
    @*/
    that.isCollapsed = function(id) {
        var pos = Ox.isNumber(id) ? id : getPositionById(id);
        return self.options.elements[pos].collapsed;
    };

    /*@
    replaceElement <f> Replace panel element
        (id, element) -> <f> replace element
        id <s|n> The element's id or position
        element <o> new element
    @*/
    that.replaceElement = function(id, element) {
        // one can pass pos instead of id
        var pos = Ox.isNumber(id) ? id : getPositionById(id);
        that.$elements[pos] = element
            .css(self.edges[2], (parseInt(element.css(self.edges[2]), 10) || 0) + 'px')
            .css(self.edges[3], (parseInt(element.css(self.edges[3]), 10) || 0) + 'px');
        self.options.elements[pos].element.replaceWith(
            self.options.elements[pos].element = element
        );
        setSizes();
        self.$resizebars.forEach(function($resizebar, i) {
            $resizebar.options({
                elements: [
                    that.$elements[self.resizebarElements[i][0]],
                    that.$elements[self.resizebarElements[i][1]]
                ]
            });
        });
        return that;
    };

    /*@
    replaceElements <f> replace panel elements
        (elements) -> <f> replace elements
        elements <a> array of new elements
    @*/
    that.replaceElements = function(elements) {
        elements.forEach(function(element, i) {
            if (Ox.isNumber(element.size)) {
                that.size(i, element.size);
                if (element.collapsible || element.resizable) {
                    self.$resizebars[i == 0 ? 0 : 1].options({
                        collapsible: element.collapsible,
                        resizable: element.resizable,
                        size: element.size
                    });
                }
            }
            that.replace(i, element.element);
        });
        self.options.elements = elements;
        self.$resizebars.forEach(function($resizebar, i) {
            $resizebar.options({
                elements: [
                    that.$elements[self.resizebarElements[i][0]],
                    that.$elements[self.resizebarElements[i][1]]
                ]
            });
        });
        return that;
    };

    /*@
    reset <f> Reset an outer element to its initial size
    @*/
    that.reset = function(id) {
        // one can pass pos instead of id
        var pos = Ox.isNumber(id) ? id : getPositionById(id),
            element = self.options.elements[pos];
        element.size = self.defaultSize[pos];
        setSizes(false, function() {
            element.element.triggerEvent('resize', {
                size: element.size
            });
            element = self.options.elements[pos == 0 ? 1 : pos - 1];
            element.element.triggerEvent('resize', {
                size: element.element[self.dimensions[0]]()
            });
        });
    };

    /*@
    size <f> Get or set size of an element
        (id) -> <i> Returns size
        (id, size) -> <o> Sets size, returns SplitPanel
        (id, size, callback) -> <o> Sets size with animation, returns SplitPanel
        id <i> The element's id or position
        size <i> New size, in px
        callback <b|f> Callback function (passing true animates w/o callback)
    @*/
    that.size = function(id, size, callback) {
        // one can pass pos instead of id
        var pos = Ox.isNumber(id) ? id : getPositionById(id),
            element = self.options.elements[pos],
            animate = {};
        if (arguments.length == 1) {
            return element.element[self.dimensions[0]]() * !that.isCollapsed(pos);
        } else {
            element.size = size;
            setSizes(false, callback);
            return that;
        }
    };

    /*@
    toggle <f> Toggles collapsed state of an outer element
        (id) -> <o> The SplitPanel
        id <s|i> The element's id or position
    @*/
    // FIXME: isn't 'toggle' reserved by jQuery?
    that.toggle = function(id) {
        // one can pass pos instead of id
        if (self.toggling) {
            return false;
        }
        var pos = Ox.isNumber(id) ? id : getPositionById(id),
            element = self.options.elements[pos],
            value = parseInt(that.css(self.edges[pos == 0 ? 0 : 1]), 10)
                + element.element[self.dimensions[0]]() * (element.collapsed ? 1 : -1),
            animate = {};
        self.toggling = true;
        animate[self.edges[pos == 0 ? 0 : 1]] = value;
        that.animate(animate, 250, function() {
            element.collapsed = !element.collapsed;
            element.element.triggerEvent('toggle', {
                collapsed: element.collapsed
            });
            self.$resizebars[pos == 0 ? 0 : 1].options({collapsed: element.collapsed});
            element = self.options.elements[pos == 0 ? 1 : pos - 1];
            element.element.triggerEvent('resize', {
                size: element.element[self.dimensions[0]]()
            });
            self.toggling = false;
        });
    };

    /*@
    updateSize <f> update size of element
        (pos, size) -> <o> update size of element
        pos <i> position of element
        size <n> new size
    @*/
    that.updateSize = function(pos, size) {
        // this is called from resizebar
        pos = pos == 0 ? 0 : self.options.elements.length - 1; // fixme: silly that 0 or 1 is passed, and not pos
        self.options.elements[pos].size = size;
    };

    return that;

};
