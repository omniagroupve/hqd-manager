import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATALOG } from '../../data/catalog'
import { useAppStore } from '../../stores/appStore'
import { Plus, Minus, ChevronRight, Edit3, Type } from 'lucide-react'

export default function Inventory() {
  const [expanded, setExpanded]   = useState<string | null>(CATALOG[0].id)
  const [editing, setEditing]     = useState<string | null>(null)
  const [editVal, setEditVal]     = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal]   = useState('')
  const { getStock, setInventory, adjustInventory, setCustomName, getCustomName } = useAppStore()

  const totalUnits = useAppStore(s => s.inventory.reduce((sum, i) => sum + i.quantity, 0))
  const lowCount   = useAppStore(s => s.inventory.filter(i => i.quantity > 0 && i.quantity <= 5).length)

  function saveEdit(productId: string, flavorId: string) {
    const qty = parseInt(editVal)
    if (!isNaN(qty) && qty >= 0) setInventory(productId, flavorId, qty)
    setEditing(null)
  }

  return (
    <div className="px-4 pt-2 pb-32 space-y-3">

      {/* Summary hero */}
      <div className="card-hero rounded-3xl p-5 flex items-center justify-between">
        <div>
          <p className="text-caption text-purple-300/60 mb-1">INVENTARIO TOTAL</p>
          <p className="text-display text-white num">{totalUnits}</p>
          <p className="text-sm text-gray-400 mt-1">unidades en stock</p>
        </div>
        <div className="text-right">
          <div className="text-5xl mb-1">📦</div>
          {lowCount > 0 && (
            <div className="inline-flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-full px-2 py-0.5">
              <span className="text-[10px] font-semibold text-orange-400">⚠ {lowCount} bajo</span>
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      {CATALOG.map(product => {
        const productTotal = product.flavors.reduce((s, f) => s + getStock(f.id), 0)
        const isOpen = expanded === product.id
        const hasLow = product.flavors.some(f => getStock(f.id) <= 5 && getStock(f.id) > 0)

        return (
          <div key={product.id} className="card-surface rounded-3xl overflow-hidden">

            {/* Header */}
            <motion.button
              className="w-full flex items-center justify-between p-4"
              onClick={() => setExpanded(isOpen ? null : product.id)}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: `${product.color}20`, border: `1px solid ${product.color}30` }}>
                  {product.emoji}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    {renamingId === product.id ? (
                      <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        onBlur={() => { setCustomName(product.id, renameVal); setRenamingId(null) }}
                        onKeyDown={e => { if(e.key==='Enter'){setCustomName(product.id, renameVal); setRenamingId(null)}; e.stopPropagation() }}
                        className="text-sm font-semibold bg-white/10 text-white px-2 py-0.5 rounded-lg border border-violet-500/50 outline-none w-32" />
                    ) : (
                      <p className="font-semibold text-white text-sm leading-none">
                        {getCustomName(product.id, product.name)}
                      </p>
                    )}
                    {hasLow && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                    <button onClick={e => { e.stopPropagation(); setRenamingId(product.id); setRenameVal(getCustomName(product.id, product.name)) }}
                      className="opacity-30 hover:opacity-80 transition-opacity">
                      <Type className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">${product.priceUSD} · {product.flavors.length} sabores</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-bold text-white num">{productTotal}</p>
                  <p className="text-[10px] text-gray-500">uds</p>
                </div>
                <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </motion.div>
              </div>
            </motion.button>

            {/* Flavors list */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-1.5">
                    <div className="h-px bg-white/5 mb-3" />
                    {product.flavors.map(flavor => {
                      const stock = getStock(flavor.id)
                      const pct   = Math.min(stock / 50, 1)
                      const isLow = stock <= 5 && stock > 0
                      const isOut = stock === 0
                      const isEditThis   = editing === flavor.id
                      const isRenaming   = renamingId === flavor.id
                      const displayName  = getCustomName(flavor.id, flavor.name)

                      return (
                        <div
                          key={flavor.id}
                          className={`rounded-2xl p-3 transition-colors ${isOut ? 'opacity-40' : ''}`}
                          style={{ background: 'rgba(255,255,255,0.03)' }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{flavor.emoji}</span>
                              {isRenaming ? (
                                <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                                  onBlur={() => { setCustomName(flavor.id, renameVal); setRenamingId(null) }}
                                  onKeyDown={e => e.key==='Enter' && (setCustomName(flavor.id, renameVal), setRenamingId(null))}
                                  className="text-sm font-medium bg-white/10 text-white px-2 py-0.5 rounded-lg border border-violet-500/50 outline-none w-28" />
                              ) : (
                                <button onClick={() => { setRenamingId(flavor.id); setRenameVal(displayName) }}
                                  className="text-sm font-medium text-white text-left flex items-center gap-1 group">
                                  {displayName}
                                  <Type className="w-2.5 h-2.5 text-gray-600 opacity-0 group-hover:opacity-80 transition-opacity" />
                                </button>
                              )}
                              {isLow && <span className="text-[10px] text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-full font-medium">BAJO</span>}
                              {isOut && <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full font-medium">AGOTADO</span>}
                            </div>

                            <div className="flex items-center gap-2">
                              {isEditThis ? (
                                <input
                                  autoFocus type="number" value={editVal}
                                  onChange={e => setEditVal(e.target.value)}
                                  onBlur={() => saveEdit(product.id, flavor.id)}
                                  onKeyDown={e => e.key === 'Enter' && saveEdit(product.id, flavor.id)}
                                  className="w-16 bg-violet-900/40 text-white text-center rounded-xl px-2 py-1 text-sm border border-violet-500/50 outline-none"
                                />
                              ) : (
                                <>
                                  <motion.button whileTap={{ scale: 0.82 }}
                                    onClick={() => adjustInventory(product.id, flavor.id, -1)}
                                    className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <Minus className="w-3 h-3 text-red-400" />
                                  </motion.button>

                                  <button
                                    onClick={() => { setEditing(flavor.id); setEditVal(String(stock)) }}
                                    className="flex items-center gap-1 min-w-[2.5rem] justify-center group"
                                  >
                                    <span className={`text-sm font-bold num ${isLow ? 'text-orange-400' : isOut ? 'text-red-400' : 'text-white'}`}>{stock}</span>
                                    <Edit3 className="w-2.5 h-2.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </button>

                                  <motion.button whileTap={{ scale: 0.82 }}
                                    onClick={() => adjustInventory(product.id, flavor.id, 1)}
                                    className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                    <Plus className="w-3 h-3 text-green-400" />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: `${pct * 100}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{
                                background: isOut ? '#374151' : isLow
                                  ? 'linear-gradient(90deg, #f97316, #ef4444)'
                                  : pct < 0.3
                                  ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                  : `linear-gradient(90deg, ${product.color}, ${product.color}bb)`,
                                boxShadow: !isOut ? `0 0 8px ${product.color}60` : 'none',
                              }}
                            />
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
    </div>
  )
}
