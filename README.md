# Bankai — warp gallery

A personal Midjourney moodboard, presented through a **WebGL horizontal "warp"
gallery**: a rail of media tiles that fan vertically toward the left/right edges
with chromatic-aberration fringing, looping infinitely.

## Pages
- **`/`** — landing: wordmark, intro, and board list with a cursor-following hover preview.
- **`/work/patch.html`** — the moodboard warp gallery (images + a looping video texture).

## Tech
Pure static site — HTML, CSS, and vanilla WebGL (no framework, no build step).
The warp is a tessellated tile mesh: a vertex shader does the edge-fan, a fragment
shader does the vertical R/B chromatic split.

## Run locally
```bash
python3 -m http.server 4600
# → http://localhost:4600
```

## Deploy
Zero-config static deploy on Vercel.

---

> **Note:** the moodboard media lives in `assets/moodboard/` (personal Midjourney
> images + one video). The older `assets/patch/` set is unused and kept only for reference.
