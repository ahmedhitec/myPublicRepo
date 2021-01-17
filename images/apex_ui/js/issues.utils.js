/*!
 Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
*/
apex.issues = {};
(function ($) {

    "use strict";

    function addHeaderButton(pOptions) {
        var toolbarData = pOptions.toolbar.data;
        toolbarData[0].controls.unshift({
            type: 'BUTTON',
            label: apex.lang.getMessage("APEX.ISSUES.JS.HEADING"),
            iconOnly: true,
            icon: 'fa fa-header',
            action: 'addHeader'
        });
    }

    function getImageLocation(pImageName, pIssueIdItemName) {
        var location = window.location.href.split('?')[0];
        var instanceId = $v('pInstance');
        var issueId = $v(pIssueIdItemName);
        location += '?p=4600:100:' +
            instanceId +
            ':APPLICATION_PROCESS=getAttachment:NO::P100_ISSUE_ID,P100_FILE_NAME_SLUG:' +
            issueId + ',' +
            pImageName;
        return location;
    }

    // exports
    apex.issues = {

        addHeadButton: addHeaderButton,

        replacePrefixImage: function (pText, pIssueIdItemName) {
            var prefix = "(#ISSUE_FILE#";
            var postfix = ")";
            var buffer = [];
            for (var i = 0; i < pText.length; i++) {
                var index = pText.indexOf(prefix, i);
                if (index >= 0) {
                    var end = pText.indexOf(postfix, index + 1);
                    if (end < 0) {
                        i = index + prefix.length;
                        continue;
                    }
                    var imageName = pText.substring(index + prefix.length, end);
                    buffer.push({
                        imageName: imageName,
                        path: getImageLocation(imageName, pIssueIdItemName)
                    });
                    i = end + 1;
                } else {
                    i = pText.length;
                }
            }
            buffer.forEach(function (i) {
                pText = pText.replace(prefix + i.imageName + postfix, '(' + i.path + ')');
            });
            return pText;
        },

        /**
         * Invoke this function inside the initialization code of the markdown
         * editor as follow:
            apex.issues.addAttachButton(options,
                'P100_ALLOW_ISSUE_FILES_YN',
                'P100_COMMENT',
                'P100_ATTACH_FILES_TARGET_URL');
         */
        addAttachButton: function (pOptions,
            pAllowAttachFilesItemName, pCommentItemName, pTargetUrlItemName) {
            var allowAttach = $v(pAllowAttachFilesItemName);
            addHeaderButton(pOptions);
            if (allowAttach == 'Y') {
                pOptions
                    .toolbar
                    .data[pOptions.toolbar.data.length - 1]
                    .controls
                    .unshift(
                        {
                            type: 'BUTTON',
                            label: apex.lang.getMessage("APEX.ISSUES.JS.ATTACH_FILES"),
                            iconOnly: true,
                            icon: 'fa fa-paperclip',
                            action: 'attach_files'
                        }
                    );
            }
            pOptions.toolbar.actions.push({
                name: 'attach_files',
                action: function () {
                    var INTERNAL_CLOSE_EVENT = 'apexclosedialoginternal';
                    window.location.assign($v(pTargetUrlItemName));
                    apex.util.getTopApex().gPageContext$
                        .off(INTERNAL_CLOSE_EVENT)
                        .on(INTERNAL_CLOSE_EVENT, function (e, data) {
                            var filesInfoArray,
                                urlPrefix = '#ISSUE_FILE#',
                                i,
                                len,
                                file,
                                fileName,
                                fileUrl,
                                loadImagePrefix;
                            if (data && data.P109_FILES_INFO) {
                                filesInfoArray = JSON.parse(data.P109_FILES_INFO);
                                len = filesInfoArray.length;
                                for (i = 0; i < len; i++) {
                                    file = filesInfoArray[i];
                                    fileName = file.n;
                                    fileUrl = urlPrefix + file.slug;
                                    loadImagePrefix = file.isImage ? '!' : '';
                                    var data = loadImagePrefix + '[' + fileName + '](' + fileUrl + ')';
                                    var item = apex.item(pCommentItemName);
                                    var text = item.getValue();
                                    item.setValue(text + data);
                                }

                                // trigger refresh
                                $('#issueTimeline').trigger('apexrefresh');
                            }
                        });
                }
            });
        }
    };
})(apex.jQuery);