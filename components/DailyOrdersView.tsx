
import React, { useMemo, useState, useEffect } from 'react';
import { Order, Driver, AppConfig } from '../types';
import { formatTime, formatCurrency, sendOrderConfirmation, formatOrderId, formatDate } from '../utils';
import { StatBox, Footer } from './Shared';
import { ClipboardList, DollarSign, Trash2, Edit, FileText, MessageCircle, MapPin, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, BarChart2, TrendingUp, CalendarDays, CalendarRange } from 'lucide-react';
import { EditOrderModal, ReceiptModal } from './Modals';

interface DailyProps {
    orders: Order[];
    drivers: Driver[];
    onDeleteOrder: (id: string) => void;
    setModal: (modal: any) => void;
    onUpdateOrder: (id: string, data: any) => void;
    appConfig: AppConfig;
}

// --- SUB-COMPONENTE: GRÁFICO DE VENDAS MULTI-PERÍODO ---
const SalesChart = ({ allOrders, selectedDate, period, setPeriod }: { allOrders: Order[], selectedDate: Date, period: 'day'|'week'|'month', setPeriod: (p: 'day'|'week'|'month') => void }) => {
    
    const chartData = useMemo(() => {
        let labels: string[] = [];
        let data: number[] = [];
        let maxVal = 0;

        // Filtrar pedidos válidos (não cancelados)
        const validOrders = allOrders.filter(o => o.status !== 'cancelled' && o.createdAt);

        if (period === 'day') {
            // VISO DIÁRIA (Por Hora)
            const targetDateStr = selectedDate.toLocaleDateString('pt-BR');
            const dayOrders = validOrders.filter(o => new Date(o.createdAt.seconds * 1000).toLocaleDateString('pt-BR') === targetDateStr);
            
            data = new Array(24).fill(0);
            dayOrders.forEach(o => {
                const hour = new Date(o.createdAt.seconds * 1000).getHours();
                data[hour] += o.value || 0;
            });
            labels = Array.from({length: 24}, (_, i) => `${i}h`);

        } else if (period === 'week') {
            // VISÃO SEMANAL (Dom - Sáb)
            // Encontrar o domingo da semana da data selecionada
            const startOfWeek = new Date(selectedDate);
            startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
            startOfWeek.setHours(0,0,0,0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23,59,59,999);

            data = new Array(7).fill(0);
            
            validOrders.forEach(o => {
                const d = new Date(o.createdAt.seconds * 1000);
                if (d >= startOfWeek && d <= endOfWeek) {
                    data[d.getDay()] += o.value || 0;
                }
            });
            labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        } else if (period === 'month') {
            // VISÃO MENSAL (Dias do Mês)
            const month = selectedDate.getMonth();
            const year = selectedDate.getFullYear();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            data = new Array(daysInMonth).fill(0);
            
            validOrders.forEach(o => {
                const d = new Date(o.createdAt.seconds * 1000);
                if (d.getMonth() === month && d.getFullYear() === year) {
                    data[d.getDate() - 1] += o.value || 0;
                }
            });
            labels = Array.from({length: daysInMonth}, (_, i) => `${i + 1}`);
        }

        maxVal = Math.max(...data, 1);
        
        // Para visualização otimizada, cortamos zeros à esquerda/direita apenas no modo DIA
        let displayData = data.map((v, i) => ({ v, l: labels[i] }));
        
        if (period === 'day') {
            const activeIndices = data.map((val, idx) => ({ idx, val })).filter(h => h.val > 0);
            const start = activeIndices.length > 0 ? Math.max(0, activeIndices[0].idx - 1) : 17;
            const end = activeIndices.length > 0 ? Math.min(23, activeIndices[activeIndices.length - 1].idx + 1) : 23;
            displayData = displayData.slice(start, end + 1);
        }

        return { displayData, maxVal };
    }, [allOrders, selectedDate, period]);

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl mb-6 flex flex-col h-[340px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <TrendingUp className="text-emerald-500" size={20}/> 
                    {period === 'day' ? 'Vendas por Hora (Dia Selecionado)' : period === 'week' ? 'Performance da Semana' : 'Evolução no Mês'}
                </h3>
                
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button onClick={() => setPeriod('day')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${period === 'day' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Dia</button>
                    <button onClick={() => setPeriod('week')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${period === 'week' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Semana</button>
                    <button onClick={() => setPeriod('month')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${period === 'month' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Mês</button>
                </div>
            </div>
            
            <div className="flex-1 flex items-end gap-2 md:gap-3 w-full pb-2">
                {chartData.displayData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">Sem dados para exibir.</div>
                ) : (
                    chartData.displayData.map(({ v, l }, i) => {
                        const heightPercent = (v / chartData.maxVal) * 100;
                        const isPeak = v === chartData.maxVal && v > 0;
                        
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                <div className="w-full relative flex items-end h-full">
                                    <div 
                                        className={`w-full rounded-t-sm md:rounded-t-lg transition-all duration-500 relative ${v > 0 ? (isPeak ? 'bg-gradient-to-t from-amber-600/80 to-amber-400' : 'bg-gradient-to-t from-emerald-900/50 to-emerald-500 hover:to-emerald-400') : 'bg-slate-800/30'}`}
                                        style={{ height: `${heightPercent}%`, minHeight: v > 0 ? '4px' : '4px' }}
                                    >
                                        {/* Tooltip Hover */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded border border-slate-700 pointer-events-none whitespace-nowrap z-20 shadow-xl font-bold">
                                            {formatCurrency(v)}
                                        </div>
                                    </div>
                                </div>
                                <span className={`text-[9px] md:text-[10px] mt-2 truncate max-w-full font-bold ${isPeak ? 'text-amber-500' : 'text-slate-500'}`}>{l}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENTE: MODAL DE CALENDÁRIO ---
const CalendarModal = ({ isOpen, onClose, selectedDate, onSelectDate }: any) => {
    const [viewDate, setViewDate] = useState(new Date(selectedDate));

    useEffect(() => {
        if(isOpen) setViewDate(new Date(selectedDate));
    }, [isOpen, selectedDate]);

    if (!isOpen) return null;

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const changeMonth = (delta: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setViewDate(newDate);
    };

    const handleSelect = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onSelectDate(newDate);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg capitalize">
                        {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white"/></button>
                </div>
                
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-800 rounded-full text-white"><ChevronLeft/></button>
                        <button onClick={() => setViewDate(new Date())} className="text-xs font-bold text-amber-500 hover:text-amber-400 uppercase">Hoje</button>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-800 rounded-full text-white"><ChevronRight/></button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-xs font-bold text-slate-500 py-1">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => {
                            if (day === null) return <div key={i} />;
                            
                            const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                            const isSelected = currentDate.toDateString() === selectedDate.toDateString();
                            const isToday = currentDate.toDateString() === new Date().toDateString();

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(day)}
                                    className={`
                                        h-10 rounded-lg text-sm font-bold transition-all
                                        ${isSelected ? 'bg-amber-500 text-slate-900 shadow-lg scale-105' : 'text-slate-300 hover:bg-slate-800'}
                                        ${isToday && !isSelected ? 'border border-amber-500/50 text-amber-500' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export function DailyOrdersView({ orders, drivers, onDeleteOrder, setModal, onUpdateOrder, appConfig }: DailyProps) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalType, setModalType] = useState<'edit'|'receipt'|null>(null);
    
    // Estado para controlar a data selecionada (Padrão: Hoje)
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    // Estado do período do gráfico (Dia, Semana, Mês)
    const [chartPeriod, setChartPeriod] = useState<'day'|'week'|'month'>('day');

    // Manipuladores de Data
    const handlePrevDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const isSelectedDateToday = useMemo(() => {
        const today = new Date();
        return selectedDate.getDate() === today.getDate() &&
               selectedDate.getMonth() === today.getMonth() &&
               selectedDate.getFullYear() === today.getFullYear();
    }, [selectedDate]);

    const dailyData = useMemo(() => {
        // Filtra a lista SOMENTE para o dia selecionado (tabela)
        const targetDateStr = selectedDate.toLocaleDateString('pt-BR');

        const filteredOrders = orders.filter((o: Order) => {
            if (!o.createdAt) return false;
            const orderDate = new Date(o.createdAt.seconds * 1000);
            return orderDate.toLocaleDateString('pt-BR') === targetDateStr;
        });

        // Ordenar: Mais recentes primeiro
        filteredOrders.sort((a: Order, b: Order) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        // Calcular totais considerando apenas pedidos não cancelados para faturamento real
        const validOrders = filteredOrders.filter(o => o.status !== 'cancelled');
        const totalValue = validOrders.reduce((acc, o) => acc + (o.value || 0), 0);

        return { 
            filteredOrders, 
            totalOrders: validOrders.length, 
            totalValue 
        };
    }, [orders, selectedDate]);

    return (
        /* GARANTE QUE O PARENT SEJA FLEX E TENHA SCROLL, COM PADDING EXTRA NO FINAL */
        <div className="flex-1 bg-slate-950 px-[5%] py-6 md:py-8 overflow-y-auto w-full pb-40 md:pb-10 custom-scrollbar flex flex-col h-full">
            <div className="flex-1 max-w-7xl mx-auto w-full">
                {/* CABEÇALHO COM NAVEGAÇÃO DE DATA */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                            <ClipboardList className="text-amber-500"/> 
                            Histórico e Análise
                        </h2>
                        <p className="text-xs md:text-sm text-slate-500">
                            {isSelectedDateToday ? 'Movimentação de Hoje' : `Visualizando: ${selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-lg w-full md:w-auto">
                        <button onClick={handlePrevDay} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors">
                            <ChevronLeft size={20}/>
                        </button>
                        
                        <button 
                            onClick={() => setIsCalendarOpen(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-amber-500/50 transition-colors group"
                        >
                            <CalendarIcon size={16} className="text-amber-500 group-hover:scale-110 transition-transform"/>
                            <span className="text-sm font-bold text-white whitespace-nowrap">
                                {selectedDate.toLocaleDateString('pt-BR')}
                            </span>
                        </button>

                        <button onClick={handleNextDay} disabled={isSelectedDateToday} className={`p-2 rounded-lg transition-colors ${isSelectedDateToday ? 'text-slate-700 cursor-not-allowed' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                            <ChevronRight size={20}/>
                        </button>
                    </div>
                </div>

                {/* STATS BOXES */}
                <div className="grid grid-cols-2 gap-3 mb-6 md:mb-8">
                    <StatBox 
                        label="Pedidos no Dia" 
                        value={dailyData.totalOrders} 
                        icon={<ClipboardList/>} 
                        color="bg-blue-900/20 text-blue-400 border-blue-900/50"
                    />
                    <StatBox 
                        label="Faturamento do Dia" 
                        value={formatCurrency(dailyData.totalValue)} 
                        icon={<DollarSign/>} 
                        color="bg-emerald-900/20 text-emerald-400 border-emerald-900/50"
                    />
                </div>

                {/* LISTA DE PEDIDOS (TABLE) */}
                <div className="hidden md:block bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl min-h-[300px] mb-8">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                        <h3 className="font-bold text-white flex items-center gap-2"><FileText size={18} className="text-slate-400"/> Lista de Pedidos ({selectedDate.toLocaleDateString('pt-BR')})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400 table-fixed">
                            <thead className="bg-slate-950 text-slate-200 font-bold uppercase tracking-wider border-b border-slate-800">
                                <tr>
                                    <th className="p-4 w-24">Hora</th>
                                    <th className="p-4 w-28">ID</th>
                                    <th className="p-4 w-32">Status</th>
                                    <th className="p-4 w-48">Cliente</th>
                                    <th className="p-4">Endereço</th>
                                    <th className="p-4 w-32 text-right">Valor</th>
                                    <th className="p-4 w-40 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {dailyData.filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <CalendarIcon size={32} className="opacity-20"/>
                                                <p>Nenhum pedido registrado nesta data.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    dailyData.filteredOrders.map((o: Order) => (
                                        <tr key={o.id} className="hover:bg-slate-800/50 transition-colors cursor-pointer group" onClick={() => { setSelectedOrder(o); setModalType('edit'); }}>
                                            <td className="p-4 font-bold text-white truncate">{formatTime(o.createdAt)}</td>
                                            <td className="p-4 font-mono text-xs truncate">{formatOrderId(o.id)}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${o.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' : o.status === 'pending' ? 'bg-red-900/30 text-red-400' : o.status === 'cancelled' ? 'bg-slate-800 text-slate-500 line-through' : o.status === 'preparing' ? 'bg-blue-900/30 text-blue-400' : 'bg-amber-900/30 text-amber-400'}`}>
                                                    {o.status === 'completed' ? 'Entregue' : o.status === 'pending' ? 'Pendente' : o.status === 'cancelled' ? 'Cancelado' : o.status === 'preparing' ? 'Cozinha' : 'Em Rota'}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium text-slate-300 truncate">{o.customer}</td>
                                            <td className="p-4 hidden md:table-cell truncate">{o.address}</td>
                                            <td className="p-4 text-right text-emerald-400 font-bold truncate">{formatCurrency(o.value || 0)}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); sendOrderConfirmation(o, appConfig.appName, appConfig.estimatedTime); }} className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-md" title="Confirmar Pedido (WhatsApp)"><MessageCircle size={16}/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); setModalType('receipt'); }} className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Ver Comprovante"><FileText size={16}/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); setModalType('edit'); }} className="p-2 text-slate-500 hover:text-amber-500 hover:bg-slate-700 rounded-lg transition-colors" title="Editar"><Edit size={16}/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); onDeleteOrder(o.id); }} className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-700 rounded-lg transition-colors" title="Excluir"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* VIEW MOBILE (CARDS) */}
                <div className="md:hidden space-y-3 mb-8">
                    {dailyData.filteredOrders.length === 0 ? (
                        <div className="text-center text-slate-500 py-10 bg-slate-900 rounded-xl border border-slate-800">
                            Nenhum pedido nesta data.
                        </div>
                    ) : (
                        dailyData.filteredOrders.map((o: Order) => (
                            <div key={o.id} className={`bg-slate-900 rounded-xl border p-4 shadow-md relative overflow-hidden ${o.status === 'cancelled' ? 'border-slate-800 opacity-60' : 'border-slate-800'}`} onClick={() => { setSelectedOrder(o); setModalType('edit'); }}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="min-w-0 flex-1 mr-2">
                                        <span className={`font-bold text-base truncate block ${o.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-white'}`}>{o.customer}</span>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={10}/> <span className="truncate">{o.address || 'Balcão'}</span></div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`font-mono font-bold text-base block ${o.status === 'cancelled' ? 'text-slate-500' : 'text-emerald-400'}`}>{formatCurrency(o.value || 0)}</span>
                                        <span className="text-[10px] text-slate-500">{formatTime(o.createdAt)}</span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${o.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' : o.status === 'pending' ? 'bg-red-900/30 text-red-400' : o.status === 'cancelled' ? 'bg-slate-800 text-slate-500' : o.status === 'preparing' ? 'bg-blue-900/30 text-blue-400' : 'bg-amber-900/30 text-amber-400'}`}>
                                        {o.status === 'completed' ? 'Entregue' : o.status === 'pending' ? 'Pendente' : o.status === 'cancelled' ? 'Cancelado' : o.status === 'preparing' ? 'Cozinha' : 'Em Rota'}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); sendOrderConfirmation(o, appConfig.appName, appConfig.estimatedTime); }} className="bg-emerald-600 text-white p-2 rounded-lg shadow"><MessageCircle size={16}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); setModalType('receipt'); }} className="bg-slate-800 text-slate-300 p-2 rounded-lg border border-slate-700"><FileText size={16}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteOrder(o.id); }} className="bg-slate-800 text-red-400 p-2 rounded-lg border border-slate-700"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* GRAPHIC CHART */}
                <SalesChart 
                    allOrders={orders} 
                    selectedDate={selectedDate} 
                    period={chartPeriod}
                    setPeriod={setChartPeriod}
                />
            </div>

            {/* MODAIS */}
            <CalendarModal 
                isOpen={isCalendarOpen} 
                onClose={() => setIsCalendarOpen(false)} 
                selectedDate={selectedDate} 
                onSelectDate={setSelectedDate} 
            />

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
