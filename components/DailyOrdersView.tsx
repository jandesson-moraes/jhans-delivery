
import React, { useMemo, useState } from 'react';
import { Order, Driver, AppConfig } from '../types';
import { isToday, formatTime, formatCurrency, sendOrderConfirmation, formatOrderId } from '../utils';
import { StatBox, Footer } from './Shared';
import { ClipboardList, DollarSign, Trash2, Edit, FileText, MessageCircle } from 'lucide-react';
import { EditOrderModal, ReceiptModal } from './Modals';

interface DailyProps {
    orders: Order[];
    drivers: Driver[];
    onDeleteOrder: (id: string) => void;
    setModal: (modal: any) => void;
    onUpdateOrder: (id: string, data: any) => void;
    appConfig: AppConfig;
}

export function DailyOrdersView({ orders, drivers, onDeleteOrder, setModal, onUpdateOrder, appConfig }: DailyProps) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalType, setModalType] = useState<'edit'|'receipt'|null>(null);

    const dailyData = useMemo(() => {
        const todayOrders = orders.filter((o: Order) => isToday(o.createdAt));
        // Ordenar: Mais recentes primeiro
        todayOrders.sort((a: Order, b: Order) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        return { todayOrders, totalOrders: todayOrders.length, totalValue: todayOrders.reduce((acc, o) => acc + (o.value || 0), 0) };
    }, [orders]);

    return (
        <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto w-full h-full pb-40 md:pb-8 custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Controle Diário</h2>
                <p className="text-sm text-slate-500">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
                <StatBox label="Pedidos Hoje" value={dailyData.totalOrders} icon={<ClipboardList/>} color="bg-blue-900/20 text-blue-400 border-blue-900/50"/>
                <StatBox label="Faturamento Dia" value={formatCurrency(dailyData.totalValue)} icon={<DollarSign/>} color="bg-emerald-900/20 text-emerald-400 border-emerald-900/50"/>
            </div>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-slate-200 font-bold uppercase tracking-wider border-b border-slate-800">
                            <tr><th className="p-4">Hora</th><th className="p-4">ID</th><th className="p-4">Status</th><th className="p-4">Cliente</th><th className="p-4 hidden md:table-cell">Endereço</th><th className="p-4 text-right">Valor</th><th className="p-4 text-center">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {dailyData.todayOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">Nenhum pedido registrado hoje.</td>
                                </tr>
                            ) : (
                                dailyData.todayOrders.map((o: Order) => (
                                    <tr key={o.id} className="hover:bg-slate-800/50 transition-colors cursor-pointer group" onClick={() => { setSelectedOrder(o); setModalType('edit'); }}>
                                        <td className="p-4 font-bold text-white">{formatTime(o.createdAt)}</td>
                                        <td className="p-4 font-mono text-xs">{formatOrderId(o.id)}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${o.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' : o.status === 'pending' ? 'bg-red-900/30 text-red-400' : o.status === 'preparing' ? 'bg-blue-900/30 text-blue-400' : 'bg-amber-900/30 text-amber-400'}`}>{o.status === 'completed' ? 'Entregue' : o.status === 'pending' ? 'Pendente' : o.status === 'preparing' ? 'Cozinha' : 'Em Rota'}</span></td>
                                        <td className="p-4 font-medium text-slate-300">{o.customer}</td>
                                        <td className="p-4 hidden md:table-cell truncate max-w-xs">{o.address}</td>
                                        <td className="p-4 text-right text-emerald-400 font-bold">{formatCurrency(o.value || 0)}</td>
                                        <td className="p-4 text-center flex items-center justify-center gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); sendOrderConfirmation(o, appConfig.appName); }} className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-md" title="Confirmar Pedido (WhatsApp)"><MessageCircle size={16}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); setModalType('receipt'); }} className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Ver Comprovante"><FileText size={16}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); setModalType('edit'); }} className="p-2 text-slate-500 hover:text-amber-500 hover:bg-slate-700 rounded-lg transition-colors" title="Editar"><Edit size={16}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); if(confirm('Tem certeza que deseja excluir este pedido permanentemente?')) onDeleteOrder(o.id); }} className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-700 rounded-lg transition-colors" title="Excluir"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalType === 'edit' && selectedOrder && (
                <EditOrderModal order={selectedOrder} onClose={() => { setModalType(null); setSelectedOrder(null); }} onSave={onUpdateOrder} />
            )}

            {modalType === 'receipt' && selectedOrder && (
                <ReceiptModal order={selectedOrder} onClose={() => { setModalType(null); setSelectedOrder(null); }} appConfig={appConfig} />
            )}
            
            <Footer />
        </div>
    );
}
