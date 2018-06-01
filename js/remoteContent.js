/*
  Remote content handling
 */

const contentDirectory = "/wc/";
const fileExtenstion = ".xml";
const listingFileName = "listing" + fileExtenstion;

const imageIdentifier = "$";
const backgroundIdentifier = "&";

const listIdentifier = '*';
const listSeparator = ',';
const listSuffix = "-list";
const listItemFormat = "<div class='$key' tag='$value'></div>";

function alertNotFound() {
    alert("404 File not found!");
}

// Apply callback K(string) onto contents of specified file
//  if file can't be found, call failK()
function getFileContents(filePath, K, failK) {
    var http = new XMLHttpRequest();
    http.onreadystatechange = function () {
        if (http.readyState == 4) {
            if (http.status == 200) {
                K(http.responseText);
            }
            else {
                failK();
            }
        }
    }
    http.open("GET", filePath, true);
    http.send(null);
}

// Parse raw xml into an object
//  cleans newline characters and removes tabs
function parse(content) {
    result = {};
    var inline = content.replace(/>(?:\r\n|\r|\n)/g, '>').replace(/(?:\r\n|\r|\n)</g, '<').replace(/,(?:\r\n|\r|\n|\s)/g, ',').replace(/\t/g, '');
    re = /<(.+?)>([\s\S]+?)<\/.+?>/g;

    var m = re.exec(inline);
    while (m != null) {
        let k = m[1];
        let v = m[2];
        result[k] = v;
        m = re.exec(inline);
    }

    return result;
}

// Fill target DOM element children with object content
//  for each object attribute, fills first child with attribute name as class
function inject(o, target) {
    var html = "";
    for (var k in o) {
        let identifier = k.charAt(0);
        if (identifier == imageIdentifier) {
            let key = k.slice(1);
            let insert = target.getElementsByClassName(key);

            if (insert.length > 0) {
                insert[0].src = o[k];
            }
        }
        else if (identifier == backgroundIdentifier) {
            let key = k.slice(1);
            let insert = target.getElementsByClassName(key);

            if (insert.length > 0) {
                insert[0].style.backgroundImage = "url('" + o[k] + "')";
            }
        }
        else if (identifier == listIdentifier) {
            let values = o[k].split(listSeparator);

            let key = k.slice(1);
            let listKey = key + listSuffix;
            let insert = target.getElementsByClassName(listKey);

            if (insert.length > 0) {
                for (var i = 0; i < values.length; i++) {
                    let newItem = listItemFormat.replace(/\$key/g, key).replace(/\$value/g, values[i]);
                    insert[0].innerHTML += newItem;
                }
            }
        }
        else {
            let insert = target.getElementsByClassName(k);
            if (insert.length > 0) {
                insert[0].innerHTML = o[k];
            }
        }
    }
}

function injectMultipleFiles(filePaths, targets) {
    if (filePaths.length != targets.length) {
        console.log("Number of files doesn't match number of targets!");
        return;
    }
    let n = filePaths.length;
    for (var i = 0; i < n; i++) {
        let target = targets[i];
        getFileContents(filePaths[i], function (x) {
            console.log(parse(x));
            console.log(target);
            inject(parse(x), target);
        }, alertNotFound);
    }
}

function listRange(folder, start, end, target) {
    getFileContents(contentDirectory + folder + "/" + listingFileName, function (x) {
        var paths = x.replace("\r", "").split("\n");
        for (var i = 0; i < paths.length; i++) {
            paths[i] = contentDirectory + folder + "/" + paths[i] + fileExtenstion;
        }
        console.log(paths);
        var targets = [target];
        let num = Math.min(paths.length, end) - start;
        for (var i = 1; i < num; i++) {
            let newTarget = target.cloneNode(true);
            target.parentNode.appendChild(newTarget);
            targets.push(newTarget);
        }
        injectMultipleFiles(paths.slice(start, end), targets);
    }, alertNotFound);
}