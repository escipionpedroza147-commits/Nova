const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, callback) {
  if (typeof callback !== 'function') return () => {};
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('vcorv', {
  platform: process.platform,
  windowControl: (action) => ipcRenderer.invoke('window:control', action),
  newWindow: () => ipcRenderer.invoke('window:new'),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  showDownload: (savePath) => ipcRenderer.invoke('download:show', savePath),
  openDownload: (savePath) => ipcRenderer.invoke('download:open', savePath),
  loadBrowserState: () => ipcRenderer.invoke('browser:state-load'),
  saveBrowserState: (state) => ipcRenderer.invoke('browser:state-save', state),
  clearBrowsingData: () => ipcRenderer.invoke('browser:clear-data'),
  googleAccountStatus: () => ipcRenderer.invoke('google:account-status'),
  googleSignOut: () => ipcRenderer.invoke('google:sign-out'),
  onGoogleAccountChanged: (callback) => subscribe('google:account-changed', callback),
  aiChat: (payload) => ipcRenderer.invoke('ai:chat', payload),
  aiAbort: (requestId) => ipcRenderer.invoke('ai:abort', requestId),
  aiStatus: () => ipcRenderer.invoke('ai:status'),
  aiConfigGet: () => ipcRenderer.invoke('ai:config-get'),
  aiConfigSet: (patch) => ipcRenderer.invoke('ai:config-set', patch),
  onAiStream: (callback) => subscribe('ai:stream', callback),
  onBrowserNewTab: (callback) => subscribe('browser:new-tab', callback),
  onAiHistory: (callback) => subscribe('browser:ai-history', callback),
  onDownloadUpdated: (callback) => subscribe('download:updated', callback)
});
