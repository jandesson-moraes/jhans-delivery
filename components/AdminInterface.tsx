
import React, { useState } from 'react';
import { 
    LayoutDashboard, ShoppingBag, Utensils, Users, 
    Bike, BarChart3, Settings, LogOut, Menu, X, 
    ChefHat, ClipboardList, Box, Package, PlusCircle, MoreHorizontal, Grid, Gift
} from 'lucide-react';
import { MonitoringView } from './MonitoringView';
import { DailyOrdersView } from './DailyOrdersView';
import { KitchenDisplay } from './KitchenDisplay';
import { MenuManager } from './MenuManager';
import { ClientsView } from './ClientsView';
import { InventoryManager } from './InventoryManager';
import { AnalyticsView } from './AnalyticsView';
import { ItemReportView } from './ItemReportView';
import { NewOrderView } from './NewOrderView';
import { GiveawayLiveView } from './GiveawayLiveView'; // Import New Component
import { BrandLogo, SidebarBtn } from './Shared';
import { Driver } from '../types';

export function AdminInterface(props: any) {
    const [view, setView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [fleetSidebarOpen, setFleetSidebarOpen] = useState(false); // State for fleet sidebar

    const renderContent = () => {
        switch(view) {
            case 'dashboard':
                return <MonitoringView 
                            drivers={props.drivers} 
                            orders={props.orders} 
                            vales={props.vales}
                            center={props.appConfig.location} 
                            onNavigate={setView}
                            onDeleteDriver={props.onDeleteDriver}
                            setDriverToEdit={props.setModalData}
                            setModal={props.setModal}
                            onCloseCycle={props.onCloseCycle}
                            isFleetOpen={fleetSidebarOpen}
                            setIsFleetOpen={setFleetSidebarOpen}
                            appConfig={props.appConfig} // Passing config for logo
                        />;
            case 'new_order':
                return <NewOrderView 
                            products={props.products} 
                            appConfig={props.appConfig} 
                            onCreateOrder={props.onCreateOrder} 
                            clients={props.clients} // Passando clientes para auto-complete
                        />;
            case 'kitchen':
                return <KitchenDisplay 
                            orders={props.orders} 
                            products={props.products}
                            drivers={props.drivers}
                            onUpdateStatus={(id, st) => props.onUpdateOrder(id, st)}
                            onAssignOrder={props.onAssignOrder}
                            onDeleteOrder={props.onDeleteOrder}
                            appConfig={props.appConfig}
                            onEditOrder={(o) => { props.setModalData(o); props.setModal('editOrder'); }}
                        />;
            case 'orders':
                return <DailyOrdersView 
                            orders={props.orders} 
                            drivers={props.drivers} 
                            onDeleteOrder={props.onDeleteOrder} 
                            setModal={props.setModal} 
                            onUpdateOrder={props.onUpdateOrder}
                            appConfig={props.appConfig}
                        />;
            case 'menu':
                return <MenuManager 
                            products={props.products} 
                            inventory={props.inventory}
                            onCreate={props.onCreateProduct} 
                            onUpdate={props.onUpdateProduct} 
                            onDelete={props.onDeleteProduct} 
                        />;
            case 'clients':
                return <ClientsView 
                            clients={props.clients} 
                            orders={props.orders} 
                            giveawayEntries={props.giveawayEntries}
                            setModal={props.setModal} 
                            setClientToEdit={props.setClientToEdit}
                            appConfig={props.appConfig}
                            onCreateOrder={props.onCreateOrder}
                            onDeleteGiveawayEntry={props.onDeleteGiveawayEntry} // Passing delete function
                            onNavigateToLive={() => setView('giveaway_live')} // New prop
                        />;
            case 'giveaway_live':
                return <GiveawayLiveView 
                            entries={props.giveawayEntries}
                            pastWinners={props.giveawayWinners} // Pass persistent history
                            onSaveWinner={props.onRegisterWinner} // Pass save function
                            appConfig={props.appConfig}
                            onBack={() => setView('clients')}
                        />;
            case 'inventory':
                return <InventoryManager 
                            inventory={props.inventory}
                            suppliers={props.suppliers}
                            shoppingList={props.shoppingList}
                            onCreateSupplier={props.onCreateSupplier}
                            onUpdateSupplier={props.onUpdateSupplier}
                            onDeleteSupplier={props.onDeleteSupplier}
                            onCreateInventory={props.onCreateInventory}
                            onUpdateInventory={props.onUpdateInventory}
                            onDeleteInventory={props.onDeleteInventory}
                            onAddShoppingItem={props.onAddShoppingItem}
                            onToggleShoppingItem={props.onToggleShoppingItem}
                            onDeleteShoppingItem={props.onDeleteShoppingItem}
                            onClearShoppingList={props.onClearShoppingList}
                            appConfig={props.appConfig}
                        />;
            case 'analytics':
                return <AnalyticsView 
                            orders={props.orders} 
                            products={props.products} 
                            siteVisits={props.siteVisits} // Passing visits data
                        />;
            case 'report':
                return <ItemReportView orders={props.orders} />;
            default:
                return <MonitoringView drivers={props.drivers} orders={props.orders} appConfig={props.appConfig} />;
        }
    };

    // If viewing Live Giveaway, hide sidebar completely for immersion
    if (view === 'giveaway_live') {
        return renderContent();
    }

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
            {/* Sidebar Mobile Overlay (Acts as "More" Menu) */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/80 z-[60] md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
            )}

            {/* Sidebar - Hidden on Mobile unless "More" is clicked, Visible on Desktop */}
            <aside className={`fixed md:relative z-[70] w-64 md:w-[270px] h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <BrandLogo config={props.appConfig} />
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar flex flex-col">
                    
                    {/* PRINCIPAL */}
                    <p className="text-[10px] uppercase font-bold text-slate-500 px-4 mb-2 mt-1">Principal</p>
                    
                    {/* 1. Visão Geral (Antigo Monitoramento) */}
                    <SidebarBtn icon={<LayoutDashboard size={20}/>} label="Visão Geral" active={view === 'dashboard'} onClick={() => { setView('dashboard'); setSidebarOpen(false); }} />
                    
                    {/* 2. Pedidos */}
                    <SidebarBtn icon={<ClipboardList size={20}/>} label="Pedidos" active={view === 'orders'} onClick={() => { setView('orders'); setSidebarOpen(false); }} />
                    
                    {/* 3. Cardápio */}
                    <SidebarBtn icon={<Utensils size={20}/>} label="Cardápio" active={view === 'menu'} onClick={() => { setView('menu'); setSidebarOpen(false); }} />
                    
                    {/* 4. Cozinha */}
                    <SidebarBtn icon={<ChefHat size={20}/>} label="Cozinha (KDS)" active={view === 'kitchen'} onClick={() => { setView('kitchen'); setSidebarOpen(false); }} />

                    {/* 5. Novo Pedido */}
                    <div className="py-4 px-1">
                        <button 
                            onClick={() => { setView('new_order'); setSidebarOpen(false); }}
                            className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-xl transition-all shadow-lg font-bold text-sm uppercase tracking-wide ${view === 'new_order' ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}
                        >
                            <PlusCircle size={20}/> NOVO PEDIDO
                        </button>
                    </div>

                    {/* OPERACIONAL */}
                    <p className="text-[10px] uppercase font-bold text-slate-500 px-4 mb-2 mt-2">Operacional</p>

                    {/* 6. Clientes */}
                    <SidebarBtn icon={<Users size={20}/>} label="Clientes" active={view === 'clients'} onClick={() => { setView('clients'); setSidebarOpen(false); }} />
                    
                    {/* 7. Estoque & Compras */}
                    <SidebarBtn icon={<Box size={20}/>} label="Estoque & Compras" active={view === 'inventory'} onClick={() => { setView('inventory'); setSidebarOpen(false); }} />

                    {/* GESTÃO */}
                    <p className="text-[10px] uppercase font-bold text-slate-500 px-4 mb-2 mt-2">Gestão</p>

                    {/* 8. Analytics */}
                    <SidebarBtn icon={<BarChart3 size={20}/>} label="Analytics" active={view === 'analytics'} onClick={() => { setView('analytics'); setSidebarOpen(false); }} />
                    
                    {/* 9. Relatório de Itens */}
                    <SidebarBtn icon={<Package size={20}/>} label="Relatório de Itens" active={view === 'report'} onClick={() => { setView('report'); setSidebarOpen(false); }} />

                    {/* 10. Configurações */}
                    <SidebarBtn icon={<Settings size={20}/>} label="Configurações" active={false} onClick={() => { props.setModal('settings'); setSidebarOpen(false); }} />

                    {/* 11. Sair do Sistema */}
                    <div className="mt-auto pt-4 border-t border-slate-800">
                        <button onClick={props.onLogout} className="w-full flex items-center gap-3 p-3.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors">
                            <LogOut size={20}/> <span className="font-medium text-sm">Sair do Sistema</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
                {/* Mobile Header (Hidden on New Order View if wanted, but keeping for logo presence) */}
                <header className="md:hidden bg-[#0f172a] border-b border-slate-800 p-4 flex justify-between items-center shrink-0 z-20 h-[60px]">
                    <BrandLogo size="small" config={props.appConfig} />
                    
                    {view === 'dashboard' && (
                        <button 
                            onClick={() => setFleetSidebarOpen(!fleetSidebarOpen)}
                            className={`p-2 rounded-lg transition-colors ${fleetSidebarOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Bike size={20}/>
                        </button>
                    )}
                </header>

                <div className="flex-1 overflow-hidden relative">
                    {renderContent()}
                </div>

                {/* Mobile Bottom Navigation Bar - IDENTICAL TO SCREENSHOT */}
                <div className="md:hidden bg-[#0f172a] border-t border-slate-800 flex justify-between items-center px-4 pb-safe h-[70px] fixed bottom-0 w-full z-50">
                    <button onClick={() => setView('dashboard')} className={`flex flex-col items-center justify-center gap-1 ${view === 'dashboard' ? 'text-amber-500' : 'text-slate-500'}`}>
                        <Grid size={20} />
                        <span className="text-[10px] font-medium">Painel</span>
                    </button>
                    
                    <button onClick={() => setView('orders')} className={`flex flex-col items-center justify-center gap-1 ${view === 'orders' ? 'text-amber-500' : 'text-slate-500'}`}>
                        <ClipboardList size={20} />
                        <span className="text-[10px] font-medium">Pedidos</span>
                    </button>

                    {/* Center Action Button - New Order */}
                    <div className="relative -top-5">
                        <button 
                            onClick={() => setView('new_order')}
                            className="w-14 h-14 rounded-full bg-[#f97316] text-white flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-95 transition-transform"
                        >
                            <PlusCircle size={28} strokeWidth={2.5} />
                        </button>
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-400 w-full text-center">Novo</span>
                    </div>

                    <button onClick={() => setView('kitchen')} className={`flex flex-col items-center justify-center gap-1 ${view === 'kitchen' ? 'text-amber-500' : 'text-slate-500'}`}>
                        <ChefHat size={20} />
                        <span className="text-[10px] font-medium">Cozinha</span>
                    </button>

                    <button onClick={() => setSidebarOpen(true)} className={`flex flex-col items-center justify-center gap-1 ${sidebarOpen ? 'text-white' : 'text-slate-500'}`}>
                        <MoreHorizontal size={20} />
                        <span className="text-[10px] font-medium">Mais</span>
                    </button>
                </div>
                
                {/* Spacer for bottom nav on mobile */}
                <div className="h-[70px] md:hidden"></div>
            </main>
        </div>
    );
}
