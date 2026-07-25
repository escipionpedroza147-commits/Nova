// Customize VCorv — the single control center sheet (vshell v7 design).
// Sections: Appearance / Layout / Spaces / Corv AI. Slides in from the right.
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store.js';
import { useUi } from '../uiBus.js';
import { SPACE_COLORS } from '../lib/catalog.js';
import { SpaceIcon, PlusIcon, SparkleIcon } from './icons.jsx';

const ACCENTS = ['#8f8fd8', '#6f9df1', '#8bd17c', '#e6a23c', '#d67ab1', '#5fc9c2'];
const THEMES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'midnight', label: 'Midnight' }
];

function Toggle({ checked, onChange, label, sub }) {
  return (
    <label className="cz-toggle">
      <span className="cz-toggle-text"><strong>{label}</strong>{sub && <small>{sub}</small>}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="cz-switch" aria-hidden="true"><i /></span>
    </label>
  );
}

export default function CustomizeSheet() {
  const open = useUi((s) => s.customizeOpen);
  const settings = useStore((s) => s.settings);
  const spaces = useStore((s) => s.spaces);
  const activeSpaceId = useStore((s) => s.activeSpaceId);
  const store = useStore.getState;
  const ui = useUi.getState;
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    if (!open) return;
    window.vcorv?.aiStatus?.().then(setAiStatus).catch(() => {});
  }, [open]);

  const patch = (partial) => store().patchSettings(partial);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="cz-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => ui().setCustomizeOpen(false)} />
          <motion.aside
            className="cz-sheet"
            initial={{ x: 380, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            aria-label="Customize VCorv"
          >
            <header className="cz-head">
              <strong>Customize VCorv</strong>
              <button type="button" aria-label="Close" onClick={() => ui().setCustomizeOpen(false)}>×</button>
            </header>

            <div className="cz-body">
              <section className="cz-section">
                <h3>Appearance</h3>
                <div className="cz-theme-row">
                  {THEMES.map((theme) => (
                    <button key={theme.id} type="button" className={`cz-theme${(settings.theme || 'dark') === theme.id ? ' active' : ''} cz-theme-${theme.id}`} onClick={() => patch({ theme: theme.id })}>
                      <span className="cz-theme-swatch" /><span>{theme.label}</span>
                    </button>
                  ))}
                </div>
                <div className="cz-accent-row">
                  {ACCENTS.map((color) => (
                    <button key={color} type="button" className={`cz-accent${(settings.accent || ACCENTS[0]) === color ? ' active' : ''}`} style={{ '--sw': color }} aria-label={`Accent ${color}`} onClick={() => patch({ accent: color })} />
                  ))}
                </div>
              </section>

              <section className="cz-section">
                <h3>Layout</h3>
                <Toggle label="Sidebar" sub="Spaces, apps, and threads panel (⌘B)" checked={!settings.sidebarHidden} onChange={(on) => patch({ sidebarHidden: !on })} />
                <Toggle label="Apps in sidebar" checked={settings.sidebarApps !== false} onChange={(on) => patch({ sidebarApps: on })} />
                <Toggle label="AI threads in sidebar" checked={settings.sidebarThreads !== false} onChange={(on) => patch({ sidebarThreads: on })} />
                <Toggle label="Workspace memory card" checked={settings.sidebarMemory !== false} onChange={(on) => patch({ sidebarMemory: on })} />
                <Toggle label="Show shortcuts on new tab" checked={settings.showShortcuts !== false} onChange={(on) => patch({ showShortcuts: on })} />
              </section>

              <section className="cz-section">
                <h3>Spaces</h3>
                <div className="cz-spaces">
                  {spaces.map((space) => (
                    <button key={space.id} type="button" className={`cz-space${space.id === activeSpaceId ? ' active' : ''}`} onClick={() => store().switchSpace(space.id)}>
                      <span className="cz-space-icon" style={{ color: space.color }}><SpaceIcon icon={space.icon} /></span>
                      <span>{space.name}</span>
                    </button>
                  ))}
                  <button type="button" className="cz-space cz-space-add" onClick={() => { ui().setCustomizeOpen(false); ui().openSpaceModal(); }}>
                    <PlusIcon /><span>New space</span>
                  </button>
                </div>
              </section>

              <section className="cz-section">
                <h3>Corv AI</h3>
                <div className="cz-ai-status">
                  <SparkleIcon />
                  <div>
                    <strong>{aiStatus?.localReady ? `Local model ready · ${aiStatus.localModel}` : aiStatus?.cloud ? 'Cloud model connected' : 'No model connected'}</strong>
                    <small>{aiStatus?.localReady ? 'Private — runs on this Mac' : aiStatus?.cloud ? 'Using your API key' : 'Install Ollama or add a key in Settings'}</small>
                  </div>
                  <span className={`cz-ai-dot${aiStatus?.localReady || aiStatus?.cloud ? ' on' : ''}`} />
                </div>
                <Toggle label="Ask Corv in address bar" sub="Chip inside the omnibox" checked={settings.omniboxAi !== false} onChange={(on) => patch({ omniboxAi: on })} />
                <Toggle label="Continue pill" sub="Resume last session from the new tab page" checked={settings.continuePill !== false} onChange={(on) => patch({ continuePill: on })} />
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
