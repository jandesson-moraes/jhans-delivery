
import React, { useState, useEffect } from 'react';
import { X, Trophy, Shuffle, Search, Users, Edit, Trash2, Check, MessageCircle, Instagram, AlertTriangle, Copy, Printer, AlertCircle, Info, Flame, Bike, Save } from 'lucide-react';
import { normalizePhone, formatDate, formatCurrency, generateReceiptText, printOrderTicket } from '../utils';
import { AppConfig, Product, Order, InventoryItem, GiveawayEntry } from '../types';

export function GiveawayManagerModal({ entries, onClose, appConfig, onUpdateEntry, onDeleteEntry }: any) {
    const [winner, setWinner] = useState<any>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [search, setSearch] = useState('');
    
    // Estados para Edição
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{name: string, phone: string, instagram: string}>({ name: '', phone: '', instagram: '' });

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

    const handleConfirmEntry = (entry: any) => {
        // Texto de Confirmação para WhatsApp
        const responseText = `Olá *${entry.name.split(' ')[0]}*! Tudo bem? 🍔✨\n\n` +
        `🎉 *PARABÉNS! Sua inscrição foi confirmada!* 🎉\n\n` +
        `Você já está concorrendo ao nosso *Combo Casal Clássico*! 🍟🥤\n\n` +
        `✅ *Dados Recebidos:*\n` +
        `📱 WhatsApp: ${entry.phone}\n` +
        `📸 Instagram: ${entry.instagram || 'Não informado'}\n\n` +
        `Agora é só torcer! O resultado sai no nosso Instagram. Boa sorte! 🍀🤞\n\n` +
        `*${appConfig.appName}*`;

        const phone = normalizePhone(entry.phone);
        if(phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(responseText)}`, '_blank');

        // Atualiza o banco de dados
        if (onUpdateEntry) {
            onUpdateEntry(entry.id, { confirmed: true });
        }
    };

    const handleEditClick = (entry: any) => {
        setEditingId(entry.id);
        setEditForm({
            name: entry.name,
            phone: entry.phone,
            instagram: entry.instagram || ''
        });
    };

    const handleSaveEdit = (id: string) => {
        if (onUpdateEntry) {
            onUpdateEntry(id, editForm);
        }
        setEditingId(null);
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este participante?")) {
            if (onDeleteEntry) onDeleteEntry(id);
        }
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
                             filteredEntries.map((entry: any, i: number) => {
                                 const isEditing = editingId === entry.id;

                                 if (isEditing) {
                                     return (
                                         <div key={i} className="flex flex-col gap-2 p-3 bg-slate-900 border border-purple-500/50 rounded-lg">
                                             <input className="bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Nome"/>
                                             <input className="bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Telefone"/>
                                             <input className="bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" value={editForm.instagram} onChange={e => setEditForm({...editForm, instagram: e.target.value})} placeholder="Instagram"/>
                                             <div className="flex gap-2 mt-1">
                                                 <button onClick={() => handleSaveEdit(entry.id)} className="flex-1 bg-emerald-600 text-white text-xs font-bold py-1.5 rounded">Salvar</button>
                                                 <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-700 text-slate-300 text-xs font-bold py-1.5 rounded">Cancelar</button>
                                             </div>
                                         </div>
                                     );
                                 }

                                 return (
                                     <div key={i} className="flex justify-between items-center p-2 hover:bg-slate-900 rounded border border-transparent hover:border-slate-800 transition-colors group">
                                         <div>
                                             <p className="text-xs font-bold text-white">{entry.name}</p>
                                             <p className="text-[10px] text-slate-500 font-mono">{normalizePhone(entry.phone)}</p>
                                         </div>
                                         <div className="text-right flex items-center gap-1.5">
                                             <div className="mr-2 text-right hidden sm:block">
                                                 {entry.instagram && <span className="text-[10px] text-purple-400 font-bold block mb-0.5">{entry.instagram}</span>}
                                                 <span className="text-[9px] text-slate-600">{formatDate(entry.createdAt)}</span>
                                             </div>
                                             
                                             <button 
                                                onClick={() => handleEditClick(entry)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
                                                title="Editar Dados"
                                             >
                                                 <Edit size={12}/>
                                             </button>

                                             <button 
                                                onClick={() => handleDeleteClick(entry.id)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors border border-slate-700"
                                                title="Excluir Participante"
                                             >
                                                 <Trash2 size={12}/>
                                             </button>

                                             <button 
                                                onClick={() => handleConfirmEntry(entry)}
                                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all shadow-md active:scale-90 ${entry.confirmed ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
                                                title={entry.confirmed ? "Já confirmado" : "Enviar Confirmação"}
                                             >
                                                 {entry.confirmed ? <Check size={14} strokeWidth={3}/> : <MessageCircle size={14}/>}
                                             </button>
                                         </div>
                                     </div>
                                 );
                             })
                         )}
                     </div>
                 </div>
             </div>
        </div>
    )
}

export function EditOrderModal({ order, onClose, onSave }: any) {
    const [data, setData] = useState(order);
    const handleChange = (f: string, v: any) => setData({...data, [f]: v});

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white text-lg">Editar Pedido</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="space-y-3">
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={data.customer} onChange={e => handleChange('customer', e.target.value)} placeholder="Cliente" />
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={data.address} onChange={e => handleChange('address', e.target.value)} placeholder="Endereço" />
                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-24" value={data.items} onChange={e => handleChange('items', e.target.value)} placeholder="Itens" />
                    <div className="flex gap-2">
                         <input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={data.value} type="number" onChange={e => handleChange('value', parseFloat(e.target.value))} placeholder="Valor" />
                         <input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={data.paymentMethod} onChange={e => handleChange('paymentMethod', e.target.value)} placeholder="Pagamento" />
                    </div>
                </div>
                <button onClick={() => onSave(order.id, data)} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">Salvar Alterações</button>
            </div>
        </div>
    );
}

export function GenericConfirmModal({ isOpen, title, message, onClose, onConfirm, confirmText, type }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in">
            <div className={`bg-slate-900 w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${type === 'danger' ? 'border-red-500/50' : 'border-slate-700'}`}>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${type === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{confirmText || 'Confirmar'}</button>
                </div>
            </div>
        </div>
    );
}

export function ProductFormModal({ isOpen, onClose, product, onSave, existingCategories }: any) {
    if (!isOpen) return null;
    const [form, setForm] = useState(product || { name: '', price: '', category: '', description: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(product?.id, { ...form, price: parseFloat(form.price) });
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white text-lg">{product ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome do Produto" />
                    <input required type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Preço" />
                    <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Categoria" list="categories" />
                    <datalist id="categories">{existingCategories?.map((c: string) => <option key={c} value={c}/>)}</datalist>
                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-24" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descrição" />
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">Salvar</button>
                </form>
            </div>
        </div>
    );
}

export function ReceiptModal({ order, onClose, appConfig }: any) {
    const [copied, setCopied] = useState(false);
    const receiptText = generateReceiptText(order, appConfig?.appName, appConfig);

    const handleCopy = () => {
        if(navigator.clipboard) navigator.clipboard.writeText(receiptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white text-lg">Comprovante</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 h-64 overflow-y-auto">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">{receiptText}</pre>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => printOrderTicket(order, appConfig)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Printer size={18}/> Imprimir</button>
                    <button onClick={handleCopy} className={`flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 ${copied ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                        {copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function KitchenHistoryModal({ order, onClose, products, totalClientOrders }: any) {
    if (!order) return null;
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <h3 className="font-bold text-white text-lg mb-1">{order.customer}</h3>
                <p className="text-slate-400 text-sm mb-4">{order.address}</p>
                
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
                    <p className="text-white whitespace-pre-wrap">{order.items}</p>
                </div>
                
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Info size={14}/>
                    <span>Total de pedidos deste cliente: {totalClientOrders}</span>
                </div>
            </div>
        </div>
    );
}

export function ProductionSuccessModal({ order, onClose, appName }: any) {
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in zoom-in">
             <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-orange-500/50 p-6 text-center">
                 <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Flame size={32} className="text-orange-500 animate-pulse"/>
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">Produção Iniciada!</h3>
                 <p className="text-slate-400 mb-6">O pedido de <b>{order.customer}</b> está sendo preparado.</p>
                 <button onClick={onClose} className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-xl">OK</button>
             </div>
        </div>
    );
}

export function DispatchSuccessModal({ data, onClose, appName }: any) {
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in zoom-in">
             <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-emerald-500/50 p-6 text-center">
                 <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Bike size={32} className="text-emerald-500 animate-bounce"/>
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">Pedido Enviado!</h3>
                 <p className="text-slate-400 mb-6">Entregue ao motoboy <b>{data.driverName}</b>.</p>
                 <button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-xl">Fechar</button>
             </div>
        </div>
    );
}

export function ConfirmCloseOrderModal({ order, onClose, onConfirm }: any) {
    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-emerald-500/50 p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Concluir Pedido?</h3>
                <p className="text-slate-400 mb-6">Tem certeza que deseja marcar o pedido de <b>{order.customer}</b> como CONCLUÍDO/ENTREGUE?</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors">Confirmar</button>
                </div>
            </div>
        </div>
    );
}

export function GenericAlertModal({ isOpen, title, message, onClose }: any) {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-6 shadow-2xl text-center">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info size={24} className="text-slate-400"/>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm mb-6">{message}</p>
                <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl">OK</button>
            </div>
        </div>
    );
}

export function GiveawayResponseModal({ entry, onClose, appConfig }: any) {
    const handleConfirm = () => {
        // Implement logic for confirmation if needed here or just close
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-purple-500/50 p-6 shadow-xl">
                 <h3 className="font-bold text-white text-lg mb-2">Responder Sorteio</h3>
                 <p className="text-slate-400 mb-4">Confirmar participação de <b>{entry.name}</b>?</p>
                 <div className="flex gap-3">
                     <button onClick={onClose} className="flex-1 bg-slate-800 text-white py-2 rounded-lg">Cancelar</button>
                     <button onClick={handleConfirm} className="flex-1 bg-purple-600 text-white py-2 rounded-lg">Confirmar</button>
                 </div>
             </div>
        </div>
    );
}
