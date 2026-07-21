/** Zone copy aligned with the Checkout Ops case study (process claims, not invented %). */

export const OVERVIEW = {
  pos: [38, 32, 42],
  target: [0, 1.5, 0],
}

export const ZONES = [
  {
    id: 'delivery',
    step: 1,
    name: 'Delivery Dock',
    icon: '📦',
    color: '#FF6B2C',
    colorHex: 0xff6b2c,
    look: [-13.0, 1.4, -8.2],
    cam: [-6.5, 7.5, -2.8],
    problem:
      'Products hit shelves before the POS knows them. Trucks unload and staff shelf immediately — many items have no usable UPC identity yet.',
    shortProblem: 'Products reach shelves before the POS can identify or price them.',
    solution:
      'Physical-sample gate before shelf: collect one sample per active product, scan at a real POS + Datalogic config, then only shelf after identity is confirmed.',
    shortSolution: 'Scan one physical sample first. Shelf it only after POS identity is confirmed.',
    metric: 'Receiving and checkout were one messy loop → sample + scan first',
    challengeHint: 'Tap the untagged carton at the scan gate',
  },
  {
    id: 'register',
    step: 2,
    name: 'POS Terminals',
    icon: '🖥️',
    color: '#3B82F6',
    colorHex: 0x3b82f6,
    look: [14.15, 1.4, 10.3],
    cam: [10.0, 6.5, 16.8],
    problem:
      'Barcode format mismatch across four shared terminals. Datalogic often outputs EAN-13 while Odoo catalog rows expect UPC-A — same products fail everywhere.',
    shortProblem: 'EAN-13 scans do not match UPC-A records across four shared terminals.',
    solution:
      'Normalize barcode, cost, and price — then import. Team 2 normalizes failing UPC records, case→unit cost, and market price checks, then batch-imports to Odoo. No POS replacement.',
    shortSolution: 'Normalize UPC, unit cost, and price, then import once to the shared catalog.',
    metric: 'Four Odoo terminals · one shared catalog path fixed',
    challengeHint: 'Tap the red error terminal',
  },
  {
    id: 'queue',
    step: 3,
    name: 'Checkout Floor',
    icon: '🛒',
    color: '#14B8A6',
    colorHex: 0x14b8a6,
    look: [16.6, 1.4, 17.9],
    cam: [23.5, 7.5, 25.5],
    problem:
      'Every unknown item becomes a manager call. Cashiers improvise with Misc charges and English-name search. At peak, billing / price lookup / packing split so selling can continue.',
    shortProblem: 'Unknown items stop checkout and trigger repeated manager lookups.',
    solution:
      'Keep selling while the correction queue runs. Containment roles (cashier, price matcher, POS editor) feed the same queue the aisle audit uses — customers stay in motion.',
    shortSolution: 'Split checkout, price matching, and POS edits so the line keeps moving.',
    metric: '500+ transactions supported in the 72h window',
    challengeHint: 'Tap the Misc charge sign in the queue',
  },
  {
    id: 'aisles',
    step: 4,
    name: 'Stock & Aisles',
    icon: '🗂️',
    color: '#F59E0B',
    colorHex: 0xf59e0b,
    look: [3.2, 1.2, -0.3],
    cam: [10.5, 9, 8.5],
    problem:
      'No one owns the failure end-to-end. Receiving, stocking, and cashiers all improvise. Name alone is unsafe — same family spans brands and sizes.',
    shortProblem: 'Receiving, stocking, and checkout fix the same errors without clear ownership.',
    solution:
      'Three teams: detect · correct · verify. Team 1 collects samples, Team 2 corrects ~2,000 UPC records, Team 3 independently rescans — pass only if Odoo retrieves the physical product.',
    shortSolution: 'Use three teams to detect, correct, and independently verify every record.',
    metric: 'Aisle-by-aisle audit · ~2,000 UPC records corrected',
    challengeHint: 'Tap the unmarked carton on the audit pallet',
  },
  {
    id: 'revenue',
    step: 5,
    name: 'Pricing & Revenue',
    icon: '📊',
    color: '#22C55E',
    colorHex: 0x22c55e,
    look: [16.4, 1.3, -1.6],
    cam: [24, 6.8, 5.2],
    problem:
      'Case costs as unit costs · Misc as a catch-all. Unrecognized SKUs and weak pricing data make margins hard to defend.',
    shortProblem: 'Case costs and Misc charges hide unit economics and weaken pricing.',
    solution:
      'One onboarding gate for scan + cost + price: physical sample → POS scan → identity → EAN normalize → unit-cost normalize → market check → Odoo → independent verification → shelf.',
    shortSolution: 'Gate onboarding on identity, unit cost, market price, and final verification.',
    metric: 'Unit-cost + market-price checks enter onboarding',
    challengeHint: 'Tap the wrong case-cost price card',
  },
]

export const METRICS = {
  receiving: {
    label: 'Receiving path',
    before: 'Shelf first',
    after: 'Scan-first gate',
    unlockZone: 'delivery',
  },
  stack: {
    label: 'Stack',
    before: 'Replace POS?',
    after: 'Odoo + Datalogic kept',
    unlockZone: 'register',
  },
  transactions: {
    label: 'Transactions (72h)',
    before: 'Live chaos',
    after: '500+ supported',
    unlockZone: 'queue',
  },
  upc: {
    label: 'UPC records',
    before: 'Failing rows',
    after: '~2,000 corrected',
    unlockZone: 'aisles',
  },
  pricing: {
    label: 'Pricing gate',
    before: 'Case as unit · Misc',
    after: 'Unit + market checked',
    unlockZone: 'revenue',
  },
}

export const CASE_STUDY_URL = 'https://danny-me-rho.vercel.app/projects/bodega-ops'
export const HOME_URL = 'https://danny-me-rho.vercel.app/'
