"""Free YouTube research helpers: public search, channel and watch pages, no API key.

Pages are cached on disk (NICHE_CACHE, default .cache/niche-scan) so re-runs are free and polite.
Keep volume low: this reads the same pages a browser would, one request at a time per worker.
"""
import json, re, sys, time, urllib.request, urllib.parse, os, hashlib
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
CACHE = os.environ.get("NICHE_CACHE") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".cache", "niche-scan")
os.makedirs(CACHE, exist_ok=True)

def get(url, delay=0.8):
    h = hashlib.sha1(url.encode()).hexdigest()
    p = os.path.join(CACHE, h)
    if os.path.exists(p):
        return open(p, encoding="utf-8").read()
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9", "Cookie": "CONSENT=YES+1; PREF=hl=en&gl=US"})
            html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
            open(p, "w", encoding="utf-8").write(html)
            time.sleep(delay)
            return html
        except Exception:
            time.sleep(2 ** (attempt + 1))
    return ""

def initial_data(html):
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html, re.S) or re.search(r'ytInitialData"\]\s*=\s*(\{.*?\});', html, re.S)
    return json.loads(m.group(1)) if m else {}

def walk(o, key):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == key: yield v
            yield from walk(v, key)
    elif isinstance(o, list):
        for v in o: yield from walk(v, key)

def txt(x):
    if not x: return ""
    if "simpleText" in x: return x["simpleText"]
    return "".join(r.get("text", "") for r in x.get("runs", []))

def num(s):
    s = (s or "").replace(",", "").lower()
    m = re.search(r"([\d.]+)\s*([kmb])?", s)
    if not m: return 0
    v = float(m.group(1)); mult = {"k": 1e3, "m": 1e6, "b": 1e9}.get(m.group(2), 1)
    return int(v * mult)

def age_days(s):
    s = (s or "").lower().replace("streamed ", "")
    m = re.search(r"(\d+)\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?|mo|min|y|w|d|h|m|s)\b", s)
    if not m: return None
    n = int(m.group(1)); u = m.group(2)
    table = {"s": 1/86400, "m": 1/1440, "min": 1/1440, "h": 1/24, "d": 1, "w": 7, "mo": 30.4, "y": 365}
    full = {"second": "s", "minute": "m", "hour": "h", "day": "d", "week": "w", "month": "mo", "year": "y"}
    u = full.get(u.rstrip("s"), u) if u not in ("s","ms") else u
    return n * table[u]

def lab_num(s):
    s = (s or "").lower().replace(",", "")
    m = re.search(r"([\d.]+)\s*(thousand|million|billion)?", s)
    if not m: return 0
    return int(float(m.group(1)) * {"thousand": 1e3, "million": 1e6, "billion": 1e9}.get(m.group(2), 1))

def dur(s):
    parts = [int(p) for p in (s or "").split(":") if p.isdigit()]
    t = 0
    for p in parts: t = t * 60 + p
    return t

def search(q, sp):
    """One page (~20) of search results for query q with filter/sort token sp."""
    url = "https://www.youtube.com/results?" + urllib.parse.urlencode({"search_query": q, "sp": sp})
    d = initial_data(get(url))
    out = []
    for v in walk(d, "videoRenderer"):
        try:
            ch = v["ownerText"]["runs"][0]
            out.append({
                "id": v["videoId"], "title": txt(v.get("title")),
                "views": num(txt(v.get("viewCountText"))),
                "age": age_days(txt(v.get("publishedTimeText"))),
                "dur": dur(txt(v.get("lengthText"))),
                "channel": ch["text"],
                "cid": ch["navigationEndpoint"]["browseEndpoint"]["browseId"],
            })
        except Exception:
            pass
    return out

def channel(cid):
    """Subscriber count, video count and the newest ~30 uploads (views, age in days, duration in s)."""
    d = initial_data(get(f"https://www.youtube.com/channel/{cid}/videos"))
    subs = 0; name = ""
    hdr = json.dumps(next(walk(d, "pageHeaderViewModel"), {}))
    m = re.search(r'"content": "([\d.,]+[KMB]?) subscribers"', hdr)
    if m: subs = num(m.group(1))
    m2 = re.search(r'"content": "([\d.,]+[KMB]?) videos?"', hdr)
    nvid = num(m2.group(1)) if m2 else 0
    vids = []
    for lv in walk(d, "lockupViewModel"):
        if lv.get("contentType") != "LOCKUP_CONTENT_TYPE_VIDEO": continue
        md = lv.get("metadata", {}).get("lockupMetadataViewModel", {})
        parts = [p for row in md.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", []) for p in row.get("metadataParts", [])]
        views = 0; age = None
        for p in parts:
            lab = p.get("accessibilityLabel") or p.get("text", {}).get("content", "")
            if "view" in lab: views = lab_num(lab)
            elif "ago" in lab: age = age_days(lab)
        badge = next(walk(lv, "thumbnailBadgeViewModel"), {})
        vids.append({"id": lv.get("contentId"), "title": md.get("title", {}).get("content", ""),
                     "views": views, "age": age, "dur": dur(badge.get("text", ""))})
    return {"cid": cid, "subs": subs, "nvid": nvid, "videos": vids}

def engagement(vid):
    """Likes, views and comment count from the watch page. A like rate far below ~0.2% suggests bought or junk views."""
    html = get(f"https://www.youtube.com/watch?v={vid}")
    likes = re.search(r'along with ([\d,]+) other', html) or re.search(r'"likeCount":"?(\d+)', html)
    views = re.search(r'"viewCount":"(\d+)"', html) or re.search(r'"viewCount":\{"simpleText":"([\d,]+)', html)
    comments = re.search(r'"contextualInfo":\{"runs":\[\{"text":"([\d.,KMB]+)"', html)
    lang = re.search(r'"defaultAudioLanguage":"([^"]+)"', html) or re.search(r'"languageCode":"([a-z]{2})', html)
    l = int(likes.group(1).replace(",", "")) if likes else None
    v = int(views.group(1).replace(",", "")) if views else None
    return {"likes": l, "views": v, "comments": num(comments.group(1)) if comments else None,
            "like_rate": (l / v if l and v else None), "lang": lang.group(1) if lang else None}
