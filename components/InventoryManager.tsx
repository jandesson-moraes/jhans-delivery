import React, { useState } from 'react';
import { Supplier, InventoryItem } from '../types';
import { PlusCircle, Edit, Trash2, Box, Truck, Search, Phone, FileText } from 'lucide-react';
import { formatCurrency } from '../utils';
import { Footer } from './Shared';

interface InventoryProps {
    inventory: InventoryItem[];
    suppliers: Supplier[];
    onCreateSupplier: (data: any) => void;
    onUpdateSupplier: (id: string, data: any) => void;
    onDeleteSupplier: (id: string) => void;
    onCreateInventory: (data: any) => void;
    onUpdateInventory: (id: string, data: any) => void;
    onDeleteInventory: (id: string) => void;
}

export function InventoryManager(props: InventoryProps) {
    const [tab, setTab] = useState<'items' | 'suppliers'>('items');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null); // Pode ser supplier ou inventory

    // Filtragems
    const filteredInventory = props.inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredSuppliers = props.suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const openModal = (item?: any) => {
        setEditingItem(item || null);
        setShowModal(true);
    };

    const handleSave = (e: React.FormEvent, form: any) => {
        e.preventDefault();
        if (tab === 'suppliers') {
            if (editingItem) props.onUpdateSupplier(editingItem.id, form);
            else props.onCreateSupplier(form);
        } else {
            if (editingItem) props.onUpdateInventory(editingItem.id, form);
            else props.onCreateInventory(form);
        }
        setShowModal(false);
    };

    return (
        <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto w-full h-full pb-24 custom-scrollbar">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {tab === 'items' ? <Box className="text-amber-500"/> : <Truck className="text-blue-500"/>}
                        {tab === 'items' ? 'Controle de Estoque' : 'Gestão de Fornecedores'}
                    </h2>
                    <p className="text-slate-400 text-sm">Gerencie seus insumos e parceiros.</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex">
                        <button onClick={() => setTab('items')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${tab==='items' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>Insumos</button>
                        <button onClick={() => setTab('suppliers')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${tab==='suppliers' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>Fornecedores</button>
                    </div>
                    <button onClick={() => openModal()} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
                        <PlusCircle size={18}/> Novo {tab === 'items' ? 'Item' : 'Fornecedor'}
                    </button>
                </div>
            </div>

            {/* Barra de Busca */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                <input 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-amber-500" 
                    placeholder={`Buscar ${tab === 'items' ? 'insumo' : 'fornecedor'}...`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* LISTA DE ITENS */}
            {tab === 'items' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInventory.map(item => {
                        const supplierName = props.suppliers.find(s => s.id === item.supplierId)?.name || 'N/A';
                        const isLowStock = item.quantity <= (item.minQuantity || 0);

                        return (
                            <div key={item.id} className={`bg-slate-900 rounded-xl border p-4 transition-all hover:border-slate-600 ${isLowStock ? 'border-red-900/50 bg-red-900/10' : 'border-slate-800'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-white text-lg">{item.name}</h3>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${isLowStock ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                                        {item.quantity} {item.unit}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mb-4 flex items-center gap-1"><Truck size={12}/> {supplierName}</p>
                                <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                                    <span className="text-emerald-400 font-mono font-bold">{formatCurrency(item.cost)}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(item)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white"><Edit size={16}/></button>
                                        <button onClick={() => { if(confirm('Excluir item?')) props.onDeleteInventory(item.id); }} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {filteredInventory.length === 0 && <div className="col-span-full text-center text-slate-500 py-10">Nenhum item cadastrado.</div>}
                </div>
            )}

            {/* LISTA DE FORNECEDORES */}
            {tab === 'suppliers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSuppliers.map(sup => (
                        <div key={sup.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4 hover:border-blue-500/30 transition-colors">
                            <h3 className="font-bold text-white text-lg mb-1">{sup.name}</h3>
                            <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">{sup.category}</span>
                            
                            <div className="mt-4 space-y-2">
                                <p className="text-xs text-slate-400 flex items-center gap-2"><Phone size={14}/> {sup.contact}</p>
                                {sup.obs && <p className="text-xs text-slate-500 flex items-start gap-2"><FileText size={14} className="shrink-0"/> {sup.obs}</p>}
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
                                <button onClick={() => openModal(sup)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white"><Edit size={16}/></button>
                                <button onClick={() => { if(confirm('Excluir fornecedor?')) props.onDeleteSupplier(sup.id); }} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    {filteredSuppliers.length === 0 && <div className="col-span-full text-center text-slate-500 py-10">Nenhum fornecedor cadastrado.</div>}
                </div>
            )}

            <Footer/>

            {/* MODAL UNIVERSAL PARA ESTOQUE/FORNECEDOR */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-800 animate-in zoom-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-white">
                                {editingItem ? 'Editar' : 'Novo'} {tab === 'items' ? 'Insumo' : 'Fornecedor'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">X</button>
                        </div>
                        
                        <InventoryForm 
                            type={tab} 
                            initialData={editingItem} 
                            suppliers={props.suppliers} 
                            onSave={handleSave} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function InventoryForm({ type, initialData, suppliers, onSave }: any) {
    const [form, setForm] = useState(initialData || (type === 'items' 
        ? { name: '', unit: 'un', quantity: '', minQuantity: '', cost: '', supplierId: '' } 
        : { name: '', contact: '', category: '', obs: '' }
    ));

    return (
        <form onSubmit={(e) => onSave(e, form)} className="space-y-4">
            <div>
                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nome</label>
                <input required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            {type === 'suppliers' ? (
                <>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Contato / Telefone</label><input required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Categoria (Ex: Bebidas, Carnes)</label><input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Observações</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 h-24" value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} /></div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Unidade</label><select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}><option value="un">Unidade</option><option value="kg">Quilo (Kg)</option><option value="l">Litro (L)</option><option value="cx">Caixa</option></select></div>
                        <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Custo (R$)</label><input required type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.cost} onChange={e => setForm({...form, cost: parseFloat(e.target.value)})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Qtd Atual</label><input required type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.quantity} onChange={e => setForm({...form, quantity: parseFloat(e.target.value)})} /></div>
                        <div><label className="text-xs text-slate-500 font-bold uppercase block mb-1">Qtd Mínima</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.minQuantity} onChange={e => setForm({...form, minQuantity: parseFloat(e.target.value)})} /></div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Fornecedor</label>
                        <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}>
                            <option value="">Selecione...</option>
                            {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </>
            )}

            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg mt-2">Salvar Dados</button>
        </form>
    );
}