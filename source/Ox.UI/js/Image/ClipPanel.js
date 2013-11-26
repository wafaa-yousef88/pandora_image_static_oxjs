'use strict';

Ox.ClipPanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            clips: [],
            duration: 0,
            editable: false,
            getClipImageURL: null,
            'in': 0,
            out: 0,
            position: 0,
            selected: [],
            sort: [],
            sortOptions: [],
            view: 'list',
            width: 0
        })
        .options(options || {})
        .update({
            clips: function() {
                self.$list.options({
                    items: self.options.clips,
                    sort: self.options.sort,
                    sortable: isSortable()
                });
                updateStatus();
            },
            duration: updateStatus,
            height: function() {
                self.$list.size();
            },
            selected: selectClips,
            sort: function() {
                updateSortElement();
                self.$list.options({
                    sort: self.options.sort,
                    sortable: isSortable(),
                });
            }
        })
        .bindEvent({
            resize: function() {
                self.$list.size();
            }
        });

    self.$menubar = Ox.Bar({
            size: 24
        })
        .bindEvent({
            doubleclick: function(e) {
                if ($(e.target).is('.OxBar')) {
                    self.$list.animate({scrollTop: 0}, 250);
                }
            }
        });

    self.$menu = Ox.MenuButton({
            items: [
                {group: 'view', min: 1, max: 1, items: [
                    {id: 'list', title: Ox._('View as List'), checked: self.options.view == 'list'},
                    {id: 'grid', title: Ox._('View as Grid'), checked: self.options.view == 'grid'},
                ]},
                {},
                {id: 'split', title: Ox._('Split Selected Clips at Cuts'), disabled: !self.options.editable || !self.options.selected.length},
                {id: 'join', title: Ox._('Join Selected Clips at Cuts'), disabled: !self.options.editable || !self.options.selected.length},
                {id: 'replace', title: Ox._('Make Selected Clips Editable'), disabled: !self.options.editable || !self.options.selected.length}
            ],
            title: 'set',
            tooltip: Ox._('Options'),
            type: 'image'
        })
        .css({
            float: 'left',
            margin: '4px 2px 4px 4px'
        })
        .bindEvent({
            change: function(data) {
                if (data.id == 'view') {
                    self.options.view = data.checked[0].id;
                    self.$panel.replaceElement(1, self.$list = getList());
                    that.triggerEvent('view', {view: self.options.view});
                }
            },
            click: function(data) {
                if (data.id == 'split') {
                    splitClips();
                } else if (data.id == 'join') {
                    joinClips();
                }
            }
        })
        .appendTo(self.$menubar),

    self.$sortSelect = Ox.Select({
            items: self.options.sortOptions,
            value: self.options.sort[0].key,
            width: 100 + Ox.UI.SCROLLBAR_SIZE
        })
        .bindEvent({
            change: function(data) {
                self.options.sort = [{
                    key: data.value,
                    operator: Ox.getObjectById(
                        self.options.sortOptions, data.value
                    ).operator
                }];
                updateSortElement();
                that.triggerEvent('sort', self.options.sort);
            }
        });

    self.$orderButton = Ox.Button({
            overlap: 'left',
            title: getButtonTitle(),
            tooltip: getButtonTooltip(),
            type: 'image'
        })
        .bindEvent({
            click: function() {
                self.options.sort = [{
                    key: self.options.sort[0].key,
                    operator: self.options.sort[0].operator == '+' ? '-' : '+'
                }];
                updateSortElement();
                that.triggerEvent('sort', self.options.sort);
            }
        });

    self.$sortElement = Ox.FormElementGroup({
            elements: [self.$sortSelect, self.$orderButton],
            float: 'right'
        })
        .css({
            float: 'right',
            margin: '4px 4px 4px 2px'
        })
        .appendTo(self.$menubar);

    self.$list = getList();

    self.$statusbar = Ox.Bar({
        size: 16
    });

    self.$status = Ox.Element()
        .css({
            marginTop: '2px',
            fontSize: '9px',
            textAlign: 'center',
            textOverflow: 'ellipsis'
        })
        .appendTo(self.$statusbar);

    that.setElement(
        self.$panel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$menubar,
                    size: 24
                },
                {
                    element: self.$list
                },
                {
                    element: self.$statusbar,
                    size: 16
                }
            ],
            orientation: 'vertical'
        })
    );

    updateStatus();

    function editClip(data) {
        var value = self.$list.value(data.id, data.key);
        if (data.value != value && !(data.value === '' && value === null)) {
            self.$list.value(data.id, data.key, data.value || null);
            that.triggerEvent('edit', data);
        }
    }

    function getButtonTitle() {
        return self.options.sort[0].operator == '+' ? 'up' : 'down';
    }

    function getButtonTooltip() {
        return Ox._(self.options.sort[0].operator == '+' ? 'Ascending' : 'Descending');
    }

    function getEditable(ids) {
        return ids.filter(function(id) {
            return isEditable(Ox.getObjectById(self.options.clips, id));
        });
    }

    function getList() {
        var $list;
        if (self.options.view == 'list') {
            $list = Ox.TableList({
                columns: [
                    {
                        align: 'right',
                        id: 'index',
                        operator: '+',
                        title: Ox._('Index'),
                        visible: false,
                        width: 60
                    },
                    {
                        id: 'id',
                        operator: '+',
                        title: Ox._('ID'),
                        unique: true,
                        visible: false,
                        width: 60
                    },
                    {
                        id: 'item',
                        operator: '+',
                        title: Ox._(pandora.site.itemName.singular),
                        visible: true,
                        width: 60
                    },
                    {
                        align: 'right',
                        editable: isEditable,
                        format: function(value, data) {
                            return (
                                isEditable(data) ? ['', '']
                                : ['<span class="OxLight">', '</span>']
                            ).join(Ox.formatDuration(value, 3));
                        },
                        id: 'in',
                        operator: '+',
                        title: Ox._('In'),
                        visible: true,
                        width: 90
                    },
                    {
                        align: 'right',
                        editable: isEditable,
                        format: function(value, data) {
                            return (
                                isEditable(data) ? ['', '']
                                : ['<span class="OxLight">', '</span>']
                            ).join(Ox.formatDuration(value, 3));
                        },
                        id: 'out',
                        operator: '+',
                        title: Ox._('Out'),
                        visible: true,
                        width: 90
                    },
                    {
                        align: 'right',
                        editable: isEditable,
                        format: function(value, data) {
                            return (
                                isEditable(data) ? ['', '']
                                : ['<span class="OxLight">', '</span>']
                            ).join(Ox.formatDuration(value, 3));
                        },
                        id: 'duration',
                        operator: '+',
                        title: Ox._('Duration'),
                        visible: true,
                        width: 90
                    }
                ],
                columnsMovable: true,
                columnsRemovable: true,
                columnsResizable: true,
                columnsVisible: true,
                items: self.options.clips,
                scrollbarVisible: true,
                selected: self.options.selected,
                sort: self.options.sort,
                sortable: isSortable(),
                unique: 'id'
            });
        } else {
            $list = Ox.IconList({
                draggable: true,
                fixedRatio: pandora.site.video.previewRatio,
                item: function(data, sort, size) {
                    size = size || 128; // fixme: is this needed?
                    var ratio = data.videoRatio,
                        fixedRatio = pandora.site.video.previewRatio,
                        width = ratio > fixedRatio ? size : Math.round(size * ratio / fixedRatio),
                        height = Math.round(width / ratio),
                        info,
                        title = data.title + (
                            data.director ? ' (' + data.director.join(', ') + ')' : ''
                        ),
                        url = self.options.getClipImageURL(data.id, width, height);
                    if (['text', 'position', 'duration', 'random'].indexOf(sort[0].key) > -1) {
                        info = Ox.formatDuration(data['in']) + ' - '
                            + Ox.formatDuration(data.out);
                    } else {
                        info = Ox.formatDuration(data['in']) + ' - '
                            + Ox.formatDuration(data.out);
                    }
                    return {
                        height: height,
                        id: data.id,
                        info: info,
                        title: title,
                        url: url,
                        width: width
                    };
                },
                items: self.options.clips,
                keys: ['id', 'in', 'out'],
                orientation: 'both',
                sort: self.options.sort,
                unique: 'id'
            });
        }
        $list.bindEvent({
            copy: function(data) {
                that.triggerEvent('copy', data);
            },
            copyadd: function(data) {
                that.triggerEvent('copyadd', data);
            },
            cut: function(data) {
                self.options.editable && that.triggerEvent('cut', data);
            },
            cutadd: function(data) {
                self.options.editable && that.triggerEvent('cutadd', data);
            },
            'delete': function(data) {
                self.options.editable && that.triggerEvent('delete', data);
            },
            move: function(data) {
                data.ids.forEach(function(id, index) {
                    self.$list.value(id, 'index', index);
                });
                that.triggerEvent('move', data);
            },
            open: function(data) {
                that.triggerEvent('open', data);
            },
            paste: function() {
                self.options.editable && that.triggerEvent('paste');
            },
            select: function(data) {
                self.options.selected = data.ids;
                selectClips();
                that.triggerEvent('select', data);
            },
            sort: function(data) {
                self.options.sort = [data];
                updateSortElement();
                self.$list.options({sortable: isSortable()});
                that.triggerEvent('sort', self.options.sort);
            },
            submit: function(data) {
                var value = self.$list.value(data.id);
                data.value = Ox.parseDuration(data.value);
                if (
                    (data.key == 'in' && data.value < value.out)
                    || (data.key == 'out' && data.value > value['in'])
                    || (data.key == 'duration' && data.value > 0)
                ) {
                    self.$list.value(data.id, data.key, data.value);
                    if (data.key == 'in') {
                        self.$list.value(data.id, 'duration', value.out - data.value);
                    } else if (data.key == 'out') {
                        self.$list.value(data.id, 'duration', data.value - value['in']);
                    } else if (data.key == 'duration') {
                        self.$list.value(data.id, 'out', value['in'] + data.value);
                    }
                    that.triggerEvent('edit', data);
                } else {
                    self.$list.value(data.id, data.key, value[data.key]);
                }
            }
        });
        return $list;
    }

    function isEditable(data) {
        return self.options.editable && !data.annotation;
    }

    function isSortable() {
        return self.options.editable
            && self.options.sort && self.options.sort.length
            && self.options.sort[0].key == 'index'
            && self.options.sort[0].operator == '+';
    }

    function joinClips() {
        var clips = getEditable(self.options.selected).map(function(id) {
                return Ox.clone(Ox.getObjectById(self.options.clips, id));
            }),
            ids = [], join = [], joined;
        do {
            joined = false;
            Ox.forEach(clips, function(outClip) {
                var outPoint = outClip.item + '/' + outClip.out;
                Ox.forEach(clips, function(inClip, index) {
                    var inPoint = inClip.item + '/' + inClip['in'];
                    if (inPoint == outPoint) {
                        ids = Ox.unique(ids.concat([outClip.id, inClip.id]));
                        join = Ox.unique(join.concat([outClip.id]));
                        outClip.out = inClip.out;
                        if (Ox.contains(join, inClip.id)) {
                            join.splice(join.indexOf(inClip.id), 1);
                        }
                        clips.splice(index, 1);
                        joined = true;
                        return false; // break
                    }
                });
                if (joined) {
                    return false; // brea;
                }
            });
        } while (joined);
        join = join.map(function(id) {
            var clip = Ox.getObjectById(clips, id);
            return {'in': clip['in'], item: clip.item, out: clip.out};
        });
        if (ids.length) {
            that.triggerEvent('join', {ids: ids, join: join});
        }
    }

    function selectClips() {
        var action;
        if (self.options.editable) {
            action = self.options.selected.length ? 'enableItem' : 'disableItem';
            self.$menu[action]('split');
            self.$menu[action]('join');
        }
        self.$list.options({selected: self.options.selected});
    }

    function splitClips() {
        var ids = getEditable(self.options.selected).filter(function(id) {
                var clip = Ox.getObjectById(self.options.clips, id);
                return clip.cuts.length;
            }),
            split = Ox.flatten(ids.map(function(id) {
                var clip = Ox.getObjectById(self.options.clips, id),
                    cuts = [clip['in']].concat(clip.cuts).concat([clip.out]);
                return Ox.range(0, cuts.length - 1).map(function(i) {
                    return {'in': cuts[i], item: clip.item, out: cuts[i + 1]};
                });
            }));
        if (split.length > ids.length) {
            that.triggerEvent('split', {ids: ids, split: split});
        }
    }

    function updateSortElement() {
        self.$sortSelect.options({
            value: self.options.sort[0].key,
        });
        self.$orderButton.options({
            title: getButtonTitle(),
            tooltip: getButtonTooltip(),
        });
    }

    function updateStatus() {
        self.$status.html(
            Ox.toTitleCase(Ox.formatCount(self.options.clips.length, 'Clip'))
            + ', ' + Ox.formatDuration(self.options.duration, 3)
        );
    }

    that.invertSelection = function() {
        self.$list.invertSelection();
    };

    that.selectAll = function() {
        self.$list.selectAll();
    };

    that.updateItem = function(id, data) {
        self.options.clips[Ox.getIndexById(self.options.clips, id)] = data;
        ['in', 'out', 'duration'].forEach(function(key) {
            self.$list.value(id, key, data[key]);
        });
    };

    return that;

};
