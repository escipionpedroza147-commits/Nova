export const SPACE_COLORS = ['#6f9df1', '#8bd17c', '#e6a23c', '#d67ab1', '#9b8cf0', '#5fc9c2', '#f0708a'];

export const APP_CATALOG = [
  { name: 'Gmail', url: 'https://mail.google.com' }, { name: 'Calendar', url: 'https://calendar.google.com' },
  { name: 'Drive', url: 'https://drive.google.com' }, { name: 'Docs', url: 'https://docs.google.com' },
  { name: 'Notion', url: 'https://www.notion.so' }, { name: 'Slack', url: 'https://app.slack.com' },
  { name: 'Discord', url: 'https://discord.com/app' }, { name: 'WhatsApp', url: 'https://web.whatsapp.com' },
  { name: 'Telegram', url: 'https://web.telegram.org' }, { name: 'Messenger', url: 'https://www.messenger.com' },
  { name: 'Instagram', url: 'https://www.instagram.com' }, { name: 'X', url: 'https://x.com' },
  { name: 'TikTok', url: 'https://www.tiktok.com' }, { name: 'YouTube', url: 'https://www.youtube.com' },
  { name: 'Spotify', url: 'https://open.spotify.com' }, { name: 'Reddit', url: 'https://www.reddit.com' },
  { name: 'GitHub', url: 'https://github.com' }, { name: 'ChatGPT', url: 'https://chatgpt.com' },
  { name: 'Figma', url: 'https://www.figma.com' }, { name: 'Canva', url: 'https://www.canva.com' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com' }, { name: 'Netflix', url: 'https://www.netflix.com' },
  { name: 'Amazon', url: 'https://www.amazon.com' }, { name: 'Twitch', url: 'https://www.twitch.tv' }
];

export const pickApps = (names) => names.map((name) => APP_CATALOG.find((app) => app.name === name)).filter(Boolean).map((app) => ({ ...app }));

export const APP_CATEGORIES = {
  All: () => true,
  Google: (app) => ['Gmail', 'Calendar', 'Drive', 'Docs', 'YouTube'].includes(app.name),
  Social: (app) => ['Discord', 'WhatsApp', 'Telegram', 'Messenger', 'Instagram', 'X', 'TikTok', 'Reddit'].includes(app.name),
  Work: (app) => ['Gmail', 'Calendar', 'Drive', 'Docs', 'Notion', 'Slack', 'GitHub', 'ChatGPT', 'Figma', 'Canva', 'LinkedIn'].includes(app.name),
  Media: (app) => ['YouTube', 'Spotify', 'Netflix', 'Twitch', 'TikTok'].includes(app.name)
};

export const LEGACY_ICON_MAP = { '🏠': 'home', '💼': 'briefcase', '📚': 'book', '🎮': 'controller', '❤️': 'heart', '⭐': 'star', '🔥': 'flame', '📁': 'folder', '⚡': 'bolt', '🎓': 'cap', '💬': 'chat', '🎨': 'palette', '✦': 'star' };

export const SPACE_ICONS = {
  home: 'M3.5 10.4 12 3.8l8.5 6.6V19a1.5 1.5 0 0 1-1.5 1.5h-4.5V14a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v6.5H5A1.5 1.5 0 0 1 3.5 19v-8.6Z',
  briefcase: 'M8.5 7V5.8A1.8 1.8 0 0 1 10.3 4h3.4a1.8 1.8 0 0 1 1.8 1.8V7M5 7h14a1.8 1.8 0 0 1 1.8 1.8v9.4A1.8 1.8 0 0 1 19 20H5a1.8 1.8 0 0 1-1.8-1.8V8.8A1.8 1.8 0 0 1 5 7Zm-1.8 5.5h17.6',
  book: 'M4.5 19.2V6a2 2 0 0 1 2-2H19.5v14.5H6.7a2.2 2.2 0 0 0 0 4.4h12.8M6.7 18.5H19.5',
  controller: 'M7 9h10a4 4 0 0 1 4 4.5l-.6 3a2.4 2.4 0 0 1-4.2 1L15 16H9l-1.2 1.5a2.4 2.4 0 0 1-4.2-1l-.6-3A4 4 0 0 1 7 9Zm1 2.5v3M6.5 13h3m4.5.5h.01M17 11.5h.01',
  heart: 'M12 19.5s-7-4.5-7-9.5a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5-7 9.5-7 9.5Z',
  star: 'm12 4.5 2.2 4.6 5 .7-3.6 3.6.8 5.1L12 16l-4.4 2.5.8-5.1L4.8 9.8l5-.7L12 4.5Z',
  flame: 'M12 20a6 6 0 0 1-6-6c0-3 2.5-5.5 4-8 .5 2 1.5 3 3 4 1.8 1.2 3 3 3 5a4.5 4.5 0 0 1-4 5Z',
  folder: 'M4 7a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z',
  bolt: 'M13 3.5 5.5 13H11l-.5 7.5L18 11h-5.5l.5-7.5Z',
  cap: 'm12 5 9 4-9 4-9-4 9-4Zm-5.5 6.5v4c0 1 2.5 2.5 5.5 2.5s5.5-1.5 5.5-2.5v-4',
  chat: 'M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8a1.5 1.5 0 0 1-1.5 1.5H9L4.5 20V7A1.5 1.5 0 0 1 6 5.5Z',
  palette: 'M12 4a8 8 0 0 0 0 16c1.2 0 2-.8 2-2 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.3 0-1 .8-1.8 1.8-1.8H16a4.5 4.5 0 0 0 4.5-4.5C20.5 6 16.6 4 12 4Zm-4 8.5h.01M9.5 8.5h.01m5 0h.01'
};

export const SPACE_TEMPLATES = [
  { name: 'Blank', icon: 'star', desc: 'Start fresh', apps: [] },
  { name: 'Personal', icon: 'home', desc: 'Everyday browsing', apps: pickApps(['Gmail', 'YouTube', 'Spotify', 'WhatsApp', 'Amazon']) },
  { name: 'Work', icon: 'briefcase', desc: 'Get things done', apps: pickApps(['Gmail', 'Calendar', 'Drive', 'Slack', 'Notion', 'LinkedIn']) },
  { name: 'School', icon: 'cap', desc: 'Study setup', apps: pickApps(['Gmail', 'Calendar', 'Docs', 'Drive', 'ChatGPT']) },
  { name: 'Social', icon: 'chat', desc: 'Stay connected', apps: pickApps(['Instagram', 'X', 'TikTok', 'Discord', 'Reddit', 'Messenger']) },
  { name: 'Creator', icon: 'palette', desc: 'Design & content', apps: pickApps(['YouTube', 'Figma', 'Canva', 'Notion', 'X', 'Twitch']) },
  { name: 'Dev', icon: 'bolt', desc: 'Build software', apps: pickApps(['GitHub', 'ChatGPT', 'Reddit', 'Notion', 'Slack']) }
];
