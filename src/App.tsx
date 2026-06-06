import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { isSetup, isSessionActive, refreshSession } from './lib/auth'
import SetupPin from './components/auth/SetupPin'
import LoginScreen from './components/auth/LoginScreen'
import Dashboard from './components/dashboard/Dashboard'
import Inventory from './components/inventory/Inventory'
import SaleFlow from './components/sales/SaleFlow'
import MoneyScreen from './components/accounts/MoneyScreen'
import ClosingScreen from './components/closing/ClosingScreen'
import ClientsScreen from './components/clients/ClientsScreen'
import BottomNav from './components/layout/BottomNav'
import Header from './components/layout/Header'

const TAB_TITLES: Record<string, string> = {
  dashboard: '💨 HQD Manager',
  inventory: '📦 Inventario',
  sales:     '💰 Registrar Venta',
  clients:   '👥 Cartera de Clientes',
  money:     '💳 Mi Plata',
  closing:   '📊 Cierre Semanal',
}

export default function App() {
  const [authState, setAuthState] = useState<'loading' | 'setup' | 'login' | 'app'>('loading')
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    if (!isSetup()) { setAuthState('setup'); return }
    if (isSessionActive()) { setAuthState('app'); return }
    setAuthState('login')
  }, [])

  useEffect(() => {
    if (authState !== 'app') return
    const handler = () => refreshSession()
    window.addEventListener('touchstart', handler)
    window.addEventListener('click', handler)
    return () => {
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('click', handler)
    }
  }, [authState])

  if (authState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app">
        <div className="text-4xl animate-pulse">💨</div>
      </div>
    )
  }

  if (authState === 'setup') return <SetupPin onDone={() => setAuthState('app')} />
  if (authState === 'login') return <LoginScreen onSuccess={() => setAuthState('app')} />

  return (
    <div className="bg-app min-h-screen max-w-lg mx-auto">
      <Header title={TAB_TITLES[tab]} onLogout={() => setAuthState('login')} />
      <main>
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'inventory' && <Inventory />}
        {tab === 'sales'    && <SaleFlow />}
        {tab === 'clients'  && <ClientsScreen />}
        {tab === 'money'    && <MoneyScreen />}
        {tab === 'closing' && <ClosingScreen />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(168,85,247,0.3)' },
        }}
      />
    </div>
  )
}
