from os import listdir, remove
from os.path import join, isdir
import sys

from genutil import *

def generate_content(template_path, content_folder):
    items = get_vars_listing(content_folder)

    for item in items:
        item_path = item["get_link"]
        output_path = f"{item_path}.py.html"
        print(f"Generate item {item_path} (out: {output_path})")
        generate_file_from_template(template_path, output_path, item)

args = sys.argv[1:]
if len(args) < 2:
    print("Usage: generate_content <template path> <content folder>")
else:
    print(f"Generating items in '{args[1]}' with template '{args[0]}'")
    generate_content(args[0], args[1])