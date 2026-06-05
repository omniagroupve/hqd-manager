import type { AppState } from '../types'

const KEY = 'hqd_manager_v1'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return defaultState()
}

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

function defaultState(): AppState {
  return {
    accounts: [
      { id: '1', name: 'Efectivo USD', emoji: '💵', currency: 'USD', balance: 0, type: 'cash' },
      { id: '2', name: 'Efectivo Bs', emoji: '💴', currency: 'Bs', balance: 0, type: 'cash' },
      { id: '3', name: 'Binance USDT', emoji: '🔷', currency: 'USDT', balance: 0, type: 'crypto' },
    ],
    inventory: [],
    sales: [],
    expenses: [],
    payables: [],
    receivables: [],
    weekCloses: [],
    binanceRate: 0,
    lastRateUpdate: '',
  }
}
