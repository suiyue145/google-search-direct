(function () {
  'use strict';

  const MAX_WAIT_MS = 12000; // Google 结果是异步填充的，最多等 12 秒
  const POLL_MS = 300;

  function normalizeDomain(input) {
    if (!input) return '';
    let s = String(input).trim().toLowerCase();
    if (s.indexOf('://') !== -1) {
      try {
        s = new URL(s).hostname;
      } catch (e) {
        /* 用原始字符串继续 */
      }
    }
    s = s.split('/')[0].split('?')[0].split('#')[0];
    return s.replace(/^www\./, '');
  }

  function isGoogleHost(host) {
    return /(^|\.)google\./.test(host);
  }

  // 兼容两类结果链接：直接 https://... 和 Google 的 /url?q=... 跳转链接
  function extractUrlFromAnchor(a) {
    const href = a.getAttribute('href') || '';
    if (!href) return null;
    try {
      let u;
      if (
        href.indexOf('/url?') === 0 ||
        href.indexOf('https://www.google.com/url?') === 0 ||
        href.indexOf('http://www.google.com/url?') === 0
      ) {
        const query = href.indexOf('?') === -1 ? '' : href.slice(href.indexOf('?') + 1);
        const params = new URLSearchParams(query);
        const raw = params.get('q') || params.get('url');
        if (!raw) return null;
        u = new URL(raw);
      } else if (/^https?:\/\//i.test(href)) {
        u = new URL(href);
      } else {
        return null;
      }
      return u;
    } catch (e) {
      return null;
    }
  }

  // 按域名列表的优先顺序查找：收集每个域名在结果页中的第一个匹配链接，
  // 然后按列表顺序返回第一个有结果的——列表靠前的网站优先。
  function findFirstMatch(domains) {
    const scoped = document.querySelectorAll(
      '#search a[href], div.g a[href], [data-hveid] a[href]'
    );
    const anchors = scoped.length ? scoped : document.querySelectorAll('a[href]');
    const hits = new Map(); // domain -> 第一个匹配到的链接

    for (const a of anchors) {
      const u = extractUrlFromAnchor(a);
      if (!u) continue;
      const host = u.hostname.replace(/^www\./i, '').toLowerCase();
      if (!host || isGoogleHost(host)) continue;
      for (const d of domains) {
        if (host === d || host.endsWith('.' + d)) {
          if (!hits.has(d)) hits.set(d, u.href);
          break; // 一个链接只归到第一个匹配的域名
        }
      }
    }

    for (const d of domains) {
      if (hits.has(d)) return { domain: d, url: hits.get(d) };
    }
    return null;
  }

  function waitForFirstMatch(domains, timeoutMs) {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        const hit = findFirstMatch(domains);
        if (hit) return resolve(hit);
        if (Date.now() - start >= timeoutMs) return resolve(null);
        setTimeout(tick, POLL_MS);
      };
      tick();
    });
  }

  async function main() {
    let data;
    try {
      data = await chrome.storage.local.get('pending');
    } catch (e) {
      return;
    }
    const pending = data && data.pending;
    if (!pending) return;

    const params = new URLSearchParams(location.search);
    const q = (params.get('q') || '').trim();
    const tokenOk = pending.token && params.get('ext_token') === pending.token;
    if (!tokenOk && q !== (pending.query || '').trim()) return;
    if (Date.now() - (pending.ts || 0) > 180000) return; // 3 分钟过期

    // 一次性消费，避免手动刷新/后退时重复打开
    try {
      await chrome.storage.local.remove('pending');
    } catch (e) {
      /* ignore */
    }

    // 兼容旧版 pending 里只有单个域名的情况
    const raw = pending.targetDomains || (pending.targetDomain ? [pending.targetDomain] : []);
    const domains = raw.map(normalizeDomain).filter(Boolean);
    if (!domains.length) return;

    const hit = await waitForFirstMatch(domains, MAX_WAIT_MS);
    if (!hit) return; // 所有网站都没有结果，保留 Google 页面

    if (pending.openMode === 'newtab') {
      chrome.runtime.sendMessage({ type: 'open-tab', url: hit.url }, () => {
        void chrome.runtime.lastError;
      });
    } else {
      location.assign(hit.url);
    }
  }

  main();
})();
