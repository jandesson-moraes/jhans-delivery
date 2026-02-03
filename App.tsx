
import React, { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, 
  setDoc, serverTimestamp, deleteField, query, orderBy, writeBatch, Timestamp, where, getDocs 
} from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { db, auth } from './services/firebase';
import { 
  AppConfig, Driver, Order, Product, Client, Vale, Expense, 
  Settlement, Supplier, InventoryItem, ShoppingItem, GiveawayEntry, UserType 
} from './types';
import AdminInterface from './components/AdminInterface';
import DriverInterface from './components/DriverInterface';
import ClientInterface from './components/ClientInterface';
import { 
    GenericConfirmModal, GenericAlertModal, SettingsModal, 
    NewDriverModal, CloseCycleModal, ImportModal, EditClientModal, NewValeModal, NewExpenseModal 
} from './components/Modals';
import { Loader2 } from 'lucide-react';
import { normalizePhone, formatCurrency } from './utils';

// Lista de IDs que devem ser exterminados automaticamente caso apareçam
const ZOMBIE_IDS = ['w8wSUDWOkyWnrL1UxfXC'];

// Default Config
const DEFAULT_CONFIG: AppConfig = {
    appName: 'Jhans Burgers',
    appLogoUrl: '',
    deliveryZones: [],
    enableDeliveryFees: false,
    schedule: {}
};

// Global Styles for animations
const GlobalStyles = () => {
    useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes pathA { 0% { transform: translate3d(0,0,0); } 25% { transform: translate3d(60px, 40px, 0); } 50% { transform: translate3d(0, 80px, 0); } 75% { transform: translate3d(-60px, 40px, 0); } 100% { transform: translate3d(0,0,0); } }
        @keyframes pathB { 0% { transform: translate3d(0,0,0); } 30% { transform: translate3d(100px, -20px, 0); } 60% { transform: translate3d(50px, 40px, 0); } 100% { transform: translate3d(0,0,0); } }
        @keyframes pathC { 0% { transform: translate3d(0,0,0); } 25% { transform: translate3d(0, 100px, 0); } 50% { transform: translate3d(100px, 100px, 0); } 75% { transform: translate3d(100px, 0, 0); } 100% { transform: translate3d(0,0,0); } }
        @keyframes pathD { 0% { transform: translate3d(0,0,0); } 50% { transform: translate3d(20px, 150px, 0); } 100% { transform: translate3d(0,0,0); } }
        @keyframes pathE { 0% { transform: translate3d(0,0,0); } 33% { transform: translate3d(-50px, 30px, 0); } 66% { transform: translate3d(30px, 50px, 0); } 100% { transform: translate3d(0,0,0); } }
        .animate-path-0 { animation: pathA 45s ease-in-out infinite; }
        .animate-path-1 { animation: pathB 50s ease-in-out infinite; }
        .animate-path-2 { animation: pathC 60s linear infinite; }
        .animate-path-3 { animation: pathD 55s ease-in-out infinite; }
        .animate-path-4 { animation: pathE 40s ease-in-out infinite; }
        .perspective-container { perspective: 1000px; overflow: hidden; background: #020617; }
        .map-plane { transform: rotateX(40deg) scale(1.4); transform-style: preserve-3d; background-color: #0f172a; background-image: linear-gradient(rgba(30, 41, 59, 0.8) 2px, transparent 2px), linear-gradient(90deg, rgba(30, 41, 59, 0.8) 2px, transparent 2px), linear-gradient(rgba(30, 41, 59, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 41, 59, 0.3) 1px, transparent 1px); background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px; box-shadow: inset 0 0 200px #020617; }
        @keyframes radar-pulse { 0% { transform: scale(0); opacity: 0.5; } 100% { transform: scale(3); opacity: 0; } }
        .radar-pulse { animation: radar-pulse 2s infinite; }
        .billboard-corrector { transform: rotateX(-40deg); }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        * { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `;
      document.head.appendChild(style);
      return () => { if(document.head.contains(style)) document.head.removeChild(style); };
    }, []);
    return null;
};

export default function App() {
  // State
  const [user, setUser] = useState<any>(null);
  // Revertido para usar o localStorage ou URL para definir o modo, sem login forçado de email
  const [viewMode, setViewMode] = useState<UserType>(() => { 
      try { 
          const params = new URLSearchParams(window.location.search);
          if (params.get('mode') === 'client') return 'client';
          return (localStorage.getItem('jhans_viewMode') as UserType) || 'landing'; 
      } catch { return 'landing'; } 
  });
  
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(() => { try { return localStorage.getItem('jhans_driverId'); } catch { return null; } });
  
  // Data Collections
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vales, setVales] = useState<Vale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [giveawayEntries, setGiveawayEntries] = useState<GiveawayEntry[]>([]);
  const [appConfig, setAppConfigState] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  // UI State
  const [modal, setModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  
  const [confirmInfo, setConfirmInfo] = useState<{isOpen: boolean, title: string, message: string, type?: 'info'|'danger'|'error', onConfirm: () => void} | null>(null);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type?: 'info'|'error'|'success'} | null>(null);

  // --- INITIALIZATION ---

  useEffect(() => {
      if (viewMode && viewMode !== 'client') {
          localStorage.setItem('jhans_viewMode', viewMode);
      }
  }, [viewMode]);

  // Auth Listener - Anonymous Login
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
          console.log("Usuário autenticado:", u.uid);
          setUser(u);
      } else {
          console.log("Tentando login anônimo...");
          signInAnonymously(auth).catch(err => {
              console.error("Erro no login anônimo:", err);
              setAlertInfo({ isOpen: true, title: "Erro de Login", message: "Falha ao conectar com o servidor.", type: 'error' });
          });
      }
    });
    return () => unsubAuth();
  }, []);

  // Data Listeners
  useEffect(() => {
      if (!user) return;

      // Config
      const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (doc) => {
          if (doc.exists()) setAppConfigState(doc.data() as AppConfig);
          else setDoc(doc.ref, DEFAULT_CONFIG);
      });

      // Products
      const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
          setProducts(snap.docs.map(d => ({id: d.id, ...d.data()} as Product)));
      });

      // Drivers
      const unsubDrivers = onSnapshot(collection(db, 'drivers'), (snap) => {
          setDrivers(snap.docs.map(d => ({id: d.id, ...d.data()} as Driver)));
      });

      // Orders - ROBUST FILTERING WITH ZOMBIE KILLER
      console.log("Iniciando listener de pedidos...");
      const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
          console.log("Atualização de Pedidos recebida. Total bruto:", snap.docs.length);
          const mappedOrders = snap.docs.map(d => ({id: d.id, ...d.data()} as Order));
          
          // EXTERMINADOR DE ZUMBIS: Se um ID problemático for encontrado, deleta silenciosamente
          mappedOrders.forEach(o => {
              if (ZOMBIE_IDS.includes(o.id) || ZOMBIE_IDS.some(z => o.id.includes(z))) {
                  console.warn(`[Auto-Killer] Pedido Zumbi detectado (${o.id}). Exterminando...`);
                  deleteDoc(doc(db, 'orders', o.id)).catch(e => console.error("Falha ao exterminar:", e));
              }
          });

          // Filter out orders marked as deleted OR in the zombie list
          const validOrders = mappedOrders.filter(o => 
              o.status !== 'deleted' && 
              !ZOMBIE_IDS.includes(o.id) &&
              !ZOMBIE_IDS.some(z => o.id.includes(z))
          );
          setOrders(validOrders);
      }, (error) => {
          console.error("Erro no listener de pedidos:", error);
      });

      // Clients
      const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
          setClients(snap.docs.map(d => ({id: d.id, ...d.data()} as Client)));
          setLoading(false);
      });

      // Other Collections...
      const unsubVales = onSnapshot(collection(db, 'vales'), (snap) => setVales(snap.docs.map(d => ({id: d.id, ...d.data()} as Vale))));
      const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => setExpenses(snap.docs.map(d => ({id: d.id, ...d.data()} as Expense))));
      const unsubSettlements = onSnapshot(collection(db, 'settlements'), (snap) => setSettlements(snap.docs.map(d => ({id: d.id, ...d.data()} as Settlement))));
      const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snap) => setSuppliers(snap.docs.map(d => ({id: d.id, ...d.data()} as Supplier))));
      const unsubInventory = onSnapshot(collection(db, 'inventory'), (snap) => setInventory(snap.docs.map(d => ({id: d.id, ...d.data()} as InventoryItem))));
      const unsubShopping = onSnapshot(collection(db, 'shoppingList'), (snap) => setShoppingList(snap.docs.map(d => ({id: d.id, ...d.data()} as ShoppingItem))));
      
      // GIVEAWAY - ORDERED BY CREATED AT DESCENDING to correctly detect new ones
      const unsubGiveaway = onSnapshot(query(collection(db, 'giveaway_entries'), orderBy('createdAt', 'desc')), (snap) => {
          setGiveawayEntries(snap.docs.map(d => ({id: d.id, ...d.data()} as GiveawayEntry)));
      });

      return () => {
          unsubConfig(); unsubProducts(); unsubDrivers(); unsubOrders();
          unsubClients(); unsubVales(); unsubExpenses(); unsubSettlements();
          unsubSuppliers(); unsubInventory(); unsubShopping(); unsubGiveaway();
      };
  }, [user]);

  // --- ACTIONS ---

  const handleAction = async (action: () => Promise<any>) => {
    try {
      await action();
    } catch (error: any) {
      console.error("Erro na ação:", error);
      setAlertInfo({ isOpen: true, title: "Erro na Operação", message: error.message || "Falha ao executar ação no banco de dados.", type: 'error' });
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('jhans_viewMode');
      localStorage.removeItem('jhans_driverId');
      setViewMode('landing');
      window.location.href = window.location.href.split('?')[0]; 
  };

  // CRUD Actions
  
  // Drivers
  const createDriver = (data: any) => handleAction(async () => { await addDoc(collection(db, 'drivers'), data); });
  const updateDriver = (id: string, data: any) => handleAction(async () => { await updateDoc(doc(db, 'drivers', id), data); });
  const deleteDriver = (id: string) => {
      setConfirmInfo({ isOpen: true, title: "Excluir Motoboy?", message: "Tem certeza que deseja remover este motoboy? Isso não pode ser desfeito.", type: "danger", onConfirm: () => handleAction(async () => { await deleteDoc(doc(db, 'drivers', id)); setConfirmInfo(null); }) });
  };

  // Orders
  const createOrder = (data: any) => handleAction(async () => {
    const payload = { ...data };
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    
    const { id, ...cleanPayload } = payload;
    // Ensure we don't accidentally create an empty or space-only ID
    if (payload.id && payload.id.trim().startsWith('PED-')) {
         const orderRef = doc(db, 'orders', payload.id.trim());
         await setDoc(orderRef, { ...cleanPayload, status: payload.status || 'pending', createdAt: payload.createdAt || serverTimestamp() }, { merge: true });
    } else {
         await addDoc(collection(db, 'orders'), { ...cleanPayload, status: 'pending', createdAt: serverTimestamp() });
    }
    
    if (payload.phone) {
        const cleanPhone = normalizePhone(payload.phone);
        if (cleanPhone) await setDoc(doc(db, 'clients', cleanPhone), { name: payload.customer, phone: payload.phone, address: payload.address, mapsLink: payload.mapsLink || '', lastOrderAt: serverTimestamp() }, { merge: true });
    }
  });

  const updateOrder = async (id: string, data: any) => {
      if (!id) return console.error("ID inválido para atualização");
      
      console.log(`[App] Atualizando Pedido ${id}`, data);
      
      const { id: dataId, ...dataToUpdate } = data;

      // ATUALIZAÇÃO OTIMISTA
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...dataToUpdate } : o));

      const orderRef = doc(db, 'orders', id);
      
      // Driver Release Logic
      if (dataToUpdate.status && ['pending', 'preparing', 'ready'].includes(dataToUpdate.status)) {
          const currentOrder = orders.find(o => o.id === id);
          if (currentOrder && currentOrder.driverId) {
              updateDoc(doc(db, 'drivers', currentOrder.driverId), { status: 'available', currentOrderId: null })
                .catch(e => console.warn("Falha ao liberar driver:", e));
              
              dataToUpdate.driverId = deleteField();
              dataToUpdate.assignedAt = deleteField();
          }
      }

      try {
          // Changed to updateDoc to strictly UPDATE existing document. 
          await updateDoc(orderRef, dataToUpdate);
          console.log(`[App] Pedido ${id} atualizado com sucesso no DB.`);
      } catch (error: any) {
          console.error(`[App] Erro fatal ao atualizar pedido ${id}:`, error);
          
          // ZOMBIE HANDLING: Se o documento não existe, limpamos da UI e avisamos sem erro grave.
          if (error.code === 'not-found' || error.message.includes('No document to update')) {
              console.warn(`[App] Pedido ${id} não existe no DB (Zombie). Removendo localmente.`);
              setOrders(prev => prev.filter(o => o.id !== id));
              setAlertInfo({ 
                  isOpen: true, 
                  title: "Pedido Inexistente", 
                  message: "Este pedido não foi encontrado no sistema e foi removido da lista.", 
                  type: 'info' 
              });
              return;
          }

          setAlertInfo({ isOpen: true, title: "Erro de Conexão", message: `Não foi possível salvar as alterações: ${error.message}`, type: 'error' });
      }
  };

  const deleteOrder = (id: string) => {
      if (!id) {
          setAlertInfo({ isOpen: true, title: "Erro", message: "ID inválido.", type: 'error' });
          return;
      }
      
      setConfirmInfo({ 
          isOpen: true, 
          title: "Excluir Pedido?", 
          message: `Tem certeza que deseja excluir o pedido?`, 
          type: "danger", 
          onConfirm: async () => {
              setConfirmInfo(null);
              
              // ATUALIZAÇÃO OTIMISTA (FORCE REMOVE)
              console.log(`[App] Removendo visualmente pedido: ${id}`);
              setOrders(prev => prev.filter(o => o.id !== id));

              // TENTATIVA 1: Soft Delete
              try {
                  await updateDoc(doc(db, 'orders', id), { status: 'deleted' });
              } catch (e) { console.log('Soft delete failed, trying hard delete'); }

              // TENTATIVA 2: Hard Delete
              try {
                  await deleteDoc(doc(db, 'orders', id));
                  console.log(`[App] Pedido ${id} deletado.`);
              } catch (error: any) {
                  // Se não existir (not-found), consideramos sucesso pois já sumiu
                  if (error.code !== 'not-found') {
                      console.error("[App] Erro durante exclusão:", error);
                  }
              }
          } 
      });
  };

  const assignOrder = (oid: string, did: string) => handleAction(async () => { 
      await updateDoc(doc(db, 'orders', oid), { status: 'assigned', assignedAt: serverTimestamp(), driverId: did }); 
      await updateDoc(doc(db, 'drivers', did), { status: 'delivering', currentOrderId: oid }); 
  });

  // Other Entities...
  const createProduct = (data: any) => handleAction(async () => { await addDoc(collection(db, 'products'), data); });
  const updateProduct = (id: string, data: any) => handleAction(async () => { await updateDoc(doc(db, 'products', id), data); });
  const deleteProduct = (id: string) => handleAction(async () => { await deleteDoc(doc(db, 'products', id)); });

  const updateClientData = (id: string, data: any) => handleAction(async () => { await setDoc(doc(db, 'clients', id), data, { merge: true }); });

  const createVale = (data: any) => handleAction(async () => { await addDoc(collection(db, 'vales'), { ...data, createdAt: serverTimestamp() }); });
  const createExpense = (data: any) => handleAction(async () => { await addDoc(collection(db, 'expenses'), { ...data, createdAt: serverTimestamp() }); });

  const closeCycle = (driverId: string, data: any) => handleAction(async () => {
      const timestamp = data.endAt ? Timestamp.fromDate(new Date(data.endAt)) : serverTimestamp();
      await addDoc(collection(db, 'settlements'), { ...data, driverId, endAt: timestamp });
      await updateDoc(doc(db, 'drivers', driverId), { lastSettlementAt: timestamp });
      setAlertInfo({ isOpen: true, title: "Sucesso!", message: "Ciclo fechado e pagamento registrado.", type: "info" });
      setModal(null);
  });

  const createSupplier = (data: any) => handleAction(async () => { await addDoc(collection(db, 'suppliers'), data); });
  const updateSupplier = (id: string, data: any) => handleAction(async () => { await updateDoc(doc(db, 'suppliers', id), data); });
  const deleteSupplier = (id: string) => handleAction(async () => { await deleteDoc(doc(db, 'suppliers', id)); });

  const createInventory = (data: any) => handleAction(async () => { await addDoc(collection(db, 'inventory'), data); });
  const updateInventory = (id: string, data: any) => handleAction(async () => { await updateDoc(doc(db, 'inventory', id), data); });
  const deleteInventory = (id: string) => handleAction(async () => { await deleteDoc(doc(db, 'inventory', id)); });

  const addShoppingItem = (name: string) => handleAction(async () => { await addDoc(collection(db, 'shoppingList'), { name, isChecked: false, createdAt: serverTimestamp() }); });
  const toggleShoppingItem = (id: string, currentVal: boolean) => handleAction(async () => { await updateDoc(doc(db, 'shoppingList', id), { isChecked: !currentVal }); });
  const deleteShoppingItem = (id: string) => handleAction(async () => { await deleteDoc(doc(db, 'shoppingList', id)); });
  const clearShoppingList = () => {
      setConfirmInfo({ isOpen: true, title: "Limpar Lista?", message: "Deseja apagar todos os itens da lista de compras?", type: "danger", onConfirm: () => handleAction(async () => {
          const batch = writeBatch(db);
          shoppingList.forEach(item => { const ref = doc(db, 'shoppingList', item.id); batch.delete(ref); });
          await batch.commit();
          setConfirmInfo(null);
      })});
  };

  const createGiveawayEntry = (data: any) => handleAction(async () => {
      const cleanPhone = normalizePhone(data.phone);
      const q = query(collection(db, 'giveaway_entries'), where('phone', '==', cleanPhone));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) throw new Error("Este número já está cadastrado no sorteio!");
      await addDoc(collection(db, 'giveaway_entries'), { ...data, phone: cleanPhone, createdAt: serverTimestamp() });
  });

  const updateGiveawayEntry = (id: string, data: any) => handleAction(async () => {
      await updateDoc(doc(db, 'giveaway_entries', id), data);
  });

  const updateAppConfig = (config: AppConfig) => handleAction(async () => { 
      await setDoc(doc(db, 'config', 'general'), config, { merge: true }); 
      setAppConfigState(prev => ({...prev, ...config}));
  });

  const handleImportCSV = async (csvText: string) => {
      if (!csvText) return;
      const dbBatch = writeBatch(db);
      const lines = csvText.split('\n');
      lines.slice(1).forEach((line) => {
          if (!line.trim()) return;
          const cols = line.split(',').map(c => c.replace(/^"|"$/g, ''));
          if (cols.length >= 15) {
             const [id, date, time, desc, valStr, type] = cols;
             const val = parseFloat(valStr);
             if (isNaN(val)) return;
             const timestamp = new Date(`${date}T${time || '12:00'}`);
             if (type === 'income') {
                 const generatedId = `PED-${Math.floor(100000 + Math.random() * 900000)}`;
                 const orderRef = doc(db, 'orders', id || generatedId);
                 dbBatch.set(orderRef, { customer: cols[10], phone: cols[12] || '', address: cols[13] || '', items: desc, amount: formatCurrency(val), value: val, status: 'completed', completedAt: Timestamp.fromDate(timestamp), createdAt: Timestamp.fromDate(timestamp), origin: 'manual' });
             }
          }
      });
      try { await dbBatch.commit(); setAlertInfo({ isOpen: true, title: "Importação Concluída", message: "Dados importados com sucesso!", type: "info" }); setModal(null); } catch(e: any) { console.error(e); setAlertInfo({ isOpen: true, title: "Erro na Importação", message: e.message, type: "error" }); }
  };

  // --- RENDER ---

  if (loading && !user) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-amber-500 w-12 h-12 mb-4"/>
              <p className="text-white font-bold animate-pulse">Carregando Sistema...</p>
          </div>
      );
  }

  // CLIENT & LANDING (Menu Cardápio)
  if (viewMode === 'client' || viewMode === 'landing') {
      return (
          <>
            <GlobalStyles />
            <ClientInterface 
                products={products} 
                appConfig={appConfig} 
                onCreateOrder={createOrder} 
                onEnterGiveaway={createGiveawayEntry}
                allowSystemAccess={viewMode === 'landing'}
                onSystemAccess={(type) => { 
                    if(type === 'driver') setCurrentDriverId('select');
                    setViewMode(type); 
                }}
            />
          </>
      );
  }

  // DRIVER INTERFACE
  if (viewMode === 'driver') {
      if (currentDriverId === 'select' || !currentDriverId) {
          return <DriverSelection drivers={drivers} onSelect={(id) => { setCurrentDriverId(id); localStorage.setItem('jhans_driverId', id); }} onBack={handleLogout} />;
      }
      const myDriver = drivers.find(d => d.id === currentDriverId);
      if (!myDriver) return <div className="p-10 text-center text-white bg-slate-900 h-screen"><button onClick={handleLogout} className="border p-2 rounded">Sair (Motorista não encontrado)</button></div>;

      return (
          <>
            <GlobalStyles />
            <DriverInterface 
                driver={myDriver} 
                orders={orders} 
                vales={vales}
                onToggleStatus={() => updateDriver(myDriver.id, { status: myDriver.status === 'offline' ? 'available' : 'offline' })}
                onAcceptOrder={(oid) => { 
                    updateOrder(oid, { status: 'delivering', driverId: myDriver.id, assignedAt: serverTimestamp() });
                    updateDriver(myDriver.id, { status: 'delivering', currentOrderId: oid });
                }}
                onCompleteOrder={(oid, did) => {
                    updateOrder(oid, { status: 'completed', completedAt: serverTimestamp() });
                    updateDriver(did, { status: 'available', currentOrderId: null, totalDeliveries: (myDriver.totalDeliveries || 0) + 1 });
                }}
                onUpdateOrder={updateOrder}
                onDeleteOrder={deleteOrder}
                onLogout={handleLogout}
                onUpdateDriver={updateDriver}
            />
          </>
      );
  }

  // ADMIN INTERFACE
  return (
      <>
        <GlobalStyles />
        <AdminInterface 
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
            appConfig={appConfig}
            isMobile={window.innerWidth < 768}
            setModal={setModal}
            setModalData={setModalData}
            onLogout={handleLogout}
            onDeleteOrder={deleteOrder}
            onAssignOrder={assignOrder}
            setDriverToEdit={setDriverToEdit}
            onDeleteDriver={deleteDriver}
            setClientToEdit={setClientToEdit}
            onUpdateOrder={updateOrder}
            onCreateOrder={createOrder}
            onCreateDriver={createDriver}
            onUpdateDriver={updateDriver}
            onCreateVale={createVale}
            onCreateExpense={(data: any) => { createExpense(data); setModal(null); }}
            onCreateProduct={createProduct}
            onDeleteProduct={deleteProduct}
            onUpdateProduct={updateProduct}
            onUpdateClient={(id, data) => { updateClientData(id, data); setModal(null); }}
            onCloseCycle={(driverId, data) => closeCycle(driverId, data)}
            onCreateSupplier={createSupplier}
            onUpdateSupplier={updateSupplier}
            onDeleteSupplier={deleteSupplier}
            onCreateInventory={createInventory}
            onUpdateInventory={updateInventory}
            onDeleteInventory={deleteInventory}
            onAddShoppingItem={addShoppingItem}
            onToggleShoppingItem={toggleShoppingItem}
            onDeleteShoppingItem={deleteShoppingItem}
            onClearShoppingList={clearShoppingList}
            setAppConfig={updateAppConfig}
            modal={modal}
            modalData={modalData}
            // NEW PROP
            onUpdateGiveawayEntry={updateGiveawayEntry}
        />
        
        {/* GLOBAL MODALS CONTROLLED BY STATE */}
        {modal === 'settings' && (
            <SettingsModal 
                config={appConfig} 
                onSave={updateAppConfig} 
                onClose={() => setModal(null)} 
            />
        )}
        
        {modal === 'driver' && (
            <NewDriverModal 
                initialData={driverToEdit} 
                onSave={(data: any) => { 
                    if(driverToEdit) updateDriver(driverToEdit.id, data); 
                    else createDriver(data); 
                }} 
                onClose={() => { setModal(null); setDriverToEdit(null); }} 
            />
        )}
        
        {modal === 'vale' && driverToEdit && (
            <NewValeModal 
                driver={driverToEdit} 
                onClose={() => { setModal(null); setDriverToEdit(null); }} 
                onSave={createVale} 
            />
        )}

        {modal === 'expense' && (
            <NewExpenseModal 
                onClose={() => setModal(null)} 
                onSave={(data: any) => { createExpense(data); setModal(null); }} 
            />
        )}
        
        {modal === 'closeCycle' && modalData && (
            <CloseCycleModal 
                data={modalData} 
                onConfirm={(data: any) => closeCycle(driverToEdit?.id || '', data)} 
                onClose={() => { setModal(null); setDriverToEdit(null); }} 
            />
        )}
        
        {modal === 'import' && (
            <ImportModal 
                onImportCSV={handleImportCSV} 
                onClose={() => setModal(null)} 
            />
        )}
        
        {modal === 'client' && clientToEdit && (
            <EditClientModal 
                client={clientToEdit} 
                orders={orders} 
                onSave={(data: any) => { 
                    updateClientData(clientToEdit.id, data); 
                    setModal(null); 
                }} 
                onClose={() => { setModal(null); setClientToEdit(null); }} 
                onUpdateOrder={updateOrder} 
            />
        )}
        
        {/* CONFIRMATION & ALERTS */}
        {confirmInfo && (
            <GenericConfirmModal 
                isOpen={confirmInfo.isOpen} 
                title={confirmInfo.title} 
                message={confirmInfo.message} 
                onConfirm={confirmInfo.onConfirm} 
                onClose={() => setConfirmInfo(null)}
                type={confirmInfo.type}
            />
        )}
        
        {alertInfo && (
            <GenericAlertModal 
                isOpen={alertInfo.isOpen} 
                title={alertInfo.title} 
                message={alertInfo.message} 
                type={alertInfo.type}
                onClose={() => setAlertInfo(null)}
            />
        )}
      </>
  );
}

// Driver Selection Component (Simple Auth)
function DriverSelection({ drivers, onSelect, onBack }: { drivers: Driver[], onSelect: (id: string) => void, onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = (e: React.FormEvent) => { 
      e.preventDefault(); 
      const driver = drivers.find((d) => d.id === selectedId); 
      if (!driver?.password) { 
          onSelect(driver?.id || ''); 
          return; 
      } 
      if (driver.password === password) { 
          onSelect(driver.id); 
      } else { 
          setError("Senha incorreta"); 
      } 
  };

  if (selectedId) {
      const driver = drivers.find((d) => d.id === selectedId);
      return (
        <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
           <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-800">
               <div className="text-center mb-6"><div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-slate-800 shadow-md overflow-hidden relative"><img src={driver?.avatar} className="w-full h-full object-cover" alt="avatar" /></div><h3 className="font-bold text-xl text-white">Olá, {driver?.name}!</h3></div>
               <form onSubmit={handleLogin} className="space-y-4"><input type="password" autoFocus className="w-full border-2 border-slate-700 bg-slate-950 rounded-xl p-3 text-center text-lg font-normal text-white outline-none focus:border-amber-500" placeholder="Senha" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} />{error && <p className="text-red-