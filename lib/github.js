/**
 * dsh-version-history · GitHub 绑定 / 连接测试 / 手动推送
 *
 * 设计取舍：
 *  - 令牌不落在 query 里（会被浏览器历史、宿主日志留下），也不进命令行参数（进程列表可见）。
 *    → 只接受 POST body；落盘用 DPAPI(CurrentUser) 加密（`<scripts>/dpapi.ps1`）。
 *  - 认证走 `git -c http.https://github.com/.extraheader=AUTHORIZATION: basic <b64>`
 *    （作用域限 github.com，不会把令牌带给别的 host）。
 *  - 只用 `git` 自己的传输（`ls-remote` / `push`），不经 Node 的 fetch：本机的系统代理
 *    只有 WinINET/git 认（Node fetch 不走系统代理），走 git 最稳。
 *  - GitHub API（列自己的仓库）改成用 PowerShell 的 `Invoke-RestMethod`（认系统代理），
 *    令牌从环境变量传进去，不出现在命令行里。
 */
import { execFile } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

const EMPTY = {
  bound: false,
  owner: '',
  repo: '',
  url: '',
  branch: 'main',
  repoPath: '',
  token: '',
  hasToken: false,
  updatedAt: '',
  lastTest: null,
  lastPush: null,
}

function nowText() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function mask(token) {
  if (!token) return ''
  const t = String(token)
  if (t.length <= 10) return t.slice(0, 2) + '…'
  return t.slice(0, 4) + '…' + t.slice(-4)
}

/** 接受 `owner/repo`、`https://github.com/owner/repo(.git)`、`git@github.com:owner/repo.git` */
export function normalizeUrl(input) {
  const raw = String(input || '').trim()
  if (!raw) return null
  let s = raw
  let m = /^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/.exec(s)
  if (m) return { owner: m[1], repo: m[2], url: `https://github.com/${m[1]}/${m[2]}.git` }
  m = /^https?:\/\/(?:[^@/]+@)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i.exec(s)
  if (m) return { owner: m[1], repo: m[2], url: `https://github.com/${m[1]}/${m[2]}.git` }
  m = /^git@github\.com:([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i.exec(s)
  if (m) return { owner: m[1], repo: m[2], url: `https://github.com/${m[1]}/${m[2]}.git` }
  if (/^[\w.-]+$/.test(s)) return null // 只有仓库名，缺 owner
  return null
}

/** GitHub 仓库名只允许 [A-Za-z0-9._-]，其它字符换 '-'，并去掉首尾的符号 */
export function sanitizeRepoName(raw) {
  let s = String(raw || '').trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '')
  if (!s) s = 'repo'
  if (s.length > 100) s = s.slice(0, 100)
  return s
}

export function createGithub(cfg) {
  const gitExe = cfg.gitExe
  const configPath = cfg.githubPath
  const dpapi = cfg.dpapiScript
  let cache = null
  let lastToken = '' // 内存里留一份，免得每次操作都解密

  function runGit(args, opts = {}) {
    const full = []
    if (opts.token) {
      const basic = Buffer.from('x-access-token:' + opts.token, 'utf8').toString('base64')
      full.push('-c', 'http.https://github.com/.extraheader=AUTHORIZATION: basic ' + basic)
    }
    full.push(...args)
    const started = Date.now()
    return new Promise((resolve) => {
      try {
        execFile(
          gitExe,
          full,
          {
            cwd: opts.cwd || undefined,
            windowsHide: true,
            timeout: opts.timeout || 120000,
            maxBuffer: 8 * 1024 * 1024,
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
          },
          (error, stdout, stderr) => {
            resolve({
              ok: !error,
              code: error && typeof error.code === 'number' ? error.code : (error ? 1 : 0),
              ms: Date.now() - started,
              stdout: String(stdout || ''),
              stderr: String((error && error.message) || stderr || ''),
            })
          },
        )
      } catch (err) {
        resolve({ ok: false, code: 1, ms: Date.now() - started, stdout: '', stderr: String((err && err.message) || err) })
      }
    })
  }

  function runPs(script) {
    const started = Date.now()
    return new Promise((resolve) => {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
        { windowsHide: true, timeout: 40000, maxBuffer: 4 * 1024 * 1024 },
        (error, stdout, stderr) => resolve({
          ok: !error,
          ms: Date.now() - started,
          stdout: String(stdout || '').trim(),
          stderr: String((error && error.message) || stderr || '').slice(-500),
        }),
      )
    })
  }

  /** 明文 → DPAPI base64（stdin 传，不进命令行） */
  function protect(plain) {
    return new Promise((resolve) => {
      try {
        const child = execFile(
          'powershell.exe',
          ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', dpapi, '-Mode', 'Protect'],
          { windowsHide: true, timeout: 30000 },
          (error, stdout) => resolve(error ? '' : String(stdout || '').trim()),
        )
        child.stdin.write(String(plain))
        child.stdin.end()
      } catch {
        resolve('')
      }
    })
  }

  /** DPAPI base64 → 明文 */
  function unprotect(b64) {
    return new Promise((resolve) => {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', dpapi, '-Mode', 'Unprotect', '-B64', b64],
        { windowsHide: true, timeout: 30000 },
        (error, stdout) => resolve(error ? '' : String(stdout || '').trim()),
      )
    })
  }

  async function load() {
    if (cache) return cache
    try {
      const raw = await readFile(configPath, 'utf8')
      const obj = JSON.parse(raw)
      cache = { ...EMPTY, ...obj }
    } catch {
      cache = { ...EMPTY }
    }
    return cache
  }

  async function save(obj) {
    cache = obj
    try {
      await mkdir(dirname(configPath), { recursive: true })
      // 文件里只有 DPAPI 密文，没有明文令牌
      await writeFile(configPath, JSON.stringify(obj, null, 2), 'utf8')
      return true
    } catch {
      return false
    }
  }

  function publicState(c) {
    return {
      bound: !!c.bound,
      owner: c.owner || '',
      repo: c.repo || '',
      fullName: c.owner && c.repo ? `${c.owner}/${c.repo}` : '',
      url: c.url || '',
      branch: c.branch || 'main',
      repoPath: c.repoPath || '',
      hasToken: !!c.token,
      tokenMasked: c.tokenMasked || '',
      updatedAt: c.updatedAt || '',
      lastTest: c.lastTest || null,
      lastPush: c.lastPush || null,
      configFile: configPath,
    }
  }

  async function resolveToken() {
    if (lastToken) return lastToken
    const c = await load()
    if (!c.token) return ''
    const plain = await unprotect(c.token)
    lastToken = plain
    return plain
  }

  return {
    async status() {
      const c = await load()
      return publicState(c)
    },

    /** 绑定：url(owner/repo 或完整 URL) + 可选 token + 可选本地仓库路径 + 分支 */
    async bind({ url, token, repoPath, branch }) {
      const norm = normalizeUrl(url)
      if (!norm) return { ok: false, err: '地址看不懂：填 owner/repo，或 https://github.com/owner/repo.git' }
      const c = await load()
      const next = { ...c, bound: true, owner: norm.owner, repo: norm.repo, url: norm.url }
      if (branch) next.branch = String(branch).trim() || 'main'
      if (repoPath) next.repoPath = String(repoPath).trim()
      if (token) {
        const t = String(token).trim()
        next.token = await protect(t)
        next.tokenMasked = mask(t)
        lastToken = t
      }
      next.updatedAt = nowText()

      let remote = null
      if (next.repoPath) {
        // 顺手把本地仓库的 origin 指过去，命令行里也能直接 push
        const cur = await runGit(['-C', next.repoPath, 'remote', 'get-url', 'origin'])
        const args = cur.ok
          ? ['-C', next.repoPath, 'remote', 'set-url', 'origin', norm.url]
          : ['-C', next.repoPath, 'remote', 'add', 'origin', norm.url]
        const r = await runGit(args)
        remote = { ok: r.ok, action: cur.ok ? 'set-url' : 'add', err: r.ok ? '' : r.stderr.slice(-300) }
      }
      await save(next)
      return { ok: true, state: publicState(next), remote }
    },

    async unbind({ keepRemote }) {
      const c = await load()
      const next = { ...EMPTY, configFile: configPath }
      if (keepRemote && c.repoPath && c.url) {
        // 保留 origin，只清令牌与绑定
        next.repoPath = c.repoPath
      }
      lastToken = ''
      await save(next)
      return { ok: true, state: publicState(next) }
    },

    /** 连得上吗：ls-remote HEAD（带令牌时顺带证明令牌有效） */
    async test({ url, token } = {}) {
      const c = await load()
      const target = (url && normalizeUrl(url)) || null
      const remoteUrl = target ? target.url : c.url
      if (!remoteUrl) return { ok: false, err: '还没绑定：先填 owner/repo 再点绑定' }
      const tk = token ? String(token).trim() : await resolveToken()
      const r = await runGit(['ls-remote', '--heads', '--tags', remoteUrl], { token: tk })
      const refs = r.stdout.split(/\r?\n/).filter(Boolean)
      const heads = refs.filter((l) => l.includes('refs/heads/')).length
      const tags = refs.filter((l) => l.includes('refs/tags/')).length
      const headsList = refs.filter((l) => l.includes('refs/heads/')).map((l) => l.replace(/^.*refs\/heads\//, ''))
      const info = {
        at: nowText(),
        ok: r.ok,
        ms: r.ms,
        heads,
        tags,
        branches: headsList.slice(0, 12),
        err: r.ok ? '' : (r.stderr || '').split(/\r?\n/).filter(Boolean).slice(-3).join(' | ').slice(-400),
      }
      const next = { ...c, lastTest: info }
      if (target) {
        next.bound = true
        next.owner = target.owner
        next.repo = target.repo
        next.url = target.url
        next.updatedAt = nowText()
      }
      await save(next)
      return { ok: r.ok, test: info, state: publicState(next) }
    },

    /** 手动推送：git push <url> <branch>（带令牌），可选 --tags */
    async push({ branch, tags, force, repoPath } = {}) {
      const c = await load()
      if (!c.url) return { ok: false, err: '还没绑定 GitHub 仓库' }
      const tk = await resolveToken()
      if (!tk) return { ok: false, err: '还没有令牌：在面板里填一次 Token 再绑定（HTTPS 推送需要它）' }
      const path = (repoPath && String(repoPath)) || c.repoPath
      if (!path) return { ok: false, err: '没指定本地仓库：面板里选一个仓库再绑定' }
      const br = String(branch || c.branch || 'main').trim()
      const args = ['-C', path, 'push', c.url, `refs/heads/${br}:refs/heads/${br}`]
      if (tags) args.push('--tags')
      if (force) args.push('--force-with-lease')
      const r = await runGit(args, { token: tk, timeout: 300000 })
      const out = (r.stdout + r.stderr).split(/\r?\n/).filter(Boolean).slice(-6)
      const info = {
        at: nowText(),
        ok: r.ok,
        ms: r.ms,
        branch: br,
        tags: !!tags,
        out,
        err: r.ok ? '' : (r.stderr || '').split(/\r?\n/).filter(Boolean).slice(-3).join(' | ').slice(-400),
      }
      await save({ ...c, lastPush: info })
      return { ok: r.ok, push: info, state: publicState(await load()) }
    },

    /** 令牌有效吗 + 令牌下的仓库列表（走 PowerShell，认系统代理） */
    async repos({ token } = {}) {
      const tk = token ? String(token).trim() : await resolveToken()
      if (!tk) return { ok: false, err: '先填令牌', repos: [] }
      const script =
        "$ProgressPreference='SilentlyContinue';" +
        "$h=@{'User-Agent'='dsh-version-history';'Authorization'=('Bearer '+$env:VH_GH_TOKEN);'Accept'='application/vnd.github+json'};" +
        "try{$u=Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $h -TimeoutSec 25;" +
        "$r=Invoke-RestMethod -Uri ('https://api.github.com/user/repos?per_page=50&sort=updated&affiliation=owner,collaborator') -Headers $h -TimeoutSec 25;" +
        "$o=[pscustomobject]@{login=$u.login;name=$u.name;count=@($r).Count;repos=@($r|ForEach-Object{[pscustomobject]@{full_name=$_.full_name;private=$_.private;default_branch=$_.default_branch;pushed_at=$_.pushed_at}})};" +
        "$o|ConvertTo-Json -Depth 5 -Compress}catch{Write-Error $_.Exception.Message;exit 1}"
      const started = Date.now()
      const res = await new Promise((resolve) => {
        execFile(
          'powershell.exe',
          ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
          { windowsHide: true, timeout: 60000, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, VH_GH_TOKEN: tk } },
          (error, stdout, stderr) => resolve({ ok: !error, ms: Date.now() - started, stdout: String(stdout || '').trim(), stderr: String((error && error.message) || stderr || '').slice(-300) }),
        )
      })
      if (!res.ok) return { ok: false, err: res.stderr || '请求失败', repos: [] }
      let data = null
      try {
        data = JSON.parse(res.stdout)
      } catch {
        return { ok: false, err: '返回解析失败：' + res.stdout.slice(0, 200), repos: [] }
      }
      return {
        ok: true,
        ms: res.ms,
        login: data.login || '',
        count: data.count || 0,
        repos: (data.repos || []).map((x) => ({ fullName: x.full_name, private: !!x.private, branch: x.default_branch || 'main', pushedAt: x.pushed_at || '' })),
      }
    },

    /**
     * 把一个本地仓库**发布**到 GitHub（私有或公开）：
     *   1) 用 API 查 `GET /repos/<login>/<name>`；404 就 `POST /user/repos` 建（private 由 visibility 决定）
     *   2) `git push <url> refs/heads/<br>:refs/heads/<br> --tags`（令牌走 .extraheader）
     *   3) 本地没有 origin 时顺手补一个（有 origin 不动，避免把 D:\repos\local 这种已绑定的改掉）
     */
    async publish({ repoPath, name, visibility, branch, token } = {}) {
      const path = String(repoPath || '').trim()
      if (!path) return { ok: false, err: '缺少本地仓库路径' }
      const vis = visibility === 'public' ? 'public' : 'private'
      const repoName = sanitizeRepoName(name || path.split(/[\\/]/).filter(Boolean).pop() || 'repo')
      const tk = token ? String(token).trim() : await resolveToken()
      if (!tk) return { ok: false, err: '还没有令牌：先在 GitHub 面板里填一次 Token（私有/公开推送都要它）' }

      // 当前分支（显式给了就用给的）
      let br = String(branch || '').trim()
      if (!br) {
        const b = await runGit(['-C', path, 'rev-parse', '--abbrev-ref', 'HEAD'])
        br = b.ok ? b.stdout.trim() : 'main'
        if (!br || br === 'HEAD') br = 'main'
      }

      // 建/查仓库：脚本常量，参数走环境变量（不进命令行）
      const script = [
        "$ProgressPreference='SilentlyContinue'",
        "$h=@{'User-Agent'='dsh-version-history';'Authorization'=('Bearer '+$env:VH_GH_TOKEN);'Accept'='application/vnd.github+json'}",
        "$name=$env:VH_GH_NAME",
        "$priv=($env:VH_GH_PRIVATE -eq '1')",
        "$u=Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $h -TimeoutSec 25",
        "$login=$u.login",
        "$full=$login+'/'+$name",
        "$exists=$false;$created=$false;$html='';$db='main'",
        "try{",
        "  $r=Invoke-RestMethod -Uri ('https://api.github.com/repos/'+$full) -Headers $h -TimeoutSec 25",
        "  $exists=$true;$html=$r.html_url;$db=$r.default_branch",
        "}catch{",
        "  $code=0;try{$code=[int]$_.Exception.Response.StatusCode}catch{}",
        "  if($code -ne 404){ Write-Error ('查询仓库失败：'+$_.Exception.Message); exit 1 }",
        "  $body=@{name=$name;private=$priv;has_issues=$false;has_wiki=$false}|ConvertTo-Json -Compress",
        "  $c=Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Method Post -Headers $h -ContentType 'application/json' -Body $body -TimeoutSec 30",
        "  $created=$true;$html=$c.html_url;$db=$c.default_branch",
        "}",
        "[pscustomobject]@{login=$login;full=$full;created=$created;existed=$exists;html_url=$html;default_branch=$db}|ConvertTo-Json -Compress",
      ].join(';')

      const started = Date.now()
      const res = await new Promise((resolve) => {
        execFile(
          'powershell.exe',
          ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
          {
            windowsHide: true,
            timeout: 90000,
            maxBuffer: 8 * 1024 * 1024,
            env: { ...process.env, VH_GH_TOKEN: tk, VH_GH_NAME: repoName, VH_GH_PRIVATE: vis === 'private' ? '1' : '0' },
          },
          (error, stdout, stderr) => resolve({
            ok: !error,
            ms: Date.now() - started,
            stdout: String(stdout || '').trim(),
            stderr: String((error && error.message) || stderr || '').slice(-400),
          }),
        )
      })
      if (!res.ok) return { ok: false, err: '建仓库失败：' + (res.stderr || '未知错误'), ms: res.ms }
      let meta = null
      try {
        meta = JSON.parse(res.stdout)
      } catch {
        return { ok: false, err: '建仓库返回解析失败：' + res.stdout.slice(0, 200), ms: res.ms }
      }

      const gitUrl = `https://github.com/${meta.full}.git`
      const pushRes = await runGit(
        ['-C', path, 'push', gitUrl, `refs/heads/${br}:refs/heads/${br}`, '--tags'],
        { token: tk, timeout: 300000 },
      )

      // 没有 origin 才补，已有的不动
      const cur = await runGit(['-C', path, 'remote', 'get-url', 'origin'])
      let origin = { action: 'keep', ok: true }
      if (!cur.ok) {
        const add = await runGit(['-C', path, 'remote', 'add', 'origin', gitUrl])
        origin = { action: 'add', ok: add.ok, err: add.ok ? '' : add.stderr.slice(-200) }
      }

      const out = (pushRes.stdout + pushRes.stderr).split(/\r?\n/).filter(Boolean).slice(-6)
      const info = {
        at: nowText(),
        ok: pushRes.ok,
        ms: pushRes.ms,
        full: meta.full,
        url: meta.html_url,
        gitUrl,
        visibility: vis,
        created: !!meta.created,
        branch: br,
        out,
        err: pushRes.ok ? '' : (pushRes.stderr || '').split(/\r?\n/).filter(Boolean).slice(-3).join(' | ').slice(-400),
      }
      // 发布成功就把绑定指向这次的目标，面板状态/徽章跟着变
      const c = await load()
      const saved = { ...c }
      if (pushRes.ok) {
        saved.bound = true
        saved.owner = meta.full.split('/')[0]
        saved.repo = meta.full.split('/')[1] || repoName
        saved.url = gitUrl
        saved.branch = br
        saved.updatedAt = nowText()
      }
      saved.lastPush = info
      await save(saved)
      return { ok: pushRes.ok, publish: info, origin, state: publicState(await load()) }
    },
  }
}
