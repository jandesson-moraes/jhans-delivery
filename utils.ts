import { AppConfig } from "./types";

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
        navigator.clipboard.writeText(text).catch(err => console.error("Erro ao copiar", err));
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
        } catch (err) {
            console.error("Erro ao copiar", err);
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

export const parseOrderItems = (itemsString: string) => {
    if (!itemsString) return [];
    const lines = itemsString.split('\n');
    const items: {qty: number, name: string}[] = [];
    lines.forEach(line => {
        const cleanLine = line.trim();
        if(!cleanLine || cleanLine.startsWith('---') || cleanLine.startsWith('Obs:')) return;
        const match = cleanLine.match(/^(\d+)[xX\s]+(.+)/);
        if(match) items.push({ qty: parseInt(match[1]), name: match[2].trim() });
        else items.push({ qty: 1, name: cleanLine });
    });
    return items;
};

// --- FUNÇÕES GERADORAS DE PIX (PADRÃO BR CODE) ---

const crc16ccitt = (payload: string) => {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        let c = payload.charCodeAt(i);
        crc ^= c << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
            crc = crc & 0xFFFF; // Garante 16 bits
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
};

const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
};

const normalizeText = (text: string) => {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-zA-Z0-9 ]/g, "")   
        .replace(/\s+/g, ' ')            
        .trim()
        .toUpperCase();
};

const sanitizeAscii = (str: string) => str.replace(/[^\x20-\x7E]/g, '');

export const generatePixPayload = (key: string, name: string, city: string, amount: number, txId: string = '***') => {
    let cleanKey = sanitizeAscii(key || '').trim();
    if (!cleanKey.includes('@')) {
        const isEVP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanKey);
        if (!isEVP) {
            const raw = cleanKey.replace(/[\(\)\-\.\s\/]/g, '');
            if (/^\d+$/.test(raw)) {
                 if (raw.length === 11 && raw[2] === '9') {
                     cleanKey = '+55' + raw;
                 } else {
                     cleanKey = raw; 
                 }
            } else if (cleanKey.startsWith('+')) {
                 cleanKey = '+' + raw.replace('+', ''); 
            } else {
                cleanKey = raw;
            }
        }
    }

    const cleanName = normalizeText(name || 'RECEBEDOR').substring(0, 25) || 'RECEBEDOR';
    const cleanCity = normalizeText(city || 'BRASIL').substring(0, 15) || 'BRASIL';
    
    let cleanTxId = sanitizeAscii(txId || '***');
    if (cleanTxId !== '***') {
        cleanTxId = cleanTxId.replace(/[^a-zA-Z0-9]/g, '');
    }
    if (!cleanTxId) cleanTxId = '***';
    cleanTxId = cleanTxId.substring(0, 25);

    const amountStr = amount.toFixed(2);

    let payload = 
        formatField('00', '01') +                              
        formatField('26',                                      
            formatField('00', 'BR.GOV.BCB.PIX') + 
            formatField('01', cleanKey)
        ) +
        formatField('52', '0000') +                           
        formatField('53', '986') +                            
        formatField('54', amountStr) +                        
        formatField('58', 'BR') +                             
        formatField('59', cleanName) +                        
        formatField('60', cleanCity) +                        
        formatField('62',                                     
            formatField('05', cleanTxId)                      
        ) +
        '6304';                                               

    payload += crc16ccitt(payload);
    return payload;
};

// AUXILIAR PARA FORMATAR ID - AGORA NUNCA CORTA
export const formatOrderId = (id: string) => {
    if (!id) return '???';
    const cleanId = id.replace(/^#/, '');
    return '#' + cleanId;
};

// EMOJIS SEGUROS
export const EMOJI = {
    GIFT: '\uD83C\uDF81',         // 🎁
    HEART: '\u2764\uFE0F',        // ❤️
    BURGER: '\uD83C\uDF54',       // 🍔
    WAVE: '\uD83D\uDC4B',         // 👋
    SMILE_HEARTS: '\uD83E\uDD70', // 🥰
    MONEY_BAG: '\uD83D\uDCB0',    // 💰
    WARNING: '\u26A0\uFE0F',      // ⚠️
    SMILE: '\uD83D\uDE00',        // 😀
    SCOOTER: '\uD83D\uDEF5',      // 🛵
    DASH: '\uD83D\uDCA8',         // 💨
    CHEF: '\uD83D\uDC68\u200D\uD83C\uDF73', // 👨‍🍳
    FIRE: '\uD83D\uDD25'          // 🔥
};

export const generateReceiptText = (order: any, appName: string, pixData?: any) => {
    const safeName = appName || 'Jhans Burgers';
    const date = formatDate(order.createdAt);
    const time = formatTime(order.createdAt);
    const displayId = formatOrderId(order.id);
    
    let text = `*${safeName.toUpperCase()}*\n*Pedido ${displayId}*\n📅 ${date} - ${time}\n\n*Cliente:* ${order.customer}\n*Tel:* ${order.phone}\n*End:* ${order.address}\n\n*--------------------------------*\n*ITENS:*\n${order.items}\n\n*--------------------------------*\n*TOTAL:* ${formatCurrency(order.value || 0)}\n\n`;
    
    if (order.deliveryFee === 0 || !order.deliveryFee) {
        text += `*Entrega:* GRÁTIS (Presente da Casa) ${EMOJI.GIFT}\n`;
    }

    text += `*Pagamento:* ${order.paymentMethod || 'Dinheiro'}\n${order.obs ? `\n*Obs:* ${order.obs}` : ''}`;
    
    text += `\n\n*Status:* Fique tranquilo! Seu pedido será preparado com muito carinho. ${EMOJI.HEART}${EMOJI.BURGER}`;

    if (pixData && order.paymentMethod && order.paymentMethod.toUpperCase().includes('PIX') && pixData.pixKey) {
         const payload = generatePixPayload(pixData.pixKey, pixData.pixName, pixData.pixCity, order.value, order.id);
         
         text += `\n\n*--------------------------------*\n`;
         text += `*PAGAMENTO PIX (COPIA E COLA):*\n`;
         text += `Copie o código abaixo:\n\n`;
         text += `\`\`\`${payload}\`\`\`\n\n`; 
         text += `--------------------------------\n\n`;
    }
    
    return text;
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

export const getOrderReceivedText = (order: any, appName: string) => {
    const safeName = appName || 'Jhans Burgers';
    const isPix = order.paymentMethod?.toLowerCase().includes('pix');
    const displayId = formatOrderId(order.id);
    
    return `Olá *${order.customer}*! ${EMOJI.WAVE}\nRecebemos seu pedido no *${safeName}* e ficamos muito felizes!\n\n*Fique tranquilo!* ${EMOJI.SMILE_HEARTS}\nSeu pedido ${displayId} já entrou no nosso sistema e será aceito e preparado com todo o cuidado.\n\n${EMOJI.MONEY_BAG} Total: *${formatCurrency(order.value)}\n${isPix ? `${EMOJI.WARNING} *Assim que puder, nos envie o comprovante PIX.*\n\nCaso já tenha feito o pagamento, favor desconsiderar a cobrança ${EMOJI.SMILE}` : ''}\n\n${EMOJI.SCOOTER} Avisaremos assim que sair para entrega!`;
};

export const sendOrderConfirmation = (order: any, appName: string) => {
    const safeName = appName || 'Jhans Burgers';
    const text = getOrderReceivedText(order, safeName);
    const phone = normalizePhone(order.phone);
    if(phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, 'whatsapp-session');
};

export const sendDeliveryNotification = (order: any, driverName: string, vehicle: string) => {
    const phone = normalizePhone(order.phone);
    if (!phone) return;
    const text = `Olá *${order.customer}*! ${EMOJI.SCOOTER}${EMOJI.DASH}\n*Boas notícias!*\nSeu pedido saiu para entrega e está a caminho.\n\nEntregador: *${driverName}*\nVeículo: *${vehicle}*\n\nObrigado pela preferência e bom apetite! ${EMOJI.BURGER}${EMOJI.HEART}`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, 'whatsapp-session');
};

export const getDispatchMessage = (order: any, driverName: string, appName: string) => {
    const safeName = appName || 'Jhans Burgers';
    const displayId = formatOrderId(order.id);
    return `Olá *${order.customer}*! ${EMOJI.WAVE}\n\nO seu pedido *${displayId}* ficou pronto aqui no *${safeName}* e já entregamos ao motoboy *${driverName}*! ${EMOJI.SCOOTER}${EMOJI.DASH}\n\nEle já saiu para entrega e logo chega no seu endereço.\n\nObrigado! ${EMOJI.HEART}`;
};

export const getProductionMessage = (order: any, appName: string) => {
    const safeName = appName || 'Jhans Burgers';
    const displayId = formatOrderId(order.id);
    return `Olá *${order.customer}*! ${EMOJI.WAVE}\n\nBoas notícias! O seu pedido *${displayId}* foi ACEITO e já começou a ser preparado aqui no *${safeName}*! ${EMOJI.CHEF}${EMOJI.FIRE}\n\nAvisaremos assim que ele sair para entrega.\n\nObrigado! ${EMOJI.HEART}`;
};

export const sendDispatchNotification = (order: any, driverName: string, appName: string) => {
    const safeName = appName || 'Jhans Burgers';
    const phone = normalizePhone(order.phone);
    if (!phone) return;
    const text = getDispatchMessage(order, driverName, safeName);
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, 'whatsapp-session');
};

// --- VALIDAÇÃO DE HORÁRIO APRIMORADA ---
export const checkShopStatus = (schedule?: { [key: number]: any }) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 6 = Sábado
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Se não houver schedule ou estiver vazio, assumimos aberto
    if (!schedule || Object.keys(schedule).length === 0) {
        return { 
            isOpen: true, 
            message: 'Horário não configurado', 
            nextOpen: null,
            nextOpenDay: null,
            nextOpenTime: null
        };
    }

    const todayConfig = schedule[currentDay];

    // Verificar se está aberto HOJE agora
    let isOpenToday = false;
    if (todayConfig && todayConfig.enabled && todayConfig.open && todayConfig.close) {
        const [openH, openM] = todayConfig.open.split(':').map(Number);
        const [closeH, closeM] = todayConfig.close.split(':').map(Number);
        
        const openTime = (openH || 0) * 60 + (openM || 0);
        const closeTime = (closeH || 0) * 60 + (closeM || 0);
        
        if (closeTime < openTime) {
            // Horário cruza meia-noite (ex: 18:00 as 02:00)
            isOpenToday = currentTime >= openTime || currentTime < closeTime;
        } else {
            // Horário normal (ex: 18:00 as 23:00)
            isOpenToday = currentTime >= openTime && currentTime < closeTime;
        }
    }

    if (isOpenToday) {
        return { isOpen: true, message: `Aberto até ${todayConfig.close}`, nextOpen: null, nextOpenDay: null, nextOpenTime: null };
    }

    // Se fechado, encontrar o PRÓXIMO horário de abertura
    let nextOpen = null;
    let nextDayName = '';
    
    // 1. Tentar ainda hoje (se fechou mas vai abrir mais tarde, ou se ainda não abriu)
    if (todayConfig && todayConfig.enabled && todayConfig.open) {
        const [openH, openM] = todayConfig.open.split(':').map(Number);
        const openTime = (openH || 0) * 60 + (openM || 0);
        if (currentTime < openTime) {
            nextOpen = todayConfig.open;
            nextDayName = 'Hoje';
        }
    }

    // 2. Se não encontrou hoje, procurar nos próximos 7 dias
    if (!nextOpen) {
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        for (let i = 1; i <= 7; i++) {
            const nextDayIndex = (currentDay + i) % 7;
            const nextConfig = schedule[nextDayIndex];
            if (nextConfig && nextConfig.enabled && nextConfig.open) {
                nextOpen = nextConfig.open;
                nextDayName = i === 1 ? 'Amanhã' : days[nextDayIndex];
                break;
            }
        }
    }

    const nextOpenString = nextOpen ? `${nextDayName} às ${nextOpen}` : 'Em breve';

    return { 
        isOpen: false, 
        message: 'Fechado',
        nextOpen: nextOpenString,
        nextOpenDay: nextDayName,
        nextOpenTime: nextOpen
    };
};