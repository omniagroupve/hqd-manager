import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { Plus, X, CheckCircle } from 'lucide-react'
import AnimatedNumber from '../dashboard/AnimatedNumber'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type Tab = 'accounts' | 'payables' | 'receivables'

export default function MoneyScreen() {
  const [tab, setTab] = useState<Tab>('accounts')
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddPayable, setShowAddPayable] = useState(false)
  const [showAddReceivable, setShowAddReceivable] = useState(false)

  return (
    <div className="px-4 py-4 pb-28">
      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-2xl p-1 mb-5">
        {([['accounts','💳','Cuentas'],['payables','🔴','Por Pagar'],['receivables','🟢','Por Cobrar']] as const).map(([t,icon,label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'accounts' && <AccountsTab onAdd={() => setShowAddAccount(true)} />}
      {tab === 'payables' && <PayablesTab onAdd={() => setShowAddPayable(true)} />}
      {tab === 'receivables' && <ReceivablesTab onAdd={() => setShowAddReceivable(true)} />}

      <AnimatePresence>
        {showAddAccount && <AddAccountModal onClose={() => setShowAddAccount(false)} />}
        {showAddPayable && <AddPayableModal onClose={() => setShowAddPayable(false)} />}
        {showAddReceivable && <AddReceivableModal onClose={() => setShowAddReceivable(false)} />}
      </AnimatePresence>
    </div>
  )
}

function AccountsTab({ onAdd }: { onAdd: () => void }) {
  const { accounts, binanceRate, updateAccountBalance } = useAppStore()
  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [delta, setDelta] = useState('')

  const totalUSD = accounts
    .filter((a) => a.currency !== 'Bs')
    .reduce((s, a) => s + a.balance, 0)
  const totalBs = accounts.filter((a) => a.currency === 'Bs').reduce((s, a) => s + a.balance, 0)

  function applyDelta(id: string, sign: 1 | -1) {
    const val = parseFloat(delta)
    if (!isNaN(val)) updateAccountBalance(id, sign * val)
    setAdjustId(null); setDelta('')
  }

  return (
    <div className="space-y-3">
      <div className="card-glow rounded-3xl p-5 mb-2">
        <p className="text-xs text-purple-300 uppercase tracking-widest mb-1">Total disponible</p>
        <AnimatedNumber value={totalUSD} prefix="$" className="text-3xl font-black text-white" />
        {binanceRate > 0 && totalBs > 0 && (
          <p className="text-purple-300 text-sm mt-1">+ Bs {totalBs.toLocaleString()} ≈ ${(totalBs/binanceRate).toFixed(2)}</p>
        )}
      </div>

      {accounts.map((a) => (
        <div key={a.id} className="bg-surface rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{a.emoji}</span>
              <div>
                <p className="font-semibold text-white text-sm">{a.name}</p>
                <p className="text-xs text-gray-400">{a.currency} · {a.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-white">
                {a.currency === 'Bs' ? `Bs ${a.balance.toLocaleString()}` : `$${a.balance.toFixed(2)}`}
              </p>
              <button onClick={() => setAdjustId(a.id)} className="text-xs text-purple-400">Ajustar</button>
            </div>
          </div>
          <AnimatePresence>
            {adjustId === a.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3 flex gap-2"
              >
                <input
                  autoFocus type="number" placeholder="Monto"
                  value={delta} onChange={(e) => setDelta(e.target.value)}
                  className="flex-1 bg-black/30 text-white rounded-xl px-3 py-2 text-sm border border-white/10"
                />
                <button onClick={() => applyDelta(a.id, 1)} className="px-3 py-2 bg-green-700 rounded-xl text-sm">+</button>
                <button onClick={() => applyDelta(a.id, -1)} className="px-3 py-2 bg-red-700 rounded-xl text-sm">−</button>
                <button onClick={() => setAdjustId(null)} className="px-3 py-2 bg-surface rounded-xl text-sm text-gray-400">✕</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onAdd}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-purple-800 text-purple-400 text-sm flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Nueva cuenta
      </motion.button>
    </div>
  )
}

function PayablesTab({ onAdd }: { onAdd: () => void }) {
  const { payables, updatePayable } = useAppStore()
  const pending = payables.filter((p) => p.status !== 'paid')
  const paid = payables.filter((p) => p.status === 'paid')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">
          Total pendiente: <span className="text-red-400">${pending.reduce((s, p) => s + p.amountUSD - p.paidAmount, 0).toFixed(2)}</span>
        </p>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onAdd}
          className="flex items-center gap-1 bg-red-900/30 border border-red-800/40 text-red-300 px-3 py-1.5 rounded-xl text-xs">
          <Plus className="w-3 h-3" /> Agregar
        </motion.button>
      </div>

      {pending.map((p) => (
        <DebtCard key={p.id} item={p} type="payable"
          onMarkPaid={() => updatePayable(p.id, { status: 'paid', paidAmount: p.amountUSD })} />
      ))}

      {paid.length > 0 && (
        <details className="group">
          <summary className="text-xs text-gray-500 cursor-pointer py-2">Ver pagadas ({paid.length})</summary>
          <div className="space-y-2 mt-2">
            {paid.map((p) => <DebtCard key={p.id} item={p} type="payable" onMarkPaid={() => {}} />)}
          </div>
        </details>
      )}

      {pending.length === 0 && paid.length === 0 && (
        <div className="text-center py-12 text-gray-500">No hay cuentas por pagar 🎉</div>
      )}
    </div>
  )
}

function ReceivablesTab({ onAdd }: { onAdd: () => void }) {
  const { receivables, updateReceivable } = useAppStore()
  const pending = receivables.filter((r) => r.status !== 'paid')
  const paid = receivables.filter((r) => r.status === 'paid')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">
          Por cobrar: <span className="text-green-400">${pending.reduce((s, r) => s + r.amountUSD - r.paidAmount, 0).toFixed(2)}</span>
        </p>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onAdd}
          className="flex items-center gap-1 bg-green-900/30 border border-green-800/40 text-green-300 px-3 py-1.5 rounded-xl text-xs">
          <Plus className="w-3 h-3" /> Agregar
        </motion.button>
      </div>

      {pending.map((r) => (
        <DebtCard key={r.id} item={r} type="receivable"
          onMarkPaid={() => updateReceivable(r.id, { status: 'paid', paidAmount: r.amountUSD })} />
      ))}

      {paid.length > 0 && (
        <details>
          <summary className="text-xs text-gray-500 cursor-pointer py-2">Ver cobradas ({paid.length})</summary>
          <div className="space-y-2 mt-2">
            {paid.map((r) => <DebtCard key={r.id} item={r} type="receivable" onMarkPaid={() => {}} />)}
          </div>
        </details>
      )}

      {pending.length === 0 && paid.length === 0 && (
        <div className="text-center py-12 text-gray-500">No hay cuentas por cobrar</div>
      )}
    </div>
  )
}

function DebtCard({ item, type, onMarkPaid }: { item: any; type: 'payable' | 'receivable'; onMarkPaid: () => void }) {
  const isPaid = item.status === 'paid'
  const remaining = item.amountUSD - item.paidAmount
  const isOverdue = !isPaid && new Date() > new Date(item.dueDate)
  const color = type === 'payable' ? 'red' : 'green'

  return (
    <div className={`bg-surface rounded-2xl p-4 border ${isOverdue ? `border-${color}-800/50` : 'border-transparent'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-white text-sm">{item.supplierName || item.clientName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
          <p className={`text-xs mt-1 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
            {isOverdue ? '⚠️ Vencida · ' : ''}
            {format(parseISO(item.dueDate), "d MMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-bold ${isPaid ? 'text-gray-500 line-through' : type === 'payable' ? 'text-red-400' : 'text-green-400'}`}>
            ${remaining.toFixed(2)}
          </p>
          {!isPaid && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={onMarkPaid}
              className="text-xs text-purple-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Pagada
            </motion.button>
          )}
          {isPaid && <CheckCircle className="w-4 h-4 text-green-500 ml-auto mt-1" />}
        </div>
      </div>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
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
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const { addAccount } = useAppStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏦')
  const [currency, setCurrency] = useState<'USD' | 'Bs' | 'USDT'>('USD')
  const [balance, setBalance] = useState('')

  function save() {
    if (!name) return
    addAccount({ name, emoji, currency, balance: parseFloat(balance) || 0, type: 'bank' })
    onClose()
  }

  return (
    <Modal title="Nueva cuenta" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex gap-3">
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-14 input text-center text-2xl" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej: Banesco)" className="flex-1 input" />
        </div>
        <div className="flex gap-2">
          {(['USD','Bs','USDT'] as const).map((c) => (
            <button key={c} onClick={() => setCurrency(c)}
              className={`flex-1 py-2 rounded-xl text-sm ${currency === c ? 'bg-purple-600 text-white' : 'bg-black/30 text-gray-400'}`}>
              {c}
            </button>
          ))}
        </div>
        <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Saldo inicial" className="w-full input" />
        <button onClick={save} className="w-full py-3 bg-purple-600 rounded-2xl text-white font-bold">Guardar</button>
      </div>
    </Modal>
  )
}

function AddPayableModal({ onClose }: { onClose: () => void }) {
  const { addPayable } = useAppStore()
  const [supplier, setSupplier] = useState('')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [due, setDue] = useState('')

  function save() {
    if (!supplier || !amount || !due) return
    addPayable({ supplierName: supplier, description: desc, amountUSD: parseFloat(amount), dueDate: due, status: 'pending', paidAmount: 0 })
    onClose()
  }

  return (
    <Modal title="Nueva deuda" onClose={onClose}>
      <div className="space-y-3">
        <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Proveedor / nombre" className="w-full input" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción (opcional)" className="w-full input" />
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monto USD" className="w-full input" />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-full input" />
        <button onClick={save} className="w-full py-3 bg-red-600 rounded-2xl text-white font-bold">Registrar deuda</button>
      </div>
    </Modal>
  )
}

function AddReceivableModal({ onClose }: { onClose: () => void }) {
  const { addReceivable } = useAppStore()
  const [client, setClient] = useState('')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [due, setDue] = useState('')

  function save() {
    if (!client || !amount || !due) return
    addReceivable({ clientName: client, description: desc, amountUSD: parseFloat(amount), dueDate: due, status: 'pending', paidAmount: 0 })
    onClose()
  }

  return (
    <Modal title="Nueva cuenta por cobrar" onClose={onClose}>
      <div className="space-y-3">
        <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nombre del cliente" className="w-full input" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción (opcional)" className="w-full input" />
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monto USD" className="w-full input" />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-full input" />
        <button onClick={save} className="w-full py-3 bg-green-600 rounded-2xl text-white font-bold">Registrar cobro</button>
      </div>
    </Modal>
  )
}
