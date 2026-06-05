import { motion } from 'framer-motion'
import { LogOut, RefreshCw } from 'lucide-react'
import { logout } from '../../lib/auth'
import { useAppStore } from '../../stores/appStore'
import { fetchBinanceRate } from '../../lib/binance'
import { useState } from 'react'

interface Props { onLogout: () => void; title: string }

export default function Header({ onLogout, title }: Props) {
  const { binanceRate, setBinanceRate } = useAppStore()
  const [loading, setLoading] = useState(false)

  async function refreshRate() {
    setLoading(true)
    const rate = await fetchBinanceRate()
    if (rate) setBinanceRate(rate)
    setLoading(false)
  }

  function handleLogout() {
    logout()
    onLogout()
  }

  return (
    <header className="sticky top-0 z-40 bg-app/90 backdrop-blur border-b border-white/5 px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <h1 className="text-lg font-bold text-white">{title}</h1>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={refreshRate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface text-xs text-purple-300"
          >
            <motion.div animate={loading ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 0.8 }}>
              <RefreshCw className="w-3 h-3" />
            </motion.div>
            {binanceRate > 0 ? `Bs ${binanceRate.toFixed(0)}` : 'Tasa'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleLogout}>
            <LogOut className="w-5 h-5 text-gray-500 hover:text-red-400 transition-colors" />
          </motion.button>
        </div>
      </div>
    </header>
  )
}
