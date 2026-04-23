import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Customer, Supplier, OtherAccount, OtherAccountType } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit2, Trash2, Users, Truck, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

const emptyCustomer: Omit<Customer, 'id'> = {
  name: '', gstin: '', email: '', phone: '', city: '', address: '', openingBalance: 0,
};
const emptySupplier: Omit<Supplier, 'id'> = {
  name: '', gstNumber: '', email: '', phone: '', city: '', address: '', openingBalance: 0,
};
const emptyOther: Omit<OtherAccount, 'id'> = {
  name: '', groupName: '', accountType: 'asset', openingBalance: 0,
};

const ACCOUNT_TYPES: { value: OtherAccountType; label: string }[] = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

export default function Masters() {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  // Customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custSearch, setCustSearch] = useState('');
  const [custSelected, setCustSelected] = useState<Set<string>>(new Set());
  const [custDialog, setCustDialog] = useState(false);
  const [custEditing, setCustEditing] = useState<Customer | null>(null);
  const [custForm, setCustForm] = useState<Omit<Customer, 'id'>>(emptyCustomer);

  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supSearch, setSupSearch] = useState('');
  const [supSelected, setSupSelected] = useState<Set<string>>(new Set());
  const [supDialog, setSupDialog] = useState(false);
  const [supEditing, setSupEditing] = useState<Supplier | null>(null);
  const [supForm, setSupForm] = useState<Omit<Supplier, 'id'>>(emptySupplier);

  // Other Accounts
  const [others, setOthers] = useState<OtherAccount[]>([]);
  const [othSearch, setOthSearch] = useState('');
  const [othSelected, setOthSelected] = useState<Set<string>>(new Set());
  const [othDialog, setOthDialog] = useState(false);
  const [othEditing, setOthEditing] = useState<OtherAccount | null>(null);
  const [othForm, setOthForm] = useState<Omit<OtherAccount, 'id'>>(emptyOther);

  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    try {
      const [c, s, o] = await Promise.all([
        store.getCustomers(), store.getSuppliers(), store.getOtherAccounts(),
      ]);
      setCustomers(c); setSuppliers(s); setOthers(o);
    } catch (e: any) {
      toast({ title: 'Error loading data', description: e.message, variant: 'destructive' });
    }
  };
  useEffect(() => { loadAll(); }, []);

  // ===== Generic helpers =====
  const toggleSetItem = (set: Set<string>, id: string) => {
    const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); return n;
  };
  const toggleAllInList = (selected: Set<string>, list: { id: string }[]) => {
    const all = list.length > 0 && list.every(x => selected.has(x.id));
    const n = new Set(selected);
    if (all) list.forEach(x => n.delete(x.id));
    else list.forEach(x => n.add(x.id));
    return n;
  };

  // ===== Customers =====
  const custFiltered = customers.filter(c => {
    const q = custSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) || (c.gstin || '').toLowerCase().includes(q);
  });
  const custAllSel = custFiltered.length > 0 && custFiltered.every(c => custSelected.has(c.id));
  const openCustAdd = () => { setCustEditing(null); setCustForm(emptyCustomer); setCustDialog(true); };
  const openCustEdit = (c: Customer) => {
    setCustEditing(c);
    setCustForm({
      name: c.name, gstin: c.gstin || '', email: c.email || '', phone: c.phone || '',
      city: c.city || '', address: c.address || '', openingBalance: c.openingBalance ?? 0,
    });
    setCustDialog(true);
  };
  const saveCust = async () => {
    if (!custForm.name.trim()) return toast({ title: 'Account name is required', variant: 'destructive' });
    setSaving(true);
    try {
      await store.saveCustomer({ ...custForm, id: custEditing?.id });
      toast({ title: custEditing ? 'Customer updated' : 'Customer added' });
      setCustDialog(false); await loadAll();
    } catch (e: any) { toast({ title: 'Save failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const deleteCust = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try { await store.deleteCustomer(id); toast({ title: 'Customer deleted' }); await loadAll(); }
    catch (e: any) { toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }); }
  };
  const bulkDeleteCust = async () => {
    if (!confirm(`Delete ${custSelected.size} customer(s)?`)) return;
    try {
      await Promise.all(Array.from(custSelected).map(id => store.deleteCustomer(id)));
      toast({ title: `${custSelected.size} deleted` });
      setCustSelected(new Set()); await loadAll();
    } catch (e: any) { toast({ title: 'Bulk delete failed', description: e.message, variant: 'destructive' }); }
  };

  // ===== Suppliers =====
  const supFiltered = suppliers.filter(s => {
    const q = supSearch.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) ||
      (s.phone || '').includes(q) || (s.email || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) || (s.gstNumber || '').toLowerCase().includes(q);
  });
  const supAllSel = supFiltered.length > 0 && supFiltered.every(s => supSelected.has(s.id));
  const openSupAdd = () => { setSupEditing(null); setSupForm(emptySupplier); setSupDialog(true); };
  const openSupEdit = (s: Supplier) => {
    setSupEditing(s);
    setSupForm({
      name: s.name, gstNumber: s.gstNumber || '', email: s.email || '', phone: s.phone || '',
      city: s.city || '', address: s.address || '', openingBalance: s.openingBalance ?? 0,
    });
    setSupDialog(true);
  };
  const saveSup = async () => {
    if (!supForm.name.trim()) return toast({ title: 'Account name is required', variant: 'destructive' });
    setSaving(true);
    try {
      await store.saveSupplier({ ...supForm, id: supEditing?.id });
      toast({ title: supEditing ? 'Supplier updated' : 'Supplier added' });
      setSupDialog(false); await loadAll();
    } catch (e: any) { toast({ title: 'Save failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const deleteSup = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    try { await store.deleteSupplier(id); toast({ title: 'Supplier deleted' }); await loadAll(); }
    catch (e: any) { toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }); }
  };
  const bulkDeleteSup = async () => {
    if (!confirm(`Delete ${supSelected.size} supplier(s)?`)) return;
    try {
      await Promise.all(Array.from(supSelected).map(id => store.deleteSupplier(id)));
      toast({ title: `${supSelected.size} deleted` });
      setSupSelected(new Set()); await loadAll();
    } catch (e: any) { toast({ title: 'Bulk delete failed', description: e.message, variant: 'destructive' }); }
  };

  // ===== Other Accounts =====
  const othFiltered = others.filter(o => {
    const q = othSearch.toLowerCase();
    return !q || o.name.toLowerCase().includes(q) ||
      (o.groupName || '').toLowerCase().includes(q) || o.accountType.includes(q);
  });
  const othAllSel = othFiltered.length > 0 && othFiltered.every(o => othSelected.has(o.id));
  const openOthAdd = () => { setOthEditing(null); setOthForm(emptyOther); setOthDialog(true); };
  const openOthEdit = (o: OtherAccount) => {
    setOthEditing(o);
    setOthForm({ name: o.name, groupName: o.groupName, accountType: o.accountType, openingBalance: o.openingBalance });
    setOthDialog(true);
  };
  const saveOth = async () => {
    if (!othForm.name.trim()) return toast({ title: 'Account name is required', variant: 'destructive' });
    setSaving(true);
    try {
      await store.saveOtherAccount({ ...othForm, id: othEditing?.id });
      toast({ title: othEditing ? 'Account updated' : 'Account added' });
      setOthDialog(false); await loadAll();
    } catch (e: any) { toast({ title: 'Save failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const deleteOth = async (id: string) => {
    if (!confirm('Delete this account?')) return;
    try { await store.deleteOtherAccount(id); toast({ title: 'Account deleted' }); await loadAll(); }
    catch (e: any) { toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }); }
  };
  const bulkDeleteOth = async () => {
    if (!confirm(`Delete ${othSelected.size} account(s)?`)) return;
    try {
      await Promise.all(Array.from(othSelected).map(id => store.deleteOtherAccount(id)));
      toast({ title: `${othSelected.size} deleted` });
      setOthSelected(new Set()); await loadAll();
    } catch (e: any) { toast({ title: 'Bulk delete failed', description: e.message, variant: 'destructive' }); }
  };

  // ===== Reusable contact-list block (Customers + Suppliers) =====
  const renderContactTable = (
    items: (Customer | Supplier)[],
    selected: Set<string>,
    setSelected: (s: Set<string>) => void,
    allSel: boolean,
    onEdit: (x: any) => void,
    onDelete: (id: string) => void,
    gstField: 'gstin' | 'gstNumber',
  ) => (
    <>
      <div className="hidden md:block overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3 w-10">
                <Checkbox checked={allSel} onCheckedChange={() => setSelected(toggleAllInList(selected, items))} />
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
            {items.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No records found</td></tr>
            )}
            {items.map((x: any) => (
              <tr key={x.id} className="border-t hover:bg-muted/30">
                <td className="p-3">
                  <Checkbox checked={selected.has(x.id)} onCheckedChange={() => setSelected(toggleSetItem(selected, x.id))} />
                </td>
                <td className="p-3 font-medium">{x.name}</td>
                <td className="p-3">{x[gstField] || '-'}</td>
                <td className="p-3">{x.email || '-'}</td>
                <td className="p-3">{x.phone || '-'}</td>
                <td className="p-3">{x.city || '-'}</td>
                <td className="p-3 text-right">₹{(x.openingBalance ?? 0).toLocaleString('en-IN')}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(x)}><Edit2 size={14} /></Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(x.id)}>
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
      <div className="md:hidden space-y-2">
        {items.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">No records found</p>}
        {items.map((x: any) => (
          <Card key={x.id} className="p-3">
            <div className="flex items-start gap-2">
              <Checkbox className="mt-1" checked={selected.has(x.id)} onCheckedChange={() => setSelected(toggleSetItem(selected, x.id))} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{x.name}</div>
                <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                  {x.phone && <div>📱 {x.phone}</div>}
                  {x.email && <div>✉️ {x.email}</div>}
                  {x.city && <div>📍 {x.city}</div>}
                  {x[gstField] && <div>GSTIN: {x[gstField]}</div>}
                  <div>Op. Bal: ₹{(x.openingBalance ?? 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(x)}><Edit2 size={14} /></Button>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(x.id)}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const contactFormFields = (form: any, setForm: (f: any) => void, gstField: 'gstin' | 'gstNumber') => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2 space-y-1">
        <Label>Account Name *</Label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Account name" />
      </div>
      <div className="space-y-1">
        <Label>GSTIN</Label>
        <Input value={form[gstField] || ''} onChange={e => setForm({ ...form, [gstField]: e.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" />
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
        <Input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" />
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
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Masters</h1>
        <p className="text-sm text-muted-foreground">Manage account masters</p>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers" className="gap-2"><Users size={16} /> Customers</TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2"><Truck size={16} /> Suppliers</TabsTrigger>
          <TabsTrigger value="others" className="gap-2"><Wallet size={16} /> Other Accounts</TabsTrigger>
        </TabsList>

        {/* CUSTOMERS */}
        <TabsContent value="customers" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." value={custSearch} onChange={e => setCustSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                {custSelected.size > 0 && isAdmin && (
                  <Button variant="destructive" onClick={bulkDeleteCust} className="gap-2">
                    <Trash2 size={16} /> Delete ({custSelected.size})
                  </Button>
                )}
                <Button onClick={openCustAdd} className="gap-2"><Plus size={16} /> Add New</Button>
              </div>
            </div>
            {renderContactTable(custFiltered, custSelected, setCustSelected, custAllSel, openCustEdit, deleteCust, 'gstin')}
          </Card>
        </TabsContent>

        {/* SUPPLIERS */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." value={supSearch} onChange={e => setSupSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                {supSelected.size > 0 && isAdmin && (
                  <Button variant="destructive" onClick={bulkDeleteSup} className="gap-2">
                    <Trash2 size={16} /> Delete ({supSelected.size})
                  </Button>
                )}
                <Button onClick={openSupAdd} className="gap-2"><Plus size={16} /> Add New</Button>
              </div>
            </div>
            {renderContactTable(supFiltered, supSelected, setSupSelected, supAllSel, openSupEdit, deleteSup, 'gstNumber')}
          </Card>
        </TabsContent>

        {/* OTHER ACCOUNTS */}
        <TabsContent value="others" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name, group, type..." value={othSearch} onChange={e => setOthSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                {othSelected.size > 0 && isAdmin && (
                  <Button variant="destructive" onClick={bulkDeleteOth} className="gap-2">
                    <Trash2 size={16} /> Delete ({othSelected.size})
                  </Button>
                )}
                <Button onClick={openOthAdd} className="gap-2"><Plus size={16} /> Add New</Button>
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-3 w-10">
                      <Checkbox checked={othAllSel} onCheckedChange={() => setOthSelected(toggleAllInList(othSelected, othFiltered))} />
                    </th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Group</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Op. Balance</th>
                    <th className="p-3 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {othFiltered.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No accounts found</td></tr>
                  )}
                  {othFiltered.map(o => (
                    <tr key={o.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <Checkbox checked={othSelected.has(o.id)} onCheckedChange={() => setOthSelected(toggleSetItem(othSelected, o.id))} />
                      </td>
                      <td className="p-3 font-medium">{o.name}</td>
                      <td className="p-3">{o.groupName || '-'}</td>
                      <td className="p-3 capitalize">{o.accountType}</td>
                      <td className="p-3 text-right">₹{o.openingBalance.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openOthEdit(o)}><Edit2 size={14} /></Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => deleteOth(o.id)}>
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

            <div className="md:hidden space-y-2">
              {othFiltered.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">No accounts found</p>}
              {othFiltered.map(o => (
                <Card key={o.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <Checkbox className="mt-1" checked={othSelected.has(o.id)} onCheckedChange={() => setOthSelected(toggleSetItem(othSelected, o.id))} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{o.name}</div>
                      <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                        {o.groupName && <div>Group: {o.groupName}</div>}
                        <div className="capitalize">Type: {o.accountType}</div>
                        <div>Op. Bal: ₹{o.openingBalance.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openOthEdit(o)}><Edit2 size={14} /></Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => deleteOth(o.id)}>
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

      {/* Customer dialog */}
      <Dialog open={custDialog} onOpenChange={setCustDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{custEditing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle></DialogHeader>
          {contactFormFields(custForm, setCustForm, 'gstin')}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustDialog(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveCust} disabled={saving}>{saving ? 'Saving...' : (custEditing ? 'Update' : 'Add Customer')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier dialog */}
      <Dialog open={supDialog} onOpenChange={setSupDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{supEditing ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle></DialogHeader>
          {contactFormFields(supForm, setSupForm, 'gstNumber')}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupDialog(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveSup} disabled={saving}>{saving ? 'Saving...' : (supEditing ? 'Update' : 'Add Supplier')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Other account dialog */}
      <Dialog open={othDialog} onOpenChange={setOthDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{othEditing ? 'Edit Account' : 'Add New Account'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label>Name *</Label>
              <Input value={othForm.name} onChange={e => setOthForm({ ...othForm, name: e.target.value })} placeholder="Account name" />
            </div>
            <div className="space-y-1">
              <Label>Group</Label>
              <Input value={othForm.groupName} onChange={e => setOthForm({ ...othForm, groupName: e.target.value })} placeholder="e.g. Bank, Cash, Tax" />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={othForm.accountType} onValueChange={(v: OtherAccountType) => setOthForm({ ...othForm, accountType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Opening Balance</Label>
              <Input type="number" inputMode="decimal" value={othForm.openingBalance}
                onChange={e => setOthForm({ ...othForm, openingBalance: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOthDialog(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveOth} disabled={saving}>{saving ? 'Saving...' : (othEditing ? 'Update' : 'Add Account')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
