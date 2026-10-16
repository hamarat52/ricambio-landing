# RICAMBIO — landing page

A single-page, scroll-driven 3D story for RICAMBIO (working name): the shared library of verified 3D files for discontinued, non-safety plastic parts of classic cars, and the print shop that makes them real.

Built with Vite, React, TypeScript, three.js (React Three Fiber + drei), GSAP ScrollTrigger, Lenis and zustand. All 3D geometry is procedural, so nothing needs to be downloaded at runtime.

## Run it

```bash
npm i
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Type-check, then build into `dist/` |
| `npm run preview` | Serve the production build |

### URL flags

| Flag | Effect |
|---|---|
| `?debug` | HUD (progress %, scene, local time, FPS) and scene boundary markers. Click a marker on the right rail to jump to that scene. |
| `?lang=tr` | Start in Turkish (the header and footer also have an EN/TR toggle). |
| `?reduced` | Force reduced-motion mode, the same as the OS setting. |

## Edit the copy

All copy lives in [`src/content.ts`](src/content.ts): the `en` object (default) and the `tr` object, which has the same shape. TypeScript fails the build if a Turkish string is missing.

- **Working name:** change `BRAND.name`. Every string interpolates it.
- **Counters:** `NUMBERS`. The library counters in `NUMBERS.demo` are placeholder demo values and are shown with a "demo figures" tag.
- **Cities and people:** `CITIES`, `WANTING_CITIES` (the "+1" dots in Scene 03) and `copy.people`.
- **Links:** `LINKS` holds the CTA and footer targets. Point them at the platform once it is deployed.

## Retime the scenes

`SCENES` in `src/content.ts` holds each scene's global progress range (0 → 1). Ranges are contiguous, so to make a scene longer, move its boundary and the neighbouring scene's boundary together. `BEATS` holds the beats inside each scene in local time (0 → 1), so they stretch with the scene.

The scroll track is `TRACK.desktopVh` (1300vh) tall on desktop and `TRACK.mobileVh` (1500vh) on mobile. The same values appear as `--track-vh` in `src/styles.css`.

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

## Project structure

```
src/
  content.ts      all copy (EN + TR), scene timings, names, cities, counters
  store.ts        zustand: progress, scene, lang, sound (+ debug, mobile, reduced motion)
  lib/            remap, easing, scroll (Lenis + ScrollTrigger), progress hooks
  three/          procedural 3D: car, clip, printer, map, library, shaders, camera rig
  scenes/         Scene00Hero … Scene11CTA: the DOM layer (and 3D) for each range
  ui/             header, footer, debug HUD, phone screen, checklist, hand-drawn arrows
```

Every animation is a pure function of the scroll `progress`, so scrolling backwards plays the story in reverse with no broken states.

## Legal

RICAMBIO is not affiliated with or endorsed by Alfa Romeo or Stellantis. Brand and model names are used only to describe compatibility. All parts are aftermarket replacements, not original parts. The car is a stylised, badge-free hatchback and is not a replica of any real model.
