import React from 'react';

const I = ({ children, size = 18, stroke = 1.8, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
);

export const ArrowLeft = (p) => <I {...p}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></I>;
export const ArrowRight = (p) => <I {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></I>;
export const RotateCw = (p) => <I {...p}><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></I>;
export const X = (p) => <I {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></I>;
export const Plus = (p) => <I {...p}><path d="M12 5v14" /><path d="M5 12h14" /></I>;
export const Star = (p) => <I {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></I>;
export const DownloadIcon = (p) => <I {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></I>;
export const MoreVertical = (p) => <I {...p}><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></I>;
export const Home = (p) => <I {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></I>;
export const Briefcase = (p) => <I {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></I>;
export const GraduationCap = (p) => <I {...p}><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /></I>;
export const Folder = (p) => <I {...p}><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></I>;
export const User = (p) => <I {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></I>;
export const SearchIcon = (p) => <I {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></I>;
export const ClockIcon = (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></I>;
export const Grid = (p) => <I {...p}><circle cx="5" cy="5" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" /><circle cx="19" cy="5" r="1.6" fill="currentColor" stroke="none" /><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="5" cy="19" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" /><circle cx="19" cy="19" r="1.6" fill="currentColor" stroke="none" /></I>;
export const Mic = (p) => <I {...p}><rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M12 19v3" /></I>;
export const Camera = (p) => <I {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></I>;
export const Minus = (p) => <I {...p}><path d="M5 12h14" /></I>;
export const Square = (p) => <I {...p}><rect x="5" y="5" width="14" height="14" rx="1.5" /></I>;
export const FileDoc = (p) => <I {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></I>;
export const PanelLeft = (p) => <I {...p}><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M9.5 4v16" /></I>;
export const Sparkles = (p) => <I {...p}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" /></I>;

/* VC logo mark */
export function VCMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="vcorvV" x1="6" y1="8" x2="22" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8fbcfb" />
          <stop offset="1" stopColor="#3f8ef7" />
        </linearGradient>
      </defs>
      <path d="M2 8.5 L10.5 8.5 L16.5 28.5 L22.5 8.5 L31 8.5 L20.5 41.5 L12.5 41.5 Z" fill="url(#vcorvV)" />
      <path d="M41.2 16.2 A 11.4 11.4 0 1 0 41.2 35.8" stroke="#e8eaf0" strokeWidth="8.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* Google G */
export const GoogleG = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l4-3.1z" />
    <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77z" />
  </svg>
);
