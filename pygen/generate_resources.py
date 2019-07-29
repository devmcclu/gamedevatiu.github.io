from os import listdir, remove
from os.path import join, isdir

from genutil import *

template_path = "resources/.resource_page_template.py.html"

resources = []
resources += get_vars_listing("resources/general")
resources += get_vars_listing("resources/audio")
resources += get_vars_listing("resources/tech")
resources += get_vars_listing("resources/design")
resources += get_vars_listing("resources/art")
resources += get_vars_listing("resources/narrative")

for resource in resources:
    resource_path = resource["get_link"]
    output_path = f"{resource_path}.py.html"
    print(f"Generate resource {resource_path} (out: {output_path})")
    generate_file_from_template(template_path, output_path, resource)