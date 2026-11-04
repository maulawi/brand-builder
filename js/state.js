// state.js — single source of truth for every customer answer, plus the computed
// values (deliverable completion, progress %) the UI reads.
// Nothing outside this file writes to localStorage directly — see storage.js.
//
// Adapted from Offer Engineering's state.js (see the Phase 0 audit). One deliberate
// change from that file: hydrate() below does a real per-field DEEP merge over saved
// data, not a shallow per-module merge — Offer Engineering's shallow merge was Phase
// 0's Finding 2 (a partially-shaped saved module silently wipes its missing fields
// instead of falling back to defaults for just those fields). Fixed here from the
// start rather than ported forward.

import { loadState, saveState, clearState as clearPersisted, isStorageAvailable } from './storage.js';

const MODULE_IDS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];

// Every module owns at least one Blueprint deliverable (unlike Offer Engineering's
// M5, which owned none and needed a moduleStatus() special case to avoid
// `[].every(Boolean)` reading as vacuously "done" — see the Phase 0 audit). That
// edge case does not recur here, confirmed by this list: m6 owns three.
const DELIVERABLES = [
  { id: 'brand-foundation', label: 'Brand Foundation', module: 'm1' },
  { id: 'personality-voice-profile', label: 'Brand Personality & Voice Profile', module: 'm2' },
  { id: 'messaging-architecture', label: 'Messaging Architecture', module: 'm3' },
  { id: 'visual-identity-brief', label: 'Visual Identity Brief', module: 'm4' },
  { id: 'assets-application-guide', label: 'Brand Assets & Application Guide', module: 'm5' },
  { id: 'brand-guardrails', label: 'Brand Guardrails', module: 'm6' },
  { id: 'quick-reference-card', label: 'Quick-Reference Brand Card', module: 'm6' },
  { id: 'master-context-prompt', label: 'Master Brand Context Prompt', module: 'm6' },
];

// The touchpoints and identity elements the Consistency Grid (M5) checks off.
// A fixed grid is the Phase 2 scope; letting customers add their own touchpoints
// is a reasonable Phase 4+ enhancement, not required by the approved spec.
const GRID_TOUCHPOINTS = ['socialProfiles', 'contentTemplates', 'productCover', 'email', 'salesPage', 'signOff'];
const GRID_ELEMENTS = ['voice', 'colour', 'typography', 'logoUse'];

function emptyGrid() {
  const grid = {};
  GRID_TOUCHPOINTS.forEach((t) => {
    grid[t] = {};
    GRID_ELEMENTS.forEach((e) => { grid[t][e] = false; });
  });
  return grid;
}

function defaultAnswers() {
  return {
    m1: {
      // Manual Offer Blueprint intake (§3 of the product strategy) — the customer
      // copies these in from their own Offer Engineering Blueprint. Plain text,
      // nothing auto-imported (no shared backend between the two static apps).
      intake: {
        targetCustomer: '', mainProblem: '', desiredOutcome: '',
        promise: '', uvp: '', differentiation: '', positioning: '',
      },
      // The Brand Anchor. audienceTruth and brandPromise are meant to start as a
      // reflection of the intake's targetCustomer/mainProblem and uvp/promise —
      // exercise-fields.js pre-fills them but leaves them editable, since the
      // framework's own rule is "pulled from, not re-derived," not "locked."
      anchor: { belief: '', audienceTruth: '', brandPromise: '', signature: '' },
      brandName: '', nameNote: '',
    },
    m2: {
      signals: { formalCasual: 5, boldGentle: 5, playfulSerious: 5, expertRelatable: 5 },
      voiceRules: { use: '', avoid: '', sentenceStyle: '', humourLevel: '', address: '' },
    },
    m3: {
      ladder: { belief: '', promise: '', proof: '', audienceLanguage: '', oneLiner: '' },
    },
    m4: {
      mood: '',
      colourDirections: [emptyDirection(), emptyDirection()],
      typePairings: [emptyDirection(), emptyDirection()],
      logoType: null, // 'wordmark' | 'lettermark' | 'symbol' | 'combination'
      logoRequirements: '',
    },
    m5: {
      consistencyGrid: emptyGrid(),
      signatureElements: '',
    },
    m6: {
      guardrails: [''],
      stressTestNotes: '',
    },
  };
}
function emptyDirection() { return { direction: '', rationale: '' }; }

function defaultState() {
  return {
    answers: defaultAnswers(),
    nav: { lastModule: 'm1', lastStage: 'lesson', promptPlatform: 'chatgpt', studioCategory: 'Brand Strategy' },
    // audienceTruthTouched/brandPromiseTouched must live in defaultState()'s own
    // shape (not be added ad hoc at runtime) — hydrate()'s deep merge only
    // preserves keys that exist on the default object; an ad-hoc key would be
    // silently dropped on the next reload.
    meta: { startedAt: new Date().toISOString(), audienceTruthTouched: false, brandPromiseTouched: false },
  };
}

// Validation limits used by hydrate() — declared before the store is created below,
// because hydrate() runs immediately and `const`s are not usable before their line.
const LOGO_TYPE_IDS = ['wordmark', 'lettermark', 'symbol', 'combination'];
const STAGE_IDS = ['lesson', 'exercise', 'prompt', 'deliverable'];
const PLATFORM_IDS = ['chatgpt', 'claude', 'gemini'];
const MAX_GUARDRAILS = 8;
const MAX_PAIR_ROWS = 6;

// ---- internal store ----
let state = hydrate();
const listeners = new Set();
let saveTimer = null;
let lastSavePersisted = true; // false once a save fails (storage blocked or full)

// A type-aware, recursive deep merge: `base` (always the complete default shape) is
// the schema iterated over, so a `saved` object missing a field falls back to that
// field's default individually, instead of the whole parent object being replaced
// (Phase 0's Finding 2). A saved value is only accepted when it has the same type as
// the default it replaces — a string where an object belongs, an object where text
// belongs, and so on, fall back to the default for just that field, so tampered or
// corrupted storage can't crash a render (pre-deployment audit, S1). Valid answers
// elsewhere are preserved. Arrays are taken from `saved` wholesale when present;
// their entries are then checked by sanitizeState() below, since the right shape of
// an entry depends on which array it is.
function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function deepMerge(base, saved) {
  if (saved === null || saved === undefined) return base;
  if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
  if (isPlainObject(base)) {
    if (!isPlainObject(saved)) return base;
    const out = { ...base };
    Object.keys(base).forEach((key) => { out[key] = deepMerge(base[key], saved[key]); });
    return out;
  }
  if (base === null) return typeof saved === 'string' ? saved : base; // e.g. logoType, validated further below
  if (typeof base === 'number') return typeof saved === 'number' && Number.isFinite(saved) ? saved : base;
  return typeof saved === typeof base ? saved : base;
}

// Per-field checks deepMerge() can't express generically: array entries, enums and
// ranges. Anything invalid falls back to the default for that field only.
function sanitizeState(st, defaults) {
  const a = st.answers;

  Object.keys(a.m2.signals).forEach((k) => {
    a.m2.signals[k] = Math.min(10, Math.max(0, Math.round(a.m2.signals[k])));
  });

  if (!LOGO_TYPE_IDS.includes(a.m4.logoType)) a.m4.logoType = null;

  const cleanPairs = (list) => {
    const rows = list.filter(isPlainObject).slice(0, MAX_PAIR_ROWS).map((row) => deepMerge(emptyDirection(), row));
    while (rows.length < 2) rows.push(emptyDirection());
    return rows;
  };
  a.m4.colourDirections = cleanPairs(a.m4.colourDirections);
  a.m4.typePairings = cleanPairs(a.m4.typePairings);

  const guardrails = a.m6.guardrails.filter((g) => typeof g === 'string').slice(0, MAX_GUARDRAILS);
  a.m6.guardrails = guardrails.length ? guardrails : defaults.answers.m6.guardrails;

  if (!MODULE_IDS.includes(st.nav.lastModule)) st.nav.lastModule = defaults.nav.lastModule;
  if (!STAGE_IDS.includes(st.nav.lastStage)) st.nav.lastStage = defaults.nav.lastStage;
  if (!PLATFORM_IDS.includes(st.nav.promptPlatform)) st.nav.promptPlatform = defaults.nav.promptPlatform;
  return st;
}

function hydrate() {
  const saved = loadState();
  const base = defaultState();
  if (!isPlainObject(saved)) return base;
  return sanitizeState({
    answers: deepMerge(base.answers, saved.answers),
    nav: deepMerge(base.nav, saved.nav),
    meta: deepMerge(base.meta, saved.meta),
  }, defaultState());
}

function emit() {
  listeners.forEach((fn) => fn(state));
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const result = saveState(state);
    lastSavePersisted = result.persisted;
    if (!result.persisted) emit(); // re-render so a storage-unavailable banner can show if the UI wants one
  }, 200);
}

function update(mutator) {
  mutator(state);
  persist();
  emit();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function storageIsAvailable() {
  return isStorageAvailable();
}

// True when progress will NOT survive a refresh: storage is blocked up front, or a
// save has since failed (e.g. quota). Drives the unobtrusive warning in app.js.
export function progressWillNotPersist() {
  return !isStorageAvailable() || !lastSavePersisted;
}

export function resetProgress() {
  clearPersisted();
  state = defaultState();
  emit();
}

// ---- navigation bookkeeping ----
export function setLastVisited(moduleId, stage) {
  update((s) => { s.nav.lastModule = moduleId; s.nav.lastStage = stage; });
}
export function setPromptPlatform(platform) {
  update((s) => { s.nav.promptPlatform = platform; });
}
export function setStudioCategory(category) {
  update((s) => { s.nav.studioCategory = category; });
}

// ---- M1 — Offer intake + Brand Anchor ----
export function setIntakeField(field, value) {
  update((s) => {
    s.answers.m1.intake[field] = value;
    // Pre-fill (never overwrite once the customer has touched it) the Anchor's
    // reflected fields — see the framework's own rule: Audience Truth and
    // Brand Promise are "pulled from," not independently authored.
    if (field === 'targetCustomer' || field === 'mainProblem') {
      if (!s.meta.audienceTruthTouched) {
        const t = s.answers.m1.intake.targetCustomer.trim();
        const p = s.answers.m1.intake.mainProblem.trim();
        s.answers.m1.anchor.audienceTruth = [t, p].filter(Boolean).join(' — ');
      }
    }
    if (field === 'promise' || field === 'uvp') {
      if (!s.meta.brandPromiseTouched) {
        const pr = s.answers.m1.intake.promise.trim();
        const u = s.answers.m1.intake.uvp.trim();
        s.answers.m1.anchor.brandPromise = [pr, u].filter(Boolean).join(' — ');
      }
    }
  });
}
export function setAnchorField(field, value) {
  update((s) => {
    s.answers.m1.anchor[field] = value;
    if (field === 'audienceTruth') s.meta.audienceTruthTouched = true;
    if (field === 'brandPromise') s.meta.brandPromiseTouched = true;
  });
}
export function setBrandName(value) {
  update((s) => { s.answers.m1.brandName = value; });
}
export function setNameNote(value) {
  update((s) => { s.answers.m1.nameNote = value; });
}

// ---- M2 — Signal Map + Voice Rules ----
export function setSignal(field, value) {
  update((s) => { s.answers.m2.signals[field] = value; });
}
export function setVoiceRule(field, value) {
  update((s) => { s.answers.m2.voiceRules[field] = value; });
}

// ---- M3 — Message Ladder ----
export function setLadderRung(field, value) {
  update((s) => { s.answers.m3.ladder[field] = value; });
}

// ---- M4 — Visual Identity ----
export function setMood(value) {
  update((s) => { s.answers.m4.mood = value; });
}
export function setColourDirection(index, field, value) {
  update((s) => { s.answers.m4.colourDirections[index][field] = value; });
}
export function setTypePairing(index, field, value) {
  update((s) => { s.answers.m4.typePairings[index][field] = value; });
}
export function setLogoType(value) {
  update((s) => { s.answers.m4.logoType = value; });
}
export function setLogoRequirements(value) {
  update((s) => { s.answers.m4.logoRequirements = value; });
}

// ---- M5 — Consistency Grid ----
export function toggleGridCell(touchpoint, element) {
  update((s) => { s.answers.m5.consistencyGrid[touchpoint][element] = !s.answers.m5.consistencyGrid[touchpoint][element]; });
}
export function setSignatureElements(value) {
  update((s) => { s.answers.m5.signatureElements = value; });
}

// ---- M6 — Guardrails ----
export function addGuardrail() {
  update((s) => { if (s.answers.m6.guardrails.length < 8) s.answers.m6.guardrails.push(''); });
}
export function setGuardrail(index, value) {
  update((s) => { s.answers.m6.guardrails[index] = value; });
}
export function removeGuardrail(index) {
  update((s) => {
    s.answers.m6.guardrails.splice(index, 1);
    if (s.answers.m6.guardrails.length === 0) s.answers.m6.guardrails.push('');
  });
}
export function setStressTestNotes(value) {
  update((s) => { s.answers.m6.stressTestNotes = value; });
}

// ---- computed ----
export function deliverableStatus(id, s = state) {
  const a = s.answers;
  switch (id) {
    case 'brand-foundation': {
      const an = a.m1.anchor;
      return !!(an.belief.trim() && an.audienceTruth.trim() && an.brandPromise.trim() && an.signature.trim() && a.m1.brandName.trim());
    }
    case 'personality-voice-profile': {
      const vr = a.m2.voiceRules;
      return !!(vr.use.trim() && vr.avoid.trim());
    }
    case 'messaging-architecture': {
      const l = a.m3.ladder;
      return !!(l.belief.trim() && l.promise.trim() && l.proof.trim() && l.audienceLanguage.trim() && l.oneLiner.trim());
    }
    case 'visual-identity-brief': {
      const m4a = a.m4;
      const hasColour = m4a.colourDirections.some((c) => c.direction.trim());
      const hasType = m4a.typePairings.some((t) => t.direction.trim());
      return !!(m4a.mood.trim() && hasColour && hasType && m4a.logoType);
    }
    case 'assets-application-guide': {
      const grid = a.m5.consistencyGrid;
      const anyChecked = Object.values(grid).some((row) => Object.values(row).some(Boolean));
      return !!(anyChecked && a.m5.signatureElements.trim());
    }
    case 'brand-guardrails':
      return a.m6.guardrails.filter((g) => g.trim()).length >= 2;
    case 'quick-reference-card':
      return !!(a.m1.brandName.trim() && a.m3.ladder.oneLiner.trim() && a.m2.voiceRules.use.trim() && a.m1.anchor.signature.trim());
    case 'master-context-prompt':
      return ['brand-foundation', 'personality-voice-profile', 'messaging-architecture', 'visual-identity-brief']
        .every((depId) => deliverableStatus(depId, s));
    default:
      return false;
  }
}

export function allDeliverables(s = state) {
  return DELIVERABLES.map((d) => ({ ...d, done: deliverableStatus(d.id, s) }));
}

export function progressPercent(s = state) {
  const done = allDeliverables(s).filter((d) => d.done).length;
  return Math.round((done / DELIVERABLES.length) * 100);
}

export function moduleStatus(moduleId, s = state) {
  const ids = DELIVERABLES.filter((d) => d.module === moduleId).map((d) => d.id);
  const statuses = ids.map((id) => deliverableStatus(id, s));
  if (statuses.every(Boolean)) return 'done';
  if (statuses.some(Boolean)) return 'in-progress';
  return 'not-started';
}

export { MODULE_IDS, DELIVERABLES, GRID_TOUCHPOINTS, GRID_ELEMENTS };
