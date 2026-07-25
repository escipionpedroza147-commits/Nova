// Imperative webview registry — webviews live OUTSIDE React's render cycle on purpose.
// React re-renders must never touch <webview> nodes (attach/detach = full page reload).
import { useStore } from '../store.js';
import { isNewTab, safeHttpUrl, domainLabel } from './util.js';

const views = new Map();
let layerEl = null;
let findHandler = null;

export function setLayer(el) { layerEl = el; }
export function getView(tabId) { return views.get(tabId) || null; }
export function removeView(tabId) { const view = views.get(tabId); if (view) { view.remove(); views.delete(tabId); } }
export function onFoundInPage(handler) { findHandler = handler; }

export function activeView() {
  const s = useStore.getState();
  const tab = s.tabs.find((item) => item.id === s.activeId);
  return tab && !isNewTab(tab.url) ? views.get(tab.id) || null : null;
}

function syncFromView(tabId, view, explicitUrl = '') {
  const store = useStore.getState();
  const tab = store.tabs.find((item) => item.id === tabId); if (!tab) return;
  const url = explicitUrl || view.getURL?.() || tab.url;
  const patch = {
    ...(safeHttpUrl(url) ? { url } : {}),
    title: view.getTitle?.() || tab.title || domainLabel(url),
    canGoBack: Boolean(view.canGoBack?.()),
    canGoForward: Boolean(view.canGoForward?.())
  };
  store.patchTab(tabId, patch);
  store.recordHistory(patch.url || tab.url, patch.title);
  store.scheduleSave();
}

function createView(tab) {
  const view = document.createElement('webview');
  view.dataset.tabId = tab.id;
  view.setAttribute('partition', 'persist:vcorv-browser');
  view.setAttribute('allowpopups', '');
  view.src = tab.url;
  const store = () => useStore.getState();
  view.addEventListener('did-start-loading', () => store().patchTab(tab.id, { loading: true }));
  view.addEventListener('did-stop-loading', () => { store().patchTab(tab.id, { loading: false }); syncFromView(tab.id, view); });
  view.addEventListener('did-navigate', (event) => syncFromView(tab.id, view, event.url));
  view.addEventListener('did-navigate-in-page', (event) => syncFromView(tab.id, view, event.url));
  view.addEventListener('page-title-updated', (event) => { store().patchTab(tab.id, { title: event.title || '' }); store().scheduleSave(); });
  view.addEventListener('page-favicon-updated', (event) => { if (event.favicons?.[0]) { store().patchTab(tab.id, { favicon: event.favicons[0] }); store().scheduleSave(); } });
  view.addEventListener('will-navigate', (event) => { if (!safeHttpUrl(event.url)) event.preventDefault(); });
  view.addEventListener('new-window', (event) => { event.preventDefault?.(); if (safeHttpUrl(event.url)) store().createTab(event.url); });
  view.addEventListener('found-in-page', (event) => findHandler?.(event.result || {}));
  view.addEventListener('did-fail-load', (event) => {
    store().patchTab(tab.id, { loading: false });
    if (event.errorCode === -3 || !event.isMainFrame) return;
    const current = store().tabs.find((item) => item.id === tab.id);
    const host = domainLabel(event.validatedURL || current?.url || '');
    view.executeJavaScript(`document.documentElement.innerHTML = ${JSON.stringify(`<body style="margin:0;display:grid;place-items:center;height:100vh;background:#2a2a2a;color:#eee;font-family:-apple-system,system-ui,sans-serif"><div style="text-align:center;max-width:420px;padding:24px"><div style="font-size:40px;margin-bottom:14px">⚠︎</div><h1 style="font-size:19px;margin:0 0 8px;font-weight:600">Can't reach ${host}</h1><p style="color:#9a9a9a;font-size:13.5px;line-height:1.5;margin:0 0 18px">${event.errorDescription || 'The site took too long to respond or is unavailable.'}<br>Check the address or your connection.</p><button onclick="location.reload()" style="height:34px;padding:0 18px;border:0;border-radius:8px;background:#6f9df1;color:#fff;font-size:13px;cursor:pointer">Try again</button></div></body>`)}`).catch(() => {});
  });
  layerEl?.appendChild(view);
  views.set(tab.id, view);
  return view;
}

// Called on every relevant state change; reconciles webview visibility imperatively.
export function syncWebviews() {
  const s = useStore.getState();
  const tab = s.tabs.find((item) => item.id === s.activeId);
  const showWeb = tab && !isNewTab(tab.url) && !s.aiOpen;
  // Drop views for tabs that no longer exist
  [...views.keys()].forEach((tabId) => { if (!s.tabs.some((item) => item.id === tabId)) removeView(tabId); });
  views.forEach((view) => view.classList.remove('active'));
  if (layerEl) layerEl.classList.toggle('active', Boolean(showWeb));
  if (showWeb) {
    const view = views.get(tab.id) || createView(tab);
    if (view.src !== tab.url && view.getURL?.() !== tab.url) view.src = tab.url;
    view.classList.add('active');
  }
}
