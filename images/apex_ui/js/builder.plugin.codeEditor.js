/*global apex*/
/**
 * @fileOverview
 * The {@link apex.builder.plugin}.codeEditor is used for the code editor widget of Oracle Application Express.
 * Used by both the Code Editor and CLOB Code Editor plugins.
 * Copyright (c) 2013, 2020, Oracle and/or its affiliates. All rights reserved.
 **/

(function ( plugin, item, server, $, util ) {
    "use strict";

    /**
     * @param {String} pSelector  jQuery selector to identify APEX page item for this widget.
     * @param {Object} [pOptions]
     *
     * @function codeEditor
     * @memberOf apex.builder.plugin
     * */
    plugin.codeEditor = function ( pSelector, pOptions ) {

        var editor$ = $( pSelector ),
            sourceElem = editor$.children( 'textarea' )[ 0 ],
            sourceElem$ = $( sourceElem ),
            itemName, lDeferred,
            validationFunction, queryBuilderFunction, codeCompleteFunction,
            preferencesChangedFunction, onInitializedFunction,
            language;

        if ( sourceElem && sourceElem.id ) {
            itemName = sourceElem.id;

            lDeferred = item.create( itemName, {
                delayLoading: true,
                setValue: function ( value ) {
                    editor$.codeEditor( 'setValue', value );
                },
                getValue: function () {
                    return editor$.codeEditor( 'getValue' );
                },
                setFocusTo: function () {
                    // this should return the jQuery object to set focus to but the codeEditor widget doesn't work that way
                    // so do what must be done
                    editor$.codeEditor( 'focus' );
                    // and return fake object with focus method to keep caller happy
                    return { focus: function () { } };
                }
            });
        }

        if ( pOptions.language ) {
            language = pOptions.language;
        } else if ( pOptions.modeBasedOnItem ) {

            function sanatizeMode( mode ){
                var modeLower = mode.toLowerCase();
                
                if ( modeLower.indexOf( 'sql' ) > -1 ) {
                    return 'sql';
                } else if ( modeLower === 'javascript' ) {
                    /* in the case of a dependent code editor, picking JavaScript is always the MLE version */
                    return 'mle-javascript';
                } else {
                    return modeLower();
                }
            }

            language = sanatizeMode( $v( pOptions.modeBasedOnItem ) );

            $( '#' + util.escapeCSS( pOptions.modeBasedOnItem ) ).on( 'change', function () {
                editor$.codeEditor( 'option', 'language', sanatizeMode( $v( pOptions.modeBasedOnItem ) ) );
            });

        } else {
            throw new Error( 'Either a language mode or a Page Item which holds the language must be provided' );
        }

        // Make the height of the editor the same as the textarea it replaces.
        editor$.height( sourceElem$.height() + 80 ); // include room for the toolbar
        sourceElem$.hide();

        if ( pOptions.validate && !pOptions.readOnly ) {
            validationFunction = function ( code, callback ) {

                server.plugin( pOptions.ajaxIdentifier, {
                    x01: "validate",
                    x02: pOptions.appId,
                    x09: ( pOptions.itemRemoteDB === "" ? null : $v( pOptions.itemRemoteDB ) ),
                    x10: pOptions.modeBasedOnItem ? $v( pOptions.modeBasedOnItem ) : null, // in case the mode is based on a page item
                    p_clob_01: code
                }, {
                    success: function ( data ) {
                        if ( data.result === "OK" ) {
                            callback({
                                errors: []
                            });
                        } else {
                            callback({
                                errors: [ data.result ]
                            });
                        }
                    }
                });
            };
        }

        if ( pOptions.queryBuilder ) {
            queryBuilderFunction = function ( editor, code ) {
                if ( !pOptions.itemRemoteDB || pOptions.itemRemoteDB === "" ) {
                    apex.navigation.popup({
                        url: apex.util.makeApplicationUrl({
                            appId: 4500,
                            pageId: 1002,
                            clearCache: 1002,
                            itemNames: [ "P1002_RETURN_INTO", "P1002_POPUP", "P1002_SCHEMA" ],
                            itemValues: [ editor.baseId, "1", pOptions.parsingSchema ]
                        }),
                        width: 950,
                        height: 720
                    });
                } else {
                    apex.message.alert( apex.lang.formatMessage( "WWV_FLOW_BUILDER.REMOTESQL.QUERY_BUILDER_NOT_SUPPORTED" ) );
                }
            };
        }

        // only used when in sql mode
        // even if the editor is initialized with another mode,
        // we provided just in case it is later change to sql, for example via modeBasedOnItem
        codeCompleteFunction = function ( pSearchOptions, pCallback ) {
            if ( $v( pOptions.itemRemoteDB ) === '' ) {
                server.plugin( pOptions.ajaxIdentifier, {
                    p_widget_name: pSearchOptions.type,
                    x01: 'hint',
                    x02: pOptions.appId,
                    x03: pSearchOptions.search,
                    x04: pSearchOptions.parent,
                    x05: pSearchOptions.grantParent
                }, {
                    success: pCallback
                });
            } else {
                console.log( apex.lang.formatMessage( 'WWV_FLOW_BUILDER.REMOTESQL.CODE_COMPLETION_NOT_SUPPORTED' ) );
            }
        };

        preferencesChangedFunction = function () {
            var settings = $( this ).codeEditor( 'getPreferencesString' );

            server.plugin(pOptions.ajaxIdentifier, {
                x01: 'save',
                x02: pOptions.appId,
                x03: settings
            }, {
                queue: { name: 'codeEditor_save_settings', action: 'lazyWrite' },
                dataType: ""
            });
        };

        onInitializedFunction = function () {
            // only if an the item interface was implemented
            if (itemName) {
                lDeferred.resolve();
            }
        };

        // Initialize the editor
        editor$.codeEditor( $.extend({
            language: language,
            value: sourceElem ? $( sourceElem ).val() : '',
            readOnly: pOptions.readOnly,
            ariaLabel: pOptions.ariaLabel,
            codeComplete: codeCompleteFunction,
            validateCode: validationFunction,
            queryBuilder: ( ( pOptions.itemRemoteDB && pOptions.itemRemoteDB !== "" ) ? false : queryBuilderFunction ),
            preferencesChanged: preferencesChangedFunction,
            onInitialized: onInitializedFunction,
        }, $.apex.codeEditor.preferencesObjectFromString( pOptions.settings || "" ) ) );


        if ( pOptions.adjustableHeight ) {
            editor$.wrap( "<div class='a-CodeEditor--resizeWrapper'></div>" ).parent().resizable({
                handles: 's',
                helper: 'a-CodeEditor--resizeHelper',
                minHeight: 100,
                maxHeight: 1000
            }).on('resizestop', function ( e, ui ) {
                var w$ = $( this ),
                    e$ = $( this ).children().eq( 0 );

                e$.height( w$.height() );
                e$.trigger( 'resize' );
            });

            // handling key up/down on the resize handle
            editor$.parent().find( '.ui-resizable-handle.ui-resizable-s' ).attr( 'tabindex', 0 ).on( 'keydown', function ( e ) {
                if ( e.which === $.ui.keyCode.UP || e.which === $.ui.keyCode.DOWN ) {
                    var h;
                    var w$ = $( this ).parent();

                    if ( e.which === $.ui.keyCode.UP ) {
                        h = w$.height() - 10;
                    } else {
                        h = w$.height() + 10;
                    }

                    h = Math.max(h, 100);
                    h = Math.min(h, 1000);

                    w$.height(h).trigger( 'resizestop' );
                    e.preventDefault();
                }
            });
        }

        apex.widget.util.onVisibilityChange( $( '#' + util.escapeCSS( itemName ) + '_CONTAINER' )[ 0 ], function( pShow ) {
            if ( pShow ) {
                // In the case of show, we need to trigger a resize on the editor widget (otherwise the editing area cannot
                // size itself properly and therefore appears to be readonly)
                editor$.trigger( 'resize' );
            }
        });

    }; // codeEditor

    /**
     * Save the code editor data using an ajax process. Useful for clob code editor plugin because the data can
     * span more than one fnn parameter. The process is assumed to return 204 no data.
     *
     * @param pSelector identifies the code editor
     * @param pProcess name of the server process to call that will save the data
     * @param pName the data property/parameter name typically "f01"
     * @param pOtherData optional object with other data for server.process
     * @returns jaXHR object
     */
    plugin.codeEditor.saveProcess = function ( pSelector, pProcess, pName, pOtherData ) {
        var code,
            data = pOtherData ? $.extend( true, {}, pOtherData ) : {};

        code = $( pSelector ).codeEditor( 'getValue' );
        if ( code.length <= 4000 ) {
            data[ pName ] = code;
        } else {
            data[ pName ] = [];
            while ( code.length > 4000 ) {
                data[ pName ].push( code.substr( 0, 4000 ) );
                code = code.substr( 4000 );
            }
            data[ pName ].push( code.substr( 0, 4000 ) );
        }

        return server.process( pProcess, data, {
            dataType: '',
            loadingIndicator: pSelector,
            loadingIndicatorPosition: 'page'
        });
    };

    /**
     * Save the code editor data and submit the page. Useful for clob code editor plugin because the data can
     * span more than one fnn parameter.
     *
     * @param pSelector identifies the code editor
     * @param pName the data property/parameter name typically "f01"
     * @param pOptions same options as for apex.page.submit
     * @returns jaXHR object
     */
    plugin.codeEditor.saveSubmit = function ( pSelector, pName, pOptions ) {
        var code,
            formName = pOptions.form || "wwv_flow",
            form$ = $( "form[name='" + util.escapeHTMLAttr( formName ) + "']", apex.gPageContext$ );

        function addInput(value) {
            form$.append( "<input type='hidden' name='" + util.escapeHTMLAttr( pName ) + "' value = '" + apex.util.escapeHTML( value ) + "'>" );
        }

        code = $(pSelector).codeEditor( "getValue" );
        if ( code.length <= 4000 ) {
            addInput( code );
        } else {
            while ( code.length > 4000 ) {
                addInput( code.substr( 0, 4000 ) );
                code = code.substr( 4000 );
            }
            addInput( code.substr( 0, 4000 ) );
        }
        apex.page.submit( pOptions );
    };

    $( function () {
        $( document.body ).on( 'codeeditorpreferenceschanged', function ( event ) {
            var changed$ = $( event.target ),
                settings = $.apex.codeEditor.preferencesObjectFromString( changed$.codeEditor( 'getPreferencesString' ) );

            // when one code editor changes its settings update all the others
            $( '.a-MonacoEditor' ).each( function () {
                if ( this !== event.target ) {
                    $(this ).codeEditor( 'option', settings );
                }
            });
        });

    });

})( apex.builder.plugin, apex.item, apex.server, apex.jQuery, apex.util );
