import React, { useEffect, useRef } from 'react';
import { useStore, selectActiveTab } from './store.js';
import { useUi } from './uiBus.js';
import { isNewTab, safeHttpUrl } from './lib/util.js';
import { syncWebviews, setLayer, activeView, onWebviewContextMenu } from './lib/webviews.js';
import TabStrip from './components/TabStrip.jsx';
import Toolbar from './components/Toolbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import NewTabPage from './components/NewTabPage.jsx';
import AiPage from './components/AiPage.jsx';
import FindBar from './components/FindBar.jsx';
import Overlays from './components/Overlays.jsx';
import CustomizeSheet from './components/CustomizeSheet.jsx';

function EmptyTabsState() {
  const store = useStore.getState;
  return (
    <div className="empty-tabs" role="note">
      <div className="empty-tabs-title">No tabs open</div>
      <div className="empty-tabs-sub">Open a new tab to start browsing</div>
      <button type="button" className="empty-tabs-button" onClick={() => store().createTab()}>New tab <span className="empty-tabs-kbd">⌘T</span></button>
    </div>
  );
}

export default function App() {
  const booted = useRef(false);
  const settings = useStore((s) => s.settings);
  const aiOpen = useStore((s) => s.aiOpen);
  const activeTab = useStore(selectActiveTab);
  const hasTabs = useStore((s) => s.tabs.some((tab) => tab.spaceId === s.activeSpaceId));
  const isHome = hasTabs && (!activeTab || isNewTab(activeTab.url));
  const layerRef = useRef(null);

  // Boot once
  useEffect(() => {
    if (booted.current) return; booted.current = true;
    setLayer(layerRef.current);
    useStore.getState().boot();
    const store = useStore.getState;
    window.vcorv?.onBrowserNewTab?.((payload) => {
      if (payload?.url === 'vcorv://ai') store().setAiOpen(true);
      else if (safeHttpUrl(payload?.url)) store().createTab(payload.url);
    });
    window.vcorv?.onAiHistory?.(() => { store().setAiOpen(true); store().setAiHistoryOpen(true); });
    window.vcorv?.onDownloadUpdated?.((payload) => {
      store().upsertDownload(payload);
      if (payload.state === 'completed') store().showToast(`${payload.filename} downloaded`);
    });
    window.vcorv?.onGoogleAccountChanged?.(async () => {
      const status = await window.vcorv?.googleAccountStatus?.().catch(() => null);
      store().setGoogleSignedIn(Boolean(status?.signedIn));
    });
    window.vcorv?.googleAccountStatus?.().then((status) => store().setGoogleSignedIn(Boolean(status?.signedIn))).catch(() => {});
  }, []);

  // Webviews reconcile imperatively on every store change (cheap; bails fast)
  useEffect(() => useStore.subscribe(() => syncWebviews()), []);

  // Global keyboard shortcuts
  useEffect(() => {
    const smoke = new URLSearchParams(window.location.search).get('smoke-popover');
    if (smoke) setTimeout(() => useUi.getState().setPopover(smoke), 400);
    if (new URLSearchParams(window.location.search).get('smoke-customize')) setTimeout(() => useUi.getState().setCustomizeOpen(true), 400);
  }, []);

  useEffect(() => {
    onWebviewContextMenu((x, y, items) => useUi.getState().openContextMenu(x, y, items.filter((i) => i.type !== 'separator')));
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      const s = useStore.getState(); const ui = useUi.getState();
      const mod = event.metaKey || event.ctrlKey; const key = event.key.toLowerCase();
      if (mod && key === 'l') { event.preventDefault(); s.setAiOpen(false); document.getElementById('omniboxInput')?.focus(); document.getElementById('omniboxInput')?.select(); }
      else if (mod && event.shiftKey && key === 't') { event.preventDefault(); s.reopenClosedTab(); }
      else if (mod && key === 't') { event.preventDefault(); s.createTab(); }
      else if (mod && key === 'w') { event.preventDefault(); if (s.aiOpen) s.setAiOpen(false); else if (s.activeId) s.closeTab(s.activeId); }
      else if (mod && key === 'r') { event.preventDefault(); const view = activeView(); const tab = s.tabs.find((t) => t.id === s.activeId); if (view) { if (tab?.loading) view.stop(); else view.reload(); } }
      else if (mod && key === 'f') { event.preventDefault(); if (activeView()) ui.setFindOpen(true); else s.showToast('Open a webpage to use Find'); }
      else if (mod && key === 'd') { event.preventDefault(); s.toggleBookmark(); }
      else if (mod && key === 'b') { event.preventDefault(); s.toggleSidebar(); }
      else if (mod && (key === '=' || key === '+')) { event.preventDefault(); const v = activeView(); if (v) v.setZoomLevel(Math.min((v.getZoomLevel?.() ?? 0) + 0.5, 5)); }
      else if (mod && key === '-') { event.preventDefault(); const v = activeView(); if (v) v.setZoomLevel(Math.max((v.getZoomLevel?.() ?? 0) - 0.5, -5)); }
      else if (mod && key === '0') { event.preventDefault(); activeView()?.setZoomLevel(0); }
      else if (mod && key >= '1' && key <= '9') { event.preventDefault(); const list = s.tabs.filter((t) => t.spaceId === s.activeSpaceId); const idx = key === '9' ? list.length - 1 : Number(key) - 1; if (list[idx]) s.activateTab(list[idx].id); }
      else if (event.key === 'Escape') {
        if (ui.dialog) return ui.settleDialog(null);
        if (ui.customizeOpen) return ui.setCustomizeOpen(false);
        if (ui.spaceModalOpen) return ui.closeSpaceModal();
        if (ui.appPickerOpen) return ui.closeAppPicker();
        if (ui.contextMenu) return ui.closeContextMenu();
        if (ui.findOpen) return ui.setFindOpen(false);
        ui.closePopovers();
        if (s.aiHistoryOpen) s.setAiHistoryOpen(false);
        else if (s.aiOpen) s.setAiOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close menus/popovers on outside click
  useEffect(() => {
    const onClick = (event) => {
      const ui = useUi.getState();
      if (ui.contextMenu && !event.target.closest('.context-menu')) ui.closeContextMenu();
      if (ui.popover && !event.target.closest('.popover, [data-popover-trigger]')) ui.closePopovers();
      if (ui.appPickerOpen && !event.target.closest('.app-picker-card, [data-app-picker-trigger]')) ui.closeAppPicker();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className={`vshell${settings.sidebarHidden ? ' sidebar-hidden' : ''}${aiOpen ? ' ai-view' : ''}`}>
      <TabStrip />
      <Toolbar />
      <div className="body-row">
        <Sidebar />
        <section className="browser-stage">
          {!hasTabs && !aiOpen && <EmptyTabsState />}
          {isHome && !aiOpen && <NewTabPage />}
          {aiOpen && <AiPage />}
          <section className="webview-layer" ref={layerRef} aria-label="Web pages" />
          <FindBar />
        </section>
      </div>
      <Overlays />
      <CustomizeSheet />
    </div>
  );
}
