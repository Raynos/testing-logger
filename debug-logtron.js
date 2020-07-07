'use strict'

var collectParallel = require('collect-parallel/array')

var LogMessage = require('./log-message.js')

var DebugLogBackend = require('./debug-log-backend.js')
var LEVELS = require('./levels.js').LEVELS_BY_NAME

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
  LogMessage.isValid(logMessage)

  collectParallel(this._streams, writeMessage, cb || noop)

  function writeMessage (stream, i, callback) {
    stream.write(logMessage, callback)
  }
}

// Logtron compatible writeEntry, assumes `entry` is a `logtron/entry`
DebugLogtron.prototype.writeEntry = function writeEntry (entry, cb) {
  var logMessage = new LogMessage(
    LEVELS[entry.level],
    entry.message,
    entry.meta,
    entry.path
  )

  LogMessage.isValid(logMessage)

  collectParallel(this._streams, writeMessage, cb || noop)

  function writeMessage (stream, i, callback) {
    stream.write(logMessage, callback)
  }
}

DebugLogtron.prototype.trace = function trace (msg, meta, cb) {
  this._log(LEVELS.trace, msg, meta, cb)
}

DebugLogtron.prototype.debug = function debug (msg, meta, cb) {
  this._log(LEVELS.debug, msg, meta, cb)
}

DebugLogtron.prototype.info = function info (msg, meta, cb) {
  this._log(LEVELS.info, msg, meta, cb)
}

DebugLogtron.prototype.access = function access (msg, meta, cb) {
  this._log(LEVELS.access, msg, meta, cb)
}

DebugLogtron.prototype.warn = function warn (msg, meta, cb) {
  this._log(LEVELS.warn, msg, meta, cb)
}

DebugLogtron.prototype.error = function error (msg, meta, cb) {
  this._log(LEVELS.error, msg, meta, cb)
}

DebugLogtron.prototype.fatal = function fatal (msg, meta, cb) {
  this._log(LEVELS.fatal, msg, meta, cb)
}

function noop () {}
