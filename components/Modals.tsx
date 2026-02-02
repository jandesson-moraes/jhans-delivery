
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    X, Check, Copy, MessageCircle, Flame, Save, Trash2, 
    Plus, Minus, UploadCloud, DollarSign, Calendar, 
    MapPin, Phone, User, Bike, Store, FileText, 
    AlertTriangle, ShieldCheck, Gift, Trophy, CheckCircle2, 
    AlertCircle, Printer, Share2, Search, Edit, Bell, Clock,
    Image as ImageIcon, Power, Users, List, Link as LinkIcon, Loader2,
    QrCode, ExternalLink, Hash, Sparkles, CreditCard, Truck, CalendarClock, Settings, Sliders,
    ShoppingBag, Instagram, Calculator, TrendingUp, TrendingDown, Box
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
// ... (NewOrderModal, EditOrderModal, ReceiptModal, ConfirmCloseOrderModal, DispatchSuccessModal, ProductionSuccessModal, KitchenHistoryModal) remain unchanged ...
// To save space, I'm keeping the implementation of these modals as they were in the previous version, 
// ensuring I only modify ProductFormModal significantly.

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

// ... Skipping intermediate modals to focus on ProductFormModal ...
export function EditOrderModal({ order, onClose, onSave }: any) {
    // ... implementation same as before ...
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

// ... skipping ReceiptModal, ConfirmCloseOrderModal, DispatchSuccessModal, ProductionSuccessModal, KitchenHistoryModal, NewDriverModal, NewValeModal, CloseCycleModal ...
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

export function DispatchSuccessModal({ data, onClose, appName }: any) {
    const [copied, setCopied] = useState(false);
    const { order, driverName } = data;
    
    // Gera a mensagem para copiar
    const message = getDispatchMessage(order, driverName, appName);

    const handleCopy = () => {
        copyToClipboard(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSend = () => {
         sendDispatchNotification(order, driverName, appName);
         // Opcional: onClose() se quiser fechar ao clicar
    };

    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in duration-300">
            <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-emerald-500/30 p-0 shadow-2xl relative overflow-hidden flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-10 p-2 bg-black/20 rounded-full"><X size={20}/></button>
                
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 pt-8 text-center relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 text-emerald-600 shadow-xl ring-4 ring-white/20 animate-bounce">
                        <Bike size={32} fill="currentColor"/>
                    </div>
                    <h3 className="font-black text-2xl text-white uppercase tracking-wider mb-1">Saiu para Entrega!</h3>
                    <p className="text-emerald-100 text-sm font-medium">Motoboy atribuído com sucesso.</p>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar max-h-[60vh]">
                    {/* Motoboy Info */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Responsável pela Entrega</p>
                            <p className="text-lg font-black text-white flex items-center gap-2"><User size={18} className="text-emerald-500"/> {driverName}</p>
                        </div>
                        <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 text-slate-500">
                            <Bike size={20}/>
                        </div>
                    </div>

                    {/* Dados do Cliente */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="bg-slate-800 p-2.5 rounded-xl text-amber-500 shrink-0"><User size={20}/></div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Cliente</p>
                                <p className="font-bold text-white text-base">{order.customer}</p>
                                <p className="text-xs text-slate-400 font-mono">{normalizePhone(order.phone)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-slate-800 p-2.5 rounded-xl text-blue-500 shrink-0"><MapPin size={20}/></div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Endereço</p>
                                <p className="font-medium text-slate-300 text-sm leading-snug">{order.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Resumo Pedido */}
                    <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-2 flex items-center gap-2"><List size={12}/> Resumo do Pedido #{formatOrderId(order.id)}</p>
                        <div className="space-y-1 mb-3">
                            {order.items.split('\n').filter((l: string) => l.trim() && !l.includes('---')).slice(0, 3).map((item: string, i: number) => (
                                <p key={i} className="text-xs text-slate-300 truncate">• {item}</p>
                            ))}
                            {order.items.split('\n').filter((l: string) => l.trim() && !l.includes('---')).length > 3 && <p className="text-[10px] text-slate-500 italic">+ outros itens...</p>}
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                            <span className="text-xs text-slate-400 font-bold">{order.paymentMethod}</span>
                            <span className="text-emerald-400 font-black text-lg">{formatCurrency(order.value)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 mt-auto bg-slate-900 border-t border-slate-800/50">
                    <button onClick={handleSend} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mb-3 text-sm uppercase tracking-wide">
                        <MessageCircle size={20}/> Avisar Cliente no WhatsApp
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleCopy} className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase transition-all border ${copied ? 'bg-slate-800 text-emerald-400 border-emerald-500/50' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'}`}>
                            {copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Copiado!' : 'Copiar Texto'}
                        </button>
                        <button onClick={onClose} className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-bold py-3 rounded-xl transition-colors text-xs uppercase">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ProductionSuccessModal({ order, onClose, appName }: any) {
    const [copied, setCopied] = useState(false);
    
    useEffect(() => { const timer = setTimeout(onClose, 5000); return () => clearTimeout(timer); }, [onClose]);
    
    const handleSendProductionMessage = () => { 
        const text = getProductionMessage(order, appName); 
        const phone = normalizePhone(order.phone);
        if(phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, 'whatsapp-session'); 
    };
    
    const handleCopyMessage = () => {
        const text = getProductionMessage(order, appName);
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none pb-10 px-4">
            <div className="bg-orange-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-auto animate-in slide-in-from-bottom-10 max-w-sm w-full border-2 border-orange-400">
                <div className="bg-white/20 p-3 rounded-full animate-pulse"><Flame size={24} /></div>
                <div className="flex-1">
                    <h3 className="font-black text-lg leading-none mb-1">Preparo Iniciado!</h3>
                    <p className="text-xs font-medium text-orange-100">Notificar cliente?</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCopyMessage} className="bg-white text-orange-600 p-2 rounded-lg font-bold hover:bg-orange-100 transition-colors" title="Copiar Texto">
                        {copied ? <Check size={20}/> : <Copy size={20}/>}
                    </button>
                    <button onClick={handleSendProductionMessage} className="bg-white text-orange-600 p-2 rounded-lg font-bold hover:bg-orange-100 transition-colors" title="Enviar Whats">
                        <MessageCircle size={20}/>
                    </button>
                </div>
            </div>
        </div>
    );
}

export function KitchenHistoryModal({ order, onClose, products, totalClientOrders }: any) {
    // Para o modal de histórico, também vamos permitir copiar os detalhes
    const [copied, setCopied] = useState(false);
    
    const copyOrderDetails = () => {
        const text = `PEDIDO #${formatOrderId(order.id)}\nCliente: ${order.customer}\nTel: ${order.phone}\nEnd: ${order.address}\n\nITENS:\n${order.items}\n\nTotal: ${formatCurrency(order.value)}\nPagamento: ${order.paymentMethod}`;
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in duration-200">
             <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                 {/* Header */}
                 <div className="bg-slate-950 p-5 border-b border-slate-800 flex justify-between items-start">
                     <div className="flex items-center gap-4">
                         <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-slate-700">
                             <User size={24}/>
                         </div>
                         <div>
                             <h3 className="font-black text-xl text-white leading-none mb-1">{order.customer}</h3>
                             <div className="flex items-center gap-2 text-xs">
                                 <span className="bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-bold">{totalClientOrders}º Pedido</span>
                                 <span className="text-slate-500">• {formatTime(order.createdAt)}</span>
                             </div>
                         </div>
                     </div>
                     <button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                 </div>

                 {/* Content */}
                 <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900">
                     {/* Infos Cliente */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                             <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-1"><Phone size={10}/> Contato</p>
                             <p className="text-sm font-bold text-white">{order.phone}</p>
                         </div>
                         <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                             <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-1"><MapPin size={10}/> Endereço</p>
                             <p className="text-xs font-medium text-slate-300 leading-tight">{order.address}</p>
                         </div>
                     </div>

                     {/* Lista de Itens */}
                     <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                         <div className="bg-slate-900/50 p-3 border-b border-slate-800 flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><List size={12}/> Itens do Pedido</span>
                             <span className="text-[10px] font-mono text-slate-500">ID: {formatOrderId(order.id)}</span>
                         </div>
                         <div className="p-4 space-y-3">
                             {order.items.split('\n').filter((l: string) => l.trim() && !l.includes('---')).map((line: string, i: number) => {
                                 const isObs = line.toLowerCase().startsWith('obs:');
                                 return (
                                     <div key={i} className={`text-sm ${isObs ? 'text-amber-500 italic pl-4 text-xs' : 'text-slate-200 font-medium'}`}>
                                         {line}
                                     </div>
                                 )
                             })}
                         </div>
                         {/* Totais */}
                         <div className="bg-slate-900/30 p-4 border-t border-slate-800 flex justify-between items-center">
                             <div className="flex flex-col">
                                 <span className="text-[10px] text-slate-500 font-bold uppercase">Forma Pagamento</span>
                                 <span className="text-sm font-bold text-slate-300">{order.paymentMethod || '-'}</span>
                             </div>
                             <div className="flex flex-col items-end">
                                 <span className="text-[10px] text-slate-500 font-bold uppercase">Total</span>
                                 <span className="text-xl font-black text-emerald-400">{formatCurrency(order.value)}</span>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Footer Actions */}
                 <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-2 gap-3">
                     <button onClick={() => { const phone = normalizePhone(order.phone); if(phone) window.open(`https://wa.me/55${phone}`, '_blank'); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-colors">
                         <MessageCircle size={18}/> Abrir WhatsApp
                     </button>
                     <button onClick={copyOrderDetails} className={`border font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors ${copied ? 'bg-slate-800 text-emerald-400 border-emerald-500/50' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                         {copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? 'Copiado' : 'Copiar Detalhes'}
                     </button>
                 </div>
             </div>
        </div>
    );
}

export function NewDriverModal({ onClose, onSave, initialData }: any) {
    const [form, setForm] = useState(initialData || { name: '', phone: '', vehicle: 'Moto', plate: '', paymentModel: 'fixed_per_delivery', paymentRate: 5.00, avatar: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...form, status: initialData?.status || 'offline', lat: 0, lng: 0, battery: 100, totalDeliveries: initialData?.totalDeliveries || 0, rating: 5 });
        onClose();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await compressImage(file);
                setForm(prev => ({ ...prev, avatar: base64 }));
            } catch (err) {
                console.error("Erro ao processar imagem", err);
                alert("Erro ao carregar imagem. Tente outra.");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <h3 className="font-bold text-xl text-white mb-6">{initialData ? 'Editar' : 'Novo'} Motoboy</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex justify-center mb-4">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-full border-2 border-dashed border-slate-700 hover:border-amber-500 bg-slate-950 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative group"
                        >
                            {form.avatar ? (
                                <>
                                    <img src={form.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit size={20} className="text-white"/>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={24} className="text-slate-500 mb-1"/>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Foto</span>
                                </>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
                    </div>

                    <input required placeholder="Nome" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    <input required placeholder="Telefone" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                         <select className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})}>
                             <option value="Moto">Moto</option><option value="Carro">Carro</option><option value="Bike">Bike</option>
                         </select>
                         <input placeholder="Placa" className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} />
                    </div>
                    <div className="border-t border-slate-800 pt-3">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Pagamento</label>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mb-2 focus:border-amber-500 outline-none" value={form.paymentModel} onChange={e => setForm({...form, paymentModel: e.target.value})}>
                            <option value="fixed_per_delivery">Taxa Fixa por Entrega</option>
                            <option value="percentage">Porcentagem (%)</option>
                            <option value="salary">Salário Fixo</option>
                        </select>
                        <input type="number" placeholder={form.paymentModel === 'percentage' ? "Porcentagem (Ex: 10)" : "Valor (Ex: 5.00)"} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" value={form.paymentRate} onChange={e => setForm({...form, paymentRate: parseFloat(e.target.value)})} />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl mt-2 shadow-lg">Salvar</button>
                </form>
                <button onClick={onClose} className="w-full mt-2 text-slate-500 py-2 hover:text-white transition-colors">Cancelar</button>
            </div>
        </div>
    );
}

export function NewValeModal({ driver, onClose, onSave }: any) {
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ driverId: driver.id, amount: parseFloat(amount), description: desc || 'Adiantamento' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 p-6 shadow-2xl">
                <h3 className="font-bold text-xl text-white mb-4">Novo Vale / Adiantamento</h3>
                <p className="text-sm text-slate-400 mb-4">Para: <strong>{driver.name}</strong></p>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input required type="number" placeholder="Valor (R$)" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={amount} onChange={e => setAmount(e.target.value)} />
                    <input placeholder="Descrição (Opcional)" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={desc} onChange={e => setDesc(e.target.value)} />
                    <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl mt-2">Confirmar Vale</button>
                </form>
                <button onClick={onClose} className="w-full mt-2 text-slate-500 py-2">Cancelar</button>
            </div>
        </div>
    );
}

export function CloseCycleModal({ data, onClose, onConfirm }: any) {
    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-emerald-500/30 p-6 shadow-2xl">
                <h3 className="font-bold text-xl text-white mb-4 text-center">Confirmar Fechamento</h3>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-400">Entregas ({data.deliveriesCount})</span><span className="text-emerald-400 font-bold">{formatCurrency(data.deliveriesTotal)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Vales ({data.valesCount})</span><span className="text-red-400 font-bold">- {formatCurrency(data.valesTotal)}</span></div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between text-lg"><span className="text-white font-bold">A Pagar</span><span className="text-emerald-500 font-black">{formatCurrency(data.finalAmount)}</span></div>
                </div>
                <button onClick={() => onConfirm(data)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl mb-2 shadow-lg">Confirmar Pagamento</button>
                <button onClick={onClose} className="w-full bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Cancelar</button>
            </div>
        </div>
    );
}

// --- UPDATED PRODUCT FORM MODAL ---

export function ProductFormModal({ isOpen, onClose, product, onSave, existingCategories, inventory = [] }: any) {
    const [form, setForm] = useState<Product>(product || { name: '', description: '', price: 0, category: '', ingredients: [], costPrice: 0, operationalCost: 0 });
    const [tab, setTab] = useState<'info' | 'cost'>('info');
    
    // States for Ingredient Picker
    const [selectedInventoryId, setSelectedInventoryId] = useState('');
    const [ingredientQty, setIngredientQty] = useState('');

    useEffect(() => { 
        if(isOpen) setForm(product || { name: '', description: '', price: 0, category: '', ingredients: [], costPrice: 0, operationalCost: 0 }); 
        setTab('info');
    }, [isOpen, product]);

    // Recalculate cost whenever ingredients or op cost changes
    useEffect(() => {
        let totalIngredientsCost = 0;
        if (form.ingredients) {
            form.ingredients.forEach(ing => {
                const invItem = inventory.find((i: InventoryItem) => i.id === ing.inventoryId);
                if (invItem) {
                    totalIngredientsCost += (invItem.cost * ing.qty);
                }
            });
        }
        setForm(prev => ({ ...prev, costPrice: totalIngredientsCost }));
    }, [form.ingredients, form.operationalCost, inventory]);

    const handleAddIngredient = () => {
        if (!selectedInventoryId || !ingredientQty) return;
        const qty = parseFloat(ingredientQty);
        if (isNaN(qty) || qty <= 0) return;

        const newIngredients = [...(form.ingredients || [])];
        // Check if exists
        const existsIdx = newIngredients.findIndex(i => i.inventoryId === selectedInventoryId);
        if (existsIdx >= 0) {
            newIngredients[existsIdx].qty += qty;
        } else {
            newIngredients.push({ inventoryId: selectedInventoryId, qty });
        }
        setForm({ ...form, ingredients: newIngredients });
        setSelectedInventoryId('');
        setIngredientQty('');
    };

    const handleRemoveIngredient = (idx: number) => {
        const newIngredients = [...(form.ingredients || [])];
        newIngredients.splice(idx, 1);
        setForm({ ...form, ingredients: newIngredients });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(product?.id, { ...form, price: parseFloat(form.price as any) });
    };

    // Calculate Margins for Display
    const totalCost = (form.costPrice || 0) + (form.operationalCost || 0);
    const profit = (form.price || 0) - totalCost;
    const margin = form.price > 0 ? (profit / form.price) * 100 : 0;
    const markup = totalCost > 0 ? ((form.price - totalCost) / totalCost) * 100 : 0;

    let marginColor = 'text-slate-500';
    let marginBg = 'bg-slate-900';
    if (totalCost > 0) {
        if (margin < 20) { marginColor = 'text-red-500'; marginBg = 'bg-red-900/20 border-red-500/50'; }
        else if (margin < 40) { marginColor = 'text-amber-500'; marginBg = 'bg-amber-900/20 border-amber-500/50'; }
        else { marginColor = 'text-emerald-500'; marginBg = 'bg-emerald-900/20 border-emerald-500/50'; }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 p-0 shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-xl text-white mb-4">{product ? 'Editar' : 'Novo'} Produto</h3>
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button onClick={() => setTab('info')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${tab === 'info' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Informações Gerais</button>
                        <button onClick={() => setTab('cost')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${tab === 'cost' ? 'bg-slate-800 text-emerald-400 shadow' : 'text-slate-500 hover:text-slate-300'}`}><Calculator size={14}/> Custos & Ficha Técnica</button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* TAB 1: INFO GERAL */}
                        <div className={tab === 'info' ? 'block space-y-4' : 'hidden'}>
                            <input required placeholder="Nome do Produto" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                            <textarea placeholder="Descrição" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 h-24 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Preço de Venda (R$)</label>
                                    <input required type="number" step="0.01" placeholder="0.00" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 font-bold text-lg" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
                                </div>
                                <div className="relative">
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Categoria</label>
                                    <input required list="categories" placeholder="Selecione..." className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                                    <datalist id="categories">
                                        {existingCategories.map((c: string) => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        {/* TAB 2: CUSTOS E FICHA */}
                        <div className={tab === 'cost' ? 'block space-y-6' : 'hidden'}>
                            
                            {/* SELEÇÃO DE INGREDIENTES */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Box size={14}/> Adicionar Ingrediente da Ficha</h4>
                                <div className="flex gap-2 mb-2">
                                    <select 
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                                        value={selectedInventoryId}
                                        onChange={e => setSelectedInventoryId(e.target.value)}
                                    >
                                        <option value="">Selecione o Item...</option>
                                        {inventory.map((item: InventoryItem) => (
                                            <option key={item.id} value={item.id}>{item.name} ({item.unit}) - {formatCurrency(item.cost)}</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="number" 
                                        placeholder="Qtd" 
                                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                                        value={ingredientQty}
                                        onChange={e => setIngredientQty(e.target.value)}
                                    />
                                    <button type="button" onClick={handleAddIngredient} className="bg-slate-800 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors"><Plus size={16}/></button>
                                </div>

                                {/* LISTA DE INGREDIENTES ADICIONADOS */}
                                <div className="space-y-1 mt-3 max-h-32 overflow-y-auto custom-scrollbar">
                                    {(form.ingredients || []).length === 0 && <p className="text-center text-[10px] text-slate-600 italic py-2">Nenhum ingrediente adicionado à ficha.</p>}
                                    {(form.ingredients || []).map((ing, idx) => {
                                        const invItem = inventory.find((i: InventoryItem) => i.id === ing.inventoryId);
                                        const cost = invItem ? invItem.cost * ing.qty : 0;
                                        return (
                                            <div key={idx} className="flex justify-between items-center text-xs bg-slate-900 p-2 rounded border border-slate-800">
                                                <span className="text-slate-300">{invItem?.name || 'Item Removido'} <span className="text-slate-500">({ing.qty} {invItem?.unit})</span></span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-emerald-500">{formatCurrency(cost)}</span>
                                                    <button type="button" onClick={() => handleRemoveIngredient(idx)} className="text-slate-600 hover:text-red-500"><Trash2 size={12}/></button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* CUSTOS EXTRAS */}
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Custo Operacional / Embalagem (Fixo)</label>
                                <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" value={form.operationalCost} onChange={e => setForm({...form, operationalCost: parseFloat(e.target.value)})} placeholder="Ex: 2.50 (Embalagem + Gás)" />
                            </div>

                            {/* PAINEL DE LUCRO */}
                            <div className={`rounded-xl border p-4 ${marginBg}`}>
                                <h4 className="text-center font-black text-white text-sm uppercase tracking-widest mb-4">Análise Financeira</h4>
                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mb-4">
                                    <div className="flex justify-between text-slate-400"><span>Preço Venda:</span> <span className="text-white font-bold">{formatCurrency(form.price)}</span></div>
                                    <div className="flex justify-between text-slate-400"><span>Custo Ingredientes:</span> <span className="text-red-300 font-bold">- {formatCurrency(form.costPrice || 0)}</span></div>
                                    <div className="flex justify-between text-slate-400"><span>Custo Fixo:</span> <span className="text-red-300 font-bold">- {formatCurrency(form.operationalCost || 0)}</span></div>
                                    <div className="flex justify-between text-slate-300 border-t border-white/10 pt-1 mt-1"><span>Lucro Bruto:</span> <span className={`font-bold ${profit > 0 ? 'text-emerald-400' : 'text-red-500'}`}>{formatCurrency(profit)}</span></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-black/20 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Margem</p>
                                        <p className={`text-xl font-black ${marginColor}`}>{margin.toFixed(1)}%</p>
                                    </div>
                                    <div className="flex-1 bg-black/20 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Markup</p>
                                        <p className="text-xl font-black text-white">{markup.toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:text-white transition-colors">Cancelar</button>
                    <button form="product-form" type="submit" className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg">Salvar Produto</button>
                </div>
            </div>
        </div>
    );
}

// ... rest of modals (SettingsModal, etc) remains the same
export function SettingsModal({ config, onSave, onClose }: any) {
    const [form, setForm] = useState<AppConfig>({ 
        storeCountryCode: '+55', 
        printerWidth: '80mm',
        ...config 
    });
    const [tab, setTab] = useState('general');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumberDisplay(e.target.value);
        setForm({ ...form, storePhone: formatted });
    };

    const TABS = [
        { id: 'general', label: 'Geral', icon: <Store size={16}/> },
        { id: 'payment', label: 'Pagamento', icon: <CreditCard size={16}/> },
        { id: 'delivery', label: 'Entrega', icon: <Truck size={16}/> },
        { id: 'schedule', label: 'Horários', icon: <CalendarClock size={16}/> },
        { id: 'system', label: 'Sistema', icon: <Sliders size={16}/> }, // Nova aba Sistema
    ];

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            {/* CONTAINER COM ALTURA FIXA PARA NÃO PULAR */}
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl flex flex-col h-[650px] max-h-[90vh] overflow-hidden relative">
                
                {/* Header Fixo */}
                <div className="p-6 pb-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10">
                    <h3 className="font-bold text-2xl text-white flex items-center gap-2">
                        <Settings className="text-slate-500"/> Configurações
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
                </div>

                {/* Tabs Navigation (Segmented Control Style) */}
                <div className="px-6 py-2 bg-slate-900 shrink-0 overflow-x-auto">
                    <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 min-w-max">
                        {TABS.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setTab(t.id)} 
                                className={`px-4 py-2.5 text-xs font-bold rounded-xl uppercase flex items-center justify-center gap-2 transition-all duration-300 ${tab === t.id ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t.icon} <span className="hidden sm:inline">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-900">
                    {tab === 'general' && (
                        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Nome da Loja</label>
                                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-amber-500 outline-none transition-colors" value={form.appName} onChange={e => setForm({...form, appName: e.target.value})} placeholder="Ex: Jhans Burgers" />
                            </div>
                            
                            {/* LOGO UPLOAD (MODIFICADO) */}
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Logotipo da Loja</label>
                                <div className="flex items-center gap-4">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-20 h-20 bg-slate-950 rounded-xl border-2 border-dashed border-slate-800 flex items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-slate-900 transition-colors overflow-hidden group relative"
                                    >
                                        {form.appLogoUrl ? (
                                            <>
                                                <img src={form.appLogoUrl} className="w-full h-full object-cover"/>
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Edit size={20} className="text-white"/>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <UploadCloud size={24} className="text-slate-600 mx-auto mb-1"/>
                                                <span className="text-[9px] text-slate-500 font-bold uppercase">Upload</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-400 mb-2">Clique na caixa para fazer upload da sua marca.</p>
                                        <button onClick={() => setForm({...form, appLogoUrl: ''})} className="text-xs text-red-500 font-bold hover:underline">Remover Logo</button>
                                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
                                    </div>
                                </div>
                            </div>

                            {/* TELEFONE COM DDI (MODIFICADO - LISTA COMPLETA) */}
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
                    )}

                    {tab === 'payment' && (
                        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-emerald-900/10 border border-emerald-900/50 p-4 rounded-xl flex items-center gap-3">
                                <div className="bg-emerald-500 p-2 rounded-lg text-white"><QrCode size={20}/></div>
                                <div>
                                    <h4 className="text-emerald-400 font-bold text-sm">Configuração PIX</h4>
                                    <p className="text-xs text-emerald-500/70">Estes dados aparecerão no QR Code.</p>
                                </div>
                            </div>
                            <div><label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Chave PIX</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500 outline-none" value={form.pixKey || ''} onChange={e => setForm({...form, pixKey: e.target.value})} placeholder="CPF, CNPJ, Email ou Aleatória" /></div>
                            <div><label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Nome Titular</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500 outline-none" value={form.pixName || ''} onChange={e => setForm({...form, pixName: e.target.value})} placeholder="Nome completo do recebedor" /></div>
                            <div><label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Cidade Titular</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500 outline-none" value={form.pixCity || ''} onChange={e => setForm({...form, pixCity: e.target.value})} placeholder="Cidade da conta" /></div>
                        </div>
                    )}

                    {tab === 'delivery' && (
                         <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                                <span className="text-white font-bold text-sm">Cobrar Taxa de Entrega por Bairro</span>
                                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                                    <input type="checkbox" id="toggle-delivery" className="absolute w-0 h-0 opacity-0" checked={form.enableDeliveryFees || false} onChange={e => setForm({...form, enableDeliveryFees: e.target.checked})} />
                                    <label htmlFor="toggle-delivery" className={`block overflow-hidden h-6 rounded-full cursor-pointer border ${form.enableDeliveryFees ? 'bg-emerald-600 border-emerald-600' : 'bg-slate-800 border-slate-700'}`}></label>
                                    <span className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ${form.enableDeliveryFees ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                </div>
                            </div>
                            
                            {/* NOVO: PEDIDO MÍNIMO & TEMPO ESTIMADO */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Pedido Mínimo (R$)</label>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={form.minOrderValue || ''} onChange={e => setForm({...form, minOrderValue: parseFloat(e.target.value)})} placeholder="Ex: 20.00" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block ml-1">Tempo Estimado</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={form.estimatedTime || ''} onChange={e => setForm({...form, estimatedTime: e.target.value})} placeholder="Ex: 40-50 min" />
                                </div>
                            </div>
                            
                            {form.enableDeliveryFees && (
                                <div className="space-y-3 pt-4 border-t border-slate-800">
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-2 ml-1">Zonas de Entrega</p>
                                    {(form.deliveryZones || []).length === 0 && <p className="text-slate-600 text-sm text-center py-4 bg-slate-950 rounded-xl border border-dashed border-slate-800">Nenhum bairro cadastrado.</p>}
                                    {(form.deliveryZones || []).map((zone, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-amber-500 outline-none" placeholder="Nome do Bairro" value={zone.name} onChange={e => { const newZones = [...(form.deliveryZones || [])]; newZones[idx].name = e.target.value; setForm({...form, deliveryZones: newZones}); }} />
                                            <input type="number" className="w-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-amber-500 outline-none" placeholder="R$ Taxa" value={zone.fee} onChange={e => { const newZones = [...(form.deliveryZones || [])]; newZones[idx].fee = parseFloat(e.target.value); setForm({...form, deliveryZones: newZones}); }} />
                                            <button onClick={() => { const newZones = (form.deliveryZones || []).filter((_, i) => i !== idx); setForm({...form, deliveryZones: newZones}); }} className="p-3 text-slate-500 hover:text-red-500 hover:bg-slate-950 rounded-xl transition-colors"><Trash2 size={18}/></button>
                                        </div>
                                    ))}
                                    <button onClick={() => setForm({...form, deliveryZones: [...(form.deliveryZones || []), { name: '', fee: 0 }]})} className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 text-sm font-bold flex items-center justify-center gap-2 transition-all"><Plus size={16}/> Adicionar Bairro</button>
                                </div>
                            )}
                         </div>
                    )}

                    {tab === 'schedule' && (
                        <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day, idx) => {
                                const dayConfig = form.schedule?.[idx] || { enabled: false, open: '18:00', close: '23:00' };
                                return (
                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${dayConfig.enabled ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-transparent opacity-50'}`}>
                                        <div className="w-24 text-sm font-bold text-white">{day}</div>
                                        <input type="checkbox" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" checked={dayConfig.enabled} onChange={e => updateSchedule(idx, 'enabled', e.target.checked)} />
                                        <div className="flex-1 flex items-center gap-2 justify-end">
                                            <input type="time" className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono outline-none focus:border-emerald-500" value={dayConfig.open} onChange={e => updateSchedule(idx, 'open', e.target.value)} disabled={!dayConfig.enabled} />
                                            <span className="text-slate-500 font-bold">-</span>
                                            <input type="time" className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono outline-none focus:border-emerald-500" value={dayConfig.close} onChange={e => updateSchedule(idx, 'close', e.target.value)} disabled={!dayConfig.enabled} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {tab === 'system' && (
                        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                            {/* NOVO: IMPRESSÃO */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                <h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2"><Printer size={16}/> Configuração de Impressão</h4>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <button 
                                        onClick={() => setForm({...form, printerWidth: '58mm'})}
                                        className={`py-3 rounded-lg text-sm font-bold border transition-all ${form.printerWidth === '58mm' ? 'bg-blue-900/30 text-blue-400 border-blue-500/50' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                    >
                                        58mm (Pequena)
                                    </button>
                                    <button 
                                        onClick={() => setForm({...form, printerWidth: '80mm'})}
                                        className={`py-3 rounded-lg text-sm font-bold border transition-all ${form.printerWidth === '80mm' ? 'bg-blue-900/30 text-blue-400 border-blue-500/50' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                    >
                                        80mm (Padrão)
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                <h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2"><DollarSign size={16}/> Taxas Extras</h4>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Taxa de Embalagem (R$)</label>
                                    <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" value={form.packagingFee || ''} onChange={e => setForm({...form, packagingFee: parseFloat(e.target.value)})} placeholder="Ex: 2.00" />
                                    <p className="text-[10px] text-slate-500 mt-1">Cobrado uma vez por pedido para cobrir descartáveis.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions (Fixed) */}
                <div className="p-6 border-t border-slate-800 bg-slate-900 mt-auto z-10">
                    <button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
                        <Save size={20}/> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
}

// ... remaining modals (NewExpenseModal, ImportModal, EditClientModal, GiveawayManagerModal) ...
export function NewExpenseModal({ onClose, onSave }: any) {
    const [form, setForm] = useState({ description: '', amount: '', category: 'Outros' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...form, amount: parseFloat(form.amount) });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 p-6 shadow-2xl">
                <h3 className="font-bold text-xl text-white mb-4">Nova Despesa</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required placeholder="Descrição" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-red-500" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <input required type="number" step="0.01" placeholder="Valor (R$)" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-red-500" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                    <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-red-500" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                        <option value="Outros">Outros</option>
                        <option value="Insumos">Insumos</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Pessoal">Pessoal</option>
                        <option value="Marketing">Marketing</option>
                    </select>
                    <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl mt-2 shadow-lg">Registrar Saída</button>
                </form>
                <button onClick={onClose} className="w-full mt-2 text-slate-500 py-2 hover:text-white transition-colors">Cancelar</button>
            </div>
        </div>
    );
}

export function ImportModal({ onClose, onImportCSV }: any) {
    const [text, setText] = useState('');

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 p-6 shadow-2xl flex flex-col h-[80vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-white">Importar CSV</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <p className="text-xs text-slate-400 mb-2">Cole o conteúdo do CSV abaixo. Formato esperado: ID, Data, Hora, Descrição, Valor, Tipo...</p>
                <textarea 
                    className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-xs font-mono text-slate-300 outline-none focus:border-blue-500 resize-none mb-4" 
                    placeholder="Cole aqui..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                />
                <button onClick={() => onImportCSV(text)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg">Processar Importação</button>
            </div>
        </div>
    );
}

export function EditClientModal({ client, orders, onClose, onSave, onUpdateOrder }: any) {
    const [form, setForm] = useState(client || { name: '', phone: '', address: '', obs: '' });
    const clientOrders = orders.filter((o: Order) => normalizePhone(o.phone) === normalizePhone(client.phone));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-800 shadow-2xl flex flex-col h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <h3 className="font-bold text-xl text-white">Detalhes do Cliente</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-bold text-white mb-4 flex items-center gap-2"><User size={18} className="text-amber-500"/> Dados Pessoais</h4>
                        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nome</label><input required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                            <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Telefone</label><input required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                            <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Endereço</label><input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                            <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Observações Internas</label><textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 h-24 resize-none" value={form.obs || ''} onChange={e => setForm({...form, obs: e.target.value})} /></div>
                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg mt-2">Salvar Alterações</button>
                        </form>
                    </div>

                    <div className="flex flex-col h-full overflow-hidden">
                        <h4 className="font-bold text-white mb-4 flex items-center gap-2"><ShoppingBag size={18} className="text-blue-500"/> Histórico de Pedidos ({clientOrders.length})</h4>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                            {clientOrders.length === 0 ? <p className="text-slate-500 text-sm">Nenhum pedido encontrado.</p> : clientOrders.sort((a: any,b: any) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0)).map((order: any) => (
                                <div key={order.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>{order.status}</span>
                                        <span className="text-xs font-mono text-slate-500">{formatDate(order.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 line-clamp-2 mb-2">{order.items}</p>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                                        <span className="text-emerald-400 font-bold text-sm">{formatCurrency(order.value)}</span>
                                        <button onClick={() => copyToClipboard(order.id)} className="text-xs text-slate-500 hover:text-white flex items-center gap-1"><Copy size={12}/> ID</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function GiveawayManagerModal({ entries, onClose, appConfig }: any) {
    const [winner, setWinner] = useState<GiveawayEntry | null>(null);
    const [isRolling, setIsRolling] = useState(false);

    const handleDraw = () => {
        if (entries.length === 0) return alert("Nenhum participante!");
        setIsRolling(true);
        setWinner(null);

        let counter = 0;
        const interval = setInterval(() => {
            counter++;
            const random = entries[Math.floor(Math.random() * entries.length)];
            setWinner(random); // Show random names flashing
            if (counter > 20) {
                clearInterval(interval);
                setIsRolling(false);
                // Final winner
                const finalWinner = entries[Math.floor(Math.random() * entries.length)];
                setWinner(finalWinner);
            }
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-3xl border-2 border-purple-500 shadow-2xl p-6 relative overflow-hidden flex flex-col h-[600px]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10"><X size={24}/></button>
                
                <div className="text-center mb-6">
                    <Trophy className="mx-auto text-amber-400 mb-2 drop-shadow-lg" size={48} />
                    <h3 className="font-black text-3xl text-white uppercase italic tracking-wider">Sorteio</h3>
                    <p className="text-purple-300 text-sm font-bold">{entries.length} Participantes</p>
                </div>

                <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 mb-6 relative flex items-center justify-center overflow-hidden">
                    {winner ? (
                        <div className="text-center z-10">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-2">{isRolling ? 'Sorteando...' : 'Vencedor(a)'}</p>
                            <h2 className={`font-black text-2xl md:text-4xl text-white transition-all ${isRolling ? 'blur-sm scale-90' : 'scale-110 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]'}`}>{winner.name}</h2>
                            {!isRolling && <p className="text-emerald-400 font-mono mt-2 text-lg">{normalizePhone(winner.phone)}</p>}
                        </div>
                    ) : (
                        <p className="text-slate-600 font-bold text-lg">Pronto para sortear?</p>
                    )}
                    
                    {/* Confetti effect placeholder if needed */}
                </div>

                <button onClick={handleDraw} disabled={isRolling} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all text-xl uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
                    {isRolling ? 'Sorteando...' : 'Realizar Sorteio'}
                </button>
                
                {winner && !isRolling && (
                     <div className="mt-4 flex gap-2">
                         <button onClick={() => window.open(`https://wa.me/55${normalizePhone(winner.phone)}?text=Parabéns ${winner.name}! Você ganhou o sorteio! 🎉`, '_blank')} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"><MessageCircle size={18}/> Avisar Vencedor</button>
                     </div>
                )}
            </div>
        </div>
    );
}
