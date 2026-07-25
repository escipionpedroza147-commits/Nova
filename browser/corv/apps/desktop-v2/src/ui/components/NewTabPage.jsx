import React, { useRef, useState } from 'react';
import { useStore } from '../store.js';
import { SearchIcon, ClockIcon, Grid, Mic, Camera, Plus, X, MoreVertical, FileDoc } from './icons.jsx';

const SHORTCUTS = [
  { label: 'YouTube', url: 'https://youtube.com', bg: '#1f1f1f', glyph: <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.55 12 3.55 12 3.55s-7.51 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.51 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81z"/><path fill="#fff" d="M9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg> },
  { label: 'X', url: 'https://x.com', bg: '#000', glyph: <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z"/></svg> },
  { label: 'GitHub', url: 'https://github.com', bg: '#1f2328', glyph: <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg> },
  { label: 'Notion', url: 'https://notion.so', bg: '#fff', glyph: <span style={{ fontWeight: 800, fontSize: 16, color: '#000', fontFamily: 'Georgia, serif' }}>N</span> },
  { label: 'Gmail', url: 'https://mail.google.com', bg: '#fff', glyph: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11.3 3.6 5.4A2 2 0 0 1 4.8 5h14.4c.44 0 .85.15 1.2.4L12 11.3z"/><path fill="#FBBC05" d="M2.8 6.6 12 13l9.2-6.4c.5.36.8.95.8 1.6v.3L12 15.6 2 8.5v-.3c0-.65.3-1.24.8-1.6z"/><path fill="#34A853" d="M2 8.5l10 7.1 10-7.1V17a2 2 0 0 1-2 2h-1.5V9.9L12 14.5 5.5 9.9V19H4a2 2 0 0 1-2-2V8.5z"/><path fill="#4285F4" d="M5.5 9.9 12 14.5l6.5-4.6V19h-13V9.9z" opacity=".2"/></svg> },
  { label: 'Drive', url: 'https://drive.google.com', bg: '#fff', glyph: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#0066DA" d="m8.27 14.5-3.9 6.75A2.3 2.3 0 0 1 3.5 20.4L1 16.06a2.3 2.3 0 0 1 0-2.3L8.16 1.4h7.8l-7.7 13.1z" opacity=".9"/><path fill="#00AC47" d="M8.16 1.4h7.8L23.1 13.76a2.3 2.3 0 0 1 0 2.3l-2.5 4.34-7.72-13.13L8.16 1.4z" opacity=".9"/><path fill="#FFBA00" d="M8.27 14.5h15.5l-2.5 4.35a2.3 2.3 0 0 1-2 1.15H6.9a2.3 2.3 0 0 1-2-1.15l-.53-.92 3.9-6.75.0 3.32z" opacity=".9"/></svg> },
  { label: 'Calendar', url: 'https://calendar.google.com', bg: '#fff', glyph: <svg width="19" height="19" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2" fill="#4285F4"/><rect x="6" y="8" width="12" height="10" fill="#fff"/><text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="700" fill="#4285F4">31</text></svg> },
];

function Shortcut({ label, url, bg, glyph, onOpen }) {
  return (
    <button className="ntpShortcut" onClick={() => onOpen(url)}>
      <span className="ntpShortcutIcon" style={{ background: bg }}>{glyph}</span>
      <span className="ntpShortcutLabel">{label}</span>
    </button>
  );
}

function siteGlyph(url, label) {
  let host = '';
  try { host = new URL(url).host; } catch { /* noop */ }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
      alt=""
      style={{ width: 22, height: 22, borderRadius: 5 }}
      onError={(e) => { e.target.replaceWith(Object.assign(document.createElement('b'), { textContent: label[0] })); }}
    />
  );
}

export default function NewTabPage({ tabId, onAdd }) {
  const navigate = useStore((s) => s.navigate);
  const newTab = useStore((s) => s.newTab);
  const visited = useStore((s) => s.visited);
  const customApps = useStore((s) => s.customApps);
  const recentSearches = useStore((s) => s.recentSearches);
  const removeSearch = useStore((s) => s.removeSearch);
  const clearSearches = useStore((s) => s.clearSearches);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const open = (url) => navigate(tabId, url);
  const submit = () => { if (query.trim()) { navigate(tabId, query); setQuery(''); } };

  return (
    <div className="ntp">
      <div className="ntpTopRight">
        <button className="ntpLink" onClick={() => open('https://mail.google.com')}>Gmail</button>
        <button className="ntpLink" onClick={() => open('https://images.google.com')}>Images</button>
        <button className="ntpApps" title="Google apps"><Grid size={18} /></button>
      </div>

      <div className="ntpCenter">
        <img
          className="ntpGoogleLogo"
          src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_light_color_272x92dp.png"
          alt="Google"
          draggable={false}
        />
        <div className="ntpSearch">
          <span className="ntpSearchIcon"><SearchIcon size={17} /></span>
          <input
            ref={inputRef}
            value={query}
            placeholder="Search Google or type a URL"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
            spellCheck={false}
          />
          <span className="ntpSearchTools">
            <button title="Voice search"><Mic size={17} /></button>
            <button title="Search by image"><Camera size={17} /></button>
          </span>
        </div>

        <div className="ntpShortcuts">
          {SHORTCUTS.map((s) => <Shortcut key={s.label} {...s} onOpen={open} />)}
          {customApps
            .filter((a) => !SHORTCUTS.some((s) => s.url === a.url))
            .map((a) => (
              <Shortcut key={a.url} label={a.label} url={a.url} bg="#26262e" glyph={siteGlyph(a.url, a.label)} onOpen={open} />
            ))}
          <button className="ntpShortcut" onClick={onAdd}>
            <span className="ntpShortcutIcon add"><Plus size={18} /></span>
            <span className="ntpShortcutLabel">Add shortcut</span>
          </button>
        </div>

        <div className="ntpCards">
          <div className="ntpCard">
            <div className="ntpCardHead">
              <b>Continue where you left off</b>
              <button className="ntpCardAction" onClick={() => visited[0] && open(visited[0].url)}>View all</button>
            </div>
            {visited.length === 0 ? (
              <p className="ntpEmpty">Pages you visit will show up here.</p>
            ) : (
              visited.slice(0, 3).map((v) => (
                <button key={v.url} className="ntpRow" onClick={() => open(v.url)}>
                  <span className="ntpRowIcon">
                    {v.favicon ? <img src={v.favicon} alt="" /> : <FileDoc size={16} />}
                  </span>
                  <span className="ntpRowText">
                    <b>{v.title || v.url}</b>
                    <em>{(() => { try { return new URL(v.url).host + new URL(v.url).pathname.replace(/\/$/, ''); } catch { return v.url; } })()}</em>
                  </span>
                  <span className="ntpRowMore"><MoreVertical size={15} /></span>
                </button>
              ))
            )}
          </div>

          <div className="ntpCard">
            <div className="ntpCardHead">
              <b>Recent searches</b>
              {recentSearches.length > 0 && (
                <button className="ntpCardAction" onClick={clearSearches}>Clear all</button>
              )}
            </div>
            {recentSearches.length === 0 ? (
              <p className="ntpEmpty">Your searches will show up here.</p>
            ) : (
              recentSearches.slice(0, 5).map((q) => (
                <div key={q} className="ntpRow searchRow">
                  <button className="ntpRowMain" onClick={() => navigate(tabId, q)}>
                    <span className="ntpRowIcon"><ClockIcon size={15} /></span>
                    <span className="ntpRowQuery">{q}</span>
                  </button>
                  <button className="ntpRowX" onClick={() => removeSearch(q)} title="Remove"><X size={14} /></button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
