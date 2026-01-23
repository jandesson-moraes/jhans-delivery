export type UserType = 'admin' | 'driver' | 'landing' | 'client';
export type DriverStatus = 'available' | 'delivering' | 'offline';

export interface AppConfig {
    appName: string;
    appLogoUrl: string;
    storePhone?: string; 
    pixKey?: string;      // Chave PIX (CPF, CNPJ, Email, Tel ou Aleatória)
    pixName?: string;     // Nome do Titular da Conta (Sem acentos é melhor)
    pixCity?: string;     // Cidade do Titular
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
  mapsLink?: string; 
  items: string; 
  status: 'pending' | 'preparing' | 'ready' | 'assigned' | 'delivering' | 'completed';
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

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
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