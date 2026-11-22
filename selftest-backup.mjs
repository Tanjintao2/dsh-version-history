/**
 * selftest-backup.mjs · 直接测 lib/backup.js（不经过 DSH、不需要 GUI）
 *
 * 覆盖：
 *   1) 不设密码时 setMirror / runCopy 直接可用
 *   2) 一键拷贝：两个裸仓都被镜像（HEAD 一致）+ 各打 bundle
 *   3) bundle 按 keep 轮转（跑 3 次、keep=2 → 只剩 2 份/仓）
 *   4) 设密码后：不带密码需 needPassword、错密码 badPassword、对密码才通过
 *   5) mode:'none' → passwordMode='none'，之后不再校验
 *
 * 用法：node selftest-backup.mjs
 */
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, writeFile, readdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createBackup } from './lib/backup.js'

const GIT = process.env.DSH_VH_GIT || 'git'

function run(cwd, args) {
  return new Promise((resolve) => {
    execFile(GIT, args, { cwd, windowsHide: true, timeout: 120000 }, (err, stdout, stderr) => {
      resolve({ ok: !err, code: err ? (err.code ?? 1) : 0, out: String(stdout || ''), err: String(stderr || '') })
    })
  })
}

async function seedRepo(reposRoot, name) {
  const bare = join(reposRoot, name + '.git')
  await run(reposRoot, ['init', '--bare', '-b', 'main', bare])
  const work = join(reposRoot, '..', 'work-' + name)
  await mkdir(work, { recursive: true })
  await run(work, ['init', '-b', 'main'])
  await run(work, ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '--allow-empty', '-m', 'init ' + name])
  await writeFile(join(work, 'README.md'), '# ' + name + '\n', 'utf8')
  await run(work, ['add', '.'])
  await run(work, ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-m', 'add readme'])
  const push = await run(work, ['push', bare, 'main:main'])
  const head = await run(bare, ['rev-parse', 'HEAD'])
  return { bare, head: head.out.trim(), pushOk: push.ok }
}

async function exists(p) {
  try { await stat(p); return true } catch { return false }
}

const root = await mkdtemp(join(tmpdir(), 'vh-bk-'))
const reposRoot = join(root, 'repos')
const mirror = join(root, 'mirror')
const backupPath = join(root, 'reports', 'backup.json')
await mkdir(reposRoot, { recursive: true })

const a = await seedRepo(reposRoot, 'alpha')
const b = await seedRepo(reposRoot, 'beta')

const bk = createBackup({ gitExe: GIT, reposRoot, backupPath, backupKeep: 2 })
const result = { root, seeded: { alpha: a.pushOk, beta: b.pushOk } }

// 1) 没密码可直接设镜像
result.setMirrorNoPw = await bk.setMirror({ mirror })
result.status1 = await bk.status()

// 2) 一键拷贝
result.run1 = await bk.runCopy({})
const mirrorA = join(mirror, 'alpha.git')
const mirrorB = join(mirror, 'beta.git')
const headA = (await run(mirror, ['-C', mirrorA, 'rev-parse', 'HEAD'])).out.trim()
const headB = (await run(mirror, ['-C', mirrorB, 'rev-parse', 'HEAD'])).out.trim()
result.mirrored = {
  alpha: { exists: await exists(mirrorA), headMatches: headA === a.head, head: headA.slice(0, 7) },
  beta: { exists: await exists(mirrorB), headMatches: headB === b.head, head: headB.slice(0, 7) },
}

// 3) 再跑两次 → bundle 按 keep=2 轮转
await bk.runCopy({})
result.run3 = await bk.runCopy({})
const bundleDir = join(mirror, 'bundles')
const bundlesA = (await readdir(bundleDir)).filter((f) => f.startsWith('alpha-'))
const bundlesB = (await readdir(bundleDir)).filter((f) => f.startsWith('beta-'))
result.bundles = { alpha: bundlesA.length, beta: bundlesB.length, keep: 2 }

// 4) 设密码后的 gate
result.setPw = await bk.setPassword({ password: 'abcd1234' })
result.gate = {
  noPw: await bk.setMirror({ mirror: join(root, 'mirror2') }),
  badPw: await bk.setMirror({ mirror: join(root, 'mirror2'), password: 'wrong' }),
  goodPw: await bk.setMirror({ mirror: join(root, 'mirror3'), password: 'abcd1234' }),
  runNoPw: await bk.runCopy({}),
  runBadPw: await bk.runCopy({ password: 'nope' }),
}
result.status2 = await bk.status()

// 5) 改成不设密码
result.clearToNone = await bk.setPassword({ mode: 'none' })
result.status3 = await bk.status()

// 汇总
result.ok = !!(
  result.setMirrorNoPw.ok
  && result.run1.ok
  && result.mirrored.alpha.headMatches && result.mirrored.beta.headMatches
  && result.bundles.alpha <= 2 && result.bundles.beta <= 2
  && result.gate.noPw.needPassword === true
  && result.gate.badPw.badPassword === true
  && result.gate.goodPw.ok === true
  && result.gate.runNoPw.needPassword === true
  && result.status2.hasPassword === true
  && result.status3.passwordMode === 'none' && result.status3.hasPassword === false
)

console.log(JSON.stringify(result, null, 2))

// 清理临时目录（保留 backup.json 供排查？——调试时用 VH_KEEP=1 保留）
if (!process.env.VH_KEEP) {
  try { await rm(root, { recursive: true, force: true }) } catch { /* ignore */ }
}
process.exit(result.ok ? 0 : 1)
