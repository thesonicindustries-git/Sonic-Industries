import { JSX } from "react";

export interface Feature {
  title: string;
  icon: JSX.Element;
  description: string;
  animation: "left" | "right" | "bottom";
}

export interface FeatureCardProps {
  feature: Feature;
  index: number;
}

export interface Hotspot {
  _id: string;
  x?: number;
  y?: number;
  description?: string;
  name?: string;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export interface ProductBackend {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  tagline: string;

  categoryId: CategoryBackend;
  sortOrder?: number;
  isPriority?: boolean;

  price: number;
  images: string[];
  rating: number;
  keywords?: string[];

  features?: {
    name?: string;
    weight?: string;
  }[];

  characteristics?: {
    desc1?: string;
    desc2?: string;
    items?: ProductCharacteristics[];
  };
  labels?: ProductLabels[];

  packaging?: {
    items?: number;
    length?: number;
    width?: number;
    height?: number;
  };

  yt_video_url?: string;
  unboxing_yt_video_url?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryBackend {
  _id: string;
  name: string;
  slug: string;
  title: string;
  description?: string;
  keywords?: string[];

  features?: {
    desc1?: string;
    desc2?: string;
    items?: CategoryFeatures[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface DealBackend {
  _id: string;
  title: string;
  description?: string;
  dealType: string;
  imageUrl?: string;
  mrp?: number;
  discountPercent?: number;
  discountedPrice: number;
  couponCode: string;
  productName?: string;
  rating?: number;
  expiresAt: Date;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestimonialBackend {
  _id: string;
  link: string;
}

export interface LeadBackend {
  _id: string;
  subject: string;
  content: string;
  senderEmail: string;
  senderName?: string;
  receiverEmail: string;
  receiverName?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  mailType: "order" | "inquiry";
}

export interface OrderModelBackend {
  _id: string;
  orderNumber: string;
  sessionToken: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  status: "pending" | "shipped" | "delivered" | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_method: "cod" | "razorpay_full" | "razorpay_partial";
  razorpay?: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    paidAt?: Date;
  };
  couponCode?: string;
  total_price: number;
  shipping_fee: number;
  discount: number;
  final_price: number;
  shipping_address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billing_address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  order_items: {
    productId: string;
    categoryId: string;
    quantity: number;
    price: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductCharacteristics {
  image?: string;
  name?: string;
  desc?: string;
  iconSearch?: string;
}

export interface CategoryFeatures {
  image?: string;
  name?: string;
  desc?: string;
  iconSearch?: string;
}

export interface FeaturesBlock {
  desc1?: string;
  desc2?: string;
  items?: CategoryFeatures[];
}

export interface ProductLabels {
  _id: string;
  x?: number;
  y?: number;
  name?: string;
  desc?: string;
}

export interface NewProductLabels {
  x?: number;
  y?: number;
  name?: string;
  desc?: string;
}

export type SearchAllCategoryProps = {
  categories: CategoryBackend[];
  startEdit: (category: CategoryBackend) => void;
  handleDelete: (id: string) => void;
};

export type SearchBySlugProps = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  startEdit: (category: CategoryBackend) => void;
  handleDelete: (id: string) => void;
};

export type FormDataType = {
  name: string;
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  features: {
    desc1?: string;
    desc2?: string;
    items?: CategoryFeatures[];
  };
};

export type EditingModalProps = {
  selectedCategory: CategoryBackend | null;
  setSelectedCategory: (category: CategoryBackend | null) => void;
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setSuccess: (message: string) => void;
  setIsEditing: (isEditing: boolean) => void;
  categories: CategoryBackend[];
  setCategories: (categories: CategoryBackend[]) => void;
};

export type CreateCategoryProps = {
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setSuccess: (message: string) => void;
  categories: CategoryBackend[];
  setCategories: (categories: CategoryBackend[]) => void;
  setActiveTab: (activeTab: "browse" | "search" | "create") => void;
  setIsEditing: (isEditing: boolean) => void;
  setSelectedCategory: (category: CategoryBackend | null) => void;
  setActiveFormTab: (tab: FormTab) => void;
  activeFormTab: FormTab;
};

export type ProductFeatures = {
  name?: string;
  weight?: string;
};

export type ProductPackaged = {
  length: number;
  width: number;
  height: number;
};

export type ProductImage = {
  file: File | null;
  preview: string;
  isNew: boolean;
};

export type ProductFormDataType = {
  name: string;
  slug: string;
  description: string;
  tagline: string;

  categoryId: string;

  price: number;
  images: ProductImage[];
  rating: number;
  keywords: string[];

  features: ProductFeatures[];

  packaging: ProductPackaged;
  characteristics: {
    desc1?: string;
    desc2?: string;
    items?: ProductCharacteristics[];
  };
  labels: NewProductLabels[];

  yt_video_url: string;
  unboxing_yt_video_url: string;
};

export type CategoryImages = {
  products: ProductBackend[];
  images: string[];
};

export type ProductSearchBySlugProps = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  startEdit: (category: ProductBackend) => void;
  handleDelete: (id: string) => void;
};

export type CreateProductProps = {
  formData: ProductFormDataType;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormDataType>>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setProducts: (products: ProductBackend[]) => void;
  setSuccess: (message: string) => void;
  setActiveTab: (activeTab: "browse" | "search" | "create") => void;
  setIsEditing: (isEditing: boolean) => void;
  setSelectedProduct: (product: ProductBackend | null) => void;
  activeFormTab: ProductFormTab;
  setActiveFormTab: (tab: ProductFormTab) => void;
  products: ProductBackend[];
  categories: CategoryBackend[];
};

export type SearchAllProductProps = {
  categories: CategoryBackend[];
  products: ProductBackend[];
  startEdit: (product: ProductBackend) => void;
  handleDelete: (id: string) => void;
  onProductsChange: (products: ProductBackend[]) => void;
};

export type ProductEditingModalProps = {
  selectedProduct: ProductBackend | null;
  setSelectedProduct: (product: ProductBackend | null) => void;
  formData: ProductFormDataType;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormDataType>>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setSuccess: (message: string) => void;
  setIsEditing: (isEditing: boolean) => void;
  products: ProductBackend[];
  setProducts: (products: ProductBackend[]) => void;
  categories: CategoryBackend[];
};

export type DealFormDataType = {
  title: string;
  description: string;
  imageUrl: string;
  dealType: string;
  mrp?: number;
  discountPercent?: number;
  discountedPrice: number;
  rating: number;
  expiresAt: string; // ISO date string
  couponCode: string;
  productName?: string;
};

export type DealEditingModalProps = {
  selectedDeal: DealBackend | null;
  setSelectedDeal: (product: DealBackend | null) => void;
  formData: DealFormDataType;
  setFormData: React.Dispatch<React.SetStateAction<DealFormDataType>>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setSuccess: (message: string) => void;
  setIsEditing: (isEditing: boolean) => void;
  deals: DealBackend[];
  setDeals: (products: DealBackend[]) => void;
  products: ProductBackend[];
};

export type SearchAllDealProps = {
  deals: DealBackend[];
  startEdit: (deal: DealBackend) => void;
  handleDelete: (id: string) => void;
};

export type CreateDealProps = {
  formData: DealFormDataType;
  setFormData: React.Dispatch<React.SetStateAction<DealFormDataType>>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setSuccess: (message: string) => void;
  deals: DealBackend[];
  setDeals: (deals: DealBackend[]) => void;
  setActiveTab: (activeTab: "browse" | "create") => void;
  setIsEditing: (isEditing: boolean) => void;
  setSelectedDeal: (deal: DealBackend | null) => void;
  setActiveFormTab: (tab: DealFormTab) => void;
  activeFormTab: DealFormTab;
  products: ProductBackend[];
};

export interface OrdersDashboardProps {
  order: OrderModelBackend;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string, payment_status: string) => void;
  onDelete: (id: string) => void;
}

export type DealFormTab = "basic" | "pricing" | "image-rating";
export type FormTab = "basic" | "features";
export type ProductFormTab =
  | "basic"
  | "features"
  | "characteristics"
  | "labels"
  | "video"
  | "packaging"
  | "pricing";

export interface RazorpayPaymentOrder {
  order: {
    amount: number;
    amount_due: number;
    amount_paid: number;
    attempts: number;
    created_at: number;
    currency: string;
    entity: string;
    id: string;
    notes: {
      productId: string;
    };
    offer_id: string | null;
    receipt: string;
    status: string;
  };
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentFailedResponse {
  error: {
    code: string;
    description: string;
    field: any;
    source: string;
    step: string;
    reason: string;
    metadata: {
      payment_id: string;
      order_id: string;
    };
  };
}
