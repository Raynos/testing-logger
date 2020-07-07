'use strict'

const assert = require('assert')
const process = require('process')
const os = require('os')
const Buffer = require('buffer').Buffer

const DebugLogBackend = require('./debug-log-backend.js')

const LEVELS_BY_NAME = {
  trace: 10,
  debug: 20,
  info: 30,
  access: 35,
  warn: 40,
  error: 50,
  fatal: 60
}
const LEVELS_BY_VALUE = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  35: 'access',
  40: 'warn',
  50: 'error',
  60: 'fatal'
}

class DebugLogtron {
  constructor (namespace, opts = {}) {
    this.name = namespace

    this._backend = DebugLogBackend(this.name, opts)
    this._stream = this._backend.createStream()
  }

  whitelist (level, msg) { this._backend.whitelist(level, msg) }
  unwhitelist (level, msg) { this._backend.unwhitelist(level, msg) }
  items () { return this._backend.items() }
  popLogs (message) { return this._backend.popLogs(message) }
  isEmpty () { return this._backend.isEmpty() }

  _log (level, msg, meta, cb = noop) {
    const logMessage = new LogMessage(level, msg, meta)
    isValidMessage(logMessage)

    this._stream.write(logMessage, cb)
  }

  trace (msg, meta, cb) {
    this._log(LEVELS_BY_NAME.trace, msg, meta, cb)
  }

  debug (msg, meta, cb) {
    this._log(LEVELS_BY_NAME.debug, msg, meta, cb)
  }

  info (msg, meta, cb) {
    this._log(LEVELS_BY_NAME.info, msg, meta, cb)
  }

  access (msg, meta, cb) {
    this._log(LEVELS_BY_NAME.access, msg, meta, cb)
  }

  warn (msg, meta, cb) {
    this._log(LEVELS_BY_NAME.warn, msg, meta, cb)
  }

  error (msg, meta, cb) {
    this._log(LEVELS_BY_NAME.error, msg, meta, cb)
  }

  fatal (msg, meta, cb) {
    this._log(LEVELS_BY_NAME.fatal, msg, meta, cb)
  }
}

DebugLogtron.LogMessage = LogMessage
module.exports = DebugLogtron

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
    const logRecord = this.toLogRecord()

    const jsonStr = JSON.stringify(logRecord._logData)
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
