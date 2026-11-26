'use strict';

const MENU_ID = 'google-search-open-default';
const DEFAULTS = {
  targetDomains: [], // 按优先顺序排列的网站域名列表
  openMode: 'newtab' // 'newtab' | 'navigate'
};

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Google 搜索并自动打开默认网站',
      contexts: ['selection']
    });
  });
}

// MV3 service worker 每次唤醒都要保证菜单存在
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
  chrome.storage.sync.get(DEFAULTS).then((s) => {
    // 兼容旧版：把单个域名迁移成列表
    if (!s.targetDomains && s.targetDomain) {
      chrome.storage.sync.set({ targetDomains: [s.targetDomain] });
      return;
    }
    if (!s.targetDomains || !s.targetDomains.length) chrome.runtime.openOptionsPage();
  });
});
chrome.runtime.onStartup.addListener(createContextMenu);
createContextMenu();

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) return;

  const text = (info.selectionText || '').trim();
  if (!text) return;

  const settings = await chrome.storage.sync.get(DEFAULTS);
  // 兼容旧配置：没有列表时回退到旧的单个域名
  let domains = settings.targetDomains;
  if (!Array.isArray(domains)) {
    domains = settings.targetDomain ? [settings.targetDomain] : [];
  }
  if (!domains.length) {
    chrome.runtime.openOptionsPage();
    return;
  }

  const token = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

  // 先写 pending，再开标签页，保证内容脚本运行时能读到
  await chrome.storage.local.set({
    pending: {
      token,
      query: text,
      targetDomains: domains,
      openMode: settings.openMode,
      ts: Date.now()
    }
  });

  // ext_token 是给内容脚本识别"这是右键触发的那次搜索"用的，Google 会忽略该参数
  const searchUrl =
    'https://www.google.com/search?q=' +
    encodeURIComponent(text) +
    '&ext_token=' +
    encodeURIComponent(token);

  await chrome.tabs.create({ url: searchUrl, active: true });
});

// 内容脚本没有 tabs 权限，需要新标签打开时由后台代劳
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'open-tab' && msg.url) {
    chrome.tabs.create({ url: msg.url, active: true });
  }
});
