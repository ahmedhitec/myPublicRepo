var config        = require('../config');
var gulp          = require('gulp');



gulp.task('watch',
  [
    'media:watch',
    'styles:watch',
    //'scripts:watch',
    'fonts:watch'
  ]
);
