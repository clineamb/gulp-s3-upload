var through = require('through2')
,   gutil   = require('gulp-util')
,   AWS     = require('aws-sdk')
,   mime    = require('mime')
,   helper  = require('./src/methods.js')
,   PluginError = gutil.PluginError
;

const PLUGIN_NAME = 'gulp-s3-upload';

function gulpPrefixer(AWS) {
    /*
        options = {
            bucket: "bucket-name", // required
            acl:    ""             // optional, defaults to 'public-read'
        }
    */
    return function(options, s3_params) {

        var stream, keyname_transform;
        var _s3 = new AWS.S3();

        if(!options.bucket) {
            throw new PluginError(PLUGIN_NAME, "Missing S3 bucket name!");
        }

        stream = through.obj(function(file, enc, callback) {
            var keyname, keyparts, filename, mimetype, mimeLookupName;

            if(file.isNull()) {
                //  Do nothing if no contents
                return callback(null, file);
            }

            if (file.isStream()) {
                return callback(new gutil.PluginError(PLUGIN_NAME, 'No stream support'));
            }

            // Plugin Transforms & Look-ups
            // File Name transform
            if(options.name_transform) {
                // allow the transform function to take the complete path
                // in case the user wants to change the path of the file, too.
                keyname = options.name_transform(file.relative);
            } else {
                // otherwise keep it exactly parallel
                keyparts = helper.parsePath(file.relative);
                keyname = helper.buildName(keyparts.dirname, keyparts.basename + keyparts.extname);
            }

            keyname = keyname.replace(/\\/g, "/");  // jic windows

            // Mime Lookup
            mimeLookupName = options.mime_type_lookup ? options.mime_type_lookup(keyname) : keyname;

            mimetype = mime.lookup(mimeLookupName);

            gutil.log(gutil.colors.gray("Checking:       "), keyname);

            _s3.headObject({
                Bucket: options.bucket
            ,   Key: keyname
            }, function(getErr, getData) {
                if (getErr && getErr.statusCode !== 404) {
                    return callback(new gutil.PluginError(PLUGIN_NAME, "S3 Error: " + getErr.message));
                }

                var objectOptions = {
                    Bucket: options.bucket,
                    ACL:    options.acl || 'public-read',
                    Key:    keyname,
                    Body:   file.contents,
                    ContentType: mimetype
                };

                if(options.gzip) {
                    objectOptions.ContentEncoding = 'gzip';
                }

                if(options.cache) {
                    objectOptions.CacheControl = 'max-age=' + options.cache;
                }

                if(options.meta) {
                	objectOptions.Metadata = options.meta;
                }

                if(s3_params) {
                    objectOptions = helper.mergeOptions(objectOptions, s3_params);
                }

                gutil.log(gutil.colors.cyan("Uploading:      "), keyname);

                _s3.putObject(objectOptions, function(err, data) {
                    if(err) {
                        return callback(new gutil.PluginError(PLUGIN_NAME, "S3 Error: " + err.message));
                    }

                    if(getData) {

                        if(getData.ETag !== data.ETag) {
                            gutil.log(gutil.colors.yellow("Updated:        "), keyname);
                        } else {
                            gutil.log(gutil.colors.gray("Not changed:    "), keyname);
                        }

                    } else {    // doesn't exist in bucket, it's new
                        gutil.log(gutil.colors.green("Uploaded:       "), keyname);
                    }

                    callback(null, file);
                });
            });
        });

        return stream;
    };
};

// Exporting the plugin main function
module.exports = function(config) {
    var aws_config = config || {};

    aws_config.accessKeyId      = config.key;
    aws_config.secretAccessKey  = config.secret;


    if(!aws_config.accessKeyId || !aws_config.secretAccessKey) {
        throw new PluginError(PLUGIN_NAME, "Missing AWS Key & secret.");
    }

    AWS.config.update(aws_config);

    return gulpPrefixer(AWS);
};
