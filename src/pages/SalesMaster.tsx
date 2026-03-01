import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Sale, SaleItem, Customer, Product } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search, Printer, Pencil, Check, X } from 'lucide-react';
import BillPrint from '@/components/BillPrint';

export default function SalesMaster() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Edit product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);

  // Customer fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<SaleItem[]>([]);

  // Print state
  const [printSale, setPrintSale] = useState<Sale | null>(null);
  const [printWithPrice, setPrintWithPrice] = useState(true);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [pendingSale, setPendingSale] = useState<Sale | null>(null);

  const loadData = async () => {
    const [s, p] = await Promise.all([store.getSales(), store.getProducts()]);
    setSales(s); setProducts(p);
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

  const startEditProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setEditName(product.name);
      setEditPrice(product.price);
      setEditDiscount(product.discount);
    }
  };

  const saveEditProduct = async () => {
    if (!editingProduct) return;
    const updated: Product = { ...editingProduct, name: editName, price: editPrice, discount: editDiscount };
    await store.saveProduct(updated);
    setProducts(await store.getProducts());
    setItems(items.map(item => {
      if (item.productId === updated.id) {
        const newItem = { ...item, productName: updated.name, price: updated.price, discount: updated.discount };
        const subtotal = newItem.quantity * newItem.price;
        newItem.discountAmount = (subtotal * newItem.discount) / 100;
        newItem.total = subtotal - newItem.discountAmount;
        return newItem;
      }
      return item;
    }));
    setEditingProduct(null);
  };

  const totalAmount = items.reduce((s, i) => s + (i.quantity * i.price), 0);
  const totalDiscount = items.reduce((s, i) => s + i.discountAmount, 0);
  const finalAmount = items.reduce((s, i) => s + i.total, 0);

  const save = async () => {
    if (!customerName.trim() || items.length === 0) return;

    const customerId = await store.saveCustomer({
      name: customerName, phone: customerPhone, address: customerAddress,
    } as Customer);

    const invoiceNumber = await store.getNextInvoiceNumber();
    const sale: Sale = {
      id: crypto.randomUUID(),
      invoiceNumber,
      customerId: customerId,
      customerName, customerPhone, date, items,
      totalAmount, totalDiscount, finalAmount,
    };
    await store.saveSale(sale);
    setSales(await store.getSales());

    setPendingSale(sale);
    setShowPrintDialog(true);
    setShowForm(false);
    setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setItems([]);
  };

  const handlePrint = (withPrice: boolean) => {
    if (pendingSale) {
      setPrintWithPrice(withPrice);
      setPrintSale(pendingSale);
      setShowPrintDialog(false);
      setPendingSale(null);
    }
  };

  const handlePrintFromList = (sale: Sale) => {
    setPendingSale(sale);
    setShowPrintDialog(true);
  };

  const shareWhatsApp = (sale: Sale) => {
    const saleItems = sale.items.map((i, idx) => `${idx + 1}. ${i.productName} x${i.quantity} = ₹${i.total}`).join('\n');
    const message = encodeURIComponent(
      `*Char Bhuja - Invoice ${sale.invoiceNumber}*\n` +
      `Date: ${new Date(sale.date).toLocaleDateString('en-IN')}\n` +
      `Customer: ${sale.customerName}\n\n` +
      `*Items:*\n${saleItems}\n\n` +
      `Total: ₹${sale.totalAmount.toLocaleString('en-IN')}\n` +
      `Discount: ₹${sale.totalDiscount.toLocaleString('en-IN')}\n` +
      `*Final Amount: ₹${sale.finalAmount.toLocaleString('en-IN')}*\n\n` +
      `Thank you for your purchase!`
    );
    const phone = sale.customerPhone ? sale.customerPhone.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  const filtered = sales.filter(s =>
    s.customerName.toLowerCase().includes(search.toLowerCase()) ||
    s.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {showPrintDialog && pendingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
          <div className="bg-card rounded-lg border p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-semibold text-foreground text-lg">Print Invoice</h3>
            <p className="text-sm text-muted-foreground">Invoice {pendingSale.invoiceNumber} saved successfully!</p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => handlePrint(true)}><Printer size={16} className="mr-2" /> Print with Price</Button>
              <Button variant="outline" className="w-full" onClick={() => handlePrint(false)}><Printer size={16} className="mr-2" /> Print without Price</Button>
              <Button variant="outline" className="w-full" onClick={() => shareWhatsApp(pendingSale)}>Share on WhatsApp</Button>
              <Button variant="ghost" className="w-full" onClick={() => { setShowPrintDialog(false); setPendingSale(null); }}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {printSale && <BillPrint sale={printSale} showPrice={printWithPrice} onClose={() => setPrintSale(null)} />}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
          <div className="bg-card rounded-lg border p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-semibold text-foreground text-lg">Edit Product</h3>
            <div className="space-y-3">
              <div><label className="text-sm text-muted-foreground">Product Name</label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div><label className="text-sm text-muted-foreground">Price (₹)</label><Input type="number" value={editPrice || ''} onChange={e => setEditPrice(parseFloat(e.target.value) || 0)} /></div>
              <div><label className="text-sm text-muted-foreground">Discount (%)</label><Input type="number" value={editDiscount || ''} onChange={e => setEditDiscount(parseFloat(e.target.value) || 0)} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveEditProduct}><Check size={14} className="mr-1" /> Save</Button>
              <Button variant="outline" onClick={() => setEditingProduct(null)}><X size={14} className="mr-1" /> Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Sales Master</h1>
        <Button onClick={() => { setShowForm(true); setItems([]); }}><Plus size={16} className="mr-1" /> New Sale</Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h3 className="font-semibold text-foreground">New Sale</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input placeholder="Customer Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            <Input placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            <Input placeholder="Address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Items</h4>
              <Button variant="outline" size="sm" onClick={addItem}><Plus size={14} className="mr-1" /> Add Item</Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-2 sm:grid-cols-8 gap-2 items-end">
                <div className="col-span-2 sm:col-span-2 flex gap-1">
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}>
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.brandName})</option>)}
                  </select>
                  {item.productId && (
                    <Button variant="ghost" size="sm" className="h-9 px-2 shrink-0" onClick={() => startEditProduct(item.productId)} title="Edit Product">
                      <Pencil size={13} className="text-primary" />
                    </Button>
                  )}
                </div>
                <Input type="number" placeholder="Qty" className="h-9" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} />
                <Input type="number" placeholder="Price" className="h-9" value={item.price || ''} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} />
                <Input type="number" placeholder="Disc %" className="h-9" value={item.discount || ''} onChange={e => updateItem(idx, 'discount', parseFloat(e.target.value) || 0)} />
                <div className="text-sm font-medium text-foreground flex items-center h-9">₹{item.total.toLocaleString('en-IN')}</div>
                <Button variant="ghost" size="sm" onClick={() => removeItem(idx)}><Trash2 size={14} className="text-destructive" /></Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Amount</span><span className="text-foreground">₹{totalAmount.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Discount</span><span className="text-destructive">-₹{totalDiscount.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-base font-bold"><span className="text-foreground">Final Amount</span><span className="text-primary">₹{finalAmount.toLocaleString('en-IN')}</span></div>
          </div>

          <div className="flex gap-3">
            <Button onClick={save}>Save & Print</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by customer or invoice..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Invoice</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Discount</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Final</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.length === 0 && <tr><td colSpan={7} className="p-4 text-muted-foreground">No sales found</td></tr>}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="p-3 font-mono text-sm text-primary">{s.invoiceNumber}</td>
                  <td className="p-3 text-foreground">{new Date(s.date).toLocaleDateString('en-IN')}</td>
                  <td className="p-3 font-medium text-foreground">{s.customerName}</td>
                  <td className="p-3 text-right text-muted-foreground">₹{s.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right text-destructive">₹{s.totalDiscount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-medium text-foreground">₹{s.finalAmount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handlePrintFromList(s)}><Printer size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => shareWhatsApp(s)}>WA</Button>
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
