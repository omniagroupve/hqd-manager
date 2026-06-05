export async function fetchBinanceRate(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/ticker/price?symbol=USDTBS'
    )
    if (res.ok) {
      const d = await res.json()
      return parseFloat(d.price)
    }
  } catch {}
  // fallback: P2P endpoint (no CORS restriction on some mirrors)
  try {
    const res = await fetch(
      'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: 'USDT', fiat: 'VES', tradeType: 'SELL',
          page: 1, rows: 1, payTypes: [],
        }),
      }
    )
    if (res.ok) {
      const d = await res.json()
      const price = d?.data?.[0]?.adv?.price
      if (price) return parseFloat(price)
    }
  } catch {}
  return null
}
