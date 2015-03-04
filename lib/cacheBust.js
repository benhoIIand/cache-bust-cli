var fs = require('fs');
var path = require('path');
var grunt = require('grunt');

var processedFileMap = {};
var filesToDelete = [];

module.exports = function(opts) {

    var utils = require('./utils');
    var findAssets = require('./findAssets')(opts);
    var files = opts.files.split(',').reduce(function(arr, glob) {
        return arr.concat(grunt.file.expand(glob));
    }, []);

    files
        .filter(utils.doesFileExist)
        .forEach(function(filepath) {
            var markup = grunt.file.read(filepath);

            findAssets(markup, (/\.css$/).test(filepath))
                .filter(utils.removeIgnoredPatterns(opts.ignorePatterns))
                .forEach(function(parsedUrl) {
                    var normalizedPath = utils.normalizePath(opts, path.dirname(filepath), parsedUrl);
                    var originalReference = decodeURI(parsedUrl.href);
                    var newPathname = parsedUrl.pathname;
                    var generateFileHash = utils.generateFileHash(opts);
                    var removePreviousHash = utils.removePreviousHash(opts);
                    var newReference;
                    var domain;

                    if (opts.rename) {

                        // If the file has already been cached, use that
                        if (processedFileMap[parsedUrl.pathname]) {
                            markup = markup.replace(new RegExp(utils.regexEscape(parsedUrl.pathname), 'g'), processedFileMap[parsedUrl.pathname]);
                        } else {
                            // Remove any previous hashes from the filename
                            normalizedPath = removePreviousHash(normalizedPath);
                            newPathname = removePreviousHash(newPathname);

                            // Replacing specific terms in the import path so renaming files
                            if (opts.replaceTerms && opts.replaceTerms.length > 0) {
                                opts.replaceTerms.forEach(function(obj) {
                                    each(obj, function(replacement, term) {
                                        normalizedPath = normalizedPath.replace(encodeURI(term), replacement);
                                        newPathname = newPathname.replace(encodeURI(term), replacement);
                                    });
                                });
                            }

                            // Check if file exists
                            if (!grunt.file.exists(normalizedPath)) {
                                return utils.fileDoesntExist(normalizedPath, parsedUrl.pathname);
                            }

                            // Generate the file hash
                            var fileHash = generateFileHash(grunt.file.read(normalizedPath));

                            // Create our new filename
                            var newFilename = utils.addFileHash(normalizedPath, fileHash, opts.separator);

                            // Create the new reference
                            domain = (parsedUrl.hostname ? (parsedUrl.protocol ? parsedUrl.protocol : '') + '//' + (parsedUrl.hostname ? parsedUrl.hostname : '') : '');
                            newReference = domain + utils.addFileHash(newPathname, fileHash, opts.separator) + (parsedUrl.hash ? parsedUrl.hash : '');

                            // Update the reference in the markup
                            markup = markup.replace(new RegExp(utils.regexEscape(originalReference)), newReference);

                            // Create our new file
                            grunt.file.copy(normalizedPath, newFilename);

                            grunt.verbose.writeln(newFilename + ' was created!');
                        }
                    } else {
                        // Remove any previous hashes from the filename
                        normalizedPath = removePreviousHash(normalizedPath);
                        newPathname = removePreviousHash(newPathname);

                        // Check if file exists
                        if (!grunt.file.exists(normalizedPath)) {
                            return utils.fileDoesntExist(normalizedPath, parsedUrl.pathname);
                        }

                        // Create the new reference
                        domain = (parsedUrl.hostname ? (parsedUrl.protocol ? parsedUrl.protocol : '') + '//' + (parsedUrl.hostname ? parsedUrl.hostname : '') : '');
                        newReference = domain + newPathname + '?' + generateFileHash(grunt.file.read(normalizedPath)) + (parsedUrl.hash ? parsedUrl.hash : '');

                        // Update the reference in the markup
                        markup = markup.replace(new RegExp(utils.regexEscape(originalReference)), newReference);
                    }

                    processedFileMap[parsedUrl.pathname] = newReference;

                    if (opts.deleteOriginals) {
                        filesToDelete.push(normalizedPath);
                    }
                });

            if (opts.enableUrlFragmentHint && opts.removeUrlFragmentHint) {
                markup = markup.replace(/#cache-bust/g, '');
            }

            // Write back to the source file with changes
            grunt.file.write(filepath, markup);

            // Log that we've busted the file
            grunt.log.warn(['The file ', filepath, ' was busted!'].join(''));
        });

    // Delete the original files
    if (opts.deleteOriginals) {
        utils.deleteFiles(filesToDelete);
    }

    // Generate a JSON file with the swapped file names if requested
    if (opts.jsonOutput) {
        var jsonFilePath = path.normalize(opts.baseDir + '/' + (typeof opts.jsonOutput === 'string' ? opts.jsonOutput : opts.jsonOutputFilename));
        utils.writeJsonFile(jsonFilePath, JSON.stringify(processedFileMap));
    }

}
