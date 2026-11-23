/**
 * dsh-version-history · 备份设置
 *
 * 两件事：
 *   setMirror  设置镜像根目录（例如 D:\GitMirror）——写进 backup.json
 *   run        一键拷贝：把 <reposRoot>/*.git 全部镜像到 <mirror>/<名字>.git，
 *              再给每个仓打一份 bundle（<mirror>/bundles/<名字>-<时间戳>.bundle，只留最近 keep 份）
 *
 * 许可密码：
 *   - 第一次打开面板时由前端询问「要不要设密码」；
 *   - 设了密码，setMirror / run 都必须带上正确密码（scrypt 加盐哈希，不存明文）；
 *   - 选择不设密码：写 `passwordMode:'none'`，之后不再询问、也不再校验。
 */
import { execFile } from 'node:child_process'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { readFile, writeFile, mkdir, readdir, stat, unlink } from 'node:fs/promises'
import { join, dirname, basename } from 'node:path'

const SCRYPT_KEYLEN = 64

// 自动备份默认值：默认关闭，一旦打开就按「每日 HH:mm」或「每隔 N 分钟」跑一次 runCopy
const AUTO_DEFAULTS = {
  enabled: false,
  mode: 'daily',      // daily | interval
  at: '03:30',        // mode=daily 触发时刻（本地时间）
  minutes: 360,       // mode=interval 间隔分钟
  lastRunAt: null,
  lastOk: null,
}

function normalizeAuto(raw) {
  const a = Object.assign({}, AUTO_DEFAULTS, raw && typeof raw === 'object' ? raw : {})
  a.enabled = !!a.enabled
  a.mode = a.mode === 'interval' ? 'interval' : 'daily'
  a.at = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(a.at || '')) ? String(a.at) : AUTO_DEFAULTS.at
  a.minutes = Math.max(5, Math.min(1440, Number(a.minutes) || AUTO_DEFAULTS.minutes))
  a.lastRunAt = a.lastRunAt || null
  a.lastOk = typeof a.lastOk === 'boolean' ? a.lastOk : null
  return a
}

function nowStamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(String(password), salt, SCRYPT_KEYLEN).toString('hex')
  return { algo: 'scrypt', salt, hash, keylen: SCRYPT_KEYLEN }
}

function verifyPassword(password, rec) {
  if (!rec || !rec.salt || !rec.hash) return false
  try {
    const got = scryptSync(String(password), rec.salt, rec.keylen || SCRYPT_KEYLEN)
    const want = Buffer.from(rec.hash, 'hex')
    return got.length === want.length && timingSafeEqual(got, want)
  } catch {
    return false
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const t0 = Date.now()
    execFile(cmd, args, {
      windowsHide: true,
      timeout: opts.timeout || 180000,
      maxBuffer: 8 * 1024 * 1024,
      ...opts,
    }, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        code: err && typeof err.code === 'number' ? err.code : (err ? 1 : 0),
        out: String(stdout || ''),
        err: String(stderr || ''),
        ms: Date.now() - t0,
      })
    })
  })
}

async function exists(p) {
  try { await stat(p); return true } catch { return false }
}

export function createBackup(cfg) {
  const file = cfg.backupPath
  const reposRoot = cfg.reposRoot
  const dataPath = cfg.dataPath || ''
  const gitExe = cfg.gitExe || 'git'
  const defaultKeep = Number(cfg.backupKeep || 10)

  async function read() {
    try {
      const text = await readFile(file, 'utf8')
      const data = JSON.parse(text)
      return data && typeof data === 'object' ? data : {}
    } catch {
      return {}
    }
  }

  async function write(data) {
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(data, null, 2), 'utf8')
    return data
  }

  async function status() {
    const d = await read()
    const list = await listRepos()
    return {
      file,
      exists: await exists(file),
      mirror: d.mirror || '',
      keep: Number(d.keep || defaultKeep),
      reposRoot,
      repos: list.map((r) => r.name),
      repoPaths: list.map((r) => ({ name: r.name, path: r.path })),
      hasPassword: !!(d.password && d.password.hash),
      passwordMode: d.passwordMode || (d.password && d.password.hash ? 'set' : ''),
      lastRun: d.lastRun || null,
      auto: normalizeAuto(d.auto),
      // 「禁止推送」锁：默认关（不锁）。开着时 Host 侧会拒绝一切 GitHub 推送/发布。
      pushLock: d.pushLock === true,
      updatedAt: d.updatedAt || null,
    }
  }

  // 推送锁：纯安全开关，不校验许可密码（否则忘了密码就再也解不开）。
  async function setPushLock({ locked }) {
    const d = await read()
    d.pushLock = locked === true
    d.updatedAt = new Date().toISOString()
    await write(d)
    return { ok: true, pushLock: d.pushLock }
  }

  function gate(d, password) {
    if (!(d.password && d.password.hash)) return { ok: true }
    if (!password) return { ok: false, err: '需要许可密码', needPassword: true }
    if (!verifyPassword(password, d.password)) return { ok: false, err: '许可密码不对', badPassword: true }
    return { ok: true }
  }

  async function setPassword({ password, mode }) {
    const d = await read()
    if (mode === 'none') {
      d.passwordMode = 'none'
      delete d.password
      d.updatedAt = new Date().toISOString()
      await write(d)
      return { ok: true, hasPassword: false, passwordMode: 'none' }
    }
    const pw = String(password || '')
    if (pw.length < 4) return { ok: false, err: '密码至少 4 位' }
    d.password = hashPassword(pw)
    d.passwordMode = 'set'
    d.updatedAt = new Date().toISOString()
    await write(d)
    return { ok: true, hasPassword: true, passwordMode: 'set' }
  }

  async function clearPassword({ password }) {
    const d = await read()
    const g = gate(d, password)
    if (!g.ok) return g
    d.passwordMode = 'none'
    delete d.password
    d.updatedAt = new Date().toISOString()
    await write(d)
    return { ok: true, hasPassword: false, passwordMode: 'none' }
  }

  async function setMirror({ mirror, password, keep }) {
    const d = await read()
    const g = gate(d, password)
    if (!g.ok) return g
    const dir = String(mirror || '').trim().replace(/[\\/]+$/, '')
    if (!/^[A-Za-z]:[\\/]/.test(dir) && !/^\\\\/.test(dir)) {
      return { ok: false, err: '镜像要填绝对路径，例如 D:\\GitMirror' }
    }
    try {
      await mkdir(dir, { recursive: true })
    } catch (err) {
      return { ok: false, err: '目录建不出来：' + String((err && err.message) || err) }
    }
    d.mirror = dir
    if (keep) d.keep = Math.max(1, Math.min(50, Number(keep) || defaultKeep))
    d.updatedAt = new Date().toISOString()
    await write(d)
    return {
      ok: true,
      mirror: d.mirror,
      keep: d.keep,
      paths: {
        mirror: d.mirror,
        bundles: join(d.mirror, 'bundles'),
        logs: join(d.mirror, 'logs'),
      },
    }
  }

  // 要备份的仓库 = reposRoot 下的裸仓 + 页面里列出的项目仓（data.json 的 repos[].path）
  // 用 basename 去重，避免同一个仓既出现在清单里、又挂在 reposRoot 下。
  async function listRepos() {
    const seen = new Map()

    let entries = []
    try {
      entries = await readdir(reposRoot, { withFileTypes: true })
    } catch { /* reposRoot 可能不存在：只看页面清单 */ }
    for (const e of entries) {
      if (!e.isDirectory() || !/\.git$/i.test(e.name)) continue
      const dir = join(reposRoot, e.name)
      if (await exists(join(dir, 'HEAD'))) seen.set(e.name.replace(/\.git$/i, '').toLowerCase(), dir)
    }

    if (dataPath) {
      try {
        const raw = JSON.parse(await readFile(dataPath, 'utf8'))
        const list = Array.isArray(raw && raw.repos) ? raw.repos : []
        for (const r of list) {
          const p = String((r && r.path) || '').trim()
          if (!p) continue
          const name = basename(p.replace(/[\\/]+$/, '')).replace(/\.git$/i, '')
          if (!name) continue
          const key = name.toLowerCase()
          if (seen.has(key)) continue
          if (await exists(join(p, '.git')) || await exists(join(p, 'HEAD'))) seen.set(key, p.replace(/[\\/]+$/, ''))
        }
      } catch { /* data.json 还没生成：只备份裸仓 */ }
    }

    return [...seen.keys()].sort().map((k) => ({ name: k, path: seen.get(k) }))
  }

  async function mirrorOne(srcDir, mirror, keep) {
    const name = basename(srcDir.replace(/[\\/]+$/, '')).replace(/\.git$/i, '')
    const target = join(mirror, name + '.git')
    const t0 = Date.now()
    const steps = []
    if (await exists(join(target, 'HEAD'))) {
      const r = await run(gitExe, ['-C', srcDir, 'push', '--mirror', target])
      steps.push({ step: 'push --mirror', ok: r.ok, detail: (r.err || r.out || '').trim().split(/\r?\n/).slice(-2).join(' ') })
    } else {
      const r = await run(gitExe, ['clone', '--mirror', srcDir, target])
      steps.push({ step: 'clone --mirror', ok: r.ok, detail: (r.err || r.out || '').trim().split(/\r?\n/).slice(-2).join(' ') })
    }
    // 记录镜像侧的 HEAD，方便 UI 显示「已同步到哪个提交」
    let head = ''
    const h = await run(gitExe, ['-C', target, 'rev-parse', '--short', 'HEAD'])
    if (h.ok) head = h.out.trim()

    // bundle（保留最近 keep 份）
    const bundleDir = join(mirror, 'bundles')
    await mkdir(bundleDir, { recursive: true })
    const bundle = join(bundleDir, `${name}-${nowStamp()}.bundle`)
    const b = await run(gitExe, ['-C', srcDir, 'bundle', 'create', bundle, '--all'])
    let bundleSize = 0
    try { bundleSize = (await stat(bundle)).size } catch { /* ignore */ }
    let pruned = 0
    try {
      const files = (await readdir(bundleDir))
        .filter((f) => f.startsWith(name + '-') && /\.bundle$/i.test(f))
        .sort()
        .reverse()
      for (const old of files.slice(keep)) {
        try { await unlink(join(bundleDir, old)); pruned++ } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    // 备份完立刻自检：镜像仓 fsck + bundle verify
    // （「拷完了」不等于「拷对了」，这两步才是能把备份当备份用的证据）
    const verify = { ok: true, steps: [] }
    const fsck = await run(gitExe, ['-C', target, 'fsck', '--no-progress', '--no-dangling'])
    verify.steps.push({
      step: 'fsck 镜像仓',
      ok: fsck.ok,
      detail: (fsck.err || fsck.out || '').trim().split(/\r?\n/).slice(0, 3).join(' '),
    })
    const bv = b.ok
      ? await run(gitExe, ['-C', srcDir, 'bundle', 'verify', bundle])
      : { ok: false, err: 'bundle 没生成，跳过校验' }
    verify.steps.push({
      step: 'bundle verify',
      ok: !!bv.ok,
      detail: (bv.err || bv.out || '').trim().split(/\r?\n/).slice(0, 3).join(' '),
    })
    verify.ok = verify.steps.every((s) => s.ok)
    return {
      name,
      target,
      head,
      steps,
      bundle: { ok: b.ok, file: bundle, bytes: bundleSize, pruned },
      verify,
      ms: Date.now() - t0,
    }
  }

  async function setAuto({ enabled, mode, at, minutes, password }) {
    const d = await read()
    const g = gate(d, password)
    if (!g.ok) return g
    const a = normalizeAuto(Object.assign({}, normalizeAuto(d.auto), {
      enabled: enabled === undefined ? true : !!enabled,
      mode: mode || undefined,
      at: at || undefined,
      minutes: minutes === undefined ? undefined : minutes,
    }))
    if (a.enabled && !d.mirror) {
      return { ok: false, err: '先设置镜像目录，再开自动备份' }
    }
    d.auto = a
    d.updatedAt = new Date().toISOString()
    await write(d)
    return { ok: true, auto: a }
  }

  // 判断此刻是否到点：daily 看今天的目标时刻，interval 看距上次跑够不够分钟数
  function dueNow(a, now = new Date()) {
    if (!a || !a.enabled) return { due: false, reason: '自动备份未启用' }
    const last = a.lastRunAt ? Date.parse(a.lastRunAt) : 0
    if (a.mode === 'interval') {
      if (!last) return { due: true, reason: '还没跑过' }
      const diff = now.getTime() - last
      return diff >= a.minutes * 60000
        ? { due: true, reason: `距上次 ${Math.round(diff / 60000)} 分钟` }
        : { due: false, reason: `还差 ${Math.ceil((a.minutes * 60000 - diff) / 60000)} 分钟` }
    }
    const [hh, mm] = a.at.split(':').map(Number)
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0)
    if (now.getTime() < target.getTime()) return { due: false, reason: `今天 ${a.at} 才跑` }
    if (last && last >= target.getTime()) return { due: false, reason: `今天 ${a.at} 已经跑过` }
    return { due: true, reason: `已过今天的 ${a.at}` }
  }

  // 调度器每分钟调用一次；不在点就返回 {due:false}，在点就无人值守跑一次（不受许可密码限制）
  async function tick(now = new Date()) {
    const d = await read()
    const a = normalizeAuto(d.auto)
    const why = dueNow(a, now)
    if (!why.due) return { ok: true, ran: false, reason: why.reason, auto: a }
    if (!d.mirror) {
      a.lastRunAt = new Date().toISOString()
      a.lastOk = false
      a.lastError = '还没设置镜像目录'
      d.auto = a
      await write(d)
      return { ok: false, ran: false, reason: '还没设置镜像目录', auto: a }
    }
    const res = await runCopy({ auto: true })
    return { ok: !!(res && res.ok), ran: true, reason: why.reason, auto: normalizeAuto((await read()).auto), lastRun: res && res.lastRun, err: res && res.err }
  }

  async function runCopy({ password, auto = false } = {}) {
    const d = await read()
    // 自动备份是无人值守的：不校验许可密码（要手动触发才校验）
    if (!auto) {
      const g = gate(d, password)
      if (!g.ok) return g
    }
    if (!d.mirror) return { ok: false, err: '还没设置镜像目录：先在「镜像」里填一个绝对路径并保存' }
    const keep = Number(d.keep || defaultKeep)
    const names = await listRepos()
    if (!names.length) return { ok: false, err: '没有可备份的仓库：reposRoot 下没有 *.git 裸仓，data.json 里也没有项目清单' }
    const t0 = Date.now()
    const results = []
    for (const item of names) {
      results.push(await mirrorOne(item.path, d.mirror, keep))
    }
    const okCount = results.filter((r) => r.steps.every((s) => s.ok) && r.bundle.ok && r.verify.ok).length
    const lastRun = {
      at: new Date().toISOString(),
      mirror: d.mirror,
      ok: okCount === results.length,
      count: results.length,
      okCount,
      ms: Date.now() - t0,
      repos: results.map((r) => ({
        name: r.name,
        head: r.head,
        bundleBytes: r.bundle.bytes,
        bundleFile: r.bundle.file,
        pruned: r.bundle.pruned,
        verified: r.verify.ok,
        verify: r.verify.steps.map((s) => ({ step: s.step, ok: s.ok })),
      })),
    }
    d.lastRun = lastRun
    if (auto) {
      const a = normalizeAuto(d.auto)
      a.lastRunAt = lastRun.at
      a.lastOk = lastRun.ok
      a.lastAuto = true
      delete a.lastError
      d.auto = a
    }
    d.updatedAt = lastRun.at
    await write(d)
    return { ok: lastRun.ok, lastRun, results }
  }

  return { status, setPassword, clearPassword, setMirror, setAuto, setPushLock, runCopy, tick, dueNow, read }
}
