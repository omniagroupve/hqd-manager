import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { Plus, ArrowLeftRight, Trash2, X, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { isAfter, differenceInDays, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import AnimatedNumber from '../dashboard/AnimatedNumber'

type Tab = 'accounts' | 'payables' | 'receivables'

export default function MoneyScreen() {
  const [tab, setTab] = useState<Tab>('accounts')
  const [showTransfer, setShowTransfer]         = useState(false)
  const [showAddAccount, setShowAddAccount]     = useState(false)
  const [showAddPayable, setShowAddPayable]     = useState(false)
  const [showAddReceivable, setShowAddReceivable] = useState(false)

  const { accounts, payables, receivables, binanceRate } = useAppStore()

  const totalUSD   = accounts.filter(a => a.currency === 'USD' || a.currency === 'USDT').reduce((s,a) => s+a.balance, 0)
  const totalBs    = accounts.filter(a => a.currency === 'Bs').reduce((s,a) => s+a.balance, 0)
  const grandTotal = totalUSD + (binanceRate > 0 ? totalBs / binanceRate : 0)

  const today = new Date()
  const pendingPay    = payables.filter(p => p.status !== 'paid')
  const pendingRec    = receivables.filter(r => r.status !== 'paid')
  const overduePayables = pendingPay.filter(p => isAfter(today, parseISO(p.dueDate)))
  const dueSoonPayables = pendingPay.filter(p => {
    const days = differenceInDays(parseISO(p.dueDate), today)
    return days >= 0 && days <= (p.reminderDays ?? 3)
  })

  return (
    <div className="px-4 pt-2 pb-32 space-y-4">

      {/* Hero */}
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
                    ? `Bs ${a.balance.toLocaleString('es-VE',{maximumFractionDigits:0})}`
                    : `$${a.balance.toFixed(2)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reminders */}
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
              <span className="text-red-400 font-bold text-sm num">${(p.amountUSD-p.paidAmount).toFixed(0)}</span>
            </div>
          ))}
          {dueSoonPayables.filter(p => !overduePayables.find(o => o.id===p.id)).map(p => (
            <div key={p.id} className="glass rounded-2xl p-3 flex items-center gap-2"
              style={{borderColor:'rgba(251,191,36,0.3)', background:'rgba(251,191,36,0.06)'}}>
              <span>🟡</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-300">{p.supplierName}</p>
                <p className="text-xs text-gray-400">Vence en {differenceInDays(parseISO(p.dueDate), today)} días</p>
              </div>
              <span className="text-yellow-400 font-bold text-sm num">${(p.amountUSD-p.paidAmount).toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5">
        {([['accounts','💳 Cuentas'],['payables','📤 Por pagar'],['receivables','📥 Por cobrar']] as const).map(([t,label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${tab===t?'bg-violet-600 text-white':'text-gray-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'accounts' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button onClick={() => setShowAddAccount(true)}
              className="flex-1 glass rounded-2xl py-3 flex items-center justify-center gap-2 text-sm text-gray-300 font-medium">
              <Plus className="w-4 h-4" /> Nueva
            </button>
            <button onClick={() => setShowTransfer(true)}
              className="flex-1 glass-purple rounded-2xl py-3 flex items-center justify-center gap-2 text-sm text-violet-300 font-medium">
              <ArrowLeftRight className="w-4 h-4" /> Transferir
            </button>
          </div>
          {accounts.map(a => <AccountCard key={a.id} account={a} />)}
        </div>
      )}

      {tab === 'payables' && (
        <div className="space-y-2">
          <button onClick={() => setShowAddPayable(true)}
            className="w-full glass rounded-2xl py-3 flex items-center justify-center gap-2 text-sm text-gray-300 font-medium">
            <Plus className="w-4 h-4" /> Agregar deuda
          </button>
          {pendingPay.length === 0 && payables.filter(p=>p.status==='paid').length === 0 && (
            <div className="text-center py-10"><p className="text-4xl mb-2">✅</p><p className="text-sm text-gray-500">Sin deudas</p></div>
          )}
          {[...pendingPay, ...payables.filter(p=>p.status==='paid').slice(0,5)].map(p => <PayableCard key={p.id} payable={p} />)}
        </div>
      )}

      {tab === 'receivables' && (
        <div className="space-y-2">
          <button onClick={() => setShowAddReceivable(true)}
            className="w-full glass rounded-2xl py-3 flex items-center justify-center gap-2 text-sm text-gray-300 font-medium">
            <Plus className="w-4 h-4" /> Agregar cobro
          </button>
          {pendingRec.length === 0 && receivables.filter(r=>r.status==='paid').length === 0 && (
            <div className="text-center py-10"><p className="text-4xl mb-2">📭</p><p className="text-sm text-gray-500">Sin cobros pendientes</p></div>
          )}
          {[...pendingRec, ...receivables.filter(r=>r.status==='paid').slice(0,5)].map(r => <ReceivableCard key={r.id} receivable={r} />)}
        </div>
      )}

      <AnimatePresence>
        {showTransfer     && <TransferModal     onClose={() => setShowTransfer(false)} />}
        {showAddAccount   && <AddAccountModal   onClose={() => setShowAddAccount(false)} />}
        {showAddPayable   && <AddPayableModal   onClose={() => setShowAddPayable(false)} />}
        {showAddReceivable && <AddReceivableModal onClose={() => setShowAddReceivable(false)} />}
      </AnimatePresence>
    </div>
  )
}

// ── ACCOUNT CARD ─────────────────────────────────
function AccountCard({ account: a }: { account: any }) {
  const { updateAccount, deleteAccount, creditAccount, debitAccount, getAccountTransactions } = useAppStore()
  const [editing, setEditing]     = useState(false)
  const [name, setName]           = useState(a.name)
  const [adjAmount, setAdjAmount] = useState('')
  const [showAdj, setShowAdj]     = useState(false)
  const [showTx, setShowTx]       = useState(false)

  const transactions = getAccountTransactions(a.id)
  const todayCredits = transactions.filter(t => t.type==='credit' && t.createdAt.startsWith(new Date().toISOString().slice(0,10)))
    .reduce((s,t) => s+t.amount, 0)
  const todayDebits  = transactions.filter(t => t.type==='debit' && t.createdAt.startsWith(new Date().toISOString().slice(0,10)))
    .reduce((s,t) => s+t.amount, 0)

  return (
    <div className="card-surface rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">{a.emoji}</span>
            {editing ? (
              <input value={name} onChange={e => setName(e.target.value)} autoFocus
                onBlur={() => { updateAccount(a.id,{name}); setEditing(false) }}
                onKeyDown={e => e.key==='Enter' && (updateAccount(a.id,{name}), setEditing(false))}
                className="flex-1 bg-white/10 text-white text-sm font-semibold px-2 py-1 rounded-lg border border-violet-500/50 outline-none" />
            ) : (
              <button onClick={() => setEditing(true)} className="text-sm font-semibold text-white text-left">{a.name}</button>
            )}
          </div>
          <div className="text-right">
            <p className="text-base font-black text-white num">
              {a.currency==='Bs' ? `Bs ${a.balance.toLocaleString('es-VE',{maximumFractionDigits:0})}` : `$${a.balance.toFixed(2)}`}
            </p>
            <p className="text-[10px] text-gray-500">{a.currency} · {a.type}</p>
          </div>
        </div>

        {/* Today summary */}
        {(todayCredits > 0 || todayDebits > 0) && (
          <div className="flex gap-2 mb-3">
            {todayCredits > 0 && (
              <div className="flex items-center gap-1 bg-emerald-500/10 rounded-xl px-2.5 py-1.5">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400 num">+{a.currency==='Bs'?'Bs ':' $'}{todayCredits.toFixed(0)}</span>
                <span className="text-[10px] text-gray-500">hoy</span>
              </div>
            )}
            {todayDebits > 0 && (
              <div className="flex items-center gap-1 bg-red-500/10 rounded-xl px-2.5 py-1.5">
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span className="text-xs font-semibold text-red-400 num">-{a.currency==='Bs'?'Bs ':' $'}{todayDebits.toFixed(0)}</span>
                <span className="text-[10px] text-gray-500">hoy</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setShowAdj(!showAdj)}
            className="flex-1 text-xs text-gray-400 bg-white/5 rounded-xl py-1.5 flex items-center justify-center gap-1">
            Ajustar <ChevronDown className={`w-3 h-3 transition-transform ${showAdj?'rotate-180':''}`} />
          </button>
          <button onClick={() => setShowTx(!showTx)}
            className={`flex-1 text-xs rounded-xl py-1.5 flex items-center justify-center gap-1 transition-all ${showTx?'bg-violet-600/30 text-violet-300 border border-violet-500/30':'bg-white/5 text-gray-400'}`}>
            Movimientos <span className="text-[10px] opacity-60">({transactions.length})</span>
          </button>
          <button onClick={() => { if(confirm(`¿Eliminar ${a.name}?`)) deleteAccount(a.id) }}
            className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>

      {/* Adjust */}
      <AnimatePresence>
        {showAdj && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
            <div className="px-4 pb-4 flex gap-2 border-t border-white/5 pt-3">
              <input type="number" inputMode="decimal" placeholder="Monto" value={adjAmount}
                onChange={e => setAdjAmount(e.target.value)}
                className="flex-1 bg-white/5 text-white text-sm px-3 py-2 rounded-xl border border-white/10 outline-none" />
              <button onClick={() => {
                const v=parseFloat(adjAmount); if(!isNaN(v) && v>0) {
                  creditAccount(a.id, v, 'Ajuste manual +', 'manual')
                  setAdjAmount(''); setShowAdj(false)
                  toast.success(`✅ +${v} ${a.currency} a ${a.name}`)
                }
              }} className="px-3 bg-violet-600 text-white text-sm font-bold rounded-xl">+</button>
              <button onClick={() => {
                const v=parseFloat(adjAmount); if(!isNaN(v) && v>0) {
                  debitAccount(a.id, v, 'Ajuste manual −', 'manual')
                  setAdjAmount(''); setShowAdj(false)
                  toast.success(`✅ −${v} ${a.currency} de ${a.name}`)
                }
              }} className="px-3 bg-red-600/70 text-white text-sm font-bold rounded-xl">−</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction history */}
      <AnimatePresence>
        {showTx && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
            <div className="border-t border-white/5 px-4 py-3 space-y-0.5 max-h-64 overflow-y-auto">
              <p className="text-caption text-gray-600 mb-2">ÚLTIMOS MOVIMIENTOS</p>
              {transactions.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-3">Sin movimientos aún</p>
              )}
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${tx.type==='credit'?'bg-emerald-500/20':'bg-red-500/20'}`}>
                      {tx.type==='credit'
                        ? <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                        : <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-300 truncate">{tx.description}</p>
                      <p className="text-[10px] text-gray-600">{format(parseISO(tx.createdAt),'d MMM, HH:mm',{locale:es})}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold num shrink-0 ml-2 ${tx.type==='credit'?'text-emerald-400':'text-red-400'}`}>
                    {tx.type==='credit'?'+':'−'}
                    {a.currency==='Bs'?`Bs ${tx.amount.toFixed(0)}`:`$${tx.amount.toFixed(2)}`}
                  </span>
                </div>
              ))}
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
  const [showPay, setShowPay] = useState(false)
  const [amount, setAmount]   = useState('')
  const [acctId, setAcctId]   = useState(accounts[0]?.id ?? '')
  const pending  = p.amountUSD - p.paidAmount
  const pct      = p.amountUSD > 0 ? p.paidAmount / p.amountUSD : 0
  const today    = new Date()
  const daysLeft = differenceInDays(parseISO(p.dueDate), today)

  return (
    <div className={`card-surface rounded-2xl p-4 ${p.status==='paid'?'opacity-50':''}`}>
      <div className="flex items-start justify-between mb-2">
        <div><p className="text-sm font-semibold text-white">{p.supplierName}</p><p className="text-xs text-gray-500">{p.description}</p></div>
        <div className="text-right">
          <p className={`text-sm font-bold num ${p.status==='paid'?'text-green-400':daysLeft<0?'text-red-400':'text-white'}`}>${pending.toFixed(2)}</p>
          <p className="text-[10px] text-gray-500">de ${p.amountUSD.toFixed(2)}</p>
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full" style={{width:`${pct*100}%`, background:p.status==='paid'?'#10b981':'linear-gradient(90deg,#7c3aed,#a78bfa)', transition:'width 0.7s'}} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={daysLeft<0&&p.status!=='paid'?'text-red-400':'text-gray-500'}>
          {p.status==='paid'?'✅ Pagada':daysLeft<0?`⚠ Vencida hace ${Math.abs(daysLeft)}d`:`Vence en ${daysLeft}d`}
        </span>
        <div className="flex gap-1">
          {p.status!=='paid' && (
            <button onClick={() => setShowPay(!showPay)}
              className="px-2.5 py-1 bg-violet-600/30 border border-violet-500/30 rounded-lg text-violet-300 font-medium text-xs">
              Pagar
            </button>
          )}
          <button onClick={() => { if(confirm('¿Eliminar?')) deletePayable(p.id) }}
            className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center">
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showPay && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
            <div className="pt-3 space-y-2">
              <input type="number" inputMode="decimal" placeholder={`Monto (max $${pending.toFixed(2)})`} value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-white/5 text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none" />
              <div className="flex flex-wrap gap-1.5">
                {accounts.map((a:any) => (
                  <button key={a.id} onClick={() => setAcctId(a.id)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl ${acctId===a.id?'bg-violet-600 text-white':'glass text-gray-400'}`}>
                    {a.emoji} {a.name}
                  </button>
                ))}
              </div>
              <button onClick={() => {
                const v=parseFloat(amount); if(isNaN(v)||v<=0) return
                payPayable(p.id, Math.min(v,pending), acctId||undefined)
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
  const [amount, setAmount] = useState('')
  const [acctId, setAcctId] = useState(accounts[0]?.id ?? '')
  const pending  = r.amountUSD - r.paidAmount
  const pct      = r.amountUSD > 0 ? r.paidAmount / r.amountUSD : 0
  const today    = new Date()
  const daysLeft = differenceInDays(parseISO(r.dueDate), today)

  return (
    <div className={`card-surface rounded-2xl p-4 ${r.status==='paid'?'opacity-50':''}`}>
      <div className="flex items-start justify-between mb-2">
        <div><p className="text-sm font-semibold text-white">{r.clientName}</p><p className="text-xs text-gray-500">{r.description}</p></div>
        <div className="text-right">
          <p className={`text-sm font-bold num ${r.status==='paid'?'text-green-400':daysLeft<0?'text-red-400':'text-emerald-400'}`}>${pending.toFixed(2)}</p>
          <p className="text-[10px] text-gray-500">de ${r.amountUSD.toFixed(2)}</p>
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full" style={{width:`${pct*100}%`, background:'linear-gradient(90deg,#10b981,#34d399)', transition:'width 0.7s'}} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={daysLeft<0&&r.status!=='paid'?'text-red-400':'text-gray-500'}>
          {r.status==='paid'?'✅ Cobrado':daysLeft<0?`⚠ Vencida hace ${Math.abs(daysLeft)}d`:`Vence en ${daysLeft}d`}
        </span>
        <div className="flex gap-1">
          {r.status!=='paid' && (
            <button onClick={() => setShowCollect(!showCollect)}
              className="px-2.5 py-1 bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-emerald-300 font-medium text-xs">
              Cobrar
            </button>
          )}
          <button onClick={() => { if(confirm('¿Eliminar?')) deleteReceivable(r.id) }}
            className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center">
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showCollect && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
            <div className="pt-3 space-y-2">
              <input type="number" inputMode="decimal" placeholder="Monto a cobrar" value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-white/5 text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 outline-none" />
              <div className="flex flex-wrap gap-1.5">
                {accounts.map((a:any) => (
                  <button key={a.id} onClick={() => setAcctId(a.id)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl ${acctId===a.id?'bg-emerald-600 text-white':'glass text-gray-400'}`}>
                    {a.emoji} {a.name}
                  </button>
                ))}
              </div>
              <button onClick={() => {
                const v=parseFloat(amount); if(isNaN(v)||v<=0) return
                collectReceivable(r.id, Math.min(v,pending), acctId||undefined)
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

// ── BOTTOM SHEET ──────────────────────────────────
function BottomSheet({ title, children, onClose }: { title:string; children:React.ReactNode; onClose:()=>void }) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}}
      onClick={onClose}>
      <motion.div initial={{y:80}} animate={{y:0}} exit={{y:80}} transition={{type:'spring',stiffness:300,damping:30}}
        onClick={e=>e.stopPropagation()} className="w-full max-w-lg mx-auto rounded-t-3xl p-6 pb-10 space-y-3"
        style={{background:'#111120',border:'1px solid rgba(255,255,255,0.08)',borderBottom:'none'}}>
        <div className="flex justify-between items-center pb-1">
          <h3 className="text-headline text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

// ── TRANSFER MODAL ────────────────────────────────
function TransferModal({ onClose }: { onClose:()=>void }) {
  const { accounts, transferBetweenAccounts } = useAppStore()
  const [fromId, setFromId]         = useState(accounts[0]?.id ?? '')
  const [toId, setToId]             = useState(accounts[1]?.id ?? '')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount]     = useState('')
  const [note, setNote]             = useState('')
  const fromAcct = accounts.find(a => a.id===fromId)
  const toAcct   = accounts.find(a => a.id===toId)

  function doTransfer() {
    const from = parseFloat(fromAmount)
    const to   = parseFloat(toAmount) || from
    if (isNaN(from)||from<=0||!fromId||!toId||fromId===toId) return
    transferBetweenAccounts({ fromAccountId:fromId, toAccountId:toId, fromAmount:from, toAmount:to, note:note||undefined })
    toast.success(`✅ ${fromAcct?.emoji} → ${toAcct?.emoji} transferido`)
    onClose()
  }

  return (
    <BottomSheet title="Transferir entre cuentas" onClose={onClose}>
      <p className="text-xs text-gray-500 mb-1">DE</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {accounts.map(a => (
          <button key={a.id} onClick={() => setFromId(a.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all ${fromId===a.id?'bg-red-500/30 border border-red-500/40 text-white':'glass text-gray-400'}`}>
            {a.emoji} {a.name} <span className="opacity-50 num">{a.currency==='Bs'?`Bs${a.balance.toFixed(0)}`:`$${a.balance.toFixed(2)}`}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mb-1">A</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {accounts.filter(a=>a.id!==fromId).map(a => (
          <button key={a.id} onClick={() => setToId(a.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all ${toId===a.id?'bg-green-500/30 border border-green-500/40 text-white':'glass text-gray-400'}`}>
            {a.emoji} {a.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-gray-500 mb-1">Envías ({fromAcct?.currency})</p>
          <input type="number" inputMode="decimal" placeholder="0.00" value={fromAmount} onChange={e=>setFromAmount(e.target.value)} className="w-full input" />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Recibes ({toAcct?.currency})</p>
          <input type="number" inputMode="decimal" placeholder="= igual monto" value={toAmount} onChange={e=>setToAmount(e.target.value)} className="w-full input" />
        </div>
      </div>
      <input placeholder="Nota (ej: cambio a dólares)" value={note} onChange={e=>setNote(e.target.value)} className="w-full input text-sm" />
      <button onClick={doTransfer} className="btn-primary w-full flex items-center justify-center gap-2">
        <ArrowLeftRight className="w-4 h-4" /> Transferir
      </button>
    </BottomSheet>
  )
}

// ── ADD ACCOUNT MODAL ─────────────────────────────
function AddAccountModal({ onClose }: { onClose:()=>void }) {
  const { addAccount } = useAppStore()
  const [name, setName]         = useState('')
  const [emoji, setEmoji]       = useState('💰')
  const [currency, setCurrency] = useState<'USD'|'Bs'|'USDT'>('USD')
  const [type, setType]         = useState<'cash'|'bank'|'crypto'>('cash')
  const [balance, setBalance]   = useState('')
  const EMOJIS = ['💵','💴','💸','🏦','🔷','💳','📱','🏧','💰','💎']

  function save() {
    if (!name) return
    addAccount({ name, emoji, currency, type, balance: parseFloat(balance)||0 })
    toast.success('✅ Cuenta agregada'); onClose()
  }

  return (
    <BottomSheet title="Nueva cuenta" onClose={onClose}>
      <div className="flex gap-2 flex-wrap">
        {EMOJIS.map(e => (
          <button key={e} onClick={() => setEmoji(e)}
            className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center ${emoji===e?'bg-violet-600/40 border border-violet-500/40':'bg-white/5'}`}>
            {e}
          </button>
        ))}
      </div>
      <input placeholder="Nombre de la cuenta" value={name} onChange={e=>setName(e.target.value)} className="w-full input" />
      <div className="grid grid-cols-3 gap-2">
        {(['USD','Bs','USDT'] as const).map(c => (
          <button key={c} onClick={() => setCurrency(c)}
            className={`py-2.5 rounded-xl text-sm font-semibold ${currency===c?'bg-violet-600 text-white':'glass text-gray-400'}`}>{c}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(['cash','bank','crypto'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`py-2.5 rounded-xl text-xs font-semibold ${type===t?'bg-violet-600 text-white':'glass text-gray-400'}`}>
            {t==='cash'?'Efectivo':t==='bank'?'Banco':'Cripto'}
          </button>
        ))}
      </div>
      <input type="number" inputMode="decimal" placeholder="Saldo inicial" value={balance} onChange={e=>setBalance(e.target.value)} className="w-full input" />
      <button onClick={save} className="btn-primary w-full">Guardar cuenta</button>
    </BottomSheet>
  )
}

// ── ADD PAYABLE MODAL ─────────────────────────────
function AddPayableModal({ onClose }: { onClose:()=>void }) {
  const { addPayable } = useAppStore()
  const [supplier, setSupplier] = useState('')
  const [desc, setDesc]         = useState('')
  const [amount, setAmount]     = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [reminder, setReminder] = useState('3')

  function save() {
    if (!supplier||!amount||!dueDate) return
    addPayable({ supplierName:supplier, description:desc, amountUSD:parseFloat(amount),
      dueDate, status:'pending', paidAmount:0, reminderDays:parseInt(reminder)||3 })
    toast.success('📤 Deuda registrada'); onClose()
  }

  return (
    <BottomSheet title="Registrar deuda" onClose={onClose}>
      <input placeholder="Proveedor / acreedor" value={supplier} onChange={e=>setSupplier(e.target.value)} className="w-full input" />
      <input placeholder="Descripción" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full input" />
      <input type="number" inputMode="decimal" placeholder="Monto en USD" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full input" />
      <div>
        <p className="text-xs text-gray-500 mb-1">Fecha de vencimiento</p>
        <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full input" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Recordar con… días de anticipación</p>
        <div className="flex gap-2">
          {['1','2','3','5','7'].map(d => (
            <button key={d} onClick={() => setReminder(d)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold ${reminder===d?'bg-violet-600 text-white':'glass text-gray-400'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>
      <button onClick={save} className="btn-primary w-full">Guardar deuda</button>
    </BottomSheet>
  )
}

// ── ADD RECEIVABLE MODAL ──────────────────────────
function AddReceivableModal({ onClose }: { onClose:()=>void }) {
  const { addReceivable } = useAppStore()
  const [client, setClient]   = useState('')
  const [desc, setDesc]       = useState('')
  const [amount, setAmount]   = useState('')
  const [dueDate, setDueDate] = useState('')

  function save() {
    if (!client||!amount||!dueDate) return
    addReceivable({ clientName:client, description:desc, amountUSD:parseFloat(amount),
      dueDate, status:'pending', paidAmount:0 })
    toast.success('📥 Cobro registrado'); onClose()
  }

  return (
    <BottomSheet title="Registrar cobro pendiente" onClose={onClose}>
      <input placeholder="Cliente" value={client} onChange={e=>setClient(e.target.value)} className="w-full input" />
      <input placeholder="Descripción" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full input" />
      <input type="number" inputMode="decimal" placeholder="Monto en USD" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full input" />
      <div>
        <p className="text-xs text-gray-500 mb-1">Fecha de vencimiento</p>
        <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full input" />
      </div>
      <button onClick={save} className="btn-primary w-full">Guardar cobro</button>
    </BottomSheet>
  )
}
