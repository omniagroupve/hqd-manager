const AUTH_KEY = 'hqd_auth_v1'
const SESSION_TIMEOUT = 10 * 60 * 1000 // 10 min

interface AuthData {
  pinHash: string
  passkeyRegistered: boolean
  lastActivity: number
}

function hash(pin: string): string {
  // Simple hash for demo — in production use bcrypt/argon2 via backend
  let h = 0
  for (let i = 0; i < pin.length; i++) {
    h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0
  }
  return h.toString(36) + pin.length.toString(36) + 'x7'
}

export function isSetup(): boolean {
  return !!localStorage.getItem(AUTH_KEY)
}

export function setupPin(pin: string) {
  const data: AuthData = { pinHash: hash(pin), passkeyRegistered: false, lastActivity: Date.now() }
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
}

export function verifyPin(pin: string): boolean {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return false
  const data: AuthData = JSON.parse(raw)
  if (data.pinHash !== hash(pin)) return false
  data.lastActivity = Date.now()
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
  sessionStorage.setItem('hqd_session', '1')
  return true
}

export function isSessionActive(): boolean {
  if (!sessionStorage.getItem('hqd_session')) return false
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return false
  const data: AuthData = JSON.parse(raw)
  return Date.now() - data.lastActivity < SESSION_TIMEOUT
}

export function refreshSession() {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return
  const data: AuthData = JSON.parse(raw)
  data.lastActivity = Date.now()
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
}

export function logout() {
  sessionStorage.removeItem('hqd_session')
}

// WebAuthn / Passkey (Face ID / Touch ID / Fingerprint)
export async function registerPasskey(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'HQD Manager', id: location.hostname },
        user: { id: new TextEncoder().encode('user'), name: 'owner', displayName: 'Dueño' },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: { userVerification: 'required', residentKey: 'preferred' },
        timeout: 60000,
      },
    }) as PublicKeyCredential
    if (!cred) return false
    const raw = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}')
    raw.passkeyRegistered = true
    raw.passkeyId = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)))
    localStorage.setItem(AUTH_KEY, JSON.stringify(raw))
    return true
  } catch {
    return false
  }
}

export async function authenticatePasskey(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return false
  const data = JSON.parse(raw)
  if (!data.passkeyRegistered) return false
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const cred = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: location.hostname,
        userVerification: 'required',
        timeout: 60000,
      },
    })
    if (!cred) return false
    data.lastActivity = Date.now()
    localStorage.setItem(AUTH_KEY, JSON.stringify(data))
    sessionStorage.setItem('hqd_session', '1')
    return true
  } catch {
    return false
  }
}

export function isPasskeyRegistered(): boolean {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return false
  return JSON.parse(raw).passkeyRegistered === true
}
