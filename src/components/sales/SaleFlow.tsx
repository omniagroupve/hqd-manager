import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATALOG, type Product, type Flavor } from '../../data/catalog'
import { useAppStore } from '../../stores/appStore'
import { Check, ChevronLeft } from 'lucide-react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'

type Step = 'product' | 'flavor' | 'qty' | 'success'

export default function SaleFlow() {
  const [step, setStep] = useState<Step>('product')
  const [product, setProduct] = useState<Product | null>(null)
  const [flavor, setFlavor] = useState<Flavor | null>(null)
  const [qty, setQty] = useState(1)
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>('retail')
  const [customPrice, setCustomPrice] = useState<string>('')

  const { addSale, binanceRate, getStock } = useAppStore()

  const price = customPrice ? parseFloat(customPrice) : product?.priceUSD ?? 0
  const total = price * qty
  const totalBs = binanceRate > 0 ? total * binanceRate : 0

  function reset() {
    setStep('product'); setProduct(null); setFlavor(null)
    setQty(1); setCustomPrice(''); setSaleType('retail')
  }

  function confirmSale() {
    if (!product || !flavor) return
    addSale({
      productId: product.id,
      flavorId: flavor.id,
      quantity: qty,
      priceUSD: price,
      priceBs: totalBs,
      rateBinance: binanceRate,
      saleType,
    })
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ['#a855f7', '#06b6d4', '#10b981'] })
    toast.success(`¡Venta registrada! $${total.toFixed(2)}`, { icon: '🎉' })
    setStep('success')
    setTimeout(reset, 2200)
  }

  const slide = {
    initial: { x: 60, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
    transition: { duration: 0.22 },
  }

  return (
    <div className="px-4 py-4 pb-28">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {(['product', 'flavor', 'qty'] as const).map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
            step === 'success' || ['product', 'flavor', 'qty'].indexOf(step) >= i
              ? 'bg-purple-500' : 'bg-white/10'
          }`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'product' && (
          <motion.div key="product" {...slide}>
            <h2 className="text-xl font-bold text-white mb-1">¿Qué vendiste?</h2>
            <p className="text-gray-400 text-sm mb-5">Selecciona el modelo</p>
            <div className="grid grid-cols-2 gap-3">
              {CATALOG.map((p) => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => { setProduct(p); setStep('flavor') }}
                  className="bg-surface rounded-2xl p-4 text-left"
                  style={{ borderLeft: `3px solid ${p.color}` }}
                >
                  <span className="text-2xl block mb-2">{p.emoji}</span>
                  <p className="text-sm font-semibold text-white leading-tight">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-1">${p.priceUSD}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'flavor' && product && (
          <motion.div key="flavor" {...slide}>
            <button onClick={() => setStep('product')} className="flex items-center gap-1 text-purple-400 text-sm mb-4">
              <ChevronLeft className="w-4 h-4" /> {product.name}
            </button>
            <h2 className="text-xl font-bold text-white mb-1">¿Cuál sabor?</h2>
            <p className="text-gray-400 text-sm mb-5">Toca el sabor vendido</p>
            <div className="grid grid-cols-2 gap-2">
              {product.flavors.map((f) => {
                const stock = getStock(f.id)
                return (
                  <motion.button
                    key={f.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => { setFlavor(f); setStep('qty') }}
                    className={`bg-surface rounded-2xl p-3 text-left relative ${stock === 0 ? 'opacity-40' : ''}`}
                  >
                    <span className="text-xl block mb-1">{f.emoji}</span>
                    <p className="text-sm text-white">{f.name}</p>
                    <span className={`text-xs mt-1 block ${stock <= 5 ? 'text-red-400' : 'text-gray-400'}`}>
                      Stock: {stock}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 'qty' && product && flavor && (
          <motion.div key="qty" {...slide}>
            <button onClick={() => setStep('flavor')} className="flex items-center gap-1 text-purple-400 text-sm mb-4">
              <ChevronLeft className="w-4 h-4" /> {flavor.name}
            </button>
            <h2 className="text-xl font-bold text-white mb-5">Detalles de la venta</h2>

            {/* Sale type */}
            <div className="flex gap-2 mb-5">
              {([['retail', '🛒', 'Detal'], ['wholesale', '📦', 'Mayor']] as const).map(([t, icon, label]) => (
                <button
                  key={t}
                  onClick={() => setSaleType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all ${
                    saleType === t ? 'bg-purple-600 text-white' : 'bg-surface text-gray-400'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Quantity */}
            <div className="bg-surface rounded-3xl p-5 mb-4">
              <p className="text-xs text-gray-400 mb-3">Cantidad</p>
              <div className="flex items-center gap-4 justify-center">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-12 h-12 rounded-full bg-red-900/30 text-red-400 text-2xl font-bold flex items-center justify-center"
                >−</motion.button>
                <span className="text-5xl font-black text-white w-16 text-center">{qty}</span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setQty((q) => q + 1)}
                  className="w-12 h-12 rounded-full bg-green-900/30 text-green-400 text-2xl font-bold flex items-center justify-center"
                >+</motion.button>
              </div>
            </div>

            {/* Price */}
            <div className="bg-surface rounded-2xl p-4 mb-5">
              <p className="text-xs text-gray-400 mb-2">Precio por unidad (USD)</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  placeholder={String(product.priceUSD)}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="flex-1 bg-transparent text-white text-xl font-bold outline-none"
                />
              </div>
            </div>

            {/* Total preview */}
            <div className="card-glow rounded-2xl p-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total USD</span>
                <span className="text-2xl font-black text-white">${total.toFixed(2)}</span>
              </div>
              {binanceRate > 0 && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-500 text-sm">Total Bs</span>
                  <span className="text-purple-300 font-semibold">Bs {totalBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}</span>
                </div>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={confirmSale}
              className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Confirmar venta
            </motion.button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.4 }}
              className="text-7xl mb-4"
            >🎉</motion.div>
            <h2 className="text-2xl font-black text-white">¡Vendido!</h2>
            <p className="text-green-400 text-xl font-bold mt-2">${total.toFixed(2)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
