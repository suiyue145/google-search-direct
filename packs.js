'use strict';

// 内置网站包：只收录合法/官方站点，不含盗版小说、盗版影视或聚合侵权站。
// 每个包是一个按优先顺序排列的域名列表——Google 结果里排在前面的网站优先被打开。
// 用 globalThis 挂载，便于 service worker（importScripts）与 options/popup（script 标签）共用。
globalThis.BUILTIN_PACKS = [
  {
    id: 'general',
    name: '通用工具',
    icon: '🧰',
    domains: ['zhihu.com', 'baike.baidu.com', 'wikipedia.org', 'douban.com', 'github.com']
  },
  {
    id: 'novel',
    name: '小说阅读',
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
    name: '影视观影',
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
    name: '购物比价',
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
    name: '学术文献',
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
    name: '开发技术',
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
    name: '新闻资讯',
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
    name: '音乐听书',
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
