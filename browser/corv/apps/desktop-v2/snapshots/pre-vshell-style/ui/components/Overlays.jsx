import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, selectCurrentSpace } from '../store.js';
import { useUi } from '../uiBus.js';
import { faviconFor, safeHttpUrl, normalizeDestination, domainLabel } from '../lib/util.js';
import { SPACE_COLORS, SPACE_ICONS, SPACE_TEMPLATES, APP_CATALOG, APP_CATEGORIES } from '../lib/catalog.js';
import { SpaceIcon, SearchIcon, UserIcon, GoogleIcon } from './icons.jsx';

const popTransition = { duration: 0.16, ease: [0.33, 1, 0.68, 1] };
const popMotion = {
  initial: { opacity: 0, y: -5, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -5, scale: 0.985 },
  transition: popTransition
};

/* ---------- Context menu ---------- */
function ContextMenu() {
  const menu = useUi((s) => s.contextMenu);
  const ui = useUi.getState;
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!menu) return setPos(null);
    setPos({ left: menu.x, top: menu.y });
    requestAnimationFrame(() => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ left: Math.min(menu.x, window.innerWidth - rect.width - 8), top: Math.min(menu.y, window.innerHeight - rect.height - 8) });
    });
  }, [menu]);

  return (
    <AnimatePresence>
      {menu && pos && (
        <motion.nav ref={ref} className="context-menu" style={pos} {...popMotion}>
          {menu.items.map((item, index) => {
            if (item.type === 'colors') return (
              <div key={`colors-${index}`} className="menu-colors">
                {SPACE_COLORS.map((color) => <button key={color} type="button" style={{ background: color }} aria-label="Set color" onClick={() => { ui().closeContextMenu(); item.action(color); }} />)}
              </div>
            );
            if (item.type === 'icons') return (
              <div key={`icons-${index}`} className="menu-icons">
                {Object.keys(SPACE_ICONS).map((icon) => <button key={icon} type="button" aria-label={icon} onClick={() => { ui().closeContextMenu(); item.action(icon); }}><SpaceIcon icon={icon} /></button>)}
              </div>
            );
            return <button key={item.label} type="button" className={item.danger ? 'danger' : ''} onClick={() => { ui().closeContextMenu(); item.action(); }}>{item.label}</button>;
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

/* ---------- Popovers ---------- */
function Popovers() {
  const popover = useUi((s) => s.popover);
  const ui = useUi.getState;
  const store = useStore.getState;
  const settings = useStore((s) => s.settings);
  const bookmarks = useStore((s) => s.bookmarks);
  const downloads = useStore((s) => s.downloads);
  const signedIn = useStore((s) => s.googleSignedIn);

  return (
    <AnimatePresence>
      {popover === 'account' && (
        <motion.section key="account" className="popover google-account-popover" aria-label="Google account" {...popMotion}>
          <header>
            <div className="google-account-avatar"><UserIcon /></div>
            <div><strong>{signedIn ? 'Google account connected' : 'Sign in to Google'}</strong><span>{signedIn ? 'Google services stay signed in across restarts' : 'Use Google services in VCorv'}</span></div>
            <button type="button" onClick={() => ui().closePopovers()}>×</button>
          </header>
          <div className="google-account-save-status">
            <span className="save-status-icon">✓</span>
            <div><strong>Browser data is saving</strong><small>Tabs, bookmarks, shortcuts, and settings are stored on this Mac.</small></div>
          </div>
          {!signedIn && (
            <button className="google-sign-in-button" type="button" onClick={() => { ui().closePopovers(); store().setAiOpen(false); store().navigateActive('https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fwww.google.com%2F'); }}>
              <GoogleIcon />
              <span>Sign in with Google</span>
            </button>
          )}
          {signedIn && (
            <button className="google-sign-out-button" type="button" onClick={async () => { await window.vcorv?.googleSignOut?.(); store().setGoogleSignedIn(false); store().showToast('Signed out of Google'); }}>Sign out of Google in VCorv</button>
          )}
          <p className="google-sync-note"><strong>VCorv Sync:</strong> Google Drive cloud sync requires a Google OAuth client. Until connected, browser data remains safely saved locally.</p>
        </motion.section>
      )}

      {popover === 'settings' && (
        <motion.section key="settings" className="popover settings-popover" aria-label="Settings" {...popMotion}>
          <header><div><strong>Settings</strong><span>Browser preferences</span></div><button type="button" onClick={() => ui().closePopovers()}>×</button></header>
          <label><span>Restore tabs on launch</span><input type="checkbox" checked={settings.restoreTabs} onChange={(event) => store().patchSettings({ restoreTabs: event.target.checked })} /></label>
          <label><span>Show shortcuts</span><input type="checkbox" checked={settings.showShortcuts} onChange={(event) => store().patchSettings({ showShortcuts: event.target.checked })} /></label>
          <button className="panel-action" type="button" onClick={async () => { await window.vcorv?.clearBrowsingData?.(); store().showToast('Browsing data cleared'); }}>Clear browsing data</button>
        </motion.section>
      )}

      {popover === 'menu' && (
        <motion.section key="menu" className="popover menu-popover" aria-label="Browser menu" {...popMotion}>
          <button type="button" onClick={() => { ui().closePopovers(); store().createTab(); }}>New tab <kbd>⌘T</kbd></button>
          <button type="button" onClick={() => { ui().closePopovers(); window.vcorv?.newWindow?.(); }}>New window <kbd>⌘N</kbd></button>
          <button type="button" onClick={() => { ui().closePopovers(); ui().setFindOpen(true); }}>Find in page <kbd>⌘F</kbd></button>
          <button type="button" onClick={() => ui().setPopover('bookmarks')}>Bookmarks</button>
          <button type="button" onClick={() => ui().setPopover('downloads')}>Downloads</button>
          <button type="button" onClick={() => ui().setPopover('settings')}>Settings</button>
        </motion.section>
      )}

      {popover === 'bookmarks' && (
        <motion.section key="bookmarks" className="popover list-popover" aria-label="Bookmarks" {...popMotion}>
          <header><strong>Bookmarks</strong><button type="button" onClick={() => ui().closePopovers()}>×</button></header>
          <div>
            {bookmarks.length ? bookmarks.map((item, index) => (
              <div key={item.url} className="list-item">
                <button type="button" onClick={() => { ui().closePopovers(); store().navigateActive(item.url); }}><strong>{item.title}</strong><small>{item.url}</small></button>
                <button className="list-remove" aria-label="Remove" onClick={() => store().removeBookmark(index)}>×</button>
              </div>
            )) : <p className="empty-list">No bookmarks yet.</p>}
          </div>
        </motion.section>
      )}

      {popover === 'downloads' && (
        <motion.section key="downloads" className="popover list-popover" aria-label="Downloads" {...popMotion}>
          <header><strong>Downloads</strong><button type="button" onClick={() => ui().closePopovers()}>×</button></header>
          <div>
            {downloads.length ? downloads.slice().reverse().map((item) => {
              const percent = item.totalBytes ? Math.round(item.receivedBytes / item.totalBytes * 100) : 0;
              return (
                <div key={item.id} className="list-item download-item">
                  <button type="button" onClick={() => window.vcorv?.showDownload?.(item.savePath || '')}>
                    <strong>{item.filename || 'Download'}</strong>
                    <small>{item.state}{item.state === 'progressing' ? ` · ${percent}%` : ''}</small>
                  </button>
                </div>
              );
            }) : <p className="empty-list">No downloads yet.</p>}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

/* ---------- New Space modal ---------- */
function SpaceModal() {
  const open = useUi((s) => s.spaceModalOpen);
  const ui = useUi.getState;
  const store = useStore.getState;
  const spaces = useStore((s) => s.spaces);
  const [draft, setDraft] = useState(null);
  const nameRef = useRef(null);

  useEffect(() => {
    if (!open) return setDraft(null);
    const template = SPACE_TEMPLATES[1];
    setDraft({ name: '', color: SPACE_COLORS[spaces.length % SPACE_COLORS.length], icon: template.icon, apps: template.apps.map((app) => ({ ...app })) });
    setTimeout(() => nameRef.current?.focus(), 30);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !draft) return null;

  const create = () => {
    store().addSpace(draft);
    ui().closeSpaceModal();
  };

  return (
    <div className="space-modal" role="dialog" aria-label="New space" onMouseDown={(event) => { if (event.target === event.currentTarget) ui().closeSpaceModal(); }}>
      <motion.form className="new-space-card" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={popTransition} onSubmit={(event) => { event.preventDefault(); create(); }}>
        <header className="panel-header"><strong>New Space</strong><button className="modal-close" type="button" aria-label="Close" onClick={() => ui().closeSpaceModal()}>×</button></header>
        <label className="field-block"><span>Name</span>
          <input ref={nameRef} autoComplete="off" spellCheck="false" placeholder="My space" maxLength={24} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <div className="field-block"><span>Color</span>
          <div className="look-row">
            {SPACE_COLORS.map((color) => <button key={color} type="button" className={draft.color === color ? 'selected' : ''} style={{ background: color }} aria-label="Color" onClick={() => setDraft({ ...draft, color })} />)}
          </div>
        </div>
        <div className="field-block"><span>Icon</span>
          <div className="icon-strip">
            {Object.keys(SPACE_ICONS).map((icon) => <button key={icon} type="button" className={draft.icon === icon ? 'selected' : ''} aria-label={icon} onClick={() => setDraft({ ...draft, icon })}><SpaceIcon icon={icon} /></button>)}
          </div>
        </div>
        <div className="field-block"><span>Preview</span>
          <div className="space-inline-preview">
            <span className="preview-space-icon" style={{ background: draft.color }}><SpaceIcon icon={draft.icon} /></span>
            <span className="preview-space-name">{draft.name.trim() || 'My space'}</span>
            <span className="preview-apps">{draft.apps.slice(0, 4).map((app) => <img key={app.url} src={faviconFor(app.url)} alt="" title={app.name} />)}</span>
          </div>
        </div>
        <div className="field-block"><span>Start with</span>
          <div className="start-chips">
            {draft.apps.map((app, index) => (
              <span key={app.url} className="start-chip">
                <img src={faviconFor(app.url)} alt="" />{app.name}
                <button type="button" aria-label={`Remove ${app.name}`} onClick={() => setDraft({ ...draft, apps: draft.apps.filter((_, i) => i !== index) })}>×</button>
              </span>
            ))}
            <button type="button" className="start-chip add-chip" data-app-picker-trigger onClick={() => { window.__vcorvDraftHook = [draft, setDraft]; ui().openAppPicker('draft'); }}>+ Add apps</button>
          </div>
        </div>
        <footer>
          <button type="button" className="text-button" onClick={() => ui().closeSpaceModal()}>Cancel</button>
          <button type="submit" className="primary-button">Create Space</button>
        </footer>
      </motion.form>
    </div>
  );
}

/* ---------- App picker ---------- */
function AppPicker() {
  const open = useUi((s) => s.appPickerOpen);
  const mode = useUi((s) => s.appPickerMode);
  const ui = useUi.getState;
  const store = useStore.getState;
  const space = useStore(selectCurrentSpace);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const draftHook = mode === 'draft' ? window.__vcorvDraftHook : null;

  useEffect(() => { if (open) { setCategory('All'); setQuery(''); setTimeout(() => searchRef.current?.focus(), 30); } }, [open]);
  if (!open) return null;

  const targetApps = draftHook ? draftHook[0].apps : (space?.apps || []);
  const toggleApp = (app) => {
    if (draftHook) {
      const [draft, setDraft] = draftHook;
      const exists = draft.apps.some((item) => item.url === app.url);
      const next = { ...draft, apps: exists ? draft.apps.filter((item) => item.url !== app.url) : [...draft.apps, { ...app }] };
      setDraft(next);
      window.__vcorvDraftHook = [next, setDraft];
    } else if (space) {
      store().toggleSpaceApp(space.id, app);
    }
  };

  const filter = APP_CATEGORIES[category] || APP_CATEGORIES.All;
  const items = APP_CATALOG.filter((app) => filter(app) && app.name.toLowerCase().includes(query.trim().toLowerCase()));

  const addCustom = async () => {
    ui().closeAppPicker();
    const result = await ui().openDialog({ title: 'Add custom app', subtitle: 'Pin any website to this space', fields: [{ name: 'url', label: 'Address', value: 'https://' }, { name: 'name', label: 'Name', placeholder: 'Optional' }], confirmLabel: 'Add app' });
    if (!result) return;
    const url = safeHttpUrl(normalizeDestination(result.url));
    if (!url) return store().showToast('Use a valid web address');
    const app = { name: (result.name.trim() || domainLabel(url)).slice(0, 18), url };
    if (draftHook) { const [draft, setDraft] = draftHook; setDraft({ ...draft, apps: [...draft.apps, app] }); }
    else if (space) store().patchSpace(space.id, { apps: [...space.apps, app] });
  };

  return (
    <section className="app-picker" aria-label="Add apps">
      <motion.div className="app-picker-card" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={popTransition}>
        <header>
          <div><strong>Add Apps</strong><span>{draftHook ? 'Pick starter apps for this space' : `Pin apps to your ${space?.name || ''} space`}</span></div>
          <label className="app-search"><SearchIcon /><input ref={searchRef} type="search" placeholder="Search" autoComplete="off" spellCheck="false" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <button type="button" aria-label="Close" onClick={() => ui().closeAppPicker()}>×</button>
        </header>
        <nav className="app-category-tabs">
          {Object.keys(APP_CATEGORIES).map((name) => <button key={name} type="button" className={name === category ? 'active' : ''} onClick={() => setCategory(name)}>{name}</button>)}
        </nav>
        <div className="app-grid">
          {items.length ? items.map((app) => {
            const added = targetApps.some((item) => item.url === app.url);
            return (
              <motion.button key={app.url} type="button" whileTap={{ scale: 0.94 }} className={`app-cell${added ? ' added' : ''}`} title={app.name} onClick={() => toggleApp(app)}>
                <img src={faviconFor(app.url)} alt="" loading="lazy" />
                <span>{app.name}</span>
                {added ? <i>✓</i> : <i className="add-badge">+</i>}
              </motion.button>
            );
          }) : <p className="empty-list">No apps match.</p>}
        </div>
        <footer>
          <button className="text-button" type="button" onClick={addCustom}>Add custom app from URL</button>
          <button className="primary-button" type="button" onClick={() => ui().closeAppPicker()}>Done</button>
        </footer>
      </motion.div>
    </section>
  );
}

/* ---------- Dialog ---------- */
function Dialog() {
  const dialog = useUi((s) => s.dialog);
  const ui = useUi.getState;
  const formRef = useRef(null);

  useEffect(() => {
    if (!dialog) return;
    setTimeout(() => {
      const first = formRef.current?.querySelector('input');
      if (first) { first.focus(); first.select(); }
    }, 30);
  }, [dialog]);

  if (!dialog) return null;
  const { title, subtitle = '', fields = [], confirmLabel = 'Done', danger = false } = dialog;

  const submit = (event) => {
    event.preventDefault();
    const values = {};
    formRef.current?.querySelectorAll('input').forEach((input) => { values[input.name] = input.value; });
    ui().settleDialog(values);
  };

  return (
    <div className="space-modal dialog-modal" role="dialog" aria-label={title} onMouseDown={(event) => { if (event.target === event.currentTarget) ui().settleDialog(null); }}>
      <motion.form ref={formRef} className={`dialog-card${danger ? ' danger' : ''}`} initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={popTransition} onSubmit={submit}>
        <strong>{title}</strong>
        {subtitle && <p>{subtitle}</p>}
        {fields.length > 0 && (
          <div className="dialog-fields">
            {fields.map((field) => (
              <label key={field.name}><span>{field.label}</span>
                <input name={field.name} defaultValue={field.value || ''} placeholder={field.placeholder || ''} autoComplete="off" spellCheck="false" />
              </label>
            ))}
          </div>
        )}
        <footer>
          <button type="button" onClick={() => ui().settleDialog(null)}>Cancel</button>
          <button type="submit" className="primary">{confirmLabel}</button>
        </footer>
      </motion.form>
    </div>
  );
}

/* ---------- Toast ---------- */
function Toast() {
  const toast = useStore((s) => s.toast);
  const toastKey = useStore((s) => s.toastKey);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [toast, toastKey]);

  return (
    <AnimatePresence>
      {visible && toast && (
        <motion.div
          key={toastKey}
          className="toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 8, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 6, x: '-50%' }}
          transition={popTransition}
        >{toast}</motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Overlays() {
  return (
    <>
      <ContextMenu />
      <Popovers />
      <SpaceModal />
      <AppPicker />
      <Dialog />
      <Toast />
    </>
  );
}
