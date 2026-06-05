import { useState } from 'react'
import { motion } from 'framer-motion'
import { setupPin } from '../../lib/auth'

interface Props { onDone: () => void }

export default function SetupPin({ onDone }: Props) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [error, setError] = useState('')

  function handleDigit(d: string) {
    if (step === 'create') {
      const next = pin + d
      setPin(next)
      if (next.length === 4) setStep('confirm')
    } else {
      const next = confirm + d
      setConfirm(next)
      if (next.length === 4) {
        if (next === pin) { setupPin(next); onDone() }
        else { setError('Los PINs no coinciden'); setPin(''); setConfirm(''); setStep('create') }
      }
    }
  }

  const current = step === 'create' ? pin : confirm

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-app px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">💨</div>
          <h1 className="text-3xl font-bold text-white">HQD Manager</h1>
          <p className="text-purple-300 mt-2">
            {step === 'create' ? 'Crea tu PIN de 4 dígitos' : 'Confirma tu PIN'}
          </p>
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: current.length > i ? 1.2 : 1 }}
              className={`w-5 h-5 rounded-full border-2 transition-colors ${
                current.length > i ? 'bg-purple-400 border-purple-400' : 'border-purple-600'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <Keypad onDigit={handleDigit} onDelete={() => {
          if (step === 'create') setPin(p => p.slice(0, -1))
          else setConfirm(c => c.slice(0, -1))
        }} />
      </motion.div>
    </div>
  )
}

function Keypad({ onDigit, onDelete }: { onDigit: (d: string) => void; onDelete: () => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']
  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((k, i) => (
        <motion.button
          key={i}
          whileTap={{ scale: 0.9 }}
          onClick={() => k === '⌫' ? onDelete() : k ? onDigit(k) : null}
          className={`h-16 rounded-2xl text-xl font-semibold transition-colors ${
            k ? 'bg-surface hover:bg-purple-900/50 text-white' : ''
          }`}
        >
          {k}
        </motion.button>
      ))}
    </div>
  )
}
