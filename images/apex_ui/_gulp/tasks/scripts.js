var config        = require('../config');
var gulp          = require('gulp');
var uglify        = require('gulp-uglify');
var rename        = require('gulp-rename');
var flatten       = require('gulp-flatten');
var header        = require('gulp-header');
var notify        = require('gulp-notify');



gulp.task('scripts', function() {
  return gulp
    .src(config.src.scripts + '/**/*.js')
    .pipe(header(config.banner, {
      pkg: pkg
    }))
    //.pipe(uglify())
    .pipe(flatten())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(config.dest.scripts + '/minified'))
    .pipe(notify('Scripts Completed (<%= file.relative %>)'))
});



gulp.task('scripts:watch', function() {
  gulp.watch(config.src.scripts + '/**/*.{js,json}', ['scripts']);
});



/*

  //Config
      "filename": "f4000_p4500_all.min.js",
      "files": [
          "js/minified/pe.model.min.js",
          "js/minified/pe.callbacks.min.js",
          "js/minified/widget.peMessagesView.min.js",
          "js/minified/widget.peSearch.min.js",
          "js/minified/widget.codeEditor.min.js",
          "js/minified/f4000_p4500.gallery.min.js",
          "js/minified/f4000_p4500.min.js",
          "js/minified/f4000_p4500.tree.min.js",
          "js/minified/f4000_p4500.dump.min.js",
          "js/minified/widget.propertyEditor.min.js",
          "js/minified/widget.lovDialog.min.js",
          "js/minified/f4000_p4500.pe.min.js",
          "js/minified/gridlayout.min.js",
          "js/minified/f4000_p4500.glv.min.js"

  //Task
  'use strict';
(function() {
    var gulp = require('gulp');
    var config = require('./config.json');

    var rq = require('../../internal_utilities/apex_node_build/build.js')(gulp, config, {
        "apex": {
            "require": require
        }
    });

    var uglify = require('gulp-uglify');
    var flatten = require('gulp-flatten');
    var jsBuild = function() {
        rq("del")('js/minified/*.js');
        return gulp.src('js/*.js')
                .pipe(uglify({
                    mangle:           {},
                    preserveComments: false
                }))
                .pipe(flatten())
                .pipe(rq("gulp-rename")({
                    suffix: '.min'
                }))
                .pipe(gulp.dest('js/minified'))
                .on("end", function() {
                    console.log("finished building JS for APEX_UI");
                    return gulp.src(
                            config.scripts.concat.files
                    )
                            .pipe(rq("gulp-concat")( config.scripts.concat.filename ))
                            .pipe(gulp.dest("js/minified/"))
                });
    };
    // gulp.task('js-build', jsBuild);
    // rq("apex").extendApexModule("build", jsBuild);

    gulp.task("watch-apex", function( cb ) {
        rq("browser-sync").init({
                proxy: {
                    target: "myapex/apex51"
                }
            }
        );
        rq("apex").watch( cb );
    });

})();
*/
