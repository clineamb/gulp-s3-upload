# WIP
# gulp-s3-upload

Made for work + personal use with to work with our production flow.
We're constantly uploading new assets to Amazone S3 servers.
This helps to make it an easy gulp task.

This package uses the [aws-sdk (node)](http://aws.amazon.com/sdk-for-node-js/).

## Install
    npm install gulp-s3-upload

## Usage
    
Put in your AWS Developer key/secret. Region is optional.

    var gulp = require('gulp');
    var s3 = require('gulp-s3-upload')({
        accessKeyId:        "YOUR DEV ID",
        secretAccessKey:    "YOUR SECRET",
        region:             "us-west-2"     // optional
    });

Create a task.

    gulp.task("upload", function() {
        gulp.src("./dir/to/upload/**")
            .pipe(aws({
                bucket: 'your-bucket-name',  //  Required
                acl:    'public-read',       //  Optional ACL permissions, defaults to public-read.
                name_transform: null
            }))
        ;
    });

#### Options

*bucket* (required)
Type: `string`
The bucket that the files will be uploaded tp/

*acl* 
Type: `string`
See [Access Control List (ACL) Overview](http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html) for more information.  Defaults to 'public-read'.

*name_transform*
Type: `function`

Use this to transform your file names before they're uploaded to your S3 bucket.
Example:

    gulp.task("upload_transform", function() {
        gulp.src("./dir/to/upload/**")
            .pipe(aws({
                bucket: 'example-bucket',
                name_transform: function(relative_filename) {
                    var new_name = change_file_name(relative_filename);
                    return new_name;
                }
            }))
        ;
    }