// cover-showcase.js — the six-module holographic showcase that fills the cover's
// right-hand hero panel. Pattern adapted from Offer Engineering (see the Phase 0
// audit) — progressive reveal, reduced-motion handling, and badge all port as-is;
// content and icons are Brand Builder's own.

const STAGES = [
  {
    n: '01',
    title: 'Carry Your Strategy Into a Brand',
    desc: 'Import your offer foundation and define your Brand Anchor.',
    icon: `<circle cx="24" cy="24" r="4" fill="currentColor"/>
           <path d="M24 10v6M24 32v6M10 24h6M32 24h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           <path d="M24 16a8 8 0 018 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  },
  {
    n: '02',
    title: 'Brand Personality & Voice',
    desc: 'Map your Signal Map and turn it into concrete voice rules.',
    icon: `<path d="M10 14h28v16H22l-7 6v-6h-5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
           <line x1="16" y1="20" x2="32" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           <line x1="16" y1="26" x2="26" y2="26" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  },
  {
    n: '03',
    title: 'Brand Messaging Architecture',
    desc: 'Build your Message Ladder and compress it to a one-liner.',
    icon: `<line x1="14" y1="38" x2="14" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           <line x1="14" y1="34" x2="30" y2="34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           <line x1="14" y1="26" x2="26" y2="26" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           <line x1="14" y1="18" x2="22" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           <circle cx="34" cy="12" r="3" fill="currentColor"/>`,
  },
  {
    n: '04',
    title: 'Visual Identity Direction',
    desc: 'Set colour, typography and logo direction as a brief, not art.',
    icon: `<path d="M24 10a14 14 0 100 28c2 0 3-1 3-3s-1-2-1-4 2-3 4-3h3a7 7 0 007-7c0-6-7-11-16-11z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
           <circle cx="18" cy="22" r="2" fill="currentColor"/>
           <circle cx="26" cy="18" r="2" fill="currentColor"/>
           <circle cx="18" cy="30" r="2" fill="currentColor"/>`,
  },
  {
    n: '05',
    title: 'Brand Assets & Application System',
    desc: 'Make the identity consistent everywhere it actually appears.',
    icon: `<rect x="9" y="9" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
           <rect x="27" y="9" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
           <rect x="9" y="27" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
           <rect x="27" y="27" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>`,
  },
  {
    n: '06',
    title: 'Brand Guidelines & Final Blueprint',
    desc: 'Compile everything, set guardrails, and export your Brand Blueprint.',
    icon: `<path d="M24 8l14 5v11c0 9-6 14-14 17-8-3-14-8-14-17V13z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
           <path d="M17.5 24l4.5 4.5 9-9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
];

export function renderCoverShowcase() {
  const el = document.createElement('div');
  el.className = 'cover-showcase';
  el.setAttribute('aria-hidden', 'true'); // decorative echo of real nav links elsewhere on the page

  const rows = STAGES.map((stage, i) => {
    const row = `
      <div class="showcase-stage" style="transition-delay:${i * 90}ms">
        <div class="stage-platform">
          <span class="platform-ring"></span>
          <span class="platform-disc"></span>
          <svg class="stage-icon" viewBox="0 0 48 48" style="animation-delay:${i * 0.35}s">${stage.icon}</svg>
        </div>
        <div class="stage-text">
          <div class="stage-num">${stage.n}</div>
          <div class="stage-title">${stage.title}</div>
          <div class="stage-desc">${stage.desc}</div>
        </div>
      </div>`;
    const connector = i < STAGES.length - 1
      ? `<div class="showcase-connector" style="transition-delay:${i * 90 + 60}ms"><span class="connector-line"></span></div>`
      : '';
    return row + connector;
  }).join('');

  el.innerHTML = `
    <div class="showcase-frame">
      <div class="showcase-head">
        <span class="showcase-badge">6 MODULES</span>
      </div>
      ${rows}
    </div>
  `;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('is-visible'));
  });

  return el;
}
