'use strict'

var util = require('util')

var BaseLogtron = require('./lib/base-logtron.js')
var DebugLogBackend = require('./backends/debug-log-backend.js')

module.exports = DebugLogtron

function DebugLogtron (namespace, opts) {
  if (!(this instanceof DebugLogtron)) {
    return new DebugLogtron(namespace, opts)
  }

  opts = opts || {}

  this.name = namespace

  this._backend = DebugLogBackend(this.name, opts)
  BaseLogtron.call(this, {
    streams: [this._backend.createStream()]
  })
}
util.inherits(DebugLogtron, BaseLogtron)

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
