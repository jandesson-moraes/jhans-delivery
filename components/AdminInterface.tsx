
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Users, ShoppingBag, Utensils, Bike, Map as MapIcon, Settings, LogOut, FileText, BarChart3, ChevronRight, Menu as MenuIcon, X, CalendarCheck, ClipboardList, ChefHat, Bell, Gift, PlusCircle, Search, Trash2, Minus, Plus, Save, CheckCircle2, CreditCard, Banknote, MapPin, DollarSign, ClipboardPaste, Store, Navigation, Battery, MessageCircle, Signal, Clock, ChevronDown, Flame, Minimize2, Edit, Power, UserPlus, TrendingUp, History, LocateFixed, Car, Activity, Wallet, Calendar, ArrowRight, ArrowLeft, User, Link as LinkIcon, ShoppingCart, Crosshair, MoreHorizontal } from 'lucide-react';
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
import { NewOrderModal, ReceiptModal, GenericConfirmModal, EditOrderModal, DispatchSuccessModal, ProductionSuccessModal } from './Modals';
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
    modalData: any; 
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

const ManualOrderView = ({ products, clients, onCreateOrder, onClose, appConfig }: any) => {
    // ... (Mantendo código ManualOrderView inalterado, pois está funcionando bem)
    const [mobileTab, setMobileTab] = useState<'products'|'checkout'>('products');
    const [cart, setCart] = useState<{product: Product, quantity: number, obs: string}[]>([]);
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [address, setAddress] = useState('');
    const [mapsLink, setMapsLink] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [serviceType, setServiceType] = useState<'delivery'|'pickup'>('delivery');
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [obs, setObs] = useState('');
    const [searchProduct, setSearchProduct] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [nameSuggestions, setNameSuggestions] = useState<Client[]>([]);
    const categoriesPriority = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map((p: Product) => p.category))) as string[];
        return ['Todos', ...cats.sort((a, b) => {
            const idxA = categoriesPriority.indexOf(a);
            const idxB = categoriesPriority.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        })];
    }, [products]);
    const groupedProducts = useMemo(() => {
        let prods = products;
        if (selectedCategory !== 'Todos') {
            prods = products.filter((p: Product) => p.category === selectedCategory);
        }
        if (searchProduct) {
            prods = prods.filter((p: Product) => p.name.toLowerCase().includes(searchProduct.toLowerCase()));
        }
        const groups: {[key: string]: Product[]} = {};
        prods.forEach((p: Product) => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const idxA = categoriesPriority.indexOf(a);
            const idxB = categoriesPriority.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });
        return sortedKeys.map(key => ({ category: key, items: groups[key] }));
    }, [products, selectedCategory, searchProduct]);
    const handlePhoneBlur = () => {
        const clean = normalizePhone(customerPhone);
        const client = clients.find((c: Client) => normalizePhone(c.phone) === clean);
        if (client) {
            setCustomerName(client.name);
            setAddress(client.address);
            if (client.mapsLink) setMapsLink(client.mapsLink);
        }
    };
    const handleNameChange = (val: string) => {
        setCustomerName(val);
        if (val.length > 2) {
            const matches = clients.filter((c: Client) => c.name.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
            setNameSuggestions(matches);
        } else {
            setNameSuggestions([]);
        }
    };
    const selectClient = (client: Client) => {
        setCustomerName(client.name);
        setCustomerPhone(client.phone);
        setAddress(client.address);
        if(client.mapsLink) setMapsLink(client.mapsLink);
        setNameSuggestions([]);
    };
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if(existing) return prev.map(i => i.product.id === product.id ? {...i, quantity: i.quantity + 1} : i);
            return [...prev, { product, quantity: 1, obs: '' }];
        });
        if(navigator.vibrate) navigator.vibrate(50);
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
        if (cart.length === 0) return alert("Carrinho vazio");
        const itemsText = cart.map(i => `${i.quantity}x ${i.product.name}${i.obs ? ` (${i.obs})` : ''}`).join('\n');
        const orderData: any = {
            customer: customerName,
            phone: customerPhone,
            address: serviceType === 'delivery' ? address : 'Balcão',
            mapsLink: mapsLink,
            items: itemsText,
            amount: formatCurrency(total),
            value: total,
            paymentMethod,
            serviceType,
            deliveryFee,
            obs,
            origin: 'manual',
            status: 'pending'
        };
        onCreateOrder(orderData);
        onClose();
    };
    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-6xl h-full md:h-[90vh] rounded-none md:rounded-3xl border border-slate-800 flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
                <div className={`w-full md:flex-1 flex-col border-r border-slate-800 shrink-0 ${mobileTab === 'checkout' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-800 bg-slate-900 flex gap-3 sticky top-0 z-10 items-center">
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-white"><ArrowLeft size={20}/></button>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                            <input className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:border-amber-500 transition-colors" placeholder="Buscar produto..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
                        </div>
                    </div>
                    <div className="px-4 py-3 bg-slate-950/50 border-b border-slate-800 overflow-x-auto flex gap-2 shrink-0 custom-scrollbar">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{cat}</button>
                        ))}
                    </div>
                    <div className="p-4 bg-slate-900/50 space-y-6 flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-4">
                        {groupedProducts.map(group => (
                            <div key={group.category}>
                                <h4 className="font-bold text-slate-400 text-xs uppercase mb-3 border-b border-slate-800 pb-1 flex items-center gap-2">
                                    {group.category === 'Hambúrgueres' && <span className="text-xl">🍔</span>}{group.category === 'Bebidas' && <span className="text-xl">🥤</span>}{group.category === 'Combos' && <span className="text-xl">🍟</span>}{group.category}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {group.items.map((p: Product) => (
                                        <button key={p.id} onClick={() => addToCart(p)} className="bg-slate-900 p-3 rounded-xl border border-slate-800 hover:border-amber-500 text-left transition-all active:scale-95 flex flex-col justify-between h-full group">
                                            <div><p className="font-bold text-white text-sm line-clamp-2 leading-tight mb-1">{p.name}</p><p className="text-[10px] text-slate-500 line-clamp-2">{p.description}</p></div>
                                            <div className="mt-2 flex justify-between items-end"><p className="text-amber-500 font-bold text-xs">{formatCurrency(p.price)}</p><div className="bg-slate-800 p-1 rounded group-hover:bg-amber-600 group-hover:text-white transition-colors"><Plus size={14}/></div></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {groupedProducts.length === 0 && <div className="text-center text-slate-500 py-10">Nenhum produto encontrado.</div>}
                    </div>
                    <div className="md:hidden absolute bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 z-50">
                        <button onClick={() => setMobileTab('checkout')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-between px-6 active:scale-95 transition-all">
                            <span className="flex items-center gap-2 text-xs bg-black/20 px-2 py-1 rounded"><ShoppingCart size={14}/> {cart.reduce((acc, i) => acc + i.quantity, 0)}</span><span className="text-sm uppercase tracking-wide">Ir para Cliente / Pagamento</span><span className="text-sm font-black">{formatCurrency(total)}</span>
                        </button>
                    </div>
                </div>
                <div className={`w-full md:w-96 bg-slate-950 border-l border-slate-800 flex-col md:h-full shadow-2xl shrink-0 ${mobileTab === 'products' ? 'hidden md:flex' : 'flex h-full'}`}>
                    <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3 md:hidden"><button onClick={() => setMobileTab('products')} className="p-2 bg-slate-800 rounded-full text-white"><ArrowLeft size={20}/></button><h3 className="font-bold text-white text-lg">Finalizar Pedido</h3></div>
                    <div className="hidden md:block p-4 border-b border-slate-800 bg-slate-900"><h3 className="font-bold text-white text-lg">Novo Pedido</h3></div>
                    <div className="p-4 space-y-4 pb-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-3">
                            <div className="flex justify-between items-center"><span className="text-[10px] uppercase font-bold text-slate-500">Dados do Cliente</span></div>
                            <div className="flex gap-2"><input className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm outline-none focus:border-amber-500" placeholder="Telefone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} onBlur={handlePhoneBlur} /><div className="flex-1 relative"><input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm outline-none focus:border-amber-500" placeholder="Nome" value={customerName} onChange={e => handleNameChange(e.target.value)} />{nameSuggestions.length > 0 && (<div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 mt-1 max-h-40 overflow-y-auto">{nameSuggestions.map(client => (<div key={client.id} className="p-2 hover:bg-slate-700 cursor-pointer text-xs text-white border-b border-slate-700/50 last:border-0" onClick={() => selectClient(client)}><p className="font-bold">{client.name}</p><p className="text-[10px] text-slate-400">{client.phone}</p></div>))}</div>)}</div></div>
                            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800"><button onClick={() => setServiceType('delivery')} className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${serviceType === 'delivery' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-white'}`}>Entrega</button><button onClick={() => setServiceType('pickup')} className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${serviceType === 'pickup' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}>Retirada</button></div>
                            {serviceType === 'delivery' && (<><input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm outline-none focus:border-amber-500" placeholder="Endereço de Entrega" value={address} onChange={e => setAddress(e.target.value)} /><div className="flex items-center gap-2"><LinkIcon size={16} className="text-slate-500" /><input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500" placeholder="Link do Google Maps (Opcional)" value={mapsLink} onChange={e => setMapsLink(e.target.value)} /></div></>)}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1"><p className="text-[10px] uppercase font-bold text-slate-500">Itens ({cart.length})</p><button onClick={() => setMobileTab('products')} className="md:hidden text-[10px] font-bold text-emerald-500 flex items-center gap-1">+ Adicionar Itens</button></div>
                            {cart.length === 0 ? <p className="text-center text-slate-600 text-xs py-4 border border-dashed border-slate-800 rounded-lg">Carrinho vazio</p> : (cart.map((item, idx) => (<div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-2"><div className="flex justify-between items-start mb-2"><span className="text-sm text-white font-medium line-clamp-1">{item.product.name}</span><span className="text-xs text-amber-500 font-bold ml-2">{formatCurrency(item.product.price * item.quantity)}</span></div><div className="flex items-center justify-between"><div className="flex items-center gap-2 bg-slate-950 rounded p-0.5"><button onClick={() => updateQuantity(idx, -1)} className="px-2 text-slate-400 hover:text-white">-</button><span className="text-xs text-white font-bold">{item.quantity}</span><button onClick={() => updateQuantity(idx, 1)} className="px-2 text-slate-400 hover:text-white">+</button></div><input className="flex-1 ml-2 bg-transparent text-[10px] text-slate-400 outline-none border-b border-slate-800 focus:border-amber-500 placeholder:text-slate-600" placeholder="Obs: Sem cebola..." value={item.obs} onChange={e => { const newCart = [...cart]; newCart[idx].obs = e.target.value; setCart(newCart); }} /></div></div>)))}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3 shrink-0 pb-safe">
                         <div className="grid grid-cols-3 gap-2"><button onClick={() => setPaymentMethod('PIX')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${paymentMethod === 'PIX' ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'}`}><PixIcon size={22} className="mb-1"/><span className="text-xs font-bold">PIX</span></button><button onClick={() => setPaymentMethod('Dinheiro')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${paymentMethod === 'Dinheiro' ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'}`}><Banknote size={22} className="mb-1"/><span className="text-xs font-bold">Dinheiro</span></button><button onClick={() => setPaymentMethod('Cartão')} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${paymentMethod === 'Cartão' ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'}`}><CreditCard size={22} className="mb-1"/><span className="text-xs font-bold">Cartão</span></button></div>
                         {serviceType === 'delivery' && (<div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-3"><span className="text-xs text-slate-500 font-bold uppercase flex-1">Taxa de Entrega</span><input type="number" className="w-20 bg-transparent text-white text-base text-right outline-none font-bold" value={deliveryFee} onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)} /></div>)}
                         <div className="flex justify-between items-center text-lg font-bold text-white pt-2 border-t border-slate-800"><span>Total</span><span className="text-emerald-400 text-xl">{formatCurrency(total)}</span></div>
                         <button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-base"><CheckCircle2 size={20}/> Confirmar Pedido</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- NEW COMPONENT: BOTTOM NAVIGATION (MOBILE) ---
const BottomNavigation = ({ view, onChange, onOpenMore, onNewOrder }: { view: string, onChange: (v: string) => void, onOpenMore: () => void, onNewOrder: () => void }) => {
    // Left items
    const leftItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20}/>, label: 'Painel' },
        { id: 'orders', icon: <ClipboardList size={20}/>, label: 'Pedidos' },
    ];
    // Right items
    const rightItems = [
        { id: 'kitchen', icon: <ChefHat size={20}/>, label: 'Cozinha' }, // Changed to Kitchen
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 h-16 z-50 md:hidden pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
            <div className="flex justify-between items-end h-full px-2 relative">
                
                {/* Left Side */}
                <div className="flex-1 flex justify-around h-full">
                    {leftItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => onChange(item.id)}
                            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors active:scale-95 ${view === item.id ? 'text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <div className={view === item.id ? 'bg-amber-500/10 p-1 rounded-lg' : 'p-1'}>
                                {item.icon}
                            </div>
                            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Center Floating Button (Novo Pedido) */}
                <div className="w-16 h-full flex justify-center relative">
                    <button 
                        onClick={onNewOrder}
                        className="absolute -top-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full shadow-lg shadow-orange-500/40 flex items-center justify-center text-white active:scale-90 transition-transform border-4 border-slate-950 z-50"
                    >
                        <Plus size={28} strokeWidth={3} />
                    </button>
                    <span className="absolute bottom-1.5 text-[10px] font-bold text-slate-400 tracking-tight">Novo</span>
                </div>

                {/* Right Side */}
                <div className="flex-1 flex justify-around h-full">
                    {rightItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => onChange(item.id)}
                            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors active:scale-95 ${view === item.id ? 'text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <div className={view === item.id ? 'bg-amber-500/10 p-1 rounded-lg' : 'p-1'}>
                                {item.icon}
                            </div>
                            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                        </button>
                    ))}
                    
                    {/* More Button */}
                    <button 
                        onClick={onOpenMore}
                        className="flex flex-col items-center justify-center gap-1 w-full h-full text-slate-500 hover:text-slate-300 active:scale-95 transition-transform"
                    >
                        <div className="p-1"><MoreHorizontal size={20}/></div>
                        <span className="text-[10px] font-bold tracking-tight">Mais</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export function AdminInterface(props: AdminProps) {
    const [view, setView] = useState('dashboard'); // Alterado para iniciar no Dashboard por padrão no mobile
    const [showFleet, setShowFleet] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    
    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
    
    // Estado para controle do Mapa
    const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null);

    // Initial load logic
    useEffect(() => {
        // No desktop, sidebar sempre aberta.
        if (!props.isMobile) setIsSidebarOpen(true);
    }, [props.isMobile]);

    const activeDrivers = props.drivers.filter(d => d.status !== 'offline');
    const pendingOrders = props.orders.filter(o => o.status === 'pending');
    
    // Stats for Dashboard
    const stats = useMemo(() => {
        const today = new Date().toDateString();
        const todaysOrders = props.orders.filter(o => o.createdAt && new Date(o.createdAt.seconds * 1000).toDateString() === today && o.status !== 'cancelled');
        const revenue = todaysOrders.reduce((acc, o) => acc + (o.value || 0), 0);
        return { count: todaysOrders.length, revenue };
    }, [props.orders]);

    const handleCenterMap = () => {
        const lat = props.appConfig.location?.lat || -23.55052;
        const lng = props.appConfig.location?.lng || -46.633308;
        setTargetLocation([lat, lng]);
    };

    // Função para fechar a sidebar ao clicar em um item (Mobile UX)
    const handleMenuClick = (viewName: string) => {
        setView(viewName);
        if (props.isMobile) setIsSidebarOpen(false);
    };

    if (showIntro) return <IntroAnimation appName={props.appConfig.appName} appLogo={props.appConfig.appLogoUrl} onComplete={() => setShowIntro(false)} />;

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
            
            {/* OVERLAY MOBILE BACKGROUND (Fecha menu ao clicar fora) */}
            {/* CORREÇÃO: Usando classes CSS para controle de visibilidade em vez de renderização condicional JS */}
            <div 
                className={`fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* SIDEBAR (DRAWER no Mobile / FIXO no Desktop) */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 md:w-64 md:shadow-none
                flex flex-col
            `}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <BrandLogo config={props.appConfig} size="small" />
                    {/* Botão X apenas no Mobile */}
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar pb-24">
                    {/* SEÇÃO PRINCIPAL */}
                    {/* Desktop: Mostra tudo. Mobile: Mostra o que não está embaixo + Menu (que saiu de baixo) */}
                    <div className="md:block hidden">
                        <div className="mb-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Principal</div>
                        <SidebarBtn icon={<LayoutDashboard size={20}/>} label="Visão Geral" active={view==='dashboard'} onClick={() => handleMenuClick('dashboard')}/>
                        <SidebarBtn icon={<ClipboardList size={20}/>} label="Pedidos" active={view==='orders'} onClick={() => handleMenuClick('orders')}/>
                        <SidebarBtn icon={<ChefHat size={20}/>} label="Cozinha (KDS)" active={view==='kitchen'} onClick={() => handleMenuClick('kitchen')}/>
                        <SidebarBtn icon={<ShoppingBag size={20}/>} label="Cardápio" active={view==='menu'} onClick={() => handleMenuClick('menu')}/>
                    </div>

                    {/* MOBILE ONLY: CARDÁPIO (Saiu da barra inferior, veio pra cá) */}
                    <div className="md:hidden block mb-4">
                        <div className="mb-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acesso Rápido</div>
                        <SidebarBtn icon={<ShoppingBag size={20}/>} label="Gerenciar Cardápio" active={view==='menu'} onClick={() => handleMenuClick('menu')}/>
                    </div>

                    {/* BOTÃO NOVO PEDIDO - Apenas Desktop, pois Mobile tem botão central */}
                    <div className="my-4 px-2 hidden md:block">
                        <button 
                            onClick={() => { setIsNewOrderOpen(true); }}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-wide text-sm"
                        >
                            <PlusCircle size={20}/> Novo Pedido
                        </button>
                    </div>
                    
                    {/* SEÇÃO OPERACIONAL */}
                    <div className="mb-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-4">Operacional</div>
                    <SidebarBtn icon={<Users size={20}/>} label="Clientes" active={view==='clients'} onClick={() => handleMenuClick('clients')}/>
                    <SidebarBtn icon={<Store size={20}/>} label="Estoque & Compras" active={view==='inventory'} onClick={() => handleMenuClick('inventory')}/>
                    
                    {/* SEÇÃO GESTÃO */}
                    <div className="mt-6 mb-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gestão</div>
                    <SidebarBtn icon={<BarChart3 size={20}/>} label="Analytics" active={view==='analytics'} onClick={() => handleMenuClick('analytics')}/>
                    <SidebarBtn icon={<FileText size={20}/>} label="Relatório de Itens" active={view==='reports'} onClick={() => handleMenuClick('reports')}/>
                    <SidebarBtn icon={<Settings size={20}/>} label="Configurações" onClick={() => { props.setModal('settings'); if(props.isMobile) setIsSidebarOpen(false); }}/>
                    
                    <div className="mt-4 pt-4 border-t border-slate-800">
                        <SidebarBtn icon={<LogOut size={20}/>} label="Sair do Sistema" onClick={props.onLogout}/>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-800 bg-slate-950/50 md:flex hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs border border-emerald-500/30">ON</div>
                        <div>
                            <p className="text-xs font-bold text-white">Loja Aberta</p>
                            <p className="text-[10px] text-slate-500">Versão 2.8.0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
                
                {/* Mobile Header (Only visible on Mobile) */}
                <div className="md:hidden p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-30 shadow-md">
                    <div className="flex items-center gap-3">
                        <BrandLogo config={props.appConfig} size="small" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {view === 'dashboard' && (
                            <button onClick={() => setShowFleet(!showFleet)} className={`p-2 rounded-lg border ${showFleet ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-slate-800 text-white border-slate-700'}`}>
                                <Bike size={20}/>
                            </button>
                        )}
                    </div>
                </div>

                {/* Dynamic Views - Added Padding Bottom for Mobile Nav */}
                <div className="flex-1 overflow-hidden relative md:pb-0 pb-20">
                    {view === 'dashboard' && (
                        <div className="absolute inset-0 flex flex-col">
                            {/* Map Layer */}
                            <div className="flex-1 relative z-0 bg-slate-900">
                                <MapContainer center={[-23.55052, -46.633308]} zoom={13} style={{ height: '100%', width: '100%', background: '#020617' }} zoomControl={false}>
                                    <TileLayer 
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    />
                                    {/* Store Marker */}
                                    <Marker position={[props.appConfig.location?.lat || -23.55052, props.appConfig.location?.lng || -46.633308]} icon={iconStore}>
                                        <Popup className="custom-popup">
                                            <div className="text-center">
                                                <strong className="text-lg text-slate-900">{props.appConfig.appName}</strong>
                                                <p className="text-xs text-slate-500">Loja Principal</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                    
                                    {/* Drivers Markers */}
                                    {activeDrivers.map(d => (
                                        <Marker key={d.id} position={[d.lat || 0, d.lng || 0]} icon={createDriverIcon(d.avatar, d.status, d.lastUpdate)}>
                                            <Popup>
                                                <div className="text-center">
                                                    <strong>{d.name}</strong>
                                                    <p>{d.status}</p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                    <MapHandler targetLocation={targetLocation} zoomLevel={15} />
                                </MapContainer>
                                
                                {/* Overlay Stats */}
                                <div className="absolute top-4 left-4 right-4 z-[400] grid grid-cols-2 md:grid-cols-4 gap-3 pointer-events-none">
                                    <div className="pointer-events-auto"><StatBox label="Vendas Hoje" value={formatCurrency(stats.revenue)} icon={<DollarSign size={18}/>} color="bg-emerald-500 text-white"/></div>
                                    <div className="pointer-events-auto"><StatBox label="Pedidos" value={stats.count} icon={<ShoppingBag size={18}/>} color="bg-blue-500 text-white"/></div>
                                    <div className="hidden md:block pointer-events-auto"><StatBox label="Online" value={activeDrivers.length} icon={<Bike size={18}/>} color="bg-amber-500 text-white"/></div>
                                    <div className="hidden md:block pointer-events-auto"><StatBox label="Pendentes" value={pendingOrders.length} icon={<Clock size={18}/>} color="bg-red-500 text-white"/></div>
                                </div>

                                {/* Floating Fleet Button (Desktop) */}
                                <div className="absolute bottom-6 right-6 z-[400] hidden md:block">
                                    <button onClick={() => setShowFleet(!showFleet)} className="bg-slate-900 border border-slate-700 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-transform hover:scale-110 flex items-center justify-center">
                                        <Bike size={24}/>
                                    </button>
                                </div>

                                {/* Floating Center Map Button (Visible on Mobile now too) */}
                                <div className="absolute bottom-24 md:bottom-6 right-4 md:right-24 z-[400]">
                                    <button 
                                        onClick={handleCenterMap} 
                                        className="bg-slate-900 border border-slate-700 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-transform hover:scale-110 flex items-center justify-center group relative"
                                    >
                                        <Crosshair size={24} className="group-hover:text-emerald-400 transition-colors"/>
                                        <span className="hidden md:block absolute right-full mr-3 bg-slate-900 text-white text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Centralizar Loja
                                        </span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Fleet Sidebar Overlay */}
                            {showFleet && (
                                <FleetSidebar 
                                    drivers={props.drivers} 
                                    orders={props.orders}
                                    vales={props.vales}
                                    settlements={props.settlements}
                                    onClose={() => setShowFleet(false)}
                                    onAddDriver={() => props.setModal('driver')}
                                    onEditDriver={props.setDriverToEdit}
                                    onSettle={(id: string, data: any) => { props.setDriverToEdit(props.drivers.find(d=>d.id===id)||null); props.setModalData(data); props.setModal('closeCycle'); }}
                                />
                            )}
                        </div>
                    )}

                    {view === 'kitchen' && (
                        <KitchenDisplay 
                            orders={props.orders} 
                            products={props.products}
                            drivers={props.drivers}
                            onUpdateStatus={(id, status) => props.onUpdateOrder(id, status)}
                            onAssignOrder={props.onAssignOrder}
                            onDeleteOrder={props.onDeleteOrder}
                            appConfig={props.appConfig}
                            onEditOrder={(order) => { 
                                props.setModalData(order); 
                            }}
                        />
                    )}

                    {view === 'menu' && (
                        <MenuManager 
                            products={props.products} 
                            inventory={props.inventory}
                            onCreate={props.onCreateProduct}
                            onUpdate={props.onUpdateProduct}
                            onDelete={props.onDeleteProduct}
                        />
                    )}

                    {view === 'orders' && (
                        <DailyOrdersView 
                            orders={props.orders} 
                            drivers={props.drivers}
                            onDeleteOrder={props.onDeleteOrder}
                            setModal={props.setModal}
                            onUpdateOrder={props.onUpdateOrder}
                            appConfig={props.appConfig}
                        />
                    )}

                    {view === 'clients' && (
                        <ClientsView 
                            clients={props.clients} 
                            orders={props.orders}
                            giveawayEntries={props.giveawayEntries}
                            setModal={props.setModal}
                            setClientToEdit={props.setClientToEdit}
                            appConfig={props.appConfig}
                        />
                    )}

                    {view === 'inventory' && (
                        <InventoryManager 
                            inventory={props.inventory}
                            suppliers={props.suppliers}
                            shoppingList={props.shoppingList}
                            onCreateSupplier={props.onCreateSupplier}
                            onUpdateSupplier={props.onUpdateSupplier}
                            onDeleteSupplier={props.onDeleteSupplier}
                            onCreateInventory={props.onCreateInventory}
                            onUpdateInventory={props.onUpdateInventory}
                            onDeleteInventory={props.onDeleteInventory}
                            onAddShoppingItem={props.onAddShoppingItem}
                            onToggleShoppingItem={props.onToggleShoppingItem}
                            onDeleteShoppingItem={props.onDeleteShoppingItem}
                            onClearShoppingList={props.onClearShoppingList}
                            appConfig={props.appConfig}
                        />
                    )}

                    {view === 'analytics' && (
                        <AnalyticsView orders={props.orders} products={props.products} />
                    )}
                    
                    {view === 'reports' && (
                         <ItemReportView orders={props.orders} />
                    )}
                </div>
                
                {/* BOTTOM NAVIGATION FOR MOBILE */}
                <BottomNavigation 
                    view={view} 
                    onChange={setView} 
                    onOpenMore={() => setIsSidebarOpen(true)}
                    onNewOrder={() => setIsNewOrderOpen(true)}
                />
            </div>

            {/* Modal Novo Pedido */}
            {isNewOrderOpen && (
                <ManualOrderView 
                    products={props.products} 
                    clients={props.clients} 
                    onCreateOrder={props.onCreateOrder} 
                    onClose={() => setIsNewOrderOpen(false)} 
                    appConfig={props.appConfig}
                />
            )}
        </div>
    );
}
