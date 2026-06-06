import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { Plus, ArrowLeftRight, Trash2, X, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { isAfter, differenceInDays, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import AnimatedNumber from '../dashboard/AnimatedNumber'

type Tab = 'accounts' | 'payables' | 'receivables'

// ── REUSABLE BOTTOM SHEET ─────────────────────────
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg mx-auto rounded-t-3xl flex flex-col"
        style={{
          background: '#0f0f1e',
          border: '1px solid rgba(255,255,255,0.09)',
          borderBottom: 'none',
          maxHeight: '92vh',
        }}>
        {/* Fixed header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 shrink-0">
          <h3 className="text-headline text-white">{title}</h3>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center active:scale-95">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-10 space-y-3 flex-1">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── MAIN SCREEN ───────────────────────────────────
export default function MoneyScreen() {
  const [tab, setTab]                               = useState<Tab>('accounts')
  const [showAddAccount, setShowAddAccount]         = useState(false)
  const [showTransfer, setShowTransfer]             = useState(false)
  const [showAddPayable, setShowAddPayable]         = useState(false)
  const [showAddReceivable, setShowAddReceivable]   = useState(false)

  const { accounts, payables, receivables, binanceRate } = useAppStore()

  const totalUSD   = accounts.filter(a => a.currency === 'USD' || a.currency === 'USDT').reduce((s, a) => s + a.balance, 0)
  const totalBs    = accounts.filter(a => a.currency === 'Bs').reduce((s, a) => s + a.balance, 0)
  const grandTotal = totalUSD + (binanceRate > 0 ? totalBs / binanceRate : 0)

  const today              = new Date()
  const pendingPay         = payables.filter(p => p.status !== 'paid')
  const pendingRec         = receivables.filter(r => r.status !== 'paid')
  const overduePayables    = pendingPay.filter(p => isAfter(today, parseISO(p.dueDate)))
  const dueSoonPayables    = pendingPay.filter(p => {
    const d = differenceInDays(parseISO(p.dueDate), today)
    return d >= 0 && d <= (p.reminderDays ?? 3)
  })

  return (
    <div className="px-4 pt-2 pb-32 space-y-4 relative">

      {/* ── HERO ─────────────────────────────── */}
      <div className="card-hero rounded-3xl p-5">
        <p className="text-caption text-purple-300/60 mb-1">CAPITAL TOTAL</p>
        <AnimatedNumber value={grandTotal} prefix="$" className="text-display text-white num" />
        <div className="flex flex-wrap gap-2 mt-3">
          {accounts.map(a => (
            <div key={a.id} className="flex items-center gap-1.5 bg-white/6 rounded-xl px-2.5 py-1.5">
              <span>{a.emoji}</span>
              <div>
                <p className="text-[10px] text-gray-500 leading-none">{a.name}</p>
                <p className="text-xs font-semibold text-white num leading-none mt-0.5">
                  {a.currency === 'Bs'
                    ? `Bs ${a.balance.toLocaleString('es-VE', { maximumFractionDigits: 0 })}`
                    : `$${a.balance.toFixed(2)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── REMINDERS ───────────────────────── */}
      {(overduePayables.length > 0 || dueSoonPayables.length > 0) && (
        <div className="space-y-2">
          <p className="text-caption text-gray-500">⏰ RECORDATORIOS</p>
          {overduePayables.map(p => (
            <div key={p.id} className="glass-red rounded-2xl p-3 flex items-center gap-2">
              <span>🔴</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-300">{p.supplierName}</p>
                <p className="text-xs text-gray-400">Vencida hace {Math.abs(differenceInDays(today, parseISO(p.dueDate)))} días</p>
              </div>
              <span className="text-red-400 font-bold text-sm num">${(p.amountUSD - p.paidAmount).toFixed(0)}</span>
            </div>
          ))}
          {dueSoonPayables.filter(p => !overduePayables.find(o => o.id === p.id)).map(p => (
            <div key={p.id} className="glass rounded-2xl p-3 flex items-center gap-2"
              style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.06)' }}>
              <span>🟡</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-300">{p.supplierName}</p>
                <p className="text-xs text-gray-400">Vence en {differenceInDays(parseISO(p.dueDate), today)} días</p>
              </div>
              <span className="text-yellow-400 font-bold text-sm num">${(p.amountUSD - p.paidAmount).toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── TABS ─────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5">
        {([['accounts', '💳 Cuentas'], ['payables', '📤 Por pagar'], ['receivables', '📥 Por cobrar']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${tab === t ? 'bg-violet-600 text-white' : 'text-gray-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── CUENTAS TAB ──────────────────────── */}
      {tab === 'accounts' && (
        <div className="space-y-3">
          {/* Action buttons — siempre visibles */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddAccount(true)}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
              <Plus className="w-4 h-4" />
              Nueva cuenta
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTransfer(true)}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-violet-300 glass-purple">
              <ArrowLeftRight className="w-4 h-4" />
              Transferir
            </motion.button>
          </div>

          {accounts.length === 0 && (
            <div className="text-center py-10 card-surface rounded-2xl">
              <p className="text-4xl mb-3">🏦</p>
              <p className="text-sm text-gray-400 font-medium">No tienes cuentas aún</p>
              <button onClick={() => setShowAddAccount(true)}
                className="mt-3 text-violet-400 text-sm font-semibold">
                + Crear primera cuenta
              </button>
            </div>
          )}

          {accounts.map(a => <AccountCard key={a.id} account={a} />)}
        </div>
      )}

      {/* ── POR PAGAR TAB ────────────────────── */}
      {tab === 'payables' && (
        <div className="space-y-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddPayable(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
            <Plus className="w-4 h-4" /> Agregar deuda
          </motion.button>
          {pendingPay.length === 0 && payables.filter(p => p.status === 'paid').length === 0 && (
            <div className="text-center py-10">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-sm text-gray-500">Sin deudas pendientes</p>
            </div>
          )}
          {[...pendingPay, ...payables.filter(p => p.status === 'paid').slice(0, 5)].map(p => (
            <PayableCard key={p.id} payable={p} />
          ))}
        </div>
      )}

      {/* ── POR COBRAR TAB ───────────────────── */}
      {tab === 'receivables' && (
        <div className="space-y-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddReceivable(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 4px 20px rgba(5,150,105,0.3)' }}>
            <Plus className="w-4 h-4" /> Agregar cobro
          </motion.button>
          {pendingRec.length === 0 && receivables.filter(r => r.status === 'paid').length === 0 && (
            <div className="text-center py-10">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm text-gray-500">Sin cobros pendientes</p>
            </div>
          )}
          {[...pendingRec, ...receivables.filter(r => r.status === 'paid').slice(0, 5)].map(r => (
            <ReceivableCard key={r.id} receivable={r} />
          ))}
        </div>
      )}

      {/* ── MODALS ───────────────────────────── */}
      <AnimatePresence>
        {showAddAccount   && <AddAccountModal   onClose={() => setShowAddAccount(false)} />}
        {showTransfer     && <TransferModal     onClose={() => setShowTransfer(false)} />}
        {showAddPayable   && <AddPayableModal   onClose={() => setShowAddPayable(false)} />}
        {showAddReceivable && <AddReceivableModal onClose={() => setShowAddReceivable(false)} />}
      </AnimatePresence>
    </div>
  )
}

// ── ACCOUNT CARD ──────────────────────────────────
function AccountCard({ account: a }: { account: any }) {
  const { updateAccount, deleteAccount, creditAccount, debitAccount, getAccountTransactions } = useAppStore()
  const [editing, setEditing]       = useState(false)
  const [name, setName]             = useState(a.name)
  const [adjAmount, setAdjAmount]   = useState('')
  const [showAdj, setShowAdj]       = useState(false)
  const [showTx, setShowTx]         = useState(false)

  const transactions = getAccountTransactions(a.id)
  const todayStr     = new Date().toISOString().slice(0, 10)
  const todayIn      = transactions.filter(t => t.type === 'credit' && t.createdAt.startsWith(todayStr)).reduce((s, t) => s + t.amount, 0)
  const todayOut     = transactions.filter(t => t.type === 'debit'  && t.createdAt.startsWith(todayStr)).reduce((s, t) => s + t.amount, 0)

  const fmt = (v: number) => a.currency === 'Bs'
    ? `Bs ${v.toLocaleString('es-VE', { maximumFractionDigits: 0 })}`
    : `$${v.toFixed(2)}`

  return (
    <div className="card-surface rounded-2xl overflow-hidden">
      <div className="p-4">
        {/* Row 1: name + balance */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl shrink-0">{a.emoji}</span>
            {editing ? (
              <input value={name} onChange={e => setName(e.target.value)} autoFocus
                onBlur={() => { updateAccount(a.id, { name }); setEditing(false) }}
                onKeyDown={e => e.key === 'Enter' && (updateAccount(a.id, { name }), setEditing(false))}
                className="flex-1 bg-white/10 text-white text-sm font-semibold px-2 py-1 rounded-lg border border-violet-500/50 outline-none" />
            ) : (
              <button onClick={() => setEditing(true)} className="text-sm font-semibold text-white text-left truncate">{a.name}</button>
            )}
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-base font-black text-white num">{fmt(a.balance)}</p>
            <p className="text-[10px] text-gray-500">{a.currency} · {a.type}</p>
          </div>
        </div>

        {/* Today summary */}
        {(todayIn > 0 || todayOut > 0) && (
          <div className="flex gap-2 mb-3">
            {todayIn > 0 && (
              <span className="flex items-center gap-1 bg-emerald-500/10 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-emerald-400">
                <TrendingUp className="w-3 h-3" /> +{fmt(todayIn)} hoy
              </span>
            )}
            {todayOut > 0 && (
              <span className="flex items-center gap-1 bg-red-500/10 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-red-400">
                <TrendingDown className="w-3 h-3" /> -{fmt(todayOut)} hoy
              </span>
            )}
          </div>
        )}

        {/* Actions row */}
        <div className="flex gap-2">
          <button onClick={() => { setShowAdj(!showAdj); setShowTx(false) }}
            className={`flex-1 text-xs rounded-xl py-2 flex items-center justify-center gap-1 transition-all ${showAdj ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30' : 'bg-white/5 text-gray-400'}`}>
            Ajustar <ChevronDown className={`w-3 h-3 transition-transform ${showAdj ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={() => { setShowTx(!showTx); setShowAdj(false) }}
            className={`flex-1 text-xs rounded-xl py-2 flex items-center justify-center gap-1 transition-all ${showTx ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30' : 'bg-white/5 text-gray-400'}`}>
            Movim. <span className="opacity-50">({transactions.length})</span>
          </button>
          <button onClick={() => { if (confirm(`¿Eliminar ${a.name}?`)) deleteAccount(a.id) }}
            className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Adjust panel */}
      <AnimatePresence>
        {showAdj && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 border-t border-white/5 flex gap-2">
              <input type="number" inputMode="decimal" placeholder="Monto" value={adjAmount}
                onChange={e => setAdjAmount(e.target.value)}
                className="flex-1 bg-white/5 text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none" />
              <button onClick={() => {
                const v = parseFloat(adjAmount); if (!isNaN(v) && v > 0) {
                  creditAccount(a.id, v, 'Ajuste manual +', 'manual')
                  setAdjAmount(''); toast.success(`✅ +${fmt(v)} en ${a.name}`)
                }
              }} className="px-4 bg-violet-600 text-white text-sm font-bold rounded-xl">+</button>
              <button onClick={() => {
                const v = parseFloat(adjAmount); if (!isNaN(v) && v > 0) {
                  debitAccount(a.id, v, 'Ajuste manual −', 'manual')
                  setAdjAmount(''); toast.success(`✅ -${fmt(v)} de ${a.name}`)
                }
              }} className="px-4 bg-red-600/70 text-white text-sm font-bold rounded-xl">−</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions panel */}
      <AnimatePresence>
        {showTx && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-white/5 px-4 py-3" style={{ maxHeight: 280, overflowY: 'auto' }}>
              <p className="text-caption text-gray-600 mb-2">ÚLTIMOS MOVIMIENTOS</p>
              {transactions.length === 0
                ? <p className="text-xs text-gray-600 text-center py-4">Sin movimientos aún</p>
                : transactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-2 py-2 border-b border-white/4 last:border-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      {tx.type === 'credit'
                        ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                        : <TrendingDown className="w-3 h-3 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate">{tx.description}</p>
                      <p className="text-[10px] text-gray-600">{format(parseISO(tx.createdAt), 'd MMM, HH:mm', { locale: es })}</p>
                    </div>
                    <span className={`text-xs font-bold num shrink-0 ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'credit' ? '+' : '−'}{fmt(tx.amount)}
                    </span>
                  </div>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── PAYABLE CARD ──────────────────────────────────
function PayableCard({ payable: p }: { payable: any }) {
  const { payPayable, deletePayable, accounts } = useAppStore()
  const [showPay, setShowPay]   = useState(false)
  const [amount, setAmount]     = useState('')
  const [acctId, setAcctId]     = useState(accounts[0]?.id ?? '')
  const pending  = p.amountUSD - p.paidAmount
  const pct      = p.amountUSD > 0 ? p.paidAmount / p.amountUSD : 0
  const daysLeft = differenceInDays(parseISO(p.dueDate), new Date())

  return (
    <div className={`card-surface rounded-2xl p-4 ${p.status === 'paid' ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-sm font-semibold text-white">{p.supplierName}</p>
          <p className="text-xs text-gray-500">{p.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold num ${p.status === 'paid' ? 'text-green-400' : daysLeft < 0 ? 'text-red-400' : 'text-white'}`}>
            ${pending.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-500">de ${p.amountUSD.toFixed(2)}</p>
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct * 100}%`, background: p.status === 'paid' ? '#10b981' : 'linear-gradient(90deg,#7c3aed,#a78bfa)' }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={daysLeft < 0 && p.status !== 'paid' ? 'text-red-400' : 'text-gray-500'}>
          {p.status === 'paid' ? '✅ Pagada' : daysLeft < 0 ? `⚠ Vencida hace ${Math.abs(daysLeft)}d` : `Vence en ${daysLeft}d`}
        </span>
        <div className="flex gap-1.5">
          {p.status !== 'paid' && (
            <button onClick={() => setShowPay(!showPay)}
              className="px-3 py-1 bg-violet-600/30 border border-violet-500/30 rounded-lg text-violet-300 font-medium">
              Pagar
            </button>
          )}
          <button onClick={() => { if (confirm('¿Eliminar?')) deletePayable(p.id) }}
            className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center">
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showPay && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-3 space-y-2">
              <input type="number" inputMode="decimal" placeholder={`Máx $${pending.toFixed(2)}`}
                value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full bg-white/5 text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none" />
              <div className="flex flex-wrap gap-1.5">
                {accounts.map((a: any) => (
                  <button key={a.id} onClick={() => setAcctId(a.id)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl transition-all ${acctId === a.id ? 'bg-violet-600 text-white' : 'glass text-gray-400'}`}>
                    {a.emoji} {a.name}
                  </button>
                ))}
              </div>
              <button onClick={() => {
                const v = parseFloat(amount); if (isNaN(v) || v <= 0) return
                payPayable(p.id, Math.min(v, pending), acctId || undefined)
                setShowPay(false); setAmount(''); toast.success('✅ Pago registrado')
              }} className="w-full py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl">
                Confirmar pago
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── RECEIVABLE CARD ───────────────────────────────
function ReceivableCard({ receivable: r }: { receivable: any }) {
  const { collectReceivable, deleteReceivable, accounts } = useAppStore()
  const [showCollect, setShowCollect] = useState(false)
  const [amount, setAmount]           = useState('')
  const [acctId, setAcctId]           = useState(accounts[0]?.id ?? '')
  const pending  = r.amountUSD - r.paidAmount
  const pct      = r.amountUSD > 0 ? r.paidAmount / r.amountUSD : 0
  const daysLeft = differenceInDays(parseISO(r.dueDate), new Date())

  return (
    <div className={`card-surface rounded-2xl p-4 ${r.status === 'paid' ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-sm font-semibold text-white">{r.clientName}</p>
          <p className="text-xs text-gray-500">{r.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold num ${r.status === 'paid' ? 'text-green-400' : daysLeft < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            ${pending.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-500">de ${r.amountUSD.toFixed(2)}</p>
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct * 100}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={daysLeft < 0 && r.status !== 'paid' ? 'text-red-400' : 'text-gray-500'}>
          {r.status === 'paid' ? '✅ Cobrado' : daysLeft < 0 ? `⚠ Vencida hace ${Math.abs(daysLeft)}d` : `Vence en ${daysLeft}d`}
        </span>
        <div className="flex gap-1.5">
          {r.status !== 'paid' && (
            <button onClick={() => setShowCollect(!showCollect)}
              className="px-3 py-1 bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-emerald-300 font-medium">
              Cobrar
            </button>
          )}
          <button onClick={() => { if (confirm('¿Eliminar?')) deleteReceivable(r.id) }}
            className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center">
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showCollect && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-3 space-y-2">
              <input type="number" inputMode="decimal" placeholder="Monto a cobrar"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full bg-white/5 text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none" />
              <div className="flex flex-wrap gap-1.5">
                {accounts.map((a: any) => (
                  <button key={a.id} onClick={() => setAcctId(a.id)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl transition-all ${acctId === a.id ? 'bg-emerald-600 text-white' : 'glass text-gray-400'}`}>
                    {a.emoji} {a.name}
                  </button>
                ))}
              </div>
              <button onClick={() => {
                const v = parseFloat(amount); if (isNaN(v) || v <= 0) return
                collectReceivable(r.id, Math.min(v, pending), acctId || undefined)
                setShowCollect(false); setAmount(''); toast.success('💰 Cobro registrado')
              }} className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl">
                Confirmar cobro
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── ADD ACCOUNT MODAL ─────────────────────────────
function AddAccountModal({ onClose }: { onClose: () => void }) {
  const { addAccount } = useAppStore()
  const [name, setName]         = useState('')
  const [emoji, setEmoji]       = useState('💰')
  const [currency, setCurrency] = useState<'USD' | 'Bs' | 'USDT'>('USD')
  const [type, setType]         = useState<'cash' | 'bank' | 'crypto'>('cash')
  const [balance, setBalance]   = useState('')
  const [saving, setSaving]     = useState(false)

  const EMOJIS   = ['💵', '💴', '💸', '🏦', '🔷', '💳', '📱', '🏧', '💰', '💎']
  const PRESETS  = [
    { name: 'Efectivo USD', emoji: '💵', currency: 'USD'  as const, type: 'cash'   as const },
    { name: 'Efectivo Bs',  emoji: '💴', currency: 'Bs'   as const, type: 'cash'   as const },
    { name: 'Zelle',        emoji: '💸', currency: 'USD'  as const, type: 'bank'   as const },
    { name: 'Binance USDT', emoji: '🔷', currency: 'USDT' as const, type: 'crypto' as const },
    { name: 'Banco',        emoji: '🏦', currency: 'USD'  as const, type: 'bank'   as const },
    { name: 'Pago Móvil',   emoji: '📱', currency: 'Bs'   as const, type: 'bank'   as const },
  ]

  function save() {
    if (!name.trim() || saving) return
    setSaving(true)
    addAccount({ name: name.trim(), emoji, currency, type, balance: parseFloat(balance) || 0 })
    toast.success(`✅ Cuenta "${name.trim()}" creada`)
    setTimeout(onClose, 300)
  }

  return (
    <Sheet title="Nueva cuenta" onClose={onClose}>
      {/* Presets */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Acceso rápido</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.name}
              onClick={() => { setName(p.name); setEmoji(p.emoji); setCurrency(p.currency); setType(p.type) }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${name === p.name ? 'bg-violet-600 text-white' : 'glass text-gray-400'}`}>
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji */}
      <div className="flex gap-2 flex-wrap">
        {EMOJIS.map(e => (
          <button key={e} onClick={() => setEmoji(e)}
            className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${emoji === e ? 'bg-violet-600/40 border border-violet-500/40' : 'bg-white/5'}`}>
            {e}
          </button>
        ))}
      </div>

      {/* Name */}
      <input placeholder="Nombre de la cuenta *" value={name}
        onChange={e => setName(e.target.value)} className="w-full input" autoFocus />

      {/* Currency */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Moneda</p>
        <div className="grid grid-cols-3 gap-2">
          {(['USD', 'Bs', 'USDT'] as const).map(c => (
            <button key={c} onClick={() => setCurrency(c)}
              className={`py-3 rounded-xl text-sm font-bold transition-all ${currency === c ? 'bg-violet-600 text-white' : 'glass text-gray-400'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Tipo</p>
        <div className="grid grid-cols-3 gap-2">
          {([['cash', '💵 Efectivo'], ['bank', '🏦 Banco'], ['crypto', '🔷 Cripto']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setType(t)}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${type === t ? 'bg-violet-600 text-white' : 'glass text-gray-400'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Balance */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Saldo inicial (opcional)</p>
        <div className="flex items-center gap-2 input">
          <span className="text-gray-500 shrink-0">{currency === 'Bs' ? 'Bs' : '$'}</span>
          <input type="number" inputMode="decimal" placeholder="0.00" value={balance}
            onChange={e => setBalance(e.target.value)}
            className="flex-1 bg-transparent text-white font-bold outline-none" />
        </div>
      </div>

      {/* Preview */}
      {name.trim() && (
        <div className="glass-purple rounded-2xl p-3 flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <p className="font-bold text-white">{name}</p>
            <p className="text-xs text-gray-400">
              {currency} · {type === 'cash' ? 'Efectivo' : type === 'bank' ? 'Banco' : 'Cripto'}
              {balance ? ` · ${currency === 'Bs' ? 'Bs' : '$'}${parseFloat(balance).toFixed(2)}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* SAVE BUTTON - siempre al final, nunca cortado */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={save}
        disabled={!name.trim() || saving}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
          !name.trim() ? 'bg-white/10 text-gray-500 cursor-not-allowed'
          : saving ? 'bg-emerald-600 text-white'
          : 'text-white'
        }`}
        style={name.trim() && !saving ? {
          background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
          boxShadow: '0 4px 20px rgba(124,58,237,0.4)'
        } : {}}>
        {saving ? '✅ Guardado' : '✓ Crear cuenta'}
      </motion.button>
    </Sheet>
  )
}

// ── TRANSFER MODAL ────────────────────────────────
function TransferModal({ onClose }: { onClose: () => void }) {
  const { accounts, transferBetweenAccounts } = useAppStore()
  const [fromId, setFromId]         = useState(accounts[0]?.id ?? '')
  const [toId, setToId]             = useState(accounts[1]?.id ?? '')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount]     = useState('')
  const [note, setNote]             = useState('')

  const fromAcct = accounts.find(a => a.id === fromId)
  const toAcct   = accounts.find(a => a.id === toId)

  function doTransfer() {
    const from = parseFloat(fromAmount)
    const to   = parseFloat(toAmount) || from
    if (isNaN(from) || from <= 0 || !fromId || !toId || fromId === toId) return
    transferBetweenAccounts({ fromAccountId: fromId, toAccountId: toId, fromAmount: from, toAmount: to, note: note || undefined })
    toast.success(`✅ ${fromAcct?.emoji} → ${toAcct?.emoji} transferido`)
    onClose()
  }

  return (
    <Sheet title="Transferir entre cuentas" onClose={onClose}>
      <div>
        <p className="text-xs text-gray-500 mb-2">DE</p>
        <div className="flex flex-wrap gap-2">
          {accounts.map(a => (
            <button key={a.id} onClick={() => setFromId(a.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all ${fromId === a.id ? 'bg-red-500/30 border border-red-500/40 text-white' : 'glass text-gray-400'}`}>
              {a.emoji} {a.name}
              <span className="opacity-50 num">{a.currency === 'Bs' ? `Bs ${a.balance.toFixed(0)}` : `$${a.balance.toFixed(2)}`}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">A</p>
        <div className="flex flex-wrap gap-2">
          {accounts.filter(a => a.id !== fromId).map(a => (
            <button key={a.id} onClick={() => setToId(a.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all ${toId === a.id ? 'bg-green-500/30 border border-green-500/40 text-white' : 'glass text-gray-400'}`}>
              {a.emoji} {a.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-gray-500 mb-1">Envías ({fromAcct?.currency})</p>
          <input type="number" inputMode="decimal" placeholder="0.00" value={fromAmount}
            onChange={e => setFromAmount(e.target.value)} className="w-full input" />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Recibes ({toAcct?.currency})</p>
          <input type="number" inputMode="decimal" placeholder="= igual" value={toAmount}
            onChange={e => setToAmount(e.target.value)} className="w-full input" />
        </div>
      </div>
      <input placeholder="Nota (ej: cambio a dólares)" value={note}
        onChange={e => setNote(e.target.value)} className="w-full input text-sm" />
      <button onClick={doTransfer}
        className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
        <ArrowLeftRight className="w-4 h-4" /> Transferir
      </button>
    </Sheet>
  )
}

// ── ADD PAYABLE MODAL ─────────────────────────────
function AddPayableModal({ onClose }: { onClose: () => void }) {
  const { addPayable } = useAppStore()
  const [supplier, setSupplier] = useState('')
  const [desc, setDesc]         = useState('')
  const [amount, setAmount]     = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [reminder, setReminder] = useState('3')

  function save() {
    if (!supplier || !amount || !dueDate) return
    addPayable({ supplierName: supplier, description: desc, amountUSD: parseFloat(amount), dueDate, status: 'pending', paidAmount: 0, reminderDays: parseInt(reminder) || 3 })
    toast.success('📤 Deuda registrada'); onClose()
  }

  return (
    <Sheet title="Registrar deuda" onClose={onClose}>
      <input placeholder="Proveedor / acreedor *" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full input" autoFocus />
      <input placeholder="Descripción" value={desc} onChange={e => setDesc(e.target.value)} className="w-full input" />
      <input type="number" inputMode="decimal" placeholder="Monto en USD *" value={amount} onChange={e => setAmount(e.target.value)} className="w-full input" />
      <div>
        <p className="text-xs text-gray-500 mb-1">Fecha de vencimiento *</p>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full input" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Recordar con… días de anticipación</p>
        <div className="flex gap-2">
          {['1', '2', '3', '5', '7'].map(d => (
            <button key={d} onClick={() => setReminder(d)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold ${reminder === d ? 'bg-violet-600 text-white' : 'glass text-gray-400'}`}>{d}d</button>
          ))}
        </div>
      </div>
      <button onClick={save} disabled={!supplier || !amount || !dueDate}
        className="w-full py-4 rounded-2xl text-white font-bold disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
        Guardar deuda
      </button>
    </Sheet>
  )
}

// ── ADD RECEIVABLE MODAL ──────────────────────────
function AddReceivableModal({ onClose }: { onClose: () => void }) {
  const { addReceivable } = useAppStore()
  const [client, setClient]   = useState('')
  const [desc, setDesc]       = useState('')
  const [amount, setAmount]   = useState('')
  const [dueDate, setDueDate] = useState('')

  function save() {
    if (!client || !amount || !dueDate) return
    addReceivable({ clientName: client, description: desc, amountUSD: parseFloat(amount), dueDate, status: 'pending', paidAmount: 0 })
    toast.success('📥 Cobro registrado'); onClose()
  }

  return (
    <Sheet title="Registrar cobro pendiente" onClose={onClose}>
      <input placeholder="Nombre del cliente *" value={client} onChange={e => setClient(e.target.value)} className="w-full input" autoFocus />
      <input placeholder="Descripción" value={desc} onChange={e => setDesc(e.target.value)} className="w-full input" />
      <input type="number" inputMode="decimal" placeholder="Monto en USD *" value={amount} onChange={e => setAmount(e.target.value)} className="w-full input" />
      <div>
        <p className="text-xs text-gray-500 mb-1">Fecha de vencimiento *</p>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full input" />
      </div>
      <button onClick={save} disabled={!client || !amount || !dueDate}
        className="w-full py-4 rounded-2xl text-white font-bold disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
        Guardar cobro
      </button>
    </Sheet>
  )
}
