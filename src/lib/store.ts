import { Brand, Supplier, Product, Purchase, Sale, Customer } from '@/types/billing';

const KEYS = {
  brands: 'charBhuja_brands',
  suppliers: 'charBhuja_suppliers',
  products: 'charBhuja_products',
  purchases: 'charBhuja_purchases',
  sales: 'charBhuja_sales',
  customers: 'charBhuja_customers',
  invoiceCounter: 'charBhuja_invoiceCounter',
};

function get<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function set<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const store = {
  // Brands
  getBrands: (): Brand[] => get(KEYS.brands),
  saveBrand: (brand: Brand) => {
    const brands = get<Brand>(KEYS.brands);
    const idx = brands.findIndex(b => b.id === brand.id);
    if (idx >= 0) brands[idx] = brand; else brands.push(brand);
    set(KEYS.brands, brands);
  },
  deleteBrand: (id: string) => {
    set(KEYS.brands, get<Brand>(KEYS.brands).filter(b => b.id !== id));
  },

  // Suppliers
  getSuppliers: (): Supplier[] => get(KEYS.suppliers),
  saveSupplier: (supplier: Supplier) => {
    const items = get<Supplier>(KEYS.suppliers);
    const idx = items.findIndex(s => s.id === supplier.id);
    if (idx >= 0) items[idx] = supplier; else items.push(supplier);
    set(KEYS.suppliers, items);
  },
  deleteSupplier: (id: string) => {
    set(KEYS.suppliers, get<Supplier>(KEYS.suppliers).filter(s => s.id !== id));
  },

  // Products
  getProducts: (): Product[] => get(KEYS.products),
  saveProduct: (product: Product) => {
    const items = get<Product>(KEYS.products);
    const idx = items.findIndex(p => p.id === product.id);
    if (idx >= 0) items[idx] = product; else items.push(product);
    set(KEYS.products, items);
  },
  deleteProduct: (id: string) => {
    set(KEYS.products, get<Product>(KEYS.products).filter(p => p.id !== id));
  },

  // Purchases
  getPurchases: (): Purchase[] => get(KEYS.purchases),
  savePurchase: (purchase: Purchase) => {
    const items = get<Purchase>(KEYS.purchases);
    const idx = items.findIndex(p => p.id === purchase.id);
    if (idx >= 0) items[idx] = purchase; else items.push(purchase);
    set(KEYS.purchases, items);
  },

  // Customers
  getCustomers: (): Customer[] => get(KEYS.customers),
  saveCustomer: (customer: Customer) => {
    const items = get<Customer>(KEYS.customers);
    const idx = items.findIndex(c => c.id === customer.id);
    if (idx >= 0) items[idx] = customer; else items.push(customer);
    set(KEYS.customers, items);
  },

  // Sales
  getSales: (): Sale[] => get(KEYS.sales),
  saveSale: (sale: Sale) => {
    const items = get<Sale>(KEYS.sales);
    const idx = items.findIndex(s => s.id === sale.id);
    if (idx >= 0) items[idx] = sale; else items.push(sale);
    set(KEYS.sales, items);
  },

  // Invoice counter
  getNextInvoiceNumber: (): string => {
    const counter = parseInt(localStorage.getItem(KEYS.invoiceCounter) || '0') + 1;
    localStorage.setItem(KEYS.invoiceCounter, counter.toString());
    return `CB-${counter.toString().padStart(4, '0')}`;
  },
};
