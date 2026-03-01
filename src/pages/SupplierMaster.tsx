import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Supplier } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search, Edit } from 'lucide-react';

const empty: Omit<Supplier, 'id'> = { name: '', phone: '', email: '', address: '', gstNumber: '' };

export default function SupplierMaster() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadSuppliers = async () => setSuppliers(await store.getSuppliers());
  useEffect(() => { loadSuppliers(); }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    await store.saveSupplier({ id: editId || undefined, ...form } as Supplier);
    await loadSuppliers();
    setForm(empty);
    setEditId(null);
    setShowForm(false);
  };

  const remove = async (id: string) => {
    await store.deleteSupplier(id);
    await loadSuppliers();
  };

  const edit = (s: Supplier) => {
    setForm({ name: s.name, phone: s.phone, email: s.email, address: s.address, gstNumber: s.gstNumber });
    setEditId(s.id);
    setShowForm(true);
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.gstNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Supplier Master</h1>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm(empty); }}>
          <Plus size={16} className="mr-1" /> Add New
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h3 className="font-semibold text-foreground">{editId ? 'Edit Supplier' : 'Add New Supplier'}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Supplier Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="GST Number" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} />
            <Input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="sm:col-span-2" />
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
            <Input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">GST</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.length === 0 && <tr><td colSpan={5} className="p-4 text-muted-foreground">No suppliers found</td></tr>}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="p-3 font-medium text-foreground">{s.name}</td>
                  <td className="p-3 text-muted-foreground">{s.phone}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{s.email}</td>
                  <td className="p-3 text-muted-foreground hidden lg:table-cell">{s.gstNumber}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => edit(s)}><Edit size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(s.id)}><Trash2 size={14} className="text-destructive" /></Button>
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
