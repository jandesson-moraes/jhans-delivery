import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, PlusCircle, Bike, Store, Minus, Plus, Trash2, Camera, UploadCloud, Users, Edit, MinusCircle, ClipboardPaste, AlertCircle, CheckCircle2, Calendar, FileText, Download, Share2, Save, MapPin, History, AlertTriangle, Clock, ListPlus, Utensils, Settings as SettingsIcon, MessageCircle, Copy, Check, Send, Flame, TrendingUp, DollarSign, ShoppingBag, ArrowRight, Play, Printer, ChevronRight, Gift, QrCode, Search, ExternalLink, Menu, Target, Navigation, Bell, User, ArrowLeft, CreditCard, Banknote } from 'lucide-react';
import { Product, Client, AppConfig, Driver, Order, Vale, DeliveryZone } from '../types';
import { capitalize, compressImage, formatCurrency, normalizePhone, parseCurrency, formatDate, copyToClipboard, generateReceiptText, formatTime, toSentenceCase, getOrderReceivedText, formatOrderId, getDispatchMessage, getProductionMessage, generatePixPayload, checkShopStatus } from '../utils';
import { PixIcon } from './Shared';

// --- MODAL GENÉRICO DE ALERTA (NOVO) ---
export function GenericAlertModal({ isOpen, onClose, title, message, type = "info" }: any) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
            <div className={`bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border-2 relative overflow-hidden ${type === 'error' ? 'border-red-500/50 shadow-red-900/30' : 'border-blue-500/50 shadow-blue-900/30'}`}>
                <div className="flex flex-col items-center text-center mb-6">
                    <div className={`p-4 rounded-full mb-3 animate-bounce ${type === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                        {type === 'error' ? <AlertTriangle size={32} className="text-red-400" /> : <AlertCircle size={32} className="text-blue-400" />}
                    </div>
                    <h3 className="font-black text-xl text-white uppercase tracking-wide">{title}</h3>
                    <p className="text-slate-300 font-medium text-sm mt-3 leading-relaxed">
                        {message}
                    </p>
                </div>

                <button 
                    onClick={onClose}
                    className={`w-full text-white py-3.5 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    OK, Entendi
                </button>
            </div>
        </div>
    );
}

// --- MODAL GENÉRICO DE CONFIRMAÇÃO ---
export function GenericConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", type = "info" }: any) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3050] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
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
        <div className="fixed inset-0 z-[3050] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
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
        <div className="fixed inset-0 z-[3050] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
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
        <div className="fixed inset-0 z-[3050] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
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

// NewOrderModal - Restaurado com visual de duas colunas (Cardápio e Form) e Abas em Mobile
export function NewOrderModal({ onClose, onSave, products, clients }: { onClose: () => void, onSave: (data: any) => void, products: Product[], clients: Client[] }) {
    const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [form, setForm] = useState({ customer: '', phone: '', address: '', mapsLink: '', obs: '', value: '', paymentMethod: 'PIX', serviceType: 'delivery', deliveryFee: 0 });
    
    // Alerta Interno
    const [localAlert, setLocalAlert] = useState<{isOpen: boolean, title: string, message: string} | null>(null);

    // --- LÓGICA DE AUTOCOMPLETAR CLIENTE ---
    const [suggestions, setSuggestions] = useState<Client[]>([]);
    const [activeField, setActiveField] = useState<'phone' | 'name' | null>(null);
    
    // NEW STATE: Mobile Tab
    const [mobileTab, setMobileTab] = useState<'menu' | 'checkout'>('menu');
    
    // Ref para detectar clique fora da lista de sugestões
    const suggestionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setSuggestions([]);
                setActiveField(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleClientLookup = (value: string, field: 'phone' | 'name') => {
        // Atualiza valor do form
        setForm(prev => ({ ...prev, [field === 'name' ? 'customer' : field]: value }));
        setActiveField(field);

        const cleanVal = value.trim();
        if (cleanVal.length < 1) {
            setSuggestions([]);
            return;
        }

        const lowerVal = cleanVal.toLowerCase();
        
        // LÓGICA INTELIGENTE PARA TELEFONE
        let rawInput = value.replace(/\D/g, '');
        // Se o input começar com 55 e tiver mais de 11 dígitos (ex: 5592999999999 ou +55...), remove o 55
        if (rawInput.startsWith('55') && rawInput.length > 11) {
            rawInput = rawInput.substring(2);
        }

        const matches = clients.filter(c => {
            if (field === 'phone') {
                const clientPhone = normalizePhone(c.phone);
                // Compara o número limpo do banco com o input limpo (sem +55)
                return clientPhone.includes(rawInput);
            } else {
                return c.name && c.name.toLowerCase().includes(lowerVal);
            }
        }).slice(0, 5); // Limita a 5 sugestões

        setSuggestions(matches);
    };

    const selectClient = (client: Client) => {
        setForm(prev => ({
            ...prev,
            customer: client.name,
            phone: client.phone,
            address: client.address,
            mapsLink: client.mapsLink || '',
            obs: client.obs ? `(Cliente Antigo: ${client.obs})` : '' // Anexa obs antiga se houver
        }));
        setSuggestions([]);
        setActiveField(null);
    };

    // Categorias fixas para ordenação
    const CATEGORY_ORDER = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
    
    const categories = useMemo(() => {
        const unique = Array.from(new Set(products.map((p) => p.category)));
        const sortedUnique = unique.sort((a, b) => {
            const idxA = CATEGORY_ORDER.indexOf(a);
            const idxB = CATEGORY_ORDER.indexOf(b);
            if(idxA !== -1 && idxB !== -1) return idxA - idxB;
            if(idxA !== -1) return -1;
            if(idxB !== -1) return 1;
            return a.localeCompare(b);
        });
        return ['Todos', ...sortedUnique];
    }, [products]);

    // Função auxiliar para agrupar produtos
    const getGroupedProducts = () => {
        if (selectedCategory === 'Todos') {
            const groups: { category: string, items: Product[] }[] = [];
            
            // Ordem: Categorias Prioritárias + Outras
            const allCats = Array.from(new Set(products.map((p) => p.category))).sort((a, b) => {
                const idxA = CATEGORY_ORDER.indexOf(a);
                const idxB = CATEGORY_ORDER.indexOf(b);
                if(idxA !== -1 && idxB !== -1) return idxA - idxB;
                if(idxA !== -1) return -1;
                if(idxB !== -1) return 1;
                return a.localeCompare(b);
            });

            allCats.forEach(cat => {
                const items = products.filter((p) => p.category === cat);
                if (items.length > 0) {
                    groups.push({ category: cat, items });
                }
            });
            return groups;
        } else {
            return [{
                category: selectedCategory,
                items: products.filter((p) => p.category === selectedCategory)
            }];
        }
    };

    const displayGroups = useMemo(() => getGroupedProducts(), [products, selectedCategory]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    }, [cart]);
    
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    const handlePasteFromWhatsApp = async () => {
        try {
            const text = await navigator.clipboard.readText();
            // Lógica simples de parsing (Nome na primeira linha, Endereço na segunda, ou busca por palavras chave)
            // Exemplo simples: Assume formato "Nome: João\nEndereço: Rua X"
            const nameMatch = text.match(/(?:Nome|Cliente):\s*(.*)/i);
            const addressMatch = text.match(/(?:Endereço|Entrega):\s*(.*)/i);
            const phoneMatch = text.match(/(?:Tel|Cel|Whatsapp):\s*(.*)/i);

            setForm(prev => ({
                ...prev,
                customer: nameMatch ? nameMatch[1].trim() : prev.customer,
                address: addressMatch ? addressMatch[1].trim() : prev.address,
                phone: phoneMatch ? phoneMatch[1].trim() : prev.phone
            }));
        } catch (err) {
            setLocalAlert({ isOpen: true, title: "Erro ao Colar", message: "Permissão negada ou erro ao ler área de transferência." });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // GERA ID PADRÃO PED-XXXXXX PARA PEDIDOS MANUAIS/ADMIN
        const generatedId = `PED-${Math.floor(100000 + Math.random() * 900000)}`;

        let itemsText = cart.map(i => `${i.quantity}x ${i.product.name}`).join('\n');
        
        onSave({ 
            id: generatedId,
            ...form, 
            items: itemsText, 
            value: cartTotal,
            origin: 'manual' 
        });
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in">
             <div className="bg-slate-950 w-full max-w-7xl h-[100dvh] md:h-[90vh] md:rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                
                {/* HEADER MOBILE (ABAS) */}
                <div className="md:hidden shrink-0 flex flex-col bg-slate-900 border-b border-slate-800">
                    <div className="flex justify-between items-center p-4">
                        <h3 className="font-bold text-white text-lg">Novo Pedido</h3>
                        <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                    </div>
                    <div className="flex">
                        <button 
                            onClick={() => setMobileTab('menu')} 
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'menu' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}
                        >
                            Cardápio
                        </button>
                        <button 
                            onClick={() => setMobileTab('checkout')} 
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${mobileTab === 'checkout' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-500'}`}
                        >
                            Dados
                            {cartCount > 0 && <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{cartCount}</span>}
                        </button>
                    </div>
                </div>

                {/* COLUNA ESQUERDA: CARDÁPIO (Hidden on Mobile if Checkout active) */}
                <div className={`w-full md:w-2/3 border-r border-slate-800 flex-col bg-slate-900/50 relative ${mobileTab === 'menu' ? 'flex flex-1 overflow-hidden' : 'hidden md:flex'}`}>
                    <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-950 hidden md:block">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">Cardápio</h2>
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {categories.map((cat) => (
                                    <button 
                                        key={cat} 
                                        onClick={() => setSelectedCategory(cat)} 
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Mobile Category Scroll */}
                    <div className="md:hidden flex gap-2 overflow-x-auto p-3 bg-slate-950 border-b border-slate-800 custom-scrollbar shrink-0">
                        {categories.map((cat) => (
                            <button 
                                key={cat} 
                                onClick={() => setSelectedCategory(cat)} 
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 custom-scrollbar space-y-8">
                        {displayGroups.map((group) => (
                            <div key={group.category}>
                                <h3 className="text-amber-500 font-bold text-sm uppercase mb-4 tracking-wider border-l-4 border-amber-500 pl-3">{group.category}</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {group.items.map((p: Product) => (
                                        <button 
                                            key={p.id} 
                                            onClick={() => addToCart(p)}
                                            className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-amber-500/50 hover:bg-slate-800 transition-all text-left group flex flex-col justify-between h-full active:scale-95"
                                        >
                                            <div>
                                                <span className="font-bold text-white text-sm line-clamp-2 mb-1 group-hover:text-amber-400 transition-colors">{p.name}</span>
                                            </div>
                                            <span className="text-emerald-400 font-bold text-xs bg-emerald-900/20 px-2 py-1 rounded-md self-start mt-2">{formatCurrency(p.price)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* MOBILE FLOATING ACTION BUTTON */}
                    <div className="md:hidden absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-slate-950 to-transparent z-20 pointer-events-none">
                        <button 
                            onClick={() => setMobileTab('checkout')}
                            disabled={cartCount === 0}
                            className={`w-full py-4 rounded-xl font-bold flex justify-between items-center px-6 shadow-xl pointer-events-auto transition-all ${cartCount > 0 ? 'bg-emerald-600 text-white active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                        >
                            <div className="flex items-center gap-2">
                                <ShoppingBag size={20} />
                                <span>{cartCount} itens</span>
                            </div>
                            <span className="text-sm uppercase">Avançar</span>
                            <span>{formatCurrency(cartTotal)}</span>
                        </button>
                    </div>
                </div>

                {/* COLUNA DIREITA: FORMULÁRIO (Hidden on Mobile if Menu active) */}
                <div className={`w-full md:w-1/3 bg-slate-950 flex-col border-l border-slate-800 shadow-2xl relative z-10 ${mobileTab === 'checkout' ? 'flex flex-1 overflow-hidden' : 'hidden md:flex h-full'}`}>
                    <div className="p-4 md:p-5 border-b border-slate-800 justify-between items-center bg-slate-900 shrink-0 hidden md:flex">
                        <h3 className="font-bold text-white flex items-center gap-2 text-lg"><PlusCircle className="text-amber-500"/> Novo Pedido</h3>
                        <button onClick={onClose}><X className="text-slate-500 hover:text-white transition-colors"/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <form id="order-form" onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Cliente</label>
                                    <button type="button" onClick={handlePasteFromWhatsApp} className="text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-1 font-bold"><ClipboardPaste size={12}/> Colar do WhatsApp</button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 relative" ref={suggestionsRef}>
                                    {/* INPUT TELEFONE */}
                                    <div className="relative col-span-1">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={12}/>
                                        <input 
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 pl-7 pr-2 text-white text-sm outline-none focus:border-amber-500" 
                                            placeholder="Tel" 
                                            value={form.phone} 
                                            onChange={e => handleClientLookup(e.target.value, 'phone')} 
                                            onFocus={() => activeField !== 'phone' && setActiveField('phone')}
                                            autoComplete="off"
                                        />
                                    </div>
                                    {/* INPUT NOME */}
                                    <div className="relative col-span-2">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={12}/>
                                        <input 
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 pl-7 pr-2 text-white text-sm outline-none focus:border-amber-500" 
                                            placeholder="Nome" 
                                            value={form.customer} 
                                            onChange={e => handleClientLookup(e.target.value, 'name')} 
                                            onFocus={() => activeField !== 'name' && setActiveField('name')}
                                            autoComplete="off"
                                            required 
                                        />
                                    </div>

                                    {/* DROPDOWN DE SUGESTÕES */}
                                    {suggestions.length > 0 && activeField && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-[60] overflow-hidden max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-white/10">
                                            {suggestions.map((s: Client) => (
                                                <div
                                                    key={s.id}
                                                    onMouseDown={(e) => { 
                                                        e.preventDefault(); // Impede que o input perca o foco antes do clique
                                                        selectClient(s); 
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-slate-800 border-b border-slate-800 last:border-0 transition-colors flex justify-between items-center group cursor-pointer"
                                                >
                                                    <div>
                                                        <p className="text-white font-bold text-xs group-hover:text-amber-400 flex items-center gap-1">
                                                            {s.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500">{s.phone}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] text-slate-500 truncate max-w-[100px]">{s.address}</p>
                                                        {s.count && <p className="text-[9px] text-emerald-500 font-bold">{s.count} pedidos</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Endereço</label>
                                <input className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white text-sm outline-none focus:border-amber-500 mb-2" placeholder="Endereço" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                                <input className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white text-sm outline-none focus:border-amber-500" placeholder="Link Google Maps (Opcional)" value={form.mapsLink} onChange={e => setForm({...form, mapsLink: e.target.value})} />
                            </div>

                            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                                <button type="button" onClick={() => setForm({...form, serviceType: 'delivery'})} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${form.serviceType === 'delivery' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}><Bike size={14} className="inline mr-1"/> Entrega</button>
                                <button type="button" onClick={() => setForm({...form, serviceType: 'pickup'})} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${form.serviceType === 'pickup' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-white'}`}><Store size={14} className="inline mr-1"/> Retira</button>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Itens ({cart.length})</label>
                                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {cart.length === 0 ? (
                                        <p className="text-xs text-slate-600 text-center py-4">Selecione itens no cardápio ao lado</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {cart.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800/50">
                                                    <span className="text-xs text-white font-medium truncate max-w-[180px]">{item.quantity}x {item.product.name}</span>
                                                    <button type="button" onClick={() => removeFromCart(idx)} className="text-slate-500 hover:text-red-500"><X size={14}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <textarea className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white text-sm outline-none focus:border-amber-500 h-20 resize-none" placeholder="Obs: Sem cebola..." value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} />

                            <div className="border-t border-slate-800 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Total</label>
                                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-white font-bold text-lg flex items-center">
                                            {formatCurrency(cartTotal)}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Pagamento</label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {['PIX', 'Dinheiro', 'Cartão'].map((method) => (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => setForm({...form, paymentMethod: method})}
                                                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${
                                                        form.paymentMethod === method
                                                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                                                    }`}
                                                >
                                                    {method === 'PIX' && <PixIcon size={20} className={form.paymentMethod === method ? "text-white" : "text-slate-400"} />}
                                                    {method === 'Dinheiro' && <Banknote size={20} />}
                                                    {method === 'Cartão' && <CreditCard size={20} />}
                                                    <span className="text-[9px] font-bold uppercase">{method}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* CONFIRM BUTTON - FIXO NO DESKTOP, FIXO BOTTOM NO MOBILE */}
                    <div className="p-5 pb-safe border-t border-slate-800 bg-slate-900 shrink-0 z-20">
                        <button form="order-form" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 text-lg">
                            Confirmar Pedido
                        </button>
                    </div>
                </div>
             </div>

             {localAlert && (
                 <GenericAlertModal 
                    isOpen={localAlert.isOpen} 
                    title={localAlert.title} 
                    message={localAlert.message} 
                    type="error"
                    onClose={() => setLocalAlert(null)}
                 />
             )}
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
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
                        
                        {/* PAYMENT METHOD AS ICON BUTTONS */}
                        <div className="grid grid-cols-3 gap-1">
                            {['PIX', 'Dinheiro', 'Cartão'].map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setForm({...form, paymentMethod: method})}
                                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${
                                        form.paymentMethod === method
                                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white'
                                    }`}
                                >
                                    {method === 'PIX' && <PixIcon size={20} className={form.paymentMethod === method ? "text-white" : "text-slate-400"} />}
                                    {method === 'Dinheiro' && <Banknote size={20} />}
                                    {method === 'Cartão' && <CreditCard size={20} />}
                                    <span className="text-[9px] font-bold uppercase">{method}</span>
                                </button>
                            ))}
                        </div>
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
        <div className="fixed inset-0 z-[3050] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
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
        <div className="fixed inset-0 z-[3050] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in">
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
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