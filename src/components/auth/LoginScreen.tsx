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
          setTimeout(() => setShake(false), 500)
        }
      }, 100)
    }
  }

  async function handleBiometric() {
    const ok = await authenticatePasskey()
    if (ok) onSuccess()
    else setError('Biometría no disponible o cancelada')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-app px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
            className="text-7xl mb-4"
          >
            💨
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">HQD Manager</h1>
          <p className="text-purple-400 mt-1 text-sm">Control total de tu negocio</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-red-400 text-sm mb-4"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Dots */}
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex justify-center gap-4 mb-10"
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: pin.length > i ? 1.3 : 1 }}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                pin.length > i ? 'bg-purple-400 border-purple-400 shadow-[0_0_12px_#a855f7]' : 'border-purple-700'
              }`}
            />
          ))}
        </motion.div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: k ? 0.88 : 1 }}
              onClick={() => k === '⌫' ? setPin(p => p.slice(0,-1)) : k ? handleDigit(k) : null}
              className={`h-16 rounded-2xl text-xl font-semibold select-none transition-colors ${
                k ? 'bg-surface hover:bg-purple-900/40 text-white active:bg-purple-800/60' : ''
              }`}
            >
              {k}
            </motion.button>
          ))}
        </div>

        {hasPasskey && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBiometric}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-purple-600/20 border border-purple-600/40 text-purple-300 hover:bg-purple-600/30 transition-colors"
          >
            <Fingerprint className="w-6 h-6" />
            <span>Face ID / Huella</span>
          </motion.button>
        )}
      </motion.div>
    </div>
  )
}
