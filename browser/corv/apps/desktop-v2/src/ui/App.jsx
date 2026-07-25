import React, { useEffect, useRef, useState } from 'react';
import { useStore, NEW_TAB, AI_TAB } from './store.js';
import Sidebar from './components/Sidebar.jsx';
import TabStrip from './components/TabStrip.jsx';
import Toolbar from './components/Toolbar.jsx';
import NewTabPage from './components/NewTabPage.jsx';
import AddModal from './components/AddModal.jsx';
import AiPage from './components/AiPage.jsx';
import { mountContainer, initWebviewSync } from './lib/webviews.js';

export default function App() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s.hydrated);
  const tabs = useStore((s) => s.tabs);
  const activeId = useStore((s) => s.activeId);
  const newTab = useStore((s) => s.newTab);
  const closeTab = useStore((s) => s.closeTab);
  const [showAdd, setShowAdd] = useState(false);
  const [railHidden, setRailHidden] = useState(false);
  const webRef = useRef(null);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated || !webRef.current) return;
    mountContainer(webRef.current);
    const unsub = initWebviewSync();
    return unsub;
  }, [hydrated]);

  // external new-tab requests (window.open, smoke tests)
  useEffect(() => window.vcorv?.onBrowserNewTab?.(({ url }) => url && newTab(url)), [newTab]);

  // shortcuts: cmd+t new tab, cmd+w close tab
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 't') { e.preventDefault(); newTab(); }
      if (e.key === 'w') { e.preventDefault(); const id = useStore.getState().activeId; if (id) closeTab(id); }
      if (e.shiftKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); setRailHidden((h) => !h); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [newTab, closeTab]);

  const activeTab = tabs.find((t) => t.id === activeId);
  const showNtp = activeTab?.url === NEW_TAB;
  const showAi = activeTab?.url === AI_TAB;

  if (!hydrated) return <div className="app" />;

  return (
    <div className="app">
      {!railHidden && <Sidebar onAdd={() => setShowAdd(true)} />}
      <div className="main">
        <TabStrip railHidden={railHidden} />
        <Toolbar railHidden={railHidden} onToggleRail={() => setRailHidden((h) => !h)} />
        <div className="content">
          <div ref={webRef} className="webviewHost" style={{ display: showNtp || showAi ? 'none' : 'flex' }} />
          {showNtp && <NewTabPage tabId={activeTab.id} key={activeTab.id} onAdd={() => setShowAdd(true)} />}
          {showAi && <AiPage key={activeTab.id} />}
        </div>
      </div>
      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
