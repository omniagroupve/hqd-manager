import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { CATALOG } from '../../data/catalog'
import { Plus, X, Check, BarChart3 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import AnimatedNumber from '../dashboard/AnimatedNumber'

export default function ClosingScreen() {
  const { weekCloses, createWeekClose, confirmWeekClose, getSalesThisWeek, expenses, addExpense: _addExpense, binanceRate } = useAppStore()
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [draftClose, setDraftClose] = useState<string | null>(null)

  const openSales = getSalesThisWeek()
  const openExpenses = expenses.filter((e) => !e.weekCloseId)
  const weekRevenue = openSales.reduce((s, sale) => s + sale.priceUSD * sale.quantity, 0)
  const weekExpTotal = openExpenses.reduce((s, e) => s + e.amountUSD, 0)
  const weekProfit = weekRevenue - weekExpTotal

  function handleCreateClose() {
    const c = createWeekClose()
    setDraftClose(c.id)
  }

  function handleConfirmClose() {
    if (!draftClose) return
    confirmWeekClose(draftClose)
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#a855f7', '#06b6d4', '#10b981', '#f59e0b'] })
    setDraftClose(null)
  }

  const confirmedCloses = weekCloses.filter((c) => c.status === 'confirmed')
  const draft = weekCloses.find((c) => c.id === draftClose)

  return (
    <div className="px-4 py-4 pb-28 space-y-4">
      {/* Current week preview */}
      <div className="card-glow rounded-3xl p-5">
        <p className="text-xs text-purple-300 uppercase tracking-widest mb-3">Semana actual (abierta)</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">Ventas</p>
            <AnimatedNumber value={weekRevenue} prefix="$" className="text-xl font-black text-green-400" />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Gastos</p>
            <AnimatedNumber value={weekExpTotal} prefix="$" className="text-xl font-black text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Ganancia</p>
            <AnimatedNumber value={weekProfit} prefix="$" className={`text-xl font-black ${weekProfit >= 0 ? 'text-white' : 'text-red-400'}`} />
          </div>
        </div>

        {/* Sales breakdown */}
        {openSales.length > 0 && (
          <div className="space-y-1 mb-4">
            {CATALOG.map((product) => {
              const productSales = openSales.filter((s) => s.productId === product.id)
              if (!productSales.length) return null
              const total = productSales.reduce((s, sale) => s + sale.priceUSD * sale.quantity, 0)
              const units = productSales.reduce((s, sale) => s + sale.quantity, 0)
              return (
                <div key={product.id} className="flex items-center gap-2">
                  <span className="text-sm">{product.emoji}</span>
                  <span className="text-xs text-gray-300 flex-1">{product.name}</span>
                  <span className="text-xs text-gray-400">{units} uds</span>
                  <span className="text-xs font-semibold text-white">${total.toFixed(2)}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExpenseModal(true)}
            className="flex-1 py-3 rounded-2xl bg-surface text-sm text-gray-300 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Agregar gasto
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateClose}
            disabled={openSales.length === 0}
            className="flex-1 py-3 rounded-2xl bg-purple-600 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4" /> Cerrar semana
          </motion.button>
        </div>
      </div>

      {/* Expenses list */}
      {openExpenses.length > 0 && (
        <div className="bg-surface rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-3">Gastos de la semana</p>
          <div className="space-y-2">
            {openExpenses.map((e) => (
              <div key={e.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="text-white">{e.description}</p>
                  <p className="text-xs text-gray-500">{e.category}</p>
                </div>
                <span className="text-red-400 font-semibold">${e.amountUSD.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Draft close confirmation */}
      <AnimatePresence>
        {draft && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="bg-purple-900/30 border border-purple-700/40 rounded-3xl p-5"
          >
            <p className="text-purple-300 text-sm font-semibold mb-3">📊 Borrador de cierre</p>
            <div className="space-y-2 mb-4">
              <Row label="Ventas brutas" value={`$${draft.totalSalesUSD.toFixed(2)}`} />
              <Row label="Gastos totales" value={`-$${draft.totalExpensesUSD.toFixed(2)}`} color="text-red-400" />
              <div className="border-t border-white/10 pt-2">
                <Row label="UTILIDAD NETA" value={`$${draft.netProfitUSD.toFixed(2)}`}
                  color={draft.netProfitUSD >= 0 ? 'text-green-400 font-black text-lg' : 'text-red-400 font-black text-lg'} />
              </div>
              {binanceRate > 0 && (
                <Row label="En Bolívares" value={`Bs ${(draft.netProfitUSD * binanceRate).toLocaleString('es-VE', { maximumFractionDigits: 0 })}`} color="text-purple-300" />
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDraftClose(null)} className="flex-1 py-3 rounded-2xl bg-surface text-gray-400 text-sm">
                Cancelar
              </button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirmClose}
                className="flex-1 py-3 rounded-2xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Confirmar cierre
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {confirmedCloses.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Historial de cierres</p>
          <div className="space-y-3">
            {confirmedCloses.map((c) => (
              <div key={c.id} className="bg-surface rounded-2xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Semana del {format(parseISO(c.weekStart), "d MMM", { locale: es })} al {format(parseISO(c.weekEnd), "d MMM yyyy", { locale: es })}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Ventas: ${c.totalSalesUSD.toFixed(2)} · Gastos: ${c.totalExpensesUSD.toFixed(2)}</p>
                  </div>
                  <span className={`text-base font-black ${c.netProfitUSD >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${c.netProfitUSD.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showExpenseModal && <ExpenseModal onClose={() => setShowExpenseModal(false)} />}
      </AnimatePresence>
    </div>
  )
}

function Row({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm ${color}`}>{value}</span>
    </div>
  )
}

function ExpenseModal({ onClose }: { onClose: () => void }) {
  const { addExpense } = useAppStore()
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Insumos')
  const categories = ['Insumos', 'Transporte', 'Servicios', 'Alquiler', 'Personal', 'Otro']

  function save() {
    if (!desc || !amount) return
    addExpense({ description: desc, amountUSD: parseFloat(amount), amountBs: 0, category })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#1a1a2e] rounded-t-3xl p-6 pb-10"
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white">Registrar gasto</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción" className="w-full input" />
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monto USD" className="w-full input" />
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-xl text-sm ${category === c ? 'bg-purple-600 text-white' : 'bg-surface text-gray-400'}`}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={save} className="w-full py-3 bg-purple-600 rounded-2xl text-white font-bold">Guardar gasto</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
