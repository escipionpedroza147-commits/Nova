/* Imperative <webview> manager — keeps webviews out of React's render cycle
   so navigation state survives re-renders. One webview per tab id. */
import { useStore, isInternal } from '../store.js';

let container = null;
const views = new Map(); // tabId -> webview element

export function mountContainer(el) {
  container = el;
  syncAll();
}

function createView(tab) {
  const view = document.createElement('webview');
  view.setAttribute('partition', 'persist:vcorv-browser');
  view.setAttribute('allowpopups', 'true');
  view.src = tab.url;
  view.className = 'webview';

  const id = tab.id;
  const st = () => useStore.getState();

  view.addEventListener('did-start-loading', () => st().updateTab(id, { loading: true }));
  view.addEventListener('did-stop-loading', () => {
    st().updateTab(id, {
      loading: false,
      canGoBack: view.canGoBack(),
      canGoForward: view.canGoForward(),
    });
  });
  view.addEventListener('page-title-updated', (e) => st().updateTab(id, { title: e.title }));
  view.addEventListener('page-favicon-updated', (e) => {
    if (e.favicons?.[0]) st().updateTab(id, { favicon: e.favicons[0] });
  });
  view.addEventListener('did-navigate', (e) => {
    if (e.url && e.url !== 'about:blank') st().updateTab(id, { url: e.url });
  });
  view.addEventListener('did-navigate-in-page', (e) => {
    if (e.isMainFrame && e.url) st().updateTab(id, { url: e.url });
  });

  return view;
}

export function syncAll() {
  if (!container) return;
  const { tabs, activeId } = useStore.getState();

  // remove views for closed tabs
  for (const [id, view] of views) {
    if (!tabs.some((t) => t.id === id)) {
      view.remove();
      views.delete(id);
    }
  }

  for (const tab of tabs) {
    const isWeb = !isInternal(tab.url);
    let view = views.get(tab.id);

    if (isWeb && !view) {
      view = createView(tab);
      views.set(tab.id, view);
      container.appendChild(view);
    }

    if (view) {
      // navigate if store url changed away from webview's current url (user typed)
      const current = view.getURL?.() || view.src;
      if (isWeb && tab.loading && tab.url !== current && !tab.url.startsWith('vcorv://')) {
        try { view.loadURL?.(tab.url) ?? (view.src = tab.url); } catch { view.src = tab.url; }
      }
      view.style.display = tab.id === activeId && isWeb ? 'flex' : 'none';
    }
  }
}

export const goBack = (id) => views.get(id)?.goBack();
export const goForward = (id) => views.get(id)?.goForward();
export const reload = (id) => views.get(id)?.reload();

export function initWebviewSync() {
  return useStore.subscribe(() => syncAll());
}
