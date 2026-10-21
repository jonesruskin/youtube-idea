# ElevenLabs setup: step by step

The video already renders without a voice (timings are estimated). Once you add a key, one command voices every line. The video, captions (.srt) and music ducking then **re-time automatically** to the real performance.

> 🔒 **Never paste your API key into a chat, an issue, a commit or a script.** It only ever goes in `.env` (local, git-ignored) or in your cloud environment's secret settings.

---

## 1. Pick a plan
1. Go to **elevenlabs.io → Pricing**.
2. Choose a **paid** plan. The free tier has **no commercial licence**, so you can't monetize with it.
   - **Starter** (~$5–6/mo, ~30K credits) is enough to test voices and voice Episode 1 a few times.
   - **Creator** (~$22/mo, ~100–121K credits) is the realistic plan for 1–2 episodes a week with retakes.
   - Prices change, so check the live pricing page.
3. **Credit math:** Episode 1 is ~6,800 characters. On the standard multilingual model that's about 7K credits per full pass. Re-runs only re-voice lines you changed, because everything is cached.

## 2. Create an API key
1. Log in, click your **profile (bottom-left) → API Keys**.
2. Click **Create API Key** and name it `blink-files`.
3. **Restrict it:** enable **Text to Speech** only. Set a **monthly credit limit** (e.g. 40,000) so a mistake can't drain your account.
4. Click **Create** and **copy the key once**. It won't be shown again.

## 3. Choose the voices (one per character)
1. Open **Voices → Voice Library** (or **Explore**).
2. Use the search filters (accent, age, gender, use case "narrative/storytelling"). Audition with a line from the script; the Executor's "Item One. To the one who fixes what everyone else throws away… we leave our ship." is a good test.
3. Click **Add to My Voices** for each pick.
4. In **My Voices**, open each voice → **⋯ → Copy voice ID**.

| Speaker | `.env` variable | Casting brief |
|---|---|---|
| Executor (narrator) | `VOICE_EXECUTOR` | Calm, warm-dry, faintly formal, mid-low. Museum curator who loves you. |
| Jonah | `VOICE_JONAH` | 17, Nigerian English, quick, funny, bright |
| Grandma Ada | `VOICE_GRANDMA` | Older Nigerian woman, commanding, warm |
| Mrs. Bello | `VOICE_MRS_BELLO` | Older, soft, gentle |
| Desmond Kade | `VOICE_KADE` | 60s, smooth, unhurried, polished |
| Priya (assistant) | `VOICE_ASSISTANT` | 30s, crisp, deadpan |
| News anchor | `VOICE_ANCHOR` | Broadcast cadence |
| Captain (radio) | `VOICE_CAPTAIN` | West African English, urgent |
| Fisherman | `VOICE_FISHERMAN` | Can reuse the Captain's voice |

> Want something nobody else has? Use **Voice Design** to generate an original Executor voice from a text description. It becomes the channel's audio signature.

## 4a. Running it yourself (on your computer)
```bash
git clone <this repo> && cd youtube-idea
npm install
cp .env.example .env          # then open .env in an editor
```
Fill in `.env`:
```
ELEVENLABS_API_KEY=sk_...your key...
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
VOICE_EXECUTOR=...
VOICE_JONAH=...
# …one line per speaker
```
Then:
```bash
npm run voice ep01     # voices every line → public/audio/ep01/*.mp3 + public/voice/ep01.json
npm run render ep01    # re-times video, score and captions to the real voice → renders/ep01.mp4
```

## 4b. Having Claude do it in the cloud
1. In the Claude Code session title bar, open the **cloud environment** menu → **Edit**.
2. Under **Network secrets** (called *API credentials* in older app versions), add a secret named **`ELEVENLABS_API_KEY`** with your key. If that section isn't offered, add it as an **environment variable** with the same name.
3. Add the `VOICE_*` IDs the same way. Voice IDs aren't secret; you can also just paste them to Claude in chat.
4. Start a **new session** (secrets load at session start) and say: *"Voice and render ep01."*

## Troubleshooting
| Symptom | Fix |
|---|---|
| `ELEVENLABS_API_KEY is not set` | `.env` is missing, or the variable name has a typo |
| `401` | Wrong or revoked key, or the key lacks the Text-to-Speech permission |
| `Missing VOICE_KADE in .env` | Add that speaker's voice ID |
| `429` / quota | Credit limit hit. Raise the key's limit or wait for the monthly reset. |
| A line sounds wrong | Edit its text in `script.ts` (punctuation steers delivery: "..." for a pause, "—" for a cut-off) and re-run `npm run voice`. Only that line is re-voiced. |
| Want more emotion | Lower `stability` / raise `style` for that speaker in `scripts/tts.ts`, or set `ELEVENLABS_MODEL_ID=eleven_v3` (more expressive) |
