var config        = require('../config');
var gulp          = require('gulp');
var sass          = require('gulp-sass');
var sourcemaps    = require('gulp-sourcemaps');
var postcss       = require('gulp-postcss');
var rename        = require('gulp-rename');
var autoprefixer  = require('autoprefixer');
var header        = require('gulp-header');
var notify        = require('gulp-notify');
var runsequence   = require('run-sequence');
var importcss     = require('gulp-import-css');
var cssnano       = require('gulp-cssnano');


// PostCSS Processors
var processors = [
  autoprefixer()
];


// General SCSS compiling, with autoprefixer, ignores folders that start with underscore
// gulp.task('styles', function() {
//   gulp.src([
//       config.src.styles + '/**/*.{sass,scss}',
//       '!' + config.src.styles + '**/_*/',
//       '!' + config.src.styles + '**/_*/**/*'
//     ])
//     //.pipe(sourcemaps.init())
//     .pipe(sass({
//       outputStyle: 'expanded', // nested, expanded, compact, compressed
//     }))
//     .on('error', sass.logError)
//     .pipe(postcss(processors))
//     .pipe(header(config.banner, {
//       pkg: pkg
//     }))
//     //.pipe(sourcemaps.write('./'))
//     .pipe(gulp.dest(config.dest.styles))
//     // .pipe(rename({
//     //   suffix: '.min'
//     // }))
//     // .pipe(gulp.dest(config.dest.styles))
//     // .pipe(notify('Styles Completed (<%= file.relative %>)'))
// });

gulp.task('styles', function() {
  return gulp.src([
      config.src.styles + '/*.{sass,scss}',
      '!' + config.src.styles + '**/_*/',
      '!' + config.src.styles + '**/_*/**/*'
    ])
    //.pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded', // nested, expanded, compact, compressed
    }))
    .on('error', sass.logError)
    .pipe(postcss(processors))
    .pipe(header(config.banner, {
      pkg: pkg
    }))
    //.pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(config.dest.styles, {"mode": "0644"}))
    // .pipe(notify("Styles Completed (<%= file.relative %>)"))
});


// Imports into single file, then compresses and adds .min. suffix
gulp.task('styles:dist', function() {
  return gulp.src([
      config.dest.styles + '/*.css',
      '!' + config.dest.styles + '/*.min.css'
    ])
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(cssnano({
      zindex: false,
      discardComments: {
        removeAll: true
      },
      reduceIdents: false,
      mergeLonghand: false,
      discardUnused: {
        keyframes: false
      }
    }))
    .pipe(header(config.banner, {
      pkg: pkg
    }))
   .pipe(gulp.dest(config.dest.styles, {"mode": "0644"}))
  //  .pipe(notify("Styles Minified (<%= file.relative %>)"))
});

gulp.task('styles:build', function() {
    runsequence(
      'styles',
      'styles:dist'
    )
});


gulp.task('styles:watch', function() {
  gulp.watch(config.src.styles + '/**/*.{sass,scss}', function(){
    runsequence(
      'styles'
    )
  });
});
