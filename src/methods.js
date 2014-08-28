"use strict";

var Path    = require('path');

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
    }
};