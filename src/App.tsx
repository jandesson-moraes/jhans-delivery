import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Package, Clock, 
  X, Search, Users, Bike, 
  TrendingUp, Utensils, Plus, LogOut, CheckSquare,
  MessageCircle, DollarSign, Link as LinkIcon, Loader2, Crosshair,
  Lock, KeyRound, ChevronRight, BellRing, ClipboardCopy, FileText,
  Trash2, Edit, Wallet, Calendar
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
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAcgauavrlochP0iM-ZXfcW4nuZU1YE0bc",
  authDomain: "jhans-delivery-base.firebaseapp.com",
  projectId: "jhans-delivery-base",
  storageBucket: "jhans-delivery-base.firebasestorage.app",
  messagingSenderId: "499879933710",
  appId: "1:499879933710:web:6f26d641172ec914d0095f",
  measurementId: "G-KYB5T3N6L5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CONSTANTES ---
const TAXA_ENTREGA = 5.00; // Valor pago ao motoboy por entrega

// --- TIPOS ---
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
  lastUpdate?: any; 
}

interface Order {
  id: string; 
  customer: string;
  phone: string; 
  address: string;
  mapsLink?: string; 
  items: string; 
  status: 'pending' | 'assigned' | 'accepted' | 'completed';
  amount: string;
  value: number; 
  paymentMethod?: string;
  obs?: string;
  time?: string; 
  createdAt: any; 
  assignedAt?: any; 
  completedAt?: any; 
  driverId?: string; // ID do motoboy que completou
}

// --- UTILITÁRIOS ---
const formatTime = (timestamp: any) => {
  if (!timestamp) return '-';
  return new Date(timestamp.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '-';
  return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR');
};

const calcDuration = (start: any, end: any) => {
  if (!start || !end) return '-';
  const diffMs = (end.seconds * 1000) - (start.seconds * 1000);
  const diffMins = Math.floor(diffMs / 60000);
  return `${diffMins} min`;
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  
  const [viewMode, setViewMode] = useState<UserType>(() => {
    return (localStorage.getItem('jhans_viewMode') as UserType) || 'landing';
  });
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(() => {
    return localStorage.getItem('jhans_driverId');
  });

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('jhans_viewMode', viewMode);
    if (currentDriverId) localStorage.setItem('jhans_driverId', currentDriverId);
  }, [viewMode, currentDriverId]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else signInAnonymously(auth).catch(console.error);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubDrivers = onSnapshot(collection(db, 'drivers'), (snap) => {
      setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Driver)));
    });
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      data.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setOrders(data);
      setLoading(false);
    });
    return () => { unsubDrivers(); unsubOrders(); };
  }, [user]);

  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const s = document.createElement('script');
      s.id = 'tailwind-cdn';
      s.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(s);
    }
  }, []);

  const createOrder = async (data: any) => {
    if(!user) return;
    await addDoc(collection(db, 'orders'), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  };

  const createDriver = async (data: any) => {
    if(!user) return;
    await addDoc(collection(db, 'drivers'), data);
  };

  const updateDriver = async (id: string, data: any) => {
    if(!user) return;
    await updateDoc(doc(db, 'drivers', id), data);
  };

  const deleteDriver = async (id: string) => {
    if(!user) return;
    if (window.confirm("Tem certeza que deseja excluir este entregador? O histórico dele permanecerá nos pedidos, mas ele não poderá mais logar.")) {
      await deleteDoc(doc(db, 'drivers', id));
    }
  };

  const assignOrder = async (orderId: string, driverId: string) => {
    if(!user) return;
    await updateDoc(doc(db, 'orders', orderId), { status: 'assigned', assignedAt: serverTimestamp(), driverId: driverId });
    await updateDoc(doc(db, 'drivers', driverId), { status: 'delivering', currentOrderId: orderId });
  };

  const acceptOrder = async (orderId: string) => {
    if(!user) return;
    await updateDoc(doc(db, 'orders', orderId), { status: 'accepted' });
  };

  const completeOrder = async (driverId: string) => {
    if(!user) return;
    const driver = drivers.find(d => d.id === driverId);
    if (!driver?.currentOrderId) return;

    await updateDoc(doc(db, 'orders', driver.currentOrderId), { status: 'completed', completedAt: serverTimestamp() });
    await updateDoc(doc(db, 'drivers', driverId), { 
      status: 'available', 
      currentOrderId: null, 
      totalDeliveries: (driver.totalDeliveries || 0) + 1 
    });
  };

  const toggleStatus = async (driverId: string) => {
    if(!user) return;
    const d = drivers.find(drv => drv.id === driverId);
    if(d) await updateDoc(doc(db, 'drivers', driverId), { status: d.status === 'offline' ? 'available' : 'offline' });
  };

  const handleLogout = () => {
    localStorage.removeItem('jhans_viewMode');
    localStorage.removeItem('jhans_driverId');
    localStorage.removeItem('jhans_admin_auth');
    setViewMode('landing');
    setCurrentDriverId(null);
  };

  if (loading && !user) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin mr-2"/> Carregando sistema...</div>;

  if (viewMode === 'landing') {
    return <LandingPage onSelectMode={(m: UserType, id?: string) => { if(id) setCurrentDriverId(id); setViewMode(m); }} hasDrivers={drivers.length > 0} />;
  }

  if (viewMode === 'driver') {
    if (currentDriverId === 'select') {
      return <DriverSelection drivers={drivers} onSelect={(id: string) => setCurrentDriverId(id)} onBack={handleLogout} />;
    }
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return <div className="p-10 text-center"><p>Motorista não encontrado.</p><button onClick={handleLogout}>Sair</button></div>;
    
    return <DriverApp driver={driver} orders={orders} onToggleStatus={() => toggleStatus(driver.id)} onAcceptOrder={acceptOrder} onCompleteOrder={() => completeOrder(driver.id)} onLogout={handleLogout} />;
  }

  return <AdminPanel drivers={drivers} orders={orders} onAssignOrder={assignOrder} onCreateDriver={createDriver} onUpdateDriver={updateDriver} onDeleteDriver={deleteDriver} onCreateOrder={createOrder} onLogout={handleLogout} />;
}

// ==========================================
// PÁGINA INICIAL
// ==========================================
function LandingPage({ onSelectMode, hasDrivers }: { onSelectMode: (m: UserType, id?: string) => void, hasDrivers: boolean }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="z-10 text-center space-y-8 max-w-md w-full">
        <div className="flex justify-center">
          <div className="bg-orange-600 p-4 rounded-2xl shadow-xl shadow-orange-500/20 animate-bounce-slow">
            <Utensils className="w-12 h-12 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Jhans <span className="text-orange-500">Delivery</span></h1>
          <p className="text-slate-400">Sistema Profissional de Logística</p>
        </div>
        <div className="space-y-4">
          <button onClick={() => onSelectMode('admin')} className="w-full group relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-2 rounded-lg"><TrendingUp className="text-blue-400" size={24}/></div>
              <div className="text-left"><span className="block font-bold text-white">Sou Gerente</span><span className="text-xs text-slate-400">Acesso Administrativo</span></div>
            </div>
            <ChevronRight className="text-slate-500 group-hover:text-white" />
          </button>
          {hasDrivers ? (
            <button onClick={() => onSelectMode('driver', 'select')} className="w-full group relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500/20 p-2 rounded-lg"><Bike className="text-emerald-400" size={24}/></div>
                <div className="text-left"><span className="block font-bold text-white">Sou Motoboy</span><span className="text-xs text-slate-400">App de Entregas</span></div>
              </div>
              <ChevronRight className="text-slate-500 group-hover:text-white" />
            </button>
          ) : (
            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-500 text-center">Nenhum motoboy cadastrado ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SELEÇÃO DE MOTORISTA
// ==========================================
function DriverSelection({ drivers, onSelect, onBack }: any) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-6 text-slate-800 text-center">Identifique-se</h2>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {drivers.map((d: Driver) => (
            <button key={d.id} onClick={() => onSelect(d.id)} className="w-full flex items-center gap-4 p-3 border border-slate-100 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-all">
              <img src={d.avatar} className="w-12 h-12 rounded-full bg-slate-100 shadow-sm"/>
              <div className="text-left"><span className="font-bold text-slate-700 block">{d.name}</span><span className="text-xs text-slate-400 uppercase font-semibold">{d.vehicle}</span></div>
            </button>
          ))}
        </div>
        <button onClick={onBack} className="mt-6 w-full py-3 text-slate-500 text-sm hover:bg-slate-100 rounded-xl font-medium transition-colors">Voltar para Início</button>
      </div>
    </div>
  )
}

// ==========================================
// APP DO MOTOBOY
// ==========================================
function DriverApp({ driver, orders, onToggleStatus, onAcceptOrder, onCompleteOrder, onLogout }: any) {
  const [activeTab, setActiveTab] = useState<'home' | 'wallet'>('home');
  const activeOrder = orders.find((o: Order) => o.id === driver.currentOrderId);
  
  // Filtra apenas entregas completas DESTE motoboy
  const myDeliveries = orders.filter((o: Order) => o.status === 'completed' && o.driverId === driver.id);
  const myEarnings = myDeliveries.length * TAXA_ENTREGA;

  useEffect(() => {
    let watchId: number;
    if (driver.status !== 'offline' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const driverDoc = doc(db, 'drivers', driver.id);
          await updateDoc(driverDoc, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            lastUpdate: serverTimestamp()
          }).catch(e => console.error("Erro GPS", e));
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [driver.status, driver.id]);

  const openApp = (url: string) => window.open(url, '_blank');

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-slate-900 text-white p-5 pb-8 rounded-b-[2rem] shadow-lg relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <img src={driver.avatar} className="w-14 h-14 rounded-full border-4 border-slate-800 bg-white" />
            <div>
              <h2 className="font-bold text-xl">{driver.name}</h2>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium"><span className="bg-slate-800 px-2 py-0.5 rounded">{driver.vehicle}</span><span className="text-amber-400">★ {driver.rating}</span></div>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><LogOut size={20}/></button>
        </div>
        
        {/* Toggle Abas */}
        <div className="flex bg-slate-800 p-1 rounded-xl mt-4">
           <button onClick={() => setActiveTab('home')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab==='home' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>Entregas</button>
           <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab==='wallet' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>Minha Carteira</button>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {activeTab === 'home' ? (
          <>
            <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between shadow-sm transition-colors ${driver.status === 'offline' ? 'bg-white border-slate-200' : 'bg-emerald-50 border-emerald-100'}`}>
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Seu Status</p>
                  <div className="flex items-center gap-2">
                     <div className={`w-2.5 h-2.5 rounded-full ${driver.status === 'offline' ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`}></div>
                     <span className={`font-bold ${driver.status === 'offline' ? 'text-slate-600' : 'text-emerald-700'}`}>{driver.status === 'offline' ? 'Offline' : 'Online'}</span>
                  </div>
               </div>
               <button onClick={onToggleStatus} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${driver.status === 'offline' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                 {driver.status === 'offline' ? 'Ficar Online' : 'Pausar'}
               </button>
            </div>

            {driver.status === 'delivering' && activeOrder ? (
               <div className="bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                   <div className={`p-4 border-b flex justify-between items-center ${activeOrder.status === 'assigned' ? 'bg-amber-50 border-amber-100' : 'bg-orange-50 border-orange-100'}`}>
                      <div>
                        {activeOrder.status === 'assigned' ? 
                            <span className="inline-block text-[10px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full mb-1 animate-pulse">NOVA CORRIDA</span> : 
                            <span className="inline-block text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full mb-1">EM ROTA</span>
                        }
                        <h3 className="font-bold text-lg text-slate-800 leading-none">{activeOrder.customer}</h3>
                      </div>
                      <div className="text-right"><p className="text-xs text-slate-500">A cobrar</p><p className="font-bold text-xl text-slate-800">{activeOrder.amount}</p></div>
                   </div>
                   
                   {activeOrder.status === 'assigned' ? (
                       <div className="p-6 text-center space-y-4">
                           <BellRing className="w-16 h-16 text-amber-500 mx-auto animate-bounce"/>
                           <div><h3 className="text-xl font-bold text-slate-800">Nova entrega disponível!</h3><p className="text-slate-500 text-sm">Confirme para ver o endereço e iniciar a rota.</p></div>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-sm font-bold text-slate-700">{activeOrder.items}</p></div>
                           <button onClick={() => onAcceptOrder(activeOrder.id)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-amber-200 text-lg transition-transform active:scale-95">ACEITAR CORRIDA</button>
                       </div>
                   ) : (
                       <div className="p-5 space-y-6">
                         <div>
                            <div className="flex items-start gap-3">
                               <MapPin className="text-orange-500 mt-1 shrink-0" size={20}/>
                               <div><p className="text-xs text-slate-400 font-bold uppercase">Entrega</p><p className="text-slate-700 font-medium">{activeOrder.address}</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                               <button onClick={() => openApp(activeOrder.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeOrder.address)}`)} className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-blue-200 active:scale-95 transition-transform"><Navigation size={18}/> Waze / Maps</button>
                               <button onClick={() => openApp(`https://wa.me/55${activeOrder.phone.replace(/\D/g, '')}`)} className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-emerald-200 active:scale-95 transition-transform"><MessageCircle size={18}/> WhatsApp</button>
                            </div>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                            <div><p className="text-xs text-slate-400 font-bold uppercase">Itens</p><p className="text-slate-600 text-sm">{activeOrder.items}</p></div>
                            {activeOrder.obs && <div><p className="text-xs text-slate-400 font-bold uppercase">Obs</p><p className="text-orange-600 text-sm font-bold">{activeOrder.obs}</p></div>}
                            {activeOrder.paymentMethod && <div><p className="text-xs text-slate-400 font-bold uppercase">Pagamento</p><p className="text-slate-600 text-sm">{activeOrder.paymentMethod}</p></div>}
                         </div>
                         <button onClick={onCompleteOrder} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"><CheckSquare size={20} className="text-emerald-400"/> Confirmar Entrega</button>
                       </div>
                   )}
               </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 pb-20">
                 <div className="relative mb-6"><span className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-20"></span><div className="bg-white p-6 rounded-full shadow-lg relative z-10"><Search size={40} className="text-orange-500"/></div></div>
                 <h3 className="text-xl font-bold text-slate-700">Aguardando...</h3>
                 <p className="text-sm text-slate-400 max-w-[200px]">Mantenha o app aberto para receber pedidos.</p>
              </div>
            )}
          </>
        ) : (
          /* ABA CARTEIRA DO MOTOBOY */
          <div className="space-y-4">
             <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                <p className="text-slate-400 text-sm mb-1">Saldo Total Estimado</p>
                <h3 className="text-4xl font-bold text-emerald-400">R$ {myEarnings.toFixed(2)}</h3>
                <p className="text-xs text-slate-500 mt-2">Baseado em {myDeliveries.length} entregas x R$ {TAXA_ENTREGA.toFixed(2)}</p>
             </div>
             
             <h4 className="font-bold text-slate-700 mt-4">Histórico de Corridas</h4>
             <div className="space-y-2">
                {myDeliveries.sort((a,b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0)).map((o: Order) => (
                   <div key={o.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                      <div>
                         <p className="font-bold text-slate-800 text-sm">{o.address}</p>
                         <p className="text-xs text-slate-400">{formatDate(o.completedAt)} • {formatTime(o.completedAt)}</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded">+ R$ {TAXA_ENTREGA.toFixed(2)}</span>
                   </div>
                ))}
                {myDeliveries.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">Nenhuma entrega realizada.</p>}
             </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// ADMIN PANEL
// ==========================================
function AdminPanel(props: any) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('jhans_admin_auth'));
  const [password, setPassword] = useState('');
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500"><Lock size={32}/></div>
            <h2 className="text-2xl font-bold text-slate-800">Acesso Gerente</h2>
            <p className="text-sm text-slate-500">Digite sua senha de acesso</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (password === 'admin') { 
              localStorage.setItem('jhans_admin_auth', 'true');
              setIsAuthenticated(true);
            } else {
              alert("Senha incorreta!");
            }
          }} className="space-y-4">
            <div className="relative"><KeyRound className="absolute left-3 top-3 text-slate-400" size={20}/><input type="password" className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}/></div>
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-colors">Entrar no Painel</button>
          </form>
          <button onClick={props.onLogout} className="w-full mt-4 text-slate-400 text-sm hover:underline">Voltar</button>
        </div>
      </div>
    )
  }
  return <Dashboard {...props} />;
}

function Dashboard({ drivers, orders, onAssignOrder, onCreateDriver, onUpdateDriver, onDeleteDriver, onCreateOrder, onLogout }: any) {
  const [view, setView] = useState<'map' | 'list' | 'history'>('map');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [modal, setModal] = useState<'driver' | 'order' | null>(null);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [driverReportId, setDriverReportId] = useState<string | null>(null); // ID do driver para relatório específico

  const delivered = orders.filter((o: Order) => o.status === 'completed');
  const sortedHistory = [...delivered].sort((a,b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));

  const trackDriver = (driver: Driver) => {
      if (driver.lat && driver.lng) {
          const url = `https://www.google.com/maps/search/?api=1&query=${driver.lat},${driver.lng}`;
          window.open(url, '_blank');
      } else {
          alert("Aguardando sinal de GPS do motoboy...");
      }
  };

  const copyReport = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    let text = `🛵 *RELATÓRIO DE ENTREGAS - JHAN'S BURGERS*\n📅 Data: ${today}\n--- ENTREGAS ---\n\n`;
    sortedHistory.forEach((o: Order, i: number) => {
       text += `✅ ENTREGA ${sortedHistory.length - i} (${o.paymentMethod || 'PAGO'})\n`;
       text += `👤 Cliente: ${o.customer}\n`;
       text += `📞 Telefone: ${o.phone}\n`;
       text += `🏠 Endereço: ${o.address}\n`;
       if (o.mapsLink) text += `🔗 Localização: ${o.mapsLink}\n`;
       text += `🍔 Pedido: ${o.items}\n`;
       text += `💵 Valor: ${o.amount}\n`;
       text += `📝 Obs: ${o.obs || 'Nenhuma.'}\n`;
       if (o.assignedAt && o.completedAt) text += `⏱ Tempo: ${calcDuration(o.assignedAt, o.completedAt)}\n`;
       text += `\n`;
    });
    text += `--- FIM ---\nBoa sorte nas entregas! 🚀`;
    navigator.clipboard.writeText(text);
    alert("Relatório copiado!");
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-slate-700/50 flex items-center gap-3"><div className="bg-orange-600 p-2 rounded-lg"><Utensils size={20}/></div><span className="font-bold text-lg tracking-wide">Jhans Admin</span></div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarBtn icon={<MapPin/>} label="Monitoramento" active={view==='map'} onClick={()=>setView('map')}/>
          <SidebarBtn icon={<Users/>} label="Equipe & Motoboys" active={view==='list'} onClick={()=>setView('list')}/>
          <div className="h-px bg-slate-800 my-4 mx-2"></div>
          <SidebarBtn icon={<Plus/>} label="Novo Pedido" onClick={()=>setModal('order')} highlight/>
          <SidebarBtn icon={<Clock/>} label="Relatórios & Histórico" active={view==='history'} onClick={()=>setView('history')}/>
        </nav>
        <button onClick={onLogout} className="m-4 p-3 bg-slate-800 rounded-xl flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><LogOut size={18}/> <span className="text-sm font-bold">Sair</span></button>
      </aside>

      <div className={`md:hidden fixed bottom-0 left-0 w-full bg-slate-900 text-white p-2 flex justify-around z-50 border-t border-slate-800 translate-y-0`}>
         <button onClick={()=>setView('map')} className={`p-2 rounded-lg flex flex-col items-center ${view==='map'?'text-orange-500':'text-slate-400'}`}><MapPin size={24}/><span className="text-[10px]">Mapa</span></button>
         <button onClick={()=>setView('list')} className={`p-2 rounded-lg flex flex-col items-center ${view==='list'?'text-orange-500':'text-slate-400'}`}><Users size={24}/><span className="text-[10px]">Equipe</span></button>
         <button onClick={()=>setModal('order')} className="p-3 -mt-8 bg-orange-600 rounded-full shadow-lg border-4 border-slate-50"><Plus size={28} className="text-white"/></button>
         <button onClick={()=>setView('history')} className={`p-2 rounded-lg flex flex-col items-center ${view==='history'?'text-orange-500':'text-slate-400'}`}><Clock size={24}/><span className="text-[10px]">Histórico</span></button>
         <button onClick={onLogout} className="p-2 text-slate-400 flex flex-col items-center"><LogOut size={24}/><span className="text-[10px]">Sair</span></button>
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white border-b px-4 md:px-8 flex items-center justify-between shadow-sm z-10">
           <h1 className="text-lg md:text-xl font-bold text-slate-800">{view === 'map' ? 'Visão Geral em Tempo Real' : view === 'list' ? 'Gestão de Equipe' : 'Relatório de Vendas'}</h1>
           <div className="hidden md:flex text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sistema Online</div>
        </header>

        <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row">
          {view === 'map' && (
             <div className="flex-1 bg-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute top-4 left-4 z-20 space-y-2 max-h-[80%] overflow-y-auto w-64 hidden md:block">
                   {orders.filter((o: Order) => o.status === 'pending').map((o: Order) => (
                      <div key={o.id} className="bg-white p-3 rounded-lg shadow-lg border-l-4 border-orange-500 animate-in slide-in-from-left">
                         <div className="flex justify-between items-start"><span className="font-bold text-sm text-slate-800">{o.customer}</span><span className="text-xs font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{o.time}</span></div>
                         <p className="text-xs text-slate-500 truncate mt-1">{o.address}</p>
                         <p className="text-sm font-bold text-emerald-600 mt-1">{o.amount}</p>
                      </div>
                   ))}
                </div>
                {drivers.map((d: Driver) => (
                   <div key={d.id} onClick={() => setSelectedDriver(d)} className="absolute z-30 hover:scale-110 transition-transform cursor-pointer" style={{top: `50%`, left: `50%`, transform: `translate(${(Math.random()-0.5)*200}px, ${(Math.random()-0.5)*200}px)`}}>
                      <div className="relative group">
                         <div className={`w-12 h-12 rounded-full border-4 shadow-xl overflow-hidden ${d.status==='delivering' ? 'border-orange-500' : d.status==='available' ? 'border-emerald-500' : 'border-slate-400'}`}>
                            <img src={d.avatar} className="w-full h-full bg-slate-100 object-cover"/>
                         </div>
                         <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">{d.name}</div>
                      </div>
                   </div>
                ))}
             </div>
          )}

          {view === 'list' && (
             <div className="flex-1 bg-white p-4 md:p-8 overflow-auto pb-24 md:pb-8">
                <div className="flex justify-between items-center mb-6"><h2 className="font-bold text-lg">Frota ({drivers.length})</h2><button onClick={()=>setModal('driver')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2"><Plus size={16}/> Novo</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {drivers.map((d: Driver) => (
                      <div key={d.id} className="border p-4 rounded-xl hover:shadow-md transition-all bg-white relative group">
                         <div className="flex items-center gap-4 cursor-pointer" onClick={()=>setSelectedDriver(d)}>
                            <img src={d.avatar} className="w-14 h-14 rounded-full bg-slate-100"/>
                            <div>
                               <h3 className="font-bold text-slate-800">{d.name}</h3>
                               <p className="text-xs text-slate-500 mb-1">{d.phone}</p>
                               <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${d.status==='offline'?'bg-slate-100 text-slate-500':d.status==='available'?'bg-emerald-100 text-emerald-700':'bg-orange-100 text-orange-700'}`}>{d.status}</span>
                            </div>
                         </div>
                         
                         {/* Ações do Entregador */}
                         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>setDriverReportId(d.id)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Relatório Financeiro"><Wallet size={16}/></button>
                            <button onClick={()=>{setDriverToEdit(d); setModal('driver');}} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title="Editar"><Edit size={16}/></button>
                            <button onClick={()=>onDeleteDriver(d.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Excluir"><Trash2 size={16}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {view === 'history' && (
             <div className="flex-1 bg-white p-4 md:p-8 overflow-auto pb-24 md:pb-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">Relatório Completo</h3>
                    <button onClick={copyReport} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                        <ClipboardCopy size={16}/> Copiar Relatório do Dia
                    </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                   <StatBox label="Faturamento Loja" value={`R$ ${delivered.reduce((acc: number, c: Order)=>acc+(c.value||0),0).toFixed(2)}`} icon={<DollarSign/>} color="bg-emerald-50 text-emerald-600"/>
                   <StatBox label="Entregas" value={delivered.length} icon={<CheckSquare/>} color="bg-blue-50 text-blue-600"/>
                </div>
                
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                   <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b text-slate-500 font-semibold uppercase text-xs">
                           <tr><th className="p-4">Cliente</th><th className="p-4">Valor</th><th className="p-4">Pagamento</th><th className="p-4 hidden md:table-cell">Início</th><th className="p-4 hidden md:table-cell">Fim</th><th className="p-4">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {sortedHistory.map((o: Order) => (
                              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                 <td className="p-4 font-medium text-slate-800">{o.customer}</td>
                                 <td className="p-4 font-bold text-emerald-600">{o.amount}</td>
                                 <td className="p-4 text-slate-500 text-xs">{o.paymentMethod || '-'}</td>
                                 <td className="p-4 text-slate-500 hidden md:table-cell">{formatTime(o.assignedAt)}</td>
                                 <td className="p-4 text-slate-500 hidden md:table-cell">{formatTime(o.completedAt)}</td>
                                 <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">Concluído</span></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>
                </div>
             </div>
          )}

          {(view === 'map' || selectedDriver) && (
             <aside className={`fixed md:relative inset-y-0 right-0 w-full md:w-80 bg-white shadow-2xl p-6 overflow-y-auto z-40 transition-transform duration-300 ${selectedDriver ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:border-l'}`}>
                {selectedDriver ? (
                   <div className="h-full flex flex-col">
                      <div className="flex justify-between items-start mb-6"><h3 className="font-bold text-slate-800 text-lg">Detalhes do Motoboy</h3><button onClick={()=>setSelectedDriver(null)} className="p-1 hover:bg-slate-100 rounded"><X size={20}/></button></div>
                      <div className="flex flex-col items-center mb-6">
                         <div className="relative">
                            <img src={selectedDriver.avatar} className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-md"/>
                            <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${selectedDriver.status==='offline'?'bg-slate-400':selectedDriver.status==='available'?'bg-emerald-500':'bg-orange-500'}`}></span>
                         </div>
                         <h2 className="font-bold text-xl mt-3">{selectedDriver.name}</h2>
                         <p className="text-sm text-slate-500">{selectedDriver.vehicle} • {selectedDriver.phone}</p>
                         <button onClick={() => trackDriver(selectedDriver)} className="mt-4 w-full bg-blue-50 text-blue-600 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors border border-blue-200"><Crosshair size={18} /> Rastrear GPS em Tempo Real</button>
                         {selectedDriver.lastUpdate && <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Atualizado às {formatTime(selectedDriver.lastUpdate)}</p>}
                      </div>
                      <div className="flex-1 overflow-y-auto">
                         <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Atribuir Pedido</h4>
                         <div className="space-y-3 pb-20">
                            {orders.filter((o: Order) => o.status === 'pending').map((o: Order) => (
                               <div key={o.id} onClick={()=>onAssignOrder(o.id, selectedDriver.id)} className="border border-slate-200 p-4 rounded-xl hover:border-orange-500 transition-colors bg-white shadow-sm">
                                  <div className="flex justify-between items-start mb-2"><span className="font-bold text-slate-800">{o.customer}</span><span className="text-emerald-600 font-bold">{o.amount}</span></div>
                                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{o.address}</p>
                                  <button onClick={()=>{onAssignOrder(o.id, selectedDriver.id); setSelectedDriver(null);}} className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-slate-800 transition-colors">Enviar Entrega</button>
                               </div>
                            ))}
                            {orders.filter((o: Order) => o.status === 'pending').length === 0 && (
                               <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200"><Package className="mx-auto text-slate-300 mb-2"/><p className="text-sm text-slate-400">Sem pedidos pendentes</p></div>
                            )}
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      <div className="bg-slate-100 p-4 rounded-full mb-4"><Users size={32} className="text-slate-400"/></div>
                      <p className="text-slate-500 font-medium">Selecione um motoboy<br/>para ver detalhes e rastrear</p>
                   </div>
                )}
             </aside>
          )}
        </div>
      </main>

      {/* MODAL PEDIDO */}
      {modal === 'order' && <NewOrderModal onClose={()=>setModal(null)} onSave={onCreateOrder} />}
      
      {/* MODAL MOTORISTA (CRIAR/EDITAR) */}
      {modal === 'driver' && (
         <DriverModal 
            onClose={()=>{setModal(null); setDriverToEdit(null);}} 
            onSave={driverToEdit ? (data: any) => onUpdateDriver(driverToEdit.id, data) : onCreateDriver}
            initialData={driverToEdit} 
         />
      )}

      {/* MODAL RELATÓRIO FINANCEIRO DO MOTORISTA */}
      {driverReportId && (
         <DriverReportModal 
            driverId={driverReportId} 
            drivers={drivers} 
            orders={orders} 
            onClose={() => setDriverReportId(null)} 
         />
      )}
    </div>
  )
}

function SidebarBtn({ icon, label, active, onClick, highlight }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : highlight ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className={active ? 'text-white' : highlight ? 'text-orange-400' : 'text-current'}>{icon}</div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

function StatBox({label, value, icon, color}: any) {
   return (
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
         <div className={`p-3 rounded-lg ${color || 'bg-slate-100 text-slate-600'}`}>{icon}</div>
         <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{label}</p><p className="text-xl font-extrabold text-slate-800">{value}</p></div>
      </div>
   )
}

function NewOrderModal({ onClose, onSave }: any) {
   const [form, setForm] = useState({ 
      customer: '', phone: '', address: '', items: '', amount: '', mapsLink: '', paymentMethod: '', obs: '' 
   });
   const [pasteArea, setPasteArea] = useState(false);
   const [rawText, setRawText] = useState('');

   const parseOrder = () => {
      const getLine = (marker: string) => {
         const regex = new RegExp(`${marker}\\s*(.*)`, 'i');
         const match = rawText.match(regex);
         return match ? match[1].trim() : '';
      };

      const valLine = getLine('💵 Valor:');
      let val = valLine;
      let pay = '';
      if (valLine.includes('(')) {
         val = valLine.split('(')[0].trim();
         pay = valLine.split('(')[1].replace(')', '').trim();
      }

      setForm({
         customer: getLine('👤 Cliente:'),
         phone: getLine('📞 Telefone:'),
         address: getLine('🏠 Endereço:'),
         mapsLink: getLine('🔗 Localização:') || getLine('Link:'),
         items: getLine('🍔 Pedido:'),
         amount: val,
         paymentMethod: pay,
         obs: getLine('📝 Obs:')
      });
      setPasteArea(false);
   };

   const submit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({ ...form, value: parseFloat(form.amount.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0 });
      onClose();
   };

   return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Plus className="text-orange-500"/> Novo Pedido</h3>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>

            {pasteArea ? (
               <div className="space-y-3">
                  <p className="text-sm text-slate-500">Cole o texto do WhatsApp abaixo:</p>
                  <textarea 
                     className="w-full h-40 border p-3 rounded-xl text-xs font-mono bg-slate-50"
                     placeholder="👤 Cliente: ... 🏠 Endereço: ..."
                     value={rawText}
                     onChange={e => setRawText(e.target.value)}
                  />
                  <div className="flex gap-2">
                     <button onClick={() => setPasteArea(false)} className="flex-1 border py-2 rounded-lg text-sm font-bold text-slate-500">Cancelar</button>
                     <button onClick={parseOrder} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold">Preencher Auto</button>
                  </div>
               </div>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                   <button type="button" onClick={() => setPasteArea(true)} className="w-full border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                      <FileText size={16}/> Colar do WhatsApp (Auto-Preencher)
                   </button>

                   <div>
                      <label className="text-xs font-bold text-slate-500 ml-1">Cliente</label>
                      <input required className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Nome do Cliente" value={form.customer} onChange={e=>setForm({...form, customer: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-xs font-bold text-slate-500 ml-1">Telefone</label>
                         <input required className="w-full border border-slate-200 rounded-xl p-3 outline-none" placeholder="11999999999" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-500 ml-1">Valor</label>
                         <input required className="w-full border border-slate-200 rounded-xl p-3 outline-none" placeholder="R$ 0,00" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} />
                      </div>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 ml-1">Forma de Pagamento</label>
                      <input className="w-full border border-slate-200 rounded-xl p-3 outline-none" placeholder="Ex: PIX, Cartão, Dinheiro" value={form.paymentMethod} onChange={e=>setForm({...form, paymentMethod: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 ml-1">Endereço</label>
                      <input required className="w-full border border-slate-200 rounded-xl p-3 outline-none" placeholder="Rua, Número, Bairro" value={form.address} onChange={e=>setForm({...form, address: e.target.value})} />
                   </div>
                   <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <label className="text-xs font-bold text-blue-600 flex items-center gap-1 mb-1"><LinkIcon size={12}/> Link do Maps (Opcional)</label>
                      <input className="w-full bg-white border border-blue-200 rounded-lg p-2 text-sm text-blue-800" placeholder="https://maps.google.com/..." value={form.mapsLink} onChange={e=>setForm({...form, mapsLink: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 ml-1">Itens</label>
                      <textarea required className="w-full border border-slate-200 rounded-xl p-3 outline-none min-h-[60px]" placeholder="Descrição do pedido..." value={form.items} onChange={e=>setForm({...form, items: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 ml-1">Observações</label>
                      <input className="w-full border border-slate-200 rounded-xl p-3 outline-none" placeholder="Ex: Troco para 50" value={form.obs} onChange={e=>setForm({...form, obs: e.target.value})} />
                   </div>
                   <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-transform active:scale-95">Salvar Pedido</button>
                </form>
            )}
         </div>
      </div>
   )
}

function DriverModal({ onClose, onSave, initialData }: any) {
   const [form, setForm] = useState(initialData || { name: '', phone: '', vehicle: '' });
   
   const submit = (e: React.FormEvent) => {
      e.preventDefault();
      const driverData = {
          ...form,
          // Se for edição, mantém dados antigos, senão cria padrões
          status: initialData ? initialData.status : 'offline',
          lat: initialData ? initialData.lat : 0,
          lng: initialData ? initialData.lng : 0,
          battery: initialData ? initialData.battery : 100,
          rating: initialData ? initialData.rating : 5.0,
          totalDeliveries: initialData ? initialData.totalDeliveries : 0,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name}`
      };
      onSave(driverData);
      onClose();
   };

   return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in p-6">
            <h3 className="font-bold text-xl mb-6 text-slate-800">{initialData ? 'Editar Motoboy' : 'Cadastrar Motoboy'}</h3>
            <form onSubmit={submit} className="space-y-4">
               <input required className="w-full border border-slate-200 rounded-xl p-3 outline-none" placeholder="Nome Completo" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
               <input required className="w-full border border-slate-200 rounded-xl p-3 outline-none" placeholder="Telefone" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
               <input required className="w-full border border-slate-200 rounded-xl p-3 outline-none" placeholder="Veículo (Ex: Honda 160)" value={form.vehicle} onChange={e=>setForm({...form, vehicle: e.target.value})} />
               <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-3 font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
                  <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold shadow-lg shadow-emerald-200">Salvar</button>
               </div>
            </form>
         </div>
      </div>
   )
}

function DriverReportModal({ driverId, drivers, orders, onClose }: any) {
    const driver = drivers.find((d: Driver) => d.id === driverId);
    // Filtra entregas CONCLUÍDAS deste motorista
    const history = orders.filter((o: Order) => o.status === 'completed' && o.driverId === driverId);
    // Ordena do mais recente para o mais antigo
    history.sort((a: any, b: any) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
    
    const totalEarnings = history.length * TAXA_ENTREGA;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <img src={driver?.avatar} className="w-12 h-12 rounded-full bg-white shadow-sm"/>
                        <div>
                            <h3 className="font-bold text-xl text-slate-800">Relatório Financeiro</h3>
                            <p className="text-slate-500 text-sm">{driver?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-emerald-600 font-bold text-xs uppercase">A Pagar (Total)</p>
                        <p className="text-3xl font-bold text-emerald-700">R$ {totalEarnings.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-blue-600 font-bold text-xs uppercase">Entregas Realizadas</p>
                        <p className="text-3xl font-bold text-blue-700">{history.length}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-0">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Calendar size={16}/> Histórico Detalhado</h4>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs sticky top-0">
                            <tr>
                                <th className="p-3 rounded-tl-lg">Data</th>
                                <th className="p-3">Hora</th>
                                <th className="p-3">Endereço</th>
                                <th className="p-3 text-right rounded-tr-lg">Taxa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.map((o: Order) => (
                                <tr key={o.id} className="hover:bg-slate-50">
                                    <td className="p-3 text-slate-600">{formatDate(o.completedAt)}</td>
                                    <td className="p-3 text-slate-600">{formatTime(o.completedAt)}</td>
                                    <td className="p-3 font-medium text-slate-800">{o.address}</td>
                                    <td className="p-3 text-right font-bold text-emerald-600">+ R$ {TAXA_ENTREGA.toFixed(2)}</td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">Nenhuma entrega registrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}