import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { AlertTriangle, Package, ArrowUpRight } from 'lucide-react'
import { format, isAfter, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import AnimatedNumber from './AnimatedNumber'

interface Props { onNavigate: (tab: string) => void }

export default function Dashboard({ onNavigate }: Props) {
  const { accounts, binanceRate, payables, receivables, getSalesThisWeek, inventory, expenses } = useAppStore()

  const totalUSD = accounts
    .filter((a) => a.currency === 'USD' || a.currency === 'USDT')
    .reduce((s, a) => s + a.balance, 0)
  const totalBs = accounts.filter((a) => a.currency === 'Bs').reduce((s, a) => s + a.balance, 0)
  const bsInUSD = binanceRate > 0 ? totalBs / binanceRate : 0
  const grandTotal = totalUSD + bsInUSD

  const salesThisWeek = getSalesThisWeek()
  const weekRevenue = salesThisWeek.reduce((s, sale) => s + sale.priceUSD * sale.quantity, 0)
  const weekExpenses = expenses.filter((e) => !e.weekCloseId).reduce((s, e) => s + e.amountUSD, 0)
  const weekProfit = weekRevenue - weekExpenses

  const today = new Date()
  const overduePayables = payables.filter(
    (p) => p.status !== 'paid' && isAfter(today, parseISO(p.dueDate))
  )
  const overdueReceivables = receivables.filter(
    (r) => r.status !== 'paid' && isAfter(today, parseISO(r.dueDate))
  )

  const lowStock = inventory.filter((i) => i.quantity > 0 && i.quantity <= 5)

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="px-4 py-4 space-y-4 pb-28">

      {/* Total money card */}
      <motion.div variants={item} className="card-glow p-5 rounded-3xl">
        <p className="text-xs text-purple-300 uppercase tracking-widest mb-1">Total en caja</p>
        <div className="flex items-end gap-2">
          <AnimatedNumber value={grandTotal} prefix="$" className="text-4xl font-black text-white" />
          <span className="text-purple-400 text-sm mb-1">USD total</span>
        </div>
        <div className="flex gap-4 mt-3">
          {accounts.map((a) => (
            <div key={a.id} className="text-xs">
              <span className="mr-1">{a.emoji}</span>
              <span className="text-gray-400">
                {a.currency === 'Bs'
                  ? `Bs ${a.balance.toLocaleString()}`
                  : `$${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* This week */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Ventas semana</p>
          <AnimatedNumber value={weekRevenue} prefix="$" className="text-2xl font-bold text-green-400" />
          <p className="text-xs text-gray-500 mt-1">{salesThisWeek.length} transacciones</p>
        </div>
        <div className={`rounded-2xl p-4 ${weekProfit >= 0 ? 'bg-green-900/20 border border-green-800/30' : 'bg-red-900/20 border border-red-800/30'}`}>
          <p className="text-xs text-gray-400 mb-1">Ganancia neta</p>
          <AnimatedNumber
            value={weekProfit}
            prefix="$"
            className={`text-2xl font-bold ${weekProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}
          />
          <p className="text-xs text-gray-500 mt-1">Gastos: ${weekExpenses.toFixed(2)}</p>
        </div>
      </motion.div>

      {/* Alerts */}
      {(overduePayables.length > 0 || overdueReceivables.length > 0 || lowStock.length > 0) && (
        <motion.div variants={item} className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-widest">⚠️ Alertas</p>
          {overduePayables.map((p) => (
            <motion.div
              key={p.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('money')}
              className="flex items-center gap-3 bg-red-900/20 border border-red-800/30 rounded-2xl p-3"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{p.supplierName}</p>
                <p className="text-xs text-red-300">Vencida • ${p.amountUSD - p.paidAmount} pendiente</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-red-400" />
            </motion.div>
          ))}
          {overdueReceivables.map((r) => (
            <motion.div
              key={r.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('money')}
              className="flex items-center gap-3 bg-yellow-900/20 border border-yellow-800/30 rounded-2xl p-3"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{r.clientName} te debe</p>
                <p className="text-xs text-yellow-300">Vencida • ${r.amountUSD - r.paidAmount} por cobrar</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-yellow-400" />
            </motion.div>
          ))}
          {lowStock.length > 0 && (
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-3 bg-orange-900/20 border border-orange-800/30 rounded-2xl p-3"
            >
              <Package className="w-4 h-4 text-orange-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-white">Stock bajo</p>
                <p className="text-xs text-orange-300">{lowStock.length} sabores con ≤5 unidades</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-orange-400" />
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div variants={item}>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Acciones rápidas</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: '💰', label: 'Registrar venta', tab: 'sales' },
            { emoji: '📦', label: 'Ver inventario', tab: 'inventory' },
            { emoji: '📊', label: 'Hacer cierre', tab: 'closing' },
          ].map((a) => (
            <motion.button
              key={a.tab}
              whileTap={{ scale: 0.92 }}
              onClick={() => onNavigate(a.tab)}
              className="bg-surface rounded-2xl p-4 text-center flex flex-col items-center gap-2"
            >
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-xs text-gray-300 leading-tight">{a.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <p className="text-center text-xs text-gray-600 pb-2">
        {format(today, "EEEE d 'de' MMMM", { locale: es })}
      </p>
    </motion.div>
  )
}
