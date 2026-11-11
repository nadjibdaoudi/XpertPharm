/**
 * XpertPharm DZ - Core Domain Models & Database Schemas
 * Grouped into 8 Architectural Domains per Algerian Regulatory Standards
 */

// ==========================================
// A. Pharmacy & User Management (إدارة الصيدلية والمستخدمين)
// ==========================================

export type UserRole = 'PHARMACIEN_TITULAIRE' | 'PHARMACIEN_ASSISTANT' | 'VENDEUR_COMPTOIR' | 'STAGIAIRE' | 'COMPTABLE';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  active: boolean;
  pinCode?: string; // Quick 4-digit switch at counter
  createdAt: string;
}

export interface PharmacyProfile {
  id: string;
  name: string;
  nameAr: string;
  titulaireName: string;
  numAgrement: string; // Numéro d'agrément ministériel
  codeChifaCnas: string; // N° convention CNAS
  codeChifaCasnos: string; // N° convention CASNOS
  nif: string;
  nis: string;
  rc: string;
  wilaya: string;
  commune: string;
  address: string;
  phone: string;
  tvaDefault: number;
}

// ==========================================
// B. Medicines & Products (الأدوية والمنتجات)
// ==========================================

export type ProductForm = 
  | 'Comprimé'
  | 'Gélule'
  | 'Sirop'
  | 'Injectable'
  | 'Pommade'
  | 'Collyre'
  | 'Sachet'
  | 'Suppositoire'
  | 'Spray'
  | 'Suspension'
  | 'Solution'
  | 'Autre';

export type ProductTableau = 'AUCUN' | 'TABLEAU_A' | 'TABLEAU_B' | 'TABLEAU_C' | 'PSYCHOTROPE';

export interface ActiveIngredient {
  id: string;
  codeDci: string;
  name: string;
  nameAr?: string;
  therapeuticalClass: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  isNational: boolean; // Production nationale (ex: Saidal, Biopharm, Merinal)
}

export interface Product {
  id: string;
  codeNational: string; // Code barre ou code PCT 13 chiffres
  name: string;
  dciId?: string;
  dciName: string; // Dénomination Commune Internationale
  dosage: string;
  form: ProductForm;
  conditioning: string; // ex: Boîte de 30
  manufacturerId: string;
  manufacturerName: string;
  categoryId: string;
  categoryName: string;
  
  // Pricing Algerian Regulations
  ppa: number; // Prix Public Algérie (DZD)
  shp: number; // Seuil / Tarif de Référence Remboursement CHIFA (DZD)
  purchasePrice: number; // Prix d'Achat Grossiste HT/TTC (DZD)
  tvaRate: number; // 0% pour médicaments essentiels, 9% ou 19% pour parapharmacie
  
  // CHIFA & Regulated status
  isReimbursable: boolean; // Remboursable par la Sécurité Sociale
  tableau: ProductTableau; // Psychotrope / Stupéfiant
  isColdChain: boolean; // Chaîne de froid (Frigo 2-8°C)
  
  // Stock thresholds
  minStockAlert: number;
  totalStock: number;
  locationDefault: string; // Rayon / Tiroir
  active: boolean;
}

// ==========================================
// C. Stock & Inventory (المخزون والدفعات)
// ==========================================

export interface Batch {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string; // N° de Lot
  expiryDate: string; // DLU (Date Limite d'Utilisation YYYY-MM-DD)
  initialQty: number;
  currentQty: number;
  purchasePrice: number;
  ppa: number;
  location: string; // ex: "Tiroir A3", "Frigo B", "Rayon C2"
  supplierId?: string;
  supplierName?: string;
  receivedDate: string;
}

export type StockMovementType = 'PURCHASE_RECEIPT' | 'SALE' | 'SALE_RETURN' | 'EXPIRED_SCRAP' | 'INVENTORY_ADJUSTMENT' | 'SUPPLIER_RETURN';

export interface StockMovement {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  type: StockMovementType;
  quantityChange: number; // + or -
  balanceAfter: number;
  reason?: string;
  userId: string;
  userName: string;
  referenceDocId?: string; // Sale ID or Purchase ID
}

// ==========================================
// D. Purchases & Suppliers (المشتريات والموردون)
// ==========================================

export interface Supplier {
  id: string;
  name: string; // ex: "Hydrapharm Distribution", "Biopharm", "Cophalim"
  codeGrossiste: string;
  phone: string;
  address: string;
  wilaya: string;
  nif?: string;
  balanceDue: number; // Solde dû au grossiste (DZD)
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePriceUnit: number;
  ppaUnit: number;
  shpUnit: number;
  discountRate: number; // Remise grossiste %
  totalAmount: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string; // N° BL ou Facture Grossiste
  invoiceDate: string;
  items: PurchaseItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalPpa: number;
  totalNet: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  amountPaid: number;
  createdById: string;
  createdAt: string;
}

// ==========================================
// E. Sales & POS (المبيعات ونقاط البيع)
// ==========================================

export type SocialInsuranceCaisse = 'CNAS' | 'CASNOS' | 'CNR' | 'MUTUELLE' | 'AUCUNE';

export interface Customer {
  id: string;
  fullName: string;
  phone?: string;
  nss?: string; // N° Sécurité Sociale (12 chiffres)
  caisse: SocialInsuranceCaisse;
  isChronic: boolean; // Malade Chronique (100% ALD)
  reimbursementRate: number; // 80 or 100
  address?: string;
  currentCredit: number; // Dettes client en cours (DZD)
  chifaCardValidUntil?: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  dciName?: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPpa: number; // DZD
  unitShp: number; // DZD
  totalPpa: number; // DZD
  isReimbursable: boolean;
  tableau: ProductTableau;
  
  // CHIFA breakdown per item
  chifaBaseAmount: number; // min(PPA, SHP) * qty
  chifaCaissePart: number; // base * rate
  chifaPatientPart: number; // totalPpa - chifaCaissePart
}

export type PaymentMethod = 'CASH' | 'CHIFA_TIERS_PAYANT' | 'CARD_CIB_DAHABIA' | 'CREDIT' | 'CHEQUE';

export interface PaymentBreakdown {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface Sale {
  id: string;
  saleNumber: string; // VNT-2026-000001
  timestamp: string;
  userId: string;
  userName: string;
  customerId?: string;
  customerName?: string;
  isChifa: boolean;
  prescriptionId?: string;
  items: SaleItem[];
  
  totalPpa: number; // Total brut
  totalDiscount: number;
  totalNet: number; // Total à payer
  
  // Tiers-payant CHIFA calculation
  partCaisse: number; // Pris en charge par CNAS/CASNOS
  partAssure: number; // Ticket modérateur payé par le patient
  
  payments: PaymentBreakdown[];
  status: 'COMPLETED' | 'CANCELLED' | 'HELD';
  hasPsychotrope: boolean;
}

// ==========================================
// F. Prescriptions & CHIFA Claims (الوصفات والشفاء)
// ==========================================

export interface Prescription {
  id: string;
  date: string;
  doctorName: string;
  doctorSpecialty?: string;
  doctorAddress?: string;
  patientName: string;
  patientAge?: number;
  patientNss?: string;
  caisse: SocialInsuranceCaisse;
  isChronic: boolean;
  chifaCardNumber?: string;
  ordNumber: string; // N° ordonnance
}

export interface ChifaClaim {
  id: string;
  claimNumber: string; // N° Facture CHIFA
  batchBordereauId?: string; // N° de lot bordereau
  date: string;
  saleId: string;
  caisse: SocialInsuranceCaisse;
  insuredNss: string;
  insuredName: string;
  patientName: string;
  totalPpa: number;
  totalShp: number;
  montantCaisse: number;
  montantPatient: number;
  status: 'TRANSFERRED' | 'ACCEPTED' | 'REJECTED' | 'PAID';
  rejectionReason?: string;
  transmissionDate?: string;
}

export interface ChifaBordereau {
  id: string;
  bordereauNumber: string; // ex: BRD-CNAS-2026-0012
  caisse: SocialInsuranceCaisse;
  dateCreated: string;
  claimsCount: number;
  totalPpa: number;
  totalClaimedCaisse: number;
  status: 'DRAFT' | 'TRANSMITTED' | 'VALIDATED_PAID' | 'DISPUTED';
  claims: ChifaClaim[];
}

// ==========================================
// G. Cash Sessions & Accounting (الحسابات والصندوق)
// ==========================================

export interface CashSession {
  id: string;
  sessionNumber: string; // CS-2026-001
  openedAt: string;
  closedAt?: string;
  openedById: string;
  openedByName: string;
  initialCash: number; // Fond de caisse
  totalCashSales: number;
  totalCardSales: number;
  totalChifaSales: number;
  totalCreditSales: number;
  totalExpenses: number;
  expectedCashInDrawer: number;
  actualCashCounted?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface CashMovement {
  id: string;
  sessionId: string;
  timestamp: string;
  type: 'IN' | 'OUT';
  amount: number;
  reason: string;
  userId: string;
  userName: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Loyer' | 'Électricité/Eau' | 'Fournitures' | 'Salaire' | 'Entretien' | 'Autre';
  amount: number;
  description: string;
  paidById: string;
  paidByName: string;
}

// ==========================================
// H. Protection, Audit & Psychotropes Register (الحماية والتدقيق والمؤثرات العقلية)
// ==========================================

export interface PsychotropeEntry {
  id: string;
  entryDate: string;
  ordNumber: string;
  prescriptionDate: string;
  doctorName: string;
  patientName: string;
  patientIdCard?: string;
  patientAddress?: string;
  
  productId: string;
  productName: string;
  dciName: string;
  dosage: string;
  batchNumber: string;
  quantityDispensed: number;
  stockRemainingAfter: number;
  
  pharmacistName: string;
  saleId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'CREATE_SALE' | 'CANCEL_SALE' | 'ADJUST_STOCK' | 'OPEN_CASH' | 'CLOSE_CASH' | 'ADD_PRODUCT' | 'UPDATE_PRICE' | 'CREATE_PURCHASE' | 'EXPORT_DATA' | 'DELETE_RECORD';
  entityType: 'SALE' | 'STOCK' | 'PRODUCT' | 'CASH' | 'PURCHASE' | 'CHIFA';
  entityId: string;
  details: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string;
}
