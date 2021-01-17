// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// QuickSql mode

var onLoad = false;

function onLoadSample() {  onLoad = true; }

function cleanReservedWords( pLine, quickSqlEditor$ ){
  var childnodes = quickSqlEditor$
                   .children().eq( pLine )
                   .children().eq( 1 )
                   .children().eq( 0 )
                   .children();
   var index = 0;
   while ( childnodes[index] ) {
     var child   = childnodes.eq( index );
     var classes = child.attr('class');
     if ( classes !== undefined ) {
       if ( classes.includes("cm-keyword") ||
            classes.includes("cm-variable-2") ||
            classes.includes("cm-number") ){
         child.removeClass("cm-tablename");
       }
     }

     index += 1;
  }
}

function removeDuplicatedTableName( pLine, quickSqlEditor$ ) {
  var childnodes = quickSqlEditor$
                   .children().eq( pLine )
                   .children().eq( 1 )
                   .children().eq( 0 )
                   .children();
  var index = 0;
  while ( childnodes[index] ) {
    var child   = childnodes.eq( index );
    var classes = child.attr('class');

    if ( classes !== undefined ){
      var tablenameCount = 0;
      classes.split(' ').forEach(function( itemClass ){
        if( itemClass.includes("cm-tablename") ){
          tablenameCount += 1;
          if ( tablenameCount >= 2 ) {
              child.removeClass("cm-tablename");
              child.addClass( "cm-tablename" );
            return;
          }
        }
      });
    }
    index += 1;
  }
}

function highlightLine( pLine ,pCodemirror, pFrom, pTo, pClassName ) {
  pCodemirror.markText(
    { line: pLine, ch: pFrom, sticky: null },
    { line: pLine, ch: pTo, sticky: null },
    { className: pClassName }
  );
}

function checkLines( pCurrentLineContent, pCodemirror, pLine ) {
  var indx = 0,
      from = 0,
      to = 0,
      applyClass = false,
      isReservedWord = true,
      className = "",
      content = pCurrentLineContent.childNodes;

  function coordinates( index ){ from = to; to += content[index].innerText.length; }

  while ( content[indx] ) {
      if ( !!content[indx].data ) {
         from = to;
         to += content[indx].data.length;

         if ( content[indx].data.includes("/") ) { applyClass = false; }
         else { applyClass = true; }

      } else if ( content[indx].className === "cm-keyword" ) {
          from = to;
          applyClass = false;
          to += content[indx].innerText.length;
          if ( content[indx].innerText ==="/check" ) {
             className = "cm-string"; isReservedWord = false;
          } else if( content[indx].innerText === "/values" ) {
            className = "cm-type"; isReservedWord = false;
          }
          else { isReservedWord = true; }
      } else if ( content[indx].className.includes(" cm-tablename") ) {
        coordinates( indx );
        applyClass = false; isReservedWord = false;
        className = "cm-tablename";
      } else {
        coordinates( indx );
      }

      if ( applyClass && !isReservedWord ) {
        highlightLine( pLine, pCodemirror, from, to, className );
      }
      indx++;
  }
}

function getTableNames( pAllLines ,pCodemirror, pLine ) {
    var next = "";
    var current = $( pAllLines[pLine] ).find( 'pre.CodeMirror-line>span' )[0];
    var indexLines = pLine + 1;

    while ( pAllLines[indexLines] ) {
      next = $( pAllLines[indexLines] ).find( 'pre.CodeMirror-line>span' )[0].innerText;
      if ( /[a-zA-Z]/.test(next) ) { break; }
       indexLines++;
    }

    var currentWidthSpace = current.innerText.search(/\S|$/);
    var nextWidthSpace = next.search(/\S|$/);
    var indexCurrent = 0;
    var quickSqlEditor$ =  $( pCodemirror.display.wrapper ).find(".CodeMirror-code");
    var currentChilds = quickSqlEditor$
                     .children().eq( pLine )
                     .children().eq( 1 )
                     .children().eq( 0 )
                     .children().eq( 0 );

    if( currentWidthSpace < nextWidthSpace ) {
        if( current.innerText.length > 1 ) {
             while ( current.childNodes[indexCurrent] ) {
                 //It's necessary to remove tablename class from reserved words
                 cleanReservedWords( pLine, quickSqlEditor$ );
                 if( !!current.childNodes[indexCurrent].innerText ) {
                     break;
                 } else {
                     var wordLength = current.childNodes[indexCurrent].data.length;
                     highlightLine( pLine ,pCodemirror, currentWidthSpace, wordLength, "cm-tablename" );
                     // In some cases codeMirror apply DOM prev states, so it's necessary to remove duplicated classes
                     removeDuplicatedTableName( pLine, quickSqlEditor$ );
                 }
                  indexCurrent++;
             }
        }
    } else {
      if( current.innerText.length > 1 ) {
          while ( indexCurrent < currentChilds.length ) {
              if ( currentChilds.eq( indexCurrent ).hasClass( "cm-tablename" ) ) {
                 currentChilds.eq( indexCurrent ).contents().unwrap();
              }
              indexCurrent++;
          }
      }
   }
}

function highlightQuickSql( pVal, pCodemirror, pTime ) {
  setTimeout( function() {
    var quickSqlEditor = $( pCodemirror.display.wrapper ).find(".CodeMirror-code");

    var cursor = pCodemirror.getSearchCursor( "quicksql" );
    var childnodes = quickSqlEditor.children();
      $( "span.cm-builtin" ).removeClass( "cm-tablename" );

    var line = 0;
    while ( line < quickSqlEditor[0].childNodes.length ){
      if( !!childnodes[line] ) {
        getTableNames( childnodes, pCodemirror, line );
        checkLines( $( childnodes[line] ).find( 'pre.CodeMirror-line>span' )[0], pCodemirror, line );
      }
      line++;
    }
    if( onLoad ){
       onLoad = false;
       highlightQuickSql( pVal, pCodemirror, 1000 );
    }
  }, pTime );
}

( function ( mod ) {
  if ( typeof exports == "object" && typeof module == "object" )
    mod( require("../5.48.4/lib/codemirror") )
  else if ( typeof define == "function" && define.amd )
    define( ["../5.48.4/lib/codemirror"], mod )
  else
    mod( CodeMirror )
})( function( CodeMirror ) {
  "use strict"

  function wordSet( words ) {
    var set = {}
    for ( var i = 0; i < words.length; i++ ) set[words[i]] = true
    return set
  }

  var datesql          = wordSet(["d","date","ts","timestamp","tstz","tswtz"])
  var support          = wordSet(["apex","api","auditcols","compress","createdbycol","createdcol","db","history","language","longvc","ondelete","overridesettings",
                                  "prefixpkwithtname","resetsettings","rowkey","securitygroupid","rowversion","semantics","updatedbycol","updatedcol"])
  var keywords         = wordSet(["/insert","/","view","drop","pk","prefix","genpk","schema","verbose","/api","/audit","/auditcols","/colprefix","/compress",
                                  "/history","nn","/rest","/select","/idx","/index","/indexed","/unique","/check","/constant","/default",
                                  "/values","/upper","/lower","/between","/hidden","/references","/fk","/pk","-- [comments]"])
  var definingKeywords = wordSet(["view"])
  var atoms            = wordSet(["true","false","/nn","/not","null"])
  var types            = wordSet(["num","number","int","integer","char","vc","varchar","varchar2","vc","vc32k","clob","blob","json","file"])
  var punc             = ":;,.(){}[]"
  var binary           = /^\-?0b[01][01_]*/
  var octal            = /^\-?0o[0-7][0-7_]*/
  var hexadecimal      = /^\-?0x[\dA-Fa-f][\dA-Fa-f_]*(?:(?:\.[\dA-Fa-f][\dA-Fa-f_]*)?[Pp]\-?\d[\d_]*)?/
  var decimal          = /^\-?\d[\d_]*(?:\.\d[\d_]*)?(?:[Ee]\-?\d[\d_]*)?/
  var identifier       = /^\$\d+|(`?)[_A-Za-z][_A-Za-z$0-9]*\1/
  var property         = /^\.(?:\$\d+|(`?)[_A-Za-z][_A-Za-z$0-9]*\1)/
  var attribute        = /^vc(?:\$\d+|(`?)[0-9][0-9_]*\1)/

  // 'string', with char specified in quote escaped by '\'
  function tokenLiteral( quote ) {
    return function( stream, state ) {
      var escaped = false, ch;
      while ( (ch = stream.next() ) != null ) {
        if ( ch == quote && !escaped ) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = backslashStringEscapes && !escaped && ch == "\\";
      }
      return "string";
    };
  }

  function tokenBase ( stream, state, prev ) {
    if ( stream.sol() ) state.indented = stream.indentation()
    if ( stream.eatSpace() ) return null

    var char = stream.next();

     if ( char == "'" || char == '"' ) {
      state.tokenize = tokenLiteral( char );
      return state.tokenize( stream, state );
    }
    if ( char == "#" ){
        stream.skipToEnd();
        return "meta";
    }

    var ch = stream.peek()

    if ( stream.match( binary ) ) return "number"
    if ( stream.match( octal ) ) return "number"
    if ( stream.match( hexadecimal ) ) return "number"
    if ( stream.match( decimal ) ) return "number"
    if ( /[0-9]/.test( stream.current() ) ) return "number"
    if ( stream.match( property ) ) return "property"
    if ( punc.indexOf(ch) > -1 ) {
      stream.next()
      stream.match("..")
      return "punctuation"
    }

    if ( stream.match( identifier ) ) {
      var ident = stream.current()
      if ( ident.match( attribute ) ) return "attribute"
      if ( types.hasOwnProperty( ident ) ) return "variable-2"
      if ( atoms.hasOwnProperty( ident ) ) return "atom"
      if ( support.hasOwnProperty( ident ) ) return "builtin"
      if ( datesql.hasOwnProperty( ident ) ) return "number"
      if ( keywords.hasOwnProperty( ident ) ) {
        if ( definingKeywords.hasOwnProperty( ident ) )
          state.prev = "define"

        return "keyword"
      }
      if ( prev == "define" ) return "def"

      var fullLine = stream.string.split(" ");
      var identPosition = fullLine.indexOf(ident);
      var checkPosition = fullLine.indexOf("/check");
      var valuePosition = fullLine.indexOf("/values");
      //return "variable"
    }

    stream.next()
    return null
  }

  CodeMirror.defineMode( "quicksql", function( config ) {
    return {
      startState: function() {
        return {
          prev: null,
          context: null,
          indented: 0,
          tokenize: []
        }
      },

      token: function( stream, state ) {
        var prev = state.prev
        state.prev = null
        var tokenize = state.tokenize[state.tokenize.length - 1] || tokenBase
        var style = tokenize( stream, state, prev )
        if ( !style || style == "comment" ) state.prev = prev
        else if ( !state.prev ) state.prev = style

        return style
      },

      indent: function( state, textAfter ) {
        var cx = state.context;
        if (!cx) return CodeMirror.Pass;
        var closing = textAfter.charAt(0) == cx.type;
        if (cx.align) return cx.col + (closing ? 0 : 1);
        else return cx.indent + (closing ? 0 : config.indentUnit);
      }
    }
  })

  CodeMirror.defineMIME("text/quicksql","quicksql")
});
