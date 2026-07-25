const { app, BrowserWindow, ipcMain, shell, Menu, session } = require('electron');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

const APP_NAME = 'VCorv';
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
app.setName?.(APP_NAME);

const windows = new Set();
let downloadSequence = 0;

function stateFile() {
  return path.join(app.getPath('userData'), 'browser-state.json');
}

function isSafeWebUrl(rawUrl) {
  try { return ALLOWED_PROTOCOLS.has(new URL(rawUrl).protocol); }
  catch { return false; }
}

function broadcast(channel, payload) {
  for (const window of windows) {
    if (!window.isDestroyed()) window.webContents.send(channel, payload);
  }
}

function googleAccountFromCookies(cookies = []) {
  const byName = new Map(cookies.map((cookie) => [cookie.name, cookie]));
  const signedIn = byName.has('SID') || byName.has('__Secure-1PSID') || byName.has('__Secure-3PSID');
  return { signedIn, hasGoogleSession: signedIn };
}

function configureSession() {
  const browserSession = session.fromPartition('persist:vcorv-browser');
  browserSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(['clipboard-sanitized-write', 'fullscreen', 'notifications'].includes(permission));
  });
  browserSession.cookies.on('changed', (_event, cookie) => {
    if (cookie.domain.includes('google.com')) broadcast('google:account-changed', { changed: true });
  });
  browserSession.on('will-download', (_event, item) => {
    const id = `download-${Date.now()}-${downloadSequence++}`;
    const payload = () => ({ id, filename: item.getFilename(), url: item.getURL(), receivedBytes: item.getReceivedBytes(), totalBytes: item.getTotalBytes(), state: item.getState(), savePath: item.getSavePath() });
    broadcast('download:updated', payload());
    item.on('updated', () => broadcast('download:updated', payload()));
    item.once('done', (_doneEvent, state) => broadcast('download:updated', { ...payload(), state }));
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 675,
    minWidth: 920,
    minHeight: 560,
    title: APP_NAME,
    backgroundColor: '#090a0b',
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 58, y: 15 } }
      : { frame: false }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false
    }
  });

  windows.add(mainWindow);
  mainWindow.once('closed', () => windows.delete(mainWindow));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeWebUrl(url)) mainWindow.webContents.send('browser:new-tab', { url });
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    if (!isSafeWebUrl(params.src)) {
      event.preventDefault();
      return;
    }
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.nodeIntegrationInSubFrames = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.allowRunningInsecureContent = false;
    webPreferences.partition = 'persist:vcorv-browser';
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) console.error(`[ui] ${message} (${sourceId}:${line})`);
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error(`[renderer-gone] ${details.reason} (${details.exitCode})`);
  });

  const devUrl = process.env.VCORV_DEV_URL;
  const uiEntry = process.env.VCORV_LEGACY_UI === '1'
    ? mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
    : devUrl
      ? mainWindow.loadURL(devUrl)
      : mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'ui', 'index.html'));
  uiEntry.then(() => {
    const smokeUrls = String(process.env.VCORV_SMOKE_URLS || '').split(',').map((url) => url.trim()).filter(isSafeWebUrl);
    smokeUrls.forEach((url) => mainWindow.webContents.send('browser:new-tab', { url }));
    if (process.env.VCORV_SMOKE_AI === '1') mainWindow.webContents.send('browser:new-tab', { url: 'vcorv://ai' });
    if (process.env.VCORV_SMOKE_AI_HISTORY === '1') mainWindow.webContents.send('browser:ai-history');
  });
  return mainWindow;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  configureSession();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('window:control', (event, action) => {
  const mainWindow = BrowserWindow.fromWebContents(event.sender);
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  if (action === 'minimize') mainWindow.minimize();
  else if (action === 'maximize') mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  else if (action === 'close') mainWindow.close();
  else return false;
  return true;
});

ipcMain.handle('window:new', () => {
  const win = createWindow();
  win.show();
  return true;
});

ipcMain.handle('shell:open-external', async (_event, url) => {
  if (!isSafeWebUrl(url)) return false;
  await shell.openExternal(url);
  return true;
});

ipcMain.handle('download:show', async (_event, savePath) => {
  if (!savePath) return false;
  shell.showItemInFolder(savePath);
  return true;
});

ipcMain.handle('download:open', async (_event, savePath) => {
  if (!savePath) return false;
  const result = await shell.openPath(savePath);
  return result === '';
});

ipcMain.handle('browser:state-load', async () => {
  try { return JSON.parse(await fs.readFile(stateFile(), 'utf8')); }
  catch { return null; }
});

ipcMain.handle('browser:state-save', async (_event, browserState) => {
  const file = stateFile();
  const temporary = `${file}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(temporary, JSON.stringify(browserState, null, 2), 'utf8');
  await fs.rename(temporary, file);
  return true;
});

ipcMain.handle('google:account-status', async () => {
  const browserSession = session.fromPartition('persist:vcorv-browser');
  const cookies = await browserSession.cookies.get({ domain: '.google.com' });
  return googleAccountFromCookies(cookies);
});

ipcMain.handle('google:sign-out', async () => {
  const browserSession = session.fromPartition('persist:vcorv-browser');
  const cookies = await browserSession.cookies.get({});
  const googleCookies = cookies.filter((cookie) => cookie.domain.includes('google.com') || cookie.domain.includes('youtube.com'));
  await Promise.all(googleCookies.map((cookie) => {
    const host = cookie.domain.replace(/^\./, '');
    return browserSession.cookies.remove(`${cookie.secure ? 'https' : 'http'}://${host}${cookie.path || '/'}`, cookie.name).catch(() => {});
  }));
  broadcast('google:account-changed', { signedIn: false });
  return true;
});

ipcMain.handle('browser:clear-data', async () => {
  const browserSession = session.fromPartition('persist:vcorv-browser');
  await browserSession.clearCache();
  await browserSession.clearStorageData({ storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage'] });
  return true;
});

// ---------- VCorv AI backbone ----------
// Provider chain: explicit endpoint/key -> OpenRouter key -> local Ollama (keyless).
// Streaming SSE from any OpenAI-compatible /chat/completions endpoint.
// ---- BYOK: user AI config stored on disk (userData/ai-config.json) ----
function aiConfigPath() { return path.join(app.getPath('userData'), 'ai-config.json'); }
function loadAiConfig() {
  try { return JSON.parse(fsSync.readFileSync(aiConfigPath(), 'utf8')) || {}; } catch { return {}; }
}
function saveAiConfig(config) {
  try { fsSync.writeFileSync(aiConfigPath(), JSON.stringify(config, null, 2), { mode: 0o600 }); return true; } catch { return false; }
}

const LOCAL_AI = {
  url: (process.env.VCORV_LOCAL_AI_ENDPOINT || 'http://localhost:11434/v1').replace(/\/$/, '') + '/chat/completions',
  key: 'vcorv-local',
  model: process.env.VCORV_LOCAL_AI_MODEL || 'qwen2.5:3b',
  local: true
};

function aiProviders() {
  const providers = [];
  const userConfig = loadAiConfig();
  const explicitEndpoint = userConfig.endpoint || process.env.VCORV_AI_ENDPOINT || process.env.OPENAI_BASE_URL || '';
  const explicitKey = userConfig.apiKey || process.env.VCORV_AI_KEY || process.env.OPENAI_API_KEY || '';
  const openRouterKey = (userConfig.provider === 'openrouter' ? userConfig.apiKey : '') || process.env.OPENROUTER_API_KEY || '';
  if (explicitEndpoint && explicitKey) {
    const base = explicitEndpoint.replace(/\/$/, '');
    providers.push({
      url: /\/chat\/completions$/.test(base) ? base : `${base}/chat/completions`,
      key: explicitKey,
      model: userConfig.model || process.env.VCORV_AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      local: false
    });
  } else if (openRouterKey) {
    providers.push({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKey,
      model: userConfig.model || process.env.VCORV_AI_MODEL || 'openai/gpt-4o-mini',
      local: false,
      openRouter: true
    });
  }
  providers.push(LOCAL_AI);
  return providers;
}

const activeAiRequests = new Map();

async function streamProvider(provider, messages, sender, requestId, signal) {
  const response = await fetch(provider.url, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${provider.key}`,
      ...(provider.openRouter ? { 'HTTP-Referer': 'https://vcorv.com', 'X-Title': 'VCorv Browser' } : {})
    },
    body: JSON.stringify({ model: provider.model, messages, temperature: 0.6, max_tokens: 1200, stream: true })
  });
  if (!response.ok || !response.body) throw new Error(`ai-http-${response.status}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let emitted = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (delta) {
          emitted = true;
          if (!sender.isDestroyed()) sender.send('ai:stream', { requestId, delta });
        }
      } catch { /* partial frame */ }
    }
  }
  if (!emitted) throw new Error('ai-empty-stream');
}

ipcMain.handle('ai:chat', async (event, payload = {}) => {
  const requestId = String(payload.requestId || `ai-${Date.now()}`);
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const sender = event.sender;
  const controller = new AbortController();
  activeAiRequests.set(requestId, controller);
  const providers = aiProviders();
  let lastError = 'ai-no-provider';
  try {
    for (const provider of providers) {
      if (controller.signal.aborted) return { ok: false, aborted: true };
      const timeout = setTimeout(() => controller.abort(), provider.local ? 120000 : 60000);
      try {
        await streamProvider(provider, messages, sender, requestId, controller.signal);
        return { ok: true, provider: provider.local ? 'local' : 'cloud', model: provider.model };
      } catch (error) {
        lastError = String(error?.message || error);
        if (controller.signal.aborted) return { ok: false, aborted: true };
        console.warn(`[vcorv-ai] provider failed (${provider.model}): ${lastError}`);
      } finally {
        clearTimeout(timeout);
      }
    }
    return { ok: false, code: lastError };
  } finally {
    activeAiRequests.delete(requestId);
  }
});

ipcMain.handle('ai:abort', (_event, requestId) => {
  activeAiRequests.get(String(requestId))?.abort();
  return true;
});

ipcMain.handle('ai:config-get', async () => {
  const config = loadAiConfig();
  return {
    provider: config.provider || '',
    endpoint: config.endpoint || '',
    model: config.model || '',
    hasKey: Boolean(config.apiKey),
    keyHint: config.apiKey ? `••••${String(config.apiKey).slice(-4)}` : ''
  };
});

ipcMain.handle('ai:config-set', async (_event, patch = {}) => {
  const config = loadAiConfig();
  if (typeof patch.provider === 'string') config.provider = patch.provider.slice(0, 40);
  if (typeof patch.endpoint === 'string') config.endpoint = patch.endpoint.trim().slice(0, 300);
  if (typeof patch.model === 'string') config.model = patch.model.trim().slice(0, 120);
  if (typeof patch.apiKey === 'string' && patch.apiKey.trim()) config.apiKey = patch.apiKey.trim().slice(0, 300);
  if (patch.clearKey) delete config.apiKey;
  return saveAiConfig(config);
});

ipcMain.handle('ai:status', async () => {
  const providers = aiProviders();
  const cloud = providers.some((provider) => !provider.local);
  let localReady = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(LOCAL_AI.url.replace('/chat/completions', '/models'), { signal: controller.signal });
    clearTimeout(timeout);
    localReady = response.ok;
  } catch { /* ollama down */ }
  return { cloud, localReady, localModel: LOCAL_AI.model };
});
