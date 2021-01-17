/*!
 Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
*/
/*!
 * Markdown Editor - APEX widget for markdown editors, based on CodeMirror and
 * its gfm.js mode.
 * @fileOverview
 *
 * General To Do
 * Expose it as a JQueryUI widget.
 *
 * Open Questions
 *
 * Documentation
 * Note: A Markdown Editor is not a JQuery UI widget yet.
 *
 * - The markdown editor exposes the follow function used
 * parse and render the text content of elements in the DOM:
 *
 *  apex.widget.markdown.render( <jquery selector> {string} );
 *
 * will replace the content of the elemenents selected by
 * <selector> and parse its text using marked.js api.
 *
 * - It is posible to customize the markdown editor instances
 * in the page designer using the JavaScript initialization code
 * and passing a 'function(options){}' expression where
 *
 * options: {
 *  toolbar: {
 *      data:{
 *          controls {array}:[
 *              {
 *                  type {string},
 *                  label {string},
 *                  action {string}: name of the action.
 *              }
 *              ...
 *          ]
 *      }
 *  }
 * }

 * See: widget.toolbar.js for more details.
 *
 * Inside the Initialization JavaScript expression, 'this' object is bound to
 * the actual instance of the markdown editor. It is also posible to modify
 * the text before it is previewed using the below function:
 *
 * MarkdownEditor.onBeforePreviewText: function(text){
 *  return text;
 * }
 *
 * Example:
 *
 * Initialization JavaScript (Page Designer):
 * ------------------------------------------------------------------------
 * function(options){
 *  var markdownInstance = this;
 *
 *  // overrides the default onBeforePreviewText behaviour.
 *
 *  markdownInstance.onBeforePreviewText = function(text){
 *
 *      // removes all the '*' chars from the current text in the editor
 *      // bofore sending it to the preview function.
 *      //
 *      // this won't change the current value of the editor.
 *      // it will only change the value sent to the preview function.
 *      return text.replace('*', '');
 *  }
 * }
 * ------------------------------------------------------------------------
 *
 * Assumptions
 *
 * Depends:
 * codemirror.js
 * marked.js
 * gfm.js
 */
// Namespace: This will contain general functions for the markdown plugins
( function ( $, CM, widget, actions, item, lang ) {

    /**
     * Internal name space for the markdown editor.
     */
    var md = {};

    /**
     * Library version
     */
    md.version = "1.0.0";
    /**
     * The class name that will be assigned to the elements that were already
     * rendered so we don't re-render them again
     */
    md.C_RENDERED_CLASS = 'is-markdownified';
    /**
     * The name of the event that will be triggered once elements have been
     * rendered
     */
    md.C_EVENT_NAME = 'markdownified';

    md.C_BASIC_HTML_ESCAPE_MODE = 'B';

    md.C_EXTENDED_HTML_ESCAPE_MODE = 'E';

    // taken from actions.js
    var isMac = navigator.appVersion.indexOf( "Mac" ) >= 0;

    /**
     * The default white-listed HTML tags
     */
    md.C_HTML_TAGS_WHITELIST = [
        'b',
        'strong',
        'i',
        'em',
        'p',
        'span',
        'hr',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6'
    ];

    /**
     * The default HTML escape mode
     */
    md.htmlEscapeMode = md.C_EXTENDED_HTML_ESCAPE_MODE;

    /**
     * Check for scrollbars.
     */
    $.fn.hasScrollBar = function () {
        return this[0] ? this[0].scrollHeight > this.innerHeight() : false;
    };

    /**
     * Wraps the code editor with alias for specific implementation methods.
     * @param {*} editor
     */
    function getEditorUtils( editor ) {
        return {
            getPreviewLabel: function () {
                return editor.toolbar$.find( '[data-action="preview"] label' );
            },
            getPreviewInput: function () {
                return editor.toolbar$.find( '[data-action="preview"] input' );
            },
            getActionContext: function () {
                return editor.options.toolbar.actionsContext;
            },
            setOption: function ( name, value ) {
                this.getCodeMirror().setOption( name, value );
            },
            getValue: function () {
                return editor.codeMirrorContainer.codeMirrorDocument.getValue();
            },
            getWrapperElement: function () {
                return editor.codeMirrorContainer.codeMirror
                    .getWrapperElement();
            },
            getCodeMirror: function () {
                return editor.codeMirrorContainer.codeMirror;
            },
            toggleAction: function ( actionName ) {
                this.getActionContext().toggle( actionName );
            }
        };
    }

    /**
     * Wrapper around markdown item.
     * Adds useful alias for the specific implementation details of the
     * markdown item.
     * @param {*} markdownItem
     */
    function getMarkdownUtils( markdownItem ) {
        var editorUtils = getEditorUtils( markdownItem.editor );
        return {
            getCodeEditorInstance: function () {
                return markdownItem.getCodeEditorInstance();
            },
            refresh: function () {
                this.getCodeEditorInstance().refresh();
            },
            lineInfo: function ( i ) {
                return markdownItem.getCodeEditorInstance().lineInfo( i );
            },
            setSize: function ( width, height ) {
                return markdownItem.getCodeEditorInstance().setSize( width, height );
            },
            adjustHeight: function () {
                markdownItem.editor.codeMirrorContainer.adjustHeight();
            },
            getCodeMirror: function () {
                return editorUtils.getCodeMirror();
            }
        };
    }

    /**
     * Wraps the utilities method into a single object/namespace.
     */
    var utilities = {
        getEditorUtils: getEditorUtils,
        getMarkdownUtils: getMarkdownUtils
    };

    function focusNextElement( reverse ) {
        //add all elements we want to include in our selection
        var focussableElements = 'a:not([disabled]), button:not([disabled]), ' +
            'input[type=text]:not([disabled]), ' +
            '[tabindex]:not([disabled]):not([tabindex="-1"])';
        if ( document.activeElement && document.activeElement.form ) {
            var focussable = Array.prototype.filter
                    .call( document.activeElement.form
                        .querySelectorAll( focussableElements ),
                    function ( element ) {

                        /**
                         * check for visibility while always include the current
                         * activeElement
                         */
                        return element.offsetWidth > 0 ||
                            element.offsetHeight > 0 ||
                            element === document.activeElement;
                    }),
                index = focussable.indexOf( document.activeElement );
            if ( index > -1 ) {
                var nextElement = focussable[index + ( reverse ? -1 : 1 )] ||
                    focussable[0];
                nextElement.focus();
            }
        }
    }

    marked.setOptions({
        gfm: true,
        sanitize: false,
        silent: false
    });

    // public export into apex.widget namespace.
    widget.markdown = function ( pTextArea, pDesignerOptions ) {
        pDesignerOptions = $.extend(
            true,
            {
                initJavascriptCode: function() {},
                readOnly: true
            },
            pDesignerOptions );
        var lTextArea$ = $( pTextArea ),
            markdownItem = new MarkdownItem( lTextArea$, pDesignerOptions ),
            lItemId = lTextArea$.attr( "id" );
        item.create( lItemId, markdownItem.itemize() );
        return markdownItem;
    };

    /**
     * For each selected element this function parses its content
     * as markdown code and then replaces the html with the
     * generated html code.
     */
    widget.markdown.render = function ( selector ) {
        var elements = $( selector );
        renderAllElements( elements );
    };

    function initOptions( designerOptions ) {
        var whitelistValue = [];
        if ( designerOptions.whitelist === 'BASIC' ) {
            whitelistValue = ['b', 'i', 'u', 'em', 'strong', 'p', 'br'];
        } else if ( designerOptions.whitelist === 'IMAGE' ) {
            whitelistValue = ['img'];
        }
        var options = {
            preview: {
                parsing: {
                    escapeInputHtml: designerOptions.escapeInputHtml !== 'NONE',
                    htmlEscapeMode: md.C_EXTENDED_HTML_ESCAPE_MODE,
                    htmlTagsWhitelisting: {
                        enabled: designerOptions.escapeInputHtml === 'ALLOW_WHITELIST',
                        allowAttributes: true,
                        whitelist: whitelistValue
                    },
                    markedOptions: {
                        gfm: true,
                        breaks: true
                    }
                },
                rendering: {
                    highlightFencedCodeBlocks: false
                }
            },
            designerOptions: designerOptions
        };
        return options;
    }

    function parseAttribute( textArea$, attribute ) {
        var value = -1;
        try {
            value = parseInt( textArea$.attr( attribute ) );
        } catch ( e ) {
            console.log( e );
        }
        return value;
    }

    /**
     * Creates a new object item in complaince with apex.item interface.
     */
    function itemize( markdownItem, textArea$ ) {
        var item = {};
        item.refresh = function () {
            var markdownUtils = getMarkdownUtils( markdownItem );
            markdownUtils.refresh();
        };
        item.setStyleTo = function () {
            return markdownItem.editor.content$;
        };
        item.setFocusTo = function () {
            markdownItem.getCodeEditorInstance().focus();
            /**
             * "this" refears to the backed dom element
             * defined in apex.item; wrap it to complain with
             * jquery.focus() function.
             */
            return $( this );
        };
        item.getValue = function () {
            return textArea$.val();
        };
        item.setValue = function ( pValue ) {
            /**
             * Programmatic api validations:
             * maxlength validation
             */
            var maxLength = parseAttribute( textArea$, 'maxlength' );
            if ( maxLength >= 0 && pValue.length > maxLength ) {
                return;
            }
            markdownItem.setCodeEditorDocumentValue( pValue );
            if ( markdownItem.getPreviewMode() ) {
                setPreviewMode( true, markdownItem.editor, markdownItem.onBeforePreviewText );
            }
        };
        return item;
    }

    function addValidations( markdownItem, textArea$ ) {
        var cm = markdownItem.getCodeEditorInstance(),
            validations = [];

        /**
         * Validates maxlength.
         * Note that new lines count as one char, then if 123 and 456 are two
         * lines, total count is = 7 (because of the new line):
         *
         * ---
         * 123
         * 456
         * ---
         *
         * char count: 7
         *
         */
        validations.push({
            validate: function ( cm, change ) {
                var maxLength = parseAttribute( textArea$, 'maxlength' );
                if ( maxLength >= 0 && change.update ) {
                    var str = change.text.join( "\n" ),
                        delta = str.length - ( cm.indexFromPos( change.to ) - cm.indexFromPos( change.from ) );
                    if ( delta <= 0 ) {
                        return true;
                    }
                    delta = cm.getValue().length + delta - maxLength;
                    if ( delta > 0 ) {
                        str = str.substr( 0, str.length - delta );
                        change.update( change.from, change.to, str.split( "\n" ) );
                    }
                }
                return true;
            }
        });

        cm.on( 'beforeChange', function ( cm, change ) {
            for ( var i = 0; i < validations.length; i++ ) {
                var v = validations[i];
                v.validate( cm, change );
            }
        });
    }

    /**
     * Public representation of the Markdown Editor.
     * @param {*} textArea$
     * @param {*} designerOptions
     */
    function MarkdownItem( textArea$, designerOptions ) {

        // default white list value to empty array
        var options = initOptions( designerOptions ),
            self = this;

        // public export api.
        self.onBeforePreviewText = function ( textValue ) {
            return textValue;
        };

        var mdEditorOptions = $.extend(
            {
                readOnly: {
                    enabled: false
                },
                textarea: {
                    useCodeEditor: true
                },
                designerOptions: designerOptions,
                markDownEditor: self
            },
            options
        );

        self.editor = new md.Editor(
            textArea$,
            mdEditorOptions
        );

        /**
         * Gets the internal code editor instance.
         */
        self.getCodeEditorInstance = function () {
            return self.editor.codeMirrorContainer.codeMirror;
        };

        self.getPreviewMode = function () {
            return self.editor.showingPreview;
        };

        self.setPreviewMode = function ( value ) {
            getPreviewFunction( self.editor, self.onBeforePreviewText )( value );
        };

        self.getCodeEditorDocument = function () {
            return self.editor.codeMirrorContainer.codeMirrorDocument;
        };

        self.setCodeEditorDocumentValue = function ( pValue ) {
            self.getCodeEditorDocument().setValue( pValue );
        };

        self.getCodeEditorDocumentValue = function () {
            return self.getCodeEditorDocument().getValue();
        };

        addValidations( self, textArea$ );

        /**
         * Itemize function. The result of this function will be passed
         * as second argument
         * in: apex.item(id, self.itemize());
         */
        self.itemize = function () {
            return itemize( self, textArea$ );
        };

        if ( designerOptions.readOnly ) {
            getPreviewFunction( self.editor, self.onBeforePreviewText )( true );
        }
    }

    /**
     * The default Markdown parser options
     */
    md.parserOptions = {
        escapeInputHtml: true,
        htmlEscapeMode: md.htmlEscapeMode,
        htmlTagsWhitelisting: {
            enabled: false,
            allowAttributes: false,
            whitelist: md.C_HTML_TAGS_WHITELIST
        },
        markedOptions: {
            gfm: true,
            breaks: true,
            // sanitizer: sanitize,
            sanitize: true
        }
    };

    /**
     * Add target='_blank' attribute to links.
     */
    var renderer = new marked.Renderer(),
        linkRenderer = renderer.link;
    renderer.link = function( href, title, text ) {
        var html = linkRenderer.call( renderer, href, title, text );

        // empty space at the en of params are important, do not remove them.
        return html.replace( /^<a /, '<a target="_blank" ' );
    };

    /**
     * Allow target attributes in dompurify.
     */
    DOMPurify.setConfig({
        ADD_ATTR: ['target']
    });

    /**
     * Convert the passed markdown string to HTML
     *
     * @param   {string}  pMarkdown       The markdown string to be transformed
     * @param   {string}  pParserOptions  The options to use for this parsing
     *                                    function and the options to be passed
     *                                    to the marked library
     * @return  {string}  The transformed HTML
     */
    md.parse = function ( pMarkdown, safeForJquery ) {
        safeForJquery = typeof safeForJquery === 'undefined'
            ? true
            : !!safeForJquery;
        var htmlResultText = marked( pMarkdown, {
            renderer: renderer
        });
        return DOMPurify.sanitize( htmlResultText, {
            SAFE_FOR_JQUERY: true
        });
    };

    /**
     * Transform the  of the elements/selectors/etc passed into markdown
     *
     * @param  jQuery|string  pElements         The elements/selectors whose
     *                                          HTML will be replaced by the
     *                                          parsed HTML based on their
     *                                          text or innerHTML (default)
     *                                          depending on the rendering
     *                                          options passed
     * @param  Object         pParserOptions    The options to be passed to
     *                                          the markdown parser
     * @param  Object         pSourceOptions    The options to be passed to
     *                                          to render the element's
     *                                          markdown
     * @param  boolean        pSourceOptions.parseText  Whether to parse the
     *                                                  HTML element's text
     *                                                  (true) or the
     *                                                  element's innerHTML
     *                                                  (false) (default).
     *                                                  This is useful to be
     *                                                  able to parse an
     *                                                  already escaped HTML
     *                                                  as if it was pure
     *                                                  HTML so that when it
     *                                                  loads it doesn't
     *                                                  execute scripts
     *                                                  automatically and
     *                                                  the user can
     *                                                  afterwards decide
     *                                                  whether or not to
     *                                                  escape them
     * @param  Object         pRendererOptions
     * @param  Object         pRendererOptions.highlightFencedCodeBlocks
     */
    md.render = function ( pElements ) {
        var lElements$ = $( pElements )
            .filter( ':not([data-markdown]), [data-markdown="true"]' )
            .filter( ':not( .' + md.C_RENDERED_CLASS + ' )' );
        renderAllElements( lElements$ );
    };

    function renderAllElements( lElements$ ) {
        // var pParserOptions, pSourceOptions, pRendererOptions;

        lElements$.each( function () {
            var lElement$ = $( this );
            lElement$.html(
                // Obtain the full text or html that the element contains and
                // transform it into HTML using the markdown parser
                md.parse(
                    lElement$.text()
                )
                // Finally, add the class to indicate the element was converted
                // into markdown already
            ).addClass( md.C_RENDERED_CLASS );

            // Trigger an event once the element has been rendered
            $( document ).trigger( md.C_EVENT_NAME, lElement$.get( 0 ) );
        });
    }

    /**
     * The Textarea Class. Given a textarea, the class adds extra functionality
     * on top of it acting as a wrapper. Original textarea is exposed as
     * this.textarea$
     *
     * @class
     * @param  {string|DOMElement|jQuery}  pTextarea               The textarea to be bound
     * @param  {boolean}                   pOptions.useCodeEditor  Wether or not to use a code editor instead of a simple textarea
     * @todo  Handle the textarea undo/redo history
     */
    md.CodeMirrorContainer = function ( pTextarea ) {
        this.textarea$ = $( pTextarea ).filter( 'textarea' ).eq( 0 );
        // This will be an interval object from setInterval but will only be
        // populated when this.codeMirror is not null
        this.textareaPollingInterval = null;
        this.codeMirror = null;
        this.codeMirrorDocument = null;
        if ( this.textarea$.length > 0 ) {
            var isRtl = $( 'html' ).attr( 'dir' ) == 'rtl';
            this.codeMirror = CM.fromTextArea( this.textarea$.get( 0 ), {
                tokenTypeOverrides: {
                    emoji: "emoji"
                },
                direction: isRtl ? 'rtl' : 'ltr'
            });
            this.codeMirrorDocument = this.codeMirror.getDoc();
            this.codeMirror.setOption( 'mode', 'text/x-gfm' );
            this.codeMirror.setOption( 'lineWrapping', true );
            this.codeMirror.on( 'change', function ( pInstance, pChangeObj ) {
                pInstance.save();
            });

        } else {
            throw 'ERROR: markdownify.Textarea: No textarea element was found in ' +
            'the passed argument. A textarea selector, element or jQuery object must be passed';
        }
    };
    md.CodeMirrorContainer.maximumHeight = 320;
    /**
     * Adjust the height of the textarea to its contents given that the current
     * textarea height is lesser than the passed maximum height, or the default
     * maximum height by default
     *
     * @param  {number}  pMaximumHeight  The maximum textarea height
     */
    md.CodeMirrorContainer.prototype.adjustHeight = function ( pMaximumHeight ) {
        if ( pMaximumHeight === undefined ) {
            // Take the default value
            pMaximumHeight = md.CodeMirrorContainer.maximumHeight;
        }

        if ( this.codeMirror !== null ) {
            var lCodeMirrorElementHeight = this.codeMirror
                    .getWrapperElement()
                    .offsetHeight,
                lCodeMirrorScrollHeight = this.codeMirror.getScrollInfo()
                    .height;

            if ( lCodeMirrorScrollHeight > lCodeMirrorElementHeight &&
                lCodeMirrorElementHeight < pMaximumHeight ) {

                // Plus 1 line at a time
                var height = lCodeMirrorElementHeight +
                    this.codeMirror.defaultTextHeight();
                this.codeMirror.setSize( null, height );
            }
        }
    };
    /**
     * Returns an object with properties representing the textarea selection
     * properties. The purpose of this function is to return an object that is
     * re-usable by other functions
     *
     * @return  {Object}  An object containing the selectionStart, selectionEnd
     *                    textareaValue and selectedText properties among
     *                    others
     */
    md.CodeMirrorContainer.prototype.getSelectionProperties = function () {
        var lResult,
            // This variable is to be able to swap the selection start and end
            // depending on their position
            lCursorAux = null,
            lCodeMirrorSelection;

        // Make multiple selections to merge in only one selection
        this.codeMirror.execCommand( 'singleSelection' );
        // There's always a selection available as selections can be of
        // length 0, use the first selection only
        lCodeMirrorSelection = this.codeMirrorDocument.listSelections()[0];
        lResult = {
            selectionStart: lCodeMirrorSelection.anchor,
            selectionEnd: lCodeMirrorSelection.head,
            textareaValue: this.codeMirrorDocument.getValue(),
            textBeforeSelection: '',
            textAfterSelection: '',
            selectedText: this.codeMirrorDocument.getSelections()[0],
            selectionLength: 0,
            numberOfSelectedLines: 0,
            selectionStartsInZero: false
        };
        lResult.selectionStartsInZero = lResult.selectionStart.line == 0 &&
            lResult.selectionStart.ch == 0;
        if ( lResult.selectionStart.ch > lResult.selectionEnd.ch ) {
            lCursorAux = lResult.selectionStart;
            lResult.selectionStart = lResult.selectionEnd;
            lResult.selectionEnd = lCursorAux;
        }
        lResult.textBeforeSelection = this.codeMirrorDocument.getRange(
            {
                line: 0,
                ch: 0
            },
            lResult.selectionStart );
        lResult.textAfterSelection = this.codeMirrorDocument.getRange(
            lResult.selectionEnd,
            {
                line: this.codeMirrorDocument.lastLine(),
                ch: this.codeMirrorDocument.getLine( this.codeMirrorDocument.lastLine() ).length
            });
        lResult.selectionLength = lResult.selectedText.length;
        lResult.numberOfSelectedLines = lResult.selectedText.split( '\n' ).length;
        return lResult;
    };
    /**
     * The selection from the object's textarea is wrapped by the prefix and
     * suffix passed as a parameter
     *
     * @param  {string}  pPrefix  The prefix to prepend the selection with
     * @param  {string}  pSuffix  The suffix to append to the selection
     */
    md.CodeMirrorContainer.prototype.wrapSelection = function ( pPrefix, pSuffix ) {
        var lSelectionProperties = this.getSelectionProperties(),
            lNewSelection;
        // Once we know what the selection is, where it starts and everything..
        this.codeMirrorDocument.replaceSelection(
            ( pPrefix || '' ) +
            lSelectionProperties.selectedText +
            ( pSuffix || '' ),
            'end'
        );
        lNewSelection = this.codeMirrorDocument.listSelections()[0];
        // Note this has still the values of the selection before being replaced
        if ( lSelectionProperties.selectionLength == 0 ) {
            // Move the selection from the end of the replacement as many
            // characters as the suffix has to put the cursor in the middle
            this.codeMirrorDocument.setSelection(
                {
                    line: lNewSelection.anchor.line,
                    ch: lNewSelection.anchor.ch - ( pSuffix ? pSuffix.length : 0 )
                },
                {
                    line: lNewSelection.anchor.line,
                    ch: lNewSelection.anchor.ch - ( pSuffix ? pSuffix.length : 0 )
                }
            );
        }

        /**
         * seems that after the replace or setSelection method,
         * codeMirror becomes unresponsive so we have to wait
         * before calling its focus() method.
         */
        var self = this;
        setTimeout( function () {
            self.codeMirror.focus();
        }, 1 );
    };
    /**
     * Prefix the line corresponding to the selection on the object's textarea
     * with the given prefix
     *
     * @param  string  pPrefix  The text that will be prefixed to the text area
     *                          selection
     * @todo  Identify which line I'm in
     */
    md.CodeMirrorContainer.prototype.prefixLines = function ( pPrefix ) {
        var lSelectionProperties = this.getSelectionProperties(),
            self = this;
        // If the length of the selection is more than 0...
        if ( lSelectionProperties.selectionLength > 0 ) {
            // Join the selected text again with new lines, but this time
            // also prepend the prefix to each of the lines
            lSelectionProperties.selectedText = lSelectionProperties.selectedText.split( '\n' ).join( '\n' + pPrefix );
        }

        this.codeMirrorDocument.replaceSelection(
            ( pPrefix || '' ) + lSelectionProperties.selectedText,
            'end'
        );

        // fix "unresponsive" issue with focus() method.
        setTimeout( function () {
            self.codeMirror.focus();
        }, 1 );
    };

    /**
     * The Editor Class. Given a toolbar and a textarea, link
     *
     * @class
     * @param  {string|DOMElement|jQuery}  pTextarea  The selector, element or
     *                                                jQuery object
     *                                                representing the textarea
     *                                                to which the toolbar
     *                                                will be attached
     * @param  {Object}  pOptions.textarea            The options with will be
     *                                                passed to the textarea
     *                                                building function
     * @param  {Object}  pOptions.preview             The options that will be
     *                                                passed to the parser to
     *                                                parse the preview result
     * @param  {Object}  pOptions.toolbar             The options with will be
     *                                                passed to the toolbar
     *                                                building function
     */
    md.Editor = function ( pTextarea, mdOptions ) {
        var self = this,
            markdownEditor = mdOptions.markDownEditor;
        self.getPreviewEmptyMessage = function () {
            var message = mdOptions.designerOptions.previewEmptyMessage;
            if ( message.length > 1 ) {
                message = message.substring( 1 );
                message = message.substring( 0, message.length - 1 );
            }
            return message;
        };
        var readOnlyMode = mdOptions.designerOptions.readOnly;
        self.getReadOnlyMode = function () {
            return readOnlyMode;
        };

        self.options = $.extend(
            true,
            {
                // By default let the textarea take their defaults
                textarea: {},
                preview: {
                    parsing: md.parserOptions
                },
                // The default options for the toolbar
                toolbar: getToolbarDataDefinition( self, mdOptions )
            },
            mdOptions
        );
        mdOptions.designerOptions.initJavascriptCode.call( markdownEditor, self.options );

        // Keep track of the preview panel
        self.showingPreview = false;

        // Create the editor element
        self.editor$ = $( '<div></div>' )
            .addClass( 'a-MDEditor apex-item-markdown-editor' );

        // Create the toolbar object
        self.toolbar$ = $( '<div></div>' )
            .addClass( 'a-MDEditor-toolbar' );
        self.options.toolbar.actionsContext = actions.createContext( "apex.markdown.Editor.toolbar", self.toolbar$.get( 0 ) );
        self.options.toolbar.actionsContext.add( self.options.toolbar.actions );

        // Create the preview panel div
        self.previewPanel$ = $( '<div></div>' )
            // Make the panel markdownifiable (md-Markdown) and hidden by
            // default
            .addClass( 'a-MDEditor-previewPanel a-MDEditor-previewPanel--hide' );
        var editorUtils = utilities.getEditorUtils( self );
        function previewKeydown( event ) {
            if ( ( event.ctrlKey || event.metaKey ) && event.which === 80 ) {
                editorUtils.toggleAction( 'preview' );
                editorUtils.getCodeMirror().focus();
                event.preventDefault();
                event.stopPropagation();
            }
        }

        /**
         * preview keyboard shortcut.
         */
        self.previewPanel$.keydown( previewKeydown );

        // This element will wrap the editor contents after the toolbar
        self.content$ = $( '<div></div>' )
            .addClass( 'a-MDEditor-content' );
        self.editorContainer$ = self.content$;

        // We need to reassign the content because once it wraps the textarea
        // the reference is lost
        self.content$ = $( pTextarea )
            .filter( 'textarea' )
            .addClass( 'a-MDEditor-textarea' )
            // We need to wrap the textarea with the editor element before
            // transforming the textarea into a CodeMirror element so that the
            // CodeMirror element gets positioned inside of it
            .wrap( self.content$ )
            .parent()
            // Wrap the content with the editor
            // Position the toolbar before the content
            .wrap( self.editor$ )
            .before( self.toolbar$ )
            // Insert the preview panel as the first element of the content
            .prepend( self.previewPanel$ );

        // Set the textarea property to the markdown.Textarea wrapper class
        // for the passed textarea
        self.codeMirrorContainer = new md.CodeMirrorContainer( pTextarea, self.options.textarea );

        if ( self.getReadOnlyMode() === false ) {
            var shortcuts = getShortCutsConfig(),
                otherShortCuts = getToogleShortCutsConfig(),
                actionsContext = self.options.toolbar.actionsContext;
            for ( var i = 0; i < self.options.toolbar.actions.length; i++ ) {
                var action = self.options.toolbar.actions[i],
                    codeMirror = self.codeMirrorContainer.codeMirror,
                    shortcut = shortcuts[action.name];
                if ( shortcut ) {
                    addShortCut(
                        codeMirror,

                        // capture name in closure due to iteration.
                        ( function ( name ) {
                            return function () {
                                actionsContext.invoke( name );
                            };
                        })( action.name ), shortcut );
                }
                if ( action.name === 'preview' ) {
                    addShortCut( codeMirror, function () {
                        actionsContext.toggle( 'preview' );
                    }, otherShortCuts.preview );
                }
            }

            addShortCut( codeMirror, function () {
                focusNextElement();
            }, otherShortCuts.focusnext );
            addShortCut( codeMirror, function () {
                focusNextElement( true );
            }, otherShortCuts.focusprev );
            self.toolbar$.toolbar( self.options.toolbar );
            editorUtils.getPreviewInput().keydown( previewKeydown );
        }
        if ( self.codeMirrorContainer.codeMirror !== null ) {
            var size = {
                    width: undefined,
                    height: undefined
                },
                rows = parseAttribute( $( pTextarea ), 'rows' );
            if ( rows >= 0 ) {
                size.height = self.codeMirrorContainer.codeMirror.defaultTextHeight() * ( rows + 2 );
            }
            var cols = parseAttribute( $( pTextarea ), 'cols' );
            if ( cols >= 0 ) {
                var mdEditorDiv$ = $( pTextarea ).closest( '.a-MDEditor' ),
                    tmp = self.codeMirrorContainer.codeMirror.defaultTextHeight() * cols,
                    toolbarElements = mdEditorDiv$.find( '.a-Toolbar-groupContainer' ),
                    toolbarWidth = 12; // padding value for preview button
                toolbarElements.each( function() {
                    toolbarWidth += $( this ).outerWidth();
                });
                mdEditorDiv$.css( 'max-width', Math.max( tmp, toolbarWidth ) );
            }
            self.codeMirrorContainer.codeMirror.setSize( size.width, size.height );
            self.editor$.addClass( 'a-MDEditor--codeEditor' );
            self.codeMirrorContainer.textarea$
                .parents( '.u-Form-itemWrapper' )
                .css({
                    'flex-wrap': 'wrap',
                    position: 'relative'
                });
        }

        // utility functions

        function addShortCut( codeMirror, action, config ) {
            var keyMapping = config.shortCut1,
                pcKeyMapping = config.shortCut2;
            addSingleShortCut( codeMirror, action, keyMapping );
            if ( pcKeyMapping ) {
                addSingleShortCut( codeMirror, action, pcKeyMapping );
            }
        }

        function addSingleShortCut( codeMirror, action, keyMapping ) {
            var extraKeys = {};
            extraKeys[keyMapping] = function () {
                action();
            };
            codeMirror.addKeyMap( extraKeys );
        }
    };

    /**
     * Encapsulates setPreviewMode function in a clousure.
     * Useful when we build the toolbar buttons.
     * This function is also called in the editor's initialization for the
     * set read-only mode functionality.
     * @param {*} editor
     */
    function getPreviewFunction( editor, onBeforePreviewText ) {
        return function ( pValue ) {
            setPreviewMode( pValue, editor, onBeforePreviewText );
        };
    };

    /**
     * Sets the preview mode in the editor according to pValue.
     * @param {*} pValue
     * @param {*} editor
     */
    function setPreviewMode( pValue, editor, onBeforePreviewText ) {
        // var editor = markDownEditor.editor;
        var lTextareaValue,
            lTextareaHeight;

        editor.showingPreview = pValue;

        // If the preview is being shown...
        if ( editor.showingPreview ) {
            // Disable any other buttons in the toolbar except for the
            // preview one
            editor.toolbar$
                .find( '.a-Toolbar-item:not([data-action="preview"])' )
                .attr( 'disabled', 'disabled' );
        } else {
            // Enable the disabled buttons (Should this also apply to the
            // preview one?)
            editor.toolbar$
                .find( '.a-Toolbar-item:not([data-action="preview"])' )
                .removeAttr( 'disabled' );
        }

        var editorUtils = utilities.getEditorUtils( editor ),
            lTextareaValue = editorUtils.getValue(),
            editorWrapper$ = $( editorUtils.getWrapperElement() );
        lTextareaHeight = $( editorWrapper$ ).outerHeight();

        // Set up the preview panel

        var previewPanelHtml = '';

        /**
         * toggle code editor scrollbars when in preview mode.
         */
        if ( editor.showingPreview ) {
            editorUtils.setOption( "scrollbarStyle", "null" );
            var toParseValue = onBeforePreviewText( lTextareaValue );
            if ( toParseValue.length > 0 ) {
                previewPanelHtml = md.parse(
                    toParseValue,
                    editor.options.preview.parsing
                );
            } else {
                var previewEmptyMessage = '<p style="color: #959595">' +
                    editor.getPreviewEmptyMessage() + '</p>';
                previewPanelHtml = previewEmptyMessage;
            }

        } else {
            editorUtils.setOption( "scrollbarStyle", "native" );
        }
        editor.previewPanel$.html( previewPanelHtml )
            // Mimic the height of the textarea (Including padding and
            // border)
            .css( 'height', editor.showingPreview ? lTextareaHeight : '' )
            // Toggle the preview hide class depending on if we're showing
            // the preview panel or not
            .toggleClass( 'a-MDEditor-previewPanel--hide', !editor.showingPreview )
            // Tell the markdown parser that the content of this panel
            // has already been transformed to markdown based on the
            // preview being shown
            .toggleClass( md.C_RENDERED_CLASS, editor.showingPreview );
        if ( editor.showingPreview ) {
            if ( editor.previewPanel$.hasScrollBar() ) {
                editor.previewPanel$.focus();
            }
            editorUtils.setOption( "readOnly", true );
        } else {
            editorUtils.setOption( "readOnly", false );
        }
    }

    function getSelectedText( codeMirrorContainer ) {
        var selectionProps = codeMirrorContainer.getSelectionProperties();
        return selectionProps.selectedText;
    }

    function unwrapCodeMirrorContainer( codeMirrorContainer, prefix, suffix ) {
        suffix = suffix || prefix;
        var selectedText = getSelectedText( codeMirrorContainer ),
            unwraped = selectedText.substring( prefix.length, selectedText.length - ( suffix.length ) );
        codeMirrorContainer.codeMirrorDocument.replaceSelection( unwraped );
    }

    function isSelectionWrappedWith( codeMirrorContainer, prefix, suffix ) {
        suffix = suffix || prefix;
        var wraped = false,
            selectedText = getSelectedText( codeMirrorContainer );
        if ( selectedText.indexOf( prefix ) === 0 &&
            selectedText.lastIndexOf( suffix ) === selectedText.length - ( suffix.length ) ) {
            wraped = true;
        }
        return wraped;
    }

    function toggleWrap( codeMirrorContainer, prefix, suffix ) {
        suffix = suffix || prefix;
        var wrap = isSelectionWrappedWith( codeMirrorContainer, prefix, suffix );
        if ( wrap ) {
            unwrapCodeMirrorContainer( codeMirrorContainer, prefix, suffix );
        } else {
            codeMirrorContainer.wrapSelection( prefix, suffix );
        }
        codeMirrorContainer.adjustHeight();
    }

    function focusInput( event ){
        var target$ = $( event.target );
        setTimeout( function(){
            target$.find( 'input' ).first().focus();
        }, 1);
    }

    /**
     * Generates the list of actions (name, function) for the tool bar.
     * @param {*} editor
     */
    function generateToolbarActions( editor, markDownEditor ) {
        var actions = [
            {
                name: 'bold',
                action: function () {
                    toggleWrap( editor.codeMirrorContainer, "**" );
                }
            },
            {
                name: 'italics',
                action: function () {
                    toggleWrap( editor.codeMirrorContainer, "_" );
                }
            },
            {
                name: 'strikethrough',
                action: function () {
                    toggleWrap( editor.codeMirrorContainer, "~~" );
                }
            },
            {
                name: 'inlineCode',
                action: function () {
                    toggleWrap( editor.codeMirrorContainer, "```\n", "\n```" );
                }
            },
            {
                name: 'addHeader',
                action: function () {
                    editor.codeMirrorContainer.prefixLines( ( !editor.codeMirrorContainer.getSelectionProperties().selectionStartsInZero ? '\n' : '' ) + '# ' );
                    editor.codeMirrorContainer.adjustHeight();
                }
            },
            {
                name: 'unorderedList',
                action: function () {
                    editor.codeMirrorContainer.prefixLines( ( !editor.codeMirrorContainer.getSelectionProperties().selectionStartsInZero ? '\n' : '' ) + '- ' );
                    editor.codeMirrorContainer.adjustHeight();
                }
            },
            {
                name: 'orderedList',
                action: function () {
                    editor.codeMirrorContainer.prefixLines( ( !editor.codeMirrorContainer.getSelectionProperties().selectionStartsInZero ? '\n' : '' ) + '1. ', true );
                    editor.codeMirrorContainer.adjustHeight();
                }
            },
            {
                name: 'codeBlock',
                action: function () {

                    var lSelectionProperties = editor.codeMirrorContainer.getSelectionProperties();

                    editor.codeMirrorContainer.wrapSelection( ( !lSelectionProperties.selectionStartsInZero ? '\n\n' : '' ) + '```' + '\n', '\n```' );
                    editor.codeMirrorContainer.adjustHeight();
                }
            },
            {
                name: 'codeBlockHtml',
                action: function () {
                    var lSelectionProperties = editor.codeMirrorContainer.getSelectionProperties();

                    editor.codeMirrorContainer.wrapSelection( ( !lSelectionProperties.selectionStartsInZero ? '\n\n' : '' ) + '```' + 'html' + '\n', '\n```' );
                    editor.codeMirrorContainer.adjustHeight();
                }
            },
            {
                name: 'codeBlockCss',
                action: function () {
                    var lSelectionProperties = editor.codeMirrorContainer.getSelectionProperties();

                    editor.codeMirrorContainer.wrapSelection( ( !lSelectionProperties.selectionStartsInZero ? '\n\n' : '' ) + '```' + 'css' + '\n', '\n```' );
                    editor.codeMirrorContainer.adjustHeight();
                }
            },
            {
                name: 'codeBlockJs',
                action: function () {
                    var lSelectionProperties = editor.codeMirrorContainer.getSelectionProperties();

                    editor.codeMirrorContainer.wrapSelection( ( !lSelectionProperties.selectionStartsInZero ? '\n\n' : '' ) + '```' + 'js' + '\n', '\n```' );
                    editor.codeMirrorContainer.adjustHeight();
                }
            },
            {
                name: 'blockquote',
                action: function () {
                    editor.codeMirrorContainer.prefixLines( ( !editor.codeMirrorContainer.getSelectionProperties().selectionStartsInZero ? '\n' : '' ) + '> ' );
                    editor.codeMirrorContainer.adjustHeight();
                }
            },
            {
                name: 'link',
                action: function () {
                    var lSelectionProperties = editor.codeMirrorContainer.getSelectionProperties(),
                        lText = md.Editor.createTextInput({
                            id: 'MARKDOWNIFY_EDITOR_LINK_TEXT',
                            label: 'Text',
                            placeholder: 'Link Description'
                        }),
                        lLink = md.Editor.createTextInput({
                            id: 'MARKDOWNIFY_EDITOR_LINK_URL',
                            label: 'URL',
                            placeholder: 'http://...'
                        }),
                        lForm$ = $( '<form></form>' )
                            .append( lText.field )
                            .append( lLink.field );

                    if ( lSelectionProperties.selectedText.match( /^[a-z]+:\/\// ) ) {
                        editor.codeMirrorContainer.wrapSelection( '[](', ')' );
                    } else if ( lSelectionProperties.selectionLength > 0 ) {
                        editor.codeMirrorContainer.wrapSelection( '[', ']()' );
                    } else {

                        function insertLink() {
                            var text = lText.input.val().trim(),
                                link = lLink.input.val().trim();
                            editor.codeMirrorContainer.wrapSelection( '[' + text, '](' + link + ')' );
                            lDialog$
                                .dialog( 'close' )
                                .remove();
                        }

                        var lDialog$ = lForm$.dialog({
                            autoOpen: true,
                            height: 'auto',
                            width: 350,
                            modal: true,
                            title: lang.getMessage( 'APEX.MARKDOWN.INSERT_LINK' ),
                            buttons: {
                                Cancel: function () {
                                    lDialog$
                                        .dialog( 'close' )
                                        .remove();
                                },
                                OK: insertLink
                            },
                            focus: function( event, ui ){
                                focusInput( event );
                            },
                            close: function () {
                                lForm$.get( 0 ).reset();
                            },
                            create: function () {
                                $( this )
                                    .parents( '.ui-dialog' )
                                    .find( '.ui-button:contains(OK)' )
                                    .addClass( 'ui-button--hot' );
                            }
                        });

                        addOnKeyDownEvent( lDialog$, insertLink );

                        // custom class for better css manipulation.
                        lDialog$.parent().addClass( "ui-dialog--markdown" );
                    }
                }
            },
            {
                name: 'image',
                action: function () {
                    var lSelectionProperties = editor.codeMirrorContainer.getSelectionProperties(),
                        lImageText = md.Editor.createTextInput({
                            id: 'MARKDOWNIFY_EDITOR_IMAGE_TEXT',
                            label: 'Text',
                            placeholder: 'Image Description'
                        }),
                        lImageUrl = md.Editor.createTextInput({
                            id: 'MARKDOWNIFY_EDITOR_IMAGE_URL',
                            label: 'URL',
                            placeholder: 'http://...'
                        }),
                        lForm$ = $( '<form></form>' )
                            .append( lImageText.field )
                            .append( lImageUrl.field ),
                        lDialog$;

                    if ( lSelectionProperties.selectedText.match( /^[a-z]+:\/\// ) ) {
                        editor.codeMirrorContainer.wrapSelection( '![](', ')' );
                    } else if ( lSelectionProperties.selectionLength > 0 ) {
                        editor.codeMirrorContainer.wrapSelection( '![', ']()' );
                    } else {

                        function insertImage() {
                            // Commenting IMAGE SIZE FEATURE out for now
                            //var lImageSize = lImageSizingGroup.input.find( 'input:checked' ).val(),
                            var lImageSize = 'ORIGINAL',
                                lImg$ = $( '<img>' )
                                    .attr({
                                        src: lImageUrl.input.val(),
                                        alt: lImageText.input.val()
                                    }),
                                lPrefix,
                                lSuffix;

                            switch ( lImageSize ) {
                            case 'SMALL':
                                lImg$.css({
                                    width: '30%'
                                });
                                break;
                            case 'MEDIUM':
                                lImg$.css({
                                    width: '50%'
                                });
                                break;
                            case 'LARGE':
                                lImg$.css({
                                    width: '100%'
                                });
                                break;
                            case 'ORIGINAL':
                            default:
                                break;
                            }

                            if ( lImageSize === 'ORIGINAL' ) {
                                lPrefix = '![' + lImageText.input.val();
                                lSuffix = '](' + lImageUrl.input.val() + ')';
                            } else {
                                lPrefix = lImg$
                                    .get( 0 )
                                    .outerHTML + '\n';
                            }

                            editor.codeMirrorContainer.wrapSelection(
                                lPrefix,
                                lSuffix
                            );

                            lDialog$
                                .dialog( 'close' )
                                .remove();
                        }

                        lDialog$ = lForm$.dialog({
                            autoOpen: true,
                            height: 'auto',
                            width: 400,
                            modal: true,
                            // title: 'Insert Image',
                            title: lang.getMessage( 'APEX.MARKDOWN.INSERT_IMAGE' ),
                            buttons: {
                                Cancel: function () {
                                    lDialog$
                                        .dialog( 'close' )
                                        .remove();
                                },
                                OK: insertImage
                            },
                            close: function () {
                                lForm$.get( 0 ).reset();
                            },
                            focus: function( event, ui ){
                                focusInput( event );
                            },
                            create: function () {
                                $( this )
                                    .parents( '.ui-dialog' )
                                    .find( '.ui-button:contains(OK)' )
                                    .addClass( 'ui-button--hot' );
                            }
                        });

                        addOnKeyDownEvent( lDialog$, insertImage );

                        // custom class for better css manipulation.
                        lDialog$.parent().addClass( "ui-dialog--markdown" );
                    }
                }
            },
            {
                name: 'preview',
                get: function () {
                    return editor.showingPreview;
                },
                set: getPreviewFunction( editor, markDownEditor.onBeforePreviewText )
            }
        ];
        return actions;
    }

    function addOnKeyDownEvent( lDialog$, handler ) {
        lDialog$.on( 'keydown', function ( event ) {
            switch ( event.keyCode ) {
            case $.ui.keyCode.ENTER:
                handler();
                break;
            }
        });
    }

    function getToogleShortCutsConfig() {
        var shortcuts = {};
        shortcuts.preview = {
            shortCut1: "Cmd-P",
            shortCut2: "Ctrl-P"
        };

        //"Shift-Cmd-,", "Shift-Ctrl-,"
        //  }, "Shift-Cmd-.", "Shift-Ctrl-.");
        shortcuts.focusnext = {
            shortCut1: "Shift-Cmd-.",
            shortCut2: "Shift-Ctrl-."
        };
        shortcuts.focusprev = {
            shortCut1: "Shift-Cmd-,",
            shortCut2: "Shift-Ctrl-,"
        };
        return shortcuts;
    }

    function getShortCutsConfig() {
        var shortcuts = {};
        shortcuts.bold = {
            shortCut1: "Cmd-B",
            shortCut2: "Ctrl-B"
        };
        shortcuts.italics = {
            shortCut1: "Cmd-I",
            shortCut2: "Ctrl-I"
        };
        shortcuts.strikethrough = {
            shortCut1: "Shift-Cmd-X",
            shortCut2: "Shift-Ctrl-X"
        };
        return shortcuts;
    }

    function getShortCutConfigLabel( actionName, messageSufix ) {
        var configs = getShortCutsConfig(),
            config = configs[actionName],
            messageKey = "APEX.MARKDOWN." + ( messageSufix || actionName.toUpperCase() );
        return getShortCutLabel( messageKey, config );
    }

    function getShortCutLabel( messageKey, config ) {
        var shortcut1 = config.shortCut1,
            shortcut2 = config.shortCut2;
        return lang.getMessage( messageKey ) +
            " (" +
            ( isMac ? shortcut1 : shortcut2 ) +
            ")";
    }

    function buildButtonGroups( editor, options ) {
        var linkAndImageControls = [
                {
                    type: 'BUTTON',
                    // labelKey: ,
                    label: lang.getMessage( 'APEX.MARKDOWN.LINK' ),
                    iconOnly: true,
                    icon: 'icon-link',
                    action: 'link'
                },
                {
                    type: 'BUTTON',
                    labelKey: 'APEX.MARKDOWN.IMAGE',
                    iconOnly: true,
                    icon: 'icon-picture',
                    action: 'image'
                }
            ],

            // all options.
            buttonGroups = [

                // formating
                {
                // No padding between buttons
                    groupTogether: true,
                    controls: [
                    // Controls
                        {
                            type: 'BUTTON',
                            // labelKey: 'APEX.MARKDOWN.BOLD',
                            label: getShortCutConfigLabel( "bold" ),
                            iconOnly: true,
                            icon: 'icon-bold',
                            action: 'bold'
                        },
                        {
                            type: 'BUTTON',
                            //labelKey: 'APEX.MARKDOWN.ITALIC',
                            label: getShortCutConfigLabel( "italics", "ITALIC" ),
                            iconOnly: true,
                            icon: 'icon-italic',
                            action: 'italics'
                        },
                        {
                            type: 'BUTTON',
                            // labelKey: 'APEX.MARKDOWN.STRIKETHROUGH',
                            label: getShortCutConfigLabel( "strikethrough" ),
                            iconOnly: true,
                            icon: 'icon-strikethrough',
                            action: 'strikethrough'
                        },
                        {
                            type: 'BUTTON',
                            labelKey: 'APEX.MARKDOWN.INLINE_CODE',
                            iconOnly: true,
                            icon: 'icon-code',
                            action: 'inlineCode'
                        }
                    ]
                },

                // ordered and unordered list
                {
                    groupTogether: true,
                    controls: [
                        {
                            type: 'BUTTON',
                            labelKey: 'APEX.MARKDOWN.UNORDERED_LIST',
                            iconOnly: true,
                            icon: 'icon-list-ul',
                            action: 'unorderedList'
                        },
                        {
                            type: 'BUTTON',
                            labelKey: 'APEX.MARKDOWN.ORDERED_LIST',
                            iconOnly: true,
                            icon: 'icon-list-ol',
                            action: 'orderedList'
                        }
                    ]
                },
                {
                    groupTogether: true,
                    controls: [
                        {
                            type: 'BUTTON',
                            label: 'Blockquote',
                            iconOnly: true,
                            icon: 'icon-quote',
                            action: 'blockquote'
                        }
                    ]
                },
                // insert link and image
                {
                    groupTogether: true,
                    controls: linkAndImageControls
                }
            ];
        if ( !editor.getReadOnlyMode() ) {
            buttonGroups.push(
                // preview
                {
                    // Add padding to the buttons
                    groupTogether: false,
                    align: 'end',
                    controls: [
                        getPreviewControl()
                    ]
                });
        }
        var pdToolbarType = options.designerOptions.toolbar;
        if ( pdToolbarType == "SIMPLE" ||
            typeof pdToolbarType === 'undefined' ) {

            // do not support image button in simple mode
            linkAndImageControls.pop();
        }
        if ( pdToolbarType == 'NONE' ) {

            // only preview button in NONE mode.
            buttonGroups = [
            ];
            if ( !editor.getReadOnlyMode() ) {
                buttonGroups.push(
                    // preview
                    {
                        // Add padding to the buttons
                        groupTogether: false,
                        align: 'end',
                        controls: [
                            getPreviewControl()
                        ]
                    });
            }
        }

        function getPreviewControl() {
            return {
                type: 'TOGGLE',
                labelKey: 'APEX.MARKDOWN.PREVIEW',
                action: 'preview'
            };
        }
        return buttonGroups;
    }

    function getToolbarDataDefinition( editor, options ) {
        return {
            data: buildButtonGroups( editor, options ),
            actions: generateToolbarActions( editor, options.markDownEditor ),
            // Whether we should allow navigation in the toolbar via the arrow keys
            cursorKeyNavigation: false
        };
    }

    /**
     * Creates a text input
     *
     * @todo Document
     * @param  {Object}  pOptions  The options
     * @return An object containing the field, the label and the input as jQuery objects
     */
    md.Editor.createTextInput = function ( pOptions ) {
        var lInput$ = $( '<input />' )
                .addClass( 'text_field apex-item-text' )
                .attr({
                    type: 'text',
                    id: pOptions.id,
                    name: pOptions.id
                }),
            lItemWrapper$ = $( '<div></div>' )
                .addClass( 'u-Form-itemWrapper' )
                .append( lInput$ ),
            lInputContainer$ = $( '<div></div>' )
                .addClass( 'u-Form-inputContainer col col-null' )
                .append( lItemWrapper$ ),
            lLabel$ = $( '<label></label>' )
                .addClass( 'u-Form-label' )
                .attr( 'for', pOptions.id )
                .text( pOptions.label ),
            lLabelContainer$ = $( '<div></div>' )
                .addClass( 'u-Form-labelContainer col col-null' )
                .append( lLabel$ ),
            lFieldContainer$ = $( '<div></div>' )
                .addClass( 'u-Form-fieldContainer rel-col  lto46434665622631032_0 apex-item-wrapper apex-item-wrapper--text-field' )
                .append( lLabelContainer$ )
                .append( lInputContainer$ );

        if ( 'placeholder' in pOptions ) {
            lInputContainer$
                .attr( 'placeholder', pOptions.placeholder );
        }

        return {
            field: lFieldContainer$,
            label: lLabel$,
            input: lInput$
        };
    };

})( apex.jQuery, CodeMirror, apex.widget, apex.actions, apex.item, apex.lang );
