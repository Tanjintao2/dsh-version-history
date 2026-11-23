# Changelog

All notable changes to this plugin. Versions follow the git tags in this repo;
each tag has a matching GitHub Release with an installable tarball.

## 0.1.16

- **备份可验证**（`lib/backup.js`）：每个仓镜像完再跑 `git fsck --no-progress` 与
  `git bundle verify`，结果进 `lastRun.repos[].verify`；`okCount` 现在要求三步全过
  （镜像 / bundle / 校验），面板上会显示「已校验」。代价：一次一键拷贝从 ~5 s 变 ~11 s。
- **PAT 到期提醒**：GitHub 面板可填令牌到期日（`tokenExpiry`，`POST /dsh-vh/gh` 的
  `set-expiry`），7 天内标黄并在面板顶部提示；到期后绑定/测试/推送都会失败，先看这里。
- **SMART 时效**：磁盘面板显示「SMART 采集于 N 小时前」，超过 24 h 标黄并提示重扫。
- **关于 / 诊断**（新路由 `GET /diag.json` + 顶栏「关于」）：插件版本、实际加载路径、
  8 条路由清单、7 个数据文件（`data.json` / `health.json` / `backup.json` / `github.json` /
  `smart.json` / `repos.json` / 报告 HTML）的存在性、大小与 mtime。上次「重启后全 404」
  就是靠这条查出来的。
- **生成提速**（`E:\Git\scripts\visualize.ps1`）：每版 diff 按 `(仓, base, tip)` 缓存到
  `<报告目录>\.cache\diff-cache.json`，短 sha 改为从一次 `git log --all` 建表。
  4 仓 60 标签：**冷跑 19.7 s → 15.8 s，热跑 6.1 s**（首次构建缓存后逐次命中）。
  设 `VH_TIMING=1` 可看阶段耗时。
- **GitHub 状态并发**：`/data.json` 的逐仓 `ls-remote` 改为 3 路并发，仓多时不至于排队。
- **CI**：新增 `.github/workflows/selftest.yml`，push / PR 在 Node 20 与 22 上跑
  `node --check` + `selftest-panel.mjs` + `selftest-backup.mjs` + `selftest-lan.mjs`。
- **局域网只读 + 口令**：局域网面板新增「只读模式」（拒绝 `git-receive-pack`，push 收到 403）
  与 Basic 口令（401 带 `WWW-Authenticate`）；设置存 `lan.json`，Host 侧走
  `POST /dsh-vh/lan`。无鉴权仍是默认，只读/口令都是按需开。

## 0.1.15

- **「禁止推送」锁（默认关）**：「备份设置」新增「推送保护」卡。锁上以后，Host 侧在
  `POST /dsh-vh/gh` 里拦截 `push` / `publish`，直接返回 **423** 与一段说明，远端什么都收不到；
  解锁就恢复。这个开关**不校验许可密码**（否则忘了密码就永远解不开）。
  - `lib/backup.js`：`status()` 多回 `pushLock`，新增 `setPushLock({ locked })`。
  - `lib/index.js`：`POST /dsh-vh/backup` 新增 `set-push-lock`；`/dsh-vh/gh` 在 `push`/`publish` 前查锁。
- **右键推送前确认**：仓库有未提交改动、或还没有任何版本标签时，右键「推送到私有/公开仓库」不再直接推，
  先弹一个确认框列出原因（「有 N 处未提交改动」「还没有任何版本标签」），点「仍然推送」才真推。
  没有这类情况时维持原来的一键直推。
  - `lib/client.js`：`publishWarnings()` / `publishRepo()`（先判后弹）/ `doPublish()`（真正执行），
    新增 `.vh-confirm*` 样式与 `仍然推送` 按钮；中英文文案都补齐。
- 自测：`selftest-panel.mjs` 新增 `confirmPush` 断言（先弹框、确认前没有任何 `POST /dsh-vh/gh`、
  确认后才出现）；`selftest-backup.mjs` 新增 `pushLock` 开/关往返断言。两个脚本 exit 0。
- 实测：锁着时 `publish` → `423 {"ok":false,"locked":true,...}`；解锁后同样请求 → `ok:true`、5.2 s、
  `created:false`（仓库已存在）、`origin:keep`。

## 0.1.14

- **文档截图与示例路径全面脱敏**（发布的图片和文字里不再带本机信息）：
  - `render-preview.mjs` 在渲染前把数据换成中性占位：仓库路径 → `D:\repos\<name>`、镜像根目录 →
    `D:\GitMirror`、物理盘型号/序列号 → `Demo SSD/HDD <容量>` + `SN-DEMO-xx`、局域网 IP →
    `192.168.1.10`。预览页只用于 README 截图，所以这一步没有开关，恒生效。
  - README 的 `panel-main.png` / `panel-backup.png` 用脱敏后的预览重截（Windows 用户名与家目录、
    硬盘序列号、镜像路径都不再出现在图里）。
- **代码里的提示文案不再写死盘符**：`lib/client.js` 的 tooltip / 错误提示改成
  `backup.ps1`、`disk-health.ps1`、`smart.log`、`repos 目录` 这类说法，不再指向某个具体盘；
  README / DETAIL / CHANGELOG 里的示例路径统一成 `D:\…`。
- 自测：`selftest.mjs`、`selftest-panel.mjs`、`selftest-backup.mjs` 均 exit 0；
  `render-preview.mjs` 五种模式的产物都验过不再含 `C:\Users\`、盘型号、内网 IP。

## 0.1.13

- **仓库行右键菜单：手动选择「推送到私有仓库」/「推送到公开仓库」**。在左栏项目行上右键，弹出
  菜单（仓库名 + 两项推送 + 复制仓库路径 + 取消），点哪一项就在对应可见性下建仓（已存在则复用）
  并 `git push` 当前分支 + `--tags`，最后把结果与仓库 URL 写回面板提示。
- 后端 `lib/github.js` 新增 `publish({ repoPath, name, visibility, branch, token })`：
  用 PowerShell `Invoke-RestMethod` 走系统代理（`/user` 取 login → `GET /repos/<login>/<name>`
  判断是否已存在，404 才 `POST /user/repos` 建仓），再用 `-c http.https://github.com/.extraheader`
  注入令牌推送；**只在仓库还没有 `origin` 时才 `git remote add`**，已绑定的仓库不动它的 remote。
  同名清理用 `sanitizeRepoName()`（非 `[A-Za-z0-9._-]` 折成 `-`）。
- 新路由动作：`POST /dsh-vh/gh` 的 `{action:'publish', repoPath, name, visibility, branch}`。
- 自测：`selftest-panel.mjs` 新增 `contextMenu` 段（对第一个仓库行触发 `onContextMenu` → 断言菜单四项、
  仓库名标题、点「推送到私有仓库」后的 `POST /dsh-vh/gh` 与提示文案、点完菜单关闭）。
- 预览：`render-preview.mjs` 支持 `VH_MENU=1`（渲染后自动在第一个仓库行上打开菜单），
  产物 `preview-main-menu.html`。

## 0.1.12

- **修：重启 DSH 后面板全 404（「读取失败：HTTP 404」/「Unexpected end of JSON input」/「本地 0 个仓库 / GitHub 未绑定 / 没有磁盘数据」）**。
  根因：`lib/index.js` 的 `apply()` 在入口就 `ctx.get('webServer')`，拿不到就 `return` ——
  重启后插件加载顺序变化，`webServer` 常常晚于本插件就绪，于是**一条路由都没注册**（而插件本身
  仍是 `enabled / active`，看起来完全正常）。
- 改法：把路由注册包进 `mount(webServer)`；`apply()` 里拿到 `webServer` 就立刻 `mount`，
  拿不到就 `ctx.inject(['webServer'], …)` 等它上线再 `mount`（两条路径都实测注册出
  `exact:/dsh-vh/gh`、`exact:/dsh-vh/backup`、`prefix:/version-history`）。
- 验收：重载后 `GET /version-history/health` 200（667 B，含全部路径）、
  `/version-history/data.json` 200（65913 B）、`/version-history/disks.json` 200（9141 B）。

## 0.1.11

- **面板加语言选择（中文 / English，默认中文）**：顶栏多一个下拉框，切换立即生效并把选择记在
  `localStorage['dsh-vh-lang']`，下次打开还是上次那个语言。
- 实现方式：`client.js` 里包了一层 `h()`（内部转 `React.createElement`）——英文模式下它会把
  字符串子节点与 `title` / `placeholder` / `aria-label` 等文案属性过一遍 `tx()`：先查整串字典
  `EN`，再按顺序试 `RULES` 正则（`N 个仓库`、`N 提交 · M 版`、`剩余 x / y · 已用 n%` 这类带数字的
  碎片），最后对 `1 commits` 这类做单复数修正。**中文模式完全不走这条路径**（`h()` 直接透传），
  所以默认行为与 0.1.10 逐字节一致。
- 未覆盖的只有「数据本身」——仓库名、路径、提交信息、卷标（如 `文档` / `新加卷`）保持原样。
- 自测：`selftest-panel.mjs` 新增 `english` 段（用 stub `localStorage` 重新加载模块后渲染），
  断言标题 `Git Manager`、按钮 `Regenerate / Disk panel / LAN / Backup / Open in new tab`、
  左栏 `Repository sources`、标签 `Local`，并且整棵树里不再出现 `GIT管理`；
  `render-preview.mjs` 支持 `VH_LANG=en` 出英文预览。

## 0.1.10

- **README 补备份设置页截图** `docs/screenshots/panel-backup.png`（密码 / 镜像目录 + 保留份数 /
  自动备份卡 / 一键拷贝的四仓明细与耗时），同样由 `render-preview.mjs --backup` 渲染真实组件树后截取。
- `render-preview.mjs` 的 JSON 输出补 `mode: "backup"` 分支 —— 以前 `--backup` 也能渲染真页面，
  但回执里 `mode` 会误报成 `disks`，排查时容易误判成「没接」。

## 0.1.9

- **README 增补「从 Release 的 tarball 安装」**（方式 A）：下载 `dsh-version-history-<版本>.tgz`
  → `tar -xzf` 解出 `package/` → `plugin_manager install_bundle target=<package 目录>` →
  `set_plugin false → true` 重载 host half。另附「怎么确认装的是哪个版本」
  （看已装目录 `package.json` 的 `version`；`/version-history/health` 只回生效路径、不回版本号）。
- **README 截图更新到当前界面**：`docs/screenshots/panel-main.png`（三栏 + 磁盘列，
  顶栏此时已有 `备份`、`GitHub · 已绑定`，左栏仓库行带 `GitHub 已同步` 徽章）、
  `panel-github.png`（GitHub 绑定卡片）。两张都由 `render-preview.mjs` 渲染真实组件树后截取。

## 0.1.8

- **修「点 GitHub 管理会出右侧黑边」**：主面板顶栏（磁盘面板 / 局域网 / GitHub）与左栏来源卡的按钮
  以前会顺手 `layout.openRightbar()` + `sb.openTab()`，右侧栏那一列被强制打开、而 tab 还没被
  better-sidebar 选中渲染时就是一条空黑边。现在 `openView(name)` **只切主面板内的子视图**，
  不再碰右侧栏（右侧栏的 tab 仍然注册着，用户自己把右列打开时可用）。
- `selftest-panel.mjs` 的 `openDisks` 断言改成「不产生 openTab/openRightbar 调用，且子视图标题为 `← 返回磁盘`」。

## 0.1.7

- **左栏仓库行自动标 GitHub 状态**：每行名下面一行给两个徽章 —— `本地`/`局域网`，
  外加 `GitHub 已同步` / `GitHub 领先 N` / `GitHub 落后 N` / `GitHub 未推送` / `GitHub 分叉`。
  实现：Host 侧在 `GET /version-history/data.json` 时给每个 repo 贴 `github` 字段 ——
  `git remote get-url origin` 判是不是 github.com，再 `git ls-remote --heads <url> refs/heads/<branch>`
  拿远端 sha 与本地 HEAD 比对（能比祖先关系就用 `merge-base --is-ancestor` 判 ahead/behind，
  并用 `rev-list --count` 数差多少提交）。结果按仓库路径缓存 3 分钟，失败静默（不显示徽章）。
- **每日备份扩到全部仓库**：新增 `D:\scripts\backup-all.ps1`（PowerShell 版 `runCopy`）——
  读 `repos.json` + `reposRoot\*.git` 去重，逐仓 `push --mirror`（没有就 `clone --mirror`）+
  `bundle create --all` 到 `<mirror>/bundles/<名字>-<时间戳>.bundle` 并按 `-Keep`（默认 10）轮转，
  日志 `D:\GitMirror\logs\backup-all.log`，最后顺带跑 `visualize.ps1 -NoOpen` 刷新页面。
  计划任务 `GitBackup-Local`（每天 21:00）已改成调它 —— 以前只备份 `local.git`，现在覆盖四个仓。
- `render-preview.mjs` 支持 `VH_DATA` 指定 data 文件（想把 Host 侧装饰后的数据拿去渲染预览时用）。

## 0.1.6

- **自动备份到镜像**（「备份设置」里新增「自动备份」卡）：
  - 两种节奏：`每天 HH:mm` 或 `每隔 N 分钟`（5–1440）；开关就是那个复选框。
  - Host 侧每 60 秒 `tick()` 一次判断到点没（`dueNow()`），到点直接跑一次和
    「一键拷贝」完全相同的 `runCopy({ auto: true })`；成功/失败写回
    `backup.json` 的 `auto.lastRunAt` / `auto.lastOk`，面板上显示上次自动运行时间。
  - **无人值守**：`auto` 触发时跳过许可密码校验（手动点按钮仍然要密码）。
  - 启动后 15 秒补看一眼，赶上 DSH 关着时错过的「今天那次」；定时器 `unref()`，
    不拖住宿主退出。**只在 DSH 开着时生效**，界面里写明了这点并提示用
    Windows 计划任务做 7×24。
  - `POST /dsh-vh/backup` 新增 `set-auto` 与 `tick` 两个 action；
    `lib/backup.js` 新增 `setAuto` / `tick` / `dueNow`。
  - `selftest-backup.mjs` 新增第 6 段：到点跑一次、同一天不重复跑、interval 到点、
    关掉后不动。

## 0.1.5

- **备份设置区块**（面板顶栏「备份」→ 子视图「备份设置」）：
  - 「镜像」：填镜像根目录（绝对路径）并保存，界面回显派生的 `bundles/`、`logs/`。
  - 「一键拷贝」：把 `reposRoot` 下的裸仓 + 页面清单里的项目仓逐个镜像过去
    （已有就 `git push --mirror`，没有就 `git clone --mirror`），再各打一份
    `bundles/<名字>-<时间戳>.bundle`，每个仓只保留最近 `keep` 份（默认 10）。
  - 两个动作都可以加一道**许可密码**（scrypt 加盐哈希，存在 `reports/backup.json`）：
    首次打开询问「要不要设密码」，可以选「不设密码」（之后不再询问）。
  - 新增 `lib/backup.js`、`GET /version-history/backup.json`、`POST /dsh-vh/backup`
    （`set-password` / `clear-password` / `set-mirror` / `run` / `status`）、
    `selftest-backup.mjs`（真 git 仓、真 bundle、真密码校验）。
- `render-preview.mjs --backup` 可离线渲染这个区块；`lib/paths.js` 增加 `backupPath`。

## 0.1.4

- Drop `"private": true` so the package can be installed from the tarball (and is
  no longer marked unpublishable); add `publishConfig.access = public`.
- Add this CHANGELOG and ship it in the tarball.
- Docs only since 0.1.3: `docs/icon.png` (180×180) and root `screenshots.json`
  for the plugin listing.

## 0.1.3

- **Portable paths.** New `lib/paths.js`: every default (reports dir, scripts dir,
  repos root, git executable, LAN port) now derives from `DSH_VH_ROOT`, which
  defaults to `~/.dsh-version-history`. Override order is config > env > default.
  `cordis.patch.yml` therefore ships `config: {}` — no per-machine paths in the
  bundle.
- **MIT license** (`LICENSE`, `package.json` `license`).
- README rewritten: install, configuration table, external-script contract,
  route list, screenshots.
- Panel screenshots under `docs/screenshots/`.

## 0.1.2

- Left column "repository sources" card: name + `local` / `LAN` badge + commit and
  tag counts, full path on a second line, collapsible.
- Mini-button styling scoped to `.vh-src`.

*(Reverted in `429e33b` and re-landed as part of 0.1.3 — the revert was a
mis-committed working tree, not a design change.)*

## 0.1.1

- NVMe power-on hours, host writes and unsafe shutdowns are read through
  `smartctl` (`-j -a /dev/pdN`), because `MSFT_StorageReliabilityCounter` returns
  them empty on NVMe. SSD cards show written bytes, media errors and spare left.
- SMART snapshot records `source` / `nvmeVia` so you can tell where a number came
  from.

## 0.1.0

- First usable release: three-column panel (version / detail / disks), tag
  timeline with per-tag files and commits, disk health + SMART column, LAN git
  sharing over Smart HTTP, GitHub bind / test / push card.
- Data comes from the user's own PowerShell scripts (`visualize.ps1`,
  `disk-health.ps1`, `disk-health-admin.ps1`, `dpapi.ps1`); the plugin ships the
  panel and the routes that invoke them. See `docs/DETAIL.md` for the contract.
