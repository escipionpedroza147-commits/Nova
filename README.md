<h1 align="center">VCorv Browser</h1>

<p align="center">
  <strong>An AI-native workspace browser built for focus.</strong>
</p>

<p align="center">
  <a href="https://vcorv.com">Website</a> •
  <a href="browser/corv/">Browser Source</a> •
  <a href="#-quick-start">Quick Start</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS-blue" alt="Platform">
  <img src="https://img.shields.io/badge/built%20with-Electron-9cf" alt="Electron">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

**VCorv Browser** is an AI-native workspace browser. Instead of an endless strip of tabs, it organizes your work into **spaces**, **apps**, and **isolated accounts** — with a workspace-aware AI that understands what you're working on.

## ✨ What Makes It Different

- 🗂 **Spaces** — separate work areas for projects, research, finance, learning, and company work. Each space keeps its own tabs and context.
- 📌 **Apps** — pinned web apps and shortcuts that stay close to the work.
- 👥 **Accounts** — isolated sessions so work, personal, and client contexts never collide.
- 🧭 **Tabs that remember** — browser-first navigation with persistent workspace context.
- 🤖 **Corv AI** — page-aware and workspace-aware chat that can summarize, research, plan, and help execute.

## 🚀 Quick Start

```bash
git clone https://github.com/ScipionT2/corv-chat.git
cd corv-chat/browser/corv
npm install
npm start
```

## 🏗 Repository Shape

```
browser/corv/
├── apps/desktop        # Electron desktop browser shell
├── apps/desktop-v2     # Next-gen shell (slim rail, workspaces + apps)
├── apps/extension      # Chrome/Edge Manifest V3 companion extension
├── apps/website        # Landing/download site
└── packages/core       # Shared workspace/app/account defaults and helpers
```

The repository also contains legacy Nova assistant code (`src/`, `desktop/`) that VCorv Browser evolved from; active development happens under `browser/corv/`.

## 🎨 Brand

- Premium black/ivory visual system with a classical pillar mark.
- Spaced serif **CORV** wordmark.
- Tagline: **Software that empowers focus.**

Brand assets live in `browser/corv/assets/brand/corv/`.

## 🏢 Built by VCorv

VCorv Browser is built by [VCorv](https://vcorv.com) — a technology company building tools for the AI era.

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
