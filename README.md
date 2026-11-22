# dsh-version-history（GIT管理）

DSH 侧边栏插件：把本机几个 git 仓的**版本变化**、**磁盘健康**、**局域网共享**、**GitHub 推送**收在一个面板里。

- 侧边栏入口：`GIT管理`（`sidebar.panellist` id `version-history`，order 21）；主面板三栏 —— 左「项目 / 版本」、中「明细」、右「磁盘」。
- 数据源：`E:\Git\reports\data.json`（由 `E:\Git\scripts\visualize.ps1` 生成）、`health.json`（`disk-health.ps1`）、`smart.json`（`disk-health-admin.ps1`，提权）、`repos.json`（仓清单）、`github.json`（绑定配置，令牌 DPAPI 加密）。
- Host half 路由（前缀 `/version-history`）：`health`、`data.json`、`report`、`refresh`、`repos*`、`disks.json`、`disks/scan`、`smart.json`、`smart.state.json`、`smart.log`、`smart/scan`、`lan.json`、`lan/start|stop|firewall`；写操作走 `POST /dsh-vh/gh`（resource 路由只放行 GET，所以单开一条普通 handler 路由）。

## 安装 / 重新加载

```powershell
# 装（已在 desktop profile 里；重装给绝对目录）
# plugin_manager: action=install_bundle, target=<本目录绝对路径>

# 改完 host half 重载
# plugin_manager: action=set_plugin, target="include:dsh-version-history", enabled=false → true
# 改完 client half：DSH 窗口 Ctrl+R
```

## 自测与预览

```powershell
$node = 'C:\Users\63463\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe'
& $node selftest.mjs          # slot 注册
& $node selftest-panel.mjs    # 面板 / 磁盘 / 局域网 / GitHub 渲染断言
& $node selftest-lan.mjs      # 局域网 Smart HTTP 端到端（clone/push，临时仓）
& $node render-preview.mjs    # 生成 preview-main.html / preview-disks.html / preview-lan.html
& $node render-preview.mjs --github
```

## 目录

```
lib/index.js      Host half（路由、磁盘/局域网/GitHub 编排）
lib/client.js     Client half（slots 注册 + 三栏面板 + 子视图）
lib/lan.js        局域网 Smart HTTP（git-upload-pack / receive-pack）
lib/github.js     GitHub 绑定 / 测试 / 推送 / 列仓
locale/*.json     插件元数据（meta.title = GIT管理）
docs/DETAIL.md    设计细节、数据流、配置表
cordis.patch.yml  插件行（config 里三个路径）
```

依赖的外部脚本（不在本包内）：`E:\Git\scripts\visualize.ps1`、`disk-health.ps1`、`disk-health-admin.ps1`、`smart-launch.ps1`、`dpapi.ps1`、`backup.ps1`。
