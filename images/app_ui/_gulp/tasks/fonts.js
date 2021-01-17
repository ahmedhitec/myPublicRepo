var config        = require('../config');
var gulp          = require('gulp');
var notify        = require('gulp-notify');



gulp.task('fonts', function () {
  gulp.src([
      config.src.fonts + '/**/*'
    ])
    .pipe(gulp.dest(config.dest.fonts))
    .pipe(notify("Scripts Completed (<%= file.relative %>)"))
});



gulp.task('fonts:watch', function() {
  gulp.watch(config.src.fonts + '/**/*', ['fonts']);
});
