from os import listdir, remove
from os.path import join, isdir

def clean(folder, recursive=False, extension=None):
    print(f"Cleaning files in {folder} (*{'.*' if extension == None else extension})")
    for path in listdir(folder):
        if path.startswith("."):
            continue
        
        full_path = join(folder, path)
        
        if isdir(full_path):
            if recursive:
                clean(full_path, recursive, extension)
        else:
            if extension == None or path.endswith(extension):
                remove(full_path)

clean("./css", extension=".css")
clean("./pygen/events", recursive=True, extension=".py.html")
clean("./events", recursive=True, extension=".html")
clean(".", recursive=False, extension=".html")