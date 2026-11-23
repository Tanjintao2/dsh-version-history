// 局域网 Git 服务的端到端自测（临时仓库目录，不碰 D:\repos）：
//   起服务 → ls-remote → clone → 提交 → push → 校验裸仓库 → 首页 HTML → 停服务 → 清理。
// 注意：测 HTTP 必须用 execFile + timeout，execFileSync 会挂住（踩过）。
import { execFileSync, execFile } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createLan } from './lib/lan.js'

const GIT = process.env.VH_GIT || 'E:\\Git\\tools\\git\\cmd\\git.exe'
const PORT = 8799
const root = mkdtempSync(join(tmpdir(), 'vh-lan-'))
const bare = join(root, 'demo.git')
const seed = join(root, 'seed')

const sync = (args) => execFileSync(GIT, args, { encoding: 'utf8', stdio: 'pipe' })
const run = (args) => new Promise((resolve) => {
  execFile(GIT, args, { timeout: 20000, windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
    (err, stdout, stderr) => resolve({
      err: err ? String(err.message) : null,
      out: String(stdout || ''),
      errText: String(stderr || ''),
    }))
})

sync(['init', '--bare', '-b', 'main', bare])
sync(['clone', bare, seed])
sync(['-C', seed, 'config', 'user.name', 'vh-test'])
sync(['-C', seed, 'config', 'user.email', 'vh@local'])
writeFileSync(join(seed, 'a.txt'), 'hello\n')
sync(['-C', seed, 'add', '.'])
sync(['-C', seed, 'commit', '-m', 'seed'])
sync(['-C', seed, 'push', 'origin', 'main'])

const lan = createLan({ reposRoot: root, gitExe: GIT, lanPort: PORT, settingsPath: join(root, 'lan.json') })
const started = await lan.start(PORT)
const base = 'http://127.0.0.1:' + PORT + '/git/demo.git'
const result = { started: !!(started && started.ok), port: PORT }

const ls = await run(['ls-remote', base])
result.lsRemote = { err: ls.err, refs: ls.out.trim() ? ls.out.trim().split('\n').length : 0 }

const work = join(root, 'clone')
const cl = await run(['clone', base, work])
result.clone = { err: cl.err, hasFile: existsSync(join(work, 'a.txt')) }

writeFileSync(join(work, 'a.txt'), 'hello\nmore\n')
await run(['-C', work, 'config', 'user.name', 'vh-test'])
await run(['-C', work, 'config', 'user.email', 'vh@local'])
await run(['-C', work, 'add', '.'])
await run(['-C', work, 'commit', '-m', 'from-lan'])
const push = await run(['-C', work, 'push', 'origin', 'main'])
result.push = { err: push.err, created: /main -> main/.test(push.errText) }
const head = await run(['-C', bare, 'log', '--oneline', '-1'])
result.bareHead = head.out.trim()

const idx = await fetch('http://127.0.0.1:' + PORT + '/').then((r) => r.text())
result.indexPage = { hasRepoLink: idx.includes('/git/demo.git') }

// 只读闸：开只读后 clone 仍可用，push 必须被拒（403）
await lan.saveSettings({ readOnly: true })
const roClone = await run(['clone', base, join(root, 'clone-ro')])
const roPush = await run(['-C', join(root, 'clone-ro'), 'push', 'origin', 'main'])
result.readOnly = { cloneOk: !roClone.err, pushRejected: !!roPush.err && /403/.test(roPush.errText + roPush.err) }

// 口令闸：无凭据 401，带 Basic 凭据可以正常取 refs
await lan.saveSettings({ readOnly: false, password: 'p@ss word' })
const noCred = await fetch(base + '/info/refs?service=git-upload-pack').then((r) => r.status).catch(() => -1)
const withCred = await fetch(base + '/info/refs?service=git-upload-pack', {
  headers: { authorization: 'Basic ' + Buffer.from('user:p@ss word').toString('base64') },
}).then((r) => r.status).catch(() => -1)
result.password = { noCred, withCred }
await lan.saveSettings({ clearPassword: true })

await lan.stop()
result.stopped = !(await lan.status()).running
rmSync(root, { recursive: true, force: true })
result.cleaned = !existsSync(root)

const ok = result.started && result.lsRemote.refs > 0 && result.clone.hasFile && !result.push.err &&
  result.bareHead.includes('from-lan') && result.indexPage.hasRepoLink &&
  result.readOnly.cloneOk && result.readOnly.pushRejected &&
  result.password.noCred === 401 && result.password.withCred === 200 &&
  result.stopped && result.cleaned
console.log(JSON.stringify(Object.assign({ ok }, result), null, 2))
process.exit(ok ? 0 : 1)
