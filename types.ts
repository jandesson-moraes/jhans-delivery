
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

export interface AppConfig {
    appName: string;
    appLogoUrl: string;
    bannerUrl?: string;   // Novo: Imagem do Banner Promocional
    storePhone?: string; 
    storeCountryCode?: string; // Novo: DDI do telefone
    storeMapsLink?: string; // Novo: Link da localização
    pixKey?: string;      // Chave PIX
    pixName?: string;     // Nome do Titular
    pixCity?: string;     // Cidade do Titular
    deliveryZones?: DeliveryZone[]; // Lista de Bairros e Taxas
    enableDeliveryFees?: boolean;   // Ativar/Desativar taxas
    schedule?: { [key: number]: DaySchedule }; // 0 (Domingo) a 6 (Sábado)
    
    // NOVAS SUGESTÕES IMPLEMENTADAS
    minOrderValue?: number; // Pedido Mínimo
    estimatedTime?: string; // Ex: "40-60 min"
    printerWidth?: '58mm' | '80mm'; // Largura impressão
    packagingFee?: number; // Taxa de embalagem opcional
    
    // NOVA CONFIGURAÇÃO DE LOCALIZAÇÃO DA LOJA
    location?: {
        lat: number;
        lng: number;
    };
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
  // NOVOS CAMPOS DE PAGAMENTO
  paymentModel?: 'fixed_per_delivery' | 'percentage' | 'salary'; 
  paymentRate?: number; // Valor da taxa ou porcentagem (0 a 100 ou valor fixo)
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
  neighborhood?: string; // Novo campo
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

// --- FICHA TÉCNICA ---
export interface ProductIngredient {
    inventoryId: string; // ID do item no estoque
    qty: number;         // Quantidade usada na receita
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  
  // PRECIFICAÇÃO E CUSTOS
  ingredients?: ProductIngredient[]; // Ficha técnica
  costPrice?: number; // Custo calculado dos ingredientes (CMV)
  operationalCost?: number; // Custo fixo estimado por item (embalagem, gás, etc)
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

// --- NOVAS INTERFACES ---
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
    unit: string; // kg, un, l
    quantity: number;
    minQuantity: number;
    cost: number; // Preço de custo da unidade de compra
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
    createdAt: any;
    confirmed: boolean; // Se clicou no botão de zap
}
