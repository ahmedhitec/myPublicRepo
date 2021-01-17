/*!
 Copyright (c) 2020, Oracle and/or its affiliates. All rights reserved.
*/
/*
 * The {@link apex.widget}.fileBrowse is used for the file browse widget of Oracle Application Express.
 */
/*global apex*/
(function (item, $, util, debug, lang, message) {
    "use strict";

    var STYLE_NATIVE = "NATIVE",
        STYLE_INLINE = "INLINE",
        STYLE_DROPZONE_INLINE = "DROPZONE_INLINE",
        STYLE_DROPZONE_BLOCK = "DROPZONE_BLOCK",
        CONTAINER_ELEMENT = "div.apex-item-filedrop",
        ITEM_GROUP_ELEMENT = "div.apex-item-group--file";

    // APEX item interface
    var fileItemPrototype = {
        item_type: "FILE",
        enable: function () {
            this.element.prop("disabled", false);
            this.element.parents(ITEM_GROUP_ELEMENT).removeClass("apex_disabled");
        },
        disable: function () {
            this.element.prop("disabled", true);
            this.element.parents(ITEM_GROUP_ELEMENT).addClass("apex_disabled");
        },
        isDisabled: function () {
            return this.element.prop("disabled") === true;
        },
        setValue: function (pValue) {
            if (pValue) {
                debug.error("This input element accepts a filename, which may only be programmatically set to the empty string.");
            } else {
                this.element.val("");
            }
        },
        getValue: function () {
            var value,
                files = this.element[0].files;

            value = getFileNames(files);
            return value;
        },
        getValidity: function () {
            var validity = this.element.prop("validity") || {},
                newValidity = $.extend({}, validity); // deep clone validity object, thus it's readonly and can't be changed!

            if (this.element.attr("data-valid-message")) {
                newValidity.valid = false;
                newValidity.badInput = true;
                newValidity.customError = true;
                return newValidity;
            } else {
                return newValidity || { valid: true };
            }
        },
        getValidationMessage: function () {
            return this.element.attr("data-valid-message");
        }
    };

    /**
     * Main function which handles all item specific features, called from item.addAttachHandler
     * @param {object} context$
     */
    function updateSingleFile(context$) {
        // loop over all file items
        $("input[type='file'].apex-item-file", context$).each(function () {
            var item$ = $(this),
                itemId = util.escapeCSS(this.id),
                displayStyle = item$.data("display-style") || "INLINE";

            //
            // Rendered as legacy native file (additional markup handled by theme42.js)
            //
            if (displayStyle === STYLE_NATIVE) {
                item$.on("change", function (e) {
                    // client side validations
                    validate(item$, this.files);
                });
            }

            //
            // Rendered as inline file or dropzone
            //
            if (displayStyle === STYLE_INLINE || displayStyle === STYLE_DROPZONE_INLINE || displayStyle === STYLE_DROPZONE_BLOCK) {
                // register events
                // file input change
                item$.on("change", function (e) {
                    var files = this.files,
                        fileName = "",
                        that$ = $(this),
                        label$ = that$.next(CONTAINER_ELEMENT).find(".apex-item-filedrop-filename");

                    if (files && files.length > 1) {
                        fileName = lang.formatMessage("APEX.ITEM.FILE.FILES_WITH_COUNT", files.length);
                    } else {
                        if (files[0]) {
                            fileName = files[0].name;
                        }
                    }

                    if (fileName) {
                        label$.text(fileName);
                    } else {
                        label$.text("");
                    }

                    if (files && files.length > 0) {
                        that$.next(CONTAINER_ELEMENT).addClass("has-files");
                        that$.next(CONTAINER_ELEMENT).find(".apex-item-filedrop-description").hide();
                    } else {
                        that$.next(CONTAINER_ELEMENT).removeClass("has-files");
                        that$.next(CONTAINER_ELEMENT).find(".apex-item-filedrop-description").show();
                    }

                    // client side validations
                    validate(item$, files);
                });

                // open file picker / click
                item$.next(CONTAINER_ELEMENT).click(function (e) {
                    item$.click();
                });

                // dragover
                item$.next(CONTAINER_ELEMENT)[0].addEventListener("dragover", function (e) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy"; // cursor: copy
                    item$.focus();
                    item$.next(CONTAINER_ELEMENT).addClass("is-dragging");
                });

                // dragleave
                item$.next(CONTAINER_ELEMENT)[0].addEventListener("dragleave", function (e) {
                    e.preventDefault();
                    item$.blur();
                    item$.next(CONTAINER_ELEMENT).removeClass("is-dragging");
                });

                // drop
                item$.next(CONTAINER_ELEMENT)[0].addEventListener("drop", function (e) {
                    e.preventDefault();
                    item$.blur();
                    item$.next(CONTAINER_ELEMENT).removeClass("is-dragging");
                    if (!item$.prop("disabled")) {
                        item$[0].files = e.dataTransfer.files; // this is not supported by IE, thus input.files is readonly
                        item$.change();
                    }
                });

                // show progress when page gets submitted
                // just add data-show-progress="true" to items custom attributes
                if (item$.data("show-progress")) {
                    var reloadOnSubmit = $("#pReloadOnSubmit").val() || "A";
                    // only when relead on success = always
                    // thus we have no event which fires when e.g. a validation fails, so we can't hide the progress bar again
                    if (reloadOnSubmit === "A") {
                        $(document).on("apexbeforepagesubmit", function (e, request) {
                            if (item$[0].files.length > 0) {
                                item$.next(CONTAINER_ELEMENT).addClass("is-loading");
                            }
                        });
                    }
                }
            }

            // Create APEX item interface
            item.create(itemId, fileItemPrototype);
        });
    } // updateSingleFile

    // register updateSingleFile to run again when needed
    item.addAttachHandler(updateSingleFile);

    //
    // Helper functions
    //

    /**
     * Get file names from files object
     * @param {object} pFiles
     * @returns {array}
     */
    function getFileNames(pFiles) {
        var files = pFiles || [];
        var fileNames = [];

        for (var i = 0; i < files.length; i++) {
            fileNames.push(files[i].name);
        }
        return fileNames;
    }

    /**
     * Remove duplicate entries from an array with sub-objects
     * @param {array} pArray
     * @returns {array}
     */
    function removeDuplicates(pArray) {
        var array = pArray || [];
        var newArray = [];

        newArray = array.filter(function (v, i, a) {
            return (
                a.findIndex(function (t) {
                    return JSON.stringify(t) === JSON.stringify(v);
                }) === i
            );
        });
        return newArray;
    }

    //
    // Client side validations
    //

    /**
     * Validate mime type of a given file
     * see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept for supported patterns
     * @param {array} pAcceptedTypes
     * @param {object} pFile
     * @returns {boolean}
     */
    function isValidMimeType(pAcceptedTypes, pFile) {
        var mimeType = pFile.type.toLowerCase(),
            fileName = pFile.name.toLowerCase(),
            acceptedTypes = pAcceptedTypes || [];

        function mimeTypeMatchesWildCard(pMimeType, pWildcard) {
            var mimeTypeGroup = (/^[^/]+/.exec(pMimeType) || []).pop(), // image/png -> image
                wildcardGroup = pWildcard.slice(0, -2); // image/* -> image
            return mimeTypeGroup === wildcardGroup;
        };

        function getExtensionFromFilename(pFileName) {
            return pFileName.split(".").pop();
        };

        function extensionMatchesType(pFileName, pAcceptedType) {
            var fileExtension = getExtensionFromFilename(pFileName), // test.pdf -> pdf
                acceptedType = pAcceptedType.slice(1); // .pdf -> pdf
            return fileExtension === acceptedType;
        };

        return acceptedTypes.some(function (acceptedType) {
            // accepted is wildcard mime type
            if (/\*$/.test(acceptedType)) {
                return mimeTypeMatchesWildCard(mimeType, acceptedType);
            }
            // accepted is file extension
            if (/^\./.test(acceptedType)) {
                return extensionMatchesType(fileName, acceptedType);
            }
            // is normal mime type
            return acceptedType === mimeType;
        });
    }

    /**
     * Validate mime type of all file input files & generate error object
     * @param {object} pItem$
     * @param {array} pAcceptedTypes
     * @param {object} pFiles
     * @param {array} pErrorArray
     * @returns {array}
     */
    function validateMimeTypes(pItem$, pAcceptedTypes, pFiles, pErrorArray) {
        var errorArray = pErrorArray || [];
        for (var i = 0; i < pFiles.length; i++) {
            if (!isValidMimeType(pAcceptedTypes, pFiles[i])) {
                errorArray.push({
                    type: "error",
                    location: ["inline"],
                    pageItem: pItem$.attr("id"),
                    message: lang.formatMessageNoEscape("APEX.ITEM.FILE.ACCEPTED_TYPES", pAcceptedTypes), // no escape because mime types could contain /*
                    unsafe: true
                });
            }
        }
        return errorArray;
    }

    /**
     * Validate max. file size of a given file
     * @param {number} pMaxFileSize
     * @param {object} pFile
     * @returns {boolean}
     */
    function isValidFileSize(pMaxFileSize, pFile) {
        var fileSize = pFile.size;

        if (fileSize > pMaxFileSize * 1024) {
            return false;
        }
        return true;
    }

    /**
     * Validate max. file size of all file input files & generate error object
     * @param {object} pItem$
     * @param {number} pMaxFileSize
     * @param {object} pFiles
     * @param {array} pErrorArray
     * @returns {array}
     */
    function validateMaxFileSize(pItem$, pMaxFileSize, pFiles, pErrorArray) {
        var errorArray = pErrorArray || [];

        function displayFileSize(size) {
            var units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
                unit,
                displayValue,
                i = 0;

            // get unit
            while (size >= 1024) {
                size /= 1024;
                ++i;
            }
            unit = units[i];

            // get size
            i = 0;
            while (size >= 1024) {
                size /= 1024;
                ++i;
            }
            if (i < 2) {
                // no floating until MB
                displayValue = size.toFixed(0);
            } else {
                displayValue = size.toFixed(1);
            }

            return displayValue + " " + unit;
        };

        for (var i = 0; i < pFiles.length; i++) {
            if (!isValidFileSize(pMaxFileSize, pFiles[i])) {
                errorArray.push({
                    type: "error",
                    location: ["inline"],
                    pageItem: pItem$.attr("id"),
                    message: lang.formatMessage("APEX.ITEM.FILE.MAX_FILE_SIZE", displayFileSize(pMaxFileSize * 1024)),
                    unsafe: false
                });
            }
        }
        return errorArray;
    }

    /**
     * Main validation function which validates it all
     * @param {object} pItem$
     * @param {object} pFiles
     */
    function validate(pItem$, pFiles) {
        var errorArray = [],
            acceptedTypes = pItem$.attr("accept"),
            maxFileSize = parseInt(pItem$.data("max-file-size")),
            acceptedTypesArray = [],
            files = pFiles || [];

        if (files.length > 0) {
            // validate mime types
            if (acceptedTypes && errorArray.length === 0) {
                acceptedTypesArray = acceptedTypes.split(",").map(function (item) {
                    return item.trim().toLowerCase();
                });
                errorArray = validateMimeTypes(pItem$, acceptedTypesArray, files, errorArray);
            }
            // validate max file size
            if (maxFileSize && errorArray.length === 0) {
                errorArray = validateMaxFileSize(pItem$, maxFileSize, files, errorArray);
            }
            // remove duplicate entries, e.g. 2 files with the same validation error
            errorArray = removeDuplicates(errorArray);

            // reset "valid-message" data attribute --> used for getValidaty
            if (errorArray.length === 0) {
                message.clearErrors();
                pItem$.removeAttr("data-valid-message");
                // output errors and set "valid-message" data attribute
            } else if (errorArray.length > 0) {
                message.clearErrors();
                message.showErrors(errorArray);

                pItem$.attr(
                    "data-valid-message",
                    errorArray
                        .map(function (elem) {
                            return elem.message;
                        })
                        .join(",")
                );
                pItem$.val("").change();
            }
        }
    }
})(apex.item, apex.jQuery, apex.util, apex.debug, apex.lang, apex.message);