# Changelog

## Version 1.0
* See changes beta-1.0 changes.
* Added `uploadNewFilesOnly` flag option.
* Fixed issue [#3](http://github.com/clineamb/gulp-s3-upload/issues/3), files stopping at a certain number consistently.

## Version beta-1.0
* AWS constructor now follows [AWS-SDK constructor parameters.](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property).
* pipe transform `s3()` now only takes one `options` param that is parallel to the [AWS-S3 putObject method](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property).
  * This makes the parameters case-sensitive.
  * Transforms are filtered out of the `options` param.
* Changed lookup/transform options:
  * `name_transform` to `keyTransform` (or `nameTransform`)
  * `mime_type_lookup` to `mimeTypeLookup`
* Added `metadataMapper` as an option (see [docs](readme.md) for more details).
* `ACL` option for `putObject` no longer defaults to `public-read`. Must be user defined.

### Version 0.8.6
* unchanged the `name_transform` & `mime_type_lookup` function names; could break.  Will change in Version 1

### Version 0.8.5

* Added optional second paramter that takes
* Merged a [pull request](https://github.com/clineamb/gulp-s3-upload/pull/5) to allow the AWS constructor to take any parameters based on the [AWS Config documentation](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property).
* Merged a [pull request](https://github.com/clineamb/gulp-s3-upload/pull/4) to allow for an different mime-type lookup.
* Updated `Readme.md` to reflect new updates.
* Added [roadmap.md](roadmap.md) to document upcoming changes.
* Added a changlog!