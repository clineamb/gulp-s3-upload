var through     = require('through2')
,   gutil       = require('gulp-util')
,   AWS         = require('aws-sdk')
,   mime        = require('mime')
,   _           = require('underscore')
,   helper      = require('./src/helper.js')
,   PluginError = gutil.PluginError
,   gulpPrefixer
;

const PLUGIN_NAME = 'gulp-s3-upload';

gulpPrefixer = function (AWS) {
    /*
        `putObjectParams` now takes in the S3 putObject parameters:
            http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
        - will have a catch for `bucket` vs `Bucket`
        - Will filter out `Body` and `Key` because that is handled by the script and keyTransform
    */
    return function (options) {

        var stream, _s3 = new AWS.S3(),
            the_bucket = options.Bucket || options.bucket;

        if(!the_bucket) {
            throw new PluginError(PLUGIN_NAME, "Missing S3 bucket name!");
        }

        stream = through.obj(function (file, enc, callback) {

            var _stream = this,
                keyTransform, keyname, keyparts, filename,
                mimetype, mime_lookup_name, metadata;

            if(file.isNull()) {
                //  Do nothing if no contents
                return callback(null);
            }

            if(file.isStream()) {
                return callback(new gutil.PluginError(PLUGIN_NAME, 'No stream support.'));
            }

            //  ===== METHOD TRANSFORMS & LOOKUPS =====
            //  =======================================

            //  === Key transform ===
            //  Allow for either keyTransform or nameTransform.
            //  We're using Key to be consistent with AWS-S3.

            keyTransform = options.keyTransform || options.nameTransform;

            if(keyTransform) {

                // allow the transform function to take the complete path
                // in case the user wants to change the path of the file, too.
                keyname = keyTransform(file.relative);

            } else {

                // otherwise keep it exactly parallel
                keyparts = helper.parsePath(file.relative);
                keyname = helper.buildName(keyparts.dirname, keyparts.basename + keyparts.extname);

            }

            // just in case user is on windows that uses backslashes
            keyname = keyname.replace(/\\/g, "/");


            // === Mime Lookup/Transform ===

            mime_lookup_name = keyname;

            if(options.mimeTypeLookup) {
                mime_lookup_name = options.mimeTypeLookup(keyname);
            }

            mimetype = mime.lookup(mime_lookup_name);

            // === Charset ===
            // Just in case text files get garbled. Appends to mimetype.
            // `charset` field gets filtered out later.
            if(options.charset && mimetype == 'text/html') {
                mimetype += ';charset=' + options.charset;
            }

            //  === metadataMap ===
            //  New in V1: Map your files (using the keyname) to a metadata object.
            //  ONLY if `options.Metadata` is undefined.

            if(!options.Metadata && options.metadataMap) {
                if(helper.isMetadataMapFn(options.metadataMap)) {
                    metadata = options.metadataMap(keyname);
                } else {
                    metadata = options.metadataMap;
                }
            }

            //  options.Metadata is not filtered out later.

            gutil.log(gutil.colors.cyan("Uploading ....."), keyname);

            _s3.headObject({
                'Bucket': the_bucket,
                'Key':    keyname
            }, function (getErr, getData) {

                var objOpts;

                if(getErr && getErr.statusCode !== 404) {
                    return callback(new gutil.PluginError(PLUGIN_NAME, "S3 headObject Error: " + getErr.stack));
                }

                objOpts = helper.filterOptions(options);

                objOpts.Bucket      = the_bucket;
                objOpts.Key         = keyname;
                objOpts.Body        = file.contents;
                objOpts.ContentType = mimetype;
                objOpts.Metadata    = metadata;

                if(options.uploadNewFilesOnly && !getData || !options.uploadNewFilesOnly) {
                    _s3.putObject(objOpts, function (err, data) {

                        if(err) {
                            return callback(new gutil.PluginError(PLUGIN_NAME, "S3 putObject Error: " + err.stack));
                        }

                        if(getData) {
                            if(getData.ETag !== data.ETag) {
                                gutil.log(gutil.colors.yellow("Updated ......."), keyname);
                            } else {
                                gutil.log(gutil.colors.gray("No Change ....."), keyname);
                            }
                        } else {
                            // doesn't exist in bucket, the object is new to the bucket
                            gutil.log(gutil.colors.green("Uploaded! ....."), keyname);
                        }

                        callback(null);
                    });
                }
            });
        });

        return stream;
    };
};

// ===== EXPORTING MAIN PLUGIN FUNCTION =====
// `config` now takes the paramters from the AWS-SDK constructor:
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property

module.exports = function (config) {
    var aws_config = config || {};

    // Maintain backwards compatibility with legacy key and secret options
    if (config.key) {
        aws_config.accessKeyId = config.key;
    }

    if (config.secret) {
        aws_config.secretAccessKey = config.secret;
    }

    // Intentionally not mandating the accessKeyId and secretAccessKey as they
    // will be loaded automatically by the SDK from either environment variables
    // or the credentials file.
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html

    // Configure the proxy if an environment variable is present.
    if (process.env.HTTPS_PROXY) {
        gutil.log("setting https proxy to %s", process.env.HTTPS_PROXY);
        if (!aws_config.httpOptions)
        aws_config.httpOptions = {};

        var HttpsProxyAgent = require('https-proxy-agent');
        aws_config.httpOptions.agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
    }

    // Update the global AWS config if we have any overrides
    if (Object.keys(aws_config).length) {
        AWS.config.update(aws_config);
    }

    AWS.config.update(aws_config);

    return gulpPrefixer(AWS);
};
