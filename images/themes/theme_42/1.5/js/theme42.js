/*!
 Copyright (c) 2014, 2020, Oracle and/or its affiliates. All rights reserved.
*/
/* global apex, window, ToggleCore */
// Namespace for Universal Theme - theme42 (UT)
apex.theme42 = {};

(function( $, ut, theme ) {
    "use strict";

    // UT specific selectors
    var SELECTORS = {
        // page layout
        tree_nav             : "#t_TreeNav",
        page_body            : "#t_PageBody",
        page_title           : "#t_Body_title",
        header               : "#t_Header",
        footer               : ".t-Footer",
        mainbody             : ".t-Body-main",
        side_col             : "#t_Body_side",
        actions_col          : "#t_Body_actions",
        body_content         : "#t_Body_content",
        body_content_offset  : "#t_Body_content_offset",
        cl_show_left         : 't-PageBody--showLeft',
        t_alert_success      : '#t_Alert_Success',
        // dialog
        t_modal_body         : '.t-Dialog-body'
    };

    // All events used
    var EVENTS = {
        // UT specific
        preload:             'theme42preload',
        utReady:             'theme42ready',
        layoutChange:        'theme42layoutchanged',
        // APEX specific
        apexResized:         'apexwindowresized',
        readyEnd:            'apexreadyend',
        // ToggleCore related
        resize:              'resize',
        forceResize:         'forceresize'
    };

    var win$         = $( window ),
        doc$         = $( document ),
        body$        = $( 'body' ),
        pageCtx$     = apex.gPageContext$,

        header$      = $( SELECTORS.header ),
        footer$      = $( SELECTORS.footer ),
        mainBody$    = $( SELECTORS.mainbody ),
        pageTitle$   = $( SELECTORS.page_title ),
        treeNav$     = $( SELECTORS.tree_nav ),
        pageBody$    = $( SELECTORS.page_body ),
        bodyContent$ = $( SELECTORS.body_content ),

        sideCol$     = $( SELECTORS.side_col ),
        actionsCol$  = $( SELECTORS.actions_col ),

        bodyContentOffset$,

        marqueeRDS$ = $( ".t-Body-info .apex-rds-container"),

        modalDialogHeight;

    // Utilities
    ut.util   = {};

    // todo: consider expose useful components on the page.
    ut.page   = {};

    /**
     * <p>Scroll to the anchor smoothly, taking sticky top height into account.</p>
     *
     * @param {string} id could be the ID of a region.
     */
    var scrollTo = function( id ){
        var anchor,
            elem$,
            elemOffset;

        if ( id ) {
            anchor = id.indexOf( '#' ) > -1 ? id : '#' + id;
            elem$ = $( anchor );
            if ( elem$[0] ) {
                elemOffset = elem$.offset().top - apex.theme.defaultStickyTop();
                $( 'html, body', pageCtx$ ).animate({
                    scrollTop: elemOffset
                });
            }
        }
    };

    /**
     * Returns boolean for media query
     * @param {string} mediaQueryString e.g. (min-width: 400px)
     * @return {boolean}
     */
    var mediaQuery = theme.mq;

    var sticky = function( selector ) {
        $( selector ).stickyWidget(
            {
                zIndexStart: 200,
                toggleWidth: true,
                stickToEnd: true
            }
        );
    };

    /**
     * Resets all the core page element offsets.
     * Notice that this needs to be done dynamically since the pageTitle and the header are two different divs
     * that just happen to be fixed on top of each other.
     *
     * TODO:    There is no good reason (other than complexity) why the constant (0 or some fixed value) "resets"
     *          are applied here in the JS instead of the CSS. Future Developer, consider refactoring.
     *
     * @type {Function}
     */
    var resetHeaderOffset = function() {
        var pageTitleHeight = getTitleHeight(),
            headerHeight    = header$.outerHeight(),
            contentOffset,
            sideColTop;

        if ( mediaQuery('(min-width: 641px)') ) {
            // Big screen has a minimum of 641 pixels
            // Certain page elements need to include the pageTitle height
            contentOffset = pageTitleHeight;
            sideColTop    = headerHeight + pageTitleHeight;
        } else {
            // Small screen handles things differently based on nav style:
            contentOffset = 0;
            sideColTop    = 0;
        }
        // Finally set the correct margins and height to handle the header offset
        mainBody$.css(          { "margin-top": headerHeight  });
        bodyContentOffset$.css( { "height":     contentOffset });
        sideCol$.css(           { "top":        sideColTop    });
        actionsCol$.css(        { "top":        headerHeight  });
        pageTitle$.css(         { "top":        headerHeight  });
    };

    /**
     * Configure the display behavior of success message.
     * User may use this API to programmatically determine how long the success message gets to be displayed.
     *
     * For example, on DOM ready:
     *
     * apex.theme42.util.configAPEXMsgs({
     *   autoDismiss: true,
     *   duration: 5000
     * });
     *
     * @param {Object} [pOptions]       possible values are:
     *                                    - "autoDismiss":  Boolean to specify if the success message should be dismissed
     *                                                      after displaying for certain duration.
     *                                    - "duration":     Number. Default is 3000. Duration in milliseconds.
     *
     *                                    If the message div is clicked, has focus, or on mouse over,
     *                                    it won't get dismissed, while clicking out side, and on mouse out will resume
     *                                    the dismissing behavior.
     */
    var configAPEXMsgs = function( pOptions ) {
        var suc$ = $( SELECTORS.t_alert_success ),
            timeOut;

        if ( !ut.page.APEXMsgConfig ) {
            ut.page.APEXMsgConfig = {};
        }

        if ( pOptions ) {

            // save options, in case user wants to use JS to invoke another success message,
            // which should still honor these options.
            ut.page.APEXMsgConfig = pOptions;

            if ( pOptions.autoDismiss && suc$[0] ) {

                var hide = function () {
                    timeOut = setTimeout( function () {
                        apex.message.hidePageSuccess();
                        suc$.off();
                        doc$.off( 'click', hide );
                    }, pOptions.duration || 3000);
                };

                var clear = function () {
                    clearTimeout( timeOut );
                };

                // start dismissing the success message after above duration.
                hide();

                suc$
                    .on( 'click', function (e) {
                    // stop hiding if it is clicked.
                    e.stopPropagation();
                    ut.page.APEXMsgConfig.clicked = true;
                    clear();
                })
                    // stop hiding when mouse over the message.
                    .on( 'mouseover', clear )
                    .on( 'mouseout', function () {
                        // if message was not clicked before, start hiding.
                        if ( !ut.page.APEXMsgConfig.clicked ) {
                            hide();
                        }
                    })
                    // stop hiding when focus is inside.
                    // and always hide when the close icon is clicked
                    .find( '.t-Button--closeAlert' )
                    .on( 'focus', clear )
                    .on( 'click', function () {
                        apex.message.hidePageSuccess();
                    });

                // hide message if clicked elsewhere on the page.
                doc$.on( 'click', hide );
            }

        }

    };

    /*
    * Expose utility functions
    * */
    ut.util.scrollTo            = scrollTo;
    ut.util.mq                  = mediaQuery;
    ut.util.fixLayout           = resetHeaderOffset;
    ut.util.configAPEXMsgs      = configAPEXMsgs;
    ut.util.sticky              = sticky;

    // todo: configureSuccessMessages to be deprecated in next release
    ut.configureSuccessMessages = configAPEXMsgs;

    // ut.sticky is legacy and it should be replaced with ut.util.sticky
    // it may be used by P-Track app and many customers may still call it on page load.
    ut.sticky                   = sticky;

    // todo these have been deprecated since 19.1. remove at some point
    // Wrapper for legacy code. TODO: Consider using the other arguments to achieve some
    window.openModal = function(pDialogId, pDialogTriggerId, pSetFocusId, pClear ) {
        $( "#" + pDialogId ).dialog("open");
    };

    window.closeModal = function closeModal() {
        $( ".ui-dialog-content" ).dialog("close");
    };

    var hasTreeNav = function () {
        return treeNav$.length > 0;
    };

    var isSmall = function () {

        var pageIsSmall = false;

        if ( mediaQuery( '(max-width: 640px)' ) ) {
            // page is simply too small
            pageIsSmall = true;
        } else {
            // Check for left nav and width together
            if ( hasTreeNav() && pageBody$.hasClass( SELECTORS.cl_show_left ) && mediaQuery( '(max-width: 992px)') ) {
                pageIsSmall = true;
            } else {
                pageIsSmall = false;
            }
        }

        return pageIsSmall;
    };

    var getTitleHeight = function() {
        return pageTitle$.outerHeight();
    };

    /**
     * Determine the base window Y value for all stickied elements to stick.
     * @type {Function}
     */
    var getFixedHeight = function() {
        /**
         * The height is always present on an a UT page.
         */
        var headerHeight = $( "header" ).outerHeight(),
            rdsHeight = 0;
        /**
         * If there is an RDS in the .t-Body-info container, we know it is stuck and must be included in the calculations.
         */
        if (marqueeRDS$.length > 0) {
            rdsHeight += marqueeRDS$.outerHeight();
        }

        if ( isSmall() ) {
            // the page title is not fixed when the screen is small.
            if ( pageBody$.hasClass("js-HeaderContracted") ) {
                // a contracted header means that it is no longer visible, which means that the RDS height
                // (if it exists) is the only Y base that needs to be returned.
                return rdsHeight;
            }

            return headerHeight + rdsHeight;
        }

        if ($(".js-stickyTableHeader").length > 0) {
            rdsHeight -= 1;
        }
        // If the screen is not small, we know that the page title is
        return getTitleHeight() + headerHeight + rdsHeight;
    };

    apex.theme.defaultStickyTop = getFixedHeight;

    // Exapnd and collapse of Left / right navigation and alert notification on mobile may have animation,
    // therefore the width calculation of sticky elements needs to wait for forceResize event to be triggered.
    var delayResize = function () {
        var delay = function () {
            var forceResize = EVENTS.forceResize;
            $( '.js-stickyWidget-toggle' ).each(function() {
                $( this ).trigger( forceResize );
            });

            $( '.js-stickyTableHeader' ).each(function() {
                $( this ).trigger( forceResize );
            });

            $( '.a-MenuBar' ).menu( EVENTS.resize );
        };

        apex.util.debounce( delay, 201 )();
    };

    // todo this should get replaced with a custom node renderer function
    var renderBadges = function( children$, labelClass ) {
        children$.each(function() {
            var label = this.innerHTML;
            if ( label.indexOf("<span class='" + labelClass + "'>") !== -1) {
                // Ignore any labels which already have a badge!
                // TODO: Consider making this more efficient by caching the nodes which have had this transformation applied on them.
                return;
            }
            var regex = /\[(.*)\]/,
                match = regex.exec( label );
            if (match !== null && match.length > 1) {
                if (match[1] === "") {
                    this.innerHTML = label.replace(regex, "");
                } else {
                    label = label.replace(/\[.*\]/, "") + "<span class='" + labelClass + "'>" + match[1] + "</span>";
                    this.innerHTML = label;
                }
            }
        });
    };

    /**
     *
     * Widgets that are "toggled" to active or not active depending on the state of the page.
     *
     */
    var toggleWidgets = function() {
        var RIGHT_CONTROL_BUTTON    = "#t_Button_rightControlButton",
            A_CONTROLS              = "aria-controls",
            A_EXPANDED              = "aria-expanded",
            A_HIDDEN                = "aria-hidden",
            TREE_NAV_WIDGET_KEY     = "nav",
            RIGHT_WIDGET_KEY        = "right";

        var isCollapsedByDefault = $( '#t_TreeNav' ).hasClass( 'js-defaultCollapsed' ),  // comes from APEX template options
            pushModal,
            toggleWidgets = {};

        /**
         * Checks if the toggleWidget specified by key has been built, if it has then call its collapse event.
         * @param key
         */
        var collapseWidget = function (pKey, pSaveUserPreference) {
            if (pKey in toggleWidgets) {
                toggleWidgets[pKey].collapse(pSaveUserPreference);
            }
        };

        /**
         * Checks if the toggleWidget specified by key has been built, if it has then call its expand event.
         * @param key
         */
        var expandWidget = function (pKey, pSaveUserPreference) {
            if (pKey in toggleWidgets) {
                toggleWidgets[pKey].expand(pSaveUserPreference);
            }
        };

        /**
         * To recognize that a toggle widget exists and to initialize so that it works in the context of the current page
         * i.e. "build" it, pass in an object literal to buildToggleWidgets with the following key/values.
         *      "key",                  allows this widget to be expanded or collapsed during run time
         *                              from any other function using collapseWidget(YOUR_KEY) or expandWidget(YOUR_KEY)
         *      "checkForElement",      the element id, class (or arbitrary jquery selector)
         *                              which must exist for this toggleWidget to be initialized.
         *
         *                              All other attributes are used for ToggleCore.
         *
         * NOTE: Right now buildToggleWidget assumes that none of these key/values will be null or undefined!
         *
         * @param options
         * @returns {boolean} true if the element to check for exists on the page and the toggle widget has been built, false if otherwise.
         */
        var buildToggleWidget = function ( options ) {
            var checkForElement = options.checkForElement,
                key             = options.key,
                button$          = $(options.buttonId),
                widget,
                expandOriginal = options.onExpand,
                collapseOriginal = options.onCollapse;
            var element$ = $( checkForElement );
            if ( !element$ || element$.length <= 0 ) {
                return false;
            }
            options.controllingElement = button$;
            button$.attr( A_CONTROLS, element$.attr("id") );

            options.content = pageBody$;
            options.contentClassExpanded = "js-" + key + "Expanded";
            options.contentClassCollapsed = "js-" + key + "Collapsed";
            options.onExpand = function() {
                expandOriginal();
                button$.addClass("is-active").attr(A_EXPANDED, "true");
                pushModal.notify();
            };
            options.onCollapse = function() {
                collapseOriginal();
                button$.removeClass("is-active").attr(A_EXPANDED, "false");
                pushModal.notify();
            };

            widget = ToggleCore(options);
            toggleWidgets[key] = widget;
            return true;
        };

        var initialize = function() {
            if (pageBody$.length <= 0 &&
                mainBody$.length <= 0 &&
                header$.length <= 0 &&
                bodyContent$.length <= 0 ) {
                // If these elements do not exist, ToggleWidgets cannot be run.
                return;
            }
            // var treeNav$ = treeNav$;
            // var pageBody$ = pageBody$;
            /**
             *
             */
            var pushModal$ = $( "<div id='pushModal' style='width: 100%; display:none; height: 100%;' class='u-DisplayNone u-Overlay--glass'></div>" );
            $( 'body' ).append( // While jsLint will notice duplicate jQuery selectors; it is only important to cache
                // those that are not at the top of the DOM. body is accessed through document.body
                // so it is fine to reuse it like this.
                pushModal$
            );
            win$.bind(EVENTS.apexResized, function() {
                for (var key in toggleWidgets) {
                    if ( toggleWidgets.hasOwnProperty(key) ) {
                        toggleWidgets[ key ].resize();
                    }
                }
                pushModal.notify();
            });

            pushModal = {
                el$: pushModal$,
                "collapse": function() {
                },
                "expand": function() {
                },
                "shouldShow": ut.screenIsSmall,
                "notify": function() {
                }
            };
            var  NAV_CONTROL_BUTTON      = "#t_Button_treeNavControl";
            if ( $( "#t_Button_navControl" ).length > 0 ) {
                if ($(".t-Header-nav-list.a-MenuBar").length <= 0) {
                    NAV_CONTROL_BUTTON = "#t_Button_navControl";
                }
            }
            var treeShouldBeHidden = function() {
                return mediaQuery( '(max-width: 480px)' );
            };
            var treeIsHidden = function() {
                return treeNav$.css("visibility") === "hidden";
            };
            var showTree = function() {
                treeNav$.css("visibility", "inherit").attr(A_HIDDEN, "false");
            };
            var collapseTree = function () {
                collapseWidget(TREE_NAV_WIDGET_KEY);
            };
            var treeIsHiding = false;
            var handleTreeVisibility = function() {
                var screenIsTooSmallForTheTree = treeShouldBeHidden();
                if ( screenIsTooSmallForTheTree  && !treeIsHidden() && !treeIsHiding ) {
                    treeIsHiding = true;
                    setTimeout(function() {
                        treeIsHiding = false;
                        if ( !toggleWidgets[ TREE_NAV_WIDGET_KEY ].isExpanded() ) {
                            treeNav$.css("visibility", "hidden").attr( A_HIDDEN , "true");
                        }
                    }, 400);
                    $( '.t-Body-main' ).off( 'click', collapseTree );
                } else if ( !screenIsTooSmallForTheTree ) {
                    showTree();
                }
            };
            var hasTree = buildToggleWidget({
                key: TREE_NAV_WIDGET_KEY,
                checkForElement: SELECTORS.tree_nav,
                buttonId: NAV_CONTROL_BUTTON,
                defaultExpandedPreference: !isCollapsedByDefault,
                isPreferenceGlobal: true,
                onClick: function() {
                    if (mediaQuery('(max-width: 992px)') &&
                        RIGHT_WIDGET_KEY in toggleWidgets &&
                        toggleWidgets[RIGHT_WIDGET_KEY].isExpanded()) {
                        toggleWidgets[RIGHT_WIDGET_KEY].toggle();
                    }
                },
                onExpand: function() {
                    if (mediaQuery('(max-width: 992px)')) {
                        collapseWidget(RIGHT_WIDGET_KEY);
                    }
                    treeNav$.treeView("expand", treeNav$.treeView("getSelection"));
                    showTree();
                    delayResize();
                    treeNav$.trigger( EVENTS.layoutChange, {action: "expand"});
                    // Enable clicking on main content to collapse left menu on small screen
                    if ( !mediaQuery('(min-width: 640px)') ) {
                        $( '.t-Body-main' ).on( 'click', collapseTree );
                    }
                },
                onCollapse: function() {
                    treeNav$.treeView("collapseAll");
                    delayResize();
                    handleTreeVisibility();
                    treeNav$.trigger( EVENTS.layoutChange, {action: "collapse"});
                    $( '.t-Body-main' ).off( 'click', collapseTree );
                },
                onResize: function() {
                    var usingTreeNav = pageBody$.hasClass('t-PageBody--leftNav');
                    if (usingTreeNav) {
                        if (mediaQuery('(max-width: 992px)')) {
                            this.collapse();
                        } else {
                            if (this.doesUserPreferExpanded()) {
                                this.expand();
                            }
                        }
                    }
                    handleTreeVisibility();
                    resetHeaderOffset();
                },
                onInitialize: function() {
                    var preferExpanded = this.doesUserPreferExpanded();
                    if ( mediaQuery('(min-width: 992px)') ) {
                        if ( preferExpanded ) {
                            this.expand();
                        } else {
                            this.forceCollapse();
                        }
                    } else {
                        // screen is small
                        this.forceCollapse();
                    }
                }
            });

            // If the tree widget does not exist, the page MUST be using a MENU_NAV_WIDGET_KEY.
            if ( !hasTree ) {

                var headerCore = null;

                var peekHeaderInit = function() {
                    // Initialize the peeking header for small screens only
                    if ( mediaQuery( '(max-width: 640px)' ) && headerCore === null ) {

                        var lastScrollTop = 0,
                            handlerId = null;

                        var recal = function() {
                            $( ".js-stickyWidget-toggle" ).stickyWidget( "reStick" );
                        };

                        // configure the toggle core behavior
                        headerCore = ToggleCore({
                            content: pageBody$,
                            contentClassExpanded: "js-HeaderExpanded",
                            contentClassCollapsed: "js-HeaderContracted",
                            useSessionStorage: false,
                            defaultExpandedPreference: true,
                            onCollapse: recal,
                            onExpand: recal
                        });

                        // initialize toggle core widget
                        headerCore.initialize();

                        var peekingHeader = function() {
                            handlerId = null;
                            var scrollTop = win$.scrollTop();
                            if (lastScrollTop > scrollTop || scrollTop < 100) {
                                headerCore.expand();
                            } else {
                                headerCore.collapse();
                            }
                            lastScrollTop = scrollTop;
                        };

                        win$.scroll( function() {
                            if ( !handlerId ) {
                                handlerId = apex.util.invokeAfterPaint( peekingHeader );
                            }
                        } );
                    }
                };

                // listen to resize event and initialize peeking header
                win$.on( EVENTS.apexResized, peekHeaderInit );

                // also call peekheader directly on page load
                peekHeaderInit();

                // Update the classes when using the no nav page template
                if ( !body$.hasClass( "t-PageBody--noNav" ) ) {
                    body$.addClass( "t-PageBody--topNav" );
                }

                win$.on( EVENTS.apexResized, resetHeaderOffset);

            } else {
                treeNav$.on("treeviewexpansionstatechange", function(jqueryEvent, treeViewEvent) {
                    if (treeViewEvent.expanded) {
                        toggleWidgets[TREE_NAV_WIDGET_KEY].expand();
                    }
                });
            }

            var rightShouldBeOpenOnStart = mediaQuery('(min-width: 992px)'),
                actionsContent$ = $( ".t-Body-actionsContent" );

            buildToggleWidget({
                key: RIGHT_WIDGET_KEY,
                checkForElement: ".t-Body-actionsContent",
                buttonId: RIGHT_CONTROL_BUTTON,
                defaultExpandedPreference: rightShouldBeOpenOnStart,
                onClick: function() {
                    if (mediaQuery('(max-width: 992px)') &&
                        TREE_NAV_WIDGET_KEY in toggleWidgets &&
                        toggleWidgets[TREE_NAV_WIDGET_KEY].isExpanded()) {
                        toggleWidgets[TREE_NAV_WIDGET_KEY].toggle();
                    }

                },
                onExpand: function() {
                    if (mediaQuery('(max-width: 992px)')) {
                        if (pageBody$.hasClass('js-navExpanded')) {
                            collapseWidget(TREE_NAV_WIDGET_KEY);
                        }
                    }
                    actionsContent$.css("visibility", "inherit").attr(A_HIDDEN, "false");
                    delayResize();
                },
                onCollapse: function() {
                    delayResize();
                    actionsContent$.attr(A_HIDDEN, "true");
                    setTimeout( function() {
                        if ( !toggleWidgets[RIGHT_WIDGET_KEY].isExpanded() ) {
                            actionsContent$.css("visibility", "hidden");
                        }
                    }, 400);
                },
                onResize: function() {
                    // Window resize should have nothing to do with right action column
                    // Typing in text field may trigger resize in some mobile browser,
                    // therefore collapsing the column, which is unexpected behavior.
                    // See Bug 27911046
                },
                onInitialize: function() {
                    if (TREE_NAV_WIDGET_KEY in toggleWidgets &&
                        toggleWidgets[TREE_NAV_WIDGET_KEY].isExpanded() &&
                        mediaQuery('(max-width: 992px)')) {
                        this.forceCollapse();
                    } else {
                        if (this.doesUserPreferExpanded()) {
                            this.forceExpand();
                        } else {
                            this.forceCollapse();
                        }
                    }
                }
            });
            for (var key in toggleWidgets) {
                if ( toggleWidgets.hasOwnProperty(key) ) {
                    toggleWidgets[key].initialize();
                }
            }
        };

        return {
            "initialize": initialize,
            "expandWidget": expandWidget,
            "collapseWidget": collapseWidget,
            "setPreference": function (key, value) {
                if (key in toggleWidgets){
                    toggleWidgets[key].setUserPreference(value);
                }
            },
            "isExpanded": function (key) {
                if (key in toggleWidgets) {
                    return toggleWidgets[key].isExpanded();
                }
            }
        };
    }();

    // Keep ut.initializePage for legacy reasons because they are used by page templates in
    // Shared Components > Page Templates
    (function() {
        /**
         * A list of all the possible page templates. If you create a new template, you must call
         * apex.theme42.pages.<your template name here>() prior to the jQuery onReady event
         */
        var pages = {
            "masterDetail": {},
            "leftSideCol": {},
            "rightSideCol" : {},
            "noSideCol": {},
            "appLogin": {},
            "wizardPage": {},
            "wizardModal": {},
            "bothSideCols": {},
            "popUp": {},
            "modalDialog": {}
        };

        var initAutoSize = function () {
            theme.modalAutoSize({
                observeClass: SELECTORS.t_modal_body,
                sections:   [ SELECTORS.t_modal_body,
                              '.t-Dialog-header',
                              '.t-Dialog-footer' ]
            });
        };

        pages.modalDialog = {
            "onTheme42Ready": initAutoSize
        };

        pages.wizardModal = {
            "onReady": initAutoSize
        };

        pages.masterDetail = {
            "onTheme42Ready": function() {
                var rds$ = $( ".t-Body-info .apex-rds" );

                rds$.on( "tabschange" , function ( activeTab, mode ) {
                    if (mode !== 'jump') {
                        $(".t-StatusList-blockHeader,.js-stickyTableHeader").trigger( EVENTS.forceResize );
                    }
                });

                sticky( ".t-Body-contentInner .t-StatusList .t-StatusList-blockHeader" );

                $(".t-Body-contentInner .t-Report-tableWrap").setTableHeadersAsFixed();

                sticky( ".js-stickyTableHeader" );

                rds$.aTabs( "option", "showAllScrollOffset" , function() {
                    /* when on mobile screens, handle offset differently than desktop */
                    var rdsOffset = mediaQuery('(min-width: 641px)') ? rds$.outerHeight() : 0,
                        tHeight = $( "#t_Body_info" ).outerHeight() - rdsOffset;

                    if ( $( window ).scrollTop() > tHeight) {
                        return tHeight;
                    }
                    return false;
                });

                /* initialize stickty RDS */
                if ( marqueeRDS$.length > 0 ) {
                    marqueeRDS$.stickyWidget(
                        {
                            toggleWidth: true,
                            top: function () {
                                return getFixedHeight() - marqueeRDS$.outerHeight();
                            }
                        }
                    );
                }
            }
        };

        /**
         * Prepares all the different page modules for DOM load.
         */
        ut.initializePage = function() {
            var wrapFunc = function( key ) {
                return function() {
                    var onReady = pages[key].onReady,
                        onTheme42Ready = pages[key].onTheme42Ready;
                    if (onReady !== undefined) {
                        onReady();
                    }
                    if (onTheme42Ready !== undefined) {
                        win$.on( EVENTS.utReady, function() {
                            onTheme42Ready();
                        });
                    }
                };
            };
            var returnPages = {};

            for (var key in pages) {
                if ( pages.hasOwnProperty(key) ) {
                    returnPages[key] = wrapFunc( key );
                }
            }

            return returnPages;
        }();

    })();

    // ut_doc_ready_init:  runs on doc ready
    // ut_apex_ready_init: runs after apexreadyend
    // todo: populate ut.myPage.components$ if a property returns a jQuery object,

    var ut_doc_ready_init = {

        prepUI: function () {

            // Deal with basic CSS classes and elements on page load.

            $( 'html' ).removeClass( 'no-js' );

            // Top offset spacer
            $( SELECTORS.body_content ).prepend( '<div id="t_Body_content_offset"></div>' );
            bodyContentOffset$ = $( SELECTORS.body_content_offset );

            if ( body$.hasClass( 't-PageBody--noNav' ) ) {
                body$.removeClass( 'apex-side-nav' );
            }

            actionsCol$.show();

            // Accessibility
            $( '#t_Body_skipToContent' ).click(function(e) {
                e.preventDefault();

                pageTitle$
                    .attr( 'tabindex', '-1' )
                    .focus( function (e) {
                        pageTitle$.on( 'blur focusout', function () {
                            pageTitle$.removeAttr( 'tabindex' );
                        });
                    })
                    .focus();
            });

            resetHeaderOffset();
        },

        topMenu: function() {
            if ( hasTreeNav() && $.menu ) {
                return;
            }

            var render = function() {
                renderBadges($(".t-Header-nav .a-MenuBar-label"), "t-Menu-badge");
            };

            var menubar$ = $(".t-Header-nav-list", "#t_Header");

            if (!menubar$.is( ":data('ui-menu')" )) {
                win$.on("menucreate apexwindowresized", menubar$, function() {
                    render();
                });
            } else {
                render();
            }
        },

        hideShow: function() {
            var hideShow$ = $( ".t-Region--hideShow" );

            hideShow$.each( function() {
                var collapsible$ = $( this ),
                    useLocalStorage = collapsible$.hasClass("js-useLocalStorage");
                if ( !collapsible$.hasClass( "is-expanded" ) && !collapsible$.hasClass( "is-collapsed" ) ) {
                    collapsible$.addClass( "is-expanded" );
                }
                collapsible$.collapsible({
                    content: $( this ).find( ".t-Region-body" ).first(),
                    collapsed: collapsible$.hasClass( "is-collapsed" ),
                    rememberState: useLocalStorage
                });
            });
        },

        successMessage: function () {
            var successMessage$ = $( '#APEX_SUCCESS_MESSAGE' );

            apex.message.setThemeHooks( {
                beforeHide: function( pMsgType ){
                    if ( pMsgType === apex.message.TYPE.SUCCESS ) {
                        successMessage$.addClass( 'animate-hide' );
                    }
                },
                beforeShow: function( pMsgType ){
                    if ( pMsgType === apex.message.TYPE.SUCCESS ) {
                        var opt;

                        if ( ut.page.APEXMsgConfig ) {
                            opt = ut.page.APEXMsgConfig;
                            delete opt.clicked;
                        }

                        successMessage$.removeClass( 'animate-hide' );

                        if ( opt ) {
                            // When user choose to invoke a success message using JS,
                            // this message should follow the options in configureSuccessMessages, if any.
                            configAPEXMsgs( opt );
                        }
                    }
                }
            });
        },

        items: function () {
            var ITEM_DROPZONE = 'span.apex-item-file-dropzone',
                quickPicks$ = $( 'span.apex-quick-picks' );

            // Quick Picks to be moved below input
            quickPicks$.each(function () {
                var that$ = $( this );
                that$.insertAfter( that$.parent() );
            });
        },

        handleScrollTop: function() {
            if ( $( '.t-BreadcrumbRegion--compactTitle' ).length > 0 || $(".t-BreadcrumbRegion").length < 0 || pageTitle$.length < 0 || !$.trim( pageTitle$.html() ) ) {
                return;
            }

            // Reset Page elements position that may depend on the changed title height
            var resetPageElements = function () {
                // e.g. sideCol$
                resetHeaderOffset();
                // e.g. Sticky widgets
                win$.trigger( EVENTS.apexResized );
            };

            var shrinkCore = ToggleCore({
                content: pageTitle$,
                contentClassExpanded: "",
                contentClassCollapsed: "t-Body-title-shrink",
                useSessionStorage: false,
                defaultExpandedPreference: true,
                onExpand: resetPageElements,
                onCollapse: resetPageElements
            });

            shrinkCore.initialize();

            var shrinkThreshold = function() {
                // The threshold for shrinkage, if expanded, is the tBodyInfo height or 400 pixels, if the height is less than 100.
                if ( shrinkCore.isExpanded() ) {
                    var tBodyInfoHeight = $( ".t-Body-info" ).outerHeight() - 100;
                    if (tBodyInfoHeight > 100) {
                        return tBodyInfoHeight;
                    }
                    return 400;
                } else {
                    return 0;
                }
            };

            var handlerId = null;

            var addTop = function() {
                var scrollTop = win$.scrollTop();
                handlerId = null;
                /* only shrink the breadcrumbs when on a large display,
                   otherwise they are always displayed in compact styles */
                if ( mediaQuery( '(min-width: 641px)' ) ) {
                    var top = shrinkThreshold();
                    if ( scrollTop <= top ) {
                        shrinkCore.expand();
                    } else if ( scrollTop > top ) {
                        shrinkCore.collapse();
                    }
                } else {
                    shrinkCore.expand();
                }
            };

            win$.scroll( function() {
                if ( !handlerId ) {
                    handlerId = apex.util.invokeAfterPaint( addTop );
                }
            } );

            /* finally handle breadcrumb auto shrink on page load */
            addTop();
        },

        treeNav$: function() {
            var ignoreActivateTreeStart = true;

            if ( hasTreeNav() ) {
                // Check whether the collapsed mode is hidden, and add class
                var navCollapseModeClass = "js-navCollapsed--hidden";
                if ( treeNav$.hasClass( navCollapseModeClass ) ) {
                    // We can remove this class from the Tree Nav
                    // as it came from the template option and is not necessary here
                    treeNav$.removeClass( navCollapseModeClass );
                } else {
                    navCollapseModeClass = "js-navCollapsed--icons";
                }
                body$.addClass( navCollapseModeClass );

                if ( treeNav$.hasClass("js-addActions") ) {
                    apex.actions.addFromMarkup( treeNav$ );
                }

                treeNav$.treeView({
                    showRoot: false,
                    iconType: "fa",
                    useLinks: true,
                    navigation: true,
                    autoCollapse: true
                });

                treeNav$.treeView( "getSelection" )
                    .parents()
                    .children(".a-TreeView-content")
                    .addClass("is-current");

                treeNav$.treeView( "getSelection" )
                    .parents( ".a-TreeView-node--topLevel").children(".a-TreeView-content, .a-TreeView-row" )
                    .removeClass("is-current")
                    .addClass("is-current--top");

                $( ".t-TreeNav .a-TreeView-node--topLevel > .a-TreeView-content" ).each(function() {
                    if ($(this).find( ".fa" ).length <= 0) {
                        $(this).prepend( '<span class="fa fa-file-o"></span>' );
                    }
                });

                renderBadges(  $(".a-TreeView-label"), 'a-TreeView-badge' );

                // Since the tree is lazily loaded, the badges needed to be rendered on expansion.
                treeNav$.on("treeviewexpansionstatechange", function(jqueryEvent, treeViewEvent) {
                    if (treeViewEvent.expanded) {
                        renderBadges( treeViewEvent.nodeContent$.parent().find( ".a-TreeView-label" ), 'a-TreeView-badge' );
                    }
                });
            }

            toggleWidgets.initialize();

        },

        inlineDialogAutoHeight: function() {
            theme.dialogAutoHeight(".js-dialog-autoheight");
        },

        maximize: function() {
            var maximizeKey = 0;
            var current;
            var maximizableRegions$ =  $( ".js-showMaximizeButton" );
            var applyJqueryUiFocusableFix = function () {
                var focusable = function(element, isTabIndexNotNaN) {
                    var nodeName = element.nodeName.toLowerCase();
                    return ( /^(input|select|textarea|button|object)$/.test( nodeName ) ?
                        !element.disabled :
                        "a" === nodeName ?
                            element.href || isTabIndexNotNaN :
                            isTabIndexNotNaN) && $.expr.filters.visible( element );
                };
                $.extend($.expr[':'], {
                    // jQuery UI core focusable and tabbable are broken. They return false on elements that have a parent which has
                    // a "visibility: hidden" style applied on it. This is not true in any of the browsers we support:
                    // a child element that has a "visibility: visible" style will still be shown even if one of its parents
                    // has a "visibility: hidden" style.
                    focusable: focusable,
                    tabbable: function( element ) {
                        var tabIndex = $.attr( element, "tabindex" ), isTabIndexNaN = isNaN( tabIndex );
                        return ( isTabIndexNaN || tabIndex >= 0 ) && focusable( element, !isTabIndexNaN );
                    }
                });
            };
            var hideAllExceptChildren = function( content$ ) {
                maximizableRegions$.css( "visibility", "hidden" );
                content$
                    .css( "visibility", "visible" )
                    .find (".js-showMaximizeButton" )
                    .css( "visibility" , "visible" );
            };
            var makeCurrent = function( core, content$, top ) {
                var buildCurrent = function() {
                    var tabbable$ = content$.find(":tabbable");
                    return {
                        "core": core,
                        "content$": content$,
                        "top": top,
                        "first": tabbable$.first()[0],
                        "last": tabbable$.last()[0]
                    };
                };
                if ( !current ) {
                    current = buildCurrent();
                    pageBody$.addClass( "js-regionIsMaximized" );
                } else {
                    var old = current;
                    current.next = buildCurrent();
                    current = current.next;
                    current.previous = old;
                }
                apex.theme.defaultStickyTop = top;
                hideAllExceptChildren( current.content$ );
            };
            if ( maximizableRegions$.length > 0) {
                applyJqueryUiFocusableFix();
            }
            maximizableRegions$.each(function() {
                var content$ = $( this );
                var isIRR = content$.hasClass( "t-IRR-region" );
                var fthOnResize;
                var injectButtonSelector = ".js-maximizeButtonContainer";
                if (isIRR) {
                    injectButtonSelector = ".a-IRR-buttons";
                    if ( content$.find( injectButtonSelector ).length <= 0 ) {
                        content$.find( ".a-IRR-toolbar" ).append( "<div class='a-IRR-buttons'></div>" );
                    }
                }
                var maximize$ = content$.find( injectButtonSelector ).first();
                var regionId = content$.attr( "id" );
                var maximizeButton$ =
                    $('<button ' +
                        'class="t-Button t-Button--noLabel t-Button--icon t-Button--iconOnly t-Button--noUI" ' +
                        'aria-expanded="false"' +
                        'aria-controls="' + regionId + '" type="button">' +
                        '<span class="t-Icon a-Icon" aria-hidden="true"></span>' +
                        '</button>');
                maximize$.append( maximizeButton$ );
                var switchToPrevious = function() {
                    if (current) {
                        if ( current.previous ) {
                            current.previous.next = null;
                            content$
                                .find(".js-stickyWidget-toggle")
                                .stickyWidget("forceScrollParent", content$.parents(".t-Region-bodyWrap").first());
                            hideAllExceptChildren( current.previous.content$ );
                            apex.theme.defaultStickyTop = current.previous.top;
                        } else {
                            apex.theme.defaultStickyTop = getFixedHeight;
                            $(".js-stickyWidget-toggle").stickyWidget( "forceScrollParent" , null);
                            pageBody$.removeClass( "js-regionIsMaximized" );
                            maximizableRegions$.css("visibility", "visible");
                        }
                        win$.trigger( EVENTS.apexResized );
                        current = current.previous;
                    }
                };
                var getCollapsible = function() {
                    return content$.find( ".a-IRR-controlsContainer.a-Collapsible").first();
                };
                var resetIRRHeight = function( fthBody$ ) {
                    content$.css("overflow", "auto");
                    fthBody$.css("height", "auto");
                };
                var fthOnResizeDebouncer;
                var forceIRRHeight = function() {
                    fthOnResize = function() {
                        clearTimeout(fthOnResizeDebouncer); // Need to debounce this b
                        var safeHeight = function(element$) {
                            return element$.length > 0 ? element$.outerHeight() : 0;
                        };
                        setTimeout(function() {
                            var fthBody$ = content$.find( ".t-fht-tbody" ); // Only used when fixed table headers is active on an IRR!!!
                            if (fthBody$.length > 0) {
                                content$.css("overflow", "hidden");
                                var head = safeHeight(content$.find(".t-fht-thead"));
                                var pagWrap = safeHeight(content$.find(".a-IRR-paginationWrap"));
                                var irrToolBar = safeHeight(content$.find(".a-IRR-toolbar"));
                                var controlsContainer = safeHeight(content$.find(".a-IRR-controlsContainer"));
                                if (mediaQuery('(min-width: 769px)')) {
                                    var height = $( window ).height();
                                    fthBody$.css("height", height - irrToolBar - controlsContainer - pagWrap - head - 2);
                                } else {
                                    resetIRRHeight(fthBody$);
                                }
                            }
                        }, 200);
                    };
                    getCollapsible().on( "collapsibleexpand", fthOnResize ).on( "collapsiblecollapse", fthOnResize );
                    win$.on( EVENTS.apexResized, fthOnResize );
                };
                var disableForcedIrrHeight = function() {
                    if (current && isIRR && content$) {
                        resetIRRHeight( content$.find(".t-fht-tbody") );
                        win$.off( EVENTS.apexResized, fthOnResize);
                        getCollapsible().off( "collapsibleexpand", fthOnResize ).off( "collapsiblecollapse", fthOnResize );
                    }
                };
                var forceResize = function() {
                    win$.trigger( EVENTS.apexResized )
                        .trigger( EVENTS.resize ); // For plugins that are not hooked into the apexwindowresized debouncer.
                };
                var header$ = content$.find(".t-Region-header");
                var maximizeCore = ToggleCore({
                    key: "maximize_" + ++maximizeKey,
                    content: content$,
                    contentClassExpanded: "is-maximized",
                    useSessionStorage: false,
                    defaultExpandedPreference: false,
                    controllingElement: maximizeButton$,
                    onExpand: function() {
                        apex.navigation.beginFreezeScroll();
                        maximizeButton$
                            .attr("title", apex.lang.getMessage("RESTORE"))
                            .attr("aria-label", apex.lang.getMessage("RESTORE"))
                            .attr("aria-expanded", true)
                            .find(".t-Icon").removeClass("icon-maximize").addClass("icon-restore");
                        var top = function() {
                            var height = header$.outerHeight();
                            if ( !height ) {
                                return 0;
                            }
                            return height;
                        };
                        var scrollParent$;
                        if ( isIRR ) {
                            scrollParent$ = content$;
                            forceIRRHeight();
                            content$.find(".container").first().hide();
                        } else {
                            scrollParent$ = content$.find(".t-Region-bodyWrap").first();
                        }
                        content$
                            .find(".js-stickyWidget-toggle")
                            .stickyWidget("forceScrollParent", scrollParent$);
                        forceResize();
                        makeCurrent( maximizeCore, content$, top );
                    },
                    onCollapse: function() {
                        // This presumes that any collapse is always the active one!
                        // We can get away with this because the maximized regions are structured to overlay on top of each other
                        // completely.
                        apex.navigation.endFreezeScroll();
                        maximizeButton$
                            .attr("title", apex.lang.getMessage("MAXIMIZE"))
                            .attr("aria-label", apex.lang.getMessage("MAXIMIZE"))
                            .attr("aria-expanded", false)
                            .find(".t-Icon").addClass("icon-maximize").removeClass("icon-restore");
                        disableForcedIrrHeight();
                        if ( isIRR ) {
                            content$.find(".container").first().show();
                        }
                        forceResize();
                        switchToPrevious();
                    }
                });
                maximizeCore.initialize();
            });

            doc$.on("keydown", function(event) {
                if ( current) {
                    if ( event.which === $.ui.keyCode.ESCAPE ) {
                        current.core.collapse();
                        event.preventDefault();
                        return false;
                    } else if ( event.which === $.ui.keyCode.TAB ) {
                        if ( event.shiftKey && event.target === current.first ) {
                            event.preventDefault();
                            current.first.focus();
                        } else if ( !event.shiftKey ) {
                            if (current.last === event.target) {
                                event.preventDefault();
                                current.last.focus();
                            }
                        }
                    }
                }
            });
        },

        hidePagination: function () {
            // Template Option: Hide pagination links when there is no pagination available
            var hidePagination = function( regionId ){
                // Determine whether pagination exists for the report by checking for links or select lists
                var pagination$ = $( '#' + regionId ).find( '.t-Report-pagination' );
                if ( pagination$.find( 'td' ).length > 0 && !(pagination$.find( 'td.pagination > a' ).length > 0 || pagination$.find( 'td.pagination > select' ).length > 0) ) {
                    pagination$.addClass( 'u-hidden' );
                }
            };

            // Handle pagination for each report which has the template option set
            $( ".t-Report--hideNoPagination" ).each(function(){
                var regionId = $( this ).data( "region-id" );
                hidePagination( regionId );
                // Handle partial report refresh by $( '#myRgionId' ).trigger( 'apexrefresh')
                $( "#" + regionId ).on( "apexafterrefresh" , function(){
                    hidePagination( regionId );
                });
            });
        },

        mobile: function () {

            var navTabs$ = $( ".t-NavTabs" ),
                stickyButtonContainer$ = $( ".t-ButtonRegion--stickToBottom" );

            // Utility to return height of navTabs
            var getNavTabsHeight = function(padding) {
                var navHeight = 0,
                    navPadding = padding || 0;
                // If on a small screen, take into account height of the nav tabs when anchored to bottom
                if ( mediaQuery( "(max-width: 768px)" ) ) {
                    navHeight = navTabs$.outerHeight() || 0;
                }
                if ( navHeight > 0 ) {
                    navHeight += navPadding;
                }
                return navHeight;
            };

            // Template Option: Sticky Mobile Header Makes the body title sticky on small screens
            if ( body$.hasClass( "js-pageStickyMobileHeader" ) ) {
                var stickyMobileHeader = function () {

                    var stickyMobileTitle = function(){
                        var isSticky = pageTitle$.data( 'apexStickyWidget' ) ? true : false;
                        if ( mediaQuery( '(max-width: 640px)' ) ) {
                            if ( !isSticky ) {
                                pageTitle$.stickyWidget();
                            }
                        } else {
                            if ( isSticky ) {
                                pageTitle$.stickyWidget( 'destroy' );
                                setTimeout( resetHeaderOffset, 50 );
                            }
                        }
                    };

                    stickyMobileTitle();

                    win$.on( 'theme42layoutchanged apexwindowresized', stickyMobileTitle );
                };

                stickyMobileHeader();
            }

            // Template Option: Stick to Bottom for button container region
            if ( stickyButtonContainer$[0] ) {

                var stickyMobileFooter = function(){

                    // First, get the nav tabs height if they are on the page
                    var footerBottomOffset = getNavTabsHeight();

                    // Account for the navigation tabs being at the bottom so footer text is still visible
                    footer$.css( "padding-bottom" , footerBottomOffset || "" );

                    // on small screens, anchor the button region and update footer padding to take into account the button region
                    if ( mediaQuery( '(max-width: 768px)' ) ) {
                        stickyButtonContainer$.addClass( "is-anchored" ).css( "bottom" , footerBottomOffset );
                        footer$.css( "padding-bottom" , footerBottomOffset + stickyButtonContainer$.outerHeight() + 16 );
                    } else {
                        // when not on a small screen, restore the button region and footer as they were
                        stickyButtonContainer$.removeClass( "is-anchored" ).css( "bottom" , "" );
                        footer$.css( "padding-bottom" , "" );
                    }
                };

                // invoke sticky mobile footer, then listen for resize
                stickyMobileFooter();
                win$.on( EVENTS.apexResized, stickyMobileFooter );

            }

            // When using the Nav Tabs footer, add sufficient padding to footer on small screens
            // but only if we don't already handle this with sticky mobile footer
            if ( navTabs$[0] && !stickyButtonContainer$[0] ) {
                footer$.css( "padding-bottom" , getNavTabsHeight(16) || "" );
                win$.on( EVENTS.apexResized , function() {
                    footer$.css( "padding-bottom" , getNavTabsHeight(16) || "" );
                });
            }
        },

        initWizard: function () {

            var wizardLinks$ =  $( '.js-wizardProgressLinks' );

            apex.theme.initWizardProgressBar();

            // // Template Option: Make Wizard Steps Clickable
            if ( wizardLinks$.length > 0 ) {

                wizardLinks$.each(function () {
                    var thisWizard$ = $( this );

                    thisWizard$
                        .find( '.t-WizardSteps-wrap' )
                        .each(function () {
                            var thisStep$ = $( this ),
                                link = thisStep$.data( 'link' ),
                                parent$,
                                existingMarkup$;

                            if ( link ) {
                                parent$ = thisStep$.parent();
                                existingMarkup$ = thisStep$.children();

                                $( '<a class="t-WizardSteps-wrap" href="' + link + '"></a>' )
                                    .appendTo( parent$ )
                                    .append( existingMarkup$ );

                                thisStep$.remove();
                            }

                        });
                });
            }
        },

        megaMenu: function() {
            var menuNav$ = $( "#t_MenuNav", apex.gPageContext$ ),
                isMegaMenu = menuNav$.hasClass( "t-MegaMenu" ),
                hasCallout = menuNav$.hasClass( "js-menu-callout" );

            if ( menuNav$.length > 0 && isMegaMenu ) {
                // Attach the menu to the side nav control
                $( "#t_Button_navControl")
                    .attr( "data-menu","t_MenuNav")
                    .addClass( "js-menuButton t-Button--megaMenuToggle" )
                    .show();

                if ( menuNav$.hasClass( "js-addActions" )) {
                  apex.actions.addFromMarkup( menuNav$ );
                }
                if ( hasCallout ) {
                    menuNav$.prepend( "<div class='u-callout'></div>" );
                }

                menuNav$.menu({
                  customContent: true,
                  tabBehavior: "NEXT",
                  callout: hasCallout
                });
            }
        }
    };

    var ut_apex_ready_init = {

        carousel: function () {
            var carousel$ = $( '.t-Region--carousel' );

            if ( $.fn.carousel && carousel$.length > 0) {
                carousel$.carousel({
                    containerBodySelect: '.t-Region-carouselRegions',
                    html:true
                });
            }
        },

        tabsRegion: function () {

            (function() {
                var TABS_REGION_REGEX = /t-TabsRegion-mod--([^\s]*)/;
                $.fn.utTabs = function( options ) {
                    var that$ = $(this);
                    that$.each(function() {
                        var tabClasses = [];
                        var classes = this.className.split(/\s+/);
                        classes.forEach(function( clazz ) {
                            var match = clazz.match(TABS_REGION_REGEX);
                            if (match !== null && match.length > 0) {
                                tabClasses.push("t-Tabs--" + match[1]);
                            }
                        });
                        var ul$ = $( "<ul class='t-Tabs " + tabClasses.join(" ") +  "' role='tablist'>" );
                        var tabs$ = $(this);
                        var items$ = tabs$.find(".t-TabsRegion-items").first();
                        items$.prepend( ul$ );
                        items$.children().filter("div").each(function() {
                            var tab$ = $(this);
                            var tabId = tab$.attr("id");
                            var tabLabel = tab$.attr("data-label");
                            ul$.append(
                                '<li class="t-Tabs-item" aria-controls="' + tabId + '" role="tab">' +
                                '<a href="#' + tabId + '" class="t-Tabs-link" tabindex="-1">' +
                                '<span>' + tabLabel + '</span>' +
                                '</a>' +
                                '</li>'
                            );
                        });
                        ul$.aTabs({
                            tabsContainer$: items$,
                            optionalSelectedClass: "is-active",
                            showAllScrollOffset: false,
                            onRegionChange: function( mode,  activeTab ) {
                                if ( !activeTab ) {
                                    return;
                                }
                                activeTab.el$.find(".js-stickyWidget-toggle").trigger("forceresize");
                            },
                            useSessionStorage: that$.hasClass("js-useLocalStorage")
                        });
                    });

                };
            }());

            var tabsRegion$ = $( '.t-TabsRegion' );

            if ( $.apex.aTabs && tabsRegion$.length > 0) {
                tabsRegion$.utTabs();
            }
        },

        floatingLabels: function(){
            // todo: put create function getContainer to reuse the frequently called closest( CL_CONTAINER ).
            var CL_ACTIVE      = 'is-active',
                CL_DISABLED    = 'is-disabled',
                CL_REQUIRED    = 'is-required',
                CL_SHOW_LABEL  = 'js-show-label',
                CL_FLOAT       = '.t-Form-fieldContainer--floatingLabel',
                CL_CONTAINER   = '.t-Form-fieldContainer',
                CL_PRE         = ' .t-Form-itemText--pre',
                CL_HTML5_DATE  = '.apex-item-wrapper--date-picker-html5';

            var containers$ = $( CL_FLOAT );

            if ( containers$.length === 0 ) {
                return false;
            }

            // Regular inputs and select lists
            var tags    = CL_FLOAT + ' .apex-item-text, ' + CL_FLOAT + ' .apex-item-select, ' + CL_FLOAT + ' .apex-item-textarea',

                // LOV and Calendar pickers are special and don't get focus like regular ones.
                lov_cal = CL_FLOAT + ' .apex-item-popup-lov, ' + CL_FLOAT + ' .apex-item-datepicker';

            var needLabel = function( item$ ){
                return item$.val() ||
                    item$.attr( 'placeholder' ) ||
                    item$.children( 'option' ).first().text();
            };

            var shrink = function( elem$ ){
                elem$.closest( CL_CONTAINER ).addClass( CL_ACTIVE );
            };

            // move pre text before the label
            $( CL_FLOAT + CL_PRE ).each(function(){
                var preText$ = $( this ),
                    field$ = preText$.closest( CL_CONTAINER );
                preText$.detach().prependTo( field$ );
            });

            containers$.each(function(){
                var cont$ = $( this );
                if ( cont$.find( 'span.apex-item-display-only' ).length > 0 ) {
                    cont$.addClass( 'apex-item-wrapper--display-only' );
                }
            });

            $( tags )
                .on( 'focus change', function( e ) {
                    var that$ = $( this );
                    if ( !that$.val() ) {
                        shrink( that$ );
                    }
                    else {
                        if ( e.type === 'change' ) {
                            shrink( that$ );
                        }
                    }
                })
                .each(function(){  // Initialize all inputs on load
                    var item$ = $( this ),
                        label$ = item$.closest( CL_CONTAINER );

                    if( needLabel( item$ ) ){
                        label$.addClass( CL_SHOW_LABEL );
                    } else {
                        label$.removeClass( CL_SHOW_LABEL );
                    }
                    if( item$.is( ':disabled' ) ) {
                        label$.addClass( CL_DISABLED );
                    } else {
                        label$.removeClass( CL_DISABLED );
                    }
                    if( item$.attr( 'required' ) ) {
                        label$.addClass( CL_REQUIRED );
                    }
                })
                .not( lov_cal )  // Exclude Calendar items to fix shrinking and expanding behavior.
                .on( 'blur', function() {
                    var item$ = $( this ),
                        label$ = item$.closest( CL_CONTAINER ).removeClass( CL_ACTIVE );
                    if( needLabel( item$ ) ){
                        label$.addClass( CL_SHOW_LABEL );
                    } else {
                        label$.removeClass( CL_SHOW_LABEL );
                    }
                });

            $( lov_cal )
                .on( 'change', function() {
                    var item$ = $( this ),
                        label$ = item$.closest( CL_CONTAINER ).addClass( CL_SHOW_LABEL );
                    if( !needLabel( item$ ) ){
                        label$.removeClass( CL_SHOW_LABEL + ' ' + CL_ACTIVE );
                    }
                })
                .each(function () {
                    var that$ = $( this );
                    // Always shrink the label of Date Picker (HTML5) item,
                    // as it has shadow DOM as placehoder, which appears to overlap with input label.
                    if ( !that$.closest( CL_CONTAINER ).hasClass( CL_HTML5_DATE ) ) {
                        shrink( that$ );
                    }
                });

            // See bug 29180358
            $( document.activeElement ).focus();
        },

        misc: function(){

            body$.removeClass( 'no-anim' );

            // Initializes the menu widget in the right corner.
            var navigationBarCallout = $( ".t-NavigationBar" ).hasClass( "js-menu-callout" );

            $( ".t-NavigationBar-menu", pageCtx$ ).menu( { callout: navigationBarCallout } );

            // alert close button
            $('.t-Alert .t-Button--closeAlert').click(function () {
                // todo: improve delayResize
                delayResize();
            });

            // Back to top button
            var backToTop$ = $( '#t_Footer_topButton' );

            // todo review if it is neccessary to do resize on menu.
            // the menubar can overflow and reduce its items
            // triggering a menu resize will fix that
            $( ".a-MenuBar" ).menu( "resize" );

            backToTop$
                .attr( 'title', apex.lang.getMessage( 'APEX.UI.BACK_TO_TOP' ) )
                .click(function() {
                    $( 'html, body' ).animate( { scrollTop: 0} , 500 );
                    $( 'a.t-Header-logo-link' ).focus();
                    return false;
                });

            // Handle anchor links scroll when there's # in URL, considering sticky tops.
            var scrollToAnchor = function() {
                scrollTo( window.location.hash );
            };
            scrollToAnchor();
            win$.on( "hashchange", function( e ) {
                e.preventDefault();
                scrollToAnchor();
            });

            apex.theme.initResponsiveDialogs();

            // Dev Toobar
            var DEBUGON = "grid-debug-on";
            if ( $( "#apexDevToolbar" ).length > 0 ) {
                doc$
                    .on( "apex-devbar-grid-debug-on", function(){
                        body$.addClass( DEBUGON );
                    })
                    .on( "apex-devbar-grid-debug-off", function(){
                        body$.removeClass( DEBUGON );
                    });
            }

        }

    };



    /*
     * Properties of the current page.
     *
     */

    var Page = function () {

        this.init();
        // Size
        //this.isSmall = false;

        // Navigation Type
        // this.isTopNav = false;
    };

    Page.prototype = {

        init: function(){

            var initComponents = function ( pComponents ) {
                var key;
                for ( key in pComponents ) {
                    if ( pComponents.hasOwnProperty( key ) ) {
                        pComponents[ key ]();
                    }
                }
            };

            win$.trigger( EVENTS.preload );

            initComponents( ut_doc_ready_init );

            $( pageCtx$ ).on( EVENTS.readyEnd, function() {
                initComponents( ut_apex_ready_init );
                win$.trigger( EVENTS.utReady );
            });

            // win$.on( EVENTS.apexResized, thisPage.onResize );
        }

        // onResize: function () {
        //     // todo: perhaps we can use this property to reduce calls to mediaQuery(),
        //     this.isSmall = isSmall();
        // }
    };


    $( function(){
        // todo: expose useful properties such as isSmall?
        ut.page = new Page();
    });

})( apex.jQuery, apex.theme42, apex.theme );
