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

## 备份设置（面板顶栏「备份」→ 子视图）

- 目的：把「设置镜像」和「一键拷贝」做成面板里的两个动作，并可选加一道许可密码。
- 数据放 `reports/backup.json`：`{mirror, keep, password:{algo:'scrypt',salt,hash,keylen}, passwordMode:'set'|'none', lastRun, updatedAt}`。
  - 密码用 `scryptSync(password, salt, 64)` + `timingSafeEqual` 校验；**只存哈希**。
  - `passwordMode` 为空表示「还没回答过首次询问」，面板据此弹「要不要设密码」；选「不设密码」写 `'none'` 后不再问。
- 要备份哪些仓：`reposRoot` 下的 `*.git` 裸仓 + `data.json` 里的 `repos[].path`（页面清单），按 basename 去重。
- 「一键拷贝」（`runCopy`）对每个仓：
  1. 目标 `I:\GitBackup\<名字>.git` 存在 → `git -C <src> push --mirror <target>`；不存在 → `git clone --mirror <src> <target>`；
  2. `git -C <target> rev-parse --short HEAD` 回显镜像侧 HEAD；
  3. `git -C <src> bundle create <mirror>/bundles/<名字>-<yyyymmdd-HHmmss>.bundle --all`，按名字前缀排序只留最近 `keep` 份（默认 10）。
- 路由：`GET /version-history/backup.json`（状态 + 待备份仓库清单）、`POST /dsh-vh/backup`
  （`set-password` / `clear-password` / `set-mirror` / `run` / `status`；同样是普通 handler 路由，因为 resource 路由只放行 GET）。
- 许可密码的拦截在 **Host 侧**（`gate()`）：设了密码后 `set-mirror` / `run` 必须带 `password`，
  否则回 `{ok:false, needPassword:true}` / `{ok:false, badPassword:true}`；客户端只是把它显示成人话。
- 离线渲染：`node render-preview.mjs --backup`（`VH_BK_FRESH=1` 渲染「第一次询问」那版）。
- 与定时任务的关系：`E:\Git\scripts\backup.ps1` 每天 21:00 仍独立跑（只管 `local.git`），
  面板里这个按钮是**手动补一次**（覆盖全部项目仓）。

## 自动备份（「备份设置」里的「自动备份」卡，0.1.6）

- 目的：把「一键拷贝」变成可以定时自动跑的动作，不依赖 Windows 计划任务、不要管理员权限。
- 配置也在 `reports/backup.json` 的 `auto` 字段：
  `{enabled, mode:'daily'|'interval', at:'HH:mm', minutes:5..1440, lastRunAt, lastOk, lastAuto, lastError?}`
  —— 与手动那套共用同一条镜像目录与同一个 `runCopy`。
- 调度在 **Host 侧**：`apply()` 里 `ctx.effect` 起 `setInterval(60s)`，每次 `cfg.bk.tick()`；
  另开一个 15 s 的一次性 `setTimeout` 补跑「DSH 关着时错过的今天那次」；两个定时器都 `unref()`。
- `dueNow(auto, now)` 判定：未启用 → 不跑；`interval` → `now - lastRunAt >= minutes`；
  `daily` → 目标时刻（今天 HH:mm）已过且 `lastRunAt` 早于它 → 跑。
- `tick()` 到点后调 `runCopy({ auto: true })`：**`auto` 触发跳过 `gate()`**（无人值守），
  成功后把 `auto.lastRunAt / lastOk / lastAuto` 写回，并删掉旧的 `lastError`。
- 路由：`POST /dsh-vh/backup` 增加 `set-auto`（要许可密码，因为属于「手动操作」）与 `tick`（调试用）。
- 局限：**只在 DSH 进程活着时生效**；关机/退出后不会跑。要 7×24 就用 Windows「任务计划程序」另加。
- 测试：`selftest-backup.mjs` 第 6 段用真 git 仓验证「到点跑一次 / 同一天不重复 / interval 到点 / 关掉不动」。

## 界面语言（0.1.11）

- 顶栏右侧 `<select class="vh-lang">`：`中文`（默认）/ `English`；选中值写 `localStorage['dsh-vh-lang']`，
  模块加载时读回来，切完立刻重渲染（`LANG` 是模块级变量）。
- 翻译在**元素创建处**做，不在渲染后改 DOM：`client.js` 用 `h0 = React.createElement` 保存原生实现，
  再定义 `h(type, props, ...kids)` —— `LANG === 'zh'` 时原样透传（与旧版等价），`'en'` 时才把
  字符串子节点与 `title` / `placeholder` / `aria-label` / `alt` / `data-tip` / `label` 过 `tx()`。
- `tx(s)` 顺序：`· ` 前缀递归 → 整串字典 `EN` → 正则表 `RULES`（`N 个仓库`、`N 提交 · M 版`、
  `剩余 x / y · 已用 n%`、`1%（0% = 全新）`、`40°C（峰值 90°C）`、`稳定 N` / `注意 N` / `风险 N` 等）
  → `carry()` 做 `1 commits` → `1 commit` 的单复数修正。查不到就原样返回（宁可留中文，不改数据）。
- 不翻**数据**：仓库名、路径、提交信息、卷标（`文档` / `新加卷`）、sha、型号。
- 测试：`selftest-panel.mjs` 末尾 `english` 段用 stub `localStorage` 重新 `new Function` 加载模块后渲染面板；
  `render-preview.mjs` 支持 `VH_LANG=en`（例：`VH_LANG=en node render-preview.mjs --panel preview-main-en.html`）。

## GitHub 状态自动标记（左栏仓库行，0.1.7）

- 左栏每个仓库行是三行结构：`名称 + 提交/版数 + ✕` → `本地|局域网 徽章 + GitHub 徽章` → 完整路径。
- GitHub 徽章的数据在 **Host 侧**算，随 `/version-history/data.json` 一起下发（`repos[].github`）：
  - `parseGithubRemote(url)` 只认 `github.com` 形态（`https://`、`git@`、`ssh://`）。
  - 有 origin 且是 github：`git rev-parse HEAD` 与 `git ls-remote --heads <url> refs/heads/<branch>` 各取短 sha；
    用 `git cat-file -e <remoteSha>` 判本地有没有这个对象（没有 → `unknown`），
    再 `git merge-base --is-ancestor` 判祖先关系 + `git rev-list --count` 数差多少：
    `synced` / `ahead` / `behind` / `diverged` / `unpublished`（远端没有该分支）/ `unknown`。
  - 结果按仓库路径缓存 **180 s**（`GH_TTL`、`ghCache`），失败静默（`github: null`，徽章不显示）。
- 徽章文案：`GitHub 已同步` / `GitHub 领先 N` / `GitHub 落后 N` / `GitHub 分叉` / `GitHub 未推送`；
  `title` 里给 owner/repo、分支、本地/远端短 sha、检查时间。
- 局限：只看 `origin` 一个远端；`ls-remote` 要能连上 GitHub（断网/代理不通时不出徽章，不是「已同步」的假象）。

## 仓库行右键菜单：推私有 / 推公开（0.1.13）

- 入口：左栏项目行 `.vh-grp-h` 的 `onContextMenu` → `openMenu(ev, ri, r)`，状态 `menu = { x, y, idx, repo }`。
- 菜单是自绘的（不用浏览器原生菜单）：`.vh-menu-back`（全屏透明层，点空白 / 右键关闭）里放 `.vh-menu`
  （`position:fixed`，`left/top` 取 `Math.max(8, ev.clientX/Y)`，`z-index:60`），内容为
  仓库名标题 + `推送到私有仓库`（橙点）+ `推送到公开仓库`（绿点）+ `复制仓库路径` + `取消`。
- 点了推送会调 `POST /dsh-vh/gh {action:'publish', repoPath, name, visibility}` →
  `lib/github.js` 的 `publish()`：
  1. 令牌：显式传入的 `token` 优先，否则用已绑定的（DPAPI 解出来）。
  2. 分支：显式 `branch` → `git rev-parse --abbrev-ref HEAD` → 兜底 `main`。
  3. 建仓：PowerShell `Invoke-RestMethod`（认系统代理）先 `/user` 取 login，再 `GET /repos/<login>/<name>`；
     只有 404 才 `POST /user/repos`（`private` 按 `visibility` 取 `true/false`）。
  4. 推送：`git -C <repoPath> push <gitUrl> refs/heads/<br>:refs/heads/<br> --tags`，
     令牌走 `-c http.https://github.com/.extraheader=AUTHORIZATION: basic <b64>`，超时 300 s。
  5. remote：仅当仓库当前**没有** `origin` 才 `git remote add origin <gitUrl>`；已有则不动（`origin.action='keep'`）。
  6. 成功后写回绑定信息与 `lastPush`，前端弹提示并 `loadData() + loadGh()` 刷新徽章。
- 自测：`selftest-panel.mjs` 的 `contextMenu` 段；预览：`VH_MENU=1 node render-preview.mjs --panel preview-main-menu.html`。

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
| `backupPath` | `reports/backup.json` |
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
