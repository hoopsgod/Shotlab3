import test from 'node:test'
import assert from 'node:assert/strict'

import { createAuthSessionService, AUTH_SESSION_STATUS } from '../src/lib/authSessionService.js'

test('missing env/config keeps app safe in demo mode', async () => {
  const service = createAuthSessionService({ supabaseClient: null, diagnostics: true })
  const status = await service.evaluate()
  assert.equal(status.status, AUTH_SESSION_STATUS.CONFIG_MISSING)
  assert.equal(status.hasSession, false)
  assert.equal(service.getDiagnostics()?.status, AUTH_SESSION_STATUS.CONFIG_MISSING)
})

test('configured auth with no session remains non-blocking', async () => {
  const supabaseClient = {
    isConfigured: true,
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  }
  const service = createAuthSessionService({ supabaseClient })
  const status = await service.evaluate()
  assert.equal(status.status, AUTH_SESSION_STATUS.CONFIGURED_NO_SESSION)
  assert.equal(status.hasSession, false)
})

test('auth unavailable returns safe status and no throw', async () => {
  const supabaseClient = {
    isConfigured: true,
    auth: { getSession: async () => ({ data: { session: null }, error: { code: 'network_down', message: 'x' } }) },
  }
  const service = createAuthSessionService({ supabaseClient, diagnostics: true })
  const status = await service.evaluate()
  assert.equal(status.status, AUTH_SESSION_STATUS.AUTH_UNAVAILABLE)
  assert.equal(status.errorCode, 'network_down')
  assert.equal(service.getDiagnostics()?.errorCode, 'network_down')
})

test('auth listener safely no-ops when auth is unavailable/missing', () => {
  const service = createAuthSessionService({ supabaseClient: null })
  const unsubscribe = service.subscribe(() => {})
  assert.equal(typeof unsubscribe, 'function')
  assert.doesNotThrow(() => unsubscribe())
})

test('auth listener updates to authenticated state when event fires', async () => {
  let callback = null
  const supabaseClient = {
    isConfigured: true,
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (fn) => {
        callback = fn
        return { data: { subscription: { unsubscribe() {} } } }
      },
    },
  }

  const service = createAuthSessionService({ supabaseClient })
  await service.evaluate()
  service.subscribe(() => {})
  await callback('SIGNED_IN', { user: { id: 'u1', email: 'coach@shotlab.dev' } })

  assert.equal(service.status.status, AUTH_SESSION_STATUS.AUTHENTICATED)
  assert.equal(service.status.hasSession, true)
})
