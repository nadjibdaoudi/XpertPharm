import React, { useState } from 'react';
import { usePharmacyStore, PharmacyDB } from '../../services/dbStore';
import { Product, ProductForm, ProductTableau } from '../../types/pharmacy';
import {
  Pill,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  ShieldCheck,
  Building,
  Edit2,
  X,
  Check,
} from 'lucide-react';

export const ProductsCatalog: React.FC = () => {
  const state = usePharmacyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CHIFA' | 'PSYCHOTROPE' | 'LOW_STOCK'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new medicine
  const [newCode, setNewCode] = useState(`613${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  const [newName, setNewName] = useState('');
  const [newDci, setNewDci] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newForm, setNewForm] = useState<ProductForm>('Comprimé');
  const [newConditioning, setNewConditioning] = useState('Boîte de 30');
  const [newManufacturer, setNewManufacturer] = useState('Groupe Saidal');
  const [newCategory, setNewCategory] = useState('Médecine Générale');
  const [newPpa, setNewPpa] = useState<string>('350.00');
  const [newShp, setNewShp] = useState<string>('350.00');
  const [newPurchasePrice, setNewPurchasePrice] = useState<string>('270.00');
  const [newReimbursable, setNewReimbursable] = useState(true);
  const [newTableau, setNewTableau] = useState<ProductTableau>('AUCUN');
  const [newLocation, setNewLocation] = useState('Tiroir C1');
  const [newBatchNumber, setNewBatchNumber] = useState(`LOT-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [newExpiryDate, setNewExpiryDate] = useState('2028-06-30');
  const [newInitialQty, setNewInitialQty] = useState<number>(30);

  const filteredProducts = state.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dciName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codeNational.includes(searchTerm) ||
      p.manufacturerName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'CHIFA') return p.isReimbursable;
    if (filterType === 'PSYCHOTROPE') return p.tableau === 'TABLEAU_A' || p.tableau === 'PSYCHOTROPE';
    if (filterType === 'LOW_STOCK') return p.totalStock <= p.minStockAlert;
    return true;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDci.trim()) {
      alert('Veuillez renseigner le nom commercial et la DCI du produit');
      return;
    }

    const ppaNum = parseFloat(newPpa) || 0;
    const shpNum = parseFloat(newShp) || 0;
    const purchaseNum = parseFloat(newPurchasePrice) || 0;

    PharmacyDB.addProduct(
      {
        codeNational: newCode,
        name: newName.trim(),
        dciName: newDci.trim(),
        dosage: newDosage.trim(),
        form: newForm,
        conditioning: newConditioning.trim(),
        manufacturerId: 'm-generic',
        manufacturerName: newManufacturer.trim(),
        categoryId: 'cat-gen',
        categoryName: newCategory.trim(),
        ppa: ppaNum,
        shp: shpNum,
        purchasePrice: purchaseNum,
        tvaRate: 0,
        isReimbursable: newReimbursable,
        tableau: newTableau,
        isColdChain: false,
        minStockAlert: 15,
        locationDefault: newLocation.trim(),
        active: true,
      },
      {
        batchNumber: newBatchNumber,
        expiryDate: newExpiryDate,
        qty: Number(newInitialQty) || 0,
        purchasePrice: purchaseNum,
        location: newLocation.trim(),
      }
    );

    setShowAddModal(false);
    // Reset
    setNewName('');
    setNewDci('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="w-6 h-6 text-emerald-600" />
            Nomenclature des Médicaments & Produits d'Officine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Base nationale algérienne · Tarifs PPA, SHP, DCI, et statut réglementaire des substances
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nouveau Médicament / إضافة دواء
        </button>
      </div>

      {/* Search and Filters Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par Spécialité, DCI, Code barre national, Laboratoire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter segment tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0 overflow-x-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterType === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tous ({state.products.length})
          </button>
          <button
            onClick={() => setFilterType('CHIFA')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterType === 'CHIFA'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Remboursables CHIFA
          </button>
          <button
            onClick={() => setFilterType('PSYCHOTROPE')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterType === 'PSYCHOTROPE'
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Psychotropes (Tableau A)
          </button>
          <button
            onClick={() => setFilterType('LOW_STOCK')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              filterType === 'LOW_STOCK'
                ? 'bg-white dark:bg-slate-700 text-red-700 dark:text-red-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Stock Critique
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <th className="py-3 px-4">Code & Spécialité</th>
                <th className="py-3 px-3">DCI & Dosage</th>
                <th className="py-3 px-3">Forme & Cond.</th>
                <th className="py-3 px-3">Laboratoire</th>
                <th className="py-3 px-3 text-right">PPA (DZD)</th>
                <th className="py-3 px-3 text-right">SHP (DZD)</th>
                <th className="py-3 px-3 text-right">Prix Achat</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3">Emplacement</th>
                <th className="py-3 px-4">Statut Légal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const isLow = p.totalStock <= p.minStockAlert;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{p.codeNational}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{p.dciName}</div>
                      <div className="text-[10px] text-slate-500">{p.dosage}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      <div>{p.form}</div>
                      <div className="text-[10px] text-slate-500">{p.conditioning}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {p.manufacturerName}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                      {p.ppa.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                      {p.shp > 0 ? `${p.shp.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-500">
                      {p.purchasePrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold tabular-nums ${
                        p.totalStock === 0
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : isLow
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {p.totalStock}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {p.locationDefault}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {p.tableau === 'TABLEAU_A' ? (
                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Psychotrope (Tab A)
                          </span>
                        ) : p.isReimbursable ? (
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Remboursable CHIFA
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Hors nomenclature</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600" /> Ajouter un Médicament au Référentiel
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom Commercial (Spécialité) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Paracétamol Saidal"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    DCI (Dénomination Commune Internationale) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Paracétamol"
                    value={newDci}
                    onChange={(e) => setNewDci(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 500mg, 1g, 20mg"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Forme Galénique
                  </label>
                  <select
                    value={newForm}
                    onChange={(e) => setNewForm(e.target.value as ProductForm)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  >
                    <option value="Comprimé">Comprimé</option>
                    <option value="Gélule">Gélule</option>
                    <option value="Sirop">Sirop</option>
                    <option value="Injectable">Injectable</option>
                    <option value="Pommade">Pommade</option>
                    <option value="Collyre">Collyre</option>
                    <option value="Sachet">Sachet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Conditionnement
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Boîte de 30"
                    value={newConditioning}
                    onChange={(e) => setNewConditioning(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Laboratoire / Fabricant
                  </label>
                  <input
                    type="text"
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                    placeholder="ex: Groupe Saidal, Biopharm, Hikma, Sanofi"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statut Psychotrope / Réglementé
                  </label>
                  <select
                    value={newTableau}
                    onChange={(e) => setNewTableau(e.target.value as ProductTableau)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                  >
                    <option value="AUCUN">Normal (Non Psychotrope)</option>
                    <option value="TABLEAU_A">Tableau A (Psychotrope - Ordonnance Obligatoire)</option>
                  </select>
                </div>
              </div>

              {/* Pricing section */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  Tarification Réglementée Algérienne (DZD)
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      PPA (Prix Public Algérie) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newPpa}
                      onChange={(e) => setNewPpa(e.target.value)}
                      className="w-full font-bold text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      SHP (Tarif Réf. CHIFA)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newShp}
                      onChange={(e) => setNewShp(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Prix Achat Grossiste (HT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPurchasePrice}
                      onChange={(e) => setNewPurchasePrice(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="newReimbursable"
                    checked={newReimbursable}
                    onChange={(e) => setNewReimbursable(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="newReimbursable" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Produit remboursable par la Sécurité Sociale (CNAS / CASNOS)
                  </label>
                </div>
              </div>

              {/* Initial Batch */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  Lot Initial & Emplacement Stock
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      N° Lot
                    </label>
                    <input
                      type="text"
                      value={newBatchNumber}
                      onChange={(e) => setNewBatchNumber(e.target.value)}
                      className="w-full text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      DLU (Péremption)
                    </label>
                    <input
                      type="date"
                      value={newExpiryDate}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Quantité Initiale
                    </label>
                    <input
                      type="number"
                      value={newInitialQty}
                      onChange={(e) => setNewInitialQty(parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Rayon / Tiroir
                    </label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" /> Enregistrer le Médicament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
