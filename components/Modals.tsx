
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    X, Check, Copy, MessageCircle, Flame, Save, Trash2, 
    Plus, Minus, UploadCloud, DollarSign, Calendar, 
    MapPin, Phone, User, Bike, Store, FileText, 
    AlertTriangle, ShieldCheck, Gift, Trophy, CheckCircle2, 
    AlertCircle, Printer, Share2, Search, Edit, Bell, Clock,
    Image as ImageIcon, Power, Users, List, Link as LinkIcon, Loader2,
    QrCode, ExternalLink, Hash, Sparkles, CreditCard, Truck, CalendarClock, Settings, Sliders,
    ShoppingBag, Instagram, Calculator, TrendingUp, TrendingDown, Box, PieChart, LocateFixed, Shuffle, FlaskConical, Ticket
} from 'lucide-react';
import { 
    Driver, Order, AppConfig, Product, Client, 
    Vale, Expense, GiveawayEntry, ShoppingItem, InventoryItem, ProductIngredient
} from '../types';
import { 
    formatCurrency, copyToClipboard, getProductionMessage, 
    normalizePhone, generateReceiptText, formatDate, 
    formatTime, getDispatchMessage, sendDispatchNotification,
    checkShopStatus, parseOrderItems, compressImage, formatOrderId, formatPhoneNumberDisplay,
    COUNTRY_CODES, printOrderTicket
} from '../utils';

// --- GENERIC MODALS ---

export function GenericAlertModal({ isOpen, title, message, onClose, type = 'info' }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className={`bg-slate-900 rounded-2xl p-6 w-full max-w-sm border-2 ${type === 'error' ? 'border-red-500' : 'border-slate-700'} shadow-2xl relative`}>
                <div className="text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${type === 'error' ? 'bg-red-900/30 text-red-500' : 'bg-slate-800 text-slate-300'}`}>
                        {type === 'error' ? <AlertTriangle size={24}/> : <AlertCircle size={24}/>}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 mb-6">{message}</p>
                    <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors">OK</button>
                </div>
            </div>
        </div>
    );
}

export function GenericConfirmModal({ isOpen, title, message, onConfirm, onClose, type = 'info', confirmText = 'Confirmar' }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl relative">
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700">Cancelar</button>
                    <button onClick={onConfirm} className={`flex-1 font-bold py-3 rounded-xl text-white ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}

// --- ORDER MODALS ---

export function NewOrderModal({ order, onClose, onAccept, onPrint }: any) {
    useEffect(() => {
        // Prevent body scroll?
    }, []);

    if (!order) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in duration-300">
            <div className="bg-slate-900 w-full max-w-md rounded-3xl border-2 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)] p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse"></div>
                
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 text-amber-500 mb-4 ring-4 ring-amber-500/10 animate-bounce">
                        <Bell size={40} fill="currentColor" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Novo Pedido!</h2>
                    <p className="text-slate-400 font-mono text-sm mt-1">#{order.id.startsWith('PED-') ? order.id.slice(-6) : order.id.substring(0,6)} • {formatTime(order.createdAt)}</p>
                </div>

                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mb-6">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white text-lg">{order.customer}</h3>
                        <span className="text-emerald-400 font-black text-lg">{formatCurrency(order.value)}</span>
                    </div>
                    <p className="text-slate-400 text-sm whitespace-pre-wrap font-medium">{order.items}</p>
                    {order.paymentMethod && (
                        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                            <DollarSign size={14}/> {order.paymentMethod}
                        </div>
                    )}
                    {order.address && (
                        <div className="mt-2 text-xs text-slate-400 flex items-start gap-1">
                            <MapPin size={12} className="shrink-0 mt-0.5"/> {order.address}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <button onClick={onAccept} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
                        <CheckCircle2 size={24}/> Aceitar Pedido
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={onPrint} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                            <Printer size={18}/> Imprimir
                        </button>
                        <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold py-3 rounded-xl transition-colors">
                            Ver Depois
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function EditOrderModal({ order, onClose, onSave }: any) {
    const [data, setData] = useState({ ...order });
    const [parsedItems, setParsedItems] = useState<{qty: number, name: string}[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [mode, setMode] = useState<'smart' | 'text'>('smart');

    useEffect(() => {
        if (order.items) {
            setParsedItems(parseOrderItems(order.items));
        }
    }, [order]);

    const syncTextFromItems = (items: {qty: number, name: string}[]) => {
        const text = items.map(i => `${i.qty}x ${i.name}`).join('\n---\n');
        setData((prev: any) => ({ ...prev, items: text }));
    };

    const handleQuantityChange = (index: number, delta: number) => {
        const newItems = [...parsedItems];
        newItems[index].qty += delta;
        if (newItems[index].qty <= 0) {
            newItems.splice(index, 1);
        }
        setParsedItems(newItems);
        syncTextFromItems(newItems);
    };

    const handleAddItem = () => {
        if (!newItemName.trim()) return;
        const newItems = [...parsedItems, { qty: 1, name: newItemName.trim() }];
        setParsedItems(newItems);
        syncTextFromItems(newItems);
        setNewItemName('');
    };

    const handleSave = () => {
        onSave(order.id, data);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-white">Editar Pedido</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Status</label>
                             <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm" value={data.status} onChange={e => setData({...data, status: e.target.value})}>
                                 <option value="pending">Pendente</option>
                                 <option value="preparing">Preparando</option>
                                 <option value="ready">Pronto</option>
                                 <option value="assigned">Em Rota</option>
                                 <option value="completed">Concluído</option>
                                 <option value="cancelled">Cancelado</option>
                             </select>
                         </div>
                         <div>
                             <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Valor (R$)</label>
                             <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm" value={data.value} onChange={e => setData({...data, value: parseFloat(e.target.value)})} />
                         </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Itens do Pedido</label>
                            <div className="flex gap-2">
                                <button onClick={() => setMode('smart')} className={`text-[10px] px-2 py-1 rounded border ${mode==='smart'?'bg-slate-800 text-white border-slate-600':'text-slate-500 border-transparent'}`}>Lista</button>
                                <button onClick={() => setMode('text')} className={`text-[10px] px-2 py-1 rounded border ${mode==='text'?'bg-slate-800 text-white border-slate-600':'text-slate-500 border-transparent'}`}>Texto</button>
                            </div>
                        </div>

                        {mode === 'smart' ? (
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                                {parsedItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded border border-slate-800">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleQuantityChange(idx, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded"><Minus size={12}/></button>
                                            <span className="w-6 text-center font-bold text-white text-sm">{item.qty}</span>
                                            <button onClick={() => handleQuantityChange(idx, 1)} className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-emerald-900/50 text-slate-400 hover:text-emerald-400 rounded"><Plus size={12}/></button>
                                        </div>
                                        <span className="flex-1 text-sm text-slate-200 truncate">{item.name}</span>
                                        <button onClick={() => handleQuantityChange(idx, -999)} className="text-slate-600 hover:text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                                <div className="flex gap-2 pt-2 border-t border-slate-800">
                                    <input 
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" 
                                        placeholder="Adicionar item..." 
                                        value={newItemName}
                                        onChange={e => setNewItemName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                                    />
                                    <button onClick={handleAddItem} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded"><Plus size={16}/></button>
                                </div>
                            </div>
                        ) : (
                            <textarea 
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white h-32 font-mono text-xs leading-relaxed" 
                                value={data.items} 
                                onChange={e => {
                                    setData({...data, items: e.target.value});
                                    setParsedItems(parseOrderItems(e.target.value));
                                }} 
                            />
                        )}
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Cliente & Endereço</label>
                        <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm mb-2" value={data.customer} onChange={e => setData({...data, customer: e.target.value})} placeholder="Nome Cliente" />
                        <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm" value={data.address} onChange={e => setData({...data, address: e.target.value})} placeholder="Endereço" />
                    </div>

                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Observações</label>
                        <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm" value={data.obs || ''} onChange={e => setData({...data, obs: e.target.value})} />
                    </div>

                    <button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-2 flex items-center justify-center gap-2">
                        <Save size={18}/> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- GIVEAWAY RESPONSE MODAL ---
export function GiveawayResponseModal({ entry, onClose, appConfig }: any) {
    const [copied, setCopied] = useState(false);

    if (!entry) return null;

    const responseText = `Olá *${entry.name.split(' ')[0]}*! Tudo bem? 🍔✨\n\n` +
        `🎉 *PARABÉNS! Sua inscrição foi confirmada!* 🎉\n\n` +
        `Você já está concorrendo ao nosso *Combo Casal Clássico*! 🍟🥤\n\n` +
        `✅ *Dados Recebidos:*\n` +
        `📱 WhatsApp: ${entry.phone}\n` +
        `📸 Instagram: ${entry.instagram || 'Não informado'}\n\n` +
        `Agora é só torcer! O resultado sai no nosso Instagram. Boa sorte! 🍀🤞\n\n` +
        `*${appConfig.appName}*`;

    const handleCopy = () => {
        copyToClipboard(responseText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const phone = normalizePhone(entry.phone);
        if(phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(responseText)}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-purple-500/50 p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-purple-500/30 animate-bounce">
                        <Ticket size={32} className="text-purple-400"/>
                    </div>
                    <h3 className="font-bold text-xl text-white">Nova Inscrição!</h3>
                    <p className="text-slate-400 text-xs mt-1">{entry.name}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 h-40 overflow-y-auto custom-scrollbar">
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{responseText}</pre>
                </div>

                <div className="space-y-3">
                    <div className="flex gap-2">
                        <button 
                            onClick={handleCopy}
                            className={`flex-1 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs border ${copied ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'}`}
                        >
                            {copied ? <Check size={16}/> : <Copy size={16}/>}
                            {copied ? 'Copiado!' : 'Copiar Texto'}
                        </button>
                        <button 
                            onClick={handleWhatsApp}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs"
                        >
                            <MessageCircle size={18}/> Abrir WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ReceiptModal({ order, onClose, appConfig }: any) {
    const text = generateReceiptText(order, appConfig.appName, { pixKey: appConfig.pixKey, pixName: appConfig.pixName, pixCity: appConfig.pixCity });
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const phone = normalizePhone(order.phone);
        if(phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, 'whatsapp-session');
    };

    const handlePrint = () => {
        printOrderTicket(order, appConfig);
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-white">Comprovante / Recibo</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 h-64 overflow-y-auto custom-scrollbar">
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{text}</pre>
                </div>
                
                {/* Botão de Impressão Grande */}
                <button onClick={handlePrint} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-3 shadow-lg active:scale-95 transition-all">
                    <Printer size={20}/> Imprimir Cupom / Salvar PDF
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleCopy} className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                        {copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? 'Copiado' : 'Copiar'}
                    </button>
                    <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">
                        <MessageCircle size={18}/> Enviar
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ConfirmCloseOrderModal({ order, onClose, onConfirm }: any) {
    return (
        <GenericConfirmModal 
            isOpen={true}
            title="Concluir Pedido?"
            message={`Deseja marcar o pedido de ${order.customer} como CONCLUÍDO/ENTREGUE?`}
            onConfirm={onConfirm}
            onClose={onClose}
            confirmText="Sim, Concluir"
            type="info"
        />
    );
}

// --- NEW MODALS IMPLEMENTATION ---

export function DispatchSuccessModal({ data, onClose, appName }: any) {
    const { order, driverName } = data;
    const message = getDispatchMessage(order, driverName, appName);
    const handleSend = () => {
        const phone = normalizePhone(order.phone);
        if (phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
        onClose();
    };
    return (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in">
             <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-blue-500/50 p-8 text-center shadow-2xl relative">
                 <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                     <Bike size={40} className="text-blue-400 animate-pulse"/>
                 </div>
                 <h2 className="text-2xl font-black text-white italic uppercase mb-2">Saiu para Entrega!</h2>
                 <p className="text-slate-400 text-sm mb-6">O cliente será avisado que o pedido está a caminho.</p>
                 <button onClick={handleSend} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mb-3">
                     <MessageCircle size={20}/> Avisar no WhatsApp
                 </button>
                 <button onClick={onClose} className="text-slate-500 text-sm hover:text-white">Fechar</button>
             </div>
        </div>
    )
}

export function ProductionSuccessModal({ order, onClose, appName }: any) {
    const message = getProductionMessage(order, appName);
    const handleSend = () => {
        const phone = normalizePhone(order.phone);
        if (phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
        onClose();
    };
    return (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in">
             <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-orange-500/50 p-8 text-center shadow-2xl relative">
                 <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
                     <Flame size={40} className="text-orange-500 animate-pulse"/>
                 </div>
                 <h2 className="text-2xl font-black text-white italic uppercase mb-2">Em Preparo!</h2>
                 <p className="text-slate-400 text-sm mb-6">Pedido aceito e enviado para cozinha.</p>
                 <button onClick={handleSend} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mb-3">
                     <MessageCircle size={20}/> Avisar Cliente
                 </button>
                 <button onClick={onClose} className="text-slate-500 text-sm hover:text-white">Fechar</button>
             </div>
        </div>
    )
}

export function ProductFormModal({ isOpen, onClose, product, onSave, existingCategories, inventory }: any) {
    const [form, setForm] = useState(product || { name: '', category: 'Hambúrgueres', price: 0, description: '', ingredients: [], costPrice: 0, operationalCost: 0 });
    
    // Ingredients Logic
    const [selectedInventoryId, setSelectedInventoryId] = useState('');
    const [ingredientQty, setIngredientQty] = useState('');

    const addIngredient = () => {
        if(!selectedInventoryId || !ingredientQty) return;
        const invItem = inventory.find((i:any) => i.id === selectedInventoryId);
        if(!invItem) return;
        
        const newIngredients = [...(form.ingredients || []), { inventoryId: selectedInventoryId, qty: parseFloat(ingredientQty) }];
        setForm({...form, ingredients: newIngredients});
        setSelectedInventoryId('');
        setIngredientQty('');
    };

    const removeIngredient = (index: number) => {
        const newIngredients = [...(form.ingredients || [])];
        newIngredients.splice(index, 1);
        setForm({...form, ingredients: newIngredients});
    };

    // Calculate estimated cost
    const calculatedCost = useMemo(() => {
        let total = 0;
        if(form.ingredients && inventory) {
            form.ingredients.forEach((ing: any) => {
                const item = inventory.find((i:any) => i.id === ing.inventoryId);
                if(item) {
                    total += (item.cost || 0) * ing.qty;
                }
            });
        }
        return total;
    }, [form.ingredients, inventory]);

    useEffect(() => {
        setForm((f: any) => ({...f, costPrice: calculatedCost}));
    }, [calculatedCost]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">{product ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nome</label>
                            <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Preço Venda (R$)</label>
                            <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Categoria</label>
                        <div className="flex gap-2">
                             <select className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                                 {existingCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                             </select>
                             <input className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" placeholder="Nova Categoria..." onChange={e => e.target.value && setForm({...form, category: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Descrição</label>
                        <textarea className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white h-20" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <h4 className="font-bold text-white mb-3 text-sm flex items-center gap-2"><FlaskConical size={16} className="text-purple-500"/> Ficha Técnica (Custo)</h4>
                        
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3">
                            <div className="flex gap-2 mb-2">
                                <select className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={selectedInventoryId} onChange={e => setSelectedInventoryId(e.target.value)}>
                                    <option value="">Selecionar Insumo...</option>
                                    {inventory?.map((i: any) => <option key={i.id} value={i.id}>{i.name} ({formatCurrency(i.cost)}/{i.unit})</option>)}
                                </select>
                                <input type="number" placeholder="Qtd" className="w-20 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={ingredientQty} onChange={e => setIngredientQty(e.target.value)} />
                                <button onClick={addIngredient} className="bg-purple-600 text-white p-2 rounded hover:bg-purple-500"><Plus size={16}/></button>
                            </div>
                            
                            <div className="space-y-1">
                                {(form.ingredients || []).map((ing: any, idx: number) => {
                                    const item = inventory?.find((i:any) => i.id === ing.inventoryId);
                                    return (
                                        <div key={idx} className="flex justify-between items-center text-xs bg-slate-900 p-2 rounded border border-slate-800">
                                            <span>{item?.name || 'Item Removido'} ({ing.qty} {item?.unit})</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">{formatCurrency((item?.cost||0) * ing.qty)}</span>
                                                <button onClick={() => removeIngredient(idx)} className="text-red-500"><Trash2 size={12}/></button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm mb-2">
                             <span className="text-slate-500">Custo Ingredientes:</span>
                             <span className="text-white font-bold">{formatCurrency(calculatedCost)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mb-4">
                             <span className="text-slate-500">Custo Operacional (Emb/Gás):</span>
                             <input type="number" className="w-24 bg-slate-950 border border-slate-700 rounded p-1 text-right text-white" value={form.operationalCost || 0} onChange={e => setForm({...form, operationalCost: parseFloat(e.target.value)})} />
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                             <span className="text-slate-300 font-bold">Lucro Estimado:</span>
                             <span className={`font-bold ${form.price - (calculatedCost + (form.operationalCost||0)) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                 {formatCurrency(form.price - (calculatedCost + (form.operationalCost||0)))}
                             </span>
                        </div>
                    </div>

                    <button onClick={() => onSave(product?.id, form)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl mt-4">Salvar Produto</button>
                </div>
            </div>
        </div>
    );
}

export function GiveawayManagerModal({ entries, onClose }: any) {
    const [winner, setWinner] = useState<any>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [search, setSearch] = useState('');

    const filteredEntries = entries.filter((e: any) => 
        e.name.toLowerCase().includes(search.toLowerCase()) || 
        e.phone.includes(search) ||
        (e.instagram && e.instagram.toLowerCase().includes(search.toLowerCase()))
    );

    const pickWinner = () => {
        if(entries.length === 0) return;
        setIsAnimating(true);
        setWinner(null);
        
        let counter = 0;
        const interval = setInterval(() => {
            const random = entries[Math.floor(Math.random() * entries.length)];
            setWinner(random);
            counter++;
            if(counter > 20) {
                clearInterval(interval);
                setIsAnimating(false);
            }
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in">
             <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-purple-500/50 p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                 
                 <div className="text-center mb-6 shrink-0">
                     <Trophy size={48} className={`mx-auto mb-2 text-amber-400 ${isAnimating ? 'animate-bounce' : ''}`}/>
                     <h2 className="text-2xl font-black text-white uppercase italic">Sorteio Oficial</h2>
                 </div>

                 {/* ÁREA DO SORTEIO */}
                 <div className="mb-6 shrink-0">
                     {winner ? (
                         <div className={`bg-purple-900/20 border border-purple-500/50 p-4 rounded-2xl mb-4 text-center ${isAnimating ? 'opacity-50' : 'animate-in zoom-in'}`}>
                             <p className="text-purple-300 text-xs font-bold uppercase mb-1">Vencedor(a)</p>
                             <h3 className="text-2xl font-black text-white mb-1">{winner.name}</h3>
                             <p className="text-slate-400 font-mono text-sm">{normalizePhone(winner.phone)}</p>
                             {winner.instagram && (
                                 <a 
                                    href={`https://instagram.com/${winner.instagram.replace('@','')}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-500/30 transition-colors"
                                 >
                                     <Instagram size={12}/> {winner.instagram}
                                 </a>
                             )}
                         </div>
                     ) : (
                         <div className="p-6 mb-4 text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl text-center">
                             <Shuffle size={24} className="mx-auto mb-2 opacity-50"/>
                             <p className="text-sm">Clique para sortear entre {entries.length} participantes</p>
                         </div>
                     )}

                     <button onClick={pickWinner} disabled={isAnimating || entries.length === 0} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg uppercase tracking-wide text-sm">
                         {isAnimating ? 'Sorteando...' : 'Sortear Agora'}
                     </button>
                 </div>

                 {/* LISTA DE PARTICIPANTES */}
                 <div className="flex-1 flex flex-col border-t border-slate-800 pt-4 overflow-hidden">
                     <div className="flex justify-between items-center mb-3 shrink-0">
                         <h4 className="font-bold text-white text-sm flex items-center gap-2"><Users size={16}/> Participantes ({entries.length})</h4>
                         <div className="relative">
                             <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"/>
                             <input 
                                 className="bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-2 py-1.5 text-xs text-white outline-none focus:border-purple-500 w-32"
                                 placeholder="Buscar..."
                                 value={search}
                                 onChange={e => setSearch(e.target.value)}
                             />
                         </div>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 rounded-xl border border-slate-800 p-2 space-y-1">
                         {filteredEntries.length === 0 ? (
                             <p className="text-center text-slate-600 text-xs py-4">Nenhum participante encontrado.</p>
                         ) : (
                             filteredEntries.map((entry: any, i: number) => (
                                 <div key={i} className="flex justify-between items-center p-2 hover:bg-slate-900 rounded border border-transparent hover:border-slate-800 transition-colors">
                                     <div>
                                         <p className="text-xs font-bold text-white">{entry.name}</p>
                                         <p className="text-[10px] text-slate-500 font-mono">{normalizePhone(entry.phone)}</p>
                                     </div>
                                     <div className="text-right">
                                         {entry.instagram && <span className="text-[10px] text-purple-400 font-bold block mb-0.5">{entry.instagram}</span>}
                                         <span className="text-[9px] text-slate-600">{formatDate(entry.createdAt)}</span>
                                     </div>
                                 </div>
                             ))
                         )}
                     </div>
                 </div>
             </div>
        </div>
    )
}

export function NewDriverModal({ initialData, onSave, onClose }: any) {
    const [form, setForm] = useState(initialData || { name: '', phone: '', plate: '', vehicle: 'Moto', status: 'offline', avatar: '' });

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-white">{initialData ? 'Editar' : 'Novo'} Motoboy</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="space-y-4">
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" placeholder="Placa" value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} />
                        <select className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})}>
                            <option value="Moto">Moto</option>
                            <option value="Carro">Carro</option>
                            <option value="Bike">Bike</option>
                        </select>
                    </div>
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" placeholder="URL Avatar (Opcional)" value={form.avatar} onChange={e => setForm({...form, avatar: e.target.value})} />
                    
                    <button onClick={() => { onSave(form); onClose(); }} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Salvar</button>
                </div>
            </div>
        </div>
    )
}

export function CloseCycleModal({ data, onConfirm, onClose }: any) {
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 p-6 shadow-2xl">
                <h3 className="font-bold text-xl text-white mb-4">Fechar Ciclo / Pagamento</h3>
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
                    <div className="flex justify-between"><span className="text-slate-500">Entregas ({data.deliveriesCount}):</span> <span className="text-white font-bold">{formatCurrency(data.deliveriesTotal)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Vales:</span> <span className="text-red-400 font-bold">-{formatCurrency(data.valesTotal)}</span></div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between text-lg"><span className="text-white font-bold">A Pagar:</span> <span className="text-emerald-400 font-black">{formatCurrency(data.finalAmount)}</span></div>
                </div>
                <button onClick={() => onConfirm(data)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl mb-2">Confirmar Pagamento</button>
                <button onClick={onClose} className="w-full text-slate-500 py-2">Cancelar</button>
            </div>
        </div>
    )
}

export function ImportModal({ onImportCSV, onClose }: any) {
    const [text, setText] = useState('');
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 p-6 shadow-2xl">
                <h3 className="font-bold text-xl text-white mb-4">Importar CSV</h3>
                <textarea className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 mb-4" placeholder="Cole o conteúdo do CSV aqui..." value={text} onChange={e => setText(e.target.value)} />
                <button onClick={() => onImportCSV(text)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mb-2">Processar Importação</button>
                <button onClick={onClose} className="w-full text-slate-500 py-2">Cancelar</button>
            </div>
        </div>
    )
}

export function EditClientModal({ client, orders, onSave, onClose, onUpdateOrder }: any) {
    const [form, setForm] = useState({ ...client });
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-white">Editar Cliente</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="space-y-4">
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome" />
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Telefone" />
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Endereço" />
                    <textarea className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white h-20" value={form.obs || ''} onChange={e => setForm({...form, obs: e.target.value})} placeholder="Obs (ex: Cliente VIP, chato, etc)" />
                    <button onClick={() => onSave(form)} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Salvar</button>
                </div>
            </div>
        </div>
    )
}

export function NewValeModal({ driver, onClose, onSave }: any) {
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 p-6 shadow-2xl">
                <h3 className="font-bold text-xl text-white mb-4">Novo Vale para {driver.name}</h3>
                <div className="space-y-4">
                    <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" placeholder="Valor (R$)" value={amount} onChange={e => setAmount(e.target.value)} />
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" placeholder="Descrição (ex: Gasolina)" value={desc} onChange={e => setDesc(e.target.value)} />
                    <button onClick={() => { onSave({ driverId: driver.id, amount: parseFloat(amount), description: desc }); onClose(); }} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Confirmar</button>
                    <button onClick={onClose} className="w-full text-slate-500 py-2">Cancelar</button>
                </div>
            </div>
        </div>
    )
}

export function NewExpenseModal({ onClose, onSave }: any) {
    const [form, setForm] = useState({ description: '', amount: '', category: 'Loja' });
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 p-6 shadow-2xl">
                <h3 className="font-bold text-xl text-white mb-4">Nova Despesa</h3>
                <div className="space-y-4">
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" placeholder="Valor (R$)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                    <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                        <option value="Loja">Loja</option>
                        <option value="Pessoal">Pessoal</option>
                        <option value="Insumos">Insumos</option>
                    </select>
                    <button onClick={() => onSave({ ...form, amount: parseFloat(form.amount) })} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl">Lançar Despesa</button>
                    <button onClick={onClose} className="w-full text-slate-500 py-2">Cancelar</button>
                </div>
            </div>
        </div>
    )
}

export function KitchenHistoryModal({ order, onClose, products, totalClientOrders }: any) {
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
             <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                 <h3 className="font-bold text-xl text-white mb-1">Detalhes do Pedido</h3>
                 <p className="text-slate-500 text-sm mb-4">#{formatOrderId(order.id)} • {formatTime(order.createdAt)}</p>
                 
                 <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-white font-bold">{order.customer}</span>
                         <span className="text-emerald-400 font-bold">{formatCurrency(order.value)}</span>
                     </div>
                     <p className="text-slate-400 text-sm whitespace-pre-wrap">{order.items}</p>
                     {totalClientOrders > 1 && (
                         <div className="mt-3 pt-2 border-t border-slate-800 text-xs text-amber-500 font-bold">
                             Este cliente já fez {totalClientOrders} pedidos!
                         </div>
                     )}
                 </div>
                 
                 <div className="text-center text-xs text-slate-500">
                     Status atual: <span className="text-white uppercase font-bold">{order.status}</span>
                 </div>
             </div>
        </div>
    )
}

// --- SETTINGS MODAL UPDATED (WIDER & RESPONSIVE) ---

export function SettingsModal({ config, onSave, onClose }: any) {
    const [form, setForm] = useState<AppConfig>({ 
        storeCountryCode: '+55', 
        printerWidth: '80mm',
        location: { lat: 0, lng: 0 },
        ...config 
    });
    
    const [latInput, setLatInput] = useState(config.location?.lat?.toString() || '');
    const [lngInput, setLngInput] = useState(config.location?.lng?.toString() || '');

    const [tab, setTab] = useState('general');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => { onSave(form); onClose(); };

    const updateSchedule = (day: number, field: string, value: any) => {
        const newSchedule = { ...(form.schedule || {}) };
        if (!newSchedule[day]) newSchedule[day] = { enabled: false, open: '18:00', close: '23:00' };
        newSchedule[day] = { ...newSchedule[day], [field]: value };
        setForm({ ...form, schedule: newSchedule });
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await compressImage(file);
                setForm(prev => ({ ...prev, appLogoUrl: base64 }));
            } catch (err) {
                console.error("Erro ao processar imagem", err);
                alert("Erro ao carregar imagem.");
            }
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await compressImage(file);
                setForm(prev => ({ ...prev, bannerUrl: base64 }));
            } catch (err) {
                console.error("Erro ao processar imagem do banner", err);
                alert("Erro ao carregar imagem.");
            }
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumberDisplay(e.target.value);
        setForm({ ...form, storePhone: formatted });
    };

    const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLatInput(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setForm(prev => ({...prev, location: { ...prev.location, lat: num, lng: prev.location?.lng || 0 }}));
        }
    };

    const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLngInput(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setForm(prev => ({...prev, location: { ...prev.location, lat: prev.location?.lat || 0, lng: num }}));
        }
    };

    const TABS = [
        { id: 'general', label: 'Geral', icon: <Store size={16}/> },
        { id: 'payment', label: 'Pagamento', icon: <CreditCard size={16}/> },
        { id: 'delivery', label: 'Entrega', icon: <Truck size={16}/> },
        { id: 'schedule', label: 'Horários', icon: <CalendarClock size={16}/> },
        { id: 'location', label: 'Localização', icon: <MapPin size={16}/> }, 
        { id: 'system', label: 'Sistema', icon: <Sliders size={16}/> },
    ];

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            {/* WIDER CONTAINER (max-w-6xl) and TALLER (h-[85vh]) */}
            <div className="bg-slate-900 w-full max-w-6xl h-[85vh] min-h-[600px] rounded-3xl border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden">
                
                {/* Header Fixo */}
                <div className="p-6 pb-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10 shrink-0">
                    <h3 className="font-bold text-2xl text-white flex items-center gap-2">
                        <Settings className="text-slate-500"/> Configurações
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
                </div>

                {/* Tabs Navigation (Segmented Control Style) */}
                <div className="px-6 py-2 bg-slate-900 shrink-0 overflow-x-auto border-b border-slate-800/50">
                    <div className="flex gap-2 min-w-max pb-2">
                        {TABS.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setTab(t.id)} 
                                className={`px-4 py-2.5 text-xs font-bold rounded-xl uppercase flex items-center justify-center gap-2 transition-all duration-300 border ${tab === t.id ? 'bg-slate-800 text-white shadow-md border-slate-700' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                            >
                                {t.icon} <span className="hidden sm:inline">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-900">
                    {tab === 'general' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Nome da Loja</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-amber-500 outline-none transition-colors" value={form.appName} onChange={e => setForm({...form, appName: e.target.value})} placeholder="Ex: Jhans Burgers" />
                                </div>
                                
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">WhatsApp da Loja</label>
                                    <div className="flex gap-2">
                                        <select 
                                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-4 text-white outline-none focus:border-amber-500 transition-colors w-32 text-sm font-bold appearance-none text-center"
                                            value={form.storeCountryCode || '+55'}
                                            onChange={e => setForm({...form, storeCountryCode: e.target.value})}
                                        >
                                            {COUNTRY_CODES.map((country) => (
                                                <option key={country.country} value={country.code}>
                                                    {country.country} ({country.code})
                                                </option>
                                            ))}
                                        </select>
                                        <input 
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-amber-500 outline-none transition-colors" 
                                            value={form.storePhone || ''} 
                                            onChange={handlePhoneChange}
                                            placeholder="(92) 99190-3278" 
                                            maxLength={15}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1 ml-1">Formato: (DDD) 9XXXX-XXXX</p>
                                </div>
                            </div>
                            
                            {/* LOGO & BANNER UPLOAD */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Logotipo</label>
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-40 bg-slate-950 rounded-xl border-2 border-dashed border-slate-800 flex items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-slate-900 transition-colors overflow-hidden group relative"
                                    >
                                        {form.appLogoUrl ? (
                                            <>
                                                <img src={form.appLogoUrl} className="w-full h-full object-contain p-4"/>
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Edit size={24} className="text-white"/>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <UploadCloud size={32} className="text-slate-600 mx-auto mb-2"/>
                                                <span className="text-xs text-slate-500 font-bold uppercase">Clique para Upload</span>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Banner Promocional</label>
                                    <div 
                                        onClick={() => bannerInputRef.current?.click()}
                                        className="w-full h-40 bg-slate-950 rounded-xl border-2 border-dashed border-slate-800 flex items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-slate-900 transition-colors overflow-hidden group relative"
                                    >
                                        {form.bannerUrl ? (
                                            <>
                                                <img src={form.bannerUrl} className="w-full h-full object-cover"/>
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Edit size={24} className="text-white"/>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <ImageIcon size={32} className="text-slate-600 mx-auto mb-2"/>
                                                <span className="text-xs text-slate-500 font-bold uppercase">Clique para Upload</span>
                                            </div>
                                        )}
                                        <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={handleBannerUpload} />
                                    </div>
                                    <button onClick={() => setForm({...form, bannerUrl: ''})} className="text-xs text-red-500 font-bold hover:underline mt-2">Remover Banner</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'payment' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-emerald-900/10 border border-emerald-900/50 p-6 rounded-2xl flex items-center gap-4">
                                <div className="bg-emerald-500 p-3 rounded-xl text-white"><QrCode size={32}/></div>
                                <div>
                                    <h4 className="text-emerald-400 font-bold text-lg">Configuração PIX</h4>
                                    <p className="text-sm text-emerald-500/70">Estes dados aparecerão no QR Code gerado para o cliente.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2"><label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Chave PIX</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500 outline-none" value={form.pixKey || ''} onChange={e => setForm({...form,pixKey: e.target.value})} placeholder="CPF, CNPJ, Email ou Aleatória" /></div>
                                <div><label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Nome Titular</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500 outline-none" value={form.pixName || ''} onChange={e => setForm({...form,pixName: e.target.value})} placeholder="Nome completo" /></div>
                                <div><label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Cidade Titular</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500 outline-none" value={form.pixCity || ''} onChange={e => setForm({...form,pixCity: e.target.value})} placeholder="Cidade da conta" /></div>
                            </div>
                        </div>
                    )}

                    {tab === 'delivery' && (
                         <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                <div>
                                    <span className="text-white font-bold text-lg block">Taxas por Bairro</span>
                                    <span className="text-slate-500 text-sm">Ativar cobrança de taxa de entrega baseada em zonas.</span>
                                </div>
                                <div className="relative inline-block w-14 h-8 transition duration-200 ease-in-out rounded-full cursor-pointer">
                                    <input type="checkbox" id="toggle-delivery" className="absolute w-0 h-0 opacity-0" checked={form.enableDeliveryFees || false} onChange={e => setForm({...form, enableDeliveryFees: e.target.checked})} />
                                    <label htmlFor="toggle-delivery" className={`block overflow-hidden h-8 rounded-full cursor-pointer border ${form.enableDeliveryFees ? 'bg-emerald-600 border-emerald-600' : 'bg-slate-800 border-slate-700'}`}></label>
                                    <span className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ${form.enableDeliveryFees ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Pedido Mínimo (R$)</label>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-amber-500 outline-none" value={form.minOrderValue || ''} onChange={e => setForm({...form, minOrderValue: parseFloat(e.target.value)})} placeholder="Ex: 20.00" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Tempo Estimado</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-amber-500 outline-none" value={form.estimatedTime || ''} onChange={e => setForm({...form, estimatedTime: e.target.value})} placeholder="Ex: 40-50 min" />
                                </div>
                            </div>
                            
                            {form.enableDeliveryFees && (
                                <div className="space-y-4 pt-4 border-t border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-slate-400 font-bold uppercase">Zonas de Entrega Cadastradas</p>
                                        <button onClick={() => setForm({...form, deliveryZones: [...(form.deliveryZones || []), { name: '', fee: 0 }]})} className="bg-slate-800 hover:bg-white hover:text-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"><Plus size={16}/> Adicionar Bairro</button>
                                    </div>
                                    
                                    {(form.deliveryZones || []).length === 0 && <p className="text-slate-600 text-sm text-center py-8 bg-slate-950 rounded-xl border border-dashed border-slate-800">Nenhum bairro cadastrado.</p>}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(form.deliveryZones || []).map((zone, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-slate-950 p-2 rounded-xl border border-slate-800">
                                                <input className="flex-1 bg-transparent border-none p-2 text-white text-sm focus:ring-0 outline-none" placeholder="Nome do Bairro" value={zone.name} onChange={e => { const newZones = [...(form.deliveryZones || [])]; newZones[idx].name = e.target.value; setForm({...form, deliveryZones: newZones}); }} />
                                                <div className="w-px h-6 bg-slate-800"></div>
                                                <span className="text-slate-500 text-xs font-bold pl-2">R$</span>
                                                <input type="number" className="w-16 bg-transparent border-none p-2 text-white text-sm focus:ring-0 outline-none" placeholder="0.00" value={zone.fee} onChange={e => { const newZones = [...(form.deliveryZones || [])]; newZones[idx].fee = parseFloat(e.target.value); setForm({...form, deliveryZones: newZones}); }} />
                                                <button onClick={() => { const newZones = (form.deliveryZones || []).filter((_, i) => i !== idx); setForm({...form, deliveryZones: newZones}); }} className="p-2 text-slate-500 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                         </div>
                    )}

                    {tab === 'schedule' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day, idx) => {
                                    const dayConfig = form.schedule?.[idx] || { enabled: false, open: '18:00', close: '23:00' };
                                    return (
                                        <div key={idx} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${dayConfig.enabled ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-transparent opacity-50'}`}>
                                            <div className="w-24 text-sm font-bold text-white">{day}</div>
                                            <input type="checkbox" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" checked={dayConfig.enabled} onChange={e => updateSchedule(idx, 'enabled', e.target.checked)} />
                                            <div className="flex-1 flex items-center gap-2 justify-end">
                                                <input type="time" className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm font-mono outline-none focus:border-emerald-500" value={dayConfig.open} onChange={e => updateSchedule(idx, 'open', e.target.value)} disabled={!dayConfig.enabled} />
                                                <span className="text-slate-500 font-bold">-</span>
                                                <input type="time" className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm font-mono outline-none focus:border-emerald-500" value={dayConfig.close} onChange={e => updateSchedule(idx, 'close', e.target.value)} disabled={!dayConfig.enabled} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {tab === 'location' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                                <h4 className="font-bold text-white mb-2 text-lg flex items-center gap-2"><MapPin size={20} className="text-red-500"/> Localização da Loja</h4>
                                <p className="text-sm text-slate-500 mb-6">Defina as coordenadas exatas da sua loja para o mapa e link de entrega.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Latitude</label>
                                        <input 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500" 
                                            value={latInput} 
                                            onChange={handleLatChange} 
                                            placeholder="-23.000000"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Longitude</label>
                                        <input 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500" 
                                            value={lngInput} 
                                            onChange={handleLngChange} 
                                            placeholder="-46.000000"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-slate-800 pt-6">
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Link do Google Maps</label>
                                    <div className="flex gap-2">
                                        <input className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500" value={form.storeMapsLink || ''} onChange={e => setForm({...form, storeMapsLink: e.target.value})} placeholder="https://maps.google.com/..." />
                                        {form.storeMapsLink && (
                                            <a href={form.storeMapsLink} target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors">
                                                <ExternalLink size={20}/>
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2">Este link será enviado aos clientes quando solicitarem a localização.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'system' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* IMPRESSÃO */}
                                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                                    <h4 className="font-bold text-white mb-4 text-base flex items-center gap-2"><Printer size={18}/> Impressão</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setForm({...form, printerWidth: '58mm'})}
                                            className={`py-4 rounded-xl text-sm font-bold border transition-all ${form.printerWidth === '58mm' ? 'bg-blue-900/30 text-blue-400 border-blue-500/50' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                        >
                                            58mm (Pequena)
                                        </button>
                                        <button 
                                            onClick={() => setForm({...form, printerWidth: '80mm'})}
                                            className={`py-4 rounded-xl text-sm font-bold border transition-all ${form.printerWidth === '80mm' ? 'bg-blue-900/30 text-blue-400 border-blue-500/50' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                        >
                                            80mm (Padrão)
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                                    <h4 className="font-bold text-white mb-4 text-base flex items-center gap-2"><DollarSign size={18}/> Taxas Extras</h4>
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Taxa de Embalagem (R$)</label>
                                        <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:border-amber-500 outline-none" value={form.packagingFee || ''} onChange={e => setForm({...form, packagingFee: parseFloat(e.target.value)})} placeholder="Ex: 2.00" />
                                        <p className="text-[10px] text-slate-500 mt-2">Cobrado uma vez por pedido para cobrir descartáveis.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions (Fixed) */}
                <div className="p-6 border-t border-slate-800 bg-slate-900 mt-auto z-10 shrink-0">
                    <button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-lg">
                        <Save size={24}/> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
}
