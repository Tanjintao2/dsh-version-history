// Maintainer tool: turn a real `data.json` / `health.json` (produced by visualize.ps1
// and disk-health.ps1 on the author's machine) into the neutral fixture used by
// `selftest-panel.mjs` on CI. Everything identifying is replaced: repo names, paths,
// commit subjects/authors, file names, disk models/serials, volume labels.
//
// Usage: node test/build-fixture.mjs [--data <path>] [--health <path>]
// Writes: test/fixture-data.json, test/fixture-health.json
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const argOf = (flag, fallback) => {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const dataPath = argOf('--data', 'E:/Git/reports/data.json')
const healthPath = argOf('--health', 'E:/Git/reports/health.json')

const DEMO_ROOT = 'D:\\repos'
const DEMO_MIRROR = 'D:\\GitMirror'
const ISO = '2026-01-01T00:00:00+08:00'
const WHEN = '2026-01-01'

const sha7 = (n) => ['a1b2c3d', 'b2c3d4e', 'c3d4e5f', 'd4e5f60', 'e5f6071'][n % 5]
const sha40 = (n) => (sha7(n) + '4e5f60718293a4b5c6d7e8f9012345678').slice(0, 40)
const repoName = (i) => ['demo-app', 'demo-docs', 'demo-tools', 'demo-site'][i % 4]

// Keep the extension, drop the real name.
const DIRS = ['src', 'docs', 'scripts', 'lib', 'assets', 'test']
function neutralPath(i) {
  const exts = ['.js', '.md', '.json', '.css', '.txt', '.mjs']
  return DIRS[i % DIRS.length] + '/demo-' + (i + 1) + exts[i % exts.length]
}

const data = JSON.parse(readFileSync(dataPath, 'utf8'))
const health = JSON.parse(readFileSync(healthPath, 'utf8'))

// ---- data.json ---------------------------------------------------------
data.generated = '2026-01-01 00:00:00'
data.primary = DEMO_ROOT + '\\' + repoName(0)

if (data.mirror && typeof data.mirror === 'object' && !Array.isArray(data.mirror)) {
  data.mirror = { ...data.mirror, path: DEMO_MIRROR + '\\' + repoName(0) + '.git', head: sha7(0) }
}
if (typeof data.backup === 'string' && data.backup) {
  data.backup =
    '2026-01-01 00:00:00 OK mirror-synced; bundle=demo-app-20260101-000000.bundle (0.01 MB); head=' +
    sha7(0) + ' refs=2 elapsed=0.6s'
}

data.repos = (data.repos ?? []).slice(0, 2).map((r, i) => {
  const name = repoName(i)
  const fileList = (Array.isArray(r.fileList) ? r.fileList : []).map((f, k) => ({
    ...f,
    p: neutralPath(k),
    when: WHEN,
  }))
  const commits = (Array.isArray(r.commits) ? r.commits : []).map((c, k) => ({
    ...c,
    h: sha7(k),
    hash: sha40(k),
    iso: ISO,
    author: 'Demo User',
    subject: 'demo commit ' + (k + 1),
    refs: ['main'],
    files: (Array.isArray(c.files) ? c.files : []).map((f, j) => ({ ...f, p: neutralPath(j) })),
  }))
  const versions = (Array.isArray(r.versions) ? r.versions : []).map((v, j) => ({
    ...v,
    tag: 'v0.0.' + (j + 1),
    date: ISO,
    hash: sha7(j),
    base: sha40(j + 1),
    message: 'demo version ' + (j + 1),
    files: (Array.isArray(v.files) ? v.files : []).map((f, k) => ({ ...f, p: neutralPath(k) })),
    commits: (Array.isArray(v.commits) ? v.commits : []).map((c, k) => ({
      ...c,
      h: sha7(k),
      subject: 'demo commit ' + (k + 1),
    })),
  }))
  return {
    ...r,
    name,
    path: DEMO_ROOT + '\\' + name,
    branch: r.branch || 'main',
    head: sha7(0),
    lastHash: sha7(0),
    lastWhen: WHEN,
    lastMsg: 'demo commit',
    fileList,
    commits,
    versions,
  }
})

data.disks = (data.disks ?? []).map((d, i) => {
  const gb = Math.round((Number(d.total) || 0) / 1e9 * 10) / 10
  return {
    ...d,
    label: 'Demo' + (i + 1),
    freeText: Math.round(gb * 0.5 * 10) / 10 + ' GB',
    totalText: gb + ' GB',
  }
})

// ---- health.json -------------------------------------------------------
health.scanned = '2026-01-01 00:00:00'
if (typeof health.file === 'string') health.file = 'D:\\reports\\smart.json'
if (health.smart && typeof health.smart === 'object' && typeof health.smart.file === 'string') {
  health.smart = { ...health.smart, file: 'D:\\reports\\smart.json' }
}
health.disks = (health.disks ?? []).map((d, i) => ({
  ...d,
  model: (d.kind === 'SSD' ? 'Demo SSD ' : 'Demo HDD ') + Math.round(Number(d.sizeGB) || 0) + 'GB',
  serial: 'SN-DEMO-' + String(i + 1).padStart(2, '0'),
  volumes: (d.volumes ?? []).map((v, j) => ({ ...v, label: 'Demo' + (j + 1) })),
  smart: d.smart
    ? { ...d.smart, serial: undefined, model: undefined, ataInstance: undefined }
    : d.smart,
}))

// ---- write -------------------------------------------------------------
const write = (name, value) => {
  const p = join(here, name)
  const text = JSON.stringify(value, null, 2) + '\n'
  writeFileSync(p, text, 'utf8')
  console.log('wrote ' + name + ' (' + Buffer.byteLength(text) + ' bytes)')
}
write('fixture-data.json', data)
write('fixture-health.json', health)
