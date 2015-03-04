'use strict';

var defaultOptions = require('../lib/defaultOptions');

var chai = require('chai');
var expect = chai.expect;

describe('Default options', function() {

    it('should be correctly set', function() {
        expect(defaultOptions).to.deep.equal({
            algorithm: 'md5',
            cdnPath: false,
            deleteOriginals: false,
            enableUrlFragmentHint: false,
            encoding: 'utf8',
            filters: {},
            ignorePatterns: [],
            jsonOutput: false,
            jsonOutputFilename: 'cache-bust.json',
            length: 16,
            replaceTerms: [],
            removeUrlFragmentHint: false,
            rename: true,
            separator: '.'
        });
    });

});
