import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { verifyPin, authenticatePasskey, isPasskeyRegistered } from '../../lib/auth'
import { Fingerprint } from 'lucide-react'

interface Props { onSuccess: () => void }

export default function LoginScreen({ onSuccess }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const hasPasskey = isPasskeyRegistered()

  function handleDigit(d: string) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) {
      setTimeout(() => {
        if (verifyPin(next)) {
          onSuccess()
        } else {
          setShake(true)
          setError('PIN incorrecto')
          setPin('')
          setTimeout(() => setShake(false), 600)
        }
      }, 80)
    }
  }

  async function handleBiometric() {
    const ok = await authenticatePasskey()
    if (ok) onSuccess()
    else setError('Biometría cancelada')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-app px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="text-7xl mb-5 inline-block"
          >💨</motion.div>
          <h1 className="text-display text-white">HQD</h1>
          <p className="text-headline text-white/40 mt-1">Manager</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center text-red-400 text-sm font-medium mb-4 py-2 px-4 rounded-xl bg-red-500/10 border border-red-500/20 mx-4"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* PIN dots */}
        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, -6, 6, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center gap-5 mb-10"
        >
          {[0,1,2,3].map(i => (
            <motion.div
              key={i}
              animate={pin.length > i ? { scale: [1.3, 1], opacity: 1 } : { scale: 1, opacity: 0.3 }}
              transition={{ duration: 0.2 }}
              className="w-4 h-4 rounded-full"
              style={{
                background: pin.length > i ? 'linear-gradient(135deg, #a78bfa, #7c3aed)' : 'rgba(255,255,255,0.2)',
                boxShadow: pin.length > i ? '0 0 12px rgba(139,92,246,0.7)' : 'none',
              }}
            />
          ))}
        </motion.div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 px-2 mb-6">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <motion.button
              key={i}
              whileTap={k ? { scale: 0.88 } : {}}
              onClick={() => k === '⌫' ? setPin(p => p.slice(0,-1)) : k ? handleDigit(k) : null}
              className={`h-16 rounded-2xl text-xl font-medium select-none transition-all duration-100 ${
                k === '⌫'
                  ? 'text-gray-400 bg-white/5'
                  : k
                  ? 'text-white bg-white/8 hover:bg-white/12 active:bg-white/5'
                  : ''
              }`}
              style={k && k !== '⌫' ? { letterSpacing: '-0.02em' } : {}}
            >
              {k}
            </motion.button>
          ))}
        </div>

        {/* Biometric */}
        {hasPasskey && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBiometric}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-colors"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-violet-300">Face ID / Touch ID</span>
          </motion.button>
        )}
      </motion.div>
    </div>
  )
}
