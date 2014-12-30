"use strict";

var Path    = require('path'),
    _       = require('underscore');

module.exports = {
    parsePath: function(path) {
        var extname = Path.extname(path);
        return {
            dirname: Path.dirname(path),
            basename: Path.basename(path, extname),
            extname: extname
        };
    },
    buildName: function(dirs, filename) {
        return Path.join(dirs, filename);
    },
    mergeOptions: function(defaultObjOpts, userObjOpts) {
        // Body is handled by stream, Bucket will be defined
        // in first parameter.
        userObjOpts = _.omit(userObjOpts, ['Body', 'Bucket']);

        return _.extend(defaultObjOpts, userObjOpts);
    }
};