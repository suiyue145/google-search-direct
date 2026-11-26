'use strict';

const BUILTIN = globalThis.BUILTIN_PACKS || [];
const packsEl = document.getElementById('packs');
const modeSelect = document.getElementById('mode');
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

function flash(message) {
  statusEl.textContent = message;
  setTimeout(() => { statusEl.textContent = ''; }, 3500);
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
    icon.title = '图标 emoji';
    icon.addEventListener('input', () => { pack.icon = icon.value; });

    const name = document.createElement('input');
    name.className = 'name';
    name.type = 'text';
    name.value = pack.name;
    name.placeholder = '包名，例如：小说阅读';
    name.addEventListener('input', () => { pack.name = name.value; });

    const key = document.createElement('span');
    key.className = 'key-hint';
    key.textContent = pi < 8 ? 'Alt+Shift+' + (pi + 1) : '无快捷键';

    const enable = document.createElement('button');
    enable.type = 'button';
    enable.className = 'btn small' + (pack.id === activeId ? '' : ' primary');
    enable.textContent = pack.id === activeId ? '当前生效' : '启用';
    enable.disabled = pack.id === activeId;
    enable.addEventListener('click', () => {
      activeId = pack.id;
      render();
    });

    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'btn small';
    up.textContent = '↑';
    up.title = '上移（快捷键序号提前）';
    up.disabled = pi === 0;
    up.addEventListener('click', () => movePack(pi, -1));

    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'btn small';
    down.textContent = '↓';
    down.title = '下移';
    down.disabled = pi === packs.length - 1;
    down.addEventListener('click', () => movePack(pi, 1));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn small danger';
    del.textContent = '×';
    del.title = pack.builtin ? '内置包不可删除，可清空域名' : '删除这个包';
    if (pack.builtin) {
      del.disabled = true;
    } else {
      del.addEventListener('click', () => {
        if (!confirm('删除网站包「' + pack.name + '」？')) return;
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
      input.placeholder = '例如 qidian.com';
      input.addEventListener('input', () => { pack.domains[di] = input.value; });

      const dup = document.createElement('button');
      dup.type = 'button';
      dup.className = 'btn small';
      dup.textContent = '↑';
      dup.title = '提高优先级';
      dup.disabled = di === 0;
      dup.addEventListener('click', () => moveDomain(pi, di, -1));

      const ddown = document.createElement('button');
      ddown.type = 'button';
      ddown.className = 'btn small';
      ddown.textContent = '↓';
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
      empty.textContent = '这个包还没有网站，点下面的按钮添加。';
      card.appendChild(empty);
    }

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn small';
    addBtn.textContent = '+ 添加网站';
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
    name: '新网站包',
    icon: '🔗',
    domains: [],
    builtin: false
  };
  packs.push(pack);
  render();
});

document.getElementById('reset-packs').addEventListener('click', () => {
  if (!confirm('恢复内置网站包？当前所有修改和自定义包都会丢失。')) return;
  packs = clone(BUILTIN);
  activeId = packs[0] ? packs[0].id : '';
  modeSelect.value = 'newtab';
  render();
  flash('已恢复内置预设，记得点「保存设置」');
});

document.getElementById('open-shortcuts').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

document.getElementById('export').addEventListener('click', () => {
  jsonEl.value = JSON.stringify({
    packs,
    activePackId: activeId,
    openMode: modeSelect.value
  }, null, 2);
  flash('配置已生成，全选复制即可发给别人');
});

document.getElementById('copy').addEventListener('click', async () => {
  if (!jsonEl.value.trim()) {
    flash('请先点「导出到文本框」');
    return;
  }
  try {
    await navigator.clipboard.writeText(jsonEl.value);
    flash('已复制到剪贴板');
  } catch (e) {
    jsonEl.select();
    flash('复制失败，请手动全选复制');
  }
});

document.getElementById('import').addEventListener('click', () => {
  let data;
  try {
    data = JSON.parse(jsonEl.value);
  } catch (e) {
    flash('JSON 格式错误，请检查粘贴内容');
    return;
  }
  if (!data || !Array.isArray(data.packs) || !data.packs.length) {
    flash('配置里没有有效的网站包');
    return;
  }
  packs = data.packs.map((p, i) => ({
    id: String(p.id || ('pack-' + i + '-' + Date.now().toString(36))),
    name: String(p.name || '未命名'),
    icon: String(p.icon || '🔗'),
    domains: cleanDomains(p.domains),
    builtin: false
  }));
  activeId = data.activePackId || packs[0].id;
  if (!packs.some((p) => p.id === activeId)) activeId = packs[0].id;
  modeSelect.value = data.openMode === 'navigate' ? 'navigate' : 'newtab';
  render();
  flash('导入成功，检查后点「保存设置」');
});

async function save() {
  if (!packs.length) {
    flash('至少保留一个网站包');
    return;
  }
  const seenIds = new Set();
  const cleaned = packs.map((p, i) => {
    let id = String(p.id || '').trim() || ('pack-' + i + '-' + Date.now().toString(36));
    while (seenIds.has(id)) id = id + '-' + i;
    seenIds.add(id);
    return {
      id,
      name: String(p.name || '').trim() || ('网站包 ' + (i + 1)),
      icon: String(p.icon || '').trim() || '🔗',
      domains: cleanDomains(p.domains),
      builtin: !!p.builtin
    };
  });
  if (!cleaned.some((p) => p.id === activeId)) activeId = cleaned[0].id;

  await chrome.storage.sync.set({
    packs: cleaned,
    activePackId: activeId,
    openMode: modeSelect.value,
    targetDomains: [],
    targetDomain: ''
  });
  packs = cleaned;
  render();
  chrome.runtime.sendMessage({ type: 'config-changed' }, () => {});
  const total = cleaned.reduce((n, p) => n + p.domains.length, 0);
  flash('已保存 ' + cleaned.length + ' 个网站包、共 ' + total + ' 个网站（按包内顺序生效）');
}

async function load() {
  const s = await chrome.storage.sync.get(['packs', 'activePackId', 'openMode']);
  packs = Array.isArray(s.packs) && s.packs.length ? clone(s.packs) : clone(BUILTIN);
  activeId = s.activePackId || (packs[0] && packs[0].id) || '';
  if (!packs.some((p) => p.id === activeId)) activeId = packs[0] ? packs[0].id : '';
  modeSelect.value = s.openMode === 'navigate' ? 'navigate' : 'newtab';
  render();
}

document.getElementById('save').addEventListener('click', save);
load();
