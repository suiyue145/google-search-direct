#!/bin/bash
# Google 搜索直达 - macOS 一键安装助手
# 作用：下载最新插件源码 -> 放到固定目录 -> 打开 Chrome 扩展页 -> 复制目录路径
# 说明：Chrome 137+ 禁止静默安装第三方扩展，最后一步需要你在弹窗里粘贴路径并确认（约 2 次点击）
set -uo pipefail

REPO_ZIP="https://github.com/suiyue145/google-search-direct/archive/refs/heads/main.zip"
BASE_DIR="$HOME/Library/Application Support/Google Search Direct"
INSTALL_DIR="$BASE_DIR/plugin"
BACKUP_DIR="$BASE_DIR/backup"
META_FILE="$BASE_DIR/install-info.txt"

# 只安装运行必需文件，避免把 README、安装器一起塞进扩展目录
RUNTIME_FILES=(
  "manifest.json" "background.js" "content.js" "packs.js"
  "i18n-data.js" "i18n.js"
  "options.html" "options.js" "popup.html" "popup.js" "icon128.png"
)

line() { printf '%s\n' "------------------------------------------------------------"; }
info() { printf '%s\n' "$1"; }
warn() { printf '%s\n' "注意: $1"; }

pause() {
  info ""
  read -r -p "按回车键返回菜单..." _unused
}

check_tools() {
  local missing=0
  for tool in curl unzip; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      warn "缺少命令 $tool，请先安装后重试"
      missing=1
    fi
  done
  return "$missing"
}

version_of() {
  if [ -f "$1/manifest.json" ]; then
    grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$1/manifest.json" \
      | head -1 | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/'
  fi
}

download_source() {
  local work="$1"
  info "正在从 GitHub 下载最新版本..."
  if ! curl -fsSL "$REPO_ZIP" -o "$work/plugin.zip"; then
    warn "下载失败，请检查网络后重试"
    return 1
  fi
  info "正在解压..."
  if ! unzip -q "$work/plugin.zip" -d "$work"; then
    warn "解压失败，安装包可能已损坏"
    return 1
  fi
  local src="$work/google-search-direct-main"
  if [ ! -f "$src/manifest.json" ]; then
    warn "解压结果里找不到 manifest.json"
    return 1
  fi
  SOURCE_DIR="$src"
  return 0
}

install_files() {
  local src="$1" version
  version="$(version_of "$src")"
  mkdir -p "$INSTALL_DIR"

  # 备份旧版本（保留最近两份）
  if [ -f "$INSTALL_DIR/manifest.json" ]; then
    mkdir -p "$BACKUP_DIR"
    local old_ver
    old_ver="$(version_of "$INSTALL_DIR")"
    if [ -n "$old_ver" ]; then
      cp -R "$INSTALL_DIR" "$BACKUP_DIR/v${old_ver}-$(date +%Y%m%d%H%M%S)" 2>/dev/null || true
      ls -1dt "$BACKUP_DIR"/* 2>/dev/null | tail -n +3 | while read -r old; do rm -rf "$old"; done
    fi
  fi

  # 清掉旧文件再复制（避免升级后残留废弃文件）
  find "$INSTALL_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  for f in "${RUNTIME_FILES[@]}"; do
    cp "$src/$f" "$INSTALL_DIR/" 2>/dev/null || warn "缺少文件 $f（已跳过）"
  done
  if [ -d "$src/_locales" ]; then
    cp -R "$src/_locales" "$INSTALL_DIR/"
  fi

  {
    info "版本: $version"
    info "安装时间: $(date '+%Y-%m-%d %H:%M:%S')"
    info "目录: $INSTALL_DIR"
    info "来源: $REPO_ZIP"
  } > "$META_FILE"

  AFFECTED_VERSION="$version"
  return 0
}

open_extensions_page() {
  if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "Google Chrome" "chrome://extensions" 2>/dev/null || open "chrome://extensions"
  elif [ -d "/Applications/Microsoft Edge.app" ]; then
    open -a "Microsoft Edge" "edge://extensions" 2>/dev/null || open "edge://extensions"
  else
    warn "没找到 Chrome/Edge，请手动打开浏览器扩展管理页"
  fi
}

print_final_steps() {
  local mode="$1"
  line
  info "安装助手已完成文件准备 (版本 $AFFECTED_VERSION)"
  info "插件目录已复制到剪贴板：$INSTALL_DIR"
  line
  info "现在请在浏览器里完成最后一步："
  if [ "$mode" = "update" ]; then
    info "  1. 打开 chrome://extensions，找到「Google 搜索直达 / Google Search Direct」"
    info "  2. 点该卡片上的「重新加载」按钮（圆形箭头图标）即可完成升级"
  else
    info "  1. 打开 chrome://extensions，开启右上角「开发者模式」"
    info "  2. 点「加载已解压的扩展程序」"
    info "  3. 在弹出的选择窗口按 Shift+Command+G，粘贴（Command+V）刚才复制的路径，回车"
    info "  4. 点「选择」/「打开」完成安装"
  fi
  info ""
  info "说明：Chrome 出于安全考虑不允许第三方扩展静默安装，最后这一步无法由脚本代替。"
  line
}

do_install() {
  check_tools || { pause; return; }
  local work
  work="$(mktemp -d)"
  if download_source "$work" && install_files "$SOURCE_DIR"; then
    printf '%s' "$INSTALL_DIR" | pbcopy 2>/dev/null || warn "无法写入剪贴板，请手动复制上面的路径"
    open_extensions_page
    print_final_steps "install"
  fi
  rm -rf "$work"
  pause
}

do_update() {
  if [ ! -f "$INSTALL_DIR/manifest.json" ]; then
    warn "当前没有检测到已安装的插件，请先选择安装"
    pause
    return
  fi
  check_tools || { pause; return; }
  info "当前版本: $(version_of "$INSTALL_DIR")"
  local work
  work="$(mktemp -d)"
  if download_source "$work" && install_files "$SOURCE_DIR"; then
    info "已更新到版本: $AFFECTED_VERSION"
    open_extensions_page
    print_final_steps "update"
  fi
  rm -rf "$work"
  pause
}

do_uninstall() {
  if [ ! -d "$INSTALL_DIR" ]; then
    info "没有找到插件目录，无需卸载文件"
  else
    rm -rf "$INSTALL_DIR"
    info "已删除插件目录：$INSTALL_DIR"
    rm -f "$META_FILE"
  fi
  info "请再到浏览器扩展页删除「Google 搜索直达 / Google Search Direct」扩展本身。"
  info "（备份保留在 $BACKUP_DIR，可手动删除）"
  open_extensions_page
  pause
}

do_show_path() {
  if [ -f "$INSTALL_DIR/manifest.json" ]; then
    info "已安装版本: $(version_of "$INSTALL_DIR")"
    info "插件目录: $INSTALL_DIR"
    printf '%s' "$INSTALL_DIR" | pbcopy 2>/dev/null && info "路径已复制到剪贴板"
  else
    info "未检测到插件目录"
  fi
  pause
}

while true; do
  clear 2>/dev/null || true
  line
  info "Google 搜索直达 · Chrome 插件一键安装助手 (macOS)"
  line
  if [ -f "$INSTALL_DIR/manifest.json" ]; then
    info "当前状态: 已安装 v$(version_of "$INSTALL_DIR")"
  else
    info "当前状态: 未安装"
  fi
  info ""
  info "  1) 安装 / 重装（下载 GitHub 最新版）"
  info "  2) 更新已安装的插件"
  info "  3) 显示插件目录 / 复制路径"
  info "  4) 卸载（删除本地插件文件）"
  info "  0) 退出"
  line
  read -r -p "请输入选项后回车: " choice
  case "$choice" in
    1) do_install ;;
    2) do_update ;;
    3) do_show_path ;;
    4) do_uninstall ;;
    0) exit 0 ;;
    *) warn "无效选项，请重试"; pause ;;
  esac
done
