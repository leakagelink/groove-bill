import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Purchase, PurchaseItem, Supplier, Product } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PurchaseMaster() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const loadData = async () => {
    try {
      const [pu, su, pr] = await Promise.all([store.getPurchases(), store.getSuppliers(), store.getProducts()]);
      setPurchases(pu); setSuppliers(su); setProducts(pr);
    } catch (e: any) {
      toast({ title: 'Error loading data', description: e.message, variant: 'destructive' });
    }
  };
  useEffect(() => { loadData(); }, []);

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', category: '', quantity: 1, price: 0, total: 0 }]);
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    const updated = [...items];
    const item = { ...updated[idx], [field]: value };
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) { item.productName = product.name; item.category = product.category; item.price = product.price; }
    }
    item.total = item.quantity * item.price;
    updated[idx] = item;
    setItems(updated);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const editPurchase = (p: Purchase) => {
    setEditId(p.id); setSupplierId(p.supplierId); setDate(p.date); setPaymentMethod(p.paymentMethod || 'cash'); setItems([...p.items]); setShowForm(true);
  };

  const deletePurchase = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return;
    try {
      await store.deletePurchase(id);
      await loadData();
      toast({ title: 'Purchase deleted!' });
    } catch (e: any) {
      toast({ title: 'Error deleting purchase', description: e.message, variant: 'destructive' });
    }
  };

  const save = async () => {
    if (!supplierId || items.length === 0) return;
    setLoading(true);
    try {
      const supplier = suppliers.find(s => s.id === supplierId);
      await store.savePurchase({
        id: editId || undefined,
        supplierId, supplierName: supplier?.name || '', date, items,
        totalAmount: items.reduce((sum, i) => sum + i.total, 0),
      } as Purchase);
      await loadData();
      setShowForm(false); setEditId(null); setSupplierId(''); setItems([]);
      toast({ title: editId ? 'Purchase updated!' : 'Purchase saved!' });
    } catch (e: any) {
      toast({ title: 'Error saving purchase', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = purchases.filter(p => p.supplierName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Purchase Master</h1>
        <Button size="sm" onClick={() => { setShowForm(true); setItems([]); setSupplierId(''); setEditId(null); }}>
          <Plus size={16} className="mr-1" /> Add New
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h3 className="font-semibold text-foreground">{editId ? 'Edit Purchase' : 'New Purchase'}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">Select Supplier *</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Items</h4>
              <Button variant="outline" size="sm" onClick={addItem}><Plus size={14} className="mr-1" /> Add Item</Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm col-span-2 sm:col-span-1" value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}>
                  <option value="">Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <Input type="number" placeholder="Qty" className="h-9" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} />
                <Input type="number" placeholder="Price" className="h-9" value={item.price || ''} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} />
                <div className="text-sm font-medium text-foreground flex items-center h-9">₹{item.total.toLocaleString('en-IN')}</div>
                <Button variant="ghost" size="sm" onClick={() => removeItem(idx)}><Trash2 size={14} className="text-destructive" /></Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <span className="font-semibold text-foreground">Total: ₹{items.reduce((s, i) => s + i.total, 0).toLocaleString('en-IN')}</span>
            <div className="flex gap-3">
              <Button onClick={save} disabled={loading}>{editId ? 'Update' : 'Save'} Purchase</Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by supplier..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        {/* Mobile card view */}
        <div className="divide-y sm:hidden">
          {filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground">No purchases found</p>}
          {filtered.map(p => (
            <div key={p.id} className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground text-sm">{p.supplierName}</span>
                <span className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{p.items.length} items</span>
                <span className="font-medium text-foreground text-sm">₹{p.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex gap-1 pt-1">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => editPurchase(p)}><Edit size={12} className="mr-1" /> Edit</Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => deletePurchase(p.id)}><Trash2 size={12} className="mr-1 text-destructive" /> Delete</Button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Supplier</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Items</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.length === 0 && <tr><td colSpan={5} className="p-4 text-muted-foreground">No purchases found</td></tr>}
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="p-3 text-foreground">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                  <td className="p-3 font-medium text-foreground">{p.supplierName}</td>
                  <td className="p-3 text-right text-muted-foreground">{p.items.length}</td>
                  <td className="p-3 text-right font-medium text-foreground">₹{p.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => editPurchase(p)}><Edit size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deletePurchase(p.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
