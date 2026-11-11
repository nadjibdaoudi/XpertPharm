import React, { useState } from 'react';
import { Customer, SocialInsuranceCaisse } from '../../types/pharmacy';
import { SAMPLE_CHIFA_CARDS, ChifaSmartCardData, validateAlgerianNss } from '../../services/chifa';
import { CreditCard, Check, X, ShieldAlert, Cpu } from 'lucide-react';

interface ChifaCardModalProps {
  onSelectCustomer: (customer: Customer, dependentName?: string) => void;
  onClose: () => void;
  currentCustomer?: Customer;
}

export const ChifaCardModal: React.FC<ChifaCardModalProps> = ({
  onSelectCustomer,
  onClose,
  currentCustomer,
}) => {
  const [selectedCard, setSelectedCard] = useState<ChifaSmartCardData>(SAMPLE_CHIFA_CARDS[0]);
  const [selectedDependent, setSelectedDependent] = useState<string>('Lui-même (Assuré)');
  const [isReadingCard, setIsReadingCard] = useState<boolean>(false);
  const [readSuccess, setReadSuccess] = useState<boolean>(false);

  // Manual input mode
  const [isManual, setIsManual] = useState<boolean>(false);
  const [manualNss, setManualNss] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [manualCaisse, setManualCaisse] = useState<SocialInsuranceCaisse>('CNAS');
  const [manualRate, setManualRate] = useState<80 | 100>(100);
  const [manualError, setManualError] = useState<string>('');

  const handleSimulateRead = (card: ChifaSmartCardData) => {
    setSelectedCard(card);
    setIsReadingCard(true);
    setReadSuccess(false);

    setTimeout(() => {
      setIsReadingCard(false);
      setReadSuccess(true);
    }, 450);
  };

  const handleApplyCard = () => {
    if (isManual) {
      if (!validateAlgerianNss(manualNss)) {
        setManualError('Le numéro de sécurité sociale doit contenir 12 chiffres valides.');
        return;
      }
      if (!manualName.trim()) {
        setManualError('Veuillez saisir le nom complet de l\'assuré.');
        return;
      }

      const manualCustomer: Customer = {
        id: `cst-man-${Date.now()}`,
        fullName: manualName.toUpperCase(),
        nss: manualNss,
        caisse: manualCaisse,
        isChronic: manualRate === 100,
        reimbursementRate: manualRate,
        currentCredit: 0,
        chifaCardValidUntil: '2028-12-31',
      };
      onSelectCustomer(manualCustomer, manualName);
      onClose();
      return;
    }

    const customer: Customer = {
      id: `cst-${selectedCard.nss}`,
      fullName: selectedCard.insuredName,
      nss: selectedCard.nss,
      caisse: selectedCard.caisse,
      isChronic: selectedCard.isChronic,
      reimbursementRate: selectedCard.rate,
      currentCredit: 0,
      chifaCardValidUntil: selectedCard.expirationDate,
    };

    const beneficiary = selectedDependent === 'Lui-même (Assuré)' ? selectedCard.insuredName : selectedDependent;
    onSelectCustomer(customer, beneficiary);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-700 text-white">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-200" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                Lecteur Carte CHIFA / قارئ بطاقة الشفاء
              </h3>
              <p className="text-xs text-emerald-100">
                Simulation de lecture de puce SAM & Tiers-Payant Sécurité Sociale Algérienne
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-1 rounded-md text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Mode switch */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Source des droits de l'assuré:
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setIsManual(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  !isManual
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Carte Puce (Simulation)
              </button>
              <button
                type="button"
                onClick={() => setIsManual(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  isManual
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Saisie Manuelle NSS
              </button>
            </div>
          </div>

          {!isManual ? (
            <>
              {/* Presets of real cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Sélectionner une carte CHIFA insérée dans le lecteur:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {SAMPLE_CHIFA_CARDS.map((card) => {
                    const isSelected = selectedCard.nss === card.nss;
                    return (
                      <button
                        key={card.nss}
                        type="button"
                        onClick={() => handleSimulateRead(card)}
                        className={`p-3 rounded-lg border text-left transition-all relative ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-slate-900 dark:text-white ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{card.caisse}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${card.rate === 100 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'}`}>
                            {card.rate}% {card.isChronic ? 'ALD' : ''}
                          </span>
                        </div>
                        <div className="text-xs font-semibold truncate">{card.insuredName}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-1">{card.nss}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Realistic Green Card Visual Preview */}
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white p-5 shadow-lg border border-emerald-600/60">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold">
                      République Algérienne Démocratique et Populaire
                    </div>
                    <div className="text-sm font-extrabold tracking-wide text-white">
                      CARTE CHIFA · بطاقة الشفاء
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-emerald-900/70 text-[11px] font-bold text-emerald-200 border border-emerald-500/40">
                    {selectedCard.caisse} · Agence {selectedCard.agencyCode}
                  </div>
                </div>

                {/* Chip graphic */}
                <div className="flex items-center gap-4 my-2">
                  <div className="w-10 h-8 rounded bg-gradient-to-tr from-amber-300 to-amber-100 border border-amber-400 shadow-inner flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-amber-800/80" />
                  </div>
                  <div className="text-xs font-mono tracking-wider font-semibold">
                    {selectedCard.nss.replace(/(\d{4})/g, '$1 ')}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-600/40 flex justify-between items-end text-xs">
                  <div>
                    <div className="text-[10px] text-emerald-200">ASSURÉ SOCIAL:</div>
                    <div className="font-bold text-sm tracking-wide">{selectedCard.insuredName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-emerald-200">TAUX / EXPIRATION:</div>
                    <div className="font-bold">
                      {selectedCard.rate}% {selectedCard.isChronic ? '(Chronique ALD)' : ''} · {selectedCard.expirationDate}
                    </div>
                  </div>
                </div>

                {isReadingCard && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-xs font-medium">Lecture des certificats SAM en cours...</span>
                  </div>
                )}
              </div>

              {/* Beneficiary / Ayant-droit selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Bénéficiaire de l'ordonnance (Ayant-droit):
                </label>
                <select
                  value={selectedDependent}
                  onChange={(e) => setSelectedDependent(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Lui-même (Assuré)">
                    Assuré lui-même: {selectedCard.insuredName}
                  </option>
                  {selectedCard.dependents.map((dep, idx) => (
                    <option key={idx} value={dep.name}>
                      {dep.name} ({dep.relationship === 'CONJOINT' ? 'Époux/se' : 'Enfant'} - Né(e) le {dep.birthDate})
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            /* Manual Entry */
            <div className="space-y-3.5">
              {manualError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{manualError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  N° Sécurité Sociale (12 chiffres algériens) *
                </label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="ex: 184061601245"
                  value={manualNss}
                  onChange={(e) => {
                    setManualNss(e.target.value.replace(/\D/g, ''));
                    setManualError('');
                  }}
                  className="w-full font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  12 chiffres (Sexe + Année + Mois + Wilaya + Centre + Numéro)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom et Prénom de l'assuré *
                </label>
                <input
                  type="text"
                  placeholder="ex: BENALI Ahmed"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Caisse de Sécurité Sociale
                  </label>
                  <select
                    value={manualCaisse}
                    onChange={(e) => setManualCaisse(e.target.value as SocialInsuranceCaisse)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CNAS">CNAS (Salariés)</option>
                    <option value="CASNOS">CASNOS (Non-salariés)</option>
                    <option value="CNR">CNR (Retraités)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Taux de prise en charge
                  </label>
                  <select
                    value={manualRate}
                    onChange={(e) => setManualRate(Number(e.target.value) as 80 | 100)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={100}>100% (Affection Longue Durée / ALD)</option>
                    <option value={80}>80% (Régime Normal)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Annuler / إلغاء
          </button>
          <button
            type="button"
            onClick={handleApplyCard}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" /> Valider les Droits CHIFA / تأكيد
          </button>
        </div>
      </div>
    </div>
  );
};
