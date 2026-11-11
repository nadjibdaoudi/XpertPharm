import React, { useState } from 'react';
import { usePharmacyStore, PharmacyDB } from '../../services/dbStore';
import {
  Activity,
  ShoppingCart,
  ShieldCheck,
  Pill,
  Boxes,
  Truck,
  Lock,
  Wallet,
  Settings,
  Moon,
  Sun,
  User,
  Check,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isDark,
  onToggleDark,
}) => {
  const state = usePharmacyStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { id: 'DASHBOARD', label: 'Tableau de bord', labelAr: 'الرئيسية', icon: Activity },
    { id: 'POS', label: 'Vente POS (F2)', labelAr: 'البيع', icon: ShoppingCart },
    { id: 'CHIFA', label: 'CHIFA CNAS', labelAr: 'الشفاء', icon: ShieldCheck },
    { id: 'PRODUCTS', label: 'Médicaments', labelAr: 'الأدوية', icon: Pill },
    { id: 'STOCK', label: 'Stock & DLU', labelAr: 'المخزون', icon: Boxes },
    { id: 'PURCHASES', label: 'Grossistes', labelAr: 'المشتريات', icon: Truck },
    { id: 'PSYCHOTROPES', label: 'Psychotropes', labelAr: 'المؤثرات', icon: Lock },
    { id: 'CASH', label: 'Caisse & Z', labelAr: 'الصندوق', icon: Wallet },
    { id: 'SETTINGS', label: 'Paramètres', labelAr: 'الإعدادات', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
        {/* Zone 1: Brand Wordmark (Single Line) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold shadow-sm">
            <span className="text-xl leading-none">✚</span>
          </div>
          <div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onTabChange('DASHBOARD');
              }}
              className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap"
            >
              XpertPharm <span className="text-emerald-600 font-black">DZ</span>
            </a>
            <div className="text-[10px] text-slate-400 font-medium leading-none">
              Système Officine & CHIFA Algérie
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Whitespace-nowrap single line) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Active User, Cash Indicator & Theme Switch */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Cash indicator */}
          {state.currentCashSession ? (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="tabular-nums">
                Caisse: {state.currentCashSession.expectedCashInDrawer.toFixed(0)} DA
              </span>
            </div>
          ) : (
            <span className="hidden sm:inline-block text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
              Caisse Fermée
            </span>
          )}

          {/* Theme toggle */}
          <button
            onClick={onToggleDark}
            aria-label="Basculer thème sombre / clair"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 flex items-center justify-center font-bold text-[10px]">
                {state.currentUser.name[0]}
              </div>
              <span className="hidden sm:inline truncate max-w-[110px]">
                {state.currentUser.name.split(' ')[0]}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white">{state.currentUser.name}</div>
                  <div className="text-[11px] text-slate-500">{state.currentUser.role.replace('_', ' ')}</div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Changer d'utilisateur (Comptoir)
                  </div>
                  {state.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        PharmacyDB.setCurrentUser(u);
                        setShowUserMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      <div>
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-[10px] text-slate-500">{u.role.replace('_', ' ')}</div>
                      </div>
                      {state.currentUser.id === u.id && (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Tabs */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950/40">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 text-xs font-medium ${
              activeTab === item.id
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
