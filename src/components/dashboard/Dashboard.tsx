import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { ArrowUpRight, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { isAfter, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import AnimatedNumber from './AnimatedNumber'
import RingKPI from './RingKPI'

interface Props { onNavigate: (tab: string) => void }

export default function Dashboard({ onNavigate }: Props) {
  const { accounts, binanceRate, payables, receivables, getSalesThisWeek, getWeekCOGS, inventory, expenses, weekCloses } = useAppStore()

  const totalUSD = accounts.filter(a => a.currency === 'USD' || a.currency === 'USDT').reduce((s, a) => s + a.balance, 0)
  const totalBs  = accounts.filter(a => a.currency === 'Bs').reduce((s, a) => s + a.balance, 0)
  const bsInUSD  = binanceRate > 0 ? totalBs / binanceRate : 0
  const grandTotal = totalUSD + bsInUSD

  const salesThisWeek  = getSalesThisWeek()
  const weekRevenue    = salesThisWeek.reduce((s, sale) => s + sale.priceUSD * sale.quantity, 0)
  const weekCOGS       = getWeekCOGS()
  const weekExpenses   = expenses.filter(e => !e.weekCloseId).reduce((s, e) => s + e.amountUSD, 0)
  const weekProfit     = weekRevenue - weekCOGS - weekExpenses   // ganancia neta real
  const weekUnits      = salesThisWeek.reduce((s, sale) => s + sale.quantity, 0)

  const lastClose = weekCloses.find(c => c.status === 'confirmed')
  const profitDelta = lastClose ? ((weekProfit - lastClose.netProfitUSD) / Math.max(lastClose.netProfitUSD, 1)) * 100 : null

  const totalStock   = inventory.reduce((s, i) => s + i.quantity, 0)
  const lowStockCount = inventory.filter(i => i.quantity > 0 && i.quantity <= 5).length
  const stockPct     = Math.min(totalStock / 300, 1)

  const pendingPayables    = payables.filter(p => p.status !== 'paid')
  const pendingReceivables = receivables.filter(r => r.status !== 'paid')
  const today = new Date()
  const overduePayables    = pendingPayables.filter(p => isAfter(today, parseISO(p.dueDate)))
  const overdueReceivables = pendingReceivables.filter(r => isAfter(today, parseISO(r.dueDate)))
  const totalDebt          = pendingPayables.reduce((s, p) => s + p.amountUSD - p.paidAmount, 0)
  const totalToCollect     = pendingReceivables.reduce((s, r) => s + r.amountUSD - r.paidAmount, 0)

  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } }
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="px-4 pt-2 pb-32 space-y-3">

      {/* ── HERO CARD ─────────────────────────── */}
      <motion.div variants={item} className="card-hero rounded-3xl p-6">
        <p className="text-caption text-purple-300/70 mb-3">CAPITAL TOTAL</p>
        <div className="flex items-end gap-3 mb-4">
          <AnimatedNumber
            value={grandTotal}
            prefix="$"
            className="text-display text-white num"
          />
          <div className="flex items-center gap-1 mb-2 px-2 py-1 rounded-full bg-white/8">
            <span className="text-xs text-gray-400">USD</span>
          </div>
        </div>

        {/* Account pills */}
        <div className="flex flex-wrap gap-2">
          {accounts.map(a => (
            <div key={a.id} className="flex items-center gap-1.5 bg-white/6 rounded-xl px-3 py-1.5">
              <span className="text-base">{a.emoji}</span>
              <div>
                <p className="text-[10px] text-gray-500 leading-none">{a.name}</p>
                <p className="text-xs font-semibold text-white leading-none mt-0.5 num">
                  {a.currency === 'Bs'
                    ? `Bs ${a.balance.toLocaleString('es-VE', { maximumFractionDigits: 0 })}`
                    : `$${a.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                </p>
              </div>
            </div>
          ))}
          {binanceRate > 0 && (
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-1.5">
              <span className="text-base">₿</span>
              <div>
                <p className="text-[10px] text-yellow-500/70 leading-none">Tasa Binance</p>
                <p className="text-xs font-semibold text-yellow-400 leading-none mt-0.5 num">Bs {binanceRate.toFixed(0)}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── KPI ROW ───────────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">

        {/* Ventas semana */}
        <div className="glass-purple rounded-3xl p-4 relative overflow-hidden">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-caption text-purple-300/60">VENTAS SEMANA</p>
              <AnimatedNumber value={weekRevenue} prefix="$" className="text-title text-white num mt-1" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{weekUnits} unidades</span>
          </div>
          {profitDelta !== null && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${profitDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(profitDelta).toFixed(0)}% vs semana anterior
            </div>
          )}
        </div>

        {/* Ganancia neta */}
        <div className={`rounded-3xl p-4 relative overflow-hidden ${weekProfit >= 0 ? 'glass-green' : 'glass-red'}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-caption" style={{ color: weekProfit >= 0 ? 'rgba(52,211,153,0.7)' : 'rgba(248,113,113,0.7)' }}>GANANCIA NETA</p>
              <AnimatedNumber
                value={weekProfit}
                prefix="$"
                className={`text-title num mt-1 ${weekProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              />
            </div>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${weekProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <Zap className={`w-4 h-4 ${weekProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
          </div>
          <p className="text-xs text-gray-400">Gastos: <span className="text-red-400">${weekExpenses.toFixed(2)}</span></p>
        </div>
      </motion.div>

      {/* ── RING KPIs ─────────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        <RingKPI
          label="STOCK"
          value={totalStock}
          suffix=" uds"
          pct={stockPct}
          color="#8b5cf6"
          warning={lowStockCount > 0 ? `${lowStockCount} bajo` : undefined}
        />
        <RingKPI
          label="POR COBRAR"
          value={totalToCollect}
          prefix="$"
          pct={totalToCollect > 0 ? Math.min(totalToCollect / 500, 1) : 0}
          color="#10b981"
          warning={overdueReceivables.length > 0 ? `${overdueReceivables.length} vencida` : undefined}
        />
        <RingKPI
          label="POR PAGAR"
          value={totalDebt}
          prefix="$"
          pct={totalDebt > 0 ? Math.min(totalDebt / 500, 1) : 0}
          color="#ef4444"
          warning={overduePayables.length > 0 ? `${overduePayables.length} vencida` : undefined}
        />
      </motion.div>

      {/* ── ALERTS ────────────────────────────── */}
      {(overduePayables.length > 0 || overdueReceivables.length > 0 || lowStockCount > 0) && (
        <motion.div variants={item} className="space-y-2">
          <p className="text-caption text-gray-500 px-1">ALERTAS</p>
          {overduePayables.slice(0,2).map(p => (
            <AlertRow key={p.id} icon="🔴" title={p.supplierName} sub={`Vencida · $${(p.amountUSD - p.paidAmount).toFixed(2)} pendiente`} onClick={() => onNavigate('money')} />
          ))}
          {overdueReceivables.slice(0,2).map(r => (
            <AlertRow key={r.id} icon="🟡" title={`${r.clientName} te debe`} sub={`Vencida · $${(r.amountUSD - r.paidAmount).toFixed(2)}`} onClick={() => onNavigate('money')} />
          ))}
          {lowStockCount > 0 && (
            <AlertRow icon="🟠" title="Stock bajo" sub={`${lowStockCount} sabores con ≤5 unidades`} onClick={() => onNavigate('inventory')} />
          )}
        </motion.div>
      )}

      {/* ── QUICK ACTIONS ─────────────────────── */}
      <motion.div variants={item}>
        <p className="text-caption text-gray-500 px-1 mb-3">ACCIONES RÁPIDAS</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: '💰', label: 'Registrar venta', tab: 'sales', gradient: 'from-violet-600/20 to-purple-900/20', border: 'border-violet-500/20' },
            { emoji: '📦', label: 'Inventario', tab: 'inventory', gradient: 'from-cyan-600/20 to-blue-900/20', border: 'border-cyan-500/20' },
            { emoji: '📊', label: 'Cierre viernes', tab: 'closing', gradient: 'from-emerald-600/20 to-green-900/20', border: 'border-emerald-500/20' },
          ].map(a => (
            <motion.button
              key={a.tab}
              whileTap={{ scale: 0.93 }}
              onClick={() => onNavigate(a.tab)}
              className={`bg-gradient-to-br ${a.gradient} border ${a.border} rounded-2xl p-4 text-center flex flex-col items-center gap-2`}
            >
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-xs font-medium text-gray-300 leading-tight">{a.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── DATE ──────────────────────────────── */}
      <p className="text-center text-xs text-gray-600 pb-2">
        {format(today, "EEEE d 'de' MMMM, yyyy", { locale: es })}
      </p>
    </motion.div>
  )
}

function AlertRow({ icon, title, sub, onClick }: { icon: string; title: string; sub: string; onClick?: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 glass rounded-2xl px-4 py-3 text-left"
    >
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-gray-500 shrink-0" />
    </motion.button>
  )
}
