# La Bodega — Checkout Ops Mission (preview)

Colorful Three.js store walkthrough for Danny Varghese’s Checkout Ops case study.

## Preview branch

This branch (`preview/colorful-3d`) is a review build. The live GitHub Pages game on `main` is unchanged until this is approved and merged.

## Local

Serve the repo root over HTTPS or HTTP (ES modules + import maps):

```bash
npx --yes serve .
```

Open the printed URL. Append `?embed=1` to mimic the portfolio iframe.

## Modes

- **3D Explore** — overview → select zone → camera fly-in → apply fix → return
- **List Walkthrough** — HTML mission panel only (default for reduced motion / low-capability / WebGL failure)

## Modules

| Path | Role |
|------|------|
| `js/content.js` | Zone copy + metrics aligned to case study |
| `js/scene.js` | Colorful store meshes + instancing |
| `js/camera.js` | Constrained orbit + GSAP fly-to/return |
| `js/interaction.js` | Pointer Events picking |
| `js/ui.js` | Mission panel, live region, keyboard |
| `js/main.js` | App wiring, pause-on-hidden, DPR caps |
| `css/styles.css` | UI chrome |
