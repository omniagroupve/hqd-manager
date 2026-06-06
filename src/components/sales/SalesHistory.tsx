import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { CATALOG } from '../../data/catalog'
import { ChevronLeft, Trash2, Edit3, Check, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const PAYMENT_LABELS: Record<string, { emoji: string; label: string }> = {
  cash_usd:  { emoji: '💵', label: 'Efectivo USD' },
  zelle:     { emoji: '💸', label: 'Zelle' },
  usdt:      { emoji: '🔷', label: 'USDT' },
  cash_bs:   { emoji: '💴', label: 'Efectivo Bs' },
  transfer:  { emoji: '🏦', label: 'Transferencia' },
  pending:   { emoji: '⏳', label: 'Por cobrar' },
}

interface Props { onBack: () => void }

export default function SalesHistory({ onBack }: Props) {
  const { getAllSales, deleteSale, updateSale, binanceRate, getCustomName } = useAppStore()
  const [editId, setEditId]   = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [filter, setFilter]   = useState<'all' | 'week' | 'pending'>('week')

  const allSales = getAllSales()

  const filtered = allSales.filter(s => {
    if (filter === 'week')    return !s.weekCloseId
    if (filter === 'pending') return s.paymentMethod === 'pending'
    return true
  }).slice(0, 50)

  function getFlavor(productId: string, flavorId: string) {
    const product = CATALOG.find(p => p.id === productId)
    const flavor  = product?.flavors.find(f => f.id === flavorId)
    return { product, flavor }
  }

  function startEdit(id: string, qty: number, price: number) {
    setEditId(id); setEditQty(String(qty)); setEditPrice(String(price))
  }

  function saveEdit(id: string) {
    const qty   = parseInt(editQty)
    const price = parseFloat(editPrice)
    if (!isNaN(qty) && qty > 0 && !isNaN(price) && price > 0) {
      updateSale(id, { quantity: qty, priceUSD: price, priceBs: binanceRate > 0 ? price * binanceRate : 0 })
    }
    setEditId(null)
  }

  function confirmDelete(id: string) {
    if (confirm('¿Eliminar esta venta? Se restaurará el inventario.')) {
      deleteSale(id)
    }
  }

  const totalPending = allSales.filter(s => s.paymentMethod === 'pending' && !s.weekCloseId)
    .reduce((sum, s) => sum + s.priceUSD * s.quantity, 0)

  return (
    <div className="px-4 pt-2 pb-32">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-2xl glass flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div>
          <h2 className="text-headline text-white">Historial de ventas</h2>
          <p className="text-xs text-gray-500">{allSales.length} ventas en total</p>
        </div>
      </div>

      {/* Pending alert */}
      {totalPending > 0 && (
        <div className="glass-red rounded-2xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⏳</span>
            <div>
              <p className="text-xs font-semibold text-red-300">Ventas por cobrar</p>
              <p className="text-[10px] text-gray-400">Sin cerrar</p>
            </div>
          </div>
          <span className="text-red-400 font-bold num">${totalPending.toFixed(2)}</span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 p-1 rounded-2xl bg-white/5 mb-4">
        {([['week','Esta semana'],['all','Todas'],['pending','Por cobrar']] as const).map(([f,label]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f ? 'bg-violet-600 text-white' : 'text-gray-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Sales list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm">No hay ventas aquí</p>
            </div>
          )}
          {filtered.map(sale => {
            const { product, flavor } = getFlavor(sale.productId, sale.flavorId)
            const pay = PAYMENT_LABELS[sale.paymentMethod] ?? { emoji: '💰', label: sale.paymentMethod }
            const isEdit = editId === sale.id
            const total = sale.priceUSD * sale.quantity

            return (
              <motion.div key={sale.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                className="card-surface rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl">{flavor?.emoji ?? '💨'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">
                        {getCustomName(sale.flavorId, flavor?.name ?? '?')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getCustomName(sale.productId, product?.name ?? '?')} · {pay.emoji} {pay.label}
                      </p>
                      {sale.note && <p className="text-xs text-violet-400 mt-0.5">"{sale.note}"</p>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isEdit ? (
                      <div className="flex items-center gap-1">
                        <input value={editQty} onChange={e => setEditQty(e.target.value)}
                          className="w-10 text-center text-xs bg-white/10 rounded-lg px-1 py-1 text-white border border-violet-500/50 outline-none" />
                        <span className="text-gray-500 text-xs">×</span>
                        <input value={editPrice} onChange={e => setEditPrice(e.target.value)}
                          className="w-14 text-center text-xs bg-white/10 rounded-lg px-1 py-1 text-white border border-violet-500/50 outline-none" />
                        <button onClick={() => saveEdit(sale.id)} className="text-green-400"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditId(null)} className="text-gray-500"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-white num">${total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{sale.quantity} ud{sale.quantity > 1 ? 's' : ''} · ${sale.priceUSD}/u</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/5">
                  <p className="text-[10px] text-gray-600">
                    {format(parseISO(sale.createdAt), "d MMM, HH:mm", { locale: es })}
                    {sale.weekCloseId && <span className="ml-2 text-green-600">✓ cerrada</span>}
                  </p>
                  {!sale.weekCloseId && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(sale.id, sale.quantity, sale.priceUSD)}
                        className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                        <Edit3 className="w-3 h-3 text-gray-400" />
                      </button>
                      <button onClick={() => confirmDelete(sale.id)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
