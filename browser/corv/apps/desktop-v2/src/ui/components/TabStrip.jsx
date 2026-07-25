import React from 'react';
import { useStore, NEW_TAB, AI_TAB } from '../store.js';
import { X, Plus, VCMark, Minus, Square, Sparkles } from './icons.jsx';

function Favicon({ tab }) {
  if (tab.url === AI_TAB) return <span className="tabAiIcon"><Sparkles size={13} /></span>;
  if (tab.url === NEW_TAB || !tab.favicon) return <VCMark size={14} />;
  return <img className="tabFavicon" src={tab.favicon} alt="" onError={(e) => { e.target.style.display = 'none'; }} />;
}

export default function TabStrip({ railHidden }) {
  const allTabs = useStore((s) => s.tabs);
  const activeSpace = useStore((s) => s.activeSpace);
  const tabs = allTabs.filter((t) => t.spaceId === activeSpace);
  const activeId = useStore((s) => s.activeId);
  const activate = useStore((s) => s.activate);
  const closeTab = useStore((s) => s.closeTab);
  const newTab = useStore((s) => s.newTab);
  const isMac = window.vcorv?.platform === 'darwin';

  return (
    <div className="tabStrip dragRegion">
      {isMac && <div className={`macLights ${railHidden ? 'wide' : ''}`} />}
      <div className="tabs noDrag">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeId ? 'active' : ''}`}
            onClick={() => activate(tab.id)}
            onAuxClick={(e) => { if (e.button === 1) closeTab(tab.id); }}
            title={tab.title}
          >
            <span className="tabIcon">{tab.loading ? <span className="tabSpinner" /> : <Favicon tab={tab} />}</span>
            <span className="tabTitle">{tab.url === NEW_TAB ? 'New Tab' : (tab.title || 'Loading…')}</span>
            <button className="tabClose" onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}>
              <X size={12} />
            </button>
          </div>
        ))}
        <button className="tabNew" onClick={() => newTab()} title="New tab">
          <Plus size={15} />
        </button>
      </div>
      {!isMac && (
        <div className="winControls noDrag">
          <button onClick={() => window.vcorv?.windowControl('minimize')}><Minus size={14} /></button>
          <button onClick={() => window.vcorv?.windowControl('maximize')}><Square size={12} /></button>
          <button className="winClose" onClick={() => window.vcorv?.windowControl('close')}><X size={14} /></button>
        </div>
      )}
    </div>
  );
}
