import React from 'react';
import { Sale, PharmacyProfile } from '../../types/pharmacy';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale;
  pharmacy: PharmacyProfile;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, pharmacy, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ticket de Vente & Vignettes / تذكرة الصندوق
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer le ticket"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-800 dark:text-slate-200 print:text-black print:bg-white bg-slate-50/50 dark:bg-slate-950/40">
          <div className="border border-dashed border-slate-300 dark:border-slate-700 p-5 bg-white dark:bg-slate-900 rounded-lg shadow-xs">
            {/* Pharmacy Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
              <h4 className="font-bold text-sm tracking-tight text-slate-950 dark:text-white uppercase font-sans">
                {pharmacy.name}
              </h4>
              <p className="text-[11px] text-slate-500 font-sans">{pharmacy.nameAr}</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                Titulaire: {pharmacy.titulaireName}
              </p>
              <p className="text-[10px] text-slate-500">
                Agrément: {pharmacy.numAgrement} · Tél: {pharmacy.phone.split('/')[0]}
              </p>
              <p className="text-[10px] text-slate-500">{pharmacy.address}</p>
            </div>

            {/* Sale Metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 flex justify-between text-[11px]">
              <div>
                <p><span className="text-slate-500">Ticket:</span> {sale.saleNumber}</p>
                <p><span className="text-slate-500">Date:</span> {sale.timestamp}</p>
              </div>
              <div className="text-right">
                <p><span className="text-slate-500">Vendeur:</span> {sale.userName.split(' ')[0]}</p>
                <p><span className="text-slate-500">Client:</span> {sale.customerName?.substring(0, 15) || 'Comptoir'}</p>
              </div>
            </div>

            {/* CHIFA Badge if applicable */}
            {sale.isChifa && (
              <div className="my-2 p-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> TIERS-PAYANT CHIFA
                </span>
                <span>CNAS / CASNOS</span>
              </div>
            )}

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1">
                    <th className="font-medium pb-1">Désignation / Lot</th>
                    <th className="font-medium text-center pb-1">Qté</th>
                    <th className="font-medium text-right pb-1">PPA</th>
                    <th className="font-medium text-right pb-1">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {sale.items.map((it, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1.5 pr-1">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{it.productName}</div>
                        <div className="text-[9px] text-slate-500">
                          Lot: {it.batchNumber} · DLU: {it.expiryDate}
                        </div>
                      </td>
                      <td className="text-center align-top py-1.5">{it.quantity}</td>
                      <td className="text-right align-top py-1.5 tabular-nums">{it.unitPpa.toFixed(2)}</td>
                      <td className="text-right align-top py-1.5 tabular-nums font-semibold">
                        {it.totalPpa.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Total PPA Brut:</span>
                <span className="font-semibold tabular-nums">{sale.totalPpa.toFixed(2)} DZD</span>
              </div>

              {sale.isChifa && (
                <>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                    <span>Part Sécurité Sociale (Caisse):</span>
                    <span className="tabular-nums">-{sale.partCaisse.toFixed(2)} DZD</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-white font-bold text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Part Patient (Ticket Modérateur):</span>
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                      {sale.partAssure.toFixed(2)} DZD
                    </span>
                  </div>
                </>
              )}

              {!sale.isChifa && (
                <div className="flex justify-between text-slate-900 dark:text-white font-bold text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>NET À PAYER:</span>
                  <span className="tabular-nums">{sale.totalNet.toFixed(2)} DZD</span>
                </div>
              )}

              {/* Payments breakdown */}
              <div className="pt-2 border-t border-dotted border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
                <span className="font-medium">Mode de règlement:</span>{' '}
                {sale.payments.map((p) => `${p.method === 'CASH' ? 'Espèces' : p.method === 'CARD_CIB_DAHABIA' ? 'Carte CIB/Dahabia' : p.method === 'CHIFA_TIERS_PAYANT' ? 'CHIFA' : 'Crédit'} (${p.amount.toFixed(2)} DA)`).join(', ')}
              </div>
            </div>

            {/* Vignette Barcode Graphic (Algerian standard 13-digit code) */}
            <div className="mt-3 pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 text-center">
              <div className="inline-block bg-slate-950 text-white font-mono px-3 py-1 rounded text-[10px] tracking-widest uppercase">
                |||| | ||||| || |||||| | |||
              </div>
              <p className="text-[9px] text-slate-400 mt-1">
                {sale.saleNumber} · Vignette conforme MSPRH Algérie
              </p>
              <p className="text-[9px] text-slate-500 mt-2 font-sans italic">
                Merci pour votre confiance · نتمنى لكم الشفاء العاجل
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fermer / إغلاق
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" /> Imprimer Ticket / طباعة
          </button>
        </div>
      </div>
    </div>
  );
};
