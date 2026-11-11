import React, { useState } from 'react';
import { usePharmacyStore } from '../../services/dbStore';
import { evaluateExpiryStatus } from '../../services/fefo';
import { Sale } from '../../types/pharmacy';
import { ReceiptModal } from '../common/ReceiptModal';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShoppingCart,
  Boxes,
  Lock,
  Receipt,
  FileCheck2,
  Calendar,
  CheckCircle,
} from 'lucide-react';

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const state = usePharmacyStore();
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  const session = state.currentCashSession;

  // Calculate stats
  const totalSalesCount = state.sales.length;
  const totalDailyRevenue = session ? session.totalCashSales + session.totalChifaSales + session.totalCardSales : 0;
  const totalChifaPart = session ? session.totalChifaSales : 0;
  const totalCashPart = session ? session.totalCashSales : 0;

  // Expiry alerts
  const criticalBatches = state.batches.filter((b) => {
    const status = evaluateExpiryStatus(b.expiryDate).status;
    return (status === 'CRITICAL' || status === 'EXPIRED') && b.currentQty > 0;
  });

  // Low stock products
  const lowStockProducts = state.products.filter((p) => p.totalStock <= p.minStockAlert);

  // Recent sales
  const recentSales = state.sales.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Tableau de Bord Officine · {state.pharmacy.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Wilaya: {state.pharmacy.wilaya} · Titulaire: {state.pharmacy.titulaireName} · Session en cours: {session ? session.sessionNumber : 'Fermée'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('POS')}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" /> Vente Comptoir POS (F2)
          </button>
          <button
            onClick={() => onNavigate('CHIFA')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Espace CHIFA
          </button>
        </div>
      </div>

      {/* Main KPI Strip in Algerian Dinars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Chiffre d'Affaires du Jour</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
            {totalDailyRevenue.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} <span className="text-xs font-semibold">DZD</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Espèces: {totalCashPart.toFixed(0)} DA</span>
            <span>· CHIFA: {totalChifaPart.toFixed(0)} DA</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Part Tiers-Payant CHIFA</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {totalChifaPart.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} <span className="text-xs font-semibold">DZD</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalDailyRevenue > 0 ? ((totalChifaPart / totalDailyRevenue) * 100).toFixed(1) : 0}% du volume total de l'officine
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Ordonnances Psychotropes</span>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {state.psychotropes.length} <span className="text-xs font-medium">Inscriptions</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Conformes au registre officiel coté et paraphé
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Alertes Péremption / DLU</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 tabular-nums">
            {criticalBatches.length} <span className="text-xs font-medium">Lots urgents</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lowStockProducts.length} Ruptures ou stocks bas
          </div>
        </div>
      </div>

      {/* Two Column Grid: Critical Alerts vs Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Alerts Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Vigilance Péremption & Ruptures / تنبيهات الصلاحية
            </h3>
            <button
              onClick={() => onNavigate('STOCK')}
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
            >
              Voir tout le stock <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {criticalBatches.length === 0 && lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Aucune alerte critique. Tous les lots sont conformes et les stocks sont suffisants.
              </div>
            ) : (
              <>
                {criticalBatches.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-red-900 dark:text-red-200">
                        {b.productName}
                      </div>
                      <div className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
                        Lot: {b.batchNumber} · DLU: {b.expiryDate} (FEFO Prioritaire)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-800 dark:text-red-300 tabular-nums">
                        {b.currentQty} btes
                      </div>
                      <div className="text-[10px] text-red-600">Empl: {b.location}</div>
                    </div>
                  </div>
                ))}

                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-amber-900 dark:text-amber-200">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                        {p.dciName} · Seuil d'alerte: {p.minStockAlert} btes
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-800 dark:text-amber-300 tabular-nums">
                        Stock: {p.totalStock} btes
                      </div>
                      <div className="text-[10px] text-amber-600">Commander au grossiste</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recent Counter Sales Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> Dernières Ventes Encaissées / آخر المبيعات
            </h3>
            <span className="text-xs text-slate-400">Total: {state.sales.length} ventes</span>
          </div>

          <div className="space-y-2">
            {recentSales.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Aucune vente récente enregistrée. Les tickets apparaîtront ici dès le premier encaissement.
              </div>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs hover:border-emerald-500 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {sale.saleNumber}
                      </span>
                      {sale.isChifa && (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded">
                          CHIFA
                        </span>
                      )}
                      {sale.hasPsychotrope && (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold rounded">
                          TAB A
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {sale.customerName} · {sale.items.length} produit(s) · {sale.timestamp.substring(11, 16)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {sale.totalPpa.toFixed(2)} DA
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {sale.isChifa ? `Patient: ${sale.partAssure.toFixed(2)} DA` : 'Espèces'}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSaleForReceipt(sale)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                      title="Imprimer / Rééditer le ticket"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sale Receipt Modal */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          pharmacy={state.pharmacy}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}
    </div>
  );
};
