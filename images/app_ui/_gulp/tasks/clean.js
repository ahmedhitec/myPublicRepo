var config        = require('../config');
var gulp          = require('gulp');
var del           = require('del');



gulp.task('clean', function(cb) {
  return del([
    config.dest.styles,
    config.dest.scripts,
    config.dest.media,
    config.dest.fonts
  ]);
});
