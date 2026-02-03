
import React, { useState, useEffect } from 'react';
import { db, auth } from './services/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, setDoc, query, where, getDocs, serverTimestamp, writeBatch, Timestamp, onSnapshot } from 'firebase/firestore';
import { AppConfig, Driver, Order, Vale, Expense, Product, Client, Settlement, Supplier, InventoryItem, ShoppingItem, GiveawayEntry, UserType } from './types';
import { normalizePhone, formatCurrency } from './utils';
import { Loader2 } from 'lucide-react';
import { GlobalStyles } from './styles/GlobalStyles'; // Assuming this exists or is not critical, but since user didn't provide it, I'll comment it out if it fails, but I'll keep it as user likely has it.

// Components
import AdminInterface from './components/AdminInterface';
import ClientInterface from './components/ClientInterface';
import DriverInterface from './components/DriverInterface';
import DriverSelection from './components/DriverSelection'; // Assuming this file exists based on usage in snippet
import { GenericAlertModal } from './components/Modals';

// Placeholder for GlobalStyles if not provided in list
const GlobalStylesPlaceholder = () => <style>{`body { background-color: #020617; color: white; margin: 0; font-family: sans-serif; }`}</style>;

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<UserType>('landing');
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(null);
  
  // Data States
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
  
  const [appConfig, setAppConfigState] = useState<AppConfig>({ 
      appName: 'Jhans Burgers', 
      appLogoUrl: '', 
      deliveryZones: [], 
      schedule: {} 
  });

  // Modal Control
  const [modal, setModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: string} | null>(null);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  // Helper for error handling
  const handleAction = (action: () => Promise<void>) => {
      return async () => {
          try {
              await action();
          } catch (error: any) {
              console.error(error);
              setAlertInfo({ isOpen: true, title: "Erro", message: error.message, type: "error" });
          }
      };
  };

  useEffect(() => {
      // Load initial data
      const unsubDrivers = onSnapshot(collection(db, 'drivers'), (snap) => setDrivers(snap.docs.map(d => ({id: d.id, ...d.data()} as Driver))));
      const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => setOrders(snap.docs.map(d => ({id: d.id, ...d.data()} as Order))));
      const unsubVales = onSnapshot(collection(db, 'vales'), (snap) => setVales(snap.docs.map(d => ({id: d.id, ...d.data()} as Vale))));
      const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => setExpenses(snap.docs.map(d => ({id: d.id, ...d.data()} as Expense))));
      const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => setProducts(snap.docs.map(d => ({id: d.id, ...d.data()} as Product))));
      const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => setClients(snap.docs.map(d => ({id: d.id, ...d.data()} as Client))));
      const unsubSettlements = onSnapshot(collection(db, 'settlements'), (snap) => setSettlements(snap.docs.map(d => ({id: d.id, ...d.data()} as Settlement))));
      const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snap) => setSuppliers(snap.docs.map(d => ({id: d.id, ...d.data()} as Supplier))));
      const unsubInventory = onSnapshot(collection(db, 'inventory'), (snap) => setInventory(snap.docs.map(d => ({id: d.id, ...d.data()} as InventoryItem))));
      const unsubShopping = onSnapshot(collection(db, 'shopping_list'), (snap) => setShoppingList(snap.docs.map(d => ({id: d.id, ...d.data()} as ShoppingItem))));
      const unsubGiveaway = onSnapshot(collection(db, 'giveaway_entries'), (snap) => setGiveawayEntries(snap.docs.map(d => ({id: d.id, ...d.data()} as GiveawayEntry))));
      const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (snap) => { if(snap.exists()) setAppConfigState(snap.data() as AppConfig); });

      // Mock auth check
      setTimeout(() => {
          setLoading(false);
          // Auto-login logic could go here
      }, 1000);

      return () => {
          unsubDrivers(); unsubOrders(); unsubVales(); unsubExpenses(); unsubProducts(); unsubClients();
          unsubSettlements(); unsubSuppliers(); unsubInventory(); unsubShopping(); unsubGiveaway(); unsubConfig();
      };
  }, []);

  const handleLogout = () => {
      setViewMode('landing');
      setCurrentDriverId(null);
      localStorage.removeItem('jhans_driverId');
  };

  // CRUD Actions
  const createOrder = (data: any) => handleAction(async () => {
      await addDoc(collection(db, 'orders'), { ...data, createdAt: serverTimestamp() });
  });

  const updateOrder = (id: string, data: any) => handleAction(async () => {
      await updateDoc(doc(db, 'orders', id), data);
  });

  const deleteOrder = (id: string) => handleAction(async () => {
      await deleteDoc(doc(db, 'orders', id));
  });

  const assignOrder = (oid: string, did: string) => handleAction(async () => {
      await updateDoc(doc(db, 'orders', oid), { driverId: did, status: 'delivering', assignedAt: serverTimestamp() });
      await updateDoc(doc(db, 'drivers', did), { status: 'delivering', currentOrderId: oid });
  });

  const createDriver = (data: any) => handleAction(async () => {
      await addDoc(collection(db, 'drivers'), data);
  });

  const updateDriver = (id: string, data: any) => handleAction(async () => {
      await updateDoc(doc(db, 'drivers', id), data);
  });

  const deleteDriver = (id: string) => handleAction(async () => {
      await deleteDoc(doc(db, 'drivers', id));
  });

  const createVale = (data: any) => handleAction(async () => {
      await addDoc(collection(db, 'vales'), { ...data, createdAt: serverTimestamp() });
  });

  const createExpense = (data: any) => handleAction(async () => {
      await addDoc(collection(db, 'expenses'), { ...data, createdAt: serverTimestamp() });
  });

  const createProduct = (data: any) => handleAction(async () => {
      await addDoc(collection(db, 'products'), data);
  });

  const updateProduct = (id: string, data: any) => handleAction(async () => {
      await updateDoc(doc(db, 'products', id), data);
  });

  const deleteProduct = (id: string) => handleAction(async () => {
      await deleteDoc(doc(db, 'products', id));
  });

  const updateClientData = (id: string, data: any) => handleAction(async () => {
      await updateDoc(doc(db, 'clients', id), data);
  });

  const closeCycle = (driverId: string, data: any) => handleAction(async () => {
      await addDoc(collection(db, 'settlements'), { ...data, driverId, createdAt: serverTimestamp() });
      await updateDoc(doc(db, 'drivers', driverId), { lastSettlementAt: serverTimestamp() });
  });

  const createSupplier = (data: any) => handleAction(async () => {
      await addDoc(collection(db, 'suppliers'), data);
  });

  const updateSupplier = (id: string, data: any) => handleAction(async () => {
      await updateDoc(doc(db, 'suppliers', id), data);
  });

  const deleteSupplier = (id: string) => handleAction(async () => {
      await deleteDoc(doc(db, 'suppliers', id));
  });

  const createInventory = (data: any) => handleAction(async () => {
      await addDoc(collection(db, 'inventory'), data);
  });

  const updateInventory = (id: string, data: any) => handleAction(async () => {
      await updateDoc(doc(db, 'inventory', id), data);
  });

  const deleteInventory = (id: string) => handleAction(async () => {
      await deleteDoc(doc(db, 'inventory', id));
  });

  const addShoppingItem = (name: string) => handleAction(async () => {
      await addDoc(collection(db, 'shopping_list'), { name, isChecked: false, createdAt: serverTimestamp() });
  });

  const toggleShoppingItem = (id: string, currentVal: boolean) => handleAction(async () => {
      await updateDoc(doc(db, 'shopping_list', id), { isChecked: !currentVal });
  });

  const deleteShoppingItem = (id: string) => handleAction(async () => {
      await deleteDoc(doc(db, 'shopping_list', id));
  });

  const clearShoppingList = () => handleAction(async () => {
      const batch = writeBatch(db);
      shoppingList.forEach(item => batch.delete(doc(db, 'shopping_list', item.id)));
      await batch.commit();
  });

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

  const deleteGiveawayEntry = (id: string) => handleAction(async () => {
      await deleteDoc(doc(db, 'giveaway_entries', id));
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
            <GlobalStylesPlaceholder />
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
          // Fallback if DriverSelection component is not present or working
          if (typeof DriverSelection === 'undefined') {
              return <div className="p-10 text-white">DriverSelection component missing. Please contact admin.</div>;
          }
          return <DriverSelection drivers={drivers} onSelect={(id: string) => { setCurrentDriverId(id); localStorage.setItem('jhans_driverId', id); }} onBack={handleLogout} />;
      }
      const myDriver = drivers.find(d => d.id === currentDriverId);
      if (!myDriver) return <div className="p-10 text-center text-white bg-slate-900 h-screen"><button onClick={handleLogout} className="border p-2 rounded">Sair (Motorista não encontrado)</button></div>;

      return (
          <>
            <GlobalStylesPlaceholder />
            <DriverInterface 
                driver={myDriver} 
                />
          </>
      );
  } 

  // ADMIN INTERFACE
  if (viewMode === 'admin') {
      return (
          <>
            <GlobalStylesPlaceholder />
            <AdminInterface 
                drivers={drivers} 
                orders={orders} 
                vales={vales} 
                products={products} 
                clients={clients} 
                suppliers={suppliers} 
                expenses={expenses} 
                settlements={settlements} 
                inventory={inventory} 
                shopping={shopping} 
                appConfig={appConfig}   
                isMobile={isMobile} 
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
                onCreateExpense={createExpense} 
                onCreateProduct={createProduct} 
                onImportCSV={handleImportCSV} 
                onExportCSV={handleExportCSV} 
                onExportPDF={handleExportPDF} 
                onExportExcel={handleExportExcel} 
                />
          </>
      );
  }

  return (
      <div className="p-10 text-center text-white bg-slate-900 h-screen">
          <button onClick={handleLogout} className="border p-2 rounded">Sair (Modo Desconhecido)</button>
      </div>                                    
  ) ;
}   