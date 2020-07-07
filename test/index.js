'use strict'

const test = require('tape')
const process = require('process')
const os = require('os')
const TermColor = require('term-color')

TermColor.enabled = false

const TestingLogger = require('../logger.js')

test('TestingLogger is a function', function t (assert) {
  assert.equal(typeof TestingLogger, 'function')
  assert.end()
})

test('can create logger', function t (assert) {
  const logger = allocLogger()

  logger.debug('hi')

  assert.equal(logger.lines.length, 1)

  const line = logger.lines[0]
  assert.ok(line.msg.indexOf('DEBUG: hi ~ null') >= 0)

  assert.end()
})

test('can log async', function t (assert) {
  const logger = allocLogger()

  logger.debug('oh hi', {}, onLogged)

  function onLogged (err) {
    assert.ifError(err)
    assert.equal(logger.lines.length, 1)

    const line = logger.lines[0]
    assert.ok(line.msg.indexOf('DEBUG: oh hi ~ {}') >= 0)

    assert.end()
  }
})

test('logger throws with bad namespace', function t (assert) {
  let logger
  assert.throws(function throwIt () {
    logger = new TestingLogger('bad name')
  }, /found space character/)
  assert.throws(function throwIt () {
    logger = new TestingLogger('bad-name')
  }, /found - character/)
  assert.throws(function throwIt () {
    logger = new TestingLogger('bad#name')
  }, /found bad character/)
  assert.equal(logger, undefined)

  assert.end()
})

test('logger defaults opts', function t (assert) {
  let logger
  assert.doesNotThrow(function noThrow () {
    logger = new TestingLogger('somenamespace')
  })
  assert.ok(logger)

  assert.end()
})

test('logger levels', function t (assert) {
  /* eslint max-statements: 0 */
  const logger = allocLogger()

  logger.trace('trace')
  logger.debug('debug')
  logger.info('info')
  logger.access('access')
  logger.warn('warn')

  assert.equal(logger.lines.length, 5)

  const line = logger.lines[0]
  assert.ok(line.msg.indexOf('TRACE: trace ~ null') >= 0)

  const line2 = logger.lines[1]
  assert.ok(line2.msg.indexOf('DEBUG: debug ~ null') >= 0)

  const line3 = logger.lines[2]
  assert.ok(line3.msg.indexOf('INFO: info ~ null') >= 0)

  const line4 = logger.lines[3]
  assert.ok(line4.msg.indexOf('ACCESS: access ~ null') >= 0)

  const line5 = logger.lines[4]
  assert.ok(line5.msg.indexOf('WARN: warn ~ null') >= 0)

  assert.throws(function throwIt () {
    logger.error('error')
  }, 'error')
  assert.throws(function throwIt () {
    logger.fatal('fatal')
  }, 'fatal')

  const line6 = logger.lines[5]
  assert.ok(line6.msg.indexOf('ERROR: error ~ null') >= 0)

  const line7 = logger.lines[6]
  assert.ok(line7.msg.indexOf('FATAL: fatal ~ null') >= 0)

  assert.end()
})

test('fails with string meta', function t (assert) {
  assert.throws(function throwIt () {
    const logger = allocLogger()

    logger.info('hi', 'string meta')
  }, /meta must be an object/)

  assert.end()
})

test('serialize meta', function t (assert) {
  const logger = allocLogger()

  logger.info('hello', {
    complex: {
      nested: true, foo: 'bar'
    }
  })

  assert.equal(logger.lines.length, 1)
  const line = logger.lines[0]

  assert.ok(line.msg.indexOf('INFO: hello ~ ' +
        '{ complex: { nested: true, foo: \'bar\' } }') >= 0)

  assert.end()
})

test('LogMessage to buffer', function t (assert) {
  const hostname = os.hostname()

  const time = (new Date()).toISOString()
  const logMessage = TestingLogger.makeMessage(20, 'hi', null, time)

  const buf = logMessage.toBuffer()

  assert.equal(String(buf),
    '{"name":null,' +
        '"hostname":"' + hostname + '",' +
        '"pid":' + process.pid + ',' +
        '"component":null,' +
        '"level":"debug",' +
        '"msg":"hi",' +
        '"time":"' + time + '",' +
        '"src":null,' +
        '"v":0,' +
        '"fields":null}'
  )

  const buf2 = logMessage.toBuffer()
  assert.equal(buf, buf2)

  const logRecord = logMessage.toLogRecord()
  const logRecord2 = logMessage.toLogRecord()
  assert.equal(logRecord, logRecord2)

  assert.end()
})

test('logger respects color option', function t (assert) {
  TermColor.enabled = true
  const logger1 = allocLogger({
    colors: false
  })
  const logger2 = allocLogger({
    colors: true
  })

  logger1.info('hi')
  logger2.info('hi')

  const line1 = logger1.lines[0].msg
  assert.ok(line1.indexOf('INFO: hi ~ null') >= 0)

  const line2 = logger2.lines[0].msg
  assert.ok(
    line2.indexOf('INFO:\u001b[49m\u001b[22m hi ~ null') >= 0
  )

  TermColor.enabled = false
  assert.end()
})

test('always prints error/fatal', function t (assert) {
  let lines = []
  const logger = new TestingLogger('wat', {
    console: {
      error: function log (x) {
        lines.push(x)
      }
    },
    enabled: false
  })

  assert.throws(function throwIt () {
    logger.error('hi')
  }, 'hi')
  assert.equal(lines.length, 1)
  const line = lines[0]
  assert.ok(line.indexOf('ERROR: hi ~ null') >= 0)

  lines = []
  logger.info('lul')
  assert.equal(lines.length, 0)

  assert.end()
})

test('prints warn/info by default', function t (assert) {
  let lines = []
  const logger = new TestingLogger('wat', {
    console: {
      error: function log (x) {
        lines.push(x)
      }
    }
  })

  logger.info('hi')
  assert.equal(lines.length, 1)

  assert.ok(lines[0].indexOf('INFO: hi ~ null') >= 0)

  lines = []
  logger.debug('roflcopter')

  assert.equal(lines.length, 0)

  assert.end()
})

test('prints warn/info if enabled', function t (assert) {
  let lines = []
  const logger = new TestingLogger('wat', {
    console: {
      error: function log (x) {
        lines.push(x)
      }
    },
    enabled: true
  })

  logger.info('hi')
  assert.equal(lines.length, 1)

  assert.ok(lines[0].indexOf('INFO: hi ~ null') >= 0)

  lines = []
  logger.debug('roflcopter')

  assert.equal(lines.length, 0)

  assert.end()
})

test('does not prints warn/info if disabled', function t (assert) {
  let lines = []
  const logger = new TestingLogger('wat', {
    console: {
      error: function log (x) {
        lines.push(x)
      }
    },
    enabled: false
  })

  logger.info('hi')
  assert.equal(lines.length, 0)

  lines = []
  logger.debug('roflcopter')

  assert.equal(lines.length, 0)

  assert.end()
})

test('prints debug/access/trace if NODE_DEBUG', function t (assert) {
  const lines = []
  const logger = new TestingLogger('wat', {
    console: {
      error: function log (x) {
        lines.push(x)
      }
    },
    env: {
      NODE_DEBUG: 'wat'
    }
  })

  logger.debug('hi')
  assert.equal(lines.length, 1)

  assert.ok(lines[0].indexOf('DEBUG: hi ~ null') >= 0)

  logger.info('hi')

  assert.equal(lines.length, 2)
  assert.ok(lines[1].indexOf('INFO: hi ~ null') >= 0)

  assert.throws(function throwIt () {
    logger.error('hi')
  }, 'hi')

  assert.equal(lines.length, 3)
  assert.ok(lines[2].indexOf('ERROR: hi ~ null') >= 0)

  assert.end()
})

test('prints debug/access/trace if verbose', function t (assert) {
  const lines = []
  const logger = new TestingLogger('wat', {
    console: {
      error: function log (x) {
        lines.push(x)
      }
    },
    verbose: true
  })

  logger.debug('hi')
  assert.equal(lines.length, 1)

  assert.ok(lines[0].indexOf('DEBUG: hi ~ null') >= 0)

  logger.info('hi')

  assert.equal(lines.length, 2)
  assert.ok(lines[1].indexOf('INFO: hi ~ null') >= 0)

  assert.throws(function throwIt () {
    logger.error('hi')
  }, 'hi')

  assert.equal(lines.length, 3)
  assert.ok(lines[2].indexOf('ERROR: hi ~ null') >= 0)

  assert.end()
})

test('writes to assert comment', function t (assert) {
  const lines = []
  const comments = []
  const logger = new TestingLogger('wat', {
    console: {
      error: function log (x) {
        lines.push(x)
      }
    },
    assert: {
      comment: function comment (x) {
        comments.push(x)
      }
    },
    verbose: true
  })

  logger.debug('hi')

  assert.equal(lines.length, 0)
  assert.equal(comments.length, 1)

  assert.ok(comments[0].indexOf('DEBUG: hi ~ null') >= 0)

  assert.end()
})

test('can whitelist errors', function t (assert) {
  const logger = allocLogger()

  assert.throws(function throwIt () {
    logger.error('oh hi')
  }, /oh hi/)

  logger.whitelist('error', 'oh hi')

  logger.error('oh hi')

  assert.equal(logger.items().length, 1)
  assert.equal(logger.items()[0].msg, 'oh hi')

  assert.throws(function throwIt () {
    logger.error('oh hi 2')
  }, /oh hi 2/)

  logger.error('oh hi', {}, function onMsg () {
    assert.equal(logger.items().length, 2)

    assert.end()
  })
})

test('can unwhitelist errors', function t (assert) {
  const logger = allocLogger()

  assert.throws(function throwIt () {
    logger.error('oh hi')
  }, /oh hi/)

  logger.whitelist('error', 'oh hi')

  logger.error('oh hi')

  assert.equal(logger.items().length, 1)
  assert.equal(logger.items()[0].msg, 'oh hi')

  logger.unwhitelist('error', 'oh hi')

  assert.throws(function throwIt () {
    logger.error('oh hi')
  }, /oh hi/)

  assert.end()
})

function allocLogger (opts) {
  opts = opts || {}
  const logger = new TestingLogger('TestingLoggertestcode', {
    env: {
      NODE_DEBUG: 'TestingLoggertestcode'
    },
    console: {
      error: function logStatement (msg) {
        logger.lines.push({
          msg: msg
        })
      }
    },
    trace: true,
    colors: opts.colors
  })
  logger.lines = []

  return logger
}
