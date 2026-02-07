
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Order, Product, Driver, AppConfig } from '../types';
import { formatTime, toSentenceCase, formatDate, getOrderReceivedText, copyToClipboard, formatOrderId, isToday, normalizePhone, getPixCodeOnly } from '../utils';
import { Clock, CheckCircle2, Flame, ChefHat, History, Bike, Copy, X, ListChecks, ArrowRight, PackageCheck, Edit, Trash2, MessageSquare, Printer, QrCode } from 'lucide-react';
import { KitchenHistoryModal, ProductionSuccessModal, ConfirmCloseOrderModal, DispatchSuccessModal, ReceiptModal } from './Modals';
import { Footer } from './Shared';
import { serverTimestamp } from 'firebase/firestore';

interface KDSProps {
    orders: Order[];
    products?: Product[];
    drivers?: Driver[];
    onUpdateStatus: (id: string, status: any) => void;
    onAssignOrder?: (oid: string, did: string) => void;
    onDeleteOrder?: (id: string) => void;
    onBack?: () => void;
    appConfig: AppConfig;
    onEditOrder?: (order: Order) => void;
    disableSound?: boolean; // New prop to control internal sound logic
}

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function KitchenDisplay({ orders, products = [], drivers = [], onUpdateStatus, onAssignOrder, onDeleteOrder, appConfig, onEditOrder, disableSound = false }: KDSProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);
    const [productionOrder, setProductionOrder] = useState<Order | null>(null);
    const [dispatchData, setDispatchData] = useState<{order: Order, driverName: string} | null>(null);
    const [orderToClose, setOrderToClose] = useState<Order | null>(null);
    const [showReadySidebar, setShowReadySidebar] = useState(false); // Default hidden
    
    // Rastreia quais mensagens já foram copiadas para parar de piscar
    const [copiedMessages, setCopiedMessages] = useState<Set<string>>(new Set());
    const [copiedPixCodes, setCopiedPixCodes] = useState<Set<string>>(new Set());
    
    // Estado para impressão
    const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

    // ABA MOBILE CONTROL
    const [activeTab, setActiveTab] = useState<'production' | 'ready'>('production');
    
    // Inicializa com a contagem ATUAL para não tocar som ao abrir a tela se já houver pedidos
    const prevPendingCountRef = useRef(orders.filter(o => o.status === 'pending' && !o.id.includes('w8wSUDWOkyWnrL1UxfXC')).length);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    const effectiveAppName = (appConfig && appConfig.appName && appConfig.appName !== 'undefined') ? appConfig.appName : "Jhans Burgers";

    // --- SEPARAÇÃO DOS PEDIDOS ---
    
    // 1. Pedidos Ativos (O que a cozinha tem que fazer AGORA)
    const activeOrders = useMemo(() => {
        return orders.filter(o => 
            ['pending', 'preparing'].includes(o.status) &&
            !o.id.includes('w8wSUDWOkyWnrL1UxfXC')
        ).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    }, [orders]);

    // 2. Pedidos Prontos e do Dia (Lista Lateral)
    const finishedOrders = useMemo(() => {
        return orders.filter(o => 
            (['ready', 'assigned', 'delivering', 'completed'].includes(o.status)) && 
            (isToday(o.createdAt) || o.status === 'ready') &&
            !o.id.includes('w8wSUDWOkyWnrL1UxfXC')
        ).sort((a, b) => {
            if (a.status === 'ready' && b.status !== 'ready') return -1;
            if (a.status !== 'ready' && b.status === 'ready') return 1;
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
    }, [orders]);

    const selectedClientOrderCount = useMemo(() => {
        if (!selectedHistoryOrder) return 0;
        const phone = normalizePhone(selectedHistoryOrder.phone);
        if (!phone) return 1;
        return orders.filter(o => normalizePhone(o.phone) === phone).length;
    }, [selectedHistoryOrder, orders]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        audioRef.current = new Audio(NOTIFICATION_SOUND);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const pendingCount = orders.filter(o => o.status === 'pending' && !o.id.includes('w8wSUDWOkyWnrL1UxfXC')).length;
        if (!disableSound && pendingCount > prevPendingCountRef.current) {
            if(audioRef.current) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => console.log("Áudio bloqueado:", error));
                }
            }
        }
        prevPendingCountRef.current = pendingCount;
    }, [orders, disableSound]);

    const getElapsedTime = (timestamp: any) => {
        if (!timestamp) return '00:00';
        const start = new Date(timestamp.seconds * 1000).getTime();
        const now = currentTime.getTime();
        const diff = Math.floor((now - start) / 1000);
        const mm = Math.floor(diff / 60).toString().padStart(2, '0');
        const ss = (diff % 60).toString().padStart(2, '0');
        return `${mm}:${ss}`;
    };

    const getPreparationTime = (start: any, end: any) => {
        if (!start) return '-';
        const s = new Date(start.seconds * 1000).getTime();
        const e = end ? new Date(end.seconds * 1000).getTime() : new Date().getTime();
        const diff = Math.floor((e - s) / 1000 / 60); 
        return `${diff} min`;
    }

    const getCardColor = (status: string, elapsedSec: number) => {
        if (elapsedSec > 1800) return 'bg-red-900/20 border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]'; 
        if (status === 'preparing') return 'bg-orange-900/10 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]'; 
        return 'bg-slate-900/50 border-amber-500/50'; 
    };

    const findProductDescription = (line: string) => {
        if(!line) return '';
        const cleanName = line.replace(/^\d+[xX\s]+/, '').trim();
        const product = products.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
        return product?.description || '';
    };

    const handleCopyStatus = (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();
        e.preventDefault();
        const text = getOrderReceivedText(order, effectiveAppName, appConfig.estimatedTime);
        copyToClipboard(text);
        setCopiedMessages(prev => new Set(prev).add(order.id));
    };

    const handleCopyPixCode = (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();
        e.preventDefault();
        if (appConfig.pixKey) {
            const payload = getPixCodeOnly(appConfig.pixKey, appConfig.pixName || '', appConfig.pixCity || '', order.value, order.id);
            copyToClipboard(payload);
            setCopiedPixCodes(prev => new Set(prev).add(order.id));
            setTimeout(() => {
                setCopiedPixCodes(prev => {
                    const next = new Set(prev);
                    next.delete(order.id);
                    return next;
                });
            }, 2000);
        }
    };

    const handleAssignDriver = (oid: string, did: string) => {
        if (onAssignOrder) {
            onAssignOrder(oid, did);
            const order = orders.find(o => o.id === oid);
            const driver = drivers.find(d => d.id === did);
            if (order && driver) {
                setDispatchData({ order, driverName: driver.name });
            }
        }
    };

    const toggleReadySidebar = () => {
        setShowReadySidebar(!showReadySidebar);
    };

    return (
        <div className="flex flex-col md:flex-row h-full bg-slate-950 text-white overflow-hidden">
            
            {/* ABAS MOBILE */}
            <div className="flex md:hidden bg-slate-900 border-b border-slate-800 shrink-0">
                <button onClick={() => setActiveTab('production')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'production' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500'}`}>
                    Produção ({activeOrders.length})
                </button>
                <button onClick={() => setActiveTab('ready')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'ready' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-500'}`}>
                    Prontos/Saída ({finishedOrders.length})
                </button>
            </div>

            {/* --- LADO ESQUERDO: ÁREA DE PRODUÇÃO --- */}
            <div className={`flex-1 flex-col border-r border-slate-800 relative min-h-0 ${activeTab === 'production' ? 'flex' : 'hidden md:flex'}`}>
                <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center z-10 shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                            <Flame className="text-orange-500" size={24}/> <span className="hidden md:inline">Fila de Produção</span><span className="md:hidden">Cozinha</span>
                        </h2>
                        <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">
                            {activeOrders.length}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="font-mono font-bold text-sm md:text-xl text-slate-400 bg-slate-900 px-3 py-1 md:px-4 md:py-2 rounded-lg border border-slate-800 shadow-inner">
                            {currentTime.toLocaleTimeString()}
                        </div>
                        
                        {/* TOGGLE BUTTON FOR DESKTOP */}
                        <button 
                            onClick={toggleReadySidebar}
                            className={`hidden md:flex items-center justify-center p-2 rounded-lg border transition-all relative ${showReadySidebar ? 'bg-slate-800 text-emerald-500 border-emerald-500/50' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white'}`}
                            title="Ver Pedidos Prontos"
                        >
                            <PackageCheck size={20} />
                            {!showReadySidebar && finishedOrders.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border border-slate-900"></span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-950/50 pb-32 md:pb-20">
                    {activeOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 animate-in fade-in zoom-in opacity-50">
                            <ChefHat size={80} className="mb-4 text-slate-700"/>
                            <p className="text-2xl font-bold">Cozinha Livre</p>
                            <p className="text-sm">Aguardando novos pedidos...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
                            {activeOrders.map(order => {
                                const elapsedSec = (currentTime.getTime() - (order.createdAt?.seconds * 1000)) / 1000;
                                const cardColor = getCardColor(order.status, elapsedSec);
                                const hasCopied = copiedMessages.has(order.id);
                                const hasCopiedPix = copiedPixCodes.has(order.id);
                                const isPix = order.paymentMethod?.toLowerCase().includes('pix');

                                return (
                                    <div key={order.id} className={`flex flex-col w-full rounded-2xl border-l-[6px] shadow-2xl transition-all ${cardColor} h-auto relative group overflow-hidden`}>
                                        <div className="p-3 md:p-4 border-b border-white/5 bg-black/20 flex justify-between items-start relative">
                                            <div className="flex flex-col overflow-hidden mr-2">
                                                <span className="font-black text-lg md:text-xl text-white truncate w-full tracking-tight">
                                                    {order.customer}
                                                </span>
                                                <span className="text-xs font-mono text-white/50">{formatOrderId(order.id)}</span>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0 gap-2">
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); e.preventDefault();
                                                            setOrderToPrint(order); 
                                                        }}
                                                        className="p-1.5 hover:bg-slate-700 text-slate-500 hover:text-blue-400 rounded-lg transition-colors bg-slate-900/50 cursor-pointer"
                                                        title="Imprimir Pedido"
                                                    >
                                                        <Printer size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); e.preventDefault();
                                                            if (onEditOrder) onEditOrder(order); 
                                                        }}
                                                        className="p-1.5 hover:bg-slate-700 text-slate-500 hover:text-white rounded-lg transition-colors bg-slate-900/50 cursor-pointer"
                                                        title="Editar Pedido"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); e.preventDefault();
                                                            if (onDeleteOrder) onDeleteOrder(order.id); 
                                                        }}
                                                        className="p-1.5 bg-slate-900/80 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30 shadow-sm cursor-pointer"
                                                        title="Excluir Permanentemente"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); e.preventDefault();
                                                            setOrderToClose(order); 
                                                        }}
                                                        className="p-1.5 hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400 rounded-lg transition-colors bg-slate-900/50 cursor-pointer"
                                                        title="Concluir/Fechar"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded text-amber-400 font-mono font-bold text-sm md:text-lg shadow-inner">
                                                    {getElapsedTime(order.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-3 md:p-4 flex-1 space-y-3 relative">
                                            {order.items.split('\n').filter(l => l.trim()).map((line, i) => {
                                                if (line.includes('---')) return <hr key={i} className="border-white/10 my-2"/>;
                                                const isObs = line.toLowerCase().startsWith('obs:');
                                                const description = !isObs ? findProductDescription(line) : '';

                                                return (
                                                    <div key={i} className="flex flex-col">
                                                        <p className={`font-bold leading-snug ${isObs ? 'text-yellow-300 text-sm bg-yellow-900/20 p-2 rounded border border-yellow-500/20' : 'text-white text-base md:text-lg'}`}>
                                                            {toSentenceCase(line)}
                                                        </p>
                                                        {description && (
                                                            <p className="text-xs text-white/40 leading-tight mt-0.5 pl-2 border-l-2 border-white/10">
                                                                {toSentenceCase(description)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="p-3 mt-auto border-t border-white/5 bg-black/20 grid grid-cols-1 gap-2 relative">
                                            {order.status === 'pending' && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault(); e.stopPropagation();
                                                        onUpdateStatus(order.id, {status: 'preparing'});
                                                        setProductionOrder(order); 
                                                    }} 
                                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-black uppercase text-xs md:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer h-12"
                                                >
                                                    <Flame size={18}/> Iniciar Preparo
                                                </button>
                                            )}
                                            {order.status === 'preparing' && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault(); e.stopPropagation();
                                                        onUpdateStatus(order.id, {status: 'ready', completedAt: serverTimestamp()});
                                                    }}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black uppercase text-xs md:text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer h-12"
                                                >
                                                    <CheckCircle2 size={18}/> Marcar Pronto
                                                </button>
                                            )}
                                            
                                            {/* ÁREA DE BOTÕES DE CÓPIA - LARGURA FIXA E SEM REFLOW */}
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => handleCopyStatus(e, order)}
                                                    className={`flex-1 h-10 rounded-lg font-bold text-[10px] md:text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer overflow-hidden
                                                    ${hasCopied 
                                                        ? 'bg-slate-800/50 text-slate-500 hover:text-slate-300' 
                                                        : 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-900/60 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-center gap-2 w-full">
                                                        {hasCopied ? <CheckCircle2 size={14} className="shrink-0"/> : <MessageSquare size={14} className="shrink-0"/>}
                                                        <span className="truncate whitespace-nowrap">{hasCopied ? 'Copiado!' : isPix ? '1. Msg Resumo' : 'Copiar Msg'}</span>
                                                    </div>
                                                </button>

                                                {/* BOTÃO SÓ CÓDIGO PIX */}
                                                {isPix && (
                                                    <button 
                                                        onClick={(e) => handleCopyPixCode(e, order)}
                                                        className={`w-1/3 h-10 rounded-lg font-bold text-[10px] md:text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer
                                                        ${hasCopiedPix 
                                                            ? 'bg-slate-800/50 text-slate-500' 
                                                            : 'bg-purple-900/40 text-purple-400 border border-purple-500/50 hover:bg-purple-900/60'
                                                        }`}
                                                        title="Copiar apenas código PIX"
                                                    >
                                                        {hasCopiedPix ? <CheckCircle2 size={14}/> : <QrCode size={14}/>}
                                                        {!hasCopiedPix && <span className="hidden sm:inline">Pix</span>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
                <div className="hidden md:block bg-slate-950 p-2"><Footer /></div>
            </div>

            {/* --- LADO DIREITO: LISTA DE PRONTOS / SAÍDA --- */}
            <div className={`w-full md:w-[380px] bg-slate-900 border-l border-slate-800 flex-col shadow-2xl z-20 min-h-0 transition-all duration-300 ${activeTab === 'ready' ? 'flex' : 'hidden'} ${showReadySidebar ? 'md:flex' : 'md:hidden'}`}>
                <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-900 shadow-sm shrink-0 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <PackageCheck className="text-emerald-500"/> Pedidos do Dia
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Histórico de saída de hoje</p>
                    </div>
                    <button onClick={toggleReadySidebar} className="hidden md:block text-slate-500 hover:text-white">
                        <X size={20}/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 pb-32 md:pb-4">
                    {finishedOrders.length === 0 && (
                        <div className="text-center py-10 text-slate-600">
                            <History size={40} className="mx-auto mb-2 opacity-30"/>
                            <p className="text-sm">Nenhum pedido finalizado hoje.</p>
                        </div>
                    )}

                    {finishedOrders.map((order) => {
                        const isReady = order.status === 'ready';
                        return (
                            <div key={order.id} className={`rounded-xl border p-3 transition-all relative cursor-pointer hover:border-slate-600 ${isReady ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-slate-950 border-slate-800 opacity-70'}`} onClick={() => setSelectedHistoryOrder(order)}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isReady ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                            {isReady ? 'AGUARDANDO' : order.status === 'assigned' ? 'EM ROTA' : 'ENTREGUE'}
                                        </span>
                                        <h4 className="font-bold text-white text-base mt-1 line-clamp-1">{order.customer}</h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-mono text-slate-500 block">{formatOrderId(order.id)}</span>
                                        <span className="text-xs font-bold text-slate-400 block mt-1">{formatTime(order.createdAt)}</span>
                                    </div>
                                </div>
                                
                                <div className="text-xs text-slate-400 line-clamp-1 mb-3">
                                    {order.items.replace(/\n/g, ', ')}
                                </div>

                                {isReady && onAssignOrder && (
                                    <div className="relative mt-2 animate-in fade-in">
                                        <Bike size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                                        <select 
                                            className="w-full bg-emerald-900/30 border border-emerald-500/30 hover:border-emerald-500 text-emerald-100 text-xs font-bold py-2.5 pl-9 pr-2 rounded-lg outline-none appearance-none cursor-pointer transition-colors"
                                            defaultValue=""
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                if(e.target.value) handleAssignDriver(order.id, e.target.value);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="" disabled>Chamar Motoboy...</option>
                                            {drivers.map(d => (
                                                <option key={d.id} value={d.id} className="text-slate-900">
                                                    {d.name} {d.status === 'available' ? '✅' : '⏳'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                {!isReady && (
                                    <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 border-t border-slate-800 pt-2">
                                        <Clock size={10}/> Tempo Total: {getPreparationTime(order.createdAt, order.completedAt || order.assignedAt)}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 mt-2 border-t border-slate-800/50 pt-2">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); e.preventDefault();
                                            setOrderToPrint(order); 
                                        }}
                                        className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-blue-500 transition-colors cursor-pointer"
                                        title="Imprimir"
                                    >
                                        <Printer size={14}/>
                                    </button>
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); e.preventDefault();
                                            if (onEditOrder) onEditOrder(order); 
                                        }}
                                        className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
                                        title="Editar"
                                    >
                                        <Edit size={14}/>
                                    </button>
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); e.preventDefault();
                                            if(onDeleteOrder) onDeleteOrder(order.id); 
                                        }}
                                        className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                                        title="Excluir"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="md:hidden bg-slate-900 p-2"><Footer /></div>
            </div>

            {/* Modals */}
            {selectedHistoryOrder && (
                <KitchenHistoryModal 
                    order={selectedHistoryOrder} 
                    onClose={() => setSelectedHistoryOrder(null)} 
                    products={products}
                    totalClientOrders={selectedClientOrderCount}
                />
            )}

            {productionOrder && (
                <ProductionSuccessModal 
                    order={productionOrder} 
                    onClose={() => setProductionOrder(null)} 
                    appName={effectiveAppName}
                />
            )}

            {dispatchData && (
                <DispatchSuccessModal
                    data={dispatchData}
                    onClose={() => setDispatchData(null)}
                    appName={effectiveAppName}
                />
            )}

            {orderToClose && (
                <ConfirmCloseOrderModal
                    order={orderToClose}
                    onClose={() => setOrderToClose(null)}
                    onConfirm={() => {
                        onUpdateStatus(orderToClose.id, { status: 'completed', completedAt: serverTimestamp() });
                        setOrderToClose(null);
                    }}
                />
            )}

            {orderToPrint && (
                <ReceiptModal 
                    order={orderToPrint} 
                    onClose={() => setOrderToPrint(null)} 
                    appConfig={appConfig} 
                />
            )}
        </div>
    );
}
