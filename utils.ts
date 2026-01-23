
export const formatTime = (timestamp: any) => {
  if (!timestamp || !timestamp.seconds) return '-';
  return new Date(timestamp.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (timestamp: any) => {
  if (!timestamp || !timestamp.seconds) return '-';
  return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR');
};

export const isToday = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return false;
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

export const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export const parseCurrency = (val: string) => {
    if(!val) return 0;
    if(typeof val === 'number') return val;
    return parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
}

export const normalizePhone = (phone: string) => {
    if (!phone) return '';
    let p = phone.replace(/\D/g, ''); 
    if (p.startsWith('55') && p.length > 11) p = p.substring(2); 
    if (p.length === 11 && p[2] === '9') {
        p = p.substring(0, 2) + p.substring(3);
    }
    return p;
};

export const capitalize = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
};

export const toSentenceCase = (str: string) => {
    if (!str) return '';
    const lower = str.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => alert("Copiado com sucesso!"));
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert("Copiado com sucesso!");
        } catch (err) {
            alert("Erro ao copiar.");
        }
        document.body.removeChild(textArea);
    }
};

export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 200; 
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); 
            };
        };
        reader.onerror = (error) => reject(error);
    });
};

// Funções novas para Relatórios e Recibos

export const parseOrderItems = (itemsString: string) => {
    if (!itemsString) return [];
    // Tenta separar por quebra de linha
    const lines = itemsString.split('\n');
    const items: {qty: number, name: string}[] = [];
    
    lines.forEach(line => {
        const cleanLine = line.trim();
        if(!cleanLine || cleanLine.startsWith('---') || cleanLine.startsWith('Obs:')) return;
        
        // Tenta achar padrão "2x Burger" ou "2 Burger"
        const match = cleanLine.match(/^(\d+)[xX\s]+(.+)/);
        if(match) {
            items.push({ qty: parseInt(match[1]), name: match[2].trim() });
        } else {
            // Se não achar numero, assume 1
            items.push({ qty: 1, name: cleanLine });
        }
    });
    return items;
};

export const generateReceiptText = (order: any, appName: string) => {
    const date = formatDate(order.createdAt);
    const time = formatTime(order.createdAt);
    
    return `*${appName.toUpperCase()}*
*Pedido #${order.id.slice(-4)}*
📅 ${date} - ${time}

*Cliente:* ${order.customer}
*Tel:* ${order.phone}
*End:* ${order.address}

*--------------------------------*
*ITENS:*
${order.items}

*--------------------------------*
*Subtotal:* ${formatCurrency((order.value || 0) + (order.discount || 0) - (order.deliveryFee || 0))}
*Entrega:* ${formatCurrency(order.deliveryFee || 0)}
*Desconto:* -${formatCurrency(order.discount || 0)}
*TOTAL:* ${formatCurrency(order.value || 0)}

*Pagamento:* ${order.paymentMethod || 'Dinheiro'}
${order.obs ? `\n*Obs:* ${order.obs}` : ''}
`;
};

export const downloadCSV = (content: string, fileName: string) => {
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- FUNÇÕES GERADORAS DE PIX (BR CODE) ---

const crc16ccitt = (str: string) => {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
            else crc = crc << 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
};

export const generatePixPayload = (key: string, name: string, city: string, amount: number, txId: string = '***') => {
    // Normaliza os dados
    const cleanKey = key.trim();
    // Remove acentos e caracteres especiais para evitar erro no CRC
    const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25).trim();
    const cleanCity = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15).trim();
    const amountStr = amount.toFixed(2);

    let payload = 
        formatField('00', '01') +                             // Payload Format Indicator
        formatField('26',                                     // Merchant Account Information
            formatField('00', 'BR.GOV.BCB.PIX') + 
            formatField('01', cleanKey)
        ) +
        formatField('52', '0000') +                           // Merchant Category Code
        formatField('53', '986') +                            // Transaction Currency (BRL)
        formatField('54', amountStr) +                        // Transaction Amount
        formatField('58', 'BR') +                             // Country Code
        formatField('59', cleanName) +                        // Merchant Name
        formatField('60', cleanCity) +                        // Merchant City
        formatField('62',                                     // Additional Data Field
            formatField('05', txId)                           // Reference Label (TxID)
        ) +
        '6304';                                               // CRC16 ID + Length

    payload += crc16ccitt(payload);

    return payload;
};

// --- FUNÇÕES DE MENSAGENS WHATSAPP ---

// Esta é a mensagem que o ADMIN manda para o CLIENTE avisando que o pedido CHEGOU
export const sendOrderReceivedMessage = (order: any, appName: string) => {
    const phone = normalizePhone(order.phone);
    if (!phone) return alert("Telefone do cliente inválido.");

    const isPix = order.paymentMethod?.toLowerCase().includes('pix');

    const text = `Olá *${order.customer}*! 👋
Recebemos seu pedido no *${appName}*!

*Status: EM PREPARO* 👨‍🍳🔥
Seu pedido #${order.id.slice(-4)} já foi aceito e foi enviado para a cozinha.

*Resumo:*
${order.items}

💰 Total: *${formatCurrency(order.value)}*
${isPix ? '⚠️ *Aguardando Comprovante PIX*' : ''}

🛵 Fique tranquilo(a), avisaremos assim que o motoboy sair para entrega!`;

    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank');
};

export const sendOrderConfirmation = (order: any, appName: string) => {
    // Mantendo para compatibilidade, mas a de cima é a nova principal
    sendOrderReceivedMessage(order, appName);
};

export const sendDeliveryNotification = (order: any, driverName: string, vehicle: string) => {
    const phone = normalizePhone(order.phone);
    if (!phone) return alert("Telefone do cliente inválido.");

    const text = `Olá *${order.customer}*! 🛵💨
Boas notícias: *Seu pedido saiu para entrega!*

Entregador: *${driverName}*
Veículo: *${vehicle}*

📍 Por favor, fique atento à campainha/interfone.
Pagamento: *${order.paymentMethod}* - *${formatCurrency(order.value)}*

Bom apetite! 🍔😋`;

    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank');
};
