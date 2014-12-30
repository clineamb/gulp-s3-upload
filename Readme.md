# gulp-s3-upload

Made for work + personal use for uploading assets to Amazon S3 servers.  
This helps to make it an easy gulp task.

This package uses the [aws-sdk (node)](http://aws.amazon.com/sdk-for-node-js/).

[NPM](https://www.npmjs.com/package/gulp-s3-upload) / [Changelog](changelog.md)

## Install
    npm install gulp-s3-upload

## Usage

Put in your AWS Developer key/secret. Region is optional.

    var gulp = require('gulp');
    var s3 = require('gulp-s3-upload')({
        key:       "YOUR DEV ID",
        secret:    "YOUR SECRET",
        region:    "us-west-2"     // optional
    });

The other options not mentioned above available in the [AWS Config constructor](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property) are also available, though by default are undefined.

Signature to pass through pipe: `s3(plugin_options [, putObjectParams])`;

Create a task.

    gulp.task("upload", function() {
        gulp.src("./dir/to/upload/**")
            .pipe(s3({
                bucket: 'your-bucket-name', //  Required
                acl:    'public-read'       //  Optional ACL permissions, defaults to public-read.
            }))
        ;
    });

**As of Version 0.8.5**, the s3 task can now take a second parameter that has all the options available in the [S3 putObject documentation](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property).  

Any settings that are overlapped between the required paramter in this new optional parameter will be overwritten if defined in the second optional parameter, with `Body` being the exception, since that is purely handled by the gulp stream, and `Bucket` since it is required in the first set of required options.

The way this is handled in the future will be changed for version 1.0, condensing everything into one `options` parameter. See the [Feature Roadmap](roadmap.md) for details.

### Options

**bucket** *(required)*

Type: `string`

The bucket that the files will be uploaded to.


**acl**

Type: `string`

See [Access Control List (ACL) Overview](http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html)
for more information.  Defaults to 'public-read'.


**gzip**

Type: `boolean`

Set the `Content-Encoding` meta to `gzip` so a gzipped version of the file can be uploaded to S3.


**cache**

Type: `number`

Set the `Cache-Control` meta to `max-age={cache}` for the object, so browsers won't fetch the file on every page request.


**meta**

Type: `object`

Set metadata values for the object. If you use `{myKey: 'Some value'}` the uploaded object will have the meta property *myKey* with the value *Some value*.


**nameTransform**

Type: `function`

Use this to transform your file names before they're uploaded to your S3 bucket.

Example:

    gulp.task("upload_transform", function() {
        gulp.src("./dir/to/upload/**")
            .pipe(s3({
                bucket: 'example-bucket',
                nameTransform: function(relative_filename) {
                    var new_name = change_file_name(relative_filename);
                    return new_name;
                }
            }))
        ;
    });


**mime_type_lookup**

Type: `function`

Use this to transform what the key that is used to match the MIME type when uploading to s3.

Example:

    gulp.task("upload_transform", function() {
        gulp.src("./dir/to/upload/**")
        .pipe(s3({
            bucket: 'example-bucket',
            mimeTypeLookup: function(originalFilepath) {
                return originalFilepath.replace('.gz', ''); //ignore gzip extension
            },
        }));
    });

----------------------------------------------------

### License

Copyright (c) 2014, [Caroline Amaba](mailto:caroline.amaba@gmail.com)

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
