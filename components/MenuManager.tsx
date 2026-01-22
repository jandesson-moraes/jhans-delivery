import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { capitalize, formatCurrency, toSentenceCase } from '../utils';
import { PlusCircle, Edit, Utensils, ListPlus, Trash2 } from 'lucide-react';

interface MenuProps {
    products: Product[];
    onCreate: (data: any) => void;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
}

export function MenuManager({ products, onCreate, onUpdate, onDelete }: MenuProps) {
    const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Hambúrgueres', description: '' });
    const [customCategory, setCustomCategory] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleCapitalize = (e: any, field: string) => {
        // Use Sentence Case para descrição, Capitalize para Nome
        const val = field === 'description' ? toSentenceCase(e.target.value) : capitalize(e.target.value);
        setNewItem(prev => ({...prev, [field]: val}));
    };

    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        const finalCategory = newItem.category === 'new_custom' ? capitalize(customCategory) : newItem.category;
        if (!finalCategory) { alert("Selecione ou digite uma categoria válida."); return; }
        const payload = { ...newItem, category: finalCategory, price: parseFloat(newItem.price.toString().replace(',', '.')) || 0 };
        if (editingId) { onUpdate(editingId, payload); setEditingId(null); } else { onCreate(payload); }
        setNewItem({ name: '', price: '', category: 'Hambúrgueres', description: '' }); 
        setCustomCategory('');
    };

    const availableCategories = useMemo(() => {
        const fixed = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        const existing = Array.from(new Set(products.map(p => p.category)));
        return Array.from(new Set([...fixed, ...existing]));
    }, [products]);

    const sortedGroupedProducts = useMemo(() => {
        const grouped = products.reduce((acc: any, product: Product) => {
            (acc[product.category] = acc[product.category] || []).push(product);
            return acc;
        }, {});
        const ORDER = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            const idxA = ORDER.indexOf(a);
            const idxB = ORDER.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });
        return sortedKeys.map(key => ({ category: key, items: grouped[key] }));
    }, [products]);

    return (
        <div className="flex-1 bg-slate-950 p-6 md:p-10 overflow-auto w-full h-full pb-28 md:pb-8">
            <h2 className="font-bold text-2xl text-white mb-6">Cardápio Digital</h2>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-xl">
                <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
                    {editingId ? <Edit size={20} className="text-amber-500"/> : <PlusCircle size={20} className="text-emerald-500"/>} 
                    {editingId ? 'Editar Produto' : 'Adicionar Novo Produto'}
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1"><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Nome</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-white" placeholder="Ex: X-Bacon" value={newItem.name} onChange={e => handleCapitalize(e, 'name')} required /></div>
                        <div className="w-full md:w-32"><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Preço</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-white" placeholder="0,00" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required /></div>
                        <div className="w-full md:w-48">
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Categoria</label>
                            <select className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-white" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                              {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                <option value="new_custom">+ Nova Categoria...</option>
                            </select>
                        </div>
                    </div>
                    {newItem.category === 'new_custom' && (<div className="animate-in fade-in slide-in-from-top-2"><label className="text-xs font-bold text-slate-500 mb-1 block uppercase text-amber-500">Nome da Nova Categoria</label><input autoFocus className="w-full p-3 bg-slate-950 border border-amber-500/50 rounded-xl outline-none focus:border-amber-500 text-white" placeholder="Digite a nova categoria..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} /></div>)}
                    <div><label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Descrição</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-amber-500 text-white text-sm" placeholder="Ex: Pão, carne 150g, queijo..." value={newItem.description} onChange={e => handleCapitalize(e, 'description')} /></div>
                    <div className="flex gap-3 justify-end">
                        {editingId && (<button type="button" onClick={() => { setEditingId(null); setNewItem({ name: '', price: '', category: 'Hambúrgueres', description: '' }); }} className="px-6 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 transition-colors">Cancelar</button>)}
                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-bold rounded-xl shadow-lg">{editingId ? 'Atualizar' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
            <div className="space-y-8 pb-10">
                {sortedGroupedProducts.map((group: any, index: number) => (
                    <div key={group.category}>
                        <h3 className={`text-xl font-bold mb-4 border-b-2 pb-2 uppercase tracking-wider flex items-center gap-2 ${index % 2 === 0 ? 'text-amber-500 border-amber-500/30' : 'text-purple-400 border-purple-500/30'}`}>
                            {index % 2 === 0 ? <Utensils size={20}/> : <ListPlus size={20}/>} {group.category}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {group.items.map((p: Product) => (
                                <div key={p.id} className="border border-slate-800 p-4 rounded-xl shadow-sm bg-slate-900 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-white text-lg leading-tight">{p.name}</h4><p className="font-extrabold text-lg text-emerald-400">{formatCurrency(p.price)}</p></div>
                                        {p.description && <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-3">{p.description}</p>}
                                    </div>
                                    <div className="flex justify-end mt-2 pt-2 border-t border-slate-800/50 gap-2">
                                        <button onClick={() => { setNewItem({name:p.name, price: p.price.toString().replace('.',','), category: p.category, description: p.description||''}); setEditingId(p.id); document.querySelector('.bg-slate-900')?.scrollIntoView({ behavior: 'smooth' }); }} className="p-2 text-slate-600 hover:text-amber-500 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"><Edit size={14}/> Editar</button>
                                        <button onClick={() => onDelete(p.id)} className="p-2 text-slate-600 hover:text-red-500 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"><Trash2 size={14}/> Excluir</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}