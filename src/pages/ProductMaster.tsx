import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Product, Brand } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search, Edit, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const empty: Omit<Product, 'id'> = { name: '', category: '', brandId: '', brandName: '', price: 0, discount: 0 };

export default function ProductMaster() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const { toast } = useToast();

  const loadData = async () => {
    const [p, b] = await Promise.all([store.getProducts(), store.getBrands()]);
    setProducts(p);
    setBrands(b);
  };
  useEffect(() => { loadData(); }, []);

  const addNewBrand = async () => {
    if (!newBrandName.trim()) return;
    const brandId = await store.saveBrand({ name: newBrandName.trim() } as Brand);
    const updatedBrands = await store.getBrands();
    setBrands(updatedBrands);
    setForm({ ...form, brandId: brandId });
    setNewBrandName('');
    setShowNewBrand(false);
    toast({ title: `Brand "${newBrandName.trim()}" added!` });
  };

  const save = async () => {
    if (!form.name.trim()) return;
    const brand = brands.find(b => b.id === form.brandId);
    await store.saveProduct({
      id: editId || undefined,
      ...form,
      brandName: brand?.name || form.brandName,
    } as Product);
    await loadData();
    setForm(empty);
    setEditId(null);
    setShowForm(false);
  };

  const remove = async (id: string) => {
    await store.deleteProduct(id);
    await loadData();
  };

  const edit = (p: Product) => {
    setForm({ name: p.name, category: p.category, brandId: p.brandId, brandName: p.brandName, price: p.price, discount: p.discount });
    setEditId(p.id);
    setShowForm(true);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.brandName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Product Master</h1>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm(empty); }}>
          <Plus size={16} className="mr-1" /> Add New
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h3 className="font-semibold text-foreground">{editId ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Product Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.brandId}
                  onChange={e => setForm({ ...form, brandId: e.target.value })}
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setShowNewBrand(!showNewBrand)} title="Add New Brand">
                  <PlusCircle size={16} />
                </Button>
              </div>
              {showNewBrand && (
                <div className="flex gap-2">
                  <Input placeholder="New brand name" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNewBrand()} />
                  <Button type="button" size="sm" onClick={addNewBrand}>Add</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setShowNewBrand(false); setNewBrandName(''); }}>Cancel</Button>
                </div>
              )}
            </div>
            <Input type="number" placeholder="Price" value={form.price || ''} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            <Input type="number" placeholder="Discount %" value={form.discount || ''} onChange={e => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="flex gap-3">
            <Button onClick={save}>{editId ? 'Update' : 'Save'}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(empty); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Brand</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Price</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Discount</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.length === 0 && <tr><td colSpan={6} className="p-4 text-muted-foreground">No products found</td></tr>}
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="p-3 font-medium text-foreground">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.category}</td>
                  <td className="p-3 text-muted-foreground">{p.brandName}</td>
                  <td className="p-3 text-right text-foreground">₹{p.price.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right text-muted-foreground">{p.discount}%</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => edit(p)}><Edit size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 size={14} className="text-destructive" /></Button>
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
