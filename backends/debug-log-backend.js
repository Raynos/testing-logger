'use strict';

var inspect = require('util').inspect;
var process = require('process');
var globalConsole = require('console');

/* Three steps

    - inline debuglog
    - add colors
    - add verbose mode; default is WARN + ERROR; verbose === all

*/

module.exports = DebugLogBackend;

function DebugLogBackend(namespace, opts) {
    if (!(this instanceof DebugLogBackend)) {
        return new DebugLogBackend(namespace, opts);
    }

    var self = this;

    self.console = opts.console || globalConsole;
    /*eslint no-process-env: 0*/
    self.env = opts.env || process.env;
    self.namespace = namespace.toUpperCase();

    var debugEnviron = self.env.NODE_DEBUG || '';
    var regex = new RegExp('\\b' + self.namespace + '\\b', 'i');

    self.enabled = regex.test(debugEnviron);
}

DebugLogBackend.prototype.createStream = function createStream() {
    var self = this;

    return DebugLogStream(self.namespace, {
        console: self.console
    });
};

function DebugLogStream(namespace, opts) {
    if (!(this instanceof DebugLogStream)) {
        return new DebugLogStream(namespace, opts);
    }

    var self = this;

    self.namespace = namespace;
    self.console = opts.console;
}

DebugLogStream.prototype.write = function write(logRecord, cb) {
    var self = this;

    var msg = self.formatMessage(logRecord);
    self.console.error(msg);

    if (cb) {
        cb();
    }
};

DebugLogStream.prototype.formatMessage =
function formatMessage(logRecord) {
    var self = this;
    var pid = process.pid;

    return self.namespace + ' ' + pid + ': ' +
        logRecord.levelName + ': ' +
        logRecord.fields.msg + ' ~ ' +
        inspect(logRecord.meta);
};
