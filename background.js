'use strict';

importScripts('i18n-data.js', 'i18n.js', 'packs.js');

const MENU_ID = 'google-search-open-default';
const BUILTIN_IDS_SET = new Set(globalThis.BUILTIN_IDS || []);

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

function isBuiltinPack(pack) {
  return !!(pack && (pack.builtin || BUILTIN_IDS_SET.has(String(pack.id))));
}

function nameKeyFor(id) {
  const s = String(id || '');
  return 'pack' + s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeLocalePref(value) {
  return value === 'zh_CN' || value === 'en' ? value : 'auto';
}

function effectiveVariant(pref) {
  return pref === 'auto' ? detectVariant() : pref;
}

// 读取配置，并在首次运行时按系统语言（或用户指定的预设）初始化网站包；
// 同时迁移旧版的单域名/单列表配置。
async function ensureConfig() {
  await I18N.init();
  const s = await chrome.storage.sync.get([
    'packs', 'activePackId', 'openMode', 'targetDomains', 'targetDomain', 'locale'
  ]);

  const localePref = normalizeLocalePref(s.locale);
  const variant = effectiveVariant(localePref);
  const isFirstRun = !Array.isArray(s.packs);

  let packs = isFirstRun ? createBuiltinPacks(variant, uiLanguage()) : clone(s.packs);
  if (!packs.length) packs = createBuiltinPacks(variant, uiLanguage());

  let activePackId = s.activePackId;
  if (isFirstRun) {
    // v1.0 的 targetDomain / v1.1 的 targetDomains 迁移成「我的网站」包
    const legacy = cleanDomains(
      Array.isArray(s.targetDomains)
        ? s.targetDomains
        : (s.targetDomain ? [s.targetDomain] : [])
    );
    if (legacy.length) {
      packs.unshift({
        id: 'custom',
        name: message('customPack', '我的网站'),
        icon: '⭐',
        domains: legacy,
        builtin: false
      });
      activePackId = 'custom';
    }
  }

  // 清洗每个包的域名，防止手工改坏配置；内置包按 id 识别，兼容 v1.2 之前未标记 builtin 的数据
  packs = packs.map((p) => {
    const builtin = isBuiltinPack(p);
    return {
      id: String(p.id || ('pack-' + Math.random().toString(36).slice(2, 8))),
      // 内置包名始终按当前界面语言重新生成，语言切换后自动跟随
      name: builtin
        ? message(nameKeyFor(p.id), String(p.name || ''))
        : String(p.name || message('unnamedPack', '未命名')),
      icon: String(p.icon || '🔗'),
      domains: cleanDomains(p.domains),
      builtin
    };
  });

  if (!activePackId || !packs.some((p) => p.id === activePackId)) {
    activePackId = packs[0].id;
  }

  const config = {
    locale: localePref,
    packs,
    activePackId,
    openMode: s.openMode === 'navigate' ? 'navigate' : 'newtab'
  };

  await chrome.storage.sync.set({
    locale: config.locale,
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

// 切换默认网站列表：替换内置包，保留用户自建包
async function applyLocale(pref) {
  const localePref = normalizeLocalePref(pref);
  const stored = await chrome.storage.sync.get(['packs']);
  const customPacks = (Array.isArray(stored.packs) ? stored.packs : [])
    .filter((p) => !isBuiltinPack(p))
    .map(clone);
  const builtin = createBuiltinPacks(effectiveVariant(localePref), uiLanguage());
  const packs = builtin.concat(customPacks);
  await chrome.storage.sync.set({
    locale: localePref,
    packs,
    activePackId: packs[0] ? packs[0].id : ''
  });
  const updated = await ensureConfig();
  await applyUI(updated);
  broadcastConfigChanged();
  return updated;
}

// 串行化菜单重建，避免 onInstalled / onStartup / 快捷键同时触发时互相清掉
let menuChain = Promise.resolve();
function createContextMenu(title) {
  menuChain = menuChain.then(async () => {
    await new Promise((resolve) => chrome.contextMenus.removeAll(resolve));
    chrome.contextMenus.create({
      id: MENU_ID,
      title: title || message('contextMenuFallback', 'Google 搜索并自动打开网站结果'),
      contexts: ['selection']
    });
  });
  return menuChain;
}

async function applyUI(config) {
  const pack = activePack(config);
  const index = config.packs.findIndex((p) => p.id === pack.id);
  const menuTitle = message('contextMenu', 'Google 搜索并打开「$1」结果', [pack.name]);
  await createContextMenu(menuTitle);
  chrome.action.setBadgeText({ text: index < 9 ? String(index + 1) : '•' });
  chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
  chrome.action.setTitle({
    title: message('extName', 'Google 搜索直达') + ' · ' +
      message('currentPack', '当前：$1', [(pack.icon || '🔗') + ' ' + pack.name])
  });
}

function broadcastConfigChanged() {
  try {
    // 没有打开的 popup/options 时这里会收到 lastError，必须读取掉，
    // 否则 Chrome 会报 "Unchecked runtime.lastError"。
    chrome.runtime.sendMessage({ type: 'config-changed' }, () => {
      void chrome.runtime.lastError;
    });
  } catch (e) {
    /* 忽略 */
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
    sendResponse({ ok: true });
  } else if (msg.type === 'config-changed') {
    ensureConfig().then(applyUI);
    sendResponse({ ok: true });
  } else if (msg.type === 'get-config') {
    ensureConfig().then(sendResponse).catch(() => sendResponse(null));
    return true; // 异步响应
  } else if (msg.type === 'set-locale') {
    applyLocale(msg.locale)
      .then((config) => sendResponse({ ok: true, config }))
      .catch((err) => sendResponse({ ok: false, error: String(err && err.message || err) }));
    return true; // 异步响应
  } else if (msg.type === 'set-lang') {
    const pref = msg.lang === 'zh_CN' || msg.lang === 'en' ? msg.lang : 'auto';
    (async () => {
      await chrome.storage.sync.set({ uiLangPref: pref });
      I18N.setPref(pref);
      const config = await ensureConfig();
      await applyUI(config);
      broadcastConfigChanged();
      sendResponse({ ok: true, lang: I18N.lang });
    })().catch((err) => sendResponse({ ok: false, error: String(err && err.message || err) }));
    return true; // 异步响应
  }
});
