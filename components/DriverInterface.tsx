import React, { useState, useMemo } from 'react';
import { LogOut, Bike, History, MapPin, Navigation, MessageCircle, DollarSign, CheckSquare, CheckCircle2, Calendar, ChevronDown } from 'lucide-react';
import { Driver, Order } from '../types';
import { isToday, formatTime, formatCurrency, formatDate } from '../utils';

interface DriverAppProps {
    driver: Driver;
    orders: Order[];
    onToggleStatus: () => void;
    onAcceptOrder: (id: string) => void;
    onCompleteOrder: (oid: string, did: string) => void;
    onLogout: () => void;
}

const TAXA_ENTREGA = 5.00;

export default function DriverInterface({ driver, orders, onToggleStatus, onAcceptOrder, onCompleteOrder, onLogout }: DriverAppProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'wallet'>('home');
  const [historyFilter, setHistoryFilter] = useState<'today' | 'all'>('today');
  const [visibleItems, setVisibleItems] = useState(20);

  const todaysOrders = useMemo(() => {
     return orders.filter((o: Order) => 
        o.driverId === driver.id && 
        (o.status === 'assigned' || o.status === 'delivering' || (o.status === 'completed' && isToday(o.completedAt)))
     ).sort((a: Order, b: Order) => {
         if (a.status !== 'completed' && b.status === 'completed') return -1;
         if (a.status === 'completed' && b.status !== 'completed') return 1;
         return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
     });
  }, [orders, driver.id]);
  
  const allDeliveries = useMemo(() => {
     return orders.filter((o: Order) => o.status === 'completed' && o.driverId === driver.id)
            .sort((a: Order, b: Order) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
  }, [orders, driver.id]);

  const displayedDeliveries = useMemo(() => {
      let filtered = allDeliveries;
      if (historyFilter === 'today') {
          filtered = filtered.filter((o: Order) => isToday(o.completedAt));
      }
      return filtered;
  }, [allDeliveries, historyFilter]);

  const visibleDeliveries = displayedDeliveries.slice(0, visibleItems);
  const totalEarnings = allDeliveries.length * TAXA_ENTREGA;
  const todayEarnings = allDeliveries.filter((o:Order) => isToday(o.completedAt)).length * TAXA_ENTREGA;
  const todayCount = allDeliveries.filter((o:Order) => isToday(o.completedAt)).length;
  const totalCount = allDeliveries.length;

  return (
    <div className="bg-slate-950 min-h-screen w-screen flex flex-col">
      <div className="bg-slate-900 p-5 pb-10 rounded-b-[2rem] shadow-xl relative z-10 border-b border-slate-800">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <img src={driver.avatar} className="w-14 h-14 rounded-full border-2 border-slate-700 bg-slate-800 object-cover" alt="Driver" />
            <div>
                <h2 className="font-bold text-lg text-white">{driver.name}</h2>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium bg-slate-950 px-2 py-0.5 rounded-full w-fit"><span>{driver.plate}</span></div>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-white transition-colors"><LogOut size={18}/></button>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-lg">
           <button onClick={() => setActiveTab('home')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab==='home' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Bike size={14}/> Entregas</button>
           <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab==='wallet' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><History size={14}/> Extrato</button>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-6 pb-4 overflow-y-auto z-20 custom-scrollbar">
        {activeTab === 'home' ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border shadow-lg flex items-center justify-between transition-all ${driver.status === 'offline' ? 'bg-slate-900 border-slate-800' : 'bg-emerald-900/20 border-emerald-800'}`}>
               <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Status</p><span className={`font-bold text-sm ${driver.status === 'offline' ? 'text-slate-300' : 'text-emerald-400'}`}>{driver.status === 'offline' ? 'Você está Offline' : 'Online e Disponível'}</span></div>
               <button onClick={onToggleStatus} className={`px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 ${driver.status === 'offline' ? 'bg-emerald-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300'}`}>{driver.status === 'offline' ? 'Ficar Online' : 'Pausar'}</button>
            </div>
            
            {driver.status !== 'offline' && todaysOrders.map((order: Order) => (
                <div key={order.id} className={`rounded-2xl shadow-xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500 ${order.status === 'completed' ? 'bg-slate-900 border-slate-800 opacity-70 grayscale-[0.5]' : 'bg-slate-900 border-slate-700'}`}>
                    <div className={`p-4 border-b flex justify-between items-center ${order.status === 'completed' ? 'bg-slate-950 border-slate-800' : 'bg-amber-900/20 border-slate-800'}`}>
                       <div>
                           {order.status === 'completed' ? (
                               <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded-full mb-1"><CheckCircle2 size={10}/> ENTREGUE</span>
                           ) : (
                               <span className="inline-block text-[10px] font-bold text-white bg-amber-600 px-2 py-0.5 rounded-full mb-1">EM ROTA</span>
                           )}
                           <h3 className={`font-bold text-lg leading-tight ${order.status === 'completed' ? 'text-slate-400' : 'text-white'}`}>{order.customer}</h3>
                        </div>
                       <div className="text-right"><p className="text-[10px] text-slate-400 font-bold uppercase">A cobrar</p><p className={`font-extrabold text-xl ${order.status==='completed'?'text-slate-500':'text-white'}`}>{order.amount}</p></div>
                    </div>
                    {order.status === 'assigned' ? (
                        <div className="p-8 text-center space-y-4">
                            <h3 className="text-xl font-bold text-white mb-1">Nova entrega!</h3>
                            <button onClick={() => onAcceptOrder(order.id)} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-4 rounded-xl shadow-lg transition-transform active:scale-95">ACEITAR</button>
                        </div>
                    ) : order.status === 'delivering' ? (
                        <div className="p-5 space-y-4">
                          <div>
                             <div className="flex items-start gap-3 mb-2"><MapPin size={20} className="text-amber-500"/><p className="text-base text-slate-200 font-medium leading-snug">{order.address}</p></div>
                             <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => window.open(order.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`, '_blank')} className="flex flex-col items-center justify-center gap-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-transform"><Navigation size={20}/> GPS</button>
                                <button onClick={() => window.open(`https://wa.me/55${order.phone.replace(/\D/g, '')}`, '_blank')} className="flex flex-col items-center justify-center gap-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-transform"><MessageCircle size={20}/> WhatsApp</button>
                             </div>
                          </div>
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                             <div><p className="text-[10px] text-slate-500 font-bold uppercase">Itens</p><p className="text-slate-300 font-medium text-sm">{order.items}</p></div>
                             {order.paymentMethod && <div className="flex items-center gap-2 pt-2 border-t border-slate-800"><DollarSign size={14} className="text-slate-500"/><span className="text-sm font-bold text-slate-300">Pag: {order.paymentMethod}</span></div>}
                          </div>
                          <button onClick={() => onCompleteOrder(order.id, driver.id)} className="w-full bg-slate-800 border border-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-base shadow-xl active:scale-95 transition-transform hover:bg-slate-700"><CheckSquare size={20} className="text-emerald-400"/> Finalizar</button>
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-950 text-center">
                            <p className="text-xs text-slate-500">Corrida finalizada às {formatTime(order.completedAt)}</p>
                        </div>
                    )}
                </div>
            ))}
            
            {driver.status !== 'offline' && todaysOrders.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    <p>Nenhuma entrega hoje.</p>
                </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 pt-2 pb-10">
             <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => { setHistoryFilter('today'); setVisibleItems(20); }} className={`bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-xl border text-left transition-all active:scale-95 ${historyFilter === 'today' ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-700'}`}>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Hoje ({todayCount})</p>
                    <h3 className="text-2xl font-bold text-white">R$ {todayEarnings.toFixed(2)}</h3>
                 </button>
                 <button onClick={() => { setHistoryFilter('all'); setVisibleItems(20); }} className={`bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-xl border text-left transition-all active:scale-95 ${historyFilter === 'all' ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-700'}`}>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Total ({totalCount})</p>
                    <h3 className="text-2xl font-bold text-emerald-400">R$ {totalEarnings.toFixed(2)}</h3>
                 </button>
             </div>

             <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2"><History size={16}/> {historyFilter === 'today' ? 'Corridas de Hoje' : 'Histórico Geral'}</span>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">{displayedDeliveries.length} entregas</span>
                </h3>
                <div className="space-y-3">
                    {visibleDeliveries.length === 0 ? (
                        <div className="text-center py-10 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded-xl">Nenhuma entrega encontrada neste período.</div>
                    ) : (
                        visibleDeliveries.map((order: Order) => (
                            <div key={order.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex-1 min-w-0 mr-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar size={12} className="text-slate-500"/>
                                        <span className="text-[10px] font-bold text-slate-400">{formatDate(order.completedAt)} • {formatTime(order.completedAt)}</span>
                                    </div>
                                    <p className="text-sm font-bold text-white truncate">{order.customer}</p>
                                    <p className="text-xs text-slate-400 truncate">{order.address}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] text-slate-500 font-bold uppercase">Taxa</span>
                                    <span className="text-emerald-400 font-bold">+ {formatCurrency(TAXA_ENTREGA)}</span>
                                </div>
                            </div>
                        ))
                    )}
                    {displayedDeliveries.length > visibleItems && (
                        <button 
                            onClick={() => setVisibleItems(prev => prev + 20)}
                            className="w-full py-3 mt-4 text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <ChevronDown size={14}/> Carregar mais antigas
                        </button>
                    )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}