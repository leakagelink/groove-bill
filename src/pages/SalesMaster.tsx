import { useState, useEffect, useMemo } from 'react';
import { store } from '@/lib/store';
import { Sale, SaleItem, Customer, Product, Brand, CreditNote, CreditNoteType } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Trash2, Search, Printer, Pencil, Check, X, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BillPrint from '@/components/BillPrint';

export default function SalesMaster() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<'new' | 'invoice' | 'estimate' | 'credit'>('new');

  // Credit notes state
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [selectedCreditIds, setSelectedCreditIds] = useState<Set<string>>(new Set());
  const [filterNoteType, setFilterNoteType] = useState<'all' | CreditNoteType>('all');
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [editingCredit, setEditingCredit] = useState<CreditNote | null>(null);
  const [cnNumber, setCnNumber] = useState('');
  const [cnDate, setCnDate] = useState(new Date().toISOString().split('T')[0]);
  const [cnType, setCnType] = useState<CreditNoteType>('sales_return');
  const [cnRefBill, setCnRefBill] = useState('');
  const [cnAccount, setCnAccount] = useState('');
  const [cnCity, setCnCity] = useState('');
  const [cnState, setCnState] = useState('');
  const [cnAmount, setCnAmount] = useState(0);
  const [cnNotes, setCnNotes] = useState('');

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Selection
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [selectedEstimateIds, setSelectedEstimateIds] = useState<Set<string>>(new Set());

  // Edit product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);

  // Customer fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');

  // Print state
  const [printSale, setPrintSale] = useState<Sale | null>(null);
  const [printWithPrice, setPrintWithPrice] = useState(true);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [pendingSale, setPendingSale] = useState<Sale | null>(null);

  // Add new product state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdBrandId, setNewProdBrandId] = useState('');
  const [newProdBrandName, setNewProdBrandName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdDiscount, setNewProdDiscount] = useState(0);

  const loadData = async () => {
    try {
      const [s, p, b, c, cn] = await Promise.all([
        store.getSales(), store.getProducts(), store.getBrands(), store.getCustomers(), store.getCreditNotes()
      ]);
      setSales(s); setProducts(p); setBrands(b); setCustomers(c); setCreditNotes(cn);
    } catch (e: any) {
      toast({ title: 'Error loading data', description: e.message, variant: 'destructive' });
    }
  };
  useEffect(() => { loadData(); }, []);

  // Customer lookup helper
  const customerByName = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach(c => map.set(c.name.toLowerCase(), c));
    return map;
  }, [customers]);

  const getCustomerCity = (sale: Sale) => {
    const c = customerByName.get(sale.customerName.toLowerCase());
    return c?.city || '';
  };
  const getCustomerState = (sale: Sale) => {
    // No state field in customer; derive from address tail if present
    const c = customerByName.get(sale.customerName.toLowerCase());
    if (!c?.address) return '';
    const parts = c.address.split(',').map(p => p.trim()).filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 1] : '';
  };

  const openAddProduct = () => {
    setNewProdName(''); setNewProdCategory(''); setNewProdBrandId(''); setNewProdBrandName('');
    setNewProdPrice(0); setNewProdDiscount(0); setShowAddProduct(true);
  };

  const saveNewProduct = async () => {
    if (!newProdName.trim()) { toast({ title: 'Product name is required', variant: 'destructive' }); return; }
    try {
      const brand = brands.find(b => b.id === newProdBrandId);
      await store.saveProduct({
        name: newProdName, category: newProdCategory,
        brandId: newProdBrandId, brandName: brand?.name || newProdBrandName,
        price: newProdPrice, discount: newProdDiscount,
      });
      setProducts(await store.getProducts());
      setShowAddProduct(false);
      toast({ title: 'Product added!' });
    } catch (e: any) {
      toast({ title: 'Error adding product', description: e.message, variant: 'destructive' });
    }
  };

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', brandName: '', quantity: 1, price: 0, discount: 0, discountAmount: 0, total: 0 }]);
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    const updated = [...items];
    const item = { ...updated[idx], [field]: value };
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.productName = product.name;
        item.brandName = product.brandName;
        item.price = product.price;
        item.discount = product.discount;
      }
    }
    const subtotal = item.quantity * item.price;
    item.discountAmount = (subtotal * item.discount) / 100;
    item.total = subtotal - item.discountAmount;
    updated[idx] = item;
    setItems(updated);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const startEditProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setEditName(product.name);
      setEditPrice(product.price);
      setEditDiscount(product.discount);
    }
  };

  const saveEditProduct = async () => {
    if (!editingProduct) return;
    try {
      const updated: Product = { ...editingProduct, name: editName, price: editPrice, discount: editDiscount };
      await store.saveProduct(updated);
      setProducts(await store.getProducts());
      setItems(items.map(item => {
        if (item.productId === updated.id) {
          const newItem = { ...item, productName: updated.name, price: updated.price, discount: updated.discount };
          const subtotal = newItem.quantity * newItem.price;
          newItem.discountAmount = (subtotal * newItem.discount) / 100;
          newItem.total = subtotal - newItem.discountAmount;
          return newItem;
        }
        return item;
      }));
      setEditingProduct(null);
      toast({ title: 'Product updated!' });
    } catch (e: any) {
      toast({ title: 'Error updating product', description: e.message, variant: 'destructive' });
    }
  };

  const totalAmount = items.reduce((s, i) => s + (i.quantity * i.price), 0);
  const totalDiscount = items.reduce((s, i) => s + i.discountAmount, 0);
  const finalAmount = items.reduce((s, i) => s + i.total, 0);

  const startEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setCustomerName(sale.customerName);
    setCustomerPhone(sale.customerPhone);
    setCustomerAddress('');
    setDate(sale.date);
    setPaymentMethod(sale.paymentMethod || 'cash');
    setItems(sale.items.map(i => ({ ...i })));
    setShowForm(true);
    setActiveTab('new');
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSale(null);
    setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setItems([]);
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
  };

  const save = async () => {
    if (!customerName.trim() || items.length === 0) return;
    setLoading(true);
    try {
      const customerId = await store.saveCustomer({
        name: customerName, phone: customerPhone, address: customerAddress,
      } as Customer);

      let invoiceNumber = editingSale?.invoiceNumber || '';
      if (!editingSale) {
        invoiceNumber = await store.getNextInvoiceNumber();
      }

      const sale: Sale = {
        id: editingSale?.id || crypto.randomUUID(),
        invoiceNumber,
        customerId: customerId,
        customerName, customerPhone, date, items,
        totalAmount, totalDiscount, finalAmount,
        paymentStatus: editingSale?.paymentStatus || 'unpaid',
        paymentMethod: paymentMethod as any,
      };
      await store.saveSale(sale);
      await loadData();

      setPendingSale(sale);
      setShowPrintDialog(true);
      resetForm();
      toast({ title: editingSale ? 'Sale updated successfully!' : 'Sale saved successfully!' });
    } catch (e: any) {
      toast({ title: 'Error saving sale', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (withPrice: boolean) => {
    if (pendingSale) {
      setPrintWithPrice(withPrice);
      setPrintSale(pendingSale);
      setShowPrintDialog(false);
      setPendingSale(null);
    }
  };

  const handlePrintFromList = (sale: Sale) => {
    setPendingSale(sale);
    setShowPrintDialog(true);
  };

  const shareWhatsApp = (sale: Sale) => {
    const saleItems = sale.items.map((i, idx) => `${idx + 1}. ${i.productName} x${i.quantity} = ₹${i.total}`).join('\n');
    const message = encodeURIComponent(
      `*CHR - Invoice ${sale.invoiceNumber}*\n` +
      `Date: ${new Date(sale.date).toLocaleDateString('en-IN')}\n` +
      `Customer: ${sale.customerName}\n\n` +
      `*Items:*\n${saleItems}\n\n` +
      `Total: ₹${sale.totalAmount.toLocaleString('en-IN')}\n` +
      `Discount: ₹${sale.totalDiscount.toLocaleString('en-IN')}\n` +
      `*Final Amount: ₹${sale.finalAmount.toLocaleString('en-IN')}*\n\n` +
      `Thank you for your purchase!`
    );
    const phone = sale.customerPhone ? sale.customerPhone.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  // Filter helper for invoice/estimate tabs
  const applyFilters = (list: Sale[], includeStatus: boolean) => {
    return list.filter(s => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.customerName.toLowerCase().includes(q) && !s.invoiceNumber.toLowerCase().includes(q) && !(s.customerPhone || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      if (fromDate && s.date < fromDate) return false;
      if (toDate && s.date > toDate) return false;
      if (filterCity) {
        const city = getCustomerCity(s).toLowerCase();
        if (!city.includes(filterCity.toLowerCase())) return false;
      }
      if (includeStatus && filterStatus !== 'all') {
        if ((s.paymentStatus || 'unpaid') !== filterStatus) return false;
      }
      return true;
    });
  };

  const filteredInvoices = applyFilters(sales, true);
  const filteredEstimates = applyFilters(sales, false);

  const toggleSelectAll = (tab: 'invoice' | 'estimate') => {
    const list = tab === 'invoice' ? filteredInvoices : filteredEstimates;
    const set = tab === 'invoice' ? selectedInvoiceIds : selectedEstimateIds;
    const setter = tab === 'invoice' ? setSelectedInvoiceIds : setSelectedEstimateIds;
    if (set.size === list.length && list.length > 0) {
      setter(new Set());
    } else {
      setter(new Set(list.map(s => s.id)));
    }
  };

  const toggleSelect = (tab: 'invoice' | 'estimate', id: string) => {
    const set = tab === 'invoice' ? selectedInvoiceIds : selectedEstimateIds;
    const setter = tab === 'invoice' ? setSelectedInvoiceIds : setSelectedEstimateIds;
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const togglePaymentStatus = async (sale: Sale) => {
    try {
      const updated: Sale = { ...sale, paymentStatus: sale.paymentStatus === 'paid' ? 'unpaid' : 'paid' };
      await store.saveSale(updated);
      await loadData();
      toast({ title: `Marked as ${updated.paymentStatus}` });
    } catch (e: any) {
      toast({ title: 'Error updating status', description: e.message, variant: 'destructive' });
    }
  };

  const clearFilters = () => {
    setFromDate(''); setToDate(''); setFilterCity(''); setFilterStatus('all'); setSearch('');
  };

  return (
    <div className="space-y-6">
      {showPrintDialog && pendingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
          <div className="bg-card rounded-lg border p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-semibold text-foreground text-lg">Print Invoice</h3>
            <p className="text-sm text-muted-foreground">Invoice {pendingSale.invoiceNumber} saved successfully!</p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => handlePrint(true)}><Printer size={16} className="mr-2" /> Print with Price</Button>
              <Button variant="outline" className="w-full" onClick={() => handlePrint(false)}><Printer size={16} className="mr-2" /> Print without Price</Button>
              <Button variant="outline" className="w-full" onClick={() => shareWhatsApp(pendingSale)}>Share on WhatsApp</Button>
              <Button variant="ghost" className="w-full" onClick={() => { setShowPrintDialog(false); setPendingSale(null); }}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {printSale && <BillPrint sale={printSale} showPrice={printWithPrice} onClose={() => setPrintSale(null)} />}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
          <div className="bg-card rounded-lg border p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-semibold text-foreground text-lg">Edit Product</h3>
            <div className="space-y-3">
              <div><label className="text-sm text-muted-foreground">Product Name</label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div><label className="text-sm text-muted-foreground">Price (₹)</label><Input type="number" value={editPrice || ''} onChange={e => setEditPrice(parseFloat(e.target.value) || 0)} /></div>
              <div><label className="text-sm text-muted-foreground">Discount (%)</label><Input type="number" value={editDiscount || ''} onChange={e => setEditDiscount(parseFloat(e.target.value) || 0)} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveEditProduct}><Check size={14} className="mr-1" /> Save</Button>
              <Button variant="outline" onClick={() => setEditingProduct(null)}><X size={14} className="mr-1" /> Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
          <div className="bg-card rounded-lg border p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-semibold text-foreground text-lg">Add New Product</h3>
            <div className="space-y-3">
              <div><label className="text-sm text-muted-foreground">Product Name *</label><Input value={newProdName} onChange={e => setNewProdName(e.target.value)} /></div>
              <div><label className="text-sm text-muted-foreground">Category</label><Input value={newProdCategory} onChange={e => setNewProdCategory(e.target.value)} /></div>
              <div>
                <label className="text-sm text-muted-foreground">Brand</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={newProdBrandId} onChange={e => setNewProdBrandId(e.target.value)}>
                  <option value="">Select Brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm text-muted-foreground">Price (₹)</label><Input type="number" value={newProdPrice || ''} onChange={e => setNewProdPrice(parseFloat(e.target.value) || 0)} /></div>
              <div><label className="text-sm text-muted-foreground">Discount (%)</label><Input type="number" value={newProdDiscount || ''} onChange={e => setNewProdDiscount(parseFloat(e.target.value) || 0)} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveNewProduct}><Check size={14} className="mr-1" /> Save</Button>
              <Button variant="outline" onClick={() => setShowAddProduct(false)}><X size={14} className="mr-1" /> Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Sales Master</h1>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); setActiveTab('new'); }}>
          <Plus size={16} className="mr-1" /> New Sale
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
          <TabsTrigger value="new">New / Recent</TabsTrigger>
          <TabsTrigger value="invoice">Sales Invoice</TabsTrigger>
          <TabsTrigger value="estimate">Estimate</TabsTrigger>
          <TabsTrigger value="credit">Credit Notes</TabsTrigger>
        </TabsList>

        {/* ===== NEW / RECENT TAB ===== */}
        <TabsContent value="new" className="space-y-4">
          {showForm && (
            <div className="bg-card rounded-lg border p-5 space-y-4">
              <h3 className="font-semibold text-foreground">{editingSale ? `Edit Sale - ${editingSale.invoiceNumber}` : 'New Sale'}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <Input placeholder="Customer Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                <Input placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                <Input placeholder="Address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash">💵 Cash</option>
                  <option value="online">🏦 Online</option>
                  <option value="upi">📱 UPI</option>
                  <option value="card">💳 Card</option>
                  <option value="cheque">📝 Cheque</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Items</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={openAddProduct}><Plus size={14} className="mr-1" /> New Product</Button>
                    <Button variant="outline" size="sm" onClick={addItem}><Plus size={14} className="mr-1" /> Add Item</Button>
                  </div>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-8 gap-2 items-end border-b pb-3 sm:border-0 sm:pb-0">
                    <div className="col-span-2 sm:col-span-2 flex gap-1">
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}>
                        <option value="">Select Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.brandName})</option>)}
                      </select>
                      {item.productId && (
                        <Button variant="ghost" size="sm" className="h-9 px-2 shrink-0" onClick={() => startEditProduct(item.productId)} title="Edit Product">
                          <Pencil size={13} className="text-primary" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2 sm:contents">
                      <Input type="number" placeholder="Qty" className="h-9" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} />
                      <Input type="number" placeholder="Price" className="h-9" value={item.price || ''} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} />
                      <Input type="number" placeholder="Disc %" className="h-9" value={item.discount || ''} onChange={e => updateItem(idx, 'discount', parseFloat(e.target.value) || 0)} />
                      <div className="flex items-center justify-between h-9">
                        <span className="text-sm font-medium text-foreground">₹{item.total.toLocaleString('en-IN')}</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2" onClick={() => removeItem(idx)}><Trash2 size={14} className="text-destructive" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Amount</span><span className="text-foreground">₹{totalAmount.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Discount</span><span className="text-destructive">-₹{totalDiscount.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-base font-bold"><span className="text-foreground">Final Amount</span><span className="text-primary">₹{finalAmount.toLocaleString('en-IN')}</span></div>
              </div>

              <div className="flex gap-3">
                <Button onClick={save} disabled={loading}>{editingSale ? 'Update Sale' : 'Save & Print'}</Button>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by customer or invoice..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="divide-y sm:hidden">
                {filteredInvoices.length === 0 && <p className="p-4 text-sm text-muted-foreground">No sales found</p>}
                {filteredInvoices.map(s => (
                  <div key={s.id} className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-primary">{s.invoiceNumber}</span>
                      <span className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground text-sm">{s.customerName}</span>
                      <span className="font-medium text-foreground text-sm">₹{s.finalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex gap-1 pt-1">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => startEditSale(s)}><Pencil size={12} className="mr-1" /> Edit</Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => handlePrintFromList(s)}><Printer size={12} className="mr-1" /> Print</Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => shareWhatsApp(s)}>WA</Button>
                    </div>
                  </div>
                ))}
              </div>

              <table className="w-full text-sm hidden sm:table">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Payment</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Final</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filteredInvoices.length === 0 && <tr><td colSpan={6} className="p-4 text-muted-foreground">No sales found</td></tr>}
                  {filteredInvoices.map(s => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono text-sm text-primary">{s.invoiceNumber}</td>
                      <td className="p-3 text-foreground">{new Date(s.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 font-medium text-foreground">{s.customerName}</td>
                      <td className="p-3 text-muted-foreground capitalize">{s.paymentMethod || 'cash'}</td>
                      <td className="p-3 text-right font-medium text-foreground">₹{s.finalAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => startEditSale(s)} title="Edit Sale"><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handlePrintFromList(s)}><Printer size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => shareWhatsApp(s)}>WA</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ===== SALES INVOICE TAB ===== */}
        <TabsContent value="invoice" className="space-y-4">
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search invoice / customer / phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={14} className="mr-1" /> Filters
                  </Button>
                  {(fromDate || toDate || filterCity || filterStatus !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}><X size={14} className="mr-1" /> Clear</Button>
                  )}
                </div>
              </div>
              {showFilters && (
                <div className="grid sm:grid-cols-4 gap-2 pt-2 border-t">
                  <div>
                    <label className="text-xs text-muted-foreground">From Date</label>
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">To Date</label>
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">City</label>
                    <Input placeholder="Filter by city" value={filterCity} onChange={e => setFilterCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Status</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                      <option value="all">All</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </div>
                </div>
              )}
              {selectedInvoiceIds.size > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedInvoiceIds.size} selected · Total: ₹{filteredInvoices.filter(s => selectedInvoiceIds.has(s.id)).reduce((sum, s) => sum + s.finalAmount, 0).toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={filteredInvoices.length > 0 && selectedInvoiceIds.size === filteredInvoices.length}
                      onCheckedChange={() => toggleSelectAll('invoice')}
                    />
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Bill No</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Party Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">City</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Net Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">LR No</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filteredInvoices.length === 0 && <tr><td colSpan={9} className="p-4 text-muted-foreground text-center">No invoices found</td></tr>}
                  {filteredInvoices.map(s => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <Checkbox checked={selectedInvoiceIds.has(s.id)} onCheckedChange={() => toggleSelect('invoice', s.id)} />
                      </td>
                      <td className="p-3 font-mono text-primary">{s.invoiceNumber}</td>
                      <td className="p-3 text-foreground whitespace-nowrap">{new Date(s.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 font-medium text-foreground">{s.customerName}</td>
                      <td className="p-3 text-muted-foreground">{getCustomerCity(s) || '-'}</td>
                      <td className="p-3 text-right font-medium text-foreground">₹{s.finalAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-muted-foreground">-</td>
                      <td className="p-3">
                        <button
                          onClick={() => togglePaymentStatus(s)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            s.paymentStatus === 'paid'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {s.paymentStatus || 'unpaid'}
                        </button>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => startEditSale(s)} title="Edit"><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handlePrintFromList(s)} title="Print"><Printer size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => shareWhatsApp(s)} title="WhatsApp">WA</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ===== ESTIMATE TAB ===== */}
        <TabsContent value="estimate" className="space-y-4">
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search bill / party / phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={14} className="mr-1" /> Filters
                  </Button>
                  {(fromDate || toDate || filterCity) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}><X size={14} className="mr-1" /> Clear</Button>
                  )}
                </div>
              </div>
              {showFilters && (
                <div className="grid sm:grid-cols-3 gap-2 pt-2 border-t">
                  <div>
                    <label className="text-xs text-muted-foreground">From Date</label>
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">To Date</label>
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">City</label>
                    <Input placeholder="Filter by city" value={filterCity} onChange={e => setFilterCity(e.target.value)} />
                  </div>
                </div>
              )}
              {selectedEstimateIds.size > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedEstimateIds.size} selected · Total: ₹{filteredEstimates.filter(s => selectedEstimateIds.has(s.id)).reduce((sum, s) => sum + s.finalAmount, 0).toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={filteredEstimates.length > 0 && selectedEstimateIds.size === filteredEstimates.length}
                      onCheckedChange={() => toggleSelectAll('estimate')}
                    />
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Bill No</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Party Number</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">City</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">State</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Net Amount</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filteredEstimates.length === 0 && <tr><td colSpan={8} className="p-4 text-muted-foreground text-center">No estimates found</td></tr>}
                  {filteredEstimates.map(s => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <Checkbox checked={selectedEstimateIds.has(s.id)} onCheckedChange={() => toggleSelect('estimate', s.id)} />
                      </td>
                      <td className="p-3 font-mono text-primary">{s.invoiceNumber}</td>
                      <td className="p-3 text-foreground whitespace-nowrap">{new Date(s.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-foreground">{s.customerPhone || '-'}</td>
                      <td className="p-3 text-muted-foreground">{getCustomerCity(s) || '-'}</td>
                      <td className="p-3 text-muted-foreground">{getCustomerState(s) || '-'}</td>
                      <td className="p-3 text-right font-medium text-foreground">₹{s.finalAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => handlePrintFromList(s)} title="Print"><Printer size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => shareWhatsApp(s)} title="WhatsApp">WA</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ===== CREDIT NOTES TAB ===== */}
        <TabsContent value="credit" className="space-y-4">
          {showCreditForm && (
            <div className="bg-card rounded-lg border p-5 space-y-4">
              <h3 className="font-semibold text-foreground">{editingCredit ? `Edit Credit Note - ${editingCredit.noteNumber}` : 'New Credit Note'}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Note No</label>
                  <Input value={cnNumber} onChange={e => setCnNumber(e.target.value)} placeholder="Auto" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Note Date</label>
                  <Input type="date" value={cnDate} onChange={e => setCnDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Note Type</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={cnType} onChange={e => setCnType(e.target.value as CreditNoteType)}>
                    <option value="sales_return">Sales Return</option>
                    <option value="discount">Discount</option>
                    <option value="rate_difference">Rate Difference</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ref Bill No</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={cnRefBill} onChange={e => {
                    const inv = e.target.value;
                    setCnRefBill(inv);
                    const sale = sales.find(s => s.invoiceNumber === inv);
                    if (sale) {
                      setCnAccount(sale.customerName);
                      setCnCity(getCustomerCity(sale));
                      setCnState(getCustomerState(sale));
                    }
                  }}>
                    <option value="">Select Bill (optional)</option>
                    {sales.map(s => <option key={s.id} value={s.invoiceNumber}>{s.invoiceNumber} - {s.customerName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Account Name *</label>
                  <Input value={cnAccount} onChange={e => setCnAccount(e.target.value)} list="cn-customers" />
                  <datalist id="cn-customers">
                    {customers.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">City</label>
                  <Input value={cnCity} onChange={e => setCnCity(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">State</label>
                  <Input value={cnState} onChange={e => setCnState(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Net Amount (₹) *</label>
                  <Input type="number" value={cnAmount || ''} onChange={e => setCnAmount(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="text-xs text-muted-foreground">Notes</label>
                  <Input value={cnNotes} onChange={e => setCnNotes(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={async () => {
                  if (!cnAccount.trim() || !cnAmount) {
                    toast({ title: 'Account name and amount required', variant: 'destructive' });
                    return;
                  }
                  try {
                    let noteNumber = cnNumber;
                    if (!editingCredit && !noteNumber) noteNumber = await store.getNextCreditNoteNumber();
                    await store.saveCreditNote({
                      id: editingCredit?.id,
                      noteNumber, noteDate: cnDate, noteType: cnType,
                      refBillNo: cnRefBill, accountName: cnAccount,
                      city: cnCity, state: cnState, netAmount: cnAmount, notes: cnNotes,
                    });
                    setCreditNotes(await store.getCreditNotes());
                    setShowCreditForm(false); setEditingCredit(null);
                    setCnNumber(''); setCnRefBill(''); setCnAccount(''); setCnCity(''); setCnState('');
                    setCnAmount(0); setCnNotes(''); setCnType('sales_return');
                    setCnDate(new Date().toISOString().split('T')[0]);
                    toast({ title: editingCredit ? 'Credit note updated!' : 'Credit note saved!' });
                  } catch (e: any) {
                    toast({ title: 'Error saving credit note', description: e.message, variant: 'destructive' });
                  }
                }}>
                  <Check size={14} className="mr-1" /> {editingCredit ? 'Update' : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowCreditForm(false); setEditingCredit(null);
                }}><X size={14} className="mr-1" /> Cancel</Button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search note no / account / ref bill..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={14} className="mr-1" /> Filters
                  </Button>
                  {(fromDate || toDate || filterCity || filterNoteType !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={() => { clearFilters(); setFilterNoteType('all'); }}>
                      <X size={14} className="mr-1" /> Clear
                    </Button>
                  )}
                  <Button size="sm" onClick={() => { setEditingCredit(null); setShowCreditForm(true); }}>
                    <Plus size={14} className="mr-1" /> New Note
                  </Button>
                </div>
              </div>
              {showFilters && (
                <div className="grid sm:grid-cols-4 gap-2 pt-2 border-t">
                  <div>
                    <label className="text-xs text-muted-foreground">From Date</label>
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">To Date</label>
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">City</label>
                    <Input placeholder="Filter by city" value={filterCity} onChange={e => setFilterCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Note Type</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={filterNoteType} onChange={e => setFilterNoteType(e.target.value as any)}>
                      <option value="all">All Types</option>
                      <option value="sales_return">Sales Return</option>
                      <option value="discount">Discount</option>
                      <option value="rate_difference">Rate Difference</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              )}
              {(() => {
                const filteredNotes = creditNotes.filter(n => {
                  if (search) {
                    const q = search.toLowerCase();
                    if (!n.noteNumber.toLowerCase().includes(q) && !n.accountName.toLowerCase().includes(q) && !(n.refBillNo || '').toLowerCase().includes(q)) return false;
                  }
                  if (fromDate && n.noteDate < fromDate) return false;
                  if (toDate && n.noteDate > toDate) return false;
                  if (filterCity && !(n.city || '').toLowerCase().includes(filterCity.toLowerCase())) return false;
                  if (filterNoteType !== 'all' && n.noteType !== filterNoteType) return false;
                  return true;
                });
                if (selectedCreditIds.size === 0) return null;
                return (
                  <div className="text-sm text-muted-foreground">
                    {selectedCreditIds.size} selected · Total: ₹{filteredNotes.filter(n => selectedCreditIds.has(n.id)).reduce((sum, n) => sum + n.netAmount, 0).toLocaleString('en-IN')}
                    <Button variant="ghost" size="sm" className="ml-2" onClick={async () => {
                      if (!confirm(`Delete ${selectedCreditIds.size} credit note(s)?`)) return;
                      try {
                        for (const id of Array.from(selectedCreditIds)) await store.deleteCreditNote(id);
                        setCreditNotes(await store.getCreditNotes());
                        setSelectedCreditIds(new Set());
                        toast({ title: 'Deleted' });
                      } catch (e: any) {
                        toast({ title: 'Error deleting', description: e.message, variant: 'destructive' });
                      }
                    }}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                );
              })()}
            </div>

            <div className="overflow-x-auto">
              {(() => {
                const filteredNotes = creditNotes.filter(n => {
                  if (search) {
                    const q = search.toLowerCase();
                    if (!n.noteNumber.toLowerCase().includes(q) && !n.accountName.toLowerCase().includes(q) && !(n.refBillNo || '').toLowerCase().includes(q)) return false;
                  }
                  if (fromDate && n.noteDate < fromDate) return false;
                  if (toDate && n.noteDate > toDate) return false;
                  if (filterCity && !(n.city || '').toLowerCase().includes(filterCity.toLowerCase())) return false;
                  if (filterNoteType !== 'all' && n.noteType !== filterNoteType) return false;
                  return true;
                });
                const allSelected = filteredNotes.length > 0 && selectedCreditIds.size === filteredNotes.length;
                const typeLabel = (t: string) => ({ sales_return: 'Sales Return', discount: 'Discount', rate_difference: 'Rate Diff', other: 'Other' } as any)[t] || t;
                return (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="p-3 w-10">
                        <Checkbox checked={allSelected} onCheckedChange={() => {
                          if (allSelected) setSelectedCreditIds(new Set());
                          else setSelectedCreditIds(new Set(filteredNotes.map(n => n.id)));
                        }} />
                      </th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Note No</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Note Date</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Note Type</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Ref Bill No</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Account Name</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">City</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">State</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Net Amount</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Action</th>
                    </tr></thead>
                    <tbody className="divide-y">
                      {filteredNotes.length === 0 && <tr><td colSpan={10} className="p-4 text-muted-foreground text-center">No credit notes found</td></tr>}
                      {filteredNotes.map(n => (
                        <tr key={n.id} className="hover:bg-muted/30">
                          <td className="p-3">
                            <Checkbox checked={selectedCreditIds.has(n.id)} onCheckedChange={() => {
                              const next = new Set(selectedCreditIds);
                              if (next.has(n.id)) next.delete(n.id); else next.add(n.id);
                              setSelectedCreditIds(next);
                            }} />
                          </td>
                          <td className="p-3 font-mono text-primary">{n.noteNumber}</td>
                          <td className="p-3 text-foreground whitespace-nowrap">{new Date(n.noteDate).toLocaleDateString('en-IN')}</td>
                          <td className="p-3 text-muted-foreground">{typeLabel(n.noteType)}</td>
                          <td className="p-3 font-mono text-muted-foreground">{n.refBillNo || '-'}</td>
                          <td className="p-3 font-medium text-foreground">{n.accountName}</td>
                          <td className="p-3 text-muted-foreground">{n.city || '-'}</td>
                          <td className="p-3 text-muted-foreground">{n.state || '-'}</td>
                          <td className="p-3 text-right font-medium text-foreground">₹{n.netAmount.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingCredit(n);
                              setCnNumber(n.noteNumber); setCnDate(n.noteDate); setCnType(n.noteType);
                              setCnRefBill(n.refBillNo); setCnAccount(n.accountName);
                              setCnCity(n.city); setCnState(n.state); setCnAmount(n.netAmount); setCnNotes(n.notes);
                              setShowCreditForm(true);
                            }}><Pencil size={14} /></Button>
                            <Button variant="ghost" size="sm" onClick={async () => {
                              if (!confirm('Delete this credit note?')) return;
                              try {
                                await store.deleteCreditNote(n.id);
                                setCreditNotes(await store.getCreditNotes());
                                toast({ title: 'Deleted' });
                              } catch (e: any) {
                                toast({ title: 'Error', description: e.message, variant: 'destructive' });
                              }
                            }}><Trash2 size={14} className="text-destructive" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
