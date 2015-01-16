var through = require('through2')
,   gutil   = require('gulp-util')
,   AWS     = require('aws-sdk')
,   mime    = require('mime')
,   helper  = require('./src/helper.js')
,   PluginError = gutil.PluginError
,   gulpPrefixer
;

const PLUGIN_NAME = 'gulp-s3-upload';

gulpPrefixer = function(AWS) {
    var file_count = 0;
    /* 
        `putObjectParams` now takes in the S3 putObject parameters:
            http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
        - will have a catch for `bucket` vs `Bucket`
        - Will filter out `Body` and `Key` because that is handled by the script and keyTransform
    */
    return function(options) {

        var stream, _s3 = new AWS.S3(),
            the_bucket = options.Bucket || options.bucket;

        if(!the_bucket) {
            throw new PluginError(PLUGIN_NAME, "Missing S3 bucket name!");
        }

        stream = through.obj(function(file, enc, callback) {

            var _stream = this,
                keyTransform, keyname, keyparts, filename,
                mimetype, mime_lookup_name;


            if(file.isNull()) {
                //  Do nothing if no contents
                // callback(null, file);
                return callback(null);
            }

            if (file.isStream()) {
                return callback(new gutil.PluginError(PLUGIN_NAME, 'No stream support.'));
            }

            //  ===== Method Transforms & Look-ups

            //  === Key transform
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
                keyname  = helper.buildName(keyparts.dirname, keyparts.basename + keyparts.extname);
            }

            keyname = keyname.replace(/\\/g, "/");  // jic windows


            // === Mime Lookup/Transform

            mime_lookup_name = keyname;

            if(options.mimeTypeLookup) {
                mime_lookup_name = options.mimeTypeLookup(keyname);
            }
            
            mimetype = mime.lookup(mime_lookup_name);


            //  === metadataMap
            //  New in V1: Map your files (using the keyname) to a metadata object.
            //  ONLY if options.Metadata is undefined.

            if(!options.Metadata && options.metadataMap) {
                if(helper.isMetadataMapFn(options.metadataMap)) {
                    options.Metadata = options.metadataMap(keyname);
                } else {
                    options.Metadata  =  options.metadataMap;
                }
            } 
            //  options.Metdata is not filtered out later.

            gutil.log(gutil.colors.cyan("Uploading ....."), keyname);

            _s3.headObject({
                Bucket: the_bucket
            ,   Key:    keyname
            }, function(getErr, getData) {
                var objOpts;

                if (getErr && getErr.statusCode !== 404) {
                    return callback(new gutil.PluginError(PLUGIN_NAME, "S3 Error: " + getErr.message));
                }

                objOpts = helper.filterOptions(options); 
                
                objOpts.Bucket = the_bucket;
                objOpts.Key = keyname;
                objOpts.Body = file.contents;
                objOpts.ContentType = mimetype;
                
                if(options.uploadNewFilesOnly && !getData || !options.uploadNewFilesOnly) {

                    _s3.putObject(objOpts, function(err, data) {
                        if(err) {
                            return callback(new gutil.PluginError(PLUGIN_NAME, "S3 Error: " + err.message));
                        }

                        file_count++;

                        if(getData) {
                            if(getData.ETag !== data.ETag) {
                                gutil.log(gutil.colors.yellow("Updated ......."), keyname);
                            } else {
                                gutil.log(gutil.colors.gray("No Change ....."), keyname);
                            }
                        } else {    // doesn't exist in bucket, it's new
                            gutil.log(gutil.colors.green("Uploaded! ....."), keyname);
                        }
                        
                        // callback(null, file);
                        callback(null);
                    });
                }
            });
        });

        return stream;
    };
};

// ===== Exporting the plugin main function
// `config` now takes the paramters from the AWS-SDK constructor:
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
module.exports = function(config) {
    var aws_config = config || {};

    aws_config.accessKeyId      = config.accessKeyId || config.key;
    aws_config.secretAccessKey  = config.secretAccessKey || config.secret;


    if(!aws_config.accessKeyId || !aws_config.secretAccessKey) {
        throw new PluginError(PLUGIN_NAME, "Missing AWS Key & Secret.");
    }

    AWS.config.update(aws_config);

    return gulpPrefixer(AWS);
};