import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATALOG, type Product, type Flavor } from '../../data/catalog'
import { useAppStore } from '../../stores/appStore'
import type { PaymentMethod } from '../../types'
import { Check, ChevronLeft, Minus, Plus, History } from 'lucide-react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import SalesHistory from './SalesHistory'

type Step = 'product' | 'flavor' | 'qty' | 'payment' | 'success'

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; emoji: string; currency: string }[] = [
  { id: 'cash_usd',  label: 'Efectivo USD', emoji: '💵', currency: 'USD' },
  { id: 'zelle',     label: 'Zelle',        emoji: '💸', currency: 'USD' },
  { id: 'usdt',      label: 'USDT',         emoji: '🔷', currency: 'USDT' },
  { id: 'cash_bs',   label: 'Efectivo Bs',  emoji: '💴', currency: 'Bs' },
  { id: 'transfer',  label: 'Transferencia',emoji: '🏦', currency: 'Bs' },
  { id: 'pending',   label: 'Por cobrar',   emoji: '⏳', currency: '' },
]

export default function SaleFlow() {
  const [step, setStep]             = useState<Step>('product')
  const [product, setProduct]       = useState<Product | null>(null)
  const [flavor, setFlavor]         = useState<Flavor | null>(null)
  const [qty, setQty]               = useState(1)
  const [saleType, setSaleType]     = useState<'retail' | 'wholesale'>('retail')
  const [customPrice, setCustomPrice] = useState('')
  const [payMethod, setPayMethod]   = useState<PaymentMethod>('cash_usd')
  const [accountId, setAccountId]   = useState<string>('')
  const [note, setNote]             = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const { addSale, binanceRate, getStock, accounts, getCustomName } = useAppStore()

  const price   = customPrice ? parseFloat(customPrice) : product?.priceUSD ?? 0
  const priceBs = binanceRate > 0 ? price * binanceRate : 0
  const total   = price * qty
  const totalBs = priceBs * qty

  const payOption = PAYMENT_OPTIONS.find(p => p.id === payMethod)
  const matchingAccounts = accounts.filter(a => {
    if (payMethod === 'cash_usd') return a.currency === 'USD' && a.type === 'cash'
    if (payMethod === 'zelle')    return a.currency === 'USD' && a.type === 'bank'
    if (payMethod === 'usdt')     return a.currency === 'USDT'
    if (payMethod === 'cash_bs')  return a.currency === 'Bs' && a.type === 'cash'
    if (payMethod === 'transfer') return a.currency === 'Bs'
    return false
  })

  function reset() {
    setStep('product'); setProduct(null); setFlavor(null)
    setQty(1); setCustomPrice(''); setSaleType('retail')
    setPayMethod('cash_usd'); setAccountId(''); setNote('')
  }

  function confirmSale() {
    if (!product || !flavor) return
    const selectedAccount = accountId || matchingAccounts[0]?.id
    addSale({
      productId: product.id, flavorId: flavor.id, quantity: qty,
      priceUSD: price, priceBs: priceBs, rateBinance: binanceRate,
      saleType, paymentMethod: payMethod,
      accountId: payMethod !== 'pending' ? selectedAccount : undefined,
      note: note || undefined,
    })
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#a78bfa','#06b6d4','#10b981','#f59e0b'] })
    toast.success(`¡Venta confirmada! $${total.toFixed(2)}`, {
      icon: '🎉',
      style: { background: '#1a0533', color: '#fff', border: '1px solid rgba(139,92,246,0.4)', fontFamily: 'Inter' },
    })
    setStep('success')
    setTimeout(reset, 2500)
  }

  const slide = {
    initial: { x: 40, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit:    { x: -40, opacity: 0 },
    transition: { duration: 0.22, ease: 'easeOut' as const },
  }

  const steps: Step[] = ['product','flavor','qty','payment']
  const stepIdx = steps.indexOf(step as any)

  if (showHistory) return <SalesHistory onBack={() => setShowHistory(false)} />

  return (
    <div className="px-4 pt-2 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {step !== 'success' && (
          <div className="flex gap-1.5 flex-1 mr-3">
            {steps.map((s, i) => (
              <div key={s} className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ background: i <= stepIdx ? 'linear-gradient(90deg,#7c3aed,#a78bfa)' : 'rgba(255,255,255,0.08)' }} />
            ))}
          </div>
        )}
        <button onClick={() => setShowHistory(true)}
          className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl">
          <History className="w-3.5 h-3.5" /> Historial
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* STEP 1: Product */}
        {step === 'product' && (
          <motion.div key="product" {...slide}>
            <h2 className="text-title text-white mb-1">¿Qué vendiste?</h2>
            <p className="text-sm text-gray-500 mb-5">Selecciona el modelo</p>
            <div className="grid grid-cols-2 gap-3">
              {CATALOG.map(p => {
                const customName = getCustomName(p.id, p.name)
                return (
                  <motion.button key={p.id} whileTap={{ scale: 0.93 }}
                    onClick={() => { setProduct(p); setStep('flavor') }}
                    className="card-surface rounded-2xl p-4 text-left relative overflow-hidden">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl mb-3"
                      style={{ background: `${p.color}15`, border: `1px solid ${p.color}25` }}>
                      {p.emoji}
                    </div>
                    <p className="text-sm font-semibold text-white leading-tight">{customName}</p>
                    <p className="text-xs text-gray-500 mt-1 num">${p.priceUSD}</p>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Flavor */}
        {step === 'flavor' && product && (
          <motion.div key="flavor" {...slide}>
            <button onClick={() => setStep('product')} className="flex items-center gap-1.5 text-violet-400 text-sm font-medium mb-4">
              <ChevronLeft className="w-4 h-4" /> {getCustomName(product.id, product.name)}
            </button>
            <h2 className="text-title text-white mb-5">¿Qué sabor?</h2>
            <div className="grid grid-cols-2 gap-2">
              {product.flavors.map(f => {
                const stock = getStock(f.id)
                const customName = getCustomName(f.id, f.name)
                return (
                  <motion.button key={f.id} whileTap={{ scale: 0.93 }}
                    onClick={() => { setFlavor(f); setStep('qty') }}
                    className={`card-surface rounded-2xl p-3.5 text-left ${stock === 0 ? 'opacity-35' : ''}`}>
                    <span className="text-xl block mb-1.5">{f.emoji}</span>
                    <p className="text-sm font-medium text-white leading-tight">{customName}</p>
                    <p className={`text-xs mt-1 num ${stock === 0 ? 'text-red-400' : stock <= 5 ? 'text-orange-400' : 'text-gray-500'}`}>
                      {stock === 0 ? 'Agotado' : `${stock} en stock`}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* STEP 3: Quantity + price */}
        {step === 'qty' && product && flavor && (
          <motion.div key="qty" {...slide}>
            <button onClick={() => setStep('flavor')} className="flex items-center gap-1.5 text-violet-400 text-sm font-medium mb-4">
              <ChevronLeft className="w-4 h-4" /> {getCustomName(flavor.id, flavor.name)}
            </button>
            <h2 className="text-title text-white mb-4">Cantidad y precio</h2>

            {/* Wholesale/Retail toggle */}
            <div className="flex gap-2 mb-4 p-1 rounded-2xl bg-white/5">
              {([['retail','🛒','Detal'],['wholesale','📦','Al Mayor']] as const).map(([t,icon,label]) => (
                <button key={t} onClick={() => setSaleType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    saleType === t ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50' : 'text-gray-400'
                  }`}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Qty picker */}
            <div className="card-surface rounded-3xl p-5 mb-3">
              <div className="flex items-center justify-between">
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQty(q => Math.max(1,q-1))}
                  className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Minus className="w-5 h-5 text-red-400" />
                </motion.button>
                <motion.span key={qty} initial={{ scale: 1.3, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-display text-white num">{qty}
                </motion.span>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQty(q => q+1)}
                  className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-green-400" />
                </motion.button>
              </div>
            </div>

            {/* Price override */}
            <div className="card-surface rounded-2xl px-4 py-3 mb-3 flex items-center gap-2">
              <span className="text-gray-500 text-sm">Precio/u</span>
              <span className="text-gray-400 text-sm">$</span>
              <input type="number" inputMode="decimal" placeholder={String(product.priceUSD)}
                value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                className="flex-1 bg-transparent text-white font-bold text-lg outline-none num" />
              {customPrice && <button onClick={() => setCustomPrice('')} className="text-xs text-gray-600">↩</button>}
            </div>

            {/* Note */}
            <input placeholder="Nota opcional..." value={note} onChange={e => setNote(e.target.value)}
              className="w-full input mb-4 text-sm" />

            {/* Total preview */}
            <div className="card-hero rounded-2xl p-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">{qty} × ${price.toFixed(2)}</span>
                <span className="text-2xl font-black text-white num">${total.toFixed(2)}</span>
              </div>
              {binanceRate > 0 && (
                <p className="text-right text-sm text-purple-300 mt-1 num">
                  Bs {totalBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                </p>
              )}
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('payment')}
              className="btn-primary w-full flex items-center justify-center gap-2">
              Continuar →
            </motion.button>
          </motion.div>
        )}

        {/* STEP 4: Payment method */}
        {step === 'payment' && product && flavor && (
          <motion.div key="payment" {...slide}>
            <button onClick={() => setStep('qty')} className="flex items-center gap-1.5 text-violet-400 text-sm font-medium mb-4">
              <ChevronLeft className="w-4 h-4" /> ${total.toFixed(2)}
            </button>
            <h2 className="text-title text-white mb-1">¿Cómo pagó?</h2>
            <p className="text-sm text-gray-500 mb-5">Selecciona el método de pago</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {PAYMENT_OPTIONS.map(opt => (
                <motion.button key={opt.id} whileTap={{ scale: 0.92 }}
                  onClick={() => { setPayMethod(opt.id); setAccountId('') }}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all ${
                    payMethod === opt.id
                      ? 'bg-violet-600/30 border border-violet-500/50'
                      : 'card-surface'
                  }`}>
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-xs font-medium text-center leading-tight text-white">{opt.label}</span>
                  {opt.currency && <span className="text-[10px] text-gray-500">{opt.currency}</span>}
                </motion.button>
              ))}
            </div>

            {/* Account selector */}
            {payMethod !== 'pending' && matchingAccounts.length > 1 && (
              <div className="mb-4">
                <p className="text-caption text-gray-500 mb-2">ACREDITAR A</p>
                <div className="flex flex-wrap gap-2">
                  {matchingAccounts.map(a => (
                    <button key={a.id} onClick={() => setAccountId(a.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                        (accountId || matchingAccounts[0]?.id) === a.id
                          ? 'bg-violet-600/30 border border-violet-500/50 text-white'
                          : 'glass text-gray-400'
                      }`}>
                      <span>{a.emoji}</span> {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {payMethod === 'pending' && (
              <div className="glass-red rounded-2xl p-3 mb-4 flex items-center gap-2">
                <span>⚠️</span>
                <p className="text-xs text-red-300">Esta venta se registrará como deuda pendiente por cobrar</p>
              </div>
            )}

            {/* Summary */}
            <div className="card-hero rounded-2xl p-4 mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">{qty}x {getCustomName(flavor.id, flavor.name)}</span>
                <span className="font-black text-white text-xl num">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{payOption?.emoji} {payOption?.label}</span>
                {binanceRate > 0 && payMethod !== 'cash_usd' && payMethod !== 'zelle' && payMethod !== 'usdt' && (
                  <span className="text-purple-300 num">Bs {totalBs.toLocaleString('es-VE',{maximumFractionDigits:0})}</span>
                )}
              </div>
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={confirmSale}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Confirmar — ${total.toFixed(2)}
            </motion.button>
          </motion.div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <motion.div key="success"
            initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex flex-col items-center justify-center py-24">
            <motion.div animate={{ scale:[1,1.25,1], rotate:[0,-5,5,0] }} transition={{ duration:0.6 }}
              className="text-8xl mb-6">🎉</motion.div>
            <h2 className="text-title text-white mb-2">¡Vendido!</h2>
            <p className="text-3xl font-black text-green-400 num">${total.toFixed(2)}</p>
            {binanceRate > 0 && payMethod !== 'cash_usd' && payMethod !== 'zelle' && (
              <p className="text-purple-300 text-lg font-semibold mt-1 num">
                Bs {totalBs.toLocaleString('es-VE',{maximumFractionDigits:0})}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-3">{payOption?.emoji} {payOption?.label}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
