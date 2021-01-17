/* BEGIN FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */
// Removed "use strict" to be consistent with other apex modules
/* END FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */

/* BEGIN FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
// Added the $ parameter to avoid errors of $ not being defined
( function( utr, $, debug) {
/* END FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
    /* BEGIN FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */
    // Done this way an not with debug.message or debug.info to record the name
    // of the VM file loaded into the console so we can access the file easily
    if ( debug.getLevel() !== debug.LOG_LEVEL.OFF ){
        console.log( 'Theme Roller: utr-base.js file loaded' );
    }
    /* END FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */

    if (!utr) {
        utr = window.apex.utr = {
            busy: false,
            opened: false,
            invoke: undefined,
            close: undefined,
            nested: false
        };
    }
    function getCustomCSSOutput() {
        return $('style[id="utr_custom-css-output"]').html();
    }
    function getLessOutput() {
        return $('style[id="utr_less-output"]').html();
    }
    function setCustomCSSOutput(output) {
        var utrCustomCSSOutput = $('style[id="utr_custom-css-output"]');
        if(utrCustomCSSOutput.length > 0){
            utrCustomCSSOutput.empty();
        } else {
            utrCustomCSSOutput = $(document.createElement("style"))
                .attr("id", "utr_custom-css-output");
            $('link[media="utr-disabled"], style[id="utr_less-output"]').last()
                .after(utrCustomCSSOutput);
        }
        utrCustomCSSOutput.text(output);
        propagate('setCustomCSSOutput', output);
    }
    function destroyCustomCSSOutput() {
        $('style[id="utr_custom-css-output"]').first().remove();
        propagate('destroyCustomCSSOutput');
    }
    function setLessOutput(output) {
        var lessOutput = $('style[id="utr_less-output"]');
        var lastDisabledStylesheet = $('link[media="utr-disabled"]').last();
        if (lessOutput.length > 0) {
            lessOutput.empty();
        } else {
            lessOutput = $(document.createElement("style"))
                .attr("id", "utr_less-output");
            if (lastDisabledStylesheet.length > 0) {
                lastDisabledStylesheet.after(lessOutput);
            } else {
                $('head').append(lessOutput);
            }
        }
        lessOutput.html(output);
        propagate('setLessOutput', output);
    }
    function destroyLessOutput() {
        $('style[id="utr_less-output"]').first().remove();
        propagate('destroyLessOutput');
    }
    function isInUrlList(urls, url){
        for (var i=0; i<urls.length; i++) {
            if (url === urls[i] || url === urls[i].replace(/\.css\?/, '.min.css?')) return true;
        }
        return false;
    }
    function enableCurrentStylesheets(urls) {
        if (urls === undefined) {
            urls = currentThemeStylesheets;
        }
        $('link')
            .filter(function(i, e) {
                return isInUrlList(urls, $(e).attr('href'));
            })
            .removeAttr("media");
        propagate('enableCurrentStylesheets', urls);
    }
    var LCSURLS;
    function disableCurrentStylesheets(urls) {
        if (urls === undefined) {
            urls = currentThemeStylesheets;
        }
        LCSURLS = urls;
        $('link')
            .filter(function(i, e) {
                return isInUrlList(urls, $(e).attr('href'));
            })
            .attr("media", "utr-disabled");
        propagate('disableCurrentStylesheets', urls);
    }
    var LISURLS;
    function importStyleSheets(urls) {
        LISURLS = urls;
        var l;
        var insertBefore = $('link[media="utr-disabled"], style[id="utr_less-output"]').first();
        for (var i = 0; i < urls.length; i++) {
            l = $(document.createElement('link'))
                .attr({
                    'rel': 'stylesheet',
                    'href': urls[i],
                    'class': 'utr-stylesheet'
                });
            if (insertBefore.length > 0) {
                insertBefore.before(l);
            } else {
                $('head').append(l);
            }
        }
        propagate('importStyleSheets', urls);
    }
    function removeStylesheets() {
        $('link.utr-stylesheet').remove();
        propagate('removeStylesheets');
    }
    utr.setCustomCSSOutput = setCustomCSSOutput;
    utr.setLessOutput = setLessOutput;
    utr.destroyCustomCSSOutput = destroyCustomCSSOutput;
    utr.destroyLessOutput = destroyLessOutput;
    utr.enableCurrentStylesheets = enableCurrentStylesheets;
    utr.disableCurrentStylesheets = disableCurrentStylesheets;
    utr.importStyleSheets = importStyleSheets;
    utr.removeStylesheets = removeStylesheets;
    utr.children = [];
    utr.nest = function(child) {
        if (utr.children.indexOf(child) < 0) {
            utr.children.push(child);
            child.opened = utr.opened;
            if (utr.opened) {
                propagate('disableCurrentStylesheets', LCSURLS);
                propagate('importStyleSheets', LISURLS);
                propagate('setLessOutput', getLessOutput());
                propagate('setCustomCSSOutput', getCustomCSSOutput());
            }
        }
    };
    function propagate(fn, args) {
        for (var i = utr.children.length - 1; i >= 0; i--) {
            utr.children[i][fn](args);
        }
    }

    // Less.js plugins and configuration

    utr.less = {};
    utr.less.pluginFactories = {};
    /**
     * A plugin factory for Theme Roller's Less.js getComments plugin
     *
     * @param Object   options                   The options passed to the plugin generator/factory
     * @param Array    options.comments          An array to hold the comments found by the plugin
     * @param boolean  options.trim              Trim the comments found by the plugin
     * @param boolean  options.parseJson         Parse the comments as JSON (After Trim)
     * @param function options.commentsFilter    A function receiving the trimmed and JSON-parsed
     *                                           value of the comments passed to the function.
     *                                           The function should return either 'true' to save
     *                                           the comment or 'false' not to save it in the 
     *                                           comments variable passed
     *
     * @returns Object An object containing a '_main' and an 'install' properties which installs a
     *                 Less.js visitor plugin
     */
    utr.less.pluginFactories.getCommentsFactory = function( pOptions ){
        // The Array to which the visited and filtered comments will be stored
        var lComments = pOptions && typeof pOptions.comments === 'object' && Array.isArray( pOptions.comments ) ? pOptions.comments : undefined;
        // If no variable is passed into which the comments are saved then return an error
        if( lComments !== undefined ){
            // Obtain the trim option and set its value to an internal variable. If trim is not found in the options the the value of the variable will be 'false'
            var lTrim = pOptions && pOptions.trim ? !!pOptions.trim : false;
            // Obtain the parseJson option and set it to a variable, 
            var lParseJson = pOptions && pOptions.parseJson ? !!pOptions.parseJson : false;
            // Obtain the commentsFilter option and set it to a variable, if commentsFilter is a function then use it, else use a gener
            var lCommentsFilter = pOptions && typeof pOptions.commentsFilter === 'function' ? pOptions.commentsFilter : function(){
                // Collect all comments by default
                return true;
            };

            /**
             * @param Object  commentNode          The comment as a less tree node
             * @param Object  options              The object containing the function configuration
             * @param Boolean options.trim         Wether to trim the comment value obtained from the commentNode or not
             * @param Boolean options.parseJson    Wether to attempt to parse the comment value as a JSON string or not
             * @return Object|string Either an object (Array or Object) if the parseJson was true and the JSON parsing 
             *                       succedded or a string, empty or otherwise if the parseJson was false or failed
             */
            var lGetCommentValue = function( commentNode, options ){
                // The variable storing the result
                var lResult;
                // The variable holding the contents of the comment
                var lCommentValue;
                
                // According to the less code, inline comments are denoted by // and non-inline comments are wrapped by
                // /* and */
                if( commentNode.isLineComment ){
                    // Rempve two slashes '//' from the beginning of the string
                    lCommentValue = commentNode.value.replace(/^\/\//, '');
                } else {
                    // Rempve '/*' from the beginning of the string and '*/' from the end of the string
                    lCommentValue = commentNode.value.replace(/(^\/\*)|(\*\/$)/g, '');
                }

                // Trim the comment value
                if( options && !!options.trim ){
                    lCommentValue = lCommentValue.trim();
                }

                // Parse the potentially trimmed comment value as JSON
                if( options && !!options.parseJson ){
                    try {
                        lResult = JSON.parse( lCommentValue );
                    } catch( e ) {
                        lResult = lCommentValue;
                    }
                } else {
                    lResult = lCommentValue
                }

                return lResult;
            };

            /**
             * The main plugin function
             * @param Object context The less.js context, normally the whole less object is passed in here at first
             */
            var lGetComments = function( context ){
                // Inherit a less Visitor by creating a new visitor object that uses this new one
                this._visitor = new less.visitors.Visitor( this );
                // Save the context which was passed to us
                this._context = context;
            };
            // The function's prototype
            lGetComments.prototype = {
                // This function should not modify the less tree but only read it
                isReplacing: false,
                // This function should run before all other visitors and before the less context evaluation
                isPreEvalVisitor: true,
                // Tells if the function should run before running the native visitors or not
                isPreVisitor: false,
                // The actual run function
                /**
                 * @param Object root The less document at first and then recursively traverse the node tree
                 */
                run: function( root ){
                    // Use the core less Visitor visit function
                    return this._visitor.visit( root );
                },
                /**
                 * The comment visiting function. Less.js' tree has several types of nodes,
                 * like rules, urls, comments, etc and a visitor plugin can define several
                 * functions in its prototype previxed by the word `visit`and followed by
                 * the name of the type of node that they want to visit. In this case,
                 * visitComment will only visit Less.js nodes that are Comments
                 * @param Object commentNode The Less-js object representing the node
                 * @param visitArgs          Not sure what it is for
                 * @returns Object The comment node that it received. Or, if the plugin
                 *                 is replacing nodes in the tree, then the node
                 *                 be replacing the passed node
                 */
                visitComment: function( commentNode, visitArgs ){
                    // Get the passed comment value using the function that we declared earlier
                    var lCommentContents = lGetCommentValue( commentNode, {
                        trim: lTrim,
                        parseJson: lParseJson
                    } );
                    
                    // Once the value is potentially trimmed and parsed, then check if the 
                    // comment meets the requirements established by the passed comments filter
                    // function and if so then push it into the given array
                    if( lCommentsFilter( lCommentContents ) ){
                        lComments.push( lCommentContents );
                    }

                    return commentNode;
                }
            };

            // The object to be returned for less to receive it
            var lGetCommentsPlugin = {
                // Export the visitor sub-plugins in '_visitors'
                _visitors: [
                    lGetComments
                ]
            };
            // Add an install function to import the resulting object as a less plugin
            lGetCommentsPlugin.install = function( less, pluginManager ){
                pluginManager.addVisitor( new lGetCommentsPlugin._visitors[0]( less ) );
            };

            return lGetCommentsPlugin;
        } else {
            // If an array was not passed in the options the throw an exception
            throw 'ERROR: apex.utr.less.pluginFactories.getCommentsFactory: comments option is mandatory and an array must be supplied';
        }
    };
    /**
     * A plugin factory for Theme Roller's getVariables plugin
     *
     * @param  {Object}  options                    The options passed to the
     *                                              plugin generator/factory
     * @param  {Object}  options.variables          An object to hold the
     *                                              variables found by the
     *                                              plugin
     * @param  {Array|function}  options.seedVariableNames  An array of strings
     *                                                      or a function 
     *                                                      returning an array
     *                                                      of strings 
     *                                                      containing less
     *                                                      variable names
     *                                                      (With the @ symbol)
     *                                                      which will be added
     *                                                      and populated
     *                                                      inside of the
     *                                                      options.variables
     *                                                      object. Note that
     *                                                      if the variable
     *                                                      doesn't exist, this
     *                                                      will cause an error
     *                                                      in the less
     *                                                      compilation
     *
     * @returns  Object An object containing a '_main' and an 'install'
     *           properties which installs a visitor Less.js plugin
     *
     * @todo  Be able to support variables added at evaluation time
     *        Right now the getVariablesFactory uses two visitors:
     *        - A pre-eval visitor to collect the names of the variables less
     *          has in its context before evaluating special less constructs
     *          and functions into a CSS rule string named _less_variables.
     *          Such rule gets appended to the current LESS code to be
     *          processed later on
     *        - A visitor which observes all of the less rules and looks for
     *          the _less_variables rule added by the pre-eval visitor so that
     *          it can traverse its attributes to obtain the variable values.
     *        The problem with this approach is that there might be the case
     *        where a variable is added to the LESS context AFTER the
     *        LESS evaluation, by a function, for example, and therefore, it
     *        won't be part of the _less_variables rule because the pre-eval
     *        visitor didn't add it in the first place.
     *        The ideal scenario would be to change the pre-eval visitor to be
     *        a normal visitor, the problem with this is that even when I tried
     *        to make it so, the rules appended after the LESS evaluation are
     *        not visited anymore by any other plugin. The other problem is
     *        that variable values from LESS will contain their LESS
     *        expressions which cannot be converted to less directly, not even
     *        by using the toCSS function in them
     *        There are two workarounds for this:
     *        - Declare the variables for which a function will set their value
     *          empty on the global scope and set their value with the function
     *          so that they are available on the LESS scope at pre-evaluation
     *        - Use the seedVariable names option on this plugin to provide a
     *          pre-defined set of variable names which will be populated once
     *          the visitor executes. The problem here is that if for some
     *          reason the variables are expected and not set, there will be a
     *          LESS compilation error
     */
    utr.less.pluginFactories.getVariablesFactory = function( pOptions ){
        var lVariablesRuleSetName = '_less_variables';
        /* BEGIN FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */
        // Fixed some jshint errors regarding symbol position
        var lVariables = pOptions &&
                typeof pOptions.variables === 'object' &&
                !Array.isArray(pOptions.variables) ?
                    pOptions.variables
                :
                    undefined,
            // Added this to contain a preset of the variable names that this
            // plugin should return
            lSeedVariableNames = pOptions &&
                (
                    typeof pOptions.seedVariableNames === 'object' &&
                    Array.isArray(pOptions.seedVariableNames)
                ) || typeof pOptions.seedVariableNames === 'function' ?
                    pOptions.seedVariableNames
                :
                    [];
        /* END FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */

        if( lVariables !== undefined ){
            var lGetVariablesPreEvalVisitor = function( context ){
                this._visitor = new less.visitors.Visitor( this );
                this._context = context;
            };
            // This must be a pre-eval visitor because it inserts a ruleset
            // that is later visited by other plugins and if we make it a
            // pre-visitor or a visitor, other plugins will not be able to
            // traverse the inserted ruleset
            lGetVariablesPreEvalVisitor.prototype = {
                isReplacing: false,
                isPreEvalVisitor: true,
                isPreVisitor: false,
                run: function( root ){
                    // Obtain the Less document variable names from the root
                    // root.variables() obtains an object whose keys are the
                    // names of all the variables contained in the root
                    // We obtain an array containing strings with the names of
                    // the variables in the root
                    var lVariableNames = Object.keys( root.variables() );
                    /* BEGIN FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */
                    // Traverse the seed variable names
                    // If we were given a function then execute the function
                    // now and traverse the results of the function
                    (
                        typeof lSeedVariableNames === "function" ?
                                lSeedVariableNames.apply()
                            :
                                lSeedVariableNames
                    ).forEach( function( pSeedVariableName, pSeedVariableNameIndex, pSeedVariableNamesArray ){
                        // Check if the variable name is not in the lVariable
                        // names already
                        if ( lVariableNames.indexOf( pSeedVariableName ) === -1 ){
                            // If it was not in the lVariableNames, then insert
                            // it into it
                            lVariableNames.push( pSeedVariableName );
                        }
                    } );
                    /* END FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */

                    // Obtain an array of rules based on the variable names obtained before
                    var lRules = lVariableNames.map(function( pVariableName ){
                        // pVariableName contains the at (@) symbol at the beginning so we remove it doing substr(1) to it
                        // If our variable name was ''@test' then ruleName will be 'test'
                        var lRuleName = pVariableName.substr(1);
                        // The value of the rule will be the variable because what we want to do later is to parse the document and obtain the variable value instead of the variable name
                        var lRuleValue = pVariableName;
                        // We build a rule for the current variable
                        return lRuleName + ':' + lRuleValue + ';';
                    });
                    // Build a ruleset called _less_variables which will contain the rules we just created
                    var lRuleSet = lVariablesRuleSetName + '{' + lRules.join(' ') + '}';

                    // NOTE: DO NOT use the promise version of this function, otherwose it will become an asynchronous task
                    this._context.parse( lRuleSet, {}, function( error, output ){
                        root.rules.push( output.rules[0] );
                    } );

                    return this._visitor.visit( root );
                }
            };

            var lGetVariablesVisitor = function( context ){
                this._visitor = new less.visitors.Visitor( this );
                this._context = context;
            };
            lGetVariablesVisitor.prototype = {
                isReplacing: true,
                isPreEvalVisitor: false,
                isPreVisitor: false,
                run: function( root ){
                    return this._visitor.visit( root );
                },
                _lFlattenValue: function( pValue, pContext ){
                    // Save a reference to this
                    var lThat = this;

                    // If the value is a less Node
                    if( pValue instanceof less.tree.Node ){
                        // Keep values in arrays as arrays
                        // Check if the node contains a non undef property named value and if it is an array
                        if( pValue.value !== undefined && Array.isArray(pValue.value) ){
                            // If the array is only 1 element long
                            if( pValue.value.length == 1 ){
                                // Then just process the first element of it and discard the array
                                return lThat._lFlattenValue( pValue.value[0], pContext );
                            // If the array is more than 1 or 0 elements long, then
                            } else {
                                // Return a map of the processed values
                                return pValue.value.map( function( element ){
                                    return lThat._lFlattenValue( element, pContext );
                                } );
                            }
                        // If pValue.value is not an array and pValue contains a function toCSS
                        } else if( pValue.toCSS ){
                            // Process the value resulting from the toCSS transformation
                            return lThat._lFlattenValue( pValue.toCSS( pContext ), pContext );
                        // If pValue is does not have a toCSS but an eval function
                        } else if( pValue.eval ){
                            // Process the result from the evaluation
                            return this._lFlattenValue( pValue.eval( pContext ), pContext );
                        }
                    // If pValue is not a less node
                    } else {
                        // Process it plainly
                        return pValue;
                    }
                },
                visitRuleset: function( rulesetNode, visitArguments ){
                    var lThat = this;

                    if( rulesetNode.selectors
                        && rulesetNode.selectors[0]
                        && rulesetNode.selectors[0].elements
                        && rulesetNode.selectors[0].elements[0]
                        && rulesetNode.selectors[0].elements[0].value == lVariablesRuleSetName ){
                        rulesetNode.rules.forEach(function(rule){
                            lVariables[ '@' + rule.name ] = lThat._lFlattenValue(rule.value, new less.contexts.Eval({}));
                        });
                        return undefined;
                    } else {
                        return rulesetNode;
                    }
                }
            };

            var lGetVariablesPlugin = {
                _visitors: [
                    lGetVariablesPreEvalVisitor,
                    lGetVariablesVisitor
                ]
            };
            lGetVariablesPlugin.install = function( less, pluginManager ){
                pluginManager.addVisitor( new lGetVariablesPlugin._visitors[0]( less ) );
                pluginManager.addVisitor( new lGetVariablesPlugin._visitors[1]( less ) );
            };

            return lGetVariablesPlugin;
        }  else {
            // If an object was not passed in the options the throw an exception
            throw 'ERROR: apex.utr.less.pluginFactories.getVariablesFactory: variables option is mandatory and must be an object';
        }
    };
    /**
     * @param Boolean removeImportantComments Whether to remove comments begining with ! or not
     *                                        as long as they're catalogued as CSS comments
     */
    utr.less.pluginFactories.removeCommentsFactory = function( pRemoveImportantComments ){
        var lRemoveImportantComments = !!pRemoveImportantComments;

        var lRemoveComments = function( context ){
            this._visitor = new less.visitors.Visitor( this );
            this._context = context;
        };
        lRemoveComments.prototype = {
            isReplacing: true,
            isPreEvalVisitor: false,
            isPreVisitor: false,
            run: function( root ){      
                return this._visitor.visit( root );
            },
            visitComment: function( commentNode, visitArgs ){
                if ( !lRemoveImportantComments && commentNode.value.length >= 3 && commentNode.value.substr(2, 1) == '!' ){
                    return commentNode;
                } else {
                    return undefined;
                }
            }
        };

        var lRemoveCommentsPlugin = {
            _visitors: [
                lRemoveComments
            ]
        };
        lRemoveCommentsPlugin.install = function( less, pluginManager ){
            pluginManager.addVisitor( new lRemoveCommentsPlugin._visitors[0]( less ) );
        };

        return lRemoveCommentsPlugin;
    };

    // An analog function to the Theme Roller's less 1.7.0.compile function but with the needed Theme roller plugins
    // This is only the callback version of the function not the promise one
    utr.less.compile = function(pInput, pModifyVars, pSuccessCallback, pErrorCallback){
        // The arrays/objects on which we will save the values obtained by the Theme Roller Less plugins
        var lGroupsComments = [];
        var lVarComments = [];
        var lTranslateComments = [];
        var lVariables = {};

        // Initialize/Normalize the required Theme Roller values
        // If variables are already there then respect their values, otherwise initialize them
        utr.less.variables = utr.less.variables || {};
        utr.less.groups = utr.less.groups || [];
        // False by default
        utr.less.translate = !!utr.less.translate;

        // Default Less.js options object for Theme Roller
        var lOptions = {
            cache: !!pModifyVars || !!less.globalVars,
            globalVars: less.globalVars,
            modifyVars: pModifyVars,
            plugins: [
                utr.less.pluginFactories.getCommentsFactory({
                    // Pass the variable declared at the beginning of the document to this function
                    comments: lGroupsComments,
                    // Do trim the comments
                    trim: true,
                    // And try to parse them as JSON
                    parseJson: true,
                    // And filter the results using a function
                    // @param Object|string pCommentValue the value of the visited comment
                    commentsFilter: function( pCommentValue ){
                        // Only let pass Objects in the array
                        return typeof pCommentValue === 'object' 
                            // Except for the null object
                            && pCommentValue !== null 
                            // And arrays, which are also objects
                            && !Array.isArray( pCommentValue )
                            && (
                                // Only pass those JSON objects that contain `groups` as a property
                                pCommentValue.hasOwnProperty( 'groups' )
                            );
                    }
                }),
                utr.less.pluginFactories.getCommentsFactory({
                    comments: lVarComments,
                    trim: true,
                    parseJson: true,
                    commentsFilter: function( pCommentValue ){
                        return typeof pCommentValue === 'object' 
                            && pCommentValue !== null 
                            && !Array.isArray( pCommentValue )
                            && pCommentValue.hasOwnProperty( 'var' );
                    }
                }),
                utr.less.pluginFactories.getCommentsFactory({
                    comments: lTranslateComments,
                    trim: true,
                    parseJson: true,
                    commentsFilter: function( pCommentValue ){
                        return typeof pCommentValue === 'object' 
                            && pCommentValue !== null 
                            && !Array.isArray( pCommentValue )
                            && pCommentValue.hasOwnProperty( 'translate' );
                    }
                }),
                /* BEGIN FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */
                // This plugin MUST be positioned after the getCommentsFactory
                // ones, specially the one that deals with variable comments
                utr.less.pluginFactories.getVariablesFactory({
                    variables: lVariables,
                    // Added a function that retrieves the names of the
                    // variables obtained from the variable comments of the
                    // LESS stylesheet as the new seedVariableNames option
                    seedVariableNames: function(){
                        return lVarComments.map( function( pVarComment ){
                            return pVarComment.var;
                        } );
                    }
                }),
                /* END FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */
                utr.less.pluginFactories.removeCommentsFactory( false )
            ]
        };

        // Parse and render the less example as CSS
        less.render( pInput, lOptions, function(error, output){
            // At this point plugins were already executed and the variables set in their parameters should have already been filled

            if( error ){
                // Output the error to the console
                return pErrorCallback( error );
            }

            try {
                // An array containing the names of all registered groups
                var lAllGroups = utr.less.groups.map(function(group){
                    return group.name;
                });
                // Process the group comments
                lGroupsComments.forEach(function( groupComment, index, array ){
                    groupComment.groups.forEach(function( pGroup ){
                        // Merging the comment with the group default settings
                        var lGroup = jQuery.extend(true, {
                            // Show the group when seeing Theme Rollers common options
                            common: true
                        }, pGroup);
                        // Assuming the index in lAllGroups is the same as in the utr.less.groups array
                        var currentGroupIndex = lAllGroups.indexOf( lGroup.name );
                        // If the group has not been yet added to the groups
                        if( currentGroupIndex == -1 ){
                            // Add it to the array so next time it doesn't get duplicated
                            lAllGroups.push( lGroup.name );
                            // Add the full group to the actual array
                            utr.less.groups.push( lGroup );
                        // If the group already exists in the groups array
                        } else {
                            // Overwrite with the last value
                            utr.less.groups[currentGroupIndex] = lGroup;
                        }
                    });
                });
                // Process the var comments
                lVarComments.forEach(function( varComment, index, array ){
                    // Merging with the variable default settings
                    utr.less.variables[ varComment.var ] = jQuery.extend(true, {
                        // Show the variable when seeing common Theme Roller section
                        common: true,
                        sequence: 9999
                    }, varComment);
                    // Remove the var property from the resulting object as the variable name is the key in the utr.less.variables object
                    delete utr.less.variables[ varComment.var ].var;

                    // If the current variable has the group property set (Which all should) but the group to which it belongs doesn't exists in the group array
                    if( utr.less.variables[ varComment.var ].hasOwnProperty( 'group' ) 
                        && lAllGroups.indexOf( utr.less.variables[ varComment.var ].group ) == -1 ){
                        // Add it to the array so we don't register it more than once
                        lAllGroups.push( utr.less.variables[ varComment.var ].group );
                        // Add the new group to the actual groups array
                        utr.less.groups.push({
                            name: utr.less.variables[ varComment.var ].group,
                            common: true,
                            sequence: 9999
                        });
                    }
                });
                // Traverse all of the collected less variables (Not just theme roller linked ones)
                Object.keys( lVariables ).forEach(function( variableName ){
                    // If the variable exists in Theme Roller's less variables
                    if( utr.less.variables.hasOwnProperty( variableName ) ){
                        // Set the value in it to the collected value
                        utr.less.variables[ variableName ].value = lVariables[ variableName ];
                    }
                    // We ignore any other variable that's not linked to Theme Roller
                });
                // Process the translate comments
                lTranslateComments.forEach(function(translateComment, index, array){
                    utr.less.translate = !!translateComment.translate;
                });
                // Sort the groups by their sequence
                utr.less.groups.sort(function( a, b ){
                    return a.sequence - b.sequence;
                });

                // All of Theme Roller's less attributes was processed at this
                // point and can be read from apex.utr.less
            } catch(e) {
                return pErrorCallback(e);
            }

            // Execute the given callback passing only the css as that's what's expected
            pSuccessCallback( output.css );
        });
    };
/* BEGIN FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */
// Added apex.debug as we will print debug output
/* BEGIN FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
// Added jQuery as a parameter to avoid warnings of $ not being defined
})( window.apex.utr, apex.jQuery, apex.debug );
/* END FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
/* END FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */
