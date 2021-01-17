var config        = require('../config');
var gulp          = require('gulp');
var sasslint      = require('gulp-sass-lint');
var header        = require('gulp-header');
var notify        = require('gulp-notify');



gulp.task('lint:styles', function() {
  return gulp
    .src(config.src.styles + '/**/*.{sass,scss}')
    .pipe(sasslint({
      options: {
        'config-file': '_gulp/sass-lint.yml'
      }
    }))
    .pipe(sasslint.format())
    .pipe(sasslint.failOnError())
});



gulp.task('lint', [
  'lint:sass'
]);
