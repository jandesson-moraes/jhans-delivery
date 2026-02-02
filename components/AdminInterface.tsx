
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Users, ShoppingBag, Utensils, Bike, Map as MapIcon, Settings, LogOut, FileText, BarChart3, ChevronRight, Menu as MenuIcon, X, CalendarCheck, ClipboardList, ChefHat, Bell, Gift, PlusCircle, Search, Trash2, Minus, Plus, Save, CheckCircle2, CreditCard, Banknote, MapPin, DollarSign, ClipboardPaste, Store, Navigation, Battery, MessageCircle, Signal, Clock, ChevronDown, Flame, Minimize2, Edit, Power, UserPlus, TrendingUp, History, LocateFixed, Car, Activity, Wallet, Calendar, ArrowRight, ArrowLeft, User } from 'lucide-react';
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
import { NewOrderModal, ReceiptModal, GenericConfirmModal } from './Modals';
import { checkShopStatus, formatCurrency, normalizePhone, capitalize, toSentenceCase, sendOrderConfirmation, isToday, formatTime, formatDate } from '../utils';

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
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const IntroAnimation = ({ appName, appLogo, onComplete }: { appName: string, appLogo?: string, onComplete: () => void }) => {
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
                    {appLogo ? (
                        <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-lg">
                            <img src={appLogo} alt={appName} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <Utensils size={48} className="text-amber-500" />
                    )}
                </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
                {appName || "Sistema Delivery"}
            </h1>
            <p className="text-slate-500 mt-2 font-mono text-xs uppercase tracking-[0.3em]">Carregando Módulos...</p>
        </div>
    );
};

// --- COMPONENTES INTERNOS ---

const MapHandler = ({ targetLocation, zoomLevel }: { targetLocation: [number, number] | null, zoomLevel: number }) => {
    const map = useMap();
    useEffect(() => {
        if (targetLocation) {
            map.flyTo(targetLocation, zoomLevel, { duration: 1.5 });
        }
    }, [targetLocation, zoomLevel, map]);
    return null;
};

const DriverFinancialDetails = ({ driver, orders, vales, settlements, onSettle }: any) => {
    const lastSettlementTime = driver.lastSettlementAt?.seconds || 0;
    const currentDeliveries = orders.filter((o: Order) => o.status === 'completed' && o.driverId === driver.id && (o.completedAt?.seconds || 0) > lastSettlementTime);
    const currentVales = vales.filter((v: Vale) => v.driverId === driver.id && (v.createdAt?.seconds || 0) > lastSettlementTime);

    let totalDeliveriesValue = 0;
    if (driver.paymentModel === 'percentage') {
          totalDeliveriesValue = currentDeliveries.reduce((acc: number, o: Order) => acc + (o.value * ((driver.paymentRate || 0) / 100)), 0);
    } else if (driver.paymentModel === 'salary') {
          totalDeliveriesValue = 0;
    } else {
          const rate = driver.paymentRate !== undefined ? driver.paymentRate : 5.00;
          totalDeliveriesValue = currentDeliveries.length * rate;
    }

    const totalValesValue = currentVales.reduce((acc: number, v: Vale) => acc + (Number(v.amount) || 0), 0);
    const netValue = totalDeliveriesValue - totalValesValue;

    const handleSettleClick = () => {
         onSettle(driver.id, {
             driverId: driver.id,
             startAt: driver.lastSettlementAt ? new Date(driver.lastSettlementAt.seconds * 1000) : new Date(0),
             endAt: new Date(),
             deliveriesCount: currentDeliveries.length,
             deliveriesTotal: totalDeliveriesValue,
             valesTotal: totalValesValue,
             finalAmount: netValue
         });
    };

    return (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3">
             <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                 <h4 className="font-bold text-white text-sm">Resumo Atual</h4>
                 <span className="text-xs text-slate-500">Desde último acerto</span>
             </div>
             <div className="grid grid-cols-2 gap-2 text-xs">
                 <div className="bg-slate-950 p-2 rounded">
                     <p className="text-slate-500">Entregas</p>
                     <p className="font-bold text-white">{currentDeliveries.length} ({formatCurrency(totalDeliveriesValue)})</p>
                 </div>
                 <div className="bg-slate-950 p-2 rounded">
                     <p className="text-slate-500">Vales</p>
                     <p className="font-bold text-red-400">- {formatCurrency(totalValesValue)}</p>
                 </div>
             </div>
             <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                 <span className="text-xs font-bold text-slate-400">A PAGAR</span>
                 <span className={`font-black text-sm ${netValue > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>{formatCurrency(netValue)}</span>
             </div>
             <button onClick={handleSettleClick} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                 Fechar Ciclo / Pagar
             </button>
        </div>
    );
};

const FleetSidebar = ({ drivers, orders, settlements, vales, onClose, onAddDriver, onEditDriver, onSettle }: any) => {
    return (
        <div className="absolute top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-[500] flex flex-col animate-in slide-in-from-right duration-300">
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                 <h3 className="font-bold text-white flex items-center gap-2"><Bike size={20}/> Frota ({drivers.length})</h3>
                 <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded"><X size={20} className="text-slate-400"/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                 <button onClick={onAddDriver} className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 text-sm font-bold flex items-center justify-center gap-2 transition-all">
                     <PlusCircle size={16}/> Cadastrar Motoboy
                 </button>
                 {drivers.map((driver: Driver) => (
                     <div key={driver.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                         <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden"><img src={driver.avatar} className="w-full h-full object-cover" alt="Avatar"/></div>
                                 <div>
                                     <p className="font-bold text-white text-sm">{driver.name}</p>
                                     <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${driver.status === 'available' ? 'bg-emerald-900/30 text-emerald-400' : driver.status === 'offline' ? 'bg-slate-800 text-slate-500' : 'bg-amber-900/30 text-amber-400'}`}>{driver.status}</span>
                                 </div>
                             </div>
                             <button onClick={() => onEditDriver(driver)} className="text-slate-500 hover:text-white"><Edit size={16}/></button>
                         </div>
                         <DriverFinancialDetails driver={driver} orders={orders} vales={vales} settlements={settlements} onSettle={onSettle} />
                     </div>
                 ))}
             </div>
        </div>
    );
};

const ManualOrderView = ({ products, clients, onCreateOrder, onClose, appConfig, orderToEdit }: any) => {
    const [cart, setCart] = useState<{product: Product, quantity: number, obs: string}[]>([]);
    const [customerPhone, setCustomerPhone] = useState(orderToEdit ? orderToEdit.phone : '');
    const [customerName, setCustomerName] = useState(orderToEdit ? orderToEdit.customer : '');
    const [address, setAddress] = useState(orderToEdit ? orderToEdit.address : '');
    const [paymentMethod, setPaymentMethod] = useState(orderToEdit ? orderToEdit.paymentMethod : 'Dinheiro');
    const [serviceType, setServiceType] = useState<'delivery'|'pickup'>(orderToEdit ? (orderToEdit.serviceType || 'delivery') : 'delivery');
    const [deliveryFee, setDeliveryFee] = useState(orderToEdit ? (orderToEdit.deliveryFee || 0) : 0);
    const [obs, setObs] = useState(orderToEdit ? (orderToEdit.obs || '') : '');
    const [searchProduct, setSearchProduct] = useState('');

    useEffect(() => {
        // Lógica simplificada de preenchimento de carrinho se necessário.
        // Como o parsing reverso é complexo, para edição, focamos nos campos principais.
        // Se for um novo pedido, o carrinho começa vazio.
    }, [orderToEdit]);

    const handlePhoneBlur = () => {
        const clean = normalizePhone(customerPhone);
        const client = clients.find((c: Client) => normalizePhone(c.phone) === clean);
        if (client) {
            setCustomerName(client.name);
            setAddress(client.address);
        }
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if(existing) return prev.map(i => i.product.id === product.id ? {...i, quantity: i.quantity + 1} : i);
            return [...prev, { product, quantity: 1, obs: '' }];
        });
    };
    
    const updateQuantity = (idx: number, delta: number) => {
        const newCart = [...cart];
        newCart[idx].quantity += delta;
        if(newCart[idx].quantity <= 0) newCart.splice(idx, 1);
        setCart(newCart);
    };

    const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0) + deliveryFee;

    const handleSubmit = () => {
        if (!customerName) return alert("Nome do cliente obrigatório");
        if (cart.length === 0 && !orderToEdit) return alert("Carrinho vazio");

        // Constrói string dos itens
        const itemsText = cart.map(i => `${i.quantity}x ${i.product.name}${i.obs ? ` (${i.obs})` : ''}`).join('\n');

        const orderData = {
            id: orderToEdit ? orderToEdit.id : undefined,
            customer: customerName,
            phone: customerPhone,
            address: serviceType === 'delivery' ? address : 'Balcão',
            items: itemsText || (orderToEdit ? orderToEdit.items : ''),
            amount: formatCurrency(total || (orderToEdit ? orderToEdit.value : 0)),
            value: total || (orderToEdit ? orderToEdit.value : 0),
            paymentMethod,
            serviceType,
            deliveryFee,
            obs,
            origin: 'manual',
            status: orderToEdit ? orderToEdit.status : 'pending'
        };

        onCreateOrder(orderData);
        onClose();
    };
    
    const filteredProducts = products.filter((p: Product) => p.name.toLowerCase().includes(searchProduct.toLowerCase()));

    return (
        <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col md:flex-row animate-in slide-in-from-bottom-10">
            {/* Left: Product Selection */}
            <div className="flex-1 flex flex-col border-r border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-white"><ArrowLeft/></button>
                    <input className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" placeholder="Buscar produto..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} autoFocus />
                </div>
                <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 content-start custom-scrollbar">
                    {filteredProducts.map((p: Product) => (
                        <button key={p.id} onClick={() => addToCart(p)} className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-amber-500 text-left transition-all active:scale-95">
                            <p className="font-bold text-white text-sm line-clamp-1">{p.name}</p>
                            <p className="text-amber-500 font-bold text-xs">{formatCurrency(p.price)}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Order Details */}
            <div className="w-full md:w-96 bg-slate-950 p-4 flex flex-col border-l border-slate-800 overflow-y-auto custom-scrollbar">
                <h3 className="font-bold text-white text-xl mb-4">Novo Pedido</h3>
                
                <div className="space-y-3 mb-4">
                    <input className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-sm" placeholder="Telefone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} onBlur={handlePhoneBlur} />
                    <input className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-sm" placeholder="Nome do Cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    <div className="flex gap-2">
                        <button onClick={() => setServiceType('delivery')} className={`flex-1 p-2 rounded-lg text-xs font-bold ${serviceType === 'delivery' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-500'}`}>Entrega</button>
                        <button onClick={() => setServiceType('pickup')} className={`flex-1 p-2 rounded-lg text-xs font-bold ${serviceType === 'pickup' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-500'}`}>Balcão</button>
                    </div>
                    {serviceType === 'delivery' && (
                        <input className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-sm" placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} />
                    )}
                </div>

                <div className="flex-1 bg-slate-900 rounded-xl p-3 mb-4 overflow-y-auto space-y-2 max-h-60 custom-scrollbar">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                            <div>
                                <p className="text-white font-medium">{item.product.name}</p>
                                <p className="text-amber-500 text-xs">{formatCurrency(item.product.price)}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-950 rounded p-1">
                                <button onClick={() => updateQuantity(idx, -1)} className="px-2 text-slate-400">-</button>
                                <span className="text-white font-bold">{item.quantity}</span>
                                <button onClick={() => updateQuantity(idx, 1)} className="px-2 text-slate-400">+</button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <p className="text-center text-slate-500 text-sm py-4">Carrinho vazio</p>}
                </div>

                <div className="space-y-3 mt-auto">
                     <select className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-sm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                         <option value="Dinheiro">Dinheiro</option>
                         <option value="PIX">PIX</option>
                         <option value="Cartão">Cartão</option>
                     </select>
                     {serviceType === 'delivery' && (
                         <div className="flex justify-between items-center text-sm">
                             <span className="text-slate-400">Taxa Entrega</span>
                             <input type="number" className="w-20 bg-slate-900 border border-slate-800 rounded p-1 text-right text-white" value={deliveryFee} onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)} />
                         </div>
                     )}
                     <div className="flex justify-between items-center text-lg font-bold text-white pt-2 border-t border-slate-800">
                         <span>Total</span>
                         <span>{formatCurrency(total)}</span>
                     </div>
                     <button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg">Confirmar Pedido</button>
                </div>
            </div>
        </div>
    );
};

export function AdminInterface(props: AdminProps) {
    const [currentView, setCurrentView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showManualOrder, setShowManualOrder] = useState(false);
    const [showFleetPanel, setShowFleetPanel] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    
    // NEW: Alert State
    const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
    const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
    
    // Tracking for new orders
    const processedOrderIds = useRef<Set<string>>(new Set());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Auto-center map on shop location if available
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    
    useEffect(() => {
        if (props.appConfig?.location) {
            setMapCenter([props.appConfig.location.lat, props.appConfig.location.lng]);
        }
    }, [props.appConfig]);

    // Audio Init
    useEffect(() => {
        audioRef.current = new Audio(NOTIFICATION_SOUND);
        props.orders.forEach(o => {
            if (o.status === 'pending') processedOrderIds.current.add(o.id);
        });
    }, []);

    // Monitoring Orders
    useEffect(() => {
        const pendingOrders = props.orders.filter(o => o.status === 'pending');
        let hasNew = false;
        let latestNewOrder: Order | null = null;

        pendingOrders.forEach(order => {
            if (!processedOrderIds.current.has(order.id)) {
                hasNew = true;
                latestNewOrder = order;
                processedOrderIds.current.add(order.id);
            }
        });

        if (hasNew && latestNewOrder) {
            setNewOrderAlert(latestNewOrder);
            try {
                audioRef.current?.play();
                if ("vibrate" in navigator) navigator.vibrate([500, 200, 500]);
            } catch (e) {
                console.error("Audio play failed", e);
            }
        }
    }, [props.orders]);

    const handleCenterMap = () => {
        if (props.appConfig?.location) {
            setMapCenter(null); 
            setTimeout(() => setMapCenter([props.appConfig.location!.lat, props.appConfig.location!.lng]), 50);
        } else {
            alert("Localização da loja não configurada.");
        }
    };

    const handleLogout = () => { setShowLogoutConfirm(true); };
    const handleAddDriver = () => { props.setDriverToEdit(null); props.setModal('driver'); };
    const handleEditDriver = (driver: Driver) => { props.setDriverToEdit(driver); props.setModal('driver'); };
    const handleSettleDriver = (driverId: string, data: any) => { const driver = props.drivers.find(d => d.id === driverId); if(driver) { props.setDriverToEdit(driver); props.setModalData(data); props.setModal('closeCycle'); } }

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                   <div className="relative w-full h-full overflow-hidden flex flex-col">
                       <div className="flex-1 relative z-0">
                           <MapContainer center={mapCenter || [-23.55052, -46.633308]} zoom={13} style={{ height: '100%', width: '100%' }} className="bg-slate-900" zoomControl={false} attributionControl={false}>
                               <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' />
                               <MapHandler targetLocation={mapCenter} zoomLevel={13} />
                               {props.appConfig?.location && (<Marker position={[props.appConfig.location.lat, props.appConfig.location.lng]} icon={iconStore}><Popup className="custom-popup"><div className="text-center"><p className="font-bold">{props.appConfig.appName}</p><p className="text-xs">Sua Loja</p></div></Popup></Marker>)}
                               {props.drivers.map(driver => ((driver.lat && driver.lng) ? (<Marker key={driver.id} position={[driver.lat, driver.lng]} icon={createDriverIcon(driver.avatar, driver.status, driver.lastUpdate)}><Popup><div className="text-center"><p className="font-bold">{driver.name}</p><p className="text-xs uppercase">{driver.status}</p><p className="text-[10px] mt-1">Bateria: {driver.battery}%</p></div></Popup></Marker>) : null))}
                           </MapContainer>
                           <div className="absolute top-4 left-4 right-4 z-[400] grid grid-cols-2 md:grid-cols-4 gap-3 pointer-events-none"><div className="pointer-events-auto"><StatBox label="Pedidos Hoje" value={props.orders.filter(o => { const d = new Date(o.createdAt?.seconds*1000); const n = new Date(); return d.getDate()===n.getDate() && d.getMonth()===n.getMonth(); }).length} icon={<ShoppingBag size={18}/>} /></div><div className="pointer-events-auto"><StatBox label="Online" value={props.drivers.filter(d => d.status !== 'offline').length} icon={<Bike size={18}/>} /></div><div className="pointer-events-auto"><StatBox label="Faturamento" value={formatCurrency(props.orders.filter(o => o.status === 'completed' && new Date(o.createdAt.seconds*1000).toDateString() === new Date().toDateString()).reduce((acc, c) => acc + (c.value || 0), 0))} icon={<DollarSign size={18}/>} /></div></div>
                           <div className="absolute top-24 right-4 z-[400] flex flex-col gap-2"><button onClick={handleCenterMap} className="bg-slate-900 border border-slate-700 text-white p-3 rounded-xl shadow-xl hover:bg-slate-800 transition-colors" title="Centralizar Loja"><LocateFixed size={20} /></button><button onClick={() => setShowFleetPanel(!showFleetPanel)} className={`border p-3 rounded-xl shadow-xl transition-all ${showFleetPanel ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'}`} title="Painel da Frota"><Bike size={20} /></button></div>
                           {showFleetPanel && (<FleetSidebar drivers={props.drivers} orders={props.orders} settlements={props.settlements} vales={props.vales} onClose={() => setShowFleetPanel(false)} onAddDriver={handleAddDriver} onEditDriver={handleEditDriver} onSettle={handleSettleDriver} />)}
                           
                           {/* Developer Credits Overlay */}
                           <div className="absolute bottom-6 right-1/2 translate-x-1/2 md:translate-x-0 md:right-4 md:bottom-4 z-[400] pointer-events-none">
                                <div className="bg-slate-900/90 backdrop-blur border border-slate-800 px-6 py-3 rounded-2xl shadow-xl flex flex-col items-center justify-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1 whitespace-nowrap">
                                        Desenvolvido por <span className="text-amber-600 font-black">Jhan Houzer</span>
                                    </p>
                                    <p className="text-[9px] text-slate-600 font-medium whitespace-nowrap">
                                        © Todos os direitos reservados 2026
                                    </p>
                                </div>
                           </div>
                       </div>
                   </div>
                );
            case 'orders': return <DailyOrdersView orders={props.orders} drivers={props.drivers} onDeleteOrder={props.onDeleteOrder} setModal={props.setModal} onUpdateOrder={props.onUpdateOrder} appConfig={props.appConfig} />;
            case 'menu': return <MenuManager products={props.products} inventory={props.inventory} onCreate={props.onCreateProduct} onUpdate={props.onUpdateProduct} onDelete={props.onDeleteProduct} />;
            case 'clients': return <ClientsView clients={props.clients} orders={props.orders} giveawayEntries={props.giveawayEntries} setModal={props.setModal} setClientToEdit={props.setClientToEdit} appConfig={props.appConfig} />;
            case 'kitchen': return (
                <KitchenDisplay 
                    orders={props.orders} 
                    products={props.products} 
                    drivers={props.drivers} 
                    onUpdateStatus={props.onUpdateOrder} 
                    onAssignOrder={props.onAssignOrder} 
                    onDeleteOrder={props.onDeleteOrder} 
                    appConfig={props.appConfig}
                    onEditOrder={(order) => {
                        setEditingOrder(order);
                        setShowManualOrder(true);
                    }}
                />
            );
            case 'inventory': return <InventoryManager inventory={props.inventory} suppliers={props.suppliers} shoppingList={props.shoppingList} onCreateSupplier={props.onCreateSupplier} onUpdateSupplier={props.onUpdateSupplier} onDeleteSupplier={props.onDeleteSupplier} onCreateInventory={props.onCreateInventory} onUpdateInventory={props.onUpdateInventory} onDeleteInventory={props.onDeleteInventory} onAddShoppingItem={props.onAddShoppingItem} onToggleShoppingItem={props.onToggleShoppingItem} onDeleteShoppingItem={props.onDeleteShoppingItem} onClearShoppingList={props.onClearShoppingList} appConfig={props.appConfig} />;
            case 'analytics': return <AnalyticsView orders={props.orders} products={props.products} />;
            case 'reports': return <ItemReportView orders={props.orders} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 flex bg-slate-900 text-white overflow-hidden">
            {/* Sidebar Desktop - WIDENED TO 72 */}
            <div className="hidden md:flex w-72 flex-col bg-slate-900 border-r border-slate-800 z-50">
                <div className="p-6 pb-8"><BrandLogo config={props.appConfig} /></div>
                <div className="flex-1 overflow-y-auto px-6 space-y-3 custom-scrollbar">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mt-2 mb-3">Principal</p>
                    <SidebarBtn icon={<LayoutDashboard size={20}/>} label="Visão Geral" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
                    <SidebarBtn icon={<ShoppingBag size={20}/>} label="Pedidos" active={currentView === 'orders'} onClick={() => setCurrentView('orders')} />
                    <SidebarBtn icon={<Utensils size={20}/>} label="Cardápio" active={currentView === 'menu'} onClick={() => setCurrentView('menu')} />
                    <button onClick={() => setShowManualOrder(true)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 py-3 rounded-xl font-black text-sm shadow-lg shadow-amber-500/20 mb-4 mt-2 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] border border-amber-400/50"><PlusCircle size={20} className="text-slate-900"/> NOVO PEDIDO</button>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mt-8 mb-3">Operacional</p>
                    <SidebarBtn icon={<ChefHat size={20}/>} label="Cozinha (KDS)" active={currentView === 'kitchen'} onClick={() => setCurrentView('kitchen')} />
                    <SidebarBtn icon={<Users size={20}/>} label="Clientes" active={currentView === 'clients'} onClick={() => setCurrentView('clients')} />
                    <SidebarBtn icon={<Store size={20}/>} label="Estoque & Compras" active={currentView === 'inventory'} onClick={() => setCurrentView('inventory')} />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mt-8 mb-3">Gestão</p>
                    <SidebarBtn icon={<BarChart3 size={20}/>} label="Analytics" active={currentView === 'analytics'} onClick={() => setCurrentView('analytics')} />
                    <SidebarBtn icon={<FileText size={20}/>} label="Relatório de Itens" active={currentView === 'reports'} onClick={() => setCurrentView('reports')} />
                    <SidebarBtn icon={<Settings size={20}/>} label="Configurações" active={false} onClick={() => props.setModal('settings')} />
                </div>
                <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm font-bold"><LogOut size={18}/> Sair do Sistema</button></div>
            </div>

            {/* Mobile Header (Global) */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-slate-900 border-b border-slate-800 h-16 flex items-center px-4 justify-between shadow-lg">
                <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white p-1"><MenuIcon size={24}/></button><span className="font-bold text-lg text-white truncate">{currentView === 'dashboard' ? 'Visão Geral' : currentView === 'orders' ? 'Pedidos' : currentView === 'menu' ? 'Cardápio' : currentView === 'kitchen' ? 'Cozinha' : currentView === 'clients' ? 'Clientes' : currentView === 'inventory' ? 'Estoque' : currentView === 'analytics' ? 'Relatórios' : 'Sistema'}</span></div>
                <button onClick={() => setShowManualOrder(true)} className="bg-amber-500 text-slate-900 p-2 rounded-lg shadow-lg"><PlusCircle size={20}/></button>
            </div>

            {/* Mobile Menu Overlay */}
            {sidebarOpen && (<div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)}><div className="w-3/4 h-full bg-slate-900 p-6 flex flex-col border-r border-slate-800" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-8"><BrandLogo size="small" config={props.appConfig} /><button onClick={() => setSidebarOpen(false)} className="text-slate-400"><X size={24}/></button></div><div className="flex-1 overflow-y-auto space-y-2"><SidebarBtn icon={<LayoutDashboard size={20}/>} label="Visão Geral" active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} /><SidebarBtn icon={<ShoppingBag size={20}/>} label="Pedidos" active={currentView === 'orders'} onClick={() => { setCurrentView('orders'); setSidebarOpen(false); }} /><SidebarBtn icon={<Utensils size={20}/>} label="Cardápio" active={currentView === 'menu'} onClick={() => { setCurrentView('menu'); setSidebarOpen(false); }} /><button onClick={() => { setShowManualOrder(true); setSidebarOpen(false); }} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 py-3 rounded-xl font-black text-sm shadow-lg shadow-amber-500/20 mb-2 mt-2 flex items-center justify-center gap-2 border border-amber-400/50"><PlusCircle size={20} className="text-slate-900"/> NOVO PEDIDO</button><SidebarBtn icon={<ChefHat size={20}/>} label="Cozinha (KDS)" active={currentView === 'kitchen'} onClick={() => { setCurrentView('kitchen'); setSidebarOpen(false); }} /><SidebarBtn icon={<Users size={20}/>} label="Clientes" active={currentView === 'clients'} onClick={() => { setCurrentView('clients'); setSidebarOpen(false); }} /><SidebarBtn icon={<Store size={20}/>} label="Estoque" active={currentView === 'inventory'} onClick={() => { setCurrentView('inventory'); setSidebarOpen(false); }} /><SidebarBtn icon={<BarChart3 size={20}/>} label="Relatórios" active={currentView === 'analytics'} onClick={() => { setCurrentView('analytics'); setSidebarOpen(false); }} /><SidebarBtn icon={<Settings size={20}/>} label="Configurações" active={false} onClick={() => { props.setModal('settings'); setSidebarOpen(false); }} /></div><div className="mt-4 pt-4 border-t border-slate-800 space-y-3"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-slate-400 py-2"><LogOut size={18}/> Sair</button></div></div></div>)}

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
                    onClose={() => { setShowManualOrder(false); setEditingOrder(null); }} 
                    appConfig={props.appConfig} 
                    orderToEdit={editingOrder}
                />
            )}
            
            {newOrderAlert && (
                <NewOrderModal 
                    order={newOrderAlert} 
                    onClose={() => setNewOrderAlert(null)}
                    onAccept={() => {
                        props.onUpdateOrder(newOrderAlert.id, { status: 'preparing' });
                        setNewOrderAlert(null);
                        setCurrentView('kitchen'); // Redireciona para KDS ao aceitar
                    }}
                    onPrint={() => {
                        setReceiptOrder(newOrderAlert);
                        setNewOrderAlert(null);
                        setCurrentView('kitchen'); // Redireciona para KDS ao imprimir/aceitar
                    }}
                />
            )}

            {receiptOrder && (
                <ReceiptModal 
                    order={receiptOrder} 
                    onClose={() => setReceiptOrder(null)} 
                    appConfig={props.appConfig} 
                />
            )}

            {showLogoutConfirm && (
                <GenericConfirmModal
                    isOpen={true}
                    title="Sair do Sistema?"
                    message="Deseja realmente desconectar da sua conta de administrador?"
                    onClose={() => setShowLogoutConfirm(false)}
                    onConfirm={() => {
                        props.onLogout();
                        setShowLogoutConfirm(false);
                    }}
                    confirmText="Sair Agora"
                    type="danger"
                />
            )}

            <IntroAnimation appName={props.appConfig?.appName} appLogo={props.appConfig?.appLogoUrl} onComplete={() => {}} />
        </div>
    );
}
