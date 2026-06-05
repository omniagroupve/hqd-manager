export interface Account {
  id: string
  name: string
  emoji: string
  currency: 'USD' | 'Bs' | 'USDT'
  balance: number
  type: 'bank' | 'cash' | 'crypto'
}

export interface InventoryItem {
  flavorId: string
  productId: string
  quantity: number
}

export interface Sale {
  id: string
  productId: string
  flavorId: string
  quantity: number
  priceUSD: number
  priceBs: number
  rateBinance: number
  saleType: 'retail' | 'wholesale'
  createdAt: string
  weekCloseId?: string
}

export interface Expense {
  id: string
  description: string
  amountUSD: number
  amountBs: number
  category: string
  createdAt: string
  weekCloseId?: string
}

export interface Payable {
  id: string
  supplierName: string
  description: string
  amountUSD: number
  dueDate: string
  status: 'pending' | 'partial' | 'paid'
  paidAmount: number
  createdAt: string
}

export interface Receivable {
  id: string
  clientName: string
  description: string
  amountUSD: number
  dueDate: string
  status: 'pending' | 'partial' | 'paid'
  paidAmount: number
  createdAt: string
}

export interface WeekClose {
  id: string
  weekStart: string
  weekEnd: string
  totalSalesUSD: number
  totalExpensesUSD: number
  netProfitUSD: number
  rateBinance: number
  status: 'draft' | 'confirmed'
  createdAt: string
  salesByProduct: Record<string, number>
}

export interface AppState {
  accounts: Account[]
  inventory: InventoryItem[]
  sales: Sale[]
  expenses: Expense[]
  payables: Payable[]
  receivables: Receivable[]
  weekCloses: WeekClose[]
  binanceRate: number
  lastRateUpdate: string
}
