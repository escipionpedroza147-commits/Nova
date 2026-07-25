import { create } from 'zustand';
import { NEW_TAB_URL, STORAGE_KEY, id, isNewTab, safeHttpUrl, normalizeDestination, domainLabel } from './lib/util.js';
import { SPACE_COLORS, SPACE_ICONS, LEGACY_ICON_MAP, pickApps } from './lib/catalog.js';

const newTab = (url = NEW_TAB_URL, spaceId = '', title = '') => ({
  id: id(), url, title: title || domainLabel(url), favicon: '', spaceId, loading: false, canGoBack: false, canGoForward: false
});

let saveTimer = 0;

// vshell v7: apply theme class + accent variable to the document
export function applyThemeSettings(settings) {
  if (typeof document === 'undefined' || !settings) return;
  document.body.classList.remove('theme-light', 'theme-midnight');
  if (settings.theme === 'light') document.body.classList.add('theme-light');
  else if (settings.theme === 'midnight') document.body.classList.add('theme-midnight');
  document.documentElement.style.setProperty('--accent', settings.accent || '#8f8fd8');
}

export const useStore = create((set, get) => ({
  tabs: [], activeId: '', shortcuts: [], bookmarks: [], downloads: [],
  spaces: [], activeSpaceId: '', history: [], closedTabs: [],
  settings: {
    restoreTabs: true, showShortcuts: true, sidebarHidden: true, vshellV7: true,
    // vshell design system (v7)
    theme: 'dark',            // dark | light | midnight
    accent: '#8f8fd8',        // user accent color
    sidebarApps: true,        // apps section in sidebar
    sidebarThreads: true,     // AI threads section in sidebar
    sidebarMemory: true,      // workspace memory card in sidebar
    statusBar: false,         // honest status bar
    continuePill: true,       // resume-last-session pill on new tab
    omniboxAi: true           // Ask Corv chip in omnibox
  },
  aiOpen: false, aiHistoryOpen: false,
  aiChats: [], activeAiChatId: '', aiStreaming: false,
  toast: '', toastKey: 0,
  googleSignedIn: false,

  // ---------- persistence ----------
  serialized() {
    const s = get();
    return {
      tabs: s.tabs.map(({ id: tabId, url, title, favicon, spaceId }) => ({ id: tabId, url, title, favicon, spaceId })),
      activeId: s.activeId, shortcuts: s.shortcuts, bookmarks: s.bookmarks,
      spaces: s.spaces, activeSpaceId: s.activeSpaceId, settings: s.settings,
      history: s.history.slice(0, 500),
      aiChats: s.aiChats.slice(0, 100).map((chat) => ({ ...chat, messages: chat.messages.slice(-60) }))
    };
  },
  scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const data = get().serialized();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.vcorv?.saveBrowserState?.(data).catch(() => {});
    }, 120);
  },
  async boot() {
    let parsed = {};
    try {
      const disk = await window.vcorv?.loadBrowserState?.();
      parsed = disk || JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { /* fresh start */ }
    const patch = {};
    if (Array.isArray(parsed.shortcuts)) patch.shortcuts = parsed.shortcuts.filter((item) => safeHttpUrl(item.url));
    if (Array.isArray(parsed.bookmarks)) patch.bookmarks = parsed.bookmarks.filter((item) => safeHttpUrl(item.url));
    if (parsed.settings && typeof parsed.settings === 'object') {
      patch.settings = { ...get().settings, ...parsed.settings };
      if (!parsed.settings.vshellV7) { patch.settings.sidebarHidden = true; patch.settings.vshellV7 = true; }
    }
    if (Array.isArray(parsed.history)) patch.history = parsed.history.filter((item) => item && safeHttpUrl(item.url)).slice(0, 500);
    if (Array.isArray(parsed.aiChats)) {
      patch.aiChats = parsed.aiChats
        .filter((chat) => chat && chat.id && Array.isArray(chat.messages))
        .slice(0, 100)
        .map((chat) => ({
          id: chat.id,
          title: String(chat.title || 'New chat').slice(0, 80),
          createdAt: chat.createdAt || Date.now(),
          updatedAt: chat.updatedAt || chat.createdAt || Date.now(),
          messages: chat.messages
            .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
            .map((msg) => ({ role: msg.role, content: msg.content }))
        }));
    }
    const restore = (patch.settings || get().settings).restoreTabs;
    if (restore && Array.isArray(parsed.tabs)) {
      patch.tabs = parsed.tabs.slice(0, 40).filter((tab) => tab.url !== 'vcorv://ai').map((tab) => ({
        ...newTab(isNewTab(tab.url) ? NEW_TAB_URL : normalizeDestination(tab.url), tab.spaceId || '', tab.title || ''),
        id: tab.id || id(), favicon: tab.favicon || ''
      }));
      patch.activeId = patch.tabs.some((tab) => tab.id === parsed.activeId) ? parsed.activeId : patch.tabs[0]?.id || '';
    }
    if (Array.isArray(parsed.spaces) && parsed.spaces.length) {
      patch.spaces = parsed.spaces.filter((space) => space && space.id && space.name).map((space) => ({
        id: space.id, name: String(space.name).slice(0, 24),
        icon: SPACE_ICONS[space.icon] ? space.icon : (LEGACY_ICON_MAP[space.icon] || 'home'),
        color: space.color || SPACE_COLORS[0],
        apps: Array.isArray(space.apps) ? space.apps.filter((app) => app && app.name && safeHttpUrl(app.url)) : [],
        lastActiveTabId: space.lastActiveTabId || ''
      }));
      patch.activeSpaceId = patch.spaces.some((space) => space.id === parsed.activeSpaceId) ? parsed.activeSpaceId : patch.spaces[0]?.id || '';
    }
    set(patch);
    applyThemeSettings(get().settings);
    get().ensureSpaces();
    const s = get();
    const spaceTabs = s.tabs.filter((tab) => tab.spaceId === s.activeSpaceId);
    if (!spaceTabs.length) set({ activeId: '' });
    else if (!spaceTabs.some((tab) => tab.id === s.activeId)) set({ activeId: spaceTabs[0].id });
  },
  ensureSpaces() {
    const s = get();
    let spaces = s.spaces;
    if (!spaces.length) spaces = [{ id: id('space'), name: 'Personal', icon: 'home', color: SPACE_COLORS[0], apps: pickApps(['Gmail', 'Instagram']), lastActiveTabId: '' }];
    let activeSpaceId = spaces.some((space) => space.id === s.activeSpaceId) ? s.activeSpaceId : spaces[0].id;
    const tabs = s.tabs.map((tab) => spaces.some((space) => space.id === tab.spaceId) ? tab : { ...tab, spaceId: activeSpaceId });
    set({ spaces, activeSpaceId, tabs });
  },

  // ---------- toast ----------
  showToast(message) { set((s) => ({ toast: message, toastKey: s.toastKey + 1 })); },

  // ---------- tabs ----------
  createTab(url = NEW_TAB_URL, options = {}) {
    const normalized = isNewTab(url) ? NEW_TAB_URL : normalizeDestination(url);
    const tab = newTab(normalized, options.spaceId || get().activeSpaceId, options.title || '');
    set((s) => {
      const tabs = [...s.tabs];
      if (options.background) { const index = tabs.findIndex((item) => item.id === s.activeId); tabs.splice(index + 1 || tabs.length, 0, tab); return { tabs }; }
      tabs.push(tab); return { tabs, activeId: tab.id, aiOpen: false };
    });
    get().scheduleSave();
    return tab;
  },
  closeTab(tabId) {
    const s = get();
    const index = s.tabs.findIndex((tab) => tab.id === tabId); if (index < 0) return;
    const closed = s.tabs[index];
    const spaceTabsBefore = s.tabs.filter((tab) => tab.spaceId === closed.spaceId);
    const indexInSpace = spaceTabsBefore.findIndex((tab) => tab.id === tabId);
    const tabs = s.tabs.filter((tab) => tab.id !== tabId);
    const closedTabs = isNewTab(closed.url) ? s.closedTabs : [...s.closedTabs, { url: closed.url, title: closed.title, spaceId: closed.spaceId }].slice(-25);
    let activeId = s.activeId;
    if (closed.spaceId === s.activeSpaceId) {
      const spaceTabs = tabs.filter((tab) => tab.spaceId === s.activeSpaceId);
      if (!spaceTabs.length) { set({ tabs, closedTabs, activeId: '' }); get().scheduleSave(); return; }
      if (activeId === tabId) activeId = spaceTabs[Math.min(indexInSpace, spaceTabs.length - 1)].id;
    }
    set({ tabs, closedTabs, activeId });
    get().scheduleSave();
  },
  activateTab(tabId) {
    const s = get(); if (!s.tabs.some((tab) => tab.id === tabId)) return;
    set({ activeId: tabId, spaces: s.spaces.map((space) => space.id === s.activeSpaceId ? { ...space, lastActiveTabId: tabId } : space) });
    get().scheduleSave();
  },
  reopenClosedTab() {
    const s = get();
    const entry = s.closedTabs[s.closedTabs.length - 1];
    if (!entry) return s.showToast('No recently closed tabs');
    set({ closedTabs: s.closedTabs.slice(0, -1) });
    if (entry.spaceId && entry.spaceId !== s.activeSpaceId && s.spaces.some((space) => space.id === entry.spaceId)) get().switchSpace(entry.spaceId);
    get().createTab(entry.url, { title: entry.title });
  },
  moveTab(fromId, toId) {
    set((s) => {
      const from = s.tabs.findIndex((tab) => tab.id === fromId);
      const to = s.tabs.findIndex((tab) => tab.id === toId);
      if (from < 0 || to < 0) return {};
      const tabs = [...s.tabs]; const [moved] = tabs.splice(from, 1); tabs.splice(to, 0, moved);
      return { tabs };
    });
    get().scheduleSave();
  },
  patchTab(tabId, patch) {
    set((s) => ({ tabs: s.tabs.map((tab) => tab.id === tabId ? { ...tab, ...patch } : tab) }));
  },
  navigateActive(value) {
    const url = normalizeDestination(value);
    const s = get();
    const tab = s.tabs.find((item) => item.id === s.activeId);
    if (!tab) { get().createTab(url); return; }
    get().patchTab(tab.id, { url, title: domainLabel(url), favicon: '' });
    set({ aiOpen: false });
    get().scheduleSave();
  },
  recordHistory(url, title) {
    if (!safeHttpUrl(url)) return;
    set((s) => {
      const history = s.history.filter((item) => item.url !== url);
      history.unshift({ url, title: title || domainLabel(url), at: Date.now() });
      return { history: history.slice(0, 500) };
    });
  },

  // ---------- spaces ----------
  switchSpace(spaceId) {
    const s = get();
    if (spaceId === s.activeSpaceId || !s.spaces.some((space) => space.id === spaceId)) return;
    const spaces = s.spaces.map((space) => space.id === s.activeSpaceId ? { ...space, lastActiveTabId: s.activeId } : space);
    const target = spaces.find((space) => space.id === spaceId);
    const spaceTabs = s.tabs.filter((tab) => tab.spaceId === spaceId);
    set({ spaces, activeSpaceId: spaceId });
    if (!spaceTabs.length) { set({ activeId: '' }); get().scheduleSave(); return; }
    set({ activeId: spaceTabs.some((tab) => tab.id === target.lastActiveTabId) ? target.lastActiveTabId : spaceTabs[0].id });
    get().scheduleSave();
  },
  addSpace({ name, icon, color, apps }) {
    const space = { id: id('space'), name: (name || 'New space').slice(0, 24), icon, color, apps: apps.map((app) => ({ ...app })), lastActiveTabId: '' };
    set((s) => ({ spaces: [...s.spaces, space] }));
    get().switchSpace(space.id);
    get().createTab();
    get().showToast(`${space.name} created`);
    get().scheduleSave();
    return space;
  },
  patchSpace(spaceId, patch) {
    set((s) => ({ spaces: s.spaces.map((space) => space.id === spaceId ? { ...space, ...patch } : space) }));
    get().scheduleSave();
  },
  deleteSpace(spaceId) {
    const s = get();
    if (s.spaces.length <= 1) return s.showToast('You need at least one space');
    const tabs = s.tabs.filter((tab) => tab.spaceId !== spaceId);
    const spaces = s.spaces.filter((space) => space.id !== spaceId);
    let { activeSpaceId, activeId } = s;
    if (activeSpaceId === spaceId) {
      activeSpaceId = spaces[0].id;
      const spaceTabs = tabs.filter((tab) => tab.spaceId === activeSpaceId);
      activeId = spaceTabs[0]?.id || '';
    }
    set({ tabs, spaces, activeSpaceId, activeId });
    get().scheduleSave();
  },
  moveSpace(fromIndex, toIndex) {
    set((s) => { const spaces = [...s.spaces]; const [moved] = spaces.splice(fromIndex, 1); spaces.splice(toIndex, 0, moved); return { spaces }; });
    get().scheduleSave();
  },

  // ---------- space apps ----------
  toggleSpaceApp(spaceId, app) {
    const s = get();
    const space = s.spaces.find((item) => item.id === spaceId); if (!space) return;
    const exists = space.apps.some((item) => item.url === app.url);
    const apps = exists ? space.apps.filter((item) => item.url !== app.url) : [...space.apps, { ...app }];
    get().patchSpace(spaceId, { apps });
    s.showToast(exists ? `${app.name} removed` : `${app.name} added`);
  },
  moveSpaceApp(spaceId, fromIndex, toIndex) {
    const space = get().spaces.find((item) => item.id === spaceId); if (!space) return;
    const apps = [...space.apps]; const [moved] = apps.splice(fromIndex, 1); apps.splice(toIndex, 0, moved);
    get().patchSpace(spaceId, { apps });
  },
  openApp(app) {
    const s = get();
    let origin = ''; try { origin = new URL(app.url).origin; } catch { return; }
    const existing = s.tabs.find((tab) => tab.spaceId === s.activeSpaceId && tab.url.startsWith(origin));
    if (existing) get().activateTab(existing.id); else get().createTab(app.url);
  },

  // ---------- bookmarks / shortcuts / downloads ----------
  toggleBookmark() {
    const s = get();
    const tab = s.tabs.find((item) => item.id === s.activeId);
    if (!tab || isNewTab(tab.url)) return s.showToast('Open a webpage to bookmark it');
    const exists = s.bookmarks.some((item) => item.url === tab.url);
    set({ bookmarks: exists ? s.bookmarks.filter((item) => item.url !== tab.url) : [{ title: tab.title || domainLabel(tab.url), url: tab.url }, ...s.bookmarks] });
    s.showToast(exists ? 'Bookmark removed' : 'Bookmarked');
    get().scheduleSave();
  },
  removeBookmark(index) { set((s) => ({ bookmarks: s.bookmarks.filter((_, i) => i !== index) })); get().scheduleSave(); },
  addShortcut(name, url) { set((s) => ({ shortcuts: [...s.shortcuts, { name, url }] })); get().scheduleSave(); },
  removeShortcut(index) { set((s) => ({ shortcuts: s.shortcuts.filter((_, i) => i !== index) })); get().scheduleSave(); },
  upsertDownload(payload) {
    set((s) => {
      const index = s.downloads.findIndex((item) => item.id === payload.id);
      const downloads = [...s.downloads];
      if (index >= 0) downloads[index] = payload; else downloads.push(payload);
      return { downloads };
    });
  },

  // ---------- settings / ui ----------
  patchSettings(patch) { set((s) => ({ settings: { ...s.settings, ...patch } })); get().scheduleSave(); applyThemeSettings(get().settings); },
  toggleSidebar() { get().patchSettings({ sidebarHidden: !get().settings.sidebarHidden }); },
  setAiOpen(open) { set({ aiOpen: open, ...(open ? {} : { aiHistoryOpen: false }) }); },
  setAiHistoryOpen(open) { set({ aiHistoryOpen: open }); },
  setGoogleSignedIn(signedIn) { set({ googleSignedIn: signedIn }); },

  // ---------- AI chats ----------
  newAiChat() { set({ activeAiChatId: '', aiHistoryOpen: false }); },
  openAiChat(chatId) { set({ activeAiChatId: chatId, aiHistoryOpen: false, aiOpen: true }); },
  deleteAiChat(chatId) {
    set((s) => ({
      aiChats: s.aiChats.filter((chat) => chat.id !== chatId),
      activeAiChatId: s.activeAiChatId === chatId ? '' : s.activeAiChatId
    }));
    get().scheduleSave();
  },
  upsertAiChat(chat) {
    set((s) => {
      const index = s.aiChats.findIndex((item) => item.id === chat.id);
      const aiChats = [...s.aiChats];
      if (index >= 0) aiChats[index] = chat; else aiChats.unshift(chat);
      aiChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      return { aiChats };
    });
    get().scheduleSave();
  },
  patchAiMessage(chatId, messageIndex, patch) {
    set((s) => ({
      aiChats: s.aiChats.map((chat) => {
        if (chat.id !== chatId) return chat;
        const messages = chat.messages.map((msg, i) => i === messageIndex ? { ...msg, ...patch } : msg);
        return { ...chat, messages, updatedAt: Date.now() };
      })
    }));
  },
  setAiStreaming(streaming) { set({ aiStreaming: streaming }); }
}));

// Convenience selectors
export const selectSpaceTabs = (s) => s.tabs.filter((tab) => tab.spaceId === s.activeSpaceId);
export const selectActiveTab = (s) => s.tabs.find((tab) => tab.id === s.activeId) || null;
export const selectCurrentSpace = (s) => s.spaces.find((space) => space.id === s.activeSpaceId) || s.spaces[0] || null;
