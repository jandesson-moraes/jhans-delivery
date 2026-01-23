import React, { useState, useMemo, useEffect } from 'react';
import { Product, AppConfig, Order } from '../types';
import { formatCurrency, capitalize, normalizePhone, toSentenceCase, copyToClipboard } from '../utils';
import { ShoppingBag, Minus, Plus, X, Search, Utensils, ChevronRight, MapPin, Phone, CreditCard, Banknote, Bike, Store, ArrowLeft, CheckCircle2, MessageCircle, Copy, Check, TrendingUp, Lock } from 'lucide-react';
import { BrandLogo, Footer } from './Shared';

interface ClientInterfaceProps {
    products: Product[];
    appConfig: AppConfig;
    onCreateOrder: (data: any) => Promise<void>;
    onBack?: () => void;
    // Novas props para controle de acesso
    allowSystemAccess?: boolean;
    onSystemAccess?: (type: 'admin' | 'driver') => void;
}

export default function ClientInterface({ products, appConfig, onCreateOrder, onBack, allowSystemAccess, onSystemAccess }: ClientInterfaceProps) {
    const [view, setView] = useState<'menu' | 'cart' | 'success'>('menu');
    const [cart, setCart] = useState<{product: Product, quantity: number, obs: string}[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [search, setSearch] = useState('');
    const [orderId, setOrderId] = useState('');
    
    // Checkout State
    const [checkout, setCheckout] = useState({
        name: '',
        phone: '',
        address: '',
        paymentMethod: 'PIX',
        serviceType: 'delivery',
        trocoPara: ''
    });

    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category)));
        return ['Todos', ...cats.sort()];
    }, [products]);

    // Agrupa produtos por categoria para exibição organizada
    const groupedProducts = useMemo(() => {
        let filtered = products;
        
        // Filtro de Busca
        if (search) {
            filtered = products.filter(p => 
                p.name.toLowerCase().includes(search.toLowerCase()) || 
                p.description?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Se uma categoria específica (diferente de Todos) for selecionada, filtra apenas ela
        if (selectedCategory !== 'Todos') {
            return [{
                category: selectedCategory,
                items: filtered.filter(p => p.category === selectedCategory)
            }];
        }

        // Se 'Todos' for selecionado, agrupa por categoria
        const groups: {[key: string]: Product[]} = {};
        filtered.forEach(p => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });

        // Ordena as categorias (opcional: pode usar uma ordem fixa se desejar)
        return Object.keys(groups).sort().map(cat => ({
            category: cat,
            items: groups[cat]
        }));

    }, [products, search, selectedCategory]);

    const cartTotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    }, [cart]);

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

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;

        const itemsText = cart.map(i => {
            return `${i.quantity}x ${i.product.name}${i.obs ? `\n(Obs: ${i.obs})` : ''}`;
        }).join('\n---\n');

        const deliveryFee = checkout.serviceType === 'delivery' ? 5.00 : 0; // Taxa fixa exemplo
        const finalValue = cartTotal + deliveryFee;

        const orderData = {
            customer: capitalize(checkout.name),
            phone: checkout.phone,
            address: checkout.serviceType === 'delivery' ? toSentenceCase(checkout.address) : 'RETIRADA NO BALCÃO',
            items: itemsText,
            amount: formatCurrency(finalValue),
            value: finalValue,
            paymentMethod: checkout.paymentMethod === 'Dinheiro' && checkout.trocoPara ? `Dinheiro (Troco p/ ${checkout.trocoPara})` : checkout.paymentMethod,
            serviceType: checkout.serviceType,
            deliveryFee: deliveryFee,
            discount: 0,
            origin: 'menu'
        };

        try {
            await onCreateOrder(orderData);
            setOrderId(`ORD-${Math.floor(Math.random()*10000)}`); // Simulação visual
            setView('success');
            setCart([]);
        } catch (error) {
            alert("Erro ao enviar pedido. Tente novamente.");
        }
    };

    const sendToWhatsApp = () => {
        if (!appConfig.storePhone) return;
        
        let text = `*Olá! Acabei de fazer um pedido pelo Site.*\n\n`;
        text += `*Cliente:* ${checkout.name}\n`;
        text += `*Total:* ${formatCurrency(cartTotal + (checkout.serviceType === 'delivery' ? 5 : 0))}\n\n`;
        text += `Podem confirmar?`;

        const link = `https://wa.me/55${normalizePhone(appConfig.storePhone)}?text=${encodeURIComponent(text)}`;
        window.open(link, '_blank');
    };

    if (view === 'success') {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle2 size={48} className="text-emerald-500"/>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Pedido Recebido!</h2>
                <p className="text-slate-400 mb-8 max-w-xs mx-auto">Sua comida já vai começar a ser preparada. Fique de olho no seu WhatsApp!</p>
                
                {appConfig.storePhone && (
                    <button onClick={sendToWhatsApp} className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mb-4">
                        <MessageCircle size={20}/> Confirmar no WhatsApp
                    </button>
                )}
                
                <button onClick={() => setView('menu')} className="text-slate-500 font-bold text-sm hover:text-white transition-colors">
                    Voltar ao Cardápio
                </button>
            </div>
        )
    }

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
                                                    <p className="text-emerald-400 font-bold text-sm">{formatCurrency(item.product.price)}</p>
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
                                        <input required placeholder="Endereço Completo (Rua, Nº, Bairro)" className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-sm" value={checkout.address} onChange={e => setCheckout({...checkout, address: e.target.value})} />
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
                                            {method === 'PIX' && <Bike size={18} className="rotate-45"/>}
                                            {method === 'Dinheiro' && <Banknote size={18}/>}
                                            {method === 'Cartão' && <CreditCard size={18}/>}
                                            <span className="text-[10px] font-bold uppercase">{method}</span>
                                        </button>
                                    ))}
                                </div>
                                
                                {checkout.paymentMethod === 'PIX' && (
                                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl animate-in slide-in-from-top-2">
                                        <p className="text-xs text-emerald-400 font-bold mb-2 uppercase">Chave PIX (CNPJ)</p>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-slate-950 border border-emerald-500/30 rounded-lg p-3 text-sm font-mono text-white flex items-center justify-center select-all">
                                                52.873.147/0001-90
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => copyToClipboard('52.873.147/0001-90')}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-lg font-bold flex items-center justify-center transition-colors"
                                            >
                                                <Copy size={18}/>
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 text-center">Copie a chave acima e pague no seu app de banco.</p>
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
                            <div className="flex justify-between text-slate-400"><span>Taxa de Entrega</span><span>{checkout.serviceType === 'delivery' ? formatCurrency(5) : 'Grátis'}</span></div>
                            <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-slate-800"><span>Total</span><span>{formatCurrency(cartTotal + (checkout.serviceType === 'delivery' ? 5 : 0))}</span></div>
                        </div>
                        <button form="checkout-form" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg active:scale-95 transition-transform">
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
            {/* Header */}
            <div className="bg-slate-900 p-4 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <BrandLogo size="small" config={appConfig} />
                    
                    {/* Botões de Acesso ao Sistema (Só aparecem se allowSystemAccess for true) */}
                    {allowSystemAccess && onSystemAccess && (
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => onSystemAccess('admin')} 
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-700/50"
                                title="Acesso Gerente"
                             >
                                <Lock size={14} className="text-amber-500"/>
                                <span className="text-[10px] font-bold uppercase hidden md:inline">Gerente</span>
                             </button>
                             <button 
                                onClick={() => onSystemAccess('driver')} 
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-700/50"
                                title="Acesso Motoboy"
                             >
                                <Bike size={14} className="text-emerald-500"/>
                                <span className="text-[10px] font-bold uppercase hidden md:inline">Motoboy</span>
                             </button>
                        </div>
                    )}
                </div>
                
                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={18}/>
                    <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-amber-500 transition-colors focus:bg-slate-900"
                        placeholder="O que você quer comer hoje?"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar hide-scrollbar">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-amber-600 text-white shadow-lg border-amber-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
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
                        {/* Se estiver mostrando Todos, exibe o título da categoria. Se estiver filtrado, o título já está no botão de filtro */}
                        {selectedCategory === 'Todos' && (
                            <h3 className="text-lg font-bold text-amber-500 mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                                <Utensils size={16}/> {group.category}
                            </h3>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.items.map(product => (
                                <div key={product.id} onClick={() => addToCart(product)} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex justify-between gap-4 cursor-pointer hover:border-amber-500/50 transition-all active:scale-95 group hover:bg-slate-800/80">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white mb-1 group-hover:text-amber-500 transition-colors">{product.name}</h3>
                                        <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-relaxed">{product.description}</p>
                                        <p className="font-bold text-emerald-400">{formatCurrency(product.price)}</p>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="bg-slate-800 p-3 rounded-xl text-slate-400 group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-sm">
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
                    <button onClick={() => setView('cart')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500/30 animate-in slide-in-from-bottom-4 active:scale-95 transition-transform">
                        <div className="flex items-center gap-3">
                            <div className="bg-black/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                {cart.reduce((a,b) => a + b.quantity, 0)}
                            </div>
                            <span className="font-bold text-sm">Ver Carrinho</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{formatCurrency(cartTotal)}</span>
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