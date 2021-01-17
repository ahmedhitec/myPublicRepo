var config        = require('../config');
var gulp          = require('gulp');
var imagemin      = require('gulp-imagemin');
var svgstore      = require('gulp-svgstore');
var rename        = require('gulp-rename');
var notify        = require('gulp-notify');
var runsequence   = require('run-sequence');



// Optimizes Media using ImageMin
gulp.task('media', function () {
  gulp.src([
    config.src.media + '/**/*',
    config.src.media + '/**/**/*',
    '!' + config.src.media + '/**/_defs',
      '!' + config.src.media + '/**/_defs/**/*'
    ])
    .pipe(imagemin([
      imagemin.gifsicle({
        interlaced: true
      }),
      imagemin.jpegtran({
        progressive: true
      }),
      imagemin.optipng({
        optimizationLevel: 5
      }),
      imagemin.svgo({
        plugins: [
          {
            removeUselessDefs: false
          },
          {
            cleanupIDs: false
          }
        ]
      })
    ]))
    .pipe(gulp.dest(config.dest.media + '', {"mode": "0644"}))
    //.pipe(notify('Media Optimized (<%= file.relative %>)'));
});



// SVG Symbol creation
gulp.task('media:svgstore', function () {
  gulp.src(config.src.media + '/_defs/**/*.svg', {
      base: config.src.media + '/_defs'
    })
    .pipe(svgstore({}))
    .pipe(rename('defs.svg'))
    .pipe(gulp.dest(config.dest.media, {"mode": "0644"}))
    .pipe(notify('SVG Defs Updated (<%= file.relative %>)'))
});



gulp.task('media:watch', function() {
  gulp.watch([
    config.src.media + '/**',
    '!' + config.src.media + '/**/_defs',
    '!' + config.src.media + '/**/_defs/**/*'
  ], function(){
    runsequence(
      'media'
    )
  });
  gulp.watch(config.src.media + '/_defs/**/*.svg', function(){
    runsequence(
      'media:svgstore'
    )
  });
});
