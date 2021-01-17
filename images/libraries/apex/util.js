/*!
 Copyright (c) 2012, 2020 Oracle and/or its affiliates. All rights reserved.
*/
/*global apex,$v,apex_img_dir*/
/**
 * <p>The apex.util namespace contains general utility functions of Oracle Application Express.</p>
 *
 * @namespace
 */
apex.util = (function( $, debug ) {
    "use strict";

    const SUBST_RE = /&(([A-Z0-9_$#]+(?:%[A-Za-z0-9_]+)?)|"([^"&\r\n]+)")(!([A-Z]+))?\./g, // &item[!format]. or &"quoted-item"[!format] capture the item, quoted-item, and format.
        PROP_SUFFIX_RE = /%([A-Za-z0-9_]+)$/; // convention for pseudo property access name%prop


    function escapeRegExp( pValue ) {
        if ( typeof pValue === "string" ) {
            return pValue.replace(/([.$*+\-?(){}|^\[\]\\])/g,'\\$1');
        } // else
        return "";
    } // escapeRegExp

    function escapeHTML( pValue ) {
        return pValue.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;")
            .replace(/\//g, "&#x2F;");
    } // escapeHTML

    // for now escaping attributes and content is handled the same
    var escapeHTMLAttr = function( s ) {
            s = "" + s; // make sure s is a string
            return escapeHTML( s );
        },
        escapeHTMLContent = escapeHTMLAttr;

    var
        /*
         *CSS meta-characters (based on list at http://api.jquery.com/category/selectors/)
         *Define a closure to just do the escaping once
         */
        CSS_META_CHARS_REGEXP = new RegExp( "([" + escapeRegExp( " !#$%&'()*+,./:;<=>?@[\\]^`{|}~" + '"' ) + "])", "g" ),
        gScrollbarSize = null,
        /*
         * Cache the top most APEX object. The top most APEX object is
         * the one in the window object closest to the top that we have access to.
         */
        gTopApex = null,
        gPageTemplateData = null,
        /*
         * Global list of templates used by applyTemplates
         */
        gTemplates = {};

    var isArray = $.isArray,
        gWatchConditionIndex = 1,
        gConditionOps = {
            // returns true if any of the v1 values are equal to v2
            "eq": function( v1, v2 )  {
                var i;
                if ( isArray( v1 ) ) {
                    for (i = 0; i < v1.length; i++) {
                        if ( v1[i] === v2 ) {
                            return true;
                        }
                    }
                    return false;
                } //  else
                return v1 === v2;
            },
            // returns true if none of the v1 values are equal to v2 (all of the v1 values are not equal to v2)
            "neq": function( v1, v2 ) {
                return !gConditionOps.eq( v1, v2 );
            },
            // returns true if the v1 is null, empty string, or an empty array
            "null": function( v1 ) {
                return v1 === null || v1 === "" || (isArray(v1) && v1.length === 0);
            },
            // returns true if v1 is not null and not empty string and not empty array
            "notnull": function( v1 ) {
                return !gConditionOps.null( v1 );
            },
            // returns true if any of the v1 values are in the comma separated list in v2
            "in": function( v1, v2 ) {
                var i;
                if ( typeof v2 === "string" ) {
                    v2 = "," + v2 + ",";
                } else {
                    return false; // v2 must be a string
                }
                if ( isArray( v1 ) ) {
                    for (i = 0; i < v1.length; i++) {
                        if ( v2.indexOf( "," + v1[i] + "," ) >= 0 ) {
                            return true;
                        }
                    }
                    return false;
                } //  else
                return v2.indexOf( "," + v1 + "," ) >= 0;
            },
            // returns true if none of the v1 values are in the comma separated list in v2 (all of the v1 values are not in the comma separated list in v2)
            "notin": function( v1, v2 ) {
                return !gConditionOps.in( v1, v2 );
            }
            /* todo Consider
            "gt" returns true if the item is scalar and greater than value
            "gte" returns true if the item is scalar and greater than or equal to value
            "lt" returns true if the item is scalar and less than value
            "lte" returns true if the item is scalar and less than or equal to value
            "between"
            */
        };

    /*
     * todo think should this be smarter about numeric attribute values?
     * todo consider an attrs method that takes a plain object
     */
    /**
     * <p>The htmlBuilder interface is used create HTML markup. It makes it easy to generate markup that is
     * well formed and properly escaped. It is simpler and safer than using string concatenation and doesn't
     * require the overhead of using a template library. For simple templates see {@link apex.util.applyTemplate}</p>
     *
     * @interface htmlBuilder
     * @example <caption>This example creates an HTML string consisting of a label and text input and inserts it
     *     into the DOM. Data to be mixed into the markup is in an options object. The options values will be
     *     properly escaped to avoid cross site scripting security issues. With an options object
     *     <code class="prettyprint">{ id: "nameInput", label: "Name", size: 10, maxChars: 15 }</code>
     *     the resulting markup will be:<br>
     *     <code>&lt;label for='nameInput'>Name&lt;/label>&lt;input type='text' id='nameInput' class='specialInput' size='10' maxlength='15' value='' /></code></caption>
     * var out = apex.util.htmlBuilder();
     * out.markup( "<label" )
     *     .attr( "for", options.id )
     *     .markup( ">" )
     *     .content( option.label )
     *     .markup( "</label><input type='text'" )
     *     .attr( "id", options.id )
     *     .attr( "class", "specialInput" )
     *     .optionalAttr( "title", options.title )
     *     .attr( "size", options.size )
     *     .attr( "maxlength",  options.maxChars )
     *     .attr( "value", "" )
     *     .markup( " />" );
     * $( "#myContainer", out.toString() );
     */
    /**
     * @lends htmlBuilder.prototype
     */
    var htmlBuilderPrototype = {
        /**
         * <p>Add markup.</p>
         * @param {string} pMarkup The markup to add. No escaping is done.
         * @return {this} This htmlBuilder instance for method chaining.
         */
        markup: function( pMarkup ) {
            this.html += pMarkup;
            return this;
        },
        /**
         * <p>Add an attribute.<p>
         * @param {string} [pName] Attribute name. A leading space and trailing = is added and the value is quoted.
         *     If not given just the value is added without being quoted.
         * @param {string} pValue Attribute value. This will be escaped.
         * @return {this} This htmlBuilder instance for method chaining.
         */
        attr: function( pName, pValue ) {
            if (arguments.length === 1) { // name is optional
                pValue = pName;
                pName = null;
            }
            if (pName) {
                this.html += " " + pName + "='";
            }
            this.html += escapeHTMLAttr(pValue);
            if (pName) {
                this.html += "'";
            }
            return this;
        },
        /**
         * <p>Add an optional attribute. The attribute and its value is only added if the value is a non-empty
         * string or a non-zero number or true.</p>
         * @param {string} pName Attribute name. A leading space and trailing = is added and the value is quoted.
         * @param {string} pValue Attribute value. This will be escaped.
         * @return {this} This htmlBuilder instance for method chaining.
         */
        optionalAttr: function( pName, pValue ) {
            if (pValue && typeof pValue !== "object") {
                this.html += " " + pName + "='" + escapeHTMLAttr(pValue) + "'";
            }
            return this;
        },
        /**
         * <p>Add an optional Boolean attribute. The attribute is added only if the value is true.</p>
         * @param {string} pName Attribute name. A leading space is added.
         * @param {boolean} pValue If true the attribute is added. If false the attribute is not added.
         * @return {this} This htmlBuilder instance for method chaining.
         */
        optionalBoolAttr: function( pName, pValue ) {
            // must be boolean and must be true - not just truthy
            if (pValue === true) {
                this.html += " " + pName;
            }
            return this;
        },
        /**
         * <p>Add element content. The content is escaped.<p>
         * @param {string} pContent The content to add between an element open and closing tags.
         * @return {this} This htmlBuilder instance for method chaining.
         */
        content: function( pContent ) {
            this.html += escapeHTMLContent(pContent);
            return this;
        },
        /**
         * <p>Remove all markup from this builder interface instance. Use this when you want to reuse the builder
         * instance for new markup.</p>
         */
        clear: function() {
            this.html = "";
        },
        /**
         * <p>Return the HTML markup.</p>
         * @return {string} The markup that has been built so far.
         */
        toString: function() {
            return this.html;
        }
    };

    /**
     * @lends apex.util
     */
    var util = {

    /**
     * <p>Returns a new function that calls <code class="prettyprint">pFunction</code> but not until
     * <code class="prettyprint">pDelay</code> milliseconds after the last time the returned function is called.</p>
     *
     * @param {function} pFunction The function to call.
     * @param {number} pDelay The time to wait before calling the function in milliseconds.
     * @return {function} The debounced version of <code class="prettyprint">pFunction</code>.
     * @example <caption>This example calls the function formatValue in response to the user typing characters but only
     * after the user pauses typing. In a case like this formatValue would also be called from the blur event on the same item.</caption>
     * function formatValue() {
     *     var value = $v("P1_PHONE_NUMBER");
     *     // code to format value as a phone number
     *     $s("P1_PHONE_NUMBER_DISPLAY", value);
     * }
     * apex.jQuery( "#P1_PHONE_NUMBER" ).on( "keypress", apex.util.debounce( formatValue, 100 ) );
     */
    debounce: function( pFunction, pDelay ) {
        var timer;
        return function() {
            var args = arguments,
                context = this;

            clearTimeout( timer );
            timer = setTimeout( function() {
                timer = null;
                pFunction.apply( context, args );
            }, pDelay );
        };
    }, // debounce

    // todo consider if it would be nice if a = [1,2,3]; a === apex.util.toArray(a) // nice if true but currently not
    /**
     * <p>Function that returns an array based on the value passed in <code class="prettyprint">pValue</code>.</p>
     *
     * @param {string|*} pValue If this is a string, then the string will be split into an array using the
     *                          <code class="prettyprint">pSeparator</code> parameter.
     *                          If it's not a string, then we try to convert the value with
     *                          <code class="prettyprint">apex.jQuery.makeArray</code> to an array.
     * @param {string} [pSeparator=":"] Separator used to split a string passed in <code class="prettyprint">pValue</code>,
     *   defaults to colon if not specified. Only needed when <code class="prettyprint">pValue</code> is a string.
     *   It is ignored otherwise.
     * @return {Array}
     *
     * @example <caption>This example splits the string into an array with 3 items:
     * <code class="prettyprint">["Bags","Shoes","Shirts"]</code>.</caption>
     * lProducts = apex.util.toArray( "Bags:Shoes:Shirts" );
     * @example <caption>This example splits the string into an array just like in the previous example. The only
     * difference is the separator character is ",".</caption>
     * lProducts = apex.util.toArray( "Bags,Shoes,Shirts", "," );
     * @example <caption>This example returns the jQuery object as an array.</caption>
     * lTextFields = apex.util.toArray( jQuery("input[type=text]") );
     */
    toArray: function( pValue, pSeparator ) {
        var lSeparator,
            lReturn = [];

        // If pValue is a string, we have to split the string with the separator
        if ( typeof pValue === "string" ) {

            // Default separator to a colon, if not supplied
            if ( pSeparator === undefined ) {
                lSeparator = ":";
            } else {
                lSeparator = pSeparator;
            }

            // Split into an array, using the defined separator
            lReturn = pValue.split( lSeparator );

            // If it's not a string, we try to convert pValue to an array and return it
        } else {
            lReturn = $.makeArray( pValue );
        }
        return lReturn;
    }, // toArray

    /**
     * <p>Compare two arrays and return true if they have the same number of elements and
     * each element of the arrays is strictly equal to each other. Returns false otherwise.
     * This is a shallow comparison.</p>
     *
     * @param {Array} pArray1 The first array.
     * @param {Array} pArray2 The second array.
     * @return {boolean} true if a shallow comparison of the array items are equal
     * @example <caption>This example returns true.</caption>
     * apex.util.arrayEqual( [1,"two",3], [1, "two", 3] );
     * @example <caption>This example returns false.</caption>
     * apex.util.arrayEqual( [1,"two",3], [1, "two", "3"] );
     */
    arrayEqual: function(pArray1, pArray2) {
        var i,
            len = pArray1.length;
        if ( len !== pArray2.length ) {
            return false;
        }
        for ( i = 0; i < len; i++ ) {
            if (pArray1[i] !== pArray2[i] ) {
                return false;
            }
        }
        return true;
    }, // arrayEqual

    /**
     * <p>Returns string <code class="prettyprint">pValue</code> with any special HTML characters (&<>"'/)
     * escaped to prevent cross site scripting (XSS) attacks.
     * It provides the same functionality as <code class="prettyprint">sys.htf.escape_sc</code> in PL/SQL.</p>
     *
     * <p>This function should always be used when inserting untrusted data into the DOM.</p>
     *
     * @function
     * @param {string} pValue The string that may contain HTML characters to be escaped.
     * @return {string} The escaped string.
     *
     * @example <caption>This example appends text to a DOM element where the text comes from a page item called
     *     P1_UNTRUSTED_NAME. Data entered by the user cannot be trusted to not contain malicious markup.</caption>
     * apex.jQuery( "#show_user" ).append( apex.util.escapeHTML( $v("P1_UNTRUSTED_NAME") ) );
     */
    escapeHTML: escapeHTML,

    /**
     * Function that returns a string where Regular Expression special characters (\.^$*+-?()[]{}|) are escaped which can
     * change the context in a regular expression. It has to be used to secure user input.
     *
     * @ignore
     * @param {string} pValue   String which should be escaped.
     * @return {string} The escaped string, or an empty string if pValue is null or undefined
     *
     * @example
     * searchValue = new RegExp( "^[-!]?" + apex.util.escapeRegExp( pInputText ) + "$" );
     *
     * @function escapeRegExp
     */
    escapeRegExp:  escapeRegExp,

    /**
     * <p>Returns string <code class="prettyprint">pValue</code> with any CSS meta-characters escaped.
     * Use this function when the value is used in a CSS selector.
     * Whenever possible if a value is going to be used as a selector, constrain the value so
     * that it cannot contain CSS meta-characters making it unnecessary to use this function.</p>
     *
     * @param {string} pValue The string that may contain CSS meta-characters to be escaped.
     * @return {string} The escaped string, or an empty string if pValue is null or undefined.
     * @example <caption>This example escapes an element id that contains a (.) period character so that it finds the
     *     element with id = "my.id". Without using this function the selector would have a completely
     *     different meaning.</caption>
     * apex.jQuery( "#" + apex.util.escapeCSS( "my.id" ) );
     */
    escapeCSS: function( pValue ) {
        var lReturn = "";
        if ( pValue ) {
            // Escape any meta-characters (based on list at http://api.jquery.com/category/selectors/)
            return pValue.replace( CSS_META_CHARS_REGEXP, "\\$1" );
        }
        return lReturn;
    }, // escapeCSS

    /**
     * <p>Return an {@link htmlBuilder} interface.</p>
     * @return {htmlBuilder}
     */
    htmlBuilder: function() {
        var that = Object.create( htmlBuilderPrototype );
        that.clear();
        return that;
    },

    // todo consider adding to doc needs unit tests
    /**
     * Creates a URL to an APEX application page from properties given in pArgs and information on the current page
     * pArgs is an object containing any of the following optional properties
     * - appId the application id (flow id). If undefined or falsey the value is taken from the current page
     * - pageId the page id (flow step id). If undefined or falsey the value is taken from the current page
     * - session the session (instance). If undefined or falsey the value is taken from the current page
     * - request a request string used for button processing. If undefined or falsey the value is taken from the current page
     * - debug YES, NO, LEVEL<n> sets the debug level. If undefined or falsey the value is taken from the current page
     * - clearCache a comma separated list of pages RP, APP, SESSION. The default is empty string
     * - itemNames an array of item names to set in session state
     * - itemValues an array of values corresponding to each item name in the itemNames array.
     * - todo consider a map alternative for items
     * - printerFriendly Yes or empty string. Default is empty string.
     *
     * @ignore
     * @param {object} pArgs
     * @return {string}
     */
    makeApplicationUrl: function ( pArgs ) {
        var i,
            lUrl = "f?p=";

        lUrl += pArgs.appId || $v( "pFlowId" );
        lUrl += ":";
        lUrl += pArgs.pageId || $v( "pFlowStepId" );
        lUrl += ":";
        lUrl += pArgs.session || $v( "pInstance" );
        lUrl += ":";
        lUrl += pArgs.request || $v( "pRequest" );
        lUrl += ":";
        lUrl += pArgs.debug || $v( "pdebug" ) || "";
        lUrl += ":";
        lUrl += pArgs.clearCache || "";
        lUrl += ":";
        if ( pArgs.itemNames ) {
            lUrl += pArgs.itemNames.join( "," );
        }
        lUrl += ":";
        if (pArgs.itemValues) {
            for ( i = 0; i < pArgs.itemValues.length; i++ ) {
                if ( i > 0 ) {
                    lUrl += ",";
                }
                lUrl += encodeURIComponent( pArgs.itemValues[ i ] );
            }
        }
        lUrl += ":";
        lUrl += pArgs.printerFriendly || "";

        return lUrl;
    },

    // todo need unit tests
    /**
     * Function that renders a spinning alert to show the user that processing is taking place. Note that the alert is
     * defined as an ARIA alert so that assistive technologies such as screen readers are alerted to the processing status.</p>
     *
     * @param {string|jQuery|Element} [pContainer] Optional jQuery selector, jQuery, or DOM element identifying the
     *     container within which you want to center the spinner. If not passed, the spinner will be centered on
     *     the whole page. The default is $("body").
     * @param {Object} [pOptions] Optional object with the following properties:
     * @param {string} [pOptions.alert] Alert text visually hidden, but available to Assistive Technologies.
     *     Defaults to "Processing".
     * @param {string} [pOptions.spinnerClass] Adds a custom class to the outer SPAN for custom styling.
     * @param {boolean} [pOptions.fixed] if true the spinner will be fixed and will not scroll.
     * @return {jQuery} A jQuery object for the spinner. Use the jQuery remove method when processing is complete.
     * @example <caption>To show the spinner when processing starts.</caption>
     * var lSpinner$ = apex.util.showSpinner( $( "#container_id" ) );
     * @example <caption>To remove the spinner when processing ends.</caption>
     * lSpinner$.remove();
     */
    showSpinner: function( pContainer, pOptions ) {
        var lSpinner$, lLeft, lTop, lBottom, lYPosition, lYOffset,
            out         = util.htmlBuilder(),
            lOptions    = $.extend ({
                alert:          apex.lang.getMessage( "APEX.PROCESSING" ),
                spinnerClass:    ""
            }, pOptions ),
            lContainer$ = ( pContainer && !lOptions.fixed ) ? $( pContainer ) : $( "body" ),
            lWindow$    = $( window ),
            lContainer  = lContainer$.offset(),
            lViewport   = {
                top:  lWindow$.scrollTop(),
                left: lWindow$.scrollLeft()
            };

        // The spinner markup
        out.markup( "<span" )
            .attr( "class", "u-Processing" + ( lOptions.spinnerClass ? " " + lOptions.spinnerClass : "" ) )
            .attr( "role", "alert" )
            .markup( ">" )
            .markup( "<span" )
            .attr( "class", "u-Processing-spinner" )
            .markup( ">" )
            .markup( "</span>" )
            .markup( "<span" )
            .attr( "class", "u-VisuallyHidden" )
            .markup( ">" )
            .content( lOptions.alert )
            .markup( "</span>" )
            .markup( "</span>" );

        // And render and position the spinner and overlay
        lSpinner$ = $( out.toString() );
        lSpinner$.appendTo( lContainer$ );

        if ( lOptions.fixed ) {
            lTop = ( lWindow$.height() - lSpinner$.height() ) / 2;
            lLeft = ( lWindow$.width() - lSpinner$.width() ) / 2;
            lSpinner$.css( {
                position: "fixed",
                top:  lTop + "px",
                left: lLeft +  "px"
            } );
        } else {
            // Calculate viewport bottom and right
            lViewport.bottom = lViewport.top + lWindow$.height();
            lViewport.right = lViewport.left + lWindow$.width();

            // Calculate container bottom and right
            lContainer.bottom = lContainer.top + lContainer$.outerHeight();
            lContainer.right = lContainer.left + lContainer$.outerWidth();

            // If top of container is visible, use that as the top, otherwise use viewport top
            if ( lContainer.top > lViewport.top ) {
                lTop = lContainer.top;
            } else {
                lTop = lViewport.top;
            }

            // If bottom of container is visible, use that as the bottom, otherwise use viewport bottom
            if ( lContainer.bottom < lViewport.bottom ) {
                lBottom = lContainer.bottom;
            } else {
                lBottom = lViewport.bottom;
            }
            lYPosition = ( lBottom - lTop ) / 2;

            // If top of container is not visible, Y position needs to add an offset equal hidden container height,
            // this is required because we are positioning in the container element
            lYOffset = lViewport.top - lContainer.top;
            if ( lYOffset > 0 ) {
                lYPosition = lYPosition + lYOffset;
            }

            lSpinner$.position({
                my:         "center",
                at:         "left+50% top+" + lYPosition + "px",
                of:         lContainer$,
                collision:  "fit"
            });
        }

        return lSpinner$;
    },

    /**
     * <p>The delayLinger namespace solves the problem of flashing progress indicators (such as spinners).</p>
     *
     * <p>For processes such as an Ajax request (and subsequent user interface updates) that may take a while
     * it is important to let the user know that something is happening.
     * The problem is that if an async process is quick there is no need for a progress indicator. The user
     * experiences the UI update as instantaneous. Showing and hiding a progress indicator around an async
     * process that lasts a very short time causes a flash of content that the user may not have time to fully perceive.
     * At best this can be a distraction and at worse the user wonders if something is wrong or if they missed something
     * important. Simply delaying the progress indicator doesn't solve the problem because the process
     * could finish a short time after the indicator is shown. The indicator must be shown for at least a short but
     * perceivable amount of time even if the request is already finished.</p>
     *
     * <p>You can use this namespace to help manage the duration of a progress indication such as
     * {@link apex.util.showSpinner} or with any other progress implementation. Many of the Oracle
     * Application Express asynchronous functions such as the ones in the {@link apex.server} namespace
     * already use delayLinger internally so you only need this API for your own custom long running
     * asynchronous processing.</p>
     *
     * @namespace apex.util.delayLinger
     * @example <caption>This example shows using {@link apex.util.delayLinger.start} and
     *     {@link apex.util.delayLinger.finish} along with {@link apex.util.showSpinner} to show a
     *     progress spinner, only when needed and for long enough to be seen, around a long running asynchronus process
     *     started in function doLongProcess.</caption>
     * var lSpinner$, lPromise;
     * lPromise = doLongProcess();
     * apex.util.delayLinger.start( "main", function() {
     *     lSpinner$ = apex.util.showSpinner( $( "#container_id" ) );
     * } );
     * lPromise.always( function() {
     *     apex.util.delayLinger.finish( "main", function() {
     *         lSpinner$.remove();
     *     } );
     * } );
     */
    delayLinger: (function() {
        var scopes = {},
            busyDelay = 200,
            busyLinger = 1000; // visible for min 800ms

        function getScope( scopeName ) {
            var s = scopes[scopeName];
            if ( !s ) {
                s = {
                    count: 0,
                    timer: null
                };
                scopes[scopeName] = s;
            }
            return s;
        }

        function removeScope( scopeName ) {
            delete scopes[scopeName];
        }

        /**
         * @lends apex.util.delayLinger
         */
        var ns = {
            /**
             * <p>Call this function when a potentially long running async process starts. For each call to start with
             * a given pScopeName a corresponding call to finish with the same <code class="prettyprint">pScopeName</code> must be made.
             * Calls with different <code class="prettyprint">pScopeName</code> arguments will not interfere with each other.</p>
             *
             * <p>Multiple calls to start for the same <code class="prettyprint">pScopeName</code> before any calls to
             * finish is allowed but only the <code class="prettyprint">pAction</code> from the first call is called at most once.</p>
             *
             * @param {string} pScopeName A unique name for each unique progress indicator.
             * @param {function} pAction A no argument function to call to display the progress indicator.
             *     This function may or may not be called depending on how quickly finish is called.
             */
            start: function( pScopeName, pAction ) {
                var s = getScope( pScopeName );
                s.count += 1;
                if ( s.count === 1 && s.timer === null && !s.showing ) {
                    s.start = (new Date()).getTime();
                    s.timer = setTimeout( () => {
                        s.timer = null;
                        s.showing = true;
                        pAction();
                    }, busyDelay );
                }
            },

            /**
             * <p>Call this function when the potentially long running async process finishes. For each call to start with
             * a given <code class="prettyprint">pScopeName</code> a corresponding call to finish with
             * the same <code class="prettyprint">pScopeName</code> must be made.
             * The <code class="prettyprint">pAction</code> is called exactly once if and only if the corresponding
             * start <code class="prettyprint">pAction</code> was called.
             * If there are multiple calls to finish the <code class="prettyprint">pAction</code> from the last one is called.</p>
             *
             * @param {string} pScopeName A unique name for each unique progress indicator.
             * @param {function} pAction A no argument function to call to hide and/or remove the progress indicator.
             *     This function is only called if the action passed to start was called.
             */
            finish: function( pScopeName, pAction ) {
                var elapsed,
                    s = getScope( pScopeName );

                if ( s.count === 0 ) {
                    throw new Error( "delayLinger.finish called before start for scope " + pScopeName );
                }
                elapsed = (new Date()).getTime() - s.start;
                s.count -= 1;

                if ( s.count === 0 ) {
                    if ( s.timer === null) {
                        // the indicator is showing so don't flash it
                        if ( elapsed < busyLinger ) {
                            setTimeout( () => {
                                // during linger another start for this scope could have happened
                                if ( s.count === 0 ) {
                                    s.showing = false;
                                    pAction();
                                    removeScope( pScopeName );
                                }
                            }, busyLinger - elapsed);
                        } else {
                            s.showing = false;
                            pAction();
                            removeScope( pScopeName );
                        }
                    } else {
                        // the request(s) went quick no need for spinner
                        clearTimeout( s.timer );
                        s.timer = null;
                        removeScope( pScopeName );
                    }
                }
            }
        };
        return ns;
    })(),

    /**
     * @ignore
     * @param $e
     * @param h
     */
    setOuterHeight: function ( $e, h ) {
        $.each( ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom", "marginTop", "marginBottom"], function( i, p ) {
            var v = parseInt( $e.css( p ), 10 );
            if ( !isNaN( v ) ) {
                h -= v;
            }
        });
        $e.height( h );
    },

    /**
     * @ignore
     * @param $e
     * @param w
     */
    setOuterWidth: function ( $e, w ) {
        $.each( ["borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight", "marginLeft", "marginRight"], function( i, p ) {
            var v = parseInt( $e.css( p ), 10 );
            if ( !isNaN( v ) ) {
                w -= v;
            }
        });
        $e.width( w );
    },

    /**
     * Get a JavaScript Date object corresponding to the input date string which must be in simplified ISO 8601 format.
     * In the future Date.parse could be used but currently there are browsers we support that don't yet support the ISO 8601 format.
     * This implementation is a little stricter about what parts of the date and time can be defaulted. The year, month, and day are
     * always required. The whole time including the T can be omitted but if there is a time it must contain at least the hours
     * and minutes. The only supported time zone is "Z".
     *
     * This function is useful for turning the date strings returned by the
     * <code class="prettyprint">APEX_JSON.STRINGIFY</code> and <code class="prettyprint">APEX_JSON.WRITE</code>
     * procedures that take a DATE value into Date objects that the client can use.
     *
     * @param {string} pDateStr String representation of a date in simplified ISO 8601 format
     * @return {Date} Date object corresponding to the input date string.
     * @example <caption>This example returns a date object from the date string in result.dateString. For example
     * "1987-01-23T13:05:09.040Z"</caption>
     * var date1 getDateFromISO8601String( result.dateString );
     */
    getDateFromISO8601String: function( pDateStr ) {
        var date, year, month, day,
            hr = 0,
            min = 0,
            sec = 0,
            ms = 0,
            m = /^(\d\d\d\d)-(\d\d)-(\d\d)(T(\d\d):(\d\d)(:(\d\d)(.(\d\d\d))?)?Z?)?$/.exec( pDateStr );

        if ( !m ) {
            throw new Error( "Invalid date format" );
        }

        year = parseInt( m[1], 10 );
        month = parseInt( m[2], 10 ) - 1;
        day = parseInt( m[3], 10 );
        if ( m[5] ) {
            hr = parseInt( m[5], 10 );
            min = parseInt( m[6], 10 );
            if ( m[8] ) {
                sec = parseInt( m[8], 10 );
                if ( m[10] ) {
                    ms = parseInt( m[10], 10 );
                }
            }
        }
        date = new Date( Date.UTC( year, month, day, hr, min, sec, ms ) );
        return date;
    },

    // todo consider documenting this. People use it. needs unit tests
    /*
     * Return the apex object from the top most APEX window.
     * This is only needed in rare special cases involving iframes
     * Not for public use
     * @ignore
     */
    getTopApex: function() {
        var curWindow, lastApex;

        function get(w) {
            var a;
            try {
                a = w.apex || null;
            } catch( ex ) {
                a = null;
            }
            return a;
        }

        // return cached answer if any
        if ( gTopApex !== null ) {
            return gTopApex;
        }

        // try for the very top
        gTopApex = get( top );
        if ( gTopApex !== null ) {
            return gTopApex;
        }

        // stat at the current window and go up the parent chain until there is no apex that we can access
        curWindow = window;
        for (;;) {
            lastApex = get( curWindow );
            if ( lastApex === null || !curWindow.parent || curWindow.parent === curWindow ) {
                break;
            }
            gTopApex = lastApex;
            curWindow = curWindow.parent;
        }
        return gTopApex;
    },

    /**
     * <p>Gets the system scrollbar size for cases in which the addition or subtraction of a scrollbar
     * height or width would effect the layout of elements on the page. The page need not have a scrollbar on it
     * at the time of this call.</p>
     *
     * @returns {object} An object with height and width properties that describe any scrollbar on the page.
     * @example <caption>The following example returns an object such as <code class="prettyprint">{ width: 17, height: 17 }</code>. Note
     * the actual height and width depends on the Operating System and its various display settings.</caption>
     * var size = apex.util.getScrollbarSize();
     */
    getScrollbarSize: function() {
        var scrollbarMeasure$;
        // Store the scrollbar size, because it will not change during page run time, thus there is no
        // need to manipulate the dom every time this function is called.
        if ( gScrollbarSize === null ) {
            // To figure out how wide a scroll bar is, we need to create a fake element
            // and then measure the difference
            // between its offset width and the clientwidth.
            scrollbarMeasure$ = $( "<div>" ).css({
                "width": "100px",
                "height": "100px",
                "overflow": "scroll",
                "position": "absolute",
                "top": "-9999px"
            }).appendTo( "body" );
            gScrollbarSize = {
                width: scrollbarMeasure$[0].offsetWidth - scrollbarMeasure$[0].clientWidth,
                height: scrollbarMeasure$[0].offsetHeight - scrollbarMeasure$[0].clientHeight
            };
            scrollbarMeasure$.remove();
        }
        return gScrollbarSize;
    },

    // todo consider if these are needed given our current browser support. Also they have very bad names
    /**
     * <p>Wrapper around requestAnimationFrame that can fallback to <code class="prettyprint">setTimeout</code>.
     * Calls the given function before next browser paint. See also {@link apex.util.cancelInvokeAfterPaint}.</p>
     * <p>See HTML documentation for <code class="prettyprint">window.requestAnimationFrame</code> for details.</p>
     *
     * @function
     * @param {function} pFunction function to call after paint
     * @returns {*} id An id that can be passed to {@link apex.util.cancelInvokeAfterPaint}
     * @example <caption>This example will call the function myAnimationFunction before the next browser repaint.</caption>
     * var id = apex.util.invokeAfterPaint( myAnimationFunction );
     * // ... if needed it can be canceled
     * apex.util.cancelInvokeAfterPaint( id );
     */
    invokeAfterPaint: ( window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            function( pFunction ) {
                return window.setTimeout( pFunction, 0 );
            }
        ).bind( window ),

    /**
     * <p>Wrapper around cancelAnimationFrame that can fallback to <code class="prettyprint">clearTimeout</code>.
     * Cancels the callback using the id returned from {@link apex.util.invokeAfterPaint}.</p>
     *
     * @function
     * @param {*} pId The id returned from {@link apex.util.invokeAfterPaint}.
     * @example <caption>See example for function {@link apex.util.invokeAfterPaint}</caption>
     */
    cancelInvokeAfterPaint: ( window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            function( pId ) {
                return window.clearTimeout( pId );
            }
        ).bind( window ),

    /**
     * <p>Returns string <code class="prettyprint">pText</code> with all HTML tags removed.</p>
     *
     * @param {string} pText The string that may contain HTML markup that you want removed.
     * @return {string} The input string with all HTML tags removed.
     * @example <caption>This example removes HTML tags from a text string.</caption>
     * apex.util.stripHTML( "Please <a href='www.example.com/ad'>click here</a>" );
     * // result: "Please click here"
     */
    stripHTML: function( pText ) {
        var tagRE = /<[^<>]+>/;

        while ( tagRE.exec( pText ) ) {
            pText = pText.replace( tagRE, "" );
        }
        return pText;
    },

    /**
     * <p>Returns the nested object at the given path <code class="prettyprint">pPath</code> within the nested object structure in
     * <code class="prettyprint">pRootObject</code> creating any missing objects along the path as needed.
     * This function is useful when you want to set the value of a property in a deeply
     * nested object structure and one or more of the nested objects may or may not exist.
     * </p>
     *
     * @param {Object} pRootObject The root object of a nested object structure.
     * @param {string} pPath A dot ('.') separated list of properties leading from the root object to the desired object
     *   to return.
     * @returns {Object}
     * @example <caption>This example sets the value of <code class="prettyprint">options.views.grid.features.cellRangeActions</code>
     * to <code class="prettyprint">false</code>.
     * It works even when the options object does not contain a views.grid.features object or a views.grid object
     * or even a views object.</caption>
     * var o = apex.util.getNestedObject( options, "views.grid.features" );
     * o.cellRangeActions = false; // now options.views.grid.features.cellRangeActions === false
     */
    getNestedObject: function( pRootObject, pPath) {
        var o = pRootObject;
        if ( pPath.length > 0 ) {
            pPath.split( "." ).forEach( function ( p ) {
                if ( o[p] === undefined ) {
                    o[p] = {};
                }
                o = o[p];
            } );
        }
        return o;
    },

    /**
     * Evaluate the given condition.
     *
     * @ignore
     * @param {Object} pCondition
     * @param {string} pCondition.op
     * @param {string} pCondition.item
     * @param {*} [pCondition.value]
     * @param {*} [pCondition.value2]
     * @param {Object} [pOptions] all the options supported by applyTemplate plus multiValued, doSubstitution substitution
     * @returns {boolean}
     */
    checkCondition: function( pCondition, pOptions ) {
        var item, itemValue, value, value2;

        pOptions = pOptions || {};

        if ( pCondition.item ) {
            item = apex.item( pCondition.item );
            if ( !item.node ) {
                debug.warn("No such item: ", pCondition.item );
                return false; // item must exist
            }
            itemValue = item.getValue();
            if ( pOptions.multiValued && !isArray( itemValue ) && itemValue !== "" ) {
                itemValue = itemValue.split( ":" );
            }
            // todo check for column items
        }
        // todo option to trim, ignore line ending like rtrim_ws
        // todo consider standard_condition support colon separated lists as well, is [not] null or zero, never, always, page [not] in, page [not]eq, [not]is zero
        // todo consider data type
        if ( pCondition.value !== undefined ) {
            value = pCondition.value;
            if ( pOptions.doSubstitution && value.match(/[#&]/) ) { // todo consider new directives
                value = util.applyTemplate( value, pOptions );
            }
        }
        if ( pCondition.value2 !== undefined ) {
            value2 = pCondition.value2;
            if ( pOptions.doSubstitution && value2.match(/[#&]/) ) { // todo consider new directives
                value2 = util.applyTemplate( value2, pOptions );
            }
        }
        return !!gConditionOps[pCondition.op](itemValue, value, value2);
    },

    /**
     * @ignore
     * @param pCondition
     * @param pOptions
     * @param pCallback
     */
    watchCondition: function( pCondition, pOptions, pCallback ) {
        var item, lastValue,
            watchId = "watchCond" + gWatchConditionIndex;

        gWatchConditionIndex += 1;
        pOptions = pOptions || {};

        if ( pCondition.item ) {
            item = apex.item( pCondition.item );
            if ( !item.node ) {
                debug.warn("No such item: ", pCondition.item );
                return; // item must exist
            }
            $( item.node ).on( "change." + watchId, function() {
                var item = apex.item( pCondition.item ),
                    itemValue = item.getValue();

                if ( itemValue !== lastValue ) {
                    lastValue = itemValue;
                    pCallback( util.checkCondition( pCondition, pOptions ) );
                }
            } );
        }
        pCallback( util.checkCondition( pCondition, pOptions ) );
        return watchId;
    },

    unwatchCondition: function( pCondition, watchId ) {
        var item;

        if ( pCondition.item ) {
            item = apex.item( pCondition.item );
            if ( !item.node ) {
                return; // item must exist
            }
            $( item.node ).off( "change." + watchId );
        }
    },

    /**
     * Define one or more named templates.
     * todo doc
     * @ignore
     * @param {object} pTemplates The property names are the template names. The property values are the template text.
     */
    defineTemplates: function( pTemplates ) {
        var t;

        for ( t in pTemplates ) {
            if ( pTemplates.hasOwnProperty( t ) ) {
                if ( t.match( /^[_$A-Z0-9]+$/ ) ) { // todo consider allow a-z?
                    gTemplates[t] = pTemplates[t];
                } else {
                    debug.warn( "defineTemplates template with invalid name ignored: " + t );
                }
            }
        }
    },


    /**
     * List all the defined template names.
     * @ignore
     * @returns {string[]}
     */
    listTemplates: function() {
        return Object.keys( gTemplates );
    },

    /**
     * Get the template text for the given template name.
     * @ignore
     * @param pTemplateName
     * @returns {string|null}
     */
    getTemplate: function( pTemplateName ) {
        return gTemplates[pTemplateName] || null;
    },

    /**
     * <p>This function applies data to a template. It processes the template string given in
     * <code class="prettyprint">pTemplate</code> by substituting
     * values according to the options in <code class="prettyprint">pOptions</code>.
     * The template supports Application Express server style placeholder and item substitution syntax.</p>
     *
     * <p>This function is intended to process Application Express style templates in the browser.
     * However it doesn't have access to all the data that the server has. When substituting page items and column
     * items it uses the current value stored in the browser not what is in session state on the server.
     * It does not support the old non-exact substitutions (with no trailing dot e.g. &ITEM). It does not support
     * the old column reference syntax that uses #COLUMN_NAME#. It cannot call
     * <code class="prettyprint">PREPARE_URL</code> (this must be done on the server).
     * Using a template to insert JavaScript into the DOM is not supported.
     * After processing the template all script tags are removed.</p>
     *
     * <p>The format of a template string is any text intermixed with any number of replacement tokens
     * or directives. Two kinds of replacement tokens are supported: placeholders and data substitutions.
     * Directives control the processing of the template. Directives are processed first, then placeholders and finally
     * data subsitutions.</p>
     *
     * <h3>Placeholders</h3>
     * <p>This is also known as a hash substitution.</p>
     * <p>Placeholder syntax is:</p>
     * <pre class="prettyprint"><code>#&lt;placeholder-name>#
     * </code></pre>
     * <p>The &lt;placeholder-name> is an uppercase alpha numeric plus "_", and "$" string that must be a property
     * name in option object <code class="prettyprint">placeholders</code> that gets replaced with the property value.
     * Any placeholder tokens that don't match anything in the placeholders object are left as is (searching for the
     * next placeholder begins with the trailing # character).</p>
     *
     * <h3>Data substitutions</h3>
     * <p>Substitution syntax is (any of):</p>
     * <pre><code>&&lt;item-name>.
     * &&lt;item-name>!&lt;escape-filter>.
     * &"&lt;quoted-item-name>".
     * &"&lt;quoted-item-name>"!&lt;escape-filter>.
     * &APP_TEXT$&lt;message-key>.
     * &APP_TEXT$&lt;message-key>!&lt;escape-filter>.
     * &"APP_TEXT$&lt;message-key>".
     * &"APP_TEXT$&lt;message-key>"!&lt;escape-filter>.
     * </code></pre>
     *
     * <p>The &lt;item-name> is an uppercase alpha numeric plus "_", "$", and "#" string. The &lt;quoted-item-name>
     * is a string of any characters except "&", carriage return, line feed, and double quote.
     * In both cases the item name is the name of a page item (unless option <code class="prettyprint">includePageItems</code> is false),
     * a column item (if <code class="prettyprint">model</code> and <code class="prettyprint">record</code> options are given), a built-in substitution
     * (unless option <code class="prettyprint">includeBuiltinSubstitutions</code> is false),
     * or an extra substitution if option <code class="prettyprint">extraSubstitutions</code> is given.</p>
     *
     * <p>The &lt;item-name> can include a property reference. A '%' character separates the item-name from the property name.
     * For example <code class="prettyprint">&P1_NAME%LABEL.</code> will return the label of the P1_NAME item.
     * The property name is case insensitive.</p>
     *
     * <p>The properties and the values they return for a page item are:</p>
     * <ul>
     *     <li>LABEL - The item label.</li>
     *     <li>DISPLAY - The display value of the item's current value.</li>
     *     <li>CHANGED - 'Y' if the item has been changed and 'N' otherwise.</li>
     *     <li>DISABLED - 'Y' if the item is disabled and 'N' otherwise.</li>
     * </ul>
     *
     * <p>The properties for a column item are:</p>
     * <ul>
     *     <li>HEADING - The column heading text. The heading may include markup. If there is no heading
     *        the label will be used if there is one.</li>
     *     <li>LABEL - The column label. If there is no label the heading will be used with markup removed.</li>
     *     <li>DISPLAY - The display value of the column value for the current row/record.</li>
     *     <li>HEADING_CLASS - Any CSS classes defined for the column heading.</li>
     *     <li>COLUMN_CLASS - Any CSS classes defined for the column.</li>
     *     <li>REQUIRED - 'Y' if the column is required and 'N' otherwise.</li>
     * </ul>
     *
     * <p>The &lt;message-key> is a message key suitable for use in {@link apex.lang.getMessage} and
     * is replaced with the localized message text for the given key. The message must already be loaded on the
     * client by setting the Text Message attribute <em>Used in JavaScript</em> to On or otherwise adding it such as with
     * {@link apex.lang.addMessages}.
     * If no replacement for a substitution can be found it is replaced with the message key. The language specifier
     * that is supported for server side message substitutions is not supported by the client and will be ignored
     * if present.</p>
     *
     * <p>When substituting a column item the given record of the given model is used to find a matching column name.
     * If not found and if the model has a parent model then the parent model's columns are checked.
     * This continues as long as there is a parent model. The order to resolve an item name is: page item,
     * column item, column item from ancestor models, built-in substitutions, and finally extra substitutions.
     * For backward compatibility column items support the "_LABEL" suffix to access the defined column label.
     * For example if there is a column item named <code class="prettyprint">NOTE</code> the substitution
     * <code class="prettyprint">&NOTE_LABEL.</code> will return the label string for column <code class="prettyprint">NOTE</code>.
     * It is better to use the label property in this case, for example: <code class="prettyprint">&NOTE%label.</code>.</p>
     *
     * <p>The built-in substitution names are:</p>
     * <ul>
     * <li>&APP_ID.</li>
     * <li>&APP_PAGE_ID.</li>
     * <li>&APP_SESSION.</li>
     * <li>&REQUEST.</li>
     * <li>&DEBUG.</li>
     * <li>&IMAGE_PREFIX.</li>
     * </ul>
     *
     * <p>The escape-filter controls how the replacement value is escaped or filtered. It can be one of the following
     * values:</p>
     * <ul>
     * <li>HTML the value will have HTML characters escaped using {@link apex.util.escapeHTML}.</li>
     * <li>ATTR the value will be escaped for an HTML attribute context (currently the same as HTML)</li>
     * <li>RAW does not change the value at all.</li>
     * <li>STRIPHTML the value will have HTML tags removed and HTML characters escaped.</li>
     * </ul>
     * <p>This will override any default escape filter set with option <code class="prettyprint">defaultEscapeFilter</code>
     * or from the column definition <code class="prettyprint">escape</code> property.</p>
     *
     * <h3>Directives</h3>
     * <p>Directive syntax is:</p>
     * <pre><code>{&lt;directive-name>[ &lt;directive-arguments>]/}
     * </code></pre>
     * <p>The directive name determines what it does as described below. Directive names are case insensitive.
     * There can be no whitespace between the open bracket '{' and the directive name.
     * Directives often come in sets that work together. A directive may have additional arguments.</p>
     *
     * <h4>If condition directives</h4>
     * <p>Syntax:</p>
     * <pre><code>{if [!]NAME/}
     * TRUE_TEMPLATE_TEXT
     * {elseif [!]NAME2/}
     * ELSE_TRUE_TEMPLATE_TEXT
     * {else/}
     * FALSE_TEMPLATE_TEXT
     * {endif/}
     * </code></pre>
     *
     * <p>The entire text from the <strong>if</strong> directive to the matching <strong>endif</strong> directive is
     * replaced with the processed template text following the first <strong>if</strong> or <strong>elseif</strong>
     * directive that evaluates to true or the template text following the <strong>else</strong>
     * directive if none are true. There must be an <strong>if</strong> and <strong>endif</strong> directive.
     * The <strong>elseif</strong> and <strong>else</strong> directives are optional.
     * There can be any number of <strong>elseif</strong> directives. The directives must go in the order shown.
     * <strong>If</strong> directives can be nested.
     * That means any of the template texts can contain another <strong>if</strong> directive.</p>
     *
     * <p>The <strong>if</strong> and <strong>elseif</strong> directives test the value of NAME
     * and if it is true process the following template text.
     * The NAME can be an item-name, quoted-item-name, or placeholder-name. The value of an item-name or quoted-item-name
     * is the value of that page item or column item. The value of a placeholder-name is the text of the placeholder.
     * If no data substitution or placeholder with that name exists then the value is empty string.</p>
     *
     * <p>A value is false if after trimming leading and trailing spaces it is an empty string,
     * or for a page item the item {@link item#isEmpty} method returns true,
     * or if the value is equal to any of the values in the <code class="prettyprint">falseValues</code> option.
     * Any value that is not false is true. If the name is prefixed with exclamation mark (!) then the logic is
     * negated and the following template text is processed if the value is false.</p>
     *
     * <p>Example:<br>
     * The page contains items P1_TITLE, P_ICON, P1_DESCRIPTION, and P1_DETAILS and all have optional values.
     * The template outputs a default title if P1_TITLE is empty. An optional icon is shown only if there is a title.
     * The template output includes markup for the description if it is not empty or details if it is not empty and
     * nothing otherwise.</p>
     *
     * <pre><code>&lt;h3>{if P1_TITLE/}&P1_TITLE. {if P1_ICON/}&lt;span class="fa &P1_ICON.">&lt;/span>{endif/}
     * {else/}Untitled{endif/}&lt;/h3>
     * {if P1_DESCRIPTION/}
     *   &lt;p class="description">&P1_DESCRIPTION.&lt;/p>
     * {elseif P1_DETAILS/}
     *   &lt;p class="details">&P1_DETAILS.&lt;/p>
     * {endif/}
     * </code></pre>
     *
     * <h4>Case condition directives</h4>
     * <p>Syntax:</p>
     * <pre><code>{case NAME/}
     * {when string1/}
     * TEMPLATE_TEXT1
     * {when string2/}
     * TEMPLATE_TEXT2
     * {otherwise/}
     * TEMPLATE_TEXT
     * {endcase/}
     * </code></pre>
     *
     * <p>The entire text from the <strong>case</strong> directive to the matching <strong>endcase</strong> directive
     * is replaced with the processed template text after the <strong>when</strong> directive that matches the NAME value.
     * The value of NAME is compared with each of the strings in the <strong>when</strong> directive and if it is equal the following
     * template (TEMPLATE_TEXTn) is processed. If no <strong>when</strong> directive matches then the template after
     * the <strong>otherwise</strong> directive is processed if there is one. The <strong>otherwise</strong> directive is optional
     * but it must come at the end and there can only be one. <strong>Case</strong> directives can be nested.
     * That means any of the template texts can contain another <strong>case</strong> directive.</p>
     *
     * <p>The NAME can be an item-name, quoted-item-name, or placeholder-name. The value of an item-name or quoted-item-name
     * is the value of that page item or column item. The value of a placeholder-name is the text of the placeholder.
     * If no data substitution or placeholder with that name exists then the value is empty string. The NAME value and each string
     * is trimmed of leading and trailing spaces before comparison. The comparison is case sensitive.</p>
     *
     * <p>Example:<br>
     * The page contains items P1_NAME and P1_DETAILS, and P1_DETAIL_STYLE that can have a value of "FULL" or "BRIEF".
     * The intention is to control the markup according to the detail style.</p>
     * <pre><code>{case P1_DETAIL_STYLE/}
     * {when FULL/}
     *     &lt;div class="full">
     *         &lt;span>&P1_NAME!HTML.&lt;/span>
     *         &lt;p class="description">&P1_DETAILS!HTML.&lt;/p>
     *     &lt;/div>
     * {when BRIEF/}
     *   &lt;div class="brief">
     *       &lt;span>&P1_NAME!HTML.&lt;/span>
     *   &lt;/div>
     * {endcase/}
     * </code></pre>
     *
     * <h4>Loop directives</h4>
     * <p>Syntax:</p>
     * <pre><code>{loop ["SEP"] NAME/}
     * TEMPLATE_TEXT
     * {endloop/}
     * </code></pre>
     *
     * <p>The entire text from the <strong>loop</strong> directive to the matching <strong>endloop</strong> directive is
     * replaced with the template text evaluated once for each item in the NAME value.</p>
     *
     * <p>The NAME can be an item-name, quoted-item-name, or placeholder-name. The value of an item-name or quoted-item-name
     * is the value of that page item or column item. The value of a placeholder-name is the text of the placeholder.
     * If no data substitution or placeholder with that name exists then the value is empty string. The NAME value should
     * be a separator delimited string that contains a list of items. The optional SEP argument defines the separator
     * character. The default separator is ":". If SEP is more than one character it is treated as a regular expression.</p>
     *
     * <p>Within the loop there are two extra data substitutions available:</p>
     * <ul>
     *     <li><strong>APEX$ITEM</strong> This is the value of the current item in the list.</li>
     *     <li><strong>APEX$I</strong> This is 1 based index of the current item in the list.</li>
     * </ul>
     *
     * <p>Example:<br>
     * The following example takes a page item, <code class="prettyprint">P1_TAGS</code> that contains a bar '|'
     * separated list of tags such as "apples|cherries|pears" and turns it into an HTML list that can be nicely styled.</p>
     * <pre><code>&lt;ul class="tags">{loop "|" P1_TAGS/}
     *   &lt;li class="tag-item">APEX$ITEM&lt;/li>
     * {endloop/}&lt;/ul>
     * </code></pre>

     * <h4>Comments</h4>
     * <p>Syntax:</p>
     * <pre><code>{!&lt;comment-text>/}
     * </code></pre>
     *
     * <p>This directive is substituted with nothing. It allows adding comments to templates.
     * The comment-text can be any characters except new line and the "/}" sequence.</p>
     *
     * <p>Example:<br>
     * This example includes a comment reminding the developer to complete something. In this case
     * replace a hard coded English string with a localizable text message.</p>
     * <pre><code>&lt;span>Name: &P1_NAME.&lt;/span> {!to do replace Name: with text message/}
     * </code></pre>
     *
     * <h4>Escape open bracket '{'</h4>
     * <p>Syntax:</p>
     * <pre><code>{{/}
     * </code></pre>
     *
     * <p>In rare cases a lone open bracket '{' can be confused for the start of a directive if another directive
     * follows it on the same line.</p>
     *
     * <p>Example:<br>
     * This is an example where the open bracket '{' has to be escaped. </p>
     * <pre><code>&lt;span>The coordinates {{/}c, d} = {if VAL/}&VAL.{else/}unknown{endif/}&lt;/span>
     * </code></pre>
     * <p>Here are similar cases that don't require an escape.</p>
     * <pre><code>&lt;span>The coordinates { c, d } = {if VAL/}&VAL.{else/}unknown{endif/}&lt;/span>
     * </code></pre>
     * <pre><code>&lt;span>The coordinates {c, d} =
     * {if VAL/}&VAL.{else/}unknown{endif/}&lt;/span>
     * </code></pre>
     *
     * @param {string} pTemplate A template string with any number of replacement tokens as described above.
     * @param {Object} [pOptions] An options object with the following properties that specifies how the template
     *     is to be processed:
     * @param {Object} [pOptions.placeholders] An object map of placeholder names to values.  The default is null.
     * @param {boolean} [pOptions.directives] Specify if directives are processed. If true directives are processed.
     *    If false directives are ignored and remain part of the text. The default is true.
     * @param {string} [pOptions.defaultEscapeFilter] One of the above escape-filter values. The default is HTML.
     *    This is the escaping/filtering that is done if the substitution token doesn't
     *    specify an escape-filter. If a model column definition has an <code class="prettyprint">escape</code> property
     *    then it will override the default escaping.
     * @param {boolean} [pOptions.includePageItems] If true the current value of page items are substituted.
     *     The default is true.
     * @param {model} [pOptions.model] The model interface used to get column item values. The default is null.
     * @param {model.Record} [pOptions.record] The record in the model to get column item values from.
     *     Option <code class="prettyprint">model</code> must also be provided. The default is null.
     * @param {Object} [pOptions.extraSubstitutions] An object map of extra substitutions. The default is an empty object.
     * @param {boolean} [pOptions.includeBuiltinSubstitutions] If true built-in substitutions such as APP_ID are done.
     *     The default is true.
     * @param {string[]} [pOptions.falseValues] An array of values that are considered false in if directive tests.
     *     Empty string and an item that doesn't exist are always considered false.
     *     The default is ["F", "f", "N", "n", "0"]
     * @return {string} The template string with replacement tokens substituted with data values.
     *
     * @example <caption>This example inserts an image tag where the path to the image comes from the built-in
     * IMAGE_PREFIX substitution and a page item called P1_PROFILE_IMAGE_FILE.</caption>
     * apex.jQuery( "#photo" ).html(
     *     apex.util.applyTemplate(
     *         "<img src='&IMAGE_PREFIX.people/&P1_PROFILE_IMAGE_FILE.'>" ) );
     *
     * @example <caption>This example inserts a div with a message where the message text comes from a
     *     placeholder called MESSAGE.</caption>
     * var options = { placeholders: { MESSAGE: "All is well." } };
     * apex.jQuery( "#notification" ).html( apex.util.applyTemplate( "<div>#MESSAGE#</div>", options ) );
     */
    // todo consider if item-name should allow lowercase letters
    // todo consider if filter ATTR should change currently the same as escapeHTML any need to change this and should it affect htmlBuilder?
    // todo doc directives with/apply and other loop variations
    // todo doc more item/column properties
    // pArgs is for internal use
    applyTemplate: function( pTemplate, pOptions, pArgs ) {
        var result, src, m, m2, pos, lastPos, ph, dir, value, doPlaceholders, doDirectives,
            hashOrDirectiveRE = /#([_$A-Z0-9]+)#|{([iIcClLeEoOwWaA{!]([^/\r\n]|\/(?!}))*)\/}/g, // #hash# or {directive/} capture the hash or directive
            directiveRE = /^(!|\w+(?:\s+|$))(.*)?$/, // ! or word captured (the word is followed by space or eol that we don't care about) then all the rest captured
            colLabelRE = /^(.+)_LABEL$/, // legacy. better to use the label property
            phNameRE = /^[_$A-Z0-9]+$/,
            nameRE = /^[^"&\r\n]+$/,
            scriptRE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi,
            langRE = /\$[^$]*$/,
            itemSepRE = /^"([^"]+)"\s+([^"&\r\n]+)$/,
            argAssignmentRE = /\n\s*([_$A-Z0-9]+)\s*:=/g,
            apexModel = apex.model,
            apexItem = apex.item;

        var tokenIndex, directive, lastTokenType,
            tokens = [],
            ifStack = [],
            caseStack = [],
            loopStack = [],
            modelStack = [],
            applyArgs = null,
            directives = {
                if: function ( index, arg ) {
                    var test = testIfCondition( arg ),
                        sf = {
                            matched: false
                        };

                    if ( !validName( arg ) ) {
                        return index;
                    }
                    ifStack.push(sf);
                    if ( test ) {
                        sf.matched = true;
                        return index;
                    } // else
                    // look for the elseif or else block if there is one
                    return lookAhead( index, {else:1,elseif:1,endif:1}, "if", "endif" );
                },
                elseif: function( index, arg ) {
                    var test = testIfCondition( arg ),
                        sf = ifStack[ifStack.length -1];

                    if ( !validName( arg ) || checkMismatch( ifStack, "elseif", "if" ) ) {
                        return index;
                    }
                    if ( sf.hasElse ) {
                        debug.error( "applyTemplate elseif must come before else" );
                    }
                    if ( !sf.matched && test ) {
                        sf.matched = true;
                        return index;
                    } // else
                    // look for the elseif or else block if there is one
                    return lookAhead( index, {else:1,elseif:1,endif:1}, "if", "endif" );
                },
                else: function( index, arg ) {
                    var sf = ifStack[ifStack.length -1];
                    checkNoArg( "else", arg );
                    if ( checkMismatch( ifStack, "else", "if" ) ) {
                        return index;
                    }
                    if ( sf.hasElse ) {
                        debug.error( "applyTemplate if must have only one else" );
                    }
                    sf.hasElse = true;
                    if ( !sf.matched ) {
                        sf.matched = true;
                        return index;
                    }
                    return lookAhead( index, {endif:1}, "if", "endif" );
                },
                endif: function( index, arg ) {
                    checkNoArg( "endif", arg );
                    if ( !checkMismatch( ifStack, "endif", "if" ) ) {
                        ifStack.pop();
                    }
                    return index;
                },
                case: function( index, arg ) {
                    var t,
                        sf = {
                            matched: false
                        };

                    t = tokens[index];
                    if ( t.type === "text" && t.text.trim() === "" ) {
                        index += 1;
                    }
                    t = tokens[index];
                    if ( t.type === "directive" && t.name === "when" ) {
                        if ( !validName( arg ) ) {
                            return index;
                        }
                        caseStack.push(sf);
                        sf.value = dataOrPlaceholderValue( arg, false ).trim();
                    } else {
                        debug.error( "applyTemplate must have 'when' right after 'case'" );
                    }
                    return index;
                },
                when: function( index, arg ) {
                    var sf = caseStack[caseStack.length -1];

                    if ( checkMismatch( caseStack, "when", "case" ) ) {
                        return index;
                    }
                    if ( sf.hasOtherwise ) {
                        debug.error( "applyTemplate when must come before otherwise" );
                    }
                    if ( sf.matched ) {
                        return lookAhead( index, {endcase:1}, "case", "endcase" );
                    }
                    if ( sf.value === arg.trim() ) {
                        sf.matched = true;
                        return index;
                    } // else
                    return lookAhead( index, {when:1,otherwise:1,endcase:1}, "case", "endcase" );
                },
                otherwise: function( index, arg ) {
                    var sf = caseStack[caseStack.length -1];

                    checkNoArg( "otherwise", arg );
                    if ( checkMismatch( caseStack, "otherwise", "case" ) ) {
                        return index;
                    }
                    if ( sf.hasOtherwise ) {
                        debug.error( "applyTemplate case must have only one otherwise" );
                    }
                    sf.hasOtherwise = true;
                    if ( sf.matched ) {
                        return lookAhead( index, {endcase:1}, "case", "endcase" );
                    }
                    sf.matched = true;
                    return index;
                },
                endcase: function( index, arg ) {
                    checkNoArg( "endcase", arg );
                    if ( !checkMismatch( caseStack, "endcase", "case" ) ) {
                        caseStack.pop();
                    }
                    return index;
                },
                with: function( index, arg ) {
                    var i, m, t, formalArgName, pos, start, end, text,
                        withCount = 0,
                        mapText = "",
                        endIndex = lookAhead( index, {apply:1}, "with", "apply" );

                    for ( i = index; i < endIndex; i++ ) {
                        mapText += tokens[i].text;
                    }

                    index = i;
                    t = tokens[index];
                    if ( t && t.type === "directive" && t.name === "apply" ) {
                        applyArgs = {};
                        m = argAssignmentRE.exec( mapText );
                        while ( m ) {
                            pos = m.index + m[0].length;
                            if ( withCount === 0 ) {
                                formalArgName = m[1];
                                start = pos;
                            }
                            m = argAssignmentRE.exec( mapText );
                            end = m ? m.index : mapText.length;
                            text = mapText.substring( pos, end );
                            if ( text.indexOf( "{with" ) >= 0 ) {
                                withCount += 1;
                            }
                            if ( text.indexOf( "{apply" ) >= 0 ) {
                                withCount -= (text.split("{apply").length - 1); // this counts the number of {apply substrings in text
                            }
                            if ( withCount === 0 ) {
                                applyArgs[formalArgName] = mapText.substring( start, end ).trim();
                            }
                        }
                        // todo consider cache parsed args in with token
                    } else {
                        debug.error( "applyTemplate missing 'apply' after 'with'" );
                    }
                    return index;
                },
                apply: function( index, arg ) {
                    var p, args, templateName = arg;

                    if ( templateName && gTemplates[templateName] ) {
                        // call to applyTemplate JavaScript provides the new stack context for the template invocation
                        // copy any current args
                        args = $.extend( {}, pArgs );
                        for ( p in applyArgs ) {
                            if ( applyArgs.hasOwnProperty( p ) ) {
                                args[p] = util.applyTemplate( applyArgs[p], pOptions, pArgs );
                            }
                        }
                        result += util.applyTemplate( gTemplates[templateName], pOptions, args );
                        applyArgs = null;
                    } else {
                        debug.warn( "applyTemplate apply missing or unknown template name" );
                    }
                    return index;
                },
                loop: function( index, arg ) {
                    var t, model, tokenIndex, i, m, value, sep, items, extraData,
                        modelName = null,
                        sf = {};

                    loopStack.push( sf );
                    if ( arg ) {
                        // first see if it is the name of a model todo any validation for a model name?
                        modelName = arg;
                        model = apexModel.get( modelName );
                    } else {
                        // if no arg loop over given model
                        modelName = null;
                        model = pOptions.model;
                        if ( !model ) {
                            debug.error( "applyTemplate no model or item to loop over" );
                        }
                    }
                    if ( model ) {
                        extraData = pOptions.extraSubstitutions;
                        sf.prevIndex = extraData.APEX$I;
                        sf.prevItem = extraData.APEX$ID;

                        sf.model = model;
                        modelStack.push(sf);
                        model.forEach( function ( record, rIndex, id ) {
                            tokenIndex = index;
                            sf.record = record;
                            // make rIndex and id available to loop template
                            extraData.APEX$I = "" + (rIndex + 1);
                            extraData.APEX$ID = id;
                            for (;;) {
                                if ( tokenIndex >= tokens.length ) {
                                    break;
                                }
                                t = tokens[tokenIndex];
                                if ( t.type === "directive" && t.name === "endloop" ) {
                                    break;
                                }
                                tokenIndex = processToken( tokenIndex );
                            }
                        } );
                        extraData.APEX$I = sf.prevIndex;
                        extraData.APEX$ID = sf.prevItem;
                        if ( modelName ) {
                            apexModel.release( modelName );
                        }
                        modelStack.pop();
                    } else if ( arg ) {
                        // if there is an arg it could be for a multi valued item
                        m = itemSepRE.exec( arg );
                        if ( m ) {
                            sep = m[1];
                            arg = m[2];
                        } else {
                            // no separator given and arg may be an item name
                            let item = apexItem( arg );
                            // fist check if it is an item and if the item defines the separator
                            if ( item.node ) {
                                sep = item.getSeparator();
                            }
                            // fall back to the default separator
                            sep = sep || ":";
                        }
                        if ( sep.length > 1 ) {
                            // treat it like a regular expression
                            sep = new RegExp( sep );
                        }
                        value = dataOrPlaceholderValue( arg, true ); // get raw value which could be an array
                        if ( value ) {
                            extraData = pOptions.extraSubstitutions;
                            sf.prevIndex = extraData.APEX$I; // todo consider allow naming them so can access ones in outer loop?
                            sf.prevItem = extraData.APEX$ITEM;

                            if ( isArray( value ) ) {
                                items = value;
                            } else {
                                items = value.split( sep );
                            }
                            for ( i = 0; i < items.length; i++ ) {
                                tokenIndex = index;

                                extraData.APEX$I = "" + (i + 1);
                                extraData.APEX$ITEM = items[i];
                                for ( ; ; ) {
                                    if ( tokenIndex >= tokens.length ) {
                                        break;
                                    }
                                    t = tokens[tokenIndex];
                                    if ( t.type === "directive" && t.name === "endloop" ) {
                                        break;
                                    }
                                    tokenIndex = processToken( tokenIndex );
                                }
                            }
                            extraData.APEX$I = sf.prevIndex;
                            extraData.APEX$ITEM = sf.prevItem;
                        }
                    }

                    return lookAhead( index, {endloop:1}, "loop", "endloop" );
                },
                endloop: function( index, arg ) {
                    checkNoArg( "endloop", arg );
                    if ( !checkMismatch( loopStack, "endloop", "loop" ) ) {
                        loopStack.pop();
                    }
                    return index;
                },
                "!": function ( index ) {
                    src = src.substring( pos + dir.length + 3 );
                    return index;
                }
            };

        function validName( name ) {
            if ( !nameRE.test( name ) ) {
                debug.error( "applyTemplate invalid name for 'if', 'elseif', or 'case'" );
                return false;
            }
            return true;
        }

        function testIfCondition( cond ) {
            let test,
                item = null,
                not = false;

            if ( cond.indexOf( "!" ) === 0 ) {
                not = true;
                cond = cond.substr( 1 ).trim();
            }
            test = dataOrPlaceholderValue( cond, false ); // force value be a string
            test = test.trim();
            // see if the condition name is an item
            if ( pOptions.includePageItems ) {
                item = apexItem( cond );
                if ( !item.node ) {
                    item = null;
                }
            }
            // todo handle model columns with an item with nullValue defined

            // todo Consider isEmpty is not too useful when the item value is passed to a named template
            //   workaround ARG:={if P1_SELECT/}&P1_SELECT.{/if}
            // false when empty or null or one of the falseValues all others true
            test = !( ( item && item.isEmpty() ) || test === "" || pOptions.falseValues.includes( test ) );
            if ( not ) {
                test = !test;
            }
            return test;
        }

        function checkMismatch( stack, found, missing ) {
            var test = stack.length < 1;
            if ( test ) {
                debug.error( "applyTemplate '" + found + "' without '" + missing + "'" );
            }
            return test;
        }

        function checkNoArg( name, arg ) {
            if ( arg !== "" ) {
                debug.warn( "applyTemplate extra text after directive '" + name + "' ignored" );
            }
        }

        function getColumnProp( model, col, prop, type ) {
            var fields = model.getOption( "fields" ),
                value = "";
            if ( fields.hasOwnProperty( col ) ) {
                value = fields[col][prop] || "";
            }
            if ( type === "tmpl" ) {
                value = util.applyTemplate( value, pOptions );
            } else if ( type === "bool" ) {
                value = value === true ? "Y" : "N";
            }
            return "" + value;
        }

        var itemPropAccess = {
            label: function( item ) {
                var cont$ = $( "#" + util.escapeCSS( item.id ) + "_CONTAINER");

                if ( !cont$.length ) {
                    cont$ = $( "body" );
                }
                // todo update this if/when we fix labels for non form elements and use aria-labelledby
                return cont$.find("[for='" + util.escapeCSS( item.id ) + "']").text();
            },
            display: function( item ) {
                let disp = item.displayValueFor( item.getValue() );
                if ( isArray( disp ) ) {
                    disp = disp.join( ", " );
                }
                return disp;
            },
            valid: function( item ) {
                return item.getValidity().valid ? "Y" : "N";
            },
            message: function( item ) {
                return item.getValidationMessage();
            },
            changed: function( item ) {
                return item.isChanged() ? "Y" : "N";
            },
            disabled: function( item ) {
                return item.isDisabled() ? "Y" : "N";
            }
        };

        var columnPropAccess = {
            display: function( itemName, model, rec ) {
                var field, item,
                    fields = model.getOption( "fields" ),
                    value = model.getValue( rec, itemName );

                if ( fields.hasOwnProperty( itemName ) ) {
                    field = fields[itemName];
                }

                if ( field && field.cellTemplate ) {
                    value = util.applyTemplate( field.cellTemplate, pOptions );
                } else if ( typeof value === "object" && value.d ) {
                    value = value.d;
                } else if ( field && field.elementId ) {
                    item = apexItem( field.elementId );
                    if ( item.node ) {
                        value = item.displayValueFor( value );
                    }
                }
                // todo share code with _renderFieldDataValue
                return value;
            },
            label: function( itemName, model ) {
                var field,
                    fields = model.getOption( "fields" ),
                    value = "";

                if ( fields.hasOwnProperty( itemName ) ) {
                    field = fields[itemName];
                    value = util.stripHTML( field.label || field.heading || "" );
                }
                return value;
            },
            heading: function( itemName, model ) {
                var field,
                    fields = model.getOption( "fields" ),
                    value = "";

                if ( fields.hasOwnProperty( itemName ) ) {
                    field = fields[itemName];
                    value = field.heading || field.label || "";
                }
                return value;
            },
            heading_class: function( itemName, model ) {
                return getColumnProp( model, itemName, "headingCssClasses" );
            },
            column_class: function( itemName, model ) {
                return getColumnProp( model, itemName, "columnCssClasses" );
            },
            field_class: function( itemName, model ) {
                return getColumnProp( model, itemName, "fieldCssClasses" );
            },
            field_col_span: function( itemName, model ) {
                return getColumnProp( model, itemName, "fieldColSpan" );
            },
            width: function( itemName, model) {
                return getColumnProp( model, itemName, "width" );
            },
            required: function( itemName, model ) {
                return getColumnProp( model, itemName, "isRequired", "bool" );
            },
            readonly: function( itemName, model, rec, recMeta ) {
                var cellMeta,
                    ro = getColumnProp( model, itemName, "readonly", "bool" );

                if ( ro !== "Y" ) {
                    if ( recMeta && recMeta.fields && recMeta.fields[itemName] ) {
                        cellMeta = recMeta.fields[itemName];
                    }
                    // check with model
                    if ( ( cellMeta && cellMeta.ck ) || !model.allowEdit( rec ) ) {
                        ro = "Y";
                    }
                }
                return ro;
            },
            link: function( itemName, model, rec, recMeta ) {
                var field, cellMeta,
                    targetUrl = "",
                    fields = model.getOption( "fields" );

                if ( recMeta && recMeta.fields && recMeta.fields[itemName] ) {
                    cellMeta = recMeta.fields[itemName];
                }
                if ( fields.hasOwnProperty( itemName ) ) {
                    field = fields[itemName];
                    value = field.heading || field.label || "";
                }
                if ( ( ( cellMeta && cellMeta.url ) || field.linkTargetColumn ) ) {
                    if ( field.linkTargetColumn ) {
                        targetUrl = model.getValue( rec, field.linkTargetColumn ) || null;
                    } else {
                        targetUrl = cellMeta.url;
                    }
                }
                return targetUrl;
            },
            link_text: function( itemName, model, rec ) {
                return getColumnProp( model, itemName, "linkText", "tmpl" );
            },
            link_attrs: function( itemName, model ) {
                return getColumnProp( model, itemName, "linkAttributes", "tmpl" );
            },
            hidden: function( itemName, model ) {
                return getColumnProp( model, itemName, "hidden", "bool" );
            }
        };
        // todo cosider property access to model metadata: defaultValue, error, warning, message, disabled, highlight
        //     column config:  alignment, headingAlignment, cellCssClassesColumn, noStretch, helpId, useAsRowHeader

        // when escFilter is false do no escaping
        function v( itemName, escFilter, raw ) {
            var i, item, fields, match, labelName, messageKey, lang, prop, altItemName,
                defaultEscape = pOptions.defaultEscapeFilter,
                value = null;

            // naming convention for accessing additional properties/metadata about an item <item>_$<property>
            match = PROP_SUFFIX_RE.exec( itemName );
            if ( match ) {
                altItemName = itemName.substring( 0, match.index );
                prop = match[1].toLowerCase();
            }

            // check for a message key
            if ( itemName.indexOf( "APP_TEXT$" ) === 0 ) {
                messageKey = itemName.substr( 9 );
                lang = langRE.exec( messageKey );
                if ( lang ) {
                    // Remove language from message key. It is used by server symbol substitution but not supported by client
                    // Allow a lone trailing $ to support message keys that include $ in them.
                    if ( lang[0].length > 1 ) {
                        debug.warn("applyTemplate message text substitution " + lang[0] + " language ignored.");
                    }
                    messageKey = messageKey.replace( langRE, "" );
                }
                if ( messageKey ) {
                    value = apex.lang.getMessage( messageKey );
                }
            }
            // if still no value check for a page item
            if ( value === null && pOptions.includePageItems ) {
                item = apexItem( itemName );
                if ( item.node ) {
                    value = item.getValue();
                    // be consistent with the server and return the value not the display value.
                } else if ( altItemName && itemPropAccess[prop] ) {
                    item = apexItem( altItemName );
                    if ( item.node ) {
                        value = itemPropAccess[prop]( item );
                    }
                }
            }
            // if still no value found then check for a model record
            if ( value === null && modelStack.length > 0 ) {
                let parentM, parentID, elementId, recId,
                    modelStackIndex = modelStack.length - 1,
                    msf = modelStack[modelStackIndex],
                    model = msf.model,
                    rec = msf.record,
                    recMeta = msf.recMeta,
                    models = [];

                while ( value === null && rec && model ) {
                    value = model.getValue( rec, itemName ) || null;
                    if ( value === null ) {
                        // try <col>_LABEL to get the column heading label (this is the legacy way)
                        match = colLabelRE.exec( itemName );
                        if ( match ) {
                            labelName = match[1];
                            fields = model.getOption( "fields" );
                            if ( fields.hasOwnProperty( labelName ) ) {
                                value = fields[labelName].label || fields[labelName].heading || null;
                            }
                        } else if ( altItemName && columnPropAccess[prop] ) {
                            value = columnPropAccess[prop]( altItemName, model, rec, recMeta );
                        }
                        // next try a parent model if any
                        rec = null;
                        if ( value === null ) {
                            parentM = model.getOption( "parentModel" );
                            parentID = model.getOption( "parentRecordId" );
                            if ( parentM && parentID ) {
                                model = apexModel.get( parentM );
                                if ( model ) {
                                    models.push( parentM );
                                    rec = model.getRecord( parentID );
                                    recId = model.getRecordId( rec );
                                    recMeta = null;
                                    if ( recId ) {
                                        recMeta = model.getRecordMetadata( recId );
                                    }
                                }
                            } else if ( modelStackIndex > 0 ) {
                                modelStackIndex -= 1;
                                msf = modelStack[modelStackIndex];
                                model = msf.model;
                                rec = msf.record;
                                recMeta = msf.recMeta;
                            }
                        }
                    } else {
                        rec = null;
                        fields = model.getOption( "fields" );
                        if ( fields[itemName].hasOwnProperty( "escape" ) ) {
                            defaultEscape = fields[itemName].escape ? "HTML" : "RAW";
                        }
                        if ( fields[itemName].hasOwnProperty( "elementId" ) ) {
                            elementId = fields[itemName].elementId;
                            item = apexItem( elementId );
                        }
                    }
                }
                for ( i = 0; i < models.length; i++ ) {
                    apexModel.release( models[i] );
                }
            }
            // if still no value found then check built-in substitutions
            if ( value === null && pOptions.includeBuiltinSubstitutions ) {
                value = gPageTemplateData[itemName] || null;
            }
            // if still no value found then check extra substitutions
            if ( value === null && pOptions.extraSubstitutions ) {
                value = pOptions.extraSubstitutions[itemName] || null;
            }
            if ( value === null ) {
                value = "";
            } else {
                if ( typeof value === "object" && value.hasOwnProperty( "v" ) ) {
                    value = value.v;
                }
                if ( typeof value !== "string" && ( escFilter || !raw ) ) {
                    // if there is an escape filter then must have a string otherwise
                    // still force a string unless raw is true.
                    if ( isArray( value ) ) {
                        let sep = ":";
                        if ( item ) {
                            sep = item.getSeparator();
                        }
                        value = value.join( sep );
                    } else {
                        value = "" + value;
                    }
                }
                if ( escFilter !== false ) {
                    if ( !escFilter ) {
                        escFilter = defaultEscape;
                    }
                    if ( escFilter === "HTML" ) {
                        value = escapeHTML( value );
                    } else if ( escFilter === "ATTR" ) {
                        value = escapeHTMLAttr( value );
                    } else if ( escFilter === "STRIPHTML" ) {
                        value = escapeHTML( util.stripHTML( value.replace( "&nbsp;", "" ) ) );
                    } else if ( escFilter !== "RAW" && escFilter ) {
                        throw new Error( "Invalid template filter: " + escFilter );
                    }
                }
            }
            return value;
        }

        function dataOrPlaceholderValue( name, raw ) {
            var placeholders = pOptions.placeholders;

            if ( phNameRE.test( name ) ) {
                if ( pArgs && pArgs[name] !== undefined ) {
                    return pArgs[name];
                }

                if ( placeholders && placeholders[name] !== undefined ) {
                    return placeholders[name];
                }
            }
            return v( name, false, raw );
        }

        function resolvePlaceholder( name ) {
            // first check if there is an actual argument for this name
            if ( pArgs && pArgs[name] !== undefined ) {
                return pArgs[name];
            } // else
            return pOptions.placeholders[ph];
        }

        function substitute( fragment ) {
            return fragment.replace( SUBST_RE, ( m, _1, itemName, itemQName, _2, escFilter ) => {
                var value = "";

                if ( itemQName ) {
                    itemName = itemQName;
                }
                if ( itemName ) {
                    value = v( itemName, escFilter );
                }
                return value;
            });
        }

        function lookAhead( index, match, inc, dec ) {
            var i, t, name,
                level = 0;

            for ( i = index; i < tokens.length; i++ ) {
                t = tokens[i];
                name = t.name;
                if ( t.type === "directive" ) {
                    if ( match[name] && level === 0 ) {
                        break;
                    } else if ( name === inc ) {
                        level += 1;
                    } else if ( name === dec ) {
                        level -= 1;
                    }
                }
                // just in case
                if ( level < 0 ) {
                    break;
                }
            }
            return i;
        }

        function processToken( tokenIndex ) {
            var t = tokens[tokenIndex];
            tokenIndex += 1;
            if ( t.type === "text" ) {
                // skip whitespace after a directive.
                if ( !( lastTokenType === "directive" && t.text.trim() === "" ) ) {
                    result += substitute( t.text );
                    lastTokenType = t.type;
                }
            } else if ( t.type === "ph" ) {
                result += t.value;
                lastTokenType = t.type;
            } else if ( t.type === "directive" ) {
                directive = directives[t.name];
                if ( directive ) {
                    lastTokenType = t.type;
                    tokenIndex = directive( tokenIndex, t.arg );
                } else {
                    // an unknown directive is just text
                    result += substitute( t.text );
                    lastTokenType = "text";
                }
            }
            return tokenIndex;
        }

        pOptions = $.extend( {
            placeholders: null,
            directives: true,
            defaultEscapeFilter: "HTML",
            includePageItems: true,
            model: null,
            record: null,
            extraSubstitutions: {},
            includeBuiltinSubstitutions: true,
            falseValues: ["F", "f", "N", "n", "0"]
        }, pOptions || {} );

        if ( pOptions.model && pOptions.record ) {
            let recMeta = null,
                model = pOptions.model,
                record = pOptions.record,
                recordId = model.getRecordId( record );

            if ( recordId ) {
                recMeta = model.getRecordMetadata( recordId );
            }
            modelStack.push( {model: model, record: record, recMeta: recMeta} );
        }

        // initialize page substitution tokens just once when needed
        if ( !gPageTemplateData && pOptions.includeBuiltinSubstitutions ) {
            gPageTemplateData = {
                "APP_ID": $v( "pFlowId" ),
                "APP_PAGE_ID": $v( "pFlowStepId" ),
                "APP_SESSION": $v( "pInstance" ),
                "REQUEST": $v( "pRequest" ),
                "DEBUG": $v( "pdebug" ),
                "IMAGE_PREFIX": window.apex_img_dir || ""
            };
        }

        // tokenize the source template
        if ( ( pArgs || pOptions.directives ) && pOptions.placeholders === null ) {
            pOptions.placeholders = {};
        }
        doPlaceholders = pOptions.placeholders !== null;
        doDirectives = pOptions.directives;
        if ( doPlaceholders || doDirectives ) {
            src = pTemplate;
            m = hashOrDirectiveRE.exec( src );
            pos = m ? m.index : -1;
            lastPos = 0;
            while ( m ) {
                ph = m[1];
                dir = m[2];
                if ( m[0] === "{{/}" ) {
                    // this is a escape for lone { char
                    tokens.push( {
                        type: "text",
                        text: src.substring( lastPos, pos ) + "{"
                    } );
                    lastPos = pos + m[0].length;
                } else if ( ph && doPlaceholders ) {
                    value = resolvePlaceholder( ph );
                    if ( value !== undefined ) { // empty string is still a value to substitute.
                        if ( pos > lastPos ) {
                            // add any text before the placeholder
                            tokens.push( {
                                type: "text",
                                text: src.substring( lastPos, pos )
                            } );
                        }
                        // add placeholder
                        tokens.push( {
                            type: "ph",
                            text: m[0],
                            value: value
                        } );
                    } else {
                        // the text before the placeholder and placeholder are all just text
                        tokens.push( {
                            type: "text",
                            text: src.substring( lastPos, pos + ph.length + 2 )
                        } );
                        // backup one
                        hashOrDirectiveRE.lastIndex -= 1;
                    }
                    lastPos = pos + m[0].length;
                } else if (dir && doDirectives ) {
                    if ( pos > lastPos ) {
                        // add any text before the directive
                        tokens.push( {
                            type: "text",
                            text: src.substring( lastPos, pos )
                        } );
                    }
                    m2 = directiveRE.exec( dir );
                    if ( m2 ) {
                        // add the potential directive. include the text just in case it isn't a recognized directive
                        tokens.push( {
                            type: "directive",
                            text: m[0],
                            name: m2[1].trim().toLowerCase(), // directives are not case sensitive
                            arg: ( m2[2] || "" ).trim()
                        } );
                    } else {
                        // treat something that looks like a directive but isn't as static text
                        tokens.push( {
                            type: "text",
                            text: m[0]
                        } );
                    }
                    lastPos = pos + m[0].length;
                }
                // else no token was added so don't advance lastPos
                m = hashOrDirectiveRE.exec( src );
                pos = m ? m.index : -1;
            }
            if ( src.length > lastPos ) {
                tokens.push( {
                    type: "text",
                    text: src.substring( lastPos )
                } );
            }
        } else {
            tokens.push({
                type: "text",
                text: pTemplate
            });
        }

        result = "";
        tokenIndex = 0;
        lastTokenType = null;
        while ( tokenIndex < tokens.length ) {
            tokenIndex = processToken( tokenIndex );
        }
        if ( ifStack.length > 0 || caseStack.length > 0 || loopStack.length > 0 ) {
            debug.error( "applyTemplate missing 'endif', 'endcase', or 'endloop'" );
        }

        // Templates are trusted. They should only come from the developer. However in no case should script
        // tags be allowed. There is just no reasonable use case for this. Scripts should be added to the page
        // in other ways and generally by the server.
        while ( scriptRE.test( result ) ) {
            result = result.replace( scriptRE, "" );
        }
        return result;
    },

    /**
     * Given a template string return an array of all the item or column names (data substitutions) in it.
     * todo doc
     * @ignore
     * @param {string} pTemplate A template string suitable for {@link apex.util.applyTemplate}.
     * @returns {string[]}
     */
    extractTemplateDependencies: function( pTemplate ) {
        var m, name,
            names = []; // convention for pseudo property access name%prop

        m = SUBST_RE.exec( pTemplate );
        while ( m ) {
            name = m[2] || m[3];
            names.push( name );
            // todo make sure there is an item or column?, check/remove suffix?
            // current thinking is that the property access should be included. consider an object {item: name, property: propName}
            m = SUBST_RE.exec( pTemplate );
        }
        return names;
    }
    };

    util.escapeHTMLContent = escapeHTMLContent;
    util.escapeHTMLAttr = escapeHTMLAttr;

    return util;

})( apex.jQuery, apex.debug );
