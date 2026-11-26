'use strict';

const t = (key, fallback, args) => message(key, fallback, args);
const BUILTIN_IDS_SET = new Set(globalThis.BUILTIN_IDS || []);
const packsEl = document.getElementById('packs');
const modeSelect = document.getElementById('mode');
const localeSelect = document.getElementById('locale');
const uiLangSelect = document.getElementById('ui-lang');
const statusEl = document.getElementById('status');
const jsonEl = document.getElementById('config-json');

let packs = [];
let activeId = '';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDomain(input) {
  let s = String(input || '').trim().toLowerCase();
  if (!s) return '';
  if (s.indexOf('://') !== -1) {
    try { s = new URL(s).hostname; } catch (e) { /* 继续 */ }
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

function flash(text) {
  statusEl.textContent = text;
  setTimeout(() => { statusEl.textContent = ''; }, 3500);
}

// 把页面里的静态文案一次性替换为当前界面语言
function applyStaticI18n() {
  document.documentElement.lang = uiLanguage();
  document.title = t('optTitle', 'Google 搜索直达 - 网站包管理');
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'), el.textContent);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'), el.placeholder);
  });
}

function render() {
  packsEl.innerHTML = '';
  packs.forEach((pack, pi) => {
    const card = document.createElement('div');
    card.className = 'pack' + (pack.id === activeId ? ' is-active' : '');

    // ---- 包头部 ----
    const head = document.createElement('div');
    head.className = 'pack-head';

    const icon = document.createElement('input');
    icon.className = 'icon';
    icon.type = 'text';
    icon.value = pack.icon;
    icon.title = t('iconPlaceholder', '图标 emoji');
    icon.addEventListener('input', () => { pack.icon = icon.value; });

    const name = document.createElement('input');
    name.className = 'name';
    name.type = 'text';
    name.value = pack.name;
    name.placeholder = t('packNamePlaceholder', '包名');
    name.addEventListener('input', () => { pack.name = name.value; });

    const key = document.createElement('span');
    key.className = 'key-hint';
    key.textContent = pi < 3 ? t('keyGlobal', 'Alt+Shift+$1', [pi + 1]) : t('noShortcut', '无快捷键');

    const enable = document.createElement('button');
    enable.type = 'button';
    enable.className = 'btn small' + (pack.id === activeId ? '' : ' primary');
    enable.textContent = pack.id === activeId ? t('btnCurrent', '当前生效') : t('btnEnable', '启用');
    enable.disabled = pack.id === activeId;
    enable.addEventListener('click', () => {
      activeId = pack.id;
      render();
    });

    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'btn small';
    up.textContent = '↑';
    up.title = t('moveUpPack', '上移（快捷键序号提前）');
    up.disabled = pi === 0;
    up.addEventListener('click', () => movePack(pi, -1));

    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'btn small';
    down.textContent = '↓';
    down.title = t('moveDownPack', '下移');
    down.disabled = pi === packs.length - 1;
    down.addEventListener('click', () => movePack(pi, 1));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn small danger';
    del.textContent = '×';
    del.title = isBuiltinPack(pack)
      ? t('builtinNoDelete', '内置包不可删除，可清空域名')
      : t('deletePack', '删除这个包');
    if (isBuiltinPack(pack)) {
      del.disabled = true;
    } else {
      del.addEventListener('click', () => {
        if (!confirm(t('confirmDeletePack', '删除网站包「$1」？', [pack.name]))) return;
        packs.splice(pi, 1);
        if (activeId === pack.id) activeId = packs[0] ? packs[0].id : '';
        render();
      });
    }

    head.append(icon, name, key, enable, up, down, del);
    card.appendChild(head);

    // ---- 域名列表 ----
    pack.domains.forEach((domain, di) => {
      const row = document.createElement('div');
      row.className = 'domain-row';

      const rank = document.createElement('span');
      rank.className = 'rank';
      rank.textContent = String(di + 1);

      const input = document.createElement('input');
      input.type = 'text';
      input.value = domain;
      input.placeholder = t('domainPlaceholder', '例如 wikipedia.org');
      input.addEventListener('input', () => { pack.domains[di] = input.value; });

      const dup = document.createElement('button');
      dup.type = 'button';
      dup.className = 'btn small';
      dup.textContent = '↑';
      dup.title = t('moveUpDomain', '提高优先级');
      dup.disabled = di === 0;
      dup.addEventListener('click', () => moveDomain(pi, di, -1));

      const ddown = document.createElement('button');
      ddown.type = 'button';
      ddown.className = 'btn small';
      ddown.textContent = '↓';
      ddown.title = t('moveDownPack', '下移');
      ddown.disabled = di === pack.domains.length - 1;
      ddown.addEventListener('click', () => moveDomain(pi, di, 1));

      const ddel = document.createElement('button');
      ddel.type = 'button';
      ddel.className = 'btn small danger';
      ddel.textContent = '×';
      ddel.addEventListener('click', () => {
        pack.domains.splice(di, 1);
        render();
      });

      row.append(rank, input, dup, ddown, ddel);
      card.appendChild(row);
    });

    if (!pack.domains.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = t('emptyPack', '这个包还没有网站，点下面的按钮添加。');
      card.appendChild(empty);
    }

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn small';
    addBtn.textContent = t('btnAddDomain', '+ 添加网站');
    addBtn.style.marginTop = '6px';
    addBtn.addEventListener('click', () => {
      pack.domains.push('');
      render();
      const inputs = card.querySelectorAll('.domain-row input');
      const last = inputs[inputs.length - 1];
      if (last) last.focus();
    });
    card.appendChild(addBtn);

    packsEl.appendChild(card);
  });
}

function movePack(index, delta) {
  const target = index + delta;
  if (target < 0 || target >= packs.length) return;
  const item = packs.splice(index, 1)[0];
  packs.splice(target, 0, item);
  render();
}

function moveDomain(pi, di, delta) {
  const list = packs[pi].domains;
  const target = di + delta;
  if (target < 0 || target >= list.length) return;
  const item = list.splice(di, 1)[0];
  list.splice(target, 0, item);
  render();
}

document.getElementById('add-pack').addEventListener('click', () => {
  const pack = {
    id: 'pack-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    name: t('newPackName', '新网站包'),
    icon: '🔗',
    domains: [],
    builtin: false
  };
  packs.push(pack);
  render();
});

document.getElementById('reset-packs').addEventListener('click', () => {
  if (!confirm(t('confirmReset', '恢复内置网站包？当前修改会丢失，但自定义包会保留。'))) return;
  // 只重建内置包，保留用户自建包
  const custom = packs.filter((p) => !isBuiltinPack(p)).map(clone);
  const fresh = createBuiltinPacks(
    localeSelect.value === 'auto' ? detectVariant() : localeSelect.value,
    uiLanguage()
  );
  packs = fresh.concat(custom);
  activeId = packs[0] ? packs[0].id : '';
  modeSelect.value = 'newtab';
  render();
  flash(t('resetDone', '已恢复内置预设，记得点「保存设置」'));
});

uiLangSelect.addEventListener('change', async () => {
  const pref = uiLangSelect.value;
  try {
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'set-lang', lang: pref }, (resp) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (resp && resp.ok === false) {
          reject(new Error(resp.error || 'set-lang failed'));
          return;
        }
        resolve(resp);
      });
    });
    await load();
    flash(t('langSwitched', '界面语言已切换'));
  } catch (e) {
    flash(String(e && e.message ? e.message : e));
  }
});

// 语言或网站包配置在其他页面（如弹窗）变化时，同步刷新本页
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.uiLangPref || changes.packs) {
    I18N.setPref(changes.uiLangPref ? changes.uiLangPref.newValue : I18N.pref);
    load();
  }
});

localeSelect.addEventListener('change', async () => {
  const pref = localeSelect.value;
  try {
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'set-locale', locale: pref }, (resp) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (resp && resp.ok === false) {
          reject(new Error(resp.error || 'set-locale failed'));
          return;
        }
        resolve(resp);
      });
    });
    await load();
    const label = pref === 'auto'
      ? t('localeAutoName', '跟随系统语言')
      : t(pref === 'zh_CN' ? 'presetZh' : 'presetEn', pref);
    flash(t('localeSwitched', '已切换到$1，记得点「保存设置」', [label]));
  } catch (e) {
    flash(String(e && e.message ? e.message : e));
  }
});

document.getElementById('open-shortcuts').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

document.getElementById('export').addEventListener('click', () => {
  jsonEl.value = JSON.stringify({
    locale: localeSelect.value,
    packs,
    activePackId: activeId,
    openMode: modeSelect.value
  }, null, 2);
  flash(t('exportDone', '配置已生成，全选复制即可发给别人'));
});

document.getElementById('copy').addEventListener('click', async () => {
  if (!jsonEl.value.trim()) {
    flash(t('exportFirst', '请先点「导出到文本框」'));
    return;
  }
  try {
    await navigator.clipboard.writeText(jsonEl.value);
    flash(t('copyDone', '已复制到剪贴板'));
  } catch (e) {
    jsonEl.select();
    flash(t('copyFail', '复制失败，请手动全选复制'));
  }
});

document.getElementById('import').addEventListener('click', () => {
  let data;
  try {
    data = JSON.parse(jsonEl.value);
  } catch (e) {
    flash(t('importBadJson', 'JSON 格式错误，请检查粘贴内容'));
    return;
  }
  if (!data || !Array.isArray(data.packs) || !data.packs.length) {
    flash(t('importNoPacks', '配置里没有有效的网站包'));
    return;
  }
  packs = data.packs.map((p, i) => ({
    id: String(p.id || ('pack-' + i + '-' + Date.now().toString(36))),
    name: String(p.name || t('unnamedPack', '未命名')),
    icon: String(p.icon || '🔗'),
    domains: cleanDomains(p.domains),
    builtin: isBuiltinPack(p)
  }));
  activeId = data.activePackId || packs[0].id;
  if (!packs.some((p) => p.id === activeId)) activeId = packs[0].id;
  modeSelect.value = data.openMode === 'navigate' ? 'navigate' : 'newtab';
  if (data.locale === 'zh_CN' || data.locale === 'en' || data.locale === 'auto') {
    localeSelect.value = data.locale;
  }
  render();
  flash(t('importDone', '导入成功，检查后点「保存设置」'));
});

async function save() {
  if (!packs.length) {
    flash(t('saveAtLeastOne', '至少保留一个网站包'));
    return;
  }
  const seenIds = new Set();
  const cleaned = packs.map((p, i) => {
    let id = String(p.id || '').trim() || ('pack-' + i + '-' + Date.now().toString(36));
    while (seenIds.has(id)) id = id + '-' + i;
    seenIds.add(id);
    return {
      id,
      name: String(p.name || '').trim() || t('defaultPackNameIndexed', '网站包 $1', [i + 1]),
      icon: String(p.icon || '').trim() || '🔗',
      domains: cleanDomains(p.domains),
      builtin: isBuiltinPack(p)
    };
  });
  if (!cleaned.some((p) => p.id === activeId)) activeId = cleaned[0].id;

  await chrome.storage.sync.set({
    locale: localeSelect.value,
    packs: cleaned,
    activePackId: activeId,
    openMode: modeSelect.value,
    targetDomains: [],
    targetDomain: ''
  });
  packs = cleaned;
  render();
  chrome.runtime.sendMessage({ type: 'config-changed' }, () => {
    void chrome.runtime.lastError;
  });
  const total = cleaned.reduce((n, p) => n + p.domains.length, 0);
  flash(t('savedSummary', '已保存 $1 个网站包、共 $2 个网站（按包内顺序生效）', [cleaned.length, total]));
}

async function load() {
  await I18N.init();
  applyStaticI18n();
  uiLangSelect.value = I18N.pref;
  const s = await chrome.storage.sync.get(['packs', 'activePackId', 'openMode', 'locale']);
  packs = Array.isArray(s.packs) && s.packs.length ? clone(s.packs) : createBuiltinPacks();
  activeId = s.activePackId || (packs[0] && packs[0].id) || '';
  if (!packs.some((p) => p.id === activeId)) activeId = packs[0] ? packs[0].id : '';
  modeSelect.value = s.openMode === 'navigate' ? 'navigate' : 'newtab';
  localeSelect.value = s.locale === 'zh_CN' || s.locale === 'en' ? s.locale : 'auto';
  render();
}

document.getElementById('save').addEventListener('click', save);
applyStaticI18n();
load();
