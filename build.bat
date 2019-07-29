@echo off

echo Clean files...
py clean.py
echo done

echo Generate events...
cd pygen
py generate_events.py
cd ..
echo done

echo Build HTML...
cd pygen
py generate.py
cd ..
echo done

echo Build CSS...
cd css
py build_css.py
cd ..
echo done

echo Minify HTML...
py minify_html.py
echo done