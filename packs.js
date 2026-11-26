'use strict';

// 内置网站包：只收录合法/官方站点，不含盗版小说、盗版影视或聚合侵权站。
// 每个包是一个按优先顺序排列的域名列表——Google 结果里排在前面的网站优先被打开。
//
// 两套预设：
//   zh_CN —— 中文用户习惯的国内/中文站点
//   en    —— 英文用户习惯的国际站点（含美/英本地化微调）
// 用 globalThis 挂载，便于 service worker（importScripts）与 options/popup（script 标签）共用。

const ZH_PACKS = [
  {
    id: 'general',
    nameKey: 'packGeneral',
    icon: '🧰',
    domains: ['zhihu.com', 'baike.baidu.com', 'wikipedia.org', 'douban.com', 'github.com']
  },
  {
    id: 'novel',
    nameKey: 'packNovel',
    icon: '📚',
    domains: [
      'fanqienovel.com', // 番茄小说（免费正版）
      'qidian.com',      // 起点中文网
      'jjwxc.net',       // 晋江文学城
      'weread.qq.com',   // 微信读书
      'qimao.com',       // 七猫中文网（免费正版）
      '17k.com',
      'zongheng.com',
      'ireader.com.cn'   // 掌阅
    ]
  },
  {
    id: 'movie',
    nameKey: 'packMovie',
    icon: '🎬',
    domains: [
      'bilibili.com',    // B 站免费区
      'yangshipin.cn',   // 央视频
      'tv.cctv.com',     // CCTV 节目官网
      '1905.com',        // 1905 电影网
      'v.qq.com',
      'iqiyi.com',
      'v.youku.com',
      'mgtv.com',
      'movie.douban.com',
      'miguvideo.com',
      'ixigua.com'
    ]
  },
  {
    id: 'shopping',
    nameKey: 'packShopping',
    icon: '🛒',
    domains: [
      'smzdm.com',       // 什么值得买（比价）
      'taobao.com',
      'jd.com',
      'pinduoduo.com',
      'tmall.com',
      'vip.com',
      '1688.com',
      'manmanbuy.com',   // 慢慢买（历史价）
      'dangdang.com',
      'dewu.com',
      'suning.com'
    ]
  },
  {
    id: 'academic',
    nameKey: 'packAcademic',
    icon: '📖',
    domains: [
      'cnki.net',
      'wanfangdata.com.cn',
      'arxiv.org',
      'pubmed.ncbi.nlm.nih.gov',
      'semanticscholar.org',
      'x-mol.com',
      'doi.org'
    ]
  },
  {
    id: 'dev',
    nameKey: 'packDev',
    icon: '💻',
    domains: [
      'github.com',
      'stackoverflow.com',
      'developer.mozilla.org',
      'juejin.cn',
      'csdn.net',
      'npmjs.com',
      'react.dev',
      'vuejs.org'
    ]
  },
  {
    id: 'news',
    nameKey: 'packNews',
    icon: '📰',
    domains: [
      'news.cn',
      'people.com.cn',
      'thepaper.cn',
      'chinanews.com.cn',
      'news.cctv.com',
      'huxiu.com'
    ]
  },
  {
    id: 'music',
    nameKey: 'packMusic',
    icon: '🎵',
    domains: [
      'music.163.com',
      'y.qq.com',
      'kugou.com',
      'kuwo.cn',
      'ximalaya.com',
      'bilibili.com'
    ]
  }
];

const EN_PACKS = [
  {
    id: 'general',
    nameKey: 'packGeneral',
    icon: '🧰',
    domains: ['wikipedia.org', 'reddit.com', 'quora.com', 'britannica.com', 'github.com']
  },
  {
    id: 'novel',
    nameKey: 'packNovel',
    icon: '📚',
    domains: [
      'goodreads.com',
      'gutenberg.org',       // Project Gutenberg（公版书）
      'archive.org',
      'openlibrary.org',
      'amazon.com',
      'bookshop.org'
    ]
  },
  {
    id: 'movie',
    nameKey: 'packMovie',
    icon: '🎬',
    domains: [
      'imdb.com',
      'youtube.com',         // 官方预告/免费频道
      'rottentomatoes.com',
      'themoviedb.org',
      'metacritic.com',
      'netflix.com',
      'disneyplus.com',
      'hulu.com',
      'primevideo.com'
    ]
  },
  {
    id: 'shopping',
    nameKey: 'packShopping',
    icon: '🛒',
    domains: [
      'amazon.com',
      'ebay.com',
      'walmart.com',
      'bestbuy.com',
      'target.com',
      'pricegrabber.com',
      'shopping.google.com'
    ]
  },
  {
    id: 'academic',
    nameKey: 'packAcademic',
    icon: '📖',
    domains: [
      'arxiv.org',
      'pubmed.ncbi.nlm.nih.gov',
      'semanticscholar.org',
      'scholar.google.com',
      'jstor.org',
      'doi.org',
      'springer.com',
      'sciencedirect.com'
    ]
  },
  {
    id: 'dev',
    nameKey: 'packDev',
    icon: '💻',
    domains: [
      'github.com',
      'stackoverflow.com',
      'developer.mozilla.org',
      'npmjs.com',
      'react.dev',
      'vuejs.org',
      'docs.python.org',
      'medium.com'
    ]
  },
  {
    id: 'news',
    nameKey: 'packNews',
    icon: '📰',
    domains: [
      'bbc.com',
      'reuters.com',
      'apnews.com',
      'theguardian.com',
      'nytimes.com',
      'wsj.com',
      'aljazeera.com'
    ]
  },
  {
    id: 'music',
    nameKey: 'packMusic',
    icon: '🎵',
    domains: [
      'spotify.com',
      'music.apple.com',
      'youtube.com',
      'soundcloud.com',
      'pandora.com',
      'audible.com'
    ]
  }
];

// 英文地区微调：让购物/新闻首站更贴近当地习惯。
const EN_REGION_TWEAKS = {
  gb: {
    shopping: ['amazon.co.uk', 'ebay.co.uk', 'argos.co.uk', 'currys.co.uk', 'johnlewis.com', 'pricegrabber.com'],
    news: ['bbc.com', 'theguardian.com', 'reuters.com', 'independent.co.uk', 'sky.com', 'apnews.com']
  },
  ca: {
    shopping: ['amazon.ca', 'ebay.ca', 'walmart.ca', 'bestbuy.ca', 'canadiantire.ca'],
    news: ['cbc.ca', 'reuters.com', 'theglobeandmail.com', 'ctvnews.ca', 'apnews.com']
  },
  au: {
    shopping: ['amazon.com.au', 'ebay.com.au', 'jbhi-fi.com.au', 'harveynorman.com.au', 'woolworths.com.au'],
    news: ['abc.net.au', 'reuters.com', 'theguardian.com', 'smh.com.au', 'apnews.com']
  }
};

const BUILTIN_IDS = ['general', 'novel', 'movie', 'shopping', 'academic', 'dev', 'news', 'music'];

function uiLanguage() {
  // 返回当前生效语言（受扩展内语言偏好控制），供页面 lang 属性与地区判断使用
  if (globalThis.I18N && I18N.lang) return I18N.lang;
  try {
    if (globalThis.chrome && chrome.i18n && chrome.i18n.getUILanguage) return chrome.i18n.getUILanguage();
  } catch (e) { /* 忽略 */ }
  return 'en';
}

function message(key, fallback, substitutions) {
  // 优先用扩展内部语言层（支持跟随系统 / 手动切换），否则回退 Chrome i18n
  if (globalThis.I18N && I18N.tr) return I18N.tr(key, fallback, substitutions);
  try {
    if (globalThis.chrome && chrome.i18n && chrome.i18n.getMessage) {
      const value = substitutions
        ? chrome.i18n.getMessage(key, substitutions)
        : chrome.i18n.getMessage(key);
      if (value) return value;
    }
  } catch (e) { /* 忽略 */ }
  let text = fallback || key;
  if (Array.isArray(substitutions)) {
    substitutions.forEach((v, i) => { text = text.split('$' + (i + 1)).join(String(v)); });
  }
  return text;
}

// 'zh_CN' | 'en'
function detectVariant(language) {
  const lang = String(language || uiLanguage()).toLowerCase().replace(/_/g, '-');
  return lang.indexOf('zh') === 0 ? 'zh_CN' : 'en';
}

function regionOf(language) {
  const parts = String(language || uiLanguage()).toLowerCase().replace(/_/g, '-').split('-');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

// 生成一套全新的内置包（带本地化包名、按国家微调域名）
function createBuiltinPacks(variant, language) {
  const kind = variant ? String(variant) : detectVariant(language);
  const source = kind === 'zh_CN' ? ZH_PACKS : EN_PACKS;
  const lang = String(language || uiLanguage()).toLowerCase();
  const tweak = kind === 'en' ? (EN_REGION_TWEAKS[regionOf(lang)] || {}) : {};

  return source.map((pack) => ({
    id: pack.id,
    name: message(pack.nameKey, pack.id),
    icon: pack.icon,
    domains: (tweak[pack.id] || pack.domains).slice(),
    builtin: true
  }));
}

globalThis.BUILTIN_PACK_SETS = { zh_CN: ZH_PACKS, en: EN_PACKS };
globalThis.BUILTIN_IDS = BUILTIN_IDS;
globalThis.detectVariant = detectVariant;
globalThis.createBuiltinPacks = createBuiltinPacks;
globalThis.message = message;
globalThis.uiLanguage = uiLanguage;
// 兼容旧调用：按当前系统语言给出一套包
globalThis.BUILTIN_PACKS = createBuiltinPacks();
