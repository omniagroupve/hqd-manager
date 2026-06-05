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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'rgba(8,8,20,0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex max-w-lg mx-auto px-2 py-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.88 }}
              onClick={() => onChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative"
            >
              {/* Active pill background */}
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-1 inset-y-0 rounded-2xl"
                  style={{ background: 'rgba(139,92,246,0.15)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icon with glow */}
              <div className="relative">
                <Icon className={`w-5 h-5 relative z-10 transition-colors duration-200 ${isActive ? 'text-violet-400' : 'text-gray-600'}`} />
                {isActive && (
                  <div className="absolute inset-0 blur-md bg-violet-500/40 rounded-full" />
                )}
              </div>

              <span className={`text-[10px] font-semibold relative z-10 tracking-wide transition-colors duration-200 ${isActive ? 'text-violet-400' : 'text-gray-600'}`}>
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
