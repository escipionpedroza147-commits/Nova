import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore, selectActiveTab } from '../store.js';
import { useUi } from '../uiBus.js';
import { isNewTab, domainLabel } from '../lib/util.js';
import { activeView } from '../lib/webviews.js';
import { SearchIcon, SparkleIcon, UserIcon, ClockIcon, StarIcon, BookmarkIcon, DownloadIcon, SettingsIcon } from './icons.jsx';

export default function Toolbar() {
  const activeTab = useStore(selectActiveTab);
  const signedIn = useStore((s) => s.googleSignedIn);
  const bookmarks = useStore((s) => s.bookmarks);
  const downloads = useStore((s) => s.downloads);
  const history = useStore((s) => s.history);
  const store = useStore.getState;
  const ui = useUi.getState;

  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [items, setItems] = useState([]);
  const [highlight, setHighlight] = useState(-1);
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  const tabUrl = activeTab && !isNewTab(activeTab.url) ? activeTab.url : '';
  const loading = Boolean(activeTab?.loading);
  const bookmarked = Boolean(tabUrl && bookmarks.some((item) => item.url === tabUrl));
  const downloading = downloads.some((item) => item.state === 'progressing');

  useEffect(() => { if (!focused) setValue(tabUrl); }, [tabUrl, focused]);
  useEffect(() => { document.body.classList.toggle('page-loading', loading); }, [loading]);

  const updateSuggestions = async (query) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length > 120) return setItems([]);
    const lower = trimmed.toLowerCase();
    const fromHistory = history.filter((item) => item.url.toLowerCase().includes(lower) || (item.title || '').toLowerCase().includes(lower)).slice(0, 3)
      .map((item) => ({ type: 'history', label: item.title || domainLabel(item.url), detail: item.url, value: item.url }));
    let fromGoogle = [];
    try {
      abortRef.current?.abort(); abortRef.current = new AbortController();
      const response = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(trimmed)}`, { signal: abortRef.current.signal });
      const data = await response.json();
      fromGoogle = (data?.[1] || []).slice(0, 5).map((text) => ({ type: 'search', label: text, detail: 'Google Search', value: text }));
    } catch { /* offline/aborted */ }
    setItems([...fromHistory, ...fromGoogle].slice(0, 7));
    setHighlight(-1);
  };

  const commit = (destination) => {
    setItems([]); setHighlight(-1);
    inputRef.current?.blur();
    store().navigateActive(destination);
  };

  const onKeyDown = (event) => {
    if (!items.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); const next = (highlight + 1) % items.length; setHighlight(next); setValue(items[next].value); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); const next = (highlight - 1 + items.length) % items.length; setHighlight(next); setValue(items[next].value); }
    else if (event.key === 'Enter' && highlight >= 0) { event.preventDefault(); commit(items[highlight].value); }
    else if (event.key === 'Escape') { event.stopPropagation(); setItems([]); }
  };

  return (
    <header className="browser-toolbar" aria-label="Browser toolbar">
      <div className="toolbar-leading" aria-label="Account and AI">
        <button className="avatar-button" type="button" aria-label="Account" title="Account" data-popover-trigger onClick={() => ui().setPopover('account')}>
          <span className="avatar-circle"><UserIcon /></span>
          {signedIn && <span className="account-status-dot" />}
        </button>
        <button className="address-ai-button" type="button" aria-label="Open VCorv AI" title="VCorv AI" onClick={() => store().setAiOpen(!useStore.getState().aiOpen)}><SparkleIcon /></button>
      </div>
      <form className="omnibox" onSubmit={(event) => { event.preventDefault(); commit(value); }}>
        <SearchIcon className="omnibox-search-icon" />
        <input
          id="omniboxInput"
          ref={inputRef}
          autoComplete="off"
          spellCheck="false"
          placeholder="Search Google or Ask Corv..."
          aria-label="Search Google or Ask Corv"
          value={value}
          onChange={(event) => { setValue(event.target.value); updateSuggestions(event.target.value); }}
          onFocus={(event) => { setFocused(true); event.target.select(); }}
          onBlur={() => { setFocused(false); setTimeout(() => setItems([]), 120); }}
          onKeyDown={onKeyDown}
        />
        <AnimatePresence>
          {items.length > 0 && focused && (
            <motion.div
              className="omnibox-suggestions"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.33, 1, 0.68, 1] }}
            >
              {items.map((item, index) => (
                <button key={`${item.type}-${item.value}`} type="button" className={index === highlight ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); commit(item.value); }}>
                  {item.type === 'history'
                    ? <ClockIcon />
                    : <SearchIcon />}
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          id="bookmarkButton"
          className={bookmarked ? 'active' : ''}
          type="button"
          aria-label="Bookmark this page"
          title="Bookmark this page"
          onClick={(event) => { event.preventDefault(); store().toggleBookmark(); }}
        >
          <StarIcon />
        </button>
      </form>
      <nav className="toolbar-actions" aria-label="Browser actions">
        <button type="button" aria-label="Bookmarks" title="Bookmarks" data-popover-trigger onClick={() => ui().setPopover('bookmarks')}><BookmarkIcon /></button>
        <button type="button" aria-label="Downloads" title="Downloads" data-popover-trigger onClick={() => ui().setPopover('downloads')}>
          <DownloadIcon />
          {downloading && <span className="download-badge" />}
        </button>
        <button type="button" aria-label="Settings" title="Settings" data-popover-trigger onClick={() => ui().setPopover('settings')}>
          <SettingsIcon />
        </button>
      </nav>
    </header>
  );
}
