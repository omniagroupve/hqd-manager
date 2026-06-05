import { create } from 'zustand'
import { loadState, saveState } from '../lib/storage'
import type { AppState, Sale, Expense, Payable, Receivable, Account, WeekClose } from '../types'

interface AppStore extends AppState {
  // Rate
  setBinanceRate: (rate: number) => void

  // Inventory
  setInventory: (productId: string, flavorId: string, qty: number) => void
  adjustInventory: (productId: string, flavorId: string, delta: number) => void
  getStock: (flavorId: string) => number

  // Sales
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => void
  getSalesThisWeek: () => Sale[]

  // Expenses
  addExpense: (exp: Omit<Expense, 'id' | 'createdAt'>) => void

  // Payables
  addPayable: (p: Omit<Payable, 'id' | 'createdAt'>) => void
  updatePayable: (id: string, updates: Partial<Payable>) => void

  // Receivables
  addReceivable: (r: Omit<Receivable, 'id' | 'createdAt'>) => void
  updateReceivable: (id: string, updates: Partial<Receivable>) => void

  // Accounts
  addAccount: (a: Omit<Account, 'id'>) => void
  updateAccountBalance: (id: string, delta: number) => void

  // Week Close
  createWeekClose: () => WeekClose
  confirmWeekClose: (id: string) => void
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 5 ? 0 : day < 5 ? day + 2 : 7 - day + 5
  // Last Friday
  const friday = new Date(d)
  void diff
  friday.setDate(d.getDate() - (day === 5 ? 7 : (day + 2) % 7))
  friday.setHours(0, 0, 0, 0)
  return friday.toISOString()
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

  return {
    ...initial,

    setBinanceRate: (rate) => persist(() => ({ binanceRate: rate, lastRateUpdate: new Date().toISOString() })),

    setInventory: (productId, flavorId, qty) =>
      persist((s) => {
        const inv = s.inventory.filter((i) => i.flavorId !== flavorId)
        return { inventory: [...inv, { productId, flavorId, quantity: qty }] }
      }),

    adjustInventory: (productId, flavorId, delta) =>
      persist((s) => {
        const existing = s.inventory.find((i) => i.flavorId === flavorId)
        const newQty = Math.max(0, (existing?.quantity ?? 0) + delta)
        const inv = s.inventory.filter((i) => i.flavorId !== flavorId)
        return { inventory: [...inv, { productId, flavorId, quantity: newQty }] }
      }),

    getStock: (flavorId) => {
      return get().inventory.find((i) => i.flavorId === flavorId)?.quantity ?? 0
    },

    addSale: (sale) =>
      persist((s) => {
        const newSale: Sale = { ...sale, id: uid(), createdAt: new Date().toISOString() }
        // Auto-deduct inventory
        const inv = s.inventory.map((i) =>
          i.flavorId === sale.flavorId
            ? { ...i, quantity: Math.max(0, i.quantity - sale.quantity) }
            : i
        )
        return { sales: [newSale, ...s.sales], inventory: inv }
      }),

    getSalesThisWeek: () => {
      const weekStart = getWeekStart()
      return get().sales.filter((s) => s.createdAt >= weekStart && !s.weekCloseId)
    },

    addExpense: (exp) =>
      persist((s) => ({
        expenses: [{ ...exp, id: uid(), createdAt: new Date().toISOString() }, ...s.expenses],
      })),

    addPayable: (p) =>
      persist((s) => ({
        payables: [{ ...p, id: uid(), createdAt: new Date().toISOString() }, ...s.payables],
      })),

    updatePayable: (id, updates) =>
      persist((s) => ({
        payables: s.payables.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),

    addReceivable: (r) =>
      persist((s) => ({
        receivables: [{ ...r, id: uid(), createdAt: new Date().toISOString() }, ...s.receivables],
      })),

    updateReceivable: (id, updates) =>
      persist((s) => ({
        receivables: s.receivables.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      })),

    addAccount: (a) =>
      persist((s) => ({
        accounts: [...s.accounts, { ...a, id: uid() }],
      })),

    updateAccountBalance: (id, delta) =>
      persist((s) => ({
        accounts: s.accounts.map((a) =>
          a.id === id ? { ...a, balance: Math.max(0, a.balance + delta) } : a
        ),
      })),

    createWeekClose: () => {
      const s = get()
      const openSales = s.getSalesThisWeek()
      const openExpenses = s.expenses.filter((e) => !e.weekCloseId)
      const totalSalesUSD = openSales.reduce((sum, sale) => sum + sale.priceUSD * sale.quantity, 0)
      const totalExpensesUSD = openExpenses.reduce((sum, e) => sum + e.amountUSD, 0)
      const salesByProduct: Record<string, number> = {}
      for (const sale of openSales) {
        salesByProduct[sale.productId] = (salesByProduct[sale.productId] ?? 0) + sale.quantity
      }
      const close: WeekClose = {
        id: uid(),
        weekStart: getWeekStart(),
        weekEnd: new Date().toISOString(),
        totalSalesUSD,
        totalExpensesUSD,
        netProfitUSD: totalSalesUSD - totalExpensesUSD,
        rateBinance: s.binanceRate,
        status: 'draft',
        createdAt: new Date().toISOString(),
        salesByProduct,
      }
      set((state) => {
        const next = { ...state, weekCloses: [close, ...state.weekCloses] }
        saveState(next)
        return { weekCloses: next.weekCloses }
      })
      return close
    },

    confirmWeekClose: (id) =>
      persist((s) => {
        const close = s.weekCloses.find((c) => c.id === id)
        if (!close) return {}
        const sales = s.sales.map((sale) =>
          !sale.weekCloseId && sale.createdAt >= close.weekStart ? { ...sale, weekCloseId: id } : sale
        )
        const expenses = s.expenses.map((e) =>
          !e.weekCloseId ? { ...e, weekCloseId: id } : e
        )
        const weekCloses = s.weekCloses.map((c) =>
          c.id === id ? { ...c, status: 'confirmed' as const } : c
        )
        return { sales, expenses, weekCloses }
      }),
  }
})
