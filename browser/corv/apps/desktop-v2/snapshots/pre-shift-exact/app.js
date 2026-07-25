const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const NEW_TAB_URL = 'vcorv://newtab';
const GOOGLE_SEARCH = 'https://www.google.com/search?q=';
const STORAGE_KEY = 'vcorv-browser-state-v1';
const V_MARK = 'assets/v-mark.png';

const state = {
  tabs: [], activeId: '', shortcuts: [], bookmarks: [], downloads: [],
  settings: { restoreTabs: true, showShortcuts: true }
};
const webviews = new Map();
let toastTimer = 0;
let saveTimer = 0;
let tabSequence = 0;
let findRequestId = 0;
let aiWindowOpen = false;

function id(prefix = 'tab') { return `${prefix}-${Date.now().toString(36)}-${tabSequence++}`; }
function escapeHtml(value = '') { const el = document.createElement('div'); el.textContent = String(value); return el.innerHTML; }
function isNewTab(url = '') { return !url || url === NEW_TAB_URL; }
function safeHttpUrl(raw = '') { try { const url = new URL(raw); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }
function normalizeDestination(value = '') {
  const raw = String(value).trim();
  if (!raw) return NEW_TAB_URL;
  if (raw === NEW_TAB_URL) return raw;
  const safe = safeHttpUrl(raw); if (safe) return safe;
  if (/^[\w.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(raw)) return `https://${raw}`;
  return `${GOOGLE_SEARCH}${encodeURIComponent(raw)}`;
}
function domainLabel(url = '') { if (isNewTab(url)) return 'New Tab'; try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'New Tab'; } }
function faviconFallback(url = '') { try { return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=64`; } catch { return V_MARK; } }
function activeTab() { return state.tabs.find((tab) => tab.id === state.activeId) || state.tabs[0] || null; }
function activeWebview() { const tab = activeTab(); return tab && !isNewTab(tab.url) ? webviews.get(tab.id) || null : null; }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 1800); }
function serializedState() {
  return {
    tabs: state.tabs.map(({ id: tabId, url, title, favicon }) => ({ id: tabId, url, title, favicon })),
    activeId: state.activeId, shortcuts: state.shortcuts, bookmarks: state.bookmarks, settings: state.settings
  };
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveState, 120); }
function saveState() {
  const serializable = serializedState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  window.vcorv?.saveBrowserState?.(serializable).catch(() => {});
}
function applySavedState(parsed = {}) {
  if (Array.isArray(parsed.shortcuts)) state.shortcuts = parsed.shortcuts.filter((item) => safeHttpUrl(item.url));
  if (Array.isArray(parsed.bookmarks)) state.bookmarks = parsed.bookmarks.filter((item) => safeHttpUrl(item.url));
  if (parsed.settings && typeof parsed.settings === 'object') state.settings = { ...state.settings, ...parsed.settings };
  if (state.settings.restoreTabs && Array.isArray(parsed.tabs)) {
    state.tabs = parsed.tabs.slice(0, 20).filter((tab) => tab.url !== 'vcorv://ai').map((tab) => ({ id: tab.id || id(), url: isNewTab(tab.url) ? NEW_TAB_URL : normalizeDestination(tab.url), title: tab.title || domainLabel(tab.url), favicon: tab.favicon || '', loading: false, canGoBack: false, canGoForward: false }));
    state.activeId = state.tabs.some((tab) => tab.id === parsed.activeId) ? parsed.activeId : state.tabs[0]?.id || '';
  }
}
async function loadState() {
  try {
    const diskState = await window.vcorv?.loadBrowserState?.();
    const fallback = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    applySavedState(diskState || fallback);
  } catch { localStorage.removeItem(STORAGE_KEY); }
}

function createTab(url = NEW_TAB_URL, options = {}) {
  const normalized = isNewTab(url) ? NEW_TAB_URL : normalizeDestination(url);
  const tab = { id: id(), url: normalized, title: options.title || domainLabel(normalized), favicon: '', loading: false, canGoBack: false, canGoForward: false };
  const activeIndex = state.tabs.findIndex((item) => item.id === state.activeId);
  if (options.background) state.tabs.splice(activeIndex + 1 || state.tabs.length, 0, tab); else { state.tabs.push(tab); state.activeId = tab.id; }
  render(); scheduleSave();
  if (!options.background && isNewTab(normalized)) setTimeout(() => $('#heroSearchInput')?.focus(), 0);
  return tab;
}
function closeTab(tabId) {
  const index = state.tabs.findIndex((tab) => tab.id === tabId); if (index < 0) return;
  const [closed] = state.tabs.splice(index, 1); webviews.get(closed.id)?.remove(); webviews.delete(closed.id);
  if (!state.tabs.length) return createTab();
  if (state.activeId === tabId) state.activeId = state.tabs[Math.min(index, state.tabs.length - 1)].id;
  render(); scheduleSave();
}
function activateTab(tabId) { if (!state.tabs.some((tab) => tab.id === tabId)) return; state.activeId = tabId; render(); scheduleSave(); }
function navigateActive(value) {
  const url = normalizeDestination(value); const tab = activeTab() || createTab();
  tab.url = url; tab.title = domainLabel(url); tab.favicon = ''; render(); scheduleSave();
}

function renderTabs() {
  $('#tabs').innerHTML = state.tabs.map((tab) => `<button class="tab ${tab.id === state.activeId ? 'active' : ''}" role="tab" aria-selected="${tab.id === state.activeId}" data-tab-id="${tab.id}" title="${escapeHtml(tab.title)}">
    <img class="tab-favicon" src="${escapeHtml(tab.favicon || (isNewTab(tab.url) ? V_MARK : faviconFallback(tab.url)))}" alt="">
    <span class="tab-title">${escapeHtml(tab.title || domainLabel(tab.url))}</span><span class="tab-close" data-close-tab="${tab.id}" aria-label="Close tab">×</span></button>`).join('');
  $$('#tabs .tab').forEach((button) => button.addEventListener('click', (event) => {
    const close = event.target.closest('[data-close-tab]'); if (close) { event.stopPropagation(); closeTab(close.dataset.closeTab); } else activateTab(button.dataset.tabId);
  }));
}
function createWebview(tab) {
  const view = document.createElement('webview');
  view.dataset.tabId = tab.id; view.setAttribute('partition', 'persist:vcorv-browser'); view.setAttribute('allowpopups', ''); view.src = tab.url;
  view.addEventListener('did-start-loading', () => { tab.loading = true; updateToolbar(); });
  view.addEventListener('did-stop-loading', () => { tab.loading = false; syncFromWebview(tab, view); });
  view.addEventListener('did-navigate', (event) => syncFromWebview(tab, view, event.url));
  view.addEventListener('did-navigate-in-page', (event) => syncFromWebview(tab, view, event.url));
  view.addEventListener('page-title-updated', (event) => { tab.title = event.title || domainLabel(tab.url); renderTabs(); scheduleSave(); });
  view.addEventListener('page-favicon-updated', (event) => { tab.favicon = event.favicons?.[0] || tab.favicon; renderTabs(); scheduleSave(); });
  view.addEventListener('will-navigate', (event) => { if (!safeHttpUrl(event.url)) event.preventDefault(); });
  view.addEventListener('new-window', (event) => { event.preventDefault?.(); if (safeHttpUrl(event.url)) createTab(event.url); });
  view.addEventListener('did-fail-load', (event) => { if (event.errorCode !== -3) showToast(`Couldn't load ${domainLabel(event.validatedURL)}`); tab.loading = false; updateToolbar(); });
  view.addEventListener('found-in-page', (event) => { const result = event.result || {}; $('#findCount').textContent = result.matches ? `${result.activeMatchOrdinal}/${result.matches}` : '0/0'; });
  $('#webviewLayer').appendChild(view); webviews.set(tab.id, view); return view;
}
function syncFromWebview(tab, view, explicitUrl = '') {
  const url = explicitUrl || view.getURL?.() || tab.url; if (safeHttpUrl(url)) tab.url = url;
  tab.title = view.getTitle?.() || tab.title || domainLabel(tab.url); tab.canGoBack = Boolean(view.canGoBack?.()); tab.canGoForward = Boolean(view.canGoForward?.());
  if (tab.id === state.activeId) updateToolbar(); renderTabs(); scheduleSave();
}
function renderStage() {
  const tab = activeTab(); const isHome = !tab || isNewTab(tab.url);
  $('#newTabPage').hidden = !isHome; $('#corvAiPage').hidden = !aiWindowOpen; $('#webviewLayer').classList.toggle('active', !isHome);
  document.body.classList.toggle('ai-view', aiWindowOpen); $('#homeButton').classList.toggle('active', isHome && !aiWindowOpen);
  webviews.forEach((view) => view.classList.remove('active'));
  if (!isHome) { const view = webviews.get(tab.id) || createWebview(tab); if (view.src !== tab.url && view.getURL?.() !== tab.url) view.src = tab.url; view.classList.add('active'); }
}
function renderShortcuts() {
  const defaultShortcut = `<button class="shortcut" type="button" data-open-url="https://chromewebstore.google.com"><span class="shortcut-disc"><span class="store-bag"><i></i></span></span><span>Web Store</span></button>`;
  const custom = state.shortcuts.map((item, index) => `<button class="shortcut" type="button" data-open-url="${escapeHtml(item.url)}" title="${escapeHtml(item.url)}"><span class="shortcut-disc custom-disc">${escapeHtml(item.name.slice(0, 1).toUpperCase())}</span><span>${escapeHtml(item.name)}</span><i class="shortcut-remove" data-remove-shortcut="${index}">×</i></button>`).join('');
  const add = `<button class="shortcut" id="addShortcutButton" type="button"><span class="shortcut-disc shortcut-plus">＋</span><span>Add shortcut</span></button>`;
  $('#shortcuts').innerHTML = state.settings.showShortcuts ? defaultShortcut + custom + add : '';
  wireUrlButtons(); $('#addShortcutButton')?.addEventListener('click', addShortcut);
  $$('[data-remove-shortcut]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); state.shortcuts.splice(Number(button.dataset.removeShortcut), 1); renderShortcuts(); scheduleSave(); }));
}
function renderBookmarks() {
  $('#bookmarksList').innerHTML = state.bookmarks.length ? state.bookmarks.map((item, index) => `<div class="list-item"><button type="button" data-open-url="${escapeHtml(item.url)}"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.url)}</small></button><button class="list-remove" data-remove-bookmark="${index}" aria-label="Remove">×</button></div>`).join('') : '<p class="empty-list">No bookmarks yet.</p>';
  wireUrlButtons(); $$('[data-remove-bookmark]').forEach((button) => button.addEventListener('click', () => { state.bookmarks.splice(Number(button.dataset.removeBookmark), 1); renderBookmarks(); updateToolbar(); scheduleSave(); }));
}
function renderDownloads() {
  $('#downloadBadge').hidden = !state.downloads.some((item) => item.state === 'progressing');
  $('#downloadsList').innerHTML = state.downloads.length ? state.downloads.slice().reverse().map((item) => { const percent = item.totalBytes ? Math.round(item.receivedBytes / item.totalBytes * 100) : 0; return `<div class="list-item download-item"><button type="button" data-show-download="${escapeHtml(item.savePath || '')}"><strong>${escapeHtml(item.filename || 'Download')}</strong><small>${escapeHtml(item.state)}${item.state === 'progressing' ? ` · ${percent}%` : ''}</small></button></div>`; }).join('') : '<p class="empty-list">No downloads yet.</p>';
  $$('[data-show-download]').forEach((button) => button.addEventListener('click', () => window.vcorv?.showDownload?.(button.dataset.showDownload)));
}
function updateToolbar() {
  const tab = activeTab(); const view = activeWebview();
  const back = view ? Boolean(view.canGoBack?.()) : false; const forward = view ? Boolean(view.canGoForward?.()) : false;
  $('#backButton').disabled = !back; $('#forwardButton').disabled = !forward;
  const loading = Boolean(tab?.loading); document.body.classList.toggle('page-loading', loading); $('#reloadButton').title = loading ? 'Stop loading' : 'Reload';
  const input = $('#omniboxInput'); if (document.activeElement !== input) input.value = tab && !isNewTab(tab.url) ? tab.url : '';
  input.placeholder = 'Search Google or type a URL';
  $('#siteIndicator').textContent = tab && !isNewTab(tab.url) ? (tab.url.startsWith('https://') ? '⌁' : 'i') : 'G';
  const bookmarked = Boolean(tab && !isNewTab(tab.url) && state.bookmarks.some((item) => item.url === tab.url)); $('#bookmarkButton').classList.toggle('active', bookmarked);
}
function render() { renderTabs(); renderStage(); renderShortcuts(); renderBookmarks(); renderDownloads(); updateToolbar(); }

function wireUrlButtons() { $$('[data-open-url]').forEach((button) => { if (button.dataset.wired) return; button.dataset.wired = '1'; button.addEventListener('click', () => navigateActive(button.dataset.openUrl)); }); }
function addShortcut() { const raw = prompt('Shortcut URL', 'https://'); if (!raw) return; const url = normalizeDestination(raw); if (!safeHttpUrl(url)) return showToast('Use a valid web address'); const name = prompt('Shortcut name', domainLabel(url)) || domainLabel(url); state.shortcuts.push({ name, url }); renderShortcuts(); scheduleSave(); }
function toggleBookmark() { const tab = activeTab(); if (!tab || isNewTab(tab.url)) return showToast('Open a webpage to bookmark it'); const index = state.bookmarks.findIndex((item) => item.url === tab.url); if (index >= 0) { state.bookmarks.splice(index, 1); showToast('Bookmark removed'); } else { state.bookmarks.unshift({ title: tab.title || domainLabel(tab.url), url: tab.url }); showToast('Bookmarked'); } renderBookmarks(); updateToolbar(); scheduleSave(); }
function closePanels(except = '') { ['googleAccountPopover','settingsPopover','menuPopover','bookmarksPopover','downloadsPopover'].forEach((panelId) => { if (panelId !== except) $(`#${panelId}`).hidden = true; }); }
async function updateGoogleAccountStatus() {
  const status = await window.vcorv?.googleAccountStatus?.().catch(() => ({ signedIn: false })) || { signedIn: false };
  $('#googleAccountButton').classList.toggle('signed-in', status.signedIn); $('#accountStatusDot').hidden = !status.signedIn;
  $('#googleAccountTitle').textContent = status.signedIn ? 'Google account connected' : 'Sign in to Google';
  $('#googleAccountSubtitle').textContent = status.signedIn ? 'Google services stay signed in across restarts' : 'Use Google services in VCorv';
  $('#googleSignInButton').hidden = status.signedIn; $('#googleSignOutButton').hidden = !status.signedIn;
}
function openGoogleSignIn() { closePanels(); toggleAiWindow(false); navigateActive('https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fwww.google.com%2F'); }
function toggleAiWindow(force) {
  aiWindowOpen = typeof force === 'boolean' ? force : !aiWindowOpen;
  closePanels(); if (!aiWindowOpen) toggleAiHistory(false); renderStage();
  if (aiWindowOpen) setTimeout(() => $('#aiComposerInput')?.focus(), 0);
}
function toggleAiHistory(force) {
  const panel = $('#aiHistoryPanel');
  const willOpen = typeof force === 'boolean' ? force : panel.hidden;
  panel.hidden = !willOpen; $('#aiHistoryButton').classList.toggle('active', willOpen);
  if (willOpen) setTimeout(() => $('#aiHistorySearch').focus(), 0);
}
function selectAiChat(button) {
  $('#aiComposerInput').value = button.querySelector('strong')?.textContent || '';
  toggleAiHistory(false); $('#aiComposerInput').focus();
}
function submitAiPrompt(value) { const prompt = String(value || '').trim(); if (!prompt) return; showToast(`Prompt ready: ${prompt}`); $('#aiComposerInput').value = ''; }
function togglePanel(panelId) { const panel = $(`#${panelId}`); const willOpen = panel.hidden; closePanels(panelId); panel.hidden = !willOpen; }
function openFindBar() { if (!activeWebview()) return showToast('Open a webpage to use Find'); $('#findBar').hidden = false; $('#findInput').focus(); $('#findInput').select(); }
function runFind(forward = true) { const view = activeWebview(); const text = $('#findInput').value; if (!view || !text) return; findRequestId = view.findInPage(text, { forward, findNext: true }); }
function closeFindBar() { const view = activeWebview(); if (view && findRequestId) view.stopFindInPage('clearSelection'); findRequestId = 0; $('#findBar').hidden = true; $('#findCount').textContent = ''; }
function wireEvents() {
  $('#omniboxForm').addEventListener('submit', (event) => { event.preventDefault(); navigateActive($('#omniboxInput').value); });
  $('#heroSearchForm').addEventListener('submit', (event) => { event.preventDefault(); navigateActive($('#heroSearchInput').value); });
  $('#omniboxInput').addEventListener('focus', (event) => event.target.select());
  $('#newTabButton').addEventListener('click', () => { toggleAiWindow(false); createTab(); }); $('#homeButton').addEventListener('click', () => { if (aiWindowOpen) toggleAiWindow(false); else navigateActive(NEW_TAB_URL); }); $('#brandButton').addEventListener('click', () => { toggleAiWindow(false); navigateActive(NEW_TAB_URL); });
  $('#backButton').addEventListener('click', () => activeWebview()?.goBack()); $('#forwardButton').addEventListener('click', () => activeWebview()?.goForward());
  $('#reloadButton').addEventListener('click', () => { const tab = activeTab(); const view = activeWebview(); if (!view) return render(); if (tab.loading) view.stop(); else view.reload(); });
  $('#bookmarkButton').addEventListener('click', toggleBookmark); $('#bookmarksButton').addEventListener('click', () => togglePanel('bookmarksPopover')); $('#downloadsButton').addEventListener('click', () => togglePanel('downloadsPopover'));
  $('#googleAccountButton').addEventListener('click', () => { togglePanel('googleAccountPopover'); updateGoogleAccountStatus(); }); $('#googleSignInButton').addEventListener('click', openGoogleSignIn); $('#googleSignOutButton').addEventListener('click', async () => { await window.vcorv?.googleSignOut?.(); await updateGoogleAccountStatus(); showToast('Signed out of Google'); });
  $('#aiButton').addEventListener('click', () => toggleAiWindow()); $('#aiModeButton').addEventListener('click', () => toggleAiWindow()); $('#settingsRailButton').addEventListener('click', () => togglePanel('settingsPopover')); $('#browserMenuButton').addEventListener('click', () => togglePanel('menuPopover')); 
  $('#addShortcutRailButton').addEventListener('click', addShortcut); $('#googleAppsButton').addEventListener('click', () => navigateActive('https://www.google.com/intl/en/about/products'));
  $('#imageSearchButton').addEventListener('click', () => navigateActive('https://images.google.com')); $('#voiceSearchButton').addEventListener('click', () => showToast('Voice search will be wired in the next function pass'));
  $$('[data-window-action]').forEach((button) => button.addEventListener('click', () => window.vcorv?.windowControl?.(button.dataset.windowAction)));
  $$('[data-close-panel]').forEach((button) => button.addEventListener('click', () => { $(`#${button.dataset.closePanel}`).hidden = true; }));
  $('#restoreTabsToggle').addEventListener('change', (event) => { state.settings.restoreTabs = event.target.checked; scheduleSave(); });
  $('#shortcutToggle').addEventListener('change', (event) => { state.settings.showShortcuts = event.target.checked; renderShortcuts(); scheduleSave(); });
  $('#clearDataButton').addEventListener('click', async () => { await window.vcorv?.clearBrowsingData?.(); showToast('Browsing data cleared'); });
  $('#findInput').addEventListener('input', () => runFind(true)); $('#findPrevious').addEventListener('click', () => runFind(false)); $('#findNext').addEventListener('click', () => runFind(true)); $('#findClose').addEventListener('click', closeFindBar);
  $('#aiComposerForm').addEventListener('submit', (event) => { event.preventDefault(); submitAiPrompt($('#aiComposerInput').value); });
  $('#aiHistoryButton').addEventListener('click', () => toggleAiHistory()); $('#viewAllChatsButton').addEventListener('click', () => toggleAiHistory(true)); $('#closeAiHistoryButton').addEventListener('click', () => toggleAiHistory(false));
  $('#aiHistorySearch').addEventListener('input', (event) => { const query = event.target.value.trim().toLowerCase(); $$('.history-chat').forEach((button) => { button.hidden = !button.querySelector('strong').textContent.toLowerCase().includes(query); }); });
  $$('.history-chat').forEach((button) => button.addEventListener('click', () => selectAiChat(button)));
  $$('[data-prompt]').forEach((button) => button.addEventListener('click', () => { $('#aiComposerInput').value = button.dataset.prompt; $('#aiComposerInput').focus(); }));
  $$('[data-ai-tool]').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.aiTool} selected`)));
  $$('.recent-chat').forEach((button) => button.addEventListener('click', () => { $('#aiComposerInput').value = button.querySelector('strong').textContent; $('#aiComposerInput').focus(); }));
  $('#menuPopover').addEventListener('click', (event) => { const action = event.target.closest('[data-menu-action]')?.dataset.menuAction; if (!action) return; closePanels(); if (action === 'new-tab') createTab(); if (action === 'new-window') window.vcorv?.newWindow?.(); if (action === 'find') openFindBar(); if (action === 'bookmarks') togglePanel('bookmarksPopover'); if (action === 'downloads') togglePanel('downloadsPopover'); if (action === 'settings') togglePanel('settingsPopover'); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.popover, #googleAccountButton, #settingsRailButton, #browserMenuButton, #bookmarksButton, #downloadsButton')) closePanels(); });
  document.addEventListener('keydown', (event) => {
    const mod = event.metaKey || event.ctrlKey; const key = event.key.toLowerCase();
    if (mod && key === 'l') { event.preventDefault(); if (aiWindowOpen) toggleAiWindow(false); $('#omniboxInput').focus(); $('#omniboxInput').select(); }
    if (mod && key === 't') { event.preventDefault(); toggleAiWindow(false); createTab(); }
    if (mod && key === 'w') { event.preventDefault(); if (aiWindowOpen) toggleAiWindow(false); else { const tab = activeTab(); if (tab) closeTab(tab.id); } }
    if (mod && key === 'r') { event.preventDefault(); $('#reloadButton').click(); }
    if (mod && key === 'f') { event.preventDefault(); openFindBar(); }
    if (mod && key === 'd') { event.preventDefault(); toggleBookmark(); }
    if (event.key === 'Escape') { closePanels(); closeFindBar(); if (!$('#aiHistoryPanel').hidden) toggleAiHistory(false); else if (aiWindowOpen) toggleAiWindow(false); }
  });
  window.vcorv?.onGoogleAccountChanged?.(() => updateGoogleAccountStatus());
  window.vcorv?.onBrowserNewTab?.((payload) => { if (payload?.url === 'vcorv://ai') toggleAiWindow(true); else if (safeHttpUrl(payload?.url)) createTab(payload.url); });
  window.vcorv?.onAiHistory?.(() => { toggleAiWindow(true); toggleAiHistory(true); });
  window.vcorv?.onDownloadUpdated?.((payload) => { const index = state.downloads.findIndex((item) => item.id === payload.id); if (index >= 0) state.downloads[index] = payload; else state.downloads.push(payload); renderDownloads(); if (payload.state === 'completed') showToast(`${payload.filename} downloaded`); });
}

async function boot() {
  await loadState(); wireEvents(); wireUrlButtons();
  $('#restoreTabsToggle').checked = state.settings.restoreTabs; $('#shortcutToggle').checked = state.settings.showShortcuts;
  if (!state.tabs.length) createTab(); else render();
  updateGoogleAccountStatus();
}
boot();
