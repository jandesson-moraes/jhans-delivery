import React, { useState, useMemo, useEffect } from 'react';
import { Driver, Order, Vale, Expense, Product, Client, AppConfig, Settlement } from '../types';
import { BrandLogo, SidebarBtn, StatBox, Footer } from './Shared';
import { LayoutDashboard, Users, Plus, ClipboardList, ShoppingBag, Trophy, Clock, Settings, LogOut, MapPin, Package, Trash2, Wallet, Edit, MinusCircle, CheckSquare, X, Map as MapIcon, ChefHat, FileBarChart, History, CheckCircle2, Radar } from 'lucide-react';
import { formatCurrency, formatTime, formatDate, isToday } from '../utils';
import { MenuManager } from './MenuManager';
import { ClientsView } from './ClientsView';
import { DailyOrdersView } from './DailyOrdersView';
import { KitchenDisplay } from './KitchenDisplay';
import { ItemReportView } from './ItemReportView';
import { NewOrderModal, ConfirmAssignmentModal } from './Modals'; 

type AdminViewMode = 'map' | 'list' | 'history' | 'menu' | 'clients' | 'daily' | 'kds' | 'reports';

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

// Componente de Animação de Entrada
const IntroAnimation = ({ onComplete, appName }: { onComplete: () => void, appName: string }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const t1 = setTimeout(() => setStep(1), 800);
        const t2 = setTimeout(() => setStep(2), 2000);
        const t3 = setTimeout(() => setStep(3), 3500);
        const t4 = setTimeout(onComplete, 4200);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black text-cyan-400 font-mono flex flex-col items-center justify-center p-8 select-none">
            <div className="w-full max-w-lg space-y-4">
                <div className="flex justify-between items-end border-b border-cyan-800 pb-2 mb-8">
                    <span className="text-xs opacity-50">SYS.BOOT.V17</span>
                    <span className="animate-pulse">● ONLINE</span>
                </div>

                <div className={`transition-opacity duration-500 ${step >= 0 ? 'opacity-100' : 'opacity-0'}`}>
                    {'>'} ESTABELECENDO CONEXÃO COM SATÉLITE...
                </div>
                <div className={`transition-opacity duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                    {'>'} CARREGANDO MÓDULOS DA FROTA... OK
                </div>
                <div className={`transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                    {'>'} SINCRONIZANDO DADOS GEOGRÁFICOS... OK
                </div>
                
                <div className={`mt-8 relative h-2 bg-cyan-900/30 rounded overflow-hidden transition-opacity duration-500 ${step >= 0 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute top-0 left-0 h-full bg-cyan-400 animate-drive-x w-full" style={{animationDuration: '3s'}}></div>
                </div>

                <h1 className={`text-4xl font-black text-white text-center mt-12 transition-all duration-1000 transform ${step >= 3 ? 'scale-110 opacity-100 blur-0' : 'scale-90 opacity-0 blur-sm'}`}>
                    {appName.toUpperCase()}
                </h1>
            </div>
        </div>
    );
};

export default function AdminInterface(props: AdminProps) {
    const { 
        drivers, orders, vales, expenses, products, clients, settlements, appConfig, 
        isMobile, setModal, setModalData, onLogout, onDeleteOrder, onAssignOrder, 
        setDriverToEdit, onDeleteDriver, setClientToEdit, onUpdateOrder, onCreateOrder
    } = props;
    
    const [view, setView] = useState<AdminViewMode>('map');
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [driverSidebarTab, setDriverSidebarTab] = useState<'assign' | 'history' | 'finance'>('assign');
    const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
    const [showIntro, setShowIntro] = useState(true);

    const trackDriver = (driver: Driver) => {
        if (driver.lat && driver.lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${driver.lat},${driver.lng}`, '_blank');
        } else {
            alert("Aguardando sinal de GPS...");
        }
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
        const currentCycleOrders = orders.filter((o: Order) => 
            o.driverId === selectedDriver.id && 
            o.status === 'completed' &&
            (o.completedAt?.seconds || 0) > lastSettlementTime
        );
        const currentCycleVales = vales.filter((v: Vale) => 
            v.driverId === selectedDriver.id &&
            (v.createdAt?.seconds || 0) > lastSettlementTime
        );
        
        const driverSettlements = settlements.filter(s => s.driverId === selectedDriver.id)
            .sort((a, b) => (b.endAt?.seconds || 0) - (a.endAt?.seconds || 0));

        const totalEarnings = currentCycleOrders.length * TAXA_ENTREGA;
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

    const selectedDriverOrders = useMemo(() => {
        if (!selectedDriver) return [];
        return orders.filter((o: Order) => o.driverId === selectedDriver.id && o.status === 'completed')
          .sort((a: Order, b: Order) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
    }, [orders, selectedDriver]);

    const handleCloseCycleClick = () => {
        if(!selectedDriver) return;
        setDriverToEdit(selectedDriver);
        setModalData(driverFinancials);
        setModal('closeCycle');
    };

    const initiateAssignment = (order: Order) => {
        setOrderToAssign(order);
        setModal('confirmAssign');
    };

    const confirmAssignment = () => {
        if (orderToAssign && selectedDriver) {
            onAssignOrder(orderToAssign.id, selectedDriver.id);
            setOrderToAssign(null);
        }
    };

    const handleCreateOrder = (data: any) => {
        onCreateOrder(data);
        setModal(null);
        setView('kds'); 
    };

    return (
        <div className="flex h-screen w-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
             {showIntro && <IntroAnimation appName={appConfig.appName} onComplete={() => setShowIntro(false)} />}
             
             {(props as any).modal === 'order' && (
                <NewOrderModal 
                    onClose={()=>setModal(null)} 
                    onSave={handleCreateOrder} 
                    products={products} 
                    clients={clients} 
                />
             )}

             <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col z-20 shadow-2xl h-full border-r border-slate-800">
                <div className="p-8 border-b border-slate-800"><BrandLogo size="normal" config={appConfig} /></div>
                <nav className="flex-1 p-6 space-y-3 overflow-y-auto custom-scrollbar">
                  <SidebarBtn icon={<LayoutDashboard/>} label="Monitoramento" active={view==='map'} onClick={()=>setView('map')}/>
                  <SidebarBtn icon={<ClipboardList/>} label="Pedidos do Dia" active={view==='daily'} onClick={()=>setView('daily')}/>
                  <SidebarBtn icon={<ChefHat/>} label="Cozinha (KDS)" active={view==='kds'} onClick={()=>setView('kds')}/>
                  <div className="h-px bg-slate-800 my-4 mx-2"></div>
                  <SidebarBtn icon={<Plus/>} label="Novo Pedido" onClick={()=>setModal('order')} highlight/>
                  <div className="h-px bg-slate-800 my-4 mx-2"></div>
                  <SidebarBtn icon={<Users/>} label="Equipe" active={view==='list'} onClick={()=>setView('list')}/>
                  <SidebarBtn icon={<ShoppingBag/>} label="Cardápio Digital" active={view==='menu'} onClick={()=>setView('menu')}/>
                  <SidebarBtn icon={<Trophy/>} label="Clientes" active={view==='clients'} onClick={()=>setView('clients')}/>
                  <SidebarBtn icon={<Clock/>} label="Financeiro" active={view==='history'} onClick={()=>setView('history')}/>
                  <SidebarBtn icon={<FileBarChart/>} label="Relatórios Itens" active={view==='reports'} onClick={()=>setView('reports')}/>
                </nav>
                <div className="p-6 space-y-2 border-t border-slate-800">
                    <button onClick={() => setModal('settings')} className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-slate-400 font-bold hover:text-white transition-colors hover:bg-slate-800"><Settings size={20}/> Config</button>
                    <button onClick={onLogout} className="w-full p-4 bg-slate-800 rounded-2xl flex items-center justify-center gap-3 text-slate-400 font-bold hover:text-white transition-colors"><LogOut size={20}/> Sair</button>
                </div>
             </aside>

             <main className="flex-1 flex flex-col relative overflow-hidden w-full h-full">
                <header className="h-16 md:h-20 bg-slate-900 border-b border-slate-800 px-4 md:px-10 flex items-center justify-between shadow-sm z-10 w-full shrink-0 relative">
                     <div className="flex items-center gap-3 overflow-hidden">
                         {appConfig.appLogoUrl && <img src={appConfig.appLogoUrl} className="w-8 h-8 rounded-full md:hidden object-cover" alt="Logo" />}
                         <h1 className="text-lg md:text-2xl font-extrabold text-white tracking-tight truncate flex-1 min-w-0">
                             {view === 'map' ? 'Central de Comando' : view === 'list' ? 'Gestão de Equipe' : view === 'menu' ? 'Cardápio Digital' : view === 'clients' ? 'Gestão de Clientes' : view === 'daily' ? 'Pedidos do Dia' : view === 'kds' ? 'Fila da Cozinha' : view === 'reports' ? 'Relatórios de Itens' : 'Financeiro & Relatórios'}
                         </h1>
                     </div>
                     <div className="flex items-center gap-2 md:hidden">
                         <button onClick={() => setModal('settings')} className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-xl"><Settings size={20}/></button>
                         <button onClick={onLogout} className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-xl"><LogOut size={20}/></button>
                     </div>
                </header>

                <div className="flex-1 overflow-hidden relative w-full h-full">
                    {view === 'map' && (
                       <div className="absolute inset-0 perspective-container w-full h-full">
                          {/* Plano do Chão em Perspectiva */}
                          <div className="absolute inset-0 map-plane w-full h-full">
                              {/* Drivers no Plano 3D */}
                              {drivers.map((d: Driver, index: number) => {
                                 const seed = d.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                 
                                 // Centralização (25% a 75%)
                                 const gridX = 25 + (Math.floor(seed * 17) % 50); 
                                 const gridY = 25 + (Math.floor(seed * 23) % 50); 
                                 
                                 // Escolha aleatória entre 5 rotas diferentes
                                 const pathIndex = seed % 5; 
                                 const animType = `animate-path-${pathIndex}`;
                                 
                                 // Delay aleatório negativo para desincronizar animações iguais
                                 const randomDelay = (seed % 20) * -2; // -0s até -38s

                                 // Status Color Logic
                                 const statusColor = d.status === 'delivering' ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]' : d.status === 'offline' ? 'border-slate-500 opacity-50' : 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]';

                                 return (
                                     <div key={d.id} 
                                          onClick={(e) => { e.stopPropagation(); setSelectedDriver(d); }} 
                                          className={`absolute z-30 cursor-pointer transition-transform duration-1000 ${animType}`}
                                          style={{ top: `${gridY}%`, left: `${gridX}%`, animationDelay: `${randomDelay}s` }}>
                                          
                                          {/* Container do Driver (Billboard para ficar em pé) */}
                                          <div className="relative group billboard-corrector flex flex-col items-center">
                                              
                                              {/* Avatar do Motoboy - Reduzido para w-10 h-10 (40px) */}
                                              <div className={`relative bg-slate-900 p-1 rounded-full border-[2px] ${statusColor} w-10 h-10 flex items-center justify-center transition-all hover:scale-125 hover:z-50 shadow-2xl`}>
                                                   <img src={d.avatar} className="w-full h-full object-cover rounded-full bg-slate-800" alt={d.name} style={{imageRendering: 'auto'}} />
                                                   {d.status === 'delivering' && (
                                                       <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                                                   )}
                                              </div>

                                              {/* Label Flutuante */}
                                              <div className="mt-2 bg-black/80 border border-slate-700 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg uppercase opacity-80 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                                                  {d.name.split(' ')[0]}
                                              </div>
                                          </div>
                                     </div>
                                 )
                              })}
                          </div>
                          
                          {/* Overlay 2D (Fila de Pedidos no canto) */}
                          <div className="absolute top-6 left-6 z-40 space-y-3 max-h-[60%] overflow-y-auto w-72 pr-2 custom-scrollbar pointer-events-auto">
                             <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-xs uppercase tracking-widest bg-black/50 p-2 rounded backdrop-blur border border-cyan-900/50">
                                <Radar size={14} className="animate-spin-slow"/> Radar de Pedidos
                             </div>
                             {orders.filter((o: Order) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready').map((o: Order) => (
                                <div key={o.id} className={`bg-slate-900/80 backdrop-blur-md p-3 rounded-xl shadow-2xl border-l-4 relative group animate-in slide-in-from-left-4 duration-300 ${o.status === 'ready' ? 'border-emerald-500' : o.status === 'preparing' ? 'border-blue-500' : 'border-amber-500'}`}>
                                   <div className="flex justify-between items-start mb-1"><span className="font-bold text-sm text-white truncate w-32">{o.customer}</span><span className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded text-slate-400">{o.time}</span></div>
                                   <p className="text-xs text-slate-400 truncate mb-2">{o.address}</p>
                                   <div className="flex justify-between items-center">
                                       <span className="text-sm font-bold text-emerald-400">{o.amount}</span>
                                       <span className={`text-[9px] font-bold uppercase px-1 rounded ${o.status==='ready' ? 'bg-emerald-900 text-emerald-300' : o.status==='preparing' ? 'bg-blue-900 text-blue-300' : 'bg-amber-900 text-amber-300'}`}>
                                           {o.status==='ready' ? 'PRONTO' : o.status==='preparing' ? 'COZINHA' : 'PENDENTE'}
                                       </span>
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
                                      <img src={d.avatar} className="w-16 h-16 rounded-full bg-slate-800 object-cover border-2 border-slate-700" alt={d.name}/>
                                      <div>
                                         <h3 className="font-bold text-lg text-white">{d.name}</h3>
                                         <div className="flex gap-2">
                                            <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide ${d.status==='offline'?'bg-slate-800 text-slate-500':d.status==='available'?'bg-emerald-900/30 text-emerald-400':'bg-orange-900/30 text-orange-400'}`}>{d.status}</span>
                                            <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase bg-slate-800 text-slate-400">{d.vehicle || 'Moto'}</span>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={(e)=>{e.stopPropagation(); setDriverToEdit(d); setModal('driver');}} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 transition-colors"><Edit size={18}/></button>
                                      <button onClick={(e)=>{e.stopPropagation(); onDeleteDriver(d.id)}} className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"><Trash2 size={18}/></button>
                                   </div>
                                </div>
                             ))}
                          </div>
                          <Footer />
                       </div>
                    )}

                    {view === 'daily' && <DailyOrdersView orders={orders} drivers={drivers} onDeleteOrder={onDeleteOrder} setModal={setModal} onUpdateOrder={onUpdateOrder} />}
                    {view === 'menu' && <MenuManager products={products} onCreate={props.onCreateProduct} onUpdate={props.onUpdateProduct} onDelete={props.onDeleteProduct} />}
                    {view === 'clients' && <ClientsView clients={clients} orders={delivered} setModal={setModal} setClientToEdit={setClientToEdit} />}
                    {view === 'reports' && <ItemReportView orders={orders} />}
                    {view === 'kds' && (
                        <KitchenDisplay 
                            orders={orders} 
                            products={products} 
                            drivers={drivers}
                            onUpdateStatus={onUpdateOrder} 
                            onAssignOrder={onAssignOrder}
                        />
                    )}
                    
                    {view === 'history' && (
                       <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto w-full h-full pb-40 md:pb-8 custom-scrollbar">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                              <h3 className="font-bold text-2xl text-slate-200">Fluxo de Caixa</h3>
                              <button onClick={() => setModal('expense')} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-md"><MinusCircle size={18}/> Lançar Custo</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                             <StatBox label="Saldo Atual" value={formatCurrency(finance.balance)} subtext="Caixa Real" icon={<Wallet/>} color={finance.balance >= 0 ? "bg-emerald-900/20 text-emerald-400 border-emerald-900/50" : "bg-red-900/20 text-red-400 border-red-900/50"}/>
                             <StatBox label="Entrada Hoje" value={formatCurrency(finance.todayIncome)} icon={<CheckSquare/>} color="bg-blue-900/20 text-blue-400 border-blue-900/50"/>
                             <StatBox label="Custo Hoje" value={formatCurrency(finance.todayExpenses)} subtext="Insumos" icon={<MinusCircle/>} color="bg-red-900/20 text-red-400 border-red-900/50"/>
                          </div>
                          <Footer />
                       </div>
                    )}
                </div>
             </main>

            {/* Mobile Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md text-white z-50 border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                <div className="relative flex justify-between items-center px-6 pb-4 pt-2">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-8">
                        <button onClick={()=>setModal('order')} className="bg-gradient-to-br from-orange-500 to-red-600 rounded-full p-4 shadow-xl border-4 border-slate-950 text-white transform active:scale-95 transition-transform"><Plus size={32}/></button>
                    </div>
                    <div className="flex gap-6">
                        <button onClick={()=>setView('map')} className={`flex flex-col items-center gap-1 ${view==='map'?'text-orange-500':'text-slate-400'}`}><MapPin size={22}/><span className="text-[9px] font-bold">Mapa</span></button>
                        <button onClick={()=>setView('daily')} className={`flex flex-col items-center gap-1 ${view==='daily'?'text-orange-500':'text-slate-400'}`}><ClipboardList size={22}/><span className="text-[9px] font-bold">Dia</span></button>
                    </div>
                    <div className="w-12"></div>
                    <div className="flex gap-6">
                        <button onClick={()=>setView('kds')} className={`flex flex-col items-center gap-1 ${view==='kds'?'text-orange-500':'text-slate-400'}`}><ChefHat size={22}/><span className="text-[9px] font-bold">KDS</span></button>
                        <button onClick={()=>setView('history')} className={`flex flex-col items-center gap-1 ${view==='history'?'text-orange-500':'text-slate-400'}`}><Clock size={22}/><span className="text-[9px] font-bold">Caixa</span></button>
                    </div>
                </div>
            </div>

             {/* Driver Sidebar & Modals... (Unchanged) */}
             <aside className={`fixed inset-y-0 right-0 w-full md:w-96 bg-slate-900 shadow-2xl p-0 overflow-y-auto z-[60] transition-transform duration-300 border-l border-slate-800 ${selectedDriver && view === 'map' ? 'translate-x-0' : 'translate-x-full'}`}>
                 {selectedDriver && (
                   <div className="h-full flex flex-col bg-slate-950">
                      <div className="bg-slate-900 p-6 border-b border-slate-800 sticky top-0 z-10">
                          <div className="flex justify-between items-start mb-6"><h3 className="font-bold text-white text-lg">Perfil do Motoboy</h3><button onClick={()=>setSelectedDriver(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button></div>
                          <div className="flex flex-col items-center">
                             <div className="relative mb-3"><img src={selectedDriver.avatar} className="w-24 h-24 rounded-full border-4 border-slate-800 shadow-lg object-cover" alt="Driver"/><span className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white ${selectedDriver.status==='offline'?'bg-slate-400':selectedDriver.status==='available'?'bg-emerald-500':'bg-orange-500'}`}></span></div>
                             <h2 className="font-bold text-2xl text-white">{selectedDriver.name}</h2>
                             <div className="flex items-center gap-2 mt-1"><span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{selectedDriver.plate}</span><span className="text-sm text-slate-500">{selectedDriver.vehicle}</span></div>
                             <button onClick={() => trackDriver(selectedDriver)} className="mt-5 w-full bg-blue-600/20 text-blue-400 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600/40 transition-colors border border-blue-600/30"><MapIcon size={18} /> Rastrear Posição Real</button>
                             {selectedDriver.lastUpdate && <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Sinal GPS: {formatTime(selectedDriver.lastUpdate)}</p>}
                             <button onClick={() => { setDriverToEdit(selectedDriver); setModal('vale'); }} className="mt-3 w-full border border-red-900/50 text-red-500 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-900/20 transition-colors"><MinusCircle size={16} /> Lançar Desconto / Vale</button>
                          </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                         <div className="flex w-full mt-6 bg-slate-950 p-1 rounded-xl mb-6">
                            <button onClick={() => setDriverSidebarTab('assign')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${driverSidebarTab==='assign'?'bg-slate-800 text-white shadow-md':'text-slate-500 hover:text-slate-300'}`}>Atribuir</button>
                            <button onClick={() => setDriverSidebarTab('history')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${driverSidebarTab==='history'?'bg-slate-800 text-white shadow-md':'text-slate-500 hover:text-slate-300'}`}>Entregas</button>
                            <button onClick={() => setDriverSidebarTab('finance')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${driverSidebarTab==='finance'?'bg-slate-800 text-white shadow-md':'text-slate-500 hover:text-slate-300'}`}>Financeiro</button>
                         </div>

                         {driverSidebarTab === 'assign' && (
                             <div className="space-y-3 pb-20">
                                {orders.filter((o: Order) => o.status === 'pending' || o.status === 'ready' || o.status === 'preparing').map((o: Order) => (
                                   <div key={o.id} onClick={()=>initiateAssignment(o)} className="border border-slate-800 p-4 rounded-xl hover:border-orange-500 hover:shadow-md transition-all bg-slate-900 cursor-pointer group">
                                      <div className="flex justify-between items-start mb-2">
                                          <span className="font-bold text-white">{o.customer}</span>
                                          <span className={`text-[10px] px-1 rounded uppercase font-bold ${o.status==='ready'?'bg-emerald-900 text-emerald-300':'text-amber-500'}`}>{o.status === 'ready' ? 'Pronto' : 'Pendente'}</span>
                                      </div>
                                      <div className="flex justify-between items-center mb-1">
                                          <span className="text-emerald-400 font-extrabold">{o.amount}</span>
                                          {o.serviceType==='pickup' && <span className="text-[10px] text-purple-400 border border-purple-900 px-1 rounded">Retira</span>}
                                      </div>
                                      <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">{o.address}</p>
                                      <button className="w-full bg-slate-800 text-white text-xs font-bold py-3 rounded-lg group-hover:bg-orange-600 transition-colors">Enviar para Motoboy</button>
                                   </div>
                                ))}
                                {orders.filter((o: Order) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready').length === 0 && (
                                   <div className="text-center py-10 bg-slate-900 rounded-xl border border-dashed border-slate-800"><Package className="mx-auto text-slate-500 mb-3" size={32}/><p className="text-sm text-slate-500 font-medium">Sem pedidos na fila.</p></div>
                                )}
                             </div>
                         )}

                         {driverSidebarTab === 'history' && (
                             <div className="space-y-3 pb-20">
                                 {selectedDriverOrders.map((o: Order) => (
                                     <div key={o.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                         <div className="flex justify-between mb-1"><span className="text-xs font-bold text-slate-400">{formatDate(o.completedAt)}</span></div>
                                         <p className="text-sm text-white font-medium truncate mb-1">{o.customer}</p>
                                         <p className="text-xs text-slate-500 truncate">{o.address}</p>
                                     </div>
                                 ))}
                             </div>
                         )}

                         {driverSidebarTab === 'finance' && (
                             <div className="space-y-6 pb-20">
                                 <div className="bg-slate-900 p-4 rounded-xl border border-emerald-900/50 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-2 opacity-10"><Wallet size={64}/></div>
                                     <h4 className="text-xs font-bold text-emerald-400 uppercase mb-4 tracking-wider">Ciclo Atual</h4>
                                     <div className="grid grid-cols-2 gap-4 mb-4">
                                         <div><p className="text-[10px] text-slate-500 font-bold uppercase">Entregas</p><p className="text-xl font-bold text-white">{driverFinancials.ordersCount}</p></div>
                                         <div><p className="text-[10px] text-slate-500 font-bold uppercase">Valor Bruto</p><p className="text-xl font-bold text-white">{formatCurrency(driverFinancials.total)}</p></div>
                                     </div>
                                     <div className="flex justify-between items-center mb-2 pt-2 border-t border-slate-800/50"><span className="text-xs font-bold text-slate-400">Descontos / Vales</span><span className="text-sm font-bold text-red-400">- {formatCurrency(driverFinancials.vales)}</span></div>
                                     <div className="flex justify-between items-center pt-2 border-t border-slate-800"><span className="text-sm font-bold text-white">Líquido a Pagar</span><span className="text-xl font-black text-emerald-400">{formatCurrency(driverFinancials.net)}</span></div>
                                     
                                     <button onClick={handleCloseCycleClick} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors">
                                        <CheckCircle2 size={18}/> Fechar Ciclo & Pagar
                                     </button>
                                     <p className="text-[10px] text-slate-500 mt-2 text-center">Isso zera os valores e salva no histórico.</p>
                                 </div>

                                 {driverFinancials.history.length > 0 && (
                                     <div>
                                         <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><History size={14}/> Histórico de Fechamentos</h4>
                                         <div className="space-y-2">
                                             {driverFinancials.history.map((settlement, idx) => (
                                                 <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                                                     <div>
                                                         <p className="text-xs font-bold text-white">{formatDate(settlement.endAt)}</p>
                                                         <p className="text-[10px] text-slate-500">{settlement.deliveriesCount} entregas</p>
                                                     </div>
                                                     <span className="text-sm font-bold text-emerald-400">{formatCurrency(settlement.finalAmount)}</span>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                             </div>
                         )}
                      </div>
                   </div>
                 )}
            </aside>

            {/* Renderização do Modal de Confirmação Localmente */}
            {(props as any).modal === 'confirmAssign' && (
                <ConfirmAssignmentModal 
                    onClose={() => setModal(null)}
                    onConfirm={confirmAssignment}
                    order={orderToAssign}
                    driverName={selectedDriver?.name}
                />
            )}
        </div>
    );
}