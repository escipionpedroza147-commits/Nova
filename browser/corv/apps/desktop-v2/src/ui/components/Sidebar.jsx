import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, selectCurrentSpace } from '../store.js';
import { useUi } from '../uiBus.js';
import { faviconFor } from '../lib/util.js';
import { SpaceIcon, SparkleIcon, BrainIcon, PlusIcon } from './icons.jsx';

const spring = { type: 'spring', stiffness: 500, damping: 40, mass: 0.8 };

function SpaceRow({ space, index, active }) {
  const store = useStore.getState;
  const ui = useUi.getState;
  const tabCount = useStore((s) => s.tabs.filter((t) => t.spaceId === space.id).length);

  const onContextMenu = (event) => {
    event.preventDefault();
    ui().openContextMenu(event.clientX, event.clientY, [
      { label: 'Rename…', action: async () => {
        const result = await ui().openDialog({ title: 'Rename space', fields: [{ name: 'name', label: 'Name', value: space.name }], confirmLabel: 'Save' });
        if (result?.name?.trim()) store().patchSpace(space.id, { name: result.name.trim().slice(0, 24) });
      } },
      { type: 'icons', action: (icon) => store().patchSpace(space.id, { icon }) },
      { type: 'colors', action: (color) => store().patchSpace(space.id, { color }) },
      { label: 'New tab here', action: () => { store().switchSpace(space.id); store().createTab(); } },
      { label: 'Delete space', danger: true, action: async () => {
        if (useStore.getState().spaces.length <= 1) return store().showToast('You need at least one space');
        const confirmed = await ui().openDialog({ title: `Delete “${space.name}”?`, subtitle: 'Its tabs will close. This can’t be undone.', confirmLabel: 'Delete space', danger: true });
        if (confirmed) store().deleteSpace(space.id);
      } }
    ]);
  };

  return (
    <motion.button
      layout
      transition={spring}
      whileTap={{ scale: 0.97 }}
      className={`sb-item sb-space${active ? ' active' : ''}`}
      title={space.name}
      draggable
      onDragStart={(event) => event.dataTransfer.setData('text/vcorv-space', String(index))}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData('text/vcorv-space')); if (!Number.isNaN(from) && from !== index) store().moveSpace(from, index); }}
      onClick={() => store().switchSpace(space.id)}
      onContextMenu={onContextMenu}
    >
      <span className="sb-space-icon" style={{ color: space.color }}><SpaceIcon icon={space.icon} /></span>
      <span className="sb-item-label">{space.name}</span>
      {tabCount > 0 && <span className="sb-count">{tabCount}</span>}
    </motion.button>
  );
}

export default function Sidebar() {
  const spaces = useStore((s) => s.spaces);
  const activeSpaceId = useStore((s) => s.activeSpaceId);
  const space = useStore(selectCurrentSpace);
  const settings = useStore((s) => s.settings);
  const aiChats = useStore((s) => s.aiChats);
  const [aiReady, setAiReady] = useState(false);
  useEffect(() => {
    let alive = true;
    window.vcorv?.aiStatus?.().then((status) => { if (alive) setAiReady(Boolean(status?.localReady || status?.cloud)); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const store = useStore.getState;
  const ui = useUi.getState;

  const threads = aiChats.slice(0, 4);

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <div className="sb-section">
        <div className="sb-label">SPACES <button type="button" className="sb-label-plus" aria-label="New space" onClick={() => ui().openSpaceModal()}><PlusIcon /></button></div>
        <AnimatePresence initial={false}>
          {spaces.map((item, index) => <SpaceRow key={item.id} space={item} index={index} active={item.id === activeSpaceId} />)}
        </AnimatePresence>
      </div>

      {settings.sidebarApps !== false && (
        <div className="sb-section">
          <div className="sb-label">APPS <button type="button" className="sb-label-plus" aria-label="Add app" data-app-picker-trigger onClick={() => ui().openAppPicker('space')}><PlusIcon /></button></div>
          <AnimatePresence initial={false}>
            {(space?.apps || []).map((app, index) => (
              <motion.button
                layout
                transition={spring}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                whileTap={{ scale: 0.97 }}
                key={app.url}
                className="sb-item sb-app"
                title={app.name}
                draggable
                onDragStart={(event) => event.dataTransfer.setData('text/vcorv-app', String(index))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData('text/vcorv-app')); if (!Number.isNaN(from) && from !== index) store().moveSpaceApp(space.id, from, index); }}
                onClick={() => store().openApp(app)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  ui().openContextMenu(event.clientX, event.clientY, [
                    { label: `Open ${app.name}`, action: () => store().openApp(app) },
                    { label: 'Open in new tab', action: () => store().createTab(app.url) },
                    { label: 'Remove from space', danger: true, action: () => store().patchSpace(space.id, { apps: space.apps.filter((item) => item.url !== app.url) }) }
                  ]);
                }}
              >
                <img className="sb-app-icon" src={faviconFor(app.url)} alt="" loading="lazy" />
                <span className="sb-item-label">{app.name}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {settings.sidebarThreads !== false && threads.length > 0 && (
        <div className="sb-section">
          <div className="sb-label">THREADS</div>
          {threads.map((chat) => (
            <button key={chat.id} type="button" className="sb-item sb-thread" title={chat.title || 'AI thread'}
              onClick={() => store().openAiChat(chat.id)}>
              <span className="sb-thread-icon"><SparkleIcon /></span>
              <span className="sb-item-label">{chat.title || 'New thread'}</span>
            </button>
          ))}
        </div>
      )}

      <div className="sb-spacer" />

      {settings.sidebarMemory !== false && (
        <div className="sb-memory-card">
          <div className="sb-memory-head"><BrainIcon /> Workspace memory</div>
          <div className="sb-memory-body">Corv remembers tabs, threads, and context per space — on this Mac.</div>
          <div className="sb-ai-status">
            <span className={`sb-ai-dot${aiReady ? ' on' : ''}`} />
            {aiReady ? 'Corv AI · local model ready' : 'Corv AI · offline'}
          </div>
        </div>
      )}
    </aside>
  );
}
