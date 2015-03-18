# gulp-s3-upload

Use for uploading assets to Amazon S3 servers.  
This helps to make it an easy gulp task.

This package uses the [aws-sdk (node)](http://aws.amazon.com/sdk-for-node-js/).

[NPM](https://www.npmjs.com/package/gulp-s3-upload) / [Changelog](docs/changelog.md)

## Install

    npm install gulp-s3-upload

## Usage

Put in your AWS Developer key/secret. These are required, or else the plugin doesn't have access to the bucket you want to upload to.

```js
    var gulp = require('gulp');
    var s3 = require('gulp-s3-upload')({
        accessKeyId:        "YOUR DEV ID",
        secretAccessKey:    "YOUR SECRET"
    });
```
The other options not mentioned above (like `region`) available in the [AWS Config Constructor](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property) are also available, though by default are `undefined`.

Option names `key` and `secret` are also alternative option names, though the use of `accessKeyId` and `secretAccessKey` are encouraged to match the AWS Config Constructor.

Create a task.

```js
    gulp.task("upload", function() {
        gulp.src("./dir/to/upload/**")
            .pipe(s3({
                Bucket: 'your-bucket-name', //  Required
                ACL:    'public-read'       //  Needs to be user-defined
            }))
        ;
    });
```
## Options

**Bucket (bucket)** *(required)*

Type: `string`

The bucket that the files will be uploaded to.

Other available options are the same as the ones found in the AWS-SDK docs for S3.  The end of the readme below for a list of availble AWS-SDK resources that this plugin constantly references.

**NOTE:** `Key`, `Body`, and `ContentType` are the only options availble in `putObject` that do **NOT** need to be defined because the gulp will handle these for you. If these are defined, the plugin will filter them out.

### gulp-s3-plugin options

### charset

Type: `string`

Use this to add a charset to the mimetype. `"charset=[CHARSET]"` gets appended to the mimetype if this is defined.


#### keyTransform (nameTransform)

Type: `function`

Use this to transform your file names before they're uploaded to your S3 bucket.  
(Previously known as `name_transform`).

```js
    gulp.task("upload_transform", function() {
        gulp.src("./dir/to/upload/**")
            .pipe(s3({
                Bucket: 'example-bucket',
                ACL: 'public-read',
                keyTransform: function(relative_filename) {
                    var new_name = changeFileName(relative_filename);
                    // or do whatever you want
                    return new_name;
                }
            }))
        ;
    });
```


#### metadataMap

Type: `object` or `function`

If you have constant metadata you want to attach to each object,
just define the object, and it will be included to each object.
If you wish to change it per object, you can pass a function through
to modify the metadata based on the (transformed) keyname.

Example (passing an `object`):
```js
    gulp.task("upload", function() {
        gulp.src("./dir/to/upload/**")
        .pipe(s3({
            Bucket: 'example-bucket',
            ACL: 'public-read',
            metadataMap: {
                "uploadedVia": "gulp-s3-upload",
                "exampleFlag":  "Asset Flag"
            }
        }));
    });
```
Passing the `s3.putObject` param option `Metadata` is effectively the same thing
as passing an `object` to `metadataMap`.  `Metadata` is defined and `metadataMap` is not
it will use the object passed to `Metadata` as metadata for all the files that
will be uploaded.  If both `Metadata` and `metadataMap` are defined, `Metadata` will take
precedence and be added to each file being uploaded.

Example (passing a `function`):

```js    
    // ... setup gulp-s3-upload ...
    var path = require('path');
    var metadata_collection = {
        "file1.txt": {
            "uploadedVia": "gulp-s3-upload",
            "example": "Example Data"
        },
        "file2.html": {
            "uploadedVia": "gulp-s3-upload"
        }
    };

    gulp.task("uploadWithMeta", function() {
        gulp.src("./upload/**")
        .pipe(s3({
            Bucket: 'example-bucket',
            ACL: 'public-read',
            metadataMap: function(keyname) {
                path.basename(keyname); // just get the filename
                return metadata_collection[keyname]; // return an object
            }
        }));
    });
```

When passing a function, it's important to note that the file
will already be transformed either by the `keyTransform` you defined
or by the default function which creates a keyname relative to
your S3 bucket, e.g. you can get "example.txt" or "docs/example.txt"
depending on how it was structured locally (hence why in the example, 
the `path` module is used to just get the filename).

**Note:** You should be responsible for handling mismatching/unmatched keynames
to the metadata you're mapping.


#### mimeTypeLookup

Type: `function`

Use this to transform what the key that is used to match the MIME type when uploading to S3.

```js
    gulp.task("upload", function() {
        gulp.src("./dir/to/upload/**")
        .pipe(s3({
            Bucket: 'example-bucket',
            ACL: 'public-read',
            mimeTypelookup: function(original_keyname) {
                return original_keyname.replace('.gz', ''); // ignore gzip extension
            },
        }));
    });
```


#### uploadNewFilesOnly

Type: `boolean`

Set `uploadNewFilesOnly: true` if you only want to upload new files and not
overwrite existing ones.



## AWS-SDK References

* [AWS Config Constructor](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property)
* [S3 putObject](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property)
* [Access Control List (ACL) Overview](http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html)

----------------------------------------------------

## License

Copyright (c) 2014, [Caroline Amaba](mailto:caroline.amaba@gmail.com)

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
