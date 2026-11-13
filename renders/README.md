# Episodes

One folder per video, holding everything YouTube Studio needs. Open `UPLOAD.md` in a folder for the step-by-step upload sheet.

| File | Use |
|---|---|
| `upload.mp4` | The high-quality master to upload (Git LFS) |
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
| – | [`legacy`](legacy) | Earlier flat-animation pilot (superseded) |

Only the masters (`upload.mp4`) are stored with Git LFS. After cloning, run `git lfs pull` to download them. Previews are plain files under 95 MB.
