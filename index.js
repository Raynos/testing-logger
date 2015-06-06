'use strict';

var TypedError = require('error/typed');

var LogMessage = require('./log-message.js');
var DebugLogBackend = require('./backends/debug-log-backend.js');
var LEVELS = require('./levels.js').LEVELS_BY_NAME;

var validNamespaceRegex = /^[a-zA-Z0-9]+$/;
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

function DebugLogtron(namespace, opts) {
    if (!(this instanceof DebugLogtron)) {
        return new DebugLogtron(namespace, opts);
    }

    var isValid = validNamespaceRegex.test(namespace);
    if (!isValid) {
        var hasHypen = namespace.indexOf('-') >= 0;
        var hasSpace = namespace.indexOf(' ') >= 0;

        throw InvalidNamespaceError({
            namespace: namespace,
            badChar: hasHypen ? '-' : hasSpace ? 'space' : 'bad',
            reason: hasHypen ? 'hypen' :
                hasSpace ? 'space' : 'unknown'
        });
    }

    opts = opts || {};

    this.name = namespace;

    this._backend = DebugLogBackend(namespace, opts);
    this._stream = this._backend.createStream();
}

DebugLogtron.prototype._log = function _log(level, msg, meta, cb) {
    var logMessage = new LogMessage(level, msg, meta);
    LogMessage.isValid(logMessage);

    this._stream.write(logMessage, cb);
};

DebugLogtron.prototype.trace = function trace(msg, meta, cb) {
    this._log(LEVELS.trace, msg, meta, cb);
};

DebugLogtron.prototype.debug = function debug(msg, meta, cb) {
    this._log(LEVELS.debug, msg, meta, cb);
};

DebugLogtron.prototype.info = function info(msg, meta, cb) {
    this._log(LEVELS.info, msg, meta, cb);
};

DebugLogtron.prototype.access = function access(msg, meta, cb) {
    this._log(LEVELS.access, msg, meta, cb);
};

DebugLogtron.prototype.warn = function warn(msg, meta, cb) {
    this._log(LEVELS.warn, msg, meta, cb);
};

DebugLogtron.prototype.error = function error(msg, meta, cb) {
    this._log(LEVELS.error, msg, meta, cb);
};

DebugLogtron.prototype.fatal = function fatal(msg, meta, cb) {
    this._log(LEVELS.fatal, msg, meta, cb);
};

DebugLogtron.prototype.whitelist = function whitelist(level, msg) {
    this._backend.whitelist(level, msg);
};

DebugLogtron.prototype.items = function items() {
    return this._backend.records;
};
