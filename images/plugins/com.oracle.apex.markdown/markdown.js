/* BEGIN #2417_00071 */
// Moved code from markdownEditor.js to here
/*
 * markdown.js
 **/
/*global apex*/
/*
 * depends on:
 *    markedjs.js
 **/
apex.markdown = {};

(function( markdown, $){
    /**
     * Library version
     */
    markdown.version = "4.3.1";

    /**
     * The class name that will be assigned to the elements that were already
     * rendered so we don't re-render them again
     */
    markdown.C_RENDERED_CLASS = 'is-markdownified';
    /**
     * The name of the event that will be triggered once elements have been
     * rendered
     */
    markdown.C_EVENT_NAME = 'markdownified';

    /**
     * A constant for the "Basic" HTML Escape Mode. In this mode, HTML escaping
     * will make the following replacements:
     * 
     * & to &amp;
     * " to &quot:
     * < to &lt;
     * > to &gt;
     */
    markdown.C_BASIC_HTML_ESCAPE_MODE = 'B';
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
    markdown.C_EXTENDED_HTML_ESCAPE_MODE = 'E';

    /**
     * The default white-listed HTML tags
     */
    markdown.C_HTML_TAGS_WHITELIST = [
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

    // Changed the default escape mode to basic so that code blocks in other
    // languages don't have escaped single quotes
    /**
     * The default HTML escape mode
     */
    markdown.htmlEscapeMode = markdown.C_BASIC_HTML_ESCAPE_MODE;

    /**
     * The default Markdown parser options
     */
    markdown.parserOptions = {
        escapeInputHtml: true,
        htmlEscapeMode: markdown.htmlEscapeMode,
        htmlTagsWhitelisting: {
            enabled: false,
            allowAttributes: false,
            // Leaving this empty by default as it will be overriden by the
            // whitelist attribute of the plugin
            //whitelist: markdown.C_HTML_TAGS_WHITELIST
            whitelist: []
        },
        markedOptions: {
            gfm: true,
            breaks: true
        }
    };
    /**
     * Default Markdown source options
     */
    markdown.sourceOptions = {
        // By default element's innerHTML should be parsed
        parseText: false
    };
    /**
     * Default Markdown renderer options
     */
    markdown.rendererOptions = {
        // Highlight code blocks by default
        highlightFencedCodeBlocks: true
    };

    /**
     * Escape the input HTML passed using the "Basic" escape mode
     *
     * @param   {string}  pHtml  The input HTML to be escaped
     * @return  {string}  The escaped HTML
     */
    markdown.escapeHtmlBasic = function( pHtml ){
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
    markdown.escapeHtmlExtended = function( pHtml ){
        var lResult = markdown.escapeHtmlBasic( pHtml )
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
    markdown.escapeHtml = function( pHtml, pHtmlEscapeMode ){
        if ( pHtmlEscapeMode === undefined ) {
            pHtmlEscapeMode = markdown.htmlEscapeMode;
        }

        var lResult;

        switch(pHtmlEscapeMode) {
            case markdown.C_BASIC_HTML_ESCAPE_MODE:
                lResult = markdown.escapeHtmlBasic( pHtml );
                break;
            case markdown.C_EXTENDED_HTML_ESCAPE_MODE:
                lResult = markdown.escapeHtmlExtended( pHtml );
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
    markdown.escapeWithHtmlTagsWhitelist = function( pHtml, pOptions ){
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
             *              markdown.C_HTML_TAGS_WHITELIST
             *          )
             *       )
             */
            pOptions = $.extend(
                {},
                // Set some defaults for the options
                {
                    htmlTagsWhitelist: markdown.C_HTML_TAGS_WHITELIST,
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
                pOptions.htmlTagsWhitelist = markdown.C_HTML_TAGS_WHITELIST;
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

        lResult = markdown.escapeHtml(
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
    markdown.parse = function( pMarkdown, pParserOptions ){
        // Complement the defaults with the passed options
        pParserOptions = jQuery.extend( true, {}, markdown.parserOptions, pParserOptions );

        // Pre-escaping hook
        if ( ( 'preEscapingFunction' in pParserOptions ) &&
            typeof( pParserOptions.preEscapingFunction ) === 'function' ){
            pMarkdown = pParserOptions.preEscapingFunction.apply(undefined, [ pMarkdown ]);
        }

        if ( pParserOptions.escapeInputHtml === true ){
            if ( pParserOptions.htmlTagsWhitelisting.enabled === true ){
                pMarkdown = markdown.escapeWithHtmlTagsWhitelist(
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
                pMarkdown = markdown.escapeHtml( pMarkdown, pParserOptions.htmlEscapeMode );
            }
        }

        // Pre-parsing hook
        if ( ( 'preParsingFunction' in pParserOptions ) &&
            typeof( pParserOptions.preParsingFunction ) === 'function' ){
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
    markdown.highlightFencedCodeBlocks = function( pRenderedElements$ ){
        // Only perform operations when CodeMirror is defined, this makes the
        // dependency optional
        if ( window.CodeMirror ){
            var CM = window.CodeMirror,
                // The rendered elements here have to contain the 
                // C_RENDERED_CLASS, so we filter them before processing
                lElements$ = $( pRenderedElements$ )
                    .filter( '.' + markdown.C_RENDERED_CLASS );

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
        // If CodeMirror is not available
        } else {
            // Inform the user
            console.warn(
                'apex.markdown: Code blocks will not be highlighted because CodeMirror is not available, either disable the code block syntax highlighting or import CodeMirror'
            );
        }
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
    markdown.render = function ( pElements, pParserOptions, pSourceOptions, pRendererOptions ) {
        var lElements$;

        lElements$ = $( pElements )
            // Filter only to those elements which don't have a
            // data-markdown attribute or to those whose data-markdown
            // attribute is set to true
            .filter( ':not([data-markdown]), [data-markdown="true"]' )
            // Filter-out all of the elements that are already markdownified
            // This will render only those elements which are not already rendered
            .filter( ':not( .' + markdown.C_RENDERED_CLASS +' )' );

        // Traverse the rest of the elements
        lElements$.each(function(){
            // Save the current element as jQuery in a variable
            var lElement$ = $( this ),
                lElementData = lElement$.data(),
                lDataParserOptions = {},
                lDataSourceOptions = {},
                lDataRendererOptions = {},
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
                            lDataParserOptions.htmlEscapeMode = markdown.C_BASIC_HTML_ESCAPE_MODE;
                            break;
                        case 'extended':
                            lDataParserOptions.htmlEscapeMode = markdown.C_EXTENDED_HTML_ESCAPE_MODE;
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
                // Commenting this out, I'm not sure about how to handle this,
                // eval was an initial idea but will wait for review
                /*
                // data-markdown-pre-escaping-function
                // A function to execute to replace the markdown text before
                // escaping it
                if ( 'markdownPreEscapingFunction' in lElementData ){
                    if( lElementData.markdownPreEscapingFunction ){
                        // TODO: Review the security of this
                        lDataParserOptions.preEscapingFunction = eval( lElementData.markdownPreEscapingFunction );
                    }
                }
                // data-markdown-pre-parsing-function
                // A function to execute to replace the markdown text before
                // parsing it
                if ( 'markdownPreParsingFunction' in lElementData ){
                    if( lElementData.markdownPreParsingFunction ){
                        // TODO: Review the security of this
                        lDataParserOptions.preParsingFunction = eval( lElementData.markdownPreParsingFunction );
                    }
                }
                */
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
            }

            /* BEGIN #2417_00091 RENDERING ESCAPING BUG */
            // Added the default options in here so they don't override the
            // options contained in the data
            // Set the parser options to the data options and override settings
            // with the parameter options
            $.extend( true, lParserOptions, markdown.parserOptions, lDataParserOptions, pParserOptions );
            // Set the source options to the data options and override settings
            // with the parameter options
            $.extend( true, lSourceOptions, markdown.sourceOptions, lDataSourceOptions, pSourceOptions );
            // Set the renderer options to the data options and override settings
            // with the parameter options
            $.extend( true, lRendererOptions, markdown.rendererOptions, lDataRendererOptions, pRendererOptions );
            /* END #2417_00091 RENDERING ESCAPING BUG */

            // Assign the HTML of the element to either the innerHTML or text
            // depending on the parseText source option
            lElement$.html(
                // Obtain the full text or html that the element contains and
                // transform it into HTML using the markdown parser
                markdown.parse(
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
            ).addClass( markdown.C_RENDERED_CLASS );

            if (
                ( 'highlightFencedCodeBlocks' in lRendererOptions ) &&
                lRendererOptions.highlightFencedCodeBlocks
            ){
                markdown.highlightFencedCodeBlocks( lElement$ );
            }

            // Trigger an event once the element has been rendered
            $( document ).trigger( markdown.C_EVENT_NAME, lElement$.get(0) );
        });
    };

    markdown.Renderer = {};
    markdown.Renderer.initialize = function() {
        // Rendering data-markdown = true elements
        /* BEGIN #2417_00091 RENDERING ESCAPING BUG */
        // Removed the defaults from here as they were overriding the data
        // options
        markdown.render( '[data-markdown="true"]' );
        /* END #2417_00091 RENDERING ESCAPING BUG */

        // Create an observer instance
        var lObserver = new MutationObserver( function( pMutations ) {
            pMutations.forEach( function( pMutation ) {
                var lAddedElements$ = $( pMutation.addedNodes ),
                    lTarget$;

                // If there are new nodes added
                if( lAddedElements$.length !== 0 ) {
                    lAddedElements$.each( function() {
                        var lElement$ = $( this );

                        // If the element has data-markdown="true"
                        if( lElement$.data( 'markdown' ) === true ) {
                            /* BEGIN #2417_00091 RENDERING ESCAPING BUG */
                            // Removed the defaults from here as they were overriding the data
                            // options
                            // Rendering data-markdown = true elements
                            markdown.render( lElement$ );
                            /* END #2417_00091 RENDERING ESCAPING BUG */
                        // If the element doesn't have a data-markdown attribute
                        } else if ( lElement$.data( 'markdown' ) === undefined ) {
                            /* BEGIN #2417_00091 RENDERING ESCAPING BUG */
                            // Removed the defaults from here as they were overriding the data
                            // options
                            // Render all of the elements inside of it that do
                            // have the data-markdown="true" attribute
                            markdown.render(
                                lElement$.find( '*[data-markdown="true"]:not( .' + markdown.C_RENDERED_CLASS + ' )' )
                            );
                            /* END #2417_00091 RENDERING ESCAPING BUG */
                        }
                    });
                }

                // Note we're only monitoring data-markdown and class attributes
                if( pMutation.type === "attributes" ){
                    lTarget$ = $( pMutation.target );

                    // If the element has data-markdown="true" attribute
                    if( lTarget$.data( 'markdown' ) === true ){
                        /* BEGIN #2417_00091 RENDERING ESCAPING BUG */
                        // Removed the defaults from here as they were overriding the data
                        // options
                        markdown.render( lTarget$ );
                        /* END #2417_00091 RENDERING ESCAPING BUG */
                    // Note that in this case we will not render inner elements
                    // of the mutated target because this is an attribute
                    // mutation and therefore the target should have had or be
                    // added the data-markdown attribute in the first place
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
})( apex.markdown, apex.jQuery);
/* END #2417_00071 */
