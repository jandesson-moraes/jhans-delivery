
export type UserType = 'admin' | 'driver' | 'landing' | 'client';
export type DriverStatus = 'available' | 'delivering' | 'offline';

export interface DeliveryZone {
    name: string;
    fee: number;
}

export interface DaySchedule {
    enabled: boolean;
    open: string;  // "18:00"
    close: string; // "23:00"
}

export interface GiveawayFieldConfig {
    id: string;
    label: string;
    enabled: boolean;
    required: boolean;
    type: 'text' | 'phone' | 'date' | 'email';
    placeholder?: string;
}

export interface AppConfig {
    appName: string;
    appLogoUrl: string;
    
    // Configuração de Promoção/Banner
    bannerUrl?: string;   
    promoTitle?: string;     // Título principal (Ex: COMBO CASAL)
    promoSubtitle?: string;  // Subtítulo (Ex: 2 Burgers + Refri)
    promoDate?: string;      // Data do evento/sorteio
    promoTime?: string;      // Horário
    promoLocation?: string;  // Local
    promoMode?: 'card' | 'banner'; // 'card' = Layout atual, 'banner' = Imagem cheia
    welcomeBannerUrl?: string; // Banner de boas-vindas (popup)
    
    // Configuração de Destaques (Carrossel) - NOVO
    featuredSettings?: {
        active: boolean;
        title: string; // Ex: "Os Mais Pedidos 🔥"
        productIds: string[]; // Lista de IDs dos produtos
    };
    
    // Configuração do Sorteio
    giveawaySettings?: {
        active: boolean;
        title: string;
        rules: string;
        fields: GiveawayFieldConfig[]; // Campos dinâmicos
    };
    
    storePhone?: string; 
    storeCountryCode?: string; // DDI do telefone
    storeMapsLink?: string; // Link da localização
    pixKey?: string;      // Chave PIX
    pixName?: string;     // Nome do Titular
    pixCity?: string;     // Cidade do Titular
    deliveryZones?: DeliveryZone[]; // Lista de Bairros e Taxas
    enableDeliveryFees?: boolean;   // Ativar/Desativar taxas
    schedule?: { [key: number]: DaySchedule }; // 0 (Domingo) a 6 (Sábado)
    
    // Configurações de Sistema
    minOrderValue?: number; // Pedido Mínimo
    estimatedTime?: string; // Ex: "40-60 min"
    printerWidth?: '58mm' | '80mm'; // Largura impressão
    packagingFee?: number; // Taxa de embalagem opcional
    facebookPixelId?: string; // ID do Pixel para rastreamento
    
    // Configuração de Localização
    location?: {
        lat: number;
        lng: number;
    };
}

export interface DailyStats {
    date: string; // YYYY-MM-DD
    visits: number;
}

export interface Driver {
  id: string; 
  name: string;
  password?: string;
  status: DriverStatus;
  lat: number;
  lng: number;
  battery: number;
  vehicle: string;
  plate?: string; 
  cpf?: string;   
  phone: string;
  currentOrderId?: string;
  avatar: string; 
  rating: number;
  totalDeliveries: number;
  lastUpdate?: any; 
  lastSettlementAt?: any;
  paymentModel?: 'fixed_per_delivery' | 'percentage' | 'salary'; 
  paymentRate?: number;
}

export interface Settlement {
    id: string;
    driverId: string;
    startAt: any;
    endAt: any;
    deliveriesCount: number;
    deliveriesTotal: number;
    valesTotal: number;
    finalAmount: number;
}

export interface OrderHistory {
    action: string;
    user: string;
    date: any;
    details?: string;
}

export interface Order {
  id: string; 
  customer: string;
  phone: string; 
  address: string;
  neighborhood?: string;
  mapsLink?: string; 
  items: string; 
  status: 'pending' | 'preparing' | 'ready' | 'assigned' | 'delivering' | 'completed' | 'cancelled';
  amount: string;
  value: number; 
  paymentMethod?: string;
  serviceType?: 'delivery' | 'pickup';
  paymentStatus?: 'paid' | 'pending';
  obs?: string;
  time?: string;
  origin?: 'manual' | 'menu';
  createdAt: any; 
  assignedAt?: any; 
  completedAt?: any; 
  driverId?: string;
  discount?: number;
  deliveryFee?: number;
  history?: OrderHistory[];
}

export interface Vale {
  id: string;
  driverId: string;
  amount: number;
  description: string;
  createdAt: any;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  createdAt: any;
}

export interface ProductIngredient {
    inventoryId: string;
    qty: number;
}

export interface Product {
  id: string;
  name: string;
  imageUrl?: string; // Nova propriedade para a foto
  category: string;
  price: number;
  description?: string;
  ingredients?: ProductIngredient[];
  costPrice?: number;
  operationalCost?: number;
}

export interface Client {
    id: string;
    name: string;
    phone: string;
    address: string;
    mapsLink?: string;
    lastOrderAt?: any;
    obs?: string;
    totalOrders?: number; 
    totalSpent?: number;
    count?: number; 
}

export interface Supplier {
    id: string;
    name: string;
    contact: string;
    category: string;
    obs?: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    minQuantity: number;
    cost: number;
    supplierId?: string;
}

export interface ShoppingItem {
    id: string;
    name: string;
    isChecked: boolean;
    createdAt: any;
}

export interface GiveawayEntry {
    id: string;
    name: string;
    phone: string;
    instagram?: string; // Mantido para compatibilidade, mas o uso real será no dynamicData
    dynamicData?: Record<string, string>; // Armazena as respostas dinâmicas (ex: { "email": "abc@...", "custom": "resposta" })
    createdAt: any;
    confirmed: boolean;
}

export interface GiveawayWinner {
    id: string;
    entryId: string;
    name: string;
    phone: string;
    prize: string;
    wonAt: any;
}
