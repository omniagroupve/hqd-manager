export interface Account {
  id: string
  name: string
  emoji: string
  currency: 'USD' | 'Bs' | 'USDT'
  balance: number
  type: 'bank' | 'cash' | 'crypto'
}

export interface AccountTransaction {
  id: string
  accountId: string
  type: 'credit' | 'debit'
  amount: number           // siempre positivo
  description: string      // ej: "Venta Lush Ice x2", "Gasto: Insumos"
  refType?: 'sale' | 'expense' | 'transfer' | 'payable' | 'receivable' | 'manual'
  refId?: string
  createdAt: string
}

export interface AccountTransfer {
  id: string
  fromAccountId: string
  toAccountId: string
  fromAmount: number
  toAmount: number
  note?: string
  createdAt: string
}

export interface InventoryItem {
  flavorId: string
  productId: string
  quantity: number
}

export interface CustomName {
  id: string
  name: string
}

export interface CustomPrice {
  id: string        // productId
  price: number     // precio de venta por unidad
  cost?: number     // costo de compra (para margen)
}

export type ClientTag = 'vip' | 'mayorista' | 'detal' | 'frecuente' | 'nuevo' | 'deudor'

export interface Client {
  id: string
  name: string
  phone?: string
  instagram?: string
  zone?: string
  tags: ClientTag[]
  emoji: string
  notes?: string
  createdAt: string
  lastPurchaseAt?: string
}

export type PaymentMethod = 'cash_usd' | 'zelle' | 'usdt' | 'cash_bs' | 'transfer' | 'pending'

export interface Sale {
  id: string
  productId: string
  flavorId: string
  quantity: number
  priceUSD: number
  priceBs: number
  rateBinance: number
  saleType: 'retail' | 'wholesale'
  paymentMethod: PaymentMethod
  accountId?: string
  clientId?: string
  note?: string
  createdAt: string
  weekCloseId?: string
}

export interface Expense {
  id: string
  description: string
  amountUSD: number
  amountBs: number
  category: string
  accountId?: string
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
  accountId?: string
  reminderDays: number
  createdAt: string
}

export interface Receivable {
  id: string
  clientName: string
  clientId?: string
  description: string
  amountUSD: number
  dueDate: string
  status: 'pending' | 'partial' | 'paid'
  paidAmount: number
  accountId?: string
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
  accountTransactions: AccountTransaction[]
  transfers: AccountTransfer[]
  clients: Client[]
  inventory: InventoryItem[]
  customNames: CustomName[]
  customPrices: CustomPrice[]
  sales: Sale[]
  expenses: Expense[]
  payables: Payable[]
  receivables: Receivable[]
  weekCloses: WeekClose[]
  binanceRate: number
  lastRateUpdate: string
}
