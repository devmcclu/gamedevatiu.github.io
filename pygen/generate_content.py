from os import listdir, remove
from os.path import join, isdir
import sys

from genutil import *

# Read in info files based on a listing, generating pages according to a template
# note: should be called before generating output HTML so the generated content pages can be processed as well
def generate_content(template_path, content_folder):
    items = get_vars_listing(content_folder)

    for item in items:
        item_path = item["get_link"]
        output_path = f"{item_path}.py.html"
        print(f"Generate item {item_path} (out: {output_path})")
        generate_file_from_template(template_path, output_path, item)

# Get the relevant arguments
args = sys.argv[1:]

# Check arguments
if len(args) < 2:
    print("Usage: generate_content <template path> <content folder>")
else:
    # Do generation
    print(f"Generating items in '{args[1]}' with template '{args[0]}'")
    generate_content(args[0], args[1])