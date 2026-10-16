---
tags:
  - prompt
  - kod
  - alfa-parca
  - landing-page
tarih: 2026-10-15
---

# Alfa Parça — Landing Page Promptu (3D scroll hikâyesi)

> Kopyalanacak prompt aşağıdaki çizginin altından başlar. Çalışma adı **RICAMBIO** (İtalyanca "yedek parça") geçici bir isimdir; isim değişirse tek yerden (`content.ts`) değiştirilir.

---

## ROLE

You are a senior creative developer and motion designer who builds award-level, scroll-driven 3D storytelling websites (think Awwwards "Site of the Day"). You are fluent in three.js, React Three Fiber, GSAP ScrollTrigger, custom shaders and performance tuning. You care as much about narrative clarity as about visual polish.

## GOAL

Build a single-page, scroll-driven 3D landing page for **RICAMBIO** (working name). As the visitor scrolls, a short wordless-feeling film plays out: a classic Italian car loses a small plastic part, its owner can't find a replacement anywhere, someone in another city scans the same part and uploads it, the owner sees it appear with a sparkle, orders a 3D print, the part arrives, he clicks it into place, and his confirmation helps the next person. Another owner prints the same file at home. In the end the camera pulls back to reveal a growing library of parts.

A first-time visitor must understand the whole system in under two minutes of scrolling, without reading a single paragraph. It is also being shown to a university course jury, so it must explain the business model clearly and look exceptional.

## WHAT THE PRODUCT IS (context for copy and logic)

- RICAMBIO is a shared library of verified 3D files for **discontinued, non-safety plastic parts** of classic and youngtimer cars, starting with Alfa Romeo: vent clips, louvres, knobs, bezels, latches, trim clips, brackets.
- Two ways to get a part:
  1. **Download the file** and print it yourself. The file includes stored print settings and material advice, so the first print succeeds.
  2. **Order a print.** We run three automatic checks (approved non-safety part, published file with settings, right material for where it goes in the car), print on demand in a heat-resistant material, measure key dimensions, and ship it with a QR fit-check card.
- Every owner who answers "Fits / Needs tweaking / Does not fit" updates the part's **fitment record**. Confirmed files rank higher, so the next owner gets the right part faster.
- Manufacturers keep their digital models private, so the library is built from real parts. Owners scan or model their own parts (phone or scanner plus calipers), partner garages contribute parts they replace every week, and a send-in service lets customers post a broken original for us to scan.
- We **never** print safety-critical parts: brakes, steering, suspension, seat belts, airbags, fuel system.
- Every part is an **aftermarket replacement, not an original**, and is labelled that way.

## NON-NEGOTIABLE RULES (legal and brand)

1. **No Alfa Romeo trademarks anywhere.** No logo, shield grille, cross-and-serpent emblem, badge, wordmark or brand typeface. Not on the car, not in the UI, not in the favicon.
2. The car is a **stylised, badge-free compact Italian hatchback from around the year 2000.** It must not be a replica of any real model. Render it as a designer's clay or scale model so it reads as "a car with character", not as a specific product.
3. "Alfa Romeo" may appear only as plain text describing compatibility, e.g. "Fits Alfa Romeo 146". The footer must carry the disclaimer: *"RICAMBIO is not affiliated with or endorsed by Alfa Romeo or Stellantis. Brand and model names are used only to describe compatibility. All parts are aftermarket replacements, not original parts."*
4. Never show a safety-critical part being printed.
5. Material accuracy: sun-exposed cabin parts are printed in **ASA**. Never show PLA as a recommendation; if PLA appears, it is crossed out with "softens in a hot cabin".

## TECH STACK

- **Vite + React + TypeScript.** Next.js App Router is fine if your environment prefers it; keep it a single route.
- **three.js** through **@react-three/fiber** and **@react-three/drei**.
- **GSAP + ScrollTrigger** for the master timeline, plus **Lenis** for smooth scrolling, synced with ScrollTrigger.
- **@react-three/postprocessing**: Bloom (for sparkles and the printer hot-end), very subtle Noise or film grain, and Vignette.
- **zustand** for a tiny global store holding `progress` (0→1), the current scene, the language and the sound toggle.
- **No paid or external assets required.** All 3D geometry is built procedurally in code, so the project runs with zero model downloads. Provide an optional slot `public/models/car.glb`: if that file exists, it replaces the procedural car.
- Google Fonts only.

### Architecture

- **One persistent, fixed, full-viewport `<Canvas>`** sits behind the HTML. Do not create separate canvases per section.
- **One master scroll timeline.** The page is a tall scroll track (about 1300vh on desktop). The overall `progress` value runs from 0 to 1. Each scene owns a sub-range and reads its local progress with a helper: `const t = remap(progress, start, end)` (clamped 0–1, with eased variants).
- **The camera follows a keyframed path** (position + target) interpolated by progress. Use CatmullRom curves for position and slerp for orientation. Never cut the camera hard, except in the deliberate split-screen moment.
- **HTML overlay sections** (headlines, phone UI, cards) live in normal DOM above the canvas and are pinned or faded via ScrollTrigger. All narrative text must be real HTML so it works for SEO and screen readers. The canvas is `aria-hidden`.
- Folder structure:
  ```
  src/
    content.ts          // ALL copy, EN + TR, plus scene timings
    store.ts            // zustand: progress, scene, lang, sound
    lib/remap.ts, lib/easing.ts
    three/
      Car.tsx           // procedural car + optional GLB swap
      Clip.tsx          // the hero part (procedural)
      Printer.tsx, Phone3D.tsx, MapDots.tsx, PartsLibrary.tsx
      shaders/          // layerPrint, scanSweep, sparkle
      CameraRig.tsx
    scenes/             // Scene00Hero.tsx … Scene11CTA.tsx (DOM + 3D for each range)
    ui/                 // PhoneScreen, Checklist, HandArrow (self-drawing SVG), Counter
  ```
- A `?debug` URL flag shows a small HUD (progress %, scene name, FPS) and scene boundary markers.

## ART DIRECTION

Keep the look consistent with our pitch deck, but push it much further.

- **Mood:** "An engineering drawing meets an Italian car magazine." Calm, confident, tactile. Generous negative space, with one strong idea per screen.
- **Background:** soft blue-grey paper `#D1D7DE` with a faint millimetre-grid texture and very light film grain. Deeper scenes (night, scanning) can shift to ink `#14181D`.
- **Ink:** `#111111` for headlines.
- **Accent, action:** orange `#E8731E`, used only for "Order a print" and the primary CTA.
- **Accent, trust:** teal `#2B7A8C`, used for "Fit confirmed", successful checks and scan light.
- **Car paint:** deep Italian red `#9E1B1E` with clearcoat (MeshPhysicalMaterial), or a warm clay-red if you go for the clay-model look. Interior in dark graphite plastic `#2A2D31`.
- **Typography (two families maximum):**
  - Display: **Archivo** (Black/ExtraBold, tight tracking −2% to −4%), very large and confident like the deck.
  - Mono: **JetBrains Mono** for part numbers, dimensions, counters and technical labels.
- **Signature details:**
  - **Hand-drawn SVG arrows** that draw themselves on scroll (`stroke-dashoffset`), a direct nod to the deck.
  - **Technical annotations** that appear next to 3D objects: thin leader lines, dimension lines with values like `Ø 6.2`, `2.0 mm`, `2.4 g`, and part codes in mono.
  - Crossed-out text drawn with a hand-drawn red marker stroke.
- **Lighting:** a soft studio environment (`<Environment preset="studio" />` or a procedural lightformer setup), a key light from the top-left, and `<ContactShadows />` under the car. There is no visible floor horizon; the car sits on paper.
- **Motion principles:** physical and weighted, never bouncy-cartoony. Use `power3`/`expo` easing for camera moves and short springs only for small UI pops. Every movement must explain something.

## CHARACTERS (how people appear)

Do not use realistic 3D humans. People appear through **their hands, their phones and minimal flat vector silhouettes** (2D SVG, ink colour, 2–3 poses each) in the HTML layer. Names appear as small mono captions.

- **Emre**, Istanbul. Owns the red hatchback (our story's car: an Alfa Romeo 146). His dashboard air-vent clip snapped.
- **Luca**, Torino. Owns the same model and has an intact clip. He has a handheld scanner and calipers.
- **Selin**, Ankara. Has her own 3D printer at home and prints the file herself.

## THE STORY: SCENE BY SCENE

Progress ranges are guidelines; tune them for rhythm. The copy below is final English copy; put it in `content.ts` and add Turkish translations under `tr`.

---

### Scene 00 — Hero (0.00 → 0.06)

- **3D:** The red hatchback sits on a slow turntable (one rotation per ~40 s, independent of scroll) in a 3/4 front view, softly lit with a contact shadow. The camera breathes slightly with mouse position (parallax ±2°).
- **DOM:**
  - Small mono label at top-left: `RICAMBIO — parts that no longer exist, made again.`
  - Headline, huge and set in two lines: **"Twenty years on the road. Undone by three grams of plastic."**
  - Sub-line: "The shared library of 3D files for parts nobody makes anymore — and the print shop that makes them real."
  - A scroll cue made of a hand-drawn arrow that keeps redrawing itself.
- **Exit:** The turntable eases to a stop at a front-3/4 angle and the headline slides up.

### Scene 01 — Snap (0.06 → 0.15)

- **3D:** The camera dollies through the windscreen into the cabin. Use a **cut-away**: the roof and the driver-side door fade out through a clipping plane or opacity, so the dashboard is visible from outside. The camera settles on the central air vent.
- **The moment:**
  1. A hairline crack (an emissive line) grows across the vent's small mounting clip.
  2. The clip **snaps into two pieces**: a tiny flash, then both halves fall with a convincing arc and spin, bounce twice on the floor mat and roll under the seat.
  3. The vent louvres droop and hang loose.
- **Annotation:** A leader line points at the empty slot: `AC VENT CLIP · 2.4 g · 1999 · DISCONTINUED`.
- **DOM:** A one-word headline, **"Snap."**, followed by "One clip. The rest of the car is perfectly fine."
- **Sound (optional):** The page has a muted-by-default sound toggle. If it is on, play a small plastic crack at the snap.

### Scene 02 — The search fails (0.15 → 0.24)

- **3D → DOM:** The camera pulls back out of the car and drifts to the side. A **phone** rises into frame, either as a 3D phone with a drei `<Html transform>` screen or as a crisp CSS phone in the overlay; pick whichever looks sharper. Emre's thumb (a flat silhouette) scrolls.
- **On the phone screen**, three result cards slide in one by one. Each gets **struck through with a hand-drawn red marker** as the user scrolls:

  | Where he looks | What he finds |
  |---|---|
  | Dealer parts | Not produced anymore |
  | Online parts shops | No listings for this model |
  | Marketplace / junkyard | Used · condition unknown |

- Next to the phone, a mono counter ticks with scroll: `Days searching: 1 … 6 … 23`.
- **Headline:** **"Nobody has it. Not the dealer, not the shops, not the junkyard."**

### Scene 03 — The request (0.24 → 0.33)

- **Phone:** Emre opens RICAMBIO. Selector chips animate in sequence, each one "clicking" into place: `Alfa Romeo` → `146` → `2001` → `Cabin · Dashboard` → `AC vent clip`.
- The result is an empty state: "No file for this part yet." There is one big button, **"Request this part"**. A tap ripple appears and the button turns into "Requested ✓".
- **3D:** A small teal **beacon pulse** leaves the phone, rises and lands on a **dot-matrix map of Europe and Turkey** that fades in behind (procedural dot grid; no map tiles needed). It lands on Istanbul and begins to pulse.
- Then other dots light up across the map (Milano, München, Lyon, Birmingham, Ankara…), each with a small "+1". The counter reads: `37 owners want this part`.
- **Headline:** **"So he asks. And he isn't the only one."**

### Scene 04 — Meanwhile, in Torino: the scan (0.33 → 0.47)

This is the visual centrepiece.

- **Transition:** A **split screen.** A vertical seam slides in from the right. The left half keeps Istanbul dimmed (the map pin still pulses); the right half opens on a new space at night, ink background with a caption `MEANWHILE — TORINO`. Luca sees the request on his phone: "37 owners need the AC vent clip you have."
- **On a small turntable** sits an *intact* clip, the same part as the hero part.
- **The scan** has four beats:
  1. **Light sweep.** A teal scanner line sweeps across the part, sampling its surface.
  2. **Point cloud.** Points (sampled with `MeshSurfaceSampler`: ~20k on desktop, ~5k on mobile) appear only where the sweep has passed, flickering into place.
  3. **Mesh.** The points fuse into a faceted mesh (a wireframe overlay fading into a solid).
  4. **CAD.** The mesh resolves into a clean, smooth model. Dimension lines draw themselves (`Ø 6.2`, `2.0`, `14.8`). A flat silhouette of calipers closes on the tab, and the measured value overrides the scanned one, turning from `2.07` to `2.00`.
- **Insight card (DOM):** "The scan is the reference. The calipers are the truth. A 0.1 mm error is the difference between a click and a crack."
- **Mirror trick (small):** "Only have the broken one? We scan its mirror twin and flip it." Show a ghost copy mirroring across a dashed axis.
- **Upload:** A progress bar fills, and a **file card** appears:
  ```
  AC vent clip — Alfa Romeo 146 (930)
  v1 · 3MF + STEP · print settings included
  Material: ASA (sun-exposed cabin)
  Contributed by Luca, Torino
  ```
- **Headline:** **"Someone, somewhere, still has the part. That's enough."**

### Scene 05 — The sparkle (0.47 → 0.55)

- **3D:** The split seam closes. The file becomes a **stream of teal particles** that travels along a curved arc on the map from Torino to Istanbul, with a soft trail.
- It lands in Emre's phone, and the **phone lights up with a sparkle burst**: a bloom particle explosion with a few long-lived glints floating up.
- Emre's silhouette switches pose from slumped to arms up.
- **Phone screen:** A notification, "✨ Your part exists now." It opens the part page:
  - Teal badge: `Be the first to confirm fit`
  - "Print in ASA. PLA softens in a hot cabin." (with PLA visibly struck out)
  - "Aftermarket replacement part, not an original."
  - Two buttons: **Download file** (outline) and **Order a print** (orange)
- A hand-drawn arrow points at "Order a print" and the thumb taps it.
- **Headline:** **"Found it."**

### Scene 06 — Checked, then printed on demand (0.55 → 0.71)

- **Part 1: three automatic checks.** Three cards tick in sequence, each with a drawn checkmark:
  1. **Approved part.** "Not a safety part."
  2. **Published file.** "All print settings included."
  3. **Right material.** "Cabin, sun-exposed → ASA."

  Small red footnote: "If any check fails, the order is held and we contact you."
- **Part 2: the print.** The camera glides to an **enclosed FDM printer** (stylised, unbranded, low-poly, with a glass door and a warm interior light).
  - The clip **grows layer by layer**, using a shader with a rising clip height and visible layer lines.
  - The nozzle traces the current layer with an emissive hot-end glow (bloom) and a thin bright toolpath line.
  - A mono timer reads `Set of 3 · 1h 58m`, compressed by scroll.
  - A pipeline strip in the DOM highlights each step as it happens: **Queue → Slice → Print → Finish → Check**.
- **Finish and check:** The support structures snap away and fall. Calipers close on the tab and a teal label appears: `2.00 mm · within tolerance ✓`.
- **Headline:** **"Checked before it's printed. Measured before it ships."**

### Scene 07 — We ship it (0.71 → 0.78)

- **3D:** Three clips drop into a small kraft box. A card with a **QR code** slides in on top, reading "Did it fit? Scan me." The lid folds shut, tape runs across it, and a shipping label prints `TORINO → ISTANBUL` (or simply the city name).
- The box travels back along the map arc. A counter reads `Day 1 … 2 … 3`.
- **Headline:** **"Three days later."**

### Scene 08 — Click. It fits. (0.78 → 0.87)

- **3D:** We are back in the cut-away cabin. Emre's hand silhouette guides the new clip into the slot.
  - On contact you see a small shockwave ring and a "click" (with the optional sound).
  - The vent louvres spring back into place and sweep left and right once, as if air is flowing.
  - Subtle air particles drift out of the vent.
- **Phone:** He scans the QR code and the **fit-check form** appears (dark card, as in the deck):
  - "Did it fit your 146?"
  - **Fits** · Needs tweaking · Does not fit
  - He taps **Fits**. "Each answer updates the part's fitment record."
- **Network effect:** The badge on the part card counts up from `Fit confirmed by 1 owner` → `14 owners`. A small ranking list shows the file rising to **#1** for "146 · AC vent clip".
- **Headline:** **"His 'yes' makes the next search shorter."**

### Scene 09 — Or print it yourself (0.87 → 0.92)

- **Split, lighter tone:** "Meanwhile in Ankara." Selin taps **Download file** on her laptop. The download contains the model plus a `print-settings` card (layer 0.16 mm · 4 walls · 40% gyroid · ASA 250 °C / bed 100 °C · orientation shown as a mini diagram).
- Her own printer (a different stylised machine) prints the same clip in the same layer-by-layer shader, faster through scroll compression.
- She also taps **Fits**, and the counter moves to 15.
- **Headline:** **"Have a printer? The file comes with everything your first print needs."**

### Scene 10 — The library grows (0.92 → 0.98)

- **3D:** The camera pulls far back. Around the car, **dozens of small parts float in an orderly exploded-view constellation**, each one procedural, low-poly and labelled in mono:
  - `116 · vent louvre`
  - `156 · sun visor clip`
  - `147 · window switch lug`
  - `164 · AC flap gear`
  - `75 · door handle bezel`
  - `33 · glovebox latch`
  - `916 · tweeter grille`
  - `105 · heater cable clip`
- Parts gently orbit. Hovering one on desktop lifts it and shows its fit count.
- **Three sources (DOM cards)**, each with a hand-drawn arrow feeding into the constellation:
  1. **Owners scan their own.** "A part, a phone or scanner, and calipers."
  2. **Partner garages.** "They replace the same failing parts every week."
  3. **Send-in service.** "Post us a broken original. We scan it, publish the file and print yours."
- **Trust strip, "What we never print":** brake, steering, suspension, seat belt, airbag and fuel system. Each is a simple line icon with a struck-through line. Caption: "If it keeps you alive, it comes from the manufacturer."
- **Counters** (placeholder numbers, clearly marked as demo in `content.ts`): `parts in library`, `models covered`, `fit confirmations`.

### Scene 11 — Keep them on the road (0.98 → 1.00)

- **3D:** The parts fly back and settle into the car. The car is whole again, parked, and the turntable resumes slowly. Golden-hour lighting shifts for a warm ending.
- **Headline:** **"Keep them on the road."**
- **CTAs:**
  - **Find your part** (primary, orange)
  - **Upload a part** (outline)
  - **Join as a maker** (text link)
- **Footer:** the disclaimer from the rules, plus links: How it works · Safety & scope · For garages · Contact · EN/TR toggle.

## PROCEDURAL 3D: HOW TO BUILD THE ASSETS

- **Car:** Build it from an extruded side-profile path (`ExtrudeGeometry` with bevel) for the body, separate extruded glass panels, wheel arches, simple generic 5-spoke wheels (not a "teledial" or any recognisable brand wheel), and slim head and tail lights. Make the nose an **unbadged, simple horizontal-slot design**, with no shield shape. The interior needs only a dashboard slab, a central vent with 4–5 louvres, two seats, a steering wheel and a floor mat.
  - Material: MeshPhysicalMaterial with clearcoat 1, clearcoatRoughness 0.15, roughness 0.35 for paint, or a clay look (roughness 0.8, no clearcoat). Expose both through a constant.
- **Clip (hero part):** `ExtrudeGeometry` from a 2D C-shaped profile with a small tab and a locating pin, about 15 mm wide at real scale. It must look like a real injection-moulded part, with draft angles and small fillets (bevel). The broken version is two pieces split along a jagged edge.
- **Point cloud:** Use `MeshSurfaceSampler` on the clip and a `Points` material with size attenuation. The reveal is driven by a uniform `uSweep` that compares each point's X against the sweep position, with a tiny random delay per point.
- **Layer-print shader:** Use `onBeforeCompile` on a standard material: discard fragments above `uHeight`; add layer lines with `step(fract(worldPos.y / layerH), 0.08)` darkening; and give a bright emissive band at the current layer.
- **Map:** A procedural dot grid. Keep a small embedded array of lat/long points for Europe and Turkey (low resolution is fine) and project them onto a plane. Arcs are `QuadraticBezierCurve3` with `MeshLine` or tube geometry, and particles move along the curve.
- **Printer:** Box frame, glass door (transmission material or simple transparency), gantry, nozzle, and an interior warm `PointLight`.
- **Parts library:** 8–12 procedural micro-parts (louvre, knob, gear, latch, grille, bezel, clip variants) reused with instancing for the constellation.

## PERFORMANCE

- Desktop target: 60 fps on an M1 MacBook Air. Mobile target: 45+ fps on a mid-range phone.
- DPR clamp `[1, 1.75]` with drei `<AdaptiveDpr>` / `<PerformanceMonitor>`. If performance drops, turn bloom off first, then halve the point count.
- Geometry is built once and memoised. Materials are shared. Nothing is created inside `useFrame`.
- Show a **"layer-by-layer" loading screen**: the RICAMBIO wordmark prints itself line by line while the scene initialises.
- First meaningful paint under 2.5 s on 4G (the 3D canvas initialises after the hero text is visible).

## RESPONSIVE AND MOBILE

- The mobile layout is designed, not shrunk: headlines scale with `clamp()`, and the 3D camera keyframes have a **mobile variant** (closer framing, vertical composition).
- Split-screen scenes become **sequential** on mobile: Istanbul → swipe-like transition → Torino.
- The phone UI is the centre of the screen on mobile, and 3D shows above or below it.
- No horizontal scroll at any width. Side gutter of 16 px minimum.

## ACCESSIBILITY

- `prefers-reduced-motion`: replace scrubbed 3D with a **static illustrated step sequence** (a pre-rendered still or a simple 2D version per scene) and use fades only. The story must remain fully understandable.
- All story copy is semantic HTML (`h2` per scene, `p` for sub-lines). The canvas is `aria-hidden="true"`.
- CTAs are keyboard reachable with a visible focus ring. Text contrast meets WCAG AA on every background used.
- Sound is off by default. The toggle is labelled.

## CONTENT AND LANGUAGE

- All copy, scene timings, names, cities and counter values live in **`src/content.ts`**, with `en` (default) and `tr` objects. An EN/TR toggle sits in the header.
- Turkish copy should be natural, not literal. For example, "Snap." → **"Çıt."**, and "Found it." → **"Buldu."**

## DELIVERABLES

1. A runnable project (`npm i && npm run dev`) with no external asset downloads required.
2. `README.md` covering how to run it, how to edit copy (`content.ts`), how to retime scenes, how to drop in `public/models/car.glb`, and how to toggle the clay versus painted car.
3. A `?debug` HUD.
4. Lighthouse: Performance ≥ 80 on desktop, Accessibility ≥ 95.

## ACCEPTANCE CRITERIA

- [ ] Scrolling from top to bottom tells the full story: snap → search fails → request → remote scan → sparkle → checks → print → ship → install → fit confirmed → print-at-home → library grows → CTA.
- [ ] The clip visibly breaks and falls in Scene 01, and the new one visibly clicks into the same slot in Scene 08 (same camera framing as a "rhyme").
- [ ] The scan shows sweep → points → mesh → clean CAD with dimension lines.
- [ ] The print shows a layer-by-layer build with a glowing nozzle.
- [ ] The sparkle moment uses bloom and is the brightest moment on the page.
- [ ] There are no Alfa Romeo logos, badges, shield grilles or brand fonts anywhere, and the disclaimer is in the footer.
- [ ] No safety-critical part is ever shown being printed. PLA is never recommended.
- [ ] Scrolling backwards plays everything in reverse smoothly, with no broken states.
- [ ] Reduced-motion mode and mobile layout are both complete and readable.
- [ ] 60 fps desktop / 45+ fps mobile on the reference devices.

## BUILD ORDER

1. Scaffold the project, Lenis + ScrollTrigger + the progress store, the debug HUD, and `content.ts` with all copy.
2. Camera rig, procedural car, the hero and snap scenes (to prove the pipeline end to end).
3. Phone UI, the search and request scenes, the dot map and the beacon.
4. Split screen, the scan sequence (shader + sampler) and the upload card.
5. Particle arc, the sparkle with bloom, and the part page.
6. Checks, printer, the layer-print shader, finish and caliper check.
7. Shipping box, install, the fit-check form and the counter.
8. The print-at-home lane, the parts constellation, the trust strip and the CTA.
9. Mobile camera variants, reduced motion, performance pass and Turkish copy.

Before you write code, reply with a short plan: the scene timing table, your camera keyframe list, and any rule you think conflicts with another. Then build it.
