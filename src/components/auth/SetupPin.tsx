import { useState } from 'react'
import { motion } from 'framer-motion'
import { setupPin, registerPasskey } from '../../lib/auth'
import { Fingerprint } from 'lucide-react'

interface Props { onDone: () => void }

export default function SetupPin({ onDone }: Props) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState<'create' | 'confirm' | 'biometric'>('create')
  const [error, setError] = useState('')

  function handleDigit(d: string) {
    if (step === 'create') {
      const next = pin + d
      setPin(next)
      if (next.length === 4) setTimeout(() => setStep('confirm'), 200)
    } else if (step === 'confirm') {
      const next = confirm + d
      setConfirm(next)
      if (next.length === 4) {
        if (next === pin) { setupPin(next); setStep('biometric') }
        else { setError('No coinciden'); setPin(''); setConfirm(''); setTimeout(() => { setError(''); setStep('create') }, 1000) }
      }
    }
  }

  async function setupBiometric() {
    await registerPasskey()
    onDone()
  }

  const current = step === 'create' ? pin : step === 'confirm' ? confirm : ''

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-app px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm relative">

        {step === 'biometric' ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-24 h-24 rounded-3xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-6"
            >
              <Fingerprint className="w-12 h-12 text-violet-400" />
            </motion.div>
            <h2 className="text-title text-white mb-2">¿Activar biometría?</h2>
            <p className="text-sm text-gray-400 mb-8">Face ID o huella digital para entrar más rápido</p>
            <button onClick={setupBiometric} className="btn-primary w-full mb-3">Activar Face ID / Huella</button>
            <button onClick={onDone} className="w-full py-4 text-sm text-gray-500">Ahora no</button>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="text-6xl mb-5">🔐</div>
              <h1 className="text-title text-white">
                {step === 'create' ? 'Crea tu PIN' : 'Confirma tu PIN'}
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                {step === 'create' ? '4 dígitos para proteger tu app' : 'Ingresa el PIN de nuevo'}
              </p>
              {error && <p className="text-red-400 text-sm mt-2 font-medium">{error}</p>}
            </div>

            <div className="flex justify-center gap-5 mb-10">
              {[0,1,2,3].map(i => (
                <motion.div
                  key={i}
                  animate={current.length > i ? { scale: [1.3, 1] } : { scale: 1 }}
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: current.length > i ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'rgba(255,255,255,0.15)',
                    boxShadow: current.length > i ? '0 0 12px rgba(139,92,246,0.7)' : 'none',
                  }}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 px-2">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                <motion.button
                  key={i}
                  whileTap={k ? { scale: 0.88 } : {}}
                  onClick={() => k === '⌫' ? (step === 'create' ? setPin(p => p.slice(0,-1)) : setConfirm(c => c.slice(0,-1))) : k ? handleDigit(k) : null}
                  className={`h-16 rounded-2xl text-xl font-medium select-none transition-all ${
                    k === '⌫' ? 'text-gray-400 bg-white/5' : k ? 'text-white bg-white/8 hover:bg-white/12' : ''
                  }`}
                >
                  {k}
                </motion.button>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
