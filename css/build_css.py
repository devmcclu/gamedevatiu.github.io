from os import listdir, system

paths = listdir(".")

for path in paths:
    if path.endswith(".less"):
        print(f"Compile {path}")

        in_file = path
        out_file = path.replace(".less", ".css")

        system(f"lessc {in_file} {out_file} --clean-css=\"--s1 --advanced --compatibility=ie8\"")