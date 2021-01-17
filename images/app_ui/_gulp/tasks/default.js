var config        = require('../config');
var gulp          = require('gulp');
var runsequence   = require('run-sequence');



gulp.task('default', function(callback) {
  runsequence(
    //'clean',
    'build',
    'watch',
    callback
  );
});
