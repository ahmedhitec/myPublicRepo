define(["exports","ojs/ojcachediteratorresultsdataprovider","ojs/ojdedupdataprovider","ojs/ojmutateeventfilteringdataprovider"],function(e,t,i,l){"use strict";t=t&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t,i=i&&Object.prototype.hasOwnProperty.call(i,"default")?i.default:i,l=l&&Object.prototype.hasOwnProperty.call(l,"default")?l.default:l,e.getEnhancedDataProvider=function(e,a){var o,n,r,d=null===(o=null==a?void 0:a.capabilities)||void 0===o?void 0:o.fetchCapability,p=null===(n=null==a?void 0:a.capabilities)||void 0===n?void 0:n.dedupCapability,u=null===(r=null==a?void 0:a.capabilities)||void 0===r?void 0:r.eventFilteringCapability,v=e.getCapability("fetchCapability"),c=e.getCapability("dedup"),y=e.getCapability("eventFiltering"),b=!0,s=!0,f=!0,g=null==v?void 0:v.caching;"none"!=(null==d?void 0:d.caching)&&"all"!=g&&"visitedByCurrentIterator"!=g||(b=!1);var j=null==c?void 0:c.type;"none"!=(null==p?void 0:p.type)&&"global"!=j&&"iterator"!=j||(s=!1);var h=null==y?void 0:y.type;"none"!=(null==u?void 0:u.type)&&"global"!=h&&"iterator"!=h||(f=!1);var C=e;return b&&(C=new t(C)),s&&(C=new i(C)),f&&(C=new l(C)),C},Object.defineProperty(e,"__esModule",{value:!0})});