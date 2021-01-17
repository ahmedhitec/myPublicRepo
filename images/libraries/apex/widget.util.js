/*global apex,$v,$s,ResizeSensor,self */
/**
 @license
 Oracle Database Application Express
 Copyright (c) 2012, 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * The {@link apex.widget.util} namespace is used to store all widget utility functions of Oracle Application Express.
 **/

/**
 * @namespace
 **/
apex.widget.util = {};

(function( widgetUtil, util, lang, navigation, $ ) {
    "use strict";

    /**
     * Function that implements cascading LOV functionality for an item type plug-in. This function is a wrapper of the
     * apex.server.plugin function but provides additional features.
     *
     * @param {jQuerySelector | jQuery | DOM} pList Identifies the page item of the item type plug-in.
     * @param {String} pAjaxIdentifier        Use the value returned by the PL/SQL package apex_plugin.get_ajax_identifier to identify your item type plug-in.
     * @param {Object} [pData]                Object which can optionally be used to set additional values which are send with the
     *                                        AJAX request. For example pData can be used to set the scalar parameters x01 - x10 and the
     *                                        arrays f01 - f20
     * @param {Object} [pOptions]             Object which can optionally be used to set additional options for the AJAX call. See apex.server.plugin
     *                                        for standard attributes. In addition pOptions supports the attributes:
     *                                          - "optimizeRefresh" Boolean to specify if the AJAX call should not be performed if one off the page items
     *                                                              specified in dependingOn is empty.
     *                                          - "dependingOn"     jQuery selector, jQuery- or DOM object which identifies the DOM element
     *                                                              of which the current page item is depending on.
     * @return {jqXHR}
     *
     * @example
     *
     * apex.widget.util.cascadingLov ( pItem, pAjaxIdentifier, {
     *     x01: "test"
     *     }, {
     *     optimizeRefresh:   true,
     *     dependingOn:       "#P1_DEPTNO",
     *     pageItemsToSubmit: "#P1_LOCATION",
     *     clear:   function() { ... do something here ... },
     *     success: function( pData ) { ... do something here ... }
     *     } );
     *
     * @memberOf apex.widget.util
     **/
    widgetUtil.cascadingLov = function( pList, pAjaxIdentifier, pData, pOptions ) {
        var lList$     = $( pList, apex.gPageContext$ ),
            lQueueName = lList$[0] ? lList$[0].id : "lov",
            lOptions   = $.extend( {
                optimizeRefresh: true,
                queue: { name: lQueueName, action: "replace" }
            }, pOptions ),
            lNullFound = false;

        // Always fire the before and after refresh event and show a load indicator next to the list
        if ( !lOptions.refreshObject ) {
            lOptions.refreshObject    = lList$;
        }
        if ( !lOptions.loadingIndicator ) {
            lOptions.loadingIndicator = lList$;
        }

        // We only have to refresh if all our depending values are not null
        if ( lOptions.optimizeRefresh ) {
            $( lOptions.dependingOn, apex.gPageContext$ ).each( function() {
                if ( apex.item( this ).isEmpty() ) {
                    lNullFound = true;
                    return false; // stop execution of the loop
                }
            });

            // All depending values are NULL, let's take a shortcut and not perform the AJAX call
            // because the result will always be an empty list
            if ( lNullFound ) {
                // trigger the before refresh event if defined
                lOptions.refreshObject.trigger( 'apexbeforerefresh' );

                // Call clear callback if the attribute has been specified and if it's a function
                if ( $.isFunction( lOptions.clear ) ) {
                    lOptions.clear();
                }

                // Trigger the change event for the list because the current value might have changed.
                // The change event is also needed by cascading LOVs so that they are refreshed with the
                // current selected value as well (bug# 9907473)
                // If the select list actually reads data, the change event is fired in the _addResult as soon as
                // a new value has been set (in case the LOV doesn't contain a null display entry)
                lList$.change();

                // trigger the after refresh event if defined
                lOptions.refreshObject.trigger( 'apexafterrefresh' );
                return; // we are done, exit cascadingLov
            }
        }

        // Include dependingOn page items into the pageItems list
        pData.pageItems = $( pData.pageItems, apex.gPageContext$ ).add( lOptions.dependingOn );
        return apex.server.plugin( pAjaxIdentifier, pData, lOptions );
    }; // cascadingLov

    // this module loads before jQuery UI so can't rely on $.ui.keyCodes
    var KEY_ENTER = 13,
        KEY_DOWN = 40,
        KEY_UP = 38,
        KEY_TAB = 9;

    /*
     * Internal use
     * Creates and opens the dialog or popup associated with a Popup LOV item.
     * Side effect is setting the model name on the item under key "popupLovModelName" and search state
     * info under key "popupSearchState".
     *
     * todo issues:
     *     control break/groups for tmv, disabled items,
     *     for groups icon view needs to support column breaks and have option for breaks to not be collapsible
     *     frozen column issue where non-frozen table shifts to a new row.
     *     In grid view may want home/end to go to first/last row not column in row.
     *     Icon view uses home/end to go to first/last row but doesn't support page up/down.
     *     How can user choose between scroll and load more paging?
     *
     * boolean forceRefresh if true the search results should be refreshed (or cleared if initialFetch option is "none")
     * string searchText if not null use this as the initial value of the search field
     * boolean typeAhead if true the searchText (likely just a single character) is from the user starting to type in the combobox field
     * object options:
     *  string itemId
     *  string title
     *  boolean isPopup
     *  boolean enterable
     *  number width
     *  number height
     *  object extraOut
     *  boolean persistState
     *  string initialSearch only applies when dialog is first created/initialized
     *  boolean incrementalSearch
     *  number minSearchChars
     *  boolean multiple
     *  string displayColumn
     *  string valueColumn
     *  string iconColumn
     *  boolean hasDisplayValue
     *  string display list|grid
     *  object columns If there is a meta column it must be called "_meta". Extra property bool canSearch controls highlighting
     *  object defaultGridOptions
     *  object defaultIconListOptions
     *  string ajaxIdentifier
     *  Array of strings itemsToSubmit
     *  Element pluginTarget
     */
    widgetUtil.openPopupLov = function( forceRefresh, searchText, typeAhead, options, callback ) {
        var model, view$, viewInstance, dialog$, dialogOptions,
            searchBar$, searchInput$, clearButton$, messageContent, sessionStore,
            topJQuery = util.getTopApex().jQuery,
            persistentState = null,
            isPopup = options.isPopup || false,
            noData = lang.getMessage( "APEX.POPUP_LOV.NO_RESULTS" ),
            filterRequiredNoData = null,
            incrementalSearch = options.incrementalSearch,
            initialSearch = options.initialSearch || "",
            item$ = $( "#" + options.itemId ),
            baseId = "PopupLov_" + $("#pFlowStepId").val() + "_" + options.itemId, // including page to help keep it unique on top level apex page
            dialogId = baseId + "_dlg",
            result = null;

        function resize(dialog) {
            // Don't need to calculate height because dialog uses flex layout
            // but do need to let grid or tmv know about the new size.
            viewInstance.resize();
        }

        function refresh( searchControl, search, sortCol, sortDir ) {
            var searchRe,
                change = false,
                noFetch = false,
                fetchData = model.getOption( "fetchData" );

            if ( searchControl.forceRefresh ) {
                change = true;
                if ( options.initialFetch === "none" && !(searchControl.typeAhead && incrementalSearch) ) {
                    noFetch = true;
                }
                fetchData.search = null;
                searchControl.forceRefresh = false; // reset this so that subsequent fetches work
            }

            if ( search !== null && search !== fetchData.search ) {
                fetchData.search = search;
                change = true;
            }
            if ( sortCol && sortDir && ( sortCol !== fetchData.sortColumn || sortDir !== fetchData.sortDirection ) ) {
                fetchData.sortColumn = sortCol;
                fetchData.sortDirection = sortDir;
                change = true;
            }
            if ( change ) {
                // todo consider in future server could have search options for doing some other kind of search such as case insensitive or exact or regular expression
                // This assumes that the backend is using LIKE with no escape character. Turn this into a RE.
                // '_' -> '.' '%' -> '.*'
                // Rather than any character (.) exclude markup characters because they cause confusion with markup in highlightSearchTerm
                searchRe = util.escapeRegExp( fetchData.search ).replace(/[_%]/g, function(m) {
                    return "[^<>&]" + ( m === "%" ? "*" : "" );
                } );
                viewInstance.options.highlighterContext = {
                    term: fetchData.search,
                    re: new RegExp( "([<>&;])|(" + searchRe + ")", "ig" )
                };
                if ( filterRequiredNoData ) {
                    if ( search.length >= options.minSearchChars && !( noFetch || searchControl.typeAhead ) ) {
                        viewInstance._setOption( "noDataMessage", noData );
                        model.clearData();
                    } else {
                        viewInstance._setOption( "noDataMessage", filterRequiredNoData );
                        model.setData( [] );
                        fetchData.search = null; // forget the search so in the case of no initial search can force to search on nothing
                    }
                } else {
                    if ( searchControl.typeAhead && !incrementalSearch ) {
                        model.setData( [] );
                        fetchData.search = null; // forget the search char so can search on it if desired
                    } else {
                        model.clearData();
                    }
                }
                searchControl.typeAhead = false;
            }
        }

        function saveState() {
            sessionStore.setItem( "state", JSON.stringify( persistentState ) );
        }

        function loadState() {
            var obj;

            sessionStore = apex.storage.getScopedSessionStorage( {
                prefix: baseId,
                usePageId: true,
                useAppId: true
            } );

            persistentState = {};
            if ( options.display === "grid" ) {
                persistentState.columnWidths = {};
            }
            obj = sessionStore.getItem( "state" );
            if ( obj ) {
                try {
                    obj = JSON.parse( obj );
                    // Must validate data from session storage. All are optional.
                    // dialog size
                    if ( !isPopup ) {
                        persistentState.width = parseInt( obj.width, 10 ) || options.width;
                        persistentState.height = parseInt( obj.height, 10 ) || options.height;
                    }
                    // sort info
                    if ( obj.sortDirection && /^(asc|desc)$/.test( obj.sortDirection ) ) {
                        persistentState.sortDirection = obj.sortDirection;
                    }
                    if ( options.columns[obj.sortColumn] ) {
                        persistentState.sortColumn = obj.sortColumn;
                    }
                    // column widths
                    $.each( obj.columnWidths, function( prop, w ) {
                        w = parseInt( w, 10 );
                        if ( w ) {
                            persistentState.columnWidths[prop] = w;
                        }
                    } );
                } catch ( ex ) {
                    // Ignore any exception. If someone has messed with the state object no worries the next saveState will set things right
                }
            }
        }

        if ( options.persistState ) {
            loadState();
        }

        /*
         * The PopupLOV item could be in an APEX modal page iframe but needs to open in the top level APEX context
         * so that it is not constrained to the iframe window boundary.
         * The dialog itself will be created and opened in the top APEX context because of using showDialog.
         * However we can't assume that the top context will have all the needed libraries loaded and don't want
         * to store the models there anyway.
         * So the jQuery content of the dialog needs to be created in this context. This happens in the init callback.
         */
        messageContent = function() {
            return "<div class='a-PopupLOV-dialog'></div>";
        };

        // Set some values on the input for use by init and open
        item$.data( "popupSearchState", {
            forceRefresh: forceRefresh,
            typeAhead: typeAhead,
            searchText: searchText
        } );

        dialog$ = topJQuery( "#" + dialogId ); // the dialog is in the top context.
        if ( !dialog$[0] && persistentState ) {
            // load options from persistent state for dialog creation
            options.width = persistentState.width || options.width;
            options.height = persistentState.height || options.height;
            if ( persistentState.sortColumn && persistentState.sortDirection ) {
                $.each( options.columns, function( prop, def ) {
                    if ( prop === persistentState.sortColumn && def.canSort ) {
                        def.sortIndex = 1; // assume there can be just one sort column
                        def.sortDirection = persistentState.sortDirection;
                    } else {
                        delete def.sortIndex;
                        delete def.sortDirection;
                    }
                } );
            }
            $.each( persistentState.columnWidths, function( prop, w ) {
                options.columns[prop].width = w;
            } );
        }

        dialogOptions = {
            id: dialogId,
            title: options.title || lang.getMessage( "APEX.POPUP.SEARCH" ),     //todo: Changed to APEX.POPUP.SEARCH fixing bug 31972864, 
                                                                                // change back to "APEX.POPUP_LOV.TITLE" when that message 
                                                                                // can be changed to just 'Search' 
            isPopup: isPopup,
            parentElement: isPopup ? item$.closest( ".apex-item-group--popup-lov" ) : null,
            returnFocusTo: item$[0], // set explicit return because of potential isPopup AND open from input trap
            noOverlay: true, // only applies if isPopup
            draggable: true,
            resizable: true,
            width: 200, // something just in case
            height: options.height,
            okButton: false,
            dialogClass: "ui-dialog-popuplov",
            notification: false,    // keeps the role as 'dialog'
            callback: function() {
                var map, p, value, display,
                    setAddMethod = "setValue",
                    theItem = apex.item( options.itemId );

                if ( options.multiple ) {
                    // If multiple values then picking something is to add rather than set.
                    setAddMethod = "addValue";
                }
                if ( result ) {
                    if ( typeof result === "object" && result.hasOwnProperty( "d" ) && result.hasOwnProperty( "v" ) ) {
                        theItem[setAddMethod]( result.v, result.d );
                    } else if ( typeof result === "object" && result.hasOwnProperty( "v" ) ) {
                        theItem[setAddMethod]( result.v );
                    } else {
                        theItem[setAddMethod]( result );
                    }
                    if ( !options.multiple ) {
                        // with multiple values extra outputs makes no sense.
                        map = options.extraOut;
                        if ( map ) {
                            // store additional outputs
                            for ( p in map ) {
                                if ( map.hasOwnProperty( p ) ) {
                                    value = result[p];
                                    display = null;
                                    if ( value !== null && typeof value === "object" && value.hasOwnProperty( "d" ) ) {
                                        value = value.v;
                                        display = value.d;
                                    }
                                    $s( map[p].item, value, display );
                                }
                            }
                        }
                    }
                }
                viewInstance.setSelectedRecords( [], false ); // clear the selection when leaving the dialog
                if ( callback ) {
                    callback( result );
                }
            },
            init: function( dialog$ ) {
                var gridOptions, listOptions, grid$, template, displayCol, debounceSearch, content$,
                    searchButton$,
                    sortColumn = null,
                    sortDirection = null,
                    modelName = baseId + "_m",
                    widget = dialog$.is( ":data(apexPopup)" ) ? "popup" : "dialog",
                    searchLabel = lang.getMessage( "APEX.POPUP.SEARCH" ),
                    searchControl = {
                        forceRefresh: forceRefresh,
                        typeAhead: typeAhead,
                        searchText: initialSearch || searchText
                    },
                    out = util.htmlBuilder();

                function makeSubstitution( name ) {
                    if ( name.match(/^[A-Z0-9_$#]+$/) ) {
                        return "&" + name + ".";
                    } // else
                    return '&"' + name + '".';
                }

                function save() {
                    var rec = viewInstance.getSelectedRecords()[0];

                    if ( rec ) {
                        result = {
                            v: model.getValue( rec, options.valueColumn )
                        };
                        if ( options.hasDisplayValue && options.displayColumn ) {
                            result.d = model.getValue( rec, options.displayColumn );
                        }
                        if ( options.extraOut ) {
                            Object.keys( options.extraOut ).forEach( function( p ) {
                                result[p] = model.getValue( rec, p );
                            } );
                        }

                        dialog$[widget]( "close" );
                    }
                }

                function saveNullValue() {
                    result = {
                        v: options.nullValue,
                        d: options.nullDisplayValue
                    };
                    // Assume best thing to do with extra outputs is clear them when the Popup LOV is set to the null value.
                    if ( options.extraOut ) {
                        Object.keys( options.extraOut ).forEach( function( p ) {
                            result[p] = "";
                        } );
                    }
                    dialog$[widget]( "close" );
                }

                function highlightSearchTerm( context, value, col ) {
                    var ignore = null;

                    if ( !context.term || ( col && col.canSearch === false ) ) {
                        // if no search term or column doesn't support searching then nothing to highlight
                        return value;
                    } // else
                    return value.replace( context.re, function( m, p1, p2 ) {
                        // don't highlight inside tags <...> or character entities &...;
                        // see context object defined above
                        if ( p1 ) {
                            switch ( p1 ) {
                                case "<":
                                    ignore = p1;
                                    break;
                                case ">":
                                    if ( ignore === "<" ) {
                                        ignore = null;
                                    }
                                    break;
                                case "&":
                                    if ( !ignore ) {
                                        ignore = p1;
                                    }
                                    break;
                                case ";":
                                    if ( ignore === "&" ) {
                                        ignore = null;
                                    }
                                    break;
                            }
                            return p1;
                        } else {
                            if ( ignore || !p2.length ) {
                                return p2;
                            } // else
                            return "<span class='popup-lov-highlight'>" + p2 + "</span>";
                        }
                    } );
                }

                // for use by open
                item$.data( "popupSearchState", searchControl );

                out.markup( "<div><div" )
                    .attr( "class", "a-PopupLOV-searchBar" + ( incrementalSearch ? " a-PopupLOV--incremental" : "" ) )
                    .markup( "><input type='text' aria-label='" + searchLabel + "' maxlength='100' class='a-PopupLOV-search apex-item-text'" )
                    .attr( "value", initialSearch )
                    .markup( ">" );
                // with incremental search there is no need for a button
                if ( !incrementalSearch ) {
                    out.markup( "<button type='button' class='a-Button a-PopupLOV-doSearch' aria-label='" + searchLabel + "'>" );
                }
                out.markup( "<span class='a-Icon icon-search' aria-hidden='true'></span>" );
                if ( !incrementalSearch ) {
                    out.markup( "</button>" );
                }
                out.markup( "</div>" );
                if ( options.nullDisplayValue ) {
                    out.markup( "<div class='a-PopupLOV-clear'><button class='a-PopupLOV-clearButton' type='button'>" )
                        .content( options.nullDisplayValue )
                        .markup( "</button></div>" );
                }
                out.markup( "<div class='a-PopupLOV-results'></div></div></div>" );
                /*
                 * Create the dialog content in this context. Add to dialog later.
                 */
                content$ = $( out.toString() );

                view$ = content$.find( ".a-PopupLOV-results" );

                searchBar$ = content$.find( ".a-PopupLOV-searchBar" );
                searchInput$ = searchBar$.find( ".a-PopupLOV-search" );
                searchButton$ = searchBar$.find( ".a-PopupLOV-doSearch" );
                clearButton$ = content$.find( ".a-PopupLOV-clearButton" );

                $.each( options.columns, function( prop, def ) {
                    // assume only one sort column
                    if ( def.sortIndex ) {
                        sortColumn = prop;
                        sortDirection = def.sortDirection;
                        return false; // break
                    }
                } );

                model = apex.model.create( modelName, {
                    shape: "table",
                    hasTotalRecords: false,
                    recordIsArray: true,
                    identityField: options.valueColumn,
                    metaField: options.columns._meta ? "_meta" : null,
                    fields: options.columns,
                    paginationType: "progressive",
                    regionId: options.itemId, // model assumes it is dealing with a region but shouldn't really care
                    fetchData: {
                        search: null,
                        sortColumn: sortColumn,
                        sortDirection: sortDirection
                    },
                    requestOptions: options.pluginTarget ? { target: options.pluginTarget } : null,
                    ajaxIdentifier: options.ajaxIdentifier,
                    pageItemsToSubmit: options.itemsToSubmit
                }, [], 0, false );

                // store the model name on the item
                item$.data( "popupLovModelName", modelName );

                displayCol = options.displayColumn || options.valueColumn; // fall back to using the value for display if there is no display column
                if ( options.display === "grid" ) {
                    options.columns[displayCol].usedAsRowHeader = true;
                    // if there is an icon column add a template to show the icon along with the display column
                    if ( options.iconColumn ) {
                        template = "<span class='" + makeSubstitution( options.iconColumn ) + "'></span> " +
                            makeSubstitution( displayCol );
                        options.columns[displayCol].cellTemplate = template;
                    }
                    gridOptions = $.extend( {
                        modelName: modelName,
                        columns: [options.columns],
                        columnSort: true,
                        columnSortMultiple: false, // sorting by more than one column seems like too much
                        collapsibleControlBreaks: false,
                        footer: false,
                        hasSize: true,
                        noDataMessage: noData,
                        multiple: false,
                        pagination: {
                            scroll: true,
                            loadMore: true // xxx false scroll paging broken
                        },
                        constrainNavigation: false, // let arrow navigation include search field
                        reorderColumns: false,
                        resizeColumns: true,
                        tooltip: null,
                        highlighter: highlightSearchTerm,
                        activateCell: function( event ) {
                            var cell$ = $( event.target ).closest( ".a-GV-cell" );

                            if ( (event.type === "keydown" && event.which !== KEY_ENTER) ||
                                cell$.hasClass( "a-GV-selHeader" ) || cell$.hasClass( "has-button" ) ) {
                                return;
                            }
                            save();
                        },
                        selectionChange: function( event ) {
                            // Assume not multiple selection
                            // This doesn't catch the case where click on current selection see click handler below
                            if ( event.originalEvent && event.originalEvent.type === "click" ) {
                                save();
                            }
                        },
                        sortChange: function( event, ui ) {
                            var i, col, index,
                                originalIndex = ui.column.sortIndex,
                                columns = grid$.grid( "getColumns" );

                            index = 1;
                            for ( i = 0; i < columns.length; i++ ) {
                                col = columns[i];
                                if ( col.sortIndex ) {
                                    if ( ui.action === "change" ) {
                                        if ( col === ui.column ) {
                                            index = col.sortIndex;
                                        }
                                    } else if ( ui.action === "add" ) {
                                        if ( col.sortIndex >= index ) {
                                            index = col.sortIndex + 1;
                                        }
                                    } else if ( ui.action === "remove" ) {
                                        if ( col === ui.column ) {
                                            delete col.sortIndex;
                                            delete col.sortDirection;
                                        } else if ( col.sortIndex > originalIndex ) {
                                            col.sortIndex -= 1;
                                        }
                                    } else if ( ui.action === "clear" || ui.action === "set" ) {
                                        delete col.sortIndex;
                                        delete col.sortDirection;
                                    }
                                }
                            }

                            if ( ui.action !== "clear" && ui.action !== "remove" ) {
                                ui.column.sortIndex = index;
                                ui.column.sortDirection = ui.direction;
                            }
                            grid$.grid( "refreshColumns" );
                            refresh( searchControl, null, ui.column.property, ui.direction );
                            if ( persistentState ) {
                                persistentState.sortColumn = ui.column.property;
                                persistentState.sortDirection = ui.direction;
                                saveState();
                            }
                        },
                        columnResize: function( event, ui ) {
                            if ( persistentState ) {
                                persistentState.columnWidths[ui.column.property] = parseInt( ui.width, 10 );
                                saveState();
                            }
                        }
                    }, options.defaultGridOptions );

                    grid$ = view$;
                    grid$.grid( gridOptions );
                    viewInstance = grid$.data( "apex-grid" );
                    grid$.click( function( event ) {
                        var row$ = $( event.target ).closest( ".a-GV-row" );
                        // if click on a row that is already selected there is no selection event so check and save if needed
                        if ( row$.hasClass( "is-selected" ) ) {
                            save();
                        }
                    } );
                } else if ( options.display === "list" ) {
                    template = options.recordTemplate;
                    if ( template ) {
                        template = template.replace("&DISPLAY.", "&" + displayCol + "." )
                            .replace( "&ICON.", "&" + options.iconColumn + "." )
                            .replace( "&RETURN.", "&" + options.valueColumn + "." );
                    } else {
                        template = "<li data-id='" + makeSubstitution( options.valueColumn ) + "'>";
                        if ( options.iconColumn ) {
                            template += "<span class='" + makeSubstitution( options.iconColumn ) + "'></span> ";
                        }
                        template += makeSubstitution( displayCol ) + "</li>";
                    }

                    listOptions = $.extend( {
                        modelName: modelName,
                        // default before and after template is for list markup <ul>, </ul>
                        recordTemplate: template,
                        footer: false,
                        hasSize: true,
                        noDataMessage: noData,
                        highlighter: highlightSearchTerm,
                        useIconList: true,
                        constrainNavigation: false, // let arrow navigation include search field
                        iconListOptions: {
                            navigation: true,
                            multiple: false,
                            activate: function( event ) {
                                save();
                                event.preventDefault();
                            }
                        },
                        pagination: {
                            scroll: true,
                            loadMore: true // xxx false
                        }
                    }, options.defaultIconListOptions );

                    view$.tableModelView( listOptions );
                    viewInstance = view$.data( "apex-tableModelView" );
                } else {
                    throw new Error( "Invalid display value" );
                }

                dialog$.append( content$.children() );

                if ( options.minSearchChars > 0 ) {
                    filterRequiredNoData = lang.formatMessage( "APEX.POPUP_LOV.FILTER_REQ", options.minSearchChars );
                }
                if ( !filterRequiredNoData && options.initialFetch === "none" ) {
                    filterRequiredNoData = lang.getMessage( "APEX.POPUP_LOV.INITIAL_FILTER_REQ" );
                }

                if ( incrementalSearch ) {
                    debounceSearch = util.debounce( function() {
                        refresh( searchControl, searchInput$.val() );
                    }, 400 );
                }

                view$.keydown( function( event ) {
                    var kc = event.which;

                    if ( event.isDefaultPrevented() ) {
                        return;
                    }
                    if ( kc === KEY_DOWN ) {
                        // wrap around to the search field
                        searchInput$.focus();
                    } else if ( kc === KEY_UP ) {
                        // move back up to the clear button or search field if present.
                        clearButton$.add( searchInput$ ).last().focus();
                    }
                } ).focusin( function() {
                    var sel = viewInstance.getSelection();
                    if ( sel.length === 0 ) {
                        // use ownerDocument because document may not be the right document
                        sel = $( view$[0].ownerDocument.activeElement ).closest( ".a-IconList-item,.a-GV-row" );
                        if ( sel[0] ) {
                            viewInstance.setSelection( sel );
                        }
                    }
                } );

                searchInput$.keydown( function( event ) {
                    var rec,
                        kc = event.which;

                    if ( kc === KEY_DOWN ) {
                        if ( clearButton$[0] ) {
                            clearButton$.focus();
                        } else {
                            viewInstance.focus();
                        }
                        event.preventDefault();
                    } else if ( kc === KEY_UP ) {
                        viewInstance.focus();
                        event.preventDefault();
                    } else if ( kc === KEY_TAB && incrementalSearch ) {
                        if ( model.getTotalRecords() === 1 ) {
                            // make sure something is selected
                            if ( grid$ ) {
                                grid$.grid( "setSelection", grid$.find( ".a-GV-cell" ).eq(0) );
                            } else {
                                viewInstance.focus();
                            }
                            save();
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    } else if ( kc === KEY_ENTER ) {
                        // prevent the browser default to submit the page when this is the only text item on the page
                        event.preventDefault();
                        if ( incrementalSearch && options.enterable && isPopup && searchInput$.val() ) {
                            // Special case when enter pressed in search input and doing incremental search and inline
                            // popup under and the field is enterable/no display then the value entered is the value to be selected.
                            // This makes it easier to enter things not in the list while searching to see if maybe they are.
                            // save searchInput not a selected item/record
                            result = {
                                v: searchInput$.val()
                            };
                            dialog$[widget]( "close" );
                        } else if ( incrementalSearch && !options.enterable && model.getTotalRecords() === 1 ) {
                            // special case to make it easier to select the one and only result found
                            rec = null;
                            model.forEach( function(r) { rec = r; } );
                            if ( rec ) {
                                viewInstance.setSelectedRecords([rec]);
                                save();
                            }
                        } else {
                            refresh( searchControl, searchInput$.val() );
                        }
                    } else if ( incrementalSearch ) {
                        debounceSearch();
                    }
                } );
                searchButton$.click( function() {
                    refresh( searchControl, searchInput$.val() );
                } );
                clearButton$.click( function() {
                    saveNullValue();
                } ).keydown( function( event ) {
                    var kc = event.which;
                    if ( kc === KEY_DOWN ) {
                        viewInstance.focus();
                        event.preventDefault();
                    } else if ( kc === KEY_UP ) {
                        searchInput$.focus();
                        event.preventDefault();
                    }
                } );

                // The Popup LOV dialog widget manages its own keyboard interactions, and we want screen reader 
                // users to always benefit from this same keyboard support, so make the dialog$ content element a landmark
                // application role to allow these keystrokes through
                dialog$.attr( "role", "application" );

            },
            open: function( event ) {
                var width, height, ww, wh,
                    searchControl = item$.data( "popupSearchState" ),
                    search = searchControl.searchText || "",
                    dialog$ = topJQuery( event.target ),
                    widget = dialog$.is( ":data(apexPopup)" ) ? "popup" : "dialog";

                if ( !options.width ) {
                    width = item$.closest( ".apex-item-group--popup-lov" ).width(); // dialog min width keeps this from getting too small
                }
                if ( isPopup ) {
                    // A dialog is responsive at least in UT and that will adjust its size for small screens
                    // but a popup is not so make sure it isn't bigger than the window
                    ww = $( window ).width() - 10;
                    wh = $( window ).height() - 10;
                    if ( ( options.width || width ) > ww ) {
                        width = ww;
                    }
                    if ( options.height > wh ) {
                        height = wh;
                    }
                    // todo think if too big may just want to center
                }
                if ( width ) {
                    dialog$[widget]( "option", "width", width );
                }
                if ( height ) {
                    dialog$[widget]( "option", "height", height );
                }
                resize( event.target );

                result = null;
                if ( search || searchControl.forceRefresh ) {
                    searchInput$.val( search );
                    refresh( searchControl, search );
                }

                // dialog widget has logic to set the focus on open which works very well except for Firefox when
                // opened from an APEX modal dialog page. So set the focus here to be sure.
                searchInput$.focus();
            },
            resize: function( event ) {
                resize( event.target );
            },
            resizeStop: function( event, ui ) {
                // popup should never resize but double check just in case because don't want to ever persist the size
                if ( persistentState && !isPopup ) {
                    persistentState.height = ui.size.height;
                    persistentState.width = ui.size.width;
                    saveState();
                }
            }
        };
        [ "draggable", "resizable", "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight", "noOverlay" ].forEach( function( prop ) {
            if ( options[prop] !== undefined ) {
                dialogOptions[prop] = options[prop];
            }
        } );
        apex.message.showDialog( messageContent, dialogOptions );
    };

    /**
     * helper function: Sort the chart data, to ensure the order of the series items matches the groups array
     * @param pItems
     * @ignore
     */
    var chartSortArray = function( pItems, pOrder ) {
        pItems.sort( function( a, b ) {
            if ( a.name < b.name ) {
                return -1;
            } else if ( a.name > b.name ) {
                return 1;
            }
            return 0;
        });

        if ( pOrder === 'label-desc' ) {
            pItems.reverse();
        }
    }; // chartSortArray

    widgetUtil.chartSortArray = chartSortArray;

    /**
     * helper function: Fill gaps for missing data points, to ensure each group has an associated data point in each series
     * @ignore
     */
    widgetUtil.chartFillGaps = function( pGroups, pItems, pOrder, pConnect ) {
        chartSortArray( pItems, pOrder );

        for ( var groupIdx = 0; groupIdx < pGroups.length; groupIdx++ ) {
            // Each group entry must have a corresponding entry in the items array, required by JET
            if ( !pItems[ groupIdx ] || pItems[ groupIdx ].name !== pGroups[ groupIdx ].name ) {
                // Add a new entry for a missing data point
                // The setting of value depends on user's 'Connect Null Data Points' setting.
                // A value of 0 will result in a continuous line; a value of null will result in a broken line
                //items.splice( groupIdx, 0, pConnect ? { name: groups[ groupIdx ].name, value: 0 } : { name: groups[ groupIdx ].name, value: null } );
                pItems.splice( groupIdx, 0, { name: pGroups[ groupIdx ].name, value:  pConnect ? 0 : null } );
            } else if ( pItems[ groupIdx ].id !== groupIdx ) {
                // Correct the id if we have added new data points
                pItems[ groupIdx ].id = groupIdx;
            }
        }
    };  // chartFillGaps

    /**
     * Utility function to enable any icons descendant of $pContainer
     * If passing pClickHandler to rebind the icon's click handler, the
     * $pContainer must be the same as the element you wish to bind the
     * handler to (eg the icon's wrapping anchor).
     *
     * @param {jQuery}   $pContainer
     * @param {String}   pHref
     * @param {Function} [pClickHandler]
     *
     * @deprecated
     * @memberOf apex.widget.util
     **/
    widgetUtil.enableIcon = function( $pContainer, pHref, pClickHandler ) {
        $pContainer
            .find( "img" )           // locate any images descendant of $pContainer
            .css({ "opacity" : 1,
                "cursor"  : "" }) // set their opacity and remove cursor
            .parent( "a" )           // go to parent, which should be an anchor
            .attr( "href", pHref );  // add the href
        // check if pClickHandler is passed, if so, bind it
        if ( pClickHandler ) {
            $pContainer.click( pClickHandler ); // rebind the click handler
        }
    }; // enableIcon

    /**
     * Utility function to disable any icons descendant of $pContainer
     *
     * @param {jQuery} $pContainer
     *
     * @deprecated
     * @memberOf apex.widget.util
     **/
    widgetUtil.disableIcon = function( $pContainer ) {
        $pContainer
            .find( "img" )
            .css({ "opacity" : 0.5,
                "cursor"  : "default" })
            .parent( "a" )
            .removeAttr( "href" )
            .unbind( "click" );
    }; // disableIcon

    /*
     * Common functionality for widgets to check if the become visible or hidden
     */
    var visibleCheckList = [];

    function findInVisibleCheckList(element) {
        var i;
        for ( i = 0; i < visibleCheckList.length; i++ ) {
            if ( visibleCheckList[i].el === element ) {
                return i;
            }
        }
        return null;
    }

    /**
     * todo
     * @param pElement
     * @param pCallback
     */
    widgetUtil.onVisibilityChange = function( pElement, pCallback ) {
        var index = findInVisibleCheckList( pElement ),
            c = {
            el: pElement,
                cb: pCallback
        };
        if ( index !== null ) {
            visibleCheckList[index] = c;
        } else {
            visibleCheckList.push(c);
        }
    };

    /**
     * todo
     * @param pElement
     */
    widgetUtil.offVisibilityChange = function( pElement ) {
        var index = findInVisibleCheckList( pElement );
        if ( index !== null ) {
            visibleCheckList.splice( index, 1 );
        }
    };

    /**
     * todo
     * @param pElement
     * @param pShow
     * @memberOf apex.widget.util
     */
    var visibilityChange = widgetUtil.visibilityChange = function( pElement, pShow ) {
        var i, check$, c,
            parent$ = $( pElement );
        pShow = !!pShow; // force true/false
        for ( i = 0; i < visibleCheckList.length; i++ ) {
            c = visibleCheckList[i];
            check$ = $( c.el );
            // todo can get false results because :visible may be true even if not visible because of a hidden ancestor.
            if ( pShow === check$.is( ":visible" ) && check$.closest(parent$ ).length ) {
                c.cb( pShow );
            }
        }
    };

    // setup handler for DA Show/Hide
    $( document ).on( "apexaftershow", function( e ) {
        visibilityChange( e.target, true );
    }).on( "apexafterhide", function( e ) {
        visibilityChange( e.target, false );
    } );

    var DATA_RESIZE_SENSOR = "apex-resize-sensor";

    /**
     * Register a callback for when a DOM element's dimensions change. The element must allow element content.
     *
     * @param {Element|String} pElement DOM element or string ID of a DOM element to detect size changes on.
     * @param {Function} pResizeCallback no argument function to call when the size of the element changes
     */
    widgetUtil.onElementResize = function( pElement, pResizeCallback ) {
        var el$, tracker;
        if ( typeof pElement === "string" ) {
            pElement = "#" + pElement;
        }
        el$ = $( pElement ).first();
        tracker = el$.data( DATA_RESIZE_SENSOR );
        if ( !tracker ) {
            tracker = new ResizeTracker( el$[0] );
            el$.data( DATA_RESIZE_SENSOR, tracker );
            tracker.start();
        }
        tracker.addListener( pResizeCallback );

    /*
         DON'T use ResizeSensor for now
            var rs, el$;

            if ( typeof pElement === "string" ) {
                pElement = "#" + pElement;
            }
            el$ = $( pElement ).first();
            if ( el$.length ) {
                rs = new ResizeSensor( el$[0], pResizeCallback );
                el$.data( DATA_RESIZE_SENSOR, rs);
            }
     */
    };

    /**
     * Remove the callback registered with onElementResize for the given element.
     *
     * @param {Element|String} pElement DOM element or string ID of a DOM element to detect size changes on.
     * @param {Function} pResizeCallback no argument function to call when the size of the element changes
     */
    widgetUtil.offElementResize = function( pElement, pResizeCallback ) {
        var el$, tracker;
        if ( typeof pElement === "string" ) {
            pElement = "#" + pElement;
        }
        el$ = $( pElement ).first();
        tracker = el$.data( DATA_RESIZE_SENSOR );
        if ( tracker ) {
            if ( pResizeCallback ) {
                tracker.removeListener( pResizeCallback );
                if ( tracker.isEmpty() ) {
                    tracker.stop();
                    el$.removeData( DATA_RESIZE_SENSOR );
                }
            } else {
                tracker.destroy();
                el$.removeData( DATA_RESIZE_SENSOR );
            }
        }
    /*
     DON'T use ResizeSensor for now
        var rs, el$;

        if ( typeof pElement === "string" ) {
            pElement = "#" + pElement;
        }
        el$ = $( pElement ).first();
        rs = el$.data( DATA_RESIZE_SENSOR );
        rs.detach();
        el$.removeData( DATA_RESIZE_SENSOR );
    */
    };

    /**
     * Updates any resize sensors added when onElementResize is used. Call this function
     * when an element containing a resize sensor has been made visible or is connected to the DOM.
     *
     * @param {!Element} pElement DOM element or string ID of a DOM element that has become visible and may contain
     *                            resize sensors.
     */
    widgetUtil.updateResizeSensors = function( pElement ) {
        if ( typeof pElement === "string" ) {
            pElement = "#" + pElement;
        }
        $( pElement ).find( ".js-resize-sensor" ).parent().each( function( i, el ) {
            var tracker = $( el ).data( DATA_RESIZE_SENSOR );
            if ( tracker != null ) {
                tracker.init( true );
            }
        }
        );
    };

    /**
     * @preserve Oracle JET TouchProxy, ResizeTracker
     * Copyright (c) 2014, 2018, Oracle and/or its affiliates.
     * The Universal Permissive License (UPL), Version 1.0
     */
    // TODO would like to use these things directly from JET library but the global symbols are compiled away
    /*
     * Temp? replacement for ResizeSensor library
     * extracted from JET
     * Utility class for tracking resize events for a given element and dispatching them to listeners
     * Updated with changes from JET 4.2.0 but not including code for _collapsingManagers, _collapsingListeners.
     */
    var ResizeTracker = function(div) {
        var _listeners = $.Callbacks(),
            _RETRY_MAX_COUNT = 2,
            _retrySetScroll = 0,
            _invokeId = null,
            _oldWidth  = null,
            _oldHeight = null,
            _detectExpansion = null,
            _detectContraction = null,
            _resizeListener = null,
            _scrollListener = null;

        this.addListener = function(listener) {
            _listeners.add(listener);
        };

        this.removeListener = function(listener) {
            _listeners.remove(listener);
        };

        this.isEmpty = function() {
            return !_listeners.has();
        };

        this.destroy = function() {
            _listeners.empty();
            this.stop();
        };

        this.start = function() {

            function setStyles( s1, s2 ) {
                s1.direction = "ltr";
                s1.position = s2.position = "absolute";
                s1.left = s1.top = s1.right = s1.bottom = "0";
                s1.overflow = "hidden";
                s1.zIndex = "-1";
                s1.visibility = "hidden";
                s2.left = s2.top = "0";
                s2.transition = "0s";
            }

            _scrollListener = _handleScroll.bind(this);

            // : Use native onresize support on teh DIV in IE9/10 and  since no scroll events are fired on the
            // contraction/expansion DIVs in IE9
            if (div.attachEvent) {
                _resizeListener = _handleResize.bind(this);
                div.attachEvent('onresize', _resizeListener);
            } else {
                var firstChild = div.childNodes[0];

                // This child DIV will track expansion events. It is meant to be 1px taller and wider than the DIV
                // whose resize events we are tracking. After we set its scrollTop and scrollLeft to 1, any increate in size
                // will fire a scroll event
                _detectExpansion = document.createElement("div");
                // don't want css dependencies but need to find later
                _detectExpansion.className = "js-resize-sensor";

                var expansionChild = document.createElement("div");
                setStyles( _detectExpansion.style, expansionChild.style );
                _detectExpansion.appendChild(expansionChild);
                if ( firstChild ) {
                    div.insertBefore(_detectExpansion, firstChild);
                } else {
                    div.appendChild(_detectExpansion);
                }

                _detectExpansion.addEventListener("scroll", _scrollListener, false);

                // This child DIV will track contraction events. Its height and width are set to 200%. After we set its scrollTop and
                // scrollLeft to the current height and width of its parent, any decrease in size will fire a scroll event
                _detectContraction = document.createElement("div");
                // don't want css dependencies: _detectContraction.className = "oj-helper-detect-contraction";

                var contractionChild = document.createElement("div");
                setStyles( _detectContraction.style, contractionChild.style );
                contractionChild.style.width = "200%";
                contractionChild.style.height = "200%";
                _detectContraction.appendChild(contractionChild);
                div.insertBefore(_detectContraction, _detectExpansion);

                _detectContraction.addEventListener("scroll", _scrollListener, false);

                this.init(false);
            }
        };

        this.stop = function() {
            if (_invokeId !== null) {
                util.cancelInvokeAfterPaint(_invokeId);
                _invokeId = null;
            }
            if (_detectExpansion !== null) {
                _detectExpansion.removeEventListener("scroll", _scrollListener);
                _detectContraction.removeEventListener("scroll", _scrollListener);
                // Check before removing to prevent CustomElement polyfill from throwing
                // a NotFoundError when removeChild is called with an element not in the DOM
                if (_detectExpansion.parentNode) {
                    div.removeChild( _detectExpansion );
                }
                if (_detectContraction.parentNode) {
                    div.removeChild( _detectContraction );
                }
            } else {
                // assume IE9/10
                div.detachEvent('onresize', _resizeListener);
            }
        };

        this.init = function(isFixup) {
            var adjusted = _checkSize(isFixup);
            if (isFixup && !adjusted && _detectExpansion.offsetParent != null) {
                _adjust(_oldWidth, _oldHeight);
            }
        };

        function _checkSize(fireEvent) {
            var adjusted = false;
            if (_detectExpansion.offsetParent != null) {
                var newWidth = _detectExpansion.offsetWidth;
                var newHeight = _detectExpansion.offsetHeight;

                if (_oldWidth !== newWidth || _oldHeight !== newHeight) {
                    _retrySetScroll = _RETRY_MAX_COUNT;
                    _adjust(newWidth, newHeight);
                    adjusted = true;

                    if (fireEvent) {
                        _notifyListeners(true);
                    }
                }
            }

            return adjusted;
        }

        function _notifyListeners(useAfterPaint) {
            var newWidth = div.offsetWidth;
            var newHeight = div.offsetHeight;
            if (_listeners.has()) {
                if (!useAfterPaint) {
                    _listeners.fire(newWidth, newHeight);
                } else {
                    if (_invokeId !== null) {
                        util.cancelInvokeAfterPaint(_invokeId);
                    }

                    _invokeId = util.invokeAfterPaint(
                        function() {
                            _invokeId = null;
                            _listeners.fire(newWidth, newHeight);
                        }
                    );
                }
            }
        }

        function _handleScroll(evt) {
            evt.stopPropagation();
            if (!_checkSize(true)) {
                // Workaround for the WebKit issue where scrollLeft gets reset to 0 without the DIV being expanded
                // We will retry to the set the scrollTop only twice to avoid infinite loops
                if (_retrySetScroll > 0 && _detectExpansion.offsetParent != null &&
                    (_detectExpansion.scrollLeft == 0 || _detectExpansion.scrollTop == 0)) {
                    _retrySetScroll--;
                    _adjust(_oldWidth, _oldHeight);
                }
            }
        }

        function _handleResize() {
            _notifyListeners(false);
        }

        function _adjust(width, height) {
            _oldWidth = width;
            _oldHeight = height;

            var expansionChildStyle = _detectExpansion.firstChild.style;

            var delta = 1;

            // The following loop is a workaround for the WebKit issue with zoom < 100% -
            // the scrollTop/Left gets reset to 0 because it gets computed to a value less than 1px.
            // We will try up to the delta of 5 to support scaling down to 20% of the original size
            do {
                expansionChildStyle.width = width + delta + 'px';
                expansionChildStyle.height = height + delta + 'px';
                _detectExpansion.scrollLeft = _detectExpansion.scrollTop = delta;
                delta++;
            } while ((_detectExpansion.scrollTop == 0 || _detectExpansion.scrollLeft == 0) && delta <= 5);


            _detectContraction.scrollLeft = width;
            _detectContraction.scrollTop = height;
        }
    };

    /**
     * @preserve jQuery UI Touch Punch 0.2.3
     *
     * Copyright 2011-2014, Dave Furfero
     * Dual licensed under the MIT or GPL Version 2 licenses.
     */

    /**
     * Utility class for proxying touch events for a given element and mapping them to mouse events
     * @constructor
     * @ignore
     * @private
     */
    widgetUtil.TouchProxy = function(elem) {
        this._init(elem);
    };

    /**
     * Initializes the TouchProxy instance
     *
     * @param {Object} elem
     * @private
     */
    widgetUtil.TouchProxy.prototype._init = function(elem) {
        this._elem = elem;

        this._touchHandled = false;
        this._touchMoved = false;

        //add touchListeners
        this._touchStartHandler = $.proxy(this._touchStart, this);
        this._touchEndHandler = $.proxy(this._touchEnd, this);
        this._touchMoveHandler = $.proxy(this._touchMove, this);

        this._elem.on({
            "touchstart": this._touchStartHandler,
            "touchend": this._touchEndHandler,
            "touchmove": this._touchMoveHandler,
            "touchcancel": this._touchEndHandler
        });
    };

    widgetUtil.TouchProxy.prototype._destroy = function() {
        if (this._elem && this._touchStartHandler) {
            this._elem.off({
                "touchstart": this._touchStartHandler,
                "touchmove": this._touchMoveHandler,
                "touchend": this._touchEndHandler,
                "touchcancel": this._touchEndHandler
            });

            this._touchStartHandler = undefined;
            this._touchEndHandler = undefined;
            this._touchMoveHandler = undefined;
        }
    };

    /**
     * Simulate a mouse event based on a corresponding touch event
     * @param {Object} event A touch event
     * @param {string} simulatedType The corresponding mouse event
     *
     * @private
     */
    widgetUtil.TouchProxy.prototype._touchHandler = function(event, simulatedType) {
        // Ignore multi-touch events
        if (event.originalEvent.touches.length > 1) {
            return;
        }

        // - contextmenu issues: presshold should launch the contextmenu on touch devices
        if (event.type != "touchstart" && event.type != "touchend") {
            event.preventDefault();
        }

        var touch = event.originalEvent.changedTouches[0],
            simulatedEvent = document.createEvent("MouseEvent");

        // Initialize the simulated mouse event using the touch event's coordinates
        // initMouseEvent(type, canBubble, cancelable, view, clickCount,
        //                screenX, screenY, clientX, clientY, ctrlKey,
        //                altKey, shiftKey, metaKey, button, relatedTarget);
        simulatedEvent.initMouseEvent(simulatedType, true, true, window, 1,
            touch.screenX, touch.screenY,
            touch.clientX, touch.clientY, false,
            false, false, false, 0/*left*/, null);

        touch.target.dispatchEvent(simulatedEvent);
    };

    /**
     * Handle touchstart events
     * @param {Object} event The element's touchstart event
     *
     * @private
     */
    widgetUtil.TouchProxy.prototype._touchStart = function(event) {
        // Ignore the event if already being handled
        if (this._touchHandled) {
            return;
        }

        // set the touchHandled flag
        this._touchHandled = true;

        // Track movement to determine if interaction was a click
        this._touchMoved = false;

        // Simulate the mouseover, mousemove and mousedown events
        this._touchHandler(event, "mouseover");
        this._touchHandler(event, "mousemove");
        this._touchHandler(event, "mousedown");
    };

    /**
     * Handle the touchmove events
     * @param {Object} event The element's touchmove event
     *
     * @private
     */
    widgetUtil.TouchProxy.prototype._touchMove = function(event) {
        // Ignore event if not handled
        if (! this._touchHandled) {
            return;
        }

        // Interaction was not a click
        this._touchMoved = true;

        // Simulate the mousemove event
        this._touchHandler(event, "mousemove");
    };

    /**
     * Handle the touchend events
     * @param {Object} event The element's touchend event
     *
     * @private
     */
    widgetUtil.TouchProxy.prototype._touchEnd = function(event) {
        // Ignore event if not handled
        if (!this._touchHandled) {
            return;
        }

        // Simulate the mouseup and mouseout events
        this._touchHandler(event, "mouseup");
        this._touchHandler(event, "mouseout");

        // If the touch interaction did not move, it should trigger a click
        // except that the browser already creates a click and we don't want two of them
        /*
        if (!this._touchMoved && event.type == "touchend") {
            // Simulate the click event
            this._touchHandler(event, "click");
        } */

        // Unset the flag
        this._touchHandled = false;
    };

    widgetUtil.TouchProxy._TOUCH_PROXY_KEY = "apexTouchProxy";

    widgetUtil.TouchProxy.prototype.touchMoved = function() {
        return this._touchMoved;
    };

    /**
     * Adds touch event listeners
     * @param {Object} elem
     * @ignore
     */
    widgetUtil.TouchProxy.addTouchListeners = function(elem) {
        var jelem = $(elem),
            proxy = jelem.data(widgetUtil.TouchProxy._TOUCH_PROXY_KEY);

        if (!proxy) {
            proxy = new widgetUtil.TouchProxy(jelem);
            jelem.data(widgetUtil.TouchProxy._TOUCH_PROXY_KEY, proxy);
        }

        return proxy;
    };

    /**
     * Removes touch event listeners
     * @param {Object} elem
     * @ignore
     */
    widgetUtil.TouchProxy.removeTouchListeners = function(elem) {
        var jelem = $(elem),
            proxy = jelem.data(widgetUtil.TouchProxy._TOUCH_PROXY_KEY);

        if (proxy) {
            proxy._destroy();
            jelem.removeData(widgetUtil.TouchProxy._TOUCH_PROXY_KEY);
        }
    };

})( apex.widget.util, apex.util, apex.lang, apex.navigation, apex.jQuery );
