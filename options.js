'use strict';

const DEFAULTS = { targetDomains: [], openMode: 'newtab' };

const listEl = document.getElementById('domain-list');
const modeSelect = document.getElementById('mode');
const statusEl = document.getElementById('status');
const presetsEl = document.getElementById('presets');

const PRESETS = [
  ['GitHub', 'github.com'],
  ['知乎', 'zhihu.com'],
  ['维基百科', 'wikipedia.org'],
  ['Stack Overflow', 'stackoverflow.com'],
  ['百度百科', 'baike.baidu.com'],
  ['豆瓣', 'douban.com']
];

let domains = [];

// 从 DOM 输入框同步回内存数组（每次操作前调用，保证顺序和输入一致）
function syncFromDom() {
  const inputs = listEl.querySelectorAll('input.domain-input');
  domains = Array.from(inputs).map((el) => el.value.trim());
}

function renderList() {
  listEl.innerHTML = '';
  domains.forEach((domain, i) => {
    const row = document.createElement('div');
    row.className = 'domain-row';

    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = String(i + 1);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'domain-input';
    input.value = domain;
    input.placeholder = '例如 zhihu.com';
    input.autocomplete = 'off';
    input.addEventListener('input', () => {
      domains[i] = input.value;
    });

    const up = document.createElement('button');
    up.type = 'button';
    up.textContent = '↑';
    up.title = '上移（提高优先级）';
    up.disabled = i === 0;
    up.addEventListener('click', () => move(i, -1));

    const down = document.createElement('button');
    down.type = 'button';
    down.textContent = '↓';
    down.title = '下移（降低优先级）';
    down.disabled = i === domains.length - 1;
    down.addEventListener('click', () => move(i, 1));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.textContent = '×';
    del.title = '删除';
    del.addEventListener('click', () => {
      syncFromDom();
      domains.splice(i, 1);
      renderList();
    });

    row.append(rank, input, up, down, del);
    listEl.appendChild(row);
  });
  if (!domains.length) {
    const hint = document.createElement('p');
    hint.style.cssText = 'color:var(--muted);font-size:13px;margin:0;';
    hint.textContent = '还没有添加网站，点下面的按钮或选一个预设。';
    listEl.appendChild(hint);
  }
}

function move(index, delta) {
  syncFromDom();
  const target = index + delta;
  if (target < 0 || target >= domains.length) return;
  const item = domains.splice(index, 1)[0];
  domains.splice(target, 0, item);
  renderList();
}

function addDomain(value) {
  syncFromDom();
  domains.push(value || '');
  renderList();
  const inputs = listEl.querySelectorAll('input.domain-input');
  const last = inputs[inputs.length - 1];
  if (last) last.focus();
}

function renderPresets() {
  PRESETS.forEach(([label, domain]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      syncFromDom();
      if (domains.includes(domain)) {
        statusEl.textContent = domain + ' 已在列表里';
        setTimeout(() => { statusEl.textContent = ''; }, 2500);
        return;
      }
      addDomain(domain);
      statusEl.textContent = '';
    });
    presetsEl.appendChild(btn);
  });
}

function normalize(input) {
  let s = String(input).trim().toLowerCase();
  if (!s) return '';
  if (s.indexOf('://') !== -1) {
    try { s = new URL(s).hostname; } catch (e) { /* 继续 */ }
  }
  s = s.split('/')[0].split('?')[0].split('#')[0];
  return s.replace(/^www\./, '');
}

async function load() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  let list = s.targetDomains;
  if (!Array.isArray(list)) {
    // 兼容旧版单个域名配置
    list = s.targetDomain ? [s.targetDomain] : [];
  }
  domains = list.slice();
  modeSelect.value = s.openMode || 'newtab';
  renderList();
}

async function save() {
  syncFromDom();
  const cleaned = [];
  for (const d of domains) {
    const n = normalize(d);
    if (n && !cleaned.includes(n)) cleaned.push(n);
  }
  await chrome.storage.sync.set({
    targetDomains: cleaned,
    targetDomain: '', // 清掉旧字段，避免迁移逻辑重复触发
    openMode: modeSelect.value
  });
  domains = cleaned;
  renderList();
  statusEl.textContent = cleaned.length
    ? '已保存 ' + cleaned.length + ' 个网站，按上面的顺序依次尝试。'
    : '已保存（未设置网站，右键只会打开 Google 搜索）。';
  setTimeout(() => { statusEl.textContent = ''; }, 4000);
}

renderPresets();
load();
document.getElementById('add-domain').addEventListener('click', () => addDomain(''));
document.getElementById('save').addEventListener('click', save);
