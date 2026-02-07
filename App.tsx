
import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './services/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, deleteDoc, setDoc, query, where, getDocs, serverTimestamp, writeBatch, onSnapshot, increment } from 'firebase/firestore';
import { AppConfig, Driver, Order, Vale, Expense, Product, Client, Settlement, Supplier, InventoryItem, ShoppingItem, GiveawayEntry, UserType, DailyStats, GiveawayWinner } from './types';
import { normalizePhone, formatCurrency } from './utils';
import { Loader2, Utensils, ShieldCheck, Bike, Flame } from 'lucide-react';

// Components
import { AdminInterface } from './components/AdminInterface';
import ClientInterface from './components/ClientInterface';
import DriverInterface from './components/DriverInterface';
import DriverSelection from './components/DriverSelection'; 
import { GenericAlertModal, NewDriverModal, CloseCycleModal, ImportModal, EditClientModal, SettingsModal, AdminLoginModal, EditOrderModal } from './components/Modals';
import { BrandLogo } from './components/Shared';
import PixPaymentView from './components/PixPaymentView'; // NOVO COMPONENTE

// OTIMIZAÇÃO: Memoizar componentes principais para evitar re-render da árvore inteira
const MemoizedClientInterface = React.memo(ClientInterface);
const MemoizedAdminInterface = React.memo(AdminInterface);
const MemoizedDriverInterface = React.memo(DriverInterface);

// CONFIGURAÇÃO PADRÃO COMPLETA (Proteção contra reset)
const DEFAULT_CONFIG: AppConfig = {
    appName: 'Jhans Burgers',
    appLogoUrl: '',
    bannerUrl: '',
    promoTitle: '',
    promoSubtitle: '',
    promoMode: 'card',
    promoDate: '',
    promoTime: '',
    promoLocation: '',
    welcomeBannerUrl: '',
    featuredSettings: {
        active: false,
        title: 'Destaques da Casa 🔥',
        productIds: []
    },
    giveawaySettings: {
        active: false,
        title: 'Sorteio Oficial',
        rules: '',
        fields: []
    },
    storePhone: '',
    storeCountryCode: '+55',
    storeMapsLink: '',
    pixKey: '',
    pixName: '',
    pixCity: '',
    deliveryZones: [],
    enableDeliveryFees: false,
    schedule: {},
    minOrderValue: 0,
    estimatedTime: '',
    printerWidth: '80mm',
    location: { lat: -23.55052, lng: -46.633308 }
};

const GlobalStyles = () => {
    useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        * { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.8); }
      `;
      document.head.appendChild(style);
      return () => { if(document.head.contains(style)) document.head.removeChild(style); };
    }, []);
    return null;
};

export default function App() {
  // --- LOGIN E PERSISTÊNCIA ---
  const [viewMode, setViewMode] = useState<UserType | 'pix'>(() => {
      const params = new URLSearchParams(window.location.search);
      // DETECÇÃO DE MODO PIX VIA URL
      if (params.get('mode') === 'pix' && params.get('oid')) return 'pix';
      if (params.get('mode') === 'client') return 'client';
      
      const saved = localStorage.getItem('jhans_viewMode');
      return (saved as UserType) || 'client';
  });

  // Novo State para Pix ID
  const [pixOrderId, setPixOrderId] = useState<string | null>(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('oid');
  });

  const [loading, setLoading] = useState(true);
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(() => localStorage.getItem('jhans_driverId'));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  
  // Data Collections
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vales, setVales] = useState<Vale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [giveawayEntries, setGiveawayEntries] = useState<GiveawayEntry[]>([]);
  const [giveawayWinners, setGiveawayWinners] = useState<GiveawayWinner[]>([]); 
  const [siteVisits, setSiteVisits] = useState<DailyStats[]>([]);
  
  const [appConfig, setAppConfigState] = useState<AppConfig>(DEFAULT_CONFIG);

  // UI State
  const [modal, setModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type?: 'error'|'info'} | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    setTimeout(() => setLoading(false), 2000); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- AUTH & LISTENERS ---
  useEffect(() => {
      const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
          if (user) {
              setIsAuth(true);
          } else {
              signInAnonymously(auth).catch((error) => {
                  console.error("Erro ao autenticar anonimamente:", error);
              });
          }
      });
      return () => unsubscribeAuth();
  }, []);

  // --- FIREBASE LISTENERS ---
  useEffect(() => {
      if (!isAuth || permissionError) return;

      const handleError = (error: any) => {
          if (error.code === 'permission-denied') {
              console.warn("Permissão negada (Firestore Rules). Parando listeners.");
              setPermissionError(true);
          } else {
              console.error("Erro no listener:", error);
          }
      };

      const safeSnapshot = (ref: any, callback: (snap: any) => void) => {
          try {
              return onSnapshot(ref, callback, handleError);
          } catch (e: any) {
              handleError(e);
              return () => {};
          }
      };

      const unsubConfig = safeSnapshot(doc(db, 'config', 'main'), (docSnap) => {
          if (docSnap.exists()) {
              setAppConfigState(prev => {
                  const dbData = docSnap.data();
                  const newData = { ...DEFAULT_CONFIG, ...dbData } as AppConfig;
                  if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
                  return newData;
              });
          } else {
              setDoc(docSnap.ref, DEFAULT_CONFIG).catch(err => {
                  if (err.code === 'permission-denied') setPermissionError(true);
                  else console.error("Erro ao criar config:", err);
              });
          }
      });

      // Se estiver no modo PIX, não precisamos ouvir TODAS as coleções, apenas Config e Auth para carregar rápido.
      // O PixPaymentView carrega o pedido individualmente.
      if (viewMode === 'pix') {
          return () => { unsubConfig(); };
      }

      const unsubDrivers = safeSnapshot(collection(db, 'drivers'), (snap) => setDrivers(snap.docs.map(d => ({...d.data(), id: d.id} as Driver))));
      const unsubOrders = safeSnapshot(collection(db, 'orders'), (snap) => setOrders(snap.docs.map(d => ({...d.data(), id: d.id} as Order))));
      const unsubVales = safeSnapshot(collection(db, 'vales'), (snap) => setVales(snap.docs.map(d => ({...d.data(), id: d.id} as Vale))));
      const unsubExpenses = safeSnapshot(collection(db, 'expenses'), (snap) => setExpenses(snap.docs.map(d => ({...d.data(), id: d.id} as Expense))));
      const unsubProducts = safeSnapshot(collection(db, 'products'), (snap) => setProducts(snap.docs.map(d => ({...d.data(), id: d.id} as Product))));
      const unsubClients = safeSnapshot(collection(db, 'clients'), (snap) => setClients(snap.docs.map(d => ({...d.data(), id: d.id} as Client))));
      const unsubSettlements = safeSnapshot(collection(db, 'settlements'), (snap) => setSettlements(snap.docs.map(d => ({...d.data(), id: d.id} as Settlement))));
      const unsubSuppliers = safeSnapshot(collection(db, 'suppliers'), (snap) => setSuppliers(snap.docs.map(d => ({...d.data(), id: d.id} as Supplier))));
      const unsubInventory = safeSnapshot(collection(db, 'inventory'), (snap) => setInventory(snap.docs.map(d => ({...d.data(), id: d.id} as InventoryItem))));
      const unsubShopping = safeSnapshot(collection(db, 'shoppingList'), (snap) => setShoppingList(snap.docs.map(d => ({...d.data(), id: d.id} as ShoppingItem))));
      const unsubGiveaway = safeSnapshot(collection(db, 'giveaway_entries'), (snap) => setGiveawayEntries(snap.docs.map(d => ({...d.data(), id: d.id} as GiveawayEntry))));
      const unsubWinners = safeSnapshot(collection(db, 'giveaway_winners'), (snap) => setGiveawayWinners(snap.docs.map(d => ({...d.data(), id: d.id} as GiveawayWinner)))); 
      const unsubVisits = safeSnapshot(collection(db, 'daily_stats'), (snap) => setSiteVisits(snap.docs.map(d => ({...d.data(), date: d.id} as DailyStats))));

      return () => {
          unsubConfig(); unsubDrivers(); unsubOrders(); unsubVales(); unsubExpenses(); unsubProducts(); unsubClients();
          unsubSettlements(); unsubSuppliers(); unsubInventory(); unsubShopping(); unsubGiveaway(); unsubWinners(); unsubVisits();
      };
  }, [isAuth, permissionError, viewMode]);

  // ... (Restante do código igual) ...
  const handleAction = async (action: () => Promise<any>) => {
    if (permissionError) {
        setAlertInfo({ isOpen: true, title: "Sem Permissão", message: "Correção necessária nas regras do Firebase.", type: 'error' });
        return false;
    }
    try {
      await action();
      return true;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
          setPermissionError(true);
      } else {
          console.error("Erro na ação:", error);
          setAlertInfo({ isOpen: true, title: "Atenção", message: error.message || "Erro no banco de dados.", type: 'error' });
      }
      return false;
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('jhans_viewMode');
      localStorage.removeItem('jhans_driverId');
      setViewMode('client'); 
      setCurrentDriverId(null);
      // Limpa URL para evitar loop do pix mode
      if (window.history.pushState) {
          const url = new URL(window.location.href);
          url.search = '';
          window.history.pushState({}, '', url);
      }
  };

  const handleLoginRequest = (type: UserType) => {
      if (type === 'admin') {
          const isTrusted = localStorage.getItem('jhans_admin_trusted') === 'true';
          const isActive = localStorage.getItem('jhans_viewMode') === 'admin';

          if (isActive || isTrusted) {
              localStorage.setItem('jhans_viewMode', 'admin');
              setViewMode('admin');
          } else {
              setShowAdminLogin(true);
          }
      } else if (type === 'driver') {
          setCurrentDriverId('select');
          setViewMode('driver');
      } else {
          setViewMode('client');
      }
  };

  const processAdminLogin = (password: string, remember: boolean) => {
      if (password === '1234' || password === 'admin') {
          localStorage.setItem('jhans_viewMode', 'admin');
          if (remember) localStorage.setItem('jhans_admin_trusted', 'true');
          else localStorage.removeItem('jhans_admin_trusted');
          setViewMode('admin');
          return true;
      }
      return false;
  };

  // CRUD Wrappers
  const updateDocWrapper = (col: string, id: string, data: any) => {
      if (!id) return Promise.resolve(false);
      return handleAction(() => updateDoc(doc(db, col, id), data));
  };

  const createDocWrapper = (col: string, data: any) => handleAction(() => addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() }));
  
  const deleteDocWrapper = (col: string, id: string) => {
      if (!id) return Promise.resolve(false);
      return handleAction(() => deleteDoc(doc(db, col, id)));
  };

  const setDocWrapper = (col: string, id: string, data: any) => {
      if (!id) return Promise.resolve(false);
      return handleAction(() => setDoc(doc(db, col, id), data, { merge: true }));
  };

  const handleCSVImport = async (csvText: string) => {
      const lines = csvText.split('\n');
      let count = 0;
      const batch = writeBatch(db);
      lines.forEach((line) => {
          const [name, phone, address] = line.split(',');
          if (name && phone) {
              const ref = doc(collection(db, 'clients'));
              batch.set(ref, { name: name.trim(), phone: normalizePhone(phone), address: address ? address.trim() : '', createdAt: serverTimestamp() });
              count++;
          }
      });
      await handleAction(() => batch.commit());
      setAlertInfo({ isOpen: true, title: "Importação Concluída", message: `${count} registros processados.` });
      setModal(null);
  };

  if (loading) {
      return (
          <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center animate-in fade-in duration-700 overflow-hidden">
              <style>{`
                @keyframes fire-progress { 0% { width: 0%; } 100% { width: 100%; } }
                @keyframes ember-flicker { 0% { opacity: 1; transform: translateY(-50%) scale(1); box-shadow: 0 0 10px #f97316; } 100% { opacity: 0.8; transform: translateY(-50%) scale(1.2); box-shadow: 0 0 20px #ef4444; } }
                @keyframes sparks-fly { 0% { transform: translateY(-50%) translate(0, 0) scale(1); opacity: 1; } 100% { transform: translateY(-50%) translate(-20px, -15px) scale(0); opacity: 0; } }
                @keyframes text-shimmer { 0% { background-position: -200%; } 100% { background-position: 200%; } }
                .fire-line { height: 100%; background: linear-gradient(90deg, transparent 0%, #f97316 40%, #ef4444 100%); box-shadow: 0 0 15px rgba(249, 115, 22, 0.3); border-radius: 9999px; animation: fire-progress 2.5s ease-in-out infinite; position: relative; }
                .fire-line::after { content: ''; position: absolute; top: 50%; right: -2px; width: 6px; height: 6px; background: #fff; border-radius: 50%; transform: translateY(-50%); box-shadow: 0 0 15px #f97316, 0 0 30px #ef4444; animation: ember-flicker 0.1s infinite alternate; }
                .fire-line::before { content: ''; position: absolute; top: 50%; right: 0; width: 2px; height: 2px; background: transparent; box-shadow: -4px -8px 0 #fbbf24, -8px 4px 0 #f97316, -2px -12px 0 #ef4444; border-radius: 50%; animation: sparks-fly 0.4s linear infinite; }
                .flash-text { background: linear-gradient(to right, #ffffff 20%, #f97316 50%, #ffffff 80%); background-size: 200% auto; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: text-shimmer 2.5s linear infinite; }
              `}</style>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none"></div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-2 relative z-10 uppercase drop-shadow-lg flash-text">{appConfig.appName || 'Jhans Burgers'}</h2>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium relative z-10 mt-4"><Flame className="animate-pulse text-orange-500" size={24} fill="#f97316" fillOpacity={0.2}/><span>Preparando a chapa...</span></div>
              <div className="w-64 h-1.5 bg-slate-900 rounded-full mt-6 overflow-visible relative z-10"><div className="fire-line w-full"></div></div>
          </div>
      );
  }

  const renderContent = () => {
    // --- NOVA ROTA: TELA DE PAGAMENTO PIX ---
    if (viewMode === 'pix' && pixOrderId) {
        return (
            <PixPaymentView 
                orderId={pixOrderId}
                appConfig={appConfig}
                onBack={() => {
                    // Remove parametros da URL e volta para o cliente
                    const url = new URL(window.location.href);
                    url.search = '';
                    window.history.pushState({}, '', url);
                    setViewMode('client');
                }}
            />
        );
    }

    if (viewMode === 'admin') {
        return (
            <>
            <GlobalStyles />
            <MemoizedAdminInterface 
                drivers={drivers}
                orders={orders}
                vales={vales}
                expenses={expenses}
                products={products}
                clients={clients}
                settlements={settlements}
                suppliers={suppliers}
                inventory={inventory}
                shoppingList={shoppingList}
                giveawayEntries={giveawayEntries}
                giveawayWinners={giveawayWinners} 
                siteVisits={siteVisits}
                appConfig={appConfig}
                isMobile={isMobile}
                setModal={setModal}
                setModalData={setModalData}
                onLogout={handleLogout}
                onDeleteOrder={(id: string) => deleteDocWrapper('orders', id)}
                onAssignOrder={(oid: string, did: string) => { 
                    updateDocWrapper('orders', oid, { driverId: did, status: 'assigned', assignedAt: serverTimestamp() });
                    updateDocWrapper('drivers', did, { status: 'delivering', currentOrderId: oid });
                }}
                setDriverToEdit={(d: any) => { setModalData(d); setModal('driver'); }}
                onDeleteDriver={(id: string) => deleteDocWrapper('drivers', id)}
                setClientToEdit={(c: any) => { setModalData(c); setModal('client'); }}
                onUpdateOrder={(id: string, data: any) => updateDocWrapper('orders', id, data)}
                onCreateOrder={(data: any) => createDocWrapper('orders', data)}
                onCreateDriver={(data: any) => createDocWrapper('drivers', data)}
                onUpdateDriver={(id: string, data: any) => updateDocWrapper('drivers', id, data)}
                onCreateVale={(data: any) => createDocWrapper('vales', data)}
                onCreateExpense={(data: any) => createDocWrapper('expenses', data)}
                onCreateProduct={(data: any) => createDocWrapper('products', data)}
                onDeleteProduct={(id: string) => deleteDocWrapper('products', id)}
                onUpdateProduct={(id: string, data: any) => updateDocWrapper('products', id, data)}
                onUpdateClient={(id: string, data: any) => updateDocWrapper('clients', id, data)}
                onCloseCycle={(driverId: string, data: any) => { 
                    createDocWrapper('settlements', data);
                    updateDocWrapper('drivers', driverId, { lastSettlementAt: serverTimestamp() });
                }}
                onCreateSupplier={(data: any) => createDocWrapper('suppliers', data)}
                onUpdateSupplier={(id: string, data: any) => updateDocWrapper('suppliers', id, data)}
                onDeleteSupplier={(id: string) => deleteDocWrapper('suppliers', id)}
                onCreateInventory={(data: any) => createDocWrapper('inventory', data)}
                onUpdateInventory={(id: string, data: any) => updateDocWrapper('inventory', id, data)}
                onDeleteInventory={(id: string) => deleteDocWrapper('inventory', id)}
                onAddShoppingItem={(name: string) => createDocWrapper('shoppingList', { name, isChecked: false })}
                onToggleShoppingItem={(id: string, current: boolean) => updateDocWrapper('shoppingList', id, { isChecked: !current })}
                onDeleteShoppingItem={(id: string) => deleteDocWrapper('shoppingList', id)}
                onClearShoppingList={() => { shoppingList.forEach(i => deleteDocWrapper('shoppingList', i.id)) }}
                setAppConfig={(cfg: any) => setDocWrapper('config', 'main', cfg)}
                onUpdateGiveawayEntry={(id: string, data: any) => updateDocWrapper('giveaway_entries', id, data)}
                onDeleteGiveawayEntry={(id: string) => deleteDocWrapper('giveaway_entries', id)}
                onRegisterWinner={(data: any) => createDocWrapper('giveaway_winners', { ...data, wonAt: serverTimestamp() })}
                modal={modal}
                modalData={modalData}
            />
            </>
        );
    }
  
    if (viewMode === 'driver') {
        if (currentDriverId === 'select' || !currentDriverId) {
            return <><GlobalStyles /><DriverSelection drivers={drivers} onSelect={(id) => { setCurrentDriverId(id); localStorage.setItem('jhans_driverId', id); localStorage.setItem('jhans_viewMode', 'driver'); }} onBack={handleLogout} /></>;
        }
        const currentDriver = drivers.find(d => d.id === currentDriverId);
        if (!currentDriver) { setCurrentDriverId('select'); return null; }
        return (
            <><GlobalStyles />
            <MemoizedDriverInterface 
                driver={currentDriver}
                orders={orders}
                vales={vales}
                onToggleStatus={() => updateDocWrapper('drivers', currentDriver.id, { status: currentDriver.status === 'offline' ? 'available' : 'offline' })}
                onAcceptOrder={(id: string) => { updateDocWrapper('orders', id, { driverId: currentDriver.id, status: 'delivering', assignedAt: serverTimestamp() }); updateDocWrapper('drivers', currentDriver.id, { status: 'delivering', currentOrderId: id }); }}
                onCompleteOrder={(oid: string, did: string) => { updateDocWrapper('orders', oid, { status: 'completed', completedAt: serverTimestamp() }); updateDocWrapper('drivers', did, { status: 'available', currentOrderId: null, totalDeliveries: (currentDriver.totalDeliveries || 0) + 1 }); }}
                onUpdateOrder={(id: string, data: any) => updateDocWrapper('orders', id, data)}
                onDeleteOrder={(id: string) => deleteDocWrapper('orders', id)}
                onLogout={handleLogout}
                onUpdateDriver={(id: string, data: any) => updateDocWrapper('drivers', id, data)}
            /></>
        );
    }
  
    return (
        <><GlobalStyles />
        <MemoizedClientInterface 
            products={products}
            appConfig={appConfig}
            onCreateOrder={(data: any) => createDocWrapper('orders', data)}
            onEnterGiveaway={async (data: any) => { const cleanPhone = normalizePhone(data.phone); const exists = giveawayEntries.some(e => normalizePhone(e.phone) === cleanPhone); if (exists) { setAlertInfo({ isOpen: true, title: "Erro", message: "Este número já está participando!", type: 'error' }); } else { await createDocWrapper('giveaway_entries', data); }}}
            allowSystemAccess={true}
            onSystemAccess={handleLoginRequest}
            onRecordVisit={() => { if(permissionError) return; const today = new Date().toLocaleDateString('en-CA'); setDoc(doc(db, 'daily_stats', today), { visits: increment(1) }, { merge: true }).catch(err => { if (err.code === 'permission-denied') setPermissionError(true); }); }}
        /></>
    );
  };

  return (
    <>
      {renderContent()}
      {modal === 'driver' && <NewDriverModal initialData={modalData} onClose={() => setModal(null)} onSave={(data: any) => modalData ? updateDocWrapper('drivers', modalData.id, data) : createDocWrapper('drivers', data)} />}
      {modal === 'closeCycle' && <CloseCycleModal data={modalData} onClose={() => setModal(null)} onConfirm={(d: any) => { createDocWrapper('settlements', d); updateDocWrapper('drivers', d.driverId, { lastSettlementAt: serverTimestamp() }); setModal(null); setAlertInfo({isOpen: true, title: "Ciclo Fechado", message: "Pagamento registrado com sucesso."}); }} />}
      {modal === 'import' && <ImportModal onClose={() => setModal(null)} onImportCSV={handleCSVImport} />}
      {modal === 'client' && <EditClientModal client={modalData} orders={orders} onClose={() => setModal(null)} onSave={(data: any) => { updateDocWrapper('clients', data.id, data); setModal(null); }} />}
      {modal === 'settings' && <SettingsModal config={appConfig} products={products} onClose={() => setModal(null)} onSave={(data: any) => setDocWrapper('config', 'main', data)} />}
      {modal === 'editOrder' && <EditOrderModal order={modalData} onClose={() => setModal(null)} onSave={(id, data) => updateDocWrapper('orders', id, data)} />}
      {showAdminLogin && <AdminLoginModal onClose={() => setShowAdminLogin(false)} onLogin={processAdminLogin} />}
      {alertInfo && <GenericAlertModal isOpen={alertInfo.isOpen} title={alertInfo.title} message={alertInfo.message} type={alertInfo.type || 'info'} onClose={() => setAlertInfo(null)} />}
      {permissionError && <GenericAlertModal isOpen={true} title="Acesso Negado (Firebase)" message="O sistema não tem permissão para acessar o banco de dados." type="error" onClose={() => setPermissionError(false)} />}
    </>
  );
}
