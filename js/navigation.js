// navigation.js — module order, content loading/caching, and prev/next sequencing.
// Ported from Offer Engineering as-is (see the Phase 0 audit) — fully generic over
// MODULE_IDS already; only MODULE_TITLES' content is new.

import { MODULE_IDS } from './state.js';

export const MODULE_TITLES = {
  m1: 'Carry Your Strategy Into a Brand',
  m2: 'Brand Personality & Voice',
  m3: 'Brand Messaging Architecture',
  m4: 'Visual Identity Direction',
  m5: 'Brand Assets & Application System',
  m6: 'Brand Guidelines & Final Blueprint',
};

export const STAGES = ['lesson', 'exercise', 'prompt', 'deliverable'];

const cache = new Map();

export async function loadModuleContent(moduleId) {
  if (cache.has(moduleId)) return cache.get(moduleId);
  const res = await fetch(`content/${moduleId}.json`);
  if (!res.ok) throw new Error(`Could not load content for ${moduleId}`);
  const json = await res.json();
  cache.set(moduleId, json);
  return json;
}

export async function loadAllModules() {
  const all = await Promise.all(MODULE_IDS.map(loadModuleContent));
  return Object.fromEntries(MODULE_IDS.map((id, i) => [id, all[i]]));
}

export function nextModule(moduleId) {
  const i = MODULE_IDS.indexOf(moduleId);
  return i >= 0 && i < MODULE_IDS.length - 1 ? MODULE_IDS[i + 1] : null;
}
export function prevModule(moduleId) {
  const i = MODULE_IDS.indexOf(moduleId);
  return i > 0 ? MODULE_IDS[i - 1] : null;
}

/** Returns { moduleId, stage } for the next step, crossing module boundaries,
 *  or null if this is the very last step (the final module's deliverable). */
export function nextStep(moduleId, stage) {
  const si = STAGES.indexOf(stage);
  if (si < STAGES.length - 1) return { moduleId, stage: STAGES[si + 1] };
  const next = nextModule(moduleId);
  return next ? { moduleId: next, stage: 'lesson' } : null; // null => route to Blueprint
}

export function prevStep(moduleId, stage) {
  const si = STAGES.indexOf(stage);
  if (si > 0) return { moduleId, stage: STAGES[si - 1] };
  const prev = prevModule(moduleId);
  if (!prev) return null;
  return { moduleId: prev, stage: 'deliverable' };
}
