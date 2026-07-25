import React, { useEffect, useState } from 'react';
import { useStore } from '../store.js';
import {
  Folder, Grid, SearchIcon, X, Plus, Home, Briefcase, GraduationCap,
  Sparkles, Mic,
} from './icons.jsx';

const COLORS = ['#4d9fff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#6b7280'];

export const SPACE_ICONS = {
  home: Home,
  briefcase: Briefcase,
  grad: GraduationCap,
  folder: Folder,
  code: (p) => <IconWrap {...p} d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  palette: (p) => <IconWrap {...p} d="M12 22a10 10 0 1 1 10-10c0 1.7-1.3 3-3 3h-2a2 2 0 0 0-2 2v2c0 1.7-1.3 3-3 3z" dots />,
  heart: (p) => <IconWrap {...p} d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />,
  cart: (p) => <IconWrap {...p} d="M2 3h2l2.6 12.4A2 2 0 0 0 8.6 17H19a2 2 0 0 0 2-1.6L23 7H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />,
  dollar: (p) => <IconWrap {...p} d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  plane: (p) => <IconWrap {...p} d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
  game: (p) => <IconWrap {...p} d="M6 12h4m-2-2v4M15 11h.01M18 13h.01M17.32 5H6.68a4 4 0 0 0-3.98 3.6 41 41 0 0 0 0 6.8A4 4 0 0 0 6.68 19h10.64a4 4 0 0 0 3.98-3.6 41 41 0 0 0 0-6.8A4 4 0 0 0 17.32 5z" />,
  music: (p) => <IconWrap {...p} d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-3a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />,
};

function IconWrap({ size = 18, d, dots }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
      {dots && <><circle cx="8" cy="9" r="1" fill="currentColor" stroke="none" /><circle cx="13" cy="7" r="1" fill="currentColor" stroke="none" /><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" /></>}
    </svg>
  );
}

const ICON_KEYS = ['home', 'briefcase', 'grad', 'code', 'palette', 'heart', 'cart', 'dollar', 'plane', 'game', 'music'];

/* ---- app catalog ---- */
const Glyph = {
  youtube: <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.55 12 3.55 12 3.55s-7.51 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.51 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81z"/><path fill="#fff" d="M9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>,
  gmail: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11.3 3.6 5.4A2 2 0 0 1 4.8 5h14.4c.44 0 .85.15 1.2.4L12 11.3z"/><path fill="#FBBC05" d="M2.8 6.6 12 13l9.2-6.4c.5.36.8.95.8 1.6v.3L12 15.6 2 8.5v-.3c0-.65.3-1.24.8-1.6z"/><path fill="#34A853" d="M2 8.5l10 7.1 10-7.1V17a2 2 0 0 1-2 2h-1.5V9.9L12 14.5 5.5 9.9V19H4a2 2 0 0 1-2-2V8.5z"/></svg>,
  drive: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#0066DA" d="m8.27 14.5-3.9 6.75A2.3 2.3 0 0 1 3.5 20.4L1 16.06a2.3 2.3 0 0 1 0-2.3L8.16 1.4h7.8l-7.7 13.1z"/><path fill="#00AC47" d="M8.16 1.4h7.8L23.1 13.76a2.3 2.3 0 0 1 0 2.3l-2.5 4.34-7.72-13.13L8.16 1.4z"/><path fill="#FFBA00" d="M8.27 14.5h15.5l-2.5 4.35a2.3 2.3 0 0 1-2 1.15H6.9a2.3 2.3 0 0 1-2-1.15l-.53-.92 3.9-6.75v3.32z"/></svg>,
  calendar: <svg width="19" height="19" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2" fill="#4285F4"/><rect x="6" y="8" width="12" height="10" fill="#fff"/><text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="700" fill="#4285F4">31</text></svg>,
  notion: <span style={{ fontWeight: 800, fontSize: 16, color: '#fff', fontFamily: 'Georgia, serif' }}>N</span>,
  slack: <svg width="19" height="19" viewBox="0 0 24 24"><path fill="#E01E5A" d="M5.04 15.12a2.52 2.52 0 1 1-2.52-2.52h2.52v2.52zm1.27 0a2.52 2.52 0 0 1 5.04 0v6.36a2.52 2.52 0 1 1-5.04 0v-6.36z"/><path fill="#36C5F0" d="M8.83 5.04a2.52 2.52 0 1 1 2.52-2.52v2.52H8.83zm0 1.27a2.52 2.52 0 0 1 0 5.04H2.52a2.52 2.52 0 1 1 0-5.04h6.31z"/><path fill="#2EB67D" d="M18.96 8.83a2.52 2.52 0 1 1 2.52 2.52h-2.52V8.83zm-1.27 0a2.52 2.52 0 0 1-5.04 0V2.52a2.52 2.52 0 1 1 5.04 0v6.31z"/><path fill="#ECB22E" d="M15.17 18.96a2.52 2.52 0 1 1-2.52 2.52v-2.52h2.52zm0-1.27a2.52 2.52 0 0 1 0-5.04h6.31a2.52 2.52 0 1 1 0 5.04h-6.31z"/></svg>,
  discord: <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.6 1.25a18.3 18.3 0 0 0-5.5 0 12.6 12.6 0 0 0-.61-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.88 1.52.07.07 0 0 0-.04.03C.53 9.05-.32 13.58.1 18.06c0 .02.01.04.03.05a19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.12c.13-.1.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 0 1 .08 0c.12.11.25.21.37.3a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.11c.36.7.77 1.37 1.22 2a.08.08 0 0 0 .08.03 19.84 19.84 0 0 0 6.02-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.68-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.22 0 2.18 1.1 2.16 2.42 0 1.34-.94 2.42-2.16 2.42z"/></svg>,
  figma: <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#F24E1E" d="M8 24a4 4 0 0 0 4-4v-4H8a4 4 0 0 0 0 8z"/><path fill="#A259FF" d="M4 12a4 4 0 0 1 4-4h4v8H8a4 4 0 0 1-4-4z"/><path fill="#F24E1E" d="M4 4a4 4 0 0 1 4-4h4v8H8a4 4 0 0 1-4-4z"/><path fill="#FF7262" d="M12 0h4a4 4 0 0 1 0 8h-4V0z"/><path fill="#1ABCFE" d="M20 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z"/></svg>,
  github: <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>,
  linkedin: <svg width="18" height="18" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="#0A66C2"/><path fill="#fff" d="M7.1 9.4H4.3V20h2.8V9.4zM5.7 8.1a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3zM20 14.2c0-3.1-1.9-4.6-4-4.6-1.5 0-2.5.8-3 1.6v-1.8H10.2V20H13v-5.4c0-1.4.8-2.3 2-2.3s1.9.8 1.9 2.3V20H20v-5.8z"/></svg>,
  trello: <svg width="18" height="18" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="#0079BF"/><rect x="4" y="4" width="7" height="13" rx="1.5" fill="#fff"/><rect x="13" y="4" width="7" height="8" rx="1.5" fill="#fff"/></svg>,
  whatsapp: <svg width="19" height="19" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#25D366"/><path fill="#fff" d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07a8.18 8.18 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35z"/></svg>,
};

const POPULAR_APPS = [
  { label: 'YouTube', url: 'https://youtube.com', glyph: Glyph.youtube },
  { label: 'Gmail', url: 'https://mail.google.com', glyph: Glyph.gmail },
  { label: 'Drive', url: 'https://drive.google.com', glyph: Glyph.drive },
  { label: 'Calendar', url: 'https://calendar.google.com', glyph: Glyph.calendar },
  { label: 'Notion', url: 'https://notion.so', glyph: Glyph.notion },
  { label: 'Slack', url: 'https://app.slack.com', glyph: Glyph.slack },
  { label: 'Discord', url: 'https://discord.com/app', glyph: Glyph.discord },
  { label: 'Figma', url: 'https://figma.com', glyph: Glyph.figma },
];

const MORE_APPS = [
  { label: 'X', url: 'https://x.com', glyph: Glyph.x },
  { label: 'GitHub', url: 'https://github.com', glyph: Glyph.github },
  { label: 'LinkedIn', url: 'https://linkedin.com', glyph: Glyph.linkedin },
  { label: 'Trello', url: 'https://trello.com', glyph: Glyph.trello },
  { label: 'WhatsApp', url: 'https://web.whatsapp.com', glyph: Glyph.whatsapp },
];

export default function AddModal({ onClose }) {
  const addSpace = useStore((s) => s.addSpace);
  const addCustomApp = useStore((s) => s.addCustomApp);
  const customApps = useStore((s) => s.customApps);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState('home');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const create = () => {
    if (!name.trim()) return;
    addSpace({ label: name.trim(), color, icon });
    onClose();
  };

  const isAdded = (url) => customApps.some((a) => a.url === url);
  const filter = (apps) => apps.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="modalScrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="addModal">
        {/* left: create workspace */}
        <div className="modalPane">
          <div className="modalHead">
            <span className="modalHeadIcon blue"><Folder size={18} /></span>
            <b>Create Workspace</b>
          </div>
          <p className="modalSub">Organize your work and tabs in separate workspaces.</p>

          <label className="modalLabel">Workspace Name</label>
          <div className="modalInput">
            <input
              value={name}
              maxLength={24}
              placeholder="e.g. Personal, Work, School"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              autoFocus
            />
            <span className="modalCount">{name.length}/24</span>
          </div>

          <label className="modalLabel">Choose Color</label>
          <div className="colorRow">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`colorDot ${color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>

          <label className="modalLabel">Choose Icon</label>
          <div className="iconGrid">
            {ICON_KEYS.map((key) => {
              const Icon = SPACE_ICONS[key];
              return (
                <button
                  key={key}
                  className={`iconCell ${icon === key ? 'active' : ''}`}
                  onClick={() => setIcon(key)}
                >
                  <Icon size={17} />
                </button>
              );
            })}
          </div>

          <button className="modalCta" disabled={!name.trim()} onClick={create}>
            Create Workspace
          </button>
        </div>

        <div className="modalDivider" />

        {/* right: add apps */}
        <div className="modalPane">
          <div className="modalHead">
            <span className="modalHeadIcon blue"><Grid size={18} /></span>
            <b>Add Apps</b>
          </div>
          <p className="modalSub">Add your favorite apps to VCorv for quick access.</p>

          <div className="modalSearch">
            <SearchIcon size={15} />
            <input value={query} placeholder="Search apps" onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="appsHead">
            <b>Popular Apps</b>
          </div>
          <div className="appGrid">
            {filter(POPULAR_APPS).map((app) => (
              <div key={app.label} className="appCard">
                <span className="appGlyph">{app.glyph}</span>
                <span className="appLabel">{app.label}</span>
                <button
                  className={`appAdd ${isAdded(app.url) ? 'added' : ''}`}
                  onClick={() => addCustomApp(app)}
                  disabled={isAdded(app.url)}
                >
                  {isAdded(app.url) ? '✓' : <Plus size={13} />}
                </button>
              </div>
            ))}
          </div>

          <div className="appsHead"><b>More Apps</b></div>
          <div className="moreRow">
            {filter(MORE_APPS).map((app) => (
              <button
                key={app.label}
                className={`moreApp ${isAdded(app.url) ? 'added' : ''}`}
                title={isAdded(app.url) ? `${app.label} added` : `Add ${app.label}`}
                onClick={() => addCustomApp(app)}
              >
                {app.glyph}
              </button>
            ))}
          </div>
        </div>

        <button className="modalClose" onClick={onClose}><X size={16} /></button>
      </div>
    </div>
  );
}
