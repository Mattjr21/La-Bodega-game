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
    look: [-16.5, 1.2, -8.5],
    cam: [-8, 14, 2],
    problem:
      'Products hit shelves before the POS knows them. Trucks unload and staff shelf immediately — many items have no usable UPC identity yet.',
    solution:
      'Physical-sample gate before shelf: collect one sample per active product, scan at a real POS + Datalogic config, then only shelf after identity is confirmed.',
    metric: 'Receiving and checkout were one messy loop → sample + scan first',
  },
  {
    id: 'register',
    step: 2,
    name: 'POS Terminals',
    icon: '🖥️',
    color: '#3B82F6',
    colorHex: 0x3b82f6,
    look: [14.8, 1.4, 11.0],
    cam: [6, 12, 22],
    problem:
      'Barcode format mismatch across four shared terminals. Datalogic often outputs EAN-13 while Odoo catalog rows expect UPC-A — same products fail everywhere.',
    solution:
      'Normalize barcode, cost, and price — then import. Team 2 normalizes failing UPC records, case→unit cost, and market price checks, then batch-imports to Odoo. No POS replacement.',
    metric: 'Four Odoo terminals · one shared catalog path fixed',
  },
  {
    id: 'queue',
    step: 3,
    name: 'Checkout Floor',
    icon: '🛒',
    color: '#14B8A6',
    colorHex: 0x14b8a6,
    look: [14.8, 1.2, 14.0],
    cam: [28, 14, 28],
    problem:
      'Every unknown item becomes a manager call. Cashiers improvise with Misc charges and English-name search. At peak, billing / price lookup / packing split so selling can continue.',
    solution:
      'Keep selling while the correction queue runs. Containment roles (cashier, price matcher, POS editor) feed the same queue the aisle audit uses — customers stay in motion.',
    metric: '500+ transactions supported in the 72h window',
  },
  {
    id: 'aisles',
    step: 4,
    name: 'Stock & Aisles',
    icon: '🗂️',
    color: '#F59E0B',
    colorHex: 0xf59e0b,
    look: [-5.0, 1.5, 0],
    cam: [12, 16, 12],
    problem:
      'No one owns the failure end-to-end. Receiving, stocking, and cashiers all improvise. Name alone is unsafe — same family spans brands and sizes.',
    solution:
      'Three teams: detect · correct · verify. Team 1 collects samples, Team 2 corrects ~2,000 UPC records, Team 3 independently rescans — pass only if Odoo retrieves the physical product.',
    metric: 'Aisle-by-aisle audit · ~2,000 UPC records corrected',
  },
  {
    id: 'revenue',
    step: 5,
    name: 'Pricing & Revenue',
    icon: '📊',
    color: '#22C55E',
    colorHex: 0x22c55e,
    look: [18.0, 1.6, -2.5],
    cam: [32, 14, 8],
    problem:
      'Case costs as unit costs · Misc as a catch-all. Unrecognized SKUs and weak pricing data make margins hard to defend.',
    solution:
      'One onboarding gate for scan + cost + price: physical sample → POS scan → identity → EAN normalize → unit-cost normalize → market check → Odoo → independent verification → shelf.',
    metric: 'Unit-cost + market-price checks enter onboarding',
  },
]

export const METRICS = {
  transactions: {
    label: 'Transactions (72h)',
    before: 'Live chaos',
    after: '500+ supported',
  },
  upc: {
    label: 'UPC records',
    before: 'Failing rows',
    after: '~2,000 corrected',
  },
  scope: {
    label: 'Scope',
    before: 'Scattered fixes',
    after: '3,000+ UPC-A prioritized',
  },
  teams: {
    label: 'Teams',
    before: 'Everyone improvises',
    after: 'Detect · correct · verify',
  },
  stack: {
    label: 'Stack',
    before: 'Replace POS?',
    after: 'Odoo + Datalogic kept',
  },
}

export const CASE_STUDY_URL = 'https://danny-me-rho.vercel.app/projects/bodega-ops'
export const HOME_URL = 'https://danny-me-rho.vercel.app/'
