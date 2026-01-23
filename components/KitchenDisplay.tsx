import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Order, Product, Driver } from '../types';
import { formatTime, toSentenceCase, formatDate, getOrderReceivedText, copyToClipboard } from '../utils';
import { Clock, CheckCircle2, Flame, ChefHat, ArrowLeft, AlertTriangle, History, ArrowRight, Bike, Copy } from 'lucide-react';
import { KitchenHistoryModal } from './Modals';
import { Footer } from './Shared';

interface KDSProps {
    orders: Order[];
    products?: Product[];
    drivers?: Driver[];
    onUpdateStatus: (id: string, status: any) => void;
    onAssignOrder?: (oid: string, did: string) => void;
    onBack?: () => void;
}

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function KitchenDisplay({ orders, products = [], drivers = [], onUpdateStatus, onAssignOrder }: KDSProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);
    const prevPendingCountRef = useRef(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [appConfig] = useState(() => { try { return JSON.parse(localStorage.getItem('jhans_app_config') || '{}'); } catch { return { appName: "Jhans Burgers" }; } });

    // Filtra apenas pedidos ativos na cozinha
    const kitchenOrders = orders.filter(o => 
        ['pending', 'preparing', 'ready'].includes(o.status)
    ).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    // Filtra histórico de pedidos prontos (incluindo entregues)
    const historyOrders = useMemo(() => {
        return orders.filter(o => 
            ['ready', 'assigned', 'delivering', 'completed'].includes(o.status)
        ).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); // Mais recentes primeiro
    }, [orders]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        audioRef.current = new Audio(NOTIFICATION_SOUND);
        return () => clearInterval(timer);
    }, []);

    // Efeito sonoro simples ao chegar novo pedido
    useEffect(() => {
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        
        if (pendingCount > prevPendingCountRef.current) {
            if(audioRef.current) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Áudio bloqueado pelo navegador (KDS):", error);
                    });
                }
            }
        }
        
        prevPendingCountRef.current = pendingCount;
    }, [orders]);

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
        if (!start || !end) return '-';
        const s = new Date(start.seconds * 1000).getTime();
        const e = new Date(end.seconds * 1000).getTime();
        const diff = Math.floor((e - s) / 1000 / 60); // Em minutos
        return `${diff} min`;
    }

    const getCardColor = (status: string, elapsedSec: number) => {
        if (status === 'ready') return 'bg-emerald-900 border-emerald-500 shadow-emerald-900/20';
        if (elapsedSec > 1800) return 'bg-red-900 border-red-500 animate-pulse shadow-red-900/20'; 
        if (status === 'preparing') return 'bg-orange-900/40 border-orange-500 shadow-orange-900/10'; 
        return 'bg-slate-800 border-amber-500 shadow-amber-900/10'; 
    };

    const findProductDescription = (line: string) => {
        if(!line) return '';
        const cleanName = line.replace(/^\d+[xX\s]+/, '').trim();
        const product = products.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
        return product?.description || '';
    };

    const handleCopyStatus = (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();
        const text = getOrderReceivedText(order, appConfig.appName);
        copyToClipboard(text);
        
        // Efeito visual no botão (opcional, já que copyToClipboard pode não dar feedback visual direto aqui)
        const btn = e.currentTarget as HTMLButtonElement;
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copiado`;
        btn.classList.add('bg-emerald-600', 'text-white');
        btn.classList.remove('bg-black/30', 'text-white/80');
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.classList.remove('bg-emerald-600', 'text-white');
            btn.classList.add('bg-black/30', 'text-white/80');
        }, 2000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden p-6 md:p-10 pb-20 md:pb-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h2 className={`text-2xl font-bold flex items-center gap-3 cursor-pointer transition-colors ${viewMode === 'active' ? 'text-white' : 'text-slate-500'}`} onClick={() => setViewMode('active')}>
                        <Flame className={viewMode === 'active' ? 'text-orange-500' : 'text-slate-600'}/> Fila de Preparo
                    </h2>
                    <div className="h-6 w-px bg-slate-800"></div>
                    <h2 className={`text-xl font-bold flex items-center gap-2 cursor-pointer transition-colors ${viewMode === 'history' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setViewMode('history')}>
                        <History className={viewMode === 'history' ? 'text-blue-500' : 'text-slate-600'} size={20}/> Histórico
                    </h2>
                </div>
                <div className="font-mono font-bold text-xl text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                    {currentTime.toLocaleTimeString()}
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                
                {/* --- MODO ATIVO (CARDS) --- */}
                {viewMode === 'active' && (
                    kitchenOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 animate-in fade-in zoom-in">
                            <div className="bg-slate-900 p-8 rounded-full mb-4 border border-slate-800">
                                <ChefHat size={64} className="text-slate-700"/>
                            </div>
                            <p className="text-2xl font-bold text-slate-500">Cozinha Livre</p>
                            <p className="text-sm">Nenhum pedido pendente</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {kitchenOrders.map(order => {
                                const elapsedSec = (currentTime.getTime() - (order.createdAt?.seconds * 1000)) / 1000;
                                const cardColor = getCardColor(order.status, elapsedSec);

                                return (
                                    <div key={order.id} className={`flex flex-col w-full rounded-xl border-l-[6px] shadow-lg transition-all ${cardColor} h-auto`}>
                                        {/* Header do Card */}
                                        <div className="p-3 md:p-4 border-b border-white/10 flex justify-between items-start bg-black/10">
                                            <div className="flex flex-col overflow-hidden mr-2">
                                                <span className="font-black text-lg md:text-xl leading-tight text-white truncate w-full" title={order.customer}>
                                                    {order.customer}
                                                </span>
                                                <span className="text-xs font-mono text-white/60">#{order.id.slice(-4)}</span>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0 gap-1">
                                                <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded mb-1">
                                                    <Clock size={14} className="text-white/80"/> 
                                                    <span className="font-mono font-bold text-base md:text-lg">{getElapsedTime(order.createdAt)}</span>
                                                </div>
                                                
                                                {/* BOTÃO COPIAR MENSAGEM */}
                                                <button 
                                                    onClick={(e) => handleCopyStatus(e, order)}
                                                    className="flex items-center gap-1 bg-black/30 text-white/80 hover:bg-emerald-600 hover:text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all border border-white/10"
                                                    title="Copiar confirmação de pedido para área de transferência"
                                                >
                                                    <Copy size={10} /> Copiar Msg
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Lista de Itens */}
                                        <div className="p-3 md:p-4 flex-1 space-y-4">
                                            {order.items.split('\n').filter(l => l.trim()).map((line, i) => {
                                                if (line.includes('---')) return <hr key={i} className="border-white/10"/>;
                                                const isObs = line.toLowerCase().startsWith('obs:');
                                                const description = !isObs ? findProductDescription(line) : '';

                                                return (
                                                    <div key={i} className="flex flex-col">
                                                        <p className={`font-bold leading-snug ${isObs ? 'text-yellow-300 text-sm bg-yellow-900/30 p-2 rounded border border-yellow-700/30' : 'text-white text-base md:text-lg'}`}>
                                                            {toSentenceCase(line)}
                                                        </p>
                                                        {description && (
                                                            <p className="text-xs md:text-sm text-white/50 leading-tight mt-1 pl-1 border-l-2 border-white/10">
                                                                {toSentenceCase(description)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Ações */}
                                        <div className="p-3 md:p-4 mt-auto border-t border-white/10 bg-black/10">
                                            {order.status === 'pending' && (
                                                <button onClick={() => onUpdateStatus(order.id, {status: 'preparing'})} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-lg font-black uppercase text-sm md:text-base shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                                    <Flame size={18}/> Iniciar Preparo
                                                </button>
                                            )}
                                            {order.status === 'preparing' && (
                                                <button onClick={() => onUpdateStatus(order.id, {status: 'ready'})} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-black uppercase text-sm md:text-base shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                                    <CheckCircle2 size={18}/> Marcar Pronto
                                                </button>
                                            )}
                                            {order.status === 'ready' && (
                                                <div className="space-y-2">
                                                    <div className="w-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 py-2 rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-2">
                                                        <CheckCircle2 size={14}/> Pedido Pronto
                                                    </div>
                                                    {onAssignOrder && (
                                                        <div className="relative">
                                                            <Bike size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                                                            <select 
                                                                className="w-full bg-slate-900 border border-slate-700 hover:border-amber-500 text-white text-xs font-bold py-3 pl-10 pr-4 rounded-lg outline-none appearance-none cursor-pointer transition-colors"
                                                                defaultValue=""
                                                                onChange={(e) => {
                                                                    if(e.target.value) onAssignOrder(order.id, e.target.value);
                                                                }}
                                                            >
                                                                <option value="" disabled>Chamar Motoboy...</option>
                                                                {drivers.map(d => (
                                                                    <option key={d.id} value={d.id}>
                                                                        {d.name} {d.status === 'available' ? '(Livre)' : '(Ocupado)'}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}

                {/* --- MODO HISTÓRICO (LISTA) --- */}
                {viewMode === 'history' && (
                    <div className="w-full pb-20">
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl animate-in fade-in">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950 text-slate-200 font-bold uppercase tracking-wider border-b border-slate-800">
                                    <tr>
                                        <th className="p-4">Pedido</th>
                                        <th className="p-4">Hora Finalizado</th>
                                        <th className="p-4">Tempo de Preparo</th>
                                        <th className="p-4">Itens (Resumo)</th>
                                        <th className="p-4 text-center">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {historyOrders.map((order) => {
                                        // Usa assignedAt ou timestamp atual se ainda não saiu pra entrega, apenas para fins de calculo relativo ao KDS
                                        const finishTime = order.completedAt || order.assignedAt || null; 
                                        
                                        return (
                                            <tr key={order.id} className="hover:bg-slate-800/50 transition-colors cursor-pointer group" onClick={() => setSelectedHistoryOrder(order)}>
                                                <td className="p-4">
                                                    <span className="font-mono text-white font-bold block">#{order.id.slice(-4)}</span>
                                                    <span className="text-xs text-slate-500">{order.customer}</span>
                                                </td>
                                                <td className="p-4">
                                                    {finishTime ? formatTime(finishTime) : <span className="text-amber-500">Em espera</span>}
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono font-bold text-xs">
                                                        {getPreparationTime(order.createdAt, finishTime || { seconds: Date.now()/1000 })}
                                                    </span>
                                                </td>
                                                <td className="p-4 truncate max-w-xs text-slate-300">
                                                    {order.items.split('\n')[0]}...
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                                                        <ArrowRight size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {historyOrders.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum histórico disponível.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalhes do Histórico */}
            {selectedHistoryOrder && (
                <KitchenHistoryModal 
                    order={selectedHistoryOrder} 
                    onClose={() => setSelectedHistoryOrder(null)} 
                    products={products}
                />
            )}
            
            <Footer />
        </div>
    );
}