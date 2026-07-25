import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, selectCurrentSpace } from '../store.js';
import { useUi } from '../uiBus.js';
import { faviconFor } from '../lib/util.js';
import { SPACE_COLORS, SPACE_ICONS } from '../lib/catalog.js';
import { SpaceIcon, SearchIcon, SparkleIcon, PlusIcon } from './icons.jsx';

const spring = { type: 'spring', stiffness: 500, damping: 40, mass: 0.8 };

function SpaceButton({ space, index, active }) {
  const store = useStore.getState;
  const ui = useUi.getState;

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
      whileTap={{ scale: 0.9 }}
      className={`space-button${active ? ' active' : ''}`}
      title={space.name}
      draggable
      onDragStart={(event) => event.dataTransfer.setData('text/vcorv-space', String(index))}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData('text/vcorv-space')); if (!Number.isNaN(from) && from !== index) store().moveSpace(from, index); }}
      onClick={() => store().switchSpace(space.id)}
      onContextMenu={onContextMenu}
    >
      <span className="space-icon-square" style={{ '--sc': space.color }}><SpaceIcon icon={space.icon} /></span>
    </motion.button>
  );
}

export default function Sidebar() {
  const spaces = useStore((s) => s.spaces);
  const activeSpaceId = useStore((s) => s.activeSpaceId);
  const space = useStore(selectCurrentSpace);
  const store = useStore.getState;
  const ui = useUi.getState;

  const openAddMenu = (event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    ui().openContextMenu(rect.right + 6, rect.top, [
      { label: 'New space', action: () => ui().openSpaceModal() },
      { label: 'Add apps to this space', action: () => ui().openAppPicker('space') }
    ]);
  };

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <nav className="space-rail" aria-label="Spaces">
        <AnimatePresence initial={false}>
          {spaces.map((item, index) => <SpaceButton key={item.id} space={item} index={index} active={item.id === activeSpaceId} />)}
        </AnimatePresence>
      </nav>

      <div className="sidebar-flex-spacer" />

      <nav className="rail-secondary" aria-label="Pinned apps">
        <AnimatePresence initial={false}>
          {(space?.apps || []).map((app, index) => (
            <motion.button
              layout
              transition={spring}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.88 }}
              key={app.url}
              className="rail-button rail-app"
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
              <img src={faviconFor(app.url)} alt="" loading="lazy" />
            </motion.button>
          ))}
        </AnimatePresence>
      </nav>

      <div className="sidebar-bottom">
        <button className="rail-add-button" type="button" aria-label="Add space or app" title="Add" data-app-picker-trigger onClick={openAddMenu}>
          <PlusIcon />
        </button>
      </div>
    </aside>
  );
}
