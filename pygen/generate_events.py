from os import listdir, remove
from os.path import join, isdir

from genutil import *

template_path = "events/.event_page_template.py.html"

events = get_vars_listing("events")
for event in events:
    event_path = event["get_link"]
    output_path = f"{event_path}.py.html"
    print(f"Generate event {event_path} (out: {output_path})")
    generate_file_from_template(template_path, output_path, event)