# Gravity Dial — channel setup kit

| File | Where it goes in YouTube Studio | Spec |
|---|---|---|
| `profile_800.png` | Customization → Branding → Picture | 800×800 PNG (shown as a 98 px circle) |
| `banner_2048x1152.png` | Customization → Branding → Banner image | 2048×1152; logo + name sit inside the 1235×338 phone-safe area |
| `watermark_150.png` | Customization → Branding → Video watermark (display time: **Entire video**) | 150×150 transparent PNG |
| `description.txt` | Customization → Basic info → Description | 752 / 1000 characters |

`_preview_*` files are review aids only (how the avatar looks at 98 px; the banner's phone/desktop crop lines). Don't upload them.

## Basic info
- **Name:** Gravity Dial
- **Handle:** `@gravitydial` (fallbacks: `@gravitydialsim`, `@gravitydialspace`)
- **Channel keywords:** space, black hole, jupiter, astronomy, astrophysics, physics simulation, space simulation, planets, solar system, science documentary, cosmos, space exploration

## Regenerate
`cd cinema && python tools/channel_art.py` — reads the name, tagline and logo from `cinema/engine/brand.py`, so the art always matches the videos.
