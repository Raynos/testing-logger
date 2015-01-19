'use strict';

var Writable = require('readable-stream/writable');
var globalDebuglog = require('debuglog');
var inspect = require('util/').inspect;

module.exports = DebugLogBackend;

function DebugLogBackend(namespace, opts) {
    if (!(this instanceof DebugLogBackend)) {
        return new DebugLogBackend(namespace, opts);
    }

    var debuglog = opts.debuglog ||
        /*istanbul ignore next */ globalDebuglog;

    this.log = debuglog(namespace);
}

var proto = DebugLogBackend.prototype;

proto.createStream = function createStream() {
    var self = this;
    var stream = new Writable({
        objectMode: true
    });

    stream._write = write;

    return stream;

    function write(logRecord, enc, cb) {
        var msg = logRecord.levelName + ': ' +
            logRecord.fields.msg + ' ~ ' +
            inspect(logRecord.meta);

        self.log(msg);
        cb();
    }
};
