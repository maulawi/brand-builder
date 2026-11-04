// blueprint.js — Phase 7, the final Brand Blueprint and its PDF export. Adapted
// from Offer Engineering's blueprint-screen.js + deliverable-tracker.js (see the
// Phase 0 audit) — the layout, tracker list and window.print() export mechanism
// port directly (css/print.css is the identical copy ported in Phase 1).
//
// One deliberate, non-cosmetic departure from the source: Phase 0's Finding 1 was
// that summarizeDeliverable() in Offer Engineering interpolates raw customer answers
// into innerHTML with no escaping. That is not repeated here. Every dynamic value
// below is run through escHtml() before it reaches innerHTML, however many layers
// of joining/formatting it passes through first — fields() centralises that so no
// call site can forget it.

import * as state from '../state.js';
import { moduleHash } from '../router.js';

const TOUCHPOINT_LABELS = {
  socialProfiles: 'Social profiles', contentTemplates: 'Content templates',
  productCover: 'Product cover', email: 'Email', salesPage: 'Sales page', signOff: 'Sign-off',
};
const ELEMENT_LABELS = { voice: 'Voice', colour: 'Colour', typography: 'Typography', logoUse: 'Logo use' };

export function renderBlueprint({ content, state: s, onNavigate }) {
  const wrap = document.createElement('div');
  const deliverables = state.allDeliverables(s);
  const doneCount = deliverables.filter((d) => d.done).length;
  const brandName = s.answers.m1.brandName.trim();

  wrap.innerHTML = `
    <div class="breadcrumb">Final Output</div>
    <h1 id="main-heading" class="h2" style="margin-bottom:4px">Your Brand Blueprint</h1>
    <p class="body-sm" style="color:var(--ink-muted);margin-bottom:24px">A complete, professional document ready to use. ${doneCount} of ${deliverables.length} complete.</p>
  `;

  const layout = document.createElement('div');
  layout.className = 'blueprint-layout';

  const left = document.createElement('div');
  const trackerCard = document.createElement('div');
  trackerCard.className = 'card';
  deliverables.forEach((d, i) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `tracker-row ${d.done ? 'is-done' : ''}`;
    row.innerHTML = `<span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${escHtml(d.label)}</span><span class="tracker-check"></span>`;
    row.title = 'Edit this deliverable';
    row.addEventListener('click', () => onNavigate(moduleHash(d.module, 'exercise')));
    trackerCard.appendChild(row);
  });
  left.appendChild(trackerCard);

  const actions = document.createElement('div');
  actions.className = 'blueprint-actions';
  actions.innerHTML = `
    <button class="btn btn-secondary" id="edit-btn">Edit Blueprint</button>
    <button class="btn btn-primary" id="export-btn">⬇ Export as PDF</button>
  `;
  left.appendChild(actions);
  layout.appendChild(left);

  const cover = document.createElement('div');
  cover.className = 'blueprint-cover-preview';
  cover.innerHTML = `
    <div class="bcp-wordmark">DIGITALOPS</div>
    <div class="bcp-title">BRAND<br>BLUEPRINT</div>
    <div class="bcp-tag">${brandName ? escHtml(brandName.toUpperCase()) : 'TURN YOUR OFFER INTO A RECOGNISABLE BRAND'}</div>
  `;
  layout.appendChild(cover);

  wrap.appendChild(layout);

  const doc = document.createElement('div');
  doc.style.marginTop = '48px';
  doc.appendChild(buildDocSections(s, onNavigate));
  wrap.appendChild(doc);

  wrap.querySelector('#edit-btn').addEventListener('click', () => onNavigate('#/m1/exercise'));
  wrap.querySelector('#export-btn').addEventListener('click', () => exportPdf(s, brandName));

  return wrap;
}

function buildDocSections(s, onNavigate) {
  const container = document.createElement('div');
  state.DELIVERABLES.forEach((d, i) => {
    const done = state.deliverableStatus(d.id, s);
    const section = document.createElement('section');
    section.className = 'blueprint-doc-section';
    const heading = `<h3 class="h3">${String(i + 1).padStart(2, '0')} · ${escHtml(d.label)}</h3>`;
    const bodyHtml = done ? sectionBodyHtml(d.id, s) : `<p class="body status-incomplete">Not completed yet.</p>`;
    section.innerHTML = `${heading}${bodyHtml}<a class="edit-link" href="${moduleHash(d.module, 'exercise')}">Edit →</a>`;
    section.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); onNavigate(moduleHash(d.module, 'exercise')); });
    container.appendChild(section);
  });
  return container;
}

// sectionBodyHtml() is the single place that turns saved answers into on-screen
// markup. It is also reused, field-for-field, by the PDF export below — the two
// must never drift into showing different information for the same deliverable.
function sectionBodyHtml(id, s) {
  if (id === 'master-context-prompt') {
    return `<div class="body-sm" style="white-space:pre-wrap;background:var(--bg-0);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;font-family:monospace;font-size:12px;line-height:18px">${escHtml(buildMasterContextPrompt(s))}</div>`;
  }
  const rows = sectionFields(id, s).filter(([, v]) => v);
  if (!rows.length) return `<p class="body status-incomplete">Not completed yet.</p>`;
  return rows.map(([label, value]) => screenField(label, value)).join('');
}

function screenField(label, value) {
  return `<div style="margin-bottom:10px"><div class="label" style="margin-bottom:2px">${escHtml(label)}</div><div class="body-sm">${escHtml(value)}</div></div>`;
}

// sectionFields() returns [label, plainTextValue] pairs — never HTML — so every
// renderer (on-screen, PDF) escapes at the point of use instead of trusting a
// value that already passed through a different renderer's assumptions.
function sectionFields(id, s) {
  const a = s.answers;
  switch (id) {
    case 'brand-foundation': {
      const an = a.m1.anchor;
      return [
        ['Belief', an.belief.trim()],
        ['Audience Truth', an.audienceTruth.trim()],
        ['Promise', an.brandPromise.trim()],
        ['Signature', an.signature.trim()],
        ['Brand name', a.m1.brandName.trim()],
      ];
    }
    case 'personality-voice-profile': {
      const sig = a.m2.signals;
      const vr = a.m2.voiceRules;
      return [
        ['Signal Map', `Formal↔Casual ${sig.formalCasual}/10, Bold↔Gentle ${sig.boldGentle}/10, Playful↔Serious ${sig.playfulSerious}/10, Expert↔Relatable ${sig.expertRelatable}/10`],
        ['Vocabulary to use', vr.use.trim()],
        ['Vocabulary to avoid', vr.avoid.trim()],
        ['Sentence style', vr.sentenceStyle.trim()],
        ['Humour level', vr.humourLevel.trim()],
        ['Address', vr.address.trim()],
      ];
    }
    case 'messaging-architecture': {
      const l = a.m3.ladder;
      return [
        ['Belief', l.belief.trim()],
        ['Promise', l.promise.trim()],
        ['Differentiated Proof', l.proof.trim()],
        ['Audience Language', l.audienceLanguage.trim()],
        ['One-Liner', l.oneLiner.trim()],
      ];
    }
    case 'visual-identity-brief': {
      const m4a = a.m4;
      return [
        ['Mood', m4a.mood.trim()],
        ['Colour direction', colourSummary(m4a)],
        ['Typography pairing', typeSummary(m4a)],
        ['Logo type', m4a.logoType || ''],
        ['Logo requirements', m4a.logoRequirements.trim()],
      ];
    }
    case 'assets-application-guide':
      return [
        ['Consistency Grid', gridSummary(a.m5.consistencyGrid)],
        ['Signature elements', a.m5.signatureElements.trim()],
      ];
    case 'brand-guardrails':
      return [
        ['Guardrails', a.m6.guardrails.filter((g) => g.trim()).join('; ')],
        ['Stress-test notes', a.m6.stressTestNotes.trim()],
      ];
    case 'quick-reference-card':
      return [
        ['Brand name', a.m1.brandName.trim()],
        ['One-Liner', a.m3.ladder.oneLiner.trim()],
        ['Voice — use', a.m2.voiceRules.use.trim()],
        ['Signature', a.m1.anchor.signature.trim()],
      ];
    default:
      return [];
  }
}

function colourSummary(m4a) {
  return m4a.colourDirections
    .filter((c) => c.direction.trim())
    .map((c) => (c.rationale.trim() ? `${c.direction.trim()} (${c.rationale.trim()})` : c.direction.trim()))
    .join('; ');
}
function typeSummary(m4a) {
  return m4a.typePairings
    .filter((t) => t.direction.trim())
    .map((t) => (t.rationale.trim() ? `${t.direction.trim()} (${t.rationale.trim()})` : t.direction.trim()))
    .join('; ');
}
function gridSummary(grid) {
  const lines = [];
  state.GRID_TOUCHPOINTS.forEach((tp) => {
    const checked = state.GRID_ELEMENTS.filter((el) => grid[tp][el]);
    if (checked.length) lines.push(`${TOUCHPOINT_LABELS[tp]}: ${checked.map((el) => ELEMENT_LABELS[el]).join(', ')}`);
  });
  return lines.join(' · ');
}

// The Master Brand Context Prompt (§6, §7) — a deliberate exception to "every
// prompt is AI-run": assembled directly from saved state, the same deterministic,
// can't-hallucinate approach Offer Engineering's deliverable summaries use, so the
// portable context block is guaranteed accurate without an AI step. Returns plain
// text; callers escape it before use (it is still built from customer-entered
// strings, even though the surrounding structure is fixed).
export function buildMasterContextPrompt(s) {
  const a = s.answers;
  const an = a.m1.anchor;
  const vr = a.m2.voiceRules;
  const guardrails = a.m6.guardrails.filter((g) => g.trim());
  const dash = (v) => (v && v.trim()) || '—';

  const lines = [
    `Brand: ${dash(a.m1.brandName)}`,
    '',
    'BRAND FOUNDATION',
    `Belief: ${dash(an.belief)}`,
    `Audience Truth: ${dash(an.audienceTruth)}`,
    `Promise: ${dash(an.brandPromise)}`,
    `Signature: ${dash(an.signature)}`,
    '',
    'VOICE',
    `Use: ${dash(vr.use)}`,
    `Avoid: ${dash(vr.avoid)}`,
    `Sentence style: ${dash(vr.sentenceStyle)}`,
    `Humour level: ${dash(vr.humourLevel)}`,
    `Address: ${dash(vr.address)}`,
    '',
    'MESSAGING',
    `One-liner: ${dash(a.m3.ladder.oneLiner)}`,
    '',
    'VISUAL IDENTITY',
    `Colour direction: ${colourSummary(a.m4) || '—'}`,
    `Typography: ${typeSummary(a.m4) || '—'}`,
    `Logo type: ${a.m4.logoType || '—'}`,
    '',
    'GUARDRAILS',
    ...(guardrails.length ? guardrails.map((g) => `- ${g}`) : ['- None set yet']),
    '',
    'Instruction to any AI tool reading this: write and advise consistently with everything above. Never invent a brand fact that isn\'t stated here — ask for it instead of guessing.',
  ];
  return lines.join('\n');
}

function exportPdf(s, brandName) {
  let printRoot = document.getElementById('print-root');
  if (printRoot) printRoot.remove();
  printRoot = document.createElement('div');
  printRoot.id = 'print-root';

  const header = document.createElement('div');
  header.innerHTML = `
    <div class="print-wordmark">DigitalOps · BUILD / 002</div>
    <h1>${escHtml(brandName || 'Brand')} Blueprint</h1>
    <div class="print-tagline">Generated ${new Date().toLocaleDateString()} · Brand Builder</div>
  `;
  printRoot.appendChild(header);

  state.DELIVERABLES.forEach((d, i) => {
    const done = state.deliverableStatus(d.id, s);
    const section = document.createElement('section');
    // Balances the printed document across two pages: 01–05 on page one, 06–08 on
    // page two (the final three — guardrails, quick-reference, master prompt — are
    // the "take this with you" sections, kept together).
    if (d.id === 'brand-guardrails') section.classList.add('print-page-break');
    const body = done ? printSectionBody(d.id, s) : `<p class="print-missing">Not completed.</p>`;
    section.innerHTML = `<h2>${String(i + 1).padStart(2, '0')} · ${escHtml(d.label)}</h2>${body}`;
    printRoot.appendChild(section);
  });

  document.body.appendChild(printRoot);

  const originalTitle = document.title;
  document.title = `DigitalOps-${(brandName || 'Brand').replace(/[^a-z0-9]+/gi, '-')}-Blueprint`;
  window.print();
  document.title = originalTitle;

  setTimeout(() => printRoot.remove(), 500);
}

function printSectionBody(id, s) {
  if (id === 'master-context-prompt') {
    return `<div class="print-field" style="white-space:pre-wrap;font-family:monospace;font-size:11px;line-height:16px">${escHtml(buildMasterContextPrompt(s))}</div>`;
  }
  const rows = sectionFields(id, s);
  if (!rows.length) return `<p class="print-missing">Not completed.</p>`;
  return rows
    .map(([label, value]) => printField(label, value ? escHtml(printSafe(value)) : '<span class="print-not-provided">Not provided</span>'))
    .join('');
}

// The print fonts have no ↔ glyph, so it silently vanished from the PDF ("FormalCasual").
// Print-only substitution; the on-screen Blueprint keeps the arrow.
function printSafe(value) { return value.replace(/↔/g, ' vs '); }

function printField(label, valueHtml) {
  return `<div class="print-field"><span class="print-field-label">${escHtml(label)}:</span> ${valueHtml}</div>`;
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = String(str == null ? '' : str);
  return d.innerHTML;
}
