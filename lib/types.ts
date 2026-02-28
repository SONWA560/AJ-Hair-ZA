// Firebase specific types for wig store

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  price: {
    amount: string;
    currencyCode: string;
  };
  inventory: {
    inStock: boolean;
    quantity: number;
  };
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  title: string;
  description: string;
  description_for_ai: string;
  price: number;
  cost: number;
  currency: string;
  images: {
    url: string;
    alt: string;
    width: number;
    height: number;
  }[];
  specifications: {
    hair_type: "kinky_curly" | "straight" | "coily" | "wavy" | "body_wave" | "deep_wave" | "water_wave";
    lace_type: string;
    density: string;
    hair_grade: string;
    length: string;
    color: string;
    texture: string;
  };
  options: ProductOption[];
  variants: ProductVariant[];
  metadata: {
    occasion: string[];     // ["daily", "professional", "wedding", "party", "protective"]
    trending_score: number; // 1-10 popularity score
    views: number;
    search_tags: string[];
    suitable_face_shapes: string[]; // ["round", "oval", "square", "heart"]
    maintenance_level: "low" | "medium" | "high";
    featured: boolean;
    new_arrival: boolean;
  };
  inventory: {
    inStock: boolean;
    quantity: number;
    reserved: number;
    restockDate?: Date;
  };
  seo: {
    title: string;
    description: string;
    handle: string;         // URL-friendly slug
    keywords: string[];
  };
  ratings: {
    average: number;
    count: number;
  };
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface ProductFilters {
  hair_type?: string | string[];
  length?: string | string[];
  color?: string | string[];
  density?: string | string[];
  occasion?: string | string[];
  price_min?: number;
  price_max?: number;
  inStock?: boolean;
  hair_grade?: string;
  lace_type?: string | string[];
  search?: string;
  sortBy?: "featured" | "best_selling" | "price_low_high" | "price_high_low" | "newest";
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  variant: {
    hair_type: string;
    length: string;
    color: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  payment: {
    method: 'credit_card' | 'paypal' | 'eft' | 'cash_on_delivery';
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    transactionId?: string;
  };
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  variant: {
    hair_type: string;
    length: string;
    color: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  preferences: {
    hair_types: string[];
    favorite_colors: string[];
    preferred_lengths: string[];
  };
  role: 'customer' | 'admin' | 'staff';
  timestamps: {
    createdAt: Date;
    lastLogin: Date;
  };
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'staff';
  permissions: string[];
  lastLogin?: Date;
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface SearchLog {
  id: string;
  query: string;
  userId?: string;
  filters?: any;
  resultsCount: number;
  timestamp: Date;
  location?: string;
  userAgent?: string;
}

export interface Analytics {
  id: string;
  type: 'revenue' | 'products' | 'customers';
  date: Date;
  data: any;
  period: 'daily' | 'weekly' | 'monthly';
}

// AI Search related types
export interface AISearchRequest {
  query: string;
  userId?: string;
}

export interface AISearchResponse {
  products: Product[];
  filters: ProductFilters;
  aiInterpretation: string;
  suggestions?: string[];
}

// Review types
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  title: string;
  content: string;
  images?: string[];
  verified: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

// Newsletter subscription
export interface NewsletterSubscription {
  id: string;
  email: string;
  name?: string;
  preferences: {
    new_products: boolean;
    sales: boolean;
    wig_care_tips: boolean;
  };
  active: boolean;
  source: 'footer' | 'popup' | 'checkout';
  createdAt: Date;
}