import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATALOG, type Product, type Flavor } from '../../data/catalog'
import { useAppStore } from '../../stores/appStore'
import { Check, ChevronLeft, Minus, Plus } from 'lucide-react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'

type Step = 'product' | 'flavor' | 'qty' | 'success'

export default function SaleFlow() {
  const [step, setStep]           = useState<Step>('product')
  const [product, setProduct]     = useState<Product | null>(null)
  const [flavor, setFlavor]       = useState<Flavor | null>(null)
  const [qty, setQty]             = useState(1)
  const [saleType, setSaleType]   = useState<'retail' | 'wholesale'>('retail')
  const [customPrice, setCustomPrice] = useState('')

  const { addSale, binanceRate, getStock } = useAppStore()

  const price = customPrice ? parseFloat(customPrice) : product?.priceUSD ?? 0
  const total  = price * qty
  const totalBs = binanceRate > 0 ? total * binanceRate : 0

  function reset() {
    setStep('product'); setProduct(null); setFlavor(null)
    setQty(1); setCustomPrice(''); setSaleType('retail')
  }

  function confirmSale() {
    if (!product || !flavor) return
    addSale({ productId: product.id, flavorId: flavor.id, quantity: qty, priceUSD: price, priceBs: totalBs, rateBinance: binanceRate, saleType })
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#a78bfa','#06b6d4','#10b981','#f59e0b'] })
    toast.success(`¡Venta confirmada! $${total.toFixed(2)}`, {
      icon: '🎉',
      style: { background: '#1a0533', color: '#fff', border: '1px solid rgba(139,92,246,0.4)', fontFamily: 'Inter' },
    })
    setStep('success')
    setTimeout(reset, 2500)
  }

  const slide = {
    initial:    { x: 50, opacity: 0 },
    animate:    { x: 0, opacity: 1 },
    exit:       { x: -50, opacity: 0 },
    transition: { duration: 0.25, ease: 'easeOut' as const },
  }

  const steps: Step[] = ['product','flavor','qty']
  const stepIdx = steps.indexOf(step as any)

  return (
    <div className="px-4 pt-2 pb-32">
      {/* Progress bar */}
      {step !== 'success' && (
        <div className="flex gap-1.5 mb-6">
          {steps.map((s, i) => (
            <motion.div
              key={s}
              animate={{ opacity: i <= stepIdx ? 1 : 0.2 }}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= stepIdx ? 'linear-gradient(90deg,#7c3aed,#a78bfa)' : 'rgba(255,255,255,0.1)' }}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* STEP 1: Product */}
        {step === 'product' && (
          <motion.div key="product" {...slide}>
            <h2 className="text-title text-white mb-1">¿Qué vendiste?</h2>
            <p className="text-sm text-gray-500 mb-5">Selecciona el modelo</p>
            <div className="grid grid-cols-2 gap-3">
              {CATALOG.map(p => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => { setProduct(p); setStep('flavor') }}
                  className="card-surface rounded-2xl p-4 text-left relative overflow-hidden group"
                >
                  <div className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(135deg, ${p.color}20, transparent)` }} />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl mb-3"
                    style={{ background: `${p.color}15`, border: `1px solid ${p.color}25` }}>
                    {p.emoji}
                  </div>
                  <p className="text-sm font-semibold text-white leading-tight">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-1 num">${p.priceUSD}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Flavor */}
        {step === 'flavor' && product && (
          <motion.div key="flavor" {...slide}>
            <button onClick={() => setStep('product')} className="flex items-center gap-1.5 text-violet-400 text-sm font-medium mb-4">
              <ChevronLeft className="w-4 h-4" /> {product.name}
            </button>
            <h2 className="text-title text-white mb-1">¿Qué sabor?</h2>
            <p className="text-sm text-gray-500 mb-5">Toca el sabor vendido</p>
            <div className="grid grid-cols-2 gap-2">
              {product.flavors.map(f => {
                const stock = getStock(f.id)
                return (
                  <motion.button
                    key={f.id}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => { setFlavor(f); setStep('qty') }}
                    className={`card-surface rounded-2xl p-3.5 text-left transition-opacity ${stock === 0 ? 'opacity-35' : ''}`}
                  >
                    <span className="text-xl block mb-1.5">{f.emoji}</span>
                    <p className="text-sm font-medium text-white leading-tight">{f.name}</p>
                    <p className={`text-xs mt-1 num ${stock === 0 ? 'text-red-400' : stock <= 5 ? 'text-orange-400' : 'text-gray-500'}`}>
                      {stock === 0 ? 'Agotado' : `${stock} en stock`}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* STEP 3: Qty + price */}
        {step === 'qty' && product && flavor && (
          <motion.div key="qty" {...slide}>
            <button onClick={() => setStep('flavor')} className="flex items-center gap-1.5 text-violet-400 text-sm font-medium mb-4">
              <ChevronLeft className="w-4 h-4" /> {flavor.name}
            </button>
            <h2 className="text-title text-white mb-5">Detalles</h2>

            {/* Sale type toggle */}
            <div className="flex gap-2 mb-5 p-1 rounded-2xl bg-white/5">
              {([['retail','🛒','Detal'],['wholesale','📦','Mayor']] as const).map(([t,icon,label]) => (
                <button key={t} onClick={() => setSaleType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    saleType === t ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50' : 'text-gray-400'
                  }`}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Quantity picker */}
            <div className="card-surface rounded-3xl p-5 mb-3">
              <p className="text-caption text-gray-500 mb-4">CANTIDAD</p>
              <div className="flex items-center justify-between">
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Minus className="w-5 h-5 text-red-400" />
                </motion.button>

                <div className="text-center">
                  <motion.span
                    key={qty}
                    initial={{ scale: 1.3, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-display text-white num"
                  >{qty}</motion.span>
                  <p className="text-xs text-gray-500 mt-1">unidades</p>
                </div>

                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => setQty(q => q + 1)}
                  className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-green-400" />
                </motion.button>
              </div>
            </div>

            {/* Price override */}
            <div className="card-surface rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
              <span className="text-gray-500 text-sm font-medium">Precio/u</span>
              <span className="text-gray-400">$</span>
              <input
                type="number" inputMode="decimal"
                placeholder={String(product.priceUSD)}
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                className="flex-1 bg-transparent text-white font-bold text-lg outline-none num"
              />
              {customPrice && (
                <button onClick={() => setCustomPrice('')} className="text-gray-600 text-xs">Reset</button>
              )}
            </div>

            {/* Total preview */}
            <div className="card-hero rounded-2xl p-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300 font-medium">{qty} × ${price.toFixed(2)}</span>
                <span className="text-2xl font-black text-white num">${total.toFixed(2)}</span>
              </div>
              {binanceRate > 0 && (
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-xs text-gray-500">Equivale en Bs</span>
                  <span className="text-sm font-bold text-purple-300 num">Bs {totalBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}</span>
                </div>
              )}
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={confirmSale} className="btn-primary w-full flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Confirmar venta — ${total.toFixed(2)}
            </motion.button>
          </motion.div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <motion.div key="success"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <motion.div
              animate={{ scale: [1, 1.25, 1], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.6 }}
              className="text-8xl mb-6"
            >🎉</motion.div>
            <h2 className="text-title text-white mb-2">¡Vendido!</h2>
            <p className="text-3xl font-black text-green-400 num">${total.toFixed(2)}</p>
            {binanceRate > 0 && (
              <p className="text-purple-300 text-lg font-semibold mt-1 num">Bs {totalBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
