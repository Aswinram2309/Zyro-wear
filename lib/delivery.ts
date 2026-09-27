export function calculateDeliveryCharge(state: string | undefined): number {
  if (!state) return 0; // Handled by frontend

  const normalizedState = state.trim().toLowerCase();

  if (normalizedState === 'tamil nadu') {
    return 50;
  }
  
  if (
    normalizedState === 'kerala' ||
    normalizedState === 'karnataka' ||
    normalizedState === 'andhra pradesh'
  ) {
    return 70;
  }

  return 180;
}
