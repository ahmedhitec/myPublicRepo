/*!
 item.js
 Copyright (c) 2012, 2020 Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @namespace apex.item
 * @desc
 * <p>The apex.item namespace contains global functions related to Oracle Application Express items.
 * The {@link apex.item.create} function defines the behavior for an item type.
 * The {@link apex.fn:item|apex.item} function provides access to an {@link item} interface for a specific item. </p>
 */

/*global apex, $x_FormItems, $x_ItemRow, $nvl, FCKeditorAPI*/
(function( debug, page, util, $ ) {
    "use strict";

    const ITEM_KEY = "apexitem",
        ALL_WS_RE = /^\s*$/, //match text that is all white space including space, tab, form-feed, etc.
        escapeCSS = util.escapeCSS,
        T_RADIO_GROUP = "RADIO_GROUP",
        T_CHECKBOX_GROUP = "CHECKBOX_GROUP",
        T_CHECKBOX = "CHECKBOX",
        T_RADIO = "RADIO",
        T_HIDDEN = "HIDDEN",
        T_SELECT = "SELECT",
        T_TEXT = "TEXT",
        T_TEXTAREA = "TEXTAREA",
        T_DISPLAY_SAVES_STATE = "DISPLAY_SAVES_STATE",
        T_DISPLAY_ONLY = "DISPLAY_ONLY",
        T_POPUP_LOV = "POPUP_LOV",
        T_POPUP_KEY_LOV = "POPUP_KEY_LOV";

    function isFunction( fn ) {
        return typeof fn === "function";
    }

    function escapeIfNeeded( esc, value ) {
        if ( esc && value != null ) { // using != on purpose
            value = util.escapeHTML( "" + value );
        }
        return value;
    }
    /**
     * @interface item
     * @classdesc
     * <p>The item interface is used to access methods and properties of an Oracle Application Express item.
     * You get access to the item interface for a page or column item with the {@link apex.fn:item|apex.item} function.</p>
     *
     * <p>An item interface can apply to either a page item or column item.
     * Page items are items on the page backed by session state in any region.
     * Column items are created by region types such as Interactive Grid that support editable columns.
     * The state of a column item, including its value, changes according to the editing context (active record)
     * of the region and is typically backed by data in an Oracle Application Express {@link model}.</p>
     *
     * <p>Plug-in developers can define the behavior of their item by calling {@link apex.item.create}.</p>
     */

    /**
     * @lends item.prototype
     */
    var itemPrototype = {
        /**
         * <p>The DOM element that best represents the value of the Oracle Application Express item. If the item doesn't exist
         * then the value is false.</p>
         *
         * @type {Element|false}
         * @example <caption>The following code checks if the Oracle Application Express item
         * P1_OPTIONAL_ITEM exists before setting its value. Use code similar to this
         * if there is a possibility of the item not existing.</caption>
         * var item = apex.item( "P1_OPTIONAL_ITEM" );
         * if ( item.node ) {
         *     item.setValue( newValue );
         * }
         */
        node: false,

        /**
         * <P>The jQuery object for this item element. If the item doesn't exist then it is the empty jQuery object $().
         * This is primarily for plug-in developers.</p>
         *
         * @type {jQuery}
         */
        element: null,

        /**
         * Leave this as is. Not currently documented and should remain so.
         * It is the underlying node type and really describes the base impl behavior.
         * @ignore
         */
        item_type: false,
        // Todo consider adding a new type property like region which is the item plug-in type.

        /**
         * <p>The id of the DOM element of the item. If the item doesn't exist then the value is false.</p>
         *
         * @type {string|false}
         */
        id: false,

        /**
         * <p>Called when the item is being reused in a new context. This is called for column items when a new record
         * is being edited. This is not normally used for page items. Default behaviour does setValue and suppresses change event.
         * Items that support cascading LOVs should implement this function to first set the item's value (which may also
         * require adding the value as an option in the item), then return a function where the cascade will take place.</p>
         *
         * @ignore
         * @param pValue The value to set
         * @param pDisplayValue The display value only if different from pValue
         * @return {function} When an item defines reinit, it will return a function for post processing
         */
        reinit: function( pValue, pDisplayValue ) {
            this.setValue( pValue, pDisplayValue, true );
        },

        /**
         * <p>Returns the current value of an Oracle Application Express item. The initial value of a page item comes from
         * session state when the server renders the page. The initial value of a column item comes from the
         * corresponding field value of the active record of the Oracle Application Express {@link model}. This function
         * always returns the current value of the item, which may have been changed by the user or with the {@link item#setValue}
         * method since it was initialized.</p>
         *
         * <p>There are two shorthand functions related to getValue. The {@link $v} function that returns an item's value in the string format
         * it will be sent to the server. This will either be a single value, or if the item supports multiple values, will be
         * a ':' colon separated list of values. The {@link $v2} function, which is just a shortcut
         * to getValue and returns either a single value, or an array of values. See also {@link item#setValue}.</p>
         *
         * @return {string|Array} Returns either a single string value or array of string values if the item
         * supports multiple values (for example the 'Select List' with attribute 'Allow Multi Selection' set to ' Yes'
         * or 'Shuttle' native item types).
         * @example <caption>In this example, the current value of the page item called P1_ITEM will be shown in an alert.</caption>
         * apex.message.alert( "P1_ITEM value = " + apex.item( "P1_ITEM" ).getValue() );
         */
        getValue: function() {
            var lRadio$,
                lArray = true,
                lReturn = [];

            switch ( this.item_type ) {
                case T_RADIO_GROUP:

                    // radio group should return a single value
                    lRadio$ = $( ':checked', this.node );
                    if ( lRadio$.length === 0 ) {

                        // check if the length of the jQuery object is zero (nothing checked)
                        // if so return an empty string.
                        lReturn = "";
                    } else {

                        // otherwise return the value
                        lReturn = lRadio$.val();
                    }
                    break;
                case T_CHECKBOX_GROUP:
                    $( ':checked', this.node ).each( function() {
                        lReturn.push(this.value);
                    });
                    break;
                case T_SELECT:
                    lReturn = this.element.val();
                    if ( lReturn === null || lReturn === undefined ) {
                        if ( this.element.attr( "multiple" ) ) {
                            lReturn = [];
                        } else {
                            lReturn = "";
                        }
                    }
                    break;
                default:
                    lArray = false;
            }
            if ( !lArray ) {
                switch ( this.item_type ) {
                    case T_CHECKBOX: /* check single checkbox entry */
                    case T_RADIO: /* check single radio entry */
                        lReturn = ( this.node.checked ) ? this.node.value : "";
                        break;
                    case T_POPUP_KEY_LOV:
                        lReturn = $( '#' + escapeCSS( this.id ) + "_HIDDENVALUE", apex.gPageContext$ ).val();
                        break;
                    case T_TEXT:
                    case T_POPUP_LOV:
                    case T_HIDDEN:
                    case T_DISPLAY_SAVES_STATE:
                    case T_TEXTAREA:
                        lReturn = this.node.value;
                        break;
                    case T_DISPLAY_ONLY:
                        lReturn = this.node.innerHTML;
                        break;
                    default:
                        lReturn = "";
                }
            }
            return lReturn;
        }, //end getValue

        /**
         * <p>Sets the Oracle Application Express item value. This function sets the current value of the
         * item. For page items the session state is not affected until the page is submitted (or the item
         * is explicitly saved to the server using ajax or a dynamic action). For column items the region
         * such as Interactive Grid takes care of writing the value back to the Oracle Application Express {@link model}
         * when appropriate.</p>
         *
         * <p>Normally a change event is explicitly triggered on the item node when the value is set. This allows
         * cascading LOV functionality and dynamic action change events to work.
         * The caller may suppress the change event for the item being set, if needed. The change event should be
         * suppressed when the value is set while processing a change event triggered on the same item, to prevent
         * an infinite loop. The {@link grid} widget relies on the change event to update the model. If you suppress
         * the change event on a column item you may need to call the {@link grid#setActiveRecordValue} method.</p>
         *
         * <p>There is a shorthand function for setValue {@link $s}. See also {@link item#getValue}.</p>
         *
         * @param {string|string[]} pValue The value to set. For items that support multiple values (for example a
         * 'Shuttle'), an array of string values can be passed to set multiple values at once.
         * @param {string} [pDisplayValue] The display value, only if different from pValue and can't be determined by the item itself.
         *   For example, for the item type Popup LOV when the display value and return value are different,
         *   this parameter sets the display value while the <code class="prettyprint">pValue</code> parameter sets the hidden return value.
         * @param {boolean=} pSuppressChangeEvent Pass true to prevent the change event from being triggered
         *   for the item being set. The default is false.
         * @example <caption>In this example, the value of the page item called P1_ITEM will be set to 10.
         * As <code class="prettyprint">pSuppressChangeEvent</code> has not been passed, the default behavior of the
         * <code class="prettyprint">change</code> event triggering for P1_ITEM will occur.</caption>
         * apex.item( "P1_ITEM" ).setValue( "10" );
         * @example <caption>In this example, P1_ITEM is a Popup LOV page item with distinct display and return values.
         * The display value of P1_ITEM will be set to SALES, and the hidden return value will be set to 10.
         * As true has been passed for the <code class="prettyprint">pSuppressChangeEvent</code> parameter,
         * the <code class="prettyprint">change</code> event will not trigger for the P1_ITEM item.</caption>
         * apex.item( "P1_ITEM" ).setValue( "10", "SALES", true );
         * @example <caption>This example shows how to suppress the change event when there is no display value.</caption>
         * apex.item( "P1_ITEM" ).setValue( "10", null, true );
         */
        setValue: function( pValue, pDisplayValue, pSuppressChangeEvent ) {
            var i, len, lCheck, oEditor,
                lOpts = null;

            if ( !this.node ) {
                return;
            }

            switch ( this.item_type ) {
                case T_RADIO_GROUP:
                    lOpts = $x_FormItems( this.node, 'RADIO' );
                    break;
                case T_CHECKBOX_GROUP:
                    lOpts = $x_FormItems( this.node, 'CHECKBOX' );
                    break;
                case T_POPUP_KEY_LOV:
                    // popup key lovs store there value in a hidden field
                    $( '#' + escapeCSS( this.id ) + '_HIDDENVALUE', apex.gPageContext$ ).val( pValue );
                    this.element.val( pDisplayValue );
                    break;
            }
            if ( lOpts ) {
                for ( i = 0, len = lOpts.length; i < len; i++ ) {
                    lCheck = lOpts[i].value == pValue; // intentional ==
                    lOpts[ i ].checked = lCheck;
                }
            } else {
                switch ( this.item_type ) {
                    case T_CHECKBOX:
                    case T_RADIO:
                        this.node.checked = this.node.value === pValue;
                        break;
                    case T_TEXT:
                    case T_POPUP_LOV:
                    case T_HIDDEN:
                    case T_TEXTAREA:
                        this.element.val( pValue );
                        break;
                    case T_SELECT:
                        this.element.val( pValue );
                        // The following is APEX specific behavior in the case that the select is not a drop down
                        // and the set value is not one of the available options we select the first option. (bug# 29404186)
                        // If we haven't selected any entry then we will pick the first list entry as most browsers
                        // will automatically do for drop down select lists - except of IE9 (bug# 14837012)
                        // Note: We don't do this if it's a select list where the entries are always visible (not a drop down)
                        // Note: version 1.8.3 of jQuery let the browser handle default behavior, version 1.10.2 of jQuery
                        // "normalizes" behavior so all browsers select nothing (the correct standard behavior)
                        if ( this.node.selectedIndex === -1 &&
                            parseInt( $nvl( this.element.attr( "size" ), "1" ), 10 ) === 1 &&
                            this.element.prop( "multiple" ) !== true ) {
                            this.element.find( "option" ).first().prop( "selected", true );
                        }
                        break;
                    case T_DISPLAY_SAVES_STATE:
                        this.element.val( pValue );
                        $( this.display_span, apex.gPageContext$ ).html( escapeIfNeeded( this.escape, pValue ) );
                        break;
                    case T_DISPLAY_ONLY:
                        this.element.html( escapeIfNeeded( this.escape, pValue ) );
                        break;
                    case 'FCKEDITOR':
                        oEditor = FCKeditorAPI.GetInstance( this.id );
                        oEditor.SetHTML( pValue );
                        break;
                    /**
                     * must be some other tag item set it's innerHTML
                     */
                    default:
                        this.node.innerHTML = pValue;
                }
            }
        }, //end setValue

        /**
         * <p>Enables the Oracle Application Express item value that has been disabled, making it available for editing.
         * Not all items support being disabled. This only applies to items that can be edited.
         * See also {@link item#disable}.</p>
         *
         * @example <caption>In this example, the page item called P1_ITEM will be enabled and available for edit.</caption>
         * apex.item( "P1_ITEM" ).enable();
         */
        enable: function() {
            this.element
                .removeClass( "apex_disabled" )
                .prop( "disabled", false );
            if ( this.afterModify ) {
                this.afterModify();
            }
        }, // end enable

        /**
         * <p>Disables the Oracle Application Express item, making it unavailable for editing.
         * Not all items support being disabled. This only applies to items that can be edited. See also {@link item#enable}.</p>
         *
         * @example <caption>In this example, the page item named P1_ITEM will be disabled and unavailable for editing.</caption>
         * apex.item( "P1_ITEM" ).disable();
         */
        disable: function() {
            this.element
                .addClass( "apex_disabled" )
                .prop( "disabled", true );
            if ( this.afterModify ) {
                this.afterModify();
            }
        }, // end disable

        /**
         * Returns the disabled state of an item.
         *
         * @since 5.1
         * @return {boolean} true if the item is disabled and false otherwise.
         * @example <caption>This example gets the value of an item, but only if it is not disabled.</caption>
         * var value = null;
         * if ( !apex.item( "P1_ITEM" ).isDisabled() ) {
         *     value = apex.item( "P1_ITEM" ).getValue();
         * }
         */
        isDisabled: function() {
            return !!this.element.prop( "disabled" );
        }, // end isDisabled

        /**
         * <p>Shows the Oracle Application Express item. When using the show function, it is important to understand the following:</p>
         * <ul>
         * <li>If the item being shown is rendered on a page using table layout (meaning the page references a page
         * template with Grid Layout Type set to 'HTML Table'), and the call to show has specified to show the entire
         * table row (<code class="prettyprint">pShowRow</code> = true), then it is assumed that everything pertaining to the item is contained in that
         * row, and the entire row will be shown.</li>
         * <li>If the item being shown is rendered on a page using table layout, and the call to show has specified
         * not to show the entire table row (<code class="prettyprint">pShowRow</code> = false, or not passed), then the function will attempt to show
         * the item's label, where the <code class="prettyprint">for</code> attribute matches the <code class="prettyprint">id</code> of the item.</li>
         * <li>If the item being shown is rendered on a page using grid layout (meaning the page references a page
         * template with Grid Layout Type set to either 'Fixed Number of Columns', or 'Variable Number of Columns'),
         * and the item references a Label template that includes a Field Container element with a known <code class="prettyprint">id</code>
         * (so where the Field Container > Before Label and Item attribute includes an HTML element with
         * id="#CURRENT_ITEM_CONTAINER_ID#"), then it is assumed that everything pertaining to the item is contained
         * in the Field Container, and this will be shown.</li>
         * <li>If the item is a column item then just the column value is shown. The exact behavior depends on the
         * type of region. For example, in Interactive Grid just the cell content is shown not the whole column.</li>
         * </ul>
         * <p>See also {@link item#hide}.</p>
         *
         * @param {boolean} [pShowRow] This parameter is deprecated.
         * This parameter is optional. The default if not specified is false. If true,
         * shows the nearest containing table row (TR). This parameter is not supported for column items.
         * Its behavior is undefined. Only applicable when item is on a page using table layout
         * (meaning the page references a page template with Grid Layout Type set to 'HTML Table').
         *
         * @example <caption>In this example, the page item called P1_ITEM will be shown.
         * If P1_ITEM is on a page using grid layout and the item references a Label template that includes a Field
         * Container element with a known ID (as detailed above), then that container element will be shown.
         * Otherwise just the item and its corresponding label will be shown.</caption>
         * apex.item( "P1_ITEM" ).show();
         */
        show: function( pShowRow ) {
            // Note: the logic involving CONTAINER and DISPLAY suffix must be reflected in
            // $x_Toggle so that it tests the correct node for visibility.
            var lNodeId = escapeCSS( this.id ),
                lNodeDisplay$ = $( '#' + lNodeId + '_CONTAINER', apex.gPageContext$ );

            if ( lNodeDisplay$.length > 0 ) {
                lNodeDisplay$.show().trigger( "apexaftershow" );
            } else {
                if ( pShowRow ) {
                    $x_ItemRow( this.node, 'SHOW' );
                } else {
                    if ( isFunction( this._show ) ) {
                        this._show();
                    } else {
                        lNodeDisplay$ = $( '#' + lNodeId + '_DISPLAY', apex.gPageContext$ );
                        if ( lNodeDisplay$.length > 0 ) {
                            lNodeDisplay$.show().trigger( "apexaftershow" );
                        } else {
                            this.element.show().trigger( "apexaftershow" );
                        }
                    }

                    // try and show the label as well, regardless of if _show is defined
                    if ( lNodeId ) {
                        $( 'label[for=' + lNodeId + ']', apex.gPageContext$ ).show();
                    }
                }
            }

        }, // end show

        /**
         * <p>Hides the Oracle Application Express item. When using the hide function, it is important to understand the following:</p>
         * <ul>
         * <li>If the item being hidden is rendered on a page using table layout (meaning the page references a page
         * template with Grid Layout Type set to 'HTML Table'), and the call to hide has specified to hide the entire
         * table row (<code class="prettyprint">pHideRow</code> = true), then it is assumed that everything pertaining to the item is contained in that
         * row, and the entire row will be hidden.</li>
         * <li>If the item being hidden is rendered on a page using table layout, and the call to hide has specified
         * not to hide the entire table row (<code class="prettyprint">pHideRow</code> = false, or not passed), then the function will attempt to hide
         * the item's label, where the <code class="prettyprint">for</code> attribute matches the <code class="prettyprint">id</code> of the item.</li>
         * <li>If the item being hidden is rendered on a page using grid layout (meaning the page references a page
         * template with Grid Layout Type set to either 'Fixed Number of Columns', or 'Variable Number of Columns'),
         * and the item references a Label template that includes a Field Container element with a known <code class="prettyprint">id</code>
         * (so where the Field Container > Before Label and Item attribute includes an HTML element with id="#CURRENT_ITEM_CONTAINER_ID#"),
         * then it is assumed that everything pertaining to the item is contained in the Field Container, and this
         * will be hidden.</li>
         * <li>If the item is a column item then just the column value is hidden. The exact behavior depends on the
         * type of region. For example in Interactive Grid just the cell content is hidden not the whole column.</li>
         * </ul>
         * <p>See also {@link item#show}.</p>
         *
         * @param {boolean} [pHideRow] This parameter is deprecated.
         * This parameter is optional. The default value is false. If true, hides the
         * nearest containing table row (TR). This parameter is not supported for column items.
         * Its behavior is undefined. Only applicable when item is on a page using table layout (meaning the
         * page references a page template with Grid Layout Type set to 'HTML Table').
         *
         * @example <caption>In this example, the page item called P1_ITEM will be hidden.
         * If P1_ITEM is on a page using grid layout and the item references a Label template that includes a
         * Field Container element with a known ID (as detailed above), then that container element will be hidden.
         * Otherwise just the item and its corresponding label will be hidden.</caption>
         * apex.item( "P1_ITEM" ).hide();
         */
        hide: function( pHideRow ) {
            // Note: the logic involving CONTAINER and DISPLAY suffix must be reflected in
            // $x_Toggle so that it tests the correct node for visibility.
            var lNodeId = escapeCSS( this.id ),
                lNodeDisplay$ = $( '#' + lNodeId + '_CONTAINER', apex.gPageContext$ );

            if ( lNodeDisplay$.length > 0 ) {
                lNodeDisplay$.hide().trigger( "apexafterhide" );
            } else {
                if ( pHideRow ) {
                    $x_ItemRow( this.node, 'HIDE' );
                } else {
                    if ( isFunction( this._hide ) ) {
                        this._hide();
                    } else {
                        lNodeDisplay$ = $( '#' + lNodeId + '_DISPLAY', apex.gPageContext$ );
                        if ( lNodeDisplay$.length > 0 ) {
                            lNodeDisplay$.hide().trigger( "apexafterhide" );
                        } else {
                            this.element.hide().trigger( "apexafterhide" );
                        }
                    }

                    // try and hide the label as well, regardless of if _hide is defined
                    if ( lNodeId ) {
                        $( 'label[for=' + lNodeId + ']', apex.gPageContext$ ).hide();
                    }
                }
            }
        }, // end hide

        /**
         * Returns true or false if an Oracle Application Express item is empty and considers any item value consisting of
         * only whitespace including space, tab, or form-feed, as empty.
         * This also respects if the item type uses a List of Values, and a 'Null Return Value' has been defined in the List
         * of Values. In that case, the 'Null Return Value' is used to assert if the item is empty.
         *
         * @return {boolean} true if the Oracle Application Express item is empty and false otherwise.
         * @example <caption>In this example, the call to .isEmpty() determines if the page item called
         * P1_ITEM is empty, and if so displays an alert.</caption>
         * if ( apex.item( "P1_ITEM" ).isEmpty() ) {
             *     apex.message.alert( "P1_ITEM empty!" );
             * }
         */
        isEmpty: function() {
            var lItemValue, lNode, lReturn,
                lNullValue = "";

            lItemValue = this.getValue(); //does the heavy lifting!

            // Make life easier and always use a string for all compare operations! $v doesn't work in this context
            if ( $.isArray( lItemValue ) ) {
                lItemValue = lItemValue.join( ':' );
            } else {
                lItemValue = "" + lItemValue;
            }

            lNode = this.node;

            /* Different item types will be tested for 'is empty' in different ways:
             *
             *  Case 1: text input, textareas will return true if they are null or they match any white space
             *  Case 2: multi select lists return true if they have no options selected or the current value equals the null value (not sure whether this should include null value)
             *  Case 3: all select list will ONLY return true if their current value equals the matching value in the apex.nullmap array
             *  Case 4: display only no state will return true if the span's innerHTML is empty
             *  Case 5: display only save state will return true if the relevant input's value is empty
             *  Case 6: popup lov returns true if null
             *  Case 7: popup key lov returns true if null
             *  Case 8: shuttles will return true by having no options in the right hand select element
             *  Case 9: checkboxes will return true if no checkboxes in the page item's group are checked
             * Case 10: radio groups will return true if no radio buttons in the page item's group are selected
             * Case 11: list managers will return true by having no options in the element
             * Case 12: popup color pickers will return true if no color is specified
             * Case 13: popup date pickers will return true if no date is specified
             * Case 14: CKEditor will return null if the iFrame content is empty
             *
             */

            if ( this.nullValue ) {
                if ( isFunction( this.nullValue ) ) {
                    return this.nullValue.call( this );
                } else {
                    // basic comparison
                    return lItemValue === null || lItemValue === this.nullValue || ALL_WS_RE.test( lItemValue );
                }
            } else {
                if ( this.item_type === T_SELECT ) {
                    if ( apex.widget && apex.widget.report && apex.widget.report.tabular && apex.widget.report.tabular.gNullValueList ) {
                        $.each( apex.widget.report.tabular.gNullValueList, function( pId, pValue ) {
                            if ( this.name === lNode.name ) {
                                lNullValue = pValue.value;
                                return false;
                            }
                        });
                    }
                    if ( lNode.multiple ) {
                        lReturn = ( lItemValue.length === 0 ) || ( lItemValue === lNullValue );   //case 2
                    } else {
                        lReturn = ( lNullValue || lNullValue === "" ) ? ( lItemValue === lNullValue ) : false;           //case 3
                    }
                } else {
                    lReturn = lItemValue === null || ALL_WS_RE.test( lItemValue ); //case 1,4,5,6,7,9,10,11,12,13,14,15 (exp 2 or 3)
                    //case 8 (exp 1)
                }
                return lReturn;
            }
        }, // end isEmpty

        /**
         * Determine if the value of this item has changed since it was first initialized.
         * Return true if the current value of the Oracle Application Express item has changed and false otherwise.
         * Developers rarely have a need to call this function. It is used internally by the Warn on Unsaved Changes feature.
         * Item Plug-in developers should ensure this function works so that the Warn on Unsaved Changes
         * feature can support their plug-in.
         *
         * @since 5.1
         * @return {boolean} true if the item value has changed and false otherwise.
         * @example <caption>The following example determines if the value of item P1_ITEM has been changed.</caption>
         * if ( apex.item( "P1_ITEM" ).isChanged() ) {
         *     // do something
         * }
         */
        isChanged: function() {
            var i, opt, curValue, origValue, elements,
                changed = false;

            function checkMulti() {
                var changed = curValue.length !== origValue.length;
                if ( !changed ) {
                    for ( i = 0; i < origValue.length; i++ ) {
                        if ( curValue[i] !== origValue[i] ) {
                            changed = true;
                            break;
                        }
                    }
                }
                return changed;
            }

            switch ( this.item_type ) {
                case T_TEXTAREA:
                case T_TEXT:
                case T_POPUP_LOV:
                    changed = this.node.value !== this.node.defaultValue;
                    break;
                case T_SELECT:
                    curValue = this.element.val();
                    if ( this.node.type === "select-multiple" ) {
                        if ( !curValue ) {
                            curValue = [];
                        }
                        origValue = [];
                        for ( i = 0; i < this.node.options.length; i++ ) {
                            opt = this.node.options[i];
                            if ( opt.attributes.selected !== undefined ) {
                                origValue.push( opt.value );
                            }
                        }
                        changed = checkMulti();
                    } else {
                        origValue = "";
                        for ( i = 0; i < this.node.options.length; i++ ) {
                            opt = this.node.options[i];
                            if ( opt.attributes.selected !== undefined ) {
                                origValue = opt.value;
                                break;
                            }
                        }
                        changed = curValue !== origValue;
                    }
                    break;
                case T_RADIO_GROUP:
                    curValue = this.getValue();
                    origValue = "";
                    elements = $x_FormItems( this.node, 'RADIO' );
                    for ( i = 0; i < elements.length; i++ ) {
                        if ( elements[i].defaultChecked ) {
                            origValue = elements[i].value;
                            break;
                        }
                    }
                    changed = curValue !== origValue;
                    break;
                case T_CHECKBOX_GROUP:
                    curValue = this.getValue();
                    origValue = [];
                    elements = $x_FormItems( this.node, 'CHECKBOX' );
                    for ( i = 0; i < elements.length; i++ ) {
                        if ( elements[i].defaultChecked ) {
                            origValue.push( elements[i].value );
                        }
                    }
                    changed = checkMulti();
                    break;
                case T_RADIO:
                case T_CHECKBOX:
                    changed = this.node.checked !== this.node.defaultChecked;
                    break;
                case T_POPUP_KEY_LOV:
                    // NOTE this is comparing the display value to detect a change. Comparing the hidden value
                    // would never find a change because a hidden value and defaultValue are always identical.
                    // So this will fail in the case where the current and original display values are identical
                    // but the return values are different. This seems too unlikely to worry about.
                    changed = this.node.value !== this.node.defaultValue;
                    break;
                // because user can't change these directly they are never changed so let them default
                //case 'DISPLAY_SAVES_STATE':
                //case 'DISPLAY_ONLY':
                //case 'HIDDEN':
                // other types will need to implement their own changed logic
            }
            return changed;
        },

        // todo may need a method to mark as not changed clearChange

        /**
         * <p>Adds the given value to the current list of values of an item that supports multiple values.
         * Not all multi-valued items support this method.</p>
         *
         * @param {string} pValue The value to be added.
         * @param {string} [pDisplayValue] The display value, only if different from pValue and can't be determined by
         *   the item itself. Not all multi-valued items that support addValue will support this parameter.
         *
         * @example <caption>In this example, the page item called P1_ITEM will have the value 100 added to the
         * current list of values.</caption>
         * apex.item( "P1_ITEM" ).addValue( "100" );
         */
        addValue: function( pValue, pDisplayValue ) {
            debug.error( "No default handling defined for addValue" );
        }, // end addValue

        /**
         * <p>Removes the given value from the current list of values of an item that supports multiple values.
         * Not all multi-valued items support this method.</p>
         *
         * @param {string} [pValue] The value to be removed. The behavior when no value is given is item specific.
         *   For example it may remove the currently selected or focused item or items or may do nothing at all.
         *
         * @example <caption>In this example, the page item called P1_ITEM will have the value 100 removed from the
         * current list of values.</caption>
         * apex.item( "P1_ITEM" ).removeValue( "100" );
         **/
        removeValue: function( pValue ) {
            debug.error( "No default handling defined for removeValue" );
        }, // end removeValue

        /**
         * <p>Call to refresh the item. What it means for an item to be refreshed depends on the item. Not all items
         * support refresh. Typically an item such as a select list that has a list of options will refresh the
         * available options from the server. In most cases it is not necessary to call this method directly because
         * the declarative Cascading LOV Parent Items takes care of it automatically.</p>
         *
         * @example <caption>The following example will cause the P1_ITEM select list page item to fetch its options from the server.</caption>
         * apex.item( "P1_ITEM" ).refresh();
         */
        refresh: function() {
            // for backward compatibility
            this.element.trigger( 'apexrefresh' );
        }, // end refresh

        /**
         * <p>Places user focus on the Oracle Application Express item, taking into account how specific items are
         * designed to receive focus.</p>
         *
         * @example <caption>In this example, user focus is set to the page item named P1_ITEM.</caption>
         * apex.item( "P1_ITEM" ).setFocus();
         **/
        setFocus: function() {
            var lSetFocusTo$ = this.element; // Default handling is to use the element with the ID of the page item

            if ( this.setFocusTo ) {
                // setFocusTo can be a function
                if ( isFunction( this.setFocusTo ) ) {
                    lSetFocusTo$ = this.setFocusTo();
                } else {
                    // If not a function, setFocusTo can be either a DOM object, jQuery selector or jQuery object
                    lSetFocusTo$ = $( this.setFocusTo );
                }
            }
            lSetFocusTo$.focus();
        }, // end setFocus

        /**
         * <p>Sets a style for the Oracle Application Express item, taking into account how specific items are
         * designed to be styled.</p>
         *
         * <p class="important">Note: Using setStyle is not a best practice. It is better to add or remove CSS classes
         * and use CSS rules to control the style of items. Also keep in mind that the exact markup of native and plug-in items can
         * change from one release to the next.</p>
         *
         * @param {string} pPropertyName The CSS property name that will be set.
         * @param {string} pPropertyValue The value used to set the CSS property.
         * @example <caption>In this example, the CSS property color will be set to red for the page item called P1_ITEM.</caption>
         * apex.item( "P1_ITEM" ).setStyle( "color", "red" );
         */
        setStyle: function( pPropertyName, pPropertyValue ) {
            var lSetStyleTo$ = this.element; // Default handling is to use the element with the ID of the page item

            if ( this.setStyleTo ) {
                // setStyleTo can be a function
                if ( isFunction( this.setStyleTo ) ) {
                    lSetStyleTo$ = this.setStyleTo();
                } else {
                    // If not a function, setStyleTo can be either a DOM object, jQuery selector or jQuery object
                    lSetStyleTo$ = $( this.setStyleTo );
                }
            }
            lSetStyleTo$.css( pPropertyName, pPropertyValue );
            if ( this.afterModify ) {
                this.afterModify();
            }
        }, // end setStyle

        /**
         * <p>Returns the display value corresponding to the value given by pValue for the Oracle Application Express item.
         * This method is intended for items that have both a value and display value, such as select lists.</p>
         * <p>If the item type does not have a display value distinct from the value then <code class="prettyprint">pValue</code> is returned;
         * meaning that the value is the display value. For item types that have a display value but don't have access
         * to all possible values and display values then this function only works when <code class="prettyprint">pValue</code> is the current value of the item.
         * For the native items, this only applies to item type Popup LOV.
         * For item types such as select lists that have access to all their values, if <code class="prettyprint">pValue</code>
         * is not a valid value then <code class="prettyprint">pValue</code> is returned.</p>
         *
         * @since 5.1
         * @param {string} pValue The value to return the corresponding display value.
         * @param {object} pState Optional parameter used when items are associated with a {@link model} column
         *   to provide state information about the item value. Most item types don't use this parameter. It is
         *   mostly useful to item types that include markup in the returned display value.
         * @param {boolean} pState.readonly If true the column value is readonly.
         * @param {boolean} pState.disabled If true the column value is disabled.
         * @returns {string} The string display value corresponding to the given
         *     <code class="prettyprint">pValue</code> as described above.
         *
         * @example <caption>This example gets a display value from a select list item called P1_ITEM and displays
         * it in an alert.</caption>
         * apex.message.alert( "The correct answer is: " + apex.item( "P1_ITEM" ).displayValueFor( "APPLES" ) );
         */
        displayValueFor: function( pValue, pState ) {
            var display = pValue;

            if ( display === undefined || display === null ) {
                display = "";
            }
            if ( this.node.type === "password" ) {
                return "******";
            }
            switch ( this.item_type ) {
                case T_POPUP_KEY_LOV:
                    if ( pValue === this.getValue() ) {
                        display = this.element.val();
                    }
                    break;
                case 'SHUTTLE':
                    if ( pValue !== undefined && pValue !== null ) {
                        display = "";
                        this.element.find( "td.shuttleSelect2 option" ).each( function ( i, o ) { display += ',' + $( o ).html(); } );
                        if ( display === undefined || display === null ) {
                            display = pValue;
                        } else {
                            display = display.substr( 1 );
                        }
                    }
                    break;
                case T_SELECT:
                    if ( pValue !== undefined && pValue !== null ) {
                        display = this.element.find( "[value='" + escapeCSS( pValue + "" ) + "']" ).html();
                        if ( display === undefined || display === null ) {
                            display = pValue;
                        }
                    }
                    break;
            }
            return display;
        },

        /**
         * <p>Return a ValidityState object as defined by the HTML5 constraint validation API for the
         * Oracle Application Express item. If a plug-in item implements its own validation then the object may not contain
         * all the fields defined by HTML5. At a minimum it must have the valid property. If the item doesn't support
         * HTML5 validation then it is assumed to be valid.</p>
         *
         * <p>This function does not actually validate the item value. For many item types the browser can do the
         * validation automatically if you add HTML5 constraint attributes such as pattern. Validation can be done
         * using the HTML5 constraint validation API.</p>
         *
         * <p>Developers rarely have a need to call this function. It is used internally by the client side validation
         * feature. Item plug-in developers should ensure this function works with their plug-in.</p>
         *
         * @since 5.1
         * @return {object} A ValidityState object as described above.
         *
         * @example <caption>The following example displays a message in an alert dialog if the item called P1_ITEM is not valid.</caption>
         * var item = apex.item( "P1_ITEM" );
         * if ( !item.getValidity().valid ) {
         *     apex.message.alert( "Error: " + item.getValidationMessage() );
         * }
         */
        getValidity: function() {
            return this.node.validity || { valid:true };
        },

        /**
         * <p>Return a validation message if the Oracle Application Express item is not valid and empty string otherwise.</p>
         *
         * <p>The message comes from the element's validationMessage property. An APEX extension allows specifying a
         * custom message, which overrides the element's validationMessage, by adding a custom attribute named
         * data-valid-message. If the item has this attribute then its value is returned if the item is not valid.
         * As the name implies, the text of the message should describe what is expected of valid input, rather than
         * what went wrong.</p>
         *
         * @since 5.1
         * @return {string} A validation message, if the item is not valid and empty string otherwise.
         *
         * @example <caption>See the example for {@link item#getValidity} for an example of this function.</caption>
         */
        getValidationMessage: function() {
            var validMessage,
                message = "";

            // todo consider how the callback can easily participate in the default data-valid-message behavior? pass in the message if there is one?
            validMessage = this.element.attr( "data-valid-message" );
            if ( !this.getValidity().valid && validMessage  ) {
                message = validMessage;
            } else {
                message = this.node.validationMessage || "";
            }
            return message;
        },

        /**
         * Any item type that uses a popup (a div added near the end of the document that is positioned near the input
         * and floating above) needs to provide a selector that locates the top level element of the popup.
         * This allows the item type to be used in the grid widget.
         * In addition the popup element must be focusable (tabindex = -1).
         * For best behavior of a popup in the grid. The popup should
         * - have a way of taking focus
         * - return focus to the grid when it closes
         * - close on escape when it has focus and
         * - close when the element it is attached to loses focus
         * - manage its tab stops so they cycle in the popup or return to the grid at the ends
         *
         * @ignore
         * @since 5.1
         * @return {string} selector that identifies a popup associated with this item or null if there is no popup
         */
        getPopupSelector: function() {
            return null;
        },

        /**
         * For internal use by popupLov only at the moment
         * Return null when the separator is not applicable (as it is for items that don't support multiple values)
         * or cannot be customized (in which case the default of ":" is used).
         * @ignore
         * @since 19.2
         * @return {string} separator character used to separate multiple values
         */
        getSeparator: function() {
            if ( this.separator ) {
                return this.separator;
            } // else
            return null;
        }

    };

    function getElement( pItemId ) {
        var el$ = null;
        // for legacy reasons the item id can also be the item element
        if ( pItemId instanceof Element ) {
            el$ = $( pItemId );
        } else if ( typeof pItemId === "string" ) {
            el$ = $( "#" + escapeCSS( "" + pItemId ), apex.gPageContext$ );
            if ( !el$.length ) {
                el$ = null;
            }
        }
        return el$;
    }

    // note this has a side effect in the case the item is T_DISPLAY_SAVES_STATE and T_DISPLAY_ONLY
    function setItemType( item ) {
        var lNodeType, textType, escAttr,
            lItemType = false, // default
            node$ = item.element;

        lNodeType = item.node.nodeName.toUpperCase();

        // we need the old code in place, since we have some packaged generating HTML markup still containing
        // the old classes
        if ( lNodeType === 'FIELDSET' ) {
            if ( node$.hasClass( "checkbox_group" ) ) {
                lItemType = T_CHECKBOX_GROUP;
            } else if ( node$.hasClass( "radio_group" ) ) {
                lItemType = T_RADIO_GROUP;
            } else if ( node$.hasClass( "shuttle" ) ) {
                lItemType = "SHUTTLE";
            }

        // if the node is a DIV, assign item_type based on the class name
        } else if ( lNodeType === 'DIV' ) {
            if ( node$.hasClass( "apex-item-checkbox" ) ) {
                lItemType = T_CHECKBOX_GROUP;
            } else if ( node$.hasClass( "apex-item-radio" ) ) {
                lItemType = T_RADIO_GROUP;
            } else if ( node$.hasClass( "apex-item-group--shuttle" ) ) {
                lItemType = "SHUTTLE";
            }

        // if node type is an input, assign item_type as the node type (CHECKBOX, RADIO, TEXT etc.)
        } else if ( lNodeType === 'INPUT' ) {
            lItemType = item.node.type.toUpperCase();

            // switch on item_type to ensure item_type and display_span attributes are initialised
            switch ( lItemType ) {
                case T_CHECKBOX:
                case T_RADIO:
                    break;
                case T_TEXT:
                    textType = item.node.parentNode.className.toUpperCase();
                    if ( node$.hasClass( "apex-item-popup-lov" ) || textType === "LOV" ) {
                        if ( $( '#' + item.id + '_HIDDENVALUE', apex.gPageContext$ ).length > 0 ) {
                            lItemType = T_POPUP_KEY_LOV;
                        } else {
                            lItemType = T_POPUP_LOV;
                        }
                    }

                    break;
                case T_HIDDEN:
                    let displaySpan$ = $( "#" + item.id + '_DISPLAY' );

                    if ( displaySpan$[0] ) {
                        item.display_span = displaySpan$[0];
                        lItemType = T_DISPLAY_SAVES_STATE;
                        escAttr = displaySpan$.attr( "data-escape" );
                        item.escape = escAttr && escAttr.toLowerCase() === "true";
                    }
                    break;
                default:
                    lItemType = T_TEXT;
            }

        // if the node type is not a fieldset or an input, initialise item_type accordingly
        } else {
            lItemType = lNodeType;
            switch ( lItemType ) {
                case T_TEXTAREA:
                    try {
                        if ( window.CKEDITOR && window.CKEDITOR.instances[item.id] ) {
                            lItemType = 'CKEDITOR3';
                        }
                    } catch ( e ) {
                    }
                    break;
                case 'SPAN':
                    if ( node$.hasClass( "display_only" ) ) {
                        lItemType = T_DISPLAY_ONLY;
                        escAttr = node$.attr( "data-escape" );
                        item.escape = escAttr && escAttr.toLowerCase() === "true";
                    }
                    break;
            }
        }
        item.item_type = lItemType;
    }

    /**
     * <p>Return an {@link item} interface that is used to access item related methods and properties.</p>
     *
     * <p>Item plug-in developers can override much of the item behavior, by calling {@link apex.item.create} with their overrides.</p>
     *
     * @function fn:item
     * @memberof apex
     * @param {Element|string} pItemId The item name. This is also the id of the main DOM element associated with the item.
     * For backward compatibility this can also be the main item DOM Element. Passing in an element is deprecated and the
     * id/name should be used instead.
     * @returns {item} The item interface for the given item name. If there is no such item on the page the
     *   returned item interface node property will be false.
     * @example <caption>This function is not used by itself. See the examples for methods of the {@link item} interface.</caption>
     *
     **/
    apex.item = function( pItemId ) {
        var item = null,
            element$ = getElement( pItemId );

        if ( element$ ) {
            item = element$.data( ITEM_KEY );
            // it is expected (and more efficient) that the item has been initialized but if not return a generic item type
            if ( !item ) {
                // create a generic item instance for the element now
                apex.item.create( pItemId, {} );
                item = element$.data( ITEM_KEY );
                // an item "created" on the fly like this should not look like one where create was explicitly called
                // todo the above is a strange way to "pass back" the item, refactor so internal create never sets the data
                element$.removeData( ITEM_KEY );
            }
        } else {
            // For legacy reasons don't return null to indicate that no such item element exists but return an object like this
            // Seems like it would be a good idea to add a debug.info( 'Item not found.', "" + pItemId ); message here
            // but it turns out that a few places in the code probe for items that may not exist meaning not found is often expected.
            // So the number of log messages was just too much noise.
            item = Object.create( itemPrototype );
            item.element = $();
        }
        return item;
    };

    /**
     * <p>This function is only for item plug-in developers. It provides a plug-in specific implementation for the item.
     * This is necessary to seamlessly integrate a plug-in item type with the built-in item
     * related client-side functionality of Oracle Application Express.</p>
     *
     * @function create
     * @memberof apex.item
     * @since 5.1
     * @static
     * @param {Element|string} pItemId The item name. This is also the id of the main DOM element associated with the item.
     * For backward compatibility this can also be the main item DOM Element. Passing in an element is deprecated and the
     * id/name should be used instead.
     * @param {object} pItemImpl An object with properties that provide any functions needed to customize the
     * Oracle Application Express item instance behavior. The {@link item} interface has default implementations
     * for each of its methods that are appropriate for many page items particularly for items that use standard
     * form elements. For each method of {@Link item} you should check if the default handling is appropriate for
     * your item plug-in. If it isn't you can provide your own implementation of the corresponding function
     * through this pItemImpl object. The default behavior is used for any functions omitted.
     * <p>ItemImpl can contain any of the following properties:</p>
     *
     * @param {function} pItemImpl.addValue <em>function(value, displayValue)</em> Specify a function for adding a value to the item,
     * where the item supports multiple values. This is called by the {@link item#addValue} method which has no default
     * behavior for adding a value. Currently there is no client-side functionality of Oracle Application Express dependent on this.
     * <p>Note: Even if this function is defined, the default handling always calls the afterModify method.</p>
     *
     * @param {function} pItemImpl.afterModify <em>function()</em> Specify a function that is called after an item is modified.
     *   This is useful, for example as some frameworks need to be notified if widgets are
     *   modified, for example their value has been set, or they have been disabled in order to keep both the native
     *   and enhanced controls in sync. This callback provides the hook to do so.
     *   <p class="important">Note: This callback is deprecated.</p>
     *
     * @param {boolean} pItemImpl.delayLoading <p>Specify if the item needs to delay APEX page loading. There are many places
     * in the APEX framework where client-side logic is run after the page has finished loading, for example Dynamic Actions
     * set to 'Fire on Initialization', or code defined in the page level attribute 'Execute when Page Loads'. If an item
     * takes longer to initialize (for example if it uses a module loader like requirejs to load additional modules,
     * or if the underlying JavaScript widget itself takes longer to initialize), setting delayLoading to true allows
     * you to tell APEX to wait for your item to finish initializing, before firing it's built in page load logic. This
     * allows you as a developer to ensure that your item is compatible with these built-in APEX features like Dynamic
     * Actions.</p>
     * <p>When this is set to true, <em>apex.item.create</em> will return a <code class="prettyprint">jQuery</code>
     * deferred object, which will need to be resolved in order for page loading to complete.</p>
     * <p>Note: If using this option, you must ensure your item initializes as quickly as possible, and also that
     * the returned deferred object is always resolved, to avoid disrupting the default APEX page load behavior.</p>
     *
     * @param {function} pItemImpl.disable <em>function()</em> Specify a function for disabling the item, which overrides the
     *   default {@link item#disable} behavior. The default behavior sets the disabled property of the item node to true.
     *   Providing this override could be useful for example where the item consists of compound elements which
     *   also need disabling, or if the item is based on a widget that already has its own disable method that you want
     *   to reuse. Ensuring the item can disable correctly means certain item related client-side functionality of
     *   Oracle Application Express still works, for example when using the Disable action of a Dynamic Action to disable
     *   the item.
     *   <p>Note: Even if this function is defined, the default handling always calls the afterModify method.</p>
     *
     * @param {function} pItemImpl.displayValueFor <em>function(value, [state]):string</em> Specify a function that returns a string
     *   display value that corresponds to the given value. This overrides the default behavior of the
     *   {@link item#displayValueFor} method. The default behavior supports a standard select element and conceals the
     *   value of password inputs.
     *
     * @param {function} pItemImpl.enable <em>function()</em> Specify a function for enabling the item, which overrides the
     *   default {@link item#enable} behavior. The default behavior sets the disabled property of the item node to false.
     *   Providing this override could be useful for example where the item consists of compound elements which
     *   also need enabling, or if the item is based on a widget that already has its own enable method that you want
     *   to reuse. Ensuring the item can enable correctly means certain item related client-side functionality
     *   of Oracle Application Express still works, for example when using the Enable action of a Dynamic Action
     *   to enable the item.
     *   <p>Note: Even if this function is defined, the default handling always calls the afterModify method.</p>
     *
     * @param {function} pItemImpl.getValidationMessage <em>function():string</em> Specify a function to return the
     *   validation message, which overrides the default {@link item#getValidationMessage} behavior.
     *
     * @param {function} pItemImpl.getValidity <em>function():ValidityState</em> Specify a function that returns a
     *   validity state object, which overrides the default {@link item#getValidity} behavior.
     *   The returned object must at a minimum have the Boolean valid property. It may include any of the properties
     *   defined for the HTML5 ValidityState object. The default implementation returns the validity object of
     *   the item element if there is one otherwise it returns { valid: true }.
     *
     * @param {function} pItemImpl.getValue <em>function():string</em> Specify a function for getting the item's value,
     *   which overrides the default {@link item#getValue} behavior. The default behavior handles
     *   the standard HTML form elements. Ensuring the item returns its value correctly means certain item related
     *   client-side functionality of Oracle Application Express still works, for example in Dynamic Actions to evaluate
     *   a When condition on the item, or when calling the JavaScript function {@link $v} to get the item's value.
     *
     * @param {function} pItemImpl.hide <em>function()</em> Specify a function for hiding the item, which overrides the default
     *   {@link item#hide} behavior. This could be useful for example where the item consists of compound elements which also
     *   need hiding, or if the item is based on a widget that already has its own hide method that you want to reuse.
     *   Ensuring the item can hide correctly means certain item related client-side functionality of Application
     *   Express still works, for example when using the Hide action of a Dynamic Action, to hide the item.
     *   <p>Note: if the item is in an element with an id that matches the name of the item with a '_CONTAINER' suffix
     *   then the container element is hidden and this function is not called.</p>
     *
     * @param {function} pItemImpl.isChanged <em>function():Boolean</em> Specify a function that returns true if the
     *   current value of the item has changed and false otherwise, which overrides the default {@link item#isChanged}
     *   behavior. This function allows the Warn on Unsaved Changes feature to work.
     *   The default implementation uses built-in functionality of HTML form elements to detect changes.
     *   If this function does not work correctly then changes to the plug-in item type value will not be
     *   detect and the user will not be warned when they leave the page.
     *
     * @param {function} pItemImpl.isDisabled <em>function():Boolean</em> Specify a function that returns true if the
     *   item is disabled and false otherwise, which overrides the default {@link item#isDisabled} behavior.
     *   Ensuring the item returns its value correctly means certain item related client-side functionality of
     *   Oracle Application Express still works, for example client-side validation and Interactive Grid.
     *
     * @param {function} pItemImpl.getPopupSelector <em>function():string</em> Specify a function that returns a
     *   CSS selector that locates the popup used by the item.
     *   Any plug-in item type that uses a popup (a div added near the end of the document
     *   that is positioned near the input item and floating above it) needs to provide a CSS selector that locates
     *   the top level element of the popup. This allows the item type to be used in the Interactive Grid region or
     *   any other region that needs to coordinate focus with the popup. The default implementation returns null.
     *   <p>In addition the top level popup element must be focusable (have attribute tabindex = -1).</p>
     *   <p>For best behavior of a popup in the Interactive Grid. The popup should:
     *   <ul>
     *   <li>have a way of taking focus</li>
     *   <li>close on escape when it has focus</li>
     *   <li>close when the element it is attached to loses focus</li>
     *   <li>return focus to the element that opened the popup when it closes</li>
     *   <li>manage its tab stops so they cycle in the popup or return to the element that opened the popup at the ends</li>
     *   </ul>
     *
     * @param {function} pItemImpl.loadingIndicator <em>function(loadingIndicator$):jQuery</em> Specify a function that normalizes
     *   how the item's loading indicator is displayed during a partial page refresh of the item.
     *   This function must pass the pLoadingIndicator$ parameter as the first parameter, which contains a
     *   jQuery object with a reference to the DOM element for the loading indicator. The function then adds
     *   this loading indicator to the appropriate DOM element on the page for the item, and also returns the
     *   jQuery object reference to the loading indicator, such that the framework has a reference to it,
     *   so it can remove it once the call is complete.
     *   <p>This is used, for example, if the item is a Cascading LOV and the Cascading LOV Parent Item changes,
     *   or when setting the item's value by using one of the server-side Dynamic Actions such as
     *   Set Value - SQL Statement.</p>
     *
     * @param {string} pItemImpl.nullValue Specify a value to be used to determine if the item is null.
     *   This is used when the item supports definition of a List of Values, where a developer can define a
     *   Null Return Value for the item and where the default item handling needs to know this in order to
     *   assert if the item is null or empty. This can be done by following these steps:
     *   <p>From the Render function in the plug-in definition, emit the value stored in p_item.lov_null_value as
     *   part of the item initialization JavaScript code that fires when the page loads. For example:
     *   <pre class=class="prettyprint"><code>
     *   # Assumes that you have some JavaScript function called 'com_your_company_your_item'
     *   # that accepts 2 parameters, the first being the name of the item and the second being
     *   # an object storing properties (say pOptions) required by the item's client side code.
     *   apex_javascript.add_onload_code (
     *       p_code => 'com_your_company_your_item('||
     *           apex_javascript.add_value(
     *               apex_plugin_util.page_item_names_to_jquery(p_item.name)||', {'||
     *           apex_javascript.add_attribute(
     *               'lovNullValue', p_item.lov_null_value, false, false)||
     *      '});' );
     *   </code></pre>
     *   <p>Then, in the implementation of com_your_company_your_item( pName, pOptions ) you have the value defined for
     *   the specific item's Null Return Value in the pOptions.lovNullValue property. This can then be used in your
     *   call to {@link apex.item.create}, to set the nullValue property.</p>
     *   <p>Ensuring the nullValue property is set means certain item related client-side functionality of
     *   Oracle Application Express still works, for example, in Dynamic Actions to correctly evaluate an is null
     *   or is not null when condition on the item, or when calling the JavaScript function
     *   {@link item#isEmpty} to determine if the item is null.</p>
     *
     * @param {function} pItemImpl.refresh <em>function()</em> Specify a function to refresh the item.
     * This is called by the {@link item#refresh} method. The default behavior triggers event "apexrefresh"
     * for legacy plug-in items.
     *
     * @param {function} pItemImpl.reinit <em>function(value, display):function</em> Specify a function to
     *   initialize an item's value when it is reused in a new context. This is only called for column items every time
     *   a new record is being edited. The default behaviour calls {@link item#setValue} and suppresses the change event.
     *   Items that support cascading LOVs should implement this function to first set the item's value (which may also
     *   require adding the value as an option in the item), then return a function where the cascade will take place.
     *
     * @param {function} pItemImpl.removeValue <em>function(value)</em> Specify a function for removing a value from the item,
     * where the item supports multiple values. This is called by the {@link item#removeValue} method which has no default
     * behavior for removing a value. Currently there is no client-side functionality of Oracle Application Express dependent on this.
     * <p>Note: Even if this function is defined, the default handling always calls the afterModify method.</p>
     *
     * @param {Element|string|function} pItemImpl.setFocusTo Specify the element to receive focus
     *   when focus is set to the item using the {@link item#setFocus} method. This can be defined as either a jQuery
     *   selector, jQuery object or DOM Element which identifies the DOM element, or a no argument function that returns a jQuery
     *   object referencing the element. This can be useful when the item consists of compound elements,
     *   and you do not want focus to go to the element that has an ID matching the item name, which is the
     *   default behavior.
     *   <p>Ensuring the item sets focus correctly means certain item related client-side functionality of
     *   Oracle Application Express still works, for example when using the Set Focus action of a Dynamic Action to
     *   set focus to the item, when users follow the Go to Error link that displays in a validation error
     *   message to go straight to the associated item, or when the item is the first item on a page and
     *   the developer has the page level attribute Cursor Focus set to First item on page.</p>
     *
     * @param {Element|string|function} pItemImpl.setStyleTo Specify the element to receive style, when style is set to
     *   the item using the {@link item#setStyle} method. This can be defined as either a jQuery selector,
     *   jQuery object or DOM Element which identifies the DOM element(s), or a no argument function that returns a jQuery object
     *   referencing the element(s). This is useful when the item consists of compound elements, and you do not
     *   want style to be set to the element or just the element, that has an ID matching the item name which is
     *   the default behavior.
     *   <p>Ensuring the item sets style correctly means certain item related client-side
     *   functionality of Oracle Application Express still works, for example when using the Set Style action of a
     *   Dynamic Action to add style to the item.</p>
     *   <p>Note: Even if this property is defined, the default behavior of {@link item#setStyle} calls the afterModify method.</p>
     *
     * @param {function} pItemImpl.setValue <em>function(value, displayValue, suppressChangeEvent)</em> Specify a function for
     *   setting the item's value, which overrides the default {@link item#setValue} behavior. The default behavior handles
     *   the standard HTML form elements. Ensuring the item can set its value correctly means certain item related
     *   client-side functionality of Oracle Application Express still works, for example
     *   when using the Set Value action of a Dynamic Action to set the item's value, or when calling the
     *   JavaScript function {@link $s} to set the item's value.
     *   <p>Note: Even when this function is defined, the default handling always calls the afterModify function and
     *   triggers the change event according to the pSuppressChangeEvent parameter. The pSuppressChangeEvent parameter
     *   is provided to this function for informational purpose only. In most cases it can be ignored.</p>
     *
     * @param {function} pItemImpl.show <em>function()</em> Specify a function for showing the item, which overrides the
     *   default {@link item#show} behavior. This is useful for example where the item consists of compound elements which
     *   also need showing, or if the item is based on a widget that already has its own show method that you want
     *   to reuse. Ensuring the item can show correctly means certain item related client-side functionality of
     *   Oracle Application Express still works, for example when using the Show action of a Dynamic Action, to show the item.
     *   <p>Note: if the item is in an element with an id that matches the name of the item with a '_CONTAINER' suffix
     *   then the container element is shown and this function is not called.</p>
     *
     * @returns {object} Returns a <code class="prettyprint">jQuery</code> Deferred object when delayLoading is set to true. The <code class="prettyprint">jQuery</code> deferred object must
     * be resolved in order for APEX page load to complete. If delayLoading is set to false (the default), then nothing is
     * returned.
     *
     * @example <caption>The following example shows a call to apex.item.create( pNd, pItemImpl )
     *   with most available callbacks and properties passed to illustrate the syntax (although
     *   it is unlikely that any plug-in needs to supply all of these).</caption>
     * apex.item.create( "P100_COMPANY_NAME", {
     *     displayValueFor: function( pValue ) {
     *         var lDisplayValue;
     *         // code to determine the display value for pValue
     *         return lDisplayValue;
     *     },
     *     getPopupSelector: function() {
     *         return "<some CSS selector>";
     *     },
     *     getValidity: function() {
     *         var lValidity = { valid: true };
     *         if ( <item is not valid expression> ) {
     *             lValidity.valid = false;
     *         }
     *         return lValidity;
     *     },
     *     getValidationMessage: function() {
     *         // return validation message if invalid or empty string otherwise
     *     },
     *     getValue: function() {
     *         var lValue;
     *         // code to determine lValue based on the item type.
     *         return lValue;
     *     },
     *     setValue: function( pValue, pDisplayValue ) {
     *         // code that sets pValue and pDisplayValue (if required), for the item type
     *     },
     *     reinit: function( pValue, pDisplayValue ) {
     *         // set the value possibly using code like
     *         // this.setValue( pValue, null, true );
     *         return function() {
     *            // make an ajax call that gets new option values for the item
     *         }
     *     },
     *     disable: function() {
     *         // code that disables the item type
     *     },
     *     enable: function() {
     *         // code that enables the item type
     *     },
     *     isDisabled: function() {
     *         // return true if item is disabled and false otherwise
     *     }
     *     show: function() {
     *         // code that shows the item type
     *     },
     *     hide: function() {
     *         // code that hides the item type
     *     },
     *     isChanged: function() {
     *         var lChanged;
     *         // code to determine if the value has changed
     *         return lChanged;
     *     },
     *     addValue: function( pValue ) {
     *         // code that adds pValue to the values already in the item type
     *     },
     *     nullValue: "<null return value for the item>",
     *     setFocusTo: $( "<some jQuery selector>" ),
     *     setStyleTo: $( "<some jQuery selector>" ),
     *     afterModify: function(){
     *         // code to always fire after the item has been modified (value set, enabled, etc.)
     *     },
     *     loadingIndicator: function( pLoadingIndicator$ ){
     *         // code to add the loading indicator in the best place for the item
     *         return pLoadingIndicator$;
     *     }
     * });
     *
     @example <caption>The following example shows a call to apex.item.create( pNd, pItemImpl )
     *   with delayLoading option set to true. Doing so results in the create function returning a
     *   deferred object, which must be later resolved in order for page load to complete.</caption>
     * var lDeferred = apex.item.create( "P100_COMPANY_NAME", {
     *     delayLoading: true
     * });
     *
     * // At some point later in the code when the item has finished its initialization, resolve the deferred object
     * lDeferred.resolve();
     */
    // internal for now is pItemImpl.separator, getInteractionSelector, onInteraction
    apex.item.create = function ( pItemId, pItemImpl ) {
        var item, lDeferred, hasAfterModify,
            element$ = getElement( pItemId );

        /*
         * Callback afterModify is deprecated but for backward compatibility we are still calling it if it exists.
         * If a method that normally calls afterModify is overridden by the created item type then use this
         * to wrap the override and call afterModify. See for example the base enable implementation and below use
         * of this function.
         */
        function wrapWithAfterModify( fn ) {
            return function() {
                fn.apply( this, arguments );
                this.afterModify();
            };
        }

        /*
         * The bulk of setValue is done by the base setValue impl or by the override supplied to item.create but
         * in all cases the legacy check and call of afterModify and the change event trigger is handled in this
         * wrapper function.
         */
        function wrapSetValue( fn ) {
            return function( pValue, pDisplayValue, pSuppressChangeEvent ) {
                fn.call( this, pValue, pDisplayValue, pSuppressChangeEvent );
                if ( this.afterModify ) {
                    this.afterModify();
                }

                /* Only if pSuppressChangeEvent is set to true, do we not trigger the change event.
                 * In the case where this is not passed, the change event is triggered (for backwards
                 * compatibility). Or if this is explicitly set to false, then the event will also trigger.
                 */
                if ( !pSuppressChangeEvent ) {
                    this.element.trigger( 'change' );
                }
            };
        }

        if ( element$ ) {

            hasAfterModify = pItemImpl.afterModify;
            if ( hasAfterModify ) {
                ["enable", "disable", "addValue", "removeValue"].forEach( function( name ) {
                    var fn = pItemImpl[name];
                    if ( fn ) {
                        pItemImpl[name] = wrapWithAfterModify( fn );
                    }
                } );
            }
            ["show", "hide"].forEach( function( name ) { // todo needs tests, also consider deprecate show/hide callbacks
                var fn = pItemImpl[name];
                if ( fn ) {
                    pItemImpl["_" + name] = fn;
                    delete pItemImpl[name];
                }
            } );

            item = Object.create( itemPrototype );
            $.extend( item, pItemImpl );
            item.setValue = wrapSetValue( item.setValue );
            item.element = element$;
            item.node = element$[0];
            item.id = item.node.id;
            if ( !item.item_type ) {
                setItemType( item );
            }

            // removing the data, if it exists, first allows updating the item element. This kind of redefinement is not likely
            // needed but also handles the case were for example $v is used before the initial plug-in call to this function.
            element$.removeData( ITEM_KEY ).data( ITEM_KEY, item );

            if ( pItemImpl.delayLoading ) {

                // Add a new deferred object to the stack, and return it for the item to be resolve when it's ready
                lDeferred = $.Deferred();
                page.loadingDeferreds.push( lDeferred );
                return lDeferred; // caller needs to resolve this when its initialization is done.
            }

        } else {
            throw new Error( "Item element not found " + pItemId );
        }
    };

    var attachHandlers = [];

    /**
     * <p>This function is only for item plug-in developers. It provides a way for item plug-ins to initialize
     * without having to render a call to a JavaScript function. The handler function is called when the page
     * initializes.</p>
     *
     * @function addAttachHandler
     * @memberof apex.item
     * @since 20.2
     * @static
     * @param {function} pHandler <em>pHandler( pContext$ )</em>. A function provided by the plug-in that will initialize
     * all item instances of the plug-in type. The function receives a jQuery object that is the context in which
     * the item(s) can be found.
     * @example <caption>In this example the plug-in render function produces an input element with
     * class "mySuperInput". The following code goes in the plug-in's JavaScript file.</caption>
     * function attachSuperInput( pContext$ ) {
     *    $( "input.mySuperInput", pContext$ ).each( function() {
     *        var myItem = $(this);
     *        // Do what is needed to initialize the plug-in item element.
     *        // Most likely call apex.item.create here.
     *    } );
     * }
     * apex.item.addAttachHandler( attachSuperInput );
     */
    apex.item.addAttachHandler = function( pHandler ) {
        attachHandlers.push( pHandler );
    };

    /**
     * <p>This function calls all the attach handler callbacks.</p>
     * @ignore
     * @param pElement$
     */
    apex.item.attach = function( pElement$ ) {
        var i;

        pElement$ = pElement$ || apex.gPageContext$;

        for ( i = 0; i < attachHandlers.length; i++ ) {
            // isolate each attach handler so a problem in one can't bother the others
            try {
                attachHandlers[i]( pElement$ );
            } catch( ex ) {
                debug.error("Error in item attach processing.", ex );
            }
        }
    };

    // when the page loads attach all items
    $( function() {
        apex.item.attach( apex.gPageContext$ );
    } );

})( apex.debug, apex.page, apex.util, apex.jQuery );
