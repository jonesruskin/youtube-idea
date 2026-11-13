# Episodes

One folder per video. Each holds the preview plus everything YouTube Studio needs except the high-quality upload file. That file is rebuilt locally with `cinema/tools/finalize.sh <episode>` and is not committed.

| # | Folder | Video |
|---|---|---|
| 01 | [`01_black_hole`](01_black_hole) | What If a Black Hole Passed Through Our Solar System? |
| 02 | [`02_jupiter`](02_jupiter) | What If You Fell Into Jupiter? |
| – | [`legacy`](legacy) | Earlier flat-animation pilot (superseded) |

Previews (`*.mp4`) are stored with Git LFS. After cloning, run `git lfs pull` to download them.
