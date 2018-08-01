/************************
 REMOTE CONTENT HANDLING
 ************************/

const contentDirectory = "/wc/";
const fileExtension = ".xml"
const listingFileName = "listing" + fileExtension;

const variablePrefix = "$";
// This prefix prevents the page from trying to HTTP GET images, etc. where the src is a placeholder
// It is simply removed at the end of the injection process
const placeholderPrefix = "%%";

const remoteContentAttr = "get";
const getQueryAttr = "get-query";
const listAttr = "list";
const valueAttr = "value";
const indexAttr = "index"

const multiContentAttr = "get-multi";
const multiMaxDisplayAttr = "max-items";
const multiMaxRowAttr = "row-max";

const injLinkAttr = "inj-link";
const injSrcAttr = "inj-src";

const preprocessTag = "!format";

var getCache = {};
var parseCache = {};
var baseHTML = {};

var injectsInProgress = 0;
var injectsInReleaseQueue = 0;
var injectQueueLocked = false;
var onCompleteAllInjects = function () { };

function startInjectProcess() {
    injectsInProgress += 1;
}
function completeInject() {
    if (injectQueueLocked) {
        injectsInReleaseQueue += 1;
    }
    else {
        injectsInProgress -= 1;
        if (injectsInProgress == 0) {
            console.log("Call onCompleteAllInjects (Complete)");
            onCompleteAllInjects();
        }
    }
}
function lockInjectQueue() {
    injectQueueLocked = true;
}
function unlockInjectQueue() {
    injectQueueLocked = false;
    if (injectsInReleaseQueue > 0) {
        injectsInProgress -= injectsInReleaseQueue;
        if (injectsInProgress == 0) {
            console.log("Call onCompleteAllInjects (Queue)");
            onCompleteAllInjects();
        }
    }
}

// Apply callback K(string) onto contents of specified file
//  if file can't be found, call failK()
function getFileContents(filePath, K, failK) {
    if (getCache[filePath] != null) {
        console.log("[Get File Contents] returned cached value for " + filePath);
        K(getCache[filePath]);
    }
    else {
        var http = new XMLHttpRequest();
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                if (http.status == 200) {
                    if (getCache[filePath] != null) {
                        console.log("[Get File Contents] returned cached value for " + filePath);
                        K(getCache[filePath]);
                    }
                    else {
                        console.log("[Get File Contents] No cached value for " + filePath);
                        getCache[filePath] = http.responseText;
                        K(http.responseText);
                    }
                }
                else {
                    failK();
                }
            }
        }
        http.open("GET", filePath, true);
        http.send(null);
    }
}

// Parse XML into JS Object
//  - Only supports top level items within root tag
//  - Root tag is currently ignored
function parse(content, getLink, filePath) {
    if (parseCache[content] != null) {
        // console.log("[Parse] returned cached value for " + content.substring(0, 12) + "...");
        return parseCache[content];
    }

    result = {};
    result["getLink"] = getLink;
    result["filePath"] = filePath;

    var inline = (/<.+?>([\s\S]*)<\/.+?>/g).exec(content)[1];
    // console.log(inline);
    inline = inline.replace(/>(?:\r\n|\r|\n)/g, '>').replace(/(?:\r\n|\r|\n)</g, '<').replace(/,(?:\r\n|\r|\n)/g, ',').replace(/\t/g, '').replace(/    /g, "");
    let re = /<(.+?)>\s*([\s\S]+?)\s*<\/.+?>/g;

    var m = re.exec(inline);
    while (m != null) {
        let k = m[1];
        var v = m[2];

        if (v.search(preprocessTag) >= 0) {
            console.log(v);
            v = v.replace(new RegExp(preprocessTag.concat("\\s*"), 'g'), "");
            v = muProcess(v);
            console.log(v);
        }

        if (result[k] == null) {
            result[k] = v;
        }
        else {
            if (Array.isArray(result[k])) {
                result[k].push(v);
            }
            else {
                result[k] = [result[k], v];
            }
        }

        m = re.exec(inline);
    }

    parseCache[content] = result;
    return result;
}

// Inject JS Object into HTML
function inject(o, target) {
    var html = target.outerHTML;
    for (var k in o) {
        var v = o[k];
        // console.log(k + ": " + v);

        if (Array.isArray(v)) {
            let protos = target.querySelectorAll("[" + listAttr + "=" + k + "]");
            protos.forEach(function (proto) {
                let varName = proto.getAttribute(valueAttr);
                let indexName = proto.getAttribute(indexAttr);

                if (varName == null) {
                    console.log("[Inject] List target with no " + valueAttr + " attribute!")
                    console.log(proto);
                }
                else {
                    let protoStartHTML = proto.outerHTML;

                    proto.removeAttribute(listAttr);
                    proto.removeAttribute(valueAttr);
                    proto.removeAttribute(indexAttr);

                    let protoHTML = proto.outerHTML;
                    var listHTML = "";

                    o[k].forEach(function (item, i) {
                        item = item.replace(/\.\//g, contentDirectory);
                        let varExp = new RegExp("\\" + variablePrefix + varName, 'g');
                        var itemHTML = protoHTML.replace(varExp, item);
                        if (indexName != null) {
                            let idxExp = new RegExp("\\" + variablePrefix + indexName, 'g');
                            itemHTML = itemHTML.replace(idxExp, i);
                        }
                        listHTML += itemHTML;
                    });

                    html = html.replace(protoStartHTML, listHTML);
                    html = html.replace(new RegExp("\\" + variablePrefix + k, 'g'), "list");
                }
            });
        }
        else {
            // Transform relative paths
            v = v.replace(/\.\//g, contentDirectory);
            html = html.replace(new RegExp("\\" + variablePrefix + k, 'g'), v);
        }
    }
    target.outerHTML = html.replace(new RegExp(placeholderPrefix, 'g'), "");
}

function getAndInject(getLink, target, addInProgress = true, callback = function () { }) {
    if (addInProgress) startInjectProcess();
    let filePath = contentDirectory + getLink + fileExtension;
    let itemTarget = target;
    getFileContents(filePath,
        function (content) {
            // console.log("Starting inject for " + filePath);
            inject(parse(content, getLink, filePath), itemTarget);
            callback();
            if (addInProgress) completeInject();
        },
        function () {
            console.log("[Get & Inject] File not found! " + filePath);
            callback();
            if (addInProgress) completeInject();
        }
    );
}

function injectAll() {
    let targets = document.querySelectorAll("[" + remoteContentAttr + "]");
    targets.forEach(function (target) {
        let getLink = target.getAttribute(remoteContentAttr);
        getAndInject(getLink, target);
    });
}

function injectMultiple() {
    let targets = document.querySelectorAll("[" + multiContentAttr + "]");
    targets.forEach(function (target) {
        let folder = target.getAttribute(multiContentAttr);
        let listingPath = contentDirectory + folder + "/" + listingFileName;
        startInjectProcess();
        getFileContents(listingPath,
            function (listing) {
                let parent = target.parentNode;
                let totalItems = target.getAttribute(multiMaxDisplayAttr);
                var rowTotal = target.getAttribute(multiMaxRowAttr);

                target.removeAttribute(multiMaxDisplayAttr);
                target.removeAttribute(multiMaxRowAttr);
                target.removeAttribute(multiContentAttr);

                // Split lines into file paths array
                var paths = listing.split(/[\r\n]+/g);
                // Convert to get links
                for (var i = 0; i < paths.length; i++) {
                    paths[i] = folder + "/" + paths[i];
                }
                var links = paths.slice();
                // Convert to absolute paths
                for (var i = 0; i < paths.length; i++) {
                    paths[i] = contentDirectory + paths[i] + fileExtension;
                }

                // console.log(paths);
                if (rowTotal == null) {
                    for (var i in paths) {
                        let index = i;
                        let newTarget = target.cloneNode(true);
                        parent.appendChild(newTarget);

                        getFileContents(paths[i],
                            function (content) {
                                var o = parse(content, links[index], paths[index]);
                                o["index"] = index;
                                inject(o, newTarget);

                                if (index == paths.length - 1) {
                                    parent.removeChild(target);
                                }
                            },
                            function () {
                                console.log("[Inject Multiple] Couldn't get content at path " + paths[i] + "!");
                            }
                        );
                    }
                }
                else {
                    var itemsLeft = paths.length;
                    var currentParent = parent;
                    var currentTarget = target;
                    var rowCount = (itemsLeft % rowTotal == 0) ? rowTotal : rowTotal - 1;

                    // console.log(rowCount);
                    // console.log(itemsLeft);

                    for (var i in paths) {
                        let itemTarget = currentTarget;
                        let index = i;

                        startInjectProcess();
                        getFileContents(paths[i],
                            function (content) {
                                inject(parse(content, links[index], paths[index]), itemTarget);
                                completeInject();
                            },
                            function () {
                                console.log("[Inject Multiple] Couldn't get content at path " + paths[i] + "!");
                                completeInject();
                            }
                        );

                        rowCount -= 1;
                        itemsLeft -= 1;

                        // Clone target and/or parent
                        if (i != paths.length - 1) {
                            if (rowCount == 0) {
                                rowCount = (itemsLeft % rowTotal == 0) ? rowTotal : rowTotal - 1;
                                var newParent = currentParent.cloneNode(false);
                                currentParent.parentNode.appendChild(newParent);
                                currentParent = newParent;
                            }
                            let newTarget = target.cloneNode(true);
                            currentParent.appendChild(newTarget);
                            currentTarget = newTarget;
                        }
                    }
                }
                completeInject();
            },
            function () {
                console.log("[Inject Multiple] Couldn't get listing at path " + listingPath + "!");
                completeInject();
            }
        );
    });
}

function injectQuery() {
    let urlParts = window.location.href.split('?');
    if (urlParts.length > 1) {
        let q = urlParts[1];
        let targets = document.querySelectorAll("[" + getQueryAttr + "]");
        targets.forEach(function (target) {
            getAndInject(q, target, true, doAutoExpand);
        });
    }
}

function doAutoExpand() {
    document.querySelectorAll(".auto-expand").forEach(
        function (e, i) {
            // console.log(i);
            e.outerHTML = e.innerHTML;
        }
    );
}

function makeInjectLinks() {
    let links = document.querySelectorAll("[" + injLinkAttr + "]");
    links.forEach(function (link, i, arr) {
        console.log("link :" + link);

        let get = link.getAttribute(injSrcAttr);
        let targetID = link.getAttribute(injLinkAttr);

        if (targetID == null) {
            console.log("[Make Inject Links] Inject link has no target!");
        }
        else if (get == null) {
            console.log("[Make Inject Links] Inject link has target but no " + injSrcAttr + " attribute!");
        }
        else {
            let target = document.getElementById(targetID);
            if (target == null) {
                console.log("[Make Inject Links] Couldn't get inject target with ID " + targetID + "!");
            }
            else {
                if (baseHTML[targetID] == null) {
                    baseHTML[targetID] = target.outerHTML;
                }
                link.onclick = function () {
                    let itemTarget = document.getElementById(targetID);
                    itemTarget.outerHTML = baseHTML[targetID];
                    console.log("[Inject Link] Open " + get + " in " + targetID);
                    getAndInject(get, document.getElementById(targetID), false, doAutoExpand);
                };
                console.log(targetID + " <-> " + get);
            }
        }
    });
}

lockInjectQueue();
injectMultiple();
injectAll();
injectQuery();
unlockInjectQueue();

onCompleteAllInjects = function () {
    doAutoExpand();
    makeInjectLinks();
};