import { supabase } from '@/integrations/supabase/client';
import { Brand, Supplier, Product, Purchase, Sale, Customer } from '@/types/billing';

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  return session.user.id;
}

export const store = {
  // Brands
  getBrands: async (): Promise<Brand[]> => {
    const { data, error } = await supabase.from('brands').select('*').order('name');
    if (error) throw error;
    return (data || []).map(b => ({ id: b.id, name: b.name }));
  },
  saveBrand: async (brand: Omit<Brand, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    if (brand.id) {
      // Check if exists
      const { data: existing } = await supabase.from('brands').select('id').eq('id', brand.id).single();
      if (existing) {
        const { error } = await supabase.from('brands').update({ name: brand.name }).eq('id', brand.id);
        if (error) throw error;
        return brand.id;
      }
    }
    const { data, error } = await supabase.from('brands').insert({ name: brand.name, user_id: userId }).select('id').single();
    if (error) throw error;
    return data.id;
  },
  deleteBrand: async (id: string) => {
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) throw error;
  },

  // Suppliers
  getSuppliers: async (): Promise<Supplier[]> => {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) throw error;
    return (data || []).map(s => ({ id: s.id, name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', gstNumber: s.gst_number || '' }));
  },
  saveSupplier: async (supplier: Omit<Supplier, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row = { name: supplier.name, phone: supplier.phone, email: supplier.email, address: supplier.address, gst_number: supplier.gstNumber, user_id: userId };
    if (supplier.id) {
      const { data: existing } = await supabase.from('suppliers').select('id').eq('id', supplier.id).single();
      if (existing) {
        const { error } = await supabase.from('suppliers').update(row).eq('id', supplier.id);
        if (error) throw error;
        return supplier.id;
      }
    }
    const { data, error } = await supabase.from('suppliers').insert(row).select('id').single();
    if (error) throw error;
    return data.id;
  },
  deleteSupplier: async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) throw error;
    return (data || []).map(p => ({ id: p.id, name: p.name, category: p.category || '', brandId: p.brand_id || '', brandName: p.brand_name || '', price: Number(p.price), discount: Number(p.discount) }));
  },
  saveProduct: async (product: Omit<Product, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row = { name: product.name, category: product.category, brand_id: product.brandId || null, brand_name: product.brandName, price: product.price, discount: product.discount, user_id: userId };
    if (product.id) {
      const { data: existing } = await supabase.from('products').select('id').eq('id', product.id).single();
      if (existing) {
        const { error } = await supabase.from('products').update(row).eq('id', product.id);
        if (error) throw error;
        return product.id;
      }
    }
    const { data, error } = await supabase.from('products').insert(row).select('id').single();
    if (error) throw error;
    return data.id;
  },
  deleteProduct: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  // Purchases
  getPurchases: async (): Promise<Purchase[]> => {
    const { data, error } = await supabase.from('purchases').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(p => ({ id: p.id, supplierId: p.supplier_id || '', supplierName: p.supplier_name || '', date: p.date, items: p.items as any, totalAmount: Number(p.total_amount) }));
  },
  savePurchase: async (purchase: Omit<Purchase, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row = { supplier_id: purchase.supplierId || null, supplier_name: purchase.supplierName, date: purchase.date, items: purchase.items as any, total_amount: purchase.totalAmount, user_id: userId };
    if (purchase.id) {
      const { data: existing } = await supabase.from('purchases').select('id').eq('id', purchase.id).single();
      if (existing) {
        const { error } = await supabase.from('purchases').update(row).eq('id', purchase.id);
        if (error) throw error;
        return purchase.id;
      }
    }
    const { data, error } = await supabase.from('purchases').insert(row).select('id').single();
    if (error) throw error;
    return data.id;
  },
  deletePurchase: async (id: string) => {
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) throw error;
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) throw error;
    return (data || []).map(c => ({ id: c.id, name: c.name, phone: c.phone || '', address: c.address || '' }));
  },
  saveCustomer: async (customer: Omit<Customer, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row = { name: customer.name, phone: customer.phone, address: customer.address, user_id: userId };
    if (customer.id) {
      const { data: existing } = await supabase.from('customers').select('id').eq('id', customer.id).single();
      if (existing) {
        const { error } = await supabase.from('customers').update(row).eq('id', customer.id);
        if (error) throw error;
        return customer.id;
      }
    }
    const { data, error } = await supabase.from('customers').insert(row).select('id').single();
    if (error) throw error;
    return data.id;
  },

  // Sales
  getSales: async (): Promise<Sale[]> => {
    const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(s => ({ id: s.id, invoiceNumber: s.invoice_number, customerId: s.customer_id || '', customerName: s.customer_name || '', customerPhone: s.customer_phone || '', date: s.date, items: s.items as any, totalAmount: Number(s.total_amount), totalDiscount: Number(s.total_discount), finalAmount: Number(s.final_amount) }));
  },
  saveSale: async (sale: Omit<Sale, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row = { invoice_number: sale.invoiceNumber, customer_id: sale.customerId || null, customer_name: sale.customerName, customer_phone: sale.customerPhone, date: sale.date, items: sale.items as any, total_amount: sale.totalAmount, total_discount: sale.totalDiscount, final_amount: sale.finalAmount, user_id: userId };
    if (sale.id) {
      const { data: existing } = await supabase.from('sales').select('id').eq('id', sale.id).single();
      if (existing) {
        const { error } = await supabase.from('sales').update(row).eq('id', sale.id);
        if (error) throw error;
        return sale.id;
      }
    }
    const { data, error } = await supabase.from('sales').insert(row).select('id').single();
    if (error) throw error;
    return data.id;
  },

  // Invoice counter
  getNextInvoiceNumber: async (): Promise<string> => {
    const userId = await getUserId();
    const { data: existing } = await supabase.from('invoice_counters').select('*').eq('user_id', userId).single();
    if (existing) {
      const newCounter = existing.counter + 1;
      await supabase.from('invoice_counters').update({ counter: newCounter }).eq('user_id', userId);
      return `CB-${newCounter.toString().padStart(4, '0')}`;
    } else {
      await supabase.from('invoice_counters').insert({ user_id: userId, counter: 1 });
      return 'CB-0001';
    }
  },
};
