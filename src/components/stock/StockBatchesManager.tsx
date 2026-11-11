import React, { useState } from 'react';
import { usePharmacyStore, PharmacyDB } from '../../services/dbStore';
import { evaluateExpiryStatus } from '../../services/fefo';
import { Batch } from '../../types/pharmacy';
import {
  Boxes,
  Calendar,
  AlertTriangle,
  CheckCircle,
  History,
  Search,
  Plus,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const StockBatchesManager: React.FC = () => {
  const state = usePharmacyStore();
  const [activeTab, setActiveTab] = useState<'BATCHES' | 'MOVEMENTS'>('BATCHES');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'EXPIRED'>('ALL');

  // Adjustment modal
  const [selectedBatchForAdjust, setSelectedBatchForAdjust] = useState<Batch | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Inventaire physique contradictoire');

  // Add new batch modal
  const [showAddBatchModal, setShowAddBatchModal] = useState<boolean>(false);
  const [newBatchProductId, setNewBatchProductId] = useState<string>(state.products[0]?.id || '');
  const [newBatchNumber, setNewBatchNumber] = useState<string>(`LOT-DZ-${Math.floor(100 + Math.random() * 900)}`);
  const [newBatchExpiry, setNewBatchExpiry] = useState<string>('2028-12-31');
  const [newBatchQty, setNewBatchQty] = useState<number>(20);
  const [newBatchLocation, setNewBatchLocation] = useState<string>('Tiroir B1');

  // Filter batches
  const filteredBatches = state.batches.filter((b) => {
    const matchesSearch =
      b.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const expiryInfo = evaluateExpiryStatus(b.expiryDate);
    if (statusFilter === 'CRITICAL') return expiryInfo.status === 'CRITICAL';
    if (statusFilter === 'WARNING') return expiryInfo.status === 'WARNING';
    if (statusFilter === 'EXPIRED') return expiryInfo.status === 'EXPIRED';
    return true;
  });

  const criticalCount = state.batches.filter(
    (b) => evaluateExpiryStatus(b.expiryDate).status === 'CRITICAL' && b.currentQty > 0
  ).length;

  const warningCount = state.batches.filter(
    (b) => evaluateExpiryStatus(b.expiryDate).status === 'WARNING' && b.currentQty > 0
  ).length;

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForAdjust) return;
    PharmacyDB.adjustBatchStock(selectedBatchForAdjust.id, Number(adjustQty), adjustReason);
    setSelectedBatchForAdjust(null);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = state.products.find((p) => p.id === newBatchProductId);
    if (!prod) return;

    PharmacyDB.addBatch({
      productId: prod.id,
      productName: prod.name,
      batchNumber: newBatchNumber.trim(),
      expiryDate: newBatchExpiry,
      initialQty: Number(newBatchQty),
      purchasePrice: prod.purchasePrice,
      ppa: prod.ppa,
      location: newBatchLocation || prod.locationDefault,
      supplierId: 'sup-1',
      supplierName: 'Hydrapharm Distribution',
    });

    setShowAddBatchModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-600" />
            Gestion des Stocks par Lots (Batches) & Suivi Péremption (DLU)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Application stricte de la règle FEFO (Premier Périmé, Premier Sorti) et alertes péremption d'officine
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddBatchModal(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Entrée Nouveau Lot
          </button>
        </div>
      </div>

      {/* KPI Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lots Actifs en Stock</span>
            <Boxes className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
            {state.batches.filter((b) => b.currentQty > 0).length} <span className="text-xs font-medium text-slate-400">Lots</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Répartis sur tiroirs, rayons et chaîne de froid</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Péremption Urgente (&lt; 3 Mois)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {criticalCount} <span className="text-xs font-medium">Lots à dispenser en priorité (FEFO)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">À retourner ou solder auprès du grossiste</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Vigilance Péremption (&lt; 6 Mois)</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {warningCount} <span className="text-xs font-medium">Lots surveillés</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Rotations à surveiller lors des prochaines commandes</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('BATCHES')}
            className={`pb-2.5 text-xs font-bold transition-all relative ${
              activeTab === 'BATCHES'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Inventaire des Lots & DLU ({state.batches.length})
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`pb-2.5 text-xs font-bold transition-all relative ${
              activeTab === 'MOVEMENTS'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Journal des Mouvements de Stock ({state.stockMovements.length})
          </button>
        </div>

        {activeTab === 'BATCHES' && (
          <div className="flex items-center gap-1 pb-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Tous les statuts de péremption</option>
              <option value="CRITICAL">Péremption &lt; 3 mois (Urgent)</option>
              <option value="WARNING">Péremption &lt; 6 mois</option>
              <option value="EXPIRED">Lots Périmés</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB CONTENT: BATCHES */}
      {activeTab === 'BATCHES' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer par médicament, n° lot, emplacement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <th className="py-3 px-4">Spécialité & Médicament</th>
                  <th className="py-3 px-3">N° de Lot</th>
                  <th className="py-3 px-3">DLU (Péremption)</th>
                  <th className="py-3 px-3">Alerte FEFO</th>
                  <th className="py-3 px-3 text-center">Qté Initiale</th>
                  <th className="py-3 px-3 text-center">Qté Actuelle</th>
                  <th className="py-3 px-3 text-right">PPA Unitaire</th>
                  <th className="py-3 px-3">Emplacement</th>
                  <th className="py-3 px-3">Grossiste</th>
                  <th className="py-3 px-4 text-right">Ajustement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBatches.map((b) => {
                  const expiry = evaluateExpiryStatus(b.expiryDate);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {b.productName}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-3 tabular-nums text-slate-600 dark:text-slate-400">
                        {b.expiryDate}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            expiry.status === 'EXPIRED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : expiry.status === 'CRITICAL'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : expiry.status === 'WARNING'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {expiry.labelFr}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums text-slate-400">
                        {b.initialQty}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums font-bold text-slate-900 dark:text-white">
                        {b.currentQty}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                        {b.ppa.toFixed(2)} DA
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {b.location}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] truncate max-w-[120px]">
                        {b.supplierName || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedBatchForAdjust(b);
                            setAdjustQty(b.currentQty);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded"
                        >
                          Régulariser
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MOVEMENTS */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-3">Médicament</th>
                <th className="py-3 px-3">N° Lot</th>
                <th className="py-3 px-3">Type Mouvement</th>
                <th className="py-3 px-3 text-center">Variation</th>
                <th className="py-3 px-3 text-center">Stock Après</th>
                <th className="py-3 px-3">Motif / Justificatif</th>
                <th className="py-3 px-4">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.stockMovements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{m.timestamp}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{m.productName}</td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{m.batchNumber || '—'}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.type === 'PURCHASE_RECEIPT'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : m.type === 'SALE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    }`}>
                      {m.type === 'PURCHASE_RECEIPT' ? 'Entrée BL Grossiste' : m.type === 'SALE' ? 'Sortie Vente' : 'Régularisation Inventaire'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold tabular-nums">
                    <span className={m.quantityChange > 0 ? 'text-blue-600' : 'text-emerald-600'}>
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    {m.balanceAfter}
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">{m.reason}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px]">{m.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjustment Modal */}
      {selectedBatchForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Régularisation Physique de Stock
              </h3>
              <button onClick={() => setSelectedBatchForAdjust(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-xs space-y-1">
              <div><strong>Produit:</strong> {selectedBatchForAdjust.productName}</div>
              <div><strong>Lot:</strong> {selectedBatchForAdjust.batchNumber} (DLU: {selectedBatchForAdjust.expiryDate})</div>
              <div><strong>Stock actuel au système:</strong> {selectedBatchForAdjust.currentQty} unités</div>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nouveau stock physique compté *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motif officiel de l'ajustement *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                >
                  <option value="Inventaire physique contradictoire">Inventaire physique contradictoire</option>
                  <option value="Avarie ou casse en officine">Avarie ou casse en officine</option>
                  <option value="Périmé retiré des rayons">Périmé retiré des rayons</option>
                  <option value="Erreur saisie réception BL">Erreur saisie réception BL</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedBatchForAdjust(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Valider l'Ajustement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Ajouter un Lot de Médicament
              </h3>
              <button onClick={() => setShowAddBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Médicament Spécialité *
                </label>
                <select
                  value={newBatchProductId}
                  onChange={(e) => setNewBatchProductId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                >
                  {state.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.dciName} · PPA: {p.ppa.toFixed(2)} DA)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    N° de Lot *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBatchNumber}
                    onChange={(e) => setNewBatchNumber(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    DLU (Date de Péremption) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatchExpiry}
                    onChange={(e) => setNewBatchExpiry(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantité reçue *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newBatchQty}
                    onChange={(e) => setNewBatchQty(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emplacement (Rayon/Tiroir)
                  </label>
                  <input
                    type="text"
                    value={newBatchLocation}
                    onChange={(e) => setNewBatchLocation(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Créer le Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
