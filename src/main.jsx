import React from 'react'
import ReactDOM from 'react-dom/client'
import ReleaseReadinessBoundary from './components/ReleaseReadinessBoundary.jsx'
import RuntimeErrorBoundary from './components/RuntimeErrorBoundary.jsx'
import { checkBackendHealth, getBackendStatusLabel, logBackendHealth } from './lib/backendHealth.js'
import { clearStaleDemoSession, isDemoRuntimeEnabled } from './lib/runtimeReleaseReadiness.js'
import { installPlayerAssignmentEnhancer } from './lib/playerAssignmentEnhancer.js'
import { verifySupabaseSchema } from './lib/supabaseSchemaVerification.js'

const STARTUP_ERROR_TITLE = 'SHOTLAB STARTUP ERROR'
const BOOT_TIMEOUT_MS = 10000
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams('')
const bootDebugEnabled = params.get('bootDebug') === '1'
const DEV = Boolean(typeof import.meta !== 'undefined' && import.meta?.env?.DEV)
const EXPLICIT_DEMO_RUNTIME = isDemoRuntimeEnabled()

let startupErrorShown = false
let appHasCommitted = false
let bootPanelEl = null
let bootPanelListEl = null

function installBrowserStorageFallback() {
  if (typeof window === 'undefined' || window.storage || !window.localStorage) return
  const local = window.localStorage
  window.storage = {
    async get(key) {
      return { value: local.getItem(String(key)) }
    },
    async set(key, value) {
      local.setItem(String(key), String(value))
      return { value: String(value) }
    },
    async remove(key) {
      local.removeItem(String(key))
      return { value: null }
    },
    async delete(key) {
      local.removeItem(String(key))
      return { value: null }
    },
  }
}

function renderBootPanel() {
  if (!bootDebugEnabled || bootPanelEl || !document.body) return
  bootPanelEl = document.createElement('aside')
  bootPanelEl.setAttribute('aria-label', 'ShotLab boot debug')
  bootPanelEl.style.cssText = 'position:fixed;right:12px;bottom:12px;width:min(360px,calc(100vw - 24px));max-height:45vh;overflow:auto;background:rgba(8,8,8,.92);border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px;z-index:2147483647;color:#e5e7eb;font:12px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;'
  const title = document.createElement('div')
  title.textContent = 'BOOT DEBUG (?bootDebug=1)'
  title.style.cssText = 'font-weight:700;letter-spacing:.06em;margin-bottom:6px;color:#C8FF1A;'
  bootPanelListEl = document.createElement('div')
  bootPanelListEl.style.cssText = 'display:grid;gap:4px;'
  bootPanelEl.append(title, bootPanelListEl)
  document.body.appendChild(bootPanelEl)
}

function markBoot(stage, detail = '') {
  const stamp = new Date().toISOString().split('T')[1].replace('Z', '')
  const row = `${stamp} — ${stage}${detail ? `: ${detail}` : ''}`
  if (!bootDebugEnabled) return
  renderBootPanel()
  const item = document.createElement('div')
  item.textContent = row
  item.style.color = '#d1d5db'
  bootPanelListEl?.appendChild(item)
}

if (typeof window !== 'undefined') {
  installBrowserStorageFallback()
  window.__shotlabBootMark = markBoot
  if (DEV) {
    window.__shotlabBackendStatus = async () => {
      const status = await checkBackendHealth()
      return { code: status.status, label: getBackendStatusLabel(status.status), ok: status.ok }
    }
    window.__shotlabSupabaseSchemaStatus = async () => verifySupabaseSchema()
  }
}

function syncViewportHeightVar() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  document.documentElement.style.setProperty('--app-vh', `${window.innerHeight * 0.01}px`)
}

function registerRuntimeListeners() {
  let rafId = null
  const schedule = () => {
    if (rafId != null) return
    rafId = window.requestAnimationFrame(() => {
      rafId = null
      syncViewportHeightVar()
    })
  }
  syncViewportHeightVar()
  window.addEventListener('resize', schedule, { passive: true })
  window.visualViewport?.addEventListener('resize', schedule, { passive: true })
}

function renderStartupError(message) {
  if (startupErrorShown) return
  startupErrorShown = true
  const target = document.getElementById('root') || document.body
  if (!target) return
  target.innerHTML = `
    <div style="min-height:100vh;background:#080808;display:flex;align-items:center;justify-content:center;padding:24px;">
      <div style="width:100%;max-width:520px;background:#15171B;border:1px solid rgba(255,69,69,.45);border-radius:16px;padding:20px;box-sizing:border-box;">
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#FF8B8B;font-size:20px;font-weight:700;letter-spacing:.08em;margin-bottom:8px;">${STARTUP_ERROR_TITLE}</div>
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#FFB5B5;font-size:13px;line-height:1.55;">${message}</div>
      </div>
    </div>`
}

markBoot('main_executed')
registerRuntimeListeners()
installPlayerAssignmentEnhancer()

window.addEventListener('error', event => {
  const message = event?.error?.message || event?.message || 'Unexpected runtime error before app mount.'
  if (!appHasCommitted) renderStartupError(message)
})

window.addEventListener('unhandledrejection', event => {
  const reason = event?.reason
  const message = typeof reason === 'string' ? reason : reason?.message || 'Unhandled async startup error.'
  if (!appHasCommitted) renderStartupError(message)
})

let bootTimeoutId = null
window.addEventListener('shotlab:app-ready', () => {
  appHasCommitted = true
  if (bootTimeoutId) clearTimeout(bootTimeoutId)
}, { once: true })

;(async () => {
  try {
    markBoot('startup_mode', EXPLICIT_DEMO_RUNTIME ? 'explicit_demo' : 'authentication')

    // Normal launches must complete demo-session cleanup before App can hydrate.
    // This eliminates the startup race that previously restored Coach Demo.
    if (!EXPLICIT_DEMO_RUNTIME) {
      await clearStaleDemoSession({
        env: { DEV: false, VITE_ENABLE_DEMO_MODE: 'false' },
        location: window.location,
      })
      try {
        window.localStorage?.removeItem('sl:demoMode')
        window.localStorage?.removeItem('sl:demoSession')
        window.sessionStorage?.removeItem('sl:demoMode')
        window.sessionStorage?.removeItem('sl:demoSession')
      } catch {}
      document.documentElement.classList.remove('shotlab-demo')
      markBoot('demo_cleanup', 'completed_before_app_import')
    }

    // Demo data is no longer bootstrapped during application startup.
    // Coach and Player demos are launched only by explicit UI actions in App.
    const { default: App } = await import('./App.jsx')
    const rootEl = document.getElementById('root')
    if (!rootEl) throw new Error('Missing root container (#root).')

    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <RuntimeErrorBoundary>
          <ReleaseReadinessBoundary>
            <App />
          </ReleaseReadinessBoundary>
        </RuntimeErrorBoundary>
      </React.StrictMode>
    )

    checkBackendHealth().then(status => {
      logBackendHealth(status)
      markBoot('backend_health', status.status)
    }).catch(() => markBoot('backend_health', 'health_check_failed'))

    if (DEV) {
      verifySupabaseSchema().then(status => markBoot('schema_verify', status.status))
        .catch(() => markBoot('schema_verify', 'schema_check_failed'))
    }

    bootTimeoutId = window.setTimeout(() => {
      markBoot('boot_timeout', appHasCommitted ? 'app_already_committed' : 'waiting_for_app_ready')
    }, BOOT_TIMEOUT_MS)
  } catch (error) {
    renderStartupError(error?.message || 'App module failed to load before mount.')
  }
})()
