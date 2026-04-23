import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Customer } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

const emptyCustomer: Omit<Customer, 'id'> = {
  name: '', gstin: '', email: '', phone: '', city: '', address: '', openingBalance: 0,
};

export default function Masters() {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<Omit<Customer, 'id'>>(emptyCustomer);
  const [saving, setSaving] = useState(false);

  const loadCustomers = async () => {
    try {
      const data = await store.getCustomers();
      setCustomers(data);
    } catch (e: any) {
      toast({ title: 'Error loading customers', description: e.message, variant: 'destructive' });
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.gstin || '').toLowerCase().includes(q);
  });

  const allSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));
  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      filtered.forEach(c => next.delete(c.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filtered.forEach(c => next.add(c.id));
      setSelectedIds(next);
    }
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyCustomer);
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name, gstin: c.gstin || '', email: c.email || '',
      phone: c.phone || '', city: c.city || '', address: c.address || '',
      openingBalance: c.openingBalance ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Account name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await store.saveCustomer({ ...form, id: editing?.id });
      toast({ title: editing ? 'Customer updated' : 'Customer added' });
      setDialogOpen(false);
      await loadCustomers();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await store.deleteCustomer(id);
      toast({ title: 'Customer deleted' });
      const next = new Set(selectedIds); next.delete(id); setSelectedIds(next);
      await loadCustomers();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected customer(s)?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => store.deleteCustomer(id)));
      toast({ title: `${selectedIds.size} customer(s) deleted` });
      setSelectedIds(new Set());
      await loadCustomers();
    } catch (e: any) {
      toast({ title: 'Bulk delete failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Masters</h1>
          <p className="text-sm text-muted-foreground">Manage account masters</p>
        </div>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers" className="gap-2">
            <Users size={16} /> Customers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, phone, email, city, GSTIN..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {selectedIds.size > 0 && isAdmin && (
                  <Button variant="destructive" onClick={handleBulkDelete} className="gap-2">
                    <Trash2 size={16} /> Delete ({selectedIds.size})
                  </Button>
                )}
                <Button onClick={openAdd} className="gap-2">
                  <Plus size={16} /> Add New
                </Button>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-3 w-10">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                    </th>
                    <th className="p-3">Account Name</th>
                    <th className="p-3">GSTIN</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">City</th>
                    <th className="p-3 text-right">Op. Bal</th>
                    <th className="p-3 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No customers found</td></tr>
                  )}
                  {filtered.map(c => (
                    <tr key={c.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleOne(c.id)} />
                      </td>
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3">{c.gstin || '-'}</td>
                      <td className="p-3">{c.email || '-'}</td>
                      <td className="p-3">{c.phone || '-'}</td>
                      <td className="p-3">{c.city || '-'}</td>
                      <td className="p-3 text-right">₹{(c.openingBalance ?? 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                            <Edit2 size={14} />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-6 text-sm">No customers found</p>
              )}
              {filtered.map(c => (
                <Card key={c.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <Checkbox className="mt-1" checked={selectedIds.has(c.id)} onCheckedChange={() => toggleOne(c.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                        {c.phone && <div>📱 {c.phone}</div>}
                        {c.email && <div>✉️ {c.email}</div>}
                        {c.city && <div>📍 {c.city}</div>}
                        {c.gstin && <div>GSTIN: {c.gstin}</div>}
                        <div>Op. Bal: ₹{(c.openingBalance ?? 0).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Edit2 size={14} />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label>Account Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Customer name" />
            </div>
            <div className="space-y-1">
              <Label>GSTIN</Label>
              <Input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div className="space-y-1">
              <Label>Mobile</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit number" inputMode="tel" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="space-y-1">
              <Label>City</Label>
              <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" />
            </div>
            <div className="space-y-1">
              <Label>Opening Balance</Label>
              <Input type="number" inputMode="decimal" value={form.openingBalance ?? 0}
                onChange={e => setForm({ ...form, openingBalance: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Add Customer')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
