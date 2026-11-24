// Render the plugin's real component trees (real data.json / health.json) to static HTML previews.
// The client half is written as plain createElement trees, so serializing the tree is enough —
// this is exactly what the plugin draws, not hand-written markup.
//
// Usage:
//   node render-preview.mjs                     -> preview-disks.html   (right-sidebar 磁盘 tab)
//   node render-preview.mjs --panel             -> preview-main.html    (main panel incl. 常驻磁盘列)
//   node render-preview.mjs --lan               -> preview-lan.html     (right-sidebar 局域网 tab)
//   node render-preview.mjs --github            -> preview-github.html  (right-sidebar GitHub tab)
//   node render-preview.mjs out.html --panel
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const panelMode = args.includes('--panel')
const lanMode = args.includes('--lan')
const githubMode = args.includes('--github')
const backupMode = args.includes('--backup')
const aboutMode = args.includes('--about')
const out = args.find((a) => !a.startsWith('--')) ||
  join(here, aboutMode ? 'preview-about.html'
    : (panelMode ? 'preview-main.html'
      : (lanMode ? 'preview-lan.html'
        : (githubMode ? 'preview-github.html'
          : (backupMode ? 'preview-backup.html' : 'preview-disks.html')))))

const src = readFileSync(join(here, 'lib', 'client.js'), 'utf8')
const health = JSON.parse(readFileSync(process.env.VH_HEALTH || 'E:/Git/reports/health.json', 'utf8'))
const data = JSON.parse(readFileSync(process.env.VH_DATA || 'E:/Git/reports/data.json', 'utf8'))

// 预览页是给 README 截图用的，所以一律用中性占位替换本机身份信息：
// 家目录（含 Windows 用户名）、物理盘型号/序列号、镜像根目录、局域网 IP 都不进图。
const DEMO_ROOT = 'D:\\repos'
const DEMO_MIRROR = 'D:\\GitMirror'
const DEMO_LAN_IP = '192.168.1.10'
const baseName = (p) => String(p ?? '').split(/[\\/]/).filter(Boolean).pop() || ''

for (const r of data.repos ?? []) {
  r.path = DEMO_ROOT + '\\' + (r.name || baseName(r.path))
}
if (data.primary) data.primary = DEMO_ROOT + '\\' + baseName(data.primary)
if (Array.isArray(data.mirror)) {
  for (const m of data.mirror) if (m && m.path) m.path = DEMO_MIRROR + '\\' + baseName(m.path)
}
for (const [i, d] of (health.disks ?? []).entries()) {
  const size = d.sizeGB ? Math.round(d.sizeGB) + 'GB' : ''
  d.model = ['Demo SSD', 'Demo HDD'][d.kind === 'HDD' ? 1 : 0] + (size ? ' ' + size : '')
  d.serial = 'SN-DEMO-' + String(i + 1).padStart(2, '0')
  if (d.smart && typeof d.smart === 'object') {
    delete d.smart.serial
    delete d.smart.model
  }
}

let hooks = []
let cursor = 0
let dirty = false
let queuedEffects = []

function createElement(type, props, ...children) {
  return { type, props: props ?? {}, children: children.flat(Infinity) }
}

const React = {
  createElement,
  Fragment: 'Fragment',
  useState(initial) {
    const i = cursor++
    if (!(i in hooks)) hooks[i] = { v: typeof initial === 'function' ? initial() : initial }
    const slot = hooks[i]
    return [slot.v, (next) => {
      const value = typeof next === 'function' ? next(slot.v) : next
      if (value !== slot.v) { slot.v = value; dirty = true }
    }]
  },
  useEffect(fn) {
    const i = cursor++
    if (!(i in hooks)) hooks[i] = { ran: false }
    const slot = hooks[i]
    if (!slot.ran) { slot.ran = true; queuedEffects.push(fn) }
  },
  useMemo(fn) { cursor++; return fn() },
  useCallback(fn) { cursor++; return fn },
  useRef(v) { const i = cursor++; if (!(i in hooks)) hooks[i] = { current: v }; return hooks[i] },
}

const req = (id) => {
  if (id === 'react') return React
  throw new Error('unexpected require(' + id + ')')
}

globalThis.fetch = (url) => {
  if (String(url).endsWith('/disks.json')) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(health) })
  if (String(url).endsWith('/diag.json')) {
    const now = new Date().toISOString()
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        plugin: { name: 'dsh-version-history', version: '0.1.16', root: 'D:\\plugins\\dsh-version-history' },
        node: 'v24.21.0',
        pid: 4242,
        uptimeSec: 3600,
        routes: [
          { method: 'GET', path: '/version-history/health' },
          { method: 'GET', path: '/version-history/data.json' },
          { method: 'GET', path: '/version-history/disks.json' },
          { method: 'GET', path: '/version-history/backup.json' },
          { method: 'GET', path: '/version-history/github.json' },
          { method: 'GET', path: '/version-history/diag.json' },
          { method: 'POST', path: '/dsh-vh/gh' },
          { method: 'POST', path: '/dsh-vh/backup' },
        ],
        files: [
          { path: 'D:\\reports\\data.json', exists: true, bytes: 65913, mtime: now },
          { path: 'D:\\reports\\health.json', exists: true, bytes: 9141, mtime: now },
          { path: 'D:\\reports\\backup.json', exists: true, bytes: 1938, mtime: now },
          { path: 'D:\\reports\\github.json', exists: true, bytes: 812, mtime: now },
          { path: 'D:\\reports\\smart.json', exists: true, bytes: 14373, mtime: now },
          { path: 'D:\\reports\\repos.json', exists: true, bytes: 259, mtime: now },
          { path: 'D:\\reports\\history.html', exists: true, bytes: 77390, mtime: now },
        ],
      }),
    })
  }
  if (String(url).endsWith('/data.json')) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) })
  if (String(url).endsWith('/lan.json')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        running: true,
        port: 8788,
        startedAt: new Date().toISOString(),
        root: 'D:\\repos',
        repos: ['local.git'],
        ips: [{ address: '192.168.1.10', name: '以太网 2' }],
        urls: ['http://192.168.1.10:8788/git/local.git'],
        error: null,
      }),
    })
  }
  if (String(url).indexOf('/dsh-vh/backup') >= 0) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, mirror: 'D:\\GitMirror', keep: 10 }),
    })
  }
  if (String(url).endsWith('/backup.json')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        file: 'D:\\reports\\backup.json',
        exists: false,
        mirror: 'D:\\GitMirror',
        keep: 10,
        reposRoot: 'D:\\repos',
        hasPassword: !process.env.VH_BK_FRESH,
        passwordMode: process.env.VH_BK_FRESH ? '' : 'set',
        lastRun: {
          at: '2026-11-23T00:52:10.000Z',
          mirror: 'D:\\GitMirror',
          ok: true,
          count: 4,
          okCount: 4,
          ms: 2140,
          repos: [
            { name: 'local', head: '5cc1340', bundleBytes: 61234, pruned: 0 },
            { name: 'dsh-rhino-plugin', head: '8f4f0f1', bundleBytes: 918233, pruned: 1 },
            { name: 'handoff', head: '23c074a', bundleBytes: 41233, pruned: 0 },
            { name: 'dsh-version-history', head: 'e22112d', bundleBytes: 140233, pruned: 1 },
          ],
        },
      }),
    })
  }
  if (String(url).indexOf('/dsh-vh/gh') >= 0) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, state: { bound: true, fullName: 'demo/git-demo', hasToken: true, branch: 'main' } }),
    })
  }
  if (String(url).endsWith('/github.json')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        bound: true,
        owner: 'demo',
        repo: 'git-demo',
        fullName: 'demo/git-demo',
        url: 'https://github.com/demo/git-demo.git',
        branch: 'main',
        repoPath: 'D:\\repos\\local',
        hasToken: true,
        tokenMasked: 'ghp_…cd34',
        updatedAt: '2026-11-22 22:30:00',
        lastTest: { at: '2026-11-22 22:30:10', ok: true, ms: 6100, heads: 8, tags: 2038, branches: ['main', 'dev'] },
        lastPush: { at: '2026-11-22 22:31:00', ok: true, ms: 2400, branch: 'main', tags: true },
      }),
    })
  }
  if (String(url).endsWith('/repos')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        file: 'D:\\reports\\repos.json',
        repos: (data.repos || []).map((r) => r.path),
      }),
    })
  }
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, ms: 6400, out: [] }) })
}
globalThis.window = globalThis
globalThis.window.open = () => null
// VH_LANG=en 时以英文渲染（client.js 从 localStorage 的 dsh-vh-lang 读语言）
if (process.env.VH_LANG) {
  const store = { 'dsh-vh-lang': process.env.VH_LANG }
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
  }
}
globalThis.__ModuleLoader__ = { load(mod) { globalThis.__mod = mod } }

new Function('window', 'require', src)(globalThis, req)
const mod = globalThis.__mod.factory(req)

let panel = null
let disksTab = null
const tabs = {}
mod.apply({
  slots: { inject: (_k, cb) => cb(), register: (options, component) => { if (options.name === 'main') panel = component; return () => {} } },
  effect: (cb) => { const d = cb(); return typeof d === 'function' ? d : () => {} },
  on: () => () => {},
  get: (name) => (name === 'betterSidebar' ? {
    registerTab: (d) => { tabs[d.id] = d; if (d.id === 'version-history:disks') disksTab = d; return () => {} },
    openTab: () => ({}),
  } : undefined),
})
if (!disksTab) throw new Error('disks tab was not registered')
if (lanMode && !tabs['version-history:lan']) throw new Error('lan tab was not registered')
if (githubMode && !tabs['version-history:github']) throw new Error('github tab was not registered')
if (backupMode && !tabs['version-history:backup']) throw new Error('backup tab was not registered')
if (aboutMode && !tabs['version-history:about']) throw new Error('about tab was not registered')
if (panelMode && !panel) throw new Error('main panel was not registered')

const tick = () => new Promise((r) => setTimeout(r, 0))

// 每次渲染一个组件前把钩子表清空（迷你运行时没有组件实例的概念）
// mutate：先让组件自己稳定（等 fetch 落地），再对树做一次「交互」（例如触发右键菜单）并继续重渲染。
async function renderComponent(component, props, mutate) {
  hooks = []
  let tree = null
  const pass = async () => {
    cursor = 0
    dirty = false
    tree = component(props || {})
    const run = queuedEffects
    queuedEffects = []
    run.forEach((fn) => fn())
    await tick()
    await tick()
  }
  for (let i = 0; i < 12; i += 1) {
    await pass()
    if (!dirty) break
  }
  if (mutate && tree) {
    mutate(tree)
    for (let i = 0; i < 6; i += 1) {
      await pass()
      if (!dirty) break
    }
  }
  return tree
}

// 在渲染树上按文字找第一个按钮/元素（给 --about 点「关于」用）
function findByText(node, text) {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findByText(n, text)
      if (hit) return hit
    }
    return null
  }
  if (node.props && node.props.onClick) {
    const kids = node.children || []
    for (const k of kids) {
      if (typeof k === 'string' && k.trim() === text) return node
      if (k && typeof k === 'object' && Array.isArray(k.children) && k.children.some((x) => typeof x === 'string' && x.trim() === text)) return node
    }
  }
  for (const child of node.children || []) {
    const hit = findByText(child, text)
    if (hit) return hit
  }
  return null
}

// 在渲染树上按 className 找第一个元素（给 VH_MENU 用）
function findByClass(node, cls) {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findByClass(n, cls)
      if (hit) return hit
    }
    return null
  }
  if (typeof node.type === 'string' && node.props && typeof node.props.className === 'string' && node.props.className.split(/\s+/).indexOf(cls) >= 0) {
    return node
  }
  for (const child of node.children || []) {
    const hit = findByClass(child, cls)
    if (hit) return hit
  }
  return null
}

// ---- tree -> html ----
let css = ''
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function render(node) {
  if (node === null || node === undefined || node === false || node === true) return ''
  if (typeof node === 'string' || typeof node === 'number') return esc(node)
  if (Array.isArray(node)) return node.map(render).join('')
  if (typeof node !== 'object') return ''
  const { type, props, children } = node
  if (type === 'style') { css += String(children[0] ?? ''); return '' }
  if (typeof type !== 'string') return render(children)
  const attrs = []
  const cls = props.className
  if (cls) attrs.push('class="' + esc(cls) + '"')
  if (props.title) attrs.push('title="' + esc(props.title) + '"')
  if (props.style) {
    const st = Object.keys(props.style).map((k) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()) + ':' + props.style[k]).join(';')
    attrs.push('style="' + esc(st) + '"')
  }
  if (type === 'input') {
    if (props.type) attrs.push('type="' + esc(props.type) + '"')
    if (props.type === 'checkbox') { if (props.checked) attrs.push('checked') }
    else attrs.push('placeholder="' + esc(props.placeholder || '') + '" value="' + esc(props.value || '') + '"')
  }
  const body = render(children)
  const voidTag = type === 'input' || type === 'br' || type === 'img'
  return '<' + type + (attrs.length ? ' ' + attrs.join(' ') : '') + '>' + (voidTag ? '' : body + '</' + type + '>')
}

// 主面板里的常驻磁盘列是一个嵌套函数组件，迷你运行时不展开它 —— 单独渲染后拼进那一列。
const diskHtml = render(await renderComponent(disksTab.component, { embedded: true }))
let body = ''
if (panelMode) {
  // VH_MENU=1：渲染后自动在第一个仓库行上触发右键菜单，用来截「推私有 / 推公开」菜单
  const triggerMenu = process.env.VH_MENU
    ? (tree) => {
      const head = findByClass(tree, 'vh-grp-h')
      if (head && head.props.onContextMenu) {
        head.props.onContextMenu({ preventDefault() {}, stopPropagation() {}, clientX: 60, clientY: 208 })
      }
    }
    : null
  body = render(await renderComponent(panel, {}, triggerMenu))
  body = body.replace('<aside class="vh-dcol"></aside>', '<aside class="vh-dcol">' + diskHtml + '</aside>')
} else if (aboutMode) {
  body = render(await renderComponent(tabs['version-history:about'].component, {}))
} else if (lanMode) {
  body = render(await renderComponent(tabs['version-history:lan'].component, {}))
} else if (githubMode) {
  body = render(await renderComponent(tabs['version-history:github'].component, {}))
} else if (backupMode) {
  body = render(await renderComponent(tabs['version-history:backup'].component, {}))
} else {
  body = diskHtml
}

const frameCss = panelMode
  ? `.frame{width:1240px;height:calc(100vh - 28px);}`
  : `.frame{width:520px;height:calc(100vh - 28px);}`
const barTitle = aboutMode ? '主面板 · 关于 / 诊断' : (panelMode ? '主面板 · GIT管理（含常驻磁盘列）'
  : (lanMode ? '右侧栏 · 局域网 Git'
    : (githubMode ? '右侧栏 · GitHub'
      : (backupMode ? '主面板 · 备份设置' : '右侧栏 · 磁盘'))))

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>${panelMode ? '主面板预览' : (githubMode ? 'GitHub 面板预览' : (backupMode ? '备份设置预览' : '磁盘面板预览'))}</title>
<style>
  :root{
    --dsw-alias-bg-base:#16191d; --dsw-alias-bg-layer-1:#1b1f24; --dsw-alias-bg-layer-2:#232830;
    --dsw-alias-border-l1:#2f353d; --dsw-alias-border-l2:#3d444e;
    --dsw-alias-label-primary:#e6e9ee; --dsw-alias-label-secondary:#8b939c;
    --dsw-alias-brand-primary:#5b9cf6; --dsw-alias-state-success-primary:#49c07a;
    --dsw-alias-state-warn-primary:#e0a33e; --dsw-alias-state-error-primary:#e06c6c;
    --dsw-alias-state-idle-primary:#6b7280;
  }
  html,body{margin:0;background:#111417;}
  body{display:flex;justify-content:center;padding:14px;}
  ${frameCss}
  .frame{display:flex;flex-direction:column;border:1px solid #2b3037;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.45);background:#16191d;}
  .bar{display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid #2b3037;color:#8b939c;font:12px "Segoe UI",system-ui}
  .bar b{color:#e6e9ee;font-weight:600}
  .dot{width:8px;height:8px;border-radius:50%;background:#49c07a}
  .host{flex:1;min-height:0;display:flex;flex-direction:column}
  .host > .vh-dtab, .host > .vh{flex:1;min-height:0}
  .host .vh-dcol .vh-dtab{height:100%}
${css}
</style></head>
<body><div class="frame"><div class="bar"><span class="dot"></span><b>${barTitle}</b><span>（组件真实渲染；主题变量用深色值近似）</span></div>
<div class="host">${body}</div></div></body></html>`

writeFileSync(out, html, 'utf8')
console.log(JSON.stringify({
  out,
  mode: panelMode ? 'panel' : (lanMode ? 'lan' : (githubMode ? 'github' : (backupMode ? 'backup' : 'disks'))),
  bytes: Buffer.byteLength(html, 'utf8'),
  cards: (body.match(/class="vh-card"/g) || []).length,
  risks: (body.match(/vh-risk (ok|warn|bad)/g) || []).slice(0, 6),
  kinds: (body.match(/(机械硬盘 HDD|固态硬盘 SSD)/g) || []).length,
  hasScanButton: body.indexOf('>扫描<') >= 0,
  hasSmartButton: body.indexOf('SMART 提权扫描') >= 0,
  hasDiskColumn: body.indexOf('vh-dcol') >= 0,
  urls: (body.match(/class="vh-url-t"/g) || []).length,
  hasGithubBadge: body.indexOf('已绑定') >= 0,
  hasPushButton: body.indexOf('推送到 GitHub') >= 0,
}, null, 2))

// Panel 现在带 15s 的局域网状态轮询，不清掉计时器的话 node 不会自己退出
process.exit(0)
