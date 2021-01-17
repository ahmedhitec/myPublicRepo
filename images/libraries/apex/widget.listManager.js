/*!
 widget.listManager.js
 Copyright (c) 2012, 2018, Oracle and/or its affiliates. All rights reserved.
 */
/*global apex,$x,$v,$s*/
/**
 * Implements behaviors for the APEX List Manager item type.
 */
(function( widget, $ ) {
"use strict";

var P_DISABLED = "disabled",
    A_ARIA_EXPANDED = "aria-expanded";

var keys = $.ui.keyCode;

/**
 * @param {String} pSelector jQuery selector to identify APEX page item(s) for this widget.
 * @param {Object} [pOptions]
 *
 * @function listManager
 * @memberOf apex.widget
 */
widget.listManager = function( pSelector, pOptions ) {

    // Default our options and store them with the "global" prefix, because it's
    // used by the different functions as closure
    var lInitialValue, lTheItem, lAllItems,
        lOptions = $.extend( {
                    dependingOnSelector:null,
                    optimizeRefresh:true,
                    pageItemsToSubmit:null
        }, pOptions ),
        lastOpenValue = "",
        forceRefresh = false,
        lListManager$ = $( pSelector, apex.gPageContext$ ),
        lListManagerAdd$ = $( pSelector + "_ADD", apex.gPageContext$ ),
        lButton$ = $( pSelector+"_ADD_lov_btn", apex.gPageContext$ ),
        lAddButton$ = lListManagerAdd$.closest("tr").find("[value='Add']"),
        /*
         * list manager uses the markup and popup dialog from popup lov
         * The popup lov sub field is always enterable, dialog. Always uses list view, no extra display columns,
         * no customizable title, height, width, no groups or icons etc. There is never a null return and display value.
         */
        lPopupOptions = {
            itemId: pSelector.substring(1) + "_ADD",
            ajaxIdentifier: pOptions.ajaxIdentifier,
            initialFetch: pOptions.initialFetch || "empty",
            isPopup: false,
            multiple: false,
            display: "list",
            height: 450,
            width: 500,
            minSearchChars: 0,
            columns: {
                "DISPLAY": {
                    seq: 10,
                    index: 0
                },
                "RETURN": {
                    seq: 20,
                    index: 1
                }
            },
            displayColumn: "DISPLAY",
            valueColumn: "RETURN"
        };

    lPopupOptions.initialSearch = "";
    forceRefresh = true; // this gets cleared by open
    if ( lOptions.pageItemsToSubmit || lOptions.dependingOnSelector ) {
        lAllItems = lOptions.pageItemsToSubmit || "";
        if ( lOptions.dependingOnSelector ) {
            if ( lAllItems.length > 0 ) {
                lAllItems += ",";
            }
            lAllItems += lOptions.dependingOnSelector;
        }
        lPopupOptions.itemsToSubmit = lAllItems.replace( /#/g, "" ).split( /\s*,\s*/ );
    }

    $( pSelector, apex.gPageContext$ ).each( function(){
        var self = this;

        // register callbacks
        apex.item.create( this.id, {
            enable: function() {
                // store fieldset dom element that contains all the list manager's elements
                var lFieldset = $x( self.id + '_fieldset' );

                // enable all the input elements
                $( ':input', lFieldset )
                    .prop( P_DISABLED, false )          // enable all input elements in the fieldset
                    .filter( '[type!=button]' )         // filter out buttons
                    .removeClass( 'apex_disabled' );    // and remove class from non buttons

                lButton$.prop( P_DISABLED, false );
            },
            disable: function() {
                // store fieldset dom element that contains all the list manager's elements
                var lFieldset = $x( self.id + '_fieldset' );

                // deselect all options first
                $( 'option:selected', $x( self.id ) ).prop( 'selected', false );

                // disable all the input elements
                $( ':input', lFieldset )
                    .prop( P_DISABLED, true )           // disable all input elements in the fieldset
                    .filter( '[type!=button]' )         // filter out buttons
                    .addClass( 'apex_disabled' );       // and add class to non buttons

                lButton$.prop( P_DISABLED, true );
            },
            hide: function() {
                $( '#' + self.id + '_fieldset', apex.gPageContext$ ).hide();
            },
            show: function() {
                $( '#' + self.id + '_fieldset', apex.gPageContext$ ).show();
            },
            setValue: function( pValue ) {
                var lValueArray,
                    lHtml = "";
                // only proceed with set if pValue is not undefined
                if ( typeof(pValue ) !== 'undefined' ) {
                    // set new value, we don't check if value exists here as the existing list manager
                    // allows any value to be added to the list
                    // create array from pValue
                    lValueArray = apex.util.toArray( pValue );
                    // loop through lValue array and build new options html string
                    $.each( lValueArray, function( key, value ) {
                        value = apex.util.escapeHTML( value );
                        lHtml += '<option value="' + value + '">' + value + '</option>';
                    } );
                    lListManager$                // select list manager
                        .find( 'option' )             // find options
                            .remove()                   // remove them
                            .end()                      // end option find
                        .append( lHtml );             // append new options
                }
            },
            getValue: function() {
                var lReturn = [];
                // iterate over list manager options and populate array with values
                $( 'option', lListManager$[0] ).each( function(){
                    lReturn.push( this.value );
                } );
                return lReturn;
            },
            isChanged: function() {
                return $v( lListManager$[0] ) !== lInitialValue;
            },
            addValue: function( pValue ) {
                var lItems = pValue.split( "," ), // List manage supports adding multiple, comma separated values
                    lItem, i,
                    lChanged = false,
                    lHtml = "";

                for ( i = 0; i < lItems.length; i++ ) {
                    lItem = $.trim( lItems[i] );
                    if ( lItem !== "" ) {
                        // If the value to be added doesn't already exist in the list manager, add it
                        // only double quotes need to be CSS escaped in the selector
                        if ( lListManager$.find( 'option[value="' + lItem.replace( /"/g, "\\\"" ) + '"]' ).length === 0 ) {
                            lItem = apex.util.escapeHTML( lItem );
                            lHtml = '<option value="' + lItem + '">' + lItem + '</option>';
                            lListManager$.append( lHtml );
                            lChanged = true;
                        }
                    }
                }

                // If a value has been added, trigger the change event
                if ( lChanged ) {
                    lListManager$.change();
                }
            },
            removeValue: function( pValue ) {
                var lChanged, lSelectedOptions$;

                if ( pValue ) {
                    // look through all the options for matching value
                    lListManager$.children().each( function() {
                        var opt$ = $( this );
                        if ( opt$.attr( "value" ) == pValue )  { // == intentional
                            opt$.remove();
                            lChanged = true;
                        }
                    } );
                    if ( lChanged ) {
                        lListManager$.change();
                    }
                } else {
                    lSelectedOptions$ = lListManager$.find( ":selected" );
                    // Only remove and trigger change event, if there is something selected
                    if ( lSelectedOptions$.length > 0 ) {
                        lSelectedOptions$.remove();
                        lListManager$.change();
                    }
                }
            },
            // Clears the existing values from the list manager fields and fires the before
            // and after refresh events
            refresh: function() {
                var modelName, model;

                // trigger the before refresh event
                lListManager$.trigger( 'apexbeforerefresh' );

                // remove everything
                lListManagerAdd$.val( "" );
                $( 'option', lListManager$ ).remove();
                lListManager$.change();

                // Clear the model
                modelName = lListManagerAdd$.data( "popupLovModelName" );
                if ( modelName ) {
                    model = apex.model.get( modelName );
                    if ( model ) {
                        model.setData( [] );
                        apex.model.release( modelName );
                    }
                }
                forceRefresh = true; // request that new data is fetched as needed next time popup is opened

                // trigger the after refresh event
                lListManager$.trigger( 'apexafterrefresh' );
            },
            getPopupSelector: function() {
                return ".ui-dialog-popuplov";
            }
        } );
        lTheItem = apex.item( this.id );
    } );

    lInitialValue = $v( lListManager$[0] );

    function open() {
        var searchText,
            itemValue = lListManagerAdd$.val();
        // For combobox seems reasonable to use existing text as filter once opened if entered value has changed
        if ( itemValue !== lastOpenValue ) {
            searchText = itemValue;
        } else {
            searchText = null;
        }
        lastOpenValue = itemValue;
        lListManagerAdd$.attr( A_ARIA_EXPANDED, "true" );
        widget.util.openPopupLov( forceRefresh, searchText, false, lPopupOptions, function( result ) {
            if ( result ) {
                lastOpenValue = result.d || result.v || result;
            }
            lListManagerAdd$.attr( A_ARIA_EXPANDED, "false" );
        } );
        forceRefresh = false;
    }

    // The popupu lov field is always enterable so open on button click
    lButton$.click( function() {
        open();
    } ).focus( function() {
        // the button is not a separate entity to focus
        lListManagerAdd$.focus();
    });
    // various keys will also open
    lListManagerAdd$.keydown( function( event ) {
        var kc = event.which;

        if ( kc === keys.DOWN || kc === keys.UP ) {
            open();
        } else if ( kc === keys.ENTER ) {
            // this is ugly but doing it because add click handler is rendered by server
            // most important can't call addValue because don't have access to preserve case attr
            lAddButton$.trigger("click");
            event.preventDefault();
        }
    } );

    function refresh() {
        lTheItem.refresh();
    }

    // if it's a cascading list manager we have to register change events for our masters
    if ( lOptions.dependingOnSelector ) {
        $( lOptions.dependingOnSelector, apex.gPageContext$ ).change( refresh );
    }

    // For legacy apps register the refresh event which is triggered by triggerRefresh or a manual refresh
    lListManager$.on( "apexrefresh", refresh );

    // Need to identify when a change event has been triggered from adding or removing
    // a list item, and when the change event has been triggered from selecting or deselecting
    // an item that's already been added (default HTML behaviour for multi-selects).
    // Because, in the case where the change event has come from selecting / deselecting we don't
    // want the change event to propagate, because nothing has really changed in this case.
    //
    // Use the originalEvent property of the jQuery event object, as this is undefined when
    // the change event has been triggered by adding or removing a list item. So therefore
    // we stop the event when this is not equal to undefined.
    lListManager$.change( function( e ) {
        if ( e.originalEvent !== undefined ) {
            e.stopImmediatePropagation();
        }
    } );

}; // listManager

})( apex.widget, apex.jQuery );
