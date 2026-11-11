import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface PsychotropePrescriptionModalProps {
  patientNameDefault: string;
  onConfirm: (prescription: {
    doctorName: string;
    prescriptionDate: string;
    ordNumber: string;
    patientName: string;
    patientIdCard: string;
    patientAddress: string;
  }) => void;
  onCancel: () => void;
}

export const PsychotropePrescriptionModal: React.FC<PsychotropePrescriptionModalProps> = ({
  patientNameDefault,
  onConfirm,
  onCancel,
}) => {
  const [doctorName, setDoctorName] = useState('Dr. Tarek CHERIF (Psychiatre)');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [ordNumber, setOrdNumber] = useState(`ORD-PSY-2026/${Math.floor(100 + Math.random() * 900)}`);
  const [patientName, setPatientName] = useState(patientNameDefault || '');
  const [patientIdCard, setPatientIdCard] = useState('CNI-16/0091823');
  const [patientAddress, setPatientAddress] = useState('Bab El Oued, Alger');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim()) {
      setError('Le nom du médecin prescripteur est obligatoire selon la loi algérienne.');
      return;
    }
    if (!ordNumber.trim()) {
      setError('Le numéro de l\'ordonnance souche est obligatoire.');
      return;
    }
    if (!patientName.trim()) {
      setError('L\'identité du patient est obligatoire.');
      return;
    }

    onConfirm({
      doctorName: doctorName.trim(),
      prescriptionDate,
      ordNumber: ordNumber.trim(),
      patientName: patientName.trim(),
      patientIdCard: patientIdCard.trim(),
      patientAddress: patientAddress.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Warning Header */}
        <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                Substance Psychotrope / المؤثرات العقلية
              </h3>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Enregistrement obligatoire au Registre Réglementaire (Lois 04-18 & 23-05)
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Fermer"
            className="p-1 rounded-md text-amber-600 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Médecin Prescripteur *
              </label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Nom Prénom (Spécialité)"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                N° Ordonnance Souche *
              </label>
              <input
                type="text"
                required
                value={ordNumber}
                onChange={(e) => setOrdNumber(e.target.value)}
                placeholder="ex: ORD-PSY-2026/89"
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date de l'Ordonnance *
              </label>
              <input
                type="date"
                required
                value={prescriptionDate}
                onChange={(e) => setPrescriptionDate(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Identité du Malade *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nom et Prénom du patient"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                N° Carte d'Identité / Permis
              </label>
              <input
                type="text"
                value={patientIdCard}
                onChange={(e) => setPatientIdCard(e.target.value)}
                placeholder="ex: CNI-16/0948211"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Adresse de résidence
              </label>
              <input
                type="text"
                value={patientAddress}
                onChange={(e) => setPatientAddress(e.target.value)}
                placeholder="Commune, Wilaya"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-[11px] text-slate-600 dark:text-slate-300">
            Cette dispensation sera automatiquement inscrite avec traçabilité complète dans le <strong>Registre Officiel des Psychotropes</strong> de la pharmacie.
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" /> Valider & Consigner au Registre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
