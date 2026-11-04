# DigitalOps — Brand Builder

BUILD / 002. A static, no-backend, no-account interactive guide that turns a
customer's already-validated Offer Engineering output into a recognisable,
consistent brand across six modules. Vanilla HTML/CSS/JS, cloned from Offer
Engineering's architecture. No build step.

```
01 Carry Your Strategy Into a Brand      04 Visual Identity Direction
02 Brand Personality & Voice             05 Brand Assets & Application System
03 Brand Messaging Architecture          06 Brand Guidelines & Final Blueprint
```

**Build status: complete — all 8 roadmap phases shipped, production
release packaged.** See §11 for the phase history and §12 for the full
VS Code → GitHub → live-hosting → Whop walkthrough.

---

## 1. Project overview

The app walks a customer through six modules, each with up to four stages —
**Lesson → Exercise → AI Prompt → Deliverable** — building three original
frameworks (the Brand Anchor, the Signal Map, the Message Ladder) on top of
their own Offer Engineering output. Every exercise answer rolls up into a
single **Brand Blueprint**: a fixed set of eight deliverables, reviewable
on-screen and exportable as a PDF.

A second AI layer sits alongside the six modules: 32 AI prompts in total —
one Core Prompt per module wired directly to the customer's own saved
answers, plus each module's Prompt Library entries — all organised by
category in a dedicated **AI Brand Studio** screen, and all reusable from
either place since the Studio is a filter over the same data, never a copy
of it.

Nothing is server-rendered and nothing is sent to a server. All lesson,
exercise and prompt copy lives in `content/*.json`; all customer answers
live in the browser's `localStorage` under one versioned key.

## 2. Folder structure

```
index.html                   Entry point — loads Google Fonts, the CSS, and js/app.js as a module
README.md                    This file
package.json                 Optional convenience scripts only — no runtime dependencies
.gitignore                   Excludes node_modules/, OS/editor files, logs, and .env* (§12)
.nojekyll                    Tells GitHub Pages to skip Jekyll processing (§12.5)

assets/
  fonts/                      Reserved for self-hosted fonts (currently empty — see §3)
  icons/                      Reserved for icon/image assets (currently empty — the app uses inline SVG)

css/
  tokens.css                  Design tokens (colour, type, spacing, radii) — the identical copy
                               shared with Offer Engineering; the single source of DigitalOps
                               brand identity. Never fork this file.
  base.css                    Reset, buttons, cards, badges, callouts, form controls
  layout.css                  Page-level layout: cover screen, app shell, Blueprint screen
  components.css              Component-level styling: nav rail, sliders, prompt cards, tracker,
                               plus Brand Builder's own additions (.anchor-grid, .ladder,
                               .pair-row, .consistency-grid-table) for its three exercise shapes
                               with no Offer Engineering precedent
  responsive.css              Cross-cutting breakpoint rules (desktop sidebar vs. mobile drawer)
  print.css                   The Brand Blueprint's print/PDF-export-only stylesheet

js/
  app.js                      Entry point — render orchestration (see the render-model comment
                               at the top of this file before touching it)
  router.js                   Minimal hash router (#/m4/exercise, #/blueprint, #/brand-studio, …)
  state.js                    Single source of truth for every customer answer, plus every
                               computed value (deliverable completion, progress %, module
                               status). MODULE_IDS and DELIVERABLES live here. hydrate() does a
                               real per-field deep merge over saved data, not Offer Engineering's
                               shallow one (see §11's Phase 0 note).
  storage.js                  All localStorage reads/writes go through here — nowhere else.
                               Versioned schema (SCHEMA_VERSION) with a safe in-memory fallback
                               if localStorage is unavailable.
  navigation.js                Module order (MODULE_IDS-driven), content loading/caching,
                                prev/next sequencing, MODULE_TITLES.
  components/
    cover.js                     The landing/cover screen
    cover-showcase.js            The 6-stage animated hero visual on the cover screen
    nav-rail.js                  Persistent module tree (desktop sidebar / mobile drawer)
    progress-indicator.js        Persistent top progress bar
    lesson-block.js               The reading area — renders every lesson in a module plus its
                                   framework illustration (Modules 1–3)
    framework-diagrams.js         The Brand Anchor / Signal Map / Message Ladder legend visuals
    exercise-fields.js            One builder function per exercise type (six total)
    prompt-guide.js                The AI Prompt Engine: platform tabs, copy-to-clipboard, the
                                    six-part Prompt Guide card (Objective → Quality Checklist),
                                    and resolveContext() for the six Core Prompts' live-state
                                    substitution. Exports buildPromptGuideCard and
                                    buildPlatformTabs for brand-studio.js to reuse directly.
    brand-studio.js                The AI Brand Studio screen — flattens every module's prompts
                                    into one list of 32 and filters by category (7 tabs). Holds
                                    no prompt content of its own.
    blueprint.js                   The compiled Brand Blueprint (8 sections) + "Export as PDF",
                                    and buildMasterContextPrompt() — the deterministic,
                                    app-assembled portable brand-context block.
    resources.js                  Glossary + reset-progress

content/
  m1.json … m6.json             One file per module — lesson copy, exercise config, and a
                                 `prompts` array (Core + Library, category/tier tagged).
                                 Nothing module-specific is hardcoded in the JavaScript.
```

## 3. Technologies used

- **Vanilla JavaScript (ES modules)** — no framework, no bundler, no transpilation.
- **Vanilla CSS** — no preprocessor, no CSS framework.
- **Two Google Fonts** (DM Sans, Manrope), loaded via a CDN `<link>` in
  `index.html` — the identical fonts Offer Engineering uses, for a
  consistent typographic identity across DigitalOps. There is no
  offline/self-hosted fallback shipped; `assets/fonts/` and `assets/icons/`
  are placeholders (every icon currently used is inline SVG).
- **`localStorage`** — the only persistence layer. No database, no backend.
- **No external JS dependencies of any kind.** `package.json` exists only
  to offer an `npm start` convenience script; `npm install` has nothing to
  install.

## 4. Installing dependencies

There are none. `package.json` has no `dependencies` or `devDependencies`.
Running `npm install` will succeed instantly and install nothing.

## 5. Running the application locally

Opening `index.html` directly from disk (`file://…`) will **not** work —
the app loads its content with `fetch()`, which browsers block over
`file://`. Serve the folder over HTTP instead:

```bash
# Option A — via npm (uses Python's http.server under the hood)
npm start

# Option B — directly, no npm needed
python3 -m http.server 8080
# or
npx serve .
# or
php -S localhost:8080
```

Then open the printed URL (e.g. `http://localhost:8080/`) in a browser.

## 6. Building the application

There is no build step. This is a static site — the files in this
repository are the files you deploy.

## 7. Testing the application

No automated test suite ships inside this repository. Every phase of the
build was verified during development with ad-hoc Playwright scripts run
against a local static server — full module navigation, all six exercise
types, all 32 AI prompts' platform tabs and copy button (with live
substitution verified against real saved answers), the AI Brand Studio's
category filtering, the eight-deliverable Blueprint and its PDF export, and
`localStorage` persistence across reloads. Those scripts live outside this
folder and are not part of the deliverable.

Two checks were run repeatedly throughout the build, not just once, because
Offer Engineering's own pre-deployment audit had already flagged both as
real risks (see §11):
- **Unsafe HTML insertion** — every customer-entered string that reaches
  the Blueprint, a Core Prompt, or the Master Brand Context Prompt is
  escaped before touching `innerHTML`. Verified with an actual
  `<img onerror=…>` payload typed into several different fields, confirmed
  never to execute and never to appear as a live tag in the rendered DOM.
- **Malformed saved-state crashes** — `state.js`'s `hydrate()` does a
  type-aware, per-field deep merge: a saved value is only used if it has the
  same type as the default it replaces (and array entries, enums and slider
  ranges are checked), otherwise just that field falls back to its default
  and every other valid answer is kept. The pre-deployment audit found that
  the earlier merge only handled missing or `null` fields — wrong-typed
  values (e.g. a string where an object belongs) still crashed the app on
  every load — and that was fixed. Verified by writing deliberately
  malformed `localStorage` values (invalid JSON, wrong types, `null` array
  entries, prototype-pollution keys) and confirming every route still renders.

Separately, for **storage unavailable**: if the browser blocks `localStorage` (some
embedded or private-browsing contexts), the app keeps working in memory and
shows a dismissible warning that progress won't survive a refresh.

The scripts used for these checks are not shipped in this repository, so
this section describes what was tested rather than providing a way to rerun it.

To test manually:
1. Run the app locally (§5).
2. Click through each of the six modules' Lesson → Exercise → AI Prompt →
   Deliverable stages.
3. On the AI Prompt stage, confirm the ChatGPT/Claude/Gemini tabs all show
   the same prompt text, the Core Prompt (badged, first) reflects whatever
   you entered in that module's Exercise, and the copy button works.
4. Visit `#/brand-studio` and confirm all seven category tabs show the
   right prompts, including ones from other modules.
5. Visit `#/blueprint` and confirm all eight deliverables reflect what you
   entered, then click "Export as PDF."
6. Reload the page and confirm your answers are still there.

## 8. Deploying it

Any static file host works — this is plain HTML/CSS/JS with no
server-side code: GitHub Pages, Netlify, Vercel (as a static site),
Cloudflare Pages, S3 + CloudFront, or a plain Nginx/Apache document root.
Upload the repository contents as-is; there is nothing to build first. The
only requirement is that it's served over HTTP(S), not opened as a local
file (see §5).

**Whop embed (the planned v1 delivery path, per the approved product
spec):** the app is a self-contained static bundle, embeddable in a Whop
product page the same way Offer Engineering is. No server, database or
authentication is required or used. `localStorage` persistence is
per-browser with no cross-device sync — the Resources screen discloses
this to the customer directly, and the Reset-progress control there is the
only way to clear it.

## 9. How the content JSON files are organised

Every module's lesson text, exercise configuration, and AI prompts live in
`content/m1.json` through `content/m6.json` — nothing module-specific is
hardcoded in the JavaScript. `js/state.js`'s `MODULE_IDS` is the one list
that says which content files exist and in what order; everything else
(router, nav rail, progress indicator, prev/next logic) reads from that
list dynamically.

A lesson object looks like:

```json
{
  "id": "2.2",
  "title": "Map your Signal Map",
  "readTime": "6 min read",
  "status": "approved",
  "body": ["paragraph one (HTML allowed)", "paragraph two"],
  "insight": "the one key-insight sentence shown at the end of the lesson"
}
```

A module's exercise config names an exercise `type` (e.g.
`"brand-foundation"`, `"signal-map"`, `"message-ladder"`) that maps to one
builder function in `js/components/exercise-fields.js`'s `builders`
object.

A module's `prompts` array holds every AI prompt that module owns — one
`tier: "core"` entry plus some number of `tier: "library"` entries, each
tagged with a `category` (the AI Brand Studio's seven tabs are derived
from these tags, not hardcoded):

```json
{
  "id": "m3-brand-messaging-development",
  "tier": "core",
  "category": "Brand Messaging",
  "title": "Brand Messaging Development",
  "objective": "…",
  "requiredInputs": ["…"],
  "template": "… {{m3.belief}} … {{m3.promise}} …",
  "expectedOutput": "…",
  "refinementPrompts": ["…"],
  "qualityChecklist": ["…"]
}
```

Only `tier: "core"` templates use `{{module.field}}` placeholder tokens,
resolved at render time from the customer's own saved answers — see
`resolveContext()` in `js/components/prompt-guide.js` for the full list of
available placeholders. `tier: "library"` templates use plain
`[bracketed instructions]` instead, filled in by hand; this is deliberate
(see §11), not a shortcut that was meant to be wired up later.

## 10. Where to make future changes

- **Fix a typo or rewrite a lesson** → edit the relevant `content/mN.json`
  and refresh the browser. No rebuild needed.
- **Add, edit, or reorder an AI prompt** → the same file's `prompts`
  array — it's a JSON edit for any Library entry; only a Core Prompt needs
  a matching `resolveContext()` key if it introduces a new placeholder.
- **Add a field to an exercise, or a new exercise type** →
  `js/components/exercise-fields.js` (add a `build…()` function and
  register it in the `builders` map), plus the matching shape in
  `state.js`'s `defaultAnswers()` and a setter function.
- **Change what counts as "done" for a deliverable, or add/remove one** →
  `state.js`'s `DELIVERABLES` array and `deliverableStatus()`. The
  Blueprint is fixed at eight deliverables by design, mirroring Offer
  Engineering's fixed-count pattern.
- **Add or reorder a module** → update `MODULE_IDS` in `js/state.js`,
  add/rename the matching `content/mN.json` file, and update
  `MODULE_TITLES` in `js/navigation.js`. Everything else is already
  generic over however many modules exist.
- **Change the AI Prompt Engine's available live-state context** →
  `resolveContext()` in `js/components/prompt-guide.js`.
- **Change the PDF layout or pagination** → `css/print.css` and
  `printSectionBody()` / `exportPdf()` in `js/components/blueprint.js`.
- **Rebrand or start the next DigitalOps guide (the next BUILD step, or a
  LAUNCH/GROW guide)** — this codebase was built to be cloned, same as
  Offer Engineering was for this one:
  1. Copy the project folder; keep `css/tokens.css` as-is.
  2. Replace `content/m1–m6.json` with the new guide's modules; update
     `MODULE_IDS` / `MODULE_TITLES` to match (the count doesn't have to be
     six).
  3. Add any new exercise type the new guide needs in
     `exercise-fields.js`.
  4. Update `state.js`'s `DELIVERABLES` and `defaultAnswers()` for the new
     guide's own outputs.
  5. Decide whether the new guide needs its own AI prompt system; if so,
     follow the Core/Library tier pattern in `prompt-guide.js` rather than
     inventing a new one.
  6. Change the cover screen's copy and the `<title>`/description in
     `index.html`.

## 11. Build history and known limitations

Built phase by phase against an approved product strategy and an 8-phase
implementation roadmap, each phase reviewed before the next began:

| Phase | What it delivered |
| --- | --- |
| 0 — Repository Audit & Technical Planning | Audited Offer Engineering's actual code (not assumptions); found two real issues — unescaped HTML in `deliverable-tracker.js`'s `summarizeDeliverable()`, and a shallow state merge that crashes on partially-shaped saved data — both flagged as must-not-repeat |
| 1 — Project Foundation | Sibling repo scaffolded; design system ported verbatim |
| 2 — State & Exercise Architecture | Full data model, a real deep merge (the Phase 0 fix), all six exercise builders |
| 3 — Design System & Application Shell | Real navigation, routing, shell, and the three framework illustrations |
| 4 — Curriculum & Module Implementation | All 18 lessons written as real, approved copy |
| 5 — AI Prompt Engine | All 32 prompts built — six Core Prompts wired to live state, 26 Library prompts |
| 6 — AI Brand Studio | The cross-module category browser — a filter over Phase 5's data, never a copy of it |
| 7 — Brand Blueprint & Export | The compiled 8-section Blueprint, PDF export, and the deterministic Master Brand Context Prompt — Finding 1 (unsafe HTML insertion) explicitly not repeated, verified with a real XSS payload |
| 8 — Quality Assurance & Deployment | A full-app regression pass re-verifying Findings 1 and 2 everywhere customer text can flow, an accessibility and mobile spot-check, and this README |

**Known limitations:**
- **No cross-device sync, by design.** Progress lives only in the browser
  it was entered in. The Reset-progress control on the Resources page
  discloses this explicitly.
- **No automated test suite ships in this repository** (see §7).
- **No offline font fallback shipped** (see §3).
- **The offer-import mechanism is a manual text intake, not a file
  import.** The customer copies their Offer Blueprint fields in by hand in
  Module 1 — there is no shared account system or file format between the
  two static apps. A real "import your Offer Blueprint as a file" feature
  is a plausible future enhancement, not a v1 requirement.
- **No image-generation or logo-rendering capability.** Module 4 and its
  AI prompts produce a text brief and portable, tool-agnostic prompts for
  whichever image-capable AI tool the customer already uses — this is
  stated in the product itself, not just this README.
- **26 of the 32 AI prompts use manual-paste placeholders, not live-state
  wiring.** Deliberate, per the approved spec: only the six Core Prompts
  need `resolveContext()` wiring, which keeps the AI Prompt Engine's real
  code surface small rather than growing to 32 wired entries for
  marginal benefit.

## 12. VS Code → GitHub → live hosting → Whop

This section is the complete path from the unzipped release folder on your
machine to a live, embeddable URL. Every command below is exact — run them
from a terminal, in order, inside the project folder (the one containing
`index.html`).

### 12.1 Open it in VS Code

```bash
code .
```

(Or: VS Code → File → Open Folder… → select the unzipped `brand-builder`
folder.) No extensions, no workspace config, and no build task are
required — it's plain HTML/CSS/JS. If you want in-editor Live Server
reloading, the "Live Server" extension works too, but §5's `npm start` /
`python3 -m http.server` is all that's actually needed.

### 12.2 Initialise a Git repository

```bash
git init
git add .
git commit -m "Initial commit — Brand Builder v1.0.0"
```

`.gitignore` is already in place (`node_modules/`, OS files, editor files,
logs, `.env*`) — nothing in this project needs any of those ignored files
anyway, since there are no dependencies and no secrets.

### 12.3 Create and connect a GitHub repository

Using the GitHub CLI (`gh`), if you have it:

```bash
gh repo create brand-builder --public --source=. --remote=origin
```

Or manually: create an empty repository named `brand-builder` on
github.com (no README, no `.gitignore`, no license — you already have
all three), then:

```bash
git remote add origin https://github.com/<your-username>/brand-builder.git
git branch -M main
```

### 12.4 Push it

```bash
git push -u origin main
```

### 12.5 Deploy with GitHub Pages

GitHub Pages is the natural fit — this is already a static site with no
server-side code.

1. On GitHub: **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a
   branch**.
3. Branch: **main**, folder: **/ (root)**. Save.
4. GitHub builds and publishes within a minute or two, at:
   `https://<your-username>.github.io/digitalops-brand-builder/`

No `base` path, router config, or rewrite rule is needed. Every asset
reference in this project is a **relative** path (`css/tokens.css`,
`js/app.js`, `fetch('content/m1.json')`, …), and routing is **hash-based**
(`#/m1/lesson`, `#/blueprint`, …) — entirely client-side, resolved by
JavaScript after the page loads. That combination means the app works
correctly however deep its URL path is (a GitHub Pages *project* site like
the one above, a *custom domain*, or a path inside a Whop iframe), with
zero configuration and no 404/fallback page required — unlike apps built
on history-API routing, which need a server rewrite rule to avoid a 404 on
refresh.

**Other static hosts work identically** (§8 already covers this): Netlify,
Vercel (as a static site, not a framework preset), Cloudflare Pages, or
any plain web server — just point it at this folder's contents as-is.

A `.nojekyll` file sits at the project root — it tells GitHub Pages to
serve the files exactly as they are, skipping its default Jekyll
processing step. Nothing in this project needs Jekyll, so this just
avoids an unnecessary processing pass; it's not required for the app to
work, only to deploy in the most predictable way.

### 12.6 Embed the deployed app in Whop

Per the approved product spec (§8), this is the planned v1 delivery path.

1. In your Whop dashboard, add an **Embed** (iframe-type) app/experience to
   your product.
2. Set its URL to your deployed app, e.g.
   `https://<your-username>.github.io/digitalops-brand-builder/` — do **not** add a
   trailing route like `#/m1`; let the app load with no hash (an empty
   hash shows the cover page) and navigate from there.
3. Set the embed to a tall viewport (this is a scrolling, multi-screen app,
   not a single card) — a minimum height around `900px`, with scrolling
   enabled inside the frame, reads comfortably on both desktop and mobile.
4. No authentication, API keys, or server configuration is needed on
   either side — the app is entirely self-contained and reads/writes only
   to the visiting browser's own `localStorage`. The Resources screen
   already discloses the no-cross-device-sync behaviour this implies to
   the customer directly.
5. Load the embed once yourself end-to-end (cover → one module → the
   Blueprint) to confirm the iframe isn't stripping `localStorage` or
   blocking the Google Fonts CDN request in your specific Whop
   configuration, since that's the one piece outside this repository's
   control.

### 12.7 Making a future change and redeploying

Because there's no build step, redeploying after an edit is just:

```bash
git add .
git commit -m "describe the change"
git push
```

GitHub Pages rebuilds automatically within a minute or two of the push —
nothing else to run.
