# Episodes

One folder per video, holding everything YouTube Studio needs. Open `UPLOAD.md` in a folder for the step-by-step upload sheet.

| File | Use |
|---|---|
| `<YouTube title>.mp4` | The high-quality master to upload, named exactly like the video's title (Git LFS). Added only after the preview is approved |
| `title.txt` | Main title (alternates for Test & compare are in `UPLOAD.md`) |
| `thumbnail.png` | 1280×720 thumbnail |
| `description.txt` | Paste-ready description: hook, chapters, sources, credits, hashtags |
| `tags.txt` | Paste-ready tags |
| `captions.srt` | English subtitles, timed to the narration |
| `pinned_comment.txt` | First comment to post and pin |
| `UPLOAD.md` | Checklist: every Studio setting, title A/B variants, ad breaks, end screen |
| `preview.mp4` | Smaller copy for watching on GitHub |

| # | Folder | Title |
|---|---|---|
| 01 | [`01_black_hole`](01_black_hole) | We Let a Black Hole Loose in Our Solar System |
| 02 | [`02_jupiter`](02_jupiter) | We Dropped a Ship Into Jupiter. Here's How Far It Got. |
| 03 | [`03_rogue_planet`](03_rogue_planet) | A Rogue Planet Is Coming. The Date It Arrives Decides Everything. |
| 04 | [`04_tanis`](04_tanis) | These Fish Saw the First Hour After the Dinosaur Asteroid. Here's Every Minute. |
| – | [`episodes/ep01-zero-g/release`](../episodes/ep01-zero-g/release) | Earlier flat-animation pilot (The Blink Files, superseded) |

**Upload order:** see [`EPISODES.md`](../EPISODES.md). Each episode's ending teases the next one.

Only the masters (`<title>.mp4`) are stored with Git LFS, and only once a preview is approved. After cloning, run `git lfs pull` to download them. Previews are plain files under 95 MB.
