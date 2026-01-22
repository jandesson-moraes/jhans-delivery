import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { collection, addDoc, updateDoc, doc, onSnapshot, serverTimestamp, deleteDoc, setDoc, writeBatch, Timestamp } from "firebase/firestore";
import { auth, db } from './services/firebase';
import { UserType, Driver, Order, Vale, Expense, Product, Client, AppConfig, Settlement } from './types';
import { BrandLogo, Footer } from './components/Shared';
import DriverInterface from './components/DriverInterface';
import AdminInterface from './components/AdminInterface';
import { NewDriverModal, SettingsModal, ImportModal, NewExpenseModal, NewValeModal, EditClientModal, CloseCycleModal } from './components/Modals';
import { Loader2, TrendingUp, ChevronRight, Bike } from 'lucide-react';
import { normalizePhone, capitalize, formatCurrency } from './utils';

// --- STYLES INJECTION ---
const GlobalStyles = () => {
    useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        /* Rotas de Movimento Aleatórias e Suaves */
        /* Rota 1: Circular Suave */
        @keyframes pathA { 
            0% { transform: translate3d(0,0,0); }
            25% { transform: translate3d(60px, 40px, 0); }
            50% { transform: translate3d(0, 80px, 0); }
            75% { transform: translate3d(-60px, 40px, 0); }
            100% { transform: translate3d(0,0,0); }
        }
        /* Rota 2: Zig Zag Horizontal */
        @keyframes pathB { 
            0% { transform: translate3d(0,0,0); }
            30% { transform: translate3d(100px, -20px, 0); }
            60% { transform: translate3d(50px, 40px, 0); }
            100% { transform: translate3d(0,0,0); }
        }
        /* Rota 3: Bloco Quadrado */
        @keyframes pathC { 
            0% { transform: translate3d(0,0,0); }
            25% { transform: translate3d(0, 100px, 0); }
            50% { transform: translate3d(100px, 100px, 0); }
            75% { transform: translate3d(100px, 0, 0); }
            100% { transform: translate3d(0,0,0); }
        }
        /* Rota 4: Patrulha Vertical */
        @keyframes pathD { 
            0% { transform: translate3d(0,0,0); }
            50% { transform: translate3d(20px, 150px, 0); }
            100% { transform: translate3d(0,0,0); }
        }
        /* Rota 5: Aleatório Curto */
        @keyframes pathE { 
            0% { transform: translate3d(0,0,0); }
            33% { transform: translate3d(-50px, 30px, 0); }
            66% { transform: translate3d(30px, 50px, 0); }
            100% { transform: translate3d(0,0,0); }
        }
        
        /* Classes de Animação com durações variadas */
        .animate-path-0 { animation: pathA 45s ease-in-out infinite; }
        .animate-path-1 { animation: pathB 50s ease-in-out infinite; }
        .animate-path-2 { animation: pathC 60s linear infinite; }
        .animate-path-3 { animation: pathD 55s ease-in-out infinite; }
        .animate-path-4 { animation: pathE 40s ease-in-out infinite; }

        /* Mapa Perspectiva - Fundo Estilo Satélite Noturno */
        .perspective-container {
            perspective: 1000px;
            overflow: hidden;
            background: #020617;
        }
        .map-plane {
            transform: rotateX(40deg) scale(1.4);
            transform-style: preserve-3d;
            background-color: #0f172a;
            /* Simulação de Ruas e Quarteirões */
            background-image: 
                linear-gradient(rgba(30, 41, 59, 0.8) 2px, transparent 2px),
                linear-gradient(90deg, rgba(30, 41, 59, 0.8) 2px, transparent 2px),
                linear-gradient(rgba(30, 41, 59, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(30, 41, 59, 0.3) 1px, transparent 1px);
            background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px;
            box-shadow: inset 0 0 200px #020617;
        }
        
        /* Radar Clean */
        @keyframes radar-pulse {
            0% { transform: scale(0); opacity: 0.5; }
            100% { transform: scale(3); opacity: 0; }
        }
        .radar-pulse {
            animation: radar-pulse 2s infinite;
        }

        /* Billboard para corrigir rotação */
        .billboard-corrector {
            transform: rotateX(-40deg); 
        }

        /* Scrollbars */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        * { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
      `;
      document.head.appendChild(style);
      return () => { if(document.head.contains(style)) document.head.removeChild(style); };
    }, []);
    return null;
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<UserType>(() => { try { return (localStorage.getItem('jhans_viewMode') as UserType) || 'landing'; } catch { return 'landing'; } });
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(() => { try { return localStorage.getItem('jhans_driverId'); } catch { return null; } });
  const [appConfig, setAppConfig] = useState<AppConfig>(() => { try { const saved = localStorage.getItem('jhans_app_config'); return saved ? JSON.parse(saved) : { appName: "Jhans Burgers", appLogoUrl: "" }; } catch { return { appName: "Jhans Burgers", appLogoUrl: "" }; } });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vales, setVales] = useState<Vale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [modal, setModal] = useState<any>(null);
  const [modalData, setModalData] = useState<any>(null); // Dados temporários para passar aos modais
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { localStorage.setItem('jhans_app_config', JSON.stringify(appConfig)); }, [appConfig]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else signInAnonymously(auth).catch(console.error);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubs = [
        onSnapshot(collection(db, 'drivers'), s => setDrivers(s.docs.map(d => ({id: d.id, ...d.data()} as Driver)))),
        onSnapshot(collection(db, 'orders'), s => setOrders(s.docs.map(d => ({id: d.id, ...d.data()} as Order)))),
        onSnapshot(collection(db, 'vales'), s => setVales(s.docs.map(d => ({id: d.id, ...d.data()} as Vale)))),
        onSnapshot(collection(db, 'expenses'), s => setExpenses(s.docs.map(d => ({id: d.id, ...d.data()} as Expense)))),
        onSnapshot(collection(db, 'products'), s => setProducts(s.docs.map(d => ({id: d.id, ...d.data()} as Product)))),
        onSnapshot(collection(db, 'settlements'), s => setSettlements(s.docs.map(d => ({id: d.id, ...d.data()} as Settlement)))),
        onSnapshot(collection(db, 'clients'), s => { setClients(s.docs.map(d => ({id: d.id, ...d.data()} as Client))); setLoading(false); })
    ];
    return () => unsubs.forEach(u => u());
  }, [user]);

  const handleAction = async (action: () => Promise<void>) => { try { await action(); } catch(e: any) { console.error(e); alert('Erro: ' + e.message); } };

  const createOrder = (data: any) => handleAction(async () => {
    await addDoc(collection(db, 'orders'), { ...data, status: 'pending', createdAt: serverTimestamp() });
    if (data.phone) {
        const cleanPhone = normalizePhone(data.phone);
        if (cleanPhone) await setDoc(doc(db, 'clients', cleanPhone), { name: data.customer, phone: data.phone, address: data.address, mapsLink: data.mapsLink || '', lastOrderAt: serverTimestamp() }, { merge: true });
    }
  });

  const createDriver = (data: any) => handleAction(async () => { await addDoc(collection(db, 'drivers'), data); });
  const updateDriver = (id: string, data: any) => handleAction(async () => { await updateDoc(doc(db, 'drivers', id), data); });
  const deleteDriver = (id: string) => handleAction(async () => { if (confirm("Tem certeza?")) await deleteDoc(doc(db, 'drivers', id)); });
  const updateOrder = (id: string, data: any) => handleAction(async () => { await updateDoc(doc(db, 'orders', id), data); });
  const deleteOrder = (id: string) => handleAction(async () => { if (confirm("Excluir pedido?")) await deleteDoc(doc(db, 'orders', id)); });
  const assignOrder = (oid: string, did: string) => handleAction(async () => { await updateDoc(doc(db, 'orders', oid), { status: 'assigned', assignedAt: serverTimestamp(), driverId: did }); await updateDoc(doc(db, 'drivers', did), { status: 'delivering', currentOrderId: oid }); });
  const acceptOrder = (id: string) => handleAction(async () => { await updateDoc(doc(db, 'orders', id), { status: 'delivering' }); });
  const completeOrder = (oid: string, did: string) => handleAction(async () => {
      const drv = drivers.find(d => d.id === did);
      await updateDoc(doc(db, 'orders', oid), { status: 'completed', completedAt: serverTimestamp() });
      if(drv?.currentOrderId === oid) await updateDoc(doc(db, 'drivers', did), { status: 'available', currentOrderId: null, totalDeliveries: (drv.totalDeliveries || 0) + 1 });
      else await updateDoc(doc(db, 'drivers', did), { totalDeliveries: (drv?.totalDeliveries || 0) + 1 });
  });
  const toggleStatus = (did: string) => handleAction(async () => { const d = drivers.find(drv => drv.id === did); if(d) await updateDoc(doc(db, 'drivers', did), { status: d.status === 'offline' ? 'available' : 'offline' }); });
  const createVale = (data: any) => handleAction(async () => { await addDoc(collection(db, 'vales'), { ...data, createdAt: serverTimestamp() }); });
  const createExpense = (data: any) => handleAction(async () => { await addDoc(collection(db, 'expenses'), { ...data, createdAt: serverTimestamp() }); });
  const createProduct = (data: any) => handleAction(async () => { await addDoc(collection(db, 'products'), data); });
  const updateProduct = (id: string, data: any) => handleAction(async () => { await updateDoc(doc(db, 'products', id), data); });
  const deleteProduct = (id: string) => handleAction(async () => { if(confirm("Excluir produto?")) await deleteDoc(doc(db, 'products', id)); });
  const updateClientData = (id: string, data: any) => handleAction(async () => { await setDoc(doc(db, 'clients', id), data, { merge: true }); });
  
  // Função para fechar ciclo do motoboy
  const handleCloseCycle = (data: any) => handleAction(async () => {
      if (!driverToEdit) return;
      const timestamp = data.endAt ? Timestamp.fromDate(new Date(data.endAt)) : serverTimestamp();
      
      await addDoc(collection(db, 'settlements'), {
          ...data,
          driverId: driverToEdit.id,
          endAt: timestamp
      });
      await updateDoc(doc(db, 'drivers', driverToEdit.id), {
          lastSettlementAt: timestamp
      });
      alert('Ciclo fechado com sucesso! Os valores foram zerados para o próximo período.');
  });

  const handleImportCSV = async (csvText: string) => {
      if (!csvText) return;
      const dbBatch = writeBatch(db);
      const lines = csvText.split('\n');
      lines.slice(1).forEach((line) => {
          if (!line.trim()) return;
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          const cols = matches.map(c => c.replace(/^"|"$/g, ''));
          if (cols.length >= 15) {
             const [id, date, time, desc, valStr, type, cat, , , , clientName, , phone, addr, mapLink] = cols;
             const val = parseFloat(valStr);
             if (isNaN(val)) return;
             const timestamp = new Date(`${date}T${time || '12:00'}`);
             if (type === 'income') {
                 const orderId = id || 'ord_' + Date.now() + Math.random();
                 const orderRef = doc(db, 'orders', orderId);
                 dbBatch.set(orderRef, { customer: capitalize(clientName), phone: phone || '', address: capitalize(addr) || '', mapsLink: mapLink || '', items: desc, amount: formatCurrency(val), value: val, status: 'completed', completedAt: Timestamp.fromDate(timestamp), createdAt: Timestamp.fromDate(timestamp), origin: 'manual' });
                 const cleanPhone = normalizePhone(phone);
                 if (cleanPhone) { const clientRef = doc(db, 'clients', cleanPhone); dbBatch.set(clientRef, { name: capitalize(clientName), phone: phone, address: capitalize(addr) || '', mapsLink: mapLink || '', lastOrderAt: Timestamp.fromDate(timestamp) }, { merge: true }); }
             } else if (type === 'expense') {
                 const expenseId = id || 'exp_' + Date.now() + Math.random();
                 const expRef = doc(db, 'expenses', expenseId);
                 dbBatch.set(expRef, { description: capitalize(desc), amount: val, category: cat || 'outros', createdAt: Timestamp.fromDate(timestamp) });
             }
          }
      });
      try { await dbBatch.commit(); alert("Dados importados!"); setModal(null); } catch(e) { console.error(e); alert("Erro ao importar."); }
  };

  const handleLogout = () => { localStorage.clear(); window.location.reload(); };

  if (loading && !user) return <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin w-10 h-10 text-amber-500 mb-4"/> <span className="font-medium animate-pulse">Carregando Sistema...</span></div>;

  if (viewMode === 'landing') return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <GlobalStyles />
      <div className="z-10 text-center space-y-8 max-w-md w-full animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="flex justify-center scale-125 mb-4"><BrandLogo size="large" config={appConfig} /></div>
        <div className="space-y-3">
          <button onClick={() => setViewMode('admin')} className="w-full group relative flex items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-2xl transition-all hover:border-amber-500/50 hover:bg-slate-800">
            <div className="flex items-center gap-4"><div className="bg-blue-900/30 p-3 rounded-xl text-blue-400"><TrendingUp size={20}/></div><div className="text-left"><span className="block font-bold text-white text-lg">Sou Gerente</span><span className="text-xs text-slate-400">Painel Administrativo</span></div></div><ChevronRight className="text-slate-500 group-hover:text-white transition-colors" />
          </button>
          <button onClick={() => { setViewMode('driver'); setCurrentDriverId('select'); }} className="w-full group relative flex items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-2xl transition-all hover:border-emerald-500/50 hover:bg-slate-800">
              <div className="flex items-center gap-4"><div className="bg-emerald-900/30 p-3 rounded-xl text-emerald-400"><Bike size={20}/></div><div className="text-left"><span className="block font-bold text-white text-lg">Sou Motoboy</span><span className="text-xs text-slate-400">App de Entregas</span></div></div><ChevronRight className="text-slate-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-4 z-20">
          <Footer />
      </div>
    </div>
  );

  if (viewMode === 'driver') {
    if (currentDriverId === 'select' || !currentDriverId) {
        return <DriverSelection drivers={drivers} onSelect={(id) => { setCurrentDriverId(id); localStorage.setItem('jhans_driverId', id); }} onBack={handleLogout} />;
    }
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return <div className="p-10 text-center text-white bg-slate-900 h-screen"><p>Motorista não encontrado.</p><button onClick={handleLogout}>Sair</button></div>;
    return (
        <>
            <GlobalStyles />
            <DriverInterface driver={driver} orders={orders} onToggleStatus={() => toggleStatus(driver.id)} onAcceptOrder={acceptOrder} onCompleteOrder={completeOrder} onLogout={handleLogout} />
        </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <AdminInterface 
          drivers={drivers} orders={orders} vales={vales} expenses={expenses} products={products} clients={clients} settlements={settlements}
          onAssignOrder={assignOrder} onCreateDriver={createDriver} onUpdateDriver={updateDriver} onDeleteDriver={deleteDriver} 
          onCreateOrder={createOrder} onDeleteOrder={deleteOrder} onUpdateOrder={updateOrder} onCreateVale={createVale} onCreateExpense={createExpense}
          onCreateProduct={createProduct} onDeleteProduct={deleteProduct} onUpdateProduct={updateProduct} onUpdateClient={updateClientData} onLogout={handleLogout}
          onCloseCycle={(driverId, data) => handleCloseCycle(data)} 
          isMobile={isMobile} appConfig={appConfig} setAppConfig={setAppConfig} setModal={setModal} setModalData={setModalData}
          setDriverToEdit={setDriverToEdit} setClientToEdit={setClientToEdit}
          {...{modal}} 
      />
      {modal === 'settings' && <SettingsModal config={appConfig} onSave={(newConfig: AppConfig) => { setAppConfig(newConfig); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === 'driver' && <NewDriverModal onClose={()=>{setModal(null); setDriverToEdit(null);}} onSave={driverToEdit ? (data: any) => updateDriver(driverToEdit.id, data) : createDriver} initialData={driverToEdit} />}
      {modal === 'vale' && driverToEdit && <NewValeModal driver={driverToEdit} onClose={() => { setModal(null); setDriverToEdit(null); }} onSave={createVale} />}
      {modal === 'import' && <ImportModal onClose={() => setModal(null)} onImportCSV={handleImportCSV} />}
      {modal === 'expense' && <NewExpenseModal onClose={() => setModal(null)} onSave={createExpense} />}
      {modal === 'client' && clientToEdit && <EditClientModal client={clientToEdit} orders={orders} onClose={() => setModal(null)} onUpdateOrder={updateOrder} onSave={(data: any) => { updateClientData(clientToEdit.id, data); setModal(null); }} />}
      {modal === 'closeCycle' && driverToEdit && modalData && (
          <CloseCycleModal 
            data={modalData} 
            onClose={() => { setModal(null); setDriverToEdit(null); setModalData(null); }}
            onConfirm={(data: any) => handleCloseCycle(data)} 
          />
      )}
    </>
  );
}

function DriverSelection({ drivers, onSelect, onBack }: { drivers: Driver[], onSelect: (id: string) => void, onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const driver = drivers.find((d) => d.id === selectedId);
    if (!driver?.password) { onSelect(driver?.id || ''); return; }
    if (driver.password === password) { onSelect(driver.id); } else { setError("Senha incorreta"); }
  };

  if (selectedId) {
      const driver = drivers.find((d) => d.id === selectedId);
      return (
        <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
           <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-800">
               <div className="text-center mb-6">
                   <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-slate-800 shadow-md overflow-hidden relative">
                       <img src={driver?.avatar} className="w-full h-full object-cover" alt="avatar" />
                   </div>
                   <h3 className="font-bold text-xl text-white">Olá, {driver?.name}!</h3>
               </div>
               <form onSubmit={handleLogin} className="space-y-4">
                   <input type="password" autoFocus className="w-full border-2 border-slate-700 bg-slate-950 rounded-xl p-3 text-center text-lg font-normal text-white outline-none focus:border-amber-500" placeholder="Senha" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} />
                   {error && <p className="text-red-500 text-center font-bold animate-pulse text-sm">{error}</p>}
                   <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors">Acessar Painel</button>
               </form>
               <button onClick={() => setSelectedId(null)} className="w-full mt-4 text-slate-500 text-sm hover:text-amber-500 transition-colors">← Voltar</button>
               <div className="mt-6 border-t border-slate-800 pt-4">
                   <Footer />
               </div>
           </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-slate-800 flex flex-col max-h-[85vh]">
        <h2 className="text-xl font-bold mb-6 text-white text-center">Quem é você?</h2>
        <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {drivers.map((d: Driver) => (
            <button key={d.id} onClick={() => setSelectedId(d.id)} className="w-full flex items-center gap-4 p-3 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-amber-500/50 transition-all group bg-slate-950">
              <img src={d.avatar} className="w-10 h-10 rounded-full bg-slate-800 shadow-sm object-cover" alt={d.name}/>
              <div className="text-left flex-1"><span className="font-bold text-slate-200 block">{d.name}</span><span className="text-xs text-slate-500 uppercase font-semibold">{d.vehicle}</span></div>
            </button>
          ))}
        </div>
        <button onClick={onBack} className="mt-6 w-full py-3 text-slate-500 text-sm hover:bg-slate-800 rounded-xl font-medium transition-colors">Voltar</button>
        <div className="mt-2">
            <Footer />
        </div>
      </div>
    </div>
  )
}