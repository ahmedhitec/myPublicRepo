// Namespace: This will contain general functions for the markdown plugins
// If APEX exists then keep is as it is, if it doesn't then declare it as an empty object
window.apex = window.apex || {};
window.apex.markdown = window.apex.markdown || {};

(function( $, CM, md ){
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

    /**
     * A constant for the "Basic" HTML Escape Mode. In this mode, HTML escaping
     * will make the following replacements:
     * 
     * & to &amp;
     * " to &quot:
     * < to &lt;
     * > to &gt;
     */
    md.C_BASIC_HTML_ESCAPE_MODE = 'B';
    /**
     * A constant for the "Extended" HTML Escape Mode. In this mode, HTML
     * escaping will make the following replacements:
     * 
     * & to &amp;
     * " to &quot:
     * < to &lt;
     * > to &gt;
     * ' to &#x27;
     * / to &#x2F;
     */
    md.C_EXTENDED_HTML_ESCAPE_MODE = 'E';

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
            breaks: true
        }
    };

    /**
     * Escape the input HTML passed using the "Basic" escape mode
     *
     * @param   {string}  pHtml  The input HTML to be escaped
     * @return  {string}  The escaped HTML
     */
    md.escapeHtmlBasic = function( pHtml ){
        // Commented this block out because although the regular expression is
        // accurate, no browser other than Chrome implements the necessary
        // features it requires (https://stackoverflow.com/a/49784204)
        /*
        var lBlockQuoteGreaterThanRegExp = new RegExp(
                '(?<!<\\/?[a-zA-Z0-9]+[^>]*)(?:^[ \\t]*(?:> ?)+)',
                'gm'
            ),
            lReplacedBlockQuoteGreaterThans = [],
            lPlaceholdersRegExp = new RegExp( '@\\$([0-9]+)\\$@', 'gi' ),
        */
        // Made so that the greater than symbol stays out of capturing
        // group 1 and it can be replaced later on
        var lTagRegExp = new RegExp(
                '(<(?:(?:[a-zA-Z0-9]+(?:\\s*[^>]*)?)|(?:\\/[a-zA-Z0-9]+\\s*)))>',
                'gm'
            ),
            lResult = pHtml
                .replace( /&/g, '&amp;' )
                .replace( /"/g, '&quot;' )
                // Commented this block out because although the regular
                // expression is accurate, no browser other than Chrome
                // implements the necessary features it requires
                // (https://stackoverflow.com/a/49784204)
                /*
                // Replace the markdown blockquote-like patterns with
                // placeholders so we can replace them afterwards with the
                // original matches
                .replace(
                    lBlockQuoteGreaterThanRegExp,
                    function(
                        pFullMatch,
                        pIndex,
                        pOriginalInput
                    ){
                        // Using @$ and $@ as placeholders because those
                        // characters, and numbers will not get escaped in the
                        // final result
                        var lReplacement = '@$' + lReplacedBlockQuoteGreaterThans.length + '$@';
                        // Collect the original matches in an array so we are able
                        // to return them back to their original status afterwards
                        lReplacedBlockQuoteGreaterThans.push( pFullMatch );

                        return lReplacement;
                    }
                )
                // Now replace the lesser than and greater than symbols with
                // their HTML entities
                .replace( /</g, '&lt;' )
                .replace( />/g, '&gt;' )
                // Now replace the block quote placeholders with their original
                // strings
                .replace(
                    lPlaceholdersRegExp,
                        function(
                            pFullMatch,
                            pPlaceHolderIndex,
                            pIndex,
                            pOriginalInput
                        ){
                            return pPlaceHolderIndex !== undefined ?
                                    lReplacedBlockQuoteGreaterThans[ pPlaceHolderIndex ]
                                :
                                    pFullMatch;
                        }
                );
                */
                // Now replace the lesser than and greater than symbols with
                // their HTML entities
                // Replace the tag greater than symbols with the HTML entity by
                // replacing all the tag except for the greater than symbol
                // with itself, then append the greater than entity
                .replace( lTagRegExp, '$1&gt;' )
                // This needs to be done after so that the regular expression
                // above works
                .replace( /</g, '&lt;' );

        return lResult;
    };
    /**
     * Escape the input HTML passed using the "Extended" escape mode
     *
     * @param   {string}  pHtml  The input HTML to be escaped
     * @return  {string}  The escaped HTML
     */
    md.escapeHtmlExtended = function( pHtml ){
        var lResult = md.escapeHtmlBasic( pHtml )
            .replace( /\'/g, '&#x27;' )
            .replace( /\//g, '&#x2F;' );

        return lResult;
    };
    /**
     * Escape the input HTML passed using the passed escape mode
     *
     * @param   {string}  pHtml            The input HTML to be escaped
     * @param   {string}  pHtmlEscapeMode  The escape mode to use. Note that
     *                                     the value of this parameter is meant
     *                                     to be one of the
     *                                     C_BASIC_HTML_ESCAPE_MODE or
     *                                     C_EXTENDED_HTML_ESCAPE_MODE
     *                                     constants. By default, this
     *                                     parameter takes its value from the
     *                                     markdownify.htmlEscapeMode variable
     * @return  {string}  The escaped HTML
     */
    md.escapeHtml = function( pHtml, pHtmlEscapeMode ){
        if ( pHtmlEscapeMode === undefined ) {
            pHtmlEscapeMode = md.htmlEscapeMode;
        }

        var lResult;

        switch(pHtmlEscapeMode) {
            case md.C_BASIC_HTML_ESCAPE_MODE:
                lResult = md.escapeHtmlBasic( pHtml );
                break;
            case md.C_EXTENDED_HTML_ESCAPE_MODE:
                lResult = md.escapeHtmlExtended( pHtml );
                break;
            default:
                lResult = pHtml;
                console.error(
                    'ERROR: markdownify.escapeHtml: Escape mode "' +
                    pHtmlEscapeMode + '" is invalid, please use the ' +
                    'C_BASIC_HTML_ESCAPE_MODE and ' +
                    'C_EXTENDED_HTML_ESCAPE_MODE constants. Output was not ' +
                    'escaped'
                );
                break;
        }

        return lResult;
    };
    /**
     * Removes all the tags that are not present in the whitelist. Loosely
     * based on the APEX_ESCAPE.HTML_WHITELIST function in the Oracle APEX APIs
     * and the HTML Specification from W3C
     *
     * @param  {string}   pHtml                       The html
     * @param  {Object}   pOptions                    Options to modify the
     *                                                escaping behavior
     * @param  {Array}    pOptions.htmlTagsWhitelist  An array containing
     *                                                strings with the
     *                                                whitelisted tag names
     * @param  {string}   pOptions.htmlEscapeMode     The escape mode to use
     *                                                Note that the value of
     *                                                this parameter is meant
     *                                                to be one of the
     *                                                C_BASIC_HTML_ESCAPE_MODE
     *                                                or
     *                                                C_EXTENDED_HTML_ESCAPE_MODE
     *                                                constants. By default,
     *                                                this parameter takes its
     *                                                value from the
     *                                                markdownify.htmlEscapeMode
     *                                                variable
     * @param  {boolean}  pOptions.allowAttributes    Whether or not to allow
     *                                                attributes
     * @return  {string}  The escaped HTML string
     *
     * @todo In the future, pOptions.htmlTagsWhitelist may change from an array
     *       of strings to an object with the tag names as the keys and an
     *       array of strings as the value, the latter containing the
     *       whitelisted attributes. With this change the allowAttributes
     *       option may disappear
     */
    md.escapeWithHtmlTagsWhitelist = function( pHtml, pOptions ){
        var lResult = pHtml,
            lReplacedTags = [],

            lTagNamePattern = '[a-zA-Z0-9]+',

            /*lAttributeNamePattern = '[^ "\'>\\/=\\x00-\\x1f]+',
            lUnquotedAttributeValuePattern = '[^ "\'=<>`]+',
            // This needs to be surrounded by single quotes when used
            lSingleQuotedAttributeValuePattern = '[^\']*',
            lDoubleQuotedAttributeValuePattern = '[^"]*',
            lAttributePattern = '(' + 
                lAttributeNamePattern + 
                ')(?: *= *(?:(' + 
                    lUnquotedAttributeValuePattern + 
                ')|\'(' + 
                    lSingleQuotedAttributeValuePattern + 
                ')\'|"(' + 
                    lDoubleQuotedAttributeValuePattern + 
                ')")?',*/
            lAttributesRoughPattern = '[^>]*',
            lStartTagPattern = '<(' + lTagNamePattern + ')' +
                '(?: (' + lAttributesRoughPattern + '))?' +
                ' *\\/?>',
            lEndTagPattern = '<\\/(' + lTagNamePattern + ') *>',

            lTagNameRegExp = new RegExp( '^' + lTagNamePattern + '$', 'i' ),
            // This roughly matches the tag specification from W3C, parameters 
            // should be validated afterwards using the lAttribute RegExp:
            // (?:([^ "'>\/=\x00-\x1f]+)(?: *= *(?:([^ "'=<>`]+)|'([^']*)'|"([^"]*)"))?)
            lTagsRegExp = new RegExp(
                lStartTagPattern + '|' + lEndTagPattern,
                'gi'
            ),
            lPlaceholdersRegExp = new RegExp( '@\\$([0-9]+)\\$@', 'gi' );

            /*
             * TODO: Maybe in the future we can have a mode which merges both
             *       the default and the parameter passed whitelist using:
             *
             *       $.unique(
             *          $.merge(
             *              pOptions.htmlTagsWhitelist,
             *              md.C_HTML_TAGS_WHITELIST
             *          )
             *       )
             */
            pOptions = $.extend(
                {},
                // Set some defaults for the options
                {
                    htmlTagsWhitelist: md.C_HTML_TAGS_WHITELIST,
                    allowAttributes: false,
                    // Let the escape function handle this by default
                    htmlEscapeMode: undefined
                },
                // Replace the defaults with whatever comes in the parameter
                pOptions
            );

            if( Array.isArray( pOptions.htmlTagsWhitelist ) ){
                // Validate strings inside the pOptions.htmlTagsWhitelist and
                // filter those that are not proper tag names, then get
                // everything to lower case
                pOptions.htmlTagsWhitelist.filter( function(
                    pCurrentValue,
                    pIndex,
                    pArray
                ){
                    return lTagNameRegExp.test( pCurrentValue );
                } ).map( function( pCurrentValue, pIndex, pArray ){
                    return pCurrentValue.toLowerCase();
                } );
            } else {
                pOptions.htmlTagsWhitelist = md.C_HTML_TAGS_WHITELIST;
            }

        lResult = lResult.replace(
            lTagsRegExp,
            function(
                pFullMatch,
                pOpeningTagName,
                pAttributes,
                pClosingTagName,
                pIndex,
                pOriginalInput
            ){
                var lReplacement = pFullMatch;

                // If the matched portion is either an opening or closing tag 
                // in the whitelist
                if(
                    (
                        (
                            pOpeningTagName !== undefined && $.inArray(
                                pOpeningTagName.toLowerCase(),
                                pOptions.htmlTagsWhitelist
                            ) != -1
                        ) || (
                            pClosingTagName !== undefined && $.inArray(
                                pClosingTagName.toLowerCase(),
                                pOptions.htmlTagsWhitelist
                            ) != -1
                        )
                    ) && (
                        pOptions.allowAttributes || (
                            !pOptions.allowAttributes && pAttributes === undefined
                        )
                    )
                ){
                    // Using @$ and $@ as placeholders because those
                    // characters, and numbers will not get escaped in the
                    // final result
                    lReplacement = '@$' + lReplacedTags.length + '$@';
                    // Collect the original matches in an array so we are able
                    // to return them back to their original status afterwards
                    lReplacedTags.push( pFullMatch );
                }

                return lReplacement;
            }
        );

        lResult = md.escapeHtml(
            lResult,
            pOptions.htmlEscapeMode
        );

        // Now replace the placeholders with their original strings
        lResult = lResult.replace(
            lPlaceholdersRegExp,
            function( pFullMatch, pPlaceHolderIndex, pIndex, pOriginalInput ){
                return pPlaceHolderIndex !== undefined ?
                        lReplacedTags[ pPlaceHolderIndex ]
                    :
                        pFullMatch;
            }
        );

        return lResult;
    };

    /**
     * Convert the passed markdown string to HTML
     *
     * @param   {string}  pMarkdown       The markdown string to be transformed
     * @param   {string}  pParserOptions  The options to use for this parsing
     *                                    function and the options to be passed
     *                                    to the marked library
     * @return  {string}  The transformed HTML
     */
    md.parse = function( pMarkdown, pParserOptions ){
        // Complement the defaults with the passed options
        pParserOptions = jQuery.extend( true, {}, md.parserOptions, pParserOptions );

        // Pre-escaping hook
        if ( ( 'preEscapingFunction' in pParserOptions ) 
            && typeof( pParserOptions.preEscapingFunction ) === 'function' ){
            pMarkdown = pParserOptions.preEscapingFunction.apply(undefined, [ pMarkdown ]);
        }

        if ( pParserOptions.escapeInputHtml === true ){
            if ( pParserOptions.htmlTagsWhitelisting.enabled === true ){
                pMarkdown = md.escapeWithHtmlTagsWhitelist(
                    pMarkdown,
                    {
                        htmlTagsWhitelist: pParserOptions.htmlTagsWhitelisting.whitelist,
                        allowAttributes: pParserOptions.htmlTagsWhitelisting.allowAttributes,
                        htmlEscapeMode: pParserOptions.htmlEscapeMode
                    }
                );
            } else {
                // If the options say we need to escape the HTML in the input then
                // we do so
                pMarkdown = md.escapeHtml( pMarkdown, pParserOptions.htmlEscapeMode );
            }
        }

        // Pre-parsing hook
        if ( ( 'preParsingFunction' in pParserOptions ) 
            && typeof( pParserOptions.preParsingFunction ) === 'function' ){
            pMarkdown = pParserOptions.preParsingFunction.apply(undefined, [ pMarkdown ]);
        }

        return marked(
            pMarkdown,
            pParserOptions.markedOptions
        );
    };

    /**
     * Highlight the rendered fenced code blocks located within each of the 
     * pRenderedElements$ set using Code Mirror
     *
     * @param    {jQuery|string}  pRenderedElements$  A set of rendered
     *                                                elements that contain the
     *                                                C_RENDERED_CLASS class
     */
    md.highlightFencedCodeBlocks = function( pRenderedElements$ ){
        // The rendered elements here have to contain the C_RENDERED_CLASS, so 
        // we filter them before processing
        var lElements$ = $( pRenderedElements$ ).filter( '.' + md.C_RENDERED_CLASS );

        // Travers each of the filtered elements
        lElements$.each(function(){
            // The current element
            var lElement$ = $( this );

            // Obtain the code elements with the class starting with "language-"
            lElement$.find( 'code[class^=language-]' ).each( function(){
                // Save the current element to the lCodeElement$ variable
                var lCodeElement$ = $( this ),
                    // Save the contents of the code element to the lCode
                    // variable, remember this has been already rendered
                    // with marked
                    lCode = lCodeElement$.text(),
                    // Get the language from the class (By default the name
                    // of the language is separated by a dash)
                    lLanguage = lCodeElement$
                        .attr( 'class' )
                        .split( /\s+/ )[0]
                        .replace(/^language-/, ''),
                    // Try to find the MIME Type from the language obtained
                    // from the class
                    lMime = CM.findModeByName( lLanguage ).mime,
                    // Also try to get the Code Mirror mode from the
                    // language
                    lMode = CM.findModeByName( lLanguage ).mode,
                    // Create an element on which the code mirror will be
                    // put, a container for it
                    lCodeMirrorElement$ = $( '<span></span>' ),
                    // Declare the variable that is going to contain the
                    // actual CodeMirror object
                    lCodeMirror;

                lCodeElement$
                    // Navigate to the rendered parent of the code element
                    // remember GFM renders fenced code blocks using first
                    // a "pre" element and then a "code" element inside, so
                    // the parent of this element would really be the "pre"
                    // element
                    .parent()
                    // Insert the Code Mirror container after the "pre"
                    .after( lCodeMirrorElement$ )
                    // Remove the "pre", and therefore its children, which
                    // include lCodeElement$
                    .remove();

                // Instanciate the CodeMirror
                lCodeMirror = CM(
                    // This is the DOM element for the "span" we created
                    // earlier
                    lCodeMirrorElement$.get(0),
                    {
                        value: lCode,
                        theme: 'default',
                        lineNumbers: true,
                        readOnly: true
                    }
                );
                // This is what sets the highlighting mode
                lCodeMirror.setOption( 'mode', lMime );
                // And this is what loads the corresponding mode files from
                // the library folder
                CM.autoLoadMode( lCodeMirror, lMode );
            } );
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
    md.render = function ( pElements, pParserOptions, pSourceOptions, pRendererOptions ) {
        var lElements$;

        lElements$ = $( pElements )
            // Filter only to those elements which don't have a
            // data-markdown attribute or to those whose data-markdown
            // attribute is set to true
            .filter( ':not([data-markdown]), [data-markdown="true"]' )
            // Filter-out all of the elements that are already markdownified
            // This will render only those elements which are not already rendered
            .filter( ':not( .' + md.C_RENDERED_CLASS +' )' );

        // Traverse the rest of the elements
        lElements$.each(function(){
            // Save the current element as jQuery in a variable
            var lElement$ = $( this ),
                lElementData = lElement$.data(),
                lDataParserOptions = {},
                lDataSourceOptions = {},
                lDataRendererOptions = {
                    // Highlight Fenced Code Blocks by default
                    highlightFencedCodeBlocks: true
                },
                lParserOptions = {},
                lSourceOptions = {},
                lRendererOptions = {};

            // Data options will only be parsed if the markdown is present
            // and is set to "true"
            if (
                'markdown' in lElementData &&
                lElementData.markdown
            ){
                // data-markdown-escape-html
                // Whether or not to escape the source HTML
                if ( 'markdownEscapeHtml' in lElementData ){
                    switch( lElementData.markdownEscapeHtml ){
                        case true:
                            lDataParserOptions.escapeInputHtml = true;
                            break;
                        case false:
                            lDataParserOptions.escapeInputHtml = false;
                            break;
                        default:
                            break;
                    }
                }
                // Map the attribute data-markdown-html-escape-mode to the htmlEscapeMode parser options
                // One thing I noticed is that jQuery parses the data attributes as if they where in camel case
                // this is interesting because we cannot use the name of the attribute with dashes because its being parsed as camelcase
                // however you may see in the comment that I'm using dashes, this is because this is how it looks on the HTML
                if ( 'markdownHtmlEscapeMode' in lElementData ){
                    switch( lElementData.markdownHtmlEscapeMode ){
                        case 'basic':
                            lDataParserOptions.htmlEscapeMode = md.C_BASIC_HTML_ESCAPE_MODE;
                            break;
                        case 'extended':
                            lDataParserOptions.htmlEscapeMode = md.C_EXTENDED_HTML_ESCAPE_MODE;
                            break;
                        default:
                            break;
                    }
                }
                // data-markdown-enable-html-tags-whitelisting
                if ( 'markdownEnableHtmlTagsWhitelisting' in lElementData ){
                    if( !( 'htmlTagsWhitelisting' in lDataParserOptions ) ){
                        lDataParserOptions.htmlTagsWhitelisting = {};
                    }

                    switch ( lElementData.markdownEnableHtmlTagsWhitelisting ){
                        case true:
                            $.extend(
                                true,
                                lDataParserOptions.htmlTagsWhitelisting,
                                {
                                    enabled: true
                                }
                            );
                            break;
                        case false:
                            $.extend(
                                true,
                                lDataParserOptions.htmlTagsWhitelisting,
                                {
                                    enabled: false
                                }
                            );
                            break;
                        default:
                            break;
                    }
                }
                // data-markdown-html-tags-whitelist
                if ( 'markdownHtmlTagsWhitelist' in lElementData ){
                    if( !( 'htmlTagsWhitelisting' in lDataParserOptions ) ){
                        lDataParserOptions.htmlTagsWhitelisting = {};
                    }

                    if (
                        lElementData.markdownHtmlTagsWhitelist
                            .split(',').length > 0
                    ){
                        $.extend(
                            true,
                            lDataParserOptions.htmlTagsWhitelisting,
                            {
                                whitelist: lElementData.markdownHtmlTagsWhitelist
                                    .split(',')
                            }
                        );
                    }
                }
                // data-markdown-allow-attributes-in-html-whitelisted-tags
                if ( 'markdownAllowAttributesInHtmlWhitelistedTags' in lElementData ){
                    if( !( 'htmlTagsWhitelisting' in lDataParserOptions ) ){
                        lDataParserOptions.htmlTagsWhitelisting = {};
                    }

                    switch ( lElementData.markdownAllowAttributesInHtmlWhitelistedTags ){
                        case true:
                            $.extend(
                                true,
                                lDataParserOptions.htmlTagsWhitelisting,
                                {
                                    allowAttributes: true
                                }
                            );
                            break;
                        case false:
                            $.extend(
                                true,
                                lDataParserOptions.htmlTagsWhitelisting,
                                {
                                    allowAttributes: false
                                }
                            );
                            break;
                        default:
                            break;
                    }
                }
                // data-markdown-parsing-mode
                // Whether to parser the element's text or innerHTML as markdown
                if ( 'markdownParsingMode' in lElementData ){
                    switch( lElementData.markdownParsingMode ){
                        case 'html':
                            lDataSourceOptions.parseText = false;
                            break;
                        case 'text':
                            lDataSourceOptions.parseText = true;
                            break;
                        default:
                            break;
                    }
                }
                // data-markdown-highlight-code-blocks
                // Wether to highlight code blocks using CodeMirror or not
                if ( 'markdownHighlightCodeBlocks' in lElementData ){
                    switch( lElementData.markdownHighlightCodeBlocks ){
                        case true:
                            lDataRendererOptions.highlightFencedCodeBlocks = true;
                            break;
                        case false:
                            lDataRendererOptions.highlightFencedCodeBlocks = false;
                            break;
                        default:
                            break;
                    }
                }
                // data-markdown-pre-escaping-function
                // A function to execute to replace the markdown text before
                // escaping it
                if ( 'markdownPreEscapingFunction' in lElementData ){
                    if( lElementData.markdownPreEscapingFunction ){
                        // TODO: Review the security of this
                        lDataRendererOptions.preEscapingFunction = eval( lElementData.markdownPreEscapingFunction );
                    }
                }
                // data-markdown-pre-parsing-function
                // A function to execute to replace the markdown text before
                // parsing it
                if ( 'markdownPreParsingFunction' in lElementData ){
                    if( lElementData.markdownPreParsingFunction ){
                        // TODO: Review the security of this
                        lDataRendererOptions.preParsingFunction = eval( lElementData.markdownPreParsingFunction );
                    }
                }
            }

            // Set the parser options to the data options and override settings
            // with the parameter options
            $.extend( true, lParserOptions, lDataParserOptions, pParserOptions );
            // Set the source options to the data options and override settings
            // with the parameter options
            $.extend( true, lSourceOptions, lDataSourceOptions, pSourceOptions );
            // Set the renderer options to the data options and override settings
            // with the parameter options
            $.extend( true, lRendererOptions, lDataRendererOptions, pRendererOptions );

            // Assign the HTML of the element to either the innerHTML or text
            // depending on the parseText source option
            lElement$.html(
                // Obtain the full text or html that the element contains and
                // transform it into HTML using the markdown parser
                md.parse(
                    // If we were told to parse the text then we pass the text
                    // to the parser, otherwise we pass the html
                    lSourceOptions && 
                    ( 'parseText' in lSourceOptions ) &&
                    lSourceOptions.parseText ?
                            lElement$.text()
                        :
                            lElement$.html(),
                    lParserOptions
                )
            // Finally, add the class to indicate the element was converted
            // into markdown already
            ).addClass( md.C_RENDERED_CLASS );

            if (
                ( 'highlightFencedCodeBlocks' in lRendererOptions ) &&
                lRendererOptions.highlightFencedCodeBlocks
            ){
                md.highlightFencedCodeBlocks( lElement$ );
            }

            // Trigger an event once the element has been rendered
            $( document ).trigger( md.C_EVENT_NAME, lElement$.get(0) );
        });
    };

    /**
     * The Textarea Class. Given a textarea, the class adds extra functionality
     * on top of it acting as a wrapper. Original textarea is exposed as 
     * this.textarea$
     *
     * @class
     * @param  {string|DOMElement|jQuery}  pTextarea               The textarea to be bound
     * @param  {Object}                    pOptions                Textarea options
     * @param  {boolean}                   pOptions.useCodeEditor  Wether or not to use a code editor instead of a simple textarea
     * @todo  Handle the textarea undo/redo history
     */
    md.Textarea = function( pTextarea, pOptions ) {
        var lThat = this;

        // This functionality was disabled until we can find a way of properly
        // auto increment ordered lists
        // Index is kept track per toolbar instance
        // Start Ordered Lists with 1
        //this.orderedListIndex = 1;

        // Obtain only the first textarea object from the passed set
        this.textarea$ = $( pTextarea ).filter( 'textarea' ).eq(0);
        // This will be an interval object from setInterval but will only be
        // populated when this.codeMirror is not null
        this.textareaPollingInterval = null;
        this.codeMirror = null;
        this.codeMirrorDocument = null;
        if( this.textarea$.length > 0 ){
            if( pOptions && ( 'useCodeEditor' in pOptions ) && pOptions.useCodeEditor ){
                this.codeMirror = CM.fromTextArea( this.textarea$.get(0), { /*lineNumbers: true*/ } );
                this.codeMirrorDocument = this.codeMirror.getDoc();
                this.codeMirror.setSize( '100%', null );
                // BEGIN FEATURE: Markdown Highlighting
                this.codeMirror.setOption( 'mode', 'text/x-gfm' );
                CM.autoLoadMode( this.codeMirror, 'gfm' );
                // END FEATURE: Markdown Highlighting
                // BEGIN FEATURE: CodeMirror Line Wrapping
                this.codeMirror.setOption( 'lineWrapping', true );
                // END FEATURE: CodeMirror Line Wrapping
                this.codeMirror.on( 'change', function( pInstance, pChangeObj ){
                    pInstance.save();
                } );
                // BEGIN FEATURE: Support apex.input('...').setValue() API
                /* 
                    Found the inputRead CodeMirror Event https://codemirror.net/doc/manual.html#event_inputRead
                    it triggers whenever the textarea is modified by the user
                    Also found the pollInterval property https://codemirror.net/doc/manual.html#option_pollInterval
                    which indicates that even when no event has been triggered
                    CodeMirror will look for changes in the text area every n
                    milliseconds, 100 milliseconds by default

                    UPDATE: None of the above from the documentation is true,
                    I searched throughout the code and the only places where
                    the text area value is read or written to in the latest
                    version are:

                    - https://github.com/codemirror/CodeMirror/blob/9c8f813aaf19fa4191d59f8fa62c900f95d99133/src/input/TextareaInput.js#L157
                    - https://github.com/codemirror/CodeMirror/blob/9c8f813aaf19fa4191d59f8fa62c900f95d99133/src/input/TextareaInput.js#L161
                    - https://github.com/codemirror/CodeMirror/blob/ed8dfeb5e2ed25b5dd1f1eccc7b757ca6dbd118d/src/edit/fromTextArea.js#L8
                    - https://github.com/codemirror/CodeMirror/blob/ed8dfeb5e2ed25b5dd1f1eccc7b757ca6dbd118d/src/edit/fromTextArea.js#L21

                    There's no polling being done anywhere to the value of the
                    text area and no events are being listened to involving the
                    text area

                    The save function in the fourth link above let us know that
                    no event is triggered on the text area when the CodeMirror
                    save function is executed

                    I'm currently updating the codeMirror with the textarea
                    value if they're different using an interval 
                    (https://www.w3schools.com/jsref/met_win_setinterval.asp)
                    every 100 milliseconds because according to the APEX
                    documentation (https://docs.oracle.com/en/database/oracle/application-express/19.1/aexjs/apex.item.html#setValue),
                    the apex.item('...').setValue() could be passed the 
                    "suppressChangeEvent" argument not to fire a change event 
                    and in that case, we would not be able to detect the change
                    in the textarea, it may be costly, but it is accurate,
                    the idea came from CodeMirror's documentation and I
                    wouldn't know how else to implement it to be accurate
                */
                this.textareaPollingInterval = setInterval(
                    function(){
                        // If the textarea and codeMirror values are different
                        if (
                            lThat.textarea$.val() != lThat.codeMirror.getValue()
                        ){
                            // Set the value of the codeMirror document to the
                            // value of the textarea
                            lThat.codeMirrorDocument
                                .setValue( lThat.textarea$.val() );
                        }
                    },
                    // 100 milliseconds
                    100
                );
            }
        } else {
            throw 'ERROR: markdownify.Textarea: No textarea element was found in the passed argument. A textarea selector, element or jQuery object must be passed';
        }
    };
    md.Textarea.maximumHeight = 320;
    /**
     * Adjust the height of the textarea to its contents given that the current
     * textarea height is lesser than the passed maximum height, or the default
     * maximum height by default
     *
     * @param  {number}  pMaximumHeight  The maximum textarea height
     */
    md.Textarea.prototype.adjustHeight = function( pMaximumHeight ){
        if( pMaximumHeight === undefined ){
            // Take the default value
            pMaximumHeight = md.Textarea.maximumHeight;
        }

        if ( this.codeMirror !== null ){
            var lCodeMirrorElementHeight = this.codeMirror.getWrapperElement().offsetHeight,
                lCodeMirrorScrollHeight = this.codeMirror.getScrollInfo().height;

            if ( lCodeMirrorScrollHeight > lCodeMirrorElementHeight && lCodeMirrorElementHeight < pMaximumHeight ) {
                // Plus 1 line at a time
                this.codeMirror.setSize(null, lCodeMirrorElementHeight + this.codeMirror.defaultTextHeight());
            }
        } else {
            if ( this.textarea$.get(0).scrollHeight < pMaximumHeight ) {
                // Not sure if this is actually needed, but at least in chrome it
                // has no effect
                this.textarea$.css('height', 'auto');
                // Adjust the textarea to the height of its contents plus one line
                // (in pixels)
                this.textarea$.css(
                    'height',
                    (
                        this.textarea$.get(0).scrollHeight
                            + parseFloat( 
                                window.getComputedStyle(
                                    this.textarea$.get(0)
                                ).lineHeight
                            )
                    ) + 'px'
                );
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
    md.Textarea.prototype.getSelectionProperties = function(){
        var lResult,
            // This variable is to be able to swap the selection start and end
            // depending on their position
            lCursorAux = null,
            lCodeMirrorSelection;

        if ( this.codeMirror !== null ){
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

            lResult.selectionStartsInZero = lResult.selectionStart.line == 0 && lResult.selectionStart.ch == 0;

            if( lResult.selectionStart.ch > lResult.selectionEnd.ch ){
                lCursorAux = lResult.selectionStart;
                lResult.selectionStart = lResult.selectionEnd;
                lResult.selectionEnd = lCursorAux;
            }

            lResult.textBeforeSelection = this.codeMirrorDocument.getRange( { line: 0, ch: 0 }, lResult.selectionStart );
            lResult.textAfterSelection = this.codeMirrorDocument.getRange( lResult.selectionEnd, { line: this.codeMirrorDocument.lastLine(), ch: this.codeMirrorDocument.getLine( this.codeMirrorDocument.lastLine() ).length } );
            lResult.selectionLength = lResult.selectedText.length;
            lResult.numberOfSelectedLines = lResult.selectedText.split('\n').length;
        } else {
            lResult = {
                selectionStart: this.textarea$.prop( 'selectionStart' ),
                selectionEnd: this.textarea$.prop( 'selectionEnd' ),
                textareaValue: this.textarea$.val(),
                textBeforeSelection: '',
                textAfterSelection: '',
                selectedText: '',
                selectionLength: 0,
                numberOfSelectedLines: 0,
                selectionStartsInZero: false
            };

            lResult.selectionStartsInZero = lResult.selectionStart == 0;

            // If the selection start is after the selection end...
            if ( lResult.selectionStart > lResult.selectionEnd ){
                // Save the selection start in an auxiliary variable
                lCursorAux = lResult.selectionStart;
                // And then swap both
                lResult.selectionStart = lResult.selectionEnd;
                lResult.selectionEnd = lCursorAux;
            }

            // Calculate the length of the selection as the end minus the start
            lResult.selectionLength = lResult.selectionEnd - lResult.selectionStart;

            // If the selection doesn't start in the 0 position of the textarea...
            if ( lResult.selectionStart > 0 ){
                // Capture the text that was between positions 0 and the start of
                // the selection
                lResult.textBeforeSelection = lResult.textareaValue.substring(0, lResult.selectionStart);
            }
            if ( lResult.selectionEnd < lResult.textareaValue.length ){
                lResult.textAfterSelection = lResult.textareaValue.substring(lResult.selectionEnd, lResult.textareaValue.length);
            }

            if ( lResult.selectionLength > 0 ){
                lResult.selectedText = lResult.textareaValue.substring( lResult.selectionStart, lResult.selectionStart + lResult.selectionLength );
                lResult.numberOfSelectedLines = lResult.selectedText.split('\n').length;
            }
        }

        return lResult;
    };
    /**
     * The selection from the object's textarea is wrapped by the prefix and
     * suffix passed as a parameter
     *
     * @param  {string}  pPrefix  The prefix to prepend the selection with
     * @param  {string}  pSuffix  The suffix to append to the selection
     */
    md.Textarea.prototype.wrapSelection = function( pPrefix, pSuffix ){
        var lSelectionProperties = this.getSelectionProperties(),
            lNewSelection;
        // Once we know what the selection is, where it starts and everything..
        if ( this.codeMirror !== null ){
            this.codeMirror.focus();
            this.codeMirrorDocument.replaceSelection(
                (pPrefix ? pPrefix : '') + 
                lSelectionProperties.selectedText + 
                (pSuffix ? pSuffix : ''),
                'end'
            );
            // BEGIN FEATURE: Move selection to the middle
            lNewSelection = this.codeMirrorDocument.listSelections()[0];
            // Note this has still the values of the selection before being replaced
            if( lSelectionProperties.selectionLength == 0 ){
                // Move the selection from the end of the replacement as many
                // characters as the suffix has to put the cursor in the middle
                this.codeMirrorDocument.setSelection(
                    { line: lNewSelection.anchor.line, ch:lNewSelection.anchor.ch - (pSuffix ? pSuffix.length : 0) },
                    { line: lNewSelection.anchor.line, ch:lNewSelection.anchor.ch - (pSuffix ? pSuffix.length : 0) }
                );
            }
            // END FEATURE
        } else {
            /*
               We set the value of the textarea to the text that was before the
               selection, then we append the prefix from the parameter, then we
               append the selected text, then we append the suffix passed as a
               parameter and finally, we append the text that was after the
               selection
             */
            this.textarea$
                .val( lSelectionProperties.textBeforeSelection + ( pPrefix ? pPrefix : '' ) + lSelectionProperties.selectedText + ( pSuffix ? pSuffix : '' ) + lSelectionProperties.textAfterSelection );
            /*
               Now we update the values where the selection should be. This will
               make that once wrapped, we preserve the user selection
            */
            /*
               Set the selection start to the length of the text before the
               selection plus the length of the prefix
             */
            lSelectionProperties.selectionStart = lSelectionProperties.textBeforeSelection.length + ( pPrefix ? pPrefix.length : 0 );
            /*
               Set the end of the selection to the start position plus the
               selection length
             */
            lSelectionProperties.selectionEnd = lSelectionProperties.selectionStart + lSelectionProperties.selectionLength;

            // If the length of the selection is lesser than or equal to zero...
            if (lSelectionProperties.selectionLength <= 0) {
                // Set the selection start and end to the selection start point
                // that we calculated before
                this.textarea$
                    .prop({
                        selectionStart: lSelectionProperties.selectionStart,
                        selectionEnd: lSelectionProperties.selectionStart
                    });
            } else {
                // Set the selection's start and end to the position after the
                // inserted suffix
                this.textarea$
                    .prop({
                        selectionStart: lSelectionProperties.selectionEnd + ( pSuffix ? pSuffix.length : 0 ),
                        selectionEnd: lSelectionProperties.selectionEnd + ( pSuffix ? pSuffix.length : 0 )
                    });
            }

            this.textarea$
                // Focus the textarea
                .focus()
                // And then simulate the press of a key. This is because, if the
                // text in the textarea is bigger than the visible text area
                // the scroll position will be at the end of it. If we
                // simulate the keypress, then the textarea scroll will move to
                // where the cursor is
                .trigger( 'keypress' );
        }
    };
    /**
     * Prefix the line corresponding to the selection on the object's textarea
     * with the given prefix
     *
     * @param  string  pPrefix  The text that will be prefixed to the text area
     *                          selection
     * @todo  Identify which line I'm in
     */
    md.Textarea.prototype.prefixLines = function( pPrefix ){
        var lSelectionProperties = this.getSelectionProperties();

        // If the length of the selection is more than 0...
        if ( lSelectionProperties.selectionLength > 0 ){
            // Join the selected text again with new lines, but this time
            // also prepend the prefix to each of the lines
            lSelectionProperties.selectedText = lSelectionProperties.selectedText.split('\n').join('\n' + pPrefix);
        }

        if ( this.codeMirror !== null ){
            this.codeMirror.focus();
            this.codeMirrorDocument.replaceSelection( 
                ( pPrefix ? pPrefix : '' ) + lSelectionProperties.selectedText,
                'end'
            );
        } else {
            // Set the value of the textarea to the text before the selection plus
            // the prefix (Because the join function above does not preppend the
            // prefix to the first line), plus the selected text and finally the
            // text after the selection
            this.textarea$
                .val( lSelectionProperties.textBeforeSelection + ( pPrefix ? pPrefix : '' ) + lSelectionProperties.selectedText + lSelectionProperties.textAfterSelection );

            // Calculate the new selection start and end after prepending the lines
            // The start will be the length of the text before the selection plus
            // the length of the prefix
            lSelectionProperties.selectionStart = lSelectionProperties.textBeforeSelection.length + ( pPrefix ? pPrefix.length : 0 );
            // The selection end will be the selection start plus the selection
            // length plus the length of the prefix as many times as lines in the
            // selected string minus 1 (TODO: Check why do we need the -1)
            lSelectionProperties.selectionEnd = lSelectionProperties.selectionStart + lSelectionProperties.selectionLength + ( pPrefix ? pPrefix.length * ( lSelectionProperties.numberOfSelectedLines - 1 ) : 0 );

            // If there was no text selected in the textarea...
            if (lSelectionProperties.selectionLength <= 0) {
                // Set the selection start and end to the selection start position
                this.textarea$
                    .prop({
                        selectionStart: lSelectionProperties.selectionStart,
                        selectionEnd: lSelectionProperties.selectionStart
                    });
            } else {
                // If there was selected text in the text area then set the
                // selection start and end to the end of the selection
                this.textarea$
                    .prop({
                        selectionStart: lSelectionProperties.selectionEnd,
                        selectionEnd: lSelectionProperties.selectionEnd
                    });
            }

            this.textarea$
                // Focus the textarea to be able to simulate a keypress
                .focus()
                // And then simulate the press of a key. This is because, if the
                // text in the textarea is bigger than the visible text area
                // the scroll position will be at the end of it. If we
                // simulate the keypress, then the textarea scroll will move to
                // where the cursor is
                .trigger( 'keypress' );
        }
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
     * @param  {Function}  pInitializationFunction    A function to receive the
     *                                                current options and modify
     *                                                them if necessary
     */
    md.Editor = function( pTextarea, pOptions, pInitializationFunction ) {
        var lThat = this;

        this.options = $.extend(
            true,
            {
                // By default let the textarea take their defaults
                textarea: {},
                preview: {
                    parsing: md.parserOptions
                },
                // The default options for the toolbar
                toolbar: {
                    data: [
                        // Groups: Each object represents a group
                        // The inline editing group, it contains the bold, italics,
                        // strikethrough and inline code buttons
                        {
                            // No padding between buttons
                            groupTogether: true,
                            controls: [
                                // Controls
                                {
                                    // A normal button control, it is clicked and it
                                    // performs an action
                                    type: 'BUTTON',
                                    // The text of the button
                                    label: 'Bold',
                                    // Only didplay the icon in the button but leave the
                                    // button label acessible so it can be read by screen
                                    // readers
                                    iconOnly: true,
                                    // The class for the icon, note that we also need the fa
                                    // prefix for font-apex
                                    icon: 'fa fa-bold',
                                    // The name of the action to be executed, note that the
                                    // action should be defined in the actionsContext
                                    action: 'bold'
                                },
                                {
                                    type: 'BUTTON',
                                    label: 'Italic',
                                    iconOnly: true,
                                    icon: 'fa fa-italic',
                                    action: 'italics'
                                },
                                {
                                    type: 'BUTTON',
                                    label: 'Striketrough',
                                    iconOnly: true,
                                    icon: 'fa fa-strikethrough',
                                    action: 'strikethrough'
                                },
                                {
                                    type: 'BUTTON',
                                    label: 'Inline Code',
                                    iconOnly: true,
                                    icon: 'fa fa-code',
                                    action: 'inlineCode'
                                }
                            ]
                        },
                        // The list group, it will contain unordred and ordered buttons
                        {
                            groupTogether: true,
                            controls: [
                                {
                                    type: 'BUTTON',
                                    label: 'Unordered List',
                                    iconOnly: true,
                                    icon: 'fa fa-list',
                                    action: 'unorderedList'
                                },
                                {
                                    type: 'BUTTON',
                                    label: 'Ordered List',
                                    iconOnly: true,
                                    icon: 'fa fa-list-ol',
                                    action: 'orderedList'
                                }
                            ]
                        },
                        // The blocks group, it will contain controls for the codeblock and
                        // blockquote
                        {
                            groupTogether: true,
                            controls: [
                                {
                                    // Menu controls are different from buttons because they
                                    // display a menu when clicked instead of executing a
                                    // particular option
                                    type: 'MENU',
                                    // Menus need an ID to be linked to
                                    id: 'CODE_BLOCK_BUTTON',
                                    // The text for the button
                                    label: 'Code Block',
                                    // Only display the icon
                                    iconOnly: true,
                                    // The classes for the icon that will be displayed
                                    icon: 'fa fa-terminal',
                                    // The definition of the menu that will be displayed
                                    menu: {
                                        // The items of the menu
                                        items:[
                                            {
                                                // The menu type, action is the most common
                                                // and Menu items defined as such act the
                                                // same as toolbar buttons (They perform an
                                                // action when clicked)
                                                type: 'action',
                                                // The button Text
                                                label: 'Generic',
                                                // The value of the button, this value
                                                // doesn't get passed to the action but is
                                                // required
                                                value: 'GENERIC',
                                                // The name of the referenced action
                                                action: 'codeBlock'
                                            },
                                            {
                                                // This gets displayed just as a line to
                                                // separate buttons
                                                type: 'separator'
                                            },
                                            {
                                                type: 'action',
                                                label: 'HTML',
                                                value: 'HTML',
                                                action: 'codeBlockHtml'
                                            },{
                                                type: 'action',
                                                label: 'CSS',
                                                value: 'CSS',
                                                action: 'codeBlockCss'
                                            },
                                            {
                                                type: 'action',
                                                label: 'JavaScript',
                                                value: 'JS',
                                                action: 'codeBlockJs'
                                            }
                                        ]
                                    }
                                },
                                {
                                    type: 'BUTTON',
                                    label: 'Blockquote',
                                    iconOnly: true,
                                    icon: 'fa fa-quote-left',
                                    action: 'blockquote'
                                }
                            ]
                        },
                        {
                            groupTogether: true,
                            controls: [
                                {
                                    type: 'BUTTON',
                                    label: 'Link',
                                    iconOnly: true,
                                    icon: 'fa fa-link',
                                    action: 'link'
                                },
                                {
                                    type: 'BUTTON',
                                    label: 'Image',
                                    iconOnly: true,
                                    icon: 'fa fa-image',
                                    action: 'image'
                                }
                            ]
                        },
                        {
                            // Add padding to the buttons
                            groupTogether: false,
                            // Align this toggle button to the end of the toolbar (Right)
                            align: 'end',
                            controls: [
                                {
                                    // Toggle buttons are declared the same here but behave
                                    // differently, like a checkbox, once clicked they keep
                                    // their state until they're clicked again
                                    type: 'TOGGLE',
                                    label: 'Preview',
                                    // The action that they need to reference must contain
                                    // a get and set attribute instead of an action
                                    // attribute. The function in the get will be used to
                                    // obtin the value that will set its status to either on
                                    // (true) or off (false) and the function in the set
                                    // will be used to set the value of the variable
                                    // referenced in the get to either true or false given
                                    // the clicks on the button
                                    action: 'preview'
                                }
                            ]
                        }
                    ],
                    // The actions defined here use variables that don't exist
                    // just yet in the editor but that are guaranteed to exist
                    actions: [
                        // The following actions are meant to be executed by normal buttons,
                        // a button is clicked and a function is executed
                        {
                            // The name of the action which should be referred by the toolbar
                            name: 'bold',
                            // An action is a function to be executed
                            action: function(){
                                lThat.textarea.wrapSelection( '**', '**' );
                                lThat.textarea.adjustHeight();
                            }
                        },
                        {
                            name: 'italics',
                            action: function(){
                                lThat.textarea.wrapSelection( '_', '_' );
                                lThat.textarea.adjustHeight();
                            }
                        },
                        {
                            name: 'strikethrough',
                            action: function(){
                                lThat.textarea.wrapSelection( '~~', '~~' );
                                lThat.textarea.adjustHeight();
                            }
                        },
                        {
                            name: 'inlineCode',
                            action: function(){
                                lThat.textarea.wrapSelection( '`', '`' );
                                lThat.textarea.adjustHeight();
                            }
                        },
                        {
                            name: 'unorderedList',
                            action: function(){
                                lThat.textarea.prefixLines( ( ! lThat.textarea.getSelectionProperties().selectionStartsInZero ? '\n' : '') + '- ' );
                                lThat.textarea.adjustHeight();
                            }
                        },
                        {
                            name: 'orderedList',
                            action: function(){
                                /*
                                   TODO: Check how to reset the ordered list back to normal 
                                   depending on the previous line, we could even avoid the counter
                                   and get the number from the previous line to continue the count
                                   where it left off. If there's no previous line or if the
                                   previous line doesn't begin with a number, a dot and a space
                                   then the count is reset to 1
                                */
                                // Comment out the auto-increment functionality for now
                                // lThat.textarea.prefixLines( ( ! lThat.getSelectionProperties().selectionStartsInZero ? '\n' : '') + (lThat.orderedListIndex++) + '. ', true );

                                /*
                                   Preppend a new line only when the start of the textarea
                                   selection is not character 0
                                */
                                lThat.textarea.prefixLines( ( ! lThat.textarea.getSelectionProperties().selectionStartsInZero ? '\n' : '') + '1. ', true );
                                // This makes the textarea to increment its height up to certain
                                // value whenever the content doesn't fit in it.
                                lThat.textarea.adjustHeight();
                            }
                        },
                        {
                            name: 'codeBlock',
                            action: function(){
                                var lSelectionProperties = lThat.textarea.getSelectionProperties();

                                lThat.textarea.wrapSelection( ( ! lSelectionProperties.selectionStartsInZero ? '\n\n' : '' ) + '```' + '\n', '\n```' );
                                lThat.textarea.adjustHeight();
                            }
                        },
                        {
                            name: 'codeBlockHtml',
                            action: function(){
                                var lSelectionProperties = lThat.textarea.getSelectionProperties();

                                lThat.textarea.wrapSelection( ( ! lSelectionProperties.selectionStartsInZero ? '\n\n' : '' ) + '```' + 'html' + '\n', '\n```' );
                                lThat.textarea.adjustHeight();
                            }
                        },
                        {
                            name: 'codeBlockCss',
                            action: function(){
                                var lSelectionProperties = lThat.textarea.getSelectionProperties();

                                lThat.textarea.wrapSelection( ( ! lSelectionProperties.selectionStartsInZero ? '\n\n' : '' ) + '```' + 'css' + '\n', '\n```' );
                                lThat.textarea.adjustHeight();
                            }
                        },
                        {
                            name: 'codeBlockJs',
                            action: function(){
                                var lSelectionProperties = lThat.textarea.getSelectionProperties();

                                lThat.textarea.wrapSelection( ( ! lSelectionProperties.selectionStartsInZero ? '\n\n' : '' ) + '```' + 'js' + '\n', '\n```' );
                                lThat.textarea.adjustHeight();
                            }
                        },
                        {
                            name: 'blockquote',
                            action: function(){
                                // If the cursor is not at the beginning of the textarea then
                                // preppend a new line to the beginning
                                lThat.textarea.prefixLines( ( ! lThat.textarea.getSelectionProperties().selectionStartsInZero ? '\n' : '') + '> ' );
                                lThat.textarea.adjustHeight();
                            }
                        },
                        {
                            name: 'link',
                            action: function(){
                                var lButton$ = $( this ),
                                    lSelectionProperties = lThat.textarea.getSelectionProperties(),
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
                                        .append( lLink.field ),
                                    lDialog$;

                                if ( lSelectionProperties.selectedText.match( /^[a-z]+:\/\// ) ) {
                                    lThat.textarea.wrapSelection( '[](' , ')' );
                                } else if ( lSelectionProperties.selectionLength > 0 ) {
                                    lThat.textarea.wrapSelection( '[' , ']()' );
                                } else {
                                    lDialog$ = lForm$.dialog({
                                        autoOpen: true,
                                        height: 'auto',
                                        width: 350,
                                        modal: true,
                                        title: 'Insert Link',
                                        buttons: {
                                            Cancel: function() {
                                                lDialog$
                                                    .dialog( 'close' )
                                                    .remove();
                                            },
                                            OK: function(){
                                                lThat.textarea.wrapSelection( '[' + lText.input.val() , '](' + lLink.input.val() + ')' );
                                                lDialog$
                                                    .dialog( 'close' )
                                                    .remove();

                                                if ( lThat.textarea.codeMirror !== null ){
                                                    lThat.textarea.codeMirror.focus();
                                                } else {
                                                    lThat.textarea.textarea$.focus();
                                                }
                                            }
                                        },
                                        close: function() {
                                            lForm$.get(0).reset();
                                        },
                                        create: function(){
                                            $( this )
                                                .parents( '.ui-dialog' )
                                                .find( '.ui-button:contains(OK)' )
                                                .addClass( 'ui-button--hot' );
                                        }
                                    });
                                }
                            }
                        },
                        {
                            name: 'image',
                            action: function(){
                                var lButton$ = $( this ),
                                    lSelectionProperties = lThat.textarea.getSelectionProperties(),
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
                                    lImageSizingGroup = md.Editor
                                        .createCheckboxradioInputGroup({
                                            label: 'Size',
                                            id: 'MARKDOWNIFY_EDITOR_IMAGE_SIZE',
                                            inputType: 'RADIO',
                                            inputsOptions: [
                                                {
                                                    id: 'MARKDOWNIFY_EDITOR_IMAGE_SIZE_SMALL',
                                                    label: 'Small',
                                                    value: 'SMALL'
                                                },
                                                {
                                                    id: 'MARKDOWNIFY_EDITOR_IMAGE_SIZE_MEDIUM',
                                                    label: 'Medium',
                                                    value: 'MEDIUM'
                                                },
                                                {
                                                    id: 'MARKDOWNIFY_EDITOR_IMAGE_SIZE_LARGE',
                                                    label: 'Large',
                                                    value: 'LARGE'
                                                },
                                                {
                                                    id: 'MARKDOWNIFY_EDITOR_IMAGE_SIZE_ORIGINAL',
                                                    label: 'Original',
                                                    value: 'ORIGINAL',
                                                    checked: true
                                                },
                                            ]
                                        }),
                                    lForm$ = $( '<form></form>' )
                                        .append( lImageText.field )
                                        .append( lImageUrl.field ),
                                        // Commenting IMAGE SIZE FEATURE for now
                                        //.append( lImageSizingGroup.field ),
                                    lDialog$;

                                if ( lSelectionProperties.selectedText.match( /^[a-z]+:\/\// ) ) {
                                    lThat.textarea.wrapSelection( '![](' , ')' );
                                } else if ( lSelectionProperties.selectionLength > 0 ) {
                                    lThat.textarea.wrapSelection( '![' , ']()' );
                                } else {
                                    lDialog$ = lForm$.dialog({
                                        autoOpen: true,
                                        height: 'auto',
                                        width: 400,
                                        modal: true,
                                        title: 'Insert Image',
                                        buttons: {
                                            Cancel: function() {
                                                lDialog$
                                                    .dialog( 'close' )
                                                    .remove();
                                            },
                                            OK: function(){
                                                // Commenting IMAGE SIZE FEATURE for now
                                                //var lImageSize = lImageSizingGroup.input.find( 'input:checked' ).val(),
                                                lImageSize = 'ORIGINAL',
                                                    lImg$ = $( '<img>' )
                                                        .attr({
                                                            src: lImageUrl.input.val(),
                                                            alt: lImageText.input.val()
                                                        }),
                                                    lPrefix,
                                                    lSuffix;

                                                switch ( lImageSize ){
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

                                                if ( lImageSize === 'ORIGINAL' ){
                                                    lPrefix = '![' + lImageText.input.val();
                                                    lSuffix = '](' + lImageUrl.input.val() + ')';
                                                } else {
                                                    lPrefix = lImg$
                                                        .get(0)
                                                        .outerHTML + '\n';
                                                }

                                                lThat.textarea.wrapSelection( 
                                                    lPrefix,
                                                    lSuffix
                                                );

                                                lDialog$
                                                    .dialog( 'close' )
                                                    .remove();

                                                if ( lThat.textarea.codeMirror !== null ){
                                                    lThat.textarea.codeMirror.focus();
                                                } else {
                                                    lThat.textarea.textarea$.focus();
                                                }
                                            }
                                        },
                                        close: function() {
                                            lForm$.get(0).reset();
                                        },
                                        create: function(){
                                            $( this )
                                                .parents( '.ui-dialog' )
                                                .find( '.ui-button:contains(OK)' )
                                                .addClass( 'ui-button--hot' );
                                        }
                                    });
                                }
                            }
                        },
                        // The preview action is to be handled by a toggle button (A button
                        // which behaves like a checkbox, either turned on or off) so the
                        // definition of it is different than a normal button, when the button
                        // is turned on, then something happens, when it is turned off then some
                        // other thing happens
                        {
                            // The name of the action which would be referenced
                            name: 'preview',
                            // A function that will be executed to get the state of the button
                            get: function(){
                                return lThat.showingPreview;
                            },
                            // A function that will be executed to modify the state of the
                            // button, pValue will be true when the button should be on and
                            // it will be false when the button is off
                            set: function( pValue ){
                                var lTextareaValue,
                                    lTextareaHeight;

                                // "Toggle" the value of the variable
                                lThat.showingPreview = pValue;

                                // If the preview is being shown...
                                if( lThat.showingPreview ){
                                    // Disable any other buttons in the toolbar except for the
                                    // preview one
                                    lThat.toolbar$
                                        .find( '.a-Toolbar-item:not([data-action="preview"])' )
                                        .attr( 'disabled', 'disabled' );
                                } else {
                                    // Enable the disabled buttons (Should this also apply to the
                                    // preview one?)
                                    lThat.toolbar$
                                        .find( '.a-Toolbar-item:not([data-action="preview"])' )
                                        .removeAttr( 'disabled' );
                                }

                                // Check if CodeMirror is enabled tor the textarea
                                if ( lThat.textarea.codeMirror !== null ){
                                    // If it is then the value comes from the Code Mirror document, not from the textarea
                                    lTextareaValue = lThat.textarea.codeMirrorDocument.getValue();
                                    // And the height comes from the Code Mirror wrapper element since the textarea is currently hidden
                                    lTextareaHeight = $( lThat.textarea.codeMirror.getWrapperElement() ).outerHeight();
                                } else {
                                    // Otherwise both values come from the actual textarea
                                    lTextareaValue = lThat.textarea.textarea$.val();
                                    lTextareaHeight = lThat.textarea.textarea$.outerHeight();
                                }

                                // Parse the contents of the text-area and show them in the preview

                                // Set up the preview panel
                                lThat.previewPanel$
                                    // Empty the element if the preview is not showing
                                    // If preview is being shown but the textarea has no content
                                    // then show the "Nothing to preview" message so users don't
                                    // get a blank box, which may confuse them
                                    // If the textarea is not empty then convert the content to
                                    // markdown and put the result into the panel's HTML
                                    .html(
                                        lThat.showingPreview ?
                                            (
                                                lTextareaValue.length > 0 ?
                                                    md.parse(
                                                        lTextareaValue,
                                                        lThat.options.preview.parsing
                                                    )
                                                :
                                                    '<p style="color: #959595">Nothing to preview</p>'
                                            )
                                        :
                                            ''
                                    )
                                    // Mimic the height of the textarea (Including padding and
                                    // border)
                                    .css( 'height', lThat.showingPreview ? lTextareaHeight : '' )
                                    // Toggle the preview hide class depending on if we're showing
                                    // the preview panel or not
                                    .toggleClass( 'md-Editor-previewPanel--hide', !lThat.showingPreview )
                                    // Tell the markdown parser that the content of this panel
                                    // has already been transformed to markdown based on the
                                    // preview being shown
                                    .toggleClass( md.C_RENDERED_CLASS, lThat.showingPreview );

                                if ( lThat.showingPreview ){
                                    md.highlightFencedCodeBlocks( lThat.previewPanel$ );
                                    // Trigger an event once the element has been rendered
                                    //lThat.previewPanel$.trigger( md.C_EVENT_NAME );
                                }
                            }
                        }
                    ],
                    // Whether we should allow navigation in the toolbar via the arrow keys
                    cursorKeyNavigation: true
                }
            },
            pOptions
        );

        if ( pInitializationFunction !== undefined && typeof( pInitializationFunction ) === 'function' ){
            // We set the options to the result of the initialization function
            // passing it the current set of options as the first parameter
            this.options = pInitializationFunction.apply(undefined, [ this.options ]);
        }

        // Keep track of the preview panel
        this.showingPreview = false;

        // Create the editor element
        this.editor$ = $( '<div></div>' )
            .addClass( 'md-Editor' );

        // Create the toolbar object
        this.toolbar$ = $( '<div></div>' )
            .addClass( 'md-Toolbar' );
        this.options.toolbar.actionsContext = apex.actions.createContext("apex.markdown.Editor.toolbar", this.toolbar$.get(0));
        this.options.toolbar.actionsContext.add( this.options.toolbar.actions );
        // Remove the actions as they're already part of the context
        delete this.options.toolbar.actions;

        // Create the preview panel div
        this.previewPanel$ = $( '<div></div>' )
            // Make the panel markdownifiable (md-Markdown) and hidden by
            // default
            .addClass('md-Markdown md-Editor-previewPanel md-Editor-previewPanel--hide');

        // This element will wrap the editor contents after the toolbar
        this.content$ = $( '<div></div>' )
            .addClass( 'md-Editor-content' );

        // We need to reassign the content because once it wraps the textarea
        // the reference is lost
        this.content$ = $( pTextarea )
            .filter( 'textarea' )
            .addClass( 'md-Editor-textarea' )
            // We need to wrap the textarea with the editor element before
            // transforming the textarea into a CodeMirror element so that the
            // CodeMirror element gets positioned inside of it
            .wrap( this.content$ )
            .parent()
            // Wrap the content with the editor
            .wrap( this.editor$ )
            // Position the toolbar before the content
            .before( this.toolbar$ )
            // Insert the preview panel as the first element of the content
            .prepend( this.previewPanel$ );

        // Set the textarea property to the markdown.Textarea wrapper class
        // for the passed textarea
        this.textarea = new md.Textarea( pTextarea, this.options.textarea );

        // This needs to be executed here because we need the markup to be
        // available before the toolbar widget is configured
        // Once the actions are defined we need to make the toolbar element a 
        // toolbar widget, we do so using the jQuery toolbar function
        this.toolbar$.toolbar( this.options.toolbar );

        if ( this.textarea.codeMirror !== null ){
            this.editor$.addClass( 'md-Editor--codeEditor' );
            // Need to wrap the flex parent
            // For some reason we cannot access the parents of the editor at this point so we use the textarea for that
            this.textarea.textarea$
                .parents( '.t-Form-itemWrapper' )
                .css( { 
                    'flex-wrap': 'wrap',
                    position: 'relative'
                } );
        }
    };

    /**
     * Creates a text input
     *
     * @todo Document
     * @param  {Object}  pOptions  The options
     * @return An object containing the field, the label and the input as jQuery objects
     */
    md.Editor.createTextInput = function( pOptions ){
        var lInput$ = $( '<input />' )
                .addClass( 'text_field apex-item-text' )
                .attr({
                    type: 'text',
                    id: pOptions.id,
                    name: pOptions.id,
                }),
            lItemWrapper$ = $( '<div></div>' )
                .addClass( 't-Form-itemWrapper' )
                .append( lInput$ ),
            lInputContainer$ = $( '<div></div>' )
                .addClass( 't-Form-inputContainer col col-null' )
                .append( lItemWrapper$ ),
            lLabel$ = $( '<label></label>' )
                .addClass( 't-Form-label' )
                .attr( 'for', pOptions.id )
                .text( pOptions.label ),
            lLabelContainer$ = $( '<div></div>' )
                .addClass( 't-Form-labelContainer col col-null' )
                .append( lLabel$ ),
            lFieldContainer$ = $( '<div></div>' )
                .addClass( 't-Form-fieldContainer rel-col t-Form-fieldContainer--stretchInputs lto46434665622631032_0 apex-item-wrapper apex-item-wrapper--text-field' )
                .append( lLabelContainer$ )
                .append( lInputContainer$ );

            if ( 'placeholder' in pOptions ){
                lInputContainer$
                    .attr( 'placeholder', pOptions.placeholder );
            }

        return {
            field: lFieldContainer$,
            label: lLabel$,
            input: lInput$
        };
    };

    /**
     * Creates a radio or checkbox input input
     *
     * @todo Document
     * @param  {Object}  pOptions            An object which will contain the
     *                                       different options for the group
     * @param  {string}  pOptions.id         The id that will be assigned to
     *                                       the field returned
     * @param  {Array}   pOptions.inputsOptions  An array with options for each
     *                                           input. Each element of the
     *                                           array will be an Object with
     *                                           the following properties:
     *                                           - id: The id to be set as an
     *                                                 attribute of the input
     *                                           - name: The name to be set as
     *                                                   an attribute of the
     *                                                   input, if it evaluates
     *                                                   to false, then the
     *                                                   name in the pOptions
     *                                                   parameter, if any will
     *                                                   be used
     *                                           - label: The text that will be
     *                                                    inside of the element
     *                                           - value: The value the input
     *                                                    will represent
     *                                           - checked: Whether the control
     *                                                      is checked or not
     * @param  {string}  pOptions.name       The name to be set as an attribute
     *                                       of all the inputs. If it evaluates
     *                                       to false, then the pOptions.id
     *                                       will be used
     * @param  {string}  pOptions.label      The text for the group's label
     * @param  {string}  pOptions.inputType  Either CHECKBOX (By default) or 
     *                                       RADIO to render all the inputs as
     *                                       either one of the controls
     * @param  {boolean}  pOptions.showInput  Whether to show the checkbox or
     *                                        radio controls in the input
     *                                        (false by default)
     * @return An object containing the field, the label and the inputs
     *         container as jQuery objects
     */
    md.Editor.createCheckboxradioInputGroup = function( pOptions ){
        var lLabel$ = $( '<label></label>' )
                .addClass( 't-Form-label' )
                .text( pOptions.label ),
            lLabelContainer$ = $( '<div></div>' )
                .addClass( 't-Form-labelContainer col col-null' )
                .append( lLabel$ ),
            lInputsContainer$ = $( '<div></div>' )
                .addClass( 't-Form-inputContainer col col-null' ),
            lFieldContainer$ = $( '<div></div>' )
                .addClass( 't-Form-fieldContainer rel-col t-Form-fieldContainer--stretchInputs lto46434665622631032_0 apex-item-wrapper apex-item-wrapper--text-field' )
                .append( lLabelContainer$ )
                .append( lInputsContainer$ );

        if ( pOptions.id ){
            lFieldContainer$.attr( "id", pOptions.id );
        }

        pOptions.inputsOptions.forEach( function( pCurrentValue, pIndex, pArray ){
            var lInputLabel$ = $( '<label></label>' )
                    .addClass( 't-Form-label' )
                    .attr( 'for', pCurrentValue.id )
                    .text( pCurrentValue.label )
                    .appendTo( lInputsContainer$ ),
                lInput$ = $( '<input />' )
                    .addClass( 'checkboxradio_field' )
                    .attr({
                        type: (
                            ( 'inputType' in pOptions ) &&
                            pOptions.inputType == 'RADIO' ?
                                'radio'
                            :
                                'checkbox'
                        ),
                        id: pCurrentValue.id,
                        // The name if not empty/zero/null/undefined or the ID
                        name: pCurrentValue.name || pOptions.name || pOptions.id || pCurrentValue.id,
                        value: pCurrentValue.value
                    })
                    .prop( 'checked', !!pCurrentValue.checked )
                    .appendTo( lInputsContainer$ );
        } );

        return {
            field: lFieldContainer$,
            label: lLabel$,
            input: lInputsContainer$
        };
    };

    md.Renderer = {};
    md.Renderer.initialize = function() {
        // Rendering data-markdown = true elements
        md.render( '[data-markdown="true"]' );

        // Create an observer instance
        var lObserver = new MutationObserver( function( pMutations ) {
            pMutations.forEach( function( pMutation ) {
                var lAddedElements$ = $( pMutation.addedNodes ),
                    lTarget$;

                // If there are new nodes added
                if( lAddedElements$.length !== 0 ) {
                    lAddedElements$.each( function() {
                        var lElement$ = $( this );

                        if( lElement$.data( 'markdown' ) === true ) {
                            md.render( lElement$ );
                        } else {
                            md.render( lElement$.find( '*[data-markdown="true"]:not( .' + md.C_RENDERED_CLASS + ' )' ) );
                        }
                    });
                }

                if( pMutation.type === "attributes" ){
                    lTarget$ = $( pMutation.target );

                    if( lTarget$.data( 'markdown' ) === true ){
                        md.render( lTarget$ );
                    }
                }
          });
        });

        // Pass in the target node, as well as the observer options
        lObserver.observe(
            $('body').get(0),
            {
                attributes: true,
                // If these attributes change on a element then we monitor them
                attributeFilter: [ 'data-markdown', 'class' ],
                childList: true,
                characterData: false,
                subtree: true
            }
        );
    };
})( apex.jQuery, CodeMirror, apex.markdown );
