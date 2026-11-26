# Google 搜索直达（Chrome 插件）

选中任意文字 → 右键 → 自动 Google 搜索 → 按**当前网站包**的优先顺序打开结果链接。

内置 9 套按爱好分类的网站包（通用、小说、影视、购物、学术、开发、新闻、音乐、AI）。界面支持**简体中文 / English**，默认自动跟随系统语言，也可在设置页固定；新安装的**默认网站列表**按语言/国家自动选择（中文用户用国内常用站，英文用户用国际常用站，英/加/澳另有本地微调）。发布名称与描述采用中英混合。纯前端、无服务器、无追踪，Manifest V3。

## 安装

### 方式一：一键安装助手（macOS，推荐）

进入仓库 `installer/` 目录，双击 `一键安装-Mac.command`，选「1) 安装 / 重装」。脚本会自动下载 GitHub 最新版、放到固定目录、打开扩展页并复制目录路径；你只需在「加载已解压的扩展程序」弹窗里按 `Shift+Command+G` 粘贴路径并确认。详见 `installer/使用说明.md`。

> Chrome 137+ 禁止第三方扩展静默安装（`--load-extension` 参数已移除），所以最后一步必须由用户在浏览器里亲自确认，这是浏览器限制，不是脚本缺陷。

### 方式二：从 GitHub 源码手动安装

1. 点右上角 Code → Download ZIP，下载后解压
2. 打开 Chrome，地址栏输入 `chrome://extensions`
3. 右上角打开「开发者模式」
4. 点击「加载已解压的扩展程序」，选择**解压后的文件夹**（里面应能看到 `manifest.json`）
5. 安装后点工具栏图标即可看到 9 个网站包；默认包由系统语言决定（中文→通用工具，英文→General）

> 注意：Chrome 会记住这个文件夹的位置，不能删除或移动它。开发模式下每次打开浏览器会显示"请停用开发者模式"的提示，属于正常现象，不影响使用。

也可以命令行克隆：

```bash
git clone https://github.com/suiyue145/google-search-direct.git
```

许可证：MIT（见 LICENSE 文件）。

## 使用

1. 点工具栏图标 → 选一个网站包（例如「小说阅读」）；或按快捷键直接切
2. 在任意网页选中一段文字
3. 右键菜单选择「Google 搜索并打开「包名」结果」
4. 插件依次检查 Google 结果：**当前包里第一个有结果的网站被打开；没有就试下一个，以此类推**；全部没有则保留 Google 页面

打开方式两种（设置页可改）：

- **新标签页打开（推荐）**：Google 结果页保留，目标网站在新标签打开
- **当前标签页跳转**：直接在当前页跳到目标网站，更接近"直达"

## 语言与默认网站列表

- **界面语言**：默认「跟随系统语言（自动）」——读取浏览器界面语言（简体中文 / English，其他语言回退英文），也可在设置页固定为简体中文或 English。切换后右键菜单、工具栏提示、弹窗、设置页和内置包名都会立即更新；已打开的页面自动刷新。
- **默认网站列表**：首次安装时按浏览器语言自动选择——
  - 中文（`zh-*`）→ 国内常用站点（知乎、起点、淘宝、知网等）
  - 英文（`en-*`）→ 国际常用站点（Wikipedia、Reddit、Goodreads、IMDb、Amazon、BBC 等）
  - `en-GB` / `en-CA` / `en-AU` 会把购物、新闻首站微调为当地站点（如 `amazon.co.uk`、`bbc.com`）
- **手动切换**：设置页顶部「默认网站列表」可选「跟随系统语言 / 中文网站 / 英文网站」。切换时内置包会替换，**自建包会保留**；已有的自定义配置不会被覆盖。
- 已安装的老用户升级后保持原有网站包不变，不会因语言重置。

## 快捷键

Chrome 限制每个扩展最多只能预置 **4 个**默认快捷键，所以采用"全局 4 键 + 弹窗全键"的方案：

| 操作 | 作用 |
|---|---|
| `Alt+Shift+1` / `2` / `3` | 全局直接切到第 1/2/3 个网站包 |
| `Alt+Shift+0` | 全局循环切换到下一个网站包 |
| 点图标后按 `1`~`9` | 在弹出面板里直接切到第 1~9 个包（覆盖全部） |
| 点图标后按 `0` | 在弹出面板里循环切换 |

第 4~9 个包也可以分配成全局键：打开 `chrome://extensions/shortcuts`，找到对应语言的「切换到网站包 4~9」自行绑定。已有的 4 个键被系统占用时也可以在那里改。工具栏图标上会显示当前包的序号角标（1~9），鼠标悬停可看到包名。

## 内置网站包

中文预设（节选）：

| # | 包 | 部分收录站点 |
|---|---|---|
| 1 | 🧰 通用工具 | 知乎、百度百科、维基百科、豆瓣、GitHub |
| 2 | 📚 小说阅读 | 番茄小说、起点、晋江、微信读书、七猫、17K、纵横、掌阅 |
| 3 | 🎬 影视观影 | B站、央视频、CCTV、1905电影网、腾讯/爱奇艺/优酷/芒果TV、豆瓣电影 |
| 4 | 🛒 购物比价 | 什么值得买、淘宝、京东、拼多多、天猫、唯品会、1688、慢慢买 |
| 5 | 📖 学术文献 | 知网、万方、arXiv、PubMed、Semantic Scholar、X-MOL、DOI |
| 6 | 💻 开发技术 | GitHub、Stack Overflow、MDN、掘金、CSDN、npm、React、Vue |
| 7 | 📰 新闻资讯 | 新华网、人民网、澎湃、中新网、央视新闻、虎嗅 |
| 8 | 🎵 音乐听书 | 网易云音乐、QQ音乐、酷狗、酷我、喜马拉雅、B站 |
| 9 | 🤖 AI 人工智能 | 量子位、机器之心、AI 工具集、通义、豆包、文心一言、智谱清言、Hugging Face、arXiv |

英文预设（节选）：

| # | Pack | Examples |
|---|---|---|
| 1 | 🧰 General | Wikipedia, Reddit, Quora, Britannica, GitHub |
| 2 | 📚 Books | Goodreads, Project Gutenberg, Internet Archive, Open Library, Amazon |
| 3 | 🎬 Movies & TV | IMDb, YouTube, Rotten Tomatoes, TMDB, Netflix, Disney+ |
| 4 | 🛒 Shopping | Amazon, eBay, Walmart, Best Buy, Target, PriceGrabber |
| 5 | 📖 Research | arXiv, PubMed, Semantic Scholar, Google Scholar, JSTOR, DOI |
| 6 | 💻 Development | GitHub, Stack Overflow, MDN, npm, React, Vue, Python docs |
| 7 | 📰 News | BBC, Reuters, AP, The Guardian, NYT, WSJ |
| 8 | 🎵 Music & Audio | Spotify, Apple Music, YouTube, SoundCloud, Pandora, Audible |
| 9 | 🤖 AI & Tools | OpenAI, Anthropic, Hugging Face, Google AI, DeepMind, Papers with Code, arXiv, TechCrunch, The Verge |

**合规说明**：只收录官方/正版站点。影视包里的商业平台通常设有免费专区或试看内容，是否免费以各站页面标识为准；插件本身不托管、不提供任何内容，只是帮你打开 Google 搜索里已有的结果。请勿自行添加盗版小说/影视站——那既不合法，也容易导致商店下架。

## 自定义与分享配置

点插件图标 →「管理网站包」（或右键图标 → 选项）：

- 改包名、图标、域名列表，用 ↑↓ 调优先级
- 新建自定义包、删除自定义包（内置包不可删但可改）
- **导出 / 导入配置**：点「导出到文本框」生成一段 JSON（含语言预设），复制发给别人；对方粘贴后点「导入」即可复用整套网站包——适合给同一爱好的一群人配置

## 设计细节

- **按列表顺序优先**，不是按搜索结果的出现顺序：即使第二个网站的链接在结果页里排得更靠前，只要第一个网站有结果，就打开第一个网站的
- 同一网站有多条结果时，取该网站在搜索结果里排名最靠前的那条
- 匹配的是链接的真实域名（`host === 域名` 或以 `域名.` 结尾），不是网页文字，所以不会误判
- 同时兼容 Google 的直链和 `/url?q=...` 跳转链，以及子域名
- 最多等 12 秒让 Google 异步填充结果；所有网站都没有结果就保持 Google 页面不动
- 用一次性 `ext_token` 识别右键触发的那次搜索，手动搜索不会误触发
- 只发**只读搜索请求**，不登录、不下单、不收集选中文字以外的数据
- 版本 1.0 的单域名、1.1 的自定义域名列表会自动迁移成「我的网站」包，不会丢失设置
- 翻译文本在 `_locales/*.json` 维护，`i18n-data.js` 是生成文件；改完消息后需重新生成（见维护指南）

## 常见问题

**没有自动打开？**
- 确认当前生效的包（工具栏图标角标）里确实有对应网站，且域名填对了（填 `qidian.com`，不是 `https://www.qidian.com/...`）
- 这次 Google 结果里确实没有任何一个设置网站的链接——插件不会强行跳到别的网站
- 出现了 Google 的 "Before you continue" 同意页——同意后再试
- Google 调整了结果页 DOM 结构——改 `content.js` 里的 `findFirstMatch` 选择器即可

**界面语言不对？**
打开设置页，在最上方「界面语言」选择「跟随系统语言（自动）」或固定为简体中文 / English。浏览器扩展无法直接读取操作系统语言，「跟随系统」实际读取浏览器界面语言；其他语言回退英文。网站列表可在下方单独指定，不依赖界面语言。

**快捷键没反应？**
Chrome 每个扩展最多只允许 4 个预置默认键，本插件已把 `Alt+Shift+1/2/3/0` 预置好；其余「切换到网站包 4~9」默认未绑定，需去 `chrome://extensions/shortcuts` 自行设置。若预置键被占用，在那里改键即可；最快捷的兜底是点图标后在弹窗里按数字键 1~9。

**想改成其他搜索引擎？**
把 `background.js` 里 `searchUrl` 的 `https://www.google.com/search?q=` 换成目标搜索引擎地址，并在 `manifest.json` 的 `content_scripts.matches` 加上对应域名。

**支持哪些 Google 域名？**
发布版固定用 `www.google.com`（搜索链接就是这个域名），主机权限也只申请了这一个，这是 Chrome Web Store 审核最容易通过的配置。如果在其他地区的 Google 域名上使用，可在 `manifest.json` 的 `host_permissions` 和 `content_scripts.matches` 里加上对应域名再重新打包。

---

# English

Select any text, right-click, search it on Google, and let the extension open the first matching result from your **active site pack**.

9 built-in packs (General, Books, Movies & TV, Shopping, Research, Development, News, Music & Audio, AI & Tools). The interface supports **Simplified Chinese / English**, follows your system/browser language by default and can be pinned in options. New installs also get a locale-appropriate site list (Chinese sites for `zh-*`, international sites for `en-*`, with GB/CA/AU tweaks). Store listing uses a bilingual mixed-language title and description. No server, no tracking, Manifest V3.

## Install

### Option 1: one-click installer (macOS, recommended)

Open the `installer/` folder and double-click `一键安装-Mac.command`, then choose "1) Install". It downloads the latest release from GitHub, places it in a stable folder, opens the extensions page and copies the folder path. You only need to paste the path in the "Load unpacked" dialog (`Shift+Command+G`, then `Command+V`). See `installer/使用说明.md`.

> Chrome 137+ removed `--load-extension` and blocks silent third-party extension installs, so the final confirmation in the browser cannot be automated.

### Option 2: install manually from source

1. Download the ZIP from GitHub and unzip it.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder (the one containing `manifest.json`).
5. Click the toolbar icon to see the 9 packs. The default pack follows your browser language.

## How to use

1. Click the toolbar icon and pick a pack (or use a shortcut).
2. Select text on any page.
3. Right-click → "Google Search and open \"Pack\" results".
4. The extension checks Google results in order and opens the first site in the pack that has a result; if none match, the Google page stays open.

Open mode: **new tab** (recommended, keeps Google results) or **navigate in the current tab**.

## Language and default site list

- **UI language** follows your system/browser language by default (Simplified Chinese or English; other languages fall back to English) and can be pinned from options. Menus, popup, options and built-in pack names update immediately.
- **Default site list** on first install: `zh-*` → Chinese sites (Zhihu, Qidian, Taobao, CNKI...); `en-*` → international sites (Wikipedia, Reddit, Goodreads, IMDb, Amazon, BBC...). `en-GB`/`en-CA`/`en-AU` use local shopping and news sites (e.g. `amazon.co.uk`, `bbc.com`).
- **Manual override**: in options, "Default site list" lets you choose Follow system language / Chinese sites / English sites. Built-in packs are replaced on switch; your custom packs are kept. Existing installations are never reset.

## Shortcuts

Chrome allows at most **4 preset shortcuts** per extension, so this extension uses 4 global keys plus full in-popup coverage:

| Action | Effect |
|---|---|
| `Alt+Shift+1` / `2` / `3` | Switch to pack 1/2/3 globally |
| `Alt+Shift+0` | Cycle to the next pack globally |
| Click icon, press `1`-`9` | Switch to any pack in the popup |
| Click icon, press `0` | Cycle packs in the popup |

Packs 4-9 can be assigned global keys at `chrome://extensions/shortcuts`. The toolbar badge shows the active pack number.

## Built-in packs (English preset)

General: Wikipedia, Reddit, Quora, Britannica, GitHub. Books: Goodreads, Project Gutenberg, Internet Archive, Open Library, Amazon, Bookshop.org. Movies & TV: IMDb, YouTube, Rotten Tomatoes, TMDB, Metacritic, Netflix, Disney+, Hulu, Prime Video. Shopping: Amazon, eBay, Walmart, Best Buy, Target, PriceGrabber, Google Shopping. Research: arXiv, PubMed, Semantic Scholar, Google Scholar, JSTOR, DOI, Springer, ScienceDirect. Development: GitHub, Stack Overflow, MDN, npm, React, Vue, Python docs, Medium. News: BBC, Reuters, AP, The Guardian, NYT, WSJ, Al Jazeera. Music & Audio: Spotify, Apple Music, YouTube, SoundCloud, Pandora, Audible. AI & Tools: OpenAI, Anthropic, Hugging Face, Google AI, DeepMind, Papers with Code, arXiv, TechCrunch, The Verge, Product Hunt.

Only legitimate/official sites are bundled. The extension hosts no content; it simply opens links that already exist in your Google results. Please do not add pirated sites.

## Customization and sharing

Open options from the popup ("Manage packs"): edit pack names, icons and domains, reorder priorities, create custom packs, and export/import the whole configuration as JSON (including the locale preference).

## Privacy and details

Matching uses the real link hostname (exact match or subdomain), not page text; Google direct links and `/url?q=...` redirects are both supported. A one-time `ext_token` ensures only your right-click triggers an auto-open. The extension waits up to 12 seconds for asynchronous results and does nothing if no site matches. Only a read-only Google search is performed; no account, analytics or developer-server uploads. Settings stay in your browser. MIT licensed.
