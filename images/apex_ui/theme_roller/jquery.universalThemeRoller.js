/*var utr = {
    busy: false,
    opened: false,
    invoke: undefined,
    close: undefined,
    nested: false
};*/

(function($, server, utr, lang){
    var BUILDER_WINDOW_NAME = "APEX_BUILDER"; // keep in sync with builder.js

    function isOpenerApexBuilder() {
        // if *this* is the builder window then don't care what the opener is
        // a builder opening the builder can result in a stale instance without this check
        if ( isBuilderWindow() ) {
            return false;
        }
        try {
            // builder urls are in the 4000s
            if ( window.opener && !window.opener.closed && window.opener.apex &&
                window.opener.apex.jQuery &&
                ( window.opener.location.href.match(/f?p=4\d\d\d:/) || window.opener.document.getElementById("pFlowId") ) ) {
                return true;
            }
        } catch ( ex ) {
            return false; // window must contain a page from another domain
        }
        return false;
    }

    function isBuilderWindow() {
        return window.name && window.name.match( "^" + BUILDER_WINDOW_NAME );
    }

    function getBuilderInstance() {
        if ( isOpenerApexBuilder() ) {
            return window.opener.document.getElementById("pInstance").value;
        }
        return null;
    }

    var requiredFilesImported = false;

    var defaultOptions = {
        filePaths: {
            utStylesheet: "less/ut.less",
            themeStylesheets: ["less/ut.less"],
            lessCompilerScript: "js/less.js",
            utrStylesheet: "css/utr.css",
            utrScript: "js/utr.js",
            colorPickerScript: window.apex_img_dir + "apex_ui/theme_roller/utr.colorpicker.js",
            colorPickerStylesheet: window.apex_img_dir + "libraries/jquery-colorpicker/1.4/css/colorpicker.css",
            jQueryUiComponentsScript: "js/jquery-ui.utr.js",
            codeEditor: window.apex_img_dir + "apex_ui/js/widget.codeEditor.js",

            // BEGIN FEATURE THEME ROLLER LOGO EDITOR
            apexTabsWidgetScript: window.apex_img_dir + 'libraries/apex/widget.apexTabs.js'
            // END FEATURE THEME ROLLER LOGO EDITOR
        }, 
        config: {
            themeId: 42,
            builderSessionId: getBuilderInstance(),
            standalone: false,
            nested: false
        }
    };
    var options = defaultOptions;
    var stylesheetCache = {};

    var msgKeys = [
            "UTR.THEME_ROLLER",
            "UTR.COMMON.CONFIRM",
            "UTR.COMMON.SET_CURRENT_WHEN_READ_ONLY_PROMPT",
            "UTR.SET_AS_CURRENT_THEME_STYLE_SUCCESS",
            "UTR.SET_AS_CURRENT_THEME_STYLE",
            "UTR.RESET.STYLE",
            "UTR.CURRENT",
            "UTR.SET_AS_CURRENT",
            "UTR.CHANGE_THEME",
            "UTR.ERROR.SET_AS_CURRENT_FAILED",
            "UTR.COMMON.WARNING",
            "UTR.COMMON.COPY",
            "UTR.COMMON.SUCCESS",
            "UTR.COMMON.YES",
            "UTR.COMMON.NO",
            "UTR.COMMON.OK",
            "UTR.COMMON.CANCEL",
            "UTR.COMMON.STYLE_NAME",
            "UTR.COMMON.BASE_STYLE",
            "UTR.BUTTONS.CLOSE",
            "UTR.BUTTONS.MINIMIZE",
            "UTR.BUTTONS.CODE_EDITOR",
            "UTR.SAVE_AS",
            "UTR.SAVE_AS.PROMPT",
            "UTR.SAVE_AS.SUCCESS",
            "UTR.SAVE",
            "UTR.SAVE.PROMPT",
            "UTR.SAVE.SUCCESS",
            "UTR.RESET",
            "UTR.RESET.PROMPT",
            "UTR.CUSTOM_CSS",
            "UTR.CUSTOM_CSS.DESCRIPTION",
            "UTR.CUSTOM_CSS.WARNING",
            "UTR.CHANGE.PROMPT",
            "UTR.ERROR",
            "UTR.ERROR.UNSUPPORTED_STYLE",
            "UTR.ERROR.INPUT_NOT_FOUND",
            "UTR.ERROR.INVALID_STYLE",
            "UTR.ERROR.UNSUPPORTED_THEME",
            "UTR.ERROR.CREATE_FAILED",
            "UTR.ERROR.UPDATE_FAILED",
            "UTR.ERROR.LOAD_FAILED",
            "UTR.CONTRAST_VALIDATION.TITLE",
            "UTR.CONTRAST_VALIDATION.MESSAGE",
            "UTR.CONTRAST_VALIDATION.FAILED",
            "UTR.CONTRAST_VALIDATION.PASSED",
            "UTR.CONTRAST_VALIDATION.LARGE_TEXT_NOTICE",
            "UTR.HELP",
            "UTR.HELP.P1",
            "UTR.HELP.P2",
            "UTR.TOOLBAR.BUTTONS.COMMON",
            "UTR.TOOLBAR.BUTTONS.ALL",
            "UTR.SEARCH",
            "UTR.UNDO",
            "UTR.REDO",
            "UTR.CONFIG_OUTPUT",
            "UTR.CONFIG_OUTPUT_ERRO",
            'UTR.LESS.HEADER_ACCENT',
            'UTR.LESS.HEADER_HEIGHT',
            'UTR.LESS.BODY_ACCENT',
            'UTR.LESS.CONTAINER_BORDER_RADIUS',
            'UTR.LESS.LABEL',
            'UTR.LESS.BORDER_RADIUS',
            'UTR.LESS.LINK_COLOR',
            'UTR.LESS.FOCUS_OUTLINE',
            'UTR.LESS.NAVIGATION_TREE',
            'UTR.LESS.ACTIONS_COLUMN',
            'UTR.LESS.LEFT_COLUMN',
            'UTR.LESS.BODY_CONTENT_MAX_WIDTH',
            'UTR.LESS.BACKGROUND',
            'UTR.LESS.HOVER_STATE',
            'UTR.LESS.BODY',
            'UTR.LESS.FOREGROUND',
            'UTR.LESS.SELECTED_STATE',
            'UTR.LESS.TEXT',
            'UTR.LESS.ICON',
            'UTR.LESS.NORMAL',
            'UTR.LESS.ACTIVE_STATE',
            'UTR.LESS.TITLE_BAR',
            'UTR.LESS.HEADER',
            'UTR.LESS.DISABLED',
            'UTR.LESS.PRIMARY',
            'UTR.LESS.SUCCESS',
            'UTR.LESS.INFO',
            'UTR.LESS.WARNING',
            'UTR.LESS.DANGER',
            'UTR.LESS.REGION_HEADER',
            'UTR.LESS.ITEM',
            'UTR.LESS.HOT',
            'UTR.LESS.SIMPLE',
            'UTR.LESS.MENU',
            'UTR.LESS.GLOBAL_COLORS',
            'UTR.LESS.CONTAINERS',
            'UTR.LESS.NAVIGATION',
            'UTR.LESS.REGIONS',
            'UTR.LESS.BUTTONS',
            'UTR.LESS.FORMS',
            'UTR.LESS.STATES',
            'UTR.LESS.PALETTE',
            'UTR.LESS.INTERACTIVE_REPORTS',
            'UTR.LESS.LAYOUT',
            'UTR.LESS.COLOR_1',
            'UTR.LESS.COLOR_2',
            'UTR.LESS.COLOR_3',
            'UTR.LESS.COLOR_4',
            'UTR.LESS.COLOR_5',
            'UTR.LESS.COLOR_6',
            'UTR.LESS.COLOR_7',
            'UTR.LESS.COLOR_8',
            'UTR.LESS.COLOR_9',
            'UTR.LESS.COLOR_10',
            'UTR.LESS.COLOR_11',
            'UTR.LESS.COLOR_12',
            'UTR.LESS.COLOR_13',
            'UTR.LESS.COLOR_14',
            'UTR.LESS.COLOR_15',
            /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
            'UTR.TABS.THEME_STYLE',
            'UTR.TABS.LOGO',
            'UTR.LOGO.TYPE',
            'UTR.LOGO.IMAGE',
            'UTR.LOGO.IMAGE_TEXT',
            'UTR.LOGO.TEXT',
            'UTR.LOGO.NONE',
            'UTR.LOGO.CUSTOM',
            'UTR.LOGO.CUSTOM.MESSAGE',
            'UTR.LOGO.UPLOAD_LABEL',
            'UTR.PENDING_LOGO_CHANGES',
            'UTR.PENDING_THEME_CHANGES'
            /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
        ];

    $.universalThemeRoller = $.universalThemeRoller || function(){
        var utrArguments = arguments;
        var firstArgumentType = typeof utrArguments[0];

        function _init(userOptions){
            userOptions = typeof userOptions === "undefined" ? {} : userOptions;

            options = $.extend(true, {}, defaultOptions, userOptions);

        }
        function _open(){
            utr.invoke.apply(this, Array.prototype.slice.call(utrArguments, 1, 4));
        }
        function _close(){
            utr.close();
        }

        function _importStylesheet(url, importAsLessStylesheet){
            if(typeof importAsLessStylesheet === "undefined"){
                importAsLessStylesheet = false;
            }

            $(document.createElement("link")).attr({
                rel:"stylesheet" + (importAsLessStylesheet ? "/less" : ""),
                type:"text/css",
                href:url
            }).appendTo("head");
        }

        function _importStylesheetSet(urls, callback, callback2){
            var results = [];
            if (urls && urls.length > 0) {
                for (var i = urls.length - 1; i >= 0; i--) {
                    results[i] = undefined;
                    if (stylesheetCache[urls[i]]) {
                        results[i] = stylesheetCache[urls[i]];

                        var done = true;
                        for (var j = results.length - 1; j >= 0; j--) {
                            if (results[j] === undefined) {
                                done = false;
                                break;
                            }
                        }

                        if (!done) {
                            continue;
                        } else {
                            callback && callback(results.join('\n'));
                        }

                    } else {
                        $.get(urls[i], $.proxy(function(data){
                            results[this.i] = stylesheetCache[urls[this.i]] = data;
                            for (var j = results.length - 1; j >= 0; j--) {
                                if (results[j] === undefined) return;
                            }
                            callback && callback(results.join('\n'));

                        }, {i:i}))
                        .fail(function(){
                            callback2 && callback2({ status: 404 });
                        });
                    }
                }
            } else {
                callback && callback(null);
            }
        }

        function getScripts(scripts, callback){
            if(scripts.length == 0){
                requiredFilesImported = true;
                callback();
                return;
            }
            var head = scripts[0];
            var tail = scripts.slice(1, scripts.length);
            $.getScript(head, function(){
                getScripts(tail, callback);
            });
        }

        function _importRequiredFiles(callback){
            if ( !requiredFilesImported ) {
                var paths = options.filePaths;

                var cssFiles = [
                    paths.utrStylesheet,
                    paths.colorPickerStylesheet
                ];
                for(var i = 0; i < cssFiles.length; i++){
                    _importStylesheet(cssFiles[i]);
                }

                less = {
                    env: "production",
                    logLevel: 0,
                    omitComments: true
                };

                lang.loadMessagesIfNeeded(msgKeys, function(){
                    $.getScript( paths.jQueryUiComponentsScript, function () {
                        server.loadScript({
                            "path": paths.lessCompilerScript,
                            "requirejs": true,
                            "global": "less"
                        }, function () {
                            
                            server.loadScript({
                                "path": paths.codeEditor
                            }, function () {
                                var scripts = [
                                    paths.apexTabsWidgetScript,
                                    paths.utrScript,
                                    paths.colorPickerScript
                                ];
                                getScripts(scripts, callback);
                            });
                        });
                    });
                });
            } else {
                callback();
            }
        }
//chunck image encode it 64 bits, put it in array.
        function chunk(content) {
            var r = [];
            while (content.length > 4000) {
                r.push(content.substr(0, 4000));
                content = content.substr(4000);
            }
            r.push(content);
            return r;
        }

        function _getThemeStyles(callback, callback2){
            if (!options.config.standalone) {

                server.process("theme_roller", {
                    p_flow_id:      4000,
                    p_flow_step_id: 0,
                    p_instance:     options.config.builderSessionId,
                    p_debug:        "NO",
                    x01:            "get_styles",
                    x02:            $v("pFlowId"),
                    x03:            options.config.themeId
                }, {
                    success: function(pData) {
                        callback && callback(pData);
                    },
                    error: function(pData) {
                        callback2 && callback2(pData);
                    }
                });
            } else {
                callback([{
                    "id":"static",
                    "name":"Static",
                    "isCurrent":true,
                    "isReadOnly":false,
                    "cssFileUrls":[],
                    "inputFileUrls":options.config.lessFiles,
                    "outputFileUrls":[]
                },{
                    "id":"static2",
                    "name":"Static 2",
                    "isCurrent":false,
                    "isReadOnly":false,
                    "cssFileUrls":[],
                    "inputFileUrls":options.config.lessFiles2,
                    "outputFileUrls":[]
                }]);
            }
        }

        function _createThemeStyle(baseStyleId, styleName, config, styleCSS, callback, callback2) {
            if (!options.config.standalone) {
                server.process("theme_roller", {
                    p_flow_id:      4000,
                    p_flow_step_id: 0,
                    p_instance:     options.config.builderSessionId,
                    p_debug:        "NO",
                    x01:            "create_style",
                    x02:            $v("pFlowId"),
                    x03:            options.config.themeId,
                    x04:            baseStyleId,
                    x05:            styleName,
                    x06:            JSON.stringify(config),
                    f01:            chunk(styleCSS)
                }, {
                    success: function(pData) {
                        callback && callback(pData);
                    },
                    error: function(pData) {
                        callback2 && callback2(pData);
                    }
                });
            } else {
                callback && callback({});
            }
        }

        function _updateThemeStyle(styleId, styleName, config, styleCSS, callback, callback2) {
            if (!options.config.standalone) {
                server.process("theme_roller", {
                    p_flow_id:      4000,
                    p_flow_step_id: 0,
                    p_instance:     options.config.builderSessionId,
                    p_debug:        "NO",
                    x01:            "update_style",
                    x02:            $v("pFlowId"),
                    x03:            options.config.themeId,
                    x04:            styleId,
                    x05:            styleName,
                    x06:            JSON.stringify(config),
                    f01:            chunk(styleCSS)
                }, {
                    success: function(pData) {
                        callback && callback(pData);
                    },
                    error: function(pData) {
                        callback2 && callback2(pData);
                    }
                });
            } else {
                callback && callback({});
            }
        }

        function _setAsCurrentTheme(styleId, callback, callback2) {
            if (!options.config.standalone) {
                server.process( "theme_roller", {
                    p_flow_id:      4000,
                    p_flow_step_id: 0,
                    p_instance:     options.config.builderSessionId,
                    x01:            "set_current_style",
                    x02:            $v( "pFlowId" ),
                    x03:            options.config.themeId,
                    x04:            styleId
                }, {
                    success: function (pData ) {
                        callback && callback( pData );
                    },
                    error: function( pData ) {
                        callback2 && callback2( pData );
                    }
                });
            } else {
                callback && callback({});
            }
        }

        function _getLogo(callback, callback2) {
            if (!options.config.standalone) {
                server.process( "theme_roller", {
                    p_flow_id:      4000,
                    p_flow_step_id: 0,
                    p_instance:     options.config.builderSessionId,
                    x01:            "get_logo",
                    x02:            $v( "pFlowId" )
                }, { 
                    success: function ( pData ) {
                        callback && callback( pData );
                    },
                    error: function ( pData ) {
                        callback2 && callback2( pData );
                    }
                });
            } else {
                callback && callback({});
            }
        }

        function _setLogo(logoType, logoImageUrl, logoText, customHTML, imageFilename, imageFile, newImage, callback, callback2) {
            if (!options.config.standalone) {
                var callParameters = {
                    p_flow_id:      4000,
                    p_flow_step_id: 0,
                    p_instance:     options.config.builderSessionId,
                    x01:            "set_logo",
                    x02:            $v( "pFlowId" ),
                    x04:            logoType,
                    x09:            newImage
                };

                switch ( logoType ) {
                    case 'T':
                        callParameters.x06 = logoText;
                    break;
                    case 'I':
                    case 'IT':
                        if ( imageFilename && imageFile ) {
                            callParameters.x08 = imageFilename;
                            callParameters.f01 = chunk ( imageFile );
                        } else {
                            callParameters.x05 = logoImageUrl;
                        }

                        if ( logoType = 'IT' ) {
                            callParameters.x06 = logoText;
                        }
                    break;
                    case 'C':
                        callParameters.x07 = customHTML;
                }
                server.process( "theme_roller", 
                    callParameters, { 
                    success: function ( pData ) {
                        callback && callback( pData );
                    },
                    error: function ( pData ) {
                        callback2 && callback2( pData );
                    }
                });
            } else {
                callback && callback({});
            }
        }

        if(firstArgumentType === "object" || firstArgumentType === "undefined") {
            _init(utrArguments[0]);
        } else if(firstArgumentType === "string") {
            switch(utrArguments[0]){
                case "open":
                    if (!utr.busy) {
                        if (!utr.opened) {
                            var lSpinner$ = apex.util.showSpinner();
                            var load = function() {
                                _open();
                                setTimeout(function() {
                                    lSpinner$.remove();
                                }, 1500);
                            };
                            _importRequiredFiles(load);

                        } else {
                            //TODO UTR is already opened. New settings were not applyed. Close the dialog and open it with the new settings
                        }
                    }
                    break;
                case "close":
                    if (!utr.busy) {
                        if (utr.opened) {
                            _close();
                        } else {
                            //TODO UTR is already closed.
                        }
                    }
                    break;
                case "getStylesheets":
                    _importStylesheetSet(utrArguments[1], utrArguments[2], utrArguments[3]);
                    break;
                case "getThemeStyles":
                    _getThemeStyles(utrArguments[1], utrArguments[2], utrArguments[3], utrArguments[4], utrArguments[5], utrArguments[6]);
                    break;
                case "createThemeStyle":
                    _createThemeStyle(utrArguments[1], utrArguments[2], utrArguments[3], utrArguments[4], utrArguments[5], utrArguments[6]);
                    break;
                case "updateThemeStyle":
                    _updateThemeStyle(utrArguments[1], utrArguments[2], utrArguments[3], utrArguments[4], utrArguments[5], utrArguments[6]);
                    break;
                case "setThemeStyleAsCurrent":
                    _setAsCurrentTheme(utrArguments[1], utrArguments[2], utrArguments[3]);
                    break;
                case "getLogo":
                    _getLogo(utrArguments[1], utrArguments[2]);
                    break;
                case "setLogo":
                    _setLogo(utrArguments[1], utrArguments[2], utrArguments[3], utrArguments[4], utrArguments[5], utrArguments[6], utrArguments[7], utrArguments[8], utrArguments[9]);
                    break;
            }
        } else {
            //TODO invalid number or type of arguments passed
        }
    };
})(apex.jQuery, apex.server, apex.utr, apex.lang);
