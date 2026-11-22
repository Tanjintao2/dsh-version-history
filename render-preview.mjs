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
const out = args.find((a) => !a.startsWith('--')) ||
  join(here, panelMode ? 'preview-main.html'
    : (lanMode ? 'preview-lan.html'
      : (githubMode ? 'preview-github.html'
        : (backupMode ? 'preview-backup.html' : 'preview-disks.html'))))

const src = readFileSync(join(here, 'lib', 'client.js'), 'utf8')
const health = JSON.parse(readFileSync(process.env.VH_HEALTH || 'E:/Git/reports/health.json', 'utf8'))
const data = JSON.parse(readFileSync(process.env.VH_DATA || 'E:/Git/reports/data.json', 'utf8'))

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
  if (String(url).endsWith('/data.json')) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) })
  if (String(url).endsWith('/lan.json')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        running: true,
        port: 8788,
        startedAt: new Date().toISOString(),
        root: 'E:\\Git\\repos',
        repos: ['local.git'],
        ips: [{ address: '192.168.3.38', name: '以太网 2' }],
        urls: ['http://192.168.3.38:8788/git/local.git'],
        error: null,
      }),
    })
  }
  if (String(url).indexOf('/dsh-vh/backup') >= 0) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, mirror: 'I:\\GitBackup', keep: 10 }),
    })
  }
  if (String(url).endsWith('/backup.json')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        file: 'E:\\Git\\reports\\backup.json',
        exists: false,
        mirror: 'I:\\GitBackup',
        keep: 10,
        reposRoot: 'E:\\Git\\repos',
        hasPassword: !process.env.VH_BK_FRESH,
        passwordMode: process.env.VH_BK_FRESH ? '' : 'set',
        lastRun: {
          at: '2026-11-23T00:52:10.000Z',
          mirror: 'I:\\GitBackup',
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
        repoPath: 'E:\\Git\\work\\local',
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
        file: 'E:\\Git\\reports\\repos.json',
        repos: (data.repos || []).map((r) => r.path),
      }),
    })
  }
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, ms: 6400, out: [] }) })
}
globalThis.window = globalThis
globalThis.window.open = () => null
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
if (panelMode && !panel) throw new Error('main panel was not registered')

const tick = () => new Promise((r) => setTimeout(r, 0))

// 每次渲染一个组件前把钩子表清空（迷你运行时没有组件实例的概念）
async function renderComponent(component, props) {
  hooks = []
  let tree = null
  for (let pass = 0; pass < 12; pass += 1) {
    cursor = 0
    dirty = false
    tree = component(props || {})
    const run = queuedEffects
    queuedEffects = []
    run.forEach((fn) => fn())
    await tick()
    await tick()
    if (!dirty) break
  }
  return tree
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
  body = render(await renderComponent(panel, {}))
  body = body.replace('<aside class="vh-dcol"></aside>', '<aside class="vh-dcol">' + diskHtml + '</aside>')
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
const barTitle = panelMode ? '主面板 · GIT管理（含常驻磁盘列）'
  : (lanMode ? '右侧栏 · 局域网 Git'
    : (githubMode ? '右侧栏 · GitHub'
      : (backupMode ? '主面板 · 备份设置' : '右侧栏 · 磁盘')))

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
