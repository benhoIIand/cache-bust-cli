var fs = require('fs');
var path = require('path');
var fileExists = require('file-exists');
var grunt = require('grunt');

var processedFileMap = {};
var filesToDelete = [];

var fileDoesntExist = function(normalizedPath, reference) {
    console.warn('Static asset "' + normalizedPath + '" skipped because it wasn\'t found, original reference "' + reference + '"');
    return false;
};

var doesFileExist = function(filepath) {
    if (!fileExists(filepath)) {
        console.warn('Source file "' + filepath + '" not found.');
        return false;
    } else {
        return true;
    }
};

var removeIgnoredPatterns = function(ignorePatterns, parsedUrl) {
    if (ignorePatterns) {
        var matched = ignorePatterns.some(function(pattern) {
            return new RegExp(pattern, 'ig').test(parsedUrl.href);
        });

        if (matched) {
            return false;
        }
    }

    return true;
};

module.exports = function(opts) {

    var utils = require('./utils');
    var findStaticAssets = require('./findStaticAssets')(opts);

    opts.files
        .split(',')
        .filter(doesFileExist)
        .forEach(function(filepath) {
            fs.readFile(filepath, {
                encoding: opts.encoding
            }, function(err, markup) {
                if (err) {
                    throw new Error(err);
                }

                findStaticAssets(markup, (/\.css$/).test(filepath))
                    .filter(removeIgnoredPatterns.bind(null, opts.ignorePatterns))
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
                                if (!fileExists(normalizedPath)) {
                                    return fileDoesntExist(normalizedPath, parsedUrl.pathname);
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
                            if (!fileExists(normalizedPath)) {
                                return fileDoesntExist(normalizedPath, parsedUrl.pathname);
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
                    markup = markup.replace(/#grunt-cache-bust/g, '');
                }

                // Write back to the source file with changes
                fs.writeFile(filepath, markup, {
                    encoding: opts.encoding
                }, function(err) {
                    if (err) {
                        throw new Error(err);
                    }
                })

                // Log that we've busted the file
                console.log(['The file ', filepath, ' was busted!'].join(''));
            });

            // Delete the original files
            if (opts.deleteOriginals) {
                filesToDelete.forEach(function(filename) {
                    if (fileExists(filename)) {
                        grunt.file.delete(filename);
                    }
                });
            }

            // Generate a JSON file with the swapped file names if requested
            if (opts.jsonOutput) {
                var name = typeof opts.jsonOutput === 'string' ? opts.jsonOutput : opts.jsonOutputFilename;

                console.log(['File map has been exported to ', path.normalize(opts.baseDir + '/' + name), '!'].join(''));
                fs.writeFile(path.normalize(opts.baseDir + '/' + name), JSON.stringify(processedFileMap), {
                    encoding: opts.encoding
                }, function(err) {
                    if (err) {
                        throw new Error(err);
                    }
                })
            }

        });
}
