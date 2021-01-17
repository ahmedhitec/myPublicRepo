/*!
 Copyright (c) 2013, 2020, Oracle and/or its affiliates. All rights reserved.
*/
/**
 * The {@link apex.widget.ckeditor5} is used for the Rich Text Editor widget of Oracle Application Express.
 * Internally the CKEditor http://www.ckeditor.com is used.
 * See the CKEditor documentation for available options.
 **/
/*global apex*/
(function(item, lang, util, widget, debug, $) {
    "use strict";
    /**
     * @param {String}   pSelector                  jQuery selector to identify APEX page item(s) for this widget.
     * @param {Object}   [pOptions]                 Optional object holding overriding options.
     * @param {Function} [pPluginInitJavascript]    Optional function which allows overriding or extending of the widget options.
     *
     * @function ckeditor5
     * @memberOf apex.widget
     * */
    widget.ckeditor5 = function(pSelector, pOptions, pPluginInitJavascript) {
    
        // Based on our custom settings, add additional properties to the rich text editor options
        var options  = $.extend(true, {
            editorType: 'classic',
            mode: 'html', // or markdown
            label: null,
            toolbar: 'intermediate',    // or basic or full
            minHeight: 180,
            maxHeight: null,
            executeOnInitialization: null,
            editorOptions: {
                language: 'en',
                extraPlugins: [],
                toolbar: [],
                image: {
                    toolbar: [
                        'imageStyle:full',
                        'imageStyle:side',
                        '|',
                        'imageTextAlternative'
                    ]
                }
            }
        }, pOptions);

        if(options.toolbar == 'basic'){
            options.editorOptions.toolbar = [
                'bold', 'italic', '|',
                'bulletedList', 'numberedList', '|',
                'undo', 'redo'
            ];
        } else if(options.toolbar == 'intermediate') {
            options.editorOptions.toolbar = [
                'heading', '|',
                'bold', 'italic', 'underline', 'strikethrough', '|',
                'link', 'bulletedList', 'numberedList', '|',
                'blockQuote', 'insertTable', '|',
                'undo','redo'
            ];
        } else if(options.toolbar == 'full'){
            options.editorOptions.toolbar = [
                'heading','|',
                'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
                'bold', 'italic', 'underline', 'strikethrough', 'highlight', '|',
                'alignment', 'indent', 'outdent', '|',
                'bulletedList', 'numberedList', 'todoList', '|',
                'link', 'blockQuote', 'pageBreak', 'insertTable', 'mediaEmbed','|',
                'removeFormat', 'undo','redo'
            ];
        }

        if($.isFunction(pPluginInitJavascript)){
            var changeOptions = pPluginInitJavascript(options);
            if (changeOptions) {
                options = changeOptions;
            }
        }

        if(options.mode == 'markdown'){
            options.editorOptions.extraPlugins.push(ClassicEditor.extraPlugins.Markdown);
        }

        var ckeditor;

        switch(options.editorType){
            case 'classic':
                ckeditor = window.ClassicEditor;
                break;
            case 'baloon':
            case 'balloon-block':
                ckeditor = window.BalloonEditor;
                break;
            case 'decoupled-document':
                ckeditor = window.DecoupledEditor;
                break;
            case 'inline':
                ckeditor = window.InlineEditor;
        }

        // Instantiate the CKeditor
        $(pSelector).each(function(){
            var textArea$,
                widgetId = this.id + '_WIDGET';

            textArea$ = $(this);

            textArea$.parent().append('<div id="' + widgetId + '"></div>');
            textArea$.hide();

            var itemName = this.id;
            var editor;
            var initialData = textArea$.val();

            var setFocus = function(){
                editor.editing.view.focus();
            };
            var deferredObject = item.create(itemName, {
                delayLoading: true,
                enable: function() {
                    editor.isReadOnly = false;
                },
                disable: function() {
                    editor.isReadOnly = true;
                },
                setValue: function(pValue) {
                    editor.setData( pValue == null ? '' : '' + pValue ); // using == on purpose to catch undefined
                },
                getValue: function() {
                    return editor.getData();
                },
                displayValueFor: function(value){
                    return util.stripHTML(value.replace(/<p>|<br>/g, ' ')).replace(/&nbsp;/g, ' ')
                },
                setFocusTo: function() {
                    return { focus: setFocus };
                },
                isChanged: function() {
                    return initialData !== editor.getData();
                },
                getEditor: function(){
                    return editor;
                }
            });

            options.editorOptions.initialData = textArea$.val();
            ckeditor
                .create(document.getElementById(widgetId), options.editorOptions)
                .then(function(newEditor){
                    editor = newEditor;

                    editor.editing.view.change(writer => {
                        writer.setStyle('min-height', (options.minHeight || 150) + 'px', editor.editing.view.document.getRoot());
                        if(options.maxHeight){
                            writer.setStyle('max-height', options.maxHeight + 'px', editor.editing.view.document.getRoot());
                        }
                    });

                    var snapshot;
                    editor.editing.view.document.on('change:isFocused', function(evt, data, isFocused){
                        if(isFocused){
                            snapshot = editor.getData();
                        } else if(editor.getData() !== snapshot) {
                            textArea$.trigger('change');
                        }
                    });

                    // the aria label seems to not be configurable, so we simply override it
                    var newLabel = lang.formatMessage('APEX.RICH_TEXT_EDITOR.ACCESSIBLE_LABEL', options.label || '');
                    $('label.ck.ck-label.ck-voice-label', editor.ui.view.element).text(newLabel);

                    if(options.executeOnInitialization){
                        options.executeOnInitialization(editor);
                    }

                    deferredObject.resolve();
                })
                .catch(function(error){
                    debug.error(error);
                });

            // register focus handling, so when the non-displayed textarea of the CKEditor
            // receives focus, focus is moved to the editor.
            textArea$.focus(function(){
                setFocus();
            });
        });
    }; // ckeditor5
})(apex.item, apex.lang, apex.util, apex.widget, apex.debug, apex.jQuery );