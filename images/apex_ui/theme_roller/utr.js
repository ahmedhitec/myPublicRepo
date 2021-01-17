(function ($, lang, storage, debug) {

    function ColorConverter() {
        var self = this;

        var parseIntOrDefault = function (string) {
            var result = parseFloat(string);
            return isNaN(result) ? 0 : result;
        };

        var parseFloatOrDefault = function (string) {
            var result = parseFloat(string);
            return isNaN(result) ? 0 : result;
        };

        /**
         * Parses an hexadecimal string to an rgba object with the alpha value
         * set to 1. Useful when the math requires an alpha value.
         * Default its value to black in case of any error or
         * undefined parameter.
         */
        self.parseHexToRgbaOrDefault = function (hex) {
            hex = hex || "#000000";
            var hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
            return {
                r: hex >> 16,
                g: (hex & 0x00FF00) >> 8,
                b: (hex & 0x0000FF),
                a: 1
            };
        };

        self.parseRGBA = function (string) {
            var rgba = {
                r: 0,
                g: 0,
                b: 0,
                a: 0
            };
            string = string.replace(/\s/g, "");
            string = string.replace("rgba", "");
            string = string.replace("(", "");
            string = string.replace(")", "");
            var values = string.split(",");
            rgba.r = parseIntOrDefault(values[0], 10);
            rgba.g = parseIntOrDefault(values[1], 10);
            rgba.b = parseIntOrDefault(values[2], 10);
            rgba.a = parseFloatOrDefault(values[3]);
            return rgba;
        };
    }

    var colorConverter = new ColorConverter();


    // Done this way an not with debug.message or debug.info to record the name
    // of the VM file loaded into the console so we can access the file easily
    if (debug.getLevel() !== debug.LOG_LEVEL.OFF) {
        console.log('Theme Roller: utr.js file loaded');
    }

    if (!window.apex.utr) {
        throw 'UTR Base Missing!';
    }

    function coalesce() {
        for (var i in arguments) {
            if (arguments[i] !== undefined && arguments[i] !== null) {
                return arguments[i];
            }
        }
        return undefined;
    }

    var self = window.apex.utr,
        // BEGIN FEATURE THEME ROLLER LOGO EDITOR
        C_UTR_TAB_ID_PREFIX = 'utrTab',
        C_MAX_FILESIZE_IN_KB = 500,
        gTabsContainer$,
        gTabs$,
        gThemeStyleTabButtonContainer$,
        gThemeStyleTabButton$,
        gThemeStyleTab$,
        gPreviousSelection,
        gLogoTextPreviousText,
        gLogoFirstLoad = false,
        gLogoPendingChanges = false,
        gLogoTabButtonContainer$,
        gLogoTabButton$,
        gLogoTab$,
        gOriginalLogoLinkElement$,
        gLogoType = '',
        gLogoText = '',
        gLogoImageName = '',
        gOriginalImageSrc = '',
        gHasImage = false,
        gUploadedFilenameExtension = '',
        gUploadedFileB64 = null,
        gUploadedFile,
        // END FEATURE THEME ROLLER LOGO EDITOR
        utrContainer,
        utrContainerBody,
        utrCustomCSS,
        utrCustomCSSWarning,
        utrCustomCSSCodeEditor,
        validControlTypes = [
            "color",
            "number",
            "select"
        ],
        colorTimer = 0,
        colorTimerInterval = null,
        searchTimer = 0,
        searchTimerInterval = null,
        controls,
        modifyVars,
        lessCode,
        selectedStyle,
        styleHasChanged = false,
        currentThemeStylesheets = [],
        modifiedCurrentThemeStyle = false,
        existingStyles,
        resetButton,
        toolbarResetButton,
        toolbarUndoButton,
        toolbarRedoButton,
        currentHoverControl = $(),
        commonOnly,
        history,
        historyEvent = {
            undoRedo: 0,
            size: 0,
            pos: -1
        },
        THEMEROLLER_KEY = "ORA_WWV_apex.builder.themeRoller",
        LOGO_TYPES = {
            NONE: 'NONE',
            TEXT: 'TEXT',
            IMAGE: 'IMAGE',
            IMAGE_AND_TEXT: 'IMAGE_AND_TEXT',
            CUSTOM: 'CUSTOM'
        },
        localStorage = storage.getScopedSessionStorage({ prefix: THEMEROLLER_KEY, useAppId: true }),
        msg = function (m) {
            return lang.getMessage(m);
        },
        STR = {
            THEME_ROLLER: msg("UTR.THEME_ROLLER"),
            COMMON_CONFIRM: msg("UTR.COMMON.CONFIRM"),
            SET_CURRENT_WHEN_READ_ONLY_PROMPT: msg("UTR.COMMON.SET_CURRENT_WHEN_READ_ONLY_PROMPT"),
            SET_AS_CURRENT_THEME_STYLE_SUCCESS: msg("UTR.SET_AS_CURRENT_THEME_STYLE_SUCCESS"),
            SET_AS_CURRENT_THEME_STYLE: msg("UTR.SET_AS_CURRENT_THEME_STYLE"),
            RESET_STYLE: msg("UTR.RESET.STYLE"),
            CURRENT: msg("UTR.CURRENT"),
            SET_AS_CURRENT: msg("UTR.SET_AS_CURRENT"),
            CHANGE_THEME: msg("UTR.CHANGE_THEME"),
            ERROR_SET_AS_CURRENT_FAILED: msg("UTR.ERROR.SET_AS_CURRENT_FAILED"),
            COMMON_WARNING: msg("UTR.COMMON.WARNING"),
            COPY: msg("UTR.COMMON.COPY"),
            COMMON_SUCCESS: msg("UTR.COMMON.SUCCESS"),
            COMMON_YES: msg("UTR.COMMON.YES"),
            COMMON_NO: msg("UTR.COMMON.NO"),
            COMMON_OK: msg("UTR.COMMON.OK"),
            COMMON_CANCEL: msg("UTR.COMMON.CANCEL"),
            COMMON_STYLE_NAME: msg("UTR.COMMON.STYLE_NAME"),
            COMMON_BASE_STYLE: msg("UTR.COMMON.BASE_STYLE"),
            BUTTONS_CLOSE: msg("UTR.BUTTONS.CLOSE"),
            BUTTONS_MINIMIZE: msg("UTR.BUTTONS.MINIMIZE"),
            BUTTONS_CODE_EDITOR: msg("UTR.BUTTONS.CODE_EDITOR"),
            SAVE_AS: msg("UTR.SAVE_AS"),
            SAVE_AS_PROMPT: msg("UTR.SAVE_AS.PROMPT"),
            SAVE_AS_SUCCESS: msg("UTR.SAVE_AS.SUCCESS"),
            SAVE: msg("UTR.SAVE"),
            SAVE_PROMPT: msg("UTR.SAVE.PROMPT"),
            SAVE_SUCCESS: msg("UTR.SAVE.SUCCESS"),
            RESET: msg("UTR.RESET"),
            RESET_PROMPT: msg("UTR.RESET.PROMPT"),
            CUSTOM_CSS: msg("UTR.CUSTOM_CSS"),
            CUSTOM_CSS_DESCRIPTION: msg("UTR.CUSTOM_CSS.DESCRIPTION"),
            CUSTOM_CSS_WARNING: msg("UTR.CUSTOM_CSS.WARNING"),
            CHANGE_PROMPT: msg("UTR.CHANGE.PROMPT"),
            ERROR: msg("UTR.ERROR"),
            ERROR_UNSUPPORTED_STYLE: msg("UTR.ERROR.UNSUPPORTED_STYLE"),
            ERROR_INPUT_NOT_FOUND: msg("UTR.ERROR.INPUT_NOT_FOUND"),
            ERROR_INVALID_STYLE: msg("UTR.ERROR.INVALID_STYLE"),
            ERROR_UNSUPPORTED_THEME: msg("UTR.ERROR.UNSUPPORTED_THEME"),
            ERROR_CREATE_FAILED: msg("UTR.ERROR.CREATE_FAILED"),
            ERROR_UPDATE_FAILED: msg("UTR.ERROR.UPDATE_FAILED"),
            ERROR_LOAD_FAILED: msg("UTR.ERROR.LOAD_FAILED"),
            CONTRAST_VALIDATION_TITLE: msg("UTR.CONTRAST_VALIDATION.TITLE"),
            CONTRAST_VALIDATION_MESSAGE: msg("UTR.CONTRAST_VALIDATION.MESSAGE"),
            CONTRAST_VALIDATION_FAILED: msg("UTR.CONTRAST_VALIDATION.FAILED"),
            CONTRAST_VALIDATION_PASSED: msg("UTR.CONTRAST_VALIDATION.PASSED"),
            CONTRAST_VALIDATION_LARGE_TEXT_NOTICE: msg("UTR.CONTRAST_VALIDATION.LARGE_TEXT_NOTICE"),
            HELP: msg("UTR.HELP"),
            HELP_P1: msg("UTR.HELP.P1"),
            HELP_P2: msg("UTR.HELP.P2"),
            TOOLBAR_BUTTONS_COMMON: msg("UTR.TOOLBAR.BUTTONS.COMMON"),
            TOOLBAR_BUTTONS_ALL: msg("UTR.TOOLBAR.BUTTONS.ALL"),
            SEARCH: msg("UTR.SEARCH"),
            UNDO: msg("UTR.UNDO"),
            REDO: msg("UTR.REDO"),
            CONFIG_OUTPUT: msg("UTR.CONFIG_OUTPUT"),
            CONFIG_OUTPUT_ERROR: msg("UTR.CONFIG_OUTPUT_ERROR"),
            DOWNLOAD: msg("UTR.DOWNLOAD"),
            UPLOAD: msg("UTR.UPLOAD"),
            UPLOAD_CONFIG_FILE: msg("UTR.UPLOAD_CONFIG_FILE"),
            DRAG_AND_DROP: msg("UTR.DRAG_AND_DROP"),
            ONLY_JSON_ALLOWED: msg("UTR.ONLY_JSON_ALLOWED"),
            ENABLE_LESS_COMP: msg("UTR.ENABLE_LESS_COMPILATION"),
            /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
            TABS_THEME_STYLE: msg("UTR.TABS.THEME_STYLE"),
            TABS_LOGO: msg("UTR.TABS.LOGO"),
            LOGO_TYPE: msg("UTR.LOGO.TYPE"),
            LOGO_DEFAULT_IMAGE: msg("UTR.LOGO.IMAGE_DEFAULT_VALUE"),
            LOGO_IMAGE: msg("UTR.LOGO.IMAGE"),
            LOGO_IMAGE_TEXT: msg("UTR.LOGO.IMAGE_TEXT"),
            LOGO_TEXT: msg("UTR.LOGO.TEXT"),
            LOGO_NONE: msg("UTR.LOGO.NONE"),
            LOGO_CUSTOM: msg("UTR.LOGO.CUSTOM"),
            LOGO_CUSTOM_MESSAGE: msg("UTR.LOGO.CUSTOM.MESSAGE"),
            LOGO_UPLOAD_LABEL: msg("UTR.LOGO.UPLOAD_LABEL"),
            LOGO_MAX_FILESIZE_IN_KB: msg("UTR.LOGO.MAX_FILESIZE_IN_KB").replace( '%0', C_MAX_FILESIZE_IN_KB ),
            LOGO_ONLY_IMAGES_ALLOWED: msg("UTR.LOGO.ONLY_IMAGE_FILES"),
            SAVE_LOGO: msg("UTR.LOGO.SAVE_LOGO"),
            LOGO_SET_SUCCESS: msg("UTR.LOGO.SET_LOGO_SUCCESS"),
            LOGO_SET_ERROR: msg("UTR.LOGO.SET_LOGO_ERROR"),
            LOGO_LOAD_ERROR: msg("UTR.LOGO.ERROR_LOAD_FAILED"),
            PENDING_LOGO_CHANGES: msg("UTR.PENDING_LOGO_CHANGES"),
            PENDING_THEME_CHANGES: msg("UTR.PENDING_THEME_CHANGES")
            /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
        };

    var useTranslation = true;
    function translate(_x) {
        return useTranslation ? msg(_x) : _x;
    }

    var showSetCurrentAsForReadOnly = function () {
        // BEGIN FEATURE THEME ROLLER LOGO EDITOR
        // This function is only called to show the read-only themestyle depending on the stylesheet
        gThemeStyleTab$.find(".utr-container__buttons").show().children().last().hide();
        gThemeStyleTab$.find(".utr-container__field--static-message").css("height", 150);
        // END FEATURE THEME ROLLER LOGO EDITOR
    };

    var resetSetCurrentAsForReadOnly = function () {
        // BEGIN FEATURE THEME ROLLER LOGO EDITOR
        // This function is only called to show the read-only themestyle depending on the stylesheet
        gThemeStyleTab$.find(".utr-container__buttons").children().last().show();
        gThemeStyleTab$.find(".utr-container__field--static-message").css("height", "auto");
        // END FEATURE THEME ROLLER LOGO EDITOR
    };

    function setCustomCSSOutput(css) {
        /* BEGIN FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
        // This comes from self which in this case is window.apex.utr which
        // comes from utr_base.css
        if (themeState("USE_CUSTOM_LESS")) {
            less.render(css, function (pError, pOutput) {
                if (pError) {
                    var lErrorMessage = "LESS Compilation Error (" +
                        pError.line + ":" + pError.column + "): " +
                        pError.message;

                    console.warn('Theme Roller:' + lErrorMessage + ". CSS compilation result is not being applied");
                    self.setCustomCSSOutput("");
                } else {
                    self.setCustomCSSOutput(pOutput.css);
                }
            });
        } else {
            self.setCustomCSSOutput(css);
        }
        /* END FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */

        var utrComputedStyle = window.getComputedStyle(utrContainer.parents(".utr.utr--main").get(0));
        var isCustomCSSHidingUtr = utrComputedStyle.getPropertyValue("visibility") !== "visible" || utrContainer.parents(".utr.utr--main").is(":hidden");
        delete (utrComputedStyle);

        if (isCustomCSSHidingUtr) {
            utrCustomCSSWarning = true;
            if (utrCustomCSS) {
                utrCustomCSS.editor$.before(utrCustomCSS.warning);
            }
            if (utrCustomCSSCodeEditor) {
                utrCustomCSSCodeEditor.editor$.before(utrCustomCSSCodeEditor.warning);
            }
            self.destroyCustomCSSOutput();
        } else {
            utrCustomCSSWarning = false;
            if (utrCustomCSS) {
                utrCustomCSS.warning.remove();
            }
            if (utrCustomCSSCodeEditor) {
                utrCustomCSSCodeEditor.warning.remove();
            }
        }

        return !isCustomCSSHidingUtr;
    }

    function getThemeStyles(callback, callback2) {
        $.universalThemeRoller("getThemeStyles", callback, callback2);
    }
    function createThemeStyle(baseStyleId, styleName, config, styleCSS, callback, callback2) {
        $.universalThemeRoller("createThemeStyle", baseStyleId, styleName, config, styleCSS, callback, callback2);
    }
    function updateThemeStyle(styleId, styleName, config, styleCSS, callback, callback2) {
        $.universalThemeRoller("updateThemeStyle", styleId, styleName, config, styleCSS, callback, callback2);
    }
    function setThemeStyleAsCurrent(styleId, styleName, config, styleCSS, callback, callback2) {
        $.universalThemeRoller("setThemeStyleAsCurrent", styleId, styleName, config, styleCSS, callback, callback2);
    }
    function getLogo(callback, callback2) {
        $.universalThemeRoller("getLogo", callback, callback2);
    }
    function setLogo(logoType, logoImageUrl, logoText, customHTML, imageFilename, imageFile, newImage, callback, callback2) {
        $.universalThemeRoller("setLogo", logoType, logoImageUrl, logoText, customHTML, imageFilename, imageFile, newImage, callback, callback2);
    }

    function themeState(value, state, stringify) {
        stringify = typeof stringify === 'undefined' ? true : !!stringify;
        if (typeof state === 'undefined') {
            state = localStorage.getItem(value);
            try {
                return JSON.parse(state);
            } catch (e) {
                return state;
            }
        } else {
            localStorage.setItem(value, stringify ? JSON.stringify(state) : state);
            return state;
        }
    }

    function lessColorVariableChangeHandler(variableName, variableValue, emitter) {
        modifyVars[variableName] = variableValue;
        /* BEGIN FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
        // Made parameter prepareDownload undefined so the download gets
        // prepared by default
        recompile(modifyVars, true, undefined, null, null, emitter);
        /* END FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
        styleHasChanged = true;
        resetButton.toggleClass('utr-container__button--disable', false);
        toolbarResetButton.toggleClass('utr-toolbar-button--disable', false);
        themeState('STYLE_HAS_CHANGED', true);
    }

    function createSelectControl(controlLessVariable, controlAttributes) {
        controlAttributes.reset = typeof controlAttributes.reset === 'undefined' ? true : !!controlAttributes.reset;
        var controlContainer = $(document.createElement("div")).addClass("utr-container__field utr-container__field--var utr-container__field--select");
        var controlId = "utr-" + controlLessVariable.replace("@", "");
        var control = $(document.createElement("select"))
            .attr("id", controlId)
            .addClass('utr-reset');
        var controlLabel = $(document.createElement("label")).attr("for", controlId).text(translate(controlAttributes.name));

        for (var i in controlAttributes.options) {
            control.append(
                $(document.createElement('option'))
                    .attr('value', controlAttributes.options[i].r)
                    .text(controlAttributes.options[i].d)
            );
        }

        control
            .val(self.less.variables[controlLessVariable].value)
            .change(function (eventObject) {
                modifyVars[controlLessVariable] = $(this).val();
                recompile(modifyVars);
                styleHasChanged = true;
                resetButton.toggleClass('utr-container__button--disable', false);
                toolbarResetButton.toggleClass('utr-toolbar-button--disable', false);
                themeState('STYLE_HAS_CHANGED', true);
                controlContainer.find('.utr-container__field--select__container__text').text($('option:selected', control).text());
            })
            .bind("utr-reset", function () {
                delete modifyVars[controlLessVariable];
            })
            .bind("utr-after-compile", function () {
                $(this).val(self.less.variables[controlLessVariable].value);
            });

        controlContainer.append(control).append(controlLabel);

        return controlContainer;
    }

    function rgbaToRgb(color) {
        var result = color;
        if (color !== undefined) {
            result = color.replace(/\s*rgba\(((?:\s*[0-9]{1,3},){2}\s*[0-9]{1,3}),\s*[0-1](?:.[0-9]+)?\)\s*\s*/i, "rgb($1)");
        }
        return result;
    }

    function getPerceivedLuminance(color) {
        var rgbColor = colorConverter.parseHexToRgbaOrDefault(color);

        // The Luminance component (Y) of the YIQ
        return (rgbColor.r * 299 + rgbColor.g * 587 + rgbColor.b * 114) / 1000;
    }

    function createColorSetControl(controlLessVariables) {
        var controlContainer = $(document.createElement("div"))
            .addClass("utr-container__field utr-container__field--var utr-container__field--color-picker utr-reset");
        var controlLabel = $(document.createElement("label")).text(translate(controlLessVariables[0].subgroup));

        function getRelativeLuminance(color) {

            var RGB = colorConverter.parseHexToRgbaOrDefault(color);
            var sRGB = {
                r: RGB.r / 255,
                g: RGB.g / 255,
                b: RGB.b / 255
            };
            RGB = {
                r: (sRGB.r <= 0.03928) ? sRGB.r / 12.92 : Math.pow(((sRGB.r + 0.055) / 1.055), 2.4),
                g: (sRGB.g <= 0.03928) ? sRGB.g / 12.92 : Math.pow(((sRGB.g + 0.055) / 1.055), 2.4),
                b: (sRGB.b <= 0.03928) ? sRGB.b / 12.92 : Math.pow(((sRGB.b + 0.055) / 1.055), 2.4)
            };
            delete (sRGB);

            return 0.2126 * RGB.r + 0.7152 * RGB.g + 0.0722 * RGB.b;
        }

        function getContrastRatio(colorA, colorB) {
            var colorALuminance = getRelativeLuminance(colorA);
            var colorBLuminance = getRelativeLuminance(colorB);

            return (Math.max(colorALuminance, colorBLuminance) + 0.05) / (Math.min(colorALuminance, colorBLuminance) + 0.05);
        }

        function createPicker(controlLessVariable) {
            controlLessVariable.reset = typeof controlLessVariable.reset === 'undefined' ? true : !!controlLessVariable.reset;
            return createColorPicker(controlLessVariable.var, controlLessVariable.reset);
        }

        function createInformationItem(iconName) {
            var control = $(document.createElement("div"))
                .addClass("utr-information-item a-Icon icon-tr-" + iconName);
            return control;
        }

        function createContrastRatioInformationItemRow(contrastRatioInformation, inlineNotice) {
            var row = $(document.createElement("div")).addClass("utr-information-item-row");
            var colorA = $(document.createElement("div")).addClass("utr-color");
            var colorB = colorA.clone().css("background-color", contrastRatioInformation.colorB);
            var showNotice = contrastRatioInformation.contrastRatio >= 3 && contrastRatioInformation.contrastRatio < 4.5;
            colorA.css("background-color", contrastRatioInformation.colorA);

            if (contrastRatioInformation.contrastRatio >= 3) {
                row.append(
                    $(document.createElement("div"))
                        .addClass("utr-information-item-guidelinePassed")
                        .text(contrastRatioInformation.contrastRatio >= 7 ? "AAA" : "AA")
                );
            }

            row.append(
                colorA,
                colorB,
                $(document.createElement("div"))
                    .addClass("utr-information-item-contrastRatio")
                    .text(contrastRatioInformation.contrastRatio),
                $(document.createElement("div"))
                    .addClass("utr-information-item-status")
                    .text(contrastRatioInformation.contrastRatio >= 3 ? STR.CONTRAST_VALIDATION_PASSED + (!!!inlineNotice && showNotice ? "*" : "") : STR.CONTRAST_VALIDATION_FAILED)
            );

            if (!!inlineNotice && showNotice) {
                row.append(
                    $(document.createElement("div")).addClass("utr-information-item-notice").text(STR.CONTRAST_VALIDATION_LARGE_TEXT_NOTICE)
                );
            }

            return row;
        }

        for (var i = 0; i < controlLessVariables.length; i++) {
            controlContainer.append(createPicker(controlLessVariables[i]));
        }

        var controlLessContrastCheckVariables = controlLessVariables.filter(function (d) { return (d.checkContrast === undefined) ? true : d.checkContrast; });
        function testColorContrast() {
            if (controlLessContrastCheckVariables.length >= 2) {
                var contrastRatioInformationElementsHTML = $(document.createElement("div"))
                    .append(
                        $(document.createElement("div"))
                            .addClass("utr-information-item-header")
                            .append(
                                $(document.createElement("div"))
                                    .addClass("utr-information-item-header-icon a-Icon icon-tr-contrast")
                            )
                            .append(
                                $(document.createElement("h3"))
                                    .addClass("utr-information-item-header-title")
                                    .text(STR.CONTRAST_VALIDATION_TITLE)
                            )
                    )
                    .html();

                var currentContrastRatioInformation;
                var utrInformationItemContent = $(document.createElement("div"))
                    .addClass("utr-information-item-content");
                var failedContrastRatioValidation = false;
                var warningContrastRatioValidation = false;

                for (var i = controlLessContrastCheckVariables.length - 1; i >= 0; i--) {
                    for (var j = i - 1; j >= 0; j--) {
                        currentContrastRatioInformation = {
                            colorA: self.less.variables[controlLessContrastCheckVariables[i].var].value,
                            colorB: self.less.variables[controlLessContrastCheckVariables[j].var].value
                        };
                        currentContrastRatioInformation.contrastRatio = Math.floor(getContrastRatio(currentContrastRatioInformation.colorA, currentContrastRatioInformation.colorB) * 100) / 100;
                        failedContrastRatioValidation = failedContrastRatioValidation || currentContrastRatioInformation.contrastRatio < 3;
                        warningContrastRatioValidation = warningContrastRatioValidation || currentContrastRatioInformation.contrastRatio < 4.5;
                        utrInformationItemContent.append(createContrastRatioInformationItemRow(currentContrastRatioInformation, controlLessContrastCheckVariables.length === 2));
                    }
                }

                contrastRatioInformationElementsHTML += $(document.createElement("div")).append(utrInformationItemContent).html() +
                    (
                        controlLessContrastCheckVariables.length > 2 && warningContrastRatioValidation ?
                            $(document.createElement("div"))
                                .append(
                                    $(document.createElement("div"))
                                        .addClass("utr-information-item-footerNotice")
                                        .text("* " + STR.CONTRAST_VALIDATION_LARGE_TEXT_NOTICE)
                                )
                                .html() :
                            ""
                    ) +
                    $(document.createElement("div"))
                        .append(
                            $(document.createElement("div"))
                                .addClass("utr-information-item-footer")
                                .text(STR.CONTRAST_VALIDATION_MESSAGE)
                        )
                        .html();

                return {
                    failed: failedContrastRatioValidation,
                    warning: warningContrastRatioValidation,
                    output: contrastRatioInformationElementsHTML
                };
            }
            return {};
        }

        var informationItem;

        if (controlLessContrastCheckVariables.length >= 2) {
            var contrastTest = testColorContrast();
            informationItem = createInformationItem(contrastTest.failed ? "fail" : (contrastTest.warning ? "warning" : "pass"));
            informationItem.data("color-contrast-information-markup", contrastTest.output);

            controlContainer.append(informationItem);
            controlContainer.tooltip({
                tooltipClass: "utr-information-item-tooltip",
                items: ".utr-information-item",
                content: function () {
                    var element = $(this);

                    if (element.is(".utr-information-item")) {
                        return element.data("color-contrast-information-markup");
                    }
                }
            });
            controlContainer.bind('utr-after-compile', function () {
                contrastTest = testColorContrast();
                informationItem.removeClass("icon-tr-fail icon-tr-warning icon-tr-pass");
                informationItem.addClass("icon-tr-" + (contrastTest.failed ? "fail" : (contrastTest.warning ? "warning" : "pass")));
                informationItem.data("color-contrast-information-markup", contrastTest.output);
            });
        }

        controlContainer.append(controlLabel);

        return controlContainer;
    }
    var currentColorPickerVariable;
    function createColorPicker(controlLessVariable) {
        var controlId = "utr-" + controlLessVariable.replace("@", "");
        var control = $(document.createElement("div")).attr("id", controlId).addClass("utr-color-picker utr-reset");
        var color = self.less.variables[controlLessVariable].value;
        if (!color) {
            color = "#000000";
        }
        var timeOut = 0;
        control
            .attr("title", self.less.variables[controlLessVariable].subgroup ? translate(self.less.variables[controlLessVariable].name) : null)
            .css({
                "background-color": color,
                color: getPerceivedLuminance(color) >= 128 ? "black" : "white"
            })
            .hover(function (e) {
                control.toggleClass('utr-color-picker--reset a-Icon icon-tr-reset', isAltPressed);
                currentHoverControl = control;
            }, function (e) {
                control.removeClass('utr-color-picker--reset a-Icon icon-tr-reset');
                currentHoverControl = $();
            }).on("click", function (e) {
                if (isAltPressed) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    control.trigger('utr-reset');
                    modifyVars = $.extend({}, (selectedStyle.config || {}).vars, modifyVars);
                    recompile(modifyVars);
                    themeState('VARS', modifyVars);
                    return false;
                }
                currentColorPickerVariable = controlLessVariable;

            })
            .UTRColorPicker({
                eventName: "click",
                color: color,
                alphaSupport: true,
                onShow: function (el) {
                    var colorPicker = $(el);
                    colorPicker.css("z-index", 1000);
                    control.UTRColorPickerSetColor(self.less.variables[controlLessVariable].value);
                },
                onChange: function (hsb, hex, rgb, el, options) {
                    $("body").addClass("waiting");
                    var lessColorValue = "rgba(red, green, blue, alpha)";
                    lessColorValue = lessColorValue.replace("red", rgb.r);
                    lessColorValue = lessColorValue.replace("green", rgb.g);
                    lessColorValue = lessColorValue.replace("blue", rgb.b);
                    lessColorValue = lessColorValue.replace("alpha", rgb.a);
                    control.css({
                        "background-color": lessColorValue,
                        color: getPerceivedLuminance(hex) >= 128 ? "black" : "white"
                    });
                    lessColorVariableChangeHandler(controlLessVariable, lessColorValue);
                },
                onHide: function () {
                    control.UTRColorPickerSetColor(self.less.variables[controlLessVariable].value);
                }
            })
            .UTRColorPickerSetColor(color)
            .bind("utr-reset", function () {
                delete modifyVars[controlLessVariable];
            })

            /**
             * the "utr-after-compile" event is triggered after
             * the recompile function is executed.
             */
            .bind("utr-after-compile", function (event, emitter) {
                $("body").removeClass("waiting");
                $(this)
                    .css({
                        "background-color": self.less.variables[controlLessVariable].value,
                        color: getPerceivedLuminance(self.less.variables[controlLessVariable].value) >= 128 ? "black" : "white"
                    });
            });
        return control;
    }

    function createColorControl(controlLessVariable, controlAttributes) {
        controlAttributes.reset = typeof controlAttributes.reset === 'undefined' ? true : !!controlAttributes.reset;
        var controlContainer = $(document.createElement("div")).addClass("utr-container__field utr-container__field--var utr-container__field--color-picker");
        var control = createColorPicker(controlLessVariable, controlAttributes.reset);
        var controlLabel = $(document.createElement("label")).attr("for", control.attr('id')).text(translate(controlAttributes.name));

        controlContainer.append(control).append(controlLabel);

        return controlContainer;
    }

    function createSliderControl(controlLessVariable, controlAttributes) {
        controlAttributes.reset = typeof controlAttributes.reset === 'undefined' ? true : !!controlAttributes.reset;
        var controlContainer = $(document.createElement("div")).addClass("utr-container__field utr-container__field--var utr-container__field--slider");
        var controlId = "utr-" + controlLessVariable.replace("@", "");
        var controlText = $(document.createElement("div")).addClass("utr-slider__text").text(self.less.variables[controlLessVariable].value);
        var control = $(document.createElement("div")).attr("id", controlId).addClass("utr-slider utr-reset");
        var controlLabel = $(document.createElement("label")).attr("for", controlId).text(translate(controlAttributes.name));

        control.slider({
            value: parseFloat(self.less.variables[controlLessVariable].value),
            min: controlAttributes.range.min,
            max: controlAttributes.range.max,
            step: controlAttributes.range.increment,
            change: function (event, ui) {
                controlText.text(modifyVars[controlLessVariable]);
                if (event.hasOwnProperty('originalEvent')) {
                    modifyVars[controlLessVariable] = ui.value + (controlAttributes.units || "");
                    recompile(modifyVars);
                    styleHasChanged = true;
                    resetButton.toggleClass('utr-container__button--disable', false);
                    toolbarResetButton.toggleClass('utr-toolbar-button--disable', false);
                    themeState('STYLE_HAS_CHANGED', true);
                }
            },
            slide: function (event, ui) {
                controlText.text(ui.value + (controlAttributes.units || ""));
            }
        })
            .bind("utr-reset", function () {
                delete modifyVars[controlLessVariable];
            }).bind("utr-after-compile", function () {
                $(this).slider("value", parseFloat(self.less.variables[controlLessVariable].value));
                controlText.text(self.less.variables[controlLessVariable].value);
            });

        controlContainer.append(controlText).append(control).append(controlLabel);

        return controlContainer;
    }

    function createControlGroup(groupName, groupElements, groupHiddenVars) {
        var groupHeader = $(document.createElement("h3"))
            .addClass("utr-group__header")
            .append(
                $(document.createElement("div"))
                    .addClass("utr-group__header-text")
                    .text(translate(groupName))
            )
            .append(
                $(document.createElement("div"))
                    .addClass("utr-group__header-buttons")
                    .append(
                        $(document.createElement("a"))
                            .attr({
                                href: "#",
                                alt: STR.GROUP_RESET,
                                title: STR.GROUP_RESET
                            })
                            .addClass("utr-group-header-button")
                            .append(
                                $(document.createElement("span"))
                                    .addClass("utr-group-header-button__icon a-Icon icon-tr-reset")
                            ).click(function (eventObject) {
                                eventObject.preventDefault();
                                eventObject.stopPropagation();
                                $(".utr-reset", groupControlsContainer).trigger("utr-reset");
                                modifyVars = $.extend({}, (selectedStyle.config || {}).vars, modifyVars);
                                recompile(modifyVars);
                                themeState('VARS', modifyVars);
                                return false;
                            })
                    )
            );

        var groupControlsContainer = $(document.createElement("div"))
            .append(groupElements);

        if (groupHiddenVars && groupHiddenVars.length > 1) {
            groupControlsContainer.append(
                $(document.createElement("input"))
                    .attr('type', 'hidden')
                    .addClass('utr-reset')
                    .bind('utr-reset', function () {
                        for (var i = 0; i < groupHiddenVars.length; i++) {
                            delete modifyVars[groupHiddenVars[i]];
                        }
                    })
            );
        }

        return groupHeader.add(groupControlsContainer);
    }

    function getOutputCSS() {
        var output =
            '/* \n' +
            ' * ' + getThemeName() + '\n' +
            ' *    (Oracle Application Express Theme Style)\n' +
            ' * \n' +
            ' * This CSS file was generated using the Oracle Application Express 5.0 Theme Roller. \n' +
            ' * \n' +
            ' */' +
            getLessOutput();

        if (utrCustomCSS.editor$ && utrCustomCSS.editor$.codeEditor("getValue").length > 0) {
            output += '\n\n/* \n * Oracle Application Express 5.0 Theme Roller Custom CSS \n *\n */\n\n' + utrCustomCSS.editor$.codeEditor("getValue");
        }

        output = output.replace(/(\n\n+)/g, '\n\n');

        return output;
    }

    function getCustomCSSOutput() {
        return $('style[id="utr_custom-css-output"]').html();
    }
    function getLessOutput() {
        return $('style[id="utr_less-output"]').html();
    }
    function toggleNested(node, opened) {
        for (var i = node.children.length - 1; i >= 0; i--) {
            node.children[i].opened = opened;
            toggleNested(node.children[i], opened);
        }
    }

    function getThemeName() {
        return selectedStyle.name;
    }

    function getCSSFileName() {
        return 'theme-' + ($('#utr_theme_name').val() || 'Custom Style').replace(/[^a-z0-9_]/gi, '_').toLowerCase() + '.css';
    }

    function getCSSFileURI() {
        return URL.createObjectURL(new Blob([getOutputCSS()], { type: "text/css" }));
    }

    /* BEGIN FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
    /**
     * Gets the configuration file name based in the theme name
     *
     * @return     {String}  The configuration file name.
     */
    function getConfigurationFileName() {
        return getThemeName().replace(/[^a-z0-9_]/gi, '_').toLowerCase() + '.apex_theme_roller.json';
    }
    /**
     * Gets a data URI containing the Theme Roller's JSON configuration object
     *
     * @return     {String}  The configuration file in data URI format
     */
    function getConfigurationFileURI() {
        return URL.createObjectURL(new Blob([JSON.stringify(getConfigurationObject(), null, 4)], { type: "application/json" }));
    }
    /* END FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */

    function setHistoryDelta(vars) {
        if (historyEvent["undoRedo"] === 1) {
            if (historyEvent["pos"] > 0) {
                historyEvent["pos"]--;
            }
            if (historyEvent["size"] === 1) {
                return vars;
            }
            historyEvent["undoRedo"] = 0;
            return buildHistoryState();
        } else if (historyEvent["undoRedo"] === -1) {
            if (historyEvent["pos"] < (historyEvent["size"] - 1)) {
                historyEvent["pos"]++;
            }
            if (historyEvent["size"] === 1) {
                return vars;
            }
            historyEvent["undoRedo"] = 0;
            return buildHistoryState();
        }
        if ((historyEvent["pos"] + 1) !== historyEvent["size"]) {
            history["add"].splice(historyEvent["pos"] + 1, historyEvent["size"] - historyEvent["pos"] - 1);
            history["rem"].splice(historyEvent["pos"] + 1, historyEvent["size"] - historyEvent["pos"] - 1);
            historyEvent["size"] = historyEvent["pos"] + 1;
        }
        if (typeof history === "undefined") {
            history = { add: [], rem: [] };
            if (Object.getOwnPropertyNames(vars).length !== 0) {
                historyEvent["pos"]++;
                historyEvent["size"]++;
                var varsCopy = {};
                for (key in vars) {
                    varsCopy[key] = vars[key];
                }
                history["add"].push(varsCopy);
                history["rem"].push({});
            } else {
                historyEvent["pos"]++;
                historyEvent["size"]++;
                history["add"].push({});
                history["rem"].push({});
            }
        } else {
            var hlenght = history["add"].length;
            if (hlenght >= 5) {
                mergeOldHistory();
            }
            var pState = buildPreviousState();
            var diff = removeExisting(vars, pState);
            if (Object.getOwnPropertyNames(diff[0]).length === 0) {
                if (hlenght >= 1) {
                    var remHistory = diff[1];
                    if (Object.getOwnPropertyNames(remHistory).length !== 0) {
                        historyEvent["pos"]++;
                        historyEvent["size"]++;
                        history["add"].push(diff[0]);
                        history["rem"].push(diff[1]);
                    }
                }
            } else {
                historyEvent["pos"]++;
                historyEvent["size"]++;
                history["add"].push(diff[0]);
                history["rem"].push(diff[1]);
            }
        }
        return vars;
    }

    function mergeOldHistory() {
        var last = history["add"][0];
        var secondToLast = history["add"][1];
        for (var key in last) {
            if (!secondToLast.hasOwnProperty(key)) {
                secondToLast[key] = last[key];
            }
        }
        history["add"][1] = secondToLast;
        history["add"].splice(0, 1);

        var dlast = history["rem"][0];
        var dsecondToLast = history["rem"][1];
        for (var key in dlast) {
            if (!dsecondToLast.hasOwnProperty(key)) {
                dsecondToLast[key] = last[key];
            }
        }
        historyEvent["pos"]--;
        historyEvent["size"]--;
        history["rem"][1] = dsecondToLast;
        history["rem"].splice(0, 1);
    }

    function buildHistoryState() {
        if (historyEvent["pos"] === 0) {
            return history["add"][0];
        }
        var pos = historyEvent["pos"];
        var result = {};
        for (var i = 0; i <= pos; i++) {
            var cHistory = history["add"][i];
            var dHistory = history["rem"][i];
            for (var key in dHistory) {
                delete result[key];
            }
            for (var key in cHistory) {
                result[key] = cHistory[key];
            }
        }
        return result;
    }

    function buildPreviousState() {
        var hlenght = history["add"].length;
        var pState = {};
        for (var i = 0; i < hlenght; i++) {
            var cHistory = history["add"][i];
            var dHistory = history["rem"][i];
            for (var key in dHistory) {
                delete pState[key];
            }
            for (var key in cHistory) {
                pState[key] = cHistory[key];
            }

        }
        return pState;
    }
    function removeExisting(vars, historyObj) {
        var diff = [{}, {}];
        for (var key in vars) {
            if (typeof historyObj[key] === "undefined") {
                diff[0][key] = vars[key];
            } else {
                if (historyObj[key] !== vars[key]) {
                    diff[0][key] = vars[key];
                }
            }
        }
        for (var key in historyObj) {
            if (!vars.hasOwnProperty(key)) {
                diff[1][key] = historyObj[key];
            }
        }
        return diff;
    }

    function recompile(vars, saveState, prepareDownload, callback, callback2, emitter) {
        vars = vars || modifyVars;

        vars = setHistoryDelta(vars);

        saveState = typeof saveState === 'undefined' ? true : !!saveState;
        saveState && themeState('VARS', vars);

        prepareDownload = typeof prepareDownload === "undefined" ? true : !!prepareDownload;

        self.less.compile(lessCode, vars, function (css) {
            // Inject CSS code
            isOpenAndValid = true;
            useTranslation = self.less.translate;
            self.setLessOutput(css);
            callback && callback(css);
            $(".utr-reset").trigger("utr-after-compile", (emitter ? [emitter] : undefined));
            /* BEGIN FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
            if (prepareDownload) {
                prepareDownloadButtons();
            }
            /* END FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
        }, callback2);
    }

    function prepareDownloadButtons() {
        $('.utr-container__button--download').attr({
            /* BEGIN FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
            download: getConfigurationFileName(),
            href: getConfigurationFileURI()
            /* END FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
        });
    }

    // BEGIN FEATURE THEME ROLLER LOGO EDITOR
    function getLogoLinkElement() {
        return $('.t-Header-logo-link');
    }
    function restoreLogo(pEvent) {
        gOriginalImageSrc = '';
        if (gUploadedFileB64 !== null) {
            gUploadedFileB64 = null;
        }
        if (gOriginalLogoLinkElement$ !== undefined) {
            getLogoLinkElement()
                .replaceWith(gOriginalLogoLinkElement$.clone());
        }
    }
    function getLogoImageElement() {
        return getLogoLinkElement()
            .children('img')
            .eq(0);
    }
    function getLogoTextElement() {
        return getLogoLinkElement()
            .children('span')
            .eq(0);
    }
    function getLogoElements() {
        return getLogoImageElement()
            .add(getLogoTextElement());
    }
    function getLogoElement() {
        var lLogoImageElement$ = getLogoImageElement(),
            lLogoSpanElement$ = getLogoTextElement();

        return (lLogoImageElement$.length > 0 ? lLogoImageElement$ : (lLogoSpanElement$.length > 0 ? lLogoSpanElement$ : undefined));
    }
    // END FEATURE THEME ROLLER LOGO EDITOR

    function closeUTR(event, ui) {
        self.opened = false;
        themeState('OPENED', false);
        if (modifiedCurrentThemeStyle) {
            location.reload(true);
        }
        $('.utr-color-picker').each(function () {
            $('#' + $(this).data('colorpickerId')).remove();
        });
        $('.utr-container').dialog('destroy').remove();
        $(window).off('.utr-positioning');
        restoreLogo();
        self.removeStylesheets();
        self.enableCurrentStylesheets(currentThemeStylesheets);
        self.destroyCustomCSSOutput();
        self.destroyLessOutput();
        unbindKeyHandlers();
        toggleNested(self, false);
        isOpenAndValid = false;
    }

    function getStyle(id) {
        for (var i = existingStyles.length - 1; i >= 0; i--) {
            if (existingStyles[i].id === id) return existingStyles[i];
        }
    }

    var isAltPressed = false;
    function keyupHandler(e) {
        if (e.which === 18) {
            isAltPressed = false;
            currentHoverControl.removeClass('utr-color-picker--reset a-Icon icon-tr-reset');
            $(document).off('keyup', keyupHandler);
            $(document).on('keydown', keydownHandler);
        }
    }
    function keydownHandler(e) {
        if (e.which === 18) {
            isAltPressed = true;
            currentHoverControl.addClass('utr-color-picker--reset a-Icon icon-tr-reset');
            $(document).on('keyup', keyupHandler);
            $(document).off('keydown', keydownHandler);
        }

        var evtobj = window.event ? window.event : e;
        if (evtobj.keyCode === 90 && evtobj.ctrlKey) {
            historyEvent["undoRedo"] = 1;
            recompile();
        }
        if (evtobj.keyCode === 89 && evtobj.ctrlKey) {
            historyEvent["undoRedo"] = -1;
            recompile();
        }
    }
    function bindKeyHandlers() {
        $(document).on('keydown', keydownHandler);
    }
    function unbindKeyHandlers() {
        $(document).off('keyup', keyupHandler);
        $(document).off('keydown', keydownHandler);
    }

    function getNameFromStyle(style) {
        var name = style.name + (isRollable(style) ? '' : ' *');
        if (style.isCurrent) {
            name += " (" + STR.CURRENT + ")";
        }
        return name;
    }

    function modalAlert(title, message, elements) {
        return function () {

            var utrConfirm = $(document.createElement("div")).addClass("utr-container").attr("title", title);
            var utrConfirmBody = $(document.createElement("div"))
                .addClass("utr-container__body")
                .text(message);

            if (elements) {
                utrConfirmBody.append(elements);
            }
            utrConfirm.append(utrConfirmBody);
            $('body').append(utrConfirm);
            utrConfirm.dialog({
                dialogClass: "utr",
                modal: true,
                resizable: false,
                position: {
                    my: "center center",
                    at: "center center",
                    of: $(window)
                },
                create: function (event) { $(event.target).dialog("widget").css({ "position": "fixed" }); },
                buttons: {
                    "OK": function () {
                        utrConfirm.dialog('close');
                    }
                },
                close: function (event, ui) {
                    $(this).dialog('destroy').remove();
                }
            });

        };
    }
    function displayHelp(e) {
        var elements = $();
        elements = elements.add(
            $(document.createElement('p')).text(STR.HELP_P1)
        );
        elements = elements.add(
            $(document.createElement('p')).text(STR.HELP_P2)
        );
        modalAlert(STR.HELP, null, elements)();
        e.preventDefault();
        return false;
    }

    function resetUTR(e) {
        utrCustomCSS.control.trigger('utr-reset');
        modifyVars = $.extend({}, (selectedStyle.config || {}).vars);
        recompile(modifyVars);
        themeState('VARS', modifyVars);
        themeState('META', {});
        styleHasChanged = false;
        resetButton.toggleClass('utr-container__button--disable', true);
        toolbarResetButton.toggleClass('utr-toolbar-button--disable', true);
        themeState('STYLE_HAS_CHANGED', false);

        if (e && e.preventDefault) {
            e.preventDefault();
        }
        return false;
    }

    function renderButtons(utrBaseStyleControl) {
        var save = function (onSuccess, onError) {
            var customCSS = utrCustomCSS.editor$.codeEditor("getValue");
            updateThemeStyle(selectedStyle.id, getThemeName(), { customCSS: customCSS, vars: modifyVars }, getOutputCSS(), function () {
                if (selectedStyle.isCurrent) {
                    modifiedCurrentThemeStyle = true;
                }
                !selectedStyle.config && (selectedStyle.config = {});
                selectedStyle.config.vars = $.extend({}, modifyVars);
                selectedStyle.config.customCSS = customCSS;
                selectedStyle.name = getThemeName();
                $('option', utrBaseStyleControl)
                    .filter(function () {
                        return $(this).attr('value') === selectedStyle.id;
                    }).text(getNameFromStyle(selectedStyle));
                utrBaseStyleControl.next(".utr-container__field--select__container__text").text(getNameFromStyle(selectedStyle));
                styleHasChanged = false;
                resetButton.toggleClass('utr-container__button--disable', true);
                toolbarResetButton.toggleClass('utr-toolbar-button--disable', true);
                onSuccess();
            }, function (data) {
                modalAlert(STR.ERROR, STR.ERROR_CREATE_FAILED + '. \n\n' + data.responseJSON.error)();
                if (onError) onError();
            });
        };
        var utrAnchorContainer = $(document.createElement("div"))
            .addClass('utr-container__buttons utr-container__buttons--fixed');
        var utrAnchorReset = resetButton = $(document.createElement("a"))
            .addClass('utr-container__button')
            .toggleClass('utr-container__button--disable', !styleHasChanged)
            .attr('href', '#')
            .text(STR.RESET)
            .click(resetUTR)
            .css("display", "none");
        var setAsCurrent$ = $(document.createElement("a"))
            .addClass('utr-container__button')
            .toggleClass('utr-container__button--disable', selectedStyle.isCurrent)
            .css("float", "left")
            .attr('href', '#')
            .text(STR.SET_AS_CURRENT)
            .click(function (e) {
                if (selectedStyle.isCurrent) return;
                var saveThemeAndSetAsCurrent = function () {
                    var spinner$ = apex.util.showSpinner();
                    var setCurrent = function () {
                        setThemeStyleAsCurrent(selectedStyle.id, function () {
                            modalAlert(STR.COMMON_SUCCESS, STR.SET_AS_CURRENT_THEME_STYLE_SUCCESS)();
                            setAsCurrent$.addClass('utr-container__button--disable');
                            for (var i = existingStyles.length - 1; i >= 0; i--) {
                                existingStyles[i].isCurrent = false;
                            }
                            selectedStyle.isCurrent = true;
                            modifiedCurrentThemeStyle = true;
                            $('option', utrBaseStyleControl).each(function () {
                                var id = $(this).attr('value');
                                $(this).text(getNameFromStyle(getStyle(id)));
                            });
                            utrBaseStyleControl.next(".utr-container__field--select__container__text").text(getNameFromStyle(selectedStyle));
                            spinner$.remove();
                        }, function (data) {
                            spinner$.remove();
                            modalAlert(STR.ERROR, STR.ERROR_SET_AS_CURRENT_FAILED + '. \n\n' + data.responseJSON.error)();
                        });
                    };
                    if (selectedStyle.isReadOnly) {
                        setCurrent();
                    } else {
                        save(setCurrent, function () {
                            spinner$.remove();
                        });
                    }
                };
                if (selectedStyle.isReadOnly && styleHasChanged) {
                    var utrConfirm = $(document.createElement("div")).addClass("utr-container").attr("title", STR.COMMON_WARNING);
                    var utrConfirmBody = $(document.createElement("div"))
                        .addClass("utr-container__body")
                        .text(STR.SET_CURRENT_WHEN_READ_ONLY_PROMPT);
                    utrConfirm.append(utrConfirmBody);
                    $('body').append(utrConfirm);
                    var buttons = {};
                    buttons[STR.SET_AS_CURRENT_THEME_STYLE] = function () {
                        utrConfirm.dialog('close');
                        setTimeout(function () {
                            resetUTR();
                        }, 10);
                        saveThemeAndSetAsCurrent();
                    };
                    buttons[STR.COMMON_CANCEL] = function () {
                        utrConfirm.dialog('close');
                    };
                    utrConfirm.dialog({
                        dialogClass: "utr",
                        modal: true,
                        resizable: false,
                        position: {
                            my: "center center",
                            at: "center center",
                            of: $(window)
                        },
                        create: function (event) { $(event.target).dialog("widget").css({ "position": "fixed" }); },
                        buttons: buttons,
                        close: function (event, ui) {
                            $(this).dialog('destroy').remove();
                        }
                    });
                } else {
                    saveThemeAndSetAsCurrent();
                }
                if (e) {
                    e.preventDefault();
                }
                return false;
            });

        var utrAnchorSaveAs = $(document.createElement("a"))
            .addClass('utr-container__button')
            .attr('href', '#')
            .text(STR.SAVE_AS)
            .click(function (e) {
                var utrThemeNameContainer = $(document.createElement("div"))
                    .addClass('utr-container__field utr-container__field--text-field');
                var utrThemeNameLabel = $(document.createElement("label"))
                    .attr('for', 'utr_theme_name')
                    .text(STR.COMMON_STYLE_NAME);
                var utrThemeNameControl = $(document.createElement("input"))
                    .attr({
                        id: 'utr_theme_name',
                        type: 'text',
                        maxlength: 30
                    })
                    .val(getThemeName() + " (" + STR.COPY + ")");

                var utrConfirm = $(document.createElement("div")).addClass("utr-container").attr("title", STR.SAVE_AS);
                var utrConfirmBody = $(document.createElement("div"))
                    .addClass("utr-container__body")
                    .text(STR.SAVE_AS_PROMPT)
                    .append(
                        utrThemeNameContainer
                            .append(utrThemeNameControl)
                            .append(utrThemeNameLabel)
                            .addClass("utr-container__field--ungrouped")
                    );
                utrConfirm.append(utrConfirmBody);
                $('body').append(utrConfirm);
                var customCSS = utrCustomCSS.editor$.codeEditor("getValue");
                var btns = {};
                btns[STR.COMMON_CANCEL] = function () {
                    $(this).dialog('destroy').remove();
                };
                btns[STR.SAVE] = function () {
                    createThemeStyle(selectedStyle.id, utrThemeNameControl.val(), { customCSS: customCSS, vars: modifyVars }, getOutputCSS(), function (style) {
                        var newStyleId = style.id;
                        utrConfirm.dialog('close');
                        modalAlert(STR.COMMON_SUCCESS, STR.SAVE_AS_SUCCESS)();
                        getThemeStyles(function (pData) {
                            existingStyles = pData;
                            selectedStyle = getStyle(newStyleId);
                            var updatedUtrAnchorContainer = renderButtons(utrBaseStyleControl);
                            $(  '#' + C_UTR_TAB_ID_PREFIX + 'ThemeStyle' + ' .utr-container__buttons' ).replaceWith(updatedUtrAnchorContainer);

                            utrBaseStyleControl
                                .append(
                                    $(document.createElement('option'))
                                        .attr('value', selectedStyle.id)
                                        .text(getNameFromStyle(selectedStyle))
                                )
                                .val(selectedStyle.id);
                            utrBaseStyleControl.next(".utr-container__field--select__container__text").text($('option:selected', utrBaseStyleControl).text());
                            themeState("BASE_STYLE_ID", selectedStyle.id);
                        });
                        styleHasChanged = false;
                        resetButton.toggleClass('utr-container__button--disable', true);
                        toolbarResetButton.toggleClass('utr-toolbar-button--disable', true);
                        themeState('STYLE_HAS_CHANGED', false);
                    }, function (data) {
                        utrConfirm.dialog('close');
                    });
                };

                utrConfirm.dialog({
                    dialogClass: "utr",
                    modal: true,
                    resizable: false,
                    position: {
                        my: "center center",
                        at: "center center",
                        of: $(window)
                    },
                    create: function (event) { $(event.target).dialog("widget").css({ "position": "fixed" }); },
                    buttons: btns,
                    close: function (event, ui) {
                        $(this).dialog('destroy').remove();
                    }
                });

                e.preventDefault();
            });

        /* BEGIN FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
        function loadConfigurationFile(lFile) {
            var lFileReader;

            if (lFile) {
                lFileReader = new FileReader();
                lFileReader.onloadend = function () {
                    config(JSON.parse(lFileReader.result));
                };
                lFileReader.readAsText(lFile);
            }
        }
        // The download button
        var utrAnchorDownload = $(document.createElement("a"))
            .addClass('utr-container__button utr-container__button--download')
            .attr('href', '#')
            .text(STR.DOWNLOAD);
        /* END FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
        /* BEGIN FEATURE #THEME_ROLLER_0003_003 UPLOAD BUTTON */
        var utrAnchorUpload = $(document.createElement("a"))
            .addClass('utr-container__button utr-container__button--upload')
            .attr('href', '#')
            .text(STR.UPLOAD)
            .click(function (pEvent) {
                var lUploadFileDialog$ = $(document.createElement("div"))
                    .addClass("utr-container")
                    .attr("title", STR.UPLOAD_CONFIG_FILE),
                    lUploadFileDialogBody$ = $(document.createElement("div"))
                        .addClass("utr-container__body")
                        .appendTo(lUploadFileDialog$),
                    lUploadFileControlContainer$ = $(document.createElement("div"))
                        .addClass("utr-container__field utr-container__field--dropzone")
                        .appendTo(lUploadFileDialogBody$),
                    lUploadFileControl$ = $(document.createElement("input"))
                        .attr({
                            id: "utrConfigurationFile",
                            type: "file",
                            accept: "application/json"
                        })
                        .on("change", function (pEvent) {
                            loadConfigurationFile(this.files[0]);
                        })
                        .appendTo(lUploadFileControlContainer$),
                    lUploadFileControlLabel$ = $(document.createElement("label"))
                        .attr("for", "utrConfigurationFile")
                        .append(
                            $(document.createElement("span"))
                                .text(STR.DRAG_AND_DROP)
                        )
                        .on("click", function (pEvent) {
                            pEvent.preventDefault();
                            pEvent.stopPropagation();

                            lUploadFileControl$.click();
                        })
                        .on('dragenter', function (pEvent) {
                            lUploadFileControlContainer$
                                .addClass('utr-container__field--dropzone-active');
                        })
                        .on('dragleave drop', function (pEvent) {
                            lUploadFileControlContainer$
                                .removeClass('utr-container__field--dropzone-active');
                        })
                        .on('drop', function (pEvent) {
                            var lFiles = pEvent.originalEvent.dataTransfer.files,
                                lFile;

                            if (lFiles.length > 0) {
                                lFile = lFiles[0];
                                if (lFile.type === "application/json") {
                                    loadConfigurationFile(lFile);
                                } else {
                                    alert(STR.ONLY_JSON_ALLOWED);
                                }
                            }
                        })
                        .appendTo(lUploadFileControlContainer$);

                lUploadFileDialog$.dialog({
                    dialogClass: "utr",
                    modal: true,
                    resizable: false,
                    position: {
                        my: "center center",
                        at: "center center",
                        of: $(window)
                    },
                    create: function (pEvent) {
                        $(pEvent.target)
                            .dialog("widget")
                            .css({
                                "position": "fixed"
                            });
                    },
                    buttons: {
                        "OK": function () {
                            $(this)
                                .dialog("destroy")
                                .remove();
                        }
                    },
                    close: function (event, ui) {
                        $(this)
                            .dialog("destroy")
                            .remove();
                    }
                });

                pEvent.preventDefault();
            });
        /* END FEATURE #THEME_ROLLER_0003_003 UPLOAD BUTTON */

        if (!selectedStyle.isReadOnly) {
            var utrAnchorSave = $(document.createElement("a"))
                .addClass('utr-container__button')
                .attr('href', '#')
                .text(STR.SAVE)
                .click(function (e) {
                    var utrThemeNameContainer = $(document.createElement("div"))
                        .addClass('utr-container__field utr-container__field--text-field');
                    var utrThemeNameLabel = $(document.createElement("label"))
                        .attr('for', 'utr_theme_name')
                        .text(STR.COMMON_STYLE_NAME);
                    var utrThemeNameControl = $(document.createElement("input"))
                        .attr({
                            id: 'utr_theme_name',
                            type: 'text',
                            maxlength: 30
                        })
                        .val(getThemeName());

                    var utrConfirm = $(document.createElement("div")).addClass("utr-container").attr("title", STR.SAVE);
                    var utrConfirmBody = $(document.createElement("div"))
                        .addClass("utr-container__body")
                        .text(STR.SAVE_PROMPT)
                        .append(
                            utrThemeNameContainer
                                .append(utrThemeNameControl)
                                .append(utrThemeNameLabel)
                                .addClass('utr-container__field--ungrouped')
                        );
                    utrConfirm.append(utrConfirmBody);
                    $('body').append(utrConfirm);
                    var btns = {};
                    btns[STR.COMMON_CANCEL] = function () {
                        $(this).dialog('destroy').remove();
                    };
                    btns[STR.SAVE] = function () {
                        save(function () {
                            utrConfirm.dialog('close');
                            modalAlert(STR.COMMON_SUCCESS, STR.SAVE_SUCCESS)();
                        }, function (data) {
                            utrConfirm.dialog('close');
                        });
                    };

                    utrConfirm.dialog({
                        dialogClass: "utr",
                        modal: true,
                        resizable: false,
                        position: {
                            my: "center center",
                            at: "center center",
                            of: $(window)
                        },
                        create: function (event) { $(event.target).dialog("widget").css({ "position": "fixed" }); },
                        buttons: btns,
                        close: function (event, ui) {
                            $(this).dialog('destroy').remove();
                        }
                    });

                    e.preventDefault();
                });
            utrAnchorContainer
                .append(utrAnchorReset)
                .append(setAsCurrent$)
                /* BEGIN FEATURE #THEME_ROLLER_0003_003 UPLOAD BUTTON */
                //.append(utrAnchorUpload)
                /* END FEATURE #THEME_ROLLER_0003_003 UPLOAD BUTTON */
                /* BEGIN FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
                // Insert the download button in the UI
                //. append(utrAnchorDownload)
                /* END FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
                .append(utrAnchorSave)
                .append(utrAnchorSaveAs);
        } else {
            utrAnchorContainer
                .append(utrAnchorReset)
                .append(setAsCurrent$)
                /* BEGIN FEATURE #THEME_ROLLER_0003_003 UPLOAD BUTTON */
                //.append(utrAnchorUpload)
                /* END FEATURE #THEME_ROLLER_0003_003 UPLOAD BUTTON */
                /* BEGIN FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
                // Insert the download button in the UI
                //.append(utrAnchorDownload)
                /* END FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
                .append(utrAnchorSaveAs);
        }
        return utrAnchorContainer;
    }

    // Raw search match function
    // For optimization purposes the searchText must be uppered if the search is
    // insensitive (preventing multiple upperCasing of the same text)
    function match(name, searchText, insensitive) {
        insensitive = typeof insensitive === 'undefined' ? true : !!insensitive;


        // If the text is not a color    and the name/value a color
        // No match
        if (searchText.indexOf("#") !== 0 && name.indexOf("#") === 0) {
            return false;
        }

        var p_name = name;

        if (insensitive === true) {
            p_name = name.toUpperCase();
        }


        if (p_name.indexOf(searchText) >= 0) {
            return true;
        }

        return false;
    }

    // Simple RGB matcher in the form #000000
    function parseRGB(text) {
        var color = colorConverter.parseHexToRgbaOrDefault(text);
        if (color.r === 0 && color.g === 0 && color.b === 0 && text.toUpperCase() !== "BLACK" &&
            text.toUpperCase() !== "#FFF" &&
            text.toUpperCase() !== "#FFFFFF" &&
            text.toUpperCase() !== "rgb(0,0,0)") {
            return false;
        } else {
            return color;
        }
    }

    // max eucl space pre-calculated
    var colorCt = 441.67295593;
    function getColorDistance(c1, c2) {
        var r = Math.pow(c1.r - c2.r, 2);
        var g = Math.pow(c1.g - c2.g, 2);
        var b = Math.pow(c1.b - c2.b, 2);

        var sqr = Math.sqrt((r + g + b));

        return sqr / colorCt;
    }

    function readySelectList() {
        $(this).wrap($(document.createElement("div"))
            .addClass("utr-container__field--select__container")
        );
        $(this).after($(document.createElement("div"))
            .addClass("utr-container__field--select__container__text")
        );
        $(this).next(".utr-container__field--select__container__text")
            .after($(document.createElement("div"))
                .addClass("utr-container__field--select__container__arrow")
            );
        var val = $(this).children("option:selected").text();
        $(this).next(".utr-container__field--select__container__text").text(val);
    }

    function renderControls(appendTo, searchText) {
        var result = $();
        var controls = self.less.variables;
        var firstValidControl = true;
        var controlGroups = {};
        var controlSubgroups = {};
        var ungroupedControls = $();
        var currentControl = null;
        var currentControlGroup = null;
        var currentControlSubgroup = null;
        var doSearch = !!searchText;
        var processedSearchText = null;
        var parsedSearchColor = null;
        var isInsensitive = true;

        var hiddenVariables = {};

        if (doSearch) {
            // Forcing lower case in case the color string is in upper case
            // D3 does not recognize uppercase words
            parsedSearchColor = parseRGB(searchText.toLowerCase());

            if (searchText.length >= 2 && searchText.indexOf('"') === 0 && searchText.slice(-1) === '"') {
                isInsensitive = false;
                processedSearchText = searchText.slice(1, searchText.length - 1);
            } else {
                processedSearchText = searchText.toUpperCase();
            }
        }

        for (var i = 0; i < self.less.groups.length; i++) {
            if (self.less.groups[i].common || !commonOnly) {
                controlGroups[self.less.groups[i].name] = $();
            }
        }

        for (var control in controls) {
            if (controls[control].name && validControlTypes.indexOf(controls[control].type) > -1) {
                controls[control].var = control;
                currentControlGroup = controls[control].group;
                currentControlSubgroup = controls[control].subgroup;

                if ((!controls[control].common && commonOnly) || !controlGroups[currentControlGroup]) {
                    hiddenVariables[currentControlGroup] = hiddenVariables[currentControlGroup] || [];
                    hiddenVariables[currentControlGroup].push(control);
                    continue;
                }

                if (doSearch) {
                    if (!match(translate(controls[control].name), processedSearchText, isInsensitive) &&
                        !match(translate(controls[control].value), processedSearchText, isInsensitive) &&
                        !match(translate(controls[control].group) || '', processedSearchText, isInsensitive) &&
                        !match(translate(controls[control].subgroup) || '', processedSearchText, isInsensitive)) {
                        var parsedColorValue = parseRGB(controls[control].value);

                        if (parsedSearchColor !== false && parsedColorValue !== false) {
                            var distance = getColorDistance(parsedSearchColor, parsedColorValue);

                            if (distance > 0.1) {
                                hiddenVariables[currentControlGroup] = hiddenVariables[currentControlGroup] || [];
                                hiddenVariables[currentControlGroup].push(control);
                                continue;
                            }
                        } else {
                            hiddenVariables[currentControlGroup] = hiddenVariables[currentControlGroup] || [];
                            hiddenVariables[currentControlGroup].push(control);
                            continue;
                        }

                    }
                }

                if (!currentControlSubgroup) {
                    switch (controls[control].type) {
                        case "color": currentControl = createColorControl(control, controls[control]);
                            break;
                        case "number":
                            if (controls[control].hasOwnProperty("range")) {
                                currentControl = createSliderControl(control, controls[control]);
                            }
                            break;
                        case "select":
                            if (controls[control].hasOwnProperty("options")) {
                                currentControl = createSelectControl(control, controls[control]);
                            }
                            break;
                    }
                    if (firstValidControl) {
                        currentControl.attr("autofocus", "autofocus");
                    }

                    if (currentControlGroup) {
                        controlGroups[currentControlGroup] = controlGroups[currentControlGroup].add(currentControl);
                    } else {
                        ungroupedControls = ungroupedControls.add(currentControl.addClass('utr-container__field--ungrouped'));
                    }
                } else {
                    currentControlGroup = currentControlGroup || '';
                    !controlSubgroups[currentControlGroup] && (controlSubgroups[currentControlGroup] = {});
                    !controlSubgroups[currentControlGroup][currentControlSubgroup] && (controlSubgroups[currentControlGroup][currentControlSubgroup] = []);
                    controlSubgroups[currentControlGroup][currentControlSubgroup].push(controls[control]);
                }
                firstValidControl = false;
            }
        }

        for (var g in controlSubgroups) {
            for (var s in controlSubgroups[g]) {
                // Only colors supported right now.
                var out = createColorSetControl(controlSubgroups[g][s]).addClass('utr-container__field--composite');
                if (g === '') {
                    ungroupedControls = ungroupedControls.add(out.addClass('utr-container__field--ungrouped'));
                } else {
                    controlGroups[g] = controlGroups[g] || $();
                    controlGroups[g] = controlGroups[g].add(out);
                }
            }
        }

        result = result.add(ungroupedControls);

        for (var controlGroup in controlGroups) {
            if (controlGroups[controlGroup].length > 0) {
                result = result.add(createControlGroup(controlGroup, controlGroups[controlGroup], hiddenVariables[controlGroup]));
            }
        }

        appendTo && appendTo.append(result);

        return result;
    }

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
    function isRollable(style) {
        if (style.inputFileUrls && style.inputFileUrls.length > 0) {
            for (var i = style.inputFileUrls.length - 1; i >= 0; i--) {
                if (endsWith(style.inputFileUrls[i], '.less')) {
                    return true;
                }
            }
        }
        return false;
    }
    // BEGIN FEATURE THEME ROLLER LOGO EDITOR
    function adjustUTRHeight(pEvent) {
        var lDialog$ = utrContainer.parents('.utr.utr--main'),
            // We only care about the dev toolbar if it is docked at the bottom
            lBottomApexDevToolbar$ = $('#apexDevToolbar.a-DevToolbar.a-DevToolbar--bottom'),
            // The amount of space to leave around the theme roller
            C_EXTRA_VERTICAL_FREE_SPACE = 40,
            // By default, the maximum height of the tab contents is
            // The window height
            lDefaultMaxContentHeight = $(window).outerHeight()
                // Minus the outer top border
                - parseFloat(lDialog$.css('padding-top'))
                // The height of the title
                - lDialog$.find('.ui-dialog-titlebar').outerHeight()
                // The height of the tabs bar
                - lDialog$.find('.utr-tabs').outerHeight()
                // The outer bottom border
                - parseFloat(lDialog$.css('padding-bottom'))
                - C_EXTRA_VERTICAL_FREE_SPACE
                // If the dev toolbar is docked at the bottom then take
                // it into account
                - (lBottomApexDevToolbar$.length > 0 ? lBottomApexDevToolbar$.outerHeight() : 0);

        lDialog$
            .find('.utr-tab')
            .each(function () {
                var lTab$ = $(this),
                    // Get the tab contents
                    lTabContent$ = lTab$.find('.utr-tab__content'),
                    // Get the toolbar for the tab if any
                    lTabToolbar$ = lTab$.find('.utr-toolbar'),
                    // Get the buttons for the tab if any
                    lTabButtons$ = lTab$.find('.utr-container__buttons'),
                    // Calculate the tab contents height based on its contents
                    lTabMaxContentHeight = lDefaultMaxContentHeight
                        // If it has a toolbar, then take the toolbar into account
                        - (lTabToolbar$.length > 0 ? lTabToolbar$.outerHeight() : 0)
                        // If it has buttons, take them into account
                        - (lTabButtons$.length > 0 ? lTabButtons$.outerHeight() : 0);

                lTabContent$
                    .css({
                        "max-height": lTabMaxContentHeight,
                        overflow: "auto"
                    });
            });
    }
    // END THEME ROLLER LOGO EDITOR

    function invokeUTR(input, name, css, baseStyleId, onFinishedLoading) {
        self.busy = true;
        toggleNested(self, true);
        bindKeyHandlers();

        //Get Logo Data:
        getLogo(function (logoData) {
            if (logoData.type) {
                //Placeholders
                // gOriginalTextLogoElement$ = getLogoTextElement();
                backupLogo(true);
                gLogoText = logoData.appName;
                gLogoImageName = STR.LOGO_DEFAULT_IMAGE;
                gUploadedFile = '';
                gHasImage = false;
                gLogoFirstLoad = true;
                switch (logoData.type) {
                    case 'I':
                        gLogoType = LOGO_TYPES.IMAGE;
                        gLogoImageName = logoData.imageUrl.replace('#APP_IMAGES#', '');
                        gHasImage = true;
                        break;
                    case 'T':
                        gLogoType = LOGO_TYPES.TEXT;
                        gLogoText = logoData.text;
                        break;
                    case 'IT':
                        gLogoType = LOGO_TYPES.IMAGE_AND_TEXT;
                        gLogoText = logoData.text;
                        gLogoImageName = logoData.imageUrl.replace('#APP_IMAGES#', '');
                        gHasImage = true;
                        break;
                    case 'C':
                        gLogoType = LOGO_TYPES.CUSTOM;
                        break;
                    case 'NO':
                        gLogoType = LOGO_TYPES.NONE;
                        break;
                }
                gLogoTextPreviousText = gLogoText;
                gPreviousSelection = gLogoType;
            }


            getThemeStyles(function (pData) {
                existingStyles = pData;

                for (var i = existingStyles.length - 1; i >= 0; i--) {
                    if (existingStyles[i].isCurrent) {
                        currentThemeStylesheets = currentThemeStylesheets
                            .concat(existingStyles[i].cssFileUrls || [])
                            .concat(existingStyles[i].outputFileUrls || []);
                        break;
                    }
                }

                var localStorageSearch = themeState('SEARCH') || "";

                name = name || (themeState('META') || {}).name || 'Custom Style';
                commonOnly = themeState('COMMON_ONLY');
                commonOnly = !(commonOnly === false);
                baseStyleId = baseStyleId || themeState("BASE_STYLE_ID");
                selectedStyle = getStyle(baseStyleId);
                if (!selectedStyle) {
                    var iStyle;
                    for (var i = existingStyles.length - 1; i >= 0; i--) {
                        iStyle = existingStyles[i];
                        if (iStyle.isCurrent) {
                            baseStyleId = iStyle.id;
                            selectedStyle = iStyle;
                            break;
                        }
                    }
                }

                if (!selectedStyle) {
                    themeState('OPENED', false);
                } else {
                    if (baseStyleId !== themeState('BASE_STYLE_ID')) {
                        themeState('VARS', {});
                        /* BEGIN FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                        themeState("USE_CUSTOM_LESS", true);
                        /* END FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                        themeState('CUSTOM_CSS', '');
                        themeState('STYLE_HAS_CHANGED', false);
                        themeState('BASE_STYLE_ID', baseStyleId);
                    }

                    modifyVars = input || themeState('VARS') || {};
                    css = css || themeState("CUSTOM_CSS") || (selectedStyle.config || {}).customCSS || '';
                    modifyVars = $.extend({}, (selectedStyle.config || {}).vars, modifyVars);
                    styleHasChanged = themeState('STYLE_HAS_CHANGED') || false;

                    var accordionInitialized = false;

                    function lessErrorHandler(error) {
                        utrStaticMessage.text(STR.ERROR_INVALID_STYLE);
                        isOpenAndValid = false;
                        if (error) {
                            debug.log('LESS compilation error for ' + selectedStyle.name);
                            debug.log('  Line:' + error.line, '  Message: ' + error.message, error);
                        }
                        utrToolbar.hide();
                        utrContainer.closest('.utr').toggleClass('utr--static', true);
                    }

                    // Toolbar
                    function refreshControls(searchText) {
                        utrContainer.closest('.utr').removeClass('utr--static');

                        controls = self.less.variables;

                        searchText = searchText || '';
                        var renderedControls = renderControls(null, searchText);

                        utrContainerBody.find('.utr-container__field--var')
                            .remove();
                        utrAccordionWrapper
                            .empty()
                            .append(renderedControls.not('.utr-container__field--ungrouped'));

                        utrBaseStyleContainer.after(renderedControls.filter('.utr-container__field--ungrouped'));

                        utrCustomCSS = {
                            container: $(document.createElement("div"))
                                .addClass("utr-container__field utr-container__field--codearea-field"),
                            description: $(document.createElement("small"))
                                .addClass("utr-container__field-description utr-container__field-description--no-margin-top")
                                .text(STR.CUSTOM_CSS_DESCRIPTION),
                            warning: $(document.createElement("small"))
                                .addClass("utr-container__field-warning")
                                .append($(document.createElement("span")).addClass("a-Icon icon-warning"))
                                .append(STR.CUSTOM_CSS_WARNING),
                            label: $(document.createElement("label"))
                                .attr("for", "utr_custom_css")
                                .addClass("utr-container__field-label utr-container__field-label--screen-reader-only")
                                .text(STR.CUSTOM_CSS),
                            /* BEGIN FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                            lessToggleContainer: $(document.createElement("div"))
                                .addClass("utr-container__field-subfield utr-container__field-subfield--no-padding-bottom"),
                            lessToggleControl: $(document.createElement("input"))
                                .addClass("utr-checkbox")
                                .attr("id", "utr_custom_less_toggle")
                                .attr("type", "checkbox")
                                .prop("checked", true)
                                .on("change", function (pEvent) {
                                    themeState("USE_CUSTOM_LESS", $(this).prop("checked"));

                                    css = utrCustomCSS.editor$.codeEditor("getValue");

                                    if (setCustomCSSOutput(css)) {
                                        styleHasChanged = true;
                                        resetButton.toggleClass("utr-container__button--disable", false);
                                        toolbarResetButton.toggleClass("utr-toolbar-button--disable", false);
                                        themeState('STYLE_HAS_CHANGED', true);
                                    }
                                }),
                            lessToggleLabel: $(document.createElement("label"))
                                .addClass("utr-checkbox__label")
                                .attr("for", "utr_custom_less_toggle")
                                .text(STR.ENABLE_LESS_COMP),
                            /* END FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                            control: $(document.createElement("textarea"))
                                .attr({
                                    id: "utr_custom_css"
                                })
                                .addClass("utr-textarea utr-textarea--full-width utr-reset")
                                .val(css)
                                .bind("utr-reset", function () {
                                    utrCustomCSS.editor$.codeEditor("setValue", selectedStyle.config ? selectedStyle.config.customCSS : "");
                                    $(this).val(selectedStyle.config ? selectedStyle.config.customCSS : "");
                                    css = themeState("CUSTOM_CSS", selectedStyle.config ? selectedStyle.config.customCSS : "");
                                }),
                            controlGroupId: renderedControls.filter("h3").length,
                            hasBeenShown: false,
                            dialogButton: $(document.createElement("a"))
                                .attr({
                                    href: "#",
                                    alt: STR.CODE_EDITOR,
                                    title: STR.CODE_EDITOR
                                })
                                .addClass("utr-custom-css-header-button")
                                .append(
                                    $(document.createElement("span"))
                                        .addClass("utr-custom-css-header-button__icon a-Icon icon-open-in-dialog")
                                ).click(function (eventObject) {
                                    eventObject.preventDefault();
                                    eventObject.stopPropagation();

                                    utrCustomCSSCodeEditor = {
                                        container: $(document.createElement("div"))
                                            .addClass("utr-container")
                                            .attr("title", STR.CUSTOM_CSS),
                                        containerBody: $(document.createElement("div"))
                                            .addClass("utr-container__body utr-container__body--no-padding"),
                                        warning: $(document.createElement("small"))
                                            .addClass("utr-container__field-warning")
                                            .append($(document.createElement("span")).addClass("a-Icon icon-warning"))
                                            .append(STR.CUSTOM_CSS_WARNING),
                                        /* BEGIN FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                                        lessToggleContainer: $(document.createElement("div"))
                                            .addClass("utr-container__field-subfield utr-container__field-subfield--padding-left utr-container__field-subfield--padding-right"),
                                        lessToggleControl: $(document.createElement("input"))
                                            .addClass("utr-checkbox")
                                            .attr("id", "utr_custom_less_toggle_dialog")
                                            .attr("type", "checkbox")
                                            .prop("checked", utrCustomCSS.lessToggleControl.prop("checked"))
                                            .on("change", function (pEvent) {
                                                utrCustomCSS.lessToggleControl.prop("checked", $(this).prop("checked"));
                                                utrCustomCSS.lessToggleControl.change();
                                            }),
                                        lessToggleLabel: $(document.createElement("label"))
                                            .addClass("utr-checkbox__label")
                                            .attr("for", "utr_custom_less_toggle_dialog")
                                            .text(STR.ENABLE_LESS_COMP),
                                        /* END FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                                        textarea: $(document.createElement("textarea"))
                                            .addClass("utr-container__code")
                                            .val(utrCustomCSS.editor$.codeEditor("getValue"))
                                            .css({
                                                width: 770,
                                                height: 300,
                                                'font-family': "'Lucida Console', monospace",
                                                'border-color': '#e0e0e0'
                                            })
                                            .keydown(function (e) {
                                                if (e.keyCode == 8) {
                                                    e.preventDefault();
                                                }
                                            })
                                    };
                                    /* BEGIN FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                                    utrCustomCSSCodeEditor.lessToggleContainer.append(
                                        utrCustomCSSCodeEditor.lessToggleControl,
                                        utrCustomCSSCodeEditor.lessToggleLabel
                                    );
                                    /* END FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                                    utrCustomCSSCodeEditor.containerBody
                                        .append(
                                            utrCustomCSSCodeEditor.textarea,
                                            /* BEGIN FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                                            utrCustomCSSCodeEditor.lessToggleContainer
                                            /* END FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                                        );
                                    utrCustomCSSCodeEditor.container
                                        .append(
                                            utrCustomCSSCodeEditor.containerBody
                                        );
                                    $("body")
                                        .append(
                                            utrCustomCSSCodeEditor.container
                                        );

                                    utrCustomCSSCodeEditor.container.dialog({
                                        dialogClass: "utr utr--codeeditor",
                                        width: 800,
                                        modal: true,
                                        resizable: true,
                                        position: {
                                            my: "center center",
                                            at: "center center",
                                            of: $(window)
                                        },
                                        create: function (event) {
                                            $(event.target)
                                                .dialog("widget")
                                                .css({
                                                    "position": "fixed"
                                                });
                                        },
                                        close: function (event, ui) {
                                            $(this)
                                                .dialog('destroy')
                                                .remove();

                                            utrCustomCSSCodeEditor = undefined;
                                        },
                                        resize: function (event, ui) {
                                            var $Element = $(this);

                                            if (ui.originalSize.height != $Element.height()) {
                                                utrCustomCSSCodeEditor.editor$.css("height", $Element.height() - utrCustomCSSCodeEditor.lessToggleContainer.outerHeight());
                                                utrCustomCSSCodeEditor.editor$.trigger("resize");
                                            }
                                            
                                        }
                                    });

                                    var $codeEditorContainer = $("<div/>");
                                    var oldTextarea = utrCustomCSSCodeEditor.textarea.get(0);
                                    $codeEditorContainer.insertAfter(oldTextarea);
                                    $(oldTextarea).hide();
            
                                    $codeEditorContainer.addClass("utr-codearea utr-codearea--standard");
                                    
                                    utrCustomCSSCodeEditor.editor$ = $codeEditorContainer;

                                    utrCustomCSSCodeEditor.editor$.codeEditor({
                                        language: "less",
                                        theme: "vs-dark",
                                        toolbar: false,
                                        minimap: false,
                                        wordWrap: true,
                                        value: oldTextarea.value,
                                        onInitialized: function(editor){
                                            editor.getModel().onDidChangeContent(function(){
                                                utrCustomCSS.editor$.codeEditor("setValue", utrCustomCSSCodeEditor.editor$.codeEditor("getValue"));
                                            });

                                            utrCustomCSSCodeEditor.editor$.codeEditor("focus").codeEditor("setCursorToEnd", true);
                                        }
                                    });

                                    if (utrCustomCSSWarning) {
                                        $codeEditorContainer.before(utrCustomCSSCodeEditor.warning);
                                    } else {
                                        utrCustomCSSCodeEditor.warning.remove();
                                    }

                                    return false;
                                })
                        };
                        /* BEGIN FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                        utrCustomCSS.lessToggleContainer.append(
                            utrCustomCSS.lessToggleControl,
                            utrCustomCSS.lessToggleLabel,
                        );
                        /* END FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                        utrCustomCSS.container.append(
                            utrCustomCSS.label,
                            utrCustomCSS.control,
                            /* BEGIN FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                            utrCustomCSS.lessToggleContainer,
                            /* END FEATURE #THEME_ROLLER_00011 CUSTOM LESS SUPPORT */
                            utrCustomCSS.description
                        );

                        if ((typeof searchText === 'undefined' || searchText === '')) {
                            utrAccordionWrapper.append(
                                $(document.createElement("h3"))
                                    .addClass("utr-custom-css__header")
                                    .append(
                                        $(document.createElement("div"))
                                            .addClass("utr-custom-css__header-text")
                                            .text(STR.CUSTOM_CSS)
                                    )
                                    .append(
                                        $(document.createElement("div"))
                                            .addClass("utr-custom-css__header-buttons")
                                            .append(
                                                utrCustomCSS.dialogButton
                                            )
                                    )
                                    .add(utrCustomCSS.container)
                            );
                        }

                        if (accordionInitialized) {
                            utrAccordionWrapper.accordion('destroy');
                        }
                        var groupNames = self.less.groups.filter(function (d) { return d.common || !commonOnly; }).map(function (d) { return d.name; });
                        groupNames.push(STR.CUSTOM_CSS);

                        utrAccordionWrapper.accordion({
                            collapsible: true,
                            heightStyle: "content",
                            active: Math.max(groupNames.indexOf(themeState("ACTIVE_GROUP")), 0),
                            activate: function (event, ui) {
                                var activeGroupId = $(this).accordion("option", "active");

                                themeState("ACTIVE_GROUP", groupNames[activeGroupId]);

                                if (activeGroupId === utrCustomCSS.controlGroupId) {
                                    if (!utrCustomCSS.hasBeenShown) {
                                        utrCustomCSS.editor$.trigger("resize");
                                        utrCustomCSS.hasBeenShown = true;
                                    }
                                    utrCustomCSS.editor$.codeEditor("focus").codeEditor("setCursorToEnd", true);
                                }
                            }
                        });

                        $("body .utr .ui-dialog-titlebar-close .ui-button-icon-primary").removeClass("ui-icon ui-icon-closethick").addClass("a-Icon icon-tr-close");
                        accordionInitialized = true;

                        var $codeEditorContainer = $("<div/>");
                        var oldTextarea = utrCustomCSS.control[0];
                        $codeEditorContainer.insertAfter(oldTextarea);
                        $(oldTextarea).hide();

                        $codeEditorContainer.addClass("utr-codearea utr-codearea--full-width");
                        $codeEditorContainer.css("height", "180px");

                        utrCustomCSS.editor$ = $codeEditorContainer.codeEditor({
                            language: "less",
                            theme: "vs-dark",
                            toolbar: false,
                            minimap: false,
                            wordWrap: true,
                            value: oldTextarea.value,
                            onInitialized: function(editor){
                                editor.getModel().onDidChangeContent(function(){
                                    css = utrCustomCSS.editor$.codeEditor("getValue");
                                    themeState("CUSTOM_CSS", css);
        
                                    if (setCustomCSSOutput(css)) {
                                        styleHasChanged = true;
                                        resetButton.toggleClass("utr-container__button--disable", false);
                                        toolbarResetButton.toggleClass("utr-toolbar-button--disable", false);
                                        themeState('STYLE_HAS_CHANGED', true);
                                    }
                                });
                            }
                        });

                        if ($codeEditorContainer.is(":visible")) {
                            utrCustomCSS.hasBeenShown = true;
                        }

                        utrContainerBody.find("select").each(function () {
                            if (this.id != "utr_base_style") {
                                readySelectList.call(this);
                            }
                        });
                    }

                    function search(e) {
                        // Alt or Cmd/ctrl

                        if (e.altKey === true || e.ctrlKey === true || e.metaKey === true ||
                            (window.navigator.appVersion.indexOf("Mac") >= 0 && (e.which === 18 || e.which === 91 || e.which === 17))) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            return false;
                        }

                        window.clearInterval(searchTimerInterval);
                        searchTimer = 0;
                        searchTimerInterval = window.setInterval(function () {
                            searchTimer++;
                            if (searchTimer >= 1) {
                                window.clearInterval(searchTimerInterval);

                                var searchString = e.originalEvent.target.value;
                                refreshControls(searchString);
                                themeState('SEARCH', searchString);

                                e.preventDefault();
                                return false;
                            }
                        }, 300);
                    }

                    utrContainer = $(document.createElement("div")).addClass("utr-container").attr("title", STR.THEME_ROLLER);
                    // BEGIN FEATURE THEME ROLLER LOGO EDITOR
                    gTabsContainer$ = $(document.createElement('div'))
                        .addClass('apex-rds-container utr-tabsContainer')
                        .attr('id', 'apex_lto_rds'),
                        gTabs$ = $(document.createElement('ul'))
                            .addClass('apex-rds utr-tabs')
                            .appendTo(gTabsContainer$),
                        gThemeStyleTabButtonContainer$ = $(document.createElement('li'))
                            .appendTo(gTabs$),
                        gThemeStyleTabButton$ = $(document.createElement('a'))
                            .attr('href', '#' + C_UTR_TAB_ID_PREFIX + 'ThemeStyle')
                            /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            .text(STR.TABS_THEME_STYLE)
                            /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            .appendTo(gThemeStyleTabButtonContainer$)
                            .on( 'click', function(e) {
                                if ( gLogoPendingChanges ) {
                                    $( '#' + C_UTR_TAB_ID_PREFIX + 'Logo_tab a' ).text( STR.TABS_LOGO + '*' );
                                } else {
                                    $( '#' + C_UTR_TAB_ID_PREFIX + 'Logo_tab a' ).text( STR.TABS_LOGO );
                                }

                                var renderedThemeButtons = renderButtons( $('#utr_base_style') );
                                if ( $( '#' + C_UTR_TAB_ID_PREFIX + 'ThemeStyle' + ' .utr-container__buttons').is( ':visible') 
                                    && $( '#utr_base_style_clone').is( ':hidden' )) {
                                    $( '#' + C_UTR_TAB_ID_PREFIX + 'ThemeStyle' + ' .utr-container__buttons' ).replaceWith(renderedThemeButtons);
                                } else {
                                    $( '#' + C_UTR_TAB_ID_PREFIX + 'ThemeStyle' + ' .utr-container__buttons' ).show();
                                }
                                
                            }),
                        gLogoTabButtonContainer$ = $(document.createElement('li'))
                            .appendTo(gTabs$),
                        gLogoTabButton$ = $(document.createElement('a'))
                            .attr('href', '#' + C_UTR_TAB_ID_PREFIX + 'Logo')
                            /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            .text(STR.TABS_LOGO)
                            /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            .appendTo(gLogoTabButtonContainer$)
                            .on( 'click', function(e) {
                                if ( !selectedStyle.isCurrent || styleHasChanged ) {
                                    $( '#' + C_UTR_TAB_ID_PREFIX + 'ThemeStyle_tab a' ).text( STR.TABS_THEME_STYLE + '*' );
                                } else {
                                    $( '#' + C_UTR_TAB_ID_PREFIX + 'ThemeStyle_tab a' ).text( STR.TABS_THEME_STYLE );
                                }
                                /* Artificially showing ALWAYS the logo fields.
                                 * When using not rollable themes.
                                 */
                                $('.utr-logo').show();
                                $( '#utrLogoType').trigger( 'change' );
                                $( '#utrTabLogo' ).attr( 'style', 'padding: 44px 0px 48px 0px;' );
                                // Recover Logo Tab Button
                                $(  '#' + C_UTR_TAB_ID_PREFIX + 'Logo' + ' .utr-container__buttons' ).replaceWith(lLogoTabButtons$);
                            }),
                    // END FEATURE THEME ROLLER LOGO EDITOR

                    utrContainerBody = $(document.createElement("div")).addClass("utr-container__body").scroll(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        return false;
                    });
                    // BEGIN FEATURE THEME ROLLER LOGO EDITOR
                    gThemeStyleTab$ = utrContainerBody;
                    gThemeStyleTab$
                        .addClass('utr-tab')
                        .attr('id', C_UTR_TAB_ID_PREFIX + 'ThemeStyle');

                    var lThemeStyleTabContent$ = $(document.createElement('div'))
                        .addClass('utr-tab__content')
                        .appendTo(gThemeStyleTab$);

                    gLogoTab$ = $(document.createElement('div'))
                        .addClass('utr-container__body utr-tab')
                        .attr('id', C_UTR_TAB_ID_PREFIX + 'Logo')
                        .hide();

                    function previewLogo() {
                        var lLogoTypeValue = lLogoTypeControl$.val(),
                            lLogoLinkElement$ = getLogoLinkElement(),
                            lLogoImageElement$ = getLogoImageElement(),
                            lLogoTextElement$ = getLogoTextElement();

                        if (gOriginalImageSrc.length <= 0 && lLogoImageElement$.length > 0) {
                            gOriginalImageSrc = lLogoImageElement$.attr('src');
                        }

                        if (lLogoTypeValue === LOGO_TYPES.TEXT) {
                            lLogoImageElement$.remove();
                            lLogoImageElement$ = jQuery();
                        }

                        if (
                            lLogoTypeValue === LOGO_TYPES.TEXT ||
                            lLogoTypeValue === LOGO_TYPES.IMAGE_AND_TEXT
                        ) {

                            if (lLogoTextElement$.length > 0) {
                                lLogoTextElement$.detach();
                            } else {
                                lLogoTextElement$ = $(document.createElement('span'));
                            }

                            lLogoTextElement$.text($('#utrLogoText').val()).addClass('apex-logo-text');

                            if (lLogoImageElement$.length > 0) {
                                lLogoImageElement$.after(lLogoTextElement$);
                            } else if (lLogoLinkElement$.length > 0) {
                                lLogoLinkElement$.append(lLogoTextElement$);
                            }
                        }

                        if (lLogoTypeValue === LOGO_TYPES.IMAGE) {
                            lLogoTextElement$.remove();
                            lLogoTextElement$ = jQuery();
                        }

                        if (
                            lLogoTypeValue === LOGO_TYPES.IMAGE ||
                            lLogoTypeValue === LOGO_TYPES.IMAGE_AND_TEXT
                        ) {
                            if (lLogoImageElement$.length > 0) {
                                lLogoImageElement$
                                    .detach();
                            } else {
                                lLogoImageElement$ = $(document.createElement('img')).addClass( 'apex-logo-img' );
                            }

                            if (gUploadedFileB64 !== null) {
                                lLogoImageElement$.attr('src', gUploadedFileB64);
                            } else {
                                lLogoImageElement$.attr('src', gOriginalImageSrc);
                            }

                            if (lLogoTextElement$.length > 0) {
                                lLogoTextElement$
                                    .before(lLogoImageElement$);
                            } else if (lLogoLinkElement$.length > 0) {
                                lLogoLinkElement$
                                    .prepend(lLogoImageElement$);
                            }
                        }
                    }

                    function previewLogoFile(lFile) {

                        var lLogoTypeValue = lLogoTypeControl$.val();

                        if (
                            lLogoTypeValue === LOGO_TYPES.IMAGE ||
                            lLogoTypeValue === LOGO_TYPES.IMAGE_AND_TEXT
                        ) {

                            var lFileReader,
                                lLogoLinkElement$,
                                lLogoImageElement$,
                                lLogoTextElement$;

                            if (lFile) {
                                backupLogo();

                                lFileReader = new FileReader();
                                lLogoLinkElement$ = getLogoLinkElement();
                                lLogoImageElement$ = getLogoImageElement();
                                lLogoTextElement$ = getLogoTextElement();

                                if (lLogoTypeValue === LOGO_TYPES.IMAGE) {
                                    lLogoTextElement$
                                        .remove();
                                    lLogoTextElement$ = jQuery();
                                }

                                if (lLogoImageElement$.length > 0) {
                                    lLogoImageElement$
                                        .detach();
                                } else {
                                    lLogoImageElement$ = $(document.createElement('img'));
                                }

                                lFileReader.onloadend = function () {
                                    gUploadedFileB64 = lFileReader.result;
                                    lLogoImageElement$
                                        .attr('src', gUploadedFileB64)
                                        .addClass( 'apex-logo-img' );                                        
                                    //Clear the b64 text within the image data for setLogo.
                                    gUploadedFile = gUploadedFileB64.substring(
                                        gUploadedFileB64.indexOf('base64,') + 'base64,'.length
                                    );
                                    $('#utrLogoFileOutput').val(lFile.name);
                                    gUploadedFilenameExtension = lFile.name.split('.').pop();

                                    if (lLogoTextElement$.length > 0) {
                                        lLogoTextElement$
                                            .before(lLogoImageElement$);
                                    } else if (lLogoLinkElement$.length > 0) {
                                        lLogoLinkElement$
                                            .prepend(lLogoImageElement$);
                                    }
                                };
                                lFileReader.readAsDataURL(lFile);
                            }
                        }
                    }

                    var lLogoTabContent$ = $(document.createElement('div'))
                        .addClass('utr-tab__content utr-tab__content--padded utr-logo')
                        .appendTo(gLogoTab$),
                        // Control: Toolbar
                        lLogoTabToolbar$ = $(document.createElement('div'))
                            .addClass('utr-toolbar')
                            .appendTo(gLogoTab$),
                        // Control: Buttons
                        lLogoTabButtons$ = $(document.createElement('div'))
                            .addClass('utr-container__buttons utr-container__buttons--fixed utr-logo')
                            .appendTo(gLogoTab$),
                        lLogoTabSaveButton$ = $(document.createElement('a'))
                            .addClass('utr-container__button utr-container__button--right utr-logo')
                            .attr({
                                id: 'utr-save-logo-button-id',
                                href: '#'
                            })
                            .text(STR.SAVE_LOGO)
                            .on('click', function ( e ) {

                                var spinner$ = apex.util.showSpinner();
                                var lLogoType,
                                    lLogoImageUrl,
                                    lLogoText,
                                    lCustomHTML,
                                    lImageFilename,
                                    lImageFile = [],
                                    lNewImage = 'N';

                                switch (lLogoTypeControl$.val()) {
                                    case LOGO_TYPES.IMAGE:
                                        lLogoType = 'I';
                                        break;
                                    case LOGO_TYPES.TEXT:
                                        lLogoType = 'T';
                                        break;
                                    case LOGO_TYPES.IMAGE_AND_TEXT:
                                        lLogoType = 'IT';
                                        break;
                                    case LOGO_TYPES.CUSTOM:
                                        lLogoType = 'C';
                                        break;
                                    case LOGO_TYPES.NONE:
                                        lLogoType = 'NO';
                                        break;
                                }

                                lLogoText = $("#utrLogoText").val();

                                lImageFilename = 'app-' + $v("pFlowId") + '-logo.' + gUploadedFilenameExtension;
                                if ( typeof gUploadedFile !== 'undefined' && gUploadedFile.length > 0 ) {
                                    lImageFile = gUploadedFile;
                                    lNewImage = 'Y';
                                }
                                
                                if ( lNewImage == 'N' && gHasImage ) {
                                    lLogoImageUrl = '#APP_IMAGES#'+gLogoImageName;
                                }

                                lCustomHTML = $("#utrCustomHTML").val();

                                if ( ( lLogoType == 'T' && lLogoText.trim().length <= 0 )
                                    || ( lLogoType == 'IT' && 
                                            ( lLogoText.trim().length <= 0 || (lNewImage == 'N' && !gHasImage ))
                                    )
                                    || ( lLogoType == 'I' && ( lNewImage == 'N' && !gHasImage ) ) ) {

                                    spinner$.remove();
                                    modalAlert( STR.COMMON_WARNING, msg("APEX.IG.VALUE_REQUIRED") )();

                                } else {

                                    gLogoPendingChanges = false;
                                    gPreviousSelection = lLogoTypeControl$.val();
                                    $( '#' + C_UTR_TAB_ID_PREFIX + 'Logo_tab a' ).text( STR.TABS_LOGO );

                                    setLogo(lLogoType, lLogoImageUrl, lLogoText, lCustomHTML, lImageFilename, lImageFile, lNewImage, function () {
                                        spinner$.remove();
                                        modalAlert(STR.COMMON_SUCCESS, STR.LOGO_SET_SUCCESS)();
                                        backupLogo(true);
                                    },
                                    function (data) {
                                        spinner$.remove();
                                        modalAlert(STR.ERROR, STR.LOGO_SET_ERROR + '. \n\n' + data.responseJSON.error)();
                                    });

                                }

                                if (e) {
                                    e.preventDefault();
                                }

                                return false;
                            })
                            .appendTo(lLogoTabButtons$),
                        // Control: Logo Type
                        lLogoTypeControlContainer$ = $(document.createElement('div'))
                            .addClass('utr-container__field utr-container__field--select utr-logo')
                            .appendTo(lLogoTabContent$),
                        lLogoTypeControl$ = $(document.createElement('select'))
                            .attr('id', 'utrLogoType')
                            /* BEGIN FEATURE #THEME_ROLLER_00017 SORT OPTIONS THE SAME AS IN APEX 19.2 */
                            .append(
                                $(document.createElement('option'))
                                    .attr('value', LOGO_TYPES.NONE)
                                    /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                                    .text(STR.LOGO_NONE)
                                /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            )
                            /* END FEATURE #THEME_ROLLER_00017 SORT OPTIONS THE SAME AS IN APEX 19.2 */
                            .append(
                                $(document.createElement('option'))
                                    .attr('value', LOGO_TYPES.IMAGE)
                                    /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                                    .text(STR.LOGO_IMAGE)
                                /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            )
                            .append(
                                $(document.createElement('option'))
                                    .attr('value', LOGO_TYPES.TEXT)
                                    /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                                    .text(STR.LOGO_TEXT)
                                /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            )
                            .append(
                                $(document.createElement('option'))
                                    .attr('value', LOGO_TYPES.IMAGE_AND_TEXT)
                                    /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                                    .text(STR.LOGO_IMAGE_TEXT)
                                /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            )
                            /* BEGIN FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                            .append(
                                $(document.createElement('option'))
                                    .attr('value', LOGO_TYPES.CUSTOM)
                                    /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                                    .text(STR.LOGO_CUSTOM)
                                /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            )
                            /* END FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                            .val(gLogoType)
                            .on('change', function (pEvent) {

                                if ( gLogoFirstLoad ) {
                                    gLogoFirstLoad = false;
                                    gLogoPendingChanges = false;
                                } else if ( $( this ).val() !== gPreviousSelection && $( this ).val() !== LOGO_TYPES.CUSTOM ) {
                                    gLogoPendingChanges = true;
                                } else {
                                    if ( $( this ).val() === LOGO_TYPES.TEXT && gLogoTextPreviousText !== $( '#utrLogoText' ).val()) {
                                        gLogoPendingChanges = true;
                                    } else {
                                        gLogoPendingChanges = false;
                                    }
                                    
                                }

                                var lControl$ = $(this),
                                    lSelectedOption$ = $('option:selected', lControl$),
                                    lControlContainer$ = lControl$.parent();

                                previewLogo();

                                lControlContainer$
                                    .find('.utr-container__field--select__container__text')
                                    .text(lSelectedOption$.text());

                                switch (lSelectedOption$.val()) {
                                    case LOGO_TYPES.IMAGE:
                                        lLogoTextControlContainer$.hide();
                                        /* BEGIN FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                                        lLogoStaticMessage$.hide();
                                        /* END FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                                        $('html')
                                            .on('dragover.theme_roller', function (pEvent) {
                                                pEvent.preventDefault();
                                                pEvent.stopPropagation();
                                            })
                                            .on('drop.theme_roller', function (pEvent) {
                                                pEvent.preventDefault();
                                                pEvent.stopPropagation();
                                            });
                                        lLogoFileOutputControlContainer$.show();
                                        lLogoFileControlContainer$.show();
                                        $('#utr-save-logo-button-id').show();
                                        break;
                                    case LOGO_TYPES.TEXT:
                                        lLogoFileOutputControlContainer$.hide();
                                        lLogoFileControlContainer$.hide();
                                        /* BEGIN FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                                        lLogoStaticMessage$.hide();
                                        /* END FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                                        $('html')
                                            .off('drop.theme_roller')
                                            .off('dragover.theme_roller');
                                        lLogoTextControlContainer$.show();
                                        $('#utr-save-logo-button-id').show();
                                        break;
                                    case LOGO_TYPES.IMAGE_AND_TEXT:
                                        /* BEGIN FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                                        lLogoStaticMessage$.hide();
                                        /* END FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                                        $('html')
                                            .on('dragover.theme_roller', function (pEvent) {
                                                pEvent.preventDefault();
                                                pEvent.stopPropagation();
                                            })
                                            .on('drop.theme_roller', function (pEvent) {
                                                pEvent.preventDefault();
                                                pEvent.stopPropagation();
                                            });

                                        lLogoTextControlContainer$.show();
                                        lLogoFileOutputControlContainer$.show();
                                        lLogoFileControlContainer$.show();
                                        $('#utr-save-logo-button-id').show();
                                        break;
                                    case LOGO_TYPES.NONE:
                                        backupLogo();
                                        lLogoFileOutputControlContainer$.hide();
                                        lLogoFileControlContainer$.hide();
                                        lLogoTextControlContainer$.hide();
                                        /* BEGIN FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                                        lLogoStaticMessage$.hide();
                                        /* END FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                                        $('html')
                                            .off('drop.theme_roller')
                                            .off('dragover.theme_roller');

                                        getLogoLinkElement().empty();
                                        $('#utr-save-logo-button-id').show();
                                        break;
                                    /* BEGIN FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                                    case LOGO_TYPES.CUSTOM:
                                        backupLogo();
                                        lLogoFileOutputControlContainer$.hide();
                                        lLogoFileControlContainer$.hide();
                                        lLogoTextControlContainer$.hide();
                                        lLogoStaticMessage$
                                            .find("p")
                                            /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                                            .text(STR.LOGO_CUSTOM_MESSAGE)
                                            /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                                            .end()
                                            .show();
                                        $('html')
                                            .off('drop.theme_roller')
                                            .off('dragover.theme_roller');
                                        $('#utr-save-logo-button-id').hide();
                                        break;
                                    /* END FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                                }
                            })
                            .appendTo(lLogoTypeControlContainer$),
                        lLogoTypeControlLabel$ = $(document.createElement('label'))
                            .attr('for', 'utrLogoType')
                            /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            .text(STR.LOGO_TYPE)
                            /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            .appendTo(lLogoTypeControlContainer$),
                        // Control: Logo Text
                        lLogoTextControlContainer$ = $(document.createElement('div'))
                            .addClass('utr-container__field utr-container__field--text-field utr-logo')
                            .appendTo(lLogoTabContent$),
                        lLogoTextControl$ = $(document.createElement('input'))
                            .attr('id', 'utrLogoText')
                            .val(gLogoText)
                            .on('keyup', function () {
                                if ( gLogoTextPreviousText !== $( this ).val() ) {
                                    gLogoPendingChanges = true;
                                } else {
                                    gLogoPendingChanges = false;
                                }
                                backupLogo();
                                previewLogo();
                            })
                            .appendTo(lLogoTextControlContainer$),
                        lLogoTextControlLabel$ = $(document.createElement('label'))
                            .attr('for', 'utrLogoText')
                            /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            .text(STR.LOGO_TEXT)
                            /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            .appendTo(lLogoTextControlContainer$),
                        // Control: Logo File output
                        lLogoFileOutputControlContainer$ = $(document.createElement('div'))
                            .addClass('utr-container__field utr-container__field--text-field utr-logo')
                            .appendTo(lLogoTabContent$),
                        lLogoFileOutputControl$ = $(document.createElement('input'))
                            .attr({
                                id: 'utrLogoFileOutput',
                                type: 'text',
                                readonly: 'readonly'
                            })
                            .val(gLogoImageName)
                            .appendTo(lLogoFileOutputControlContainer$),
                        lLogoFileOutputControlLabel$ = $(document.createElement('label'))
                            .attr('for', 'utrLogoFileOutput')
                            .text(STR.LOGO_IMAGE)
                            .appendTo(lLogoFileOutputControlContainer$),
                        // Control: Logo File
                        lLogoFileControlContainer$ = $(document.createElement('div'))
                            .addClass('utr-container__field utr-container__field--dropzone utr-logo')
                            .appendTo(lLogoTabContent$),
                        lLogoFileControl$ = $(document.createElement('input'))
                            .attr({
                                id: 'utrLogoFile',
                                type: 'file',
                                accept: 'image/*'
                            })
                            .on('change', function () {
                                if (this.files[0].size <= (C_MAX_FILESIZE_IN_KB * 1024)) {
                                    previewLogoFile(this.files[0]);
                                } else {
                                    $(this).val('');
                                    alert(STR.LOGO_MAX_FILESIZE_IN_KB);
                                }
                            })
                            .appendTo(lLogoFileControlContainer$),
                        lLogoFileControlLabel$ = $(document.createElement('label'))
                            .attr('for', 'utrLogoFile')
                            /* BEGIN FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            .text(STR.LOGO_UPLOAD_LABEL)
                            /* END FEATURE #THEME_ROLLER_00018 TRANSLATION STRINGS */
                            .on('click', function (pEvent) {
                                pEvent.preventDefault();
                                pEvent.stopPropagation();

                                lLogoFileControl$.click();
                            })
                            .on('dragenter', function (pEvent) {
                                lLogoFileControlContainer$
                                    .addClass('utr-container__field--dropzone-active');
                            })
                            .on('dragleave drop', function (pEvent) {
                                lLogoFileControlContainer$
                                    .removeClass('utr-container__field--dropzone-active');
                            })
                            .on('drop', function (pEvent) {
                                var lFiles = pEvent.originalEvent.dataTransfer.files,
                                    lFile;

                                if (lFiles.length > 0) {
                                    lFile = lFiles[0];

                                    if (lFile.type.indexOf('image/', 0) === 0) {
                                        if (lFile.size <= (C_MAX_FILESIZE_IN_KB * 1024)) {
                                            previewLogoFile(lFile);
                                        } else {
                                            alert(STR.LOGO_MAX_FILESIZE_IN_KB);
                                        }
                                    } else {
                                        alert(STR.LOGO_ONLY_IMAGES_ALLOWED);
                                    }
                                }
                            })
                            .appendTo(lLogoFileControlContainer$)
                    /* BEGIN FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                    // Control: Custom Logo Message
                    lLogoStaticMessage$ = $(document.createElement('div'))
                        .addClass('utr-container__field utr-container__field--static-message utr-logo')
                        .append(
                            $(document.createElement('p'))
                        )
                        .appendTo(lLogoTabContent$)
                        /* END FEATURE #THEME_ROLLER_00019 ADD CUSTOM OPTION */
                        ;

                    lLogoTypeControl$.change();
                    // END FEATURE THEME ROLLER LOGO EDITOR

                    var utrToolbar = $(document.createElement("div"))
                        .addClass("utr-toolbar")
                        .append(
                            $(document.createElement("div"))
                                .addClass("utr-toolbar-item utr-toolbar-splitButton-layout")
                                .append(
                                    toolbarUndoButton = $(document.createElement("button"))
                                        .addClass("utr-toolbar-splitButton utr-toolbar-button--small a-Icon icon-tr-undo")
                                        .attr("title", STR.UNDO)
                                        .click(function () {
                                            historyEvent["undoRedo"] = 1;
                                            recompile();
                                        })
                                )
                                .append(
                                    toolbarRedoButton = $(document.createElement("button"))
                                        .addClass("utr-toolbar-splitButton utr-toolbar-button--small a-Icon icon-tr-redo")
                                        .attr("title", STR.REDO)
                                        .click(function () {
                                            historyEvent["undoRedo"] = -1;
                                            recompile();
                                        })
                                )
                        )
                        .append(
                            $(document.createElement("button"))
                                .addClass("utr-toolbar-item utr-toolbar-item--right utr-toolbar-button a-Icon icon-help")
                                .attr("title", STR.HELP)
                                .click(displayHelp)
                        );

                    toolbarResetButton = $(document.createElement("button"))
                        .addClass("utr-toolbar-item utr-toolbar-item--right utr-toolbar-button utr-toolbar-button--small a-Icon icon-tr-reset")
                        .toggleClass('utr-toolbar-button--disable', !styleHasChanged)
                        .attr("title", STR.RESET)
                        .click(resetUTR)
                        .appendTo(utrToolbar);

                    utrToolbar
                        .append(
                            $(document.createElement("input"))
                                .addClass("utr-toolbar-item utr-toolbar-item--right utr-toolbar-search")
                                .attr("id", "tr_search")
                                .attr("title", STR.SEARCH)
                                .attr("placeholder", STR.SEARCH)
                                .attr("required", "")
                                .bind("keyup", search)
                        );

                    var utrBaseStyleContainer = $(document.createElement("div"))
                        .addClass('utr-container__field utr-container__field--select');
                    var utrBaseStyleLabel = $(document.createElement("label"))
                        .attr('for', 'utr_base_style')
                        .text(STR.COMMON_BASE_STYLE);
                    var utrBaseStyleControl = $(document.createElement("select"))
                        .attr({
                            id: 'utr_base_style'
                        })
                        .change(function () {
                            // Check if user triggered the cloned select and
                            // match both selected options.
                            if ( $( this ).attr( 'id' ) === 'utr_base_style' ) {
                                $( '#utr_base_style_clone' ).val( $( this ).val() );
                            } else {
                                $( '#utr_base_style' ).val( $( this ).val() );
                            }
                            var lastStyle = selectedStyle;
                            selectedStyle = getStyle($(this).val());
                            themeState("BASE_STYLE_ID", selectedStyle.id);
                            var utrConfirm;
                            function doStyleChange() {
                                $.universalThemeRoller('getStylesheets', selectedStyle.inputFileUrls, function (data) {
                                    $('.colorpicker.utr-cp').remove();
                                    lessCode = data;

                                    self.removeStylesheets();
                                    self.importStyleSheets(selectedStyle.cssFileUrls || []);

                                    var isThemeRollable = isRollable(selectedStyle);

                                    history = undefined;
                                    historyEvent = {
                                        undoRedo: 0,
                                        size: 0,
                                        pos: -1
                                    };
                                    utrCustomCSS && utrCustomCSS.control.trigger('utr-reset');

                                    utrContainer.closest('.utr').toggleClass('utr--static', !isThemeRollable);
                                    if (isThemeRollable) {
                                        // Style config is copied into modifyVars
                                        modifyVars = $.extend({}, (selectedStyle.config || {}).vars);
                                        self.less.variables = {};
                                        recompile(modifyVars, true, undefined, function () {
                                            commonOnly = true;
                                            themeState('COMMON_ONLY', commonOnly);
                                            themeState('SEARCH', '');
                                            refreshControls("");
                                            $('#tr_search').val('');
                                        }, lessErrorHandler);
                                        utrToolbar.show();
                                        resetSetCurrentAsForReadOnly();
                                    } else {
                                        utrStaticMessage.text(STR.ERROR_UNSUPPORTED_STYLE);
                                        setCustomCSSOutput('');
                                        self.setLessOutput('');
                                        themeState('VARS', {});
                                        utrToolbar.hide();
                                    }


                                    themeState('META', {});
                                    styleHasChanged = false;
                                    resetButton.toggleClass('utr-container__button--disable', true);
                                    toolbarResetButton.toggleClass('utr-toolbar-button--disable', true);
                                    themeState('STYLE_HAS_CHANGED', false);

                                    utrConfirm && utrConfirm.dialog("destroy").remove();

                                    utrBaseStyleControl.next(".utr-container__field--select__container__text").text($('option:selected', utrBaseStyleControl).text());
                                    var updatedUtrAnchorContainer = renderButtons(utrBaseStyleControl);
                                    $(  '#' + C_UTR_TAB_ID_PREFIX + 'ThemeStyle' + ' .utr-container__buttons' ).replaceWith(updatedUtrAnchorContainer);
                                    if (!isThemeRollable) {
                                        showSetCurrentAsForReadOnly();
                                    }
                                }, function (error) {

                                    utrContainer.closest('.utr').toggleClass('utr--static', true);
                                    utrStaticMessage.text(STR.ERROR_INPUT_NOT_FOUND);
                                    setCustomCSSOutput('');
                                    self.setLessOutput('');
                                    themeState('VARS', {});

                                    utrToolbar.hide();

                                    themeState('META', {});
                                    styleHasChanged = false;
                                    themeState('STYLE_HAS_CHANGED', false);

                                    utrConfirm && utrConfirm.dialog("destroy").remove();

                                    utrBaseStyleControl.next(".utr-container__field--select__container__text").text($('option:selected', utrBaseStyleControl).text());

                                });
                            }

                            if (styleHasChanged) {
                                utrConfirm = $(document.createElement("div")).addClass("utr-container").attr("title", STR.COMMON_WARNING);
                                var utrConfirmBody = $(document.createElement("div"))
                                    .addClass("utr-container__body")
                                    .text(STR.CHANGE_PROMPT);
                                utrConfirm.append(utrConfirmBody);
                                $('body').append(utrConfirm);
                                var buttons = {};
                                buttons[STR.COMMON_CANCEL] = function () {
                                    utrConfirm.dialog('close');
                                };
                                buttons[STR.CHANGE_THEME] = doStyleChange;
                                utrConfirm.dialog({
                                    dialogClass: "utr",
                                    modal: true,
                                    resizable: false,
                                    position: {
                                        my: "center center",
                                        at: "center center",
                                        of: $(window)
                                    },
                                    create: function (event) { $(event.target).dialog("widget").css({ "position": "fixed" }); },
                                    buttons: buttons,
                                    close: function (event, ui) {
                                        selectedStyle = lastStyle;
                                        utrBaseStyleControl.val(selectedStyle.id);
                                        utrBaseStyleControl.next(".utr-container__field--select__container__text").text($('option:selected', utrBaseStyleControl).text());
                                        themeState("BASE_STYLE_ID", selectedStyle.id);
                                        $(this).dialog('destroy').remove();
                                    }
                                });
                            } else {
                                doStyleChange();
                            }
                        });

                    for (var i = existingStyles.length - 1; i >= 0; i--) {
                        var name = getNameFromStyle(existingStyles[i]);
                        utrBaseStyleControl.prepend(
                            $(document.createElement('option'))
                                .attr('value', existingStyles[i].id)
                                .text(name)
                        );
                    }
                    utrBaseStyleControl.val(baseStyleId);

                    var utrAccordionWrapper = $(document.createElement('div')).addClass('utr-container__accordion');

                    var utrAnchorContainer = renderButtons(utrBaseStyleControl);

                    // BEGIN FEATURE THEME ROLLER LOGO EDITOR
                    gThemeStyleTab$.prepend(utrToolbar);

                    lThemeStyleTabContent$.prepend(
                        utrBaseStyleContainer
                            .append(utrBaseStyleControl)
                            .append(utrBaseStyleLabel)
                            .addClass('utr-container__field--ungrouped')
                    );

                    var utrStaticMessage;

                    var utrBaseStyleControlClone = utrBaseStyleControl.clone(true).prop('id', 'utr_base_style_clone' );
                    var utrBaseStyleClonedContainer = $(document.createElement("div"))
                        .addClass('utr-container__field utr-container__field--select');
                    var utrBaseStyleLabelClone = $(document.createElement("label"))
                        .attr('for', 'utr_base_style_clone')
                        .text(STR.COMMON_BASE_STYLE);
                    
                    utrBaseStyleClonedContainer
                        .append( utrBaseStyleControlClone)
                        .append( utrBaseStyleLabelClone)
                        .addClass('utr-container__field--ungrouped');

                    lThemeStyleTabContent$.append(utrAccordionWrapper);
                    lThemeStyleTabContent$.append(
                        $(document.createElement('div'))
                            .addClass('utr-container__field utr-container__field--static-message')
                            .append(
                                utrStaticMessage = $(document.createElement('p'))
                                    .text(STR.ERROR_UNSUPPORTED_STYLE)
                            ).append(utrBaseStyleClonedContainer)
                    );
                    gThemeStyleTab$.append(utrAnchorContainer);

                    $('body').append(utrContainer);

                    var position = themeState('DIALOG_POSITION');

                    gTabsContainer$.append(gThemeStyleTab$);
                    gTabsContainer$.append(gLogoTab$);
                    utrContainer.append(gTabsContainer$);
                    // END FEATURE THEME ROLLER LOGO EDITOR
                    utrContainer.find("select").each(readySelectList);

                    var uiPosition;
                    utrContainer.dialog({
                        dialogClass: "utr utr--main",
                        resizable: false,
                        width: 340,
                        position: uiPosition = (position === null ? {
                            my: "right top",
                            at: "right-12 top+92",
                            of: $(window)
                        } : {
                                my: "left top",
                                at: "left+" + position.left + " top+" + position.top,
                                of: $(window)
                            }),
                        create: function (event) { $(event.target).dialog("widget").css({ "position": "fixed" }); },
                        open: function (event, ui) {
                            self.opened = true;
                            themeState('OPENED', true);
                        },
                        dragStop: function (event, ui) {
                            uiPosition = {
                                my: "left top",
                                at: "left+" + ui.position.left + " top+" + ui.position.top,
                                of: $(window)
                            };
                            themeState("DIALOG_POSITION", ui.position);
                        },
                        close: closeUTR
                    });

                    adjustUTRHeight();

                    var colorPickerDialog = $(document.createElement("div"))
                        .addClass("d3colorpicker")
                        .on('click', function (event) {
                            event.stopPropagation();
                        })
                        .attr('tabindex', 1);

                    $(document).mouseup(function (e) {
                        if (!colorPickerDialog.is(e.target) && colorPickerDialog.has(e.target).length === 0) {
                            colorPickerDialog.hide();
                        }
                    });

                    utrContainer.parent().append(colorPickerDialog);

                    utrContainer.closest(".utr")
                        .find(".ui-dialog-title")
                        .prepend(
                            $(document.createElement("i"))
                                .addClass("a-Icon icon-theme-roller")
                                .css("margin-right", "8px")
                        );

                    var utrMinimizeButton = $(document.createElement("div"))
                        .addClass("ui-dialog-titlebar__minimize")
                        .append(
                            $(document.createElement("div"))
                                .addClass("ui-dialog-titlebar__minimize__content a-Icon icon-tr-collapse")
                        );

                    utrMinimizeButton.data("utr-minimized", false);
                    utrMinimizeButton.on("click", function () {
                        $(this).parent().next().toggle();

                        if (!$(this).data("utr-minimized")) {
                            $(this)
                                .find(".ui-dialog-titlebar__minimize__content")
                                .removeClass("icon-tr-collapse")
                                .addClass("icon-tr-expand");
                        } else {
                            $(this)
                                .find(".ui-dialog-titlebar__minimize__content")
                                .removeClass("icon-tr-expand")
                                .addClass("icon-tr-collapse");
                        }

                        $(this).data("utr-minimized", !$(this).data("utr-minimized"));
                    });

                    utrContainer.closest(".utr")
                        .find(".ui-dialog-titlebar")
                        .append(
                            utrMinimizeButton
                        );

                    var timer;
                    $(window).on('resize.utr-positioning', function (eventObject) {
                        timer && clearTimeout(timer);
                        timer = setTimeout(function () {
                            utrContainer.dialog({
                                position: uiPosition
                            });

                            adjustUTRHeight.call(this, eventObject);
                        }, 50);
                    });

                    $.universalThemeRoller('getStylesheets', selectedStyle.inputFileUrls, function (code) {
                        lessCode = code || '/* There is no code. There is nothing. */';

                        self.disableCurrentStylesheets(currentThemeStylesheets);
                        self.removeStylesheets();
                        self.importStyleSheets(selectedStyle.cssFileUrls || []);
                        self.setLessOutput('');

                        self.less.variables = {};
                        if (!isRollable(selectedStyle)) {
                            utrContainer.closest(".utr").addClass('utr--static');
                            utrToolbar.hide();
                            self.busy = false;
                            showSetCurrentAsForReadOnly();
                        } else {
                            resetSetCurrentAsForReadOnly();
                            /* BEGIN FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
                            recompile(modifyVars, true, undefined, function () {
                                /* END FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
                                $("#tr_search").val(localStorageSearch);
                                refreshControls(localStorageSearch);

                                setCustomCSSOutput(css);
                                self.busy = false;
                                /* BEGIN FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */
                            }, function (pError) {
                                lessErrorHandler(pError);
                                /* END FEATURE #THEME_ROLLER_0001 SEARCH BUGFIX */
                                self.busy = false;
                            });
                        }

                        // BEGIN FEATURE THEME ROLLER LOGO EDITOR
                        gTabs$.aTabs({ classPrefix: "apex-rds", showAllScrollOffset: function () { return false; } });
                        // END FEATURE THEME ROLLER LOGO EDITOR
                        utrContainer.find( "#utrTabLogo_tab a" ).trigger( 'click' );
                    }, function (error) {
                        isOpenAndValid = false;
                        utrStaticMessage.text(STR.ERROR_INPUT_NOT_FOUND);
                        utrToolbar.hide();
                        utrContainer.closest('.utr').toggleClass('utr--static', true);

                        // BEGIN FEATURE THEME ROLLER LOGO EDITOR
                        gTabs$.aTabs({ classPrefix: "apex-rds", showAllScrollOffset: function () { return false; } });
                        // END FEATURE THEME ROLLER LOGO EDITOR
                    });
                }
            }, function (pData) {
                self.busy = false;
                modalAlert(STR.ERROR, STR.ERROR_LOAD_FAILED)();
                debug.log(pData.responseJSON.error);
                themeState('OPENED', false);
                toggleNested(self, false);
            });

        }, function (pData) {
            self.busy = false;
            modalAlert(STR.ERROR, STR.LOGO_LOAD_ERROR)();
            debug.log(pData.responseJSON.error);
            themeState('OPENED', false);
            toggleNested(self, false);
        });

        function backupLogo(override) {
            if (gOriginalLogoLinkElement$ === undefined || override) {
                gOriginalLogoLinkElement$ = getLogoLinkElement()
                    .clone();
            }
        }
    }

    var isOpenAndValid = false;
    /* BEGIN FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
    /**
     * Returns a JS object containing the current Theme Roller configuration
     * It can be imported by the config function (Passing it as a parameter),
     * which is publicly exposed as apex.utr.config()
     * @return Object The Theme Roller Configuration Object
     */
    function getConfigurationObject() {
        if (isOpenAndValid) {
            return {
                vars: $.extend({}, (selectedStyle.config || {}).vars, modifyVars),
                customCSS: utrCustomCSS.editor$.codeEditor("getValue"),
                useCustomLess: utrCustomCSS.lessToggleControl.prop("checked")
            };
        }
    }
    /* END FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
    function config(cfg) {
        if (isOpenAndValid) {
            if (cfg) {
                /* BEGIN FEATURE #THEME_ROLLER_0003_003 UPLOAD BUTTON */
                if ("useCustomLess" in cfg) {
                    themeState("USE_CUSTOM_LESS", !!cfg.useCustomLess);
                    utrCustomCSS.lessToggleControl.prop("checked", themeState("USE_CUSTOM_LESS"));
                }
                /* END FEATURE #THEME_ROLLER_0003_003 UPLOAD BUTTON */
                utrCustomCSS.editor$.codeEditor("setValue", cfg.customCSS);
                setCustomCSSOutput(themeState("CUSTOM_CSS", cfg.customCSS));
                modifyVars = themeState("VARS", $.extend({}, (selectedStyle.config || {}).vars, cfg.vars));
                recompile(modifyVars);
                styleHasChanged = true;
                resetButton.toggleClass("utr-container__button--disable", false);
                toolbarResetButton.toggleClass("utr-toolbar-button--disable", false);
                themeState('STYLE_HAS_CHANGED', true);
            } else {
                /* BEGIN FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
                // Call the recently created function to get the configuration instead of doing it manually
                console.log(STR.CONFIG_OUTPUT + '\n\napex.utr.config(' + JSON.stringify(getConfigurationObject()) + ');');
                /* END FEATURE #THEME_ROLLER_0003_001 DOWNLOAD BUTTON */
            }
        }
    }

    if (!self.nested) {
        self.invoke = invokeUTR;
        self.close = closeUTR;
        self.config = config;
    }
})(apex.jQuery || jQuery, apex.lang, apex.storage, apex.debug);
