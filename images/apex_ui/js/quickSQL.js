/*global,apex*/
/**
 * apex.quickSql namespace stores all QuickSQL functions of Oracle Application Express.
 * @namespace
 * todo: documentation
 */
(function ( $ ) {
    "use strict";
    apex.quickSql = function( options ) {
        var opt = $.extend({
                markupItem:         'P1100_RAW_SQL',        // Real page item to be submitted for opt.editor_input
                inputEditor:        'quicksql_input',       // Input CodeEditor UI
                outputEditor:       'quicksql_output',      // Output CodeEditor UI
                data_nodeId:        'formatted_sql_output'  // The returned, formated node ID in AJAX
            }, options),
            outputEditor; // A Code Editor widget instance for output display.
        var getShorthand = function () {
                return $v( opt.markupItem ).trim();
        };
        var shorthandSQLCache = getShorthand();
        var hasChanged = function () {
            return shorthandSQLCache !== getShorthand();
        };
        this.getShorthandSQL = getShorthand;
        this.getOutputEditor = function(){
            return outputEditor;
        };
        this.getOptions = function () {
            return opt;
        };
        this.clearOutput = function () {
            $( '#' + opt.outputEditor ).codeEditor( 'setValue', '' );
            return this;
        };
        this.generate = function( forceGenerate, callback ) {
            var runCallback = function () {
                if ( callback ) {
                    callback();
                }
            };

            if ( typeof forceGenerate === 'undefined' ) {
                forceGenerate = false;
            }

            if ( !outputEditor || hasChanged() || forceGenerate ) {
                var outputId = '#' + opt.outputEditor;
                apex.server.process(
                    "format_sql", {
                        pageItems: [ opt.markupItem ]
                    }, {
                        dataType: "text",
                        loadingIndicator: outputId,
                        loadingIndicatorPosition: "centered",
                        success: function(pData) {
                            var pCode = $( pData ).find( '#' + opt.data_nodeId ).text();

                            if ( !outputEditor ) {
                                var outEditor$ = $( outputId ).empty(); //Need to manually clear it before creating the codeEditor

                                outputEditor = outEditor$.codeEditor({
                                    value: pCode,
                                    language: 'sql',
                                    theme: 'automatic',
                                    readOnly: true,
                                    toolbar: false,
                                    ruler: false,
                                    scrollBeyondLastLine: false,
                                    minimap: false
                                });
                                outEditor$.trigger( 'apexafterrefresh' );
                            } else {
                                $( outputId ).codeEditor( 'setValue', pCode );
                            }
                            runCallback();
                        }
                    });
                // Store the old code.
                shorthandSQLCache = getShorthand();
            } else {
                runCallback();
                return false;
            }
        };
        // Expose it so samples loading to the QuickSQL editor
        // using inputEditor$.codeEditor( 'setValue', {value} ) is possible.
        this.inputEditor$ = this.initInputEditor(opt.onInputEditorInitialized);
    };
    apex.quickSql.prototype = function(){
        var initInputEditor = function (onInitialized) {
            var self = this,
                opt = self.getOptions(),
                input$ = $('#' + opt.inputEditor);

            return input$.codeEditor({
                language: 'quicksql',
                theme: 'automatic',
                tabSize: 4,
                autofocus: true,
                toolbar: false,
                ruler: false,
                scrollBeyondLastLine: false,
                wordBasedSuggestions: false,
                quickSuggestions: true,
                minimap: false,
                onInitialized: function(editor){
                    editor.onKeyDown(function(keyboardEvent){
                        if(keyboardEvent.keyCode == monaco.KeyCode.Enter){
                            self.generate();
                            apex.message.hidePageSuccess();
                        }
                    });
                    editor.onDidChangeModelContent(function(){
                        $s(opt.markupItem, input$.codeEditor( "getValue" ) );
                    });

                    if(onInitialized){
                        onInitialized(editor);
                    }

                    // additional highlighting via javascript
                    $.apex.codeEditor.performExtraQuicksqlHighlight(editor);
                }
            });
        };
        var hasContent = function () {
            return this.getOutputEditor() ? true : false;
        };
        var download = function () {
            var self = this;
            var downloadCallback = function () {
                var dl = document.createElement("a"),
                    editor = self.getOutputEditor(),
                    textToWrite = editor ? editor.codeEditor( "getValue" ) : ' ',
                    textblob = new Blob([textToWrite], {
                        type: 'text/plain'
                    });
                dl.download = 'quicksql-script.sql';
                dl.innerHTML = "Download File";
                if ( window.webkitURL !== null ) {
                    dl.href = window.webkitURL.createObjectURL( textblob );
                } else {
                    dl.href = window.URL.createObjectURL( textblob );
                    dl.onclick = destroyClickedElement;
                    dl.style.display = "none";
                    document.body.appendChild( dl );
                }
                dl.click();
            };
            // Ensure it is generated first on UI, then download.
            this.generate( false, downloadCallback );
        };
        return {
            initInputEditor: initInputEditor,
            hasContent: hasContent,
            download: download
        }
    }();
})( apex.jQuery );
