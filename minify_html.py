from os import listdir, system
from os.path import join, isdir

minify = "html-minifier --collapse-whitespace --remove-comments --remove-optional-tags --remove-redundant-attributes --remove-script-type-attributes --remove-tag-whitespace --use-short-doctype --minify-css true --minify-js true"

def minify_all(folder, recursive=False):
    paths = listdir(folder)
    for path in paths:
        path = join(folder, path)
        if isdir(path):
            if recursive:
                minify_all(path, recursive)
        elif path.endswith(".html"):
            print(f"Minify {path}")
            system(f"{minify} {path} -o {path}")


minify_all(".", recursive=False)
minify_all("./events", recursive=True)
