export const NEW_TAB_URL = 'vcorv://newtab';
export const GOOGLE_SEARCH = 'https://www.google.com/search?q=';
export const STORAGE_KEY = 'vcorv-browser-state-v1';
export const V_MARK = new URL('../assets/v-mark.png', import.meta.url).href;

let sequence = 0;
export function id(prefix = 'tab') { return `${prefix}-${Date.now().toString(36)}-${sequence++}`; }
export function isNewTab(url = '') { return !url || url === NEW_TAB_URL; }
export function safeHttpUrl(raw = '') { try { const url = new URL(raw); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }
export function normalizeDestination(value = '') {
  const raw = String(value).trim();
  if (!raw) return NEW_TAB_URL;
  if (raw === NEW_TAB_URL) return raw;
  const safe = safeHttpUrl(raw); if (safe) return safe;
  if (/^[\w.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(raw)) return `https://${raw}`;
  return `${GOOGLE_SEARCH}${encodeURIComponent(raw)}`;
}
export function domainLabel(url = '') { if (isNewTab(url)) return 'New Tab'; try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'New Tab'; } }
export function faviconFor(url = '') { try { return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=64`; } catch { return V_MARK; } }
