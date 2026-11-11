import React, { useState, useEffect, useRef } from 'react';
import {
  Product,
  Customer,
  Sale,
  PaymentBreakdown,
  PaymentMethod,
} from '../../types/pharmacy';
import { PharmacyDB, usePharmacyStore } from '../../services/dbStore';
import { calculateChifaReimbursement } from '../../services/chifa';
import { ChifaCardModal } from './ChifaCardModal';
import { PsychotropePrescriptionModal } from './PsychotropePrescriptionModal';
import { ReceiptModal } from '../common/ReceiptModal';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  UserCheck,
  CornerDownLeft,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

export const POSScreen: React.FC = () => {
  const state = usePharmacyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isChifaMode, setIsChifaMode] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(
    state.customers.find((c) => c.fullName.includes('Comptoir')) || state.customers[0]
  );
  const [beneficiaryName, setBeneficiaryName] = useState<string>('Client Comptoir');

  // Modals
  const [showChifaModal, setShowChifaModal] = useState<boolean>(false);
  const [showPsychotropeModal, setShowPsychotropeModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  // Psychotrope prescription metadata
  const [prescriptionData, setPrescriptionData] = useState<{
    doctorName: string;
    prescriptionDate: string;
    ordNumber: string;
    patientName: string;
    patientIdCard: string;
    patientAddress: string;
  } | null>(null);

  // Held Cart (Mise en attente)
  const [heldCart, setHeldCart] = useState<{
    cart: CartItem[];
    customer: Customer;
    isChifa: boolean;
  } | null>(null);

  // Payment modal state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [saleError, setSaleError] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input initially
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Global F1-F12 keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleNewSale();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsChifaMode((prev) => !prev);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) openCheckout();
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleToggleHoldCart();
      } else if (e.key === 'F9') {
        e.preventDefault();
        setShowChifaModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isChifaMode, heldCart]);

  // Filtered products for quick search
  const filteredProducts = searchTerm.trim()
    ? state.products.filter((p) => {
        const query = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.dciName.toLowerCase().includes(query) ||
          p.codeNational.includes(query) ||
          p.categoryName.toLowerCase().includes(query)
        );
      }).slice(0, 8)
    : [];

  const addToCart = (product: Product) => {
    if (product.totalStock <= 0) {
      alert(`Stock épuisé pour ${product.name}`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.totalStock) {
          alert(`Stock maximum disponible (${product.totalStock}) atteint.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.totalStock) {
              alert(`Stock maximum disponible (${item.product.totalStock}) atteint.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleNewSale = () => {
    setCart([]);
    setIsChifaMode(false);
    setPrescriptionData(null);
    setSaleError('');
    searchInputRef.current?.focus();
  };

  const handleToggleHoldCart = () => {
    if (cart.length > 0 && !heldCart) {
      setHeldCart({ cart, customer: selectedCustomer, isChifa: isChifaMode });
      setCart([]);
      setIsChifaMode(false);
    } else if (heldCart) {
      setCart(heldCart.cart);
      setSelectedCustomer(heldCart.customer);
      setIsChifaMode(heldCart.isChifa);
      setHeldCart(null);
    }
  };

  // CHIFA Calculation breakdown
  const chifaCalculationInput = cart.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    unitPpa: item.product.ppa,
    unitShp: item.product.shp,
    quantity: item.quantity,
    isReimbursable: item.product.isReimbursable,
    tableau: item.product.tableau,
  }));

  const chifaRate = selectedCustomer.isChronic || selectedCustomer.reimbursementRate === 100 ? 100 : 80;
  const chifaResults = calculateChifaReimbursement(chifaCalculationInput, chifaRate);

  const totalBrutPpa = cart.reduce((acc, it) => acc + it.product.ppa * it.quantity, 0);
  const partCaisse = isChifaMode ? chifaResults.totalPartCaisse : 0;
  const partAssure = isChifaMode ? chifaResults.totalPartPatient : totalBrutPpa;

  // Has psychotropes in current cart
  const hasPsychotropeInCart = cart.some(
    (item) => item.product.tableau === 'TABLEAU_A' || item.product.tableau === 'PSYCHOTROPE'
  );

  const openCheckout = () => {
    setSaleError('');
    if (hasPsychotropeInCart && !prescriptionData) {
      setShowPsychotropeModal(true);
      return;
    }
    setCashGiven(partAssure.toFixed(0));
    setShowPaymentModal(true);
  };

  const handleConfirmSale = () => {
    setSaleError('');
    const cashNum = parseFloat(cashGiven) || 0;

    const payments: PaymentBreakdown[] = [];

    if (isChifaMode && partCaisse > 0) {
      payments.push({
        method: 'CHIFA_TIERS_PAYANT',
        amount: partCaisse,
        reference: `CHIFA-${selectedCustomer.nss || 'NSS'}`,
      });
    }

    if (paymentMethod === 'CASH') {
      payments.push({
        method: 'CASH',
        amount: partAssure,
      });
    } else if (paymentMethod === 'CARD_CIB_DAHABIA') {
      payments.push({
        method: 'CARD_CIB_DAHABIA',
        amount: partAssure,
        reference: `TPE-CIB-${Date.now().toString().slice(-6)}`,
      });
    } else if (paymentMethod === 'CREDIT') {
      payments.push({
        method: 'CREDIT',
        amount: partAssure,
        reference: `Crédit ${selectedCustomer.fullName}`,
      });
    }

    const res = PharmacyDB.executeSale({
      items: cart.map((it) => ({
        productId: it.product.id,
        requestedQty: it.quantity,
      })),
      isChifa: isChifaMode,
      customer: selectedCustomer,
      prescription: prescriptionData || undefined,
      payments,
      partCaisse,
      partAssure,
    });

    if (!res.success) {
      setSaleError(res.error || 'Erreur lors de la validation');
      return;
    }

    setShowPaymentModal(false);
    setCart([]);
    setPrescriptionData(null);
    setLastCompletedSale(res.sale || null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-5rem)] pb-2 overflow-hidden">
      {/* LEFT COLUMN: Fast Scanner & Search & Catalogue Grid (60%) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Rapid Keyboard Shortcuts Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-bold shadow-2xs">F1</kbd> Scanner / Recherche
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-bold shadow-2xs">F2</kbd> Vente Comptoir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-bold shadow-2xs">F3</kbd> Mode CHIFA
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-bold shadow-2xs">F4</kbd> Encaisser
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-bold shadow-2xs">F7</kbd> {heldCart ? 'Reprendre Attente' : 'Mettre en Attente'}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-bold shadow-2xs">F9</kbd> Insérer Carte Chifa
            </span>
          </div>

          {heldCart && (
            <button
              onClick={handleToggleHoldCart}
              className="px-2.5 py-1 bg-amber-500 text-white rounded text-[10px] font-bold flex items-center gap-1 animate-pulse"
            >
              <Clock className="w-3.5 h-3.5" /> 1 Panier en attente (F7)
            </button>
          )}
        </div>

        {/* Live Search & Barcode Scanner Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Scanner code barre 13 chiffres, taper Nom de spécialité ou DCI (ex: Doliprane, Amoxicilline, Xanax)..."
              className="w-full pl-11 pr-24 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Instant Search Dropdown Results */}
          {filteredProducts.length > 0 && (
            <div className="mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60 max-h-60 overflow-y-auto">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.totalStock <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-emerald-50/60 dark:hover:bg-slate-700/80 transition-colors ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : ''
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          · {p.dciName}
                        </span>
                        {p.tableau === 'TABLEAU_A' && (
                          <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded">
                            PSYCHOTROPE
                          </span>
                        )}
                        {p.isReimbursable && (
                          <span className="text-emerald-600 text-[10px] font-semibold">
                            CHIFA
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.form} · {p.conditioning} · {p.manufacturerName} · Empl: {p.locationDefault}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-emerald-400 tabular-nums">
                        {p.ppa.toFixed(2)} DZD
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        Stock: {p.totalStock} btes
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Prescription & Essential Medicines Grid */}
        <div className="p-4 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Médicaments Fréquents au Comptoir / الأدوية الأكثر طلباً
            </h4>
            <span className="text-[11px] text-slate-400">Cliquez pour ajouter au panier</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {state.products.slice(0, 12).map((p) => {
              const isLowStock = p.totalStock <= p.minStockAlert;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="p-3 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-xs transition-all text-left flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-medium text-slate-500 truncate">
                        {p.categoryName.split(' ')[0]}
                      </span>
                      {p.tableau === 'TABLEAU_A' ? (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1 rounded">
                          TAB A
                        </span>
                      ) : p.isReimbursable ? (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded">
                          CNAS
                        </span>
                      ) : null}
                    </div>

                    <div className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {p.dciName}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-emerald-400 tabular-nums">
                      {p.ppa.toFixed(2)} DA
                    </span>
                    <span className={`text-[10px] font-semibold tabular-nums ${isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                      {p.totalStock} dispo
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Cart, CHIFA Panel & Checkout (40%) */}
      <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Customer & CHIFA Banner */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {selectedCustomer.fullName}
              </span>
            </div>
            <button
              onClick={() => setShowChifaModal(true)}
              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 hover:bg-emerald-200 rounded-md transition-colors flex items-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" />
              {selectedCustomer.nss ? 'Modifier Droits' : 'Insérer Carte Chifa (F9)'}
            </button>
          </div>

          {/* Social Insurance Details */}
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Caisse: <strong className="text-slate-800 dark:text-slate-200">{selectedCustomer.caisse}</strong>
              {selectedCustomer.nss && ` · NSS: ${selectedCustomer.nss.substring(0, 7)}...`}
            </span>
            <div className="flex items-center gap-1.5">
              <label htmlFor="chifa-mode-toggle" className="text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Tiers-Payant CHIFA:
              </label>
              <input
                id="chifa-mode-toggle"
                type="checkbox"
                checked={isChifaMode}
                onChange={(e) => setIsChifaMode(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Psychotrope alert banner if present */}
          {hasPsychotropeInCart && (
            <div className="mt-2.5 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Psychotrope détecté: {prescriptionData ? 'Ordonnance validée' : 'Ordonnance requise'}</span>
              </div>
              <button
                onClick={() => setShowPsychotropeModal(true)}
                className="text-[10px] font-bold underline hover:text-amber-950 dark:hover:text-amber-100"
              >
                {prescriptionData ? 'Modifier' : 'Saisir ordonnance'}
              </button>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Le panier est vide</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scannez un code-barre ou choisissez un médicament pour démarrer la vente
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const lineTotal = item.product.ppa * item.quantity;
              return (
                <div
                  key={item.product.id}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span>PPA: {item.product.ppa.toFixed(2)} DA</span>
                      {isChifaMode && item.product.isReimbursable && (
                        <span>· SHP: {item.product.shp.toFixed(2)} DA</span>
                      )}
                      <span>· {item.product.locationDefault}</span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1 hover:text-red-500 transition-colors"
                      aria-label="Diminuer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs tabular-nums px-1.5 min-w-[1.2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1 hover:text-emerald-500 transition-colors"
                      aria-label="Augmenter"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total & Delete */}
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {lineTotal.toFixed(2)} DA
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[10px] text-red-500 hover:text-red-700 mt-0.5"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Financial Summary & CHIFA Co-pay Breakdown */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Total PPA Brut:</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
              {totalBrutPpa.toFixed(2)} DZD
            </span>
          </div>

          {isChifaMode && (
            <>
              <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <span>Part Caisse CNAS / CASNOS ({chifaRate}%):</span>
                <span className="tabular-nums font-bold">-{partCaisse.toFixed(2)} DZD</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Ticket Modérateur + Dépassement SHP:</span>
                <span className="tabular-nums">{partAssure.toFixed(2)} DZD</span>
              </div>
            </>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {isChifaMode ? 'PART PATIENT À ENCAISSER:' : 'NET À PAYER:'}
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {partAssure.toFixed(2)} <span className="text-xs">DZD</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleNewSale}
              className="py-2.5 px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Annuler (F2)
            </button>
            <button
              onClick={openCheckout}
              disabled={cart.length === 0}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                cart.length === 0
                  ? 'bg-emerald-400/50 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Banknote className="w-4 h-4" /> Encaisser (F4)
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showChifaModal && (
        <ChifaCardModal
          currentCustomer={selectedCustomer}
          onSelectCustomer={(cust, dep) => {
            setSelectedCustomer(cust);
            setBeneficiaryName(dep || cust.fullName);
            setIsChifaMode(true);
          }}
          onClose={() => setShowChifaModal(false)}
        />
      )}

      {showPsychotropeModal && (
        <PsychotropePrescriptionModal
          patientNameDefault={beneficiaryName || selectedCustomer.fullName}
          onConfirm={(prescription) => {
            setPrescriptionData(prescription);
            setShowPsychotropeModal(false);
            setShowPaymentModal(true);
          }}
          onCancel={() => setShowPsychotropeModal(false)}
        />
      )}

      {/* Payment Drawer Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" /> Règlement & Encaissement
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saleError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 rounded-lg">
                {saleError}
              </div>
            )}

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
              <div>
                <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  Montant à régler par le patient:
                </div>
                {isChifaMode && (
                  <div className="text-[10px] text-emerald-600">
                    (Part Caisse de {partCaisse.toFixed(2)} DZD prise en charge)
                  </div>
                )}
              </div>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                {partAssure.toFixed(2)} DZD
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mode de règlement:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Banknote className="w-4 h-4" /> Espèces
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD_CIB_DAHABIA')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 ${
                    paymentMethod === 'CARD_CIB_DAHABIA'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> CIB / Dahabia
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 ${
                    paymentMethod === 'CREDIT'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Receipt className="w-4 h-4" /> Crédit / Bon
                </button>
              </div>
            </div>

            {/* Change Calculator for Cash */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Montant reçu du patient (DZD):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className="flex-1 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-emerald-500"
                  />
                  {[1000, 2000].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setCashGiven(quick.toString())}
                      className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg tabular-nums"
                    >
                      {quick} DA
                    </button>
                  ))}
                </div>

                {parseFloat(cashGiven) >= partAssure && (
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Rendu monnaie:</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white tabular-nums">
                      {(parseFloat(cashGiven) - partAssure).toFixed(2)} DZD
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Validation Action */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSale}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <CornerDownLeft className="w-4 h-4" /> Valider & Imprimer Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Receipt Print Modal */}
      {lastCompletedSale && (
        <ReceiptModal
          sale={lastCompletedSale}
          pharmacy={state.pharmacy}
          onClose={() => setLastCompletedSale(null)}
        />
      )}
    </div>
  );
};
