'use strict';

/*@
Ox.getVideoFormat <f> Get supported video format
    (formats) -> <a> List of supported formats
    format <s> First supported format form list
@*/
Ox.getVideoFormat = function(formats) {
    var aliases = {
						/*wafaa*/
            /*mp4: 'h264',
            m4v: 'h264',
            ogv: 'ogg',*/
						png: 'png'
        },
        tests = {
						/*wafaa*/
            /*h264: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
            ogg: 'video/ogg; codecs="theora, vorbis"',
            webm: 'video/webm; codecs="vp8, vorbis"',*/
            png: 'image/png'
        },
        userAgent = navigator.userAgent.toLowerCase(),
				/*wafaa*/
        /*video = document.createElement('video'),*/
        video = document.createElement('img'),
        videoFormat;
    Ox.forEach(formats, function(format) {
        var alias = aliases[format] || format;
    		videoFormat = format;
				/*wafaa
        if (video.canPlayType && video.canPlayType(tests[alias]).replace('no', '')) {
            // disable WebM on Safari/Perian, seeking does not work
            if (!(
                alias == 'webm' && /safari/.test(userAgent)
                && !/chrome/.test(userAgent) && !/linux/.test(userAgent)
            )) {
                videoFormat = format;
                return false; // break
            }
        }
				*/
    });
				/*wafaa*/
    return videoFormat;
};

/*@
Ox.getVideoInfo <f>
    url <s> video url
    callback <f> gets called with object containing duration, width, height
@*/
Ox.getVideoInfo = Ox.queue(function(url, callback) {
		/*wafaa*/
    /*var video = document.createElement('video');*/
    var video = document.createElement('img');
    video.addEventListener('loadedmetadata', function(event) {
        var info = {
            duration: this.duration,
            widht: this.videoWidth,
            height: this.videoHeight,
        };
        this.src = '';
        video = null;
        callback(info);
    });
    video.preload = 'metadata';
    video.src = url;
}, 4);
