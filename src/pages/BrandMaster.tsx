import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Brand } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search } from 'lucide-react';

export default function BrandMaster() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const loadBrands = async () => setBrands(await store.getBrands());
  useEffect(() => { loadBrands(); }, []);

  const save = async () => {
    if (!name.trim()) return;
    await store.saveBrand({ id: editId || undefined, name: name.trim() } as Brand);
    await loadBrands();
    setName('');
    setEditId(null);
  };

  const remove = async (id: string) => {
    await store.deleteBrand(id);
    await loadBrands();
  };

  const filtered = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Brand Master</h1>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h3 className="font-semibold text-foreground">{editId ? 'Edit Brand' : 'Add New Brand'}</h3>
        <div className="flex gap-3">
          <Input placeholder="Brand name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} />
          <Button onClick={save}><Plus size={16} className="mr-1" />{editId ? 'Update' : 'Add'}</Button>
          {editId && <Button variant="outline" onClick={() => { setEditId(null); setName(''); }}>Cancel</Button>}
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search brands..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="divide-y">
          {filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground">No brands found</p>}
          {filtered.map(b => (
            <div key={b.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-foreground">{b.name}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditId(b.id); setName(b.name); }}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(b.id)}><Trash2 size={14} className="text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
