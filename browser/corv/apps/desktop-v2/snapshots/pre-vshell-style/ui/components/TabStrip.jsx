import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useStore, selectSpaceTabs, selectActiveTab } from '../store.js';
import { useUi } from '../uiBus.js';
import { isNewTab, faviconFor, domainLabel, V_MARK, NEW_TAB_URL, id as makeId } from '../lib/util.js';
import { getView, activeView } from '../lib/webviews.js';
import { SidebarIcon, BackIcon, ForwardIcon, ReloadIcon, StopIcon, PlusIcon, MoreIcon } from './icons.jsx';

const spring = { type: 'spring', stiffness: 550, damping: 45, mass: 0.8 };

function Tab({ tab, active }) {
  const store = useStore.getState;
  const ui = useUi.getState;
  const dragId = useRef(null);

  const onContextMenu = (event) => {
    event.preventDefault();
    const s = store();
    const others = s.tabs.filter((item) => item.spaceId === tab.spaceId && item.id !== tab.id);
    ui().openContextMenu(event.clientX, event.clientY, [
      { label: 'New tab to the right', action: () => {
        const tabs = [...store().tabs];
        const index = tabs.findIndex((item) => item.id === tab.id);
        tabs.splice(index + 1, 0, { id: makeId(), url: NEW_TAB_URL, title: 'New Tab', favicon: '', spaceId: tab.spaceId, loading: false, canGoBack: false, canGoForward: false });
        useStore.setState({ tabs }); store().scheduleSave();
      } },
      { label: 'Reload', action: () => getView(tab.id)?.reload() },
      { label: 'Duplicate', action: () => store().createTab(tab.url, { title: tab.title }) },
      { label: 'Close tab', action: () => store().closeTab(tab.id) },
      { label: `Close other tabs${others.length ? ` (${others.length})` : ''}`, action: () => others.forEach((item) => store().closeTab(item.id)) },
      { label: 'Reopen closed tab', action: () => store().reopenClosedTab() }
    ]);
  };

  return (
    <motion.div
      layout
      transition={spring}
      initial={{ opacity: 0, width: 0, minWidth: 0 }}
      animate={{ opacity: 1, width: 220, minWidth: 104 }}
      exit={{ opacity: 0, width: 0, minWidth: 0, paddingLeft: 0, paddingRight: 0, margin: 0, transition: { duration: 0.14, ease: [0.33, 1, 0.68, 1] } }}
      className={`tab${active ? ' active' : ''}`}
      role="tab"
      aria-selected={active}
      title={tab.title}
      draggable
      onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/vcorv-tab', tab.id); }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); const fromId = event.dataTransfer.getData('text/vcorv-tab'); if (fromId && fromId !== tab.id) store().moveTab(fromId, tab.id); }}
      onClick={() => store().activateTab(tab.id)}
      onAuxClick={(event) => { if (event.button === 1) { event.preventDefault(); store().closeTab(tab.id); } }}
      onContextMenu={onContextMenu}
    >
      <span className="tab-divider" />
      <img className="tab-favicon" src={tab.favicon || (isNewTab(tab.url) ? V_MARK : faviconFor(tab.url))} alt="" />
      <span className="tab-title">{tab.title || domainLabel(tab.url)}</span>
      <span className="tab-close" aria-label="Close tab" onClick={(event) => { event.stopPropagation(); store().closeTab(tab.id); }}>×</span>
    </motion.div>
  );
}

export default function TabStrip() {
  const tabs = useStore(useShallow(selectSpaceTabs));
  const activeId = useStore((s) => s.activeId);
  const activeTab = useStore(selectActiveTab);
  const loading = Boolean(activeTab?.loading);
  const store = useStore.getState;
  const ui = useUi.getState;

  return (
    <header className="tab-strip" aria-label="Tab strip" onDoubleClick={(event) => { if (event.target.closest('button, .tab')) return; window.vcorv?.windowControl?.('maximize'); }}>
      <button type="button" aria-label="Toggle sidebar" title="Hide or show sidebar" onClick={() => store().toggleSidebar()}>
        <SidebarIcon />
      </button>
      <div className="navigation-controls" aria-label="Navigation">
        <button type="button" aria-label="Back" title="Back" disabled={!activeTab?.canGoBack} onClick={() => activeView()?.goBack()}><BackIcon /></button>
        <button type="button" aria-label="Forward" title="Forward" disabled={!activeTab?.canGoForward} onClick={() => activeView()?.goForward()}><ForwardIcon /></button>
        <button type="button" aria-label={loading ? 'Stop' : 'Reload'} title={loading ? 'Stop loading' : 'Reload'} onClick={() => { const view = activeView(); if (!view) return; if (loading) view.stop(); else view.reload(); }}>
          {loading ? <StopIcon className="stop-icon" /> : <ReloadIcon className="reload-icon" />}
        </button>
      </div>
      <div className="tab-zone">
        <div className="tabs" role="tablist" aria-label="Open tabs">
          <AnimatePresence initial={false}>
            {tabs.map((tab) => <Tab key={tab.id} tab={tab} active={tab.id === activeId} />)}
          </AnimatePresence>
        </div>
        <motion.button layout transition={spring} whileTap={{ scale: 0.9 }} className="new-tab-button" type="button" aria-label="New tab" title="New tab (⌘T)" onClick={() => store().createTab()}>
          <PlusIcon />
        </motion.button>
      </div>
      <button type="button" aria-label="Browser menu" title="Menu" data-popover-trigger onClick={() => ui().setPopover('menu')}>
        <MoreIcon />
      </button>
      {window.vcorv?.platform && window.vcorv.platform !== 'darwin' && (
        <div className="window-controls" aria-label="Window controls">
          <button type="button" aria-label="Minimize" onClick={() => window.vcorv?.windowControl?.('minimize')}>−</button>
          <button type="button" aria-label="Maximize" onClick={() => window.vcorv?.windowControl?.('maximize')}><span className="maximize-icon" /></button>
          <button type="button" aria-label="Close" onClick={() => window.vcorv?.windowControl?.('close')}>×</button>
        </div>
      )}
    </header>
  );
}
