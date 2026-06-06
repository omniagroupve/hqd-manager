import { create } from 'zustand'
import { loadState, saveState } from '../lib/storage'
import type {
  AppState, Sale, Expense, Payable, Receivable, Account,
  WeekClose, AccountTransfer, AccountTransaction, Client,
} from '../types'
import { CATALOG } from '../data/catalog'

interface AppStore extends AppState {
  setBinanceRate: (rate: number) => void

  // Inventory
  setInventory: (productId: string, flavorId: string, qty: number) => void
  adjustInventory: (productId: string, flavorId: string, delta: number) => void
  getStock: (flavorId: string) => number
  getInventoryValue: () => number   // total stock × price

  // Custom names
  setCustomName: (id: string, name: string) => void
  getCustomName: (id: string, fallback: string) => string

  // Custom prices
  setCustomPrice: (productId: string, price: number, cost?: number) => void
  getCustomPrice: (productId: string) => number   // returns custom or catalog price
  getCustomCost:  (productId: string) => number

  // Clients
  addClient:      (c: Omit<Client, 'id' | 'createdAt'>) => Client
  updateClient:   (id: string, updates: Partial<Client>) => void
  deleteClient:   (id: string) => void
  getClientSales: (clientId: string) => Sale[]

  // Sales
  addSale:          (sale: Omit<Sale, 'id' | 'createdAt'>) => void
  updateSale:       (id: string, updates: Partial<Sale>) => void
  deleteSale:       (id: string) => void
  getSalesThisWeek: () => Sale[]
  getAllSales:       () => Sale[]

  // Expenses
  addExpense:    (exp: Omit<Expense, 'id' | 'createdAt'>) => void
  deleteExpense: (id: string) => void

  // Payables
  addPayable:    (p: Omit<Payable,   'id' | 'createdAt'>) => void
  updatePayable: (id: string, updates: Partial<Payable>)  => void
  deletePayable: (id: string) => void
  payPayable:    (id: string, amount: number, accountId?: string) => void

  // Receivables
  addReceivable:     (r: Omit<Receivable, 'id' | 'createdAt'>) => void
  updateReceivable:  (id: string, updates: Partial<Receivable>) => void
  deleteReceivable:  (id: string) => void
  collectReceivable: (id: string, amount: number, accountId?: string) => void

  // Accounts
  addAccount:               (a: Omit<Account, 'id'>) => void
  updateAccount:            (id: string, updates: Partial<Account>) => void
  deleteAccount:            (id: string) => void
  creditAccount:            (accountId: string, amount: number, desc?: string, refType?: AccountTransaction['refType'], refId?: string) => void
  debitAccount:             (accountId: string, amount: number, desc?: string, refType?: AccountTransaction['refType'], refId?: string) => void
  transferBetweenAccounts:  (t: Omit<AccountTransfer, 'id' | 'createdAt'>) => void
  getAccountTransactions:   (accountId: string) => AccountTransaction[]

  // COGS
  getWeekCOGS: () => number   // costo total de la mercancía vendida esta semana

  // Week Close
  createWeekClose:  () => WeekClose
  confirmWeekClose: (id: string) => void
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const daysBack = day >= 5 ? day - 5 : day + 2
  const friday = new Date(d)
  friday.setDate(d.getDate() - daysBack)
  friday.setHours(0, 0, 0, 0)
  return friday.toISOString()
}

// Helper: native amount from a sale given account currency
function saleNativeAmount(priceUSD: number, priceBs: number, qty: number, currency: string) {
  if (currency === 'Bs') return priceBs * qty
  return priceUSD * qty
}

export const useAppStore = create<AppStore>((set, get) => {
  const initial = loadState()

  function persist(updater: (s: AppState) => Partial<AppState>) {
    set((state) => {
      const updates = updater(state)
      const next = { ...state, ...updates }
      saveState(next)
      return updates
    })
  }

  function addTx(
    accountId: string,
    type: 'credit' | 'debit',
    amount: number,
    description: string,
    refType?: AccountTransaction['refType'],
    refId?: string,
  ): AccountTransaction {
    return {
      id: uid(), accountId, type, amount,
      description, refType, refId,
      createdAt: new Date().toISOString(),
    }
  }

  return {
    ...initial,

    setBinanceRate: (rate) =>
      persist(() => ({ binanceRate: rate, lastRateUpdate: new Date().toISOString() })),

    // ── INVENTORY ────────────────────────────────
    setInventory: (productId, flavorId, qty) =>
      persist((s) => ({
        inventory: [
          ...s.inventory.filter(i => i.flavorId !== flavorId),
          { productId, flavorId, quantity: qty },
        ],
      })),

    adjustInventory: (productId, flavorId, delta) =>
      persist((s) => {
        const existing = s.inventory.find(i => i.flavorId === flavorId)
        const newQty = Math.max(0, (existing?.quantity ?? 0) + delta)
        return {
          inventory: [
            ...s.inventory.filter(i => i.flavorId !== flavorId),
            { productId, flavorId, quantity: newQty },
          ],
        }
      }),

    getStock: (flavorId) =>
      get().inventory.find(i => i.flavorId === flavorId)?.quantity ?? 0,

    getInventoryValue: () => {
      const s = get()
      let total = 0
      for (const item of s.inventory) {
        const product = CATALOG.find(p => p.id === item.productId)
        if (!product) continue
        const price = s.customPrices.find(cp => cp.id === item.productId)?.price ?? product.priceUSD
        total += price * item.quantity
      }
      return total
    },

    // ── CUSTOM NAMES ─────────────────────────────
    setCustomName: (id, name) =>
      persist(s => ({
        customNames: [
          ...s.customNames.filter(c => c.id !== id),
          { id, name },
        ],
      })),

    getCustomName: (id, fallback) =>
      get().customNames.find(c => c.id === id)?.name ?? fallback,

    // ── CUSTOM PRICES ─────────────────────────────
    setCustomPrice: (productId, price, cost) =>
      persist(s => ({
        customPrices: [
          ...s.customPrices.filter(cp => cp.id !== productId),
          { id: productId, price, cost },
        ],
      })),

    getCustomPrice: (productId) => {
      const custom = get().customPrices.find(cp => cp.id === productId)
      if (custom) return custom.price
      return CATALOG.find(p => p.id === productId)?.priceUSD ?? 0
    },

    getCustomCost: (productId) =>
      get().customPrices.find(cp => cp.id === productId)?.cost ?? 0,

    // ── CLIENTS ──────────────────────────────────
    addClient: (c) => {
      const newClient: Client = { ...c, id: uid(), createdAt: new Date().toISOString() }
      set(state => {
        const next = { ...state, clients: [newClient, ...state.clients] }
        saveState(next)
        return { clients: next.clients }
      })
      return newClient
    },

    updateClient: (id, updates) =>
      persist(s => ({
        clients: s.clients.map(c => c.id === id ? { ...c, ...updates } : c),
      })),

    deleteClient: (id) =>
      persist(s => ({ clients: s.clients.filter(c => c.id !== id) })),

    getClientSales: (clientId) =>
      get().sales.filter(s => s.clientId === clientId),

    // ── SALES ────────────────────────────────────
    addSale: (sale) =>
      persist((s) => {
        const newSale: Sale = { ...sale, id: uid(), createdAt: new Date().toISOString() }

        // Deduct inventory
        const inv = s.inventory.map(i =>
          i.flavorId === sale.flavorId
            ? { ...i, quantity: Math.max(0, i.quantity - sale.quantity) }
            : i
        )

        // Credit account + add transaction
        let accounts = s.accounts
        let accountTransactions = [...s.accountTransactions]
        if (sale.accountId && sale.paymentMethod !== 'pending') {
          const acct = s.accounts.find(a => a.id === sale.accountId)
          if (acct) {
            const native = saleNativeAmount(sale.priceUSD, sale.priceBs, sale.quantity, acct.currency)
            accounts = s.accounts.map(a =>
              a.id === sale.accountId ? { ...a, balance: a.balance + native } : a
            )
            const flavorName = s.customNames.find(n => n.id === sale.flavorId)?.name
              ?? CATALOG.flatMap(p => p.flavors).find(f => f.id === sale.flavorId)?.name
              ?? sale.flavorId
            accountTransactions.push(addTx(
              sale.accountId, 'credit', native,
              `Venta: ${flavorName} ×${sale.quantity}`,
              'sale', newSale.id,
            ))
          }
        }

        // Update client
        let clients = s.clients
        if (sale.clientId) {
          clients = s.clients.map(c =>
            c.id === sale.clientId ? { ...c, lastPurchaseAt: new Date().toISOString() } : c
          )
        }

        return { sales: [newSale, ...s.sales], inventory: inv, accounts, accountTransactions, clients }
      }),

    updateSale: (id, updates) =>
      persist(s => ({
        sales: s.sales.map(sale => sale.id === id ? { ...sale, ...updates } : sale),
      })),

    deleteSale: (id) =>
      persist(s => {
        const sale = s.sales.find(s2 => s2.id === id)
        if (!sale) return { sales: s.sales.filter(s2 => s2.id !== id) }

        // Restore inventory
        const inv = s.inventory.map(i =>
          i.flavorId === sale.flavorId
            ? { ...i, quantity: i.quantity + sale.quantity }
            : i
        )

        // Debit account
        let accounts = s.accounts
        let accountTransactions = s.accountTransactions
        if (sale.accountId) {
          const acct = s.accounts.find(a => a.id === sale.accountId)
          if (acct) {
            const native = saleNativeAmount(sale.priceUSD, sale.priceBs, sale.quantity, acct.currency)
            accounts = s.accounts.map(a =>
              a.id === sale.accountId ? { ...a, balance: Math.max(0, a.balance - native) } : a
            )
            const flavorName = CATALOG.flatMap(p => p.flavors).find(f => f.id === sale.flavorId)?.name ?? sale.flavorId
            accountTransactions = [
              ...s.accountTransactions,
              addTx(sale.accountId, 'debit', native, `Venta eliminada: ${flavorName}`, 'sale', sale.id),
            ]
          }
        }

        return { sales: s.sales.filter(s2 => s2.id !== id), inventory: inv, accounts, accountTransactions }
      }),

    getSalesThisWeek: () => {
      const weekStart = getWeekStart()
      return get().sales.filter(s => s.createdAt >= weekStart && !s.weekCloseId)
    },

    getAllSales: () => get().sales,

    // ── EXPENSES ─────────────────────────────────
    addExpense: (exp) =>
      persist(s => {
        let accounts = s.accounts
        let accountTransactions = [...s.accountTransactions]
        const expId = uid()
        if (exp.accountId) {
          const acct = s.accounts.find(a => a.id === exp.accountId)
          if (acct) {
            const amount = acct.currency === 'Bs' ? exp.amountBs || exp.amountUSD : exp.amountUSD
            accounts = s.accounts.map(a =>
              a.id === exp.accountId ? { ...a, balance: Math.max(0, a.balance - amount) } : a
            )
            accountTransactions.push(addTx(exp.accountId, 'debit', amount, `Gasto: ${exp.description}`, 'expense', expId))
          }
        }
        return {
          expenses: [{ ...exp, id: expId, createdAt: new Date().toISOString() }, ...s.expenses],
          accounts,
          accountTransactions,
        }
      }),

    deleteExpense: (id) =>
      persist(s => ({ expenses: s.expenses.filter(e => e.id !== id) })),

    // ── PAYABLES ─────────────────────────────────
    addPayable: (p) =>
      persist(s => ({
        payables: [{ ...p, id: uid(), createdAt: new Date().toISOString() }, ...s.payables],
      })),

    updatePayable: (id, updates) =>
      persist(s => ({
        payables: s.payables.map(p => p.id === id ? { ...p, ...updates } : p),
      })),

    deletePayable: (id) =>
      persist(s => ({ payables: s.payables.filter(p => p.id !== id) })),

    payPayable: (id, amount, accountId) =>
      persist(s => {
        const payable = s.payables.find(p => p.id === id)
        if (!payable) return {}
        const newPaid  = payable.paidAmount + amount
        const status   = newPaid >= payable.amountUSD ? 'paid' : 'partial'
        let accounts   = s.accounts
        let accountTransactions = [...s.accountTransactions]
        if (accountId) {
          accounts = s.accounts.map(a =>
            a.id === accountId ? { ...a, balance: Math.max(0, a.balance - amount) } : a
          )
          accountTransactions.push(addTx(accountId, 'debit', amount, `Pago deuda: ${payable.supplierName}`, 'payable', id))
        }
        return {
          payables: s.payables.map(p => p.id === id ? { ...p, paidAmount: newPaid, status, accountId } : p),
          accounts, accountTransactions,
        }
      }),

    // ── RECEIVABLES ──────────────────────────────
    addReceivable: (r) =>
      persist(s => ({
        receivables: [{ ...r, id: uid(), createdAt: new Date().toISOString() }, ...s.receivables],
      })),

    updateReceivable: (id, updates) =>
      persist(s => ({
        receivables: s.receivables.map(r => r.id === id ? { ...r, ...updates } : r),
      })),

    deleteReceivable: (id) =>
      persist(s => ({ receivables: s.receivables.filter(r => r.id !== id) })),

    collectReceivable: (id, amount, accountId) =>
      persist(s => {
        const rec    = s.receivables.find(r => r.id === id)
        if (!rec) return {}
        const newCollected = rec.paidAmount + amount
        const status       = newCollected >= rec.amountUSD ? 'paid' : 'partial'
        let accounts       = s.accounts
        let accountTransactions = [...s.accountTransactions]
        if (accountId) {
          accounts = s.accounts.map(a =>
            a.id === accountId ? { ...a, balance: a.balance + amount } : a
          )
          accountTransactions.push(addTx(accountId, 'credit', amount, `Cobro: ${rec.clientName}`, 'receivable', id))
        }
        return {
          receivables: s.receivables.map(r => r.id === id ? { ...r, paidAmount: newCollected, status, accountId } : r),
          accounts, accountTransactions,
        }
      }),

    // ── ACCOUNTS ─────────────────────────────────
    addAccount: (a) =>
      persist(s => ({ accounts: [...s.accounts, { ...a, id: uid() }] })),

    updateAccount: (id, updates) =>
      persist(s => ({
        accounts: s.accounts.map(a => a.id === id ? { ...a, ...updates } : a),
      })),

    deleteAccount: (id) =>
      persist(s => ({ accounts: s.accounts.filter(a => a.id !== id) })),

    creditAccount: (accountId, amount, desc = 'Ajuste manual', refType = 'manual', refId) =>
      persist(s => {
        const tx = addTx(accountId, 'credit', amount, desc, refType, refId)
        return {
          accounts: s.accounts.map(a =>
            a.id === accountId ? { ...a, balance: a.balance + amount } : a
          ),
          accountTransactions: [...s.accountTransactions, tx],
        }
      }),

    debitAccount: (accountId, amount, desc = 'Ajuste manual', refType = 'manual', refId) =>
      persist(s => {
        const tx = addTx(accountId, 'debit', amount, desc, refType, refId)
        return {
          accounts: s.accounts.map(a =>
            a.id === accountId ? { ...a, balance: Math.max(0, a.balance - amount) } : a
          ),
          accountTransactions: [...s.accountTransactions, tx],
        }
      }),

    getAccountTransactions: (accountId) =>
      get().accountTransactions
        .filter(t => t.accountId === accountId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 50),

    transferBetweenAccounts: (t) =>
      persist(s => {
        const transfer: AccountTransfer = { ...t, id: uid(), createdAt: new Date().toISOString() }
        const fromAcct = s.accounts.find(a => a.id === t.fromAccountId)
        const toAcct   = s.accounts.find(a => a.id === t.toAccountId)
        const accounts = s.accounts.map(a => {
          if (a.id === t.fromAccountId) return { ...a, balance: Math.max(0, a.balance - t.fromAmount) }
          if (a.id === t.toAccountId)   return { ...a, balance: a.balance + t.toAmount }
          return a
        })
        const txFrom = addTx(t.fromAccountId, 'debit',  t.fromAmount, `Transferencia → ${toAcct?.name ?? '?'}`, 'transfer', transfer.id)
        const txTo   = addTx(t.toAccountId,   'credit', t.toAmount,   `Transferencia ← ${fromAcct?.name ?? '?'}`, 'transfer', transfer.id)
        return {
          accounts,
          transfers: [transfer, ...s.transfers],
          accountTransactions: [...s.accountTransactions, txFrom, txTo],
        }
      }),

    // ── COGS ─────────────────────────────────────
    getWeekCOGS: () => {
      const s = get()
      const weekStart = getWeekStart()
      const openSales = s.sales.filter(sale => sale.createdAt >= weekStart && !sale.weekCloseId)
      let totalCost = 0
      for (const sale of openSales) {
        const cost = s.customPrices.find(cp => cp.id === sale.productId)?.cost ?? 0
        totalCost += cost * sale.quantity
      }
      return totalCost
    },

    // ── WEEK CLOSE ───────────────────────────────
    createWeekClose: () => {
      const s = get()
      const openSales    = s.getSalesThisWeek()
      const openExpenses = s.expenses.filter(e => !e.weekCloseId)
      const totalSalesUSD    = openSales.reduce((sum, sale) => sum + sale.priceUSD * sale.quantity, 0)
      const totalExpensesUSD = openExpenses.reduce((sum, e) => sum + e.amountUSD, 0)
      const salesByProduct: Record<string, number> = {}
      for (const sale of openSales) {
        salesByProduct[sale.productId] = (salesByProduct[sale.productId] ?? 0) + sale.quantity
      }
      const close: WeekClose = {
        id: uid(), weekStart: getWeekStart(), weekEnd: new Date().toISOString(),
        totalSalesUSD, totalExpensesUSD, netProfitUSD: totalSalesUSD - totalExpensesUSD,
        rateBinance: s.binanceRate, status: 'draft',
        createdAt: new Date().toISOString(), salesByProduct,
      }
      set(state => {
        const next = { ...state, weekCloses: [close, ...state.weekCloses] }
        saveState(next)
        return { weekCloses: next.weekCloses }
      })
      return close
    },

    confirmWeekClose: (id) =>
      persist(s => {
        const close = s.weekCloses.find(c => c.id === id)
        if (!close) return {}
        return {
          sales: s.sales.map(sale =>
            !sale.weekCloseId && sale.createdAt >= close.weekStart
              ? { ...sale, weekCloseId: id } : sale
          ),
          expenses: s.expenses.map(e => !e.weekCloseId ? { ...e, weekCloseId: id } : e),
          weekCloses: s.weekCloses.map(c => c.id === id ? { ...c, status: 'confirmed' as const } : c),
        }
      }),
  }
})
