
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, PlusCircle, Bike, Store, Minus, Plus, Trash2, Camera, UploadCloud, Users, Edit, MinusCircle, ClipboardPaste, AlertCircle, CheckCircle2, Calendar, FileText, Download, Share2, Save, MapPin, History, AlertTriangle, Clock, ListPlus, Utensils, Settings as SettingsIcon, MessageCircle, Copy, Check, Send, Flame, TrendingUp, DollarSign, ShoppingBag, ArrowRight, Play, Printer, ChevronRight, Gift, QrCode, Search, ExternalLink, Menu, Target, Navigation, Bell, User, ArrowLeft, CreditCard, Banknote, Tag, ThumbsUp, PartyPopper, Trophy } from 'lucide-react';
import { Product, Client, AppConfig, Driver, Order, Vale, DeliveryZone, GiveawayEntry } from '../types';
import { capitalize, compressImage, formatCurrency, normalizePhone, parseCurrency, formatDate, copyToClipboard, generateReceiptText, formatTime, toSentenceCase, getOrderReceivedText, formatOrderId, getDispatchMessage, getProductionMessage, generatePixPayload, checkShopStatus, sendDispatchNotification, downloadCSV } from '../utils';
import { PixIcon } from './Shared';

export function GenericAlertModal({ isOpen, onClose, title, message, type = "info" }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[3100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
            <div className={`bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border-2 relative overflow-hidden ${type === 'error' ? 'border-red-500/50 shadow-red-900/30' : 'border-blue-500/50 shadow-blue-900/30'}`}>
                <div className="flex flex-col items-center text-center mb-6">
                    <div className={`p-4 rounded-full mb-3 animate-bounce ${type === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>{type === 'error' ? <AlertTriangle size={32} className="text-red-400" /> : <AlertCircle size={32} className="text-blue-400" />}</div>
                    <h3 className="font-black text-xl text-white uppercase tracking-wide">{title}</h3>
                    <p className="text-slate-300 font-medium text-sm mt-3 leading-relaxed">{message}</p>
                </div>
                <button onClick={onClose} className={`w-full text-white py-3.5 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>OK, Entendi</button>
            </div>
        </div>
    );
}

export function NewLeadNotificationModal({ lead, onClose, appConfig }: { lead: GiveawayEntry, onClose: () => void, appConfig?: AppConfig }) {
    const [isValidating, setIsValidating] = useState(false);
    const [copied, setCopied] = useState(false);

    if (isValidating) {
        const safeAppName = appConfig?.appName || "Jhans Burgers";
        const phone = normalizePhone(lead.phone);
        const message = `Olá *${lead.name}*! 👋\n\n✅ *PARTICIPAÇÃO CONFIRMADA!*\n\nValidamos seu cadastro no Sorteio do *${safeAppName}*.\nVocê já está concorrendo ao *Combo Casal Classic*! 🍔🍟🥤\n\n🗓️ *Data do Sorteio:* Quarta-feira 04/02/26 às 19h\n📺 *Onde:* Ao vivo no Instagram @jhansburgers\n\nBoa sorte! 🍀`;

        const handleCopy = () => { copyToClipboard(message); setCopied(true); setTimeout(() => setCopied(false), 2000); };
        const handleOpenWhatsapp = () => { if (phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, 'whatsapp-session'); };

        return (
            <div className="fixed inset-0 z-[3200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-500">
                <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border-2 border-purple-500 shadow-purple-500/20 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-xl text-white uppercase tracking-wide">Validar Participação</h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 text-left relative"><p className="text-slate-400 text-xs font-bold uppercase mb-2">Mensagem de Resposta:</p><div className="text-slate-300 text-xs md:text-sm whitespace-pre-wrap font-medium bg-slate-900 p-3 rounded-lg border border-slate-800 max-h-48 overflow-y-auto custom-scrollbar">{message}</div></div>
                    <div className="space-y-3"><button onClick={handleCopy} className={`w-full py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${copied ? 'bg-purple-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}>{copied ? <Check size={20}/> : <Copy size={20}/>}{copied ? 'Mensagem Copiada!' : 'Copiar Resposta'}</button><div className="flex gap-3"><button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-sm transition-colors">Fechar</button>{phone && (<button onClick={handleOpenWhatsapp} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"><MessageCircle size={16}/> Enviar Zap</button>)}</div></div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[3200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-3xl shadow-2xl w-full max-w-sm p-6 border-2 border-purple-500 shadow-purple-500/30 relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-purple-300 hover:text-white z-20"><X size={24}/></button>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-5 rounded-full mb-4 shadow-lg shadow-purple-900/50 animate-bounce"><PartyPopper size={40} className="text-white" /></div>
                    <h3 className="font-black text-2xl text-white mb-1 uppercase tracking-wide drop-shadow-md">Novo Inscrito!</h3>
                    <p className="text-purple-300 text-xs font-bold uppercase tracking-widest mb-6">Campanha Sorteio Combo</p>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/10 w-full mb-6 backdrop-blur-sm">
                        <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Participante</p>
                        <p className="text-xl font-black text-white mb-1">{lead.name}</p>
                        <p className="text-sm font-mono text-emerald-400">{lead.phone}</p>
                        <p className="text-[10px] text-slate-500 mt-2">{formatTime(lead.createdAt)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors text-sm">Fechar</button>
                        <button onClick={() => setIsValidating(true)} className="bg-white hover:bg-slate-200 text-purple-900 font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"><CheckCircle2 size={16}/> Validar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function GiveawayManagerModal({ entries, onClose, appConfig }: { entries: GiveawayEntry[], onClose: () => void, appConfig: AppConfig }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [validatingLead, setValidatingLead] = useState<GiveawayEntry | null>(null);

    const filteredLeads = entries.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm));

    const exportLeads = () => {
        let csv = "Nome,Telefone,Data Cadastro\n";
        entries.forEach((lead: any) => {
            csv += `"${lead.name}",${lead.phone},${formatDate(lead.createdAt)}\n`;
        });
        downloadCSV(csv, 'leads_sorteio.csv');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in">
            <div className="bg-slate-900 rounded-3xl w-full max-w-4xl p-6 border border-slate-800 shadow-2xl relative flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h3 className="font-black text-2xl text-white flex items-center gap-2"><Gift className="text-purple-500"/> Gestão de Sorteio</h3>
                        <p className="text-sm text-slate-400">Total de inscritos: <strong>{entries.length}</strong></p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-4 shrink-0">
                    <div className="relative flex-1">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                       <input 
                           className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:border-purple-500 transition-colors" 
                           placeholder="Buscar por nome ou telefone..." 
                           value={searchTerm} 
                           onChange={e => setSearchTerm(e.target.value)} 
                       />
                    </div>
                    <button onClick={exportLeads} className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 font-bold text-sm flex items-center gap-2 transition-colors shrink-0 shadow-lg">
                       <Download size={18}/> Exportar Excel
                    </button>
                </div>

                {/* CORREÇÃO: Removido absolute inset-0 e ajustado para flex-1 para garantir visibilidade da tabela */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex-1 flex flex-col min-h-0 shadow-inner">
                   <div className="overflow-y-auto custom-scrollbar flex-1">
                       <table className="w-full text-left text-sm text-slate-400">
                           <thead className="bg-slate-900/80 text-slate-200 font-bold uppercase tracking-wider border-b border-slate-800 sticky top-0 backdrop-blur-sm z-10">
                               <tr>
                                   <th className="p-4 pl-6">Nome</th>
                                   <th className="p-4">WhatsApp</th>
                                   <th className="p-4">Data Inscrição</th>
                                   <th className="p-4 text-center">Ação</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-800">
                               {filteredLeads.length === 0 ? (
                                   <tr>
                                       <td colSpan={4} className="p-10 text-center text-slate-500">
                                           {entries.length === 0 ? 'Nenhum participante inscrito ainda.' : 'Nenhum resultado para a busca.'}
                                       </td>
                                   </tr>
                               ) : (
                                   filteredLeads.map((lead: any) => (
                                       <tr key={lead.id} className="hover:bg-slate-800/50 transition-colors">
                                           <td className="p-4 pl-6 font-bold text-white">{lead.name}</td>
                                           <td className="p-4 font-mono text-slate-400">{lead.phone}</td>
                                           <td className="p-4 text-slate-500">{formatDate(lead.createdAt)}</td>
                                           <td className="p-4 text-center">
                                               <button 
                                                   onClick={() => setValidatingLead(lead)}
                                                   className="bg-emerald-900/30 text-emerald-400 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-emerald-500/30 hover:border-emerald-500 flex items-center justify-center gap-2 mx-auto shadow-md"
                                               >
                                                   <CheckCircle2 size={14}/> Validar
                                               </button>
                                           </td>
                                       </tr>
                                   ))
                               )}
                           </tbody>
                       </table>
                   </div>
                </div>
            </div>

            {validatingLead && (
               <GiveawayValidationModal 
                   entry={validatingLead}
                   onClose={() => setValidatingLead(null)}
                   appName={appConfig.appName}
               />
            )}
        </div>
    );
}

export function GiveawayValidationModal({ entry, onClose, appName }: { entry: GiveawayEntry, onClose: () => void, appName: string }) {
    const [copied, setCopied] = useState(false);
    const safeAppName = appName || "Jhans Burgers";
    const phone = normalizePhone(entry.phone);
    const message = `Olá *${entry.name}*! 👋\n\n✅ *PARTICIPAÇÃO CONFIRMADA!*\n\nValidamos seu cadastro no Sorteio do *${safeAppName}*.\nVocê já está concorrendo ao *Combo Casal Classic*! 🍔🍟🥤\n\n🗓️ *Data do Sorteio:* Quarta-feira 04/02/26 às 19h\n📺 *Onde:* Ao vivo no Instagram @jhansburgers\n\nBoa sorte! 🍀`;

    const handleCopy = () => { copyToClipboard(message); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const handleOpenWhatsapp = () => { if (phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, 'whatsapp-session'); };

    return (
        <div className="fixed inset-0 z-[3050] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border-2 border-purple-500 shadow-purple-500/20 relative overflow-hidden">
                <div className="flex flex-col items-center text-center mb-6"><div className="bg-purple-500/20 p-4 rounded-full mb-3 animate-bounce"><ThumbsUp size={32} className="text-purple-400" /></div><h3 className="font-black text-2xl text-white uppercase tracking-wide">Validar Participação</h3><p className="text-purple-300 font-bold text-sm">Enviar confirmação para {entry.name}</p></div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 text-left relative"><p className="text-slate-400 text-xs font-bold uppercase mb-2">Mensagem de Resposta:</p><div className="text-slate-300 text-xs md:text-sm whitespace-pre-wrap font-medium bg-slate-900 p-3 rounded-lg border border-slate-800 max-h-48 overflow-y-auto custom-scrollbar">{message}</div></div>
                <div className="space-y-3"><button onClick={handleCopy} className={`w-full py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${copied ? 'bg-purple-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}>{copied ? <Check size={20}/> : <Copy size={20}/>}{copied ? 'Mensagem Copiada!' : 'Copiar Resposta'}</button><div className="flex gap-3"><button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-sm transition-colors">Fechar</button>{phone && (<button onClick={handleOpenWhatsapp} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"><MessageCircle size={16}/> Enviar Zap</button>)}</div></div>
            </div>
        </div>
    );
}

export function GenericConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", type = "info" }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[3100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
            <div className={`bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border-2 relative overflow-hidden ${type === 'danger' ? 'border-red-500/50 shadow-red-900/30' : 'border-blue-500/50 shadow-blue-900/30'}`}>
                <div className="flex flex-col items-center text-center mb-6">
                    <div className={`p-4 rounded-full mb-3 animate-bounce ${type === 'danger' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                         {type === 'danger' ? <AlertTriangle size={32} className="text-red-400" /> : <AlertCircle size={32} className="text-blue-400" />}
                    </div>
                    <h3 className="font-black text-xl text-white uppercase tracking-wide">{title}</h3>
                    <p className="text-slate-300 font-medium text-sm mt-3 leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-3"><button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold text-sm transition-colors">{cancelText}</button><button onClick={() => { onConfirm(); onClose(); }} className={`flex-1 text-white py-3.5 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmText}</button></div>
            </div>
        </div>
    );
}

export function ProductFormModal({ isOpen, onClose, product, onSave, existingCategories }: any) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            if (product) {
                setName(product.name);
                setPrice(product.price.toString());
                setDescription(product.description || '');
                setCategory(product.category);
            } else {
                setName('');
                setPrice('');
                setDescription('');
                setCategory(existingCategories[0] || 'Hambúrgueres');
            }
        }
    }, [isOpen, product, existingCategories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(product?.id || null, { name, price: parseFloat(price), description, category });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">{product ? 'Editar Produto' : 'Novo Produto'}</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome</label><input required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={name} onChange={e => setName(e.target.value)} /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Preço (R$)</label><input required type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={price} onChange={e => setPrice(e.target.value)} /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Categoria</label><div className="relative"><input list="categories" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={category} onChange={e => setCategory(e.target.value)} /><datalist id="categories">{existingCategories.map((c: string) => <option key={c} value={c} />)}</datalist></div></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Descrição</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none h-24 resize-none" value={description} onChange={e => setDescription(e.target.value)} /></div>
                    <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors">{product ? 'Salvar Alterações' : 'Criar Produto'}</button>
                </form>
            </div>
        </div>
    );
}

export function NewDriverModal({ onClose, onSave, initialData }: any) {
    const [form, setForm] = useState(initialData || { name: '', phone: '', vehicle: 'Moto', plate: '', avatar: 'https://cdn-icons-png.flaticon.com/512/147/147144.png', password: '' });
    const [paymentModel, setPaymentModel] = useState<'fixed_per_delivery' | 'percentage' | 'salary'>('fixed_per_delivery');
    const [paymentRate, setPaymentRate] = useState<string>('5.00');

    useEffect(() => {
        if (initialData) {
            setForm(initialData);
            setPaymentModel(initialData.paymentModel || 'fixed_per_delivery');
            setPaymentRate(initialData.paymentRate?.toString() || '5.00');
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ 
            ...form, 
            status: initialData ? initialData.status : 'offline', 
            lat: 0, 
            lng: 0, 
            battery: 100, 
            paymentModel,
            paymentRate: parseFloat(paymentRate) || 0
        });
        onClose();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const compressed = await compressImage(e.target.files[0]);
                setForm({ ...form, avatar: compressed });
            } catch (err) { console.error(err); }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">{initialData ? 'Editar Motoboy' : 'Novo Motoboy'}</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center mb-4"><div className="relative group cursor-pointer"><img src={form.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-slate-800 object-cover" /><div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" /></div><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAvatarUpload} /></div></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome</label><input required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Telefone</label><input required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Veículo</label><select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})}><option value="Moto">Moto</option><option value="Carro">Carro</option><option value="Bike">Bike</option></select></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Placa</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} /></div></div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800"><label className="text-xs font-bold text-slate-500 uppercase block mb-2">Modelo de Pagamento</label><div className="flex gap-2 mb-3"><button type="button" onClick={() => setPaymentModel('fixed_per_delivery')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${paymentModel === 'fixed_per_delivery' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>Por Entrega</button><button type="button" onClick={() => setPaymentModel('percentage')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${paymentModel === 'percentage' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>Porcentagem</button><button type="button" onClick={() => setPaymentModel('salary')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${paymentModel === 'salary' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>Salário Fixo</button></div>{paymentModel !== 'salary' && (<div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">{paymentModel === 'percentage' ? 'Porcentagem (%)' : 'Valor por Entrega (R$)'}</label><input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={paymentRate} onChange={e => setPaymentRate(e.target.value)} /></div>)}</div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Senha de Acesso</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" placeholder="Opcional" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
                    <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors">Salvar Motoboy</button>
                </form>
            </div>
        </div>
    );
}

export function EditOrderModal({ order, onClose, onSave }: any) {
    const [form, setForm] = useState({ ...order });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(order.id, { customer: form.customer, phone: form.phone, address: form.address, value: parseFloat(form.value), amount: formatCurrency(parseFloat(form.value)), items: form.items, paymentMethod: form.paymentMethod, status: form.status }); onClose(); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">Editar Pedido {formatOrderId(order.id)}</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Cliente</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Telefone</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Endereço</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Itens</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 h-24" value={form.items} onChange={e => setForm({...form, items: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Valor (R$)</label><input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.value} onChange={e => setForm({...form, value: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Pagamento</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} /></div></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Status</label><select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="pending">Pendente</option><option value="preparing">Preparando</option><option value="ready">Pronto</option><option value="assigned">Em Rota</option><option value="delivering">Em Entrega</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option></select></div>
                    <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors">Salvar Alterações</button>
                </form>
            </div>
        </div>
    );
}

export function SettingsModal({ config, onSave, onClose }: any) {
    const [form, setForm] = useState(config);
    const [zones, setZones] = useState<DeliveryZone[]>(config.deliveryZones || []);
    const [schedule, setSchedule] = useState<{ [key: number]: { enabled: boolean, open: string, close: string } }>(config.schedule || {});
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { try { const compressed = await compressImage(e.target.files[0]); setForm({ ...form, appLogoUrl: compressed }); } catch (err) { console.error(err); } } };
    const updateZone = (idx: number, field: string, value: any) => { const newZones = [...zones]; newZones[idx] = { ...newZones[idx], [field]: value }; setZones(newZones); };
    const addZone = () => setZones([...zones, { name: '', fee: 0 }]);
    const removeZone = (idx: number) => setZones(zones.filter((_, i) => i !== idx));
    const updateSchedule = (dayIdx: number, field: string, value: any) => { setSchedule(prev => ({ ...prev, [dayIdx]: { ...(prev[dayIdx] || { enabled: false, open: '18:00', close: '23:00' }), [field]: value } })); };
    const handleSubmit = () => { onSave({ ...form, deliveryZones: zones, schedule }); onClose(); };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-2xl p-6 border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white flex items-center gap-2"><SettingsIcon/> Configurações</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button></div>
                <div className="space-y-6">
                    <div className="space-y-4 border-b border-slate-800 pb-6"><h3 className="text-sm font-bold text-slate-400 uppercase">Geral</h3><div className="flex items-center gap-4"><div className="relative group cursor-pointer w-20 h-20 shrink-0"><div className="w-full h-full bg-slate-800 rounded-xl flex items-center justify-center border-2 border-slate-700 overflow-hidden">{form.appLogoUrl ? <img src={form.appLogoUrl} className="w-full h-full object-cover"/> : <UploadCloud className="text-slate-500"/>}</div><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} /></div><div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome do App</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.appName} onChange={e => setForm({...form, appName: e.target.value})} /></div></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Telefone da Loja (WhatsApp)</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.storePhone || ''} onChange={e => setForm({...form, storePhone: e.target.value})} placeholder="Ex: 11999999999" /></div></div>
                    
                    {/* NOVO: LOCALIZAÇÃO GPS */}
                    <div className="space-y-4 border-b border-slate-800 pb-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2"><MapPin size={16}/> Localização (GPS)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Latitude</label>
                                <input type="number" step="0.000001" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.location?.lat || ''} onChange={e => setForm({...form, location: {...form.location, lat: parseFloat(e.target.value)}})} placeholder="-23.550520" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Longitude</label>
                                <input type="number" step="0.000001" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.location?.lng || ''} onChange={e => setForm({...form, location: {...form.location, lng: parseFloat(e.target.value)}})} placeholder="-46.633308" />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500">Use o Google Maps para pegar as coordenadas exatas da sua loja. Isso centralizará o mapa ao abrir o sistema.</p>
                    </div>

                    <div className="space-y-4 border-b border-slate-800 pb-6"><h3 className="text-sm font-bold text-slate-400 uppercase">Dados PIX</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Chave PIX</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.pixKey || ''} onChange={e => setForm({...form, pixKey: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome Titular</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.pixName || ''} onChange={e => setForm({...form, pixName: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Cidade Titular</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.pixCity || ''} onChange={e => setForm({...form, pixCity: e.target.value})} /></div></div></div>
                    <div className="space-y-4 border-b border-slate-800 pb-6"><h3 className="text-sm font-bold text-slate-400 uppercase">Horário de Funcionamento</h3><div className="space-y-2">{days.map((day, idx) => { const current = schedule[idx] || { enabled: false, open: '18:00', close: '23:00' }; return (<div key={idx} className="flex items-center gap-4 bg-slate-950 p-2 rounded-lg border border-slate-800"><div className="w-24 flex items-center gap-2"><input type="checkbox" checked={current.enabled} onChange={e => updateSchedule(idx, 'enabled', e.target.checked)} className="rounded bg-slate-800 border-slate-600"/><span className={`text-sm font-bold ${current.enabled ? 'text-white' : 'text-slate-500'}`}>{day}</span></div>{current.enabled && (<div className="flex items-center gap-2"><input type="time" value={current.open} onChange={e => updateSchedule(idx, 'open', e.target.value)} className="bg-slate-900 text-white rounded p-1 text-xs border border-slate-700"/><span className="text-slate-500">-</span><input type="time" value={current.close} onChange={e => updateSchedule(idx, 'close', e.target.value)} className="bg-slate-900 text-white rounded p-1 text-xs border border-slate-700"/></div>)}</div>); })}</div></div>
                    <div className="space-y-4"><div className="flex justify-between items-center"><h3 className="text-sm font-bold text-slate-400 uppercase">Taxas de Entrega</h3><div className="flex items-center gap-2"><label className="text-xs text-slate-500 font-bold uppercase mr-2">Ativar Taxas</label><div className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${form.enableDeliveryFees ? 'bg-emerald-500' : 'bg-slate-700'}`} onClick={() => setForm({...form, enableDeliveryFees: !form.enableDeliveryFees})}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${form.enableDeliveryFees ? 'translate-x-5' : 'translate-x-0'}`}></div></div></div></div>{form.enableDeliveryFees && (<div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">{zones.map((zone, idx) => (<div key={idx} className="flex gap-2"><input className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-sm" placeholder="Nome do Bairro" value={zone.name} onChange={e => updateZone(idx, 'name', e.target.value)}/><input type="number" className="w-24 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-sm" placeholder="Valor" value={zone.fee} onChange={e => updateZone(idx, 'fee', parseFloat(e.target.value))}/><button onClick={() => removeZone(idx)} className="p-2 text-red-500 hover:bg-slate-800 rounded-lg"><Trash2 size={16}/></button></div>))}<button onClick={addZone} className="w-full py-2 bg-slate-900 border border-dashed border-slate-700 text-slate-400 rounded-lg text-sm font-bold hover:text-white hover:border-slate-500">+ Adicionar Bairro</button></div>)}</div>
                    <button onClick={handleSubmit} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">Salvar Configurações</button>
                </div>
            </div>
        </div>
    );
}

export function NewValeModal({ driver, onClose, onSave }: any) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ driverId: driver.id, amount: parseFloat(amount), description }); onClose(); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm p-6 border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">Novo Vale</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button></div><div className="mb-4 p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3"><img src={driver.avatar} className="w-10 h-10 rounded-full" /><span className="font-bold text-white">{driver.name}</span></div>
                <form onSubmit={handleSubmit} className="space-y-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Valor (R$)</label><input required type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={amount} onChange={e => setAmount(e.target.value)} /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Descrição</label><input required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" placeholder="Ex: Gasolina" value={description} onChange={e => setDescription(e.target.value)} /></div><button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors">Confirmar Vale</button></form>
            </div>
        </div>
    );
}

export function ImportModal({ onClose, onImportCSV }: any) {
    const [csvText, setCsvText] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-800 shadow-2xl"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">Importar CSV</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button></div><textarea className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs font-mono outline-none focus:border-amber-500 mb-4" placeholder="Cole o conteúdo do CSV aqui..." value={csvText} onChange={e => setCsvText(e.target.value)} /><button onClick={() => onImportCSV(csvText)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">Processar Importação</button></div>
        </div>
    );
}

export function NewExpenseModal({ onClose, onSave }: any) {
    const [form, setForm] = useState({ description: '', amount: '', category: 'Mercado' });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ ...form, amount: parseFloat(form.amount) }); onClose(); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm p-6 border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">Nova Despesa</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button></div>
                <form onSubmit={handleSubmit} className="space-y-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Descrição</label><input required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Valor (R$)</label><input required type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Categoria</label><select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option>Mercado</option><option>Combustível</option><option>Embalagens</option><option>Outros</option></select></div><button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors">Registrar Saída</button></form>
            </div>
        </div>
    );
}

export function EditClientModal({ client, orders, onClose, onUpdateOrder, onSave }: any) {
    const [form, setForm] = useState(client);
    const clientOrders = useMemo(() => orders.filter((o: Order) => normalizePhone(o.phone) === normalizePhone(client.phone)), [orders, client]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-2xl p-6 border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4"><div className="flex justify-between items-center mb-2"><h2 className="text-xl font-bold text-white">Editar Cliente</h2><button onClick={onClose} className="md:hidden text-slate-400 hover:text-white"><X size={24}/></button></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Telefone</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Endereço Principal</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none h-20 resize-none" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Observações Internas</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none h-20 resize-none" value={form.obs || ''} onChange={e => setForm({...form, obs: e.target.value})} /></div><button onClick={() => onSave(form)} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors">Salvar Dados</button><a href={`https://wa.me/55${normalizePhone(form.phone)}`} target="_blank" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors flex items-center justify-center gap-2"><MessageCircle size={18}/> Abrir WhatsApp</a></div>
                <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 overflow-y-auto"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white">Histórico ({clientOrders.length})</h3><button onClick={onClose} className="hidden md:block text-slate-400 hover:text-white"><X size={24}/></button></div><div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">{clientOrders.map((o: Order) => (<div key={o.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800"><div className="flex justify-between items-start mb-1"><span className="font-bold text-white text-xs">{formatDate(o.createdAt)}</span><span className={`text-[10px] px-2 rounded font-bold uppercase ${o.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>{o.status}</span></div><p className="text-xs text-slate-400 line-clamp-2 mb-1">{o.items}</p><p className="text-xs font-bold text-emerald-500">{formatCurrency(o.value)}</p></div>))}</div></div>
            </div>
        </div>
    );
}

export function CloseCycleModal({ data, onClose, onConfirm }: any) {
    const [obs, setObs] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm p-6 border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">Fechar Ciclo</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button></div>
                <div className="space-y-4 mb-6"><div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2"><span className="text-slate-400">Entregas ({data.deliveriesCount})</span><span className="text-emerald-400 font-bold">{formatCurrency(data.deliveriesValue)}</span></div><div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2"><span className="text-slate-400">Vales ({data.valesCount})</span><span className="text-red-400 font-bold">- {formatCurrency(data.valesValue)}</span></div><div className="flex justify-between items-center text-lg pt-2"><span className="text-white font-bold">A Pagar</span><span className="text-emerald-400 font-black text-xl">{formatCurrency(data.netValue)}</span></div></div>
                <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none h-20 resize-none mb-4 text-sm" placeholder="Observações do fechamento..." value={obs} onChange={e => setObs(e.target.value)} />
                <div className="flex gap-3"><button onClick={onClose} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700">Cancelar</button><button onClick={() => onConfirm({...data, obs, startAt: null, endAt: new Date().toISOString()})} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg">Confirmar</button></div>
            </div>
        </div>
    );
}

export function ReceiptModal({ order, onClose, appConfig }: any) {
    const componentRef = useRef<HTMLDivElement>(null);
    const receiptText = generateReceiptText(order, appConfig?.appName || "Delivery", { pixKey: appConfig?.pixKey, pixName: appConfig?.pixName, pixCity: appConfig?.pixCity });
    const handleCopy = () => { copyToClipboard(receiptText); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm p-6 border border-slate-800 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24}/></button><h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Printer size={20}/> Comprovante</h2><div ref={componentRef} className="bg-white text-black p-4 rounded-lg font-mono text-xs leading-relaxed whitespace-pre-wrap mb-6 max-h-[60vh] overflow-y-auto">{receiptText}</div><div className="flex gap-3"><button onClick={handleCopy} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"><Copy size={16}/> Copiar</button><a href={`https://wa.me/55${normalizePhone(order.phone)}?text=${encodeURIComponent(receiptText)}`} target="_blank" rel="noreferrer" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"><MessageCircle size={16}/> Enviar</a></div>
            </div>
        </div>
    );
}

// MODAL APRIMORADO DE DETALHES DO PEDIDO
export function KitchenHistoryModal({ order, onClose, products, totalClientOrders }: any) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-800 shadow-2xl relative animate-in fade-in zoom-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24}/></button>
                <div className="text-center mb-6">
                    <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-700 shadow-lg">
                        <History size={32} className="text-emerald-400"/>
                    </div>
                    <h2 className="text-xl font-bold text-white">Detalhes do Pedido</h2>
                    <p className="text-slate-500 text-sm font-mono bg-slate-950 px-3 py-1 rounded inline-block mt-2">{formatOrderId(order.id)}</p>
                </div>
                
                <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Cliente</p>
                        <div className="flex justify-between items-center">
                            <p className="text-white font-bold text-lg">{order.customer}</p>
                            <span className="flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-900/20 px-2 py-1 rounded">
                                <Trophy size={12}/> {totalClientOrders || 1}º Pedido
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-2 flex items-center gap-1"><MapPin size={12}/> Endereço</p>
                        <p className="text-slate-300 font-medium text-sm leading-relaxed">{order.address}</p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Itens</p>
                        <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm font-medium">{order.items}</p>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-1"><CreditCard size={12}/> Pagamento</p>
                            <p className="text-white font-bold text-sm truncate">{order.paymentMethod || 'Dinheiro'}</p>
                        </div>
                        <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-1"><Clock size={12}/> Horário</p>
                            <p className="text-white font-bold text-sm font-mono">{formatTime(order.createdAt)}</p>
                        </div>
                    </div>
                </div>
                
                <button onClick={onClose} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg">Fechar</button>
            </div>
        </div>
    );
}

// MODAL DE CONFIRMAÇÃO DE SAÍDA PARA ENTREGA (DISPATCH)
export function DispatchSuccessModal({ data, onClose, appName }: any) {
    const [copied, setCopied] = useState(false);
    
    // Removing auto-close timer as per requirement to allow time for copying
    // useEffect(() => { const timer = setTimeout(onClose, 5000); return () => clearTimeout(timer); }, [onClose]);
    
    const handleCopyMessage = () => { 
        const text = getDispatchMessage(data.order, data.driverName, appName);
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        // Do not close immediately, let user see "Copied!"
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in">
            <div className="bg-slate-900 rounded-3xl w-full max-w-sm p-6 border-2 border-emerald-500 shadow-2xl relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={24}/></button>
                <div className="bg-emerald-900/30 p-4 rounded-full inline-block mb-4 shadow-lg shadow-emerald-900/50 border border-emerald-500/30 animate-bounce">
                    <Bike size={40} className="text-emerald-400" />
                </div>
                <h3 className="font-black text-2xl text-white mb-2 uppercase tracking-wide">Saiu para Entrega!</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Pedido <strong>{formatOrderId(data.order.id)}</strong> entregue ao motoboy <strong>{data.driverName}</strong>.
                </p>
                <button 
                    onClick={handleCopyMessage} 
                    className={`w-full font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}
                >
                    {copied ? <Check size={20}/> : <Copy size={20}/>}
                    {copied ? 'Mensagem Copiada!' : 'Copiar Texto para WhatsApp'}
                </button>
            </div>
        </div>
    );
}

export function ProductionSuccessModal({ order, onClose, appName }: any) {
    useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
    const handleSendProductionMessage = () => { const text = getProductionMessage(order, appName); window.open(`https://wa.me/55${normalizePhone(order.phone)}?text=${encodeURIComponent(text)}`, 'whatsapp-session'); };
    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none pb-10 px-4">
            <div className="bg-orange-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-auto animate-in slide-in-from-bottom-10 max-w-sm w-full border-2 border-orange-400"><div className="bg-white/20 p-3 rounded-full animate-pulse"><Flame size={24} /></div><div className="flex-1"><h3 className="font-black text-lg leading-none mb-1">Preparo Iniciado!</h3><p className="text-xs font-medium text-orange-100">O cliente foi notificado?</p></div><button onClick={handleSendProductionMessage} className="bg-white text-orange-600 p-2 rounded-lg font-bold hover:bg-orange-100 transition-colors" title="Enviar Whats"><MessageCircle size={20}/></button></div>
        </div>
    );
}

export function ConfirmCloseOrderModal({ order, onClose, onConfirm }: any) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm p-6 border border-slate-800 shadow-2xl text-center">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30"><AlertCircle size={32} className="text-red-500"/></div><h2 className="text-xl font-bold text-white mb-2">Concluir Pedido Manualmente?</h2><p className="text-slate-400 text-sm mb-6">Isso marcará o pedido <strong>#{formatOrderId(order.id)}</strong> como ENTREGUE/FINALIZADO sem passar pelo motoboy. Deseja continuar?</p><div className="flex gap-3"><button onClick={onClose} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700">Cancelar</button><button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700">Confirmar</button></div>
            </div>
        </div>
    );
}
