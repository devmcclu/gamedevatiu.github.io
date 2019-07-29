/* Micro Preprocessor for 
 * [M]ark [U]p
 * mu preprocessor */

 // Based on a simplified version of markdown
const defaultFormat = {
    "subheading": {
        // # Subheading title
        pattern: /## (.*)/g,
        format: "<h2>$1</h2>"
    },
    "heading": {
        // # Heading title
        pattern: /# (.*)/g,
        format: "<h1>$1</h1>"
    },
    "italic": {
        // _italic text_
        pattern: /\b_(.*?)_\b/g,
        format: "<em>$1</em>"
    },
    "bold": {
        // *bold text*
        pattern: /\*\b(.*?)\b\*/g,
        format: "<strong>$1</strong>"
    },
    "image-classed": {
        // ![name](source URL)<class1 class2...>
        pattern: /!\[(.+?)\]\((\S+?)\)<(.*?)>/g,
        format: "<div class='img $3' alt='$1' style='background-image: url(\"$2\");'>$1</div>"
    },
    "image": {
        // ![name](source URL)
        pattern: /!\[(.+?)\]\((\S+?)\)/g,
        format: "<div class='img' alt='$1' style='background-image: url(\"$2\");'>$1</div>"
    },
    "link-same-tab": {
        // [text](=URL)
        pattern: /\[(.+?)\]\(=(\S+?)\)/g,
        format: "<a href='$2'>$1</a>"
    },
    "link": {
        // [text](URL)
        pattern: /\[(.+?)\]\((\S+?)\)/g,
        format: "<a href='$2'>$1</a>"
    },
    "paragraph": {
        // paragraph 1
        //
        // paragraph 2
        pattern: /([^\n][\s\S]*?)(?:\n\n|$)/g,
        format: "<p>$1</p>\n"
    },
    "linebreak": {
        // line 1 \\ line 2
        pattenr: /\\\\/g,
        format: "<br/>"
    },
    "nonbreaking-space": {
        // line 1 \\ line 2
        pattenr: /<>/g,
        format: "&nbsp;"
    },
}

function muProcess(input, format = defaultFormat) {
    var output = input
    for (var k in format) {
        let pattern = format[k].pattern
        let replace = format[k].format
        output = output.replace(pattern, replace)
    }
    return output
}