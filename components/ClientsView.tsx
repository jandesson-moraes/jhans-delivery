import React, { useState, useMemo } from 'react';
import { Client, Order } from '../types';
import { normalizePhone, formatCurrency } from '../utils';
import { Search, UploadCloud, Edit, ChevronDown, Star } from 'lucide-react';

export function ClientsView({ clients, orders, setModal, setClientToEdit }: any) {
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleClientsCount, setVisibleClientsCount] = useState(30);

    const clientsData = useMemo(() => {
        const ranking = new Map();
        orders.forEach((order: Order) => {
           const phoneKey = normalizePhone(order.phone);
           if (!phoneKey) return;
           const current = ranking.get(phoneKey) || { id: phoneKey, name: order.customer, phone: order.phone, address: order.address, count: 0, totalSpent: 0 };
           ranking.set(phoneKey, { ...current, count: current.count + 1, totalSpent: current.totalSpent + (order.value || 0) });
        });
        clients.forEach((c: Client) => {
            const k = normalizePhone(c.phone);
            if(ranking.has(k)) {
                ranking.set(k, { ...ranking.get(k), id: c.id, name: c.name, address: c.address, obs: c.obs, mapsLink: c.mapsLink });
            } else {
                ranking.set(k, { id: c.id || k, name: c.name, phone: c.phone, address: c.address, obs: c.obs, mapsLink: c.mapsLink, count: 0, totalSpent: 0 });
            }
        });
        return Array.from(ranking.values()).sort((a: any, b: any) => b.count - a.count); 
    }, [clients, orders]);

    const filteredClients = clientsData.filter((c: any) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));
    const visibleClients = filteredClients.slice(0, visibleClientsCount);

    return (
       <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto w-full h-full pb-40 md:pb-8 custom-scrollbar">
           <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
               <div><h2 className="text-2xl font-bold text-white">Gestão de Clientes</h2><p className="text-sm text-slate-500">{clients.length} cadastrados</p></div>
               <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-3 text-slate-500" size={18}/><input className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-amber-500" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                  <button onClick={() => setModal('import')} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md"><UploadCloud size={18}/></button>
               </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               {filteredClients.slice(0, 3).map((client: any, index: number) => (
                   <div key={client.id} className="flex items-center p-4 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-amber-500/50 transition-colors cursor-pointer" onClick={() => { setClientToEdit(client); setModal('client'); }}>
                       <div className={`absolute top-0 left-0 w-1 h-full ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-400' : 'bg-orange-700'}`}></div>
                       <div className="w-12 h-12 flex items-center justify-center bg-slate-950 rounded-full font-bold text-lg text-white mr-4 border border-slate-800">{index + 1}</div>
                       <div className="flex-1"><h4 className="font-bold text-white text-lg truncate">{client.name}</h4><p className="text-sm text-slate-500">{client.totalOrders || client.count} pedidos</p></div>
                       <div className="text-right"><p className="font-bold text-emerald-400 text-sm">{formatCurrency(client.totalSpent)}</p></div>
                       <Star className="absolute top-2 right-2 text-yellow-500 opacity-20 rotate-12" size={24} />
                   </div>
               ))}
           </div>
           <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-950 text-slate-200 font-bold uppercase tracking-wider border-b border-slate-800"><tr><th className="p-4">Nome</th><th className="p-4 hidden md:table-cell">Telefone</th><th className="p-4 hidden md:table-cell">Endereço</th><th className="p-4 text-right">Total Gasto</th><th className="p-4 text-center">Ação</th></tr></thead>
                  <tbody className="divide-y divide-slate-800">
                      {visibleClients.map((client) => (
                          <tr key={client.id} className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-4 font-bold text-white">{client.name}</td><td className="p-4 hidden md:table-cell">{client.phone}</td><td className="p-4 hidden md:table-cell truncate max-w-xs">{client.address}</td><td className="p-4 text-right text-emerald-400 font-bold">{formatCurrency(client.totalSpent || 0)}</td>
                              <td className="p-4 text-center"><button onClick={() => { setClientToEdit(client); setModal('client'); }} className="p-2 bg-slate-800 hover:bg-amber-600 hover:text-white rounded-lg transition-colors text-slate-400"><Edit size={16}/></button></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {filteredClients.length > visibleClientsCount && (<div className="p-4 text-center border-t border-slate-800"><button onClick={() => setVisibleClientsCount(prev => prev + 30)} className="text-xs font-bold text-slate-500 hover:text-white flex items-center justify-center gap-1 mx-auto"><ChevronDown size={14}/> Carregar mais clientes</button></div>)}
           </div>
       </div>
    );
}