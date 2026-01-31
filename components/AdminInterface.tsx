import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Users, ShoppingBag, Utensils, Bike, Map as MapIcon, Settings, LogOut, FileText, BarChart3, ChevronRight, Menu as MenuIcon, X, CalendarCheck, ClipboardList, ChefHat, Bell, Gift, PlusCircle, Search, Trash2, Minus, Plus, Save, CheckCircle2, CreditCard, Banknote, MapPin, DollarSign, ClipboardPaste, Store, Navigation, Battery, MessageCircle, Signal, Clock, ChevronDown, Flame, Minimize2, Edit, Power, UserPlus, TrendingUp, History } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Driver, Order, Vale, Expense, Product, Client, Settlement, AppConfig, Supplier, InventoryItem, ShoppingItem, GiveawayEntry } from '../types';
import { BrandLogo, Footer, SidebarBtn, StatBox } from './Shared';
import { MenuManager } from './MenuManager';
import { ClientsView } from './ClientsView';
import { KitchenDisplay } from './KitchenDisplay';
import { InventoryManager } from './InventoryManager';
import { DailyOrdersView } from './DailyOrdersView';
import { AnalyticsView } from './AnalyticsView';
import { ItemReportView } from './ItemReportView';
import { NewLeadNotificationModal } from './Modals';
import { checkShopStatus, formatCurrency, normalizePhone, capitalize, toSentenceCase, sendOrderConfirmation } from '../utils';

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
    useEffect(() => {
        const timer = setTimeout(onComplete, 2500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center animate-out fade-out duration-500 delay-[2000ms] pointer-events-none">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800 relative z-10 animate-bounce">
                    <Utensils size={48} className="text-amber-500" />
                </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight animate-in slide-in-from-bottom-4 duration-700">
                {appName || "Sistema Delivery"}
            </h1>
            <p className="text-slate-500 mt-2 font-mono text-xs uppercase tracking-[0.3em] animate-in slide-in-from-bottom-8 duration-1000">Carregando Módulos...</p>
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

// --- SUB-COMPONENTE: NOVO PEDIDO MANUAL (PDV) ---
function ManualOrderView({ products, clients, onCreateOrder, onClose, appConfig }: any) {
    const [cart, setCart] = useState<{product: Product, quantity: number, obs: string}[]>([]);
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [mapsLink, setMapsLink] = useState('');
    const [obs, setObs] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [isDelivery, setIsDelivery] = useState(true);
    const [searchProduct, setSearchProduct] = useState('');
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

    const groupedProducts = useMemo(() => {
        const groups: {[key: string]: Product[]} = {};
        products.forEach((p: Product) => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });
        const ORDER = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        return Object.keys(groups).sort((a,b) => {
            const ia = ORDER.indexOf(a);
            const ib = ORDER.indexOf(b);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return a.localeCompare(b);
        }).map(cat => ({ category: cat, items: groups[cat] }));
    }, [products]);

    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 md:p-8 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 w-full h-full md:max-w-[1400px] md:rounded-3xl border-none md:border border-slate-800 shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                
                {/* LADO ESQUERDO: LISTA DE PRODUTOS (CARDÁPIO) */}
                <div className={`flex-1 flex-col bg-slate-900/50 border-r border-slate-800 min-w-0 min-h-0 ${mobileTab === 'cart' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 md:bg-transparent shrink-0">
                        <h2 className="text-2xl font-bold text-white">Cardápio</h2>
                        <div className="relative w-48 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                            <input className="w-full bg-slate-950 md:bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Buscar produto..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
                        </div>
                        {/* Botão fechar mobile aparece aqui se estiver na tab produtos */}
                        <button onClick={onClose} className="md:hidden text-slate-500 ml-2"><X size={24}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-8 pb-24 md:pb-6">
                        {groupedProducts.map(group => {
                            const items = group.items.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()));
                            if (items.length === 0) return null;
                            return (
                                <div key={group.category}>
                                    <h3 className="text-amber-500 font-bold text-sm uppercase tracking-wider mb-4 border-l-4 border-amber-500 pl-3">{group.category}</h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                                        {items.map(p => (
                                            <div key={p.id} onClick={() => addToCart(p)} className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all active:scale-95 group flex flex-col justify-between h-28 shadow-sm">
                                                <h4 className="font-bold text-white text-sm leading-tight line-clamp-2">{p.name}</h4>
                                                <div className="flex justify-between items-end"><span className="text-emerald-400 font-bold text-sm">{formatCurrency(p.price)}</span><div className="bg-slate-800 p-1 rounded text-slate-400 group-hover:text-white group-hover:bg-amber-600 transition-colors"><Plus size={14}/></div></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* LADO DIREITO: DADOS DO PEDIDO & CARRINHO */}
                <div className={`w-full md:w-[400px] bg-slate-950 flex-col border-l border-slate-800 relative shadow-2xl z-20 flex-1 min-h-0 ${mobileTab === 'products' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2"><PlusCircle size={20} className="text-amber-500"/> Novo Pedido</h3>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar pb-2 md:pb-5">
                        <div className="space-y-3">
                            <div className="flex justify-between items-end"><label className="text-xs font-bold text-slate-500 uppercase">Cliente</label><button onClick={handlePasteFromWhatsApp} className="text-[10px] text-amber-500 font-bold flex items-center gap-1 hover:text-amber-400 transition-colors"><ClipboardPaste size={12}/> Colar do WhatsApp</button></div>
                            <div className="flex gap-2 relative"><input className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Tel" value={phone} onChange={e => setPhone(e.target.value)} /><div className="flex-1 relative"><input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Nome" value={name} onChange={handleNameChange} autoComplete="off" />{clientSuggestions.length > 0 && (<div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 rounded-xl mt-1 z-50 shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">{clientSuggestions.map(c => (<div key={c.id} onClick={() => fillClientData(c)} className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"><p className="text-sm font-bold text-white">{c.name}</p><p className="text-xs text-slate-400">{c.phone}</p></div>))}</div>)}</div></div>
                            {isDelivery && (<div className="space-y-3 animate-in fade-in slide-in-from-top-2"><input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} /><input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500 transition-colors font-mono" placeholder="Link Google Maps (Opcional)" value={mapsLink} onChange={e => setMapsLink(e.target.value)} /></div>)}
                        </div>
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800"><button onClick={() => setIsDelivery(true)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${isDelivery ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Bike size={16}/> Entrega</button><button onClick={() => setIsDelivery(false)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${!isDelivery ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Store size={16}/> Retira</button></div>
                        <div><p className="text-xs font-bold text-slate-500 uppercase mb-2">Itens ({cart.reduce((a,b)=>a+b.quantity,0)})</p><div className="space-y-2">{cart.length === 0 ? (<div className="text-center py-4 text-slate-600 text-sm border border-dashed border-slate-800 rounded-xl">Nenhum item adicionado</div>) : (cart.map((item, idx) => (<div key={idx} className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between items-center group"><div className="flex-1"><div className="flex justify-between"><span className="text-white text-sm font-bold">{item.product.name}</span><span className="text-emerald-400 text-xs font-bold">{formatCurrency(item.product.price * item.quantity)}</span></div><div className="flex items-center gap-2 mt-1"><div className="flex items-center bg-slate-950 rounded px-1"><button onClick={() => updateQuantity(idx, -1)} className="text-slate-400 hover:text-white px-1">-</button><span className="text-xs text-white px-2 font-bold">{item.quantity}</span><button onClick={() => updateQuantity(idx, 1)} className="text-slate-400 hover:text-white px-1">+</button></div><input className="bg-transparent border-b border-slate-800 text-[10px] text-slate-400 focus:text-white outline-none flex-1" placeholder="Obs do item..." value={item.obs} onChange={(e) => { const newCart = [...cart]; newCart[idx].obs = e.target.value; setCart(newCart); }}/></div></div><button onClick={() => removeFromCart(idx)} className="ml-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button></div>)))}</div></div>
                        <textarea className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500 h-20 resize-none font-mono" placeholder="Obs: Sem cebola..." value={obs} onChange={e => setObs(e.target.value)} />
                    </div>
                    {/* ADICIONADO PADDING NO MOBILE PARA NÃO FICAR ESCONDIDO PELO MENU FLUTUANTE */}
                    <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-4 pb-24 md:pb-5 shrink-0">
                        <div className="flex justify-between items-center"><div><p className="text-[10px] font-bold text-slate-500 uppercase">Total</p><p className="text-2xl font-black text-white">{formatCurrency(finalTotal)}</p></div><div className="w-1/2"><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pagamento</p><select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-amber-500" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option value="PIX">PIX</option><option value="Dinheiro">Dinheiro</option><option value="Cartão">Cartão</option></select></div></div>
                        <button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all text-lg">Confirmar</button>
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

export default function AdminInterface(props: AdminProps) {
    const [currentView, setCurrentView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showManualOrder, setShowManualOrder] = useState(false);
    
    // Auto-center map on shop location if available
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    
    useEffect(() => {
        if (props.appConfig?.location) {
            setMapCenter([props.appConfig.location.lat, props.appConfig.location.lng]);
        }
    }, [props.appConfig]);

    const handleLogout = () => {
        if (confirm("Sair do sistema?")) props.onLogout();
    };

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
                               <div className="pointer-events-auto md:hidden"><button onClick={() => setSidebarOpen(true)} className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-lg"><MenuIcon/></button></div>
                           </div>
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
            {/* Sidebar Desktop */}
            <div className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-slate-800 z-50">
                <div className="p-6">
                   <BrandLogo config={props.appConfig} />
                </div>
                <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mt-4 mb-2">Principal</p>
                    <SidebarBtn icon={<LayoutDashboard size={20}/>} label="Visão Geral" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
                    <SidebarBtn icon={<ShoppingBag size={20}/>} label="Pedidos" active={currentView === 'orders'} onClick={() => setCurrentView('orders')} />
                    <SidebarBtn icon={<Utensils size={20}/>} label="Cardápio" active={currentView === 'menu'} onClick={() => setCurrentView('menu')} />
                    
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mt-6 mb-2">Operacional</p>
                    <SidebarBtn icon={<ChefHat size={20}/>} label="Cozinha (KDS)" active={currentView === 'kitchen'} onClick={() => setCurrentView('kitchen')} />
                    <SidebarBtn icon={<Users size={20}/>} label="Clientes" active={currentView === 'clients'} onClick={() => setCurrentView('clients')} />
                    <SidebarBtn icon={<Bike size={20}/>} label="Motoboys" active={false} onClick={() => props.setModal('driver')} />
                    <SidebarBtn icon={<Store size={20}/>} label="Estoque & Compras" active={currentView === 'inventory'} onClick={() => setCurrentView('inventory')} />

                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mt-6 mb-2">Gestão</p>
                    <SidebarBtn icon={<BarChart3 size={20}/>} label="Analytics" active={currentView === 'analytics'} onClick={() => setCurrentView('analytics')} />
                    <SidebarBtn icon={<FileText size={20}/>} label="Relatório de Itens" active={currentView === 'reports'} onClick={() => setCurrentView('reports')} />
                    <SidebarBtn icon={<Settings size={20}/>} label="Configurações" active={false} onClick={() => props.setModal('settings')} />
                </div>
                <div className="p-4 border-t border-slate-800">
                     <button onClick={() => setShowManualOrder(true)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg mb-3 flex items-center justify-center gap-2 transition-transform active:scale-95">
                         <PlusCircle size={18}/> Novo Pedido
                     </button>
                     <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm font-bold">
                         <LogOut size={18}/> Sair do Sistema
                     </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="w-3/4 h-full bg-slate-900 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <BrandLogo size="small" config={props.appConfig} />
                            <button onClick={() => setSidebarOpen(false)} className="text-slate-400"><X size={24}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            <SidebarBtn icon={<LayoutDashboard size={20}/>} label="Visão Geral" active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<ShoppingBag size={20}/>} label="Pedidos" active={currentView === 'orders'} onClick={() => { setCurrentView('orders'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<ChefHat size={20}/>} label="Cozinha (KDS)" active={currentView === 'kitchen'} onClick={() => { setCurrentView('kitchen'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<Utensils size={20}/>} label="Cardápio" active={currentView === 'menu'} onClick={() => { setCurrentView('menu'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<Users size={20}/>} label="Clientes" active={currentView === 'clients'} onClick={() => { setCurrentView('clients'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<Bike size={20}/>} label="Motoboys" active={false} onClick={() => { props.setModal('driver'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<Store size={20}/>} label="Estoque" active={currentView === 'inventory'} onClick={() => { setCurrentView('inventory'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<BarChart3 size={20}/>} label="Relatórios" active={currentView === 'analytics'} onClick={() => { setCurrentView('analytics'); setSidebarOpen(false); }} />
                            <SidebarBtn icon={<Settings size={20}/>} label="Configurações" active={false} onClick={() => { props.setModal('settings'); setSidebarOpen(false); }} />
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                             <button onClick={() => { setShowManualOrder(true); setSidebarOpen(false); }} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                                 <PlusCircle size={18}/> Novo Pedido
                             </button>
                             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-slate-400 py-2">
                                 <LogOut size={18}/> Sair
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
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