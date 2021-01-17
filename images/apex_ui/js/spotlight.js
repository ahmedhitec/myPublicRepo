/*global window.PageDesigner, apex, $v, pe */

/**
 @license

 Oracle Database Application Express, Release 5.0

 Copyright (c) 2013, 2018, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @fileOverview
 *
 * This file creates a Spotlight search dialog in App Builder.
 * There are two ways to open it:
 *   1. click the search icon on the top right
 *   2. Shortcut: Ctrl + '
 *
 * It always searches a static JSON file for navigation and
 * a dynamic list of Apps / Pages depending on page.
 *
 * There is no namespace created.
 *
 * JSON index format:
 * [
    {
        "name":"<Name to be searched.>",
        "url":"<Target URL>",
        "description":"<Item description used for screen readers>",
        
        //Path can be either a single path or an array of path steps:
        "path": "<Path where the Item is located>",
        
        //Or:
        
        "path": {
            //Part of the path on the Nth level. 
            //Example: Parent Category / Subcategory / Item Parent / Item Name
            "level1": "<Parent Category>",
            "level2": "<Subcategory>",
            "last": "<Item Parent>",
        },
        "icon":"<If item has an icon, otherwise non existant>",
        "priority":"<Number with level of priority for this item>",
        "scope":"<Defined to narrow down or focus search on specific 
                 items under certain scope (e.g.: global, app)>",
    }

    //FOR in-app search:
    //Scope is always "app"
    {
        "name":"<Name of the Page or App element to be searched.>",
        "pageId":"<Page number>",
        "parentAppId":"<Parent application ID>",
        "priority":"<SEE ABOVE>"
    }  
]
 *
 **/

$( function () {
    "use strict";

    (function( $, util, nav, lang, actions, pd ){

        var session = $v( 'pInstance' ),
            // The app opened in Page Designer or in shared components / app utilities
            currentAppId = $v('F4000_P1_FLOW') || $v('P4500_CURRENT_APP'),
            hasDialogCreated = $( DOT + SP_DIALOG ).length > 0,
            appIdNameMapping = {}, // stores appId and name mapping to support numeric search that displays app name in result
            keywords = '',
            appId   = $v( 'pFlowId'),
            //Indexes
            gCommonStaticIndex = [],
            gApplicationsIndex = [],
            gAppPagesIndex = [],
            //In-app id search
            gAppId = '',
            gInAppSearchEnabled = false,
            gResetCache = false,
            gDefaultStaticFile = apex_img_dir + "apex_ui/js/staticData/apex_search_common_en.json",
            gLanguageStaticFile = apex_img_dir + "apex_ui/js/staticData/apex_search_common_" + apex.locale.getLanguage() + ".json",
            // Pages outside specific app scope but with apex.builder.gApplicationId set.
            gExcludeArray = [20,49,56,57,73,76,78,160,163,196,224,226,227,273,279,
                            433,441,460,479,494,495,514,516,523,527,559,588,589,598,
                            650,680,689,722,733,800,875,876,933,934,1500,2100,2101,
                            2102,2103,2104,2105,2106,2107,2108,2109,2111,2115,2116,
                            2117,2150,2151,2152,2153,2154,2155,2157,3000,3001,3005,
                            3020,4460,4900];

        // Disable Spotlight for:
        // 1. Modal Dialog
        // 2. "Instance Administration" app.
        if ( ( window.self !== window.top ) || ( appId === '4050' ) ) {
            return false;
        }
            // pe.model.js is loaded after this file in Page Designer 4000:4500
        if ( typeof pe !== 'undefined' ) {
            var model = pe;
        }

        var URL_TYPES = {
                redirect:           'redirect',
                searchPage:         'search-page',
                searchApp:          'search-app',
                searchAllApps:      'search-all-apps',
                go2Page:            'goto-page',
                go2App:             'goto-app',
                pe:                 'pe',
                shortcutAction:     'shortcutAction'
            },

            ICONS = {
                app:    'icon-edit-app',
                page:   'icon-page',
                search: 'icon-search',
                shared: 'icon-shared-components',
                nav:    'icon-goto-group',
                pe:     'icon-page-designer'
            },

            DOT = '.',
            SP_DIALOG           = 'a-Spotlight',
            SP_INPUT            = 'a-Spotlight-input',
            SP_RESULTS          = 'a-Spotlight-results',
            SP_ACTIVE           = 'is-active',
            SP_SHORTCUT         = 'a-Spotlight-shortcut',
            SP_ACTION_SHORTCUT  = 'spotlight-search',
            SP_RESULT_LABEL     = 'a-Spotlight-label',
            SP_LIVE_REGION      = 'sp-aria-match-found',
            SP_LIST             = 'sp-result-list',
            KEYS                = $.ui.keyCode;

        var MAX_NAV_RESULTS     = 100,
            MAX_PE_RESULTS      = 50,
            MIN_TOP_SCORE       = 80,
            MAX_TOP_RESULTS     = 5;

        var location = function() {
            // 8 Internal Apps that have Spotlight search with Page Process: spotlightIndex
            // 4000 App Builder
            // 4300 Data Workshop
            // 4350 APEX Workspace Administration
            // 4400 App Migrations
            // 4500 SQL Workshop
            // 4750 Packaged Applications
            // 4800 Team Development
            // 4850 RESTful Services

            var LOCATIONS = {
                4000: 'builder',
                4500: 'builder', // SQL Workshop
                4800: 'teamdev',
                4350: 'admin'
            };
            return LOCATIONS[ appId ];
        }();

        // Get correct context app ID
        // In case we are in Shared Components, etc. within an app.
        // but outside the excluded pages from the gExcludeArray.
        var getContextAppId = function() {
            var lPageUrl = window.location.search.substring(1),
            lAppAndPageIds = lPageUrl.replace( 'p=','').split(':');

            if ( lAppAndPageIds[0] === '4000' &&
                    !gExcludeArray.includes( parseInt( lAppAndPageIds[1] ) ) ) {
                return apex.builder.gApplicationId;
            } else {
                return '';
            }
        };

        // Verify application context
        // This is to enable in-app search in Shared Components, etc.
        if ( currentAppId.length <= 0 ) {
            currentAppId = getContextAppId();
        }

        var msg = lang.formatMessage,
            staticMsg = {
                app: lang.getMessage( 'SL.APP' ),
                page: lang.getMessage( 'SL.PAGE' ),
                placeHolder: lang.getMessage( 'SL.PLACEHOLDER' ),
                oneMatchFound: lang.getMessage( 'SL.MATCH.FOUND' ),
                noMatchFound:  lang.getMessage( 'SL.NO.MATCH.FOUND' ),
                enterKeywords: lang.getMessage( 'SL.SEARCH.HELP' )
            };

        // returns APEX format URL
        var getUrl = function( url ){
            var u;

            if ( isNaN( url.split( ':' )[0] )  ) {
                u = url;
            } else {
                // e.g. url is 4000:1 format
                u = 'f?p=' + url + ':' + session;
            }
            return u;
        };

        // the focus before Spotlight dialog is opened
        var focusElement;

        var getMarkup = function ( data ) {
            var title = data.title,
                desc = data.desc,
                path = data.path || '',
                url = data.url,
                type = data.type,
                icon = data.icon,
                shortcut = data.shortcut,
                shortcutMarkup = shortcut ? '<span class="' + SP_SHORTCUT + '" >' + shortcut + '</span>' : '',
                dataAttr = '',
                peData = data.peData,
                peAttr,
                out,
                iconMarkup;

            if ( url === 0 || ( url && url.length > 0 ) ) {
                dataAttr = 'data-url="' + url + '" ';
            }

            if ( type ) {
                dataAttr = dataAttr + ' data-type="' + type + '" ';
            }

            if ( peData ) {
                for ( peAttr in peData ) {
                    if ( peData.hasOwnProperty( peAttr ) ) {
                        dataAttr = dataAttr + ' data-' + peAttr + '="' + peData[ peAttr ] + '" ';
                    }
                }
            }

            if ( type === URL_TYPES.go2App && data.initials.trim().length > 0 ) {
                iconMarkup = '<span class="' + icon + '" style="color: #fff; box-shadow: 0 0 0 1px #fff;webkit-box-shadow: 0 0 0 1px #fff;position: relative;z-index: 1;margin-right: 16px;padding: 8px;width: 32px;height: 32px;border-radius: 2px;" aria-hidden="true">' + 
                                '<span class="a-Icon">' + data.initials + '</span>' +
                             '</span>';
                desc = desc || 'Open Application ' + title;
            } else if ( data.hasCustomIcon )  {
                iconMarkup = icon;
            }else {
                iconMarkup = '<span class="a-Spotlight-icon" aria-hidden="true">' + 
                                '<span class="a-Icon ' + icon + '"></span>' +
                             '</span>';
            }

            // Add alias, if any.
            title +=  ( data.alias && data.alias.trim().length > 0 ) ?
                        ' <span class="a-Spotlight-labelContext">' + data.alias.toLowerCase() + '</span>' : '';

            out = '<li class="a-Spotlight-result a-Spotlight-result--page" aria-label="' + desc + '">' +
                '<span class="a-Spotlight-link" ' + dataAttr + '>' + 
                    iconMarkup +
                    '<span class="a-Spotlight-info">' +
                        '<span class="' + SP_RESULT_LABEL + '" role="option">' + title + '</span>' +
                        '<span class="a-Spotlight-desc">' + path.replace( '{APP_ID}', currentAppId ) + '</span>' +
                    '</span>' +
                    shortcutMarkup +
                '</span>' +
                '</li>';

            return out;
        };

        // @param {obj} elem$ is <a> link
        var goTo = function( elem$, event ){

            var url = elem$.data( 'url' ),
                type = elem$.data( 'type' ),
                actionLookup;

            switch ( type ) {
                case URL_TYPES.pe:
                    pd.goToComponent( elem$.data( 'typeid' ), elem$.data( 'componentid' ), elem$.data( 'propertyid' ) );
                    break;

                case URL_TYPES.searchPage:
                    pd.activateTab( 'search' );
                    $( '#P4500_LOCAL_SEARCH' )
                        .val( keywords )
                        .trigger( 'change' )
                        .focus();
                    break;

                case URL_TYPES.searchApp:
                    nav.popup( {
                        url: 'f?p=4000:8000:' + session + '::::P8000_START_SEARCH,P8000_SEARCH:1,' + encodeURIComponent( keywords ),
                        name: 'SEARCH_RESULTS',
                        width: 1000,
                        height: 800
                    } );
                    break;

                case URL_TYPES.searchAllApps:
                    nav.popup( {
                        url: 'f?p=4000:8000:' + session + '::::FB_FLOW_ID,FB_FLOW_PAGE_ID,P8000_START_SEARCH,P8000_SEARCH:' + currentAppId + ',,1,' + encodeURIComponent( keywords ),
                        name: 'SEARCH_RESULTS',
                        width: 1000,
                        height: 800
                    } );
                    break;

                case URL_TYPES.go2App:
                    nav.redirect( 'f?p=4000:1:' + session + '::NO::FB_FLOW_ID,F4000_P1_FLOW,P0_FLOWPAGE:' + url + ',' + url + ',' + url );
                    break;

                case URL_TYPES.go2Page:
                    if ( pd && !gInAppSearchEnabled ) {
                        pd.goToPage( url );
                    } else if ( gInAppSearchEnabled ) {
                        nav.redirect( 'f?p=4000:4150:' + session + '::NO::FB_FLOW_ID,FB_FLOW_PAGE_ID:' + gAppId + ',' + url );
                    } else {
                        nav.redirect( 'f?p=4000:4150:' + session + '::NO::FB_FLOW_PAGE_ID:' + url );
                    }
                    break;

                case URL_TYPES.redirect:
                    nav.redirect( getUrl( url ) );
                    break;

                case URL_TYPES.shortcutAction:
                    actionLookup = actions.lookup( url );
                    if ( actionLookup.action || actionLookup.href ) {
                        actions.invoke( url, event, focusElement );
                    } else {
                        actions.toggle( url );
                    }
                    break;
            }

            close();
        };

        // PE search
        var searchPe = function( pSearchExpr, pTypeId ) {

            var peResults,
                component,
                componentTypeId,
                lType,
                i, len, lHtml = '';

            var getType = function ( pTypeId ) {
                return model.getComponentType( pTypeId )
            };

            var getPeResults =  function ( pSearchExpr, pTypeId ) {
                var lComponents,
                    lType = getType( pTypeId ),
                    i, len;

                lComponents = model.displayTitleSearch( pSearchExpr, pTypeId );

                // Check all child component types
                if ( lType ) {
                    len = lType.childComponentTypes.length;
                    for ( i = 0; i < len; i++ ) {
                        lComponents = $.merge( getPeResults( pSearchExpr, lType.childComponentTypes[ i ] ), lComponents );
                    }
                }

                return lComponents;
            };

            peResults = getPeResults( pSearchExpr, pTypeId );

            if ( peResults.length > MAX_PE_RESULTS ) {
                peResults.length = MAX_PE_RESULTS;
            }

            for ( i = 0, len = peResults.length; i < len; i++ ) {
                component = peResults[ i ];
                componentTypeId = component.typeId;
                lType = getType( componentTypeId );
                lHtml += getMarkup( {
                    title: util.escapeHTML( lType.title.singular ) + ' &rarr; ' + util.escapeHTML( component.getDisplayTitle() ),
                    icon: ICONS.pe,
                    type: URL_TYPES.pe,
                    peData: {
                        typeid: componentTypeId,
                        componentid: component.id,
                        propertyid: lType.displayPropertyId
                    }
                });
            }

            return lHtml;

        };

        var reset = function() {
            $( '#' + SP_LIST ).empty();
            $( DOT + SP_INPUT ).val( '' ).focus();
            keywords = '';
            handleAriaAttr();

            if ( gResetCache ) {
                gResetCache = false;
                gInAppSearchEnabled = false;
                gAppId = '';
            }
        };

        var handleAriaAttr = function () {

            var results$ = $( DOT + SP_RESULTS ),
                input$ = $( DOT + SP_INPUT ),
                activeId = results$.find( DOT + SP_ACTIVE ).find( DOT + SP_RESULT_LABEL ).attr( 'id' ),
                activeElem$ = $( '#' + activeId ),
                activeText = activeElem$.text(),
                lis$ = results$.find( 'li' ),
                isExpanded = lis$.length !== 0,
                liveText = '',
                resultsCount = lis$.filter(function () {
                    // Exclude the global inserted <li>, which has shortcuts Ctrl + 1, 2, 3
                    // such as "Search Workspace for x".
                    return $( this ).find( DOT + SP_SHORTCUT ).length === 0;
                }).length;

            $( DOT + SP_RESULT_LABEL )
                .attr( 'aria-selected', 'false' );

            activeElem$
                .attr( 'aria-selected', 'true' );

            if ( keywords === '' ) {
                liveText = staticMsg.enterKeywords;
            } else if ( resultsCount === 0 ) {
                liveText = staticMsg.noMatchFound;
            } else if ( resultsCount === 1 ) {
                liveText = staticMsg.oneMatchFound;
            } else if ( resultsCount > 1 ) {
                liveText = msg( 'SL.N.MATCHES.FOUND', resultsCount );
            }

            liveText = activeText + ', ' + liveText;

            $( '#' + SP_LIVE_REGION ).text( liveText );

            input$
                .attr( 'aria-activedescendant', activeId )
                .attr( 'aria-expanded',         isExpanded );
        };

        var createDialog = function () {
            var viewHeight,
                lineHeight,
                viewTop,
                rowsPerView;

            var initHeights = function () {
                var viewTop$ = $( 'div.a-Spotlight-results' );

                viewHeight = viewTop$.outerHeight();
                lineHeight = $( 'li.a-Spotlight-result' ).outerHeight();
                viewTop = viewTop$.offset().top;
                rowsPerView = ( viewHeight / lineHeight );
            };

            var scrolledDownOutOfView = function ( elem$ ) {
                if ( elem$[0] ) {
                    var top = elem$.offset().top;
                    if ( top < 0 ) {
                        return true;  // scroll bar was used to get active item out of view
                    } else {
                        return top > viewHeight;
                    }
                }
            };

            var scrolledUpOutOfView = function ( elem$ ) {
                if ( elem$[0] ) {
                    var top = elem$.offset().top;
                    if (top > viewHeight) {
                        return true;  // scroll bar was used to get active item out of view
                    } else {
                        return top <= viewTop;
                    }
                }
            };

            // keyboard UP and DOWN support to go through results
            var getNext = function ( res$ ) {
                var current$ = res$.find( DOT + SP_ACTIVE),
                    sequence = current$.index(),
                    next$;
                if ( !rowsPerView ) {
                    initHeights();
                }

                if ( !current$.length || current$.is(':last-child') ) {
                    // Hit bottom, scroll to top
                    current$.removeClass( SP_ACTIVE );
                    res$.find( 'li' ).first().addClass( SP_ACTIVE );
                    res$.animate({
                        scrollTop:  0
                    });
                } else {
                    next$ = current$.removeClass( SP_ACTIVE).next().addClass( SP_ACTIVE );
                    if ( scrolledDownOutOfView( next$ ) ) {
                        res$.animate({
                            scrollTop: ( sequence - rowsPerView + 2 ) * lineHeight
                        }, 0);
                    }
                }
            };

            var getPrev = function ( res$ ) {
                var current$ = res$.find( DOT + SP_ACTIVE),
                    sequence = current$.index(),
                    prev$;

                if ( !rowsPerView ) {
                    initHeights();
                }

                if ( !res$.length || current$.is(':first-child') ) {
                    // Hit top, scroll to bottom
                    current$.removeClass( SP_ACTIVE );
                    res$.find( 'li' ).last().addClass( SP_ACTIVE );
                    res$.animate({
                        scrollTop:  res$.find( 'li' ).length * lineHeight
                    });
                } else {
                    prev$ = current$.removeClass( SP_ACTIVE).prev().addClass( SP_ACTIVE );
                    if ( scrolledUpOutOfView( prev$ ) ) {
                        res$.animate({
                            scrollTop: ( sequence - 1 ) * lineHeight
                        }, 0);
                    }
                }
            };

            $( window ).on( 'apexwindowresized', function () {
                initHeights();
            });

            $( 'body' )
                .append(
                    '<div class="' + SP_DIALOG + '">' +
                        '<div class="a-Spotlight-body">' +
                            '<div class="a-Spotlight-search">' +
                                '<div class="a-Spotlight-icon">' +
                                    '<span class="a-Icon icon-search" aria-hidden="true"></span>' +
                                '</div>' +
                                '<div class="a-Spotlight-field">' +
                                    '<input type="text" role="combobox" aria-expanded="false" aria-autocomplete="none" aria-haspopup="true" aria-label="Spotlight Search" aria-owns="' + SP_LIST + '" autocomplete="off" autocorrect="off" spellcheck="false" class="' + SP_INPUT + '" placeholder="' + staticMsg.placeHolder + '">' +
                                '</div>' +
                                '<div role="region" class="u-VisuallyHidden" aria-live="polite" id="' + SP_LIVE_REGION + '"></div>' +
                            '</div>' +
                            '<div class="' + SP_RESULTS + '">' +
                                '<ul class="a-Spotlight-resultsList" id="' + SP_LIST + '" tabindex="-1" role="listbox"></ul>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                )
                .on( 'input', DOT + SP_INPUT, function(){
                    var v = $( this ).val().trim(),
                        len = v.length;

                    if ( len === 0 ) {
                        reset();  // clears everything when keyword is removed.
                    } else if (len > 1 || !isNaN( v )) {
                        // search requires more than one character, or it is a number.
                        if (  v !== keywords ) {
                            search( v );
                        }
                    }
                })
                .on( 'keydown', DOT + SP_DIALOG, function( e ){
                    var results$ = $( DOT + SP_RESULTS ),
                        last4Results,
                        shortcutNumber;

                    // up/down arrows
                    switch ( e.which ) {
                        case KEYS.DOWN:
                            e.preventDefault();
                            getNext( results$ );
                            break;

                        case KEYS.UP:
                            e.preventDefault();
                            getPrev( results$ );
                            break;

                        case KEYS.ENTER:
                            e.preventDefault(); // don't submit on enter
                            goTo( results$.find( 'li.is-active span'), e );
                            break;
                        case KEYS.TAB:
                            close();
                            break;
                    }

                    if ( e.ctrlKey ) {
                        // supports Ctrl + 1, 2, 3, 4 shortcuts
                        last4Results = results$.find( DOT + SP_SHORTCUT ).parent().get().reverse();
                        switch ( e.which ) {
                            case 49: // Ctrl + 1
                                shortcutNumber = 1;
                                break;
                            case 50: // Ctrl + 2
                                shortcutNumber = 2;
                                break;

                            case 51: // Ctrl + 3
                                shortcutNumber = 3;
                                break;

                            case 52: // Ctrl + 4
                                shortcutNumber = 4;
                                break;
                        }

                        if ( shortcutNumber ) {
                            goTo( $( last4Results[ shortcutNumber - 1 ] ), e );
                        }
                    }

                    // Shift + Tab to close and focus goes back to where it was.
                    if ( e.shiftKey ) {
                        if ( e.which === KEYS.TAB ) {
                            close();
                        }
                    }

                    handleAriaAttr();

                })
                .on( 'click', 'span.a-Spotlight-link', function( e ){
                    goTo( $( this ), e );
                })
                .on( 'mousemove', 'li.a-Spotlight-result', function(){
                    var highlight$ = $( this );
                    highlight$
                        .parent()
                        .find( DOT + SP_ACTIVE )
                        .removeClass( SP_ACTIVE );

                    highlight$.addClass( SP_ACTIVE);
                    // handleAriaAttr();
                })
                .on( 'blur', DOT + SP_DIALOG, function(e) {
                    // don't do this if dialog is closed/closing
                    if ( $( DOT + SP_DIALOG ).dialog( "isOpen" ) ) {
                        // input takes focus dialog loses focus to scroll bar
                        $( DOT + SP_INPUT ).focus();
                    }
                });

            // Escape key pressed once, clear field, twice, close dialog.
            $( DOT + SP_DIALOG ).on( 'keydown', function ( e ) {
                var input$ = $( DOT + SP_INPUT );
                if ( e.which === KEYS.ESCAPE ){
                    if ( input$.val() ) {
                        reset();
                        e.stopPropagation();
                    } else {
                        close();
                    }
                }
            });

            hasDialogCreated = true;
        };

        /* Load static common entries */
        var loadCommonStaticIndex = function () {

            if ( gCommonStaticIndex && gCommonStaticIndex.length > 0 ) {
                return;
            } else {
                $.ajax({
                    dataType: "json",
                    type:     "GET",
                    url:      gLanguageStaticFile,
                    success:  function( data ) { 
                        setCommonStaticIndex( data );
                    },
                    error: function( xhr, status, error ) {
                        //check if file not found. 
                        //then use the default in English.
                        if ( xhr.status == 404 ) {  
                            $.ajax({
                                dataType: "json",
                                type: "GET",
                                url: gDefaultStaticFile,
                                success: function( data ) {
                                    setCommonStaticIndex( data );
                                },
                                error: function( xhr, status, error ) {
                                    console.log( JSON.parse(xhr.responseText) );
                                }
                            });
                        }
                    }
                });
            }
        }

        var loadApplicationsIndex = function () {
            
            if ( gApplicationsIndex && gApplicationsIndex.length > 0 ) {
                return;
            } else {
                apex.server.process('spotlightIndex', {
                    x01: null,
                    x02: 'Y'
                }, {
                    success: function( pData ) {
                        gApplicationsIndex = pData;
                    },
                    error: function( xhr, status, error ) {
                        console.log( JSON.parse(xhr.responseText) );
                    }
                });

            }
        }

        var loadAppPagesIndex = function ( appId ) {
            gAppId = appId;

            apex.server.process('spotlightIndex', {
                x01: appId,
                x02: 'N'
            }, {
                success: function( pData ) {
                    gAppPagesIndex = pData;
                },
                error: function( xhr, status, error ) {
                    console.log( JSON.parse(xhr.responseText) );
                }
            });
        }
        
        var setCommonStaticIndex = function ( obj ) {
            var actionsList,
                shortcutDisplay = '',
                actionLookup,
                action,
                actionName,
                i;

            gCommonStaticIndex = obj;
            
            // Add all actions on the page so they can be searched.
            actionsList   = actions.list();

            for ( i = 0; i < actionsList.length; i++  ) {
                action = actionsList[ i ];
                actionName = action.name;
                if ( actionName !== SP_ACTION_SHORTCUT ) {

                    actionLookup = actions.lookup( actionName );
                    if ( actionLookup ) {
                        shortcutDisplay = actions.shortcutDisplay( actionLookup.shortcut || '' );
                    }

                    //searchIndex.push({
                    gCommonStaticIndex.push({
                        "name":             action.label,
                        "description":      shortcutDisplay,
                        "path":             shortcutDisplay,
                        "shortcutAction":   actionName,
                        "priority":         0,
                        "type":             URL_TYPES.shortcutAction
                    });
                }
            }
        };

        var open = function( pFocusElement ){
            var openDialog = function() {
                var dlg$ = $( DOT + SP_DIALOG ),
                    scrollY = window.scrollY || window.pageYOffset;
                if ( !dlg$.hasClass( 'ui-dialog-content' ) || !dlg$.dialog("isOpen") ) {
                    dlg$.dialog({
                        width: 650,
                        resizable: false,
                        height: 'auto',
                        modal: true,
                        position: {my: "center top", at: "center top+" + ( scrollY + 64 ), of: $('body')},
                        dialogClass: 'ui-dialog--apexspotlight',
                        open: function () {
                            var dlg$ = $( this );

                            dlg$
                                .css( 'min-height', 'auto' )
                                .prev( '.ui-dialog-titlebar' )
                                .remove();

                            nav.beginFreezeScroll();

                            $( '.ui-widget-overlay' ).on('click', function () {
                                close();
                            });
                        },
                        close: function () {
                            reset();
                            nav.endFreezeScroll();
                        }
                    });
                }
            };

            if ( hasDialogCreated ) {
                openDialog();
                if ( currentAppId != gAppId ) {
                    loadAppPagesIndex( currentAppId );
                }
            } else {
                createDialog();
                openDialog();
                loadCommonStaticIndex();
                loadApplicationsIndex();
                if ( currentAppId && currentAppId.length > 0 ) {
                    loadAppPagesIndex( currentAppId );
                }
            }
            focusElement = pFocusElement;  // could be useful for shortcuts added by apex.action
        };

        var close = function(){
            $(DOT + SP_DIALOG).dialog( 'close' );
        };

        // Add menus to results set, based on page context
        var resultsAddOns = function( results ){
            var kw_url = encodeURIComponent( keywords ),
                kw_ui = keywords,
                lArray,
                lAppPagePattern   = /^(\d+)(?::|-)\s*(\d+)$/, // supports either colon or hyphen separated numeric values
                lAppSharedPattern = /^(\d+)(?::|-)\s*(s|sc|sh)$/;  // 123:s  =>  go to shared components of app 123

            /* 1. Supports AppID:PageId or AppId:s
             * Score of 1000 makes sure both shared component or 
             * edit page in app x is on top of results.
            */
            if ( lAppPagePattern.test( keywords )) {
                lArray = keywords.match( lAppPagePattern );
                results.unshift( {
                    name: msg( 'SL.EDIT.PAGE.IN.APP', lArray[2], lArray[1] ),
                    url: 'f?p=4000:4500:' + session + '::NO::FB_FLOW_ID,FB_FLOW_PAGE_ID:' + lArray[ 1 ] + ',' + lArray[ 2 ],
                    icon: ICONS.page,
                    description: msg( 'APEX.SEARCH.GO_TO_PAGE') + ' ' + lArray[ 2 ],
                    path: msg( 'APEX.SEARCH.GO_TO_PAGE' ) + ' ' + lArray[ 2 ],
                    score: 1000,
                    priority: 10,
                    type: URL_TYPES.redirect
                });
            } else if ( lAppSharedPattern.test( keywords.toLowerCase() )) {
                lArray = keywords.toLowerCase().match( lAppSharedPattern );
                results.unshift( {
                    name: msg( 'SL.SHARED.COMP.APP', lArray[1] ),
                    url: 'f?p=4000:9:' + session + '::NO::FB_FLOW_ID:' + lArray[1],
                    icon: ICONS.shared,
                    description: msg( 'APEX.SEARCH.GO_TO_SHARED_COMPONENTS' ),
                    path: msg( 'APEX.SEARCH.GO_TO_SHARED_COMPONENTS' ),
                    score: 1000,
                    priority: 100,
                    type: URL_TYPES.redirect
                });
            }

            // 2. nav menus based on page
            switch ( location  ) {
                case 'builder':
                    if ( currentAppId 
                            || model 
                                || $(".a-Breadcrumb-item a[href^='f?p=4000:1:']").length > 0 ) {

                        // in Page Designer
                        if ( model ) {
                            results.push( {
                                name: msg( 'SL.SEARCH.PAGE', kw_ui ),
                                type: URL_TYPES.searchPage,
                                icon:  ICONS.search,
                                priority: 0,
                                shortcut: 'Ctrl + 4'
                            });
                        }
                        // app list
                        results.push( {
                            name: msg( 'SL.SEARCH.APP', kw_ui ),
                            type: URL_TYPES.searchApp,
                            icon:  ICONS.search,
                            priority: 0,
                            shortcut: 'Ctrl + 3'
                        });

                    }
                    break;

                case 'teamdev':
                    results.push( {
                        name: msg( 'SL.SEARCH.TEAM.DEV', kw_ui ),
                        url: 'f?p=4800:8000:' + session + ':::RIR:IR_ROWFILTER:' + kw_url,
                        icon: ICONS.search,
                        priority: 0,
                        type: URL_TYPES.redirect
                    });
                    break;

                case 'admin':
                    results.push( {
                        name: msg( 'SL.SEARCH.USER', kw_ui ),
                        url: 'f?p=4350:8000:' + session + ':::RIR:IR_ROWFILTER:' + kw_url,
                        icon: 'icon-user',
                        priority: 0,
                        type: URL_TYPES.redirect
                    });
                    break;
            }

            // 3. Global menu
            results.push( {
                name: msg( 'SL.SEARCH.ALLAPPS', kw_ui ),
                type: URL_TYPES.searchAllApps,
                icon:  ICONS.search,
                priority: 0,
                shortcut: 'Ctrl + 2'
            });

            results.push( {
                name: msg( 'SL.SEARCH.WP', kw_ui ),
                url: 'f?p=4500:8000:' + session + ':::RIR:IR_ROWFILTER:' + kw_url,
                icon: ICONS.search,
                type: URL_TYPES.redirect,
                priority: 0,
                shortcut: 'Ctrl + 1'
            });

            return results;
        };

        var searchNav = function ( patterns ) {

            var navResults = [],
                hasResults = false,
                pattern,
                patternLength = patterns.length,
                i,
                searchSet = [],
                hasAppId = ( ( currentAppId && currentAppId.length > 0 )
                                || gInAppSearchEnabled 
                                || $(".a-Breadcrumb-item a[href^='f?p=4000:1:']").length > 0 ) ? true : false;

            var narrowedSet = function(){
                searchSet = [];
                if ( hasAppId ) {
                    searchSet = searchSet.concat( gAppPagesIndex ).concat( gApplicationsIndex ).concat( gCommonStaticIndex );
                } else {
                    searchSet = searchSet.concat( gApplicationsIndex ).concat( gCommonStaticIndex );
                }
                return hasResults ? navResults : searchSet;
            };

            var getScore = function( pos, wordsCount, fullTxt, scoreRedux ){
                var score = 100,
                    spaces = wordsCount - 1,
                    positionOfWholeKeywords;

                if ( pos === 0 && spaces === 0 ) {
                    // perfect match ( matched from the first letter with no space )
                    return score - scoreRedux;
                } else {
                    // when search 'sql c', 'SQL Commands' should score higher than 'SQL Scripts'
                    // when search 'script', 'Script Planner' should score higher than 'SQL Scripts'
                    positionOfWholeKeywords = fullTxt.indexOf( keywords );
                    if ( positionOfWholeKeywords === -1 ) {
                        score = score - pos - spaces - wordsCount ;
                    } else {
                        score = score - positionOfWholeKeywords;
                    }
                }

                return score - scoreRedux;
            };

            for ( i = 0; i < patterns.length; i++ ) {
                pattern = patterns[ i ];

                navResults = narrowedSet()
                    .filter(function( elem, index ){
                        var name = elem.name.toLowerCase(),
                            initials = name.split( ' ' ).map(function(name) {return name[0];}).join(""),
                            wordsCount = name.split( ' ' ).length,
                            position = name.search( pattern ),
                            scoreRedux = 0;

                        if ( patternLength > wordsCount ) {
                            // keywords contains more words than string to be searched
                            return false;
                        }

                        if ( hasAppId && elem.scope && elem.scope !== "app" ) {
                            //reduce score for non-app items in in-app search:
                            scoreRedux = MIN_TOP_SCORE;
                        }

                        if ( position > -1 ) {
                            elem.score = getScore( position, wordsCount, name, scoreRedux );
                            return true;
                        } else if ( elem.tokens ) { // tokens (short description for nav entries.)
                            if ( elem.tokens.search( pattern ) > -1 ) {
                                elem.score = MIN_TOP_SCORE;
                                return true;
                            }
                        } else if ( initials.search( pattern ) > -1 ) {
                            elem.score = MIN_TOP_SCORE;
                            return true;
                        } else if ( elem.appId ) {
                            if ( elem.appId.search( pattern ) > -1 ) {
                                elem.score = getScore( position, wordsCount, elem.appId, scoreRedux );
                                return true;
                            }
                        } else if ( elem.pageId ) {
                            if ( elem.pageId.search( pattern ) > -1 ) {
                                elem.score = getScore( position, wordsCount, elem.pageId, scoreRedux );
                                return true;
                            }
                        } else if ( elem.alias )  {
                            if ( elem.alias.toLowerCase().search( pattern ) > -1 ) {
                                elem.score = MIN_TOP_SCORE;
                                return true;
                            }
                        }
                    })
                    .sort( function ( a, b ) {
                        return b.score - a.score;
                    });

                hasResults = true;
            }

            var formatNavResults = function( res ){
                var out = '',
                    outEntries = {},
                    i,
                    item,
                    desc,
                    url = '',
                    type,
                    icon,
                    hasCustomIcon = false,
                    path,
                    shortcut,
                    initials = '',
                    entry = {},
                    pageParentAppId = '';

                //Order results by priority, before slashing by MAX_NAV_RESULTS:
                res.sort( function ( a, b ) {
                    return parseInt(b.priority) - parseInt(a.priority);
                });

                if ( res.length > MAX_NAV_RESULTS ) {
                    res.length = MAX_NAV_RESULTS;
                }

                for (i = 0; i < res.length; i++) {
                    item = res[ i ];

                    if ( !hasAppId && item.scope && item.scope === "app" ) {
                        //keep results only global.
                        continue;
                    }

                    shortcut = item.shortcut;

                    hasCustomIcon = false;
                    initials = '';

                    if( item.appId ) {
                        type = URL_TYPES.go2App;
                        url  = item.appId;
                        desc = 'App ' + item.appId;
                        path = 'App ' + item.appId;
                        if ( item.appBuilderIconName 
                            && item.appBuilderIconName.trim().length > 0 ) {       
                            icon = '<span class="a-Spotlight-icon">' + item.appBuilderIconName + '</span>';
                            hasCustomIcon = true;
                        } else if ( item.imageClass && item.imageClass.trim().length > 0 ) {
                            icon = '<span class="a-Spotlight-icon ' +  item.imageClass + '" aria-hidden="true"></span>';
                            hasCustomIcon = true;
                        } else if ( item.appColor 
                                && item.appColor.trim().length > 0 
                                    && item.appInitials.trim().length > 0 ) {
                            icon = item.appColor;
                            initials = item.appInitials;
                        } else {
                            icon = ICONS.app;
                        }
                    } else if ( item.pageId === 0 || item.pageId ) {
                        // pageId could be Page 0, which is treated as false in JS
                        type = URL_TYPES.go2Page;
                        url  = item.pageId;
                        pageParentAppId = item.parentAppId ? item.parentAppId : currentAppId;

                        if ( pageParentAppId && pageParentAppId.length > 0 ) {
                            desc = ' Go to ' + url + ' from application ID ' + pageParentAppId;
                            path = staticMsg.app + ' ' + pageParentAppId + ' &#92; ' + staticMsg.page + ' ' + url;
                            icon = ICONS.page;
                        } else {
                            //links that come from the common json file
                            //with no app ID, are not usable.
                            continue;
                        }
                        
                    } else {
                        type = item.type || URL_TYPES.redirect;
                        url  = item.url || item.shortcutAction;
                        desc = item.description;
                        path = '';
                        if ( item.path ) {
                            if ( typeof item.path === 'string' ) {
                                path = item.path;
                            } else {
                                //for shared components items.
                                var pathSectionCount = 0;
                                for ( var prop in item.path ) {
                                    if ( item.path.hasOwnProperty( prop ) ) {
                                        path += item.path[ prop ] + ' \\ ';
                                        pathSectionCount++;
                                    }
                                }

                                if ( pathSectionCount >= 1 ) pathSectionCount = pathSectionCount-1;

                                if ( item.scope && item.scope !== 'action' && item.name !== item.path['last']) {
                                    item.label = '<span class="a-Spotlight-labelContext">' + item.path['last'] + '</span> ' + item.name;
                                } else if ( item.scope && item.scope === 'action' ) {
                                    item.label = '<span class="a-Spotlight-labelContext">' + item.path['last'] + '</span> ' + item.description;
                                    path = '';
                                }
                                var splitPath = path.split('\\');
                                splitPath = splitPath.slice(0,pathSectionCount);
                                path = splitPath.join('\\');
                            }
                        }
                        icon = item.icon || ICONS.nav;
                    }

                    if ( url && url.length > 0 ) {
                        if ( url.indexOf( '&DEBUG.' ) > 0 ) {
                            var flowId = '::::';
                            if( gInAppSearchEnabled ) {
                                flowId = '::FB_FLOW_ID:' + gAppId;
                            }
                            //Replace URL after debug.
                            //Some links go to different pages because the URL in the
                            //database has too many elements to be replaced on other areas.
                            url = url.substring( 0, url.indexOf( '&DEBUG.' ) + '&DEBUG.'.length ).concat( flowId );
                        }
                        //Update session ID and set debug to NO.
                        url = url.replace( '%SESSION%', session )
                                .replace( '&DEBUG.', 'NO' )
                                .replace( '&APP_SESSION.', session );
                    }

                    entry = {
                        title: item.label ? item.label : item.name,
                        desc: desc,
                        url: url,
                        icon: icon,
                        hasCustomIcon: hasCustomIcon,
                        type: type,
                        path: path,
                        score: item.score,
                        alias: item.alias,
                        initials: initials,
                        priority: item.priority
                    };

                    if ( shortcut ) {
                        entry.shortcut = shortcut;
                    }

                    // Add items depending on score:
                    var outIndex = 0;
                    if ( item.score ) {
                        outIndex = getUniqueIndex( outEntries, item.score - i );
                        outEntries[ outIndex ] = getMarkup( entry );
                    } else {
                        // Items with no score ( like shortcuts ) have lowest score (negative).
                        outIndex = getUniqueIndex( outEntries, i * ( -1000 ) );
                        outEntries[ outIndex ] = getMarkup( entry );
                    }
                }

                // Sort results by score (DESC)
                Object.keys( outEntries ).sort( function( a, b ) {
                    return b - a;
                }).forEach( function( key ) {
                    out += outEntries[ key ];
                });
                return out;
            };

            return formatNavResults( resultsAddOns( navResults ) );
        };

        var getUniqueIndex = function ( pObject, pIndex ) {
            if ( pObject.hasOwnProperty( pIndex ) ) {
                pIndex = getUniqueIndex( pObject, pIndex - 1 );
            }
            return pIndex;
        }

        var search = function( k ){
            var PREFIX_ENTRY = 'sp-result-';
            // store keywords
            keywords =  k.trim();

            var words = keywords.split( ' ' ),
                res$ = $( DOT + SP_RESULTS ),
                patterns = [],
                navOuput,
                peOutput = '',
                i,
                j,
                lAppColonRegex = new RegExp( '^[0-9]+\\s*:\\s*$','gi'),
                lSearchWithinAppRegex = new RegExp( '^[0-9]+\\s*:(\\s*\\S|\\s*\\d+)', 'gi'),
                appId,
                keywordsArray,
                enableSearch = true;

            if ( lAppColonRegex.test( keywords ) ) {
                //clear pattern data (no search) if user has
                //set "<appid>:" only but load in-app data.
                enableSearch = false;
                gResetCache = true;
                keywordsArray = keywords.split( ':' );
                if ( keywordsArray[0].trim().length > 0 ) {
                    appId = keywordsArray[0];
                    if ( gAppId !== appId ) {
                        loadAppPagesIndex( appId );
                    }
                }
            } else if ( lSearchWithinAppRegex.test( keywords ) ) {
                //we now have data to search.
                enableSearch = true;
                gResetCache = true;
                gInAppSearchEnabled = true;
                keywordsArray = keywords.split( ':' );
                if ( keywordsArray[1].trim().length > 0 ) {
                    appId = keywordsArray[0];
                    words = keywordsArray[1].trim().split( ' ' );
                }
            } else {
                //If user didn't close the search box
                //But is searching between in-app pages
                //And also using <Other app id>:<term> format.
                enableSearch = true;
                if ( gResetCache && currentAppId !== gAppId ) {
                    loadAppPagesIndex( currentAppId );
                }
            }

            for ( i = 0; i< words.length; i++ ) {
                // store keys in array to support space in keywords for navigation entries,
                // e.g. 'sta f' finds 'Static Application Files'
                patterns.push( new RegExp( util.escapeRegExp( words[i] ), 'gi') );
            }

            if ( !enableSearch )  {
                patterns = [];
                keywords = gAppId;
            }
            
            navOuput = searchNav( patterns );

            if ( model && model.getCurrentPageId() && !gInAppSearchEnabled ) {
                // getCurrentPageId check is needed to avoid JS error in console
                // when user uses search after opens up to a non-existent page in Page Designer.
                peOutput = searchPe( patterns[0], model.COMP_TYPE.PAGE );
            }

            $( '#' + SP_LIST )
                .html( peOutput + navOuput )
                .find( 'li' )
                .each(function ( i ) {
                    var that$ = $( this );
                    that$
                        .find( DOT + SP_RESULT_LABEL )
                        .attr( 'id', PREFIX_ENTRY + i );    // for accessibility
                })
                .first()
                .addClass( SP_ACTIVE );
        };

        // define an action for the spotlight button and a keyboard shortcut
        actions.add( {
            name: SP_ACTION_SHORTCUT,
            label: null, // take label and title from button
            title: null,
            shortcut: "Ctrl+Quote",
            action: function( event, focusElement ) {
                open( focusElement );
                return true;
            }
        } );

    })( apex.jQuery, apex.util, apex.navigation, apex.lang, apex.actions, window.pageDesigner );
});
