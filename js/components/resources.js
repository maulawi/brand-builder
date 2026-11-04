// resources.js — static reference page: a glossary of DigitalOps' own terms, plus
// the reset-progress control. Adapted from Offer Engineering (see the Phase 0
// audit) — pattern ports as-is; glossary content is Brand Builder's own.

import { resetProgress } from '../state.js';

const GLOSSARY = [
  ['The Brand Anchor', 'Your foundational identity — Belief, Audience Truth, Promise and Signature — that every later decision gets checked against.'],
  ['The Signal Map', 'Four opposing trait-pair sliders (Formal↔Casual, Bold↔Gentle, Playful↔Serious, Expert↔Relatable) that derive your brand personality from your audience, not your own taste.'],
  ['The Message Ladder', 'A five-rung dependency chain — Belief, Promise, Differentiated Proof, Audience Language, One-Liner — each rung built only from the one below it.'],
  ['The Consistency Grid', 'A checklist matrix of where your identity actually shows up (social profiles, templates, product covers…) against what should be consistent there (voice, colour, typography, logo use).'],
  ['Core Prompt vs. Prompt Library', 'Six Core Prompts are wired directly to your saved answers; the 32-prompt Library (the AI Brand Studio) covers everything else, organised by category.'],
  ['Master Brand Context Prompt', 'A portable summary of your whole brand identity, assembled directly from what you’ve entered, that you can paste into any AI tool to keep future work consistent.'],
  ['Brand Blueprint', 'The compiled, exportable document of all eight deliverables — the actual product you walk away with.'],
];

export function renderResources() {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="breadcrumb">Reference</div>
    <h1 id="main-heading" class="h2" style="margin-bottom:24px">Resources &amp; Glossary</h1>
  `;
  const card = document.createElement('div');
  card.className = 'card';
  GLOSSARY.forEach(([term, def], i) => {
    const row = document.createElement('div');
    row.style.marginBottom = i < GLOSSARY.length - 1 ? '16px' : '0';
    row.style.paddingBottom = i < GLOSSARY.length - 1 ? '16px' : '0';
    row.style.borderBottom = i < GLOSSARY.length - 1 ? '1px solid var(--border)' : 'none';
    row.innerHTML = `<div class="label" style="color:var(--ink);margin-bottom:4px">${term}</div><div class="body-sm" style="color:var(--ink-muted)">${def}</div>`;
    card.appendChild(row);
  });
  wrap.appendChild(card);

  const resetZone = document.createElement('div');
  resetZone.className = 'reset-zone';
  resetZone.innerHTML = `
    <h2 class="h3" style="margin-bottom:8px">Reset your progress</h2>
    <p class="body-sm" style="color:var(--ink-muted);margin-bottom:12px">This clears every answer you've entered in this browser. It can't be undone, and progress isn't saved anywhere else — there's no account and no cloud sync.</p>
    <button class="btn btn-secondary" id="reset-btn">Reset all progress</button>
    <div id="confirm-area"></div>
  `;
  resetZone.querySelector('#reset-btn').addEventListener('click', () => {
    const area = resetZone.querySelector('#confirm-area');
    if (area.querySelector('.confirm-box')) return;
    const box = document.createElement('div');
    box.className = 'confirm-box';
    box.innerHTML = `
      <p class="body-sm" style="color:var(--ink);margin-bottom:12px"><strong>Are you sure?</strong> All lesson progress, exercise answers, and your Brand Blueprint will be permanently deleted from this browser.</p>
      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary" id="cancel-reset">Cancel</button>
        <button class="btn btn-primary" id="confirm-reset" style="background:var(--warning)">Yes, reset everything</button>
      </div>
    `;
    area.appendChild(box);
    box.querySelector('#cancel-reset').addEventListener('click', () => box.remove());
    box.querySelector('#confirm-reset').addEventListener('click', () => {
      resetProgress();
      window.location.hash = '#/';
    });
  });
  wrap.appendChild(resetZone);

  return wrap;
}
