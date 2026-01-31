import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Users, ShoppingBag, Utensils, Bike, Map, Settings, LogOut, FileText, BarChart3, ChevronRight, Menu as MenuIcon, X, CalendarCheck, ClipboardList, ChefHat, Bell, Gift, PlusCircle, Search, Trash2, Minus, Plus, Save, CheckCircle2, CreditCard, Banknote, MapPin, DollarSign, ClipboardPaste, Store, Navigation, Battery, MessageCircle, Signal, Clock } from 'lucide-react';
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

// Componente para centralizar o mapa sem loop infinito
function MapRecenter({ center }: { center: [number, number] }) {
    const map = useMap();
    
    // Usa uma ref para guardar o último centro e evitar atualizações desnecessárias
    const lastCenter = useRef<string>('');

    useEffect(() => {
        if (!center) return;
        const centerStr = `${center[0]},${center[1]}`;
        // Só atualiza se a posição realmente mudou significativamente
        if (lastCenter.current !== centerStr) {
            map.flyTo(center, map.getZoom(), { duration: 1.5 });
            lastCenter.current = centerStr;
        }
    }, [center, map]);
    
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
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 w-full h-full max-w-[1400px] rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                <div className="flex-1 flex flex-col bg-slate-900/50 border-r border-slate-800 min-w-0">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">Cardápio</h2>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                            <input className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Buscar produto..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                        {groupedProducts.map(group => {
                            const items = group.items.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()));
                            if (items.length === 0) return null;
                            return (
                                <div key={group.category}>
                                    <h3 className="text-amber-500 font-bold text-sm uppercase tracking-wider mb-4 border-l-4 border-amber-500 pl-3">{group.category}</h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {items.map(p => (
                                            <div key={p.id} onClick={() => addToCart(p)} className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all active:scale-95 group flex flex-col justify-between h-28">
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
                <div className="w-full md:w-[400px] bg-slate-950 flex flex-col border-l border-slate-800 relative shadow-2xl z-20">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900"><h3 className="font-bold text-white text-lg flex items-center gap-2"><PlusCircle size={20} className="text-amber-500"/> Novo Pedido</h3><button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button></div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                        <div className="space-y-3">
                            <div className="flex justify-between items-end"><label className="text-xs font-bold text-slate-500 uppercase">Cliente</label><button onClick={handlePasteFromWhatsApp} className="text-[10px] text-amber-500 font-bold flex items-center gap-1 hover:text-amber-400 transition-colors"><ClipboardPaste size={12}/> Colar do WhatsApp</button></div>
                            <div className="flex gap-2 relative"><input className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Tel" value={phone} onChange={e => setPhone(e.target.value)} /><div className="flex-1 relative"><input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Nome" value={name} onChange={handleNameChange} autoComplete="off" />{clientSuggestions.length > 0 && (<div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 rounded-xl mt-1 z-50 shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">{clientSuggestions.map(c => (<div key={c.id} onClick={() => fillClientData(c)} className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"><p className="text-sm font-bold text-white">{c.name}</p><p className="text-xs text-slate-400">{c.phone}</p></div>))}</div>)}</div></div>
                            {isDelivery && (<div className="space-y-3 animate-in fade-in slide-in-from-top-2"><input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} /><input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500 transition-colors font-mono" placeholder="Link Google Maps (Opcional)" value={mapsLink} onChange={e => setMapsLink(e.target.value)} /></div>)}
                        </div>
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800"><button onClick={() => setIsDelivery(true)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${isDelivery ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Bike size={16}/> Entrega</button><button onClick={() => setIsDelivery(false)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${!isDelivery ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Store size={16}/> Retira</button></div>
                        <div><p className="text-xs font-bold text-slate-500 uppercase mb-2">Itens ({cart.reduce((a,b)=>a+b.quantity,0)})</p><div className="space-y-2">{cart.length === 0 ? (<div className="text-center py-4 text-slate-600 text-sm border border-dashed border-slate-800 rounded-xl">Nenhum item adicionado</div>) : (cart.map((item, idx) => (<div key={idx} className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between items-center group"><div className="flex-1"><div className="flex justify-between"><span className="text-white text-sm font-bold">{item.product.name}</span><span className="text-emerald-400 text-xs font-bold">{formatCurrency(item.product.price * item.quantity)}</span></div><div className="flex items-center gap-2 mt-1"><div className="flex items-center bg-slate-950 rounded px-1"><button onClick={() => updateQuantity(idx, -1)} className="text-slate-400 hover:text-white px-1">-</button><span className="text-xs text-white px-2 font-bold">{item.quantity}</span><button onClick={() => updateQuantity(idx, 1)} className="text-slate-400 hover:text-white px-1">+</button></div><input className="bg-transparent border-b border-slate-800 text-[10px] text-slate-400 focus:text-white outline-none flex-1" placeholder="Obs do item..." value={item.obs} onChange={(e) => { const newCart = [...cart]; newCart[idx].obs = e.target.value; setCart(newCart); }}/></div></div><button onClick={() => removeFromCart(idx)} className="ml-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button></div>)))}</div></div>
                        <textarea className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500 h-20 resize-none font-mono" placeholder="Obs: Sem cebola..." value={obs} onChange={e => setObs(e.target.value)} />
                    </div>
                    <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-4">
                        <div className="flex justify-between items-center"><div><p className="text-[10px] font-bold text-slate-500 uppercase">Total</p><p className="text-2xl font-black text-white">{formatCurrency(finalTotal)}</p></div><div className="w-1/2"><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pagamento</p><select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-amber-500" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option value="PIX">PIX</option><option value="Dinheiro">Dinheiro</option><option value="Cartão">Cartão</option></select></div></div>
                        <button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all text-lg">Confirmar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminInterface(props: AdminProps) {
    const { drivers, orders, vales, expenses, products, clients, settlements, suppliers, inventory, shoppingList, giveawayEntries, appConfig, isMobile, setModal, setModalData, onLogout, onDeleteOrder, onAssignOrder, setDriverToEdit, onDeleteDriver, setClientToEdit, onUpdateOrder, onCreateOrder } = props;
    
    const [view, setView] = useState('map'); 
    const [showIntro, setShowIntro] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
    const [showManualOrder, setShowManualOrder] = useState(false);
    
    const [newLeadModal, setNewLeadModal] = useState<GiveawayEntry | null>(null);
    
    const prevGiveawayCount = useRef(0);
    const isFirstLoad = useRef(true); 
    const giveawayAudioRef = useRef<HTMLAudioElement | null>(null);

    // Map Props - Garantir que nunca seja undefined
    const storeLocation = useMemo(() => 
        appConfig.location ? [appConfig.location.lat, appConfig.location.lng] as [number, number] : [-23.55052, -46.633308] as [number, number]
    , [appConfig.location]);

    const onlineDrivers = drivers.filter(d => d.status !== 'offline');
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');

    // Deslocar o foco inicial para cima e direita (Nordeste) para priorizar a área da cidade
    // E aumentar a área visível (bounds)
    const mapBounds = useMemo(() => {
        // Delta aumentado para 0.08 (~9km) para dar mais área
        const delta = 0.08; 
        
        // Centro deslocado levemente para o Nordeste (lat +, lng +) para "subir para direita"
        const centerOffsetLat = 0.015;
        const centerOffsetLng = 0.015;

        const centerLat = storeLocation[0] + centerOffsetLat;
        const centerLng = storeLocation[1] + centerOffsetLng;

        return new L.LatLngBounds(
            [centerLat - delta, centerLng - delta],
            [centerLat + delta, centerLng + delta]
        );
    }, [storeLocation]);

    // Centro inicial deslocado para alinhar com a visualização desejada
    const initialCenter = useMemo(() => 
        [storeLocation[0] + 0.01, storeLocation[1] + 0.01] as [number, number]
    , [storeLocation]);

    useEffect(() => {
        if (isMobile) setSidebarOpen(false);
        else setSidebarOpen(true);
    }, [isMobile]);

    useEffect(() => {
        giveawayAudioRef.current = new Audio(GIVEAWAY_SOUND);
        prevGiveawayCount.current = giveawayEntries.length;
    }, []); 

    useEffect(() => {
        // Se não tem entradas ainda, não faz nada
        if (giveawayEntries.length === 0) return;

        // Se for o primeiro carregamento, apenas atualiza o contador e marca como não-primeiro
        if (isFirstLoad.current) {
            prevGiveawayCount.current = giveawayEntries.length;
            isFirstLoad.current = false;
            return;
        }

        if (giveawayEntries.length > prevGiveawayCount.current) {
            if (giveawayAudioRef.current) {
                const playPromise = giveawayAudioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => console.log("Áudio bloqueado:", error));
                }
            }
            const sorted = [...giveawayEntries].sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            const newest = sorted[0];
            if (newest) setNewLeadModal(newest);
        }
        prevGiveawayCount.current = giveawayEntries.length;
    }, [giveawayEntries]);

    return (
        <div className="flex h-screen w-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
             {showIntro && <IntroAnimation appName={appConfig.appName} onComplete={() => setShowIntro(false)} />}
             
             {/* Sidebar com largura fixa e firmeza (shrink-0 e min-w-[16rem]) */}
             <aside className={`${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0'} transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 w-64 min-w-[16rem] absolute md:relative z-50 h-full shadow-2xl overflow-hidden`}>
                 <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
                     <BrandLogo size="small" dark={false} config={appConfig} />
                     {isMobile && <button onClick={() => setSidebarOpen(false)} className="text-slate-500"><X size={20}/></button>}
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                     
                     <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 mt-2 px-2">Operação</p>
                     
                     {/* DASHBOARD AGORA PADRÃO (CINZA) */}
                     <SidebarBtn icon={<LayoutDashboard size={18}/>} label="Dashboard / Mapa" active={view==='map'} onClick={()=>setView('map')} />

                     <SidebarBtn icon={<ChefHat size={18}/>} label="Cozinha (KDS)" active={view==='kds'} onClick={()=>setView('kds')} highlight/>
                     <SidebarBtn icon={<CalendarCheck size={18}/>} label="Pedidos do Dia" active={view==='daily'} onClick={()=>setView('daily')} />
                     
                     {/* BOTÃO NOVO PEDIDO REPOSICIONADO E DESTACADO (ÚNICO LARANJA) */}
                     <div className="my-4 px-1">
                        <button onClick={() => { setShowManualOrder(true); if(isMobile) setSidebarOpen(false); }} className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-orange-900/40 border border-orange-500/30 tracking-wide text-sm transform hover:-translate-y-0.5">
                            <PlusCircle size={20}/> NOVO PEDIDO
                        </button>
                     </div>

                     <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 mt-4 px-2">Gestão</p>
                     <SidebarBtn icon={<Utensils size={18}/>} label="Cardápio" active={view==='menu'} onClick={()=>setView('menu')} />
                     <SidebarBtn icon={<Bike size={18}/>} label="Motoboys" active={view==='drivers'} onClick={()=>setView('drivers')} />
                     <SidebarBtn icon={<Users size={18}/>} label="Clientes & Leads" active={view==='clients'} onClick={()=>setView('clients')} />
                     <SidebarBtn icon={<ShoppingBag size={18}/>} label="Estoque & Compras" active={view==='inventory'} onClick={()=>setView('inventory')} />

                     <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 mt-4 px-2">Financeiro</p>
                     <SidebarBtn icon={<BarChart3 size={18}/>} label="Relatórios & Vendas" active={view==='analytics'} onClick={()=>setView('analytics')} />
                     <SidebarBtn icon={<FileText size={18}/>} label="Saída de Itens" active={view==='reports'} onClick={()=>setView('reports')} />
                 </div>

                 <div className="p-4 border-t border-slate-800 bg-slate-950/50 shrink-0">
                     <button onClick={() => setModal('settings')} className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors mb-2">
                         <Settings size={18}/> <span className="text-sm font-bold">Configurações</span>
                     </button>
                     <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-900/20 rounded-xl transition-colors">
                         <LogOut size={18}/> <span className="text-sm font-bold">Sair</span>
                     </button>
                 </div>
             </aside>

             <main className="flex-1 flex flex-col relative overflow-hidden w-full h-full bg-slate-950 min-w-0">
                <div className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-40">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400"><MenuIcon size={24}/></button>
                        <BrandLogo size="small" config={appConfig}/>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative w-full h-full">
                    
                    {view === 'map' && (
                        <div className="relative w-full h-full">
                            <MapContainer 
                                center={initialCenter} 
                                zoom={14} 
                                minZoom={12} 
                                maxBounds={mapBounds}
                                maxBoundsViscosity={0.7} 
                                style={{ height: '100%', width: '100%', zIndex: 0 }} 
                                zoomControl={false}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                />
                                <MapRecenter center={initialCenter} />
                                <Marker position={storeLocation} icon={iconStore}>
                                    <Popup><div className="text-center font-bold">{appConfig.appName || "Loja"}</div></Popup>
                                </Marker>
                                {onlineDrivers.map(d => (
                                    <Marker key={d.id} position={[d.lat || 0, d.lng || 0]} icon={createDriverIcon(d.avatar, d.status, d.lastUpdate)}>
                                        <Popup>
                                            <div className="p-2 text-center">
                                                <img src={d.avatar} className="w-8 h-8 rounded-full mx-auto mb-1"/>
                                                <strong className="block">{d.name}</strong>
                                                <div className="text-xs text-gray-500">{d.vehicle} • {d.plate}</div>
                                                <div className="mt-1 flex items-center justify-center gap-1 text-[10px] bg-slate-100 rounded px-1">
                                                    <Battery size={10} className={d.battery < 20 ? "text-red-500" : "text-green-500"}/> {d.battery}%
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>

                            {/* PAINEL ESQUERDO FLUTUANTE: RADAR DE PEDIDOS */}
                            <div className="absolute top-4 left-4 z-[400] w-72 md:w-80 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col transition-all duration-300 pointer-events-auto">
                                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Radar de Pedidos ({pendingOrders.length})</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                    {pendingOrders.length === 0 ? <div className="text-center py-6 text-slate-500 text-xs">Sem pedidos pendentes.</div> : pendingOrders.map(o => (
                                        <div key={o.id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 relative group hover:border-amber-500/50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-white text-sm truncate">{o.customer}</span>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${o.status === 'pending' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>{o.status === 'pending' ? 'Pendente' : 'Cozinha'}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-1"><MapPin size={10}/> {o.address}</div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => sendOrderConfirmation(o, appConfig.appName)} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white transition-colors shadow-sm" title="Enviar Mensagem ao Cliente"><MessageCircle size={12}/></button>
                                                <button onClick={() => setClientToEdit({name: o.customer, phone: o.phone, address: o.address, id: normalizePhone(o.phone)} as Client)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><Settings size={12}/></button>
                                                <button onClick={() => onDeleteOrder(o.id)} className="p-1.5 bg-slate-800 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={12}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PAINEL DIREITO FLUTUANTE: FROTA */}
                            <div className="absolute top-4 right-4 z-[400] w-64 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col hidden md:flex pointer-events-auto">
                                <div className="p-4 border-b border-slate-800">
                                    <h3 className="font-bold text-amber-500 text-xs uppercase tracking-widest flex items-center gap-2"><Bike size={14}/> Frota Ativa ({onlineDrivers.length})</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                    {onlineDrivers.length === 0 ? <div className="text-center py-6 text-slate-500 text-xs">Nenhum motoboy online.</div> : onlineDrivers.map(d => {
                                        const now = Date.now();
                                        const lastTime = d.lastUpdate?.seconds ? d.lastUpdate.seconds * 1000 : 0;
                                        const diffSeconds = (now - lastTime) / 1000;
                                        const isStale = diffSeconds > 120; // 2 min

                                        return (
                                            <div key={d.id} className={`flex items-center gap-3 p-2 rounded-xl border ${isStale ? 'bg-slate-950/20 border-slate-800 opacity-60' : 'bg-slate-950/50 border-slate-700'}`}>
                                                <div className="relative">
                                                    <img src={d.avatar} className={`w-10 h-10 rounded-full object-cover border border-slate-700 ${isStale ? 'grayscale' : ''}`}/>
                                                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${isStale ? 'bg-slate-500' : d.status==='available' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white text-xs truncate">{d.name}</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                        <span>{d.vehicle}</span>
                                                        {isStale ? (
                                                            <span className="text-red-400 font-bold flex items-center gap-0.5"><Signal size={8}/> Sem sinal</span>
                                                        ) : (
                                                            d.battery && <span className={`flex items-center gap-0.5 ${d.battery < 20 ? 'text-red-500' : 'text-slate-500'}`}><Battery size={8}/> {d.battery}%</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CONTROLES INFERIORES */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] flex gap-2 pointer-events-auto">
                                <button className="bg-slate-900/90 text-white p-3 rounded-xl border border-slate-700 shadow-lg hover:bg-slate-800 transition-colors" title="Centralizar Loja"><Navigation size={20}/></button>
                                <button className="bg-slate-900/90 text-white p-3 rounded-xl border border-slate-700 shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2"><Map size={20}/> <span className="text-xs font-bold hidden md:inline">Mapa</span></button>
                                <button onClick={() => { setShowManualOrder(true); }} className="bg-orange-600 hover:bg-orange-500 text-white p-3 rounded-xl shadow-lg transition-colors border border-orange-500"><Plus size={20}/></button>
                                <button className="bg-slate-900/90 text-white p-3 rounded-xl border border-slate-700 shadow-lg hover:bg-slate-800 transition-colors"><Bike size={20}/></button>
                            </div>
                        </div>
                    )}

                    {view === 'menu' && <MenuManager products={products} onCreate={props.onCreateProduct} onUpdate={props.onUpdateProduct} onDelete={props.onDeleteProduct} />}
                    {view === 'clients' && (
                        <ClientsView 
                            clients={clients} 
                            orders={orders} 
                            setModal={setModal} 
                            setClientToEdit={setClientToEdit} 
                            giveawayEntries={giveawayEntries}
                            appConfig={appConfig} 
                        />
                    )}
                    {view === 'kds' && <KitchenDisplay orders={orders} products={products} drivers={drivers} onUpdateStatus={onUpdateOrder} onAssignOrder={onAssignOrder} onDeleteOrder={onDeleteOrder} appConfig={appConfig} />}
                    {view === 'inventory' && (
                        <InventoryManager 
                            inventory={inventory} suppliers={suppliers} shoppingList={shoppingList}
                            onCreateSupplier={props.onCreateSupplier} onUpdateSupplier={props.onUpdateSupplier} onDeleteSupplier={props.onDeleteSupplier}
                            onCreateInventory={props.onCreateInventory} onUpdateInventory={props.onUpdateInventory} onDeleteInventory={props.onDeleteInventory}
                            onAddShoppingItem={props.onAddShoppingItem} onToggleShoppingItem={props.onToggleShoppingItem} onDeleteShoppingItem={props.onDeleteShoppingItem} onClearShoppingList={props.onClearShoppingList}
                            appConfig={appConfig}
                        />
                    )}
                    {view === 'daily' && <DailyOrdersView orders={orders} drivers={drivers} onDeleteOrder={onDeleteOrder} setModal={setModal} onUpdateOrder={onUpdateOrder} appConfig={appConfig} />}
                    {view === 'analytics' && <AnalyticsView orders={orders} products={products} />}
                    {view === 'reports' && <ItemReportView orders={orders} />}
                    
                    {view === 'drivers' && (
                        <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Bike className="text-amber-500"/> Gestão de Motoboys</h2>
                                <button onClick={() => { setDriverToEdit(null); setModal('driver'); }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-emerald-700 transition-colors">Novo Motoboy</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {drivers.map(d => (
                                    <div key={d.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <img src={d.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-slate-700" alt={d.name}/>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{d.name}</h3>
                                                <p className="text-xs text-slate-500 uppercase font-bold">{d.vehicle} • {d.plate || 'S/ Placa'}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${d.status === 'offline' ? 'bg-slate-800 text-slate-500' : d.status === 'available' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>
                                                {d.status === 'offline' ? 'Offline' : d.status === 'available' ? 'Disponível' : 'Em Rota'}
                                            </span>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setDriverToEdit(d); setModal('driver'); }} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg"><Settings size={16}/></button>
                                                <button onClick={() => props.onDeleteDriver(d.id)} className="p-2 bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg"><LogOut size={16}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
             </main>

             {/* MODAL DE NOVO PEDIDO MANUAL (PDV) */}
             {showManualOrder && (
                 <ManualOrderView 
                     products={products} 
                     clients={clients} 
                     onCreateOrder={props.onCreateOrder} 
                     onClose={() => setShowManualOrder(false)}
                     appConfig={appConfig}
                 />
             )}

             {newLeadModal && <NewLeadNotificationModal lead={newLeadModal} onClose={() => setNewLeadModal(null)} />}
        </div>
    );
}