'use strict';

// 扩展内部语言层：可按用户偏好（跟随系统 / 中文 / 英文）切换界面文案，
// 不依赖 Chrome 界面语言。文本来源为 i18n-data.js（由 _locales/*.json 生成）。

const I18N = (() => {
  const DATA = globalThis.I18N_DATA || {};
  let pref = 'auto';   // auto | zh_CN | en
  let lang = 'en';     // 当前生效语言

  function systemLang() {
    try {
      if (globalThis.chrome && chrome.i18n && chrome.i18n.getUILanguage) {
        const ui = String(chrome.i18n.getUILanguage() || 'en');
        return ui.toLowerCase().replace(/_/g, '-').indexOf('zh') === 0 ? 'zh_CN' : 'en';
      }
    } catch (e) { /* 忽略 */ }
    return 'en';
  }

  function effective(value) {
    return value === 'zh_CN' || value === 'en' ? value : systemLang();
  }

  // 同步调用：先用系统语言，init() 后再按用户偏好覆盖
  lang = effective('auto');

  function setPref(value) {
    pref = value === 'zh_CN' || value === 'en' ? value : 'auto';
    lang = effective(pref);
    return lang;
  }

  async function init() {
    try {
      if (globalThis.chrome && chrome.storage && chrome.storage.sync) {
        const s = await chrome.storage.sync.get(['uiLangPref']);
        setPref(s.uiLangPref);
      }
    } catch (e) { /* 忽略 */ }
    return lang;
  }

  function tr(key, fallback, substitutions) {
    const item = (DATA[lang] || {})[key];
    let text = item && item.message ? item.message : (fallback || key);
    if (Array.isArray(substitutions) && substitutions.length) {
      text = String(text).replace(/\$(\d)/g, (_, i) => {
        const v = substitutions[Number(i) - 1];
        return v === undefined || v === null ? '' : String(v);
      });
    }
    return text;
  }

  return {
    init,
    setPref,
    tr,
    systemLang,
    get pref() { return pref; },
    get lang() { return lang; }
  };
})();

globalThis.I18N = I18N;
