# What If a Black Hole Passed Through Our Solar System? (8:20)

| File | What it is |
|---|---|
| `ep_blackhole_preview.mp4` | Compressed 1080p preview (under 95 MB) for watching in the browser or on GitHub |
| `upload/ep_blackhole_upload.mp4.part00…` | **The file to upload to YouTube**: 1080p, CRF 23, AAC 320k, -14 LUFS (~254 MB, split to fit GitHub's 100 MB file limit) |
| `thumbnail.png` | 1280×720 thumbnail ("30 YEARS LEFT") |
| `captions.srt` | Captions timed to the narration. Upload them in YouTube Studio → Subtitles |
| `metadata.md` | Title options for A/B testing, description with chapters and sources, mid-roll ad times, tags |

Rejoin the upload file:
```bash
cat upload/ep_blackhole_upload.mp4.part* > ep_blackhole_upload.mp4
```
To get the lossless-ish 2.4 GB master, re-run the pipeline (see `cinema/README.md`). It is not stored in the repo.
