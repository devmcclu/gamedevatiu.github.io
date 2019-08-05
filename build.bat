@echo off

echo Clean files...
py clean.py
echo done

echo Build HTML
call .\build_html.bat
echo done

echo Build CSS...
call .\build_css.bat
echo done

echo Minify HTML...
py minify_html.py
echo done