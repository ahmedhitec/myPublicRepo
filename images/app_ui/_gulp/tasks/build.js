var config        = require('../config');
var gulp          = require('gulp');
var runsequence   = require('run-sequence');



gulp.task('build', function(callback) {
  runsequence(
    'clean',
    'media',
    'media:svgstore',
    'styles:build',
    'scripts',
    'fonts',
    callback
  );
});
