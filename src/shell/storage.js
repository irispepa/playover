// Namespaced localStorage with JSON values. Survives airplane mode and app restarts.
const PREFIX = 'flightgames:';

export function makeStorage(ns) {
  const key = (k) => `${PREFIX}${ns}:${k}`;
  return {
    get(k, fallback = null) {
      try {
        const raw = localStorage.getItem(key(k));
        return raw === null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },
    set(k, value) {
      try { localStorage.setItem(key(k), JSON.stringify(value)); return true; }
      catch { return false; }                          // quota or private mode
    },
    remove(k) { try { localStorage.removeItem(key(k)); } catch { /* ignore */ } },
  };
}
