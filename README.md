# WARP — warp gallery

A faithful front-end recreation of a design-studio site, centred on a **WebGL
horizontal "warp" gallery**: a rail of media tiles that fan vertically toward the
left/right edges with chromatic-aberration fringing, looping infinitely.

## Pages
- **`/`** — landing: wordmark, intro, work list, and a cursor-following hover preview.
- **`/work/patch.html`** — the warp gallery (real images + looping video textures).

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

> **Note:** the photography/video in `assets/patch/` are reference brand assets used
> for this recreation study. Swap in your own media before using this publicly.
