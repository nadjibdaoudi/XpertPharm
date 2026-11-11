/**
 * FEFO (First Expired, First Out) Inventory Algorithm for Algerian Pharmacies
 * Enforces dispensing of products based on nearest DLU (Date Limite d'Utilisation)
 */

import { Batch } from '../types/pharmacy';

export interface BatchAllocationResult {
  allocatedBatches: Array<{
    batch: Batch;
    quantity: number;
  }>;
  totalAllocated: number;
  shortage: number;
}

/**
 * Computes FEFO batch allocations for a given requested quantity.
 * Only batches with currentQty > 0 and not expired are eligible.
 * Returns sorted by expiryDate ascending.
 */
export function allocateFefoBatches(
  batches: Batch[],
  requestedQty: number,
  todayIso: string = new Date().toISOString().split('T')[0]
): BatchAllocationResult {
  if (requestedQty <= 0) {
    return { allocatedBatches: [], totalAllocated: 0, shortage: 0 };
  }

  // Filter available non-expired batches with positive stock
  const validBatches = batches
    .filter((b) => b.currentQty > 0 && b.expiryDate >= todayIso)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  const allocated: Array<{ batch: Batch; quantity: number }> = [];
  let needed = requestedQty;

  for (const b of validBatches) {
    if (needed <= 0) break;
    const take = Math.min(b.currentQty, needed);
    allocated.push({
      batch: b,
      quantity: take,
    });
    needed -= take;
  }

  return {
    allocatedBatches: allocated,
    totalAllocated: requestedQty - needed,
    shortage: needed,
  };
}

/**
 * Evaluates expiry alert status for a given DLU
 * @returns 'EXPIRED' | 'CRITICAL' (< 3 months) | 'WARNING' (< 6 months) | 'GOOD'
 */
export function evaluateExpiryStatus(
  expiryDateIso: string,
  today: Date = new Date()
): {
  status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'GOOD';
  daysRemaining: number;
  labelFr: string;
  labelAr: string;
} {
  const expiry = new Date(expiryDateIso);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      status: 'EXPIRED',
      daysRemaining: diffDays,
      labelFr: 'Périmé',
      labelAr: 'منتهي الصلاحية',
    };
  }
  if (diffDays <= 90) {
    return {
      status: 'CRITICAL',
      daysRemaining: diffDays,
      labelFr: '< 3 mois (Urgent)',
      labelAr: 'أقل من 3 أشهر',
    };
  }
  if (diffDays <= 180) {
    return {
      status: 'WARNING',
      daysRemaining: diffDays,
      labelFr: '< 6 mois',
      labelAr: 'أقل من 6 أشهر',
    };
  }
  return {
    status: 'GOOD',
    daysRemaining: diffDays,
    labelFr: 'Valide',
    labelAr: 'صالح',
  };
}
