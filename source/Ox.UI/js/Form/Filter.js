'use strict';

/*@
Ox.Filter <f> Filter Object
    options <o> Options object
        findKeys <[]|[]> keys
        list <o> list object
            sort <s> List sort
            view <s> List view
        query <o> query object
            conditions <[o]> Conditions (array of {key, value, operator})
            operator <s> Operator ('&' or '|')
            limit <o> Limit
                key <s> Limit key
                sort <s> Limit sort
                value <n> Limit value
        sortKeys <a|[]> keys to sort by
        viewKeys <a|[]> visible keys
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Filter Object
        change <!> change
@*/

Ox.Filter = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                findKeys: [],
                list: null,
                query: {
                    conditions: [],
                    operator: '&'
                },
                sortKeys: [],
                viewKeys: []
            })
            .options(options || {});

    // fixme: this should not happen, but some lists
    // have their query set to {} or their query operator set to ''
    if (Ox.isEmpty(self.options.query)) {
        self.options.query = {conditions: [], operator: '&'};
    } else if (self.options.query.operator == '') {
        self.options.query.operator = '&';
    }
    Ox.Log('Form', 'Ox.Filter self.options', self.options);

    self.conditionOperators = {
        boolean: [
            {id: '=', title: Ox._('is')},
            {id: '!=', title: Ox._('is not')}
        ],
        date: [
            {id: '=', title: Ox._('is')},
            {id: '!=', title: Ox._('is not')},
            {id: '<', title: Ox._('is before')},
            {id: '!<', title: Ox._('is not before')},
            {id: '>', title: Ox._('is after')},
            {id: '!>', title: Ox._('is not after')},
            {id: '=,', title: Ox._('is between')},
            {id: '!=,', title: Ox._('is not between')}
        ],
        'enum': [
            {id: '=', title: Ox._('is')},
            {id: '!=', title: Ox._('is not')},
            {id: '<', title: Ox._('is less than')},
            {id: '!<', title: Ox._('is not less than')},
            {id: '>', title: Ox._('is greater than')},
            {id: '!>', title: Ox._('is not greater than')},
            {id: '=,', title: Ox._('is between')},
            {id: '!=,', title: Ox._('is not between')}
        ],
        list: [
            {id: '==', title: Ox._('is')},
            {id: '!==', title: Ox._('is not')}
        ],
        number: [
            {id: '=', title: Ox._('is')},
            {id: '!=', title: Ox._('is not')},
            {id: '<', title: Ox._('is less than')},
            {id: '!<', title: Ox._('is not less than')},
            {id: '>', title: Ox._('is greater than')},
            {id: '!>', title: Ox._('is not greater than')},
            {id: '=,', title: Ox._('is between')},
            {id: '!=,', title: Ox._('is not between')}
        ],
        string: [
            {id: '==', title: Ox._('is')},
            {id: '!==', title: Ox._('is not')},
            {id: '=', title: Ox._('contains')},
            {id: '!=', title: Ox._('does not contain')},
            {id: '^', title: Ox._('starts with')},
            {id: '!^', title: Ox._('does not start with')},
            {id: '$', title: Ox._('ends with')},
            {id: '!$', title: Ox._('does not end with')}
        ],
        text: [
            {id: '=', title: Ox._('contains')},
            {id: '!=', title: Ox._('does not contain')}
        ],
        year: [
            {id: '==', title: Ox._('is')},
            {id: '!==', title: Ox._('is not')},
            {id: '<', title: Ox._('is before')},
            {id: '!<', title: Ox._('is not before')},
            {id: '>', title: Ox._('is after')},
            {id: '!>', title: Ox._('is not after')},
            {id: '=,', title: Ox._('is between')},
            {id: '!=,', title: Ox._('is not between')}
        ]
    };
    self.defaultValue = {
        boolean: 'true',
        date: Ox.formatDate(new Date(), '%F'),
        'enum': 0,
        float: 0,
        hue: 0,
        integer: 0,
        list: '',
        string: '',
        text: '',
        time: '00:00:00',
        year: new Date().getFullYear().toString()
    };
    self.operators = [
        {id: '&', title: Ox._('all')},
        {id: '|', title: Ox._('any')}
    ];

    if (!self.options.query.conditions.length) {
        self.options.query.conditions = [{
            key: self.options.findKeys[0].id,
            value: '',
            operator: self.conditionOperators[
                getConditionType(self.options.findKeys[0].type)
            ][0].id
        }];
    }

    self.$operator = Ox.FormElementGroup({
        elements: [
            Ox.Label({
                title: Ox._('Match'),
                overlap: 'right',
                width: 48
            }),
            Ox.FormElementGroup({
                elements: [
                    Ox.Select({
                            items: self.operators,
                            value: self.options.query.operator,
                            width: 48
                        })
                        .bindEvent({
                            change: changeOperator
                        }),
                    Ox.Label({
                        overlap: 'left',
                        title: Ox._('of the following conditions'),
                        width: 160
                    })
                ],
                float: 'right',
                width: 208
            })
        ],
        float: 'left'
    });

    self.$save = Ox.InputGroup({
        inputs: [
            self.$foo = Ox.Checkbox({
                width: 16
            }),
            Ox.Input({
                id: 'list',
                placeholder: Ox._('Untitled'),
                width: 128
            })
        ],
        separators: [
            {title: Ox._('Save as Smart List'), width: 112}
        ]
    });

    self.$limit = Ox.InputGroup({
        inputs: [
            Ox.Checkbox({
                width: 16
            }),
            Ox.FormElementGroup({
                elements: [
                    Ox.Input({
                        type: 'int',
                        width: 56
                    }),
                    Ox.Select({
                        items: [
                            {id: 'items', title: Ox._('items')},
                            {},
                            {id: 'hours', title: Ox._('hours')},
                            {id: 'days', title: Ox._('days')},
                            {},
                            {id: 'GB', title: 'GB'}
                        ],
                        overlap: 'left',
                        width: 64
                    })
                ],
                float: 'right',
                width: 120
            }),
            Ox.Select({
                items: self.options.sortKeys,
                width: 128
            }),
            Ox.FormElementGroup({
                elements: [
                    Ox.Select({
                        items: [
                            {id: 'ascending', title: Ox._('ascending')},
                            {id: 'descending', title: Ox._('descending')}
                        ],
                        width: 128
                    }),
                    Ox.Label({
                        overlap: 'left',
                        title: Ox._('order'),
                        width: 72
                    })
                ],
                float: 'right',
                width: 200
            })
        ],
        separators: [
            {title: Ox._('Limit to'), width: 56},
            {title: Ox._('sorted by'), width: 60}, // fixme: this is odd, should be 64
            {title: Ox._('in'), width: 32}
        ]
    });

    self.$view = Ox.InputGroup({
        inputs: [
            Ox.Checkbox({
                width: 16
            }),
            Ox.Select({
                items: self.options.viewKeys,
                width: 128
            }),
            Ox.Select({
                items: self.options.sortKeys,
                width: 128
            }),
            Ox.FormElementGroup({
                elements: [
                    Ox.Select({
                        items: [
                            {id: 'ascending', title: Ox._('ascending')},
                            {id: 'descending', title: Ox._('descending')}
                        ],
                        width: 128
                    }),
                    Ox.Label({
                        overlap: 'left',
                        title: Ox._('order'),
                        width: 72
                    })
                ],
                float: 'right',
                width: 200
            })
        ],
        separators: [
            {title: Ox._('View'), width: 48},
            {title: Ox._('sorted by'), width: 60},
            {title: Ox._('in'), width: 32}
        ]
    });

    // limit and view temporarily disabled
    self.$items = self.options.list
        ? [self.$operator, self.$save/*, self.$limit, self.$view*/]
        : [self.$operator/*, self.$limit, self.$view*/];

    self.numberOfAdditionalFormItems = self.$items.length;

    self.$form = Ox.Form({
        items: self.$items
    }).appendTo(that);
    renderConditions();
    //that.$element = self.$form.$element;

    function addCondition(pos, subpos, isGroup) {
        subpos = Ox.isUndefined(subpos) ? -1 : subpos;
        var key = self.options.findKeys[0],
            condition = {
                key: key.id,
                value: '',
                operator: self.conditionOperators[key.type][0].id
            };
        if (isGroup) {
            Ox.Log('Form', 'isGroup', self.options.query.operator)
            condition = {
                conditions: [condition],
                operator: self.options.query.operator == '&' ? '|' : '&'
            };
        }
        if (subpos == -1) {
            self.options.query.conditions.splice(pos, 0, condition);
        } else {
            self.options.query.conditions[pos].conditions.splice(subpos, 0, condition);
        }
        renderConditions();
        if (!isUselessCondition(pos, subpos)) {
            triggerChangeEvent();
        }
    }

    function changeConditionKey(pos, subpos, key) {
        subpos = Ox.isUndefined(subpos) ? -1 : subpos;
        Ox.Log('Form', 'changeConditionKey', pos, subpos, key);
        var condition = subpos == -1
                ? self.options.query.conditions[pos]
                : self.options.query.conditions[pos].conditions[subpos],
            oldFindKey = Ox.getObjectById(self.options.findKeys, condition.key),
            newFindKey = Ox.getObjectById(self.options.findKeys, key),
            oldConditionType = getConditionType(oldFindKey.type),
            newConditionType = getConditionType(newFindKey.type),
            changeConditionType = oldConditionType != newConditionType,
            changeConditionFormat = !Ox.isEqual(oldFindKey.format, newFindKey.format),
            wasUselessCondition = isUselessCondition(pos, subpos);
        Ox.Log('Form', 'old new', oldConditionType, newConditionType)
        condition.key = key;
        if (changeConditionType || changeConditionFormat) {
            if (Ox.getIndexById(self.conditionOperators[newConditionType], condition.operator) == -1) {
                condition.operator = self.conditionOperators[newConditionType][0].id;
            }
            if (
                ['string', 'text'].indexOf(oldConditionType) == -1
                || ['string', 'text'].indexOf(newConditionType) == -1
            ) {
                condition.value = self.defaultValue[newFindKey.type];
            }
            renderConditions();
        }
        if (!(wasUselessCondition && isUselessCondition(pos, subpos))) {
            triggerChangeEvent();
        }
    }

    function changeConditionOperator(pos, subpos, operator) {
        subpos = Ox.isUndefined(subpos) ? -1 : subpos;
        Ox.Log('FILTER', 'chCoOp', 'query', self.options.query)
        var condition = subpos == -1
                ? self.options.query.conditions[pos]
                : self.options.query.conditions[pos].conditions[subpos],
            isBetween = operator.indexOf(',') > -1,
            wasBetween = Ox.isArray(condition.value),
            wasUselessCondition = isUselessCondition(pos, subpos);
        Ox.Log('FILTER', 'chCoOp', 'iB/wB', isBetween, wasBetween)
        condition.operator = operator;
        if (isBetween && !wasBetween) {
            condition.operator = condition.operator.replace(',', '');
            condition.value = [condition.value, condition.value]
            renderConditions();
        } else if (!isBetween && wasBetween) {
            condition.value = condition.value[0]
            renderConditions();
        }
        if (!(wasUselessCondition && isUselessCondition(pos, subpos))) {
            triggerChangeEvent();
        }
    }

    function changeConditionValue(pos, subpos, value) {
        Ox.Log('FILTER', 'cCV', pos, subpos, value);
        var condition = subpos == -1
                ? self.options.query.conditions[pos]
                : self.options.query.conditions[pos].conditions[subpos];
        condition.value = value;
        triggerChangeEvent();
    }

    function changeGroupOperator(pos, value) {
        self.options.query.conditions[pos].operator = value;
        triggerChangeEvent();
    }

    function changeOperator(data) {
        var hasGroups = false;
        self.options.query.operator = data.value;
        Ox.forEach(self.options.query.conditions, function(condition) {
            if (condition.conditions) {
                hasGroups = true;
                return false; // break
            }
        });
        hasGroups && renderConditions();
        self.options.query.conditions.length > 1 && triggerChangeEvent();
    }

    function getConditionType(type) {
        type = Ox.isArray(type) ? type[0] : type;
        if (['float', 'hue', 'integer', 'time'].indexOf(type) > -1) {
            type = 'number';
        }
        return type;
    }

    function isUselessCondition(pos, subpos) {
        subpos = Ox.isUndefined(subpos) ? -1 : subpos;
        var conditions = subpos == -1
                ? self.options.query.conditions[pos].conditions
                    || [self.options.query.conditions[pos]]
                : [self.options.query.conditions[pos].conditions[subpos]],
            isUseless = false;
        Ox.forEach(conditions, function(condition) {
            isUseless = ['string', 'text'].indexOf(getConditionType(
                    Ox.getObjectById(self.options.findKeys, condition.key).type
                )) > -1
                && (
                    self.options.query.operator == '&' ? ['', '^', '$'] : ['!', '!^', '!$']
                ).indexOf(condition.operator) > -1
                && condition.value === '';
            if (!isUseless) {
                return false; // break if one of the conditions is not useless
            }
        });
        return isUseless;
    }

    function removeCondition(pos, subpos) {
        subpos = Ox.isUndefined(subpos) ? -1 : subpos;
        var wasUselessCondition = isUselessCondition(pos, subpos);
        if (subpos == -1 || self.options.query.conditions[pos].conditions.length == 1) {
            self.options.query.conditions.splice(pos, 1);
        } else {
            self.options.query.conditions[pos].conditions.splice(subpos, 1);
        }
        renderConditions();
        if (!wasUselessCondition) {
            triggerChangeEvent();
        }
    }

    function renderButtons(pos, subpos) {
        subpos = Ox.isUndefined(subpos) ? -1 : subpos;
        var isGroup = subpos == -1 && self.options.query.conditions[pos].conditions;
        return [].concat([
            Ox.Button({
                    id: 'remove',
                    title: self.options.query.conditions.length == 1 ? 'close' : 'remove',
                    tooltip: self.options.query.conditions.length == 1 ? Ox._('Reset this condition')
                        : isGroup ? Ox._('Remove this group of conditions')
                        : Ox._('Remove this condition'),
                    type: 'image'
                })
                .css({margin: '0 4px 0 ' + (isGroup ? '292px' : '8px')}) // fixme: 296 is probably correct, but labels seem to be too wide
                .bindEvent({
                    click: function(data) {
                        var key;
                        if (self.options.query.conditions.length == 1) {
                            key = self.options.findKeys[0];
                            self.options.query.conditions = [{
                                key: key.id,
                                value: '',
                                operator: self.conditionOperators[key.type][0].id
                            }];
                            renderConditions();
                            triggerChangeEvent();
                        } else if (this.$element.parent().data('subposition') == -1) {
                            removeCondition(this.$element.parent().data('position'));
                        } else {
                            removeCondition(
                                this.$element.parent().data('position'),
                                this.$element.parent().data('subposition')
                            );
                        }
                    }
                }),
            Ox.Button({
                    id: 'add',
                    title: Ox._('add'),
                    tooltip: Ox._('Add a condition'),
                    type: 'image'
                })
                .css({margin: '0 ' + (subpos == -1 ? '4px' : '0') + ' 0 4px'})
                .bindEvent({
                    click: function(data) {
                        Ox.Log('Form', 'add...', data, this.$element.parent().data('position'), this.$element.parent().data('subposition'))
                        if (this.$element.parent().data('subposition') == -1) {
                            addCondition(this.$element.parent().data('position') + 1);
                        } else {
                            addCondition(
                                this.$element.parent().data('position'),
                                this.$element.parent().data('subposition') + 1
                            );
                        }
                    }
                })
        ], subpos == -1 ? [
            Ox.Button({
                    id: 'addgroup',
                    title: Ox._('bracket'),
                    tooltip: Ox._('Add a group of conditions'),
                    type: 'image'
                })
                .css({margin: '0 0 0 4px'})
                .bindEvent({
                    click: function(data) {
                        addCondition(this.$element.parent().data('position') + 1, -1, true)
                    }
                })
        ] : []);
    }

    function renderCondition(condition, pos, subpos) {
        subpos = Ox.isUndefined(subpos) ? -1 : subpos;
        var condition = subpos == -1
            ? self.options.query.conditions[pos]
            : self.options.query.conditions[pos].conditions[subpos];
        Ox.Log('Form', 'renderCondition', condition, pos, subpos)
        return Ox.FormElementGroup({
                elements: [
                    renderConditionKey(condition),
                    renderConditionOperator(condition),
                    renderConditionValue(condition)
                ].concat(renderButtons(pos, subpos))
            })
            .css({marginLeft: subpos == -1 ? 0 : '24px'})
            .data({position: pos, subposition: subpos});
    }

    function renderConditionKey(condition) {
        return Ox.Select({
            items: self.options.findKeys,
            //items: Ox.extend({}, self.options.findKeys), // fixme: Ox.Menu messes with keys
            overlap: 'right',
            value: condition.key,
            width: 128
        })
        .bindEvent({
            change: function(data) {
                var $element = this.$element.parent();
                changeConditionKey(
                    $element.data('position'),
                    $element.data('subposition'),
                    data.value
                );
            }
        });
    }

    function renderConditionOperator(condition) {
        Ox.Log('FILTER', 'rCO', condition, self.conditionOperators[getConditionType(
            Ox.getObjectById(self.options.findKeys, condition.key).type
        )])
        return Ox.Select({
            items: self.conditionOperators[getConditionType(
                Ox.getObjectById(self.options.findKeys, condition.key).type
            )],
            overlap: 'right',
            value: condition.operator + (Ox.isArray(condition.value) ? ',' : ''),
            width: 128
        })
        .bindEvent({
            change: function(data) {
                var $element = this.$element.parent();
                changeConditionOperator(
                    $element.data('position'),
                    $element.data('subposition'),
                    data.value
                );
            }
        });
    }

    function renderConditionValue(condition) {
        return (!Ox.isArray(condition.value)
            ? renderInput(condition)
            : Ox.InputGroup({
                inputs: [
                    renderInput(condition, 0).options({id: 'start'}),
                    renderInput(condition, 1).options({id: 'end'})
                ],
                separators: [
                    {title: Ox._('and'), width: 32}
                ]
            })
        ).bindEvent({
            change: change,
            submit: change
        });
        function change(data) {
            var $element = this.$element.parent();
            changeConditionValue(
                $element.data('position'),
                $element.data('subposition'),
                data.value
            );
        }
    }

    function renderConditions() {
        Ox.Log('Form', 'renderConditions', self.options.query)
        var $conditions = [];
        while (self.$form.options('items').length > self.numberOfAdditionalFormItems) {
            self.$form.removeItem(1);
        }
        self.options.query.conditions.forEach(function(condition, pos) {
            if (!condition.conditions) {
                $conditions.push(renderCondition(condition, pos));
            } else {
                $conditions.push(renderGroup(condition, pos));
                condition.conditions.forEach(function(subcondition, subpos) {
                    $conditions.push(renderCondition(subcondition, pos, subpos));
                });
            }
        });
        $conditions.forEach(function($condition, pos) {
            self.$form.addItem(1 + pos, $condition);
        });
    }

    function renderGroup(condition, pos) {
        var subpos = -1;
        var $condition = Ox.FormElementGroup({
            elements: [
                Ox.Label({
                    title: self.options.query.operator == '&'
                        ? (pos == 0 ? 'Both' : 'and')
                        : (pos == 0 ? 'Either': 'or'),
                    overlap: 'right',
                    width: 48
                }).addClass('OxGroupLabel'),
                Ox.FormElementGroup({
                    elements: [
                        Ox.Select({
                                items: self.operators,
                                value: self.options.query.operator == '&' ? '|' : '&',
                                width: 48
                            })
                            .bindEvent({
                                change: function(data) {
                                    var $element = this.$element.parent().parent();
                                    changeGroupOperator(
                                        $element.data('position'),
                                        data.value
                                    );                                    
                                }
                            }),
                        Ox.Label({
                            overlap: 'left',
                            title: Ox._('of the following conditions'),
                            width: 160
                        })
                    ],
                    float: 'right',
                    width: 208
                }),
            ].concat(renderButtons(pos, subpos, true)),
            float: 'left'
        })
        .data({position: pos});
        return $condition;
    }

    function renderInput(condition, index) {
        Ox.Log('Form', 'renderInput', condition)
        var $input,
            findKey = Ox.getObjectById(self.options.findKeys, condition.key),
            isArray = Ox.isArray(condition.value),
            isHue,
            // FIXME: always use 'int'
            type = findKey.type == 'integer' ? 'int' : findKey.type,
            value = !isArray ? condition.value : condition.value[index],
            formatArgs, formatType, title;
        if (type == 'boolean') {
            $input = Ox.Select({
                items: ['true', 'false'],
                value: value ? 'true' : 'false',
                width: 288
            });
        } else if (type == 'enum') {
            Ox.Log('FILTER', findKey, condition)
            $input = Ox.Select({
                items: findKey.values.map(function(v, i) {
                    return {id: i, title: v}
                }),
                value: value,
                width: !isArray ? 288 : 128
            });
        } else if (type == 'list') {
            Ox.Log('FILTER', findKey)
            $input = Ox.Input({
                autocomplete: findKey.values,
                autocompleteSelect: true,
                autocompleteSelectSubmit: true,
                value: value,
                width: 288
            });
        } else if (findKey.format) {
            formatArgs = findKey.format.args
            formatType = findKey.format.type;
            if (formatType == 'color') {
                isHue = formatArgs[0] == 'hue';
                $input = Ox.Range({
                    max: isHue ? 360 : 1,
                    min: 0,
                    size: !isArray ? 288 : 128, // fixme: should be width!
                    width: !isArray ? 288 : 128, // have to set this too, for formatting when tuple
                    step: isHue ? 1 : 0.01,
                    thumbSize: 48,
                    thumbValue: true,
                    trackColors: isHue ? [
                        'rgb(255, 0, 0)', 'rgb(255, 255, 0)',
                        'rgb(0, 255, 0)', 'rgb(0, 255, 255)',
                        'rgb(0, 0, 255)', 'rgb(255, 0, 255)',
                        'rgb(255, 0, 0)'
                    ] : ['rgb(0, 0, 0)', 'rgb(255, 255, 255)'],
                    value: value
                });
            } else if (formatType == 'date') {
                $input = Ox.DateInput(!isArray ? {
                    value: value,
                    width: {day: 66, month: 66, year: 140}
                } : {
                    value: value,
                    width: {day: 32, month: 32, year: 48}
                });
            } else if (formatType == 'duration') {
                $input = Ox.TimeInput(!isArray ? {
                    seconds: true,
                    value: value,
                    width: {hours: 91, minutes: 91, seconds: 90}
                } : {
                    seconds: true,
                    value: value,
                    width: {hours: 38, minutes: 37, seconds: 37}
                });
            } else if (formatType == 'number') {
                $input = Ox.Input({
                    type: type,
                    value: value,
                    width: 288
                });
            } else if (formatType == 'resolution') {
                $input = Ox.InputGroup({
                    inputs: [
                        Ox.Input({
                            id: 'width',
                            type: 'int',
                            value: value
                        }),
                        Ox.Input({
                            id: 'height',
                            type: 'int',
                            value: value
                        })
                    ],
                    separators: [{title: 'x', width: 16}],
                    width: !isArray ? 288 : 128
                })
            } else if ([
                'currency', 'percent', 'unit', 'value'
            ].indexOf(formatType) > -1) {
                title = formatType == 'percent' ? '%' : formatArgs[0];
                $input = Ox.FormElementGroup({
                    elements: [
                        Ox.Input({
                            type: type,
                            value: value,
                            width: !isArray ? 240 : 80
                        }),
                        formatType == 'value' ? Ox.Select({
                            overlap: 'left',
                            items: ['K', 'M', 'G', 'T'].map(function(prefix, i) {
                                return {id: Math.pow(1000, i + 1), title: prefix + title};
                            }),
                            width: 48
                        }) : Ox.Label({
                            overlap: 'left',
                            textAlign: 'center',
                            title: title,
                            width: 48
                        })
                    ],
                    float: 'right',
                    join: function(value) {
                        return formatType == 'value'
                            ? value[0] * value[1]
                            : value[0];
                    },
                    split: function(value) {
                        
                    },
                    width: !isArray ? 288 : 128
                })
            }
        } else {
            $input = Ox.Input({
                type: type,
                value: value,
                width: !isArray ? 288 : 128
            });
        }
        return $input;
    }

    function triggerChangeEvent() {
        var query = Ox.clone(self.options.query, true);
        /*
        // FIXME: doesn't work for nested conditions
        query.conditions.forEach(function(condition) {
            // Ox.print('CO', condition.operator)
            condition.operator = condition.operator.replace(':', '');
        });
        */
        that.triggerEvent('change', {query: query});
    }

    /*@
    getList <f> getList
    @*/
    // fixme: is this the best way/name?
    that.getList = function() {
        if (self.$save) {
            var value = self.$save.value();
            return {
                save: value[0],
                name: value[1],
                query: self.options.query
            };
        }
    };

    return that;

};
