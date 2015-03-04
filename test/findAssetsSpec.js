'use strict';

var findAssets = require('../lib/findAssets')({
    enableUrlFragmentHint: true,
    filters: {
        'script': [
            function() {
                if (this.attribs['data-main']) {
                    return this.attribs['data-main'] + '.js';
                }

                return null;
            },
            function() {
                return this.attribs.src;
            }
        ]
    }
});

var grunt = require('grunt');
var map = require('lodash/collection/map');
var chai = require('chai');
var expect = chai.expect;

var getPropFromParsedAssets = function(prop, filename) {
    return findAssets(grunt.file.read('test/fixtures/' + filename)).map(function(obj) {
        return obj[prop];
    });
};

var sourceFile = grunt.file.read('test/fixtures/index.html');

describe('Finding assets', function() {

    describe('when searching', function() {

        describe('for images', function() {
            var result = getPropFromParsedAssets('href', 'images.html');

            it('should find all common file extensions', function() {
                expect(result).to.include('assets/image.jpg');
                expect(result).to.include('assets/image.jpeg');
                expect(result).to.include('assets/image.png');
                expect(result).to.include('assets/image.gif');
                expect(result).to.include('assets/image.svg');
                expect(result).to.include('assets/image.webp');
            });

            it('should find all remote images', function() {
                expect(result).to.include('https://gravatar.example.com/avatar/d3b2094f1b3386e660bb737e797f5dcc?s=420');
                expect(result).to.include('http://placekitten.com/300/300/');
            });

            it('should find all images in the srcset attribute', function() {
                expect(result).to.include('assets/srcset.jpeg');
                expect(result).to.include('assets/srcset-mobile.jpeg');
                expect(result).to.include('assets/srcset@2x.jpeg');
            });

        });

        describe('for favicons', function() {
            var result = getPropFromParsedAssets('href', 'favicons.html');

            it('should find them all', function() {
                expect(result).to.deep.equal([
                    'assets/favicons/favicon.png',
                    'assets/favicons/favicon.ico',
                    'assets/favicons/favicon.gif',
                    'assets/favicons/favicon.jpg',
                    'assets/favicons/favicon.jpeg',
                    'assets/favicons/favicon.bmp'
                ]);
            });
        });

        describe('for javascript files', function() {
            var result = getPropFromParsedAssets('href', 'javascript.html');

            it('should find script files', function() {
                expect(result).to.deep.equal([
                    'assets/requirejs-main.js',
                    'assets/script1.js',
                    'assets/script2.js',
                    'assets/script3.js',
                    'assets/script4.js',
                    'assets/script5.js',
                    '//ajax.googleapis.com/ajax/libs/angularjs/1.0.6/angular.min.js',
                    'https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js',
                    'http://code.jquery.com/qunit/qunit-1.12.0.js',
                    '/assets/requirejs.js'
                ]);
            });

            it('should find the requirejs main file', function() {
                expect(result).to.include('assets/requirejs-main.js');
            });
        });

        describe('for assets inside a comment tag', function() {
            var result = getPropFromParsedAssets('href', 'comment-tag.html');

            it('should find them all', function() {
                expect(result).to.deep.equal([
                    'assets/standard.js',
                    'assets/standard.css'
                ]);
            });
        });

        describe('for assets inside a template', function() {
            var result = getPropFromParsedAssets('href', 'template.html');

            it('should find them all', function() {
                expect(result).to.deep.equal([
                    '/assets/inside-native-template.js',
                    '/assets/outside-template.js',
                    '/assets/inside-template.js'
                ]);
            });
        });

        describe('for assets with the url hint', function() {
            var result = getPropFromParsedAssets('href', 'url-hint.html');

            it('should find them all', function() {
                expect(result).to.deep.equal([
                    'assets/standard.js#cache-bust',
                    'assets/standard.css',
                    'assets/standard.jpg',
                    'assets/standard.js'
                ]);
            });
        });

        describe('for assets inside a windows browser config', function() {
            var result = getPropFromParsedAssets('href', 'windows-browser-config.xml');

            it('should find them all', function() {
                expect(result).to.deep.equal([
                    '/assets/mstile-70x70.png',
                    '/assets/mstile-150x150.png',
                    '/assets/mstile-310x310.png',
                    '/assets/mstile-310x150.png'
                ]);
            });
        });

    });

});
