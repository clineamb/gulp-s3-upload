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
    return function(options) {
    
        var stream, keyname_transform;
        var _s3 = new AWS.S3();
        
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
                
                _s3.getObject({
                    Bucket: options.bucket
                ,   Key: keyname
                }, function(getErr, getData) {
                    gutil.colors.red("S3 Error:", getErr);

                    _s3.putObject({
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
    };
};

// Exporting the plugin main function
module.exports = function(config) {
    var aws_config = {};

    aws_config.accessKeyId      = config.key;
    aws_config.secretAccessKey  = config.secret;

    if(config.region) {
        aws_config.region = config.region;
    }

    if(!config) {
        throw new PluginError(PLUGIN_NAME, "Missing AWS Key & secret.");
        return false;
    }
    
    AWS.config.update(aws_config);

    return gulpPrefixer(AWS);
}