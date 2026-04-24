import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { demoBootstrap } from './lib/demoBootstrap.ts'
import { supabase } from './lib/supabase.js'

const STARTUP_ERROR_TITLE = 'SHOTLAB STARTUP ERROR'
let startupErrorShown = false

function renderStartupError(message) {
  if (startupErrorShown) return
  startupErrorShown = true
  const target = document.getElementById('root') || document.body
  if (!target) return
  target.innerHTML = `
    <div style="min-height:100vh;background:#080808;display:flex;align-items:center;justify-content:center;padding:24px;">
      <div style="width:100%;max-width:520px;background:#15171B;border:1px solid rgba(255,69,69,0.45);border-radius:16px;padding:20px;box-sizing:border-box;">
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#FF8B8B;font-size:20px;font-weight:700;letter-spacing:.08em;margin-bottom:8px;">${STARTUP_ERROR_TITLE}</div>
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#FFB5B5;font-size:13px;line-height:1.55;">${message}</div>
      </div>
    </div>
  `
}

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
  try {
    demoBootstrap()
  } catch (error) {
    renderStartupError('Startup bootstrap failed before app mount.')
  }

  try {
    const rootEl = document.getElementById('root')
    if (!rootEl) {
      renderStartupError('Missing root container (#root).')
    } else {
      ReactDOM.createRoot(rootEl).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      )
    }
  } catch (error) {
    renderStartupError('React mount failed during startup.')
  }
}
