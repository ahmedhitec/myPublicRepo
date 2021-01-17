/*!
 *
 * Require JS configuration for JET
 * Copyright (c) 1999, 2020, Oracle and/or its affiliates. All rights reserved.
 *
 */
/**
 * Require.js configuration
 */
( function( $, debug ) {
    "use strict";

    var dbg = !!$v( "pdebug" );

    function _ojIsIE11() {
      var nAgt = navigator.userAgent;
      return nAgt.indexOf('MSIE') !== -1 || !!nAgt.match(/Trident.*rv:11./);
    };
    var _ojNeedsES5 = _ojIsIE11();

    requirejs.config({

        // Path mappings for the logical module names
        baseUrl: apex_img_dir + "libraries/",
        paths: {
            "knockout":             "./oraclejet/9.1.0/js/libs/knockout/knockout-3.5.1",
            "jquery":               "./jquery/3.5.1/jquery-3.5.1.min",
            "jqueryui-amd":         "./oraclejet/9.1.0/js/libs/jquery/jqueryui-amd-1.12.1.min",
            "ojs":                  "./oraclejet/9.1.0/js/libs/oj/v9.1.0/" + ( dbg ? "debug" : "min" ) + (_ojNeedsES5 ? '_es5' : ''),
            "ojL10n":               "./oraclejet/9.1.0/js/libs/oj/v9.1.0/ojL10n",
            "ojtranslations":       "./oraclejet/9.1.0/js/libs/oj/v9.1.0/resources",
            "text":                 "./oraclejet/9.1.0/js/libs/require/text",
            "hammerjs":             "./hammer/2.0.8/hammer-2.0.8.min",
            "signals":              "./oraclejet/9.1.0/js/libs/js-signals/signals.min",
            "ojdnd":                "./oraclejet/9.1.0/js/libs/dnd-polyfill/dnd-polyfill-1.0.2.min",
            "css":                  "./oraclejet/9.1.0/js/libs/require-css/css.min",
            "customElements":       "./oraclejet/9.1.0/js/libs/webcomponents/custom-elements.min",
            "proj4":                "./oraclejet/9.1.0/js/libs/proj4js/dist/proj4",
            "touchr":               "./oraclejet/9.1.0/js/libs/touchr/touchr",
            // new in 8.0.0, in support of IE11
            "corejs":               "./oraclejet/9.1.0/js/libs/corejs/shim.min",
            "regenerator-runtime":  "./oraclejet/9.1.0/js/libs/regenerator-runtime/runtime"
        },

        // Shim configurations for modules that do not expose AMD
        shim: {
            "jquery": {
                exports: [ "jQuery", "$" ]
            }
        },

        // This section configures the i18n plugin. It is merging the Oracle JET built-in translation
        // resources with a custom translation file.
        // Any resource file added, must be placed under a directory named "nls". You can use a path mapping or you can define
        // a path that is relative to the location of this main.js file.
        config: {
            ojL10n: {
                merge: {
                    //"ojtranslations/nls/ojtranslations": "./oraclejet/3.0.0/js/libs/oj/v3.0.0/resources/nls/myTranslations"
                }
            },
            text: {
                // Override for the requirejs text plugin XHR call for loading text resources on CORS configured servers
                // eslint-disable-next-line no-unused-vars
                useXhr: function (url, protocol, hostname, port) {
                    // Override function for determining if XHR should be used.
                    // url: the URL being requested
                    // protocol: protocol of page text.js is running on
                    // hostname: hostname of page text.js is running on
                    // port: port of page text.js is running on
                    // Use protocol, hostname, and port to compare against the url being requested.
                    // Return true or false. true means "use xhr", false means "fetch the .js version of this resource".
                    return true;
                }
            }
        }
    });

    if (_ojNeedsES5) {
        define('polyfills', ['corejs', 'regenerator-runtime']);
    } else {
        define('polyfills', []);
    };

    define('promise', ['polyfills'], function () {
        Promise.polyfill = function () {};
        return Promise;
    });


})( apex.jQuery, apex.debug );