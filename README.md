# RICAMBIO — landing page

A single-page, scroll-driven 3D story for RICAMBIO (working name): the shared library of verified 3D files for discontinued, non-safety plastic parts of classic cars, and the print shop that makes them real.

Scrolling plays the whole system: a vent clip snaps, the search fails, the owner asks, someone in Torino scans the same part, the file lands with a sparkle, it is checked, printed and shipped, it clicks into place, the owner's "Fits" ranks it higher, someone in Ankara prints it at home, and the library grows.

Built with Vite, React, TypeScript, three.js (React Three Fiber + drei), postprocessing, GSAP ScrollTrigger, Lenis and zustand. All 3D geometry is procedural, so nothing is downloaded at runtime apart from the two Google Fonts.

## Run it

```bash
npm i
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Type-check, then build into `dist/` (relative paths, so it works from any sub-path) |
| `npm run preview` | Serve the production build on http://localhost:4173 |

### URL flags

| Flag | Effect |
|---|---|
| `?debug` | HUD (progress %, scene, local time, FPS, mode) and scene boundary markers. Click a marker on the right rail to jump to that scene. In the console, `__ricambio.go(0.42)` jumps to any progress. |
| `?lang=tr` | Start in Turkish (the header and footer also have an EN/TR toggle; the choice is remembered). |
| `?reduced` | Force reduced-motion mode, the same as the OS setting. |

## Edit the copy

All copy lives in [`src/content.ts`](src/content.ts): the `en` object (default) and the `tr` object, which has the same shape. TypeScript fails the build if a Turkish string is missing.

- **Working name:** change `BRAND.name`. Every string interpolates it.
- **Counters:** `NUMBERS`. The library counters in `NUMBERS.demo` and the per-part fit counts in `LIBRARY_PARTS` are placeholder demo values; the page shows a "demo figures" tag next to them.
- **Cities and people:** `CITIES`, `WANTING_CITIES` (the named "+1" cities in Scene 03; the remaining owners up to `NUMBERS.ownersWanting` are unlabelled dots) and `copy.people`.
- **Links:** `LINKS` holds the CTA and footer targets. Point them at the platform once it is deployed.

## Retime the scenes

`SCENES` in `src/content.ts` holds each scene's global progress range (0 → 1). Ranges are contiguous, so to make a scene longer, move its boundary and the neighbouring scene's boundary together. `BEATS` holds the beats inside each scene in local time (0 → 1), so they stretch with the scene. `STILLS` picks the frame each scene holds in reduced-motion mode.

The camera keyframes are in [`src/three/cameraPath.ts`](src/three/cameraPath.ts) (`DESKTOP_KEYS`, the derived `MOBILE_KEYS`, and the split-screen cameras `SCAN_KEYS` and `HOME_KEYS`), each with the global progress at which the camera arrives. If you move a scene boundary, move its keys with it.

The scroll track is `TRACK.desktopVh` (1300vh) tall on desktop and `TRACK.mobileVh` (1500vh) on mobile. The same values appear as `--track-vh` in `src/styles.css`.

| # | Scene | Range |
|---|---|---|
| 00 | Hero | 0.000 – 0.050 |
| 01 | Snap | 0.050 – 0.140 |
| 02 | Search fails | 0.140 – 0.220 |
| 03 | Request | 0.220 – 0.300 |
| 04 | Torino scan (split) | 0.300 – 0.450 |
| 05 | Sparkle | 0.450 – 0.520 |
| 06 | Checks + print | 0.520 – 0.660 |
| 07 | Ship | 0.660 – 0.725 |
| 08 | Click, it fits | 0.725 – 0.815 |
| 09 | Print at home (split) | 0.815 – 0.875 |
| 10 | Library grows | 0.875 – 0.955 |
| 11 | Keep them on the road | 0.955 – 1.000 |

## The car

### Clay or painted

`CAR_FINISH` at the top of `src/content.ts` switches the look:

- `'painted'` (default): deep Italian red `#9E1B1E`, clearcoat 1, clearcoat roughness 0.15, roughness 0.35. It reads as a scale model.
- `'clay'`: warm clay-red, roughness 0.8, no clearcoat. It reads as a designer's clay model.

### Drop in your own model

Put a file at `public/models/car.glb`, then restart `npm run dev` (or rebuild). It replaces the procedural body, glass and wheels. The procedural interior and the vent stay, because the story needs them.

- Scale: 1 unit = 1 metre. The front faces +X, the driver's side (left-hand drive) is at −Z, and the wheels sit on y = 0. Centre the car on the origin.
- The roof cut-away (a horizontal clipping plane) is applied to every material in the file. The separate driver's-door cut-away only works on the procedural body.
- The model must not carry any manufacturer logo, badge or shield grille (see Legal below).

## How it is built

- **One persistent canvas** (`src/three/Experience.tsx`) sits behind the DOM. All narrative text is real HTML in fixed per-scene layers (`src/scenes/*`), an `h1` for the hero and an `h2` per scene; the canvas is `aria-hidden`.
- **One master timeline.** Lenis smooth scrolling feeds one ScrollTrigger that writes `progress` (0 → 1) into the zustand store. Every animation, in the DOM and in 3D, is a pure function of that progress (`src/story.ts`, `useSceneProgress`), so scrolling backwards plays everything in reverse with no broken states. Only ambient loops (turntable, pulses, glints) use time, and they are stateless.
- **Camera:** CatmullRom positions and slerped orientations between keyframes, eased per move, with lens shift for composition, a back-off for narrow screens and mouse parallax in the hero.
- **The only hard cuts are the two split screens** (Torino scan, Ankara home print). Each renders its own scene into an HDR render target with its own camera; the result is composited right of a sliding seam, so bloom and tone mapping cover both halves. On mobile the seam sweeps all the way across, so the splits become sequential.
- **Paper colour:** the scene is tone-mapped with Khronos PBR Neutral, and the background and floor use the colour that comes out of the tone mapper as exactly `#D1D7DE`, so the WebGL paper matches the CSS paper.
- **Procedural assets:** the car (`carGeometry.ts`), the clip and its broken halves (`clipGeometry.ts`), the dot map from hand-simplified coast polygons (`lib/geo.ts`), the printer, the kraft box with canvas-drawn QR card and label, and twelve library micro-parts (`libraryParts.ts`). Shaders: the layer-by-layer print (`shaders/layerPrint.ts`) and the scan sweep and point cloud (`shaders/scanSweep.ts`).

## Reduced motion

With `prefers-reduced-motion` (or `?reduced`), the story becomes a static step sequence: each scene holds one still chosen in `STILLS`, both in the 3D scene and in the DOM, and scenes change with fades only. Smooth scrolling, parallax, the turntable and the looping CSS animations are off, and the canvas only renders when the scene changes.

## Mobile

The layout is designed for portrait: the phone UI owns the bottom of the screen with the 3D above it, headlines scale with `clamp()`, map views frame Torino ↔ Istanbul instead of all of Europe, split screens play one after the other, and the page never scrolls sideways (16 px minimum gutter).

## Performance

- DPR is clamped to [1, 1.75] and adjusted by drei's `PerformanceMonitor`. When frame rate drops, quality steps down: multisampling first, then bloom (except during the sparkle, which needs it), and the scan point cloud halves.
- **Staged mounting:** the hero mounts first; the map, the scan, the print shop and the library mount one per idle period once the visitor starts scrolling, or all at once when the page opens deep in the story.
- **No main-thread shader stalls:** the studio environment (PMREM) is baked in a Web Worker on an OffscreenCanvas, then materials are pre-compiled one per task for the exact render-target variant they use, with `KHR_parallel_shader_compile`.
- Geometry is built once and cached; materials are shared; nothing is allocated inside the render loop. Contact shadows only re-render while the car turns.

Measured with Lighthouse 12 (desktop preset) on the production build (`npm run build && npm run preview`): **Performance 99, Accessibility 100** (TBT ≈ 40–50 ms, LCP 0.7 s, CLS 0.004).

Frame rate has not been measured on the reference devices (M1 MacBook Air, a mid-range phone); the `?debug` HUD shows live FPS for checking them.

## Project structure

```
src/
  content.ts      all copy (EN + TR), scene timings, beats, stills, names, cities, counters
  store.ts        zustand: progress, scene, lang, sound (+ debug, mobile, reduced motion, quality)
  story.ts        pure functions of progress shared by the DOM and the 3D scene
  lib/            remap, easing, scroll (Lenis + ScrollTrigger), geo, sound, anchors
  three/          procedural 3D: car, vent + clip, map, beacon, sparkle, printer, box,
                  library, split view, camera rig, shaders, environment worker
  scenes/         Scene00Hero … Scene11CTA: the DOM layer for each range
  ui/             header, footer, loader, phone and its screens, silhouettes,
                  hand-drawn arrows, marker strikes, annotations, calipers, debug HUD
```

## Legal

RICAMBIO is not affiliated with or endorsed by Alfa Romeo or Stellantis. Brand and model names are used only to describe compatibility. All parts are aftermarket replacements, not original parts. The car is a stylised, badge-free hatchback and is not a replica of any real model. Safety-critical parts (brakes, steering, suspension, seat belts, airbags, fuel system) are never shown being printed, and PLA is never recommended.
