
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Driver, Order, Vale, Expense, Product, Client, AppConfig, Settlement } from '../types';
import { BrandLogo, SidebarBtn, StatBox, Footer } from './Shared';
import { LayoutDashboard, Users, Plus, ClipboardList, ShoppingBag, Trophy, Clock, Settings, LogOut, MapPin, Package, Trash2, Wallet, Edit, MinusCircle, CheckSquare, X, Map as MapIcon, ChefHat, FileBarChart, History, CheckCircle2, Radar, Volume2, VolumeX, UserCheck, TrendingUp, FileText } from 'lucide-react';
import { formatCurrency, formatTime, formatDate, isToday } from '../utils';
import { MenuManager } from './MenuManager';
import { ClientsView } from './ClientsView';
import { KitchenDisplay } from './KitchenDisplay';
import { ItemReportView } from './ItemReportView';
import { NewOrderModal, ConfirmAssignmentModal, NewIncomingOrderModal, DispatchSuccessModal } from './Modals'; 

// Som de Alarme (Sino Repetitivo)
const NEW_ORDER_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; 

// 'list' removed from type as it's now part of 'map'
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
    const [showIntro, setShowIntro] = useState(true);
    const [newIncomingOrder, setNewIncomingOrder] = useState<Order | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(false);
    
    // Sub-aba para a seção Financeira
    const [financeTab, setFinanceTab] = useState<'overview' | 'items'>('overview');
    
    // Sub-aba para Monitoramento (Map vs Team)
    const [mapTab, setMapTab] = useState<'live' | 'team'>('live');
    
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
        // Inicializa o objeto de áudio
        const audio = new Audio(NEW_ORDER_SOUND);
        audio.loop = true; // IMPORTANTE: Loop infinito até atender
        audioRef.current = audio;

        // Popula notificados iniciais para não tocar ao abrir o sistema (apenas novos eventos)
        orders.forEach(o => {
            if(o.status !== 'pending') notifiedOrderIds.current.add(o.id);
        });

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            stopTitleFlash();
        };
    }, []); 

    // Helper para piscar o título da aba
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
            // Se estiver ativando, tenta tocar um som mudo para desbloquear o áudio do navegador
            if (!prev && audioRef.current) {
                audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
            }
            return !prev;
        });
    };

    // LÓGICA CENTRAL DE NOTIFICAÇÃO
    // Monitora as ordens. Se surgir uma pendente nova, dispara tudo.
    useEffect(() => {
        // Verifica se há algum pedido pendente que não foi notificado
        const newOrder = orders.find(o => o.status === 'pending' && !notifiedOrderIds.current.has(o.id));

        if (newOrder) {
            // 1. Marca como notificado para não disparar 2x o mesmo evento
            notifiedOrderIds.current.add(newOrder.id);
            
            // 2. Abre o Modal (Prioridade Máxima na Tela)
            setNewIncomingOrder(newOrder);

            // 3. Toca o Som em Loop (se ativado)
            if (soundEnabled && audioRef.current) {
                audioRef.current.currentTime = 0;
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => console.log("Áudio bloqueado pelo navegador:", error));
                }
            }

            // 4. Vibração (Mobile)
            if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 1000]);

            // 5. Notificação Push do Navegador (Funciona em outra aba)
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Novo Pedido de ${newOrder.customer}!`, {
                    body: `Total: ${newOrder.amount} - ${newOrder.paymentMethod}`,
                    icon: '/icon.png', // Fallback icon
                    tag: newOrder.id // Evita flood
                });
            }

            // 6. Pisca o título da aba
            startTitleFlash();
        }
    }, [orders, soundEnabled]); // Dependência em orders dispara sempre que o Firestore atualiza

    // Parar som e alerta quando o modal é fechado ou o pedido deixa de ser pendente
    useEffect(() => {
        if (!newIncomingOrder) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
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

    const TAXA_ENTREGA = 5.00;
    const driverFinancials = useMemo(() => {
        if (!selectedDriver) return { total: 0, vales: 0, net: 0, valeList: [], history: [] };
        const lastSettlementTime = selectedDriver.lastSettlementAt?.seconds || 0;
        const currentCycleOrders = orders.filter((o: Order) => o.driverId === selectedDriver.id && o.status === 'completed' && (o.completedAt?.seconds || 0) > lastSettlementTime);
        const currentCycleVales = vales.filter((v: Vale) => v.driverId === selectedDriver.id && (v.createdAt?.seconds || 0) > lastSettlementTime);
        const driverSettlements = settlements.filter(s => s.driverId === selectedDriver.id).sort((a, b) => (b.endAt?.seconds || 0) - (a.endAt?.seconds || 0));
        const totalEarnings = currentCycleOrders.length * TAXA_ENTREGA;
        const totalVales = currentCycleVales.reduce((acc: number, v: Vale) => acc + (Number(v.amount) || 0), 0);
        return { total: totalEarnings, vales: totalVales, net: totalEarnings - totalVales, valeList: currentCycleVales, ordersCount: currentCycleOrders.length, history: driverSettlements, lastSettlementDate: selectedDriver.lastSettlementAt };
    }, [orders, vales, selectedDriver, settlements]);

    const handleCreateOrder = (data: any) => { onCreateOrder(data); setModal(null); setView('kds'); };

    return (
        <div className="flex h-screen w-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
             {showIntro && <IntroAnimation appName={appConfig.appName} onComplete={() => setShowIntro(false)} />}
             <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col z-20 shadow-2xl h-full border-r border-slate-800">
                <div className="p-8 border-b border-slate-800"><BrandLogo size="normal" config={appConfig} /></div>
                <nav className="flex-1 p-6 space-y-3 overflow-y-auto custom-scrollbar">
                  <SidebarBtn icon={<LayoutDashboard/>} label="Monitoramento" active={view==='map'} onClick={()=>setView('map')}/>
                  <SidebarBtn icon={<ChefHat/>} label="Cozinha / Pedidos Dia" active={view==='kds'} onClick={()=>setView('kds')}/>
                  <div className="h-px bg-slate-800 my-4 mx-2"></div>
                  <SidebarBtn icon={<Plus/>} label="Novo Pedido" onClick={()=>setModal('order')} highlight/>
                  <div className="h-px bg-slate-800 my-4 mx-2"></div>
                  <SidebarBtn icon={<UserCheck/>} label="Clientes CRM" active={view==='clients'} onClick={()=>setView('clients')}/>
                  {/* Removed standalone Team button, integrated into Map */}
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
                    {/* MONITORAMENTO COM ABAS INTERNAS */}
                    {view === 'map' && (
                       <div className="absolute inset-0 w-full h-full flex flex-col">
                          {/* Map Tabs */}
                          <div className="absolute top-4 left-4 z-50 flex gap-2">
                              <button onClick={() => setMapTab('live')} className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg border backdrop-blur-md transition-all ${mapTab === 'live' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'}`}>
                                  Mapa Real-Time
                              </button>
                              <button onClick={() => setMapTab('team')} className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg border backdrop-blur-md transition-all ${mapTab === 'team' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'}`}>
                                  Gestão de Frota
                              </button>
                          </div>

                          {/* Live Map Layer */}
                          {mapTab === 'live' && (
                              <div className="w-full h-full perspective-container">
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
                                  <div className="absolute top-16 left-4 z-40 space-y-3 max-h-[60%] overflow-y-auto w-72 pr-2 custom-scrollbar pointer-events-none">
                                     <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-xs uppercase tracking-widest bg-black/50 p-2 rounded backdrop-blur border border-cyan-900/50 pointer-events-auto"><Radar size={14} className="animate-spin-slow"/> Radar de Pedidos</div>
                                     {orders.filter((o: Order) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready').map((o: Order) => (
                                        <div key={o.id} className={`bg-slate-900/80 backdrop-blur-md p-3 rounded-xl shadow-2xl border-l-4 relative group animate-in slide-in-from-left-4 pointer-events-auto ${o.status === 'ready' ? 'border-emerald-500' : o.status === 'preparing' ? 'border-blue-500' : 'border-amber-500'}`}>
                                           <div className="flex justify-between items-start mb-1"><span className="font-bold text-sm text-white truncate w-32">{o.customer}</span><span className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded text-slate-400">{o.time}</span></div>
                                           <p className="text-xs text-slate-400 truncate mb-2">{o.address}</p>
                                           <div className="flex justify-between items-center"><span className="text-sm font-bold text-emerald-400">{o.amount}</span><span className={`text-[9px] font-bold uppercase px-1 rounded ${o.status==='ready' ? 'bg-emerald-900 text-emerald-300' : o.status==='preparing' ? 'bg-blue-900 text-blue-300' : 'bg-amber-900 text-amber-300'}`}>{o.status==='ready' ? 'PRONTO' : o.status==='preparing' ? 'COZINHA' : 'PENDENTE'}</span></div>
                                           <button onClick={() => onDeleteOrder(o.id)} className="absolute -right-2 -top-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                                        </div>
                                     ))}
                                  </div>
                              </div>
                          )}

                          {/* Fleet Management List Layer */}
                          {mapTab === 'team' && (
                              <div className="flex-1 bg-slate-950 p-6 md:p-10 overflow-y-auto w-full h-full pb-24 custom-scrollbar pt-16">
                                  <div className="flex justify-between items-center mb-8">
                                      <h2 className="font-bold text-2xl text-white">Frota ({drivers.length})</h2>
                                      <button onClick={()=>setModal('driver')} className="bg-amber-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex gap-2 shadow-lg"><Plus size={18}/> Cadastrar</button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                     {drivers.map((d: Driver) => (
                                        <div key={d.id} className="border border-slate-800 p-5 rounded-2xl bg-slate-900 relative group cursor-pointer hover:border-amber-500/50" onClick={()=>setSelectedDriver(d)}>
                                           <div className="flex items-center gap-5"><img src={d.avatar} className="w-16 h-16 rounded-full bg-slate-800 object-cover border-2 border-slate-700" alt={d.name}/><div><h3 className="font-bold text-lg text-white">{d.name}</h3><div className="flex gap-2"><span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${d.status==='offline'?'bg-slate-800 text-slate-500':d.status==='available'?'bg-emerald-900/30 text-emerald-400':'bg-orange-900/30 text-orange-400'}`}>{d.status}</span><span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase bg-slate-800 text-slate-400">{d.vehicle || 'Moto'}</span></div></div></div>
                                           <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e)=>{e.stopPropagation(); setDriverToEdit(d); setModal('driver');}} className="p-2 bg-slate-800 text-slate-400 rounded-lg"><Edit size={18}/></button><button onClick={(e)=>{e.stopPropagation(); onDeleteDriver(d.id)}} className="p-2 bg-red-900/20 text-red-400 rounded-lg"><Trash2 size={18}/></button></div>
                                        </div>
                                     ))}
                                  </div>
                                  <Footer />
                              </div>
                          )}
                       </div>
                    )}

                    {/* OTHER VIEWS */}
                    {view === 'menu' && <MenuManager products={products} onCreate={props.onCreateProduct} onUpdate={props.onUpdateProduct} onDelete={props.onDeleteProduct} />}
                    {view === 'clients' && <ClientsView clients={clients} orders={orders} setModal={setModal} setClientToEdit={setClientToEdit} />}
                    {view === 'kds' && <KitchenDisplay orders={orders} products={products} drivers={drivers} onUpdateStatus={onUpdateOrder} onAssignOrder={handleAssignAndNotify} appConfig={appConfig} />}
                    {view === 'history' && (
                       <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto w-full h-full pb-24 custom-scrollbar">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                              <h3 className="font-bold text-2xl text-slate-200">Financeiro Integrado</h3>
                              {financeTab === 'overview' && (
                                  <button onClick={() => setModal('expense')} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex gap-2 shadow-md"><MinusCircle size={18}/> Lançar Custo</button>
                              )}
                          </div>
                          
                          {/* ABAS FINANCEIRAS */}
                          <div className="flex gap-4 mb-6 border-b border-slate-800 pb-1">
                              <button onClick={() => setFinanceTab('overview')} className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${financeTab==='overview' ? 'text-amber-500 border-amber-500' : 'text-slate-500 border-transparent hover:text-white'}`}>
                                  <div className="flex items-center gap-2"><Wallet size={16}/> Fluxo de Caixa</div>
                              </button>
                              <button onClick={() => setFinanceTab('items')} className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${financeTab==='items' ? 'text-blue-500 border-blue-500' : 'text-slate-500 border-transparent hover:text-white'}`}>
                                  <div className="flex items-center gap-2"><FileBarChart size={16}/> Relatório de Produtos</div>
                              </button>
                          </div>

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
                             <div className="flex items-center gap-2 mt-1"><span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{selectedDriver.plate}</span><span className="text-sm text-slate-500">{selectedDriver.vehicle}</span></div>
                             <button onClick={() => trackDriver(selectedDriver)} className="mt-5 w-full bg-blue-600/20 text-blue-400 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-blue-600/30"><MapIcon size={18} /> Rastrear Posição Real</button>
                             <button onClick={() => { setDriverToEdit(selectedDriver); setModal('vale'); }} className="mt-3 w-full border border-red-900/50 text-red-500 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"><MinusCircle size={16} /> Lançar Desconto / Vale</button>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                         <div className="flex w-full mt-6 bg-slate-950 p-1 rounded-xl mb-6">
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
        </div>
    );
}
