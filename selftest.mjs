// Offline shape test for the client half: load lib/client.js under a stub module
// loader, hand it a fake ctx, and print what it registers.
// Usage: node selftest.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, 'lib', 'client.js'), 'utf8')

let captured = null
const React = {
  createElement(type, props, ...children) {
    return { type, props: props ?? {}, children }
  },
  Fragment: 'Fragment',
  useState(initial) {
    return [initial, () => {}]
  },
  useEffect() {},
  useMemo(fn) {
    return fn()
  },
  useRef(v) {
    return { current: v }
  },
  useCallback(fn) {
    return fn
  },
}

const required = []
const req = (id) => {
  required.push(id)
  if (id === 'react') return React
  throw new Error('unexpected require(' + id + ')')
}

const win = globalThis
win.window = win
win.__ModuleLoader__ = {
  load(mod) {
    captured = mod
  },
}

new Function('window', 'require', src)(win, req)

if (!captured) throw new Error('client.js never called window.__ModuleLoader__.load')
const { id, factory } = captured
const mod = factory(req)
const events = []
const ctx = {
  slots: {
    inject(key, cb) {
      events.push({ inject: key })
      cb()
    },
    register(options, component) {
      events.push({
        register: options,
        component: typeof component,
        renders: (() => {
          try {
            const out = component({ size: 20, active: false })
            return out && out.type ? String(out.type) : typeof out
          } catch (e) {
            return 'render-error: ' + e.message
          }
        })(),
      })
      return () => {}
    },
  },
  effect(cb) {
    const d = cb()
    return typeof d === 'function' ? d : () => {}
  },
  on() {
    return () => {}
  },
  get() {
    return undefined
  },
}

mod.apply(ctx)

console.log(
  JSON.stringify(
    { moduleId: id, inject: mod.inject ?? null, requires: [...new Set(required)], events },
    null,
    2
  )
)
