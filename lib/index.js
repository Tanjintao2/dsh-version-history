/**
 * dsh-version-history · Host half
 *
 * 只做三件事（都挂在 DSH 自己的 webServer 上，和 GUI 同源，面板用 fetch 取数）：
 *   GET  /version-history/data.json   读 <reports>/data.json（visualize.ps1 生成）
 *   GET  /version-history/report      把独立的离线页当普通网页发出去（浏览器里打开）
 *   GET  /version-history/refresh     重跑 visualize.ps1 刷新数据（resource 路由只放行 GET）
 *   GET  /version-history/repos       读仓库清单（visualize.ps1 的 -ReposFile）
 *   GET  /version-history/repos/add?path=…    往清单里加一个仓（校验 .git）
 *   GET  /version-history/repos/remove?path=… 从清单里移除
 *   GET  /version-history/disks.json           磁盘健康快照（没有快照时先扫一次）
 *   GET  /version-history/disks/scan           强制重扫磁盘健康（约 5–7 s）
 *
 * 任何失败都回 JSON，不抛到宿主；webServer 不存在时静默退出（面板显示错误提示即可）。
 */
import { execFile } from 'node:child_process'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLan } from './lan.js'
import { createGithub } from './github.js'
import { createBackup } from './backup.js'
import { PATH_DEFAULTS } from './paths.js'

// 可移植默认值：不写死任何个人绝对路径，全部从 ~/.dsh-version-history 派生，
// 需要用别的目录就设 DSH_VH_ROOT / DSH_VH_SCRIPTS 或直接写进插件 config。
const DEFAULTS = { ...PATH_DEFAULTS }

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

// 磁盘历史趋势：每次真扫完追加一条点（最多留 60 条），供前端画曲线
async function appendHistory(cfg, payload) {
  const point = {
    at: payload.scanned || new Date().toISOString().slice(0, 16).replace('T', ' '),
    disks: (payload.disks || []).map((d) => ({
      i: d.index,
      model: d.model,
      kind: d.kind,
      wear: (d.smart && d.smart.wearPct != null) ? d.smart.wearPct : null,
      realloc: (d.smart && d.smart.reallocatedSectors != null) ? d.smart.reallocatedSectors : null,
      temp: (d.smart && d.smart.tempC != null) ? d.smart.tempC : null,
      free: (d.volumes || []).reduce((s, v) => s + (Number(v.freeGB) || 0), 0),
      total: (d.volumes || []).reduce((s, v) => s + (Number(v.totalGB) || 0), 0),
    })),
  }
  let list = []
  try {
    const text = await readFile(cfg.historyPath, 'utf8')
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) list = parsed
    else if (parsed && Array.isArray(parsed.points)) list = parsed.points
  } catch { /* 第一次或文件坏了：从空开始 */ }
  const last = list[list.length - 1]
  if (last && last.at === point.at) list[list.length - 1] = point
  else list.push(point)
  while (list.length > 60) list.shift()
  await writeFile(cfg.historyPath, JSON.stringify({ points: list }), 'utf8')
  return point
}

async function readHistory(cfg) {
  try {
    const text = await readFile(cfg.historyPath, 'utf8')
    const parsed = JSON.parse(text)
    const points = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.points) ? parsed.points : [])
    return { file: cfg.historyPath, exists: true, points }
  } catch {
    return { file: cfg.historyPath, exists: false, points: [] }
  }
}

// 两个版本之间的差异（文件级增删 + 提交列表），给「版本对比」用
async function diffRefs(cfg, repoPath, base, tip) {
  const repo = String(repoPath || '')
  if (!repo) return { ok: false, err: '缺少 repo 参数' }
  if (!base || !tip) return { ok: false, err: '缺少 a / b 参数' }
  const exe = cfg.gitExe && String(cfg.gitExe).indexOf('.exe') > 0 ? cfg.gitExe : 'git.exe'
  const run = (args) => new Promise((resolve) => {
    execFile(exe, ['-C', repo, ...args], { windowsHide: true, timeout: 60000, maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ ok: !err, code: err ? (err.code || 1) : 0, out: String(stdout || ''), err: String(stderr || (err && err.message) || '') })
    })
  })
  const range = base + '..' + tip
  const ns = await run(['diff', '--numstat', range])
  if (!ns.ok) return { ok: false, err: 'git diff 失败（' + ns.code + '）：' + (ns.err || '').slice(0, 300) }
  const files = []
  let adds = 0
  let dels = 0
  ns.out.split('\n').forEach((line) => {
    const t = line.trim()
    if (!t) return
    const parts = t.split('\t')
    if (parts.length < 3) return
    const a = parts[0] === '-' ? 0 : Number(parts[0]) || 0
    const d = parts[1] === '-' ? 0 : Number(parts[1]) || 0
    const p = parts.slice(2).join('\t')
    adds += a
    dels += d
    files.push({ p, a, d, bin: parts[0] === '-' && parts[1] === '-' })
  })
  const lg = await run(['log', '--pretty=format:%h %s', range])
  const commits = lg.out.split('\n').filter((x) => x.trim()).map((x) => {
    const sp = x.indexOf(' ')
    return sp > 0 ? { h: x.slice(0, sp), subject: x.slice(sp + 1) } : { h: x, subject: '' }
  })
  return { ok: true, range, adds, dels, files: files.slice(0, 400), filesTotal: files.length, commits: commits.slice(0, 200), commitsTotal: commits.length }
}

function refresh(scriptPath) {
  return new Promise((resolve) => {
    const started = Date.now()
    try {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-NoOpen'],
        { windowsHide: true, timeout: 180000, maxBuffer: 8 * 1024 * 1024 },
        (error, stdout, stderr) => {
          resolve({
            ok: !error,
            code: error && typeof error.code === 'number' ? error.code : (error ? 1 : 0),
            ms: Date.now() - started,
            out: String(stdout || '').split(/\r?\n/).filter(Boolean).slice(-8),
            err: String((error && error.message) || stderr || '').slice(-1000),
          })
        },
      )
    } catch (err) {
      resolve({ ok: false, code: 1, ms: Date.now() - started, out: [], err: String(err && err.message || err) })
    }
  })
}

// 普通权限的 SMART 采集：admin 脚本不含管理员闸门，非管理员时只取 ATA SMART（SATA 盘）。
// 这样每次「扫描」都能顺手刷新 smart.json，面板不必等用户再点 SMART。
function collectSmart(scriptPath, outPath, logPath) {
  return new Promise((resolve) => {
    const started = Date.now()
    try {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Out', outPath, '-Log', logPath],
        { windowsHide: true, timeout: 90000, maxBuffer: 4 * 1024 * 1024 },
        (error, stdout, stderr) => {
          resolve({
            ok: !error,
            code: error && typeof error.code === 'number' ? error.code : (error ? 1 : 0),
            ms: Date.now() - started,
            err: String((error && error.message) || stderr || '').slice(-600),
          })
        },
      )
    } catch (err) {
      resolve({ ok: false, code: 1, ms: Date.now() - started, err: String(err && err.message || err) })
    }
  })
}

// 磁盘健康扫描：跑 disk-health.ps1（普通权限即可，SMART 缺失时脚本会自己说明原因）。
// 必须显式传 -Out：不传时脚本只把 JSON 打到 stdout、不落盘。
function scanHealth(scriptPath, outPath) {
  return new Promise((resolve) => {
    const started = Date.now()
    try {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Out', outPath],
        { windowsHide: true, timeout: 120000, maxBuffer: 4 * 1024 * 1024 },
        (error, stdout, stderr) => {
          resolve({
            ok: !error,
            code: error && typeof error.code === 'number' ? error.code : (error ? 1 : 0),
            ms: Date.now() - started,
            out: String(stdout || '').split(/\r?\n/).filter(Boolean).slice(-4),
            err: String((error && error.message) || stderr || '').slice(-1000),
          })
        },
      )
    } catch (err) {
      resolve({ ok: false, code: 1, ms: Date.now() - started, out: [], err: String(err && err.message || err) })
    }
  })
}

// SMART 快照状态：只报文件信息（mtime 用来判断提权脚本有没有跑完）。
async function smartInfo(smartPath) {
  try {
    const st = await stat(smartPath)
    const base = { file: smartPath, exists: true, bytes: st.size, mtimeMs: st.mtimeMs, mtime: new Date(st.mtimeMs).toISOString() }
    // 脚本的 trap 分支也会写一份 smart.json（带 error、没有 disks）：这里把它标出来，
    // 免得前端把「失败快照」当成「成功」。
    try {
      const payload = JSON.parse(await readFile(smartPath, 'utf8'))
      const disks = Array.isArray(payload && payload.disks) ? payload.disks.length : 0
      return {
        ...base,
        valid: !(payload && payload.error) && disks > 0,
        error: (payload && payload.error) || null,
        disks,
        generated: (payload && payload.generated) || null,
      }
    } catch (err) {
      return { ...base, valid: false, error: 'smart.json 解析失败：' + String((err && err.message) || err), disks: 0 }
    }
  } catch {
    return { file: smartPath, exists: false }
  }
}

// 提权跑 SMART：交给 smart-launch.ps1（它 Start-Process -Verb RunAs -Wait，把 UAC 结果与退出码写进 smart.state.json）。
// 这里不等它跑完 —— 前端轮询 /smart.json（快照）与 /smart.state.json（成功/失败原因），所以 UAC 取消也能看到原因。
function elevatedScan(launcherPath) {
  return new Promise((resolve) => {
    const started = Date.now()
    try {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', launcherPath],
        { windowsHide: true, timeout: 180000 },
        (error, stdout, stderr) => {
          resolve({
            ok: !error,
            requested: !error,
            ms: Date.now() - started,
            err: String((error && error.message) || stderr || '').slice(-600),
          })
        },
      )
    } catch (err) {
      resolve({ ok: false, requested: false, ms: Date.now() - started, err: String((err && err.message) || err) })
    }
  })
}

// SMART 请求状态（smart-launch.ps1 写的）：phase=requested|done|error + exitCode/error，前端据此显示失败原因。
async function smartState(statePath) {
  try {
    const raw = await readFile(statePath, 'utf8')
    const obj = JSON.parse(raw)
    return Object.assign({ exists: true, file: statePath }, obj)
  } catch {
    return { exists: false, file: statePath }
  }
}

// SMART 日志尾部（提权窗口一闪而过时，日志是唯一线索）。
async function smartLogTail(logPath, lines) {
  try {
    const raw = await readFile(logPath, 'utf8')
    const all = raw.split(/\r?\n/)
    const take = Math.max(5, Math.min(Number(lines) || 30, 200))
    const tail = all.slice(-take).join('\n').trim()
    return { exists: true, file: logPath, bytes: Buffer.byteLength(raw, 'utf8'), tail }
  } catch {
    return { exists: false, file: logPath }
  }
}

// 把 data.json 里的盘角色（本地仓库 / 仓库 / 备份镜像 / 数据/报告）贴到 health.json 的每块盘上，
// 并让「装 git 仓库的盘」排在最前面（本地仓库优先），这样面板里一眼看到 git 盘。
async function decorateDisks(payload, cfg) {
  if (!payload || !Array.isArray(payload.disks)) return payload
  const roles = new Map()
  try {
    const data = JSON.parse(await readFile(cfg.dataPath, 'utf8'))
    for (const d of data.disks || []) {
      const key = String(d.drive || '').toUpperCase()
      if (key) roles.set(key, Array.isArray(d.roles) ? d.roles.slice() : [])
    }
  } catch {
    // data.json 还没生成：只是没有角色标签，不影响磁盘健康本身
  }
  for (const d of payload.disks) {
    const mine = []
    for (const v of d.volumes || []) {
      const key = String(v.letter || '').toUpperCase()
      for (const r of roles.get(key) || []) if (mine.indexOf(r) < 0) mine.push(r)
    }
    d.roles = mine
    d.hasGit = mine.some((r) => String(r).indexOf('仓库') >= 0)
    d.isPrimary = mine.indexOf('本地仓库') >= 0
  }
  const weight = (d) => (d.isPrimary ? 0 : (d.hasGit ? 1 : 2))
  payload.disks.sort((a, b) => (weight(a) - weight(b)) || (Number(a.index) - Number(b.index)))
  return payload
}

// ---- GitHub 推送状态（自动标记）---------------------------------------------
// 每个仓库问两件事：origin 是不是 github.com；远端同名分支的 sha 与本地 HEAD 差多少。
// 结果按仓库路径缓存 3 分钟（ls-remote 要联网，不能每次刷新都打一遍）。
const GH_TTL = 180 * 1000
const ghCache = new Map()

function parseGithubRemote(remoteUrl) {
  const s = String(remoteUrl || '').trim()
  const m = s.match(/github\.com[:/]+([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i)
  if (!m) return null
  return { owner: m[1], repo: m[2] }
}

function runGit(cfg, args, cwd, timeout) {
  const exe = cfg.gitExe || 'git'
  return new Promise((resolve) => {
    try {
      execFile(exe, args, { cwd, windowsHide: true, timeout, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
        resolve({
          ok: !error,
          code: error && typeof error.code === 'number' ? error.code : (error ? 1 : 0),
          out: String(stdout || '').trim(),
          err: String((error && error.message) || stderr || '').trim(),
        })
      })
    } catch (err) {
      resolve({ ok: false, code: 1, out: '', err: String((err && err.message) || err) })
    }
  })
}

async function githubStateOf(cfg, repo) {
  const path = String((repo && repo.path) || '')
  if (!path) return null
  const cached = ghCache.get(path)
  if (cached && Date.now() - Number(cached.at) < GH_TTL) return cached.value

  let value = null
  try {
    const remote = await runGit(cfg, ['remote', 'get-url', 'origin'], path, 6000)
    const parsed = remote.ok ? parseGithubRemote(remote.out) : null
    if (parsed) {
      const branch = String((repo && repo.branch) || 'main') || 'main'
      const local = await runGit(cfg, ['rev-parse', 'HEAD'], path, 6000)
      const localSha = local.ok ? local.out : ''
      const url = remote.out.trim()
      const ls = await runGit(cfg, ['ls-remote', '--heads', url, 'refs/heads/' + branch], path, 15000)
      let remoteSha = ''
      if (ls.ok && ls.out) {
        const first = ls.out.split(/\r?\n/)[0] || ''
        remoteSha = first.split(/\s+/)[0] || ''
      }
      let state = 'unknown'
      let ahead = 0
      let behind = 0
      if (!remoteSha) {
        state = 'unpublished'                 // 远端还没有这个分支
      } else if (localSha && remoteSha === localSha) {
        state = 'synced'
      } else {
        // 远端 sha 本地是否有？有就能比祖先关系，没有（没 fetch 过）就只能标 unknown。
        const has = await runGit(cfg, ['cat-file', '-e', remoteSha + '^{commit}'], path, 6000)
        if (has.ok) {
          const anc = await runGit(cfg, ['merge-base', '--is-ancestor', remoteSha, 'HEAD'], path, 6000)
          if (anc.ok) {
            state = 'ahead'
            const cnt = await runGit(cfg, ['rev-list', '--count', remoteSha + '..HEAD'], path, 6000)
            ahead = cnt.ok ? (Number(cnt.out) || 0) : 0
          } else {
            const desc = await runGit(cfg, ['merge-base', '--is-ancestor', 'HEAD', remoteSha], path, 6000)
            if (desc.ok) {
              state = 'behind'
              const cnt = await runGit(cfg, ['rev-list', '--count', 'HEAD..' + remoteSha], path, 6000)
              behind = cnt.ok ? (Number(cnt.out) || 0) : 0
            } else {
              state = 'diverged'
            }
          }
        } else {
          state = 'unknown'
        }
      }
      value = {
        remote: url,
        owner: parsed.owner,
        repo: parsed.repo,
        branch,
        state,
        ahead,
        behind,
        localHead: localSha.slice(0, 7),
        remoteHead: remoteSha.slice(0, 7),
        checkedAt: new Date().toISOString(),
      }
    }
  } catch {
    value = null
  }
  ghCache.set(path, { at: Date.now(), value })
  return value
}

// 把 GitHub 状态挂到 data.json 的每个 repo 上（`repo.github`），客户端据此显示徽章。
// 并发上限 3：每个仓要跑 ls-remote（最坏 15 s 超时），全串行时仓一多就慢。
async function decorateGithub(payload, cfg) {
  if (!payload || !Array.isArray(payload.repos) || !payload.repos.length) return payload
  const queue = payload.repos.slice()
  const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
    while (queue.length) {
      const r = queue.shift()
      try {
        r.github = await githubStateOf(cfg, r)
      } catch {
        r.github = null
      }
    }
  })
  await Promise.all(workers)
  return payload
}

// 内置默认仓清单：不写死任何人的目录。要预置就设 DSH_VH_REPOS（分号或逗号分隔的绝对路径），
// 或者直接编辑 <reports>/repos.json —— 面板上「加项目 / 移除」写的就是它。
const DEFAULT_REPOS = String(process.env.DSH_VH_REPOS || '')
  .split(/[;,]/)
  .map((x) => x.trim())
  .filter(Boolean)

async function readRepos(cfg) {
  try {
    const text = await readFile(cfg.reposPath, 'utf8')
    const parsed = JSON.parse(text)
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed.repos) ? parsed.repos : []
    return list.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim())
  } catch {
    return []
  }
}

// 清单文件还不存在时，用「当前页面里正在显示的项目」作为起点，避免第一次加仓就把默认三仓抹掉。
async function effectiveRepos(cfg) {
  const configured = await readRepos(cfg)
  if (configured.length) return configured
  try {
    const text = await readFile(cfg.dataPath, 'utf8')
    const data = JSON.parse(text)
    const fromData = (Array.isArray(data.repos) ? data.repos : [])
      .map((r) => (r && typeof r.path === 'string' ? r.path : ''))
      .filter(Boolean)
    if (fromData.length) return fromData
  } catch {
    /* 没有 data.json 就用内置默认 */
  }
  return DEFAULT_REPOS.slice()
}

async function writeRepos(cfg, list) {
  await mkdir(dirname(cfg.reposPath), { recursive: true })
  const body = JSON.stringify({ updated: new Date().toISOString(), repos: list }, null, 2)
  await writeFile(cfg.reposPath, body, 'utf8')
}

async function isGitRepo(target) {
  if (!target || typeof target !== 'string') return false
  try {
    const st = await stat(target)
    if (!st.isDirectory()) return false
    const dot = await stat(target.replace(/[\\/]+$/, '') + '\\.git')
    return dot.isDirectory() || dot.isFile()
  } catch {
    return false
  }
}

// 「关于 / 诊断」用的元信息：版本、加载路径、关键文件的存在性与时间、路由清单。
// 面板全 404 时先看这里，比猜「插件是不是没加载」快得多。
const PLUGIN_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const ROUTE_TABLE = [
  { method: 'GET', path: '/version-history/health', note: '配置与路径' },
  { method: 'GET', path: '/version-history/data.json', note: '项目版本数据' },
  { method: 'GET', path: '/version-history/disks.json', note: '磁盘健康快照' },
  { method: 'GET', path: '/version-history/backup.json', note: '备份设置状态' },
  { method: 'GET', path: '/version-history/github.json', note: 'GitHub 绑定状态' },
  { method: 'GET', path: '/version-history/diag.json', note: '本页' },
  { method: 'POST', path: '/dsh-vh/gh', note: '绑定 / 测试 / 推送' },
  { method: 'POST', path: '/dsh-vh/backup', note: '镜像 / 拷贝 / 自动备份 / 推送锁' },
]

async function fileInfo(p) {
  try {
    const st = await stat(p)
    return { path: p, exists: true, bytes: st.size, mtime: st.mtime.toISOString() }
  } catch {
    return { path: p, exists: false }
  }
}

async function diagInfo(cfg) {
  let meta = { name: '', version: '', file: join(PLUGIN_ROOT, 'package.json') }
  try {
    const j = JSON.parse(await readFile(meta.file, 'utf8'))
    meta = { name: j.name || '', version: j.version || '', file: meta.file }
  } catch {
    /* 读不到就空着 */
  }
  const files = await Promise.all([
    fileInfo(cfg.dataPath),
    fileInfo(cfg.healthPath),
    fileInfo(cfg.backupPath),
    fileInfo(cfg.githubPath),
    fileInfo(cfg.smartPath),
    fileInfo(cfg.reposPath),
    fileInfo(join(cfg.dataPath, '..', '版本历史.html')),
  ])
  return {
    ok: true,
    plugin: meta,
    root: PLUGIN_ROOT,
    node: process.version,
    pid: process.pid,
    uptimeSec: Math.round(process.uptime()),
    routes: ROUTE_TABLE,
    files,
    // 进程内的调度状态（有就报，没有不影响）
    lan: cfg.lan ? cfg.lan.status() : null,
  }
}

async function handle(request, cfg) {
  const url = new URL(request.url || '/', 'http://localhost')
  const path = url.pathname.replace(/^\/version-history/, '') || '/'

  if (path === '/health') {
    return json({
      ok: true,
      dataPath: cfg.dataPath,
      scriptPath: cfg.scriptPath,
      reposPath: cfg.reposPath,
      healthPath: cfg.healthPath,
      healthScript: cfg.healthScript,
      smartPath: cfg.smartPath,
      smartScript: cfg.smartScript,
      smartLauncher: cfg.smartLauncher,
      smartStatePath: cfg.smartStatePath,
      smartLogPath: cfg.smartLogPath,
      lanPort: cfg.lanPort,
      reposRoot: cfg.reposRoot,
      githubPath: cfg.githubPath,
      dpapiScript: cfg.dpapiScript,
      backupPath: cfg.backupPath,
    })
  }

  if (path === '/backup.json') {
    return json(await cfg.bk.status())
  }

  if (path === '/diag.json') {
    return json(await diagInfo(cfg))
  }

  if (path === '/lan.json') {
    return json(await cfg.lan.status())
  }

  if (path === '/lan/start') {
    const want = url.searchParams.get('port')
    return json(await cfg.lan.start(want ? Number(want) : 0))
  }

  if (path === '/lan/stop') {
    return json(await cfg.lan.stop())
  }

  if (path === '/lan/firewall') {
    return json(await cfg.lan.firewall())
  }

  if (path === '/repos') {
    return json({ file: cfg.reposPath, repos: await effectiveRepos(cfg) })
  }

  if (path === '/repos/add' || path === '/repos/remove') {
    const target = url.searchParams.get('path')
    if (!target) return json({ error: 'path-required' }, 400)
    const list = await effectiveRepos(cfg)
    const key = (p) => p.replace(/[\\/]+$/, '').toLowerCase()
    if (path === '/repos/add') {
      if (!(await isGitRepo(target))) return json({ error: 'not-a-git-repo', path: target }, 400)
      const clean = target.replace(/[\\/]+$/, '')
      if (list.some((p) => key(p) === key(clean))) return json({ ok: true, unchanged: true, repos: list })
      list.push(clean)
    } else {
      const next = list.filter((p) => key(p) !== key(target))
      list.length = 0
      list.push(...next)
    }
    await writeRepos(cfg, list)
    return json({ ok: true, repos: list, file: cfg.reposPath })
  }

  if (path === '/data.json') {
    try {
      const text = await readFile(cfg.dataPath, 'utf8')
      const payload = JSON.parse(text)
      // 顺手贴 GitHub 状态（有缓存，不每次联网；失败不影响页面）
      await decorateGithub(payload, cfg).catch(() => payload)
      return json(payload)
    } catch (err) {
      return json({ error: 'data-missing', detail: String(err && err.message || err) }, 404)
    }
  }

  if (path === '/history.json') {
    return json(await readHistory(cfg))
  }

  if (path === '/diff') {
    const repo = url.searchParams.get('repo') || ''
    const a = url.searchParams.get('a') || ''
    const b = url.searchParams.get('b') || ''
    return json(await diffRefs(cfg, repo, a, b))
  }

  if (path === '/disks.json' || path === '/disks/scan') {
    const fresh = path === '/disks/scan' || url.searchParams.get('fresh') === '1'
    // 没有快照、或调用方要求 fresh，就先扫一遍；否则直接发缓存文件（扫描约 5–7 s）。
    let needsScan = fresh
    if (!needsScan) {
      try {
        await stat(cfg.healthPath)
      } catch {
        needsScan = true
      }
    }
    let scan = null
    if (needsScan) {
      // 先做一次普通权限的 SMART 采集（SATA 盘能拿到温度/通电），再跑健康扫描合并。
      // 快照很新（默认 20 s 内）或调用方显式说 smart=0 时跳过，省掉约 2.6 s。
      const smartParam = url.searchParams.get('smart')
      let skipSmart = smartParam === '0'
      if (!skipSmart) {
        try {
          const cur = await smartInfo(cfg.smartPath)
          if (cur && cur.exists && cur.mtimeMs && Date.now() - Number(cur.mtimeMs) < 20000) skipSmart = true
        } catch { /* 读不到就照常采集 */ }
      }
      let smart = { ok: true, ms: 0, skipped: true }
      if (!skipSmart) {
        const got = await collectSmart(cfg.smartScript, cfg.smartPath, cfg.smartLogPath)
        smart = { ok: got.ok, ms: got.ms, err: got.ok ? '' : got.err, skipped: false }
      }
      scan = await scanHealth(cfg.healthScript, cfg.healthPath)
      if (scan) scan.smart = smart
    }
    try {
      const text = await readFile(cfg.healthPath, 'utf8')
      const payload = JSON.parse(text)
      await decorateDisks(payload, cfg)
      // 成功时只回一句状态，别把整份 JSON 塞进响应（上次就是这样让响应膨胀到 6 KB 乱码）
      if (scan) {
        payload.scan = scan.ok
          ? { ok: true, code: 0, ms: scan.ms, out: [], smart: scan.smart || null }
          : { ok: false, code: scan.code, ms: scan.ms, out: [], err: scan.err }
        // 每次真扫完都留一份历史点（趋势用），失败不影响响应
        if (scan.ok) await appendHistory(cfg, payload).catch(() => {})
      }
      return json(payload)
    } catch (err) {
      return json({
        error: 'health-missing',
        detail: String(err && err.message || err),
        scan,
      }, 404)
    }
  }

  if (path === '/smart.json') {
    return json(await smartInfo(cfg.smartPath))
  }

  if (path === '/smart/scan') {
    return json(await elevatedScan(cfg.smartLauncher))
  }

  if (path === '/smart.state.json') {
    return json(await smartState(cfg.smartStatePath))
  }

  if (path === '/smart.log') {
    return json(await smartLogTail(cfg.smartLogPath, url.searchParams.get('lines')))
  }

  if (path === '/github.json') {
    return json(await cfg.gh.status())
  }

  // 只读的连接测试可以走 GET（没有密钥进 URL）；绑定/推送要带令牌，走 /dsh-vh/gh 的 POST。
  if (path === '/github/test') {
    return json(await cfg.gh.test({ url: url.searchParams.get('url') || '' }))
  }

  if (path === '/report' || path === '/report.html') {
    try {
      const html = await readFile(cfg.reportPath)
      return new Response(html, {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
      })
    } catch (err) {
      return json({ error: 'report-missing', detail: String(err && err.message || err) }, 404)
    }
  }

  if (path === '/refresh') {
    // DSH 的 resource 路由只放行 GET（POST 在宿主层就被 405 挡掉），所以刷新走 GET。
    return json(await refresh(cfg.scriptPath))
  }

  return json({ error: 'not-found', path }, 404)
}

export function apply(ctx, config) {
  const cfg = Object.assign({}, DEFAULTS, config && typeof config === 'object' ? config : {})
  cfg.lan = createLan({ reposRoot: cfg.reposRoot, gitExe: cfg.gitExe, lanPort: cfg.lanPort, settingsPath: cfg.lanSettings })
  cfg.gh = createGithub({
    gitExe: cfg.gitExe,
    githubPath: cfg.githubPath,
    dpapiScript: cfg.dpapiScript,
  })
  cfg.bk = createBackup({
    gitExe: cfg.gitExe,
    reposRoot: cfg.reposRoot,
    dataPath: cfg.dataPath,
    backupPath: cfg.backupPath,
    backupKeep: cfg.backupKeep,
  })
  // 路由注册包一层：webServer 在 apply 时可能还没就绪（重启后插件加载顺序会变），
  // 直接 return 会导致路由一个都不注册、面板全 404（2026-11-23 踩到）。
  const mount = (webServer) => {

  // GitHub 的写操作（绑定 / 推送 / 解绑 / 列仓库）走这个**普通 handler 路由**：
  //   - resource 路由只放行 GET，而令牌不能进 URL（浏览器历史、宿主日志会留下）；
  //   - 所以单独注册一个接受 POST + JSON body 的精确路由，路径放在 /version-history 前缀之外，
  //     避免被上面那个 prefix resource 抢走而返回 405。
  ctx.effect(
    () => webServer.register({
      kind: 'exact',
      path: '/dsh-vh/gh',
      handler: async (req, res) => {
        const reply = (body, status = 200) => {
          try {
            res.writeHead(status, JSON_HEADERS)
            res.end(JSON.stringify(body))
          } catch { /* 连接已断，忽略 */ }
        }
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const raw = Buffer.concat(chunks).toString('utf8').trim()
          const body = raw ? JSON.parse(raw) : {}
          const action = String(body.action || '').trim()
          if (action === 'bind') {
            return reply(await cfg.gh.bind({
              url: body.url,
              token: body.token,
              repoPath: body.repoPath,
              branch: body.branch,
            }))
          }
          if (action === 'unbind') return reply(await cfg.gh.unbind({ keepRemote: !!body.keepRemote }))
          if (action === 'test') return reply(await cfg.gh.test({ url: body.url, token: body.token }))
          // 「禁止推送」锁：开在「备份设置」里；锁着时任何写远端的操作都在这里被拦下
          if (action === 'push' || action === 'publish') {
            const locked = await cfg.bk.status().then((s) => s.pushLock === true).catch(() => false)
            if (locked) {
              return reply({
                ok: false,
                locked: true,
                err: '推送已被「禁止推送」锁关闭：到「备份设置 → 推送保护」里解锁再推（这是你为公开仓设的保险）',
              }, 423)
            }
          }
          if (action === 'push') {
            return reply(await cfg.gh.push({
              branch: body.branch,
              tags: !!body.tags,
              force: !!body.force,
              repoPath: body.repoPath,
            }))
          }
          if (action === 'repos') return reply(await cfg.gh.repos({ token: body.token }))
          if (action === 'set-expiry') return reply(await cfg.gh.setExpiry({ date: body.date }))
          if (action === 'publish') {
            return reply(await cfg.gh.publish({
              repoPath: body.repoPath,
              name: body.name,
              visibility: body.visibility,
              branch: body.branch,
              token: body.token,
            }))
          }
          return reply({ ok: false, err: 'unknown action: ' + action }, 400)
        } catch (err) {
          reply({ ok: false, err: String((err && err.message) || err) }, 500)
        }
      },
    }),
    'dsh-version-history: github post route',
  )

  ctx.effect(
    () => webServer.register({
      kind: 'exact',
      path: '/dsh-vh/backup',
      handler: async (req, res) => {
        const reply = (body, status = 200) => {
          try {
            res.writeHead(status, JSON_HEADERS)
            res.end(JSON.stringify(body))
          } catch { /* 连接已断，忽略 */ }
        }
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const raw = Buffer.concat(chunks).toString('utf8').trim()
          const body = raw ? JSON.parse(raw) : {}
          const action = String(body.action || '').trim()
          if (action === 'set-password') {
            return reply(await cfg.bk.setPassword({ password: body.password, mode: body.mode }))
          }
          if (action === 'clear-password') {
            return reply(await cfg.bk.clearPassword({ password: body.password }))
          }
          if (action === 'set-mirror') {
            return reply(await cfg.bk.setMirror({
              mirror: body.mirror,
              password: body.password,
              keep: body.keep,
            }))
          }
          if (action === 'run') return reply(await cfg.bk.runCopy({ password: body.password }))
          if (action === 'set-auto') {
            return reply(await cfg.bk.setAuto({
              enabled: body.enabled,
              mode: body.mode,
              at: body.at,
              minutes: body.minutes,
              password: body.password,
            }))
          }
          if (action === 'tick') return reply(await cfg.bk.tick())
          if (action === 'set-push-lock') return reply(await cfg.bk.setPushLock({ locked: body.locked }))
          if (action === 'status') return reply(await cfg.bk.status())
          return reply({ ok: false, err: 'unknown action: ' + action }, 400)
        } catch (err) {
          reply({ ok: false, err: String((err && err.message) || err) }, 500)
        }
      },
    }),
    'dsh-version-history: backup post route',
  )

  // 局域网的两道闸（只读 / 口令）走单独一条 POST：语义与「备份」无关，别混在一起
  ctx.effect(
    () => webServer.register({
      kind: 'exact',
      path: '/dsh-vh/lan',
      handler: async (req, res) => {
        const reply = (body, status = 200) => {
          try {
            res.writeHead(status, JSON_HEADERS)
            res.end(JSON.stringify(body))
          } catch { /* 连接已断，忽略 */ }
        }
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const raw = Buffer.concat(chunks).toString('utf8').trim()
          const body = raw ? JSON.parse(raw) : {}
          const action = String(body.action || '').trim()
          if (action === 'settings') {
            return reply(await cfg.lan.saveSettings({
              readOnly: body.readOnly,
              password: body.password,
              clearPassword: body.clearPassword,
            }))
          }
          if (action === 'start') return reply(await cfg.lan.start(Number(body.port) || 0))
          if (action === 'stop') return reply(await cfg.lan.stop())
          return reply({ ok: false, err: 'unknown action: ' + action }, 400)
        } catch (err) {
          reply({ ok: false, err: String((err && err.message) || err) }, 500)
        }
      },
    }),
    'dsh-version-history: lan post route',
  )

  ctx.effect(
    () => webServer.register({
      kind: 'prefix',
      path: '/version-history',
      resource: (request) => handle(request, cfg).catch((err) =>
        json({ error: 'internal', detail: String(err && err.message || err) }, 500)),
    }),
    'dsh-version-history: http routes',
  )
  // 插件卸载（禁用到重新启用之间）时把局域网 git 服务关掉，别留着监听端口
  ctx.effect(() => () => { cfg.lan.stop().catch(() => {}) }, 'dsh-version-history: lan server')

  // 自动备份调度：每分钟看一眼「到点没」，到点就无人值守跑一次 runCopy。
  // 用 unref 防止定时器拖住宿主退出；DSH 关掉后自动备份自然停摆（要 7×24 请用 Windows 计划任务另加一条）。
  ctx.effect(() => {
    const t = setInterval(() => {
      cfg.bk.tick().catch((err) => {
        if (ctx.logger && typeof ctx.logger.warn === 'function') {
          ctx.logger.warn('[dsh-version-history] 自动备份失败：' + String((err && err.message) || err))
        }
      })
    }, 60 * 1000)
    if (typeof t.unref === 'function') t.unref()
    // 启动 15 秒后再补看一眼：赶上关机期间错过的「今天那次」
    const once = setTimeout(() => { cfg.bk.tick().catch(() => {}) }, 15 * 1000)
    if (typeof once.unref === 'function') once.unref()
    return () => { clearInterval(t); clearTimeout(once) }
  }, 'dsh-version-history: auto backup timer')
  }

  // 拿到 webServer 就现在挂；拿不到就等它就绪再挂（否则路由全 404）。
  const ready = typeof ctx.get === 'function' ? ctx.get('webServer') : undefined
  if (ready && typeof ready.register === 'function') {
    mount(ready)
  } else if (typeof ctx.inject === 'function') {
    ctx.inject(['webServer'], (scoped) => {
      const ws = scoped && (scoped.webServer || (typeof scoped.get === 'function' ? scoped.get('webServer') : undefined))
      if (ws && typeof ws.register === 'function') mount(ws)
    })
  } else if (ctx.logger && typeof ctx.logger.warn === 'function') {
    ctx.logger.warn('[dsh-version-history] webServer 不可用：面板取不到数据（独立页仍可手动生成）')
  }
}
