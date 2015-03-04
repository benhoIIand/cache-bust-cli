'use strict';

var processCssFile = require('../lib/processCssFile');

var grunt = require('grunt');
var chai = require('chai');
var expect = chai.expect;

var cssFile = grunt.file.read('test/fixtures/stylesheet.css');

var result = processCssFile(cssFile);

describe('Processing CSS file', function() {

    it('return an array of assets', function() {
        expect(result).to.be.a('array');
    });

    describe('should return urls from the', function() {

        describe('background property with', function() {

            it('single quotes', function() {
                expect(result).to.include('assets/css-image-single-quotes.jpg');
            });

            it('double quotes', function() {
                expect(result).to.include('assets/css-image-double-quotes.jpg');
            });

            it('no quotes', function() {
                expect(result).to.include('assets/css-image-no-quotes.jpg');
            });

        });

        it('content property', function() {
            expect(result).to.include('assets/content.jpg');
        });

        it('src property', function() {
            expect(result).to.include('/assets/fonts/icons.eot');
            expect(result).to.include('/assets/fonts/icons.eot?#iefix');
            expect(result).to.include('/assets/fonts/icons.woff');
            expect(result).to.include('/assets/fonts/icons.ttf');
        });

    });

    it('should ignore data images', function() {
        expect(result).to.not.include('data:image/png;base64,iVBORw0KGgoAAAANSUhEU');
    });

    it('should include remote assets', function() {
        expect(result).to.include('//www.external.com/external-image1.jpg');
        expect(result).to.include('http://www.external.com/external-image2.jpg');
        expect(result).to.include('https://www.external.com/external-image3.jpg');
    });

});
