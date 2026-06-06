import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATALOG } from '../../data/catalog'
import { useAppStore } from '../../stores/appStore'
import { Plus, Minus, ChevronRight, Edit3, Type, X } from 'lucide-react'
import toast from 'react-hot-toast'

// ── MODAL DE PRECIO ─────────────────────────────────
function PriceModal({
  productId,
  productName,
  currentPrice,
  currentCost,
  onClose,
}: {
  productId: string
  productName: string
  currentPrice: number
  currentCost: number
  onClose: () => void
}) {
  const { setCustomPrice } = useAppStore()
  const [price, setPrice] = useState(currentPrice > 0 ? String(currentPrice) : '')
  const [cost,  setCost]  = useState(currentCost  > 0 ? String(currentCost)  : '')

  const priceNum  = parseFloat(price) || 0
  const costNum   = parseFloat(cost)  || 0
  const margin    = priceNum > 0 && costNum > 0 ? ((priceNum - costNum) / priceNum) * 100 : null
  const ganancia  = priceNum > 0 && costNum > 0 ? priceNum - costNum : null

  function save() {
    if (!priceNum || priceNum <= 0) {
      toast.error('Ingresa un precio de venta válido')
      return
    }
    setCustomPrice(productId, priceNum, costNum > 0 ? costNum : undefined)
    toast.success(`✅ ${productName}: $${priceNum.toFixed(2)} guardado`)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg mx-auto rounded-t-3xl"
        style={{
          background: '#0f0f1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 mb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h3 className="text-headline text-white">Editar precios</h3>
            <p className="text-xs text-gray-500 mt-0.5">{productName}</p>
          </div>
          <button
            onClick={onClose}
            style={{ minHeight: 44, minWidth: 44 }}
            className="rounded-2xl bg-white/8 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="px-6 space-y-4">
          {/* Precio de venta */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">💰 PRECIO DE VENTA</p>
            <div className="flex items-center gap-3 rounded-2xl px-4"
              style={{ background: 'rgba(139,92,246,0.12)', border: '2px solid rgba(139,92,246,0.4)', minHeight: 56 }}>
              <span className="text-violet-400 font-bold text-lg">$</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value)}
                onFocus={e => e.target.select()}
                autoFocus
                style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em' }}
                className="flex-1 bg-transparent text-white outline-none"
              />
              {price && (
                <button onClick={() => setPrice('')}
                  style={{ minHeight: 44, minWidth: 44 }}
                  className="flex items-center justify-center text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Costo de compra */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">📦 COSTO DE COMPRA <span className="text-gray-600 font-normal">(opcional)</span></p>
            <div className="flex items-center gap-3 rounded-2xl px-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', minHeight: 56 }}>
              <span className="text-gray-500 font-bold text-lg">$</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={cost}
                onChange={e => setCost(e.target.value)}
                onFocus={e => e.target.select()}
                style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em' }}
                className="flex-1 bg-transparent text-white outline-none"
              />
              {cost && (
                <button onClick={() => setCost('')}
                  style={{ minHeight: 44, minWidth: 44 }}
                  className="flex items-center justify-center text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Margen preview */}
          {margin !== null && ganancia !== null && (
            <div className="rounded-2xl p-4 flex items-center justify-between"
              style={{
                background: margin >= 30 ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)',
                border: `1px solid ${margin >= 30 ? 'rgba(16,185,129,0.3)' : 'rgba(251,191,36,0.3)'}`,
              }}>
              <div>
                <p className="text-xs text-gray-400">Ganancia por unidad</p>
                <p className={`text-xl font-black num ${margin >= 30 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  ${ganancia.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Margen</p>
                <p className={`text-2xl font-black num ${margin >= 30 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {margin.toFixed(0)}%
                </p>
              </div>
            </div>
          )}

          {/* Save button — grande, imposible de no tocar */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={!priceNum || priceNum <= 0}
            style={{
              minHeight: 56,
              background: priceNum > 0
                ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                : 'rgba(255,255,255,0.08)',
              boxShadow: priceNum > 0 ? '0 4px 20px rgba(124,58,237,0.4)' : 'none',
              marginBottom: 8,
            }}
            className="w-full rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40">
            {priceNum > 0 ? `✓ Guardar — $${priceNum.toFixed(2)}` : 'Ingresa el precio'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── PANTALLA PRINCIPAL ───────────────────────────────
export default function Inventory() {
  const [expanded, setExpanded]         = useState<string | null>(CATALOG[0].id)
  const [editing, setEditing]           = useState<string | null>(null)
  const [editVal, setEditVal]           = useState('')
  const [renamingId, setRenamingId]     = useState<string | null>(null)
  const [renameVal, setRenameVal]       = useState('')
  const [priceModalFor, setPriceModalFor] = useState<string | null>(null)

  const {
    getStock, setInventory, adjustInventory,
    setCustomName, getCustomName,
    getCustomPrice, getCustomCost,
    getInventoryValue,
  } = useAppStore()

  const totalUnits  = useAppStore(s => s.inventory.reduce((sum, i) => sum + i.quantity, 0))
  const lowCount    = useAppStore(s => s.inventory.filter(i => i.quantity > 0 && i.quantity <= 5).length)
  const invValue    = getInventoryValue()
  const binanceRate = useAppStore(s => s.binanceRate)

  function saveEdit(productId: string, flavorId: string) {
    const qty = parseInt(editVal)
    if (!isNaN(qty) && qty >= 0) {
      setInventory(productId, flavorId, qty)
      toast.success(`Stock actualizado: ${qty} uds`)
    }
    setEditing(null)
  }

  const priceModalProduct = priceModalFor ? CATALOG.find(p => p.id === priceModalFor) : null

  return (
    <div className="px-4 pt-2 pb-4 space-y-3">

      {/* Summary hero */}
      <div className="card-hero rounded-3xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-caption text-purple-300/60 mb-1">INVENTARIO TOTAL</p>
            <p className="text-display text-white num">{totalUnits}</p>
            <p className="text-sm text-gray-400 mt-1">unidades en stock</p>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-2">📦</div>
            {lowCount > 0 && (
              <div className="inline-flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-full px-2 py-1">
                <span className="text-[10px] font-semibold text-orange-400">⚠ {lowCount} bajo</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Valor del inventario</p>
            <p className="text-lg font-black text-emerald-400 num mt-0.5">${invValue.toFixed(2)}</p>
          </div>
          {binanceRate > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">En Bolívares</p>
              <p className="text-sm font-bold text-purple-300 num mt-0.5">
                Bs {(invValue * binanceRate).toLocaleString('es-VE', { maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      {CATALOG.map(product => {
        const productTotal  = product.flavors.reduce((s, f) => s + getStock(f.id), 0)
        const currentPrice  = getCustomPrice(product.id)
        const currentCost   = getCustomCost(product.id)
        const margin        = currentCost > 0 ? ((currentPrice - currentCost) / currentPrice) * 100 : null
        const isOpen        = expanded === product.id
        const hasLow        = product.flavors.some(f => getStock(f.id) <= 5 && getStock(f.id) > 0)

        return (
          <div key={product.id} className="card-surface rounded-3xl overflow-hidden">

            {/* ── Product header ── */}
            <div className="flex items-center justify-between p-4">
              {/* Left: emoji + name + price */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: `${product.color}20`, border: `1px solid ${product.color}30` }}>
                  {product.emoji}
                </div>
                <div className="min-w-0">
                  {/* Name + rename */}
                  <div className="flex items-center gap-2">
                    {renamingId === product.id ? (
                      <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                        onBlur={() => { setCustomName(product.id, renameVal); setRenamingId(null) }}
                        onKeyDown={e => e.key === 'Enter' && (setCustomName(product.id, renameVal), setRenamingId(null))}
                        className="text-sm font-semibold bg-white/10 text-white px-2 py-1 rounded-lg border border-violet-500/50 outline-none w-32" />
                    ) : (
                      <p className="font-semibold text-white text-sm leading-none truncate">
                        {getCustomName(product.id, product.name)}
                      </p>
                    )}
                    {hasLow && <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />}
                    <button
                      onClick={() => { setRenamingId(product.id); setRenameVal(getCustomName(product.id, product.name)) }}
                      style={{ minHeight: 32, minWidth: 32 }}
                      className="flex items-center justify-center opacity-30">
                      <Type className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>

                  {/* Price button — grande para iPhone */}
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setPriceModalFor(product.id)}
                    style={{
                      background: 'rgba(139,92,246,0.12)',
                      border: '1px solid rgba(139,92,246,0.25)',
                      minHeight: 36,
                    }}
                    className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 rounded-xl transition-colors active:bg-white/10">
                    <span className="text-violet-400 text-xs font-bold">$</span>
                    <span className="text-white text-sm font-bold num">{currentPrice}</span>
                    {margin !== null && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-semibold ${
                        margin >= 30 ? 'text-emerald-400 bg-emerald-500/15' : 'text-yellow-400 bg-yellow-500/15'
                      }`}>{margin.toFixed(0)}% margen</span>
                    )}
                    <Edit3 className="w-3 h-3 text-gray-500" />
                  </motion.button>
                </div>
              </div>

              {/* Right: stock + expand */}
              <motion.button
                className="flex items-center gap-2 pl-2"
                onClick={() => setExpanded(isOpen ? null : product.id)}
                style={{ minHeight: 48, minWidth: 56 }}
                whileTap={{ scale: 0.93 }}>
                <div className="text-right">
                  <p className="text-sm font-bold text-white num">{productTotal}</p>
                  <p className="text-[10px] text-gray-500">uds</p>
                  <p className="text-[10px] text-emerald-400 num">${(productTotal * currentPrice).toFixed(0)}</p>
                </div>
                <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </motion.div>
              </motion.button>
            </div>

            {/* ── Flavors list ── */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' as const }}
                  className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-2">
                    <div className="h-px bg-white/5 mb-3" />
                    {product.flavors.map(flavor => {
                      const stock      = getStock(flavor.id)
                      const pct        = Math.min(stock / 50, 1)
                      const isLow      = stock <= 5 && stock > 0
                      const isOut      = stock === 0
                      const isEditThis = editing === flavor.id
                      const isRenaming = renamingId === flavor.id
                      const displayName = getCustomName(flavor.id, flavor.name)

                      return (
                        <div key={flavor.id}
                          className={`rounded-2xl p-3 ${isOut ? 'opacity-40' : ''}`}
                          style={{ background: 'rgba(255,255,255,0.03)' }}>

                          {/* Row 1: name + controls */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-lg shrink-0">{flavor.emoji}</span>
                              {isRenaming ? (
                                <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                                  onBlur={() => { setCustomName(flavor.id, renameVal); setRenamingId(null) }}
                                  onKeyDown={e => e.key === 'Enter' && (setCustomName(flavor.id, renameVal), setRenamingId(null))}
                                  className="text-sm font-medium bg-white/10 text-white px-2 py-1 rounded-lg border border-violet-500/50 outline-none w-28" />
                              ) : (
                                <button onClick={() => { setRenamingId(flavor.id); setRenameVal(displayName) }}
                                  style={{ minHeight: 36 }}
                                  className="text-sm font-medium text-white text-left flex items-center gap-1 group flex-1 min-w-0">
                                  <span className="truncate">{displayName}</span>
                                  <Type className="w-2.5 h-2.5 text-gray-600 opacity-0 group-hover:opacity-80 shrink-0 transition-opacity" />
                                </button>
                              )}
                              {isLow && (
                                <span className="text-[10px] text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full font-semibold shrink-0">
                                  BAJO
                                </span>
                              )}
                              {isOut && (
                                <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-1 rounded-full font-semibold shrink-0">
                                  AGOTADO
                                </span>
                              )}
                            </div>

                            {/* Stock controls — 44pt targets */}
                            <div className="flex items-center gap-1 shrink-0">
                              {isEditThis ? (
                                <div className="flex items-center gap-1">
                                  <input autoFocus type="number" value={editVal}
                                    onChange={e => setEditVal(e.target.value)}
                                    onBlur={() => saveEdit(product.id, flavor.id)}
                                    onKeyDown={e => e.key === 'Enter' && saveEdit(product.id, flavor.id)}
                                    style={{ width: 60 }}
                                    className="bg-violet-900/40 text-white text-center rounded-xl px-2 py-2 text-sm border border-violet-500/50 outline-none" />
                                </div>
                              ) : (
                                <>
                                  <motion.button
                                    whileTap={{ scale: 0.80 }}
                                    onClick={() => adjustInventory(product.id, flavor.id, -1)}
                                    style={{ minHeight: 40, minWidth: 40 }}
                                    className="rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <Minus className="w-4 h-4 text-red-400" />
                                  </motion.button>

                                  <button
                                    onClick={() => { setEditing(flavor.id); setEditVal(String(stock)) }}
                                    style={{ minHeight: 40, minWidth: 44 }}
                                    className="flex items-center justify-center group">
                                    <span className={`text-sm font-bold num ${isLow ? 'text-orange-400' : isOut ? 'text-red-400' : 'text-white'}`}>
                                      {stock}
                                    </span>
                                    <Edit3 className="w-2.5 h-2.5 text-gray-600 opacity-0 group-hover:opacity-100 ml-0.5" />
                                  </button>

                                  <motion.button
                                    whileTap={{ scale: 0.80 }}
                                    onClick={() => adjustInventory(product.id, flavor.id, 1)}
                                    style={{ minHeight: 40, minWidth: 40 }}
                                    className="rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-green-400" />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Progress bar + value */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                animate={{ width: `${pct * 100}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' as const }}
                                className="h-full rounded-full"
                                style={{
                                  background: isOut ? '#374151'
                                    : isLow ? 'linear-gradient(90deg,#f97316,#ef4444)'
                                    : `linear-gradient(90deg,${product.color},${product.color}bb)`,
                                  boxShadow: !isOut ? `0 0 8px ${product.color}60` : 'none',
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-600 num shrink-0">
                              ${(stock * currentPrice).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {/* Price modal */}
      <AnimatePresence>
        {priceModalProduct && (
          <PriceModal
            key={priceModalProduct.id}
            productId={priceModalProduct.id}
            productName={getCustomName(priceModalProduct.id, priceModalProduct.name)}
            currentPrice={getCustomPrice(priceModalProduct.id)}
            currentCost={getCustomCost(priceModalProduct.id)}
            onClose={() => setPriceModalFor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
