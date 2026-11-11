import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateChifaReimbursement, validateAlgerianNss } from './chifa';

test('CHIFA reimbursement: standard 80% with PPA equal to SHP', () => {
  const items = [
    {
      id: '1',
      name: 'Amoxicilline 500mg',
      unitPpa: 250,
      unitShp: 250,
      quantity: 2,
      isReimbursable: true,
    },
  ];

  const result = calculateChifaReimbursement(items, 80);
  assert.equal(result.totalPpa, 500);
  assert.equal(result.totalBaseReimbursable, 500);
  assert.equal(result.totalPartCaisse, 400); // 80% of 500
  assert.equal(result.totalPartPatient, 100); // 20% ticket modérateur
});

test('CHIFA reimbursement: standard 80% with PPA greater than SHP (dépassement tarif de référence)', () => {
  // Algerian rule: patient pays the 20% co-pay on SHP + 100% of the difference (PPA - SHP)
  const items = [
    {
      id: '2',
      name: 'Tahor 20mg',
      unitPpa: 1200,
      unitShp: 1000,
      quantity: 1,
      isReimbursable: true,
    },
  ];

  const result = calculateChifaReimbursement(items, 80);
  assert.equal(result.totalPpa, 1200);
  assert.equal(result.totalBaseReimbursable, 1000); // capped at SHP
  assert.equal(result.totalPartCaisse, 800); // 80% of 1000
  assert.equal(result.totalPartPatient, 400); // 1200 - 800 = 400 (200 diff + 200 co-pay)
});

test('CHIFA reimbursement: 100% ALD chronic patient with non-reimbursable mixed item', () => {
  const items = [
    {
      id: '1',
      name: 'Glucophage 850mg',
      unitPpa: 300,
      unitShp: 300,
      quantity: 3,
      isReimbursable: true,
    },
    {
      id: '2',
      name: 'Complément Vitamine C (Parapharmacie)',
      unitPpa: 450,
      unitShp: 0,
      quantity: 1,
      isReimbursable: false,
    },
  ];

  const result = calculateChifaReimbursement(items, 100);
  assert.equal(result.totalPpa, 1350); // 900 + 450
  assert.equal(result.totalPartCaisse, 900); // 100% of 900
  assert.equal(result.totalPartPatient, 450); // non-reimbursable paid fully by patient
});

test('validateAlgerianNss: correctly checks 12-digit Algerian NSS format', () => {
  assert.equal(validateAlgerianNss('184061601245'), true);
  assert.equal(validateAlgerianNss('279112503419'), true);
  assert.equal(validateAlgerianNss('1840616012'), false); // too short
  assert.equal(validateAlgerianNss('384061601245'), false); // invalid gender (3)
  assert.equal(validateAlgerianNss('184131601245'), false); // invalid month (13)
  assert.equal(validateAlgerianNss('184069901245'), false); // invalid wilaya (99)
});
