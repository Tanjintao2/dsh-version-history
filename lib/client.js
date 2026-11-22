/**
 * dsh-version-history · Client half
 *
 * 侧边栏加一个「GIT管理」图标；点开是一个主面板，左栏项目/版本，右栏明细。
 * 数据来自本包 Host half 的 /version-history/data.json（同源 fetch，不用 iframe）。
 */
window.__ModuleLoader__.load({
  id: 'dsh-version-history',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const API = '/version-history'

    const CSS = [
      '.vh{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}',
      '.vh-head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap}',
      '.vh-title{font-size:15px;font-weight:600}',
      '.vh-sub{color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.vh-sp{flex:1}',
      '.vh-btn{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:inherit;border-radius:7px;padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit}',
      '.vh-btn:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}',
      '.vh-btn[disabled]{opacity:.55;cursor:default}',
      '.vh-body{display:grid;grid-template-columns:250px minmax(0,1fr) 340px;gap:12px;padding:12px 16px;flex:1;min-height:0}',
      '.vh-dcol{display:flex;flex-direction:column;min-height:0;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1)}',
      '.vh-dtab.embedded{background:transparent}',
      '@media (max-width:1240px){.vh-body{grid-template-columns:250px minmax(0,1fr)}.vh-dcol{display:none}}',
      '.vh-tree{overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);padding:8px;min-height:0}',
      '.vh-q{width:100%;box-sizing:border-box;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);color:inherit;border-radius:7px;padding:5px 8px;font-size:12px;margin-bottom:8px;font-family:inherit}',
      '.vh-q:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.vh-add{display:flex;gap:6px;margin-bottom:8px}',
      '.vh-add input{flex:1;min-width:0;box-sizing:border-box;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);color:inherit;border-radius:7px;padding:4px 7px;font-size:11.5px;font-family:inherit}',
      '.vh-add input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.vh-add button{white-space:nowrap}',
      '.vh-disks{display:flex;gap:8px;flex-wrap:wrap;padding:8px 16px 0}',
      '.vh-disk{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:3px 9px;font-size:11.5px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1)}',
      '.vh-disk b{color:var(--dsw-alias-label-primary)}',
      '.vh-role{font-size:11px;opacity:.75}',
      '.vh-dot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-success-primary);flex:none}',
      '.vh-disk.warn{border-color:var(--dsw-alias-state-warn-primary)}',
      '.vh-disk.warn .vh-dot{background:var(--dsw-alias-state-warn-primary)}',
      '.vh-disk.bad{border-color:var(--dsw-alias-state-error-primary)}',
      '.vh-disk.bad .vh-dot{background:var(--dsw-alias-state-error-primary)}',
      '.vh-bar{width:70px;height:6px;border-radius:3px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);overflow:hidden;flex:none}',
      '.vh-bar i{display:block;height:100%;background:var(--dsw-alias-brand-primary)}',
      '.vh-x{margin-left:6px;color:var(--dsw-alias-label-secondary);font-size:11px;opacity:0;cursor:pointer;padding:0 3px;border-radius:4px}',
      '.vh-grp-h:hover .vh-x{opacity:1}',
      '.vh-x:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-base)}',
      '.vh-msg{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin:-2px 0 8px;word-break:break-all}',
      '.vh-msg.bad{color:var(--dsw-alias-state-error-primary)}',
      '.vh-grp{margin-bottom:2px}',
      '.vh-src{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);padding:7px 9px;margin-bottom:8px;font-size:11.5px}',
      '.vh-src-h{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:11px;letter-spacing:.4px;margin-bottom:5px}',
      '.vh-src-row{display:flex;align-items:center;gap:6px;margin:3px 0}',
      '.vh-src-row .vh-dot{width:7px;height:7px;border-radius:50%;flex:none;border:1px solid var(--dsw-alias-border-l2);background:transparent}',
      '.vh-src-row .vh-dot.on{background:var(--dsw-alias-state-success-primary);border-color:transparent}',
      '.vh-src-row .vh-dot.off{background:var(--dsw-alias-state-idle-primary);border-color:transparent}',
      '.vh-src-row .vh-k{font-weight:600;white-space:nowrap;flex:none}',
      '.vh-src-row .vh-v2{color:var(--dsw-alias-label-secondary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.vh-src-row .vh-sp{flex:1}',
      '.vh-src-row .vh-mini{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:inherit;border-radius:6px;font-size:11px;padding:1px 7px;cursor:pointer;font-family:inherit;white-space:nowrap;flex:none}',
      '.vh-src-row .vh-mini:hover{border-color:var(--dsw-alias-brand-primary)}',
      '.vh-gh{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1)}',
      '.vh-row{display:flex;align-items:center;gap:8px}',
      '.vh-row .vh-k{min-width:34px}',
      '.vh-inp{flex:1;min-width:0;background:var(--dsw-alias-bg-base);color:inherit;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:3px 7px;font-size:12px;font-family:inherit}',
      '.vh-inp:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.vh-chk{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.vh-chk input{width:13px;height:13px;margin:0;flex:none;accent-color:var(--dsw-alias-brand-primary)}',
      '.vh-ghlist{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}',
      '.vh-msg{font-size:12px;margin-top:6px}',
      '.vh-msg.ok{color:var(--dsw-alias-state-success-primary)}',
      '.vh-msg.bad{color:var(--dsw-alias-state-error-primary)}',
      '.vh-grp-t{display:flex;align-items:center;gap:6px;min-width:0;flex:1}',
      '.vh-tag{font-size:10px;line-height:1.4;border-radius:4px;padding:0 5px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);flex:none;font-weight:500}',
      '.vh-tag.loc{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.vh-tag.lan{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.vh-tag.pend{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}',
      '.vh-tag.gh{color:var(--dsw-alias-label-secondary)}',
      '.vh-tag.gh.ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.vh-tag.gh.up{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.vh-tag.gh.dn,.vh-tag.gh.warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}',
      '.vh-repo-path{color:var(--dsw-alias-label-secondary);font-size:10.5px;padding:0 7px 5px;word-break:break-all;opacity:.85}',
      '.vh-grp-h{display:flex;gap:8px;padding:5px 7px;border-radius:6px;cursor:pointer;font-weight:600;align-items:center}',
      '.vh-grp-t{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:6px}',
      '.vh-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.vh-grp-tags{display:flex;gap:5px;flex-wrap:wrap;padding:0 7px 3px}',
      '.vh-grp-h:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.vh-grp.on .vh-grp-h{background:var(--dsw-alias-bg-layer-2)}',
      '.vh-meta{margin-left:auto;color:var(--dsw-alias-label-secondary);font-weight:400;font-size:11px;white-space:nowrap}',
      '.vh-v{display:flex;gap:8px;padding:4px 7px 4px 16px;border-radius:6px;cursor:pointer;border-left:2px solid transparent;font-size:12.5px;align-items:center}',
      '.vh-v:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.vh-v.on{background:var(--dsw-alias-bg-layer-2);border-left-color:var(--dsw-alias-brand-primary)}',
      '.vh-v .t{color:var(--dsw-alias-state-warn-primary);font-weight:600}',
      '.vh-v .d{margin-left:auto;color:var(--dsw-alias-label-secondary);font-size:11px}',
      '.vh-pane{overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);padding:14px 16px;min-height:0}',
      '.vh-subbar{display:flex;align-items:center;gap:8px;margin:-4px 0 10px}',
      '.vh-h2{margin:0 0 2px;font-size:15px}',
      '.vh-path{color:var(--dsw-alias-label-secondary);font-size:11.5px;word-break:break-all;margin-bottom:10px}',
      '.vh-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}',
      '.vh-bdg{font-size:11.5px;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:1px 8px}',
      '.vh-bdg.tag{color:var(--dsw-alias-state-warn-primary)}',
      '.vh-bdg.ok{color:var(--dsw-alias-state-success-primary)}',
      '.vh-bdg.warn{color:var(--dsw-alias-state-warn-primary)}',
      '.vh-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin-bottom:12px}',
      '.vh-stat{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:7px 9px;background:var(--dsw-alias-bg-base)}',
      '.vh-stat .k{color:var(--dsw-alias-label-secondary);font-size:11px}',
      '.vh-stat .v{font-size:14px;font-weight:600;margin-top:2px}',
      '.vh-sec{color:var(--dsw-alias-label-secondary);font-size:11.5px;letter-spacing:.5px;margin:14px 0 6px}',
      '.vh-table{width:100%;border-collapse:collapse;font-size:12px}',
      '.vh-table th,.vh-table td{text-align:left;padding:4px 6px;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.vh-table th{color:var(--dsw-alias-label-secondary);font-weight:500;font-size:11px}',
      '.vh-table td.num,.vh-table th.num{text-align:right;white-space:nowrap}',
      '.vh-add{color:var(--dsw-alias-state-success-primary)}',
      '.vh-del{color:var(--dsw-alias-state-error-primary)}',
      '.vh-files{max-height:280px;overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:8px}',
      '.vh-cmts{list-style:none;margin:0;padding:0}',
      '.vh-cmts li{display:flex;gap:8px;padding:3px 0;border-bottom:1px dashed var(--dsw-alias-border-l1);font-size:12px}',
      '.vh-cmts li:last-child{border-bottom:none}',
      '.vh-cmts .h{color:var(--dsw-alias-brand-primary);font-family:Consolas,monospace}',
      '.vh-note{color:var(--dsw-alias-label-secondary);font-size:11.5px;margin-top:8px}',
      '.vh-err{margin:16px;padding:10px 12px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px;color:var(--dsw-alias-state-error-primary);font-size:12.5px;white-space:pre-wrap}',
      '.vh-mono{font-family:Consolas,"Cascadia Mono",monospace}',
      // 磁盘面板（右侧栏 tab）
      '.vh-dtab{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}',
      '.vh-dhead{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap}',
      '.vh-dbody{flex:1;min-height:0;overflow:auto;padding:10px 14px 16px;display:flex;flex-direction:column;gap:10px}',
      '.vh-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:10px 12px}',
      '.vh-card-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}',
      '.vh-flags{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:0 0 7px}',
      '.vh-bdg.git{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.vh-card-h .nm{font-weight:600;font-size:13.5px}',
      '.vh-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:5px 14px}',
      '.vh-kv .it{display:flex;gap:6px;font-size:12px;min-width:0}',
      '.vh-kv .k{color:var(--dsw-alias-label-secondary);flex:none}',
      '.vh-kv .v{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.vh-risk{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;border-radius:999px;padding:1px 9px;border:1px solid;white-space:nowrap}',
      '.vh-risk.ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.vh-risk.warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}',
      '.vh-risk.bad{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}',
      '.vh-rs{list-style:none;margin:7px 0 0;padding:0;font-size:11.5px;color:var(--dsw-alias-label-secondary)}',
      '.vh-rs li{margin:2px 0}',
      '.vh-vols{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
      '.vh-vol{font-size:11px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:2px 7px;color:var(--dsw-alias-label-secondary);display:inline-flex;gap:5px;align-items:center}',
      '.vh-vol b{color:var(--dsw-alias-label-primary)}',
      '.vh-vol i{display:inline-block;width:44px;height:5px;border-radius:3px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);overflow:hidden;position:relative}',
      '.vh-vol i s{position:absolute;left:0;top:0;bottom:0;background:var(--dsw-alias-brand-primary);text-decoration:none}',
      '.vh-hint{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:7px;line-height:1.55}',
      '.vh-url{display:flex;align-items:center;gap:8px;margin:5px 0}',
      '.vh-url-t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:Consolas,"Cascadia Mono",monospace;font-size:11.5px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:3px 7px}',
      '.vh-log{margin:0;padding:9px 16px;max-height:220px;overflow:auto;font-family:Consolas,"Cascadia Mono",monospace;font-size:11px;line-height:1.45;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border-bottom:1px solid var(--dsw-alias-border-l1);white-space:pre-wrap}',
      '.vh-hint code{font-family:Consolas,"Cascadia Mono",monospace;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:4px;padding:0 4px}',
      '.vh-bk-card{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);padding:10px 12px;margin:0 0 10px;display:flex;flex-direction:column;gap:7px}',
      '.vh-bk-t{font-size:12.5px;font-weight:600}',
      '.vh-bk-note{font-size:11.5px;color:var(--dsw-alias-label-secondary);line-height:1.55;word-break:break-all}',
      '.vh-bk-list{display:flex;flex-direction:column;gap:3px;margin-top:2px}',
      '.vh-bk-item{display:flex;align-items:center;gap:8px;font-size:11.5px}',
      '.vh-bk-n{font-weight:600;white-space:nowrap}',
      '.vh-bk-p{color:var(--dsw-alias-label-secondary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    ].join('\n')

    function num(n) {
      const s = String(n == null ? 0 : n)
      return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    function day(iso) { return String(iso || '').slice(0, 10) }
    function clock(iso) { return String(iso || '').slice(11, 16) }

    function Disks(data) {
      const ds = (data && data.disks) || []
      if (!ds.length) { return null }
      return h('div', { className: 'vh-disks' }, ds.map(function (d, i) {
        const cls = d.state === 'bad' ? 'bad' : (d.state === 'warn' ? 'warn' : 'ok')
        const usedPct = d.total ? Math.round(100 - (d.pctFree || 0)) : 0
        return h('span', { className: 'vh-disk ' + cls, key: 'd' + i },
          h('span', { className: 'vh-dot' }),
          h('b', null, d.drive),
          h('span', { className: 'vh-role' }, (d.roles || []).join(' / ')),
          d.ready
            ? h('span', null, '剩余 ' + d.freeText + ' / ' + d.totalText + ' · 已用 ' + usedPct + '%')
            : h('span', null, '未就绪'),
          d.ready ? h('span', { className: 'vh-bar' }, h('i', { style: { width: usedPct + '%' } })) : null)
      }))
    }

    // ---------- 磁盘面板（右侧栏 tab） ----------
    let ctxRef = null

    function kvItem(k, v) {
      if (v === null || v === undefined || v === '') return null
      return h('div', { className: 'it', key: k },
        h('span', { className: 'k' }, k),
        h('span', { className: 'v', title: String(v) }, String(v)))
    }

    // hostWrittenGB 是 GB 数（smartctl 的 Data Units Written × 512000 字节）
    function fmtBytes(gb) {
      const n = Number(gb)
      if (!isFinite(n) || n <= 0) return null
      return n >= 1024 ? (n / 1024).toFixed(2) + ' TB' : n.toFixed(1) + ' GB'
    }

    function RiskBadge(risk) {
      const r = risk || { level: 'ok', score: 0 }
      const label = r.level === 'bad' ? '风险' : (r.level === 'warn' ? '注意' : '稳定')
      return h('span', { className: 'vh-risk ' + r.level, title: '风险分 ' + (r.score || 0) + '（≥50 风险 / ≥20 注意）' },
        h('span', { className: 'vh-dot', style: { background: 'currentColor' } }),
        label + ' ' + (r.score || 0))
    }

    function DiskCard(d, i) {
      const isHdd = d.kind === 'HDD'
      const s = d.smart || {}
      const items = [
        kvItem('接口', d.busType),
        kvItem('容量', d.sizeGB + ' GB'),
        kvItem('健康', d.health),
        kvItem('运行', d.operational),
        kvItem('扇区', d.logicalSector + ' / ' + d.physicalSector + ' B'),
      ]
      if (d.isBoot) items.push(kvItem('系统盘', '是（启动盘）'))
      if (isHdd) {
        items.push(kvItem('转速', d.spindleSpeed && String(d.spindleSpeed) !== '0' ? d.spindleSpeed + ' rpm' : '未知'))
        items.push(kvItem('通电时间', s.powerOnHours != null ? s.powerOnHours + ' 小时' : '待 SMART'))
        items.push(kvItem('启停次数', s.startStopCount))
        items.push(kvItem('磁头加载', s.loadUnloadCount))
        items.push(kvItem('重映射扇区', s.reallocatedSectors != null ? s.reallocatedSectors + ' 个' : '待 SMART'))
        items.push(kvItem('待重映射', s.pendingSectors != null ? s.pendingSectors + ' 个' : '待 SMART'))
        items.push(kvItem('离线不可纠正', s.offlineUncorrectable != null ? s.offlineUncorrectable + ' 个' : '待 SMART'))
        items.push(kvItem('UDMA CRC', s.crcErrors))
      } else {
        items.push(kvItem('介质', 'SSD（闪存）'))
        items.push(kvItem('寿命磨损', s.wearPct != null ? s.wearPct + '%（0% = 全新）' : '待 SMART'))
        items.push(kvItem('通电时间', s.powerOnHours != null ? s.powerOnHours + ' 小时' : '待 SMART'))
        items.push(kvItem('写入量', s.hostWrittenGB != null ? fmtBytes(s.hostWrittenGB) : '待 SMART'))
        items.push(kvItem('异常掉电', s.unsafeShutdowns))
        items.push(kvItem('介质错误', s.mediaErrors))
        items.push(kvItem('可用备用块', s.availableSparePct != null ? s.availableSparePct + '%' : '待 SMART'))
        items.push(kvItem('电源循环', s.powerCycles))
      }
      const peak = (s.tempMaxC != null && Number(s.tempMaxC) > 0) ? '（峰值 ' + s.tempMaxC + '°C）' : ''
      items.push(kvItem('温度', s.tempC != null ? s.tempC + '°C' + peak : '待 SMART'))

      const vols = (d.volumes || []).map(function (v, vi) {
        const used = v.usedPct || 0
        return h('span', { className: 'vh-vol', key: 'v' + vi, title: v.usedPct + '% 已用' },
          h('b', null, v.letter || '系统分区'),
          v.label ? h('span', null, v.label) : null,
          h('span', null, v.freeGB + ' / ' + v.totalGB + ' GB 空闲'),
          h('i', null, h('s', { style: { width: used + '%' } })))
      })

      const reasons = ((d.risk && d.risk.reasons) || []).filter(Boolean)
      const gitTitle = d.isPrimary ? 'Git 仓库所在盘' : (d.hasGit ? 'Git 仓库盘' : '')
      const roleText = (d.roles || []).join(' / ')

      return h('div', { className: 'vh-card', key: 'd' + i },
        h('div', { className: 'vh-card-h' },
          h('span', { className: 'nm' }, '#' + d.index + ' ' + d.model),
          h('span', { className: 'vh-bdg' }, isHdd ? '机械硬盘 HDD' : (d.kind === 'SSD' ? '固态硬盘 SSD' : '未知类型')),
          d.isBoot ? h('span', { className: 'vh-bdg tag' }, '启动盘') : null),
        h('div', { className: 'vh-flags' },
          RiskBadge(d.risk),
          gitTitle ? h('span', { className: 'vh-bdg git' }, gitTitle) : null,
          roleText ? h('span', { className: 'vh-role' }, roleText) : null),
        h('div', { className: 'vh-kv' }, items),
        vols.length ? h('div', { className: 'vh-vols' }, vols) : null,
        reasons.length ? h('ul', { className: 'vh-rs' }, reasons.map(function (r, ri) { return h('li', { key: 'r' + ri }, '· ' + r) })) : null,
        (d.risk && d.risk.level === 'ok' && !reasons.length) ? h('div', { className: 'vh-hint' }, '未发现异常信号。') : null,
        d.risk && d.risk.note ? h('div', { className: 'vh-hint' }, d.risk.note) : null)
    }

    // 磁盘面板：右侧栏标签页用整页形态，主面板右列用 embedded 形态（省掉外边框）。
    function DiskPanel(props) {
      const embedded = !!(props && props.embedded)
      const [data, setData] = React.useState(null)
      const [err, setErr] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [note, setNote] = React.useState('')
      const dataRef = React.useRef(null)

      // 轻量合并：把 smart.json 里的每盘 SMART 按序列号（退化时按 index）贴到当前 health 数据上。
      // 用它先「立刻」出一版数字，再后台跑完整重扫（重扫要跑两个 PowerShell，约 8–9 s）。
      function mergeSmart(smart, base) {
        if (!smart || !base || !base.disks) return base
        const bySerial = {}
        const list = (smart && smart.disks) || []
        for (let i = 0; i < list.length; i++) {
          const s = list[i]
          if (s && s.serial) bySerial[String(s.serial).toUpperCase()] = s
        }
        const next = Object.assign({}, base)
        next.smart = Object.assign({}, base.smart || {}, {
          available: true,
          generated: smart.generated || '',
          admin: !!smart.elevated,
          reason: '',
        })
        next.disks = base.disks.map(function (d) {
          const s = bySerial[String(d.serial || '').toUpperCase()] || list[d.index] || null
          return s ? Object.assign({}, d, { smart: s }) : d
        })
        return next
      }

      function load(fresh, silent) {
        if (!silent) { setBusy(true); setErr(''); setNote('') }
        // silent 模式=SMART 刚更新的后台重扫：显式 smart=0，别把刚采过的 SMART 又跑一遍（省约 2.5 s）
        const url = fresh ? ('/disks/scan' + (silent ? '?smart=0' : '')) : '/disks.json'
        fetch(API + url, { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (d) {
            if (d && d.error) throw new Error(d.error + (d.detail ? ': ' + d.detail : ''))
            dataRef.current = d
            setData(d)
            if (d && d.scan && !silent) {
              const sm = d.scan.smart
              const extra = sm && sm.skipped ? '（SMART 快照较新，跳过重采）' : (sm && !sm.ok ? '（SMART 采集失败）' : '')
              setNote(d.scan.ok ? '已扫描 · ' + d.scan.ms + ' ms' + extra : '扫描失败：' + (d.scan.err || ('exit ' + d.scan.code)))
            }
          })
          .catch(function (e) { if (!silent) setErr(String((e && e.message) || e)) })
          .then(function () { if (!silent) setBusy(false) })
      }

      // SMART 提权扫描：先请宿主弹 UAC 跑 smart-launch.ps1，再轮询两个文件：
      //   /smart.json     —— 快照本身（mtime 更新 = 成功）
      //   /smart.state.json —— 启动器的结果（phase=done/error + exitCode/error，UAC 取消或脚本报错都能看到）
      const pollRef = React.useRef(0)
      const timeoutRef = React.useRef(0)
      const [smartMsg, setSmartMsg] = React.useState('')
      const [smartLog, setSmartLog] = React.useState('')

      React.useEffect(function () { load(false) }, [])
      React.useEffect(function () {
        return function () { stopPoll() }
      }, [])

      function stopPoll() {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = 0 }
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = 0 }
      }

      function showLog() {
        fetch(API + '/smart.log?lines=40', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (d) {
            setSmartLog(d && d.exists ? (d.tail || '(日志为空)') : '还没有日志：' + ((d && d.file) || 'E:\\Git\\reports\\smart.log'))
          })
          .catch(function (e) { setSmartLog('读日志失败：' + String((e && e.message) || e)) })
      }

      // 立刻把 /smart.json 贴到当前数据上（一次 fetch，几十毫秒），不跑任何 PowerShell。
      function applySmartNow() {
        return fetch(API + '/smart.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (info) {
            const merged = mergeSmart(info, dataRef.current)
            if (merged && merged !== dataRef.current) {
              dataRef.current = merged
              setData(merged)
            }
          })
          .catch(function () { /* 贴不上就交给后台重扫 */ })
      }

      function smartScan() {        if (busy) return
        stopPoll()
        setSmartLog('')
        setSmartMsg('正在请求提权…请在 UAC 窗口点「是」')
        const t0 = Date.now()
        fetch(API + '/smart/scan', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (res) {
            if (!res || !res.ok) throw new Error((res && res.err) || '提权请求被拒绝')
            setSmartMsg('已请求提权，等待 UAC / SMART 快照…')
            pollRef.current = setInterval(function () {
              fetch(API + '/smart.json', { cache: 'no-store' })
                .then(function (r) { return r.json() })
                .then(function (info) {
                  if (info && info.exists && Number(info.mtimeMs) >= t0) {
                    stopPoll()
                    if (info.valid === false && info.error) {
                      setSmartMsg('SMART 脚本报错，快照没写全：' + info.error + '（点「看日志」看细节）')
                      return null
                    }
                    // 先本地贴上去（几十毫秒就出数字），再后台跑完整重扫（两个 PowerShell 约 8–9 s）
                    setSmartMsg('快照已到，正在贴到面板上…')
                    return applySmartNow().then(function () {
                      setSmartMsg('SMART 已更新（温度 / 通电 / 重映射等已生效）；后台完整重扫中…')
                      load(true, true)
                      return null
                    })
                  }
                  return fetch(API + '/smart.state.json', { cache: 'no-store' })
                    .then(function (r) { return r.json() })
                    .then(function (st) {
                      if (!st || !st.exists) return
                      if (st.phase === 'error') {
                        stopPoll()
                        setSmartMsg('提权没成功：' + (st.error || '未知原因') + '（点「看日志」看细节）')
                      } else if (st.phase === 'done' && Number(st.exitCode) !== 0) {
                        stopPoll()
                        setSmartMsg('SMART 脚本以代码 ' + st.exitCode + ' 退出（多半是某些盘读不到计数器），点「看日志」看细节。')
                      } else if (st.phase === 'done' && Number(st.exitCode) === 0) {
                        // 脚本说成功但快照没出现：给它一次重读机会，再提示
                        setTimeout(function () {
                          fetch(API + '/smart.json', { cache: 'no-store' })
                            .then(function (r) { return r.json() })
                            .then(function (info2) {
                              if (info2 && info2.exists) {
                                stopPoll()
                                return applySmartNow().then(function () {
                                  setSmartMsg('SMART 已更新；后台完整重扫中…')
                                  load(true, true)
                                })
                              } else if (pollRef.current) {
                                stopPoll()
                                setSmartMsg('脚本报告成功，但没找到 smart.json —— 点「看日志」看它写到哪里了。')
                              }
                            })
                            .catch(function () { /* 忽略 */ })
                        }, 800)
                      }
                    })
                })
                .catch(function () { /* 轮询失败就继续等，直到超时 */ })
            }, 1500)
            timeoutRef.current = setTimeout(function () {
              if (pollRef.current) {
                stopPoll()
                setSmartMsg('等了两分半还没等到 SMART 快照：如果 UAC 窗口还开着就点「是」或「否」；否则点「看日志」。')
              }
            }, 150000)
          })
          .catch(function (e) {
            stopPoll()
            setSmartMsg('提权没成功：' + String((e && e.message) || e))
          })
      }

      const disks = (data && data.disks) || []
      const sum = (data && data.summary) || null
      const smart = (data && data.smart) || null

      const head = h('div', { className: 'vh-dhead' },
        h('span', { className: 'vh-title' }, '磁盘'),
        h('span', { className: 'vh-sub' },
          sum ? (sum.total + ' 块 · 固态 ' + sum.ssd + ' / 机械 ' + sum.hdd + ' · 风险 ' + sum.bad + ' / 注意 ' + sum.warn + ' / 稳定 ' + sum.ok) : '容量与健康'),
        note ? h('span', { className: 'vh-sub', style: { color: 'var(--dsw-alias-state-success-primary)' } }, note) : null,
        h('span', { className: 'vh-sp' }),
        h('button', {
          className: 'vh-btn',
          onClick: smartScan,
          title: '以管理员身份跑一次 SMART 快照（会弹 UAC），生成 E:\\Git\\reports\\smart.json',
        }, embedded ? 'SMART' : 'SMART 提权扫描'),
        h('button', { className: 'vh-btn', onClick: showLog, title: '看最近一次 SMART 提权的日志（E:\\Git\\reports\\smart.log）' }, embedded ? '日志' : '看日志'),
        h('button', { className: 'vh-btn', onClick: function () { load(true) }, disabled: busy }, busy ? '扫描中…' : '扫描'))

      return h('div', { className: 'vh-dtab' + (embedded ? ' embedded' : '') },
        h('style', null, CSS),
        head,
        smartMsg ? h('div', { className: 'vh-hint' }, smartMsg) : null,
        smartLog ? h('pre', { className: 'vh-log' }, smartLog) : null,
        h('div', { className: 'vh-dbody' },
          err ? h('div', { className: 'vh-err' }, '读取失败：' + err + '\n（先跑一次 E:\\Git\\scripts\\disk-health.ps1）') : null,
          smart && smart.available === false
            ? h('div', { className: 'vh-hint' },
              '温度 / 磨损 / 通电时间 / 重映射扇区这些「待 SMART」项要有一次管理员快照：点上面的 SMART 按钮，UAC 点「是」后自动补上。'
              + (smart.reason ? '（' + smart.reason + '）' : ''))
            : null,
          disks.length
            ? disks.map(DiskCard)
            : (busy ? h('div', { className: 'vh-hint' }, '正在读取磁盘信息…') : h('div', { className: 'vh-hint' }, '没有磁盘数据。'))))
    }

    function openDisks(right) {
      const ctx = ctxRef
      if (!ctx) return
      const sb = ensureDisksTab(ctx)
      if (sb && typeof sb.openTab === 'function') {
        sb.openTab({ type: 'version-history:disks', title: '磁盘', target: 'right' })
        const layout = typeof ctx.get === 'function' ? ctx.get('layout') : null
        if (right && layout && typeof layout.openRightbar === 'function') layout.openRightbar(true, false)
        return
      }
      // 没有 better-sidebar 时退回到主面板：至少让数据能看
      window.open(API + '/disks.json', '_blank', 'noopener')
    }

    // better-sidebar 的服务可能比本模块晚就绪：注册动作做成幂等，apply 时试一次，按钮点击时再补一次。
    let disksTabDone = false
    function ensureDisksTab(ctx) {
      const sb = ctx && typeof ctx.get === 'function' ? ctx.get('betterSidebar') : null
      if (!sb || typeof sb.registerTab !== 'function') return null
      if (!disksTabDone) {
        try {
          sb.registerTab({
            id: 'version-history:disks',
            title: () => '磁盘',
            description: () => '容量、机械/固态属性与稳定性风险',
            icon: (size) => Icon({ size: size }),
            order: 60,
            single: true,
            component: DiskPanel,
          })
          disksTabDone = true
        } catch (err) {
          disksTabDone = false
          if (typeof console !== 'undefined') console.error('[dsh-version-history] registerTab failed:', err)
        }
      }
      return sb
    }

    // ---------- 局域网共享（右侧栏 tab） ----------
    function LanPanel() {
      const [st, setSt] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [note, setNote] = React.useState('')
      const [copied, setCopied] = React.useState('')

      function load() {
        fetch(API + '/lan.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (d) { setSt(d) })
          .catch(function (e) { setNote('读取失败：' + String((e && e.message) || e)) })
      }
      React.useEffect(function () { load() }, [])

      function act(path, okText) {
        setBusy(true)
        setNote('')
        fetch(API + path, { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (d) {
            if (okText) setNote(d && d.ok === false ? ('没成功：' + String((d && (d.error || d.err)) || '')) : okText)
            load()
          })
          .catch(function (e) { setNote('操作失败：' + String((e && e.message) || e)) })
          .finally(function () { setBusy(false) })
      }

      function copy(url) {
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url)
            setCopied(url)
            return
          }
        } catch { /* 没有剪贴板权限就走下面的退路 */ }
        setCopied('')
      }

      const running = !!(st && st.running)
      const port = (st && st.port) || 8788
      const urls = (st && st.urls) || []
      const repos = (st && st.repos) || []

      const head = h('div', { className: 'vh-dhead' },
        h('span', { className: 'nm' }, '局域网 Git'),
        h('span', { className: 'vh-bdg ' + (running ? 'ok' : '') }, running ? '运行中 · :' + port : '未启动'),
        h('span', { className: 'vh-sp' }),
        running ? h('button', { className: 'vh-btn', disabled: busy, onClick: function () { act('/lan/stop', '已停止') } }, '停止')
          : h('button', { className: 'vh-btn', disabled: busy, onClick: function () { act('/lan/start', '已启动') } }, '启动'),
        h('button', { className: 'vh-btn', disabled: busy, title: '弹 UAC 添加 Windows 防火墙入站规则（局域网设备才能连）', onClick: function () { act('/lan/firewall', '已请求提权添加防火墙规则，UAC 点「是」') } }, '开放端口'))

      const body = h('div', { className: 'vh-dbody' },
        note ? h('div', { className: 'vh-hint' }, note) : null,
        running && urls.length
          ? h('div', null, urls.map(function (u, i) {
            return h('div', { className: 'vh-url', key: 'u' + i },
              h('code', { className: 'vh-url-t' }, u),
              h('button', {
                className: 'vh-btn',
                onClick: function () { copy(u) },
              }, copied === u ? '已复制' : '复制'))
          }))
          : null,
        running && !repos.length ? h('div', { className: 'vh-hint' }, 'E:\\Git\\repos 下还没有裸仓库。') : null,
        !running ? h('div', { className: 'vh-hint' },
          '点「启动」在这台机器上开一个 Git Smart HTTP 服务，局域网里的其他设备就能直接 clone / push 这里的裸仓库（E:\\Git\\repos）。'
          + '第一次用先点「开放端口」放行防火墙；服务没有账号密码，只在可信局域网里开，用完点「停止」。') : null,
        h('div', { className: 'vh-hint' },
          '其他设备：git clone ' + ((urls[0] || 'http://<本机IP>:' + port + '/git/<仓库>.git')) + '；推送同一地址即可（裸仓库没有检出，推上去就是备份）。'))

      return h('div', { className: 'vh-dtab' }, h('style', null, CSS), head, body)
    }

    function openLan(right) {
      const ctx = ctxRef
      if (!ctx) return
      const sb = ensureLanTab(ctx)
      if (sb && typeof sb.openTab === 'function') {
        sb.openTab({ type: 'version-history:lan', title: '局域网', target: 'right' })
        const layout = typeof ctx.get === 'function' ? ctx.get('layout') : null
        if (right && layout && typeof layout.openRightbar === 'function') layout.openRightbar(true, false)
      }
    }

    let lanTabDone = false
    function ensureLanTab(ctx) {
      const sb = ctx && typeof ctx.get === 'function' ? ctx.get('betterSidebar') : null
      if (!sb || typeof sb.registerTab !== 'function') return null
      if (!lanTabDone) {
        try {
          sb.registerTab({
            id: 'version-history:lan',
            title: () => '局域网',
            description: () => '把 E:\\Git\\repos 里的裸仓库共享给局域网（clone / push）',
            icon: (size) => Icon({ size: size }),
            order: 61,
            single: true,
            component: LanPanel,
          })
          lanTabDone = true
        } catch (err) {
          lanTabDone = false
          if (typeof console !== 'undefined') console.error('[dsh-version-history] registerTab(lan) failed:', err)
        }
      }
      return sb
    }

    // ---------- GitHub 绑定 / 连接 / 手动推送（右侧栏 tab） ----------
    function ghPost(body) {
      return fetch('/dsh-vh/gh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body || {}),
      }).then(function (r) { return r.json() }).catch(function (err) {
        return { ok: false, err: String(err && err.message || err) }
      })
    }

    function GithubPanel() {
      const [st, setSt] = React.useState(null)
      const [repos, setRepos] = React.useState([])
      const [apiRepos, setApiRepos] = React.useState(null)
      const [msg, setMsg] = React.useState('')
      const [bad, setBad] = React.useState('')
      const [busy, setBusy] = React.useState('')
      const [form, setForm] = React.useState({ repoPath: '', url: '', branch: 'main', token: '', tags: true })

      function applyState(s) {
        if (!s) return
        setSt(s)
        setForm(function (f) {
          return {
            repoPath: f.repoPath || s.repoPath || '',
            url: f.url || s.fullName || s.url || '',
            branch: f.branch && f.branch !== 'main' ? f.branch : (s.branch || 'main'),
            token: f.token,
            tags: f.tags,
          }
        })
      }

      function loadStatus() {
        fetch(API + '/github.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(applyState)
          .catch(function (err) { setBad('读绑定状态失败：' + String(err && err.message || err)) })
      }

      function loadRepos() {
        fetch(API + '/repos', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (d) { setRepos((d && d.repos) || []) })
          .catch(function () { setRepos([]) })
      }

      React.useEffect(function () {
        loadStatus()
        loadRepos()
      }, [])

      function call(kind, body, okText) {
        setBusy(kind)
        setMsg('')
        setBad('')
        return ghPost(body).then(function (res) {
          setBusy('')
          if (res && res.state) applyState(res.state)
          if (res && res.ok) {
            setMsg(okText(res) || '完成')
          } else {
            setBad((res && (res.err || (res.test && res.test.err) || (res.push && res.push.err))) || '失败')
          }
          return res
        })
      }

      function bind() {
        return call('bind', { action: 'bind', url: form.url, token: form.token, branch: form.branch, repoPath: form.repoPath },
          function (res) { return '已绑定 ' + (res.state && res.state.fullName) + (res.remote ? '（本地 origin 已更新）' : '') })
      }

      function test() {
        return call('test', { action: 'test', url: form.url },
          function (res) { return '连得上：' + ((res.test && res.test.heads) || 0) + ' 个分支 / ' + ((res.test && res.test.tags) || 0) + ' 个标签 · ' + ((res.test && res.test.ms) || 0) + ' ms' })
      }

      function push() {
        return call('push', { action: 'push', branch: form.branch, tags: form.tags, repoPath: form.repoPath },
          function (res) { return '推送完成（' + ((res.push && res.push.ms) || 0) + ' ms）' })
      }

      function listApiRepos() {
        setBusy('repos')
        setMsg('')
        setBad('')
        ghPost({ action: 'repos' }).then(function (res) {
          setBusy('')
          if (res && res.ok) {
            setApiRepos(res)
            setMsg('令牌有效：' + (res.login || '') + ' · ' + (res.count || 0) + ' 个仓库')
          } else setBad((res && res.err) || '拉列表失败')
        })
      }

      function unbind() {
        return call('unbind', { action: 'unbind' }, function () { setApiRepos(null); return '已解绑（本地 origin 保留）' })
      }

      const bound = !!(st && st.bound)
      const head = h('div', { className: 'vh-dhead' },
        h('span', { className: 'nm' }, 'GitHub'),
        h('span', { className: 'vh-risk ' + (bound ? 'ok' : 'warn') },
          h('span', { className: 'vh-dot' }), bound ? '已绑定 ' + st.fullName : '未绑定'),
        st && st.hasToken ? h('span', { className: 'vh-hint' }, '令牌 ' + st.tokenMasked) : null,
        h('span', { className: 'vh-sp' }),
        h('button', { className: 'vh-btn', disabled: !!busy, onClick: test, title: '对远程执行 git ls-remote（有令牌就顺带验证令牌）' }, busy === 'test' ? '测试中…' : '测试连接'),
        h('button', { className: 'vh-btn', disabled: !!busy || !form.url, onClick: bind, title: '保存 owner/repo、令牌、分支；选了本地仓库就顺手把 origin 指过去' }, busy === 'bind' ? '绑定中…' : '绑定'),
        h('button', { className: 'vh-btn primary', disabled: !!busy || !bound, onClick: push, title: '把本地仓库当前分支推到 GitHub（手动触发）' }, busy === 'push' ? '推送中…' : '推送到 GitHub'))

      const form$ = h('div', { className: 'vh-gh' },
        h('label', { className: 'vh-row' }, h('span', { className: 'vh-k' }, '仓库'),
          h('select', {
            className: 'vh-inp',
            value: form.repoPath,
            onChange: function (ev) { setForm(function (f) { return { ...f, repoPath: ev.target.value } }) },
          },
            h('option', { value: '' }, '（只绑定远程，不指定本地仓库）'),
            repos.map(function (p) { return h('option', { key: 'r:' + p, value: p }, p) }))),
        h('label', { className: 'vh-row' }, h('span', { className: 'vh-k' }, '远程'),
          h('input', {
            className: 'vh-inp',
            value: form.url,
            placeholder: 'owner/repo 或 https://github.com/owner/repo.git',
            onChange: function (ev) { setForm(function (f) { return { ...f, url: ev.target.value } }) },
          })),
        h('label', { className: 'vh-row' }, h('span', { className: 'vh-k' }, '分支'),
          h('input', {
            className: 'vh-inp',
            value: form.branch,
            placeholder: 'main',
            onChange: function (ev) { setForm(function (f) { return { ...f, branch: ev.target.value } }) },
          })),
        h('label', { className: 'vh-row' }, h('span', { className: 'vh-k' }, '令牌'),
          h('input', {
            className: 'vh-inp',
            type: 'password',
            value: form.token,
            placeholder: st && st.hasToken ? '已保存（留空表示不改）' : 'GitHub PAT（repo 权限）',
            autoComplete: 'off',
            onChange: function (ev) { setForm(function (f) { return { ...f, token: ev.target.value } }) },
          })),
        h('div', { className: 'vh-row' },
          h('label', { className: 'vh-chk' },
            h('input', {
              type: 'checkbox',
              checked: !!form.tags,
              onChange: function (ev) { setForm(function (f) { return { ...f, tags: ev.target.checked } }) },
            }),
            h('span', null, '同时推送标签（--tags）')),
          h('span', { className: 'vh-sp' }),
          h('button', { className: 'vh-btn', disabled: !!busy, onClick: listApiRepos, title: '用令牌列你自己的仓库（走 GitHub API，认系统代理）' }, busy === 'repos' ? '查询中…' : '拉我的仓库'),
          bound ? h('button', { className: 'vh-btn', disabled: !!busy, onClick: unbind, title: '清除绑定与令牌（本地 origin 保留）' }, '解绑') : null))

      const info = h('div', null,
        st && st.lastTest
          ? h('div', { className: 'vh-hint' },
            (st.lastTest.ok ? '上次连接：' : '上次连接失败：') + st.lastTest.at + ' · ' + (st.lastTest.ms || 0) + ' ms · '
            + (st.lastTest.heads || 0) + ' 分支 / ' + (st.lastTest.tags || 0) + ' 标签'
            + (st.lastTest.branches && st.lastTest.branches.length ? '（' + st.lastTest.branches.slice(0, 6).join(', ') + '…）' : '')
            + (st.lastTest.err ? ' · ' + st.lastTest.err : ''))
          : null,
        st && st.lastPush
          ? h('div', { className: 'vh-hint' },
            (st.lastPush.ok ? '上次推送：' : '上次推送失败：') + st.lastPush.at + ' · 分支 ' + st.lastPush.branch
            + (st.lastPush.tags ? ' + 标签' : '') + ' · ' + (st.lastPush.ms || 0) + ' ms'
            + (st.lastPush.err ? ' · ' + st.lastPush.err : ''))
          : null,
        msg ? h('div', { className: 'vh-msg ok' }, msg) : null,
        bad ? h('div', { className: 'vh-msg bad' }, bad) : null,
        apiRepos && apiRepos.repos && apiRepos.repos.length
          ? h('div', { className: 'vh-ghlist' }, apiRepos.repos.slice(0, 40).map(function (r) {
            return h('button', {
              key: 'g:' + r.fullName,
              className: 'vh-mini',
              title: (r.private ? '私有' : '公开') + ' · 默认分支 ' + r.branch,
              onClick: function () { setForm(function (f) { return { ...f, url: r.fullName, branch: r.branch || f.branch } }) },
            }, r.fullName)
          }))
          : null)

      const body = h('div', { className: 'vh-dbody' }, form$, info,
        h('div', { className: 'vh-hint' },
          '令牌只在本机用：保存时用 Windows DPAPI 加密（只有当前用户能解），认证走 '
          + 'git 的 `-c http.https://github.com/.extraheader`，不会写进 URL、也不会进命令行参数。推送是手动点按钮触发，不自动。'))

      return h('div', { className: 'vh-dtab' }, h('style', null, CSS), head, body)
    }

    function openGithub(right) {
      const ctx = ctxRef
      if (!ctx) return
      const sb = ensureGithubTab(ctx)
      if (sb && typeof sb.openTab === 'function') {
        sb.openTab({ type: 'version-history:github', title: 'GitHub', target: 'right' })
        const layout = typeof ctx.get === 'function' ? ctx.get('layout') : null
        if (right && layout && typeof layout.openRightbar === 'function') layout.openRightbar(true, false)
      }
    }

    let githubTabDone = false
    function ensureGithubTab(ctx) {
      const sb = ctx && typeof ctx.get === 'function' ? ctx.get('betterSidebar') : null
      if (!sb || typeof sb.registerTab !== 'function') return null
      if (!githubTabDone) {
        try {
          // 直接注册，不包 ctx.effect：apply 之后调用 ctx.effect 可能被忽略，
          // 那样点按钮就完全没有反应（2026-11-23 用户实测「点绑定没效果」）。
          sb.registerTab({
            id: 'version-history:github',
            title: () => 'GitHub',
            description: () => '绑定 GitHub 仓库、测连通性、手动推送本地仓库',
            icon: (size) => Icon({ size: size }),
            order: 62,
            single: true,
            component: GithubPanel,
          })
          githubTabDone = true
        } catch (err) {
          githubTabDone = false
          if (typeof console !== 'undefined') console.error('[dsh-version-history] registerTab(github) failed:', err)
        }
      }
      return sb
    }

    /* ─── 备份设置（镜像 + 一键拷贝，带可选许可密码） ───────────────── */

    function bkPost(body) {
      return fetch(API.replace('/version-history', '') + '/dsh-vh/backup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).then(function (r) { return r.json() }).catch(function (err) {
        return { ok: false, err: String((err && err.message) || err) }
      })
    }

    function BackupPanel() {
      const [st, setSt] = React.useState(null)
      const [mirror, setMirror] = React.useState('')
      const [keep, setKeep] = React.useState('10')
      const [pw, setPw] = React.useState('')
      const [newPw, setNewPw] = React.useState('')
      const [setup, setSetup] = React.useState(false)
      const [busy, setBusy] = React.useState('')
      const [msg, setMsg] = React.useState('')
      const [bad, setBad] = React.useState('')
      const [last, setLast] = React.useState(null)
      const [autoOn, setAutoOn] = React.useState(false)
      const [autoMode, setAutoMode] = React.useState('daily')
      const [autoAt, setAutoAt] = React.useState('03:30')
      const [autoMin, setAutoMin] = React.useState('360')

      function load() {
        return fetch(API + '/backup.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (s) {
            setSt(s)
            if (s && s.mirror) setMirror(s.mirror)
            if (s && s.keep) setKeep(String(s.keep))
            if (s && !s.passwordMode) setSetup(true)
            if (s && s.lastRun) setLast(s.lastRun)
            if (s && s.auto) {
              setAutoOn(!!s.auto.enabled)
              setAutoMode(s.auto.mode === 'interval' ? 'interval' : 'daily')
              setAutoAt(s.auto.at || '03:30')
              setAutoMin(String(s.auto.minutes || 360))
            }
            return s
          })
          .catch(function (err) { setBad('读取备份配置失败：' + String((err && err.message) || err)) })
      }

      React.useEffect(function () { load() }, [])

      function take(res, okText) {
        setBusy('')
        if (!res || res.ok === false) {
          setMsg('')
          if (res && res.needPassword) setBad('这一步需要许可密码：先在上面输入密码')
          else if (res && res.badPassword) setBad('许可密码不对')
          else setBad((res && (res.err || res.error)) || '操作失败')
          return false
        }
        setBad('')
        setMsg(okText)
        return true
      }

      function savePassword() {
        const v = newPw.trim()
        if (v.length < 4) { setBad('密码至少 4 位'); return }
        setBusy('pw')
        bkPost({ action: 'set-password', password: v }).then(function (res) {
          if (take(res, '已设置许可密码：之后「保存镜像」「一键拷贝」都要输入它')) {
            setSetup(false)
            setNewPw('')
            load()
          }
        })
      }

      function skipPassword() {
        setBusy('pw')
        bkPost({ action: 'set-password', mode: 'none' }).then(function (res) {
          if (take(res, '已设为「不需要密码」：以后不再询问')) {
            setSetup(false)
            load()
          }
        })
      }

      function clearPassword() {
        setBusy('pw')
        bkPost({ action: 'clear-password', password: pw }).then(function (res) {
          if (take(res, '已清除许可密码')) { setPw(''); load() }
        })
      }

      function saveMirror() {
        setBusy('mirror')
        bkPost({ action: 'set-mirror', mirror: mirror, keep: Number(keep) || 10, password: pw })
          .then(function (res) {
            if (take(res, '镜像已保存：' + (res.mirror || ''))) load()
          })
      }

      function saveAuto(enabled) {
        setBusy('auto')
        bkPost({
          action: 'set-auto',
          enabled: typeof enabled === 'boolean' ? enabled : autoOn,
          mode: autoMode,
          at: autoAt,
          minutes: Number(autoMin) || 360,
          password: pw,
        }).then(function (res) {
          const on = !!(res && res.auto && res.auto.enabled)
          if (take(res, on
            ? ('自动备份已开启：' + (res.auto.mode === 'interval'
              ? '每隔 ' + res.auto.minutes + ' 分钟跑一次'
              : '每天 ' + res.auto.at + ' 跑一次'))
            : '自动备份已关闭')) {
            load()
          } else {
            load()
          }
        })
      }

      function runCopy() {
        setBusy('run')
        setMsg('正在拷贝…（每个裸仓都做一次镜像 + bundle，仓库多时会慢一点）')
        bkPost({ action: 'run', password: pw }).then(function (res) {
          if (take(res, '')) {
            setLast(res.lastRun || null)
            const r0 = res.lastRun || {}
            setMsg('一键拷贝完成：' + (r0.okCount || 0) + '/' + (r0.count || 0) + ' 个仓库成功 · '
              + Math.round((r0.ms || 0) / 100) / 10 + ' s')
            load()
          } else if (res && res.results) {
            setLast({ at: new Date().toISOString(), mirror: mirror, results: res.results })
          }
        })
      }

      const hasPw = !!(st && st.hasPassword)
      const pwRow = hasPw
        ? h('div', { className: 'vh-row', key: 'pw' },
          h('span', { className: 'vh-k' }, '密码'),
          h('input', {
            className: 'vh-inp',
            type: 'password',
            placeholder: '许可密码（每次保存镜像 / 一键拷贝都要填）',
            value: pw,
            onChange: function (e) { setPw(e.target.value) },
          }),
          h('button', { className: 'vh-btn', disabled: busy === 'pw', onClick: clearPassword, title: '清除许可密码：之后两个功能都不再校验' }, '清除密码'))
        : null

      const setupCard = setup
        ? h('div', { className: 'vh-bk-card', key: 'setup' },
          h('div', { className: 'vh-bk-t' }, '要不要给备份功能设一个许可密码？'),
          h('div', { className: 'vh-bk-note' },
            '设了之后，每次「保存镜像」和「一键拷贝」都要输入这个密码 —— 防的是误点，不是防人。密码只在本机、用 scrypt 加盐哈希存，不回显。'),
          h('div', { className: 'vh-row' },
            h('input', {
              className: 'vh-inp',
              type: 'password',
              placeholder: '至少 4 位',
              value: newPw,
              onChange: function (e) { setNewPw(e.target.value) },
            }),
            h('button', { className: 'vh-btn', disabled: busy === 'pw', onClick: savePassword }, '设密码'),
            h('button', { className: 'vh-btn', disabled: busy === 'pw', onClick: skipPassword }, '不设密码')),
          h('div', { className: 'vh-bk-note' }, '选「不设密码」以后不再询问；仍可在这个区块里随时补设。'))
        : null

      const mirrorRow = h('div', { className: 'vh-bk-card', key: 'mirror' },
        h('div', { className: 'vh-bk-t' }, '镜像'),
        h('div', { className: 'vh-row' },
          h('span', { className: 'vh-k' }, '目录'),
          h('input', {
            className: 'vh-inp',
            placeholder: '镜像根目录绝对路径，例如 I:\\GitBackup',
            value: mirror,
            onChange: function (e) { setMirror(e.target.value) },
          })),
        h('div', { className: 'vh-row' },
          h('span', { className: 'vh-k' }, '保留'),
          h('input', {
            className: 'vh-inp',
            style: { maxWidth: '84px' },
            value: keep,
            onChange: function (e) { setKeep(e.target.value) },
          }),
          h('span', { className: 'vh-bk-note', style: { margin: 0 } }, '每个仓的 bundle 只留最近 N 份'),
          h('span', { className: 'vh-sp' }),
          h('button', { className: 'vh-btn', disabled: busy === 'mirror', onClick: saveMirror },
            busy === 'mirror' ? '保存中…' : '保存镜像')),
        st && st.mirror
          ? h('div', { className: 'vh-bk-note' },
            '镜像：' + st.mirror + '  ·  bundle：' + st.mirror + '\\bundles\\' + '  ·  日志：' + st.mirror + '\\logs\\')
          : h('div', { className: 'vh-bk-note' }, '还没设置镜像目录。'))

      const autoInfo = (st && st.auto) || {}
      const autoCard = h('div', { className: 'vh-bk-card', key: 'auto' },
        h('div', { className: 'vh-bk-t' }, '自动备份'),
        h('div', { className: 'vh-row' },
          h('label', { className: 'vh-chk' },
            h('input', {
              type: 'checkbox',
              checked: autoOn,
              onChange: function (e) { setAutoOn(e.target.checked); saveAuto(e.target.checked) },
            }),
            h('span', null, autoOn ? '已开启：到点自动跑一次「一键拷贝」' : '未开启')),
          h('span', { className: 'vh-sp' })),
        h('div', { className: 'vh-row' },
          h('span', { className: 'vh-k' }, '方式'),
          h('select', {
            className: 'vh-inp',
            style: { maxWidth: '104px' },
            value: autoMode,
            onChange: function (e) { setAutoMode(e.target.value) },
          },
          h('option', { value: 'daily' }, '每天'),
          h('option', { value: 'interval' }, '每隔')),
          autoMode === 'daily'
            ? h('input', {
              className: 'vh-inp',
              style: { maxWidth: '108px' },
              placeholder: 'HH:mm',
              value: autoAt,
              onChange: function (e) { setAutoAt(e.target.value) },
            })
            : h('input', {
              className: 'vh-inp',
              style: { maxWidth: '92px' },
              value: autoMin,
              onChange: function (e) { setAutoMin(e.target.value) },
            }),
          h('span', { className: 'vh-bk-note', style: { margin: 0 } },
            autoMode === 'daily' ? '本地时间' : '分钟（5–1440）'),
          h('span', { className: 'vh-sp' }),
          h('button', { className: 'vh-btn', disabled: busy === 'auto', onClick: function () { saveAuto() } },
            busy === 'auto' ? '保存中…' : '保存')),
        autoInfo.lastRunAt
          ? h('div', { className: 'vh-bk-note' },
            '上次自动运行：' + String(autoInfo.lastRunAt).replace('T', ' ').slice(0, 19)
            + (autoInfo.lastOk === false ? '（失败）' : '（成功）'))
          : null,
        h('div', { className: 'vh-bk-note' },
          '自动备份是无人值守的：到点直接跑「一键拷贝」，不再校验许可密码；只在 DSH 开着时生效（关掉 DSH 就停）。'
          + '想关机也备份，就去 Windows「任务计划程序」里加一条，动作指向本插件的 Host 路由或 E:\\Git\\scripts\\backup.ps1。'))

      const runCard = h('div', { className: 'vh-bk-card', key: 'run' },
        h('div', { className: 'vh-bk-t' }, '一键拷贝'),
        h('div', { className: 'vh-bk-note' },
          '把下面这些仓逐个镜像到上面那个目录，再各打一份 bundle（已有的走增量 push，没有的整仓 clone）。'),
        st && st.repoPaths && st.repoPaths.length
          ? h('div', { className: 'vh-bk-list' }, st.repoPaths.map(function (r, i) {
            return h('div', { className: 'vh-bk-item', key: 'p' + i },
              h('span', { className: 'vh-bk-n' }, r.name),
              h('span', { className: 'vh-bk-p', title: r.path }, r.path))
          }))
          : h('div', { className: 'vh-bk-note' }, '还没有可备份的仓库（reposRoot 下没有 *.git，页面数据里也没有项目）。'),
        h('div', { className: 'vh-row' },
          h('button', { className: 'vh-btn', disabled: busy === 'run', onClick: runCopy },
            busy === 'run' ? '拷贝中…' : '一键拷贝'),
          h('span', { className: 'vh-sp' }),
          last && last.at
            ? h('span', { className: 'vh-bk-note', style: { margin: 0 } },
              '上次：' + last.at.replace('T', ' ').slice(0, 19)
              + (typeof last.okCount === 'number' ? ' · ' + last.okCount + '/' + last.count + ' 成功' : '')
              + (last.ms ? ' · ' + Math.round(last.ms / 100) / 10 + ' s' : ''))
            : null),
        last && last.repos && last.repos.length
          ? h('div', { className: 'vh-bk-list' }, last.repos.map(function (r, i) {
            return h('div', { className: 'vh-bk-item', key: 'r' + i },
              h('span', { className: 'vh-bk-n' }, r.name),
              h('span', { className: 'vh-bk-p' }, (r.head || '') + (r.bundleBytes ? ' · bundle ' + Math.round(r.bundleBytes / 1024) + ' KB' : '')))
          }))
          : null)

      return h('div', { className: 'vh-dtab' },
        h('style', null, CSS),
        h('div', { className: 'vh-dhead' },
          h('span', { className: 'vh-title', style: { fontSize: '15px' } }, '备份设置'),
          st ? h('span', { className: 'vh-bdg ' + (hasPw ? 'ok' : '') }, hasPw ? '需要许可密码' : '无密码') : null,
          h('span', { className: 'vh-sp' })),
        h('div', { className: 'vh-dbody' },
          setupCard,
          pwRow,
          mirrorRow,
          autoCard,
          runCard,
          msg ? h('div', { className: 'vh-msg ok' }, msg) : null,
          bad ? h('div', { className: 'vh-msg bad' }, bad) : null,
          h('div', { className: 'vh-bk-note' },
            '提示：镜像里的 *.git 可以直接拿来 clone；bundle 是单文件备份，用 `git clone <bundle>` 恢复。'
            + '每天 21:00 的计划任务仍然独立跑（E:\\Git\\scripts\\backup.ps1），这个按钮只是手动补一次。')))
    }

    let backupTabDone = false
    function ensureBackupTab(ctx) {
      const sb = ctx && typeof ctx.get === 'function' ? ctx.get('betterSidebar') : null
      if (!sb || typeof sb.registerTab !== 'function') return null
      if (!backupTabDone) {
        try {
          // hidden：默认不出现在右侧栏标签列表里，只为「备份」子视图与预览脚本保留一个可渲染入口
          sb.registerTab({
            id: 'version-history:backup',
            title: () => '备份',
            description: () => '镜像目录与一键拷贝（可加许可密码）',
            icon: (size) => Icon({ size: size }),
            order: 63,
            single: true,
            hidden: true,
            component: BackupPanel,
          })
          backupTabDone = true
        } catch (err) {
          backupTabDone = false
          if (typeof console !== 'undefined') console.error('[dsh-version-history] registerTab(backup) failed:', err)
        }
      }
      return sb
    }

    function Icon(props) {      const size = (props && props.size) || 20
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true, style: { display: 'block' },
      },
        h('circle', { cx: 6, cy: 5, r: 2.2 }),
        h('circle', { cx: 6, cy: 19, r: 2.2 }),
        h('circle', { cx: 18, cy: 9, r: 2.2 }),
        h('path', { d: 'M6 7.2v9.6' }),
        h('path', { d: 'M18 11.2c0 3.4-3 4.2-6 4.6' }),
      )
    }

    function Stat(label, value) {
      return h('div', { className: 'vh-stat', key: 's:' + label },
        h('div', { className: 'k' }, label),
        h('div', { className: 'v' }, value))
    }

    function Overview(repo, data) {
      const badges = []
      badges.push(h('span', { className: 'vh-bdg', key: 'b0' }, repo.branch || 'main'))
      if (repo.versions && repo.versions.length) {
        badges.push(h('span', { className: 'vh-bdg tag', key: 'b1' }, repo.versions[repo.versions.length - 1].tag))
      }
      badges.push(repo.dirty
        ? h('span', { className: 'vh-bdg warn', key: 'b2' }, '未提交 ' + repo.dirty)
        : h('span', { className: 'vh-bdg ok', key: 'b2' }, '干净'))
      if (data && repo.path === data.primary) {
        badges.push(h('span', { className: 'vh-bdg ' + (data.mirror && data.mirror.synced ? 'ok' : 'warn'), key: 'b3' },
          'I 盘' + (data.mirror && data.mirror.synced ? '已同步' : '未同步')))
      }

      const cmts = (repo.commits || []).slice(0, 8).map((c, i) =>
        h('li', { key: 'c' + i },
          h('span', { className: 'h' }, c.h),
          h('span', {}, c.subject),
          h('span', { style: { marginLeft: 'auto', color: 'var(--dsw-alias-label-secondary)' } }, day(c.iso))))

      const files = (repo.fileList || []).map((f, i) =>
        h('tr', { key: 'f' + i },
          h('td', { className: 'vh-mono' }, f.p),
          h('td', { className: 'num', style: { color: 'var(--dsw-alias-label-secondary)' } }, f.when || '—')))

      return h('div', null,
        h('h2', { className: 'vh-h2' }, repo.name),
        h('div', { className: 'vh-path' }, repo.path),
        h('div', { className: 'vh-badges' }, badges),
        h('div', { className: 'vh-stats' },
          Stat('提交', num(repo.count)),
          Stat('受跟踪文件', num(repo.files)),
          Stat('版本标签', num((repo.versions || []).length)),
          Stat('.git 大小', repo.size || '—'),
          Stat('未提交', num(repo.dirty))),
        h('div', { className: 'vh-sec' }, '最近提交'),
        h('ul', { className: 'vh-cmts' }, cmts),
        h('div', { className: 'vh-sec' }, '受跟踪文件（' + num(repo.fileListTotal) + '）'),
        h('div', { className: 'vh-files' },
          h('table', { className: 'vh-table' },
            h('thead', null, h('tr', null, h('th', null, '文件'), h('th', { className: 'num' }, '最后改动'))),
            h('tbody', null, files))),
        (repo.fileListTotal > (repo.fileList || []).length)
          ? h('div', { className: 'vh-note' }, '只显示前 ' + (repo.fileList || []).length + ' 个文件（共 ' + num(repo.fileListTotal) + ' 个）。')
          : null)
    }

    function VersionDetail(repo, v, pending) {
      const badges = [
        h('span', { className: 'vh-bdg vh-mono', key: 'b0' }, v.hash),
        h('span', { className: 'vh-bdg', key: 'b1' }, day(v.date) + (clock(v.date) ? ' ' + clock(v.date) : '')),
        h('span', { className: 'vh-bdg', key: 'b2' }, num((v.files || []).length) + ' 个文件'),
        h('span', { className: 'vh-bdg', key: 'b3' },
          h('span', { className: 'vh-add' }, '+' + num(v.adds)), ' ',
          h('span', { className: 'vh-del' }, '-' + num(v.dels))),
        h('span', { className: 'vh-bdg', key: 'b4' }, num((v.commits || []).length) + ' 个提交'),
        pending ? h('span', { className: 'vh-bdg warn', key: 'b5' }, '未打标签') : h('span', { className: 'vh-bdg tag', key: 'b5' }, '已发布'),
      ]

      const rows = (v.files || []).slice().sort((a, b) => (b.a + b.d) - (a.a + a.d)).map((f, i) =>
        h('tr', { key: 'f' + i },
          h('td', { className: 'vh-mono' }, f.p),
          h('td', { className: 'num vh-add' }, f.bin ? 'bin' : '+' + num(f.a)),
          h('td', { className: 'num vh-del' }, f.bin ? '' : '-' + num(f.d))))

      const cmts = (v.commits || []).slice().reverse().map((c, i) =>
        h('li', { key: 'c' + i }, h('span', { className: 'h' }, c.h), h('span', {}, c.subject)))

      return h('div', null,
        h('h2', { className: 'vh-h2' }, v.tag + (pending ? '（未发布）' : '')),
        h('div', { className: 'vh-path' }, repo.path),
        h('div', { className: 'vh-badges' }, badges),
        v.message ? h('div', { className: 'vh-note', style: { margin: '0 0 10px' } }, v.message) : null,
        h('div', { className: 'vh-sec' }, '相对上一版的文件变化'),
        (v.files || []).length
          ? h('div', { className: 'vh-files' },
            h('table', { className: 'vh-table' },
              h('thead', null, h('tr', null, h('th', null, '文件'), h('th', { className: 'num' }, '+'), h('th', { className: 'num' }, '−'))),
              h('tbody', null, rows)))
          : h('div', { className: 'vh-note' }, '这一版没有文件变化。'),
        h('div', { className: 'vh-sec' }, '这一版包含的提交'),
        h('ul', { className: 'vh-cmts' }, cmts),
        h('div', { className: 'vh-note' },
          pending
            ? '发布：git tag -a v0.2.0 -m "说明" && git push && git push origin --tags'
            : '对比区间：' + String(v.base || '').slice(0, 7) + '..' + v.hash))
    }

    // 仓库来源判定：http(s):// / git:// / ssh:// 或 UNC（\\host\share）算局域网，其余算本地目录。
    function isLanRepo(p) {
      const s = String(p || '')
      return /^(https?|git|ssh):\/\//i.test(s) || /^\\\\/.test(s)
    }

    function Panel() {
      const [data, setData] = React.useState(null)
      const [err, setErr] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [sel, setSel] = React.useState({ r: 0, kind: 'overview', i: 0 })
      const [q, setQ] = React.useState('')
      const [flash, setFlash] = React.useState('')
      const [newPath, setNewPath] = React.useState('')
      const [notice, setNotice] = React.useState({ text: '', bad: false })
      const [lan, setLan] = React.useState(null)
      const [gh, setGh] = React.useState(null)
      // 主面板内的子视图：'main' | 'github' | 'lan' | 'disks'。
      // 侧边栏 tab 只是「顺手」打开；开不出来也必须在这里有反应。
      const [view, setView] = React.useState('main')

      function openView(name) {
        setView(name)
        if (name === 'backup') return // 备份设置只在主面板内显示，不需要右侧栏
        try {
          if (name === 'github') openGithub(true)
          else if (name === 'lan') openLan(true)
          else openDisks(true)
        } catch (e) { /* 右侧栏不可用时忽略：主面板里的子视图已经切好了 */ }
      }

      function loadGh() {
        return fetch(API + '/github.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (st) { setGh(st && !st.error ? st : null) })
          .catch(function () { setGh(null) })
      }

      function loadLan() {
        return fetch(API + '/lan.json', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (st) { setLan(st && !st.error ? st : { running: false, repos: [], urls: [] }) })
          .catch(function () { setLan({ running: false, repos: [], urls: [] }) })
      }

      function loadData() {
        return fetch(API + '/data.json', { cache: 'no-store' })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status)
            return r.json()
          })
          .then(function (d) {
            if (d && d.error) throw new Error(d.error + (d.detail ? ': ' + d.detail : ''))
            setData(d)
            setErr('')
          })
          .catch(function (e) { setErr(String((e && e.message) || e)) })
      }

      React.useEffect(function () {
        let alive = true
        setBusy(true)
        loadData().then(function () { if (alive) setBusy(false) })
        loadLan()
        loadGh()
        const timer = setInterval(function () { loadLan() }, 15000)
        return function () { alive = false; clearInterval(timer) }
      }, [])

      function regenerate() {
        if (busy) return
        setBusy(true)
        setFlash('')
        fetch(API + '/refresh', { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (res) {
            return loadData().then(function () {
              setFlash(res && res.ok ? '已刷新 · ' + (res.ms || 0) + ' ms' : '刷新失败，见数据文件时间')
            })
          })
          .catch(function (e) { setErr(String((e && e.message) || e)) })
          .then(function () { setBusy(false) })
      }

      // 加仓：写 repos.json → 重跑脚本 → 重取数据
      function addRepo() {
        const p = newPath.trim()
        if (!p || busy) return
        setBusy(true)
        setNotice({ text: '', bad: false })
        fetch(API + '/repos/add?path=' + encodeURIComponent(p), { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (res) {
            if (res && res.error) {
              setNotice({ text: '加不进去：' + res.error, bad: true })
              return null
            }
            setNewPath('')
            return fetch(API + '/refresh', { cache: 'no-store' })
              .then(function (r) { return r.json() })
              .then(function (run) {
                setNotice({
                  text: (run && run.ok ? '已加入并刷新 · ' + (run.ms || 0) + ' ms' : '已加入清单，但重跑脚本失败（下次备份会补上）'),
                  bad: !(run && run.ok),
                })
                return loadData()
              })
          })
          .catch(function (e) { setNotice({ text: '错误：' + ((e && e.message) || e), bad: true }) })
          .then(function () { setBusy(false) })
      }

      function removeRepo(target) {
        if (!target || busy) return
        setBusy(true)
        setNotice({ text: '', bad: false })
        fetch(API + '/repos/remove?path=' + encodeURIComponent(target), { cache: 'no-store' })
          .then(function (r) { return r.json() })
          .then(function (res) {
            if (res && res.error) {
              setNotice({ text: '移除失败：' + res.error, bad: true })
              return null
            }
            return fetch(API + '/refresh', { cache: 'no-store' })
              .then(function (r) { return r.json() })
              .then(function (run) {
                setNotice({ text: (run && run.ok ? '已移除并刷新' : '已从清单移除，重跑脚本失败'), bad: !(run && run.ok) })
                setSel({ r: 0, kind: 'overview', i: 0 })
                return loadData()
              })
          })
          .catch(function (e) { setNotice({ text: '错误：' + ((e && e.message) || e), bad: true }) })
          .then(function () { setBusy(false) })
      }

      const repos = (data && data.repos) || []
      const repo = repos[sel.r] || null
      const kw = q.trim().toLowerCase()
      const lanRepos = repos.filter(function (r) { return isLanRepo(r.path) })
      const localCount = repos.length - lanRepos.length
      const lanRunning = !!(lan && lan.running)
      const lanShared = (lan && lan.repos) || []
      const ghBound = !!(gh && gh.bound)

      // GitHub 徽章：数据来自 Host 侧 /data.json 的 repo.github（自动探测 origin + ls-remote，带 3 分钟缓存）
      function ghBadge(r) {
        const g = r && r.github
        if (!g || !g.state) return null
        const label = {
          synced: ['gh ok', 'GitHub 已同步'],
          ahead: ['gh up', 'GitHub 领先 ' + (g.ahead || 0)],
          behind: ['gh dn', 'GitHub 落后 ' + (g.behind || 0)],
          diverged: ['gh warn', 'GitHub 分叉'],
          unpublished: ['gh warn', 'GitHub 未推送'],
        }[g.state] || ['gh', 'GitHub ?']
        const tip = [
          (g.owner ? g.owner + '/' + g.repo : g.remote || '') + (g.branch ? ' · ' + g.branch : ''),
          g.localHead ? '本地 ' + g.localHead : '',
          g.remoteHead ? '远端 ' + g.remoteHead : '',
          g.checkedAt ? '检查于 ' + String(g.checkedAt).replace('T', ' ').slice(0, 19) : '',
        ].filter(Boolean).join('\n')
        return h('span', { className: 'vh-tag ' + label[0], title: tip }, label[1])
      }

      const treeItems = []
      repos.forEach(function (r, ri) {
        const versions = (r.versions || []).slice().reverse()
        const hit = !kw || r.name.toLowerCase().indexOf(kw) >= 0 ||
          versions.some(function (v) { return ((v.tag || '') + ' ' + (v.message || '')).toLowerCase().indexOf(kw) >= 0 })
        if (!hit) return
        treeItems.push(h('div', { className: 'vh-grp' + (ri === sel.r ? ' on' : ''), key: 'g' + ri },
          h('div', {
            className: 'vh-grp-h',
            onClick: function () { setSel({ r: ri, kind: 'overview', i: 0 }) },
          },
            h('span', { className: 'vh-grp-t' },
              h('span', { className: 'vh-name', title: r.name }, r.name)),
            h('span', { className: 'vh-meta' }, r.count + ' 提交 · ' + (r.versions || []).length + ' 版'),
            h('span', {
              className: 'vh-x',
              title: '从清单移除（不删仓库本身）',
              onClick: function (ev) { ev.stopPropagation(); removeRepo(r.path) },
            }, '✕'))),
          h('div', { className: 'vh-grp-tags' },
            isLanRepo(r.path)
              ? h('span', { className: 'vh-tag lan', title: '局域网共享仓库' }, '局域网')
              : h('span', { className: 'vh-tag loc', title: '本机目录' }, '本地'),
            ghBadge(r)),
          h('div', { className: 'vh-repo-path', title: r.path }, r.path))
        if (ri === sel.r) {
          versions.forEach(function (v, vi) {
            const idx = r.versions.length - 1 - vi
            const on = sel.kind === 'version' && sel.i === idx
            treeItems.push(h('div', {
              className: 'vh-v' + (on ? ' on' : ''),
              key: 'v' + ri + '-' + idx,
              onClick: function () { setSel({ r: ri, kind: 'version', i: idx }) },
            },
              h('span', { className: 't' }, v.tag),
              h('span', { className: 'd' }, day(v.date))))
          })
          if (r.pending) {
            treeItems.push(h('div', {
              className: 'vh-v' + (sel.kind === 'pending' ? ' on' : ''),
              key: 'p' + ri,
              onClick: function () { setSel({ r: ri, kind: 'pending', i: 0 }) },
            },
              h('span', { className: 't', style: { color: 'var(--dsw-alias-state-warn-primary)' } }, '未发布'),
              h('span', { className: 'd' }, ((r.pending.commits || []).length) + ' 提交')))
          }
        }
      })

      let pane = h('div', { className: 'vh-note' }, busy && !data ? '正在读取 data.json…' : '没有可显示的项目')
      if (repo) {
        if (sel.kind === 'version' && repo.versions && repo.versions[sel.i]) {
          pane = VersionDetail(repo, repo.versions[sel.i], false)
        } else if (sel.kind === 'pending' && repo.pending) {
          pane = VersionDetail(repo, repo.pending, true)
        } else {
          pane = Overview(repo, data)
        }
      }

      const head = h('div', { className: 'vh-head' },
        h('span', { className: 'vh-title' }, 'GIT管理'),
        h('span', { className: 'vh-sub' },
          (data ? data.repos.length + ' 个项目 · 生成于 ' + data.generated : '本机 git 项目')),
        flash ? h('span', { className: 'vh-sub', style: { color: 'var(--dsw-alias-state-success-primary)' } }, flash) : null,
        h('span', { className: 'vh-sp' }),
        h('button', { className: 'vh-btn', onClick: regenerate, disabled: busy }, busy ? '刷新中…' : '重新生成'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { openView('disks') },
          title: '在右侧栏打开磁盘面板（容量 / 机械·固态属性 / 稳定性风险）',
        }, '磁盘面板'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { openView('lan') },
          title: '把 E:\\Git\\repos 里的裸仓库共享到局域网（clone / push）',
        }, '局域网'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { openView('github') },
          title: ghBound ? ('GitHub：已绑定 ' + gh.fullName + '（绑定 / 测连接 / 手动推送）') : 'GitHub：绑定远程仓库、测连通性、手动推送',
        }, ghBound ? 'GitHub · 已绑定' : 'GitHub'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { openView('backup') },
          title: '备份设置：设置镜像目录、一键拷贝（可加许可密码）',
        }, '备份'),
        h('button', {
          className: 'vh-btn',
          onClick: function () { window.open(API + '/report', '_blank', 'noopener') },
        }, '新标签打开'))

      return h('div', { className: 'vh' },
        h('style', null, CSS),
        head,
        err ? h('div', { className: 'vh-err' }, '读取失败：' + err + '\n（先跑一次 E:\\Git\\scripts\\visualize.ps1）') : null,
        Disks(data),
        h('div', { className: 'vh-body' },
          h('aside', { className: 'vh-tree' },
            h('div', { className: 'vh-src' },
              h('div', { className: 'vh-src-h' }, '仓库来源'),
              h('div', { className: 'vh-src-row' },
                h('span', { className: 'vh-dot on' }),
                h('span', { className: 'vh-k' }, '本地'),
                h('span', { className: 'vh-v2' }, localCount + ' 个仓库 · 本机目录'),
                h('span', { className: 'vh-sp' })),
              h('div', { className: 'vh-src-row' },
                h('span', { className: 'vh-dot ' + (lanRunning ? 'on' : 'off') }),
                h('span', { className: 'vh-k' }, '局域网'),
                h('span', {
                  className: 'vh-v2',
                  title: lanRunning
                    ? ('已共享 ' + lanShared.length + ' 个裸仓库，可被局域网内其他机器 clone / push；点右侧「管理」看地址')
                    : '未开启共享：点右侧「开启」起一个 8788 端口的只读+可推 Smart HTTP',
                },
                  lanRunning
                    ? ('在线 · :' + (lan.port || '') + ' · ' + lanShared.length + ' 个')
                    : ('离线（未开启' + (lanRepos.length ? ' · 清单里 ' + lanRepos.length + ' 个局域网仓库' : '') + '）')),
                h('span', { className: 'vh-sp' }),
                h('button', {
                  className: 'vh-mini',
                  onClick: function () { openView('lan') },
                  title: '打开局域网面板：启动 / 停止共享、复制 clone 地址、放行防火墙',
                }, lanRunning ? '管理' : '开启')),
              h('div', { className: 'vh-src-row' },
                h('span', { className: 'vh-dot ' + (ghBound ? 'on' : 'off') }),
                h('span', { className: 'vh-k' }, 'GitHub'),
                h('span', {
                  className: 'vh-v2',
                  title: ghBound
                    ? ('已绑定 ' + (gh && gh.fullName) + (gh && gh.hasToken ? ' · 令牌已保存（DPAPI 加密）' : ' · 还没保存令牌') + '；推送是手动按钮')
                    : '未绑定：点右侧「绑定」填 owner/repo 与访问令牌，之后可手动推送',
                },
                  ghBound
                    ? ((gh.fullName || '') + (gh && gh.hasToken ? ' · 可推送' : ' · 缺令牌'))
                    : '未绑定'),
                h('span', { className: 'vh-sp' }),
                h('button', {
                  className: 'vh-mini',
                  onClick: function () { openView('github') },
                  title: '打开 GitHub 面板：绑定仓库、测连接、手动推送',
                }, ghBound ? '管理' : '绑定'))),
            h('input', {
              className: 'vh-q',
              placeholder: '搜索项目 / 版本',
              value: q,
              onChange: function (e) { setQ(e.target.value) },
            }),
            h('div', { className: 'vh-add' },
              h('input', {
                placeholder: '加项目：仓库绝对路径',
                value: newPath,
                onChange: function (e) { setNewPath(e.target.value) },
                onKeyDown: function (e) { if (e.key === 'Enter') addRepo() },
              }),
              h('button', { className: 'vh-btn', onClick: addRepo, disabled: busy }, '加入')),
            notice.text
              ? h('div', { className: 'vh-msg' + (notice.bad ? ' bad' : '') }, notice.text)
              : null,
            treeItems),
          view === 'main'
            ? h('section', { className: 'vh-pane' }, pane)
            : h('section', { className: 'vh-pane' },
              h('div', { className: 'vh-subbar' },
                h('button', { className: 'vh-btn', onClick: function () { setView('main') } }, '← 返回'),
                h('span', { className: 'vh-title', style: { fontSize: '14px' } },
                  view === 'github' ? 'GitHub'
                    : (view === 'lan' ? '局域网 Git'
                      : (view === 'backup' ? '备份设置' : '磁盘'))),
                h('span', { className: 'vh-sp' })),
              view === 'github' ? h(GithubPanel, null)
                : (view === 'lan' ? h(LanPanel, null)
                  : (view === 'backup' ? h(BackupPanel, null) : h(DiskPanel, null)))),
          // 常驻磁盘面板：宽度够时一直显示在右列（窄屏自动收起，见 CSS 媒体查询）
          h('aside', { className: 'vh-dcol' }, h(DiskPanel, { embedded: true }))))
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctxRef = ctx
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'version-history',
          order: 21,
          label: () => 'GIT管理',
        }, Icon))
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'version-history',
        }, Panel))
        // 右侧栏：better-sidebar 的标签页（磁盘 / 局域网），没有这个插件就静默跳过
        ensureDisksTab(ctx)
        ensureLanTab(ctx)
        ensureGithubTab(ctx)
        ensureBackupTab(ctx)
      },
    }
  },
})
