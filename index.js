"use strict";

var through = require('through2')
,   gutil   = require('gulp-util')
,   AWS     = require('aws-sdk')
,   mime    = require('mime')
,   helper  = require('./src/methods.js')
,   PluginError = gutil.PluginError
,   s3, s3_params
;

const PLUGIN_NAME = 'gulp-s3-upload';

function gulpPrefixer(s3) {
    /*
        options = {
            bucket: "bucket-name", // required
            acl:    ""             // optional, defaults to 'public-read'
        }
    */
    return function(options) {
    
        var stream, keyname_transform;
        
        if(!options.bucket) {
            throw new PluginError(PLUGIN_NAME, "Missing S3 bucket name!");
        }

        stream = through.obj(function(file, enc, callback) {
            var keyname, keyparts, filename, mimetype;

            if(file.isNull()) {
                //  Do nothing if no contents
            }
            
            if(file.isBuffer()) {
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
                mimetype = mime.lookup(keyname);
                
                s3.client.getObject({
                    Bucket: s3_params.Bucket
                ,   Key: keyname
                }, function(getErr, getData) {
                    s3.client.putObject({
                        Bucket: options.bucket,
                        ACL:    options.acl || 'public-read',
                        Key:    keyname,
                        Body:   file.contents,
                        ContentType: mimetype
                    }, function(err, data) {
                        if(err) {
                            gutil.log("Error with", keyname);
                            gutil.log(err);
                        } else if(getData) {
                            if(getData.ETag !== data.ETag) {
                                gutil.log(gutil.colors.cyan("Updated..."), keyname);

                            } else {
                                gutil.log(gutil.colors.gray("No Change..."), keyname);
                            }
                            
                        } else {    // doesn't exist in bucket, it's new
                            gutil.log(gutil.colors.cyan("Uploaded..."), keyname);
                        }
                    });
                });
            }

            return callback();
        });

        return stream;
    }
};

// Exporting the plugin main function
module.exports = function(config) {
    if(!config) {
        throw new PluginError(PLUGIN_NAME, "Missing AWS Key & secret.");
        return false;
    }
    
    AWS.config.update({
        accessKeyId:        config.key
    ,   secretAccessKey:    config.secret
    });

    s3 = new AWS.S3();

    return gulpPrefixer(s3);
}