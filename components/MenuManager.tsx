import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { formatCurrency } from '../utils';
import { PlusCircle, Edit, Utensils, ListPlus, Trash2 } from 'lucide-react';
import { ProductFormModal } from './Modals';
import { Footer } from './Shared';

interface MenuProps {
    products: Product[];
    onCreate: (data: any) => void;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
}

export function MenuManager({ products, onCreate, onUpdate, onDelete }: MenuProps) {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleSave = (id: string | null, data: any) => {
        if (id) {
            onUpdate(id, data);
        } else {
            onCreate(data);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="flex-1 bg-slate-950 p-6 md:p-10 overflow-auto w-full h-full pb-28 md:pb-8">
            <div className="w-full max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="font-bold text-2xl text-white">Cardápio Digital</h2>
                    <button 
                        onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                        <PlusCircle size={20}/> Novo Item
                    </button>
                </div>

                <div className="space-y-10 pb-10">
                    {sortedGroupedProducts.map((group: any, index: number) => (
                        <div key={group.category}>
                            <h3 className={`text-xl font-bold mb-6 border-b-2 pb-2 uppercase tracking-wider flex items-center gap-2 ${index % 2 === 0 ? 'text-amber-500 border-amber-500/30' : 'text-purple-400 border-purple-500/30'}`}>
                                {index % 2 === 0 ? <Utensils size={20}/> : <ListPlus size={20}/>} {group.category}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {group.items.map((p: Product) => (
                                    <div key={p.id} className="border border-slate-800 p-5 rounded-2xl shadow-sm bg-slate-900 flex flex-col justify-between hover:border-slate-700 transition-colors group">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-white text-lg leading-tight line-clamp-2">{p.name}</h4>
                                                <p className="font-extrabold text-lg text-emerald-400 whitespace-nowrap ml-2">{formatCurrency(p.price)}</p>
                                            </div>
                                            {p.description && <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3 min-h-[3em]">{p.description}</p>}
                                        </div>
                                        <div className="flex justify-end pt-3 border-t border-slate-800/50 gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-amber-600 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"><Edit size={14}/> Editar</button>
                                            <button onClick={() => { if(confirm('Excluir item?')) onDelete(p.id); }} className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"><Trash2 size={14}/> Excluir</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {sortedGroupedProducts.length === 0 && (
                        <div className="text-center py-20 text-slate-500">
                            <Utensils size={48} className="mx-auto mb-4 opacity-20"/>
                            <p className="text-lg">Nenhum item cadastrado.</p>
                            <p className="text-sm">Clique em "Novo Item" para começar.</p>
                        </div>
                    )}
                </div>
            </div>

            <ProductFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={editingProduct}
                onSave={handleSave}
                existingCategories={availableCategories}
            />
            
            <Footer />
        </div>
    );
}