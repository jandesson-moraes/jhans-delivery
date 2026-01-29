import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, PlusCircle, Bike, Store, Minus, Plus, Trash2, Camera, UploadCloud, Users, Edit, MinusCircle, ClipboardPaste, AlertCircle, CheckCircle2, Calendar, FileText, Download, Share2, Save, MapPin, History, AlertTriangle, Clock, ListPlus, Utensils, Settings as SettingsIcon, MessageCircle, Copy, Check, Send, Flame, TrendingUp, DollarSign, ShoppingBag, ArrowRight, Play, Printer, ChevronRight, Gift, QrCode, Search, ExternalLink, Menu, Target, Navigation, Bell } from 'lucide-react';
import { Product, Client, AppConfig, Driver, Order, Vale, DeliveryZone } from '../types';
import { capitalize, compressImage, formatCurrency, normalizePhone, parseCurrency, formatDate, copyToClipboard, generateReceiptText, formatTime, toSentenceCase, getOrderReceivedText, formatOrderId, getDispatchMessage, getProductionMessage, generatePixPayload, checkShopStatus } from '../utils';

// --- MODAL GENÉRICO DE CONFIRMAÇÃO (NOVO) ---
export function GenericConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", type = "info" }: any) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
            <div className={`bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border-2 relative overflow-hidden ${type === 'danger' ? 'border-red-500/50 shadow-red-900/30' : 'border-amber-500/50 shadow-amber-900/30'}`}>
                <div className="flex flex-col items-center text-center mb-6">
                    <div className={`p-4 rounded-full mb-3 animate-bounce ${type === 'danger' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                        {type === 'danger' ? <AlertTriangle size={32} className="text-red-400" /> : <AlertCircle size={32} className="text-amber-400" />}
                    </div>
                    <h3 className="font-black text-xl text-white uppercase tracking-wide">{title}</h3>
                    <p className="text-slate-300 font-medium text-sm mt-3 leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3.5 rounded-xl font-bold text-sm transition-colors border border-slate-700"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 text-white py-3.5 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                    >
                        {type === 'danger' ? <Trash2 size={18}/> : <CheckCircle2 size={18}/>} {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

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

export function SettingsModal({ config, onSave, onClose }: any) {
    const [form, setForm] = useState(config || { appName: '', appLogoUrl: '' });
    const [loadingLocation, setLoadingLocation] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
        onClose();
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Seu navegador não suporta geolocalização.");
            return;
        }
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setForm({ ...form, location: { lat: latitude, lng: longitude } });
                setLoadingLocation(false);
            },
            (error) => {
                console.error(error);
                alert("Erro ao obter localização.");
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
             <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-800 animate-in zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2"><SettingsIcon/> Configurações</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Nome da Loja</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.appName} onChange={e => setForm({...form, appName: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Logo URL</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.appLogoUrl} onChange={e => setForm({...form, appLogoUrl: e.target.value})} /></div>
                    
                    {/* NOVA SEÇÃO DE LOCALIZAÇÃO */}
                    <div className="border-t border-slate-800 pt-4 mt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-white">Localização da Loja (Mapa)</h4>
                            <button type="button" onClick={handleGetLocation} className="text-[10px] bg-blue-900/30 text-blue-400 px-3 py-1 rounded-lg border border-blue-500/30 flex items-center gap-1 hover:bg-blue-900/50">
                                <Target size={12}/> {loadingLocation ? 'Detectando...' : 'Detectar Minha Localização'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Latitude</label><input type="number" step="any" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 font-mono text-xs" value={form.location?.lat || ''} onChange={e => setForm({...form, location: { ...form.location, lat: parseFloat(e.target.value) }})} placeholder="-23.55..." /></div>
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Longitude</label><input type="number" step="any" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 font-mono text-xs" value={form.location?.lng || ''} onChange={e => setForm({...form, location: { ...form.location, lng: parseFloat(e.target.value) }})} placeholder="-46.63..." /></div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4 mt-4">
                        <h4 className="text-sm font-bold text-white mb-3">Dados PIX</h4>
                        <div className="space-y-3">
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Chave PIX</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.pixKey || ''} onChange={e => setForm({...form, pixKey: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Nome Titular</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.pixName || ''} onChange={e => setForm({...form, pixName: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Cidade Titular</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.pixCity || ''} onChange={e => setForm({...form, pixCity: e.target.value})} /></div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4 mt-4 flex items-center justify-between">
                         <span className="text-sm font-bold text-white">Ativar Taxas de Entrega?</span>
                         <input type="checkbox" checked={form.enableDeliveryFees || false} onChange={e => setForm({...form, enableDeliveryFees: e.target.checked})} className="w-5 h-5 accent-emerald-500"/>
                    </div>
                    
                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg mt-6">Salvar Configurações</button>
                </form>
             </div>
        </div>
    );
}

export function ImportModal({ onClose, onImportCSV }: any) {
    const [text, setText] = useState('');
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-800 animate-in zoom-in">
                <h3 className="font-bold text-xl text-white mb-4">Importar CSV</h3>
                <textarea className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs font-mono outline-none mb-4" placeholder="Cole o conteúdo do CSV aqui..." value={text} onChange={e => setText(e.target.value)} />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold">Cancelar</button>
                    <button onClick={() => onImportCSV(text)} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Importar</button>
                </div>
            </div>
        </div>
    );
}

export function NewExpenseModal({ onClose, onSave }: any) {
    const [form, setForm] = useState({ description: '', amount: '', category: 'Geral' });
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...form, amount: parseFloat(form.amount) || 0 });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm p-6 border border-slate-800 animate-in zoom-in">
                <h3 className="font-bold text-xl text-white mb-4">Nova Despesa</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <input required type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" placeholder="Valor (R$)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" placeholder="Categoria" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold mt-2">Salvar Despesa</button>
                </form>
                <button onClick={onClose} className="w-full text-slate-500 text-sm mt-3">Cancelar</button>
            </div>
        </div>
    );
}

export function NewValeModal({ driver, onClose, onSave }: any) {
    const [form, setForm] = useState({ amount: '', description: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...form, amount: parseFloat(form.amount) || 0, driverId: driver.id });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm p-6 border border-slate-800 animate-in zoom-in">
                <h3 className="font-bold text-xl text-white mb-2">Novo Vale / Adiantamento</h3>
                <p className="text-slate-400 text-sm mb-4">Para: {driver.name}</p>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input required type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" placeholder="Valor (R$)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                    <input required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" placeholder="Motivo (Ex: Gasolina)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold mt-2">Confirmar Vale</button>
                </form>
                <button onClick={onClose} className="w-full text-slate-500 text-sm mt-3">Cancelar</button>
            </div>
        </div>
    );
}

export function EditClientModal({ client, orders, onClose, onUpdateOrder, onSave }: any) {
    const [form, setForm] = useState(client || {});
    const clientOrders = orders.filter((o: Order) => normalizePhone(o.phone) === normalizePhone(client.phone)).sort((a: any, b: any) => b.createdAt.seconds - a.createdAt.seconds);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-2xl p-6 border border-slate-800 animate-in zoom-in max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-bold text-xl text-white">Detalhes do Cliente</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs text-slate-500 font-bold uppercase">Nome</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                            <div><label className="text-xs text-slate-500 font-bold uppercase">Telefone</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                        </div>
                        <div><label className="text-xs text-slate-500 font-bold uppercase">Endereço</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                        <div><label className="text-xs text-slate-500 font-bold uppercase">Observações Internas (CRM)</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-20" value={form.obs || ''} onChange={e => setForm({...form, obs: e.target.value})} placeholder="Ex: Cliente VIP, gosta de bem passado..." /></div>
                        <button onClick={() => onSave(form)} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Salvar Dados</button>
                    </div>

                    <div className="border-t border-slate-800 pt-6">
                        <h4 className="font-bold text-white mb-4">Histórico de Pedidos ({clientOrders.length})</h4>
                        <div className="space-y-3">
                            {clientOrders.map((o: Order) => (
                                <div key={o.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-slate-400">{formatDate(o.createdAt)}</span>
                                        <span className="font-bold text-white">{formatCurrency(o.value)}</span>
                                    </div>
                                    <p className="text-slate-500 line-clamp-1">{o.items}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CloseCycleModal({ data, onClose, onConfirm }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-800 animate-in zoom-in">
                <h3 className="font-bold text-xl text-white mb-4 text-center">Fechar Ciclo e Pagar</h3>
                
                <div className="bg-slate-950 p-4 rounded-xl space-y-3 mb-6">
                    <div className="flex justify-between"><span className="text-slate-400">Ganhos</span><span className="text-white font-bold">{formatCurrency(data.total)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Vales</span><span className="text-red-400 font-bold">- {formatCurrency(data.vales)}</span></div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between"><span className="text-white">Total a Pagar</span><span className="text-emerald-400 font-bold text-lg">{formatCurrency(data.net)}</span></div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold">Cancelar</button>
                    <button onClick={() => onConfirm(data)} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Confirmar Pagamento</button>
                </div>
            </div>
        </div>
    );
}

export function KitchenHistoryModal({ order, onClose, products }: any) {
    if (!order) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
             <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-800 animate-in zoom-in max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
                    <div>
                        <h3 className="font-bold text-xl text-white">{order.customer}</h3>
                        <p className="text-xs text-slate-500 font-mono">{formatOrderId(order.id)}</p>
                    </div>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <pre className="text-sm text-white font-mono whitespace-pre-wrap">{order.items}</pre>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-slate-500 block text-xs uppercase font-bold">Entrada</span><span className="text-white">{formatTime(order.createdAt)}</span></div>
                        <div><span className="text-slate-500 block text-xs uppercase font-bold">Saída/Conclusão</span><span className="text-white">{order.completedAt ? formatTime(order.completedAt) : '-'}</span></div>
                        <div><span className="text-slate-500 block text-xs uppercase font-bold">Status Final</span><span className="text-emerald-400 font-bold uppercase">{order.status}</span></div>
                    </div>
                </div>
             </div>
        </div>
    );
}

// NewOrderModal
export function NewOrderModal({ onClose, onSave, products, clients }: any) {
    const [form, setForm] = useState({ customer: '', phone: '', address: '', items: '', value: '', paymentMethod: 'Dinheiro' });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...form, value: typeof form.value === 'string' ? parseFloat(form.value) : form.value });
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
             <div className="bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-800 animate-in zoom-in max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-white">Novo Pedido</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="Cliente" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} required/>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="Endereço" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-32 outline-none focus:border-amber-500" placeholder="Itens (1x Burguer...)" value={form.items} onChange={e => setForm({...form, items: e.target.value})} required/>
                    <div className="grid grid-cols-2 gap-3">
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="Valor Total (R$)" type="number" step="0.01" value={form.value} onChange={e => setForm({...form, value: e.target.value})} required/>
                        <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                            <option>Dinheiro</option>
                            <option>PIX</option>
                            <option>Cartão</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl mt-4 shadow-lg">Criar Pedido</button>
                </form>
             </div>
        </div>
    )
}

// EditOrderModal
export function EditOrderModal({ order, onClose, onSave }: any) {
    const [form, setForm] = useState({ ...order, value: order.value });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(order.id, { ...form, value: typeof form.value === 'string' ? parseFloat(form.value) : form.value });
        onClose();
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
             <div className="bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-800 animate-in zoom-in max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-white">Editar Pedido {formatOrderId(order.id)}</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="Cliente" value={form.customer} onChange={e => setForm({...form, customer: e.target.value})} />
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="Endereço" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-32 outline-none focus:border-amber-500" placeholder="Itens" value={form.items} onChange={e => setForm({...form, items: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="Valor" type="number" step="0.01" value={form.value} onChange={e => setForm({...form, value: e.target.value})} />
                        <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                            <option>Dinheiro</option>
                            <option>PIX</option>
                            <option>Cartão</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl mt-4 shadow-lg">Salvar Alterações</button>
                </form>
             </div>
        </div>
    )
}

// ConfirmAssignmentModal
export function ConfirmAssignmentModal({ onClose, onConfirm, order, driverName }: any) {
    if (!order) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-slate-900 rounded-2xl w-full max-w-sm p-6 border border-slate-800 animate-in zoom-in text-center">
                <Bike className="mx-auto text-amber-500 mb-4" size={48} />
                <h3 className="font-bold text-xl text-white mb-2">Confirmar Entrega?</h3>
                <p className="text-slate-400 mb-6">
                    Atribuir pedido de <strong>{order.customer}</strong> para <strong>{driverName}</strong>?
                </p>
                <div className="flex gap-3">
                     <button onClick={onClose} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold">Cancelar</button>
                     <button onClick={onConfirm} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold shadow-lg">Confirmar</button>
                </div>
            </div>
        </div>
    );
}

// NewIncomingOrderModal
export function NewIncomingOrderModal({ order, onClose, appConfig, onAccept }: any) {
    if (!order) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in">
             <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border-2 border-amber-500 shadow-2xl shadow-amber-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20"><Bell size={64} className="text-amber-500 animate-pulse"/></div>
                <h3 className="font-black text-2xl text-white mb-1 uppercase tracking-wider">Novo Pedido!</h3>
                <p className="text-amber-500 font-bold mb-6">Chegou agora via App/Site</p>
                
                <div className="space-y-4 mb-8">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Cliente</p>
                        <p className="text-xl font-bold text-white">{order.customer}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Itens</p>
                        <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-32 overflow-y-auto custom-scrollbar">{order.items}</p>
                    </div>
                    <div className="flex justify-between">
                         <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Valor</p>
                            <p className="text-xl font-bold text-emerald-400">{formatCurrency(order.value)}</p>
                         </div>
                         <div>
                            <p className="text-xs text-slate-500 uppercase font-bold text-right">Pagamento</p>
                            <p className="text-sm font-bold text-white text-right">{order.paymentMethod}</p>
                         </div>
                    </div>
                </div>

                <div className="flex gap-3">
                     <button onClick={onClose} className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-xl font-bold">Ignorar</button>
                     <button onClick={() => { onAccept(order.id, {status: 'preparing'}); onClose(); }} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg animate-pulse">ACEITAR PEDIDO</button>
                </div>
             </div>
        </div>
    );
}

// ProductFormModal
export function ProductFormModal({ isOpen, onClose, product, onSave, existingCategories }: any) {
    const [form, setForm] = useState(product || { name: '', category: '', price: '', description: '' });
    
    // Reset form when product changes
    useEffect(() => {
        if(product) setForm(product);
        else setForm({ name: '', category: '', price: '', description: '' });
    }, [product, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-800 animate-in zoom-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-white">{product ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSave(product?.id, {...form, price: parseFloat(form.price)}); }}>
                    <div className="space-y-3">
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="Nome do Produto" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                        <div className="grid grid-cols-2 gap-3">
                            <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="Preço (R$)" type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                            <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="Categoria" list="categories" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
                            <datalist id="categories">
                                {existingCategories?.map((c: string) => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-24 outline-none focus:border-amber-500" placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold mt-4 shadow-lg">Salvar Produto</button>
                </form>
            </div>
        </div>
    );
}

// ReceiptModal
export function ReceiptModal({ order, onClose, appConfig }: any) {
    const receiptText = generateReceiptText(order, appConfig.appName, { pixKey: appConfig.pixKey, pixName: appConfig.pixName, pixCity: appConfig.pixCity });
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(receiptText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const handlePrint = () => {
        const win = window.open('', '', 'width=300,height=600');
        if (win) {
            win.document.write(`<pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap;">${receiptText}</pre>`);
            win.document.close();
            win.print();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
             <div className="bg-slate-900 rounded-2xl w-full max-w-sm p-6 border border-slate-800 animate-in zoom-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-white">Comprovante</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="bg-white text-black font-mono text-xs p-4 rounded-xl mb-4 max-h-60 overflow-y-auto whitespace-pre-wrap shadow-inner custom-scrollbar">
                    {receiptText}
                </div>
                <div className="flex gap-3">
                     <button onClick={handleCopy} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'}`}>{copied ? 'Copiado' : 'Copiar'}</button>
                     <button onClick={handlePrint} className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700">Imprimir</button>
                </div>
             </div>
        </div>
    );
}