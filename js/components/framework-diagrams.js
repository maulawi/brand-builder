// framework-diagrams.js — shared visual building blocks for DigitalOps' own
// frameworks, used by lesson-block.js (read-only, in the reading flow). The live,
// interactive versions are exercise-fields.js's builders (Phase 2). Pattern
// adapted from Offer Engineering (see the Phase 0 audit); content is entirely new
// — these three frameworks have no Offer Engineering equivalent.

export function brandAnchorLegend() {
  const roles = [
    ['Belief', 'The one conviction behind why this exists.'],
    ['Audience Truth', 'Who they are and what they’re actually dealing with.'],
    ['Promise', 'What the brand commits to.'],
    ['Signature', 'One distinct, ownable trait that makes this brand recognisable.'],
  ];
  return `<div class="label" style="margin-bottom:12px">The Brand Anchor</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">` + roles
    .map(([label, desc]) => `<div style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px"><div class="body-sm" style="font-weight:700;color:var(--ink)">${label}</div><div class="body-sm" style="color:var(--ink-faint)">${desc}</div></div>`)
    .join('') + `</div>`;
}

export function signalMapLegend() {
  const pairs = [
    ['Formal', 'Casual'], ['Bold', 'Gentle'], ['Playful', 'Serious'], ['Expert', 'Relatable'],
  ];
  return `<div class="label" style="margin-bottom:12px">The Signal Map</div>` + pairs
    .map(([l, r]) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)"><span class="body-sm" style="color:var(--ink);font-weight:600">${l}</span><span class="body-sm" style="color:var(--ink-faint)">↔</span><span class="body-sm" style="color:var(--ink);font-weight:600">${r}</span></div>`)
    .join('');
}

export function messageLadderLegend() {
  const rungs = [
    ['Belief', 'from your Brand Anchor'],
    ['Promise', "from your offer's Promise and UVP"],
    ['Differentiated Proof', 'from your differentiation'],
    ['Audience Language', 'the exact words your customer uses'],
    ['One-Liner', 'compressed from everything below it'],
  ];
  return `<div class="label" style="margin-bottom:12px">The Message Ladder</div><div class="timeline-diagram"><div class="timeline-row">` + rungs
    .map(([label, detail]) => `<div class="tl-stage"><div class="tl-dot">◈</div><div class="tl-name">${label}</div><div class="tl-desc">${detail}</div></div>`)
    .join('') + `</div></div>`;
}
