'use strict';

/**
 * Configure path
 */
const path = require('path');
global.SCAFFOLD_SOURCE = path.resolve(__dirname + '/../source');
global.SCAFFOLD_TEST = __dirname;
global.SCAFFOLD_FIXTURES = path.resolve(__dirname + '/__fixtures__');


/**
 * Configure chai
 */
const chai = require('chai');
chai.config.includeStack = true;
global.expect = chai.expect;
chai.use(require('chai-fs-latest'));
