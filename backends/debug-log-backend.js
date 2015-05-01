'use strict';

var inspect = require('util').inspect;
var process = require('process');
var globalConsole = require('console');
var chalk = require('chalk');

var COLOR_MAP = {
    fatal: 'bgRed',
    error: 'bgRed',
    warn: 'bgYellow',
    access: 'bgGreen',
    info: 'bgGreen',
    debug: 'bgBlue',
    trace: 'bgCyan'
};

/* Three steps

    - add verbose mode; default is WARN + ERROR; verbose === all
    - make error & fatal throw

*/

module.exports = DebugLogBackend;

function DebugLogBackend(namespace, opts) {
    if (!(this instanceof DebugLogBackend)) {
        return new DebugLogBackend(namespace, opts);
    }

    var self = this;

    self.console = opts.console || globalConsole;
    self.colors = typeof opts.colors === 'boolean' ?
        opts.colors : true;
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
        console: self.console,
        colors: self.colors
    });
};

function DebugLogStream(namespace, opts) {
    if (!(this instanceof DebugLogStream)) {
        return new DebugLogStream(namespace, opts);
    }

    var self = this;

    self.namespace = namespace;
    self.console = opts.console;
    self.colors = opts.colors;
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

    var prefix = self.namespace + ' ' + pid + ': ' +
        logRecord.levelName.toUpperCase();
    var color = COLOR_MAP[logRecord.levelName];

    if (self.colors) {
        prefix = chalk[color](prefix);
        prefix = chalk.bold(prefix);
    }

    return prefix + ': ' + logRecord.fields.msg + ' ~ ' +
        inspect(logRecord.meta);
};
