'use strict';

// FIXME: should be Ox.AnnotationFolders

/*@
Ox.AnnotationPanel <f> Video Annotation Panel
    options <o> Options object
        calendarSize <n|256>     calendar size
        clickLink    <f|null>    click link callback
        editable:    <b|false>   if true, annotations can be edited
        font         <s|'small'> small, medium, large
        highlight    <s|''>      highlight given string in annotations
        layers       <a|[]>      array with annotation objects
        mapSize      <n|256>     map size
        range        <s|'all'>   all, position, selection
        selected     <s|''>      selected annotation
        showCalendar <b|false>   if true, calendar is shown
        showFonts    <b|false>   if true, option to select font size is show
        showLayers   <o|{}>      object with layers to show
        showMap      <b|false>   if true, show map
        showUsers    <b|false>   if true show user
        sort         <s|'position'> position, start, text
        width        <n|256>     panel width
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> AnnotationPanel Object
        add <!> add
        annotationsID <!> annotationsID
        blur <!> blur
        change <!> change
        define <!> define
        edit <!> edit
        findannotations <!> findannotations
        find <!> find
        focus <!> focus
        info <!> info
        open <!> open
        remove <!> remove
        resize <!> resize
        submit <!> submit
        togglelayer <!> togglelayer
        toggle* <!> toggle*
@*/

Ox.AnnotationPanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            calendarSize: 256,
            clickLink: null,
            editable: false,
            font: 'small',
            highlight: '',
            layers: [],
            mapSize: 256,
            range: 'all',
            selected: '',
            showCalendar: false,
            showFonts: false,
            showLayers: {},
            showMap: false,
            showUsers: false,
            sort: 'position',
            width: 256
        })
        .options(options || {})
        .update(function(key, value) {
            if (key == 'highlight') {
                self.$folder.forEach(function($folder) {
                    $folder.options({highlight: value});
                });
            } else if (['in', 'out', 'position'].indexOf(key) > -1) {
                self.$folder.forEach(function($folder) {
                    $folder.options(key, value);
                });
            } else if (key == 'selected') {
                self.options.editable && updateEditMenu();
                if (value) {
                    getFolder(value).options({selected: value});
                } else {
                    self.$folder.forEach(function($folder) {
                        $folder.options({selected: ''});
                    });
                }
            } else if (key == 'width') {
                self.$folder.forEach(function($folder) {
                    $folder.options({width: self.options.width - Ox.UI.SCROLLBAR_SIZE});
                });
            }
        })
        .addClass('OxAnnotationPanel');

    self.editing = false;

    if (self.options.showUsers) {
        self.users = getUsers();
        self.enabledUsers = self.users;
    } else {
        self.enabledUsers = 'all';
    }

    self.$menubar = Ox.Bar({
            size: 16
        })
        .addClass('OxVideoPlayer')
        .bindEvent({
            doubleclick: function(e) {
                if ($(e.target).is('.OxBar')) {
                    self.$folders.animate({scrollTop: 0}, 250);
                }
            }
        });

    self.$folders = Ox.Element().css({overflowY: 'scroll'});
    self.$folder = [];

    renderFolders();
    renderOptionsMenu();
    self.options.editable && renderEditMenu();

    that.setElement(
        self.$panel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$menubar,
                    size: 16
                },
                {
                    element: self.$folders
                }
            ],
            orientation: 'vertical'
        })
    );

    self.options.selected && getFolder(self.options.selected) && scrollToSelected(
        getFolder(self.options.selected).options('type')
    );

    function getAnnotation(annotationId) {
        var found = false, annotation;
        Ox.forEach(self.options.layers, function(layer, i) {
            Ox.forEach(layer.items, function(item) {
                if (item.id == annotationId) {
                    annotation = item;
                    found = true;
                    return false; // break
                }
            });
            if (found) {
                return false; // break
            } 
        });
        return annotation;
    }

    function getFolder(annotationId) {
        var found = false, folder;
        Ox.forEach(self.options.layers, function(layer, i) {
            Ox.forEach(layer.items, function(item) {
                if (item.id == annotationId) {
                    folder = self.$folder[i];
                    found = true;
                    return false; // break
                }
            });
            if (found) {
                return false; // break
            }
        });
        return folder;
    }

    function getUsers() {
        return Ox.sort(Ox.unique(Ox.flatten(
            self.options.layers.map(function(layer) {
                return layer.items.map(function(item) {
                    return item.user;
                });
            })
        )));
    }

    function insert(data) {
        var id = data.id;
        Ox.InsertHTMLDialog(Ox.extend({
            callback: function(data) {
                Ox.UI.elements[id]
                    .value(data.value)
                    .focusInput(data.position)
                    .triggerEvent('change', data.value);
            }
        }, data)).open();
    }

    function renderEditMenu() {
        var annotation, annotationTitle, folder,
            isDefined, isEditable, isEvent, isEventOrPlace, isPlace, isString,
            key, manageTitle, type, value;
        if (self.options.selected) {
            annotation = getAnnotation(self.options.selected);
            folder = getFolder(self.options.selected);
            if (annotation && folder) {
                key = folder.options('id');
                type = folder.options('type');
                value = annotation.value;
                isEditable = annotation.editable;
                isEvent = type == 'event';
                isPlace = type == 'place';
                isEventOrPlace = isEvent || isPlace;
                isString = type != 'text';
                // fixme: absence of annotation[type] may be an error
                isDefined = isEventOrPlace && !!annotation[type] && !!annotation[type].type;
                annotationTitle = folder.options('item') + ': "' + value + '"';
            }
        } 
        manageTitle = Ox._((isDefined ? 'Edit' : 'Define') + ' '
            + (isPlace ? 'Place' : isEvent ? 'Event' : 'Place or Event') + '...');
        self.$editMenuButton && self.$editMenuButton.remove();
        self.$editMenuButton = Ox.MenuButton({
            items: [].concat(
                [
                    {id: 'deselect', title: Ox._('Deselect Annotation'), disabled: !self.options.selected || self.editing, keyboard: 'escape'},
                    {id: 'edit', title: Ox._('Edit Annotation'), disabled: !self.options.selected || !isEditable || self.editing, keyboard: 'return'},
                    {id: 'delete', title: Ox._('Delete Annotation'), disabled: !self.options.selected || !isEditable, keyboard: 'delete'},
                    {},
                    {id: 'insert', title: Ox._('Insert...'), disabled: isString || !self.editing, keyboard: 'control i'},
                    {id: 'undo', title: Ox._('Undo Changes'), disabled: !self.editing, keyboard: 'escape'},
                    {id: 'save', title: Ox._('Save Changes'), disabled: !self.editing, keyboard: isString ? 'return' : 'shift return'},
                ],
                pandora.site.map == 'manual' ? [
                    {},
                    {id: 'manage', title: manageTitle, disabled: !self.options.selected || !isEventOrPlace},
                ] : [],
                isString ? [
                    {},
                    {id: 'annotation', title: annotationTitle, disabled: true},
                    //FIXME: pandora is not part of Ox.UI
                    {id: 'find', title: Ox._('Find in This {0}', Ox._(pandora.site.itemName.singular))},
                    {id: 'findannotations', title: Ox._('Find in All {0}', Ox._(pandora.site.itemName.plural))}
                ] : []
            ),
            maxWidth: 256,
            style: 'square',
            title: 'edit',
            tooltip: Ox._('Editing Options'),
            type: 'image'
        })
        .css({float: 'right'})
        .bindEvent({
            click: function(data) {
                if (data.id == 'delete') {
                    getFolder(self.options.selected).removeItem();
                } else if (data.id == 'deselect') {
                    getFolder(self.options.selected).options({selected: ''});
                } else if (data.id == 'edit') {
                    getFolder(self.options.selected).editItem();
                } else if (data.id == 'find') {
                    that.triggerEvent('find', {value: value});
                } else if (data.id == 'findannotations') {
                    that.triggerEvent('findannotations', {key: key, value: value});
                } else if (data.id == 'insert') {
                    var id = $('.OxEditableElement div.OxInput').data('oxid'),
                        element = $('.OxEditableElement textarea.OxInput')[0];
                    insert({
                        end: element.selectionEnd,
                        id: id,
                        selection: element.value.slice(
                            element.selectionStart, element.selectionEnd
                        ),
                        start: element.selectionStart,
                        value: element.value
                    });
                } else if (data.id == 'manage') {
                    that.triggerEvent('define', {
                        id: getAnnotation(self.options.selected)[type].id,
                        type: type
                    });
                } else if (data.id == 'save') {
                    // ...
                } else if (data.id == 'undo') {
                    // ...
                }
            },
            hide: function() {
                self.options.selected
                    ? getFolder(self.options.selected).gainFocus()
                    : that.triggerEvent('focus');
            }
        })
        .appendTo(self.$menubar);
    }

    function renderFolder(layer) {
        var index = Ox.getIndexById(self.options.layers, layer.id),
            item = Ox.getObjectById(layer.items, self.options.selected),
            selected = item ? item.id : '';
        self.$folder[index] = Ox.AnnotationFolder(
                Ox.extend({
                    clickLink: self.options.clickLink,
                    collapsed: !self.options.showLayers[layer.id],
                    editable: self.options.editable,
                    font: self.options.font,
                    highlight: self.options.highlight,
                    'in': self.options['in'],
                    out: self.options.out,
                    position: self.options.position,
                    range: self.options.range,
                    selected: selected,
                    sort: self.options.sort,
                    width: self.options.width - Ox.UI.SCROLLBAR_SIZE
                }, layer, layer.type == 'event' ? {
                    showWidget: self.options.showCalendar,
                    widgetSize: self.options.calendarSize
                } : layer.type == 'place' ? {
                    showWidget: self.options.showMap,
                    widgetSize: self.options.mapSize
                } : {})
            )
            .bindEvent({
                add: function(data) {
                    that.triggerEvent('add', Ox.extend({layer: layer.id}, data));
                },
                blur: function() {
                    that.triggerEvent('blur');
                },
                change: function(data) {
                    that.triggerEvent('change', Ox.extend({layer: layer.id}, data));
                },
                edit: function() {
                    self.editing = true;
                    renderEditMenu();
                    that.triggerEvent('edit');
                },
                info: function(data) {
                    that.triggerEvent('info', {layer: layer.id});
                },
                insert: insert,
                open: function() {
                    that.triggerEvent('open');
                },
                remove: function(data) {
                    that.triggerEvent('remove', Ox.extend({layer: layer.id}, data));
                },
                resizewidget: function(data) {
                    that.triggerEvent('resize' + (
                        layer.type == 'event' ? 'calendar' : 'map'
                    ), data);
                },
                select: function(data) {
                    selectAnnotation(data, index);
                },
                selectnext: function() {
                    selectNext(layer.id, 1);
                },
                selectprevious: function() {
                    selectNext(layer.id, -1);
                },
                selectnone: selectNone,
                submit: function(data) {
                    that.triggerEvent('submit', Ox.extend({layer: layer.id}, data));
                },
                togglelayer: function(data) {
                    self.options.showLayers[layer.id] = !data.collapsed;
                    that.triggerEvent('togglelayer', Ox.extend({layer: layer.id}, data));
                },
                togglewidget: function(data) {
                    that.triggerEvent('toggle' + (
                        layer.type == 'event' ? 'calendar' : 'map'
                    ), data);
                }
            });
        [
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'b', 'backslash', 'closebracket', 'comma', 'dot',
            'equal', 'f', 'g', 'h', 'i', 'minus', 'n', 'o',
            'openbracket', 'p', 'shift_0', 'shift_equal',
            'shift_g', 'shift_i', 'shift_minus', 'shift_o',
            'slash', 'space'
        ].forEach(function(key) {
            key = 'key_' + key;
            self.$folder[index].bindEvent(key, function() {
                that.triggerEvent(key);
            });
        });
        self.$folder[index].appendTo(self.$folders);
    }

    function renderFolders() {
        self.$folders.empty();
        self.options.layers.forEach(function(layer, index) {
            renderFolder(layer);
        });
    }

    function renderOptionsMenu() {
        self.$optionsMenuButton && self.$optionsMenuButton.remove();
        self.$optionsMenuButton = Ox.MenuButton({
                items: [].concat(
                    [
                        {id: 'showannotations', title: Ox._('Show Annotations'), disabled: true},
                        {group: 'range', min: 1, max: 1, items: [
                            {id: 'all', title: Ox._('All'), checked: self.options.range == 'all'},
                            {id: 'selection', title: Ox._('In Current Selection'), checked: self.options.range == 'selection'},
                            {id: 'position', title: Ox._('At Current Position'), checked: self.options.range == 'position'}
                        ]},
                        {},
                        {id: 'sortannotations', title: Ox._('Sort Annotations'), disabled: true},
                        {group: 'sort', min: 1, max: 1, items: [
                            {id: 'position', title: Ox._('By Position'), checked: self.options.sort == 'position'},
                            {id: 'duration', title: Ox._('By Duration'), checked: self.options.sort == 'duration'},
                            {id: 'text', title: Ox._('By Text'), checked: self.options.sort == 'text'}
                        ]}
                    ],
                    self.options.showFonts ? [
                        {},
                        {id: 'fontsize', title: Ox._('Font Size'), disabled: true},
                        {group: 'font', min: 1, max: 1, items: [
                            {id: 'small', title: Ox._('Small'), checked: self.options.font == 'small'},
                            {id: 'medium', title: Ox._('Medium'), checked: self.options.font == 'medium'},
                            {id: 'large', title: Ox._('Large'), checked: self.options.font == 'large'}
                        ]}
                    ] : [],
                    self.options.showUsers && self.users.length ? [
                        {},
                        {id: 'users', title: Ox._('Show Users'), disabled: true},
                        {group: 'users', min: 1, max: -1, items: self.users.map(function(user) {
                            return {id: user, title: Ox.encodeHTMLEntities(user), checked:
                                self.enabledUsers == 'all' || self.enabledUsers.indexOf(user) > -1
                            };
                        })}
                    ] : []
                ),
                style: 'square',
                title: 'set',
                tooltip: Ox._('Options'),
                type: 'image'
            })
            .css({float: 'left'})
            .bindEvent({
                change: function(data) {
                    var set = {};
                    if (data.id == 'users') {
                        self.enabledUsers = data.checked.map(function(checked) {
                            return checked.id;
                        });
                        self.$folder.forEach(function($folder) {
                            $folder.options({users: self.enabledUsers});
                        });
                    } else {
                        set[data.id] = data.checked[0].id;
                        self.$folder.forEach(function($folder) {
                            $folder.options(set);
                        });
                        that.triggerEvent('annotations' + data.id, set);
                    }
                },
                hide: function() {
                    self.options.selected
                        ? getFolder(self.options.selected).gainFocus()
                        : that.triggerEvent('focus');
                }
            })
            .appendTo(self.$menubar);
    }

    function scrollToSelected(type) {
        var $item = that.find('.OxEditableElement.OxSelected'),
            itemHeight = $item.height() + (type == 'text' ? 8 : 0),
            itemTop = ($item.offset() || {}).top,
            itemBottom = itemTop + itemHeight,
            height = self.$folders.height(),
            scrollTop = self.$folders.scrollTop(),
            top = self.$folders.offset().top;
        if (itemTop < top || itemBottom > top + height) {
            if (itemTop < top) {
                scrollTop += itemTop - top;
            } else {
                scrollTop += itemBottom - top - height;
            }
            self.$folders.animate({
                scrollTop: scrollTop + 'px'
            }, 0);
        }
    }

    function selectAnnotation(data, index) {
        if (data.id) {
            Ox.forEach(self.$folder, function($folder, i) {
                if (i != index && $folder.options('selected')) {
                    self.deselecting = true;
                    $folder.options({selected: ''});
                    self.deselecting = false;
                    return false; // break
                }
            });
            scrollToSelected(self.options.layers[index].type);
        }
        if (!self.deselecting) {
            self.options.selected = data.id;
            self.options.editable && renderEditMenu();
            that.triggerEvent('select', data);
        }
    }

    function selectNone() {
        if (self.options.selected) {
            getFolder(self.options.selected).options({selected: ''});
        }
    }

    function selectNext(layer, direction) {
        var index = Ox.mod(
            Ox.getIndexById(self.options.layers, layer) + direction,
            self.options.layers.length
        );
        self.$folder[index].selectItem(direction == 1 ? 0 : -1);
    }

    function updateEditMenu() {
        var action = self.options.selected ? 'enableItem' : 'disableItem';
        self.$editMenuButton[action]('edit');
        self.$editMenuButton[action]('delete');
    }

    /*@
    addItem <f> add item
        (layer, item) -> <o> AnnotationPanel
    @*/
    that.addItem = function(layer, item) {
        // called from addannotation callback
        var i = Ox.getIndexById(self.options.layers, layer);
        self.$folder[i].addItem(item);
        self.users = getUsers();
        if (self.enabledUsers != 'all' && self.enabledUsers.indexOf(item.user) == -1) {
            self.enabledUsers.push(item.user);
            self.$folder[i].options({users: self.enabledUsers});
        }
        renderOptionsMenu();
        renderEditMenu();
        return that;
    };

    /*@
    addLayer <f> Add a layer
        (layer[, index]) -> <o> AnnotationPanel
    @*/
    that.addLayer = function(layer, index) {
        // FIXME: add/remove/updateLayer don't update users yet
        index = index || self.options.layers.length;
        self.options.layers.splice(index, 0, layer);
        renderFolders();
        return that;
    };

    /*@
    blurItem <f> Blur selected item 
        () -> <o> AnnotationPanel
    @*/
    that.blurItem = function() {
        self.editing = false;
        getFolder(self.options.selected).blurItem();
        renderEditMenu();
        return that;
    };

    /*@
    editItem <f> Put selected item into edit mode
        () -> <o> AnnotationPanel
    @*/
    that.editItem = function() {
        self.editing = true;
        getFolder(self.options.selected).editItem();
        renderEditMenu();
        return that;
    };

    /*@
    removeItem <f> Remove selected item 
        () -> <o> AnnotationPanel
    @*/
    that.removeItem = function(remove) {
        if (remove) {
            // remove initiated by video editor
            getFolder(self.options.selected).removeItem();
        } else {
            // called from removeannotation callback
            self.options.selected = '';
            self.users = getUsers();
            renderOptionsMenu();
            renderEditMenu();
        }
        return that;
    };

    /*@
    removeLayer <f> Remove a layer
        (id) -> <o> AnnotationPanel
    @*/
    that.removeLayer = function(id) {
        var $folder = getFolder(self.options.selected),
            index = Ox.getIndexById(self.options.layers, id);
        if (self.$folder[index] == $folder) {
            $folder.blurItem();
        }
        self.options.layers.splice(index, 1);
        renderFolders();
        return that;
    };

    /*@
    updateItem <f> Update an item
        (id, item) -> <o> AnnotationPanel
    @*/
    that.updateItem = function(id, item) {
        // called from editannotation callback
        // on the first update of a new annotation, the id will change
        self.options.selected = item.id;
        getFolder(id).updateItem(id, item);
        renderEditMenu();
    };

    /*@
    updateLayer <f> Update a layer
        (id, items) -> <o> AnnotationPanel
    @*/
    that.updateLayer = function(id, items) {
        var $folder = getFolder(self.options.selected),
            index = Ox.getIndexById(self.options.layers, id);
        if (self.$folder[index] == $folder) {
            $folder.blurItem();
        }            
        self.options.layers[index].items = items;
        self.$folder[index].replaceWith(
            self.$folder[index] = renderFolder(self.options.layers[index])
        );
        return that;
    };

    return that;
  
};
