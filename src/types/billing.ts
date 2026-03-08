export interface Brand {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brandId: string;
  brandName: string;
  price: number;
  discount: number;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  brandName: string;
  quantity: number;
  price: number;
  discount: number;
  discountAmount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  totalDiscount: number;
  finalAmount: number;
  paymentStatus: 'paid' | 'unpaid';
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  totalDiscount: number;
  finalAmount: number;
  notes: string;
  validUntil: string;
}
