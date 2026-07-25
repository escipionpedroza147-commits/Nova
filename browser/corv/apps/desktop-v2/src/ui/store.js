import { create } from 'zustand';

let idSeq = 0;
const newId = (p = 'tab') => `${p}-${Date.now()}-${idSeq++}`;

export const NEW_TAB = 'vcorv://newtab';
export const AI_TAB = 'vcorv://ai';
export const isInternal = (url) => String(url || '').startsWith('vcorv://');

export const DEFAULT_SPACES = [
  { id: 'home', icon: 'home', color: '#4d9fff', label: 'Home' },
  { id: 'work', icon: 'briefcase', color: '#4d9fff', label: 'Work' },
  { id: 'school', icon: 'grad', color: '#4d9fff', label: 'School' },
  { id: 'projects', icon: 'folder', color: '#4d9fff', label: 'Projects' },
];

export function normalizeInput(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  if (/^(v?corv):\/\/ai\/?$/i.test(text)) return AI_TAB;
  if (/^(v?corv):\/\/(newtab)?\/?$/i.test(text)) return NEW_TAB;
  if (/^https?:\/\//i.test(text)) return text;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text)) return `https://${text}`;
  return `https://www.google.com/search?q=${encodeURIComponent(text)}`;
}

export const isSearchQuery = (raw) => {
  const text = String(raw || '').trim();
  return text && !/^https?:\/\//i.test(text) && !/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text);
};

const makeTab = (url = NEW_TAB, spaceId = 'home') => ({
  id: newId(),
  url,
  spaceId,
  title: url === NEW_TAB ? 'New Tab' : url === AI_TAB ? 'Corv AI' : url,
  favicon: '',
  loading: false,
  canGoBack: false,
  canGoForward: false,
});

export const useStore = create((set, get) => ({
  spaces: DEFAULT_SPACES,
  activeSpace: 'home',
  tabs: [makeTab()],
  activeId: null,
  recentSearches: [],
  visited: [],
  customApps: [], // { label, url } pinned from Add Apps
  aiChats: [], // { id, title, messages: [{role, content}], time }
  hydrated: false,

  hydrate: async () => {
    try {
      const saved = await window.vcorv?.loadBrowserState?.();
      if (saved?.v7) {
        const spaces = saved.spaces?.length ? saved.spaces : DEFAULT_SPACES;
        const tabs = (saved.tabs || []).map((t) => ({
          ...makeTab(t.url || NEW_TAB, spaces.some((s) => s.id === t.spaceId) ? t.spaceId : spaces[0].id),
          title: t.title || 'New Tab',
          favicon: t.favicon || '',
        }));
        const activeSpace = spaces.some((s) => s.id === saved.activeSpace) ? saved.activeSpace : spaces[0].id;
        const spaceTabs = tabs.filter((t) => t.spaceId === activeSpace);
        set({
          spaces,
          activeSpace,
          tabs: tabs.length ? tabs : [makeTab(NEW_TAB, activeSpace)],
          activeId: (spaceTabs[Math.min(saved.activeIndex || 0, Math.max(0, spaceTabs.length - 1))] || spaceTabs[0] || tabs[0])?.id || null,
          recentSearches: saved.recentSearches || [],
          visited: saved.visited || [],
          customApps: saved.customApps || [],
          aiChats: saved.aiChats || [],
          hydrated: true,
        });
        get().ensureSpaceTab();
        return;
      }
    } catch { /* fresh start */ }
    set((s) => ({ hydrated: true, activeId: s.tabs[0]?.id || null }));
  },

  persist: () => {
    const { tabs, activeId, recentSearches, visited, spaces, activeSpace, customApps, aiChats } = get();
    const spaceTabs = tabs.filter((t) => t.spaceId === activeSpace);
    window.vcorv?.saveBrowserState?.({
      v7: true,
      spaces,
      activeSpace,
      customApps,
      aiChats: aiChats.slice(0, 20).map((c) => ({ ...c, messages: c.messages.slice(-40) })),
      tabs: tabs.map(({ url, title, favicon, spaceId }) => ({ url, title, favicon, spaceId })),
      activeIndex: Math.max(0, spaceTabs.findIndex((t) => t.id === activeId)),
      recentSearches: recentSearches.slice(0, 8),
      visited: visited.slice(0, 10),
    });
  },

  ensureSpaceTab: () => {
    const { tabs, activeSpace, activeId } = get();
    const spaceTabs = tabs.filter((t) => t.spaceId === activeSpace);
    if (!spaceTabs.length) {
      const tab = makeTab(NEW_TAB, activeSpace);
      set((s) => ({ tabs: [...s.tabs, tab], activeId: tab.id }));
    } else if (!spaceTabs.some((t) => t.id === activeId)) {
      set({ activeId: spaceTabs[spaceTabs.length - 1].id });
    }
  },

  setSpace: (spaceId) => {
    set({ activeSpace: spaceId });
    get().ensureSpaceTab();
    get().persist();
  },

  addSpace: ({ label, color, icon }) => {
    const id = newId('space');
    const space = { id, label: label.slice(0, 24) || 'Workspace', color, icon };
    set((s) => ({ spaces: [...s.spaces, space] }));
    get().setSpace(id);
    return id;
  },

  removeSpace: (spaceId) => {
    const { spaces } = get();
    if (spaces.length <= 1) return;
    set((s) => {
      const remaining = s.spaces.filter((sp) => sp.id !== spaceId);
      const tabs = s.tabs.filter((t) => t.spaceId !== spaceId);
      const activeSpace = s.activeSpace === spaceId ? remaining[0].id : s.activeSpace;
      return { spaces: remaining, tabs, activeSpace };
    });
    get().ensureSpaceTab();
    get().persist();
  },

  addCustomApp: ({ label, url }) => {
    set((s) => ({
      customApps: s.customApps.some((a) => a.url === url) ? s.customApps : [...s.customApps, { label, url }],
    }));
    get().persist();
  },
  removeCustomApp: (url) => {
    set((s) => ({ customApps: s.customApps.filter((a) => a.url !== url) }));
    get().persist();
  },

  newTab: (url = NEW_TAB) => {
    const tab = makeTab(url, get().activeSpace);
    set((s) => ({ tabs: [...s.tabs, tab], activeId: tab.id }));
    get().persist();
    return tab.id;
  },

  closeTab: (id) => {
    set((s) => {
      const spaceTabs = s.tabs.filter((t) => t.spaceId === s.activeSpace);
      const idx = spaceTabs.findIndex((t) => t.id === id);
      const tabs = s.tabs.filter((t) => t.id !== id);
      const remaining = tabs.filter((t) => t.spaceId === s.activeSpace);
      if (!remaining.length) {
        const tab = makeTab(NEW_TAB, s.activeSpace);
        return { tabs: [...tabs, tab], activeId: tab.id };
      }
      const activeId = s.activeId === id ? (remaining[Math.max(0, idx - 1)] || remaining[0]).id : s.activeId;
      return { tabs, activeId };
    });
    get().persist();
  },

  activate: (id) => { set({ activeId: id }); get().persist(); },

  navigate: (id, rawInput) => {
    const url = normalizeInput(rawInput);
    if (!url) return;
    if (isInternal(url)) {
      set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, url, title: url === AI_TAB ? 'Corv AI' : 'New Tab', favicon: '', loading: false } : t)) }));
      get().persist();
      return;
    }
    if (isSearchQuery(rawInput)) get().addSearch(String(rawInput).trim());
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, url, title: url, loading: true } : t)) }));
    get().persist();
  },

  openAiTab: () => {
    const { tabs, activeSpace } = get();
    const existing = tabs.find((t) => t.spaceId === activeSpace && t.url === AI_TAB);
    if (existing) { set({ activeId: existing.id }); get().persist(); return existing.id; }
    return get().newTab(AI_TAB);
  },

  upsertAiChat: (chat) => {
    set((s) => ({
      aiChats: [chat, ...s.aiChats.filter((c) => c.id !== chat.id)].slice(0, 20),
    }));
    get().persist();
  },
  removeAiChat: (id) => {
    set((s) => ({ aiChats: s.aiChats.filter((c) => c.id !== id) }));
    get().persist();
  },

  updateTab: (id, patch) => {
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
    if (patch.title || patch.favicon) {
      const tab = get().tabs.find((t) => t.id === id);
      if (tab && tab.url !== NEW_TAB && tab.title && !tab.loading) get().recordVisit(tab);
      get().persist();
    }
  },

  recordVisit: (tab) => {
    if (!tab.url || isInternal(tab.url)) return;
    set((s) => ({
      visited: [
        { url: tab.url, title: tab.title, favicon: tab.favicon },
        ...s.visited.filter((v) => v.url !== tab.url),
      ].slice(0, 10),
    }));
  },

  addSearch: (query) => {
    set((s) => ({ recentSearches: [query, ...s.recentSearches.filter((q) => q !== query)].slice(0, 8) }));
  },
  removeSearch: (query) => {
    set((s) => ({ recentSearches: s.recentSearches.filter((q) => q !== query) }));
    get().persist();
  },
  clearSearches: () => { set({ recentSearches: [] }); get().persist(); },
}));
