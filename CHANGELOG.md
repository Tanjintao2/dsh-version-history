# Changelog

All notable changes to this plugin. Versions follow the git tags in this repo;
each tag has a matching GitHub Release with an installable tarball.

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
