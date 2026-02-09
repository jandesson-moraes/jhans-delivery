
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Trophy, Shuffle, Search, Users, Edit, Trash2, Check, MessageCircle, Instagram, AlertTriangle, Copy, Printer, AlertCircle, Info, Flame, Bike, Save, Settings, Lock, Store, Clock, MapPin, CreditCard, Smartphone, Image as ImageIcon, Plus, Truck, CalendarClock, Sliders, UploadCloud, RefreshCw, Signal, QrCode, CheckCircle2, DollarSign, Timer, Ban, PlusCircle, Camera, FileText, ChevronRight, Download, History, PackageCheck, Ticket, DownloadCloud, Gift, Mail, Calendar, HelpCircle, FileSpreadsheet, User, Phone, Megaphone, Monitor, Banknote, Navigation, FlaskConical, ShoppingCart, Square, CheckSquare, Wand2, Send, Wallet, Star, Utensils, ChevronDown, Percent, Box, ChevronUp, Type, FileImage, ShieldCheck } from 'lucide-react';
import { normalizePhone, formatDate, formatCurrency, generateReceiptText, printOrderTicket, getProductionMessage, getDispatchMessage, formatPhoneNumberDisplay, compressImage, COUNTRY_CODES, toSentenceCase, formatOrderId, formatTime, copyToClipboard } from '../utils';
import { AppConfig, Product, Order, InventoryItem, GiveawayEntry, Driver, Client, DeliveryZone, GiveawayFieldConfig, ShoppingItem, Supplier } from '../types';
import { PixIcon } from './Shared';

export function AdminLoginModal({ onClose, onLogin }: any) {
    const [pass, setPass] = useState('');
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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

export function GenericAlertModal({ isOpen, title, message, type = 'info', onClose }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-6 shadow-2xl relative text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'error' ? 'bg-red-900/20 text-red-500' : 'bg-blue-900/20 text-blue-500'}`}>
                    {type === 'error' ? <AlertTriangle size={32}/> : <Info size={32}/>}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm mb-6">{message}</p>
                <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors">OK</button>
            </div>
        </div>
    );
}

export function GenericConfirmModal({ isOpen, title, message, onConfirm, onClose, confirmText = 'Confirmar', type = 'info' }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-6 shadow-2xl relative text-center">
                 <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                 <p className="text-slate-400 text-sm mb-6">{message}</p>
                 <div className="flex gap-3">
                     <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors">Cancelar</button>
                     <button onClick={onConfirm} className={`flex-1 font-bold py-3 rounded-xl transition-colors text-white ${type === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{confirmText}</button>
                 </div>
            </div>
        </div>
    );
}

export function GiveawayManagerModal({ entries, onClose, appConfig, onUpdateEntry, onDeleteEntry }: any) {
    const [winner, setWinner] = useState<any>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [search, setSearch] = useState('');
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    
    const fields = appConfig.giveawaySettings?.fields || [];
    const instagramField = fields.find((f:any) => f.id === 'instagram');

    const getFieldValue = (entry: any, fieldId: string) => {
        return entry.dynamicData?.[fieldId] || (entry as any)[fieldId] || '';
    };

    const filteredEntries = entries.filter((e: any) => 
        e.name.toLowerCase().includes(search.toLowerCase()) || 
        e.phone.includes(search)
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
        let details = "";
        if (appConfig.promoDate) details += `\n📅 *Data:* ${appConfig.promoDate}`;
        if (appConfig.promoTime) details += ` às ${appConfig.promoTime}`;
        if (appConfig.promoLocation) details += `\n📍 *Local:* ${appConfig.promoLocation}`;

        const responseText = `Olá *${entry.name.split(' ')[0]}*! Tudo bem? 🍔✨\n\n` +
        `🎉 *PARABÉNS! Sua inscrição foi confirmada!* 🎉\n\n` +
        `Você já está concorrendo ao sorteio *${appConfig.giveawaySettings?.title || 'Oficial'}*! 🍀🤞` +
        (details ? `\n${details}` : '') +
        `\n\n*${appConfig.appName}*`;

        copyToClipboard(responseText);
        setCopyFeedback(entry.id);
        if (onUpdateEntry) onUpdateEntry(entry.id, { confirmed: true });
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este participante?")) {
            if (onDeleteEntry) onDeleteEntry(id);
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in">
             <div className="bg-slate-900 w-full max-w-xl rounded-3xl border border-purple-500/50 p-6 shadow-2xl relative flex flex-col h-[600px] max-h-[90vh]">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                 <div className="text-center mb-6 shrink-0">
                     <Trophy size={48} className={`mx-auto mb-2 text-amber-400 ${isAnimating ? 'animate-bounce' : ''}`}/>
                     <h2 className="text-2xl font-black text-white uppercase italic">Sorteio Oficial</h2>
                 </div>
                 <div className="mb-6 shrink-0 h-[160px] flex flex-col justify-end">
                     {winner ? (
                         <div className={`bg-purple-900/20 border border-purple-500/50 p-4 rounded-2xl text-center w-full h-full flex flex-col justify-center items-center ${isAnimating ? 'opacity-50' : 'animate-in zoom-in'}`}>
                             <p className="text-purple-300 text-xs font-bold uppercase mb-1">Vencedor(a)</p>
                             <h3 className="text-2xl font-black text-white mb-1 line-clamp-1">{winner.name}</h3>
                             <p className="text-slate-400 font-mono text-sm">{normalizePhone(winner.phone)}</p>
                             
                             {instagramField?.enabled && getFieldValue(winner, 'instagram') && (
                                 <a href={`https://instagram.com/${getFieldValue(winner, 'instagram').replace('@','')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-500/30 transition-colors">
                                     <Instagram size={12}/> {getFieldValue(winner, 'instagram')}
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
                             <input className="bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-2 py-1.5 text-xs text-white outline-none focus:border-purple-500 w-32" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                         </div>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 rounded-xl border border-slate-800 p-2 space-y-1">
                         {filteredEntries.map((entry: any, i: number) => {
                                 const isJustCopied = copyFeedback === entry.id;
                                 
                                 const extraFields = fields.filter((f:any) => f.enabled && f.id !== 'name' && f.id !== 'phone' && f.id !== 'instagram');
                                 const instaValue = getFieldValue(entry, 'instagram');

                                 return (
                                     <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-900 rounded border border-transparent hover:border-slate-800 transition-colors group">
                                         <div className="min-w-0 flex-1 mr-2">
                                             <p className="text-xs font-bold text-white truncate">{entry.name}</p>
                                             <p className="text-[10px] text-slate-500 font-mono">{normalizePhone(entry.phone)}</p>
                                             
                                             {instaValue && instagramField?.enabled && (
                                                 <p className="text-[10px] text-purple-400 font-medium truncate mt-0.5"><Instagram size={10} className="inline mr-1"/>{instaValue}</p>
                                             )}

                                             {extraFields.map((f:any) => {
                                                 const val = getFieldValue(entry, f.id);
                                                 if(!val) return null;
                                                 return <p key={f.id} className="text-[9px] text-slate-400 truncate mt-0.5"><b>{f.label}:</b> {val}</p>
                                             })}
                                         </div>
                                         <div className="text-right flex items-center gap-1.5 shrink-0">
                                             <div className="mr-2 text-right hidden sm:block">
                                                 <span className="text-[9px] text-slate-600">{formatDate(entry.createdAt)}</span>
                                             </div>
                                             <button onClick={() => handleDeleteClick(entry.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors border border-slate-700"><Trash2 size={12}/></button>
                                             <button onClick={() => handleConfirmEntry(entry)} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all shadow-md active:scale-90 ${isJustCopied ? 'bg-emerald-500 text-white scale-110' : entry.confirmed ? 'bg-emerald-600/50 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`} title="Confirmar e Copiar Msg">{isJustCopied ? <Check size={14} strokeWidth={3}/> : <MessageCircle size={14}/>}</button>
                                         </div>
                                     </div>
                                 );
                             })}
                     </div>
                 </div>
             </div>
        </div>
    )
}

export function SettingsModal({ config, onClose, onSave, products = [] }: any) {
    const [form, setForm] = useState<AppConfig>(config || {});
    const [activeTab, setActiveTab] = useState('geral');
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneFee, setNewZoneFee] = useState('');
    const [searchProduct, setSearchProduct] = useState('');

    useEffect(() => {
        if (!form.giveawaySettings) {
            setForm(prev => ({
                ...prev,
                giveawaySettings: {
                    active: false,
                    title: 'Sorteio Oficial',
                    rules: '1. Seguir nosso Instagram\n2. Marcar um amigo',
                    fields: [
                        { id: 'name', label: 'Seu Nome', type: 'text', required: true, enabled: true, placeholder: 'Ex: João Silva' },
                        { id: 'phone', label: 'Seu WhatsApp', type: 'phone', required: true, enabled: true, placeholder: '(99) 99999-9999' },
                        { id: 'instagram', label: 'Seu Instagram', type: 'text', required: true, enabled: true, placeholder: '@seu.insta' },
                        { id: 'email', label: 'Seu Email', type: 'email', required: false, enabled: false, placeholder: 'email@exemplo.com' },
                        { id: 'birthdate', label: 'Data de Nascimento', type: 'date', required: false, enabled: false, placeholder: '' },
                        { id: 'custom', label: 'Pergunta Personalizada', type: 'text', required: false, enabled: false, placeholder: 'Sua resposta...' }
                    ]
                }
            }));
        }
        
        if (!form.featuredSettings) {
            setForm(prev => ({
                ...prev,
                featuredSettings: {
                    active: false,
                    title: 'Destaques 🔥',
                    productIds: []
                }
            }));
        }
    }, []);

    const tabs = [
        { id: 'geral', label: 'GERAL', icon: <Store size={18}/> },
        { id: 'promocao', label: 'PROMOÇÃO', icon: <Ticket size={18}/> },
        { id: 'destaques', label: 'DESTAQUES', icon: <Star size={18}/> },
        { id: 'pagamento', label: 'PAGAMENTO', icon: <CreditCard size={18}/> },
        { id: 'entrega', label: 'ENTREGA', icon: <Truck size={18}/> },
        { id: 'horarios', label: 'HORÁRIOS', icon: <CalendarClock size={18}/> },
        { id: 'localizacao', label: 'LOCALIZAÇÃO', icon: <MapPin size={18}/> },
        { id: 'sistema', label: 'SISTEMA', icon: <Sliders size={18}/> },
    ];

    const handleScheduleChange = (dayIndex: number, field: string, value: any) => {
        const newSchedule = { ...form.schedule };
        if (!newSchedule[dayIndex]) newSchedule[dayIndex] = { enabled: false, open: '18:00', close: '23:00' };
        newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: value };
        setForm({ ...form, schedule: newSchedule });
    };

    const handleLocationChange = (field: 'lat' | 'lng', value: string) => {
        setForm({ ...form, location: { lat: form.location?.lat || 0, lng: form.location?.lng || 0, [field]: parseFloat(value) || 0 } });
    };

    const handleImageUpload = async (field: 'appLogoUrl' | 'bannerUrl' | 'welcomeBannerUrl', file: File) => {
        if (file) {
            try { const compressed = await compressImage(file); setForm(prev => ({...prev, [field]: compressed})); } 
            catch (err) { alert("Erro ao processar imagem."); }
        }
    };

    const handleAddZone = () => {
        if (newZoneName && newZoneFee) {
            const fee = parseFloat(newZoneFee.replace(',', '.'));
            const newZone: DeliveryZone = { name: newZoneName, fee };
            setForm({...form, deliveryZones: [...(form.deliveryZones || []), newZone]});
            setNewZoneName(''); setNewZoneFee('');
        }
    };

    const handleRemoveZone = (index: number) => {
        const newZones = [...(form.deliveryZones || [])];
        newZones.splice(index, 1);
        setForm({...form, deliveryZones: newZones});
    };

    const updateGiveawayField = (index: number, key: string, value: any) => {
        if (!form.giveawaySettings) return;
        const newFields = [...form.giveawaySettings.fields];
        newFields[index] = { ...newFields[index], [key]: value };
        setForm({ ...form, giveawaySettings: { ...form.giveawaySettings, fields: newFields } });
    };

    const toggleFeaturedProduct = (productId: string) => {
        if (!form.featuredSettings) return;
        const currentIds = form.featuredSettings.productIds || [];
        const newIds = currentIds.includes(productId) 
            ? currentIds.filter(id => id !== productId)
            : [...currentIds, productId];
        
        setForm({ ...form, featuredSettings: { ...form.featuredSettings, productIds: newIds } });
    };

    // --- FUNÇÃO DE BACKUP MANUAL ---
    const downloadBackup = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(form, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `backup_config_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (window.confirm("Isso irá substituir todas as configurações atuais pelas do arquivo. Tem certeza?")) {
                    setForm(json);
                    alert("Backup carregado! Clique em 'Salvar Alterações' para confirmar.");
                }
            } catch (err) {
                alert("Erro ao ler arquivo de backup. Formato inválido.");
            }
        };
        reader.readAsText(file);
    };

    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-5xl h-[90vh] md:h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col relative overflow-hidden">
                 <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
                     <h3 className="font-bold text-white text-xl flex items-center gap-2"><Settings className="text-slate-400"/> Configurações</h3>
                     <button onClick={onClose}><X size={24} className="text-slate-500 hover:text-white transition-colors"/></button>
                 </div>
                 <div className="flex bg-slate-900 border-b border-slate-800 overflow-x-auto shrink-0 px-2 gap-1 justify-between md:justify-start">
                     {tabs.map((tab) => (
                         <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 md:flex-none px-4 py-4 text-xs font-bold whitespace-nowrap border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === tab.id ? 'border-emerald-500 text-white bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                             {tab.icon} <span className="hidden md:inline">{tab.label}</span>
                         </button>
                     ))}
                 </div>
                 <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-900">
                     
                     {activeTab === 'geral' && (
                         <div className="space-y-6 animate-in fade-in">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Store size={200} className="text-blue-500"/></div>
                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                                     <div className="space-y-6">
                                         <div><label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">NOME DA LOJA</label><input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors shadow-inner" value={form.appName || ''} onChange={e => setForm({...form, appName: e.target.value})} placeholder="Ex: Jhans Burgers" /></div>
                                         <div>
                                             <label className="text-[10px] text-emerald-400 font-bold uppercase mb-2 block tracking-wider flex items-center gap-2"><MessageCircle size={12}/> WHATSAPP DA LOJA (DESTINO DOS PEDIDOS)</label>
                                             <div className="flex gap-2">
                                                 <div className="relative w-24 shrink-0"><select className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-2 pr-6 text-white text-sm outline-none focus:border-blue-500 appearance-none font-bold" value={form.storeCountryCode || '+55'} onChange={e => setForm({...form, storeCountryCode: e.target.value})}>{COUNTRY_CODES.map((c) => (<option key={c.code} value={c.code}>{c.country} ({c.code})</option>))}</select></div>
                                                 <input className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm outline-none focus:border-blue-500 transition-colors shadow-inner" value={form.storePhone || ''} onChange={e => setForm({...form, storePhone: e.target.value})} placeholder="(99) 99999-9999" />
                                             </div>
                                             <p className="text-[10px] text-slate-500 mt-2">
                                                 Insira aqui o número do <b>WhatsApp Business da Loja</b>. Todos os pedidos feitos pelos clientes serão enviados para este número.
                                             </p>
                                         </div>
                                         
                                         <div>
                                             <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider flex items-center gap-2">
                                                 <Megaphone size={12}/> Facebook Pixel ID
                                             </label>
                                             <input 
                                                 className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors shadow-inner font-mono text-sm" 
                                                 value={form.facebookPixelId || ''} 
                                                 onChange={e => setForm({...form, facebookPixelId: e.target.value})} 
                                                 placeholder="Ex: 123456789012345" 
                                             />
                                             <p className="text-[10px] text-slate-500 mt-2">
                                                 Cole apenas o ID numérico do Pixel para rastrear visitas.
                                             </p>
                                         </div>

                                         <div className="flex flex-col"><label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">LOGOTIPO</label><div className="flex-1 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden hover:border-blue-500 transition-colors min-h-[140px]">{form.appLogoUrl ? (<img src={form.appLogoUrl} className="w-full h-full object-cover p-2" />) : (<ImageIcon className="text-slate-700" size={32}/>)}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><UploadCloud className="text-white"/></div><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleImageUpload('appLogoUrl', e.target.files?.[0] as File)} /></div></div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}
                     {activeTab === 'promocao' && (
                         <div className="space-y-6 animate-in fade-in">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Ticket size={200} className="text-amber-500"/></div>
                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                                     <div className="space-y-6">
                                         <div>
                                             <label className="text-[10px] text-amber-400 font-bold uppercase mb-2 block tracking-wider">MODELO DE EXIBIÇÃO (CARDÁPIO)</label>
                                             <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                                                 <button onClick={() => setForm({...form, promoMode: 'card'})} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${(!form.promoMode || form.promoMode === 'card') ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Card</button>
                                                 <button onClick={() => setForm({...form, promoMode: 'banner'})} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${form.promoMode === 'banner' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Banner Full</button>
                                             </div>
                                         </div>
                                         {(!form.promoMode || form.promoMode === 'card') && (
                                             <>
                                                 <div><label className="text-[10px] text-amber-400 font-bold uppercase mb-2 block tracking-wider">TÍTULO PRINCIPAL</label><input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-amber-500 transition-colors shadow-inner" value={form.promoTitle || ''} onChange={e => setForm({...form, promoTitle: e.target.value})} placeholder="Ex: COMBO CASAL CLÁSSICO" /></div>
                                                 <div><label className="text-[10px] text-amber-400 font-bold uppercase mb-2 block tracking-wider">SUBTÍTULO / DESCRIÇÃO</label><input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-amber-500 transition-colors shadow-inner" value={form.promoSubtitle || ''} onChange={e => setForm({...form, promoSubtitle: e.target.value})} placeholder="Ex: Concorra a 2 Hambúrgueres + Batata!" /></div>
                                                 <div className="grid grid-cols-2 gap-4">
                                                     <div><label className="text-[10px] text-amber-400 font-bold uppercase mb-2 block tracking-wider">DATA DO EVENTO</label><div className="relative"><Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-9 pr-3 text-white outline-none focus:border-amber-500 text-sm" value={form.promoDate || ''} onChange={e => setForm({...form, promoDate: e.target.value})} placeholder="Ex: 25/12/2025" /></div></div>
                                                     <div><label className="text-[10px] text-amber-400 font-bold uppercase mb-2 block tracking-wider">HORÁRIO</label><div className="relative"><Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-9 pr-3 text-white outline-none focus:border-amber-500 text-sm" value={form.promoTime || ''} onChange={e => setForm({...form, promoTime: e.target.value})} placeholder="Ex: 20:00h" /></div></div>
                                                 </div>
                                                 <div><label className="text-[10px] text-amber-400 font-bold uppercase mb-2 block tracking-wider">LOCAL</label><div className="relative"><MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-9 pr-3 text-white outline-none focus:border-amber-500 text-sm" value={form.promoLocation || ''} onChange={e => setForm({...form, promoLocation: e.target.value})} placeholder="Ex: Presencial na Loja" /></div></div>
                                             </>
                                         )}
                                         <div className="flex flex-col"><label className="text-[10px] text-amber-400 font-bold uppercase mb-2 block tracking-wider">IMAGEM DO BANNER (CARDÁPIO)</label><div className="flex-1 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden hover:border-amber-500 transition-colors min-h-[140px]">{form.bannerUrl ? (<img src={form.bannerUrl} className={`w-full h-full object-cover ${form.promoMode === 'banner' ? 'object-contain bg-black' : ''}`} />) : (<div className="text-center"><ImageIcon className="text-slate-700 mx-auto mb-2" size={32}/><p className="text-[10px] text-slate-500 font-bold uppercase px-2">CARREGAR IMAGEM</p></div>)}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><UploadCloud className="text-white"/></div><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleImageUpload('bannerUrl', e.target.files?.[0] as File)} /></div>{form.bannerUrl && (<button onClick={() => setForm({...form, bannerUrl: ''})} className="text-[10px] text-red-500 font-bold mt-2 hover:text-red-400 text-center uppercase tracking-wide">Remover Imagem</button>)}</div>
                                     </div>
                                     
                                     {/* CONFIGURAÇÃO DO POPUP DE BOAS-VINDAS */}
                                     <div className="flex flex-col gap-4">
                                         <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
                                             <Monitor size={16} className="text-amber-500"/>
                                             <label className="text-xs text-amber-400 font-bold uppercase tracking-wider">POPUP DE BOAS-VINDAS</label>
                                         </div>
                                         
                                         {/* Toggle Modo */}
                                         <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 mb-2">
                                             <button onClick={() => setForm({...form, welcomeMode: 'image'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${(!form.welcomeMode || form.welcomeMode === 'image') ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>
                                                 <FileImage size={14}/> Imagem
                                             </button>
                                             <button onClick={() => setForm({...form, welcomeMode: 'text'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${form.welcomeMode === 'text' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>
                                                 <Type size={14}/> Texto
                                             </button>
                                         </div>

                                         {(!form.welcomeMode || form.welcomeMode === 'image') ? (
                                             <div className="flex flex-col flex-1">
                                                 <div className="flex-1 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden hover:border-amber-500 transition-colors min-h-[200px]">
                                                     {form.welcomeBannerUrl ? (
                                                         <img src={form.welcomeBannerUrl} className="w-full h-full object-contain bg-black/50" />
                                                     ) : (
                                                         <div className="text-center"><ImageIcon className="text-slate-700 mx-auto mb-2" size={32}/><p className="text-[10px] text-slate-500 font-bold uppercase px-2">CARREGAR POPUP</p></div>
                                                     )}
                                                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><UploadCloud className="text-white"/></div>
                                                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleImageUpload('welcomeBannerUrl', e.target.files?.[0] as File)} />
                                                 </div>
                                                 {form.welcomeBannerUrl && (<button onClick={() => setForm({...form, welcomeBannerUrl: ''})} className="text-[10px] text-red-500 font-bold mt-2 hover:text-red-400 text-center uppercase tracking-wide">Remover Popup</button>)}
                                             </div>
                                         ) : (
                                             <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                                                 <div>
                                                     <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Título</label>
                                                     <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 text-sm" value={form.welcomeTitle || ''} onChange={e => setForm({...form, welcomeTitle: e.target.value})} placeholder="Bem-vindo ao Jhans!" />
                                                 </div>
                                                 <div>
                                                     <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Mensagem</label>
                                                     <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 text-sm h-24 resize-none" value={form.welcomeMessage || ''} onChange={e => setForm({...form, welcomeMessage: e.target.value})} placeholder="Ex: Aproveite nossas promoções de hoje. Entregamos em toda a cidade!" />
                                                 </div>
                                                 <div>
                                                     <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Texto do Botão</label>
                                                     <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 text-sm" value={form.welcomeButtonText || ''} onChange={e => setForm({...form, welcomeButtonText: e.target.value})} placeholder="Ver Cardápio" />
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             </div>
                             <div className="bg-slate-950 p-6 rounded-2xl border border-purple-500/30 relative overflow-hidden">
                                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2"><Gift className="text-purple-500"/> Configuração do Sorteio</h3>
                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                     <div className="space-y-4">
                                         <div><label className="text-[10px] text-purple-400 font-bold uppercase mb-2 block tracking-wider">TÍTULO DO SORTEIO</label><input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-purple-500" value={form.giveawaySettings?.title || ''} onChange={e => setForm({...form, giveawaySettings: {...form.giveawaySettings, title: e.target.value} as any})} placeholder="Ex: Sorteio Casal Clássico" /></div>
                                         <div><label className="text-[10px] text-purple-400 font-bold uppercase mb-2 block tracking-wider">REGRAS (EXIBIDAS NO MODAL)</label><textarea className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-purple-500 h-24 resize-none" value={form.giveawaySettings?.rules || ''} onChange={e => setForm({...form, giveawaySettings: {...form.giveawaySettings, rules: e.target.value} as any})} placeholder="1. Seguir Instagram..." /></div>
                                     </div>
                                     <div><label className="text-[10px] text-purple-400 font-bold uppercase mb-2 block tracking-wider">CAMPOS DO FORMULÁRIO</label><div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">{form.giveawaySettings?.fields.map((field: any, index: number) => (<div key={field.id} className="flex items-center justify-between p-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors"><div className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4 rounded border-slate-600 text-purple-500 bg-slate-800" checked={field.enabled} onChange={(e) => updateGiveawayField(index, 'enabled', e.target.checked)} disabled={field.id === 'name' || field.id === 'phone'} /><div><input className="bg-transparent text-sm font-bold text-white outline-none border-b border-transparent focus:border-purple-500" value={field.label} onChange={(e) => updateGiveawayField(index, 'label', e.target.value)} /><p className="text-[9px] text-slate-500 uppercase">{field.required ? 'Obrigatório' : 'Opcional'}</p></div></div>{field.id !== 'name' && field.id !== 'phone' && (<button onClick={() => updateGiveawayField(index, 'required', !field.required)} className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${field.required ? 'text-red-400 bg-red-900/20' : 'text-slate-500 bg-slate-800'}`}>{field.required ? 'Req' : 'Opc'}</button>)}</div>))}</div></div>
                                 </div>
                             </div>
                         </div>
                     )}
                     {activeTab === 'destaques' && (
                         <div className="space-y-6 animate-in fade-in">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
                                 <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
                                     <div>
                                         <h3 className="font-bold text-white text-lg flex items-center gap-2"><Star className="text-amber-500"/> Carrossel de Destaques</h3>
                                         <p className="text-slate-400 text-sm">Selecione os produtos que aparecerão em destaque no topo do cardápio.</p>
                                     </div>
                                     <label className="relative inline-flex items-center cursor-pointer">
                                         <input type="checkbox" className="sr-only peer" checked={form.featuredSettings?.active} onChange={e => setForm({...form, featuredSettings: {...form.featuredSettings, active: e.target.checked} as any})} />
                                         <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                         <span className="ml-3 text-sm font-medium text-slate-300">Ativar</span>
                                     </label>
                                 </div>

                                 <div className="mb-6">
                                     <label className="text-[10px] text-amber-400 font-bold uppercase mb-2 block tracking-wider">TÍTULO DA SEÇÃO</label>
                                     <input 
                                         className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500" 
                                         value={form.featuredSettings?.title || ''} 
                                         onChange={e => setForm({...form, featuredSettings: {...form.featuredSettings, title: e.target.value} as any})} 
                                         placeholder="Ex: Os Mais Pedidos 🔥" 
                                     />
                                 </div>

                                 <div>
                                     <label className="text-[10px] text-amber-400 font-bold uppercase mb-2 block tracking-wider">SELECIONAR PRODUTOS ({form.featuredSettings?.productIds?.length || 0})</label>
                                     <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
                                         <div className="p-3 border-b border-slate-800 flex items-center gap-2">
                                             <Search size={16} className="text-slate-500"/>
                                             <input 
                                                 className="bg-transparent text-sm text-white outline-none w-full placeholder:text-slate-600" 
                                                 placeholder="Buscar produto..."
                                                 value={searchProduct}
                                                 onChange={e => setSearchProduct(e.target.value)}
                                             />
                                         </div>
                                         <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                             {products
                                                 .filter((p: any) => p.name.toLowerCase().includes(searchProduct.toLowerCase()))
                                                 .map((p: any) => {
                                                     const isSelected = form.featuredSettings?.productIds?.includes(p.id);
                                                     return (
                                                         <div 
                                                             key={p.id} 
                                                             onClick={() => toggleFeaturedProduct(p.id)}
                                                             className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${isSelected ? 'bg-amber-900/20 border-amber-500/50' : 'hover:bg-slate-800 border-transparent'}`}
                                                         >
                                                             <div className="flex items-center gap-3">
                                                                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'bg-slate-950 border-slate-600 text-transparent'}`}>
                                                                     <Check size={14} strokeWidth={3}/>
                                                                 </div>
                                                                 {p.imageUrl ? (
                                                                     <img src={p.imageUrl} className="w-8 h-8 rounded object-cover bg-slate-800"/>
                                                                 ) : (
                                                                     <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-500"><Utensils size={14}/></div>
                                                                 )}
                                                                 <div>
                                                                     <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{p.name}</p>
                                                                     <p className="text-[10px] text-slate-500">{formatCurrency(p.price)}</p>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     )
                                                 })
                                             }
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}
                     {activeTab === 'pagamento' && (
                         <div className="space-y-6 animate-in fade-in">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-900/50 shadow-xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><QrCode size={200} className="text-emerald-500"/></div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                     <div><label className="text-[10px] text-emerald-500 font-bold uppercase mb-1.5 block">CHAVE PIX</label><input className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg p-3 text-white outline-none focus:border-emerald-500 font-mono text-sm shadow-inner" value={form.pixKey || ''} onChange={e => setForm({...form,pixKey: e.target.value})} placeholder="CPF, Email, Telefone..." /></div>
                                     <div><label className="text-[10px] text-emerald-500 font-bold uppercase mb-1.5 block">NOME DO TITULAR</label><input className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg p-3 text-white outline-none focus:border-emerald-500 text-sm shadow-inner" value={form.pixName || ''} onChange={e => setForm({...form, pixName: e.target.value})} /></div>
                                     <div><label className="text-[10px] text-emerald-500 font-bold uppercase mb-1.5 block">CIDADE DO TITULAR</label><input className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg p-3 text-white outline-none focus:border-emerald-500 text-sm shadow-inner" value={form.pixCity || ''} onChange={e => setForm({...form, pixCity: e.target.value})} /></div>
                                 </div>
                             </div>
                         </div>
                     )}
                     {activeTab === 'entrega' && (
                         <div className="space-y-6 animate-in fade-in">
                             <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Bike size={200} className="text-orange-500"/></div>
                                 <div className="relative z-10">
                                     <div className="flex items-center gap-4 mb-6">
                                         <label className="flex items-center gap-3 cursor-pointer bg-slate-900 p-4 rounded-xl border border-slate-700 hover:border-orange-500 transition-colors w-full md:w-auto"><input type="checkbox" className="w-5 h-5 rounded border-slate-600 text-orange-500 focus:ring-orange-500 bg-slate-800" checked={form.enableDeliveryFees} onChange={e => setForm({...form, enableDeliveryFees: e.target.checked})}/><div><span className="text-sm font-bold text-white block">Ativar Taxas Automáticas</span></div></label>
                                     </div>
                                     {form.enableDeliveryFees && (
                                         <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-inner">
                                             <div className="flex flex-col gap-3 mb-4"><input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white outline-none focus:border-orange-500 min-w-0" placeholder="Nome do Bairro" value={newZoneName} onChange={e => setNewZoneName(e.target.value)}/><div className="flex gap-2"><input type="number" className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white outline-none focus:border-orange-500 min-w-0" placeholder="R$ Taxa" value={newZoneFee} onChange={e => setNewZoneFee(e.target.value)}/><button onClick={handleAddZone} className="bg-orange-600 hover:bg-orange-500 text-white w-12 h-12 rounded-lg transition-colors shadow-lg active:scale-95 shrink-0 flex items-center justify-center"><PlusCircle size={24}/></button></div></div>
                                             <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">{(form.deliveryZones || []).map((zone, idx) => (<div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"><span className="text-sm text-white font-medium">{zone.name}</span><div className="flex items-center gap-4"><span className="text-sm text-emerald-400 font-bold bg-emerald-900/20 px-2 py-1 rounded">{formatCurrency(zone.fee)}</span><button onClick={() => handleRemoveZone(idx)} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div></div>))}</div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         </div>
                     )}
                     {activeTab === 'localizacao' && (<div className="space-y-6 animate-in fade-in"><div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative overflow-hidden"><div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><MapPin size={200} className="text-blue-500"/></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"><div><label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">LATITUDE</label><input type="number" step="any" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 font-mono text-sm transition-all shadow-inner" value={form.location?.lat || ''} onChange={e => handleLocationChange('lat', e.target.value)} placeholder="-23.000000"/></div><div><label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">LONGITUDE</label><input type="number" step="any" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 font-mono text-sm transition-all shadow-inner" value={form.location?.lng || ''} onChange={e => handleLocationChange('lng', e.target.value)} placeholder="-46.000000"/></div></div></div></div>)}
                     {activeTab === 'sistema' && (<div className="space-y-6 animate-in fade-in"><div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative overflow-hidden"><div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Sliders size={200} className="text-purple-500"/></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"><div><label className="text-[10px] text-purple-400 font-bold uppercase mb-2 block tracking-wider flex items-center gap-2"><DollarSign size={12}/> Pedido Mínimo (R$)</label><input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-purple-500 text-sm shadow-inner" placeholder="0.00" value={form.minOrderValue || ''} onChange={e => setForm({...form, minOrderValue: parseFloat(e.target.value)})}/></div><div><label className="text-[10px] text-purple-400 font-bold uppercase mb-2 block tracking-wider flex items-center gap-2"><Timer size={12}/> Tempo Estimado (Texto)</label><input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-purple-500 text-sm shadow-inner" placeholder="Ex: 40-50 min" value={form.estimatedTime || ''} onChange={e => setForm({...form, estimatedTime: e.target.value})}/></div></div><div className="mt-8 pt-6 border-t border-slate-800 relative z-10"><h4 className="text-white font-bold mb-4 flex items-center gap-2"><Printer size={18}/> Impressora Térmica</h4><div className="max-w-xs"><label className="text-[10px] text-purple-400 font-bold uppercase mb-2 block tracking-wider">LARGURA DO PAPEL</label><select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-purple-500 text-sm shadow-inner" value={form.printerWidth || '80mm'} onChange={e => setForm({...form, printerWidth: e.target.value as '58mm'|'80mm'})}><option value="80mm">80mm (Padrão)</option><option value="58mm">58mm (Mini)</option></select></div></div></div>
                     
                     <div className="mt-8 pt-6 border-t border-slate-800 relative z-10">
                         <h4 className="text-white font-bold mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-blue-500"/> Segurança & Backup</h4>
                         <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                             <div>
                                 <p className="text-xs text-slate-400 mb-1">Baixe um backup de todas as configurações para segurança.</p>
                                 <p className="text-[10px] text-slate-500">Útil caso os dados precisem ser restaurados manualmente.</p>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={downloadBackup} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors">
                                    <Download size={14}/> Baixar Config
                                </button>
                                <label className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer">
                                    <UploadCloud size={14}/> Restaurar
                                    <input type="file" accept=".json" className="hidden" onChange={handleRestoreBackup} />
                                </label>
                             </div>
                         </div>
                     </div>
                     </div>)}
                     {activeTab === 'horarios' && (<div className="animate-in fade-in h-full flex flex-col"><div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative overflow-hidden mb-6 flex-1 flex flex-col"><div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Clock size={200} className="text-emerald-500"/></div><div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar relative z-10">{days.map((day, idx) => { const dayConfig = form.schedule?.[idx] || { enabled: false, open: '19:00', close: '23:00' }; const isEnabled = dayConfig.enabled; return (<div key={idx} className={`flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl border transition-all duration-200 group gap-3 ${isEnabled ? 'bg-slate-900/80 border-slate-700 hover:border-slate-600' : 'bg-slate-950/50 border-slate-800 opacity-60'}`}><div className="flex items-center gap-3 w-full sm:w-32 shrink-0 justify-between sm:justify-start"><div className="flex items-center gap-3"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={e => handleScheduleChange(idx, 'enabled', e.target.checked)} /><div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white peer-checked:after:border-white"></div></label><span className={`font-bold text-xs ${isEnabled ? 'text-white' : 'text-slate-500'}`}>{day}</span></div></div><div className="w-full sm:flex-1 flex items-center justify-end min-w-0">{isEnabled ? (<div className="flex items-center justify-center gap-1 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 shadow-inner w-full sm:w-auto"><input type="time" className="bg-transparent text-white font-bold text-xs outline-none text-center p-0 w-full sm:w-20" value={dayConfig.open} onChange={e => handleScheduleChange(idx, 'open', e.target.value)} /><span className="text-slate-600 font-bold text-[10px] mx-1">ATÉ</span><input type="time" className="bg-transparent text-white font-bold text-xs outline-none text-center p-0 w-full sm:w-20" value={dayConfig.close} onChange={e => handleScheduleChange(idx, 'close', e.target.value)} /></div>) : (<span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-center sm:justify-end gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800/50 w-full sm:w-auto"><Ban size={10}/> Fechado</span>)}</div></div>); })}</div></div></div>)}
                 </div>
                 <div className="p-5 border-t border-slate-800 bg-slate-950 shrink-0">
                     <button onClick={() => { onSave(form); onClose(); }} className="w-full bg-[#009e60] hover:bg-[#00804d] text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wide"><Save size={20}/> SALVAR ALTERAÇÕES</button>
                 </div>
            </div>
        </div>
    );
}

export function EditOrderModal({ order, onClose, onSave }: any) {
    const [form, setForm] = useState({...order});
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">Editar Pedido {formatOrderId(order.id)}</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="space-y-4">
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Cliente</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Telefone</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Endereço</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Itens</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 h-32" value={form.items} onChange={e => setForm({...form, items: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Valor</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.value} onChange={e => setForm({...form, value: parseFloat(e.target.value)})} /></div>
                        <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Pagamento</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} /></div>
                    </div>
                    <button onClick={() => { onSave(order.id, form); onClose(); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg mt-4">Salvar Alterações</button>
                </div>
            </div>
        </div>
    );
}

export function ProductFormModal({ isOpen, onClose, product, onSave, existingCategories, inventory = [] }: any) {
    if(!isOpen) return null;
    const [form, setForm] = useState(product || { name: '', description: '', price: '', category: 'Hambúrgueres', ingredients: [], available: true });
    
    const handleImageUpload = async (file: File) => {
        try { const compressed = await compressImage(file); setForm({...form, imageUrl: compressed}); } catch(e) { alert('Erro na imagem'); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-700 p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">{product ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-32 h-32 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center relative group overflow-hidden shrink-0">
                            {form.imageUrl ? <img src={form.imageUrl} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-700"/>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => e.target.files && handleImageUpload(e.target.files[0])} />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nome</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Preço</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Categoria</label>
                                    <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                                        {existingCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                        <option value="Nova">+ Nova Categoria</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Descrição</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 h-24" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                    <button onClick={() => { onSave(product?.id, form); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg mt-4">Salvar Produto</button>
                </div>
            </div>
        </div>
    )
}

export function ManualOrderModal({ initialData, onClose, onSave }: any) {
    const [form, setForm] = useState(initialData || { customer: '', phone: '', address: '' });
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">Novo Pedido Manual</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="space-y-4">
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Cliente</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Telefone</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Endereço</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                    <button onClick={() => { 
                        onSave({ ...form, items: 'Pedido Manual', value: 0, status: 'pending', origin: 'manual', createdAt: new Date() });
                        onClose();
                    }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg mt-4">Criar Pedido</button>
                </div>
            </div>
        </div>
    )
}

export function NewDriverModal({ initialData, onClose, onSave }: any) {
    const [form, setForm] = useState(initialData || { name: '', phone: '', vehicle: '', plate: '', paymentModel: 'fixed_per_delivery', paymentRate: 5 });
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">{initialData ? 'Editar' : 'Novo'} Motorista</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="space-y-4">
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nome</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Telefone</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Veículo</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} /></div>
                        <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Placa</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} /></div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Modelo de Pagamento</label>
                        <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.paymentModel} onChange={e => setForm({...form, paymentModel: e.target.value})}>
                            <option value="fixed_per_delivery">Fixo por Entrega</option>
                            <option value="percentage">% do Pedido</option>
                            <option value="salary">Salário Fixo</option>
                        </select>
                    </div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Valor / Taxa</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.paymentRate} onChange={e => setForm({...form, paymentRate: parseFloat(e.target.value)})} /></div>
                    <button onClick={() => { onSave(form); onClose(); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg mt-4">Salvar</button>
                </div>
            </div>
        </div>
    )
}

export function CloseCycleModal({ data, onClose, onConfirm }: any) {
    if(!data) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-6 shadow-2xl text-center">
                <h3 className="font-bold text-xl text-white mb-4">Fechar Ciclo</h3>
                <p className="text-slate-400 mb-6">Confirma o pagamento de <b>{formatCurrency(data.finalAmount)}</b> para <b>{data.driverName}</b>?</p>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cancelar</button>
                    <button onClick={() => onConfirm(data)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">Confirmar</button>
                </div>
            </div>
        </div>
    )
}

export function ImportModal({ onClose, onImportCSV }: any) {
    const [text, setText] = useState('');
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">Importar Clientes (CSV)</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <p className="text-xs text-slate-400 mb-2">Formato: Nome,Telefone,Endereço (um por linha)</p>
                <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 h-60 font-mono text-xs" value={text} onChange={e => setText(e.target.value)} placeholder="João,11999999999,Rua A 123&#10;Maria,11988888888,Av B 456" />
                <button onClick={() => onImportCSV(text)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg mt-4">Importar</button>
            </div>
        </div>
    )
}

export function EditClientModal({ client, onClose, onSave }: any) {
    const [form, setForm] = useState({...client});
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">Editar Cliente</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="space-y-4">
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nome</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Telefone</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Endereço</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Observações</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-24" value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} /></div>
                    <button onClick={() => onSave(form)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg mt-4">Salvar</button>
                </div>
            </div>
        </div>
    )
}

export function ReceiptModal({ order, onClose, appConfig }: any) {
    const handlePrint = () => {
        printOrderTicket(order, appConfig);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-white text-black w-full max-w-xs rounded-xl p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500"><X size={20}/></button>
                <div className="text-center mb-4">
                    <h3 className="font-bold uppercase text-lg">{appConfig.appName}</h3>
                    <p className="text-xs">Pedido {formatOrderId(order.id)}</p>
                    <p className="text-xs">{formatDate(order.createdAt)} - {formatTime(order.createdAt)}</p>
                </div>
                <div className="border-t border-b border-dashed border-gray-400 py-2 mb-4 text-sm space-y-1">
                    <p><b>Cliente:</b> {order.customer}</p>
                    <p><b>Tel:</b> {order.phone}</p>
                    <p><b>End:</b> {order.address}</p>
                </div>
                <div className="text-sm mb-4 whitespace-pre-wrap font-mono leading-tight">
                    {order.items}
                </div>
                <div className="border-t border-dashed border-gray-400 pt-2 text-right">
                    <p className="text-lg font-bold">TOTAL: {formatCurrency(order.value)}</p>
                    <p className="text-xs mt-1">{order.paymentMethod}</p>
                </div>
                <button onClick={handlePrint} className="w-full bg-black text-white font-bold py-2 rounded mt-6 flex items-center justify-center gap-2"><Printer size={16}/> Imprimir</button>
            </div>
        </div>
    )
}

export function KitchenHistoryModal({ order, onClose, products, totalClientOrders }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <h3 className="font-bold text-xl text-white mb-1">Detalhes do Pedido</h3>
                {totalClientOrders > 1 && <p className="text-xs text-amber-500 font-bold mb-2">Este cliente já fez {totalClientOrders} pedidos hoje!</p>}
                <p className="text-slate-400 text-sm mb-4">ID: {formatOrderId(order.id)}</p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
                    <p className="text-white font-medium mb-1">{order.customer}</p>
                    <p className="text-slate-500 text-xs mb-3">{order.address}</p>
                    <div className="text-slate-300 text-sm whitespace-pre-wrap border-t border-slate-800 pt-2">{order.items}</div>
                </div>
                <div className="text-right text-emerald-400 font-bold text-lg">{formatCurrency(order.value)}</div>
            </div>
        </div>
    )
}

export function ProductionSuccessModal({ order, onClose, appName }: any) {
    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, []);
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-slate-900 p-8 rounded-3xl border border-emerald-500/50 shadow-2xl text-center">
                <div className="w-20 h-20 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 animate-bounce">
                    <Flame size={40}/>
                </div>
                <h3 className="text-2xl font-black text-white uppercase">Iniciando Preparo!</h3>
                <p className="text-slate-400 mt-2">Pedido {formatOrderId(order.id)} enviado para a chapa.</p>
            </div>
        </div>
    )
}

export function DispatchSuccessModal({ data, onClose, appName }: any) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, []);
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-slate-900 p-8 rounded-3xl border border-blue-500/50 shadow-2xl text-center">
                <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400 animate-pulse">
                    <Bike size={40}/>
                </div>
                <h3 className="text-2xl font-black text-white uppercase">Saiu para Entrega!</h3>
                <p className="text-slate-400 mt-2">Motorista: <b>{data.driverName}</b></p>
            </div>
        </div>
    )
}

export function ConfirmCloseOrderModal({ order, onClose, onConfirm }: any) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl text-center max-w-sm w-full">
                <h3 className="text-xl font-bold text-white mb-2">Concluir Pedido?</h3>
                <p className="text-slate-400 text-sm mb-6">Isso marcará o pedido como <b>Entregue/Finalizado</b> e sairá da tela de produção.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">Confirmar</button>
                </div>
            </div>
        </div>
    )
}
