'use strict';

var test = require('tape');
var process = require('process/');
var os = require('os');

var DebugLogtron = require('../index.js');
var LogMessage = require('../log-message.js');
var JSONLogRecord = LogMessage.JSONLogRecord;

test('DebugLogtron is a function', function t(assert) {
    assert.equal(typeof DebugLogtron, 'function');
    assert.end();
});

test('can create logger', function t(assert) {
    var logger = allocLogger();

    logger.debug('hi');

    assert.equal(logger.lines.length, 1);

    var line = logger.lines[0];
    assert.ok(line.msg.indexOf('debug: hi ~ null') >= 0);

    assert.end();
});

test('can log async', function t(assert) {
    var logger = allocLogger();

    logger.debug('oh hi', {}, onLogged);

    function onLogged(err) {
        assert.ifError(err);
        assert.equal(logger.lines.length, 1);

        var line = logger.lines[0];
        assert.ok(line.msg.indexOf('debug: oh hi ~ {}') >= 0);

        assert.end();
    }
});

test('logger throws with bad namespace', function t(assert) {
    assert.throws(function throwIt() {
        DebugLogtron('bad name');
    }, /found space character/);
    assert.throws(function throwIt() {
        DebugLogtron('bad-name');
    }, /found - character/);
    assert.throws(function throwIt() {
        DebugLogtron('bad#name');
    }, /found bad character/);

    assert.end();
});

test('logger defaults opts', function t(assert) {
    assert.doesNotThrow(function noThrow() {
        DebugLogtron('somenamespace');
    });

    assert.end();
});

test('logger levels', function t(assert) {
    /*eslint max-statements: 0*/
    var logger = allocLogger();

    logger.trace('trace');
    logger.debug('debug');
    logger.info('info');
    logger.access('access');
    logger.warn('warn');
    logger.error('error');
    logger.fatal('fatal');

    assert.equal(logger.lines.length, 7);

    var line = logger.lines[0];
    assert.ok(line.msg.indexOf('trace: trace ~ null') >= 0);

    var line2 = logger.lines[1];
    assert.ok(line2.msg.indexOf('debug: debug ~ null') >= 0);

    var line3 = logger.lines[2];
    assert.ok(line3.msg.indexOf('info: info ~ null') >= 0);

    var line4 = logger.lines[3];
    assert.ok(line4.msg.indexOf('access: access ~ null') >= 0);

    var line5 = logger.lines[4];
    assert.ok(line5.msg.indexOf('warn: warn ~ null') >= 0);

    var line6 = logger.lines[5];
    assert.ok(line6.msg.indexOf('error: error ~ null') >= 0);

    var line7 = logger.lines[6];
    assert.ok(line7.msg.indexOf('fatal: fatal ~ null') >= 0);

    assert.end();
});

test('fails with string meta', function t(assert) {
    assert.throws(function throwIt() {
        var logger = allocLogger();

        logger.info('hi', 'string meta');
    }, /meta must be an object/);

    assert.end();
});

test('serialize meta', function t(assert) {
    var logger = allocLogger();

    logger.info('hello', {
        complex: {
            nested: true, foo: 'bar'
        }
    });

    assert.equal(logger.lines.length, 1);
    var line = logger.lines[0];

    assert.ok(line.msg.indexOf('info: hello ~ ' +
        '{ complex: { nested: true, foo: \'bar\' } }') >= 0);

    assert.end();
});

test('JSONLogRecord without new', function t(assert) {
    var logRecord = JSONLogRecord(20, 'hi', null);

    assert.ok(logRecord);
    assert.equal(logRecord.levelName, 'debug');
    assert.equal(logRecord.meta, null);
    assert.equal(logRecord.fields.msg, 'hi');

    assert.end();
});

test('LogMessage without new', function t(assert) {
    var logMessage = LogMessage(20, 'hi', null);

    assert.ok(logMessage);
    assert.equal(logMessage.levelName, 'debug');
    assert.equal(logMessage.meta, null);
    assert.equal(logMessage.msg, 'hi');

    assert.end();
});

test('LogMessage to buffer', function t(assert) {
    var hostname = os.hostname();

    var time = (new Date()).toISOString();
    var logMessage = LogMessage(20, 'hi', null, time);

    var buf = logMessage.toBuffer();

    assert.equal(String(buf),
        '{"name":null,' +
        '"hostname":"' + hostname + '",' +
        '"pid":' + process.pid + ',' +
        '"component":null,' +
        '"level":20,' +
        '"msg":"hi",' +
        '"time":"' + time + '",' +
        '"src":null,' +
        '"v":0}'
    );

    var buf2 = logMessage.toBuffer();
    assert.equal(buf, buf2);

    var logRecord = logMessage.toLogRecord();
    var logRecord2 = logMessage.toLogRecord();
    assert.equal(logRecord, logRecord2);

    assert.end();
});

function allocLogger() {
    var logger = DebugLogtron('debuglogtrontestcode', {
        env: {
            NODE_DEBUG: 'debuglogtrontestcode'
        },
        console: {
            error: function logStatement(msg) {
                logger.lines.push({
                    msg: msg
                });
            }
        }
    });
    logger.lines = [];

    return logger;
}
