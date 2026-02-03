
import React, { useState, useMemo, useEffect } from 'react';
import { Product, AppConfig } from '../types';
import { formatCurrency, capitalize, normalizePhone, toSentenceCase, copyToClipboard, formatTime, formatDate, generatePixPayload, EMOJI, checkShopStatus } from '../utils';
import { ShoppingBag, Minus, Plus, X, Search, Utensils, ChevronRight, MapPin, Phone, CreditCard, Banknote, Bike, Store, ArrowLeft, CheckCircle2, MessageCircle, Copy, Check, TrendingUp, Lock, Star, Flame, Loader2, Navigation, AlertCircle, Receipt, Clock, QrCode, Gift, LogOut, ShieldCheck, CalendarClock, Ban, Moon, CalendarDays, DoorClosed, Ticket, Instagram } from 'lucide-react';
import { BrandLogo, Footer, PixIcon } from './Shared';
import { GenericConfirmModal, GenericAlertModal } from './Modals';

interface ClientInterfaceProps {
    products: Product[];
    appConfig: AppConfig;
    onCreateOrder: (data: any) => Promise<any>;
    onEnterGiveaway?: (data: any) => Promise<void>;
    onBack?: () => void;
    allowSystemAccess?: boolean;
    onSystemAccess?: (type: 'admin' | 'driver') => void;
}

export default function ClientInterface({ products, appConfig, onCreateOrder, onEnterGiveaway, onBack, allowSystemAccess, onSystemAccess }: ClientInterfaceProps) {
    const [view, setView] = useState<'menu' | 'cart' | 'success'>('menu');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showClosedWarning, setShowClosedWarning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: () => void, title: string, message: string, type?: 'info' | 'danger'} | null>(null);
    const [alertModal, setAlertModal] = useState<{isOpen: boolean, title: string, message: string, type?: 'info' | 'error'} | null>(null);
    const [showGiveawayModal, setShowGiveawayModal] = useState(false);

    const [cart, setCart] = useState<{product: Product, quantity: number, obs: string}[]>(() => {
        try {
            const savedCart = localStorage.getItem('jhans_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch { return []; }
    });

    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [search, setSearch] = useState('');
    const [orderId, setOrderId] = useState('');
    
    const [lastOrderData, setLastOrderData] = useState<any>(() => {
        try {
            const savedOrder = localStorage.getItem('jhans_last_order');
            if (savedOrder) return JSON.parse(savedOrder);
            return null;
        } catch { return null; }
    });

    const [loadingLocation, setLoadingLocation] = useState(false);
    
    useEffect(() => {
        if (lastOrderData && cart.length === 0) setView('success');
    }, []);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [view]);

    const [checkout, setCheckout] = useState({
        name: '', phone: '', address: '', neighborhood: '', mapsLink: '', 
        paymentMethod: 'PIX', serviceType: 'delivery', trocoPara: '', obs: ''
    });

    const shopStatus = useMemo(() => checkShopStatus(appConfig.schedule), [appConfig.schedule]);

    useEffect(() => {
        if (!shopStatus.isOpen && !allowSystemAccess && view === 'menu') {
            setShowClosedWarning(true);
        }
    }, [shopStatus.isOpen, allowSystemAccess, view]); 

    const handleDismissClosedWarning = () => setShowClosedWarning(false);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('jhans_client_info');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                setCheckout(prev => ({
                    ...prev,
                    name: parsed.name || '',
                    phone: parsed.phone || '',
                    address: parsed.address || '',
                    neighborhood: parsed.neighborhood || '',
                    mapsLink: parsed.mapsLink || ''
                }));
            }
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { localStorage.setItem('jhans_cart', JSON.stringify(cart)); }, [cart]);
    useEffect(() => { if (lastOrderData) localStorage.setItem('jhans_last_order', JSON.stringify(lastOrderData)); }, [lastOrderData]);

    const PRIORITY_ORDER = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];

    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category)));
        return ['Todos', ...cats.sort((a, b) => {
            const idxA = PRIORITY_ORDER.indexOf(a);
            const idxB = PRIORITY_ORDER.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        })];
    }, [products]);

    const groupedProducts = useMemo(() => {
        let filtered = products;
        if (search) {
            filtered = products.filter(p => 
                p.name.toLowerCase().includes(search.toLowerCase()) || 
                p.description?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (selectedCategory !== 'Todos') {
            return [{ category: selectedCategory, items: filtered.filter(p => p.category === selectedCategory) }];
        }
        const groups: {[key: string]: Product[]} = {};
        filtered.forEach(p => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const idxA = PRIORITY_ORDER.indexOf(a);
            const idxB = PRIORITY_ORDER.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });
        return sortedKeys.map(cat => ({ category: cat, items: groups[cat] }));
    }, [products, search, selectedCategory]);

    const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0), [cart]);

    const deliveryFee = useMemo(() => {
        if (checkout.serviceType === 'pickup') return 0;
        if (!appConfig.enableDeliveryFees) return 0;
        if (appConfig.deliveryZones && appConfig.deliveryZones.length > 0) {
            const zone = appConfig.deliveryZones.find(z => z.name.toUpperCase() === checkout.neighborhood.toUpperCase());
            if (zone) return zone.fee;
        }
        return 0;
    }, [checkout.serviceType, checkout.neighborhood, appConfig]);

    const finalTotal = cartTotal + deliveryFee;

    const pixPayload = useMemo(() => {
        const txId = (lastOrderData && lastOrderData.id) ? lastOrderData.id : (orderId || '***'); 
        if (checkout.paymentMethod === 'PIX' && appConfig.pixKey && appConfig.pixName && appConfig.pixCity) {
            return generatePixPayload(appConfig.pixKey, appConfig.pixName, appConfig.pixCity, finalTotal, txId);
        }
        return null;
    }, [checkout.paymentMethod, appConfig, finalTotal, orderId, lastOrderData]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if(existing) return prev.map(i => i.product.id === product.id ? {...i, quantity: i.quantity + 1} : i);
            return [...prev, { product, quantity: 1, obs: '' }];
        });
        // Feedback visual (opcional)
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[index];
            const newQty = item.quantity + delta;
            if (newQty <= 0) newCart.splice(index, 1);
            else item.quantity = newQty;
            return newCart;
        });
    };

    const updateObs = (index: number, text: string) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[index].obs = text;
            return newCart;
        });
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setAlertModal({ isOpen: true, title: "Erro GPS", message: "Seu navegador não suporta geolocalização.", type: "error" });
            return;
        }
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                setCheckout(prev => ({ ...prev, mapsLink: mapsLink }));
                setLoadingLocation(false);
                const addressInput = document.getElementById('address-input');
                if(addressInput) addressInput.focus();
            },
            (error) => {
                console.error(error);
                setAlertModal({ isOpen: true, title: "Erro GPS", message: "Não foi possível obter o GPS. Por favor, digite o endereço manualmente.", type: "error" });
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const submitOrder = async (isPreOrder: boolean) => {
        setIsSubmitting(true);
        let itemsHeader = "";
        if (isPreOrder) itemsHeader = `📢 [PRÉ-VENDA / AGENDADO]\n🕒 Entrega na abertura: ${shopStatus.nextOpen || 'Assim que abrir'}\n-----------------------\n`;

        const itemsText = itemsHeader + cart.map(i => `${i.quantity}x ${i.product.name}${i.obs ? `\n(Obs: ${i.obs})` : ''}`).join('\n---\n');
        const finalObs = isPreOrder ? `⚠️ PEDIDO AGENDADO (Loja Fechada). ${checkout.obs || ''}` : checkout.obs;

        try {
            localStorage.setItem('jhans_client_info', JSON.stringify({
                name: checkout.name, phone: checkout.phone, address: checkout.address, neighborhood: checkout.neighborhood, mapsLink: checkout.mapsLink
            }));
        } catch (err) { console.error(err); }

        const generatedId = `PED-${Date.now().toString().slice(-6)}`;
        const orderData = {
            id: generatedId, 
            customer: capitalize(checkout.name),
            phone: checkout.phone,
            address: checkout.serviceType === 'delivery' ? toSentenceCase(checkout.address) : 'RETIRADA NO BALCÃO',
            neighborhood: checkout.neighborhood,
            mapsLink: checkout.mapsLink, 
            items: itemsText,
            amount: formatCurrency(finalTotal),
            value: finalTotal,
            paymentMethod: checkout.paymentMethod === 'Dinheiro' && checkout.trocoPara ? `Dinheiro (Troco p/ ${checkout.trocoPara})` : checkout.paymentMethod,
            serviceType: checkout.serviceType,
            deliveryFee: deliveryFee, 
            discount: 0,
            obs: finalObs,
            origin: 'menu',
            createdAt: { seconds: Date.now() / 1000 }
        };

        try {
            await onCreateOrder(orderData);
            setOrderId(generatedId); 
            setLastOrderData({ ...orderData, id: generatedId });
            setView('success');
            setCart([]); 
            localStorage.removeItem('jhans_cart'); 
            setCheckout(prev => ({ ...prev, trocoPara: '', obs: '' })); 
        } catch (error) {
            console.error(error);
            setAlertModal({ isOpen: true, title: "Erro no Envio", message: "Não foi possível enviar o pedido. Tente novamente.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0 || isSubmitting) return;

        if (checkout.serviceType === 'delivery') {
            if (!checkout.address) return setAlertModal({ isOpen: true, title: "Endereço Faltando", message: "Digite o endereço de entrega.", type: "error" });
            if (appConfig.enableDeliveryFees && appConfig.deliveryZones?.length > 0 && !checkout.neighborhood) return setAlertModal({ isOpen: true, title: "Bairro Faltando", message: "Selecione o bairro.", type: "error" });
        }

        const isPreOrder = !shopStatus.isOpen;
        if (isPreOrder) {
            setConfirmModal({
                isOpen: true,
                title: "Loja Fechada",
                message: `Não estamos atendendo agora. Seu pedido será agendado como PRÉ-VENDA para quando abrirmos (${shopStatus.nextOpen || 'Em breve'}). Deseja continuar?`,
                action: () => submitOrder(true),
                type: 'info'
            });
        } else {
            submitOrder(false);
        }
    };

    const handleNewOrder = () => {
        setLastOrderData(null);
        localStorage.removeItem('jhans_last_order');
        setView('menu');
    }

    const sendToWhatsApp = () => {
        if (!appConfig.storePhone) return;
        const data = lastOrderData || { customer: checkout.name, id: orderId, value: finalTotal, paymentMethod: checkout.paymentMethod };
        let text = `*Olá! Acabei de fazer um pedido pelo Site.*\n\n*Pedido:* #${data.id}\n*Cliente:* ${data.customer}\n*Itens:* ${data.items.replace(/\n---\n/g, ', ')}\n`;
        if (checkout.serviceType === 'delivery') text += data.deliveryFee > 0 ? `*Entrega:* ${formatCurrency(data.deliveryFee)}\n` : `*Entrega:* GRÁTIS ${EMOJI.GIFT}\n`;
        else text += `*Retirada no Balcão*\n`;
        text += `*Total:* ${formatCurrency(data.value)}\n*Pagamento:* ${data.paymentMethod}\n\n`;
        if (data.obs) text += `*Observação:* ${data.obs}\n\n`;
        if (data.paymentMethod?.includes('PIX') && appConfig.pixKey) text += `--------------------------------\n*PAGAMENTO PIX:*\n\`\`\`${generatePixPayload(appConfig.pixKey, appConfig.pixName, appConfig.pixCity, data.value, data.id)}\`\`\`\n--------------------------------\n\n`;
        text += `Podem confirmar?`;
        window.open(`https://wa.me/55${normalizePhone(appConfig.storePhone)}?text=${encodeURIComponent(text)}`, 'whatsapp-session');
    };

    if (view === 'success' && lastOrderData) {
        const successPixPayload = (lastOrderData.paymentMethod.includes('PIX') && appConfig.pixKey) ? generatePixPayload(appConfig.pixKey, appConfig.pixName, appConfig.pixCity, lastOrderData.value, lastOrderData.id) : null;
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in">
                <div className="mb-6 flex flex-col items-center">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-900/40 animate-bounce"><CheckCircle2 size={40} className="text-white"/></div>
                    <h2 className="text-2xl font-black text-white">{lastOrderData.items.includes('[PRÉ-VENDA') ? 'Pré-Venda Confirmada!' : 'Pedido Enviado!'}</h2>
                    <p className="text-slate-400 text-sm">{lastOrderData.items.includes('[PRÉ-VENDA') ? 'Sua reserva está garantida.' : 'Recebemos seu pedido e ele será preparado.'}</p>
                </div>
                {successPixPayload && (
                    <div className="w-full max-w-sm bg-emerald-900/20 border border-emerald-500/50 p-4 rounded-xl mb-6">
                        <div className="flex flex-col items-center">
                            <p className="text-xs text-emerald-400 font-bold mb-3 uppercase flex items-center gap-2"><QrCode size={14}/> Pagamento Pendente</p>
                            <div className="flex gap-2 w-full"><input readOnly value={successPixPayload} className="flex-1 bg-slate-950 border border-emerald-500/30 rounded-lg p-3 text-[10px] font-mono text-white truncate"/><button type="button" onClick={() => copyToClipboard(successPixPayload)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-lg font-bold flex items-center justify-center gap-2 text-xs"><Copy size={16}/> Copiar</button></div>
                        </div>
                    </div>
                )}
                <div className="w-full max-w-sm bg-white text-slate-900 rounded-xl p-0 overflow-hidden shadow-2xl mb-6 relative">
                    <div className="bg-red-600 p-4 text-white text-center relative"><h3 className="font-bold text-lg uppercase tracking-wider">{appConfig.appName}</h3><p className="text-[10px] opacity-80">COMPROVANTE</p></div>
                    <div className="p-6 pt-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-300 pb-2"><span className="text-xs font-bold text-slate-500">DATA</span><span className="text-xs font-bold">{formatDate(lastOrderData.createdAt)} • {formatTime(lastOrderData.createdAt)}</span></div>
                        <div className="text-left space-y-1"><p className="text-xs text-slate-500 font-bold">CLIENTE</p><p className="font-bold text-lg leading-none">{lastOrderData.customer}</p><p className="text-xs text-slate-500">{lastOrderData.phone}</p></div>
                        <div className="bg-slate-100 p-3 rounded-lg text-left"><p className="text-[10px] text-slate-500 font-bold mb-1">ITENS</p><pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap font-bold">{lastOrderData.items}</pre></div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-900"><span className="font-bold text-lg">TOTAL</span><span className="font-black text-xl text-emerald-600">{formatCurrency(lastOrderData.value)}</span></div>
                    </div>
                </div>
                {appConfig.storePhone && <button onClick={sendToWhatsApp} className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mb-3 active:scale-95 transition-transform"><MessageCircle size={20}/> Enviar Comprovante</button>}
                <button onClick={handleNewOrder} className="text-slate-500 font-bold text-sm hover:text-white transition-colors py-2">Fazer Novo Pedido</button>
            </div>
        )
    }

    if (view === 'cart') {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col animate-in slide-in-from-right">
                <div className="bg-slate-900 sticky top-0 z-20 shadow-xl border-b border-slate-800">
                    <div className="max-w-2xl mx-auto w-full p-4 flex items-center gap-4"><button onClick={() => setView('menu')} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><ArrowLeft size={20}/></button><h2 className="font-bold text-lg">Seu Carrinho</h2></div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
                    <div className="max-w-2xl mx-auto w-full p-4">
                        {!shopStatus.isOpen && <div className="bg-indigo-900/30 border border-indigo-500/50 rounded-2xl p-5 mb-4"><div className="flex items-start gap-4"><Moon className="text-white bg-indigo-500 p-2 rounded-full" size={40}/><div className="flex-1"><h4 className="font-black text-white text-lg uppercase tracking-tight">Estamos Fechados</h4><p className="text-sm text-indigo-200 leading-tight mt-1">Seu pedido será agendado como <strong className="text-amber-400">PRÉ-VENDA</strong>.</p><p className="text-xs text-white/50 mt-2 font-mono border-t border-indigo-500/30 pt-1">Entrega prevista: {shopStatus.nextOpen}</p></div></div></div>}
                        {cart.length === 0 ? <div className="h-[50vh] flex flex-col items-center justify-center text-slate-500 space-y-4"><ShoppingBag size={48} className="opacity-20"/><p>Carrinho vazio.</p><button onClick={() => setView('menu')} className="text-amber-500 font-bold text-sm">Ver Cardápio</button></div> : (
                            <div className="space-y-4">
                                <div className="space-y-3">{cart.map((item, idx) => (<div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col gap-3 shadow-md"><div className="flex justify-between items-start"><div className="flex items-start gap-3"><div className="bg-slate-800 p-2 rounded-lg text-amber-500"><Utensils size={16}/></div><div><p className="font-bold text-sm">{item.product.name}</p><p className="text-amber-500 font-bold text-sm">{formatCurrency(item.product.price)}</p></div></div><div className="flex items-center bg-slate-950 rounded-lg border border-slate-800"><button onClick={() => updateQuantity(idx, -1)} className="p-2 text-slate-400 hover:text-white"><Minus size={14}/></button><span className="w-6 text-center font-bold text-sm">{item.quantity}</span><button onClick={() => updateQuantity(idx, 1)} className="p-2 text-slate-400 hover:text-white"><Plus size={14}/></button></div></div><input placeholder="Observação..." className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-500" value={item.obs} onChange={e => updateObs(idx, e.target.value)}/></div>))}</div>
                                <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4 pt-4 border-t border-slate-800">
                                    <h3 className="font-bold text-slate-400 text-sm uppercase">Entrega</h3>
                                    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-2"><button type="button" onClick={() => setCheckout({...checkout, serviceType: 'delivery'})} className={`flex-1 py-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${checkout.serviceType === 'delivery' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}><Bike size={16}/> Entrega</button><button type="button" onClick={() => setCheckout({...checkout, serviceType: 'pickup'})} className={`flex-1 py-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${checkout.serviceType === 'pickup' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}><Store size={16}/> Retirada</button></div>
                                    <div className="space-y-3">
                                        <input required placeholder="Seu Nome" className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-sm" value={checkout.name} onChange={e => setCheckout({...checkout, name: e.target.value})} />
                                        <input required type="tel" placeholder="Seu WhatsApp" className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-sm" value={checkout.phone} onChange={e => setCheckout({...checkout, phone: e.target.value})} />
                                        {checkout.serviceType === 'delivery' && (<div className="space-y-3">{appConfig.enableDeliveryFees && appConfig.deliveryZones && (<div className="relative"><select required className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-sm text-white appearance-none" value={checkout.neighborhood} onChange={e => setCheckout({...checkout, neighborhood: e.target.value})}><option value="" disabled>Selecione seu Bairro...</option>{appConfig.deliveryZones.map((zone) => (<option key={zone.name} value={zone.name}>{zone.name} (+ {formatCurrency(zone.fee)})</option>))}</select><ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" size={16}/></div>)}<button type="button" onClick={handleGetLocation} disabled={loadingLocation} className={`w-full p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold border ${checkout.mapsLink ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50' : 'bg-blue-900/30 text-blue-300 border-blue-500/30'}`}>{loadingLocation ? "Obtendo GPS..." : checkout.mapsLink ? "GPS Capturado!" : "Usar GPS (Localização)"}</button><input required placeholder="Endereço Completo" className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-sm" value={checkout.address} onChange={e => setCheckout({...checkout, address: e.target.value})} /></div>)}
                                    </div>
                                    <h3 className="font-bold text-slate-400 text-sm uppercase pt-2">Pagamento</h3>
                                    <div className="grid grid-cols-3 gap-2">{['PIX', 'Dinheiro', 'Cartão'].map(method => (<button key={method} type="button" onClick={() => setCheckout({...checkout, paymentMethod: method})} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 ${checkout.paymentMethod === method ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}><span className="text-[10px] font-bold uppercase">{method}</span></button>))}</div>
                                    {checkout.paymentMethod === 'PIX' && pixPayload && (<div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex flex-col items-center"><p className="text-xs text-emerald-400 font-bold mb-2">Pagar com PIX</p><div className="flex gap-2 w-full"><input readOnly value={pixPayload} className="flex-1 bg-slate-950 border border-emerald-500/30 rounded-lg p-2 text-[10px] font-mono text-white truncate"/><button type="button" onClick={() => copyToClipboard(pixPayload)} className="bg-emerald-600 text-white px-3 rounded-lg font-bold"><Copy size={14}/></button></div></div>)}
                                    {checkout.paymentMethod === 'Dinheiro' && <input placeholder="Troco para?" className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-sm" value={checkout.trocoPara} onChange={e => setCheckout({...checkout, trocoPara: e.target.value})} />}
                                </form>
                            </div>
                        )}
                    </div>
                </div>
                {cart.length > 0 && <div className="bg-slate-900 border-t border-slate-800 pb-safe w-full"><div className="max-w-2xl mx-auto w-full p-4"><div className="space-y-2 mb-4 text-sm"><div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatCurrency(cartTotal)}</span></div><div className="flex justify-between text-emerald-400"><span>Entrega</span><span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : 'GRÁTIS'}</span></div><div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-slate-800"><span>Total</span><span>{formatCurrency(finalTotal)}</span></div></div><div className="mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-[10px] text-slate-400 flex items-start gap-2"><ShieldCheck size={14} className="shrink-0 text-emerald-500 mt-0.5" /><p>Ao enviar o pedido, você concorda com o uso dos dados para entrega (LGPD).</p></div><button form="checkout-form" type="submit" disabled={isSubmitting} className={`w-full text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg active:scale-95 transition-transform ${isSubmitting ? 'bg-slate-600 cursor-wait' : shopStatus.isOpen ? 'bg-gradient-to-r from-red-600 to-amber-600' : 'bg-indigo-600'}`}>{isSubmitting ? "Enviando..." : shopStatus.isOpen ? "Enviar Pedido" : "Agendar Pré-Venda"}</button></div></div>}
                {confirmModal && <GenericConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(null)} onConfirm={confirmModal.action} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText="Sim, Confirmar"/>}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col relative">
            <button onClick={() => setShowGiveawayModal(true)} className="fixed bottom-24 right-4 z-50 bg-gradient-to-br from-red-600 to-red-800 text-white p-4 rounded-full shadow-2xl shadow-red-900/50 hover:scale-110 transition-transform animate-bounce group border-2 border-amber-500" title="Participar do Sorteio"><Gift size={28} className="drop-shadow-md text-amber-200"/><span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-red-900 text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-red-200">Sorteio Combo!</span></button>

            <div className="bg-gradient-to-br from-red-700 via-red-600 to-amber-600 pb-6 pt-8 px-6 shadow-lg relative z-10">
                <div className="max-w-5xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-6"><BrandLogo size="small" config={appConfig} />{allowSystemAccess && onSystemAccess && (<div className="flex items-center gap-2"><button onClick={() => onSystemAccess('admin')} className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-amber-100 hover:text-white transition-colors border border-white/10 backdrop-blur-sm"><Lock size={14}/><span className="text-[10px] font-bold uppercase hidden md:inline">Gerente</span></button><button onClick={() => onSystemAccess('driver')} className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-amber-100 hover:text-white transition-colors border border-white/10 backdrop-blur-sm"><Bike size={14}/><span className="text-[10px] font-bold uppercase hidden md:inline">Motoboy</span></button></div>)}{!allowSystemAccess && (<button onClick={() => setShowScheduleModal(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase border shadow-sm backdrop-blur-sm ${shopStatus.isOpen ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-700 text-slate-300 border-slate-500'}`}><div className={`w-2 h-2 rounded-full ${shopStatus.isOpen ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></div>{shopStatus.isOpen ? (shopStatus.message !== 'Horário não configurado' ? shopStatus.message : 'Aberto') : 'Fechado'}</button>)}</div>
                    <h1 className="text-2xl font-black text-white mb-4 leading-tight drop-shadow-sm">Bateu a fome? <br/><span className="text-amber-200">Peça agora mesmo!</span> 🍔</h1>
                    <div onClick={() => setShowGiveawayModal(true)} className="relative w-full rounded-3xl overflow-hidden mb-2 cursor-pointer group shadow-[0_0_40px_rgba(185,28,28,0.4)] border-2 border-amber-500/50 hover:border-amber-400 transition-all transform hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-900 to-red-800"></div><div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1 text-center md:text-left z-10">
                                <div className="inline-flex items-center gap-2 bg-amber-500 text-red-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 shadow-lg animate-pulse"><Flame size={12} fill="currentColor" /> Sorteio Oficial</div>
                                <h2 className="text-3xl md:text-4xl font-black text-white leading-none mb-1 drop-shadow-lg uppercase italic">Combo Casal <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600 block md:inline">Classic</span></h2>
                                <p className="text-red-200 font-bold text-sm md:text-base mb-6 flex items-center justify-center md:justify-start gap-2"><Ticket size={16} /> Concorra a 2 Burgers + Batata + Refri!</p>
                                <div className="flex flex-col md:flex-row gap-3 items-center">
                                    <button className="bg-gradient-to-b from-green-500 to-green-700 text-white px-8 py-3 rounded-xl font-black uppercase tracking-wide shadow-xl border-b-4 border-green-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2">Quero Participar <ChevronRight size={20} /></button>
                                    <div className="text-xs text-amber-400 font-mono bg-black/40 px-3 py-1 rounded border border-amber-500/30 flex items-center gap-2"><Instagram size={14}/> Sorteio: Quarta-feira 04/02/26 às 19h @jhansburgers</div>
                                </div>
                            </div>
                            <div className="relative shrink-0 w-32 h-32 md:w-48 md:h-48 flex items-center justify-center"><div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-full blur-xl"></div><Gift size={120} className="text-amber-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] rotate-12 group-hover:rotate-6 transition-transform duration-500" /><div className="absolute -bottom-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-lg rotate-[-6deg]">Grátis!</div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-xl py-3 px-4">
                 <div className="max-w-5xl mx-auto w-full">
                    <div className="relative mb-3"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors focus:bg-slate-900 shadow-inner" placeholder="Buscar lanche, bebida..." value={search} onChange={e => setSearch(e.target.value)}/></div>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar -mx-2 px-2">{categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shadow-sm ${selectedCategory === cat ? 'bg-white text-red-700 shadow-lg border-white' : 'bg-black/20 text-amber-100 border-white/10 hover:bg-black/30'}`}>{cat}</button>))}</div>
                 </div>
            </div>

            <div className="flex-1 p-4 pb-24 overflow-y-auto w-full">
                <div className="max-w-5xl mx-auto w-full">
                    {groupedProducts.map((group) => (
                        <div key={group.category} className="mb-8 animate-in slide-in-from-bottom-4 duration-500">
                            {selectedCategory === 'Todos' && <h3 className="text-xl font-black text-white mb-4 border-l-4 border-amber-500 pl-3 flex items-center gap-2 uppercase tracking-wide">{group.category}</h3>}
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">{group.items.map(product => (<div key={product.id} onClick={() => addToCart(product)} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between gap-2 cursor-pointer hover:border-amber-500/50 transition-all active:scale-95 group hover:bg-slate-800/80 shadow-md relative overflow-hidden h-full"><div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div><div className="flex-1 z-10 flex flex-col"><h3 className="font-bold text-white text-sm leading-tight mb-1 group-hover:text-amber-400 transition-colors line-clamp-2">{product.name}</h3><p className="text-[10px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">{product.description}</p></div><div className="flex justify-between items-end z-10 mt-auto"><p className="font-black text-amber-500 text-sm">{formatCurrency(product.price)}</p><div className="bg-slate-800 p-1.5 rounded-lg text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm"><Plus size={16}/></div></div></div>))}</div>
                        </div>
                    ))}
                    {groupedProducts.length === 0 && <div className="text-center py-20 text-slate-500 animate-in fade-in"><Utensils size={48} className="mx-auto mb-3 opacity-20"/><p>Nenhum item encontrado.</p></div>}
                </div>
            </div>

            {cart.length > 0 && <div className="fixed bottom-4 left-0 w-full px-4 z-40 pointer-events-none"><div className="max-w-5xl mx-auto w-full pointer-events-auto"><button onClick={() => setView('cart')} className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white p-4 rounded-2xl shadow-xl shadow-red-900/40 flex items-center justify-between border border-red-500/30 animate-in slide-in-from-bottom-4 active:scale-95 transition-transform"><div className="flex items-center gap-3"><div className="bg-black/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">{cart.reduce((a,b) => a + b.quantity, 0)}</div><span className="font-bold text-sm uppercase tracking-wide">Ver Carrinho</span></div><div className="flex items-center gap-2"><span className="font-black text-lg">{formatCurrency(cartTotal)}</span><ChevronRight size={20}/></div></button></div></div>}
            <div className="pb-safe bg-slate-950"><Footer /></div>
            
            {showScheduleModal && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"><div className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-slate-800 relative shadow-2xl"><button onClick={() => setShowScheduleModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button><div className="text-center mb-6"><h3 className="font-bold text-xl text-white flex items-center justify-center gap-2"><Clock size={20} className="text-amber-500"/> Horários</h3><p className={`text-sm font-bold mt-1 ${shopStatus.isOpen ? 'text-emerald-400' : 'text-red-400'}`}>{shopStatus.message}</p></div><div className="space-y-2 mb-4">{['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day, idx) => (<div key={idx} className={`flex justify-between items-center text-sm p-2 rounded ${new Date().getDay() === idx ? 'bg-slate-800 font-bold text-white' : 'text-slate-400'}`}><span>{day}</span><span>{appConfig.schedule?.[idx]?.enabled ? `${appConfig.schedule?.[idx].open} - ${appConfig.schedule?.[idx].close}` : 'Fechado'}</span></div>))}</div><button onClick={() => setShowScheduleModal(false)} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700">Fechar</button></div></div>}
            
            {showClosedWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="relative bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center text-center p-8 animate-in zoom-in-95 duration-300">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div>
                        <div className="absolute -top-10 right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Icon */}
                        <div className="relative mb-6">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-700 relative z-10">
                                <Moon size={40} className="text-indigo-400 fill-indigo-400/20" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-1.5 border border-slate-800 z-20">
                                <Clock size={20} className="text-amber-500" />
                            </div>
                        </div>

                        {/* Text */}
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Estamos Fechados</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Nossa chapa está esfriando agora. <br/>Mas você pode deixar seu pedido agendado!
                        </p>

                        {/* Next Open Info */}
                        <div className="w-full bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 mb-6 flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Abrimos em</p>
                                <p className="text-emerald-400 font-bold text-sm">{shopStatus.nextOpen}</p>
                            </div>
                            <div className="h-8 w-[1px] bg-slate-700"></div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</p>
                                <p className="text-amber-400 font-bold text-sm">Pré-Venda</p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <button onClick={handleDismissClosedWarning} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 mb-3">
                            <CalendarClock size={20} />
                            Agendar Pedido
                        </button>

                        <button onClick={handleDismissClosedWarning} className="text-slate-500 hover:text-white text-xs font-bold transition-colors py-2">
                            Apenas ver o cardápio
                        </button>
                    </div>
                </div>
            )}
            
            {showGiveawayModal && <GiveawayModal onClose={() => setShowGiveawayModal(false)} onConfirm={onEnterGiveaway} appConfig={appConfig} onSuccess={() => setAlertModal({ isOpen: true, title: "Boa Sorte! 🍀", message: "A janela do WhatsApp foi aberta. Envie a mensagem pré-preenchida para validar sua participação.", type: 'info' })} />}
            {confirmModal && <GenericConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(null)} onConfirm={confirmModal.action} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText="Sim, Confirmar"/>}
            {alertModal && <GenericAlertModal isOpen={alertModal.isOpen} title={alertModal.title} message={alertModal.message} type={alertModal.type} onClose={() => setAlertModal(null)} />}
        </div>
    );
}

function GiveawayModal({ onClose, onConfirm, appConfig, onSuccess }: { onClose: () => void, onConfirm?: (data: any) => Promise<void>, appConfig: AppConfig, onSuccess: () => void }) {
    const [step, setStep] = useState<'form' | 'confirm'>('form');
    const [form, setForm] = useState({ name: '', phone: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (onConfirm) await onConfirm({ ...form, confirmed: false });
            setStep('confirm');
        } catch (error: any) { 
            console.error(error); 
            // Mostra o erro específico do backend se existir
            alert(error.message || "Erro ao participar. Tente novamente."); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleConfirmWhatsApp = () => {
        const message = `👋 Olá! Quero confirmar minha participação no *Sorteio*! 🎁🔥\n\n👤 Nome: *${form.name}*\n\nAguardo a validação! 🍀`;
        const phone = normalizePhone(appConfig.storePhone || '');
        if (phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in">
            <div className="bg-slate-900 rounded-3xl w-full max-w-sm p-6 border-2 border-red-500 shadow-2xl relative overflow-hidden text-center shadow-red-900/50">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <div className="bg-red-900/30 p-4 rounded-full mb-4 inline-block shadow-lg shadow-red-900/50 border border-red-500/30"><Gift size={40} className="text-amber-400 animate-pulse" /></div>
                <h3 className="font-black text-2xl text-white mb-2 uppercase tracking-wide">Sorteio</h3>
                {step === 'form' ? (
                    <>
                        <p className="text-slate-300 text-sm mb-6">Participe e concorra ao <span className="text-amber-400 font-bold">Combo Casal Classic</span>!</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input required placeholder="Seu Nome Completo" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-red-500 transition-colors" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
                            <input required type="tel" placeholder="Seu WhatsApp" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-red-500 transition-colors" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/>
                            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider">{loading ? <Loader2 className="animate-spin"/> : 'PARTICIPAR AGORA'}</button>
                        </form>
                    </>
                ) : (
                    <div className="animate-in slide-in-from-right">
                        <div className="bg-emerald-900/20 border border-emerald-500/50 p-4 rounded-xl mb-6"><p className="text-emerald-400 font-bold text-sm mb-1">Quase lá!</p><p className="text-slate-300 text-xs">Para validar sua participação, você deve enviar a mensagem de confirmação para nosso WhatsApp.</p></div>
                        <button onClick={handleConfirmWhatsApp} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"><MessageCircle size={20}/> Confirmar no WhatsApp</button>
                    </div>
                )}
                <div className="mt-4 text-xs text-slate-500 font-bold border-t border-slate-800 pt-3 flex items-center justify-center gap-2"><Instagram size={14}/> Sorteio: Quarta-feira 04/02/26 às 19h @jhansburgers</div>
            </div>
        </div>
    );
}
