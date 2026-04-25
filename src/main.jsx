import React from 'react'
import ReactDOM from 'react-dom/client'
import { demoBootstrap } from './lib/demoBootstrap.ts'
import { supabase } from './lib/supabase.js'

const STARTUP_ERROR_TITLE = 'SHOTLAB STARTUP ERROR'
const BOOT_TIMEOUT_MS = 10000
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams('')
const bootDebugEnabled = params.get('bootDebug') === '1'

let startupErrorShown = false
let bootPanelEl = null
let bootPanelListEl = null
const bootMarks = []

function renderBootPanel() {
  if (!bootDebugEnabled || bootPanelEl || !document.body) return
  bootPanelEl = document.createElement('aside')
  bootPanelEl.setAttribute('aria-label', 'ShotLab boot debug')
  bootPanelEl.style.cssText = 'position:fixed;right:12px;bottom:12px;width:min(360px,calc(100vw - 24px));max-height:45vh;overflow:auto;background:rgba(8,8,8,0.92);border:1px solid rgba(255,255,255,0.18);border-radius:10px;padding:10px;z-index:2147483647;color:#e5e7eb;font:12px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;'
  const title = document.createElement('div')
  title.textContent = 'BOOT DEBUG (?bootDebug=1)'
  title.style.cssText = 'font-weight:700;letter-spacing:.06em;margin-bottom:6px;color:#C8FF1A;'
  bootPanelListEl = document.createElement('div')
  bootPanelListEl.style.display = 'grid'
  bootPanelListEl.style.gap = '4px'
  bootPanelEl.appendChild(title)
  bootPanelEl.appendChild(bootPanelListEl)
  document.body.appendChild(bootPanelEl)
}

function markBoot(stage, detail = '') {
  const stamp = new Date().toISOString().split('T')[1].replace('Z', '')
  const row = `${stamp} — ${stage}${detail ? `: ${detail}` : ''}`
  bootMarks.push(row)
  if (bootDebugEnabled) {
    renderBootPanel()
    if (bootPanelListEl) {
      const item = document.createElement('div')
      item.textContent = row
      item.style.color = '#d1d5db'
      bootPanelListEl.appendChild(item)
      bootPanelListEl.scrollTop = bootPanelListEl.scrollHeight
    }
  }
}

if (typeof window !== 'undefined') {
  window.__shotlabBootMark = markBoot
}

function renderStartupError(message) {
  if (startupErrorShown) return
  startupErrorShown = true
  const target = document.getElementById('root') || document.body
  if (!target) return
  markBoot('startup_error', message)
  target.innerHTML = `
    <div style="min-height:100vh;background:#080808;display:flex;align-items:center;justify-content:center;padding:24px;">
      <div style="width:100%;max-width:520px;background:#15171B;border:1px solid rgba(255,69,69,0.45);border-radius:16px;padding:20px;box-sizing:border-box;">
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#FF8B8B;font-size:20px;font-weight:700;letter-spacing:.08em;margin-bottom:8px;">${STARTUP_ERROR_TITLE}</div>
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#FFB5B5;font-size:13px;line-height:1.55;">${message}</div>
      </div>
    </div>
  `
  if (bootDebugEnabled) {
    renderBootPanel()
  }
}

markBoot('index_loaded')
markBoot('main_executed')

window.addEventListener('error', (event) => {
  const msg = event?.error?.message || event?.message || 'Unexpected runtime error before app mount.'
  renderStartupError(msg)
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason
  const msg = typeof reason === 'string' ? reason : reason?.message || 'Unhandled async startup error.'
  renderStartupError(msg)
})

if (!supabase.isConfigured) {
  renderStartupError('Missing Supabase configuration for this deployment.')
} else {
  let bootTimeoutId = null
  const onAppReady = () => {
    markBoot('hydration_completed')
    if (bootTimeoutId) {
      clearTimeout(bootTimeoutId)
      bootTimeoutId = null
    }
  }
  window.addEventListener('shotlab:app-ready', onAppReady, { once: true })

  ;(async () => {
    try {
      markBoot('app_import_started')
      const { default: App } = await import('./App.jsx')
      markBoot('app_import_succeeded')

      try {
        demoBootstrap()
      } catch {
        renderStartupError('Startup bootstrap failed before app mount.')
        return
      }

      const rootEl = document.getElementById('root')
      markBoot('react_root_checked', rootEl ? 'found' : 'missing')
      if (!rootEl) {
        renderStartupError('Missing root container (#root).')
        return
      }

      markBoot('react_render_started')
      ReactDOM.createRoot(rootEl).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      )
      markBoot('react_render_completed')
      markBoot('hydration_started')

      bootTimeoutId = window.setTimeout(() => {
        if (!startupErrorShown) {
          renderStartupError('Startup timeout while loading app state. Open with ?bootDebug=1 for boot phases.')
        }
      }, BOOT_TIMEOUT_MS)
    } catch (error) {
      const msg = error?.message || 'App module failed to load before mount.'
      renderStartupError(msg)
    }
  })()
}
