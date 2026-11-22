/**
 * dsh-version-history · 备份设置
 *
 * 两件事：
 *   setMirror  设置镜像根目录（例如 I:\GitBackup）——写进 backup.json
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
      updatedAt: d.updatedAt || null,
    }
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
      return { ok: false, err: '镜像要填绝对路径，例如 I:\\GitBackup' }
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
    return {
      name,
      target,
      head,
      steps,
      bundle: { ok: b.ok, file: bundle, bytes: bundleSize, pruned },
      ms: Date.now() - t0,
    }
  }

  async function runCopy({ password }) {
    const d = await read()
    const g = gate(d, password)
    if (!g.ok) return g
    if (!d.mirror) return { ok: false, err: '还没设置镜像目录：先在「镜像」里填一个绝对路径并保存' }
    const keep = Number(d.keep || defaultKeep)
    const names = await listRepos()
    if (!names.length) return { ok: false, err: '没有可备份的仓库：reposRoot 下没有 *.git 裸仓，data.json 里也没有项目清单' }
    const t0 = Date.now()
    const results = []
    for (const item of names) {
      results.push(await mirrorOne(item.path, d.mirror, keep))
    }
    const okCount = results.filter((r) => r.steps.every((s) => s.ok) && r.bundle.ok).length
    const lastRun = {
      at: new Date().toISOString(),
      mirror: d.mirror,
      ok: okCount === results.length,
      count: results.length,
      okCount,
      ms: Date.now() - t0,
      repos: results.map((r) => ({ name: r.name, head: r.head, bundleBytes: r.bundle.bytes, pruned: r.bundle.pruned })),
    }
    d.lastRun = lastRun
    d.updatedAt = lastRun.at
    await write(d)
    return { ok: lastRun.ok, lastRun, results }
  }

  return { status, setPassword, clearPassword, setMirror, runCopy, read }
}
