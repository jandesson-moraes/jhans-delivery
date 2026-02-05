
import React, { useState, useMemo, useEffect } from 'react';
import { Product, AppConfig, UserType, GiveawayFieldConfig } from '../types';
import { formatCurrency, checkShopStatus, normalizePhone, generatePixPayload, copyToClipboard, formatPhoneNumberDisplay } from '../utils';
import { 
    ShoppingCart, Plus, Minus, X, MessageCircle, ChevronRight, 
    Search, Utensils, Phone, User, Store, Gift, Lock, Bike,
    MapPin, Navigation, CreditCard, Banknote, ArrowLeft, Clock, Copy, QrCode, AlertTriangle, CalendarClock, CheckCircle2, Home, Check, Sparkles, Trophy, Flame, Timer, Ticket, Instagram, Edit, Mail, Calendar, HelpCircle, Image as ImageIcon
} from 'lucide-react';
import { Footer, PixIcon } from './Shared';

interface ClientInterfaceProps {
    products: Product[];
    appConfig: AppConfig;
    onCreateOrder: (data: any) => void;
    onEnterGiveaway: (data: any) => void;
    allowSystemAccess: boolean;
    onSystemAccess: (type: UserType) => void;
    onRecordVisit: () => void; // Nova função para registrar visita
}

export default function ClientInterface({ 
    products, 
    appConfig, 
    onCreateOrder, 
    onEnterGiveaway,
    allowSystemAccess,
    onSystemAccess,
    onRecordVisit
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
    const [giveawayCopyFeedback, setGiveawayCopyFeedback] = useState(false);
    
    // Confirmation Modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastOrderData, setLastOrderData] = useState<any>(null);

    // Navigation
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Giveaway
    const [showGiveaway, setShowGiveaway] = useState(false);
    const [showGiveawaySuccess, setShowGiveawaySuccess] = useState(false); // Novo modal de sucesso
    
    // Giveaway Form State Dynamic
    const [giveawayForm, setGiveawayForm] = useState<Record<string, string>>({});

    // Shop Status
    const shopStatus = checkShopStatus(appConfig.schedule);

    // --- VISIT TRACKING ON MOUNT ---
    useEffect(() => {
        // Verifica se já registrou visita nesta sessão para não duplicar F5
        const hasVisited = sessionStorage.getItem('jhans_visit_logged');
        if (!hasVisited) {
            onRecordVisit();
            sessionStorage.setItem('jhans_visit_logged', 'true');
        }
    }, []);

    // --- FACEBOOK PIXEL INJECTION ---
    useEffect(() => {
        if (appConfig.facebookPixelId) {
            const scriptId = 'facebook-pixel-script';
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.innerHTML = `
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${appConfig.facebookPixelId}');
                    fbq('track', 'PageView');
                `;
                document.head.appendChild(script);
            }
        }
    }, [appConfig.facebookPixelId]);

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
        
        // Track AddToCart Pixel event
        if ((window as any).fbq) {
            (window as any).fbq('track', 'AddToCart', {
                content_name: product.name,
                value: product.price,
                currency: 'BRL'
            });
        }
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
        if (!("geolocation" in navigator)) {
            alert("Seu dispositivo não suporta geolocalização.");
            return;
        }

        setIsLocating(true);
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Tenta buscar o endereço com headers adequados
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
                        headers: {
                            'User-Agent': 'JhansBurgersApp/1.0',
                            'Accept-Language': 'pt-BR'
                        }
                    });
                    
                    if (!response.ok) throw new Error('Erro API Mapa');
                    
                    const data = await response.json();
                    
                    if (data && data.address) {
                        const road = data.address.road || data.address.pedestrian || data.address.street || '';
                        const number = data.address.house_number || '';
                        const suburb = data.address.suburb || data.address.neighbourhood || data.address.district || '';
                        const city = data.address.city || data.address.town || '';
                        
                        let fullAddress = '';
                        if (road) fullAddress += road;
                        if (number) fullAddress += `, ${number}`;
                        else if (road) fullAddress += `, S/N`;
                        if (suburb) fullAddress += ` - ${suburb}`;
                        if (city) fullAddress += ` - ${city}`;

                        if (fullAddress) {
                            setAddress(fullAddress);
                        } else {
                            // Se não achou rua, usa coordenadas
                            setAddress(`Localização GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                            alert("Não encontramos o nome da rua exato. As coordenadas foram preenchidas. Por favor, adicione referências.");
                        }
                    } else {
                        setAddress(`Localização GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                        alert("Endereço não encontrado pelo mapa. Usando coordenadas GPS.");
                    }
                } catch (e) {
                    console.error(e);
                    // Fallback em caso de erro na API (ex: sem internet ou bloqueio)
                    setAddress(`Localização GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                    alert("Erro ao buscar endereço no mapa. Preenchemos com suas coordenadas GPS.");
                } finally {
                    setIsLocating(false);
                }
            }, 
            (error) => {
                console.error(error);
                let msg = "Erro ao obter localização.";
                if (error.code === 1) msg = "Permissão de localização negada. Ative nas configurações do navegador.";
                else if (error.code === 2) msg = "Sinal de GPS indisponível.";
                else if (error.code === 3) msg = "Tempo limite esgotado.";
                
                alert(msg + " Por favor, digite seu endereço manualmente.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
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

        // Track Purchase Pixel event
        if ((window as any).fbq) {
            (window as any).fbq('track', 'Purchase', {
                value: cartTotal,
                currency: 'BRL'
            });
        }
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

        // SAFE PHONE CHECK
        const storePhone = appConfig.storePhone ? appConfig.storePhone.replace(/\D/g, '') : '';
        const countryCode = appConfig.storeCountryCode ? appConfig.storeCountryCode.replace('+','') : '55';
        
        if (!storePhone) {
            alert("Erro: Telefone da loja não configurado no painel Admin.");
            return;
        }

        const waUrl = `https://wa.me/${countryCode}${storePhone}?text=${encodeURIComponent(waText)}`;
        
        window.open(waUrl, '_blank');
    };

    const handleBackToMenu = () => {
        setShowSuccessModal(false);
        setLastOrderData(null);
    };
    
    // Manipulação dinâmica do formulário de sorteio
    const handleGiveawaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validar campos obrigatórios dinamicamente
        const fields = appConfig.giveawaySettings?.fields || [];
        for (const field of fields) {
            if (field.enabled && field.required && !giveawayForm[field.id]) {
                alert(`Por favor, preencha o campo: ${field.label}`);
                return;
            }
        }

        // Pega nome e telefone para compatibilidade com sistema antigo, mas salva tudo no dynamicData
        const name = giveawayForm['name'] || 'Anônimo';
        const phone = giveawayForm['phone'] || '';
        
        onEnterGiveaway({ 
            name: name,
            phone: phone,
            dynamicData: giveawayForm, // Salva todas as respostas aqui
            confirmed: false
        });
        
        setShowGiveaway(false);
        setShowGiveawaySuccess(true);
    };

    const getGiveawayText = () => {
        const title = appConfig.giveawaySettings?.title || 'Sorteio';
        let waText = `*🎟️ INSCRIÇÃO SORTEIO - ${appConfig.appName}*\n*${title.toUpperCase()}*\n\n`;
        
        const fields = appConfig.giveawaySettings?.fields || [];
        
        fields.forEach(field => {
            if (field.enabled && giveawayForm[field.id]) {
                waText += `*${field.label}:* ${giveawayForm[field.id]}\n`;
            }
        });

        waText += `\n✅ Confirmo que li e aceito as regras.\n`;
        waText += `Quero confirmar minha participação! 🍀`;
        return waText;
    };

    const handleSendGiveawayToWhatsApp = () => {
        const waText = getGiveawayText();
        
        // SAFE PHONE CHECK
        const storePhone = appConfig.storePhone ? appConfig.storePhone.replace(/\D/g, '') : '';
        const countryCode = appConfig.storeCountryCode ? appConfig.storeCountryCode.replace('+','') : '55';
        
        if (!storePhone) {
            alert("Erro: Telefone da loja não configurado.");
            return;
        }

        const waUrl = `https://wa.me/${countryCode}${storePhone}?text=${encodeURIComponent(waText)}`;
        window.open(waUrl, '_blank');
        setShowGiveawaySuccess(false);
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

    // Renderizar inputs dinâmicos
    const renderGiveawayField = (field: GiveawayFieldConfig) => {
        const value = giveawayForm[field.id] || '';
        const setValue = (val: string) => setGiveawayForm(prev => ({...prev, [field.id]: val}));

        // Ícone baseado no ID ou tipo
        let Icon = User;
        if (field.type === 'phone') Icon = Phone;
        if (field.type === 'email') Icon = Mail;
        if (field.type === 'date') Icon = Calendar;
        if (field.id === 'instagram') Icon = Instagram;
        if (field.id === 'custom') Icon = HelpCircle;

        return (
            <div key={field.id} className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><Icon size={16}/></div>
                <input 
                    required={field.required}
                    type={field.type === 'date' ? 'date' : 'text'}
                    placeholder={field.placeholder || field.label}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-amber-500 transition-colors text-sm placeholder:text-slate-600"
                    value={value}
                    onChange={e => {
                        let val = e.target.value;
                        if (field.type === 'phone') val = formatPhoneNumberDisplay(val);
                        setValue(val);
                    }}
                />
            </div>
        );
    };

    if (isCheckoutOpen) {
        return (
            <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans">
                {/* Header Carrinho */}
                <div className="p-3 md:p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-50 shadow-md">
                    <button onClick={() => setIsCheckoutOpen(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"><ArrowLeft size={18}/></button>
                    <h2 className="text-base md:text-lg font-bold flex items-center gap-2">Seu Carrinho <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full">{cart.length}</span></h2>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto pb-4 custom-scrollbar">
                    <div className="max-w-md mx-auto space-y-5">
                        
                        {!shopStatus.isOpen && (
                            <div className="bg-red-900/20 border-l-4 border-red-500 rounded-r-xl p-3 flex flex-col gap-2 shadow-lg animate-in fade-in">
                                <div className="flex items-center gap-2">
                                    <div className="bg-red-500/20 p-1.5 rounded-full text-red-500 animate-pulse"><Clock size={16}/></div>
                                    <div>
                                        <h3 className="font-black text-red-100 text-xs uppercase tracking-wide">Loja Fechada</h3>
                                        <p className="text-[10px] text-red-200/70">
                                            Reabrimos: <span className="font-bold text-white">{shopStatus.nextOpen}</span>.
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
                                        placeholder="Observação (Ex: Sem cebola...)"
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
                                            className="w-full bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-900/30 transition-colors active:scale-95"
                                        >
                                            {isLocating ? <span className="animate-pulse">Localizando...</span> : <><Navigation size={14}/> Usar minha localização atual</>}
                                        </button>
                                        
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><MapPin size={16}/></div>
                                            <input 
                                                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-emerald-500 focus:bg-slate-900 transition-colors" 
                                                placeholder="Endereço (Rua, Número, Bairro)" 
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
            {/* Header Red Gradient - COMPACT FOR MOBILE */}
            <div className="bg-gradient-to-r from-[#ef4444] to-[#f97316] pt-3 pb-8 px-4 rounded-b-[1.5rem] md:rounded-b-[2rem] shadow-2xl relative overflow-hidden">
                <div className="max-w-5xl mx-auto relative z-10">
                    {/* Top Nav */}
                    <div className="flex justify-between items-center mb-4 md:mb-8">
                        <div className="flex items-center gap-2 md:gap-3 text-white font-bold">
                            {appConfig.appLogoUrl ? (
                                <img src={appConfig.appLogoUrl} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/20"/>
                            ) : (
                                <div className="bg-black/20 p-1.5 md:p-2 rounded-xl"><Utensils size={16} className="md:w-5 md:h-5"/></div>
                            )}
                            <span className="text-lg md:text-xl tracking-tight drop-shadow-md">{appConfig.appName}</span>
                        </div>
                        {allowSystemAccess && (
                            <div className="flex gap-2">
                                <button onClick={() => onSystemAccess('admin')} className="text-[10px] font-bold bg-black/20 hover:bg-black/40 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1 transition-colors backdrop-blur-md border border-white/10 uppercase">
                                    <Store size={10} className="md:w-3 md:h-3"/> Gerente
                                </button>
                                <button onClick={() => onSystemAccess('driver')} className="text-[10px] font-bold bg-black/20 hover:bg-black/40 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1 transition-colors backdrop-blur-md border border-white/10 uppercase">
                                    <Bike size={10} className="md:w-3 md:h-3"/> Motoboy
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Hero Text - Smaller on Mobile */}
                    <h1 className="text-xl md:text-4xl font-black text-white mb-4 md:mb-8 leading-tight drop-shadow-md">
                        Bateu a fome?<br/>
                        Peça agora mesmo! 🍔
                    </h1>

                    {/* ✨✨ BANNER DE PROMOÇÃO DINÂMICO ✨✨ */}
                    {appConfig.bannerUrl && (
                        <div className="relative group cursor-pointer" onClick={() => setShowGiveaway(true)}>
                            {/* Glow Effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>
                            
                            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-amber-500/30">
                                {appConfig.promoMode === 'banner' ? (
                                    // MODO BANNER FULL (SÓ IMAGEM)
                                    <img 
                                        src={appConfig.bannerUrl} 
                                        alt="Promoção" 
                                        className="w-full h-auto object-cover min-h-[120px]"
                                    />
                                ) : (
                                    // MODO CARD (LAYOUT COMPLETO COM TEXTO)
                                    <div className="bg-[#1a0505] p-1">
                                        <div className="bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/40 via-[#1a0505] to-[#0f0202] rounded-lg p-3 md:p-4 relative overflow-hidden flex flex-col justify-center min-h-[100px] md:min-h-[140px]">
                                            <div className="relative z-10 flex flex-row items-center justify-between gap-3">
                                                <div className="flex-1 space-y-0.5 md:space-y-1">
                                                    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-[#1a0505] px-1.5 py-0.5 rounded-full shadow-sm animate-pulse mb-0.5">
                                                        <Flame size={8} className="md:w-2.5 md:h-2.5" fill="currentColor"/>
                                                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Promoção</span>
                                                    </div>
                                                    <h2 className="text-base md:text-2xl font-black text-white leading-tight italic drop-shadow-xl uppercase">
                                                        {appConfig.promoTitle || 'COMBO CASAL CLÁSSICO'}
                                                    </h2>
                                                    <p className="text-slate-300 text-[9px] md:text-[10px] font-medium max-w-xs leading-relaxed opacity-90 hidden sm:block">
                                                        {appConfig.promoSubtitle || 'Concorra a 2 Hambúrgueres + Batata! Resultado ao vivo.'}
                                                    </p>
                                                    
                                                    {/* PROMO DETAILS (DATE/TIME/LOCATION) */}
                                                    {(appConfig.promoDate || appConfig.promoTime || appConfig.promoLocation) && (
                                                        <div className="flex flex-wrap gap-2 md:gap-3 mt-1.5 md:mt-2 text-[8px] md:text-[9px] font-bold text-amber-100/80">
                                                            {appConfig.promoDate && (
                                                                <span className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded border border-white/5"><Calendar size={8} className="md:w-2.5 md:h-2.5"/> {appConfig.promoDate}</span>
                                                            )}
                                                            {appConfig.promoTime && (
                                                                <span className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded border border-white/5"><Clock size={8} className="md:w-2.5 md:h-2.5"/> {appConfig.promoTime}</span>
                                                            )}
                                                            {appConfig.promoLocation && (
                                                                <span className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded border border-white/5"><MapPin size={8} className="md:w-2.5 md:h-2.5"/> {appConfig.promoLocation}</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="pt-1 md:pt-2">
                                                        <button className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black py-1.5 px-4 md:py-2 md:px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 group">
                                                            <span className="relative z-10 flex items-center gap-1 md:gap-2 text-[9px] md:text-[10px] uppercase tracking-widest">
                                                                PARTICIPAR <ChevronRight size={10} strokeWidth={3}/>
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 relative w-16 h-16 md:w-24 md:h-24 flex items-center justify-center">
                                                    <img src={appConfig.bannerUrl} alt="Promo" className="w-full h-full object-cover rounded-xl shadow-lg border border-amber-500/30"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Menu Section */}
            <div className="max-w-5xl mx-auto px-3 md:px-4 -mt-4 md:-mt-6 relative z-20">
                {/* Search Compact */}
                <div className="relative mb-3 md:mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                    <input 
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-full py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:border-slate-600 outline-none shadow-xl transition-all text-xs md:text-sm font-medium"
                        placeholder="Buscar lanche..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Categories Compact */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-2 md:mb-4">
                    {['Todos', ...new Set(products.map(p => p.category))].map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-1.5 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap transition-all shadow-md ${selectedCategory === cat ? 'bg-white text-slate-900 scale-105' : 'bg-[#0f172a] text-slate-400 border border-slate-800 hover:border-slate-600'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Shop Closed Banner */}
                {!shopStatus.isOpen && (
                    <div className="bg-red-900/20 border-l-4 border-red-500 rounded-r-xl p-3 mb-4 flex items-start gap-3 shadow-lg">
                        <div className="bg-red-500/20 p-1.5 rounded-full text-red-500 animate-pulse"><Clock size={16}/></div>
                        <div>
                            <h3 className="font-black text-red-100 text-xs uppercase tracking-wide">Loja Fechada</h3>
                            <p className="text-[10px] text-red-300 mt-1 font-bold flex items-center gap-1">
                                Reabrimos: {shopStatus.nextOpen}
                            </p>
                        </div>
                    </div>
                )}

                {/* Products Grouped - GRID COM FOTO GRANDE (APPETIZING) */}
                <div className="space-y-6 md:space-y-8 pb-10">
                    {groupedProducts.map(([category, items]) => (
                        <div key={category} className="animate-in slide-in-from-bottom-4 duration-700">
                            <h3 className="text-white font-black text-sm md:text-lg mb-3 flex items-center gap-2 uppercase tracking-wider pl-1 border-l-4 border-orange-500">
                                {category}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                {items.map(product => (
                                    <div 
                                        key={product.id} 
                                        onClick={() => addToCart(product)}
                                        className="bg-[#0f172a] border border-slate-800 rounded-xl flex flex-col hover:border-slate-600 transition-all shadow-md group relative overflow-hidden cursor-pointer h-full"
                                    >
                                        {/* FOTO GRANDE - CAPA */}
                                        <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-900">
                                            {product.imageUrl ? (
                                                <img 
                                                    src={product.imageUrl} 
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                    <Utensils size={32} />
                                                </div>
                                            )}
                                            {/* Preço Sobreposto (Tag) */}
                                            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-emerald-400 px-2 py-1 rounded-lg text-xs md:text-sm font-black border border-emerald-500/30 shadow-lg">
                                                {formatCurrency(product.price)}
                                            </div>
                                        </div>

                                        <div className="p-3 flex flex-col flex-1">
                                            <h4 className="font-bold text-white text-xs md:text-base mb-1 group-hover:text-amber-500 transition-colors line-clamp-2 leading-tight">{product.name}</h4>
                                            {product.description && (
                                                <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed line-clamp-2 mb-2">{product.description}</p>
                                            )}
                                            
                                            <div className="mt-auto pt-2 flex justify-end">
                                                <button 
                                                    className="bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md border border-slate-700 group-hover:bg-amber-600 group-hover:border-amber-500"
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
                            <Utensils size={32} className="mx-auto mb-2 opacity-20"/>
                            <p className="text-xs">Nenhum item encontrado.</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />

            {/* Floating Cart Bar (Red Style) */}
            {cart.length > 0 && !isCheckoutOpen && (
                <div className="fixed bottom-4 left-3 right-3 z-50 max-w-5xl mx-auto animate-in slide-in-from-bottom-10">
                    <button 
                        onClick={() => setIsCheckoutOpen(true)}
                        className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-3 rounded-xl shadow-[0_10px_30px_rgba(239,68,68,0.4)] flex items-center justify-between transition-transform active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-black/20 w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shadow-inner">
                                {cart.reduce((a,b) => a + b.quantity, 0)}
                            </div>
                            <span className="font-black text-xs uppercase tracking-wider">VER CARRINHO</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-black text-sm">{formatCurrency(cartTotal)}</span>
                            <ChevronRight size={16} strokeWidth={3}/>
                        </div>
                    </button>
                </div>
            )}

            {/* Giveaway Modal (Form) - DINÂMICO */}
            {showGiveaway && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-amber-500/50 p-6 md:p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setShowGiveaway(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2"><X size={20}/></button>
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
                                <Gift size={32} className="text-amber-400"/>
                            </div>
                            <h3 className="text-xl font-black text-white uppercase italic">
                                {appConfig.giveawaySettings?.title || 'Sorteio Especial'}
                            </h3>
                            <p className="text-slate-400 text-xs mt-1">Preencha para participar!</p>
                        </div>

                        <div className="bg-amber-900/20 p-3 rounded-lg mb-4 border border-amber-500/20 text-center">
                           <p className="text-amber-400 text-[10px] font-bold uppercase mb-1 flex items-center justify-center gap-1"><AlertTriangle size={10}/> Regras Obrigatórias</p>
                           <div className="text-slate-300 text-[10px] whitespace-pre-line leading-relaxed">
                               {appConfig.giveawaySettings?.rules || '1. Seguir o Instagram\n2. Marcar um amigo'}
                           </div>
                        </div>
                        
                        <form onSubmit={handleGiveawaySubmit} className="space-y-3">
                             {/* RENDERIZAÇÃO DINÂMICA DOS CAMPOS */}
                             {(appConfig.giveawaySettings?.fields || [])
                                .filter(field => field.enabled)
                                .map(field => renderGiveawayField(field))
                             }

                             <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-3 rounded-xl shadow-lg mt-2 uppercase tracking-wide text-xs">Quero Participar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Giveaway Success Modal */}
            {showGiveawaySuccess && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in duration-300">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] p-8 relative overflow-hidden text-center">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-500/10">
                            <Ticket size={40} className="text-emerald-400 animate-bounce"/>
                        </div>

                        <h2 className="text-2xl font-black text-white italic uppercase tracking-wide mb-2">
                            Inscrição Realizada!
                        </h2>
                        
                        <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                            Boa sorte! Para confirmar sua participação, envie a confirmação para nosso WhatsApp.
                        </p>

                        <div className="space-y-3">
                            <button 
                                onClick={handleSendGiveawayToWhatsApp}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                            >
                                <MessageCircle size={18}/> Confirmar no WhatsApp
                            </button>
                            
                            <button 
                                onClick={() => { setShowGiveawaySuccess(false); setShowGiveaway(true); }}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold py-3 rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
                            >
                                <Edit size={14}/> Corrigir Dados
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS / SEND MODAL (ORDER) */}
            {showSuccessModal && lastOrderData && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in duration-300">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] p-8 relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 animate-pulse"></div>
                        
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-500/10">
                            <CheckCircle2 size={40} className="text-emerald-400 animate-bounce"/>
                        </div>

                        <h2 className="text-2xl font-black text-white italic uppercase tracking-wide mb-2">
                            Pedido Recebido!
                        </h2>
                        
                        <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                            Quase lá! Para confirmar e começarmos a preparar, clique no botão abaixo para enviar o pedido no nosso WhatsApp.
                        </p>

                        <div className="bg-slate-950 rounded-xl p-3 mb-6 border border-slate-800 text-left">
                            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Resumo</p>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-white font-bold text-sm">{lastOrderData.customer}</span>
                                <span className="text-emerald-400 font-bold text-sm">{formatCurrency(lastOrderData.value)}</span>
                            </div>
                            {!shopStatus.isOpen && (
                                <p className="text-[10px] text-amber-500 mt-1 font-bold flex items-center gap-1">
                                    <Clock size={10}/> Pedido Agendado
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={handleSendToWhatsApp}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                            >
                                <MessageCircle size={18}/> Enviar no WhatsApp
                            </button>
                            
                            <button 
                                onClick={handleBackToMenu}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold py-3 rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
                            >
                                <Home size={14}/> Voltar ao Cardápio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}