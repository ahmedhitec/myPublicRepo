/*!
 Copyright (c) 2020, Oracle and/or its affiliates. All rights reserved.
 */
/*global apex*/
( function( util, widgetUtil, region, $ ) {
    "use strict";

    /**
     * Initialization function for template based reports such as cards.
     * Expected markup:
     * <div id="{regionStaticId}">...
     *   <div id="{regionStaticId}_tmv"></div>
     *   ...
     * </div>
     *
     * @ignore
     * @param {object} options Required options object. This is the options object to be passed to tableModelView widget
     *   with the following additional properties:
     * @param {string} options.regionType
     * @param {string} options.regionId
     * @param {string} options.regionStaticId
     * @param {string} options.ajaxIdentifier
     * @param {string|string[]} options.itemsToSubmit
     * @param {string} options.parentRegionStaticId  todo when master detail supported
     * @param {boolean} options.trackParentSelection todo when master detail supported
     * @param {boolean} options.lazyLoading
     * @param {string} options.apexFacets
     * @param {number} options.reportHeight xxx ?
     *
     * @param {string} options.modelName
     * @param {object} options.modelOptions options object to be passed to apex.model.create. shape, recordIsArray, fields
     *   regionId, ajaxIdentifier, and pageItemsToSubmit are set automatically. The following are just some of the
     *   model options that may be important to set
     * @param {string|string[]} options.modelOptions.identityField
     * @param {string} options.modelOptions.metaField
     * @param {string} options.modelOptions.paginationType
     * @param {boolean} options.modelOptions.hasTotalRecords
     *
     * @param {object} data optional data object
     * @param {array} data.values an array of records
     * @param {number} data.firstRow the one based server offset of the first record in values array
     * @param {boolean} data.moreData true if the server has more records and false otherwise
     * @param {number} [data.totalRows] optional total number of rows in the result set
     */
    apex.widget.templateReportRegionInit = function( options, data ) {
        var model, report$, sizer$, moreData /* intentionally undefined */,
            values = null,
            total = null;

        apex.debug.info("Init template report region: ", options );

        function createModel( apexFacetsRegionId ) {
            var facetsRegion, callServer,
                origCallServer = options.modelOptions.callServer;

            callServer = origCallServer;
            if ( apexFacetsRegionId ) {
                facetsRegion = region( apexFacetsRegionId );
                callServer = function( requestData, requestOptions ) {
                    var p;

                    if ( facetsRegion ) {
                        facetsRegion.lock();
                    }
                    p = ( origCallServer || apex.server.plugin )( requestData, requestOptions );
                    p.always( function() {
                        if ( facetsRegion ) {
                            facetsRegion.unlock();
                        }
                    } );
                    return p;
                };
                // delay to make sure facets region is initialized
                $(function() {
                    facetsRegion.widget().on( "facetschange", function() {
                        region( options.regionStaticId ).refresh(); // xxx reset?
                    } );
                });
            }

            model = apex.model.create( options.modelName, $.extend( {}, options.modelOptions, {
                shape: "table",
                recordIsArray: true,
                fields: options.columns[0],
                regionId: options.regionId,
                ajaxIdentifier: options.ajaxIdentifier,
                pageItemsToSubmit: options.itemsToSubmit,
                callServer: callServer
            } ), values, total, moreData );
            // after the model is created don't use the initial data any more
            total = values = null;
            moreData = undefined;
        }

        function resize( init ) {
            var w = sizer$.width(),
                h = sizer$.height();

            util.setOuterWidth(report$, w);
            if ( options.hasSize ) {
                util.setOuterHeight(report$, h);
            }
            if (!init) {
                report$.tableModelView( "resize" );
            }
        }

        if ( !options.lazyLoading ) {
            values = data.values;
            if ( data.totalRows ) {
                total = data.totalRows;
            }
            moreData = data.moreData;
        }

        createModel( options.apexFacets );

        report$ = $( "#" + options.regionStaticId + "_" + options.regionType );
        sizer$ = report$.parent();
        sizer$.css( "overflow", "hidden" );
        if ( options.hasSize ) {
            sizer$.css( "height", options.reportHeight || sizer$.height() );
        }
        resize( true ); // before tmv widget is created

        if ( options.noDataMessage === undefined ) {
            options.noDataMessage = apex.lang.getMessage( "APEX.IG.NO_DATA_FOUND" );
        }
        report$.tableModelView( options );

        // todo consider if/when this resize logic is needed
        widgetUtil.onElementResize( report$.parent()[0], function () {
            resize();
        } );

        widgetUtil.onVisibilityChange( report$[0], function ( show ) {
            if ( show ) {
                widgetUtil.updateResizeSensors( sizer$[0] );
                resize();
            }
        } );

        // todo master/detail handling

        // xxx region interface
        region.create( options.regionStaticId, {
            type: options.regionType,
            parentRegionId: options.parentRegionStaticId,
            widgetName: "tableModelView",
            widget: function() {
                return report$;
            },
            // xxx distinguish refresh to get new data and refresh to just rerender
            refresh: function () {
                model.clearData();
            },
            // extra methods xxx
            getModel: function () {
                return model;
            }
        } );

    };
} )( apex.util, apex.widget.util, apex.region, apex.jQuery );
