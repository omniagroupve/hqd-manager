import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATALOG } from '../../data/catalog'
import { useAppStore } from '../../stores/appStore'
import { Plus, Minus, ChevronDown, Edit3 } from 'lucide-react'

export default function Inventory() {
  const [expanded, setExpanded] = useState<string | null>(CATALOG[0].id)
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const { getStock, setInventory, adjustInventory } = useAppStore()

  function saveEdit(productId: string, flavorId: string) {
    const qty = parseInt(editVal)
    if (!isNaN(qty) && qty >= 0) setInventory(productId, flavorId, qty)
    setEditing(null)
  }

  const totalUnits = useAppStore((s) => s.inventory.reduce((sum, i) => sum + i.quantity, 0))

  return (
    <div className="px-4 py-4 pb-28 space-y-3">
      {/* Summary */}
      <div className="card-glow rounded-3xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-purple-300 uppercase tracking-widest">Total en stock</p>
          <p className="text-3xl font-black text-white">{totalUnits} <span className="text-lg font-normal text-gray-400">unidades</span></p>
        </div>
        <span className="text-5xl">📦</span>
      </div>

      {/* Products */}
      {CATALOG.map((product) => {
        const productTotal = product.flavors.reduce((s, f) => s + getStock(f.id), 0)
        const isOpen = expanded === product.id

        return (
          <div key={product.id} className="bg-surface rounded-3xl overflow-hidden">
            {/* Header */}
            <motion.button
              className="w-full flex items-center justify-between p-4"
              onClick={() => setExpanded(isOpen ? null : product.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{product.emoji}</span>
                <div className="text-left">
                  <p className="font-semibold text-white text-sm">{product.name}</p>
                  <p className="text-xs text-gray-400">${product.priceUSD} · {productTotal} uds total</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${productTotal > 20 ? 'bg-green-400' : productTotal > 5 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </div>
            </motion.button>

            {/* Flavors */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    {product.flavors.map((flavor) => {
                      const stock = getStock(flavor.id)
                      const maxBar = 50
                      const pct = Math.min(stock / maxBar, 1)
                      const isEditingThis = editing === flavor.id

                      return (
                        <div key={flavor.id} className="bg-black/20 rounded-2xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{flavor.emoji}</span>
                              <span className="text-sm text-white">{flavor.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isEditingThis ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    autoFocus
                                    type="number"
                                    value={editVal}
                                    onChange={(e) => setEditVal(e.target.value)}
                                    onBlur={() => saveEdit(product.id, flavor.id)}
                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(product.id, flavor.id)}
                                    className="w-16 bg-purple-900/50 text-white text-center rounded-lg px-2 py-1 text-sm border border-purple-500"
                                  />
                                </div>
                              ) : (
                                <>
                                  <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => adjustInventory(product.id, flavor.id, -1)}
                                    className="w-7 h-7 rounded-full bg-red-900/40 flex items-center justify-center"
                                  >
                                    <Minus className="w-3 h-3 text-red-400" />
                                  </motion.button>
                                  <button
                                    onClick={() => { setEditing(flavor.id); setEditVal(String(stock)) }}
                                    className="flex items-center gap-1 min-w-[3rem] text-center"
                                  >
                                    <span className={`text-sm font-bold ${stock <= 5 ? 'text-red-400' : stock <= 15 ? 'text-yellow-400' : 'text-white'}`}>
                                      {stock}
                                    </span>
                                    <Edit3 className="w-3 h-3 text-gray-600" />
                                  </button>
                                  <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => adjustInventory(product.id, flavor.id, 1)}
                                    className="w-7 h-7 rounded-full bg-green-900/40 flex items-center justify-center"
                                  >
                                    <Plus className="w-3 h-3 text-green-400" />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </div>
                          {/* Stock bar */}
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: `${pct * 100}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              className={`h-full rounded-full ${pct > 0.4 ? 'bg-green-400' : pct > 0.15 ? 'bg-yellow-400' : 'bg-red-400'}`}
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
