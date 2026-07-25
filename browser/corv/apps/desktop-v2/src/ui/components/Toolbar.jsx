import React, { useEffect, useRef, useState } from 'react';
import { useStore, NEW_TAB, AI_TAB } from '../store.js';
import { ArrowLeft, ArrowRight, RotateCw, Star, DownloadIcon, MoreVertical, GoogleG, VCMark, PanelLeft } from './icons.jsx';
import { goBack, goForward, reload } from '../lib/webviews.js';

export default function Toolbar({ railHidden, onToggleRail }) {
  const tabs = useStore((s) => s.tabs);
  const activeId = useStore((s) => s.activeId);
  const navigate = useStore((s) => s.navigate);
  const tab = tabs.find((t) => t.id === activeId);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const isAi = tab?.url === AI_TAB;

  useEffect(() => {
    if (!focused) setValue(tab ? (tab.url === NEW_TAB ? '' : isAi ? 'corv://ai' : tab.url) : '');
  }, [tab?.url, tab?.id, focused, isAi]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const submit = () => {
    if (!tab || !value.trim()) return;
    navigate(tab.id, value);
    inputRef.current?.blur();
  };

  return (
    <div className="toolbar dragRegion">
      <div className="navBtns noDrag">
        <button className={railHidden ? '' : 'panelOn'} onClick={onToggleRail} title={railHidden ? 'Show sidebar' : 'Hide sidebar'}><PanelLeft size={17} /></button>
        <button disabled={!tab?.canGoBack} onClick={() => goBack(activeId)} title="Back"><ArrowLeft size={17} /></button>
        <button disabled={!tab?.canGoForward} onClick={() => goForward(activeId)} title="Forward"><ArrowRight size={17} /></button>
        <button onClick={() => tab?.url !== NEW_TAB && reload(activeId)} title="Reload"><RotateCw size={15} /></button>
      </div>
      <div className={`omnibox noDrag ${focused ? 'focused' : ''}`}>
        <span className="omniIcon">{isAi ? <VCMark size={15} /> : <GoogleG size={15} />}</span>
        <input
          ref={inputRef}
          value={value}
          placeholder="Search Google or type a URL"
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => { setFocused(true); e.target.select(); }}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') { setValue(tab?.url !== NEW_TAB ? tab.url : ''); inputRef.current?.blur(); }
          }}
          spellCheck={false}
        />
        <button className="omniStar" title="Bookmark"><Star size={15} /></button>
      </div>
      <div className="toolActions noDrag">
        <button title="Downloads"><DownloadIcon size={17} /></button>
        <button title="Menu"><MoreVertical size={17} /></button>
      </div>
    </div>
  );
}
