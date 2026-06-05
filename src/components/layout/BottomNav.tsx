import { motion } from 'framer-motion'
import { LayoutDashboard, Package, TrendingUp, DollarSign, BarChart3 } from 'lucide-react'

const tabs = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { id: 'inventory', icon: Package, label: 'Stock' },
  { id: 'sales', icon: TrendingUp, label: 'Vender' },
  { id: 'money', icon: DollarSign, label: 'Plata' },
  { id: 'closing', icon: BarChart3, label: 'Cierre' },
]

interface Props { active: string; onChange: (id: string) => void }

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur border-t border-white/10 safe-bottom z-50">
      <div className="flex max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-x-2 top-0 h-0.5 bg-purple-400 rounded-full"
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-purple-400' : 'text-gray-500'}`}
              />
              <span className={`text-xs transition-colors ${isActive ? 'text-purple-400 font-medium' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
