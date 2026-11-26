$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch { }

$RepoZip = 'https://github.com/suiyue145/google-search-direct/archive/refs/heads/main.zip'
# 优先放进 Chrome 用户数据目录下的专用插件文件夹；Chrome 不存在时才回退到旧路径
$ChromeUserData = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data'
$LegacyBaseDir = Join-Path $env:LOCALAPPDATA 'Google Search Direct'
if (Test-Path $ChromeUserData) {
  $BaseDir = Join-Path $ChromeUserData 'Google Search Direct'
} else {
  $BaseDir = $LegacyBaseDir
}
$InstallDir = Join-Path $BaseDir 'plugin'
$BackupDir = Join-Path $BaseDir 'backup'
$MetaFile = Join-Path $BaseDir 'install-info.txt'
$LegacyInstallDir = Join-Path $LegacyBaseDir 'plugin'
$script:MigratedFromLegacy = $false
$RuntimeFiles = @(
  'manifest.json', 'background.js', 'content.js', 'packs.js',
  'i18n-data.js', 'i18n.js',
  'options.html', 'options.js', 'popup.html', 'popup.js', 'icon128.png'
)
$script:AffectedVersion = ''

function Line {
  Write-Host ('-' * 60)
}

function Info([string]$Message) {
  Write-Host $Message
}

function Warn([string]$Message) {
  Write-Host ('注意: ' + $Message) -ForegroundColor Yellow
}

function Wait-Key {
  Write-Host ''
  Read-Host '按回车键返回菜单...' | Out-Null
}

function Migrate-Legacy {
  if ($script:MigratedFromLegacy) { return }
  if ((Test-Path (Join-Path $LegacyInstallDir 'manifest.json')) -and
      -not (Test-Path (Join-Path $InstallDir 'manifest.json')) -and
      ($LegacyInstallDir -ne $InstallDir)) {
    New-Item -ItemType Directory -Force -Path $BaseDir | Out-Null
    Copy-Item -Path $LegacyInstallDir -Destination $InstallDir -Recurse -Force
    $script:MigratedFromLegacy = $true
    Info ('已将旧目录的插件复制到 Chrome 插件目录：' + $InstallDir)
  }
}

function Get-Version([string]$Dir) {
  $manifest = Join-Path $Dir 'manifest.json'
  if (-not (Test-Path $manifest)) { return '' }
  try {
    $text = Get-Content -Path $manifest -Raw -Encoding UTF8
    if ($text -match '"version"\s*:\s*"([^"]+)"') { return $Matches[1] }
  } catch { }
  return ''
}

function Copy-ToClipboard([string]$Text) {
  try {
    Set-Clipboard -Value $Text -ErrorAction Stop
    return $true
  } catch {
    try {
      $Text | clip.exe
      return $true
    } catch {
      return $false
    }
  }
}

function Expand-Source([string]$Zip, [string]$Dest) {
  if (Get-Command Expand-Archive -ErrorAction SilentlyContinue) {
    Expand-Archive -Path $Zip -DestinationPath $Dest -Force
  } else {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($Zip, $Dest)
  }
}

function Download-Source([string]$WorkDir) {
  Info '正在从 GitHub 下载最新版本...'
  $zip = Join-Path $WorkDir 'plugin.zip'
  Invoke-WebRequest -Uri $RepoZip -OutFile $zip -UseBasicParsing

  Info '正在解压...'
  $extract = Join-Path $WorkDir 'src'
  New-Item -ItemType Directory -Force -Path $extract | Out-Null
  Expand-Source $zip $extract

  $src = Join-Path $extract 'google-search-direct-main'
  if (-not (Test-Path (Join-Path $src 'manifest.json'))) {
    throw '解压结果里找不到 manifest.json'
  }
  return $src
}

function Install-Files([string]$Src) {
  $version = Get-Version $Src
  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

  if (Test-Path (Join-Path $InstallDir 'manifest.json')) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    $oldVersion = Get-Version $InstallDir
    if ($oldVersion) {
      $stamp = Get-Date -Format 'yyyyMMddHHmmss'
      $dest = Join-Path $BackupDir ('v' + $oldVersion + '-' + $stamp)
      Copy-Item -Path $InstallDir -Destination $dest -Recurse -Force
      Get-ChildItem -Path $BackupDir -Directory |
        Sort-Object Name -Descending |
        Select-Object -Skip 2 |
        ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
    }
  }

  # 清掉旧文件，避免升级后残留废弃文件
  Get-ChildItem -Path $InstallDir -Force | Remove-Item -Recurse -Force

  foreach ($f in $RuntimeFiles) {
    $from = Join-Path $Src $f
    if (Test-Path $from) {
      Copy-Item -Path $from -Destination $InstallDir -Force
    } else {
      Warn ('缺少文件 ' + $f + '（已跳过）')
    }
  }
  $locales = Join-Path $Src '_locales'
  if (Test-Path $locales) {
    Copy-Item -Path $locales -Destination $InstallDir -Recurse -Force
  }

  $lines = @(
    '版本: ' + $version,
    '安装时间: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'),
    '目录: ' + $InstallDir,
    '来源: ' + $RepoZip
  )
  Set-Content -Path $MetaFile -Value $lines -Encoding UTF8
  $script:AffectedVersion = $version
}

function Open-ExtensionsPage {
  $chromePaths = @()
  if ($env:ProgramFiles) { $chromePaths += (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe') }
  $pf86 = ${env:ProgramFiles(x86)}
  if ($pf86) { $chromePaths += (Join-Path $pf86 'Google\Chrome\Application\chrome.exe') }
  if ($env:LOCALAPPDATA) { $chromePaths += (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe') }

  foreach ($p in $chromePaths) {
    if (Test-Path $p) {
      Start-Process -FilePath $p -ArgumentList 'chrome://extensions' | Out-Null
      return
    }
  }

  $edgePaths = @()
  if ($env:ProgramFiles) { $edgePaths += (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe') }
  if ($pf86) { $edgePaths += (Join-Path $pf86 'Microsoft\Edge\Application\msedge.exe') }
  if ($env:LOCALAPPDATA) { $edgePaths += (Join-Path $env:LOCALAPPDATA 'Microsoft\Edge\Application\msedge.exe') }

  foreach ($p in $edgePaths) {
    if (Test-Path $p) {
      Start-Process -FilePath $p -ArgumentList 'edge://extensions' | Out-Null
      return
    }
  }

  Warn '没找到 Chrome/Edge，请手动打开浏览器扩展页'
}

function Print-FinalSteps([string]$Mode) {
  Line
  Info ('安装助手已完成文件准备 (版本 ' + $script:AffectedVersion + ')')
  if (Copy-ToClipboard $InstallDir) {
    Info ('插件目录已复制到剪贴板：' + $InstallDir)
  } else {
    Warn '无法写入剪贴板，请手动复制上面的路径'
  }
  Line
  Info '现在请在浏览器里完成最后一步：'
  if ($Mode -eq 'update') {
    Info '  1. 打开 chrome://extensions，找到「Google 搜索直达 / Google Search Direct」'
    Info '  2. 点该卡片上的「重新加载」按钮（圆形箭头图标）即可完成升级'
  } else {
    Info '  1. 打开 chrome://extensions，开启右上角「开发者模式」'
    Info '  2. 点「加载已解压的扩展程序」'
    Info '  3. 在弹出的窗口按 Ctrl+L，粘贴（Ctrl+V）刚才复制的路径，回车'
    Info '  4. 点「选择文件夹」完成安装'
    if ($script:MigratedFromLegacy) {
      Info '  补充：检测到旧目录，已复制到上面的 Chrome 插件目录；请在扩展页移除旧卡片后，用新路径重新加载一次。'
    }
  }
  Info ''
  Info '说明：Chrome 出于安全考虑不允许第三方扩展静默安装，最后这一步无法由脚本代替。'
  Line
}

function Do-Install {
  $work = Join-Path $env:TEMP ('gsd-install-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Force -Path $work | Out-Null
  try {
    $src = Download-Source $work
    Install-Files $src
    Open-ExtensionsPage
    Print-FinalSteps 'install'
  } catch {
    Warn ('操作失败: ' + $_.Exception.Message)
  } finally {
    Remove-Item -Path $work -Recurse -Force -ErrorAction SilentlyContinue
    Wait-Key
  }
}

function Do-Update {
  if (-not (Test-Path (Join-Path $InstallDir 'manifest.json'))) {
    Warn '当前没有检测到已安装的插件，请先选择安装'
    Wait-Key
    return
  }
  Info ('当前版本: ' + (Get-Version $InstallDir))
  $work = Join-Path $env:TEMP ('gsd-update-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Force -Path $work | Out-Null
  try {
    $src = Download-Source $work
    Install-Files $src
    Info ('已更新到版本: ' + $script:AffectedVersion)
    Open-ExtensionsPage
    Print-FinalSteps 'update'
  } catch {
    Warn ('操作失败: ' + $_.Exception.Message)
  } finally {
    Remove-Item -Path $work -Recurse -Force -ErrorAction SilentlyContinue
    Wait-Key
  }
}

function Do-Uninstall {
  if (Test-Path $InstallDir) {
    Remove-Item -Path $InstallDir -Recurse -Force
    Info ('已删除插件目录：' + $InstallDir)
    if (Test-Path $MetaFile) { Remove-Item -Path $MetaFile -Force }
  } else {
    Info '没有找到插件目录，无需卸载文件'
  }
  Info '请再到浏览器扩展页删除「Google 搜索直达 / Google Search Direct」扩展本身。'
  Info ('（备份保留在 ' + $BackupDir + '，可手动删除）')
  Open-ExtensionsPage
  Wait-Key
}

function Do-ShowPath {
  if (Test-Path (Join-Path $InstallDir 'manifest.json')) {
    Info ('已安装版本: ' + (Get-Version $InstallDir))
    Info ('插件目录: ' + $InstallDir)
    if (Copy-ToClipboard $InstallDir) { Info '路径已复制到剪贴板' }
  } else {
    Info '未检测到插件目录'
  }
  Wait-Key
}

Migrate-Legacy

while ($true) {
  Clear-Host
  Line
  Info 'Google 搜索直达 · Chrome 插件一键安装助手 (Windows)'
  Line
  if (Test-Path (Join-Path $InstallDir 'manifest.json')) {
    Info ('当前状态: 已安装 v' + (Get-Version $InstallDir))
  } else {
    Info '当前状态: 未安装'
  }
  Info ''
  Info '  1) 安装 / 重装（下载 GitHub 最新版）'
  Info '  2) 更新已安装的插件'
  Info '  3) 显示插件目录 / 复制路径'
  Info '  4) 卸载（删除本地插件文件）'
  Info '  0) 退出'
  Line
  $choice = (Read-Host '请输入选项后回车').Trim()
  switch ($choice) {
    '1' { Do-Install }
    '2' { Do-Update }
    '3' { Do-ShowPath }
    '4' { Do-Uninstall }
    '0' { exit 0 }
    default { Warn '无效选项，请重试'; Wait-Key }
  }
}
