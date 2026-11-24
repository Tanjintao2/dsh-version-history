/**
 * dsh-version-history · Client half
 *
 * 侧边栏加一个「GIT管理」图标；点开是一个主面板，左栏项目/版本，右栏明细。
 * 数据来自本包 Host half 的 /version-history/data.json（同源 fetch，不用 iframe）。
 */
window.__ModuleLoader__.load({
  id: 'dsh-version-history',
  factory(require) {
    const React = require('react')
    const h0 = React.createElement
    const API = '/version-history'

    /* ---------------- i18n：默认中文，可切英文 ---------------- */
    const LANG_KEY = 'dsh-vh-lang'
    // 上次见过的各盘风险等级（磁盘告警用）
    const KEY_RISK = 'dsh-vh-risk'
    let LANG = 'zh'
    try {
      const saved = window.localStorage ? window.localStorage.getItem(LANG_KEY) : null
      if (saved === 'en' || saved === 'zh') LANG = saved
    } catch (e) {}

    // 整串映射（只放完全固定的文案）
    const EN = {
      'GIT管理': 'Git Manager',
      '本机 git 项目': 'local git projects',
      '本地': 'Local',
      '局域网': 'LAN',
      '备份': 'Backup',
      '备份设置': 'Backup settings',
      '关于': 'About',
      '关于 / 诊断': 'About / Diagnostics',
      '已验证': 'verified',
      '未验证': 'unverified',
      '复制恢复命令': 'Copy restore command',
      '插件': 'Plugin',
      '数据文件': 'Data files',
      '路由': 'Routes',
      '重新检查': 'Re-check',
      '重新检查中…': 'Re-checking…',
      '令牌到期 ': 'Token expires ',
      '令牌已于 ': 'Token expired on ',
      '（剩 ': ' (',
      ' 天）': ' days left)',
      '＋ 记到期日': '+ record expiry',
      '仓库来源': 'Repository sources',
      '仓库': 'repo',
      '仓库位置': 'Repository locations',
      '搜索项目 / 版本': 'Search project / version',
      '加项目：仓库绝对路径': 'Add repo: absolute path',
      '加入': 'Add',
      '加不进去：': 'Cannot add: ',
      '从清单移除（不删仓库本身）': 'Remove from list (repo stays)',
      '已移除并刷新': 'Removed and refreshed',
      '已加入并刷新 · ': 'Added and refreshed · ',
      '已加入清单，但重跑脚本失败（下次备份会补上）': 'Added to the list, but the regenerate script failed (next backup will catch up)',
      '已从清单移除，重跑脚本失败': 'Removed from the list, but the regenerate script failed',
      '移除失败：': 'Remove failed: ',
      '没有可显示的项目': 'No projects to show',
      '清理': 'clean',
      '干净': 'clean',
      '未提交': 'uncommitted',
      '提交': 'commits',
      '受跟踪文件': 'Tracked files',
      '版本标签': 'Version tags',
      '.git 大小': '.git size',
      '最近提交': 'Recent commits',
      '文件': 'File',
      '最后改动': 'Last change',
      '未打标签': 'untagged',
      '未发布': 'unreleased',
      '已发布': 'released',
      '已是最新': 'latest',
      '相对上一版的文件变化': 'Changes vs previous version',
      '这一版包含的提交': 'Commits in this version',
      '这一版没有文件变化。': 'No file changes in this version.',
      '对比区间：': 'Diff range: ',
      '发布：git tag -a v0.2.0 -m "说明" && git push && git push origin --tags': 'Release: git tag -a v0.2.0 -m "notes" && git push && git push origin --tags',
      '磁盘': 'Disks',
      '磁盘面板': 'Disk panel',
      '容量与健康': 'Capacity & health',
      '容量、机械/固态属性与稳定性风险': 'Capacity, HDD/SSD attributes and stability risk',
      '扫描': 'Scan',
      '扫描中…': 'Scanning…',
      '扫描失败：': 'Scan failed: ',
      'SMART': 'SMART',
      'SMART 提权扫描': 'SMART (elevated)',
      '日志': 'Log',
      '看日志': 'Show log',
      '接口': 'Interface',
      '容量': 'Capacity',
      '健康': 'Health',
      '运行': 'Status',
      '扇区': 'Sector',
      '转速': 'Spindle',
      '通电时间': 'Power-on',
      '启停次数': 'Start/stops',
      '磁头加载': 'Load/unload',
      '重映射扇区': 'Reallocated',
      '待重映射': 'Pending',
      '离线不可纠正': 'Offline uncorr.',
      '温度': 'Temp',
      '介质': 'Media',
      '寿命磨损': 'Wear',
      '写入量': 'Written',
      '异常掉电': 'Unsafe power-off',
      '介质错误': 'Media errors',
      '可用备用块': 'Spare',
      '电源循环': 'Power cycles',
      '稳定': 'OK',
      '注意': 'Watch',
      '风险': 'Risk',
      '未发现异常信号。': 'No anomalies found.',
      '未发现异常信号': 'No anomalies found',
      '机械硬盘 HDD': 'HDD',
      '固态硬盘 SSD': 'SSD',
      'SSD（闪存）': 'SSD (flash)',
      '待 SMART': 'needs SMART',
      '需要管理员': 'needs admin',
      '启动盘': 'boot',
      '系统盘': 'system disk',
      '是（启动盘）': 'yes (boot)',
      '系统分区': 'System',
      '未知': 'unknown',
      '未就绪': 'not ready',
      '本地时间': 'local time',
      '方式': 'Mode',
      '每天': 'Daily',
      '每隔': 'Every',
      '保留': 'Keep',
      '镜像': 'Mirror',
      '保存': 'Save',
      '保存中…': 'Saving…',
      '保存镜像': 'Save mirror',
      '清除密码': 'Clear password',
      '密码': 'Password',
      '设密码': 'Set password',
      '不设密码': 'No password',
      '许可密码（每次保存镜像 / 一键拷贝都要填）': 'License password (required for mirror / copy)',
      '需要许可密码': 'password required',
      '许可密码不对': 'wrong password',
      '密码至少 4 位': 'at least 4 characters',
      '一键拷贝': 'Copy now',
      '拷贝中…': 'Copying…',
      '一键拷贝完成：': 'Copy finished: ',
      '自动备份': 'Auto backup',
      '自动备份已开启：': 'Auto backup on: ',
      '自动备份已关闭': 'Auto backup off',
      '上次：': 'Last: ',
      '上次自动运行：': 'Last auto run: ',
      '还没有可备份的仓库（reposRoot 下没有 *.git，页面数据里也没有项目）。': 'No repositories to back up yet (no *.git under reposRoot and no projects in the page data).',
      '还没设置镜像目录。': 'No mirror directory set yet.',
      '每个仓的 bundle 只留最近 N 份': 'keep only the newest N bundles per repo',
      '局域网 Git': 'LAN Git',
      '开启': 'Start',
      '启动': 'Start',
      '停止': 'Stop',
      '开放端口': 'Open port',
      '已启动': 'running',
      '已停止': 'stopped',
      '未启动': 'not started',
      '复制': 'Copy',
      '已复制': 'Copied',
      '管理': 'Manage',
      '未开启': 'off',
      '在线': 'online',
      '离线（未开启': 'offline (',
      'GitHub': 'GitHub',
      'GitHub · 已绑定': 'GitHub · bound',
      'GitHub：已绑定 ': 'GitHub: bound to ',
      '绑定': 'Bind',
      '绑定中…': 'Binding…',
      '解绑': 'Unbind',
      '未绑定': 'not bound',
      '已绑定': 'bound',
      '测试连接': 'Test connection',
      '测试中…': 'Testing…',
      '查询中…': 'Loading…',
      '推送到 GitHub': 'Push to GitHub',
      '推送中…': 'Pushing…',
      '推送到私有仓库': 'Push to a private repo',
      '推送到公开仓库': 'Push to a public repo',
      '推送中…（建仓 + git push）': 'Pushing… (create repo + git push)',
      '复制仓库路径': 'Copy repo path',
      '取消': 'Cancel',
      '推送保护': 'Push protection',
      '禁止推送：已锁住，GitHub 推送一律被拒': 'Push disabled: locked, all GitHub pushes are rejected',
      '禁止推送（当前未锁，可以手动推）': 'Disable pushing (currently unlocked, manual push allowed)',
      '仍然推送': 'Push anyway',
      '确认推送': 'Confirm push',
      '发布中…': 'Publishing…',
      '已推送': 'pushed',
      '已创建并推送': 'created + pushed',
      '私有': 'private',
      '公开': 'public',
      '主推送标签': 'Tags',
      '分支': 'Branch',
      '远程': 'Remote',
      '令牌': 'Token',
      '已保存（留空表示不改）': 'saved (blank = keep)',
      '同时推送标签（--tags）': 'Push tags too (--tags)',
      '拉我的仓库': 'List my repos',
      'GitHub 已同步': 'in sync',
      'GitHub 领先 ': 'ahead ',
      'GitHub 落后 ': 'behind ',
      'GitHub 分叉': 'diverged',
      'GitHub 未推送': 'not pushed',
      '返回': 'Back',
      '刷新中…': 'Refreshing…',
      '刷新失败，见数据文件时间': 'refresh failed, see data file time',
      '重新生成': 'Regenerate',
      '新标签打开': 'Open in new tab',
      '正在读取 data.json…': 'Loading data.json…',
      '正在读取磁盘信息…': 'Loading disk info…',
      '没有磁盘数据。': 'No disk data.',
      '完成': 'done',
      '失败': 'failed',
      '未知原因': 'unknown reason',
      '未知类型': 'unknown type',
      '操作失败': 'operation failed',
      '操作失败：': 'Failed: ',
      '错误：': 'Error: ',
      '读取失败：': 'Read failed: ',
      '读取失败': 'Read failed',
      '读日志失败：': 'Read log failed: ',
      '拉列表失败': 'List failed',
      '没成功：': 'failed: ',
      '未同步': 'not synced',
      '已同步': 'synced',
      'I 盘': 'I: drive',
      'I 盘已同步': 'I: synced',
      '本地仓库 / 数据/报告': 'local repo / data, reports',
      '备份镜像': 'backup mirror',
      '仓库': 'Repository',
      '公开': 'public',
      '私有': 'private',
      '打开局域网面板：启动 / 停止共享、复制 clone 地址、放行防火墙': 'Open the LAN panel: start / stop sharing, copy clone URLs, open the firewall',
      '打开 GitHub 面板：绑定仓库、测连接、手动推送': 'Open the GitHub panel: bind a repo, test the connection, push manually',
      '在右侧栏打开磁盘面板（容量 / 机械·固态属性 / 稳定性风险）': 'Open the disk panel (capacity / HDD·SSD attributes / stability risk)',
      '把 repos 目录里的裸仓库共享到局域网（clone / push）': 'Share bare repos under the repos directory on the LAN (clone / push)',
      'GitHub：绑定远程仓库、测连通性、手动推送': 'GitHub: bind a remote repo, test connectivity, push manually',
      '备份设置：设置镜像目录、一键拷贝（可加许可密码）': 'Backup settings: mirror directory, one-click copy (optional license password)',
      '镜像目录与一键拷贝（可加许可密码）': 'Mirror directory and one-click copy (optional license password)',
      '绑定 GitHub 仓库、测连通性、手动推送本地仓库': 'Bind a GitHub repo, test connectivity, push the local repo',
      '容量与健康': 'Capacity & health',
      '在右侧栏打开': 'Open in the right sidebar',
      '这一版包含的提交': 'Commits in this version'
    }

    // 带数字/变量的碎片：按顺序套正则
    const RULES = [
      [/^(\d+) 个仓库 · 本机目录$/, '$1 repos · local dirs'],
      [/^(\d+) 个仓库$/, '$1 repos'],
      [/^(\d+) 个局域网仓库$/, '$1 LAN repos'],
      [/^(\d+) 个提交$/, '$1 commits'],
      [/^(\d+) 个文件（共 (\d+) 个）$/, '$1 of $2 files'],
      [/^(\d+) 个文件$/, '$1 files'],
      [/^(\d+) 个项目 · 生成于 (.+)$/, '$1 projects · built $2'],
      [/^(\d+) 块 · 固态 (\d+) \/ 机械 (\d+) · 风险 (\d+) \/ 注意 (\d+) \/ 稳定 (\d+)$/, '$1 disks · SSD $2 / HDD $3 · $4 risk / $5 watch / $6 ok'],
      [/^(\d+) 提交 · (\d+) 版$/, '$1 commits · $2 versions'],
      [/^(\d+) 小时$/, '$1 h'],
      [/^(\d+) 个$/, '$1'],
      [/^已扫描 · (.+)$/, 'Scanned · $1'],
      [/^已刷新 · (.+)$/, 'Refreshed · $1'],
      [/^已加入并刷新 · (.+)$/, 'Added and refreshed · $1'],
      [/^风险分 (\d+)$/, 'risk $1'],
      [/^检查于 (.+)$/, 'checked $1'],
      [/^令牌 (.+)$/, 'token $1'],
      [/^上次连接：(.*)$/, 'Last connect: $1'],
      [/^上次推送：(.*)$/, 'Last push: $1'],
      [/^上次连接失败：(.*)$/, 'Last connect failed: $1'],
      [/^上次推送失败：(.*)$/, 'Last push failed: $1'],
      [/^上次自动运行：(.*)$/, 'Last auto run: $1'],
      [/^上次：(.*)$/, 'Last: $1'],
      [/^远端 (.+)$/, 'remote $1'],
      [/^对比区间：(.*)$/, 'Diff range: $1'],
      [/^镜像：(.*)$/, 'Mirror: $1'],
      [/^镜像已保存：(.*)$/, 'Mirror saved: $1'],
      [/^其余 (.+) 个：/, 'others ($1): '],
      [/^只显示前 (.+) 个文件（共 (.+) 个）。$/, 'showing first $1 of $2 files.'],
      [/^推送完成（(.+)）$/, 'Pushed ($1)'],
      [/^推送完成$/, 'Pushed'],
      [/^已共享 (.+) 个仓库$/, 'sharing $1 repos'],
      [/^运行中 · :(\d+)$/, 'running · :$1'],
      [/^在线 · :(\d+) · (\d+) 个$/, 'online · :$1 · $2'],
      [/^离线（未开启）$/, 'offline (not started)'],
      [/^每次 (.+) 跑一次$/, 'every $1'],
      [/^每天 (.+)$/, 'daily at $1'],
      [/^每隔 (.+) 分钟$/, 'every $1 min'],
      [/^(.+) 小时$/, '$1 h'],
      [/^(.+) 天$/, '$1 d'],
      [/^稳定 (\d+)$/, 'OK $1'],
      [/^重映射扇区 (\d+) 个$/, '$1 reallocated sectors'],
      [/^待重映射 (\d+) 个$/, '$1 pending sectors'],
      [/^离线不可纠正 (\d+) 个$/, '$1 offline uncorrectable'],
      [/^UDMA CRC (\d+) 个$/, '$1 UDMA CRC'],
      [/^注意 (\d+)$/, 'Watch $1'],
      [/^风险 (\d+)$/, 'Risk $1'],
      [/^受跟踪文件（(\d+)）$/, 'Tracked files ($1)'],
      [/^剩余 (.+?) \/ (.+?) · 已用 (.+)%$/, 'Free $1 / $2 · $3% used'],
      [/^(.+?)(\d[\d.]*) \/ (\d[\d.]*) GB 空闲$/, '$1$2 / $3 GB free'],
      [/^(\d+(?:\.\d+)?)%（0% = 全新）$/, '$1% (0% = new)'],
      [/^(.+?)°C（峰值 (.+?)°C）$/, '$1°C (peak $2°C)'],
      [/^(.+) · 可推送$/, '$1 · pushable'],
      [/^(.+) · 缺令牌$/, '$1 · no token'],
      [/^(.+) · 还没保存令牌$/, '$1 · token not saved'],
      [/^(.+) · 令牌已保存（DPAPI 加密）$/, '$1 · token saved (DPAPI)'],
      [/^(.+) · 默认分支 (.+)$/, '$1 · default branch $2'],
      [/^(.+) · 清单里 (.+)$/, '$1 · in list $2'],
      [/^(.+) · 已用 (.+)%$/, '$1 · $2% used'],
      [/^(.+) · 还没有日志：$/, '$1 · no log yet: '],
      [/^(.+) · 日志：$/, '$1 · log: '],
      [/^(.+) · 风险 (.+)$/, '$1 · risk $2'],
      [/^(.+) \/ 机械 (.+)$/, '$1 / HDD $2'],
      [/^(.+) \/ 稳定 (.+)$/, '$1 / OK $2'],
      [/^(.+) \/ 注意 (.+)$/, '$1 / watch $2']
    ]

    // 英文里 1 后面不能跟复数
    const SINGULAR = ['commits', 'versions', 'files', 'repos', 'projects', 'disks', 'hours']

    function tx(s) {
      if (LANG !== 'en' || typeof s !== 'string' || !s) return s
      // 「· 某个理由」这类列表项：前缀保留，正文再翻
      if (s.charAt(0) === '·' && s.charAt(1) === ' ') {
        const body = s.slice(2)
        const bodyOut = tx(body)
        return bodyOut === body ? s : '· ' + bodyOut
      }
      const hit = EN[s]
      if (hit !== undefined) return carry(s, hit)
      for (let i = 0; i < RULES.length; i++) {
        const re = RULES[i][0]
        if (re.test(s)) {
          const out = s.replace(re, RULES[i][1])
          if (out !== s) return carry(s, out)
        }
      }
      return s
    }

    // 数字 1 的单复数修正
    function carry(src, out) {
      if (typeof out !== 'string') return out
      return out.replace(/\b1 (commits|versions|files|repos|projects|disks|hours)\b/g, function (m, w) {
        return '1 ' + w.replace(/s$/, '')
      })
    }

    const TEXT_PROPS = ['title', 'placeholder', 'aria-label', 'alt', 'data-tip', 'label']

    function txKid(k) {
      if (typeof k === 'string') return tx(k)
      if (Array.isArray(k)) return k.map(txKid)
      return k
    }

    // 统一的 createElement：英文模式下自动翻译 props 文案与字符串子节点
    function h(type, props) {
      const kids = Array.prototype.slice.call(arguments, 2)
      if (LANG !== 'en') return h0.apply(null, [type, props].concat(kids))
      let next = props
      if (props && typeof props === 'object') {
        next = {}
        Object.keys(props).forEach(function (k) {
          const v = props[k]
          next[k] = (typeof v === 'string' && TEXT_PROPS.indexOf(k) >= 0) ? tx(v) : v
        })
      }
      return h0.apply(null, [type, next].concat(kids.map(txKid)))
    }

    const CSS = [
      '.vh{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}',
      '.vh-head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap}',
      '.vh-title{font-size:15px;font-weight:600}',
      '.vh-sub{color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.vh-sp{flex:1}',
      '.vh-btn{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:inherit;border-radius:7px;padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit}',
      '.vh-btn:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}',
      '.vh-btn[disabled]{opacity:.55;cursor:default}',
      '.vh-lang{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:inherit;border-radius:7px;padding:3px 6px;font-size:12px;font-family:inherit;cursor:pointer}',
      '.vh-lang:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.vh-body{display:grid;grid-template-columns:250px minmax(0,1fr) 340px;gap:12px;padding:12px 16px;flex:1;min-height:0}',
      '.vh-dcol{display:flex;flex-direction:column;min-height:0;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1)}',
      '.vh-dtab.embedded{background:transparent}',
      '@media (max-width:1240px){.vh-body{grid-template-columns:250px minmax(0,1fr)}.vh-dcol{display:none}}',
      '.vh-tree{overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);padding:8px;min-height:0}',
      '.vh-q{width:100%;box-sizing:border-box;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);color:inherit;border-radius:7px;padding:5px 8px;font-size:12px;margin-bottom:8px;font-family:inherit}',
      '.vh-q:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.vh-add{display:flex;gap:6px;margin-bottom:8px}',
      '.vh-add input{flex:1;min-width:0;box-sizing:border-box;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);color:inherit;border-radius:7px;padding:4px 7px;font-size:11.5px;font-family:inherit}',
      '.vh-add input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.vh-add button{white-space:nowrap}',
      '.vh-disks{display:flex;gap:8px;flex-wrap:wrap;padding:8px 16px 0}',
      '.vh-disk{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:3px 9px;font-size:11.5px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1)}',
      '.vh-disk b{color:var(--dsw-alias-label-primary)}',
      '.vh-role{font-size:11px;opacity:.75}',
      '.vh-dot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-success-primary);flex:none}',
      '.vh-disk.warn{border-color:var(--dsw-alias-state-warn-primary)}',
      '.vh-disk.warn .vh-dot{background:var(--dsw-alias-state-warn-primary)}',
      '.vh-disk.bad{border-color:var(--dsw-alias-state-error-primary)}',
      '.vh-disk.bad .vh-dot{background:var(--dsw-alias-state-error-primary)}',
      '.vh-bar{width:70px;height:6px;border-radius:3px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);overflow:hidden;flex:none}',
      '.vh-bar i{display:block;height:100%;background:var(--dsw-alias-brand-primary)}',
      '.vh-x{margin-left:6px;color:var(--dsw-alias-label-secondary);font-size:11px;opacity:0;cursor:pointer;padding:0 3px;border-radius:4px}',
      '.vh-cmp-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}',
      '.vh-cmp-bar .vh-inp{max-width:200px}',
      '.vh-cmp-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:12px;align-items:start}',
      '.vh-cmp-left{min-width:0}',
      '.vh-cmp-left .vh-files{max-height:calc(100vh - 330px);overflow:auto;display:block}',
      '.vh-cmp-right{min-width:0;position:sticky;top:8px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px;background:var(--dsw-alias-bg-layer-1)}',
      '.vh-split-bar{cursor:col-resize;border-radius:3px;background:var(--dsw-alias-border-l1);margin:0 3px;align-self:stretch;min-height:120px}',
      '.vh-split-bar:hover{background:var(--dsw-alias-brand-primary)}',
      '.vh-diff-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px}',
      '.vh-cmp-right .vh-patch{max-height:calc(100vh - 300px)}',
      '.vh-cmp-split.wide{grid-template-columns:minmax(0,1fr)!important}',
      '.vh-cmp-split.wide .vh-cmp-left{display:none}',
      '.vh-cmp-split.wide .vh-cmp-right{position:static;max-height:none;border:0;padding:0;background:transparent}',
      '.vh-cmp-split.wide .vh-cmp-right .vh-patch{max-height:none}',
      '@media (max-width:1100px){.vh-cmp-split{grid-template-columns:minmax(0,1fr)}.vh-cmp-right{position:static}}',
      '.vh-cmp-sum{margin:6px 0 8px;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.vh-cmp-sum .add{color:var(--dsw-alias-state-success-primary)}',
      '.vh-cmp-sum .del{color:var(--dsw-alias-state-error-primary)}',
      '.vh-trends{display:flex;gap:10px;flex-wrap:wrap;margin:2px 0 6px}',
      '.vh-trend{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.vh-pick{flex:none;width:12px;height:12px;border-radius:3px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);cursor:pointer;display:inline-block}',
      '.vh-pick.on{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.vh-batch{list-style:none;margin:8px 0 4px;padding:0;max-height:230px;overflow:auto}',
      '.vh-batch li{display:flex;align-items:center;gap:8px;padding:4px 2px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12px}',
      '.vh-batch li:last-child{border-bottom:0}',
      '.vh-batch .n{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.vh-batch .st{flex:none;font-size:11px;padding:1px 6px;border-radius:9px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary)}',
      '.vh-batch .st.ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.vh-batch .st.bad{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}',
      '.vh-batch .st.run{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.vh-grp-h:hover .vh-x{opacity:1}',
      '.vh-x:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-base)}',
      '.vh-msg{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin:-2px 0 8px;word-break:break-all}',
      '.vh-msg.bad{color:var(--dsw-alias-state-error-primary)}',
      '.vh-grp{margin-bottom:2px}',
      '.vh-src{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);padding:7px 9px;margin-bottom:8px;font-size:11.5px}',
      '.vh-src-h{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:11px;letter-spacing:.4px;margin-bottom:5px}',
      '.vh-src-row{display:flex;align-items:center;gap:6px;margin:3px 0}',
      '.vh-src-row .vh-dot{width:7px;height:7px;border-radius:50%;flex:none;border:1px solid var(--dsw-alias-border-l2);background:transparent}',
      '.vh-src-row .vh-dot.on{background:var(--dsw-alias-state-success-primary);border-color:transparent}',
      '.vh-src-row .vh-dot.off{background:var(--dsw-alias-state-idle-primary);border-color:transparent}',
      '.vh-src-row .vh-k{font-weight:600;white-space:nowrap;flex:none}',
      '.vh-src-row .vh-v2{color:var(--dsw-alias-label-secondary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.vh-src-row .vh-sp{flex:1}',
      '.vh-src-row .vh-mini{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:inherit;border-radius:6px;font-size:11px;padding:1px 7px;cursor:pointer;font-family:inherit;white-space:nowrap;flex:none}',
      '.vh-src-row .vh-mini:hover{border-color:var(--dsw-alias-brand-primary)}',
      '.vh-gh{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1)}',
      '.vh-row{display:flex;align-items:center;gap:8px}',
      '.vh-row .vh-k{min-width:34px}',
      '.vh-inp{flex:1;min-width:0;background:var(--dsw-alias-bg-base);color:inherit;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:3px 7px;font-size:12px;font-family:inherit}',
      '.vh-inp:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.vh-chk{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.vh-chk input{width:13px;height:13px;margin:0;flex:none;accent-color:var(--dsw-alias-brand-primary)}',
      '.vh-ghlist{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}',
      '.vh-msg{font-size:12px;margin-top:6px}',
      '.vh-msg.ok{color:var(--dsw-alias-state-success-primary)}',
      '.vh-msg.bad{color:var(--dsw-alias-state-error-primary)}',
      '.vh-grp-t{display:flex;align-items:center;gap:6px;min-width:0;flex:1}',
      '.vh-tag{font-size:10px;line-height:1.4;border-radius:4px;padding:0 5px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);flex:none;font-weight:500}',
      '.vh-tag.loc{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.vh-tag.lan{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.vh-tag.pend{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}',
      '.vh-tag.gh{color:var(--dsw-alias-label-secondary)}',
      '.vh-tag.gh.ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.vh-tag.gh.up{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.vh-tag.gh.dn,.vh-tag.gh.warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}',
      '.vh-repo-path{color:var(--dsw-alias-label-secondary);font-size:10.5px;padding:0 7px 5px;word-break:break-all;opacity:.85}',
      '.vh-grp-h{display:flex;gap:8px;padding:5px 7px;border-radius:6px;cursor:pointer;font-weight:600;align-items:center}',
      '.vh-grp-t{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:6px}',
      '.vh-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.vh-grp-tags{display:flex;gap:5px;flex-wrap:wrap;padding:0 7px 3px}',
      '.vh-grp-h:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.vh-grp.on .vh-grp-h{background:var(--dsw-alias-bg-layer-2)}',
      // 右键菜单：fixed 盖在整块面板上，点空白关闭
      '.vh-menu-back{position:fixed;inset:0;z-index:60}',
      '.vh-menu{position:fixed;min-width:196px;padding:5px;border-radius:9px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);box-shadow:0 10px 28px rgba(0,0,0,.45)}',
      '.vh-menu-h{padding:5px 9px 6px;font-size:11px;color:var(--dsw-alias-label-secondary);border-bottom:1px solid var(--dsw-alias-border-l1);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px}',
      '.vh-menu-i{display:flex;align-items:center;gap:7px;width:100%;padding:6px 9px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;text-align:left;cursor:pointer}',
      '.vh-menu-i:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.vh-menu-sep{height:1px;background:var(--dsw-alias-border-l1);margin:4px 2px}',
      '.vh-menu-dot{width:8px;height:8px;border-radius:50%;flex:none}',
      '.vh-menu-dot.priv{background:var(--dsw-alias-state-warn-primary)}',
      '.vh-menu-dot.pub{background:var(--dsw-alias-state-success-primary)}',
      '.vh-confirm{position:fixed;left:50%;top:22%;transform:translateX(-50%);width:420px;max-width:88vw;padding:14px 16px;border-radius:10px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);box-shadow:0 16px 40px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:9px}',
      '.vh-confirm-h{font-size:13.5px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.vh-confirm-n{font-size:12px;color:var(--dsw-alias-label-secondary);word-break:break-all}',
      '.vh-confirm-list{margin:0;padding-left:18px;font-size:12px;color:var(--dsw-alias-state-warn-primary);line-height:1.6}',
      '.vh-btn.primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff}',
      '.vh-meta{margin-left:auto;color:var(--dsw-alias-label-secondary);font-weight:400;font-size:11px;white-space:nowrap}',
      '.vh-v{display:flex;gap:8px;padding:4px 7px 4px 16px;border-radius:6px;cursor:pointer;border-left:2px solid transparent;font-size:12.5px;align-items:center}',
      '.vh-v:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.vh-v.on{background:var(--dsw-alias-bg-layer-2);border-left-color:var(--dsw-alias-brand-primary)}',
      '.vh-v .t{color:var(--dsw-alias-state-warn-primary);font-weight:600}',
      '.vh-v .d{margin-left:auto;color:var(--dsw-alias-label-secondary);font-size:11px}',
      '.vh-pane{overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);padding:14px 16px;min-height:0}',
      '.vh-subbar{display:flex;align-items:center;gap:8px;margin:-4px 0 10px}',
      '.vh-h2{margin:0 0 2px;font-size:15px}',
      '.vh-path{color:var(--dsw-alias-label-secondary);font-size:11.5px;word-break:break-all;margin-bottom:10px}',
      '.vh-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}',
      '.vh-bdg{font-size:11.5px;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:1px 8px}',
      '.vh-bdg.tag{color:var(--dsw-alias-state-warn-primary)}',
      '.vh-bdg.ok{color:var(--dsw-alias-state-success-primary)}',
      '.vh-bdg.warn{color:var(--dsw-alias-state-warn-primary)}',
      '.vh-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin-bottom:12px}',
      '.vh-stat{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:7px 9px;background:var(--dsw-alias-bg-base)}',
      '.vh-stat .k{color:var(--dsw-alias-label-secondary);font-size:11px}',
      '.vh-stat .v{font-size:14px;font-weight:600;margin-top:2px}',
      '.vh-sec{color:var(--dsw-alias-label-secondary);font-size:11.5px;letter-spacing:.5px;margin:14px 0 6px}',
      '.vh-table{width:100%;border-collapse:collapse;font-size:12px}',
      '.vh-table th,.vh-table td{text-align:left;padding:4px 6px;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.vh-table th{color:var(--dsw-alias-label-secondary);font-weight:500;font-size:11px}',
      '.vh-table td.num,.vh-table th.num{text-align:right;white-space:nowrap}',
      '.vh-add{color:var(--dsw-alias-state-success-primary)}',
      '.vh-del{color:var(--dsw-alias-state-error-primary)}',
      '.vh-files{max-height:280px;overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:8px}',
      '.vh-cmts{list-style:none;margin:0;padding:0}',
      '.vh-cmts li{display:flex;gap:8px;padding:3px 0;border-bottom:1px dashed var(--dsw-alias-border-l1);font-size:12px}',
      '.vh-cmts li:last-child{border-bottom:none}',
      '.vh-cmts .h{color:var(--dsw-alias-brand-primary);font-family:Consolas,monospace}',
      '.vh-note{color:var(--dsw-alias-label-secondary);font-size:11.5px;margin-top:8px}',
      '.vh-err{margin:16px;padding:10px 12px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px;color:var(--dsw-alias-state-error-primary);font-size:12.5px;white-space:pre-wrap}',
      '.vh-mono{font-family:Consolas,"Cascadia Mono",monospace}',
      // 磁盘面板（右侧栏 tab）
      '.vh-dtab{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}',
      '.vh-dhead{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap}',
      '.vh-dbody{flex:1;min-height:0;overflow:auto;padding:10px 14px 16px;display:flex;flex-direction:column;gap:10px}',
      '.vh-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:10px 12px}',
      '.vh-card-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}',
      '.vh-flags{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:0 0 7px}',
      '.vh-bdg.git{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.vh-card-h .nm{font-weight:600;font-size:13.5px}',
      '.vh-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:5px 14px}',
      '.vh-kv .it{display:flex;gap:6px;font-size:12px;min-width:0}',
      '.vh-kv .k{color:var(--dsw-alias-label-secondary);flex:none}',
      '.vh-kv .v{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.vh-risk{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;border-radius:999px;padding:1px 9px;border:1px solid;white-space:nowrap}',
      '.vh-risk.ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.vh-risk.warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}',
      '.vh-risk.bad{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}',
      '.vh-rs{list-style:none;margin:7px 0 0;padding:0;font-size:11.5px;color:var(--dsw-alias-label-secondary)}',
      '.vh-rs li{margin:2px 0}',
      '.vh-vols{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
      '.vh-vol{font-size:11px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:2px 7px;color:var(--dsw-alias-label-secondary);display:inline-flex;gap:5px;align-items:center}',
      '.vh-vol b{color:var(--dsw-alias-label-primary)}',
      '.vh-vol i{display:inline-block;width:44px;height:5px;border-radius:3px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);overflow:hidden;position:relative}',
      '.vh-vol i s{position:absolute;left:0;top:0;bottom:0;background:var(--dsw-alias-brand-primary);text-decoration:none}',
      '.vh-hint{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:7px;line-height:1.55}',
      '.vh-url{display:flex;align-items:center;gap:8px;margin:5px 0}',
      '.vh-url-t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:Consolas,"Cascadia Mono",monospace;font-size:11.5px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:3px 7px}',
      '.vh-log{margin:0;padding:9px 16px;max-height:220px;overflow:auto;font-family:Consolas,"Cascadia Mono",monospace;font-size:11px;line-height:1.45;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border-bottom:1px solid var(--dsw-alias-border-l1);white-space:pre-wrap}',
      '.vh-hint code{font-family:Consolas,"Cascadia Mono",monospace;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:4px;padding:0 4px}',
      '.vh-bk-card{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);padding:10px 12px;margin:0 0 10px;display:flex;flex-direction:column;gap:7px}',
      '.vh-bk-t{font-size:12.5px;font-weight:600}',
      '.vh-bk-note{font-size:11.5px;color:var(--dsw-alias-label-secondary);line-height:1.55;word-break:break-all}',
      '.vh-bk-list{display:flex;flex-direction:column;gap:3px;margin-top:2px}',
      '.vh-bk-item{display:flex;align-items:center;gap:8px;font-size:11.5px}',
      '.vh-bk-n{font-weight:600;white-space:nowrap}',
      '.vh-bk-p{color:var(--dsw-alias-label-secondary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    ].join('\n')

    function num(n) {
      const s = String(n == null ? 0 : n)
      return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    function day(iso) { return String(iso || '').slice(0, 10) }
    function clock(iso) { return String(iso || '').slice(11, 16) }

    function Disks(data) {
      const ds = (data && data.disks) || []
      if (!ds.length) { return null }
      return h('div', { className: 'vh-disks' }, ds.map(function (d, i) {
        const cls = d.state === 'bad' ? 'bad' : (d.state === 'warn' ? 'warn' : 'ok')
        const usedPct = d.total ? Math.round(100 - (d.pctFree || 0)) : 0
        return h('span', { className: 'vh-disk ' + cls, key: 'd' + i },
          h('span', { className: 'vh-dot' }),
          h('b', null, d.drive),
          h('span', { className: 'vh-role' }, (d.roles || []).join(' / ')),
          d.ready
            ? h('span', null, '剩余 ' + d.freeText + ' / ' + d.totalText + ' · 已用 ' + usedPct + '%')
            : h('span', null, '未就绪'),
          d.ready ? h('span', { className: 'vh-bar' }, h('i', { style: { width: usedPct + '%' } })) : null)
      }))
    }

    // ---------- 磁盘面板（右侧栏 tab） ----------
    let ctxRef = null

    function kvItem(k, v) {
      if (v === null || v === undefined || v === '') return null
      return h('div', { className: 'it', key: k },
        h('span', { className: 'k' }, k),
        h('span', { className: 'v', title: String(v) }, String(v)))
    }

    // hostWrittenGB 是 GB 数（smartctl 的 Data Units Written × 512000 字节）
    function fmtBytes(gb) {
      const n = Number(gb)
      if (!isFinite(n) || n <= 0) return null
      return n >= 1024 ? (n / 1024).toFixed(2) + ' TB' : n.toFixed(1) + ' GB'
    }

    function RiskBadge(risk) {
      const r = risk || { level: 'ok', score: 0 }
      const label = r.level === 'bad' ? '风险' : (r.level === 'warn' ? '注意' : '稳定')
      return h('span', { className: 'vh-risk ' + r.level, title: '风险分 ' + (r.score || 0) + '（≥50 风险 / ≥20 注意）' },
        h('span', { className: 'vh-dot', style: { background: 'currentColor' } }),
        label + ' ' + (r.score || 0))
    }

    function DiskCard(d, i) {
      const isHdd = d.kind === 'HDD'
      const s = d.smart || {}
      const items = [
        kvItem('接口', d.busType),
        kvItem('容量', d.sizeGB + ' GB'),
        kvItem('健康', d.health),
        kvItem('运行', d.operational),
        kvItem('扇区', d.logicalSector + ' / ' + d.physicalSector + ' B'),
      ]
      if (d.isBoot) items.push(kvItem('系统盘', '是（启动盘）'))
      if (isHdd) {
        items.push(kvItem('转速', d.spindleSpeed && String(d.spindleSpeed) !== '0' ? d.spindleSpeed + ' rpm' : '未知'))
        items.push(kvItem('通电时间', s.powerOnHours != null ? s.powerOnHours + ' 小时' : '待 SMART'))
        items.push(kvItem('启停次数', s.startStopCount))
        items.push(kvItem('磁头加载', s.loadUnloadCount))
        items.push(kvItem('重映射扇区', s.reallocatedSectors != null ? s.reallocatedSectors + ' 个' : '待 SMART'))
        items.push(kvItem('待重映射', s.pendingSectors != null ? s.pendingSectors + ' 个' : '待 SMART'))
        items.push(kvItem('离线不可纠正', s.offlineUncorrectable != null ? s.offlineUncorrectable + ' 个' : '待 SMART'))
        items.push(kvItem('UDMA CRC', s.crcErrors))
      } else {
        items.push(kvItem('介质', 'SSD（闪存）'))
        items.push(kvItem('寿命磨损', s.wearPct != null ? s.wearPct + '%（0% = 全新）' : '待 SMART'))
        items.push(kvItem('通电时间', s.powerOnHours != null ? s.powerOnHours + ' 小时' : '待 SMART'))
        items.push(kvItem('写入量', s.hostWrittenGB != null ? fmtBytes(s.hostWrittenGB) : '待 SMART'))
        items.push(kvItem('异常掉电', s.unsafeShutdowns))
        items.push(kvItem('介质错误', s.mediaErrors))
        items.push(kvItem('可用备用块', s.availableSparePct != null ? s.availableSparePct + '%' : '待 SMART'))
        items.push(kvItem('电源循环', s.powerCycles))
      }
      const peak = (s.tempMaxC != null && Number(s.tempMaxC) > 0) ? '（峰值 ' + s.tempMaxC + '°C）' : ''
      items.push(kvItem('温度', s.tempC != null ? s.tempC + '°C' + peak : '待 SMART'))

      const vols = (d.volumes || []).map(function (v, vi) {
        const used = v.usedPct || 0
        return h('span', { className: 'vh-vol', key: 'v' + vi, title: v.usedPct + '% 已用' },
          h('b', null, v.letter || '系统分区'),
          v.label ? h('span', null, v.label) : null,
          h('span', null, v.freeGB + ' / ' + v.totalGB + ' GB 空闲'),
          h('i', null, h('s', { style: { width: used + '%' } })))
      })

      const reasons = ((d.risk && d.risk.reasons) || []).filter(Boolean)
      const gitTitle = d.isPrimary ? 'Git 仓库所在盘' : (d.hasGit ? 'Git 仓库盘' : '')
      const roleText = (d.roles || []).join(' / ')

      // 趋势：从 /history.json 里挑这块盘的点（Host 每次真扫追加一条）
      let trendRow = null
      if (d.__hist && d.__hist.length > 1) {
        const own = d.__hist.map(function (p) {
          const hit = (p.disks || []).filter(function (x) { return Number(x.i) === Number(d.index) })[0]
          return hit || {}
        })
        const parts = []
        if (!isHdd) { const sp = Spark(own, 'wear', 'var(--dsw-alias-brand-primary)'); if (sp) parts.push(h('span', { className: 'vh-trend', key: 'tw' }, h('span', null, '磨损'), sp)) }
        const sp2 = Spark(own, 'realloc', 'var(--dsw-alias-state-warn-primary)')
        if (sp2) parts.push(h('span', { className: 'vh-trend', key: 'tr' }, h('span', null, '重映射'), sp2))
        const sp3 = Spark(own, 'free', 'var(--dsw-alias-state-success-primary)')
        if (sp3) parts.push(h('span', { className: 'vh-trend', key: 'tf' }, h('span', null, '可用空间'), sp3))
        if (parts.length) trendRow = h('div', { className: 'vh-trends' }, parts)
      }
      if (trendRow) {/* 挂在 kv 之后 */}

      return h('div', { className: 'vh-card', key: 'd' + i },
        h('div', { className: 'vh-card-h' },
          h('span', { className: 'nm' }, '#' + d.index + ' ' + d.model),
          h('span', { className: 'vh-bdg' }, isHdd ? '机械硬盘 HDD' : (d.kind === 'SSD' ? '固态硬盘 SSD' : '未知类型')),
          d.isBoot ? h('span', { className: 'vh-bdg tag' }, '启动盘') : null),
        h('div', { className: 'vh-flags' },
          RiskBadge(d.risk),
          gitTitle ? h('span', { className: 'vh-bdg git' }, gitTitle) : null,
          roleText ? h('span', { className: 'vh-role' }, roleText) : null),
        h('div', { className: 'vh-kv' }, items),
        trendRow,
        vols.length ? h('div', { className: 'vh-vols' }, vols) : null,
        reasons.length ? h('ul', { className: 'vh-rs' }, reasons.map(function (r, ri) { return h('li', { key: 'r' + ri }, '· ' + r) })) : null,
        (d.risk && d.risk.level === 'ok' && !reasons.length) ? h('div', { className: 'vh-hint' }, '未发现异常信号。') : null,
        d.risk && d.risk.note ? h('div', { className: 'vh-hint' }, d.risk.note) : null)
    }

    // 磁盘面板：右侧栏标签页用整页形态，主面板右列用 embedded 形态（省掉外边框）。
    function DiskPanel(props) {
      const embedded = !!(props && props.embedded)
      const [data, setData] = React.useState(null)
      const [err, setErr] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [note, setNote] = React.useState('')
      const [hist, setHist] = React.useState(null)
      const dataRef = React.useRef(null)

      // 历史趋势：读 /history.json（Host 每次真扫都会追加一个点）
      function loadHist() {
        fetch(API + '/history.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (h) { setHist(h && h.points ? h.points : []) })
          .catch(function () { setHist([]) })
      }
      React.useEffect(function () { loadHist() }, [])

      // 趋势小图：把某个指标的序列画成 84×22 的折线（min/max 自适应）
      function Spark(points, key, color) {
        const vals = (points || []).map(function (p) { return p[key] }).filter(function (v) { return v != null && !isNaN(Number(v)) }).map(Number)
        if (vals.length < 2) return null
        const min = Math.min.apply(null, vals)
        const max = Math.max.apply(null, vals)
        const span = (max - min) || 1
        const d = vals.map(function (v, i) {
          const x = (i / (vals.length - 1)) * 84
          const y = 20 - ((v - min) / span) * 18
          return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)
        }).join(' ')
        return React.createElement('svg', { key: key, width: 84, height: 22, viewBox: '0 0 84 22', style: { flex: 'none' } },
          React.createElement('path', { d: d, fill: 'none', stroke: color || 'var(--dsw-alias-brand-primary)', strokeWidth: 1.4 }),
          React.createElement('title', null, min + ' → ' + max))
      }

      // 轻量合并：把 smart.json 里的每盘 SMART 按序列号（退化时按 index）贴到当前 health 数据上。
      // 用它先「立刻」出一版数字，再后台跑完整重扫（重扫要跑两个 PowerShell，约 8–9 s）。
      function mergeSmart(smart, base) {
        if (!smart || !base || !base.disks) return base
        const bySerial = {}
        const list = (smart && smart.disks) || []
        for (let i = 0; i < list.length; i++) {
          const s = list[i]
          if (s && s.serial) bySerial[String(s.serial).toUpperCase()] = s
        }
        const next = Object.assign({}, base)
        next.smart = Object.assign({}, base.smart || {}, {
          available: true,
          generated: smart.generated || '',
          admin: !!smart.elevated,
          reason: '',
        })
        next.disks = base.disks.map(function (d) {
          const s = bySerial[String(d.serial || '').toUpperCase()] || list[d.index] || null
          return s ? Object.assign({}, d, { smart: s }) : d
        })
        return next
      }

      function load(fresh, silent) {
        if (!silent) { setBusy(true); setErr(''); setNote('') }
        // silent 模式=SMART 刚更新的后台重扫：显式 smart=0，别把刚采过的 SMART 又跑一遍（省约 2.5 s）
        const url = fresh ? ('/disks/scan' + (silent ? '?smart=0' : '')) : '/disks.json'
        fetch(API + url, { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (d) {
            if (d && d.error) throw new Error(d.error + (d.detail ? ': ' + d.detail : ''))
            dataRef.current = d
            setData(d)
            if (d && d.scan && !silent) {
              const sm = d.scan.smart
              const extra = sm && sm.skipped ? '（SMART 快照较新，跳过重采）' : (sm && !sm.ok ? '（SMART 采集失败）' : '')
              setNote(d.scan.ok ? '已扫描 · ' + d.scan.ms + ' ms' + extra : '扫描失败：' + (d.scan.err || ('exit ' + d.scan.code)))
            }
          })
          .catch(function (e) { if (!silent) setErr(String((e && e.message) || e)) })
          .then(function () { if (!silent) setBusy(false) })
      }

      // SMART 提权扫描：先请宿主弹 UAC 跑 smart-launch.ps1，再轮询两个文件：
      //   /smart.json     —— 快照本身（mtime 更新 = 成功）
      //   /smart.state.json —— 启动器的结果（phase=done/error + exitCode/error，UAC 取消或脚本报错都能看到）
      const pollRef = React.useRef(0)
      const timeoutRef = React.useRef(0)
      const [smartMsg, setSmartMsg] = React.useState('')
      const [smartLog, setSmartLog] = React.useState('')

      React.useEffect(function () { load(false) }, [])
      React.useEffect(function () {
        return function () { stopPoll() }
      }, [])

      function stopPoll() {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = 0 }
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = 0 }
      }

      function showLog() {
        fetch(API + '/smart.log?lines=40', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (d) {
            setSmartLog(d && d.exists ? (d.tail || '(日志为空)') : '还没有日志：' + ((d && d.file) || 'smart.log'))
          })
          .catch(function (e) { setSmartLog('读日志失败：' + String((e && e.message) || e)) })
      }

      // 立刻把 /smart.json 贴到当前数据上（一次 fetch，几十毫秒），不跑任何 PowerShell。
      function applySmartNow() {
        return fetch(API + '/smart.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (info) {
            const merged = mergeSmart(info, dataRef.current)
            if (merged && merged !== dataRef.current) {
              dataRef.current = merged
              setData(merged)
            }
          })
          .catch(function () { /* 贴不上就交给后台重扫 */ })
      }

      function smartScan() {        if (busy) return
        stopPoll()
        setSmartLog('')
        setSmartMsg('正在请求提权…请在 UAC 窗口点「是」')
        const t0 = Date.now()
        fetch(API + '/smart/scan', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (res) {
            if (!res || !res.ok) throw new Error((res && res.err) || '提权请求被拒绝')
            setSmartMsg('已请求提权，等待 UAC / SMART 快照…')
            pollRef.current = setInterval(function () {
              fetch(API + '/smart.json', { cache: 'no-store' })
                .then(function (r) { return r.json() })
                .then(function (info) {
                  if (info && info.exists && Number(info.mtimeMs) >= t0) {
                    stopPoll()
                    if (info.valid === false && info.error) {
                      setSmartMsg('SMART 脚本报错，快照没写全：' + info.error + '（点「看日志」看细节）')
                      return null
                    }
                    // 先本地贴上去（几十毫秒就出数字），再后台跑完整重扫（两个 PowerShell 约 8–9 s）
                    setSmartMsg('快照已到，正在贴到面板上…')
                    return applySmartNow().then(function () {
                      setSmartMsg('SMART 已更新（温度 / 通电 / 重映射等已生效）；后台完整重扫中…')
                      load(true, true)
                      return null
                    })
                  }
                  return fetch(API + '/smart.state.json', { cache: 'no-store' })
                    .then(function (r) { return r.json() })
                    .then(function (st) {
                      if (!st || !st.exists) return
                      if (st.phase === 'error') {
                        stopPoll()
                        setSmartMsg('提权没成功：' + (st.error || '未知原因') + '（点「看日志」看细节）')
                      } else if (st.phase === 'done' && Number(st.exitCode) !== 0) {
                        stopPoll()
                        setSmartMsg('SMART 脚本以代码 ' + st.exitCode + ' 退出（多半是某些盘读不到计数器），点「看日志」看细节。')
                      } else if (st.phase === 'done' && Number(st.exitCode) === 0) {
                        // 脚本说成功但快照没出现：给它一次重读机会，再提示
                        setTimeout(function () {
                          fetch(API + '/smart.json', { cache: 'no-store' })
                            .then(function (r) { return r.json() })
                            .then(function (info2) {
                              if (info2 && info2.exists) {
                                stopPoll()
                                return applySmartNow().then(function () {
                                  setSmartMsg('SMART 已更新；后台完整重扫中…')
                                  load(true, true)
                                })
                              } else if (pollRef.current) {
                                stopPoll()
                                setSmartMsg('脚本报告成功，但没找到 smart.json —— 点「看日志」看它写到哪里了。')
                              }
                            })
                            .catch(function () { /* 忽略 */ })
                        }, 800)
                      }
                    })
                })
                .catch(function () { /* 轮询失败就继续等，直到超时 */ })
            }, 1500)
            timeoutRef.current = setTimeout(function () {
              if (pollRef.current) {
                stopPoll()
                setSmartMsg('等了两分半还没等到 SMART 快照：如果 UAC 窗口还开着就点「是」或「否」；否则点「看日志」。')
              }
            }, 150000)
          })
          .catch(function (e) {
            stopPoll()
            setSmartMsg('提权没成功：' + String((e && e.message) || e))
          })
      }

      const disks = (data && data.disks) || []
      const sum = (data && data.summary) || null
      const smart = (data && data.smart) || null

      // SMART 快照时效：超过 24 小时就标黄——不然你会以为温度是刚才的
      let smartAge = null
      if (smart && smart.available !== false) {
        const ageH = Number(smart.ageHours)
        if (isFinite(ageH) && ageH >= 0) {
          smartAge = ageH
        } else if (smart.generated) {
          const t = Date.parse(String(smart.generated).replace(' ', 'T'))
          if (isFinite(t)) smartAge = (Date.now() - t) / 3600000
        }
      }
      const smartOld = smartAge !== null && smartAge > 24
      const smartAgeText = smartAge === null
        ? ''
        : 'SMART 采集于 ' + (smartAge < 1 ? '刚刚' : Math.round(smartAge) + ' 小时前') + (smartOld ? '（偏旧，建议重扫）' : '')

      const head = h('div', { className: 'vh-dhead' },
        h('span', { className: 'vh-title' }, '磁盘'),
        h('span', { className: 'vh-sub' },
          sum ? (sum.total + ' 块 · 固态 ' + sum.ssd + ' / 机械 ' + sum.hdd + ' · 风险 ' + sum.bad + ' / 注意 ' + sum.warn + ' / 稳定 ' + sum.ok) : '容量与健康'),
        note ? h('span', { className: 'vh-sub', style: { color: 'var(--dsw-alias-state-success-primary)' } }, note) : null,
        smartAgeText
          ? h('span', {
            className: 'vh-sub',
            style: { color: smartOld ? 'var(--dsw-alias-state-warn-primary)' : 'var(--dsw-alias-label-secondary)' },
            title: 'SMART 快照的时间；超过 24 小时会标黄',
          }, smartAgeText)
          : null,
        h('span', { className: 'vh-sp' }),
        h('button', {
          className: 'vh-btn',
          onClick: smartScan,
          title: '以管理员身份跑一次 SMART 快照（会弹 UAC），生成 smart.json',
        }, embedded ? 'SMART' : 'SMART 提权扫描'),
        h('button', { className: 'vh-btn', onClick: showLog, title: '看最近一次 SMART 提权的日志（smart.log）' }, embedded ? '日志' : '看日志'),
        h('button', { className: 'vh-btn', onClick: function () { load(true) }, disabled: busy }, busy ? '扫描中…' : '扫描'))

      return h('div', { className: 'vh-dtab' + (embedded ? ' embedded' : '') },
        h('style', null, CSS),
        head,
        smartMsg ? h('div', { className: 'vh-hint' }, smartMsg) : null,
        smartLog ? h('pre', { className: 'vh-log' }, smartLog) : null,
        h('div', { className: 'vh-dbody' },
          err ? h('div', { className: 'vh-err' }, '读取失败：' + err + '\n（先跑一次 disk-health.ps1）') : null,
          smart && smart.available === false
            ? h('div', { className: 'vh-hint' },
              '温度 / 磨损 / 通电时间 / 重映射扇区这些「待 SMART」项要有一次管理员快照：点上面的 SMART 按钮，UAC 点「是」后自动补上。'
              + (smart.reason ? '（' + smart.reason + '）' : ''))
            : null,
          disks.length
            ? disks.map(function (d, di) { return DiskCard(Object.assign({}, d, { __hist: hist || [] }), di) })
            : (busy ? h('div', { className: 'vh-hint' }, '正在读取磁盘信息…') : h('div', { className: 'vh-hint' }, '没有磁盘数据。'))))
    }

    function openDisks(right) {
      const ctx = ctxRef
      if (!ctx) return
      const sb = ensureDisksTab(ctx)
      if (sb && typeof sb.openTab === 'function') {
        sb.openTab({ type: 'version-history:disks', title: '磁盘', target: 'right' })
        const layout = typeof ctx.get === 'function' ? ctx.get('layout') : null
        if (right && layout && typeof layout.openRightbar === 'function') layout.openRightbar(true, false)
        return
      }
      // 没有 better-sidebar 时退回到主面板：至少让数据能看
      window.open(API + '/disks.json', '_blank', 'noopener')
    }

    // better-sidebar 的服务可能比本模块晚就绪：注册动作做成幂等，apply 时试一次，按钮点击时再补一次。
    let disksTabDone = false
    function ensureDisksTab(ctx) {
      const sb = ctx && typeof ctx.get === 'function' ? ctx.get('betterSidebar') : null
      if (!sb || typeof sb.registerTab !== 'function') return null
      if (!disksTabDone) {
        try {
          sb.registerTab({
            id: 'version-history:disks',
            title: () => '磁盘',
            description: () => '容量、机械/固态属性与稳定性风险',
            icon: (size) => Icon({ size: size }),
            order: 60,
            single: true,
            component: DiskPanel,
          })
          disksTabDone = true
        } catch (err) {
          disksTabDone = false
          if (typeof console !== 'undefined') console.error('[dsh-version-history] registerTab failed:', err)
        }
      }
      return sb
    }

    // ---------- 局域网共享（右侧栏 tab） ----------
    function LanPanel() {
      const [st, setSt] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [note, setNote] = React.useState('')
      const [copied, setCopied] = React.useState('')

      function load() {
        fetch(API + '/lan.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (d) { setSt(d) })
          .catch(function (e) { setNote('读取失败：' + String((e && e.message) || e)) })
      }
      React.useEffect(function () { load() }, [])

      function act(path, okText) {
        setBusy(true)
        setNote('')
        fetch(API + path, { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (d) {
            if (okText) setNote(d && d.ok === false ? ('没成功：' + String((d && (d.error || d.err)) || '')) : okText)
            load()
          })
          .catch(function (e) { setNote('操作失败：' + String((e && e.message) || e)) })
          .finally(function () { setBusy(false) })
      }

      function copy(url) {
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url)
            setCopied(url)
            return
          }
        } catch { /* 没有剪贴板权限就走下面的退路 */ }
        setCopied('')
      }

      const running = !!(st && st.running)
      const port = (st && st.port) || 8788
      const urls = (st && st.urls) || []
      const repos = (st && st.repos) || []
      const readOnly = !!(st && st.readOnly)
      const hasPassword = !!(st && st.hasPassword)

      // 只读 / 口令：走 POST /dsh-vh/lan（resource 路由只收 GET）
      function lanPost(body, okText) {
        setBusy(true)
        setNote('')
        fetch(API.replace('/version-history', '') + '/dsh-vh/lan', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
          .then(function (r) { return r.json() })
          .then(function (d) {
            if (d && d.ok === false) setNote('没成功：' + String(d.err || ''))
            else { setNote(okText || '已保存'); load() }
          })
          .catch(function (e) { setNote('操作失败：' + String((e && e.message) || e)) })
          .finally(function () { setBusy(false) })
      }

      function toggleReadOnly() {
        lanPost({ action: 'settings', readOnly: !readOnly }, readOnly ? '已关闭只读：局域网可以推了' : '已开启只读：局域网只能 clone / fetch')
      }

      function setPassword() {
        const v = (window.prompt('局域网推送口令（留空表示清除）', hasPassword ? '已设置（重输覆盖，留空清除）' : '') || '')
        if (!v) { lanPost({ action: 'settings', clearPassword: true }, '已清除口令'); return }
        lanPost({ action: 'settings', password: v }, '已设置口令：clone 地址写成 http://user:' + v + '@<ip>:' + port + '/git/<仓库>.git')
      }

      const head = h('div', { className: 'vh-dhead' },
        h('span', { className: 'nm' }, '局域网 Git'),
        h('span', { className: 'vh-bdg ' + (running ? 'ok' : '') }, running ? '运行中 · :' + port : '未启动'),
        readOnly ? h('span', { className: 'vh-bdg' }, '只读') : null,
        hasPassword ? h('span', { className: 'vh-bdg ok' }, '需口令') : null,
        h('span', { className: 'vh-sp' }),
        running ? h('button', { className: 'vh-btn', disabled: busy, onClick: function () { act('/lan/stop', '已停止') } }, '停止')
          : h('button', { className: 'vh-btn', disabled: busy, onClick: function () { act('/lan/start', '已启动') } }, '启动'),
        h('button', { className: 'vh-btn', disabled: busy, title: '弹 UAC 添加 Windows 防火墙入站规则（局域网设备才能连）', onClick: function () { act('/lan/firewall', '已请求提权添加防火墙规则，UAC 点「是」') } }, '开放端口'))

      const body = h('div', { className: 'vh-dbody' },
        note ? h('div', { className: 'vh-hint' }, note) : null,
        h('div', { className: 'vh-row', style: { gap: '10px', flexWrap: 'wrap' } },
          h('label', { className: 'vh-chk', title: '打开后局域网只能 clone / fetch，push 会被 403 拒绝' },
            h('input', { type: 'checkbox', checked: readOnly, onChange: toggleReadOnly }),
            h('span', null, '只读模式' + (readOnly ? '（已禁止推送）' : ''))),
          h('span', { className: 'vh-sp' }),
          h('button', { className: 'vh-btn', disabled: busy, onClick: setPassword, title: '设置后 git 需要 Basic 认证：http://user:<口令>@<ip>:8788/git/<仓库>.git' },
            hasPassword ? '改口令 / 清除' : '设口令 (可选)')),
        running && urls.length
          ? h('div', null, urls.map(function (u, i) {
            return h('div', { className: 'vh-url', key: 'u' + i },
              h('code', { className: 'vh-url-t' }, u),
              h('button', {
                className: 'vh-btn',
                onClick: function () { copy(u) },
              }, copied === u ? '已复制' : '复制'))
          }))
          : null,
        running && !repos.length ? h('div', { className: 'vh-hint' }, 'repos 目录下还没有裸仓库。') : null,
        !running ? h('div', { className: 'vh-hint' },
          '点「启动」在这台机器上开一个 Git Smart HTTP 服务，局域网里的其他设备就能直接 clone / push 这里的裸仓库（repos 目录）。'
          + '第一次用先点「开放端口」放行防火墙；默认没有账号密码，只在可信局域网里开，用完点「停止」；'
          + '不放心的场景可以打开上面的「只读模式」或设一个口令。') : null,
        h('div', { className: 'vh-hint' },
          '其他设备：git clone ' + ((urls[0] || 'http://<本机IP>:' + port + '/git/<仓库>.git')) + '；推送同一地址即可（裸仓库没有检出，推上去就是备份）。'))

      return h('div', { className: 'vh-dtab' }, h('style', null, CSS), head, body)
    }

    function openLan(right) {
      const ctx = ctxRef
      if (!ctx) return
      const sb = ensureLanTab(ctx)
      if (sb && typeof sb.openTab === 'function') {
        sb.openTab({ type: 'version-history:lan', title: '局域网', target: 'right' })
        const layout = typeof ctx.get === 'function' ? ctx.get('layout') : null
        if (right && layout && typeof layout.openRightbar === 'function') layout.openRightbar(true, false)
      }
    }

    let lanTabDone = false
    function ensureLanTab(ctx) {
      const sb = ctx && typeof ctx.get === 'function' ? ctx.get('betterSidebar') : null
      if (!sb || typeof sb.registerTab !== 'function') return null
      if (!lanTabDone) {
        try {
          sb.registerTab({
            id: 'version-history:lan',
            title: () => '局域网',
            description: () => '把 repos 目录里的裸仓库共享给局域网（clone / push）',
            icon: (size) => Icon({ size: size }),
            order: 61,
            single: true,
            component: LanPanel,
          })
          lanTabDone = true
        } catch (err) {
          lanTabDone = false
          if (typeof console !== 'undefined') console.error('[dsh-version-history] registerTab(lan) failed:', err)
        }
      }
      return sb
    }

    // ---------- GitHub 绑定 / 连接 / 手动推送（右侧栏 tab） ----------
    function ghPost(body) {
      return fetch('/dsh-vh/gh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body || {}),
      }).then(function (r) { return r.json() }).catch(function (err) {
        return { ok: false, err: String(err && err.message || err) }
      })
    }

    function GithubPanel() {
      const [st, setSt] = React.useState(null)
      const [repos, setRepos] = React.useState([])
      const [apiRepos, setApiRepos] = React.useState(null)
      const [msg, setMsg] = React.useState('')
      const [bad, setBad] = React.useState('')
      const [busy, setBusy] = React.useState('')
      const [form, setForm] = React.useState({ repoPath: '', url: '', branch: 'main', token: '', tags: true })

      function applyState(s) {
        if (!s) return
        setSt(s)
        setForm(function (f) {
          return {
            repoPath: f.repoPath || s.repoPath || '',
            url: f.url || s.fullName || s.url || '',
            branch: f.branch && f.branch !== 'main' ? f.branch : (s.branch || 'main'),
            token: f.token,
            tags: f.tags,
          }
        })
      }

      function loadStatus() {
        fetch(API + '/github.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(applyState)
          .catch(function (err) { setBad('读绑定状态失败：' + String(err && err.message || err)) })
      }

      function loadRepos() {
        fetch(API + '/repos', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (d) { setRepos((d && d.repos) || []) })
          .catch(function () { setRepos([]) })
      }

      React.useEffect(function () {
        loadStatus()
        loadRepos()
      }, [])

      function call(kind, body, okText) {
        setBusy(kind)
        setMsg('')
        setBad('')
        return ghPost(body).then(function (res) {
          setBusy('')
          if (res && res.state) applyState(res.state)
          if (res && res.ok) {
            setMsg(okText(res) || '完成')
          } else {
            setBad((res && (res.err || (res.test && res.test.err) || (res.push && res.push.err))) || '失败')
          }
          return res
        })
      }

      function bind() {
        return call('bind', { action: 'bind', url: form.url, token: form.token, branch: form.branch, repoPath: form.repoPath },
          function (res) { return '已绑定 ' + (res.state && res.state.fullName) + (res.remote ? '（本地 origin 已更新）' : '') })
      }

      function test() {
        return call('test', { action: 'test', url: form.url },
          function (res) { return '连得上：' + ((res.test && res.test.heads) || 0) + ' 个分支 / ' + ((res.test && res.test.tags) || 0) + ' 个标签 · ' + ((res.test && res.test.ms) || 0) + ' ms' })
      }

      function push() {
        return call('push', { action: 'push', branch: form.branch, tags: form.tags, repoPath: form.repoPath },
          function (res) { return '推送完成（' + ((res.push && res.push.ms) || 0) + ' ms）' })
      }

      function listApiRepos() {
        setBusy('repos')
        setMsg('')
        setBad('')
        ghPost({ action: 'repos' }).then(function (res) {
          setBusy('')
          if (res && res.ok) {
            setApiRepos(res)
            setMsg('令牌有效：' + (res.login || '') + ' · ' + (res.count || 0) + ' 个仓库')
          } else setBad((res && res.err) || '拉列表失败')
        })
      }

      function unbind() {
        return call('unbind', { action: 'unbind' }, function () { setApiRepos(null); return '已解绑（本地 origin 保留）' })
      }

      const bound = !!(st && st.bound)

      // 令牌到期提醒：GitHub 不提供 PAT 元数据查询，到期日只能手动填；剩 ≤7 天变黄。
      let expiryText = ''
      let expiryWarn = false
      if (st && st.tokenExpiry) {
        const exp = Date.parse(st.tokenExpiry + 'T23:59:59')
        if (isFinite(exp)) {
          const days = Math.ceil((exp - Date.now()) / 86400000)
          expiryText = days < 0
            ? ('令牌已于 ' + st.tokenExpiry + ' 过期')
            : ('令牌到期 ' + st.tokenExpiry + '（剩 ' + days + ' 天）')
          expiryWarn = days <= 7
        }
      }

      function saveExpiry() {
        const v = (window.prompt('令牌到期日（YYYY-MM-DD，留空清除）', (st && st.tokenExpiry) || '') || '').trim()
        if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) { setBad('日期格式要 YYYY-MM-DD'); return }
        ghPost({ action: 'set-expiry', date: v }).then(function (res) {
          if (res && res.state) applyState(res.state)
          if (res && res.ok) setMsg(v ? '已记录到期日：' + v : '已清除到期日')
          else setBad((res && res.err) || '保存失败')
        })
      }

      const head = h('div', { className: 'vh-dhead' },
        h('span', { className: 'nm' }, 'GitHub'),
        h('span', { className: 'vh-risk ' + (bound ? 'ok' : 'warn') },
          h('span', { className: 'vh-dot' }), bound ? '已绑定 ' + st.fullName : '未绑定'),
        st && st.hasToken ? h('span', { className: 'vh-hint' }, '令牌 ' + st.tokenMasked) : null,
        expiryText
          ? h('span', {
            className: 'vh-risk ' + (expiryWarn ? 'warn' : 'ok'),
            title: '点一下可以改到期日（GitHub 不提供 PAT 元数据查询，只能手填）',
            style: { cursor: 'pointer' },
            onClick: saveExpiry,
          }, h('span', { className: 'vh-dot' }), expiryText)
          : (st && st.hasToken
            ? h('span', {
              className: 'vh-hint',
              style: { cursor: 'pointer' },
              title: '记下到期日，到期前 7 天会变黄提醒',
              onClick: saveExpiry,
            }, '＋ 记到期日')
            : null),
        h('span', { className: 'vh-sp' }),
        h('button', { className: 'vh-btn', disabled: !!busy, onClick: test, title: '对远程执行 git ls-remote（有令牌就顺带验证令牌）' }, busy === 'test' ? '测试中…' : '测试连接'),
        h('button', { className: 'vh-btn', disabled: !!busy || !form.url, onClick: bind, title: '保存 owner/repo、令牌、分支；选了本地仓库就顺手把 origin 指过去' }, busy === 'bind' ? '绑定中…' : '绑定'),
        h('button', { className: 'vh-btn primary', disabled: !!busy || !bound, onClick: push, title: '把本地仓库当前分支推到 GitHub（手动触发）' }, busy === 'push' ? '推送中…' : '推送到 GitHub'))

      const form$ = h('div', { className: 'vh-gh' },
        h('label', { className: 'vh-row' }, h('span', { className: 'vh-k' }, '仓库'),
          h('select', {
            className: 'vh-inp',
            value: form.repoPath,
            onChange: function (ev) { setForm(function (f) { return { ...f, repoPath: ev.target.value } }) },
          },
            h('option', { value: '' }, '（只绑定远程，不指定本地仓库）'),
            repos.map(function (p) { return h('option', { key: 'r:' + p, value: p }, p) }))),
        h('label', { className: 'vh-row' }, h('span', { className: 'vh-k' }, '远程'),
          h('input', {
            className: 'vh-inp',
            value: form.url,
            placeholder: 'owner/repo 或 https://github.com/owner/repo.git',
            onChange: function (ev) { setForm(function (f) { return { ...f, url: ev.target.value } }) },
          })),
        h('label', { className: 'vh-row' }, h('span', { className: 'vh-k' }, '分支'),
          h('input', {
            className: 'vh-inp',
            value: form.branch,
            placeholder: 'main',
            onChange: function (ev) { setForm(function (f) { return { ...f, branch: ev.target.value } }) },
          })),
        h('label', { className: 'vh-row' }, h('span', { className: 'vh-k' }, '令牌'),
          h('input', {
            className: 'vh-inp',
            type: 'password',
            value: form.token,
            placeholder: st && st.hasToken ? '已保存（留空表示不改）' : 'GitHub PAT（repo 权限）',
            autoComplete: 'off',
            onChange: function (ev) { setForm(function (f) { return { ...f, token: ev.target.value } }) },
          })),
        h('div', { className: 'vh-row' },
          h('label', { className: 'vh-chk' },
            h('input', {
              type: 'checkbox',
              checked: !!form.tags,
              onChange: function (ev) { setForm(function (f) { return { ...f, tags: ev.target.checked } }) },
            }),
            h('span', null, '同时推送标签（--tags）')),
          h('span', { className: 'vh-sp' }),
          h('button', { className: 'vh-btn', disabled: !!busy, onClick: listApiRepos, title: '用令牌列你自己的仓库（走 GitHub API，认系统代理）' }, busy === 'repos' ? '查询中…' : '拉我的仓库'),
          bound ? h('button', { className: 'vh-btn', disabled: !!busy, onClick: unbind, title: '清除绑定与令牌（本地 origin 保留）' }, '解绑') : null))

      const info = h('div', null,
        st && st.lastTest
          ? h('div', { className: 'vh-hint' },
            (st.lastTest.ok ? '上次连接：' : '上次连接失败：') + st.lastTest.at + ' · ' + (st.lastTest.ms || 0) + ' ms · '
            + (st.lastTest.heads || 0) + ' 分支 / ' + (st.lastTest.tags || 0) + ' 标签'
            + (st.lastTest.branches && st.lastTest.branches.length ? '（' + st.lastTest.branches.slice(0, 6).join(', ') + '…）' : '')
            + (st.lastTest.err ? ' · ' + st.lastTest.err : ''))
          : null,
        st && st.lastPush
          ? h('div', { className: 'vh-hint' },
            (st.lastPush.ok ? '上次推送：' : '上次推送失败：') + st.lastPush.at + ' · 分支 ' + st.lastPush.branch
            + (st.lastPush.tags ? ' + 标签' : '') + ' · ' + (st.lastPush.ms || 0) + ' ms'
            + (st.lastPush.err ? ' · ' + st.lastPush.err : ''))
          : null,
        msg ? h('div', { className: 'vh-msg ok' }, msg) : null,
        bad ? h('div', { className: 'vh-msg bad' }, bad) : null,
        apiRepos && apiRepos.repos && apiRepos.repos.length
          ? h('div', { className: 'vh-ghlist' }, apiRepos.repos.slice(0, 40).map(function (r) {
            return h('button', {
              key: 'g:' + r.fullName,
              className: 'vh-mini',
              title: (r.private ? '私有' : '公开') + ' · 默认分支 ' + r.branch,
              onClick: function () { setForm(function (f) { return { ...f, url: r.fullName, branch: r.branch || f.branch } }) },
            }, r.fullName)
          }))
          : null)

      const body = h('div', { className: 'vh-dbody' }, form$, info,
        h('div', { className: 'vh-hint' },
          '令牌只在本机用：保存时用 Windows DPAPI 加密（只有当前用户能解），认证走 '
          + 'git 的 `-c http.https://github.com/.extraheader`，不会写进 URL、也不会进命令行参数。推送是手动点按钮触发，不自动。'))

      return h('div', { className: 'vh-dtab' }, h('style', null, CSS), head, body)
    }

    function openGithub(right) {
      const ctx = ctxRef
      if (!ctx) return
      const sb = ensureGithubTab(ctx)
      if (sb && typeof sb.openTab === 'function') {
        sb.openTab({ type: 'version-history:github', title: 'GitHub', target: 'right' })
        const layout = typeof ctx.get === 'function' ? ctx.get('layout') : null
        if (right && layout && typeof layout.openRightbar === 'function') layout.openRightbar(true, false)
      }
    }

    let githubTabDone = false
    function ensureGithubTab(ctx) {
      const sb = ctx && typeof ctx.get === 'function' ? ctx.get('betterSidebar') : null
      if (!sb || typeof sb.registerTab !== 'function') return null
      if (!githubTabDone) {
        try {
          // 直接注册，不包 ctx.effect：apply 之后调用 ctx.effect 可能被忽略，
          // 那样点按钮就完全没有反应（2026-11-23 用户实测「点绑定没效果」）。
          sb.registerTab({
            id: 'version-history:github',
            title: () => 'GitHub',
            description: () => '绑定 GitHub 仓库、测连通性、手动推送本地仓库',
            icon: (size) => Icon({ size: size }),
            order: 62,
            single: true,
            component: GithubPanel,
          })
          githubTabDone = true
        } catch (err) {
          githubTabDone = false
          if (typeof console !== 'undefined') console.error('[dsh-version-history] registerTab(github) failed:', err)
        }
      }
      return sb
    }

    /* ─── 备份设置（镜像 + 一键拷贝，带可选许可密码） ───────────────── */

    function bkPost(body) {
      return fetch(API.replace('/version-history', '') + '/dsh-vh/backup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).then(function (r) { return r.json() }).catch(function (err) {
        return { ok: false, err: String((err && err.message) || err) }
      })
    }

    function BackupPanel() {
      const [st, setSt] = React.useState(null)
      const [mirror, setMirror] = React.useState('')
      const [keep, setKeep] = React.useState('10')
      const [pw, setPw] = React.useState('')
      const [newPw, setNewPw] = React.useState('')
      const [setup, setSetup] = React.useState(false)
      const [busy, setBusy] = React.useState('')
      const [msg, setMsg] = React.useState('')
      const [bad, setBad] = React.useState('')
      const [last, setLast] = React.useState(null)
      const [autoOn, setAutoOn] = React.useState(false)
      const [autoMode, setAutoMode] = React.useState('daily')
      const [autoAt, setAutoAt] = React.useState('03:30')
      const [autoMin, setAutoMin] = React.useState('360')
      const [lock, setLock] = React.useState(false)

      function load() {
        return fetch(API + '/backup.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (s) {
            setSt(s)
            if (s && s.mirror) setMirror(s.mirror)
            if (s && s.keep) setKeep(String(s.keep))
            if (s && !s.passwordMode) setSetup(true)
            if (s && s.lastRun) setLast(s.lastRun)
            if (s && s.auto) {
              setAutoOn(!!s.auto.enabled)
              setAutoMode(s.auto.mode === 'interval' ? 'interval' : 'daily')
              setAutoAt(s.auto.at || '03:30')
              setAutoMin(String(s.auto.minutes || 360))
            }
            setLock(!!(s && s.pushLock))
            return s
          })
          .catch(function (err) { setBad('读取备份配置失败：' + String((err && err.message) || err)) })
      }

      React.useEffect(function () { load() }, [])

      function take(res, okText) {
        setBusy('')
        if (!res || res.ok === false) {
          setMsg('')
          if (res && res.needPassword) setBad('这一步需要许可密码：先在上面输入密码')
          else if (res && res.badPassword) setBad('许可密码不对')
          else setBad((res && (res.err || res.error)) || '操作失败')
          return false
        }
        setBad('')
        setMsg(okText)
        return true
      }

      function savePassword() {
        const v = newPw.trim()
        if (v.length < 4) { setBad('密码至少 4 位'); return }
        setBusy('pw')
        bkPost({ action: 'set-password', password: v }).then(function (res) {
          if (take(res, '已设置许可密码：之后「保存镜像」「一键拷贝」都要输入它')) {
            setSetup(false)
            setNewPw('')
            load()
          }
        })
      }

      function skipPassword() {
        setBusy('pw')
        bkPost({ action: 'set-password', mode: 'none' }).then(function (res) {
          if (take(res, '已设为「不需要密码」：以后不再询问')) {
            setSetup(false)
            load()
          }
        })
      }

      function clearPassword() {
        setBusy('pw')
        bkPost({ action: 'clear-password', password: pw }).then(function (res) {
          if (take(res, '已清除许可密码')) { setPw(''); load() }
        })
      }

      function saveMirror() {
        setBusy('mirror')
        bkPost({ action: 'set-mirror', mirror: mirror, keep: Number(keep) || 10, password: pw })
          .then(function (res) {
            if (take(res, '镜像已保存：' + (res.mirror || ''))) load()
          })
      }

      function saveAuto(enabled) {
        setBusy('auto')
        bkPost({
          action: 'set-auto',
          enabled: typeof enabled === 'boolean' ? enabled : autoOn,
          mode: autoMode,
          at: autoAt,
          minutes: Number(autoMin) || 360,
          password: pw,
        }).then(function (res) {
          const on = !!(res && res.auto && res.auto.enabled)
          if (take(res, on
            ? ('自动备份已开启：' + (res.auto.mode === 'interval'
              ? '每隔 ' + res.auto.minutes + ' 分钟跑一次'
              : '每天 ' + res.auto.at + ' 跑一次'))
            : '自动备份已关闭')) {
            load()
          } else {
            load()
          }
        })
      }

      function saveLock(next) {
        setBusy('lock')
        bkPost({ action: 'set-push-lock', locked: !!next }).then(function (res) {
          const on = !!(res && res.ok && res.pushLock)
          setLock(on)
          if (take(res, on ? '推送保护已开启：之后所有 GitHub 推送都会被拒绝' : '推送保护已关闭：可以手动推送了')) load()
          else load()
        })
      }

      function runCopy() {        setBusy('run')
        setMsg('正在拷贝…（每个裸仓都做一次镜像 + bundle，仓库多时会慢一点）')
        bkPost({ action: 'run', password: pw }).then(function (res) {
          if (take(res, '')) {
            setLast(res.lastRun || null)
            const r0 = res.lastRun || {}
            setMsg('一键拷贝完成：' + (r0.okCount || 0) + '/' + (r0.count || 0) + ' 个仓库成功 · '
              + Math.round((r0.ms || 0) / 100) / 10 + ' s')
            load()
          } else if (res && res.results) {
            setLast({ at: new Date().toISOString(), mirror: mirror, results: res.results })
          }
        })
      }

      const hasPw = !!(st && st.hasPassword)
      const pwRow = hasPw
        ? h('div', { className: 'vh-row', key: 'pw' },
          h('span', { className: 'vh-k' }, '密码'),
          h('input', {
            className: 'vh-inp',
            type: 'password',
            placeholder: '许可密码（每次保存镜像 / 一键拷贝都要填）',
            value: pw,
            onChange: function (e) { setPw(e.target.value) },
          }),
          h('button', { className: 'vh-btn', disabled: busy === 'pw', onClick: clearPassword, title: '清除许可密码：之后两个功能都不再校验' }, '清除密码'))
        : null

      const setupCard = setup
        ? h('div', { className: 'vh-bk-card', key: 'setup' },
          h('div', { className: 'vh-bk-t' }, '要不要给备份功能设一个许可密码？'),
          h('div', { className: 'vh-bk-note' },
            '设了之后，每次「保存镜像」和「一键拷贝」都要输入这个密码 —— 防的是误点，不是防人。密码只在本机、用 scrypt 加盐哈希存，不回显。'),
          h('div', { className: 'vh-row' },
            h('input', {
              className: 'vh-inp',
              type: 'password',
              placeholder: '至少 4 位',
              value: newPw,
              onChange: function (e) { setNewPw(e.target.value) },
            }),
            h('button', { className: 'vh-btn', disabled: busy === 'pw', onClick: savePassword }, '设密码'),
            h('button', { className: 'vh-btn', disabled: busy === 'pw', onClick: skipPassword }, '不设密码')),
          h('div', { className: 'vh-bk-note' }, '选「不设密码」以后不再询问；仍可在这个区块里随时补设。'))
        : null

      const mirrorRow = h('div', { className: 'vh-bk-card', key: 'mirror' },
        h('div', { className: 'vh-bk-t' }, '镜像'),
        h('div', { className: 'vh-row' },
          h('span', { className: 'vh-k' }, '目录'),
          h('input', {
            className: 'vh-inp',
            placeholder: '镜像根目录绝对路径，例如 D:\\GitMirror',
            value: mirror,
            onChange: function (e) { setMirror(e.target.value) },
          })),
        h('div', { className: 'vh-row' },
          h('span', { className: 'vh-k' }, '保留'),
          h('input', {
            className: 'vh-inp',
            style: { maxWidth: '84px' },
            value: keep,
            onChange: function (e) { setKeep(e.target.value) },
          }),
          h('span', { className: 'vh-bk-note', style: { margin: 0 } }, '每个仓的 bundle 只留最近 N 份'),
          h('span', { className: 'vh-sp' }),
          h('button', { className: 'vh-btn', disabled: busy === 'mirror', onClick: saveMirror },
            busy === 'mirror' ? '保存中…' : '保存镜像')),
        st && st.mirror
          ? h('div', { className: 'vh-bk-note' },
            '镜像：' + st.mirror + '  ·  bundle：' + st.mirror + '\\bundles\\' + '  ·  日志：' + st.mirror + '\\logs\\')
          : h('div', { className: 'vh-bk-note' }, '还没设置镜像目录。'))

      const autoInfo = (st && st.auto) || {}
      const autoCard = h('div', { className: 'vh-bk-card', key: 'auto' },
        h('div', { className: 'vh-bk-t' }, '自动备份'),
        h('div', { className: 'vh-row' },
          h('label', { className: 'vh-chk' },
            h('input', {
              type: 'checkbox',
              checked: autoOn,
              onChange: function (e) { setAutoOn(e.target.checked); saveAuto(e.target.checked) },
            }),
            h('span', null, autoOn ? '已开启：到点自动跑一次「一键拷贝」' : '未开启')),
          h('span', { className: 'vh-sp' })),
        h('div', { className: 'vh-row' },
          h('span', { className: 'vh-k' }, '方式'),
          h('select', {
            className: 'vh-inp',
            style: { maxWidth: '104px' },
            value: autoMode,
            onChange: function (e) { setAutoMode(e.target.value) },
          },
          h('option', { value: 'daily' }, '每天'),
          h('option', { value: 'interval' }, '每隔')),
          autoMode === 'daily'
            ? h('input', {
              className: 'vh-inp',
              style: { maxWidth: '108px' },
              placeholder: 'HH:mm',
              value: autoAt,
              onChange: function (e) { setAutoAt(e.target.value) },
            })
            : h('input', {
              className: 'vh-inp',
              style: { maxWidth: '92px' },
              value: autoMin,
              onChange: function (e) { setAutoMin(e.target.value) },
            }),
          h('span', { className: 'vh-bk-note', style: { margin: 0 } },
            autoMode === 'daily' ? '本地时间' : '分钟（5–1440）'),
          h('span', { className: 'vh-sp' }),
          h('button', { className: 'vh-btn', disabled: busy === 'auto', onClick: function () { saveAuto() } },
            busy === 'auto' ? '保存中…' : '保存')),
        autoInfo.lastRunAt
          ? h('div', { className: 'vh-bk-note' },
            '上次自动运行：' + String(autoInfo.lastRunAt).replace('T', ' ').slice(0, 19)
            + (autoInfo.lastOk === false ? '（失败）' : '（成功）'))
          : null,
        h('div', { className: 'vh-bk-note' },
          '自动备份是无人值守的：到点直接跑「一键拷贝」，不再校验许可密码；只在 DSH 开着时生效（关掉 DSH 就停）。'
          + '想关机也备份，就去 Windows「任务计划程序」里加一条，动作指向本插件的 Host 路由或 backup.ps1。'))

      const protectCard = h('div', { className: 'vh-bk-card', key: 'protect' },
        h('div', { className: 'vh-bk-t' }, '推送保护'),
        h('div', { className: 'vh-row' },
          h('label', { className: 'vh-chk' },
            h('input', {
              type: 'checkbox',
              checked: lock,
              onChange: function (e) { saveLock(e.target.checked) },
            }),
            h('span', null, lock ? '禁止推送：已锁住，GitHub 推送一律被拒' : '禁止推送（当前未锁，可以手动推）')),
          h('span', { className: 'vh-sp' })),
        h('div', { className: 'vh-bk-note' },
          '锁上之后，右键的「推送到私有/公开仓库」和 GitHub 面板的「推送到 GitHub」都会被 Host 侧拒绝（返回 423），'
          + '远端不会收到任何东西；想推时回到这里解锁即可。这个开关默认不锁，也不校验许可密码（免得忘了密码解不开）。'))

      const runCard = h('div', { className: 'vh-bk-card', key: 'run' },
        h('div', { className: 'vh-bk-t' }, '一键拷贝'),
        h('div', { className: 'vh-bk-note' },
          '把下面这些仓逐个镜像到上面那个目录，再各打一份 bundle（已有的走增量 push，没有的整仓 clone）。'),
        st && st.repoPaths && st.repoPaths.length
          ? h('div', { className: 'vh-bk-list' }, st.repoPaths.map(function (r, i) {
            return h('div', { className: 'vh-bk-item', key: 'p' + i },
              h('span', { className: 'vh-bk-n' }, r.name),
              h('span', { className: 'vh-bk-p', title: r.path }, r.path))
          }))
          : h('div', { className: 'vh-bk-note' }, '还没有可备份的仓库（reposRoot 下没有 *.git，页面数据里也没有项目）。'),
        h('div', { className: 'vh-row' },
          h('button', { className: 'vh-btn', disabled: busy === 'run', onClick: runCopy },
            busy === 'run' ? '拷贝中…' : '一键拷贝'),
          h('span', { className: 'vh-sp' }),
          last && last.at
            ? h('span', { className: 'vh-bk-note', style: { margin: 0 } },
              '上次：' + last.at.replace('T', ' ').slice(0, 19)
              + (typeof last.okCount === 'number' ? ' · ' + last.okCount + '/' + last.count + ' 成功' : '')
              + (last.ms ? ' · ' + Math.round(last.ms / 100) / 10 + ' s' : ''))
            : null),
        last && last.repos && last.repos.length
          ? h('div', { className: 'vh-bk-list' }, last.repos.map(function (r, i) {
            const verified = r.verified === true
            const restore = r.bundleFile
              ? 'git clone "' + String(r.bundleFile).replace(/\\/g, '/') + '" <目标目录>\\' + r.name
              : ''
            return h('div', { className: 'vh-bk-item', key: 'r' + i, style: { flexWrap: 'wrap' } },
              h('span', { className: 'vh-bk-n' }, r.name),
              h('span', {
                className: 'vh-risk ' + (verified ? 'ok' : 'warn'),
                title: verified ? 'fsck + bundle verify 都通过' : '这次没通过校验，展开日志看原因',
                style: { padding: '0 6px' },
              }, h('span', { className: 'vh-dot' }), verified ? '已验证' : '未验证'),
              h('span', { className: 'vh-bk-p' },
                (r.head || '') + (r.bundleBytes ? ' · bundle ' + Math.round(r.bundleBytes / 1024) + ' KB' : '')),
              restore
                ? h('button', {
                  className: 'vh-btn',
                  style: { height: '20px', fontSize: '11px' },
                  title: '复制恢复命令：' + restore,
                  onClick: function () {
                    try { navigator.clipboard.writeText(restore) } catch (e) { /* 没权限就算了 */ }
                    setMsg('已复制恢复命令（' + r.name + '）')
                  },
                }, '复制恢复命令')
                : null)
          }))
          : null)

      return h('div', { className: 'vh-dtab' },
        h('style', null, CSS),
        h('div', { className: 'vh-dhead' },
          h('span', { className: 'vh-title', style: { fontSize: '15px' } }, '备份设置'),
          st ? h('span', { className: 'vh-bdg ' + (hasPw ? 'ok' : '') }, hasPw ? '需要许可密码' : '无密码') : null,
          h('span', { className: 'vh-sp' })),
        h('div', { className: 'vh-dbody' },
          setupCard,
          pwRow,
          mirrorRow,
          autoCard,
          protectCard,
          runCard,
          msg ? h('div', { className: 'vh-msg ok' }, msg) : null,
          bad ? h('div', { className: 'vh-msg bad' }, bad) : null,
          h('div', { className: 'vh-bk-note' },
            '提示：镜像里的 *.git 可以直接拿来 clone；bundle 是单文件备份，用 `git clone <bundle>` 恢复。'
            + '每天 21:00 的计划任务仍然独立跑（backup.ps1），这个按钮只是手动补一次。')))
    }

    // 「关于 / 诊断」：版本、加载路径、路由清单、关键文件时间。
    // 面板全 404 / 数据过期时先看这里，不用再去翻宿主日志。
    function AboutPanel() {
      const [d, setD] = React.useState(null)
      const [err, setErr] = React.useState('')
      const [busy, setBusy] = React.useState(false)

      function load() {
        setBusy(true)
        setErr('')
        fetch(API + '/diag.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (x) { setD(x) })
          .catch(function (e) { setErr(String((e && e.message) || e)) })
          .then(function () { setBusy(false) })
      }
      React.useEffect(load, [])

      function fmtTime(s) {
        if (!s) return ''
        const t = Date.parse(s)
        if (!isFinite(t)) return s
        const d = new Date(t)
        const p = function (n) { return (n < 10 ? '0' : '') + n }
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
      }
      function fmtSize(b) {
        if (typeof b !== 'number') return ''
        if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB'
        if (b >= 1024) return Math.round(b / 1024) + ' KB'
        return b + ' B'
      }

      const files = (d && d.files) || []
      const routes = (d && d.routes) || []
      return h('div', { className: 'vh-dtab' },
        h('style', null, CSS),
        h('div', { className: 'vh-dhead' },
          h('span', { className: 'vh-title', style: { fontSize: '15px' } }, '关于 / 诊断'),
          d && d.plugin && d.plugin.version ? h('span', { className: 'vh-bdg ok' }, 'v' + d.plugin.version) : null,
          h('span', { className: 'vh-sp' }),
          h('button', { className: 'vh-btn', onClick: load, disabled: busy }, busy ? '读取中…' : '重新检查')),
        h('div', { className: 'vh-dbody' },
          err ? h('div', { className: 'vh-err' }, '读取失败：' + err) : null,
          d
            ? h('div', { className: 'vh-bk-card' },
              h('div', { className: 'vh-bk-t' }, '插件'),
              h('div', { className: 'vh-bk-note' }, '版本 ' + (d.plugin.version || '(未知)') + ' · ' + (d.plugin.name || '')),
              h('div', { className: 'vh-bk-note', style: { wordBreak: 'break-all' } }, '加载路径 ' + (d.root || '')),
              h('div', { className: 'vh-bk-note' }, 'Node ' + d.node + ' · pid ' + d.pid + ' · 已运行 ' + d.uptimeSec + ' s'))
            : null,
          d
            ? h('div', { className: 'vh-bk-card' },
              h('div', { className: 'vh-bk-t' }, '数据文件'),
              h('div', { className: 'vh-bk-list' }, files.map(function (f, i) {
                return h('div', { className: 'vh-bk-item', key: 'f' + i },
                  h('span', { className: 'vh-risk ' + (f.exists ? 'ok' : 'bad'), style: { padding: '0 6px' } },
                    h('span', { className: 'vh-dot' }), f.exists ? '在' : '缺失'),
                  h('span', { className: 'vh-bk-n' }, f.path.split(/[\\/]/).pop()),
                  h('span', { className: 'vh-bk-p', title: f.path },
                    f.exists ? (fmtSize(f.bytes) + ' · ' + fmtTime(f.mtime)) : f.path))
              })))
            : null,
          d
            ? h('div', { className: 'vh-bk-card' },
              h('div', { className: 'vh-bk-t' }, '路由'),
              h('div', { className: 'vh-bk-list' }, routes.map(function (r, i) {
                return h('div', { className: 'vh-bk-item', key: 'r' + i },
                  h('span', { className: 'vh-bk-n', style: { minWidth: '44px' } }, r.method),
                  h('span', { className: 'vh-bk-p' }, r.path + '  ·  ' + r.note))
              })))
            : null,
          h('div', { className: 'vh-bk-note' },
            '排查顺序：这里「缺失」→ 跑一次对应的脚本；版本不对 → 重装 / 重载插件；全 404 → 看 DSH 是否换端口（宿主 URL 变了要刷新页面）。')))
    }

    let backupTabDone = false
    function ensureBackupTab(ctx) {
      const sb = ctx && typeof ctx.get === 'function' ? ctx.get('betterSidebar') : null
      if (!sb || typeof sb.registerTab !== 'function') return null
      if (!backupTabDone) {
        try {
          // hidden：默认不出现在右侧栏标签列表里，只为「备份」子视图与预览脚本保留一个可渲染入口
          sb.registerTab({
            id: 'version-history:backup',
            title: () => '备份',
            description: () => '镜像目录与一键拷贝（可加许可密码）',
            icon: (size) => Icon({ size: size }),
            order: 63,
            single: true,
            hidden: true,
            component: BackupPanel,
          })
          backupTabDone = true
        } catch (err) {
          backupTabDone = false
          if (typeof console !== 'undefined') console.error('[dsh-version-history] registerTab(backup) failed:', err)
        }
      }
      return sb
    }

    function Icon(props) {      const size = (props && props.size) || 20
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true, style: { display: 'block' },
      },
        h('circle', { cx: 6, cy: 5, r: 2.2 }),
        h('circle', { cx: 6, cy: 19, r: 2.2 }),
        h('circle', { cx: 18, cy: 9, r: 2.2 }),
        h('path', { d: 'M6 7.2v9.6' }),
        h('path', { d: 'M18 11.2c0 3.4-3 4.2-6 4.6' }),
      )
    }

    function Stat(label, value) {
      return h('div', { className: 'vh-stat', key: 's:' + label },
        h('div', { className: 'k' }, label),
        h('div', { className: 'v' }, value))
    }

    function Overview(repo, data) {
      const badges = []
      badges.push(h('span', { className: 'vh-bdg', key: 'b0' }, repo.branch || 'main'))
      if (repo.versions && repo.versions.length) {
        badges.push(h('span', { className: 'vh-bdg tag', key: 'b1' }, repo.versions[repo.versions.length - 1].tag))
      }
      badges.push(repo.dirty
        ? h('span', { className: 'vh-bdg warn', key: 'b2' }, '未提交 ' + repo.dirty)
        : h('span', { className: 'vh-bdg ok', key: 'b2' }, '干净'))
      if (data && repo.path === data.primary) {
        badges.push(h('span', { className: 'vh-bdg ' + (data.mirror && data.mirror.synced ? 'ok' : 'warn'), key: 'b3' },
          'I 盘' + (data.mirror && data.mirror.synced ? '已同步' : '未同步')))
      }

      const cmts = (repo.commits || []).slice(0, 8).map((c, i) =>
        h('li', { key: 'c' + i },
          h('span', { className: 'h' }, c.h),
          h('span', {}, c.subject),
          h('span', { style: { marginLeft: 'auto', color: 'var(--dsw-alias-label-secondary)' } }, day(c.iso))))

      const files = (repo.fileList || []).map((f, i) =>
        h('tr', { key: 'f' + i },
          h('td', { className: 'vh-mono' }, f.p),
          h('td', { className: 'num', style: { color: 'var(--dsw-alias-label-secondary)' } }, f.when || '—')))

      return h('div', null,
        h('h2', { className: 'vh-h2' }, repo.name),
        h('div', { className: 'vh-path' }, repo.path),
        h('div', { className: 'vh-badges' }, badges),
        h('div', { className: 'vh-stats' },
          Stat('提交', num(repo.count)),
          Stat('受跟踪文件', num(repo.files)),
          Stat('版本标签', num((repo.versions || []).length)),
          Stat('.git 大小', repo.size || '—'),
          Stat('未提交', num(repo.dirty))),
        h('div', { className: 'vh-sec' }, '最近提交'),
        h('ul', { className: 'vh-cmts' }, cmts),
        h('div', { className: 'vh-sec' }, '受跟踪文件（' + num(repo.fileListTotal) + '）'),
        h('div', { className: 'vh-files' },
          h('table', { className: 'vh-table' },
            h('thead', null, h('tr', null, h('th', null, '文件'), h('th', { className: 'num' }, '最后改动'))),
            h('tbody', null, files))),
        (repo.fileListTotal > (repo.fileList || []).length)
          ? h('div', { className: 'vh-note' }, '只显示前 ' + (repo.fileList || []).length + ' 个文件（共 ' + num(repo.fileListTotal) + ' 个）。')
          : null)
    }

    function VersionDetail(repo, v, pending, onPick, picked) {
      const badges = [
        h('span', { className: 'vh-bdg vh-mono', key: 'b0' }, v.hash),
        h('span', { className: 'vh-bdg', key: 'b1' }, day(v.date) + (clock(v.date) ? ' ' + clock(v.date) : '')),
        h('span', { className: 'vh-bdg', key: 'b2' }, num((v.files || []).length) + ' 个文件'),
        h('span', { className: 'vh-bdg', key: 'b3' },
          h('span', { className: 'vh-add' }, '+' + num(v.adds)), ' ',
          h('span', { className: 'vh-del' }, '-' + num(v.dels))),
        h('span', { className: 'vh-bdg', key: 'b4' }, num((v.commits || []).length) + ' 个提交'),
        pending ? h('span', { className: 'vh-bdg warn', key: 'b5' }, '未打标签') : h('span', { className: 'vh-bdg tag', key: 'b5' }, '已发布'),
      ]

      const rows = (v.files || []).slice().sort((a, b) => (b.a + b.d) - (a.a + a.d)).map((f, i) =>
        h('tr', { key: 'f' + i, className: 'vh-frow' + (picked === f.p ? ' on' : ''), onClick: function () { if (onPick) onPick(f, v) }, title: '点这一行看这个文件相对上一版的改动' },
          h('td', { className: 'vh-mono' }, f.p),
          h('td', { className: 'num vh-add' }, f.bin ? 'bin' : '+' + num(f.a)),
          h('td', { className: 'num vh-del' }, f.bin ? '' : '-' + num(f.d))))

      const cmts = (v.commits || []).slice().reverse().map((c, i) =>
        h('li', { key: 'c' + i }, h('span', { className: 'h' }, c.h), h('span', {}, c.subject)))

      return h('div', null,
        h('h2', { className: 'vh-h2' }, v.tag + (pending ? '（未发布）' : '')),
        h('div', { className: 'vh-path' }, repo.path),
        h('div', { className: 'vh-badges' }, badges),
        v.message ? h('div', { className: 'vh-note', style: { margin: '0 0 10px' } }, v.message) : null,
        h('div', { className: 'vh-sec' }, '相对上一版的文件变化'),
        (v.files || []).length
          ? h('div', { className: 'vh-files' },
            h('table', { className: 'vh-table' },
              h('thead', null, h('tr', null, h('th', null, '文件'), h('th', { className: 'num' }, '+'), h('th', { className: 'num' }, '−'))),
              h('tbody', null, rows)))
          : h('div', { className: 'vh-note' }, '这一版没有文件变化。'),
        h('div', { className: 'vh-sec' }, '这一版包含的提交'),
        h('ul', { className: 'vh-cmts' }, cmts),
        h('div', { className: 'vh-note' },
          pending
            ? '发布：git tag -a v0.2.0 -m "说明" && git push && git push origin --tags'
            : '对比区间：' + String(v.base || '').slice(0, 7) + '..' + v.hash))
    }

    // 仓库来源判定：http(s):// / git:// / ssh:// 或 UNC（\\host\share）算局域网，其余算本地目录。
    function isLanRepo(p) {
      const s = String(p || '')
      return /^(https?|git|ssh):\/\//i.test(s) || /^\\\\/.test(s)
    }

    function Panel() {
      const [data, setData] = React.useState(null)
      const [err, setErr] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [sel, setSel] = React.useState({ r: 0, kind: 'overview', i: 0 })
      const [q, setQ] = React.useState('')
      const [flash, setFlash] = React.useState('')
      const [newPath, setNewPath] = React.useState('')
      const [notice, setNotice] = React.useState({ text: '', bad: false })
      const [lan, setLan] = React.useState(null)
      const [gh, setGh] = React.useState(null)
      // 主面板内的子视图：'main' | 'github' | 'lan' | 'disks'。
      // 侧边栏 tab 只是「顺手」打开；开不出来也必须在这里有反应。
      const [view, setView] = React.useState('main')
      // 仓库行右键菜单：{ x, y, idx, repo } | null
      const [menu, setMenu] = React.useState(null)
      // 推送前确认框：{ repo, visibility, warns } | null
      const [confirmPush, setConfirmPush] = React.useState(null)
      // 批量推送：picked 记选中仓库的路径，batch 记本次进度
      const [picked, setPicked] = React.useState({})
      const [batch, setBatch] = React.useState(null)
      const [publishing, setPublishing] = React.useState('')
      // 磁盘告警：{ text } | null —— 与上次记录比，风险变差就提示一次
      const [diskAlert, setDiskAlert] = React.useState(null)
      // 版本对比：{ ri, a, b, res, err, busy }
      const [cmp, setCmp] = React.useState({ ri: 0, a: '', b: '', res: null, err: '', busy: false })
      // 对比/详情的分栏宽度（可拖；diff 可开独立窗口）
      const [splitPct, setSplitPct] = React.useState(function () {
        try { const v = Number(window.localStorage.getItem('dsh-vh-split')); if (v >= 0.2 && v <= 0.8) return v } catch (e) {}
        return 0.45
      })

      function dragSplit(ev) {
        ev.preventDefault()
        const box = ev.currentTarget.parentNode
        if (!box || !box.getBoundingClientRect) return
        const rect = box.getBoundingClientRect()
        const move = function (e) {
          const pct = Math.min(0.8, Math.max(0.2, (e.clientX - rect.left) / rect.width))
          setSplitPct(pct)
          try { window.localStorage.setItem('dsh-vh-split', String(pct)) } catch (err) {}
        }
        const up = function () {
          document.removeEventListener('mousemove', move)
          document.removeEventListener('mouseup', up)
        }
        document.addEventListener('mousemove', move)
        document.addEventListener('mouseup', up)
      }

      // 把 patch 渲染成一个独立窗口（自己写一份最小 HTML，颜色跟面板一致）
      function openDiffWin(title, text) {
        let w = null
        try { w = window.open('', 'vh-diff', 'width=1100,height=820,noopener') } catch (e) { w = null }
        if (!w) { setDiskAlert({ text: '浏览器拦住了弹窗：允许本页弹窗后再点一次「独立窗口」' }); return }
        const esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
        const body = String(text || '').split('\n').map(function (ln) {
          let cls = 'ctx'
          if (ln.indexOf('+++') === 0 || ln.indexOf('---') === 0) cls = 'meta'
          else if (ln.indexOf('@@') === 0) cls = 'hunk'
          else if (ln.charAt(0) === '+') cls = 'add'
          else if (ln.charAt(0) === '-') cls = 'del'
          return '<div class="l ' + cls + '">' + (esc(ln) || ' ') + '</div>'
        }).join('')
        const css = 'html,body{margin:0;background:#15171c;color:#d7dae0;font:12px/1.55 Consolas,"Cascadia Mono",monospace}'
          + '.hd{position:sticky;top:0;padding:8px 12px;background:#1b1e25;border-bottom:1px solid #2b2f39;font-family:system-ui,sans-serif;color:#a9b0bd}'
          + '.l{padding:0 12px;white-space:pre}'
          + '.l.add{background:rgba(63,185,80,.18);color:#7ee787}'
          + '.l.del{background:rgba(248,81,73,.18);color:#ffa198}'
          + '.l.hunk{color:#79b8ff;border-top:1px solid #2b2f39}'
          + '.l.meta{color:#8b949e}'
        w.document.open()
        w.document.write('<!doctype html><meta charset="utf-8"><title>' + esc(title) + '</title><style>' + css + '</style><div class="hd">' + esc(title) + '</div>' + body)
        w.document.close()
      }

      // 左内容 + 右侧粘住的 diff 栏（宽度可拖；diff 可开独立窗口）
      function splitPane(leftNode, rightNode, rightTitle, patchText) {
        return h('div', {
          className: 'vh-cmp-split',
          style: { gridTemplateColumns: 'minmax(0,' + (splitPct * 100).toFixed(1) + 'fr) 6px minmax(0,' + ((1 - splitPct) * 100).toFixed(1) + 'fr)' },
        },
          h('div', { className: 'vh-cmp-left' }, leftNode),
          h('div', { className: 'vh-split-bar', onMouseDown: dragSplit, title: '拖动调整左右宽度' }),
          h('div', { className: 'vh-cmp-right' },
            h('div', { className: 'vh-k vh-diff-h' },
              h('span', null, rightTitle),
              h('button', {
                className: 'vh-btn vh-mini',
                disabled: !patchText,
                title: '在独立窗口里看这份 diff（可自由放大/滚动）',
                onClick: function () { if (patchText) openDiffWin(rightTitle, patchText) },
              }, '独立窗口')),
            rightNode))
      }
      // 语言：zh（默认）| en。改完立刻生效（LANG 是模块级变量，h() 每次创建元素时读它）。
      const [lang, setLang] = React.useState(LANG)

      function changeLang(v) {
        const next = v === 'en' ? 'en' : 'zh'
        LANG = next
        setLang(next)
        try {
          if (window.localStorage) window.localStorage.setItem(LANG_KEY, next)
        } catch (e) {}
      }

      function openView(name) {
        // 只切主面板内的子视图。**不要**顺手 layout.openRightbar()：
        // 右侧栏那一列是 dsh-better-sidebar 的轨道，内容由它的 tab 渲染；
        // 若那一列被强制打开而 tab 还没被选中/渲染，就会露出一条空的黑边
        // （用户 2026-11-23 实测「点 GitHub 管理会出右侧黑边」）。
        setView(name)
      }

      function loadGh() {
        return fetch(API + '/github.json', { cache: 'no-store' })
          .then(function (st) { setGh(st && !st.error ? st : null) })
          .catch(function () { setGh(null) })
      }

      function loadLan() {
        return fetch(API + '/lan.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (st) { setLan(st && !st.error ? st : { running: false, repos: [], urls: [] }) })
          .catch(function () { setLan({ running: false, repos: [], urls: [] }) })
      }

      function loadData() {
        return fetch(API + '/data.json', { cache: 'no-store' })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status)
            return r.json()
          })
          .then(function (d) {
            if (d && d.error) throw new Error(d.error + (d.detail ? ': ' + d.detail : ''))
            setData(d)
            setErr('')
            checkDiskAlert(d)
          })
          .catch(function (e) { setErr(String((e && e.message) || e)) })
      }

      // ④ 磁盘告警：把每块盘的 risk.level 与上次存的比较，变差就提示一次（有通知权限就同时发一条系统通知）
      function checkDiskAlert(d) {
        try {
          const disks = (d && d.disks) || []
          if (!disks.length) return
          const rank = { ok: 0, warn: 1, bad: 2 }
          let prev = {}
          try { prev = JSON.parse(window.localStorage.getItem(KEY_RISK) || '{}') || {} } catch (e) { prev = {} }
          const worse = []
          const now = {}
          disks.forEach(function (x) {
            const lv = (x.risk && x.risk.level) || 'ok'
            now[String(x.index)] = lv
            const before = prev[String(x.index)]
            if (before && (rank[lv] || 0) > (rank[before] || 0)) {
              worse.push('#' + x.index + ' ' + x.model + '：' + (before === 'ok' ? '稳定' : '注意') + ' → ' + (lv === 'bad' ? '风险' : '注意'))
            }
          })
          window.localStorage.setItem(KEY_RISK, JSON.stringify(now))
          if (!worse.length) return
          const text = '磁盘风险上升：' + worse.join('；')
          setDiskAlert({ text: text })
          try {
            if (window.Notification && window.Notification.permission === 'granted') {
              new window.Notification('GIT管理 · 磁盘告警', { body: text })
            }
          } catch (e) { /* 通知不可用就算了，面板上已经有横幅 */ }
        } catch (e) { /* 告警失败不影响主流程 */ }
      }

      React.useEffect(function () {
        let alive = true
        setBusy(true)
        loadData().then(function () { if (alive) setBusy(false) })
        loadLan()
        loadGh()
        const timer = setInterval(function () { loadLan() }, 15000)
        return function () { alive = false; clearInterval(timer) }
      }, [])

      function regenerate() {
        if (busy) return
        setBusy(true)
        setFlash('')
        fetch(API + '/refresh', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (res) {
            return loadData().then(function () {
              setFlash(res && res.ok ? '已刷新 · ' + (res.ms || 0) + ' ms' : '刷新失败，见数据文件时间')
            })
          })
          .catch(function (e) { setErr(String((e && e.message) || e)) })
          .then(function () { setBusy(false) })
      }

      // 加仓：写 repos.json → 重跑脚本 → 重取数据
      function addRepo() {
        const p = newPath.trim()
        if (!p || busy) return
        setBusy(true)
        setNotice({ text: '', bad: false })
        fetch(API + '/repos/add?path=' + encodeURIComponent(p), { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (res) {
            if (res && res.error) {
              setNotice({ text: '加不进去：' + res.error, bad: true })
              return null
            }
            setNewPath('')
            return fetch(API + '/refresh', { cache: 'no-store' })
              .then(function (r) { return r.json() })
              .then(function (run) {
                setNotice({
                  text: (run && run.ok ? '已加入并刷新 · ' + (run.ms || 0) + ' ms' : '已加入清单，但重跑脚本失败（下次备份会补上）'),
                  bad: !(run && run.ok),
                })
                return loadData()
              })
          })
          .catch(function (e) { setNotice({ text: '错误：' + ((e && e.message) || e), bad: true }) })
          .then(function () { setBusy(false) })
      }

      function removeRepo(target) {
        if (!target || busy) return
        setBusy(true)
        setNotice({ text: '', bad: false })
        fetch(API + '/repos/remove?path=' + encodeURIComponent(target), { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (res) {
            if (res && res.error) {
              setNotice({ text: '移除失败：' + res.error, bad: true })
              return null
            }
            return fetch(API + '/refresh', { cache: 'no-store' })
              .then(function (r) { return r.json() })
              .then(function (run) {
                setNotice({ text: (run && run.ok ? '已移除并刷新' : '已从清单移除，重跑脚本失败'), bad: !(run && run.ok) })
                setSel({ r: 0, kind: 'overview', i: 0 })
                return loadData()
              })
          })
          .catch(function (e) { setNotice({ text: '错误：' + ((e && e.message) || e), bad: true }) })
          .then(function () { setBusy(false) })
      }

      // ── 仓库行右键菜单：手动决定推私有仓库还是公开仓库 ──────────────────────
      // 菜单是自绘的（不用原生 contextmenu），位置用 clientX/clientY；点空白处关闭。
      function openMenu(ev, ri, r) {
        try {
          ev.preventDefault()
          ev.stopPropagation()
        } catch (e) {}
        setSel({ r: ri, kind: 'overview', i: 0 })
        setMenu({ x: ev.clientX || 40, y: ev.clientY || 40, idx: ri, repo: r })
      }

      function closeMenu() {
        setMenu(null)
      }

      function publishWarnings(r) {
        const warns = []
        const dirty = Number((r && r.dirty) || 0)
        if (dirty > 0) warns.push('这个仓有 ' + dirty + ' 处未提交改动（推上去的只是已提交的部分）')
        const vs = (r && r.versions) || []
        if (!vs.length) warns.push('这个仓还没有任何版本标签（远端会是「无 tag」的状态）')
        return warns
      }

      // 右键推送：有未提交改动 / 没有标签时先弹确认，确认后才真推
      function publishRepo(r, visibility) {
        if (!r || !r.path) return
        setMenu(null)
        const warns = publishWarnings(r)
        if (warns.length) {
          setConfirmPush({ repo: r, visibility: visibility, warns: warns })
          return
        }
        doPublish(r, visibility)
      }

      function doPublish(r, visibility) {
        if (!r || !r.path) return
        setConfirmPush(null)
        setMenu(null)
        setPublishing(visibility === 'public' ? '公开' : '私有')
        setNotice({ text: '正在' + (visibility === 'public' ? '公开' : '私有') + '仓库上建仓并推送（可能要十几秒）…', bad: false })
        ghPost({
          action: 'publish',
          repoPath: r.path,
          name: r.name,
          visibility: visibility,
        })
          .then(function (res) {
            const info = (res && res.publish) || null
            if (res && res.ok && info) {
              const act = info.created ? '已创建并推送' : '已推送'
              setNotice({
                text: act + '：' + info.full + '（' + (info.visibility === 'public' ? '公开' : '私有') + '）· 分支 ' + info.branch + ' · ' + (info.ms || 0) + ' ms\n' + info.url,
                bad: false,
              })
              setFlash('已推送到 ' + info.full)
              return loadData().then(loadGh)
            }
            const msg = (res && (res.err || (info && info.err))) || '未知错误'
            setNotice({ text: (res && res.locked ? '' : '推送失败：') + msg, bad: true })
          })
          .catch(function (e) { setNotice({ text: '推送失败：' + ((e && e.message) || e), bad: true }) })
          .then(function () { setPublishing('') })
      }

      const repos = (data && data.repos) || []
      const repo = repos[sel.r] || null
      const kw = q.trim().toLowerCase()
      const lanRepos = repos.filter(function (r) { return isLanRepo(r.path) })
      const localCount = repos.length - lanRepos.length
      const lanRunning = !!(lan && lan.running)
      const lanShared = (lan && lan.repos) || []
      const ghBound = !!(gh && gh.bound)
      const pickedCount = Object.keys(picked || {}).length

      function togglePick(path) {
        if (!path) return
        setPicked(function (prev) {
          const next = {}
          Object.keys(prev || {}).forEach(function (k) { if (k !== path) next[k] = prev[k] })
          if (!(prev && prev[path])) next[path] = true
          return next
        })
      }

      // 批量推送：逐仓 POST /dsh-vh/gh {action:'push'}；推送锁在 Host 侧生效，锁住就整批停下
      function runBatch() {
        const list = repos.filter(function (r) { return picked && picked[r.path] })
        if (!list.length) return
        const items = list.map(function (r) { return { name: r.name, path: r.path, state: 'wait', msg: '' } })
        setBatch({ running: true, items: items, done: false, note: '' })
        let i = 0
        const step = function () {
          if (i >= items.length) {
            const ok = items.filter(function (x) { return x.state === 'ok' }).length
            setBatch({ running: false, items: items.slice(), done: true, note: ok + '/' + items.length + ' 成功' })
            loadData().then(loadGh)
            return
          }
          const it = items[i]
          it.state = 'run'
          setBatch({ running: true, items: items.slice(), done: false, note: '' })
          ghPost({ action: 'push', repoPath: it.path })
            .then(function (res) {
              if (res && res.ok) {
                it.state = 'ok'
                it.msg = ((res.push && res.push.branch) ? res.push.branch + ' · ' : '') + ((res.push && res.push.ms) || 0) + ' ms'
              } else if (res && res.locked) {
                it.state = 'bad'
                it.msg = '推送锁'
                for (let k = i + 1; k < items.length; k += 1) { items[k].state = 'bad'; items[k].msg = '已跳过（推送锁）' }
                setBatch({ running: false, items: items.slice(), done: true, note: res.err || '推送已被锁关闭' })
                i = items.length
                return
              } else {
                it.state = 'bad'
                it.msg = (res && res.err) || '失败'
              }
              i += 1
              setBatch({ running: true, items: items.slice(), done: false, note: '' })
              if (typeof setTimeout === 'function') setTimeout(step, 0); else step()
            })
            .catch(function (e) {
              it.state = 'bad'
              it.msg = (e && e.message) || '异常'
              i += 1
              setBatch({ running: true, items: items.slice(), done: false, note: '' })
              if (typeof setTimeout === 'function') setTimeout(step, 0); else step()
            })
        }
        step()
      }

      // GitHub 徽章：数据来自 Host 侧 /data.json 的 repo.github（自动探测 origin + ls-remote，带 3 分钟缓存）
      function ghBadge(r) {
        const g = r && r.github
        if (!g || !g.state) return null
        const label = {
          synced: ['gh ok', 'GitHub 已同步'],
          ahead: ['gh up', 'GitHub 领先 ' + (g.ahead || 0)],
          behind: ['gh dn', 'GitHub 落后 ' + (g.behind || 0)],
          diverged: ['gh warn', 'GitHub 分叉'],
          unpublished: ['gh warn', 'GitHub 未推送'],
        }[g.state] || ['gh', 'GitHub ?']
        const tip = [
          (g.owner ? g.owner + '/' + g.repo : g.remote || '') + (g.branch ? ' · ' + g.branch : ''),
          g.localHead ? '本地 ' + g.localHead : '',
          g.remoteHead ? '远端 ' + g.remoteHead : '',
          g.checkedAt ? '检查于 ' + String(g.checkedAt).replace('T', ' ').slice(0, 19) : '',
        ].filter(Boolean).join('\n')
        return h('span', { className: 'vh-tag ' + label[0], title: tip }, label[1])
      }

      const treeItems = []
      repos.forEach(function (r, ri) {
        const versions = (r.versions || []).slice().reverse()
        const hit = !kw || r.name.toLowerCase().indexOf(kw) >= 0 ||
          versions.some(function (v) { return ((v.tag || '') + ' ' + (v.message || '')).toLowerCase().indexOf(kw) >= 0 })
        if (!hit) return
        treeItems.push(h('div', { className: 'vh-grp' + (ri === sel.r ? ' on' : ''), key: 'g' + ri },
          h('div', {
            className: 'vh-grp-h',
            onClick: function () { setSel({ r: ri, kind: 'overview', i: 0 }) },
            onContextMenu: function (ev) { openMenu(ev, ri, r) },
            title: '左键看概览 · 右键可推送私有 / 公开仓库',
          },
            h('span', {
              className: 'vh-pick' + (picked && picked[r.path] ? ' on' : ''),
              title: '选中后可批量推送（不会自动推）',
              onClick: function (ev) { ev.stopPropagation(); togglePick(r.path) },
            }),
            h('span', { className: 'vh-grp-t' },
              h('span', { className: 'vh-name', title: r.name }, r.name)),
            h('span', { className: 'vh-meta' }, r.count + ' 提交 · ' + (r.versions || []).length + ' 版'),
            h('span', {
              className: 'vh-x',
              title: '从清单移除（不删仓库本身）',
              onClick: function (ev) { ev.stopPropagation(); removeRepo(r.path) },
            }, '✕'))),
          h('div', { className: 'vh-grp-tags' },
            isLanRepo(r.path)
              ? h('span', { className: 'vh-tag lan', title: '局域网共享仓库' }, '局域网')
              : h('span', { className: 'vh-tag loc', title: '本机目录' }, '本地'),
            ghBadge(r)),
          h('div', { className: 'vh-repo-path', title: r.path }, r.path))
        if (ri === sel.r) {
          versions.forEach(function (v, vi) {
            const idx = r.versions.length - 1 - vi
            const on = sel.kind === 'version' && sel.i === idx
            treeItems.push(h('div', {
              className: 'vh-v' + (on ? ' on' : ''),
              key: 'v' + ri + '-' + idx,
              onClick: function () { setSel({ r: ri, kind: 'version', i: idx }) },
            },
              h('span', { className: 't' }, v.tag),
              h('span', { className: 'd' }, day(v.date))))
          })
          if (r.pending) {
            treeItems.push(h('div', {
              className: 'vh-v' + (sel.kind === 'pending' ? ' on' : ''),
              key: 'p' + ri,
              onClick: function () { setSel({ r: ri, kind: 'pending', i: 0 }) },
            },
              h('span', { className: 't', style: { color: 'var(--dsw-alias-state-warn-primary)' } }, '未发布'),
              h('span', { className: 'd' }, ((r.pending.commits || []).length) + ' 提交')))
          }
        }
      })

      let pane = h('div', { className: 'vh-note' }, busy && !data ? '正在读取 data.json…' : '没有可显示的项目')
      if (repo) {
        if (sel.kind === 'version' && repo.versions && repo.versions[sel.i]) {
      // 版本详情 + 行级改动：点文件表任意一行，右边/下面出这个文件相对上一版的彩色 patch
      function VersionDetailView(props) {
        const repo = props.repo
        const v = props.v
        const pending = props.pending
        const [pf, setPf] = React.useState({ file: '', patch: null, err: '', busy: false })
        function pick(f) {
          if (!f) return
          const base = (v && v.base) || ''
          const tip = pending ? (v && v.hash) || 'HEAD' : (v && v.tag) || ''
          setPf({ file: f.p, patch: null, err: '', busy: true })
          fetch(API + '/filediff?repo=' + encodeURIComponent(repo.path) + '&a=' + encodeURIComponent(base) + '&b=' + encodeURIComponent(tip) + '&file=' + encodeURIComponent(f.p), { cache: 'no-store' })
            .then(function (r) { return r.json() })
            .then(function (res) {
              if (res && res.ok) setPf({ file: f.p, patch: res.patch || '', err: '', busy: false })
              else setPf({ file: f.p, patch: null, err: (res && res.err) || '读不到这个文件的 diff', busy: false })
            })
            .catch(function (e) { setPf({ file: f.p, patch: null, err: String((e && e.message) || e), busy: false }) })
        }
        const rightBody = pf.file
          ? (pf.busy ? h('div', { className: 'vh-hint' }, '正在读取这个文件的 diff…')
            : (pf.err ? h('div', { className: 'vh-err' }, pf.err)
              : (pf.patch ? renderPatch(pf.patch) : h('div', { className: 'vh-hint' }, '这个版本里该文件没有文本改动。'))))
          : h('div', { className: 'vh-hint' }, '点左边文件表任意一行看行级改动；右栏独立滚动。')
        return splitPane(VersionDetail(repo, v, pending, pick, pf.file), rightBody, pf.file ? ('文件改动：' + pf.file) : '文件改动', pf.patch || '')
      }

          pane = h(VersionDetailView, { repo: repo, v: repo.versions[sel.i], pending: false })
        } else if (sel.kind === 'pending' && repo.pending) {
          pane = h(VersionDetailView, { repo: repo, v: repo.pending, pending: true })
        } else {
          pane = Overview(repo, data)
        }
      }

      const head = h('div', { className: 'vh-head' },
        h('span', { className: 'vh-title' }, 'GIT管理'),
        h('span', { className: 'vh-sub' },
          (data ? data.repos.length + ' 个项目 · 生成于 ' + data.generated : '本机 git 项目')),
        flash ? h('span', { className: 'vh-sub', style: { color: 'var(--dsw-alias-state-success-primary)' } }, flash) : null,
        h('span', { className: 'vh-sp' }),
        h('select', {
          className: 'vh-lang',
          value: lang,
          title: '语言 / Language',
          onChange: function (e) { changeLang(e.target.value) },
        },
          h('option', { value: 'zh' }, '中文'),
          h('option', { value: 'en' }, 'English')),
        h('button', { className: 'vh-btn', onClick: regenerate, disabled: busy }, busy ? '刷新中…' : '重新生成'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { openView('disks') },
          title: '在右侧栏打开磁盘面板（容量 / 机械·固态属性 / 稳定性风险）',
        }, '磁盘面板'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { openView('lan') },
          title: '把 repos 目录里的裸仓库共享到局域网（clone / push）',
        }, '局域网'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { openView('github') },
          title: ghBound ? ('GitHub：已绑定 ' + gh.fullName + '（绑定 / 测连接 / 手动推送）') : 'GitHub：绑定远程仓库、测连通性、手动推送',
        }, ghBound ? 'GitHub · 已绑定' : 'GitHub'),
        h('button', {
          className: 'vh-btn',
          disabled: pickedCount === 0,
          onClick: function () { if (pickedCount) runBatch() },
          title: '把左栏勾选的仓库逐个推送到各自 origin（走同一把推送锁，不会自动推）',
        }, pickedCount ? ('批量推送 ' + pickedCount) : '批量推送'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { openView('compare') },
          title: '版本对比：选同一个仓库的两个版本，看文件级增删与提交',
        }, '对比'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { openView('backup') },
          title: '备份设置：设置镜像目录、一键拷贝（可加许可密码）',
        }, '备份'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { openView('about') },
          title: '关于 / 诊断：版本、加载路径、路由与数据文件时间（面板全 404 时先看这里）',
        }, '关于'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { window.open(API + '/report', '_blank', 'noopener') },
        }, '新标签打开'))

      // ⑥ 版本对比：同一个仓的两个版本 → 后端 /diff（git diff --numstat + git log a..b）
      function compareRun(next) {
        const st = Object.assign({}, cmp, next || {})
        const repo = repos[st.ri]
        if (!repo) return
        const a = st.a || (repo.versions[repo.versions.length - 1] || {}).tag
        const b = st.b || (repo.versions[0] || {}).tag
        if (!a || !b || a === b) { setCmp(Object.assign(st, { a: a, b: b, err: '选两个不同的版本', res: null })); return }
        setCmp(Object.assign(st, { a: a, b: b, busy: true, err: '', res: null }))
        fetch(API + '/diff?repo=' + encodeURIComponent(repo.path) + '&a=' + encodeURIComponent(a) + '&b=' + encodeURIComponent(b), { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (res) {
            if (res && res.ok) setCmp({ ri: st.ri, a: a, b: b, busy: false, err: '', res: res })
            else setCmp({ ri: st.ri, a: a, b: b, busy: false, err: (res && res.err) || '对比失败', res: null })
          })
          .catch(function (e) { setCmp({ ri: st.ri, a: a, b: b, busy: false, err: String((e && e.message) || e), res: null }) })
      }

      function openFile(f) {
        const repo = repos[cmp.ri]
        if (!repo || !f) return
        const a = cmp.a || ''
        const b = cmp.b || ''
        setCmp(Object.assign({}, cmp, { sel: f.p, patch: null, pErr: '', pBusy: true }))
        fetch(API + '/filediff?repo=' + encodeURIComponent(repo.path) + '&a=' + encodeURIComponent(a) + '&b=' + encodeURIComponent(b) + '&file=' + encodeURIComponent(f.p), { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (res) {
            if (res && res.ok) setCmp(Object.assign({}, cmp, { sel: f.p, patch: res.patch || '', pErr: '', pBusy: false }))
            else setCmp(Object.assign({}, cmp, { sel: f.p, patch: null, pErr: (res && res.err) || '读不到这个文件的 diff', pBusy: false }))
          })
          .catch(function (e) { setCmp(Object.assign({}, cmp, { sel: f.p, patch: null, pErr: String((e && e.message) || e), pBusy: false })) })
      }

      // 把 unified patch 拆成行，标出新增/删除/hunk/上下文，按颜色渲染
      function renderPatch(patch) {
        const lines = String(patch || '').split('\n')
        const tr = {
          add: { background: 'rgba(63,185,80,.16)', color: 'var(--dsw-alias-state-success-primary)' },
          del: { background: 'rgba(248,81,73,.16)', color: 'var(--dsw-alias-state-error-primary)' },
          hunk: { color: 'var(--dsw-alias-brand-primary)' },
          meta: { color: 'var(--dsw-alias-label-secondary)' },
          ctx: {},
        }
        return h('pre', { className: 'vh-patch', style: { margin: '6px 0 0', padding: '6px 0', background: 'var(--dsw-alias-bg-base)', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: '6px', maxHeight: '360px', overflow: 'auto', fontFamily: 'Consolas,monospace', fontSize: '11.5px', lineHeight: '1.5' } }, lines.map(function (ln, i) {
          let cls = 'ctx'
          if (ln.indexOf('+++') === 0 || ln.indexOf('---') === 0) cls = 'meta'
          else if (ln.indexOf('@@') === 0) cls = 'hunk'
          else if (ln.charAt(0) === '+') cls = 'add'
          else if (ln.charAt(0) === '-') cls = 'del'
          return h('div', { className: 'l ' + cls, key: 'p' + i, style: Object.assign({ padding: '0 8px', whiteSpace: 'pre' }, tr[cls]) }, ln || ' ')
        }))
      }

      function renderCompare() {
        const repo = repos[cmp.ri] || repos[0]
        const vers = (repo && repo.versions) || []
        const tagAt = function (i) { return (vers[i] || {}).tag || '' }
        const res = cmp.res
        return h('div', { className: 'vh-cmp' },
          h('div', { className: 'vh-cmp-bar' },
            h('span', { className: 'vh-k' }, '仓库'),
            h('select', {
              className: 'vh-inp',
              value: String(cmp.ri),
              onChange: function (e) { const ri = Number(e.target.value) || 0; const r2 = repos[ri]; setCmp({ ri: ri, a: (r2 && r2.versions[r2.versions.length - 1] || {}).tag || '', b: (r2 && r2.versions[0] || {}).tag || '', busy: false, err: '', res: null }) },
            }, repos.map(function (r, ri) { return h('option', { key: 'r' + ri, value: String(ri) }, r.name) })),
            h('span', { className: 'vh-k' }, '从'),
            h('select', {
              className: 'vh-inp',
              value: cmp.a || tagAt(vers.length - 1),
              onChange: function (e) { setCmp(Object.assign({}, cmp, { a: e.target.value, res: null, err: '' })) },
            }, vers.map(function (v, vi) { return h('option', { key: 'a' + vi, value: v.tag }, v.tag + ' · ' + (v.date || '')) })),
            h('span', { className: 'vh-k' }, '到'),
            h('select', {
              className: 'vh-inp',
              value: cmp.b || tagAt(0),
              onChange: function (e) { setCmp(Object.assign({}, cmp, { b: e.target.value, res: null, err: '' })) },
            }, vers.map(function (v, vi) { return h('option', { key: 'b' + vi, value: v.tag }, v.tag + ' · ' + (v.date || '')) })),
            h('button', { className: 'vh-btn', disabled: cmp.busy, onClick: function () { compareRun({}) } }, cmp.busy ? '对比中…' : '对比')),
          cmp.err ? h('div', { className: 'vh-err' }, cmp.err) : null,
          !res ? h('div', { className: 'vh-hint' }, '选两个版本，点「对比」。结果来自 git diff --numstat 与 git log a..b，只读、不改仓库。') : splitPane(
            h('div', { className: 'vh-cmp-left' },
              h('div', { className: 'vh-cmp-sum' },
                h('b', null, res.range), ' · ',
                h('span', { className: 'add' }, '+' + res.adds), ' ', h('span', { className: 'del' }, '-' + res.dels), ' · ',
                res.filesTotal + ' 个文件 · ' + res.commitsTotal + ' 个提交'),
              h('table', { className: 'vh-files' },
                h('thead', null, h('tr', null, h('th', null, '文件'), h('th', { className: 'n' }, '+'), h('th', { className: 'n' }, '-'))),
                h('tbody', null, res.files.map(function (f, i) {
                  return h('tr', { key: 'f' + i, className: 'vh-frow' + (cmp.sel === f.p ? ' on' : ''), onClick: function () { openFile(f) }, title: '点这一行看这个文件的行级改动' }, h('td', null, f.p), h('td', { className: 'n' }, f.bin ? 'bin' : '+' + f.a), h('td', { className: 'n' }, f.bin ? '' : '-' + f.d))
                }))),
              res.commits.length
                ? h('div', { className: 'vh-cmp-c' },
                  h('div', { className: 'vh-k' }, '这段区间的提交'),
                  h('ul', null, res.commits.map(function (c, i) { return h('li', { key: 'c' + i }, h('code', null, c.h), ' ', c.subject) })))
                : null)),
            (cmp.sel
              ? (cmp.pBusy ? h('div', { className: 'vh-hint' }, '正在读取这个文件的 diff…')
                : (cmp.pErr ? h('div', { className: 'vh-err' }, cmp.pErr)
                  : (cmp.patch ? renderPatch(cmp.patch) : h('div', { className: 'vh-hint' }, '这个版本区间里该文件没有文本改动。'))))
              : h('div', { className: 'vh-hint' }, '点左边任意文件看行级改动；绿=新增、红=删除、蓝=改动块位置。')),
            cmp.sel ? ('文件改动：' + cmp.sel) : '文件改动',
            cmp.patch || '')
      }

      return h('div', { className: 'vh' },
        h('style', null, CSS),
        head,
        err ? h('div', { className: 'vh-err' }, '读取失败：' + err + '\n（先跑一次 visualize.ps1）') : null,
        Disks(data),
        h('div', { className: 'vh-body' },
          h('aside', { className: 'vh-tree' },
            h('div', { className: 'vh-src' },
              h('div', { className: 'vh-src-h' }, '仓库来源'),
              h('div', { className: 'vh-src-row' },
                h('span', { className: 'vh-dot on' }),
                h('span', { className: 'vh-k' }, '本地'),
                h('span', { className: 'vh-v2' }, localCount + ' 个仓库 · 本机目录'),
                h('span', { className: 'vh-sp' })),
              h('div', { className: 'vh-src-row' },
                h('span', { className: 'vh-dot ' + (lanRunning ? 'on' : 'off') }),
                h('span', { className: 'vh-k' }, '局域网'),
                h('span', {
                  className: 'vh-v2',
                  title: lanRunning
                    ? ('已共享 ' + lanShared.length + ' 个裸仓库，可被局域网内其他机器 clone / push；点右侧「管理」看地址')
                    : '未开启共享：点右侧「开启」起一个 8788 端口的只读+可推 Smart HTTP',
                },
                  lanRunning
                    ? ('在线 · :' + (lan.port || '') + ' · ' + lanShared.length + ' 个')
                    : ('离线（未开启' + (lanRepos.length ? ' · 清单里 ' + lanRepos.length + ' 个局域网仓库' : '') + '）')),
                h('span', { className: 'vh-sp' }),
                h('button', {
                  className: 'vh-mini',
                  onClick: function () { openView('lan') },
                  title: '打开局域网面板：启动 / 停止共享、复制 clone 地址、放行防火墙',
                }, lanRunning ? '管理' : '开启')),
              h('div', { className: 'vh-src-row' },
                h('span', { className: 'vh-dot ' + (ghBound ? 'on' : 'off') }),
                h('span', { className: 'vh-k' }, 'GitHub'),
                h('span', {
                  className: 'vh-v2',
                  title: ghBound
                    ? ('已绑定 ' + (gh && gh.fullName) + (gh && gh.hasToken ? ' · 令牌已保存（DPAPI 加密）' : ' · 还没保存令牌') + '；推送是手动按钮')
                    : '未绑定：点右侧「绑定」填 owner/repo 与访问令牌，之后可手动推送',
                },
                  ghBound
                    ? ((gh.fullName || '') + (gh && gh.hasToken ? ' · 可推送' : ' · 缺令牌'))
                    : '未绑定'),
                h('span', { className: 'vh-sp' }),
                h('button', {
                  className: 'vh-mini',
                  onClick: function () { openView('github') },
                  title: '打开 GitHub 面板：绑定仓库、测连接、手动推送',
                }, ghBound ? '管理' : '绑定'))),
            h('input', {
              className: 'vh-q',
              placeholder: '搜索项目 / 版本',
              value: q,
              onChange: function (e) { setQ(e.target.value) },
            }),
            h('div', { className: 'vh-add' },
              h('input', {
                placeholder: '加项目：仓库绝对路径',
                value: newPath,
                onChange: function (e) { setNewPath(e.target.value) },
                onKeyDown: function (e) { if (e.key === 'Enter') addRepo() },
              }),
              h('button', { className: 'vh-btn', onClick: addRepo, disabled: busy }, '加入')),
            notice.text
              ? h('div', { className: 'vh-msg' + (notice.bad ? ' bad' : '') }, notice.text)
              : null,
            treeItems),
          view === 'main'
            ? h('section', { className: 'vh-pane' }, pane)
            : h('section', { className: 'vh-pane' },
              h('div', { className: 'vh-subbar' },
                h('button', { className: 'vh-btn', onClick: function () { setView('main') } }, '← 返回'),
                h('span', { className: 'vh-title', style: { fontSize: '14px' } },
                  view === 'github' ? 'GitHub'
                    : (view === 'lan' ? '局域网 Git'
                      : (view === 'backup' ? '备份设置'
                        : (view === 'about' ? '关于 / 诊断' : (view === 'compare' ? '版本对比' : '磁盘'))))),
                h('span', { className: 'vh-sp' })),
              view === 'github' ? h(GithubPanel, null)
                : (view === 'lan' ? h(LanPanel, null)
                  : (view === 'backup' ? h(BackupPanel, null)
                    : (view === 'about' ? h(AboutPanel, null) : (view === 'compare' ? renderCompare() : h(DiskPanel, null)))))),
          // 常驻磁盘面板：宽度够时一直显示在右列（窄屏自动收起，见 CSS 媒体查询）
          h('aside', { className: 'vh-dcol' }, h(DiskPanel, { embedded: true }))),
        // 右键菜单（自绘，点空白关闭）
        menu
          ? h('div', {
            className: 'vh-menu-back',
            key: 'menu',
            onClick: closeMenu,
            onContextMenu: function (ev) { ev.preventDefault(); closeMenu() },
          },
            h('div', {
              className: 'vh-menu',
              style: { left: Math.max(8, menu.x) + 'px', top: Math.max(8, menu.y) + 'px' },
              onClick: function (ev) { ev.stopPropagation() },
            },
              h('div', { className: 'vh-menu-h', title: menu.repo && menu.repo.path }, (menu.repo && menu.repo.name) || ''),
              h('button', {
                className: 'vh-menu-i',
                onClick: function () { publishRepo(menu.repo, 'private') },
              }, h('span', { className: 'vh-menu-dot priv' }), '推送到私有仓库'),
              h('button', {
                className: 'vh-menu-i',
                onClick: function () { publishRepo(menu.repo, 'public') },
              }, h('span', { className: 'vh-menu-dot pub' }), '推送到公开仓库'),
              h('div', { className: 'vh-menu-sep' }),
              h('button', {
                className: 'vh-menu-i',
                onClick: function () {
                  const p = (menu.repo && menu.repo.path) || ''
                  closeMenu()
                  try {
                    navigator.clipboard.writeText(p)
                    setNotice({ text: '已复制路径：' + p, bad: false })
                  } catch (e) {
                    setNotice({ text: '复制失败：' + p, bad: true })
                  }
                },
              }, '复制仓库路径'),
              h('button', { className: 'vh-menu-i', onClick: closeMenu }, '取消'))) 
          : null,
        // 推送前确认框：仓库有未提交改动 / 还没有版本标签时才出现
        confirmPush
          ? h('div', {
            className: 'vh-menu-back',
            key: 'confirm',
            onClick: function () { setConfirmPush(null) },
          },
            h('div', {
              className: 'vh-confirm',
              onClick: function (ev) { ev.stopPropagation() },
            },
              h('div', { className: 'vh-confirm-h' },
                '确认推送到' + (confirmPush.visibility === 'public' ? '公开' : '私有') + '仓库？'),
              h('div', { className: 'vh-confirm-n' },
                (confirmPush.repo && confirmPush.repo.name) || '',
                ' → ',
                confirmPush.visibility === 'public' ? '公开（所有人都能看到）' : '私有（只有你能看到）'),
              h('ul', { className: 'vh-confirm-list' },
                confirmPush.warns.map(function (w, i) { return h('li', { key: i }, w) })),
              h('div', { className: 'vh-bk-note' }, '确认后会建仓（若不存在）并把当前分支与标签推上去；这几条只是提醒，不影响推送内容。'),
              h('div', { className: 'vh-row' },
                h('span', { className: 'vh-sp' }),
                h('button', { className: 'vh-btn', onClick: function () { setConfirmPush(null) } }, '取消'),
                h('button', {
                  className: 'vh-btn primary',
                  onClick: function () { doPublish(confirmPush.repo, confirmPush.visibility) },
                }, '仍然推送'))))
          : null,
        // 批量推送进度
        batch
          ? h('div', {
            className: 'vh-menu-back',
            key: 'batch',
            onClick: function () { if (!batch.running) setBatch(null) },
          },
            h('div', {
              className: 'vh-confirm',
              onClick: function (ev) { ev.stopPropagation() },
            },
              h('div', { className: 'vh-confirm-h' }, '批量推送到各自 origin'),
              h('div', { className: 'vh-confirm-n' }, batch.note || (batch.running ? '正在逐仓推送…' : '')),
              h('ul', { className: 'vh-batch' },
                batch.items.map(function (it, i) {
                  const cls = it.state === 'ok' ? 'ok' : (it.state === 'bad' ? 'bad' : (it.state === 'run' ? 'run' : ''))
                  const txt = it.state === 'ok' ? '成功' : (it.state === 'bad' ? '失败' : (it.state === 'run' ? '推送中' : '等待'))
                  return h('li', { key: 'b' + i },
                    h('span', { className: 'n', title: it.path }, it.name),
                    h('span', { className: 'st ' + cls }, txt),
                    h('span', { className: 'vh-bk-p' }, it.msg || ''))
                })),
              h('div', { className: 'vh-bk-note' }, '逐个推送到各仓自己的 origin；「禁止推送」锁打开时 Host 会直接拒绝，不会推出去。'),
              h('div', { className: 'vh-row' },
                h('span', { className: 'vh-sp' }),
                h('button', {
                  className: 'vh-btn',
                  disabled: batch.running,
                  onClick: function () { setBatch(null); setPicked({}) },
                }, batch.running ? '推送中…' : '关闭'))))
          : null)
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctxRef = ctx
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'version-history',
          order: 21,
          label: () => 'GIT管理',
        }, Icon))
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'version-history',
        }, Panel))
        // 右侧栏：better-sidebar 的标签页（磁盘 / 局域网），没有这个插件就静默跳过
        ensureDisksTab(ctx)
        ensureLanTab(ctx)
        ensureGithubTab(ctx)
        ensureBackupTab(ctx)
      },
    }
  },
})
