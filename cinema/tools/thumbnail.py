"""Thumbnail for an episode: runs <ep>/thumb.py:make(build_dir). 1280x720 PNG (<2 MB) + a 1920x1080 master."""
import os, sys, importlib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
ep = sys.argv[1] if len(sys.argv) > 1 else "ep_blackhole"
d = os.path.join(ROOT, "build", ep)
os.makedirs(d, exist_ok=True)
print(importlib.import_module(ep + ".thumb").make(d))
