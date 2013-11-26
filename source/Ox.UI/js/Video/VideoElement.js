'use strict';

/*@
Ox.VideoElement <f> VideoElement Object
    options <o> Options object
        autoplay <b|false> autoplay
        items <a|[]> array of objects with src,in,out,duration
        look <b|false> loop playback
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> VideoElement Object
        loadedmetadata <!> loadedmetadata
        itemchange <!> itemchange
        seeked <!> seeked
        seeking <!> seeking
        sizechange <!> sizechange
        ended <!> ended
@*/

Ox.VideoElement = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            autoplay: false,
            loop: false,
            items: []
        })
        .options(options || {})
        .update({
            items: function() {
                self.loadedMetadata = false;
                loadItems(function() {
                    var update = true;
                    if (self.currentItem >= self.numberOfItems) {
                        self.currentItem = 0;
                    }
                    if (!self.numberOfItems) {
                        self.video.src = '';
                        that.triggerEvent('durationchange', {
                            duration: that.duration()
                        });
                    } else {
                        if (self.currentItemId != self.items[self.currentItem].id) {
                            // check if current item is in new items
                            self.items.some(function(item, i) {
                                if (item.id == self.currentItemId) {
                                    self.currentItem = i;
                                    loadNextVideo();
                                    update = false;
                                    return true;
                                }
                            });
                            if (update) {
                                self.currentItem = 0;
                                self.currentItemId = self.items[self.currentItem].id;
                                setCurrentVideo();
                            }
                        }
                        onLoadedMetadata(self.$video, function() {
                            that.triggerEvent('seeked');
                            that.triggerEvent('durationchange', {
                                duration: that.duration()
                            });
                        });
                    }
                });
            }
        })
        .css({width: '100%', height: '100%'});

    Ox.Log('Video', 'VIDEO ELEMENT OPTIONS', self.options);

    self.currentItem = 0;
    self.currentTime = 0;
    self.currentVideo = 0;
    self.loadedMetadata = false;
    self.paused = true;
    self.seeking = false;
    self.$videos = [getVideo(), getVideo()];
    self.$video = self.$videos[self.currentVideo];
    self.video = self.$video[0];
    self.$brightness = $('<div>').css({
            width: '100%',
            height: '100%',
            background: 'rgb(0, 0, 0)',
            opacity: 0
        })
        .appendTo(that);

    loadItems(function() {
        setCurrentItem(0);
        self.options.autoplay && play();
        onLoadedMetadata(self.$video, function() {
            that.triggerEvent('loadedmetadata');
        });
    });

    function getCurrentTime() {
        var item = self.items[self.currentItem];
        return self.seeking
            ? self.currentTime
            : item ? item.position + self.video.currentTime - item['in'] : 0;
    }

    function getset(key, value) {
        var ret;
        if (Ox.isUndefined(value)) {
            ret = self.video[key];
        } else {
            self.video[key] = value;
            ret = that;
        }
        return ret;
    }

    function getVideo() {
        return $('<video>')
            .css({position: 'absolute'})
            .on({
                ended: function() {
                    if (self.video == this) {
                        setCurrentItem(self.currentItem + 1);
                    }
                },
                loadedmetadata: function() {
                    // metadata loaded in loadItems
                },
                progress: function() {
                    // not implemented
                },
                seeked: function() {
                    if (self.video == this) {
                        that.triggerEvent('seeked');
                        self.seeking = false;
                    }
                },
                seeking: function() {
                    //seeking event triggered in setCurrentTime
                },
                stop: function() {
                    if (self.video == this) {
                        self.video.pause();
                        that.triggerEvent('ended');
                    }
                },
                timeupdate: function() {
                    if (self.video == this) {
                        if (self.items[self.currentItem]
                            && self.items[self.currentItem].out
                            && this.currentTime >= self.items[self.currentItem].out) {
                            setCurrentItem(self.currentItem + 1);
                        }
                    }
                }
            })
            .attr({
                preload: 'auto'
            })
            .hide()
            .appendTo(that);
    }

    function loadItems(callback) {
        var currentTime = 0, i =0,
            items = self.options.items.map(function(item) {
                return Ox.isObject(item) ? Ox.clone(item, true) : {src: item};
            });
        next();

        function getId(item) {
            return item.src + '/' + item['in'] + '-' + item.out;
        }

        function next() {
            var item;
            if (i < items.length) {
                item = items[i];
                item['in'] = item['in'] || 0;
                item.position = currentTime;
                if (item.out) {
                    item.duration = item.out - item['in'];
                }
                if (item.duration) {
                    if (!item.out) {
                        item.out = item.duration - item['in'];
                    }
                    currentTime += item.duration;
                    item.id = getId(item);
                    i++;
                    next()
                } else {
                    Ox.Log('VIDEO', 'getVideoInfo', item.src);
                    Ox.getVideoInfo(item.src, function(info) {
                        item.duration = info.duration;
                        if (!item.out) {
                            item.out = item['in'] + item.duration;
                        }
                        currentTime += item.duration;
                        item.id = getId(item);
                        i++;
                        next();
                    });
                }
            } else {
                self.loadedMetadata = true;
                self.items = items;
                self.numberOfItems = self.items.length;
                callback && callback();
            }
        }
    }

    function loadNextVideo() {
        if (self.numberOfItems <= 1) {
            return;
        }
        var item = self.items[self.currentItem],
            nextItem = Ox.mod(self.currentItem + 1, self.numberOfItems),
            next = self.items[nextItem],
            $nextVideo = self.$videos[Ox.mod(self.currentVideo + 1, self.$videos.length)],
            nextVideo = $nextVideo[0];
        nextVideo.src = next.src;
        onLoadedMetadata($nextVideo, function() {
            nextVideo.currentTime = next['in'] || 0;
        });
    }

    function onLoadedMetadata($video, callback) {
        if ($video[0].readyState) {
            callback();
        } else {
            $video.one('loadedmetadata', function(event) {
                callback();
            });
        }
    }

    function setCurrentItem(item) {
        Ox.Log('Video', 'sCI', item, self.numberOfItems);
        var interval;
        if (item >= self.numberOfItems || item < 0) {
            if (self.options.loop) {
                item = Ox.mod(item, self.numberOfItems);
            } else {
                self.seeking = false;
                self.ended = true;
                self.paused = true;
                self.video && self.video.pause();
                that.triggerEvent('ended');
                return;
            }
        }
        self.video && self.video.pause();
        //fixme always sync now?
        set();
        function set() {
            self.currentItem = item;
            self.currentItemId = self.items[self.currentItem].id;
            setCurrentVideo();
            onLoadedMetadata(self.$video, function() {
                that.triggerEvent('sizechange');
                that.triggerEvent('itemchange', {
                    item: self.currentItem
                });
            });
        }
    }

    function setCurrentVideo() {
        var css = {},
            muted = false,
            volume = 1,
            item = self.items[self.currentItem],
            next;
        Ox.Log('Video', 'sCV', item);
        ['left', 'top', 'width', 'height'].forEach(function(key) {
            css[key] = self.$videos[self.currentVideo].css(key);
        });
        if (self.video) {
            self.$videos[self.currentVideo].hide();
            self.video.pause();
            volume = self.video.volume;
            muted = self.video.muted;
        }
        self.currentVideo = Ox.mod(self.currentVideo + 1, self.$videos.length);
        self.$video = self.$videos[self.currentVideo];
        self.video = self.$video[0];
        if (self.$video.attr('src') != item.src) {
            self.video.src = item.src;
        }
        self.video.volume = volume;
        self.video.muted = muted;
        self.$video.css(css).show();
        !self.paused && self.video.play();
        Ox.Log('Video', 'sCV', self.video.src, item['in']);
        if (item['in']) {
            setCurrentItemTime(item['in']);
        }
        loadNextVideo();
    }

    function setCurrentItemTime(currentTime) {
        Ox.Log('Video', 'sCIT', currentTime, self.video.currentTime, 'delta', currentTime - self.video.currentTime);
        if (currentTime != self.video.currentTime) {
            onLoadedMetadata(self.$video, function() {
                self.video.currentTime = currentTime;
            });
        } else {
            that.triggerEvent('seeked');
        }
    }

    function setCurrentTime(time) {
        Ox.Log('Video', 'sCT', time);
        var currentTime, currentItem;
        self.items.forEach(function(item, i) {
            if (time >= item.position
                && time < item.position + item.duration) {
                currentItem = i;
                currentTime = time - item.position + item['in'];
                return false;
            }
        });
        if (self.items.length) {
            // Set to end of items if time > duration
            if (Ox.isUndefined(currentItem) && Ox.isUndefined(currentTime)) {
                currentItem = self.items.length -1;
                currentTime = self.items[currentItem].duration + self.items[currentItem]['in'];
            }
            Ox.Log('Video', 'sCT', time, '=>', currentItem, currentTime);
            if (currentItem != self.currentItem) {
                setCurrentItem(currentItem);
            }
            self.seeking = true;
            self.currentTime = time;
            that.triggerEvent('seeking');
            setCurrentItemTime(currentTime);
        } else {
            self.currentTime = 0;
        }
    }

    /*@
    animate <f> animate
    @*/
    that.animate = function() {
        self.$video.animate.apply(self.$video, arguments);
        return that;
    };

    /*@
    brightness <f> get/set brightness
    @*/
    that.brightness = function() {
        var ret;
        if (arguments.length == 0) {
            ret = 1 - parseFloat(self.$brightness.css('opacity'));
        } else {
            self.$brightness.css({opacity: 1 - arguments[0]});
            ret = that;
        }
        return ret;
    };

    /*@
    buffered <f> buffered
    @*/
    that.buffered = function() {
        return self.video.buffered;
    };

    /*@
    currentTime <f> get/set currentTime
    @*/
    that.currentTime = function() {
        var ret;
        if (arguments.length == 0) {
            ret = getCurrentTime();
        } else {
            self.ended = false;
            setCurrentTime(arguments[0]);
            ret = that;
        }
        return ret;
    };

    /*@
    css <f> css
    @*/
    that.css = function() {
        self.$video.css.apply(self.$video, arguments);
        return that;
    };

    /*@
    duration <f> duration
    @*/
    that.duration = function() {
        return self.items ? Ox.sum(self.items.map(function(item) {
            return item.duration;
        })) : NaN;
    };

    /*@
    muted <f> get/set muted
    @*/
    that.muted = function() {
        return getset('muted', arguments[0]);
    };

    /*@
    pause <f> pause
    @*/
    that.pause = function() {
        self.paused = true;
        self.video.pause();
        return that;
    };

    /*@
    play <f> play
    @*/
    that.play = function() {
        if (self.ended) {
            that.currentTime(0);
        }
        self.ended = false;
        self.paused = false;
        self.seeking = false;
        self.video.play();
        return that;
    };

    /*@
    videoHeight <f> get videoHeight
    @*/
    that.videoHeight = function() {
        return self.video.videoHeight;
    };

    /*@
    videoWidth <f> get videoWidth
    @*/
    that.videoWidth = function() {
        return self.video.videoWidth;
    };

    /*@
    volume <f> get/set volume
    @*/
    that.volume = function(value) {
        return getset('volume', arguments[0]);
    };

    return that;

};
