// exercise-fields.js — one renderer per exercise type, registered in `builders`
// below. Pattern adapted from Offer Engineering's exercise-fields.js (see the
// Phase 0 audit): text/slider inputs update state directly without a full
// rebuild so focus is never lost; row add/remove and selections call
// ctx.rerenderMain() since those genuinely restructure the screen.
//
// Field hint copy below is placeholder-quality, written to prove the interaction
// patterns work — Phase 4 (Curriculum & Module Implementation) replaces it with
// real lesson-grade copy, the same sequencing Offer Engineering's own build used
// (app structure before content population).

import * as state from '../state.js';

export function renderExerciseFields(ctx) {
  const { mod } = ctx;
  const type = mod.exercise.type;
  const el = document.createElement('div');
  el.className = 'card';
  const instructions = document.createElement('p');
  instructions.className = 'body-sm';
  instructions.style.color = 'var(--ink-muted)';
  instructions.style.marginBottom = '20px';
  instructions.textContent = mod.exercise.instructions;
  el.appendChild(instructions);

  const builders = {
    'brand-foundation': buildBrandFoundation,
    'signal-map': buildSignalMap,
    'message-ladder': buildMessageLadder,
    'visual-identity': buildVisualIdentity,
    'consistency-grid': buildConsistencyGrid,
    guardrails: buildGuardrails,
  };
  const builder = builders[type];
  if (builder) el.appendChild(builder(ctx));
  return el;
}

// ---------------------------------------------------------------- M1
function buildBrandFoundation(ctx) {
  const { state: s } = ctx;
  const wrap = document.createElement('div');
  const intake = s.answers.m1.intake;
  const anchor = s.answers.m1.anchor;

  const intakeLabel = document.createElement('div');
  intakeLabel.className = 'label';
  intakeLabel.textContent = 'Carry your offer forward';
  wrap.appendChild(intakeLabel);
  const intakeHint = document.createElement('div');
  intakeHint.className = 'field-hint';
  intakeHint.style.marginBottom = '12px';
  intakeHint.textContent = 'Copy these straight from your Offer Engineering Blueprint — no need to rewrite them.';
  wrap.appendChild(intakeHint);

  const INTAKE_FIELDS = [
    ['targetCustomer', 'Target customer', 'small business owners who struggle to plan consistent social media content'],
    ['mainProblem', 'Main problem', 'running out of ideas and starting from a blank page every week'],
    ['desiredOutcome', 'Desired outcome', 'planning a week of posts without the blank-page struggle'],
    ['promise', 'Promise', "you'll receive a structured 7-day planning workflow and templates"],
    ['uvp', 'Unique Value Proposition', 'a complete planning system, not just templates'],
    ['differentiation', 'Main differentiation', 'includes the full planning process, not just design files'],
    ['positioning', 'Positioning statement', 'For small business owners who struggle to plan consistent content, this is the planning system that organises a week of posts without the blank-page problem.'],
  ];
  INTAKE_FIELDS.forEach(([field, label, placeholder]) => {
    const f = document.createElement('div');
    f.className = 'field';
    f.innerHTML = `<label>${label}</label><textarea placeholder="e.g. ${escAttr(placeholder)}" data-intake="${field}">${escHtml(intake[field])}</textarea>`;
    f.querySelector('textarea').addEventListener('input', (e) => state.setIntakeField(field, e.target.value));
    wrap.appendChild(f);
  });

  const anchorLabel = document.createElement('div');
  anchorLabel.className = 'label';
  anchorLabel.style.margin = '24px 0 4px';
  anchorLabel.textContent = 'Your Brand Anchor';
  wrap.appendChild(anchorLabel);
  const anchorHint = document.createElement('div');
  anchorHint.className = 'field-hint';
  anchorHint.style.marginBottom = '12px';
  anchorHint.textContent = 'Audience Truth and Brand Promise start pre-filled from what you entered above — edit them if the wording needs sharpening.';
  wrap.appendChild(anchorHint);

  const grid = document.createElement('div');
  grid.className = 'anchor-grid';
  const ANCHOR_FIELDS = [
    ['belief', 'Belief', 'The one conviction behind why this exists.'],
    ['audienceTruth', 'Audience Truth', 'Who they are and what they’re actually dealing with.'],
    ['brandPromise', 'Promise', 'What the brand commits to.'],
    ['signature', 'Signature', 'One distinct, ownable trait that makes this brand recognisable.'],
  ];
  ANCHOR_FIELDS.forEach(([field, label, hint]) => {
    const cell = document.createElement('div');
    cell.className = 'anchor-cell';
    cell.innerHTML = `<div class="label">${label}</div><div class="field-hint" style="margin-bottom:8px">${hint}</div><textarea data-anchor="${field}">${escHtml(anchor[field])}</textarea>`;
    cell.querySelector('textarea').addEventListener('input', (e) => state.setAnchorField(field, e.target.value));
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);

  const nameLabel = document.createElement('div');
  nameLabel.className = 'label';
  nameLabel.style.margin = '24px 0 4px';
  nameLabel.textContent = 'Brand name';
  wrap.appendChild(nameLabel);
  const nameField = document.createElement('div');
  nameField.className = 'field';
  nameField.innerHTML = `<input type="text" placeholder="Your existing brand or business name" value="${escAttr(s.answers.m1.brandName)}" data-f="brandName">
    <div class="field-hint" style="margin-top:8px">Does it still fit what you've just written down? A short note, not a full rename.</div>
    <textarea placeholder="e.g. Still fits — the name already signals the audience." data-f="nameNote">${escHtml(s.answers.m1.nameNote)}</textarea>`;
  nameField.querySelector('[data-f="brandName"]').addEventListener('input', (e) => state.setBrandName(e.target.value));
  nameField.querySelector('[data-f="nameNote"]').addEventListener('input', (e) => state.setNameNote(e.target.value));
  wrap.appendChild(nameField);

  return wrap;
}

// ---------------------------------------------------------------- M2
const SIGNAL_DEFS = [
  ['formalCasual', 'Formal', 'Casual'],
  ['boldGentle', 'Bold', 'Gentle'],
  ['playfulSerious', 'Playful', 'Serious'],
  ['expertRelatable', 'Expert', 'Relatable'],
];
function buildSignalMap(ctx) {
  const { state: s } = ctx;
  const wrap = document.createElement('div');
  const signals = s.answers.m2.signals;

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'Your Signal Map';
  wrap.appendChild(label);
  const hint = document.createElement('div');
  hint.className = 'field-hint';
  hint.style.marginBottom = '12px';
  hint.textContent = 'Set each slider against your Audience Truth from Module 1 — not personal taste.';
  wrap.appendChild(hint);

  SIGNAL_DEFS.forEach(([field, left, right]) => {
    const row = document.createElement('div');
    row.className = 'slider-row';
    row.innerHTML = `
      <div class="s-meta"><div class="s-label">${left} ↔ ${right}</div></div>
      <input type="range" min="0" max="10" value="${signals[field]}" data-signal="${field}" aria-label="${left} to ${right}, 0 to 10">
      <span class="s-val" data-readout="${field}">${signals[field]}</span>
    `;
    row.querySelector('input').addEventListener('input', (e) => {
      const val = Number(e.target.value);
      state.setSignal(field, val);
      row.querySelector('[data-readout]').textContent = String(val);
    });
    wrap.appendChild(row);
  });

  const vrLabel = document.createElement('div');
  vrLabel.className = 'label';
  vrLabel.style.margin = '24px 0 4px';
  vrLabel.textContent = 'Your Voice Rules Card';
  wrap.appendChild(vrLabel);

  const vr = s.answers.m2.voiceRules;
  const VR_FIELDS = [
    ['use', 'Vocabulary to use', 'words and phrases that fit this signal profile'],
    ['avoid', 'Vocabulary to avoid', "words that don't fit — jargon, hedging, etc."],
    ['sentenceStyle', 'Sentence length & rhythm', 'short and direct / longer and conversational'],
    ['humourLevel', 'Humour level', 'none / light / frequent'],
    ['address', 'How you address the reader', 'second person ("you") / first person plural ("we")'],
  ];
  VR_FIELDS.forEach(([field, lbl, placeholder]) => {
    const f = document.createElement('div');
    f.className = 'field';
    f.innerHTML = `<label>${lbl}</label><textarea placeholder="e.g. ${escAttr(placeholder)}" data-vr="${field}">${escHtml(vr[field])}</textarea>`;
    f.querySelector('textarea').addEventListener('input', (e) => state.setVoiceRule(field, e.target.value));
    wrap.appendChild(f);
  });

  return wrap;
}

// ---------------------------------------------------------------- M3
const LADDER_RUNGS = [
  ['belief', 'Belief', 'from your Brand Anchor'],
  ['promise', 'Promise', "from your offer's Promise and UVP"],
  ['proof', 'Differentiated Proof', 'from your differentiation'],
  ['audienceLanguage', 'Audience Language', 'the exact words your customer uses'],
  ['oneLiner', 'One-Liner', 'compressed from everything below it'],
];
function buildMessageLadder(ctx) {
  const { state: s } = ctx;
  const wrap = document.createElement('div');
  const ladder = s.answers.m3.ladder;

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'Your Message Ladder';
  wrap.appendChild(label);
  const hint = document.createElement('div');
  hint.className = 'field-hint';
  hint.style.marginBottom = '12px';
  hint.textContent = 'Build bottom-up — each rung only from the one above it.';
  wrap.appendChild(hint);

  const rungsWrap = document.createElement('div');
  rungsWrap.className = 'ladder';
  LADDER_RUNGS.forEach(([field, lbl, hintText]) => {
    const rung = document.createElement('div');
    rung.className = 'ladder-rung';
    rung.innerHTML = `<div class="ladder-rung-label label">${lbl}</div><div class="field-hint" style="margin-bottom:6px">${hintText}</div><textarea data-rung="${field}">${escHtml(ladder[field])}</textarea>`;
    rung.querySelector('textarea').addEventListener('input', (e) => state.setLadderRung(field, e.target.value));
    rungsWrap.appendChild(rung);
  });
  wrap.appendChild(rungsWrap);

  return wrap;
}

// ---------------------------------------------------------------- M4
const LOGO_TYPES = [
  { id: 'wordmark', label: 'Wordmark', purpose: 'The brand name itself, styled — no separate symbol.' },
  { id: 'lettermark', label: 'Lettermark', purpose: 'Initials, styled — for a longer name that needs a compact mark.' },
  { id: 'symbol', label: 'Symbol', purpose: 'An icon that can stand alone once the brand is recognised.' },
  { id: 'combination', label: 'Combination', purpose: 'A symbol plus the wordmark, usable together or apart.' },
];
function buildVisualIdentity(ctx) {
  const { state: s } = ctx;
  const wrap = document.createElement('div');
  const m4 = s.answers.m4;

  const moodField = document.createElement('div');
  moodField.className = 'field';
  moodField.innerHTML = `<label>Mood descriptors</label><div class="field-hint">A handful of words describing the visual feeling that fits your Signal Map.</div><textarea placeholder="e.g. warm, direct, uncluttered" data-f="mood">${escHtml(m4.mood)}</textarea>`;
  moodField.querySelector('textarea').addEventListener('input', (e) => state.setMood(e.target.value));
  wrap.appendChild(moodField);

  const colourLabel = document.createElement('div');
  colourLabel.className = 'label';
  colourLabel.style.margin = '20px 0 4px';
  colourLabel.textContent = 'Colour directions';
  wrap.appendChild(colourLabel);
  m4.colourDirections.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'pair-row';
    row.innerHTML = `
      <input type="text" placeholder="Direction ${i + 1} — e.g. warm neutrals with one bold accent" value="${escAttr(c.direction)}" data-f="direction">
      <input type="text" placeholder="Why it fits" value="${escAttr(c.rationale)}" data-f="rationale">
    `;
    ['direction', 'rationale'].forEach((f) => row.querySelector(`[data-f="${f}"]`).addEventListener('input', (e) => state.setColourDirection(i, f, e.target.value)));
    wrap.appendChild(row);
  });

  const typeLabel = document.createElement('div');
  typeLabel.className = 'label';
  typeLabel.style.margin = '20px 0 4px';
  typeLabel.textContent = 'Typography pairings';
  wrap.appendChild(typeLabel);
  m4.typePairings.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'pair-row';
    row.innerHTML = `
      <input type="text" placeholder="Pairing ${i + 1} — e.g. a confident display face + a quiet body face" value="${escAttr(t.direction)}" data-f="direction">
      <input type="text" placeholder="Why it fits" value="${escAttr(t.rationale)}" data-f="rationale">
    `;
    ['direction', 'rationale'].forEach((f) => row.querySelector(`[data-f="${f}"]`).addEventListener('input', (e) => state.setTypePairing(i, f, e.target.value)));
    wrap.appendChild(row);
  });

  const logoLabel = document.createElement('div');
  logoLabel.className = 'label';
  logoLabel.style.margin = '24px 0 4px';
  logoLabel.textContent = 'Logo direction';
  wrap.appendChild(logoLabel);
  const grid = document.createElement('div');
  grid.className = 'promise-type-grid';
  LOGO_TYPES.forEach((lt) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `promise-type-card ${m4.logoType === lt.id ? 'is-selected' : ''}`;
    card.innerHTML = `<div class="pt-label">${lt.label}</div><div class="pt-purpose">${lt.purpose}</div>`;
    card.addEventListener('click', () => { state.setLogoType(lt.id); ctx.rerenderMain(); });
    grid.appendChild(card);
  });
  wrap.appendChild(grid);

  const reqField = document.createElement('div');
  reqField.className = 'field';
  reqField.style.marginTop = '16px';
  reqField.innerHTML = `<label>Design requirements</label><div class="field-hint">Minimum legible size, where it must work in reverse colour, what it must never be paired with.</div><textarea data-f="logoRequirements">${escHtml(m4.logoRequirements)}</textarea>`;
  reqField.querySelector('textarea').addEventListener('input', (e) => state.setLogoRequirements(e.target.value));
  wrap.appendChild(reqField);

  return wrap;
}

// ---------------------------------------------------------------- M5
const TOUCHPOINT_LABELS = {
  socialProfiles: 'Social profiles', contentTemplates: 'Content templates', productCover: 'Product cover art',
  email: 'Email', salesPage: 'Sales page', signOff: 'Signature / sign-off',
};
const ELEMENT_LABELS = { voice: 'Voice', colour: 'Colour', typography: 'Typography', logoUse: 'Logo use' };
function buildConsistencyGrid(ctx) {
  const { state: s } = ctx;
  const wrap = document.createElement('div');
  const grid = s.answers.m5.consistencyGrid;

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'Your Consistency Grid';
  wrap.appendChild(label);
  const hint = document.createElement('div');
  hint.className = 'field-hint';
  hint.style.marginBottom = '12px';
  hint.textContent = 'Check off where each identity element is actually applied today.';
  wrap.appendChild(hint);

  const table = document.createElement('table');
  table.className = 'lesson-table consistency-grid-table';
  const elements = state.GRID_ELEMENTS;
  const touchpoints = state.GRID_TOUCHPOINTS;
  table.innerHTML = `<thead><tr><th></th>${elements.map((e) => `<th>${ELEMENT_LABELS[e]}</th>`).join('')}</tr></thead>`;
  const tbody = document.createElement('tbody');
  touchpoints.forEach((t) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${TOUCHPOINT_LABELS[t]}</td>${elements.map((e) => `<td><input type="checkbox" data-t="${t}" data-e="${e}" ${grid[t][e] ? 'checked' : ''}></td>`).join('')}`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  table.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => state.toggleGridCell(cb.dataset.t, cb.dataset.e));
  });
  const tableScroll = document.createElement('div');
  tableScroll.className = 'table-scroll';
  tableScroll.appendChild(table);
  wrap.appendChild(tableScroll);

  const sigField = document.createElement('div');
  sigField.className = 'field';
  sigField.style.marginTop = '20px';
  sigField.innerHTML = `<label>Signature elements</label><div class="field-hint">One or two small, repeatable devices that make content recognisable even without a visible logo.</div><textarea data-f="signatureElements">${escHtml(s.answers.m5.signatureElements)}</textarea>`;
  sigField.querySelector('textarea').addEventListener('input', (e) => state.setSignatureElements(e.target.value));
  wrap.appendChild(sigField);

  return wrap;
}

// ---------------------------------------------------------------- M6
function buildGuardrails(ctx) {
  const { state: s, rerenderMain } = ctx;
  const wrap = document.createElement('div');
  const guardrails = s.answers.m6.guardrails;

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'Your Brand Guardrails';
  wrap.appendChild(label);
  const hint = document.createElement('div');
  hint.className = 'field-hint';
  hint.style.marginBottom = '12px';
  hint.textContent = "A short, specific “never do this” list, drawn from everything you've built so far.";
  wrap.appendChild(hint);

  guardrails.forEach((g, i) => {
    const row = document.createElement('div');
    row.className = 'problem-item';
    row.innerHTML = `<input type="text" placeholder="e.g. Never pair the wordmark with a stock photo" value="${escAttr(g)}"><button type="button" class="remove-link" aria-label="Remove">✕</button>`;
    row.querySelector('input').addEventListener('input', (e) => state.setGuardrail(i, e.target.value));
    row.querySelector('button').addEventListener('click', () => { state.removeGuardrail(i); rerenderMain(); });
    wrap.appendChild(row);
  });
  if (guardrails.length < 8) {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-row-btn';
    addBtn.textContent = '+ Add a guardrail';
    addBtn.addEventListener('click', () => { state.addGuardrail(); rerenderMain(); });
    wrap.appendChild(addBtn);
  }

  const notesField = document.createElement('div');
  notesField.className = 'field';
  notesField.style.marginTop = '20px';
  notesField.innerHTML = `<label>Stress-test notes</label><div class="field-hint">Run one real piece of planned content through your whole system — what held up, what didn't.</div><textarea data-f="stressTestNotes">${escHtml(s.answers.m6.stressTestNotes)}</textarea>`;
  notesField.querySelector('textarea').addEventListener('input', (e) => state.setStressTestNotes(e.target.value));
  wrap.appendChild(notesField);

  return wrap;
}

// ---------------------------------------------------------------- helpers
function escHtml(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }
function escAttr(str) { return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
