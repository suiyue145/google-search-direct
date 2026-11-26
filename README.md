# Google 搜索直达（Chrome 插件）

选中任意文字 → 右键 → 自动 Google 搜索 → 在结果中找到指定网站的链接并打开。

纯前端、无服务器、无追踪，Manifest V3。

## 安装（从 GitHub 源码）

1. 点右上角 Code → Download ZIP，下载后解压
2. 打开 Chrome，地址栏输入 `chrome://extensions`
3. 右上角打开「开发者模式」
4. 点击「加载已解压的扩展程序」，选择**解压后的文件夹**（里面应能看到 `manifest.json`）
5. 首次安装会自动弹出设置页；以后也可以点插件图标 →「选项」进入

> 注意：Chrome 会记住这个文件夹的位置，不能删除或移动它。开发模式下每次打开浏览器会显示"请停用开发者模式"的提示，属于正常现象，不影响使用。

也可以用命令行克隆：

```bash
git clone <你的仓库地址>
```

许可证：MIT（见 LICENSE 文件）。

## 使用

1. 在设置页填默认网站域名（例如 `zhihu.com`、`github.com`），选打开方式
2. 在任意网页选中一段文字
3. 右键菜单选择「Google 搜索并自动打开默认网站」
4. 插件打开 Google 搜索，找到第一个属于该域名的结果链接后自动打开

打开方式两种：

- **新标签页打开（推荐）**：Google 结果页保留，目标网站在新标签打开
- **当前标签页跳转**：直接在当前页跳到目标网站，更接近"直达"

## 设计细节

- 匹配的是链接的真实域名（`host === 域名` 或以 `域名.` 结尾），不是网页文字，所以不会误判
- 同时兼容 Google 的直链和 `/url?q=...` 跳转链
- 最多等 12 秒让 Google 异步填充结果；没有匹配结果就保持 Google 页面不动
- 用一次性 `ext_token` 识别右键触发的那次搜索，手动搜索不会误触发
- 只发**只读搜索请求**，不登录、不下单、不收集选中文字以外的数据

## 常见问题

**没有自动打开？**
- 检查设置里的域名是否填了、是否写错（填 `zhihu.com` 而不是 `https://www.zhihu.com/...`）
- 这次 Google 结果里确实没有该域名的链接——插件不会强行跳到别的网站
- 出现了 Google 的 "Before you continue" 同意页——同意后再试
- Google 调整了结果页 DOM 结构——改 `content.js` 里的 `findMatch` 选择器即可

**想改成其他搜索引擎？**
把 `background.js` 里 `searchUrl` 的 `https://www.google.com/search?q=` 换成目标搜索引擎的地址，并在 `manifest.json` 的 `content_scripts.matches` 加上对应域名。

**支持哪些 Google 域名？**
发布版固定用 `www.google.com`（搜索链接就是这个域名），主机权限也只申请了这一个，这是 Chrome Web Store 审核最容易通过的配置。如果在其他地区的 Google 域名上使用，可在 `manifest.json` 的 `host_permissions` 和 `content_scripts.matches` 里加上对应域名再重新打包。
