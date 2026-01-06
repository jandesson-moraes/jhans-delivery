import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Package, Clock, 
  X, Search, Users, Bike, 
  TrendingUp, Utensils, Plus, LogOut, CheckSquare,
  MessageCircle, DollarSign, Link as LinkIcon, Database, Loader2, Crosshair
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp
} from "firebase/firestore";

// --- SUA CONFIGURAÇÃO DO FIREBASE (Jhans Delivery Base) ---
const firebaseConfig = {
  apiKey: "AIzaSyAcgauavrlochP0iM-ZXfcW4nuZU1YE0bc",
  authDomain: "jhans-delivery-base.firebaseapp.com",
  projectId: "jhans-delivery-base",
  storageBucket: "jhans-delivery-base.firebasestorage.app",
  messagingSenderId: "499879933710",
  appId: "1:499879933710:web:6f26d641172ec914d0095f",
  measurementId: "G-KYB5T3N6L5"
};

// Inicialização do App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Tipos ---
type UserType = 'admin' | 'driver' | 'landing';
type DriverStatus = 'available' | 'delivering' | 'offline';

interface Driver {
  id: string; 
  name: string;
  status: DriverStatus;
  lat: number;
  lng: number;
  battery: number;
  vehicle: string;
  phone: string;
  currentOrderId?: string;
  avatar: string;
  rating: number;
  totalDeliveries: number;
}

interface Order {
  id: string; 
  customer: string;
  phone: string; 
  address: string;
  mapsLink?: string; 
  items: string; 
  status: 'pending' | 'assigned' | 'completed';
  amount: string;
  value: number; 
  time: string;
  lat: number; 
  lng: number;
  createdAt: any; 
}

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<UserType>('landing');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 1. Autenticação Anônima ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
        if (u) {
            setUser(u);
        } else {
            signInAnonymously(auth).catch((e) => {
                console.error("Erro no login anônimo", e);
                alert("Erro de conexão. Verifique se a Autenticação Anônima está ativada no Firebase Console.");
            });
        }
    });
    return () => unsubAuth();
  }, []);

  // --- 2. Dados em Tempo Real ---
  useEffect(() => {
    if (!user) return;

    // Coleções Simplificadas (Raiz do Banco)
    const driversRef = collection(db, 'drivers');
    const ordersRef = collection(db, 'orders');

    const unsubDrivers = onSnapshot(driversRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
      setDrivers(data);
    }, (e) => console.error("Erro sync drivers:", e));

    const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Ordenação manual (client-side) para evitar erros de índice no início
      data.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA; // Mais recentes primeiro
      });
      setOrders(data);
      setLoading(false);
    }, (e) => console.error("Erro sync orders:", e));

    return () => {
      unsubDrivers();
      unsubOrders();
    };
  }, [user]);

  // --- Correção CSS ---
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // --- Ações ---
  const createOrder = async (data: any) => {
    if(!user) return;
    try {
      await addDoc(collection(db, 'orders'), {
        ...data,
        status: 'pending',
        lat: 50 + (Math.random() - 0.5) * 40,
        lng: 50 + (Math.random() - 0.5) * 40,
        createdAt: serverTimestamp(),
        time: 'Agora'
      });
    } catch (e) { console.error(e); alert("Erro ao criar pedido. Verifique as regras do Firestore."); }
  };

  const createDriver = async (data: any) => {
    if(!user) return;
    await addDoc(collection(db, 'drivers'), data);
  };

  const assignOrder = async (orderId: string, driverId: string) => {
    if(!user) return;
    await updateDoc(doc(db, 'orders', orderId), { status: 'assigned' });
    await updateDoc(doc(db, 'drivers', driverId), { status: 'delivering', currentOrderId: orderId });
  };

  const completeOrder = async (driverId: string) => {
    if(!user) return;
    const driver = drivers.find(d => d.id === driverId);
    if (!driver?.currentOrderId) return;

    await updateDoc(doc(db, 'orders', driver.currentOrderId), { status: 'completed' });
    await updateDoc(doc(db, 'drivers', driverId), { 
      status: 'available', 
      currentOrderId: null, 
      totalDeliveries: (driver.totalDeliveries || 0) + 1 
    });
  };

  const toggleStatus = async (driverId: string) => {
    if(!user) return;
    const d = drivers.find(drv => drv.id === driverId);
    if(d) await updateDoc(doc(db, 'drivers', driverId), { 
      status: d.status === 'offline' ? 'available' : 'offline' 
    });
  };

  // --- Renderização Normal ---
  if (loading && !user) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin mr-2"/> Conectando ao Banco de Dados...</div>;

  if (viewMode === 'landing') {
    return <LandingPage onSelectMode={(m, id) => { if(id) setCurrentDriverId(id); setViewMode(m); }} hasDrivers={drivers.length > 0} />;
  }

  if (viewMode === 'driver') {
    if (currentDriverId === 'select') {
      return <DriverSelection drivers={drivers} onSelect={(id:string) => setCurrentDriverId(id)} onBack={() => setViewMode('landing')} />;
    }
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return <div className="p-10 text-center"><p>Motorista não encontrado.</p><button onClick={() => setViewMode('landing')}>Voltar</button></div>;
    
    return <DriverApp driver={driver} orders={orders} onToggleStatus={() => toggleStatus(driver.id)} onCompleteOrder={() => completeOrder(driver.id)} onLogout={() => setViewMode('landing')} onSwitchDriver={setCurrentDriverId} allDrivers={drivers} />;
  }

  return <AdminPanel drivers={drivers} orders={orders} onAssignOrder={assignOrder} onCreateDriver={createDriver} onCreateOrder={createOrder} onLogout={() => setViewMode('landing')} />;
}

// --- SUBCOMPONENTES ---

function LandingPage({ onSelectMode, hasDrivers }: any) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10 text-white">
        <div className="space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/20 text-sm font-bold">
            <Database size={14}/> Online
          </div>
          <h1 className="text-5xl font-bold">Jhans <span className="text-orange-500">Delivery</span></h1>
          <p className="text-slate-400">Sistema de gestão em tempo real.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button onClick={() => onSelectMode('admin')} className="px-8 py-4 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform"><TrendingUp size={20}/> Gerente</button>
            {hasDrivers ? (
              <button onClick={() => onSelectMode('driver', 'select')} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"><Bike size={20}/> Motoboy</button>
            ) : (
              <div className="px-4 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-xs text-slate-400">Cadastre motoboys no painel primeiro.</div>
            )}
          </div>
        </div>
        <div className="hidden md:block bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur">
           <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
             <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-xl">J</div>
             <div><h3 className="font-bold">Base Sincronizada</h3><p className="text-xs text-emerald-400">Firestore Ativo</p></div>
           </div>
           <div className="space-y-2 text-sm text-slate-300">
             <p>✓ Pedidos em tempo real</p>
             <p>✓ GPS via Link</p>
             <p>✓ Histórico Salvo</p>
           </div>
        </div>
      </div>
    </div>
  );
}

function DriverSelection({ drivers, onSelect, onBack }: any) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800"><Bike/> Quem é você?</h2>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {drivers.map((d: Driver) => (
            <button key={d.id} onClick={() => onSelect(d.id)} className="w-full text-left p-3 border rounded-lg hover:bg-orange-50 flex items-center gap-3 transition-colors group">
              <img src={d.avatar} className="w-10 h-10 rounded-full bg-slate-100 border-2 border-transparent group-hover:border-orange-200"/>
              <div><span className="font-bold text-slate-700 block">{d.name}</span><span className="text-xs text-slate-400">{d.vehicle}</span></div>
            </button>
          ))}
        </div>
        <button onClick={onBack} className="mt-4 w-full py-2 text-slate-500 text-sm hover:underline">Voltar</button>
      </div>
    </div>
  )
}

function DriverApp({ driver, orders, onToggleStatus, onCompleteOrder, onLogout }: any) {
  const activeOrder = orders.find((o: Order) => o.id === driver.currentOrderId);
  
  const openGps = () => {
    if (!activeOrder) return;
    const url = activeOrder.mapsLink ? activeOrder.mapsLink : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeOrder.address)}`;
    window.open(url, '_blank');
  };

  const openZap = () => {
    if (!activeOrder) return;
    window.open(`https://wa.me/55${activeOrder.phone.replace(/\D/g, '')}`, '_blank');
  }

  return (
    <div className="flex justify-center bg-slate-900 min-h-screen">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-[100dvh]">
        <div className="bg-slate-900 text-white p-4 pt-6 rounded-b-3xl z-10 shrink-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <img src={driver.avatar} className="w-12 h-12 rounded-full border-2 border-orange-500 bg-slate-800" />
              <div>
                <h2 className="font-bold text-lg">{driver.name}</h2>
                <div className="flex items-center gap-2 text-slate-400 text-xs"><span>{driver.vehicle}</span> • <span className="text-amber-400">★ {driver.rating}</span></div>
              </div>
            </div>
            <button onClick={onLogout}><LogOut size={18} className="text-slate-400 hover:text-white"/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between shadow-sm ${driver.status === 'offline' ? 'bg-white' : 'bg-emerald-50 border-emerald-100'}`}>
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                <div className="flex items-center gap-2">
                   <div className={`w-2.5 h-2.5 rounded-full ${driver.status === 'offline' ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`}></div>
                   <span className={`font-bold ${driver.status === 'offline' ? 'text-slate-600' : 'text-emerald-700'}`}>{driver.status === 'offline' ? 'Offline' : 'Online'}</span>
                </div>
             </div>
             <button onClick={onToggleStatus} className={`px-4 py-2 rounded-lg font-bold text-sm ${driver.status === 'offline' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'}`}>
               {driver.status === 'offline' ? 'Ficar Online' : 'Pausar'}
             </button>
          </div>

          {driver.status === 'delivering' && activeOrder ? (
             <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4">
                 <div className="bg-orange-50 p-4 border-b border-orange-100 flex justify-between items-center">
                    <div><span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">EM ROTA</span><h3 className="font-bold text-lg text-slate-800 mt-1">{activeOrder.customer}</h3></div>
                    <div className="text-right"><p className="text-xs text-slate-500">Valor</p><p className="font-bold text-lg text-slate-800">{activeOrder.amount}</p></div>
                 </div>
                 <div className="p-5 space-y-4">
                   <div className="flex items-start gap-3">
                      <MapPin className="text-blue-500 shrink-0 mt-1" size={20}/>
                      <div><p className="text-xs text-slate-400 font-bold uppercase">Endereço</p><p className="text-slate-700 font-medium">{activeOrder.address}</p></div>
                   </div>
                   <div className="grid grid-cols-2 gap-3 pt-2">
                      <button onClick={openGps} className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-3 rounded-lg font-bold text-sm"><Navigation size={16}/> Abrir GPS</button>
                      <button onClick={openZap} className="flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 py-3 rounded-lg font-bold text-sm"><MessageCircle size={16}/> WhatsApp</button>
                   </div>
                   <hr/>
                   <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">Pedido</p><p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg">{activeOrder.items}</p></div>
                   <button onClick={onCompleteOrder} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-2"><CheckSquare size={20} className="text-emerald-400"/> Finalizar Entrega</button>
                 </div>
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
               <div className="bg-white p-4 rounded-full shadow-sm mb-4"><Search size={32} className="text-orange-400"/></div>
               <p>Aguardando chamados...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AdminPanel({ drivers, orders, onAssignOrder, onCreateDriver, onCreateOrder, onLogout }: any) {
  const [view, setView] = useState<'map' | 'list' | 'history'>('map');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [modal, setModal] = useState<'driver' | 'order' | null>(null);

  const delivered = orders.filter((o: Order) => o.status === 'completed');
  const totalValue = delivered.reduce((acc: number, curr: Order) => acc + (Number(curr.value) || 0), 0);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col z-20">
        <div className="p-5 border-b border-slate-700/50 flex items-center gap-3"><div className="bg-orange-600 p-2 rounded-lg"><Utensils size={20}/></div><span className="font-bold text-lg">Admin</span></div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarBtn icon={<MapPin/>} label="Mapa" active={view==='map'} onClick={()=>setView('map')}/>
          <SidebarBtn icon={<Users/>} label="Motoboys" active={view==='list'} onClick={()=>setView('list')}/>
          <div className="h-px bg-slate-800 my-2"></div>
          <SidebarBtn icon={<Plus/>} label="Novo Pedido" onClick={()=>setModal('order')} highlight/>
          <SidebarBtn icon={<Clock/>} label="Histórico" active={view==='history'} onClick={()=>setView('history')}/>
        </nav>
        <button onClick={onLogout} className="m-4 p-2 flex items-center gap-2 text-slate-400 hover:text-white text-sm"><LogOut size={16}/> Sair</button>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between shadow-sm">
           <h1 className="text-xl font-bold">{view === 'map' ? 'Visão Geral' : view === 'list' ? 'Equipe' : 'Vendas'}</h1>
           <div className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online</div>
        </header>

        <div className="flex-1 overflow-hidden relative flex">
          {view === 'map' && (
             <div className="flex-1 bg-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                {/* Pedidos Pendentes */}
                {orders.filter((o: Order) => o.status === 'pending').map((o: Order) => (
                   <div key={o.id} className="absolute z-10 hover:scale-110 transition-transform cursor-pointer" style={{top: `${o.lat}%`, left: `${o.lng}%`}}>
                      <div className="w-8 h-8 bg-orange-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white"><Utensils size={14}/></div>
                      <div className="absolute top-full bg-white px-2 py-1 rounded shadow text-[10px] font-bold whitespace-nowrap z-20">{o.customer}</div>
                   </div>
                ))}
                {/* Drivers */}
                {drivers.map((d: Driver) => (
                   <div key={d.id} onClick={() => setSelectedDriver(d)} className="absolute z-20 hover:scale-110 transition-transform cursor-pointer" style={{top: `${d.lat}%`, left: `${d.lng}%`}}>
                      <div className="relative">
                         <img src={d.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-md bg-slate-100"/>
                         <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white ${d.status==='offline'?'bg-slate-400':d.status==='available'?'bg-emerald-500':'bg-orange-500'}`}></span>
                      </div>
                   </div>
                ))}
             </div>
          )}

          {view === 'list' && (
             <div className="flex-1 bg-white p-8 overflow-auto">
                <div className="flex justify-between items-center mb-6"><h2 className="font-bold">Equipe ({drivers.length})</h2><button onClick={()=>setModal('driver')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2"><Plus size={16}/> Adicionar</button></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {drivers.map((d: Driver) => (
                      <div key={d.id} onClick={()=>setSelectedDriver(d)} className="border p-4 rounded-xl hover:shadow-md cursor-pointer flex items-center gap-3">
                         <img src={d.avatar} className="w-12 h-12 rounded-full"/>
                         <div><h3 className="font-bold">{d.name}</h3><p className="text-xs text-slate-500">{d.phone}</p></div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {view === 'history' && (
             <div className="flex-1 bg-white p-8 overflow-auto">
                <div className="grid grid-cols-3 gap-4 mb-8">
                   <StatBox label="Faturamento" value={`R$ ${totalValue.toFixed(2)}`} icon={<DollarSign/>}/>
                   <StatBox label="Entregas" value={delivered.length} icon={<CheckSquare/>}/>
                </div>
                <div className="border rounded-xl overflow-hidden">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b"><tr><th className="p-4">Cliente</th><th className="p-4">Valor</th><th className="p-4">Status</th></tr></thead>
                      <tbody>
                         {delivered.map((o: Order) => (
                            <tr key={o.id} className="border-b"><td className="p-4">{o.customer}</td><td className="p-4">{o.amount}</td><td className="p-4 text-emerald-600 font-bold">Concluído</td></tr>
                         ))}
                         {delivered.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-400">Sem histórico</td></tr>}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {view === 'map' && (
             <aside className="w-80 bg-white border-l shadow-xl p-6 overflow-y-auto z-30">
                {selectedDriver ? (
                   <div className="animate-in slide-in-from-right-4">
                      <div className="flex justify-between mb-4"><h3 className="font-bold">Detalhes</h3><button onClick={()=>setSelectedDriver(null)}><X size={18}/></button></div>
                      <div className="text-center mb-6">
                         <img src={selectedDriver.avatar} className="w-20 h-20 rounded-full mx-auto mb-2"/>
                         <h2 className="font-bold">{selectedDriver.name}</h2>
                         <p className="text-sm text-slate-500">{selectedDriver.status}</p>
                      </div>
                      {selectedDriver.status === 'available' && (
                         <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase">Atribuir Pedido</p>
                            {orders.filter((o: Order) => o.status === 'pending').map((o: Order) => (
                               <div key={o.id} onClick={()=>onAssignOrder(o.id, selectedDriver.id)} className="border p-3 rounded-lg hover:border-orange-500 cursor-pointer bg-white">
                                  <div className="flex justify-between font-bold text-sm"><span>{o.customer}</span><span className="text-emerald-600">{o.amount}</span></div>
                                  <p className="text-xs text-slate-500 truncate">{o.address}</p>
                                  <button className="w-full mt-2 bg-orange-600 text-white text-xs font-bold py-1.5 rounded">Enviar</button>
                               </div>
                            ))}
                            {orders.filter((o: Order) => o.status === 'pending').length === 0 && <p className="text-sm text-slate-400 text-center">Sem pedidos pendentes</p>}
                         </div>
                      )}
                   </div>
                ) : <div className="text-center py-10 opacity-50"><p>Selecione um motoboy</p></div>}
             </aside>
          )}
        </div>
      </main>

      {modal === 'order' && <NewOrderModal onClose={()=>setModal(null)} onSave={onCreateOrder} />}
      {modal === 'driver' && <NewDriverModal onClose={()=>setModal(null)} onSave={onCreateDriver} driversCount={drivers.length} />}
    </div>
  )
}

function SidebarBtn({ icon, label, active, onClick, highlight }: any) {
  return <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${active ? 'bg-orange-600 text-white shadow-lg' : highlight ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{icon} <span className="font-medium text-sm">{label}</span></button>
}

function StatBox({label, value, icon}: any) {
   return <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4"><div className="p-3 bg-slate-50 rounded-lg">{icon}</div><div><p className="text-xs text-slate-500 font-bold uppercase">{label}</p><p className="text-xl font-bold">{value}</p></div></div>
}

function NewOrderModal({ onClose, onSave }: any) {
   const [form, setForm] = useState({ customer: '', phone: '', address: '', items: '', amount: '', mapsLink: '' });
   const submit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({ ...form, value: parseFloat(form.amount.replace(/[^0-9.]/g, '')) || 0 });
      onClose();
   };
   return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
         <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in p-6">
            <div className="flex justify-between mb-4"><h3 className="font-bold flex gap-2"><Plus/> Novo Pedido</h3><button onClick={onClose}><X/></button></div>
            <form onSubmit={submit} className="space-y-3">
               <input required className="w-full border rounded p-2" placeholder="Cliente" value={form.customer} onChange={e=>setForm({...form, customer: e.target.value})} />
               <div className="grid grid-cols-2 gap-3">
                  <input required className="border rounded p-2" placeholder="Telefone" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
                  <input required className="border rounded p-2" placeholder="Valor (R$)" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} />
               </div>
               <input required className="w-full border rounded p-2" placeholder="Endereço" value={form.address} onChange={e=>setForm({...form, address: e.target.value})} />
               <input className="w-full border rounded p-2 text-xs bg-blue-50 border-blue-200" placeholder="Link do Google Maps (Opcional)" value={form.mapsLink} onChange={e=>setForm({...form, mapsLink: e.target.value})} />
               <textarea required className="w-full border rounded p-2" placeholder="Itens" value={form.items} onChange={e=>setForm({...form, items: e.target.value})} />
               <button className="w-full bg-orange-600 text-white font-bold py-2 rounded">Salvar</button>
            </form>
         </div>
      </div>
   )
}

function NewDriverModal({ onClose, onSave, driversCount }: any) {
   const [form, setForm] = useState({ name: '', phone: '', vehicle: '' });
   const submit = (e: React.FormEvent) => {
      e.preventDefault();
      // Não passamos 'id' manual aqui para deixar o Firestore criar um ID único automaticamente
      onSave({ 
          ...form, 
          status: 'offline', 
          lat: 50, lng: 50, 
          battery: 100, 
          rating: 5.0, 
          totalDeliveries: 0, 
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name}` 
      });
      onClose();
   };
   return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
         <div className="bg-white rounded-xl w-full max-w-sm p-6 animate-in zoom-in">
            <h3 className="font-bold mb-4">Novo Motoboy</h3>
            <form onSubmit={submit} className="space-y-3">
               <input required className="w-full border rounded p-2" placeholder="Nome" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
               <input required className="w-full border rounded p-2" placeholder="Telefone" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
               <input required className="w-full border rounded p-2" placeholder="Veículo" value={form.vehicle} onChange={e=>setForm({...form, vehicle: e.target.value})} />
               <div className="flex gap-2 pt-2"><button type="button" onClick={onClose} className="flex-1 border rounded py-2">Cancelar</button><button className="flex-1 bg-emerald-600 text-white rounded py-2 font-bold">Salvar</button></div>
            </form>
         </div>
      </div>
   )
}