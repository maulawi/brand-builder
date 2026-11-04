// lesson-block.js — the reading area. Renders every lesson in the module in
// sequence, each with its own Key Insight callout, plus a small read-only
// illustration of that module's framework where one exists. Adapted from Offer
// Engineering (see the Phase 0 audit): the per-module-id branching that picks a
// framework illustration is rewritten for Brand Builder's own three frameworks.
// The draft-flag feature (dead code in Offer Engineering's current content) is
// kept and actually used here, since Phase 3's placeholder content is draft by
// definition until Phase 4 replaces it.

import { brandAnchorLegend, signalMapLegend, messageLadderLegend } from './framework-diagrams.js';

export function renderLessonBlock({ mod }) {
  const wrap = document.createElement('div');
  wrap.className = 'lesson-body';

  mod.lessons.forEach((lesson, i) => {
    const section = document.createElement('div');
    section.style.marginBottom = '32px';
    const heading = mod.lessons.length > 1 ? `<h2 class="h3" style="margin-bottom:4px">${lesson.id} ${lesson.title}</h2>` : `<h2 class="h3" style="margin-bottom:4px">${lesson.title}</h2>`;
    section.innerHTML = `
      ${heading}
      <div class="lesson-meta">⏱ ${lesson.readTime}${lesson.status === 'draft' ? '<span class="draft-flag">Draft — placeholder copy, Phase 4 replaces it</span>' : ''}</div>
      ${lesson.body.map((p) => `<p class="body">${p}</p>`).join('')}
    `;
    wrap.appendChild(section);

    if (i === 0) {
      const diagram = buildFrameworkIllustration(mod);
      if (diagram) wrap.appendChild(diagram);
    }

    if (lesson.insight) {
      const callout = document.createElement('div');
      callout.className = 'callout';
      callout.innerHTML = `<span class="callout-icon">✦</span><div><div class="label callout-title">Key Insight</div><div class="callout-text">${lesson.insight}</div></div>`;
      wrap.appendChild(callout);
    }
  });

  return wrap;
}

function buildFrameworkIllustration(mod) {
  const box = document.createElement('div');
  box.className = 'card';
  box.style.marginBottom = '24px';

  if (mod.id === 'm1') { box.innerHTML = brandAnchorLegend(); return box; }
  if (mod.id === 'm2') { box.innerHTML = signalMapLegend(); return box; }
  if (mod.id === 'm3') { box.innerHTML = messageLadderLegend(); return box; }
  return null;
}
