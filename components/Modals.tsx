import React, { useState, useMemo } from 'react';
import { X, PlusCircle, Bike, Store, Minus, Plus, Trash2, Camera, UploadCloud, Users, Edit, MinusCircle, ClipboardPaste, AlertCircle, CheckCircle2, Calendar, FileText, Download, Share2, Save, MapPin } from 'lucide-react';
import { Product, Client, AppConfig, Driver, Order, Vale } from '../types';
import { capitalize, compressImage, formatCurrency, normalizePhone, parseCurrency, formatDate, copyToClipboard, generateReceiptText, formatTime, toSentenceCase } from '../utils';

// --- NEW ORDER MODAL ---
export function NewOrderModal({ onClose, onSave, products, clients }: any) {
   const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
   const [form, setForm] = useState({ customer: '', phone: '', address: '', items: '', amount: '', mapsLink: '', paymentMethod: 'PIX', serviceType: 'delivery', paymentStatus: 'paid', obs: '', origin: 'manual' });
   const [showPaste, setShowPaste] = useState(false);
   const [pasteText, setPasteText] = useState('');
   const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
   const [showSuggestions, setShowSuggestions] = useState(false);

   const handleInputFormat = (e: any, field: string) => {
       const raw = e.target.value;
       // Usa Title Case (Capitalize) para nomes, e Sentence Case para endereços/obs
       const val = (field === 'customer' || field === 'name') ? capitalize(raw) : toSentenceCase(raw);
       
       setForm(prev => ({...prev, [field]: val}));
       
       if (field === 'customer' && val.length > 2) {
           const matches = clients.filter((c: Client) => c.name.toLowerCase().includes(val.toLowerCase()));
           setClientSuggestions(matches);
           setShowSuggestions(true);
       } else setShowSuggestions(false);
   };

   const selectClient = (client: Client) => {
       setForm(prev => ({ ...prev, customer: client.name, phone: client.phone, address: client.address, mapsLink: client.mapsLink || '' }));
       setShowSuggestions(false);
   };

   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const val = e.target.value;
       setForm(prev => ({...prev, phone: val}));
       const inputNormal = normalizePhone(val);
       if (inputNormal.length >= 8) {
           const client = clients.find((c: Client) => normalizePhone(c.id || c.phone).includes(inputNormal));
           if (client) {
               setForm(prev => ({ 
                   ...prev, 
                   customer: client.name, 
                   address: client.address, 
                   mapsLink: client.mapsLink || '' 
               }));
           }
       }
   };
   
   const addToCart = (product: Product) => {
       setCart(prev => {
           const existing = prev.find(p => p.product.id === product.id);
           updateTotal(product.price); 
           return existing ? prev.map(p => p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p) : [...prev, { product, quantity: 1 }];
       });
   };

   const updateQuantity = (index: number, delta: number) => {
       setCart(prev => {
           const newCart = [...prev];
           const item = newCart[index];
           const newQty = item.quantity + delta;
           if (newQty <= 0) { newCart.splice(index, 1); updateTotal(-item.product.price); } 
           else { item.quantity = newQty; updateTotal(delta > 0 ? item.product.price : -item.product.price); }
           return newCart;
       });
   };

   const updateTotal = (priceDiff: number) => {
       const currentVal = parseCurrency(form.amount || '0');
       setForm(prev => ({ ...prev, amount: formatCurrency(Math.max(0, currentVal + priceDiff)) }));
   };

   const processPaste = () => {
       if (!pasteText) return;
       const lines = pasteText.split('\n');
       const newData: any = { ...form, items: pasteText }; 
       lines.forEach(line => {
           const lower = line.toLowerCase();
           if (lower.includes('nome:') || lower.includes('cliente:')) newData.customer = capitalize(line.split(':')[1].trim());
           if (lower.includes('endereço:') || lower.includes('rua')) newData.address = toSentenceCase(line.replace(/endereço:/i, '').trim());
           if (lower.includes('total')) { const match = line.match(/[\d,.]+/); if (match) newData.amount = formatCurrency(parseFloat(match[0].replace(',', '.'))); }
           if (lower.includes('maps.google.com') || lower.includes('goo.gl') || lower.includes('google.com/maps')) {
               newData.mapsLink = line.trim();
           }
       });
       setForm(newData); setShowPaste(false); setPasteText('');
   };

   const submit = (e: React.FormEvent) => { 
       e.preventDefault(); 
       const cartText = cart.map(i => `${i.quantity}x ${i.product.name}`).join('\n');
       const finalItems = [cartText, form.items].filter(Boolean).join('\n---\n');
       onSave({ ...form, items: finalItems, value: parseCurrency(form.amount) }); 
       onClose(); 
   };

   const sortedGroupedProducts = useMemo(() => {
        const grouped = products.reduce((acc: any, product: Product) => { (acc[product.category] = acc[product.category] || []).push(product); return acc; }, {});
        const ORDER = ['Hambúrgueres', 'Combos', 'Porções', 'Bebidas'];
        return Object.keys(grouped).sort((a, b) => {
            const idxA = ORDER.indexOf(a), idxB = ORDER.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        }).map(key => ({ category: key, items: grouped[key] }));
    }, [products]);

   return (
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
         <div className="bg-slate-900 md:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-7xl h-[95vh] md:h-[90vh] flex flex-col md:flex-row overflow-hidden border border-slate-800">
            <div className="flex-1 bg-slate-950 p-4 md:p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-800 custom-scrollbar order-1 md:order-1 h-1/2 md:h-full">
                 <div className="flex justify-between items-center mb-4 md:mb-6"><h3 className="font-bold text-lg md:text-xl text-white">Cardápio</h3><button onClick={onClose} className="md:hidden bg-slate-800 p-2 rounded-full text-slate-400"><X size={20}/></button></div>
                 <div className="space-y-6 md:space-y-8 pb-4">
                     {sortedGroupedProducts.map((group: any, index: number) => (
                         <div key={group.category}>
                             <h4 className={`font-bold mb-2 md:mb-3 border-b pb-1 md:pb-2 uppercase tracking-wider text-sm md:text-base ${index % 2 === 0 ? 'text-amber-500 border-amber-500/30' : 'text-purple-400 border-purple-500/30'}`}>{group.category}</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                                {group.items.map((p: Product) => (
                                    <button key={p.id} onClick={() => addToCart(p)} className={`bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-sm transition-all text-left group flex flex-col h-full active:scale-95 hover:bg-slate-800 hover:border-amber-500`}>
                                        <div className="flex justify-between items-start w-full">
                                            <span className="font-bold text-slate-300 text-xs md:text-sm line-clamp-2 mb-1 flex-1">{p.name}</span>
                                            <span className="text-[10px] md:text-xs font-bold bg-slate-950 px-2 py-1 rounded w-fit ml-2 text-emerald-400">{formatCurrency(p.price)}</span>
                                        </div>
                                    </button>
                                ))}
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
            <div className="w-full md:w-[450px] bg-slate-900 p-4 md:p-6 flex flex-col h-1/2 md:h-full relative z-10 overflow-y-auto custom-scrollbar order-2 md:order-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none">
                <div className="hidden md:flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2"><PlusCircle size={18} className="text-amber-500"/> Novo Pedido</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-500 hover:text-white"/></button>
                </div>
                <form onSubmit={submit} className="space-y-3 md:space-y-4 flex-1 flex flex-col relative">
                   <div className="space-y-2 md:space-y-3 shrink-0 relative">
                       <div className="flex justify-between items-end"><label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Cliente</label><button type="button" onClick={() => setShowPaste(!showPaste)} className="text-[10px] text-amber-500 font-bold flex items-center gap-1 hover:text-amber-400"><ClipboardPaste size={12}/> Colar do WhatsApp</button></div>
                       {showPaste && (<div className="bg-slate-950 p-2 rounded-xl border border-amber-500/30 animate-in slide-in-from-top-2 mb-2"><textarea autoFocus className="w-full h-20 bg-transparent text-xs text-slate-300 outline-none resize-none" placeholder="Cole o pedido..." value={pasteText} onChange={e => setPasteText(e.target.value)} /><button type="button" onClick={processPaste} className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg mt-1">Processar Texto</button></div>)}
                       <div className="grid grid-cols-3 gap-2 relative">
                           <input className="col-span-1 p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 text-xs md:text-sm" placeholder="Tel" value={form.phone} onChange={handlePhoneChange} />
                           <div className="col-span-2 relative"><input className="w-full p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 text-xs md:text-sm" placeholder="Nome" value={form.customer} onChange={e=>handleInputFormat(e, 'customer')} />
                               {showSuggestions && clientSuggestions.length > 0 && (<div className="absolute top-full left-0 w-full bg-slate-950 border border-slate-700 rounded-xl mt-1 z-50 shadow-2xl max-h-40 overflow-y-auto">{clientSuggestions.map((c: Client) => (<button type="button" key={c.id} onClick={() => selectClient(c)} className="w-full text-left p-3 hover:bg-slate-800 text-white text-xs border-b border-slate-800 last:border-0 flex justify-between"><span className="font-bold">{c.name}</span><span className="text-slate-500">{c.phone}</span></button>))}</div>)}
                           </div>
                       </div>
                       <input className="w-full p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 text-xs md:text-sm" placeholder="Endereço" value={form.address} onChange={e=>handleInputFormat(e, 'address')} />
                       <div className="relative">
                            <input className="w-full p-2 md:p-3 pl-9 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 text-xs md:text-sm" placeholder="Link Google Maps (Opcional)" value={form.mapsLink} onChange={e=>setForm({...form, mapsLink: e.target.value})} />
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                       </div>
                   </div>
                   <div className="pt-1 md:pt-2 shrink-0"><div className="flex gap-2"><button type="button" onClick={() => setForm({...form, serviceType: 'delivery'})} className={`flex-1 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all border ${form.serviceType === 'delivery' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}><Bike size={16}/> Entrega</button><button type="button" onClick={() => setForm({...form, serviceType: 'pickup'})} className={`flex-1 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all border ${form.serviceType === 'pickup' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}><Store size={16}/> Retira</button></div></div>
                   <div className="flex-1 flex flex-col border-t border-slate-800 pt-3 mt-2 overflow-hidden">
                       <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase block mb-1">Itens ({cart.length})</label>
                       <div className="flex-1 overflow-y-auto custom-scrollbar mb-2 min-h-[60px]">
                           {cart.map((item, index) => (<div key={index} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 mb-2"><div className="flex items-center gap-2 flex-1"><div className="flex items-center bg-slate-900 rounded-lg border border-slate-800"><button type="button" onClick={() => updateQuantity(index, -1)} className="p-1 hover:text-white text-slate-500"><Minus size={12}/></button><span className="text-xs font-bold w-5 text-center text-white">{item.quantity}</span><button type="button" onClick={() => updateQuantity(index, 1)} className="p-1 hover:text-white text-slate-500"><Plus size={12}/></button></div><span className="text-xs text-slate-300 font-medium truncate flex-1">{item.product.name}</span></div><div className="flex items-center gap-2"><span className="text-xs font-bold text-emerald-400">{formatCurrency(item.product.price * item.quantity)}</span></div></div>))}
                       </div>
                       <textarea className="w-full h-12 md:h-20 p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 text-xs md:text-sm font-mono leading-relaxed resize-none shrink-0" placeholder="Obs: Sem cebola..." value={form.items} onChange={e=>setForm({...form, items: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-2 pt-2 shrink-0">
                       <div><label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase block mb-1">Total</label><input className="w-full p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold text-base md:text-lg outline-none focus:border-amber-500" placeholder="R$ 0,00" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} /></div>
                       <div><label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase block mb-1">Pagamento</label><select className="w-full p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none h-[42px] md:h-[54px] text-xs md:text-sm" value={form.paymentMethod} onChange={e=>setForm({...form, paymentMethod: e.target.value})}><option value="PIX">PIX</option><option value="Dinheiro">Dinheiro</option><option value="Cartão">Cartão</option></select></div>
                   </div>
                   <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 md:py-4 rounded-xl shadow-lg mt-2 text-sm md:text-lg shrink-0">Confirmar</button>
                </form>
            </div>
         </div>
      </div>
   )
}

// --- EDIT ORDER MODAL ---
export function EditOrderModal({ order, onClose, onSave }: any) {
    const [form, setForm] = useState({
        items: order.items,
        obs: order.obs || '',
        amount: order.amount,
        discount: order.discount || 0,
        deliveryFee: order.deliveryFee || 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newVal = parseCurrency(form.amount);
        const total = newVal + Number(form.deliveryFee) - Number(form.discount);
        
        onSave(order.id, {
            ...form,
            value: total,
            history: [...(order.history || []), { 
                action: 'edit', 
                user: 'Admin', 
                date: new Date(),
                details: 'Pedido editado manualmente'
            }]
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 border border-slate-800">
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                        <Edit className="text-amber-500"/> Editar Pedido #{order.id.slice(-4)}
                    </h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Itens do Pedido</label>
                            <textarea className="w-full h-32 p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm outline-none focus:border-amber-500" value={form.items} onChange={e => setForm({...form, items: toSentenceCase(e.target.value)})} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Observações</label>
                            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-amber-500" value={form.obs} onChange={e => setForm({...form, obs: toSentenceCase(e.target.value)})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Valor dos Itens (R$)</label>
                            <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-amber-500" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Taxa Entrega (R$)</label>
                            <input type="number" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.deliveryFee} onChange={e => setForm({...form, deliveryFee: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Desconto (R$)</label>
                            <input type="number" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-red-400 font-bold outline-none focus:border-red-500" value={form.discount} onChange={e => setForm({...form, discount: Number(e.target.value)})} />
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-400">Total Final:</span>
                            <span className="text-xl font-black text-emerald-400">
                                {formatCurrency(parseCurrency(form.amount) + Number(form.deliveryFee) - Number(form.discount))}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-800 rounded-xl">Cancelar</button>
                        <button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
                            <Save size={18}/> Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// --- RECEIPT MODAL ---
export function ReceiptModal({ order, onClose, appConfig }: any) {
    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=400,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Comprovante #${order.id.slice(-4)}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; text-transform: uppercase; }
                        .header { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px; }
                        .divider { border-top: 1px dashed #000; margin: 10px 0; }
                        .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
                        .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">${appConfig.appName}<br/>Delivery System</div>
                    <div>PEDIDO #${order.id.slice(-4)}</div>
                    <div>${formatDate(order.createdAt)} - ${formatTime(order.createdAt)}</div>
                    <div class="divider"></div>
                    <div>CLIENTE: ${order.customer}</div>
                    <div>TEL: ${order.phone}</div>
                    <div>END: ${order.address}</div>
                    <div class="divider"></div>
                    <div>ITENS:</div>
                    <div style="white-space: pre-wrap;">${order.items}</div>
                    <div class="divider"></div>
                    <div class="item"><span>Subtotal:</span><span>${formatCurrency((order.value || 0) + (order.discount || 0) - (order.deliveryFee || 0))}</span></div>
                    <div class="item"><span>Entrega:</span><span>${formatCurrency(order.deliveryFee || 0)}</span></div>
                    <div class="item"><span>Desconto:</span><span>-${formatCurrency(order.discount || 0)}</span></div>
                    <div class="total">TOTAL: ${formatCurrency(order.value || 0)}</div>
                    <div class="divider"></div>
                    <div>PAGAMENTO: ${order.paymentMethod}</div>
                    ${order.obs ? `<div>OBS: ${order.obs}</div>` : ''}
                    <script>window.print();</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleCopy = () => {
        const text = generateReceiptText(order, appConfig.appName);
        copyToClipboard(text);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2"><FileText className="text-white"/> Comprovante</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                
                <div className="bg-white text-black p-4 rounded-lg font-mono text-xs mb-6 shadow-inner overflow-y-auto max-h-[400px]">
                    <pre className="whitespace-pre-wrap">{generateReceiptText(order, appConfig.appName)}</pre>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleCopy} className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        <Share2 size={18}/> Copiar (Zap)
                    </button>
                    <button onClick={handlePrint} className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        <Download size={18}/> Imprimir PDF
                    </button>
                </div>
            </div>
        </div>
    )
}

// --- NEW DRIVER MODAL ---
export function NewDriverModal({ onClose, onSave, initialData }: any) {
    const [form, setForm] = useState(initialData || { name: '', password: '', phone: '', vehicle: '', cpf: '', plate: '', avatar: '' });
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingImage(true);
            try { setForm({ ...form, avatar: await compressImage(file) }); } 
            catch { alert("Erro ao processar imagem."); } 
            finally { setIsProcessingImage(false); }
        }
    };

    const submit = (e: any) => { 
        e.preventDefault(); 
        const baseData = { ...form };
        if (!initialData) Object.assign(baseData, { status: 'offline', lat: 0, lng: 0, battery: 100, rating: 5, totalDeliveries: 0, avatar: form.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name}` });
        onSave(baseData); onClose(); 
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-2">{initialData ? <Edit className="text-amber-500"/> : <PlusCircle className="text-emerald-500"/>} {initialData ? 'Editar Motoboy' : 'Novo Motoboy'}</h3>
                <form onSubmit={submit} className="space-y-4">
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="relative w-24 h-24 rounded-full border-4 border-slate-700 bg-slate-800 overflow-hidden group">
                            {form.avatar ? <img src={form.avatar} className="w-full h-full object-cover" alt="avatar" /> : <div className="w-full h-full flex items-center justify-center text-slate-500"><Users size={32}/></div>}
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Camera className="text-white" size={24}/><input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Nome Completo</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.name} onChange={e=>setForm({...form, name: capitalize(e.target.value)})} required/></div>
                        <div><label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Senha</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required/></div>
                        <div><label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Telefone</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})}/></div>
                        <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-slate-500 ml-1">CPF</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.cpf} onChange={e=>setForm({...form, cpf: e.target.value})}/></div>
                        <div><label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Veículo</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.vehicle} onChange={e=>setForm({...form, vehicle: e.target.value})}/></div>
                        <div><label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Placa</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.plate} onChange={e=>setForm({...form, plate: e.target.value.toUpperCase()})}/></div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-800 mt-2"><button type="button" onClick={onClose} className="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors">Cancelar</button><button type="submit" disabled={isProcessingImage} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold shadow-lg disabled:opacity-50">{initialData ? 'Salvar' : 'Cadastrar'}</button></div>
                </form>
            </div>
        </div>
    )
}

export function SettingsModal({ config, onSave, onClose }: any) {
    const [form, setForm] = useState(config);
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingImage(true);
            try { setForm({ ...form, appLogoUrl: await compressImage(file) }); } catch { alert("Erro ao processar imagem."); } finally { setIsProcessingImage(false); }
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-800">
                <h3 className="font-bold text-xl mb-4 text-white flex items-center gap-2"><SettingsIcon size={20}/> Configurações</h3>
                <div className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Nome do Sistema</label><input className="w-full border-2 border-slate-700 bg-slate-950 rounded-xl p-3 outline-none font-bold text-white" value={form.appName} onChange={e => setForm({...form, appName: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Logotipo</label><div className="flex flex-col items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800"><div className="relative w-20 h-20 rounded-xl border-2 border-slate-700 bg-slate-900 overflow-hidden group">{form.appLogoUrl ? <img src={form.appLogoUrl} className="w-full h-full object-cover" alt="Logo" /> : <div className="w-full h-full flex items-center justify-center text-slate-600">Logo</div>}<label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Camera className="text-white" size={24}/><input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label></div></div></div>
                    <div className="flex gap-3 pt-4"><button onClick={onClose} className="flex-1 border border-slate-700 rounded-xl py-3 font-bold text-slate-500 hover:bg-slate-800">Cancelar</button><button onClick={() => onSave(form)} disabled={isProcessingImage} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 font-bold shadow-lg disabled:opacity-50">Salvar</button></div>
                </div>
            </div>
        </div>
    )
}

import { Settings as SettingsIcon } from 'lucide-react';

export function ImportModal({ onClose, onImportCSV }: any) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onload = (event) => { const text = event.target?.result as string; if(text) onImportCSV(text); }; reader.readAsText(file); }
    };
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in p-6 border border-slate-800">
                <h3 className="font-bold text-xl mb-4 text-white">Importar Dados (CSV)</h3>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-700 border-dashed rounded-2xl cursor-pointer bg-slate-950 hover:bg-slate-800 transition-colors"><div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadCloud size={40} className="text-slate-500 mb-3"/><p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Clique para carregar</span></p></div><input type="file" className="hidden" accept=".csv, .txt" onChange={handleFileChange} /></label>
                <div className="flex gap-3 pt-6"><button onClick={onClose} className="w-full border border-slate-700 rounded-xl py-3 font-bold text-slate-400 hover:bg-slate-800">Cancelar</button></div>
            </div>
        </div>
    );
}

export function NewExpenseModal({ onClose, onSave }: any) {
    const [form, setForm] = useState({ description: '', amount: '', category: 'insumos' });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ ...form, amount: parseFloat(form.amount.replace(',', '.')) || 0 }); onClose(); };
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in p-6 border border-slate-800">
                <h3 className="font-bold text-xl mb-4 text-white flex items-center gap-2"><MinusCircle className="text-red-500"/> Lançar Custo</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Descrição</label><input required autoFocus className="w-full border-2 border-slate-700 bg-slate-950 rounded-xl p-3 outline-none font-bold text-white" placeholder="Ex: Carne" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 ml-1 uppercase mb-1 block">Valor (R$)</label><input required className="w-full border-2 border-slate-700 bg-slate-950 rounded-xl p-3 outline-none font-bold text-red-500 text-lg" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
                    <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 border border-slate-700 rounded-xl py-3 font-bold text-slate-500 hover:bg-slate-800">Cancelar</button><button className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-bold shadow-lg">Confirmar</button></div>
                </form>
            </div>
        </div>
    );
}

export function NewValeModal({ driver, onClose, onSave }: any) {
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const handleSubmit = (e: any) => { e.preventDefault(); onSave({ driverId: driver.id, amount: parseFloat(amount), description: desc }); onClose(); };
    return (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-800">
                <h3 className="font-bold text-xl text-white mb-4">Novo Vale</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none" placeholder="Valor" value={amount} onChange={e=>setAmount(e.target.value)} required/>
                    <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none" placeholder="Motivo" value={desc} onChange={e=>setDesc(e.target.value)} required/>
                    <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 text-slate-500">Cancelar</button><button className="flex-1 bg-red-600 text-white rounded-xl py-3 font-bold">Confirmar</button></div>
                </form>
            </div>
        </div>
    )
}

export function EditClientModal({ client, orders, onClose, onSave, onUpdateOrder }: any) {
    const [form, setForm] = useState({ name: client.name, address: client.address, obs: client.obs || '', mapsLink: client.mapsLink || '' });
    const [tab, setTab] = useState<'info'|'history'>('info');
    const [visibleCount, setVisibleCount] = useState(30);

    const clientOrders = useMemo(() => {
        return orders.filter((o: Order) => normalizePhone(o.phone) === client.id).sort((a: Order, b: Order) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [orders, client]);

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in zoom-in p-0 border border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center"><div><h3 className="font-bold text-xl text-white">{client.name}</h3><p className="text-slate-400 text-sm">{client.phone}</p></div><button onClick={onClose}><X className="text-slate-500"/></button></div>
                <div className="flex border-b border-slate-800 px-6"><button onClick={() => setTab('info')} className={`py-3 mr-6 text-sm font-bold border-b-2 transition-colors ${tab==='info' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}>Dados</button><button onClick={() => setTab('history')} className={`py-3 text-sm font-bold border-b-2 transition-colors ${tab==='history' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}>Histórico ({clientOrders.length})</button></div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {tab === 'info' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Nome</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.name} onChange={e=>setForm({...form, name: capitalize(e.target.value)})}/></div>
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Endereço</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.address} onChange={e=>setForm({...form, address: toSentenceCase(e.target.value)})}/></div>
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Link Google Maps</label><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.mapsLink} onChange={e=>setForm({...form, mapsLink: e.target.value})}/></div>
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Observações</label><textarea className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" value={form.obs} onChange={e=>setForm({...form, obs: toSentenceCase(e.target.value)})}/></div>
                            <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 border border-slate-700 rounded-xl py-3 font-bold text-slate-400 hover:bg-slate-800">Cancelar</button><button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 font-bold shadow-lg">Salvar</button></div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            {clientOrders.slice(0, visibleCount).map((o: Order) => (
                                <div key={o.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                                    <div className="flex justify-between mb-2"><span className="text-slate-400 text-xs font-bold flex items-center gap-1"><Calendar size={12}/> {formatDate(o.createdAt)}</span><span className="text-emerald-400 font-extrabold">{o.amount}</span></div>
                                    <p className="text-white text-sm mb-3 font-medium">{o.items}</p>
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                                        <button onClick={() => onUpdateOrder(o.id, { paymentStatus: o.paymentStatus === 'paid' ? 'pending' : 'paid' })} className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border transition-all ${o.paymentStatus === 'pending' ? 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40' : 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/40'}`}>{o.paymentStatus === 'pending' ? <AlertCircle size={12}/> : <CheckCircle2 size={12}/>}{o.paymentStatus === 'pending' ? 'PENDENTE' : 'PAGO'}</button>
                                        <select className="bg-slate-900 text-slate-400 text-[10px] font-bold border border-slate-800 rounded px-2 py-1 outline-none focus:border-amber-500" value={o.paymentMethod || 'Dinheiro'} onChange={(e) => onUpdateOrder(o.id, { paymentMethod: e.target.value })}><option value="Dinheiro">Dinheiro</option><option value="PIX">PIX</option><option value="Cartão">Cartão</option></select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}