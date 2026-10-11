/**
 * Calculates delivery charges based on customer's delivery state.
 *
 * Rules:
 * - Tamil Nadu: ₹50
 * - Kerala: ₹70
 * - Karnataka: ₹70
 * - Andhra Pradesh: ₹70
 * - All other Indian states / Union Territories: ₹180
 *
 * Charged once per order, not per item.
 */
export function calculateDeliveryCharge(state: string | undefined | null): number {
  if (!state || typeof state !== 'string') {
    return 0; // Handled by frontend if state not yet entered
  }

  // Normalize state: lowercase, trim, remove redundant spaces/dashes/periods
  const normalized = state
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '');

  // Tamil Nadu
  if (normalized === 'tamilnadu' || normalized === 'tn') {
    return 50;
  }

  // Kerala
  if (normalized === 'kerala' || normalized === 'kl') {
    return 70;
  }

  // Karnataka
  if (normalized === 'karnataka' || normalized === 'ka') {
    return 70;
  }

  // Andhra Pradesh (note: Telangana is a separate state, charged at standard ₹180)
  if (normalized === 'andhrapradesh' || normalized === 'andhra' || normalized === 'ap') {
    return 70;
  }

  // All other states
  return 180;
}
