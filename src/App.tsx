import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, Navigation, Package, Clock, 
  X, Search, Users, Bike, 
  TrendingUp, TrendingDown, Utensils, Plus, LogOut, CheckSquare,
  MessageCircle, DollarSign, Loader2,
  ChevronRight, ClipboardCopy,
  Trash2, Edit, Wallet, MinusCircle, Settings, Camera, ClipboardPaste,
  LayoutDashboard, Map as MapIcon, ShoppingBag, PlusCircle, MinusCircle as MinusIcon, UploadCloud, Trophy, Star, Store, Minus, ListPlus, ClipboardList, History, Calendar, ChevronDown, CheckCircle2, AlertCircle
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
  deleteDoc,
  setDoc,
  writeBatch,
  Timestamp
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

interface AppConfig {
    appName: string;
    appLogoUrl: string;
}

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
  status: 'pending' | 'assigned' | 'delivering' | 'completed';
  amount: string;
  value: number; 
  paymentMethod?: string;
  serviceType?: 'delivery' | 'pickup';
  paymentStatus?: 'paid' | 'pending';
  obs?: string;
  time?: string;
  origin?: 'manual' | 'menu';
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

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  createdAt: any;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
}

interface Client {
    id: string;
    name: string;
    phone: string;
    address: string;
    mapsLink?: string;
    lastOrderAt?: any;
    obs?: string;
    totalOrders?: number; 
    totalSpent?: number;  
}

// --- UTILITÁRIOS ---
const formatTime = (timestamp: any) => {
  if (!timestamp || !timestamp.seconds) return '-';
  return new Date(timestamp.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp: any) => {
  if (!timestamp || !timestamp.seconds) return '-';
  return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR');
};

const isToday = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return false;
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const parseCurrency = (val: string) => {
    return parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
}

const normalizePhone = (phone: string) => {
    if (!phone) return '';
    let p = phone.replace(/\D/g, ''); 
    if (p.startsWith('55') && p.length > 11) p = p.substring(2); 
    if (p.length === 11 && p[2] === '9') {
        p = p.substring(0, 2) + p.substring(3);
    }
    return p;
};

// PADRONIZAÇÃO (Capitalize)
const capitalize = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
};

const copyToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if(successful) alert("Copiado com sucesso!");
        else alert("Erro ao copiar.");
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        alert("Erro ao copiar.");
    }
    document.body.removeChild(textArea);
};

// COMPRESSOR DE IMAGEM (CLIENT-SIDE)
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Reduz para max 200px de largura (bom para avatares)
                const MAX_WIDTH = 200; 
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Converte para JPEG com qualidade 0.7 (70%)
                resolve(canvas.toDataURL('image/jpeg', 0.7)); 
            };
        };
        reader.onerror = (error) => reject(error);
    });
};

// --- COMPONENTES AUXILIARES ---
// BrandLogo agora aceita config dinamicamente
const BrandLogo = ({ size = 'normal', dark = false, config }: { size?: 'small'|'normal'|'large', dark?: boolean, config?: AppConfig }) => {
    // Revertido para os tamanhos originais (sem redução mobile)
    const sizeClasses = { small: 'text-lg', normal: 'text-2xl', large: 'text-4xl' };
    const iconSize = size === 'large' ? 48 : size === 'normal' ? 32 : 20;
    
    // Default config se não for passado
    const appName = config?.appName || "Jhans Burgers";
    const appLogo = config?.appLogoUrl;

    return (
        <div className={`flex items-center gap-3 font-extrabold tracking-tight ${sizeClasses[size]} ${dark ? 'text-slate-800' : 'text-white'}`}>
            {appLogo ? (
                <div className={`rounded-xl flex items-center justify-center shadow-md overflow-hidden bg-slate-800 ${size === 'small' ? 'w-8 h-8' : size === 'normal' ? 'w-12 h-12' : 'w-20 h-20'} shrink-0`}>
                    <img src={appLogo} alt="Logo" className="w-full h-full object-cover"/>
                </div>
            ) : (
                <div className={`bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0 ${size === 'small' ? 'p-1.5' : 'p-2.5'}`}>
                    <Utensils className="text-white" size={iconSize} />
                </div>
            )}
            
            <div className="flex flex-col leading-none items-start">
                <span>{appName}</span>
                {size !== 'small' && <span className={`text-[0.4em] uppercase tracking-widest text-left ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Delivery System</span>}
            </div>
        </div>
    );
};

function SidebarBtn({ icon, label, active, onClick, highlight }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all ${active ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : highlight ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className={active ? 'text-white' : highlight ? 'text-amber-400' : 'text-current'}>{icon}</div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

function StatBox({label, value, icon, color, subtext}: any) {
   return (
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between gap-4 hover:border-amber-500/30 transition-all duration-300">
         <div>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1 truncate">{label}</p>
             <p className="text-2xl font-extrabold text-white truncate leading-none">{value}</p>
             {subtext && <p className="text-[10px] text-slate-500 mt-2 truncate">{subtext}</p>}
         </div>
         <div className={`p-3 rounded-xl shrink-0 ${color || 'bg-slate-800 text-slate-400'}`}>{icon}</div>
      </div>
   )
}

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<UserType>(() => {
    try { return (localStorage.getItem('jhans_viewMode') as UserType) || 'landing'; } catch { return 'landing'; }
  });
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(() => {
    try { return localStorage.getItem('jhans_driverId'); } catch { return null; }
  });

  // Configurações do App (Persistência Local para White Label)
  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
      try {
          const saved = localStorage.getItem('jhans_app_config');
          return saved ? JSON.parse(saved) : { appName: "Jhans Burgers", appLogoUrl: "" };
      } catch {
          return { appName: "Jhans Burgers", appLogoUrl: "" };
      }
  });

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vales, setVales] = useState<Vale[]>([]); 
  const [expenses, setExpenses] = useState<Expense[]>([]); 
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]); 
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Monitora redimensionamento
  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Salvar configurações quando mudarem
  useEffect(() => {
      localStorage.setItem('jhans_app_config', JSON.stringify(appConfig));
  }, [appConfig]);

  // Injetar CSS de Animação e Custom Scrollbar (SLIM) + CIDADE REALISTA (RUAS)
  useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        /* --- ANIMAÇÕES DE TRÂNSITO --- */
        /* O Grid tem 80px. */
        
        @keyframes driveX { 
            0% { transform: translate(0, 0) scaleX(1); } 
            45% { transform: translate(160px, 0) scaleX(1); } 
            50% { transform: translate(160px, 0) scaleX(-1); }
            95% { transform: translate(0, 0) scaleX(-1); } 
            100% { transform: translate(0, 0) scaleX(1); } 
        }

        @keyframes driveY { 
            0% { transform: translate(0, 0); } 
            45% { transform: translate(0, 160px); } 
            50% { transform: translate(0, 160px); } 
            95% { transform: translate(0, 0); } 
            100% { transform: translate(0, 0); } 
        }

        @keyframes driveL { 
            0% { transform: translate(0, 0); } 
            25% { transform: translate(80px, 0); }
            50% { transform: translate(80px, 80px); }
            75% { transform: translate(0, 80px); }
            100% { transform: translate(0, 0); }
        }

        .animate-drive-x { animation: driveX 20s linear infinite; }
        .animate-drive-y { animation: driveY 25s linear infinite; }
        .animate-drive-l { animation: driveL 30s linear infinite; }
        
        /* --- MAPA DE CIDADE (RUAS) --- */
        .city-map-bg {
            background-color: #0f172a; /* Slate 900 Background */
            /* Linhas simulando ruas (grid simples e eficiente) */
            background-image:
                linear-gradient(rgba(148, 163, 184, 0.1) 4px, transparent 4px), /* Rua Horizontal */
                linear-gradient(90deg, rgba(148, 163, 184, 0.1) 4px, transparent 4px); /* Rua Vertical */
            background-size: 80px 80px; /* Tamanho da Quadra */
            background-position: -2px -2px; /* Ajuste fino */
        }

        /* Farol */
        .headlight {
            box-shadow: 0 0 20px 5px rgba(245, 158, 11, 0.4);
        }

        /* SCROLLBAR */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        * { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
      `;
      document.head.appendChild(style);
      return () => { if(document.head.contains(style)) document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else signInAnonymously(auth).catch(console.error);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const handleError = (error: any) => { if (error.code === 'permission-denied') setPermissionError(true); };
    const unsubs = [
        onSnapshot(collection(db, 'drivers'), s => setDrivers(s.docs.map(d => ({id: d.id, ...d.data()} as Driver))), handleError),
        onSnapshot(collection(db, 'orders'), s => setOrders(s.docs.map(d => ({id: d.id, ...d.data()} as Order))), handleError),
        onSnapshot(collection(db, 'vales'), s => setVales(s.docs.map(d => ({id: d.id, ...d.data()} as Vale))), handleError),
        onSnapshot(collection(db, 'expenses'), s => setExpenses(s.docs.map(d => ({id: d.id, ...d.data()} as Expense))), handleError),
        onSnapshot(collection(db, 'products'), s => setProducts(s.docs.map(d => ({id: d.id, ...d.data()} as Product))), handleError),
        onSnapshot(collection(db, 'clients'), s => { setClients(s.docs.map(d => ({id: d.id, ...d.data()} as Client))); setLoading(false); }, handleError)
    ];
    return () => unsubs.forEach(u => u());
  }, [user]);

  const handleAction = async (action: () => Promise<void>) => {
      try { await action(); } catch(e: any) { 
          if(e.code === 'permission-denied') setPermissionError(true); 
          else alert('Erro: ' + e.message); 
      }
  };

  const createOrder = (data: any) => handleAction(async () => {
    await addDoc(collection(db, 'orders'), { ...data, status: 'pending', createdAt: serverTimestamp() });
    if (data.phone) {
        const cleanPhone = normalizePhone(data.phone);
        if (cleanPhone) await setDoc(doc(db, 'clients', cleanPhone), { name: data.customer, phone: data.phone, address: data.address, mapsLink: data.mapsLink || '', lastOrderAt: serverTimestamp() }, { merge: true });
    }
  });

  const createDriver = (data: any) => handleAction(async () => { await addDoc(collection(db, 'drivers'), data); });
  const updateDriver = (id: string, data: any) => handleAction(async () => { await updateDoc(doc(db, 'drivers', id), data); }); 
  const updateOrder = (id: string, data: any) => handleAction(async () => { await updateDoc(doc(db, 'orders', id), data); }); 
  const updateClient = (id: string, data: any) => handleAction(async () => { await setDoc(doc(db, 'clients', id), data, { merge: true }); });

  const deleteDriver = (id: string) => handleAction(async () => { if (confirm("Tem certeza?")) await deleteDoc(doc(db, 'drivers', id)); });
  const deleteOrder = (id: string) => handleAction(async () => { if (confirm("Excluir pedido?")) await deleteDoc(doc(db, 'orders', id)); });
  const createVale = (data: any) => handleAction(async () => { await addDoc(collection(db, 'vales'), { ...data, createdAt: serverTimestamp() }); });
  const createExpense = (data: any) => handleAction(async () => { await addDoc(collection(db, 'expenses'), { ...data, createdAt: serverTimestamp() }); });
  const createProduct = (data: any) => handleAction(async () => { await addDoc(collection(db, 'products'), data); });
  const updateProduct = (id: string, data: any) => handleAction(async () => { await updateDoc(doc(db, 'products', id), data); });
  const deleteProduct = (id: string) => handleAction(async () => { if(confirm("Excluir produto?")) await deleteDoc(doc(db, 'products', id)); });
  const updateClientData = (id: string, data: any) => handleAction(async () => { await updateDoc(doc(db, 'clients', id), data); }); // Updated client update

  const assignOrder = (oid: string, did: string) => handleAction(async () => { 
      await updateDoc(doc(db, 'orders', oid), { status: 'assigned', assignedAt: serverTimestamp(), driverId: did }); 
      await updateDoc(doc(db, 'drivers', did), { status: 'delivering', currentOrderId: oid }); 
  });
  
  const acceptOrder = (id: string) => handleAction(async () => { 
      await updateDoc(doc(db, 'orders', id), { status: 'delivering' }); 
  });
  
  const completeOrder = (oid: string, did: string) => handleAction(async () => {
      const drv = drivers.find(d => d.id === did);
      await updateDoc(doc(db, 'orders', oid), { status: 'completed', completedAt: serverTimestamp() });
      if(drv?.currentOrderId === oid) await updateDoc(doc(db, 'drivers', did), { status: 'available', currentOrderId: null, totalDeliveries: (drv.totalDeliveries || 0) + 1 });
      else await updateDoc(doc(db, 'drivers', did), { totalDeliveries: (drv?.totalDeliveries || 0) + 1 });
  });
  const toggleStatus = (did: string) => handleAction(async () => { const d = drivers.find(drv => drv.id === did); if(d) await updateDoc(doc(db, 'drivers', did), { status: d.status === 'offline' ? 'available' : 'offline' }); });
  
  const handleLogout = () => { localStorage.clear(); window.location.reload(); };

  if (permissionError) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white"><div className="text-center"><h1>Acesso Bloqueado</h1><button onClick={()=>window.location.reload()} className="mt-4 bg-blue-600 px-4 py-2 rounded">Recarregar</button></div></div>;
  if (loading && !user) return <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin w-10 h-10 text-amber-500 mb-4"/> <span className="font-medium animate-pulse">Carregando Sistema...</span></div>;

  if (viewMode === 'landing') return <LandingPage onSelectMode={(m: UserType, id?: string) => { if(id) setCurrentDriverId(id); setViewMode(m); }} config={appConfig} />;
  
  if (viewMode === 'driver') {
    if (currentDriverId === 'select') return <DriverSelection drivers={drivers} onSelect={(id: string) => setCurrentDriverId(id)} onBack={handleLogout} />;
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return <div className="p-10 text-center text-white bg-slate-900 h-screen"><p>Motorista não encontrado.</p><button onClick={handleLogout}>Sair</button></div>;
    return <DriverApp driver={driver} orders={orders} onToggleStatus={() => toggleStatus(driver.id)} onAcceptOrder={acceptOrder} onCompleteOrder={completeOrder} onLogout={handleLogout} />;
  }

  return <AdminPanel 
            drivers={drivers} orders={orders} vales={vales} expenses={expenses} products={products} clients={clients}
            onAssignOrder={assignOrder} onCreateDriver={createDriver} onUpdateDriver={updateDriver} onDeleteDriver={deleteDriver} 
            onCreateOrder={createOrder} onDeleteOrder={deleteOrder} onUpdateOrder={updateOrder} onCreateVale={createVale} onCreateExpense={createExpense}
            onCreateProduct={createProduct} onDeleteProduct={deleteProduct} onUpdateProduct={updateProduct} onUpdateClient={updateClientData} onLogout={handleLogout} 
            isMobile={isMobile}
            appConfig={appConfig}
            setAppConfig={setAppConfig}
        />;
}

// --- TELAS ---
function LandingPage({ onSelectMode, config }: { onSelectMode: (m: UserType, id?: string) => void, config: AppConfig }) {
  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="z-10 text-center space-y-8 max-w-md w-full animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="flex justify-center scale-125 mb-4"><BrandLogo size="large" config={config} /></div>
        <div className="space-y-3">
          <button onClick={() => onSelectMode('admin')} className="w-full group relative flex items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-2xl transition-all hover:border-amber-500/50 hover:bg-slate-800">
            <div className="flex items-center gap-4"><div className="bg-blue-900/30 p-3 rounded-xl text-blue-400"><TrendingUp size={20}/></div><div className="text-left"><span className="block font-bold text-white text-lg">Sou Gerente</span><span className="text-xs text-slate-400">Painel Administrativo</span></div></div><ChevronRight className="text-slate-500 group-hover:text-white transition-colors" />
          </button>
          <button onClick={() => onSelectMode('driver', 'select')} className="w-full group relative flex items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-2xl transition-all hover:border-emerald-500/50 hover:bg-slate-800">
              <div className="flex items-center gap-4"><div className="bg-emerald-900/30 p-3 rounded-xl text-emerald-400"><Bike size={20}/></div><div className="text-left"><span className="block font-bold text-white text-lg">Sou Motoboy</span><span className="text-xs text-slate-400">App de Entregas</span></div></div><ChevronRight className="text-slate-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
      <p className="absolute bottom-6 text-slate-600 text-xs">Versão 17.0 (App Moto Pro) • {config.appName}</p>
    </div>
  );
}

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
        <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
           <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-800">
               <div className="text-center mb-6">
                   <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-slate-800 shadow-md overflow-hidden relative">
                       <img src={driver?.avatar} className="w-full h-full object-cover" />
                   </div>
                   <h3 className="font-bold text-xl text-white">Olá, {driver?.name}!</h3>
               </div>
               <form onSubmit={handleLogin} className="space-y-4">
                   <input type="password" autoFocus className="w-full border-2 border-slate-700 bg-slate-950 rounded-xl p-3 text-center text-lg font-normal text-white outline-none focus:border-amber-500" placeholder="Senha" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} />
                   {error && <p className="text-red-500 text-sm text-center font-bold animate-pulse">{error}</p>}
                   <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors">Acessar Painel</button>
               </form>
               <button onClick={() => setSelectedId(null)} className="w-full mt-4 text-slate-500 text-sm hover:text-amber-500 transition-colors">← Voltar</button>
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
              <img src={d.avatar} className="w-10 h-10 rounded-full bg-slate-800 shadow-sm object-cover"/>
              <div className="text-left flex-1"><span className="font-bold text-slate-200 block">{d.name}</span><span className="text-xs text-slate-500 uppercase font-semibold">{d.vehicle}</span></div>
            </button>
          ))}
        </div>
        <button onClick={onBack} className="mt-6 w-full py-3 text-slate-500 text-sm hover:bg-slate-800 rounded-xl font-medium transition-colors">Voltar</button>
      </div>
    </div>
  )
}

function DriverApp({ driver, orders, onToggleStatus, onAcceptOrder, onCompleteOrder, onLogout }: any) {
  const [activeTab, setActiveTab] = useState<'home' | 'wallet'>('home');
  const [historyFilter, setHistoryFilter] = useState<'today' | 'all'>('today');
  const [visibleItems, setVisibleItems] = useState(20);

  // NOVO: Inclui corridas de hoje já completadas na lista 'home' para conferência
  const todaysOrders = useMemo(() => {
     return orders.filter((o: Order) => 
        o.driverId === driver.id && 
        (o.status === 'assigned' || o.status === 'delivering' || (o.status === 'completed' && isToday(o.completedAt)))
     ).sort((a: Order, b: Order) => {
         // Ordena: Pendentes primeiro, depois completadas (mais recentes primeiro)
         if (a.status !== 'completed' && b.status === 'completed') return -1;
         if (a.status === 'completed' && b.status !== 'completed') return 1;
         return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
     });
  }, [orders, driver.id]);
  
  // UseMemo para evitar re-cálculos pesados a cada render
  const allDeliveries = useMemo(() => {
     return orders.filter((o: Order) => o.status === 'completed' && o.driverId === driver.id)
            .sort((a: Order, b: Order) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
  }, [orders, driver.id]);

  // Lista filtrada (Hoje vs Todos)
  const displayedDeliveries = useMemo(() => {
      let filtered = allDeliveries;
      if (historyFilter === 'today') {
          filtered = filtered.filter((o: Order) => isToday(o.completedAt));
      }
      return filtered;
  }, [allDeliveries, historyFilter]);

  // Lista paginada
  const visibleDeliveries = displayedDeliveries.slice(0, visibleItems);

  // Totais (Sempre calculados sobre o TODO para os cards)
  const totalEarnings = allDeliveries.length * TAXA_ENTREGA;
  const todayEarnings = allDeliveries.filter((o:Order) => isToday(o.completedAt)).length * TAXA_ENTREGA;
  const todayCount = allDeliveries.filter((o:Order) => isToday(o.completedAt)).length;
  const totalCount = allDeliveries.length;

  return (
    <div className="bg-slate-950 min-h-screen w-screen flex flex-col">
      <div className="bg-slate-900 p-5 pb-10 rounded-b-[2rem] shadow-xl relative z-10 border-b border-slate-800">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <img src={driver.avatar} className="w-14 h-14 rounded-full border-2 border-slate-700 bg-slate-800 object-cover" />
            <div><h2 className="font-bold text-lg text-white">{driver.name}</h2><div className="flex items-center gap-2 text-slate-400 text-xs font-medium bg-slate-950 px-2 py-0.5 rounded-full w-fit"><span>{driver.plate}</span></div></div>
          </div>
          <button onClick={onLogout} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-white transition-colors"><LogOut size={18}/></button>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-lg">
           <button onClick={() => setActiveTab('home')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab==='home' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Bike size={14}/> Entregas</button>
           <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab==='wallet' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><History size={14}/> Extrato</button>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-6 pb-4 overflow-y-auto z-20 custom-scrollbar">
        {activeTab === 'home' ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border shadow-lg flex items-center justify-between transition-all ${driver.status === 'offline' ? 'bg-slate-900 border-slate-800' : 'bg-emerald-900/20 border-emerald-800'}`}>
               <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Status</p><span className={`font-bold text-sm ${driver.status === 'offline' ? 'text-slate-300' : 'text-emerald-400'}`}>{driver.status === 'offline' ? 'Você está Offline' : 'Online e Disponível'}</span></div>
               <button onClick={onToggleStatus} className={`px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 ${driver.status === 'offline' ? 'bg-emerald-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300'}`}>{driver.status === 'offline' ? 'Ficar Online' : 'Pausar'}</button>
            </div>
            
            {driver.status !== 'offline' && todaysOrders.map((order: Order) => (
                <div key={order.id} className={`rounded-2xl shadow-xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500 ${order.status === 'completed' ? 'bg-slate-900 border-slate-800 opacity-70 grayscale-[0.5]' : 'bg-slate-900 border-slate-700'}`}>
                    <div className={`p-4 border-b flex justify-between items-center ${order.status === 'completed' ? 'bg-slate-950 border-slate-800' : 'bg-amber-900/20 border-slate-800'}`}>
                       <div>
                           {order.status === 'completed' ? (
                               <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded-full mb-1"><CheckCircle2 size={10}/> ENTREGUE</span>
                           ) : (
                               <span className="inline-block text-[10px] font-bold text-white bg-amber-600 px-2 py-0.5 rounded-full mb-1">EM ROTA</span>
                           )}
                           <h3 className={`font-bold text-lg leading-tight ${order.status === 'completed' ? 'text-slate-400' : 'text-white'}`}>{order.customer}</h3>
                        </div>
                       <div className="text-right"><p className="text-[10px] text-slate-400 font-bold uppercase">A cobrar</p><p className={`font-extrabold text-xl ${order.status==='completed'?'text-slate-500':'text-white'}`}>{order.amount}</p></div>
                    </div>
                    {order.status === 'assigned' ? (
                        <div className="p-8 text-center space-y-4">
                            <h3 className="text-xl font-bold text-white mb-1">Nova entrega!</h3>
                            <button onClick={() => onAcceptOrder(order.id)} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-4 rounded-xl shadow-lg transition-transform active:scale-95">ACEITAR</button>
                        </div>
                    ) : order.status === 'delivering' ? (
                        <div className="p-5 space-y-4">
                          <div>
                             <div className="flex items-start gap-3 mb-2"><MapPin size={20} className="text-amber-500"/><p className="text-base text-slate-200 font-medium leading-snug">{order.address}</p></div>
                             <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => window.open(order.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`, '_blank')} className="flex flex-col items-center justify-center gap-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-transform"><Navigation size={20}/> GPS</button>
                                <button onClick={() => window.open(`https://wa.me/55${order.phone.replace(/\D/g, '')}`, '_blank')} className="flex flex-col items-center justify-center gap-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-transform"><MessageCircle size={20}/> WhatsApp</button>
                             </div>
                          </div>
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                             <div><p className="text-[10px] text-slate-500 font-bold uppercase">Itens</p><p className="text-slate-300 font-medium text-sm">{order.items}</p></div>
                             {order.paymentMethod && <div className="flex items-center gap-2 pt-2 border-t border-slate-800"><DollarSign size={14} className="text-slate-500"/><span className="text-sm font-bold text-slate-300">Pag: {order.paymentMethod}</span></div>}
                          </div>
                          <button onClick={() => onCompleteOrder(order.id, driver.id)} className="w-full bg-slate-800 border border-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-base shadow-xl active:scale-95 transition-transform hover:bg-slate-700"><CheckSquare size={20} className="text-emerald-400"/> Finalizar</button>
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-950 text-center">
                            <p className="text-xs text-slate-500">Corrida finalizada às {formatTime(order.completedAt)}</p>
                        </div>
                    )}
                </div>
            ))}
            
            {driver.status !== 'offline' && todaysOrders.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    <p>Nenhuma entrega hoje.</p>
                </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 pt-2 pb-10">
             {/* Cards de Gamificação/Resumo Interativos */}
             <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => { setHistoryFilter('today'); setVisibleItems(20); }} className={`bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-xl border text-left transition-all active:scale-95 ${historyFilter === 'today' ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-700'}`}>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Hoje ({todayCount})</p>
                    <h3 className="text-2xl font-bold text-white">R$ {todayEarnings.toFixed(2)}</h3>
                 </button>
                 <button onClick={() => { setHistoryFilter('all'); setVisibleItems(20); }} className={`bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-xl border text-left transition-all active:scale-95 ${historyFilter === 'all' ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-700'}`}>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Total ({totalCount})</p>
                    <h3 className="text-2xl font-bold text-emerald-400">R$ {totalEarnings.toFixed(2)}</h3>
                 </button>
             </div>

             {/* Histórico Detalhado */}
             <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2"><History size={16}/> {historyFilter === 'today' ? 'Corridas de Hoje' : 'Histórico Geral'}</span>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">{displayedDeliveries.length} entregas</span>
                </h3>
                <div className="space-y-3">
                    {visibleDeliveries.length === 0 ? (
                        <div className="text-center py-10 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded-xl">Nenhuma entrega encontrada neste período.</div>
                    ) : (
                        visibleDeliveries.map((order: Order) => (
                            <div key={order.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex-1 min-w-0 mr-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar size={12} className="text-slate-500"/>
                                        <span className="text-[10px] font-bold text-slate-400">{formatDate(order.completedAt)} • {formatTime(order.completedAt)}</span>
                                    </div>
                                    {/* AQUI ESTÁ A CORREÇÃO: Nome do Cliente e Endereço abaixo */}
                                    <p className="text-sm font-bold text-white truncate">{order.customer}</p>
                                    <p className="text-xs text-slate-400 truncate">{order.address}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] text-slate-500 font-bold uppercase">Taxa</span>
                                    <span className="text-emerald-400 font-bold">+ {formatCurrency(TAXA_ENTREGA)}</span>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Botão Carregar Mais */}
                    {displayedDeliveries.length > visibleItems && (
                        <button 
                            onClick={() => setVisibleItems(prev => prev + 20)}
                            className="w-full py-3 mt-4 text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <ChevronDown size={14}/> Carregar mais antigas
                        </button>
                    )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminPanel(props: any) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
      try { return !!localStorage.getItem('jhans_admin_auth'); } catch { return false; }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault(); 
      if (password === 'admin') { 
          try { localStorage.setItem('jhans_admin_auth', 'true'); } catch(e) {}
          setIsAuthenticated(true);
      } else { 
          setError('Senha incorreta!');
          setTimeout(() => setError(''), 2000);
      } 
  };
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-3xl p-10 w-full max-w-sm shadow-2xl border border-slate-800">
          <div className="text-center mb-8"><BrandLogo dark size="normal" config={props.appConfig} /><h2 className="text-2xl font-bold text-white mt-4">Acesso Restrito</h2></div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" autoFocus className="w-full p-4 border-2 border-slate-700 bg-slate-950 rounded-2xl outline-none text-center text-white placeholder-slate-600 focus:border-amber-500 transition-colors" placeholder="Senha" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} />
            {error && <p className="text-red-500 text-center font-bold text-sm animate-pulse">{error}</p>}
            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-amber-900/20">Entrar</button>
          </form>
          <button onClick={props.onLogout} className="w-full mt-6 text-slate-500 text-sm hover:text-slate-300">Voltar</button>
        </div>
      </div>
    )
  }
  return <Dashboard {...props} />;
}

function Dashboard({ drivers, orders, vales, expenses, products, clients, onAssignOrder, onCreateDriver, onUpdateDriver, onDeleteDriver, onDeleteOrder, onCreateOrder, onUpdateOrder, onCreateVale, onCreateExpense, onCreateProduct, onUpdateProduct, onDeleteProduct, onUpdateClient, onLogout, isMobile, appConfig, setAppConfig }: any) {
  const [view, setView] = useState<'map' | 'list' | 'history' | 'menu' | 'clients' | 'daily'>('map');
  const [modal, setModal] = useState<'driver' | 'order' | 'vale' | 'import' | 'product' | 'expense' | 'client' | 'settings' | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [driverReportId, setDriverReportId] = useState<string | null>(null);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null); 
  const [driverSidebarTab, setDriverSidebarTab] = useState<'assign' | 'history' | 'finance'>('assign');

  // FIX: Adicionando as variáveis que faltavam para a sidebar do motorista
  const selectedDriverOrders = useMemo(() => {
    if (!selectedDriver) return [];
    return orders.filter((o: Order) => o.driverId === selectedDriver.id && o.status === 'completed')
      .sort((a: Order, b: Order) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
  }, [orders, selectedDriver]);

  const driverFinancials = useMemo(() => {
    if (!selectedDriver) return { total: 0, vales: 0, net: 0, valeList: [] };
    const myDeliveriesCount = orders.filter((o: Order) => o.driverId === selectedDriver.id && o.status === 'completed').length;
    const totalEarnings = myDeliveriesCount * TAXA_ENTREGA;
    
    const myVales = vales.filter((v: Vale) => v.driverId === selectedDriver.id);
    const totalVales = myVales.reduce((acc: number, v: Vale) => acc + (Number(v.amount) || 0), 0);

    return {
        total: totalEarnings,
        vales: totalVales,
        net: totalEarnings - totalVales,
        valeList: myVales
    };
  }, [orders, vales, selectedDriver]);

  const delivered = orders.filter((o: Order) => o.status === 'completed');
  const sortedHistory = [...delivered].sort((a: Order, b: Order) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));

  const finance = useMemo(() => {
     const totalIncome = delivered.reduce((acc: number, order: Order) => acc + (order.value || 0), 0);
     const todayIncome = delivered.filter((o: Order) => isToday(o.completedAt)).reduce((acc: number, order: Order) => acc + (order.value || 0), 0);
     const totalExpenses = expenses.reduce((acc: number, e: Expense) => acc + (e.amount || 0), 0);
     const todayExpenses = expenses.filter((e: Expense) => isToday(e.createdAt)).reduce((acc: number, e: Expense) => acc + (e.amount || 0), 0);
     const balance = totalIncome - totalExpenses;
     return { totalIncome, todayIncome, totalExpenses, todayExpenses, balance };
  }, [delivered, expenses]);

  const clientsData = useMemo(() => {
     const ranking = new Map();
     delivered.forEach((order: Order) => {
        const phoneKey = normalizePhone(order.phone);
        if (!phoneKey) return;
        const current = ranking.get(phoneKey) || { 
            id: phoneKey,
            name: order.customer, 
            phone: order.phone, 
            address: order.address,
            count: 0, 
            totalSpent: 0 
        };
        ranking.set(phoneKey, { 
            ...current, 
            count: current.count + 1, 
            totalSpent: current.totalSpent + (order.value || 0) 
        });
     });
     
     clients.forEach((c: Client) => {
         const k = normalizePhone(c.phone);
         if(ranking.has(k)) {
             const exist = ranking.get(k);
             // IMPORTANTE: Garantir que o ID real seja preservado
             ranking.set(k, { ...exist, id: c.id, name: c.name, address: c.address, obs: c.obs, mapsLink: c.mapsLink });
         } else {
             // Fallback: Se não tiver ID (raro), usa o telefone como ID
             ranking.set(k, { id: c.id || k, name: c.name, phone: c.phone, address: c.address, obs: c.obs, mapsLink: c.mapsLink, count: 0, totalSpent: 0 });
         }
     });

     return Array.from(ranking.values())
        .sort((a: any, b: any) => b.count - a.count); 
  }, [clients, delivered]);

  // DAILY ORDERS DATA
  const dailyOrdersData = useMemo(() => {
      const todayOrders = orders.filter((o: Order) => isToday(o.createdAt));
      // Ordenar por hora (decrescente ou crescente, aqui farei decrescente para ver os mais recentes primeiro)
      todayOrders.sort((a: Order, b: Order) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      const totalOrders = todayOrders.length;
      const totalValue = todayOrders.reduce((acc: number, o: Order) => acc + (o.value || 0), 0);
      
      return { todayOrders, totalOrders, totalValue };
  }, [orders]);

  const [searchTerm, setSearchTerm] = useState('');
  const filteredClients = clientsData.filter((c: any) => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm)
  );

  // PAGINAÇÃO CLIENTES
  const [visibleClientsCount, setVisibleClientsCount] = useState(30);
  const visibleClients = filteredClients.slice(0, visibleClientsCount);

  const trackDriver = (driver: Driver) => {
      if (driver.lat && driver.lng) {
          const url = `https://www.google.com/maps/search/?api=1&query=${driver.lat},${driver.lng}`;
          window.open(url, '_blank');
      } else {
          alert("Aguardando sinal de GPS...");
      }
  };

  const copyReport = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    let text = `🛵 *RELATÓRIO DE ENTREGAS - ${appConfig.appName.toUpperCase()}*\n📅 Data: ${today}\n--- ENTREGAS ---\n\n`;
    sortedHistory.forEach((o: Order, i: number) => {
       const driverName = drivers.find((d: Driver) => d.id === o.driverId)?.name || 'Não identificado';
       text += `✅ ENTREGA ${sortedHistory.length - i} (${o.paymentMethod || 'PAGO'})\n`;
       text += `🏍 Entregador: ${driverName}\n`;
       text += `👤 Cliente: ${o.customer}\n`;
       text += `📞 Telefone: ${o.phone}\n`;
       text += `🏠 Endereço: ${o.address}\n`;
       text += `💵 Valor: ${o.amount}\n\n`;
    });
    copyToClipboard(text);
  };

  const handleImportCSV = async (csvText: string) => {
      if (!csvText) return;
      const dbBatch = writeBatch(db);
      let operations = 0;
      
      const lines = csvText.split('\n');
      lines.slice(1).forEach((line) => {
          if (!line.trim()) return;
          
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          const cols = matches.map(c => c.replace(/^"|"$/g, ''));

          // Usando desestruturação com "buracos" para ignorar variáveis não usadas
          // forn (idx 7), cond (idx 8), cid (idx 9), cpf (idx 11) removidos/ignorados
          if (cols.length >= 15) {
             const [id, date, time, desc, valStr, type, cat, , , , clientName, , phone, addr, mapLink] = cols;
             
             const val = parseFloat(valStr);
             if (isNaN(val)) return;
             
             const timestamp = new Date(`${date}T${time || '12:00'}`);
             
             if (type === 'income') {
                 const orderId = id || 'ord_' + Date.now() + Math.random();
                 const orderRef = doc(db, 'orders', orderId);
                 dbBatch.set(orderRef, {
                     customer: capitalize(clientName),
                     phone: phone || '',
                     address: capitalize(addr) || '',
                     mapsLink: mapLink || '',
                     items: desc,
                     amount: formatCurrency(val),
                     value: val,
                     status: 'completed',
                     completedAt: Timestamp.fromDate(timestamp),
                     createdAt: Timestamp.fromDate(timestamp),
                     origin: 'manual'
                 });

                 const cleanPhone = normalizePhone(phone);
                 if (cleanPhone) {
                     const clientRef = doc(db, 'clients', cleanPhone);
                     dbBatch.set(clientRef, {
                         name: capitalize(clientName),
                         phone: phone,
                         address: capitalize(addr) || '',
                         mapsLink: mapLink || '',
                         lastOrderAt: Timestamp.fromDate(timestamp)
                     }, { merge: true });
                 }
                 operations++;

             } else if (type === 'expense') {
                 const expenseId = id || 'exp_' + Date.now() + Math.random();
                 const expRef = doc(db, 'expenses', expenseId);
                 dbBatch.set(expRef, {
                     description: capitalize(desc),
                     amount: val,
                     category: cat || 'outros',
                     createdAt: Timestamp.fromDate(timestamp)
                 });
                 operations++;
             }
          }
      });

      if (operations > 0) {
          try {
              await dbBatch.commit();
              alert(`${operations} registros importados e processados!`);
          } catch(e) {
              console.error(e);
              alert("Erro ao salvar no banco de dados. Tente importar em partes menores.");
          }
      } else {
          alert("Nenhum dado válido encontrado no arquivo.");
      }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
      <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col z-20 shadow-2xl h-full border-r border-slate-800">
        <div className="p-8 border-b border-slate-800"><BrandLogo size="normal" config={appConfig} /></div>
        <nav className="flex-1 p-6 space-y-3">
          <SidebarBtn icon={<LayoutDashboard/>} label="Monitoramento" active={view==='map'} onClick={()=>setView('map')}/>
          <SidebarBtn icon={<Users/>} label="Equipe" active={view==='list'} onClick={()=>setView('list')}/>
          <div className="h-px bg-slate-800 my-6 mx-2"></div>
          <SidebarBtn icon={<Plus/>} label="Novo Pedido" onClick={()=>setModal('order')} highlight/>
          <SidebarBtn icon={<ClipboardList/>} label="Pedidos do Dia" active={view==='daily'} onClick={()=>setView('daily')}/>
          <SidebarBtn icon={<ShoppingBag/>} label="Cardápio Digital" active={view==='menu'} onClick={()=>setView('menu')}/>
          <SidebarBtn icon={<Trophy/>} label="Clientes" active={view==='clients'} onClick={()=>setView('clients')}/>
          <SidebarBtn icon={<Clock/>} label="Financeiro" active={view==='history'} onClick={()=>setView('history')}/>
        </nav>
        <div className="p-6 space-y-2">
            <button onClick={() => setModal('settings')} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-slate-400 font-bold hover:text-white transition-colors hover:bg-slate-800"><Settings size={20}/> Config</button>
            <button onClick={onLogout} className="w-full p-4 bg-slate-800 rounded-2xl flex items-center justify-center gap-3 text-slate-400 font-bold hover:text-white transition-colors"><LogOut size={20}/> Sair</button>
        </div>
      </aside>

      {/* BARRA DE NAVEGAÇÃO MOBILE (AJUSTADA) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md text-white z-50 border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <div className="relative flex justify-between items-center px-6 pb-4 pt-2">
              
              {/* Botão Central Flutuante (FAB) */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-8">
                  <button onClick={()=>setModal('order')} className="bg-gradient-to-br from-orange-500 to-red-600 rounded-full p-4 shadow-xl border-4 border-slate-950 text-white transform active:scale-95 transition-transform">
                      <Plus size={32}/>
                  </button>
              </div>

              {/* Lado Esquerdo */}
              <div className="flex gap-6">
                  <button onClick={()=>setView('map')} className={`flex flex-col items-center gap-1 ${view==='map'?'text-orange-500':'text-slate-400'}`}><MapPin size={22}/><span className="text-[9px] font-bold">Mapa</span></button>
                  <button onClick={()=>setView('daily')} className={`flex flex-col items-center gap-1 ${view==='daily'?'text-orange-500':'text-slate-400'}`}><ClipboardList size={22}/><span className="text-[9px] font-bold">Dia</span></button>
              </div>

              {/* Espaçador Central */}
              <div className="w-12"></div>

              {/* Lado Direito */}
              <div className="flex gap-6">
                  <button onClick={()=>setView('clients')} className={`flex flex-col items-center gap-1 ${view==='clients'?'text-orange-500':'text-slate-400'}`}><Users size={22}/><span className="text-[9px] font-bold">Clientes</span></button>
                  <button onClick={()=>setView('history')} className={`flex flex-col items-center gap-1 ${view==='history'?'text-orange-500':'text-slate-400'}`}><Clock size={22}/><span className="text-[9px] font-bold">Caixa</span></button>
              </div>
          </div>
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden w-full h-full">
        <header className="h-16 md:h-20 bg-slate-900 border-b border-slate-800 px-4 md:px-10 flex items-center justify-between shadow-sm z-10 w-full">
           <div className="flex items-center gap-3 overflow-hidden">
               {appConfig.appLogoUrl && <img src={appConfig.appLogoUrl} className="w-8 h-8 rounded-full md:hidden object-cover" />}
               <h1 className="text-lg md:text-2xl font-extrabold text-white tracking-tight truncate flex-1 min-w-0">
                   {view === 'map' ? 'Visão Geral' : view === 'list' ? 'Gestão de Equipe' : view === 'menu' ? 'Cardápio Digital' : view === 'clients' ? 'Gestão de Clientes' : view === 'daily' ? 'Pedidos do Dia' : 'Financeiro & Relatórios'}
               </h1>
           </div>
           
           {/* Botões do Topo (Mobile: Config e Sair) */}
           <div className="flex items-center gap-2">
               <button onClick={() => setModal('settings')} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-xl">
                   <Settings size={20}/>
               </button>
               <button onClick={onLogout} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-xl">
                   <LogOut size={20}/>
               </button>
           </div>
        </header>

        <div className="flex-1 overflow-hidden relative w-full h-full">
          {view === 'map' && (
             <div className="absolute inset-0 city-map-bg overflow-hidden w-full h-full">
                
                {/* DICAS DE LOCALIZAÇÃO / MARCA D'ÁGUA NO FUNDO */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10 select-none p-4 z-0">
                    {appConfig.appLogoUrl ? (
                        <img src={appConfig.appLogoUrl} className="w-32 h-32 md:w-48 md:h-48 object-contain mb-4 opacity-20 grayscale" />
                    ) : null}
                    <span className="text-slate-200 font-black text-5xl md:text-9xl text-center leading-none tracking-tighter opacity-10">{appConfig.appName.toUpperCase()}</span>
                    <span className="text-slate-200 font-bold text-xl md:text-4xl tracking-widest mt-2 uppercase opacity-10">DELIVERY SYSTEM</span>
                </div>

                {/* MOTOS NO MAPA COM ANIMAÇÃO NAS RUAS */}
                <div className="w-full h-full relative z-10">
                    {drivers.map((d: Driver, index: number) => {
                       const seed = d.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                       
                       const maxCols = isMobile ? 4 : 12;
                       const maxRows = isMobile ? 6 : 8;

                       // Ajuste Fino para Grade de Ruas (80px box, 4px line)
                       // Centralizar na linha: (Index * 80) - Offset
                       const gridX = (Math.floor(seed * 17) % maxCols) * 80 - 12; 
                       const gridY = (Math.floor(seed * 23) % maxRows) * 80 - 12; 
                       
                       const animType = index % 3 === 0 ? 'animate-drive-x' : index % 3 === 1 ? 'animate-drive-y' : 'animate-drive-l';
                       const colorStatus = d.status === 'delivering' ? 'border-amber-500' : d.status === 'offline' ? 'border-slate-500' : 'border-emerald-500';
                       const glowStatus = d.status === 'delivering' ? 'headlight' : '';

                       return (
                           <div key={d.id} 
                                onClick={(e) => { e.stopPropagation(); setSelectedDriver(d); }} 
                                className={`absolute z-30 cursor-pointer transition-transform duration-1000 ${animType}`}
                                style={{ top: `${gridY + 80}px`, left: `${gridX + 80}px` }}>
                              
                              <div className="relative group flex flex-col items-center">
                                 {/* FOTO DO MOTOBOY NO MAPA */}
                                 <div className={`relative bg-slate-900 p-0.5 rounded-full border-2 ${colorStatus} shadow-xl ${glowStatus} transform transition-all active:scale-95 overflow-hidden w-10 h-10`}>
                                     {d.avatar ? (
                                         <img src={d.avatar} className="w-full h-full object-cover rounded-full" alt={d.name} />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center bg-slate-800"><Bike size={20} className="text-white"/></div>
                                     )}
                                     
                                     {/* Bolinha de status */}
                                     <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${d.status === 'delivering' ? 'bg-amber-500 animate-pulse' : d.status === 'available' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                 </div>
                                 <div className="mt-1 bg-black/80 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap transition-opacity">
                                     {d.name.split(' ')[0]}
                                 </div>
                              </div>
                           </div>
                       )
                    })}
                </div>
                
                {/* LISTA DE PEDIDOS PENDENTES */}
                <div className="absolute top-6 left-6 z-40 space-y-3 max-h-[60%] overflow-y-auto w-72 pr-2 custom-scrollbar">
                   {orders.filter((o: Order) => o.status === 'pending').map((o: Order) => (
                      <div key={o.id} className="bg-slate-900/90 backdrop-blur-md p-3 rounded-xl shadow-2xl border-l-4 border-amber-500 relative group animate-in slide-in-from-left-4 duration-300">
                         <div className="flex justify-between items-start mb-1"><span className="font-bold text-sm text-white truncate w-32">{o.customer}</span><span className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded text-slate-400">{o.time}</span></div>
                         <p className="text-xs text-slate-400 truncate mb-2">{o.address}</p>
                         <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-emerald-400">{o.amount}</span>
                             <div className="flex gap-1">
                                {o.serviceType === 'pickup' && <span className="bg-purple-900/50 text-purple-400 px-1 rounded text-[10px] font-bold">Retira</span>}
                             </div>
                         </div>
                         <button onClick={() => onDeleteOrder(o.id)} className="absolute -right-2 -top-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"><Trash2 size={12}/></button>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {view === 'list' && (
             <div className="flex-1 bg-slate-950 p-6 md:p-10 overflow-y-auto w-full h-full pb-40 md:pb-8 custom-scrollbar">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="font-bold text-2xl text-white">Frota Ativa ({drivers.length})</h2>
                   <button onClick={()=>setModal('driver')} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex gap-2 shadow-lg hover:scale-105 transition-all"><Plus size={18}/> Cadastrar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {drivers.map((d: Driver) => (
                      <div key={d.id} className="border border-slate-800 p-5 rounded-2xl bg-slate-900 relative group cursor-pointer hover:border-amber-500/50 transition-colors" onClick={()=>setSelectedDriver(d)}>
                         <div className="flex items-center gap-5">
                            <img src={d.avatar} className="w-16 h-16 rounded-full bg-slate-800 object-cover border-2 border-slate-700"/>
                            <div>
                               <h3 className="font-bold text-lg text-white">{d.name}</h3>
                               <div className="flex gap-2">
                                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide ${d.status==='offline'?'bg-slate-800 text-slate-500':d.status==='available'?'bg-emerald-900/30 text-emerald-400':'bg-orange-900/30 text-orange-400'}`}>{d.status}</span>
                                  <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase bg-slate-800 text-slate-400">{d.vehicle || 'Moto'}</span>
                               </div>
                            </div>
                         </div>
                         <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e)=>{e.stopPropagation(); setDriverReportId(d.id)}} className="p-2 bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/40 transition-colors"><Wallet size={18}/></button>
                            <button onClick={(e)=>{e.stopPropagation(); setDriverToEdit(d); setModal('driver');}} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 transition-colors"><Edit size={18}/></button>
                            <button onClick={(e)=>{e.stopPropagation(); onDeleteDriver(d.id)}} className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"><Trash2 size={18}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {view === 'daily' && (
              <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto w-full h-full pb-40 md:pb-8 custom-scrollbar">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">Controle Diário</h2>
                      <p className="text-sm text-slate-500">{new Date().toLocaleDateString('pt-BR')}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <StatBox label="Pedidos Hoje" value={dailyOrdersData.totalOrders} icon={<ClipboardList/>} color="bg-blue-900/20 text-blue-400 border-blue-900/50"/>
                      <StatBox label="Faturamento Dia" value={formatCurrency(dailyOrdersData.totalValue)} icon={<DollarSign/>} color="bg-emerald-900/20 text-emerald-400 border-emerald-900/50"/>
                  </div>

                  <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-slate-400">
                              <thead className="bg-slate-950 text-slate-200 font-bold uppercase tracking-wider border-b border-slate-800">
                                  <tr>
                                      <th className="p-4">Hora</th>
                                      <th className="p-4">Status</th>
                                      <th className="p-4">Cliente</th>
                                      <th className="p-4 hidden md:table-cell">Endereço</th>
                                      <th className="p-4 hidden md:table-cell">Itens</th>
                                      <th className="p-4 text-right">Valor</th>
                                      <th className="p-4 hidden md:table-cell">Pagamento</th>
                                      <th className="p-4 hidden md:table-cell">Entregador</th>
                                      <th className="p-4 text-center">Ação</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                  {dailyOrdersData.todayOrders.map((o: Order) => {
                                      const driverName = drivers.find((d: Driver) => d.id === o.driverId)?.name || '-';
                                      return (
                                          <tr key={o.id} className="hover:bg-slate-800/50 transition-colors">
                                              <td className="p-4 font-bold text-white">{formatTime(o.createdAt)}</td>
                                              <td className="p-4">
                                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                      o.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' :
                                                      o.status === 'pending' ? 'bg-red-900/30 text-red-400' :
                                                      'bg-blue-900/30 text-blue-400'
                                                  }`}>
                                                      {o.status === 'completed' ? 'Entregue' : o.status === 'pending' ? 'Pendente' : 'Em Rota'}
                                                  </span>
                                              </td>
                                              <td className="p-4 font-medium text-slate-300">{o.customer}</td>
                                              <td className="p-4 hidden md:table-cell truncate max-w-xs" title={o.address}>{o.address}</td>
                                              <td className="p-4 hidden md:table-cell truncate max-w-xs" title={o.items}>{o.items}</td>
                                              <td className="p-4 text-right text-emerald-400 font-bold">{o.amount}</td>
                                              <td className="p-4 hidden md:table-cell">{o.paymentMethod}</td>
                                              <td className="p-4 hidden md:table-cell">{driverName}</td>
                                              <td className="p-4 text-center">
                                                  <button onClick={(e) => { e.stopPropagation(); onDeleteOrder(o.id); }} className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-800 rounded-lg transition-colors" title="Excluir Pedido">
                                                      <Trash2 size={16}/>
                                                  </button>
                                              </td>
                                          </tr>
                                      )
                                  })}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}
        
        {view === 'history' && (
             <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto w-full h-full pb-40 md:pb-8 custom-scrollbar">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div><h3 className="font-bold text-2xl text-slate-200">Fluxo de Caixa</h3></div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setModal('expense')} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-md"><MinusIcon size={18}/> Lançar Custo</button>
                        <button onClick={copyReport} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md"><ClipboardCopy size={18}/> Relatório</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                   <StatBox label="Saldo Atual" value={formatCurrency(finance.balance)} subtext="Caixa Real" icon={<Wallet/>} color={finance.balance >= 0 ? "bg-emerald-900/20 text-emerald-400 border-emerald-900/50" : "bg-red-900/20 text-red-400 border-red-900/50"}/>
                   <StatBox label="Entrada Hoje" value={formatCurrency(finance.todayIncome)} icon={<TrendingUp/>} color="bg-blue-900/20 text-blue-400 border-blue-900/50"/>
                   <StatBox label="Custo Hoje" value={formatCurrency(finance.todayExpenses)} subtext="Insumos" icon={<TrendingDown/>} color="bg-red-900/20 text-red-400 border-red-900/50"/>
                   <StatBox label="Total Geral" value={formatCurrency(finance.totalIncome)} icon={<DollarSign/>} color="bg-slate-900 text-slate-400 border-slate-800"/>
                </div>
             </div>
        )}

        {view === 'clients' && (
             <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto w-full h-full pb-40 md:pb-8 custom-scrollbar">
                 <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                     <div><h2 className="text-2xl font-bold text-white">Gestão de Clientes</h2><p className="text-sm text-slate-500">{clients.length} cadastrados</p></div>
                     <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-3 text-slate-500" size={18}/><input className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-amber-500" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                        <button onClick={() => setModal('import')} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md"><UploadCloud size={18}/></button>
                     </div>
                 </div>

                 {/* TOP 3 CLIENTES */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                     {filteredClients.slice(0, 3).map((client: any, index: number) => (
                         <div key={client.id} className="flex items-center p-4 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-amber-500/50 transition-colors cursor-pointer" onClick={() => { setClientToEdit(client); setModal('client'); }}>
                             <div className={`absolute top-0 left-0 w-1 h-full ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-400' : 'bg-orange-700'}`}></div>
                             <div className="w-12 h-12 flex items-center justify-center bg-slate-950 rounded-full font-bold text-lg text-white mr-4 border border-slate-800">{index + 1}</div>
                             <div className="flex-1">
                                 <h4 className="font-bold text-white text-lg truncate">{client.name}</h4>
                                 <p className="text-sm text-slate-500">{client.totalOrders} pedidos</p>
                             </div>
                             <div className="text-right">
                                 <p className="font-bold text-emerald-400 text-sm">{formatCurrency(client.totalSpent)}</p>
                             </div>
                             <Star className="absolute top-2 right-2 text-yellow-500 opacity-20 rotate-12" size={24} />
                         </div>
                     ))}
                 </div>

                 <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-slate-200 font-bold uppercase tracking-wider border-b border-slate-800">
                            <tr><th className="p-4">Nome</th><th className="p-4 hidden md:table-cell">Telefone</th><th className="p-4 hidden md:table-cell">Endereço</th><th className="p-4 text-right">Total Gasto</th><th className="p-4 text-center">Ação</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {/* PAGINAÇÃO CLIENTES */}
                            {visibleClients.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-bold text-white">{client.name}</td>
                                    <td className="p-4 hidden md:table-cell">{client.phone}</td>
                                    <td className="p-4 hidden md:table-cell truncate max-w-xs">{client.address}</td>
                                    <td className="p-4 text-right text-emerald-400 font-bold">{formatCurrency(client.totalSpent || 0)}</td>
                                    <td className="p-4 text-center"><button onClick={() => { setClientToEdit(client); setModal('client'); }} className="p-2 bg-slate-800 hover:bg-amber-600 hover:text-white rounded-lg transition-colors text-slate-400"><Edit size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* Botão Carregar Mais Clientes */}
                    {filteredClients.length > visibleClientsCount && (
                        <div className="p-4 text-center border-t border-slate-800">
                             <button 
                                onClick={() => setVisibleClientsCount(prev => prev + 30)}
                                className="text-xs font-bold text-slate-500 hover:text-white flex items-center justify-center gap-1 mx-auto"
                             >
                                <ChevronDown size={14}/> Carregar mais clientes
                             </button>
                        </div>
                    )}
                 </div>
             </div>
        )}

        {view === 'menu' && <MenuManager products={products} onCreate={onCreateProduct} onUpdate={onUpdateProduct} onDelete={onDeleteProduct} />}
      </div>
      </main>

      {/* MODAIS */}
      {modal === 'settings' && <SettingsModal config={appConfig} onSave={(newConfig: AppConfig) => { setAppConfig(newConfig); setModal(null); }} onClose={() => setModal(null)} />}
      {modal === 'order' && <NewOrderModal onClose={()=>setModal(null)} onSave={(data: any) => { onCreateOrder(data); setView('map'); }} products={products} clients={clients} />}
      {modal === 'driver' && <NewDriverModal onClose={()=>{setModal(null); setDriverToEdit(null);}} onSave={driverToEdit ? (data: any) => onUpdateDriver(driverToEdit.id, data) : onCreateDriver} initialData={driverToEdit} />}
      {modal === 'vale' && driverToEdit && <NewValeModal driver={driverToEdit} onClose={() => { setModal(null); setDriverToEdit(null); }} onSave={onCreateVale} />}
      {modal === 'import' && <ImportModal onClose={() => setModal(null)} onImportCSV={handleImportCSV} />}
      {modal === 'expense' && <NewExpenseModal onClose={() => setModal(null)} onSave={onCreateExpense} />}
      {modal === 'client' && clientToEdit && <EditClientModal client={clientToEdit} orders={delivered} onClose={() => setModal(null)} onUpdateOrder={updateOrder} onSave={(data: any) => { updateClient(clientToEdit.id, data); setModal(null); }} />}
      {driverReportId && <DriverReportModal driverId={driverReportId} drivers={drivers} orders={orders} vales={vales} onClose={() => setDriverReportId(null)} />}
      
      {/* SIDEBAR DO MOTORISTA SELECIONADO */}
      <aside className={`fixed inset-y-0 right-0 w-full md:w-96 bg-slate-900 shadow-2xl p-0 overflow-y-auto z-[60] transition-transform duration-300 border-l border-slate-800 ${selectedDriver ? 'translate-x-0' : 'translate-x-full'}`}>
             {selectedDriver && (
               <div className="h-full flex flex-col bg-slate-950">
                  <div className="bg-slate-900 p-6 border-b border-slate-800 sticky top-0 z-10">
                      <div className="flex justify-between items-start mb-6"><h3 className="font-bold text-white text-lg">Perfil do Motoboy</h3><button onClick={()=>setSelectedDriver(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button></div>
                      <div className="flex flex-col items-center">
                         <div className="relative mb-3"><img src={selectedDriver.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + selectedDriver.name} className="w-24 h-24 rounded-full border-4 border-slate-800 shadow-lg object-cover"/><span className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white ${selectedDriver.status==='offline'?'bg-slate-400':selectedDriver.status==='available'?'bg-emerald-500':'bg-orange-500'}`}></span></div>
                         <h2 className="font-bold text-2xl text-white">{selectedDriver.name}</h2>
                         <div className="flex items-center gap-2 mt-1"><span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{selectedDriver.plate}</span><span className="text-sm text-slate-500">{selectedDriver.vehicle}</span></div>
                         
                         {/* Navegação de Abas da Sidebar */}
                         <div className="flex w-full mt-6 bg-slate-950 p-1 rounded-xl">
                            <button onClick={() => setDriverSidebarTab('assign')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${driverSidebarTab==='assign'?'bg-slate-800 text-white shadow-md':'text-slate-500 hover:text-slate-300'}`}>Atribuir</button>
                            <button onClick={() => setDriverSidebarTab('history')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${driverSidebarTab==='history'?'bg-slate-800 text-white shadow-md':'text-slate-500 hover:text-slate-300'}`}>Histórico</button>
                            <button onClick={() => setDriverSidebarTab('finance')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${driverSidebarTab==='finance'?'bg-slate-800 text-white shadow-md':'text-slate-500 hover:text-slate-300'}`}>Financeiro</button>
                         </div>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                     {driverSidebarTab === 'assign' && (
                         <div className="space-y-3 pb-20">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">Atribuir Entrega Pendente</h4>
                            {orders.filter((o: Order) => o.status === 'pending').map((o: Order) => (
                               <div key={o.id} onClick={()=>onAssignOrder(o.id, selectedDriver.id)} className="border border-slate-800 p-4 rounded-xl hover:border-orange-500 hover:shadow-md transition-all bg-slate-900 cursor-pointer group">
                                  <div className="flex justify-between items-start mb-2"><span className="font-bold text-white">{o.customer}</span><span className="text-emerald-400 font-extrabold">{o.amount}</span></div>
                                  <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">{o.address}</p>
                                  <button className="w-full bg-slate-800 text-white text-xs font-bold py-3 rounded-lg group-hover:bg-orange-600 transition-colors">Enviar para Motoboy</button>
                               </div>
                            ))}
                            {orders.filter((o: Order) => o.status === 'pending').length === 0 && (
                               <div className="text-center py-10 bg-slate-900 rounded-xl border border-dashed border-slate-800"><Package className="mx-auto text-slate-500 mb-3" size={32}/><p className="text-sm text-slate-500 font-medium">Sem pedidos na fila.</p></div>
                            )}
                         </div>
                     )}

                     {driverSidebarTab === 'history' && (
                         <div className="space-y-3 pb-20">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">Últimas Entregas</h4>
                             {selectedDriverOrders.length === 0 ? (
                                 <div className="text-center py-8 text-slate-600 italic text-sm">Nenhuma entrega realizada.</div>
                             ) : (
                                 selectedDriverOrders.map((o: Order) => (
                                     <div key={o.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                         <div className="flex justify-between mb-1">
                                             <span className="text-xs font-bold text-slate-400">{formatDate(o.completedAt)}</span>
                                             <span className="text-[10px] font-bold bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={10}/> 
                                                {o.assignedAt && o.completedAt 
                                                    ? `${Math.floor((o.completedAt.seconds - o.assignedAt.seconds) / 60)} min`
                                                    : '-'
                                                }
                                             </span>
                                         </div>
                                         {/* AQUI ESTÁ A CORREÇÃO: Nome do cliente em destaque e endereço abaixo */}
                                         <p className="text-sm text-white font-medium truncate mb-1">{o.customer}</p>
                                         <p className="text-xs text-slate-500 truncate">{o.address}</p>
                                     </div>
                                 ))
                             )}
                         </div>
                     )}

                     {driverSidebarTab === 'finance' && (
                         <div className="space-y-6 pb-20">
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                     <p className="text-[10px] uppercase font-bold text-slate-500">Entregas</p>
                                     <p className="text-xl font-bold text-white">{selectedDriverOrders.length}</p>
                                 </div>
                                 <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                     <p className="text-[10px] uppercase font-bold text-slate-500">Produção</p>
                                     <p className="text-xl font-bold text-emerald-400">{formatCurrency(driverFinancials.total)}</p>
                                 </div>
                             </div>

                             <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                 <div className="flex justify-between items-center mb-2">
                                     <span className="text-xs font-bold text-slate-400">Total Vales</span>
                                     <span className="text-sm font-bold text-red-400">- {formatCurrency(driverFinancials.vales)}</span>
                                 </div>
                                 <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                                     <span className="text-sm font-bold text-white">A Pagar</span>
                                     <span className="text-xl font-bold text-emerald-400">{formatCurrency(driverFinancials.net)}</span>
                                 </div>
                             </div>

                             <button onClick={() => { setDriverToEdit(selectedDriver); setModal('vale'); }} className="w-full border border-red-900/50 text-red-500 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-900/20 transition-colors"><MinusCircle size={16} /> Lançar Novo Vale</button>
                             
                             <div>
                                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Histórico de Vales</h4>
                                 {driverFinancials.valeList.length === 0 ? (
                                     <p className="text-center text-slate-600 text-xs italic">Nenhum vale lançado.</p>
                                 ) : (
                                     <div className="space-y-2">
                                         {driverFinancials.valeList.map((v: Vale) => (
                                             <div key={v.id} className="flex justify-between items-center text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
                                                 <span className="text-slate-400">{v.description}</span>
                                                 <span className="text-red-400 font-bold">- {formatCurrency(Number(v.amount))}</span>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                         </div>
                     )}
                  </div>
               </div>
             )}
      </aside>
    </div>
  )
}

// ... MODAIS AUXILIARES ...

function SettingsModal({ config, onSave, onClose }: any) {
    const [form, setForm] = useState(config);
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingImage(true);
            try {
                const compressedBase64 = await compressImage(file);
                setForm({ ...form, appLogoUrl: compressedBase64 });
            } catch (err) {
                console.error("Erro ao processar imagem", err);
                alert("Erro ao processar a imagem. Tente outra.");
            } finally {
                setIsProcessingImage(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-800">
                <h3 className="font-bold text-xl mb-4 text-white flex items-center gap-2"><Settings size={20}/> Configurações do Sistema</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Nome do Sistema / Hamburgueria</label>
                        <input className="w-full border-2 border-slate-700 bg-slate-950 rounded-xl p-3 outline-none font-bold text-white" value={form.appName} onChange={e => setForm({...form, appName: e.target.value})} />
                    </div>
                    
                    {/* Área de Upload / Link da Logo */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Logotipo do Sistema</label>
                        <div className="flex flex-col items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                             {/* Preview da Imagem */}
                             <div className="relative w-20 h-20 rounded-xl border-2 border-slate-700 bg-slate-900 overflow-hidden group">
                                {form.appLogoUrl ? (
                                    <img src={form.appLogoUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600"><Utensils size={24}/></div>
                                )}
                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="text-white" size={24}/>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                            
                            <div className="w-full text-center">
                                <p className="text-[10px] text-slate-500 mb-2">ou cole o link da imagem:</p>
                                <input className="w-full border-b border-slate-700 bg-transparent p-2 text-xs text-slate-300 font-mono outline-none focus:border-amber-500 text-center" placeholder="https://..." value={form.appLogoUrl} onChange={e => setForm({...form, appLogoUrl: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={onClose} className="flex-1 border border-slate-700 rounded-xl py-3 font-bold text-slate-500 hover:bg-slate-800">Cancelar</button>
                        <button onClick={() => onSave(form)} disabled={isProcessingImage} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 font-bold shadow-lg disabled:opacity-50">
                            {isProcessingImage ? 'Processando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MenuManager({ products, onCreate, onUpdate, onDelete }: any) {
    const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Hambúrgueres', description: '' });
    const [customCategory, setCustomCategory] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleCapitalize = (e: any, field: string) => {
        const val = capitalize(e.target.value);
        setNewItem(prev => ({...prev, [field]: val}));
    };

    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        
        const finalCategory = newItem.category === 'new_custom' ? capitalize(customCategory) : newItem.category;
        
        if (!finalCategory) {
            alert("Selecione ou digite uma categoria válida.");
            return;
        }

        const payload = { 
            ...newItem, 
            category: finalCategory,
            price: parseFloat(newItem.price.toString().replace(',', '.')) || 0 
        };

        if (editingId) {
            onUpdate(editingId, payload);
            setEditingId(null);
        } else {
            onCreate(payload);
        }
        
        setNewItem({ name: '', price: '', category: 'Hambúrgueres', description: '' }); 
        setCustomCategory('');
    };

    const handleEdit = (product: Product) => {
        setNewItem({
            name: product.name,
            price: product.price.toFixed(2).replace('.', ','),
            category: product.category,
            description: product.description || ''
        });
        setEditingId(product.id);
        // Rola para o topo para ver o formulário
        document.querySelector('.bg-slate-900')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewItem({ name: '', price: '', category: 'Hambúrgueres', description: '' });
        setCustomCategory('');
    };

    // Lista fixa de categorias padrão + categorias extraídas dos produtos existentes
    const availableCategories = useMemo(() => {
        const fixed = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        const existing = Array.from(new Set(products.map((p: Product) => p.category)));
        // Combina e remove duplicatas
        return Array.from(new Set([...fixed, ...existing]));
    }, [products]);

    // Agrupamento por Categoria com Ordenação Específica
    const sortedGroupedProducts = useMemo(() => {
        const grouped = products.reduce((acc: any, product: Product) => {
            (acc[product.category] = acc[product.category] || []).push(product);
            return acc;
        }, {});

        // Ordem desejada
        const ORDER = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        
        // Ordena as chaves (categorias)
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            const idxA = ORDER.indexOf(a);
            const idxB = ORDER.indexOf(b);
            
            // Se ambos estão na lista fixa, ordena pelo índice
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            // Se A está na lista e B não, A vem primeiro
            if (idxA !== -1) return -1;
            // Se B está na lista e A não, B vem primeiro
            if (idxB !== -1) return 1;
            // Se nenhum está na lista, ordena alfabeticamente
            return a.localeCompare(b);
        });

        // Retorna um array de [categoria, items] ordenado
        return sortedKeys.map(key => ({ category: key, items: grouped[key] }));
    }, [products]);

    return (
        <div className="flex-1 bg-slate-950 p-6 md:p-10 overflow-auto w-full h-full pb-28 md:pb-8">
            <h2 className="font-bold text-2xl text-white mb-6">Cardápio Digital</h2>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-xl">
                <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
                    {editingId ? <Edit size={20} className="text-amber-500"/> : <PlusCircle size={20} className="text-emerald-500"/>} 
                    {editingId ? 'Editar Produto' : 'Adicionar Novo Produto'}
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Nome</label>
                            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-white" placeholder="Ex: X-Bacon" value={newItem.name} onChange={e => handleCapitalize(e, 'name')} required />
                        </div>
                        <div className="w-full md:w-32">
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Preço</label>
                            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-white" placeholder="0,00" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
                        </div>
                        <div className="w-full md:w-48">
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Categoria</label>
                            <select 
                                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-white" 
                                value={newItem.category} 
                                onChange={e => setNewItem({...newItem, category: e.target.value})}
                            >
                              {(availableCategories as string[]).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                <option value="new_custom">+ Nova Categoria...</option>
                            </select>
                        </div>
                    </div>
                    
                    {newItem.category === 'new_custom' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase text-amber-500">Nome da Nova Categoria</label>
                            <input autoFocus className="w-full p-3 bg-slate-950 border border-amber-500/50 rounded-xl outline-none focus:border-amber-500 text-white" placeholder="Digite a nova categoria..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} />
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Descrição / Ingredientes (Opcional)</label>
                        <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-white text-sm" placeholder="Ex: Pão, carne 150g, queijo, bacon..." value={newItem.description} onChange={e => handleCapitalize(e, 'description')} />
                    </div>

                    <div className="flex gap-3 justify-end">
                        {editingId && (
                            <button type="button" onClick={handleCancelEdit} className="px-6 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 transition-colors">Cancelar</button>
                        )}
                        <button className={`w-full md:w-auto px-6 py-3 font-bold rounded-xl shadow-lg transition-colors text-white ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                            {editingId ? 'Atualizar Produto' : 'Salvar Produto'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-8 pb-10">
                {sortedGroupedProducts.map((group: any, index: number) => {
                    // Lógica de Cores Alternadas (Par: Amber/Orange, Ímpar: Purple/Blue)
                    const isEven = index % 2 === 0;
                    const headerColor = isEven ? 'text-amber-500 border-amber-500/30' : 'text-purple-400 border-purple-500/30';
                    const cardBorderHover = isEven ? 'group-hover:border-amber-500/50' : 'group-hover:border-purple-500/50';
                    const priceColor = isEven ? 'text-emerald-400' : 'text-blue-400';

                    return (
                        <div key={group.category}>
                            <h3 className={`text-xl font-bold mb-4 border-b-2 pb-2 uppercase tracking-wider flex items-center gap-2 ${headerColor}`}>
                                {isEven ? <Utensils size={20}/> : <ListPlus size={20}/>}
                                {group.category}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {group.items.map((p: Product) => (
                                    <div key={p.id} className={`border border-slate-800 p-4 rounded-xl shadow-sm bg-slate-900 transition-all relative group flex flex-col justify-between ${cardBorderHover}`}>
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-white text-lg leading-tight">{p.name}</h4>
                                                <p className={`font-extrabold text-lg ${priceColor}`}>{formatCurrency(p.price)}</p>
                                            </div>
                                            {p.description && (
                                                <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-3">{p.description}</p>
                                            )}
                                        </div>
                                        <div className="flex justify-end mt-2 pt-2 border-t border-slate-800/50 gap-2">
                                            <button onClick={() => handleEdit(p)} className="p-2 text-slate-600 hover:text-amber-500 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"><Edit size={14}/> Editar</button>
                                            <button onClick={() => onDelete(p.id)} className="p-2 text-slate-600 hover:text-red-500 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"><Trash2 size={14}/> Excluir</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

function EditClientModal({ client, orders, onClose, onSave, onUpdateOrder }: any) {
    const [form, setForm] = useState({ name: client.name, address: client.address, obs: client.obs || '', mapsLink: client.mapsLink || '' });
    const [tab, setTab] = useState<'info'|'history'>('info');
    const [visibleCount, setVisibleCount] = useState(30);

    const clientOrders = useMemo(() => {
        return orders.filter((o: Order) => normalizePhone(o.phone) === client.id).sort((a: Order, b: Order) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [orders, client]);

    const handleCapitalize = (e: any, field: string) => {
        setForm(prev => ({...prev, [field]: capitalize(e.target.value)}));
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };

    // Função para alterar status de pagamento no histórico
    const togglePaymentStatus = (order: Order) => {
        const newStatus = order.paymentStatus === 'paid' ? 'pending' : 'paid';
        onUpdateOrder(order.id, { paymentStatus: newStatus });
    };

     const updatePaymentMethod = (order: Order, newMethod: string) => {
        onUpdateOrder(order.id, { paymentMethod: newMethod });
    };


    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in zoom-in p-0 border border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-white">{client.name}</h3>
                        <p className="text-slate-400 text-sm">{client.phone}</p>
                    </div>
                    <button onClick={onClose}><X className="text-slate-500"/></button>
                </div>
                
                <div className="flex border-b border-slate-800 px-6">
                    <button onClick={() => setTab('info')} className={`py-3 mr-6 text-sm font-bold border-b-2 transition-colors ${tab==='info' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}>Dados</button>
                    <button onClick={() => setTab('history')} className={`py-3 text-sm font-bold border-b-2 transition-colors ${tab==='history' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}>Histórico de Pedidos ({clientOrders.length})</button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {tab === 'info' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Resumo do Cliente */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Total Gasto</p>
                                    <p className="text-xl text-emerald-400 font-bold">{formatCurrency(client.totalSpent || 0)}</p>
                                </div>
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Total Pedidos</p>
                                    <p className="text-xl text-blue-400 font-bold">{client.count || 0}</p>
                                </div>
                            </div>

                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Nome</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.name} onChange={e=>handleCapitalize(e, 'name')}/></div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Telefone</label>
                                <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 outline-none cursor-not-allowed opacity-50" value={client.phone} disabled />
                            </div>
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Endereço</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.address} onChange={e=>handleCapitalize(e, 'address')}/></div>
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Link Google Maps</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.mapsLink} onChange={e=>setForm({...form, mapsLink: e.target.value})}/></div>
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Observações (Preferências)</label><textarea className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.obs} onChange={e=>handleCapitalize(e, 'obs')}/></div>
                            
                            <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 border border-slate-700 rounded-xl py-3 font-bold text-slate-400 hover:bg-slate-800">Cancelar</button><button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 font-bold shadow-lg">Salvar</button></div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            {clientOrders.length === 0 && <p className="text-center text-slate-500 py-10">Nenhum pedido encontrado.</p>}
                            {clientOrders.slice(0, visibleCount).map((o: Order) => (
                                <div key={o.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-slate-400 text-xs font-bold flex items-center gap-1"><Calendar size={12}/> {formatDate(o.createdAt)}</span>
                                        <span className="text-emerald-400 font-extrabold">{o.amount}</span>
                                    </div>
                                    <p className="text-white text-sm mb-3 font-medium">{o.items}</p>
                                    
                                    {/* Controles de Edição de Histórico */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                                        <button 
                                            onClick={() => togglePaymentStatus(o)} 
                                            className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border transition-all ${
                                                o.paymentStatus === 'pending' 
                                                ? 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40' 
                                                : 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/40'
                                            }`}
                                        >
                                            {o.paymentStatus === 'pending' ? <AlertCircle size={12}/> : <CheckCircle2 size={12}/>}
                                            {o.paymentStatus === 'pending' ? 'PENDENTE' : 'PAGO'}
                                        </button>

                                        <select 
                                            className="bg-slate-900 text-slate-400 text-[10px] font-bold border border-slate-800 rounded px-2 py-1 outline-none focus:border-amber-500"
                                            value={o.paymentMethod || 'Dinheiro'}
                                            onChange={(e) => updatePaymentMethod(o, e.target.value)}
                                        >
                                            <option value="Dinheiro">Dinheiro</option>
                                            <option value="PIX">PIX</option>
                                            <option value="Cartão">Cartão</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                             {clientOrders.length > visibleCount && (
                                <button 
                                    onClick={() => setVisibleCount(prev => prev + 30)}
                                    className="w-full py-3 mt-2 text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <ChevronDown size={14}/> Carregar mais antigos
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function NewOrderModal({ onClose, onSave, products, clients }: any) {
   const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
   const [form, setForm] = useState({ 
       customer: '', 
       phone: '', 
       address: '', 
       items: '', // Mantém apenas para manual/obs
       amount: '', 
       mapsLink: '', 
       paymentMethod: 'PIX', 
       serviceType: 'delivery', 
       paymentStatus: 'paid', 
       obs: '', 
       origin: 'manual' 
   });

   const [showPaste, setShowPaste] = useState(false);
   const [pasteText, setPasteText] = useState('');
   
   // ESTADOS PARA AUTOCOMPLETE
   const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
   const [showSuggestions, setShowSuggestions] = useState(false);

   const handleCapitalize = (e: any, field: string) => {
       const val = capitalize(e.target.value);
       setForm(prev => ({...prev, [field]: val}));
       
       // Lógica de Autocomplete por NOME
       if (field === 'customer' && val.length > 2) {
           const matches = clients.filter((c: Client) => c.name.toLowerCase().includes(val.toLowerCase()));
           setClientSuggestions(matches);
           setShowSuggestions(true);
       } else {
           setShowSuggestions(false);
       }
   };

   // Selecionar sugestão
   const selectClient = (client: Client) => {
       setForm(prev => ({
           ...prev,
           customer: client.name,
           phone: client.phone,
           address: client.address,
           mapsLink: client.mapsLink || ''
       }));
       setShowSuggestions(false);
   };

   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const val = e.target.value;
       setForm(prev => ({...prev, phone: val}));
       
       // Autocomplete por TELEFONE
       const inputNormal = normalizePhone(val);
       if (inputNormal.length >= 8) {
           const client = clients.find((c: Client) => { 
               const storedNormal = normalizePhone(c.id || c.phone); 
               return storedNormal.includes(inputNormal); 
           });
           if (client) {
               setForm(prev => ({ 
                   ...prev, 
                   customer: client.name || prev.customer, 
                   address: client.address || prev.address, 
                   mapsLink: client.mapsLink || prev.mapsLink 
               }));
           }
       }
   };
   
   const addToCart = (product: Product) => {
       setCart(prev => {
           const existing = prev.find(p => p.product.id === product.id);
           let newCart;
           if (existing) {
               newCart = prev.map(p => p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
           } else {
               newCart = [...prev, { product, quantity: 1 }];
           }
           updateTotal(product.price); // Adiciona o preço do item ao total
           return newCart;
       });
   };

   const updateQuantity = (index: number, delta: number) => {
       setCart(prev => {
           const newCart = [...prev];
           const item = newCart[index];
           const newQty = item.quantity + delta;
           
           if (newQty <= 0) {
               newCart.splice(index, 1);
               updateTotal(-item.product.price); // Remove preço
           } else {
               item.quantity = newQty;
               const priceDiff = delta > 0 ? item.product.price : -item.product.price;
               updateTotal(priceDiff);
           }
           return newCart;
       });
   };

   const removeStart = (index: number) => {
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[index];
            const deduction = item.product.price * item.quantity;
            newCart.splice(index, 1);
            updateTotal(-deduction);
            return newCart;
        });
   };

   const updateTotal = (priceDiff: number) => {
       // Lógica Híbrida: Soma ao valor que já está no input
       // Isso permite que o usuário tenha digitado um valor manual e o clique apenas adicione/subtraia
       const currentVal = parseCurrency(form.amount || '0');
       const newVal = Math.max(0, currentVal + priceDiff);
       setForm(prev => ({ ...prev, amount: formatCurrency(newVal) }));
   };

   const processPaste = () => {
       if (!pasteText) return;
       const lines = pasteText.split('\n');
       const newData = { ...form, items: pasteText }; // Joga tudo na obs por segurança

       lines.forEach(line => {
           const lower = line.toLowerCase();
           if (lower.includes('nome:') || lower.includes('cliente:')) {
               newData.customer = line.split(':')[1].trim();
           }
           if (lower.includes('endereço:') || lower.includes('rua') || lower.includes('av')) {
               newData.address = line.replace(/endereço:/i, '').trim();
           }
           if (lower.includes('total') || lower.includes('valor')) {
               const match = line.match(/[\d,.]+/);
               if (match) newData.amount = formatCurrency(parseFloat(match[0].replace(',', '.')));
           }
           // Tenta capturar telefone (ex: (11) 99999-9999)
           const phoneMatch = line.match(/\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/);
           if (phoneMatch) {
               newData.phone = phoneMatch[0];
           }
       });

       setForm(newData);
       setShowPaste(false);
       setPasteText('');
   };

   const submit = (e: React.FormEvent) => { 
       e.preventDefault(); 
       
       // Combina Itens do Carrinho + Texto Manual
       const cartText = cart.map(i => `${i.quantity}x ${i.product.name}`).join('\n');
       const finalItems = [cartText, form.items].filter(Boolean).join('\n---\n');

       const valorNumerico = parseCurrency(form.amount); 
       
       onSave({ ...form, items: finalItems, value: valorNumerico }); 
       onClose(); 
   };

   // Agrupamento por Categoria para o PDV com Ordenação e Cores
   const sortedGroupedProducts = useMemo(() => {
        const grouped = products.reduce((acc: any, product: Product) => {
            (acc[product.category] = acc[product.category] || []).push(product);
            return acc;
        }, {});

        // Ordem desejada
        const ORDER = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            const idxA = ORDER.indexOf(a);
            const idxB = ORDER.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        return sortedKeys.map(key => ({ category: key, items: grouped[key] }));
    }, [products]);

   return (
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
         <div className="bg-slate-900 md:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-7xl h-[95vh] md:h-[90vh] flex flex-col md:flex-row overflow-hidden border border-slate-800">
            
            {/* LADO ESQUERDO: CARDÁPIO (No celular fica em cima) */}
            <div className="flex-1 bg-slate-950 p-4 md:p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-800 custom-scrollbar order-1 md:order-1 h-1/2 md:h-full">
                 <div className="flex justify-between items-center mb-4 md:mb-6">
                        <h3 className="font-bold text-lg md:text-xl text-white">Cardápio</h3>
                        {/* Botão de fechar visível apenas no celular aqui em cima para facilidade */}
                        <button onClick={onClose} className="md:hidden bg-slate-800 p-2 rounded-full text-slate-400"><X size={20}/></button>
                 </div>
                 <div className="space-y-6 md:space-y-8 pb-4">
                     {sortedGroupedProducts.map((group: any, index: number) => {
                         const isEven = index % 2 === 0;
                         const headerColor = isEven ? 'text-amber-500 border-amber-500/30' : 'text-purple-400 border-purple-500/30';
                         const cardBorderHover = isEven ? 'hover:border-amber-500 hover:bg-slate-800' : 'hover:border-purple-500 hover:bg-slate-800';
                         const badgeColor = isEven ? 'text-emerald-400' : 'text-blue-400';

                         return (
                             <div key={group.category}>
                                 <h4 className={`font-bold mb-2 md:mb-3 border-b pb-1 md:pb-2 uppercase tracking-wider text-sm md:text-base ${headerColor}`}>{group.category}</h4>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                                    {group.items.map((p: Product) => (
                                        <button key={p.id} onClick={() => addToCart(p)} className={`bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm transition-all text-left group flex flex-col h-full active:scale-95 ${cardBorderHover}`}>
                                            <div className="flex justify-between items-start w-full">
                                                <span className={`font-bold text-slate-300 text-xs md:text-sm line-clamp-2 mb-1 flex-1 ${isEven ? 'group-hover:text-amber-500' : 'group-hover:text-purple-400'}`}>{p.name}</span>
                                                <span className={`text-[10px] md:text-xs font-bold bg-slate-950 px-2 py-1 rounded w-fit ml-2 ${badgeColor}`}>{formatCurrency(p.price)}</span>
                                            </div>
                                        </button>
                                    ))}
                                 </div>
                             </div>
                         );
                     })}
                 </div>
            </div>

            {/* LADO DIREITO: FORMULÁRIO (No celular fica embaixo) */}
            <div className="w-full md:w-[450px] bg-slate-900 p-4 md:p-6 flex flex-col h-1/2 md:h-full relative z-10 overflow-y-auto custom-scrollbar order-2 md:order-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none">
                <div className="hidden md:flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2"><PlusCircle size={18} className="text-amber-500"/> Novo Pedido</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-500 hover:text-white"/></button>
                </div>
                
                <form onSubmit={submit} className="space-y-3 md:space-y-4 flex-1 flex flex-col relative">
                   <div className="space-y-2 md:space-y-3 shrink-0 relative">
                       <div className="flex justify-between items-end">
                           <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Cliente</label>
                           <button type="button" onClick={() => setShowPaste(!showPaste)} className="text-[10px] text-amber-500 font-bold flex items-center gap-1 hover:text-amber-400"><ClipboardPaste size={12}/> Colar do WhatsApp</button>
                       </div>
                       
                       {/* Área de Colar Mágica */}
                       {showPaste && (
                           <div className="bg-slate-950 p-2 rounded-xl border border-amber-500/30 animate-in slide-in-from-top-2 mb-2">
                               <textarea 
                                   autoFocus
                                   className="w-full h-20 bg-transparent text-xs text-slate-300 outline-none resize-none"
                                   placeholder="Cole o pedido do WhatsApp aqui..."
                                   value={pasteText}
                                   onChange={e => setPasteText(e.target.value)}
                               />
                               <button type="button" onClick={processPaste} className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg mt-1">Processar Texto</button>
                           </div>
                       )}

                       <div className="grid grid-cols-3 gap-2 relative">
                           <input className="col-span-1 p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 text-xs md:text-sm" placeholder="Tel" value={form.phone} onChange={handlePhoneChange} />
                           
                           <div className="col-span-2 relative">
                               <input className="w-full p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 text-xs md:text-sm" placeholder="Nome" value={form.customer} onChange={e=>handleCapitalize(e, 'customer')} />
                               
                               {/* AUTOCOMPLETE DROPDOWN */}
                               {showSuggestions && clientSuggestions.length > 0 && (
                                   <div className="absolute top-full left-0 w-full bg-slate-950 border border-slate-700 rounded-xl mt-1 z-50 shadow-2xl max-h-40 overflow-y-auto">
                                       {clientSuggestions.map((c: Client) => (
                                           <button 
                                               type="button"
                                               key={c.id} 
                                               onClick={() => selectClient(c)}
                                               className="w-full text-left p-3 hover:bg-slate-800 text-white text-xs border-b border-slate-800 last:border-0 flex justify-between"
                                           >
                                               <span className="font-bold">{c.name}</span>
                                               <span className="text-slate-500">{c.phone}</span>
                                           </button>
                                       ))}
                                   </div>
                               )}
                           </div>
                       </div>
                       <input className="w-full p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 text-xs md:text-sm" placeholder="Endereço" value={form.address} onChange={e=>handleCapitalize(e, 'address')} />
                       <input className="w-full p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 text-xs md:text-sm" placeholder="Link do Google Maps (Opcional)" value={form.mapsLink} onChange={e=>setForm({...form, mapsLink: e.target.value})} />
                   </div>

                   <div className="pt-1 md:pt-2 shrink-0">
                       <div className="flex gap-2">
                           <button type="button" onClick={() => setForm({...form, serviceType: 'delivery'})} className={`flex-1 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all border ${form.serviceType === 'delivery' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}>
                               <Bike size={16}/> Entrega
                           </button>
                           <button type="button" onClick={() => setForm({...form, serviceType: 'pickup'})} className={`flex-1 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all border ${form.serviceType === 'pickup' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}>
                               <Store size={16}/> Retira
                           </button>
                       </div>
                   </div>

                   {/* CARRINHO VISUAL INTERATIVO */}
                   <div className="flex-1 flex flex-col border-t border-slate-800 pt-3 mt-2 overflow-hidden">
                       <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase block mb-1">Itens ({cart.length})</label>
                       <div className="flex-1 overflow-y-auto custom-scrollbar mb-2 min-h-[60px]">
                           {cart.length === 0 ? (
                               <div className="text-center py-2 text-slate-600 text-xs italic border border-dashed border-slate-800 rounded-xl">Selecione itens no cardápio acima</div>
                           ) : (
                               <div className="space-y-2">
                                   {cart.map((item, index) => (
                                       <div key={index} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                                           <div className="flex items-center gap-2 flex-1">
                                               <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800">
                                                   <button type="button" onClick={() => updateQuantity(index, -1)} className="p-1 hover:text-white text-slate-500"><Minus size={12}/></button>
                                                   <span className="text-xs font-bold w-5 text-center text-white">{item.quantity}</span>
                                                   <button type="button" onClick={() => updateQuantity(index, 1)} className="p-1 hover:text-white text-slate-500"><Plus size={12}/></button>
                                               </div>
                                               <span className="text-xs text-slate-300 font-medium truncate flex-1">{item.product.name}</span>
                                           </div>
                                           <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-emerald-400">{formatCurrency(item.product.price * item.quantity)}</span>
                                                <button type="button" onClick={() => removeStart(index)} className="text-slate-600 hover:text-red-500"><Trash2 size={12}/></button>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                       
                       <textarea 
                           className="w-full h-12 md:h-20 p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 text-xs md:text-sm font-mono leading-relaxed resize-none shrink-0" 
                           placeholder="Obs: Sem cebola..." 
                           value={form.items} 
                           onChange={e=>setForm({...form, items: e.target.value})} 
                       />
                   </div>

                   <div className="grid grid-cols-2 gap-2 pt-2 shrink-0">
                       <div>
                           <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase block mb-1">Total</label>
                           <input className="w-full p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold text-base md:text-lg outline-none focus:border-amber-500" placeholder="R$ 0,00" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} />
                       </div>
                       <div>
                           <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase block mb-1">Pagamento</label>
                           <select className="w-full p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none h-[42px] md:h-[54px] text-xs md:text-sm" value={form.paymentMethod} onChange={e=>setForm({...form, paymentMethod: e.target.value})}><option value="PIX">PIX</option><option value="Dinheiro">Dinheiro</option><option value="Cartão">Cartão</option></select>
                       </div>
                   </div>
                   
                   <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 md:py-4 rounded-xl shadow-lg mt-2 text-sm md:text-lg shrink-0">Confirmar</button>
                </form>
            </div>
         </div>
      </div>
   )
}

function ImportModal({ onClose, onImportCSV }: any) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                if(text) onImportCSV(text);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in p-6 border border-slate-800">
                <h3 className="font-bold text-xl mb-4 text-white">Importar Dados (CSV)</h3>
                <p className="text-sm text-slate-400 mb-6">Carregue o arquivo de lançamentos.</p>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-700 border-dashed rounded-2xl cursor-pointer bg-slate-950 hover:bg-slate-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud size={40} className="text-slate-500 mb-3"/>
                        <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Clique para carregar</span></p>
                    </div>
                    <input type="file" className="hidden" accept=".csv, .txt" onChange={handleFileChange} />
                </label>
                <div className="flex gap-3 pt-6">
                    <button onClick={onClose} className="w-full border border-slate-700 rounded-xl py-3 font-bold text-slate-400 hover:bg-slate-800">Cancelar</button>
                </div>
            </div>
        </div>
    );
}

function NewExpenseModal({ onClose, onSave }: any) {
    const [form, setForm] = useState({ description: '', amount: '', category: 'insumos' });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ ...form, amount: parseFloat(form.amount.replace(',', '.')) || 0 }); onClose(); };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in p-6 border border-slate-800">
                <h3 className="font-bold text-xl mb-4 text-white flex items-center gap-2"><MinusIcon className="text-red-500"/> Lançar Custo</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Descrição</label><input required autoFocus className="w-full border-2 border-slate-700 bg-slate-950 rounded-xl p-3 outline-none font-bold text-white" placeholder="Ex: Carne" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Valor (R$)</label><input required className="w-full border-2 border-slate-700 bg-slate-950 rounded-xl p-3 outline-none font-bold text-red-500 text-lg" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
                    <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 border border-slate-700 rounded-xl py-3 font-bold text-slate-500 hover:bg-slate-800">Cancelar</button><button className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-bold shadow-lg">Confirmar</button></div>
                </form>
            </div>
        </div>
    );
}

function NewDriverModal({ onClose, onSave, initialData }: any) {
    // Inicializa com dados vazios ou dados de edição se existirem
    const [form, setForm] = useState(initialData || { name: '', password: '', phone: '', vehicle: '', cpf: '', plate: '', avatar: '' });
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingImage(true);
            try {
                const compressedBase64 = await compressImage(file);
                setForm({ ...form, avatar: compressedBase64 });
            } catch (err) {
                console.error("Erro ao processar imagem", err);
                alert("Erro ao processar a imagem. Tente outra.");
            } finally {
                setIsProcessingImage(false);
            }
        }
    };

    const submit = (e: any) => { 
        e.preventDefault(); 
        const baseData = { ...form };
        
        // Se for novo cadastro, define padrões iniciais. Se for edição, mantém o que tem.
        if (!initialData) {
             Object.assign(baseData, { 
                 status: 'offline', 
                 lat: 0, 
                 lng: 0, 
                 battery: 100, 
                 rating: 5, 
                 totalDeliveries: 0,
                 // Avatar padrão se não tiver upload
                 avatar: form.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name}` 
             });
        }

        onSave(baseData); 
        onClose(); 
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-2">
                    {initialData ? <Edit className="text-amber-500"/> : <PlusCircle className="text-emerald-500"/>}
                    {initialData ? 'Editar Motoboy' : 'Novo Motoboy'}
                </h3>
                
                <form onSubmit={submit} className="space-y-4">
                    {/* Upload de Foto */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="relative w-24 h-24 rounded-full border-4 border-slate-700 bg-slate-800 overflow-hidden group">
                            {form.avatar ? (
                                <img src={form.avatar} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500"><Users size={32}/></div>
                            )}
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="text-white" size={24}/>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{isProcessingImage ? 'Processando...' : 'Toque para alterar foto'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Nome Completo</label>
                            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" placeholder="Ex: João Silva" value={form.name} onChange={e=>setForm({...form, name: capitalize(e.target.value)})} required/>
                        </div>
                        
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Senha de Acesso</label>
                            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" placeholder="1234" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required/>
                        </div>
                        
                        <div>
                             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Telefone</label>
                            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" placeholder="11999999999" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})}/>
                        </div>

                        <div className="col-span-2">
                            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">CPF</label>
                            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" placeholder="000.000.000-00" value={form.cpf} onChange={e=>setForm({...form, cpf: e.target.value})}/>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Modelo Veículo</label>
                            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" placeholder="Ex: Titan 160" value={form.vehicle} onChange={e=>setForm({...form, vehicle: e.target.value})}/>
                        </div>
                        
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Placa</label>
                            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" placeholder="ABC-1234" value={form.plate} onChange={e=>setForm({...form, plate: e.target.value.toUpperCase()})}/>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-800 mt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={isProcessingImage} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold shadow-lg disabled:opacity-50">
                            {initialData ? 'Salvar Alterações' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function NewValeModal({ driver, onClose, onSave }: any) {
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const handleSubmit = (e: any) => { e.preventDefault(); onSave({ driverId: driver.id, amount: parseFloat(amount), description: desc }); onClose(); };
    return (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-800">
                <h3 className="font-bold text-xl text-white mb-4">Novo Vale</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none" placeholder="Valor" value={amount} onChange={e=>setAmount(e.target.value)} required/>
                    <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none" placeholder="Motivo" value={desc} onChange={e=>setDesc(e.target.value)} required/>
                    <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 text-slate-500">Cancelar</button><button className="flex-1 bg-red-600 text-white rounded-xl py-3 font-bold">Confirmar</button></div>
                </form>
            </div>
        </div>
    )
}

function DriverReportModal({ driverId, drivers, orders, vales, onClose }: any) {
    const driver = drivers.find((d: Driver) => d.id === driverId);
    const myDeliveries = orders.filter((o: Order) => o.status === 'completed' && o.driverId === driverId);
    const earnings = myDeliveries.length * TAXA_ENTREGA;
    const myVales = vales.filter((v: Vale) => v.driverId === driverId);
    const deductions = myVales.reduce((acc: number, v: Vale) => acc + (Number(v.amount) || 0), 0);
    return (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl p-6 w-full max-w-2xl h-[80vh] flex flex-col border border-slate-800">
                <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl text-white">{driver?.name} - Extrato</h3><button onClick={onClose} className="text-slate-500"><X/></button></div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800"><p className="text-xs text-slate-500 uppercase">Saldo</p><p className="text-2xl font-bold text-emerald-400">R$ {(earnings - deductions).toFixed(2)}</p></div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800"><p className="text-xs text-slate-500 uppercase">Entregas</p><p className="text-2xl font-bold text-blue-400">{myDeliveries.length}</p></div>
                </div>
            </div>
        </div>
    )
}