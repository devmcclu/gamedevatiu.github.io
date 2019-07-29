import re
from textwrap import dedent

# HTML generation utilities

no_content_tags = ["img", "link", "br"]

div = "div"
img = "img"
a = "a"

# Construct a basic HTML element
def element(tag, content=None, class_list=[], **kwargs):
    result = f"<{tag}"
    
    if len(class_list) > 0:
        result += " class='"
        for c in class_list:
            result += f"{c} "
        result += "' "

    if kwargs != None and len(kwargs) > 0:
        result += " "
        for (k, v) in kwargs.items():
            if k[0] == '_':
                k = k[1:]
            result += f"{k}=\"{v}\" "
    
    if content == None and tag in no_content_tags:
        result += "/>"
        return result
    else:
        result += ">"

    if content != None:
        result += content

    result += f"</{tag}>"
    return result
    
def print_element(tag, content=None, class_list=[], **kwargs):
    print(element(tag, content, class_list, **kwargs), end='\n')

def inject(vars, text):
    for k, v in vars.items():
        list_pattern = re.compile(f"(\\$\\${k}([\s\S]*?)\\$\\$)")
        list_matches = re.findall(list_pattern, text)
        for (original, list_template) in list_matches:
            if isinstance(v, list):
                result = ""
                for e in v:
                    result += list_template.replace(f"${k}", str(e))
                text = text.replace(original, result)
            else:
                text = text.replace(original, list_template.replace(f"${k}", str(v)))

        text = text.replace(f"${k}", str(v))
    return text

# Import text from a file, replacing $key with the appropriate value from given vars dictionary
def template(source_path, vars):
    file_text = open(source_path).read()
    file_text = inject(vars, file_text)
    return file_text

def include_template(source_path, vars):
    print(template(source_path, vars))

# Like include_template, but writes the output to a new file
def generate_file_from_template(source_path, output_path, vars):
    file_text = open(source_path).read()
    file_text = inject(vars, file_text)
    
    output_file = open(output_path, 'w')
    output_file.write(file_text)

# Relevant data for info files
info_extension = ".info"
info_pattern = re.compile("(\\S+)\\s*:\\s*(?:{([\\s\\S]*?)}|(.*))") # Regex for a single line (key: value) or (key: {value})
info_folder = "../wc/"

# Get a dictionary by reading key: value entries in a file
# note: automatically handles file extension and root folder
format_prefix = "!format"
def get_vars(path, base_folder = info_folder):
    result = {
        "get_link": path
    }

    file_text = open(f"{base_folder}{path}{info_extension}").read()
    items = re.findall(info_pattern, file_text)
    for (name, long_value, value) in items:
        # Get raw key/value
        k = name.strip()
        v = ""
        if len(long_value) > 0:
            v = dedent(long_value).strip()
        elif len(value) > 0:
            v = value.strip()
        
        # Do formatting with mdformat if the format prefix is found
        if v.startswith(format_prefix):
            v = mdformat(v.replace(format_prefix, ""))

        # Value already present in result, should be added to a list
        if k in result:
            if isinstance(result[k], list):
                result[k].append(v)
            else:
                result[k] = [result[k], v]
        else:
            result[k] = v
        
    return result

listing_file_name = "list"

# Get a list of dictionaries from a listing file, calls get_vars for each line of the listing
# note: automatically handles file extension and root folder
def get_vars_listing(path, base_folder = info_folder):
    listing_path = f"{base_folder}{path}/{listing_file_name}{info_extension}"

    result = []
    items = open(listing_path).readlines()
    for item in items:
        item = item.strip()
        item_path = f"{path}/{item}"
        result.append(get_vars(item_path, base_folder))

    return result

# Escape double and single quotes so a value can be used inside a string
def escape_string(s):
    return s.replace("'", "\\'").replace('"', '\\"').replace("\n", "\\n")

# Markdown-like formatting rules as pairs (name: [ pattern, replacement ])
# where pattern and replacement are simplified regular expressions (literal regex if the string starts with 'regex')
# note: see _rule_to_regex for conversion
mdformat_rules = {
    'subheading' : [ '##  ?', '<h2>$1</h2>' ],
    'heading'    : [ '#  ?', '<h1>$1</h1>' ],

    'italic' : [ '__ ? __', '<em>$1</em>' ],
    'bold'   : [ '** ? **', '<strong>$1</strong>' ],

    'image-classed' : [ '![ ? ] ( ? ) < ? >', '<div class="img $3" alt="$1" style="background-image: url(\'$2\');">$1</div>' ],
    'image'         : [ '![ ? ] ( ? )', '<div class="img" alt="$1" style="background-image: url(\'$2\');">$1</div>' ],

    'link-same-tab' : [ '[ ? ] =( ? )', '<a href="$2">$1</a>' ],
    'link'          : [ '[ ? ] ( ? )', '<a href="$2" target="_blank">$1</a>' ],

    'paragraph' : [ 'regex ([^\n][\s\S]*?)(?:\n\n|$)', '<p>$1</p>\n' ],
    'linebreak' : [ '\\\\', '<br/>' ],
    'nbsp'      : [ '<>', '&nbsp;' ],
    
    # re.compile(r"\*\*(.+?)\*\*"): r"<strong>\1</strong>",
    # re.compile(r"__(.+?)__"): r"<em>\1</em>",
}
_rule_to_regex = {
    '[' : '\\[', # Use literals
    ']' : '\\]',
    '(' : '\\(',
    ')' : '\\)',
    '*' : '\\*',
    '  ': '\\s+', # Double space -> one or more spaces
    ' ' : '\\s*', # One space    -> zero or more spaces
    '?' : '(.*?)' # ?            -> capturing group
}

# Generate regex patterns from simplified strings above
_mdformat_regex = {}
for (name, patterns) in mdformat_rules.items():
    regex_string = patterns[0]
    replacement_string = patterns[1].replace('$', '\\')

    if regex_string.startswith('regex '):
        regex_string = regex_string.replace('regex ', '')
    else:
        for (k, v) in _rule_to_regex.items():
            regex_string = regex_string.replace(k, v)
    
    # print(regex_string)
    # print(replacement_string)
    # print()
    regex = re.compile(regex_string)
    _mdformat_regex[regex] = replacement_string

# Format some text
def mdformat(text):
    for (pattern, replacement) in _mdformat_regex.items():
        # print(text)
        text = re.sub(pattern, replacement, text)
        # print(text)
        # print(pattern)
        # print()
    return text