// app.js — entry point and render orchestration.
//
// Render model (kept deliberately simple for a vanilla, no-framework app):
//   - #sidebar / #topbar ("the shell") are rebuilt on every state change AND every route
//     change. They never contain a focused text input, so this is always safe.
//   - #content-col ("main content") is rebuilt on every ROUTE change, and otherwise only
//     when a component explicitly asks for it after a structural edit (add/remove a row,
//     pick an option). Per-keystroke edits update state WITHOUT rebuilding main
//     content, so a customer never loses focus or cursor position while typing.
//
// Adapted from Offer Engineering (see the Phase 0 audit): the render model ports
// directly. Two real differences, not cosmetic ones:
//   1. No m0 orientation step exists (Phase 1's resolved assumption), so the
//      special-case m0 branch Offer Engineering's app.js had is gone entirely.
//   2. buildNavFoot's "is this the last module" check uses `mod.number ===
//      MODULE_IDS.length` here, not `MODULE_IDS.length - 1` — Offer Engineering's
//      modules were 0-indexed (m0..m8, so the last module's number equalled
//      length-1); Brand Builder's are 1-indexed (m1..m6, no m0), so the last
//      module's number equals length itself. Copying Offer Engineering's exact
//      expression here would have been silently wrong by one module.
//
// The "prompt" stage is real as of Phase 5 (the AI Prompt Engine — see
// prompt-guide.js), the AI Brand Studio screen is real as of Phase 6 (see
// brand-studio.js — a filter over that same prompt data, not a second copy),
// and the Brand Blueprint + PDF export are real as of Phase 7 (see
// blueprint.js). Every stage and screen is now real; "deliverable" renders
// live completion data from state.js the same way it has since Phase 2.

import * as state from './state.js';
import { onRouteChange, parseHash, moduleHash, navigate as go } from './router.js';
import { loadAllModules, MODULE_TITLES } from './navigation.js';
import { renderCover } from './components/cover.js';
import { renderNavRail } from './components/nav-rail.js';
import { renderProgressIndicator } from './components/progress-indicator.js';
import { renderLessonBlock } from './components/lesson-block.js';
import { renderExerciseFields } from './components/exercise-fields.js';
import { renderPromptGuide } from './components/prompt-guide.js';
import { renderBrandStudio } from './components/brand-studio.js';
import { renderBlueprint } from './components/blueprint.js';
import { renderResources } from './components/resources.js';

const root = document.getElementById('app-root');
let content = null; // all module content, loaded once
let currentRoute = { name: 'cover' };
let shellMounted = false;
let drawerOpen = false; // survives sidebar being replaced wholesale on every shell re-render

async function boot() {
  try {
    content = await loadAllModules();
  } catch (e) {
    root.innerHTML = `<div style="padding:48px;max-width:560px;margin:0 auto;font-family:var(--font-sans);color:var(--ink)">
      <h1 class="h2">Couldn't load Brand Builder's content</h1>
      <p class="body" style="color:var(--ink-muted);margin-top:12px">${escapeHtml(String(e.message || e))}</p>
      <p class="body-sm" style="color:var(--ink-faint);margin-top:12px">If you're opening index.html directly from disk, most browsers block module fetches over file:// — run a static server instead (see README.md).</p>
    </div>`;
    return;
  }

  updateStorageWarning();
  state.subscribe(() => { updateStorageWarning(); if (shellMounted) renderShell(currentRoute); });
  onRouteChange((route) => {
    currentRoute = route;
    renderRoute(route);
  });
}

function renderRoute(route) {
  if (route.name === 'cover') {
    shellMounted = false;
    root.innerHTML = '';
    root.appendChild(renderCover({ onStart: () => go('#/m1') }));
    return;
  }

  if (!shellMounted) {
    mountShell();
    shellMounted = true;
  }
  renderShell(route);
  renderMainContent(route);
}

function mountShell() {
  root.innerHTML = `
    <a class="skip-link" href="#main-heading">Skip to content</a>
    <div class="drawer-scrim" id="drawer-scrim"></div>
    <div class="app-shell">
      <nav class="sidebar" id="sidebar" aria-label="Module navigation"></nav>
      <div class="main-col">
        <header class="topbar">
          <button class="menu-toggle btn btn-secondary" id="menu-toggle" aria-label="Open module navigation" aria-expanded="false">☰</button>
          <div class="top-progress" id="top-progress"></div>
        </header>
        <main class="content-col" id="content-col" tabindex="-1"></main>
      </div>
    </div>
  `;
  const scrim = document.getElementById('drawer-scrim');
  const toggle = document.getElementById('menu-toggle');
  // Always re-query #sidebar: renderShell() replaces that node wholesale on every
  // state/route change, so a reference captured once here would go stale.
  function closeDrawer() {
    drawerOpen = false;
    document.getElementById('sidebar').classList.remove('open');
    scrim.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function openDrawer() {
    drawerOpen = true;
    document.getElementById('sidebar').classList.add('open');
    scrim.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  toggle.addEventListener('click', () => (drawerOpen ? closeDrawer() : openDrawer()));
  scrim.addEventListener('click', closeDrawer);
  window.__closeDrawer = closeDrawer; // used by nav-rail link clicks on mobile

  // The skip link's href is a fragment, which this hash router would read as a route
  // change (and send the user to the cover). Handle it by moving focus instead.
  document.querySelector('.skip-link').addEventListener('click', (e) => {
    e.preventDefault();
    const heading = document.getElementById('main-heading');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus();
    heading.scrollIntoView({ block: 'start' });
  });
}

// Shown only when progress can't be saved (localStorage blocked, e.g. by an embedded
// browser's privacy settings, or full). Lives outside #app-root so the per-route
// re-renders never remove it; dismissing it hides it until the next page load.
let storageWarningDismissed = false;
function updateStorageWarning() {
  let bar = document.getElementById('storage-warning');
  const show = state.progressWillNotPersist() && !storageWarningDismissed;
  if (!show) { if (bar) bar.remove(); return; }
  if (bar) return;
  bar = document.createElement('div');
  bar.id = 'storage-warning';
  bar.className = 'storage-warning';
  bar.setAttribute('role', 'status');
  bar.innerHTML = `<span>Your browser isn't letting this page save progress, so your answers will be lost if you refresh or leave. Copy anything you want to keep before closing.</span><button type="button" class="storage-warning-close" aria-label="Dismiss warning">✕</button>`;
  bar.querySelector('button').addEventListener('click', () => { storageWarningDismissed = true; bar.remove(); });
  document.body.appendChild(bar);
}

function renderShell(route) {
  const s = state.getState();
  const activeModule = route.name === 'module' ? route.moduleId : null;
  const newSidebar = renderNavRail({
    content, state: s, activeModuleId: activeModule, route,
    onNavigate: (hash) => { go(hash); if (window.__closeDrawer) window.__closeDrawer(); },
    onShellRefresh: () => renderShell(currentRoute),
  });
  if (drawerOpen) newSidebar.classList.add('open'); // survive a shell rebuild while the mobile drawer is open
  document.getElementById('sidebar').replaceWith(newSidebar);
  document.getElementById('top-progress').replaceWith(renderProgressIndicator({ content, state: s, activeModule, variant: 'top' }));
}

function rerenderMain() { renderMainContent(currentRoute); }

function renderMainContent(route) {
  const el = document.getElementById('content-col');
  el.innerHTML = '';
  el.scrollTop = 0;

  if (route.name === 'resources') {
    el.appendChild(renderResources());
    return;
  }
  if (route.name === 'blueprint') {
    el.appendChild(renderBlueprint({ content, state: state.getState(), onNavigate: go }));
    return;
  }
  if (route.name === 'brand-studio') {
    el.appendChild(renderBrandStudio({ content, state: state.getState(), rerenderMain }));
    return;
  }
  if (route.name === 'module') {
    const mod = content[route.moduleId];
    if (!mod) { el.textContent = 'Unknown module.'; return; }

    const s = state.getState();
    const stage = route.stage || (s.nav.lastModule === route.moduleId ? s.nav.lastStage : 'lesson');
    state.setLastVisited(route.moduleId, stage);
    el.appendChild(buildModuleHeader(mod, stage));
    el.appendChild(buildStageContent(mod, stage));
  }
}

function buildModuleHeader(mod, stage) {
  const wrap = document.createElement('div');
  const stageLabels = { lesson: 'Lesson', exercise: 'Exercise', prompt: 'AI Prompt', deliverable: 'Deliverable' };
  wrap.innerHTML = `
    <div class="breadcrumb">Module ${mod.code} / ${stageLabels[stage]}</div>
    <h1 id="main-heading" class="h2" style="margin-bottom:8px">${mod.title}</h1>
    ${mod.framework ? `<div class="body-sm" style="color:var(--ink-faint);margin-bottom:16px">Framework: ${mod.framework}</div>` : ''}
    ${buildStepper(mod, stage)}
  `;
  return wrap;
}

function buildStepper(mod, currentStage) {
  const stages = [
    ['lesson', 'Lesson'], ['exercise', 'Exercise'], ['prompt', 'AI Prompt'], ['deliverable', 'Deliverable'],
  ];
  const order = ['lesson', 'exercise', 'prompt', 'deliverable'];
  const currentIdx = order.indexOf(currentStage);
  return `<div class="lesson-stepper" role="tablist" aria-label="Module steps">${stages
    .map(([id, label], i) => {
      const cls = id === currentStage ? 'is-active' : i < currentIdx ? 'is-done' : '';
      return `<a class="step-pill ${cls}" role="tab" aria-selected="${id === currentStage}" href="${moduleHash(mod.id, id)}">${label}</a>`;
    })
    .join('')}</div>`;
}

function buildStageContent(mod, stage) {
  const ctx = { mod, content, state: state.getState(), onNavigate: go, rerenderMain };
  const wrap = document.createElement('div');
  if (stage === 'lesson') wrap.appendChild(renderLessonBlock(ctx));
  else if (stage === 'exercise') wrap.appendChild(renderExerciseFields(ctx));
  else if (stage === 'prompt') wrap.appendChild(renderPromptGuide(ctx));
  else if (stage === 'deliverable') wrap.appendChild(buildModuleDeliverableSnapshot(mod));
  wrap.appendChild(buildNavFoot(mod, stage));
  return wrap;
}

// A quick per-module completion snapshot — mirrors Offer Engineering's own
// module-snapshot/full-list split (deliverable-tracker.js's renderSnapshot vs.
// renderFullList): this stage shows just this module's rows at a glance; the full
// narrative summary of every deliverable, across all six modules, is the Brand
// Blueprint screen itself (blueprint.js, Phase 7), linked below.
function buildModuleDeliverableSnapshot(mod) {
  const card = document.createElement('div');
  card.className = 'card';
  const ids = state.DELIVERABLES.filter((d) => d.module === mod.id);
  const s = state.getState();
  const rows = ids.map((d) => {
    const done = state.deliverableStatus(d.id, s);
    return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><span class="h3" style="font-size:15px">${d.label}</span><span class="badge ${done ? 'badge-success' : 'badge-neutral'}">${done ? '✓ Complete' : 'Incomplete'}</span></div>`;
  }).join('');
  card.innerHTML = `${rows}<p class="body-sm" style="color:var(--ink-faint);margin-top:4px">The full narrative summary of every deliverable lives in your <a href="#/blueprint" style="color:var(--gold)">Brand Blueprint</a>, with PDF export.</p>`;
  return card;
}

function buildNavFoot(mod, stage) {
  const order = ['lesson', 'exercise', 'prompt', 'deliverable'];
  const i = order.indexOf(stage);
  const foot = document.createElement('div');
  foot.className = 'navfoot';

  const prevHref = i > 0 ? moduleHash(mod.id, order[i - 1]) : (mod.number > 1 ? moduleHash(`m${mod.number - 1}`, 'deliverable') : null);
  const isLastOfAll = mod.number === state.MODULE_IDS.length && stage === 'deliverable';
  const nextHref = i < order.length - 1 ? moduleHash(mod.id, order[i + 1]) : isLastOfAll ? '#/blueprint' : moduleHash(`m${mod.number + 1}`, 'lesson');

  foot.innerHTML = `
    ${prevHref ? `<a class="btn btn-secondary" href="${prevHref}">← Previous</a>` : '<span></span>'}
    <a class="btn btn-primary" href="${nextHref}">${isLastOfAll ? 'View Your Brand Blueprint →' : 'Continue →'}</a>
  `;
  return foot;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

boot();
