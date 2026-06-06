import { motion } from 'framer-motion'
import { LayoutDashboard, Package, TrendingUp, DollarSign, BarChart3, Users } from 'lucide-react'

const tabs = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Inicio'    },
  { id: 'inventory', icon: Package,         label: 'Stock'     },
  { id: 'sales',     icon: TrendingUp,      label: 'Vender'    },
  { id: 'clients',   icon: Users,           label: 'Clientes'  },
  { id: 'money',     icon: DollarSign,      label: 'Plata'     },
  { id: 'closing',   icon: BarChart3,       label: 'Cierre'    },
]

interface Props { active: string; onChange: (id: string) => void }

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(6,6,14,0.94)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        /* Home indicator safe area */
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
      <div className="flex max-w-lg mx-auto">
        {tabs.map(tab => {
          const Icon     = tab.icon
          const isActive = active === tab.id
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.85 }}
              onClick={() => onChange(tab.id)}
              /* 44pt minimum touch target */
              style={{ minHeight: 56 }}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative select-none">

              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-1 inset-y-1 rounded-2xl"
                  style={{ background: 'rgba(139,92,246,0.18)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}

              {/* Icon */}
              <div className="relative z-10">
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-violet-400' : 'text-gray-600'}`}
                />
                {isActive && (
                  <div className="absolute inset-0 blur-lg bg-violet-500/50 rounded-full scale-150" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-semibold relative z-10 transition-colors duration-200 tracking-wide ${
                  isActive ? 'text-violet-400' : 'text-gray-600'
                }`}>
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
