var defaultFormat = {
    "subheading": {
        pattern: /## (.*)/g,
        format: "<h2>$1</h2>"
    },
    "heading": {
        pattern: /# (.*)/g,
        format: "<h1>$1</h1>"
    },
    "italic": {
        pattern: /\b_(.*?)_\b/g,
        format: "<em>$1</em>"
    },
    "bold": {
        pattern: /\*\b(.*?)\b\*/g,
        format: "<strong>$1</strong>"
    },
    "image-classed": {
        pattern: /!\[(.+?)\]\((\S+?)\)<(.*?)>/g,
        format: "<div class='img $3' alt='$1' style='background-image: url(\"$2\");'>$1</div>"
    },
    "image": {
        pattern: /!\[(.+?)\]\((\S+?)\)/g,
        format: "<div class='img' alt='$1' style='background-image: url(\"$2\");'>$1</div>"
    },
    "link-same-tab": {
        pattern: /\[(.+?)\]\(=(\S+?)\)/g,
        format: "<a href='$2'>$1</a>"
    },
    "link": {
        pattern: /\[(.+?)\]\((\S+?)\)/g,
        format: "<a href='$2'>$1</a>"
    },
    "paragraph": {
        pattern: /([^\n][\s\S]*?)(?:\n\n|$)/g,
        format: "<p>$1</p>\n"
    },
    "linebreak": {
        pattenr: /\\\\/g,
        format: "<br/>"
    },
    "nonbreaking-space": {
        pattenr: /<>/g,
        format: "&nbsp;"
    }
};
function muProcess(input, format) {
    if (format === void 0) { format = defaultFormat; }
    var output = input;
    for (var k in format) {
        var pattern = format[k].pattern;
        var replace = format[k].format;
        output = output.replace(pattern, replace);
    }
    return output;
}
function regexEscape(s) {
    return s.replace(/[\.\*\+\?\^\$\{\}\(\)\|\[\]\\]/g, "\\$&");
}
var content = {
    directory: "/wc",
    fileExtension: "xml",
    listingFileName: "listing",
    formatTag: "!format"
};
var attribute = {
    remote: "get",
    query: "get-query",
    list: "list",
    multipleRemote: "get-multi",
    maxCount: "max-items",
    rowMaxCount: "row-max",
    filterBy: "filter-by",
    injectLink: "inj-link",
    injectSource: "inj-src"
};
var filter = {
    defaultDateSeparator: '-',
    dateInFuture: function (fileName, dateSeparator) {
        if (dateSeparator === void 0) { dateSeparator = filter.defaultDateSeparator; }
        fileName = fileName.substr(fileName.lastIndexOf("/") + 1);
        console.log(fileName);
        var tokens = fileName.split(dateSeparator);
        var month = parseInt(tokens[0]) - 1;
        var day = parseInt(tokens[1]);
        var year = parseInt(tokens[2]) + 2000;
        var currentDate = new Date(Date.now());
        var currentMonth = currentDate.getMonth();
        var currentDay = currentDate.getDate();
        var currentYear = currentDate.getFullYear();
        if (currentYear > year) {
            return false;
        }
        if (currentYear < year) {
            return true;
        }
        if (currentMonth > month) {
            return false;
        }
        if (currentMonth < month) {
            return true;
        }
        if (currentDay > day) {
            return false;
        }
        return true;
    }
};
var get = {
    cache: {},
    fileContents: function (url, callback, error) {
        if (get.cache[url] == null) {
            var http_1 = new XMLHttpRequest();
            http_1.onreadystatechange = function () {
                if (http_1.readyState == 4) {
                    if (http_1.status == 200) {
                        if (get.cache[url] == null) {
                            console.log("(get.fileContents) Read http response for '" + url + "'");
                            get.cache[url] = http_1.responseText;
                        }
                        else {
                            console.log("(get.fileContents) Ignore http response for '" + url + "'");
                        }
                        callback(get.cache[url]);
                    }
                    else {
                        error();
                    }
                }
            };
            http_1.open("GET", url, true);
            http_1.send(null);
        }
        else {
            console.log("(get.fileContents) Returned cached value for '" + url + "'");
            callback(get.cache[url]);
        }
    }
};
var xml = {
    cache: {},
    nodeType: {
        text: 3
    },
    toObject: function (xmlString, sourceName, sourceURL) {
        if (xml.cache[sourceURL] == null) {
            xmlString = xmlString.replace(/ & /g, " &amp; ");
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(xmlString, "text/xml");
            var object_1 = {
                "getLink": sourceName
            };
            var addValue_1 = function (nodePath, value) {
                if (value.length > 0) {
                    if (value.indexOf(content.formatTag) >= 0) {
                        value = value.replace(content.formatTag, "").trim();
                        value = muProcess(value);
                    }
                    if (object_1[nodePath] == null) {
                        object_1[nodePath] = value;
                    }
                    else {
                        if (object_1[nodePath].push == null) {
                            var single = object_1[nodePath];
                            object_1[nodePath] = [single];
                        }
                        object_1[nodePath].push(value);
                    }
                }
            };
            var parse_1 = function (source, parentPath, depth) {
                var useNodeName = depth > 0 && source.nodeName.indexOf('#') < 0;
                var nodePath = useNodeName ? "" + parentPath + (parentPath == "" ? '' : '/') + source.nodeName : parentPath;
                if (source instanceof Text) {
                    var value = source.nodeValue.trim();
                    addValue_1(nodePath, value);
                }
                if (source instanceof Element && source.hasAttributes()) {
                    for (var i = 0; i < source.attributes.length; i++) {
                        var attribute_1 = source.attributes.item(i);
                        var attributePath = nodePath + "/" + attribute_1.nodeName;
                        addValue_1(attributePath, attribute_1.nodeValue.trim());
                    }
                }
                if (source.hasChildNodes()) {
                    source.childNodes.forEach(function (child) {
                        parse_1(child, nodePath, depth + 1);
                    });
                }
            };
            parse_1(xmlDoc.getRootNode(), "", -1);
            xml.cache[sourceURL] = object_1;
            console.log("(xml.toObject) Parse XML from '" + sourceURL + "'");
            return object_1;
        }
        else {
            console.log("(xml.toObject) Return cached value for XML at '" + sourceURL + "'");
            return xml.cache[sourceURL];
        }
    }
};
var inject = {
    variablePrefix: "$",
    preventLoadPattern: /`\b(\S+)\b/g,
    queue: {},
    listValueName: "listValue",
    listIndexName: "listIndex",
    hasContentName: "hasContent",
    getVariablePattern: function (variableName) {
        return new RegExp("" + regexEscape(inject.variablePrefix) + variableName, 'g');
    },
    fill: function (targetElement, object) {
        var html = targetElement.outerHTML;
        var listValuePattern = inject.getVariablePattern(inject.listValueName);
        var listIndexPattern = inject.getVariablePattern(inject.listIndexName);
        var _loop_1 = function () {
            var value = object[key];
            var listPrototypes = targetElement.querySelectorAll("[" + attribute.list + "='" + key + "']");
            if (Array.isArray(value)) {
                listPrototypes.forEach(function (prototype, index) {
                    var prototypeStartHTML = prototype.outerHTML;
                    prototype.removeAttribute(attribute.list);
                    var prototypeHTML = prototype.outerHTML;
                    var listHTML = "";
                    value.forEach(function (listItem, index) {
                        var itemHTML = prototypeHTML.replace(listValuePattern, listItem).replace(listIndexPattern, "" + index);
                        listHTML += itemHTML + "\n";
                    });
                    html = html.replace(prototypeStartHTML, listHTML);
                });
                html = html.replace(inject.getVariablePattern(key), value.toString());
            }
            else {
                listPrototypes.forEach(function (prototype, index) {
                    var prototypeStartHTML = prototype.outerHTML;
                    prototype.removeAttribute(attribute.list);
                    var prototypeHTML = prototype.outerHTML;
                    var singleItemHTML = prototypeHTML.replace(listValuePattern, value).replace(listIndexPattern, "" + 0);
                    html = html.replace(prototypeStartHTML, singleItemHTML);
                });
                html = html.replace(inject.getVariablePattern(key), value);
            }
        };
        for (var key in object) {
            _loop_1();
        }
        html = html.replace(inject.getVariablePattern(inject.hasContentName), "true");
        html = html.replace(inject.preventLoadPattern, "$1");
        targetElement.outerHTML = html;
    },
    fillFrom: function (getURL, targetElement) {
        var request = {
            url: content.directory + "/" + getURL + "." + content.fileExtension,
            target: targetElement,
            result: null,
            done: false
        };
        get.fileContents(request.url, function (xmlString) {
            request.result = xml.toObject(xmlString, getURL, request.url);
            inject.fill(targetElement, request.result);
            request.done = true;
        }, function () {
            console.error("(inject.from) Failed to get file contents at " + request.url);
            request.done = true;
        });
    },
    fillAllRemote: function () {
        var targetElements = document.querySelectorAll("[" + attribute.remote + "]");
        console.log("(inject.fillAllRemote) Starting inject for " + targetElements.length + " elements...");
        targetElements.forEach(function (targetElement) {
            var getURL = targetElement.getAttribute(attribute.remote);
            inject.fillFrom(getURL, targetElement);
            targetElement.removeAttribute(attribute.remote);
        });
    },
    fillFromMultiple: function (getFolder, filter, targetElement) {
        var listingURL = content.directory + "/" + getFolder + "/" + content.listingFileName + "." + content.fileExtension;
        get.fileContents(listingURL, function (xmlString) {
            var listing = xml.toObject(xmlString, getFolder, listingURL);
            var sources = listing["item/src"];
            if (sources.push == null) {
                sources = [sources];
            }
            var filteredSources = [];
            if (filter == null) {
                filteredSources = sources;
            }
            else {
                sources.forEach(function (source) {
                    if (filter(source)) {
                        filteredSources.push(source);
                    }
                });
            }
            var requests = [];
            var prototype = targetElement.outerHTML.trim();
            var targetContainer = targetElement.parentElement;
            targetContainer.removeChild(targetElement);
            var template = document.createElement("template");
            filteredSources.forEach(function (source) {
                template.innerHTML = prototype;
                var requestTarget = targetContainer.appendChild(template.content.firstChild);
                var request = {
                    url: content.directory + "/" + getFolder + "/" + source + "." + content.fileExtension,
                    getURL: getFolder + "/" + source,
                    result: null,
                    done: false,
                    target: requestTarget
                };
                requests.push(request);
            });
            requests.forEach(function (request) {
                get.fileContents(request.url, function (xmlString) {
                    request.result = xml.toObject(xmlString, request.getURL, request.url);
                    inject.fill(request.target, request.result);
                    request.done = true;
                }, function () {
                    console.error("(inject.fillFromMultiple) Failed to get file contents at '" + request.url + "'");
                    targetContainer.removeChild(request.target);
                    request.done = true;
                });
            });
        }, function () {
            console.error("(inject.fillFromMultiple) Failed to get listing file at '" + listingURL + "'");
        });
    },
    fillAllMultiple: function () {
        var targetElements = document.querySelectorAll("[" + attribute.multipleRemote + "]");
        console.log("(inject.fillAllMultiple) Starting multi-inject for " + targetElements.length + " elements...");
        targetElements.forEach(function (targetElement) {
            var getFolder = targetElement.getAttribute(attribute.multipleRemote);
            var filterName = targetElement.getAttribute(attribute.filterBy);
            var filterCallback = null;
            if (filterName != null && filter[filterName] != null) {
                filterCallback = filter[filterName];
            }
            inject.fillFromMultiple(getFolder, filterCallback, targetElement);
            targetElement.removeAttribute(attribute.multipleRemote);
        });
    }
};
inject.fillAllRemote();
inject.fillAllMultiple();
