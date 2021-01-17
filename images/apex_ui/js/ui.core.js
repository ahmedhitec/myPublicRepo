/*global apex,$v*/

/**
 @license

 Oracle Database Application Express, Release 5.0

 Copyright (c) 2013, 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @fileOverview
 * This file contains initializations for several core UI components used within internal applications
 **/


(function( $, builder, util, navigation, theme ) {
    "use strict";

    var BUILDER_WINDOW_NAME = "APEX_BUILDER",
        APP_WINDOW_NAME_PREFIX = "APEX_AUT_",
        SEL_HS_REGION = ".a-Region--hideShow";

    builder.getAppUnderTestWindowName = function( pAppId ) {
        var share = $v("P0_WINDOW_MGMT_SHARE_WINDOW" ) === "Y",
            name = APP_WINDOW_NAME_PREFIX;
        if ( !share ) {
            name += pAppId;
        }
        return name;
    };

    builder.launchAppUnderTest = function( url, appId, options ) {
        var debug = "",
            // first check if the window already exists
            win = apex.navigation.openInNewWindow( "", builder.getAppUnderTestWindowName( appId ), options );

        if ( win && win.$v ) {
            debug = win.$v( "pdebug" ) || "";
        }
        // current assumption is that data-link never contains the P1000_DEBUG item
        url = url.split( ":" );
        if ( url[3] === "BRANCH_TO_PAGE_ACCEPT" ) {
            url[6] = url[6] + ",P1000_DEBUG";
            url[7] = url[7] + "," + debug;
        } else {
            url[4] = debug;
        }
        url = url.join( ":" );
        return navigation.openInNewWindow( url, builder.getAppUnderTestWindowName( appId ), options );
    };

    builder.nameBuilderWindow = function() {
        // Give this builder window a name (if it doesn't have one) so that the apex developer toolbar can effect this window
        if ( !window.name || window.name.indexOf( BUILDER_WINDOW_NAME ) === 0 ) {
            window.name = BUILDER_WINDOW_NAME + "_" + $v( "pInstance" );
        }
    };

    builder.initWizardModal = function() {

        var CL_DIALOG_BODY   = '.a-Dialog-body',
            CL_DIALOG_STEPS  = '.a-Dialog-wizardSteps',
            CL_DIALOG_FOOTER = '.a-Dialog-footer';

        var fixDialogLayoutInBuilder = function(){
            var headerHeight = $( CL_DIALOG_STEPS ).height(),
                footerheight = $( CL_DIALOG_FOOTER ).height();
            $( CL_DIALOG_BODY ).css({
                'top'   : headerHeight,
                'bottom': footerheight
            });
        };

        $( window ).on( 'apexwindowresized', function() {
            fixDialogLayoutInBuilder();
        });

        fixDialogLayoutInBuilder();

        theme.modalAutoSize({
            observeClass: CL_DIALOG_BODY,
            sections:   [ CL_DIALOG_BODY,
                          CL_DIALOG_STEPS,
                          CL_DIALOG_FOOTER ]
        });
    };

    builder.initStickyHeader = function(pHeader) {
        var lHeader       = $('#'+pHeader);
        if ( lHeader[0] ) {
            var lHeaderHeight = lHeader.outerHeight(),
                lParent       = lHeader.parent(),
                lOffset       = lHeader.offset().top;
            $(window).scroll(function(){
                if ($(window).scrollTop() > lOffset){
                    lHeader.addClass('is-fixed');
                    lParent.css('margin-top',lHeaderHeight);
                } else {
                    lHeader.removeClass('is-fixed');
                    lParent.css('margin-top','0');
                }
            });
        }
    };

    builder.initWizardProgressBar = function() {
        theme.initWizardProgressBar( "a-WizardSteps" );
    };

    // builder.setEqualHeights = function(pSelector) {
    //     var lObjects   = $(pSelector),
    //         lMaxHeight = 0;

    //     lMaxHeight = Math.max.apply(
    //     Math, lObjects.map(function() {
    //         return $(this).height();
    //     }).get());
    //     lObjects.height(lMaxHeight);
    // };

        $( function () {

            // Add ie10 class when using IE10
            if ( document.documentMode === 10 ) {
                document.documentElement.className += " ie10";
            }

        function getAppIdFromURL( url ) {
            var i, parts, params, values,
                appId = null;

            i = url.indexOf( "?p=" );
            if ( i >= 0 ) {
                parts = url.substring( i + 3 ).split( ":" );
                if ( parts.length >= 8 && parts[3] === "BRANCH_TO_PAGE_ACCEPT" ) {
                    params = parts[6].split( "," );
                    values = parts[7].split( "," );
                    for ( i = 0; i < params.length && i < values.length; i++ ) {
                        if ( params[i] === "FB_FLOW_ID" ) {
                            appId = values[i];
                            break;
                        }
                    }
                } else {
                    appId = parts[0];
                }
            }
            return appId;
        }

        // Main Navigation List
        $( ".a-Header-tabsContainer" ).menu( {
            menubar: true,
            behaveLikeTabs: true
        } ).show();

        addNavigationListClasses('a_Header_menu');

        // Open Menu Link in New Window
        function launchNewWindow() {
            // called in the context of a menu item, so this is the menu item
            navigation.openInNewWindow(this.href, "_blank", {favorTabbedBrowsing:true});
        }

        // Help Menu
        $( '#helpMenu_menu' ).on("menucreate", function() {
            var helpMenu = this;
            // Menu items from markup don't support opening in a new window.
            // But specific help menu items do need to open in a new window so look them up by id and give them a special action
            $.each( ["helpLinkNewWindow", "helpLinkForum", "helpLinkOTN","helpLinkDocLib"], function( i, id ) {
                var item = $( helpMenu ).menu( "find", id );
                if ( item ) {
                    item.action = launchNewWindow;
                }
            } );
        });

        // Initialize Hide Show Regions
        initHideShowRegions();

        // Initialize Wizards
        // _initWizardProgressBar();

        // Dev Toolbar integration: Handle buttons that launch the app under test
        // so that it runs in a named window so it can communicate back to the builder via window.opener
        $( "body" ).on( "click", "button.launch-aut", function ( pEvent ) {
            var url = $( this ).attr( "data-link" ),
                appId = getAppIdFromURL( url ),
                options = {},
                runMode = $v( "P0_WINDOW_MGMT_MODE" ) || "FOCUS"; // values NONE, BROWSER, FOCUS

            if ( appId ) {
                if ( runMode === "NONE" || /^4\d\d\d$/.test( appId ) ) {
                    navigation.redirect( url );
                } else {
                    if ( runMode === "BROWSER" ) {
                        options.favorTabbedBrowsing = true;
                    } // else assume FOCUS
                    builder.launchAppUnderTest( url, appId, options );
                }
            }
        } );

        // the toolbar run page button is a normal apex button except we don't want it to simply navigate
        // but we do need the URL, so grab it from the onclick attribute, which gets removed and add data-link
        // so above handler will work
        $( "button.launch-aut" ).each( function() {
            var match, btn$ = $(this ),
                url = btn$.attr( "data-link" );

            if ( !url )  {
                match = /['"]((ws|f)\?p=.*)['"]/.exec( btn$.attr( "onclick" ) );
                if ( match && match.length > 1 ) {
                    url = match[1];
                    btn$.removeAttr( "onclick" );
                    btn$.attr( "data-link", url );
                }
            }
        });

        // Initialize the header account mega menu widget
        $( "#accountMenu_menu" ).menu({
            customContent: true,
            tabBehavior: "NEXT"
        });

        // Handle resizing of dialogs
        function resizeDialog( dialog$ ) {
            var footerheight = dialog$.find( ".a-DialogRegion-buttons" ).height();
            dialog$.find(".a-DialogRegion-body").css( "bottom",  footerheight );
        }

        $( document.body )
            .on( "dialogopen dialogresizestop", ".a-DialogRegion", function() {
                resizeDialog($(this));
            });
    } );

    function initHideShowRegions() {
        $( SEL_HS_REGION ).each( function() {
            $( this ).collapsible({
                content: $( this ).find( ".a-Region-body" ).first()
            });
        });
    }

    // Function to add Navigation List Classes
    function addNavigationListClasses(menuId) {
        var i, c, items$, items,
            menu$ = $( "#" + menuId );

        if ( menu$.length ) {
            items$ = menu$.children( "ul" ).children( "li" );
            items = menu$.menu( "option" ).items;

            for (i = 0; i < items.length; i++) {
                c = items[i].id;
                if (c) {
                    items$.eq(i).addClass(c);
                }
            }
        }
    }

})( apex.jQuery, apex.builder, apex.util, apex.navigation, apex.theme );
