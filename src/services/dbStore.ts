/**
 * XpertPharm DZ - Central State Engine & Data Store
 * In-memory state with localStorage persistence, transactional safety, and audit logging.
 */

import { useState, useEffect } from 'react';
import {
  PharmacyProfile,
  User,
  Product,
  Batch,
  Supplier,
  Customer,
  Sale,
  Purchase,
  CashSession,
  Expense,
  PsychotropeEntry,
  AuditLog,
  ChifaBordereau,
  ChifaClaim,
  StockMovement,
} from '../types/pharmacy';
import {
  INITIAL_PHARMACY,
  INITIAL_USERS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_BATCHES,
  INITIAL_CUSTOMERS,
  INITIAL_PSYCHOTROPES_REGISTER,
  INITIAL_AUDIT_LOGS,
  INITIAL_CASH_SESSION,
  INITIAL_EXPENSES,
  INITIAL_BORDEREAUX,
} from '../data/seedData';
import { allocateFefoBatches } from './fefo';

const STORAGE_KEY = 'xpertpharm_dz_db_v1';

export interface DatabaseState {
  pharmacy: PharmacyProfile;
  users: User[];
  currentUser: User;
  suppliers: Supplier[];
  products: Product[];
  batches: Batch[];
  customers: Customer[];
  sales: Sale[];
  purchases: Purchase[];
  cashSessions: CashSession[];
  currentCashSession: CashSession | null;
  expenses: Expense[];
  psychotropes: PsychotropeEntry[];
  bordereaux: ChifaBordereau[];
  auditLogs: AuditLog[];
  stockMovements: StockMovement[];
  nextSaleSeq: number;
}

function loadInitialState(): DatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.products && parsed.batches) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load pharmacy state from localStorage, using initial seed', e);
  }

  return {
    pharmacy: INITIAL_PHARMACY,
    users: INITIAL_USERS,
    currentUser: INITIAL_USERS[0], // Dr. Amina Khelifi (Titulaire)
    suppliers: INITIAL_SUPPLIERS,
    products: INITIAL_PRODUCTS,
    batches: INITIAL_BATCHES,
    customers: INITIAL_CUSTOMERS,
    sales: [],
    purchases: [],
    cashSessions: [INITIAL_CASH_SESSION],
    currentCashSession: INITIAL_CASH_SESSION,
    expenses: INITIAL_EXPENSES,
    psychotropes: INITIAL_PSYCHOTROPES_REGISTER,
    bordereaux: INITIAL_BORDEREAUX,
    auditLogs: INITIAL_AUDIT_LOGS,
    stockMovements: [],
    nextSaleSeq: 103,
  };
}

let globalState: DatabaseState = loadInitialState();
const listeners = new Set<() => void>();

function notify() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
  listeners.forEach((l) => l());
}

export const PharmacyDB = {
  getState(): DatabaseState {
    return globalState;
  },

  setCurrentUser(user: User) {
    globalState = { ...globalState, currentUser: user };
    PharmacyDB.logAudit('OPEN_CASH', 'CASH', user.id, `Changement d'utilisateur actif: ${user.name} (${user.role})`);
    notify();
  },

  updatePharmacyProfile(profile: Partial<PharmacyProfile>) {
    globalState = {
      ...globalState,
      pharmacy: { ...globalState.pharmacy, ...profile },
    };
    PharmacyDB.logAudit('UPDATE_PRICE', 'PRODUCT', globalState.pharmacy.id, 'Mise à jour des coordonnées de l\'officine');
    notify();
  },

  // -------------------------------------------------------------
  // PRODUCTS & BATCHES
  // -------------------------------------------------------------
  addProduct(productData: Omit<Product, 'id' | 'totalStock'>, initialBatch?: { batchNumber: string; expiryDate: string; qty: number; purchasePrice: number; location: string }): Product {
    const newId = `prd-${Date.now()}`;
    const initialQty = initialBatch ? initialBatch.qty : 0;
    
    const newProduct: Product = {
      ...productData,
      id: newId,
      totalStock: initialQty,
      active: true,
    };

    let newBatches = [...globalState.batches];
    let newMovements = [...globalState.stockMovements];

    if (initialBatch && initialBatch.qty > 0) {
      const batchId = `bat-${Date.now()}`;
      const newBatch: Batch = {
        id: batchId,
        productId: newId,
        productName: newProduct.name,
        batchNumber: initialBatch.batchNumber,
        expiryDate: initialBatch.expiryDate,
        initialQty: initialBatch.qty,
        currentQty: initialBatch.qty,
        purchasePrice: initialBatch.purchasePrice,
        ppa: newProduct.ppa,
        location: initialBatch.location || newProduct.locationDefault,
        receivedDate: new Date().toISOString().split('T')[0],
      };
      newBatches.push(newBatch);

      newMovements.push({
        id: `mov-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        productId: newId,
        productName: newProduct.name,
        batchId: batchId,
        batchNumber: initialBatch.batchNumber,
        type: 'PURCHASE_RECEIPT',
        quantityChange: initialBatch.qty,
        balanceAfter: initialBatch.qty,
        reason: 'Stock Initial Création Produit',
        userId: globalState.currentUser.id,
        userName: globalState.currentUser.name,
      });
    }

    globalState = {
      ...globalState,
      products: [newProduct, ...globalState.products],
      batches: newBatches,
      stockMovements: newMovements,
    };

    PharmacyDB.logAudit('ADD_PRODUCT', 'PRODUCT', newId, `Création du médicament: ${newProduct.name} (PPA: ${newProduct.ppa} DA)`);
    notify();
    return newProduct;
  },

  updateProduct(productId: string, updates: Partial<Product>) {
    globalState = {
      ...globalState,
      products: globalState.products.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
    };
    PharmacyDB.logAudit('UPDATE_PRICE', 'PRODUCT', productId, `Modification produit ${productId}`);
    notify();
  },

  addBatch(batchData: Omit<Batch, 'id' | 'currentQty' | 'receivedDate'>): Batch {
    const newId = `bat-${Date.now()}`;
    const newBatch: Batch = {
      ...batchData,
      id: newId,
      currentQty: batchData.initialQty,
      receivedDate: new Date().toISOString().split('T')[0],
    };

    // Update product total stock
    const updatedProducts = globalState.products.map((p) => {
      if (p.id === batchData.productId) {
        return { ...p, totalStock: p.totalStock + batchData.initialQty };
      }
      return p;
    });

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      productId: batchData.productId,
      productName: batchData.productName,
      batchId: newId,
      batchNumber: batchData.batchNumber,
      type: 'PURCHASE_RECEIPT',
      quantityChange: batchData.initialQty,
      balanceAfter: (updatedProducts.find(p => p.id === batchData.productId)?.totalStock || 0),
      reason: 'Entrée manuelle de lot / BL',
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
    };

    globalState = {
      ...globalState,
      batches: [newBatch, ...globalState.batches],
      products: updatedProducts,
      stockMovements: [newMovement, ...globalState.stockMovements],
    };

    PharmacyDB.logAudit('ADJUST_STOCK', 'STOCK', newId, `Nouveau Lot ${batchData.batchNumber} pour ${batchData.productName} (+${batchData.initialQty})`);
    notify();
    return newBatch;
  },

  adjustBatchStock(batchId: string, newQty: number, reason: string) {
    const batch = globalState.batches.find((b) => b.id === batchId);
    if (!batch) return;

    const diff = newQty - batch.currentQty;
    const updatedBatches = globalState.batches.map((b) =>
      b.id === batchId ? { ...b, currentQty: newQty } : b
    );

    const updatedProducts = globalState.products.map((p) => {
      if (p.id === batch.productId) {
        return { ...p, totalStock: Math.max(0, p.totalStock + diff) };
      }
      return p;
    });

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      productId: batch.productId,
      productName: batch.productName,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      type: 'INVENTORY_ADJUSTMENT',
      quantityChange: diff,
      balanceAfter: (updatedProducts.find(p => p.id === batch.productId)?.totalStock || 0),
      reason: reason || 'Inventaire régularisation',
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
    };

    globalState = {
      ...globalState,
      batches: updatedBatches,
      products: updatedProducts,
      stockMovements: [movement, ...globalState.stockMovements],
    };

    PharmacyDB.logAudit('ADJUST_STOCK', 'STOCK', batchId, `Ajustement stock lot ${batch.batchNumber}: ${diff > 0 ? '+' : ''}${diff} (${reason})`);
    notify();
  },

  // -------------------------------------------------------------
  // SALES & POS TRANSACTION ENGINE
  // -------------------------------------------------------------
  executeSale(params: {
    items: Array<{
      productId: string;
      requestedQty: number;
    }>;
    isChifa: boolean;
    customer?: Customer;
    prescription?: {
      doctorName: string;
      prescriptionDate: string;
      ordNumber: string;
      patientName: string;
      patientIdCard?: string;
      patientAddress?: string;
    };
    payments: Array<{
      method: 'CASH' | 'CHIFA_TIERS_PAYANT' | 'CARD_CIB_DAHABIA' | 'CREDIT' | 'CHEQUE';
      amount: number;
      reference?: string;
    }>;
    partCaisse: number;
    partAssure: number;
  }): { success: boolean; sale?: Sale; error?: string } {
    const saleId = `vnt-${Date.now()}`;
    const saleNum = `VNT-2026-${String(globalState.nextSaleSeq).padStart(6, '0')}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Concurrency and FEFO Allocation Verification
    const executedSaleItems: any[] = [];
    const updatedBatches = [...globalState.batches];
    const updatedProducts = [...globalState.products];
    const newStockMovements: StockMovement[] = [];
    const newPsychotropes: PsychotropeEntry[] = [];
    let hasPsychotrope = false;

    for (const itemReq of params.items) {
      const product = updatedProducts.find((p) => p.id === itemReq.productId);
      if (!product) {
        return { success: false, error: `Produit introuvable: ${itemReq.productId}` };
      }

      const productBatches = updatedBatches.filter((b) => b.productId === product.id && b.currentQty > 0);
      const allocation = allocateFefoBatches(productBatches, itemReq.requestedQty);

      if (allocation.shortage > 0) {
        return {
          success: false,
          error: `Stock insuffisant pour ${product.name} (Manque: ${allocation.shortage} unités)`,
        };
      }

      if (product.tableau === 'TABLEAU_A' || product.tableau === 'PSYCHOTROPE') {
        hasPsychotrope = true;
        if (!params.prescription || !params.prescription.doctorName.trim()) {
          return {
            success: false,
            error: `Dispensation de psychotrope interdite sans médecin prescripteur et numéro d'ordonnance officiel!`,
          };
        }
      }

      // Deduct from batches
      for (const alloc of allocation.allocatedBatches) {
        const batchIndex = updatedBatches.findIndex((b) => b.id === alloc.batch.id);
        if (batchIndex !== -1) {
          updatedBatches[batchIndex] = {
            ...updatedBatches[batchIndex],
            currentQty: updatedBatches[batchIndex].currentQty - alloc.quantity,
          };
        }

        // Calculate line breakdown
        const totalLinePpa = Math.round(product.ppa * alloc.quantity * 100) / 100;
        const baseShp = Math.min(product.ppa, product.shp);
        const rate = params.customer?.isChronic ? 1.0 : (params.customer?.reimbursementRate === 100 ? 1.0 : 0.8);
        const linePartCaisse = params.isChifa && product.isReimbursable
          ? Math.round(baseShp * alloc.quantity * rate * 100) / 100
          : 0;
        const linePartPatient = totalLinePpa - linePartCaisse;

        executedSaleItems.push({
          id: `sli-${Date.now()}-${alloc.batch.id}`,
          productId: product.id,
          productName: product.name,
          dciName: product.dciName,
          batchId: alloc.batch.id,
          batchNumber: alloc.batch.batchNumber,
          expiryDate: alloc.batch.expiryDate,
          quantity: alloc.quantity,
          unitPpa: product.ppa,
          unitShp: product.shp,
          totalPpa: totalLinePpa,
          isReimbursable: product.isReimbursable,
          tableau: product.tableau,
          chifaBaseAmount: baseShp * alloc.quantity,
          chifaCaissePart: linePartCaisse,
          chifaPatientPart: linePartPatient,
        });

        // Stock movement
        newStockMovements.push({
          id: `mov-${Date.now()}-${alloc.batch.id}`,
          timestamp,
          productId: product.id,
          productName: product.name,
          batchId: alloc.batch.id,
          batchNumber: alloc.batch.batchNumber,
          type: 'SALE',
          quantityChange: -alloc.quantity,
          balanceAfter: product.totalStock - itemReq.requestedQty,
          reason: `Vente ${saleNum}`,
          userId: globalState.currentUser.id,
          userName: globalState.currentUser.name,
          referenceDocId: saleId,
        });

        // Psychotrope official registry record
        if (product.tableau === 'TABLEAU_A' || product.tableau === 'PSYCHOTROPE') {
          newPsychotropes.push({
            id: `psy-${Date.now()}-${alloc.batch.id}`,
            entryDate: timestamp,
            ordNumber: params.prescription?.ordNumber || 'ORD-COMPTOIR',
            prescriptionDate: params.prescription?.prescriptionDate || timestamp.substring(0, 10),
            doctorName: params.prescription?.doctorName || 'Inconnu',
            patientName: params.prescription?.patientName || params.customer?.fullName || 'Anonyme',
            patientIdCard: params.prescription?.patientIdCard,
            patientAddress: params.prescription?.patientAddress || params.customer?.address,
            productId: product.id,
            productName: product.name,
            dciName: product.dciName,
            dosage: product.dosage,
            batchNumber: alloc.batch.batchNumber,
            quantityDispensed: alloc.quantity,
            stockRemainingAfter: updatedBatches[batchIndex].currentQty,
            pharmacistName: globalState.currentUser.name,
            saleId: saleId,
          });
        }
      }

      // Update product aggregate stock
      const prodIndex = updatedProducts.findIndex((p) => p.id === product.id);
      if (prodIndex !== -1) {
        updatedProducts[prodIndex] = {
          ...updatedProducts[prodIndex],
          totalStock: Math.max(0, updatedProducts[prodIndex].totalStock - itemReq.requestedQty),
        };
      }
    }

    const totalPpa = executedSaleItems.reduce((acc, it) => acc + it.totalPpa, 0);

    const newSale: Sale = {
      id: saleId,
      saleNumber: saleNum,
      timestamp,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      customerId: params.customer?.id,
      customerName: params.customer?.fullName || 'Client Comptoir',
      isChifa: params.isChifa,
      prescriptionId: params.prescription ? `ord-${Date.now()}` : undefined,
      items: executedSaleItems,
      totalPpa,
      totalDiscount: 0,
      totalNet: totalPpa,
      partCaisse: params.partCaisse,
      partAssure: params.partAssure,
      payments: params.payments,
      status: 'COMPLETED',
      hasPsychotrope,
    };

    // Update current cash session tallies
    let updatedCashSession = globalState.currentCashSession;
    if (updatedCashSession && updatedCashSession.status === 'OPEN') {
      const cashPaid = params.payments.filter((p) => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
      const cardPaid = params.payments.filter((p) => p.method === 'CARD_CIB_DAHABIA').reduce((sum, p) => sum + p.amount, 0);
      const chifaPaid = params.partCaisse;
      const creditPaid = params.payments.filter((p) => p.method === 'CREDIT').reduce((sum, p) => sum + p.amount, 0);

      updatedCashSession = {
        ...updatedCashSession,
        totalCashSales: updatedCashSession.totalCashSales + cashPaid,
        totalCardSales: updatedCashSession.totalCardSales + cardPaid,
        totalChifaSales: updatedCashSession.totalChifaSales + chifaPaid,
        totalCreditSales: updatedCashSession.totalCreditSales + creditPaid,
        expectedCashInDrawer: updatedCashSession.expectedCashInDrawer + cashPaid,
      };
    }

    // Customer credit management
    let updatedCustomers = [...globalState.customers];
    const creditPayment = params.payments.find((p) => p.method === 'CREDIT');
    if (creditPayment && params.customer) {
      updatedCustomers = updatedCustomers.map((c) =>
        c.id === params.customer?.id ? { ...c, currentCredit: c.currentCredit + creditPayment.amount } : c
      );
    }

    // CHIFA Claim generation if applicable
    let updatedBordereaux = [...globalState.bordereaux];
    if (params.isChifa && params.customer && params.partCaisse > 0) {
      const newClaim: ChifaClaim = {
        id: `clm-${Date.now()}`,
        claimNumber: `FAC-CHIFA-${String(globalState.nextSaleSeq).padStart(6, '0')}`,
        date: timestamp.substring(0, 10),
        saleId: saleId,
        caisse: params.customer.caisse || 'CNAS',
        insuredNss: params.customer.nss || '180000000000',
        insuredName: params.customer.fullName,
        patientName: params.prescription?.patientName || params.customer.fullName,
        totalPpa: totalPpa,
        totalShp: executedSaleItems.reduce((acc, it) => acc + (it.chifaBaseAmount || 0), 0),
        montantCaisse: params.partCaisse,
        montantPatient: params.partAssure,
        status: 'TRANSFERRED',
        transmissionDate: timestamp.substring(0, 10),
      };

      // Add to latest open bordereau or create one
      const caisseTarget = params.customer.caisse || 'CNAS';
      const openBrdIndex = updatedBordereaux.findIndex(
        (b) => b.caisse === caisseTarget && b.status === 'TRANSMITTED'
      );
      if (openBrdIndex !== -1) {
        updatedBordereaux[openBrdIndex] = {
          ...updatedBordereaux[openBrdIndex],
          claimsCount: updatedBordereaux[openBrdIndex].claimsCount + 1,
          totalPpa: updatedBordereaux[openBrdIndex].totalPpa + totalPpa,
          totalClaimedCaisse: updatedBordereaux[openBrdIndex].totalClaimedCaisse + params.partCaisse,
          claims: [newClaim, ...updatedBordereaux[openBrdIndex].claims],
        };
      }
    }

    globalState = {
      ...globalState,
      batches: updatedBatches,
      products: updatedProducts,
      stockMovements: [...newStockMovements, ...globalState.stockMovements],
      psychotropes: [...newPsychotropes, ...globalState.psychotropes],
      sales: [newSale, ...globalState.sales],
      nextSaleSeq: globalState.nextSaleSeq + 1,
      currentCashSession: updatedCashSession,
      customers: updatedCustomers,
      bordereaux: updatedBordereaux,
    };

    PharmacyDB.logAudit('CREATE_SALE', params.isChifa ? 'CHIFA' : 'SALE', saleId, `Vente ${saleNum} (${totalPpa.toFixed(2)} DZD)`);
    notify();
    return { success: true, sale: newSale };
  },

  // -------------------------------------------------------------
  // PURCHASES (RECEPTION BL GROSSISTES)
  // -------------------------------------------------------------
  receivePurchase(purchaseData: {
    supplierId: string;
    invoiceNumber: string;
    items: Array<{
      productId: string;
      batchNumber: string;
      expiryDate: string;
      quantity: number;
      purchasePriceUnit: number;
      ppaUnit: number;
      shpUnit: number;
      location: string;
    }>;
    amountPaid: number;
  }) {
    const supplier = globalState.suppliers.find((s) => s.id === purchaseData.supplierId);
    if (!supplier) return;

    const purchaseId = `pur-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let updatedProducts = [...globalState.products];
    let updatedBatches = [...globalState.batches];
    const newMovements: StockMovement[] = [];

    let totalPpa = 0;
    let totalPurchase = 0;

    for (const item of purchaseData.items) {
      const prod = updatedProducts.find((p) => p.id === item.productId);
      if (!prod) continue;

      const lineTotal = item.purchasePriceUnit * item.quantity;
      totalPurchase += lineTotal;
      totalPpa += item.ppaUnit * item.quantity;

      const batchId = `bat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newBatch: Batch = {
        id: batchId,
        productId: prod.id,
        productName: prod.name,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        initialQty: item.quantity,
        currentQty: item.quantity,
        purchasePrice: item.purchasePriceUnit,
        ppa: item.ppaUnit,
        location: item.location || prod.locationDefault,
        supplierId: supplier.id,
        supplierName: supplier.name,
        receivedDate: today,
      };

      updatedBatches.push(newBatch);

      // Update product price & stock
      const prodIdx = updatedProducts.findIndex((p) => p.id === prod.id);
      if (prodIdx !== -1) {
        updatedProducts[prodIdx] = {
          ...updatedProducts[prodIdx],
          ppa: item.ppaUnit,
          shp: item.shpUnit || updatedProducts[prodIdx].shp,
          purchasePrice: item.purchasePriceUnit,
          totalStock: updatedProducts[prodIdx].totalStock + item.quantity,
        };
      }

      newMovements.push({
        id: `mov-${Date.now()}-${item.batchNumber}`,
        timestamp,
        productId: prod.id,
        productName: prod.name,
        batchId,
        batchNumber: item.batchNumber,
        type: 'PURCHASE_RECEIPT',
        quantityChange: item.quantity,
        balanceAfter: (updatedProducts[prodIdx]?.totalStock || 0),
        reason: `Réception BL ${purchaseData.invoiceNumber} (${supplier.name})`,
        userId: globalState.currentUser.id,
        userName: globalState.currentUser.name,
        referenceDocId: purchaseId,
      });
    }

    const newPurchase: Purchase = {
      id: purchaseId,
      supplierId: supplier.id,
      supplierName: supplier.name,
      invoiceNumber: purchaseData.invoiceNumber,
      invoiceDate: today,
      items: purchaseData.items.map((it) => {
        const prod = updatedProducts.find((p) => p.id === it.productId);
        return {
          id: `pui-${Date.now()}-${it.batchNumber}`,
          productId: it.productId,
          productName: prod?.name || '',
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate,
          quantity: it.quantity,
          purchasePriceUnit: it.purchasePriceUnit,
          ppaUnit: it.ppaUnit,
          shpUnit: it.shpUnit,
          discountRate: 0,
          totalAmount: it.purchasePriceUnit * it.quantity,
        };
      }),
      subtotal: totalPurchase,
      discountTotal: 0,
      taxTotal: 0,
      totalPpa,
      totalNet: totalPurchase,
      paymentStatus: purchaseData.amountPaid >= totalPurchase ? 'PAID' : (purchaseData.amountPaid > 0 ? 'PARTIAL' : 'UNPAID'),
      amountPaid: purchaseData.amountPaid,
      createdById: globalState.currentUser.id,
      createdAt: timestamp,
    };

    // Update supplier balance due
    const debtAdded = Math.max(0, totalPurchase - purchaseData.amountPaid);
    const updatedSuppliers = globalState.suppliers.map((s) =>
      s.id === supplier.id ? { ...s, balanceDue: s.balanceDue + debtAdded } : s
    );

    globalState = {
      ...globalState,
      products: updatedProducts,
      batches: updatedBatches,
      suppliers: updatedSuppliers,
      purchases: [newPurchase, ...globalState.purchases],
      stockMovements: [...newMovements, ...globalState.stockMovements],
    };

    PharmacyDB.logAudit('CREATE_PURCHASE', 'PURCHASE', purchaseId, `Réception Facture BL ${purchaseData.invoiceNumber} de ${supplier.name} (${totalPurchase.toFixed(2)} DZD)`);
    notify();
  },

  // -------------------------------------------------------------
  // CASH SESSIONS & EXPENSES
  // -------------------------------------------------------------
  openCashSession(initialFloat: number) {
    const today = new Date().toISOString().split('T')[0];
    const newSession: CashSession = {
      id: `cs-${Date.now()}`,
      sessionNumber: `CS-${today}-${Date.now().toString().slice(-4)}`,
      openedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      openedById: globalState.currentUser.id,
      openedByName: globalState.currentUser.name,
      initialCash: initialFloat,
      totalCashSales: 0,
      totalCardSales: 0,
      totalChifaSales: 0,
      totalCreditSales: 0,
      totalExpenses: 0,
      expectedCashInDrawer: initialFloat,
      status: 'OPEN',
    };

    globalState = {
      ...globalState,
      currentCashSession: newSession,
      cashSessions: [newSession, ...globalState.cashSessions],
    };

    PharmacyDB.logAudit('OPEN_CASH', 'CASH', newSession.id, `Ouverture caisse avec fond de ${initialFloat.toFixed(2)} DZD`);
    notify();
  },

  closeCashSession(actualCashCounted: number, notes?: string) {
    if (!globalState.currentCashSession) return;

    const diff = actualCashCounted - globalState.currentCashSession.expectedCashInDrawer;
    const closedSession: CashSession = {
      ...globalState.currentCashSession,
      closedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      actualCashCounted,
      difference: diff,
      status: 'CLOSED',
      notes,
    };

    globalState = {
      ...globalState,
      currentCashSession: null,
      cashSessions: globalState.cashSessions.map((cs) => (cs.id === closedSession.id ? closedSession : cs)),
    };

    PharmacyDB.logAudit('CLOSE_CASH', 'CASH', closedSession.id, `Clôture Z Caisse. Espèces comptées: ${actualCashCounted.toFixed(2)} DZD (Écart: ${diff >= 0 ? '+' : ''}${diff.toFixed(2)} DZD)`);
    notify();
  },

  addExpense(category: Expense['category'], amount: number, description: string) {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      category,
      amount,
      description,
      paidById: globalState.currentUser.id,
      paidByName: globalState.currentUser.name,
    };

    let updatedSession = globalState.currentCashSession;
    if (updatedSession) {
      updatedSession = {
        ...updatedSession,
        totalExpenses: updatedSession.totalExpenses + amount,
        expectedCashInDrawer: updatedSession.expectedCashInDrawer - amount,
      };
    }

    globalState = {
      ...globalState,
      expenses: [newExpense, ...globalState.expenses],
      currentCashSession: updatedSession,
    };

    PharmacyDB.logAudit('ADJUST_STOCK', 'CASH', newExpense.id, `Sortie de caisse dépense: ${amount.toFixed(2)} DZD (${category} - ${description})`);
    notify();
  },

  // -------------------------------------------------------------
  // AUDIT & BACKUP
  // -------------------------------------------------------------
  logAudit(action: AuditLog['action'], entityType: AuditLog['entityType'], entityId: string, details: string) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      action,
      entityType,
      entityId,
      details,
    };
    globalState = {
      ...globalState,
      auditLogs: [log, ...globalState.auditLogs.slice(0, 200)],
    };
  },

  exportDatabaseJson(): string {
    return JSON.stringify(globalState, null, 2);
  },

  importDatabaseJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.products && parsed.batches) {
        globalState = parsed;
        PharmacyDB.logAudit('EXPORT_DATA', 'PRODUCT', 'ALL', 'Restauration complète de la base de données depuis sauvegarde JSON');
        notify();
        return true;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    return false;
  },

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    globalState = loadInitialState();
    notify();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function usePharmacyStore() {
  const [state, setState] = useState<DatabaseState>(PharmacyDB.getState());

  useEffect(() => {
    return PharmacyDB.subscribe(() => {
      setState(PharmacyDB.getState());
    });
  }, []);

  return state;
}
