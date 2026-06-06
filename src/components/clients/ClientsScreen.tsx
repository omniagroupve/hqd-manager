import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { CATALOG } from '../../data/catalog'
import type { Client, ClientTag } from '../../types'
import { Plus, X, Search, Phone, MapPin, Trash2, ChevronRight, Star } from 'lucide-react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const TAG_CONFIG: Record<ClientTag, { label: string; color: string; bg: string }> = {
  vip:       { label: '⭐ VIP',        color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  mayorista: { label: '📦 Mayorista',  color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  detal:     { label: '🛒 Detal',      color: '#67e8f9', bg: 'rgba(103,232,249,0.15)' },
  frecuente: { label: '🔁 Frecuente',  color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  nuevo:     { label: '✨ Nuevo',       color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
  deudor:    { label: '⚠ Deudor',     color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
}

const EMOJIS = ['👤','👨','👩','🧑','👴','👵','🧔','💁','🙋','🤵','👰','🧑‍💼','🤝','💎','🌟']

export default function ClientsScreen() {
  const { clients, sales, getCustomName } = useAppStore()
  const [search, setSearch]         = useState('')
  const [filterTag, setFilterTag]   = useState<ClientTag | 'all'>('all')
  const [showAdd, setShowAdd]       = useState(false)
  const [selected, setSelected]     = useState<Client | null>(null)

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) || c.instagram?.toLowerCase().includes(search.toLowerCase())
    const matchTag = filterTag === 'all' || c.tags.includes(filterTag)
    return matchSearch && matchTag
  })

  // Stats
  const totalClients  = clients.length
  const vipCount      = clients.filter(c => c.tags.includes('vip')).length
  const mayorCount    = clients.filter(c => c.tags.includes('mayorista')).length
  const totalRevenue  = sales.filter(s => s.clientId).reduce((sum, s) => sum + s.priceUSD * s.quantity, 0)

  if (selected) return <ClientDetail client={selected} onBack={() => setSelected(null)} />

  return (
    <div className="px-4 pt-2 pb-32 space-y-4">

      {/* Hero stats */}
      <div className="card-hero rounded-3xl p-5">
        <p className="text-caption text-purple-300/60 mb-3">CARTERA DE CLIENTES</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: totalClients, emoji: '👥', color: '#a78bfa' },
            { label: 'VIP',   value: vipCount,     emoji: '⭐', color: '#fbbf24' },
            { label: 'Mayor', value: mayorCount,   emoji: '📦', color: '#67e8f9' },
            { label: '$ Ventas', value: `$${totalRevenue.toFixed(0)}`, emoji: '💰', color: '#34d399', isText: true },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <p className="font-black num leading-none" style={{ color: stat.color, fontSize: stat.isText ? '0.75rem' : '1.5rem' }}>
                {stat.value}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/8 rounded-2xl px-3">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input placeholder="Buscar por nombre, teléfono..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none py-3" />
          {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-gray-500" /></button>}
        </div>
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowAdd(true)}
          className="w-12 h-12 rounded-2xl btn-primary flex items-center justify-center shrink-0">
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Tag filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setFilterTag('all')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterTag==='all'?'bg-violet-600 text-white':'glass text-gray-400'}`}>
          Todos
        </button>
        {(Object.keys(TAG_CONFIG) as ClientTag[]).map(tag => {
          const cfg = TAG_CONFIG[tag]
          return (
            <button key={tag} onClick={() => setFilterTag(filterTag===tag?'all':tag)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterTag===tag?'text-white':'text-gray-400 glass'}`}
              style={filterTag===tag ? { background: cfg.bg, border: `1px solid ${cfg.color}40`, color: cfg.color } : {}}>
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Client list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">{search ? '🔍' : '👥'}</p>
            <p className="text-sm text-gray-500">{search ? 'Sin resultados' : 'Aún no hay clientes'}</p>
            {!search && <button onClick={() => setShowAdd(true)} className="mt-3 text-violet-400 text-sm font-medium">+ Agregar el primero</button>}
          </div>
        )}
        <AnimatePresence>
          {filtered.map((c, i) => {
            const clientSales = sales.filter(s => s.clientId === c.id)
            const totalSpent  = clientSales.reduce((sum, s) => sum + s.priceUSD * s.quantity, 0)
            const lastSale    = clientSales[0]
            const lastProduct = lastSale
              ? CATALOG.flatMap(p => p.flavors).find(f => f.id === lastSale.flavorId)
              : null

            return (
              <motion.div key={c.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                exit={{ opacity: 0, x: -20 }}>
                <button className="w-full card-surface rounded-2xl p-4 text-left"
                  onClick={() => setSelected(c)}>
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: c.tags.includes('vip') ? 'rgba(251,191,36,0.15)' : 'rgba(139,92,246,0.15)', border: c.tags.includes('vip') ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(139,92,246,0.2)' }}>
                      {c.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                        {c.tags.includes('vip') && <Star className="w-3.5 h-3.5 text-yellow-400 shrink-0" fill="currentColor" />}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.tags.slice(0,2).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: TAG_CONFIG[t].bg, color: TAG_CONFIG[t].color }}>
                            {TAG_CONFIG[t].label}
                          </span>
                        ))}
                        {c.phone && <span className="text-[10px] text-gray-500">📞 {c.phone}</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-white num">${totalSpent.toFixed(0)}</p>
                      <p className="text-[10px] text-gray-500">{clientSales.length} ventas</p>
                      {c.lastPurchaseAt && (
                        <p className="text-[10px] text-gray-600">
                          {formatDistanceToNow(parseISO(c.lastPurchaseAt), { locale: es, addSuffix: true })}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
                  </div>

                  {lastProduct && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5">
                      <span className="text-sm">{lastProduct.emoji}</span>
                      <p className="text-xs text-gray-500">Última compra: {getCustomName(lastProduct.id, lastProduct.name)}</p>
                    </div>
                  )}
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAdd && <AddClientModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  )
}

// ── CLIENT DETAIL ─────────────────────────────────
function ClientDetail({ client, onBack }: { client: Client; onBack: () => void }) {
  const { sales, updateClient, deleteClient, getCustomName } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ ...client })

  const clientSales   = sales.filter(s => s.clientId === client.id)
  const totalSpent    = clientSales.reduce((sum, s) => sum + s.priceUSD * s.quantity, 0)
  const totalUnits    = clientSales.reduce((sum, s) => sum + s.quantity, 0)
  const avgTicket     = clientSales.length > 0 ? totalSpent / clientSales.length : 0

  // Top products
  const productCount: Record<string, { name: string; emoji: string; qty: number; revenue: number }> = {}
  clientSales.forEach(s => {
    const flavor = CATALOG.flatMap(p => p.flavors).find(f => f.id === s.flavorId)
    if (flavor) {
      if (!productCount[s.flavorId]) productCount[s.flavorId] = { name: getCustomName(s.flavorId, flavor.name), emoji: flavor.emoji, qty: 0, revenue: 0 }
      productCount[s.flavorId].qty     += s.quantity
      productCount[s.flavorId].revenue += s.priceUSD * s.quantity
    }
  })
  const topProducts = Object.values(productCount).sort((a,b) => b.revenue - a.revenue).slice(0, 5)

  function save() {
    updateClient(client.id, form)
    setEditing(false)
    toast.success('✅ Cliente actualizado')
  }

  const PAYMENT_LABELS: Record<string, string> = {
    cash_usd:'💵', zelle:'💸', usdt:'🔷', cash_bs:'💴', transfer:'🏦', pending:'⏳'
  }

  return (
    <div className="px-4 pt-2 pb-32 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-2xl glass flex items-center justify-center">
          <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
        </button>
        <h2 className="text-headline text-white flex-1">Perfil</h2>
        <button onClick={() => setEditing(!editing)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${editing?'bg-violet-600 text-white':'glass text-gray-400'}`}>
          {editing ? 'Guardando...' : 'Editar'}
        </button>
        <button onClick={() => { if(confirm(`¿Eliminar ${client.name}?`)) { deleteClient(client.id); onBack() }}}
          className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>

      {/* Profile card */}
      <div className="card-hero rounded-3xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-4xl"
            style={{ background: 'rgba(139,92,246,0.2)', border: '2px solid rgba(139,92,246,0.4)' }}>
            {form.emoji}
          </div>
          <div className="flex-1">
            {editing ? (
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-white/10 text-white text-lg font-bold px-3 py-1.5 rounded-xl border border-violet-500/50 outline-none mb-1" />
            ) : (
              <h3 className="text-xl font-black text-white">{client.name}</h3>
            )}
            <p className="text-xs text-gray-500">
              {client.createdAt ? `Cliente desde ${format(parseISO(client.createdAt),'MMM yyyy',{locale:es})}` : 'Cliente'}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(Object.keys(TAG_CONFIG) as ClientTag[]).map(tag => {
            const active = form.tags.includes(tag)
            const cfg    = TAG_CONFIG[tag]
            return (
              <button key={tag} onClick={() => editing && setForm({
                ...form,
                tags: active ? form.tags.filter(t=>t!==tag) : [...form.tags, tag]
              })}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${editing?'cursor-pointer':'cursor-default'}`}
                style={{ background: active?cfg.bg:'rgba(255,255,255,0.05)', color: active?cfg.color:'#6b7280',
                  border: `1px solid ${active?cfg.color+'40':'transparent'}` }}>
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500 shrink-0" />
            {editing ? (
              <input value={form.phone??''} onChange={e => setForm({...form, phone:e.target.value})}
                placeholder="Teléfono / WhatsApp" className="flex-1 input text-sm py-2" />
            ) : (
              <span className="text-sm text-gray-300">{client.phone ?? <span className="text-gray-600">Sin teléfono</span>}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 shrink-0">📸</span>
            {editing ? (
              <input value={form.instagram??''} onChange={e => setForm({...form, instagram:e.target.value})}
                placeholder="@instagram" className="flex-1 input text-sm py-2" />
            ) : (
              <span className="text-sm text-gray-300">{client.instagram ? `@${client.instagram}` : <span className="text-gray-600">Sin Instagram</span>}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
            {editing ? (
              <input value={form.zone??''} onChange={e => setForm({...form, zone:e.target.value})}
                placeholder="Zona / Sector" className="flex-1 input text-sm py-2" />
            ) : (
              <span className="text-sm text-gray-300">{client.zone ?? <span className="text-gray-600">Sin zona</span>}</span>
            )}
          </div>
          {editing && (
            <textarea value={form.notes??''} onChange={e => setForm({...form, notes:e.target.value})}
              placeholder="Notas del cliente..." rows={2}
              className="w-full input text-sm resize-none" />
          )}
          {!editing && client.notes && (
            <p className="text-xs text-gray-400 italic px-1">💬 "{client.notes}"</p>
          )}
        </div>

        {editing && (
          <button onClick={save} className="btn-primary w-full mt-3">Guardar cambios</button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total gastado', value: `$${totalSpent.toFixed(0)}`, color: '#a78bfa', emoji: '💰' },
          { label: 'Unidades',      value: totalUnits, color: '#06b6d4', emoji: '📦' },
          { label: 'Ticket prom.',  value: `$${avgTicket.toFixed(0)}`, color: '#10b981', emoji: '🎯' },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-3 text-center">
            <div className="text-xl mb-1">{k.emoji}</div>
            <p className="font-black num leading-none" style={{ color: k.color, fontSize: '1.1rem' }}>{k.value}</p>
            <p className="text-[10px] text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="card-surface rounded-2xl p-4">
          <p className="text-caption text-gray-500 mb-3">SABORES FAVORITOS</p>
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 w-4">#{i+1}</span>
                <span className="text-lg">{p.emoji}</span>
                <p className="flex-1 text-sm text-white font-medium">{p.name}</p>
                <div className="text-right">
                  <p className="text-xs font-bold text-white num">${p.revenue.toFixed(0)}</p>
                  <p className="text-[10px] text-gray-500">{p.qty} uds</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales history */}
      {clientSales.length > 0 && (
        <div className="card-surface rounded-2xl p-4">
          <p className="text-caption text-gray-500 mb-3">HISTORIAL DE COMPRAS</p>
          <div className="space-y-2">
            {clientSales.slice(0, 10).map(s => {
              const flavor = CATALOG.flatMap(p => p.flavors).find(f => f.id === s.flavorId)
              return (
                <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{flavor?.emoji ?? '💨'}</span>
                    <div>
                      <p className="text-xs font-medium text-white">{getCustomName(s.flavorId, flavor?.name ?? '?')}</p>
                      <p className="text-[10px] text-gray-500">
                        {PAYMENT_LABELS[s.paymentMethod]} · {s.quantity} ud{s.quantity>1?'s':''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white num">${(s.priceUSD*s.quantity).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-600">{format(parseISO(s.createdAt),'d MMM',{locale:es})}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── ADD CLIENT MODAL ──────────────────────────────
function AddClientModal({ onClose }: { onClose: () => void }) {
  const { addClient } = useAppStore()
  const [name, setName]           = useState('')
  const [phone, setPhone]         = useState('')
  const [instagram, setInstagram] = useState('')
  const [zone, setZone]           = useState('')
  const [notes, setNotes]         = useState('')
  const [emoji, setEmoji]         = useState('👤')
  const [tags, setTags]           = useState<ClientTag[]>([])

  function save() {
    if (!name.trim()) return
    addClient({ name: name.trim(), phone: phone||undefined, instagram: instagram||undefined,
      zone: zone||undefined, notes: notes||undefined, emoji, tags })
    toast.success(`✅ ${name} agregado a tu cartera`)
    onClose()
  }

  function toggleTag(tag: ClientTag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag])
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}}
      onClick={onClose}>
      <motion.div initial={{y:100}} animate={{y:0}} exit={{y:100}} transition={{type:'spring',stiffness:300,damping:30}}
        onClick={e=>e.stopPropagation()}
        className="w-full max-w-lg mx-auto rounded-t-3xl p-6 pb-10 space-y-3 overflow-y-auto max-h-[90vh]"
        style={{background:'#111120',border:'1px solid rgba(255,255,255,0.08)',borderBottom:'none'}}>

        <div className="flex justify-between items-center pb-1">
          <h3 className="text-headline text-white">Nuevo cliente</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Emoji picker */}
        <div className="flex gap-2 flex-wrap">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${emoji===e?'bg-violet-600/40 border border-violet-500/50':'bg-white/5'}`}>
              {e}
            </button>
          ))}
        </div>

        <input placeholder="Nombre *" value={name} onChange={e=>setName(e.target.value)} className="w-full input" autoFocus />
        <input placeholder="📞 Teléfono / WhatsApp" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full input" inputMode="tel" />
        <input placeholder="📸 @Instagram (sin @)" value={instagram} onChange={e=>setInstagram(e.target.value)} className="w-full input" />
        <input placeholder="📍 Zona / Sector" value={zone} onChange={e=>setZone(e.target.value)} className="w-full input" />

        {/* Tags */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Etiquetas</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TAG_CONFIG) as ClientTag[]).map(tag => {
              const active = tags.includes(tag)
              const cfg    = TAG_CONFIG[tag]
              return (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: active?cfg.bg:'rgba(255,255,255,0.05)',
                    color: active?cfg.color:'#6b7280', border:`1px solid ${active?cfg.color+'40':'transparent'}` }}>
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        <textarea placeholder="💬 Notas sobre el cliente..." value={notes} onChange={e=>setNotes(e.target.value)}
          rows={2} className="w-full input resize-none text-sm" />

        <button onClick={save} className="btn-primary w-full">
          Agregar a cartera
        </button>
      </motion.div>
    </motion.div>
  )
}
