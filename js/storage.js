// storage.js — all localStorage access goes through here, nowhere else.
// Versioned schema so a future format change can migrate old saves instead of
// discarding them. Adapted from Offer Engineering's storage.js (see the Phase 0
// audit) — same probe/fallback/try-catch pattern. This is schema v1: there is
// nothing to migrate FROM yet, so no migration function exists, but loadState()
// is structured so one can be added the same way Offer Engineering's v1→v2
// migration was, without reshaping this function.

const STORAGE_KEY = 'digitalops.brandBuilder.v1';
const SCHEMA_VERSION = 1;

let memoryFallback = null;
let storageAvailable = true;

function probeStorage() {
  try {
    // Merely reading window.localStorage throws a SecurityError in some browsers when
    // storage is blocked (e.g. third-party iframes), so the access itself is inside the try.
    if (!window.localStorage) return false;
    const t = '__db_probe__';
    window.localStorage.setItem(t, '1');
    window.localStorage.removeItem(t);
    return true;
  } catch (e) {
    return false;
  }
}
storageAvailable = typeof window !== 'undefined' && probeStorage();

export function isStorageAvailable() {
  return storageAvailable;
}

export function loadState() {
  if (!storageAvailable) return memoryFallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed) return null;

    if (parsed.schemaVersion === SCHEMA_VERSION) return parsed;

    // No earlier schema version exists yet (this is v1) — once Brand Builder
    // ships a v2, a migration branch goes here, in the same shape Offer
    // Engineering's storage.js uses for its v1→v2 step:
    //   if (parsed.schemaVersion === 1) { const migrated = migrateV1ToV2(parsed); saveState(migrated); return migrated; }

    // Unknown/newer schema: don't guess at migration, start fresh rather than corrupt it silently.
    console.warn('[DigitalOps] Stored progress is from an unrecognized schema version; starting fresh.');
    return null;
  } catch (e) {
    console.warn('[DigitalOps] Could not read saved progress:', e);
    return null;
  }
}

export function saveState(state) {
  const payload = { ...state, schemaVersion: SCHEMA_VERSION, savedAt: new Date().toISOString() };
  if (!storageAvailable) {
    memoryFallback = payload;
    return { ok: true, persisted: false };
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { ok: true, persisted: true };
  } catch (e) {
    console.warn('[DigitalOps] Could not save progress (storage full or blocked):', e);
    memoryFallback = payload;
    return { ok: false, persisted: false, error: e };
  }
}

export function clearState() {
  memoryFallback = null;
  if (!storageAvailable) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[DigitalOps] Could not clear saved progress:', e);
  }
}
