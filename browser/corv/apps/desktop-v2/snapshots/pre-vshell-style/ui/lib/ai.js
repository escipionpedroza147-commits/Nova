// VCorv AI client — streaming chat over the ai:chat IPC bridge with
// provider fallback handled in the main process. This module owns the
// chat lifecycle: build context, stream tokens into the store, never
// surface raw errors to the user.
import { useStore } from '../store.js';
import { activeView } from './webviews.js';
import { isNewTab, domainLabel } from './util.js';

const id = (prefix = 'chat') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const FRIENDLY_FAIL = "I couldn't reach a model just now. Your question is saved in this chat — try again in a moment.";

let streamUnsub = null;
let currentRequestId = '';

function ensureStreamListener() {
  if (streamUnsub) return;
  streamUnsub = window.vcorv?.onAiStream?.((payload) => {
    if (!payload || payload.requestId !== currentRequestId) return;
    const s = useStore.getState();
    const chat = s.aiChats.find((item) => item.id === s.activeAiChatId);
    if (!chat) return;
    const lastIndex = chat.messages.length - 1;
    const last = chat.messages[lastIndex];
    if (!last || last.role !== 'assistant') return;
    s.patchAiMessage(chat.id, lastIndex, { content: (last.content || '') + payload.delta, pending: false });
  });
}

async function capturePageContext() {
  const s = useStore.getState();
  const tab = s.tabs.find((item) => item.id === s.activeId);
  if (!tab || isNewTab(tab.url)) return null;
  const view = activeView();
  if (!view) return { url: tab.url, title: tab.title || domainLabel(tab.url), excerpt: '' };
  try {
    const captured = await view.executeJavaScript(`(() => {
      const meta = document.querySelector('meta[name="description"]')?.content || '';
      const selection = String(window.getSelection?.() || '').slice(0, 1200);
      const body = (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 2400);
      return { title: document.title || '', description: meta.slice(0, 300), selection, excerpt: body };
    })()`, true);
    return { url: tab.url, title: captured?.title || tab.title, ...captured };
  } catch {
    return { url: tab.url, title: tab.title || domainLabel(tab.url), excerpt: '' };
  }
}

function buildMessages(chat, pageContext) {
  const s = useStore.getState();
  const tabs = s.tabs
    .filter((tab) => tab.spaceId === s.activeSpaceId && !isNewTab(tab.url))
    .slice(0, 10)
    .map((tab) => `- ${tab.title || domainLabel(tab.url)} (${tab.url})`)
    .join('\n');
  const contextLines = [];
  if (pageContext?.url) {
    contextLines.push(`Current page: ${pageContext.title || ''} — ${pageContext.url}`);
    if (pageContext.description) contextLines.push(`Page description: ${pageContext.description}`);
    if (pageContext.selection) contextLines.push(`User's selected text: ${pageContext.selection}`);
    if (pageContext.excerpt) contextLines.push(`Page content excerpt: ${pageContext.excerpt}`);
  }
  if (tabs) contextLines.push(`Open tabs in this space:\n${tabs}`);
  const system = {
    role: 'system',
    content: 'You are VCorv AI, the built-in assistant of the VCorv browser. Be direct, useful, and concise. Answer the actual question first. Use the provided page and tab context when relevant, but do not mention it unless useful. Never expose errors, keys, or implementation details. Format with short paragraphs or tight lists; no filler.'
  };
  const history = chat.messages
    .filter((msg) => !msg.pending && msg.content)
    .slice(-16)
    .map((msg) => ({ role: msg.role, content: String(msg.content).slice(0, 4000) }));
  if (contextLines.length && history.length) {
    const lastUser = history.length - 1;
    history[lastUser] = { ...history[lastUser], content: `${history[lastUser].content}\n\n[Browser context]\n${contextLines.join('\n')}` };
  }
  return [system, ...history];
}

export async function sendAiMessage(text) {
  const value = String(text || '').trim();
  if (!value) return;
  const s = useStore.getState();
  if (s.aiStreaming) return;
  ensureStreamListener();

  // Find or create the active chat
  let chat = s.aiChats.find((item) => item.id === s.activeAiChatId);
  if (!chat) {
    chat = { id: id(), title: value.slice(0, 60), createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
    useStore.setState({ activeAiChatId: chat.id });
  }
  chat = {
    ...chat,
    updatedAt: Date.now(),
    messages: [...chat.messages, { role: 'user', content: value }, { role: 'assistant', content: '', pending: true }]
  };
  s.upsertAiChat(chat);
  s.setAiStreaming(true);

  const pageContext = await capturePageContext();
  const messages = buildMessages(chat, pageContext);
  currentRequestId = id('req');

  try {
    const result = await window.vcorv?.aiChat?.({ requestId: currentRequestId, messages });
    const latest = useStore.getState();
    const liveChat = latest.aiChats.find((item) => item.id === chat.id);
    const lastIndex = (liveChat?.messages.length || 1) - 1;
    if (!result?.ok && liveChat) {
      const last = liveChat.messages[lastIndex];
      if (!last?.content) latest.patchAiMessage(chat.id, lastIndex, { content: FRIENDLY_FAIL, pending: false, failed: true });
    } else if (liveChat) {
      latest.patchAiMessage(chat.id, lastIndex, { pending: false });
    }
  } catch {
    const latest = useStore.getState();
    const liveChat = latest.aiChats.find((item) => item.id === chat.id);
    if (liveChat) {
      const lastIndex = liveChat.messages.length - 1;
      if (!liveChat.messages[lastIndex]?.content) latest.patchAiMessage(chat.id, lastIndex, { content: FRIENDLY_FAIL, pending: false, failed: true });
    }
  } finally {
    useStore.getState().setAiStreaming(false);
    useStore.getState().scheduleSave();
    currentRequestId = '';
  }
}

export function abortAiMessage() {
  if (currentRequestId) window.vcorv?.aiAbort?.(currentRequestId);
}
