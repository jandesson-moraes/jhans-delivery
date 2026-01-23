
import React, { useState, useMemo, useEffect } from 'react';
import { Product, AppConfig, Order } from '../types';
import { formatCurrency, capitalize, normalizePhone, toSentenceCase, copyToClipboard, formatTime, formatDate, generatePixPayload } from '../utils';
import { ShoppingBag, Minus, Plus, X, Search, Utensils, ChevronRight, MapPin, Phone, CreditCard, Banknote, Bike, Store, ArrowLeft, CheckCircle2, MessageCircle, Copy, Check, TrendingUp, Lock, Star, Flame, Loader2, Navigation, AlertCircle, Receipt, Clock, QrCode, Gift } from 'lucide-react';
import { BrandLogo, Footer } from './Shared';

interface ClientInterfaceProps {
    products: Product[];
    appConfig: AppConfig;
    onCreateOrder: (data: any) => Promise<void>;
    onBack?: () => void;
    allowSystemAccess?: boolean;
    onSystemAccess?: (type: 'admin' | 'driver') => void;
}

export default function ClientInterface({ products, appConfig, onCreateOrder, onBack, allowSystemAccess, onSystemAccess }: ClientInterfaceProps) {
    const [view, setView] = useState<'menu' | 'cart' | 'success'>('menu');
    const [cart, setCart] = useState<{product: Product, quantity: number, obs: string}[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [search, setSearch] = useState('');
    const [orderId, setOrderId] = useState('');
    const [lastOrderData, setLastOrderData] = useState<any>(null); // Armazena dados do ultimo pedido para o recibo
    const [loadingLocation, setLoadingLocation] = useState(false);
    
    // Checkout State
    const [checkout, setCheckout] = useState({
        name: '',
        phone: '',
        address: '',
        mapsLink: '', 
        paymentMethod: 'PIX',
        serviceType: 'delivery',
        trocoPara: ''
    });

    // --- PERSISTÊNCIA DE DADOS ---
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
                    mapsLink: parsed.mapsLink || ''
                }));
            }
        } catch (e) {
            console.error("Erro ao carregar dados salvos", e);
        }
    }, []);

    // Ordem de prioridade para exibição (Psicologia de Venda)
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

    // Agrupa produtos
    const groupedProducts = useMemo(() => {
        let filtered = products;
        
        if (search) {
            filtered = products.filter(p => 
                p.name.toLowerCase().includes(search.toLowerCase()) || 
                p.description?.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (selectedCategory !== 'Todos') {
            return [{
                category: selectedCategory,
                items: filtered.filter(p => p.category === selectedCategory)
            }];
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

        return sortedKeys.map(cat => ({
            category: cat,
            items: groups[cat]
        }));

    }, [products, search, selectedCategory]);

    const cartTotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    }, [cart]);

    // LÓGICA DE ENTREGA GRÁTIS
    // Mesmo sendo delivery, o custo para o cliente é 0
    const deliveryFee = 0; 
    const finalTotal = cartTotal + deliveryFee;

    // Geração do Payload do PIX
    const pixPayload = useMemo(() => {
        if (checkout.paymentMethod === 'PIX' && appConfig.pixKey && appConfig.pixName && appConfig.pixCity) {
            return generatePixPayload(appConfig.pixKey, appConfig.pixName, appConfig.pixCity, finalTotal);
        }
        return null;
    }, [checkout.paymentMethod, appConfig, finalTotal]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { product, quantity: 1, obs: '' }];
        });
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[index];
            const newQty = item.quantity + delta;
            if (newQty <= 0) {
                newCart.splice(index, 1);
            } else {
                item.quantity = newQty;
            }
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

    // Função para pegar Geolocalização
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Seu navegador não suporta geolocalização.");
            return;
        }

        setLoadingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Gera o link exato do GPS
                const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                
                setCheckout(prev => ({
                    ...prev,
                    mapsLink: mapsLink,
                }));
                
                setLoadingLocation(false);
                const addressInput = document.getElementById('address-input');
                if(addressInput) addressInput.focus();
            },
            (error) => {
                console.error(error);
                alert("Não foi possível obter o GPS. Por favor, digite o endereço manualmente.");
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;

        if (checkout.serviceType === 'delivery' && !checkout.address) {
            alert("Por favor, digite o endereço de entrega (Rua e Número).");
            return;
        }

        const itemsText = cart.map(i => {
            return `${i.quantity}x ${i.product.name}${i.obs ? `\n(Obs: ${i.obs})` : ''}`;
        }).join('\n---\n');

        // SALVAR DADOS NO LOCALSTORAGE
        try {
            localStorage.setItem('jhans_client_info', JSON.stringify({
                name: checkout.name,
                phone: checkout.phone,
                address: checkout.address,
                mapsLink: checkout.mapsLink
            }));
        } catch (err) {
            console.error("Erro ao salvar dados locais", err);
        }

        const orderData = {
            customer: capitalize(checkout.name),
            phone: checkout.phone,
            address: checkout.serviceType === 'delivery' ? toSentenceCase(checkout.address) : 'RETIRADA NO BALCÃO',
            mapsLink: checkout.mapsLink, 
            items: itemsText,
            amount: formatCurrency(finalTotal),
            value: finalTotal,
            paymentMethod: checkout.paymentMethod === 'Dinheiro' && checkout.trocoPara ? `Dinheiro (Troco p/ ${checkout.trocoPara})` : checkout.paymentMethod,
            serviceType: checkout.serviceType,
            deliveryFee: 0, // Salva explicitamente como 0
            discount: 0,
            origin: 'menu',
            createdAt: { seconds: Date.now() / 1000 } // Simulando timestamp para exibição imediata
        };

        try {
            await onCreateOrder(orderData);
            const generatedId = `PED-${Math.floor(Math.random()*10000)}`;
            setOrderId(generatedId); 
            setLastOrderData({ ...orderData, id: generatedId });
            setView('success');
            setCart([]);
            setCheckout(prev => ({ ...prev, trocoPara: '' })); 
        } catch (error) {
            alert("Erro ao enviar pedido. Tente novamente.");
        }
    };

    const sendToWhatsApp = () => {
        if (!appConfig.storePhone) return;
        
        // Garante o uso dos dados mais recentes (do pedido confirmado)
        const data = lastOrderData || { 
            customer: checkout.name, 
            id: orderId, 
            value: finalTotal, 
            paymentMethod: checkout.paymentMethod 
        };

        let text = `*Olá! Acabei de fazer um pedido pelo Site.*\n\n`;
        text += `*Pedido:* #${data.id.slice(-4)}\n`;
        text += `*Cliente:* ${data.customer}\n`;
        text += `*Itens:* ${data.items.replace(/\n---\n/g, ', ')}\n`; // Resumo rápido
        
        // Destaque para entrega grátis
        if (checkout.serviceType === 'delivery') {
            text += `*Entrega:* GRÁTIS (Presente da Casa) 🎁\n`;
        }
        
        text += `*Total:* ${formatCurrency(data.value)}\n`;
        text += `*Pagamento:* ${data.paymentMethod}\n\n`;

        // INCLUSÃO DA CHAVE PIX NO WHATSAPP COM COPIA E COLA
        if (data.paymentMethod && data.paymentMethod.includes('PIX') && appConfig.pixKey) {
            const payload = generatePixPayload(appConfig.pixKey, appConfig.pixName, appConfig.pixCity, data.value, data.id);
            text += `--------------------------------\n`;
            text += `*PAGAMENTO PIX (COPIA E COLA):*\n\n`;
            text += `${payload}\n\n`;
            text += `_(Copie o código acima e cole no seu banco)_\n`;
            text += `--------------------------------\n\n`;
        }

        text += `Podem confirmar?`;

        const link = `https://wa.me/55${normalizePhone(appConfig.storePhone)}?text=${encodeURIComponent(text)}`;
        window.open(link, '_blank');
    };

    if (view === 'success' && lastOrderData) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in">
                
                <div className="mb-6 flex flex-col items-center">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-900/40 animate-bounce">
                        <CheckCircle2 size={40} className="text-white"/>
                    </div>
                    <h2 className="text-2xl font-black text-white">Pedido Enviado!</h2>
                    <p className="text-slate-400 text-sm">Agora é só aguardar a confirmação.</p>
                </div>

                {/* CUPOM / RECIBO DIGITAL */}
                <div className="w-full max-w-sm bg-white text-slate-900 rounded-xl p-0 overflow-hidden shadow-2xl mb-6 relative">
                    {/* Borda serrilhada CSS trick */}
                    <div className="bg-red-600 p-4 text-white text-center relative">
                        <h3 className="font-bold text-lg uppercase tracking-wider">{appConfig.appName}</h3>
                        <p className="text-[10px] opacity-80">COMPROVANTE DO CLIENTE</p>
                        <div className="absolute -bottom-2 left-0 w-full h-4 bg-white" style={{maskImage: 'radial-gradient(circle, transparent 50%, black 50%)', maskSize: '10px 20px', WebkitMaskImage: 'radial-gradient(circle, transparent 50%, black 50%)', WebkitMaskSize: '15px 15px'}}></div>
                    </div>
                    
                    <div className="p-6 pt-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-dashed border-slate-300 pb-2">
                            <span className="text-xs font-bold text-slate-500">DATA</span>
                            <span className="text-xs font-bold">{formatDate(lastOrderData.createdAt)} • {formatTime(lastOrderData.createdAt)}</span>
                        </div>
                        
                        <div className="text-left space-y-1">
                            <p className="text-xs text-slate-500 font-bold">CLIENTE</p>
                            <p className="font-bold text-lg leading-none">{lastOrderData.customer}</p>
                            <p className="text-xs text-slate-500">{lastOrderData.phone}</p>
                        </div>

                        <div className="bg-slate-100 p-3 rounded-lg text-left">
                            <p className="text-[10px] text-slate-500 font-bold mb-1">RESUMO DO PEDIDO</p>
                            <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-snug font-bold">
                                {lastOrderData.items}
                            </pre>
                        </div>

                        {/* LINHA DE ENTREGA GRÁTIS NO RECIBO */}
                        <div className="flex justify-between items-center text-xs border-t border-dashed border-slate-300 pt-2">
                            <span className="font-bold text-slate-500">Entrega</span>
                            <span className="font-bold text-emerald-600 flex items-center gap-1"><Gift size={12}/> GRÁTIS (Presente)</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                            <span className="font-bold text-lg">TOTAL A PAGAR</span>
                            <span className="font-black text-xl text-emerald-600">{formatCurrency(lastOrderData.value)}</span>
                        </div>
                        
                        <div className="text-[10px] text-slate-400 text-center pt-2">
                            ID do Pedido: <span className="font-mono text-slate-900">{lastOrderData.id}</span>
                        </div>
                    </div>
                </div>
                
                {appConfig.storePhone && (
                    <button onClick={sendToWhatsApp} className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mb-3 active:scale-95 transition-transform">
                        <MessageCircle size={20}/> Enviar Comprovante ao Restaurante
                    </button>
                )}
                
                <button onClick={() => setView('menu')} className="text-slate-500 font-bold text-sm hover:text-white transition-colors py-2">
                    Fazer Novo Pedido
                </button>
            </div>
        )
    }

    // MENU VIEW (Mantido igual)
    if (view === 'cart') {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col animate-in slide-in-from-right">
                <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-slate-900 sticky top-0 z-20">
                    <button onClick={() => setView('menu')} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                        <ArrowLeft size={20}/>
                    </button>
                    <h2 className="font-bold text-lg">Seu Carrinho</h2>
                </div>

                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <ShoppingBag size={48} className="opacity-20"/>
                            <p>Seu carrinho está vazio.</p>
                            <button onClick={() => setView('menu')} className="text-amber-500 font-bold text-sm">Ver Cardápio</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Lista de Itens */}
                            <div className="space-y-3">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-slate-800 p-2 rounded-lg text-amber-500"><Utensils size={16}/></div>
                                                <div>
                                                    <p className="font-bold text-sm">{item.product.name}</p>
                                                    <p className="text-amber-500 font-bold text-sm">{formatCurrency(item.product.price)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800">
                                                <button onClick={() => updateQuantity(idx, -1)} className="p-2 text-slate-400 hover:text-white"><Minus size={14}/></button>
                                                <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(idx, 1)} className="p-2 text-slate-400 hover:text-white"><Plus size={14}/></button>
                                            </div>
                                        </div>
                                        <input 
                                            placeholder="Observação (ex: sem cebola)" 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-500"
                                            value={item.obs}
                                            onChange={e => updateObs(idx, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Formulário de Checkout */}
                            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4 pt-4 border-t border-slate-800">
                                <h3 className="font-bold text-slate-400 text-sm uppercase">Dados da Entrega</h3>
                                
                                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-2">
                                    <button type="button" onClick={() => setCheckout({...checkout, serviceType: 'delivery'})} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${checkout.serviceType === 'delivery' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500'}`}>
                                        <Bike size={14}/> Entrega
                                    </button>
                                    <button type="button" onClick={() => setCheckout({...checkout, serviceType: 'pickup'})} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${checkout.serviceType === 'pickup' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}>
                                        <Store size={14}/> Retirada
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <input required placeholder="Seu Nome" className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-sm" value={checkout.name} onChange={e => setCheckout({...checkout, name: e.target.value})} />
                                    <input required type="tel" placeholder="Seu Telefone / WhatsApp" className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-sm" value={checkout.phone} onChange={e => setCheckout({...checkout, phone: e.target.value})} />
                                    
                                    {checkout.serviceType === 'delivery' && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                            {/* Botão de Geolocalização */}
                                            <button 
                                                type="button" 
                                                onClick={handleGetLocation} 
                                                disabled={loadingLocation}
                                                className={`w-full p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 border ${checkout.mapsLink ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50' : 'bg-blue-900/30 text-blue-300 border-blue-500/30 hover:bg-blue-900/50'}`}
                                            >
                                                {loadingLocation ? <Loader2 className="animate-spin" size={16}/> : checkout.mapsLink ? <CheckCircle2 size={16}/> : <Navigation size={16}/>}
                                                {loadingLocation ? "Obtendo GPS..." : checkout.mapsLink ? "GPS Capturado! (Atualizar)" : "Usar GPS (Localização Exata)"}
                                            </button>

                                            {/* Input de Endereço - OBRIGATÓRIO PARA O NÚMERO */}
                                            <div className="relative">
                                                <input 
                                                    id="address-input"
                                                    required 
                                                    placeholder={checkout.mapsLink ? "GPS OK! Agora digite: Rua, Número e Bairro" : "Endereço Completo (Rua, Número, Bairro)"}
                                                    className={`w-full p-3 bg-slate-900 border rounded-xl outline-none text-sm transition-all ${checkout.mapsLink ? 'border-emerald-500/50 focus:border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-800 focus:border-amber-500'}`}
                                                    value={checkout.address} 
                                                    onChange={e => setCheckout({...checkout, address: e.target.value})} 
                                                />
                                                {checkout.mapsLink && (
                                                    <div className="absolute right-3 top-3 text-emerald-500">
                                                        <MapPin size={18}/>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {checkout.mapsLink && !checkout.address && (
                                                <p className="text-[10px] text-amber-500 flex items-center gap-1 animate-pulse">
                                                    <AlertCircle size={10}/> Importante: Digite o número da casa acima!
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-bold text-slate-400 text-sm uppercase pt-2">Pagamento</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {['PIX', 'Dinheiro', 'Cartão'].map(method => (
                                        <button 
                                            key={method}
                                            type="button"
                                            onClick={() => setCheckout({...checkout, paymentMethod: method})}
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${checkout.paymentMethod === method ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                                        >
                                            {method === 'PIX' && <QrCode size={18}/>}
                                            {method === 'Dinheiro' && <Banknote size={18}/>}
                                            {method === 'Cartão' && <CreditCard size={18}/>}
                                            <span className="text-[10px] font-bold uppercase">{method}</span>
                                        </button>
                                    ))}
                                </div>
                                
                                {checkout.paymentMethod === 'PIX' && (
                                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl animate-in slide-in-from-top-2">
                                        {pixPayload ? (
                                            <div className="flex flex-col items-center">
                                                <p className="text-xs text-emerald-400 font-bold mb-3 uppercase flex items-center gap-2">
                                                    <QrCode size={14}/> Escaneie para pagar
                                                </p>
                                                {/* QR CODE GERADO VIA API PARA SIMPLICIDADE */}
                                                <div className="bg-white p-2 rounded-lg mb-3">
                                                    <img 
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixPayload)}`} 
                                                        alt="QR Code PIX" 
                                                        className="w-32 h-32"
                                                    />
                                                </div>
                                                <div className="w-full">
                                                    <p className="text-[10px] text-slate-500 mb-1 text-center">Ou copie o código:</p>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            readOnly 
                                                            value={pixPayload} 
                                                            className="flex-1 bg-slate-950 border border-emerald-500/30 rounded-lg p-2 text-[10px] font-mono text-white truncate"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => copyToClipboard(pixPayload)}
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded-lg font-bold flex items-center justify-center transition-colors"
                                                        >
                                                            <Copy size={14}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-xs text-amber-500 font-bold mb-2">Chave PIX não configurada pelo restaurante.</p>
                                                <p className="text-[10px] text-slate-500">Pague na entrega ou combine via WhatsApp.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {checkout.paymentMethod === 'Dinheiro' && (
                                    <input placeholder="Precisa de troco para quanto?" className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-sm" value={checkout.trocoPara} onChange={e => setCheckout({...checkout, trocoPara: e.target.value})} />
                                )}
                            </form>
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 pb-safe">
                        <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatCurrency(cartTotal)}</span></div>
                            <div className="flex justify-between text-emerald-400">
                                <span>Taxa de Entrega</span>
                                <span className="flex items-center gap-1 font-bold"><Gift size={14}/> GRÁTIS (Presente)</span>
                            </div>
                            <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-slate-800"><span>Total</span><span>{formatCurrency(finalTotal)}</span></div>
                        </div>
                        <button form="checkout-form" type="submit" className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg active:scale-95 transition-transform">
                            <CheckCircle2 size={24}/> Enviar Pedido
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // MENU VIEW
    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Header / Hero Section - NOVA PALETA APPETITE (Vermelho + Âmbar) */}
            <div className="bg-gradient-to-br from-red-700 via-red-600 to-amber-600 p-6 pt-8 pb-10 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <BrandLogo size="small" config={appConfig} />
                    
                    {/* Botões de Acesso ao Sistema */}
                    {allowSystemAccess && onSystemAccess && (
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => onSystemAccess('admin')} 
                                className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-amber-100 hover:text-white transition-colors border border-white/10 backdrop-blur-sm"
                                title="Acesso Gerente"
                             >
                                <Lock size={14} className="text-amber-300"/>
                                <span className="text-[10px] font-bold uppercase hidden md:inline">Gerente</span>
                             </button>
                             <button 
                                onClick={() => onSystemAccess('driver')} 
                                className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-amber-100 hover:text-white transition-colors border border-white/10 backdrop-blur-sm"
                                title="Acesso Motoboy"
                             >
                                <Bike size={14} className="text-amber-300"/>
                                <span className="text-[10px] font-bold uppercase hidden md:inline">Motoboy</span>
                             </button>
                        </div>
                    )}
                </div>
                
                <h1 className="text-2xl font-black text-white mb-4 leading-tight drop-shadow-sm">
                    Bateu a fome? <br/>
                    <span className="text-amber-200">Peça agora mesmo!</span> 🍔
                </h1>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
                    <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors focus:bg-slate-900 shadow-inner"
                        placeholder="Buscar lanche, bebida..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar -mx-2 px-2">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shadow-sm ${selectedCategory === cat ? 'bg-white text-red-700 shadow-lg border-white' : 'bg-black/20 text-amber-100 border-white/10 hover:bg-black/30'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product List Agrupada */}
            <div className="flex-1 p-4 pb-24 overflow-y-auto">
                {groupedProducts.map((group) => (
                    <div key={group.category} className="mb-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Se estiver mostrando Todos, exibe o título da categoria */}
                        {selectedCategory === 'Todos' && (
                            <h3 className="text-xl font-black text-white mb-4 border-l-4 border-amber-500 pl-3 flex items-center gap-2 uppercase tracking-wide">
                                {group.category}
                            </h3>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.items.map(product => (
                                <div key={product.id} onClick={() => addToCart(product)} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex justify-between gap-4 cursor-pointer hover:border-amber-500/50 transition-all active:scale-95 group hover:bg-slate-800/80 shadow-md relative overflow-hidden">
                                    {/* Efeito hover de brilho em Laranja/Vermelho */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
                                    
                                    <div className="flex-1 z-10">
                                        <h3 className="font-bold text-white text-lg mb-1 group-hover:text-amber-400 transition-colors">{product.name}</h3>
                                        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{product.description}</p>
                                        <p className="font-black text-amber-500 text-lg">{formatCurrency(product.price)}</p>
                                    </div>
                                    <div className="flex flex-col justify-end z-10">
                                        <div className="bg-slate-800 p-3 rounded-xl text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm">
                                            <Plus size={20}/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {groupedProducts.length === 0 && (
                    <div className="text-center py-20 text-slate-500 animate-in fade-in">
                        <Utensils size={48} className="mx-auto mb-3 opacity-20"/>
                        <p>Nenhum item encontrado.</p>
                    </div>
                )}
            </div>

            {/* Floating Cart Button */}
            {cart.length > 0 && (
                <div className="fixed bottom-4 left-0 w-full px-4 z-40">
                    <button onClick={() => setView('cart')} className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white p-4 rounded-2xl shadow-xl shadow-red-900/40 flex items-center justify-between border border-red-500/30 animate-in slide-in-from-bottom-4 active:scale-95 transition-transform">
                        <div className="flex items-center gap-3">
                            <div className="bg-black/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                {cart.reduce((a,b) => a + b.quantity, 0)}
                            </div>
                            <span className="font-bold text-sm uppercase tracking-wide">Ver Carrinho</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-black text-lg">{formatCurrency(cartTotal)}</span>
                            <ChevronRight size={20}/>
                        </div>
                    </button>
                </div>
            )}
            
            <div className="pb-safe bg-slate-950">
                <Footer />
            </div>
        </div>
    );
}
