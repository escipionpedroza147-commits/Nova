import React from 'react';
import { VCMark, Plus, User, Sparkles } from './icons.jsx';
import { SPACE_ICONS } from './AddModal.jsx';
import { useStore, AI_TAB } from '../store.js';

export default function Sidebar({ onAdd }) {
  const spaces = useStore((s) => s.spaces);
  const activeSpace = useStore((s) => s.activeSpace);
  const setSpace = useStore((s) => s.setSpace);
  const removeSpace = useStore((s) => s.removeSpace);
  const openAiTab = useStore((s) => s.openAiTab);
  const tabs = useStore((s) => s.tabs);
  const activeId = useStore((s) => s.activeId);
  const aiActive = tabs.find((t) => t.id === activeId)?.url === AI_TAB;

  return (
    <aside className="rail dragRegion">
      <div className="railLogo noDrag">
        <VCMark size={26} />
      </div>
      <nav className="railNav noDrag">
        <button
          className={`railBtn ai ${aiActive ? 'active' : ''}`}
          title="Corv AI"
          onClick={openAiTab}
        >
          <Sparkles size={17} />
        </button>
        <div className="railDivider" />
        {spaces.map(({ id, icon, color, label }) => {
          const Icon = SPACE_ICONS[icon] || SPACE_ICONS.folder;
          const active = activeSpace === id;
          return (
            <button
              key={id}
              className={`railBtn ${active ? 'active' : ''}`}
              title={label}
              style={active ? { color, borderColor: `${color}88`, background: `${color}14` } : undefined}
              onClick={() => setSpace(id)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (spaces.length > 1 && window.confirm(`Delete workspace “${label}”? Its tabs will close.`)) {
                  removeSpace(id);
                }
              }}
            >
              <Icon size={17} />
            </button>
          );
        })}
        <div className="railDivider" />
        <button className="railBtn" title="New workspace / apps" onClick={onAdd}>
          <Plus size={17} />
        </button>
      </nav>
      <div className="railBottom noDrag">
        <button className="railBtn profile" title="Profile">
          <User size={17} />
        </button>
      </div>
    </aside>
  );
}
