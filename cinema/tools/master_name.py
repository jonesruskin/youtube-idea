"""The master's file name = the YouTube title (so the file you upload is named like the video).
Characters that file systems reject (\\ / : * ? " < > |) are removed.   python tools/master_name.py <ep>"""
import os, re, sys, importlib.util

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def name_for(title):
    s = re.sub(r'[\\/:*?"<>|]', "", title).strip().rstrip(".")
    return re.sub(r"\s+", " ", s) + ".mp4"


def name(ep):
    spec = importlib.util.spec_from_file_location("s", os.path.join(ROOT, ep, "script.py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return name_for(m.TITLE)


if __name__ == "__main__":
    print(name(sys.argv[1]))
