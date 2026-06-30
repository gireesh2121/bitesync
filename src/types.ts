export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  items: OrderItem[];
  total: number;
  status: 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  timestamp: string; // ISO 8601 String
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface SalesReport {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface PopularItem {
  name: string;
  quantity: number;
  revenue: number;
}

export interface Feedback {
  id: string;
  customerName: string;
  rating: number; // 1 to 5
  comment: string;
  tag?: string; // e.g. "Tasty Food", "Fast Delivery" etc
  menuItemName?: string; // Optional reviewed item name
  timestamp: string;
}
