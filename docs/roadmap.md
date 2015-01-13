# Feature Roadmap/TODOs

## TODOs for Version 1.0

- [x] Single parameters parallel to putObject documentation.
  * Due to most merge requests making other options from the putObject paramters
    available, `gulp-s3-plugin` will merge the latest 0.8.5 update of 2 paramters (default options defined above and the s3 parameters found in the [AWS-S3 documentation](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property)).
- [x] Include a `verbose` option to send back data from [getObject](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property) call and/or after upload.

Future usage:

    gulp.task("upload", function() {
        return gulp.src("./dir/to/upload/**")
            .pipe(s3({options}))
    });