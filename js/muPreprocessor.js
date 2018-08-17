/* Micro Preprocessor for 
 * [M]ark [U]p
 * mu preprocessor */

const defaultFormat = {
    "image": {
        pattern: /#\(([\s\S]+?)\)\[(.+?)\]/g,
        format: "<div class='img $2' style=\"background-image:url('$1');\"></div>"
    },
    "link-same-tab": {
        pattern: /\[=(.+?)\]\[([\s\S]+?)\]/g,
        format: "<a href='$1'>$2</a>"
    },
    "link": {
        pattern: /\[(.+?)\]\[([\s\S]+?)\]/g,
        format: "<a href='$1' target='_blank'>$2</a>"
    },
    "heading": {
        pattern: /===(.+?)===/g,
        format: "<h1>$1</h1>"
    },
    "subheading": {
        pattern: /==(.+?)==/g,
        format: "<h2>$1</h2>"
    },
    "bold": {
        pattern: /\*\*(.+?)\*\*/g,
        format: "<strong>$1</strong>"
    },
    "italic": {
        pattern: /__(.+?)__/g,
        format: "<em>$1</em>"
    },
    "paragraph-spacer": {
        pattern: /\s*\(\(\)\)\s*/g,
        format: "<p>&nbsp;</p>"
    },
    "paragraph": {
        pattern: /\s*\(\(([\s\S]+?)\)\)\s*/g,
        format: "<p>$1</p>"
    },
    "break": {
        pattern: /(\r\n|\n)(\r\n|\n)/g,
        format: "<br/><br/>"
    },
};

function muProcess(input, format = defaultFormat) {
    var output = input;
    for (k in format) {
        let pattern = format[k].pattern;
        let replace = format[k].format;
        output = output.replace(pattern, replace);
    }
    return output;
}