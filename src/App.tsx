import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Package, Clock, 
  X, Search, Users, Bike, 
  TrendingUp, Utensils, Plus, Save, LogOut, CheckSquare,
  MessageCircle, Map, DollarSign, Calendar
} from 'lucide-react';

// --- Tipos e Interfaces ---
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
  phone: string; // Novo: Telefone do cliente para WhatsApp
  address: string;
  items: string; 
  status: 'pending' | 'assigned' | 'completed';
  amount: string;
  value: number; // Novo: Valor numérico para cálculos
  time: string;
  lat: number;
  lng: number;
  createdAt: Date;
}

// --- Dados Iniciais (Simulação) ---
const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Marcos Motoboy', status: 'available', lat: 48, lng: 52, battery: 92, vehicle: 'Honda CG 160', phone: '(11) 99999-1111', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcos', rating: 4.9, totalDeliveries: 12 },
  { id: 'd2', name: 'Ana Entregas', status: 'offline', lat: 60, lng: 70, battery: 42, vehicle: 'Honda Biz', phone: '(11) 99999-2222', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana', rating: 5.0, totalDeliveries: 8 },
];

const INITIAL_ORDERS: Order[] = [
  { id: 'o101', customer: 'João Silva', phone: '11999999999', address: 'Rua das Palmeiras, 45', items: '2x X-Salada + Fritas', status: 'pending', amount: 'R$ 45,90', value: 45.90, time: '5 min', lat: 25, lng: 35, createdAt: new Date() },
  { id: 'o102', customer: 'Maria Oliveira', phone: '11988888888', address: 'Av. Brasil, 1200', items: 'Combo Família', status: 'pending', amount: 'R$ 112,50', value: 112.50, time: '15 min', lat: 62, lng: 72, createdAt: new Date() },
];

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [viewMode, setViewMode] = useState<UserType>('landing');
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(null);

  // Simulação de GPS Global
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers(prev => prev.map(d => {
        if (d.status === 'offline') return d;
        const moveAmount = 1.0;
        let newLat = d.lat + (Math.random() - 0.5) * moveAmount;
        let newLng = d.lng + (Math.random() - 0.5) * moveAmount;
        return { ...d, lat: Math.max(5, Math.min(95, newLat)), lng: Math.max(5, Math.min(95, newLng)) };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- Ações de Negócio ---

  const createOrder = (newOrderData: any) => {
    const newOrder: Order = {
      id: `o${Date.now()}`,
      ...newOrderData,
      status: 'pending',
      lat: 50 + (Math.random() - 0.5) * 40, // Posição aleatória no mapa simulado
      lng: 50 + (Math.random() - 0.5) * 40,
      createdAt: new Date(),
      time: 'Agora'
    };
    setOrders([...orders, newOrder]);
  };

  const assignOrder = (orderId: string, driverId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'assigned' } : o));
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'delivering', currentOrderId: orderId } : d));
  };

  const completeOrder = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver && driver.currentOrderId) {
      setOrders(prev => prev.map(o => o.id === driver.currentOrderId ? { ...o, status: 'completed' } : o));
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'available', currentOrderId: undefined, totalDeliveries: d.totalDeliveries + 1 } : d));
    }
  };

  const toggleDriverStatus = (driverId: string) => {
    setDrivers(prev => prev.map(d => {
      if (d.id !== driverId) return d;
      return { ...d, status: d.status === 'offline' ? 'available' : 'offline' };
    }));
  };

  const createDriver = (driver: Driver) => {
    setDrivers([...drivers, driver]);
  };

  // --- Roteamento ---
  if (viewMode === 'landing') {
    return <LandingPage onSelectMode={(mode, id) => {
      if(id) setCurrentDriverId(id);
      setViewMode(mode);
    }} />;
  }

  if (viewMode === 'driver' && currentDriverId) {
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return <div className="p-10 text-center">Erro: Motorista não encontrado. <button onClick={() => setViewMode('landing')} className="text-blue-500 underline">Voltar</button></div>;
    
    return (
      <DriverApp 
        driver={driver} 
        allDrivers={drivers} // Apenas para debug/troca rápida
        orders={orders} 
        onToggleStatus={() => toggleDriverStatus(driver.id)}
        onCompleteOrder={() => completeOrder(driver.id)}
        onLogout={() => setViewMode('landing')}
        onSwitchDriver={(id: string) => setCurrentDriverId(id)}
      />
    );
  }

  return (
    <AdminPanel 
      drivers={drivers} 
      orders={orders} 
      onAssignOrder={assignOrder}
      onCreateDriver={createDriver}
      onCreateOrder={createOrder}
      onLogout={() => setViewMode('landing')}
    />
  );
}

// ==========================================
// 1. TELA INICIAL (LANDING)
// ==========================================
function LandingPage({ onSelectMode }: { onSelectMode: (mode: UserType, id?: string) => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="text-center md:text-left space-y-6">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full border border-orange-500/20 font-medium text-sm animate-in slide-in-from-left duration-700">
            <Utensils size={14} /> Sistema de Gestão v2.0
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            Jhans <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Delivery</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto md:mx-0">
            A solução completa para sua hamburgueria. Gerencie pedidos, acompanhe motoboys em tempo real e otimize suas entregas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
             <button 
              onClick={() => onSelectMode('admin')}
              className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20 hover:scale-105"
            >
              <TrendingUp size={20} /> Painel do Gerente
            </button>
             <button 
              onClick={() => onSelectMode('driver', 'd1')} // Login automático como driver d1 para teste
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Bike size={20} /> Sou Motoboy
            </button>
          </div>
        </div>

        {/* Card Visual Ilustrativo */}
        <div className="hidden md:block relative">
           <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                 <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl">J</div>
                 <div>
                    <h3 className="text-white font-bold">Jhans Burger</h3>
                    <p className="text-slate-400 text-xs">Status: Loja Aberta</p>
                 </div>
              </div>
              <div className="space-y-3">
                 <div className="bg-slate-800/50 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Entregas Hoje</span>
                    <span className="text-white font-bold">24</span>
                 </div>
                 <div className="bg-slate-800/50 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Motoboys Online</span>
                    <span className="text-emerald-400 font-bold">5</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. APP DO MOTOBOY (MOBILE)
// ==========================================
function DriverApp({ driver, allDrivers, orders, onToggleStatus, onCompleteOrder, onLogout, onSwitchDriver }: any) {
  const activeOrder = orders.find((o: Order) => o.id === driver.currentOrderId);

  // Função para abrir GPS
  const openWaze = (address: string) => {
    // Tenta abrir Waze, fallback para Google Maps
    const encoded = encodeURIComponent(address);
    window.open(`https://waze.com/ul?q=${encoded}`, '_blank');
  };

  // Função para abrir WhatsApp
  const openWhatsApp = (phone: string) => {
     // Remove caracteres não numéricos
     const cleanPhone = phone.replace(/\D/g, '');
     window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  return (
    <div className="flex justify-center bg-slate-900 min-h-screen">
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-[100dvh]"> {/* 100dvh para mobile real */}
        
        {/* Header Compacto */}
        <div className="bg-slate-900 text-white p-4 pt-6 pb-6 rounded-b-3xl z-10 shadow-lg shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <img src={driver.avatar} className="w-12 h-12 rounded-full border-2 border-orange-500 bg-slate-800" />
              <div>
                <h2 className="font-bold text-lg leading-tight">{driver.name}</h2>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                   <span>{driver.vehicle}</span> • <span className="text-amber-400">★ {driver.rating}</span>
                </div>
              </div>
            </div>
            <button onClick={onLogout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-slate-300">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Debug Switcher (Escondido em produção) */}
        <select className="absolute top-2 right-2 opacity-0 w-4 h-4 z-50" value={driver.id} onChange={(e) => onSwitchDriver(e.target.value)}>
           {allDrivers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        {/* Área Rolável */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          
          {/* Status Bar */}
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between shadow-sm transition-colors ${driver.status === 'offline' ? 'bg-white border-slate-200' : 'bg-emerald-50 border-emerald-100'}`}>
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Seu Status</p>
                <div className="flex items-center gap-2">
                   <div className={`w-2.5 h-2.5 rounded-full ${driver.status === 'offline' ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`}></div>
                   <span className={`font-bold ${driver.status === 'offline' ? 'text-slate-600' : 'text-emerald-700'}`}>
                      {driver.status === 'offline' ? 'Offline' : 'Online e Disponível'}
                   </span>
                </div>
             </div>
             <button 
               onClick={onToggleStatus}
               className={`px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${
                 driver.status === 'offline' 
                 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                 : 'bg-white border border-slate-200 text-slate-600'
               }`}
             >
               {driver.status === 'offline' ? 'Ficar Online' : 'Pausar'}
             </button>
          </div>

          {/* CARD DE ENTREGA ATIVA (O MAIS IMPORTANTE) */}
          {driver.status === 'delivering' && activeOrder ? (
             <div className="animate-in slide-in-from-bottom-5 fade-in duration-500">
               <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden">
                 
                 {/* Cabeçalho do Pedido */}
                 <div className="bg-orange-50 p-4 border-b border-orange-100 flex justify-between items-center">
                    <div>
                       <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide bg-orange-100 px-2 py-1 rounded-full">Pedido #{activeOrder.id}</span>
                       <h3 className="font-bold text-lg text-slate-800 mt-1">{activeOrder.customer}</h3>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-slate-500">Valor a cobrar</p>
                       <p className="font-bold text-lg text-slate-800">{activeOrder.amount}</p>
                    </div>
                 </div>

                 <div className="p-5 space-y-6">
                   {/* Endereço e Navegação */}
                   <div>
                      <div className="flex items-start gap-3 mb-3">
                         <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mt-1"><MapPin size={20} /></div>
                         <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Entrega em</p>
                            <p className="text-slate-700 font-medium leading-snug">{activeOrder.address}</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => openWaze(activeOrder.address)} className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-200 transition-colors">
                            <Navigation size={16} /> Abrir GPS
                         </button>
                         <button onClick={() => openWhatsApp(activeOrder.phone)} className="flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 py-2.5 rounded-lg font-bold text-sm hover:bg-emerald-200 transition-colors">
                            <MessageCircle size={16} /> WhatsApp
                         </button>
                      </div>
                   </div>

                   <hr className="border-slate-100" />

                   {/* Itens */}
                   <div className="flex items-start gap-3">
                      <div className="bg-orange-50 p-2 rounded-lg text-orange-600 mt-1"><Package size={20} /></div>
                      <div>
                         <p className="text-xs text-slate-400 font-bold uppercase">Itens do Pedido</p>
                         <p className="text-slate-600 text-sm">{activeOrder.items}</p>
                      </div>
                   </div>

                   {/* Botão Finalizar */}
                   <button 
                     onClick={onCompleteOrder}
                     className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all mt-4"
                   >
                     <CheckSquare size={20} className="text-emerald-400" />
                     Finalizar Entrega
                   </button>
                 </div>
               </div>
             </div>
          ) : (
            // Estado Vazio
            driver.status !== 'offline' && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-60">
                 <div className="relative">
                    <span className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-20"></span>
                    <div className="bg-white p-4 rounded-full shadow-md relative z-10">
                       <Search size={32} className="text-orange-500" />
                    </div>
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-700">Procurando pedidos...</h3>
                    <p className="text-sm text-slate-400">Fique atento, o chamado tocará aqui.</p>
                 </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. PAINEL DO GERENTE (ADMIN)
// ==========================================
function AdminPanel({ drivers, orders, onAssignOrder, onCreateDriver, onCreateOrder, onLogout }: any) {
  const [view, setView] = useState<'map' | 'list' | 'history'>('map');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  
  // Modais
  const [isDriverModalOpen, setDriverModalOpen] = useState(false);
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);

  // Stats
  const deliveredOrders = orders.filter((o:Order) => o.status === 'completed');
  const todayTotal = deliveredOrders.reduce((acc: number, curr: Order) => acc + (curr.value || 0), 0);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-5 border-b border-slate-700/50 flex items-center gap-3">
           <div className="bg-orange-600 p-2 rounded-lg"><Utensils size={20} /></div>
           <span className="font-bold text-lg">Jhans Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarBtn icon={<MapPin />} label="Mapa Ao Vivo" active={view === 'map'} onClick={() => setView('map')} />
          <SidebarBtn icon={<Users />} label="Motoboys" active={view === 'list'} onClick={() => setView('list')} />
          <div className="pt-4 pb-2 text-xs font-bold text-slate-500 uppercase px-3">Gestão</div>
          <SidebarBtn icon={<Plus />} label="Novo Pedido" active={false} onClick={() => setOrderModalOpen(true)} highlight />
          <SidebarBtn icon={<Clock />} label="Histórico" active={view === 'history'} onClick={() => setView('history')} />
        </nav>

        <div className="p-4 border-t border-slate-700/50">
           <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium p-2 w-full rounded-lg hover:bg-slate-800">
             <LogOut size={16} /> Sair do Painel
           </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
           <h1 className="text-xl font-bold text-slate-800">
             {view === 'map' && 'Visão Geral da Operação'}
             {view === 'list' && 'Gerenciar Equipe'}
             {view === 'history' && 'Histórico de Vendas'}
           </h1>
           <div className="flex items-center gap-4">
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sistema Online
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-hidden relative flex">
          
          {/* VIEW: MAPA */}
          {view === 'map' && (
             <div className="flex-1 bg-slate-200 relative group overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                
                {/* Renderizar Pedidos Pendentes */}
                {orders.filter((o:Order) => o.status === 'pending').map((o:Order) => (
                   <div key={o.id} className="absolute z-10 cursor-pointer hover:scale-110 transition-transform" style={{top: `${o.lat}%`, left: `${o.lng}%`}}>
                      <div className="w-8 h-8 bg-orange-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white"><Utensils size={14}/></div>
                      <div className="absolute top-full mt-1 bg-white px-2 py-1 rounded shadow text-[10px] font-bold whitespace-nowrap">{o.customer}</div>
                   </div>
                ))}

                {/* Renderizar Motoboys */}
                {drivers.map((d:Driver) => (
                   <div key={d.id} onClick={() => setSelectedDriver(d)} className="absolute z-20 cursor-pointer transition-all duration-[2000ms] ease-linear" style={{top: `${d.lat}%`, left: `${d.lng}%`}}>
                      <div className={`relative flex flex-col items-center ${selectedDriver?.id === d.id ? 'scale-110' : ''}`}>
                         <img src={d.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-md bg-slate-100" />
                         <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white ${d.status === 'offline' ? 'bg-slate-400' : d.status === 'available' ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
                      </div>
                   </div>
                ))}
             </div>
          )}

          {/* VIEW: LISTA */}
          {view === 'list' && (
             <div className="flex-1 bg-white p-8 overflow-auto">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="font-bold text-lg">Todos os Motoboys</h2>
                   <button onClick={() => setDriverModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center"><Plus size={16}/> Adicionar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {drivers.map((d:Driver) => (
                      <div key={d.id} onClick={() => setSelectedDriver(d)} className="border border-slate-200 p-4 rounded-xl cursor-pointer hover:shadow-md transition-shadow bg-white">
                         <div className="flex items-center gap-3">
                            <img src={d.avatar} className="w-12 h-12 rounded-full" />
                            <div>
                               <h3 className="font-bold text-slate-800">{d.name}</h3>
                               <p className="text-xs text-slate-500">{d.phone}</p>
                            </div>
                         </div>
                         <div className="mt-4 flex gap-2 text-xs">
                            <span className="bg-slate-100 px-2 py-1 rounded">Entregas: {d.totalDeliveries}</span>
                            <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded">★ {d.rating}</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* VIEW: HISTÓRICO */}
          {view === 'history' && (
             <div className="flex-1 bg-white p-8 overflow-auto">
                <div className="grid grid-cols-3 gap-4 mb-8">
                   <StatBox label="Faturamento Hoje" value={`R$ ${todayTotal.toFixed(2)}`} icon={<DollarSign size={20} className="text-emerald-500"/>} />
                   <StatBox label="Entregas Realizadas" value={deliveredOrders.length} icon={<CheckSquare size={20} className="text-blue-500"/>} />
                   <StatBox label="Ticket Médio" value={`R$ ${(todayTotal / (deliveredOrders.length || 1)).toFixed(2)}`} icon={<TrendingUp size={20} className="text-orange-500"/>} />
                </div>
                
                <h3 className="font-bold text-lg mb-4">Últimas Entregas</h3>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                         <tr>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Valor</th>
                            <th className="p-4">Motoboy</th>
                            <th className="p-4">Status</th>
                         </tr>
                      </thead>
                      <tbody>
                         {deliveredOrders.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhuma entrega finalizada hoje.</td></tr>
                         ) : deliveredOrders.map((o:Order) => (
                            <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                               <td className="p-4 font-medium text-slate-800">{o.customer}</td>
                               <td className="p-4 text-emerald-600 font-bold">{o.amount}</td>
                               <td className="p-4 flex items-center gap-2">
                                  {drivers.find(d => d.currentOrderId === o.id)?.name || 'Entregador'}
                               </td>
                               <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Concluído</span></td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {/* SIDEBAR DETALHES (Sempre visível no mapa) */}
          {view === 'map' && (
             <aside className="w-80 bg-white border-l border-slate-200 shadow-xl overflow-y-auto z-30 p-6">
                {selectedDriver ? (
                   <div className="animate-in slide-in-from-right-4 duration-300">
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="font-bold text-slate-700">Detalhes</h3>
                         <button onClick={() => setSelectedDriver(null)} className="text-slate-400"><X size={18}/></button>
                      </div>
                      <div className="text-center mb-6">
                         <img src={selectedDriver.avatar} className="w-20 h-20 rounded-full mx-auto mb-2 border-4 border-slate-50"/>
                         <h2 className="font-bold text-lg">{selectedDriver.name}</h2>
                         <p className={`text-sm font-medium ${selectedDriver.status === 'offline' ? 'text-red-500' : selectedDriver.status === 'available' ? 'text-emerald-500' : 'text-orange-500'}`}>
                            {selectedDriver.status === 'offline' ? 'Offline' : selectedDriver.status === 'available' ? 'Disponível' : 'Em Entrega'}
                         </p>
                      </div>

                      {selectedDriver.status === 'available' && (
                         <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase">Atribuir Pedido Pendente</p>
                            {orders.filter(o => o.status === 'pending').map(order => (
                               <div key={order.id} onClick={() => onAssignOrder(order.id, selectedDriver.id)} className="bg-white border border-slate-200 p-3 rounded-lg hover:border-orange-500 cursor-pointer group shadow-sm">
                                  <div className="flex justify-between font-bold text-sm text-slate-800">
                                     <span>{order.customer}</span>
                                     <span className="text-emerald-600">{order.amount}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1 truncate">{order.address}</p>
                                  <button className="w-full mt-2 bg-orange-600 text-white text-xs font-bold py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Enviar para Motoboy</button>
                               </div>
                            ))}
                            {orders.filter(o => o.status === 'pending').length === 0 && <p className="text-sm text-slate-400 text-center italic">Sem pedidos pendentes</p>}
                         </div>
                      )}
                   </div>
                ) : (
                   <div className="text-center py-10 opacity-50">
                      <Users size={40} className="mx-auto mb-2"/>
                      <p>Selecione um motoboy no mapa</p>
                   </div>
                )}
             </aside>
          )}
        </div>
      </main>

      {/* MODAL: NOVO PEDIDO */}
      {isOrderModalOpen && (
         <NewOrderModal onClose={() => setOrderModalOpen(false)} onSave={onCreateOrder} />
      )}
      {/* MODAL: NOVO MOTOBOY */}
      {isDriverModalOpen && (
         <NewDriverModal onClose={() => setDriverModalOpen(false)} onSave={onCreateDriver} driversCount={drivers.length} />
      )}
    </div>
  );
}

// --- Subcomponentes Auxiliares ---

function SidebarBtn({ icon, label, active, onClick, highlight }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${active ? 'bg-orange-600 text-white shadow-lg' : highlight ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className={active ? 'text-white' : highlight ? 'text-orange-400' : 'text-current'}>{icon}</div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

function StatBox({label, value, icon}: any) {
   return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
         <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
         <div>
            <p className="text-xs text-slate-500 uppercase font-bold">{label}</p>
            <p className="text-xl font-bold text-slate-800">{value}</p>
         </div>
      </div>
   )
}

function NewOrderModal({ onClose, onSave }: any) {
   const [formData, setFormData] = useState({ customer: '', phone: '', address: '', items: '', amount: '' });
   
   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Converte valor string R$ para number simples
      const numValue = parseFloat(formData.amount.replace('R$', '').replace(',', '.').trim()) || 0;
      onSave({ ...formData, value: numValue });
      onClose();
   };

   return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
         <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
               <h3 className="font-bold flex items-center gap-2"><Plus size={18}/> Novo Pedido</h3>
               <button onClick={onClose}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Cliente</label>
                  <input required className="w-full border rounded-lg p-2" placeholder="Ex: João da Silva" 
                     value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Telefone (WhatsApp)</label>
                     <input required className="w-full border rounded-lg p-2" placeholder="11999999999" 
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Valor (R$)</label>
                     <input required className="w-full border rounded-lg p-2" placeholder="Ex: 45.90" 
                        value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Endereço Completo</label>
                  <input required className="w-full border rounded-lg p-2" placeholder="Rua, Número, Bairro" 
                     value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Itens do Pedido</label>
                  <textarea required className="w-full border rounded-lg p-2 h-20" placeholder="Ex: 2x X-Burger..." 
                     value={formData.items} onChange={e => setFormData({...formData, items: e.target.value})} />
               </div>
               <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg">Salvar Pedido</button>
            </form>
         </div>
      </div>
   )
}

function NewDriverModal({ onClose, onSave, driversCount }: any) {
   const [name, setName] = useState('');
   const [phone, setPhone] = useState('');
   const [vehicle, setVehicle] = useState('');

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
         id: `d${driversCount + 1}`,
         name, phone, vehicle,
         status: 'offline', lat: 50, lng: 50, battery: 100,
         avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
         rating: 5.0, totalDeliveries: 0
      });
      onClose();
   };

   return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
         <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
               <h3 className="font-bold flex items-center gap-2"><Bike size={18}/> Cadastrar Motoboy</h3>
               <button onClick={onClose}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <input required className="w-full border rounded-lg p-2" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} />
               <input required className="w-full border rounded-lg p-2" placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} />
               <input required className="w-full border rounded-lg p-2" placeholder="Veículo (Ex: Honda Titan)" value={vehicle} onChange={e => setVehicle(e.target.value)} />
               <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg">Cadastrar</button>
            </form>
         </div>
      </div>
   )
}