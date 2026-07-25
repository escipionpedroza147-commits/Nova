import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUi } from '../uiBus.js';
import { activeView, onFoundInPage } from '../lib/webviews.js';

export default function FindBar() {
  const open = useUi((s) => s.findOpen);
  const ui = useUi.getState;
  const [count, setCount] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { onFoundInPage((result) => setCount(result.matches ? `${result.activeMatchOrdinal}/${result.matches}` : '0/0')); }, []);
  useEffect(() => { if (open) { inputRef.current?.focus(); inputRef.current?.select(); } else { activeView()?.stopFindInPage('clearSelection'); setCount(''); } }, [open]);

  const run = (forward = true) => {
    const view = activeView(); const text = inputRef.current?.value;
    if (view && text) view.findInPage(text, { forward, findNext: true });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          className="find-bar"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16, ease: [0.33, 1, 0.68, 1] }}
        >
          <input ref={inputRef} placeholder="Find in page" aria-label="Find in page" onInput={() => run(true)}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); run(!event.shiftKey); } }} />
          <span>{count}</span>
          <button type="button" aria-label="Previous match" onClick={() => run(false)}>↑</button>
          <button type="button" aria-label="Next match" onClick={() => run(true)}>↓</button>
          <button type="button" aria-label="Close find" onClick={() => ui().setFindOpen(false)}>×</button>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
