/**
 * Pure CHIFA Social Security Reimbursement Algorithm (Algeria)
 * Standardized according to CNAS/CASNOS regulations
 */

import { Product, ProductTableau, SocialInsuranceCaisse } from '../types/pharmacy';

export interface ChifaCalculationInputItem {
  id: string;
  name: string;
  unitPpa: number;
  unitShp: number;
  quantity: number;
  isReimbursable: boolean;
  tableau?: ProductTableau;
}

export interface ChifaItemResult {
  itemId: string;
  totalPpa: number;
  reimbursableBase: number;
  partCaisse: number; // CNAS / CASNOS
  partPatient: number; // Ticket modérateur + dépassement SHP
  rateApplied: number;
}

export interface ChifaTotalResult {
  totalPpa: number;
  totalBaseReimbursable: number;
  totalPartCaisse: number;
  totalPartPatient: number;
  items: ChifaItemResult[];
}

/**
 * Calculates Algerian CHIFA social security reimbursement breakdown.
 * @param items List of sold items with PPA, SHP and reimbursable flag
 * @param rate Reimbursement rate (80 for standard insured, 100 for chronic ALD)
 */
export function calculateChifaReimbursement(
  items: ChifaCalculationInputItem[],
  rate: 80 | 100 = 80
): ChifaTotalResult {
  let totalPpa = 0;
  let totalBaseReimbursable = 0;
  let totalPartCaisse = 0;
  let totalPartPatient = 0;

  const itemResults: ChifaItemResult[] = items.map((item) => {
    const itemTotalPpa = Math.round(item.unitPpa * item.quantity * 100) / 100;
    totalPpa += itemTotalPpa;

    if (!item.isReimbursable || item.unitShp <= 0) {
      // Non-reimbursable item: patient pays 100% of PPA
      totalPartPatient += itemTotalPpa;
      return {
        itemId: item.id,
        totalPpa: itemTotalPpa,
        reimbursableBase: 0,
        partCaisse: 0,
        partPatient: itemTotalPpa,
        rateApplied: 0,
      };
    }

    // Algerian CHIFA Rule: The reimbursable base is bounded by the SHP (Tarif de Référence)
    // If PPA < SHP, base is PPA; if PPA > SHP, base is SHP and patient pays the difference!
    const effectiveBaseUnit = Math.min(item.unitPpa, item.unitShp);
    const itemReimbursableBase = Math.round(effectiveBaseUnit * item.quantity * 100) / 100;
    
    // Part Caisse = Base * (rate / 100)
    const itemPartCaisse = Math.round(itemReimbursableBase * (rate / 100) * 100) / 100;
    
    // Part Patient = Total PPA - Part Caisse
    const itemPartPatient = Math.round((itemTotalPpa - itemPartCaisse) * 100) / 100;

    totalBaseReimbursable += itemReimbursableBase;
    totalPartCaisse += itemPartCaisse;
    totalPartPatient += itemPartPatient;

    return {
      itemId: item.id,
      totalPpa: itemTotalPpa,
      reimbursableBase: itemReimbursableBase,
      partCaisse: itemPartCaisse,
      partPatient: itemPartPatient,
      rateApplied: rate,
    };
  });

  return {
    totalPpa: Math.round(totalPpa * 100) / 100,
    totalBaseReimbursable: Math.round(totalBaseReimbursable * 100) / 100,
    totalPartCaisse: Math.round(totalPartCaisse * 100) / 100,
    totalPartPatient: Math.round(totalPartPatient * 100) / 100,
    items: itemResults,
  };
}

/**
 * Validates Algerian Social Security Number (NSS - 12 digits)
 * Format: [Sexe][Année 2][Mois 2][Wilaya 2][Centre 2][Ordre 3]
 */
export function validateAlgerianNss(nss: string): boolean {
  if (!nss) return false;
  const cleaned = nss.replace(/\s+/g, '');
  if (!/^\d{12}$/.test(cleaned)) return false;
  
  const gender = parseInt(cleaned[0], 10);
  if (gender !== 1 && gender !== 2) return false; // 1 = Male, 2 = Female
  
  const month = parseInt(cleaned.substring(3, 5), 10);
  if (month < 1 || month > 12) return false;
  
  const wilaya = parseInt(cleaned.substring(5, 7), 10);
  if (wilaya < 1 || wilaya > 58) return false; // 58 Wilayas in Algeria
  
  return true;
}

export interface ChifaSmartCardData {
  nss: string;
  insuredName: string;
  caisse: SocialInsuranceCaisse;
  agencyCode: string;
  wilayaCode: string;
  isChronic: boolean;
  rate: 80 | 100;
  expirationDate: string;
  dependents: Array<{
    name: string;
    relationship: 'CONJOINT' | 'ENFANT' | 'ASCENDANT';
    birthDate: string;
  }>;
}

/**
 * Generates sample CHIFA smart card simulation profiles
 */
export const SAMPLE_CHIFA_CARDS: ChifaSmartCardData[] = [
  {
    nss: '184061601245',
    insuredName: 'BENALI Ahmed',
    caisse: 'CNAS',
    agencyCode: '1601',
    wilayaCode: '16',
    isChronic: true,
    rate: 100,
    expirationDate: '2028-12-31',
    dependents: [
      { name: 'BENALI Fatima', relationship: 'CONJOINT', birthDate: '1987-05-14' },
      { name: 'BENALI Yacine', relationship: 'ENFANT', birthDate: '2016-09-22' },
    ],
  },
  {
    nss: '191033100882',
    insuredName: 'MEZIANE Karim',
    caisse: 'CNAS',
    agencyCode: '3102',
    wilayaCode: '31',
    isChronic: false,
    rate: 80,
    expirationDate: '2027-06-30',
    dependents: [],
  },
  {
    nss: '279112503419',
    insuredName: 'BOUZID Samia',
    caisse: 'CASNOS',
    agencyCode: '2501',
    wilayaCode: '25',
    isChronic: true,
    rate: 100,
    expirationDate: '2029-01-15',
    dependents: [
      { name: 'BOUZID Amina', relationship: 'ENFANT', birthDate: '2014-03-10' },
    ],
  },
];
