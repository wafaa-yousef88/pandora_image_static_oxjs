'use strict';

/*@
Ox.getImageFormat <f> Get supported image format
    (formats) -> <a> List of supported formats
    format <s> First supported format form list
@*/
Ox.getImageFormat = function(formats) {
    var aliases = {
		png: 'png'
        },
        tests = {
            png: 'image/png'
        },
        userAgent = navigator.userAgent.toLowerCase(),
				/*wafaa*/
        /*video = document.createElement('video'),*/
        image = document.createElement('img'),
        imageFormat;
    Ox.forEach(formats, function(format) {
        var alias = aliases[format] || format;
    		imageFormat = format;
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
    return imageFormat;
};

/*@
Ox.getImageInfo <f>
    url <s> image url
    callback <f> gets called with object containing duration, width, height
@*/
Ox.getImageInfo = Ox.queue(function(url, callback) {
		/*wafaa*/
    /*var video = document.createElement('video');*/
    var image = document.createElement('image');
    image.addEventListener('loadedmetadata', function(event) {
        var info = {
            duration: this.duration,
            widht: this.imageWidth,
            height: this.imageHeight,
        };
        this.src = '';
        image = null;
        callback(info);
    });
    image.preload = 'metadata';
    image.src = url;
}, 4);
