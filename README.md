# testing-logger

A logger specifically for use in test suites / harnesses.

## Example

This logger is designed for tests; it prints info & above
and prints debugs if you set `NODE_DEBUG=mylibrary`

```js
const TestingLogger = require("testing-logger");

const logger = new TestingLogger('mylibrary');

logger.debug('some fixed string', { some: 'meta object' });
logger.info('some fixed string', { some: 'meta object' });
logger.warn('some fixed string', { some: 'meta object' });
logger.error('some fixed string', { some: 'meta object' });
```

It writes all logs to stderr. If you call `logger.error()` or
`logger.fatal()` it will throw exceptions. any error callsites
are bugs.

warns go to stderr by default.

## Using in tests

You can use the `.whitelist()` and `.items()` method to make
testing easier

```js
const TestingLogger = require('testing-logger');
const test = require('tape');

test('some module', function t(assert) {
  const logger = new TestingLogger('mything');
  const thing = new Thing({ logger: logger })

  logger.whitelist('error', 'some msg');

  thing.doStuff();

  const lines = logger.popLogs('some msg');
  assert.equal(lines.length, 1)
  assert.ok(lines[0].levelName, 'error', 'thing writes to logger.error()')

  assert.ok(logger.isEmpty())
  assert.end();
});
```

Whilst it is recommended that you minimize state between tests by creating
a new instance of testing-logger, it is possible to remove a whitelisted item
by calling `.unwhitelist` with the same arguments.

## Interface

This library will re `throw` any `.error()` or `.fatal()` callsites.

Any warns and infos got to stderr.

Any debugs / access can be made visible using
`NODE_DEBUG=mylibrary`.

You can turn colors off with `--color false`

If you want to see trace() logs you must set `NODE_DEBUG=mylibrary TRACE=1`

## Alternatives

**Warning:** This a logger for testing! Not a default logger.

If you want to add a default logger to your `dependencies`
  then I strongly recommend you use [`null-logtron`][null-logtron]

## Motivation

You want to instrument your application and your libraries
  with a production application logger. A logger that writes
  somewhere in production.

However for your writing tests for both your libraries and
  your applications you probably do not want to see all of your
  logs spewing on STDOUT by default.

This is where `testing-logger` comes in, You can start your app
  or libraries with the testing logger in your tests which allows
  the test runner to decide when to spew.

This works great together with `itape --trace` where you can
  use `itape` to turn on and off trace mode.

## Docs

### `logger.whitelist(level, message)`

This whitelisted a tuple of level and message, for example:
`logger.whitelist('warn', 'resetting connection')`

This means that any callsites to `logger.warn('resetting connection', { ... })`
will not be printed to STDOUT.

If you call `whitelist()` in a test, it's expected you call `popLogs()`

### `logger.unwhitelist(level, message)`

inverse, resets the whitelist if you have a logger shared among tests. ( dont do that.. )

### `logger.items()`

Just returns every item that has been whitelisted from the logger, can be used
for assertion purposes.

### `logger.popLogs(message)`

This will return all log lines for that message ( including all levels ).
This is a short hand for filtering `items()` by message.

Calling `popLogs()` will also decrease the internal counter used by `isEmpty()`.
This can be used to make sure that test cases write assertions against everything
that was logged.

#### `logger.isEmpty()`

Returns whether nothing was logged. Most of the time in tests you don't want anything
to be logged to STDOUT.

If you do expect log callsites to get triggered ( info, warn, error, etc ) during tests
then you can use `whitelist()` and `popLogs()`.

You must call `popLogs()` to decrement the counter so that `isEmpty()` returns `true`.

This is especially useful if someone refactors the code by adding or removing loglines
which will cause existing tests to fail ( either `isEmpty()` fails because `popLogs()` was not
called for a new logline, or `popLogs()` fails because a logline was removed ).

## Installation

`npm install testing-logger`

## Tests

`npm test`

## Contributors

 - Raynos

## MIT Licensed

  [null-logtron]: https://github.com/Raynos/null-logtron
  [debuglog]: https://github.com/sam-github/node-debuglog
