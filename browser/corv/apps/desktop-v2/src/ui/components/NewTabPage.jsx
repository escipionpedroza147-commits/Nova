import React, { useEffect, useRef } from 'react';
import { useStore } from '../store.js';
import { useUi } from '../uiBus.js';
import { safeHttpUrl, normalizeDestination, domainLabel } from '../lib/util.js';
import { SearchIcon, SparkleIcon, Icon, MicIcon, CameraIcon, BrushIcon, SpaceIcon } from './icons.jsx';
import googleLogo from '../assets/google-logo.png';

export default function NewTabPage() {
  const shortcuts = useStore((s) => s.shortcuts);
  const continuePill = useStore((s) => s.settings.continuePill !== false);
  const spaces = useStore((s) => s.spaces);
  const tabs = useStore((s) => s.tabs);
  const activeSpaceId = useStore((s) => s.activeSpaceId);
  const [pillDismissed, setPillDismissed] = React.useState(Boolean(window.__corvPillDismissed));
  const otherSpace = React.useMemo(() => {
    if (!continuePill || pillDismissed) return null;
    const candidates = spaces
      .filter((space) => space.id !== activeSpaceId)
      .map((space) => ({ space, count: tabs.filter((tab) => tab.spaceId === space.id && tab.url && !tab.url.startsWith('vcorv:')).length }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
    return candidates[0] || null;
  }, [continuePill, pillDismissed, spaces, tabs, activeSpaceId]);
  const dismissPill = () => { window.__corvPillDismissed = true; setPillDismissed(true); };
  const showShortcuts = useStore((s) => s.settings.showShortcuts);
  const store = useStore.getState;
  const ui = useUi.getState;
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const addShortcut = async () => {
    const result = await ui().openDialog({ title: 'Add shortcut', subtitle: 'Shows on your new tab page', fields: [{ name: 'url', label: 'Address', value: 'https://' }, { name: 'name', label: 'Name', placeholder: 'Optional' }], confirmLabel: 'Add shortcut' });
    if (!result) return;
    const url = safeHttpUrl(normalizeDestination(result.url));
    if (!url) return store().showToast('Use a valid web address');
    store().addShortcut((result.name.trim() || domainLabel(url)).slice(0, 18), url);
  };

  return (
    <section className="new-tab-page" aria-label="New tab page">
      <nav className="page-links" aria-label="Google links">
        <button type="button" onClick={() => store().navigateActive('https://mail.google.com')}>Gmail</button>
        <button type="button" onClick={() => store().navigateActive('https://images.google.com')}>Images</button>
        <button className="apps-grid" type="button" aria-label="Google apps" title="Google apps" onClick={() => store().navigateActive('https://www.google.com/intl/en/about/products')}>
          {Array.from({ length: 9 }).map((_, i) => <span key={i} />)}
        </button>
      </nav>
      <section className="hero" aria-label="Google search">
        {otherSpace && (
          <div className="continue-pill">
            <span className="continue-pill-icon" style={{ color: otherSpace.space.color }}><SpaceIcon icon={otherSpace.space.icon} /></span>
            <span>Continue where you left off: <strong>{otherSpace.space.name}</strong> · {otherSpace.count} tab{otherSpace.count > 1 ? 's' : ''}</span>
            <button type="button" className="continue-pill-go" onClick={() => store().switchSpace(otherSpace.space.id)}>Resume</button>
            <button type="button" className="continue-pill-x" aria-label="Dismiss" onClick={dismissPill}>×</button>
          </div>
        )}
        <img className="google-logo" src={googleLogo} alt="Google" />
        <form className="hero-search" onSubmit={(event) => { event.preventDefault(); store().navigateActive(inputRef.current.value); }}>
          <SearchIcon className="hero-search-icon" />
          <input ref={inputRef} autoComplete="off" spellCheck="false" placeholder="Search Google or type a URL" aria-label="Search Google or enter a URL" />
          <button type="button" aria-label="Voice search" title="Voice search" onClick={() => store().showToast('Voice search will be wired in the next function pass')}>
            <MicIcon />
          </button>
          <button type="button" aria-label="Search by image" title="Search by image" onClick={() => store().navigateActive('https://images.google.com')}>
            <CameraIcon />
          </button>
          <button className="ai-mode-button" type="button" aria-label="AI Mode" onClick={() => store().setAiOpen(true)}>
            <SparkleIcon /><span>AI Mode</span>
          </button>
        </form>
        {showShortcuts && (
          <div className="shortcuts">
            <button className="shortcut" type="button" onClick={() => store().navigateActive('https://chromewebstore.google.com')}>
              <span className="shortcut-disc"><span className="store-bag"><i /></span></span><span>Web Store</span>
            </button>
            {shortcuts.map((item, index) => (
              <button key={item.url} className="shortcut" type="button" title={item.url} onClick={() => store().navigateActive(item.url)}>
                <span className="shortcut-disc custom-disc">{item.name.slice(0, 1).toUpperCase()}</span>
                <span>{item.name}</span>
                <i className="shortcut-remove" onClick={(event) => { event.stopPropagation(); store().removeShortcut(index); }}>×</i>
              </button>
            ))}
            <button className="shortcut" type="button" onClick={addShortcut}>
              <span className="shortcut-disc shortcut-plus">＋</span><span>Add shortcut</span>
            </button>
          </div>
        )}
      </section>
      <button className="customize-vcorv-button" type="button" onClick={() => useUi.getState().setCustomizeOpen(true)}>
        <BrushIcon /> Customize VCorv
      </button>
    </section>
  );
}
