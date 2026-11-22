/**
 * 局域网共享 Git（Host half 的可选组件）
 *
 * 为什么要自己写：MinGit 不带 `git daemon`，也不带 `git http-backend`，
 * 但带了 `git-upload-pack.exe` / `git-receive-pack.exe`。所以这里在插件进程里起一个
 * 小 HTTP 服务，按 Git Smart HTTP 协议把这两个命令包起来：
 *
 *   GET  /git/<repo>/info/refs?service=git-upload-pack|git-receive-pack
 *   POST /git/<repo>/git-upload-pack        （clone / fetch）
 *   POST /git/<repo>/git-receive-pack       （push）
 *
 * 只服务 `reposRoot` 下的裸仓库（默认 `<root>/repos`），路径解析后必须仍在 root 内。
 * 绑定 0.0.0.0:lanPort（默认 8788），**无鉴权** —— 仅限可信局域网，用完可停。
 */
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { spawn, execFile } from 'node:child_process'
import { readdir } from 'node:fs/promises'

const PKT = (text) => {
  const s = String(text)
  return (Buffer.byteLength(s) + 4).toString(16).padStart(4, '0') + s
}

function lanIps() {
  const out = []
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const ni of nets[name] || []) {
      if (ni.family !== 'IPv4' || ni.internal) continue
      out.push({ address: ni.address, name })
    }
  }
  return out
}

function safeRepoPath(root, raw) {
  let name = String(raw || '').trim()
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return null
  if (!name.endsWith('.git')) name += '.git'
  const full = path.resolve(root, name)
  const rootResolved = path.resolve(root)
  if (full !== path.join(rootResolved, name)) return null
  if (!full.startsWith(rootResolved + path.sep)) return null
  return { name, full }
}

function runGit(gitExe, args, body, gitProtocol) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(gitExe, args, {
        windowsHide: true,
        env: Object.assign({}, process.env, gitProtocol ? { GIT_PROTOCOL: gitProtocol } : {}),
      })
    } catch (err) {
      resolve({ ok: false, code: -1, stdout: Buffer.alloc(0), stderr: String((err && err.message) || err) })
      return
    }
    const chunks = []
    let errText = ''
    child.stdout.on('data', (d) => chunks.push(d))
    child.stderr.on('data', (d) => { errText += d.toString('utf8') })
    child.on('error', (err) => {
      resolve({ ok: false, code: -1, stdout: Buffer.concat(chunks), stderr: String((err && err.message) || err) })
    })
    child.on('close', (code) => {
      resolve({ ok: code === 0, code, stdout: Buffer.concat(chunks), stderr: errText.slice(-2000) })
    })
    if (body && body.length) child.stdin.end(body)
    else child.stdin.end()
  })
}

function elevated(cmd) {
  return new Promise((resolve) => {
    const started = Date.now()
    const wrapped = 'Start-Process -FilePath powershell.exe -Verb RunAs -ArgumentList ' +
      "@('-NoProfile','-ExecutionPolicy','Bypass','-Command'," + JSON.stringify(cmd).replace(/"/g, "'").replace(/''/g, "''") + ')'
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', wrapped],
      { windowsHide: true, timeout: 60000 }, (error, stdout, stderr) => {
        resolve({
          ok: !error,
          requested: !error,
          ms: Date.now() - started,
          err: String((error && error.message) || stderr || '').slice(-600),
        })
      })
  })
}

export function createLan(cfg) {
  const root = cfg.reposRoot
  const gitExe = cfg.gitExe
  let server = null
  let port = cfg.lanPort
  let startedAt = 0
  let lastError = ''

  async function repos() {
    try {
      const names = await readdir(root)
      return names.filter((n) => n.endsWith('.git')).sort()
    } catch (err) {
      lastError = String((err && err.message) || err)
      return []
    }
  }

  async function urls() {
    const ips = lanIps()
    const list = []
    for (const n of await repos()) {
      for (const ip of ips) list.push('http://' + ip.address + ':' + port + '/git/' + n)
    }
    return { ips, list }
  }

  async function status() {
    const r = await repos()
    const { ips, list } = await urls()
    return {
      running: !!server,
      port,
      startedAt: startedAt ? new Date(startedAt).toISOString() : null,
      root,
      repos: r,
      ips,
      urls: list,
      error: lastError || null,
    }
  }

  function handle(req, res) {
    const url = new URL(req.url || '/', 'http://lan.local')
    const proto = req.headers['git-protocol'] || ''
    const send = (code, type, body) => {
      res.writeHead(code, {
        'content-type': type,
        'cache-control': 'no-store',
        'content-length': Buffer.byteLength(body),
      })
      res.end(body)
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return repos().then(async (names) => {
        const { ips } = await urls()
        const host = (ips[0] && ips[0].address) || '127.0.0.1'
        const lines = names.map((n) => '<li><b>' + n + '</b> · <code>git clone http://' + host + ':' + port + '/git/' + n + '</code></li>')
        const html = '<!doctype html><meta charset="utf-8"><title>局域网 Git</title>' +
          '<style>body{font:14px/1.6 Consolas,monospace;background:#15171c;color:#dfe3ea;padding:24px}' +
          'code{color:#7fb3ff}a{color:#7fb3ff}</style>' +
          '<h2>局域网 Git（' + root + '）</h2><ul>' + (lines.join('') || '<li>没有裸仓库</li>') + '</ul>' +
          '<p>只读 + 可推送；无鉴权，仅限可信局域网。</p>'
        return send(200, 'text/html; charset=utf-8', html)
      })
    }

    const mRefs = url.pathname.match(/^\/git\/([A-Za-z0-9._-]+)\/info\/refs$/)
    if (req.method === 'GET' && mRefs) {
      const service = url.searchParams.get('service')
      if (service !== 'git-upload-pack' && service !== 'git-receive-pack') {
        return send(400, 'text/plain; charset=utf-8', 'bad service')
      }
      const repo = safeRepoPath(root, mRefs[1])
      if (!repo) return send(404, 'text/plain; charset=utf-8', 'bad repo')
      const sub = service === 'git-upload-pack' ? 'upload-pack' : 'receive-pack'
      return runGit(gitExe, [sub, '--stateless-rpc', '--advertise-refs', repo.full], null, proto).then((r) => {
        if (!r.ok) return send(500, 'text/plain; charset=utf-8', 'git ' + sub + ' failed: ' + r.stderr)
        const body = Buffer.concat([
          Buffer.from(PKT('# service=' + service + '\n')),
          Buffer.from('0000'),
          r.stdout,
        ])
        return send(200, 'application/x-' + service + '-advertisement', body)
      })
    }

    const mRpc = url.pathname.match(/^\/git\/([A-Za-z0-9._-]+)\/(git-upload-pack|git-receive-pack)$/)
    if (req.method === 'POST' && mRpc) {
      const repo = safeRepoPath(root, mRpc[1])
      if (!repo) return send(404, 'text/plain; charset=utf-8', 'bad repo')
      const service = mRpc[2]
      const sub = service === 'git-upload-pack' ? 'upload-pack' : 'receive-pack'
      const chunks = []
      req.on('data', (d) => chunks.push(d))
      req.on('end', () => {
        runGit(gitExe, [sub, '--stateless-rpc', repo.full], Buffer.concat(chunks), proto).then((r) => {
          if (!r.ok) return send(500, 'text/plain; charset=utf-8', 'git ' + sub + ' failed: ' + r.stderr)
          return send(200, 'application/x-' + service + '-result', r.stdout)
        })
      })
      return undefined
    }

    return send(404, 'text/plain; charset=utf-8', 'not found')
  }

  function start(wantPort) {
    return new Promise(async (resolve) => {
      if (server) return resolve(await status())
      port = Number(wantPort) || port
      try {
        server = http.createServer((req, res) => {
          Promise.resolve(handle(req, res)).catch((err) => {
            try {
              res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
              res.end(String((err && err.message) || err))
            } catch { /* 头已发就没办法了 */ }
          })
        })
        server.on('error', (err) => {
          lastError = String((err && err.message) || err)
          server = null
          resolve({ ok: false, error: lastError })
        })
        server.listen(port, '0.0.0.0', async () => {
          startedAt = Date.now()
          lastError = ''
          resolve({ ok: true, status: await status() })
        })
      } catch (err) {
        lastError = String((err && err.message) || err)
        server = null
        resolve({ ok: false, error: lastError })
      }
    })
  }

  async function stop() {
    if (!server) return { ok: true, status: await status() }
    const s = server
    server = null
    startedAt = 0
    await new Promise((resolve) => s.close(() => resolve()))
    return { ok: true, status: await status() }
  }

  function firewall() {
    const rule = 'DSH Git LAN ' + port
    const cmd =
      'netsh advfirewall firewall delete rule name="' + rule + '" | Out-Null; ' +
      'netsh advfirewall firewall add rule name="' + rule + '" dir=in action=allow protocol=TCP localport=' + port
    return elevated(cmd)
  }

  return { status, start, stop, firewall, urls }
}
