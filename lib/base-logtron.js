'use strict';

var assert = require('assert');
var collectParallel = require('collect-parallel/array');

var LogMessage = require('./log-message.js');
var LEVELS = require('./levels.js').LEVELS_BY_NAME;

module.exports = BaseLogtron;

function BaseLogtron(opts) {
    /* istanbul ignore next */
    if (!(this instanceof BaseLogtron)) {
        return new BaseLogtron(opts);
    }

    assert(Array.isArray(opts.streams),
        'opts.streams must be an array');

    this._streams = opts.streams;
}

BaseLogtron.prototype._log = function _log(level, msg, meta, cb) {
    var logMessage = new LogMessage(level, msg, meta);
    LogMessage.isValid(logMessage);

    collectParallel(this._streams, writeMessage, cb || noop);

    function writeMessage(stream, i, callback) {
        stream.write(logMessage, callback);
    }
};

BaseLogtron.prototype.trace = function trace(msg, meta, cb) {
    this._log(LEVELS.trace, msg, meta, cb);
};

BaseLogtron.prototype.debug = function debug(msg, meta, cb) {
    this._log(LEVELS.debug, msg, meta, cb);
};

BaseLogtron.prototype.info = function info(msg, meta, cb) {
    this._log(LEVELS.info, msg, meta, cb);
};

BaseLogtron.prototype.access = function access(msg, meta, cb) {
    this._log(LEVELS.access, msg, meta, cb);
};

BaseLogtron.prototype.warn = function warn(msg, meta, cb) {
    this._log(LEVELS.warn, msg, meta, cb);
};

BaseLogtron.prototype.error = function error(msg, meta, cb) {
    this._log(LEVELS.error, msg, meta, cb);
};

BaseLogtron.prototype.fatal = function fatal(msg, meta, cb) {
    this._log(LEVELS.fatal, msg, meta, cb);
};

function noop() {}
