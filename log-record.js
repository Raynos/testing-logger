'use strict';

var assert = require('assert/');
var process = require('process/');
var os = require('os');
var Buffer = require('buffer').Buffer;
var CircularJSON = require('circular-json');
var extend = require('xtend');

var LEVELS = require('./levels.js');

LogRecord.isValid = isValid;
LogRecord.JSONLogRecord = JSONLogRecord;

module.exports = LogRecord;

function LogRecord(level, msg, meta) {
    if (!(this instanceof LogRecord)) {
        return new LogRecord(level, msg, meta);
    }

    this.level = level;
    this.msg = msg;

    this.meta = (meta === null || meta === void 0) ? null : meta;

    this._jsonLogRecord = null;
    this._buffer = null;
}

var proto = LogRecord.prototype;

proto.toLogRecord = function toBuffer() {
    if (!this._jsonLogRecord) {
        this._jsonLogRecord = new JSONLogRecord(
            this.level, this.msg, this.meta);
    }

    return this._jsonLogRecord;
};

proto.toBuffer = function toBuffer() {
    if (!this._buffer) {
        var logRecord = this.toLogRecord();

        var jsonStr = CircularJSON.stringify(logRecord.fields);
        this._buffer = new Buffer(jsonStr);
    }

    return this._buffer;
};

/* JSONLogRecord. The same interface as bunyan on the wire */
function JSONLogRecord(level, msg, meta) {
    if (!(this instanceof JSONLogRecord)) {
        return new JSONLogRecord(level, msg, meta);
    }

    this.fields = extend(meta, {
        name: null,
        hostname: os.hostname(),
        pid: process.pid,
        component: null,
        level: level,
        msg: msg,
        time: (new Date()).toISOString(),
        src: null,
        v: 0
    });

    this.levelName = LEVELS[level];
    this.meta = meta;
}

function isValid(logRecord) {
    assert(typeof logRecord.level === 'number',
        'level must be a number');
    assert(typeof logRecord.msg === 'string',
        'msg must be a string');

    assert(logRecord.meta === null ||
        typeof logRecord.meta === 'object',
        'meta must be an object');
}
