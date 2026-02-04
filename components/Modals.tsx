
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Trophy, Shuffle, Search, Users, Edit, Trash2, Check, MessageCircle, Instagram, AlertTriangle, Copy, Printer, AlertCircle, Info, Flame, Bike, Save, Settings, Lock, Store, Clock, MapPin, CreditCard, Smartphone, Image as ImageIcon, Plus, Truck, CalendarClock, Sliders, UploadCloud, RefreshCw, Signal, QrCode, CheckCircle2, DollarSign, Timer, Ban, PlusCircle, Camera, FileText, ChevronRight, Download, History, PackageCheck } from 'lucide-react';
import { normalizePhone, formatDate, formatCurrency, generateReceiptText, printOrderTicket, getProductionMessage, getDispatchMessage, formatPhoneNumberDisplay, compressImage, COUNTRY_CODES, toSentenceCase, formatOrderId, formatTime, copyToClipboard } from '../utils';
import { AppConfig, Product, Order, InventoryItem, GiveawayEntry, Driver, Client, DeliveryZone } from '../types';

export function AdminLoginModal({ onClose, onLogin }: any) {
    const [pass, setPass] = useState('');
    const [remember, setRemember] = useState(true); // Padrão marcado para facilitar
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Passa a senha E a opção de lembrar
        if (onLogin(pass, remember)) {
            onClose();
        } else {
            setError(true);
            setPass('');
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <Lock size={32} className="text-slate-400"/>
                    </div>
                    <h3 className="text-xl font-bold text-white">Área Restrita</h3>
                    <p className="text-slate-500 text-sm">Digite a senha de gerente</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input 
                            type="password" 
                            autoFocus
                            className={`w-full bg-slate-950 border rounded-xl py-3 px-4 text-center text-white text-lg tracking-widest outline-none focus:border-amber-500 transition-colors ${error ? 'border-red-500' : 'border-slate-800'}`}
                            placeholder="••••"
                            value={pass}
                            onChange={e => { setPass(e.target.value); setError(false); }}
                        />
                        {error && <p className="text-red-500 text-xs text-center font-bold animate-pulse mt-2">Senha incorreta</p>}
                    </div>

                    <label className="flex items-center justify-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${remember ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-950 border-slate-700 text-transparent'}`}>
                            <Check size={14} strokeWidth={4} />
                        </div>
                        <input type="checkbox" className="hidden" checked={remember} onChange={e => setRemember(e.target.checked)}/>
                        <span className="text-sm text-slate-400 group-hover:text-white transition-colors select-none">Manter conectado neste dispositivo</span>
                    </label>
                    
                    <button type="submit" className="w-full bg-slate-800 hover:bg-white hover:text-slate-900 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95">
                        Acessar Painel
                    </button>
                </form>
            </div>
        </div>
    );
}

export function GiveawayManagerModal({ entries, onClose, appConfig, onUpdateEntry, onDeleteEntry }: any) {
    const [winner, setWinner] = useState<any>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [search, setSearch] = useState('');
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    
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
        const responseText = `Olá *${entry.name.split(' ')[0]}*! Tudo bem? 🍔✨\n\n` +
        `🎉 *PARABÉNS! Sua inscrição foi confirmada!* 🎉\n\n` +
        `Você já está concorrendo ao nosso *Combo Casal Clássico*! 🍟🥤\n\n` +
        `✅ *Dados Recebidos:*\n` +
        `📱 WhatsApp: ${entry.phone}\n` +
        `📸 Instagram: ${entry.instagram || 'Não informado'}\n\n` +
        `Agora é só torcer! O resultado sai no nosso Instagram. Boa sorte! 🍀🤞\n\n` +
        `*${appConfig.appName}*`;

        copyToClipboard(responseText);
        setCopyFeedback(entry.id);
        
        if (onUpdateEntry) {
            onUpdateEntry(entry.id, { confirmed: true });
        }

        setTimeout(() => setCopyFeedback(null), 2000);
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in">
             <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-purple-500/50 p-6 shadow-2xl relative flex flex-col h-[600px] max-h-[90vh]">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                 
                 <div className="text-center mb-6 shrink-0">
                     <Trophy size={48} className={`mx-auto mb-2 text-amber-400 ${isAnimating ? 'animate-bounce' : ''}`}/>
                     <h2 className="text-2xl font-black text-white uppercase italic">Sorteio Oficial</h2>
                 </div>

                 {/* CONTAINER DO VENCEDOR COM TAMANHO FIXO PARA NÃO DANÇAR */}
                 <div className="mb-6 shrink-0 h-[160px] flex flex-col justify-end">
                     {winner ? (
                         <div className={`bg-purple-900/20 border border-purple-500/50 p-4 rounded-2xl text-center w-full h-full flex flex-col justify-center items-center ${isAnimating ? 'opacity-50' : 'animate-in zoom-in'}`}>
                             <p className="text-purple-300 text-xs font-bold uppercase mb-1">Vencedor(a)</p>
                             <h3 className="text-2xl font-black text-white mb-1 line-clamp-1">{winner.name}</h3>
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
                         <div className="p-4 text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl text-center h-full flex flex-col items-center justify-center">
                             <Shuffle size={24} className="mx-auto mb-2 opacity-50"/>
                             <p className="text-sm">Clique abaixo para sortear entre<br/><b>{entries.length} participantes</b></p>
                         </div>
                     )}
                 </div>

                 <button onClick={pickWinner} disabled={isAnimating || entries.length === 0} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg uppercase tracking-wide text-sm shrink-0 mb-4">
                     {isAnimating ? 'Sorteando...' : 'Sortear Agora'}
                 </button>

                 <div className="flex-1 flex flex-col border-t border-slate-800 pt-4 overflow-hidden min-h-0">
                     <div className="flex justify-between items-center mb-3 shrink-0">
                         <h4 className="font-bold text-white text-sm flex items-center gap-2"><Users size={16}/> Lista ({entries.length})</h4>
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
                                 const isJustCopied = copyFeedback === entry.id;

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
                                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all shadow-md active:scale-90 ${isJustCopied ? 'bg-emerald-500 text-white scale-110' : entry.confirmed ? 'bg-emerald-600/50 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
                                                title={isJustCopied ? "Copiado!" : "Copiar Msg Confirmação"}
                                             >
                                                 {isJustCopied ? <Check size={14} strokeWidth={3}/> : <Copy size={14}/>}
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

export function GenericAlertModal({ isOpen, title, message, type = 'info', onClose }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className={`bg-slate-900 w-full max-w-sm rounded-2xl border ${type === 'error' ? 'border-red-500/50' : 'border-slate-700'} shadow-2xl p-6 text-center`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'error' ? 'bg-red-900/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
                    {type === 'error' ? <AlertTriangle size={32}/> : <Info size={32}/>}
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm mb-6">{message}</p>
                <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors">
                    Entendido
                </button>
            </div>
        </div>
    );
}

export function GenericConfirmModal({ isOpen, title, message, onClose, onConfirm, confirmText = 'Confirmar', type = 'info' }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'danger' ? 'bg-red-900/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
                    {type === 'danger' ? <AlertTriangle size={32}/> : <CheckCircle2 size={32}/>}
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700">Cancelar</button>
                    <button onClick={onConfirm} className={`flex-1 font-bold py-3 rounded-xl shadow-lg ${type === 'danger' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function EditOrderModal({ order, onClose, onSave }: any) {
    const [form, setForm] = useState({...order});
    
    const handleSave = () => {
        onSave(order.id, form);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <h3 className="font-bold text-xl text-white mb-6">Editar Pedido</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cliente</label>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Telefone</label>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Endereço</label>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Itens (Texto)</label>
                        <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-24" value={form.items} onChange={e => setForm({...form, items: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Valor Total (Numérico)</label>
                            <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.value} onChange={e => setForm({...form, value: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Pagamento</label>
                             <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} />
                        </div>
                    </div>
                    <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</label>
                         <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                             <option value="pending">Pendente</option>
                             <option value="preparing">Preparando</option>
                             <option value="ready">Pronto</option>
                             <option value="assigned">Em Rota</option>
                             <option value="delivering">Entregando</option>
                             <option value="completed">Concluído</option>
                             <option value="cancelled">Cancelado</option>
                         </select>
                    </div>
                </div>

                <button onClick={handleSave} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg">Salvar Alterações</button>
            </div>
        </div>
    );
}

export function SettingsModal({ config, onClose, onSave }: any) {
    const [form, setForm] = useState<AppConfig>(config || {});
    const [activeTab, setActiveTab] = useState('horarios'); 
    
    // Estados para gerenciamento de Taxas
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneFee, setNewZoneFee] = useState('');

    const tabs = [
        { id: 'geral', label: 'GERAL', icon: <Store size={18}/> },
        { id: 'pagamento', label: 'PAGAMENTO', icon: <CreditCard size={18}/> },
        { id: 'entrega', label: 'ENTREGA', icon: <Truck size={18}/> },
        { id: 'horarios', label: 'HORÁRIOS', icon: <CalendarClock size={18}/> },
        { id: 'localizacao', label: 'LOCALIZAÇÃO', icon: <MapPin size={18}/> },
        { id: 'sistema', label: 'SISTEMA', icon: <Sliders size={18}/> },
    ];

    const handleScheduleChange = (dayIndex: number, field: string, value: any) => {
        const newSchedule = { ...form.schedule };
        if (!newSchedule[dayIndex]) newSchedule[dayIndex] = { enabled: false, open: '18:00', close: '23:00' };
        
        newSchedule[dayIndex] = {
            ...newSchedule[dayIndex],
            [field]: value
        };
        setForm({ ...form, schedule: newSchedule });
    };

    const handleLocationChange = (field: 'lat' | 'lng', value: string) => {
        setForm({
            ...form,
            location: {
                lat: form.location?.lat || 0,
                lng: form.location?.lng || 0,
                [field]: parseFloat(value) || 0
            }
        });
    };

    const handleImageUpload = async (field: 'appLogoUrl' | 'bannerUrl', file: File) => {
        if (file) {
            try {
                const compressed = await compressImage(file);
                setForm(prev => ({...prev, [field]: compressed}));
            } catch (err) {
                alert("Erro ao processar imagem.");
            }
        }
    };

    // FUNÇÕES DE ZONA DE ENTREGA
    const handleAddZone = () => {
        if (newZoneName && newZoneFee) {
            const fee = parseFloat(newZoneFee.replace(',', '.'));
            const newZone: DeliveryZone = { name: newZoneName, fee };
            const currentZones = form.deliveryZones || [];
            setForm({...form, deliveryZones: [...currentZones, newZone]});
            setNewZoneName('');
            setNewZoneFee('');
        }
    };

    const handleRemoveZone = (index: number) => {
        const currentZones = form.deliveryZones || [];
        const newZones = [...currentZones];
        newZones.splice(index, 1);
        setForm({...form, deliveryZones: newZones});
    };

    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-5xl h-[90vh] md:h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col relative overflow-hidden">
                 
                 {/* Header */}
                 <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
                     <h3 className="font-bold text-white text-xl flex items-center gap-2"><Settings className="text-slate-400"/> Configurações</h3>
                     <button onClick={onClose}><X size={24} className="text-slate-500 hover:text-white transition-colors"/></button>
                 </div>
                 
                 {/* Tabs */}
                 <div className="flex bg-slate-900 border-b border-slate-800 overflow-x-auto shrink-0 px-2 gap-1 justify-between md:justify-start">
                     {tabs.map((tab) => (
                         <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 md:flex-none px-4 py-4 text-xs font-bold whitespace-nowrap border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === tab.id ? 'border-emerald-500 text-white bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                            title={tab.label}
                         >
                             {tab.icon} <span className="hidden md:inline">{tab.label}</span>
                         </button>
                     ))}
                 </div>

                 {/* Content - SCROLLABLE AREA */}
                 <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-900">
                     
                     {/* GERAL - NOVO LAYOUT GRID */}
                     {activeTab === 'geral' && (
                         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Store size={200} className="text-blue-500"/></div>
                                 
                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                                     {/* Lado Esquerdo: Inputs Texto */}
                                     <div className="space-y-6">
                                         <div>
                                             <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">NOME DA LOJA</label>
                                             <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors shadow-inner" value={form.appName || ''} onChange={e => setForm({...form, appName: e.target.value})} placeholder="Ex: Jhans Burgers" />
                                         </div>
                                         <div>
                                             <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">WHATSAPP DA LOJA</label>
                                             <div className="flex gap-2">
                                                 <div className="relative w-20 sm:w-24 shrink-0">
                                                     <select className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-2 pr-6 text-white text-sm outline-none focus:border-blue-500 appearance-none font-bold min-w-0" value={form.storeCountryCode || '+55'} onChange={e => setForm({...form, storeCountryCode: e.target.value})}>
                                                         {COUNTRY_CODES.map((c) => (<option key={c.code} value={c.code}>{c.country} ({c.code})</option>))}
                                                     </select>
                                                 </div>
                                                 <input className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm outline-none focus:border-blue-500 transition-colors shadow-inner min-w-0" value={form.storePhone || ''} onChange={e => setForm({...form, storePhone: e.target.value})} placeholder="(99) 99999-9999" />
                                             </div>
                                         </div>
                                     </div>

                                     {/* Lado Direito: Uploads */}
                                     <div className="grid grid-cols-2 gap-4">
                                         <div className="flex flex-col">
                                             <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">LOGOTIPO</label>
                                             <div className="flex-1 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden hover:border-blue-500 transition-colors min-h-[140px]">
                                                 {form.appLogoUrl ? (<img src={form.appLogoUrl} className="w-full h-full object-cover p-2" />) : (<ImageIcon className="text-slate-700" size={32}/>)}
                                                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><UploadCloud className="text-white"/></div>
                                                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleImageUpload('appLogoUrl', e.target.files?.[0] as File)} />
                                             </div>
                                         </div>
                                         <div className="flex flex-col">
                                             <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">BANNER</label>
                                             <div className="flex-1 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden hover:border-blue-500 transition-colors min-h-[140px]">
                                                 {form.bannerUrl ? (<img src={form.bannerUrl} className="w-full h-full object-cover" />) : (<div className="text-center"><ImageIcon className="text-slate-700 mx-auto mb-2" size={32}/><p className="text-[10px] text-slate-500 font-bold uppercase px-2">PROMOÇÃO</p></div>)}
                                                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><UploadCloud className="text-white"/></div>
                                                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleImageUpload('bannerUrl', e.target.files?.[0] as File)} />
                                             </div>
                                             {form.bannerUrl && (<button onClick={() => setForm({...form, bannerUrl: ''})} className="text-[10px] text-red-500 font-bold mt-1 hover:text-red-400 text-center">Remover</button>)}
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* PAGAMENTO - PIX VERDE CHAMATIVO */}
                     {activeTab === 'pagamento' && (
                         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-900/50 shadow-xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><QrCode size={200} className="text-emerald-500"/></div>
                                 
                                 <div className="bg-emerald-900/20 p-5 rounded-xl border border-emerald-500/50 mb-6 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative z-10">
                                     <h4 className="text-emerald-400 font-black text-sm mb-3 flex items-center gap-2 uppercase tracking-wide"><QrCode size={18}/> Dados para Pix Automático</h4>
                                     <p className="text-xs text-emerald-200/70 mb-4">Estes dados geram o QR Code Copia e Cola no checkout do cliente.</p>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div>
                                             <label className="text-[10px] text-emerald-500 font-bold uppercase mb-1.5 block">CHAVE PIX</label>
                                             <input className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg p-3 text-white outline-none focus:border-emerald-500 font-mono text-sm shadow-inner" value={form.pixKey || ''} onChange={e => setForm({...form, pixKey: e.target.value})} placeholder="CPF, Email, Telefone..." />
                                         </div>
                                         <div>
                                             <label className="text-[10px] text-emerald-500 font-bold uppercase mb-1.5 block">NOME DO TITULAR</label>
                                             <input className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg p-3 text-white outline-none focus:border-emerald-500 text-sm shadow-inner" value={form.pixName || ''} onChange={e => setForm({...form, pixName: e.target.value})} />
                                         </div>
                                         <div>
                                             <label className="text-[10px] text-emerald-500 font-bold uppercase mb-1.5 block">CIDADE DO TITULAR</label>
                                             <input className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg p-3 text-white outline-none focus:border-emerald-500 text-sm shadow-inner" value={form.pixCity || ''} onChange={e => setForm({...form, pixCity: e.target.value})} />
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* ENTREGA - GERENCIAMENTO DE BAIRROS */}
                     {activeTab === 'entrega' && (
                         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Bike size={200} className="text-orange-500"/></div>

                                 <div className="relative z-10">
                                     <div className="flex items-center gap-4 mb-6">
                                         <label className="flex items-center gap-3 cursor-pointer bg-slate-900 p-4 rounded-xl border border-slate-700 hover:border-orange-500 transition-colors w-full md:w-auto">
                                             <input type="checkbox" className="w-5 h-5 rounded border-slate-600 text-orange-500 focus:ring-orange-500 bg-slate-800" checked={form.enableDeliveryFees} onChange={e => setForm({...form, enableDeliveryFees: e.target.checked})}/>
                                             <div>
                                                 <span className="text-sm font-bold text-white block">Ativar Taxas Automáticas</span>
                                                 <span className="text-[10px] text-slate-500 block">Calcula frete por bairro no checkout</span>
                                             </div>
                                         </label>
                                     </div>

                                     {form.enableDeliveryFees && (
                                         <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-inner">
                                             <h4 className="text-orange-400 font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wide"><MapPin size={16}/> Bairros e Taxas</h4>
                                             
                                             <div className="flex flex-col gap-3 mb-4">
                                                 <input 
                                                     className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white outline-none focus:border-orange-500 min-w-0" 
                                                     placeholder="Nome do Bairro"
                                                     value={newZoneName}
                                                     onChange={e => setNewZoneName(e.target.value)}
                                                 />
                                                 <div className="flex gap-2">
                                                     <input 
                                                         type="number"
                                                         className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white outline-none focus:border-orange-500 min-w-0" 
                                                         placeholder="R$ Taxa"
                                                         value={newZoneFee}
                                                         onChange={e => setNewZoneFee(e.target.value)}
                                                     />
                                                     <button 
                                                         onClick={handleAddZone}
                                                         className="bg-orange-600 hover:bg-orange-500 text-white w-12 h-12 rounded-lg transition-colors shadow-lg active:scale-95 shrink-0 flex items-center justify-center"
                                                     >
                                                         <PlusCircle size={24}/>
                                                     </button>
                                                 </div>
                                             </div>

                                             <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                                 {(form.deliveryZones || []).map((zone, idx) => (
                                                     <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                                         <span className="text-sm text-white font-medium">{zone.name}</span>
                                                         <div className="flex items-center gap-4">
                                                             <span className="text-sm text-emerald-400 font-bold bg-emerald-900/20 px-2 py-1 rounded">{formatCurrency(zone.fee)}</span>
                                                             <button onClick={() => handleRemoveZone(idx)} className="text-slate-600 hover:text-red-500 transition-colors">
                                                                 <Trash2 size={16}/>
                                                             </button>
                                                         </div>
                                                     </div>
                                                 ))}
                                                 {(form.deliveryZones || []).length === 0 && (
                                                     <p className="text-center text-slate-500 text-xs py-8 border-2 border-dashed border-slate-800 rounded-lg">Nenhum bairro cadastrado.</p>
                                                 )}
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         </div>
                     )}

                     {activeTab === 'localizacao' && (
                         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                                 {/* Fundo Decorativo */}
                                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                     <MapPin size={200} className="text-blue-500"/>
                                 </div>

                                 <div className="flex items-start gap-4 mb-6 relative z-10">
                                     <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-900/50">
                                         <MapPin size={28} className="text-white"/>
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-white text-lg">Ponto Central do Mapa</h4>
                                         <p className="text-sm text-slate-400 max-w-md mt-1">Defina as coordenadas da sua loja para centralizar o mapa de monitoramento.</p>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                     <div>
                                         <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">LATITUDE</label>
                                         <input 
                                            type="number" 
                                            step="any" 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 font-mono text-sm transition-all shadow-inner focus:shadow-blue-900/20" 
                                            value={form.location?.lat || ''} 
                                            onChange={e => handleLocationChange('lat', e.target.value)} 
                                            placeholder="-23.000000"
                                         />
                                     </div>
                                     <div>
                                         <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">LONGITUDE</label>
                                         <input 
                                            type="number" 
                                            step="any" 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 font-mono text-sm transition-all shadow-inner focus:shadow-blue-900/20" 
                                            value={form.location?.lng || ''} 
                                            onChange={e => handleLocationChange('lng', e.target.value)} 
                                            placeholder="-46.000000"
                                         />
                                     </div>
                                 </div>
                                 
                                 <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-2">
                                     <Info size={12}/> Dica: Você pode pegar esses números clicando com o botão direito no Google Maps.
                                 </div>
                             </div>
                         </div>
                     )}

                     {activeTab === 'sistema' && (
                         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Sliders size={200} className="text-purple-500"/></div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                     <div>
                                         <label className="text-[10px] text-purple-400 font-bold uppercase mb-2 block tracking-wider flex items-center gap-2"><DollarSign size={12}/> Pedido Mínimo (R$)</label>
                                         <input 
                                            type="number" 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-purple-500 text-sm shadow-inner"
                                            placeholder="0.00"
                                            value={form.minOrderValue || ''}
                                            onChange={e => setForm({...form, minOrderValue: parseFloat(e.target.value)})}
                                         />
                                     </div>

                                     <div>
                                         <label className="text-[10px] text-purple-400 font-bold uppercase mb-2 block tracking-wider flex items-center gap-2"><Timer size={12}/> Tempo Estimado (Texto)</label>
                                         <input 
                                            type="text" 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-purple-500 text-sm shadow-inner"
                                            placeholder="Ex: 40-50 min"
                                            value={form.estimatedTime || ''}
                                            onChange={e => setForm({...form, estimatedTime: e.target.value})}
                                         />
                                     </div>
                                 </div>
                                 
                                 <div className="mt-8 pt-6 border-t border-slate-800 relative z-10">
                                     <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Printer size={18}/> Impressora Térmica</h4>
                                     <div className="max-w-xs">
                                         <label className="text-[10px] text-purple-400 font-bold uppercase mb-2 block tracking-wider">LARGURA DO PAPEL</label>
                                         <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-purple-500 text-sm shadow-inner" value={form.printerWidth || '80mm'} onChange={e => setForm({...form, printerWidth: e.target.value as '58mm'|'80mm'})}>
                                             <option value="80mm">80mm (Padrão)</option>
                                             <option value="58mm">58mm (Mini)</option>
                                         </select>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}

                     {activeTab === 'horarios' && (
                         <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative overflow-hidden mb-6 flex-1 flex flex-col">
                                 {/* Fundo Decorativo */}
                                 <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                                     <Clock size={200} className="text-emerald-500"/>
                                 </div>
                                 
                                 <div className="flex items-center justify-between mb-4 relative z-10">
                                     <div>
                                         <h4 className="text-white font-bold flex items-center gap-2 text-lg"><CalendarClock className="text-emerald-500"/> Horário de Funcionamento</h4>
                                         <p className="text-xs text-slate-400">Defina quando sua loja aceita pedidos.</p>
                                     </div>
                                 </div>

                                 {/* LISTA VERTICAL COMPACTA */}
                                 <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar relative z-10">
                                     {days.map((day, idx) => {
                                         const dayConfig = form.schedule?.[idx] || { enabled: false, open: '19:00', close: '23:00' };
                                         const isEnabled = dayConfig.enabled;

                                         return (
                                             <div key={idx} className={`flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl border transition-all duration-200 group gap-3 ${isEnabled ? 'bg-slate-900/80 border-slate-700 hover:border-slate-600' : 'bg-slate-950/50 border-slate-800 opacity-60'}`}>
                                                 
                                                 <div className="flex items-center gap-3 w-full sm:w-32 shrink-0 justify-between sm:justify-start">
                                                     <div className="flex items-center gap-3">
                                                         <label className="relative inline-flex items-center cursor-pointer">
                                                             <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={e => handleScheduleChange(idx, 'enabled', e.target.checked)} />
                                                             <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                                                         </label>
                                                         <span className={`font-bold text-xs ${isEnabled ? 'text-white' : 'text-slate-500'}`}>{day}</span>
                                                     </div>
                                                 </div>

                                                 <div className="w-full sm:flex-1 flex items-center justify-end min-w-0">
                                                     {isEnabled ? (
                                                         <div className="flex items-center justify-center gap-1 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 shadow-inner w-full sm:w-auto">
                                                             <input 
                                                                type="time" 
                                                                className="bg-transparent text-white font-bold text-xs outline-none text-center p-0 w-full sm:w-20" 
                                                                value={dayConfig.open} 
                                                                onChange={e => handleScheduleChange(idx, 'open', e.target.value)} 
                                                             />
                                                             <span className="text-slate-600 font-bold text-[10px] mx-1">ATÉ</span>
                                                             <input 
                                                                type="time" 
                                                                className="bg-transparent text-white font-bold text-xs outline-none text-center p-0 w-full sm:w-20" 
                                                                value={dayConfig.close} 
                                                                onChange={e => handleScheduleChange(idx, 'close', e.target.value)} 
                                                             />
                                                         </div>
                                                     ) : (
                                                         <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-center sm:justify-end gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800/50 w-full sm:w-auto">
                                                             <Ban size={10}/> Fechado
                                                         </span>
                                                     )}
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                             </div>
                         </div>
                     )}
                 </div>

                 <div className="p-5 border-t border-slate-800 bg-slate-950 shrink-0">
                     <button onClick={() => { onSave(form); onClose(); }} className="w-full bg-[#009e60] hover:bg-[#00804d] text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wide">
                         <Save size={20}/> SALVAR ALTERAÇÕES
                     </button>
                 </div>
            </div>
        </div>
    );
}

// ... existing modals (ProductFormModal, ManualOrderModal, ReceiptModal, NewDriverModal, CloseCycleModal, ImportModal, EditClientModal, KitchenHistoryModal, ProductionSuccessModal, ConfirmCloseOrderModal, DispatchSuccessModal) ...
export function ProductFormModal({ isOpen, onClose, product, onSave, existingCategories, inventory }: any) {
    const [form, setForm] = useState(product || { name: '', category: '', price: '', description: '', ingredients: [] });
    const [ingredientId, setIngredientId] = useState('');
    const [ingredientQty, setIngredientQty] = useState('');

    useEffect(() => {
        setForm(product || { name: '', category: '', price: '', description: '', ingredients: [] });
    }, [product, isOpen]);

    const addIngredient = () => {
        if (!ingredientId || !ingredientQty) return;
        const newIngredients = [...(form.ingredients || []), { inventoryId: ingredientId, qty: parseFloat(ingredientQty) }];
        setForm({ ...form, ingredients: newIngredients });
        setIngredientId('');
        setIngredientQty('');
    };

    const removeIngredient = (idx: number) => {
        const newIngredients = [...(form.ingredients || [])];
        newIngredients.splice(idx, 1);
        setForm({ ...form, ingredients: newIngredients });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <h3 className="font-bold text-xl text-white mb-6">{product ? 'Editar Produto' : 'Novo Produto'}</h3>
                
                <form onSubmit={(e) => { e.preventDefault(); onSave(product?.id, form); }} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome</label>
                        <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Categoria</label>
                        <div className="flex gap-2">
                             <input required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})} list="categories" />
                             <datalist id="categories">
                                {existingCategories && existingCategories.map((c: string) => <option key={c} value={c} />)}
                             </datalist>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Preço (R$)</label>
                        <input required type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição</label>
                        <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-20" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Ficha Técnica (Ingredientes)</label>
                        <div className="flex gap-2 mb-2">
                            <select className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs" value={ingredientId} onChange={e => setIngredientId(e.target.value)}>
                                <option value="">Selecione Insumo...</option>
                                {inventory && inventory.map((i: InventoryItem) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                            </select>
                            <input type="number" placeholder="Qtd" className="w-20 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs" value={ingredientQty} onChange={e => setIngredientQty(e.target.value)} />
                            <button type="button" onClick={addIngredient} className="bg-emerald-600 text-white p-2 rounded-lg"><Plus size={16}/></button>
                        </div>
                        <div className="space-y-1">
                            {form.ingredients && form.ingredients.map((ing: any, idx: number) => {
                                const item = inventory?.find((i: InventoryItem) => i.id === ing.inventoryId);
                                return (
                                    <div key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                                        <span className="text-xs text-white">{item?.name || 'Item Removido'} - {ing.qty} {item?.unit}</span>
                                        <button type="button" onClick={() => removeIngredient(idx)} className="text-red-500"><Trash2 size={12}/></button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg mt-4">Salvar Produto</button>
                </form>
            </div>
        </div>
    );
}

export function ManualOrderModal({ initialData, onClose, onSave }: any) {
    const [form, setForm] = useState(initialData || { customer: '', phone: '', address: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <h3 className="font-bold text-xl text-white mb-6">Novo Pedido Manual</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required placeholder="Nome do Cliente" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} />
                    <input required placeholder="Telefone" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    <input required placeholder="Endereço" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg">Criar Pedido</button>
                </form>
            </div>
        </div>
    );
}

export function ReceiptModal({ order, onClose, appConfig }: any) {
    const handlePrint = () => {
        printOrderTicket(order, appConfig);
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative text-black">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-black"><X size={20}/></button>
                <div className="text-center mb-4 border-b pb-4 border-dashed border-gray-300">
                    <h3 className="font-bold text-xl uppercase">{appConfig.appName}</h3>
                    <p className="text-sm">Pedido #{formatOrderId(order.id)}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)} - {formatTime(order.createdAt)}</p>
                </div>
                
                <div className="text-sm space-y-2 mb-4">
                    <p><strong>Cliente:</strong> {order.customer}</p>
                    <p><strong>Tel:</strong> {order.phone}</p>
                    <p><strong>End:</strong> {order.address}</p>
                </div>

                <div className="border-t border-b border-dashed border-gray-300 py-4 mb-4 text-sm">
                    <pre className="font-mono whitespace-pre-wrap text-xs">{order.items}</pre>
                </div>

                <div className="text-right text-sm font-bold mb-6">
                    <p>Total: {formatCurrency(order.value)}</p>
                    <p className="text-xs font-normal text-gray-600">Pagamento: {order.paymentMethod}</p>
                </div>

                <button onClick={handlePrint} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800">
                    <Printer size={18}/> Imprimir
                </button>
            </div>
        </div>
    );
}

export function NewDriverModal({ initialData, onClose, onSave }: any) {
    const [form, setForm] = useState(initialData || { name: '', phone: '', vehicle: '', plate: '', status: 'offline', avatar: 'https://cdn-icons-png.flaticon.com/512/12533/12533583.png' });

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <h3 className="font-bold text-xl text-white mb-6">{initialData ? 'Editar Motoboy' : 'Novo Motoboy'}</h3>
                
                <form onSubmit={(e) => { e.preventDefault(); onSave(form); onClose(); }} className="space-y-4">
                    <input required placeholder="Nome" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    <input required placeholder="Telefone" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    <input placeholder="Veículo (Ex: Moto Honda)" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} />
                    <input placeholder="Placa" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} />
                    <input placeholder="URL Avatar (Opcional)" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.avatar} onChange={e => setForm({...form, avatar: e.target.value})} />
                    
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg">Salvar</button>
                </form>
            </div>
        </div>
    );
}

export function CloseCycleModal({ data, onClose, onConfirm }: any) {
    if (!data) return null;
    return (
        <GenericConfirmModal 
            isOpen={true} 
            title="Fechar Ciclo" 
            message={`Confirma o fechamento do ciclo de ${data.driverName}? Valor a pagar: ${formatCurrency(data.toPay)}.`}
            onClose={onClose}
            onConfirm={() => onConfirm(data)}
            confirmText="Fechar e Pagar"
        />
    );
}

export function ImportModal({ onClose, onImportCSV }: any) {
    const [text, setText] = useState('');

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <h3 className="font-bold text-xl text-white mb-4">Importar Clientes (CSV)</h3>
                <p className="text-xs text-slate-500 mb-4">Formato: Nome,Telefone,Endereço (um por linha)</p>
                <textarea 
                    className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white font-mono"
                    placeholder={"João,11999999999,Rua A\nMaria,11888888888,Rua B"}
                    value={text}
                    onChange={e => setText(e.target.value)}
                />
                <button onClick={() => onImportCSV(text)} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg">Importar</button>
            </div>
        </div>
    );
}

export function EditClientModal({ client, orders, onClose, onSave }: any) {
    const [form, setForm] = useState({...client});

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <h3 className="font-bold text-xl text-white mb-6">Editar Cliente</h3>
                
                <div className="space-y-4">
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome" />
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Telefone" />
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Endereço" />
                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-24" value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} placeholder="Observações" />
                </div>

                <button onClick={() => onSave(form)} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg">Salvar</button>
            </div>
        </div>
    );
}

export function KitchenHistoryModal({ order, onClose, products, totalClientOrders }: any) {
    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <h3 className="font-bold text-xl text-white mb-2">Detalhes do Pedido</h3>
                <p className="text-sm text-slate-500 mb-6">Histórico de {order.customer}</p>
                
                <div className="space-y-2 mb-4">
                    <p className="text-white text-sm"><strong>Pedido:</strong> #{formatOrderId(order.id)}</p>
                    <p className="text-white text-sm"><strong>Total de Pedidos do Cliente:</strong> {totalClientOrders}</p>
                    <p className="text-white text-sm"><strong>Data:</strong> {formatDate(order.createdAt)} - {formatTime(order.createdAt)}</p>
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 mt-2">
                        <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{order.items}</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl">Fechar</button>
            </div>
        </div>
    );
}

export function ProductionSuccessModal({ order, onClose, appName }: any) {
    return (
        <GenericAlertModal 
            isOpen={true} 
            title="Produção Iniciada" 
            message={getProductionMessage(order, appName)}
            onClose={onClose}
        />
    );
}

export function ConfirmCloseOrderModal({ order, onClose, onConfirm }: any) {
    return (
        <GenericConfirmModal 
            isOpen={true} 
            title="Concluir Pedido?" 
            message={`Deseja marcar o pedido de ${order.customer} como concluído?`}
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
}

export function DispatchSuccessModal({ data, onClose, appName }: any) {
    return (
        <GenericAlertModal 
            isOpen={true} 
            title="Entregador Atribuído" 
            message={getDispatchMessage(data.order, data.driverName, appName)}
            onClose={onClose}
        />
    );
}
