
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LogOut, Bike, History, MapPin, Navigation, MessageCircle, DollarSign, CheckSquare, CheckCircle2, Calendar, ChevronDown, ClipboardList, Wallet, Package, Zap, ZapOff, Edit, Trash2, Send, MinusCircle, AlertCircle, TrendingUp, Radio, LocateFixed, ShieldCheck, Lock } from 'lucide-react';
import { Driver, Order, Vale } from '../types';
import { isToday, formatTime, formatCurrency, formatDate, sendDeliveryNotification, formatOrderId } from '../utils';
import { Footer } from './Shared';
import { EditOrderModal } from './Modals';
import { serverTimestamp } from 'firebase/firestore';

interface DriverAppProps {
    driver: Driver;
    orders: Order[];
    vales?: Vale[]; 
    onToggleStatus: () => void;
    onAcceptOrder: (id: string) => void;
    onCompleteOrder: (oid: string, did: string) => void;
    onUpdateOrder: (id: string, data: any) => void;
    onDeleteOrder: (id: string) => void;
    onLogout: () => void;
    onUpdateDriver: (id: string, data: any) => void;
}

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; 

export default function DriverInterface({ driver, orders, vales = [], onToggleStatus, onAcceptOrder, onCompleteOrder, onUpdateOrder, onDeleteOrder, onLogout, onUpdateDriver }: DriverAppProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'wallet'>('home');
  const [historyFilter, setHistoryFilter] = useState<'today' | 'all'>('today');
  const [visibleItems, setVisibleItems] = useState(20);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  // ESTADOS DO RASTREAMENTO
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const wakeLockRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // Controle de áudio com Set para não repetir
  const notifiedAssignedIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- FUNÇÕES DE RASTREAMENTO (WAKE LOCK + GPS) ---

  const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
          try {
              const lock = await (navigator as any).wakeLock.request('screen');
              wakeLockRef.current = lock;
              setWakeLockActive(true);
              
              lock.addEventListener('release', () => {
                  setWakeLockActive(false);
                  console.log('Wake Lock released');
              });
              console.log('Wake Lock active');
          } catch (err: any) {
              console.error(`${err.name}, ${err.message}`);
          }
      }
  };

  const startTracking = () => {
      setGpsError('');
      
      // 1. Tentar Wake Lock (Manter tela ligada)
      requestWakeLock();

      // 2. Iniciar GPS Watcher
      if ('geolocation' in navigator) {
          watchIdRef.current = navigator.geolocation.watchPosition(
              (position) => {
                  setGpsActive(true);
                  const { latitude, longitude, speed, heading } = position.coords;
                  
                  // Atualiza no Firestore
                  // Nota: Adicionamos um throttle implícito pelo GPS do navegador, mas aqui enviamos sempre que muda.
                  // Em produção real, poderíamos verificar se dist > 10m para economizar writes.
                  onUpdateDriver(driver.id, {
                      lat: latitude,
                      lng: longitude,
                      heading: heading || 0, // Direção
                      speed: speed || 0, // Velocidade
                      battery: 100, // Placeholder ou usar API de bateria se disponível
                      lastUpdate: serverTimestamp()
                  });
              },
              (error) => {
                  console.error("Erro GPS:", error);
                  setGpsActive(false);
                  let msg = "Erro ao obter localização.";
                  if (error.code === 1) msg = "Permissão de GPS negada. Ative nas configurações.";
                  if (error.code === 2) msg = "Sinal de GPS indisponível.";
                  if (error.code === 3) msg = "Tempo limite do GPS esgotado.";
                  setGpsError(msg);
              },
              {
                  enableHighAccuracy: true, // CRÍTICO: Usa GPS do hardware
                  timeout: 15000,
                  maximumAge: 0
              }
          );
      } else {
          setGpsError("Seu dispositivo não suporta GPS.");
      }
  };

  const stopTracking = () => {
      if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
      }
      if (wakeLockRef.current) {
          wakeLockRef.current.release().then(() => {
              wakeLockRef.current = null;
          });
      }
      setGpsActive(false);
      setWakeLockActive(false);
  };

  // Monitorar visibilidade da página para reagendar Wake Lock se cair
  useEffect(() => {
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && driver.status !== 'offline' && !wakeLockActive) {
              requestWakeLock();
          }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [wakeLockActive, driver.status]);

  // Limpeza ao desmontar
  useEffect(() => {
      return () => stopTracking();
  }, []);

  // Se o motorista ficar offline pelo banco, para o rastreamento local
  useEffect(() => {
      if (driver.status === 'offline') {
          stopTracking();
      }
  }, [driver.status]);


  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    orders.forEach(o => {
        if(o.driverId === driver.id && o.status === 'assigned') {
            notifiedAssignedIds.current.add(o.id);
        }
    });
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
      let hasNew = false;
      orders.forEach(o => {
          if (o.driverId === driver.id && o.status === 'assigned' && !notifiedAssignedIds.current.has(o.id)) {
              notifiedAssignedIds.current.add(o.id);
              hasNew = true;
          }
      });
      if (hasNew) {
          if(audioRef.current) {
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                  playPromise.catch(error => { console.log("Áudio bloqueado:", error); });
              }
          }
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
  }, [orders, driver.id]);

  // Histórico completo para a aba de Histórico
  const allDeliveries = useMemo(() => {
     return orders.filter((o: Order) => o.status === 'completed' && o.driverId === driver.id)
            .sort((a: Order, b: Order) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
  }, [orders, driver.id]);

  // --- LOGICA FINANCEIRA (Extrato) ATUALIZADA ---
  const financialData = useMemo(() => {
      const currentDeliveries = orders.filter((o: Order) => o.status === 'completed' && o.driverId === driver.id && (o.completedAt?.seconds || 0) > lastSettlementTime);
      const currentVales = vales.filter((v: Vale) => v.driverId === driver.id && (v.createdAt?.seconds || 0) > lastSettlementTime);
      
      let totalDeliveriesValue = 0;

      // Cálculo Dinâmico baseado no Modelo do Motoboy
      if (driver.paymentModel === 'percentage') {
          totalDeliveriesValue = currentDeliveries.reduce((acc, o) => acc + (o.value * ((driver.paymentRate || 0) / 100)), 0);
      } else if (driver.paymentModel === 'salary') {
          totalDeliveriesValue = 0; // Salário é fixo, não soma por entrega aqui
      } else {
          // Padrão: Fixo por entrega (R$ 5.00 default se não definido)
          const rate = driver.paymentRate !== undefined ? driver.paymentRate : 5.00;
          totalDeliveriesValue = currentDeliveries.length * rate;
      }

      const totalValesValue = currentVales.reduce((acc, v) => acc + (Number(v.amount) || 0), 0);
      const netValue = totalDeliveriesValue - totalValesValue;
      return { deliveriesCount: currentDeliveries.length, deliveriesValue: totalDeliveriesValue, valesCount: currentVales.length, valesValue: totalValesValue, netValue, valesList: currentVales };
  }, [orders, vales, driver.id, lastSettlementTime, driver.paymentModel, driver.paymentRate]);

  const displayedHistory = useMemo(() => {
      if (historyFilter === 'today') { return allDeliveries.filter((o: Order) => isToday(o.completedAt)); }
      return allDeliveries;
  }, [allDeliveries, historyFilter]);

  const visibleHistory = displayedHistory.slice(0, visibleItems);
  
  const historySummary = useMemo(() => {
      const count = displayedHistory.length;
      let total = 0;
      if (driver.paymentModel === 'percentage') {
          total = displayedHistory.reduce((acc, o) => acc + (o.value * ((driver.paymentRate || 0) / 100)), 0);
      } else if (driver.paymentModel === 'salary') {
          total = 0;
      } else {
          const rate = driver.paymentRate !== undefined ? driver.paymentRate : 5.00;
          total = count * rate;
      }
      return { count, total };
  }, [displayedHistory, driver.paymentModel, driver.paymentRate]);

  // --- TELA DE BLOQUEIO DE GPS (CHECK-IN) ---
  // Se o motorista estiver ONLINE no banco, mas o GPS local não estiver ativo, bloqueia tudo.
  if (driver.status !== 'offline' && !gpsActive) {
      return (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
              <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center mb-8 relative border-4 border-slate-800">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping"></div>
                  <LocateFixed size={48} className="text-emerald-500 relative z-10"/>
              </div>
              
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Rastreamento Obrigatório</h2>
              <p className="text-slate-400 mb-8 max-w-xs leading-relaxed">
                  Para iniciar as entregas, precisamos ativar seu GPS e manter a tela ativa para garantir a segurança.
              </p>

              {gpsError && (
                  <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl mb-6 flex items-center gap-3 text-left">
                      <AlertCircle className="text-red-500 shrink-0" size={24}/>
                      <p className="text-red-200 text-xs font-bold">{gpsError}</p>
                  </div>
              )}

              <button 
                  onClick={startTracking}
                  className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider"
              >
                  <Radio size={24} className="animate-pulse"/> Ativar GPS e Iniciar
              </button>
              
              <button 
                  onClick={() => { onToggleStatus(); stopTracking(); }}
                  className="mt-6 text-slate-500 font-bold text-sm flex items-center gap-2 hover:text-white transition-colors"
              >
                  <LogOut size={16}/> Voltar / Ficar Offline
              </button>
          </div>
      );
  }

  return (
    <div className="bg-slate-950 min-h-screen w-screen flex flex-col">
      <div className="bg-slate-900 p-4 md:p-5 pb-8 rounded-b-[2rem] shadow-xl relative z-10 border-b border-slate-800 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <img src={driver.avatar} className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-slate-700 bg-slate-800 object-cover" alt="Driver" />
            <div>
                <h2 className="font-bold text-base md:text-lg text-white">{driver.name}</h2>
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[10px] md:text-xs font-medium bg-slate-950 px-2 py-0.5 rounded-full">{driver.plate}</span>
                    {driver.status !== 'offline' && (
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] flex items-center gap-1 font-bold uppercase text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-500/30">
                                <Radio size={10} className="animate-pulse"/> GPS Ativo
                            </span>
                            {wakeLockActive && <Lock size={10} className="text-slate-500" title="Tela Bloqueada Ligada"/>}
                        </div>
                    )}
                </div>
            </div>
          </div>
          <button onClick={() => { stopTracking(); onLogout(); }} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-white transition-colors"><LogOut size={18}/></button>
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
                   <span className={`font-bold text-xs md:text-sm ${driver.status === 'offline' ? 'text-slate-300' : 'text-emerald-400'}`}>{driver.status === 'offline' ? 'Você está Offline' : 'Online e Rastreando'}</span>
               </div>
               <button 
                   onClick={() => {
                       if (driver.status === 'offline') {
                           // Tentar ativar. Se sucesso, UI muda e o "Check-in" aparece
                           onToggleStatus();
                       } else {
                           // Desativar: Para GPS e muda status
                           stopTracking();
                           onToggleStatus();
                       }
                   }} 
                   className={`px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 ${driver.status === 'offline' ? 'bg-emerald-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300'}`}
               >
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
                                <button onClick={() => window.open(`https://wa.me/55${order.phone.replace(/\D/g, '')}`, 'whatsapp-session')} className="flex flex-col items-center justify-center gap-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-transform"><MessageCircle size={18}/> Contato</button>
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

        {/* --- ABA HISTÓRICO COM RESUMO --- */}
        {activeTab === 'history' && (
            <div className="space-y-4">
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button onClick={() => setHistoryFilter('today')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${historyFilter === 'today' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Hoje</button>
                    <button onClick={() => setHistoryFilter('all')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${historyFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Tudo</button>
                </div>

                {/* Resumo do Período */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Total {historyFilter === 'today' ? 'Hoje' : 'Geral'}</p>
                        <p className="text-lg font-black text-white">{historySummary.count} entregas</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Estimativa Ganhos</p>
                        <p className="text-lg font-black text-emerald-400">{formatCurrency(historySummary.total)}</p>
                    </div>
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

        {/* --- ABA FINANÇAS (DETALHADO COM VALES) --- */}
        {activeTab === 'wallet' && (
          <div className="space-y-6 pt-2">
             <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-6 rounded-2xl shadow-xl border border-emerald-500/30 ring-1 ring-emerald-500/20 text-center">
                <p className="text-emerald-200 text-[10px] font-bold uppercase mb-2">Saldo Líquido a Receber</p>
                <h3 className="text-4xl font-black text-white">{formatCurrency(financialData.netValue)}</h3>
                <p className="text-[10px] text-emerald-400/70 mt-2">Referente ao ciclo atual</p>
             </div>

             <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><TrendingUp size={12}/> Ganhos</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(financialData.deliveriesValue)}</p>
                    <p className="text-[9px] text-slate-500 mt-1">{financialData.deliveriesCount} entregas</p>
                 </div>
                 <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><MinusCircle size={12}/> Vales</p>
                    <p className="text-xl font-bold text-red-400">- {formatCurrency(financialData.valesValue)}</p>
                    <p className="text-[9px] text-slate-500 mt-1">{financialData.valesCount} adiantamentos</p>
                 </div>
             </div>

             <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                 <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Seu Modelo de Contrato</p>
                 <div className="flex items-center gap-2">
                     <span className="text-sm font-bold text-white">
                         {driver.paymentModel === 'percentage' ? 'Comissão' : driver.paymentModel === 'salary' ? 'Salário Fixo' : 'Por Entrega'}
                     </span>
                     {driver.paymentModel !== 'salary' && (
                         <span className="bg-emerald-900/30 text-emerald-400 text-xs px-2 py-0.5 rounded font-mono">
                             {driver.paymentModel === 'percentage' ? `${driver.paymentRate}%` : formatCurrency(driver.paymentRate || 0)}
                         </span>
                     )}
                 </div>
             </div>

             {financialData.valesList.length > 0 && (
                 <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
                     <h4 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><AlertCircle size={14} className="text-amber-500"/> Detalhes dos Vales</h4>
                     <div className="space-y-2">
                         {financialData.valesList.map(vale => (
                             <div key={vale.id} className="flex justify-between items-center text-xs border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                                 <div>
                                     <p className="text-slate-300">{vale.description}</p>
                                     <p className="text-xs text-slate-500">{formatDate(vale.createdAt)}</p>
                                 </div>
                                 <span className="font-bold text-red-400">- {formatCurrency(vale.amount)}</span>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 text-center">
                 <p className="text-slate-500 text-[10px] leading-relaxed">
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
