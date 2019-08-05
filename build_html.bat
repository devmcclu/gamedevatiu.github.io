@echo off
cd pygen

echo Generating content pages
py generate_content.py resources/.resource_page_template.py.html resources/general
py generate_content.py resources/.resource_page_template.py.html resources/audio
py generate_content.py resources/.resource_page_template.py.html resources/tech
py generate_content.py resources/.resource_page_template.py.html resources/design
py generate_content.py resources/.resource_page_template.py.html resources/art
py generate_content.py resources/.resource_page_template.py.html resources/narrative

py generate_content.py events/.event_page_template.py.html events
py generate_content.py news/.news_page_template.py.html news
py generate_content.py featured/.featured_page_template.py.html featured

echo Generating HTML output
py generate.py
cd ..