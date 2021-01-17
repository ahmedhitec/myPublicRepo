/*global apex*/
/*!
 @license
 Oracle Database Application Express, Release 5.0
 Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
 */
(function( $, apex ) {
    "use strict";

    var VALUE_VARIES = {};

    apex.templateOptionsHelper = {
        getValuesFromDialog: function( properties, dialog$ ) {
            var lValue;
            var lValues = [];
            function addValues( pProperties ) {
                for ( var i = 0; i < pProperties.length; i++ ) {
                    lValue = dialog$.propertyEditor( "getPropertyValue", pProperties[ i ].propertyName );
                    if ( !$.isEmptyObject( lValue ) ) {
                        lValues.push( lValue );
                    }
                }
            }
            // Get selected template options from all our properties
            addValues( properties.common );
            addValues( properties.advanced );
            return lValues;
        },
        getProperties: function( templateOptions, lValues, readOnly, prop ) {
            var i,
                lGroupId,
                lGroupIdx,
                lGroup,
                lDisplayGroupId,
                lTemplateOptionsVal,
                lGroups           = [],
                lGroupsMap        = {},
                lGeneralValues    = [],
                lGeneralLovValues = [],
                lGroupValue       = {},
                lProperties       = {
                    common:   [],
                    advanced: []
                },
                // Multi-select support
                joinedGeneralValues,
                lMetaData,
                lPropertyId = '',
                isMultiSelected,
                hasMultiSelectedData;

            if ( prop ) {

                lPropertyId      = prop.propertyName;
                isMultiSelected  = $.isEmptyObject( prop.value );

                if ( prop.metaData && prop.metaData.multiSelectData ) {
                    hasMultiSelectedData = true;
                } else {
                    hasMultiSelectedData = false;
                }
                
            }

            // Build a list of "general" template options and one for each group
            for ( i = 0; i < templateOptions.values.length; i++ ) {

                lTemplateOptionsVal = templateOptions.values[ i ];

                if ( lTemplateOptionsVal.groupId ) {

                    lGroupId = lTemplateOptionsVal.groupId;

                    if ( !lGroupsMap.hasOwnProperty( lGroupId )) {
                        
                        lGroup = templateOptions.groups[ lGroupId ];

                        lGroups.push({
                            title:      lGroup.title,
                            seq:        lGroup.seq,
                            nullText:   lGroup.nullText,
                            isAdvanced: lGroup.isAdvanced,
                            isRequired: false,
                            lovValues:  [],
                            value:      ""
                        });
                        lGroupIdx = lGroups.length - 1;
                        lGroupsMap[ lGroupId ] = lGroupIdx;
                    } else {
                        lGroupIdx = lGroupsMap[ lGroupId ];
                    }
                    // If a preset is set for one of the list of values entries of the group, we expect that the
                    // group has to be required
                    if ( $.inArray( lTemplateOptionsVal.r, templateOptions.presetValues ) !== -1 ) {
                        lGroups[ lGroupIdx ].isRequired = true;
                        if ( lGroups[ lGroupIdx ].value === "" ) {
                            lGroups[ lGroupIdx ].value = lTemplateOptionsVal.r;
                        }
                    }
                    // Set the current selection for that group
                    if ( $.inArray( lTemplateOptionsVal.r, lValues ) !== -1 ) {
                        lGroups[ lGroupIdx ].value = lTemplateOptionsVal.r;
                    }
                    lGroups[ lGroupIdx ].lovValues.push({
                        r: lTemplateOptionsVal.r,
                        d: lTemplateOptionsVal.d
                    });

                } else {

                    lGeneralLovValues.push( lTemplateOptionsVal );

                    // Is the LOV value one of our selected values?
                    if ( $.inArray( lTemplateOptionsVal.r, lValues ) !== -1 ) {
                        lGeneralValues.push( lTemplateOptionsVal.r );
                    }

                }
            }

            joinedGeneralValues = isMultiSelected ? VALUE_VARIES : lGeneralValues.join( ":" );

            // Sort result based on sequence and if they are equal, use title as second sort option
            lGroups.sort( function( a, b ) {
                if ( a.seq === b.seq ) {
                    return a.title.localeCompare( b.title );
                } else {
                    return a.seq - b.seq;
                }
            });

            // There is always a "General" property, because we will at least have a #DEFAULT# entry

            lMetaData = {
                type:                   "TEMPLATE OPTIONS GENERAL",
                prompt:                 apex.lang.getMessage("TEMPLATE_OPTIONS.GENERAL"),
                isReadOnly:             !!readOnly,
                isRequired:             false,
                lovValues:              lGeneralLovValues,
                displayGroupId:         "common",
                defaultTemplateOptions: templateOptions.defaultValues
            };
            // Store multi selected data if any.
            if ( hasMultiSelectedData ) {
                lMetaData.multiSelectData = prop.metaData.multiSelectData;
            }

            lProperties.common[ 0 ] = {
                propertyName:   "general",
                propertyId:     lPropertyId,
                value:          joinedGeneralValues,
                oldValue:       joinedGeneralValues,
                originalValue:  joinedGeneralValues,
                metaData:       lMetaData,
                errors:         [],
                warnings:       []
            };

            // Add a select list for each template options group
            for ( i = 0; i < lGroups.length; i++ ) {

                lGroup          = lGroups[ i ];
                lDisplayGroupId = lGroup.isAdvanced ? 'advanced' : 'common';
                lGroupValue     = lGroup.value ? lGroup.value : '';

                lMetaData = {
                    type:           $.apex.propertyEditor.PROP_TYPE.SELECT_LIST,
                    prompt:         lGroup.title,
                    isReadOnly:     !!readOnly,
                    isRequired:     lGroup.isRequired,
                    nullText:       lGroup.nullText,
                    lovValues:      lGroup.lovValues,
                    displayGroupId: lDisplayGroupId
                };

                if ( hasMultiSelectedData ) {
                    lMetaData.multiSelectData = prop.metaData.multiSelectData;
                }

                lProperties[ lDisplayGroupId ].push({
                    propertyName:   "grp" + i,
                    value:          lGroupValue,
                    oldValue:       lGroupValue,
                    originalValue:  lGroupValue,
                    metaData:       lMetaData,
                    errors:         [],
                    warnings:       []
                });
            }

            return lProperties;
        },
        addGeneralPropertyType: function () {
            $.apex.propertyEditor.addPropertyType( "TEMPLATE OPTIONS GENERAL", {
                init: function( pElement$, prop ) {
                    var lDefaultCheckboxes$ = $();

                    function _setDefaultOptions( ) {

                        var lChecked = $( this ).prop( "checked" );

                        if ( lChecked ) {
                            lDefaultCheckboxes$.prop( "checked", true );
                        }

                        lDefaultCheckboxes$.prop( "disabled", lChecked );

                    }

                    // call base checkboxes
                    this[ "super" ]( "init", pElement$, prop );

                    var checkboxes$      = pElement$.find( "input[type=checkbox]" );
                    var defaultCheckbox$ = checkboxes$.filter( "[value='#DEFAULT#']" );

                    // Get all default template options checkboxes
                    for ( var i = 0; i < prop.metaData.defaultTemplateOptions.length; i++ ) {
                        lDefaultCheckboxes$ =
                            lDefaultCheckboxes$.add(
                                checkboxes$.filter(
                                    "[value='" +
                                    apex.util.escapeCSS(
                                        prop.metaData.defaultTemplateOptions[ i ]) + "']" ));
                    }

                    defaultCheckbox$
                        .on( "click setdefaultcheckboxes", _setDefaultOptions )
                        .trigger( "setdefaultcheckboxes" );
                },
                getValue: function( pProperty$ ) {
                    var lValues = [];
                    pProperty$.find("input[type=checkbox]").filter( ":checked:not(:disabled)" ).each( function() {
                        lValues.push( this.value );
                    });

                    return lValues.join( ":" );
                },
                setValue: function( pElement$, prop, value ) {
                    this[ "super" ]( "setValue", pElement$, prop, value );
                    pElement$.find( "input[type=checkbox]" ).filter( "[value='#DEFAULT#']").trigger( "setdefaultcheckboxes" );
                }

            }, "CHECKBOXES" );
        }
    };
}( apex.jQuery, apex ));