import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateFefoBatches, evaluateExpiryStatus } from './fefo';
import { Batch } from '../types/pharmacy';

test('FEFO allocates from earliest expiring batch first', () => {
  const batches: Batch[] = [
    {
      id: 'b2',
      productId: 'p1',
      productName: 'Doliprane 1000mg',
      batchNumber: 'LOT-2025-B',
      expiryDate: '2027-06-30',
      initialQty: 50,
      currentQty: 10,
      purchasePrice: 120,
      ppa: 160,
      location: 'Tiroir 1',
      receivedDate: '2025-01-01',
    },
    {
      id: 'b1',
      productId: 'p1',
      productName: 'Doliprane 1000mg',
      batchNumber: 'LOT-2024-A',
      expiryDate: '2026-12-31', // earlier expiry!
      initialQty: 50,
      currentQty: 5,
      purchasePrice: 120,
      ppa: 160,
      location: 'Tiroir 1',
      receivedDate: '2024-11-01',
    },
  ];

  // Request 8 items
  const allocation = allocateFefoBatches(batches, 8, '2026-01-01');
  assert.equal(allocation.totalAllocated, 8);
  assert.equal(allocation.shortage, 0);
  assert.equal(allocation.allocatedBatches.length, 2);
  
  // First allocated batch should be LOT-2024-A (5 units)
  assert.equal(allocation.allocatedBatches[0].batch.batchNumber, 'LOT-2024-A');
  assert.equal(allocation.allocatedBatches[0].quantity, 5);
  
  // Second allocated batch should be LOT-2025-B (3 units)
  assert.equal(allocation.allocatedBatches[1].batch.batchNumber, 'LOT-2025-B');
  assert.equal(allocation.allocatedBatches[1].quantity, 3);
});

test('FEFO ignores expired batches and calculates shortage', () => {
  const batches: Batch[] = [
    {
      id: 'b_exp',
      productId: 'p1',
      productName: 'Sirop Toux',
      batchNumber: 'LOT-EXPIRED',
      expiryDate: '2025-10-01',
      initialQty: 20,
      currentQty: 10,
      purchasePrice: 150,
      ppa: 210,
      location: 'Rayon R',
      receivedDate: '2024-01-01',
    },
    {
      id: 'b_valid',
      productId: 'p1',
      productName: 'Sirop Toux',
      batchNumber: 'LOT-VALID',
      expiryDate: '2027-01-01',
      initialQty: 20,
      currentQty: 4,
      purchasePrice: 150,
      ppa: 210,
      location: 'Rayon R',
      receivedDate: '2025-01-01',
    },
  ];

  const allocation = allocateFefoBatches(batches, 6, '2026-01-01');
  assert.equal(allocation.totalAllocated, 4);
  assert.equal(allocation.shortage, 2);
  assert.equal(allocation.allocatedBatches.length, 1);
  assert.equal(allocation.allocatedBatches[0].batch.batchNumber, 'LOT-VALID');
});

test('evaluateExpiryStatus: flags expired, critical and warning dates', () => {
  const now = new Date('2026-06-01');
  assert.equal(evaluateExpiryStatus('2026-05-30', now).status, 'EXPIRED');
  assert.equal(evaluateExpiryStatus('2026-07-15', now).status, 'CRITICAL');
  assert.equal(evaluateExpiryStatus('2026-10-01', now).status, 'WARNING');
  assert.equal(evaluateExpiryStatus('2027-06-01', now).status, 'GOOD');
});
