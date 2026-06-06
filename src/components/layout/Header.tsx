import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, RefreshCw } from 'lucide-react'
import { logout } from '../../lib/auth'
import { useAppStore } from '../../stores/appStore'
import { fetchBinanceRate } from '../../lib/binance'
import { useState } from 'react'

interface Props { onLogout: () => void; title: string }

export default function Header({ onLogout, title }: Props) {
  const { binanceRate, setBinanceRate } = useAppStore()
  const [loading, setLoading]           = useState(false)
  const [justUpdated, setJustUpdated]   = useState(false)

  async function refreshRate() {
    setLoading(true)
    const rate = await fetchBinanceRate()
    if (rate) {
      setBinanceRate(rate)
      setJustUpdated(true)
      setTimeout(() => setJustUpdated(false), 2500)
    }
    setLoading(false)
  }

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(6,6,15,0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        /* Safe area — under Dynamic Island / notch */
        paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
      }}>
      <div className="flex items-center justify-between px-4 pb-3 max-w-lg mx-auto">
        <h1 className="text-headline text-white">{title}</h1>

        <div className="flex items-center gap-2">
          {/* Binance rate chip */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={refreshRate}
            style={{ minHeight: 36, minWidth: 44 }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
              justUpdated
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : binanceRate > 0
                ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                : 'bg-white/5 border border-white/10 text-gray-400'
            }`}>
            <motion.div
              animate={loading ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}>
              <RefreshCw className="w-3 h-3" />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.span
                key={binanceRate}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="num">
                {binanceRate > 0 ? `Bs ${binanceRate.toFixed(0)}` : 'Tasa'}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* Logout — 44pt minimum */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { logout(); onLogout() }}
            style={{ minHeight: 44, minWidth: 44 }}
            className="rounded-2xl bg-white/5 flex items-center justify-center px-3">
            <LogOut className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>
      </div>
    </header>
  )
}
