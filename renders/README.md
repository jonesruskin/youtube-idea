# Episodes

One folder per video, holding everything YouTube Studio needs: `upload.mp4` (the high-quality master to upload), `thumbnail.png`, `captions.srt` and `metadata.md`, plus a smaller `preview.mp4` for watching on GitHub.

| # | Folder | Video |
|---|---|---|
| 01 | [`01_black_hole`](01_black_hole) | What If a Black Hole Passed Through Our Solar System? |
| 02 | [`02_jupiter`](02_jupiter) | What If You Fell Into Jupiter? |
| – | [`legacy`](legacy) | Earlier flat-animation pilot (superseded) |

Only the masters (`upload.mp4`) are stored with Git LFS. After cloning, run `git lfs pull` to download them. Previews are plain files under 95 MB.
