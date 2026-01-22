import React, { useEffect, useState, useRef } from 'react';
import { Order, Product } from '../types';
import { formatTime, toSentenceCase } from '../utils';
import { Clock, CheckCircle2, Flame, ChefHat, ArrowLeft, AlertTriangle } from 'lucide-react';

interface KDSProps {
    orders: Order[];
    products?: Product[];
    onUpdateStatus: (id: string, status: any) => void;
    onBack?: () => void;
}

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function KitchenDisplay({ orders, products = [], onUpdateStatus, onBack }: KDSProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const prevPendingCountRef = useRef(0);

    // Filtra apenas pedidos ativos na cozinha
    const kitchenOrders = orders.filter(o => 
        ['pending', 'preparing', 'ready'].includes(o.status)
    ).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Efeito sonoro simples ao chegar novo pedido
    useEffect(() => {
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        
        // Se aumentou o número de pedidos pendentes, toca o som
        if (pendingCount > prevPendingCountRef.current) {
            const audio = new Audio(NOTIFICATION_SOUND);
            audio.play().catch(e => console.log('Áudio autoplay bloqueado', e));
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

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 p-3 md:p-4 border-b border-slate-800 shadow-md flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-slate-300 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <ChefHat className="text-amber-500" size={24} />
                        <h1 className="font-black text-xl md:text-2xl tracking-tight text-white">KDS <span className="text-slate-500 hidden sm:inline">COZINHA</span></h1>
                    </div>
                </div>
                <div className="font-mono font-bold text-xl md:text-3xl text-slate-200 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                    {currentTime.toLocaleTimeString()}
                </div>
            </div>

            {/* Grid de Pedidos */}
            <div className="flex-1 overflow-y-auto p-2 md:p-4 custom-scrollbar">
                {kitchenOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[80vh] text-slate-600 animate-in fade-in zoom-in">
                        <div className="bg-slate-900 p-8 rounded-full mb-4 border border-slate-800">
                            <Flame size={64} className="text-slate-700"/>
                        </div>
                        <p className="text-2xl font-bold text-slate-500">Cozinha Livre</p>
                        <p className="text-sm">Nenhum pedido pendente</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-20">
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
                                        <div className="flex flex-col items-end shrink-0">
                                            <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded mb-1">
                                                <Clock size={14} className="text-white/80"/> 
                                                <span className="font-mono font-bold text-base md:text-lg">{getElapsedTime(order.createdAt)}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${order.serviceType === 'pickup' ? 'bg-purple-500/20 text-purple-200' : 'bg-blue-500/20 text-blue-200'}`}>
                                                {order.serviceType === 'pickup' ? 'Retirada' : 'Delivery'}
                                            </span>
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
                                            <div className="w-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 py-3 rounded-lg font-bold uppercase text-xs md:text-sm flex items-center justify-center gap-2 animate-pulse">
                                                <CheckCircle2 size={16}/> Aguardando Entrega
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}