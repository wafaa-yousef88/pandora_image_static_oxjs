'use strict';

//@ Ox.AMPM <[s]> ['AM', 'PM']
Ox.AMPM = ['AM', 'PM'];
//@ Ox.BASE_32_ALIASES <o> Base 32 aliases
Ox.BASE_32_ALIASES = {'I': '1', 'L': '1', 'O': '0', 'U': 'V'},
//@ Ox.BASE_32_DIGITS <o> Base 32 digits
Ox.BASE_32_DIGITS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
//@ Ox.BCAD <[s]> ['BC', 'AD']
Ox.BCAD = ['BC', 'AD'];
/*@
Ox.EARTH_RADIUS <n> Radius of the earth in meters
    See http://en.wikipedia.org/wiki/WGS-84
*/
Ox.EARTH_RADIUS = 6378137;
//@ Ox.EARTH_CIRCUMFERENCE <n> Circumference of the earth in meters
Ox.EARTH_CIRCUMFERENCE = 2 * Math.PI * Ox.EARTH_RADIUS;
//@ Ox.EARTH_SURFACE <n> Surface of the earth in square meters
Ox.EARTH_SURFACE = 4 * Math.PI * Math.pow(Ox.EARTH_RADIUS, 2);
//@ Ox.HTML_ENTITIES <o> HTML entities for ... (FIXME)
Ox.HTML_ENTITIES = {
    '"': '&quot;', '&': '&amp;', "'": '&apos;', '<': '&lt;', '>': '&gt;'
};
//@ Ox.KEYS <o> Names for key codes
// The dot notation ('0.numpad') allows for namespaced events ('key_0.numpad'),
// so that binding to 'key_0' will catch both 'key_0' and 'key_0.numpad'.
Ox.KEYS = {
    0: 'section', 8: 'backspace', 9: 'tab', 12: 'clear', 13: 'enter',
    16: 'shift', 17: 'control', 18: 'alt', 20: 'capslock', 27: 'escape',
    32: 'space', 33: 'pageup', 34: 'pagedown', 35: 'end', 36: 'home',
    37: 'left', 38: 'up', 39: 'right', 40: 'down',
    45: 'insert', 46: 'delete', 47: 'help',
    48: '0', 49: '1', 50: '2', 51: '3', 52: '4',
    53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
    65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e',
    70: 'f', 71: 'g', 72: 'h', 73: 'i', 74: 'j',
    75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o',
    80: 'p', 81: 'q', 82: 'r', 83: 's', 84: 't',
    85: 'u', 86: 'v', 87: 'w', 88: 'x', 89: 'y', 90: 'z',
    // fixme: this is usually 91: window.left, 92: window.right, 93: select
    91: 'meta.left', 92: 'meta.right', 93: 'meta.right',
    96: '0.numpad', 97: '1.numpad', 98: '2.numpad',
    99: '3.numpad', 100: '4.numpad', 101: '5.numpad',
    102: '6.numpad', 103: '7.numpad', 104: '8.numpad', 105: '9.numpad',
    106: 'asterisk.numpad', 107: 'plus.numpad', 109: 'minus.numpad',
    108: 'enter.numpad', 110: 'dot.numpad', 111: 'slash.numpad',
    112: 'f1', 113: 'f2', 114: 'f3', 115: 'f4', 116: 'f5',
    117: 'f6', 118: 'f7', 119: 'f8', 120: 'f9', 121: 'f10',
    122: 'f11', 123: 'f12', 124: 'f13', 125: 'f14', 126: 'f15',
    127: 'f16', 128: 'f17', 129: 'f18', 130: 'f19', 131: 'f20',
    144: 'numlock', 145: 'scrolllock',
    186: 'semicolon', 187: 'equal', 188: 'comma', 189: 'minus',
    190: 'dot', 191: 'slash', 192: 'backtick', 219: 'openbracket',
    220: 'backslash', 221: 'closebracket', 222: 'quote', 224: 'meta'
    // see dojo, for ex.
};
//@ Ox.LOCALE <s> Default locale
Ox.LOCALE = 'en';
//@ Ox.LOCALE_NAMES <o> Locale names
Ox.LOCALE_NAMES = {
    'ar': 'العربية',
//    'de': 'Deutsch',
    'en': 'English',
//    'fr': 'Français',
    'hi': 'हिंदी'
};
//@ Ox.LOCALES <o> Locales per module
Ox.LOCALES = {};
//@ Ox.MAX_LATITUDE <n> Maximum latitude of a Mercator projection
Ox.MAX_LATITUDE = Ox.deg(Math.atan(Ox.sinh(Math.PI)));
//@ Ox.MIN_LATITUDE <n> Minimum latitude of a Mercator projection
Ox.MIN_LATITUDE = -Ox.MAX_LATITUDE;
//@ Ox.MODIFIER_KEYS <o> Names for modifier keys
// meta comes last so that one can differentiate between
// alt_control_shift_meta.left and alt_control_shift_meta.right
Ox.MODIFIER_KEYS = {
    altKey: 'alt', // Mac: option
    ctrlKey: 'control',
    shiftKey: 'shift',
    metaKey: 'meta' // Mac: command
};
//@ Ox.MONTHS <[s]> Names of months
Ox.MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
//@ Ox.SHORT_MONTHS <[s]> Short names of months
Ox.SHORT_MONTHS = Ox.MONTHS.map(function(val) {
    return val.slice(0, 3);
});
//@ Ox.PATH <s> Path of Ox.js
Ox.PATH = (function() {
    // IE8 can't apply slice to NodeLists, see Ox.slice
    var index, regexp = /Ox\.js(\?\d+|)$/,
        scripts = document.getElementsByTagName('script'), src;
    for (index = scripts.length - 1; index >= 0; index--) {
        src = scripts[index].src;
        if (regexp.test(src)) {
            return src.replace(regexp, '');
        }
    }
}());
//@ Ox.MODE <s> Mode ('build' or 'dev')
Ox.MODE = Ox.PATH.slice(0, -1).split('/').pop();
//@ Ox.PREFIXES <[str]> `['', 'K', 'M', 'G', 'T', 'P']`
Ox.PREFIXES = ['', 'K', 'M', 'G', 'T', 'P'];
//@ Ox.SEASONS <[s]> Names of the seasons of the year
Ox.SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];
//@ Ox.STACK_SIZE <n> Maximum number of arguments
Ox.STACK_SIZE = 65536;
//@ Ox.SYMBOLS <o> Unicode characters for symbols
Ox.SYMBOLS = {
    DOLLAR: '\u0024', 
    CENT: '\u00A2', POUND: '\u00A3', CURRENCY: '\u00A4', YEN: '\u00A5',
    BULLET: '\u2022', ELLIPSIS: '\u2026', PERMILLE: '\u2030',
    COLON: '\u20A1', CRUZEIRO: '\u20A2', FRANC: '\u20A3', LIRA: '\u20A4',
    NAIRA: '\u20A6',  PESETA: '\u20A7', WON: '\u20A9', SHEQEL: '\u20AA',
    DONG: '\u20AB', EURO: '\u20AC', KIP: '\u20AD', TUGRIK: '\u20AE',
    DRACHMA: '\u20AF', PESO: '\u20B1', GUARANI: '\u20B2', AUSTRAL: '\u20B3',
    HRYVNIA: '\u20B4', CEDI: '\u20B5', TENGE: '\u20B8', RUPEE: '\u20B9',
    CELSIUS: '\u2103', FAHRENHEIT: '\u2109', POUNDS: '\u2114', OUNCE: '\u2125',
    OHM: '\u2126', KELVIN: '\u212A', ANGSTROM: '\u212B', INFO: '\u2139',
    LEFT: '\u2190', UP: '\u2191', RIGHT: '\u2192', DOWN: '\u2193',
    HOME: '\u2196', END: '\u2198', RETURN: '\u21A9',
    REDO: '\u21BA', UNDO: '\u21BB', PAGEUP: '\u21DE', PAGEDOWN: '\u21DF',
    CAPSLOCK: '\u21EA', TAB: '\u21E5', SHIFT: '\u21E7', INFINITY: '\u221E',
    CONTROL: '\u2303', COMMAND: '\u2318', ENTER: '\u2324', ALT: '\u2325',
    DELETE: '\u2326', CLEAR:'\u2327', BACKSPACE: '\u232B', OPTION: '\u2387',
    NAVIGATE: '\u2388', ESCAPE: '\u238B', EJECT: '\u23CF',
    SPACE: '\u2423', DIAMOND: '\u25C6',
    STAR: '\u2605', SOUND: '\u266B', TRASH: '\u267A', FLAG: '\u2691',
    ANCHOR: '\u2693', GEAR: '\u2699', ATOM: '\u269B', WARNING: '\u26A0',
    CUT: '\u2702', BACKUP: '\u2707', FLY: '\u2708', CHECK: '\u2713',
    CLOSE: '\u2715', BALLOT: '\u2717', WINDOWS: '\u2756',
    EDIT: '\uF802', CLICK: '\uF803', APPLE: '\uF8FF'
};
//@ Ox.VERSION <s> OxJS version number
Ox.VERSION = '0.1';
//@ Ox.WEEKDAYS <[s]> Names of weekdays
Ox.WEEKDAYS = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];
//@ Ox.SHORT_WEEKDAYS <[s]> Short names of weekdays
Ox.SHORT_WEEKDAYS = Ox.WEEKDAYS.map(function(val) {
    return val.slice(0, 3);
});
