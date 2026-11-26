'use strict';

const DEFAULTS = { targetDomain: '', openMode: 'newtab' };

const domainInput = document.getElementById('domain');
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

function renderPresets() {
  PRESETS.forEach(([label, domain]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      domainInput.value = domain;
      statusEl.textContent = '';
    });
    presetsEl.appendChild(btn);
  });
}

async function load() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  domainInput.value = s.targetDomain || '';
  modeSelect.value = s.openMode || 'newtab';
}

async function save() {
  const domain = domainInput.value.trim();
  await chrome.storage.sync.set({
    targetDomain: domain,
    openMode: modeSelect.value
  });
  statusEl.textContent = domain ? '已保存。现在可以右键试试。' : '已保存（未设置域名，右键只会打开 Google 搜索）。';
  setTimeout(() => { statusEl.textContent = ''; }, 4000);
}

renderPresets();
load();
document.getElementById('save').addEventListener('click', save);
domainInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') save();
});
