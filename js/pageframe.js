// pageframe.js
// logic to handle single-page like behavior using iframes and url extensions

var _QuerySeparator = '#';
var _SubquerySeparator = '?';
var _DefaultQuery = 'home';
var _PageFrameID = 'page-frame';
var _PageFrameLinkClass = 'page-frame-link';

function getQueryString(fullURL) {
    var qPos = fullURL.lastIndexOf(_QuerySeparator);
    if (qPos < 0) return _DefaultQuery;
    var qString = fullURL.slice(qPos + 1);
    if (qString.length == 0) return _DefaultQuery;
    return qString;
}
function getPageURL(pageName) {
    var subquery = "";
    var qPos = pageName.lastIndexOf(_SubquerySeparator);
    if (qPos >= 0) {
        subquery = pageName.slice(qPos);
        pageName = pageName.slice(0, qPos);
    }

    return "/pages/" + pageName + ".html" + subquery;
}

function pfLoadQuery(query) {
    if (query == "") return;

    var pageURL = getPageURL(query);
    document.getElementById(_PageFrameID).src = pageURL;
}
function pfFollowLink(sender) {
    var query = getQueryString(sender.href);
    pfLoadQuery(query);
}
function pfInitialize() {
    var query = getQueryString(window.location.href);
    pfLoadQuery(query);
}

pfInitialize();
window.onpopstate = function (e) {
    pfInitialize();
}