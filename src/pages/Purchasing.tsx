import { useEffect, useMemo, useState } from 'react';
import { store } from '@/lib/store';
import { Purchase, Supplier, DebitNote, DebitNoteType } from '@/types/billing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Search, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NOTE_TYPE_LABELS: Record<DebitNoteType, string> = {
  purchase_return: 'Purchase Return',
  discount: 'Discount',
  rate_difference: 'Rate Difference',
  other: 'Other',
};

export default function Purchasing() {
  const { toast } = useToast();
  const [tab, setTab] = useState('invoices');

  // Purchase invoices
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pSearch, setPSearch] = useState('');
  const [pSelected, setPSelected] = useState<Set<string>>(new Set());
  const [pShowFilter, setPShowFilter] = useState(false);
  const [pFromDate, setPFromDate] = useState('');
  const [pToDate, setPToDate] = useState('');
  const [pCity, setPCity] = useState('');

  // Debit notes
  const [notes, setNotes] = useState<DebitNote[]>([]);
  const [nSearch, setNSearch] = useState('');
  const [nSelected, setNSelected] = useState<Set<string>>(new Set());
  const [nShowFilter, setNShowFilter] = useState(false);
  const [nFromDate, setNFromDate] = useState('');
  const [nToDate, setNToDate] = useState('');
  const [nCity, setNCity] = useState('');
  const [nType, setNType] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<DebitNote>>({
    noteNumber: '', noteDate: new Date().toISOString().split('T')[0],
    noteType: 'purchase_return', refBillNo: '', accountName: '',
    city: '', state: '', netAmount: 0, notes: '',
  });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [pu, su, dn] = await Promise.all([
        store.getPurchases(), store.getSuppliers(), store.getDebitNotes(),
      ]);
      setPurchases(pu); setSuppliers(su); setNotes(dn);
    } catch (e: any) {
      toast({ title: 'Error loading data', description: e.message, variant: 'destructive' });
    }
  };
  useEffect(() => { loadData(); }, []);

  const supplierMap = useMemo(() => {
    const m = new Map<string, Supplier>();
    suppliers.forEach(s => m.set(s.id, s));
    return m;
  }, [suppliers]);

  const getSupplierCity = (p: Purchase) => supplierMap.get(p.supplierId)?.city || '';
  const getSupplierState = (_p: Purchase) => '';

  // Filter Purchase Invoices
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      if (pSearch && !(`${p.supplierName} ${p.id}`.toLowerCase().includes(pSearch.toLowerCase()))) return false;
      if (pFromDate && p.date < pFromDate) return false;
      if (pToDate && p.date > pToDate) return false;
      if (pCity && !getSupplierCity(p).toLowerCase().includes(pCity.toLowerCase())) return false;
      return true;
    });
  }, [purchases, pSearch, pFromDate, pToDate, pCity, supplierMap]);

  const togglePAll = () => {
    if (pSelected.size === filteredPurchases.length) setPSelected(new Set());
    else setPSelected(new Set(filteredPurchases.map(p => p.id)));
  };
  const togglePOne = (id: string) => {
    const s = new Set(pSelected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setPSelected(s);
  };
  const bulkDeletePurchases = async () => {
    if (pSelected.size === 0) return;
    if (!confirm(`Delete ${pSelected.size} purchase(s)?`)) return;
    try {
      await Promise.all(Array.from(pSelected).map(id => store.deletePurchase(id)));
      setPSelected(new Set());
      await loadData();
      toast({ title: 'Deleted successfully' });
    } catch (e: any) {
      toast({ title: 'Error deleting', description: e.message, variant: 'destructive' });
    }
  };

  // Filter Debit Notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      if (nSearch && !(`${n.noteNumber} ${n.accountName} ${n.refBillNo}`.toLowerCase().includes(nSearch.toLowerCase()))) return false;
      if (nFromDate && n.noteDate < nFromDate) return false;
      if (nToDate && n.noteDate > nToDate) return false;
      if (nCity && !n.city.toLowerCase().includes(nCity.toLowerCase())) return false;
      if (nType && n.noteType !== nType) return false;
      return true;
    });
  }, [notes, nSearch, nFromDate, nToDate, nCity, nType]);

  const toggleNAll = () => {
    if (nSelected.size === filteredNotes.length) setNSelected(new Set());
    else setNSelected(new Set(filteredNotes.map(n => n.id)));
  };
  const toggleNOne = (id: string) => {
    const s = new Set(nSelected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setNSelected(s);
  };
  const bulkDeleteNotes = async () => {
    if (nSelected.size === 0) return;
    if (!confirm(`Delete ${nSelected.size} debit note(s)?`)) return;
    try {
      await Promise.all(Array.from(nSelected).map(id => store.deleteDebitNote(id)));
      setNSelected(new Set());
      await loadData();
      toast({ title: 'Deleted successfully' });
    } catch (e: any) {
      toast({ title: 'Error deleting', description: e.message, variant: 'destructive' });
    }
  };

  const openAddNote = async () => {
    try {
      const num = await store.getNextDebitNoteNumber();
      setForm({
        noteNumber: num, noteDate: new Date().toISOString().split('T')[0],
        noteType: 'purchase_return', refBillNo: '', accountName: '',
        city: '', state: '', netAmount: 0, notes: '',
      });
      setEditId(null); setShowForm(true);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const openEditNote = (n: DebitNote) => {
    setForm({ ...n }); setEditId(n.id); setShowForm(true);
  };

  const handleRefBillChange = (val: string) => {
    const p = purchases.find(pu => pu.id === val);
    if (p) {
      const sup = supplierMap.get(p.supplierId);
      setForm(f => ({
        ...f,
        refBillNo: val,
        accountName: p.supplierName,
        city: sup?.city || '',
        netAmount: p.totalAmount,
      }));
    } else {
      setForm(f => ({ ...f, refBillNo: val }));
    }
  };

  const saveNote = async () => {
    if (!form.noteNumber || !form.accountName) {
      toast({ title: 'Note number and account name are required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await store.saveDebitNote({
        id: editId || undefined,
        noteNumber: form.noteNumber!, noteDate: form.noteDate!,
        noteType: form.noteType as DebitNoteType, refBillNo: form.refBillNo || '',
        accountName: form.accountName!, city: form.city || '', state: form.state || '',
        netAmount: Number(form.netAmount || 0), notes: form.notes || '',
      } as DebitNote);
      await loadData();
      setShowForm(false); setEditId(null);
      toast({ title: editId ? 'Debit note updated!' : 'Debit note saved!' });
    } catch (e: any) {
      toast({ title: 'Error saving', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Delete this debit note?')) return;
    try {
      await store.deleteDebitNote(id);
      await loadData();
      toast({ title: 'Debit note deleted!' });
    } catch (e: any) {
      toast({ title: 'Error deleting', description: e.message, variant: 'destructive' });
    }
  };

  const pSelectedTotal = filteredPurchases
    .filter(p => pSelected.has(p.id))
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const nSelectedTotal = filteredNotes
    .filter(n => nSelected.has(n.id))
    .reduce((sum, n) => sum + n.netAmount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Purchasing</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Purchase Invoice</TabsTrigger>
          <TabsTrigger value="debit">Debit Note</TabsTrigger>
        </TabsList>

        {/* PURCHASE INVOICE TAB */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by supplier or bill no..." value={pSearch} onChange={e => setPSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPShowFilter(!pShowFilter)}>
                  <Filter size={14} className="mr-1" /> Filters
                </Button>
                {pSelected.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={bulkDeletePurchases}>
                    <Trash2 size={14} className="mr-1" /> Delete ({pSelected.size})
                  </Button>
                )}
              </div>
            </div>

            {pShowFilter && (
              <div className="p-4 border-b bg-muted/30 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">From Date</label>
                  <Input type="date" value={pFromDate} onChange={e => setPFromDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To Date</label>
                  <Input type="date" value={pToDate} onChange={e => setPToDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">City</label>
                  <Input placeholder="City" value={pCity} onChange={e => setPCity(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={() => { setPFromDate(''); setPToDate(''); setPCity(''); }}>
                    <X size={14} className="mr-1" /> Clear
                  </Button>
                </div>
              </div>
            )}

            {pSelected.size > 0 && (
              <div className="px-4 py-2 border-b bg-accent/40 text-sm text-foreground">
                {pSelected.size} selected · Total: ₹{pSelectedTotal.toLocaleString('en-IN')}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={filteredPurchases.length > 0 && pSelected.size === filteredPurchases.length}
                        onCheckedChange={togglePAll}
                      />
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Bill No</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Bill Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Account Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">City</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">State</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Net Amount</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPurchases.length === 0 && (
                    <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">No purchases found</td></tr>
                  )}
                  {filteredPurchases.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <Checkbox checked={pSelected.has(p.id)} onCheckedChange={() => togglePOne(p.id)} />
                      </td>
                      <td className="p-3 text-muted-foreground">{idx + 1}</td>
                      <td className="p-3 font-mono text-xs text-foreground">{p.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-3 text-foreground">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 font-medium text-foreground">{p.supplierName}</td>
                      <td className="p-3 text-muted-foreground">{getSupplierCity(p)}</td>
                      <td className="p-3 text-muted-foreground">{getSupplierState(p)}</td>
                      <td className="p-3 text-right font-medium text-foreground">₹{p.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-muted-foreground text-xs">{p.items.length} items</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* DEBIT NOTE TAB */}
        <TabsContent value="debit" className="space-y-4">
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by note no, account, ref bill..." value={nSearch} onChange={e => setNSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setNShowFilter(!nShowFilter)}>
                  <Filter size={14} className="mr-1" /> Filters
                </Button>
                {nSelected.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={bulkDeleteNotes}>
                    <Trash2 size={14} className="mr-1" /> Delete ({nSelected.size})
                  </Button>
                )}
                <Button size="sm" onClick={openAddNote}>
                  <Plus size={14} className="mr-1" /> Add New
                </Button>
              </div>
            </div>

            {nShowFilter && (
              <div className="p-4 border-b bg-muted/30 grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">From Date</label>
                  <Input type="date" value={nFromDate} onChange={e => setNFromDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To Date</label>
                  <Input type="date" value={nToDate} onChange={e => setNToDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">City</label>
                  <Input placeholder="City" value={nCity} onChange={e => setNCity(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Note Type</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={nType} onChange={e => setNType(e.target.value)}>
                    <option value="">All</option>
                    {Object.entries(NOTE_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={() => { setNFromDate(''); setNToDate(''); setNCity(''); setNType(''); }}>
                    <X size={14} className="mr-1" /> Clear
                  </Button>
                </div>
              </div>
            )}

            {nSelected.size > 0 && (
              <div className="px-4 py-2 border-b bg-accent/40 text-sm text-foreground">
                {nSelected.size} selected · Total: ₹{nSelectedTotal.toLocaleString('en-IN')}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={filteredNotes.length > 0 && nSelected.size === filteredNotes.length}
                        onCheckedChange={toggleNAll}
                      />
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Note No</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Note Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Note Type</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Ref Bill No</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Account Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">City</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">State</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Net Amount</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredNotes.length === 0 && (
                    <tr><td colSpan={10} className="p-4 text-center text-muted-foreground">No debit notes found</td></tr>
                  )}
                  {filteredNotes.map(n => (
                    <tr key={n.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <Checkbox checked={nSelected.has(n.id)} onCheckedChange={() => toggleNOne(n.id)} />
                      </td>
                      <td className="p-3 font-medium text-foreground">{n.noteNumber}</td>
                      <td className="p-3 text-foreground">{new Date(n.noteDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-muted-foreground">{NOTE_TYPE_LABELS[n.noteType] || n.noteType}</td>
                      <td className="p-3 text-muted-foreground font-mono text-xs">{n.refBillNo ? n.refBillNo.slice(0, 8).toUpperCase() : '-'}</td>
                      <td className="p-3 text-foreground">{n.accountName}</td>
                      <td className="p-3 text-muted-foreground">{n.city || '-'}</td>
                      <td className="p-3 text-muted-foreground">{n.state || '-'}</td>
                      <td className="p-3 text-right font-medium text-foreground">₹{n.netAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditNote(n)}><Edit size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteNote(n.id)}><Trash2 size={14} className="text-destructive" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Debit Note Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Debit Note' : 'New Debit Note'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Note Number *</label>
              <Input value={form.noteNumber || ''} onChange={e => setForm({ ...form, noteNumber: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Note Date *</label>
              <Input type="date" value={form.noteDate || ''} onChange={e => setForm({ ...form, noteDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Note Type *</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.noteType} onChange={e => setForm({ ...form, noteType: e.target.value as DebitNoteType })}>
                {Object.entries(NOTE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ref Bill No</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.refBillNo} onChange={e => handleRefBillChange(e.target.value)}>
                <option value="">-- None --</option>
                {purchases.map(p => (
                  <option key={p.id} value={p.id}>{p.id.slice(0, 8).toUpperCase()} - {p.supplierName} (₹{p.totalAmount})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Account Name *</label>
              <Input value={form.accountName || ''} onChange={e => setForm({ ...form, accountName: e.target.value })} list="supplier-list" />
              <datalist id="supplier-list">
                {suppliers.map(s => <option key={s.id} value={s.name} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Net Amount *</label>
              <Input type="number" value={form.netAmount || ''} onChange={e => setForm({ ...form, netAmount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">City</label>
              <Input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">State</label>
              <Input value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Notes</label>
              <Input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveNote} disabled={loading}>{editId ? 'Update' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
