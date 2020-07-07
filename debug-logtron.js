'use strict'

var collectParallel = require('collect-parallel/array')
var assert = require('assert')
var process = require('process/')
var os = require('os')
var Buffer = require('buffer').Buffer

var DebugLogBackend = require('./debug-log-backend.js')
var LEVELS_BY_VALUE = require('./levels.js').LEVELS_BY_VALUE
var LEVELS_BY_NAME = require('./levels.js').LEVELS_BY_NAME

DebugLogtron.LogMessage = LogMessage
module.exports = DebugLogtron

function DebugLogtron (namespace, opts) {
  if (!(this instanceof DebugLogtron)) {
    return new DebugLogtron(namespace, opts)
  }

  opts = opts || {}

  this.name = namespace

  this._backend = DebugLogBackend(this.name, opts)
  this._streams = [this._backend.createStream()]
}

DebugLogtron.prototype.whitelist = function whitelist (level, msg) {
  this._backend.whitelist(level, msg)
}

DebugLogtron.prototype.unwhitelist = function unwhitelist (level, msg) {
  this._backend.unwhitelist(level, msg)
}

DebugLogtron.prototype.items = function items () {
  return this._backend.items()
}

DebugLogtron.prototype.popLogs = function popLogs (message) {
  return this._backend.popLogs(message)
}

DebugLogtron.prototype.isEmpty = function isEmpty () {
  return this._backend.isEmpty()
}

DebugLogtron.prototype._log = function _log (level, msg, meta, cb) {
  var logMessage = new LogMessage(level, msg, meta)
  isValidMessage(logMessage)

  collectParallel(this._streams, writeMessage, cb || noop)

  function writeMessage (stream, i, callback) {
    stream.write(logMessage, callback)
  }
}

DebugLogtron.prototype.trace = function trace (msg, meta, cb) {
  this._log(LEVELS_BY_NAME.trace, msg, meta, cb)
}

DebugLogtron.prototype.debug = function debug (msg, meta, cb) {
  this._log(LEVELS_BY_NAME.debug, msg, meta, cb)
}

DebugLogtron.prototype.info = function info (msg, meta, cb) {
  this._log(LEVELS_BY_NAME.info, msg, meta, cb)
}

DebugLogtron.prototype.access = function access (msg, meta, cb) {
  this._log(LEVELS_BY_NAME.access, msg, meta, cb)
}

DebugLogtron.prototype.warn = function warn (msg, meta, cb) {
  this._log(LEVELS_BY_NAME.warn, msg, meta, cb)
}

DebugLogtron.prototype.error = function error (msg, meta, cb) {
  this._log(LEVELS_BY_NAME.error, msg, meta, cb)
}

DebugLogtron.prototype.fatal = function fatal (msg, meta, cb) {
  this._log(LEVELS_BY_NAME.fatal, msg, meta, cb)
}

function noop () {}

function LogMessage (level, msg, meta, time) {
  this.level = level
  this.levelName = LEVELS_BY_VALUE[level]
  this.msg = msg

  this.meta = (meta === null || meta === undefined) ? null : meta

  this._time = time
  this._jsonLogRecord = null
  this._buffer = null
}

LogMessage.prototype.toLogRecord = function toLogRecord () {
  if (!this._jsonLogRecord) {
    this._jsonLogRecord = new JSONLogRecord(
      this.level, this.msg, this.meta, this._time)
  }

  return this._jsonLogRecord
}

LogMessage.prototype.toBuffer = function toBuffer () {
  if (!this._buffer) {
    var logRecord = this.toLogRecord()

    var jsonStr = JSON.stringify(logRecord._logData)
    this._buffer = Buffer.from(jsonStr)
  }

  return this._buffer
}

/* JSONLogRecord. The same interface as bunyan on the wire */
function JSONLogRecord (level, msg, meta, time) {
  this._logData = new LogData(level, msg, meta, time)

  this.msg = msg
  this.levelName = LEVELS_BY_VALUE[level]
  this.meta = meta
}

function LogData (level, msg, meta, time) {
  this.name = null
  this.hostname = os.hostname()
  this.pid = process.pid
  this.component = null
  this.level = LEVELS_BY_VALUE[level]
  this.msg = msg
  this.time = time || (new Date()).toISOString()
  this.src = null
  this.v = 0

  // Non standard
  this.fields = meta
}

function isValidMessage (logRecord) {
  assert(typeof logRecord.level === 'number',
    'level must be a number')
  assert(typeof logRecord.msg === 'string',
    'msg must be a string')

  assert(logRecord.meta === null ||
        typeof logRecord.meta === 'object',
  'meta must be an object')
}
