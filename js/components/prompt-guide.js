// prompt-guide.js — Phase 5, the AI Prompt Engine. A superset of Offer Engineering's
// ai-prompt-block.js (see the Phase 0 audit): the platform-tab selector and the
// copy-button/clipboard mechanism are reused verbatim (same classes, same fallback-copy
// path), wrapped in the six-part Prompt Guide structure the approved spec (§6) defines
// for every prompt in either tier: Objective, Required Inputs, Main Prompt, Expected
// Output, Refinement Prompts, Quality Checklist.
//
// Two tiers render through the same card:
//   - "core" prompts (one per module) are wired to live state via resolveContext()
//     below and {{key}} substitution in their template, exactly like Offer
//     Engineering's single prompt per module.
//   - "library" prompts (the other 26) use plain bracket placeholders in their own
//     template text ("[paste your ... here]") that the customer fills by hand —
//     per §8, this is deliberate: it keeps resolveContext() at six context sets
//     instead of growing to thirty-two, while every prompt still renders through
//     one component, so adding a 33rd library prompt later is a JSON edit, not a
//     new builder function.
//
// A module's own "prompt" stage shows that module's full slice of the 32-item
// library (3/5/5/8/7/4 — see the spec) with the Core Prompt first. brand-studio.js
// (Phase 6) imports buildPromptGuideCard and buildPlatformTabs directly from this
// file to render the exact same cards, filtered by category across modules — a
// filter over this data, never a second copy of it.

import * as state from '../state.js';
import { setPromptPlatform } from '../state.js';

const PLATFORMS = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'claude', label: 'Claude' },
  { id: 'gemini', label: 'Gemini' },
];

export function renderPromptGuide(ctx) {
  const { mod, state: s } = ctx;
  const prompts = mod.prompts || [];
  const wrap = document.createElement('div');
  if (!prompts.length) {
    const empty = document.createElement('div');
    empty.className = 'card';
    empty.innerHTML = `<p class="body-sm" style="color:var(--ink-muted)">No AI prompts are defined for this module yet.</p>`;
    wrap.appendChild(empty);
    return wrap;
  }

  const intro = document.createElement('p');
  intro.className = 'body-sm';
  intro.style.color = 'var(--ink-faint)';
  intro.style.marginBottom = '16px';
  intro.textContent = `This module's AI workflow — one Core Prompt wired to your own saved answers, plus ${prompts.length - 1} Prompt Library ${prompts.length - 1 === 1 ? 'entry' : 'entries'} you can copy and fill in by hand. Every one of these also lives in the AI Brand Studio for later reuse.`;
  wrap.appendChild(intro);

  wrap.appendChild(buildPlatformTabs(s));

  prompts.forEach((prompt, i) => {
    const card = buildPromptGuideCard(prompt, s);
    if (i < prompts.length - 1) card.style.marginBottom = '20px';
    wrap.appendChild(card);
  });

  return wrap;
}

export function buildPlatformTabs(s) {
  const tabs = document.createElement('div');
  tabs.className = 'prompt-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.style.marginBottom = '20px';
  PLATFORMS.forEach((p) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `prompt-tab ${s.nav.promptPlatform === p.id ? 'is-active' : ''}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(s.nav.promptPlatform === p.id));
    tab.textContent = p.label;
    tab.addEventListener('click', () => {
      setPromptPlatform(p.id);
      tabs.querySelectorAll('.prompt-tab').forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
    });
    tabs.appendChild(tab);
  });
  return tabs;
}

export function buildPromptGuideCard(prompt, s, opts = {}) {
  const el = document.createElement('div');
  el.className = 'card prompt-card';

  const isCore = prompt.tier === 'core';
  const head = document.createElement('div');
  head.style.display = 'flex';
  head.style.alignItems = 'flex-start';
  head.style.justifyContent = 'space-between';
  head.style.gap = '12px';
  head.innerHTML = `
    <div>
      <div class="prompt-name">${escHtml(prompt.title)}</div>
      <div class="prompt-purpose">${escHtml(prompt.category)}${opts.moduleLabel ? ` · Introduced in ${escHtml(opts.moduleLabel)}` : ''}</div>
    </div>
    <span class="badge ${isCore ? 'badge-success' : 'badge-neutral'}" style="flex:none">${isCore ? 'Core Prompt' : 'Library'}</span>
  `;
  el.appendChild(head);

  el.appendChild(sixPartSection('Objective', `<p class="body-sm">${escHtml(prompt.objective)}</p>`));
  el.appendChild(sixPartSection('Required inputs', listMarkup(prompt.requiredInputs)));

  const howto = document.createElement('div');
  howto.className = 'prompt-howto';
  howto.style.marginTop = '16px';
  howto.innerHTML = isCore
    ? '<span class="howto-icon" aria-hidden="true">ⓘ</span><span><strong>How to use:</strong> This one is wired to your own saved answers below. Copy it and paste it into your preferred AI assistant.</span>'
    : '<span class="howto-icon" aria-hidden="true">ⓘ</span><span><strong>How to use:</strong> Fill in the bracketed blanks with your own Blueprint text, then copy it into your preferred AI assistant.</span>';
  el.appendChild(howto);

  const { html, plain, missingCount } = assemblePrompt(prompt.template, s);
  const body = document.createElement('div');
  body.className = 'prompt-body';
  body.innerHTML = html;
  el.appendChild(body);

  if (isCore && missingCount > 0) {
    const warn = document.createElement('div');
    warn.className = 'field-error';
    warn.style.marginTop = '12px';
    warn.textContent = `${missingCount} field${missingCount > 1 ? 's' : ''} from an earlier exercise ${missingCount > 1 ? "aren't" : "isn't"} filled in yet — the prompt still works, but the AI will have less to go on.`;
    el.appendChild(warn);
  }

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'btn btn-primary btn-block copy-btn';
  copyBtn.style.marginTop = '12px';
  copyBtn.innerHTML = '⧉ Copy Prompt';
  copyBtn.addEventListener('click', async () => {
    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(plain); copied = true; } catch (e) { /* fall through */ }
    }
    if (!copied) copied = fallbackCopy(plain);
    if (copied) {
      copyBtn.textContent = '✓ Copied';
      copyBtn.classList.add('is-copied');
      copyBtn.setAttribute('aria-live', 'polite');
    } else {
      copyBtn.textContent = 'Select the text above to copy';
    }
    setTimeout(() => { copyBtn.textContent = '⧉ Copy Prompt'; copyBtn.classList.remove('is-copied'); }, 1600);
  });
  el.appendChild(copyBtn);

  el.appendChild(sixPartSection('Expected output', `<p class="body-sm">${escHtml(prompt.expectedOutput)}</p>`, true));
  el.appendChild(sixPartSection('Refinement prompts', listMarkup(prompt.refinementPrompts)));
  el.appendChild(sixPartSection('Quality checklist', listMarkup(prompt.qualityChecklist, true)));

  return el;
}

function sixPartSection(label, innerHtml, topMargin) {
  const section = document.createElement('div');
  section.style.marginTop = topMargin ? '16px' : '12px';
  section.innerHTML = `<div class="label" style="margin-bottom:6px">${escHtml(label)}</div>${innerHtml}`;
  return section;
}

function listMarkup(items, checklist) {
  if (!items || !items.length) return '<p class="body-sm" style="color:var(--ink-faint)">—</p>';
  return `<ul style="margin:0;padding-left:18px">${items.map((i) => `<li class="body-sm" style="margin-bottom:4px">${checklist ? '☐ ' : ''}${escHtml(i)}</li>`).join('')}</ul>`;
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

// The six Core Prompts' live-state context. Deliberately one flat object across every
// module (mirrors Offer Engineering's resolveContext()) rather than six separate
// functions — each Core Prompt's template only references the subset of keys it
// needs. Library prompts never reference any of these; they use plain bracket text.
function resolveContext(s) {
  const a = s.answers;
  const anchor = a.m1.anchor;

  const intakeParts = [
    a.m1.intake.targetCustomer.trim() && `Target customer: ${a.m1.intake.targetCustomer.trim()}`,
    a.m1.intake.mainProblem.trim() && `Main problem: ${a.m1.intake.mainProblem.trim()}`,
    a.m1.intake.promise.trim() && `Promise: ${a.m1.intake.promise.trim()}`,
    a.m1.intake.uvp.trim() && `UVP: ${a.m1.intake.uvp.trim()}`,
    a.m1.intake.differentiation.trim() && `Differentiation: ${a.m1.intake.differentiation.trim()}`,
    a.m1.intake.positioning.trim() && `Positioning: ${a.m1.intake.positioning.trim()}`,
  ].filter(Boolean);

  const sig = a.m2.signals;
  const signalSummary = `Formal↔Casual: ${sig.formalCasual}/10, Bold↔Gentle: ${sig.boldGentle}/10, Playful↔Serious: ${sig.playfulSerious}/10, Expert↔Relatable: ${sig.expertRelatable}/10`;

  const vr = a.m2.voiceRules;
  const voiceRulesParts = [
    vr.use.trim() && `Use: ${vr.use.trim()}`,
    vr.avoid.trim() && `Avoid: ${vr.avoid.trim()}`,
    vr.sentenceStyle.trim() && `Sentence style: ${vr.sentenceStyle.trim()}`,
    vr.humourLevel.trim() && `Humour: ${vr.humourLevel.trim()}`,
    vr.address.trim() && `Address: ${vr.address.trim()}`,
  ].filter(Boolean);

  const colourSummary = a.m4.colourDirections
    .filter((c) => c.direction.trim())
    .map((c) => (c.rationale.trim() ? `${c.direction.trim()} (${c.rationale.trim()})` : c.direction.trim()))
    .join('; ');
  const typeSummary = a.m4.typePairings
    .filter((t) => t.direction.trim())
    .map((t) => (t.rationale.trim() ? `${t.direction.trim()} (${t.rationale.trim()})` : t.direction.trim()))
    .join('; ');

  const gridSummary = (() => {
    const checked = [];
    state.GRID_TOUCHPOINTS.forEach((tp) => {
      state.GRID_ELEMENTS.forEach((el) => {
        if (a.m5.consistencyGrid[tp][el]) checked.push(`${tp}/${el}`);
      });
    });
    return checked.join(', ');
  })();

  const guardrailsSummary = a.m6.guardrails.filter((g) => g.trim()).join('; ');

  return {
    'm1.belief': anchor.belief.trim() || null,
    'm1.audienceTruth': anchor.audienceTruth.trim() || null,
    'm1.brandPromise': anchor.brandPromise.trim() || null,
    'm1.signature': anchor.signature.trim() || null,
    'm1.brandName': a.m1.brandName.trim() || null,
    'm1.intakeSummary': intakeParts.length ? intakeParts.join('. ') : null,
    'm2.signalSummary': signalSummary,
    'm2.voiceRulesSummary': voiceRulesParts.length ? voiceRulesParts.join('. ') : null,
    'm3.belief': a.m3.ladder.belief.trim() || null,
    'm3.promise': a.m3.ladder.promise.trim() || null,
    'm3.proof': a.m3.ladder.proof.trim() || null,
    'm3.audienceLanguage': a.m3.ladder.audienceLanguage.trim() || null,
    'm3.oneLiner': a.m3.ladder.oneLiner.trim() || null,
    'm4.moodNote': a.m4.mood.trim() || null,
    'm4.colourSummary': colourSummary || null,
    'm4.typeSummary': typeSummary || null,
    'm4.logoType': a.m4.logoType || null,
    'm4.logoRequirements': a.m4.logoRequirements.trim() || null,
    'm5.consistencyGridSummary': gridSummary || null,
    'm5.signatureElements': a.m5.signatureElements.trim() || null,
    'm6.guardrailsSummary': guardrailsSummary || null,
  };
}

function assemblePrompt(template, s) {
  const ctx = resolveContext(s);
  let missingCount = 0;
  const html = template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const val = ctx[key.trim()];
    if (val) return `<span class="filled">${escHtml(val)}</span>`;
    missingCount += 1;
    return `<span class="missing">[not filled in yet]</span>`;
  });
  const plain = template.replace(/\{\{(.*?)\}\}/g, (_, key) => ctx[key.trim()] || '[not filled in yet]');
  return { html, plain, missingCount };
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = String(str == null ? '' : str);
  return d.innerHTML;
}
