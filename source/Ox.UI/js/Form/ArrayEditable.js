'use strict';

/*@
Ox.ArrayEditable <f> Array Editable
    options <o> Options object
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Array Editable
        add <!> add
        blur <!> blur
        change <!> change
        delete <!> delete
        edit <!> edit
        insert <!> insert
        open <!> open
        selectnext <!> selectnext
        selectprevious <!> selectprevious
        selectnone <!> selectnone
        select <!> select
        submit <!> submit
@*/

Ox.ArrayEditable = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            clickLink: null,
            editable: true,
            getSortValue: null,
            highlight: '',
            itemName: 'item',
            items: [],
            maxHeight: void 0,
            placeholder: '',
            position: -1,
            selected: '',
            separator: ',',
            sort: [],
            submitOnBlur: true,
            tooltipText: '',
            type: 'input',
            width: 256
        })
        .options(options || {})
        .update({
            highlight: function() {
                self.$items.forEach(function($item) {
                    $item.options({highlight: self.options.highlight})
                });
            },
            items: function() {
                if (self.options.selected && getSelectedPosition() == -1) {
                    selectNone();
                }
                renderItems(true);
            },
            placeholder: function() {
                if (self.options.items.length == 0) {
                    self.$items[0]
                        .options({value: self.options.placeholder})
                        .addClass('OxPlaceholder');
                }
            },
            selected: function() {
                selectItem(self.options.selected);
            },
            sort: renderItems,
            width: function() {
                var width = self.options.width;
                that.css({width: width - 8 + 'px'}); // 2 x 4 px padding
                self.options.type == 'textarea' && self.$items.forEach(function($item) {
                    $item.options({width: width})
                });
            }
        })
        .addClass('OxArrayEditable OxArrayEditable' + Ox.toTitleCase(self.options.type))
        .css({width: self.options.width - (self.options.type == 'input' ? 8 : 0) + 'px'}) // 2 x 4 px padding
        .bindEvent({
            key_delete: deleteItem,
            key_enter: function() {
                // make sure the newline does
                // not end up in the textarea
                setTimeout(function() {
                    that.editItem();                    
                }, 0);
            },
            key_escape: selectNone,
            key_down: self.options.type == 'input' ? selectLast : selectNext,
            key_left: self.options.type == 'input' ? selectPrevious : selectFirst,
            key_right: self.options.type == 'input' ? selectNext : selectLast,
            key_up: self.options.type == 'input' ? selectFirst : selectPrevious,
            singleclick: singleclick
        });

    self.$items = [];
    self.editing = false;

    renderItems();

    self.selected = getSelectedPosition();

    function deleteItem() {
        if (self.options.editable) {
            self.options.items.splice(self.selected, 1);
            renderItems();
            that.triggerEvent('delete', {
                id: self.options.selected
            });
            self.editing = false;
            self.selected = -1;
            self.options.selected = '';
        }
    }

    function doubleclick(e) {
        // fixme: unused
        var $target = $(e.target),
            $parent = $target.parent();
        if ($parent.is('.OxEditableElement')) {
            that.editItem();
        } else if (!$target.is('.OxInput')) {
            that.triggerEvent('add');
        }
    }

    function getSelectedId() {
        return self.selected > -1 ? self.options.items[self.selected].id : '';
    }

    function getSelectedPosition() {
        return Ox.getIndexById(self.options.items, self.options.selected);
    }

    function renderItems(blur) {
        if (self.editing) {
            self.options.items[getSelectedPosition()].value = that.find(self.options.type + ':visible').val();
        }
        that.empty();
        if (self.options.items.length == 0) {
            self.$items[0] = Ox.Editable({
                editable: false,
                type: self.options.type,
                value: self.options.placeholder
            })
            .addClass('OxPlaceholder')
            .appendTo(that);
        } else {
            sortItems();
            self.options.items.forEach(function(item, i) {
                if (i && self.options.type == 'input') {
                    $('<span>')
                        .addClass('OxSeparator')
                        .html(self.options.separator + ' ')
                        .appendTo(that);
                }
                self.$items[i] = Ox.Editable({
                        blurred: self.editing && i == self.selected ? blur : false,
                        clickLink: self.options.clickLink,
                        editable: self.options.editable && item.editable,
                        editing: self.editing && i == self.selected,
                        /*
                        format: function(value) {
                            return value || '&nbsp;'
                        },
                        */
                        highlight: self.options.highlight,
                        maxHeight: self.options.maxHeight,
                        submitOnBlur: self.options.submitOnBlur,
                        tooltip: (
                            self.options.tooltipText
                                ? self.options.tooltipText(item) + '<br>'
                                : ''
                        ) + (
                            self.options.editable
                                ? Ox._('Click to select') + (
                                    item.editable ? Ox._(', doubleclick to edit') : ''
                                )
                                : ''
                        ),
                        type: self.options.type,
                        value: item.value,
                        width: self.options.type == 'input' ? 0 : self.options.width - 9
                    })
                    .addClass(item.id == self.options.selected ? 'OxSelected' : '')
                    //.css(self.options.type == 'textarea' ? {padding: '4px'} : {})
                    .data({id: item.id, position: i})
                    .bindEvent({
                        blur: function(data) {
                            // fixme: remove data
                            that.gainFocus();
                            that.triggerEvent('blur', {
                                id: item.id,
                                value: data.value
                            });
                            self.blurred = true;
                            setTimeout(function() {
                                self.blurred = false;
                            }, 250);
                        },
                        cancel: function(data) {
                            self.editing = false;
                            that.gainFocus();
                            data.value === ''
                                ? submitItem(i, '')
                                : that.triggerEvent('blur', data);
                        },
                        change: function(data) {
                            that.triggerEvent('change', {
                                id: item.id,
                                value: data.value
                            });
                        },
                        edit: function() {
                            if (item.id != self.options.selected) {
                                selectItem(item.id);
                            }
                            self.editing = true;
                            that.triggerEvent('edit');
                        },
                        insert: function(data) {
                            that.triggerEvent('insert', data);
                        },
                        open: function(data) {
                            that.triggerEvent('open');
                        },
                        submit: function(data) {
                            self.editing = false;
                            that.gainFocus();
                            submitItem(i, data.value);
                        }
                    })
                    .appendTo(that);
            });
        }
        //self.editing && that.editItem(blur);
    }

    function selectFirst() {
        if (self.selected > -1) {
            self.selected > 0
                ? selectItem(0)
                : that.triggerEvent('selectprevious');
        }
    }

    function selectItem(idOrPosition) {
        if (Ox.isString(idOrPosition)) {
            self.options.selected = idOrPosition;
            self.selected = getSelectedPosition();
        } else {
            self.selected = idOrPosition;
            self.options.selected = getSelectedId();
        }
        if (/*self.options.selected == '' && */self.editing) {
            self.editing = false;
            that.blurItem();
        }
        that.find('.OxSelected').removeClass('OxSelected');
        self.selected > -1 && self.$items[self.selected].addClass('OxSelected');
        triggerSelectEvent();
    }

    function selectLast() {
        if (self.selected > -1) {
            self.selected < self.options.items.length - 1
                ? selectItem(self.options.items.length - 1)
                : that.triggerEvent('selectnext');
        }
    }

    function selectNext() {
        if (self.selected > -1) {
            self.selected < self.options.items.length - 1
                ? selectItem(self.selected + 1)
                : that.triggerEvent('selectnext');
        }
    }

    function selectNone() {
        selectItem(-1);
    }

    function selectPrevious() {
        if (self.selected > -1) {
            self.selected > 0
                ? selectItem(self.selected - 1)
                : that.triggerEvent('selectprevious');
        }
    }

    function singleclick(e) {
        var $target = $(e.target),
            $element = $target.is('.OxEditableElement')
                ? $target : $target.parents('.OxEditableElement'),
            position = $element.data('position');
        if (!$target.is('.OxInput')) {
            if ($element.length) {
                // if clicked on an element
                if (position != self.selected) {
                    // select another item
                    selectItem(position);
                } else if (e.metaKey) {
                    // or deselect current item
                    selectNone();
                }
            } else if (!self.blurred) {
                // otherwise, if there wasn't an active input element
                if (self.editing) {
                    // blur if still in editing mode
                    that.blurItem();
                } else {
                    // otherwise
                    if (self.selected > -1) {
                        // deselect selected
                        selectNone();
                    } else {
                        // or trigger event
                        that.triggerEvent('selectnone');
                    }
                }
            }
            that.gainFocus();
        }
    }

    function sortItems() {
        if (!Ox.isEmpty(self.options.sort)) {
            self.options.items = Ox.sortBy(
                self.options.items,
                self.options.sort,
                self.options.getSortValue
                    ? {value: self.options.getSortValue}
                    : {}
            );
            self.selected = getSelectedPosition();
        }
    }

    function submitItem(position, value) {
        var item = self.options.items[position];
        if (value === '') {
            deleteItem();
        } else {
            that.triggerEvent(item.value === value ? 'blur' : 'submit', {
                id: item.id,
                value: value
            });
            item.value = value;
        }
    }

    function triggerSelectEvent() {
        if (!self.triggered) {
            that.triggerEvent('select', {
                id: self.options.selected
            });
            self.triggered = true;
            setTimeout(function() {
                self.triggered = false;
            }, 250);
        }
    }

    /*@
    addItem <f> addItem
        (position, item) -> <o> add item at position
    @*/
    that.addItem = function(position, item) {
        if (self.options.editable) {
            self.options.items.splice(position, 0, item);
            renderItems();
        }
        return that;
        //that.triggerEvent('add');
        /*
        self.values = Ox.filter(values, function(value) {
            return value;
        });
        self.values.push('');
        renderItems();
        Ox.last(self.$items).triggerEvent('doubleclick');
        */
    };

    /*@
    blurItem <f> blurItem
    @*/
    that.blurItem = function() {
        /*
        if (self.options.selected) {
            self.$items[self.selected].options({editing: false});
        } else {
        */
        self.editing = false;
        self.$items.forEach(function($item) {
            $item.options({editing: false});
        });
        //}
        return that;
    };

    /*@
    editItem <f> editItem
    @*/
    that.editItem = function() {
        Ox.Log('AE', 'EDIT ITEM', self.options.editable, self.options.selected);
        if (self.options.editable && self.options.selected) {
            self.editing = true;
            self.$items[self.selected].options({editing: true});
        } else if (!self.options.editable) {
            that.triggerEvent('open');
        }
        return that;
    };

    /*@
    reloadItems <f> reloadItems
    @*/
    that.reloadItems = function() {
        renderItems();
        return that;
    };

    /*@
    removeItem <f> removeItem
    @*/
    that.removeItem = function() {
        if (self.options.editable && self.options.selected) {
            deleteItem();
        }
        return that;
    };

    /*
    that.submitItem = function() {
        if (self.editing) {
            self.editing = false;
            self.$items[self.selected].options({editing: false});
        }
    }
    */

    return that;

};
