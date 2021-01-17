var config        = require('../config');
var gulp          = require('gulp');
var uglify        = require('gulp-uglify');
var rename        = require('gulp-rename');
var header        = require('gulp-header');
var notify        = require('gulp-notify');



gulp.task('scripts', function() {
  return gulp
    .src(config.src.scripts + '/**/*.{js,json}')
    .pipe(header(config.banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(uglify())
    .pipe(gulp.dest(config.dest.scripts))
    .pipe(notify("Scripts Completed (<%= file.relative %>)"))
});



gulp.task('scripts:watch', function() {
  gulp.watch(config.src.scripts + '/**/*.{js,json}', ['scripts']);
});
