import { DataRow } from '../types';

const REGIONS = ['North', 'South', 'East', 'West'];
const PRODUCTS = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Headset', 'Dock'];
const BASE_PRICE: Record<string, number> = { Laptop: 1200, Monitor: 300, Keyboard: 80, Mouse: 40, Headset: 120, Dock: 180 };
const CHANNELS = ['Online', 'Retail', 'Partner'];

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function generateSampleData(count = 240): DataRow[] {
  const random = seededRandom(42);
  const start = new Date('2025-01-01').getTime();
  return Array.from({ length: count }, (_, i) => {
    const product = PRODUCTS[Math.floor(random() * PRODUCTS.length)];
    const units = 1 + Math.floor(random() * 20);
    const discount = Math.round(random() * 25);
    const price = BASE_PRICE[product] * (1 + (random() - 0.5) * 0.2);
    const revenue = Math.round(units * price * (1 - discount / 100));
    return {
      'Order ID': `ORD-${String(1000 + i)}`,
      Date: new Date(start + Math.floor(random() * 365) * 86_400_000),
      Region: REGIONS[Math.floor(random() * REGIONS.length)],
      Product: product,
      Channel: random() < 0.05 ? null : CHANNELS[Math.floor(random() * CHANNELS.length)],
      Units: units,
      'Discount %': discount,
      Revenue: revenue,
      'Customer Rating': random() < 0.1 ? null : Math.round((3 + random() * 2 - discount / 50) * 10) / 10,
      Returned: random() < 0.08,
    };
  });
}
