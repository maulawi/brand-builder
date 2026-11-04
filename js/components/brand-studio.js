// brand-studio.js — Phase 6, the AI Brand Studio screen. Per the approved spec
// (§6, §8): "it does not hold its own copy of any prompt: it reads the same
// module content already loaded for the lessons, flattens every module's prompt
// list, and groups it by the category tag... a filter over existing data rather
// than a second content system." Every card here is the exact same card the
// module-level "AI Prompt" stage renders — imported directly from prompt-guide.js,
// never reimplemented.

import { MODULE_IDS, setStudioCategory } from '../state.js';
import { buildPromptGuideCard, buildPlatformTabs } from './prompt-guide.js';

export function renderBrandStudio(ctx) {
  const { content, state: s, rerenderMain } = ctx;
  const flat = flattenPrompts(content);
  const categories = categoryOrder(flat);
  const active = categories.includes(s.nav.studioCategory) ? s.nav.studioCategory : categories[0];

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="breadcrumb">AI Tools</div>
    <h1 id="main-heading" class="h2" style="margin-bottom:8px">AI Brand Studio</h1>
    <p class="body-sm" style="color:var(--ink-faint);margin-bottom:20px">Every AI prompt across all six modules — ${flat.length} in total — organised by category so you can come back and find one again without digging through a module you've already finished. This isn't a second copy of anything: it's the same prompts your lessons introduced, filtered a different way.</p>
  `;

  const tabs = document.createElement('div');
  tabs.className = 'prompt-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Prompt category');
  tabs.style.marginBottom = '20px';
  tabs.style.flexWrap = 'wrap';
  categories.forEach((cat) => {
    const count = flat.filter((p) => p.category === cat).length;
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `prompt-tab ${cat === active ? 'is-active' : ''}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(cat === active));
    tab.textContent = `${cat} (${count})`;
    tab.addEventListener('click', () => {
      setStudioCategory(cat);
      rerenderMain();
    });
    tabs.appendChild(tab);
  });
  wrap.appendChild(tabs);

  wrap.appendChild(buildPlatformTabs(s));

  const list = flat.filter((p) => p.category === active);
  list.forEach((prompt, i) => {
    const card = buildPromptGuideCard(prompt, s, { moduleLabel: `Module ${prompt.moduleCode}` });
    if (i < list.length - 1) card.style.marginBottom = '20px';
    wrap.appendChild(card);
  });

  return wrap;
}

function flattenPrompts(content) {
  const flat = [];
  MODULE_IDS.forEach((id) => {
    const mod = content[id];
    if (!mod || !mod.prompts) return;
    mod.prompts.forEach((p) => flat.push({ ...p, moduleId: mod.id, moduleCode: mod.code, moduleTitle: mod.title }));
  });
  return flat;
}

// Category tabs appear in first-seen order across modules m1→m6, which is also
// the order the approved spec's own Prompt Library table uses (Brand Strategy,
// Brand Voice, Brand Messaging, Logo Design, Visual Identity, Brand Assets,
// Brand Guidelines) — derived here rather than hardcoded, so a future content
// edit that reorders or adds a category stays correct without a code change.
function categoryOrder(flat) {
  const seen = [];
  flat.forEach((p) => { if (!seen.includes(p.category)) seen.push(p.category); });
  return seen;
}
