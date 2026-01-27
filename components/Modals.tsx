import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, PlusCircle, Bike, Store, Minus, Plus, Trash2, Camera, UploadCloud, Users, Edit, MinusCircle, ClipboardPaste, AlertCircle, CheckCircle2, Calendar, FileText, Download, Share2, Save, MapPin, History, AlertTriangle, Clock, ListPlus, Utensils, Settings as SettingsIcon, MessageCircle, Copy, Check, Send, Flame, TrendingUp, DollarSign, ShoppingBag, ArrowRight, Play, Printer, ChevronRight, Gift, QrCode, Search, ExternalLink } from 'lucide-react';
import { Product, Client, AppConfig, Driver, Order, Vale, DeliveryZone } from '../types';
import { capitalize, compressImage, formatCurrency, normalizePhone, parseCurrency, formatDate, copyToClipboard, generateReceiptText, formatTime, toSentenceCase, getOrderReceivedText, formatOrderId, getDispatchMessage, getProductionMessage, generatePixPayload } from '../utils';

// --- MODAL: CONFIRMAR FECHAMENTO NA COZINHA (NOVO) ---
export function ConfirmCloseOrderModal({ onClose, onConfirm, order }: { onClose: () => void, onConfirm: () => void, order: Order }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border-2 border-red-500/50 shadow-red-500/20 relative overflow-hidden">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="bg-red-500/20 p-4 rounded-full mb-3 animate-bounce">
                        <X size={32} className="text-red-400" />
                    </div>
                    <h3 className="font-black text-2xl text-white uppercase tracking-wide">Fechar Pedido?</h3>
                    <p className="text-slate-400 font-medium text-sm mt-2">
                        Você vai remover o pedido <strong>{formatOrderId(order.id)}</strong> da tela da cozinha.
                    </p>
                    <p className="text-red-400 text-xs mt-2 font-bold bg-red-900/20 p-2 rounded border border-red-900/50">
                        Isso marcará o pedido como CONCLUÍDO.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-sm transition-colors border border-slate-700"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        <Trash2 size={16}/> Sim, Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- MODAL: SUCESSO DE PREPARO (NOVO) ---
export function ProductionSuccessModal({ onClose, order, appName }: { onClose: () => void, order: Order, appName: string }) {
    const [copied, setCopied] = useState(false);
    // FALLBACK DE SEGURANÇA
    const safeAppName = appName || "Jhans Burgers";
    const message = getProductionMessage(order, safeAppName);
    const phone = normalizePhone(order.phone);

    const handleCopy = () => {
        copyToClipboard(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenWhatsapp = () => {
        if (phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, 'whatsapp-session');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border-2 border-orange-500 shadow-orange-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="flex h-32 w-32">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    </span>
                </div>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="bg-orange-500/20 p-4 rounded-full mb-3 animate-bounce">
                        <Flame size={32} className="text-orange-400" />
                    </div>
                    <h3 className="font-black text-2xl text-white uppercase tracking-wide">Pedido em Preparo!</h3>
                    <p className="text-orange-400 font-bold text-sm">Cozinha iniciou a produção</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 text-left relative">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-2">Mensagem para o Cliente:</p>
                    <div className="text-slate-300 text-sm whitespace-pre-wrap font-medium bg-slate-900 p-3 rounded-lg border border-slate-800 max-h-40 overflow-y-auto custom-scrollbar">
                        {message}
                    </div>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={handleCopy}
                        className={`w-full py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${copied ? 'bg-orange-500 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
                    >
                        {copied ? <Check size={20}/> : <Copy size={20}/>}
                        {copied ? 'Mensagem Copiada!' : 'Copiar Mensagem'}
                    </button>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-sm transition-colors"
                        >
                            Fechar
                        </button>
                        {phone && (
                            <button 
                                onClick={handleOpenWhatsapp}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={16}/> Abrir WhatsApp
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- NOVO MODAL: SUCESSO DE DESPACHO ---
export function DispatchSuccessModal({ onClose, data, appName }: { onClose: () => void, data: { order: Order, driverName: string }, appName: string }) {
    const [copied, setCopied] = useState(false);
    // FALLBACK DE SEGURANÇA
    const safeAppName = appName || "Jhans Burgers";
    const message = getDispatchMessage(data.order, data.driverName, safeAppName);
    const phone = normalizePhone(data.order.phone);

    const handleCopy = () => {
        copyToClipboard(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenWhatsapp = () => {
        if (phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, 'whatsapp-session');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border-2 border-emerald-500 shadow-emerald-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="flex h-32 w-32">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    </span>
                </div>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="bg-emerald-500/20 p-4 rounded-full mb-3 animate-bounce">
                        <Bike size={32} className="text-emerald-400" />
                    </div>
                    <h3 className="font-black text-2xl text-white uppercase tracking-wide">Pedido Despachado!</h3>
                    <p className="text-emerald-400 font-bold text-sm">Entregue ao motoboy {data.driverName}</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 text-left relative">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-2">Mensagem para o Cliente:</p>
                    <div className="text-slate-300 text-sm whitespace-pre-wrap font-medium bg-slate-900 p-3 rounded-lg border border-slate-800 max-h-40 overflow-y-auto custom-scrollbar">
                        {message}
                    </div>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={handleCopy}
                        className={`w-full py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${copied ? 'bg-emerald-500 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                    >
                        {copied ? <Check size={20}/> : <Copy size={20}/>}
                        {copied ? 'Mensagem Copiada!' : 'Copiar Mensagem'}
                    </button>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-sm transition-colors"
                        >
                            Fechar
                        </button>
                        {phone && (
                            <button 
                                onClick={handleOpenWhatsapp}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={16}/> Abrir WhatsApp
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NewDriverModal({ onClose, onSave, initialData }: any) {
    const [form, setForm] = useState(initialData || { 
        name: '', 
        phone: '', 
        vehicle: 'Moto', 
        plate: '', 
        password: '', 
        avatar: '',
        paymentModel: 'fixed_per_delivery',
        paymentRate: 5.00
    });
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingImage(true);
            try {
                const base64 = await compressImage(file);
                setForm({ ...form, avatar: base64 });
            } catch {
                alert("Erro ao processar imagem.");
            } finally {
                setIsProcessingImage(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
             ...form,
             status: form.status || 'offline',
             rating: form.rating || 5,
             totalDeliveries: form.totalDeliveries || 0,
             paymentRate: parseFloat(form.paymentRate) || 0,
             battery: 100,
             lat: 0, lng: 0 
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-800 animate-in zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                        {initialData ? <Edit className="text-amber-500"/> : <PlusCircle className="text-emerald-500"/>}
                        {initialData ? 'Editar Motoboy' : 'Novo Motoboy'}
                    </h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <div className="relative w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden group">
                            {form.avatar ? <img src={form.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-500"><Bike size={32}/></div>}
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                <Camera size={24}/>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload}/>
                            </label>
                        </div>
                    </div>
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Nome</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.name} onChange={e => setForm({...form, name: capitalize(e.target.value)})} required/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Telefone</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/></div>
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Veículo</label><select className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})}><option value="Moto">Moto</option><option value="Carro">Carro</option><option value="Bike">Bike</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Placa</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 uppercase" value={form.plate} onChange={e => setForm({...form, plate: e.target.value.toUpperCase()})}/></div>
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Senha Acesso</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.password} onChange={e => setForm({...form, password: e.target.value})}/></div>
                    </div>

                    {/* CONFIGURAÇÃO DE PAGAMENTO */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><DollarSign size={14}/> Acordo Financeiro</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Modelo de Pagamento</label>
                                <select className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 text-sm" value={form.paymentModel || 'fixed_per_delivery'} onChange={e => setForm({...form, paymentModel: e.target.value})}>
                                    <option value="fixed_per_delivery">Fixo por Entrega (Ex: R$ 5,00)</option>
                                    <option value="percentage">Comissão (%) sobre Total</option>
                                    <option value="salary">Salário / Diária (Sem repasse auto)</option>
                                </select>
                            </div>
                            
                            {form.paymentModel !== 'salary' && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">
                                        {form.paymentModel === 'percentage' ? 'Porcentagem (%)' : 'Valor por Entrega (R$)'}
                                    </label>
                                    <input 
                                        type="number" 
                                        step={form.paymentModel === 'percentage' ? "1" : "0.50"} 
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 font-bold"
                                        value={form.paymentRate} 
                                        onChange={e => setForm({...form, paymentRate: e.target.value})}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <button disabled={isProcessingImage} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg mt-2 flex items-center justify-center gap-2">
                        <CheckCircle2 size={18}/> Salvar Motoboy
                    </button>
                </form>
            </div>
        </div>
    )
}

// --- NEW ORDER MODAL RESTAURADO (VERSÃO COMPLETA COM SELEÇÃO DE PRODUTOS E CLIENTES) ---
export function NewOrderModal({ onClose, onSave, products, clients }: any) {
    const [form, setForm] = useState({ 
        customer: '', phone: '', address: '', value: '', paymentMethod: 'Dinheiro', serviceType: 'delivery', neighborhood: '', mapsLink: '', obs: '' 
    });
    const [selectedItems, setSelectedItems] = useState<{product: Product, quantity: number}[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);

    // Agrupa produtos por categoria
    const groupedProducts = useMemo(() => {
        let filtered = products;
        if (searchTerm) {
            filtered = products.filter((p: Product) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        const PRIORITY_ORDER = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        const groups: {[key: string]: Product[]} = {};
        
        filtered.forEach((p: Product) => {
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
    }, [products, searchTerm]);

    // Filtra clientes para autocompletar
    const filteredClients = useMemo(() => {
        if (!form.customer || form.customer.length < 2) return [];
        return clients.filter((c: Client) => 
            c.name.toLowerCase().includes(form.customer.toLowerCase()) || 
            c.phone.includes(form.customer)
        ).slice(0, 5);
    }, [clients, form.customer]);

    const handleAddProduct = (product: Product) => {
        setSelectedItems(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const handleRemoveItem = (index: number) => {
        setSelectedItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateQty = (index: number, delta: number) => {
         setSelectedItems(prev => {
            return prev.map((item, i) => {
                if(i === index) {
                    const n = item.quantity + delta;
                    return n > 0 ? {...item, quantity: n} : item;
                }
                return item;
            })
         });
    };

    // LÓGICA DE RECONHECIMENTO DE TELEFONE (DIGITAR OU COLAR)
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputPhone = e.target.value;
        setForm(prev => ({ ...prev, phone: inputPhone }));

        const cleanInput = normalizePhone(inputPhone);
        
        // Só busca se tiver tamanho relevante para evitar matches ruins
        if (cleanInput.length >= 8) {
            // Procura cliente que tenha o telefone terminando com o input ou vice-versa (lida com 55 e DDD)
            const foundClient = clients.find((c: Client) => {
                const dbPhone = normalizePhone(c.phone);
                return dbPhone.endsWith(cleanInput) || cleanInput.endsWith(dbPhone);
            });

            if (foundClient) {
                setForm(prev => ({
                    ...prev,
                    customer: foundClient.name,
                    address: foundClient.address,
                    mapsLink: foundClient.mapsLink || '',
                    obs: foundClient.obs || prev.obs, // Usa obs do cadastro se tiver
                    phone: inputPhone // Mantém o input original visualmente
                }));
                // Remove sugestões de nome se já achou pelo telefone
                setShowClientSuggestions(false);
            }
        }
    };

    const handleSelectClient = (client: Client) => {
        setForm(prev => ({
            ...prev,
            customer: client.name,
            phone: client.phone,
            address: client.address,
            neighborhood: '', // Poderia vir do cadastro se existisse
            mapsLink: client.mapsLink || '' // Puxa o link do Google Maps
        }));
        setShowClientSuggestions(false);
    };

    // Recalcula total sempre que itens mudam
    useEffect(() => {
        const total = selectedItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
        setForm(prev => ({ ...prev, value: total.toFixed(2) }));
    }, [selectedItems]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const itemsString = selectedItems.map(i => `${i.quantity}x ${i.product.name}`).join('\n');
        
        onSave({
            ...form,
            items: itemsString,
            value: parseFloat(form.value.toString().replace(',','.')),
            amount: formatCurrency(parseFloat(form.value.toString().replace(',','.'))),
            createdAt: { seconds: Date.now() / 1000 },
            status: 'pending'
        });
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
             <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden border border-slate-800 animate-in zoom-in">
                
                {/* LADO ESQUERDO: SELEÇÃO DE PRODUTOS (CARDÁPIO) */}
                <div className="hidden md:flex flex-1 bg-slate-900 p-6 flex-col overflow-hidden border-r border-slate-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                            <input 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-emerald-500" 
                                placeholder="Buscar no cardápio..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {groupedProducts.map((group) => (
                            <div key={group.category} className="mb-6">
                                <h4 className="text-emerald-500 font-bold uppercase text-xs mb-3 flex items-center gap-2 border-b border-slate-800 pb-1">
                                    <Utensils size={12}/> {group.category}
                                </h4>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {group.items.map((p: Product) => (
                                        <button 
                                            key={p.id} 
                                            onClick={() => handleAddProduct(p)}
                                            className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-emerald-500 hover:bg-slate-800 transition-all text-left group flex flex-col justify-between h-24"
                                        >
                                            <span className="font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-emerald-400">{p.name}</span>
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="font-bold text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded text-xs">{formatCurrency(p.price)}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* LADO DIREITO: FORMULÁRIO DE PEDIDO */}
                <div className="w-full md:w-[400px] lg:w-[450px] bg-slate-950 p-6 flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-white flex items-center gap-2"><PlusCircle className="text-emerald-500"/> Novo Pedido</h3>
                        <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
                        <div className="relative">
                            <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Cliente</label>
                            <input 
                                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 font-bold" 
                                value={form.customer} 
                                onChange={e => { setForm({...form, customer: capitalize(e.target.value)}); setShowClientSuggestions(true); }}
                                onFocus={() => setShowClientSuggestions(true)}
                                required 
                                placeholder="Nome do Cliente" 
                                autoComplete="off"
                            />
                            {showClientSuggestions && filteredClients.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 rounded-xl mt-1 shadow-2xl z-50 overflow-hidden">
                                    {filteredClients.map(c => (
                                        <button 
                                            type="button"
                                            key={c.id} 
                                            onClick={() => handleSelectClient(c)}
                                            className="w-full text-left p-3 hover:bg-slate-700 border-b border-slate-700 last:border-0"
                                        >
                                            <p className="text-white font-bold text-sm">{c.name}</p>
                                            <p className="text-xs text-slate-400">{c.phone}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Telefone</label>
                                <input 
                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors" 
                                    value={form.phone} 
                                    onChange={handlePhoneChange} 
                                    placeholder="Digite ou Cole aqui..."
                                />
                            </div>
                            <div><label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Tipo</label><select className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500" value={form.serviceType} onChange={e => setForm({...form, serviceType: e.target.value})}><option value="delivery">Entrega</option><option value="pickup">Retirada</option></select></div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Link Google Maps (GPS)</label>
                            <div className="flex gap-2">
                                <input 
                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 text-xs truncate" 
                                    value={form.mapsLink} 
                                    onChange={e => setForm({...form, mapsLink: e.target.value})}
                                    placeholder="https://maps.google.com..."
                                />
                                {form.mapsLink && (
                                    <button 
                                        type="button"
                                        onClick={() => window.open(form.mapsLink, '_blank')} 
                                        className="bg-blue-900/30 text-blue-400 p-3 rounded-xl border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors"
                                        title="Abrir Mapa"
                                    >
                                        <MapPin size={18}/>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Endereço</label>
                            <textarea className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 h-20 resize-none text-sm" value={form.address} onChange={e => setForm({...form, address: toSentenceCase(e.target.value)})} placeholder="Rua, Número, Bairro..."/>
                        </div>

                        {/* LISTA DE ITENS SUBSTITUINDO TEXTAREA */}
                        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col min-h-[150px] overflow-hidden">
                            <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase flex justify-between">
                                <span>Itens Selecionados</span>
                                <span className="text-emerald-500">{selectedItems.length} itens</span>
                            </label>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                {selectedItems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                        <ShoppingBag size={24} className="mb-2"/>
                                        <p className="text-xs">Nenhum item selecionado.</p>
                                    </div>
                                ) : (
                                    selectedItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="flex items-center gap-1 bg-slate-900 rounded px-1 border border-slate-800">
                                                    <button type="button" onClick={()=>handleUpdateQty(idx, -1)} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"><Minus size={10}/></button>
                                                    <span className="text-xs font-bold w-4 text-center text-white">{item.quantity}</span>
                                                    <button type="button" onClick={()=>handleUpdateQty(idx, 1)} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"><Plus size={10}/></button>
                                                </div>
                                                <span className="text-xs font-bold text-white truncate">{item.product.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-xs font-bold text-emerald-500">{formatCurrency(item.product.price * item.quantity)}</span>
                                                <button type="button" onClick={() => handleRemoveItem(idx)} className="text-slate-500 hover:text-red-500 p-1 rounded hover:bg-slate-900 transition-colors"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Observações Gerais</label>
                            <input className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 text-sm" value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} placeholder="Ex: Sem cebola, Troco para 50..."/>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Total (R$)</label><input type="number" step="0.01" className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 font-bold text-lg" value={form.value} onChange={e => setForm({...form, value: e.target.value})} required/></div>
                            <div><label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Pagamento</label><select className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}><option>Dinheiro</option><option>PIX</option><option>Cartão</option></select></div>
                        </div>

                        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-auto"><CheckCircle2 size={20}/> Confirmar Pedido</button>
                    </form>
                </div>

             </div>
        </div>
    )
}

export function EditOrderModal({ order, onClose, onSave }: any) {
    const [form, setForm] = useState({ ...order });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(order.id, {
            ...form,
            value: typeof form.value === 'string' ? parseCurrency(form.value) : form.value,
            amount: typeof form.amount === 'number' ? formatCurrency(form.amount) : form.amount 
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
             <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-800 animate-in zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2"><Edit className="text-amber-500"/> Editar Pedido</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Cliente</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.customer} onChange={e => setForm({...form, customer: capitalize(e.target.value)})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                         <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Telefone</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                         <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Status</label>
                            <select className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                                <option value="pending">Pendente</option>
                                <option value="preparing">Preparando</option>
                                <option value="ready">Pronto</option>
                                <option value="assigned">Atribuído</option>
                                <option value="delivering">Em Entrega</option>
                                <option value="completed">Concluído</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                         </div>
                    </div>
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Endereço</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Itens</label><textarea className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 h-24" value={form.items} onChange={e => setForm({...form, items: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Valor (R$)</label><input type="number" step="0.01" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 font-bold" value={form.value} onChange={e => setForm({...form, value: parseFloat(e.target.value), amount: formatCurrency(parseFloat(e.target.value))})} /></div>
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Pagamento</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} /></div>
                    </div>
                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg mt-4">Salvar Alterações</button>
                </form>
             </div>
        </div>
    )
}

export function ConfirmAssignmentModal({ onClose, onConfirm, order, driverName }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
             <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-sm w-full text-center">
                 <h3 className="text-white text-xl font-bold mb-2">Confirmar Entrega?</h3>
                 <p className="text-slate-400 mb-6">Deseja enviar o pedido <strong>{order?.customer}</strong> para o motoboy <strong>{driverName}</strong>?</p>
                 <div className="flex gap-3">
                     <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancelar</button>
                     <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold">Confirmar</button>
                 </div>
             </div>
        </div>
    )
}

export function NewIncomingOrderModal({ order, onClose, onAccept, appConfig }: any) {
    // Uses audio for ringtone? Handled in AdminInterface.
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-pulse-subtle">
            <div className="bg-slate-900 rounded-3xl p-8 border-2 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)] max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 animate-loading-bar"></div>
                <div className="text-center mb-6">
                    <div className="bg-amber-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <AlertCircle size={40} className="text-amber-500"/>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase italic">Novo Pedido!</h2>
                    <p className="text-slate-400 text-sm mt-1">Chegou agora. O que deseja fazer?</p>
                </div>
                
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 text-left">
                     <div className="flex justify-between mb-2 border-b border-slate-800 pb-2">
                         <span className="font-bold text-white text-lg">{order.customer}</span>
                         <span className="font-mono text-emerald-400 font-bold text-lg">{order.amount}</span>
                     </div>
                     <p className="text-sm text-slate-300 mb-2">{order.items}</p>
                     <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {order.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <button onClick={onClose} className="py-4 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 transition-colors">Ver Depois</button>
                     <button onClick={() => { onAccept(order.id, { status: 'preparing' }); onClose(); }} className="py-4 rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-lg hover:bg-emerald-500 transition-colors animate-pulse">ACEITAR AGORA</button>
                </div>
            </div>
        </div>
    )
}

export function ProductFormModal({ isOpen, onClose, product, onSave, existingCategories }: any) {
    if(!isOpen) return null;
    const [form, setForm] = useState(product || { name: '', description: '', price: '', category: '' });
    
    useEffect(() => { setForm(product || { name: '', description: '', price: '', category: '' }); }, [product]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(product?.id, { ...form, price: parseFloat(form.price) });
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-800">
                <h3 className="font-bold text-xl text-white mb-4">{product ? 'Editar Produto' : 'Novo Produto'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-xs text-slate-500 font-bold uppercase">Nome</label><input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-emerald-500" value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase">Categoria</label><input required list="categories" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-emerald-500" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}/>
                    <datalist id="categories">{existingCategories.map((c: string) => <option key={c} value={c}/>)}</datalist></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase">Preço (R$)</label><input required type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-emerald-500" value={form.price} onChange={e=>setForm({...form, price: e.target.value})}/></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase">Descrição</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-emerald-500 h-24" value={form.description} onChange={e=>setForm({...form, description: e.target.value})}/></div>
                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl mt-2">Salvar</button>
                    <button type="button" onClick={onClose} className="w-full text-slate-500 py-2">Cancelar</button>
                </form>
            </div>
        </div>
    )
}

export function ReceiptModal({ order, onClose, appConfig }: any) {
    const text = generateReceiptText(order, appConfig?.appName, appConfig);
    const [copied, setCopied] = useState(false);
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white text-slate-900 rounded-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 bg-slate-100 border-b flex justify-between items-center"><h3 className="font-bold text-lg">Comprovante</h3><button onClick={onClose}><X size={20}/></button></div>
                <div className="p-4 overflow-y-auto bg-white flex-1">
                    <pre className="font-mono text-xs whitespace-pre-wrap leading-tight">{text}</pre>
                </div>
                <div className="p-4 bg-slate-50 border-t grid grid-cols-2 gap-2">
                    <button onClick={() => { copyToClipboard(text); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className={`py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>{copied ? <Check size={16}/> : <Copy size={16}/>} Copiar</button>
                    <button onClick={onClose} className="py-3 rounded-lg border border-slate-300 font-bold text-slate-600">Fechar</button>
                </div>
            </div>
        </div>
    )
}

export function SettingsModal({ config, onSave, onClose }: any) {
    const [form, setForm] = useState(config || {});
    const [activeTab, setActiveTab] = useState<'general' | 'schedule'>('general');
    
    // Handlers for DeliveryZones
    const updateZone = (idx: number, field: string, val: any) => {
        const newZones = [...(form.deliveryZones || [])];
        newZones[idx] = { ...newZones[idx], [field]: val };
        setForm({...form, deliveryZones: newZones});
    };
    const addZone = () => setForm({...form, deliveryZones: [...(form.deliveryZones || []), {name: '', fee: 0}]});
    const removeZone = (idx: number) => setForm({...form, deliveryZones: form.deliveryZones.filter((_: any, i: number) => i !== idx)});

    // Handlers for Schedule
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const updateSchedule = (dayIndex: number, field: string, val: any) => {
        const currentSchedule = form.schedule || {};
        const dayConfig = currentSchedule[dayIndex] || { open: '18:00', close: '23:00', enabled: true };
        
        setForm({
            ...form,
            schedule: {
                ...currentSchedule,
                [dayIndex]: { ...dayConfig, [field]: val }
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
             <div className="bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-800 flex flex-col max-h-[90vh]">
                 <div className="p-6 border-b border-slate-800 flex justify-between"><h3 className="font-bold text-xl text-white">Configurações</h3><button onClick={onClose}><X className="text-slate-500"/></button></div>
                 
                 <div className="flex border-b border-slate-800 px-6 gap-6">
                     <button onClick={()=>setActiveTab('general')} className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab==='general' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-500 hover:text-white'}`}>Geral e Taxas</button>
                     <button onClick={()=>setActiveTab('schedule')} className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab==='schedule' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-500 hover:text-white'}`}>Horários</button>
                 </div>

                 <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                     {activeTab === 'general' ? (
                         <>
                            <section>
                                <h4 className="text-emerald-500 font-bold uppercase text-xs mb-3 border-b border-slate-800 pb-1">Geral</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="text-xs text-slate-500 font-bold block mb-1">Nome do App</label><input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={form.appName || ''} onChange={e=>setForm({...form, appName: e.target.value})}/></div>
                                    <div><label className="text-xs text-slate-500 font-bold block mb-1">URL Logo</label><input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={form.appLogoUrl || ''} onChange={e=>setForm({...form, appLogoUrl: e.target.value})}/></div>
                                    <div><label className="text-xs text-slate-500 font-bold block mb-1">Telefone Loja (WhatsApp)</label><input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={form.storePhone || ''} onChange={e=>setForm({...form, storePhone: e.target.value})}/></div>
                                </div>
                            </section>
                            
                            <section>
                                <h4 className="text-emerald-500 font-bold uppercase text-xs mb-3 border-b border-slate-800 pb-1">Pagamento PIX (Geração de QR Code)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><label className="text-xs text-slate-500 font-bold block mb-1">Chave PIX</label><input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={form.pixKey || ''} onChange={e=>setForm({...form, pixKey: e.target.value})}/></div>
                                    <div><label className="text-xs text-slate-500 font-bold block mb-1">Nome Titular</label><input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={form.pixName || ''} onChange={e=>setForm({...form, pixName: e.target.value})}/></div>
                                    <div><label className="text-xs text-slate-500 font-bold block mb-1">Cidade Titular</label><input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" value={form.pixCity || ''} onChange={e=>setForm({...form, pixCity: e.target.value})}/></div>
                                </div>
                            </section>

                            <section>
                                <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-1">
                                    <h4 className="text-emerald-500 font-bold uppercase text-xs">Taxas de Entrega</h4>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-slate-400 font-bold">Ativar Taxas</label>
                                        <input type="checkbox" checked={form.enableDeliveryFees || false} onChange={e=>setForm({...form, enableDeliveryFees: e.target.checked})}/>
                                    </div>
                                </div>
                                {form.enableDeliveryFees && (
                                    <div className="space-y-2">
                                        {form.deliveryZones?.map((z: any, idx: number) => (
                                            <div key={idx} className="flex gap-2">
                                                <input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm" placeholder="Nome do Bairro" value={z.name} onChange={e=>updateZone(idx, 'name', e.target.value)}/>
                                                <input type="number" className="w-24 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm" placeholder="R$" value={z.fee} onChange={e=>updateZone(idx, 'fee', parseFloat(e.target.value))}/>
                                                <button onClick={() => removeZone(idx)} className="text-red-500 hover:bg-slate-800 p-2 rounded"><Trash2 size={16}/></button>
                                            </div>
                                        ))}
                                        <button onClick={addZone} className="text-xs font-bold text-emerald-500 flex items-center gap-1 hover:text-emerald-400">+ Adicionar Bairro</button>
                                    </div>
                                )}
                            </section>
                         </>
                     ) : (
                         <section>
                             <h4 className="text-emerald-500 font-bold uppercase text-xs mb-4 border-b border-slate-800 pb-1">Horário de Funcionamento</h4>
                             <div className="space-y-3">
                                 {daysOfWeek.map((dayName, idx) => {
                                     const config = form.schedule?.[idx] || { open: '18:00', close: '23:00', enabled: true };
                                     return (
                                         <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${config.enabled ? 'bg-slate-950 border-slate-800' : 'bg-slate-900/50 border-transparent opacity-50'}`}>
                                             <div className="flex items-center gap-2 w-32">
                                                 <input 
                                                     type="checkbox" 
                                                     checked={config.enabled} 
                                                     onChange={(e) => updateSchedule(idx, 'enabled', e.target.checked)}
                                                     className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                                                 />
                                                 <span className={`text-sm font-bold ${config.enabled ? 'text-white' : 'text-slate-500'}`}>{dayName}</span>
                                             </div>
                                             
                                             <div className="flex items-center gap-2 flex-1">
                                                 <input 
                                                     type="time" 
                                                     value={config.open} 
                                                     onChange={(e) => updateSchedule(idx, 'open', e.target.value)}
                                                     disabled={!config.enabled}
                                                     className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
                                                 />
                                                 <span className="text-slate-500 text-xs">até</span>
                                                 <input 
                                                     type="time" 
                                                     value={config.close} 
                                                     onChange={(e) => updateSchedule(idx, 'close', e.target.value)}
                                                     disabled={!config.enabled}
                                                     className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
                                                 />
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         </section>
                     )}
                 </div>
                 <div className="p-6 border-t border-slate-800">
                     <button onClick={() => onSave(form)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">Salvar Configurações</button>
                 </div>
             </div>
        </div>
    )
}

export function ImportModal({ onClose, onImportCSV }: any) {
    const [text, setText] = useState('');
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-slate-900 rounded-xl p-6 w-full max-w-lg border border-slate-800">
                 <h3 className="text-white font-bold text-lg mb-4">Importar CSV</h3>
                 <textarea className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300" placeholder="Cole o conteúdo CSV aqui..." value={text} onChange={e => setText(e.target.value)}></textarea>
                 <div className="flex gap-3 mt-4">
                     <button onClick={() => onImportCSV(text)} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold">Importar</button>
                     <button onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-lg font-bold">Cancelar</button>
                 </div>
             </div>
        </div>
    )
}

export function NewExpenseModal({ onClose, onSave }: any) {
    const [form, setForm] = useState({ description: '', amount: '', category: 'Geral' });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...form, amount: parseFloat(form.amount) });
        onClose();
    };
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-xl p-6 w-full max-w-sm border border-slate-800">
                <h3 className="text-white font-bold text-lg mb-4">Nova Despesa</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input required placeholder="Descrição" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.description} onChange={e=>setForm({...form, description: e.target.value})}/>
                    <input required type="number" step="0.01" placeholder="Valor (R$)" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})}/>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}>
                        <option>Geral</option><option>Insumos</option><option>Pessoal</option><option>Manutenção</option>
                    </select>
                    <button className="w-full bg-red-600 text-white py-3 rounded-xl font-bold mt-2">Lançar Despesa</button>
                    <button type="button" onClick={onClose} className="w-full text-slate-500 py-2">Cancelar</button>
                </form>
            </div>
        </div>
    )
}

export function NewValeModal({ driver, onClose, onSave }: any) {
    const [form, setForm] = useState({ amount: '', description: '' });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ driverId: driver.id, ...form, amount: parseFloat(form.amount) });
        onClose();
    };
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-slate-900 rounded-xl p-6 w-full max-w-sm border border-slate-800">
                 <h3 className="text-white font-bold text-lg mb-4">Lançar Vale para {driver.name}</h3>
                 <form onSubmit={handleSubmit} className="space-y-3">
                     <input required type="number" step="0.01" placeholder="Valor (R$)" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})}/>
                     <input required placeholder="Motivo / Descrição" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.description} onChange={e=>setForm({...form, description: e.target.value})}/>
                     <button className="w-full bg-red-600 text-white py-3 rounded-xl font-bold mt-2">Confirmar Vale</button>
                     <button type="button" onClick={onClose} className="w-full text-slate-500 py-2">Cancelar</button>
                 </form>
             </div>
        </div>
    )
}

export function EditClientModal({ client, onClose, onSave, orders }: any) {
    const [form, setForm] = useState(client);
    const clientOrders = orders.filter((o: Order) => normalizePhone(o.phone) === normalizePhone(client.phone));
    
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-800 flex flex-col max-h-[90vh]">
                 <div className="p-6 border-b border-slate-800 flex justify-between"><h3 className="font-bold text-xl text-white">Editar Cliente</h3><button onClick={onClose}><X className="text-slate-500"/></button></div>
                 <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                         <div><label className="text-xs text-slate-500 font-bold uppercase">Nome</label><input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/></div>
                         <div><label className="text-xs text-slate-500 font-bold uppercase">Telefone</label><input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})}/></div>
                         <div className="md:col-span-2"><label className="text-xs text-slate-500 font-bold uppercase">Endereço</label><input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.address} onChange={e=>setForm({...form, address: e.target.value})}/></div>
                         <div className="md:col-span-2"><label className="text-xs text-slate-500 font-bold uppercase">Observações Internas</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-20" value={form.obs || ''} onChange={e=>setForm({...form, obs: e.target.value})}/></div>
                     </div>
                     <h4 className="font-bold text-white mb-3">Histórico de Pedidos ({clientOrders.length})</h4>
                     <div className="space-y-2">
                         {clientOrders.map((o: Order) => (
                             <div key={o.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between">
                                 <div><p className="text-white text-sm font-bold">{formatDate(o.createdAt)}</p><p className="text-xs text-slate-500">{o.items}</p></div>
                                 <div className="text-right"><p className="text-emerald-500 font-bold">{o.amount}</p><p className="text-[10px] text-slate-600 uppercase">{o.status}</p></div>
                             </div>
                         ))}
                     </div>
                 </div>
                 <div className="p-6 border-t border-slate-800">
                     <button onClick={() => onSave(form)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">Salvar Alterações</button>
                 </div>
            </div>
        </div>
    )
}

export function CloseCycleModal({ data, onClose, onConfirm }: any) {
    const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 16));
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
             <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-800">
                 <h3 className="text-xl font-bold text-white mb-4">Fechar Ciclo Financeiro</h3>
                 <div className="bg-slate-950 p-4 rounded-xl mb-4 border border-slate-800">
                     <div className="flex justify-between mb-2"><span className="text-slate-400">Ganhos Entregas</span><span className="text-white font-bold">{formatCurrency(data.total)}</span></div>
                     <div className="flex justify-between mb-2"><span className="text-slate-400">Vales/Adiantamentos</span><span className="text-red-400 font-bold">- {formatCurrency(data.vales)}</span></div>
                     <div className="border-t border-slate-800 pt-2 flex justify-between mt-2"><span className="text-emerald-500 font-bold text-lg">Líquido a Pagar</span><span className="text-emerald-500 font-bold text-lg">{formatCurrency(data.net)}</span></div>
                 </div>
                 <div className="mb-4">
                     <label className="text-xs text-slate-500 font-bold block mb-1">Data/Hora de Fechamento</label>
                     <input type="datetime-local" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
                 </div>
                 <button onClick={() => onConfirm({ ...data, finalAmount: data.net, endAt: endDate })} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mb-2">Confirmar Pagamento e Fechar</button>
                 <button onClick={onClose} className="w-full text-slate-500 py-2">Cancelar</button>
             </div>
        </div>
    )
}

export function KitchenHistoryModal({ order, onClose, products }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-800 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white text-lg">Detalhes do Pedido</h3><button onClick={onClose}><X size={20} className="text-slate-500"/></button></div>
                <div className="space-y-4">
                    <div><p className="text-xs text-slate-500 uppercase font-bold">Cliente</p><p className="text-white text-lg font-bold">{order.customer}</p></div>
                    <div><p className="text-xs text-slate-500 uppercase font-bold">Itens</p><pre className="text-slate-300 whitespace-pre-wrap font-sans bg-slate-950 p-3 rounded-lg border border-slate-800">{order.items}</pre></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-slate-500 uppercase font-bold">Hora Pedido</p><p className="text-white">{formatTime(order.createdAt)}</p></div>
                        <div><p className="text-xs text-slate-500 uppercase font-bold">Hora Conclusão</p><p className="text-white">{formatTime(order.completedAt)}</p></div>
                    </div>
                </div>
            </div>
        </div>
    )
}