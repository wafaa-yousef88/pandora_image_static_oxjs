'use strict';

/*@
Ox.oshash <f> Calculates oshash for a given file or blob object. Async.
@*/
Ox.oshash = function(file, callback) {

    // Needs to go via string to work for files > 2GB
    var hash = fromString(file.size.toString());

    read(0);

    function add(A, B) {
        var a, b, c, d; 
        d = A[3] + B[3];
        c = A[2] + B[2] + (d >> 16);
        d &= 0xffff;
        b = A[1] + B[1] + (c >> 16);
        c &= 0xffff;
        a = A[0] + B[0] + (b >> 16);
        b &= 0xffff;
        // Cut off overflow
        a &= 0xffff;
        return [a, b, c, d];
    }
    
    function fromData(s, offset) {
        offset = offset || 0;
        return [
            s.charCodeAt(offset + 6) + (s.charCodeAt(offset + 7) << 8),
            s.charCodeAt(offset + 4) + (s.charCodeAt(offset + 5) << 8),
            s.charCodeAt(offset + 2) + (s.charCodeAt(offset + 3) << 8),
            s.charCodeAt(offset + 0) + (s.charCodeAt(offset + 1) << 8)
        ];
    }

    function fromString(str) {
        var base = 10,
            blen = 1,
            i,
            num,
            pos,
            r = [0, 0, 0, 0];
        for (pos = 0; pos < str.length; pos++) {
            num = parseInt(str.charAt(pos), base);
            i = 0;
            do {
                while (i < blen) {
                    num += r[3 - i] * base;
                    r[3 - i++] = (num & 0xFFFF);
                    num >>>= 16;
                }
                if (num) {
                    blen++;
                }
            } while (num);
        }
        return r;
    }

    function hex(h) {
        return (
            Ox.pad(h[0].toString(16), 'left', 4, '0')
            + Ox.pad(h[1].toString(16), 'left', 4, '0')
            + Ox.pad(h[2].toString(16), 'left', 4, '0')
            + Ox.pad(h[3].toString(16), 'left', 4, '0')
        ).toLowerCase();
    }

    function read(offset, last) {
        var blob,
            block = 65536,
            length = 8,
            reader = new FileReader();
        reader.onload = function(data) {
            var s = data.target.result,
                s_length = s.length - length,
                i;
            for (i = 0; i <= s_length; i += length) {
                hash = add(hash, fromData(s, i));
            }
            if (file.size < block || last) {
                callback(hex(hash));
            } else {
                read(file.size - block, true);
            }
        };
        if (file.mozSlice) {
            blob = file.mozSlice(offset, offset + block);
        } else if (file.webkitSlice) {
            blob = file.webkitSlice(offset, offset + block);
        } else {
            blob = file.slice(offset, offset + block);
        }
        reader.readAsBinaryString(blob);
    }

};
