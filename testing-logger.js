// @ts-check
'use strict'

const inspect = require('util').inspect
const process = require('process')
const globalConsole = require('console')

const SUPPORTS_COLORS = require('./supports-color.js')

const validNamespaceRegex = /^[a-zA-Z0-9]+$/

class InvalidNamespaceError extends Error {
  constructor (namespace, badChar, reason) {
    super(
`Unexpected characters in the '${namespace}' arg.
Expected the namespace to be a bare word but instead found ${badChar} character.
SUGGESTED FIX: Use just alphanum in the namespace.
`)

    this.type = 'testing-logger.invalid-argument.namespace'
    this.name = 'InvalidNamespaceError'
    this.badChar = badChar
    this.reason = reason
    this.namespace = namespace
  }
}

const COLOR_MAP = {
  fatal: bgRed,
  error: bgRed,
  warn: bgYellow,
  access: bgGreen,
  info: bgGreen,
  debug: bgBlue,
  trace: bgCyan
}

/**
 * TestingLogger implements the actual utility.
 *
 *  - Support whitelist() & popLogs() & isEmpty()
 *  - Print logs to stdout if not whitelisted.
 *  - support verbose & NODE_DEBUG
 *  - fail hard on error() & fatal()
 */
class TestingLogger {
  constructor (namespace, opts) {
    const isValid = validNamespaceRegex.test(namespace)
    if (!isValid) {
      const hasHypen = namespace.indexOf('-') >= 0
      const hasSpace = namespace.indexOf(' ') >= 0

      throw new InvalidNamespaceError(
        namespace,
        hasHypen ? '-' : hasSpace ? 'space' : 'bad',
        hasHypen ? 'hypen' : hasSpace ? 'space' : 'unknown'
      )
    }

    this.console = opts.console || globalConsole
    this.assert = opts.assert
    this.colors = typeof opts.colors === 'boolean'
      ? opts.colors : true
    /* eslint no-process-env: 0 */
    this.env = opts.env || process.env
    this.namespace = namespace.toUpperCase()

    this.whitelists = {
      fatal: {},
      error: {},
      warn: {},
      access: {},
      info: {},
      debug: {},
      trace: {}
    }
    this.records = []

    this.recordsByMessage = {}
    this.logged = 0

    const debugEnviron = this.env.NODE_DEBUG || ''
    const regex = new RegExp('\\b' + this.namespace + '\\b', 'i')

    this.enabled = typeof opts.enabled === 'boolean'
      ? opts.enabled : true
    this.verbose = opts.verbose || regex.test(debugEnviron)
    this.trace = typeof opts.trace === 'boolean'
      ? opts.trace : (this.verbose && !!this.env.TRACE)

    if (this.verbose) {
      this.enabled = true
    }
  }

  whitelist (level, msg) {
    this.whitelists[level][msg] = true
  }

  unwhitelist (level, msg) {
    this.whitelists[level][msg] = false
  }

  items () {
    return this.records.slice()
  }

  popLogs (message) {
    const records = this.recordsByMessage[message]
    delete this.recordsByMessage[message]

    return records || []
  }

  isEmpty () {
    return this.logged === 0 &&
      Object.keys(this.recordsByMessage).length === 0
  }

  write (logMessage, cb) {
    const logRecord = logMessage.toLogRecord()
    const levelName = logRecord.levelName

    const whitelist = this.whitelists[levelName]
    if (whitelist[logRecord.msg]) {
      if (!this.recordsByMessage[logRecord.msg]) {
        this.recordsByMessage[logRecord.msg] = []
      }
      this.recordsByMessage[logRecord.msg].push(logRecord)
      this.records.push(logRecord)

      /* istanbul ignore else */
      if (cb) {
        cb()
      }
      return
    }

    if (
      (levelName === 'fatal' || levelName === 'error') ||
        (this.enabled &&
            (levelName === 'warn' || levelName === 'info')) ||
        (this.verbose &&
            (levelName === 'access' || levelName === 'debug')) ||
        (this.trace && levelName === 'trace')
    ) {
      this.logged++

      const msg = this.formatMessage(logRecord)
      if (this.assert) {
        this.assert.comment(msg)
      } else {
        this.console.error(msg)
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

  formatMessage (logRecord) {
    let prefix = this.namespace + ' ' +
      logRecord.levelName.toUpperCase() + ':'
    const colorFn = COLOR_MAP[logRecord.levelName]

    if (this.colors && TestingLogger.COLORS_ENABLED) {
      prefix = colorFn(prefix)
      prefix = bold(prefix)
    }

    return prefix + ' ' + logRecord.msg + ' ~ ' +
      inspect(logRecord.meta)
  }
}

TestingLogger.COLORS_ENABLED = SUPPORTS_COLORS

module.exports = TestingLogger

function bold (text) {
  return '\u001b[1m' + text + '\u001b[22m'
}

function bgRed (text) {
  return '\u001b[41m' + text + '\u001b[49m'
}

function bgYellow (text) {
  return '\u001b[43m' + text + '\u001b[49m'
}

function bgGreen (text) {
  return '\u001b[42m' + text + '\u001b[49m'
}

function bgBlue (text) {
  return '\u001b[44m' + text + '\u001b[49m'
}

function bgCyan (text) {
  return '\u001b[46m' + text + '\u001b[49m'
}
