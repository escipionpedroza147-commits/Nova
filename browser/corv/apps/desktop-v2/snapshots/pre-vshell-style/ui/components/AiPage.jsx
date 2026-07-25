import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store.js';
import { sendAiMessage, abortAiMessage } from '../lib/ai.js';
import { SearchIcon, HistoryIcon } from './icons.jsx';

function timeLabel(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const days = Math.floor((now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
  if (days <= 0) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function groupChats(chats) {
  const groups = [];
  const byGroup = new Map();
  for (const chat of chats) {
    const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(chat.updatedAt || chat.createdAt).setHours(0, 0, 0, 0)) / 86400000);
    const label = days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 7 ? 'Previous 7 days' : 'Older';
    if (!byGroup.has(label)) { byGroup.set(label, []); groups.push({ group: label, items: byGroup.get(label) }); }
    byGroup.get(label).push(chat);
  }
  return groups;
}

export default function AiPage() {
  const historyOpen = useStore((s) => s.aiHistoryOpen);
  const aiChats = useStore((s) => s.aiChats);
  const activeAiChatId = useStore((s) => s.activeAiChatId);
  const aiStreaming = useStore((s) => s.aiStreaming);
  const store = useStore.getState;
  const [prompt, setPrompt] = useState('');
  const [query, setQuery] = useState('');
  const composerRef = useRef(null);
  const threadRef = useRef(null);

  const activeChat = aiChats.find((chat) => chat.id === activeAiChatId) || null;
  const hasThread = Boolean(activeChat?.messages?.length);

  useEffect(() => { composerRef.current?.focus(); }, [activeAiChatId]);
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [activeChat?.messages]);

  const recents = useMemo(() => aiChats.slice(0, 3), [aiChats]);
  const grouped = useMemo(() => groupChats(aiChats), [aiChats]);

  const submit = () => {
    const value = prompt.trim();
    if (!value || aiStreaming) return;
    setPrompt('');
    sendAiMessage(value);
  };

  const composer = (
    <form className="ai-composer" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <textarea
        ref={composerRef} rows="2"
        placeholder={hasThread ? 'Reply to VCorv AI...' : 'Ask VCorv anything...'}
        aria-label="Ask VCorv anything" value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }}
      />
      <footer>
        <div className="ai-tools">
          {hasThread && <button type="button" onClick={() => store().newAiChat()}><span>＋</span> New chat</button>}
          <button type="button" onClick={() => { setPrompt('Summarize this page'); composerRef.current?.focus(); }}><span>▤</span> Summarize page</button>
        </div>
        <div className="ai-submit-controls">
          {aiStreaming
            ? <button className="ai-send ai-stop" type="button" aria-label="Stop" onClick={() => abortAiMessage()}>◼</button>
            : <button className="ai-send" type="submit" aria-label="Send">↑</button>}
        </div>
      </footer>
    </form>
  );

  return (
    <section className="corv-ai-page" aria-label="Corv AI">
      <button
        type="button" className="ai-history-button" aria-label="Chat history" title="Chat history"
        onClick={() => store().setAiHistoryOpen(!historyOpen)}
      >
        <HistoryIcon />
        <span>History</span>
      </button>

      {hasThread ? (
        <main className="ai-workspace ai-thread-mode">
          <div className="ai-thread" ref={threadRef}>
            {activeChat.messages.map((msg, index) => (
              <div key={index} className={`ai-message ai-message-${msg.role}${msg.failed ? ' ai-message-failed' : ''}`}>
                {msg.role === 'assistant' && msg.pending && !msg.content
                  ? <span className="ai-thinking"><span /><span /><span /></span>
                  : <div className="ai-message-body">{msg.content}</div>}
              </div>
            ))}
          </div>
          {composer}
        </main>
      ) : (
        <main className="ai-workspace">
          <header className="ai-hero">
            <h1><span>VCorv</span> <em>AI</em></h1>
            <p>Ask anything.</p>
          </header>
          {composer}
          <div className="ai-prompts" aria-label="Prompt suggestions">
            {['Summarize this page', 'Explain this topic', 'Brainstorm ideas', 'Write an email'].map((text) => (
              <button key={text} type="button" onClick={() => { setPrompt(text); composerRef.current?.focus(); }}>{text}</button>
            ))}
          </div>
          {recents.length > 0 && (
            <section className="recent-chats">
              <header><span>Recent chats</span><button type="button" onClick={() => store().setAiHistoryOpen(true)}>View all</button></header>
              {recents.map((chat) => (
                <button key={chat.id} type="button" className="recent-chat" onClick={() => store().openAiChat(chat.id)}>
                  <strong>{chat.title}</strong><time>{timeLabel(chat.updatedAt)}</time>
                </button>
              ))}
            </section>
          )}
        </main>
      )}

      <AnimatePresence>
        {historyOpen && (
          <motion.aside
            className="ai-history-panel" aria-label="All chats"
            initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          >
            <header>
              <div><strong>Chat history</strong><span>All your VCorv AI conversations</span></div>
              <button type="button" aria-label="Close chat history" onClick={() => store().setAiHistoryOpen(false)}>×</button>
            </header>
            <label className="ai-history-search">
              <SearchIcon /><input type="search" placeholder="Search chats" aria-label="Search chats" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <div className="ai-history-list">
              {aiChats.length === 0 && <p className="ai-history-empty">No chats yet. Ask VCorv anything to start one.</p>}
              {grouped.map((group) => {
                const items = group.items.filter((chat) => chat.title.toLowerCase().includes(query.trim().toLowerCase()));
                if (!items.length) return null;
                return (
                  <React.Fragment key={group.group}>
                    <p>{group.group}</p>
                    {items.map((chat) => (
                      <div key={chat.id} className="history-chat-row">
                        <button type="button" className="history-chat" onClick={() => store().openAiChat(chat.id)}>
                          <span>▢</span><strong>{chat.title}</strong><time>{timeLabel(chat.updatedAt)}</time>
                        </button>
                        <button type="button" className="history-chat-delete" aria-label="Delete chat" onClick={() => store().deleteAiChat(chat.id)}>×</button>
                      </div>
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </section>
  );
}
