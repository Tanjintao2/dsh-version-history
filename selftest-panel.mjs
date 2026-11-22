// Full offline render test for the panel: a tiny hook runtime + real data.json.
// Verifies the plugin panel lists projects, renders a version detail on click,
// and switches projects — without a browser.
// Usage: node selftest-panel.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, 'lib', 'client.js'), 'utf8')
const data = JSON.parse(readFileSync('E:/Git/reports/data.json', 'utf8'))
const health = JSON.parse(readFileSync('E:/Git/reports/health.json', 'utf8'))

// ---- tiny hook runtime ------------------------------------------------
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
    return [
      slot.v,
      (next) => {
        const value = typeof next === 'function' ? next(slot.v) : next
        if (value !== slot.v) {
          slot.v = value
          dirty = true
        }
      },
    ]
  },
  useEffect(fn) {
    const i = cursor++
    if (!(i in hooks)) hooks[i] = { ran: false }
    const slot = hooks[i]
    if (!slot.ran) {
      slot.ran = true
      queuedEffects.push(fn)
    }
  },
  useMemo(fn) {
    cursor++
    return fn()
  },
  useCallback(fn) {
    cursor++
    return fn
  },
  useRef(v) {
    const i = cursor++
    if (!(i in hooks)) hooks[i] = { current: v }
    return hooks[i]
  },
}

const req = (id) => {
  if (id === 'react') return React
  throw new Error('unexpected require(' + id + ')')
}

// ---- environment stubs ------------------------------------------------
const fetchCalls = []
globalThis.fetch = (url, opts) => {
  const clean = String(url).replace(/^.*\/version-history/, '')
  fetchCalls.push({ url: clean, method: (opts && opts.method) || 'GET' })
  if (String(url).endsWith('/data.json')) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) })
  }
  if (String(url).endsWith('/disks.json')) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(health) })
  }
  if (String(url).endsWith('/disks/scan')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(Object.assign({}, health, { scan: { ok: true, code: 0, ms: 6400, out: [] } })),
    })
  }
  // SMART 提权扫描：先 /smart/scan，再轮询 /smart.json 的 mtime
if (String(url).endsWith('/smart/scan')) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, requested: true, ms: 8 }) })
}
if (String(url).endsWith('/smart.json')) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ file: 'E:\\Git\\reports\\smart.json', exists: true, bytes: 2048, mtimeMs: Date.now() + 5, mtime: new Date().toISOString() }),
  })
}
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
if (String(url).endsWith('/report')) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, ms: 12 }) })
}
// GitHub：绑定状态（本地没绑过就是未绑定）
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
// GitHub 的写操作（POST /dsh-vh/gh）
if (String(url).indexOf('/dsh-vh/gh') >= 0) {
  const body = JSON.parse((opts && opts.body) || '{}')
  if (body.action === 'repos') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        ok: true,
        login: 'demo',
        count: 2,
        repos: [
          { fullName: 'demo/git-demo', private: false, branch: 'main', pushedAt: '2026-11-22T14:00:00Z' },
          { fullName: 'demo/private-one', private: true, branch: 'master', pushedAt: '2026-11-20T09:00:00Z' },
        ],
      }),
    })
  }
  if (body.action === 'test') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, test: { at: '2026-11-22 22:32:00', ok: true, ms: 5980, heads: 8, tags: 2038, branches: ['main'], err: '' } }),
    })
  }
  if (body.action === 'push') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true, push: { at: '2026-11-22 22:33:00', ok: true, ms: 2100, branch: 'main', tags: true, out: ['To https://github.com/demo/git-demo.git', '   abc1234..def5678  main -> main'], err: '' } }),
    })
  }
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, state: { bound: true, fullName: 'demo/git-demo', hasToken: true, branch: 'main' } }) })
}
return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, ms: 12 }) })
}
const opened = []
globalThis.window = globalThis
globalThis.window.open = (u) => {
  opened.push(String(u))
  return null
}
globalThis.__ModuleLoader__ = {
  load(mod) {
    globalThis.__mod = mod
  },
}

// ---- load & mount the real module -------------------------------------
new Function('window', 'require', src)(globalThis, req)
const mod = globalThis.__mod.factory(req)

let panel = null
let disksTab = null
let lanTab = null
let githubTab = null
const tabsById = {}
const openedTabs = []
const betterSidebar = {
  registerTab(desc) {
    tabsById[desc.id] = desc
    if (desc.id === 'version-history:disks') disksTab = desc
    if (desc.id === 'version-history:lan') lanTab = desc
    if (desc.id === 'version-history:github') githubTab = desc
    return () => {}
  },
  openTab(seed) {
    openedTabs.push({ type: seed && seed.type, target: seed && seed.target })
    return {}
  },
}
const layout = {
  openRightbar(track, fullscreen) {
    openedTabs.push({ rightbar: true, track, fullscreen })
  },
}
const ctx = {
  slots: {
    inject(_key, cb) {
      cb()
    },
    register(options, component) {
      if (options.name === 'main') panel = component
      return () => {}
    },
  },
  effect(cb) {
    const d = cb()
    return typeof d === 'function' ? d : () => {}
  },
  on: () => () => {},
  get: (name) => (name === 'betterSidebar' ? betterSidebar : (name === 'layout' ? layout : undefined)),
}
mod.apply(ctx)
if (!panel) throw new Error('panel component was not registered')
if (!disksTab) throw new Error('betterSidebar.registerTab was not called')

const tick = () => new Promise((r) => setTimeout(r, 0))

// Render until no state settles. Effects queued during a render run right after it.
async function settle(component = panel, maxPasses = 15) {
  let tree = null
  for (let pass = 0; pass < maxPasses; pass += 1) {
    cursor = 0
    dirty = false
    tree = component({})
    const run = queuedEffects
    queuedEffects = []
    run.forEach((fn) => fn())
    await tick()
    await tick()
    if (!dirty) return tree
  }
  return tree
}

// ---- tree helpers -----------------------------------------------------
const walk = (node, out = []) => {
  if (typeof node === 'string') {
    out.push(node)
    return out
  }
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, out))
    return out
  }
  out.push(node)
  walk(node.children, out)
  return out
}
const textOf = (node) => walk(node).filter((n) => typeof n === 'string').join('')
const isEl = (n) => n && typeof n === 'object' && typeof n.type === 'string'
const nodesOf = (tree) => walk(tree).filter(isEl)
const byClass = (tree, cls) => nodesOf(tree).filter((n) => typeof n.props.className === 'string' && n.props.className.split(/\s+/).includes(cls))
const paneText = (tree) => byClass(tree, 'vh-pane').map(textOf).join('\n')

// ---- checks -----------------------------------------------------------
let tree = await settle()
const result = {
  dataGenerated: data.generated,
  fetchCalls: fetchCalls.slice(),
  groups: byClass(tree, 'vh-grp').length,
  versionRows: byClass(tree, 'vh-v').length,
  title: byClass(tree, 'vh-title').map(textOf),
  subtitle: byClass(tree, 'vh-sub').map(textOf),
  overviewPane: paneText(tree).slice(0, 60).replace(/\s+/g, ' '),
  overviewHasStats: byClass(tree, 'vh-card').length,
}

// 左栏「仓库来源」卡片 + 每行仓库名/类型标签/路径
const srcRows = byClass(tree, 'vh-src-row')
result.sourceCard = {
  header: byClass(tree, 'vh-src-h').map(textOf),
  rows: srcRows.map((r) => textOf(r).replace(/\s+/g, ' ').trim()),
  dots: srcRows.map((r) => {
    const d = walk(r).find((c) => isEl(c) && typeof c.props.className === 'string' && c.props.className.indexOf('vh-dot') >= 0)
    return d ? d.props.className : ''
  }),
  miniButtons: byClass(tree, 'vh-mini').map(textOf),
}
result.repoRows = byClass(tree, 'vh-grp-h').map((g) => ({
  name: textOf(g).replace(/\s+/g, ' ').trim().slice(0, 40),
  tag: byClass(g, 'vh-tag').map(textOf),
  tagClass: byClass(g, 'vh-tag').map((t) => t.props.className),
}))
result.repoPaths = byClass(tree, 'vh-repo-path').map(textOf)

// disk capacity chips: drive letter, role, free/total, usage bar
const diskChips = byClass(tree, 'vh-disk')
result.disks = {
  count: diskChips.length,
  drives: diskChips.map((n) => {
    const b = walk(n).find((c) => isEl(c) && c.type === 'b')
    return b ? textOf(b) : ''
  }),
  hasCapacityText: diskChips.some((n) => /剩余 .* \/ /.test(textOf(n))),
  hasBar: diskChips.every((n) => walk(n).some((c) => isEl(c) && c.type === 'i')),
  states: diskChips.map((n) => String(n.props.className).replace('vh-disk ', '')),
  texts: diskChips.map((n) => textOf(n).replace(/\s+/g, ' ').trim()),
}

// 常驻磁盘面板：主面板右列（窄屏由 CSS 收起，树里仍然渲染）。
// 注意：本测试的迷你运行时**不展开嵌套函数组件**，所以这里只断言「列存在 + 传的是 embedded」，
// 列里的真实内容由下面的 disksTab.component 直接渲染来验证。
const dcols = byClass(tree, 'vh-dcol')
const embeddedHost = dcols.length ? walk(dcols[0]).find((n) => n && typeof n === 'object' && typeof n.type === 'function') : null
result.resident = {
  columns: dcols.length,
  embedded: !!(embeddedHost && embeddedHost.props && embeddedHost.props.embedded),
  sameComponentAsTab: !!(embeddedHost && disksTab && embeddedHost.type === disksTab.component),
}

// click the first version row -> detail pane
const vRows = byClass(tree, 'vh-v')
if (vRows.length) {
  vRows[0].props.onClick({ preventDefault() {}, target: null })
  tree = await settle()
  const after = paneText(tree)
  result.afterVersionClick = {
    heading: byClass(tree, 'vh-h2').map(textOf),
    hasDiffRangeOrPublish: after.indexOf('对比区间') >= 0 || after.indexOf('发布：') >= 0,
    fileRows: byClass(tree, 'vh-files').length,
    commitItems: byClass(tree, 'vh-cmts').length,
    excerpt: after.slice(0, 70).replace(/\s+/g, ' '),
  }
}

// click the second project group -> overview switches
const groups = byClass(tree, 'vh-grp-h')
if (groups.length > 1) {
  groups[1].props.onClick({ preventDefault() {}, target: null })
  tree = await settle()
  const after = paneText(tree)
  result.afterProjectClick = {
    heading: byClass(tree, 'vh-h2').map(textOf),
    mentionsProject: after.indexOf(data.repos[1].path) >= 0 || after.indexOf(data.repos[1].name) >= 0,
    statCards: byClass(tree, 'vh-card').length,
    excerpts: after.slice(0, 70).replace(/\s+/g, ' '),
  }
}

// buttons wired?
const buttons = nodesOf(tree).filter((n) => n.type === 'button')
result.buttons = buttons.map((b) => ({ label: textOf(b).trim(), disabled: !!b.props.disabled }))
const openReportBtn = buttons.find((b) => textOf(b).trim() === '新标签打开')
if (openReportBtn) {
  openReportBtn.props.onClick({ preventDefault() {}, target: null })
  result.openReport = opened.slice()
}
// 「磁盘面板」按钮应让 better-sidebar 打开对应 tab，并把右列打开
const openDisksBtn = buttons.find((b) => textOf(b).trim() === '磁盘面板')
if (openDisksBtn) {
  openDisksBtn.props.onClick({ preventDefault() {}, target: null })
  result.openDisks = { openedTabs: openedTabs.slice(), tabId: disksTab.id }
}

// add-repo flow: type a path, press the 加入 button, expect /repos/add then /refresh
const addInput = nodesOf(tree).find((n) => n.type === 'input' && String(n.props.placeholder || '').indexOf('加项目') >= 0)
const addBtn = buttons.find((b) => textOf(b).trim() === '加入')
if (addInput && addBtn) {
  const before = fetchCalls.length
  addInput.props.onChange({ target: { value: 'D:\\tmp\\fake-repo' } })
  tree = await settle()
  const typed = nodesOf(tree).find((n) => n.type === 'input' && String(n.props.placeholder || '').indexOf('加项目') >= 0)
  result.addFlow = { inputPresent: !!typed, valueAfterTyping: typed && typed.props.value, buttonPresent: true }
  const btn2 = nodesOf(tree).filter((n) => n.type === 'button').find((b) => textOf(b).trim() === '加入')
  if (btn2) {
    btn2.props.onClick({ preventDefault() {}, target: null })
    await settle()
    await tick()
    result.addFlow.calls = fetchCalls.slice(before)
    result.addFlow.notice = byClass(tree, 'vh-msg').map(textOf)
  }
} else {
  result.addFlow = { inputPresent: !!addInput, buttonPresent: !!addBtn }
}

// ---- 右侧栏磁盘 tab（DiskTab）----
hooks = []
const beforeDisk = fetchCalls.length
let dtree = await settle(disksTab.component)
const diskCards = byClass(dtree, 'vh-dcard')
const riskBadges = nodesOf(dtree).filter((n) => typeof n.props.className === 'string' && n.props.className.indexOf('vh-risk') >= 0)
result.disksTab = {
  title: byClass(dtree, 'vh-title').map(textOf),
  subtitle: byClass(dtree, 'vh-sub').map(textOf),
  cards: diskCards.length || byClass(dtree, 'vh-card').length,
  kinds: nodesOf(dtree).filter((n) => n.type === 'span' && /^(机械硬盘 HDD|固态硬盘 SSD)$/.test(textOf(n).trim())).map((n) => textOf(n).trim()),
  models: nodesOf(dtree).filter((n) => typeof n.props.className === 'string' && n.props.className === 'nm').map((n) => textOf(n).trim()),
  risks: riskBadges.map((n) => textOf(n).replace(/\s+/g, ' ').trim()),
  attrKeys: nodesOf(dtree).filter((n) => typeof n.props.className === 'string' && n.props.className === 'k').map((n) => textOf(n).trim()),
  volumeChips: byClass(dtree, 'vh-vol').length,
  hints: byClass(dtree, 'vh-hint').map((n) => textOf(n).replace(/\s+/g, ' ').trim()).slice(0, 2),
  fetches: fetchCalls.slice(beforeDisk),
}
// 「扫描」按钮 → /disks/scan
const scanBtn = nodesOf(dtree).filter((n) => n.type === 'button').find((b) => textOf(b).trim() === '扫描')
if (scanBtn) {
  const before = fetchCalls.length
  scanBtn.props.onClick({ preventDefault() {}, target: null })
  await tick()
  await tick()
  dtree = await settle(disksTab.component)
  result.disksTab.scan = {
    calls: fetchCalls.slice(before),
    note: byClass(dtree, 'vh-sub').map(textOf).filter((t) => /已扫描|扫描失败/.test(t)),
  }
}

// 「SMART 提权扫描」按钮 → /smart/scan，然后轮询 /smart.json，文件更新后自动 /disks/scan 合并
const smartBtn = nodesOf(dtree).filter((n) => n.type === 'button').find((b) => /SMART/.test(textOf(b)))
if (smartBtn) {
  const before = fetchCalls.length
  smartBtn.props.onClick({ preventDefault() {}, target: null })
  await tick()
  await new Promise((r) => setTimeout(r, 1800)) // 轮询间隔 1500 ms
  await tick()
  dtree = await settle(disksTab.component)
  result.disksTab.smart = {
    calls: fetchCalls.slice(before).map((c) => c.url),
    hints: byClass(dtree, 'vh-hint').map((n) => textOf(n).replace(/\s+/g, ' ').trim()).slice(0, 2),
  }
}

// 局域网面板：/lan.json → 状态 + 仓库 URL + 启动/停止/开放端口按钮
if (lanTab) {
  hooks = []
  const beforeLan = fetchCalls.length
  let ltree = await settle(lanTab.component)
  result.lanTab = {
    id: lanTab.id,
    order: lanTab.order,
    title: typeof lanTab.title === 'function' ? lanTab.title() : lanTab.title,
    text: textOf(ltree).replace(/\s+/g, ' ').trim().slice(0, 320),
    urls: byClass(ltree, 'vh-url-t').map((n) => textOf(n).trim()),
    buttons: nodesOf(ltree).filter((n) => n.type === 'button').map((b) => textOf(b).trim()),
    fetches: fetchCalls.slice(beforeLan).map((c) => c.url),
  }
  const stopBtn = nodesOf(ltree).filter((n) => n.type === 'button').find((b) => textOf(b).trim() === '停止')
  if (stopBtn) {
    const before = fetchCalls.length
    stopBtn.props.onClick({ preventDefault() {}, target: null })
    await tick()
    await tick()
    ltree = await settle(lanTab.component)
    result.lanTab.stop = { calls: fetchCalls.slice(before).map((c) => c.url) }
  }
}

// GitHub 面板：绑定状态 + 测试连接 + 拉我的仓库 + 手动推送
if (githubTab) {
  hooks = []
  const beforeGh = fetchCalls.length
  let gtree = await settle(githubTab.component)
  const gbuttons = nodesOf(gtree).filter((n) => n.type === 'button').map((b) => textOf(b).trim())
  result.githubTab = {
    id: githubTab.id,
    order: githubTab.order,
    title: typeof githubTab.title === 'function' ? githubTab.title() : githubTab.title,
    buttons: gbuttons.filter(Boolean),
    text: textOf(gtree).replace(/\s+/g, ' ').trim().slice(0, 400),
    inputs: nodesOf(gtree).filter((n) => n.type === 'input' || n.type === 'select').map((n) => (n.props && n.props.placeholder) || (n.type === 'select' ? 'select' : '')),
    fetches: fetchCalls.slice(beforeGh).map((c) => c.url),
  }
  const findBtn = (label) => nodesOf(gtree).filter((n) => n.type === 'button').find((b) => textOf(b).trim() === label)
  const testBtn = findBtn('测试连接')
  if (testBtn) {
    const before = fetchCalls.length
    testBtn.props.onClick({ preventDefault() {}, target: null })
    await tick(); await tick(); await tick()
    gtree = await settle(githubTab.component)
    result.githubTab.test = {
      calls: fetchCalls.slice(before, before + 3).map((c) => c.method + ' ' + c.url),
      text: textOf(gtree).replace(/\s+/g, ' ').trim().slice(0, 300),
    }
  }
  const listBtn = findBtn('拉我的仓库')
  if (listBtn) {
    listBtn.props.onClick({ preventDefault() {}, target: null })
    await tick(); await tick(); await tick()
    gtree = await settle(githubTab.component)
    result.githubTab.repos = {
      buttons: nodesOf(gtree).filter((n) => n.type === 'button').map((b) => textOf(b).trim()).filter((t) => t.indexOf('/') > 0),
      text: textOf(gtree).replace(/\s+/g, ' ').trim().slice(0, 300),
    }
  }
  const pushBtn = findBtn('推送到 GitHub')
  if (pushBtn) {
    const before = fetchCalls.length
    pushBtn.props.onClick({ preventDefault() {}, target: null })
    await tick(); await tick(); await tick()
    gtree = await settle(githubTab.component)
    result.githubTab.push = {
      calls: fetchCalls.slice(before, before + 2).map((c) => c.method + ' ' + c.url),
      text: textOf(gtree).replace(/\s+/g, ' ').trim().slice(0, 260),
    }
  }
}

// 主面板内的子视图：点顶栏 / 左栏按钮后，面板自己也要切过去（不依赖 better-sidebar）
{
  hooks = []
  let tree = await settle(panel)
  const btns = () => nodesOf(tree).filter((n) => n.type === 'button')
  const ghBtn = btns().find((b) => /^GitHub/.test(textOf(b).trim()))
  if (ghBtn) {
    const before = fetchCalls.length
    ghBtn.props.onClick({ preventDefault() {}, target: null })
    await tick(); await tick()
    tree = await settle(panel)
    result.inlineView = {
      // 迷你运行时不会展开嵌套函数组件，所以这里只断言「视图切过去了 + 子栏标题对」，
      // GitHub 表单本身在 githubTab 那段已单独渲染验证过。
      afterGithub: {
        hasBack: textOf(tree).indexOf('← 返回') >= 0,
        subbarTitle: nodesOf(tree).filter((n) => n.props && n.props.className === 'vh-subbar').map((n) => textOf(n).replace(/\s+/g, ' ').trim())[0] || '',
        fetches: fetchCalls.slice(before).map((c) => c.method + ' ' + c.url),
      },
    }
    const back = nodesOf(tree).filter((n) => n.type === 'button').find((b) => textOf(b).trim() === '← 返回')
    if (back) {
      back.props.onClick({ preventDefault() {}, target: null })
      await tick(); await tick()
      tree = await settle(panel)
      result.inlineView.backToMain = textOf(tree).indexOf('仓库来源') >= 0 && textOf(tree).indexOf('测试连接') < 0
    }
    // 左栏来源卡里的「绑定 / 管理」按钮也要能切到 GitHub 视图
    const gv = nodesOf(tree).filter((n) => n.type === 'button').find((b) => (b.props && /GitHub/.test(String(b.props.title || ''))))
    if (gv) {
      gv.props.onClick({ preventDefault() {}, target: null })
      await tick(); await tick()
      tree = await settle(panel)
      result.inlineView.fromSourceCard = {
        label: textOf(gv).trim(),
        subbarTitle: nodesOf(tree).filter((n) => n.props && n.props.className === 'vh-subbar').map((n) => textOf(n).replace(/\s+/g, ' ').trim())[0] || '',
      }
    }
  }

  // 顶栏「备份」→ 面板内切到「备份设置」子视图（不依赖右侧栏）
  {
    hooks = []
    let t2 = await settle(panel)
    const bk = nodesOf(t2).filter((n) => n.type === 'button').find((b) => textOf(b).trim() === '备份')
    result.backupView = { found: !!bk }
    if (bk) {
      const before = fetchCalls.length
      bk.props.onClick({ preventDefault() {}, target: null })
      await tick(); await tick()
      t2 = await settle(panel)
      result.backupView.subbarTitle = nodesOf(t2)
        .filter((n) => n.props && n.props.className === 'vh-subbar')
        .map((n) => textOf(n).replace(/\s+/g, ' ').trim())[0] || ''
      result.backupView.hasBack = textOf(t2).indexOf('← 返回') >= 0
      result.backupView.fetches = fetchCalls.slice(before).map((c) => c.method + ' ' + c.url)
    }
  }
}

console.log(JSON.stringify(result, null, 2))
// 组件里可能留下 150 s 的兜底 setTimeout，测试结束直接退出，别让 node 干等。
process.exit(0)
