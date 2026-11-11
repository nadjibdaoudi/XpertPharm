import React, { useState } from 'react';
import { usePharmacyStore } from '../../services/dbStore';
import {
  AlertTriangle,
  Printer,
  Search,
  Shield,
  FileCheck,
  Building2,
  Lock,
} from 'lucide-react';

export const PsychotropesRegister: React.FC = () => {
  const state = usePharmacyStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = state.psychotropes.filter((entry) => {
    const q = searchTerm.toLowerCase();
    return (
      entry.productName.toLowerCase().includes(q) ||
      entry.doctorName.toLowerCase().includes(q) ||
      entry.patientName.toLowerCase().includes(q) ||
      entry.ordNumber.toLowerCase().includes(q) ||
      entry.batchNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 dark:border-amber-900/40 pb-4 bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
              Registre Officiel des Substances Psychotropes & Stupéfiants
            </h2>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              Conforme aux dispositions de la Loi algérienne n° 04-18 et 23-05 · Registre réglementaire coté et paraphé
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Printer className="w-4 h-4" /> Imprimer Registre Réglementaire / طباعة السجل
        </button>
      </div>

      {/* Legal Notice */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-900 dark:text-white">
            Obligation légale de traçabilité des médicaments psychotropes (Tableau A):
          </div>
          <p>
            Chaque dispensation doit mentionner le nom et l'adresse du prescripteur, la date de l'ordonnance, l'identité et l'adresse du malade, ainsi que le numéro de lot et le reliquat exact en stock.
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par Malade, Médecin prescripteur, N° Ordonnance, Médicament ou Lot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
          {filteredEntries.length} Enregistrements cotés
        </span>
      </div>

      {/* Official Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <th className="py-3 px-3">N° d'Ordre</th>
                <th className="py-3 px-3">Date Dispensation</th>
                <th className="py-3 px-3">N° Ordonnance</th>
                <th className="py-3 px-3">Médecin Prescripteur</th>
                <th className="py-3 px-3">Patient (Identité & CNI)</th>
                <th className="py-3 px-3">Médicament & Dosage</th>
                <th className="py-3 px-3">N° Lot</th>
                <th className="py-3 px-2 text-center">Qté Déli.</th>
                <th className="py-3 px-2 text-center">Reste Stock</th>
                <th className="py-3 px-4">Pharmacien Validateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Aucune entrée trouvée dans l'ordonnancier des psychotropes.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-800 dark:text-amber-400">
                      #{String(index + 1).padStart(4, '0')}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                      {entry.entryDate}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                      {entry.ordNumber}
                      <div className="text-[10px] text-slate-400">du {entry.prescriptionDate}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{entry.doctorName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{entry.patientName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{entry.patientIdCard || 'CNI Non précisée'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{entry.patientAddress}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{entry.productName}</div>
                      <div className="text-[10px] text-slate-500">{entry.dciName} ({entry.dosage})</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {entry.batchNumber}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                      {entry.quantityDispensed} bte
                    </td>
                    <td className="py-3 px-2 text-center font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {entry.stockRemainingAfter}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                      {entry.pharmacistName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
