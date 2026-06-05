import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { CATALOG } from '../../data/catalog'
import { Plus, X, Check, TrendingUp, TrendingDown } from 'lucide-react'
import confetti from 'canvas-confetti'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import AnimatedNumber from '../dashboard/AnimatedNumber'
import RingKPI from '../dashboard/RingKPI'

export default function ClosingScreen() {
  const { weekCloses, createWeekClose, confirmWeekClose, getSalesThisWeek, expenses, binanceRate } = useAppStore()
  const [showExpense, setShowExpense]   = useState(false)
  const [draftId, setDraftId]           = useState<string | null>(null)

  const openSales    = getSalesThisWeek()
  const openExpenses = expenses.filter(e => !e.weekCloseId)
  const revenue      = openSales.reduce((s, sale) => s + sale.priceUSD * sale.quantity, 0)
  const expTotal     = openExpenses.reduce((s, e) => s + e.amountUSD, 0)
  const profit       = revenue - expTotal
  const units        = openSales.reduce((s, s2) => s + s2.quantity, 0)
  const margin       = revenue > 0 ? (profit / revenue) * 100 : 0

  function handleCreateClose() {
    const c = createWeekClose()
    setDraftId(c.id)
  }

  function handleConfirm() {
    if (!draftId) return
    confirmWeekClose(draftId)
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#a78bfa','#06b6d4','#10b981','#f59e0b','#fb923c'] })
    setDraftId(null)
  }

  const draft     = weekCloses.find(c => c.id === draftId)
  const confirmed = weekCloses.filter(c => c.status === 'confirmed')
  const totalProfit = confirmed.reduce((s, c) => s + c.netProfitUSD, 0)

  return (
    <div className="px-4 pt-2 pb-32 space-y-4">

      {/* Historical total */}
      {confirmed.length > 0 && (
        <div className="card-hero rounded-3xl p-5">
          <p className="text-caption text-purple-300/60 mb-2">GANANCIAS ACUMULADAS</p>
          <AnimatedNumber value={totalProfit} prefix="$" className="text-display text-white num" />
          <p className="text-sm text-gray-400 mt-1">{confirmed.length} cierres confirmados</p>
        </div>
      )}

      {/* Current week */}
      <div className="card-surface rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-caption text-gray-500 mb-1">SEMANA ACTUAL</p>
            <p className="text-xs text-gray-500">{openSales.length} ventas · {units} unidades</p>
          </div>
          <span className="text-2xl">📊</span>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <RingKPI label="VENTAS" value={revenue} prefix="$" pct={Math.min(revenue / 1000, 1)} color="#8b5cf6" />
          <RingKPI label="GASTOS" value={expTotal} prefix="$" pct={Math.min(expTotal / 500, 1)} color="#ef4444" />
          <RingKPI label={profit >= 0 ? 'GANANCIA' : 'PÉRDIDA'} value={Math.abs(profit)} prefix="$"
            pct={Math.min(Math.abs(profit) / 800, 1)} color={profit >= 0 ? '#10b981' : '#ef4444'} />
        </div>

        {/* Margin bar */}
        {revenue > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Margen neto</span>
              <span className={`font-semibold num ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{margin.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${Math.min(Math.abs(margin), 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: margin >= 40 ? 'linear-gradient(90deg,#10b981,#34d399)' : margin >= 20 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)' }}
              />
            </div>
          </div>
        )}

        {/* Product breakdown */}
        {openSales.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {CATALOG.map(product => {
              const ps = openSales.filter(s => s.productId === product.id)
              if (!ps.length) return null
              const ptotal = ps.reduce((s, s2) => s + s2.priceUSD * s2.quantity, 0)
              const punits = ps.reduce((s, s2) => s + s2.quantity, 0)
              const ppct   = revenue > 0 ? ptotal / revenue : 0
              return (
                <div key={product.id} className="flex items-center gap-2">
                  <span className="text-base w-6">{product.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">{product.name}</span>
                      <span className="text-white font-semibold num">${ptotal.toFixed(2)}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${ppct * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: product.color, boxShadow: `0 0 6px ${product.color}80` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{punits} uds</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowExpense(true)}
            className="flex-1 py-3 rounded-2xl glass text-sm font-semibold text-gray-300 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Gasto
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleCreateClose}
            disabled={openSales.length === 0}
            className="flex-1 py-3 rounded-2xl btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-40">
            <Check className="w-4 h-4" /> Cerrar semana
          </motion.button>
        </div>
      </div>

      {/* Expenses list */}
      {openExpenses.length > 0 && (
        <div className="card-surface rounded-2xl p-4">
          <p className="text-caption text-gray-500 mb-3">GASTOS DE LA SEMANA</p>
          <div className="space-y-2">
            {openExpenses.map(e => (
              <div key={e.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-white font-medium">{e.description}</p>
                  <p className="text-xs text-gray-500">{e.category}</p>
                </div>
                <span className="text-red-400 font-bold text-sm num">${e.amountUSD.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Draft confirmation */}
      <AnimatePresence>
        {draft && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="glass-purple rounded-3xl p-5"
          >
            <p className="text-caption text-purple-300/70 mb-4">CONFIRMAR CIERRE</p>
            <div className="space-y-3 mb-5">
              <Row label="Ventas brutas"   value={`$${draft.totalSalesUSD.toFixed(2)}`} color="text-white" />
              <Row label="Gastos"          value={`-$${draft.totalExpensesUSD.toFixed(2)}`} color="text-red-400" />
              <div className="h-px bg-white/10" />
              <Row label="UTILIDAD NETA"   value={`$${draft.netProfitUSD.toFixed(2)}`}
                color={draft.netProfitUSD >= 0 ? 'text-emerald-400 text-xl font-black num' : 'text-red-400 text-xl font-black num'} />
              {binanceRate > 0 && (
                <Row label="En Bolívares" value={`Bs ${(draft.netProfitUSD * binanceRate).toLocaleString('es-VE', { maximumFractionDigits: 0 })}`} color="text-purple-300 num" />
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDraftId(null)} className="flex-1 py-3 rounded-2xl glass text-gray-400 text-sm font-medium">Cancelar</button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleConfirm}
                className="flex-1 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
                <Check className="w-4 h-4" /> ¡Confirmar!
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {confirmed.length > 0 && (
        <div>
          <p className="text-caption text-gray-500 px-1 mb-3">HISTORIAL</p>
          <div className="space-y-2">
            {confirmed.map(c => (
              <div key={c.id} className="card-surface rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {format(parseISO(c.weekStart), "d MMM", { locale: es })} → {format(parseISO(c.weekEnd), "d MMM, yyyy", { locale: es })}
                  </p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-gray-500">Ventas: <span className="text-gray-300 num">${c.totalSalesUSD.toFixed(0)}</span></span>
                    <span className="text-xs text-gray-500">Gastos: <span className="text-red-400 num">${c.totalExpensesUSD.toFixed(0)}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {c.netProfitUSD >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                  <span className={`text-base font-black num ${c.netProfitUSD >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${c.netProfitUSD.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showExpense && <ExpenseModal onClose={() => setShowExpense(false)} />}
      </AnimatePresence>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm ${color}`}>{value}</span>
    </div>
  )
}

function ExpenseModal({ onClose }: { onClose: () => void }) {
  const { addExpense } = useAppStore()
  const [desc, setDesc]       = useState('')
  const [amount, setAmount]   = useState('')
  const [category, setCategory] = useState('Insumos')
  const cats = ['Insumos','Transporte','Servicios','Alquiler','Personal','Otro']

  function save() {
    if (!desc || !amount) return
    addExpense({ description: desc, amountUSD: parseFloat(amount), amountBs: 0, category })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl p-6 pb-10 space-y-4"
        style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-headline text-white">Registrar gasto</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción del gasto" className="w-full input" />
        <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Monto en USD" className="w-full input" />
        <div className="flex flex-wrap gap-2">
          {cats.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${category === c ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400'}`}>
              {c}
            </button>
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={save} className="btn-primary w-full">
          Guardar gasto
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
