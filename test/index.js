'use strict';

var test = require('tape');

var debugLogtron = require('../index.js');

test('debugLogtron is a function', function t(assert) {
    assert.equal(typeof debugLogtron, 'function');
    assert.end();
});
