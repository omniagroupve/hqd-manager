import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, RefreshCw } from 'lucide-react'
import { logout } from '../../lib/auth'
import { useAppStore } from '../../stores/appStore'
import { fetchBinanceRate } from '../../lib/binance'
import { useState } from 'react'

interface Props { onLogout: () => void; title: string }

export default function Header({ onLogout, title }: Props) {
  const { binanceRate, setBinanceRate } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [justUpdated, setJustUpdated] = useState(false)

  async function refreshRate() {
    setLoading(true)
    const rate = await fetchBinanceRate()
    if (rate) {
      setBinanceRate(rate)
      setJustUpdated(true)
      setTimeout(() => setJustUpdated(false), 2000)
    }
    setLoading(false)
  }

  return (
    <header className="sticky top-0 z-40 px-4 py-3" style={{ background: 'rgba(6,6,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <h1 className="text-headline text-white">{title}</h1>
        <div className="flex items-center gap-2">

          {/* Binance rate chip */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={refreshRate}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              justUpdated
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : binanceRate > 0
                ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                : 'bg-white/5 border border-white/10 text-gray-400'
            }`}
          >
            <motion.div animate={loading ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}>
              <RefreshCw className="w-3 h-3" />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.span
                key={binanceRate}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="num"
              >
                {binanceRate > 0 ? `Bs ${binanceRate.toFixed(0)}` : 'Tasa'}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* Logout */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { logout(); onLogout() }}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>
      </div>
    </header>
  )
}
