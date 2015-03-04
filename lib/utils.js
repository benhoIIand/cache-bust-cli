'use strict';

var url = require('url');
var path = require('path');
var grunt = require('grunt');
var crypto = require('crypto');
var isEmpty = require('lodash/lang/isEmpty');

module.exports = {

    isRelativePath: function(parsedUrl) {
        return !path.isAbsolute(parsedUrl.pathname);
    },

    isRemotePath: function(parsedUrl, cdnHostname) {
        if (cdnHostname) {
            var domainRegex = new RegExp('^\/\/' + cdnHostname, 'i');

            if (parsedUrl.hostname === cdnHostname) {
                return false;
            }

            if (domainRegex.test(parsedUrl.pathname)) {
                return false;
            }

            return this.isRemotePath(parsedUrl);
        }

        if (parsedUrl.protocol === null) {
            if ((/^\/\//).test(parsedUrl.href)) {
                return true;
            }

            return false;
        }

        return true;
    },

    isDataImage: function(parsedUrl) {
        return parsedUrl.protocol === 'data:';
    },

    hasExtension: function(parsedUrl) {
        return path.extname(parsedUrl.pathname) !== '';
    },

    checkIfValidFile: function(parsedUrl, cdnPath) {
        return parsedUrl !== 'undefined' &&
            parsedUrl !== undefined &&
            !this.isRemotePath(parsedUrl, cdnPath) &&
            !this.isDataImage(parsedUrl) &&
            this.hasExtension(parsedUrl);
    },

    checkIfElemContainsValidFile: function(element, cdnPath) {
        if (element.attribs.src) {
            return !isEmpty(element.attribs.src);
        }

        if (element.attribs['xlink:href']) {
            return !isEmpty(element.attribs['xlink:href'].split('#')[0]);
        }

        if (element.attribs.href) {
            return !isEmpty(element.attribs.href);
        }

        return false;
    },

    regexEscape: function(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },

    removeHashInUrl: function(url) {
        return url.split('#')[0];
    },

    addFileHash: function(str, hash, separator) {
        var parsed = url.parse(str);
        var ext = path.extname(parsed.pathname);

        return (parsed.hostname ? parsed.protocol + parsed.hostname : '') + parsed.pathname.replace(ext, '') + separator + hash + ext;
    },

    generateFileHash: function(opts) {
        return function(fileData) {
            return opts.hash || crypto.createHash(opts.algorithm).update(fileData, opts.encoding).digest('hex').substring(0, opts.length);
        }.bind(this);
    },

    removePreviousHash: function(opts) {
        return function(str) {
            var findHash = new RegExp(this.regexEscape(opts.separator) + '([a-zA-Z0-9]{' + opts.length + '})(\\.\\w+)$', 'ig');

            return str.replace(findHash, function(match, hash, extension) {
                return extension;
            });
        }.bind(this);
    },

    normalizePath: function(opts, sourceFileDir, parsedUrl) {
        if (opts.baseDir && !this.isRelativePath(parsedUrl)) {
            sourceFileDir = opts.baseDir ? opts.baseDir : sourceFileDir;
        }

        if (opts.cdnPath) {
            parsedUrl.pathname.replace(opts.cdnPath, '');
        }

        sourceFileDir += '/';

        return path.normalize(sourceFileDir + parsedUrl.pathname);
    },

    fileDoesntExist: function(normalizedPath, reference) {
        grunt.log.warn('Static asset "' + normalizedPath + '" skipped because it wasn\'t found, original reference "' + reference + '"');
        return false;
    },

    doesFileExist: function(filepath) {
        if (!grunt.file.exists(filepath)) {
            grunt.log.warn('Source file "' + filepath + '" not found.');
            return false;
        } else {
            return true;
        }
    },

    removeIgnoredPatterns: function(ignorePatterns) {
        return function(parsedUrl) {
            if (ignorePatterns) {
                var matched = ignorePatterns.some(function(pattern) {
                    return (new RegExp(pattern, 'ig')).test(parsedUrl.href);
                });

                if (matched) {
                    return false;
                }
            }

            return true;
        };
    },

    deleteFiles: function(filesToDelete) {
        filesToDelete.forEach(function(filename) {
            if (grunt.file.exists(filename)) {
                grunt.file.delete(filename);
            }
        });
    },

    writeJsonFile: function(path, data) {
        grunt.log.warn(['File map has been exported to ', path.normalize(path), '!'].join(''));
        grunt.file.write(path, data);
    }

};
