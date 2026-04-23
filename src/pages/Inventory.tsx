import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Product, ProductGroup, Brand, ProductType } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Search, Edit, PlusCircle, Layers, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const emptyGroup: Omit<ProductGroup, 'id'> = { name: '', description: '' };
const emptyProduct: Omit<Product, 'id'> = {
  name: '', category: '', brandId: '', brandName: '',
  price: 0, discount: 0, groupId: '', groupName: '',
  sellingPrice: 0, purchasePrice: 0, hsnSac: '', taxPercent: 0,
  openingStock: 0, productType: 'goods', unit: 'pcs',
};

export default function Inventory() {
  const { toast } = useToast();
  const [tab, setTab] = useState<'groups' | 'products'>('groups');

  // Groups state
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [groupForm, setGroupForm] = useState(emptyGroup);
  const [groupEditId, setGroupEditId] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>(emptyProduct);
  const [productEditId, setProductEditId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [g, p, b] = await Promise.all([
        store.getProductGroups(),
        store.getProducts(),
        store.getBrands(),
      ]);
      setGroups(g);
      setProducts(p);
      setBrands(b);
    } catch (e: any) {
      toast({ title: 'Error loading data', description: e.message, variant: 'destructive' });
    }
  };

  useEffect(() => { loadData(); }, []);

  // ===== Group operations =====
  const saveGroup = async () => {
    if (!groupForm.name.trim()) return;
    setLoading(true);
    try {
      await store.saveProductGroup({ id: groupEditId || undefined, ...groupForm } as ProductGroup);
      await loadData();
      setGroupForm(emptyGroup);
      setGroupEditId(null);
      setShowGroupForm(false);
      toast({ title: groupEditId ? 'Group updated!' : 'Group added!' });
    } catch (e: any) {
      toast({ title: 'Error saving group', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const removeGroup = async (id: string) => {
    try {
      await store.deleteProductGroup(id);
      await loadData();
      toast({ title: 'Group deleted!' });
    } catch (e: any) {
      toast({ title: 'Error deleting group', description: e.message, variant: 'destructive' });
    }
  };

  const editGroup = (g: ProductGroup) => {
    setGroupForm({ name: g.name, description: g.description });
    setGroupEditId(g.id);
    setShowGroupForm(true);
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.description.toLowerCase().includes(groupSearch.toLowerCase())
  );

  // ===== Product operations =====
  const addNewBrand = async () => {
    if (!newBrandName.trim()) return;
    try {
      const brandId = await store.saveBrand({ name: newBrandName.trim() } as Brand);
      const updated = await store.getBrands();
      setBrands(updated);
      setProductForm({ ...productForm, brandId });
      setNewBrandName('');
      setShowNewBrand(false);
      toast({ title: `Brand "${newBrandName.trim()}" added!` });
    } catch (e: any) {
      toast({ title: 'Error adding brand', description: e.message, variant: 'destructive' });
    }
  };

  const addNewGroupQuick = async () => {
    if (!newGroupName.trim()) return;
    try {
      const gid = await store.saveProductGroup({ name: newGroupName.trim(), description: '' } as ProductGroup);
      const updated = await store.getProductGroups();
      setGroups(updated);
      setProductForm({ ...productForm, groupId: gid });
      setNewGroupName('');
      setShowNewGroup(false);
      toast({ title: `Group "${newGroupName.trim()}" added!` });
    } catch (e: any) {
      toast({ title: 'Error adding group', description: e.message, variant: 'destructive' });
    }
  };

  const saveProduct = async () => {
    if (!productForm.name.trim()) return;
    setLoading(true);
    try {
      const brand = brands.find(b => b.id === productForm.brandId);
      const group = groups.find(g => g.id === productForm.groupId);
      await store.saveProduct({
        id: productEditId || undefined,
        ...productForm,
        brandName: brand?.name || productForm.brandName || '',
        groupName: group?.name || productForm.groupName || '',
        price: productForm.sellingPrice || productForm.price || 0,
      } as Product);
      await loadData();
      setProductForm(emptyProduct);
      setProductEditId(null);
      setShowProductForm(false);
      toast({ title: productEditId ? 'Product updated!' : 'Product added!' });
    } catch (e: any) {
      toast({ title: 'Error saving product', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id: string) => {
    try {
      await store.deleteProduct(id);
      await loadData();
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      toast({ title: 'Product deleted!' });
    } catch (e: any) {
      toast({ title: 'Error deleting product', description: e.message, variant: 'destructive' });
    }
  };

  const removeSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected product(s)?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => store.deleteProduct(id)));
      await loadData();
      setSelectedIds(new Set());
      toast({ title: 'Selected products deleted!' });
    } catch (e: any) {
      toast({ title: 'Error deleting products', description: e.message, variant: 'destructive' });
    }
  };

  const editProduct = (p: Product) => {
    setProductForm({
      name: p.name, category: p.category, brandId: p.brandId, brandName: p.brandName,
      price: p.price, discount: p.discount,
      groupId: p.groupId || '', groupName: p.groupName || '',
      sellingPrice: p.sellingPrice ?? p.price, purchasePrice: p.purchasePrice ?? 0,
      hsnSac: p.hsnSac || '', taxPercent: p.taxPercent ?? 0,
      openingStock: p.openingStock ?? 0,
      productType: p.productType || 'goods', unit: p.unit || 'pcs',
    });
    setProductEditId(p.id);
    setShowProductForm(true);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.groupName || '').toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.hsnSac || '').toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brandName.toLowerCase().includes(productSearch.toLowerCase())
  );

  const allSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const n = new Set(prev);
        filteredProducts.forEach(p => n.delete(p.id));
        return n;
      });
    } else {
      setSelectedIds(prev => {
        const n = new Set(prev);
        filteredProducts.forEach(p => n.add(p.id));
        return n;
      });
    }
  };
  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">Manage product groups and products</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'groups' | 'products')} className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-2">
          <TabsTrigger value="groups" className="gap-2"><Layers size={14} /> Manage Product Group</TabsTrigger>
          <TabsTrigger value="products" className="gap-2"><Package size={14} /> Manage Product</TabsTrigger>
        </TabsList>

        {/* ===== GROUPS TAB ===== */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button size="sm" onClick={() => { setShowGroupForm(true); setGroupEditId(null); setGroupForm(emptyGroup); }}>
              <Plus size={16} className="mr-1" /> Add Group
            </Button>
          </div>

          {showGroupForm && (
            <div className="bg-card rounded-lg border p-4 sm:p-5 space-y-4">
              <h3 className="font-semibold text-foreground">{groupEditId ? 'Edit Group' : 'Add Product Group'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Group Name *" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} />
                <Input placeholder="Description (optional)" value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <Button onClick={saveGroup} disabled={loading}>{groupEditId ? 'Update' : 'Save'}</Button>
                <Button variant="outline" onClick={() => { setShowGroupForm(false); setGroupEditId(null); setGroupForm(emptyGroup); }}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-lg border">
            <div className="p-3 sm:p-4 border-b">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search groups..." value={groupSearch} onChange={e => setGroupSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Group Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Products</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filteredGroups.length === 0 && <tr><td colSpan={4} className="p-4 text-muted-foreground">No groups found</td></tr>}
                  {filteredGroups.map(g => {
                    const count = products.filter(p => p.groupId === g.id).length;
                    return (
                      <tr key={g.id} className="hover:bg-muted/30">
                        <td className="p-3 font-medium text-foreground">{g.name}</td>
                        <td className="p-3 text-muted-foreground">{g.description}</td>
                        <td className="p-3 text-right text-foreground">{count}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => editGroup(g)}><Edit size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => removeGroup(g.id)}><Trash2 size={14} className="text-destructive" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ===== PRODUCTS TAB ===== */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button size="sm" variant="destructive" onClick={removeSelected}>
                  <Trash2 size={14} className="mr-1" /> Delete Selected ({selectedIds.size})
                </Button>
              )}
            </div>
            <Button size="sm" onClick={() => { setShowProductForm(true); setProductEditId(null); setProductForm(emptyProduct); }}>
              <Plus size={16} className="mr-1" /> Add Product
            </Button>
          </div>

          {showProductForm && (
            <div className="bg-card rounded-lg border p-4 sm:p-5 space-y-4">
              <h3 className="font-semibold text-foreground">{productEditId ? 'Edit Product' : 'Add New Product'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Input placeholder="Product Name *" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />

                {/* Product Group */}
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={productForm.groupId}
                      onChange={e => setProductForm({ ...productForm, groupId: e.target.value })}
                    >
                      <option value="">Select Product Group</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setShowNewGroup(!showNewGroup)} title="Add New Group">
                      <PlusCircle size={16} />
                    </Button>
                  </div>
                  {showNewGroup && (
                    <div className="flex gap-2">
                      <Input placeholder="New group name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNewGroupQuick()} />
                      <Button type="button" size="sm" onClick={addNewGroupQuick}>Add</Button>
                    </div>
                  )}
                </div>

                {/* Brand */}
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={productForm.brandId}
                      onChange={e => setProductForm({ ...productForm, brandId: e.target.value })}
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
                    </div>
                  )}
                </div>

                {/* Type */}
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={productForm.productType}
                  onChange={e => setProductForm({ ...productForm, productType: e.target.value as ProductType })}
                >
                  <option value="goods">Type: Goods</option>
                  <option value="service">Type: Service</option>
                </select>

                <Input placeholder="HSN / SAC Code" value={productForm.hsnSac} onChange={e => setProductForm({ ...productForm, hsnSac: e.target.value })} />
                <Input placeholder="Unit (pcs, kg, ltr...)" value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })} />

                <Input type="number" placeholder="Selling Price *" value={productForm.sellingPrice || ''} onChange={e => setProductForm({ ...productForm, sellingPrice: parseFloat(e.target.value) || 0 })} />
                <Input type="number" placeholder="Purchase Price" value={productForm.purchasePrice || ''} onChange={e => setProductForm({ ...productForm, purchasePrice: parseFloat(e.target.value) || 0 })} />
                <Input type="number" placeholder="Tax %" value={productForm.taxPercent || ''} onChange={e => setProductForm({ ...productForm, taxPercent: parseFloat(e.target.value) || 0 })} />

                <Input type="number" placeholder="Opening Stock" value={productForm.openingStock || ''} onChange={e => setProductForm({ ...productForm, openingStock: parseFloat(e.target.value) || 0 })} />
                <Input type="number" placeholder="Discount %" value={productForm.discount || ''} onChange={e => setProductForm({ ...productForm, discount: parseFloat(e.target.value) || 0 })} />
                <Input placeholder="Category (optional)" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <Button onClick={saveProduct} disabled={loading}>{productEditId ? 'Update' : 'Save'}</Button>
                <Button variant="outline" onClick={() => { setShowProductForm(false); setProductEditId(null); setProductForm(emptyProduct); }}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-lg border">
            <div className="p-3 sm:p-4 border-b">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name, group, brand, HSN..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Group</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">HSN/SAC</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Tax %</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Purchase</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Selling</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Stock</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filteredProducts.length === 0 && <tr><td colSpan={10} className="p-4 text-muted-foreground">No products found</td></tr>}
                  {filteredProducts.map(p => (
                    <tr key={p.id} className={`hover:bg-muted/30 ${selectedIds.has(p.id) ? 'bg-muted/40' : ''}`}>
                      <td className="p-3">
                        <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleOne(p.id)} aria-label={`Select ${p.name}`} />
                      </td>
                      <td className="p-3 font-medium text-foreground">{p.name}</td>
                      <td className="p-3 text-muted-foreground">{p.groupName || '-'}</td>
                      <td className="p-3 text-muted-foreground capitalize">{p.productType || 'goods'}</td>
                      <td className="p-3 text-muted-foreground">{p.hsnSac || '-'}</td>
                      <td className="p-3 text-right text-muted-foreground">{p.taxPercent || 0}%</td>
                      <td className="p-3 text-right text-muted-foreground">₹{(p.purchasePrice || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-foreground">₹{(p.sellingPrice || p.price || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-muted-foreground">{p.openingStock || 0} {p.unit || ''}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => editProduct(p)}><Edit size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => removeProduct(p.id)}><Trash2 size={14} className="text-destructive" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
