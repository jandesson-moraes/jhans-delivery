import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Check, Copy, MessageCircle, Flame, Save, Trash2, 
    Plus, Minus, UploadCloud, DollarSign, Calendar, 
    MapPin, Phone, User, Bike, Store, FileText, 
    AlertTriangle, ShieldCheck, Gift, Trophy, CheckCircle2, 
    AlertCircle, Printer, Share2, Search, Edit, Bell, Clock,
    Image as ImageIcon, Power
} from 'lucide-react';
import { 
    Driver, Order, AppConfig, Product, Client, 
    Vale, Expense, GiveawayEntry 
} from '../types';
import { 
    formatCurrency, copyToClipboard, getProductionMessage, 
    normalizePhone, generateReceiptText, formatDate, 
    formatTime, getDispatchMessage, sendDispatchNotification,
    checkShopStatus, parseOrderItems, compressImage
} from '../utils';

// ... (Generic Alert, Confirm, Order Modals remain unchanged) ...
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
        // Parse inicial dos itens
        if (order.items) {
            setParsedItems(parseOrderItems(order.items));
        }
    }, [order]);

    // Atualiza o texto bruto quando os itens estruturados mudam
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
                    {/* Status & Valor */}
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

                    {/* Itens Editor */}
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

                    {/* Cliente Info */}
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
    const handleSend = () => {
         sendDispatchNotification(data.order, data.driverName, appName);
         onClose();
    };
    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-emerald-500/50 p-6 shadow-2xl text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                    <Bike size={32}/>
                </div>
                <h3 className="font-bold text-xl text-white mb-2">Motoboy Atribuído!</h3>
                <p className="text-slate-400 mb-6">O pedido foi enviado para <strong>{data.driverName}</strong>.</p>
                <button onClick={handleSend} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                    <MessageCircle size={18}/> Avisar Cliente
                </button>
                <button onClick={onClose} className="mt-3 text-slate-500 text-sm hover:text-white">Fechar</button>
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
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl">
                 <div className="flex justify-between items-start mb-4">
                     <div>
                         <h3 className="font-bold text-xl text-white">{order.customer}</h3>
                         <p className="text-slate-500 text-sm">{totalClientOrders} pedidos na história</p>
                     </div>
                     <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                 </div>
                 <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 max-h-64 overflow-y-auto">
                     <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{order.items}</pre>
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                     <div><span className="font-bold block text-slate-500">Endereço</span>{order.address}</div>
                     <div><span className="font-bold block text-slate-500">Telefone</span>{order.phone}</div>
                 </div>
             </div>
        </div>
    );
}

// --- DRIVER MODALS ---

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

// ... (Rest of modal components unchanged: CloseCycleModal, SettingsModal, ImportModal, NewExpenseModal, ProductFormModal, EditClientModal, NewLeadNotificationModal, GiveawayManagerModal) ...
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

// --- CONFIG / ADMIN MODALS ---

export function SettingsModal({ config, onSave, onClose }: any) {
    const [form, setForm] = useState(config || { appName: '', appLogoUrl: '', storePhone: '', pixKey: '', pixName: '', pixCity: '', enableDeliveryFees: false });
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Zonas de Entrega
    const [zones, setZones] = useState<any[]>(config.deliveryZones || []);
    
    // Horários (Schedule)
    const [schedule, setSchedule] = useState<{ [key: number]: any }>(config.schedule || {});
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    // Handlers para Zonas
    const handleAddZone = () => setZones([...zones, { name: '', fee: 0 }]);
    const handleUpdateZone = (idx: number, field: string, val: any) => {
        const newZones = [...zones];
        newZones[idx] = { ...newZones[idx], [field]: val };
        setZones(newZones);
    };
    const handleRemoveZone = (idx: number) => setZones(zones.filter((_, i) => i !== idx));

    // Handlers para Horários
    const handleUpdateSchedule = (dayIdx: number, field: string, val: any) => {
        setSchedule(prev => ({
            ...prev,
            [dayIdx]: { ...(prev[dayIdx] || { enabled: false, open: '18:00', close: '23:00' }), [field]: val }
        }));
    };

    // Handler para Logo Upload
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await compressImage(file);
                setForm(prev => ({ ...prev, appLogoUrl: base64 }));
            } catch (err) {
                console.error("Erro ao processar imagem", err);
                alert("Erro ao carregar imagem. Tente outra.");
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ 
            ...form, 
            deliveryZones: zones, 
            schedule: schedule 
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">Configurações da Loja</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* DADOS GERAIS & LOGO */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Area de Logo */}
                        <div className="w-full md:w-auto flex flex-col items-center gap-2">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-500 bg-slate-950 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative group"
                            >
                                {form.appLogoUrl ? (
                                    <>
                                        <img src={form.appLogoUrl} className="w-full h-full object-cover" alt="Logo" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Edit size={20} className="text-white"/>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={24} className="text-slate-500 mb-1"/>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Logo</span>
                                    </>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
                            <span className="text-[10px] text-slate-500 cursor-pointer hover:text-amber-500" onClick={() => fileInputRef.current?.click()}>Alterar Logo</span>
                        </div>

                        {/* Inputs Gerais */}
                        <div className="flex-1 space-y-4 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Nome da Loja</label><input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none transition-colors" value={form.appName} onChange={e => setForm({...form, appName: e.target.value})} /></div>
                                <div><label className="text-xs text-slate-500 font-bold uppercase mb-1 block">WhatsApp da Loja</label><input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none transition-colors" value={form.storePhone} onChange={e => setForm({...form, storePhone: e.target.value})} /></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* PIX */}
                    <div className="border-t border-slate-800 pt-4">
                        <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2"><DollarSign size={16}/> Configuração PIX</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input placeholder="Chave PIX" className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm" value={form.pixKey} onChange={e => setForm({...form, pixKey: e.target.value})} />
                            <input placeholder="Nome Titular" className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm" value={form.pixName} onChange={e => setForm({...form, pixName: e.target.value})} />
                            <input placeholder="Cidade" className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm" value={form.pixCity} onChange={e => setForm({...form, pixCity: e.target.value})} />
                        </div>
                    </div>

                    {/* TAXAS DE ENTREGA */}
                    <div className="border-t border-slate-800 pt-4">
                        <div className="flex justify-between items-center mb-3">
                             <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2"><Bike size={16}/> Taxas de Entrega (Bairros)</h4>
                             <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer bg-slate-950 border border-slate-700 px-3 py-1 rounded-full hover:bg-slate-800 transition-colors"><input type="checkbox" checked={form.enableDeliveryFees} onChange={e => setForm({...form, enableDeliveryFees: e.target.checked})} className="accent-blue-500" /> Ativar Taxas</label>
                        </div>
                        
                        {form.enableDeliveryFees && (
                            <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                {zones.map((zone, idx) => (
                                    <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-left-2">
                                        <input 
                                            placeholder="Nome do Bairro" 
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none" 
                                            value={zone.name} 
                                            onChange={e => handleUpdateZone(idx, 'name', e.target.value)} 
                                        />
                                        <div className="relative w-24">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                                            <input 
                                                type="number" 
                                                placeholder="0.00" 
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 pl-6 text-white text-sm focus:border-blue-500 outline-none" 
                                                value={zone.fee} 
                                                onChange={e => handleUpdateZone(idx, 'fee', parseFloat(e.target.value))} 
                                            />
                                        </div>
                                        <button type="button" onClick={() => handleRemoveZone(idx)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-800 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddZone} className="w-full py-2 border-2 border-dashed border-slate-700 text-slate-500 rounded-lg text-xs font-bold hover:border-slate-500 hover:text-slate-300 transition-colors mt-2 flex items-center justify-center gap-2">
                                    <Plus size={14}/> Adicionar Bairro
                                </button>
                            </div>
                        )}
                    </div>

                    {/* HORÁRIOS */}
                    <div className="border-t border-slate-800 pt-4">
                        <h4 className="text-sm font-bold text-orange-400 mb-4 flex items-center gap-2"><Clock size={16}/> Horários de Funcionamento</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {daysOfWeek.map((day, idx) => {
                                const config = schedule[idx] || { enabled: false, open: '18:00', close: '23:00' };
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${config.enabled ? 'bg-slate-900 border-slate-700 shadow-sm' : 'bg-slate-950 border-slate-800 opacity-60'}`}>
                                        <div className="flex items-center gap-3">
                                            {/* Custom Toggle Switch */}
                                            <div 
                                                onClick={() => handleUpdateSchedule(idx, 'enabled', !config.enabled)}
                                                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${config.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all shadow-sm ${config.enabled ? 'left-6' : 'left-1'}`} />
                                            </div>
                                            <span className={`text-sm font-bold ${config.enabled ? 'text-white' : 'text-slate-500'}`}>{day}</span>
                                        </div>
                                        
                                        {config.enabled ? (
                                            <div className="flex items-center gap-1 animate-in fade-in">
                                                <input 
                                                    type="time" 
                                                    value={config.open} 
                                                    onChange={e => handleUpdateSchedule(idx, 'open', e.target.value)} 
                                                    className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-lg px-2 py-1 w-20 text-center outline-none focus:border-amber-500"
                                                />
                                                <span className="text-slate-600 text-xs font-bold">às</span>
                                                <input 
                                                    type="time" 
                                                    value={config.close} 
                                                    onChange={e => handleUpdateSchedule(idx, 'close', e.target.value)} 
                                                    className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-lg px-2 py-1 w-20 text-center outline-none focus:border-amber-500"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider px-2">Fechado</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                            <Save size={20}/> Salvar Configurações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function ImportModal({ onClose, onImportCSV }: any) {
    const [text, setText] = useState('');
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 p-6 shadow-2xl">
                <h3 className="font-bold text-xl text-white mb-4">Importar CSV</h3>
                <textarea className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white h-48 font-mono text-xs" placeholder="Cole o conteúdo do CSV aqui..." value={text} onChange={e => setText(e.target.value)} />
                <button onClick={() => onImportCSV(text)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4">Importar Dados</button>
                <button onClick={onClose} className="w-full mt-2 text-slate-500 py-2">Cancelar</button>
            </div>
        </div>
    );
}

export function NewExpenseModal({ onClose, onSave }: any) {
    const [form, setForm] = useState({ description: '', amount: '', category: 'Mercadoria' });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...form, amount: parseFloat(form.amount) });
        onClose();
    };
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 p-6 shadow-2xl">
                <h3 className="font-bold text-xl text-white mb-4">Nova Despesa</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input required placeholder="Descrição" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <input required type="number" placeholder="Valor (R$)" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                    <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                        <option value="Mercadoria">Mercadoria</option>
                        <option value="Pessoal">Pessoal</option>
                        <option value="Fixo">Fixo (Água/Luz)</option>
                        <option value="Outros">Outros</option>
                    </select>
                    <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl mt-2">Registrar Saída</button>
                </form>
                <button onClick={onClose} className="w-full mt-2 text-slate-500 py-2">Cancelar</button>
            </div>
        </div>
    );
}

// ... (ProductFormModal, EditClientModal, NewLeadNotificationModal, GiveawayManagerModal remain unchanged) ...
export function ProductFormModal({ isOpen, onClose, product, onSave, existingCategories }: any) {
    const [form, setForm] = useState({ name: '', description: '', price: '', category: 'Hambúrgueres', costPrice: '' });
    
    useEffect(() => {
        if (product) setForm({ name: product.name, description: product.description || '', price: product.price, category: product.category, costPrice: product.costPrice || '' });
        else setForm({ name: '', description: '', price: '', category: 'Hambúrgueres', costPrice: '' });
    }, [product, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(product?.id || null, { ...form, price: parseFloat(form.price), costPrice: form.costPrice ? parseFloat(form.costPrice) : 0 });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl">
                <h3 className="font-bold text-xl text-white mb-4">{product ? 'Editar' : 'Novo'} Produto</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input required placeholder="Nome do Produto" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    <textarea placeholder="Descrição" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white h-20" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                        <input required type="number" step="0.01" placeholder="Preço Venda" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                        <input type="number" step="0.01" placeholder="Preço Custo" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Categoria</label>
                        <div className="flex gap-2 mb-2">
                             <select className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                                 {existingCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                             </select>
                        </div>
                        <input placeholder="Ou digite nova categoria..." className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm" onChange={e => e.target.value && setForm({...form, category: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl mt-2">Salvar Produto</button>
                </form>
                <button onClick={onClose} className="w-full mt-2 text-slate-500 py-2">Cancelar</button>
            </div>
        </div>
    );
}

export function EditClientModal({ client, orders, onClose, onUpdateOrder, onSave }: any) {
    const [form, setForm] = useState({ name: client.name, phone: client.phone, address: client.address || '', obs: client.obs || '' });
    
    // Filtra últimos pedidos
    const clientOrders = orders.filter((o: Order) => normalizePhone(o.phone) === normalizePhone(client.phone)).slice(0, 5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 p-6 shadow-2xl flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
                <div className="flex-1">
                    <h3 className="font-bold text-xl text-white mb-4">Editar Cliente</h3>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input required placeholder="Nome" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        <input required placeholder="Telefone" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                        <input placeholder="Endereço Padrão" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                        <textarea placeholder="Observações do Cliente" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white h-24" value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} />
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl mt-2">Salvar Dados</button>
                    </form>
                    <button onClick={onClose} className="w-full mt-2 text-slate-500 py-2">Fechar</button>
                </div>
                <div className="flex-1 border-l border-slate-800 pl-0 md:pl-6 pt-6 md:pt-0 border-t md:border-t-0">
                    <h4 className="font-bold text-white mb-4">Últimos Pedidos</h4>
                    <div className="space-y-2">
                        {clientOrders.length === 0 ? <p className="text-slate-500 text-sm">Nenhum pedido recente.</p> : clientOrders.map((o: Order) => (
                            <div key={o.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                                <div className="flex justify-between mb-1"><span className="text-white font-bold">{formatDate(o.createdAt)}</span><span className="text-emerald-400 font-bold">{formatCurrency(o.value)}</span></div>
                                <p className="text-slate-400 line-clamp-2">{o.items}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NewLeadNotificationModal({ onClose }: any) {
    return (
        <GenericAlertModal 
            isOpen={true} 
            title="Novo Lead!" 
            message="Um novo cliente se cadastrou." 
            onClose={onClose}
        />
    );
}

export function GiveawayManagerModal({ entries, onClose, appConfig }: any) {
    const [winner, setWinner] = useState<any>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleDraw = () => {
        if (entries.length === 0) return alert("Nenhum participante!");
        setIsAnimating(true);
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * entries.length);
            setWinner(entries[randomIndex]);
            setIsAnimating(false);
        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-purple-500 p-8 shadow-2xl text-center relative overflow-hidden">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                 <Trophy size={64} className="text-amber-400 mx-auto mb-4 drop-shadow-lg" />
                 <h3 className="font-black text-2xl text-white mb-2 uppercase">Sorteio Oficial</h3>
                 <p className="text-slate-400 mb-6">{entries.length} participantes registrados</p>
                 
                 {isAnimating ? (
                     <div className="py-10">
                         <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-pulse">
                             SORTEANDO...
                         </div>
                     </div>
                 ) : winner ? (
                     <div className="bg-gradient-to-br from-purple-900/50 to-slate-900 p-6 rounded-2xl border border-purple-500/50 animate-in zoom-in">
                         <p className="text-purple-300 text-sm font-bold uppercase mb-2">O Vencedor é:</p>
                         <h2 className="text-3xl font-black text-white mb-1">{winner.name}</h2>
                         <p className="text-slate-400 font-mono text-lg mb-4">{winner.phone}</p>
                         <button onClick={() => window.open(`https://wa.me/55${normalizePhone(winner.phone)}?text=Parabéns! Você ganhou o sorteio!`, '_blank')} className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 mx-auto">
                             <MessageCircle size={16}/> Avisar Vencedor
                         </button>
                     </div>
                 ) : (
                     <button onClick={handleDraw} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:scale-105 transition-transform uppercase tracking-widest text-lg">
                         Realizar Sorteio
                     </button>
                 )}
            </div>
        </div>
    );
}