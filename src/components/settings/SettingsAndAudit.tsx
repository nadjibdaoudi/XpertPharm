import React, { useState } from 'react';
import { usePharmacyStore, PharmacyDB } from '../../services/dbStore';
import { PharmacyProfile, User } from '../../types/pharmacy';
import {
  Settings,
  Shield,
  Users,
  Database,
  Download,
  Upload,
  History,
  Building,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export const SettingsAndAudit: React.FC = () => {
  const state = usePharmacyStore();
  const [activeTab, setActiveTab] = useState<'PHARMACY' | 'USERS' | 'AUDIT' | 'BACKUP'>('PHARMACY');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Pharmacy profile form
  const [pharmacyName, setPharmacyName] = useState(state.pharmacy.name);
  const [pharmacyNameAr, setPharmacyNameAr] = useState(state.pharmacy.nameAr);
  const [titulaire, setTitulaire] = useState(state.pharmacy.titulaireName);
  const [numAgrement, setNumAgrement] = useState(state.pharmacy.numAgrement);
  const [codeCnas, setCodeCnas] = useState(state.pharmacy.codeChifaCnas);
  const [codeCasnos, setCodeCasnos] = useState(state.pharmacy.codeChifaCasnos);
  const [nif, setNif] = useState(state.pharmacy.nif);
  const [wilaya, setWilaya] = useState(state.pharmacy.wilaya);
  const [phone, setPhone] = useState(state.pharmacy.phone);
  const [address, setAddress] = useState(state.pharmacy.address);

  // Import JSON state
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSavePharmacy = (e: React.FormEvent) => {
    e.preventDefault();
    PharmacyDB.updatePharmacyProfile({
      name: pharmacyName,
      nameAr: pharmacyNameAr,
      titulaireName: titulaire,
      numAgrement,
      codeChifaCnas: codeCnas,
      codeChifaCasnos: codeCasnos,
      nif,
      wilaya,
      phone,
      address,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExport = () => {
    const dataStr = PharmacyDB.exportDatabaseJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xpertpharm-dz-backup-${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    const ok = PharmacyDB.importDatabaseJson(importJsonText);
    if (ok) {
      setImportStatus('Base de données restaurée avec succès !');
      setImportJsonText('');
    } else {
      setImportStatus('Erreur: fichier JSON invalide ou corrompu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            Paramètres Officine, Utilisateurs & Journal d'Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Agréments ministériels, gestion des rôles (RBAC), sécurité et traçabilité des opérations
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Paramètres de l'officine mis à jour avec succès.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4">
        <button
          onClick={() => setActiveTab('PHARMACY')}
          className={`pb-2.5 text-xs font-bold transition-all relative ${
            activeTab === 'PHARMACY'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Coordonnées & Agréments
        </button>
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-2.5 text-xs font-bold transition-all relative ${
            activeTab === 'USERS'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Équipe & Rôles ({state.users.length})
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-2.5 text-xs font-bold transition-all relative ${
            activeTab === 'AUDIT'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Journal d'Audit ({state.auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`pb-2.5 text-xs font-bold transition-all relative ${
            activeTab === 'BACKUP'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Sauvegarde & Restauration
        </button>
      </div>

      {/* TAB 1: PHARMACY SETTINGS */}
      {activeTab === 'PHARMACY' && (
        <form onSubmit={handleSavePharmacy} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4 max-w-3xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nom de la Pharmacie (Français)
              </label>
              <input
                type="text"
                required
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                اسم الصيدلية (بالعربية)
              </label>
              <input
                type="text"
                required
                dir="rtl"
                value={pharmacyNameAr}
                onChange={(e) => setPharmacyNameAr(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pharmacien Titulaire
              </label>
              <input
                type="text"
                required
                value={titulaire}
                onChange={(e) => setTitulaire(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Numéro d'Agrément Ministériel
              </label>
              <input
                type="text"
                required
                value={numAgrement}
                onChange={(e) => setNumAgrement(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Code Convention CHIFA - CNAS
              </label>
              <input
                type="text"
                value={codeCnas}
                onChange={(e) => setCodeCnas(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Code Convention CHIFA - CASNOS
              </label>
              <input
                type="text"
                value={codeCasnos}
                onChange={(e) => setCodeCasnos(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Wilaya
              </label>
              <input
                type="text"
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Téléphone de l'Officine
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Adresse complète
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              Enregistrer les Coordonnées
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: USERS & RBAC */}
      {activeTab === 'USERS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden max-w-4xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <th className="py-3 px-4">Utilisateur / Nom</th>
                <th className="py-3 px-3">Rôle Officine</th>
                <th className="py-3 px-3">Code PIN</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.users.map((u) => {
                const isCurrent = state.currentUser.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {u.name}
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                            Session Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{u.email || `@${u.username}`}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      •••• ({u.pinCode})
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-600 font-medium">Actif</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isCurrent && (
                        <button
                          onClick={() => PharmacyDB.setCurrentUser(u)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded"
                        >
                          Basculer sur ce compte
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: AUDIT LOG */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" /> Traçabilité Complète des Actions (AuditLog)
            </span>
            <span className="text-slate-400">Enregistré localement avec horodatage</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-3">Utilisateur</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Entité</th>
                <th className="py-3 px-4">Détails de l'Opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {state.auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap font-sans">
                    {log.userName}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{log.entityType}</td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 font-sans">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'BACKUP' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Export card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Download className="w-5 h-5 text-emerald-600" />
              Sauvegarde de la Base de Données
            </div>
            <p className="text-xs text-slate-500">
              Téléchargez une copie intégrale au format JSON contenant tous les médicaments, lots, stocks, ventes, sessions de caisse et l'ordonnancier des psychotropes.
            </p>
            <button
              onClick={handleExport}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Exporter la Sauvegarde (JSON)
            </button>
          </div>

          {/* Import card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Upload className="w-5 h-5 text-blue-600" />
              Restauration de Base de Données
            </div>
            <p className="text-xs text-slate-500">
              Collez ici le contenu JSON d'une sauvegarde pour restaurer l'état complet de l'officine.
            </p>

            {importStatus && (
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-xs rounded text-slate-800 dark:text-slate-200">
                {importStatus}
              </div>
            )}

            <textarea
              rows={3}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Coller le texte JSON ici..."
              className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
            />

            <button
              onClick={handleImport}
              className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" /> Restaurer la Sauvegarde
            </button>
          </div>

          {/* Reset button */}
          <div className="md:col-span-2 pt-2">
            <button
              onClick={() => {
                if (confirm('Voulez-vous réinitialiser toutes les données vers l\'état initial de démonstration ?')) {
                  PharmacyDB.resetToDefault();
                  alert('Données réinitialisées avec succès!');
                }
              }}
              className="text-xs text-red-600 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser les données vers les données de démonstration algériennes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
