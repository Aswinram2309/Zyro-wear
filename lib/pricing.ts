export interface CartItemLike {
  price: number;
  quantity: number;
  [key: string]: any;
}

export interface Buy3For999Result {
  totalUnits: number;
  originalSubtotal: number;
  qualifyingGroups: number;
  bundleDiscount: number;
  discountedProductTotal: number;
  remainingUnits: number;
  remainingSubtotal: number;
  itemsNeededForNextCombo: number;
  isOfferApplied: boolean;
  offerDescription: string;
}

/**
 * Calculates the "BUY 3 FOR ₹999" promotional offer.
 * Rules:
 * 1. Any combination of 3 eligible products qualifies for ₹999.
 * 2. Complete groups of 3 charge ₹999 (or sum if less).
 * 3. Incomplete units are charged at regular original prices.
 * 4. Multiples applied repeatedly (e.g. 6 items -> 2 groups = ₹1998).
 */
export function calculateBuy3For999(items: CartItemLike[]): Buy3For999Result {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      totalUnits: 0,
      originalSubtotal: 0,
      qualifyingGroups: 0,
      bundleDiscount: 0,
      discountedProductTotal: 0,
      remainingUnits: 0,
      remainingSubtotal: 0,
      itemsNeededForNextCombo: 3,
      isOfferApplied: false,
      offerDescription: 'Add 3 eligible items to get them for ₹999!',
    };
  }

  // Expand all items into individual prices
  const unitPrices: number[] = [];
  let originalSubtotal = 0;

  for (const item of items) {
    const qty = Math.max(0, parseInt(String(item.quantity || 0), 10) || 0);
    const price = Number(item.price || 0);
    for (let i = 0; i < qty; i++) {
      unitPrices.push(price);
      originalSubtotal += price;
    }
  }

  const totalUnits = unitPrices.length;
  if (totalUnits === 0) {
    return {
      totalUnits: 0,
      originalSubtotal: 0,
      qualifyingGroups: 0,
      bundleDiscount: 0,
      discountedProductTotal: 0,
      remainingUnits: 0,
      remainingSubtotal: 0,
      itemsNeededForNextCombo: 3,
      isOfferApplied: false,
      offerDescription: 'Add 3 eligible items to get them for ₹999!',
    };
  }

  // Sort unit prices descending to maximize customer savings
  unitPrices.sort((a, b) => b - a);

  const qualifyingGroups = Math.floor(totalUnits / 3);
  const remainingUnits = totalUnits % 3;
  const itemsNeededForNextCombo = remainingUnits === 0 ? 3 : 3 - remainingUnits;

  let totalComboCharged = 0;
  let bundleDiscount = 0;

  // Process complete groups of 3
  for (let g = 0; g < qualifyingGroups; g++) {
    const groupItems = unitPrices.slice(g * 3, g * 3 + 3);
    const groupOriginalSum = groupItems.reduce((acc, p) => acc + p, 0);
    // Bundle price is ₹999, but never more than original sum
    const groupEffectivePrice = Math.min(groupOriginalSum, 999);
    totalComboCharged += groupEffectivePrice;
    bundleDiscount += Math.max(0, groupOriginalSum - groupEffectivePrice);
  }

  // Process remaining items at their original prices
  const remainingItems = unitPrices.slice(qualifyingGroups * 3);
  const remainingSubtotal = remainingItems.reduce((acc, p) => acc + p, 0);

  const discountedProductTotal = totalComboCharged + remainingSubtotal;
  const isOfferApplied = qualifyingGroups > 0 && bundleDiscount > 0;

  let offerDescription = '';
  if (qualifyingGroups > 0) {
    offerDescription = `Buy 3 for ₹999 applied (${qualifyingGroups} combo${qualifyingGroups > 1 ? 's' : ''})`;
    if (remainingUnits > 0) {
      offerDescription += ` + ${remainingUnits} item${remainingUnits > 1 ? 's' : ''} at regular price`;
    }
  } else if (remainingUnits === 2) {
    offerDescription = 'Add 1 more item to get all 3 for ₹999!';
  } else if (remainingUnits === 1) {
    offerDescription = 'Add 2 more items to get 3 for ₹999!';
  } else {
    offerDescription = 'Add 3 items to get them for ₹999!';
  }

  return {
    totalUnits,
    originalSubtotal,
    qualifyingGroups,
    bundleDiscount,
    discountedProductTotal,
    remainingUnits,
    remainingSubtotal,
    itemsNeededForNextCombo,
    isOfferApplied,
    offerDescription,
  };
}
