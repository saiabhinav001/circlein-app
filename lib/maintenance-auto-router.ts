export type MaintenanceCategory =
  | 'Plumbing'
  | 'Electrical'
  | 'HVAC'
  | 'Structural'
  | 'General';

export const MAINTENANCE_KEYWORDS: Record<MaintenanceCategory, string[]> = {
  Plumbing: [
    'leak',
    'pipe',
    'drain',
    'tap',
    'faucet',
    'toilet',
    'sink',
    'water pressure',
    'sewage',
    'flood',
    'burst',
    'plumber',
    'clog',
    'blockage',
  ],
  Electrical: [
    'light',
    'bulb',
    'socket',
    'switch',
    'wire',
    'wiring',
    'power',
    'electricity',
    'circuit',
    'breaker',
    'outlet',
    'fuse',
    'electrical',
    'voltage',
    'shock',
  ],
  HVAC: [
    'air conditioning',
    'ac',
    'hvac',
    'heat',
    'heating',
    'fan',
    'ventilation',
    'vent',
    'thermostat',
    'temperature',
    'cold',
    'warm',
    'air quality',
    'aircon',
    'cooling',
  ],
  Structural: [
    'wall',
    'ceiling',
    'floor',
    'crack',
    'door',
    'window',
    'roof',
    'damp',
    'mould',
    'mold',
    'paint',
    'plaster',
    'staircase',
    'railing',
    'foundation',
    'balcony',
    'tile',
  ],
  General: [],
};

export function detectMaintenanceCategory(
  title: string,
  description: string
): MaintenanceCategory {
  const text = `${title} ${description}`.toLowerCase();

  const orderedCategories: MaintenanceCategory[] = [
    'Plumbing',
    'Electrical',
    'HVAC',
    'Structural',
  ];

  for (const category of orderedCategories) {
    const keywords = MAINTENANCE_KEYWORDS[category] || [];
    if (keywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return 'General';
}
