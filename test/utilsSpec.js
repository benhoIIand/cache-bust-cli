'use strict';

var url = require('url');
var path = require('path');
var utils = require('../lib/utils');

var chai = require('chai');
var expect = chai.expect;

describe('Utils', function() {

    describe('should check if a url', function() {

        it('is a relative path', function() {
            expect(utils.isRelativePath(url.parse('relative/to/root'))).to.equal(true);
            expect(utils.isRelativePath(url.parse('/relative/to/root'))).to.equal(false);
            expect(utils.isRelativePath(url.parse('./relative/to/file'))).to.equal(true);
            expect(utils.isRelativePath(url.parse('../../relative/to/file'))).to.equal(true);
        });

        it('is a remote path', function() {
            expect(utils.isRemotePath(url.parse('/path/to/file.js'))).to.equal(false);
            expect(utils.isRemotePath(url.parse('./path/to/file.js'))).to.equal(false);
            expect(utils.isRemotePath(url.parse('../path/to/file.js'))).to.equal(false);
            expect(utils.isRemotePath(url.parse('data:image/png;base64'))).to.equal(true);
            expect(utils.isRemotePath(url.parse('//domain.com/path/to/file.js'))).to.equal(true);
            expect(utils.isRemotePath(url.parse('http://domain.com/path/to/file.js'))).to.equal(true);
            expect(utils.isRemotePath(url.parse('https://domain.com/path/to/file.js?something'))).to.equal(true);
        });

        it('is a remote path using its own CDN path', function() {
            expect(utils.isRemotePath(url.parse('/path/to/file.js'), 'domain.com')).to.equal(false);
            expect(utils.isRemotePath(url.parse('//domain.com/path/to/file.js'), 'domain.com')).to.equal(false);
            expect(utils.isRemotePath(url.parse('http://domain.com/path/to/file.js'), 'domain.com')).to.equal(false);
            expect(utils.isRemotePath(url.parse('https://domain.com/path/to/file.js?something'), 'domain.com')).to.equal(false);
        });

        it('is a data image', function() {
            expect(utils.isDataImage(url.parse('/path/to/file.js'))).to.equal(false);
            expect(utils.isDataImage(url.parse('data:image/png;base64'))).to.equal(true);
            expect(utils.isDataImage(url.parse('http://domain.com/path/to/file.js'))).to.equal(false);
        });

        it('has an extension', function() {
            expect(utils.hasExtension(url.parse('/path/to/file'))).to.equal(false);
            expect(utils.hasExtension(url.parse('/path/to/file.j'))).to.equal(true);
            expect(utils.hasExtension(url.parse('/path/to/file.js'))).to.equal(true);
            expect(utils.hasExtension(url.parse('/path/to/file.js.something'))).to.equal(true);
        });

        it('is a valid file', function() {
            expect(utils.checkIfValidFile(undefined)).to.equal(false);
            expect(utils.checkIfValidFile('undefined')).to.equal(false);
            expect(utils.checkIfValidFile(url.parse('/path/to/file'))).to.equal(false);
            expect(utils.checkIfValidFile(url.parse('/path/to/file.js'))).to.equal(true);
            expect(utils.checkIfValidFile(url.parse('./path/to/file.js'))).to.equal(true);
            expect(utils.checkIfValidFile(url.parse('../path/to/file.js'))).to.equal(true);
            expect(utils.checkIfValidFile(url.parse('data:image/png;base64'))).to.equal(false);
            expect(utils.checkIfValidFile(url.parse('//domain.com/path/to/file.js'))).to.equal(false);
            expect(utils.checkIfValidFile(url.parse('http://domain.com/path/to/file.js'))).to.equal(false);
            expect(utils.checkIfValidFile(url.parse('https://domain.com/path/to/file.js?something'))).to.equal(false);
        });

    });

    it('should remove a hash from a url', function() {
        expect(utils.removeHashInUrl('/assets/styles.css')).to.equal('/assets/styles.css');
        expect(utils.removeHashInUrl('/assets/styles.css#123456')).to.equal('/assets/styles.css');
        expect(utils.removeHashInUrl('/assets/scripts.js#')).to.equal('/assets/scripts.js');
        expect(utils.removeHashInUrl('/assets/scripts.js#4567#678')).to.equal('/assets/scripts.js');
    });

    describe('when normalizing a path', function() {
        var dirname = path.dirname('test/some.html');

        it('should normalize a path', function() {
            expect(utils.normalizePath({}, dirname, url.parse('./assets/styles.css'))).to.equal('test/assets/styles.css');
        });

        it('should normalize a path with a baseDir', function() {
            expect(utils.normalizePath({
                baseDir: 'tmp/test'
            }, dirname, url.parse('/assets/styles.css'))).to.equal('tmp/test/assets/styles.css');
        });

        it('should normalize a path with a cdnPath', function() {
            expect(utils.normalizePath({
                baseDir: 'tmp/test',
                cdnPath: 'domain.com'
            }, dirname, url.parse('https://domain.com/assets/styles.css'))).to.equal('tmp/test/assets/styles.css');
        });

    });

    describe('when ignoring certain patterns', function() {

        it('should return true if there are no patterns to ignore', function() {
            expect(utils.removeIgnoredPatterns([])()).to.equal(true);
        });

        it('should ignore a parsed url', function() {
            expect(utils.removeIgnoredPatterns()(url.parse('/assets/toBeIncluded.js'))).to.equal(true);
            expect(utils.removeIgnoredPatterns(['toBeIgnored'])(url.parse('/assets/toBeIgnored.js'))).to.equal(false);
        });

    });

});
