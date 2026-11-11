import React, { useState } from 'react';
import { usePharmacyStore } from '../../services/dbStore';
import { ChifaBordereau, SocialInsuranceCaisse } from '../../types/pharmacy';
import {
  ShieldCheck,
  Send,
  FileText,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Printer,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';

export const ChifaManager: React.FC = () => {
  const state = usePharmacyStore();
  const [selectedCaisse, setSelectedCaisse] = useState<SocialInsuranceCaisse | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'BORDEREAUX' | 'REJETS' | 'SIMULATION'>('BORDEREAUX');
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState<string | null>(null);

  // Filter bordereaux
  const filteredBordereaux = state.bordereaux.filter((b) =>
    selectedCaisse === 'ALL' ? true : b.caisse === selectedCaisse
  );

  const totalReclameCnas = state.bordereaux
    .filter((b) => b.caisse === 'CNAS')
    .reduce((acc, b) => acc + b.totalClaimedCaisse, 0);

  const totalReclameCasnos = state.bordereaux
    .filter((b) => b.caisse === 'CASNOS')
    .reduce((acc, b) => acc + b.totalClaimedCaisse, 0);

  // Rejections sample
  const rejectedClaims = [
    {
      id: 'rej-1',
      claimNumber: 'FAC-CHIFA-000088',
      insuredNss: '184061601245',
      insuredName: 'BENALI Ahmed',
      date: '2026-11-04',
      caisse: 'CNAS' as SocialInsuranceCaisse,
      amountCaisse: 4200.00,
      reason: 'Dépassement du plafond trimestriel autorisé sans entente préalable',
      codeRejet: 'REJ-CNAS-P04',
      canRecycle: true,
    },
    {
      id: 'rej-2',
      claimNumber: 'FAC-CHIFA-000094',
      insuredNss: '191033100882',
      insuredName: 'MEZIANE Karim',
      date: '2026-11-06',
      caisse: 'CNAS' as SocialInsuranceCaisse,
      amountCaisse: 1680.00,
      reason: 'Date de validité des droits expirée sur le serveur central',
      codeRejet: 'REJ-CNAS-D01',
      canRecycle: true,
    },
  ];

  const handleTransmit = (bordereauId: string) => {
    setIsTransmitting(true);
    setTransmissionSuccess(null);

    setTimeout(() => {
      setIsTransmitting(false);
      setTransmissionSuccess(`Bordereau télétransmis avec succès au serveur de liquidation CNAS/CASNOS (Accusé de réception n° AR-${Date.now().toString().slice(-6)})`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Module CHIFA & Télétransmission Sécurité Sociale
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Conventions CNAS (N° {state.pharmacy.codeChifaCnas}) · CASNOS (N° {state.pharmacy.codeChifaCasnos}) · Tiers-Payant Officine
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nouveau Bordereau CHIFA
          </button>
        </div>
      </div>

      {transmissionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{transmissionSuccess}</span>
          </div>
          <button
            onClick={() => setTransmissionSuccess(null)}
            className="text-xs text-emerald-700 hover:underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Réclamé CNAS en cours</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totalReclameCnas.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">DZD</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Salariés & Ayants-droit conventionnés</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Réclamé CASNOS en cours</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {totalReclameCasnos.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} <span className="text-xs font-bold">DZD</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Non-salariés & Commerçants conventionnés</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Dossiers Rejetés / À Recycler</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {rejectedClaims.length} <span className="text-xs font-bold">Dossiers (5,880.00 DZD)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Nécessite vérification des pièces justificatives</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('BORDEREAUX')}
            className={`pb-2.5 text-xs font-bold transition-all relative ${
              activeTab === 'BORDEREAUX'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Bordereaux de Télétransmission ({state.bordereaux.length})
          </button>
          <button
            onClick={() => setActiveTab('REJETS')}
            className={`pb-2.5 text-xs font-bold transition-all relative ${
              activeTab === 'REJETS'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Gestion des Rejets ({rejectedClaims.length})
          </button>
        </div>

        {activeTab === 'BORDEREAUX' && (
          <div className="flex items-center gap-1.5 pb-2">
            <span className="text-xs text-slate-500 font-medium">Filtrer par Caisse:</span>
            <select
              value={selectedCaisse}
              onChange={(e) => setSelectedCaisse(e.target.value as any)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Toutes les Caisses</option>
              <option value="CNAS">CNAS uniquement</option>
              <option value="CASNOS">CASNOS uniquement</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB CONTENT: BORDEREAUX */}
      {activeTab === 'BORDEREAUX' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <th className="py-3 px-4">N° Bordereau</th>
                <th className="py-3 px-3">Caisse</th>
                <th className="py-3 px-3">Date Création</th>
                <th className="py-3 px-3 text-center">Nbre Factures</th>
                <th className="py-3 px-3 text-right">Total PPA Brut</th>
                <th className="py-3 px-3 text-right">Part Caisse Réclamée</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBordereaux.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {b.bordereauNumber}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.caisse === 'CNAS' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {b.caisse}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                    {b.dateCreated}
                  </td>
                  <td className="py-3.5 px-3 text-center tabular-nums font-semibold">
                    {b.claimsCount}
                  </td>
                  <td className="py-3.5 px-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {b.totalPpa.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
                  </td>
                  <td className="py-3.5 px-3 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    {b.totalClaimedCaisse.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
                  </td>
                  <td className="py-3.5 px-3">
                    {b.status === 'TRANSMITTED' ? (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <Clock className="w-3.5 h-3.5" /> Transmis (En cours)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Validé & Virement effectué
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleTransmit(b.id)}
                        disabled={isTransmitting}
                        title="Télétransmettre au serveur CNAS"
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Télétransmettre
                      </button>
                      <button
                        onClick={() => window.print()}
                        title="Imprimer l'état récapitulatif officiel"
                        className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: REJETS */}
      {activeTab === 'REJETS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Traitement des Rejets & Factures Contestées CNAS / CASNOS
              </span>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-300">
              Recyclage et réémission des factures après mise à jour des droits
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <th className="py-3 px-4">N° Facture</th>
                <th className="py-3 px-3">Assuré / NSS</th>
                <th className="py-3 px-3">Date Soins</th>
                <th className="py-3 px-3">Caisse</th>
                <th className="py-3 px-3">Motif du Rejet</th>
                <th className="py-3 px-3 text-right">Montant Rejeté</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rejectedClaims.map((rej) => (
                <tr key={rej.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {rej.claimNumber}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{rej.insuredName}</div>
                    <div className="text-[10px] font-mono text-slate-500">{rej.insuredNss}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{rej.date}</td>
                  <td className="py-3 px-3 font-semibold">{rej.caisse}</td>
                  <td className="py-3 px-3 text-red-600 dark:text-red-400 font-medium">
                    <div>{rej.reason}</div>
                    <div className="text-[10px] text-slate-400">{rej.codeRejet}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                    {rej.amountCaisse.toFixed(2)} DA
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => alert(`Dossier ${rej.claimNumber} recyclé et remis dans le prochain lot de télétransmission!`)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded"
                    >
                      Recycler la facture
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: New Bordereau Creation */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Générer un Nouveau Bordereau CHIFA
            </h3>
            <p className="text-xs text-slate-500">
              Regroupe toutes les factures en attente pour la caisse sélectionnée dans un lot prêt à télétransmettre.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organisme Payeur (Caisse)
                </label>
                <select className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5">
                  <option value="CNAS">CNAS - Caisse Nationale des Assurances Sociales</option>
                  <option value="CASNOS">CASNOS - Caisse de Sécurité Sociale des Non-Salariés</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Période de clôture
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setTransmissionSuccess('Bordereau BRD-CNAS-16/2026-043 généré avec succès avec 12 factures!');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Générer & Clôturer le Lot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
