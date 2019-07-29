/** *** ** *** ** *** ** *** **
 *  Remote Content Handling   *
 *   (c) Rajin Shankar, 2019  * 
 ** *** ** *** ** *** ** *** **/

/// <reference path="muPreprocessor.ts" />

function regexEscape(s: string) {
    return s.replace(/[\.\*\+\?\^\$\{\}\(\)\|\[\]\\]/g, "\\$&")
}

const content = {
    directory: "/wc",
    fileExtension: "xml",
    listingFileName: "listing",
    formatTag: "!format",
}

const attribute = {
    remote: "get",
    query: "get-query",

    list: "list",

    multipleRemote: "get-multi",
    maxCount: "max-items",
    rowMaxCount: "row-max",

    filterBy: "filter-by",

    injectLink: "inj-link",
    injectSource: "inj-src"
}

const filter = {
    defaultDateSeparator: '-',

    dateInFuture: (fileName: string, dateSeparator: string = filter.defaultDateSeparator) => {
        fileName = fileName.substr(fileName.lastIndexOf("/") + 1)
        
        let tokens = fileName.split(dateSeparator)

        let month = parseInt(tokens[0]) - 1
        let day = parseInt(tokens[1])
        let year = parseInt(tokens[2]) + 2000

        let currentDate = new Date(Date.now())
        let currentMonth = currentDate.getMonth()
        let currentDay = currentDate.getDate()
        let currentYear = currentDate.getFullYear()

        if (currentYear > year) { return false }
        if (currentYear < year) { return true }
        if (currentMonth > month) { return false }
        if (currentMonth < month) { return true }
        if (currentDay > day) { return false }

        return true
    }
}

const get = {
    cache: {},

    fileContents: (url: string, callback: { (arg0: string): void; }, error: () => void) => {
        // URL not in cache, do HTTP request
        if (get.cache[url] == null) {
            let http = new XMLHttpRequest()
            http.onreadystatechange = () => {
                if (http.readyState == 4) { // HTTP response ready
                    if (http.status == 200) { // HTTP request successful
                        if (get.cache[url] == null) { // Check cache has not been set (in the mean time)
                            console.log(`(get.fileContents) Read http response for '${url}'`)
                            get.cache[url] = http.responseText // Record response in cache
                        }
                        else {
                            console.log(`(get.fileContents) Ignore http response for '${url}'`)
                        }
                        callback(get.cache[url])
                    }
                    else { // HTTP request failed
                        error()
                    }
                }
            }

            http.open("GET", url, true)
            http.send(null)
        }
        else {
            console.log(`(get.fileContents) Returned cached value for '${url}'`)
            callback(get.cache[url])
        }
    }
}

const xml = {
    cache: {},
    nodeType: {
        text: 3
    },

    toObject: (xmlString: string, sourceName: string, sourceURL: string) => {
        if (xml.cache[sourceURL] == null) {
            xmlString = xmlString.replace(/ & /g, " &amp; ")
            let parser = new DOMParser()
            let xmlDoc = parser.parseFromString(xmlString, "text/xml")

            let object = {
                "getLink": sourceName,
            }

            let addValue = (nodePath: string, value: string) => {
                if (value.length > 0) {
                    if (value.indexOf(content.formatTag) >= 0) { // value should be formatted
                        value = value.replace(content.formatTag, "").trim();
                        value = muProcess(value)
                    }

                    if (object[nodePath] == null) { // object has no value at this path
                        object[nodePath] = value
                    }
                    else {
                        if (object[nodePath].push == null) { // object has a single element at this path
                            let single = object[nodePath]
                            object[nodePath] = [single] // convert single element to list of elements
                        }
                        object[nodePath].push(value) // add value to element list
                    }
                }
            }
            let parse = (source: Node, parentPath: string, depth: number) => {
                let useNodeName = depth > 0 && source.nodeName.indexOf('#') < 0 // Don't use #text/etc. or root node names in the node path
                let nodePath = useNodeName ? `${parentPath}${parentPath == "" ? '' : '/'}${source.nodeName}` : parentPath // Don't add slashes for empty parent names (root)

                if (source instanceof Text) { // node is text element
                    let value = source.nodeValue.trim()
                    addValue(nodePath, value)
                }

                if (source instanceof Element && source.hasAttributes()) { // Get node attributes if needed
                    for (var i = 0; i < source.attributes.length; i++) {
                        let attribute = source.attributes.item(i)
                        let attributePath = `${nodePath}/${attribute.nodeName}`
                        addValue(attributePath, attribute.nodeValue.trim())
                    }
                }

                if (source.hasChildNodes()) {
                    source.childNodes.forEach((child) => { // go through child nodes
                        parse(child, nodePath, depth + 1)
                    })
                }
            }

            parse(xmlDoc.getRootNode(), "", -1) // start at the document root (#document), which is depth -1
            xml.cache[sourceURL] = object

            console.log(`(xml.toObject) Parse XML from '${sourceURL}'`)
            return object
        }
        else {
            console.log(`(xml.toObject) Return cached value for XML at '${sourceURL}'`)
            return xml.cache[sourceURL]
        }
    }
}

const inject = {
    variablePrefix: "$",
    preventLoadPattern: /`\b(\S+)\b/g,

    queue: {},

    listValueName: "listValue",
    listIndexName: "listIndex",

    hasContentName: "hasContent",

    getVariablePattern: (variableName: string) => {
        return new RegExp(`${regexEscape(inject.variablePrefix)}${variableName}`, 'g');
    },

    // Replace variables in targetElement with values from object
    fill: (targetElement: Element, object: Object) => {
        var html = targetElement.outerHTML

        let listValuePattern = inject.getVariablePattern(inject.listValueName)
        let listIndexPattern = inject.getVariablePattern(inject.listIndexName)

        for (var key in object) {
            let value = object[key]
            let listPrototypes = targetElement.querySelectorAll(`[${attribute.list}='${key}']`)

            if (Array.isArray(value)) { // value is a list of elements (tags, etc.)
                listPrototypes.forEach((prototype, index: number) => {
                    let prototypeStartHTML = prototype.outerHTML // Starting template html to replace with final list html

                    prototype.removeAttribute(attribute.list) // remove list attribute to prevent subsequent replacements
                    let prototypeHTML = prototype.outerHTML // Get the actual template

                    var listHTML = "" // Final list html

                    value.forEach((listItem: any, index: number) => { // Go through each list value/index
                        let itemHTML = prototypeHTML.replace(listValuePattern, listItem).replace(listIndexPattern, `${index}`) // Get the individual item HTML
                        listHTML += `${itemHTML}\n`
                    })

                    html = html.replace(prototypeStartHTML, listHTML) // replace the prototype with the final list
                })

                html = html.replace(inject.getVariablePattern(key), value.toString())
            }
            else { // value is a single string
                listPrototypes.forEach((prototype, index: number) => { // Fill list prototypes as if value was a single-element list
                    let prototypeStartHTML = prototype.outerHTML
                    prototype.removeAttribute(attribute.list)
                    let prototypeHTML = prototype.outerHTML
                    let singleItemHTML = prototypeHTML.replace(listValuePattern, value).replace(listIndexPattern, `${0}`)
                    html = html.replace(prototypeStartHTML, singleItemHTML)
                })

                html = html.replace(inject.getVariablePattern(key), value)
            }
        }

        html = html.replace(inject.getVariablePattern(inject.hasContentName), "true")
        html = html.replace(inject.preventLoadPattern, "$1")

        targetElement.outerHTML = html
    },

    fillFrom: (getURL: string, targetElement: Element) => {
        let request = {
            url: `${content.directory}/${getURL}.${content.fileExtension}`, // ex. convert content/foo -> /wc/content/foo.xml
            target: targetElement,
            result: null,
            done: false
        }
        get.fileContents(request.url, (xmlString) => {
            request.result = xml.toObject(xmlString, getURL, request.url)
            inject.fill(targetElement, request.result)
            request.done = true
        }, () => {
            console.error(`(inject.from) Failed to get file contents at ${request.url}`)
            request.done = true
        })
    },

    fillAllRemote: () => {
        let targetElements = document.querySelectorAll(`[${attribute.remote}]`)

        console.log(`(inject.fillAllRemote) Starting inject for ${targetElements.length} elements...`)

        targetElements.forEach((targetElement) => {
            let getURL = targetElement.getAttribute(attribute.remote)
            inject.fillFrom(getURL, targetElement)
            targetElement.removeAttribute(attribute.remote)
        })
    },

    fillFromMultiple: (getFolder: string, filter: (arg0: string) => boolean, targetElement: Element) => {
        let listingURL = `${content.directory}/${getFolder}/${content.listingFileName}.${content.fileExtension}`
        get.fileContents(listingURL, (xmlString) => { // Get a listing file of all the content in the folder
            let listing = xml.toObject(xmlString, getFolder, listingURL)
            var sources = listing["item/src"] // each attribute is in its own array

            if (sources.push == null) { // if there is only one source, make it a single-element list
                sources = [sources]
            }

            var filteredSources = [] // filter sources by a given function (or let all through if passed null)
            if (filter == null) {
                filteredSources = sources
            }
            else {
                sources.forEach((source) => {
                    if (filter(source)) {
                        filteredSources.push(source)
                    }
                })
            }

            var requests = []
            let prototype = targetElement.outerHTML.trim() // template html to duplicate

            let targetContainer = targetElement.parentElement
            targetContainer.removeChild(targetElement)

            let template = document.createElement("template")
            filteredSources.forEach((source) => { // generate all requests
                template.innerHTML = prototype
                let requestTarget = targetContainer.appendChild(template.content.firstChild)

                let request = {
                    url: `${content.directory}/${getFolder}/${source}.${content.fileExtension}`,
                    getURL: `${getFolder}/${source}`,
                    result: null,
                    done: false,
                    target: requestTarget
                }

                requests.push(request)
            })

            requests.forEach((request) => { // execute all requests
                get.fileContents(request.url, (xmlString) => {
                    request.result = xml.toObject(xmlString, request.getURL, request.url)
                    inject.fill(request.target, request.result)
                    request.done = true
                }, () => {
                    console.error(`(inject.fillFromMultiple) Failed to get file contents at '${request.url}'`)
                    targetContainer.removeChild(request.target)
                    request.done = true
                })
            })
        }, () => {
            console.error(`(inject.fillFromMultiple) Failed to get listing file at '${listingURL}'`)
        })
    },

    fillAllMultiple: () => {
        let targetElements = document.querySelectorAll(`[${attribute.multipleRemote}]`)

        console.log(`(inject.fillAllMultiple) Starting multi-inject for ${targetElements.length} elements...`)

        targetElements.forEach((targetElement) => {
            let getFolder = targetElement.getAttribute(attribute.multipleRemote)
            let filterName = targetElement.getAttribute(attribute.filterBy)

            var filterCallback = null
            if (filterName != null && filter[filterName] != null) {
                filterCallback = filter[filterName]
            }

            inject.fillFromMultiple(getFolder, filterCallback, targetElement)
            targetElement.removeAttribute(attribute.multipleRemote)
        })
    }
}

inject.fillAllRemote()
inject.fillAllMultiple()

// todo: max counts, inject links