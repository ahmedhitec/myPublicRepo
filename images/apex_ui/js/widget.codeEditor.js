/* global apex,monaco,jQuery,require */
/* jshint esversion: 6 */
/* jshint bitwise: false */

/*!
 * codeEditor - a jQuery UI based widget that wraps Monaco Code Editor
 * Copyright (c) 2013, 2020, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @fileOverview
 * Turns a HTML textarea into a code editor for css, javascript, html and pl/sql
 *   apex.jQuery( "#myEditor" ).codeEditor({...});
 */

(function ($, util, lang, locale, debug, actions, server) {
    "use strict";

    // global constants
    var C_ACTIVE = "is-active",
        C_CODE_EDITOR = "a-MonacoEditor",
        C_CONTENT_WRAPPER = "a-MonacoEditorContent",
        C_TOOLBAR = "a-MonacoEditor-toolbar",
        SEL_TOOLBAR = "." + C_TOOLBAR,
        C_NOTIFICATION = "a-MonacoEditor-notification",
        SEL_NOTIFICATION = "." + C_NOTIFICATION,
        C_NOTIFICATION_MSG = "a-MonacoEditor-message",
        SEL_NOTIFICATION_MSG = "." + C_NOTIFICATION_MSG,
        C_ACTUAL_EDITOR = "a-MonacoEditor-editor";

    var PREFERENCE_KEYS = ['theme', 'tabsInsertSpaces', 'indentSize', 'tabSize', 'ruler'],
        MONACO_THEMES = [
            { label: 'Automatic', value: 'automatic' },  //automatic is not a monaco theme per se
            { label: 'Light', value: 'vs' },
            { label: 'Dark', value: 'vs-dark' },
            { label: 'High Contrast Dark', value: 'hc-black' }
        ];

    // absolute paths are needed by the webworkers
    var absolutePath, SOURCE_PATH, APEX_JS_DTS_PATH, MLE_DTS_PATH, QUICKSQL_PATH;

    if (window.apex_img_dir.indexOf('/' == 0)) {
        absolutePath = document.location.protocol + '//' + document.location.host + window.apex_img_dir;
    } else {
        absolutePath = window.apex_img_dir;
    }

    SOURCE_PATH = absolutePath + 'libraries/monaco-editor/0.20.0/min';
    APEX_JS_DTS_PATH = absolutePath + 'libraries/monaco-editor/apex/apex-js-api.d.ts';
    MLE_DTS_PATH = absolutePath + 'libraries/monaco-editor/apex/mle-js-oracledb.d.ts';
    QUICKSQL_PATH = absolutePath + 'libraries/monaco-editor/apex/quicksql.js';

    // due to the asynchronous nature of this widget
    // some flags are needed to keep track of what has loaded/configured already and what not
    var G_FLAGS = {
        requireConfigured: false,
        themesConfigured: false
    };

    // keeping track of some disposable objects returned by monaco functions
    // in case we need to dispose (revert) them later
    var G_DISPOSABLES = {};

    function loadExtraDts(path, key) {
        fetch(path)
            .then(response => response.text())
            .then(text => {
                G_DISPOSABLES[key] = monaco.languages.typescript.javascriptDefaults.addExtraLib(text);
            })
            .catch(error => debug.error('Code Editor: could not fetch Typescript definition file from ' + path, error));
    }
    function loadJsApiDts() {
        if (!G_DISPOSABLES.apexDts) {
            G_DISPOSABLES.apexDts = loadExtraDts(APEX_JS_DTS_PATH, 'apexDts');
        }
    }
    function unloadJsApiDts() {
        if (G_DISPOSABLES.apexDts) {
            G_DISPOSABLES.apexDts.dispose();
            delete G_DISPOSABLES.apexDts;
        }
    }
    function loadMleDts() {
        if (!G_DISPOSABLES.mleDts) {
            G_DISPOSABLES.mleDts = loadExtraDts(MLE_DTS_PATH, 'mleDts');
        }
    }
    function unloadMleDts() {
        if (G_DISPOSABLES.mleDts) {
            G_DISPOSABLES.mleDts.dispose();
            delete G_DISPOSABLES.mleDts;
        }
    }

    // this function should be called when loading or updating the language to javascript or mle-javascript
    function configureJavascriptLanguage(language, options) {
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES6,
            allowJs: true,
            allowNonTsExtensions: true,
            // in mle mode, browser globals like window or console should be hidden
            noLib: language == 'mle-javascript'
        });

        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            diagnosticCodesToIgnore: options.allowNamelessFunctions ? [1003] : []
        });

        if (language == 'javascript') {
            unloadMleDts();
            loadJsApiDts();
        } else if (language == 'mle-javascript') {
            unloadJsApiDts();
            loadMleDts();
        }
    }

    // this is the central place to alter any default monaco theme colors
    function configureThemes() {
        G_FLAGS.themesConfigured = true;
        monaco.editor.defineTheme('apex-vs', {
            inherit: true,
            base: 'vs',
            rules: [
                // background color: fffffe
                // sql
                { token: 'string.sql', foreground: 'b26100' },          // 4.56  AA
                { token: 'keyword.sql', foreground: 'c74634' },         // 4.82  AA         
                { token: 'predefined.sql', foreground: '7e5e8a' },      // 5.44  AA 
                { token: 'operator.sql', foreground: '000000' },        // 20.99 AAA
                { token: 'atom.sql', foreground: '398459' },            // 4.54  AA
                { token: 'function.sql', foreground: '795E26' },        // 6.10  AA
                // quicksql
                { token: 'table.quicksql', foreground: '1E84BF', fontStyle: 'bold' },   // 4.11 AA Large
                { token: 'view.quicksql', foreground: '008855', fontStyle: 'bold' },    // 4.51 AA
                { token: 'list.quicksql', foreground: 'b26100' },                       // 4.56 AA               
                { token: 'keywords.quicksql', foreground: 'c74634' },                   // 4.82 AA
                { token: 'types.quicksql', foreground: '398459' },                      // 4.54 AA
            ]
        });
        monaco.editor.defineTheme('apex-vs-dark', {
            inherit: true,
            base: 'vs-dark',
            rules: [
                // background color: 1e1e1e
                // sql
                { token: 'string.sql', foreground: 'ecbb76' },          // 9.48  AAA
                { token: 'keyword.sql', foreground: 'f14840' },         // 4.56  AA
                { token: 'predefined.sql', foreground: 'a687b3' },      // 5.35  AA
                { token: 'operator.sql', foreground: 'D4D4D4' },        // 11.25 AAA
                { token: 'atom.sql', foreground: '259856' },            // 4.53  AA
                { token: 'function.sql', foreground: 'DCDCAA' },        // 11.80 AAA
                // quicksql
                { token: 'table.quicksql', foreground: '1E84BF', fontStyle: 'bold' },   // 4.06 AA   Large
                { token: 'view.quicksql', foreground: '259856', fontStyle: 'bold' },    // 4.53 AA
                { token: 'list.quicksql', foreground: 'ecbb76' },                       // 9.48 AAA
                { token: 'keywords.quicksql', foreground: 'f14840' },                   // 4.56 AA
                { token: 'types.quicksql', foreground: '259856' },                      // 4.53 AA
            ]
        });
        monaco.editor.defineTheme('apex-hc-black', {
            inherit: true,
            base: 'hc-black',
            rules: [
                // background color: 000000
                // sql
                { token: 'string.sql', foreground: 'ecbb76' },          // 11.94 AAA
                { token: 'keyword.sql', foreground: 'f14840' },         // 5.74  AA
                { token: 'predefined.sql', foreground: 'a687b3' },      // 6.74  AA
                { token: 'operator.sql', foreground: 'D4D4D4' },        // 14.17 AAA
                { token: 'atom.sql', foreground: '259856' },            // 5.70  AA
                { token: 'function.sql', foreground: 'DCDCAA' },        // 14.86 AAA
                // quicksql
                { token: 'table.quicksql', foreground: '1E84BF', fontStyle: 'bold' },   // 5.11  AA
                { token: 'view.quicksql', foreground: '259856', fontStyle: 'bold' },    // 5.73  AA
                { token: 'list.quicksql', foreground: 'ecbb76' },                       // 11.94 AAA
                { token: 'keywords.quicksql', foreground: 'f14840' },                   // 5.74  AA
                { token: 'types.quicksql', foreground: '259856' },                      // 5.73  AA
            ]
        });
    }

    // some configurations are needed before Monaco can be initialized
    // 1) requirejs must be loaded - either by APEX or the version that comes with Monaco
    // 2) via requirejs, the vs path, and the locale must be set up
    // 3) MonacoEnvironment must be populated to allow for cross-domain workers
    function configureRequire() {
        // https://github.com/microsoft/monaco-editor/blob/master/docs/integrate-amd-cross.md
        // Before loading vs/editor/editor.main, define a global MonacoEnvironment that overwrites
        // the default worker url location (used when creating WebWorkers). The problem here is that
        // HTML5 does not allow cross-domain web workers, so we need to proxy the instantiation of
        // a web worker through a same-domain script
        window.MonacoEnvironment = {
            getWorkerUrl: function (workerId, label) {
                return 'data:text/javascript;charset=utf-8,' + encodeURIComponent([
                    'self.MonacoEnvironment = {',
                    `    baseUrl: "${SOURCE_PATH}"`,
                    '};',
                    `importScripts("${SOURCE_PATH}/vs/base/worker/workerMain.js");`
                ].join('\n'));
            }
        };
        require.config({ paths: { 'vs': SOURCE_PATH + '/vs' } });

        // monaco supports en, de, es, fr, it, ja, ko, ru, zh-tw and zh-cn
        // if none is matched by the current locale, we default to english
        var browserLang = locale.getLanguage().toLowerCase();
        var monacoLang;
        // only ones for which we need to take into account the country
        if (['zh-tw', 'zh-cn'].indexOf(browserLang) > -1) {
            monacoLang = browserLang;
        } else {
            // slicing off a possible country portion
            browserLang = browserLang.split('-')[0];
            if (['de', 'es', 'fr', 'it', 'ja', 'ko', 'ru'].indexOf(browserLang) > -1) {
                monacoLang = browserLang;
            }
        }
        // if a special language was matched, we set it. otherwise english stays
        if (monacoLang) {
            require.config({
                'vs/nls': {
                    availableLanguages: {
                        '*': monacoLang
                    }
                }
            });
        }

        G_FLAGS.requireConfigured = true;
    }

    // if require is already loaded, we can go ahead and configure everything
    if (window.require) {
        configureRequire();
    }

    if (window.monaco) {
        configureThemes();
    }

    // if require is already loaded, it means the configurations are already present
    // if monaco is not loaded, we can already load it here, even before it's been invoked
    // this makes most sense in Page Designer
    if (window.monaco == undefined && typeof require === 'function') {
        require(['vs/editor/editor.main'], function () {
            if (!G_FLAGS.themesConfigured) {
                configureThemes();
            }
        });
    }

    // returns the apex version of vs, vs-dark or hc-black
    // if automatic, returns apex-vs in light mode or apex-vs-dark in dark-mode
    function getMonacoTheme(theme) {
        var automatic = 'apex-' + ($('body').is('[class*="apex-theme-dark"]') ? 'vs-dark' : 'vs');
        if (theme == 'automatic') {
            return automatic;
        } else if (['vs', 'vs-dark', 'hc-black'].indexOf(theme) > -1) {
            return 'apex-' + theme;
        } else {
            debug.info('Theme "' + theme + '" is not a valid Monaco. Using automatic instead.');
            return automatic;
        }
    }

    function renderIconButton(out, id, shortcut, icon, label, extraClasses, disabled) {
        var title = shortcut ? lang.formatMessage("CODE_EDITOR.SHORTCUT_TITLE", label, shortcut) : label;
        out.markup("<button")
            .attr("id", id)
            .attr("title", title)
            .attr("aria-label", title)
            .optionalBoolAttr("disabled", disabled)
            .attr("class", "a-Button a-Button--noLabel a-Button--withIcon" + (extraClasses ? " " + extraClasses : ""))
            .markup(" type='button'>")
            .markup("<span class='a-Icon ")
            .attr(icon)
            .markup("' aria-hidden='true'></span></button>");
    }

    function msg(key) {
        return lang.getMessage(key);
    }

    $.widget('apex.codeEditor', {
        version: '20.2',
        widgetEventPrefix: 'codeEditor',
        options: {
            language: 'javascript',
            value: '',
            readOnly: false,
            autofocus: false,
            ariaLabel: '',
            errors: [],
            warnings: [],
            /*
             * Editor specific suggestions
             * Can be an array of objects:
             *  [{
             *      label: 'P1_FIRST_NAME (First Name)', // required
             *      insertText: 'P1_FIRST_NAME',         // optional
             *      detail: 'Page Item',                 // optional
             *      documentation: 'some  text'          // optional
             *  }]
             * 
             * Or a callback function that will be invoked on widget load and on language change
             * It must return the same kind of array
             * function(language){
             *      if(language == 'sql'){ return [...];}
             *      else if(language == 'javascript'){ return [...];}
             *      else { return []; }
             * }
             */
            suggestions: null,
            // only used for javascript or mle-javascript 
            javascriptOptions: {
                /**
                 * If the contents of the editor are in the form of function(options){...},
                 * an error decoration will be shown with message "Identifier Expected".
                 * Set this flag to true to suppress this particular warning from showing
                 */
                allowNamelessFunctions: false
            },
            // monaco options: exposing them here as opposed to arbitrarily passing passing them forward
            // to keep a list of all options used
            minimap: true, // if false, never show. if true, only show when content >= 100 lines
            lineNumbers: true,
            wordWrap: false,
            scrollBeyondLastLine: true,
            wordBasedSuggestions: true,
            quickSuggestions: true,
            toolbar: true, // always available in page designer, but can be disabled for theme roller
            // settings which can be overridden by user preference 
            theme: 'automatic',
            tabsInsertSpaces: true,
            indentSize: '4',
            tabSize: '4',
            ruler: false,
            // callback functions
            onInitialized: null,  // optional. function that runs after the editor is initialized. function(editor){}
            codeComplete: null,   // optional. function( options, callback )
            validateCode: null,   // optional. function( code, callback ) callback: function( {errors:[],warnings:[]} )
            queryBuilder: null,   // optional. function( editor, code )
            // events/callbacks
            preferencesChanged: null    // function( event )
        },
        // holds monaco context keys which can be used as conditions in a number of places, eg. keyboard shortcuts
        _contextKeys: {},
        /*
         * Lifecycle methods
         */
        _create: function () {

            var self = this,
                o = this.options;

            this.element.addClass(C_CODE_EDITOR);
            this.baseId = this.element[0].id || 'aCE';

            function init() {
                var parentElement = self.element[0];
                var parentElement$ = $(parentElement);
                var contentWrapper$ = $(`<div class="${C_CONTENT_WRAPPER}"></div>`);
                var toolbar$ = $(`<div class="${C_TOOLBAR}"></div>`);
                var editor$ = $(`<div class="${C_ACTUAL_EDITOR}"></div>`);

                parentElement$.append(contentWrapper$);

                if (o.toolbar) {
                    contentWrapper$.append(toolbar$);
                    self._initNotificationBar();
                    self._context = self._createContext();
                    self._initToolbar(toolbar$);
                }

                contentWrapper$.append(editor$);

                if (['javascript', 'mle-javascript'].includes(o.language)) {
                    configureJavascriptLanguage(o.language, o.javascriptOptions);
                }

                var editor = monaco.editor.create(editor$[0], {
                    value: o.value,
                    language: o.language.replace('mle-', ''),
                    readOnly: o.readOnly,
                    detectIndentation: false,
                    insertSpaces: o.tabsInsertSpaces,
                    indentSize: o.indentSize,
                    tabSize: o.tabSize,
                    rulers: o.ruler ? [80] : [],
                    minimap: {
                        enabled: o.minimap && (o.value.split('\n').length >= 100)
                    },
                    lineNumbers: o.lineNumbers ? 'on' : 'off',
                    scrollBeyondLastLine: o.scrollBeyondLastLine,
                    lineNumbersMinChars: 4, //slightly narrower line number column
                    theme: getMonacoTheme(o.theme),
                    scrollbar: {
                        // allows page to scroll if bottom of editor was reached
                        alwaysConsumeMouseWheel: false
                    },
                    fixedOverflowWidgets: true,
                    ariaLabel: o.ariaLabel,
                    // when editing plaintext, enforce the following options
                    // otherwise respect the passed in options
                    wordWrap: o.language == 'plaintext' || o.language == 'html' ? true : (o.wordWrap ? 'on' : 'off'),
                    wordBasedSuggestions: o.language == 'plaintext' ? false : o.wordBasedSuggestions,
                    quickSuggestions: o.language == 'plaintext' ? false : o.quickSuggestions
                });

                self._editor = editor;

                if (o.toolbar) {
                    self._updateNotifications();
                    self._populateContext();
                }

                // ------ resizing logic ------------------
                window.addEventListener('resize', util.debounce(function () {
                    self._resize();
                }, 200));
                parentElement$.on('resize', function (pEvent) {
                    self._resize();
                    pEvent.stopPropagation();
                });
                // ----------------------------------------

                if (o.autofocus) {
                    self.focus();
                }

                // Use Monaco onDidChangeContent to simulate a keypress on text area, allowing DA 'Key press' to work
                editor.getModel().onDidChangeContent(function (event) {
                    self.element.children('textarea').trigger('keypress', event);
                });

                // Combine onDidFocusEditorWidget and onDidBlurEditorWidget to simulate change event
                var oldValue;
                editor.onDidFocusEditorWidget(function () {
                    oldValue = editor.getValue();
                });

                editor.onDidBlurEditorWidget(function () {
                    // Trigger blur on the textarea, so DA 'blur' will work
                    self.element.children('textarea').trigger('blur');
                    // Simulate 'change' event (on blur and value changed), so DA 'change' will work
                    if (oldValue !== editor.getValue()) {
                        self.element.children('textarea').trigger('change');
                    }
                });

                // hide/show minimap based on line count
                if (o.minimap) {
                    editor.getModel().onDidChangeContent(util.debounce(function () {
                        // because we debounce, we must ensure that the editor still exists
                        // it could happen that in the meantime the editor popup was closed and the editor disposed
                        if (editor && editor.getModel()) {
                            editor.updateOptions({
                                minimap: {
                                    enabled: editor.getModel().getLineCount() >= 100
                                }
                            });
                        }
                    }, 1000));
                }

                // editor specific suggestion provider based on o.suggestions and o.language
                self._configureCustomSuggestionProvider();

                if (o.onInitialized) {
                    o.onInitialized(editor);
                }
            }

            //sd. find a more efficient way to preload needed files
            function loadOtherFiles() {
                if (o.language == 'quicksql' && !monaco.languages.getEncodedLanguageId('quicksql')) {
                    server.loadScript({
                        path: QUICKSQL_PATH
                    }, function () {
                        init();
                    });
                } else {
                    init();
                }
            }

            function loadMonaco() {
                // if monaco is not yet on the page, we fetch it via require
                if (window.monaco === undefined) {
                    require(["vs/editor/editor.main"], function () {
                        if (!G_FLAGS.themesConfigured) {
                            configureThemes();
                        }
                        loadOtherFiles();
                    });
                } else {
                    loadOtherFiles();
                }
            }

            if (window.require === undefined) {
                // if require is not already on the page, we fetch the one included in Monaco
                server.loadScript({
                    path: SOURCE_PATH + '/vs/loader.js'
                }, function () {
                    if (!G_FLAGS.requireConfigured) {
                        configureRequire();
                    }
                    loadMonaco();
                });
            } else {
                loadMonaco();
            }

            this._on(this._eventHandlers);
        },

        _eventHandlers: {
            resize: function (event) {
                this._resize();
                event.stopPropagation();
            },
            focusin: function (event, data) {
                this.element.addClass(C_ACTIVE);
            },
            focusout: function (event, data) {
                this.element.removeClass(C_ACTIVE);
            }
        },

        _destroy: function () {
            if (this._editor) {
                this._disposeAllEditorSpecificDisposables();
                this._editor.dispose();
            }
        },

        _setOption: function (pKey, pValue) {
            var self = this,
                o = self.options,
                editor = self._editor;
            self._super(pKey, pValue);
            if (pKey === 'errors' || pKey === 'warnings') {
                self._updateNotifications();
            } else if (pKey == 'language') {
                self._setLanguage(pValue);
            } else if (pKey == 'tabsInsertSpaces') {
                editor.updateOptions({ insertSpaces: pValue });
            } else if (pKey == 'ruler') {
                editor.updateOptions({ rulers: pValue ? [80] : [] });
            } else if (pKey == 'theme') {
                if (o.theme != pValue) {
                    monaco.editor.setTheme(getMonacoTheme(pValue));
                }
            } else {
                editor.updateOptions({ pKey: pValue });
            }
        },

        setValue: function (pValue) {
            this._editor.setValue(pValue);
        },

        getValue: function () {
            if (this._editor) {
                return this._editor.getValue();
            } else {
                // the editor has not yet initialized. returning initial value
                return this.options.value;
            }
        },

        getEditor: function () {
            return this._editor;
        },

        getSelection: function () {
            return this._editor.getModel().getValueInRange(this._editor.getSelection());
        },

        /**
         * The caller is responsible for making sure that pMessage is escaped as needed.
         * @param pMessage may contain markup
         */
        showNotification: function (message) {
            var container$ = this.element.find(SEL_NOTIFICATION).show().children(SEL_NOTIFICATION_MSG).first();
            if (typeof message === 'string') {
                container$.html(message);
            } else if (typeof message === 'object' && message instanceof jQuery) {
                container$.empty();
                container$.append(message);
            } else {
                debug.error('The notification message must be a string or a jQuery object');
            }
            this._resize();
        },

        // removes the message content and hides the container
        resetNotification: function () {
            this.element.find(SEL_NOTIFICATION).children(SEL_NOTIFICATION_MSG).empty();
            this.element.find(SEL_NOTIFICATION).hide();
            this._resize();
        },

        // the message must be escaped externally
        showSuccessNotification: function (message) {
            this.showNotification(`<ul><li class="is-success">${message}</li></ul>`);
        },

        focus: function () {
            this.element.addClass(C_ACTIVE);
            this._editor.focus();
        },

        // note that lineNumber and column are 1-based indexes
        setCursor: function (lineNumber, column) {
            this._editor.setPosition({
                lineNumber: lineNumber,
                column: column
            });
        },

        setCursorToEnd: function (revealLine) {
            var editor = this._editor,
                model = editor.getModel(),
                lastLine = model.getLineCount(),
                lastColumn = model.getLineMaxColumn(lastLine);

            this.setCursor(lastLine, lastColumn);

            if (revealLine) {
                editor.revealLine(lastLine);
            }
        },

        changeGeneration: function () {
            return this._editor.getModel().getAlternativeVersionId();
        },

        isClean: function (pGeneration) {
            return this._editor.getModel().getAlternativeVersionId() == pGeneration;
        },

        getPreferencesString: function () {
            var o = this.options,
                obj = {};

            for (var i = 0; i < PREFERENCE_KEYS.length; i++) {
                var key = PREFERENCE_KEYS[i];
                obj[key] = o[key];
            }

            return JSON.stringify(obj);
        },

        /*
         * Private functions
         */

        /**
         * Implementing some types of features, for example custom suggestions
         * can be a little tricky as they are applied to an entire language, and not just the editor.
         * To deal with this, in these features' callbacks, we check if the current editor has focus.
         * However, we should still dispose of them when an editor is closed.
         * Here we keep track of all of these features and disposables.
         */
        _editorSpecificDisposables: {},

        _addEditorSpecificDisposable: function (key, disposable) {
            var disposables = this._editorSpecificDisposables;

            // if a disposable with the same key exists, it will first get disposed
            if (disposables[key]) {
                disposables[key].dispose();
            }
            disposables[key] = disposable;
        },

        _disposeAllEditorSpecificDisposables: function () {
            var disposables = this._editorSpecificDisposables,
                keys = Object.keys(disposables);

            for (var key of keys) {
                disposables[key].dispose();
                delete disposables[key];
            }
        },

        // to be called after widget initializtion and when the language changes
        _configureCustomSuggestionProvider: function () {
            var self = this,
                editor = self._editor,
                o = self.options,
                language = o.language.replace('mle-', ''),
                suggestions = o.suggestions,
                finalSuggestions,
                word;

            if (suggestions) {

                if (Array.isArray(suggestions)) {
                    finalSuggestions = suggestions;
                } else if (typeof suggestions === "function") {
                    finalSuggestions = suggestions(language);
                } else {
                    debug.error('Suggestions type not supported');
                    return;
                }

                finalSuggestions = finalSuggestions.map(suggestion => {
                    suggestion.insertText = suggestion.insertText || suggestion.label;
                    return suggestion;
                });

                self._addEditorSpecificDisposable('global-suggestions', monaco.languages.registerCompletionItemProvider(language, {
                    provideCompletionItems: function (model, position) {
                        // a completion item provider is unfortunately set to the entire language and is not editor specific
                        // to get around this, whenever this provider is invoked, we check if the editor has focus
                        // if not, it means another editor with this language has focus so we don't return any suggestions
                        if (editor.hasTextFocus()) {
                            word = model.getWordUntilPosition(position);
                            return {
                                suggestions: finalSuggestions.map(suggestion => {
                                    suggestion.range = {
                                        startLineNumber: position.lineNumber,
                                        endLineNumber: position.lineNumber,
                                        startColumn: word.startColumn,
                                        endColumn: word.endColumn
                                    };
                                    suggestion.kind = monaco.languages.CompletionItemKind.File;
                                    return suggestion;
                                })
                            };
                        } else {
                            return {};
                        }
                    }
                }));

                // if the language is mle-javascript, we also trigger the suggestions on the dot after apex.env
                if (o.language == 'mle-javascript') {
                    self._addEditorSpecificDisposable('mle-js-apex-env', monaco.languages.registerCompletionItemProvider('javascript', {
                        triggerCharacters: ['.'],
                        provideCompletionItems: function (model, position, context) {
                            if ( // only if this is the editor in question
                                editor.hasTextFocus() &&
                                // only if "." was pressed
                                context.triggerKind == monaco.languages.CompletionTriggerKind.TriggerCharacter &&
                                context.triggerCharacter == '.' &&
                                // only if the dot follows apex.env
                                model.getLineContent(position.lineNumber).substr(0, position.column - 2).endsWith('apex.env')
                            ) {
                                word = model.getWordUntilPosition(position);
                                return {
                                    suggestions: finalSuggestions.map(suggestion => {
                                        suggestion.range = {
                                            startLineNumber: position.lineNumber,
                                            endLineNumber: position.lineNumber,
                                            startColumn: word.startColumn,
                                            endColumn: word.endColumn
                                        };
                                        suggestion.kind = monaco.languages.CompletionItemKind.File;
                                        return suggestion;
                                    })
                                };
                            } else {
                                return {};
                            }
                        }
                    }));
                }
            }
        },

        _getLineFromMessage: function (message) {
            // An error message has the form "...ORA-06550: line xx, column yy: Error Message...""
            var index = message.indexOf('ORA-06550');
            if (index > -1) {
                var str = message.slice(index);
                var parsedError = str.match(/\d{1,}/g);
                var lineNumber = parseInt(parsedError[1], 10);
                var columnNumber = parseInt(parsedError[2], 10);
                if (isNaN(lineNumber)) {
                    lineNumber = 0;
                }
                if (isNaN(columnNumber)) {
                    columnNumber = 0;
                }

                return { lineNumber: lineNumber, columnNumber: columnNumber };
            } else {
                return null;
            }
        },

        // reveals line in center and sets the cursor at the given position
        // line and column must be 1-based
        _gotoPosition: function (line, column) {
            var self = this,
                editor = self._editor;

            if (editor) {
                editor.revealLineInCenter(line);
                editor.setPosition({
                    lineNumber: line,
                    column: column
                });
                setTimeout(function () {
                    editor.focus();
                }, 100);
            }
        },

        _updateNotifications: function () {
            var self = this,
                options = self.options,
                list$ = $('<ul/>');

            if (options.errors.length || options.warnings.length) {
                for (let i = 0; i < options.errors.length; i++) {
                    let message = util.escapeHTML(options.errors[i]),
                        lineObject = self._getLineFromMessage(message),
                        listItem$ = $('<li class="is-error" style="cursor: pointer;"></li>');

                    if (lineObject) {
                        listItem$.append($(`<a data-line="${lineObject.lineNumber}" data-column="${lineObject.columnNumber}"></a>`).html(message));
                    } else {
                        listItem$.html(message);
                    }

                    list$.append(listItem$);
                }
                for (let i = 0; i < options.warnings.length; i++) {
                    let message = util.escapeHTML(options.warnings[i]),
                        lineObject = self._getLineFromMessage(message),
                        listItem$ = $('<li class="is-warning" style="cursor: pointer;"></li>');

                    if (lineObject) {
                        listItem$.append($(`<a data-line="${lineObject.lineNumber}" data-column="${lineObject.columnNumber}"></a>`).html(message));
                    } else {
                        listItem$.html(message);
                    }

                    list$.append(listItem$);
                }

                self.showNotification(list$);
            } else {
                self.resetNotification();
            }

            $('a[data-line]', list$).on('click', function () {
                self._gotoPosition($(this).data('line'), $(this).data('column'));
            });

            self._updateLineMessages();
        },

        _updateLineMessages: function () {
            var self = this,
                options = self.options,
                editor = self._editor,
                lineMessages = [],
                lineMessage;

            // error have format:     ORA-20999: Failed to parse SQL query! <p>ORA-06550: line 6, column 5: ORA-00942: table or view does not exist</p>
            // warnings have format:  ORA-06550: line 1, column 78: PL/SQL: ORA-00942: table or view does not exist
            function cleanMessageForInline(options) {
                var newMessage = options.message.split(':').slice(options.afterColonIndex).join(':').trim();

                if (options.removeHtmlTags) {
                    newMessage = util.stripHTML(newMessage);
                }

                if (newMessage.length) {
                    return newMessage;
                } else {
                    return options.message;
                }
            }

            for (let i = 0; i < options.errors.length; i++) {
                lineMessage = self._getLineFromMessage(options.errors[i]);
                if (lineMessage) {
                    lineMessages.push({
                        startLineNumber: lineMessage.lineNumber,
                        endLineNumber: lineMessage.lineNumber,
                        startColumn: lineMessage.columnNumber,
                        endColumn: 1000,
                        message: cleanMessageForInline({
                            message: options.errors[i],
                            afterColonIndex: 4,
                            removeHtmlTags: true
                        }),
                        severity: monaco.MarkerSeverity.Error
                    });
                }
            }
            for (let i = 0; i < options.warnings.length; i++) {
                lineMessage = self._getLineFromMessage(options.warnings[i]);
                if (lineMessage) {
                    lineMessages.push({
                        startLineNumber: lineMessage.lineNumber,
                        endLineNumber: lineMessage.lineNumber,
                        startColumn: lineMessage.columnNumber,
                        endColumn: 1000,
                        message: cleanMessageForInline({
                            message: options.warnings[i],
                            afterColonIndex: 3,
                            removeHtmlTags: false
                        }),
                        severity: monaco.MarkerSeverity.Warning
                    });
                }
            }

            monaco.editor.setModelMarkers(editor.getModel(), 'lineMessages', lineMessages);

            if (lineMessages.length) {
                self._gotoPosition(lineMessages[0].startLineNumber, lineMessages[0].startColumn);
            }
        },

        _resize: function () {
            var editor = this._editor;
            if (editor) {
                editor.layout();
            }
        },

        _initNotificationBar: function () {
            var self = this,
                out = util.htmlBuilder(),
                closeId = this.baseId + "_mClose";

            out.markup("<div class='" + C_NOTIFICATION + "' style='display:none;'><div class='" + C_NOTIFICATION_MSG + "'></div>");
            renderIconButton(out, closeId, null, "ui-icon-closethick", msg("CODE_EDITOR.CLOSE"), "a-Button--small a-CodeEditor-searchBar-closeButton", false);
            out.markup("</div>");
            this.element.find(SEL_TOOLBAR).after(out.toString());
            $('#' + closeId).click(function () {
                $(this).parent().hide();
                self._resize();
            });
        },

        _queryBuilder: function () {
            var fn = this.options.queryBuilder;
            if (fn) {
                fn(this, this.getValue());
            }
        },

        _codeComplete: function () {

            // ajax-based code complete is only allowed for sql and mle-javascript, and only if a callback has been provided 
            if (!(this.options.codeComplete && ['sql', 'mle-javascript'].includes(this.options.language))) {
                return;
            }

            var self = this,
                language = self.options.language,
                editor = self._editor,
                model = editor.getModel(),
                currentPosition = editor.getPosition(),
                lineValue = model.getLineContent(currentPosition.lineNumber),
                word, parts, search, parent, grantParent,
                isItem = false,
                $spinner,
                elem = self.element[0];

            // the builtin model.getWordAtPosition and getWordAroundPosition functions
            // to not return values such as "x.y.z", only "z"
            // so we use our own function
            function getWordAround(s, pos) {
                // make pos point to a character of the word
                while (s[pos] == ' ') pos--;
                // find the space before that word
                // (add 1 to be at the begining of that word)
                // (note that it works even if there is no space before that word)
                pos = s.lastIndexOf(' ', pos) + 1;
                // find the end of the word
                var end = s.indexOf(' ', pos);
                if (end == -1) {
                    end = s.length; // set to length if it was the last word
                }
                // return the result
                return s.substring(pos, end);
            }

            word = getWordAround(lineValue, currentPosition.column - 1);
            parts = word.split('.');

            if (language === 'sql') {
                if (parts.length == 1 && [':', '&'].includes(word.charAt(0))) {
                    isItem = true;
                    search = word.slice(1);
                } else {
                    parent = parts[parts.length - 2];
                    grantParent = parts[parts.length - 3];
                }
            } else if (language === 'mle-javascript') {
                if (parts.length === 3 && parts[0] === 'apex' && parts[1] === 'env') {
                    isItem = true;
                    search = parts[2];
                    parent = undefined;
                    grantParent = undefined;
                } else {
                    editor.trigger('', 'editor.action.triggerSuggest', {});
                    return;
                }
            }

            // function invoked when the autocomplete items are returned
            // pData has to be in the format:
            //   [
            //     type:      "string", (template, application_item, page_item, package, procedure, function, constant, variable, type, table, view)
            //     title:     "string",
            //     className: "string",
            //     completions: [
            //       { d: "string", r: "string" } or "string"
            //     ]
            //   ]
            function _success(pData) {

                apex.util.delayLinger.finish('autocompleteSpinner', function () {
                    if ($spinner) {
                        $spinner.remove();
                        $spinner = null;
                    }
                });

                var kinds = monaco.languages.CompletionItemKind;

                // TODO: find more fitting icons
                var monacoTypes = {
                    template: kinds.File,
                    application_item: kinds.File,
                    page_item: kinds.File,
                    package: kinds.File,
                    procedure: kinds.Method,
                    function: kinds.Function,
                    constant: kinds.File,
                    variable: kinds.File,
                    type: kinds.File,
                    table: kinds.File,
                    view: kinds.File,
                    keyword: kinds.File,
                    sequence: kinds.File
                };

                var type,
                    completion,
                    completions = [];
                for (var i = 0; i < pData.length; i++) {
                    type = pData[i];

                    for (var j = 0; j < type.completions.length; j++) {
                        completion = type.completions[j];
                        var text = completion.r || completion;

                        completions.push({
                            label: (completion.d || completion),
                            insertText: text,
                            detail: type.title,
                            kind: monacoTypes[type.type]
                        });
                    }
                }

                // alreadyShown ensures temporary completions are only used by the completionItemProvider once: now.
                var alreadyShown = false;
                self._addEditorSpecificDisposable('ajax-suggestions', monaco.languages.registerCompletionItemProvider(model._languageIdentifier.language, {
                    provideCompletionItems: function () {
                        if (self.element.hasClass(C_ACTIVE) && !alreadyShown) {
                            alreadyShown = true;
                            return {
                                suggestions: completions
                            };
                        } else {
                            return {};
                        }
                    }
                }));

                // show the completion suggestions menu by force
                editor.trigger('', 'editor.action.triggerSuggest', {});
            } // _success


            util.delayLinger.start('autocompleteSpinner', function () {
                $spinner = util.showSpinner(elem);
            });

            self.options.codeComplete({
                type: isItem ? 'item' : '',
                search: isItem ? search : parts[parts.length - 1],
                parent: parent,
                grantParent: grantParent
            }, _success);
        },

        _validateCode: function () {
            if (!this.options.validateCode) {
                return;
            }

            var self = this;

            self.options.validateCode(self.getValue(), function (results) {
                results = $.extend({}, { errors: [], warnings: [] }, results);
                self._setOption('errors', results.errors);
                self._setOption('warnings', results.warnings);
                if (results.errors.length == 0 && results.warnings.length == 0) {
                    // indicate that all is well
                    self.showSuccessNotification(util.escapeHTML(lang.getMessage('CODE_EDITOR.VALIDATION_SUCCESS')));
                }
            });
        },

        _createContext: function () {
            var context = actions.createContext('codeEditor', this.element[0]);
            return context;
        },

        _populateContext: function () {
            var self = this,
                o = self.options,
                language = o.language,
                editor = self._editor,
                context = self._context;
            
            function isMac(){
                return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
            }

            // WinCtrl = Ctrl on Mac, WinKey on Windows
            // CtrlCmd = Cmd on Mac, Ctrl on Windows
            // this conditional will ensure Ctrl on both
            var universalCtrlKey = isMac() ? monaco.KeyMod.WinCtrl : monaco.KeyMod.CtrlCmd;

            function notifyPreferenceChange() {
                var element = self.element[0];
                self._trigger('preferencesChanged', $.Event('click', { target: element }));
            }

            function updateIndentation() {
                editor.getModel().updateOptions({
                    insertSpaces: o.tabsInsertSpaces,
                    tabSize: o.tabSize,
                    indentSize: o.indentSize
                });
            }

            // initialize monaco editor context keys, the names of which can be used as conditions in various places
            self._contextKeys.isSql = editor.createContextKey('isSql', language === 'sql');
            self._contextKeys.dbHint = editor.createContextKey('dbHint', ['sql', 'mle-javascript'].includes(language));

            context.add([{
                name: 'undo',
                action: function (event, focusElement) {
                    editor.trigger(null, 'undo');
                    self.focus();
                }
            }, {
                name: 'redo',
                action: function (event, focusElement) {
                    editor.trigger(null, 'redo');
                    self.focus();
                }
            }, {
                name: 'find',
                action: function (event, focusElement) {
                    // findReplace does not exist in readOnly mode, so we must invoke the regular find
                    editor.getAction(o.readOnly ? 'actions.find' : 'editor.action.startFindReplaceAction').run();
                }
            }, {
                name: 'theme',
                get: function () {
                    return o.theme;
                },
                set: function (v) {
                    o.theme = v;
                    monaco.editor.setTheme(getMonacoTheme(v));
                    notifyPreferenceChange();
                },
                choices: MONACO_THEMES
            }, {
                name: 'tabs-insert-spaces',
                labelKey: 'CODE_EDITOR.INDENT_WITH_TABS',
                get: function () {
                    return o.tabsInsertSpaces;
                },
                set: function (v) {
                    o.tabsInsertSpaces = v;
                    updateIndentation();
                    notifyPreferenceChange();
                }
            }, {
                name: 'tab-size',
                get: function () {
                    return o.tabSize;
                },
                set: function (v) {
                    o.tabSize = v;
                    updateIndentation();
                    notifyPreferenceChange();
                },
                choices: ['2', '3', '4', '8'].map(v => ({ label: v, value: v }))
            }, {
                name: 'indent-size',
                get: function () {
                    return o.indentSize;
                },
                set: function (v) {
                    o.indentSize = v;
                    updateIndentation();
                    notifyPreferenceChange();
                },
                choices: ['2', '3', '4', '8'].map(v => ({ label: v, value: v }))
            }, {
                name: 'show-ruler',
                labelKey: 'CODE_EDITOR.SHOW_RULER',
                get: function () {
                    return o.ruler;
                },
                set: function (v) {
                    editor.updateOptions({ rulers: v ? [80] : [] });
                    o.ruler = v;
                    notifyPreferenceChange();
                }
            }]);

            if (o.queryBuilder) {
                context.add({
                    name: 'query-builder',
                    hide: language != 'sql',    // initial hidden state
                    action: function (event, focusElement) {
                        self._queryBuilder();
                    }
                });
            }

            if (o.codeComplete) {
                context.add({
                    name: 'code-complete',
                    hide: !['sql', 'mle-javascript'].includes(language),    // initial hidden state
                    action: function (event, focusElement) {
                        self._codeComplete();
                    }
                });

                editor.addAction({
                    id: 'apex-code-complete',
                    label: msg('CODE_EDITOR.HINT'),
                    keybindings: [universalCtrlKey | monaco.KeyCode.Space],
                    precondition: 'dbHint',
                    run: function (editor) {
                        self._codeComplete();
                    }
                });
            }

            if (o.validateCode) {
                context.add({
                    name: 'validate',
                    hide: language != 'sql',    // initial hidden state
                    action: function (event, focusElement) {
                        self._validateCode();
                    }
                });
                editor.addAction({
                    id: 'apex-code-validate',
                    label: msg('CODE_EDITOR.VALIDATE'),
                    keybindings: [universalCtrlKey | monaco.KeyMod.Alt | monaco.KeyCode.KEY_V],
                    precondition: 'isSql',
                    run: function (editor) {
                        self._validateCode();
                    }
                });
            }

            // logic for enabling or disabling the undo/redo buttons
            (function () {
                // save states for undo/redo button disabling logic 
                var initialVersion = editor.getModel().getAlternativeVersionId(),
                    currentVersion = initialVersion,
                    lastVersion = initialVersion;

                editor.onDidChangeModelContent(e => {
                    var versionId = editor.getModel().getAlternativeVersionId();
                    // undoing
                    if (versionId < currentVersion) {
                        context.enable('redo');
                        // no more undo possible
                        if (versionId === initialVersion) {
                            context.disable('undo');
                        }
                    } else {
                        // redoing
                        if (versionId <= lastVersion) {
                            // redoing the last change
                            if (versionId == lastVersion) {
                                context.disable('redo');
                            }
                        } else { // adding new change, disable redo when adding new changes
                            context.disable('redo');
                            if (currentVersion > lastVersion) {
                                lastVersion = currentVersion;
                            }
                        }
                        context.enable('undo');
                    }
                    currentVersion = versionId;
                });

                // on itinialization, disable both undo and redo
                context.disable('undo');
                context.disable('redo');
            })();
        },

        _initToolbar: function (container$) {
            var o = this.options,
                helper;

            var config = {
                actionsContext: this._context,
                simple: true,
                data: []
            };

            var undoControls = [];

            undoControls.push({
                type: 'BUTTON',
                titleKey: 'CODE_EDITOR.UNDO',
                labelKey: 'CODE_EDITOR.UNDO',
                iconOnly: true,
                icon: 'icon-undo',
                action: 'undo'
            });

            undoControls.push({
                type: 'BUTTON',
                titleKey: 'CODE_EDITOR.REDO',
                labelKey: 'CODE_EDITOR.REDO',
                iconOnly: true,
                icon: 'icon-redo',
                action: 'redo'
            });

            config.data.push({
                id: 'undoControls',
                align: 'start',
                groupTogether: true,
                controls: undoControls
            });

            var searchControls = [];
            searchControls.push({
                type: 'BUTTON',
                titleKey: 'CODE_EDITOR.FIND',
                labelKey: 'CODE_EDITOR.FIND',
                iconOnly: true,
                icon: 'icon-cm-find',
                action: 'find'
            });

            config.data.push({
                id: 'searchControls',
                align: 'start',
                groupTogether: true,
                controls: searchControls
            });

            if (o.queryBuilder || o.codeComplete || o.validateCode) {
                var helperGroup = {
                    id: 'helperControls',
                    align: 'start',
                    groupTogether: true,
                    controls: []
                };

                if (o.queryBuilder) {
                    helperGroup.controls.push({
                        type: 'BUTTON',
                        titleKey: 'CODE_EDITOR.QUERY_BUILDER',
                        labelKey: 'CODE_EDITOR.QUERY_BUILDER', // used by aria-label
                        iconOnly: true,
                        icon: 'icon-cm-query-builder',
                        action: 'query-builder'
                    });
                }

                if (o.codeComplete) {
                    helper = msg('CODE_EDITOR.HINT') + ' - Ctrl+Space';
                    helperGroup.controls.push({
                        type: 'BUTTON',
                        title: helper,
                        label: helper,  // used by aria-label
                        iconOnly: true,
                        icon: 'icon-cm-autocomplete',
                        action: 'code-complete'
                    });
                }

                if (o.validateCode) {
                    helper = msg('CODE_EDITOR.VALIDATE') + ' - Ctrl+Alt+V';
                    helperGroup.controls.push({
                        type: 'BUTTON',
                        title: helper,
                        label: helper, // used by aria-label
                        iconOnly: true,
                        icon: 'icon-cm-validate',
                        action: 'validate'
                    });
                }

                config.data.push(helperGroup);
            }

            config.data.push({
                id: 'menuControls',
                align: 'end',
                groupTogether: false,
                controls: [{
                    type: 'MENU',
                    titleKey: 'CODE_EDITOR.SETTINGS',
                    labelKey: 'CODE_EDITOR.SETTINGS',
                    iconOnly: true,
                    icon: 'icon-gear',
                    menu: {
                        items: [{
                            type: 'subMenu',
                            labelKey: 'CODE_EDITOR.INDENTATION',
                            menu: {
                                items: [{
                                    type: 'toggle',
                                    action: 'tabs-insert-spaces'
                                }, {
                                    type: 'subMenu',
                                    labelKey: 'CODE_EDITOR.TAB_SIZE',
                                    menu: {
                                        items: [{
                                            type: 'radioGroup',
                                            action: 'tab-size'
                                        }]
                                    }
                                }, {
                                    type: 'subMenu',
                                    labelKey: 'CODE_EDITOR.INDENT_SIZE',
                                    menu: {
                                        items: [{
                                            type: 'radioGroup',
                                            action: 'indent-size'
                                        }]
                                    }
                                }
                                ]
                            }
                        }, {
                            type: 'subMenu',
                            labelKey: 'CODE_EDITOR.THEMES',
                            menu: {
                                items: [{
                                    type: 'radioGroup',
                                    action: 'theme'
                                }]
                            }
                        }, {
                            type: 'toggle',
                            action: 'show-ruler'
                        }]
                    }
                }]
            });

            container$.toolbar(config);

        },

        _setLanguage: function (language) {
            var self = this,
                editor = self._editor,
                o = self.options,
                context = self._context;

            // remove any error messages
            monaco.editor.setModelMarkers(editor.getModel(), 'lineMessages', []);
            self.resetNotification();

            // reconfigure editor specific suggestions
            self._configureCustomSuggestionProvider();

            function hide(actionName) {
                if (context.lookup(actionName)) {
                    context.hide(actionName);
                }
            }
            function show(actionName) {
                if (context.lookup(actionName)) {
                    context.show(actionName);
                }
            }

            if (['sql', 'mle-javascript'].includes(language)) {
                show('code-complete');
                self._contextKeys.dbHint.set('dbHint', true);
            } else {
                hide('code-complete');
                self._contextKeys.dbHint.set('dbHint', false);
            }

            if (language == 'sql') {
                show('validate');
                show('query-builder');
            } else {
                hide('validate');
                hide('query-builder');
            }

            self._contextKeys.isSql.set(language === 'sql');

            if (['javascript', 'mle-javascript'].includes(language)) {
                configureJavascriptLanguage(language, o.javascriptOptions);
            }

            monaco.editor.setModelLanguage(editor.getModel(), language.replace('mle-', ''));
        }
    });

    $.apex.codeEditor.preferencesObjectFromString = function (optionsString) {
        var rawOptions,
            finalOptions = {};

        try {
            rawOptions = JSON.parse(optionsString);
        } catch (e) {
            debug.warn('Code Editor: could not parse optionsString');
            return {};
        }

        $.each(PREFERENCE_KEYS, function (i, item) {
            var value = rawOptions[item],
                key = item;

            if (key === 'theme') {
                if (MONACO_THEMES.map(theme => theme.value).indexOf(value) == -1) {
                    debug.warn('Code Editor: Bad theme ignored: ' + value);
                    return;
                }
            } else if (key === 'indentSize' || key === 'tabSize') {
                if (['2', '3', '4', '8'].indexOf(value) == -1) {
                    debug.warn('Code Editor: Bad number ignored: ' + value);
                    return;
                }
            } else if (key === 'tabsInsertSpaces' || key === 'ruler') {
                value = (value == true);
            } else {
                debug.warn('Code Editor: Unknown preference: ' + key);
                return;
            }

            finalOptions[key] = value;
        });

        return finalOptions;
    };

})(apex.jQuery, apex.util, apex.lang, apex.locale, apex.debug, apex.actions, apex.server);