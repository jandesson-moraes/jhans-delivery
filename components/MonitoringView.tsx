
import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Driver, Order, Vale, AppConfig } from '../types';
import { normalizePhone, formatTime, formatCurrency, isToday } from '../utils';
import { Battery, Signal, Bike, Navigation, LocateFixed, Users, Edit, Trash2, ShoppingBag, Clock, DollarSign, List, X, PlusCircle, Settings2, Helmet, Activity } from 'lucide-react';

// --- ÍCONES DINÂMICOS COM FOTO E STATUS ---
const createCustomIcon = (url: string | undefined, type: 'store' | 'driver', status?: string) => {
    // Cores baseadas no status
    let borderColor = '#64748b'; // Slate (Offline/Default)
    let shadowColor = 'rgba(0,0,0,0.3)';
    
    if (type === 'store') {
        borderColor = '#8b5cf6'; // Roxo (Loja)
        shadowColor = 'rgba(139, 92, 246, 0.5)';
    } else {
        if (status === 'delivering') {
            borderColor = '#f59e0b'; // Amber (Entregando)
            shadowColor = 'rgba(245, 158, 11, 0.6)';
        } else if (status === 'available') {
            borderColor = '#10b981'; // Emerald (Disponível)
            shadowColor = 'rgba(16, 185, 129, 0.5)';
        }
    }

    const size = type === 'store' ? 56 : 48;
    // Imagem fallback se não tiver URL
    const imageUrl = url || (type === 'store' 
        ? 'https://cdn-icons-png.flaticon.com/512/7877/7877890.png' 
        : 'https://cdn-icons-png.flaticon.com/512/12533/12533583.png');

    const html = `
        <div style="
            width: ${size}px; 
            height: ${size}px; 
            border-radius: 50%; 
            border: 3px solid ${borderColor}; 
            background-color: #0f172a;
            background-image: url('${imageUrl}');
            background-size: cover;
            background-position: center;
            box-shadow: 0 4px 15px ${shadowColor};
            position: relative;
            transition: all 0.3s ease;
        ">
            ${type === 'driver' ? `
                <div style="
                    position: absolute; 
                    bottom: 0; 
                    right: 0; 
                    width: 14px; 
                    height: 14px; 
                    background-color: ${borderColor}; 
                    border: 2px solid #0f172a; 
                    border-radius: 50%;
                    box-shadow: 0 0 5px ${borderColor};
                "></div>
            ` : `
                <div style="
                    position: absolute; 
                    bottom: -5px; 
                    left: 50%; 
                    transform: translateX(-50%);
                    background-color: ${borderColor};
                    color: white;
                    font-size: 8px;
                    font-weight: bold;
                    padding: 1px 4px;
                    border-radius: 4px;
                    white-space: nowrap;
                ">LOJA</div>
            `}
        </div>
    `;

    return L.divIcon({
        html: html,
        className: 'custom-map-marker', // Classe para evitar estilos padrão conflitantes
        iconSize: [size, size],
        popupAnchor: [0, -size/2]
    });
};

interface MonitoringProps {
    drivers: Driver[];
    orders: Order[];
    vales?: Vale[];
    center?: { lat: number; lng: number };
    onNavigate?: (view: string) => void;
    onDeleteDriver?: (id: string) => void;
    setDriverToEdit?: (driver: Driver | null) => void;
    setModal?: (modal: string) => void;
    onCloseCycle?: (driverId: string, data: any) => void;
    isFleetOpen?: boolean;
    setIsFleetOpen?: (isOpen: boolean) => void;
    appConfig?: AppConfig; // Recebe config para pegar logo
}

// Sub-componente para controle do Mapa e Correção de Renderização
function MapController({ center, doRecenter, setDoRecenter }: any) {
    const map = useMap();
    
    // CORREÇÃO CRÍTICA: Força o mapa a recalcular o tamanho ao carregar ou redimensionar
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);

    React.useEffect(() => {
        if (doRecenter && center && !isNaN(center.lat) && !isNaN(center.lng)) {
            try {
                map.flyTo([center.lat, center.lng], 14, { duration: 1.5 });
            } catch(e) {
                console.error("Map movement error", e);
            }
            setDoRecenter(false);
        }
    }, [doRecenter, center, map, setDoRecenter]);

    return null;
}

interface DriverSidebarCardProps {
    driver: Driver;
    orders: Order[];
    vales?: Vale[];
    onEdit: () => void;
    onCloseCycle?: (id: string, data: any) => void;
}

// Sub-componente Card do Motorista (Sidebar)
const DriverSidebarCard: React.FC<DriverSidebarCardProps> = ({ driver, orders, vales = [], onEdit, onCloseCycle }) => {
    
    const financial = useMemo(() => {
        const lastSettlement = driver.lastSettlementAt?.seconds || 0;
        
        // Filtra entregas deste ciclo
        const cycleOrders = orders.filter(o => 
            o.driverId === driver.id && 
            o.status === 'completed' && 
            (o.completedAt?.seconds || 0) > lastSettlement
        );

        // Filtra vales deste ciclo
        const cycleVales = vales.filter(v => 
            v.driverId === driver.id && 
            (v.createdAt?.seconds || 0) > lastSettlement
        );

        let earnings = 0;
        if (driver.paymentModel === 'percentage') {
            earnings = cycleOrders.reduce((acc, o) => acc + (o.value * ((driver.paymentRate || 0) / 100)), 0);
        } else if (driver.paymentModel === 'salary') {
            earnings = 0; // Salário fixo não contabiliza por entrega aqui, ou pode ser adaptado
        } else {
            // Fixo por entrega (Padrão)
            const rate = driver.paymentRate !== undefined ? driver.paymentRate : 5.00;
            earnings = cycleOrders.length * rate;
        }

        const totalVales = cycleVales.reduce((acc, v) => acc + (Number(v.amount) || 0), 0);
        const toPay = earnings - totalVales;

        return {
            deliveriesCount: cycleOrders.length,
            deliveriesTotal: earnings,
            valesTotal: totalVales,
            toPay
        };
    }, [driver, orders, vales]);

    const handleCloseCycle = () => {
        if (onCloseCycle && window.confirm(`Fechar ciclo de ${driver.name} com valor a pagar de ${formatCurrency(financial.toPay)}?`)) {
            onCloseCycle(driver.id, {
                driverId: driver.id,
                driverName: driver.name,
                startAt: driver.lastSettlementAt,
                endAt: new Date(),
                ...financial,
                finalAmount: financial.toPay
            });
        }
    };

    return (
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3 mb-3">
            {/* Header Card */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={driver.avatar} className="w-10 h-10 rounded-full object-cover bg-slate-800" alt={driver.name}/>
                        <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-[#0f172a] ${driver.status === 'delivering' ? 'bg-amber-600 text-white' : driver.status === 'available' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-slate-300'}`}>
                            {driver.status === 'delivering' ? 'DELIVERING' : driver.status === 'available' ? 'AVAILABLE' : 'OFFLINE'}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">{driver.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 rounded border border-slate-700">{driver.vehicle || 'Moto'}</span>
                            <span className="text-[10px] text-slate-500">{driver.plate}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onEdit} className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors">
                    <Edit size={14}/>
                </button>
            </div>

            {/* Resumo */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-white">Resumo Atual</span>
                    <span className="text-[9px] text-slate-500">Desde último acerto</span>
                </div>
                
                <div className="bg-[#020617] rounded-lg p-2 grid grid-cols-2 gap-2 mb-2 border border-slate-800/50">
                    <div>
                        <p className="text-[9px] text-slate-500 font-bold mb-0.5">Entregas</p>
                        <p className="text-xs text-slate-300 font-bold">
                            {financial.deliveriesCount} <span className="text-[9px] font-normal text-slate-500">({formatCurrency(financial.deliveriesTotal)})</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 font-bold mb-0.5">Vales</p>
                        <p className="text-xs text-red-400 font-bold">
                            - {formatCurrency(financial.valesTotal)}
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-[#020617] rounded-lg p-2 border border-slate-800/50 mb-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">A PAGAR</span>
                    <span className="text-sm font-bold text-white">{formatCurrency(financial.toPay)}</span>
                </div>

                <button 
                    onClick={handleCloseCycle}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg transition-colors shadow-lg active:scale-95"
                >
                    Fechar Ciclo / Pagar
                </button>
            </div>
        </div>
    );
};

export function MonitoringView({ 
    drivers, 
    orders, 
    vales = [],
    center, 
    onDeleteDriver,
    setDriverToEdit,
    setModal,
    onCloseCycle,
    isFleetOpen,
    setIsFleetOpen,
    appConfig
}: MonitoringProps) {
    const activeDrivers = drivers.filter(d => d.status !== 'offline');
    const [recenterTrigger, setRecenterTrigger] = React.useState(false);

    // Safe Center Logic
    const safeCenter = useMemo(() => {
        if (center && !isNaN(Number(center.lat)) && !isNaN(Number(center.lng))) {
            return center;
        }
        return { lat: -23.55052, lng: -46.633308 }; 
    }, [center]);

    // Calcular Bounds (Limites do Mapa) ~15km do centro
    // 1 grau lat ~ 111km. 0.15 graus ~ 16km
    const maxBounds = useMemo(() => {
        const delta = 0.15; 
        return new L.LatLngBounds(
            [safeCenter.lat - delta, safeCenter.lng - delta],
            [safeCenter.lat + delta, safeCenter.lng + delta]
        );
    }, [safeCenter]);

    // STATS CALCULATION
    const stats = useMemo(() => {
        const todayOrders = orders.filter(o => isToday(o.createdAt));
        const sales = todayOrders.filter(o => o.status === 'completed').reduce((acc, o) => acc + (o.value || 0), 0);
        const pending = orders.filter(o => o.status === 'pending').length;
        
        return {
            sales,
            count: todayOrders.length,
            online: activeDrivers.length,
            pending
        };
    }, [orders, activeDrivers]);

    return (
        <div className="flex-1 bg-slate-950 h-full relative flex flex-col overflow-hidden">
            
            {/* STATS ROW - IMPROVED DESIGN & LAYOUT */}
            <div className="p-3 md:p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 shrink-0 z-10 border-b border-slate-800">
                {/* Card 1: Vendas Hoje */}
                <div className="bg-slate-900 border border-slate-800/50 rounded-2xl flex items-center p-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={48} />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0 mr-3">
                        <DollarSign size={20} strokeWidth={2.5}/>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Vendas Hoje</p>
                        <p className="text-lg md:text-xl font-black text-white truncate">{formatCurrency(stats.sales)}</p>
                    </div>
                </div>

                {/* Card 2: Pedidos */}
                <div className="bg-slate-900 border border-slate-800/50 rounded-2xl flex items-center p-3 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShoppingBag size={48} />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0 mr-3">
                        <ShoppingBag size={20} strokeWidth={2.5}/>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pedidos</p>
                        <p className="text-lg md:text-xl font-black text-white truncate">{stats.count}</p>
                    </div>
                </div>

                {/* Card 3: Online */}
                <div className="bg-slate-900 border border-slate-800/50 rounded-2xl flex items-center p-3 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Bike size={48} />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0 mr-3">
                        <Bike size={20} strokeWidth={2.5}/>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Online</p>
                        <p className="text-lg md:text-xl font-black text-white truncate">{stats.online}</p>
                    </div>
                </div>

                {/* Card 4: Pendentes */}
                <div className="bg-slate-900 border border-slate-800/50 rounded-2xl flex items-center p-3 relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity size={48} />
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 mr-3 ${stats.pending > 0 ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/20 animate-pulse' : 'bg-gradient-to-br from-slate-700 to-slate-800'}`}>
                        <Clock size={20} strokeWidth={2.5}/>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pendentes</p>
                        <p className="text-lg md:text-xl font-black text-white truncate">{stats.pending}</p>
                    </div>
                </div>
            </div>

            {/* SPLIT VIEW: MAP + SIDEBAR */}
            <div className="flex-1 flex min-h-0 relative">
                {/* MAP AREA */}
                <div className="flex-1 relative z-0 bg-slate-900 h-full">
                    
                    {/* BOTÃO DE FROTA FLUTUANTE (VISÍVEL NO MAPA) */}
                    <div className="absolute top-4 right-4 z-[500]">
                        <button 
                            onClick={() => setIsFleetOpen && setIsFleetOpen(!isFleetOpen)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-xl font-bold text-xs transition-all border ${isFleetOpen ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-900/90 text-white border-slate-700 backdrop-blur-sm'}`}
                        >
                            <Bike size={18} />
                            <span>FROTA ({activeDrivers.length})</span>
                        </button>
                    </div>

                    <MapContainer 
                        key="main-map-static"
                        center={[safeCenter.lat, safeCenter.lng]} 
                        zoom={13} // Zoom inicial para focar
                        minZoom={11} // Impede zoom muito distante (mundo todo)
                        maxZoom={18}
                        maxBounds={maxBounds} // Limita a navegação
                        maxBoundsViscosity={1.0} // Efeito elástico ao bater na borda
                        style={{ height: '100%', width: '100%', background: '#020617' }}
                        zoomControl={false}
                        attributionControl={false} 
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        
                        <MapController center={safeCenter} doRecenter={recenterTrigger} setDoRecenter={setRecenterTrigger} />
                        
                        {/* Controles de Zoom no Canto Inferior Direito */}
                        <ZoomControl position="bottomright" />

                        {/* LOJA MARKER - USA ÍCONE PERSONALIZADO COM LOGO */}
                        <Marker 
                            position={[safeCenter.lat, safeCenter.lng]} 
                            icon={createCustomIcon(appConfig?.appLogoUrl, 'store')}
                        >
                            <Popup>
                                <div className="text-slate-900 font-bold text-center">
                                    <p className="mb-1">{appConfig?.appName || 'Loja'}</p>
                                    <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">CENTRAL</span>
                                </div>
                            </Popup>
                        </Marker>

                        {/* DRIVERS MARKERS - USA ÍCONE PERSONALIZADO COM AVATAR */}
                        {activeDrivers.map(driver => (
                            driver.lat && driver.lng && !isNaN(Number(driver.lat)) && !isNaN(Number(driver.lng)) ? (
                                <Marker 
                                    key={driver.id} 
                                    position={[driver.lat, driver.lng]} 
                                    icon={createCustomIcon(driver.avatar, 'driver', driver.status)} 
                                >
                                    <Popup>
                                        <div className="min-w-[150px]">
                                            <div className="flex items-center gap-2 mb-2 border-b pb-2">
                                                <img src={driver.avatar} className="w-10 h-10 rounded-full bg-slate-200 object-cover" alt="Avatar"/>
                                                <div>
                                                    <strong className="block text-sm">{driver.name}</strong>
                                                    <span className="text-[10px] uppercase text-slate-500 font-bold">{driver.vehicle || 'Moto'} • {driver.plate}</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                                                <div className="flex items-center gap-1 text-slate-600"><Battery size={10}/> {driver.battery ? `${driver.battery}%` : '-'}</div>
                                                <div className="flex items-center gap-1 text-slate-600"><Signal size={10}/> Online</div>
                                            </div>
                                            <div className="bg-slate-100 p-2 rounded text-xs">
                                                <span className="font-bold text-slate-500 block text-[9px] uppercase">Status Atual</span>
                                                {driver.status === 'delivering' ? (
                                                    <span className="text-orange-600 font-bold flex items-center gap-1"><Bike size={10}/> Em Entrega</span>
                                                ) : (
                                                    <span className="text-emerald-600 font-bold flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Disponível</span>
                                                )}
                                            </div>
                                            {driver.lastUpdate && <div className="text-[9px] text-slate-400 mt-1 text-right">Atualizado: {formatTime(driver.lastUpdate)}</div>}
                                        </div>
                                    </Popup>
                                </Marker>
                            ) : null
                        ))}
                    </MapContainer>
                    
                    {/* Location Button - Ajustado para não sobrepor o zoom */}
                    <div className="absolute bottom-24 right-3 z-[1000]">
                        <button onClick={() => setRecenterTrigger(true)} className="bg-[#0f172a] border border-slate-700 text-emerald-500 w-10 h-10 rounded-lg shadow-xl hover:bg-slate-800 transition-colors flex items-center justify-center" title="Centralizar na Loja">
                            <LocateFixed size={20}/>
                        </button>
                    </div>
                </div>

                {/* RIGHT SIDEBAR: FROTA (Controlled by Parent Prop) */}
                {isFleetOpen && (
                    <div className="fixed inset-0 z-[2000] md:static md:inset-auto md:w-96 bg-[#020617] border-l border-slate-800 flex flex-col shadow-2xl shrink-0">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#020617]">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Bike size={18} className="text-white"/> Frota ({drivers.length})
                            </h3>
                            <button onClick={() => setIsFleetOpen && setIsFleetOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20}/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#020617]">
                            <button 
                                onClick={() => { if(setDriverToEdit && setModal) { setDriverToEdit(null); setModal('driver'); } }}
                                className="w-full border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mb-4 text-xs uppercase"
                            >
                                <PlusCircle size={16}/> Cadastrar Motoboy
                            </button>

                            {drivers.map(driver => (
                                <DriverSidebarCard 
                                    key={driver.id} 
                                    driver={driver} 
                                    orders={orders}
                                    vales={vales}
                                    onEdit={() => { if(setDriverToEdit && setModal) { setDriverToEdit(driver); setModal('driver'); }}}
                                    onCloseCycle={onCloseCycle}
                                />
                            ))}

                            {drivers.length === 0 && (
                                <div className="text-center py-10 text-slate-600">
                                    <Bike size={32} className="mx-auto mb-2 opacity-30"/>
                                    <p className="text-sm">Nenhum motoboy na frota.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
