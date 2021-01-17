var config        = require('../config');
var gulp          = require('gulp');
var runsequence   = require('run-sequence');



gulp.task('build', function(callback) {
  runsequence(
    'clean',
    'media',
    'media:svgstore',
    'styles:build',
    'fonts',
    callback
  );
});

gulp.task('build-css', function(callback) {
  runsequence(
    'clean',
    'styles:build',
    callback
  );
});
