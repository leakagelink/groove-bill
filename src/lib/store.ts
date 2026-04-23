import { supabase } from '@/integrations/supabase/client';
import { Brand, Supplier, Product, Purchase, Sale, Customer, Quotation, ProductGroup, OtherAccount, OtherAccountType, CreditNote, DebitNote } from '@/types/billing';

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
    return (data || []).map((s: any) => ({
      id: s.id, name: s.name, phone: s.phone || '', email: s.email || '',
      address: s.address || '', gstNumber: s.gst_number || '',
      city: s.city || '', openingBalance: Number(s.opening_balance || 0),
    }));
  },
  saveSupplier: async (supplier: Omit<Supplier, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row: any = {
      name: supplier.name, phone: supplier.phone, email: supplier.email,
      address: supplier.address, gst_number: supplier.gstNumber,
      city: supplier.city || '', opening_balance: supplier.openingBalance ?? 0,
      user_id: userId,
    };
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

  // Other Accounts
  getOtherAccounts: async (): Promise<OtherAccount[]> => {
    const { data, error } = await (supabase.from('other_accounts' as any) as any).select('*').order('name');
    if (error) throw error;
    return (data || []).map((a: any) => ({
      id: a.id, name: a.name, groupName: a.group_name || '',
      accountType: (a.account_type || 'asset') as OtherAccountType,
      openingBalance: Number(a.opening_balance || 0),
    }));
  },
  saveOtherAccount: async (acc: Omit<OtherAccount, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row: any = {
      name: acc.name, group_name: acc.groupName, account_type: acc.accountType,
      opening_balance: acc.openingBalance ?? 0, user_id: userId,
    };
    if (acc.id) {
      const { data: existing } = await (supabase.from('other_accounts' as any) as any).select('id').eq('id', acc.id).single();
      if (existing) {
        const { error } = await (supabase.from('other_accounts' as any) as any).update(row).eq('id', acc.id);
        if (error) throw error;
        return acc.id;
      }
    }
    const { data, error } = await (supabase.from('other_accounts' as any) as any).insert(row).select('id').single();
    if (error) throw error;
    return data.id;
  },
  deleteOtherAccount: async (id: string) => {
    const { error } = await (supabase.from('other_accounts' as any) as any).delete().eq('id', id);
    if (error) throw error;
  },

  // Product Groups
  getProductGroups: async (): Promise<ProductGroup[]> => {
    const { data, error } = await (supabase.from('product_groups' as any) as any).select('*').order('name');
    if (error) throw error;
    return (data || []).map((g: any) => ({ id: g.id, name: g.name, description: g.description || '' }));
  },
  saveProductGroup: async (group: Omit<ProductGroup, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row = { name: group.name, description: group.description, user_id: userId };
    if (group.id) {
      const { data: existing } = await (supabase.from('product_groups' as any) as any).select('id').eq('id', group.id).single();
      if (existing) {
        const { error } = await (supabase.from('product_groups' as any) as any).update(row).eq('id', group.id);
        if (error) throw error;
        return group.id;
      }
    }
    const { data, error } = await (supabase.from('product_groups' as any) as any).insert(row).select('id').single();
    if (error) throw error;
    return data.id;
  },
  deleteProductGroup: async (id: string) => {
    const { error } = await (supabase.from('product_groups' as any) as any).delete().eq('id', id);
    if (error) throw error;
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) throw error;
    return (data || []).map((p: any) => ({
      id: p.id, name: p.name, category: p.category || '',
      brandId: p.brand_id || '', brandName: p.brand_name || '',
      price: Number(p.price), discount: Number(p.discount),
      groupId: p.group_id || '', groupName: p.group_name || '',
      sellingPrice: Number(p.selling_price || 0),
      purchasePrice: Number(p.purchase_price || 0),
      hsnSac: p.hsn_sac || '', taxPercent: Number(p.tax_percent || 0),
      openingStock: Number(p.opening_stock || 0),
      productType: (p.product_type || 'goods') as 'goods' | 'service',
      unit: p.unit || 'pcs',
    }));
  },
  saveProduct: async (product: Omit<Product, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row: any = {
      name: product.name, category: product.category,
      brand_id: product.brandId || null, brand_name: product.brandName,
      price: product.price, discount: product.discount, user_id: userId,
      group_id: product.groupId || null, group_name: product.groupName || '',
      selling_price: product.sellingPrice ?? product.price ?? 0,
      purchase_price: product.purchasePrice ?? 0,
      hsn_sac: product.hsnSac || '',
      tax_percent: product.taxPercent ?? 0,
      opening_stock: product.openingStock ?? 0,
      product_type: product.productType || 'goods',
      unit: product.unit || 'pcs',
    };
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
    return (data || []).map(p => ({ id: p.id, supplierId: p.supplier_id || '', supplierName: p.supplier_name || '', date: p.date, items: p.items as any, totalAmount: Number(p.total_amount), paymentMethod: (p as any).payment_method || 'cash' }));
  },
  savePurchase: async (purchase: Omit<Purchase, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row = { supplier_id: purchase.supplierId || null, supplier_name: purchase.supplierName, date: purchase.date, items: purchase.items as any, total_amount: purchase.totalAmount, payment_method: purchase.paymentMethod || 'cash', user_id: userId };
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
    return (data || []).map((c: any) => ({
      id: c.id, name: c.name, phone: c.phone || '', address: c.address || '',
      gstin: c.gstin || '', email: c.email || '', city: c.city || '',
      openingBalance: Number(c.opening_balance || 0),
    }));
  },
  saveCustomer: async (customer: Omit<Customer, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row: any = {
      name: customer.name, phone: customer.phone, address: customer.address,
      gstin: customer.gstin || '', email: customer.email || '', city: customer.city || '',
      opening_balance: customer.openingBalance ?? 0,
      user_id: userId,
    };
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
  deleteCustomer: async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },

  // Sales
  getSales: async (): Promise<Sale[]> => {
    const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(s => ({ id: s.id, invoiceNumber: s.invoice_number, customerId: s.customer_id || '', customerName: s.customer_name || '', customerPhone: s.customer_phone || '', date: s.date, items: s.items as any, totalAmount: Number(s.total_amount), totalDiscount: Number(s.total_discount), finalAmount: Number(s.final_amount), paymentStatus: (s as any).payment_status || 'unpaid', paymentMethod: (s as any).payment_method || 'cash' }));
  },
  saveSale: async (sale: Omit<Sale, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row = { invoice_number: sale.invoiceNumber, customer_id: sale.customerId || null, customer_name: sale.customerName, customer_phone: sale.customerPhone, date: sale.date, items: sale.items as any, total_amount: sale.totalAmount, total_discount: sale.totalDiscount, final_amount: sale.finalAmount, payment_status: sale.paymentStatus || 'unpaid', payment_method: sale.paymentMethod || 'cash', user_id: userId };
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
  updateSalePaymentStatus: async (saleId: string, status: 'paid' | 'unpaid') => {
    const { error } = await supabase.from('sales').update({ payment_status: status } as any).eq('id', saleId);
    if (error) throw error;
  },

  // Quotations
  getQuotations: async (): Promise<Quotation[]> => {
    const { data, error } = await supabase.from('quotations' as any).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((q: any) => ({
      id: q.id, quotationNumber: q.quotation_number, customerName: q.customer_name || '',
      customerPhone: q.customer_phone || '', customerAddress: q.customer_address || '',
      date: q.date, items: q.items as any, totalAmount: Number(q.total_amount),
      totalDiscount: Number(q.total_discount), finalAmount: Number(q.final_amount),
      notes: q.notes || '', validUntil: q.valid_until || '',
    }));
  },
  saveQuotation: async (quotation: Omit<Quotation, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row = {
      quotation_number: quotation.quotationNumber, customer_name: quotation.customerName,
      customer_phone: quotation.customerPhone, customer_address: quotation.customerAddress,
      date: quotation.date, items: quotation.items as any, total_amount: quotation.totalAmount,
      total_discount: quotation.totalDiscount, final_amount: quotation.finalAmount,
      notes: quotation.notes, valid_until: quotation.validUntil, user_id: userId,
    };
    if (quotation.id) {
      const { data: existing } = await (supabase.from('quotations' as any) as any).select('id').eq('id', quotation.id).single();
      if (existing) {
        const { error } = await (supabase.from('quotations' as any) as any).update(row).eq('id', quotation.id);
        if (error) throw error;
        return quotation.id;
      }
    }
    const { data, error } = await (supabase.from('quotations' as any) as any).insert(row).select('id').single();
    if (error) throw error;
    return data.id;
  },
  deleteQuotation: async (id: string) => {
    const { error } = await (supabase.from('quotations' as any) as any).delete().eq('id', id);
    if (error) throw error;
  },
  getNextQuotationNumber: async (): Promise<string> => {
    const userId = await getUserId();
    const { data: existing } = await (supabase.from('quotation_counters' as any) as any).select('*').eq('user_id', userId).single();
    if (existing) {
      const newCounter = existing.counter + 1;
      await (supabase.from('quotation_counters' as any) as any).update({ counter: newCounter }).eq('user_id', userId);
      return `QT-${newCounter.toString().padStart(4, '0')}`;
    } else {
      await (supabase.from('quotation_counters' as any) as any).insert({ user_id: userId, counter: 1 });
      return 'QT-0001';
    }
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

  // Credit Notes
  getCreditNotes: async (): Promise<CreditNote[]> => {
    const { data, error } = await (supabase.from('credit_notes' as any) as any).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((n: any) => ({
      id: n.id,
      noteNumber: n.note_number,
      noteDate: n.note_date,
      noteType: n.note_type,
      refBillNo: n.ref_bill_no || '',
      accountName: n.account_name || '',
      city: n.city || '',
      state: n.state || '',
      netAmount: Number(n.net_amount || 0),
      notes: n.notes || '',
    }));
  },
  saveCreditNote: async (note: Omit<CreditNote, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row: any = {
      note_number: note.noteNumber,
      note_date: note.noteDate,
      note_type: note.noteType,
      ref_bill_no: note.refBillNo || '',
      account_name: note.accountName || '',
      city: note.city || '',
      state: note.state || '',
      net_amount: note.netAmount || 0,
      notes: note.notes || '',
      user_id: userId,
    };
    if (note.id) {
      const { data: existing } = await (supabase.from('credit_notes' as any) as any).select('id').eq('id', note.id).single();
      if (existing) {
        const { error } = await (supabase.from('credit_notes' as any) as any).update(row).eq('id', note.id);
        if (error) throw error;
        return note.id;
      }
    }
    const { data, error } = await (supabase.from('credit_notes' as any) as any).insert(row).select('id').single();
    if (error) throw error;
    return data.id;
  },
  deleteCreditNote: async (id: string) => {
    const { error } = await (supabase.from('credit_notes' as any) as any).delete().eq('id', id);
    if (error) throw error;
  },
  getNextCreditNoteNumber: async (): Promise<string> => {
    const userId = await getUserId();
    const { data: existing } = await (supabase.from('credit_note_counters' as any) as any).select('*').eq('user_id', userId).single();
    if (existing) {
      const newCounter = existing.counter + 1;
      await (supabase.from('credit_note_counters' as any) as any).update({ counter: newCounter }).eq('user_id', userId);
      return `CN-${newCounter.toString().padStart(4, '0')}`;
    } else {
      await (supabase.from('credit_note_counters' as any) as any).insert({ user_id: userId, counter: 1 });
      return 'CN-0001';
    }
  },

  // Debit Notes
  getDebitNotes: async (): Promise<DebitNote[]> => {
    const { data, error } = await (supabase.from('debit_notes' as any) as any).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((n: any) => ({
      id: n.id,
      noteNumber: n.note_number,
      noteDate: n.note_date,
      noteType: n.note_type,
      refBillNo: n.ref_bill_no || '',
      accountName: n.account_name || '',
      city: n.city || '',
      state: n.state || '',
      netAmount: Number(n.net_amount || 0),
      notes: n.notes || '',
    }));
  },
  saveDebitNote: async (note: Omit<DebitNote, 'id'> & { id?: string }) => {
    const userId = await getUserId();
    const row: any = {
      note_number: note.noteNumber,
      note_date: note.noteDate,
      note_type: note.noteType,
      ref_bill_no: note.refBillNo || '',
      account_name: note.accountName || '',
      city: note.city || '',
      state: note.state || '',
      net_amount: note.netAmount || 0,
      notes: note.notes || '',
      user_id: userId,
    };
    if (note.id) {
      const { data: existing } = await (supabase.from('debit_notes' as any) as any).select('id').eq('id', note.id).single();
      if (existing) {
        const { error } = await (supabase.from('debit_notes' as any) as any).update(row).eq('id', note.id);
        if (error) throw error;
        return note.id;
      }
    }
    const { data, error } = await (supabase.from('debit_notes' as any) as any).insert(row).select('id').single();
    if (error) throw error;
    return data.id;
  },
  deleteDebitNote: async (id: string) => {
    const { error } = await (supabase.from('debit_notes' as any) as any).delete().eq('id', id);
    if (error) throw error;
  },
  getNextDebitNoteNumber: async (): Promise<string> => {
    const userId = await getUserId();
    const { data: existing } = await (supabase.from('debit_note_counters' as any) as any).select('*').eq('user_id', userId).single();
    if (existing) {
      const newCounter = existing.counter + 1;
      await (supabase.from('debit_note_counters' as any) as any).update({ counter: newCounter }).eq('user_id', userId);
      return `DN-${newCounter.toString().padStart(4, '0')}`;
    } else {
      await (supabase.from('debit_note_counters' as any) as any).insert({ user_id: userId, counter: 1 });
      return 'DN-0001';
    }
  },
};
