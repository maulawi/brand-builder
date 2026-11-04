// progress-indicator.js — the persistent top bar shown in the topbar on every app screen.
// Adapted from Offer Engineering (see the Phase 0 audit): that file hardcoded the
// literal string "of 08" rather than deriving it from the module count, so the same
// manual edit would be needed again if the count ever changed. Fixed here — the
// count comes from MODULE_IDS.length.

import * as state from '../state.js';
import { MODULE_TITLES } from '../navigation.js';
import { MODULE_IDS } from '../state.js';

const TOTAL = String(MODULE_IDS.length).padStart(2, '0');

export function renderProgressIndicator({ content, state: s, activeModule, variant }) {
  const el = document.createElement('div');
  el.className = 'top-progress';
  el.id = 'top-progress';
  const pct = state.progressPercent(s);
  const mod = activeModule ? content[activeModule] : null;
  const label = mod ? `Module ${mod.code} of ${TOTAL} · ${MODULE_TITLES[activeModule]}` : 'Brand Builder';
  el.innerHTML = `
    <div class="top-progress-row">
      <span class="body-sm label">${label}</span>
      <span class="label pct">${pct}% complete</span>
    </div>
    <div class="top-progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Brand Blueprint completion">
      <span class="top-progress-fill" style="width:${pct}%"></span>
    </div>
  `;
  return el;
}
