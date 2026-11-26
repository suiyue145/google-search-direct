'use strict';

importScripts('packs.js');

const MENU_ID = 'google-search-open-default';
const BUILTIN = globalThis.BUILTIN_PACKS || [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDomain(input) {
  let s = String(input || '').trim().toLowerCase();
  if (!s) return '';
  if (s.indexOf('://') !== -1) {
    try { s = new URL(s).hostname; } catch (e) { /* 继续用原字符串 */ }
  }
  s = s.split('/')[0].split('?')[0].split('#')[0];
  return s.replace(/^www\./, '');
}

function cleanDomains(list) {
  const out = [];
  for (const d of Array.isArray(list) ? list : []) {
    const n = normalizeDomain(d);
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

// 读取配置，并在首次运行时迁移旧版的单域名/单列表配置。
async function ensureConfig() {
  const s = await chrome.storage.sync.get([
    'packs', 'activePackId', 'openMode', 'targetDomains', 'targetDomain'
  ]);

  let packs = Array.isArray(s.packs) && s.packs.length ? clone(s.packs) : clone(BUILTIN);
  if (!packs.length) packs = clone(BUILTIN);

  let activePackId = s.activePackId;
  const isFirstRun = !Array.isArray(s.packs);
  if (isFirstRun) {
    // v1.0 的 targetDomain / v1.1 的 targetDomains 迁移成「我的网站」包
    const legacy = cleanDomains(
      Array.isArray(s.targetDomains)
        ? s.targetDomains
        : (s.targetDomain ? [s.targetDomain] : [])
    );
    if (legacy.length) {
      packs.unshift({ id: 'custom', name: '我的网站', icon: '⭐', domains: legacy, builtin: false });
      activePackId = 'custom';
    }
  }

  // 清洗每个包的域名，防止手工改坏配置
  packs = packs.map((p) => ({
    id: String(p.id || ('pack-' + Math.random().toString(36).slice(2, 8))),
    name: String(p.name || '未命名'),
    icon: String(p.icon || '🔗'),
    domains: cleanDomains(p.domains),
    builtin: !!p.builtin
  }));

  if (!activePackId || !packs.some((p) => p.id === activePackId)) {
    activePackId = packs[0].id;
  }

  const config = {
    packs,
    activePackId,
    openMode: s.openMode === 'navigate' ? 'navigate' : 'newtab'
  };

  await chrome.storage.sync.set({
    packs: config.packs,
    activePackId: config.activePackId,
    openMode: config.openMode,
    targetDomains: [],  // 清掉旧字段，避免每次启动重复迁移
    targetDomain: ''
  });
  return config;
}

function activePack(config) {
  return config.packs.find((p) => p.id === config.activePackId) || config.packs[0];
}

// 串行化菜单重建，避免 onInstalled / onStartup / 快捷键同时触发时互相清掉
let menuChain = Promise.resolve();
function createContextMenu(title) {
  menuChain = menuChain.then(async () => {
    await new Promise((resolve) => chrome.contextMenus.removeAll(resolve));
    chrome.contextMenus.create({
      id: MENU_ID,
      title: title || 'Google 搜索并自动打开网站结果',
      contexts: ['selection']
    });
  });
  return menuChain;
}

async function applyUI(config) {
  const pack = activePack(config);
  const index = config.packs.findIndex((p) => p.id === pack.id);
  await createContextMenu('Google 搜索并打开「' + pack.name + '」结果');
  chrome.action.setBadgeText({ text: index < 9 ? String(index + 1) : '•' });
  chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
  chrome.action.setTitle({
    title: 'Google 搜索直达 · 当前：' + pack.icon + ' ' + pack.name + '（点击切换）'
  });
}

function broadcastConfigChanged() {
  try {
    chrome.runtime.sendMessage({ type: 'config-changed' }, () => {});
  } catch (e) {
    /* 没有打开的 popup，忽略 */
  }
}

chrome.runtime.onInstalled.addListener(() => {
  ensureConfig().then(applyUI);
});
chrome.runtime.onStartup.addListener(() => {
  ensureConfig().then(applyUI);
});
ensureConfig().then(applyUI);

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) return;
  const text = (info.selectionText || '').trim();
  if (!text) return;

  const config = await ensureConfig();
  const pack = activePack(config);
  const domains = cleanDomains(pack.domains);
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
      packId: pack.id,
      openMode: config.openMode,
      ts: Date.now()
    }
  });

  // ext_token 给内容脚本识别"这是右键触发的那次搜索"，Google 会忽略该参数
  const searchUrl =
    'https://www.google.com/search?q=' +
    encodeURIComponent(text) +
    '&ext_token=' +
    encodeURIComponent(token);
  await chrome.tabs.create({ url: searchUrl, active: true });
});

// 快捷键切换网站包
chrome.commands.onCommand.addListener(async (command) => {
  const config = await ensureConfig();
  let nextId = null;

  if (command === 'cycle-pack') {
    const i = config.packs.findIndex((p) => p.id === config.activePackId);
    nextId = config.packs[(i + 1) % config.packs.length].id;
  } else if (command.indexOf('switch-pack-') === 0) {
    const index = Number(command.slice('switch-pack-'.length)) - 1;
    if (Number.isInteger(index) && config.packs[index]) nextId = config.packs[index].id;
  }
  if (!nextId || nextId === config.activePackId) return;

  await chrome.storage.sync.set({ activePackId: nextId });
  const updated = await ensureConfig();
  await applyUI(updated);
  broadcastConfigChanged();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;
  if (msg.type === 'open-tab' && msg.url) {
    chrome.tabs.create({ url: msg.url, active: true });
  } else if (msg.type === 'config-changed') {
    ensureConfig().then(applyUI);
  } else if (msg.type === 'get-config') {
    ensureConfig().then(sendResponse);
    return true; // 异步响应
  }
});
