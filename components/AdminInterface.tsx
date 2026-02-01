import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Users, ShoppingBag, Utensils, Bike, Map as MapIcon, Settings, LogOut, FileText, BarChart3, ChevronRight, Menu as MenuIcon, X, CalendarCheck, ClipboardList, ChefHat, Bell, Gift, PlusCircle, Search, Trash2, Minus, Plus, Save, CheckCircle2, CreditCard, Banknote, MapPin, DollarSign, ClipboardPaste, Store, Navigation, Battery, MessageCircle, Signal, Clock, ChevronDown, Flame, Minimize2, Edit, Power, UserPlus, TrendingUp, History, LocateFixed, Car, Activity, Wallet, Calendar, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Driver, Order, Vale, Expense, Product, Client, Settlement, AppConfig, Supplier, InventoryItem, ShoppingItem, GiveawayEntry } from '../types';
import { BrandLogo, Footer, SidebarBtn, StatBox, PixIcon } from './Shared';
import { MenuManager } from './MenuManager';
import { ClientsView } from './ClientsView';
import { KitchenDisplay } from './KitchenDisplay';
import { InventoryManager } from './InventoryManager';
import { DailyOrdersView } from './DailyOrdersView';
import { AnalyticsView } from './AnalyticsView';
import { ItemReportView } from './ItemReportView';
import { NewLeadNotificationModal } from './Modals';
import { checkShopStatus, formatCurrency, normalizePhone, capitalize, toSentenceCase, sendOrderConfirmation, isToday, formatTime, formatDate } from '../utils';

// Ícone da Loja
const iconStore = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/7877/7877890.png',
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
});

// Helper para criar ícones HTML seguros
const createDriverIcon = (avatarUrl: string, status: string, lastUpdate: any) => {
    const safeAvatar = avatarUrl || 'https://cdn-icons-png.flaticon.com/512/147/147144.png';
    const now = Date.now();
    const lastTime = lastUpdate?.seconds ? lastUpdate.seconds * 1000 : 0;
    const diffSeconds = (now - lastTime) / 1000;
    const isStale = diffSeconds > 120; // 2 minutos sem sinal

    let borderColor = 'border-slate-500'; 
    let indicatorColor = 'bg-slate-500';

    if (!isStale && status !== 'offline') {
        borderColor = status === 'available' ? 'border-emerald-500' : 'border-amber-500';
        indicatorColor = status === 'available' ? 'bg-emerald-500' : 'bg-amber-500';
    }

    const html = `
        <div class="w-12 h-12 rounded-full border-4 ${borderColor} overflow-hidden shadow-2xl bg-slate-900 relative">
            <img src="${safeAvatar}" style="width: 100%; height: 100%; object-fit: cover; filter: ${isStale ? 'grayscale(100%) opacity(0.7)' : 'none'};" />
            <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${indicatorColor} border border-white shadow-sm"></div>
        </div>
    `;

    return L.divIcon({
        className: 'custom-driver-icon',
        html: html,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -24]
    });
};

interface AdminProps {
    drivers: Driver[];
    orders: Order[];
    vales: Vale[];
    expenses: Expense[];
    products: Product[];
    clients: Client[];
    settlements: Settlement[];
    suppliers: Supplier[];
    inventory: InventoryItem[];
    shoppingList: ShoppingItem[];
    giveawayEntries: GiveawayEntry[];
    appConfig: AppConfig;
    isMobile: boolean;
    setModal: (modal: any) => void;
    setModalData: (data: any) => void;
    onLogout: () => void;
    onDeleteOrder: (id: string) => void;
    onAssignOrder: (oid: string, did: string) => void;
    setDriverToEdit: (driver: Driver | null) => void;
    onDeleteDriver: (id: string) => void;
    setClientToEdit: (client: Client | null) => void;
    onUpdateOrder: (id: string, data: any) => void;
    onCreateOrder: (data: any) => void;
    onCreateDriver: (data: any) => void;
    onUpdateDriver: (id: string, data: any) => void;
    onCreateVale: (data: any) => void;
    onCreateExpense: (data: any) => void;
    onCreateProduct: (data: any) => void;
    onDeleteProduct: (id: string) => void;
    onUpdateProduct: (id: string, data: any) => void;
    onUpdateClient: (id: string, data: any) => void;
    onCloseCycle: (driverId: string, data: any) => void;
    onCreateSupplier: (data: any) => void;
    onUpdateSupplier: (id: string, data: any) => void;
    onDeleteSupplier: (id: string) => void;
    onCreateInventory: (data: any) => void;
    onUpdateInventory: (id: string, data: any) => void;
    onDeleteInventory: (id: string) => void;
    onAddShoppingItem: (name: string) => void;
    onToggleShoppingItem: (id: string, currentVal: boolean) => void;
    onDeleteShoppingItem: (id: string) => void;
    onClearShoppingList: () => void;
    setAppConfig: (config: AppConfig) => void;
    modal: any;
}

const GIVEAWAY_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3';

const IntroAnimation = ({ appName, onComplete }: { appName: string, onComplete: () => void }) => {
    const [visible, setVisible] = useState(true);
    const [fading, setFading] = useState(false);

    useEffect(() => {
        const timerFade = setTimeout(() => setFading(true), 2000);
        const timerRemove = setTimeout(() => {
            setVisible(false);
            onComplete();
        }, 2500);
        return () => { clearTimeout(timerFade); clearTimeout(timerRemove); };
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div className={`fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-500 ease-out ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800 relative z-10 animate-bounce">
                    <Utensils size={48} className="text-amber-500" />
                </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
                {appName || "Sistema Delivery"}
            </h1>
            <p className="text-slate-500 mt-2 font-mono text-xs uppercase tracking-[0.3em]">Carregando Módulos...</p>
        </div>
    );
};

// Componente Controlador do Mapa (Corrige bugs de renderização e controla movimento)
function MapHandler({ targetLocation, zoomLevel }: { targetLocation: [number, number] | null, zoomLevel: number }) {
    const map = useMap();
    
    // Corrige o bug do mapa cinza/falha de renderização ao iniciar
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);
        return () => clearTimeout(timer);
    }, [map]);

    // Controla o movimento (FlyTo)
    useEffect(() => {
        if (targetLocation) {
            map.flyTo(targetLocation, zoomLevel, { 
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [targetLocation, zoomLevel, map]);
    
    return null;
}

// --- SUB-COMPONENTE: MODAL DE DETALHES FINANCEIROS DO MOTOBOY ---
function DriverFinancialDetails({ driver, orders, settlements, vales, onClose, onSettle }: { driver: Driver, orders: Order[], settlements: Settlement[], vales: Vale[], onClose: () => void, onSettle: (driverId: string, data: any) => void }) {
    const [tab, setTab] = useState<'pending' | 'history'>('pending');

    // Cálculos do ciclo atual (Pendente)
    const currentData = useMemo(() => {
        const lastSettlementTime = driver.lastSettlementAt?.seconds || 0;
        
        // Corridas feitas DEPOIS do último pagamento
        const pendingOrders = orders.filter(o => 
            o.driverId === driver.id && 
            o.status === 'completed' && 
            (o.completedAt?.seconds || 0) > lastSettlementTime
        ).sort((a,b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));

        // Vales pegos DEPOIS do último pagamento
        const pendingVales = vales.filter(v => 
            v.driverId === driver.id && 
            (v.createdAt?.seconds || 0) > lastSettlementTime
        );

        let deliveriesValue = 0;
        if (driver.paymentModel === 'percentage') {
            deliveriesValue = pendingOrders.reduce((acc, o) => acc + (o.value * ((driver.paymentRate || 0) / 100)), 0);
        } else if (driver.paymentModel === 'fixed_per_delivery') {
            deliveriesValue = pendingOrders.length * (driver.paymentRate || 0);
        }
        // Se for salario fixo, o valor por corrida é 0 para pagamento variavel, mas contamos as entregas

        const valesValue = pendingVales.reduce((acc, v) => acc + v.amount, 0);
        const netValue = deliveriesValue - valesValue;

        return {
            orders: pendingOrders,
            vales: pendingVales,
            deliveriesCount: pendingOrders.length,
            deliveriesValue,
            valesValue,
            netValue
        };
    }, [driver, orders, vales]);

    // Histórico de Fechamentos (Settlements)
    const driverSettlements = useMemo(() => {
        return settlements
            .filter(s => s.driverId === driver.id)
            .sort((a,b) => (b.endAt?.seconds || 0) - (a.endAt?.seconds || 0));
    }, [settlements, driver]);

    const handleCloseCycle = () => {
        if (confirm(`Confirmar fechamento de ciclo para ${driver.name}?\nValor a pagar: ${formatCurrency(currentData.netValue)}`)) {
            onSettle(driver.id, {
                deliveriesCount: currentData.deliveriesCount,
                deliveriesTotal: currentData.deliveriesValue, // Valor bruto das entregas
                valesTotal: currentData.valesValue,
                valesCount: currentData.vales.length,
                finalAmount: currentData.netValue,
                startAt: driver.lastSettlementAt ? new Date(driver.lastSettlementAt.seconds * 1000).toISOString() : null,
                endAt: new Date().toISOString()
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in zoom-in duration-200">
            <div className="bg-slate-900 w-full max-w-2xl h-[85vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <img src={driver.avatar} className="w-16 h-16 rounded-full border-2 border-slate-700 object-cover" />
                        <div>
                            <h2 className="text-2xl font-black text-white">{driver.name}</h2>
                            <p className="text-sm text-slate-400 flex items-center gap-1">
                                {driver.vehicle} • {driver.plate} 
                                <span className="bg-slate-800 px-2 rounded text-xs ml-2 border border-slate-700">
                                    {driver.paymentModel === 'percentage' ? `${driver.paymentRate}%` : driver.paymentModel === 'fixed_per_delivery' ? `${formatCurrency(driver.paymentRate || 0)} / entrega` : 'Salário Fixo'}
                                </span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-900">
                    <button 
                        onClick={() => setTab('pending')}
                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${tab === 'pending' ? 'border-amber-500 text-amber-500 bg-amber-900/10' : 'border-transparent text-slate-500 hover:text-white'}`}
                    >
                        <Wallet size={18}/> A Receber (Atual)
                    </button>
                    <button 
                        onClick={() => setTab('history')}
                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${tab === 'history' ? 'border-emerald-500 text-emerald-500 bg-emerald-900/10' : 'border-transparent text-slate-500 hover:text-white'}`}
                    >
                        <History size={18}/> Histórico Pagamentos
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-900 p-6 custom-scrollbar">
                    {tab === 'pending' ? (
                        <div className="space-y-6">
                            {/* Resumo Financeiro */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={100} className="text-white"/></div>
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-1">Saldo Acumulado (Semana Atual)</p>
                                <h3 className="text-4xl font-black text-emerald-400 mb-4">{formatCurrency(currentData.netValue)}</h3>
                                
                                <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Entregas ({currentData.deliveriesCount})</p>
                                        <p className="text-lg font-bold text-white">{formatCurrency(currentData.deliveriesValue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Vales / Adiantamentos</p>
                                        <p className="text-lg font-bold text-red-400">- {formatCurrency(currentData.valesValue)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Botão Fechar Ciclo */}
                            <button 
                                onClick={handleCloseCycle}
                                disabled={currentData.netValue <= 0 && currentData.deliveriesCount === 0}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide"
                            >
                                <CheckCircle2 size={20}/> Fechar Semana & Pagar
                            </button>

                            {/* Lista de Corridas Pendentes */}
                            <div>
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2"><Bike size={18} className="text-amber-500"/> Corridas Pendentes de Pagamento</h4>
                                {currentData.orders.length === 0 ? (
                                    <p className="text-slate-500 text-sm italic">Nenhuma corrida realizada neste ciclo.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {currentData.orders.map(order => (
                                            <div key={order.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono text-slate-500 bg-slate-900 px-1 rounded">{formatDate(order.completedAt)}</span>
                                                        <span className="text-sm font-bold text-white">{order.address}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">Pedido: {order.customer}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-emerald-500 font-bold text-sm block">
                                                        {driver.paymentModel === 'fixed_per_delivery' ? formatCurrency(driver.paymentRate || 0) : driver.paymentModel === 'percentage' ? formatCurrency(order.value * ((driver.paymentRate || 0)/100)) : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // TAB HISTÓRICO
                        <div className="space-y-4">
                            <h4 className="text-white font-bold mb-2 flex items-center gap-2"><CalendarCheck size={18} className="text-blue-500"/> Pagamentos Realizados (Fechamentos)</h4>
                            {driverSettlements.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <History size={48} className="mx-auto mb-2 opacity-20"/>
                                    <p>Nenhum fechamento de caixa registrado.</p>
                                </div>
                            ) : (
                                driverSettlements.map(settlement => (
                                    <div key={settlement.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                            <span className="text-slate-400 text-xs font-bold uppercase">{formatDate({seconds: new Date(settlement.endAt).getTime()/1000})}</span>
                                            <span className="text-emerald-400 font-black text-lg">{formatCurrency(settlement.finalAmount)}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                                            <div>
                                                <span className="block font-bold text-white">{settlement.deliveriesCount}</span>
                                                Entregas
                                            </div>
                                            <div>
                                                <span className="block font-bold text-emerald-500">{formatCurrency(settlement.deliveriesTotal)}</span>
                                                Bruto
                                            </div>
                                            <div>
                                                <span className="block font-bold text-red-400">- {formatCurrency(settlement.valesTotal)}</span>
                                                Vales
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTE: PAINEL DA FROTA ---
interface FleetSidebarProps {
    drivers: Driver[];
    orders: Order[];
    settlements: Settlement[]; // Added settlements
    vales: Vale[]; // Added vales
    onClose: () => void;
    onEditDriver: (driver: Driver) => void;
    onAddDriver: () => void;
    onSettle: (driverId: string, data: any) => void; // Added settlement handler
}

function FleetSidebar({ drivers, orders, settlements, vales, onClose, onEditDriver, onAddDriver, onSettle }: FleetSidebarProps) {
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [showFinancialModal, setShowFinancialModal] = useState<Driver | null>(null);

    const calculateStats = (driver: Driver) => {
        const completedOrders = orders.filter(o => o.driverId === driver.id && o.status === 'completed');
        const todayOrders = completedOrders.filter(o => isToday(o.completedAt));
        
        let todayValue = 0;
        let totalValue = 0;
        const rate = driver.paymentRate || 0;

        if (driver.paymentModel === 'percentage') {
            todayValue = todayOrders.reduce((acc, o) => acc + (o.value * (rate / 100)), 0);
            totalValue = completedOrders.reduce((acc, o) => acc + (o.value * (rate / 100)), 0);
        } else if (driver.paymentModel === 'fixed_per_delivery') {
            todayValue = todayOrders.length * rate;
            totalValue = completedOrders.length * rate;
        }

        return {
            todayCount: todayOrders.length,
            totalCount: completedOrders.length,
            todayValue,
            totalValue
        };
    };

    return (
        <>
            <div className="absolute top-4 right-4 bottom-4 w-80 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700 z-[1000] flex flex-col overflow-hidden animate-in slide-in-from-right">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <h3 className="font-black text-white text-lg flex items-center gap-2">
                        <Bike size={20} className="text-amber-500"/> Frota ({drivers.filter(d => d.status !== 'offline').length}/{drivers.length})
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={onAddDriver} className="p-1.5 text-emerald-400 hover:text-white bg-emerald-900/30 hover:bg-emerald-600 rounded-lg transition-colors" title="Novo Motoboy">
                            <PlusCircle size={18}/>
                        </button>
                        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
                            <X size={18}/>
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                    {drivers.map(driver => {
                        const stats = calculateStats(driver);
                        const isSelected = selectedDriverId === driver.id;
                        const isOnline = driver.status !== 'offline';
                        const isDelivering = driver.status === 'delivering';

                        return (
                            <div key={driver.id} className={`rounded-xl border transition-all relative ${isSelected ? 'bg-slate-800 border-amber-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}>
                                {/* Edit Button Absolute */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onEditDriver(driver); }}
                                    className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-white bg-slate-900 hover:bg-slate-700 rounded-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Editar Cadastro"
                                >
                                    <Edit size={14}/>
                                </button>

                                {/* Header do Card */}
                                <div 
                                    onClick={() => setSelectedDriverId(isSelected ? null : driver.id)}
                                    className="p-3 flex items-center gap-3 cursor-pointer group"
                                >
                                    <div className="relative">
                                        <img src={driver.avatar} className={`w-10 h-10 rounded-full border-2 object-cover ${isOnline ? (isDelivering ? 'border-amber-500' : 'border-emerald-500') : 'border-slate-600 grayscale'}`} />
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[8px] text-white font-bold ${isOnline ? (isDelivering ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-600'}`}>
                                            {isDelivering ? <Clock size={8}/> : <CheckCircle2 size={8}/>}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-6">
                                        <p className="font-bold text-sm text-white truncate">{driver.name}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                {driver.vehicle === 'Carro' ? <Car size={10}/> : <Bike size={10}/>} {driver.vehicle}
                                                {isOnline && <span className="text-emerald-500 flex items-center gap-0.5 ml-1">• GPS <Signal size={8}/></span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Pill */}
                                <div className="px-3 pb-2 pt-0">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase inline-block ${isOnline ? (isDelivering ? 'bg-amber-900/30 text-amber-400' : 'bg-emerald-900/30 text-emerald-400') : 'bg-slate-800 text-slate-500'}`}>
                                        {isOnline ? (isDelivering ? 'Ocupado' : 'Livre') : 'Offline'}
                                    </span>
                                </div>

                                {/* Detalhes Expandidos */}
                                {isSelected && (
                                    <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 border-t border-slate-700/50 mt-2">
                                        <div className="bg-slate-900 rounded-lg p-2 grid grid-cols-2 gap-2 border border-slate-700/50 mt-2">
                                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                                <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Hoje</p>
                                                <p className="text-xs font-bold text-white">{stats.todayCount} entregas</p>
                                                <p className="text-xs font-black text-emerald-400">{formatCurrency(stats.todayValue)}</p>
                                            </div>
                                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                                <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Geral</p>
                                                <p className="text-xs font-bold text-slate-300">{stats.totalCount} total</p>
                                                <p className="text-xs font-bold text-slate-400">{formatCurrency(stats.totalValue)}</p>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setShowFinancialModal(driver)}
                                            className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700 shadow-sm"
                                        >
                                            <Wallet size={14}/> Financeiro & Histórico
                                        </button>

                                        <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 px-1 border-t border-slate-800/50 pt-2">
                                            <span className="flex items-center gap-1"><Battery size={10} className={driver.battery < 20 ? 'text-red-500' : 'text-slate-400'}/> {driver.battery}% Bateria</span>
                                            <span>Atualizado: {formatTime(driver.lastUpdate)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Financeiro */}
            {showFinancialModal && (
                <DriverFinancialDetails 
                    driver={showFinancialModal}
                    orders={orders}
                    settlements={settlements}
                    vales={vales}
                    onClose={() => setShowFinancialModal(null)}
                    onSettle={onSettle}
                />
            )}
        </>
    );
}

// --- SUB-COMPONENTE: NOVO PEDIDO MANUAL (PDV) ---
interface ManualOrderViewProps {
    products: Product[];
    clients: Client[];
    onCreateOrder: (data: any) => void;
    onClose: () => void;
    appConfig: AppConfig;
}

function ManualOrderView({ products, clients, onCreateOrder, onClose, appConfig }: ManualOrderViewProps) {
    const [cart, setCart] = useState<{product: Product, quantity: number, obs: string}[]>([]);
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [mapsLink, setMapsLink] = useState('');
    const [obs, setObs] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [isDelivery, setIsDelivery] = useState(true);
    const [searchProduct, setSearchProduct] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
    
    // Estado para controlar a visualização no mobile (Cardápio vs Carrinho/Dados)
    const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products');

    useEffect(() => {
        if (phone.length >= 8) {
            const cleanPhone = normalizePhone(phone);
            const found = clients.find((c: Client) => normalizePhone(c.phone) === cleanPhone || normalizePhone(c.phone).includes(cleanPhone));
            if (found) fillClientData(found);
        }
    }, [phone, clients]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        if (val.length >= 3) {
            const matches = clients.filter((c: Client) => c.name.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
            setClientSuggestions(matches);
        } else {
            setClientSuggestions([]);
        }
    };

    const fillClientData = (client: Client) => {
        setName(client.name);
        setPhone(client.phone);
        setAddress(client.address || '');
        if (client.mapsLink) setMapsLink(client.mapsLink);
        if (client.obs) setObs(prev => prev ? (prev.includes(client.obs || '') ? prev : prev + ' ' + client.obs) : (client.obs || ''));
        setClientSuggestions([]);
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const exists = prev.find(i => i.product.id === product.id);
            if (exists) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { product, quantity: 1, obs: '' }];
        });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const updateQuantity = (idx: number, delta: number) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[idx].quantity += delta;
            if (newCart[idx].quantity <= 0) newCart.splice(idx, 1);
            return newCart;
        });
    };

    const deliveryFee = useMemo(() => isDelivery ? 0 : 0, [isDelivery, address]);
    const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const finalTotal = cartTotal + deliveryFee;

    const handlePasteFromWhatsApp = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return alert("Área de transferência vazia!");
            
            const lines = text.split('\n');
            let foundName = '';
            let foundAddr = '';
            
            lines.forEach(line => {
                if (line.toLowerCase().includes('nome:')) foundName = line.split(':')[1].trim();
                if (line.toLowerCase().includes('endereço:') || line.toLowerCase().includes('end:')) foundAddr = line.split(':')[1].trim();
            });

            if (foundName) setName(foundName);
            if (foundAddr) setAddress(foundAddr);
            
            if(!foundName && !foundAddr) {
                setObs(text);
                alert("Não foi possível identificar campos automaticamente. O texto foi colado em Observações.");
            }
        } catch (e) {
            alert("Permissão para colar negada ou erro ao ler.");
        }
    };

    const handleSubmit = () => {
        if (!name) return alert("Informe o nome do cliente.");
        if (cart.length === 0) return alert("Carrinho vazio.");

        const itemsText = cart.map(i => `${i.quantity}x ${i.product.name}${i.obs ? `\n(Obs: ${i.obs})` : ''}`).join('\n---\n');
        
        const orderData = {
            id: `PED-${Date.now().toString().slice(-6)}`,
            customer: capitalize(name),
            phone,
            address: isDelivery ? toSentenceCase(address) : 'Retirada no Balcão',
            mapsLink,
            items: itemsText,
            amount: formatCurrency(finalTotal),
            value: finalTotal,
            paymentMethod,
            serviceType: isDelivery ? 'delivery' : 'pickup',
            deliveryFee,
            obs,
            origin: 'manual',
            status: 'pending',
            createdAt: { seconds: Date.now() / 1000 }
        };

        onCreateOrder(orderData);
        onClose(); 
    };

    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category)));
        const ORDER = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        return ['Todos', ...cats.sort((a, b) => {
            const ia = ORDER.indexOf(a);
            const ib = ORDER.indexOf(b);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return a.localeCompare(b);
        })];
    }, [products]);

    // Filtragem e Agrupamento
    const groupedProducts = useMemo(() => {
        // 1. Filtrar
        let items = products;
        if (selectedCategory !== 'Todos') items = items.filter(p => p.category === selectedCategory);
        if (searchProduct) items = items.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()));

        // 2. Agrupar
        const groups: Record<string, Product[]> = {};
        items.forEach(p => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });

        // 3. Ordenar Grupos
        const ORDER = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        return Object.keys(groups).sort((a, b) => {
             const ia = ORDER.indexOf(a);
             const ib = ORDER.indexOf(b);
             if (ia !== -1 && ib !== -1) return ia - ib;
             if (ia !== -1) return -1;
             if (ib !== -1) return 1;
             return a.localeCompare(b);
        }).map(cat => ({ category: cat, items: groups[cat] }));
    }, [products, selectedCategory, searchProduct]);

    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 md:p-8 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 w-full h-full md:max-w-[95vw] md:rounded-3xl border-none md:border border-slate-800 shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                
                {/* LADO ESQUERDO: LISTA DE PRODUTOS (CARDÁPIO) - 65% WIDTH */}
                <div className={`flex-col bg-slate-900/30 border-r border-slate-800 min-w-0 min-h-0 w-full md:w-[65%] ${mobileTab === 'cart' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 md:p-6 border-b border-slate-800 flex flex-col gap-4 bg-slate-950 md:bg-transparent shrink-0">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Cardápio</h2>
                            {/* Botão fechar mobile aparece aqui se estiver na tab produtos */}
                            <button onClick={onClose} className="md:hidden text-slate-500 ml-2"><X size={24}/></button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                                <input className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Buscar produto..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
                            </div>
                        </div>

                        {/* CATEGORY TABS */}
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar hide-scrollbar">
                            {categories.map(cat => (
                                <button 
                                    key={cat} 
                                    onClick={() => setSelectedCategory(cat)} 
                                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-24 md:pb-6 bg-slate-950/50">
                        {groupedProducts.map((group) => (
                            <div key={group.category} className="mb-8 last:mb-0">
                                {/* Header da Sessão Separado */}
                                <div className="bg-slate-900/80 backdrop-blur-sm border-l-4 border-amber-500 p-3 rounded-r-lg mb-4 sticky top-0 z-20 shadow-sm">
                                    <h3 className="text-amber-500 font-black uppercase text-sm tracking-[0.2em] flex items-center gap-2">
                                        {group.category}
                                    </h3>
                                </div>
                                
                                {/* GRID ADJUSTED: UP TO 4 COLUMNS, Reduced Height (110px) */}
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {group.items.map(p => (
                                        <div key={p.id} onClick={() => addToCart(p)} className="bg-slate-900 p-3 rounded-xl border border-slate-800 hover:border-amber-500 cursor-pointer transition-all active:scale-95 group flex flex-col justify-between shadow-md relative overflow-hidden min-h-[110px]">
                                            <div className="relative z-10">
                                                <h4 className="font-bold text-white text-sm leading-tight line-clamp-2">{p.name}</h4>
                                            </div>
                                            
                                            <div className="relative z-10 flex justify-between items-end mt-2">
                                                <span className="text-emerald-400 font-black text-xs whitespace-nowrap">{formatCurrency(p.price)}</span>
                                                <div className="bg-slate-800 p-1.5 rounded-lg text-slate-400 group-hover:text-white group-hover:bg-amber-600 transition-colors shadow-sm">
                                                    <Plus size={18}/>
                                                </div>
                                            </div>
                                            
                                            {/* Decoration */}
                                            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {groupedProducts.length === 0 && (
                            <div className="col-span-full text-center py-10 text-slate-500">Nenhum produto encontrado.</div>
                        )}
                    </div>
                </div>

                {/* LADO DIREITO: DADOS DO PEDIDO & CARRINHO - 35% WIDTH */}
                <div className={`flex-col bg-slate-950 border-l border-slate-800 relative shadow-2xl z-20 flex-1 min-h-0 w-full md:w-[35%] ${mobileTab === 'products' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2 text-amber-500"><PlusCircle size={20}/> Novo Pedido</h3>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar pb-2 md:pb-5">
                        {/* CLIENTE SECTION */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dados do Cliente</label>
                                <button onClick={handlePasteFromWhatsApp} className="text-[10px] text-amber-500 font-bold flex items-center gap-1 hover:text-amber-400 transition-colors bg-amber-900/10 px-2 py-1 rounded border border-amber-900/20">
                                    <ClipboardPaste size={12}/> Colar
                                </button>
                            </div>
                            
                            {/* TELEFONE E NOME NA MESMA LINHA */}
                            <div className="grid grid-cols-[130px_1fr] gap-3 relative">
                                <input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors placeholder-slate-600" placeholder="Tel (11)..." value={phone} onChange={e => setPhone(e.target.value)} />
                                <div className="relative">
                                    <input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors placeholder-slate-600" placeholder="Nome" value={name} onChange={handleNameChange} autoComplete="off" />
                                    {clientSuggestions.length > 0 && (
                                        <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 rounded-xl mt-1 z-50 shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                            {clientSuggestions.map(c => (
                                                <div key={c.id} onClick={() => fillClientData(c)} className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0">
                                                    <p className="text-sm font-bold text-white">{c.name}</p>
                                                    <p className="text-xs text-slate-400">{c.phone}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {isDelivery && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors placeholder-slate-600" placeholder="Endereço Completo" value={address} onChange={e => setAddress(e.target.value)} />
                                    <input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-xs text-white outline-none focus:border-amber-500 transition-colors font-mono placeholder-slate-600" placeholder="Link Google Maps (Opcional)" value={mapsLink} onChange={e => setMapsLink(e.target.value)} />
                                </div>
                            )}
                        </div>

                        {/* TOGGLE ENTREGA/RETIRA */}
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
                            <button onClick={() => setIsDelivery(true)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${isDelivery ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                                <Bike size={16}/> Entrega
                            </button>
                            <button onClick={() => setIsDelivery(false)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${!isDelivery ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                                <Store size={16}/> Retira
                            </button>
                        </div>

                        {/* ITENS LIST */}
                        <div className="flex-1 min-h-[150px]">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Itens ({cart.reduce((a,b)=>a+b.quantity,0)})</p>
                            <div className="space-y-2">
                                {cart.length === 0 ? (
                                    <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                                        Carrinho vazio
                                    </div>
                                ) : (
                                    cart.map((item, idx) => (
                                        <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col gap-2 group hover:border-slate-700 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <span className="text-white text-sm font-bold block">{item.product.name}</span>
                                                    <span className="text-emerald-400 text-xs font-bold">{formatCurrency(item.product.price * item.quantity)}</span>
                                                </div>
                                                <button onClick={() => removeFromCart(idx)} className="text-slate-600 hover:text-red-500 transition-colors p-1">
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800">
                                                    <button onClick={() => updateQuantity(idx, -1)} className="text-slate-400 hover:text-white px-2 py-1 hover:bg-slate-800 rounded-l-lg transition-colors">-</button>
                                                    <span className="text-xs text-white px-2 font-bold min-w-[20px] text-center">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(idx, 1)} className="text-slate-400 hover:text-white px-2 py-1 hover:bg-slate-800 rounded-r-lg transition-colors">+</button>
                                                </div>
                                                <input 
                                                    className="bg-transparent border-b border-slate-800 text-[10px] text-slate-400 focus:text-white outline-none flex-1 py-1 focus:border-amber-500 transition-colors placeholder-slate-600" 
                                                    placeholder="Obs do item..." 
                                                    value={item.obs} 
                                                    onChange={(e) => { const newCart = [...cart]; newCart[idx].obs = e.target.value; setCart(newCart); }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        
                        <textarea className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500 h-20 resize-none font-mono placeholder-slate-600" placeholder="Observações Gerais: Ex: Sem cebola, Campainha quebrada..." value={obs} onChange={e => setObs(e.target.value)} />
                    </div>

                    {/* FOOTER TOTAL - COMPACT */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-4 pb-24 md:pb-5 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-30">
                        {/* Payment Selection with Icons */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider">Pagamento</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => setPaymentMethod('PIX')}
                                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all active:scale-95 ${paymentMethod === 'PIX' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                                >
                                    <PixIcon size={20} className={paymentMethod === 'PIX' ? 'text-emerald-400 fill-current' : 'text-slate-500 fill-current'} />
                                    <span className="text-[9px] font-bold">PIX</span>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('Dinheiro')}
                                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all active:scale-95 ${paymentMethod === 'Dinheiro' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                                >
                                    <Banknote size={20} />
                                    <span className="text-[9px] font-bold">Dinheiro</span>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('Cartão')}
                                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all active:scale-95 ${paymentMethod === 'Cartão' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                                >
                                    <CreditCard size={20} />
                                    <span className="text-[9px] font-bold">Cartão</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</p>
                                <p className="text-2xl font-black text-white tracking-tight leading-none">{formatCurrency(finalTotal)}</p>
                            </div>
                            <button onClick={handleSubmit} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 rounded-xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wide flex items-center justify-center gap-2">
                                Confirmar <CheckCircle2 size={18}/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* MOBILE FLOATING NAVIGATION (ABAS) */}
                <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-slate-900/90 p-1.5 rounded-full border border-slate-700 shadow-2xl backdrop-blur-md">
                    <button 
                        onClick={() => setMobileTab('products')} 
                        className={`px-6 py-3 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${mobileTab === 'products' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Utensils size={16}/> Cardápio
                    </button>
                    <button 
                        onClick={() => setMobileTab('cart')} 
                        className={`px-6 py-3 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${mobileTab === 'cart' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ShoppingBag size={16}/> Pedido
                        {cart.length > 0 && <span className="bg-white text-emerald-600 px-1.5 py-0.5 rounded-full text-[9px] min-w-[1.2em] text-center shadow-sm">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
                    </button>
                </div>

            </div>
        </div>
    );
}

export function AdminInterface(props: AdminProps) {
    const [currentView, setCurrentView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showManualOrder, setShowManualOrder] = useState(false);
    const [showFleetPanel, setShowFleetPanel] = useState(false);
    
    // Auto-center map on shop location if available
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    
    useEffect(() => {
        if (props.appConfig?.location) {
            setMapCenter([props.appConfig.location.lat, props.appConfig.location.lng]);
        }
    }, [props.appConfig]);

    const handleCenterMap = () => {
        if (props.appConfig?.location) {
            // Pequeno hack para forçar re-render do MapHandler se a posição for a mesma
            setMapCenter(null); 
            setTimeout(() => setMapCenter([props.appConfig.location!.lat, props.appConfig.location!.lng]), 50);
        } else {
            alert("Localização da loja não configurada.");
        }
    };

    const handleLogout = () => {
        if (confirm("Sair do sistema?")) props.onLogout();
    };

    // Função de atalho para adicionar motoboy
    const handleAddDriver = () => {
        props.setDriverToEdit(null);
        props.setModal('driver');
    };

    // Função de atalho para editar motoboy
    const handleEditDriver = (driver: Driver) => {
        props.setDriverToEdit(driver);
        props.setModal('driver');
    };

    // Função para abrir o modal de fechamento de ciclo (passada para FleetSidebar -> DriverFinancialDetails)
    const handleSettleDriver = (driverId: string, data: any) => {
        // Encontra o driver
        const driver = props.drivers.find(d => d.id === driverId);
        if(driver) {
            props.setDriverToEdit(driver);
            props.setModalData(data);
            props.setModal('closeCycle');
        }
    }

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                   // Dashboard with Map and Stats
                   // We need Leaflet Map here showing drivers and store
                   <div className="relative w-full h-full overflow-hidden flex flex-col">
                       {/* Map Container */}
                       <div className="flex-1 relative z-0">
                           <MapContainer 
                               center={mapCenter || [-23.55052, -46.633308]} 
                               zoom={13} 
                               style={{ height: '100%', width: '100%' }}
                               className="bg-slate-900"
                               zoomControl={false}
                           >
                               <TileLayer 
                                   url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                               />
                               <MapHandler targetLocation={mapCenter} zoomLevel={13} />
                               
                               {/* Shop Marker */}
                               {props.appConfig?.location && (
                                   <Marker position={[props.appConfig.location.lat, props.appConfig.location.lng]} icon={iconStore}>
                                       <Popup className="custom-popup">
                                           <div className="text-center">
                                               <p className="font-bold">{props.appConfig.appName}</p>
                                               <p className="text-xs">Sua Loja</p>
                                           </div>
                                       </Popup>
                                   </Marker>
                               )}

                               {/* Drivers Markers */}
                               {props.drivers.map(driver => (
                                   (driver.lat && driver.lng) ? (
                                       <Marker 
                                           key={driver.id} 
                                           position={[driver.lat, driver.lng]} 
                                           icon={createDriverIcon(driver.avatar, driver.status, driver.lastUpdate)}
                                       >
                                           <Popup>
                                               <div className="text-center">
                                                   <p className="font-bold">{driver.name}</p>
                                                   <p className="text-xs uppercase">{driver.status}</p>
                                                    <p className="text-[10px] mt-1">Bateria: {driver.battery}%</p>
                                               </div>
                                           </Popup>
                                       </Marker>
                                   ) : null
                               ))}
                           </MapContainer>
                           
                           {/* Floating Stats */}
                           <div className="absolute top-4 left-4 right-4 z-[400] grid grid-cols-2 md:grid-cols-4 gap-3 pointer-events-none">
                               <div className="pointer-events-auto"><StatBox label="Pedidos Hoje" value={props.orders.filter(o => { const d = new Date(o.createdAt?.seconds*1000); const n = new Date(); return d.getDate()===n.getDate() && d.getMonth()===n.getMonth(); }).length} icon={<ShoppingBag size={18}/>} /></div>
                               <div className="pointer-events-auto"><StatBox label="Online" value={props.drivers.filter(d => d.status !== 'offline').length} icon={<Bike size={18}/>} /></div>
                               <div className="pointer-events-auto"><StatBox label="Faturamento" value={formatCurrency(props.orders.filter(o => o.status === 'completed' && new Date(o.createdAt.seconds*1000).toDateString() === new Date().toDateString()).reduce((acc, c) => acc + (c.value || 0), 0))} icon={<DollarSign size={18}/>} /></div>
                           </div>

                           {/* MAP CONTROLS (RIGHT SIDE) */}
                           <div className="absolute top-24 right-4 z-[400] flex flex-col gap-2">
                               <button 
                                   onClick={handleCenterMap}
                                   className="bg-slate-900 border border-slate-700 text-white p-3 rounded-xl shadow-xl hover:bg-slate-800 transition-colors"
                                   title="Centralizar Loja"
                               >
                                   <LocateFixed size={20} />
                               </button>
                               <button 
                                   onClick={() => setShowFleetPanel(!showFleetPanel)}
                                   className={`border p-3 rounded-xl shadow-xl transition-all ${showFleetPanel ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'}`}
                                   title="Painel da Frota"
                               >
                                   <Bike size={20} />
                               </button>
                           </div>

                           {/* FLEET PANEL OVERLAY */}
                           {showFleetPanel && (
                               <FleetSidebar 
                                   drivers={props.drivers} 
                                   orders={props.orders}
                                   settlements={props.settlements}
                                   vales={props.vales}
                                   onClose={() => setShowFleetPanel(false)}
                                   onAddDriver={handleAddDriver}
                                   onEditDriver={handleEditDriver}
                                   onSettle={handleSettleDriver}
                               />
                           )}
                       </div>
                   </div>
                );
            case 'orders': return <DailyOrdersView orders={props.orders} drivers={props.drivers} onDeleteOrder={props.onDeleteOrder} setModal={props.setModal} onUpdateOrder={props.onUpdateOrder} appConfig={props.appConfig} />;
            case 'menu': return <MenuManager products={props.products} onCreate={props.onCreateProduct} onUpdate={props.onUpdateProduct} onDelete={props.onDeleteProduct} />;
            case 'clients': return <ClientsView clients={props.clients} orders={props.orders} giveawayEntries={props.giveawayEntries} setModal={props.setModal} setClientToEdit={props.setClientToEdit} appConfig={props.appConfig} />;
            case 'kitchen': return <KitchenDisplay orders={props.orders} products={props.products} drivers={props.drivers} onUpdateStatus={props.onUpdateOrder} onAssignOrder={props.onAssignOrder} onDeleteOrder={props.onDeleteOrder} appConfig={props.appConfig} />;
            case 'inventory': return <InventoryManager inventory={props.inventory} suppliers={props.suppliers} shoppingList={props.shoppingList} onCreateSupplier={props.onCreateSupplier} onUpdateSupplier={props.onUpdateSupplier} onDeleteSupplier={props.onDeleteSupplier} onCreateInventory={props.onCreateInventory} onUpdateInventory={props.onUpdateInventory} onDeleteInventory={props.onDeleteInventory} onAddShoppingItem={props.onAddShoppingItem} onToggleShoppingItem={props.onToggleShoppingItem} onDeleteShoppingItem={props.onDeleteShoppingItem} onClearShoppingList={props.onClearShoppingList} appConfig={props.appConfig} />;
            case 'analytics': return <AnalyticsView orders={props.orders} products={props.products} />;
            case 'reports': return <ItemReportView orders={props.orders} />;
            default: return null;
        }
    };

    return (
        <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden">
            {/* Sidebar Desktop - WIDENED TO 72 (approx 10-12% increase from 64) */}
            <div className="hidden md:flex w-72 flex-col bg-slate-900 border-r border-slate-800 z-50">
                <div className="p-6">
                   <BrandLogo config={props.appConfig} />
                </div>
                <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mt-4 mb-2">Principal</p>
                    <SidebarBtn icon={<LayoutDashboard size={20}/>} label="Visão Geral" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
                    <SidebarBtn icon={<ShoppingBag size={20}/>} label="Pedidos" active={currentView === 'orders'} onClick={() => setCurrentView('orders')} />
                    <SidebarBtn icon={<Utensils size={20}/>} label="Cardápio" active={currentView === 'menu'} onClick={() => setCurrentView('menu')} />
                    
                    {/* Botão Novo Pedido Movido e Estilizado */}
                    <button onClick={() => setShowManualOrder(true)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 py-3 rounded-xl font-black text-sm shadow-lg shadow-amber-500/20 mb-4 mt-2 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] border border-amber-400/50">
                        <PlusCircle size={20} className="text-slate-900"/> NOVO PEDIDO
                    </button>
                    
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mt-6 mb-2">Operacional</p>
                    <SidebarBtn icon={<ChefHat size={20}/>} label="Cozinha (KDS)" active={currentView === 'kitchen'} onClick={() => setCurrentView('kitchen')} />
                    <SidebarBtn icon={<Users size={20}/>} label="Clientes" active={currentView === 'clients'} onClick={() => setCurrentView('clients')} />
                    {/* MOTOBOYS REMOVED FROM SIDEBAR as requested */}
                    {/* <SidebarBtn icon={<Bike size={20}/>} label="Motoboys" active={false} onClick={() => props.setModal('driver')} /> */}
                    <SidebarBtn icon={<Store size={20}/>} label="Estoque & Compras" active={currentView === 'inventory'} onClick={() => setCurrentView('inventory')} />

                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mt-6 mb-2">Gestão</p>
                    <SidebarBtn icon={<BarChart3 size={20}/>} label="Analytics" active={currentView === 'analytics'} onClick={() => setCurrentView('analytics')} />
                    <SidebarBtn icon={<FileText size={20}/>} label="Relatório de Itens" active={currentView === 'reports'} onClick={() => setCurrentView('reports')} />
                    <SidebarBtn icon={<Settings size={20}/>} label="Configurações" active={false} onClick={() => props.setModal('settings')} />
                </div>
                <div className="p-4 border-t border-slate-800">
                     <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm font-bold">
                         <LogOut size={18}/> Sair do Sistema
                     </button>
                </div>
            </div>

            {/* Mobile Header (Global) */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-slate-900 border-b border-slate-800 h-16 flex items-center px-4 justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white p-1">
                        <MenuIcon size={24}/>
                    </button>
                    <span className="font-bold text-lg text-white truncate">
                        {currentView === 'dashboard' ? 'Visão Geral' : 
                         currentView === 'orders' ? 'Pedidos' : 
                         currentView === 'menu' ? 'Cardápio' : 
                         currentView === 'kitchen' ? 'Cozinha' : 
                         currentView === 'clients' ? 'Clientes' : 
                         currentView === 'inventory' ? 'Estoque' : 
                         currentView === 'analytics' ? 'Relatórios' : 'Sistema'}
                    </span>
                </div>
                <button onClick={() => setShowManualOrder(true)} className="bg-amber-500 text-slate-900 p-2 rounded-lg shadow-lg">
                    <PlusCircle size={20}/>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="w-3/4 h-full bg-slate-900 p-6 flex flex-col border-r border-slate-800" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <BrandLogo size="small" config={props.appConfig} />
                            <button onClick={() => setSidebarOpen(false)} className="text-slate-400"><X size={24}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            <SidebarBtn icon={<LayoutDashboard size={20}/>} label="Visão Geral" active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<ShoppingBag size={20}/>} label="Pedidos" active={currentView === 'orders'} onClick={() => { setCurrentView('orders'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<Utensils size={20}/>} label="Cardápio" active={currentView === 'menu'} onClick={() => { setCurrentView('menu'); setSidebarOpen(false); }} />
                            
                            {/* Botão Novo Pedido Mobile */}
                            <button onClick={() => { setShowManualOrder(true); setSidebarOpen(false); }} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 py-3 rounded-xl font-black text-sm shadow-lg shadow-amber-500/20 mb-2 mt-2 flex items-center justify-center gap-2 border border-amber-400/50">
                                <PlusCircle size={20} className="text-slate-900"/> NOVO PEDIDO
                            </button>

                            <SidebarBtn icon={<ChefHat size={20}/>} label="Cozinha (KDS)" active={currentView === 'kitchen'} onClick={() => { setCurrentView('kitchen'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<Users size={20}/>} label="Clientes" active={currentView === 'clients'} onClick={() => { setCurrentView('clients'); setSidebarOpen(false); }} />
                            {/* Mobile Sidebar - Motoboys Link removed too to force usage of dashboard */}
                            {/* <SidebarBtn icon={<Bike size={20}/>} label="Motoboys" active={false} onClick={() => { props.setModal('driver'); setSidebarOpen(false); }} /> */}
                            <SidebarBtn icon={<Store size={20}/>} label="Estoque" active={currentView === 'inventory'} onClick={() => { setCurrentView('inventory'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<BarChart3 size={20}/>} label="Relatórios" active={currentView === 'analytics'} onClick={() => { setCurrentView('analytics'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<Settings size={20}/>} label="Configurações" active={false} onClick={() => { props.setModal('settings'); setSidebarOpen(false); }} />
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-slate-400 py-2">
                                 <LogOut size={18}/> Sair
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 relative overflow-hidden flex flex-col pt-16 md:pt-0">
                {renderContent()}
            </div>

            {/* Modals */}
            {showManualOrder && (
                <ManualOrderView 
                    products={props.products} 
                    clients={props.clients} 
                    onCreateOrder={props.onCreateOrder} 
                    onClose={() => setShowManualOrder(false)} 
                    appConfig={props.appConfig} 
                />
            )}
            
            <IntroAnimation appName={props.appConfig?.appName} onComplete={() => {}} />
        </div>
    );
}