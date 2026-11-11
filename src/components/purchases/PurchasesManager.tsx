import React, { useState } from 'react';
import { usePharmacyStore, PharmacyDB } from '../../services/dbStore';
import { Supplier, Purchase } from '../../types/pharmacy';
import {
  Truck,
  Plus,
  FileText,
  DollarSign,
  Building,
  CheckCircle2,
  Clock,
  X,
  PlusCircle,
  Trash2,
} from 'lucide-react';

export const PurchasesManager: React.FC = () => {
  const state = usePharmacyStore();
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(state.suppliers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`BL-BIO-${Math.floor(10000 + Math.random() * 90000)}`);
  const [amountPaid, setAmountPaid] = useState<string>('0');

  // Purchase items
  const [items, setItems] = useState<Array<{
    productId: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    purchasePriceUnit: number;
    ppaUnit: number;
    shpUnit: number;
    location: string;
  }>>([
    {
      productId: state.products[0]?.id || '',
      batchNumber: `LOT-BL-${Math.floor(100 + Math.random() * 900)}`,
      expiryDate: '2028-06-30',
      quantity: 50,
      purchasePriceUnit: state.products[0]?.purchasePrice || 120,
      ppaUnit: state.products[0]?.ppa || 165,
      shpUnit: state.products[0]?.shp || 165,
      location: state.products[0]?.locationDefault || 'Tiroir A1',
    },
  ]);

  const handleAddItem = () => {
    const prod = state.products[0];
    if (!prod) return;
    setItems([
      ...items,
      {
        productId: prod.id,
        batchNumber: `LOT-BL-${Math.floor(100 + Math.random() * 900)}`,
        expiryDate: '2028-06-30',
        quantity: 20,
        purchasePriceUnit: prod.purchasePrice,
        ppaUnit: prod.ppa,
        shpUnit: prod.shp,
        location: prod.locationDefault,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemProductChange = (index: number, prodId: string) => {
    const prod = state.products.find((p) => p.id === prodId);
    if (!prod) return;
    setItems(
      items.map((it, idx) =>
        idx === index
          ? {
              ...it,
              productId: prodId,
              purchasePriceUnit: prod.purchasePrice,
              ppaUnit: prod.ppa,
              shpUnit: prod.shp,
              location: prod.locationDefault,
            }
          : it
      )
    );
  };

  const totalInvoiceAchat = items.reduce((acc, it) => acc + it.purchasePriceUnit * it.quantity, 0);
  const totalInvoicePpa = items.reduce((acc, it) => acc + it.ppaUnit * it.quantity, 0);
  const totalMarge = totalInvoicePpa - totalInvoiceAchat;

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Veuillez ajouter au moins une ligne de médicament');
      return;
    }

    PharmacyDB.receivePurchase({
      supplierId: selectedSupplierId,
      invoiceNumber: invoiceNumber.trim(),
      items,
      amountPaid: parseFloat(amountPaid) || 0,
    });

    setShowAddPurchaseModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            Mouvements d'Approvisionnement & Factures Grossistes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Réception des Bons de Livraison (BL), saisie des lots & DLU, marges et soldes fournisseurs
          </p>
        </div>

        <button
          onClick={() => {
            setAmountPaid(totalInvoiceAchat.toFixed(2));
            setShowAddPurchaseModal(true);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Réceptionner Facture / BL Grossiste
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {state.suppliers.map((sup) => (
          <div
            key={sup.id}
            className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {sup.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{sup.codeGrossiste}</span>
              </div>
              <div className="text-[11px] text-slate-500">{sup.address}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Tél: {sup.phone}</div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
              <span className="text-[11px] text-slate-500">Solde dû:</span>
              <span className={`text-sm font-bold tabular-nums ${sup.balanceDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
                {sup.balanceDue.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Purchases History */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" /> Historique des Factures et Bons de Livraison Reçus
          </h3>
          <span className="text-xs text-slate-400">{state.purchases.length} Documents enregistrés</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <th className="py-3 px-4">N° Facture / BL</th>
              <th className="py-3 px-3">Date Réception</th>
              <th className="py-3 px-3">Grossiste</th>
              <th className="py-3 px-3 text-center">Nbre Lignes</th>
              <th className="py-3 px-3 text-right">Total PPA</th>
              <th className="py-3 px-3 text-right">Total Achat HT</th>
              <th className="py-3 px-3 text-right">Marge Brute</th>
              <th className="py-3 px-4">Statut Paiement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.purchases.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Aucun bon de livraison enregistré pour le moment. Cliquez sur "Réceptionner Facture / BL" pour débuter.
                </td>
              </tr>
            ) : (
              state.purchases.map((p) => {
                const marge = p.totalPpa - p.totalNet;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">{p.invoiceDate}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {p.supplierName}
                    </td>
                    <td className="py-3.5 px-3 text-center tabular-nums">{p.items.length}</td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                      {p.totalPpa.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                      {p.totalNet.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      +{marge.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : p.paymentStatus === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {p.paymentStatus === 'PAID' ? 'Réglé' : p.paymentStatus === 'PARTIAL' ? 'Partiel' : 'À Crédit'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Purchase */}
      {showAddPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 p-6 overflow-y-auto max-h-[92vh] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" /> Saisie Réception Bon de Livraison / Facture Grossiste
              </h3>
              <button onClick={() => setShowAddPurchaseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Grossiste Répartiteur *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  >
                    {state.suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.codeGrossiste})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    N° Facture / BL Grossiste *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Montant Réglé à la Livraison (DZD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">
                    Lignes de Médicaments Reçus ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded text-xs font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Ajouter une ligne
                  </button>
                </div>

                <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-7 gap-2.5 items-end text-xs"
                    >
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Médicament</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemProductChange(index, e.target.value)}
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5"
                        >
                          {state.products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">N° Lot *</label>
                        <input
                          type="text"
                          required
                          value={item.batchNumber}
                          onChange={(e) =>
                            setItems(
                              items.map((it, i) => (i === index ? { ...it, batchNumber: e.target.value } : it))
                            )
                          }
                          className="w-full text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">DLU (Péremption) *</label>
                        <input
                          type="date"
                          required
                          value={item.expiryDate}
                          onChange={(e) =>
                            setItems(
                              items.map((it, i) => (i === index ? { ...it, expiryDate: e.target.value } : it))
                            )
                          }
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Qté Reçue *</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            setItems(
                              items.map((it, i) =>
                                i === index ? { ...it, quantity: parseInt(e.target.value) || 0 } : it
                              )
                            )
                          }
                          className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Prix Achat HT</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.purchasePriceUnit}
                          onChange={(e) =>
                            setItems(
                              items.map((it, i) =>
                                i === index ? { ...it, purchasePriceUnit: parseFloat(e.target.value) || 0 } : it
                              )
                            )
                          }
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400">Total HT</div>
                          <div className="font-bold tabular-nums">
                            {(item.purchasePriceUnit * item.quantity).toFixed(2)}
                          </div>
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Summary */}
                <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500">Marge Brute Officine estimée:</span>{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      +{totalMarge.toFixed(2)} DZD ({totalInvoicePpa > 0 ? ((totalMarge / totalInvoicePpa) * 100).toFixed(1) : 0}%)
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 mr-2">Total Net Facture Grossiste:</span>
                    <strong className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {totalInvoiceAchat.toFixed(2)} DZD
                    </strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Valider la Réception & Mettre à Jour les Stocks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
