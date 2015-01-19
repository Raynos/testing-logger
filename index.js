'use strict';

var TypedError = require('error/typed');

var LogRecord = require('./log-record.js');
var DebugLogBackend = require('./backends/debug-log-backend.js');
var LEVELS = require('./levels.js');

var validNamespaceRegex = /[a-zA-Z0-9]+/;
var InvalidNamespaceError = TypedError({
    type: 'debug-logtron.invalid-argument.namespace',
    message: 'Unexpected characters in the `namespace` arg.\n' +
        'Expected the namespace to be a bare word but instead ' +
            'found {badChar} character.\n' +
        'SUGGESTED FIX: Use just alphanum in the namespace.\n',
    badChar: null,
    reason: null,
    namespace: null
});

module.exports = DebugLogtron;

function DebugLogtron(namespace) {
    if (!(this instanceof DebugLogtron)) {
        return new DebugLogtron(namespace);
    }

    var isValid = validNamespaceRegex.test(namespace);
    if (!isValid) {
        var hasHypen = namespace.indexOf('-') >= 0;
        var hasSpace = namespace.indexOf(' ') >= 0;

        throw InvalidNamespaceError({
            namespace: namespace,
            badChar: hasHypen ? '-' : hasSpace ? ' ' : 'bad',
            reason: hasHypen ? 'hypen' :
                hasSpace ? 'space' : 'unknown'
        });
    }

    this.name = namespace;

    this._backend = DebugLogBackend(namespace);
    this._stream = this._backend.createStream();
}

var proto = DebugLogtron.prototype;

proto._log = function _log(level, msg, meta, cb) {
    var logRecord = new LogRecord(level, msg, meta);
    LogRecord.isValid(logRecord);

    logRecord.name = this.name;

    this._stream.write(logRecord);
};

proto.debug = function debug(msg, meta, cb) {
    this._log(LEVELS.debug, msg, meta, cb);
};

proto.info = function info(msg, meta, cb) {
    this._log(LEVELS.info, msg, meta, cb);
};

proto.warn = function warn(msg, meta, cb) {
    this._log(LEVELS.warn, msg, meta, cb);
};

proto.error = function error(msg, meta, cb) {
    this._log(LEVELS.error, msg, meta, cb);
};

proto.fatal = function fatal(msg, meta, cb) {
    this._log(LEVELS.fatal, msg, meta, cb);
};
