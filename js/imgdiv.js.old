/* 
 * Handling of background-image based image display with resizable elements
 */

const imgdivClass = "img";
const imgdivSourceAttr = "imgsrc";
const imgdivStyleFormat = "url('$src')";

function makeImgdiv(element) {
    const source = element.getAttribute(imgdivSourceAttr)
    if (source != null) {
        element.style.backgroundImage = imgdivStyleFormat.replace("$src", source);
    }
}

function convertPage() {
    const imgs = document.getElementsByClassName(imgdivClass);
    for (var i = 0; i < imgs.length; i++) {
        makeImgdiv(imgs[i]);
    }
}

convertPage();