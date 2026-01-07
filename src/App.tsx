import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Package, Clock, 
  X, Search, Users, Bike, 
  TrendingUp, Utensils, Plus, LogOut, CheckSquare,
  MessageCircle, DollarSign, Link as LinkIcon, Loader2, Crosshair,
  Lock, KeyRound, ChevronRight, BellRing, ClipboardCopy, FileText,
  Trash2, Edit, Wallet, Calendar, MinusCircle, ArrowDownCircle, ArrowUpCircle,
  Camera, LayoutDashboard, Map as MapIcon
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
const TAXA_ENTREGA = 5.00; 

// --- TIPOS ---
type UserType = 'admin' | 'driver' | 'landing';
type DriverStatus = 'available' | 'delivering' | 'offline';

interface Driver {
  id: string; 
  name: string;
  password?: string;
  status: DriverStatus;
  lat: number;
  lng: number;
  battery: number;
  vehicle: string;
  plate?: string; 
  cpf?: string;   
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
  driverId?: string; 
}

interface Vale {
  id: string;
  driverId: string;
  amount: number;
  description: string;
  createdAt: any;
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

// --- COMPONENTE DE LOGO ---
const BrandLogo = ({ size = 'normal', dark = false }: { size?: 'small'|'normal'|'large', dark?: boolean }) => {
    const sizeClasses = {
        small: 'text-lg',
        normal: 'text-2xl',
        large: 'text-4xl'
    };
    const iconSize = {
        small: 20,
        normal: 32,
        large: 48
    };

    return (
        <div className={`flex items-center gap-3 font-extrabold tracking-tight ${sizeClasses[size]} ${dark ? 'text-slate-800' : 'text-white'}`}>
            <div className={`bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 ${size === 'small' ? 'p-1.5' : 'p-2.5'}`}>
                <Utensils size={iconSize[size]} className="text-white" />
            </div>
            <span>
                Jhans<span className="text-orange-500">Delivery</span>
            </span>
        </div>
    );
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
  const [vales, setVales] = useState<Vale[]>([]); 
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
    });

    const unsubVales = onSnapshot(collection(db, 'vales'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Vale));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setVales(data);
      setLoading(false);
    });

    return () => { unsubDrivers(); unsubOrders(); unsubVales(); };
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
    if (window.confirm("Tem certeza? O histórico financeiro será mantido, mas o acesso será revogado.")) {
      await deleteDoc(doc(db, 'drivers', id));
    }
  };

  const createVale = async (data: any) => {
    if(!user) return;
    await addDoc(collection(db, 'vales'), {
      ...data,
      createdAt: serverTimestamp()
    });
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

  if (loading && !user) return <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin w-12 h-12 text-orange-500 mb-4"/> <span className="font-bold text-lg animate-pulse">Carregando Sistema...</span></div>;

  if (viewMode === 'landing') {
    return <LandingPage onSelectMode={(m: UserType, id?: string) => { if(id) setCurrentDriverId(id); setViewMode(m); }} hasDrivers={drivers.length > 0} />;
  }

  if (viewMode === 'driver') {
    if (currentDriverId === 'select') {
      return <DriverSelection drivers={drivers} onSelect={(id: string) => setCurrentDriverId(id)} onBack={handleLogout} />;
    }
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return <div className="p-10 text-center"><p>Motorista não encontrado.</p><button onClick={handleLogout}>Sair</button></div>;
    
    return <DriverApp driver={driver} orders={orders} vales={vales} onToggleStatus={() => toggleStatus(driver.id)} onAcceptOrder={acceptOrder} onCompleteOrder={() => completeOrder(driver.id)} onLogout={handleLogout} />;
  }

  return <AdminPanel drivers={drivers} orders={orders} vales={vales} onAssignOrder={assignOrder} onCreateDriver={createDriver} onUpdateDriver={updateDriver} onDeleteDriver={deleteDriver} onCreateOrder={createOrder} onCreateVale={createVale} onLogout={handleLogout} />;
}

// ==========================================
// PÁGINA INICIAL
// ==========================================
function LandingPage({ onSelectMode, hasDrivers }: { onSelectMode: (m: UserType, id?: string) => void, hasDrivers: boolean }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="z-10 text-center space-y-10 max-w-md w-full animate-in fade-in duration-700 slide-in-from-bottom-8">
        <div className="flex justify-center transform scale-110">
            <BrandLogo size="large" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl text-slate-300 font-light">Selecione seu perfil de acesso</h2>
        </div>

        <div className="space-y-4">
          <button onClick={() => onSelectMode('admin')} className="w-full group relative flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-900/20 hover:border-orange-500/30">
            <div className="flex items-center gap-5">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-xl shadow-lg"><TrendingUp className="text-white" size={24}/></div>
              <div className="text-left"><span className="block font-bold text-white text-lg">Sou Gerente</span><span className="text-xs text-slate-400">Painel Administrativo</span></div>
            </div>
            <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" />
          </button>
          
          {hasDrivers ? (
            <button onClick={() => onSelectMode('driver', 'select')} className="w-full group relative flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-900/20 hover:border-emerald-500/30">
              <div className="flex items-center gap-5">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 rounded-xl shadow-lg"><Bike className="text-white" size={24}/></div>
                <div className="text-left"><span className="block font-bold text-white text-lg">Sou Motoboy</span><span className="text-xs text-slate-400">App de Entregas</span></div>
              </div>
              <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" />
            </button>
          ) : (
            <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-500 text-center border border-slate-700">Nenhum motoboy cadastrado ainda.</div>
          )}
        </div>
      </div>
      
      <p className="absolute bottom-6 text-slate-600 text-xs">Versão 6.0 • Jhans Delivery System</p>
    </div>
  );
}

// ==========================================
// SELEÇÃO DE MOTORISTA (COM SENHA)
// ==========================================
function DriverSelection({ drivers, onSelect, onBack }: any) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const driver = drivers.find((d: Driver) => d.id === selectedId);
    if (!driver?.password) { onSelect(driver?.id); return; }
    if (driver.password === password) { onSelect(driver.id); } else { setError("Senha incorreta"); }
  };

  if (selectedId) {
      const driver = drivers.find((d: Driver) => d.id === selectedId);
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-in zoom-in-95 duration-300">
               <div className="text-center mb-8">
                   <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-slate-100 shadow-md overflow-hidden relative">
                       <img src={driver?.avatar} className="w-full h-full object-cover" />
                   </div>
                   <h3 className="font-bold text-2xl text-slate-800">Olá, {driver?.name}!</h3>
                   <p className="text-slate-400 text-sm">Digite sua senha para acessar</p>
               </div>
               
               <form onSubmit={handleLogin} className="space-y-6">
                   <div>
                       <input 
                           type="password" 
                           autoFocus
                           className="w-full border-2 border-slate-100 rounded-2xl p-4 text-center text-xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all tracking-widest placeholder:tracking-normal bg-slate-50" 
                           placeholder="••••"
                           value={password}
                           onChange={e => { setPassword(e.target.value); setError(''); }}
                       />
                       {error && <p className="text-red-500 text-sm text-center mt-2 font-bold animate-pulse">{error}</p>}
                   </div>
                   <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] shadow-lg shadow-orange-200">Acessar Painel</button>
               </form>
               <button onClick={() => { setSelectedId(null); setPassword(''); setError(''); }} className="w-full mt-6 text-slate-400 text-sm hover:text-orange-600 transition-colors">← Trocar de Usuário</button>
           </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md max-h-[85vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-8 text-slate-800 text-center">Quem é você?</h2>
        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {drivers.map((d: Driver) => (
            <button key={d.id} onClick={() => setSelectedId(d.id)} className="w-full flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-orange-50 hover:border-orange-200 transition-all group bg-slate-50/50">
              <img src={d.avatar} className="w-12 h-12 rounded-full bg-white shadow-sm object-cover group-hover:scale-110 transition-transform"/>
              <div className="text-left flex-1">
                <span className="font-bold text-slate-700 block text-lg">{d.name}</span>
                <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1">
                    {d.plate && <span className="bg-slate-200 px-1.5 rounded">{d.plate}</span>}
                    {d.vehicle}
                </span>
              </div>
              {d.password && <Lock size={16} className="text-slate-300 group-hover:text-orange-400" />}
            </button>
          ))}
        </div>
        <button onClick={onBack} className="mt-8 w-full py-3 text-slate-500 text-sm hover:bg-slate-50 rounded-xl font-medium transition-colors">Voltar para Início</button>
      </div>
    </div>
  )
}

// ==========================================
// APP DO MOTOBOY
// ==========================================
function DriverApp({ driver, orders, vales, onToggleStatus, onAcceptOrder, onCompleteOrder, onLogout }: any) {
  const [activeTab, setActiveTab] = useState<'home' | 'wallet'>('home');
  const activeOrder = orders.find((o: Order) => o.id === driver.currentOrderId);
  
  const myDeliveries = orders.filter((o: Order) => o.status === 'completed' && o.driverId === driver.id);
  const myVales = vales.filter((v: Vale) => v.driverId === driver.id);
  
  const totalEarnings = myDeliveries.length * TAXA_ENTREGA;
  const totalDeductions = myVales.reduce((acc: number, v: Vale) => acc + (Number(v.amount) || 0), 0);
  const finalBalance = totalEarnings - totalDeductions;

  const history = [
      ...myDeliveries.map((o: Order) => ({ type: 'delivery', date: o.completedAt, amount: TAXA_ENTREGA, desc: o.address, id: o.id })),
      ...myVales.map((v: Vale) => ({ type: 'vale', date: v.createdAt, amount: v.amount, desc: v.description, id: v.id }))
  ].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

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
          }).catch(e => console.error(e));
        },
        null,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [driver.status, driver.id]);

  const openApp = (url: string) => window.open(url, '_blank');

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-slate-900 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-xl relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
                <img src={driver.avatar} className="w-16 h-16 rounded-full border-4 border-slate-700 bg-white object-cover" />
                <span className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-slate-900 rounded-full ${driver.status==='offline'?'bg-slate-400':'bg-emerald-500'}`}></span>
            </div>
            <div>
              <h2 className="font-bold text-xl">{driver.name}</h2>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium bg-slate-800 px-3 py-1 rounded-full w-fit mt-1">
                 <span>{driver.plate || driver.vehicle}</span>
                 <span className="text-amber-400">★ {driver.rating}</span>
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"><LogOut size={20}/></button>
        </div>
        
        <div className="flex bg-slate-800/80 p-1.5 rounded-xl backdrop-blur-sm">
           <button onClick={() => setActiveTab('home')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab==='home' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Minhas Entregas</button>
           <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab==='wallet' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Financeiro</button>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-6 pb-4 overflow-y-auto z-20">
        {activeTab === 'home' ? (
          <div className="space-y-4">
            <div className={`p-5 rounded-2xl border shadow-lg flex items-center justify-between transition-all ${driver.status === 'offline' ? 'bg-white border-slate-200' : 'bg-emerald-50 border-emerald-200'}`}>
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status Atual</p>
                  <div className="flex items-center gap-2">
                     <span className={`font-bold text-lg ${driver.status === 'offline' ? 'text-slate-700' : 'text-emerald-700'}`}>{driver.status === 'offline' ? 'Você está Offline' : 'Online e Disponível'}</span>
                  </div>
               </div>
               <button onClick={onToggleStatus} className={`px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 ${driver.status === 'offline' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-white border border-slate-200 text-slate-600'}`}>
                 {driver.status === 'offline' ? 'Ficar Online' : 'Pausar'}
               </button>
            </div>

            {driver.status === 'delivering' && activeOrder ? (
               <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                   <div className={`p-6 border-b flex justify-between items-center ${activeOrder.status === 'assigned' ? 'bg-amber-50 border-amber-100' : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-100'}`}>
                      <div>
                        {activeOrder.status === 'assigned' ? 
                            <span className="inline-block text-[10px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full mb-1 animate-pulse">NOVA CORRIDA</span> : 
                            <span className="inline-block text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full mb-1">EM ROTA</span>
                        }
                        <h3 className="font-bold text-xl text-slate-800 leading-tight">{activeOrder.customer}</h3>
                      </div>
                      <div className="text-right">
                          <p className="text-xs text-slate-500 font-bold uppercase">A cobrar</p>
                          <p className="font-extrabold text-2xl text-slate-800">{activeOrder.amount}</p>
                      </div>
                   </div>
                   
                   {activeOrder.status === 'assigned' ? (
                       <div className="p-8 text-center space-y-6">
                           <div className="relative inline-block">
                                <div className="absolute inset-0 bg-amber-200 rounded-full animate-ping opacity-50"></div>
                                <BellRing className="w-20 h-20 text-amber-500 relative z-10"/>
                           </div>
                           <div><h3 className="text-2xl font-bold text-slate-800 mb-2">Nova entrega!</h3><p className="text-slate-500">Confirme para ver o endereço e iniciar.</p></div>
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left"><p className="text-xs text-slate-400 font-bold uppercase mb-1">Itens</p><p className="font-medium text-slate-700">{activeOrder.items}</p></div>
                           <button onClick={() => onAcceptOrder(activeOrder.id)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-5 rounded-2xl shadow-xl shadow-amber-200 text-lg transition-transform active:scale-95">ACEITAR CORRIDA</button>
                       </div>
                   ) : (
                       <div className="p-6 space-y-6">
                         <div>
                            <div className="flex items-start gap-4 mb-6">
                               <div className="bg-orange-100 p-3 rounded-full text-orange-600"><MapPin size={24}/></div>
                               <div><p className="text-xs text-slate-400 font-bold uppercase">Endereço de Entrega</p><p className="text-lg text-slate-800 font-medium leading-snug">{activeOrder.address}</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <button onClick={() => openApp(activeOrder.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeOrder.address)}`)} className="flex flex-col items-center justify-center gap-1 bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 active:scale-95 transition-transform"><Navigation size={24}/> Waze / Maps</button>
                               <button onClick={() => openApp(`https://wa.me/55${activeOrder.phone.replace(/\D/g, '')}`)} className="flex flex-col items-center justify-center gap-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform"><MessageCircle size={24}/> WhatsApp</button>
                            </div>
                         </div>
                         <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                            <div><p className="text-xs text-slate-400 font-bold uppercase">Itens do Pedido</p><p className="text-slate-700 font-medium">{activeOrder.items}</p></div>
                            {activeOrder.obs && <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100"><p className="text-xs text-yellow-700 font-bold uppercase">Observação</p><p className="text-yellow-900 font-bold">{activeOrder.obs}</p></div>}
                            {activeOrder.paymentMethod && <div className="flex items-center gap-2 pt-2 border-t border-slate-200"><DollarSign size={16} className="text-slate-400"/><span className="text-sm font-bold text-slate-700">Pagamento: {activeOrder.paymentMethod}</span></div>}
                         </div>
                         <button onClick={onCompleteOrder} className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 text-lg shadow-xl active:scale-95 transition-transform"><CheckSquare size={24} className="text-emerald-400"/> Finalizar Entrega</button>
                       </div>
                   )}
               </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                 <div className="bg-white p-6 rounded-full shadow-md mb-6"><Search size={48} className="text-slate-300"/></div>
                 <h3 className="text-xl font-bold text-slate-700">Aguardando pedidos...</h3>
                 <p className="text-sm text-slate-500 mt-2 max-w-[200px]">Fique atento, seu celular irá tocar quando chegar um pedido.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 pt-2">
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-xl">
                <p className="text-slate-400 text-sm font-medium mb-1">Saldo a Receber</p>
                <h3 className={`text-5xl font-bold tracking-tight ${finalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>R$ {finalBalance.toFixed(2)}</h3>
                <div className="flex justify-between text-xs text-slate-400 mt-6 pt-4 border-t border-slate-700/50">
                    <span className="flex items-center gap-1"><ArrowUpCircle size={14} className="text-emerald-500"/> Entregas: +R$ {totalEarnings.toFixed(2)}</span>
                    <span className="flex items-center gap-1"><ArrowDownCircle size={14} className="text-red-500"/> Vales: -R$ {totalDeductions.toFixed(2)}</span>
                </div>
             </div>
             
             <div>
                <h4 className="font-bold text-slate-800 mb-4 px-1">Extrato de Atividades</h4>
                <div className="space-y-3 pb-20">
                    {history.map((item: any) => (
                    <div key={item.id} className={`bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm ${item.type === 'vale' ? 'border-red-100' : 'border-emerald-50'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${item.type === 'vale' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                {item.type === 'vale' ? <MinusCircle size={20}/> : <Bike size={20}/>}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{item.type === 'vale' ? 'Vale / Adiantamento' : 'Entrega Realizada'}</p>
                                <p className="text-xs text-slate-400 mb-0.5">{item.desc || 'Sem descrição'}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{formatDate({seconds: item.date?.seconds})} • {formatTime({seconds: item.date?.seconds})}</p>
                            </div>
                        </div>
                        <span className={`text-sm font-bold ${item.type === 'vale' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {item.type === 'vale' ? '-' : '+'} R$ {Number(item.amount).toFixed(2)}
                        </span>
                    </div>
                    ))}
                    {history.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">Nenhum registro financeiro encontrado.</p>}
                </div>
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
        <div className="bg-white rounded-3xl p-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="text-center mb-8">
             <div className="flex justify-center mb-6 scale-125">
                 <BrandLogo dark size="normal" />
             </div>
            <h2 className="text-2xl font-bold text-slate-800">Acesso Restrito</h2>
            <p className="text-sm text-slate-500">Painel do Gerente</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (password === 'admin') { 
              localStorage.setItem('jhans_admin_auth', 'true');
              setIsAuthenticated(true);
            } else {
              alert("Senha incorreta!");
            }
          }} className="space-y-6">
            <div className="relative">
                <KeyRound className="absolute left-4 top-4 text-slate-400" size={20}/>
                <input 
                    type="password" 
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all bg-slate-50" 
                    placeholder="Senha de Acesso" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                />
            </div>
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-200 transform hover:scale-[1.02]">Entrar no Painel</button>
          </form>
          <button onClick={props.onLogout} className="w-full mt-6 text-slate-400 text-sm hover:text-orange-600 transition-colors">← Voltar ao Início</button>
        </div>
      </div>
    )
  }
  return <Dashboard {...props} />;
}

function Dashboard({ drivers, orders, vales, onAssignOrder, onCreateDriver, onUpdateDriver, onDeleteDriver, onCreateOrder, onCreateVale, onLogout }: any) {
  const [view, setView] = useState<'map' | 'list' | 'history'>('map');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [modal, setModal] = useState<'driver' | 'order' | 'vale' | null>(null);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [driverReportId, setDriverReportId] = useState<string | null>(null);

  const delivered = orders.filter((o: Order) => o.status === 'completed');
  const sortedHistory = [...delivered].sort((a: Order, b: Order) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));

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
       const driverName = drivers.find((d: Driver) => d.id === o.driverId)?.name || 'Não identificado';
       text += `✅ ENTREGA ${sortedHistory.length - i} (${o.paymentMethod || 'PAGO'})\n`;
       text += `🏍 Entregador: ${driverName}\n`;
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
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col z-20 shadow-2xl">
        <div className="p-8 border-b border-slate-700/50">
            <BrandLogo size="normal" />
        </div>
        <nav className="flex-1 p-6 space-y-3">
          <SidebarBtn icon={<LayoutDashboard/>} label="Monitoramento" active={view==='map'} onClick={()=>setView('map')}/>
          <SidebarBtn icon={<Users/>} label="Equipe & Motoboys" active={view==='list'} onClick={()=>setView('list')}/>
          <div className="h-px bg-slate-800 my-6 mx-2"></div>
          <SidebarBtn icon={<Plus/>} label="Novo Pedido" onClick={()=>setModal('order')} highlight/>
          <SidebarBtn icon={<Clock/>} label="Relatórios & Histórico" active={view==='history'} onClick={()=>setView('history')}/>
        </nav>
        <div className="p-6">
            <button onClick={onLogout} className="w-full p-4 bg-slate-800 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:text-white hover:bg-slate-700 transition-all font-bold">
                <LogOut size={20}/> Sair
            </button>
        </div>
      </aside>

      {/* Menu Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md text-white p-2 pb-6 flex justify-around z-50 border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
         <button onClick={()=>setView('map')} className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${view==='map'?'text-orange-500 bg-white/10':'text-slate-400'}`}><MapPin size={24}/><span className="text-[10px] font-bold">Mapa</span></button>
         <button onClick={()=>setView('list')} className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${view==='list'?'text-orange-500 bg-white/10':'text-slate-400'}`}><Users size={24}/><span className="text-[10px] font-bold">Equipe</span></button>
         <button onClick={()=>setModal('order')} className="p-4 -mt-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-lg border-4 border-slate-900 text-white transform active:scale-95 transition-transform"><Plus size={32}/></button>
         <button onClick={()=>setView('history')} className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${view==='history'?'text-orange-500 bg-white/10':'text-slate-400'}`}><Clock size={24}/><span className="text-[10px] font-bold">Histórico</span></button>
         <button onClick={onLogout} className="p-3 text-slate-400 flex flex-col items-center gap-1"><LogOut size={24}/><span className="text-[10px] font-bold">Sair</span></button>
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white border-b px-6 md:px-10 flex items-center justify-between shadow-sm z-10">
           <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">{view === 'map' ? 'Visão Geral' : view === 'list' ? 'Gestão de Equipe' : 'Relatório de Vendas'}</h1>
           <div className="hidden md:flex text-xs font-bold bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full items-center gap-2 border border-emerald-200 shadow-sm"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Sistema Online</div>
        </header>

        <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row">
          {view === 'map' && (
             <div className="flex-1 bg-slate-100 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                
                {/* Lista Pedidos Flutuante */}
                <div className="absolute top-6 left-6 z-20 space-y-3 max-h-[85%] overflow-y-auto w-72 hidden md:block pr-2 custom-scrollbar">
                   {orders.filter((o: Order) => o.status === 'pending').map((o: Order) => (
                      <div key={o.id} className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-orange-500 animate-in slide-in-from-left hover:shadow-xl transition-shadow cursor-pointer">
                         <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-slate-800">{o.customer}</span>
                            <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">{o.time || 'Agora'}</span>
                         </div>
                         <p className="text-xs text-slate-500 truncate">{o.address}</p>
                         <div className="flex justify-between items-center mt-2">
                             <span className="text-sm font-bold text-emerald-600">{o.amount}</span>
                             <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-bold">Pendente</span>
                         </div>
                      </div>
                   ))}
                   {orders.filter((o: Order) => o.status === 'pending').length === 0 && (
                       <div className="bg-white/80 backdrop-blur p-6 rounded-xl border border-slate-200 text-center">
                           <Package className="mx-auto text-slate-300 mb-2" size={32}/>
                           <p className="text-sm text-slate-500 font-medium">Tudo tranquilo por aqui.</p>
                       </div>
                   )}
                </div>
                
                {/* Mapa Mock */}
                {drivers.map((d: Driver) => (
                   <div key={d.id} onClick={() => setSelectedDriver(d)} className="absolute z-30 hover:scale-110 transition-transform cursor-pointer" style={{top: `50%`, left: `50%`, transform: `translate(${(Math.random()-0.5)*300}px, ${(Math.random()-0.5)*300}px)`}}>
                      <div className="relative group">
                         <div className={`w-14 h-14 rounded-full border-4 shadow-2xl overflow-hidden bg-white transition-colors ${d.status==='delivering' ? 'border-orange-500' : d.status==='available' ? 'border-emerald-500' : 'border-slate-400'}`}>
                            <img src={d.avatar} className="w-full h-full object-cover"/>
                         </div>
                         <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none shadow-lg">
                            {d.name}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}

          {view === 'list' && (
             <div className="flex-1 bg-slate-50 p-6 md:p-10 overflow-auto pb-32 md:pb-10">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="font-bold text-2xl text-slate-800">Frota Ativa ({drivers.length})</h2>
                   <button onClick={()=>setModal('driver')} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold flex gap-2 shadow-lg hover:scale-105 transition-all"><Plus size={18}/> Cadastrar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {drivers.map((d: Driver) => (
                      <div key={d.id} className="border border-slate-100 p-5 rounded-2xl hover:shadow-xl transition-all bg-white relative group">
                         <div className="flex items-center gap-5 cursor-pointer" onClick={()=>setSelectedDriver(d)}>
                            <img src={d.avatar} className="w-16 h-16 rounded-full bg-slate-100 object-cover border-2 border-slate-50"/>
                            <div>
                               <h3 className="font-bold text-lg text-slate-800">{d.name}</h3>
                               <p className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Bike size={12}/> {d.vehicle} • {d.plate}</p>
                               <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide ${d.status==='offline'?'bg-slate-100 text-slate-500':d.status==='available'?'bg-emerald-100 text-emerald-700':'bg-orange-100 text-orange-700'}`}>{d.status}</span>
                            </div>
                         </div>
                         <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>setDriverReportId(d.id)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Financeiro"><Wallet size={18}/></button>
                            <button onClick={()=>{setDriverToEdit(d); setModal('driver');}} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors" title="Editar"><Edit size={18}/></button>
                            <button onClick={()=>onDeleteDriver(d.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Excluir"><Trash2 size={18}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {view === 'history' && (
             <div className="flex-1 bg-slate-50 p-6 md:p-10 overflow-auto pb-32 md:pb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h3 className="font-bold text-2xl text-slate-800">Relatório Completo</h3>
                    <button onClick={copyReport} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:scale-105">
                        <ClipboardCopy size={18}/> Copiar para WhatsApp
                    </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                   <StatBox label="Faturamento" value={`R$ ${delivered.reduce((acc: number, c: Order)=>acc+(c.value||0),0).toFixed(2)}`} icon={<DollarSign/>} color="bg-emerald-50 text-emerald-600"/>
                   <StatBox label="Entregas" value={delivered.length} icon={<CheckSquare/>} color="bg-blue-50 text-blue-600"/>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                   <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b text-slate-500 font-semibold uppercase text-xs">
                           <tr><th className="p-5">Cliente</th><th className="p-5">Entregador</th><th className="p-5">Valor</th><th className="p-5">Pagamento</th><th className="p-5 hidden md:table-cell">Duração</th><th className="p-5">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {sortedHistory.map((o: Order) => (
                              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                 <td className="p-5 font-medium text-slate-800">{o.customer}</td>
                                 <td className="p-5 text-slate-600">
                                     <div className="flex items-center gap-2">
                                         <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                            <img src={drivers.find(d => d.id === o.driverId)?.avatar} className="w-full h-full object-cover"/>
                                         </div>
                                         {drivers.find(d => d.id === o.driverId)?.name || '...'}
                                     </div>
                                 </td>
                                 <td className="p-5 font-bold text-emerald-600">{o.amount}</td>
                                 <td className="p-5 text-slate-500 text-xs uppercase font-semibold">{o.paymentMethod || '-'}</td>
                                 <td className="p-5 text-slate-500 hidden md:table-cell font-mono">{calcDuration(o.assignedAt, o.completedAt)}</td>
                                 <td className="p-5"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">CONCLUÍDO</span></td>
                              </tr>
                           ))}
                           {sortedHistory.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-slate-400 italic">Nenhum dado encontrado para hoje.</td></tr>}
                        </tbody>
                     </table>
                   </div>
                </div>
             </div>
          )}

          {(view === 'map' || selectedDriver) && (
             <aside className={`fixed md:relative inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl p-0 overflow-y-auto z-40 transition-transform duration-300 border-l border-slate-100 ${selectedDriver ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                {selectedDriver ? (
                   <div className="h-full flex flex-col bg-slate-50">
                      <div className="bg-white p-6 border-b border-slate-100 sticky top-0 z-10">
                          <div className="flex justify-between items-start mb-6">
                              <h3 className="font-bold text-slate-800 text-lg">Perfil do Motoboy</h3>
                              <button onClick={()=>setSelectedDriver(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
                          </div>
                          
                          <div className="flex flex-col items-center">
                             <div className="relative mb-3">
                                <img src={selectedDriver.avatar} className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-lg object-cover"/>
                                <span className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white ${selectedDriver.status==='offline'?'bg-slate-400':selectedDriver.status==='available'?'bg-emerald-500':'bg-orange-500'}`}></span>
                             </div>
                             <h2 className="font-bold text-2xl text-slate-800">{selectedDriver.name}</h2>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">{selectedDriver.plate}</span>
                                <span className="text-sm text-slate-500">{selectedDriver.vehicle}</span>
                             </div>
                             
                             <button onClick={() => trackDriver(selectedDriver)} className="mt-5 w-full bg-blue-50 text-blue-600 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors border border-blue-200 hover:shadow-md">
                                <MapIcon size={18} /> Rastrear Posição Real
                             </button>
                             {selectedDriver.lastUpdate && <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Sinal GPS: {formatTime(selectedDriver.lastUpdate)}</p>}
                             
                             <button onClick={() => { setDriverToEdit(selectedDriver); setModal('vale'); }} className="mt-3 w-full border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
                                <MinusCircle size={16} /> Lançar Desconto / Vale
                             </button>
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6">
                         <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Atribuir Entrega Pendente</h4>
                         <div className="space-y-3 pb-20">
                            {orders.filter((o: Order) => o.status === 'pending').map((o: Order) => (
                               <div key={o.id} onClick={()=>onAssignOrder(o.id, selectedDriver.id)} className="border border-slate-200 p-4 rounded-xl hover:border-orange-500 hover:shadow-md transition-all bg-white cursor-pointer group">
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="font-bold text-slate-800">{o.customer}</span>
                                      <span className="text-emerald-600 font-extrabold">{o.amount}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">{o.address}</p>
                                  <button className="w-full bg-slate-900 text-white text-xs font-bold py-3 rounded-lg group-hover:bg-orange-600 transition-colors">Enviar para Motoboy</button>
                               </div>
                            ))}
                            {orders.filter((o: Order) => o.status === 'pending').length === 0 && (
                               <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
                                   <Package className="mx-auto text-slate-300 mb-3" size={32}/>
                                   <p className="text-sm text-slate-400 font-medium">Sem pedidos na fila.</p>
                               </div>
                            )}
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-40 bg-slate-50 p-10">
                      <div className="bg-white p-6 rounded-full mb-4 shadow-sm"><Users size={40} className="text-slate-400"/></div>
                      <h3 className="text-lg font-bold text-slate-600">Nenhum motoboy selecionado</h3>
                      <p className="text-sm text-slate-500 max-w-[200px] mt-2">Clique em um motoboy no mapa ou na lista para gerenciar.</p>
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

      {/* MODAL VALE */}
      {modal === 'vale' && driverToEdit && (
         <NewValeModal 
            driver={driverToEdit}
            onClose={() => { setModal(null); setDriverToEdit(null); }}
            onSave={onCreateVale} 
         />
      )}

      {/* MODAL RELATÓRIO FINANCEIRO DO MOTORISTA */}
      {driverReportId && (
         <DriverReportModal 
            driverId={driverReportId} 
            drivers={drivers} 
            orders={orders} 
            vales={vales}
            onClose={() => setDriverReportId(null)} 
            onNewVale={() => {
                const drv = drivers.find((d: Driver) => d.id === driverReportId);
                if (drv) { setDriverToEdit(drv); setModal('vale'); }
            }}
         />
      )}
    </div>
  )
}

function SidebarBtn({ icon, label, active, onClick, highlight }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all ${active ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : highlight ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className={active ? 'text-white' : highlight ? 'text-orange-400' : 'text-current'}>{icon}</div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

function StatBox({label, value, icon, color}: any) {
   return (
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
         <div className={`p-4 rounded-xl ${color || 'bg-slate-100 text-slate-600'}`}>{icon}</div>
         <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">{label}</p><p className="text-2xl font-extrabold text-slate-800">{value}</p></div>
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
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
         <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in p-0 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Plus size={20}/></div> Novo Pedido</h3>
               <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
                {pasteArea ? (
                   <div className="space-y-4 animate-in slide-in-from-right">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                          <p className="text-sm text-blue-700 font-medium mb-2 flex items-center gap-2"><FileText size={16}/> Colar do WhatsApp</p>
                          <textarea className="w-full h-40 border border-blue-200 p-3 rounded-xl text-xs font-mono bg-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cole o texto aqui..." value={rawText} onChange={e => setRawText(e.target.value)}/>
                      </div>
                      <div className="flex gap-3">
                         <button onClick={() => setPasteArea(false)} className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">Voltar</button>
                         <button onClick={parseOrder} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-transform active:scale-95">Processar Texto</button>
                      </div>
                   </div>
                ) : (
                    <form onSubmit={submit} className="space-y-5">
                       <button type="button" onClick={() => setPasteArea(true)} className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                          <FileText size={18}/> Importar do WhatsApp
                       </button>

                       <div className="space-y-4">
                           <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Cliente</label><input required className="w-full border-2 border-slate-100 rounded-xl p-3.5 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all font-medium text-slate-700" placeholder="Nome do Cliente" value={form.customer} onChange={e=>setForm({...form, customer: e.target.value})} /></div>
                           <div className="grid grid-cols-2 gap-4">
                              <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Telefone</label><input required className="w-full border-2 border-slate-100 rounded-xl p-3.5 outline-none focus:border-orange-500 transition-all font-medium text-slate-700" placeholder="(00) 00000-0000" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} /></div>
                              <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Valor</label><input required className="w-full border-2 border-slate-100 rounded-xl p-3.5 outline-none focus:border-orange-500 transition-all font-medium text-slate-700" placeholder="R$ 0,00" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} /></div>
                           </div>
                           <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Pagamento</label><input className="w-full border-2 border-slate-100 rounded-xl p-3.5 outline-none focus:border-orange-500 transition-all font-medium text-slate-700" placeholder="PIX, Dinheiro..." value={form.paymentMethod} onChange={e=>setForm({...form, paymentMethod: e.target.value})} /></div>
                           <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Endereço</label><input required className="w-full border-2 border-slate-100 rounded-xl p-3.5 outline-none focus:border-orange-500 transition-all font-medium text-slate-700" placeholder="Rua, Número, Bairro" value={form.address} onChange={e=>setForm({...form, address: e.target.value})} /></div>
                           <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Link GPS (Opcional)</label><input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-blue-600 outline-none focus:bg-white transition-all" placeholder="https://maps.google.com/..." value={form.mapsLink} onChange={e=>setForm({...form, mapsLink: e.target.value})} /></div>
                           <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Itens</label><textarea required className="w-full border-2 border-slate-100 rounded-xl p-3.5 outline-none focus:border-orange-500 transition-all font-medium text-slate-700 min-h-[80px]" placeholder="Descrição do pedido..." value={form.items} onChange={e=>setForm({...form, items: e.target.value})} /></div>
                           <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Obs</label><input className="w-full border-2 border-slate-100 rounded-xl p-3.5 outline-none focus:border-orange-500 transition-all font-medium text-slate-700" placeholder="Ex: Troco para 50" value={form.obs} onChange={e=>setForm({...form, obs: e.target.value})} /></div>
                       </div>
                       
                       <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-200 transition-all transform hover:scale-[1.02] active:scale-95 text-lg">Salvar Pedido</button>
                    </form>
                )}
            </div>
         </div>
      </div>
   )
}

function NewDriverModal({ onClose, onSave, initialData }: any) {
   // ... Mesmo código do modal de driver, mas com estilos atualizados (veja abaixo se precisar, mas o padrão segue o NewOrderModal)
   const [form, setForm] = useState({ 
       name: initialData?.name || '', 
       password: initialData?.password || '', 
       phone: initialData?.phone || '', 
       vehicle: initialData?.vehicle || '', 
       cpf: initialData?.cpf || '', 
       plate: initialData?.plate || '', 
       avatar: initialData?.avatar || '' 
   });
   
   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setForm(prev => ({ ...prev, avatar: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
   };
   
   const submit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
          ...form,
          status: initialData ? initialData.status : 'offline',
          lat: 0, lng: 0, battery: 100, rating: 5.0, totalDeliveries: 0,
          avatar: form.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name}`
      });
      onClose();
   };

   return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
         <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-bold text-xl text-slate-800">{initialData ? 'Editar Perfil' : 'Novo Motoboy'}</h3>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
               <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Nome</label><input required className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-emerald-500 transition-all" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} /></div>
               <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Senha</label><input required type="text" className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none bg-yellow-50 focus:border-yellow-400 transition-all" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Telefone</label><input required className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">CPF</label><input className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none" value={form.cpf} onChange={e=>setForm({...form, cpf: e.target.value})} /></div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Veículo</label><input required className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none" value={form.vehicle} onChange={e=>setForm({...form, vehicle: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Placa</label><input className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none" value={form.plate} onChange={e=>setForm({...form, plate: e.target.value})} /></div>
               </div>
               
               {/* Upload Foto */}
               <div className="mt-4">
                  <label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Foto</label>
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden shrink-0">
                          {form.avatar ? <img src={form.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera size={24}/></div>}
                      </div>
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                          <Camera size={16}/> Enviar Foto
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                  </div>
                  <input className="w-full mt-2 border border-slate-200 rounded-lg p-2 text-xs text-slate-500 outline-none" placeholder="Ou cole URL..." value={form.avatar} onChange={e=>setForm({...form, avatar: e.target.value})} />
               </div>

               <div className="flex gap-3 pt-4">
                  <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-3 font-bold text-slate-500 hover:bg-slate-50">Cancelar</button>
                  <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold shadow-lg shadow-emerald-200">Salvar</button>
               </div>
            </form>
         </div>
      </div>
   )
}

function NewValeModal({ driver, onClose, onSave }: any) {
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ driverId: driver.id, amount: parseFloat(amount.replace(',', '.')), description: desc });
        onClose();
    };
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in p-6">
                <h3 className="font-bold text-xl mb-1 text-slate-800 flex items-center gap-2"><MinusCircle className="text-red-500"/> Novo Vale</h3>
                <p className="text-sm text-slate-400 mb-6">Desconto para <strong>{driver.name}</strong></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Valor</label><input required autoFocus className="w-full border-2 border-slate-100 rounded-xl p-4 text-2xl font-bold text-slate-800 outline-none focus:border-red-500" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} /></div>
                    <div><label className="text-xs font-bold text-slate-400 ml-1 uppercase mb-1 block">Motivo</label><input required className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none" placeholder="Ex: Gasolina" value={desc} onChange={e => setDesc(e.target.value)} /></div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-3 font-bold text-slate-500 hover:bg-slate-50">Cancelar</button>
                        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-bold shadow-lg shadow-red-200">Confirmar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DriverReportModal({ driverId, drivers, orders, vales, onClose, onNewVale }: any) {
    const driver = drivers.find((d: Driver) => d.id === driverId);
    const myDeliveries = orders.filter((o: Order) => o.status === 'completed' && o.driverId === driverId);
    const earnings = myDeliveries.length * TAXA_ENTREGA;
    const myVales = vales.filter((v: Vale) => v.driverId === driverId);
    const deductions = myVales.reduce((acc: number, v: Vale) => acc + (Number(v.amount) || 0), 0);
    const balance = earnings - deductions;

    const history = [
        ...myDeliveries.map((o: Order) => ({ type: 'delivery', date: o.completedAt, amount: TAXA_ENTREGA, desc: o.address, id: o.id })),
        ...myVales.map((v: Vale) => ({ type: 'vale', date: v.createdAt, amount: v.amount, desc: v.description, id: v.id }))
    ].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-in zoom-in flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-4">
                        <img src={driver?.avatar} className="w-14 h-14 rounded-full bg-white shadow-md object-cover border-2 border-white"/>
                        <div><h3 className="font-bold text-xl text-slate-800">{driver?.name}</h3><p className="text-slate-500 text-sm">Extrato Financeiro</p></div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-400"/></button>
                </div>
                
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 bg-white">
                    <div className={`p-5 rounded-2xl border ${balance >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <p className={`font-bold text-xs uppercase tracking-wide ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Saldo Atual</p>
                        <p className={`text-3xl font-extrabold mt-1 ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>R$ {balance.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 hidden md:block">
                        <p className="text-blue-600 font-bold text-xs uppercase tracking-wide">Entregas</p>
                        <p className="text-3xl font-extrabold text-blue-700 mt-1">{myDeliveries.length}</p>
                    </div>
                    <button onClick={onNewVale} className="p-4 rounded-2xl border-2 border-dashed border-red-200 flex flex-col items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-300 transition-all hover:scale-105">
                        <MinusCircle size={24} className="mb-1"/>
                        <span className="text-xs font-bold">Novo Vale</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar bg-white">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><Calendar size={16}/> Histórico</h4>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                            <tr><th className="p-3 rounded-tl-lg">Data</th><th className="p-3">Descrição</th><th className="p-3 text-right rounded-tr-lg">Valor</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 text-slate-500 w-32 font-mono text-xs">
                                        {formatDate({seconds: item.date?.seconds})}<br/>{formatTime({seconds: item.date?.seconds})}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            {item.type === 'vale' ? <ArrowDownCircle size={16} className="text-red-500"/> : <ArrowUpCircle size={16} className="text-emerald-500"/>}
                                            <span className="font-bold text-slate-700">{item.type === 'vale' ? 'Desconto' : 'Entrega'}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 pl-6 truncate max-w-[180px]">{item.desc}</p>
                                    </td>
                                    <td className={`p-3 text-right font-bold text-base ${item.type === 'vale' ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {item.type === 'vale' ? '-' : '+'} R$ {Number(item.amount).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {history.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic">Nenhum registro.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}