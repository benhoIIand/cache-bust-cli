#! /usr/bin/env node

var yargs = require('yargs').argv;
var omit = require('lodash/object/omit');
var defaults = require('lodash/object/defaults');

// Extend default options whilst omitting yargs keys
var opts = defaults(omit(yargs, '_', '$0'), require('./lib/defaultOptions'));

require('./lib/cacheBust')(opts);
