# dsh-version-history

## 它是什么

DSH 侧边栏里的「GIT管理」面板：把本机几个 git 仓的版本讲清楚 —— 每个版本相对上一版动了哪些文件、增删多少行、包含哪些提交；再有一个「未发布」占位告诉你还有没打标签的提交。同一面板里还有磁盘容量 / SMART 健康（右侧常驻列）与局域网共享仓库。

数据不是插件自己算的，而是 `E:\Git\scripts\visualize.ps1` 生成的 `E:\Git\reports\data.json`；插件只负责把它读出来渲染，外加一个「重新生成」按钮（后台跑一次那个脚本）。

## 数据流

```
visualize.ps1  ──►  E:\Git\reports\data.json      （Host half 每次请求现读）
                         │
                         ▼  GET /version-history/data.json
                   侧边栏面板（React，同源 fetch）
```

- 独立离线页 `E:\Git\reports\版本历史.html` 由同一个脚本生成，可直接双击打开；面板里的「新标签打开」走 `GET /version-history/report`。
- 「重新生成」= `GET /version-history/refresh` → Host 跑 `powershell -File visualize.ps1 -NoOpen`（约 10–15 s）。**注意 resource 路由只放行 GET**（POST 在宿主层就是 405）。
- 面板与离线页顶部都有一条**盘容量状态**：`data.json` 的 `disks[]` 给出每个相关盘符（本地仓库 E:、工作区仓库 C:、备份镜像 I:）的 `free / total / pctFree / state`，脚本用 `System.IO.DriveInfo` 现读；`< 10 GB 或 < 10%` 记红，`< 50 GB 或 < 20%` 记黄。

## 磁盘健康（常驻磁盘列 + 右侧栏 tab）

```
disk-health.ps1        ──►  E:\Git\reports\health.json       （普通权限，5–7 s）
smart-launch.ps1       ──►  E:\Git\reports\smart.state.json  （phase / exitCode / error）
  └ Start-Process -Verb RunAs -PassThru -Wait
disk-health-admin.ps1  ──►  E:\Git\reports\smart.json        （管理员）
                       ──►  E:\Git\reports\smart.log         （-Log + Start-Transcript + trap）
                                  │
                                  ▼  GET /version-history/disks.json   （缺文件才现扫）
                             GET /version-history/disks/scan            （强制现扫）
                             GET /version-history/smart.json            （状态 + valid/error/disks）
                             GET /version-history/smart.state.json      （启动器结果，UAC 取消也在此）
                             GET /version-history/smart.log?lines=N     （提权脚本日志尾部）
                                   │
                                   ▼
                  主面板右栏常驻的 <DiskPanel embedded>（三栏布局）
                  窄屏时退回右侧栏「磁盘」标签页（dsh-better-sidebar 的 tab）
```

- 主面板是**三栏** `.vh-body{grid-template-columns:250px minmax(0,1fr) 340px}`：左项目/版本树、中明细、右 `<aside class="vh-dcol">` 直接渲染 `DiskPanel({embedded:true})`。`@media (max-width:1240px)` 时隐藏右栏，退回右侧栏标签页形态。
- 注册方式（右侧栏形态）：`ctx.get('betterSidebar').registerTab({ id:'version-history:disks', title, icon, order:60, single:true, component: DiskPanel })`，打开用 `openTab({ type:'version-history:disks', target:'right' })` + `layout.openRightbar(true,false)`；注册幂等（better-sidebar 服务可能晚于本模块就绪）。**不是 `main` slot**，所以侧边栏按钮列表里不会多一个主面板。
- **SMART 提权按钮**：面板里点「SMART」（右侧栏形态叫「SMART 提权扫描」）→ `GET /smart/scan` → host 跑 `E:\Git\scripts\smart-launch.ps1`（`Start-Process -Verb RunAs -PassThru -Wait`，把 `phase/exitCode/error` 写进 `smart.state.json`；`-DryRun` 只写 state 不弹 UAC）→ 前端每 1.5 s 轮询 `GET /smart.json`（先看 `valid`，trap 写的失败快照会带 `error`）与 `GET /smart.state.json`，快照一变就 `/disks/scan` 合并进 `health.json`；UAC 取消 / 脚本非 0 退出 / 快照缺失分别给不同提示，顶栏「日志 / 看日志」按钮打 `GET /smart.log?lines=40`。
- 每块盘一张卡：型号 / 机械·固态 / 总线 / 容量 / 健康 / 运行状态 / 扇区；HDD 显示转速、通电时间、启停次数、磁头加载、重映射扇区、待重映射、离线不可纠正、UDMA CRC、温度；SSD 显示寿命磨损 %、通电时间、写入量、异常掉电、介质错误、可用备用块 %、温度（含峰值）；下面给出风险分（`稳定 / 注意 / 风险`）与理由列表。
- 没有 SMART 快照时这些字段显示「待 SMART」并给一行提示；想离线跑也可用 `E:\Git\磁盘健康扫描-管理员.cmd`（已提权才跑脚本，否则只打印提权方法；**不自提权**以避免静默 UAC）。
- **普通权限也能拿到一部分（2026-11-22 修）**：`disk-health-admin.ps1` 不再有管理员硬闸门 —— SATA 盘的 ATA SMART（温度/通电时间/启停次数/重映射扇区/待重映射/离线不可纠正/UDMA CRC）普通权限就能读，只有存储栈计数器（NVMe 寿命磨损等）需要提权；脚本降级采集并在快照里标 `elevated:false`。所以 host 的 `/disks/scan` 每次都会**先跑一次普通权限采集**（`collectSmart()` → `smart.json`）再跑 `disk-health.ps1` 合并，用户不必先点 SMART 才有数据。
- **NVMe 走 smartctl（2026-11-22 深夜）**：Windows 的 `MSFT_StorageReliabilityCounter` 对 NVMe 不提供 `PowerOnHours` / `ReadErrors*` / `StartStopCycleCount`（提权也一样），所以 `disk-health-admin.ps1` 对「SSD 且拿不到通电时间」的盘额外跑 `smartctl -j -a /dev/pdN`（失败退 `-d nvme`）读 NVMe SMART/Health Log，补 `powerOnHours / wearPct(Percentage Used) / hostWrittenGB / unsafeShutdowns / mediaErrors / availableSparePct`（快照里 `source=storage+nvme-smart`、`nvmeVia=smartctl`）。smartctl 来自 **smartmontools 7.4**，装在 `E:\Git\tools\smartmontools\bin\smartctl.exe`（脚本参数 `-Smartctl` 可换；文件不在就跳过这一层）。
- **曾经的静默 bug**：脚本里用 `$out = @()` 存结果 —— PowerShell 变量名大小写不敏感，`$out` 就是参数 `[string]$Out`，赋值把它变成字符串，`WriteAllText($Out, …)` 于是把 JSON 写进一个叫 `System.Collections.Specialized.OrderedDictionary …` 的垃圾文件（提权时 CWD 是 `C:\Windows\System32`），真正的 `smart.json` 从不出现且不报错。现已改名 `$entries`，并加了一次性清理（下次提权运行会删掉那个垃圾文件）。
- **左栏「仓库来源」卡**：`.vh-src` 在搜索框上方，`本地 N 个仓库 · 本机目录`（绿点）+ `局域网 在线 · :8788 · M 个可 clone` / `离线（未开启共享）`（点随 `GET /lan.json` 的 `running`，15 s 轮询），右侧「开启 / 管理」直接开右侧栏 LAN 标签页。每个仓库行是「名称 + `本地`/`局域网` 标签 + n 提交·m 版」，下面一行显示完整仓库路径；`http(s)://` / `git://` / `ssh://` / `\\host\share` 判为局域网，其余为本地。
- 卷里的 `system: true` 表示无盘符的系统/恢复分区，不参与「空间告急」扣分。
- 磁盘卡排版：第一行 `#编号 型号` + 机械/固态徽章（+启动盘）；第二行左侧固定是风险徽章，后面跟「Git 仓库所在盘」标题与盘用途。Host 在 `/disks.json` 里用 `data.json` 的 `disks[].roles` 给每块盘补 `roles/hasGit/isPrimary`，排序是本地仓库盘 → 其他仓库盘 → 其余。

## 局域网共享 Git（右侧栏 `version-history:lan`）

- 目的：把 `E:\Git\repos` 下的裸仓库共享给同一局域网的其他设备（手机 / 另一台电脑）直接 clone、push。
- MinGit **没有** `git daemon`、也没有 `git http-backend`，但带了 `cmd\git-upload-pack.exe` / `cmd\git-receive-pack.exe`；`lib/lan.js` 因此在插件进程里起一个最小的 Smart HTTP 服务：
  - `GET /`：HTML 仓库列表（每仓一行 `git clone http://<ip>:<port>/git/<name>`）。
  - `GET /git/<repo>/info/refs?service=git-upload-pack|git-receive-pack`：spawn `git <svc> --stateless-rpc --advertise-refs <bare>`，前面拼 pkt 行 `# service=…` 与 `0000`。
  - `POST /git/<repo>/git-upload-pack|git-receive-pack`：缓冲请求体后 spawn `git <svc> --stateless-rpc`，把结果原样回写。
- 只服务 `reposRoot` 下的 `*.git`；仓库名限 `^[A-Za-z0-9._-]+$`、自动补 `.git`、resolve 后必须仍在 root 内。
- 生命周期路由：`GET /lan.json`（`{running, port, root, repos, ips, urls}`）、`/lan/start?port=`、`/lan/stop`、`/lan/firewall`（`netsh advfirewall` 加规则 `DSH Git LAN <port>`，走 `Start-Process -Verb RunAs` 要 UAC）。插件 `apply()` 里 `ctx.effect(() => () => cfg.lan.stop())`，卸载即关端口。
- **没有鉴权**：只在可信局域网开，用完点「停止」。
- 客户端：better-sidebar 标签页 `version-history:lan`（order 61）+ 主面板顶栏「局域网」按钮；面板里点「启动 / 停止 / 开放端口」，下面列出每个仓库的 URL（带「复制」）。

## GitHub 绑定 / 手动推送（右侧栏 `version-history:github`）

- 目的：把本地仓库**手动**推到 GitHub；绑定一次远程后，改完点一个按钮就推上去。不自动、不后台轮询。
- 配置放 `E:\Git\reports\github.json`：`{bound, owner, repo, url, branch, repoPath, token, tokenMasked, updatedAt, lastTest, lastPush}`。
  - `token` 是 **DPAPI 密文**（`CurrentUser` 作用域）：`E:\Git\scripts\dpapi.ps1 -Mode Protect` 从 **stdin** 读明文、回 base64；`-Mode Unprotect -B64 <b64>` 反向。明文只在内存里，界面只显示掩码。
- 认证：`git -c http.https://github.com/.extraheader=AUTHORIZATION: basic <base64('x-access-token:'+token)>`，作用域限定 github.com，**令牌不进 URL、不进命令行参数**；`GIT_TERMINAL_PROMPT=0` 防止卡在交互提示。
- 动作：
  - `bind`：解析远程（`owner/repo` / `https://github.com/o/r(.git)` / `git@github.com:o/r.git`）→ 存配置；给了 `repoPath` 还顺手 `git remote set-url|add origin <url>`。
  - `test`：`git ls-remote --heads --tags <url>`，回报 heads / tags / 分支名（前 12）与耗时。
  - `push`：`git -C <repoPath> push <url> refs/heads/<branch>:refs/heads/<branch>`，可选 `--tags`、`--force-with-lease`，超时 300 s。
  - `repos`：PowerShell `Invoke-RestMethod`（**认系统代理**，Node `fetch` 不认）→ `/user` + `/user/repos?per_page=50&sort=updated`；令牌经 `env: VH_GH_TOKEN` 传入，`github.com` API 未认证配额在本机已耗尽，所以必须有令牌。
- 路由：`GET /version-history/github.json`（只读状态）、`GET /version-history/github/test`；写操作（bind/unbind/test/push/repos）走 **`POST /dsh-vh/gh`**（普通 handler 路由，`kind:'exact'`，故意在 `/version-history` 前缀外 —— resource 路由只放行 GET）。
- 客户端：better-sidebar 标签页 `version-history:github`（order 62）+ 主面板顶栏「GitHub / GitHub · 已绑定」按钮 + 左栏「仓库来源」第三行；面板里填令牌、选本地仓库、点「测试连接 / 绑定 / 推送到 GitHub / 拉我的仓库 / 解绑」。

## 默认路径（lib/paths.js，可移植）

代码里不写死个人绝对路径：根目录取 `DSH_VH_ROOT`，没设就用 `~/.dsh-version-history`，下面派生 `reports/` 与 `scripts/`。
优先级 **config > 环境变量 > 默认值**；`PATH_DEFAULTS` 见 `lib/paths.js`，环境变量清单见 README「配置」。

| 配置 | 默认（相对根目录） |
|---|---|
| `dataPath` | `reports/data.json` |
| `reportPath` | `reports/history.html` |
| `scriptPath` | `scripts/visualize.ps1` |
| `reposPath` | `reports/repos.json` |
| `healthPath` | `reports/health.json` |
| `healthScript` | `scripts/disk-health.ps1` |
| `smartPath` | `reports/smart.json` |
| `smartScript` | `scripts/disk-health-admin.ps1` |
| `smartLauncher` | `scripts/smart-launch.ps1` |
| `smartStatePath` | `reports/smart.state.json` |
| `smartLogPath` | `reports/smart.log` |
| `githubPath` | `reports/github.json` |
| `dpapiScript` | `scripts/dpapi.ps1` |
| `reposRoot` | `repos/`（`DSH_VH_REPOS_ROOT`） |
| `gitExe` | `git`（走 PATH，`DSH_VH_GIT` 可换） |
| `lanPort` | `8788`（`DSH_VH_LAN_PORT`） |


## 加项目

编辑 `E:\Git\scripts\visualize.ps1` 里的 `Pick-Repos`，或调用时带 `-Repos`：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File E:\Git\scripts\visualize.ps1 `
  -Repos 'E:\Git\work\local','D:\proj\a','D:\proj\b' -NoOpen
```

面板与离线页会一起更新，因为两者读同一份数据。
