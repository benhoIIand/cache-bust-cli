'use strict';

var defaultFilters = require('../lib/defaultFilters');

var chai = require('chai');
var expect = chai.expect;

describe('Default filters', function() {

    it('should have a script filter', function() {
        expect(defaultFilters.script.call({
            attribs: {
                src: '/assets/scripts.js'
            }
        })).to.equal('/assets/scripts.js');
    });

    it('should have a stylesheet filter', function() {
        expect(defaultFilters['link[rel="stylesheet"]'].call({
            attribs: {
                href: '/assets/styles.css'
            }
        })).to.equal('/assets/styles.css');
    });

    describe('should have an image filter', function() {
        it('returns the src attrib', function() {
            expect(defaultFilters.img[0].call({
                attribs: {
                    src: '/assets/image.jpg'
                }
            })).to.equal('/assets/image.jpg');
        });

        it('returns the srcset attrib', function() {
            expect(defaultFilters.img[1].call({
                attribs: {
                    srcset: '/assets/srcset-mobile.jpg 720w, /assets/srcset@2x.jpg 2x'
                }
            })).to.deep.equal(['/assets/srcset-mobile.jpg', '/assets/srcset@2x.jpg']);
        });
    });

    it('should have a favicon filter', function() {
        expect(defaultFilters['link[rel="icon"], link[rel="shortcut icon"]'].call({
            attribs: {
                href: '/assets/favicon.ico'
            }
        })).to.equal('/assets/favicon.ico');
    });

    it('should have a template filter', function() {
        expect(defaultFilters['script[type="text/template"]']).to.exist;
    });

    it('should have a windows XML config filter', function() {
        expect(defaultFilters['square70x70logo, square150x150logo, square310x310logo, wide310x150logo'].call({
            attribs: {
                src: '/assets/image.jpg'
            }
        })).to.equal('/assets/image.jpg');
    });

});
