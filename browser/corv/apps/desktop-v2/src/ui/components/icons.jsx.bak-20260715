import React from 'react';
import { SPACE_ICONS } from '../lib/catalog.js';

// VCorv icon set — 24x24, 2px rounded strokes (Escipion's reference set, 2026-07-14).
// All chrome icons come from here. Do not add inline <svg> in components.

const Base = ({ children, size, ...props }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" style={size ? { width: size, height: size } : undefined} {...props}>{children}</svg>
);

export const Icon = ({ d, size, ...props }) => (
  <Base size={size} {...props}><path d={d} /></Base>
);

export const SpaceIcon = ({ icon }) => SPACE_ICONS[icon]
  ? <Icon d={SPACE_ICONS[icon]} />
  : <span className="space-emoji">{icon || '✦'}</span>;

/* ---- Navigation ---- */
export const BackIcon = (p) => <Base {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Base>;
export const ForwardIcon = (p) => <Base {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Base>;
export const ReloadIcon = (p) => <Base {...p}><path d="M20 11a8 8 0 1 0-2.3 6.3M20 5v6h-6" /></Base>;
export const StopIcon = (p) => <Base {...p}><rect x="7" y="7" width="10" height="10" rx="1.5" /></Base>;

/* ---- Core chrome ---- */
export const SearchIcon = (p) => <Base {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></Base>;
export const PlusIcon = (p) => <Base {...p}><path d="M12 5v14M5 12h14" /></Base>;
export const CloseIcon = (p) => <Base {...p}><path d="M6 6l12 12M18 6L6 18" /></Base>;
export const SidebarIcon = (p) => <Base {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M9.5 4.5v15" /></Base>;
export const MoreIcon = (p) => <Base {...p}><circle cx="12" cy="5.5" r="1.7" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" /><circle cx="12" cy="18.5" r="1.7" fill="currentColor" stroke="none" /></Base>;
export const HomeIcon = (p) => <Base {...p}><path d="M4 11l8-7 8 7v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" /><path d="M10 20.5v-6h4v6" /></Base>;

/* ---- Toolbar actions ---- */
export const BookmarkIcon = (p) => <Base {...p}><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" /></Base>;
export const StarIcon = (p) => <Base {...p}><path d="m12 4.5 2.2 4.6 5 .7-3.6 3.6.8 5.1L12 16l-4.4 2.5.8-5.1L4.8 9.8l5-.7L12 4.5Z" /></Base>;
export const DownloadIcon = (p) => <Base {...p}><path d="M12 4v11M7 11l5 5 5-5M4.5 20h15" /></Base>;
export const SettingsIcon = (p) => <Base {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2.8c.6 0 1.2.05 1.8.16l.5 2.1c.6.2 1.2.5 1.7 1l2-.7c.8.9 1.4 1.9 1.8 3.1l-1.6 1.5c.1.3.1.7.1 1s0 .7-.1 1l1.6 1.5a9.2 9.2 0 0 1-1.8 3.1l-2-.7c-.5.4-1.1.8-1.7 1l-.5 2.1a9.3 9.3 0 0 1-3.6 0l-.5-2.1c-.6-.2-1.2-.5-1.7-1l-2 .7A9.2 9.2 0 0 1 4.2 13l1.6-1.5c-.1-.3-.1-.7-.1-1s0-.7.1-1L4.2 8a9.2 9.2 0 0 1 1.8-3.1l2 .7c.5-.4 1.1-.8 1.7-1l.5-2.1c.6-.1 1.2-.16 1.8-.16Z" /></Base>;
export const UserIcon = (p) => <Base {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></Base>;
export const HistoryIcon = (p) => <Base {...p}><path d="M4 11a8 8 0 1 1 2.3 6.3M4 17v-6h6" /><path d="M12 8v4l3 2" /></Base>;
export const ClockIcon = (p) => <Base {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2" /></Base>;
export const LockIcon = (p) => <Base {...p}><rect x="5.5" y="11" width="13" height="9" rx="2" /><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></Base>;
export const ShieldIcon = (p) => <Base {...p}><path d="M12 3l7.5 3v6c0 4.4-3.2 7.6-7.5 9-4.3-1.4-7.5-4.6-7.5-9V6z" /></Base>;

/* ---- AI ---- */
export const SparkleIcon = (p) => <Base {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></Base>;
export const ChatIcon = (p) => <Base {...p}><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z" /></Base>;
export const BrainIcon = (p) => <Base {...p}><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 3c0 1 .4 1.8 1 2.4A3.3 3.3 0 0 0 7 18c.4 1.2 1.5 2 2.9 2 1.2 0 2.1-.6 2.1-2V6a2 2 0 0 0-3-2zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 3c0 1-.4 1.8-1 2.4a3.3 3.3 0 0 1-2 5.6c-.4 1.2-1.5 2-2.9 2-1.2 0-2.1-.6-2.1-2V6a2 2 0 0 1 3-2z" /></Base>;
export const SendIcon = (p) => <Base {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Base>;

/* ---- New tab page ---- */
export const MicIcon = (p) => <Base {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></Base>;
export const CameraIcon = (p) => <Base {...p}><rect x="3.5" y="6" width="17" height="13" rx="3" /><circle cx="12" cy="12.5" r="3.5" /></Base>;
export const StoreIcon = (p) => <Base {...p}><path d="M4 8l1.5-4h13L20 8M4 8h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" /><path d="M9 12h6" /></Base>;
export const GridIcon = (p) => <Base {...p}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></Base>;

/* ---- Misc ---- */
export const BrushIcon = (p) => <Base {...p}><path d="M14 4l6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2z" /><path d="M8 20c-2 .8-4-.5-4-.5s1.5-.7 2-2.5" /></Base>;
export const FolderIcon = (p) => <Base {...p}><path d="M4 7a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" /></Base>;
export const DocIcon = (p) => <Base {...p}><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /></Base>;
export const EyeIcon = (p) => <Base {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></Base>;
export const TrashIcon = (p) => <Base {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 13a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1l1-13" /></Base>;
export const LinkIcon = (p) => <Base {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" /></Base>;

/* Google brand mark (multicolor fill, sign-in button only) */
export const GoogleIcon = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}><path d="M21.4 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.3a4.5 4.5 0 0 1-2 2.9v2.5h3.2c1.9-1.8 2.9-4.3 2.9-7.3Z" /><path d="M12 21.7c2.7 0 5-.9 6.6-2.3l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4l-3.3 2.6A10 10 0 0 0 12 21.7Z" /><path d="M6.5 13.9a6 6 0 0 1 0-3.8V7.5L3.2 5A10 10 0 0 0 2 12c0 1.6.4 3.2 1.2 4.5l3.3-2.6Z" /><path d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.2 5l3.3 2.6a5.8 5.8 0 0 1 5.5-1.5Z" /></svg>
);
