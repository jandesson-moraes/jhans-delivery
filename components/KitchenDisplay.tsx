import React, { useEffect, useState } from 'react';
import { Order, Product } from '../types';
import { formatTime, toSentenceCase } from '../utils';
import { Clock, CheckCircle2, Flame, ChefHat, Bell, ArrowLeft } from 'lucide-react';

interface KDSProps {
    orders: Order[];
    products?: Product[];
    onUpdateStatus: (id: string, status: any) => void;
    onBack?: () => void;
}

export function KitchenDisplay({ orders, products = [], onUpdateStatus, onBack }: KDSProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

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
        const newOrders = orders.filter(o => o.status === 'pending');
        if (newOrders.length > 0) {
            // Placeholder para som
        }
    }, [orders.length]);

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
        if (status === 'ready') return 'bg-emerald-900 border-emerald-500';
        if (elapsedSec > 1800) return 'bg-red-900 border-red-500 animate-pulse'; // Atrasado (30min)
        if (status === 'preparing') return 'bg-orange-900/50 border-orange-500'; // Em preparo (Laranja)
        return 'bg-amber-900/40 border-amber-500'; // Pendente (Amarelo)
    };

    const findProductDescription = (line: string) => {
        if(!line) return '';
        // Remove quantidade (ex: "2x ") para buscar o nome
        const cleanName = line.replace(/^\d+[xX\s]+/, '').trim();
        // Tenta encontrar produto exato
        const product = products.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
        return product?.description || '';
    };

    return (
        <div className="flex flex-col h-full bg-black text-white p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl flex items-center gap-2 font-bold transition-colors">
                            <ArrowLeft size={24} /> Voltar
                        </button>
                    )}
                    <ChefHat size={32} className="text-white"/>
                    <h1 className="text-3xl font-black uppercase tracking-widest hidden md:block">Cozinha (KDS)</h1>
                </div>
                <div className="text-4xl font-mono font-bold text-amber-500">
                    {currentTime.toLocaleTimeString()}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 custom-scrollbar">
                {kitchenOrders.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center h-96 text-slate-600">
                        <Flame size={64} className="mb-4 opacity-20"/>
                        <p className="text-2xl font-bold">Cozinha Livre</p>
                    </div>
                ) : (
                    kitchenOrders.map(order => {
                        const elapsedSec = (currentTime.getTime() - (order.createdAt?.seconds * 1000)) / 1000;
                        const cardColor = getCardColor(order.status, elapsedSec);

                        return (
                            <div key={order.id} className={`relative flex flex-col justify-between rounded-xl border-l-8 shadow-2xl p-4 transition-all ${cardColor} min-h-[350px]`}>
                                <div>
                                    <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-2">
                                        <div className="flex flex-col">
                                            <span className="font-black text-2xl leading-none text-white mb-1">{order.customer}</span>
                                            <span className="text-xs font-mono text-white/70">#{order.id.slice(-4)}</span>
                                        </div>
                                        <span className="font-mono text-2xl font-bold flex items-center gap-2 bg-black/40 px-2 py-1 rounded">
                                            <Clock size={20}/> {getElapsedTime(order.createdAt)}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <span className={`text-sm font-bold px-2 py-1 rounded uppercase ${order.serviceType === 'pickup' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                            {order.serviceType === 'pickup' ? 'Retirada' : 'Delivery'}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-4 mb-4">
                                        {order.items.split('\n').map((line, i) => {
                                            if (line.includes('---')) return <hr key={i} className="border-white/20 my-2"/>;
                                            const isObs = line.toLowerCase().startsWith('obs:');
                                            const description = !isObs ? findProductDescription(line) : '';

                                            return (
                                                <div key={i}>
                                                    <p className={`${isObs ? 'text-yellow-300 text-lg italic bg-black/30 p-1 rounded mt-1' : 'text-2xl font-bold leading-tight'}`}>
                                                        {toSentenceCase(line)}
                                                    </p>
                                                    {description && (
                                                        <p className="text-sm text-white/60 font-medium leading-tight mt-0.5 ml-1">
                                                            {toSentenceCase(description)}
                                                        </p>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-white/10">
                                    {order.status === 'pending' && (
                                        <button onClick={() => onUpdateStatus(order.id, {status: 'preparing'})} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-lg text-xl font-black uppercase shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                                            <Flame/> Iniciar Preparo
                                        </button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button onClick={() => onUpdateStatus(order.id, {status: 'ready'})} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-lg text-xl font-black uppercase shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                                            <CheckCircle2/> Pronto
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <div className="text-center bg-black/20 p-2 rounded text-emerald-300 font-bold text-lg animate-pulse">
                                            AGUARDANDO ENTREGA
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}