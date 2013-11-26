'use strict';

/*@
Ox.InfoList <f> Info List
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.List> Info List
@*/
Ox.InfoList = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            borderRadius: 0,
            defaultRatio: 1,
            draggable: false,
            id: '',
            item: null,
            items: null,
            keys: [],
            max: -1,
            min: 0,
            query: {conditions: [], operator: '&'},
            selectAsYouType: '',
            selected: [],
            size: 192,
            sort: [],
            sums: [],
            unique: ''
        })
        .options(options || {})
        .update({
            items: function() {
                that.$element.options({items: self.options.items});
            },
            query: function() {
                that.$element.options({query: self.options.query});
            },
            selected: function() {
                that.$element.options({selected: self.options.selected});
            },
            sort: function() {
                updateKeys();
                that.$element.options({sort: self.options.sort});
            },
            width: function() {
                var width = getItemWidth();
                $('.OxInfoElement').each(function() {
                    var $parent = $(this).parent(),
                        id = parseInt(/OxId(.*?)$/.exec(this.className)[1], 10);
                    $parent.css({width: width - 144});
                    $parent.parent().css({width: width - 144});
                    $parent.parent().parent().css({width: width - 8});
                    Ox.UI.elements[id].options({width: width - 152});
                });
            }
        });

    self.iconSize = Math.round(self.options.size * 2/3);
    self.itemHeight = self.options.size;

    that.setElement(
        Ox.List({
            construct: constructItem,
            draggable: self.options.draggable,
            id: self.options.id,
            itemHeight: self.itemHeight,
            items: self.options.items,
            itemWidth: getItemWidth(),
            keys: self.options.keys,
            max: self.options.max,
            min: self.options.min,
            orientation: 'vertical',
            pageLength: 10,
            query: self.options.query,
            selectAsYouType: self.options.selectAsYouType,
            selected: self.options.selected,
            sort: self.options.sort,
            sums: self.options.sums,
            type: 'info',
            unique: self.options.unique
        })
        .addClass('OxInfoList')
        .bindEvent(function(data, event) {
            if (event == 'select') {
                self.options.selected = data.ids;
            }
            that.triggerEvent(event, data);
        })
    );

    updateKeys();

    function constructItem(data) {
        var isEmpty = Ox.isEmpty(data),
            data = !isEmpty
                ? self.options.item(data, self.options.sort, self.options.size)
                : {
                    icon: {
                        width: Math.round(self.iconSize * (
                            self.options.defaultRatio >= 1 ? 1 : self.options.defaultRatio
                        )),
                        height: Math.round(self.iconSize / (
                            self.options.defaultRatio <= 1 ? 1 : self.options.defaultRatio
                        ))
                    },
                    info: {}
                },
            $icon = Ox.Element()
                .css({
                    float: 'left',
                    width: '132px',
                    height: '192px',
                    margin: '2px'
                })
                .append(
                    Ox.IconItem(Ox.extend(data.icon, {
                            borderRadius: self.options.borderRadius,
                            iconHeight: self.iconSize,
                            iconWidth: self.iconSize,
                            imageHeight: data.icon.height,
                            imageWidth: data.icon.width,
                            itemHeight: self.itemHeight,
                            itemWidth: 128
                        }))
                        .addClass('OxInfoIcon')
                        .css({
                            position: 'absolute'
                        })
                ),
            $info = Ox.Element()
                .css({
                    float: 'left',
                    width: getItemWidth() - 144 + 'px',
                    height: 196 + 'px'
                }),
            $infobox = Ox.Element()
                .css({
                    position: 'absolute',
                    width: getItemWidth() - 144 + 'px',
                    height: 196 + 'px',
                    marginTop: '-2px',
                    overflow: 'hidden'
                })
                .appendTo($info),
            $item = Ox.Element()
                .css({
                    width: getItemWidth() - 8 + 'px',
                    height: 196 + 'px',
                    margin: '4px'
                })
                .append($icon)
                .append($info);
        if (!isEmpty) {
            var $element = data.info.element(Ox.extend(data.info.options, {
                    width: getItemWidth() - 152
                }))
                .addClass('OxInfoElement');
            data.info.css && $element.css(data.info.css);
            data.info.events && $element.bindEvent(data.info.events);
            $element.addClass('OxId' + $element.oxid); // fixme: needed?
            $infobox.append($element);
        }
        return $item;
    }

    function getItemWidth(cached) {
        if (!cached) {
            self.cachedWidth = that.$element.width() - Ox.UI.SCROLLBAR_SIZE;
        } else if (!self.cachedWidth || self.cachedWidthTime < +new Date() - 5000) {
            self.cachedWidth = that.$element.width() - Ox.UI.SCROLLBAR_SIZE;
            self.cachedWidthTime = +new Date();
        }
        return self.cachedWidth;
    }

    function updateKeys() {
        that.$element.options({
            keys: Ox.unique(
                [self.options.sort[0].key].concat(self.options.keys)
            )
        });
    }

    /*@
    closePreview <f> closePreview
    @*/
    that.closePreview = function() {
        that.$element.closePreview();
        return that;
    };

    /*@
    gainFocus <f> gainFocus
    @*/
    that.gainFocus = function() {
        that.$element.gainFocus();
        return that;
    };

    /*@
    hasFocus <f> hasFocus
    @*/
    that.hasFocus = function() {
        return that.$element.hasFocus();
    };

    that.invertSelection = function() {
        that.$element.invertSelection();
        return that;
    };

    /*@
    loseFocus <f> loseFocus
    @*/
    that.loseFocus = function() {
        that.$element.loseFocus();
        return that;
    };

    /*@
    reloadList <f> reloadList
    @*/
    that.reloadList = function(stayAtPosition) {
        that.$element.reloadList(stayAtPosition);
        return that;
    };

    /*@
    scrollToSelection <f> scrollToSelection
    @*/
    that.scrollToSelection = function() {
        that.$element.scrollToSelection();
        return that;
    };

    that.selectAll = function() {
        that.$element.selectAll();
        return that;
    };

    /*@
    size <f> size
    @*/
    that.size = function() {
        that.$element.size();
        return that;
    };

    /*@
    sortList <f> sortList
        (key, operator) -> <o>
    @*/
    that.sortList = function(key, operator) {
        self.options.sort = [{
            key: key,
            operator: operator
        }];
        updateKeys();
        that.$element.sortList(key, operator);
        return that;
    };

    /*@
    value <f> value
        (id)             -> values
        (id, key)        -> value
        (id, key, value) -> <o>
    @*/
    that.value = function(id, key, value) {
        // fixme: make this accept id, {k: v, ...}
        if (arguments.length == 1) {
            return that.$element.value(id);
        } else if (arguments.length == 2) {
            return that.$element.value(id, key);
        } else {
            that.$element.value(id, key, value);
            return that;
        }
    };

    return that;

};
