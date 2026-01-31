
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LogOut, Bike, History, MapPin, Navigation, MessageCircle, DollarSign, CheckSquare, CheckCircle2, Calendar, ChevronDown, ClipboardList, Wallet, Package, Zap, ZapOff, Edit, Trash2, Send, MinusCircle, AlertCircle, TrendingUp, Radio, LocateFixed, ShieldCheck, Lock, Signal, RefreshCw } from 'lucide-react';
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

// Configuração de Rastreamento
const GPS_CONFIG = {
    MIN_DISTANCE_METERS: 5, // Mínimo de metros para enviar atualização
    MIN_TIME_MS: 4000,      // Mínimo de tempo (4s) entre envios
    MAX_AGE_MS: 5000,       // Idade máxima do cache do GPS
    TIMEOUT_MS: 10000       // Tempo limite para obter posição
};

// Função auxiliar para calcular distância (Haversine simples)
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

export default function DriverInterface({ driver, orders, vales = [], onToggleStatus, onAcceptOrder, onCompleteOrder, onUpdateOrder, onDeleteOrder, onLogout, onUpdateDriver }: DriverAppProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'wallet'>('home');
  const [historyFilter, setHistoryFilter] = useState<'today' | 'all'>('today');
  const [visibleItems, setVisibleItems] = useState(20);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  // ESTADOS DO RASTREAMENTO
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const wakeLockRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{lat: number, lng: number, time: number} | null>(null);

  // Controle de áudio com Set para não repetir
  const notifiedAssignedIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- FUNÇÕES DE RASTREAMENTO ROBUSTAS ---

  const keepScreenOn = async () => {
      if ('wakeLock' in navigator) {
          try {
              const lock = await (navigator as any).wakeLock.request('screen');
              wakeLockRef.current = lock;
              console.log('⚡ Tela mantida ligada (WakeLock Ativo)');
          } catch (err: any) {
              console.warn('Falha no WakeLock:', err);
          }
      }
  };

  const processPosition = async (position: GeolocationPosition) => {
      const { latitude, longitude, speed, heading } = position.coords;
      const now = Date.now();
      
      // Lógica de Throttle (Engarrafamento de dados)
      // Só envia se:
      // 1. Não tiver enviado nada ainda
      // 2. Passou X segundos desde o ultimo envio
      // 3. Moveu X metros desde a ultima posição enviada
      
      let shouldSend = false;
      
      if (!lastPositionRef.current) {
          shouldSend = true;
      } else {
          const timeDiff = now - lastPositionRef.current.time;
          const distDiff = getDistance(lastPositionRef.current.lat, lastPositionRef.current.lng, latitude, longitude);
          
          if (timeDiff >= GPS_CONFIG.MIN_TIME_MS || distDiff >= GPS_CONFIG.MIN_DISTANCE_METERS) {
              shouldSend = true;
          }
      }

      if (shouldSend) {
          setIsSending(true);
          try {
              // Atualiza localmente para referência futura
              lastPositionRef.current = { lat: latitude, lng: longitude, time: now };
              
              // Envia ao Banco
              await onUpdateDriver(driver.id, {
                  lat: latitude,
                  lng: longitude,
                  heading: heading || 0,
                  speed: speed || 0,
                  lastUpdate: serverTimestamp() // Importante: Server timestamp para o admin saber a latência real
              });
              
              setLastSentTime(new Date());
              setGpsError(''); // Limpa erros se teve sucesso
              setGpsActive(true);
          } catch (error) {
              console.error("Erro ao enviar GPS:", error);
          } finally {
              setIsSending(false);
          }
      } else {
          // GPS está ativo, só não precisou enviar ainda
          setGpsActive(true);
      }
  };

  const startTracking = () => {
      setGpsError('');
      
      // 1. Wake Lock
      keepScreenOn();

      // 2. Iniciar Watcher do GPS
      if ('geolocation' in navigator) {
          // Limpa anterior se existir
          if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

          watchIdRef.current = navigator.geolocation.watchPosition(
              processPosition,
              (error) => {
                  console.error("Erro GPS (Watch):", error);
                  setGpsActive(false);
                  if (error.code === 1) setGpsError("Permissão de GPS negada. Vá em Configurações > Permissões e ative.");
                  else if (error.code === 2) setGpsError("Sinal de GPS perdido. Vá para céu aberto.");
                  else if (error.code === 3) setGpsError("GPS demorou a responder.");
                  else setGpsError("Erro desconhecido no GPS.");
              },
              {
                  enableHighAccuracy: true, // CRÍTICO: Usa chip GPS
                  timeout: GPS_CONFIG.TIMEOUT_MS,
                  maximumAge: 0 // Não aceita cache
              }
          );
      } else {
          setGpsError("Seu celular não suporta GPS moderno.");
      }
  };

  const stopTracking = () => {
      if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
      }
      if (wakeLockRef.current) {
          wakeLockRef.current.release().then(() => wakeLockRef.current = null);
      }
      setGpsActive(false);
  };

  // Re-ativar WakeLock se a aba voltar a ser visível
  useEffect(() => {
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && driver.status !== 'offline') {
              keepScreenOn();
          }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [driver.status]);

  // Se o motorista ficar offline, para tudo
  useEffect(() => {
      if (driver.status === 'offline') {
          stopTracking();
      } else {
          // Se ficou online, inicia
          startTracking();
      }
      return () => stopTracking(); // Cleanup
  }, [driver.status]);

  // --- ÁUDIO DE NOTIFICAÇÃO ---
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    // Popula iniciais para não tocar som de pedidos velhos
    orders.forEach(o => {
        if(o.driverId === driver.id && o.status === 'assigned') {
            notifiedAssignedIds.current.add(o.id);
        }
    });
  }, []);

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
              audioRef.current.play().catch(e => console.log("Audio blocked", e));
          }
          if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
      }
  }, [orders, driver.id]);

  const allDeliveries = useMemo(() => {
     return orders.filter((o: Order) => o.status === 'completed' && o.driverId === driver.id)
            .sort((a: Order, b: Order) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
  }, [orders, driver.id]);

  const financialData = useMemo(() => {
      const lastSettlementTime = driver.lastSettlementAt?.seconds || 0;
      const currentDeliveries = orders.filter((o: Order) => o.status === 'completed' && o.driverId === driver.id && (o.completedAt?.seconds || 0) > lastSettlementTime);
      const currentVales = vales.filter((v: Vale) => v.driverId === driver.id && (v.createdAt?.seconds || 0) > lastSettlementTime);
      
      let totalDeliveriesValue = 0;
      if (driver.paymentModel === 'percentage') {
          totalDeliveriesValue = currentDeliveries.reduce((acc, o) => acc + (o.value * ((driver.paymentRate || 0) / 100)), 0);
      } else if (driver.paymentModel === 'salary') {
          totalDeliveriesValue = 0;
      } else {
          const rate = driver.paymentRate !== undefined ? driver.paymentRate : 5.00;
          totalDeliveriesValue = currentDeliveries.length * rate;
      }

      const totalValesValue = currentVales.reduce((acc, v) => acc + (Number(v.amount) || 0), 0);
      const netValue = totalDeliveriesValue - totalValesValue;
      return { deliveriesCount: currentDeliveries.length, deliveriesValue: totalDeliveriesValue, valesCount: currentVales.length, valesValue: totalValesValue, netValue, valesList: currentVales };
  }, [orders, vales, driver.id, driver.paymentModel, driver.paymentRate, driver.lastSettlementAt]);

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

  // --- TELA DE BLOQUEIO / INICIAL (CHECK-IN) ---
  if (driver.status !== 'offline' && !gpsActive && !gpsError) {
      // Estado intermediário: Tentando conectar GPS
      return (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
              <RefreshCw className="animate-spin text-emerald-500 mb-4" size={48}/>
              <h2 className="text-xl font-bold text-white">Conectando ao Satélite...</h2>
              <p className="text-slate-400 mt-2 text-sm">Aguarde, estamos buscando sua localização exata.</p>
              <button onClick={() => { onToggleStatus(); stopTracking(); }} className="mt-8 text-slate-500 text-xs font-bold border border-slate-800 px-4 py-2 rounded-lg">Cancelar</button>
          </div>
      );
  }

  if (driver.status !== 'offline' && gpsError) {
      // Estado de Erro no GPS
      return (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center mb-6 border-2 border-red-500 animate-pulse">
                  <AlertCircle size={40} className="text-red-500"/>
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase">Sem Sinal de GPS</h2>
              <p className="text-red-300 font-bold mb-6 max-w-xs">{gpsError}</p>
              <button onClick={startTracking} className="w-full max-w-sm bg-white text-slate-900 font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all mb-4">TENTAR NOVAMENTE</button>
              <button onClick={() => { onToggleStatus(); stopTracking(); }} className="text-slate-500 font-bold text-sm">Sair / Ficar Offline</button>
          </div>
      );
  }

  // --- TELA PRINCIPAL DO DRIVER ---
  return (
    <div className="bg-slate-950 min-h-screen w-screen flex flex-col">
      {/* HEADER COCKPIT */}
      <div className="bg-slate-900 p-4 md:p-5 pb-6 rounded-b-[2rem] shadow-xl relative z-10 border-b border-slate-800 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
                <img src={driver.avatar} className="w-14 h-14 rounded-full border-2 border-slate-700 bg-slate-800 object-cover" alt="Driver" />
                {driver.status !== 'offline' && <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></div>}
            </div>
            <div>
                <h2 className="font-bold text-lg text-white leading-none mb-1">{driver.name}</h2>
                <div className="flex flex-col">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{driver.plate}</span>
                    
                    {/* STATUS DO GPS (PULSE) */}
                    {driver.status !== 'offline' && (
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${isSending ? 'bg-emerald-500 text-slate-900 border-emerald-400' : 'bg-emerald-900/20 text-emerald-500 border-emerald-900/50'}`}>
                                {isSending ? <RefreshCw size={10} className="animate-spin"/> : <Signal size={10}/>}
                                {isSending ? 'Enviando...' : 'GPS Ativo'}
                            </div>
                            {lastSentTime && <span className="text-[9px] text-slate-500">{formatTime({seconds: lastSentTime.getTime()/1000})}</span>}
                        </div>
                    )}
                </div>
            </div>
          </div>
          <button onClick={() => { stopTracking(); onLogout(); }} className="p-2.5 bg-slate-800 rounded-xl hover:bg-red-900/20 hover:text-red-400 text-slate-400 transition-colors"><LogOut size={20}/></button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl shadow-inner border border-slate-800">
           <button onClick={() => setActiveTab('home')} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab==='home' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-500 hover:text-white'}`}>
               <Bike size={16}/> Entregas
           </button>
           <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab==='history' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-500 hover:text-white'}`}>
               <ClipboardList size={16}/> Histórico
           </button>
           <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab==='wallet' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-500 hover:text-white'}`}>
               <Wallet size={16}/> Carteira
           </button>
        </div>
      </div>

      <div className="flex-1 px-3 md:px-4 -mt-4 pb-4 overflow-y-auto z-20 custom-scrollbar pt-6 w-full">
        
        {/* --- ABA HOME (ENTREGAS ATUAIS) --- */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            
            {/* CARD STATUS PRINCIPAL */}
            <div className={`p-4 rounded-2xl border shadow-xl flex items-center justify-between transition-all ${driver.status === 'offline' ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-r from-emerald-900/40 to-slate-900 border-emerald-500/30'}`}>
               <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Seu Status</span>
                   <div className="flex items-center gap-2">
                       <div className={`w-3 h-3 rounded-full ${driver.status === 'offline' ? 'bg-slate-600' : 'bg-emerald-500 animate-pulse'}`}></div>
                       <span className={`font-black text-lg ${driver.status === 'offline' ? 'text-slate-300' : 'text-white'}`}>
                           {driver.status === 'offline' ? 'OFFLINE' : 'ONLINE'}
                       </span>
                   </div>
                   {driver.status !== 'offline' && <span className="text-[10px] text-emerald-400/70 font-mono mt-1">Mantenha a tela ligada! ⚡</span>}
               </div>
               
               <button 
                   onClick={() => {
                       if (driver.status === 'offline') onToggleStatus(); 
                       else { stopTracking(); onToggleStatus(); }
                   }} 
                   className={`h-12 px-6 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2 border ${driver.status === 'offline' ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}`}
               >
                   {driver.status === 'offline' ? <Zap size={18} fill="currentColor"/> : <ZapOff size={18}/>}
                   {driver.status === 'offline' ? 'INICIAR' : 'PAUSAR'}
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

        {/* --- ABA HISTÓRICO --- */}
        {activeTab === 'history' && (
            <div className="space-y-4">
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button onClick={() => setHistoryFilter('today')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${historyFilter === 'today' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Hoje</button>
                    <button onClick={() => setHistoryFilter('all')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${historyFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Tudo</button>
                </div>

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
                            <div key={order.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                                <div className="flex justify-between items-start mb-2 border-b border-slate-800 pb-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar size={14}/>
                                        <span className="text-xs font-bold">{formatDate(order.completedAt)} • {formatTime(order.completedAt)}</span>
                                    </div>
                                    <span className="text-[10px] font-bold bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded">CONCLUÍDO</span>
                                </div>
                                <div className="mb-2">
                                    <p className="font-bold text-white text-base">{order.customer}</p>
                                    <p className="text-xs text-slate-400 leading-tight mt-1">{order.address}</p>
                                </div>
                            </div>
                        ))
                    )}
                    {displayedHistory.length > visibleItems && (
                        <button onClick={() => setVisibleItems(prev => prev + 20)} className="w-full py-3 text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-white">Carregar mais</button>
                    )}
                </div>
            </div>
        )}

        {/* --- ABA FINANÇAS --- */}
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
