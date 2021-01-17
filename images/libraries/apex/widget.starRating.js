/*!
 Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
*/
/*
 * Star Rating APEX Item Widget
 */
/*global window,apex*/
( function( widget, util, item, $ ) {
    "use strict";

    var C_KEYS = $.ui.keyCode,
        C_DISPLAY_STARS = "STARS",
        C_DISPLAY_STARS_NUMBER = "STARS_AND_VALUE",
        C_DISPLAY_VALUE = "VALUE",
        C_DISPLAY_SINGLE_STAR_AND_VALUE = "SINGLE_STAR_AND_VALUE",
        CL_FONT_APEX = " fa ",
        CL_RATING = "a-StarRating",
        CL_RATING_STAR = "a-StarRating-star",
        CL_RATING_STARS = "a-StarRating-stars",
        CL_RATING_STARS_FG = "a-StarRating-stars-fg",
        CL_RATING_STAR_BG = "a-StarRating-stars-bg",
        CL_RATING_VALUE = "a-StarRating-value",
        CL_RATING_CLEAR = "a-StarRating-clear",
        CL_RATING_INNER = "a-StarRating-starsInner",
        CL_IS_FOCUSED = "is-focused",
        tooltipClass = "ui-widget-content ui-corner-all ui-widget ui-tooltip";

    /**
     * @param {string} itemId
     * @param  {Object} options
     */
    widget.starRating = function( itemId, options ) {

        var lStarRatingElement$, lDummyRating$,
            lForwardKey         = C_KEYS.RIGHT,
            lBackwardKey        = C_KEYS.LEFT,
            lInputId            = "#" + itemId + "_INPUT",
            lItem$              = $( lInputId ),
            lDisplayedStars     = options.numStars,
            lStarWidth          = 16,
            previousValue       = lItem$.val(),
            lInitialValue       = lItem$.val(),
            lClearButtonClicked = false,
            lIsLastStar         = false,
            lTooltipInitialized = true,
            lDisplay            = C_DISPLAY_STARS,
            lOptions = $.extend( {
                numStars:      5,
                iconClass:     "fa-star",
                increment:     1,
                clearTooltip:  "Clear Rating",
                labelText:     "#VALUE#",
                isRequired:    false,
                showClearButton: true,
                showValue: C_DISPLAY_STARS,
                readOnlyDisplay: C_DISPLAY_STARS,
                readOnly: false,
                iconTooltip: ""
            }, options );
        /**
       * Normalizes the passed value according to the widget options
       *
       * @param      {any}  value  The value
       * @return     {any}  The normalized value
       */
        function normalize( value ) {
            var lValue = value;
            if ( lValue === "0" || lValue === 0 || lValue === "" || lValue === null || lValue === false ) {
                if ( lOptions.isRequired ) {
                    lValue = "";
                } else {
                    lValue = 0;
                }
                cleanValue();
            } else {

                lValue = parseFloat( lValue );

                if ( isNaN( lValue ) ) {
                    lValue = 0;
                    cleanValue();
                }
                if ( lValue < 0 ) {
                    lValue = 0;
                    cleanValue();
                } else if ( lValue > lOptions.numStars ) {
                    lIsLastStar = true;
                    lValue = lOptions.numStars;
                }
            }

            return lValue;
        }

        function isEditable(){
          return (!lItem$.prop( "disabled" ) && !lOptions.readOnly);
        }

        function cleanValue() {
          if ( lOptions.isRequired || lOptions.readOnly ) {
            lItem$.val( "" ).change();
          } else {
            lItem$.val( 0 ).change();
          }
        }

        /**
        * Builds and returns the rating value jQuery element
        *
        * @return     {jQuery}  The rating value element
        */
        function getRatingValue() {
            var lRatingValue$,
                out = util.htmlBuilder();

            // Fix Bug Num. 30441644
            // Show item value when is null display 0.
            var lDefaultValue = lItem$.val() === "" ? 0 : "";

                out.markup( "<div " )
                   .attr( "class", CL_RATING_VALUE )
                   .markup( ">"+lDefaultValue+"</div>");

            lRatingValue$ = $( out.toString() );

            return lRatingValue$;
        }

      /**
        * Builds and returns the clear button jQuery element
        *
        * @return     {jQuery}  The clear button element
        */
        function getClearButton() {
            var lClearButton$,
                out = util.htmlBuilder();

                out.markup( "<div " )
                   .attr( "class", CL_RATING_CLEAR )
                   .attr( "title", lOptions.clearTooltip )
                   .markup( ">" )
                       .markup( "<span " )
                       .attr( "aria-hidden", "true" )
                       .attr( "class", CL_FONT_APEX + "fa-times-circle-o" )
                       .markup( ">" )
                       .markup( "</span>" )
                   .markup( "</div>" );

            lClearButton$ = $( out.toString() );
            lClearButton$.on( "click", function( e ) {
                cleanValue();
                lClearButtonClicked = true;
            } );

            return lClearButton$;
        }


        function render( pValue ) {
            var C_COLOR       = 'color:',
                activeColor   = lOptions.activeColor,
                inActiveColor = lOptions.inactiveColor,
                isReadOnly    = lOptions.readOnly,
                out           = util.htmlBuilder(),
                i;

                if ( activeColor ) {
                  activeColor = C_COLOR + activeColor;
                }

                if ( inActiveColor ) {
                  inActiveColor = C_COLOR + inActiveColor;
                }

                out.markup(" <div " )
                 .attr( "class", CL_RATING_STARS )
                 .markup( "> " )
                     .markup( "<div " )
                     .attr( "class", CL_RATING_INNER )
                     .markup(">")
                         .markup( "<div " )
                         .attr( "class", CL_RATING_STAR_BG )
                         .markup( ">" );

                if ( lDisplay !== C_DISPLAY_VALUE ) {
                  for ( i = 0; i < lDisplayedStars; i++ ) {
                      out.markup( "<span " )
                         .attr( "class", CL_RATING_STAR + CL_FONT_APEX + lOptions.iconClass )
                         .optionalAttr("style", inActiveColor )
                         .markup( "></span>");
                  }
                }

              if ( lDisplay !== C_DISPLAY_STARS ) {
                if ( pValue === undefined ) {
                    pValue = 0;
                }
                // Fix Bug Num. 30441644
                // show item value ( Show value attr - Editable mode ) when item is inside IG
                // or when value is null display 0.
                out.markup( "<div " )
                   .attr( "class", CL_RATING_VALUE )
                   .markup( ">" + pValue + "</div>");
            }

            var activeWidth = isNaN( pValue * lStarWidth ) ? 0 : pValue * lStarWidth ;
            out.markup( "</div>" )
               .markup( "<div " )
               .attr( "class", CL_RATING_STARS_FG )
               .optionalAttr("style", "width:" + activeWidth + "px;")
               .markup( ">" );

            if ( lDisplay !== C_DISPLAY_VALUE ) {
              for ( i = 0; i < lDisplayedStars; i++ ) {
                  out.markup( "<span " )
                     .attr( "class", CL_RATING_STAR + CL_FONT_APEX + lOptions.iconClass )
                     .optionalAttr("style", activeColor )
                     .markup( "></span>");
              }
            }

              out
                  .markup( "</div>" )
                .markup( "</div>" )
              .markup( "</div>" );

            return out.toString();
        }

        function updateDisplay() {
            var lValue = normalize( lItem$.val() );

            if ( lClearButtonClicked ) {
                lClearButtonClicked = false;
            }
            if ( lValue === previousValue && !lIsLastStar ) {
               cleanValue();
               lValue = 0;
            }

            previousValue = lValue;
            lTooltipInitialized = true;
            lIsLastStar = false;

            if( lValue === "" ) { lValue = 0; }

            lStarRatingElement$
                .attr("title", lOptions.labelText.replace( /#VALUE#/, lValue ) );
            lItem$
                .closest( "." + CL_RATING )
                .find( "." + CL_RATING_STARS_FG )
                .css( "width", ( lValue * lStarWidth ) + "px" );
            lItem$
                .closest( "." + CL_RATING )
                .find( "." + CL_RATING_VALUE )
                .html( lValue );

            lItem$
                .attr( {
                    "aria-valuenow": "" + lValue,
                    "aria-valuetext": lOptions.labelText.replace( /#VALUE#/, "" + lValue ),
                    "value": lItem$.val()
                } );

            lItem$
                .closest( "." + CL_RATING )
                .find( "." + CL_RATING_VALUE )
                .text( lValue );

           var tooltipContent = lOptions.labelText;

           if ( lOptions.iconTooltip.includes("#VALUE#") ) { tooltipContent = lOptions.iconTooltip; }

            lItem$
                .parent()
                .tooltip( {
                     show: apex.tooltipManager.defaultShowOption(),
                     position: {
                        my: "left top+15",
                        at: "left center",
                        collision: "flipfit"
                     },
                     content: tooltipContent.replace( /#VALUE#/, lValue ),
                     tooltipClass: tooltipClass
                 } );
        }

        lDisplay = lOptions.readOnly ?  lOptions.readOnlyDisplay : lOptions.showValue;

        if ( lDisplay === C_DISPLAY_SINGLE_STAR_AND_VALUE ) {
           lDisplayedStars = 1;
         } else if ( lDisplay === true ) {
           lDisplay = C_DISPLAY_STARS_NUMBER;
         } else if ( lDisplay === false ) {
             lDisplay = C_DISPLAY_STARS;
         }

         //  add Star Rating HTML element
         lStarRatingElement$ = lItem$.addClass( "u-vh is-focusable" )
                   .wrap( "<div class='"+ CL_RATING +"'></div>")
                   .parent();

          // get rating value width
          lDummyRating$ = $( "<span style='display: none' class='dummyStar " + CL_RATING_STAR + CL_FONT_APEX +  lOptions.iconClass + "'></span>");

          lStarRatingElement$.append( lDummyRating$ );
          lStarWidth = $( ".dummyStar" ).width();
          $( ".dummyStar" ).remove();

          lStarWidth = lStarWidth === 0 ? 16 : lStarWidth;

         if ( lOptions.showClearButton && !lOptions.readOnly ) {
           lStarRatingElement$.append(
               getClearButton()
           );
         }

        if ( lDisplay !== C_DISPLAY_VALUE ) {
          lStarRatingElement$.append(
              render()
          );
        } else {
          lStarRatingElement$.append(
              getRatingValue()
          );
        }

        lItem$
            .attr( {
                "role": "spinbutton",
                "aria-valuenow": "0",
                "aria-valuemax": "" + lOptions.numStars
            } );

        // if initial value is empty but the value is not required the toolpit wont be initialized
        if ( lItem$.val() === "" && !lOptions.isRequired  ) {
            lItem$.attr( { "value": 0 } );
            lInitialValue = lItem$.val();
            lTooltipInitialized = false;
        }

        if ( lStarRatingElement$.css( "direction" ) === "rtl" ) {
            lForwardKey  = C_KEYS.LEFT;
            lBackwardKey = C_KEYS.RIGHT;
        }

        lStarRatingElement$
            .on( "focusin", function( e ) {

                lItem$
                   .closest( "." + CL_RATING )
                   .find( "." + CL_RATING_STARS )
                   .addClass( CL_IS_FOCUSED );
            } )
           .on( "focusout", function( e ) {

               lItem$
                  .closest( "." + CL_RATING )
                  .find( "." + CL_RATING_STARS )
                  .removeClass( CL_IS_FOCUSED );
           } )
           .on( "keydown", function( e ) {
              var lValue = null,
                  lKeyCode = e.which;

            if ( isEditable() ) {
              switch ( lKeyCode ){
                       case C_KEYS.HOME:
                           lValue = 0;
                           break;
                       case C_KEYS.END:
                           lValue = lOptions.numStars;
                           break;
                       case C_KEYS.DOWN:
                       case lBackwardKey:
                           lValue = Math.round( normalize( lItem$.val() ) ) - lOptions.increment;
                           lValue = normalize( lValue );
                           break;
                       case C_KEYS.UP:
                       case lForwardKey:
                           lValue = Math.round( normalize( lItem$.val() ) ) + lOptions.increment;
                           lValue = normalize( lValue );
                           break;
                       case C_KEYS.DELETE:
                           lValue = "";
                           break;
                   }

                   // Fix Bug Num. 30441644
                   // Only Keys used on switch will update the item value.
                   if ( lValue !== null ) {
                       lItem$
                           .val( normalize( lValue ) )
                           .change();

                       updateDisplay();

                   }
            }
        } )
        .on( "click", function( e ) {
            var lVal,
                lStar$ = $( e.target )
                   .closest( "." + CL_RATING_STAR );

            if ( isEditable() ) {
                lVal = lStar$
                   .parent()
                   .children()
                   .index( lStar$ ) + 1;

                //Fix Bug Num. 30985042 and 
                //Fix Bug Num. 31511165
                if ( lVal === 0 && !lClearButtonClicked ) {
                    return;
                }

                lItem$
                   .val( lVal )
                   .change();

                updateDisplay();

                lItem$.focus();
            }

            if ( lTooltipInitialized ) {
              $( this )
                  .tooltip( 'disable' );
              $( this )
                  .tooltip( 'enable' )
                  .tooltip( 'open' );
            }
        }).hover( function() {
          if ( lTooltipInitialized ) {
            $( this )
                .tooltip( 'enable' )
                .tooltip( 'open' );
          }
        }).mouseleave( function() {
          if ( lTooltipInitialized ) {
            $( this )
                .tooltip( 'disable' );
          }
        });

        updateDisplay();

        item.create(itemId, {
            setValue: function( value ) {
              if ( value === 0 || value === "0" ) {
                cleanValue();
              } else { lItem$.val( normalize( value ) ); }

              updateDisplay();
            },
            getValue: function() {
              var currentValue = 0 ;
              var currentValue = lItem$.val() !== "" ? lItem$.val() : 0;

              return currentValue;
            },
            displayValueFor: function( value ) {
                return render( normalize( value ) );
            },
            isChanged: function() {
                return lInitialValue !== lItem$.val();
            },
            disable: function() {
              lOptions.readOnly = true;
              $( lInputId ).attr("disabled", true);;
              $("#"+itemId+" .a-StarRating-clear" ).remove();
            },
            enable: function() {
               if ( lOptions.showClearButton && lOptions.readOnly ) {
                 lStarRatingElement$.prepend(
                     getClearButton()
                 );
               }
               $( lInputId ).removeAttr("disabled");
                lOptions.readOnly = false;
            },
            show: function() {
               $( "#"+ itemId ).show();
            },
            hide: function() {
              $( "#"+ itemId ).hide();
            },
            reinit: function( value ) {

              // Fix Bug Num. 30441644
              // Avoid clear item value when tabbing in and out of a start rating column in IG.
              lItem$.val( value ).change();

              updateDisplay();
            },
            setFocusTo: function() {
              $( lInputId ).focus();
              lItem$
                 .closest( "." + CL_RATING )
                 .find( "." + CL_RATING_STARS )
                 .addClass( CL_IS_FOCUSED );
              return $( lInputId );
            }

        });
    };
} )( apex.widget, apex.util, apex.item, apex.jQuery );
