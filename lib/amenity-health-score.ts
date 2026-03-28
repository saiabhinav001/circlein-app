export type AmenityHealthInput = {
  bookingCount: number;
  capacity: number;
  maintenanceRequestCount: number;
  averageRating: number | null;
  daysSinceLastMaintenance: number;
};

export type HealthScore = {
  score: number;
  label: 'excellent' | 'good' | 'fair' | 'poor';
  color: 'green' | 'yellow' | 'red';
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateAmenityHealthScore(input: AmenityHealthInput): HealthScore {
  const safeCapacity = input.capacity > 0 ? input.capacity : 1;

  let score = 60;

  const utilization = input.bookingCount / (safeCapacity * 30);
  if (utilization >= 0.3 && utilization <= 0.8) {
    score += 20;
  } else if (utilization < 0.3) {
    score += 5;
  } else {
    score += 10;
  }

  if (input.averageRating === null) {
    score += 7;
  } else {
    score += Math.round((input.averageRating / 5) * 15);
  }

  if (input.maintenanceRequestCount === 1) {
    score -= 5;
  } else if (input.maintenanceRequestCount === 2) {
    score -= 15;
  } else if (input.maintenanceRequestCount >= 3) {
    score -= 30;
  }

  if (input.daysSinceLastMaintenance <= 90) {
    score -= 0;
  } else if (input.daysSinceLastMaintenance <= 180) {
    score -= 5;
  } else if (input.daysSinceLastMaintenance <= 365) {
    score -= 10;
  } else {
    score -= 15;
  }

  const clamped = clampScore(score);

  if (clamped >= 80) {
    return { score: clamped, label: 'excellent', color: 'green' };
  }

  if (clamped >= 60) {
    return { score: clamped, label: 'good', color: 'green' };
  }

  if (clamped >= 40) {
    return { score: clamped, label: 'fair', color: 'yellow' };
  }

  return { score: clamped, label: 'poor', color: 'red' };
}
