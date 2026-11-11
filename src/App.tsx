/**
 * XpertPharm DZ - Système Intégré de Gestion de Pharmacie d'Officine & CHIFA
 * Développé selon la réglementation et les normes pharmaceutiques algériennes
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { POSScreen } from './components/pos/POSScreen';
import { ChifaManager } from './components/chifa/ChifaManager';
import { ProductsCatalog } from './components/products/ProductsCatalog';
import { StockBatchesManager } from './components/stock/StockBatchesManager';
import { PurchasesManager } from './components/purchases/PurchasesManager';
import { PsychotropesRegister } from './components/psychotropes/PsychotropesRegister';
import { CashManager } from './components/caisse/CashManager';
import { SettingsAndAudit } from './components/settings/SettingsAndAudit';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Handle URL query parameters (e.g. ?autostart=1, ?tab=POS)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const autoStart = params.get('autostart');

    if (tabParam && ['DASHBOARD', 'POS', 'CHIFA', 'PRODUCTS', 'STOCK', 'PURCHASES', 'PSYCHOTROPES', 'CASH', 'SETTINGS'].includes(tabParam.toUpperCase())) {
      setActiveTab(tabParam.toUpperCase());
    } else if (autoStart === '1') {
      setActiveTab('POS');
    }
  }, []);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500/20 selection:text-emerald-900">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDark={isDark}
        onToggleDark={toggleDarkMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'DASHBOARD' && (
          <DashboardOverview onNavigate={setActiveTab} />
        )}
        {activeTab === 'POS' && <POSScreen />}
        {activeTab === 'CHIFA' && <ChifaManager />}
        {activeTab === 'PRODUCTS' && <ProductsCatalog />}
        {activeTab === 'STOCK' && <StockBatchesManager />}
        {activeTab === 'PURCHASES' && <PurchasesManager />}
        {activeTab === 'PSYCHOTROPES' && <PsychotropesRegister />}
        {activeTab === 'CASH' && <CashManager />}
        {activeTab === 'SETTINGS' && <SettingsAndAudit />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>XpertPharm DZ</strong> · Conforme aux nomenclatures CNAS, CASNOS, Ministère de la Santé (MSPRH Algérie)
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Règles FEFO · Tarifs PPA/SHP</span>
            <span>·</span>
            <span>Ordonnancier Psychotropes</span>
            <span>·</span>
            <span>Monnaie: DZD (د.ج)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
