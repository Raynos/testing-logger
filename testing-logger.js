// @ts-check
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

      throw InvalidNamespaceError({
        namespace: namespace,
        badChar: hasHypen ? '-' : hasSpace ? 'space' : 'bad',
        reason: hasHypen ? 'hypen'
          : hasSpace ? 'space' : 'unknown'
      })
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
    const color = COLOR_MAP[logRecord.levelName]

    if (this.colors) {
      prefix = TermColor[color](prefix)
      prefix = TermColor.bold(prefix)
    }

    return prefix + ' ' + logRecord.msg + ' ~ ' +
      inspect(logRecord.meta)
  }
}

module.exports = TestingLogger
