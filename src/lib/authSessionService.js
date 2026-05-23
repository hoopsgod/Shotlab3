const AUTH_SESSION_STATUS = {
  CONFIG_MISSING: 'config_missing',
  CONFIGURED_NO_SESSION: 'configured_no_session',
  AUTHENTICATED: 'authenticated',
  AUTH_UNAVAILABLE: 'auth_unavailable',
}

const toSafeErrorCode = (error) => {
  if (!error) return null
  if (typeof error.code === 'string' && error.code) return error.code
  return 'auth_error'
}

const buildStatus = ({ status, configured, hasSession, user = null, errorCode = null }) => ({
  status,
  configured,
  hasSession,
  user,
  errorCode,
})

const safeGetSession = async (supabaseClient) => {
  try {
    const res = await supabaseClient?.auth?.getSession?.()
    return { session: res?.data?.session || null, error: res?.error || null }
  } catch (error) {
    return { session: null, error }
  }
}

export function createAuthSessionService({ supabaseClient, diagnostics = false } = {}) {
  const configured = Boolean(supabaseClient?.isConfigured)
  let currentStatus = buildStatus({ status: AUTH_SESSION_STATUS.CONFIG_MISSING, configured: false, hasSession: false })

  const evaluate = async () => {
    if (!configured) {
      currentStatus = buildStatus({ status: AUTH_SESSION_STATUS.CONFIG_MISSING, configured: false, hasSession: false })
      return currentStatus
    }

    const { session, error } = await safeGetSession(supabaseClient)
    if (error) {
      currentStatus = buildStatus({
        status: AUTH_SESSION_STATUS.AUTH_UNAVAILABLE,
        configured: true,
        hasSession: false,
        errorCode: toSafeErrorCode(error),
      })
      return currentStatus
    }

    if (!session?.user) {
      currentStatus = buildStatus({ status: AUTH_SESSION_STATUS.CONFIGURED_NO_SESSION, configured: true, hasSession: false })
      return currentStatus
    }

    currentStatus = buildStatus({ status: AUTH_SESSION_STATUS.AUTHENTICATED, configured: true, hasSession: true, user: session.user })
    return currentStatus
  }

  const subscribe = (onChange) => {
    if (!configured || typeof supabaseClient?.auth?.onAuthStateChange !== 'function') {
      return () => {}
    }

    const subscription = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        currentStatus = buildStatus({ status: AUTH_SESSION_STATUS.AUTHENTICATED, configured: true, hasSession: true, user: session.user })
      } else {
        currentStatus = buildStatus({ status: AUTH_SESSION_STATUS.CONFIGURED_NO_SESSION, configured: true, hasSession: false })
      }
      if (typeof onChange === 'function') onChange(currentStatus)
    })

    return () => subscription?.data?.subscription?.unsubscribe?.()
  }

  return {
    get status() {
      return currentStatus
    },
    evaluate,
    subscribe,
    getDiagnostics() {
      if (!diagnostics) return null
      return {
        status: currentStatus.status,
        configured: currentStatus.configured,
        hasSession: currentStatus.hasSession,
        errorCode: currentStatus.errorCode,
      }
    },
  }
}

export { AUTH_SESSION_STATUS }
