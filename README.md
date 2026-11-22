# dsh-version-history（GIT管理）

DeepSeek Harness（DSH）侧边栏插件：把本机 git 仓的**版本变化**、**磁盘健康 / SMART**、**局域网共享**、**GitHub 推送**收在一个面板里。

![主面板：左仓单 / 中提交明细 / 右磁盘健康](docs/screenshots/panel-main.png)

![GitHub 绑定卡片](docs/screenshots/panel-github.png)

- 侧边栏入口 `GIT管理`（`sidebar.panellist` id `version-history`，order 21）；主面板三栏 —— 左「仓库 / 版本」、中「提交明细」、右「磁盘」。
- 纯前端 fetch 本包 Host half 的同源路由取数，不拉 iframe（能吃到 DSH 的主题变量与 locale）。

## 安装

```powershell
# 装（给本目录绝对路径）
#   plugin_manager: action=install_bundle, target=<本目录>
# 改完 host half 重载
#   plugin_manager: action=set_plugin, target="include:dsh-version-history", enabled=false → true
# 改完 client half：DSH 窗口刷新页面
```

## 配置（可移植）

**代码里没有任何个人绝对路径。** 目录默认从 `~/.dsh-version-history` 派生：

```
~/.dsh-version-history/
├── reports/     data.json、health.json、smart.json、repos.json、github.json、history.html
└── scripts/     visualize.ps1、disk-health.ps1、disk-health-admin.ps1、smart-launch.ps1、dpapi.ps1
```

优先级：**插件 config > 环境变量 > 上面的默认值**。

| 环境变量 | 作用 |
|---|---|
| `DSH_VH_ROOT` | 根目录（自动派生 reports / scripts / repos） |
| `DSH_VH_REPORTS` | 只改 reports 目录 |
| `DSH_VH_SCRIPTS` | 只改脚本目录 |
| `DSH_VH_REPOS_ROOT` | 局域网服务对外提供的裸仓目录（默认 `<root>/repos`） |
| `DSH_VH_GIT` | git 可执行文件（默认 `git`，走 PATH） |
| `DSH_VH_LAN_PORT` | 局域网 Smart HTTP 端口（默认 8788） |
| `DSH_VH_REPOS` | 预置仓库清单（分号或逗号分隔的绝对路径），只在 `repos.json` 还不存在时生效 |

需要指到别处（例如本机把脚本放 `E:\Git\scripts`、报告放 `E:\Git\reports`），在**自己的 profile 补丁层**覆盖 config，不要改本包：

```yaml
- id: dsh-version-history
  name: dsh-version-history
  config:
    dataPath: 'E:\Git\reports\data.json'
    reportPath: 'E:\Git\reports\版本历史.html'
    scriptPath: 'E:\Git\scripts\visualize.ps1'
    reposPath: 'E:\Git\reports\repos.json'
    healthPath: 'E:\Git\reports\health.json'
    healthScript: 'E:\Git\scripts\disk-health.ps1'
    smartPath: 'E:\Git\reports\smart.json'
    smartScript: 'E:\Git\scripts\disk-health-admin.ps1'
    smartLauncher: 'E:\Git\scripts\smart-launch.ps1'
    smartStatePath: 'E:\Git\reports\smart.state.json'
    smartLogPath: 'E:\Git\reports\smart.log'
    githubPath: 'E:\Git\reports\github.json'
    dpapiScript: 'E:\Git\scripts\dpapi.ps1'
    reposRoot: 'E:\Git\repos'
    gitExe: 'E:\Git\tools\git\cmd\git.exe'
    lanPort: 8788
```

## 依赖的外部脚本（本包不含）

本包只编排，不生成数据。脚本由你自备，契约如下：

| 脚本 | 调用方式 | 契约 |
|---|---|---|
| `visualize.ps1` | `-NoOpen`（刷新按钮） | 生成 `data.json`；`repos.json` 是它读的仓清单 |
| `disk-health.ps1` | `-Out <healthPath>` | 写盘健康 JSON；**必须显式给 `-Out`**，否则只打 stdout |
| `disk-health-admin.ps1` | `-Out <smartPath> -Log <smartLogPath>` | 采集 SMART；有管理员权限才拿得到 NVMe 寿命等存储栈计数器，否则降级标 `elevated=false` |
| `smart-launch.ps1` | 无参 | `Start-Process -Verb RunAs -Wait` 拉起上面的 admin 脚本，把 `phase` / `exitCode` / `error` 写进 `smart.state.json`（UAC 取消也落原因） |
| `dpapi.ps1` | `-Mode Protect`（明文走 stdin）<br>`-Mode Unprotect -B64 <ciphertext>` | 用 Windows DPAPI(CurrentUser) 加解密；GitHub 令牌只以密文落盘 |

## 路由（Host half，前缀 `/version-history`）

`health`、`data.json`、`report`、`refresh`、`repos`、`repos/add`、`repos/remove`、`disks.json`、`disks/scan`、`smart.json`、`smart.state.json`、`smart.log`、`smart/scan`、`lan.json`、`lan/start`、`lan/stop`、`lan/firewall`、`github.json`、`github/test`。

写操作走 `POST /dsh-vh/gh`（body `action` ∈ `bind | unbind | test | push | repos`）—— DSH 的 `webServer.resource` 路由只放行 GET，POST 必须在宿主层被 405 之前另开一条普通 handler。

## 目录

```
lib/index.js      Host half（路由、磁盘/局域网/GitHub 编排）
lib/paths.js      可移植默认路径（环境变量 → PATH_DEFAULTS）
lib/client.js     Client half（slots 注册 + 三栏面板 + 子视图）
lib/lan.js        局域网 Smart HTTP（git-upload-pack / git-receive-pack）
lib/github.js     GitHub 绑定 / 测试 / 推送 / 列仓
locale/*.json     插件元数据（meta.title = GIT管理）
docs/DETAIL.md    设计细节、数据流
docs/screenshots/ README 用截图
cordis.patch.yml  插件行（config 留空，用默认值）
```

## 自测与预览

```powershell
$node = '<dsh 运行时>/node/bin/node.exe'
& $node selftest.mjs          # slot 注册
& $node selftest-panel.mjs    # 面板 / 磁盘 / 局域网 / GitHub 渲染断言
& $node selftest-lan.mjs      # 局域网 Smart HTTP 端到端（clone/push，临时仓）
& $node render-preview.mjs    # preview-main.html / preview-disks.html / preview-lan.html
& $node render-preview.mjs --github
```

## License

[MIT](LICENSE) © 2026 Tanjintao2
