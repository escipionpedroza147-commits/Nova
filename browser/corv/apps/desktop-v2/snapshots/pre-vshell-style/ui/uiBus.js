// Lightweight UI-chrome state: overlays, menus, dialogs, find bar.
import { create } from 'zustand';

let dialogResolve = null;

export const useUi = create((set, get) => ({
  contextMenu: null,            // { x, y, items }
  popover: '',                  // 'account' | 'settings' | 'menu' | 'bookmarks' | 'downloads'
  appPickerOpen: false,
  appPickerMode: 'space',       // 'space' | 'draft'
  spaceModalOpen: false,
  findOpen: false,
  dialog: null,                 // { title, subtitle, fields, confirmLabel, danger }

  openContextMenu(x, y, items) { set({ contextMenu: { x, y, items } }); },
  closeContextMenu() { set({ contextMenu: null }); },
  setPopover(name) { set({ popover: get().popover === name ? '' : name }); },
  closePopovers() { set({ popover: '' }); },
  openAppPicker(mode = 'space') { set({ appPickerOpen: true, appPickerMode: mode }); },
  closeAppPicker() { set({ appPickerOpen: false }); },
  openSpaceModal() { set({ spaceModalOpen: true }); },
  closeSpaceModal() { set({ spaceModalOpen: false }); },
  setFindOpen(open) { set({ findOpen: open }); },

  openDialog(config) {
    if (dialogResolve) dialogResolve(null);
    return new Promise((resolve) => { dialogResolve = resolve; set({ dialog: config }); });
  },
  settleDialog(result) {
    if (dialogResolve) { const resolve = dialogResolve; dialogResolve = null; resolve(result); }
    set({ dialog: null });
  }
}));
