export interface Flavor {
  id: string
  name: string
  emoji: string
}

export interface Product {
  id: string
  name: string
  emoji: string
  priceUSD: number
  color: string
  flavors: Flavor[]
}

export const CATALOG: Product[] = [
  {
    id: 'glaze-12k',
    name: 'HQD Glaze 12K',
    emoji: '💨',
    priceUSD: 30,
    color: '#7c3aed',
    flavors: [
      { id: 'g12-lush', name: 'Lush Ice', emoji: '🧊' },
      { id: 'g12-peach', name: 'Peach Ice', emoji: '🍑' },
      { id: 'g12-bluerazz', name: 'Blue Razz Ice', emoji: '💙' },
      { id: 'g12-blueberry', name: 'Blueberry', emoji: '🫐' },
      { id: 'g12-blackice', name: 'Black Ice', emoji: '⚫' },
      { id: 'g12-strawwm', name: 'Strawberry Watermelon', emoji: '🍓' },
      { id: 'g12-strawkiwi', name: 'Strawberry Kiwi', emoji: '🥝' },
      { id: 'g12-icemint', name: 'Ice Mint', emoji: '🌿' },
      { id: 'g12-dragon', name: 'Black Dragon', emoji: '🐉' },
      { id: 'g12-grapey', name: 'Grapey', emoji: '🍇' },
    ],
  },
  {
    id: 'glaze-15k',
    name: 'Glaze 15K',
    emoji: '💫',
    priceUSD: 30,
    color: '#2563eb',
    flavors: [
      { id: 'g15-dragon', name: 'Black Dragon', emoji: '🐉' },
      { id: 'g15-lush', name: 'Lush Ice', emoji: '🧊' },
      { id: 'g15-icemint', name: 'Ice Mint', emoji: '🌿' },
      { id: 'g15-blackice', name: 'Black Ice', emoji: '⚫' },
      { id: 'g15-purple', name: 'Purple Haze', emoji: '💜' },
      { id: 'g15-juicio', name: 'Juicio', emoji: '⚖️' },
      { id: 'g15-peach', name: 'Peach Ice', emoji: '🍑' },
      { id: 'g15-kiwi', name: 'Kiwi', emoji: '🥝' },
      { id: 'g15-watermelon', name: 'Watermelon', emoji: '🍉' },
      { id: 'g15-bluegrape', name: 'Blue Raspberry Grape', emoji: '🍇' },
      { id: 'g15-bluerazz', name: 'Blue Razz Ice', emoji: '💙' },
      { id: 'g15-menthol', name: 'Menthol', emoji: '🌬️' },
    ],
  },
  {
    id: 'everest-25k',
    name: 'Everest 25K',
    emoji: '🏔️',
    priceUSD: 35,
    color: '#0891b2',
    flavors: [
      { id: 'ev-purple', name: 'Purple Haze', emoji: '💜' },
      { id: 'ev-juicio', name: 'Juicio', emoji: '⚖️' },
      { id: 'ev-peach', name: 'Peach Ice', emoji: '🍑' },
      { id: 'ev-kiwi', name: 'Kiwi', emoji: '🥝' },
      { id: 'ev-watermelon', name: 'Watermelon', emoji: '🍉' },
      { id: 'ev-blackice', name: 'Black Ice', emoji: '⚫' },
      { id: 'ev-bluegrape', name: 'Blue Raspberry Grape', emoji: '🍇' },
      { id: 'ev-bluerazz', name: 'Blue Razz Ice', emoji: '💙' },
      { id: 'ev-menthol', name: 'Menthol', emoji: '🌬️' },
    ],
  },
  {
    id: 'air-4k',
    name: 'Air 4,000',
    emoji: '🌬️',
    priceUSD: 20,
    color: '#059669',
    flavors: [
      { id: 'air-lush', name: 'Lush Ice', emoji: '🧊' },
      { id: 'air-grape', name: 'Grape', emoji: '🍇' },
      { id: 'air-strawwm', name: 'Strawberry Watermelon', emoji: '🍓' },
      { id: 'air-skymint', name: 'Sky Mint', emoji: '🌤️' },
      { id: 'air-blackice', name: 'Black Ice', emoji: '⚫' },
      { id: 'air-strawmango', name: 'Strawberry Mango', emoji: '🥭' },
      { id: 'air-bluelemn', name: 'Blueberry Lemonade', emoji: '🍋' },
      { id: 'air-bluerazz', name: 'Blue Razz', emoji: '💙' },
      { id: 'air-peach', name: 'Peach Ice', emoji: '🍑' },
      { id: 'air-russian', name: 'Russian Cream', emoji: '☕' },
      { id: 'air-pineapple', name: 'Pineapple Ice', emoji: '🍍' },
    ],
  },
  {
    id: 'bar-7k',
    name: 'Bar 7000',
    emoji: '🟦',
    priceUSD: 25,
    color: '#d97706',
    flavors: [
      { id: 'bar-icemint', name: 'Ice Mint', emoji: '🌿' },
      { id: 'bar-strawkiwi', name: 'Strawberry Kiwi', emoji: '🥝' },
      { id: 'bar-grapey', name: 'Grapey', emoji: '🍇' },
      { id: 'bar-bluebrazz', name: 'Blueberry Raspberry', emoji: '🫐' },
      { id: 'bar-lime', name: 'Lime Passion Fruit', emoji: '🍋' },
      { id: 'bar-lush', name: 'Lush Ice', emoji: '🧊' },
      { id: 'bar-blackice', name: 'Black Ice', emoji: '⚫' },
    ],
  },
  {
    id: 'go-35k',
    name: 'Go HQD 35K',
    emoji: '🚀',
    priceUSD: 35,
    color: '#dc2626',
    flavors: [
      { id: 'go-blackice', name: 'Black Ice', emoji: '⚫' },
      { id: 'go-menthol', name: 'Menthol', emoji: '🌬️' },
      { id: 'go-mentholgod', name: 'Menthol God', emoji: '🌬️✨' },
      { id: 'go-freshaf', name: 'Fresh AF', emoji: '🌊' },
      { id: 'go-miami', name: 'Miami Breeze', emoji: '🌴' },
    ],
  },
  {
    id: 'cali-20k',
    name: 'Cali 20,000',
    emoji: '🌅',
    priceUSD: 30,
    color: '#ea580c',
    flavors: [
      { id: 'cali-coconut', name: 'Coconut Banana', emoji: '🥥' },
      { id: 'cali-frozenwm', name: 'Frozen Watermelon', emoji: '❄️🍉' },
      { id: 'cali-mightymint', name: 'Mighty Mint', emoji: '💪🌿' },
      { id: 'cali-wmsplash', name: 'Watermelon Splash', emoji: '🍉💦' },
      { id: 'cali-applewm', name: 'Apple Watermelon', emoji: '🍎🍉' },
      { id: 'cali-frozenbanana', name: 'Frozen Banana', emoji: '🍌❄️' },
      { id: 'cali-frozenbb', name: 'Frozen Blackberry', emoji: '🫐❄️' },
      { id: 'cali-frozenblue', name: 'Frozen Blue Raspberry', emoji: '💙❄️' },
      { id: 'cali-strawbanana', name: 'Strawberry Banana', emoji: '🍓🍌' },
      { id: 'cali-polar', name: 'Polar Ice', emoji: '🧊' },
    ],
  },
  {
    id: 'cali-black',
    name: 'Cali 20K Black Series',
    emoji: '🖤',
    priceUSD: 32,
    color: '#6366f1',
    flavors: [
      { id: 'cb-bluewm', name: 'Blueberry Watermelon', emoji: '🫐🍉' },
      { id: 'cb-whitegrape', name: 'White Grape', emoji: '🍇🤍' },
      { id: 'cb-baja', name: 'Baja Blast', emoji: '💥' },
      { id: 'cb-blueblast', name: 'Blue Blast', emoji: '💙💥' },
      { id: 'cb-bluemint', name: 'Blue Mint', emoji: '💙🌿' },
      { id: 'cb-strawmango', name: 'Strawberry Mango', emoji: '🍓🥭' },
      { id: 'cb-sourfab', name: 'Sour F*cking Fab', emoji: '😤' },
      { id: 'cb-crazymelon', name: 'Crazy Melon', emoji: '🍈' },
      { id: 'cb-sourapple', name: 'Sour Apple', emoji: '🍏' },
    ],
  },
]
