import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Package, Phone, Clock, CheckCircle, 
  AlertCircle, Menu, X, Search, BarChart3, Users, Bike, 
  TrendingUp, Utensils, Plus, Save, ArrowLeft, LogOut, CheckSquare,
  Download // Adicionado ícone de download
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
}

interface Order {
  id: string;
  customer: string;
  address: string;
  items: string; 
  status: 'pending' | 'assigned' | 'completed';
  amount: string;
  time: string;
  lat: number;
  lng: number;
}

// --- Dados Iniciais ---
const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Marcos Motoboy', status: 'available', lat: 48, lng: 52, battery: 92, vehicle: 'Honda CG 160', phone: '(11) 99999-1111', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcos', rating: 4.9 },
  { id: 'd2', name: 'Ana Entregas', status: 'offline', lat: 60, lng: 70, battery: 42, vehicle: 'Honda Biz', phone: '(11) 99999-2222', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana', rating: 5.0 },
];

const INITIAL_ORDERS: Order[] = [
  { id: 'o101', customer: 'João Silva', address: 'Rua das Palmeiras, 45', items: '2x X-Salada + Fritas', status: 'pending', amount: 'R$ 45,90', time: '5 min', lat: 25, lng: 35 },
  { id: 'o102', customer: 'Maria Oliveira', address: 'Av. Brasil, 1200', items: 'Combo Família', status: 'pending', amount: 'R$ 112,50', time: '15 min', lat: 62, lng: 72 },
];

// --- COMPONENTE PRINCIPAL (Gerenciador de Estado Global) ---
export default function App() {
  const [viewMode, setViewMode] = useState<UserType>('landing');
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(null);

  // Simulação de GPS Global (Move apenas quem não está offline)
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

  // Ações do Sistema
  const assignOrder = (orderId: string, driverId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'assigned' } : o));
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'delivering', currentOrderId: orderId } : d));
  };

  const completeOrder = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver && driver.currentOrderId) {
      setOrders(prev => prev.map(o => o.id === driver.currentOrderId ? { ...o, status: 'completed' } : o));
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'available', currentOrderId: undefined } : d));
    }
  };

  const toggleDriverStatus = (driverId: string) => {
    setDrivers(prev => prev.map(d => {
      if (d.id !== driverId) return d;
      const newStatus = d.status === 'offline' ? 'available' : 'offline';
      return { ...d, status: newStatus };
    }));
  };

  const createDriver = (driver: Driver) => {
    setDrivers([...drivers, driver]);
  };

  // --- Roteamento Simples ---
  if (viewMode === 'landing') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-orange-600 p-4 rounded-2xl shadow-lg shadow-orange-500/20">
              <Utensils className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Jhans Delivery</h1>
          <p className="text-slate-400">Escolha como deseja acessar o sistema</p>
          
          <div className="grid grid-cols-1 gap-4 mt-8">
            <button 
              onClick={() => setViewMode('admin')}
              className="group relative flex items-center justify-center gap-3 p-6 bg-white rounded-xl hover:bg-orange-50 transition-all duration-200 border-2 border-transparent hover:border-orange-500"
            >
              <div className="bg-orange-100 p-3 rounded-full group-hover:bg-orange-200 transition-colors">
                 <TrendingUp className="w-6 h-6 text-orange-700" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-900 text-lg">Gerente da Loja</h3>
                <p className="text-slate-500 text-sm">Acessar Painel de Controle</p>
              </div>
            </button>

            <button 
              onClick={() => {
                // Simula login do primeiro motoboy ou cria um menu de seleção
                setCurrentDriverId('d1'); 
                setViewMode('driver');
              }}
              className="group relative flex items-center justify-center gap-3 p-6 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all duration-200 border-2 border-slate-700 hover:border-slate-600"
            >
              <div className="bg-slate-700 p-3 rounded-full group-hover:bg-slate-600 transition-colors">
                 <Bike className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white text-lg">Sou Motoboy</h3>
                <p className="text-slate-400 text-sm">Acessar App de Entregas</p>
              </div>
            </button>
            
             <div className="text-xs text-slate-500 mt-4">
                * Em produção, isso seriam dois apps diferentes.
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'driver' && currentDriverId) {
    const driver = drivers.find(d => d.id === currentDriverId);
    if (!driver) return <div>Erro: Motorista não encontrado</div>;
    
    // Filtra lista de motoboys para login simplificado
    const switchDriver = (id: string) => setCurrentDriverId(id);

    return (
      <DriverApp 
        driver={driver} 
        allDrivers={drivers}
        orders={orders} 
        onToggleStatus={() => toggleDriverStatus(driver.id)}
        onCompleteOrder={() => completeOrder(driver.id)}
        onLogout={() => setViewMode('landing')}
        onSwitchDriver={switchDriver}
      />
    );
  }

  return (
    <AdminPanel 
      drivers={drivers} 
      orders={orders} 
      onAssignOrder={assignOrder}
      onCreateDriver={createDriver}
      onLogout={() => setViewMode('landing')}
    />
  );
}

// --- COMPONENTE 2: APP DO MOTOBOY (MOBILE UI) ---
function DriverApp({ driver, allDrivers, orders, onToggleStatus, onCompleteOrder, onLogout, onSwitchDriver }: any) {
  const activeOrder = orders.find((o: Order) => o.id === driver.currentOrderId);
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  return (
    <div className="flex justify-center bg-slate-900 h-screen">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Banner de Instalação (Simulação do Chrome) */}
        {showInstallBanner && (
          <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center text-xs z-50 animate-in slide-in-from-top duration-500 shadow-xl border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 p-1.5 rounded-lg shrink-0">
                <Utensils size={14} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-orange-50">Instalar Jhans Delivery</p>
                <p className="text-slate-400 text-[10px]">Adicionar à tela inicial</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                   alert("INSTRUÇÕES PARA O MOTOBOY:\n\n1. Clique nos 3 pontinhos do navegador.\n2. Selecione 'Adicionar à Tela Inicial'.\n\nO ícone aparecerá no celular dele!");
                   setShowInstallBanner(false);
                }}
                className="bg-white text-slate-900 px-3 py-1.5 rounded-full font-bold hover:bg-slate-100 active:scale-95 transition-transform"
              >
                Instalar
              </button>
              <button onClick={() => setShowInstallBanner(false)} className="p-1 text-slate-400 hover:text-white"><X size={16}/></button>
            </div>
          </div>
        )}

        {/* Header Mobile */}
        <div className="bg-slate-900 text-white p-4 pb-8 rounded-b-3xl z-10 shadow-lg relative">
          <div className="flex justify-between items-center mb-6">
            <button onClick={onLogout} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
              <LogOut size={18} />
            </button>
            <span className="font-bold tracking-wider text-orange-500">JHANS DRIVER</span>
            <div className="w-8"></div> {/* Spacer */}
          </div>
          
          <div className="flex items-center gap-4 px-2">
            <img src={driver.avatar} className="w-16 h-16 rounded-full border-4 border-slate-700 bg-slate-800" />
            <div className="flex-1">
              <h2 className="font-bold text-xl">{driver.name}</h2>
              <p className="text-slate-400 text-sm">{driver.vehicle}</p>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-2xl font-bold text-amber-400">★ {driver.rating}</span>
            </div>
          </div>
        </div>

        {/* Simulador de troca de motoboy (apenas para teste) */}
        <div className="absolute top-24 right-4 z-50">
            <select 
                className="bg-slate-800 text-white text-xs p-1 rounded border border-slate-600 opacity-50 hover:opacity-100 transition-opacity"
                value={driver.id}
                onChange={(e) => onSwitchDriver(e.target.value)}
            >
                {allDrivers.map((d: Driver) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                ))}
            </select>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 p-6 -mt-4 bg-slate-50 overflow-y-auto rounded-t-3xl z-20">
          
          {/* Status Toggle */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${driver.status === 'offline' ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`}></div>
              <span className="font-bold text-slate-700">
                {driver.status === 'offline' ? 'Você está Offline' : 'Disponível para entregas'}
              </span>
            </div>
            <button 
              onClick={onToggleStatus}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                driver.status === 'offline' 
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {driver.status === 'offline' ? 'Ficar Online' : 'Ficar Offline'}
            </button>
          </div>

          {/* Estado: Entregando */}
          {driver.status === 'delivering' && activeOrder ? (
             <div className="animate-in slide-in-from-bottom-10 duration-500">
               <div className="bg-white p-5 rounded-2xl shadow-lg border-l-4 border-orange-500 mb-6">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">Pedido em Rota</span>
                     <h3 className="font-bold text-xl text-slate-900 mt-1">{activeOrder.customer}</h3>
                   </div>
                   <div className="bg-slate-100 p-2 rounded-lg">
                      <Navigation className="text-blue-600" />
                   </div>
                 </div>
                 
                 <div className="space-y-4 mb-6">
                   <div className="flex items-start gap-3">
                     <MapPin className="text-slate-400 mt-1 shrink-0" size={18} />
                     <div>
                       <p className="text-sm font-bold text-slate-700">Endereço de Entrega</p>
                       <p className="text-sm text-slate-500">{activeOrder.address}</p>
                     </div>
                   </div>
                   <div className="flex items-start gap-3">
                     <Package className="text-slate-400 mt-1 shrink-0" size={18} />
                     <div>
                       <p className="text-sm font-bold text-slate-700">Itens</p>
                       <p className="text-sm text-slate-500">{activeOrder.items}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                     <Clock className="text-slate-400" size={18} />
                     <span className="text-sm font-medium text-slate-600">Previsão: {activeOrder.time}</span>
                   </div>
                 </div>

                 <button 
                   onClick={onCompleteOrder}
                   className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                 >
                   <CheckSquare size={20} />
                   Confirmar Entrega
                 </button>
               </div>
             </div>
          ) : null}

          {/* Estado: Aguardando ou Offline */}
          {driver.status !== 'delivering' && (
             <div className="text-center py-12 opacity-50">
                {driver.status === 'offline' ? (
                  <>
                    <Bike size={48} className="mx-auto text-slate-300 mb-4" />
                    <p>Fique Online para receber pedidos</p>
                  </>
                ) : (
                  <>
                    <div className="relative inline-block">
                        <span className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-20"></span>
                        <Search size={48} className="mx-auto text-orange-400 mb-4 relative z-10" />
                    </div>
                    <p className="font-medium text-slate-600">Procurando pedidos...</p>
                    <p className="text-sm text-slate-400 mt-2">Mantenha o app aberto</p>
                  </>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE 3: PAINEL DA LOJA (ADMIN) ---
// (Este é o código anterior encapsulado)
function AdminPanel({ drivers, orders, onAssignOrder, onCreateDriver, onLogout }: any) {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  
  // States para formulário
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState('');

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `d${drivers.length + 1}`;
    onCreateDriver({
      id: newId,
      name: newDriverName,
      phone: newDriverPhone,
      vehicle: newDriverVehicle,
      status: 'offline',
      lat: 50, lng: 50,
      battery: 100,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newDriverName}`,
      rating: 5.0
    });
    setIsAddDriverModalOpen(false);
    setNewDriverName(''); setNewDriverPhone(''); setNewDriverVehicle('');
    setView('list');
  };

  const getStatusColor = (status: DriverStatus) => {
    switch(status) {
      case 'available': return 'bg-emerald-500';
      case 'delivering': return 'bg-orange-500';
      case 'offline': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* Modal Cadastro */}
      {isAddDriverModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Bike className="text-orange-500" /> Novo Motoboy
              </h3>
              <button onClick={() => setIsAddDriverModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddDriver} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                <input required type="text" value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Carlos Silva" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Telefone</label>
                <input required type="tel" value={newDriverPhone} onChange={(e) => setNewDriverPhone(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Veículo</label>
                <input required type="text" value={newDriverVehicle} onChange={(e) => setNewDriverVehicle(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Honda CG 160" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddDriverModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"><Save size={18} /> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col shadow-xl z-20`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center w-full'}`}>
            <div className="bg-orange-600 p-2 rounded-lg"><Utensils className="w-6 h-6 text-white" /></div>
            {isSidebarOpen && <span className="font-bold text-lg tracking-tight text-orange-50">Jhans Delivery</span>}
          </div>
        </div>
        <nav className="flex-1 py-6 space-y-2 px-2">
          <SidebarItem icon={<MapPin />} label="Mapa Ao Vivo" active={view === 'map'} onClick={() => setView('map')} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Users />} label="Motoboys" active={view === 'list'} onClick={() => setView('list')} collapsed={!isSidebarOpen} />
          <SidebarItem icon={<Package />} label="Pedidos Pendentes" count={orders.filter((o:Order) => o.status === 'pending').length} collapsed={!isSidebarOpen} />
        </nav>
        <div className="p-4 border-t border-slate-700/50 space-y-2">
           <button onClick={onLogout} className="w-full flex items-center gap-3 p-2 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors">
             <LogOut size={20} className={!isSidebarOpen ? "mx-auto" : ""} />
             {isSidebarOpen && <span className="font-bold text-sm">Sair do Painel</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
          <h1 className="text-xl font-semibold text-slate-800">{view === 'map' ? 'Gestão de Entregas' : 'Equipe'}</h1>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold border border-orange-200">J</div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative flex">
          {view === 'map' && (
            <div className="flex-1 bg-slate-200 relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              
              {orders.filter((o:Order) => o.status === 'pending').map((order:Order) => (
                <div key={order.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 hover:scale-110 transition-transform" style={{ top: `${order.lat}%`, left: `${order.lng}%` }}>
                  <div className="relative group/pin">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white"><Utensils size={14} /></div>
                  </div>
                </div>
              ))}

              {drivers.map((driver:Driver) => (
                <div key={driver.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all duration-[2000ms] ease-linear" style={{ top: `${driver.lat}%`, left: `${driver.lng}%` }} onClick={() => setSelectedDriver(driver)}>
                  <div className="relative flex flex-col items-center">
                    {driver.status === 'available' && <span className="absolute w-full h-full rounded-full bg-emerald-400 opacity-20 animate-ping"></span>}
                    <div className={`w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden ${selectedDriver?.id === driver.id ? 'ring-2 ring-orange-500 scale-110' : ''}`}>
                      <img src={driver.avatar} className="w-full h-full object-cover bg-slate-100" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(driver.status)}`}></div>
                    <div className="absolute top-full mt-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap">{driver.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {view === 'list' && (
             <div className="flex-1 bg-white overflow-auto p-6">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-slate-800">Sua Frota</h2>
                   <button onClick={() => setIsAddDriverModalOpen(true)} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex gap-2"><Plus size={20} /> Novo Motoboy</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drivers.map((driver:Driver) => (
                    <div key={driver.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm cursor-pointer" onClick={() => setSelectedDriver(driver)}>
                        <div className="flex items-center gap-3 mb-2">
                           <img src={driver.avatar} className="w-12 h-12 rounded-full" />
                           <div>
                              <h3 className="font-bold">{driver.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getStatusColor(driver.status)}`}>
                                 {driver.status === 'offline' ? 'Offline' : driver.status === 'available' ? 'Disponível' : 'Entregando'}
                              </span>
                           </div>
                        </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {/* Sidebar de Detalhes */}
          <aside className="w-80 bg-white border-l border-slate-200 shadow-xl overflow-y-auto z-30">
            <div className="p-6">
               <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-orange-600" /> Painel da Loja</h2>
               <div className="grid grid-cols-2 gap-3 mb-6">
                 <StatCard label="Online" value={drivers.filter((d:Driver) => d.status !== 'offline').length} color="bg-emerald-50 text-emerald-700" />
                 <StatCard label="Em rota" value={drivers.filter((d:Driver) => d.status === 'delivering').length} color="bg-orange-50 text-orange-700" />
               </div>

               {selectedDriver ? (
                 <div className="bg-white border border-slate-200 rounded-xl p-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="font-bold text-slate-700">Detalhes</h3>
                       <button onClick={() => setSelectedDriver(null)}><X size={16}/></button>
                    </div>
                    <div className="flex flex-col items-center mb-4">
                       <img src={selectedDriver.avatar} className="w-20 h-20 rounded-full border-4 border-slate-50 mb-2 shadow-sm" />
                       <h4 className="font-bold text-lg">{selectedDriver.name}</h4>
                    </div>

                    {selectedDriver.status === 'available' && (
                       <div className="mt-4">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Pedidos Pendentes</p>
                          <div className="space-y-2">
                             {orders.filter((o:Order) => o.status === 'pending').map((order:Order) => (
                                <div key={order.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer group hover:border-orange-300"
                                     onClick={() => onAssignOrder(order.id, selectedDriver.id)}>
                                   <div className="flex justify-between mb-1"><span className="font-bold text-sm">{order.customer}</span></div>
                                   <p className="text-xs text-slate-600 mb-2">{order.items}</p>
                                   <button className="w-full bg-orange-600 text-white text-xs py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Enviar Entrega</button>
                                </div>
                             ))}
                             {orders.filter((o:Order) => o.status === 'pending').length === 0 && <p className="text-xs text-center text-slate-400">Sem pedidos</p>}
                          </div>
                       </div>
                    )}
                    {selectedDriver.status === 'delivering' && (
                       <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                          <p className="text-xs font-bold text-orange-800 flex gap-1"><Clock size={12}/> Entregando agora</p>
                          <p className="text-sm mt-1">{orders.find((o:Order) => o.id === selectedDriver.currentOrderId)?.customer}</p>
                       </div>
                    )}
                 </div>
               ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                     <p className="text-sm text-slate-500">Selecione um motoboy</p>
                  </div>
               )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// Subcomponentes auxiliares
function SidebarItem({ icon, label, active, onClick, count, collapsed }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group relative ${active ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${collapsed ? 'justify-center' : ''}`}>
      <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{icon}</div>
      {!collapsed && <span className="font-medium text-sm">{label}</span>}
      {!collapsed && count > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{count}</span>}
    </button>
  );
}
function StatCard({ label, value, color }: any) {
  return (
    <div className={`p-3 rounded-lg ${color} flex flex-col items-center justify-center border border-current/10`}>
      <span className="text-2xl font-bold tracking-tight">{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
    </div>
  );
}