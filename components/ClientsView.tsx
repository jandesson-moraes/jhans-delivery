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
        if (index === 0) return <Crown size={24} className="text-amber-400 fill-amber-400 animate-pulse drop-shadow-lg"/>;
        if (index === 1) return <Medal size={20} className="text-slate-300 fill-slate-300 drop-shadow-md"/>;
        if (index === 2) return <Medal size={20} className="text-orange-700 fill-orange-700 drop-shadow-md"/>;
        return <span className="font-bold text-slate-500 text-lg">#{index + 1}</span>;
    };

    return (
       <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto w-full h-full pb-40 md:pb-8 custom-scrollbar flex flex-col">
           <div className="flex-1 w-full max-w-6xl mx-auto mt-[5%] md:mt-[2%]">
               {/* Header & Controls - INCREASED MARGIN BOTTOM TO AVOID CLASH WITH CROWN ICON */}
               <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-4">
                   <div>
                       <h2 className="text-2xl font-black text-white flex items-center gap-2">
                           <Trophy className="text-amber-500" size={24}/> Hall da Fama
                       </h2>
                       <p className="text-slate-400 text-xs mt-0.5 hidden md:block">
                           Conheça seus melhores clientes e seu histórico.
                       </p>
                   </div>
                   
                   <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto items-center">
                       
                       {/* Toggle Ranking Mode (SLIDING ANIMATION) - SLIGHTLY SMALLER */}
                       <div className="relative bg-slate-900 p-1 rounded-xl border border-slate-800 flex w-44 h-10 shrink-0 shadow-inner">
                           {/* Fundo Deslizante */}
                           <div 
                               className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-lg transition-all duration-300 ease-out border border-white/10 ${
                                   rankingMode === 'spent' 
                                   ? 'left-1 bg-gradient-to-r from-emerald-600 to-emerald-500' 
                                   : 'left-[calc(50%+2px)] bg-gradient-to-r from-blue-600 to-blue-500'
                               }`}
                           ></div>

                           {/* Botões Transparentes por cima */}
                           <button 
                               onClick={() => setRankingMode('spent')}
                               className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-bold transition-colors duration-300 ${rankingMode === 'spent' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                           >
                               <DollarSign size={12}/> Total R$
                           </button>
                           <button 
                               onClick={() => setRankingMode('count')}
                               className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-bold transition-colors duration-300 ${rankingMode === 'count' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                           >
                               <UserCheck size={12}/> Qtd
                           </button>
                       </div>

                       {/* Search - SMALLER HEIGHT */}
                       <div className="relative flex-1 w-full md:w-64">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                           <input 
                               className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-slate-800 transition-colors shadow-sm" 
                               placeholder="Buscar cliente..." 
                               value={searchTerm} 
                               onChange={e => setSearchTerm(e.target.value)} 
                           />
                       </div>
                       
                       <div className="flex gap-2 w-full md:w-auto">
                           {/* Botão Sorteio */}
                           <button onClick={() => setShowGiveawayModal(true)} className="flex-1 md:flex-none bg-purple-600 text-white px-4 py-2.5 rounded-xl hover:bg-purple-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg border border-purple-500/50">
                               <Gift size={16}/> Sorteio ({giveawayEntries.length})
                           </button>

                           <button onClick={() => setModal('import')} className="bg-slate-800 text-white px-3 py-2.5 rounded-xl hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm" title="Importar CSV">
                               <UploadCloud size={18}/>
                           </button>
                       </div>
                   </div>
               </div>

               {/* TOP 3 PODIUM - ULTRA COMPACT LAYOUT */}
               {!searchTerm && top3.length > 0 && (
                   <div className="relative mb-6 mt-4">
                       {/* Efeito de fundo decorativo reduzido */}
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-16 bg-amber-500/5 blur-3xl rounded-full -z-10 pointer-events-none"></div>
                       
                       <div className="flex flex-col md:flex-row items-end justify-center gap-3 md:gap-4">
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
                                       className={`${orderClass} relative group cursor-pointer flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-300 shadow-xl overflow-visible ${
                                           isFirst 
                                           ? 'bg-gradient-to-b from-amber-900/40 via-slate-900 to-slate-900 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] h-[200px] md:scale-105 z-40' 
                                           : 'bg-slate-900 border-slate-800 hover:border-slate-600 h-[170px] hover:-translate-y-1 z-30'
                                       }`}
                                   >
                                       <div className={`absolute -top-4 left-1/2 -translate-x-1/2 rounded-full p-2 border shadow-lg shrink-0 ${isFirst ? 'bg-slate-950 border-amber-500' : 'bg-slate-900 border-slate-700'}`}>
                                           {getRankIcon(index)}
                                       </div>
                                       
                                       <div className="mt-5 mb-1 w-full px-1 flex-1 flex flex-col justify-center">
                                           <h3 className={`font-black text-white truncate w-full ${isFirst ? 'text-lg text-amber-100' : 'text-sm'}`}>{client.name}</h3>
                                           <p className="text-[9px] text-slate-500 font-mono mt-0.5">{normalizePhone(client.phone)}</p>
                                       </div>

                                       <div className="grid grid-cols-2 gap-1 w-full mt-auto bg-black/20 p-1.5 rounded-xl border border-white/5 shrink-0">
                                           <div className="flex flex-col items-center justify-center">
                                               <span className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">Total</span>
                                               <span className={`font-black truncate w-full text-center ${isFirst ? 'text-amber-400 text-sm' : 'text-emerald-400 text-xs'}`}>
                                                   {formatCurrency(client.totalSpent)}
                                               </span>
                                           </div>
                                           <div className="flex flex-col items-center justify-center border-l border-white/5">
                                               <span className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">Pedidos</span>
                                               <span className="font-black text-white text-sm">{client.count}</span>
                                           </div>
                                       </div>
                                       
                                       {client.obs && (
                                           <div className="absolute -bottom-2 bg-slate-950 border border-slate-800 text-[8px] text-slate-400 px-2 py-0.5 rounded-full truncate max-w-[90%] shadow-md">
                                               {client.obs}
                                           </div>
                                       )}
                                   </div>
                               );
                           })}
                       </div>
                   </div>
               )}

               {/* TABLE LIST - FIXED LAYOUT TO PREVENT DANCING */}
               <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-400 table-fixed">
                          <thead className="bg-slate-950 text-slate-200 font-bold uppercase tracking-wider border-b border-slate-800">
                              <tr>
                                  <th className="p-4 pl-6 w-24"># Rank</th>
                                  <th className="p-4 w-auto">Cliente</th>
                                  <th className="p-4 hidden md:table-cell w-1/3">Endereço</th>
                                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors w-32" onClick={()=>setRankingMode('count')}>
                                      <div className="flex items-center justify-end gap-1">Pedidos {rankingMode==='count' && <ChevronDown size={14}/>}</div>
                                  </th>
                                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors w-36" onClick={()=>setRankingMode('spent')}>
                                      <div className="flex items-center justify-end gap-1">Total {rankingMode==='spent' && <ChevronDown size={14}/>}</div>
                                  </th>
                                  <th className="p-4 text-center w-20">Ação</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                              {visibleClients.map((client, index) => (
                                  <tr key={client.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => { setClientToEdit(client); setModal('client'); }}>
                                      <td className="p-4 pl-6 font-mono font-bold text-slate-600 group-hover:text-amber-500 transition-colors truncate">
                                          {index + 1}º
                                      </td>
                                      <td className="p-4">
                                          <p className="font-bold text-white text-base truncate">{client.name}</p>
                                          <p className="text-xs text-slate-500 font-mono truncate">{client.phone}</p>
                                      </td>
                                      <td className="p-4 hidden md:table-cell">
                                          <p className="truncate text-xs">{client.address || 'Sem endereço cadastrado'}</p>
                                      </td>
                                      <td className="p-4 text-right">
                                          <span className={`font-bold px-2 py-1 rounded inline-block min-w-[3rem] text-center ${rankingMode === 'count' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' : 'text-slate-300'}`}>
                                              {client.count}
                                          </span>
                                      </td>
                                      <td className="p-4 text-right">
                                          <span className={`font-bold px-2 py-1 rounded inline-block min-w-[5rem] text-center ${rankingMode === 'spent' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'text-emerald-500/80'}`}>
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
