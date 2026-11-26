'use strict';

const listEl = document.getElementById('list');
const currentEl = document.getElementById('current');
const statusEl = document.getElementById('status');

let packs = [];
let activeId = '';

function getConfig() {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'get-config' }, (config) => {
        if (config && Array.isArray(config.packs)) return resolve(config);
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

function render() {
  const active = packs.find((p) => p.id === activeId) || packs[0];
  currentEl.textContent = active
    ? '当前：' + (active.icon || '🔗') + ' ' + active.name
    : '当前：未设置';

  listEl.innerHTML = '';
  packs.forEach((pack, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pack' + (pack.id === activeId ? ' active' : '');
    btn.title = pack.domains.join(' → ');

    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = pack.icon || '🔗';

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = pack.name;

    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = i < 3 ? 'Alt+⇧+' + (i + 1) : '键 ' + (i + 1);
    key.title = i < 3
      ? '全局快捷键：Alt+Shift+' + (i + 1)
      : '在此弹窗中按数字键 ' + (i + 1) + ' 切换；也可在 chrome://extensions/shortcuts 自行分配全局键';

    btn.append(icon, name, key);
    btn.addEventListener('click', () => switchTo(pack.id, pack.name));
    listEl.appendChild(btn);
  });
}

async function switchTo(id, name) {
  activeId = id;
  await chrome.storage.sync.set({ activePackId: id });
  chrome.runtime.sendMessage({ type: 'config-changed' }, () => {});
  render();
  statusEl.textContent = '已切换到「' + name + '」';
  setTimeout(() => { statusEl.textContent = ''; }, 2000);
}

async function load() {
  let config = await getConfig();
  if (!config) {
    const s = await chrome.storage.sync.get(['packs', 'activePackId']);
    config = s;
  }
  packs = Array.isArray(config.packs) ? config.packs : [];
  activeId = config.activePackId || (packs[0] && packs[0].id) || '';
  render();
}

// 弹窗内数字键覆盖全部包：1~8 直接切换，0 循环切换
// （Chrome 限制 manifest 最多 4 个预置键位，所以 4~8 用这种方式兜底）
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || !packs.length) return;
  if (/^[1-9]$/.test(event.key)) {
    const index = Number(event.key) - 1;
    if (packs[index]) {
      event.preventDefault();
      switchTo(packs[index].id, packs[index].name);
    }
  } else if (event.key === '0') {
    event.preventDefault();
    const current = packs.findIndex((p) => p.id === activeId);
    const next = packs[(current + 1) % packs.length];
    if (next) switchTo(next.id, next.name);
  }
});

document.getElementById('settings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
document.getElementById('shortcuts').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

load();
