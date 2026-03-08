import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Quotation, SaleItem, Product, Brand } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search, Printer, Pencil, Check, X, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QuotationPrint from '@/components/QuotationPrint';

export default function QuotationMaster() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);

  const [printQuotation, setPrintQuotation] = useState<Quotation | null>(null);

  // Add new product state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdBrandId, setNewProdBrandId] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdDiscount, setNewProdDiscount] = useState(0);

  const loadData = async () => {
    try {
      const [q, p, b] = await Promise.all([store.getQuotations(), store.getProducts(), store.getBrands()]);
      setQuotations(q); setProducts(p); setBrands(b);
    } catch (e: any) {
      toast({ title: 'Error loading data', description: e.message, variant: 'destructive' });
    }
  };
  useEffect(() => { loadData(); }, []);

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

  const totalAmount = items.reduce((s, i) => s + (i.quantity * i.price), 0);
  const totalDiscount = items.reduce((s, i) => s + i.discountAmount, 0);
  const finalAmount = items.reduce((s, i) => s + i.total, 0);

  const startEdit = (q: Quotation) => {
    setEditingQuotation(q);
    setCustomerName(q.customerName);
    setCustomerPhone(q.customerPhone);
    setCustomerAddress(q.customerAddress);
    setDate(q.date);
    setValidUntil(q.validUntil);
    setNotes(q.notes);
    setItems(q.items.map(i => ({ ...i })));
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingQuotation(null);
    setCustomerName(''); setCustomerPhone(''); setCustomerAddress('');
    setDate(new Date().toISOString().split('T')[0]);
    setValidUntil(''); setNotes(''); setItems([]);
  };

  const save = async () => {
    if (!customerName.trim() || items.length === 0) return;
    setLoading(true);
    try {
      let quotationNumber = editingQuotation?.quotationNumber || '';
      if (!editingQuotation) {
        quotationNumber = await store.getNextQuotationNumber();
      }

      const quotation: Quotation = {
        id: editingQuotation?.id || crypto.randomUUID(),
        quotationNumber,
        customerName, customerPhone, customerAddress,
        date, items, totalAmount, totalDiscount, finalAmount,
        notes, validUntil,
      };
      await store.saveQuotation(quotation);
      setQuotations(await store.getQuotations());
      setPrintQuotation(quotation);
      resetForm();
      toast({ title: editingQuotation ? 'Quotation updated!' : 'Quotation saved!' });
    } catch (e: any) {
      toast({ title: 'Error saving quotation', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteQuotation = async (id: string) => {
    try {
      await store.deleteQuotation(id);
      setQuotations(await store.getQuotations());
      toast({ title: 'Quotation deleted' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const shareWhatsApp = (q: Quotation) => {
    const qItems = q.items.map((i, idx) => `${idx + 1}. ${i.productName} x${i.quantity} = ₹${i.total}`).join('\n');
    const message = encodeURIComponent(
      `*CHR - Quotation ${q.quotationNumber}*\n` +
      `Date: ${new Date(q.date).toLocaleDateString('en-IN')}\n` +
      (q.validUntil ? `Valid Until: ${new Date(q.validUntil).toLocaleDateString('en-IN')}\n` : '') +
      `Customer: ${q.customerName}\n\n` +
      `*Items:*\n${qItems}\n\n` +
      `Total: ₹${q.totalAmount.toLocaleString('en-IN')}\n` +
      `Discount: ₹${q.totalDiscount.toLocaleString('en-IN')}\n` +
      `*Final Amount: ₹${q.finalAmount.toLocaleString('en-IN')}*\n` +
      (q.notes ? `\nNotes: ${q.notes}\n` : '') +
      `\nThis is a quotation. Prices may vary.`
    );
    const phone = q.customerPhone ? q.customerPhone.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  const saveNewProduct = async () => {
    if (!newProdName.trim()) { toast({ title: 'Product name is required', variant: 'destructive' }); return; }
    try {
      const brand = brands.find(b => b.id === newProdBrandId);
      await store.saveProduct({
        name: newProdName, category: newProdCategory,
        brandId: newProdBrandId, brandName: brand?.name || '',
        price: newProdPrice, discount: newProdDiscount,
      });
      setProducts(await store.getProducts());
      setShowAddProduct(false);
      toast({ title: 'Product added!' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const filtered = quotations.filter(q =>
    q.customerName.toLowerCase().includes(search.toLowerCase()) ||
    q.quotationNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {printQuotation && <QuotationPrint quotation={printQuotation} onClose={() => setPrintQuotation(null)} />}

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
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Quotation Maker</h1>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus size={16} className="mr-1" /> New Quotation</Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h3 className="font-semibold text-foreground">{editingQuotation ? `Edit - ${editingQuotation.quotationNumber}` : 'New Quotation'}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input placeholder="Customer Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            <Input placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            <Input placeholder="Address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <div>
              <label className="text-xs text-muted-foreground">Valid Until</label>
              <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
            <Input placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Items</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setNewProdName(''); setNewProdCategory(''); setNewProdBrandId(''); setNewProdPrice(0); setNewProdDiscount(0); setShowAddProduct(true); }}><Plus size={14} className="mr-1" /> New Product</Button>
                <Button variant="outline" size="sm" onClick={addItem}><Plus size={14} className="mr-1" /> Add Item</Button>
              </div>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-7 gap-2 items-end border-b pb-3 sm:border-0 sm:pb-0">
                <div className="col-span-2">
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}>
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.brandName})</option>)}
                  </select>
                </div>
                <Input type="number" placeholder="Qty" className="h-9" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} />
                <Input type="number" placeholder="Price" className="h-9" value={item.price || ''} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} />
                <Input type="number" placeholder="Disc %" className="h-9" value={item.discount || ''} onChange={e => updateItem(idx, 'discount', parseFloat(e.target.value) || 0)} />
                <div className="flex items-center justify-between h-9">
                  <span className="text-sm font-medium text-foreground">₹{item.total.toLocaleString('en-IN')}</span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeItem(idx)}><Trash2 size={14} className="text-destructive" /></Button>
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
            <Button onClick={save} disabled={loading}>{editingQuotation ? 'Update Quotation' : 'Save Quotation'}</Button>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search quotation..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Quotation #</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-8">No quotations found</td></tr>
              ) : (
                filtered.map(q => (
                  <tr key={q.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">{q.quotationNumber}</td>
                    <td className="p-3 text-foreground">{q.customerName}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{new Date(q.date).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-right font-medium text-foreground">₹{q.finalAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setPrintQuotation(q)} title="Print"><Printer size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => shareWhatsApp(q)} title="WhatsApp"><Share2 size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(q)} title="Edit"><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteQuotation(q.id)} title="Delete"><Trash2 size={14} className="text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
