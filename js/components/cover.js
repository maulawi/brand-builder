// cover.js — Screen 01. No shell, no nav — this is the product's front door.
// Adapted from Offer Engineering (see the Phase 0 audit): progressive-reveal
// pattern ports as-is; copy is Brand Builder's own.

import { renderCoverShowcase } from './cover-showcase.js';

export function renderCover({ onStart }) {
  const el = document.createElement('div');
  el.className = 'cover';
  el.innerHTML = `
    <div class="cover-topbar">
      <div class="cover-lockup">
        <div class="cover-mark">DO</div>
        <span class="h3">DigitalOps</span>
      </div>
      <div class="body-sm" style="color:var(--ink-faint)">Skill Library &nbsp; How It Works &nbsp; About</div>
    </div>
    <div class="cover-hero">
      <div class="cover-copy">
        <div class="eyebrow">BUILD / 002</div>
        <h1 class="h1">BRAND<span class="accent">BUILDER</span></h1>
        <p class="body cover-sub">A practical interactive system for turning your validated offer into a brand people recognise, trust and remember.</p>
        <div class="cover-chips">
          <div class="cover-chip"><span class="icon">◆</span>Three original frameworks</div>
          <div class="cover-chip"><span class="icon">◆</span>AI Brand Studio</div>
          <div class="cover-chip"><span class="icon">◆</span>Interactive exercises</div>
          <div class="cover-chip"><span class="icon">◆</span>Your Brand Blueprint</div>
        </div>
        <div class="cover-ctas">
          <button class="btn btn-primary" id="start-btn">Start the Guide →</button>
          <button class="btn btn-secondary" id="peek-btn">See what's inside</button>
        </div>
        <div class="eyebrow cover-foot">Turn a validated offer into a brand people remember.</div>
      </div>
      <div class="cover-showcase-slot"></div>
    </div>
    <section class="whats-inside" id="whats-inside">
      <div class="wi-item"><h3 class="h3" style="color:var(--gold)">01</h3><p class="body-sm">Six focused modules, each with a lesson, an exercise, and a ready-to-use AI prompt.</p></div>
      <div class="wi-item"><h3 class="h3" style="color:var(--gold)">02</h3><p class="body-sm">Three original DigitalOps frameworks — the Brand Anchor, the Signal Map, the Message Ladder.</p></div>
      <div class="wi-item"><h3 class="h3" style="color:var(--gold)">03</h3><p class="body-sm">No account, no login — your progress saves automatically in this browser.</p></div>
      <div class="wi-item"><h3 class="h3" style="color:var(--gold)">04</h3><p class="body-sm">A finished, exportable Brand Blueprint — the actual document you walk away with.</p></div>
    </section>
  `;
  el.querySelector('.cover-showcase-slot').replaceWith(renderCoverShowcase());

  el.querySelector('#start-btn').addEventListener('click', onStart);
  el.querySelector('#peek-btn').addEventListener('click', () => {
    el.querySelector('#whats-inside').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  return el;
}
