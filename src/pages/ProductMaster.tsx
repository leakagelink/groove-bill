import { useState } from 'react';
import { store } from '@/lib/store';
import { Product } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search, Edit } from 'lucide-react';

const empty: Omit<Product, 'id'> = { name: '', category: '', brandId: '', brandName: '', price: 0, discount: 0 };

export default function ProductMaster() {
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const brands = store.getBrands();

  const save = () => {
    if (!form.name.trim()) return;
    const brand = brands.find(b => b.id === form.brandId);
    const product: Product = {
      id: editId || crypto.randomUUID(),
      ...form,
      brandName: brand?.name || form.brandName,
    };
    store.saveProduct(product);
    setProducts(store.getProducts());
    setForm(empty);
    setEditId(null);
    setShowForm(false);
  };

  const remove = (id: string) => {
    store.deleteProduct(id);
    setProducts(store.getProducts());
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
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.brandId}
              onChange={e => setForm({ ...form, brandId: e.target.value })}
            >
              <option value="">Select Brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
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
