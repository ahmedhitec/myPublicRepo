/* global apex,monaco */

/*
 * Registers the "quicksql" language in the Monaco Editor.
 * Also exposes $.apex.codeEditor.performExtraQuicksqlHighlight
 */

(function ($, msg, util) {
    "use strict";
    var gKeywords = ["/api", "/audit", "/auditcols", "/audit columns", "/between", "/check", "/constant", "cols", "columns", "/colprefix", "/compress", "/compressed", "drop", "/default", "/fk", "genpk", "/invisible", "/hidden",
        "/history", "/idx", "/index", "/indexed", "/insert", "/lower", "pk", "prefix", "/pk", "/references", "/reference", "/rest", "schema", "/select", "/unique",
        "/upper", "verbose", "view", "/values", '/nn', '/not null', 'and'];
    var gTypes = ["d", "date", "ts", "time", "timestamp", "tstz", "tswtz", "local", "with", "blob", "char", "clob", "file", "int", "integer", "json", "num", "number", "string", "varchar", "varchar2", "vc", "vc32k"];

    var colTypeHints = [
        {
            label: 'num, number',
            insertText: 'num',
            detail: 'NUMBER',
        }, {
            label: 'int, integer',
            insertText: 'int',
            detail: 'INTEGER',
        }, {
            label: 'd, date',
            insertText: 'date',
            detail: 'DATE',
        }, {
            label: 'ts, timestamp',
            insertText: 'timestamp',
            detail: 'TIMESTAMP'
        }, {
            label: 'tstz, tswtz, timestamp with local time zone',
            insertText: 'tstz',
            detail: 'TIMESTAMP WITH LOCAL TIMEZONE'
        }, {
            label: 'char, vc, varchar, varchar2, string',
            insertText: 'vc',
            detail: 'VARCHAR2(4000)'
        }, {
            label: 'vcNNN, vc(NNN)',
            insertText: 'vc${0:NNN}',
            detail: msg('QUICKSQL.HELP.NNN')
        }, {
            label: 'vc32k',
            detail: 'VARCHAR2(32767)'
        }, {
            label: 'clob',
            detail: 'CLOB'
        }, {
            label: 'blob',
            detail: 'BLOB'
        }, {
            label: 'json',
            detail: 'CLOB CHECK (<' + msg('QUICKSQL.HELP.COLUMN_NAME') + '> IS JSON)'
        }, {
            label: 'file',
            detail: msg('QUICKSQL.HELP.FILE_DATATYPE')
        }
    ];

    var tableDirHints = [
        {
            label: '/api',
            detail: msg('QUICKSQL.HELP.API')
        }, {
            label: '/audit',
            detail: msg('QUICKSQL.HELP.AUDIT')
        }, {
            label: '/auditcols',
            detail: msg('QUICKSQL.HELP.AUDITCOLS')
        }, {
            label: '/colprefix',
            insertText: '/colprefix ${0:prefix}',
            detail: msg('QUICKSQL.HELP.COLPREFIX'),
        }, {
            label: '/compress',
            detail: msg('QUICKSQL.HELP.COMPRESSED')
        }, {
            label: '/history',
            detail: msg('QUICKSQL.HELP.HISTORY')
        }, {
            label: '/insert',
            insertText: '/insert ${0:NNN}',
            detail: msg('QUICKSQL.HELP.INSERT'),
        }, {
            label: '/rest',
            detail: msg('QUICKSQL.HELP.REST')
        }, {
            label: '/select',
            detail: msg('QUICKSQL.HELP.SELECT')
        }, {
            label: '/unique',
            detail: msg('QUICKSQL.HELP.TABLE_UNIQUE')
        }
    ];

    var colDirHints = [
        {
            label: '/index /idx /indexed',
            insertText: '/index',
            detail: msg('QUICKSQL.HELP.INDEX'),
        }, {
            label: '/unique',
            detail: msg('QUICKSQL.HELP.UNIQUE'),
        }, {
            label: '/check',
            insertText: '/check ${0:val1,val2,...}',
            detail: msg('QUICKSQL.HELP.CHECK')
        }, {
            label: '/constant',
            insertText: '/constant ${0:value}',
            detail: msg('QUICKSQL.HELP.CONSTANT')
        }, {
            label: '/default',
            insertText: '/default ${0:value}',
            detail: msg('QUICKSQL.HELP.DEFAULT')
        }, {
            label: '/values',
            insertText: '/values ${0:dummy1,dummy2,...}',
            detail: msg('QUICKSQL.HELP.VALUES')
        }, {
            label: '/upper',
            detail: msg('QUICKSQL.HELP.UPPER')
        }, {
            label: '/lower',
            detail: msg('QUICKSQL.HELP.LOWER')
        }, {
            label: '/nn /not null',
            insertText: '/nn',
            detail: msg('QUICKSQL.HELP.NOTNULL')
        }, {
            label: '/between',
            insertText: '/between ${0:min and max}',
            detail: msg('QUICKSQL.HELP.BETWEEN')
        }, {
            label: '/invisible /hidden',
            insertText: '/invisible',
            detail: msg('QUICKSQL.HELP.HIDDEN')
        }, {
            label: '/fk /reference /references',
            insertText: '/fk ${0:table name}',
            detail: msg('QUICKSQL.HELP.FK')
        }, {
            label: '/pk',
            detail: msg('QUICKSQL.HELP.PK')
        }
    ];

    // returns 'comment', 'view', 'table', 'column', 'blank' or 'unknown'
    function getLineType(model, lineNumber) {
        var lineContent = model.getLineContent(lineNumber).toLowerCase(),
            hasText = /\w/.test(lineContent),
            spaces = lineContent.search(/\S|$/),
            lineCount = model.getLineCount(),
            hasNextLine = lineNumber < lineCount,
            hasPreviousLine = lineNumber > 1,
            lineType;

        if (lineContent.length == 0) {
            lineType = 'blank';
        } else if (lineContent.startsWith('#')) {
            lineType = 'comment';
        } else if (lineContent.startsWith('view')) {
            lineType = 'view';
        } else if (hasText && spaces == 0) {
            lineType = 'table';
        } else if (hasText && hasNextLine) {
            var nextLineContent = model.getLineContent(lineNumber + 1),
                nextLineSpaces = nextLineContent.search(/\S|$/);
            lineType = (nextLineSpaces > spaces) ? 'table' : 'column';
        } else if (hasText && hasPreviousLine) {
            var previousLineContent = model.getLineContent(lineNumber - 1),
                previousLineSpaces = previousLineContent.search(/\S|$/);
            lineType = (previousLineSpaces <= spaces) ? 'column' : 'unknown';
        }
        return lineType || 'unknown';
    }

    // returns an array of the tables names declared so far
    function getTableNames(model) {
        var tables = [];
        for (var i = 1; i <= model.getLineCount(); i++) {
            var lineContent = model.getLineContent(i);
            if (getLineType(model, i) == 'table') {
                tables.push(lineContent.trim().split(' ')[0]);
            }
        }
        return tables;
    }

    // Register new language
    monaco.languages.register({ id: 'quicksql' });

    // Register a tokens provider for the language
    monaco.languages.setMonarchTokensProvider('quicksql', {
        keywords: gKeywords,
        atoms: [],
        types: gTypes,
        dates: [],
        ignoreCase: true,
        tokenizer: {
            root: [
                // highlighting view lines
                [/(view)(\s+)([^\s]+)(\s+)(.+)/, ['keywords', 'whitespace', 'view', 'whitespace', 'table']],
                /* highlights top level table names to avoid flickering
                 * lower level table names must unfortunately be highlighted via javascript
                 * and will therefore flicker as you type around them
                 */
                [/^\w+/, 'table'],
                // highlighting table names as arguments of /fk, /references, or /reference 
                [/(\/fk|\/reference|\/references)(\s+)(\w+)/, ['keywords', 'whitepace', 'table']],
                [/\s{1}/, 'whitespace'],
                [/[0-9]/, 'number'],
                [/(vc\d*k?)/, 'types'],
                // highlights list values after /values or /check but stops at comments
                // todo: allow for other valid tokens to come after
                [/(\/values|\/check)(\s+)(.+)(\s+)(\[[a-zA-Z 0-9:]+\])/, ['keywords', 'whitespace', 'list', 'whitespace', 'comment']],
                [/(\/values|\/check)(\s+)(.+)/, ['keywords', 'whitespace', 'list']],
                // allows for comments to follow the above rule
                [/(#.*)/, 'comment'],               // quicksql comment 
                [/--.*$/, 'comment'],               // table or column comment
                [/\[[a-zA-Z 0-9:]+\]/, 'comment'],  // table or column comment
                [/[\/a-z_$][\w$]*/, {
                    cases: {
                        '@keywords': 'keywords',
                        '@types': 'types',
                        '@default': 'default',
                    }
                }]
            ]
        }
    });

    // Register a completion item provider for the new language
    monaco.languages.registerCompletionItemProvider('quicksql', {
        triggerCharacters: ['/'],
        provideCompletionItems: function (model, position, context) {

            var lineContent = model.getLineContent(position.lineNumber),
                currentWord = model.getWordAtPosition(position),
                previousWords, previousWord,
                wordStartChar,
                wordStartColumn,
                wordEndColumn,
                suggestions = [];

            var lineType = getLineType(model, position.lineNumber);

            if (!currentWord) {
                currentWord = {
                    word: '',
                    startColumn: position.column,
                    endColumn: position.column
                };
            }

            wordStartChar = lineContent.charAt(currentWord.startColumn - 2);

            if (wordStartChar == ',') {
                // if the last character is a comma, we're probably adding to some list
                // so autocomplete is not necesarry
                return [];
            }

            if (wordStartChar == '/') {
                wordStartColumn = currentWord.startColumn - 1;
            } else {
                wordStartColumn = currentWord.startColumn;
            }
            wordEndColumn = currentWord.endColumn;

            previousWords = (lineContent.substr(0, position.column)).split(/\s+/);
            previousWord = previousWords[previousWords.length - 2];

            if (['/fk', '/references', '/reference'].includes(previousWord) ||
                (lineType == 'view' && previousWords.length >= 3)) {
                suggestions = getTableNames(model).map(function(tableName){
                    return {
                        label: tableName
                    };
                });
            } else if (['/values', '/check', '/between', '/default', '/constant', '/colprefix', '/insert'].includes(previousWord)) {
                // not showing suggestions for words that come right after these values
                return;
            } else if (['table', 'column'].includes(lineType)) {
                if (!/\w+\s/.test(lineContent)) {
                    // if no table or column name been set, there's no need to show suggestions yet
                    suggestions = [];
                } else if (lineType == 'table') {
                    suggestions = tableDirHints;
                } else if (lineType == 'column') {
                    suggestions = colDirHints.concat(colTypeHints);
                }
            }

            var newSuggestions = [];
            for (var i = 0; i < suggestions.length; i++) {
                newSuggestions.push({
                    label: suggestions[i].label,
                    insertText: suggestions[i].insertText || suggestions[i].label,
                    detail: suggestions[i].detail,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: wordStartColumn,
                        endColumn: wordEndColumn
                    }
                });
            }

            return { suggestions: newSuggestions };
        }
    });

    // Unfortunately the language defined so far cannot recognize intented table names
    // To overcome this, we update the DOM via JavaScript whenever the content changes
    $.apex.codeEditor.performExtraQuicksqlHighlight = function (editor) {

        function highlightTables(model, lineNumber, line$) {
            if (getLineType(model, lineNumber) == 'table') {
                line$.children().filter(function () {
                    return $(this).text().trim();
                }).first().addClass('quicksql-table');
            }
        }

        function customHighlight(editor) {
            var lines$ = $('div.view-line', editor.getDomNode()),
                line$,
                viewportStartLine = Math.max(editor._modelData.viewModel.viewportStartLine, 1),
                lines = [];

            lines$.each(function (i) {
                line$ = $(this);
                var topValue = line$.get(0).style.top.replace('px', '');
                lines.push({
                    top: parseInt(topValue),
                    line$: line$.children().first()
                });
            });

            // Sort Lines by Top value
            // Lines are not always ordered in DOM, its position depens on the style top value
            // Table lines highlighting is based on lines position and indentation, so lines need to be ordered.
            lines.sort(function (a, b) {
                if (a.top > b.top) {
                    return 1;
                }
                if (a.top < b.top) {
                    return -1;
                }
                return 0;
            });

            // Check each line and apply proper custom highlighting
            for (var i = 0; i < lines.length; i++) {
                highlightTables(editor.getModel(), viewportStartLine + i, lines[i].line$);
            }
        }

        var debouncedHighlight = util.debounce(function(){
            customHighlight(editor);
        }, 100);

        editor.onDidChangeModelContent(function () {
            debouncedHighlight();
        });

        editor.onDidScrollChange(function () {
            debouncedHighlight();
        });

        debouncedHighlight();
    };

})(apex.jQuery, apex.lang.getMessage, apex.util);