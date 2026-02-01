import React, { useState, useMemo } from 'react';
import { Client, Order, GiveawayEntry, AppConfig } from '../types';
import { normalizePhone, formatCurrency, formatDate, downloadCSV } from '../utils';
import { Search, UploadCloud, Edit, ChevronDown, Star, Trophy, Crown, Medal, TrendingUp, Calendar, DollarSign, UserCheck, Gift, Download, CheckCircle2 } from 'lucide-react';
import { Footer } from './Shared';
import { GiveawayManagerModal } from './Modals';

interface ClientsViewProps {
    clients: Client[];
    orders: Order[];
    giveawayEntries: GiveawayEntry[];
    setModal: (modal: any) => void;
    setClientToEdit: (client: any) => void;
    appConfig: AppConfig;
}

export function ClientsView({ clients, orders, giveawayEntries, setModal, setClientToEdit, appConfig }: ClientsViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleClientsCount, setVisibleClientsCount] = useState(20);
    const [rankingMode, setRankingMode] = useState<'spent' | 'count'>('spent'); // spent = Gastaram mais, count = Pediram mais
    const [showGiveawayModal, setShowGiveawayModal] = useState(false);

    const clientsData = useMemo(() => {
        const ranking = new Map();
        
        // 1. Processar Pedidos
        orders.forEach((order: Order) => {
           // Ignorar pedidos cancelados para o ranking financeiro (opcional, mas recomendado)
           if (order.status === 'cancelled') return;

           const phoneKey = normalizePhone(order.phone);
           if (!phoneKey) return;
           
           const current = ranking.get(phoneKey) || { 
               id: phoneKey, 
               name: order.customer, 
               phone: order.phone, 
               address: order.address, 
               count: 0, 
               totalSpent: 0,
               lastOrderDate: order.createdAt 
           };

           // Atualiza data do último pedido se for mais recente
           const orderDate = order.createdAt?.seconds || 0;
           const currentDate = current.lastOrderDate?.seconds || 0;
           
           // Só conta para estatísticas se estiver concluído, mas mantém registro de cliente mesmo se pendente
           const isCompleted = order.status === 'completed';

           ranking.set(phoneKey, { 
               ...current, 
               count: current.count + (isCompleted ? 1 : 0), 
               totalSpent: current.totalSpent + (isCompleted ? (order.value || 0) : 0),
               lastOrderDate: orderDate > currentDate ? order.createdAt : current.lastOrderDate,
               name: order.customer // Mantém o nome mais recente
           });
        });

        // 2. Mesclar com cadastro de Clientes (para pegar obs, mapsLink, etc)
        clients.forEach((c: Client) => {
            const k = normalizePhone(c.phone);
            if(ranking.has(k)) {
                ranking.set(k, { ...ranking.get(k), id: c.id, name: c.name, address: c.address, obs: c.obs, mapsLink: c.mapsLink });
            } else {
                // Cliente cadastrado sem pedidos ainda
                ranking.set(k, { 
                    id: c.id || k, 
                    name: c.name, 
                    phone: c.phone, 
                    address: c.address, 
                    obs: c.obs, 
                    mapsLink: c.mapsLink, 
                    count: 0, 
                    totalSpent: 0,
                    lastOrderDate: null
                });
            }
        });

        const allClients = Array.from(ranking.values());

        // Ordenação Principal baseada no modo selecionado
        return allClients.sort((a: any, b: any) => {
            if (rankingMode === 'spent') return b.totalSpent - a.totalSpent;
            return b.count - a.count;
        }); 
    }, [clients, orders, rankingMode]);

    const filteredClients = clientsData.filter((c: any) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));
    const visibleClients = filteredClients.slice(0, visibleClientsCount);
    
    // Top 3 Separados para destaque
    const top3 = filteredClients.slice(0, 3);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown size={32} className="text-amber-400 fill-amber-400 animate-pulse drop-shadow-lg"/>;
        if (index === 1) return <Medal size={28} className="text-slate-300 fill-slate-300 drop-shadow-md"/>;
        if (index === 2) return <Medal size={28} className="text-orange-700 fill-orange-700 drop-shadow-md"/>;
        return <span className="font-bold text-slate-500 text-lg">#{index + 1}</span>;
    };

    return (
       <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto w-full h-full pb-40 md:pb-8 custom-scrollbar flex flex-col">
           <div className="flex-1 w-full max-w-6xl mx-auto">
               {/* Header & Controls */}
               <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
                   <div>
                       <h2 className="text-3xl font-black text-white flex items-center gap-3">
                           <Trophy className="text-amber-500" /> Hall da Fama
                       </h2>
                       <p className="text-slate-400 text-sm mt-1">
                           Conheça seus melhores clientes e seu histórico.
                       </p>
                   </div>
                   
                   <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                       
                       {/* Toggle Ranking Mode */}
                       <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex shrink-0">
                           <button 
                               onClick={() => setRankingMode('spent')}
                               className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${rankingMode === 'spent' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
                           >
                               <DollarSign size={14}/> R$
                           </button>
                           <button 
                               onClick={() => setRankingMode('count')}
                               className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${rankingMode === 'count' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'}`}
                           >
                               <UserCheck size={14}/> Qtd
                           </button>
                       </div>

                       {/* Search */}
                       <div className="relative flex-1 md:w-64">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                           <input 
                               className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-amber-500 focus:bg-slate-800 transition-colors" 
                               placeholder="Buscar..." 
                               value={searchTerm} 
                               onChange={e => setSearchTerm(e.target.value)} 
                           />
                       </div>
                       
                       {/* Botão Sorteio (Modal) */}
                       <button onClick={() => setShowGiveawayModal(true)} className="bg-purple-600 text-white px-4 py-2.5 rounded-xl hover:bg-purple-700 font-bold text-xs flex items-center gap-2 transition-colors shrink-0 shadow-lg border border-purple-500/50">
                           <Gift size={16}/> Sorteio ({giveawayEntries.length})
                       </button>

                       <button onClick={() => setModal('import')} className="bg-slate-800 text-white px-4 py-2.5 rounded-xl hover:bg-slate-700 border border-slate-700 transition-colors shrink-0">
                           <UploadCloud size={20}/>
                       </button>
                   </div>
               </div>

               {/* TOP 3 PODIUM - ADJUSTED & ALIGNED */}
               {!searchTerm && top3.length > 0 && (
                   <div className="relative mb-12 mt-8">
                       {/* Efeito de fundo decorativo */}
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-32 bg-amber-500/5 blur-3xl rounded-full -z-10 pointer-events-none"></div>
                       
                       <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-4 md:gap-6">
                           {top3.map((client: any, index: number) => {
                               const isFirst = index === 0;
                               const isSecond = index === 1;
                               const isThird = index === 2;

                               // Layout Order Logic for Desktop Podium (2 - 1 - 3)
                               let orderClass = "";
                               if (isFirst) orderClass = "order-1 md:order-2 z-30 w-full md:w-[32%]";
                               else if (isSecond) orderClass = "order-2 md:order-1 z-20 w-full md:w-[30%]";
                               else orderClass = "order-3 md:order-3 z-20 w-full md:w-[30%]";

                               return (
                                   <div 
                                       key={client.id} 
                                       onClick={() => { setClientToEdit(client); setModal('client'); }}
                                       className={`${orderClass} relative group cursor-pointer flex flex-col items-center text-center p-6 rounded-3xl border transition-all duration-300 ${
                                           isFirst 
                                           ? 'bg-gradient-to-b from-amber-900/40 via-slate-900 to-slate-900 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.15)] md:mb-12 min-h-[280px] md:scale-105' 
                                           : 'bg-slate-900 border-slate-800 hover:border-slate-600 shadow-xl min-h-[240px] hover:-translate-y-1'
                                       }`}
                                   >
                                       <div className={`absolute -top-6 left-1/2 -translate-x-1/2 rounded-full p-4 border shadow-xl ${isFirst ? 'bg-slate-950 border-amber-500' : 'bg-slate-900 border-slate-700'}`}>
                                           {getRankIcon(index)}
                                       </div>
                                       
                                       <div className="mt-8 mb-4 w-full px-2">
                                           <h3 className={`font-black text-white truncate ${isFirst ? 'text-2xl text-amber-100' : 'text-lg'}`}>{client.name}</h3>
                                           <p className="text-xs text-slate-500 font-mono mt-1">{normalizePhone(client.phone)}</p>
                                       </div>

                                       <div className="grid grid-cols-2 gap-3 w-full mt-auto bg-black/20 p-3 rounded-2xl border border-white/5">
                                           <div className="flex flex-col items-center justify-center">
                                               <span className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">Total</span>
                                               <span className={`font-black ${isFirst ? 'text-amber-400 text-lg' : 'text-emerald-400 text-base'}`}>
                                                   {formatCurrency(client.totalSpent)}
                                               </span>
                                           </div>
                                           <div className="flex flex-col items-center justify-center border-l border-white/5">
                                               <span className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">Pedidos</span>
                                               <span className="font-black text-white text-lg">{client.count}</span>
                                           </div>
                                       </div>
                                       
                                       {client.obs && (
                                           <div className="mt-3 text-[9px] text-slate-400 bg-slate-950/50 px-3 py-1 rounded-full border border-slate-800 max-w-full truncate w-full">
                                               {client.obs}
                                           </div>
                                       )}
                                   </div>
                               );
                           })}
                       </div>
                   </div>
               )}

               {/* TABLE LIST */}
               <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-400">
                          <thead className="bg-slate-950 text-slate-200 font-bold uppercase tracking-wider border-b border-slate-800">
                              <tr>
                                  <th className="p-4 pl-6"># Rank</th>
                                  <th className="p-4">Cliente</th>
                                  <th className="p-4 hidden md:table-cell">Endereço</th>
                                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={()=>setRankingMode('count')}>
                                      <div className="flex items-center justify-end gap-1">Pedidos {rankingMode==='count' && <ChevronDown size={14}/>}</div>
                                  </th>
                                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={()=>setRankingMode('spent')}>
                                      <div className="flex items-center justify-end gap-1">Total Gasto {rankingMode==='spent' && <ChevronDown size={14}/>}</div>
                                  </th>
                                  <th className="p-4 text-center">Ação</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                              {visibleClients.map((client, index) => (
                                  <tr key={client.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => { setClientToEdit(client); setModal('client'); }}>
                                      <td className="p-4 pl-6 font-mono font-bold text-slate-600 group-hover:text-amber-500 transition-colors">
                                          {index + 1}º
                                      </td>
                                      <td className="p-4">
                                          <p className="font-bold text-white text-base">{client.name}</p>
                                          <p className="text-xs text-slate-500">{client.phone}</p>
                                      </td>
                                      <td className="p-4 hidden md:table-cell max-w-xs">
                                          <p className="truncate text-xs">{client.address || 'Sem endereço cadastrado'}</p>
                                      </td>
                                      <td className="p-4 text-right">
                                          <span className={`font-bold px-2 py-1 rounded ${rankingMode === 'count' ? 'bg-blue-900/30 text-blue-400' : 'text-slate-300'}`}>
                                              {client.count}
                                          </span>
                                      </td>
                                      <td className="p-4 text-right">
                                          <span className={`font-bold px-2 py-1 rounded ${rankingMode === 'spent' ? 'bg-emerald-900/30 text-emerald-400' : 'text-emerald-500/80'}`}>
                                              {formatCurrency(client.totalSpent || 0)}
                                          </span>
                                      </td>
                                      <td className="p-4 text-center">
                                          <button onClick={(e) => { e.stopPropagation(); setClientToEdit(client); setModal('client'); }} className="p-2 bg-slate-800 hover:bg-amber-600 hover:text-white rounded-xl transition-colors text-slate-400 border border-slate-700 shadow-sm">
                                              <Edit size={16}/>
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  
                  {filteredClients.length > visibleClientsCount && (
                      <div className="p-4 text-center border-t border-slate-800 bg-slate-950">
                          <button onClick={() => setVisibleClientsCount(prev => prev + 20)} className="text-xs font-bold text-slate-500 hover:text-white flex items-center justify-center gap-2 mx-auto py-2 px-4 hover:bg-slate-900 rounded-lg transition-colors">
                              <ChevronDown size={14}/> Carregar mais clientes
                          </button>
                      </div>
                  )}
               </div>
           </div>

           {/* MODAL DE GERENCIAMENTO DE SORTEIO */}
           {showGiveawayModal && (
               <GiveawayManagerModal 
                   entries={giveawayEntries}
                   onClose={() => setShowGiveawayModal(false)}
                   appConfig={appConfig}
               />
           )}

           <Footer />
       </div>
    );
}