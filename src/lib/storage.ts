import type { AppState } from '../types'

const KEY = 'hqd_manager_v3'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const defaults = defaultState()
      return {
        ...defaults,
        ...parsed,
        accountTransactions: parsed.accountTransactions ?? [],
        transfers:           parsed.transfers           ?? [],
        clients:             parsed.clients             ?? [],
        customNames:         parsed.customNames         ?? [],
        customPrices:        parsed.customPrices        ?? [],
        accounts:            parsed.accounts            ?? defaults.accounts,
      }
    }
    // Migrate from v2
    const v2 = localStorage.getItem('hqd_manager_v2')
    if (v2) {
      const old = JSON.parse(v2)
      return { ...defaultState(), ...old, accountTransactions: [], customPrices: [] }
    }
    // Migrate from v1
    const v1 = localStorage.getItem('hqd_manager_v1')
    if (v1) {
      const old = JSON.parse(v1)
      return { ...defaultState(), ...old, accountTransactions: [], customPrices: [], clients: [], transfers: [], customNames: [] }
    }
  } catch {}
  return defaultState()
}

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

function defaultState(): AppState {
  return {
    accounts: [
      { id: 'acc_1', name: 'Efectivo USD', emoji: '💵', currency: 'USD',  balance: 0, type: 'cash'   },
      { id: 'acc_2', name: 'Efectivo Bs',  emoji: '💴', currency: 'Bs',   balance: 0, type: 'cash'   },
      { id: 'acc_3', name: 'Zelle',        emoji: '💸', currency: 'USD',  balance: 0, type: 'bank'   },
      { id: 'acc_4', name: 'Binance USDT', emoji: '🔷', currency: 'USDT', balance: 0, type: 'crypto' },
    ],
    accountTransactions: [],
    transfers:    [],
    clients:      [],
    customNames:  [],
    customPrices: [],
    inventory:    [],
    sales:        [],
    expenses:     [],
    payables:     [],
    receivables:  [],
    weekCloses:   [],
    binanceRate:  0,
    lastRateUpdate: '',
  }
}
