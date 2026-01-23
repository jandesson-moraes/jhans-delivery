import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LogOut, Bike, History, MapPin, Navigation, MessageCircle, DollarSign, CheckSquare, CheckCircle2, Calendar, ChevronDown, ClipboardList, Wallet, Package, Zap, ZapOff, Edit, Trash2, Send } from 'lucide-react';
import { Driver, Order } from '../types';
import { isToday, formatTime, formatCurrency, formatDate, sendDeliveryNotification } from '../utils';
import { Footer } from './Shared';
import { EditOrderModal } from './Modals';

interface DriverAppProps {
    driver: Driver;
    orders: Order[];
    onToggleStatus: () => void;
    onAcceptOrder: (id: string) => void;
    onCompleteOrder: (oid: string, did: string) => void;
    onUpdateOrder: (id: string, data: any) => void;
    onDeleteOrder: (id: string) => void;
    onLogout: () => void;
}

const TAXA_ENTREGA = 5.00;
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; // Som de sino

export default function DriverInterface({ driver, orders, onToggleStatus, onAcceptOrder, onCompleteOrder, onUpdateOrder, onDeleteOrder, onLogout }: DriverAppProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'wallet'>('home');
  const [historyFilter, setHistoryFilter] = useState<'today' | 'all'>('today');
  const [visibleItems, setVisibleItems] = useState(20);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Refs para controle de áudio
  const prevAssignedCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
  }, []);

  // Data do último fechamento para filtrar o ciclo atual
  const lastSettlementTime = driver.lastSettlementAt?.seconds || 0;

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
  
  // Efeito para tocar som quando houver novos pedidos ATRIBUÍDOS ('assigned')
  useEffect(() => {
      const assignedCount = orders.filter(o => o.driverId === driver.id && o.status === 'assigned').length;
      
      // Se a contagem atual for maior que a anterior, toca o som
      if (assignedCount > prevAssignedCountRef.current) {
          if(audioRef.current) {
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                  playPromise.catch(error => {
                      console.log("Áudio bloqueado pelo navegador (requer interação do usuário):", error);
                  });
              }
          }
          
          // Se o navegador suportar vibração (celular)
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
      
      prevAssignedCountRef.current = assignedCount;
  }, [orders, driver.id]);

  // Histórico completo para a aba de Histórico
  const allDeliveries = useMemo(() => {
     return orders.filter((o: Order) => o.status === 'completed' && o.driverId === driver.id)
            .sort((a: Order, b: Order) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
  }, [orders, driver.id]);

  // Entregas APENAS do ciclo atual para a aba Finanças
  const cycleDeliveries = useMemo(() => {
      return orders.filter((o: Order) => 
         o.status === 'completed' && 
         o.driverId === driver.id &&
         (o.completedAt?.seconds || 0) > lastSettlementTime
      ).sort((a: Order, b: Order) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
  }, [orders, driver.id, lastSettlementTime]);

  const displayedHistory = useMemo(() => {
      if (historyFilter === 'today') {
          return allDeliveries.filter((o: Order) => isToday(o.completedAt));
      }
      return allDeliveries;
  }, [allDeliveries, historyFilter]);

  const visibleHistory = displayedHistory.slice(0, visibleItems);
  
  // Cálculos Financeiros
  const todayEarnings = allDeliveries.filter((o:Order) => isToday(o.completedAt)).length * TAXA_ENTREGA;
  const todayCount = allDeliveries.filter((o:Order) => isToday(o.completedAt)).length;
  
  // O "Saldo Total" agora reflete o Ciclo Atual
  const cycleEarnings = cycleDeliveries.length * TAXA_ENTREGA;
  const cycleCount = cycleDeliveries.length;

  return (
    <div className="bg-slate-950 min-h-screen w-screen flex flex-col">
      <div className="bg-slate-900 p-4 md:p-5 pb-8 rounded-b-[2rem] shadow-xl relative z-10 border-b border-slate-800 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <img src={driver.avatar} className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-slate-700 bg-slate-800 object-cover" alt="Driver" />
            <div>
                <h2 className="font-bold text-base md:text-lg text-white">{driver.name}</h2>
                <div className="flex items-center gap-2 text-slate-400 text-[10px] md:text-xs font-medium bg-slate-950 px-2 py-0.5 rounded-full w-fit"><span>{driver.plate}</span></div>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-white transition-colors"><LogOut size={18}/></button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl shadow-inner border border-slate-800">
           <button onClick={() => setActiveTab('home')} className={`flex-1 py-2.5 text-[10px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 md:gap-2 ${activeTab==='home' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
               <Bike size={14} className="md:w-4 md:h-4"/> Entregas
           </button>
           <button onClick={() => setActiveTab('history')} className={`flex-1 py-2.5 text-[10px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 md:gap-2 ${activeTab==='history' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
               <ClipboardList size={14} className="md:w-4 md:h-4"/> Histórico
           </button>
           <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-2.5 text-[10px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 md:gap-2 ${activeTab==='wallet' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
               <Wallet size={14} className="md:w-4 md:h-4"/> Finanças
           </button>
        </div>
      </div>

      <div className="flex-1 px-3 md:px-4 -mt-4 pb-4 overflow-y-auto z-20 custom-scrollbar pt-6 w-full">
        
        {/* --- ABA HOME (ENTREGAS ATUAIS) --- */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className={`p-3 md:p-4 rounded-xl border shadow-lg flex items-center justify-between transition-all ${driver.status === 'offline' ? 'bg-slate-900 border-slate-800' : 'bg-emerald-900/20 border-emerald-800'}`}>
               <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Status</p>
                   <span className={`font-bold text-xs md:text-sm ${driver.status === 'offline' ? 'text-slate-300' : 'text-emerald-400'}`}>{driver.status === 'offline' ? 'Você está Offline' : 'Online e Disponível'}</span>
               </div>
               <button onClick={onToggleStatus} className={`px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 ${driver.status === 'offline' ? 'bg-emerald-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300'}`}>
                   {driver.status === 'offline' ? <Zap size={14}/> : <ZapOff size={14}/>}
                   {driver.status === 'offline' ? 'Ficar Online' : 'Pausar'}
               </button>
            </div>
            
            {driver.status !== 'offline' && todaysOrders.map((order: Order) => (
                <div key={order.id} className={`rounded-2xl shadow-xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500 ${order.status === 'completed' ? 'bg-slate-900 border-slate-800 opacity-70 grayscale-[0.5]' : 'bg-slate-900 border-slate-700'}`}>
                    <div className={`p-3 md:p-4 border-b flex justify-between items-center ${order.status === 'completed' ? 'bg-slate-950 border-slate-800' : 'bg-amber-900/20 border-slate-800'}`}>
                       <div className="flex-1 mr-2 min-w-0">
                           {order.status === 'completed' ? (
                               <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded-full mb-1"><CheckCircle2 size={10}/> ENTREGUE</span>
                           ) : (
                               <span className="inline-block text-[10px] font-bold text-white bg-amber-600 px-2 py-0.5 rounded-full mb-1">EM ROTA</span>
                           )}
                           <h3 className={`font-bold text-base md:text-lg leading-tight truncate ${order.status === 'completed' ? 'text-slate-400' : 'text-white'}`}>{order.customer}</h3>
                        </div>
                       <div className="flex items-center gap-1 md:gap-2 shrink-0">
                           {order.status !== 'completed' && (
                               <div className="flex gap-1">
                                    <button onClick={() => setEditingOrder(order)} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors">
                                        <Edit size={16}/>
                                    </button>
                                    <button onClick={() => onDeleteOrder(order.id)} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-red-500 hover:bg-slate-700 transition-colors">
                                        <Trash2 size={16}/>
                                    </button>
                               </div>
                           )}
                           <div className="text-right ml-1"><p className="text-[9px] text-slate-400 font-bold uppercase">A cobrar</p><p className={`font-extrabold text-lg md:text-xl ${order.status==='completed'?'text-slate-500':'text-white'}`}>{order.amount}</p></div>
                       </div>
                    </div>
                    {order.status === 'assigned' ? (
                        <div className="p-6 md:p-8 text-center space-y-4">
                            <h3 className="text-xl font-bold text-white mb-1">Nova entrega!</h3>
                            <button onClick={() => onAcceptOrder(order.id)} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-4 rounded-xl shadow-lg transition-transform active:scale-95 animate-bounce">ACEITAR</button>
                        </div>
                    ) : order.status === 'delivering' ? (
                        <div className="p-4 md:p-5 space-y-4">
                          <div>
                             <div className="flex items-start gap-2 md:gap-3 mb-2"><MapPin size={20} className="text-amber-500 shrink-0"/><p className="text-sm md:text-base text-slate-200 font-medium leading-snug break-words">{order.address}</p></div>
                             
                             {/* BOTÕES DE AÇÃO DO MOTOBOY */}
                             <div className="grid grid-cols-2 gap-3 mb-3">
                                <button onClick={() => window.open(order.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`, '_blank')} className="flex flex-col items-center justify-center gap-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-transform"><Navigation size={18}/> GPS</button>
                                <button onClick={() => window.open(`https://wa.me/55${order.phone.replace(/\D/g, '')}`, '_blank')} className="flex flex-col items-center justify-center gap-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-transform"><MessageCircle size={18}/> Contato</button>
                             </div>
                             
                             {/* BOTÃO DE AVISAR SAÍDA */}
                             <button onClick={() => sendDeliveryNotification(order, driver.name, driver.vehicle || 'Moto')} className="w-full bg-slate-800 border border-emerald-500/50 text-emerald-400 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-900/30 transition-colors">
                                 <Send size={16}/> Avisar Cliente que Saiu para Entrega
                             </button>
                          </div>

                          <div className="bg-slate-950 p-3 md:p-4 rounded-xl border border-slate-800 space-y-2">
                             <div><p className="text-[10px] text-slate-500 font-bold uppercase">Itens</p><p className="text-slate-300 font-medium text-xs md:text-sm">{order.items}</p></div>
                             {order.paymentMethod && <div className="flex items-center gap-2 pt-2 border-t border-slate-800"><DollarSign size={14} className="text-slate-500"/><span className="text-xs md:text-sm font-bold text-slate-300">Pag: {order.paymentMethod}</span></div>}
                          </div>
                          
                          <button onClick={() => onCompleteOrder(order.id, driver.id)} className="w-full bg-slate-800 border border-slate-700 text-white font-bold py-3 md:py-4 rounded-xl flex items-center justify-center gap-2 text-sm md:text-base shadow-xl active:scale-95 transition-transform hover:bg-slate-700"><CheckSquare size={18} className="text-emerald-400"/> Finalizar Entrega</button>
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-950 text-center">
                            <p className="text-xs text-slate-500">Corrida finalizada às {formatTime(order.completedAt)}</p>
                        </div>
                    )}
                </div>
            ))}
            
            {driver.status !== 'offline' && todaysOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Package size={48} className="mb-4 opacity-20"/>
                    <p className="text-sm font-medium">Nenhuma entrega ativa no momento.</p>
                </div>
            )}
          </div>
        )}

        {/* --- ABA HISTÓRICO --- */}
        {activeTab === 'history' && (
            <div className="space-y-4">
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button onClick={() => setHistoryFilter('today')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${historyFilter === 'today' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Hoje</button>
                    <button onClick={() => setHistoryFilter('all')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${historyFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Tudo</button>
                </div>

                <div className="space-y-3">
                    {visibleHistory.length === 0 ? (
                        <div className="text-center py-10 bg-slate-900 rounded-xl border border-dashed border-slate-800 text-slate-500 text-sm">Nenhum histórico encontrado.</div>
                    ) : (
                        visibleHistory.map((order: Order) => (
                            <div key={order.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex justify-between items-start mb-2 border-b border-slate-800 pb-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar size={14}/>
                                        <span className="text-xs font-bold">{formatDate(order.completedAt)} • {formatTime(order.completedAt)}</span>
                                    </div>
                                    <span className="text-[10px] font-bold bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded">CONCLUÍDO</span>
                                </div>
                                <div className="mb-2">
                                    <p className="font-bold text-white text-base">{order.customer}</p>
                                    <div className="flex items-start gap-1 mt-1">
                                        <MapPin size={12} className="text-slate-500 mt-0.5 shrink-0"/>
                                        <p className="text-xs text-slate-400 leading-tight">{order.address}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-950 p-2 rounded-lg mb-2">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Itens</p>
                                    <p className="text-xs text-slate-300 line-clamp-2">{order.items}</p>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-xs text-slate-500">Taxa de Entrega</span>
                                    <span className="font-bold text-emerald-400">+ {formatCurrency(TAXA_ENTREGA)}</span>
                                </div>
                            </div>
                        ))
                    )}
                    {displayedHistory.length > visibleItems && (
                        <button onClick={() => setVisibleItems(prev => prev + 20)} className="w-full py-3 text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center gap-2">
                            <ChevronDown size={14}/> Carregar mais
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* --- ABA FINANÇAS (RESUMO CICLO ATUAL) --- */}
        {activeTab === 'wallet' && (
          <div className="space-y-6 pt-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl shadow-xl border border-amber-500/30 ring-1 ring-amber-500/20">
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">Ganhos Hoje</p>
                    <h3 className="text-3xl font-black text-white">{formatCurrency(todayEarnings)}</h3>
                    <p className="text-[10px] text-slate-500 mt-1">{todayCount} entregas</p>
                 </div>
                 <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl shadow-xl border border-emerald-500/30 ring-1 ring-emerald-500/20">
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">Saldo Ciclo Atual</p>
                    <h3 className="text-3xl font-black text-emerald-400">{formatCurrency(cycleEarnings)}</h3>
                    <p className="text-[10px] text-slate-500 mt-1">{cycleCount} entregas (após fechamento)</p>
                 </div>
             </div>

             <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-4">
                     <Wallet className="text-slate-400" size={24}/>
                 </div>
                 <h3 className="text-white font-bold text-lg mb-2">Carteira Digital</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">
                     O fechamento do caixa e repasse dos valores é realizado pelo gerente. Solicite seu extrato completo ou vales diretamente no balcão.
                 </p>
             </div>
          </div>
        )}
        
        {editingOrder && (
            <EditOrderModal 
                order={editingOrder} 
                onClose={() => setEditingOrder(null)} 
                onSave={onUpdateOrder} 
            />
        )}
        
        <Footer />
      </div>
    </div>
  )
}