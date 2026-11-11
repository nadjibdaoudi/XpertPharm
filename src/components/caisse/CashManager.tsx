import React, { useState } from 'react';
import { usePharmacyStore, PharmacyDB } from '../../services/dbStore';
import { Expense } from '../../types/pharmacy';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Lock,
  Unlock,
  CreditCard,
  Building,
  Printer,
  Plus,
  AlertCircle,
  X,
  FileCheck2,
} from 'lucide-react';

export const CashManager: React.FC = () => {
  const state = usePharmacyStore();
  const session = state.currentCashSession;

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);

  // Close session state
  const [countedCash, setCountedCash] = useState<string>(
    session ? session.expectedCashInDrawer.toFixed(2) : '0'
  );
  const [closingNotes, setClosingNotes] = useState('');

  // Expense state
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Fournitures');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  // Open session state
  const [initialFloat, setInitialFloat] = useState('15000.00');

  const handleConfirmClose = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseFloat(countedCash) || 0;
    PharmacyDB.closeCashSession(count, closingNotes);
    setShowCloseModal(false);
  };

  const handleConfirmExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount) || 0;
    if (amt <= 0) return;
    PharmacyDB.addExpense(expenseCategory, amt, expenseDesc);
    setShowExpenseModal(false);
    setExpenseAmount('');
    setExpenseDesc('');
  };

  const handleConfirmOpen = (e: React.FormEvent) => {
    e.preventDefault();
    const flt = parseFloat(initialFloat) || 0;
    PharmacyDB.openCashSession(flt);
    setShowOpenModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            Gestion de Caisse & Clôture Journalière (Z de Caisse)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des flux d'espèces, ventilation des encaissements (CHIFA, CIB, Espèces) et audit de clôture
          </p>
        </div>

        <div className="flex items-center gap-2">
          {session && session.status === 'OPEN' ? (
            <>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4 text-amber-500" /> Sortie / Dépense de Caisse
              </button>
              <button
                onClick={() => {
                  setCountedCash(session.expectedCashInDrawer.toFixed(2));
                  setShowCloseModal(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Lock className="w-4 h-4" /> Clôturer la Caisse (Rapport Z)
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Unlock className="w-4 h-4" /> Ouvrir une Session de Caisse
            </button>
          )}
        </div>
      </div>

      {/* Current Session Overview */}
      {session && session.status === 'OPEN' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Espèces Attendues en Caisse</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                {session.expectedCashInDrawer.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Fond initial: {session.initialCash.toFixed(2)} DA
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Total CHIFA Tiers-Payant (CNAS)</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                {session.totalChifaSales.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
              </div>
              <div className="text-[11px] text-slate-400 mt-1">À recevoir par virement bancaire</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Encaissements Carte CIB / Dahabia</div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 tabular-nums">
                {session.totalCardSales.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Crédités sur compte bancaire</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Dépenses Sorties de Caisse</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                {session.totalExpenses.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{state.expenses.length} Bons de dépense</div>
            </div>
          </div>

          {/* Session Detail Strip */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
            <div>
              <span className="text-slate-500">Session active:</span>{' '}
              <strong className="text-slate-900 dark:text-white font-mono">{session.sessionNumber}</strong>
            </div>
            <div>
              <span className="text-slate-500">Ouverte par:</span>{' '}
              <strong className="text-slate-900 dark:text-white">{session.openedByName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Date et heure:</span>{' '}
              <span className="text-slate-900 dark:text-white tabular-nums">{session.openedAt}</span>
            </div>
            <div>
              <span className="text-slate-500">Crédits clients en cours:</span>{' '}
              <span className="text-slate-900 dark:text-white font-bold tabular-nums">
                {session.totalCreditSales.toFixed(2)} DA
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
          <Lock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Aucune Caisse Ouverte Actuellement</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Pour pouvoir encaisser les ventes au comptoir et délivrer des ordonnances, veuillez ouvrir une nouvelle session avec saisie du fond de caisse.
          </p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
          >
            Ouvrir la Caisse Maintenant
          </button>
        </div>
      )}

      {/* Expenses History */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" /> Dépenses Courantes de l'Officine (Sorties de Caisse)
          </h3>
          <span className="text-xs text-slate-400">{state.expenses.length} Dépenses</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-3">Catégorie</th>
              <th className="py-3 px-3">Description / Justificatif</th>
              <th className="py-3 px-3 text-right">Montant (DZD)</th>
              <th className="py-3 px-4">Payé par</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{exp.date}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    {exp.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium">{exp.description}</td>
                <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                  {exp.amount.toFixed(2)} DA
                </td>
                <td className="py-3 px-4 text-slate-500 text-[11px]">{exp.paidByName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: Close Session / Clôture Z */}
      {showCloseModal && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" /> Clôture Journalière (Rapport Z)
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Fond initial:</span>
                <span className="font-semibold tabular-nums">{session.initialCash.toFixed(2)} DA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ventes Espèces du jour:</span>
                <span className="font-semibold text-emerald-600 tabular-nums">+{session.totalCashSales.toFixed(2)} DA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dépenses de caisse:</span>
                <span className="font-semibold text-red-500 tabular-nums">-{session.totalExpenses.toFixed(2)} DA</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm">
                <span>Total Espèces Théorique:</span>
                <span className="text-slate-900 dark:text-white tabular-nums">
                  {session.expectedCashInDrawer.toFixed(2)} DA
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmClose} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Espèces Réellement Comptées dans le Tiroir *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="w-full text-base font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white tabular-nums"
                />
              </div>

              {/* Difference Preview */}
              {countedCash && (
                <div className={`p-2.5 rounded-lg text-xs flex justify-between items-center font-bold ${
                  parseFloat(countedCash) === session.expectedCashInDrawer
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : parseFloat(countedCash) > session.expectedCashInDrawer
                    ? 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}>
                  <span>Écart de caisse:</span>
                  <span className="tabular-nums">
                    {(parseFloat(countedCash) - session.expectedCashInDrawer).toFixed(2)} DZD{' '}
                    {parseFloat(countedCash) === session.expectedCashInDrawer
                      ? '(Caisse Parfaite)'
                      : parseFloat(countedCash) > session.expectedCashInDrawer
                      ? '(Excédent)'
                      : '(Déficit)'}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observations de clôture
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Remarques éventuelles sur la journée..."
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Valider Clôture & Imprimer Rapport Z
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Open Session */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-600" /> Ouverture de Session de Caisse
            </h3>
            <p className="text-xs text-slate-500">
              Veuillez saisir le montant des espèces mis en fond de caisse initial pour la monnaie.
            </p>

            <form onSubmit={handleConfirmOpen} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fond de caisse initial (DZD) *
                </label>
                <input
                  type="number"
                  step="100"
                  required
                  value={initialFloat}
                  onChange={(e) => setInitialFloat(e.target.value)}
                  className="w-full text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 tabular-nums"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Ouvrir la Caisse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-500" /> Sortie d'Espèces de la Caisse
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catégorie de la dépense
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                >
                  <option value="Fournitures">Fournitures de bureau / Rouleaux ticket</option>
                  <option value="Entretien">Entretien et nettoyage officine</option>
                  <option value="Électricité/Eau">Facture Sonelgaz / SEAAL</option>
                  <option value="Loyer">Loyer officine</option>
                  <option value="Autre">Autre dépense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Montant prélevé de la caisse (DZD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="ex: 1500.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Justificatif *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Achat de 10 rouleaux thermique 80mm"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  Enregistrer la Sortie de Caisse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
