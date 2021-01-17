/**
 * Copyright (c) 2014, 2016, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 */
define(['./DvtToolkit'], function(dvt) {
  "use strict";
  // Internal use only.  All APIs and functionality are subject to change at any time.

!function(t){t.PictoChart=function(t,e,i){this.Init(t,e,i)},t.Obj.createSubclass(t.PictoChart,t.BaseComponent),t.PictoChart.newInstance=function(e,i,n){return new t.PictoChart(e,i,n)},t.PictoChart.prototype.Init=function(e,o,r){t.PictoChart.superclass.Init.call(this,e,o,r),this.EventManager=new i(this),this.EventManager.addListeners(this),t.Agent.isTouchDevice()||this.EventManager.setKeyboardHandler(new s(this.EventManager)),this.Defaults=new n(e),this._items=[],"blink"!==t.Agent.engine&&"safari"!==t.Agent.browser||this.getCtx().removeSizingSvg()},t.PictoChart.prototype._getPreferredSize=function(e,i){if(!e||!i){var n=l.getInfo(this,e,i);this._info=n,e||(e=n.items?n.colCount*n.colWidth:0),i||(i=n.items?n.rowCount*n.rowHeight:0)}return new t.Dimension(e,i)},t.PictoChart.prototype.render=function(e,i,n){this._oldContainer=this._container;var o=this._markers,r=this.Width?this.Width:0,s=this.Height?this.Height:0;this.EventManager.hideTooltip(),this._items=[],this._markers=[],this._info=null,this._emptyText&&(this._container.removeChild(this._emptyText),this._emptyText=null),this.StopAnimation(),this.SetOptions(e);var a=this.getCtx();if(i||n)this.Width=i,this.Height=n;else{a.getSvgDocument().style.display="block";var h=this._getPreferredSize();t.ToolkitUtils.setSvgSize(a,h.w,h.h);var c=t.ToolkitUtils.getOuterDivSize(a);h.w==c.w&&h.h!=c.h?(this.Height=c.h,h=this._getPreferredSize(null,this.Height),t.ToolkitUtils.setSvgSize(a,h.w,this.Height),this.Width=t.ToolkitUtils.getOuterDivSize(a).w):h.w!=c.w&&h.h==c.h?(this.Width=c.w,h=this._getPreferredSize(this.Width,null),t.ToolkitUtils.setSvgSize(a,this.Width,h.h),this.Height=t.ToolkitUtils.getOuterDivSize(a).h):(this.Width=c.w,this.Height=c.h),this.Width==h.w&&this.Height==h.h||(this._info=null)}if(this._container=new t.Container(a),this.addChild(this._container),l.render(this,this._container,new t.Rectangle(0,0,this.Width,this.Height),this._info),this._oldContainer){if("none"!=this.Options.animationOnDataChange&&e){var g=new t.DataAnimationHandler(a,null);g.constructAnimation(o,this._markers),this.Animation=g.getAnimation()}}else this.Animation=this._getAnimationOnDisplay();this.Animation?(t.ToolkitUtils.setSvgSize(a,Math.max(r,this.Width),Math.max(s,this.Height)),this.EventManager.removeListeners(this),this._emptyText&&this._container.removeChild(this._emptyText),this.Animation.setOnEnd(this._onRenderEnd,this),this.Animation.play()):this._onRenderEnd()},t.PictoChart.prototype.SetOptions=function(e){e?this.Options=this.Defaults.calcOptions(e):this.Options||(this.Options=this.GetDefaults()),t.Agent.isEnvironmentTest()&&(this.Options.animationOnDisplay="none",this.Options.animationOnDataChange="none");var i=this.Options.selectionMode;this._selectionHandler="single"==i?new t.SelectionHandler(this.getCtx(),t.SelectionHandler.TYPE_SINGLE):"multiple"==i?new t.SelectionHandler(this.getCtx(),t.SelectionHandler.TYPE_MULTIPLE):null,this.EventManager.setSelectionHandler(this._selectionHandler)},t.PictoChart.prototype._onRenderEnd=function(){var e;this._oldContainer&&(this.removeChild(this._oldContainer),this._oldContainer.destroy(),this._oldContainer=null),this.Animation&&(this.EventManager.addListeners(this),this._emptyText&&this._container.addChild(this._emptyText)),t.ToolkitUtils.setSvgSize(this.getCtx(),this.Width,this.Height);for(var i=0;i<this._items.length&&"none"==(e=this._items[i]).getShape();i++);this.EventManager.setFocusObj(e),this._selectionHandler&&this._selectionHandler.processInitialSelections(this.Options.selection,this._items),t.CategoryRolloverHandler.highlight(this.Options.highlightedCategories,this._items,"any"==this.Options.highlightMatch),this.UpdateAriaAttributes(),this.AnimationStopped||this.RenderComplete(),this.Animation=null,this.AnimationStopped=!1},t.PictoChart.prototype.registerItems=function(t){this._items=t},t.PictoChart.prototype.getItems=function(){return this._items},t.PictoChart.prototype.registerMarker=function(t){this._markers.push(t)},t.PictoChart.prototype.registerEmptyText=function(t){this._emptyText=t},t.PictoChart.prototype.getTotalCount=function(){for(var t=0,e=0;e<this._items.length;e++)t+=this._items[e].getCount();return t},t.PictoChart.prototype.getAnimationDuration=function(){return t.CSSStyle.getTimeMilliseconds(this.Options.animationDuration)/1e3},t.PictoChart.prototype._getAnimationOnDisplay=function(){var e=this.Options.animationOnDisplay,i=this.getAnimationDuration(),n=this.getCtx(),o=new t.Rectangle(0,0,this.Width,this.Height);if(t.BlackBoxAnimationHandler.isSupported(e))return t.BlackBoxAnimationHandler.getInAnimation(n,e,this._container,o,i);var r=[];if("popIn"==e)for(var s=0;s<this._markers.length;s++){var a=this._markers[s];r.push(new t.AnimPopIn(n,a,!0,i))}else if("none"!=e){for(s=0;s<this._markers.length;s++){a=this._markers[s];var h,c,g=new t.CustomAnimation(n,a,i);l.isVertical(this)?(h=l.isOriginRight(this)?this.Width:0,c=a.getCx(),a.setCx(h),g.getAnimator().addProp(t.Animator.TYPE_NUMBER,a,a.getCx,a.setCx,c)):(h=l.isOriginBottom(this)?this.Height:0,c=a.getCy(),a.setCy(h),g.getAnimator().addProp(t.Animator.TYPE_NUMBER,a,a.getCy,a.setCy,c)),r.push(g)}r.push(t.BlackBoxAnimationHandler.getInAnimation(n,t.BlackBoxAnimationHandler.ALPHA_FADE,this._container,o,i))}return r.length>0?new t.ParallelPlayable(n,r):null},t.PictoChart.prototype.highlight=function(e){var i=this.getOptions();i.highlightedCategories=t.JsonUtils.clone(e),t.CategoryRolloverHandler.highlight(e,this.getItems(),"any"==i.highlightMatch)},t.PictoChart.prototype.select=function(e){this.getOptions().selection=t.JsonUtils.clone(e),this._selectionHandler&&this._selectionHandler.processInitialSelections(e,this.getItems())},t.PictoChart.prototype.getAutomation=function(){return this._automation||(this._automation=new e(this)),this._automation};var e=function(t){this._picto=t};t.Obj.createSubclass(e,t.Automation),e.prototype.GetSubIdForDomElement=function(t){var e=this._picto.getEventManager().GetLogicalObject(t);return e&&e instanceof r?"item["+this._picto.getItems().indexOf(e)+"]":null},e.prototype.getDomElementForSubId=function(e){if(e==t.Automation.TOOLTIP_SUBID)return this.GetTooltipElement(this._picto);var i=e.indexOf("[");if(i>0&&"item"===e.substring(0,i)){var n=parseInt(e.substring(i+1,e.length-1)),o=this._picto.getItems()[n];return o?o.getElem():null}return null},e.prototype.getItem=function(t){var e=this._picto.getItems()[t];if(e){var i={};return i.color=e.getDatatipColor(),i.tooltip=e.getDatatip(),i.id=e.getId(),i.name=e.getName(),i.count=e.getCount(),i.selected=e.isSelected(),i}return null},e.prototype.getItemCount=function(){return this._picto.getItems().length};var i=function(t){this.Init(t.getCtx(),t.dispatchEvent,t,t),this._picto=t};t.Obj.createSubclass(i,t.EventManager),i.prototype.ProcessRolloverEvent=function(e,i,n){var o=this._picto.getOptions();if("none"!=o.hoverBehavior){var r=i.getCategories?i.getCategories():[];o.highlightedCategories=n?r.slice():null;var s=t.EventFactory.newCategoryHighlightEvent(o.highlightedCategories,n),a=t.CSSStyle.getTimeMilliseconds(o.hoverBehaviorDelay);this.RolloverHandler.processEvent(s,this._picto.getItems(),a,"any"==o.highlightMatch)}},i.prototype.OnClickInternal=function(t){var e=this.GetLogicalObject(t.target);e&&(e.isSelectable&&e.isSelectable()||this.processDrillEvent(e))},i.prototype.OnDblClickInternal=function(t){var e=this.GetLogicalObject(t.target);e&&e.isSelectable&&e.isSelectable()&&this.processDrillEvent(e)},i.prototype.HandleTouchHoverEndInternal=function(t){var e=this.GetLogicalObject(t.target);e&&(e.isSelectable&&e.isSelectable()||this.processDrillEvent(e))},i.prototype.HandleTouchClickInternal=function(t){var e=this.GetLogicalObject(t.target);e&&(e.isSelectable&&e.isSelectable()||this.processDrillEvent(e))},i.prototype.HandleTouchDblClickInternal=function(t){var e=this.GetLogicalObject(t.target);e&&e.isSelectable&&e.isSelectable()&&(t.preventDefault(),t.stopPropagation(),this.processDrillEvent(e))},i.prototype.processDrillEvent=function(e){e instanceof r&&e.isDrillable()&&this.FireEvent(t.EventFactory.newDrillEvent(e.getId()))};var n=function t(e){this.Init({alta:t.VERSION_1},e)};t.Obj.createSubclass(n,t.BaseComponentDefaults),n.VERSION_1={animationOnDisplay:"none",animationOnDataChange:"none",animationDuration:750,drilling:"off",hiddenCategories:[],highlightedCategories:[],highlightMatch:"all",hoverBehavior:"none",hoverBehaviorDelay:200,layout:"horizontal",layoutOrigin:"topStart",selection:[],selectionMode:"none",_defaultColor:"#a6acb1",_noneShapeColor:"rgba(255,255,255,0)",_defaultSize:32,_defaultShape:"rectangle",_gapRatio:.25,_textStyle:new t.CSSStyle(t.BaseComponentDefaults.FONT_FAMILY_ALTA_13+"color: #252525;"),_statusMessageStyle:new t.CSSStyle(t.BaseComponentDefaults.FONT_FAMILY_ALTA_13+"color: #252525;"),_tooltipLabelStyle:new t.CSSStyle(""),_tooltipValueStyle:new t.CSSStyle("")},n.prototype.getAnimationDuration=function(t){return t.animationDuration};var o=function t(e,i,n,o,r,s,a,l,h,c){t.superclass.Init.call(this,e.getCtx(),i,n,o,r,null,s,a,l,h,c),this._picto=e};t.Obj.createSubclass(o,t.ImageMarker),o.prototype.animateUpdate=function(e,i){var n=new t.CustomAnimation(this.getCtx(),this,.75*this._picto.getAnimationDuration()),o=n.getAnimator(),r=this._getAnimationParams();this._setAnimationParams(i._getAnimationParams()),o.addProp(t.Animator.TYPE_NUMBER_ARRAY,this,this._getAnimationParams,this._setAnimationParams,r),i.setAlpha(0),e.add(n,1)},o.prototype.animateDelete=function(e){e.add(new t.AnimFadeOut(this.getCtx(),this,.5*this._picto.getAnimationDuration()),0)},o.prototype.animateInsert=function(e){this.setAlpha(0),e.add(new t.AnimFadeIn(this.getCtx(),this,.5*this._picto.getAnimationDuration()),2)},o.prototype._getAnimationParams=function(){return[this.getCx(),this.getCy(),this.getWidth(),this.getHeight()]},o.prototype._setAnimationParams=function(t){this.setCx(t[0]),this.setCy(t[1]),this.setWidth(t[2]),this.setHeight(t[3])};var r=function(t,e){this.Init(t,e)};t.Obj.createSubclass(r,t.Container),r._counter=0,r.prototype.Init=function(e,i){r.superclass.Init.call(this,e.getCtx(),null,i.id),this._picto=e,this._item=i,this._id=null!=i.id?i.id:null!=i.name?i.name:"_defaultId"+r._counter,r._counter++,this._isNoneShape="none"==i.shape,this._isSelected=!1,this._isShowingKeyboardFocusEffect=!1,this._keyboardTooltipLocation=new t.Point(0,0),(this.isSelectable()||this.isDrillable())&&this.setCursor(t.SelectionEffectUtils.getSelectingCursor()),e.getEventManager().associate(this,this)},r.prototype.getColSpan=function(){var t=this._item.columnSpan;return null!=t&&t>=0?Math.round(t):1},r.prototype.getRowSpan=function(){var t=this._item.rowSpan;return null!=t&&t>=0?Math.round(t):1},r.prototype.getCount=function(){var t=this._item.count;return null!=t?Math.max(t,0):1},r.prototype.getShape=function(){return this._item.shape||this._picto.getOptions()._defaultShape},r.prototype.getColor=function(){return this._isNoneShape?this._picto.getOptions()._noneShapeColor:this._item.color||this._picto.getOptions()._defaultColor},r.prototype.getBorderColor=function(){return this._item.borderColor},r.prototype.getBorderWidth=function(){return this._item.borderWidth},r.prototype.getClassName=function(){return this._item.className||this._item.svgClassName},r.prototype.getStyle=function(){return this._item.style||this._item.svgStyle},r.prototype.getSource=function(){return this._item.source},r.prototype.getSourceSelected=function(){return this._item.sourceSelected},r.prototype.getSourceHover=function(){return this._item.sourceHover},r.prototype.getSourceHoverSelected=function(){return this._item.sourceHoverSelected},r.prototype.getName=function(){return this._item.name},r.prototype.getId=function(){return this._id},r.prototype.getShortDesc=function(){return this._item.shortDesc},r.prototype.isDrillable=function(){if(this._isNoneShape)return!1;var t=this._item.drilling;return t&&"inherit"!=t?"on"==t:"on"==this._picto.getOptions().drilling},r.prototype.isDoubleClickable=function(){return this.isSelectable()&&this.isDrillable()&&!this._isNoneShape},r.prototype.updateAriaAttributes=function(){this.setAriaRole("img"),this._updateAriaLabel()},r.prototype.getDatatip=function(e){if(this._isNoneShape)return"";var i=this._picto.getOptions(),n=this._picto.getOptions().tooltip,o=n?n.renderer:null;if(o){var r=this._picto.getCtx().getTooltipManager(),s={id:this.getId(),name:this.getName(),count:this.getCount(),color:this.getColor()};return r.getCustomTooltip(o,s)}if(null!=this.getShortDesc())return this.getShortDesc();var a=[],l=this.getName();l&&a.push(t.HtmlTooltipManager.createElement("td",i._tooltipLabelStyle,l,["oj-dvt-datatip-label"])),a.push(t.HtmlTooltipManager.createElement("td",i._tooltipValueStyle,this._getCountString(),["oj-dvt-datatip-value"]));var h=t.HtmlTooltipManager.createElement("tr",null,a);return t.HtmlTooltipManager.createElement("table",null,[h],["oj-dvt-datatip-table"])},r.prototype.getDatatipColor=function(){return this.getColor()},r.prototype._getCountString=function(){return t.ResourceUtils.format(this._picto.getOptions().translations.labelCountWithTotal,[this.getCount(),this._picto.getTotalCount()])},r.prototype.isSelectable=function(){return"none"!=this._picto.getOptions().selectionMode&&!this._isNoneShape},r.prototype.isSelected=function(){return this._isSelected},r.prototype.setSelected=function(t){this._isSelected=t,this._updateAriaLabel();for(var e=0;e<this.getNumChildren();e++){var i=this.getChildAt(e);(i instanceof a||i instanceof o)&&i.setSelected(t)}},r.prototype.showHoverEffect=function(){for(var t=0;t<this.getNumChildren();t++){var e=this.getChildAt(t);(e instanceof a||e instanceof o)&&e.showHoverEffect()}},r.prototype.hideHoverEffect=function(){for(var t=0;t<this.getNumChildren();t++){var e=this.getChildAt(t);(e instanceof a||e instanceof o)&&e.hideHoverEffect()}},r.prototype.getDisplayables=function(){return[this]},r.prototype.getAriaLabel=function(){var e,i=[],n=this._picto.getOptions().translations;this.isSelectable()&&i.push(n[this.isSelected()?"stateSelected":"stateUnselected"]),this.isDrillable()&&i.push(n.stateDrillable);var o=this.getName();return e=null!=this.getShortDesc()?this.getShortDesc():null==o?this._getCountString():t.ResourceUtils.format(n.labelAndValue,[o,this._getCountString()]),t.Displayable.generateAriaLabel(e,i)},r.prototype._updateAriaLabel=function(){t.Agent.deferAriaCreation()||this.setAriaProperty("label",this.getAriaLabel())},r.prototype.getCategories=function(t){return this._item._itemData?this._item.categories:this._item.categories||[this.getId()]},r.prototype.getNextNavigable=function(e){var i=this._picto.getEventManager().getKeyboardHandler();return e.type==t.MouseEvent.CLICK||i.isMultiSelectEvent(e)?this:i.isNavigationEvent(e)?s.getNextNavigable(this._picto,this,e):null},r.prototype.getKeyboardBoundingBox=function(t){return this.getDimensions(t)},r.prototype.getTargetElem=function(){return this.getElem()},r.prototype.showKeyboardFocusEffect=function(){this._isNoneShape||(this._isShowingKeyboardFocusEffect=!0,this.showHoverEffect())},r.prototype.hideKeyboardFocusEffect=function(){this._isNoneShape||(this._isShowingKeyboardFocusEffect=!1,this.hideHoverEffect())},r.prototype.isShowingKeyboardFocusEffect=function(){return this._isShowingKeyboardFocusEffect},r.prototype.setKeyboardTooltipLocation=function(t){this._keyboardTooltipLocation=t},r.prototype.getKeyboardTooltipLocation=function(){return this._keyboardTooltipLocation};var s=function(t){this.Init(t)};t.Obj.createSubclass(s,t.KeyboardHandler),s.prototype.isSelectionEvent=function(t){return this.isNavigationEvent(t)&&!t.ctrlKey},s.prototype.isMultiSelectEvent=function(e){return e.keyCode==t.KeyboardEvent.SPACE&&e.ctrlKey},s.getNextNavigable=function(e,i,n,o){var r=e.getItems();if(o||(o=i),"none"==i.getShape()&&i!=o){var a=r.indexOf(i);if(0==a||a==r.length-1)return o}var h=l.isOriginRight(e),c=l.isOriginBottom(e),g=l.isVertical(e),p=i,u=n.keyCode==t.KeyboardEvent.LEFT_ARROW&&h||n.keyCode==t.KeyboardEvent.RIGHT_ARROW&&!h||n.keyCode==t.KeyboardEvent.UP_ARROW&&c||n.keyCode==t.KeyboardEvent.DOWN_ARROW&&!c,d=n.keyCode==t.KeyboardEvent.LEFT_ARROW&&g||n.keyCode==t.KeyboardEvent.RIGHT_ARROW&&g||n.keyCode==t.KeyboardEvent.UP_ARROW&&!g||n.keyCode==t.KeyboardEvent.DOWN_ARROW&&!g,m=r.indexOf(i)+(u?1:-1);return d?p=t.KeyboardHandler.getNextNavigable(i,n,r):m<r.length&&m>=0&&(p=r[m]),"none"==p.getShape()&&(p=p!=i?s.getNextNavigable(e,p,n,o):o),p},s.prototype.processKeyDown=function(e){var i=this._eventManager.getFocus();return i&&e.keyCode==t.KeyboardEvent.ENTER?(this._eventManager.processDrillEvent(i),t.EventManager.consumeEvent(e),i):s.superclass.processKeyDown.call(this,e)};var a=function t(e,i,n,o,r,s,a){t.superclass.Init.call(this,e.getCtx(),"none"==i?null:i,n,o,r,s,null,!0,!0,a),this._picto=e};t.Obj.createSubclass(a,t.SimpleMarker),a.prototype.animateUpdate=function(e,i){var n=new t.CustomAnimation(this.getCtx(),this,.75*this._picto.getAnimationDuration()),o=n.getAnimator(),r=this.getFill(),s=i.getFill();s.equals(r)||(this.setFill(s),o.addProp(t.Animator.TYPE_FILL,this,this.getFill,this.setFill,r));var a=this._getAnimationParams();this._setAnimationParams(i._getAnimationParams()),o.addProp(t.Animator.TYPE_NUMBER_ARRAY,this,this._getAnimationParams,this._setAnimationParams,a),i.setAlpha(0),e.add(n,1)},a.prototype.animateDelete=function(e){e.add(new t.AnimFadeOut(this.getCtx(),this,.5*this._picto.getAnimationDuration()),0)},a.prototype.animateInsert=function(e){this.setAlpha(0),e.add(new t.AnimFadeIn(this.getCtx(),this,.5*this._picto.getAnimationDuration()),2)},a.prototype._getAnimationParams=function(){return[this.getCx(),this.getCy(),this.getWidth(),this.getHeight()]},a.prototype._setAnimationParams=function(t){this.setCx(t[0]),this.setCy(t[1]),this.setWidth(t[2]),this.setHeight(t[3])};var l={};t.Obj.createSubclass(l,t.Obj),l.render=function(e,i,n,r){var s=e.getCtx(),h=new t.Rect(s,n.x,n.y,n.w,n.h);if(h.setInvisibleFill(),i.addChild(h),r||(r=l.getInfo(e,n.w,n.h)),r.items){e.registerItems(r.items);for(var c=e.getOptions()._gapRatio*r.minSpan,g=l.isVertical(e),p=l.isOriginBottom(e),u=l.isOriginRight(e),d=new t.Map2D,m=0,_=0,f=0,v=0;v<r.items.length;v++){var y=r.items[v],C=y.getColSpan(),S=y.getRowSpan();if(!(C<=0||S<=0)){for(var b,A=C*r.colWidth,E=S*r.rowHeight,O=y.getCount(),w=0,D=!0;O>0&&(C==m&&S==_||(f=0),0==f&&(b=l._findNextAvailableCell(d,C,S,r.colCount,r.rowCount,g)),null!=b);){var H,I,M,T,x,P,R=b.col*r.colWidth+A/2,N=b.row*r.rowHeight+E/2,k=n.x+(u?n.w-R:R),L=n.y+(p?n.h-N:N),W=Math.min(1-f,O);if(g?(H=k-A/2,I=p?L+E*(.5-W-f):L+E*(f-.5),M=A,T=E*W):(H=u?k+A*(.5-W-f):k+A*(f-.5),I=L-E/2,M=A*W,T=E),1==W?(x=y.getId()+"_"+w,w++):x=Math.random(),y.getSource())P=new o(e,k,L,A,E,y.getSource(),y.getSourceSelected(),y.getSourceHover(),y.getSourceHoverSelected(),x+"_I");else{var F=new t.Rect(s,H,I,M,T);F.setInvisibleFill(),y.addChild(F),(P=new a(e,y.getShape(),k,L,A-r.colWidth*c,E-r.rowHeight*c,x+"_S")).setSolidFill(y.getColor()),P.setSolidStroke(y.getBorderColor(),null,y.getBorderWidth()),P.setDataColor(y.getColor()),P.setClassName(y.getClassName()),P.setStyle(y.getStyle())}if(W<1){var B=new t.ClipPath;B.addRect(H,I,M,T),P.setClipPath(B)}D&&(y.setKeyboardTooltipLocation(new t.Point(k,L)),D=!1),y.addChild(P),e.registerMarker(P),O-=W,f=(f+W)%1}i.addChild(y),y.updateAriaAttributes(),m=C,_=S}}}else l.renderEmptyText(e,i,n)},l.getInfo=function(e,i,n){var o=e.getOptions(),s=o.items;if(!s)return{};for(var a=t.ArrayUtils.createBooleanMap(o.hiddenCategories),h=[],c=0,g=1,p=1,u=1/0,d=0;d<s.length;d++)if(null!=s[d]){var m=new r(e,s[d]);if(!a||!t.ArrayUtils.hasAnyMapItem(a,m.getCategories())){var _=m.getColSpan(),f=m.getRowSpan();_<=0||f<=0||(_>g&&(g=_),f>p&&(p=f),_<u&&(u=_),f<u&&(u=f),c+=_*f*m.getCount(),h.push(m))}}if(0==c)return{};var v=o.columnWidth,y=o.rowHeight;i&&n||(v||(v=y||o._defaultSize),y||(y=v));var C=l.isVertical(e),S=o.columnCount,b=o.rowCount;return S||b||(i&&n?C?b=l._ceil(Math.sqrt(c*n/i),p):S=l._ceil(Math.sqrt(c*i/n),g):i?S=Math.max(Math.floor(i/v),1):n?b=Math.max(Math.floor(n/y),1):C?b=l._ceil(Math.sqrt(c),p):S=l._ceil(Math.sqrt(c),g)),S?b||(b=l._ceil(c/S,p)):S=l._ceil(c/b,g),i&&n&&(v||(v=y||Math.min(i/S,n/b)),y||(y=v)),S<=0||b<=0||v<=0||y<=0?{}:{items:h,colCount:S,rowCount:b,colWidth:v,rowHeight:y,minSpan:u}},l._ceil=function(t,e){return Math.ceil(t/e)*e},l._findNextAvailableCell=function(t,e,i,n,o,r){if(r){var s=l._findNextAvailableCell(t,i,e,o,n,!1);return s?{col:s.row,row:s.col}:null}for(var a=0;a<o-i+1;a++)for(var h=0;h<n-e+1;h++)if(l._areCellsAvailable(t,h,a,e,i))return l._occupyCells(t,h,a,e,i),{col:h,row:a};return null},l._areCellsAvailable=function(t,e,i,n,o){for(var r=0;r<o;r++)for(var s=0;s<n;s++)if(t.get(e+s,i+r))return!1;return!0},l._occupyCells=function(t,e,i,n,o){for(var r=0;r<o;r++)for(var s=0;s<n;s++)t.put(e+s,i+r,!0)},l.renderEmptyText=function(e,i,n){var o=e.getOptions(),r=o.translations.labelNoData,s=t.TextUtils.renderEmptyText(i,r,n.clone(),e.getEventManager(),o._statusMessageStyle);e.registerEmptyText(s)},l.isVertical=function(t){return"vertical"==t.getOptions().layout},l.isOriginBottom=function(t){var e=t.getOptions().layoutOrigin;return"bottomStart"==e||"bottomEnd"==e},l.isOriginRight=function(e){var i=e.getOptions().layoutOrigin,n="topEnd"==i||"bottomEnd"==i;return t.Agent.isRightToLeft(e.getCtx())?!n:n}}(dvt);
  return dvt;
});
