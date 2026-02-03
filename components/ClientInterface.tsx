
import React, { useState, useMemo } from 'react';
import { Product, AppConfig, UserType } from '../types';
import { formatCurrency, checkShopStatus, normalizePhone, generatePixPayload, copyToClipboard } from '../utils';
import { 
    ShoppingCart, Plus, Minus, X, MessageCircle, ChevronRight, 
    Search, Utensils, Phone, User, Store, Gift, Lock, Bike,
    MapPin, Navigation, CreditCard, Banknote, ArrowLeft, Clock, Copy, QrCode, AlertTriangle, CalendarClock, CheckCircle2, Home, Check
} from 'lucide-react';
import { Footer, PixIcon } from './Shared';

interface ClientInterfaceProps {
    products: Product[];
    appConfig: AppConfig;
    onCreateOrder: (data: any) => void;
    onEnterGiveaway: (data: any) => void;
    allowSystemAccess: boolean;
    onSystemAccess: (type: UserType) => void;
}

export default function ClientInterface({ 
    products, 
    appConfig, 
    onCreateOrder, 
    onEnterGiveaway,
    allowSystemAccess,
    onSystemAccess 
}: ClientInterfaceProps) {
    // State for Cart & Checkout
    const [cart, setCart] = useState<{product: Product, quantity: number, obs: string}[]>([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    
    // Customer Info
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState(''); // Garante que inicia vazio
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [changeFor, setChangeFor] = useState('');
    const [serviceType, setServiceType] = useState<'delivery' | 'pickup'>('delivery');
    const [isLocating, setIsLocating] = useState(false);
    
    // UI Feedback States
    const [showCopyFeedback, setShowCopyFeedback] = useState(false);
    const [showPixCodeFeedback, setShowPixCodeFeedback] = useState(false);
    
    // Confirmation Modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastOrderData, setLastOrderData] = useState<any>(null);

    // Navigation
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Giveaway
    const [showGiveaway, setShowGiveaway] = useState(false);
    const [giveawayName, setGiveawayName] = useState('');
    const [giveawayPhone, setGiveawayPhone] = useState('');

    // Shop Status
    const shopStatus = checkShopStatus(appConfig.schedule);

    // Categories
    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category)));
        const priority = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        return ['Todos', ...cats.sort((a, b) => {
            const idxA = priority.indexOf(a);
            const idxB = priority.indexOf(b);
            if(idxA !== -1 && idxB !== -1) return idxA - idxB;
            if(idxA !== -1) return -1;
            if(idxB !== -1) return 1;
            return a.localeCompare(b);
        })];
    }, [products]);

    // Group Products by Category for the view
    const groupedProducts = useMemo(() => {
        let prods = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (selectedCategory !== 'Todos') {
            prods = prods.filter(p => p.category === selectedCategory);
        }

        const groups: {[key: string]: Product[]} = {};
        prods.forEach(p => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });

        // Sort categories order
        const priority = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        return Object.entries(groups).sort(([catA], [catB]) => {
            const idxA = priority.indexOf(catA);
            const idxB = priority.indexOf(catB);
            if(idxA !== -1 && idxB !== -1) return idxA - idxB;
            if(idxA !== -1) return -1;
            if(idxB !== -1) return 1;
            return catA.localeCompare(catB);
        });
    }, [products, selectedCategory, searchTerm]);

    // Cart Logic
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if(existing) {
                return prev.map(i => i.product.id === product.id ? {...i, quantity: i.quantity + 1} : i);
            }
            return [...prev, { product, quantity: 1, obs: '' }];
        });
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[index].quantity += delta;
            if (newCart[index].quantity <= 0) newCart.splice(index, 1);
            return newCart;
        });
    };

    const handleGeolocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data && data.address) {
                        const road = data.address.road || '';
                        const number = data.address.house_number || '';
                        const suburb = data.address.suburb || data.address.neighbourhood || '';
                        
                        // SÓ PREENCHE SE TIVER O NOME DA RUA
                        if (road) {
                            setAddress(`${road}, ${number} - ${suburb}`);
                        } else {
                            setAddress(""); // Limpa se não achar rua
                            alert("Localizamos a região, mas não o nome da rua exato. Por favor, digite seu endereço completo.");
                        }
                    } else {
                        setAddress("");
                        alert("Não foi possível identificar o endereço exato. Por favor, escreva manualmente.");
                    }
                } catch (e) {
                    setAddress("");
                    alert("Erro ao buscar endereço. Por favor, digite manualmente.");
                } finally {
                    setIsLocating(false);
                }
            }, (error) => {
                alert("Permissão de localização negada ou erro no GPS. Por favor, digite o endereço.");
                setIsLocating(false);
            });
        } else {
            alert("Geolocalização não suportada neste dispositivo.");
            setIsLocating(false);
        }
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

    const pixPayload = useMemo(() => {
        if (paymentMethod === 'PIX' && appConfig.pixKey) {
            return generatePixPayload(appConfig.pixKey, appConfig.pixName || '', appConfig.pixCity || '', cartTotal, 'PEDIDO');
        }
        return '';
    }, [paymentMethod, appConfig, cartTotal]);

    const handlePreCheckout = () => {
        if (!customerName || !phone) return alert("Por favor, preencha seu nome e telefone.");
        if (serviceType === 'delivery' && !address) return alert("Por favor, informe o endereço de entrega.");
        if (cart.length === 0) return alert("Carrinho vazio.");
        
        const itemsText = cart.map(i => `${i.quantity}x ${i.product.name}${i.obs ? ` (${i.obs})` : ''}`).join('\n');
        
        const finalAddress = serviceType === 'delivery' ? address : 'Retirada no Balcão';
        
        // Adiciona aviso de Loja Fechada na observação se necessário
        let obsFinal = '';
        if (!shopStatus.isOpen) {
            obsFinal = `[PEDIDO AGENDADO - LOJA FECHADA]`;
        }

        const orderData = {
            customer: customerName,
            phone: phone,
            address: finalAddress,
            items: itemsText,
            amount: formatCurrency(cartTotal),
            value: cartTotal,
            paymentMethod: paymentMethod + (paymentMethod === 'Dinheiro' && changeFor ? ` (Troco p/ ${changeFor})` : ''),
            status: 'pending',
            origin: 'menu',
            serviceType: serviceType,
            obs: obsFinal
        };

        // Salva no banco primeiro
        onCreateOrder(orderData);
        
        // Prepara dados para o modal de sucesso/whatsapp
        setLastOrderData(orderData);
        setCart([]); // Limpa o carrinho
        setIsCheckoutOpen(false); // Fecha a tela de checkout
        setShowSuccessModal(true); // Abre modal de sucesso
    };

    const handleSendToWhatsApp = () => {
        if (!lastOrderData) return;

        const isScheduled = !shopStatus.isOpen;
        
        let waText = `*${isScheduled ? '📅 PEDIDO AGENDADO' : 'NOVO PEDIDO'} - ${appConfig.appName}*\n\n`;
        waText += `*Cliente:* ${lastOrderData.customer}\n`;
        waText += `*Tel:* ${lastOrderData.phone}\n`;
        waText += `*Tipo:* ${lastOrderData.serviceType === 'delivery' ? 'Entrega 🛵' : 'Retirada 🥡'}\n`;
        waText += `*Endereço:* ${lastOrderData.address}\n\n`;
        
        waText += `*ITENS:*\n${lastOrderData.items}\n\n`;
        waText += `*Total:* ${formatCurrency(lastOrderData.value)}\n`;
        waText += `*Pagamento:* ${lastOrderData.paymentMethod}`;

        const waUrl = `https://wa.me/${appConfig.storeCountryCode?.replace('+','')||'55'}${appConfig.storePhone?.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`;
        
        window.open(waUrl, '_blank');
    };

    const handleBackToMenu = () => {
        setShowSuccessModal(false);
        setLastOrderData(null);
    };
    
    const handleGiveawaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onEnterGiveaway({ name: giveawayName, phone: giveawayPhone });
        setShowGiveaway(false);
        alert("Participação confirmada! Boa sorte.");
    };

    // FUNÇÕES DE CÓPIA COM FEEDBACK
    const handleCopyKey = () => {
        copyToClipboard(appConfig.pixKey || '');
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
    };

    const handleCopyPixCode = () => {
        if (pixPayload) {
            copyToClipboard(pixPayload);
            setShowPixCodeFeedback(true);
            setTimeout(() => setShowPixCodeFeedback(false), 2000);
        }
    };

    if (isCheckoutOpen) {
        return (
            <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans">
                {/* Header Carrinho */}
                <div className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-50 shadow-md">
                    <button onClick={() => setIsCheckoutOpen(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"><ArrowLeft size={20}/></button>
                    <h2 className="text-lg font-bold flex items-center gap-2">Seu Carrinho <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full">{cart.length}</span></h2>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto pb-36 custom-scrollbar">
                    <div className="max-w-md mx-auto space-y-6">
                        
                        {!shopStatus.isOpen && (
                            <div className="bg-red-900/20 border-l-4 border-red-500 rounded-r-xl p-4 flex flex-col gap-3 shadow-lg animate-in fade-in">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-500/20 p-2 rounded-full text-red-500 animate-pulse"><Clock size={20}/></div>
                                    <div>
                                        <h3 className="font-black text-red-100 text-sm uppercase tracking-wide">Loja Fechada</h3>
                                        <p className="text-xs text-red-200/70 mt-1">
                                            Reabrimos: <span className="font-bold text-white">{shopStatus.nextOpen}</span>.
                                        </p>
                                        <p className="text-[10px] text-red-300/60 mt-1 italic">
                                            Você pode confirmar o pedido e prepararemos assim que abrirmos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {cart.map((item, idx) => (
                                <div key={idx} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-800 p-2 rounded-lg text-amber-500"><Utensils size={16}/></div>
                                            <div>
                                                <p className="font-bold text-white text-sm leading-tight">{item.product.name}</p>
                                                <p className="text-emerald-400 font-bold text-xs mt-0.5">{formatCurrency(item.product.price)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 h-8">
                                            <button onClick={() => updateQuantity(idx, -1)} className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-l-lg transition-colors"><Minus size={14}/></button>
                                            <span className="w-8 text-center font-bold text-sm text-white">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(idx, 1)} className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-r-lg transition-colors"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                    
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-500/50 placeholder:text-slate-600 transition-colors"
                                        placeholder="Observação (Ex: Sem cebola, capricha no molho...)"
                                        value={item.obs}
                                        onChange={e => {
                                            const newCart = [...cart];
                                            newCart[idx].obs = e.target.value;
                                            setCart(newCart);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 pl-1">Entrega</p>
                            
                            <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 mb-4">
                                <button 
                                    onClick={() => setServiceType('delivery')}
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${serviceType === 'delivery' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <Bike size={14}/> Entrega
                                </button>
                                <button 
                                    onClick={() => setServiceType('pickup')}
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${serviceType === 'pickup' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <Store size={14}/> Retirada
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><User size={16}/></div>
                                    <input className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-emerald-500 focus:bg-slate-900 transition-colors" placeholder="Seu Nome" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                                </div>
                                
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Phone size={16}/></div>
                                    <input className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-emerald-500 focus:bg-slate-900 transition-colors" placeholder="Seu WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
                                </div>

                                {serviceType === 'delivery' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2">
                                        <button 
                                            onClick={handleGeolocation}
                                            className="w-full bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-900/30 transition-colors"
                                        >
                                            {isLocating ? <span className="animate-pulse">Localizando...</span> : <><Navigation size={14}/> Usar minha localização atual</>}
                                        </button>
                                        
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><MapPin size={16}/></div>
                                            <input 
                                                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-emerald-500 focus:bg-slate-900 transition-colors" 
                                                placeholder="Digite seu endereço (Rua, Número, Bairro)" 
                                                value={address} 
                                                onChange={e => setAddress(e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 pl-1">Pagamento</p>
                            <div className="grid grid-cols-3 gap-2">
                                {['PIX', 'Dinheiro', 'Cartão'].map(method => (
                                    <button 
                                        key={method}
                                        onClick={() => setPaymentMethod(method)}
                                        className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${paymentMethod === method ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}
                                    >
                                        {method === 'PIX' && <PixIcon size={20}/>}
                                        {method === 'Dinheiro' && <Banknote size={20}/>}
                                        {method === 'Cartão' && <CreditCard size={20}/>}
                                        <span className="text-[10px] font-bold uppercase">{method}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {paymentMethod === 'Dinheiro' && (
                                <div className="mt-3 animate-in slide-in-from-top-1">
                                    <input className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors" placeholder="Precisa de troco para quanto?" value={changeFor} onChange={e => setChangeFor(e.target.value)} />
                                </div>
                            )}

                            {paymentMethod === 'PIX' && (
                                <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                                        <div className="flex justify-between items-center relative">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold">Chave PIX</span>
                                            
                                            {/* BOTÃO COPIAR COM FEEDBACK SUAVE */}
                                            <div className="relative">
                                                <button 
                                                    onClick={handleCopyKey} 
                                                    className={`transition-all duration-300 p-1.5 rounded-lg ${showCopyFeedback ? 'bg-emerald-500 text-white' : 'text-emerald-500 hover:text-white hover:bg-emerald-900/30'}`} 
                                                    title="Copiar Chave"
                                                >
                                                    {showCopyFeedback ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                                {/* MODAL/TOOLTIP FLUTUANTE DE FEEDBACK */}
                                                {showCopyFeedback && (
                                                    <div className="absolute top-1/2 right-full mr-3 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-right-2 flex items-center gap-1 z-10">
                                                        <Check size={10} strokeWidth={4}/> Copiado!
                                                        {/* Seta do balão */}
                                                        <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-emerald-500"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-white font-mono text-sm truncate">{appConfig.pixKey || 'Chave não configurada'}</p>
                                        
                                        <div className="pt-2 mt-1 border-t border-slate-700/50">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Favorecido:</p>
                                            <p className="text-emerald-400 text-xs font-bold">Jhans Burgers / Jair de Oliveira</p>
                                        </div>
                                    </div>

                                    {pixPayload && (
                                        <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-xl p-3">
                                            <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                                <QrCode size={16}/>
                                                <span className="text-xs font-bold uppercase">Pix Copia e Cola</span>
                                            </div>
                                            <div className="relative">
                                                <textarea 
                                                    readOnly 
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-400 font-mono h-20 resize-none outline-none focus:border-emerald-500/50 custom-scrollbar"
                                                    value={pixPayload}
                                                />
                                                <div className="absolute bottom-2 right-2">
                                                    <button 
                                                        onClick={handleCopyPixCode}
                                                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg transition-all flex items-center gap-1 ${showPixCodeFeedback ? 'bg-emerald-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                                                    >
                                                        {showPixCodeFeedback ? <Check size={12}/> : <Copy size={12}/>}
                                                        {showPixCodeFeedback ? 'Copiado!' : 'Copiar Código'}
                                                    </button>
                                                    {/* FEEDBACK FLUTUANTE CÓDIGO */}
                                                    {showPixCodeFeedback && (
                                                        <div className="absolute bottom-full right-0 mb-2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded shadow-lg animate-in zoom-in fade-in whitespace-nowrap">
                                                            Código Copiado!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                <div className="bg-slate-900 border-t border-slate-800 p-4 pb-safe z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
                    <div className="max-w-md mx-auto">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-xs text-slate-400 mb-0.5">Subtotal</p>
                                <p className="text-2xl font-black text-white">{formatCurrency(cartTotal)}</p>
                            </div>
                            {serviceType === 'delivery' && (
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 mb-0.5">Entrega</p>
                                    <p className="text-sm font-bold text-slate-300">A calcular</p>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={handlePreCheckout} 
                            className="w-full text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm uppercase tracking-wide bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-900/20"
                        >
                            <CheckCircle2 size={20}/> Confirmar Pedido
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#020617] min-h-screen font-sans pb-24">
            {/* Header Red Gradient - Matching Exact Color from Screenshot */}
            <div className="bg-gradient-to-r from-[#ef4444] to-[#f97316] pt-4 pb-12 px-4 rounded-b-[2rem] shadow-2xl relative overflow-hidden">
                <div className="max-w-5xl mx-auto relative z-10">
                    {/* Top Nav */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3 text-white font-bold">
                            {appConfig.appLogoUrl ? (
                                <img src={appConfig.appLogoUrl} className="w-10 h-10 rounded-full border-2 border-white/20"/>
                            ) : (
                                <div className="bg-black/20 p-2 rounded-xl"><Utensils size={20}/></div>
                            )}
                            <span className="text-xl tracking-tight drop-shadow-md">{appConfig.appName}</span>
                        </div>
                        {allowSystemAccess && (
                            <div className="flex gap-2">
                                <button onClick={() => onSystemAccess('admin')} className="text-[10px] font-bold bg-black/20 hover:bg-black/40 text-white px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors backdrop-blur-md border border-white/10 uppercase">
                                    <Store size={12}/> Gerente
                                </button>
                                <button onClick={() => onSystemAccess('driver')} className="text-[10px] font-bold bg-black/20 hover:bg-black/40 text-white px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors backdrop-blur-md border border-white/10 uppercase">
                                    <Bike size={12}/> Motoboy
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Hero Text */}
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-8 leading-tight drop-shadow-md">
                        Bateu a fome?<br/>
                        Peça agora mesmo! 🍔
                    </h1>

                    {/* Promo Card with Dynamic Banner */}
                    <div className="bg-[#7f1d1d]/90 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl backdrop-blur-sm group min-h-[180px] flex flex-col justify-center">
                        <div className="absolute right-[-40px] top-[-40px] w-48 h-48 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/30 transition-colors"></div>
                        
                        <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
                            <div className="text-center md:text-left flex-1">
                                <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider shadow-sm">
                                    🔥 Sorteio Oficial
                                </span>
                                <h2 className="text-3xl font-black text-white italic tracking-tight mb-1">
                                    COMBO CASAL <span className="text-amber-400">CLASSIC</span>
                                </h2>
                                <p className="text-red-100 text-xs font-bold mb-5 flex items-center justify-center md:justify-start gap-1.5 opacity-90">
                                    <Gift size={14} className="text-amber-400"/> Concorra a 2 Burgers + Batata + Refri!
                                </p>
                                <button 
                                    onClick={() => setShowGiveaway(true)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-black py-3 px-8 rounded-full text-xs uppercase tracking-wide shadow-lg shadow-emerald-900/30 transition-transform active:scale-95 flex items-center gap-2 mx-auto md:mx-0"
                                >
                                    QUERO PARTICIPAR <ChevronRight size={14} strokeWidth={3}/>
                                </button>
                            </div>
                            
                            {/* IMAGEM DINÂMICA DO BANNER */}
                            <div className="shrink-0 relative">
                                {appConfig.bannerUrl ? (
                                    <div className="relative group-hover:scale-105 transition-transform duration-500">
                                        <div className="absolute inset-0 bg-black/20 rounded-xl transform rotate-6"></div>
                                        <img 
                                            src={appConfig.bannerUrl} 
                                            alt="Promo Banner" 
                                            className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-xl shadow-2xl border-2 border-white/20 transform rotate-3 relative z-10"
                                        />
                                        <span className="absolute -bottom-2 -left-2 z-20 bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 whitespace-nowrap shadow-lg">Oferta!</span>
                                    </div>
                                ) : (
                                    <div className="animate-bounce-slow transform rotate-12 hover:rotate-0 transition-transform duration-500 relative">
                                        <Gift size={80} className="text-amber-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"/>
                                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 whitespace-nowrap">Grátis!</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 pt-3 border-t border-white/10 text-center md:text-left">
                            <p className="text-[10px] font-mono text-red-200/70 bg-black/20 inline-block px-3 py-1 rounded-lg">
                                📸 Sorteio: Quarta-feira 04/02/26 às 19h @jhansburgers
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Section */}
            <div className="max-w-5xl mx-auto px-4 -mt-6 relative z-20">
                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                    <input 
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-full py-4 pl-12 pr-6 text-white placeholder:text-slate-600 focus:border-slate-600 outline-none shadow-xl transition-all text-sm font-medium"
                        placeholder="Buscar lanche, bebida..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Categories */}
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar mb-4">
                    {['Todos', ...new Set(products.map(p => p.category))].map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-md ${selectedCategory === cat ? 'bg-white text-slate-900 scale-105' : 'bg-[#0f172a] text-slate-400 border border-slate-800 hover:border-slate-600'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Shop Closed Banner */}
                {!shopStatus.isOpen && (
                    <div className="bg-red-900/20 border-l-4 border-red-500 rounded-r-xl p-4 mb-6 flex items-start gap-3 shadow-lg">
                        <div className="bg-red-500/20 p-2 rounded-full text-red-500 animate-pulse"><Clock size={20}/></div>
                        <div>
                            <h3 className="font-black text-red-100 text-sm uppercase tracking-wide">Loja Fechada</h3>
                            <p className="text-xs text-red-200/70 mt-1">
                                Seu pedido será agendado como <span className="text-white font-bold bg-red-600 px-1 rounded">PRÉ-VENDA</span>.
                            </p>
                            <p className="text-[10px] text-red-300 mt-2 font-bold flex items-center gap-1">
                                <Clock size={10}/> Reabrimos: {shopStatus.nextOpen}
                            </p>
                        </div>
                    </div>
                )}

                {/* Products Grouped */}
                <div className="space-y-8 pb-10">
                    {groupedProducts.map(([category, items]) => (
                        <div key={category} className="animate-in slide-in-from-bottom-4 duration-700">
                            <h3 className="text-white font-black text-lg mb-4 flex items-center gap-3 uppercase tracking-wider pl-1 border-l-4 border-orange-500">
                                {category}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {items.map(product => (
                                    <div 
                                        key={product.id} 
                                        onClick={() => addToCart(product)}
                                        className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg group relative overflow-hidden cursor-pointer h-full"
                                    >
                                        <div className="relative z-10 flex flex-col h-full">
                                            <h4 className="font-bold text-white text-lg mb-2 group-hover:text-amber-500 transition-colors line-clamp-1">{product.name}</h4>
                                            <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4 flex-1">{product.description}</p>
                                            
                                            <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-800/50">
                                                <span className="text-amber-500 font-bold text-lg">{formatCurrency(product.price)}</span>
                                                <button 
                                                    className="bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-md"
                                                >
                                                    <Plus size={16}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {groupedProducts.length === 0 && (
                        <div className="text-center py-20 text-slate-600">
                            <Utensils size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>Nenhum item encontrado.</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />

            {/* Floating Cart Bar (Red Style) */}
            {cart.length > 0 && !isCheckoutOpen && (
                <div className="fixed bottom-6 left-4 right-4 z-50 max-w-5xl mx-auto animate-in slide-in-from-bottom-10">
                    <button 
                        onClick={() => setIsCheckoutOpen(true)}
                        className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-4 rounded-xl shadow-[0_10px_30px_rgba(239,68,68,0.4)] flex items-center justify-between transition-transform active:scale-95"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-black/20 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-inner">
                                {cart.reduce((a,b) => a + b.quantity, 0)}
                            </div>
                            <span className="font-black text-sm uppercase tracking-wider">VER CARRINHO</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-black text-lg">{formatCurrency(cartTotal)}</span>
                            <ChevronRight size={20} strokeWidth={3}/>
                        </div>
                    </button>
                </div>
            )}

            {/* Giveaway Modal */}
            {showGiveaway && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-purple-500/50 p-8 shadow-2xl relative">
                        <button onClick={() => setShowGiveaway(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2"><X size={24}/></button>
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                                <Gift size={40} className="text-purple-400"/>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase italic">Sorteio da Casa</h3>
                            <p className="text-slate-400 text-sm mt-2">Cadastre-se para concorrer a prêmios exclusivos!</p>
                        </div>
                        
                        <form onSubmit={handleGiveawaySubmit} className="space-y-4">
                             <input required placeholder="Seu Nome" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-colors" value={giveawayName} onChange={e => setGiveawayName(e.target.value)} />
                             <input required placeholder="Seu WhatsApp" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-colors" value={giveawayPhone} onChange={e => setGiveawayPhone(e.target.value)} />
                             <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl shadow-lg mt-2 uppercase tracking-wide">Quero Participar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* SUCCESS / SEND MODAL */}
            {showSuccessModal && lastOrderData && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in duration-300">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] p-8 relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 animate-pulse"></div>
                        
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/10">
                            <CheckCircle2 size={48} className="text-emerald-400 animate-bounce"/>
                        </div>

                        <h2 className="text-3xl font-black text-white italic uppercase tracking-wide mb-2">
                            Pedido Recebido!
                        </h2>
                        
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Quase lá! Para confirmar e começarmos a preparar, clique no botão abaixo para enviar o pedido no nosso WhatsApp.
                        </p>

                        <div className="bg-slate-950 rounded-xl p-4 mb-6 border border-slate-800 text-left">
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Resumo</p>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-white font-bold">{lastOrderData.customer}</span>
                                <span className="text-emerald-400 font-bold">{formatCurrency(lastOrderData.value)}</span>
                            </div>
                            {!shopStatus.isOpen && (
                                <p className="text-xs text-amber-500 mt-2 font-bold flex items-center gap-1">
                                    <Clock size={12}/> Pedido Agendado
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={handleSendToWhatsApp}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-3 text-sm uppercase tracking-wider"
                            >
                                <MessageCircle size={24}/> Enviar no WhatsApp
                            </button>
                            
                            <button 
                                onClick={handleBackToMenu}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold py-3 rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
                            >
                                <Home size={16}/> Voltar ao Cardápio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
