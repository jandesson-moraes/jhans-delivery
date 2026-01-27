
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Driver, Order, Vale, Expense, Product, Client, AppConfig, Settlement } from '../types';
import { BrandLogo, SidebarBtn, StatBox, Footer } from './Shared';
import { LayoutDashboard, Users, Plus, ClipboardList, ShoppingBag, Trophy, Clock, Settings, LogOut, MapPin, Package, Trash2, Wallet, Edit, MinusCircle, CheckSquare, X, Map as MapIcon, ChefHat, FileBarChart, History, CheckCircle2, Radar, Volume2, VolumeX, UserCheck, TrendingUp, FileText, Bike, Signal, Battery, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { formatCurrency, formatTime, formatDate, isToday, formatOrderId } from '../utils';
import { MenuManager } from './MenuManager';
import { ClientsView } from './ClientsView';
import { KitchenDisplay } from './KitchenDisplay';
import { ItemReportView } from './ItemReportView';
import { DailyOrdersView } from './DailyOrdersView';
import { NewOrderModal, ConfirmAssignmentModal, NewIncomingOrderModal, DispatchSuccessModal, EditOrderModal } from './Modals'; 

// Som de Alarme (Sino Repetitivo)
const NEW_ORDER_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; 

type AdminViewMode = 'map' | 'history' | 'menu' | 'clients' | 'kds';

interface AdminProps {
    drivers: Driver[];
    orders: Order[];
    vales: Vale[];
    expenses: Expense[];
    products: Product[];
    clients: Client[];
    settlements: Settlement[];
    onAssignOrder: (oid: string, did: string) => void;
    onCreateDriver: (data: any) => void;
    onUpdateDriver: (id: string, data: any) => void;
    onDeleteDriver: (id: string) => void;
    onDeleteOrder: (id: string) => void;
    onCreateOrder: (data: any) => void;
    onUpdateOrder: (id: string, data: any) => void;
    onCreateVale: (data: any) => void;
    onCreateExpense: (data: any) => void;
    onCreateProduct: (data: any) => void;
    onUpdateProduct: (id: string, data: any) => void;
    onDeleteProduct: (id: string) => void;
    onUpdateClient: (id: string, data: any) => void;
    onCloseCycle: (driverId: string, data: any) => void;
    onLogout: () => void;
    isMobile: boolean;
    appConfig: AppConfig;
    setAppConfig: (config: AppConfig) => void;
    setModal: (modal: any) => void;
    setModalData: (data: any) => void;
    setDriverToEdit: (d: Driver | null) => void;
    setClientToEdit: (c: Client | null) => void;
}

const IntroAnimation = ({ onComplete, appName }: { onComplete: () => void, appName: string }) => {
    const [step, setStep] = useState(0);
    useEffect(() => {
        const t1 = setTimeout(() => setStep(1), 500);
        const t2 = setTimeout(() => setStep(2), 1200);
        const t3 = setTimeout(() => setStep(3), 2000);
        const t4 = setTimeout(onComplete, 2600);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }, []);
    return (
        <div className="fixed inset-0 z-[100] bg-black text-cyan-400 font-mono flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-lg space-y-4">
                <div className="flex justify-between items-end border-b border-cyan-800 pb-2 mb-8 text-[10px] opacity-50"><span>SYS.V17</span><span>● ONLINE</span></div>
                <div className={`transition-opacity duration-300 ${step >= 0 ? 'opacity-100' : 'opacity-0'}`}>{'>'} CONEXÃO SATÉLITE...</div>
                <div className={`transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>{'>'} CARREGANDO FROTA... OK</div>
                <div className={`transition-opacity duration-300 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>{'>'} DADOS GEOGRÁFICOS... OK</div>
                <h1 className={`text-4xl font-black text-white text-center mt-12 transition-all duration-700 transform ${step >= 3 ? 'scale-105 opacity-100 blur-0' : 'scale-90 opacity-0 blur-sm'}`}>{appName.toUpperCase()}</h1>
            </div>
        </div>
    );
};

export default function AdminInterface(props: AdminProps) {
    const { drivers, orders, vales, expenses, products, clients, settlements, appConfig, isMobile, setModal, setModalData, onLogout, onDeleteOrder, onAssignOrder, setDriverToEdit, onDeleteDriver, setClientToEdit, onUpdateOrder, onCreateOrder } = props;
    const [view, setView] = useState<AdminViewMode>('map');
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [driverSidebarTab, setDriverSidebarTab] = useState<'assign' | 'history' | 'finance'>('assign');
    const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
    const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
    const [showIntro, setShowIntro] = useState(true);
    const [newIncomingOrder, setNewIncomingOrder] = useState<Order | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(false);
    
    // Controles de Visibilidade dos Painéis (HUD)
    const [showRadar, setShowRadar] = useState(true);
    const [showFleet, setShowFleet] = useState(true);

    // Sub-aba para a seção Financeira
    // Adicionado 'orders' para a tabela diária
    const [financeTab, setFinanceTab] = useState<'overview' | 'items' | 'orders'>('orders');
    
    const [dispatchedOrderData, setDispatchedOrderData] = useState<{order: Order, driverName: string} | null>(null);
    
    // Refs para controle de notificação
    const notifiedOrderIds = useRef<Set<string>>(new Set());
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const titleIntervalRef = useRef<any>(null);

    // Solicitar permissão de notificação ao carregar
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
        const audio = new Audio(NEW_ORDER_SOUND);
        audio.loop = true; 
        audioRef.current = audio;

        orders.forEach(o => {
            if(o.status !== 'pending') notifiedOrderIds.current.add(o.id);
        });

        // Responsividade inicial
        if (window.innerWidth < 768) {
            setShowRadar(false);
            setShowFleet(false);
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            stopTitleFlash();
        };
    }, []); 

    const startTitleFlash = () => {
        if (titleIntervalRef.current) return;
        let isOriginal = true;
        const originalTitle = document.title;
        titleIntervalRef.current = setInterval(() => {
            document.title = isOriginal ? "🔔 NOVO PEDIDO! 🔔" : originalTitle;
            isOriginal = !isOriginal;
        }, 1000);
    };

    const stopTitleFlash = () => {
        if (titleIntervalRef.current) {
            clearInterval(titleIntervalRef.current);
            titleIntervalRef.current = null;
            document.title = appConfig.appName || "Delivery System";
        }
    };

    const handleAssignAndNotify = (oid: string, did: string) => {
        onAssignOrder(oid, did);
        const order = orders.find(o => o.id === oid);
        const driver = drivers.find(d => d.id === did);
        if (order && driver) {
            setDispatchedOrderData({ order, driverName: driver.name });
        }
    };

    const initiateAssignment = (order: Order) => {
        setOrderToAssign(order);
        setModal('confirmAssign');
    };

    const toggleSound = () => {
        setSoundEnabled(prev => {
            if (!prev && audioRef.current) {
                audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
            }
            return !prev;
        });
    };

    // LÓGICA DE NOTIFICAÇÃO
    useEffect(() => {
        const newOrder = orders.find(o => o.status === 'pending' && !notifiedOrderIds.current.has(o.id));
        if (newOrder) {
            notifiedOrderIds.current.add(newOrder.id);
            setNewIncomingOrder(newOrder);
            if (soundEnabled && audioRef.current) {
                audioRef.current.currentTime = 0;
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) playPromise.catch(console.log);
            }
            if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 1000]);
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Novo Pedido de ${newOrder.customer}!`, { body: `Total: ${newOrder.amount}`, icon: '/icon.png', tag: newOrder.id });
            }
            startTitleFlash();
        }
    }, [orders, soundEnabled]);

    useEffect(() => {
        if (!newIncomingOrder) {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
            stopTitleFlash();
        }
    }, [newIncomingOrder]);

    const trackDriver = (driver: Driver) => {
        if (driver.lat && driver.lng) window.open(`https://www.google.com/maps/search/?api=1&query=${driver.lat},${driver.lng}`, '_blank');
        else alert("Aguardando GPS...");
    };

    const delivered = orders.filter((o: Order) => o.status === 'completed');
    const finance = useMemo(() => {
        const totalIncome = delivered.reduce((acc, order) => acc + (order.value || 0), 0);
        const todayIncome = delivered.filter(o => isToday(o.completedAt)).reduce((acc, order) => acc + (order.value || 0), 0);
        const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
        const todayExpenses = expenses.filter(e => isToday(e.createdAt)).reduce((acc, e) => acc + (e.amount || 0), 0);
        return { totalIncome, todayIncome, totalExpenses, todayExpenses, balance: totalIncome - totalExpenses };
    }, [delivered, expenses]);

    // LÓGICA DE GANHOS DO MOTOBOY (ATUALIZADA)
    const driverFinancials = useMemo(() => {
        if (!selectedDriver) return { total: 0, vales: 0, net: 0, valeList: [], history: [], ordersCount: 0 };
        const lastSettlementTime = selectedDriver.lastSettlementAt?.seconds || 0;
        
        const currentCycleOrders = orders.filter((o: Order) => o.driverId === selectedDriver.id && o.status === 'completed' && (o.completedAt?.seconds || 0) > lastSettlementTime);
        const currentCycleVales = vales.filter((v: Vale) => v.driverId === selectedDriver.id && (v.createdAt?.seconds || 0) > lastSettlementTime);
        const driverSettlements = settlements.filter(s => s.driverId === selectedDriver.id).sort((a, b) => (b.endAt?.seconds || 0) - (a.endAt?.seconds || 0));
        
        let totalEarnings = 0;

        if (selectedDriver.paymentModel === 'percentage') {
            totalEarnings = currentCycleOrders.reduce((acc, o) => acc + (o.value * ((selectedDriver.paymentRate || 0) / 100)), 0);
        } else if (selectedDriver.paymentModel === 'salary') {
            totalEarnings = 0; 
        } else {
            // Default: Fixed per delivery
            const rate = selectedDriver.paymentRate !== undefined ? selectedDriver.paymentRate : 5.00;
            totalEarnings = currentCycleOrders.length * rate;
        }

        const totalVales = currentCycleVales.reduce((acc: number, v: Vale) => acc + (Number(v.amount) || 0), 0);
        return { 
            total: totalEarnings, 
            vales: totalVales, 
            net: totalEarnings - totalVales, 
            valeList: currentCycleVales, 
            ordersCount: currentCycleOrders.length, 
            history: driverSettlements, 
            lastSettlementDate: selectedDriver.lastSettlementAt 
        };
    }, [orders, vales, selectedDriver, settlements]);

    const handleCreateOrder = (data: any) => { onCreateOrder(data); setModal(null); setView('kds'); };

    // --- FUNÇÕES DE STATUS DETALHADO DO MOTOBOY ---
    const getDriverDetailStatus = (d: Driver) => {
        // Se estiver offline
        if (d.status === 'offline') return { label: 'Offline', color: 'text-slate-500' };

        // Se tem um pedido atual (entregando)
        if (d.currentOrderId) {
            const currentOrder = orders.find(o => o.id === d.currentOrderId);
            if (currentOrder) {
                return { 
                    label: `Entregando ${formatOrderId(currentOrder.id)}`, 
                    sub: currentOrder.customer,
                    color: 'text-amber-400',
                    isBusy: true
                };
            }
        }

        // Se está livre, verifica a última entrega
        const lastOrder = orders
            .filter(o => o.driverId === d.id && o.status === 'completed')
            .sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0))[0];

        if (lastOrder && isToday(lastOrder.completedAt)) {
            return {
                label: 'Livre (Aguardando)',
                sub: `Entregou ${formatOrderId(lastOrder.id)} há pouco`,
                color: 'text-emerald-400',
                isBusy: false
            };
        }

        return { label: 'Livre', color: 'text-emerald-400', isBusy: false };
    };

    const isSignalFresh = (lastUpdate: any) => {
        if (!lastUpdate || !lastUpdate.seconds) return false;
        const diff = (Date.now() / 1000) - lastUpdate.seconds;
        return diff < 300; // 5 minutos
    };

    return (
        <div className="flex h-screen w-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
             {showIntro && <IntroAnimation appName={appConfig.appName} onComplete={() => setShowIntro(false)} />}
             
             {/* SIDEBAR PRINCIPAL */}
             <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col z-20 shadow-2xl h-full border-r border-slate-800">
                <div className="p-8 border-b border-slate-800"><BrandLogo size="normal" config={appConfig} /></div>
                <nav className="flex-1 p-6 space-y-3 overflow-y-auto custom-scrollbar">
                  <SidebarBtn icon={<LayoutDashboard/>} label="Monitoramento" active={view==='map'} onClick={()=>setView('map')}/>
                  <SidebarBtn icon={<ChefHat/>} label="Cozinha / Pedidos Dia" active={view==='kds'} onClick={()=>setView('kds')}/>
                  <div className="h-px bg-slate-800 my-4 mx-2"></div>
                  <SidebarBtn icon={<Plus/>} label="Novo Pedido" onClick={()=>setModal('order')} highlight/>
                  <div className="h-px bg-slate-800 my-4 mx-2"></div>
                  <SidebarBtn icon={<UserCheck/>} label="Clientes CRM" active={view==='clients'} onClick={()=>setView('clients')}/>
                  <SidebarBtn icon={<ShoppingBag/>} label="Cardápio Digital" active={view==='menu'} onClick={()=>setView('menu')}/>
                  <SidebarBtn icon={<Clock/>} label="Financeiro" active={view==='history'} onClick={()=>setView('history')}/>
                </nav>
                <div className="p-6 space-y-2 border-t border-slate-800">
                    <button onClick={() => setModal('settings')} className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center gap-3 text-slate-400 font-bold hover:text-white"><Settings size={18}/> Config</button>
                    <button onClick={onLogout} className="w-full p-3 bg-slate-800 rounded-xl flex items-center justify-center gap-3 text-slate-400 font-bold hover:text-white"><LogOut size={18}/> Sair</button>
                </div>
             </aside>

             <main className="flex-1 flex flex-col relative overflow-hidden w-full h-full">
                <header className="h-16 md:h-20 bg-slate-900 border-b border-slate-800 px-4 md:px-10 flex items-center justify-between shadow-sm z-10 w-full shrink-0">
                     <div className="flex items-center gap-3 overflow-hidden">
                         {appConfig.appLogoUrl && <img src={appConfig.appLogoUrl} className="w-8 h-8 rounded-full md:hidden object-cover" alt="Logo" />}
                         <h1 className="text-lg md:text-2xl font-extrabold text-white truncate min-w-0">{view === 'map' ? 'Central de Comando' : view === 'menu' ? 'Cardápio Digital' : view === 'clients' ? 'Gestão de Clientes' : view === 'kds' ? 'Cozinha & Pedidos' : 'Financeiro'}</h1>
                     </div>
                     <div className="flex items-center gap-2">
                         <button 
                            onClick={toggleSound} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs transition-all border shadow-lg ${soundEnabled ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                         >
                            {soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
                            {soundEnabled ? 'SOM LIGADO' : 'ATIVAR SOM'}
                         </button>
                         <button onClick={() => setModal('settings')} className="md:hidden p-2 text-slate-400 bg-slate-800 rounded-xl"><Settings size={20}/></button>
                         <button onClick={onLogout} className="md:hidden p-2 text-slate-400 bg-slate-800 rounded-xl"><LogOut size={20}/></button>
                     </div>
                </header>

                <div className="flex-1 overflow-hidden relative w-full h-full">
                    {/* --- CENTRAL DE COMANDO (MAPA + HUD) --- */}
                    {view === 'map' && (
                       <div className="absolute inset-0 w-full h-full flex flex-col overflow-hidden">
                          
                          {/* 1. HUD SUPERIOR (Métricas Rápidas) */}
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full px-6 py-2 flex items-center gap-6 shadow-2xl">
                              <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                  <span className="text-xs font-bold text-white uppercase">{drivers.filter(d => d.status !== 'offline').length} Online</span>
                              </div>
                              <div className="w-px h-4 bg-slate-700"></div>
                              <div className="flex items-center gap-2">
                                  <Radar size={14} className="text-cyan-400"/>
                                  <span className="text-xs font-bold text-white uppercase">{orders.filter(o => o.status === 'pending').length} Pendentes</span>
                              </div>
                          </div>

                          {/* 2. CAMADA DO MAPA 3D */}
                          <div className="absolute inset-0 perspective-container w-full h-full z-0">
                              <div className="absolute inset-0 map-plane w-full h-full">
                                  {drivers.map((d: Driver) => {
                                     const seed = d.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                     const gridX = 25 + (Math.floor(seed * 17) % 50); 
                                     const gridY = 25 + (Math.floor(seed * 23) % 50); 
                                     const statusColor = d.status === 'delivering' ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]' : d.status === 'offline' ? 'border-slate-500 opacity-50' : 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]';
                                     return (
                                         <div key={d.id} onClick={(e) => { e.stopPropagation(); setSelectedDriver(d); }} className={`absolute z-30 cursor-pointer animate-path-${seed % 5}`} style={{ top: `${gridY}%`, left: `${gridX}%`, animationDelay: `${(seed % 20) * -2}s` }}>
                                              <div className="relative group billboard-corrector flex flex-col items-center">
                                                  <div className={`relative bg-slate-900 p-1 rounded-full border-[2px] ${statusColor} w-10 h-10 flex items-center justify-center transition-all hover:scale-125 shadow-2xl`}><img src={d.avatar} className="w-full h-full object-cover rounded-full" alt={d.name} /></div>
                                                  <div className="mt-2 bg-black/80 border border-slate-700 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg uppercase opacity-80 group-hover:opacity-100 whitespace-nowrap">{d.name.split(' ')[0]}</div>
                                              </div>
                                         </div>
                                     )
                                  })}
                              </div>
                          </div>

                          {/* 3. PAINEL ESQUERDO: RADAR DE PEDIDOS (INTERATIVO) */}
                          {showRadar && (
                              <div className="absolute top-20 left-4 bottom-24 z-30 w-80 flex flex-col gap-3 pointer-events-none">
                                 <div className="flex items-center gap-2 mb-1 text-cyan-400 font-bold text-xs uppercase tracking-widest bg-black/60 p-3 rounded-xl backdrop-blur-md border border-cyan-500/30 shadow-lg pointer-events-auto">
                                     <Radar size={16} className="animate-spin-slow"/> Radar de Pedidos ({orders.filter(o => o.status === 'pending' || o.status === 'preparing').length})
                                 </div>
                                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-2 mask-linear-fade">
                                     {orders.filter((o: Order) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready').map((o: Order) => (
                                        <div 
                                            key={o.id} 
                                            onClick={() => o.status === 'pending' ? setNewIncomingOrder(o) : null}
                                            className={`bg-slate-900/90 backdrop-blur-md p-4 rounded-xl shadow-2xl border-l-4 relative group animate-in slide-in-from-left-4 pointer-events-auto transition-all hover:scale-105 hover:bg-slate-800 cursor-pointer ${o.status === 'ready' ? 'border-emerald-500' : o.status === 'preparing' ? 'border-blue-500' : 'border-amber-500'}`}
                                        >
                                           <div className="flex justify-between items-start mb-1">
                                               <span className="font-bold text-sm text-white truncate w-32">{o.customer}</span>
                                               <span className="text-[10px] font-bold bg-slate-950 px-2 py-1 rounded text-slate-400">{o.time}</span>
                                           </div>
                                           <p className="text-xs text-slate-400 truncate mb-2 flex items-center gap-1"><MapPin size={10}/> {o.address}</p>
                                           <div className="flex justify-between items-center">
                                               <span className="text-sm font-bold text-emerald-400">{o.amount}</span>
                                               <div className="flex items-center gap-2">
                                                   {o.status === 'pending' && (
                                                       <span className="flex items-center gap-1 text-[9px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded animate-pulse">
                                                           <AlertCircle size={10}/> ANALISAR
                                                       </span>
                                                   )}
                                                   <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${o.status==='ready' ? 'bg-emerald-900 text-emerald-300' : o.status==='preparing' ? 'bg-blue-900 text-blue-300' : 'bg-amber-900/30 text-amber-300'}`}>
                                                       {o.status==='ready' ? 'PRONTO' : o.status==='preparing' ? 'COZINHA' : 'PENDENTE'}
                                                   </span>
                                               </div>
                                           </div>
                                           <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                               <button onClick={(e) => { e.stopPropagation(); setOrderToEdit(o); }} className="bg-slate-800 text-slate-300 p-1.5 rounded-full shadow-md hover:bg-slate-700 hover:text-white" title="Editar"><Edit size={12}/></button>
                                               <button onClick={(e) => { e.stopPropagation(); if(confirm('Excluir este pedido?')) onDeleteOrder(o.id); }} className="bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-500" title="Excluir"><Trash2 size={12}/></button>
                                           </div>
                                        </div>
                                     ))}
                                 </div>
                              </div>
                          )}

                          {/* 4. PAINEL DIREITO: FROTA DETALHADA */}
                          {showFleet && (
                              <div className="absolute top-20 right-4 bottom-24 z-30 w-72 flex flex-col gap-3 pointer-events-none">
                                  <div className="flex items-center gap-2 mb-1 text-amber-400 font-bold text-xs uppercase tracking-widest bg-black/60 p-3 rounded-xl backdrop-blur-md border border-amber-500/30 shadow-lg pointer-events-auto">
                                     <Bike size={16} /> Frota Ativa ({drivers.length})
                                  </div>
                                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 pb-2">
                                      {drivers.map((d: Driver) => {
                                          const statusInfo = getDriverDetailStatus(d);
                                          const hasSignal = d.status !== 'offline' ? isSignalFresh(d.lastUpdate) : false;

                                          return (
                                              <div key={d.id} onClick={() => setSelectedDriver(d)} className="bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-xl pointer-events-auto cursor-pointer hover:border-amber-500/50 transition-all group flex flex-col gap-2">
                                                  <div className="flex items-center gap-3">
                                                      <div className="relative">
                                                          <img src={d.avatar} className="w-10 h-10 rounded-full object-cover bg-slate-800"/>
                                                          <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${d.status === 'offline' ? 'bg-slate-500' : d.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                          <h4 className="font-bold text-white text-sm truncate">{d.name}</h4>
                                                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                              <span className="bg-slate-950 px-1.5 py-0.5 rounded">{d.vehicle}</span>
                                                              {d.status !== 'offline' && (
                                                                  <span className={`flex items-center gap-0.5 ${hasSignal ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                      <Signal size={10}/> {hasSignal ? 'GPS OK' : 'Sem Sinal'}
                                                                  </span>
                                                              )}
                                                          </div>
                                                      </div>
                                                  </div>
                                                  
                                                  {/* STATUS EXPANDIDO */}
                                                  {d.status !== 'offline' && (
                                                      <div className={`text-xs bg-slate-950/50 p-2 rounded-lg border border-slate-800 ${statusInfo.isBusy ? 'border-amber-900/30' : ''}`}>
                                                          <p className={`font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
                                                          {statusInfo.sub && <p className="text-[10px] text-slate-500 truncate">{statusInfo.sub}</p>}
                                                      </div>
                                                  )}
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}

                          {/* 5. DOCK INFERIOR (CONTROLES) */}
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-2 rounded-2xl shadow-2xl">
                              <button onClick={() => setShowRadar(!showRadar)} className={`p-3 rounded-xl transition-all ${showRadar ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`} title="Radar">
                                  {showRadar ? <Radar size={20}/> : <Radar size={20} className="opacity-50"/>}
                              </button>
                              <div className="w-px h-8 bg-slate-700"></div>
                              <button onClick={() => setModal('driver')} className="bg-amber-600 hover:bg-amber-500 text-white p-3 rounded-xl shadow-lg shadow-amber-900/20 active:scale-95 transition-transform" title="Novo Motoboy">
                                  <Plus size={24}/>
                              </button>
                              <div className="w-px h-8 bg-slate-700"></div>
                              <button onClick={() => setShowFleet(!showFleet)} className={`p-3 rounded-xl transition-all ${showFleet ? 'bg-amber-900/50 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`} title="Frota">
                                  {showFleet ? <Bike size={20}/> : <Bike size={20} className="opacity-50"/>}
                              </button>
                          </div>

                       </div>
                    )}

                    {/* OTHER VIEWS */}
                    {view === 'menu' && <MenuManager products={products} onCreate={props.onCreateProduct} onUpdate={props.onUpdateProduct} onDelete={props.onDeleteProduct} />}
                    {view === 'clients' && <ClientsView clients={clients} orders={orders} setModal={setModal} setClientToEdit={setClientToEdit} />}
                    {view === 'kds' && <KitchenDisplay orders={orders} products={products} drivers={drivers} onUpdateStatus={onUpdateOrder} onAssignOrder={handleAssignAndNotify} onDeleteOrder={onDeleteOrder} appConfig={appConfig} />}
                    {view === 'history' && (
                       <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto w-full h-full pb-24 custom-scrollbar">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                              <h3 className="font-bold text-2xl text-slate-200">Financeiro Integrado</h3>
                              {financeTab === 'overview' && (
                                  <button onClick={() => setModal('expense')} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex gap-2 shadow-md"><MinusCircle size={18}/> Lançar Custo</button>
                              )}
                          </div>
                          
                          {/* ABAS FINANCEIRAS */}
                          <div className="flex gap-4 mb-6 border-b border-slate-800 pb-1 overflow-x-auto">
                              <button onClick={() => setFinanceTab('orders')} className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${financeTab==='orders' ? 'text-emerald-500 border-emerald-500' : 'text-slate-500 border-transparent hover:text-white'}`}>
                                  <div className="flex items-center gap-2"><ClipboardList size={16}/> Lista de Pedidos</div>
                              </button>
                              <button onClick={() => setFinanceTab('overview')} className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${financeTab==='overview' ? 'text-amber-500 border-amber-500' : 'text-slate-500 border-transparent hover:text-white'}`}>
                                  <div className="flex items-center gap-2"><Wallet size={16}/> Fluxo de Caixa</div>
                              </button>
                              <button onClick={() => setFinanceTab('items')} className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${financeTab==='items' ? 'text-blue-500 border-blue-500' : 'text-slate-500 border-transparent hover:text-white'}`}>
                                  <div className="flex items-center gap-2"><FileBarChart size={16}/> Relatório de Produtos</div>
                              </button>
                          </div>

                          {financeTab === 'orders' && (
                              <DailyOrdersView 
                                  orders={orders} 
                                  drivers={drivers} 
                                  onDeleteOrder={onDeleteOrder} 
                                  setModal={setModal} 
                                  onUpdateOrder={onUpdateOrder}
                                  appConfig={appConfig}
                              />
                          )}

                          {financeTab === 'overview' && (
                              <>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                      <StatBox label="Faturamento Hoje" value={formatCurrency(finance.todayIncome)} icon={<TrendingUp/>} color="bg-emerald-600 text-white" subtext="Vendas do dia atual"/>
                                      <StatBox label="Saldo Total (Caixa)" value={formatCurrency(finance.balance)} icon={<Wallet/>} color={finance.balance >= 0 ? "bg-emerald-900/20 text-emerald-400" : "bg-red-900/20 text-red-400"}/>
                                      <StatBox label="Despesas" value={formatCurrency(finance.totalExpenses)} icon={<MinusCircle/>} color="bg-red-900/20 text-red-400"/>
                                  </div>
                                  
                                  {/* Pequeno extrato de despesas recentes */}
                                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                                      <h4 className="font-bold text-white mb-4">Despesas Recentes</h4>
                                      <div className="space-y-3">
                                          {expenses.slice(0, 5).map(e => (
                                              <div key={e.id} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0">
                                                  <div>
                                                      <p className="text-white font-medium text-sm">{e.description}</p>
                                                      <p className="text-slate-500 text-xs">{formatDate(e.createdAt)}</p>
                                                  </div>
                                                  <span className="text-red-400 font-bold">- {formatCurrency(e.amount)}</span>
                                              </div>
                                          ))}
                                          {expenses.length === 0 && <p className="text-slate-500 text-sm">Nenhuma despesa lançada.</p>}
                                      </div>
                                  </div>
                              </>
                          )}

                          {financeTab === 'items' && (
                              <ItemReportView orders={orders} />
                          )}

                          <Footer />
                       </div>
                    )}
                </div>
             </main>

            <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md text-white z-50 border-t border-slate-800 pb-safe">
                <div className="relative flex justify-between items-center px-6 pb-4 pt-2">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-8"><button onClick={()=>setModal('order')} className="bg-gradient-to-br from-orange-500 to-red-600 rounded-full p-4 shadow-xl border-4 border-slate-950 text-white"><Plus size={32}/></button></div>
                    <div className="flex gap-6">
                        <button onClick={()=>setView('map')} className={`flex flex-col items-center gap-1 ${view==='map'?'text-orange-500':'text-slate-400'}`}><MapPin size={22}/><span className="text-[9px] font-bold">Monitor</span></button>
                        <button onClick={()=>setView('kds')} className={`flex flex-col items-center gap-1 ${view==='kds'?'text-orange-500':'text-slate-400'}`}><ChefHat size={22}/><span className="text-[9px] font-bold">Cozinha</span></button>
                    </div>
                    <div className="w-12"></div>
                    <div className="flex gap-6">
                        <button onClick={()=>setView('clients')} className={`flex flex-col items-center gap-1 ${view==='clients'?'text-orange-500':'text-slate-400'}`}><UserCheck size={22}/><span className="text-[9px] font-bold">CRM</span></button>
                        <button onClick={()=>setView('history')} className={`flex flex-col items-center gap-1 ${view==='history'?'text-orange-500':'text-slate-400'}`}><Clock size={22}/><span className="text-[9px] font-bold">Finanças</span></button>
                    </div>
                </div>
            </div>

            <aside className={`fixed inset-y-0 right-0 w-full md:w-96 bg-slate-900 shadow-2xl p-0 overflow-y-auto z-[60] transition-transform duration-300 border-l border-slate-800 ${selectedDriver && view === 'map' ? 'translate-x-0' : 'translate-x-full'}`}>
                 {selectedDriver && (
                   <div className="h-full flex flex-col bg-slate-950">
                      <div className="bg-slate-900 p-6 border-b border-slate-800 sticky top-0 z-10">
                          <div className="flex justify-between items-start mb-6"><h3 className="font-bold text-white text-lg">Perfil do Motoboy</h3><button onClick={()=>setSelectedDriver(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button></div>
                          <div className="flex flex-col items-center">
                             <div className="relative mb-3"><img src={selectedDriver.avatar} className="w-24 h-24 rounded-full border-4 border-slate-800 shadow-lg object-cover" alt="Driver"/><span className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white ${selectedDriver.status==='offline'?'bg-slate-400':selectedDriver.status==='available'?'bg-emerald-500':'bg-orange-500'}`}></span></div>
                             <h2 className="font-bold text-2xl text-white">{selectedDriver.name}</h2>
                             <div className="flex items-center gap-2 mt-1 mb-2">
                                 <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{selectedDriver.plate}</span>
                                 <span className="text-sm text-slate-500">{selectedDriver.vehicle}</span>
                             </div>
                             
                             {/* NOVO: Exibição do Modelo de Pagamento */}
                             <div className="mb-4 bg-emerald-900/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-400">
                                 {selectedDriver.paymentModel === 'percentage' ? `Comissão: ${selectedDriver.paymentRate}%` : selectedDriver.paymentModel === 'salary' ? 'Salário Fixo' : `Taxa: ${formatCurrency(selectedDriver.paymentRate || 5)}`}
                             </div>

                             <div className="w-full flex gap-2">
                                <button onClick={() => { setDriverToEdit(selectedDriver); setModal('driver'); }} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 py-3 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"><Edit size={14}/> Editar Dados</button>
                                <button onClick={() => trackDriver(selectedDriver)} className="flex-1 bg-blue-600/20 text-blue-400 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-600/30 hover:bg-blue-600/30 transition-colors"><MapIcon size={14} /> Rastrear</button>
                             </div>
                             <button onClick={() => { setDriverToEdit(selectedDriver); setModal('vale'); }} className="mt-2 w-full border border-red-900/50 text-red-500 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-900/10 transition-colors"><MinusCircle size={14} /> Lançar Desconto / Vale</button>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                         <div className="flex w-full mt-2 bg-slate-950 p-1 rounded-xl mb-6">
                            <button onClick={() => setDriverSidebarTab('assign')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${driverSidebarTab==='assign'?'bg-slate-800 text-white shadow-md':'text-slate-500'}`}>Atribuir</button>
                            <button onClick={() => setDriverSidebarTab('history')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${driverSidebarTab==='history'?'bg-slate-800 text-white shadow-md':'text-slate-500'}`}>Entregas</button>
                            <button onClick={() => setDriverSidebarTab('finance')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${driverSidebarTab==='finance'?'bg-slate-800 text-white shadow-md':'text-slate-500'}`}>Financeiro</button>
                         </div>
                         {driverSidebarTab === 'assign' && (
                             <div className="space-y-3 pb-20">
                                {orders.filter((o: Order) => o.status === 'pending' || o.status === 'ready' || o.status === 'preparing').map((o: Order) => (
                                   <div key={o.id} onClick={()=>initiateAssignment(o)} className="border border-slate-800 p-4 rounded-xl hover:border-orange-500 transition-all bg-slate-900 cursor-pointer group">
                                      <div className="flex justify-between items-start mb-2"><span className="font-bold text-white">{o.customer}</span><span className={`text-[10px] px-1 rounded uppercase font-bold ${o.status==='ready'?'bg-emerald-900 text-emerald-300':'text-amber-500'}`}>{o.status === 'ready' ? 'Pronto' : 'Pendente'}</span></div>
                                      <p className="text-xs text-slate-400 mb-3">{o.address}</p>
                                      <button className="w-full bg-slate-800 text-white text-xs font-bold py-3 rounded-lg group-hover:bg-orange-600 transition-colors">Enviar para Motoboy</button>
                                   </div>
                                ))}
                             </div>
                         )}
                         {driverSidebarTab === 'finance' && (
                             <div className="space-y-6 pb-20">
                                 <div className="bg-slate-900 p-4 rounded-xl border border-emerald-900/50 relative overflow-hidden">
                                     <h4 className="text-xs font-bold text-emerald-400 uppercase mb-4">Ciclo Atual</h4>
                                     <div className="grid grid-cols-2 gap-4 mb-4"><div><p className="text-[10px] text-slate-500 uppercase">Entregas</p><p className="text-xl font-bold text-white">{driverFinancials.ordersCount}</p></div><div><p className="text-[10px] text-slate-500 uppercase">Líquido</p><p className="text-xl font-bold text-emerald-400">{formatCurrency(driverFinancials.net)}</p></div></div>
                                     <button onClick={()=>{setDriverToEdit(selectedDriver); setModalData(driverFinancials); setModal('closeCycle');}} className="w-full mt-4 bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg">Fechar Ciclo & Pagar</button>
                                 </div>
                             </div>
                         )}
                      </div>
                   </div>
                 )}
            </aside>
            {/* O MODAL DE NOVO PEDIDO AGORA É GLOBAL E TEM PRIORIDADE SOBRE TUDO */}
            {newIncomingOrder && (
                <NewIncomingOrderModal 
                    order={newIncomingOrder} 
                    onClose={() => setNewIncomingOrder(null)} 
                    appConfig={appConfig}
                    onAccept={onUpdateOrder}
                />
            )}
            
            {dispatchedOrderData && (
                <DispatchSuccessModal 
                    data={dispatchedOrderData} 
                    onClose={() => setDispatchedOrderData(null)} 
                    appName={appConfig.appName}
                />
            )}
            {(props as any).modal === 'confirmAssign' && <ConfirmAssignmentModal 
                onClose={() => setModal(null)} 
                onConfirm={() => { 
                    if (orderToAssign && selectedDriver) {
                        handleAssignAndNotify(orderToAssign.id, selectedDriver.id);
                    }
                    setModal(null);
                    setOrderToAssign(null); 
                }} 
                order={orderToAssign} 
                driverName={selectedDriver?.name} 
            />}
            {(props as any).modal === 'order' && <NewOrderModal onClose={()=>setModal(null)} onSave={handleCreateOrder} products={products} clients={clients} />}
            {orderToEdit && (
                <EditOrderModal 
                    order={orderToEdit} 
                    onClose={() => setOrderToEdit(null)} 
                    onSave={onUpdateOrder} 
                />
            )}
        </div>
    );
}