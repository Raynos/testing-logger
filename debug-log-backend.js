'use strict'

const inspect = require('util').inspect
const process = require('process')
const globalConsole = require('console')
const TypedError = require('error/typed')
const TermColor = require('term-color')

const validNamespaceRegex = /^[a-zA-Z0-9]+$/
const InvalidNamespaceError = TypedError({
  type: 'debug-logtron.invalid-argument.namespace',
  message: 'Unexpected characters in the `namespace` arg.\n' +
        'Expected the namespace to be a bare word but instead ' +
            'found {badChar} character.\n' +
        'SUGGESTED FIX: Use just alphanum in the namespace.\n',
  badChar: null,
  reason: null,
  namespace: null
})
const COLOR_MAP = {
  fatal: 'bgRed',
  error: 'bgRed',
  warn: 'bgYellow',
  access: 'bgGreen',
  info: 'bgGreen',
  debug: 'bgBlue',
  trace: 'bgCyan'
}

module.exports = DebugLogBackend

/* eslint-disable complexity */
function DebugLogBackend (namespace, opts) {
  if (!(this instanceof DebugLogBackend)) {
    return new DebugLogBackend(namespace, opts)
  }

  const self = this

  const isValid = validNamespaceRegex.test(namespace)
  if (!isValid) {
    const hasHypen = namespace.indexOf('-') >= 0
    const hasSpace = namespace.indexOf(' ') >= 0

    throw InvalidNamespaceError({
      namespace: namespace,
      badChar: hasHypen ? '-' : hasSpace ? 'space' : 'bad',
      reason: hasHypen ? 'hypen'
        : hasSpace ? 'space' : 'unknown'
    })
  }

  self.console = opts.console || globalConsole
  self.assert = opts.assert
  self.colors = typeof opts.colors === 'boolean'
    ? opts.colors : true
    /* eslint no-process-env: 0 */
  self.env = opts.env || process.env
  self.namespace = namespace.toUpperCase()

  self.whitelists = {
    fatal: {},
    error: {},
    warn: {},
    access: {},
    info: {},
    debug: {},
    trace: {}
  }
  self.records = []

  self.recordsByMessage = {}
  self.logged = 0

  const debugEnviron = self.env.NODE_DEBUG || ''
  const regex = new RegExp('\\b' + self.namespace + '\\b', 'i')

  self.enabled = typeof opts.enabled === 'boolean'
    ? opts.enabled : true
  self.verbose = opts.verbose || regex.test(debugEnviron)
  self.trace = typeof opts.trace === 'boolean'
    ? opts.trace : (self.verbose && !!self.env.TRACE)

  if (self.verbose) {
    self.enabled = true
  }
}

DebugLogBackend.prototype.whitelist = function whitelist (level, msg) {
  const self = this

  self.whitelists[level][msg] = true
}

DebugLogBackend.prototype.unwhitelist = function unwhitelist (level, msg) {
  const self = this

  self.whitelists[level][msg] = false
}

DebugLogBackend.prototype.items = function items (level, msg) {
  const self = this

  return self.records.slice()
}

DebugLogBackend.prototype.popLogs = function popLogs (message) {
  const self = this

  const records = self.recordsByMessage[message]
  delete self.recordsByMessage[message]

  return records || []
}

DebugLogBackend.prototype.isEmpty = function isEmpty () {
  const self = this

  return self.logged === 0 &&
        Object.keys(self.recordsByMessage).length === 0
}

DebugLogBackend.prototype.createStream = function createStream () {
  const self = this

  return DebugLogStream(self.namespace, self)
}

function DebugLogStream (namespace, backend) {
  if (!(this instanceof DebugLogStream)) {
    return new DebugLogStream(namespace, backend)
  }

  const self = this

  self.namespace = namespace
  self.backend = backend
}

DebugLogStream.prototype.write = function write (logMessage, cb) {
  /* eslint complexity: [2, 15] */
  const self = this

  const logRecord = logMessage.toLogRecord()
  const levelName = logRecord.levelName

  const whitelist = self.backend.whitelists[levelName]
  if (whitelist[logRecord.msg]) {
    if (!self.backend.recordsByMessage[logRecord.msg]) {
      self.backend.recordsByMessage[logRecord.msg] = []
    }
    self.backend.recordsByMessage[logRecord.msg].push(logRecord)
    self.backend.records.push(logRecord)

    /* istanbul ignore else */
    if (cb) {
      cb()
    }
    return
  }

  if (
    (levelName === 'fatal' || levelName === 'error') ||
        (self.backend.enabled &&
            (levelName === 'warn' || levelName === 'info')) ||
        (self.backend.verbose &&
            (levelName === 'access' || levelName === 'debug')) ||
        (self.backend.trace && levelName === 'trace')
  ) {
    self.backend.logged++

    const msg = self.formatMessage(logRecord)
    if (self.backend.assert) {
      self.backend.assert.comment(msg)
    } else {
      self.backend.console.error(msg)
    }
  }

  if (levelName === 'fatal' || levelName === 'error') {
    throw new Error(logRecord.msg)
  }

  /* istanbul ignore else */
  if (cb) {
    cb()
  }
}

DebugLogStream.prototype.formatMessage =
function formatMessage (logRecord) {
  const self = this

  let prefix = self.namespace + ' ' +
        logRecord.levelName.toUpperCase() + ':'
  const color = COLOR_MAP[logRecord.levelName]

  if (self.backend.colors) {
    prefix = TermColor[color](prefix)
    prefix = TermColor.bold(prefix)
  }

  return prefix + ' ' + logRecord.msg + ' ~ ' +
        inspect(logRecord.meta)
}
