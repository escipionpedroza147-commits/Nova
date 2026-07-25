import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.js';
import { Sparkles, Mic, X, ClockIcon, SearchIcon, FileDoc } from './icons.jsx';

/* tiny inline icons for the composer row */
const Paperclip = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
);
const ImageIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></svg>
);
const GlobeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" /></svg>
);
const AtIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></svg>
);
const SendIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 20.85 12.9a1 1 0 0 0 0-1.8L3.4 3.6a1 1 0 0 0-1.4 1.06L3 10l9 2-9 2-1 5.34a1 1 0 0 0 1.4 1.06z" /></svg>
);
const PenIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
);
const BulbIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z" /></svg>
);
const TabsIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="13" height="13" rx="2" /><path d="M8 3h11a2 2 0 0 1 2 2v11" /></svg>
);
const DocIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></svg>
);

const CHIPS = [
  { icon: DocIcon, label: 'Summarize this page', prompt: 'Summarize the key points of the page I\u2019m currently reading.' },
  { icon: TabsIcon, label: 'Compare these tabs', prompt: 'Compare the pages I have open and highlight the differences.' },
  { icon: BulbIcon, label: 'Give me key takeaways', prompt: 'Give me the key takeaways from this content.' },
  { icon: PenIcon, label: 'Help me write', prompt: 'Help me write ' },
];

const CHAT_ICONS = [FileDoc, SearchIcon, GlobeIcon, BulbIcon, PenIcon, TabsIcon];

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

let reqSeq = 0;

export default function AiPage() {
  const aiChats = useStore((s) => s.aiChats);
  const upsertAiChat = useStore((s) => s.upsertAiChat);
  const removeAiChat = useStore((s) => s.removeAiChat);

  const [chat, setChat] = useState(null); // { id, title, messages, time } | null = home
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef({ requestId: null, text: '' });
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const unsub = window.vcorv?.onAiStream?.(({ requestId, delta }) => {
      if (requestId !== streamRef.current.requestId) return;
      streamRef.current.text += delta;
      setChat((c) => {
        if (!c) return c;
        const messages = [...c.messages];
        const last = messages[messages.length - 1];
        if (last?.role === 'assistant') messages[messages.length - 1] = { ...last, content: streamRef.current.text };
        return { ...c, messages };
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat?.messages]);

  const send = async (text) => {
    const content = String(text ?? input).trim();
    if (!content || streaming) return;
    setInput('');

    const base = chat || {
      id: `chat-${Date.now()}`,
      title: content.slice(0, 48),
      messages: [],
      time: Date.now(),
    };
    const messages = [...base.messages, { role: 'user', content }, { role: 'assistant', content: '' }];
    const next = { ...base, messages, time: Date.now() };
    setChat(next);
    setStreaming(true);

    const requestId = `ui-${Date.now()}-${reqSeq++}`;
    streamRef.current = { requestId, text: '' };

    const history = messages.slice(0, -1).map(({ role, content: c }) => ({ role, content: c }));
    const result = await window.vcorv?.aiChat?.({
      requestId,
      messages: [
        { role: 'system', content: 'You are Corv AI, the assistant built into the VCorv browser. Be concise, direct, and helpful.' },
        ...history,
      ],
    });

    setStreaming(false);
    setChat((c) => {
      if (!c) return c;
      const msgs = [...c.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant' && !last.content) {
        msgs[msgs.length - 1] = {
          ...last,
          content: result?.ok === false
            ? '⚠️ No AI provider available. Add an API key in settings, or run Ollama locally (ollama serve).'
            : last.content,
        };
      }
      const done = { ...c, messages: msgs, time: Date.now() };
      upsertAiChat(done);
      return done;
    });
  };

  const stop = () => {
    if (streamRef.current.requestId) window.vcorv?.aiAbort?.(streamRef.current.requestId);
    setStreaming(false);
  };

  const composer = (
    <div className="aiComposer">
      <textarea
        ref={inputRef}
        value={input}
        placeholder="Ask Corv anything..."
        rows={1}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
        }}
      />
      <div className="aiComposerBar">
        <div className="aiTools">
          <button title="Attach file"><Paperclip /></button>
          <button title="Attach image"><ImageIcon /></button>
          <button title="Search the web"><GlobeIcon /></button>
          <button title="Mention a tab"><AtIcon /></button>
        </div>
        <div className="aiToolsRight">
          <button title="Voice input"><Mic size={17} /></button>
          {streaming ? (
            <button className="aiSend stop" title="Stop" onClick={stop}><X size={15} /></button>
          ) : (
            <button className="aiSend" title="Send" disabled={!input.trim()} onClick={() => send()}><SendIcon size={15} /></button>
          )}
        </div>
      </div>
    </div>
  );

  /* ---------- conversation view ---------- */
  if (chat) {
    return (
      <div className="aiPage">
        <div className="aiConvoHead">
          <button className="aiBack" onClick={() => { if (!streaming) setChat(null); }}>
            ← <span>All chats</span>
          </button>
          <b className="aiConvoTitle">{chat.title}</b>
        </div>
        <div className="aiConvo" ref={scrollRef}>
          {chat.messages.map((m, i) => (
            <div key={i} className={`aiMsg ${m.role}`}>
              {m.role === 'assistant' && <span className="aiMsgMark"><Sparkles size={14} /></span>}
              <div className="aiMsgBody">
                {m.content || (streaming && i === chat.messages.length - 1 ? <span className="aiThinking"><i /><i /><i /></span> : '')}
              </div>
            </div>
          ))}
        </div>
        <div className="aiConvoComposer">{composer}</div>
      </div>
    );
  }

  /* ---------- home view ---------- */
  return (
    <div className="aiPage home">
      <div className="aiHero">
        <span className="aiSpark"><Sparkles size={30} /></span>
        <h1>Welcome to <em>Corv AI</em></h1>
        <p>Ask anything. Get answers, summaries, and insights<br />based on the web and your tabs.</p>
      </div>

      {composer}

      <div className="aiChips">
        {CHIPS.map(({ icon: Icon, label, prompt }) => (
          <button key={label} className="aiChip" onClick={() => { if (label === 'Help me write') { setInput(prompt); inputRef.current?.focus(); } else send(prompt); }}>
            <Icon /> {label}
          </button>
        ))}
      </div>

      {aiChats.length > 0 && (
        <div className="aiRecent">
          <div className="aiRecentHead">
            <b>Recent chats</b>
            <button className="aiViewAll">View all</button>
          </div>
          <div className="aiRecentGrid">
            {aiChats.slice(0, 6).map((c, i) => {
              const Icon = CHAT_ICONS[i % CHAT_ICONS.length];
              const sub = c.messages.find((m) => m.role === 'assistant' && m.content)?.content || '';
              return (
                <div key={c.id} className="aiRecentRow" onClick={() => setChat(c)}>
                  <span className="aiRecentIcon"><Icon size={16} /></span>
                  <span className="aiRecentText">
                    <b>{c.title}</b>
                    <em>{sub.slice(0, 60)}</em>
                  </span>
                  <span className="aiRecentTime">{timeAgo(c.time)}</span>
                  <button
                    className="aiRecentX"
                    title="Delete chat"
                    onClick={(e) => { e.stopPropagation(); removeAiChat(c.id); }}
                  ><X size={13} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
